const Promise = require('bluebird')
const moment = require('moment')
const _ = require('lodash')
const tmdb = require('./lib/tmdb')
const omdb = require('./lib/omdb')
const imdb = require('./lib/imdb')
const metacritic = require('./lib/metacritic')
const anthropic = require('./lib/anthropic')

const getTmdb = function (tmdbId) {
  return tmdb.getMovie(tmdbId).then(function (show) {
    // For TV shows, we need to fetch external_ids separately if not included
    if (!show.external_ids && !show.imdb_id) {
      // The append_to_response should include external_ids
      return show
    }
    return show
  })
}

const getTmdbDetails = function (movies) {
  return Promise
    .resolve(movies)
    .mapSeries(function (movie) {
      return getTmdb(movie.id)
        .then(function (tmdbShow) {
          return _.assign(movie, {
            tmdb_id: tmdbShow.id,
            imdb_id: tmdbShow.external_ids?.imdb_id || tmdbShow.imdb_id,
            number_of_seasons: tmdbShow.number_of_seasons,
            number_of_episodes: tmdbShow.number_of_episodes,
            top_actors: _.chain(tmdbShow.credits.cast)
              .take(3)
              .map('name')
              .value(),
            creators: _.map(tmdbShow.created_by, 'name'),
            networks: _.map(tmdbShow.networks, 'name'),
            production_companies: _.map(tmdbShow.production_companies, 'name'),
            genres: _.chain(tmdbShow.genres)
              .map('name')
              .map(name => _.snakeCase(name).toLowerCase())
              .value()
          })
        })
    })
}

const getImdbRatings = function (movies) {
  return Promise
    .resolve(movies)
    .map(function (movie) {
      if (movie.imdb_rating && movie.imdb_rating !== 'N/A') {
        return movie
      }

      return Promise
        .resolve(imdb(movie.imdb_id))
        .then(function (ratings) {
          return _.assign(movie, ratings)
        })
    }, {
      concurrency: 1
    })
}

const getOmdbRatings = function (movies) {
  return Promise
    .resolve(movies)
    .mapSeries(function (movie) {
      return omdb(movie.imdb_id)
        .then(function (ratings) {
          return _.defaults(movie, ratings)
        })
    })
}

const normalizeTitle = function (title) {
  return title.replace(/[^\w]/gi, '').toLowerCase()
}

const getMetacriticRatings = async function (movies) {
  const metacriticMovies = await metacritic()

  const mappedMovies = _.chain(metacriticMovies)
    .keyBy(m => normalizeTitle(m.title))
    .mapValues('score')
    .value()

  return movies.map(function (movie) {
    return _.assign(movie, {
      metacritic_score: mappedMovies[normalizeTitle(movie.title)]
    })
  })
}

const evaluateMovies = async function (movies) {
  const system = `
You are a TV critic that is given a list of TV shows with episodes released in the last 4 months. Your goal is to suggest and sort order the most popular TV shows.

You will be given a list of TV shows with the following details:

- Title
- Networks
- Production Companies
- Release Date (first air date)
- Genres
- Number of Seasons
- Number of Episodes
- Metacritic Score (0-100)
- Rotten Tomatoes Score (0-100)
- IMDb Rating (0-10)
- IMDb Vote Count
- TMDB Score (0-10)
- TMDB Vote Count
- Top 3 actors in the show
- Creators

When evaluating the popularity of a TV show, consider:

- The number of votes the show received and the rating of the show. Be sure to consider the number of votes so that one vote does not skew the results.
- The networks and production companies of the show and the quality of the shows they have produced, and how well known the companies are.
- The actors & creators of the show and how well known they are.
- The number of seasons and episodes, as this can indicate viewer retention and network confidence.
- Current cultural relevance and buzz around the show.

A null value means that the data could not be found or isn't publicly available.

Explain your reasoning first, then return the IDs of the most popular TV shows, in sorted order, in a JSON array. Comments in the JSON is invalid JSON.

Include, at most, 5 TV shows.

Your response should look similar to:
\`\`\`json
[
  123,
  456,
  789
]
\`\`\`
`

  const moviesData = movies.map(function (movie) {
    return _.pick(movie, [
      'id',
      'title',
      'networks',
      'production_companies',
      'release_date',
      'genres',
      'number_of_seasons',
      'number_of_episodes',
      'metacritic_score',
      'imdb_rating',
      'imdb_votes',
      'rt_score',
      'vote_average',
      'vote_count',
      'top_actors',
      'creators'
    ])
  })

  const response = await anthropic.prompt(system, JSON.stringify(moviesData))

  const suggestedMovies = _.map(response, id => movies.find(movie => movie.id === id))

  return suggestedMovies
}

const sanatizeForResponse = function (movies) {
  return Promise
    .resolve(movies)
    .map(function (movie) {
      return _.pick(movie, [
        'title',
        'tmdb_id',
        'imdb_id',
        'poster_url',
        'genres'
      ])
    })
}

const filterByMinValue = function (key, value = 0) {
  return function (movies) {
    return _.filter(movies, function (movie) {
      return _.get(movie, key, 0) >= value
    })
  }
}

const filterByMaxValue = function (key, value = 0) {
  return function (movies) {
    return _.filter(movies, function (movie) {
      return _.get(movie, key, 0) <= value
    })
  }
}

const rejectArrayValues = function (key, values) {
  return function (movies) {
    if (_.isNil(values)) {
      return movies
    }

    return _.reject(movies, function (movie) {
      return values.some(value => _.get(movie, key, []).includes(value))
    })
  }
}

const calculateMovieAge = function (movies) {
  return _.map(movies, function (movie) {
    movie.age = moment().diff(movie.release_date, 'days')
    return movie
  })
}

const logger = function (movies) {
  console.table(movies, [
    'id',
    'imdb_id',
    'tmdb_id',
    'title',
    'release_date',
    'age',
    'number_of_seasons',
    'number_of_episodes',
    'metacritic_score',
    'imdb_rating',
    'imdb_votes',
    'rt_score',
    'popularity',
    'vote_average',
    'vote_count',
    'genres',
    'networks',
    'production_companies',
    'top_actors',
    'creators'
  ])
}

module.exports = (function () {
  //
  // Class builder functions to help cache content but be
  // able to filter after the fact with options
  //
  let allMovies = null

  const getMovies = function () {
    if (allMovies) {
      return allMovies
    }

    return Promise
      .resolve(tmdb.getMovies())
      .then(calculateMovieAge)
      .then(filterByMaxValue('age', 120))
      .then(filterByMinValue('age', 0))
      .then(getTmdbDetails)
      .then(getMetacriticRatings)
      .then(getOmdbRatings)
      .then(getImdbRatings)
      .tap(logger)
      .tap(function (movies) {
        allMovies = movies
      })
  }

  const ListBuilder = function () {}

  ListBuilder.prototype.filter = function (opts = {}) {
    return Promise
      .resolve(getMovies())
      .then(filterByMinValue('metacritic_score', opts.min_metacritic_score))
      .then(filterByMinValue('rt_score', opts.min_rt_score))
      .then(filterByMinValue('imdb_rating', opts.min_imdb_rating))
      .then(rejectArrayValues('genres', opts.exclude_genres))
      .then(sanatizeForResponse)
  }

  ListBuilder.prototype.evaluate = function () {
    return Promise
      .resolve(getMovies())
      .then(evaluateMovies)
      .then(sanatizeForResponse)
  }

  ListBuilder.prototype.dump = function () {
    return allMovies
  }

  return ListBuilder
})()

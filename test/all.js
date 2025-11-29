/* eslint-env mocha */
const expect = require('must')
const Index = require('../index')
const imdb = require('../lib/imdb')
const metacritic = require('../lib/metacritic')
const omdb = require('../lib/omdb')
const tmdb = require('../lib/tmdb')

describe('all', function () {
  it('should get a list of TV shows from metacritic', async function () {
    this.timeout(60000)
    const shows = await metacritic()
    expect(shows.length).gt(0)
    expect(shows[0].title).to.be.string()
    expect(shows[0].score).to.be.number()
  })

  // Using "The Last of Us" TV show for testing
  const IMDB_ID = 'tt3581920'
  const TMDB_ID = 100088
  const SHOW_TITLE = 'The Last of Us'

  // Skip IMDB direct scraping test - IMDB blocks scrapers
  // OMDB provides IMDB ratings as a reliable alternative
  it.skip('should get an IMDB rating', async function () {
    this.timeout(30000)
    const results = await imdb(IMDB_ID)
    expect(results.imdb_rating).gt(1)
    expect(results.imdb_votes).gt(1000)
  })

  it('should get an omdb response', async function () {
    const results = await omdb(IMDB_ID)
    expect(results.imdb_rating).gt(1)
    expect(results.imdb_votes).gt(1000)
  })

  it('should get tmdb TV show', async function () {
    const show = await tmdb.searchMovie(SHOW_TITLE)
    expect(show.id).to.equal(TMDB_ID)
    expect(show.popularity).gt(1)
    expect(show.release_date).to.be.string()
  })

  it('should get tmdb id', async function () {
    const show = await tmdb.getMovie(TMDB_ID)
    expect(show.external_ids.imdb_id).to.equal(IMDB_ID)
  })

  it('should get me a list of TV shows', async function () {
    this.timeout(120000)
    const listBuilder = new Index()
    const shows = await listBuilder.filter()

    expect(shows.length).gt(0)
    expect(shows[0]).must.have.keys([
      'title',
      'imdb_id',
      'tmdb_id',
      'tvdb_id',
      'poster_url',
      'genres'
    ])
    expect(shows[0].title).to.be.string()
    expect(shows[0].poster_url).to.be.string()
    expect(shows[0].genres).to.be.array()
  })
})

#!/usr/bin/env node
const Promise = require('bluebird')
const moment = require('moment')
const Index = require('../index')
const json2csv = require('../lib/json2csv')
const fs = Promise.promisifyAll(require('fs'))
const path = require('path')

// Save to root directory for GitHub Pages
const OUTPUT_DIR = path.join(__dirname, '..')

const build = function (listBuilder, filename, opts = {}, evaluate = false) {
  return Promise
    .bind({
      listBuilder,
      filename,
      opts,
      evaluate
    })
    .then(function () {
      if (this.evaluate) {
        return this.listBuilder.evaluate()
      }

      return this.listBuilder.filter(this.opts)
    })
    .then(function (shows) {
      console.log({
        filename: this.filename,
        opts: this.opts,
        evaluate: this.evaluate,
        count: shows.length
      })

      const jsonShows = JSON.stringify(shows, null, 2)
      const outputPath = path.join(OUTPUT_DIR, this.filename)

      return fs.writeFileAsync(outputPath, jsonShows)
    })
}

Promise
  .bind({
    listBuilder: new Index()
  })
  .then(function () {
    return [
      {
        filename: 'tv-shows.json',
        evaluate: true
      },
      {
        filename: `tv-shows-${moment().format('YYYYMMDD')}.json`,
        evaluate: true
      },
      {
        filename: 'all-tv-shows.json'
      },
      {
        filename: 'tv-shows-metacritic-min50.json',
        opts: {
          min_metacritic_score: 50
        }
      },
      {
        filename: 'tv-shows-metacritic-min60.json',
        opts: {
          min_metacritic_score: 60
        }
      },
      {
        filename: 'tv-shows-metacritic-min70.json',
        opts: {
          min_metacritic_score: 70
        }
      },
      {
        filename: 'tv-shows-metacritic-min80.json',
        opts: {
          min_metacritic_score: 80
        }
      },
      {
        filename: 'tv-shows-imdb-min5.json',
        opts: {
          min_imdb_rating: 5
        }
      },
      {
        filename: 'tv-shows-imdb-min6.json',
        opts: {
          min_imdb_rating: 6
        }
      },
      {
        filename: 'tv-shows-imdb-min7.json',
        opts: {
          min_imdb_rating: 7
        }
      },
      {
        filename: 'tv-shows-imdb-min8.json',
        opts: {
          min_imdb_rating: 8
        }
      },
      {
        filename: 'tv-shows-rottentomatoes-min50.json',
        opts: {
          min_rt_score: 50
        }
      },
      {
        filename: 'tv-shows-rottentomatoes-min60.json',
        opts: {
          min_rt_score: 60
        }
      },
      {
        filename: 'tv-shows-rottentomatoes-min70.json',
        opts: {
          min_rt_score: 70
        }
      },
      {
        filename: 'tv-shows-rottentomatoes-min80.json',
        opts: {
          min_rt_score: 80
        }
      }
    ]
  })
  .mapSeries(function (manifest) {
    return build(this.listBuilder, manifest.filename, manifest.opts, manifest.evaluate)
  })
  .then(function () {
    // Create Sonarr-specific format
    return this.listBuilder.evaluate()
      .then(function (shows) {
        const sonarrFormat = shows.map(show => ({
          title: show.title,
          tvdbId: show.tvdb_id,
          imdbId: show.imdb_id
        }))
        const outputPath = path.join(OUTPUT_DIR, 'sonarr.json')
        return fs.writeFileAsync(outputPath, JSON.stringify(sonarrFormat, null, 2))
      })
      .then(() => this.listBuilder)
  })
  .then(function (listBuilder) {
    return listBuilder.dump()
  })
  .then(function (data) {
    return json2csv(data)
  })
  .then(function (csvData) {
    return fs.writeFileAsync(path.join(OUTPUT_DIR, 'dump.csv'), csvData)
  })
  .then(function () {
    console.log('\n✓ All files generated successfully')
    process.exit(0)
  })
  .catch(function (err) {
    console.error(err)
    process.exit(1)
  })

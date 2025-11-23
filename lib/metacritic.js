const cheerio = require('cheerio')
const Promise = require('bluebird')
const request = Promise.promisify(require('request'))
const _ = require('lodash')
const moment = require('moment')

async function metacriticRequest (opts) {
  return await request(_.defaultsDeep(opts, {
    url: 'https://www.metacritic.com/browse/tv/all/all/all-time/new/',
    headers: {
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36'
    },
    qs: {
      releaseYearMin: moment().subtract(12, 'months').year(),
      page: 1
    }
  }))
}

async function getTvShows (page = 1) {
  return Promise
    .resolve()
    .then(function () {
      return metacriticRequest({
        qs: {
          page
        }
      })
    })
    .then(function (resp) {
      if (resp.statusCode !== 200) {
        throw new Error('got an incorrect status code: ' + resp.statusCode)
      }

      const $ = cheerio.load(resp.body)
      return $('.c-finderProductCard').toArray()
    })
    .map(function (show) {
      const $show = cheerio.load(show)

      return {
        title: $show('.c-finderProductCard_title').text().trim(),
        score: _.parseInt($show('.c-siteReviewScore').first().text().trim())
      }
    })
    .then(function (shows) {
      return _.reject(shows, function (show) {
        return show.title.length === 0 || show.score === 'tbd'
      })
    })
}

module.exports = async function () {
  const shows = []
  let page = 1
  let showResults = await getTvShows(page)
  while (showResults.length > 0 && page < 20) {
    shows.push(...showResults)
    page++
    showResults = await getTvShows(page)
  }

  return shows
}

const cheerio = require('cheerio')
const Promise = require('bluebird')
const request = Promise.promisifyAll(require('request'))
const _ = require('lodash')

const parseNumber = function (str) {
  str = str.replace(/,/g, '')
  return _.parseInt(str)
}

module.exports = function (imdbId) {
  if (!imdbId) {
    return
  }

  return Promise
    .resolve()
    .then(function () {
      return request.getAsync({
        url: `https://www.imdb.com/title/${imdbId}/ratings`,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive'
        }
      })
    })
    .then(function (resp) {
      if (resp.statusCode !== 200) {
        console.warn('IMDB got an incorrect status code: ' + resp.statusCode)
        return
      }

      const $ = cheerio.load(resp.body)
      let rating = $('.ratingTable .bigcell').first().text().trim()
      let count = $('.ratingTable .smallcell').first().text().trim()

      // 4/1/23 IMDB is running A/B tests on their ratings page
      if (!rating) {
        const ratingText = $('[data-testid=rating-button__aggregate-rating]')
          .first()
          .text()
          .trim()
          .match(/IMDb Rating(.+)\/10(.+)/i)

        if (!ratingText) {
          return {
            imdb_rating: null,
            imdb_votes: null
          }
        }

        rating = ratingText[1]
        count = ratingText[2]

        count = count.replace(/K$/, '000')
      }

      return {
        imdb_rating: parseNumber(rating),
        imdb_votes: parseNumber(count)
      }
    })
}

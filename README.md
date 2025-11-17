# popular-TV

Popular TV uses LLMs to evaluate the popularity of TV shows with episodes that aired
in the last 4 months. Popular TV considers a multitude of data points
such as ratings, popularity, networks, production companies, actors, creators, and more.

## Usage

When deployed, you can poll the following JSON file for a list of TV shows.

```
https://your-domain.com/tv-shows.json
```

  * This file is regenerated nightly so it is recommended that you
    only poll this file once per day
  * It is recommended that you take a snapshot of this list and not
    remove based on the list no longer displaying a particular TV show
  * Subject to fair use; excessive usage will be rate limited

If you're looking for historical files, you can amend a date to the
main file like so:

```
https://your-domain.com/tv-shows-20191202.json
```

## All TV Shows

There is also a file that includes all TV shows. This file is not filtered or evaluated.

```
https://your-domain.com/all-tv-shows.json
```

There are also several variations of this file that are filtered by different
rating websites.

| File | Description |
| -- | -- |
| tv-shows-metacritic-min50.json | TV shows with a minimum score of 50 on Metacritic |
| tv-shows-metacritic-min60.json | TV shows with a minimum score of 60 on Metacritic |
| tv-shows-metacritic-min70.json | TV shows with a minimum score of 70 on Metacritic |
| tv-shows-metacritic-min80.json | TV shows with a minimum score of 80 on Metacritic |
| tv-shows-imdb-min5.json | TV shows with a minimum score of 5 on IMDB |
| tv-shows-imdb-min6.json | TV shows with a minimum score of 6 on IMDB |
| tv-shows-imdb-min7.json | TV shows with a minimum score of 7 on IMDB |
| tv-shows-imdb-min8.json | TV shows with a minimum score of 8 on IMDB |
| tv-shows-rottentomatoes-min50.json | TV shows with a minimum score of 50 on Rotten Tomatoes |
| tv-shows-rottentomatoes-min60.json | TV shows with a minimum score of 60 on Rotten Tomatoes |
| tv-shows-rottentomatoes-min70.json | TV shows with a minimum score of 70 on Rotten Tomatoes |
| tv-shows-rottentomatoes-min80.json | TV shows with a minimum score of 80 on Rotten Tomatoes |


## Develop

* Make sure you are running Node.js and a local instance of Redis

* If you want to run it locally you can clone this repository and add a
  `.env` file which includes the following lines

    ```
    TMDB_KEY=
    ```

  * https://www.themoviedb.org/documentation/api

* Then run `npm test` and you should see an output of movies showing on
  your console and the grade it's gotten

## License

MIT

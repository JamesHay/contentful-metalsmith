'use strict'

const processor = require('./lib/processor')

/**
 * Plugin function
 *
 * @param {Object|undefined} options
 *
 * @return {Function} Function to be used in metalsmith process
 */
function plugin (options) {
  options = options || {}

  /**
   * Function to process all read files by metalsmith
   *
   * @param  {Object}   files      file map
   * @param  {Object}   metalsmith metalsmith
   * @param  {Function} done       success callback
   */
  return function (files, metalsmith, done) {
    options.metadata = metalsmith.metadata()

    return new Promise(resolve => {
      resolve(Object.keys(files))
    })
    .then(fileNames => {
      return Promise.all(
        fileNames.map(fileName => {
          files[fileName]._fileName = fileName

          return processor.processFile(files[fileName], options)
        })
      )
    })
    .then((fileMaps) => {
      fileMaps.forEach(map => {
        // Remove original files if a parent file name exists
        Object.keys(map)
          .map(k => map[k]._parentFileName)
          .filter(parent => parent)
          .reduce((parents, parent) => parents.add(parent), new Set())
          .forEach(k => delete files[k]);

        Object.assign(files, map)
      })

      done()
    })
    .catch((error) => {
      // friendly error formatting to give
      // more information in error case by api
      // -> see error.details
      done(
        new Error(`
          ${error.message}
          ${error.details ? JSON.stringify(error.details, null, 2) : ''}
        `)
      )
    })
  }
}

module.exports = plugin

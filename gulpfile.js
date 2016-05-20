'use strict'

const gulp = require('gulp')
const $ = require('gulp-load-plugins')()
const less = require('less')
const fs = require('fs')

const DATE_FILE = 'src/data.json'

/**
  * Update page data
  */
let pageData
function updatePageData () {
  delete require.cache[require.resolve(DATE_FILE)]
  pageData = require(DATE_FILE)
}

let inlineStyle
gulp.task('render-inline', done => {
  less.render(fs.readFileSync('src/less/inline.less').toString())
    .then(output => {
      inlineStyle = output.css
      done()
    })
    .catch(err => console.log(err))
})

gulp.task('pages', ['render-inline'], () => {

  return gulp.src('src/pages/**/*.jade')
    .pipe($.jade({
      pretty: true,
      locales: pageData
    }))
    .pipe($.inlineCss({
      extraCss: inlineStyle,
      applyStyleTags: false,
      applyLinkTags: false,
      removeStyleTags: false,
      removeLinkTags: false
    }))
    .pipe(gulp.dest('dist'))
})

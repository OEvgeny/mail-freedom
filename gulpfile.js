'use strict'

const gulp = require('gulp')
const $ = require('gulp-load-plugins')()
const less = require('less')
const fs = require('mz/fs')
const server = require('browser-sync').create()
const reload = () => server.reload({stream: true})
const path = require('path')

const DATA_FILE = './src/data.js'
const INLINE_FILE = 'src/less/inline.less'
const INLINE_PATH = path.resolve(INLINE_FILE)
const INLINE_LINK = './inline.css'
const PAGES_PATH = 'src/pages/**/*.jade'
const JADE_WATCH = 'src/**/*.jade'
const STYLES_PATH = 'src/less/**/*.less'

const production = process.argv.findIndex(arg => arg === '--production') !== -1

const pageData = {
  update () {
    delete require.cache[require.resolve(DATA_FILE)]
    this._data = require(DATA_FILE)
  },
  get data () {
    if (!this._data) this.update()
    return this._data
  }
}

function compileInline () {
  return fs.readFile(INLINE_FILE)
    .then(file => less.render(file.toString(), {filename: INLINE_PATH}))
    .catch(err => console.log(err))
}

function pages (done, inline) {
  gulp.src(PAGES_PATH)
    .pipe($.if(!inline, $.changed('dist')))
    .pipe($.jade({
      pretty: true,
      locals: {
        data: pageData.data,
        styleLink: INLINE_LINK,
        production
      }
    }))
    .pipe($.if(inline != null, $.inlineCss({
      extraCss: inline,
      applyStyleTags: false,
      applyLinkTags: false,
      removeStyleTags: false,
      removeLinkTags: false
    })))
    .pipe(gulp.dest('dist'))
    .on('end', done)
    .pipe(reload())
}

gulp.task('pages', done => {
  if (production) compileInline().then(data => pages(done, data.css))
  else pages(done)
})

gulp.task('inline-to-file', () => compileInline()
  .then(data => $.file(INLINE_LINK, data.css, {src: true})
    .pipe(gulp.dest('dist'))
    .pipe(reload())))

if (production) {
  gulp.task('default', ['pages'])
} else {
  gulp.task('default', ['pages', 'inline-to-file'])
}

gulp.task('serve', ['default'], done => {
  require('connect-static')({dir: 'static'}, (staticErr, middleware) => {
    server.init({
      server: 'dist',
      open: false
    }, function (bsErr, bs) {
      if (staticErr || bsErr) console.log(staticErr, bsErr)
      bs.addMiddleware('*', middleware, {override: true})
    })
  })
})

gulp.task('watch', done => {
  gulp.watch(JADE_WATCH, ['pages'])
  gulp.watch(STYLES_PATH, production ? ['pages'] : ['pages', 'inline-to-file'])
})

gulp.task('dev', ['default', 'watch', 'serve'])

if (production) console.log('Build for production')

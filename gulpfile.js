/* "use strict"; */

var gulp = require("gulp");
var sass = require("gulp-sass");
var plumber = require("gulp-plumber");  // не прерывает работу вотчера елси есть ошибки сборки
var postcss = require("gulp-postcss");  // позволяет подключить автопрефиксер
var autoprefixer = require("autoprefixer");  // раставляем вендорные префиксы
var server = require("browser-sync").create();
var csso = require("gulp-csso");  // минифицируем CSS
var rename = require("gulp-rename"); // используем что бы переименовать файл
var imagemin = require("gulp-imagemin"); // сжимает jpeg png gif svg
var webp = require("gulp-webp"); // png jpg конвертим в webp
var svgstore = require("gulp-svgstore"); // создаем svg спрайт
var posthtml = require("gulp-posthtml");  // позволяет подключить posthtml-include
var include = require("posthtml-include");// вставляем в разметку SVG спрайт с помощью тега include
var del = require("del"); // удаляем папку build перед новой сборкой
var uglify = require("gulp-uglify"); // сжимает JS минифицирует
var pump = require('pump'); //помогает uglify работать без ошибок
var htmlmin = require("gulp-htmlmin"); // сжимает html минифицирует
var pug = require("gulp-pug");

gulp.task("css", function () {
  return gulp.src("source/sass/style.scss")
  .pipe(plumber())
  .pipe(sass())
  .pipe(postcss([
    autoprefixer()
  ]))
  .pipe(gulp.dest("build/css"))
  .pipe(csso())  // минифицируем CSS
  .pipe(rename("style.min.css")) // меняем имя файла на style.min.css в разметке указать его
  .pipe(gulp.dest("build/css"))
  .pipe(server.stream());
});

gulp.task('pug', function buildHTML() {
  return gulp.src('source/pug/**/*.pug')
  .pipe(pug({
    pretty: true // Форматирует для удобочитаймости
  }))
  .pipe(gulp.dest('source'));
});

gulp.task('js', function (cb) {
  pump([
    gulp.src('source/js/*.js'),
    uglify(),
    gulp.dest('build/js')
    ],
    cb
  );
});

gulp.task('minify', function() {
  return gulp.src('build/*.html')
  .pipe(htmlmin({ collapseWhitespace: true }))
  .pipe(gulp.dest('build'));
});

gulp.task("images", function() {  // сжимаем картинки можно делать паралельно !
  return gulp.src("source/img/**/*.{png,jpg,svg}")
  .pipe(imagemin([
    imagemin.optipng({optimizationLevel: 3}),
    imagemin.jpegtran({progressive: true}),
    imagemin.svgo()
  ]))
  .pipe(gulp.dest("source/img"));
});

gulp.task("webp", function() {  // конвертируем изобрежиня в webp формат
  return gulp.src("source/img/**/*.{png,jpg}")
  .pipe(webp({quality: 90}))
  .pipe(gulp.dest("source/img"));
});

gulp.task("sprite", function () { // создаем svg спрайт
  return gulp.src("source/img/icon-*.svg")
  .pipe(svgstore({
    inlineSvg: true
  }))
  .pipe(rename("sprite.svg"))
  .pipe(gulp.dest("build/img"));
});

gulp.task("html", function () {  // вставляем svg спрайт в разметку
  return gulp.src("source/*.html")
  .pipe(posthtml([
    include()
  ]))
  .pipe(gulp.dest("build"));
});

gulp.task("copy", function () {  // копируем все файлы проекта в папку build
  return gulp.src([
    "source/fonts/**/*.{woff,woff2}",
    "source/img/**",
    "source/js/**",
    "source/**/*.html"
  ], {
    base: "source"
  })
  .pipe(gulp.dest("build"));
});

gulp.task("clean", function () {  // удаелеяем папку с содежимым build перед каждой новой сборкой
  return del("build");
});

gulp.task("build", gulp.series(  // собираем проект запуская таски
  "clean",
  "copy",
  "css",
  "pug",
  "sprite",
  "html",
  'minify',
  'js'
));

gulp.task("server", function () {  // отслеживаем изменения в файлах и пересобираем проект
  server.init({
    server: "build/",
  });

  gulp.watch("source/js/main.js", gulp.series("js", "refresh"));
  gulp.watch("source/sass/**/*.{scss,sass}", gulp.series("css"));
  gulp.watch("source/pug/**/*.pug", gulp.series("pug", "refresh"));
  gulp.watch("source/img/icon-*.svg", gulp.series("sprite", "html", "refresh"));
  gulp.watch("source/*.html", gulp.series("html", "refresh"));
});

gulp.task("refresh", function (done){
  server.reload();
  done();
});

gulp.task("start", gulp.series("build", "server"));

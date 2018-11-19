const fs = require('fs')
// 引入 gulp及组件
const gulp = require('gulp')
//静态资源缓存解决
const rev = require('gulp-rev')
//资源文件加时间戳
const revCollector = require('gulp-rev-collector')
//less编译
const less = require('gulp-less')
//压缩JS文件
const uglify = require('gulp-uglify')
const gutil = require('gulp-util')
//合并JS文件
const concat = require('gulp-concat')
//CSS压缩
const postcss = require('gulp-postcss')
const autoprefixer = require('autoprefixer')
const cssnano = require('cssnano')

//文件删除
const clean = require('gulp-clean')
//命令执行序列
const gulpSequence = require('gulp-sequence')
//字符替换
const replace = require('gulp-replace')
//HTML压缩
const htmlmin = require('gulp-htmlmin')
//开启服务器，实时预览
const browserSync = require('browser-sync').create()
// 代理
const proxy = require('http-proxy-middleware')
//自动刷新
const reload = browserSync.reload
//删除控制台日志
const removeLogs = require('gulp-strip-debug')
//ES6编辑
// const babel = require("gulp-babel");
//增加less编译异常提醒
const notify = require('gulp-notify')
//防止错误中断GULP
const plumber = require('gulp-plumber')
//图片压缩
const imageMin = require('gulp-tinypng-plugin')
//像JQ一样操作HTML文档
const cheerio = require('gulp-cheerio')
//获取命令
const argv = require('yargs').argv
//px转rem
const px2rem = require('gulp-px2rem-plugin')
//文字提取
const fontmin = require('fontmin')
//修改名字
const rename = require('gulp-rename')
//图片WEBP转换
//const webp = require('gulp-webp');
//CSS添加webp地址
//const webpcss = require("gulp-webpcss");

// 去除日志
const stripDebug = require('gulp-strip-debug');

// 雪碧图
const spritesmith = require('gulp.spritesmith')

const path = {
  src: 'src/',
  css: 'src/css/',
  js: 'src/js/',
  img: 'src/images/',
  fonts: 'src/fonts',
  source: 'src/source/',
  build: 'build',
  less: 'src/less'
}

// 雪碧图
gulp.task('sprite', function () {
  return gulp.src(['./src/icon/*.png', './src/icon/*.jpg'])//需要合并的图片地址
    .pipe(spritesmith({
      imgName: './images/icon.png',//保存合并后图片的地址
      cssName: './less/icon.less',//保存合并后对于css样式的地址
      padding: 1, //合并时两个图片的间距
      algorithm: 'binary-tree',//注释1
      cssTemplate: './handlebarsStr.tpl',//注释2
      cssVarMap: function (sprite) {
        let name = sprite.name
        if (/_normal|normal/img.test(name)) {
          sprite.name = sprite.name.replace(/_normal|normal/, '')
        } else if (/_hover|hover/img.test(name)) {
          sprite.name = sprite.name.replace(/_hover|hover/, ':hover')
        }
      },
      cssHandlebarsHelpers: {
        timeVersion: function () {
          return new Date().getTime()
        }
      }
    }))
    .pipe(gulp.dest('./src'))
})

//文字提取，单独调用
gulp.task('fonts', () => {
  let text = argv.text

  function getFonts (text) {
    let font = new fontmin()
    font.src(path.source + '*.ttf') // 字体路径
      .use(fontmin.glyph({           // 字型提取插件
        text: text              // 所需文字
      }))
      .use(rename('fonts.ttf'))
      .use(fontmin.ttf2eot())
      .use(fontmin.ttf2woff())
      .use(fontmin.ttf2svg())
      .use(fontmin.css())
      .dest(path.fonts)

    // 执行
    font.run((err, files, stream) => {
      if (err) {
        console.error('字体提取失败，错误信息：' + err)
      } else {
        let css = fs.readFileSync(path.fonts + '/fonts.css', 'utf-8')
        css = css.replace(/url\(("||')/g, 'url("../fonts/')

        fs.writeFile(path.src + '/less/fonts.less', css, {flag: 'w'}, function (err) {
          if (err) {
            console.error(err)
          } else {
            //删除CSS源文件
            gulp.src([path.fonts + '/*.css'], {read: false})
              .pipe(clean())
          }
        })

        //复制Font位置
        gulp.src(['src/fonts/**.ttf',
          'src/fonts/**.eot',
          'src/fonts/**.svg',
          'src/fonts/**.woff'])
          .pipe(gulp.dest('src/assets/fonts'))

        console.log('- 字体提取成功!，字体放在文件放在' + path.fonts + '下，样式放在src/less目录下。')
      }
    })
  }

  if (text && text.length > 0) {
    getFonts(text)
  } else {
    console.log('完整命令：gulp fonts --text=这里输入需要提取的文字')
  }
})

//图片压缩
gulp.task('imgMin', () => {
  return gulp.src(path.img + '*.*')
    .pipe(imageMin({
      key: ['cOt4elp-3gn4b0P1t7RCqokIjk6MBL5z', 'kmtaulr7PAPnfxI4mf-SiLhybxjRtqwL'],
      cache: true
    }))
    .pipe(gulp.dest('dist/assets/images/'))
})

//文件夹清除
gulp.task('clean', () => {
  return gulp.src(['dist/', 'output/'])
    .pipe(clean())
})

//JS合并
gulp.task('jsconcat', () => {
  return gulp.src(['src/js/plugins/*.js', 'src/js/core/*.js'])
  //合并后的文件名
    .pipe(concat('plugins.js'))
    .pipe(gulp.dest('output/'))
})

gulp.task('jsconcat-plugin', () => {
  return gulp.src([
    'src/js/vendor/jquery-2.2.4.js',
    'src/js/vendor/swiper-3.3.1.jquery.min.js',
    'src/js/vendor/rely-*.js',
    'src/js/vendor/plug-*.js',
    'src/js/vendor/*.js'
  ])
  //合并后的文件名
    .pipe(concat('vendor.js'))
    .pipe(gulp.dest('output/'))
})

gulp.task('jsconcat-dev', () => {
  return gulp.src([
    'src/js/plugins/*.js',
    'src/js/core/*.js'
  ])
  //合并后的文件名
    .pipe(uglify({
      ie8: true
    }))
    .pipe(concat('plugins.js'))
    .pipe(gulp.dest('src/assets/js'))
})

gulp.task('jsconcat-plugin-dev', () => {
  return gulp.src([
    'src/js/vendor/jquery-2.2.4.js',
    'src/js/vendor/swiper-3.3.1.jquery.min.js',
    'src/js/vendor/rely-*.js',
    'src/js/vendor/plug-*.js',
    'src/js/vendor/*.js'
  ])
  //合并后的文件名
    .pipe(uglify({
      ie8: true
    }))
    .pipe(concat('vendor.js'))
    .pipe(gulp.dest('src/assets/js'))
})

//JS压缩 移动
gulp.task('jsmin', () => {
  return gulp.src('output/*.js')
    .pipe(removeLogs())
    .on('error', function(err) {
      gutil.log(gutil.colors.red('[Error]'), err.toString());
    })
    .pipe(gulp.dest('output/assets/'))
})

//CSS压缩
let postcssPlugins = [
  autoprefixer({browsers: ['> 1%', 'last 2 versions', 'not ie <= 8']}),
  cssnano()
]
gulp.task('cssmin', () => {
  return gulp.src('output/*.css')
    .pipe(gulp.dest('output/'))
})

gulp.task('cssmin-pages', () => {
  return gulp.src('src/css/pages/*.css')
    .pipe(postcss(postcssPlugins))
    .pipe(gulp.dest('output/pages/'))
})

//CSS合并
gulp.task('cssconcat', () => {
  let val = gulp.src(['src/css/*.css'])
    .pipe(concat('base.css'))
  if (argv['rem']) {
    val.pipe(px2rem({
      'width_design': argv['rem'] === true ? 750 : argv['rem'],
      'valid_num': 2,
      'pieces': 10,
      'ignore_px': [1, 2],
      'ignore_selector': ['@media']
    }))
  }
  return val.pipe(postcss(postcssPlugins)).pipe(gulp.dest('output/'))
})

gulp.task('cssconcat-plugin', () => {
  let val = gulp.src('src/css/plugins/*.css')
    .pipe(concat('plugin.css'))
  if (argv['rem']) {
    val.pipe(px2rem({
      'width_design': argv['rem'] === true ? 750 : argv['rem'],
      'valid_num': 2,
      'pieces': 10,
      'ignore_px': [1, 2],
      'ignore_selector': ['@media']
    }))
  }
  return val.pipe(postcss(postcssPlugins)).pipe(gulp.dest('output/'))
})

gulp.task('cssconcat-dev', () => {
  let val = gulp.src(['src/css/*.css'])
    .pipe(concat('base.css'))
  if (argv['rem']) {
    val.pipe(px2rem({
      'width_design': argv['rem'] === true ? 750 : argv['rem'],
      'valid_num': 2,
      'pieces': 10,
      'ignore_px': [1, 2],
      'ignore_selector': ['@media']
    }))
  }
  return val.pipe(postcss(postcssPlugins)).pipe(gulp.dest('src/assets/css'))
})

gulp.task('cssconcat-dev-plugin', () => {
  let val = gulp.src('src/css/plugins/*.css')
    .pipe(concat('plugin.css'))
  if (argv['rem']) {
    val.pipe(px2rem({
      'width_design': argv['rem'] === true ? 750 : argv['rem'],
      'valid_num': 4,
      'pieces': 10,
      'ignore_px': [1, 2],
      'ignore_selector': ['@media']
    }))
  }
  return val.pipe(postcss(postcssPlugins)).pipe(gulp.dest('src/assets/css'))
})

//CSS添加版本号
gulp.task('cssRev', () => {
  /*if (argv['v']) {
      return gulp.src(['output/!*.css', 'output/!*.js'])
          .pipe(gulp.dest('output/'))
          .pipe(gulp.dest('output/assets'));
  } else {
      return gulp.src(['output/!*.css', 'output/!*.js'])
          .pipe(gulp.dest('output/'))
          .pipe(rev())
          .pipe(gulp.dest('output/assets'))
          .pipe(rev.manifest())
          .pipe(gulp.dest('output/rev'));
  }*/
  return gulp.src(['output/*.css', 'output/*.js'])
    .pipe(gulp.dest('output/'))
    .pipe(gulp.dest('output/assets'))
})

//移动JS 压缩依赖JS
gulp.task('movejs', () => {
  return gulp.src('output/assets/*.js')
    .pipe(uglify({
      ie8: true
    }))
    .pipe(stripDebug())
    .pipe(gulp.dest('dist/assets/js/'))
})

//移动CSS
gulp.task('movecss', () => {
  return gulp.src('output/assets/*.css')
    .pipe(gulp.dest('dist/assets/css/'))
})

//移动页面CSS到开发目录
gulp.task('movecss-src-pages', () => {
  return gulp.src('src/css/pages/*.css')
    .pipe(postcss(postcssPlugins))
    .pipe(gulp.dest('src/assets/css/pages/'))
})
//移动页面CSS到生产目录
gulp.task('movecss-dist-pages', () => {
  return gulp.src('output/pages/*.css')
    .pipe(gulp.dest('dist/assets/css/pages/'))
})

//移动页面CSS到开发目录
gulp.task('movecss-src-extend', () => {
  return gulp.src('src/extend/**/*.*')
    .pipe(gulp.dest('src/assets/extend/'))
})
//移动页面CSS到生产目录
gulp.task('movecss-dist-extend', () => {
  return gulp.src('src/extend/**/*.*')
    .pipe(gulp.dest('dist/assets/extend/'))
})

//移动字体
gulp.task('movefonts', () => {
  return gulp.src('src/fonts/**.*')
    .pipe(gulp.dest('dist/assets/fonts'))
})

//HTML压缩
gulp.task('htmlmin', () => {
  const options = {
    removeComments: false,//清除HTML注释
    collapseWhitespace: false,//压缩HTML
    collapseBooleanAttributes: false,//省略布尔属性的值 <input checked="true"/> ==> <input />
    removeEmptyAttributes: true,//删除所有空格作属性值 <input id="" /> ==> <input />
    removeScriptTypeAttributes: false,//删除<script>的type="text/javascript"
    removeStyleLinkTypeAttributes: false,//删除<style>和<link>的type="text/css"
    minifyJS: true,//压缩页面JS
    minifyCSS: true//压缩页面CSS
  }
  return gulp.src('dist/*.html')
    .pipe(htmlmin(options))
    .pipe(gulp.dest('dist/'))
})

gulp.task('rev', () => {
  return gulp.src(['output/rev/*.json', 'src/*.html'])
    .pipe(revCollector({}))
    .pipe(gulp.dest('dist/'))
})

gulp.task('less', () => {
  return gulp.src(['src/less/main.less', 'src/less/_commons/*.less', 'src/less/_modules/*.less'])
  //错误提示
    .pipe(plumber({errorHandler: notify.onError('Error: <%= error.message %>')}))
    .pipe(less())
    .pipe(gulp.dest('src/css'))
})

gulp.task('less-pages', () => {
  return gulp.src(['src/less/pages/*.less'])
  //错误提示
    .pipe(plumber({errorHandler: notify.onError('Error: <%= error.message %>')}))
    .pipe(less())
    .pipe(gulp.dest('src/css/pages'))
})

gulp.task('dist', () => {
  return gulp.src([
    'src/images/**/*.*'
  ])
    .pipe(gulp.dest('dist/assets/images'))
})

/*gulp.task('distWebp', () => {
    return gulp.src(['src/images/!**!/!*.*'])
        .pipe(webp())
        .pipe(gulp.dest('dist/assets/images'));
});*/

gulp.task('dist-dev', () => {
  return gulp.src('src/images/**/*.*')
    .pipe(gulp.dest('src/assets/images'))
})

gulp.task('dist-js-dev', () => {
  return gulp.src('src/js/page/*.*')
    .pipe(gulp.dest('src/assets/js/page/'))
})

gulp.task('move-page-js', () => {
  return gulp.src('src/js/page/*.*')
    .pipe(removeLogs())
    .pipe(uglify({
      mangle: true,
      compress: true,
      ie8: true
    }))
    .on('error', function(err) {
      gutil.log(gutil.colors.red('[Error]'), err.toString());
    })
    .pipe(stripDebug())
    .pipe(gulp.dest('dist/assets/js/page/'))
})

gulp.task('replace', () => {
  return gulp.src('dist/*.html')
    .pipe(replace('src="images/', 'src="assets/images/'))
    .pipe(gulp.dest('dist/'))
})

gulp.task('replace-sec', () => {
  return gulp.src('dist/*.html')
    .pipe(replace('src="./images/', 'src="assets/images/'))
    .pipe(gulp.dest('dist/'))
})

gulp.task('distres', () => {
  return gulp.src('src/resources/**.*')
    .pipe(gulp.dest('dist/resources'))
})

// 代理
let apiProxy = proxy('/box', {
  target: 'https://cdkey.qaqgame.com',
  changeOrigin: true,
  logLevel: 'debug'
})

gulp.task('connectDev', () => {
  browserSync.init({
    server: 'src',   //服务器根目录
    port: 8000,
    middleware: [apiProxy]
  })
  gulp.watch(['src/images/**/*.*',
    'src/js/**/*.*',
    'src/less/**/*.*',
    'src/resources/**/*.*',
    'src/icon/**/*.*',
    'src/*.html'
  ], ['dev-re', reload])
})

gulp.task('connectDev-less', () => {
  browserSync.init({
    server: 'src',   //服务器根目录
    port: 8000
  })
  gulp.watch(['src/images/**/*.*',
    'src/js/**/*.*',
    'src/less/**/*.*',
    'src/resources/**/*.*',
    'src/icon/**/*.*',
    'src/*.html'
  ], ['dev-re-less', reload])
})

//输出生产环境文件
gulp.task('build', gulpSequence('clean', 'sprite', 'jsconcat', 'jsconcat-plugin', 'jsmin', 'cssconcat', 'cssconcat-plugin', 'cssmin', 'cssmin-pages', 'cssRev', 'movejs', 'movecss', 'movecss-dist-pages', 'movecss-dist-extend', ['dist', 'distres', 'rev'], 'htmlmin', 'replace', 'replace-sec', 'move-page-js', 'movefonts'))

//使用图片压缩
gulp.task('build-min', gulpSequence('clean', 'sprite', ['jsconcat', 'jsconcat-plugin', 'cssconcat', 'cssconcat-plugin', 'imgMin'], ['jsmin', 'cssmin', 'htmlmin', 'cssmin-pages'], 'cssRev', ['movejs', 'movecss', 'movecss-dist-pages', 'movecss-dist-extend', 'move-page-js', 'movefonts'], ['distres', 'rev'], 'replace', 'replace-sec'))

gulp.task('dev-re', function (callback) {
  gulpSequence('sprite', 'less', 'less-pages', 'movecss-src-pages', 'movecss-src-extend', 'jsconcat-dev', 'jsconcat-plugin', 'cssconcat-dev', 'cssconcat-dev-plugin', 'dist-dev', 'dist-js-dev')(callback)
})

gulp.task('dev-re-less', function (callback) {
  gulpSequence('sprite', 'less', 'less-pages', 'movecss-src-pages', 'movecss-src-extend', 'jsconcat-dev', 'jsconcat-plugin', 'cssconcat-dev', 'dist-dev')(callback)
})

gulp.task('default', ['build'])

//开发环境
gulp.task('dev', gulpSequence('connectDev', 'jsconcat-dev', 'jsconcat-plugin-dev', 'cssconcat-dev', 'dist-dev'))
gulp.task('dev-less', gulpSequence('connectDev-less', 'less', 'jsconcat-dev', 'jsconcat-plugin-dev', 'cssconcat-dev', 'dist-dev'))
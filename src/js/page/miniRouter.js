/**
 * Created by ChengZheLin on 2018/11/19.
 * Features: minRouter
 */

;(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(function () {
      return factory(root)
    })
  } else if (typeof exports === 'object') {
    module.exports = factory
  } else {
    root.MiniRouter = factory(root)
  }
})(this, function (root) {

  'use strict'

  if (!Function.prototype.bind) {
    Function.prototype.bind = function () {
      if (typeof this !== 'function') {
        throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable')
      }
      var _this = this
      var obj = arguments[0]
      var ags = Array.prototype.slice.call(arguments, 1)
      return function () {
        _this.apply(obj, ags)
      }
    }
  }

  var MiniRouter = function (opt) {
    // 上一次路由hash
    this.prevRouterHash = null

    this.opt = opt || {}
    this.mount = this.opt.mount
      ? document.getElementById(this.opt.mount.replace(/^#/, ''))
      : document.getElementById('app')

    this.routers = opt.routers || {}

    this.init()
  }

  MiniRouter.prototype = {
    // 初始化
    init: function () {
      this.ready(function () {
        // this.prevRouterHash = this.hashHandle()
        this.router(this.hashHandle())
        this.watchRouterChange()
      }.bind(this))
    },

    // 文档就绪
    ready: function (fn) {
      if (document.readyState !== 'loading') {
        fn()
      } else if (document.addEventListener) {
        document.addEventListener('DOMContentLoaded', fn)
      } else {
        document.attachEvent('onreadystatechange', function () {
          if (document.readyState !== 'loading')
            fn()
        })
      }
    },

    // 参数结构
    queryDeconstruction: function () {
      var str = window.location.href

      if (!(/\?|\&/g.test(str))) {
        return {}
      }

      var arr = str.split("?")[1].split("&");

      var obj = {};

      for (var i in arr) {
        var item = arr[i].split("=")
        obj[item[0]] = item[1];
      }

      return obj
    },

    // 路由改变
    router: function (hash) {
      this.destroy()

      this.beforeEach(this.routers[hash](), this.routers[this.prevRouterHash] && this.routers[this.prevRouterHash]() )
      var currentRouter = this.routers[hash]

      if (typeof currentRouter !== 'function') {
        this.mount.innerHTML = ''
        return false
      }

      currentRouter = currentRouter()

      currentRouter.query = this.queryDeconstruction()

      if (currentRouter.init && !currentRouter.mount) {
        currentRouter.mount = currentRouter.init
      }

      // 进入路由方法
      currentRouter.beforeEnter && currentRouter.beforeEnter(hash, this.prevRouterHash)

      // 挂载方法
      currentRouter.mount && currentRouter.mount()

      // 渲染方法
      currentRouter.render && currentRouter.render(function (renderHtml) {
        this.mount.innerHTML = renderHtml
        this.routers[hash].htmlCache = this.mount.innerHTML
      }.bind(this))

      this.prevRouterHash = this.hashHandle()
    },

    // 监听路由改变
    watchRouterChange: function () {
      if (('onhashchange' in window) && ((typeof document.documentMode === 'undefined') || document.documentMode === 8)) {
        window.onhashchange = function () {
          this.router(this.hashHandle())
        }.bind(this)
      } else {
        setInterval(function () {
          var ischanged = this.isHashChanged()
          if (ischanged) {
            this.router(this.hashHandle())
          }
        }.bind(this), 150)
      }
    },

    // 销毁
    destroy: function () {
      console.log(this.prevRouterHash)
      var prevRouter = this.routers[this.prevRouterHash]
      prevRouter && prevRouter().destroy && prevRouter().destroy()
    },

    // 判断路由是否改变(IE8)
    isHashChanged: function () {
      var hash = this.hashHandle()
      if (hash !== this.prevRouterHash) {
        this.prevRouterHash = hash
        return true
      }
      this.prevRouterHash = hash
    },

    // hash处理
    hashHandle: function () {
      return window.location.hash
    },

    // 全局路由守卫
    beforeEach: function (cb) {
      if (typeof cb === 'function') this.beforeEach = cb
    },

    // 注入
    injection: function (router, method) {
      this.routers[router] = method
    },

    // 进入下一个路由
    next: function (router, data) {

      var queryStr = ''

      for (var i in data) {
        var item = data[i]
        queryStr += '&' + i + '=' + item
      }

      queryStr = queryStr.replace(/^&/, '?')

      window.location.href = router + queryStr
    }
  }

  return MiniRouter
})

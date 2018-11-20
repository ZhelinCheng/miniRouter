# miniRouter


## 使用方法

```
// 实例化时注册路由
var router = new MiniRouter({
  mount: '#app',
  routers: {
    '#/router': function () {
      return {
        mount: function () {
          // 路由挂载时加载
        },

        render: function (render) {
          render('<p>渲染方法，需要将数据传入返回的render才能渲染</p>')
        },

        beforeEnter: function (to, from) {
          // 路由内的守卫
        },

        destroy: function () {
          // 销毁方法
        }
      }
    }
  }
})


// 实例化完成后注册路由
router.injection('#/injection', function () {
  return {
    mount: function () {

    },
    render: function (render) {

    },

    destroy: function () {

    }
  }
})

// 全局的路由守卫
router.beforeEach(function (to, from) {
  console.log(to, from)
})
```

### 实例化参数
- mount：指定挂载DOM的ID
- routers：指定需要挂载的路由对象，value必须是函数，并return一个对象。


### 路由钩子
- mount/init：路由挂载完成过执行
- render：执行渲染
- beforeEnter：路由守卫
- destroy：销毁钩子
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
          // render第一个参数是需要渲染的html，第二个是渲染完成后的回调，也可以使用complete钩子。
          render('<p>渲染方法，需要将数据传入返回的render才能渲染</p>')
        },

        complete: function() {
          // 渲染完成后的钩子，如果render钩子中的render回调使用了回调，该钩子将不生效
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

### 实例方法
```
// 跳转至指定路由
router.next('#/next', {
  data: 1
})
```
- next：跳转至指定路由，第一个参数是路由，第二个参数是query。


### 路由钩子
- mount/init：路由挂载完成过执行
- render：执行渲染
- complete：渲染完成后的钩子，如果在render钩子中使用了回调，该钩子将不生效。
- beforeEnter：路由守卫
- destroy：销毁钩子
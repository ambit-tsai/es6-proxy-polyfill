简体中文 | [English](README.md)


# ES6 Proxy Polyfill&nbsp;&nbsp;![Version](https://img.shields.io/npm/v/es6-proxy-polyfill.svg)

一个 ES6 `Proxy` 的兼容库，支持 **IE6+** 和 Node.js 等。

迄今为止，它支持比 GoogleChrome <a href="https://github.com/GoogleChrome/proxy-polyfill" target="_blank">proxy-polyfill</a> 更多的特性。

该 polyfill 只支持有限的 'trap' 代理：
* get
* set
* apply
* construct

`Proxy.revocable` 方法也被支持，但只限于调用上面的 'trap' 。


#### 安装
1. 使用NPM：`npm install -S es6-proxy-polyfill`
2. 直接下载：<a href="src/es6-proxy-polyfill.js" target="_blank">开发版本</a>，<a href="dist/es6-proxy-polyfill.js" target="_blank">生产版本</a>


#### 用法
1. 浏览器：
```html
<!--[if lte IE 8]>
<script src="path/to/object-defineproperty-ie.js" type="text/javascript"></script>
<![endif]-->
<script src="path/to/es6-proxy-polyfill.js" type="text/javascript"></script>
<script type="text/javascript">
    var proxy = new Proxy({}, {});
</script>
```
2. Node.js：
```javascript
var Proxy = require('es6-proxy-polyfill');

var proxy = new Proxy({}, {});
```


#### 注意
1. 对于**非数组**对象，想要代理的属性**必须在创建时就已存在**；
1. 在 IE8 及以下，`Object.defineProperties` 与 `Object.getOwnPropertyDescriptor` 由 "<a href="https://github.com/ambit-tsai/object-defineproperty-ie" target="_blank">object-defineproperty-ie</a>" 库提供支持；
1. 支持 `UMD`。


#### 测试
1. 使用浏览器访问 `test/browser/index.html`
1. 已在IE6、IE7、IE8中进行测试


#### 联系
1. 微信: ambit_tsai
1. QQ群: 663286147
1. 邮箱: ambit_tsai@qq.com
简体中文 | [English](README.md)


# ES6 Proxy Polyfill&nbsp;&nbsp;![Version](https://img.shields.io/npm/v/es6-proxy-polyfill.svg)

一个基于 **ES3** 的 `Proxy` 构造器 polyfill ，支持 **IE8** 和 Node.js 等。

参照 <a href="https://tc39.github.io/ecma262/#sec-proxy-target-handler" target="_blank">ECMAScript</a> 标准编写，无外部依赖。

由于 ES3 的限制，该 polyfill 只支持有限的 'traps' 代理：
* apply
* construct

`Proxy.revocable` 方法也被支持，但只限于调用上面的 'traps' 。


#### 安装
1. 使用NPM：`npm install -S es6-proxy-polyfill`
2. 直接下载：<a href="src/es6-proxy-polyfill.js" target="_blank">开发版本</a>，<a href="dist/es6-proxy-polyfill.js" target="_blank">生产版本</a>


#### 用法
1. 浏览器：
```
<script src="path/to/es6-proxy-polyfill.js" type="text/javascript"></script>
<script type="text/javascript">
    var target = function(){/* code */};
    var handler = {/* code */};
    var proxy = new Proxy(target, handler);
</script>
```
2. Node.js：
```
require('es6-proxy-polyfill');

var target = function(){/* code */};
var handler = {/* code */};
var proxy = new Proxy(target, handler);
```


#### 注意
1. 在 ES6 中，对 `Proxy` 对象属性的访问将会被传递给目标对象。为了模拟这个特性，polyfill 会尝试使用 `Object.assign` 方法从目标对象复制属性，因此最好先加载一个 `Object.assign` 的 polyfill ；
```
<script src="path/to/babel-polyfill.js" type="text/javascript"></script>
<script src="path/to/es6-proxy-polyfill.js" type="text/javascript"></script>
```
2. 代码已经在 Node.js 0.10.48 和 IE8 测试过，而且它也应该能够运行在其他环境下；
3. 当自身属性被访问时，被撤销的 `Proxy` 对象不会抛出错误。
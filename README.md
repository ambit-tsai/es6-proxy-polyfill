<div align="right">[ <a href="README_zh.md">中文</a> ]</div>

# ES6 Proxy Polyfill
This is a polyfill for the `Proxy` constructor based on  **ES3**  supports  **IE8** , Node.js, etc.

Refer to <a href="https://tc39.github.io/ecma262/#sec-proxy-target-handler" target="_blank">ECMAScript</a>, and this has no external dependencies. 

Due to the limitations of ES3, the polyfill supports just a limited number of proxy 'traps':
* apply
* construct


#### Installation

1. Use NPM: `npm install es6-proxy-polyfill`
2. Download directly: <a href="src/es6-proxy-polyfill.js" target="_blank">Development Version</a>, <a href="dist/es6-proxy-polyfill.js" target="_blank">Production Version</a>


#### Usage

1. Browser:
```
<script src="path/to/es6-proxy-polyfill.js" type="text/javascript"></script>
<script type="text/javascript">
    var target = function(){/* code */};
    var handler = {/* code */};
    var proxy = new Proxy(target, handler);
</script>
```
2. Node.js:
```
require('es6-proxy-polyfill');

var target = function(){/* code */};
var handler = {/* code */};
var proxy = new Proxy(target, handler);
```


#### Notice

1. In ES6, the access to `Proxy` object's properties will be passed to target. In order to simulate this feature, polyfill will try to copy properties from target by using `Object.assign` method, so it's better to load an `Object.assign` polyfill first;
```
<script src="path/to/babel-polyfill.js" type="text/javascript"></script>
<script src="path/to/es6-proxy-polyfill.js" type="text/javascript"></script>
```
2. The code has been tested on Node.js 0.10.48 and IE8, and it may work in other environments too.
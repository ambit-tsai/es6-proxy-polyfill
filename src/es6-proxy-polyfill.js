/**
 * ES6 Proxy Polyfill
 * @version 2.0.0
 * @author Ambit Tsai <ambit_tsai@qq.com>
 * @license Apache-2.0
 * @see {@link https://github.com/ambit-tsai/es6-proxy-polyfill}
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(factory);                // AMD
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();     // CommonJS
    } else {
        root.Proxy = factory();
    }
}(this, function () {
    if (this.Proxy) return this.Proxy;


    // Constant variables
    var UNDEFINED;  // => undefined
    var PROXY_TARGET = '[[ProxyTarget]]';
    var PROXY_HANDLER = '[[ProxyHandler]]';
    var GET = '[[Get]]';
    var SET = '[[Set]]';
    var CALL = '[[Call]]';
    var CONSTRUCT = '[[Construct]]';


    var Object = this.Object;
    var supportES5 = Object.keys ? /\[native code\]/.test(Object.keys.toString()) : false;


    /**
     * The Proxy constructor
     * @constructor
     * @param {object} target
     * @param {object} handler
     */
    function Proxy(target, handler) {
        if (this instanceof Proxy) {
            return createProxy(target, handler).proxy;
        } else {
            throwTypeError("Constructor Proxy requires 'new'");
        }
    }


    /**
     * Create a revocable Proxy object
     * @param {object} target 
     * @param {object} handler 
     * @returns {{proxy: object, revoke: function}}
     */
    Proxy.revocable = function (target, handler) {
        if (this instanceof Proxy.revocable) {
            throwTypeError("Proxy.revocable is not a constructor");
        }
        return createProxy(target, handler);
    };


    /**
     * Create a Proxy object
     * @param {object} target 
     * @param {object} handler 
     * @returns {{proxy: object, revoke: function}}
     */
    function createProxy(target, handler) {
        if (!isObject(target) || !isObject(handler)) {
            throwTypeError('Cannot create proxy with a non-object as target or handler');
        }
        var proxy, internal = new InternalData(target, handler);
        if (typeof target === 'function') {
            proxy = proxyFunction(internal);
        } else if (target instanceof Array) {
            proxy = proxyArray(internal);
        } else {
            proxy = proxyObject(internal);
        }
        return {
            proxy: proxy,
            revoke: function () {
                internal[PROXY_TARGET] = UNDEFINED;
                internal[PROXY_HANDLER] = UNDEFINED;
            }
        };
    }


    /**
     * The object to store internal data 
     * @constructor
     * @param {object} target 
     * @param {object} handler 
     */
    function InternalData(target, handler) {
        this[PROXY_TARGET] = target;
        this[PROXY_HANDLER] = handler;
    }


    /**
     * The implementation of internal method [[Get]]
     * @param {string} property
     * @param {object} receiver
     * @returns {any}
     */
    InternalData.prototype[GET] = function (property, receiver) {
        var handler = this[PROXY_HANDLER];
        validateProxyHanler('get', handler);
        if (handler.get == UNDEFINED) {
            return this[PROXY_TARGET][property];
        }
        if (typeof handler.get === 'function') {
            return handler.get(this[PROXY_TARGET], property, receiver);
        }
        throwTypeError("Trap 'get' is not a function: " + handler.get);
    };


    /**
     * The implementation of internal method [[Set]]
     * @param {string} property
     * @param {any} value
     * @param {object} receiver
     */
    InternalData.prototype[SET] = function (property, value, receiver) {
        var handler = this[PROXY_HANDLER];
        validateProxyHanler('set', handler);
        if (handler.set == UNDEFINED) {
            this[PROXY_TARGET][property] = value;
        } else if (typeof handler.set === 'function') {
            var result = handler.set(this[PROXY_TARGET], property, value, receiver);
            if (!result) {
                throwTypeError("Trap 'set' returned false for property '" + property + "'");
            }
        } else {
            throwTypeError("Trap 'set' is not a function: " + handler.set);
        }
    };


    /**
     * The implementation of internal method [[Call]]
     * @param {object} thisArg
     * @param {any[]} argList
     * @returns {any}
     */
    InternalData.prototype[CALL] = function (thisArg, argList) {
        var handler = this[PROXY_HANDLER];
        validateProxyHanler('apply', handler);
        if (handler.apply == UNDEFINED) {
            return this[PROXY_TARGET].apply(thisArg, argList);
        }
        if (typeof handler.apply === 'function') {
            return handler.apply(this[PROXY_TARGET], thisArg, argList);
        }
        throwTypeError("Trap 'apply' is not a function: " + handler.apply);
    };


    /**
     * The implementation of internal method [[Construct]]
     * @param {any[]} argList
     * @param {object} newTarget
     * @returns {object}
     */
    InternalData.prototype[CONSTRUCT] = function (argList, newTarget) {
        var handler = this[PROXY_HANDLER];
        validateProxyHanler('construct', handler);

        var newObj;
        if (handler.construct == UNDEFINED) {
            newObj = evaluateNew(this[PROXY_TARGET], argList);
        } else if (typeof handler.construct === 'function') {
            newObj = handler.construct(this[PROXY_TARGET], argList, newTarget);
        } else {
            throwTypeError("Trap 'construct' is not a function: " + handler.construct);
        }

        if (isObject(newObj)) {
            return newObj;
        } else {
            throwTypeError("Trap 'construct' returned non-object: " + newObj);
        }
    };


    /**
     * Validate the proxy hanler
     * @param {string} name
     * @param {object} value
     */
    function validateProxyHanler(name, value) {
        if (!value) {
            throwTypeError("Cannot perform '" + name + "' on a proxy that has been revoked");
        }
    }


    /**
     * Call constructor with 'new'
     * @param {function} F constructor
     * @param {any[]} argList
     * @returns {object}
     */
    function evaluateNew(F, argList) {
        var params = [];
        for (var i = 0, len = argList.length; i < len; ++i) {
            params.push('args[' + i + ']');
        }
        var executor = new Function('Ctor', 'args', 'return new Ctor(' + params.join(', ') + ')');
        return executor(F, argList);
    }
    

    /**
     * Throw a type error
     * @param {string} message 
     */
    function throwTypeError(message) {
        throw new TypeError(message);
    }


    /**
     * Check if value is the language type of Object
     * @param {any} value 
     * @returns {boolean}
     */
    function isObject(value) {
        return value 
            ? typeof value === 'object' || typeof value === 'function' 
            : false;
    }


    /**
     * Check if key is an own property of object
     * @param {object} obj 
     * @param {string} key 
     * @returns {boolean}
     */
    function hasOwnProperty(obj, key) {
        return Object.prototype.hasOwnProperty.call(obj, key);
    }


    /**
     * Hack of `Object.getPrototypeOf`
     * @param {object} obj
     * @returns {object}
     */
    var getPrototypeOf = supportES5 ? Object.getPrototypeOf : function (obj) {
        return obj.__proto__;
    };


    /**
     * Hack of `Object.setPrototypeOf`
     * @param {object} obj
     * @param {object} proto
     * @returns {object}
     */
    var setPrototypeOf = Object.setPrototypeOf || function (obj, proto) {
        obj.__proto__ = proto;
        return obj;
    };


    /**
     * Hack of `Object.getOwnPropertyNames`
     * @param {object} obj
     * @returns {string[]}
     */
    var getOwnPropertyNames = supportES5 ? Object.getOwnPropertyNames : function (obj) {
        var names = [];
        for (var key in obj) {
            if (hasOwnProperty(obj, key)) {
                names.push(key);
            } 
        }
        return names;
    };


    /**
     * Hack of `Object.create`
     * @param {object} proto
     * @param {object} props
     * @returns {object}
     */
    var objectCreate = supportES5 ? Object.create : function (proto, props) {
        return Object.defineProperties({}, props);
    };


    /**
     * Proxy function
     * @param {InternalData} internal 
     * @returns {function}
     */
    function proxyFunction(internal) {
        var target = internal[PROXY_TARGET];

        function P() {
            return this instanceof P 
                ? internal[CONSTRUCT](arguments, P)// TODO: P ?
                : internal[CALL](this, arguments);
        }
        P.prototype = target.prototype;
        setPrototypeOf(P, getPrototypeOf(target));

        for (var key in target) {
            if (!hasOwnProperty(target, key)) continue;
            if (supportES5) {
                var desc = observeProperty(internal, property);
                Object.defineProperty(P, property, desc);
            } else {
                P[key] = target[key];
            }
        }
        return P;
    }


    /**
     * Proxy array
     * @param {InternalData} internal 
     * @returns {object} array-like object
     */
    function proxyArray(internal) {
        var P = proxyObject(internal);
        var names = getOwnPropertyNames(Array.prototype);
        var sync = throttle(syncPropertyChange);
        for (var i = names.length - 1; i >= 0; --i) {
            if (hasOwnProperty(P, names[i])) continue;
            (function (property) {
                var desc = Object.getOwnPropertyDescriptor(Array.prototype, property);
                Object.defineProperty(P, property, {
                    get: function () {
                        sync(this, internal);
                        return internal[GET](property, this);
                    },
                    set: function (value) {
                        internal[SET](property, value, this);
                    },
                    enumerable: desc.enumerable,
                    configurable: desc.configurable
                });
            }(names[i]));
        }
        return P;
    }


    /**
     * Proxy object
     * @param {InternalData} internal 
     * @returns {object}
     */
    function proxyObject(internal) {
        var target = internal[PROXY_TARGET];
        var names = getOwnPropertyNames(target);
        var props = {};
        for (var i = names.length - 1; i >= 0; --i) {
            props[ names[i] ] = observeProperty(internal, names[i]);
        }
        return objectCreate(getPrototypeOf(target), props);
    }


    /**
     * Observe property
     * @param {InternalData} internal 
     * @param {string} property 
     * @returns {{get: function, set: function, enumerable: boolean, configurable: boolean}}
     */
    function observeProperty(internal, property) {
        var desc = Object.getOwnPropertyDescriptor(internal[PROXY_TARGET], property);
        return {
            get: function () {
                return internal[GET](property, this);
            },
            set: function (value) {
                internal[SET](property, value, this);
            },
            enumerable: desc.enumerable,
            configurable: desc.configurable
        };
    }


    /**
     * Throttle
     * @param {function} fn
     * @returns {function}
     */
    function throttle(fn) {
        var token = 0;
        return function () {
            if (token) return;
            token = 1;      // 取得令牌
            var ctx = this, args = arguments;
            setTimeout(function () {
                fn.apply(ctx, args);
                token = 0;  // 释放令牌
            });
        };
    }


    /**
     * Sync property change from P to target
     * @param {object} P
     * @param {InternalData} internal 
     */
    function syncPropertyChange(P, internal) {
        var target = internal[PROXY_TARGET];
        for (var key in P) {
            if (!(key in target)) {
                var desc = Object.getOwnPropertyDescriptor(P, key);
                Object.defineProperty(target, key, desc);
                desc = observeProperty(internal, key);
                Object.defineProperty(P, key, desc);
            }
        }
    }

    
    return Proxy;
}));
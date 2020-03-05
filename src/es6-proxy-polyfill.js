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
    var supportES5 = Object.keys && /\[native code\]/.test(Object.keys.toString());


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
     * Create Proxy object
     * @param {object} target 
     * @param {object} handler 
     * @returns {{proxy: object, revoke: function}}
     */
    function createProxy(target, handler) {
        if (!isObject(target) || !isObject(handler)) {
            throwTypeError('Cannot create proxy with a non-object as target or handler');
        }
        var internal = new InternalData(target, handler);
        return {
            proxy: typeof target === 'function' 
                ? proxyFunction(internal) 
                : proxyObject(internal),
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
     * The implementation of [[Get]] internal method
     * @param {string} property
     * @param {object} receiver
     * @returns {any}
     */
    InternalData.prototype[GET] = function (property, receiver) {
        validateProxyHanler('get', this[PROXY_HANDLER]);

        if (this[PROXY_HANDLER].get == UNDEFINED) {
            return this[PROXY_TARGET][property];
        }
        if (typeof this[PROXY_HANDLER].get === 'function') {
            return this[PROXY_HANDLER].get(this[PROXY_TARGET], property, receiver);
        }
        throwTypeError("Trap 'get' is not a function: " + this[PROXY_HANDLER].get);
    };


    /**
     * The implementation of [[Get]] internal method
     * @param {string} property
     * @param {any} value
     * @param {object} receiver
     */
    InternalData.prototype[SET] = function (property, value, receiver) {
        validateProxyHanler('set', this[PROXY_HANDLER]);

        if (this[PROXY_HANDLER].set == UNDEFINED) {
            this[PROXY_TARGET][property] = value;
        } else if (typeof this[PROXY_HANDLER].set === 'function') {
            var result = this[PROXY_HANDLER].set(this[PROXY_TARGET], property, value, receiver);
            if (!result) {
                throwTypeError("Trap 'set' returned false for property '" + property + "'");
            }
        } else {
            throwTypeError("Trap 'set' is not a function: " + this[PROXY_HANDLER].set);
        }
    };


    /**
     * The implementation of [[Call]] internal method
     * @param {object} thisArg
     * @param {any[]} argList
     * @returns {any}
     */
    InternalData.prototype[CALL] = function (thisArg, argList) {
        validateProxyHanler('apply', this[PROXY_HANDLER]);
        
        if (this[PROXY_HANDLER].apply == UNDEFINED) {
            return this[PROXY_TARGET].apply(thisArg, argList);
        }
        if (typeof this[PROXY_HANDLER].apply === 'function') {
            return this[PROXY_HANDLER].apply(this[PROXY_TARGET], thisArg, argList);
        }
        throwTypeError("Trap 'apply' is not a function: " + this[PROXY_HANDLER].apply);
    };


    /**
     * The implementation of [[Construct]] internal method
     * @param {any[]} argList
     * @param {object} newTarget
     * @returns {object}
     */
    InternalData.prototype[CONSTRUCT] = function (argList, newTarget) {
        validateProxyHanler('construct', this[PROXY_HANDLER]);

        var newObj;
        if (this[PROXY_HANDLER].construct == UNDEFINED) {
            newObj = evaluateNew(this[PROXY_TARGET], argList);
        } else if (typeof this[PROXY_HANDLER].construct === 'function') {
            newObj = this[PROXY_HANDLER].construct(this[PROXY_TARGET], argList, newTarget);
        } else {
            throwTypeError("Trap 'construct' is not a function: " + this[PROXY_HANDLER].construct);
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
        var executor = new Function('Constructor', 'args', 'return new Constructor(' + params.join(', ') + ')');
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
     * Return the [[Prototype]] of specified object
     * @param {object} obj
     * @returns {object}
     */
    var getPrototypeOf = supportES5 ? Object.getPrototypeOf : function (obj) {
        return obj.__proto__;
    };


    /**
     * Set the [[Prototype]] of specified object
     * @param {object} obj
     * @param {object} proto
     * @returns {object}
     */
    var setPrototypeOf = Object.setPrototypeOf || function (obj, proto) {
        obj.__proto__ = proto;
        return obj;
    };


    /**
     * Return the names of the own properties of an object
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
     * Create an object with specify [[prototype]]
     * @param {object} proto
     * @param {object} props
     * @returns {object}
     */
    var createObject = supportES5 ? Object.create : function (proto, props) {
        return Object.defineProperties({}, props);
    };


    /**
     * Proxy function
     * @param {InternalData} internal 
     * @returns {object}
     */
    function proxyFunction(internal) {
        var target = internal[PROXY_TARGET];

        function P() {
            return this instanceof P 
                ? internal[CONSTRUCT](arguments, P)
                : internal[CALL](this, arguments);
        }
        P.prototype = target.prototype;
        setPrototypeOf(P, getPrototypeOf(target));

        for (var key in target) {
            if (!hasOwnProperty(target, key)) {
                continue;
            }
            if (supportES5) {
                (function (property) {
                    var desc = Object.getOwnPropertyDescriptor(target, property);
                    Object.defineProperty(P, property, {
                        get: function () {
                            return internal[GET](property, P);
                        },
                        set: function (value) {
                            internal[SET](property, value, P);
                        },
                        enumerable: desc.enumerable,
                        configurable: desc.configurable
                    });
                }(key));
            } else {
                P[key] = target[key];
            }
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
        var P, props = {};
        for (var i = names.length - 1; i >= 0; --i) {
            (function (property) {
                var desc = Object.getOwnPropertyDescriptor(target, property);
                props[property] = {
                    get: function () {
                        return internal[GET](property, P);
                    },
                    set: function (value) {
                        internal[SET](property, value, P);
                    },
                    enumerable: desc.enumerable,
                    configurable: desc.configurable
                };
            }(names[i]));
        }
        P = createObject(getPrototypeOf(target), props);
        return P;
    }

    
    return Proxy;
}));
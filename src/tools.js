import {
    PROXY_FLAG,
    REVOKED_FLAG,
} from './constants';


/**
 * Check if value is the language type of Object
 * @param {any} value 
 * @returns {boolean}
 */
export function isObject(value) {
    return value ?
        typeof value === 'object' || typeof value === 'function' :
        false;
}


/**
 * Throw a type error
 * @param {string} message 
 */
export function throwTypeError(message) {
    throw new TypeError(message);
}


/**
 * Validate the proxy handler
 * @param {string} trap 
 * @param {object} handler
 */
export function validateProxyHanler(trap, handler) {
    if (!handler) {
        throwTypeError(`Cannot perform '${trap}' on a proxy that has been revoked`);
    }
}


/**
 * Throw an Error when trap is not a function
 * @param {string} trap 
 * @param {any} value
 */
export function throwTrapNotFunction(trap, value) {
    throwTypeError(`Trap '${trap}' is not a function: ${value}`);
}


/**
 * Call constructor with 'new'
 * @param {function} F constructor
 * @param {any[]} argList
 * @returns {object}
 */
export function evaluateNew(F, argList) {
    const params = [];
    for (let i = 0, len = argList.length; i < len; ++i) {
        params.push(`a[${i}]`);
    }
    const executor = new Function('Ctor', 'a', `return new Ctor(${params.join(',')})`);
    return executor(F, argList);
}


/**
 * Check if `value` is a pristine native function
 * @param {any} value 
 * @returns {boolean}
 */
export function isNativeFn(value) {
    return typeof value === 'function' && /\[native code\]/.test(value.toString());
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


export const {
    defineProperty,
    defineProperties,
    getOwnPropertyDescriptor,
    getPrototypeOf,
} = Object;


export const supportES5 = isNativeFn(getOwnPropertyDescriptor);


/**
 * Hack `Object.getOwnPropertyNames`
 */
export const getOwnPropertyNames = Object.getOwnPropertyNames || function (obj) {
    const names = [];
    for (let key in obj) {
        if (hasOwnProperty(obj, key)) {
            names.push(key);
        }
    }
    return names;
};


/**
 * Hack `Object.create`
 */
export const objectCreate = supportES5 ? Object.create : function (_, props) {
    return defineProperties({}, props);
};


/**
 * Hack `Object.assign`
 */
export const objectAssign = Object.assign || function (target, source) {
    for (let key in source) {
        if (hasOwnProperty(source, key)) {
            target[key] = source[key];
        }
    }
    return target;
};


export const canSetPrototype = isNativeFn(setPrototypeOf) || isObject(Object.__proto__);


/**
 * Hack `Object.setPrototypeOf`
 */
export const setPrototypeOf = Object.setPrototypeOf || function (fn, proto) {
    fn.__proto__ = proto;
    return fn;
};


/**
 * Check if `obj` is a revoked proxy
 * @param {object} obj 
 * @returns {boolean}
 */
export function isRevokedProxy(obj) {
    const proto = typeof obj === 'function' && !canSetPrototype
        ? obj.__proto__
        : getPrototypeOf(obj);
    return proto 
        ? PROXY_FLAG in proto && proto[PROXY_FLAG] === REVOKED_FLAG
        : false;
}

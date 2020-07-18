import {
    Object,
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
 * @param {object} handler
 * @param {string} trap 
 */
export function validateProxyHanler(handler, trap) {
    if (!handler) {
        throwTypeError(`Cannot perform '${trap}' on a revoked proxy`);
    }
}


/**
 * Throw an Error when trap is not a function
 * @param {string} trap 
 */
export function throwTrapNotFunction(trap) {
    throwTypeError(`[${trap}] trap must be undefined, null, or callable`);
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
export function hasOwnProperty(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
}


export const {
    defineProperty,
    defineProperties,
    getOwnPropertyDescriptor,
    getPrototypeOf,
    isExtensible,
    preventExtensions,
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
 * Get the [[Prototype]] of a Proxy object
 * @param {Proxy} obj 
 * @returns {object}
 */
export function getProxyProto(obj) {
    return typeof obj === 'function' && !canSetPrototype
        ? obj.__proto__
        : getPrototypeOf(obj);
}


/**
 * Check if `obj` is a Proxy object
 * @param {object} obj 
 * @returns {boolean}
 */
export function isProxyObject(obj) {
    const proto = getProxyProto(obj);
    return proto ? PROXY_FLAG in proto : false;
}


/**
 * Check if `obj` is a revoked proxy
 * @param {object} obj 
 * @returns {boolean}
 */
export function isRevokedProxy(obj) {
    const proto = getProxyProto(obj);
    return proto 
        ? PROXY_FLAG in proto && proto[PROXY_FLAG] === REVOKED_FLAG
        : false;
}


/**
 * Convert to standard descriptor
 * @param {object} obj
 * @returns {object} descriptor
 */
export function toPropertyDescriptor(obj) {
    const temp = defineProperty({}, 'a', obj);
    return getOwnPropertyDescriptor(temp, 'a');
}


/**
 * Check if descriptor is compatible
 * @param {boolean} extensible 
 * @param {object} desc 
 * @param {object} current 
 * @returns {boolean}
 */
export function isCompatiblePropertyDescriptor(extensible, desc, current) {
    const obj = defineProperty({}, 'b', current);
    if (!extensible) preventExtensions(obj);
    try {
        defineProperty(obj, 'b', desc);
        return true;
    } catch (error) {
        return false;
    }
}


/**
 * 
 * @param {object} desc 
 * @returns {object}
 */
export function fromPropertyDescriptor(desc) {
    if (!desc) return;
    const obj = {};
    if ('value' in desc) obj.value = desc.value;
    if ('writable' in desc) obj.writable = !!desc.writable;
    if ('get' in desc) obj.get = desc.get;
    if ('set' in desc) obj.set = desc.set;
    if ('enumerable' in desc) obj.enumerable = !!desc.enumerable;
    if ('configurable' in desc) obj.configurable = !!desc.configurable;
    return obj;
}


/**
 * 
 * @param {object} obj 
 * @returns {object[]}
 */
export function createListFromArrayLike (obj) {
    let len = Number(obj.length);
    len = len > 0 ? len : 0;
    const list = [];
    for (let i = 0; i < len; ++i) {
        if (typeof obj[i] === 'string') {
            list.push(obj[i]);
        } else {
            throwTypeError('');
        }
    }
    return list;
}


/**
 * 
 * @param {string[]} arr 
 * @returns {boolean}
 */
export function containDuplicateEntry(arr) {
    const entryMap = {};
    for (let i = arr.length - 1; i >= 0; --i) {
        const entry = arr[i];
        if (entryMap[entry]) {
            return true;
        } else {
            entryMap[entry] = 1;
        }
    }
    return false;
}

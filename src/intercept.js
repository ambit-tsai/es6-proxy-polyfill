import {
    Object,
    Reflect,
    KEY_TO_INTERNAL,
    PROXY_FLAG,
} from './constants';
import {
    supportES5,
    isProxyObject,
    getProxyProto,
    hasOwnProperty,
    isExtensible,
    preventExtensions,
    getPrototypeOf,
    setPrototypeOf,
    getOwnPropertyNames,
    defineProperty,
} from './tools';



if (supportES5) {
    Object.isExtensible = proxyIsExtensible;
    Object.preventExtensions = function (obj) {
        proxyPreventExtensions(obj);
        return obj;
    };
    Object.getPrototypeOf = proxyGetPrototypeOf;
    Object.prototype.isPrototypeOf = function (obj) {
        const proto = proxyGetPrototypeOf(obj);
        if (!proto) return false;
        if (proto === this) return true;
        return this.isPrototypeOf(proto);
    };
    Object.setPrototypeOf = function (obj, prototype) {
        proxySetPrototypeOf(obj, prototype);
        return obj;
    };
    Object.getOwnPropertyDescriptor = proxyGetOwnPropertyDescriptor;
    Object.getOwnPropertyDescriptors = function (obj) {
        const names = getOwnPropertyNames(obj);
        const descMap = {};
        for (let i = names.length - 1; i >=0; --i) {
            descMap[ names[i] ] = proxyGetOwnPropertyDescriptor(obj, names[i]);
        }
        return descMap;
    };
    Object.defineProperty = function (obj, prop, desc) {
        proxyDefineProperty(obj, prop, desc);
        return obj;
    };
    Object.defineProperties = function (obj, props) {
        for (let key in props) {
            if (hasOwnProperty(obj, key)) {
                proxyDefineProperty(obj, key, props[key]);
            }
        }
        return obj;
    };
    /* TODO: GetOwnProperty
    Object.prototype.propertyIsEnumerable 
    Array.prototype.sort
    Object.prototype.__lookupGetter__
    Object.prototype.__lookupSetter__ 
    Object.assign
    */


    if (Reflect) {
        Reflect.isExtensible = proxyIsExtensible;
        Reflect.preventExtensions = proxyPreventExtensions;
        Reflect.getPrototypeOf = proxyGetPrototypeOf;
        Reflect.setPrototypeOf = proxySetPrototypeOf;
        Reflect.getOwnPropertyDescriptor = proxyGetOwnPropertyDescriptor;
        Reflect.defineProperty = proxyDefineProperty;
        Reflect.has = proxyHas;
        Reflect.deleteProperty = proxyDeleteProperty;
        Reflect.ownKeys = proxyOwnKeys;
    }
}



/**
 * Proxy `isExtensible`
 * @returns {boolean}
 */
function proxyIsExtensible(target) {
    if (isProxyObject(target)) {
        const map = {key: KEY_TO_INTERNAL};
        getProxyProto(target)[PROXY_FLAG] = map;
        return map.internal.IsExtensible();
    }
    return isExtensible(target);
}


/**
 * Proxy `preventExtensions`
 * @returns {boolean}
 */
function proxyPreventExtensions(target) {
    if (isProxyObject(target)) {
        const map = {key: KEY_TO_INTERNAL};
        getProxyProto(target)[PROXY_FLAG] = map;
        return map.internal.PreventExtensions();
    }
    try {
        preventExtensions(target);
        return true;
    } catch (err) {
        return false;
    }
}


/**
 * Proxy `getPrototypeOf`
 * @returns {object|null}
 */
function proxyGetPrototypeOf(target) {
    if (isProxyObject(target)) {
        const map = {key: KEY_TO_INTERNAL};
        getProxyProto(target)[PROXY_FLAG] = map;
        return map.internal.GetPrototypeOf();
    }
    return getPrototypeOf(target);
}


/**
 * Proxy `setPrototypeOf`
 * @returns {boolean}
 */
function proxySetPrototypeOf(target, proto) {
    if (isProxyObject(target)) {
        const map = {key: KEY_TO_INTERNAL};
        getProxyProto(target)[PROXY_FLAG] = map;
        return map.internal.SetPrototypeOf(proto);
    }
    try {
        setPrototypeOf(target, proto);
        return true;
    } catch (err) {
        return false;
    }
}


/**
 * Proxy `getOwnPropertyDescriptor`
 * @returns {object}
 */
function proxyGetOwnPropertyDescriptor(target, propertyKey) {
    if (isProxyObject(target)) {
        const map = {key: KEY_TO_INTERNAL};
        getProxyProto(target)[PROXY_FLAG] = map;
        return map.internal.GetOwnProperty(propertyKey);
    }
    return getOwnPropertyDescriptor(target, propertyKey);
}


/**
 * Proxy `defineProperty`
 * @returns {boolean}
 */
function proxyDefineProperty(target, propertyKey, attributes) {
    if (isProxyObject(target)) {
        const map = {key: KEY_TO_INTERNAL};
        getProxyProto(target)[PROXY_FLAG] = map;
        return map.internal.DefineOwnProperty(propertyKey, attributes);
    }
    try {
        defineProperty(target, propertyKey, attributes);
        return true;
    } catch (err) {
        return false;
    }
}


/**
 * Proxy `has`
 * @returns {boolean}
 */
function proxyHas(target, propertyKey) {
    if (isProxyObject(target)) {
        const map = {key: KEY_TO_INTERNAL};
        getProxyProto(target)[PROXY_FLAG] = map;
        return map.internal.HasProperty(propertyKey);
    }
    return propertyKey in target;
}


/**
 * Proxy `deleteProperty`
 * @returns {boolean}
 */
function proxyDeleteProperty(target, propertyKey) {
    if (isProxyObject(target)) {
        const map = {key: KEY_TO_INTERNAL};
        getProxyProto(target)[PROXY_FLAG] = map;
        return map.internal.Delete(propertyKey);
    }
    return delete target[propertyKey];
}


/**
 * Proxy `ownKeys`
 * @returns {string[]}
 */
function proxyOwnKeys(target) {
    if (isProxyObject(target)) {
        const map = {key: KEY_TO_INTERNAL};
        getProxyProto(target)[PROXY_FLAG] = map;
        return map.internal.OwnPropertyKeys();
    }
    return getOwnPropertyNames(target);
}

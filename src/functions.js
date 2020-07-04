import Internal from './Internal';
import {
    PROXY_TARGET,
    GET,
    SET,
    CALL,
    CONSTRUCT,
    UNDEFINED,
    PROXY_FLAG,
    REVOKED_FLAG,
} from './constants';
import {
    canSetPrototype,
    defineProperty,
    defineProperties,
    getOwnPropertyDescriptor,
    getOwnPropertyNames,
    getPrototypeOf,
    objectCreate,
    objectAssign,
    setPrototypeOf,
    supportES5,
} from './tools';


/**
 * Create a Proxy object
 * @param {Internal} internal
 * @returns {Proxy}
 */
export function createProxy(internal) {
    const target = internal[PROXY_TARGET];
    let proxy;
    if (typeof target === 'function') {
        proxy = proxyFunction(internal);
    } else if (target instanceof Array) {
        proxy = proxyArray(internal);
    } else {
        proxy = proxyObject(internal);
    }
    return proxy;
}


/**
 * Proxy function object
 * @param {Internal} internal 
 * @returns {function}
 */
function proxyFunction(internal) {
    const target = internal[PROXY_TARGET];
    const P = forgeFunction(internal);

    if (supportES5) {
        let descMap = observeProperties(target, internal);
        delete descMap.arguments;
        delete descMap.caller;
        delete descMap.displayName;
        delete descMap.length;
        delete descMap.name;
        delete descMap.prototype;
        defineProperties(P, descMap);

        const proto = getPrototypeOf(target);
        descMap = observeProto(proto, internal);
        if (canSetPrototype) {
            const newProto = objectCreate(proto, descMap);
            setPrototypeOf(P, newProto);
        } else {
            const newProto = objectCreate(null, {
                [PROXY_FLAG]: descMap[PROXY_FLAG],
            });
            defineProperty(P, '__proto__', {
                value: newProto,
            });
        }
    } else {
        objectAssign(P, target);
    }
    
    return P;
}


/**
 * Proxy array object
 * @param {Internal} internal 
 * @returns {object} array-like object
 */
function proxyArray(internal) {
    const target = internal[PROXY_TARGET];
    const proto = getPrototypeOf(target);
    let descMap = observeProto(proto, internal);
    // Fix: `concat` does not work correctly on array-like object
    descMap.concat.get = function () {
        const val = internal[GET]('concat', this);
        return val === Array.prototype.concat
            ? val.bind(target)
            : val;
    };
    const newProto = objectCreate(proto, descMap);

    descMap = observeProperties(target, internal);
    // Observe the change of `length`, and synchronize
    // the properties of Proxy object to target array
    descMap.length.set = function (value) {
        const lenDiff = value - target.length;
        internal[SET]('length', value, this);
        if (lenDiff) syncArrayElement(lenDiff, this, internal);
    };
    
    return objectCreate(newProto, descMap);
}


/**
 * Proxy object
 * @param {Internal} internal 
 * @returns {object}
 */
function proxyObject(internal) {
    const target = internal[PROXY_TARGET];
    let descMap, newProto;
    if (supportES5) {
        const proto = getPrototypeOf(target);
        descMap = observeProto(proto, internal);
        newProto = objectCreate(proto, descMap);
    }
    descMap = observeProperties(target, internal);
    return objectCreate(newProto, descMap);
}


/**
 * 
 * @param {Internal} internal 
 * @returns {function}
 */
function forgeFunction(internal) {
    const fn = internal[PROXY_TARGET];
    const name = fn.name || 'P';
    const params = [];
    for (let i = fn.length - 1; i >= 0; --i) {
        params.push(`a${i}`);
    }
    const executor = new Function('internal', `function ${name}(${params.join(',')}) {
        return this instanceof ${name} 
            ? internal['${CONSTRUCT}'](arguments, ${name})
            : internal['${CALL}'](this, arguments);
    };return ${name}`);
    const P = executor(internal);
    P.prototype = fn.prototype;     // `prototype` is not configurable
    return P;
}


/**
 * Observe [[Prototype]]
 * @param {object} proto
 * @param {Internal} internal 
 * @returns {object} descriptors
 */
function observeProto(proto, internal) {
    const descMap = {};
    while (proto) {
        const props = observeProperties(proto, internal);
        objectAssign(descMap, props);
        proto = getPrototypeOf(proto);
    }
    descMap[PROXY_FLAG] = {     // add proxy flag
        get() {
            return internal[PROXY_TARGET] ? UNDEFINED : REVOKED_FLAG;
        },
        set(value) {
            if (value === Internal) return internal;
        },
    };
    return descMap;
}


/**
 * Observe the properties
 * @param {object} obj
 * @param {Internal} internal 
 * @returns {object} descriptors
 */
function observeProperties(obj, internal) {
    const names = getOwnPropertyNames(obj);
    const descMap = {};
    for (let i = names.length - 1; i >=0; --i) {
        descMap[ names[i] ] = observeProperty(obj, names[i], internal);
    }
    return descMap;
}


/**
 * Observe a property
 * @param {object} obj
 * @param {string} prop
 * @param {Internal} internal 
 * @returns {{get: function, set: function, enumerable: boolean, configurable: boolean}}
 */
function observeProperty(obj, prop, internal) {
    const desc = getOwnPropertyDescriptor(obj, prop);
    return {
        get() {
            return internal[GET](prop, this);
        },
        set(value) {
            internal[SET](prop, value, this);
        },
        enumerable: desc.enumerable,
        configurable: desc.configurable,
    };
}


/**
 * Sync array element from P to target
 * @param {number} lenDiff
 * @param {object} P
 * @param {Internal} internal 
 */
function syncArrayElement (lenDiff, P, internal) {
    const target = internal[PROXY_TARGET];
    if (lenDiff > 0) {
        for (let tLen = target.length, i = tLen - lenDiff; i < tLen; ++i) {
            const desc = getOwnPropertyDescriptor(P, i);
            if (desc) defineProperty(target, i, desc);
            else target[i] = UNDEFINED;
            desc = observeProperty(target, i, internal);
            defineProperty(P, i, desc);
        }
    } else {
        for (let i = target.length, pLen = i - lenDiff; i < pLen; ++i) {
            delete P[i];
        }
    }
}

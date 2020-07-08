import {
    UNDEFINED,
    PROXY_FLAG,
    REVOKED_FLAG,
    KEY_TO_INTERNAL,
} from './constants';
import {
    canSetPrototype,
    defineProperty,
    defineProperties,
    getOwnPropertyDescriptor,
    getOwnPropertyNames,
    getPrototypeOf,
    isObject,
    objectCreate,
    objectAssign,
    setPrototypeOf,
    supportES5,
} from './tools';



/**
 * Proxy function object
 * @param {Internal} internal 
 * @returns {function}
 */
export function proxyFunction(internal) {
    const {ProxyTarget} = internal;
    const P = forgeFunction(internal);

    if (supportES5) {
        let descMap = observeProperties(ProxyTarget, internal);
        delete descMap.arguments;
        delete descMap.caller;
        delete descMap.displayName;
        delete descMap.length;
        delete descMap.name;
        delete descMap.prototype;
        defineProperties(P, descMap);

        const proto = getPrototypeOf(ProxyTarget);
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
        objectAssign(P, ProxyTarget);
    }
    
    return P;
}


/**
 * Proxy array object
 * @param {Internal} internal 
 * @returns {object} array-like object
 */
export function proxyArray(internal) {
    const {ProxyTarget} = internal;
    const proto = getPrototypeOf(ProxyTarget);
    let descMap = observeProto(proto, internal);
    // Fix: `concat` does not work correctly on array-like object
    descMap.concat.get = function () {
        const val = internal.Get('concat', this);
        return val === Array.prototype.concat
            ? val.bind(ProxyTarget)
            : val;
    };
    const newProto = objectCreate(proto, descMap);

    descMap = observeProperties(ProxyTarget, internal);
    // Observe the change of `length`, and synchronize
    // the properties of Proxy object to target array
    descMap.length.set = function (value) {
        const lenDiff = value - ProxyTarget.length;
        internal.Set('length', value, this);
        if (lenDiff) syncArrayElement(lenDiff, this, internal);
    };
    
    return objectCreate(newProto, descMap);
}


/**
 * Proxy object
 * @param {Internal} internal 
 * @returns {object}
 */
export function proxyObject(internal) {
    const {ProxyTarget} = internal;
    let descMap, newProto;
    if (supportES5) {
        const proto = getPrototypeOf(ProxyTarget);
        descMap = observeProto(proto, internal);
        newProto = objectCreate(proto, descMap);
    }
    descMap = observeProperties(ProxyTarget, internal);
    return objectCreate(newProto, descMap);
}


/**
 * 
 * @param {Internal} internal 
 * @returns {function}
 */
function forgeFunction(internal) {
    const {ProxyTarget} = internal;
    const name = ProxyTarget.name || 'P';
    const params = [];
    for (let i = ProxyTarget.length - 1; i >= 0; --i) {
        params.push(`a${i}`);
    }
    const executor = new Function('internal', `function ${name}(${params.join(',')}) {
        return this instanceof ${name} 
            ? internal.Construct(arguments, ${name})
            : internal.Call(this, arguments);
    };return ${name}`);
    const P = executor(internal);
    P.prototype = ProxyTarget.prototype;    // `prototype` is not configurable
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
    descMap[PROXY_FLAG] = {                 // add proxy flag
        get() {
            return internal.ProxyTarget ? UNDEFINED : REVOKED_FLAG;
        },
        set(value) {
            if (isObject(value) && value.key === KEY_TO_INTERNAL) {
                value.internal = internal;  // return the internal
            }
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
            return internal.Get(prop, this);
        },
        set(value) {
            internal.Set(prop, value, this);
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
    const {ProxyTarget} = internal;
    if (lenDiff > 0) {
        for (let tLen = ProxyTarget.length, i = tLen - lenDiff; i < tLen; ++i) {
            const desc = getOwnPropertyDescriptor(P, i);
            if (desc) defineProperty(ProxyTarget, i, desc);
            else ProxyTarget[i] = UNDEFINED;
            desc = observeProperty(ProxyTarget, i, internal);
            defineProperty(P, i, desc);
        }
    } else {
        for (let i = ProxyTarget.length, pLen = i - lenDiff; i < pLen; ++i) {
            delete P[i];
        }
    }
}

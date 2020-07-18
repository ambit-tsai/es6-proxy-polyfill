import {
    UNDEFINED,
} from './constants';
import {
    proxyFunction,
    proxyArray,
    proxyObject,
} from './functions';
import {
    evaluateNew,
    fromPropertyDescriptor,
    supportES5,
    isCompatiblePropertyDescriptor,
    isObject,
    isRevokedProxy,
    toPropertyDescriptor,
    throwTrapNotFunction,
    throwTypeError,
    validateProxyHanler,
    isExtensible,
    preventExtensions,
    getPrototypeOf,
    setPrototypeOf,
    getOwnPropertyDescriptor,
    defineProperty,
    getOwnPropertyNames,
    createListFromArrayLike,
    containDuplicateEntry,
} from './tools';



/**
 * Proxy Object Internal Methods and Internal Slots
 */
export default class Internal {

    /**
    * [[ProxyTarget]]
    * @type {object}
    */
    ProxyTarget;


    /**
    * [[ProxyHandler]]
    * @type {object}
    */
    ProxyHandler;


    /**
     * The creation of new Proxy exotic objects
     * @param {object} target
     * @param {object} handler
     * @returns {{proxy: Proxy, internal: Internal}}
     */
    static ProxyCreate(target, handler) {
        if (!isObject(target) || !isObject(handler)) {
            throwTypeError('Cannot create proxy with a non-object as target or handler');
        }
        if (supportES5 && (isRevokedProxy(target) || isRevokedProxy(handler))) {
            throwTypeError('Cannot create proxy with a revoked proxy as target or handler');
        }
        
        const internal = new Internal();
        internal.ProxyTarget = target;
        internal.ProxyHandler = handler;

        let P;
        if (typeof target === 'function') {
            P = proxyFunction(internal);
        } else if (target instanceof Array) {
            P = proxyArray(internal);
        } else {
            P = proxyObject(internal);
        }
        return {
            proxy: P,
            internal,
        };
    }


    /**
     * [[Get]]
     * @param {string} property
     * @param {object} receiver
     * @returns {any}
     */
    Get(property, receiver) {
        const trap = 'get';
        const {ProxyTarget, ProxyHandler} = this;
        validateProxyHanler(ProxyHandler, trap);

        if (ProxyHandler[trap] == UNDEFINED) {
            return ProxyTarget[property];
        }
        if (typeof ProxyHandler[trap] !== 'function') {
            throwTrapNotFunction(trap);
        }

        const trapResult = ProxyHandler[trap](ProxyTarget, property, receiver);
        const targetDesc = getOwnPropertyDescriptor(ProxyTarget, property);
        if (targetDesc && !targetDesc.configurable) {
            if ('value' in targetDesc && !targetDesc.writable && trapResult !== targetDesc.value) {
                throwTypeError(`[${trap}] proxy must report the same value for the non-writable, non-configurable property "${property}"`);
            }
            if (!('value' in targetDesc) && !targetDesc.get && trapResult !== UNDEFINED) {
                throwTypeError(`[${trap}] proxy must report undefined for a non-configurable accessor property "${property}" without a getter`);
            }
        }
        return trapResult;
    }


    /**
     * [[Set]]
     * @param {string} property
     * @param {any} value
     * @param {object} receiver
     * @returns {boolean}
     */
    Set(property, value, receiver) {
        const trap = 'set';
        const {ProxyTarget, ProxyHandler} = this;
        validateProxyHanler(ProxyHandler, trap);

        if (ProxyHandler[trap] == UNDEFINED) {
            ProxyTarget[property] = value;
            return true;
        }
        if (typeof ProxyHandler[trap] !== 'function') {
            throwTrapNotFunction(trap);
        }

        const booleanTrapResult = ProxyHandler[trap](ProxyTarget, property, value, receiver);
        if (!booleanTrapResult) return false;
        // if (!booleanTrapResult) {
        //     throwTypeError(`Trap 'set' returned false for property '${property}'`);
        // }

        const targetDesc = getOwnPropertyDescriptor(ProxyTarget, property);
        if (targetDesc && !targetDesc.configurable) {
            if ('value' in targetDesc && !targetDesc.writable && value !== targetDesc.value) {
                throwTypeError(`[${trap}] proxy can't successfully set a non-writable, non-configurable property "${property}"`);
            }
            if (!('value' in targetDesc) && !targetDesc.set) {
                throwTypeError(`[${trap}] proxy can't successfully set an accessor property "${property}" without a setter`);
            }
        }
        return true;
    }


    /**
     * [[Call]]
     * @param {object} thisArg
     * @param {any[]} argList
     * @returns {any}
     */
    Call(thisArg, argList) {
        const trap = 'apply';
        const {ProxyTarget, ProxyHandler} = this;
        validateProxyHanler(ProxyHandler, trap);

        if (ProxyHandler[trap] == UNDEFINED) {
            return ProxyTarget(thisArg, argList);
        }
        if (typeof ProxyHandler[trap] !== 'function') {
            throwTrapNotFunction(trap);
        }

        return ProxyHandler[trap](ProxyTarget, thisArg, argList);
    }


    /**
     * [[Construct]]
     * @param {any[]} argList
     * @param {object} newTarget
     * @returns {object}
     */
    Construct(argList, newTarget) {
        const trap = 'construct';
        const {ProxyTarget, ProxyHandler} = this;
        validateProxyHanler(ProxyHandler, trap);

        if (ProxyHandler[trap] == UNDEFINED) {
            // return evaluateNew(ProxyTarget, argList);
            return new ProxyTarget(...argList);
        }
        if (typeof ProxyHandler[trap] !== 'function') {
            throwTrapNotFunction(trap);
        }

        const newObj = ProxyHandler[trap](ProxyTarget, argList, newTarget);
        if (isObject(newObj)) {
            return newObj;
        } else {
            throwTypeError(`[${trap}] trap returned non-object (${newObj})`);
        }
    }


    /**
     * [[IsExtensible]]
     * @returns {boolean}
     */
    IsExtensible() {
        const trap = 'isExtensible';
        const {ProxyTarget, ProxyHandler} = this;
        validateProxyHanler(ProxyHandler, trap);

        if (ProxyHandler[trap] == UNDEFINED) {
            return isExtensible(ProxyTarget);
        }
        if (typeof ProxyHandler[trap] !== 'function') {
            throwTrapNotFunction(trap);
        }

        const booleanTrapResult = ProxyHandler[trap](ProxyTarget) ? true : false;
        const targetResult = isExtensible(ProxyTarget);
        if (booleanTrapResult === targetResult) {
            return booleanTrapResult;
        } else {
            throwTypeError(`[${trap}] proxy must report same extensiblitity as target`);
        }
    }


    /**
     * [[PreventExtensions]]
     * @returns {boolean}
     */
    PreventExtensions() {
        const trap = 'preventExtensions';
        const {ProxyTarget, ProxyHandler} = this;
        validateProxyHanler(ProxyHandler, trap);

        if (ProxyHandler[trap] == UNDEFINED) {
            preventExtensions(ProxyTarget);
            return true;
        }
        if (typeof ProxyHandler[trap] !== 'function') {
            throwTrapNotFunction(trap);
        }
        
        const booleanTrapResult = ProxyHandler[trap](ProxyTarget) ? true : false;
        if (booleanTrapResult === false) {
            throwTypeError(`[${trap}] trap returned false`);
        }
        
        const targetIsExtensible = isExtensible(ProxyTarget);
        if (targetIsExtensible) {
            throwTypeError(`[${trap}] proxy can't report an extensible object as non-extensible`);
        }
        return booleanTrapResult;
    }


    /**
     * [[GetPrototypeOf]]
     * @returns {object}
     */
    GetPrototypeOf() {
        const trap = 'getPrototypeOf';
        const {ProxyTarget, ProxyHandler} = this;
        validateProxyHanler(ProxyHandler, trap);

        if (ProxyHandler[trap] == UNDEFINED) {
            return getPrototypeOf(ProxyTarget);
        }
        if (typeof ProxyHandler[trap] !== 'function') {
            throwTrapNotFunction(trap);
        }
        
        const handlerProto = ProxyHandler[trap](ProxyTarget);
        if (!(isObject(handlerProto) || handlerProto === null)) {
            throwTypeError(`[${trap}] trap returned neither object nor null`);
        }
        const extensibleTarget = isExtensible(ProxyTarget);
        if (!extensibleTarget) {
            const targetProto = getPrototypeOf(ProxyTarget);
            if (handlerProto !== targetProto) {
                throwTypeError(`[${trap}] proxy target is non-extensible but the trap did not return its actual prototype`);
            }
        }
        return handlerProto;
    }


    /**
     * [[SetPrototypeOf]]
     * @param {object} prototype
     * @returns {boolean}
     */
    SetPrototypeOf(prototype) {
        const trap = 'setPrototypeOf';
        const {ProxyTarget, ProxyHandler} = this;
        validateProxyHanler(ProxyHandler, trap);

        if (ProxyHandler[trap] == UNDEFINED) {
            setPrototypeOf(ProxyTarget, prototype);
            return true;
        }
        if (typeof ProxyHandler[trap] !== 'function') {
            throwTrapNotFunction(trap);
        }
        
        const booleanTrapResult = ProxyHandler[trap](ProxyTarget, prototype);
        if (!booleanTrapResult) return false;
        
        const extensibleTarget = isExtensible(ProxyTarget);
        if (!extensibleTarget) {
            const targetProto = getPrototypeOf(ProxyTarget);
            if (prototype !== targetProto) {
                throwTypeError(`[${trap}] trap returned true for setting a new prototype on the non-extensible`);
            }
        }
        return true;
    }


    /**
     * [[GetOwnProperty]]
     * @param {string} property
     * @returns {object} descriptor
     */
    GetOwnProperty(property) {
        const trap = 'getOwnPropertyDescriptor';
        const {ProxyTarget, ProxyHandler} = this;
        validateProxyHanler(ProxyHandler, trap);

        if (ProxyHandler[trap] == UNDEFINED) {
            return getOwnPropertyDescriptor(ProxyTarget, property);
        }
        if (typeof ProxyHandler[trap] !== 'function') {
            throwTrapNotFunction(trap, ProxyHandler[trap]);
        }

        const trapResultObj = ProxyHandler[trap](ProxyTarget, property);
        if (!(isObject(trapResultObj) || trapResultObj === UNDEFINED)) {
            throwTypeError(`[${trap}] trap returned neither object nor undefined`);
        }

        const targetDesc = getOwnPropertyDescriptor(ProxyTarget, property);
        if (trapResultObj === UNDEFINED) {
            if (targetDesc !== UNDEFINED) {
                if (!targetDesc.configurable) {
                    throwTypeError(`[${trap}] trap returned undefined for non-configurable property`)
                }
                const extensibleTarget = isExtensible(ProxyTarget);
                if (!extensibleTarget) {
                    throwTypeError(`[${trap}] trap returned undefined for non-extensible object`)
                }
            }
            return;
        }

        const extensibleTarget = isExtensible(ProxyTarget);
        const resultDesc = toPropertyDescriptor(trapResultObj);
        const valid = isCompatiblePropertyDescriptor(extensibleTarget, resultDesc, targetDesc);
        if (!valid) {
            throwTypeError(`[${trap}] trap returned an incompatible descriptor`);
        }
        if (!resultDesc.configurable && (targetDesc === UNDEFINED || targetDesc.configurable)) {
            throwTypeError(`[${trap}] trap reported non-existent or configurable property as non-configurable`);
        }
        return resultDesc;
    }


    /**
     * [[DefineOwnProperty]]
     * @param {string} prop 
     * @param {object} desc
     * @returns {boolean}
     */
    DefineOwnProperty(prop, desc) {
        const trap = 'defineProperty';
        const {ProxyTarget, ProxyHandler} = this;
        validateProxyHanler(ProxyHandler, trap);

        if (ProxyHandler[trap] == UNDEFINED) {
            defineProperty(ProxyTarget, prop, desc);
            return true;
        }
        if (typeof ProxyHandler[trap] !== 'function') {
            throwTrapNotFunction(trap, ProxyHandler[trap]);
        }

        const descObj = fromPropertyDescriptor(desc);
        const booleanTrapResult = ProxyHandler[trap](ProxyTarget, prop, descObj);
        if (!booleanTrapResult) return false;

        const targetDesc = getOwnPropertyDescriptor(ProxyTarget, prop);
        const extensibleTarget = isExtensible(ProxyTarget);
        const settingConfigFalse = desc.configurable === false ? true : false;
        if (targetDesc === UNDEFINED) {
            if (!extensibleTarget) {
                throwTypeError(`[${trap}] proxy can't define property "${prop}" on a non-extensible object`);
            }
            if (settingConfigFalse) {
                throwTypeError(`[${trap}] proxy can't define non-existent property "${prop}" as non-configurable`);
            }
        } else {
            if (!isCompatiblePropertyDescriptor(extensibleTarget, desc, targetDesc)) {
                throwTypeError(`[${trap}] proxy can't define an incompatible descriptor for property "${prop}"`);
            }
            if (settingConfigFalse && targetDesc.configurable) {
                throwTypeError(`[${trap}] proxy can't define an existing configurable property as non-configurable`);
            }
        }
        return true;
    }


    /**
     * [[HasProperty]]
     * @returns {boolean}
     */
    HasProperty(prop) {
        const trap = 'has';
        const {ProxyTarget, ProxyHandler} = this;
        validateProxyHanler(ProxyHandler, trap);

        if (ProxyHandler[trap] == UNDEFINED) {
            return prop in ProxyTarget;
        }
        if (typeof ProxyHandler[trap] !== 'function') {
            throwTrapNotFunction(trap, ProxyHandler[trap]);
        }

        const booleanTrapResult = ProxyHandler[trap](ProxyTarget, prop) ? true : false;
        if (!booleanTrapResult) {
            const targetDesc = getOwnPropertyDescriptor(ProxyTarget, prop);
            if (targetDesc) {
                if (!targetDesc.configurable) {
                    throwTypeError(`[${trap}] proxy can't report a non-configurable own property "${prop}" as non-existent`);
                }
                const extensibleTarget = isExtensible(ProxyTarget);
                if (!extensibleTarget) {
                    throwTypeError(`[${trap}] proxy can't report an existing own property "${prop}" as non-existent on a non-extensible object`);
                }
            }
        }
        return booleanTrapResult;
    }


    /**
     * [[Delete]]
     * @returns {boolean}
     */
    Delete(prop) {
        const trap = 'deleteProperty';
        const {ProxyTarget, ProxyHandler} = this;
        validateProxyHanler(ProxyHandler, trap);

        if (ProxyHandler[trap] == UNDEFINED) {
            return delete ProxyTarget[prop];
        }
        if (typeof ProxyHandler[trap] !== 'function') {
            throwTrapNotFunction(trap, ProxyHandler[trap]);
        }

        const booleanTrapResult = ProxyHandler[trap](ProxyTarget, prop);
        if (!booleanTrapResult) return false;

        const targetDesc = getOwnPropertyDescriptor(ProxyTarget, prop);
        if (targetDesc && !targetDesc.configurable) {
            throwTypeError(`[${trap}] property "${prop}" is non-configurable and can't be deleted`);
        }
        return true;
    }


    /**
     * [[OwnPropertyKeys]]
     * @returns {string[]}
     */
    OwnPropertyKeys() {
        const trap = 'ownKeys';
        const {ProxyTarget, ProxyHandler} = this;
        validateProxyHanler(ProxyHandler, trap);

        if (ProxyHandler[trap] == UNDEFINED) {
            return getOwnPropertyNames(ProxyTarget);
        }
        if (typeof ProxyHandler[trap] !== 'function') {
            throwTrapNotFunction(trap, ProxyHandler[trap]);
        }

        const trapResultArray = ProxyHandler[trap](ProxyTarget);
        const trapResult = createListFromArrayLike(trapResultArray);
        if (containDuplicateEntry(trapResult)) {
            throwTypeError(`[${trap}] trap returned duplicate entries`);
        }

        const extensibleTarget = isExtensible(ProxyTarget);
        const targetKeys = getOwnPropertyNames(ProxyTarget);
        const targetConfigurableKeys = [];
        const targetNonconfigurableKeys = [];
        const uncheckedResultKeyMap = {};
        for (let i = targetKeys.length - 1; i >= 0; --i) {
            const key = targetKeys[i];
            const desc = getOwnPropertyDescriptor(ProxyTarget, key);
            if (desc && !desc.configurable) {
                targetNonconfigurableKeys.push(key);
            } else {
                targetConfigurableKeys.push(key);
            }
            uncheckedResultKeyMap[key] = 1;
        }
        if (extensibleTarget && !targetNonconfigurableKeys.length) {
            return trapResult;
        }

        for (const key of targetNonconfigurableKeys) {
            if (key in uncheckedResultKeyMap) {
                uncheckedResultKeyMap[key] = 0;
            } else {
                throwTypeError(`[${trap}] result did not include the non-configurable property "${key}"`);
            }
        }
        if (extensibleTarget) return trapResult;

        for (const key of targetConfigurableKeys) {
            if (key in uncheckedResultKeyMap) {
                uncheckedResultKeyMap[key] = 0;
            } else {
                throwTypeError(`[${trap}] result did not include the existing property "${key}" of non-extensible object`);
            }
        }

        for (const key in uncheckedResultKeyMap) {
            if (uncheckedResultKeyMap[key]) {
                throwTypeError(`[${trap}] proxy can't report a new property "${key}" on a non-extensible object`);
            }
        }

        return trapResult;
    }

}

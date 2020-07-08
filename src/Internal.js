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
    supportES5,
    isObject,
    isRevokedProxy,
    throwTrapNotFunction,
    throwTypeError,
    validateProxyHanler,
    isExtensible,
    preventExtensions,
    getPrototypeOf,
    setPrototypeOf,
    getOwnPropertyDescriptor,
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
            return ProxyTarget[trap](thisArg, argList);
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
            return evaluateNew(ProxyTarget, argList);
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
            return preventExtensions(ProxyTarget);
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
            return setPrototypeOf(ProxyTarget, prototype);
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
     * @returns {object}
     */
    GetOwnProperty(property) {
        const trap = 'getOwnPropertyDescriptor';
        const {ProxyTarget, ProxyHandler} = this;
        validateProxyHanler(ProxyHandler, trap);

        if (ProxyHandler[trap] == UNDEFINED) {
            return getOwnPropertyDescriptor(ProxyTarget, property);
        }
        if (typeof ProxyHandler[trap] === 'function') {
            const trapResultObj = ProxyHandler[trap](ProxyTarget, property);
            if (!(isObject(trapResultObj) || trapResultObj === UNDEFINED)) {
                throwTypeError('');
            }

            const targetDesc = getOwnPropertyDescriptor(ProxyTarget, property);
            if (trapResultObj === UNDEFINED) {
                if (targetDesc !== UNDEFINED) {
                    if (!targetDesc.configurable) {
                        throwTypeError('')
                    }
                    const extensibleTarget = isExtensible(ProxyTarget);
                    if (!extensibleTarget) {
                        throwTypeError('')
                    }
                }
                return;
            }

            const extensibleTarget = isExtensible(ProxyTarget);
            const resultDesc = ToPropertyDescriptor(trapResultObj);
            //Call CompletePropertyDescriptor(resultDesc).
            const valid = IsCompatiblePropertyDescriptor(extensibleTarget, resultDesc, targetDesc);
            if (!valid) {
                throwTypeError('');
            }
            if (!resultDesc.configurable && (targetDesc === UNDEFINED || targetDesc.configurable)) {
                throwTypeError('');
            }
            return resultDesc;
        }
        throwTrapNotFunction(trap, ProxyHandler[trap]);
    }

}

import {
    evaluateNew,
    supportES5,
    isObject,
    isRevokedProxy,
    throwTrapNotFunction,
    throwTypeError,
    validateProxyHanler,
} from './tools';
import {
    PROXY_TARGET,
    PROXY_HANDLER,
    GET,
    SET,
    CALL,
    CONSTRUCT,
    UNDEFINED,
} from './constants';



export default class Internal {
    /**
     * @constructor
     * @param {object} target 
     * @param {object} handler 
     */
    constructor(target, handler) {
        if (!isObject(target) || !isObject(handler)) {
            throwTypeError('Cannot create proxy with a non-object as target or handler');
        }
        if (supportES5 && (isRevokedProxy(target) || isRevokedProxy(handler))) {
            throwTypeError('Cannot create proxy with a revoked proxy as target or handler');
        }
        this[PROXY_TARGET] = target;
        this[PROXY_HANDLER] = handler;
    }

    /**
     * The implementation of internal method [[Get]]
     * @param {string} property
     * @param {object} receiver
     * @returns {any}
     */
    [GET](property, receiver) {
        const {
            [PROXY_HANDLER]: handler,
            [PROXY_TARGET]: target,
        } = this;
        validateProxyHanler('get', handler);
        if (handler.get == UNDEFINED) {
            return target[property];
        }
        if (typeof handler.get === 'function') {
            return handler.get(target, property, receiver);
        }
        throwTrapNotFunction('get', handler.get);
    }

    /**
     * The implementation of internal method [[Set]]
     * @param {string} property
     * @param {any} value
     * @param {object} receiver
     */
    [SET](property, value, receiver) {
        const {
            [PROXY_HANDLER]: handler,
            [PROXY_TARGET]: target,
        } = this;
        validateProxyHanler('set', handler);
        if (handler.set == UNDEFINED) {
            target[property] = value;
        } else if (typeof handler.set === 'function') {
            const result = handler.set(target, property, value, receiver);
            if (!result) {
                throwTypeError(`Trap 'set' returned false for property '${property}'`);
            }
        } else {
            throwTrapNotFunction('set', handler.set);
        }
    }

    /**
     * The implementation of internal method [[Call]]
     * @param {object} thisArg
     * @param {any[]} argList
     * @returns {any}
     */
    [CALL](thisArg, argList) {
        const {
            [PROXY_HANDLER]: handler,
            [PROXY_TARGET]: target,
        } = this;
        validateProxyHanler('apply', handler);
        if (handler.apply == UNDEFINED) {
            return target.apply(thisArg, argList);
        }
        if (typeof handler.apply === 'function') {
            return handler.apply(target, thisArg, argList);
        }
        throwTrapNotFunction('apply', handler.apply);
    }

    /**
     * The implementation of internal method [[Construct]]
     * @param {any[]} argList
     * @param {object} newTarget
     * @returns {object}
     */
    [CONSTRUCT](argList, newTarget) {
        const {
            [PROXY_HANDLER]: handler,
            [PROXY_TARGET]: target,
        } = this;
        validateProxyHanler('construct', handler);

        let newObj;
        if (handler.construct == UNDEFINED) {
            newObj = evaluateNew(target, argList);
        } else if (typeof handler.construct === 'function') {
            newObj = handler.construct(target, argList, newTarget);
        } else {
            throwTrapNotFunction('construct', handler.construct);
        }

        if (isObject(newObj)) {
            return newObj;
        } else {
            throwTypeError(`Trap 'construct' returned non-object: ${newObj}`);
        }
    }

};

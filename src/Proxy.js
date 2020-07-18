import Internal from './Internal';
import {
    UNDEFINED,
} from './constants';
import {
    throwTypeError,
} from './tools';



export default class Proxy {
    
    /**
     * @constructor
     * @param {object} target
     * @param {object} handler
     */
    constructor(target, handler) {
        if (this instanceof Proxy) {
            return Internal.ProxyCreate(target, handler).proxy;
        } else {
            throwTypeError("Constructor Proxy requires 'new'");
        }
    }


    /**
     * Create a revocable Proxy object
     * @param {object} target 
     * @param {object} handler 
     * @returns {{proxy: Proxy, revoke: function}}
     */
    static revocable(target, handler) {
        if (this instanceof Proxy.revocable) {
            throwTypeError('Proxy.revocable is not a constructor');
        }
        const {proxy, internal} = Internal.ProxyCreate(target, handler);
        return {
            proxy,
            revoke() {
                internal.ProxyTarget = UNDEFINED;
                internal.ProxyHandler = UNDEFINED;
            },
        };
    }

}

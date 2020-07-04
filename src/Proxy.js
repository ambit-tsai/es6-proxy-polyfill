import Internal from './Internal';
import {
    createProxy,
} from './functions';
import {
    throwTypeError,
} from './tools';
import {
    PROXY_TARGET,
    PROXY_HANDLER,
    UNDEFINED,
} from './constants';



export default class Proxy {
    /**
     * @constructor
     * @param {object} target
     * @param {object} handler
     */
    constructor(target, handler) {
        if (this instanceof Proxy) {
            return createProxy(new Internal(target, handler));
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
        const internal = new Internal(target, handler);
        const proxy = createProxy(internal);
        return {
            proxy,
            revoke() {
                internal[PROXY_TARGET] = UNDEFINED;
                internal[PROXY_HANDLER] = UNDEFINED;
            },
        };
    }

}

import {
    KEY_TO_INTERNAL,
    PROXY_FLAG,
} from './constants';
import {
    supportES5,
    isProxyObject,
    getProxyProto,
    isExtensible,
    preventExtensions,
    getPrototypeOf,
    setPrototypeOf,
} from './tools';



if (supportES5) {
    Object.isExtensible = function (obj) {
        if (isProxyObject(obj)) {
            const map = {key: KEY_TO_INTERNAL};
            getProxyProto(obj)[PROXY_FLAG] = map;
            return map.internal.IsExtensible();
        }
        return isExtensible(obj);
    };

    
    Object.preventExtensions = function (obj) {
        if (isProxyObject(obj)) {
            const map = {key: KEY_TO_INTERNAL};
            getProxyProto(obj)[PROXY_FLAG] = map;
            map.internal.PreventExtensions();
            return obj;
        }
        return preventExtensions(obj);
    };


    Object.getPrototypeOf = function (obj) {
        if (isProxyObject(obj)) {
            const map = {key: KEY_TO_INTERNAL};
            getProxyProto(obj)[PROXY_FLAG] = map;
            return map.internal.GetPrototypeOf();
        }
        return getPrototypeOf(obj);
    };


    Object.setPrototypeOf = function (obj, prototype) {
        if (isProxyObject(obj)) {
            const map = {key: KEY_TO_INTERNAL};
            getProxyProto(obj)[PROXY_FLAG] = map;
            return map.internal.SetPrototypeOf(prototype);
        }
        return setPrototypeOf(obj, prototype);
    };

}

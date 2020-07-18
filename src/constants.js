/**
 * Global object
 */
export const Global = typeof window === 'object' && window
    || typeof global === 'object' && global
    || typeof self === 'object' && self
    || this;


export const Object = Global.Object;
export const Reflect = Global.Reflect;


export const UNDEFINED = undefined;
export const PROXY_FLAG = '__PROXY__';
export const REVOKED_FLAG = 'Revoked';
export const KEY_TO_INTERNAL = {};
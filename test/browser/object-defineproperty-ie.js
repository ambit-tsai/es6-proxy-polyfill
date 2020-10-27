/**
 * Object.defineProperty Sham For IE
 * @version 3.1.0
 * @author Ambit Tsai <ambit_tsai@qq.com>
 * @license Apache-2.0
 * @see {@link https://github.com/ambit-tsai/object-defineproperty-ie}
 */
(function (window, Object) {
    // Constant variables
    var UNDEFINED;  // => undefined
    var DEFINE_PROPERTY = 'defineProperty';
    var DEFINE_PROPERTIES = 'defineProperties';
    var GET_OWN_PROPERTY_DESCRIPTOR = 'getOwnPropertyDescriptor';
    var GET_OWN_PROPERTY_DESCRIPTORS = GET_OWN_PROPERTY_DESCRIPTOR + 's';   // => "getOwnPropertyDescriptors"
    var DESCRIPTOR_NOT_OBJECT = 'Property description must be an object: ';
    var INTERNAL_NAME = '__INTERNAL__';
    var ENUMERABLE = 'enumerable';
    var CONFIGURABLE = 'configurable';
    var VALUE = 'value';
    var WRITABLE = 'writable';
    var GET = 'get';
    var SET = 'set';


    /**
     * Hack `Object.getOwnPropertyNames`
     * @param {object} obj
     * @returns {string[]}
     */
    var getOwnPropertyNames = Object.getOwnPropertyNames || function (obj) {
        var names = [];
        forEach(obj, function (key) {
            names.push(key);
        });
        return names;
    };


    // Sham for `Object.defineProperty`
    if (Object[DEFINE_PROPERTY]) {
        try {
            // In IE 8, `Object.defineProperty` is only effective on `Element` object, 
            // `document` and `window`. The program will throw an exception when 
            // `Object.defineProperty` works with other objects.
            Object[DEFINE_PROPERTY]({}, '', {});
        } catch(err) {
            var _defineProperty = Object[DEFINE_PROPERTY];
            Object[DEFINE_PROPERTIES] = function (obj, props) {
                // Use the native method for `Element` object, `document` and `window`
                if (obj instanceof Element || obj === document || obj === window) {
                    if (!isObject(props)) {
                        throwTypeError(DESCRIPTOR_NOT_OBJECT + props);
                    }
                    forEach(props, function (key, desc) {
                        _defineProperty(obj, key, desc);
                    });
                    return obj;
                } else {
                    return implementDefineProperties(obj, props);
                }
            };
            Object[DEFINE_PROPERTY] = function (obj, key, desc) {
                var props = {};
                props[key] = desc;
                return Object[DEFINE_PROPERTIES](obj, props);
            };
        }
    } else {
        Object[DEFINE_PROPERTY] = function (obj, key, desc) {
            var props = {};
            props[key] = desc;
            return implementDefineProperties(obj, props);
        };
    }


    // Sham for `Object.defineProperties`
    if (!Object[DEFINE_PROPERTIES]) {
        if (/\[native code\]/.test(Object[DEFINE_PROPERTY].toString())) {
            // Use the native method `Object.defineProperty`
            Object[DEFINE_PROPERTIES] = function (obj, props) {
                if (!isObject(props)) {
                    throwTypeError(DESCRIPTOR_NOT_OBJECT + props);
                }
                forEach(props, function (key, desc) {
                    Object[DEFINE_PROPERTY](obj, key, desc);
                });
                return obj;
            };
        } else {
            Object[DEFINE_PROPERTIES] = implementDefineProperties;
        }
    }


    // Sham for `Object.getOwnPropertyDescriptor`
    if (!Object[GET_OWN_PROPERTY_DESCRIPTOR]) {
        Object[GET_OWN_PROPERTY_DESCRIPTOR] = implementGetOwnPropertyDescriptor;
    } else if (Object[GET_OWN_PROPERTY_DESCRIPTOR](window, CONFIGURABLE + CONFIGURABLE)) {
        // In IE 8, `Object.getOwnPropertyDescriptor` will not return an `undefined` when 
        // using it to get the descriptor of a property that do not exist, and it's only 
        // effective on `Element` object, `document` and `window`.
        var _getOwnPropertyDescriptor = Object[GET_OWN_PROPERTY_DESCRIPTOR];
        Object[GET_OWN_PROPERTY_DESCRIPTOR] = function (obj, key) {
            if (obj instanceof Element || obj === document || obj === window) {
                return hasOwnProperty(obj, key) ? _getOwnPropertyDescriptor(obj, key) : UNDEFINED;
            } else {
                return implementGetOwnPropertyDescriptor(obj, key);
            }
        };
    }


    // Shim for `Object.getOwnPropertyDescriptors`
    if (!Object[GET_OWN_PROPERTY_DESCRIPTORS]) {
        Object[GET_OWN_PROPERTY_DESCRIPTORS] = function (obj) {
            var names = getOwnPropertyNames(obj);
            var descMap = {};
            for (var i = names.length - 1; i >= 0; --i) {
                var key = names[i];
                var desc = Object[GET_OWN_PROPERTY_DESCRIPTOR](obj, key);
                if (desc) descMap[key] = desc;
            }
            return descMap;
        };
    }





    /**
     * Check if value is the language type of Object
     * @param {any} value 
     * @returns {boolean}
     */
    function isObject(value) {
        return value
            ? typeof value === 'object' || typeof value === 'function'
            : false;
    }


    /**
     * Throw a type error
     * @param {string} message 
     */
    function throwTypeError(message) {
        throw new TypeError(message);
    }


    /**
     * Execute a provided function once for each property
     * @param {object} obj 
     * @param {(key: string, value: any) => undefined} fn 
     */
    function forEach(obj, fn) {
        for (var key in obj) {
            if (hasOwnProperty(obj, key)) {
                fn(key, obj[key]);
            }
        }
    }


    /**
     * Check if key is an own property of object
     * @param {object} obj 
     * @param {string} key 
     * @returns {boolean}
     */
    function hasOwnProperty(obj, key) {
        return Object.prototype.hasOwnProperty.call(obj, key);
    }


    /**
     * The internal implementation of `Object.defineProperties`
     * @param {object} obj 
     * @param {object} props descriptors
     * @returns {object}
     */
    function implementDefineProperties(obj, props) {
        if (!isObject(obj)) {
            throwTypeError('Method called on non-object');
        }
        if (!isObject(props)) {
            throwTypeError(DESCRIPTOR_NOT_OBJECT + props);
        }

        // Check descriptors
        var names = getOwnPropertyNames(props);
        var descMap = {}, hasNewProperty;
        for (var i = names.length - 1; i >= 0; --i) {
            var key = names[i];
            var desc = toPropertyDescriptor(props[key]);
            descMap[key] = desc;
            if (!hasOwnProperty(obj, key)) {
                hasNewProperty = true;
            }
        }

        if (!names.length && !getOwnPropertyNames(obj).length) {
            return obj;
        } else if (isVbObject(obj) && !hasNewProperty) {
            mergePropertyDescriptors(getVbInternalOf(obj).props, descMap);
            return obj;
        } else {
            props = Object[GET_OWN_PROPERTY_DESCRIPTORS](obj);
            mergePropertyDescriptors(props, descMap);
            return createVbObject(props);
        }
    }


    /**
     * Convert to a standard descriptor
     * @param {object} obj
     * @returns {object} descriptor
     */
    function toPropertyDescriptor(obj) {
        if (!isObject(obj)) {
            throwTypeError(DESCRIPTOR_NOT_OBJECT + obj);
        }

        var desc = {};
        if (ENUMERABLE in obj) desc[ENUMERABLE] = !!obj[ENUMERABLE];
        if (CONFIGURABLE in obj) desc[CONFIGURABLE] = !!obj[CONFIGURABLE];
        if (VALUE in obj) desc[VALUE] = obj[VALUE];
        if (WRITABLE in obj) desc[WRITABLE] = !!obj[WRITABLE];
        if (GET in obj) {
            if (typeof obj[GET] !== 'function' && obj[GET] !== UNDEFINED) {
                throwTypeError('Getter must be a function: ' + obj[GET]);
            } else {
                desc[GET] = obj[GET];
            }
        }
        if (SET in obj) {
            if (typeof obj[SET] !== 'function' && obj[SET] !== UNDEFINED) {
                throwTypeError('Setter must be a function: ' + obj[SET]);
            } else {
                desc[SET] = obj[SET];
            }
        }
        if ((GET in desc || SET in desc) && (VALUE in desc || WRITABLE in desc)) {
            throwTypeError('Cannot both specify accessors and a value or writable attribute');
        }
        return desc;
    }


    /**
     * Check if object is the type of custom VB Object
     * @param {object} obj
     * @returns {boolean}
     */
    function isVbObject(obj) {
        if (!(INTERNAL_NAME in obj)) {
            try {
                obj[INTERNAL_NAME] = 0; // VB object can't add properties freely
                delete obj[INTERNAL_NAME];
            } catch(err) {
                return true;
            }
        }
        return false;
    }


    // Exposed to global
    window._isVbObject = isVbObject;


    /**
     * Get the internal data of custom VB object
     * @param {object} vbObj 
     * @returns {object}
     */
    function getVbInternalOf(vbObj) {
        for (var key in vbObj) {
            vbObj[key] = Internal;
            return vbObj[key];
        }
    }


    // Exposed to global
    window._getVbInternalOf = getVbInternalOf;


    /**
     * The object to store internal data 
     * @constructor
     * @param {object} descriptors
     */
    function Internal(descriptors) {
        this.props = descriptors;
        this.keyMap = {};
        this.canGetData = UNDEFINED;    // a flag used to judge whether return internal data
        this.getterReturn = UNDEFINED;  // a variable that cache the getter return value
    }


    /**
     * Getter
     * @param {number} index the index of key
     * @param {object} ctx context
     * @returns {boolean} is `getterReturn` an object
     */
    Internal.prototype.getter = function (index, ctx) {
        if (this.canGetData === index) {
            this.getterReturn = this;       // return internal data
            this.canGetData = UNDEFINED;    // reset flag
            return true;
        }

        var key = this.keyMap[index];
        var desc = this.props[key];
        this.getterReturn = desc[GET] 
            ? desc[GET].call(ctx)
            : desc[VALUE];
        return isObject(this.getterReturn);
    };


    /**
     * Setter
     * @param {number} index the index of key
     * @param {object} ctx context
     * @param {any} val value
     */
    Internal.prototype.setter = function (index, ctx, val) {
        // Constructor `Internal` is used as a key
        if (val === Internal) {
            this.canGetData = index;
            return;
        }

        var key = this.keyMap[index];
        var desc = this.props[key];
        if (desc[WRITABLE]) {
            desc[VALUE] = val;
        } else if (desc[SET]) {
            desc[SET].call(ctx, val);
        }
    };


    /**
     * Merge every descriptor of source into target
     * @param {object} target descriptor map
     * @param {object} source descriptor map
     */
    function mergePropertyDescriptors(target, source) {
        forEach(source, function (key, sDesc) {
            var tDesc = target[key];
            if (tDesc) {
                // Validate
                if (tDesc[CONFIGURABLE] === false && ((
                    VALUE in tDesc && (
                        sDesc[CONFIGURABLE] || GET in sDesc || SET in sDesc 
                        || (!tDesc[WRITABLE] && VALUE in sDesc && sDesc[VALUE] !== tDesc[VALUE])
                        || (!tDesc[WRITABLE] && sDesc[WRITABLE])
                        || (ENUMERABLE in sDesc && sDesc[ENUMERABLE] !== tDesc[ENUMERABLE]) 
                    )
                ) || (
                    GET in tDesc && (
                        sDesc[CONFIGURABLE] || VALUE in sDesc || WRITABLE in sDesc 
                        || (ENUMERABLE in sDesc && sDesc[ENUMERABLE] !== tDesc[ENUMERABLE])
                    )
                ))) {
                    throwTypeError('Cannot redefine property: ' + key);
                }
            } else {
                // Set default value
                tDesc = {};
                tDesc[VALUE] = UNDEFINED;
                tDesc[WRITABLE] = false;
                tDesc[ENUMERABLE] = false;
                tDesc[CONFIGURABLE] = false;
            }

            // Merge
            target[key] = sDesc;
            if (VALUE in sDesc || WRITABLE in sDesc) {
                if (!(VALUE in sDesc)) sDesc[VALUE] = tDesc[VALUE];
                if (!(WRITABLE in sDesc)) sDesc[WRITABLE] = tDesc[WRITABLE];
            } else if (GET in sDesc || SET in sDesc) {
                if (!(GET in sDesc)) sDesc[GET] = tDesc[GET];
                if (!(SET in sDesc)) sDesc[SET] = tDesc[SET];
            } else if (VALUE in tDesc) {
                sDesc[VALUE] = tDesc[VALUE];
                sDesc[WRITABLE] = tDesc[WRITABLE];
            } else {
                sDesc[GET] = tDesc[GET];
                sDesc[SET] = tDesc[SET];
            }
            if (!(ENUMERABLE in sDesc)) sDesc[ENUMERABLE] = tDesc[ENUMERABLE];
            if (!(CONFIGURABLE in sDesc)) sDesc[CONFIGURABLE] = tDesc[CONFIGURABLE];
        });
    }


    /**
     * Custom VB object factory
     * @param {object} descriptors 
     * @returns {object} VB object 
     */
    function createVbObject(descriptors) {
        // Generate VB script
        var UID = window.setTimeout(Object);        // generate an unique id
        var INTERNAL = '[' + INTERNAL_NAME + ']';   // => "[__INTERNAL__]"
        var buffer = [
            'Class VbClass' + UID,
            '  Private ' + INTERNAL
        ];
        var i = 0;
        var internal = new Internal(descriptors);
        forEach(descriptors, function (key) {
            if (key === INTERNAL_NAME) {
                throwTypeError('Property "' + key + '" is the reserved word of "object-defineproperty-ie"');
            }
            var prop = '[' + key + ']';
            var arg = key === 'val' ? 'v' : 'val';
            buffer.push(
                '  Public Property Get ' + prop,
                '    If ' + INTERNAL + '.getter(' + i + ', ME) Then',
                '      Set ' + prop + ' = ' + INTERNAL + '.getterReturn',
                '    Else',
                '      ' + prop + ' = ' + INTERNAL + '.getterReturn',
                '    End If',
                '  End Property',
                '  Public Property Let ' + prop + '(' + arg + ')',
                '    ' + INTERNAL + '.setter ' + i + ', ME, ' + arg,
                '  End Property',
                '  Public Property Set ' + prop + '(' + arg + ')'
            );
            if (i) {
                buffer.push(
                    '    ' + INTERNAL + '.setter ' + i + ', ME, ' + arg
                );
            } else {
                // Initialize `__INTERNAL__` at index 0
                buffer.push(
                    '    If isEmpty(' + INTERNAL + ') Then',
                    '      Set ' + INTERNAL + ' = ' + arg,
                    '    Else',
                    '      ' + INTERNAL + '.setter ' + i + ', ME, ' + arg,
                    '    End If'
                );
            }
            buffer.push('  End Property');
            internal.keyMap[i++] = key;
        });
        buffer.push(
            'End Class',
            'Function VbFactory' + UID + '()',
            '  Set VbFactory' + UID + ' = New VbClass' + UID,
            'End Function'
        );
        
        window.execScript(buffer.join('\r\n'), 'VBS');  // execute the VB script
        var vbObj = window['VbFactory' + UID]();        // use the factory to create an object
        vbObj[ internal.keyMap[0] ] = internal;         // initialize internal internal
        return vbObj;
    }


    /**
     * The internal implementation of `Object.getOwnPropertyDescriptor`
     * @param {object} obj 
     * @param {string} key 
     * @returns {object}
     */
    function implementGetOwnPropertyDescriptor(obj, key) {
        if (!hasOwnProperty(obj, key)) {
            return;
        }
        
        // Custom VB object
        if (isVbObject(obj)) {
            return objectAssign({}, getVbInternalOf(obj).props[key]);
        }
        
        // Others
        var desc = {};
        desc[VALUE] = obj[key];
        desc[WRITABLE] = true;
        desc[CONFIGURABLE] = true;
        desc[ENUMERABLE] = false;
        for (var prop in obj) {
            if (prop === key) {
                desc[ENUMERABLE] = true;
                break;
            }
        }
        return desc;
    }
    
    
    /**
     * Hack `Object.assign`
     * @param {object} target 
     * @param {object} source 
     * @returns {object}
     */
    function objectAssign(target, source) {
        forEach(source, function (key, value) {
            target[key] = value;
        });
        return target;
    }
}(window, Object));

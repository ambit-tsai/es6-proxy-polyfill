describe('Call `Proxy` as a constructor', function () {
    new Proxy({}, {});
});


describe('Throw when calling `Proxy` as a function', function () {
    expect(function () {
        Proxy({}, {});
    }).to.throwException(function (ex) {
        expect(ex).to.be.a(TypeError);
    });
});


describe('Throw when target is not an object', function () {
    expect(function () {
        new Proxy('non-object', {});
    }).to.throwException(function (ex) {
        expect(ex).to.be.a(TypeError);
    });
});


describe('Throw when handler is not an object', function () {
    expect(function () {
        new Proxy({}, 'non-object');
    }).to.throwException(function (ex) {
        expect(ex).to.be.a(TypeError);
    });
});



describe('Trap `get` is a function', function () {
    var obj = {a: 1};
    var proxy = new Proxy(obj, {
        get: function (target, property, receiver) {
            if (target === obj && property === 'a' && receiver === proxy) {
                return 2;
            }
        }
    });
    expect(proxy.a).to.be(2);
});


describe('Trap `get` is undefined', function () {
    var proxy = new Proxy({a: 1}, {
        get: undefined
    });
    expect(proxy.a).to.be(1);
});


describe('Trap `get` is null', function () {
    var proxy = new Proxy({a: 1}, {
        get: null
    });
    expect(proxy.a).to.be(1);
});


describe('Throw when trap `get` is not a function', function () {
    expect(function () {
        var proxy = new Proxy({a: 1}, {
            get: 2
        });
        proxy.a;
    }).to.throwException(function (ex) {
        expect(ex).to.be.a(TypeError);
    });
});



describe('Trap `set` is a function', function () {
    var obj = {a: 1};
    var proxy = new Proxy(obj, {
        set: function (target, property, value, receiver) {
            if (target === obj && property === 'a' && value === 2 && receiver === proxy) {
                target.a = 3;
                return true;
            }
        }
    });
    proxy.a = 2;
    expect(proxy.a).to.be(3);
});


describe('Trap `set` is undefined', function () {
    var proxy = new Proxy({a: 1}, {
        set: undefined
    });
    proxy.a = 2;
    expect(proxy.a).to.be(2);
});


describe('Trap `set` is null', function () {
    var proxy = new Proxy({a: 1}, {
        set: null
    });
    proxy.a = 2;
    expect(proxy.a).to.be(2);
});


describe('Throw when trap `set` is not a function', function () {
    expect(function () {
        var proxy = new Proxy({a: 1}, {
            set: 2
        });
        proxy.a = 3;
    }).to.throwException(function (ex) {
        expect(ex).to.be.a(TypeError);
    });
});


describe('Throw when trap `set` return false in strict mode', function () {
    expect(function () {
        'use strict'
        var proxy = new Proxy({a: 1}, {
            set: function () {
                return false;
            }
        });
        proxy.a = 2;
    }).to.throwException(function (ex) {
        expect(ex).to.be.a(TypeError);
    });
});



describe('Trap `apply` is a function', function () {
    function fn() {
        return 1;
    }
    var ctx = {};
    var proxy = new Proxy(fn, {
        apply: function (target, thisArg, argList) {
            if (target === fn && thisArg === ctx && argList.length === 1 && argList[0] === 2) {
                return 3;
            }
        }
    });
    expect(proxy.call(ctx, 2)).to.be(3);
});


describe('Trap `apply` is undefined', function () {
    function fn() {
        return 1;
    }
    var proxy = new Proxy(fn, {
        apply: undefined
    });
    expect(proxy()).to.be(1);
});


describe('Trap `apply` is null', function () {
    function fn() {
        return 1;
    }
    var proxy = new Proxy(fn, {
        apply: null
    });
    expect(proxy()).to.be(1);
});


describe('Throw when trap `apply` is not a function', function () {
    expect(function () {
        var proxy = new Proxy({}, {
            apply: 1
        });
        proxy();
    }).to.throwException(function (ex) {
        expect(ex).to.be.a(TypeError);
    });
});


describe('Throw when calling trap `apply` with non-function target', function () {
    expect(function () {
        var proxy = new Proxy({}, {
            apply: function () {}
        });
        proxy();
    }).to.throwException(function (ex) {
        expect(ex).to.be.a(TypeError);
    });
});



describe('Trap `construct` is a function', function () {
    function Test(a) {
        this.a = a;
    }
    var proxy = new Proxy(Test, {
        construct: function (target, argList, newTarget) {
            if (target === Test && argList.length === 1 && argList[0] === 2 && newTarget === proxy) {
                return new target(3);
            }
        }
    });
    expect(new proxy(2).a).to.be(3);
});


describe('Trap `construct` is undefined', function () {
    function Test(a) {
        this.a = a;
    }
    var proxy = new Proxy(Test, {
        construct: undefined
    });
    expect(new proxy(1).a).to.be(1);
});


describe('Trap `construct` is null', function () {
    function Test(a) {
        this.a = a;
    }
    var proxy = new Proxy(Test, {
        construct: null
    });
    expect(new proxy(1).a).to.be(1);
});


describe('Throw when trap `construct` is not a function', function () {
    function Test(a) {
        this.a = a;
    }
    expect(function () {
        var proxy = new Proxy(Test, {
            construct: 1
        });
        new proxy();
    }).to.throwException(function (ex) {
        expect(ex).to.be.a(TypeError);
    });
});


describe('Throw when trap `construct` does not return an object', function () {
    function Test(a) {
        this.a = a;
    }
    expect(function () {
        var proxy = new Proxy(Test, {
            construct: function () {
                return 1;
            }
        });
        new proxy();
    }).to.throwException(function (ex) {
        expect(ex).to.be.a(TypeError);
    });
});


describe('Throw when calling trap `construct` with non-constructor target', function () {
    expect(function () {
        var proxy = new Proxy({}, {
            construct: function () {
                return {};
            }
        });
        new proxy();
    }).to.throwException(function (ex) {
        expect(ex).to.be.a(TypeError);
    });
});


describe('Call `Proxy.revocable` as a function', function () {
    var revocable = Proxy.revocable({}, {});
    expect(revocable.revoke).to.be.a(Function);
});


describe('Throw when calling `Proxy.revocable` as a constructor', function () {
    expect(function () {
        new Proxy.revocable({}, {});
    }).to.throwException(function (ex) {
        expect(ex).to.be.a(TypeError);
    });
});


describe('Throw when performing `get` on a revoked proxy', function () {
    expect(function () {
        var revocable = Proxy.revocable({a: 1}, {});
        revocable.revoke();
        revocable.proxy.a;
    }).to.throwException(function (ex) {
        expect(ex).to.be.a(TypeError);
    });
});


describe('Throw when performing `set` on a revoked proxy', function () {
    expect(function () {
        var revocable = Proxy.revocable({a: 1}, {});
        revocable.revoke();
        revocable.proxy.a = 2;
    }).to.throwException(function (ex) {
        expect(ex).to.be.a(TypeError);
    });
});


describe('Throw when performing `apply` on a revoked proxy', function () {
    expect(function () {
        var revocable = Proxy.revocable(function () {}, {});
        revocable.revoke();
        revocable.proxy();
    }).to.throwException(function (ex) {
        expect(ex).to.be.a(TypeError);
    });
});


describe('Throw when performing `construct` on a revoked proxy', function () {
    expect(function () {
        var revocable = Proxy.revocable(function () {}, {});
        revocable.revoke();
        new revocable.proxy();
    }).to.throwException(function (ex) {
        expect(ex).to.be.a(TypeError);
    });
});
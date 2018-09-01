require('../../src/es6-proxy-polyfill');

var person = {
	name: "Ambit_Tsai",
	sayHello: function(){
		console.log(">"+this.name+": Hey man!");
	}
};
person.sayHello = new Proxy(person.sayHello, {
	apply: function(func, ctx, args){
		console.log("Trigger 'apply' trap");
		func.apply(ctx, args);
	}
});

console.log("Call 'sayHello' method");
person.sayHello();
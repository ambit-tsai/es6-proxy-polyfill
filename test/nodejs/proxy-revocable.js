require('../../dist/es6-proxy-polyfill');

var person = {
	name: "Ambit_Tsai",
	sayHello: function(){
		console.log(">"+this.name+": Hey man!");
	}
};
var result = Proxy.revocable(person.sayHello, {
	apply: function(func, ctx, args){
		console.log("Trigger 'apply' trap");
		func.apply(ctx, args);
	}
});
person.sayHello = result.proxy;

console.log("Call 'sayHello' method");
person.sayHello();

console.log("Revoke proxy");
result.revoke();

try{
	console.log("Call 'sayHello' method again");
	person.sayHello();
}catch(err){
	console.log(err.message);
}
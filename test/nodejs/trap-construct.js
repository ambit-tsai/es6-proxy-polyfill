require('../../src/es6-proxy-polyfill');

function Person(name){
	console.log("Property 'name' is initialized to '"+name+"'");
	this.name = name;
}
Person.prototype.sayHello = function(){
	console.log(">"+this.name+": Hey man!");
};
Person.className = "Person";

var ProxyClass = new Proxy(Person, {
	construct: function(Target, args){
		console.log("Trigger 'construct' trap");
		return new Target(args[0]);
	}
});

console.log("ProxyClass's className: '"+ProxyClass.className+"' (Rely on 'Object.assign')");

console.log("Create a ProxyClass object");
var person = new ProxyClass("Ambit_Tsai");

console.log("Call 'sayHello' method");
person.sayHello();
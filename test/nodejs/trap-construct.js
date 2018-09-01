require('../../src/es6-proxy-polyfill');

function Person(name){
	console.log("Set this.name to '"+name+"'");
	this.name = name;
}
Person.prototype.sayHello = function(){
	console.log(">"+this.name+": Hey man!");
};
Person.className = "Person";

var NewPerson = new Proxy(Person, {
	construct: function(Target, args){
		console.log("Trigger 'construct' trap");
		return new Target(args[0]);
	}
});

console.log("NewPerson's className: '"+NewPerson.className+"' (need 'Object.assign')");

console.log("Create a NewPerson object");
var person = new NewPerson("Ambit_Tsai");

console.log("Call 'sayHello' method");
person.sayHello();
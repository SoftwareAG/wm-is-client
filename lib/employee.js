const Person = require('./person');

class Employee extends Person {
    constructor( first, last, mgr) {
        super(first,last);
        this.mgr = mgr;
    }

    displayDetails() {
        console.log( `Employee: ${super.displayDetails()} reports to ${this.mgr.displayDetails()}`);
    }

}
var boss = new Person('Sidney', 'Pao');
var e = new Employee('Warren','Cooper',boss);


console.log(e.displayDetails());
console.log(e.speak());
console.log(Person.myStuff(e));

var boss2 = new Person('Gene');
var e2 = new Employee( 'Marguerite', 'Cooper', boss2);
console.log(e2.displayDetails());
console.log(e2.speak());
console.log(Person.myStuff(e2));

class Person {    
    
    constructor(first, last) {        
        this.fname = first;
        this.lname = last;
    }

    displayDetails() {
        return this.fname+' '+this.lname;
    }

    static myStuff(obj) {
        console.log(`Dumping properties for ${JSON.stringify(obj,null,4)}`);
        for (p in obj) {
            console.log(`${p}, mine? ${obj.hasOwnProperty(p)}` );
        }
    }

};

Person.prototype.speak = () => {
    console.log('Hi there');
};

var p = new Person('Warren','Cooper');
console.log(`person: ${p.displayDetails()}` );
console.log(Person.myStuff(p));

module.exports = Person;
/* Drawbacks:
 * all methods are created for each object again
 * it is not possible to inherit from or implement multiple classes/interfaces
 */


// helper function for inheritance
function inherit(superClass, subClass) {
	subClass.prototype = new superClass();
	subClass.prototype.constructor = subClass;
	subClass.prototype.parent = superClass.prototype;
}

// define the Circle class (i.e. the constructor)
function Circle(radius) {
	if (!(this instanceof Circle)) {
		throw "constructor Circle called as function";
	}

	// define private methods
	function isValidRadius() {
		return (radius > 0);
	}

	// define public methods
	Circle.prototype.diameter = function() {
		// call private method from here
		if (!isValidRadius()) {
			return 0;
		}
		return radius * 2;
	};

	Circle.prototype.area = function() {
		return radius * radius * 3; // very rough approximation
	};
}

//make Sphere inherit from Circle
inherit(Circle, Sphere);

// define the class Sphere (i.e. the constructor)
function Sphere(radius) {
	if (!(this instanceof Sphere)) {
		throw "constructor Sphere called as function";
	}
	// call the super constructor
	this.parent.constructor.call(this, radius);

	// overwrite the area method
	this.area = function() {
		return 4 * this.parent.area.call(this);
	};

	this.increaseRadius = function() {
		radius = radius * 2;
	};
}


// test cases
var ClassTest = TestCase("ClassTest");

/**
 * Tests inheritance model.
 */
ClassTest.prototype.IGNOREDtestInheritance = function() {
	// create circle
	var circle = new Circle(100);
	try {
		assertEquals(100, circle.radius);
		assertFalse("access to private member radius was successful");
	} catch (e) {}

	// call circle constructor as function (should fail)
	try {
		var circle2 = Circle(200);
		assertFalse("calling Circle as function passed successfully");
	} catch (e) {}

	// test class
	assertTrue(circle instanceof Object);
	assertTrue(circle instanceof Circle);
	assertEquals(Circle, circle.constructor);

	// test json
	var jsonData = JSON.stringify(circle);
	//jstestdriver.console.log("circle as json: ", jsonData);
	var circle2 = JSON.parse(jsonData);
	assertTrue(circle2 instanceof Object);
	assertFalse(circle2 instanceof Circle);
	assertNotSame(Circle, circle2.constructor);

	// test methods
	assertEquals(200, circle.diameter());
	assertEquals(30000, circle.area());
	try {
		// isValidRadius should not be accessible because it is a private method
		assertEquals(true, circle.isValidRadius());
		assertFalse("calling private method from outside was successful");
	} catch (e) {}

	// test Sphere
	var sphere = new Sphere(300);
	assertTrue(sphere instanceof Sphere);
	assertTrue(sphere instanceof Circle);
	assertTrue(sphere instanceof Object);
	assertEquals(600, sphere.diameter());


	assertSame(Circle.prototype, Sphere.prototype.parent);

	assertEquals(1080000, sphere.area());

	// changing a private attribute of sphere does not change it in circle
	sphere.increaseRadius();
	assertEquals(600, sphere.diameter()); // would be 1200 otherwise
};



//test inheritance
//helper function for inheritance
if (!Function.prototype.inherit) {
	(function() {
		function F() {}
		Function.prototype.inherit = function(superFn) {
			F.prototype = superFn.prototype;
			this.prototype = new F();
			this.prototype.constructor = this;
			this.prototype._super = superFn.prototype; // this allows calling the super class via "this._super.xxx()"
		};
	}());
}

var TmpTest = TestCase("TmpTest");

/**
 * Tests the inherit helper function.
 */
TmpTest.prototype.testSuper = function() {
	var SubFn = function() {};
	var SuperFn = function() {};
	SubFn.inherit(SuperFn);
	assertEquals(SuperFn.prototype, SubFn.prototype._super);
};

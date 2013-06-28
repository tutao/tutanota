"use strict";

goog.provide('EntropyCollectorTest');

var EntropyCollectorTest = AsyncTestCase("EntropyCollectorTest");

EntropyCollectorTest.prototype.setUp = function() {
	this.collector = new tutao.crypto.EntropyCollector();
};

EntropyCollectorTest.prototype.tearDown = function() {
	this.collector.stop();
	tutao.locator.reset();
};

EntropyCollectorTest.prototype.testMouseclickNotStarted = function(queue) {
	var self = this;
	queue.call('test', function(callbacks) {
		tutao.locator.randomizer.addEntropy = callbacks.addErrback('not started but listened to mouse events');
		
		var e = $.extend($.Event("mouseclick"), {pageX: 888, pageY: 777});
		$("body").trigger(e);
	});
};

EntropyCollectorTest.prototype.testMouseclick = function(queue) {
	var self = this;
	queue.call('test', function(callbacks) {
		this.collector.start();
		tutao.locator.randomizer.addEntropy = callbacks.add(function(number, entropy, source) {
			assertEquals(888 ^ 777, number);
			assertEquals(2, entropy);
			assertEquals("mouse", source);
		});
		
		var e = $.extend($.Event("mouseclick"), {pageX: 888, pageY: 777});
		$("body").trigger(e);
	});
};

EntropyCollectorTest.prototype.testMousemoveNotStarted = function(queue) {
	var self = this;
	queue.call('test', function(callbacks) {
		tutao.locator.randomizer.addEntropy = callbacks.addErrback('not started but listened to mouse events');
		
		var e = $.extend($.Event("mousemove"), {pageX: 888, pageY: 777});
		$("body").trigger(e);
	});
};

EntropyCollectorTest.prototype.testMousemove = function(queue) {
	var self = this;
	queue.call('test', function(callbacks) {
		this.collector.start();
		tutao.locator.randomizer.addEntropy = callbacks.add(function(number, entropy, source) {
			assertEquals(123 ^ 456, number);
			assertEquals(2, entropy);
			assertEquals("mouse", source);
		});
		
		var e = $.extend($.Event("mousemove"), {pageX: 123, pageY: 456});
		$("body").trigger(e);
	});
};

EntropyCollectorTest.prototype.testKeydownNotStarted = function(queue) {
	var self = this;
	queue.call('test', function(callbacks) {
		tutao.locator.randomizer.addEntropy = callbacks.addErrback('not started but listened to key events');
		
		var e = $.extend($.Event("keydown"), {keyCode: '48'});
		$("body").trigger(e);
	});
};

EntropyCollectorTest.prototype.testMousemove = function(queue) {
	var self = this;
	queue.call('test', function(callbacks) {
		this.collector.start();
		tutao.locator.randomizer.addEntropy = callbacks.add(function(number, entropy, source) {
			assertEquals(48, number);
			assertEquals(2, entropy);
			assertEquals("key", source);
		});
		
		var e = $.extend($.Event("keydown"), {keyCode: '48'});
		$("body").trigger(e);
	});
};

EntropyCollectorTest.prototype.testFetchMissingUrls = function(queue) {
	this.collector._ping = JsMockito.mockFunction();
	tutao.locator.randomizer.isReady = function() {
		return true;
	};
	tutao.locator.replaceStatic(Math, Math.random, function() {
		return 0;
	});
	
	var self = this;
	queue.call('test', function(callbacks) {
		self.collector.fetchMissingEntropy();
		JsMockito.verify(self.collector._ping)("www.heise.de", JsHamcrest.Matchers.anything());
	});
};

EntropyCollectorTest.prototype.testFetchMissingUrls = function(queue) {
	var alreadyInvoked = false; 
	tutao.locator.randomizer.isReady = function() {
		if (alreadyInvoked) {
			return true;
		} else {
			alreadyInvoked = true;
			return false;
		}
	};
	
	var self = this;
	queue.call('test', function(callbacks) {
		tutao.locator.randomizer.addEntropy = callbacks.add(function(number, entropy, source) {
			assertTrue(number > 10);
			assertEquals(2, entropy);
			assertEquals("ping", source);
		}, 1);
		
		self.collector.fetchMissingEntropy(callbacks.add(function() {
		}));
	});
};
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

// TODO (before beta) enable and fix
//EntropyCollectorTest.prototype.testFetchMissingUrlsPing = function(queue) {
//	var spy = JsMockito.spy(this.collector);
//	var alreadyInvoked = false; 
//	tutao.locator.randomizer.isReady = function() {
//		if (alreadyInvoked) {
//			return true;
//		} else {
//			alreadyInvoked = true;
//			return false;
//		}
//	};
//	tutao.locator.replaceStatic(tutao.crypto.EntropyCollector, tutao.crypto.EntropyCollector._getRandomNumber, function() {
//		return 0; // corresponds to www.heise.de
//	});
//
//	var self = this;
//	queue.call('test', function(callbacks) {
//		spy.fetchMissingEntropy(callbacks.add(function() {
//			JsMockito.verify(spy._ping)("www.heise.de", JsHamcrest.Matchers.anything());
//		}));
//	});
//};

EntropyCollectorTest.prototype.testFetchMissingUrlsAddEntropy = function(queue) {
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
		
		self.collector.fetchMissingEntropy(callbacks.add(function() {}));
	});
};

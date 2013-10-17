"use strict";

goog.provide('tutao.crypto.EntropyCollector');

/**
 * Automatically collects entropy and feeds it into the Randomizer.
 *  TODO (story RSA review) extend the testcase in order to test all cases (initialization with Math.random/crypto.getRandomValues).
 */
tutao.crypto.EntropyCollector = function() {
	this.intervalId = null;
};

/**
 * Starts collecting entropy.
 */
tutao.crypto.EntropyCollector.prototype.start = function() {
	if (window.performance && window.performance.timing) {
		// get values from window.performance.timing
		var values = window.performance.timing;
		for (var v in values) {
			if (typeof values[v] == "number" && values[v] != 0) {
				tutao.locator.randomizer.addEntropy(values[v], 1, tutao.crypto.RandomizerInterface.ENTROPY_SRC_STATIC);
			}
		}
	}

	// get cryptographically strong values if available
	try {
	    var valueList = new Uint32Array(32);
	    window.crypto.getRandomValues(valueList);
	    for (var i = 0; i < valueList.length; i++) {
	    	tutao.locator.randomizer.addEntropy(valueList[i], 32, tutao.crypto.RandomizerInterface.ENTROPY_SRC_RANDOM);
	    }
	} catch (e) {}
	this.stopped = false;
	$("body").bind("mousemove", this._mouse);
	$("body").bind("mouseclick", this._mouse);
	$("body").bind("keydown", this._keyDown);
	this.intervalId = setInterval(this._random, 1000);

	//TODO (story review rsa lib and secure randomizer): remove after the randomizer state has been saved for the user.
	tutao.locator.randomizer.addEntropy(1, 256, tutao.crypto.RandomizerInterface.ENTROPY_SRC_RANDOM);
};

/**
 * Stops collecting entropy.
 */
tutao.crypto.EntropyCollector.prototype.stop = function() {
	this.stopped = true;
	$("body").unbind("mousemove", this._mouse);
	$("body").unbind("mouseclick", this._mouse);
	$("body").unbind("keydown", this._keyDown);
	clearInterval(this.intervalId);
};

/**
 * Add data from the given mouse event as entropy.
 */
tutao.crypto.EntropyCollector.prototype._mouse = function(e) {
	var value = e.pageX ^ e.pageY;
	tutao.locator.randomizer.addEntropy(value, 2, tutao.crypto.RandomizerInterface.ENTROPY_SRC_MOUSE);
};

/**
 * Add data from the given key event as entropy.
 */
tutao.crypto.EntropyCollector.prototype._keyDown = function(e) {
	var value = e.keyCode;
	tutao.locator.randomizer.addEntropy(value, 2, tutao.crypto.RandomizerInterface.ENTROPY_SRC_KEY);
};

/**
 * Add data from either secure random source or Math.random as entropy.
 */
tutao.crypto.EntropyCollector.prototype._random = function() {
	try {
		// get cryptographically strong values if available
	    var valueList = new Uint32Array(1);
	    window.crypto.getRandomValues(valueList);
	    tutao.locator.randomizer.addEntropy(valueList[0], 32, tutao.crypto.RandomizerInterface.ENTROPY_SRC_RANDOM);
	  } catch (e) {
		 var value = Math.floor(tutao.crypto.EntropyCollector._getRandomNumber() * 0x100000000);
		 tutao.locator.randomizer.addEntropy(value, 1, tutao.crypto.RandomizerInterface.ENTROPY_SRC_RANDOM);
	  }
};

/**
 * A wrapper for Math.random().
 */
tutao.crypto.EntropyCollector._getRandomNumber = function() {
	return Math.random();
};

/**
 * Fetches the missing entropy by pinging URLs from tutao.crypto.EntropyCollector.URLs and measuring the response times.
 * @param {function()} callback Called when the randomizer has been initialized.
 */
tutao.crypto.EntropyCollector.prototype.fetchMissingEntropy = function(callback) {
	var self = this;
	if (tutao.locator.randomizer.isReady()) {
		callback();
		return;
	}
	var url = tutao.crypto.EntropyCollector.URLs[Math.floor(tutao.crypto.EntropyCollector._getRandomNumber() * (tutao.crypto.EntropyCollector.URLs.length + 1))];

	this._ping(url, function(diff) {
		tutao.locator.randomizer.addEntropy(diff, 2, tutao.crypto.RandomizerInterface.ENTROPY_SRC_PING);
		if (!tutao.locator.randomizer.isReady()) {
			self.fetchMissingEntropy(callback);
		} else {
			callback();
		}
	});
};

tutao.crypto.EntropyCollector.URLs = ["www.heise.de", "www.cnn.com", "www.google.cn", "www.facebook.com", "www.mail.ru", "www.linkedin.com", "www.hotmail.com", "www.rakuten.co.jp", "www.aol.com", "www.yahoo.com", "www.craigslist.org", "www.imageshack.us", "www.imdb.com", "www.bbc.com", "www.cnet.com", "www.paypal.com", "www.fc2.com", "www.tudou.com", "www.photobucket.com", "www.flickr.com", "www.about.com", "www.windows.com", "www.apple.com", "www.sohu.com", "www.ebay.com", "www.myspace.com", "www.youku.com", "www.yahoo.co.jp", "www.amazon.com", "www.taobao.com", "www.twitter.com", "www.ask.com", "www.adobe.com", "www.bing.com", "www.sina.com.cn", "www.qq.com", "www.baidu.com", "www.msn.com"];

/**
 * @param {string} url The url to ping.
 * @param {function(number)} callback Called when the ping has been finished. The time that it took to ping the url is passed to the callback.
 */
tutao.crypto.EntropyCollector.prototype._ping = function(url, callback) {
	var img = new Image();
	var start = new Date().getTime();

	var resultCallback = function() {
		var diff = new Date().getTime() - start;
		callback(diff);
	};

	img.onload = resultCallback;
	img.onerror = resultCallback;

	img.src = "http://" + url + "/time=" + new Date().getTime();
};

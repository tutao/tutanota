"use strict";

goog.provide('BucketTestUtils');

BucketTestUtils.createDummyBucketData = function() {
	return new tutao.entity.BucketData("--------------", tutao.locator.aesCrypter.generateRandomKey());
};
"use strict";

tutao.provide('BucketTestUtils');

BucketTestUtils.createDummyBucketData = function() {
	return new tutao.entity.BucketData(tutao.rest.EntityRestInterface.GENERATED_MIN_ID, tutao.locator.aesCrypter.generateRandomKey());
};
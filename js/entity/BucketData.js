"use strict";

goog.provide('tutao.entity.BucketData');

/**
 * BucketData encapsulates the reference and the key of a Bucket.
 * @param {String} bucketId The id of the bucket.
 * @param {Object} bucketKey The bucketKey is the aes key that is used to encrypt all bucket data.
 * @constructor
 */
tutao.entity.BucketData = function(bucketId, bucketKey) {
	this._bucketId = bucketId;
	this._bucketKey = bucketKey;
};

/**
 * Returns the id of the bucket
 * @return {String} The id of the bucket. 
 */
tutao.entity.BucketData.prototype.getBucketId = function() {
	return this._bucketId;
};

/**
 * Returns the key of the bucket
 * @return {Object} The bucketKey is the aes key that is used to encrypt all bucket data.
 */
tutao.entity.BucketData.prototype.getBucketKey = function() {
	return this._bucketKey;
};
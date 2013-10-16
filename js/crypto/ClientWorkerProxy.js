"use strict";

goog.provide('tutao.crypto.ClientWorkerProxy');

/**
 * The worker proxy acts as a proxy to a worker. It is responsible for creating the worker and may receive arbitrary commands for the worker. The worker
 * must contain an implementation that supports the command data. The result is passed back to a callback. A command queue makes sure that only one command at
 * a time is passed to the worker.
 * @constructor
 */
tutao.crypto.ClientWorkerProxy = function() {
	// the queue elements have the following format: {callback: function, operation: name, key: optionalKey, data: optionalData}
	this._queue = [];

	var self = this;

	this._worker = new Worker(tutao.crypto.ClientWorkerProxy.WORKER_FILE);

	this._worker.addEventListener('message', function(event) {
		var executedCommand = self._queue.splice(0, 1)[0]; // remove finished operation from the queue (first element)

		// send the next command now before calling the callback to avoid that inside the callback another command is added, directly executed
		// and then we send the same command again
		if (self._queue.length > 0) {
			self._sendNextOperation();
		}

		// if the message attribute is set, then an exception has occurred
		if (event.data.message) {
			executedCommand.callback(null, event.data.message);
		} else {
			executedCommand.callback(event.data);
		}
	}, false);
	this._worker.onerror = function(event) {
	    throw new Error(event.message + " (" + event.filename + ":" + event.lineno + ")");
	};

	this.sendCommand("initWorker", { imports: tutao.crypto.ClientWorkerProxy.WORKER_IMPORTS }, function() {});
};

tutao.crypto.ClientWorkerProxy.initWorkerFileNames = function(srcPath, libsPath) {
/* begin dev ClientWorkerProxy section */
	//everything inside the dev section is replaced by the correct import for the production version
	tutao.crypto.ClientWorkerProxy.WORKER_FILE = srcPath + 'crypto/ClientWorker.js';
	tutao.crypto.ClientWorkerProxy.WORKER_IMPORTS = [
		libsPath + 'closure-library-base-2012-01-19.js',
		libsPath + 'crypto-jsbn-2012-08-09.js',
		libsPath + 'crypto-sjcl-2012-08-09.js',
		srcPath + 'crypto/AesInterface.js',
		srcPath + 'crypto/SjclAes.js',
		srcPath + 'crypto/RsaInterface.js',
		srcPath + 'crypto/JsbnRsa.js',
		srcPath + 'crypto/CryptoException.js',
		srcPath + 'crypto/RandomizerInterface.js',
		srcPath + 'crypto/SimpleRandomizer.js',
		srcPath + 'crypto/WorkerRandomizer.js',
		srcPath + 'crypto/Oaep.js',
		srcPath + 'util/EncodingConverter.js'
	];
/* end dev ClientWorkerProxy section */
};

/**
 * Pass a command to the worker. The command might be queued and sent later.
 * @param {string} operation A name that identifies the command on the worker side.
 * @param {Object} data An arbitrary object to be passed to the worker.
 * @param {function(?Object,string=)} callback Called when the command is finished. Receives the data result from the worker. If an error occurred, the result is null and an
 * error message is passed as second argument.
 */
tutao.crypto.ClientWorkerProxy.prototype.sendCommand = function(operation, data, callback) {
	this._queue.push({ operation: operation, data: data, callback: callback });
	if (this._queue.length == 1) {
		this._sendNextOperation();
	}
};

/**
 * Sends the next operation to the worker.
 * @pre this._queue.length > 0, worker is not busy
 */
tutao.crypto.ClientWorkerProxy.prototype._sendNextOperation = function() {
	this._worker.postMessage({ operation: this._queue[0].operation, data: this._queue[0].data });
};

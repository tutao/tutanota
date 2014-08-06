"use strict";

tutao.provide('tutao.crypto.ClientWorkerProxyAsync');

/**
 * The worker proxy acts as a proxy to a worker. It is responsible for creating the worker and may receive arbitrary commands for the worker. The worker
 * must contain an implementation that supports the command data. The result is passed back to a callback.
 * @constructor
 */
tutao.crypto.ClientWorkerProxyAsync = function() {
    this._taskId = 0;
    // the queue elements have the following format: this._runningTasks[id] = {callback: function(?Object,string=)}
    this._runningTasks = {};

    var self = this;

    this._worker = new Worker(tutao.crypto.ClientWorkerProxyAsync.WORKER_FILE);

    this._worker.addEventListener('message', function(event) {
        var resultId = event.data.resultId;
        if (typeof resultId === "number") {
            // this is a response to a previous request
            var exceptionMessage = null;
            if (event.data.exception) {
                exceptionMessage = event.data.exception.message;
            }
            self._runningTasks[resultId].callback(event.data.result, exceptionMessage);
            delete self._runningTasks[resultId];
        } else {
            // this is a new request of the worker
            self._runningTasks[event.data.operation](event.data.id, event.data.data);
        }
    }, false);
    this._worker.onerror = function(event) {
        throw new Error(event.message + " (" + event.filename + ":" + event.lineno + ")");
    };

    this.sendCommand("initWorker", { imports: tutao.crypto.ClientWorkerProxyAsync.WORKER_IMPORTS }, function() {});
};

tutao.crypto.ClientWorkerProxyAsync.initWorkerFileNames = function(srcPath, libsPath) {
    /* begin dev ClientWorkerProxyAsync section */
    //everything inside the dev section is replaced by the correct import for the production version
    tutao.crypto.ClientWorkerProxyAsync.WORKER_FILE = srcPath + 'crypto/ClientWorkerImpl.js';
    tutao.crypto.ClientWorkerProxyAsync.WORKER_IMPORTS = [
        libsPath + 'closure-library-base-2012-01-19.js',
        libsPath + 'crypto-jsbn-2012-08-09.js',
        libsPath + 'crypto-sjcl-2012-08-09.js',
        srcPath + 'crypto/AesInterface.js',
        srcPath + 'crypto/SjclAes.js',
        srcPath + 'crypto/RsaInterface.js',
        srcPath + 'crypto/JsbnRsa.js',
        srcPath + 'crypto/CryptoError.js',
        srcPath + 'crypto/RandomizerInterface.js',
        srcPath + 'crypto/WorkerRandomizer.js',
        srcPath + 'crypto/Oaep.js',
        srcPath + 'util/EncodingConverter.js'
    ];
    /* end dev ClientWorkerProxyAsync section */
};

/**
 * Pass a command to the worker.
 * @param {String} operation A name that identifies the command on the worker side.
 * @param {Object} data An arbitrary object to be passed to the worker.
 * @param {function(?Object,string=)} callback Called when the command is finished. Receives the data result from the worker. If an error occurred, the result is null and an
 * error message is passed as second argument.
 */
tutao.crypto.ClientWorkerProxyAsync.prototype.sendCommand = function(operation, data, callback) {
    var id = this._getNextTaskId();
    this._runningTasks[id] = { callback: callback };
    this._worker.postMessage({id: id, operation: operation, data: data });
};

tutao.crypto.ClientWorkerProxyAsync.prototype._getNextTaskId = function() {
    var id = this._taskId++;
    var nextId = this._taskId;
    if (id == nextId) { // we have to start on zero on overflow (http://stackoverflow.com/a/307200)
        this._taskId = 0;
    }
    return id;
};


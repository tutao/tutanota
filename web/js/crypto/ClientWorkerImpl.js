"use strict";

if (typeof tutao === "undefined") {
    this['tutao'] = {};
    tutao.crypto = {};
} else {
    goog.provide('tutao.crypto.ClientWorkerImpl');
}

/**
 * This is the actual worker implementation. The worker communications with the ClientWorkerProxy via postMessage.
 * @param {Object} workerScope The scope of the worker
 * @constructor
 */
tutao.crypto.ClientWorkerImpl = function(workerScope) {
    this._taskId = 0;
    // the queue elements have the following format: this._runningTasks[id] = {callback: function(?Object,string=)}
    this._runningTasks = {};
    this._workerScope = workerScope;
};

tutao.crypto.ClientWorkerImpl.prototype._sendResult = function(id, result, exception) {
    if (exception) {
        this._workerScope.postMessage({resultId: id, result: result, exception: {message: exception.message, stack: exception.stack}});
    } else {
        this._workerScope.postMessage({resultId: id, result: result});
    }
};

tutao.crypto.ClientWorkerImpl.prototype.initWorker = function(id, data) {
    for (var i = 0; i < data.imports.length; i++) {
        importScripts(data.imports[i]);
    }
    // simulate the locator with all objects needed
    eval("tutao.locator = { randomizer: new tutao.crypto.WorkerRandomizer(), aesCrypter: new tutao.crypto.SjclAes(), rsaCrypter: new tutao.crypto.JsbnRsa() };");
    this._sendResult(id, {});
};

tutao.crypto.ClientWorkerImpl.prototype.encryptAesKey = function(id, data) {
    var self = this;
    tutao.locator.randomizer.setNextRandomBytes(data.randomData);
    tutao.locator.rsaCrypter.encryptAesKey(tutao.locator.rsaCrypter.hexToKey(data.key), data.data, function(encryptedKey, exception) {
        self._sendResult(id, encryptedKey, exception);
    });
};

tutao.crypto.ClientWorkerImpl.prototype.decryptAesKey = function(id, data) {
    var self = this;
    tutao.locator.rsaCrypter.decryptAesKey(tutao.locator.rsaCrypter.hexToKey(data.key), data.data, function(decryptedKey, exception) {
        self._sendResult(id, decryptedKey, exception);
    });
};

tutao.crypto.ClientWorkerImpl.prototype.generateKeyPair = function(id, data) {
    var self = this;
    tutao.locator.randomizer.setNextRandomBytes(data.randomData);
    tutao.locator.rsaCrypter.generateKeyPair(function(keyPair, exception) {
        if (exception) {
            self._sendResult(id, null, exception);
        } else {
            var publicKey = tutao.locator.rsaCrypter.keyToHex(keyPair.publicKey);
            var privateKey = tutao.locator.rsaCrypter.keyToHex(keyPair.privateKey);
            self._sendResult(id, {publicKeyHex: publicKey, privateKeyHex: privateKey}, exception);
        }
    });
};

tutao.crypto.ClientWorkerImpl.prototype.encryptArrayBuffer = function(id, data) {
    var self = this;
    tutao.locator.randomizer.setNextRandomBytes(data.randomData);
    tutao.locator.aesCrypter.encryptArrayBuffer(tutao.locator.aesCrypter.hexToKey(data.key), data.data, function(encrypted, exception) {
        self._sendResult(id, encrypted, exception);
    });
};

tutao.crypto.ClientWorkerImpl.prototype.decryptArrayBuffer = function(id, data) {
    var self = this;
    tutao.locator.aesCrypter.decryptArrayBuffer(tutao.locator.aesCrypter.hexToKey(data.key), data.data, data.decryptedSize, function(decrypted, exception) {
        self._sendResult(id, decrypted, exception);
    });
};

/**
 * Pass a command to the main Thread.
 * @param {String} operation A name that identifies the command on the worker side.
 * @param {Object} data An arbitrary object to be passed to the worker.
 * @param {function(?Object,string=)} callback Called when the command is finished. Receives the data result from the worker. If an error occurred, the result is null and an
 * error message is passed as second argument.
 */
tutao.crypto.ClientWorkerImpl.prototype.sendCommand = function(operation, data, callback) {
    var id = this._getNextTaskId();
    this._runningTasks.push[id] = { callback: callback };
    this._worker.postMessage({id: id, operation: operation, data: data });
};

tutao.crypto.ClientWorkerImpl.prototype._getNextTaskId = function() {
    var id = this._taskId++;
    if (id == 9007199254740992) { // we have to start on zero on overflow (http://stackoverflow.com/a/307200)
        this._taskId = 0;
    }
    return id;
};

// this file shall only be loaded if we are in the worker scope
/* TODO (before release) switch from ClientWorkerProxy to this implementation and from ClientWorker to ClientWorkerImpl
var global = Function('return this')();
if (global.importScripts) {
    // There may be only one command running at any time, no new command is allowed to be sent to this worker as long as the current one has not finished execution.
    var clientWorkerImpl = new tutao.crypto.ClientWorkerImpl(self);
    global.addEventListener('message', function(event) {
        var resultId = event.data.resultId;
        if (typeof resultId === "number") {
            // this is a response to a previous request
            var exceptionMessage = null;
            if (event.data.exception) {
                exceptionMessage = event.data.exception.message;
            }
            clientWorkerImpl._runningTasks[resultId].callback(event.data.result, exceptionMessage);
            delete clientWorkerImpl._runningTasks[resultId];
        } else {
            clientWorkerImpl[event.data.operation](event.data.id, event.data.data);
        }

    }, false);
}
*/
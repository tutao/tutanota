"use strict";

// this file shall only be loaded if we are in the worker scope
var global = Function('return this')();
if (global.importScripts) {

	/**
	 * There may be only one command running at any time, no new command is allowed to be sent to this worker as long as the current one has not finished execution.
	 */
	global.addEventListener('message', function(e) {
		var me = self;
		var operation = e.data.operation;
		var data = e.data.data;
		if (operation == "initWorker") {
			for (var i = 0; i < data.imports.length; i++) {
				importScripts(data.imports[i]);
			}
			// simulate the locator with all objects needed
			eval("tutao.locator = { randomizer: new tutao.crypto.WorkerRandomizer(), aesCrypter: new tutao.crypto.SjclAes(), rsaCrypter: new tutao.crypto.JsbnRsa() };");
			me.postMessage({});
		} else if (operation == "encryptAesKey") {
			tutao.locator.randomizer.setNextRandomBytes(data.randomData);
			tutao.locator.rsaCrypter.encryptAesKey(tutao.locator.rsaCrypter.hexToKey(data.key), data.data, function(encryptedKey, exception) {
				if (exception) {
					// send exception messages as message attribute
					me.postMessage({message: exception.message});
				} else {
					me.postMessage(encryptedKey);
				}
			});
		} else if (operation == "decryptAesKey") {
			tutao.locator.rsaCrypter.decryptAesKey(tutao.locator.rsaCrypter.hexToKey(data.key), data.data, function(decryptedKey, exception) {
				if (exception) {
					me.postMessage({message: exception.message});
				} else {
					me.postMessage(decryptedKey);
				}
			});
		} else if (operation == "generateKeyPair") {
            tutao.locator.randomizer.setNextRandomBytes(data.randomData);
			tutao.locator.rsaCrypter.generateKeyPair(function(keyPair, exception) {
				if (exception) {
					me.postMessage({message: exception.message});
				} else {
					var publicKey = tutao.locator.rsaCrypter.keyToHex(keyPair.publicKey);
					var privateKey = tutao.locator.rsaCrypter.keyToHex(keyPair.privateKey);
					me.postMessage({publicKeyHex: publicKey, privateKeyHex: privateKey});
				}
			});
		} else if (operation == "encryptArrayBuffer") {
			tutao.locator.randomizer.setNextRandomBytes(data.randomData);
			tutao.locator.aesCrypter.encryptArrayBuffer(tutao.locator.aesCrypter.hexToKey(data.key), data.data, function(encrypted, exception) {
				if (exception) {
					// send exception messages as message attribute
					me.postMessage({message: exception.message});
				} else {
					me.postMessage(encrypted);
				}
			});
		} else if (operation == "decryptArrayBuffer") {
			tutao.locator.aesCrypter.decryptArrayBuffer(tutao.locator.aesCrypter.hexToKey(data.key), data.data, data.decryptedSize, function(decrypted, exception) {
				if (exception) {
					// send exception messages as message attribute
					me.postMessage({message: exception.message});
				} else {
					me.postMessage(decrypted);
				}
			});
		}
	}, false);
}

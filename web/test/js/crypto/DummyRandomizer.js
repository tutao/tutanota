"use strict";

tutao.provide('tutao.crypto.DummyRandomizer');

tutao.crypto.DummyRandomizer = function() {
    this._staticData = "9340759180347509812745890172340987132409857109824357012783459012873409123047129843571923479182374981273498172349812734";
};

/**
 * @inheritDoc
 */
tutao.crypto.DummyRandomizer.prototype.addEntropy = function(number, entropy, source) {

};

/**
 * @inheritDoc
 */
tutao.crypto.DummyRandomizer.prototype.isReady = function() {
    return true;
};

/**
 * @inheritDoc
 */
tutao.crypto.DummyRandomizer.prototype.generateRandomData = function(nbrOfBytes) {
    if (this._staticData.length < nbrOfBytes * 2) {
        throw new tutao.crypto.CryptoError("not enought static bytes");
    }
    return this._staticData.substring(0, nbrOfBytes * 2);
};

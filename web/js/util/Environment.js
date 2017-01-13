"use strict";

tutao.provide("tutao.Environment");
tutao.provide("tutao.Env");
tutao.provide("tutao.Mode");
tutao.provide("tutao.env");

/**
 * @enum {number}
 */
tutao.Env = {
    LOCAL: 0,
    LOCAL_COMPILED: 1,
    DEV: 2,
    TEST: 3,
    PROD: 4
};

/**
 * @enum {number}
 */
tutao.Mode = {
    Browser: 0,
    App: 1
};

/**
 * @type {tutao.Environment}
 */
tutao.env;

/**
 * @param {tutao.Env} type
 * @param {boolean} ssl
 * @param {string} server
 * @param {string?} port
 * @constructor
 */
tutao.Environment = function (type, ssl, server, port, paymentDataUrl, versionNumber) {
    this.type = type;
    this.ssl = ssl;
    this.server = server;
    this.port = port;
    this.mode = tutao.Mode.Browser;
    this.paymentDataServer = paymentDataUrl;
    this.versionNumber = versionNumber;
};

tutao.Environment.prototype.getWebsocketOrigin = function () {
    return (this.ssl ? 'wss' : 'ws') + "://" + this.server + (this.port ? ":" + this.port : "");
};

tutao.Environment.prototype.getHttpOrigin = function () {
    return (this.ssl ? 'https' : 'http') + "://" + this.server + (this.port ? ":" + this.port : "");
};


tutao.Environment.prototype.isIOSApp = function () {
    return this.mode == tutao.Mode.App && cordova.platformId == "ios";
};

tutao.Environment.prototype.isAndroidApp = function () {
    return this.mode == tutao.Mode.App && cordova.platformId == "android";
};





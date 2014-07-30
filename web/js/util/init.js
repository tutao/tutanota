"use strict";

goog.provide("tutao.Env");

tutao.Env = {
    ssl: document.location.protocol == 'https:' ? true : false,
    server: document.location.hostname,
    port: document.location.port === '' ? '' : document.location.port
};

tutao.tutanota.Bootstrap.init();
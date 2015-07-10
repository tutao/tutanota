"use strict";

tutao.provide('tutao.util.EventListenerManager');

tutao.util.EventListenerManager = function() {
    tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
    this.handlers = {}; // eventName -> handler
};

tutao.util.EventListenerManager.prototype.addSingleEventListener = function(eventName, handler) {
    if (this.handlers[eventName]) {
        window.removeEventListener(eventName, this.handlers[eventName]);
    }
    this.handlers[eventName] = handler;
    window.addEventListener(eventName, handler, false);
};

"use strict";

tutao.provide('tutao.event.EventBusListener');

/**
 * Interface for receiving EventBusClient events.
 * @interface
 */
tutao.event.EventBusListener = function() {};


/**
 * Notifies the listener that new data has been received.
 * @param {tutao.entity.sys.EntityUpdate} data The update notification.
 */
tutao.event.EventBusListener.prototype.notifyNewDataReceived = function(data) {};


/**
 * Notifies a listener about the reconnect event,
 */
tutao.event.EventBusListener.prototype.notifyReconnected = function() {};
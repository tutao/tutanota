"use strict";

goog.provide('tutao.event.EventBusClient');

/**
 * The EventBus encapsulates the WebSocket connection to the server. It currently only forwards messages to observers.
 */
tutao.event.EventBusClient = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this); // listener methods are invoked from the Websocket
	this._socket = null;
    /** @type {Array.<tutao.event.EventBusListener>} */
    this._listeners = [];
};

/**
 * Notifies all listeners on reconnect event.
 */
tutao.event.EventBusClient.prototype.notifyReconnected = function() {
    for( var i=0; i < this._listeners.length; i++){
        this._listeners[i].notifyReconnected();
    }
};

/**
 * Notifies all listener when receiving new data.
 * @param {tutao.entity.sys.EntityUpdate} data The update notification
 */
tutao.event.EventBusClient.prototype.notifyNewDataReceived = function(data) {
    for( var i=0; i < this._listeners.length; i++){
        this._listeners[i].notifyNewDataReceived(data);
    }
};


/**
 * Adds a listener to this event bus client.
 * @param {tutao.event.EventBusListener} listener The listener that is notified for changes.
 */
tutao.event.EventBusClient.prototype.addListener = function(listener) {
    this._listeners.push(listener);
};


tutao.event.EventBusClient.prototype.connect = function(reconnect) {
	var self = this;
	var protocol = document.location.protocol === 'http:' ? 'ws' : 'wss';
    var port = document.location.port === '' ? '' : ':' + document.location.port;
    var url = protocol + "://" + document.location.hostname + port + "/event/";
	this._socket = new WebSocket(url);
	this._socket.onopen = function() {
		console.log("ws open: ", new Date());
		var authentication = new tutao.entity.sys.Authentication()
			.setUserId(tutao.locator.userController.getUserId())
			.setAuthVerifier(tutao.locator.userController.getAuthVerifier());
		var wrapper = new tutao.entity.sys.WebsocketWrapper()
			.setType("authentication")
			.setMsgId("0")
			.setAuthentication(authentication);

	    self._socket.send(JSON.stringify(wrapper.toJsonData()));
        if (reconnect) {
            self.notifyReconnected();
        }
	};
	this._socket.onclose = this._close;
	this._socket.onerror = this._error;
	this._socket.onmessage = this._message;
	return this;
};

/**
 * Sends a close event to the server and closes the connection.
 */
tutao.event.EventBusClient.prototype.close = function() {
	if (this._socket) {
		this._socket.close();
	}
};

tutao.event.EventBusClient.prototype._error = function(error) {
	console.log("ws error: ", error);
};

tutao.event.EventBusClient.prototype._message = function(message) {
	console.log("ws message: ", message.data);
	var wrapper = new tutao.entity.sys.WebsocketWrapper(JSON.parse(message.data));
	if (wrapper.getType() === 'chat') {
		console.log(wrapper.getChat().getSender() + " > " + wrapper.getChat().getText());
	} else if (wrapper.getType() === 'entityUpdate') {
		this.notifyNewDataReceived(wrapper.getEntityUpdate());
	}
};

tutao.event.EventBusClient.prototype._close = function(event) {
	console.log("ws close: ", event, new Date());
    if (tutao.locator.userController.isInternalUserLoggedIn()) {
        setTimeout(this._reconnect, 1000 * this._randomIntFromInterval(30, 100));
    }
};

tutao.event.EventBusClient.prototype._reconnect = function() {
    console.log("reconnect socket state: " + this._socket.readyState);
    this.connect(true);
};

tutao.event.EventBusClient.prototype._randomIntFromInterval = function(min,max) {
    return Math.floor(Math.random()*(max-min+1)+min);
};
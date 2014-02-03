"use strict";

goog.provide('tutao.event.EventBusClient');


/**
 * The EventBus encapsulates the WebSocket connection to the server. It currently only forwards messages to observers.
 * @implements {tutao.event.ObservableInterface}
 */
// TODO (before beta) test disconnects, re-connect etc.
tutao.event.EventBusClient = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this); // listener methods are invoked from the Websocket
	this._observable = new tutao.event.Observable();
	this._socket = null;
	this._failedConnects = 0;
	this._lastConnectionAttempt = null;
    this._tryReconnect = false;
};

/**
 * @inheritDoc
 */
tutao.event.EventBusClient.prototype.addObserver = function(observer) {
	this._observable.addObserver(observer);
};

/**
 * @inheritDoc
 */
tutao.event.EventBusClient.prototype.removeObserver = function(observer) {
	this._observable.removeObserver(observer);
};

/**
 * @inheritDoc
 */
tutao.event.EventBusClient.prototype.notifyObservers = function(data) {
	this._observable.notifyObservers(data);
};

tutao.event.EventBusClient.prototype.connect = function() {
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
    this._tryReconnect = true;
};

tutao.event.EventBusClient.prototype._message = function(message) {
	console.log("ws message: ", message.data);
	var wrapper = new tutao.entity.sys.WebsocketWrapper(JSON.parse(message.data));
	if (wrapper.getType() === 'chat') {
		console.log(wrapper.getChat().getSender() + " > " + wrapper.getChat().getText());
	} else if (wrapper.getType() === 'entityUpdate') {
		this.notifyObservers(wrapper.getEntityUpdate());
	}
};

tutao.event.EventBusClient.prototype._close = function(event) {
	console.log("ws close: ", event, new Date());
    if (this._tryReconnect) {
        this._reconnect();
    }
};

/**
 * Send a message to a recipient group.
 * @param {string} recipient The id of the recipients group.
 * @param {string} message The plain text message to send to the recipient.
 */
tutao.event.EventBusClient.prototype.sendMessage = function(recipient, message) {
	//var self = this;
	//this._checkSocket(function() { self._sendMessage(recipient, message); });
	this._sendMessage(recipient, message);
};

tutao.event.EventBusClient.prototype._sendMessage = function(recipient, message) {
	var chat = new tutao.entity.sys.Chat()
		.setSender(tutao.locator.userController.getUserGroupId())
		.setRecipient(recipient)
		.setText(message);
	var wrapper = new tutao.entity.sys.WebsocketWrapper()
		.setType("chat")
		.setMsgId("0")
		.setChat(chat);
	this._socket.send(JSON.stringify(wrapper.toJsonData()));
};


tutao.event.EventBusClient.prototype._reconnect = function() {
    console.log("reconnect socket state: " + this._socket.readyState);
    this._tryReconnect = false;
    this._reconnectInterval = window.setTimeout(this.connect, 30000 );
};



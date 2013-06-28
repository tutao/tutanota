"use strict";

goog.provide('tutao.event.EventBusClient');


/**
 * The EventBus encapsulates the WebSocket connection to the server. It currently only forwards messages to observers.
 * @implements {tutao.event.Observable}
 */
// TODO test disconnects, re-connect etc.
tutao.event.EventBusClient = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this); // listener methods are invoked from the Websocket
	this._observable = new tutao.event.Observable();
	this._socket;
	this._failedConnects = 0;
	this._lastConnectionAttempt = null;
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

tutao.event.EventBusClient.prototype.connect = function(callback) {
	var self = this;
	var protocol = document.location.protocol === 'http:' ? 'ws' : 'wss';
	var url = protocol + "://" + document.location.hostname + ":" + document.location.port + "/event/";
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
	    if (callback) {
	    	self._checkSocket(callback);
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
	console.log("ws message: ", message);
	var wrapper = new tutao.entity.sys.WebsocketWrapper(JSON.parse(message.data));
	if (wrapper.getType() === 'chat') {
		console.log(wrapper.getChat().getSender() + " > " + wrapper.getChat().getText());
	} else if (wrapper.getType() === 'entityUpdate') {
		this.notifyObservers(wrapper.getEntityUpdate());
	}
};

tutao.event.EventBusClient.prototype._close = function(event) {
	console.log("ws close: ", event, new Date());
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

// currently not used, decide on how to reconnect
tutao.event.EventBusClient.prototype._checkSocket = function(callback) {
	if (this._socket.readyState == 0) {
		// connecting, try again later
		setTimeout(this._checkSocket(callback), 100);
	} else if (this._socket.readyState == 1) {
		// socket is ready, invoke the callback
		callback();
	} else {
		// socket is closing or already closed, create a new one
		var self = this;
		this.connect(callback);
	}
	callback();
};


"use strict";

tutao.provide('tutao.event.EventBusClient');

/**
 * The EventBus encapsulates the WebSocket connection to the server. It currently only forwards messages to observers.
 */
tutao.event.EventBusClient = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this); // listener methods are invoked from the Websocket
	this._socket = null;
    /** @type {Array.<tutao.event.EventBusListener>} */
    this._listeners = [];
    this.terminated = false; // if terminated, never reconnects
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

/**
 * Opens a WebSocket connection to receive server events.
 * @param reconnect Set to true if the connection has been opened before.
 * @returns {tutao.event.EventBusClient} The event bus client object.
 */
tutao.event.EventBusClient.prototype.connect = function(reconnect) {
    console.log("ws connect reconnect=", reconnect);
    var self = this;
	var url = tutao.env.getWebsocketOrigin() + "/event/";
	this._socket = new WebSocket(url);
	this._socket.onopen = function() {
		console.log("ws open: ", new Date());
		var wrapper = new tutao.entity.sys.WebsocketWrapper()
			.setType("authentication")
			.setMsgId("0")
			// ClientVersion = <SystemModelVersion>.<TutanotaModelVersion>
			.setClientVersion(tutao.entity.sys.WebsocketWrapper.MODEL_VERSION + "." + tutao.entity.tutanota.Mail.MODEL_VERSION);
        var authentication = new tutao.entity.sys.Authentication(wrapper)
            .setUserId(tutao.locator.userController.getUserId())
            .setAuthVerifier(tutao.locator.userController.getAuthVerifier());
        wrapper.setAuthentication(authentication);
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
 * Sends a close event to the server and finally closes the connection. Makes sure that there will be no reconnect.
 */
tutao.event.EventBusClient.prototype.close = function() {
    console.log("ws close: ", new Date());
    this.terminated = true;
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
	console.log("ws _close: ", event, new Date());
	if ( tutao.env.mode == tutao.Mode.App && cordova.platformId == "ios" ) {
		// on ios devices the close event fires when the app comes back to foreground
		// so try a reconnect immediately. The tryReconnect method is also triggered when
		// the app  comes to foreground by the "resume" event, but the order in which these
		// two events are executed is not defined so we need the tryReconnect in both situations.
		this.tryReconnect();
	}
    if (!this.terminated) {
        setTimeout(this.tryReconnect, 1000 * this._randomIntFromInterval(30, 100));
    }
};

/**
 * Tries to reconnect the websocket if it is not connected.
 */
tutao.event.EventBusClient.prototype.tryReconnect = function() {
	console.log("ws tryReconnect socket state (CONNECTING=0, OPEN=1, CLOSING=2, CLOSED=3): " + ((this._socket) ? this._socket.readyState: "null"));
    if ((this._socket == null || this._socket.readyState == WebSocket.CLOSED) && !this.terminated) {
        this.connect(true);
    }
};

tutao.event.EventBusClient.prototype._randomIntFromInterval = function(min,max) {
    return Math.floor(Math.random()*(max-min+1)+min);
};
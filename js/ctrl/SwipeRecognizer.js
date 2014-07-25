"use strict";

goog.provide('tutao.tutanota.ctrl.SwipeRecognizer');

/**
 * @constructor
 * A SwipeRecognizer can recognize swipe events like swipe in and out from left and right border of the screen. If
 * a listener is registered for these events, the listener is called.
 */
tutao.tutanota.ctrl.SwipeRecognizer = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

	this._listeners = {};

	// dummy values until setScreenSize is called
	this._screenWidth = 0;
	this._screenHeight = 0;

	this._startX = 0;
	this._startY = 0;
	this._currentX = 0;
	this._currentY = 0;
	this._notified = {};

	//TODO (timely) put this into the ctrl and feed the touch events from outside to make this class gui independent
	$("#tutanota").on("touchstart", this._touchStart);
	$("#tutanota").on("touchmove", this._touchMove);
	$("#tutanota").on("touchend", this._touchEnd);
	$("#tutanota").on("touchcancel", this._touchCancel);
};

/**
 * Id for the swipe in from left event.
 */
tutao.tutanota.ctrl.SwipeRecognizer.TYPE_LEFT_IN = 0;

/**
 * Id for the swipe out left event.
 */
tutao.tutanota.ctrl.SwipeRecognizer.TYPE_LEFT_OUT = 1;

/**
 * Id for the swipe in from right event.
 */
tutao.tutanota.ctrl.SwipeRecognizer.TYPE_RIGHT_IN = 2;

/**
 * Id for the swipe out right event.
 */
tutao.tutanota.ctrl.SwipeRecognizer.TYPE_RIGHT_OUT = 3;

/**
 * Id for the swipe right event.
 */
tutao.tutanota.ctrl.SwipeRecognizer.TYPE_RIGHT = 4;

/**
 * Id for the swipe left event.
 */
tutao.tutanota.ctrl.SwipeRecognizer.TYPE_LEFT = 5;


/**
 * @protected
 * The maximal distance the finger may move in vertical direction to still recognize the gesture as horizontal swipe in px.
 */
tutao.tutanota.ctrl.SwipeRecognizer._MAX_ORTHOGRAPIC_VARIATION = 60;

/**
 * @protected
 * The maximal distance from the border to the touch start position in px to recognize a swipe in.
 */
tutao.tutanota.ctrl.SwipeRecognizer._MAX_START_OFFSET_FOR_BORDER_IN = 50;

/**
 * @protected
 * The minimal distance from the border in px that the finger must move to recognize a swipe in.
 */
tutao.tutanota.ctrl.SwipeRecognizer._MIN_END_OFFSET_FOR_BORDER_IN = 40;

/**
 * @protected
 * Min slide distance to recognize a swipe in.
 */
tutao.tutanota.ctrl.SwipeRecognizer._MIN_SLIDE_DISTANCE_FOR_BORDER_IN = 20;

/**
 * @protected
 * The minimal touch start distance from the border in px to recognize a swipe out.
 */
tutao.tutanota.ctrl.SwipeRecognizer._MIN_START_OFFSET_FOR_BORDER_OUT = 30;

/**
 * @protected
 * The maximum touch start distance from the border in px to recognize a swipe out.
 */
tutao.tutanota.ctrl.SwipeRecognizer._MAX_START_OFFSET_FOR_BORDER_OUT = 450;

/**
 * @protected
 * The distance from the border in px that the finger must at least move (in border direction) to recognize a swipe out.
 */
tutao.tutanota.ctrl.SwipeRecognizer._MIN_END_OFFSET_FOR_BORDER_OUT = 10;

/**
 * @protected
 * The distance the finger must at least move to recognize a swipe left or swipe right.
 * Attention: do not use a value > 15 px, because in Chrome on Android only one touchmove event is sent in an otherwise (vertically) scrollable div and touchcancel afterwards. The touch distance is therefore not very big.
 * See https://code.google.com/p/android/issues/detail?id=5491, https://code.google.com/p/android/issues/detail?id=19827, https://code.google.com/p/chromium/issues/detail?id=150779
 */
tutao.tutanota.ctrl.SwipeRecognizer._MIN_SLIDE_DISTANCE = 15;

/**
 * @protected
 * The distance as percentage of the horizontal slide that the finger may slide vertically to still recognize a swipe left or swipe right.
 */
tutao.tutanota.ctrl.SwipeRecognizer._MAX_ORTHOGRAPIC_VARIATION_FACTOR = 0.2;

/**
 * Set the screen resolution. Must be called at least once before adding listeners and in case of browser window
 * resizing or tablet orientation changes.
 * @param {number} width The width of the browser screen.
 * @param {number} height The height of the browser screen.
 */
tutao.tutanota.ctrl.SwipeRecognizer.prototype.setScreenSize = function(width, height) {
	this._screenWidth = width;
	this._screenHeight = height;
};

/**
 * Registers a listener function that is called when the swipe event indicated by type occurs. It is only possible
 * to register one listener per type.
 * @param {number} type One of TYPE_LEFT_OUT, TYPE_LEFT_IN, TYPE_RIGHT_IN, TYPE_RIGHT_OUT.
 * @param {function()} listener This function is called as soon as the swipe event occurs.
 */
tutao.tutanota.ctrl.SwipeRecognizer.prototype.addSwipeListener = function(type, listener) {
	this._listeners[type] = listener;
};

/**
 * Receives the touchstart event from the browser.
 * @param {Object} event The event.
 * @protected
 */
tutao.tutanota.ctrl.SwipeRecognizer.prototype._touchStart = function(event) {
	event = event.originalEvent; // get the original event for the touch properties
	if (event.touches.length == 1) {
		this._startX = event.touches[0].pageX;
		this._startY = event.touches[0].pageY;
		this._currentX = this._startX;
		this._currentY = this._startY;
		this._notified = {};
	} else {
		this._cancel();
	}
};

/**
 * Receives the touchmove event from the browser.
 * @param {Object} event The event.
 * @protected
 */
tutao.tutanota.ctrl.SwipeRecognizer.prototype._touchMove = function(event) {
	event = event.originalEvent; // get the original event for the touch properties
	if (event.touches.length == 1) {
		this._currentX = event.touches[0].pageX;
		this._currentY = event.touches[0].pageY;
		this._tryRecognization();
	}
};

/**
 * Tries to recognize the registered swipe events and calls the corresponding listener if successful.
 * @protected
 */
tutao.tutanota.ctrl.SwipeRecognizer.prototype._tryRecognization = function() {
	var SR = tutao.tutanota.ctrl.SwipeRecognizer;
	// try to recognize a swipe
	/* border swipe detection is not used currently
    if (this._listeners[SR.TYPE_LEFT_IN] && !this._notified[SR.TYPE_LEFT_IN]) {
		if (this._startX <= SR._MAX_START_OFFSET_FOR_BORDER_IN &&
				(this._currentX > this._startX) &&
				(this._currentX >= SR._MIN_END_OFFSET_FOR_BORDER_IN) &&
				((this._currentX - this._startX) >= SR._MIN_SLIDE_DISTANCE_FOR_BORDER_IN) &&
				(Math.abs(this._currentY - this._startY) <= SR._MAX_ORTHOGRAPIC_VARIATION)) {
			this._notified[SR.TYPE_LEFT_IN] = true;
			this._listeners[SR.TYPE_LEFT_IN]();
		}
	}
	if (this._listeners[SR.TYPE_LEFT_OUT] && !this._notified[SR.TYPE_LEFT_OUT]) {
		if (this._startX <= SR._MAX_START_OFFSET_FOR_BORDER_OUT &&
				(this._startX >= SR._MIN_START_OFFSET_FOR_BORDER_OUT) &&
				(this._currentX < this._startX) &&
				(this._currentX <= SR._MIN_END_OFFSET_FOR_BORDER_OUT) &&
				(Math.abs(this._currentY - this._startY) <= SR._MAX_ORTHOGRAPIC_VARIATION)) {
			this._notified[SR.TYPE_LEFT_OUT] = true;
			this._listeners[SR.TYPE_LEFT_OUT]();
		}
	}
	if (this._listeners[SR.TYPE_RIGHT_IN] && !this._notified[SR.TYPE_RIGHT_IN]) {
		if (this._startX >= this._screenWidth - SR._MAX_START_OFFSET_FOR_BORDER_IN &&
				(this._currentX < this._startX) &&
				(this._currentX <= this._screenWidth - SR._MIN_END_OFFSET_FOR_BORDER_IN) &&
				((this._startX - this._currentX) >= SR._MIN_SLIDE_DISTANCE_FOR_BORDER_IN) &&
				(Math.abs(this._currentY - this._startY) <= SR._MAX_ORTHOGRAPIC_VARIATION)) {
			this._notified[SR.TYPE_RIGHT_IN] = true;
			this._listeners[SR.TYPE_RIGHT_IN]();
		}
	}
	if (this._listeners[SR.TYPE_RIGHT_OUT] && !this._notified[SR.TYPE_RIGHT_OUT]) {
		if (this._startX >= this._screenWidth - SR._MAX_START_OFFSET_FOR_BORDER_OUT &&
				(this._startX <= this._screenWidth - SR._MIN_START_OFFSET_FOR_BORDER_OUT) &&
				(this._currentX > this._startX) &&
				(this._currentX >= this._screenWidth - SR._MIN_END_OFFSET_FOR_BORDER_OUT) &&
				(Math.abs(this._currentY - this._startY) <= SR._MAX_ORTHOGRAPIC_VARIATION)) {
			this._notified[SR.TYPE_RIGHT_OUT] = true;
			this._listeners[SR.TYPE_RIGHT_OUT]();
		}
	}*/
    if (this._listeners[SR.TYPE_RIGHT] && !this._notified[SR.TYPE_RIGHT]) {
        if ((this._currentX >= this._startX + SR._MIN_SLIDE_DISTANCE) &&
            (Math.abs(this._currentY - this._startY) <= Math.abs(this._currentX - this._startX) * SR._MAX_ORTHOGRAPIC_VARIATION_FACTOR)) {
            this._notified[SR.TYPE_RIGHT] = true;
            this._listeners[SR.TYPE_RIGHT]();
        }
    }
    if (this._listeners[SR.TYPE_LEFT] && !this._notified[SR.TYPE_LEFT]) {
        if ((this._currentX <= this._startX - SR._MIN_SLIDE_DISTANCE) &&
            (Math.abs(this._currentY - this._startY) <= Math.abs(this._currentX - this._startX) * SR._MAX_ORTHOGRAPIC_VARIATION_FACTOR)) {
            this._notified[SR.TYPE_LEFT] = true;
            this._listeners[SR.TYPE_LEFT]();
        }
    }
};

/**
 * Receives the touchend event from the browser.
 * @param {Object} event The event.
 * @protected
 */
tutao.tutanota.ctrl.SwipeRecognizer.prototype._touchEnd = function(event) {
	event = event.originalEvent; // get the original event for the touch properties
	// not needed currently
};

/**
 * Receives the touchcancel event from the browser.
 * @param {Object} event The event.
 * @protected
 */
tutao.tutanota.ctrl.SwipeRecognizer.prototype._touchCancel = function(event) {
	event = event.originalEvent; // get the original event for the touch properties
	// not needed currently
};

/**
 * Cancels all current touch gestures, so no listener will be called until a new touch start event occurs.
 * @protected
 */
tutao.tutanota.ctrl.SwipeRecognizer.prototype._cancel = function() {
	var SR = tutao.tutanota.ctrl.SwipeRecognizer;
	// mark all events as notified
	this._notified[SR.TYPE_LEFT_IN] = true;
	this._notified[SR.TYPE_LEFT_OUT] = true;
	this._notified[SR.TYPE_RIGHT_IN] = true;
	this._notified[SR.TYPE_RIGHT_OUT] = true;
};

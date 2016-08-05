"use strict";

tutao.provide('tutao.tutanota.util.KeyManager');

tutao.tutanota.util.KeyManager = function() {
    tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
    this._ctrlDown = false;
    this._shiftDown = false;

    // @typedef {Object.<number, { modifier: number, callback: function}>} with first number being the key code
    this._listeners = {};
};

tutao.tutanota.util.KeyManager.KEY_CODE_NONE = -1;
tutao.tutanota.util.KeyManager.KEY_CODE_SHIFT = 16;
tutao.tutanota.util.KeyManager.KEY_CODE_CTRL = 17;
tutao.tutanota.util.KeyManager.KEY_CODE_H = 72;

/**
 * Must be called before using other functions.
 */
tutao.tutanota.util.KeyManager.prototype.init = function() {
    var self = this;
    document.addEventListener("keydown", function(e) {
        if (e.keyCode == tutao.tutanota.util.KeyManager.KEY_CODE_CTRL) {
            self._ctrlDown = true;
        } else if (e.keyCode == tutao.tutanota.util.KeyManager.KEY_CODE_SHIFT) {
            self._shiftDown = true;
        }

        // keypress does not work in all browsers
        if (self._listeners[e.keyCode] &&
            ((self._listeners[e.keyCode].modifier == tutao.tutanota.util.KeyManager.KEY_CODE_NONE) ||
            (self._listeners[e.keyCode].modifier == tutao.tutanota.util.KeyManager.KEY_CODE_SHIFT && self._shiftDown) ||
            (self._listeners[e.keyCode].modifier == tutao.tutanota.util.KeyManager.KEY_CODE_CTRL && self._ctrlDown))) {
            e.preventDefault();
            self._listeners[e.keyCode].callback();
        }
    }, false);

    document.addEventListener("keyup", function(e) {
        if (e.keyCode == tutao.tutanota.util.KeyManager.KEY_CODE_CTRL) {
            self._ctrlDown = false;
        } else if (e.keyCode == tutao.tutanota.util.KeyManager.KEY_CODE_SHIFT) {
            self._shiftDown = false;
        }
    }, false);

    // reset the down key status if the focus is lost, e.g. click in address bar or tab change
    window.addEventListener("blur", function() {
        self._ctrlDown = false;
        self._shiftDown = false;
    }, false);
};

/**
 * @return {bool} True if the ctrl key is pressed, false otherwise.
 */
tutao.tutanota.util.KeyManager.prototype.isCtrlPressed = function() {
    return this._ctrlDown;
};


/**
 * @return {bool} True if the shift key is pressed, false otherwise.
 */
tutao.tutanota.util.KeyManager.prototype.isShiftPressed = function() {
    return this._shiftDown;
};

tutao.tutanota.util.KeyManager.prototype.registerListener = function(callback, modifierKeyCode, keyCode) {
    this._listeners[keyCode] = { modifier: modifierKeyCode, callback: callback};
};

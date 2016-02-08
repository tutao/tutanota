"use strict";

tutao.provide('tutao.tutanota.util.KeyManager');

tutao.tutanota.util.KeyManager = function() {
    tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
    this._ctrlDown = false;
    this._shiftDown = false;
};

tutao.tutanota.util.KeyManager.KEY_CODE_SHIFT = 16;
tutao.tutanota.util.KeyManager.KEY_CODE_CTRL = 17;

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
    }, false);

    document.addEventListener("keyup", function(e) {
        if (e.keyCode == tutao.tutanota.util.KeyManager.KEY_CODE_CTRL) {
            self._ctrlDown = false;
        } else if (e.keyCode == tutao.tutanota.util.KeyManager.KEY_CODE_SHIFT) {
            self._shiftDown = false;
        }
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

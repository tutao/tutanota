/**
 * Created by bdeterding on 07.05.14.
 */
"use strict";

tutao.provide('tutao.tutanota.ctrl.ModalPageBackgroundViewModel');

/**
 * The ViewModel for the feedback wizard.
 * @constructor
 */
tutao.tutanota.ctrl.ModalPageBackgroundViewModel = function() {
    tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
    this.visible = ko.observable(false);
    this.closeListener = null;
    var self = this;
};

/**
 * Shows a transparent background receiving the next click event.
 * @param {function()} closeListener
 */
tutao.tutanota.ctrl.ModalPageBackgroundViewModel.prototype.show = function(closeListener) {
    this.closeListener = closeListener;
    this.visible(true);
};


/**
 * Hides the background and informs the close listener.
 */
tutao.tutanota.ctrl.ModalPageBackgroundViewModel.prototype._hide = function() {
    this.visible(false);
    if (this.closeListener != null){
        this.closeListener();
    }
};

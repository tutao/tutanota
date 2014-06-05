/**
 * Created by bdeterding on 07.05.14.
 */
"use strict";

goog.provide('tutao.tutanota.ctrl.ModalPageBackgroundViewModel');

/**
 * The ViewModel for the feedback wizard.
 * @constructor
 */
tutao.tutanota.ctrl.ModalPageBackgroundViewModel = function() {
    tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
    this.visible = ko.observable(false);
    this.closeCallback = null;
    var self = this;

    $(window.document).click(function(event){
        if(!$(event.target).parent().is('.buttonBarMoreMenu')){
            self._hide();
        }
    });
};

/**
 * Shows a transparent background receiving the next click event.
 * @param {function()} closeCallback
 */
tutao.tutanota.ctrl.ModalPageBackgroundViewModel.prototype.show = function(closeCallback) {
    this.closeCallback = closeCallback;
    this.visible(true);
};


/**
 * Hides the background and informs the close listener.
 */
tutao.tutanota.ctrl.ModalPageBackgroundViewModel.prototype._hide = function() {
    this.visible(false);
    if (this.closeCallback != null){
        this.closeCallback();
    }
};

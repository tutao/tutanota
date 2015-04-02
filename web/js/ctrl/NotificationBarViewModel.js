"use strict";

tutao.provide('tutao.tutanota.ctrl.NotificationBarViewModel');

tutao.tutanota.ctrl.NotificationBarViewModel = function() {
    tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
    var self = this;

    this.isVisible = ko.observable(false);
    this.messageTextId = ko.observable("emptyString_msg");
    this._showAction = ko.observable(null);

    var buttons = [
        new tutao.tutanota.ctrl.Button("showBlockedContent_action", 1,
           function () {
               if ( self._showAction()){
                   self._showAction()();
               }
               self.hideNotification();
           }, function(){
               return self._showAction() != null;
           }, false, "showBlockedContentAction", "loadImages"),
        new tutao.tutanota.ctrl.Button( "hideNotification_action", 2, self.hideNotification, function(){return true;}, false, "hideNotificationAction", "cancel")
    ];
    this.buttonBarViewModel = new tutao.tutanota.ctrl.ButtonBarViewModel(buttons, null, tutao.tutanota.gui.measureActionBarEntry);
};

tutao.tutanota.ctrl.NotificationBarViewModel.prototype.showNotification = function(textId, showAction) {
    this._showAction(showAction);
    this.isVisible(true);
    this.messageTextId(textId);

};

tutao.tutanota.ctrl.NotificationBarViewModel.prototype.hideNotification = function() {
    this._showAction(null);
    this.isVisible(false);
};

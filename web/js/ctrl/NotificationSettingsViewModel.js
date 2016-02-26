"use strict";

tutao.provide('tutao.tutanota.ctrl.NotificationSettingsViewModel');

/**
 * View model to configure inbox rules for incoming emails..
 * @constructor
 */
tutao.tutanota.ctrl.NotificationSettingsViewModel = function() {
    tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
    this.state = new tutao.tutanota.util.SubmitStateMachine(true);

    this.pushIdentifierListElements = ko.observableArray([]);
    var pushIdentifierList = tutao.locator.userController.getLoggedInUser().getPushIdentifierList();
    var self = this;
    if (pushIdentifierList){
        self.state.loading(true);
        tutao.rest.EntityRestInterface.loadAll(tutao.entity.sys.PushIdentifier, pushIdentifierList.getList(), tutao.rest.EntityRestInterface.GENERATED_MIN_ID).then(function(pushIdentifiers) {
            self.pushIdentifierListElements(pushIdentifiers);
            self.state.entering(true);
        });
    }

};


tutao.tutanota.ctrl.NotificationSettingsViewModel.prototype.removePushIdentifier = function(pushIdentifierListElement) {
    if (!this.state.submitEnabled()){
        return;
    }
    this.pushIdentifierListElements.remove(pushIdentifierListElement);
    var self = this;
    self.state.submitting(true);
    return pushIdentifierListElement.erase().caught(tutao.NotFoundError, function(e) {
        // avoid exception for missing sync
    }).lastly(function(){
        self.state.entering(true);
    });
};


tutao.tutanota.ctrl.NotificationSettingsViewModel.prototype.getTextForType = function(pushIdentifierListElement) {
    if (pushIdentifierListElement.getPushServiceType() == tutao.entity.tutanota.TutanotaConstants.PUSH_SERVICE_TYPE_IOS) {
        return "iOS";
    } else {
        return "Android";
    }
};
tutao.tutanota.ctrl.NotificationSettingsViewModel.prototype.getIdentifierForType = function(pushIdentifierListElement) {
    if ( tutao.locator.pushService.isCurrentPushIdentifier(pushIdentifierListElement.getIdentifier())){
        return tutao.lang('pushIdentiferCurrentDevice_label') + " - " + pushIdentifierListElement.getIdentifier();
    } else {
        return  pushIdentifierListElement.getIdentifier();
    }
};


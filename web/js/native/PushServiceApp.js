"use strict";

tutao.provide('tutao.native.PushServiceApp');

/**
 * Register or unregister for push notifications
 * @implements {tutao.native.PushServiceInterface}
 */
tutao.native.PushServiceApp = function(){
    this.pushNotification = null;
    this._currentPushIdentifier = "";
};

/**
 * @return {Promise.<undefined, Error>} Resolves if the registration of this device has been started.
 */
tutao.native.PushServiceApp.prototype.register = function() {
    var self = this;
    //PushNotification.hasPermission(function(data) callback does not work for older android devices.
    self.pushNotification = PushNotification.init({
        android: {
            senderID: "707517914653"
        },
        ios: {
            alert: "true",
            badge: "true",
            sound: "true"
        },
        windows: {}
    });

    self.pushNotification.on('registration', function(data) {
        //tutao.tutanota.gui.alert("Push notification registration: " +  data.registrationId);
        if ( tutao.env.isIOSApp()) {
            self.updatePushIdentifier(data.registrationId, tutao.entity.tutanota.TutanotaConstants.PUSH_SERVICE_TYPE_IOS);
        } else {
            self.updatePushIdentifier(data.registrationId, tutao.entity.tutanota.TutanotaConstants.PUSH_SERVICE_TYPE_ANDROID);
        }
    });

    self.pushNotification.on('notification', function(data) {
         //tutao.tutanota.gui.alert("Push notification received: " +  data.title + " foreground: " + data.additionalData.foreground);
        if (data.additionalData.foreground) {
            navigator.vibrate([300]);
        }
    });

    self.pushNotification.on('error', function(e) {
        //tutao.tutanota.gui.alert("Error from push service:");
    });
};


tutao.native.PushServiceApp.prototype.updatePushIdentifier = function(identifier, identifierType){
    var listId = tutao.locator.userController.getLoggedInUser().getPushIdentifierList().getList();
    this._currentPushIdentifier = identifier;
    tutao.rest.EntityRestInterface.loadAll(tutao.entity.sys.PushIdentifier, listId, tutao.rest.EntityRestInterface.GENERATED_MIN_ID).then(function (elements) {
        var existingPushIdentifier = null;
        for(var i=0; i<elements.length;i++){
            if (elements[i].getIdentifier() == identifier){
                existingPushIdentifier = elements[i];
                break;
            }
        }
        if (existingPushIdentifier == null){
            new tutao.entity.sys.PushIdentifier()
                .setOwnerGroup(tutao.locator.userController.getUserGroupId())
                .setOwner(tutao.locator.userController.getUserGroupId()) // legacy
                .setArea("0") // legacy
                .setPushServiceType(identifierType)
                .setIdentifier(identifier)
                .setLanguage(tutao.locator.languageViewModel.getCurrentLanguage())
                .setup(listId);
        } else {
            if (existingPushIdentifier.getLanguage() != tutao.locator.languageViewModel.getCurrentLanguage()){
                existingPushIdentifier
                    .setLanguage(tutao.locator.languageViewModel.getCurrentLanguage())
                    .update();
            }
        }
    });
};


/**
 * @param {string} pushIdentifier The push identifier to check.
 * @return {boolean} Returns true if the push identifier is assigned to the current device.
 */
tutao.native.PushServiceApp.prototype.isCurrentPushIdentifier = function(pushIdentifier) {
    return this._currentPushIdentifier == pushIdentifier;
};


tutao.native.PushServiceApp.prototype.updateBadge = function(number) {
    if (cordova.platformId == 'ios') {
        // on ios, the badge is always visible on the home screen
		if (this.pushNotification != null){
			this.pushNotification.setApplicationIconBadgeNumber(function() {}, function() {}, number);
		}
    } else {
        // on android, the badge is a part of the notification. Notifications are handled by push service
    }
};





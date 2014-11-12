"use strict";

tutao.provide('tutao.native.PushServiceApp');

/**
 * Register or unregister for push notifications
 * @implements {tutao.native.PushServiceBrowser}
 */
tutao.native.PushServiceApp = function(){
    this.pushNotification = window.plugins.pushNotification;
};

/**
 * @return {Promise.<undefined, Error>} Resolves if the registration of this device has been started.
 */
tutao.native.PushServiceApp.prototype.register = function() {
    var self = this;
    if (cordova.platformId == 'android') {
        return new Promise(function (resolve, reject) {
            self.pushNotification.register(
                resolve,
                reject,
                {
                    "senderID": '707517914653', // TODO (before release): check if senderid can be made public
                    "ecb": "tutao.locator.pushService.onAndroidNotification"
                });
        });
    } else if (cordova.platformId == 'ios') {
        return new Promise( function(resolve, reject){
            self.pushNotification.register(
                function (token) {
                    resolve();
                    self.updatePushIdentifier(token, tutao.entity.tutanota.TutanotaConstants.PUSH_SERVICE_TYPE_IOS);
                },
                reject,
                {
                    "badge":"true",
                    "sound":"true",
                    "alert":"true",
                    "ecb":"tutao.locator.pushService.onIosNotification"
                });
        });
    }
};


tutao.native.PushServiceApp.prototype.updatePushIdentifier = function(identifier, identifierType){
    var listId = tutao.locator.userController.getLoggedInUser().getPushIdentifierList().getList();
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
                .setOwner(tutao.locator.userController.getUserGroupId())
                .setArea(tutao.entity.tutanota.TutanotaConstants.AREA_SYSTEM)
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


tutao.native.PushServiceApp.prototype.onIosNotification = function(e) {
    if ( event.alert ) {
        navigator.notification.alert(event.alert);
    }

    if ( event.sound ) {
        var snd = new Media(event.sound);
        snd.play();
    }

    if ( event.badge ) {
        //this.pushNotification.setApplicationIconBadgeNumber(successHandler, errorHandler, event.badge);
    }
};

tutao.native.PushServiceApp.prototype.onAndroidNotification = function(e) {
    switch( e.event ){
        case 'registered':
            if ( e.regid.length > 0 ) {
                // Your GCM push server needs to know the regID before it can push to this device
                // here is where you might want to send it the regID for later use.
                //console.log("regID = " + e.regid);
                this.updatePushIdentifier(e.regid, tutao.entity.tutanota.TutanotaConstants.PUSH_SERVICE_TYPE_ANDROID);
            }
            break;
        case 'message':
            // if this flag is set, this notification happened while we were in the foreground.
            // you might want to play a sound to get the user's attention, throw up a dialog, etc.
            if ( e.foreground ){
                // alert("push notification while in foreground");

                // on Android soundname is outside the payload.
                // On Amazon FireOS all custom attributes are contained within payload
                //var soundfile = e.soundname || e.payload.sound;
                // if the notification contains a soundname, play it.
                //var my_media = new Media("/android_asset/www/"+ soundfile);
                //my_media.play();
            }
            else {  // otherwise we were launched because the user touched a notification in the notification tray.
                if ( e.coldstart ){
                    //alert("push notification while in background --COLDSTART NOTIFICATION--");
                }
                else{
                    //alert("push notification while in background --BACKGROUND NOTIFICATION--");
                }
            }

            //$("#app-status-ul").append('<li>MESSAGE -> MSG: ' + e.payload.message + '</li>');
            //Only works for GCM
            //$("#app-status-ul").append('<li>MESSAGE -> MSGCNT: ' + e.payload.msgcnt + '</li>');
            //Only works on Amazon Fire OS
            //$status.append('<li>MESSAGE -> TIME: ' + e.payload.timeStamp + '</li>');
            break;

        case 'error':
            //alert(" --ERROR -> MSG:--" + e.msg);
            break;

        default:
            //alert("EVENT -> Unknown, an event was received and we do not know what it is");
            break;
    }
};

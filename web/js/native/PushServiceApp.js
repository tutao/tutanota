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
            pushNotification.register(
                resolve,
                reject,
                {
                    "senderID": '707517914653',
                    "ecb": "tutao.locator.pushService.onAndroidNotification"
                });
        });
    } else if (cordova.platformId == 'ios') {
        pushNotification.register(
            function (token) {
                self.updatePushIdentifier(token, tutao.entity.tutanota.TutanotaConstants.PUSH_SERVICE_TYPE_IOS);
            },
            reject,
            {
                "badge":"true",
                "sound":"true",
                "alert":"true",
                "ecb":"tutao.locator.pushService.onIosNotification"
            });
    }
};


tutao.native.PushServiceApp.prototype.updatePushIdentifier = function(identifier, identifierType){
    var listId = tutao.locator.userController.getLoggedInUser().getPushIdentifierList().getList();
    tutao.rest.EntityRestInterface.loadAll(tutao.entity.sys.PushIdentifier, listId).then(function (elements) {
        var identifier = null;
        for(var i=0; i<elements.length;i++){
            if (elements[i].getIdentifier() == identifier){
                identifier = elements[i].getIdentifier();
                break;
            }
        }
        if (identifier == null){
            new tutao.entity.sys.PushIdentifier()
                .setType(identifierType)
                .setIdentifier(identifier)
                .setLanguage(tutao.locator.languageViewModel.getCurrentLanguage())
                .setup();
        } else {
            if (identifier.getLanguage() != tutao.locator.languageViewModel.getCurrentLanguage()){
                identifier
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
        pushNotification.setApplicationIconBadgeNumber(successHandler, errorHandler, event.badge);
    }
};

tutao.native.PushServiceApp.prototype.onAndroidNotification = function(e) {
    switch( e.event ){
        case 'registered':
            if ( e.regid.length > 0 ) {
                // Your GCM push server needs to know the regID before it can push to this device
                // here is where you might want to send it the regID for later use.
                console.log("regID = " + e.regid);
                this.updatePushIdentifier(e.regid, tutao.entity.tutanota.TutanotaConstants.PUSH_SERVICE_TYPE_ANDROID);
            }
            break;
        case 'message':
            // if this flag is set, this notification happened while we were in the foreground.
            // you might want to play a sound to get the user's attention, throw up a dialog, etc.
            if ( e.foreground ){
                $("#app-status-ul").append('<li>--INLINE NOTIFICATION--' + '</li>');

                // on Android soundname is outside the payload.
                // On Amazon FireOS all custom attributes are contained within payload
                var soundfile = e.soundname || e.payload.sound;
                // if the notification contains a soundname, play it.
                var my_media = new Media("/android_asset/www/"+ soundfile);
                my_media.play();
            }
            else {  // otherwise we were launched because the user touched a notification in the notification tray.
                if ( e.coldstart )
                {
                    $("#app-status-ul").append('<li>--COLDSTART NOTIFICATION--' + '</li>');
                }
                else
                {
                    $("#app-status-ul").append('<li>--BACKGROUND NOTIFICATION--' + '</li>');
                }
            }

            $("#app-status-ul").append('<li>MESSAGE -> MSG: ' + e.payload.message + '</li>');
            //Only works for GCM
            $("#app-status-ul").append('<li>MESSAGE -> MSGCNT: ' + e.payload.msgcnt + '</li>');
            //Only works on Amazon Fire OS
            $status.append('<li>MESSAGE -> TIME: ' + e.payload.timeStamp + '</li>');
            break;

        case 'error':
            $("#app-status-ul").append('<li>ERROR -> MSG:' + e.msg + '</li>');
            break;

        default:
            $("#app-status-ul").append('<li>EVENT -> Unknown, an event was received and we do not know what it is</li>');
            break;
    }
};

// Copyright (c) Microsoft Open Technologies, Inc.  Licensed under the MIT license. 

module.exports = {
    register: function (success, fail, args) {
        try {
            var onNotificationReceived = window[args[0].ecb];

            Windows.Networking.PushNotifications.PushNotificationChannelManager.createPushNotificationChannelForApplicationAsync().then(
                function (channel) {
                    channel.addEventListener("pushnotificationreceived", onNotificationReceived);
                    success(channel);
            }, fail);
        } catch(ex) {
            fail(ex);
        }
    }
};
require("cordova/windows8/commandProxy").add("PushPlugin", module.exports);
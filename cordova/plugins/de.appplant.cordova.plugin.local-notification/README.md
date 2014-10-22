Cordova Local-Notification Plugin
==================================

The essential purpose of local notifications is to enable an application to inform its users that it has something for them — for example, a message or an upcoming appointment — when the application isn’t running in the foreground.<br>
They are scheduled by an application and delivered on the same device.

### How they appear to the user
Users see notifications in the following ways:
- Displaying an alert or banner
- Badging the app’s icon
- Playing a sound

### Examples of Notification Usage
Local notifications are ideally suited for applications with time-based behaviors, such as calendar and to-do list applications. Applications that run in the background for the limited period allowed by iOS might also find local notifications useful.<br>
For example, applications that depend on servers for messages or data can poll their servers for incoming items while running in the background; if a message is ready to view or an update is ready to download, they can then present a local notification immediately to inform their users.

### Plugin's Purpose
The purpose of the plugin is to create an platform independent javascript interface for [Cordova][cordova] based mobile applications to access the specific API on each platform.


## Supported Platforms
- **iOS** *(including iOS8)*<br>
See [Local and Push Notification Programming Guide][ios_notification_guide] for detailed informations and screenshots.

- **Android** *(SDK >=11)*<br>
See [Notification Guide][android_notification_guide] for detailed informations and screenshots.

- **WP8**<br>
See [Local notifications for Windows Phone][wp8_notification_guide] for detailed informations and screenshots.
<br>*Windows Phone 8.0 has no notification center. Instead local notifications are realized through live tiles updates.*


## Dependencies
[Cordova][cordova] will check all dependencies and install them if they are missing.
- [org.apache.cordova.device][apache_device_plugin] *(since v0.6.0)*


# Installation
The plugin can either be installed into the local development environment or cloud based through [PhoneGap Build][PGB].

### Adding the Plugin to your project
Through the [Command-line Interface][CLI]:
```bash
# ~~ from master ~~
cordova plugin add https://github.com/katzer/cordova-plugin-local-notifications.git
```
or to use the last stable version:
```bash
# ~~ stable version ~~
cordova plugin add de.appplant.cordova.plugin.local-notification@0.7.6
```

### Removing the Plugin from your project
Through the [Command-line Interface][CLI]:
```bash
cordova plugin rm de.appplant.cordova.plugin.local-notification
```

### PhoneGap Build
Add the following xml to your config.xml to always use the latest version of this plugin:
```xml
<gap:plugin name="de.appplant.cordova.plugin.local-notification" />
```
or to use an specific version:
```xml
<gap:plugin name="de.appplant.cordova.plugin.local-notification" version="0.7.6" />
```
More informations can be found [here][PGB_plugin].


## ChangeLog

#### Version 0.7.6 (03.10.2014)
- [bugfix:] `hasPermission` and `promptForPermission` let the app crash on iOS7 and older.
- [bugfix:] Convert the id value to a String before comparison.
- [bugfix:] Prevent possible crash when calling `cancelAll`.
- [enhancement:] Do not inherit any notification defaults.

#### Version 0.7.5 (29.09.2014)
- [enhancement:] __iOS8 Support__
- [feature:] New method `hasPermission` to ask if the user has granted to display local notifications.
- [feature:] New method `promptForPermission` to promt the user to grant permission to display local notifications.

#### Further informations
- See [CHANGELOG.md][changelog] to get the full changelog for the plugin.


## Using the plugin
The plugin creates the object ```window.plugin.notification.local``` with the following methods:

### Plugin initialization
The plugin and its methods are not available before the *deviceready* event has been fired.

```javascript
document.addEventListener('deviceready', function () {
    // window.plugin.notification.local is now available
}, false);
```

### Determine if the app does have the permission to show local notifications
If the permission has been granted through the user can be retrieved through the `notification.local.hasPermission` interface.<br/>
The method takes a callback function as its argument which will be called with a boolean value. Optional the scope of the callback function ca be defined through a second argument.

#### Further informations
- The method is supported on each platform, however its only relevant for iOS8 and above.

```javascript
window.plugin.notification.local.hasPermission(function (granted) {
    // console.log('Permission has been granted: ' + granted);
});
```

### Prompt the user to grant permission for local notifications
The user can be prompted to grant the required permission through the `notification.local.promptForPermission` interface.

#### Further informations
- The method is supported on each platform, however its only relevant for iOS8 and above.
- The user will only get a prompt dialog for the first time. Later its only possible to change the setting via the notification center.

```javascript
window.plugin.notification.local.promptForPermission();
```

### Schedule local notifications
Local notifications can be scheduled through the `notification.local.add` interface.<br>
The method takes a hash as an argument to specify the notification's properties and returns the ID for the notification.<br>
Scheduling a local notification will override the previously one with the same ID.
All properties are optional. If no date object is given, the notification pops-up immediately.

**Note:** On Android the notification id needs to be a string which can be converted to a number.
If the ID has an invalid format, it will be ignored, but canceling the notification will fail.

#### Further informations
- The notification can only be scheduled if the user has previously granted the [required permission][prompt_permission].
- See the [onadd][onadd] event of how a listener can be registered to be notified when a local notification has been scheduled.
- See the [ontrigger][ontrigger] event of how a listener can be registered to be notified when a local notification has been triggered.
- See the [onclick][onclick] event of how a listener can be registered to be notified when the user has been clicked on a local notification.
- See the [platform specific properties][platform_specific_properties] of which other properties are available too.
- See [getDefaults][getdefaults] of which property values are used by default and [setDefaults][setdefaults] of how to override them.
- See the [examples][examples] of how to schedule local notifications.

```javascript
window.plugin.notification.local.add({
    id:         String,  // A unique id of the notifiction
    date:       Date,    // This expects a date object
    message:    String,  // The message that is displayed
    title:      String,  // The title of the message
    repeat:     String,  // Either 'secondly', 'minutely', 'hourly', 'daily', 'weekly', 'monthly' or 'yearly'
    badge:      Number,  // Displays number badge to notification
    sound:      String,  // A sound to be played
    json:       String,  // Data to be passed through the notification
    autoCancel: Boolean, // Setting this flag and the notification is automatically canceled when the user clicks it
    ongoing:    Boolean, // Prevent clearing of notification (Android only)
});
```

### Cancel scheduled local notifications
Local notifications can be canceled through the `notification.local.cancel` interface.<br>
Note that only local notifications with an ID can be canceled.

#### Further informations
- See the [oncancel][oncancel] event of how a listener can be registered to be notified when a local notification has been canceled.
- See [getScheduledIds][getscheduledids] of how to retrieve a list of IDs of all scheduled local notifications.

```javascript
window.plugin.notification.local.cancel(ID);
```

### Cancel all scheduled local notifications
All local notifications can be canceled through the `notification.local.cancelAll` interface.<br>
The method cancels all local notifications even if they have no ID.

#### Further informations
- See the [oncancel][oncancel] event of how a listener can be registered to be notified when a local notification has been canceled.

```javascript
window.plugin.notification.local.cancelAll();
```

### Check wether a notification with an ID is scheduled
To check if a notification with an ID is scheduled, the `notification.local.isScheduled` interface can be used.<br>
The method takes the ID of the local notification as an argument and a callback function to be called with the result.

#### Further informations
- See [getScheduledIds][getscheduledids] of how to retrieve a list of IDs of all scheduled local notifications.

```javascript
window.plugin.notification.local.isScheduled(id, function (isScheduled) {
    // console.log('Notification with ID ' + id + ' is scheduled: ' + isScheduled);
});
```

### Retrieve the IDs from all currently scheduled local notifications
To retrieve the IDs from all currently scheduled local notifications, the `notification.local.isScheduled` interface can be used.<br>
The method takes a callback function to be called with the result as an array of IDs.

```javascript
window.plugin.notification.local.getScheduledIds( function (scheduledIds) {
    // alert('Scheduled IDs: ' + scheduledIds.join(' ,'));
});
```

### Get the default values of the local notification properties
The default values of the local notification properties can be retrieved through the `notification.local.getDefaults` interface.<br>
The method returns an object of values for all available local notification properties on the platform.

#### Further informations
- See [setDefaults][setdefaults] of how to override the default values.

```javascript
window.plugin.notification.local.getDefaults(); // => Object
```

### Set the default values of the local notification properties
The default values of the local notification properties can be set through the `notification.local.setDefaults` interface.<br>
The method takes an object as argument.

#### Further informations
- See the [add][add] interface and the [platform specific properties][platform_specific_properties] to get an overview about all available local notification properties.
- See the [example][setdefaults_example] of how to override default values.

```javascript
window.plugin.notification.local.setDefaults(Object);
```

### Get notified when a local notification has been scheduled
The `notification.local.onadd` interface can be used to get notified when a local notification has been scheduled.

The listener has to be a function and takes the following arguments:
 - id: The ID of the notification
 - state: Either *background* or *foreground*
 - json: A custom (JSON encoded) string

**Note:** The event is only being invoked in background if the app is not suspended!

#### Further informations
- See the [ontrigger][ontrigger] event of how a listener can be registered to be notified when a local notification has been triggered.

```javascript
window.plugin.notification.local.onadd = function (id, state, json) {};
```

### Get notified when a local notification has been triggered
The `notification.local.ontrigger` interface can be used to get notified when a local notification has been triggered.

The listener has to be a function and takes the following arguments:
 - id: The ID of the notification
 - state: Either *background* or *foreground*
 - json: A custom (JSON encoded) string

**Note:** The event is only being invoked in background if the app is running and is not suspended!

#### Further informations
- See the [onclick][onclick] event of how a listener can be registered to be notified when the user has been clicked on a local notification.

```javascript
window.plugin.notification.local.ontrigger = function (id, state, json) {};
```

### Get notified when the user has been clicked on a local notification
The `notification.local.onclick` interface can be used to get notified when the user has been clicked on a local notification.

The listener has to be a function and takes the following arguments:
 - id: The ID of the notification
 - state: Either *background* or *foreground*
 - json: A custom (JSON encoded) string

**Note:** The event is only being invoked in background if the app is not suspended!

#### Further informations
- The *autoCancel* property can be used to either automatically cancel the local notification or not after it has been clicked by the user.

```javascript
window.plugin.notification.local.onclick = function (id, state, json) {};
```

### Get notified when a local notification has been canceled
The `notification.local.oncancel` interface can be used to get notified when a local notification has been canceled.

The listener has to be a function and takes the following arguments:
 - id: The ID of the notification
 - state: Either *background* or *foreground*
 - json: A custom (JSON encoded) string

**Note:** The event is not being invoked if the local notification has been cleared in the notification center.

#### Further informations
- The *autoCancel* property can be used to either automatically cancel the local notification or not after it has been clicked by the user.
- See [cancel][cancel] and [cancelAll][cancelall] of how to cancel local notifications manually.

```javascript
window.plugin.notification.local.oncancel = function (id, state, json) {};
```


## Examples
### Scheduling a repeating local notification in the future
The following example shows how to schedule a local notification which will be triggered every week on this day, 60 seconds from now.

```javascript
var now                  = new Date().getTime(),
    _60_seconds_from_now = new Date(now + 60*1000);

window.plugin.notification.local.add({
    id:      1,
    title:   'Reminder',
    message: 'Dont forget to buy some flowers.',
    repeat:  'weekly',
    date:    _60_seconds_from_now
});
```

__Note:__ The notification can only be scheduled if the user has granted the [required permission][prompt_permission].

### Scheduling an immediately triggered local notification
The example below shows how to schedule a local notification which will be triggered immediatly.

```javascript
window.plugin.notification.local.add({ message: 'Great app!' });
```

### Schedule a silent local notification
By default the system sound for local notifications will be used. To turn off any sound the *sound* property has to be set to *NULL*.

```javascript
window.plugin.notification.local.add({ sound: null });
```

### Assign user data to the notification
If needed local notifications can be scheduled with any user data. That data can be accessed on each event listener. But cannot be modified later.

```javascript
window.plugin.notification.local.add({
    id:         1,
    message:    'I love BlackBerry!',
    json:       JSON.stringify({ test: 123 })
});

window.plugin.notification.local.onclick = function (id, state, json) {
    console.log(id, JSON.parse(json).test);
}
```

### Change the default value of local notification properties
The following example shows how to override the default value of the *autoCancel* property.

```javascript
window.plugin.notification.local.setDefaults({ autoCancel: true });
```


## Platform specifics

### Small and large icons on Android
By default all notifications will display the app icon. But an specific icon can be defined through the `icon` and `smallIcon` properties.

```javascript
/**
 * Displays the <package.name>.R.drawable.ic_launcher icon
 */
window.plugin.notification.local.add({ icon: 'ic_launcher' });

/**
 * Displays the android.R.drawable.ic_dialog_email icon
 */
window.plugin.notification.local.add({ smallIcon: 'ic_dialog_email' });
```

### Notification sound on Android
The sound must be a absolute or relative Uri pointing to the sound file. The default sound is `RingtoneManager.TYPE_NOTIFICATION`.

**Note:** Local sound files must be placed into the res-folder and not into the assets-folder.

```javascript
/**
 * Plays the `beep.mp3` which has to be located in the res folder
 */
window.plugin.notification.local.add({ sound: 'android.resource://' + package_name + '/raw/beep' });

/**
 * Plays a remote sound
 */
window.plugin.notification.local.add({ sound: 'http://remotedomain/beep.mp3' });

/**
 * Plays a sound file which has to be located in the android_assets folder
 */
window.plugin.notification.local.add({ sound: '/www/audio/beep.mp3' });

/**
 * Plays the `RingtoneManager.TYPE_ALARM` sound
 */
window.plugin.notification.local.add({ sound: 'TYPE_ALARM' });
```

### Notification sound on iOS
You can package the audio data in an *aiff*, *wav*, or *caf* file. Then, in Xcode, add the sound file to your project as a nonlocalized resource of the application bundle. You may use the *afconvert* tool to convert sounds.

**Note:** The right to play notification sounds in the notification center settings has to be granted.<br>
**Note:** Custom sounds must be under 30 seconds when played. If a custom sound is over that limit, the default system sound is played instead.

```javascript
/**
 * Plays the `beep.mp3` which has to be located in the root folder of the project
 */
window.plugin.notification.local.add({ sound: 'beep.caf' });

/**
 * Plays the `beep.mp3` which has to be located in the www folder
 */
window.plugin.notification.local.add({ sound: 'www/sounds/beep.caf' });
```

### LiveTile background images on WP8
LiveTile's have the ability to display images for different sizes. These images can be defined through the `smallImage`, `image` and `wideImage` properties.

**Note:** An image must be defined as a relative or absolute URI. They can be restored to the default ones by canceling the notification.

```javascript
/**
 * Displays the application icon as the livetile's background image
 */
window.plugin.notification.local.add({ image: 'appdata:ApplicationIcon.png' })
```

### Custom repeating interval on Android
To specify a custom interval, the `repeat` property can be assigned with an number in minutes.

```javascript
/**
 * Schedules the notification quarterly every 15 mins
 */
window.plugin.notification.local.add({ repeat: 15 });
```


## Quirks

### Local Notification limit on iOS
Each application on a device is limited to 64 scheduled local notifications.<br>
The system discards scheduled notifications in excess of this limit, keeping only the 64 notifications that will fire the soonest. Recurring notifications are treated as a single notification.

### Events aren't fired on iOS
After deploying/replacing the app on the device via Xcode no callback for previously scheduled local notifications aren't fired.

### No sound is played on iOS 7
The right to play notification sounds in the notification center settings has to be granted.

### Adding a notification on WP8
An application can only display one notification at a time. Each time a new notification has to be added, the application live tile's data will be overwritten by the new ones.

### TypeError: Cannot read property 'currentVersion' of null
Along with Cordova 3.2 and Windows Phone 8 the `version.bat` script has to be renamed to `version`.

On Mac or Linux
```
mv platforms/wp8/cordova/version.bat platforms/wp8/cordova/version
```
On Windows
```
ren platforms\wp8\cordova\version.bat platforms\wp8\cordova\version
```

### Black screen (or app restarts) on Android after a notification was clicked
The launch mode for the main activity has to be set to `singleInstance`
```xml
<activity ... android:launchMode="singleInstance" ... />
```


## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request


## License

This software is released under the [Apache 2.0 License](http://opensource.org/licenses/Apache-2.0).

© 2013-2014 appPlant UG, Inc. All rights reserved


[cordova]: https://cordova.apache.org
[ios_notification_guide]: http://developer.apple.com/library/ios/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/Chapters/WhatAreRemoteNotif.html
[android_notification_guide]: http://developer.android.com/guide/topics/ui/notifiers/notifications.html
[wp8_notification_guide]: http://msdn.microsoft.com/en-us/library/windowsphone/develop/jj207047.aspx
[apache_device_plugin]: https://github.com/apache/cordova-plugin-device
[CLI]: http://cordova.apache.org/docs/en/3.0.0/guide_cli_index.md.html#The%20Command-line%20Interface
[PGB]: http://docs.build.phonegap.com/en_US/3.3.0/index.html
[PGB_plugin]: https://build.phonegap.com/plugins/1196
[changelog]: CHANGELOG.md
[has_permission]: #determine-if-the-app-does-have-the-permission-to-show-local-notifications
[prompt_permission]: #prompt-the-user-to-grant-permission-for-local-notifications
[onadd]: #get-notified-when-a-local-notification-has-been-scheduled
[onclick]: #get-notified-when-the-user-has-been-clicked-on-a-local-notification
[oncancel]: #get-notified-when-a-local-notification-has-been-canceled
[ontrigger]: #get-notified-when-a-local-notification-has-been-triggered
[platform-specific-properties]: #platform-specifics
[add]: #schedule-local-notifications
[cancel]: #cancel-scheduled-local-notifications
[cancelall]: #cancel-all-scheduled-local-notifications
[getdefaults]: #get-the-default-values-of-the-local-notification-properties
[setdefaults]: #set-the-default-values-of-the-local-notification-properties
[getscheduledids]: #retrieve-the-ids-from-all-currently-scheduled-local-notifications
[isscheduled]: #check-wether-a-notification-with-an-id-is-scheduled
[examples]: #examples
[setdefaults-example]: #change-the-default-value-of-local-notification-properties

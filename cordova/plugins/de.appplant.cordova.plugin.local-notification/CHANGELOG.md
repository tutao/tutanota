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

#### Version 0.7.4 (22.03.2014)
- [bugfix:] Platform specific properties were ignored.
- [bugfix:] `cancel` may throw an error if the OS returns NIL values (iOS).
- [bugfix:] Replacing a notification with the same ID may result into canceling both (iOS).
- [bugfix:] Missing `deviceready` method (WP8).

#### Version 0.7.3 (16.03.2014)
- [bugfix:] cancel callbacks have not been fired after all notifications have been canceled on iOS.
- [change:] The `oncancel` callback will be called at last if `autoCancel` is set to true (iOS).
- [bugfix:] Callbacks for non-repeating notifications were not called if they were not created in the current app instance on iOS.
- [enhancement:] Added 'secondly' and 'minutely' as new repeat time aliases.
- [bugfix:] `sound:null` didnt work for Android. The default sound was played.
- [feature:] New interface `isScheduled` to check wether a notification with an ID is pending.
- [feature:] New interface `getScheduledIds` to retrieve a list with all currently pending notifications.
- [enhancement:] Support for bigview style notifications for Android devices.
- [bugfix:] Sound didnt play properly on iOS/Android.
- [bugfix:] click event on iOS wasn't fired if app was not running.
- [enhancement:] GET_TASK permission not needed anymore for Android.

#### Version 0.7.2 (09.02.2014)
- [enhancement:] Avoid blocking the main thread (on Android) **(dpogue)**.
- [bugfix:] `onadd` was called each time after a repeating message was triggered (Android)
- [change:] Reset badge with cancelAll.
- [bugfix:] `onclick` instead of `ontrigger` was called on "slow" iOS devices.

#### Version 0.7.1 (31.01.2014)
- [bugfix:] `ongoing` attribute was ignored.
- [bugfix:] `oncancel` wasnt fired if `autoCancel` was set to true.
- [bugfix:] App throwed an error at restart if a callback was registered.

#### Version 0.7.0 (22.01.2014)
**Note:** The new way of callback registration will be not compatible with previous versions! See #62
- **[feature:]** Added new callback registration interface and new callback types.
- [feature:] Added the ability to override notifications default properties.
- [bugfix:] Fixed build failure if iOS/MacOS/Xcode were to old (#68).
- **[change]** The message and not the title will be used as the ticker text.

#### Version 0.7.0beta1 (17.01.2014)
- [bugfix:] App throws an error on iOS if `message` is null.
- [bugfix:] Removed extra line break on iOS if `title` is null or empty.
- [bugfix:] Notification on iOS will be canceled if a new one with the same ID was added.
- [feature:] Added `autoCancel` flag.
- [bugfix:] `cancel` on iOS did not work.
- [enhancement:] Added 'hourly' as a new repeat time aliase.
- [enhancement:] Repeat with custom intervals on Android.
- **[change:]** Callbacks are called with the ID as a number and not as a string.
- [enhancement:] The background callback on Android is called, even the app is not running when the notification is tapped.
- [enhancement:] Notifications are repeated more precisely.
- [feature:] Added `json` property to pass custom data through the notification.
- [enhancement:] Added Android specific property `smallImage`.
- [enhancement:] Added Android specific property `ongoing`.
- [enhancement:] Setting launchMode to *singleInstance* isn't necessary anymore.

#### Version 0.6.3 (12.12.2013)
- [bugfix:] Black screen on Android.
- [bugfix:] App throws an error on reboot on Android.
- [enhancement:] Calling `cancel` on Android with an invalid String as ID does not throw an error anymore.

#### Version 0.6.2 (04.12.2013)
- Release under the Apache 2.0 license.

#### Version 0.6.1 (04.12.2013)
- Release under the LGPL 2.1 license.
- [feature:] Sound can be specified on Android.
- [enhancement:] Adding notifications on Android does not block the ui thread anymore.
- [bugfix:] The app did stop/crash after removing them from recent apps list.
- [enhancement:] Adding notifications on iOS does not block the ui thread anymore.
- [bugfix:] Added missing `RECEIVE_BOOT_COMPLETED`permission on Android.
- [enhancement:] Rework the code for Android. Thanks to ***samsara (samsarayg)***.
- [bugfix:] `cancel` on iOS did not work do to wrong param type.
- [enhancement:] `cancel` & `cancelAll` remove the notification(s) from notification center as well on Android.
- [bugfix:] Missing background callback on Android.
- [bugfix:] Android notification is not shown when the app is not running.

#### Version 0.6.0 (16.11.2013)
- Added WP8 support<br>
  *Based on the LiveTiles WP8 plugin made by* ***Jesse MacFadyen (purplecabbage)***
- [enhancement:] The `add()` function now returns the id of the created notification.
- [feature:] Added new `title` property.
- [bugfix:] `cancel` on iOS did not work do to wrong dict key.
- [enhancement:] All notifications on Android display the app icon by default.
- [feature:] Icon can be specified on Android.

#### Version 0.4.0 (06.10.2013)
- Added Android support<br>
  *Based on the LocalNotifications Android plugin made by* ***Daniël (dvtoever)***

#### Version 0.2.0 (11.08.2013)
- Added iOS support<br>
  *Based on the LocalNotifications iOS plugin made by* ***Rodrigo Moyle***
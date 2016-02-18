ChangeLog
---------

Please also read the [Upgrade Guide](https://github.com/katzer/cordova-plugin-local-notifications/wiki/Upgrade-Guide) for more information.

#### Version 0.8.4 (04.01.2016)
- Bug fixes
 - SyntaxError: missing ) after argument list

#### Version 0.8.3 (03.01.2016)
- Platform enhancements
 - Support for the `Crosswalk Engine`
 - Support for `cordova-ios@4` and the `WKWebView Engine`
 - Support for `cordova-windows@4` and `Windows 10` without using hooks
- Enhancements
 - New `color` attribute for Android (Thanks to @Eusebius1920)
 - New `quarter` intervall for iOS & Android
 - `smallIcon` is optional (Android)
 - `update` checks for permission like _schedule_
 - Decreased time-frame for trigger event (iOS)
 - Force `every:` to be a string on iOS
- Bug fixes
 - Fixed #634 option to skip permission check
 - Fixed #588 crash when basename & extension can't be extracted (Android)
 - Fixed #732 loop between update and trigger (Android)
 - Fixed #710 crash due to >500 notifications (Android)
 - Fixed #682 crash while resuming app from notification (Android 6)
 - Fixed #612 cannot update icon or sound (Android)
 - Fixed crashing get(ID) if notification doesn't exist
 - Fixed #569 getScheduled returns two items per notification
 - Fixed #700 notifications appears on bootup

#### Version 0.8.2 (08.11.2015)
- Submitted to npm
- Initial support for the `windows` platform
- Re-add autoCancel option on Android
- Warn about unknown properties
- Fix crash on iOS 9
- Fixed webView-Problems with cordova-android 4.0
- Fix get* with single id
- Fix issue when passing data in milliseconds
- Update device plugin id
- Several other fixes

#### Version 0.8.1 (08.03.2015)

- Fix incompatibility with cordova version 3.5-3.0
- Fire `clear` instead of `cancel` event when clicked on repeating notifications
- Do not fire `clear` or `cancel` event when clicked on persistent notifications

### Version 0.8.0 (05.03.2015)

- Support for iOS 8, Android 2 (SDK >= 7) and Android 5
 - Windows Phone 8.1 will be added soon
- New interfaces to ask for / register permissions required to schedule local notifications
 - `hasPermission()` and `registerPermission()`
 - _schedule()_ will register the permission automatically and schedule the notification if granted.
- New interface to update already scheduled|triggered local notifications
 - `update()`
- New interfaces to clear the notification center
 - `clear()` and `clearAll()`
- New interfaces to query for local notifications, their properties, their IDs and their existence depend on their state
 - `isPresent()`, `isScheduled()`, `isTriggered()`
 - `getIds()`, `getAllIds()`, `getScheduledIds()`, `getTriggeredIds()`
 - `get()`, `getAll()`, `getScheduled()`, `getTriggered()`
- Schedule multiple local notifications at once
 - `schedule( [{...},{...}] )`
- Update multiple local notifications at once
 - `update( [{...},{...}] )`
- Clear multiple local notifications at once
 - `clear( [1, 2] )`
- Cancel multiple local notifications at once
 - `cancel( [1, 2] )`
- New URI format to specify sound and image resources
 - `http(s):` for remote resources _(Android)_
 - `file:` for local resources relative to the _www_ folder
 - `res:` for native resources
- New events
 - `schedule`, `update`, `clear`, `clearall` and `cancelall`
- Enhanced event informations
 - Listener will get called with the local notification object instead of only the ID
- Multiple listener for one event
 - `on(event, callback, scope)`
- Unregister event listener
 - `un(event, callback)`
- New Android specific properties
 - `led` properties
 - `sound` and `image` accepts remote resources
- Callback function and scope for all interface methods
 - `schedule( notification, callback, scope )`
- Renamed `add()` to `schedule()`
- `autoCancel` property has been removed
 - Use `ongoing: true` for persistent local notifications on Android
- Renamed repeat intervals
 - `second`, `minute`, `hour`, `day`, `week`, `month` and `year`
- Renamed some local notification properties
 - `date`, `json`, `message` and `repeat`
 - Scheduling local notifications with the deprecated properties is still possible
- [Kitchen Sink sample app](https://github.com/katzer/cordova-plugin-local-notifications/tree/example)
- [Wiki](https://github.com/katzer/cordova-plugin-local-notifications/wiki)

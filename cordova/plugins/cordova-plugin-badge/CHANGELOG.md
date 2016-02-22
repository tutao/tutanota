## ChangeLog

#### Version 0.7.2 (19.02.2016)
- __New ID__ `cordova-plugin-badge`
- Upgraded ShortcutBadger to v1.1.4
- Use new app-event plugin
- Removed support for Amazon FireOS (ShortcutBadger doesnt support it)

#### Version 0.7.1 (30.07.2015)
- Support for app icon badges on selective Android platforms thanks to [ShortcutBadger](https://github.com/leolin310148/ShortcutBadger)
  - Sony
  - Samsung
  - LG
  - HTC
  - Xiaomi
  - ASUS
  - ADW, APEX, NOVA

#### Version 0.7.0 (18.07.2015)
- New platform support:
  - Amazon FireOS
  - Browser
  - Windows
- `get`, `set` and `clear` support callbacks.
- Support for [Glyphs](https://msdn.microsoft.com/de-de/library/windows/apps/hh779719#phone_badge) on _Windows_ platform.
- Added tests

#### Version 0.6.4 (02.05.2015)
- Upgrade cordova dependency from 3.0 to 3.6
- Fix incompatibility with local-notification plugin and PGB caused by the usage of hooks.

#### Version 0.6.3 (22.03.2015)
- New interfaces to increase or decrease the badge number.
- Fix incompatibility with local-notification plugin.
- Add instead of replace permissions on iOS.
- Refreshed layout of the example app.

#### Version 0.6.2 (01.03.2015)
- [change:] Renamed `promptForPermission` to `registerPermission`. Older one is still supported.
- [enhancement:] Support iOS8 and older SDK versions from a single binary.
- [enhancement:] `registerPermission` returns result of registration.
- [enhancement:] No need anymore to call `registerPermission` explicit before trying to set the badge number.

#### Version 0.6.1 (03.10.2014)
- [bugfix:] `hasPermission` and `promptForPermission` let the app crash on iOS7 and older.

#### Version 0.6.0 (29.09.2014)
- [enhancement:] iOS 8 support
- [enhancement:] All methods are asynchron now and do not block the main thread anymore.
- [feature:] New method `hasPermission` to ask if the user has granted to display badge notifications.
- [feature:] New method `promptForPermission` to promt the user to grant permission to display badge notifications.
- [feature:] New method `configure` to configure badge properties.
- [feature:] The small icon on Android can be changed through `configure`.
- [**change**:] The namespace `plugin.notification.badge` will be removed with v0.6.1
- [**change**:] `setTitle` is deprecated, please use `configure({ title: 'title' })`.
- [**change**:] `clearOnTap` is deprecated, please use `configure({ autoClear: true })`.
- [bugfix:] `getBadge` still returned the number when autoClear: was set and the notification was already cleared by the system (Android).
- [bugfix:] `clean` was not working on Windows Phone.

#### Version 0.5.3 (23.05.2014)
- Added new namespace `cordova.plugins.notification.badge`<br>
  **Note:** The former `plugin.notification.badge` namespace is deprecated now and will be removed in the next major release.

- [bugfix:] `get` returned the old value even after `clear` was called on Android.

#### Version 0.5.2 (12.04.2014)
- [enhancement:] Badge can be cleared automatically through `setClearOnTap`
- [enhancement:] Badge can be retrieved through `get`

#### Version 0.5.1 (25.01.2014)
- [enhancement:] Specify custom notification title on Android can be set through JS interface.
- [enhancement:] Setting launchMode to *singleInstance* isn't necessary anymore. App does not restart on click anymore.

#### Version 0.5.0 (04.01.2014)
- Added Android support

#### Version 0.4.1 (04.12.2013)
- Release under the Apache 2.0 license.

#### Version 0.4.0 (07.10.2013)
- Added WP8 support
- **Note:** The former `plugin.badge` namespace is not longer available.

#### Version 0.2.1 (15.08.2013)
- Added new namespace `plugin.notification.badge`<br>
  **Note:** The former `plugin.badge` namespace is deprecated now and will be removed in the next major release.

#### Version 0.2.0 (11.08.2013)
- Added iOS support<br>
  *Based on the Badge iOS plugin made by* ***Joseph Stuhr***

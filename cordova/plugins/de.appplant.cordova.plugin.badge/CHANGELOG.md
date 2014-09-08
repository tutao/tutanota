## ChangeLog

#### Version 0.6.0 (not yet released)
- [feature:] New method `configure` to configure badge properties.
- [feature:] The small icon on Android can be changed through `configure`.
- [**change**:] The namespace `plugin.notification.badge` will be removed with v0.6.1
- [**change**:] `setTitle` is deprecated, please use `configure({ title: 'title' })`.
- [**change**:] `clearOnTap` is deprecated, please use `configure({ autoClear: true })`.

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
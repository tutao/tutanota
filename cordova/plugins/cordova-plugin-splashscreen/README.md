<!--
# license: Licensed to the Apache Software Foundation (ASF) under one
#         or more contributor license agreements.  See the NOTICE file
#         distributed with this work for additional information
#         regarding copyright ownership.  The ASF licenses this file
#         to you under the Apache License, Version 2.0 (the
#         "License"); you may not use this file except in compliance
#         with the License.  You may obtain a copy of the License at
#
#           http://www.apache.org/licenses/LICENSE-2.0
#
#         Unless required by applicable law or agreed to in writing,
#         software distributed under the License is distributed on an
#         "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
#         KIND, either express or implied.  See the License for the
#         specific language governing permissions and limitations
#         under the License.
-->

# cordova-plugin-splashscreen

This plugin displays and hides a splash screen during application launch.

:warning: Report issues on the [Apache Cordova issue tracker](https://issues.apache.org/jira/issues/?jql=project%20%3D%20CB%20AND%20status%20in%20%28Open%2C%20%22In%20Progress%22%2C%20Reopened%29%20AND%20resolution%20%3D%20Unresolved%20AND%20component%20%3D%20%22Plugin%20Splashscreen%22%20ORDER%20BY%20priority%20DESC%2C%20summary%20ASC%2C%20updatedDate%20DESC)

## Installation

    // npm hosted (new) id
    cordova plugin add cordova-plugin-splashscreen

    // you may also install directly from this repo
    cordova plugin add https://github.com/apache/cordova-plugin-splashscreen.git

## Supported Platforms

- Amazon Fire OS
- Android
- BlackBerry 10
- iOS
- Windows Phone 7 and 8
- Windows 8
- Windows
- Browser

## Preferences

#### config.xml

-  __SplashScreen__ (string). The resource name which is used for the displaying splash screen. Different platforms use values for this.

        <preference name="SplashScreen" value="resourcename" />

-  __AutoHideSplashScreen__ (boolean, default to `true`). Indicates wherether hide splash screen automatically or not. Splash screen hidden after amount of time specified in the `SplashScreenDelay` preference.

        <preference name="AutoHideSplashScreen" value="true" />

-  __SplashScreenDelay__ (number, default to 3000). Amount of time in milliseconds to wait before automatically hide splash screen.

        <preference name="SplashScreenDelay" value="3000" />


### Android Quirks

In your `config.xml`, you need to add the following preferences:

    <preference name="SplashScreen" value="foo" />
    <preference name="SplashScreenDelay" value="3000" />
    <preference name="SplashMaintainAspectRatio" value="true|false" />
    <preference name="SplashShowOnlyFirstTime" value="true|false" />

Where foo is the name of the splashscreen file, preferably a 9 patch file. Make sure to add your splashcreen files to your res/xml directory under the appropriate folders. The second parameter represents how long the splashscreen will appear in milliseconds. It defaults to 3000 ms. See [Icons and Splash Screens](http://cordova.apache.org/docs/en/edge/config_ref_images.md.html)
for more information.

"SplashMaintainAspectRatio" preference is optional. If set to true, splash screen drawable is not stretched to fit screen, but instead simply "covers" the screen, like CSS "background-size:cover". This is very useful when splash screen images cannot be distorted in any way, for example when they contain scenery or text. This setting works best with images that have large margins (safe areas) that can be safely cropped on screens with different aspect ratios.

The plugin reloads splash drawable whenever orientation changes, so you can specify different drawables for portrait and landscape orientations.

"SplashShowOnlyFirstTime" preference is also optional and defaults to `true`. When set to `true` splash screen will only appear on application launch. However, if you plan to use `navigator.app.exitApp()` to close application and force splash screen appear on next launch, you should set this property to `false` (this also applies to closing the App with Back button).

### Browser Quirks

You can use the following preferences in your `config.xml`:

    <platform name="browser">
        <preference name="SplashScreen" value="images/browser/splashscreen.jpg" /> <!-- defaults to "img/logo.png" -->
        <preference name="SplashScreenDelay" value="3000" /> <!-- defaults to "3000" -->
        <preference name="SplashScreenBackgroundColor" value="green" /> <!-- defaults to "#464646" -->
        <preference name="ShowSplashScreen" value="false" /> <!-- defaults to "true" -->
        <preference name="SplashScreenWidth" value="600" /> <!-- defaults to "170" -->
        <preference name="SplashScreenHeight" value="300" /> <!-- defaults to "200" -->
    </platform>


### Android and iOS Quirks

- `FadeSplashScreen` (boolean, defaults to `true`): Set to `false` to
  prevent the splash screen from fading in and out when its display
  state changes.

        <preference name="FadeSplashScreen" value="false"/>

- `FadeSplashScreenDuration` (float, defaults to `3000`): Specifies the
  number of milliseconds for the splash screen fade effect to execute.

        <preference name="FadeSplashScreenDuration" value="3000"/>

Note also that this value used to be seconds, and not milliseconds, so values less than 30 will still be treated as seconds. ( Consider this a deprecated patch that will disapear in some future version. )

_Note_: `FadeSplashScreenDuration` is included into `SplashScreenDelay`, for example if you have `<preference name="SplashScreenDelay" value="3000" />` and `<preference name="FadeSplashScreenDuration" value="1000"/>` defined in `config.xml`:

- 00:00 - splashscreen is shown
- 00:02 - fading has started
- 00:03 - splashscreen is hidden

Turning the fading off via `<preference name="FadeSplashScreen" value="false"/>` technically means fading duration to be `0` so that in this example the overall splash delay will still be 3 seconds.

_Note_: This only applies to the app startup - you need to take the fading timeout into account when manually showing/hiding the splashscreen in the code:

```javascript
navigator.splashscreen.show();
window.setTimeout(function () {
    navigator.splashscreen.hide();
}, splashDuration - fadeDuration);
```

### iOS Quirks

- `ShowSplashScreenSpinner` (boolean, defaults to `true`): Set to `false`
  to hide the splash-screen spinner.

        <preference name="ShowSplashScreenSpinner" value="false"/>

## Methods

- splashscreen.show
- splashscreen.hide

## splashscreen.hide

Dismiss the splash screen.

    navigator.splashscreen.hide();


### BlackBerry 10, WP8, iOS Quirk

The `config.xml` file's `AutoHideSplashScreen` setting must be
`false`. To delay hiding the splash screen for two seconds, add a
timer such as the following in the `deviceready` event handler:

        setTimeout(function() {
            navigator.splashscreen.hide();
        }, 2000);

## splashscreen.show

Displays the splash screen.

    navigator.splashscreen.show();


Your application cannot call `navigator.splashscreen.show()` until the app has
started and the `deviceready` event has fired. But since typically the splash
screen is meant to be visible before your app has started, that would seem to
defeat the purpose of the splash screen.  Providing some configuration in
`config.xml` will automatically `show` the splash screen immediately after your
app launch and before it has fully started and received the `deviceready`
event. See [Icons and Splash Screens](http://cordova.apache.org/docs/en/edge/config_ref_images.md.html)
for more information on doing this configuration. For this reason, it is
unlikely you need to call `navigator.splashscreen.show()` to make the splash
screen visible for app startup.

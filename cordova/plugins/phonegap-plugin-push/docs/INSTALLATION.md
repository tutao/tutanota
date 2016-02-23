# Installation

- [Android details](#android-details)
  - [Compilation](#compilation)
  - [Co-existing with Facebook Plugin](#co-existing-with-facebook-plugin)
  - [Common errors](#common-errors)
    - [minSdkVersion === 14](#minsdkversion--14)
	- [Multidex](#multidex)
- [iOS details](#ios-details)
  - [XCode](#xcode)
  - [Bitcode](#bitcode)

This requires phonegap/cordova CLI 5.0+ ( current stable v1.5.3 )

```
phonegap plugin add phonegap-plugin-push
```
or

```
cordova plugin add phonegap-plugin-push
```

It is also possible to install via repo url directly ( unstable )

```
phonegap plugin add https://github.com/phonegap/phonegap-plugin-push
```

or

```
cordova plugin add https://github.com/phonegap/phonegap-plugin-push
```

## Android details

### Compilation

As of version 1.3.0 the plugin has been switched to using Gradle/Maven for building.

You will need to ensure that you have installed the following items through the Android SDK Manager:

- Android Support Library version 23 or greater
- Android Support Repository version 20 or greater
- Google Play Services version 27 or greater
- Google Repository version 22 or greater

![android support library](https://cloud.githubusercontent.com/assets/353180/10230226/0627931e-684a-11e5-9a6b-72d72997f655.png)

For more detailed instructions on how to install the Android Support Library visit [Google's documentation](https://developer.android.com/tools/support-library/setup.html).

*Note:* if you are using an IDE to like Eclipse, Xamarin, etc. then the Android SDK installed by those tools may not be the same version as the one used by the Cordova/PhoneGap CLI while building. Please make sure your command line tooling is up to date with the software versions above. An easy way to make sure you up to date is to run the following command:

```
android update sdk --no-ui --filter "extra"
```

### Co-existing with Facebook Plugin

There are a number of Cordova Facebook Plugins available but the one that we recommend is [Jeduan's fork](https://github.com/jeduan/cordova-plugin-facebook4) of the original Wizcorp plugin. It is setup to use Gradle/Maven and the latest Facebook SDK properly.

To add to your app:

```
phonegap plugin add --save cordova-plugin-facebook4 --variable APP_ID="App ID" --variable APP_NAME="App Name"
```
or

```
cordova plugin add --save cordova-plugin-facebook4 --variable APP_ID="App ID" --variable APP_NAME="App Name"
```

### Common errors

#### minSdkVersion === 14

If you have an issue compiling the app and you are getting an error similar to this:

```
* What went wrong:
Execution failed for task ':processDebugManifest'.
> Manifest merger failed : uses-sdk:minSdkVersion 14 cannot be smaller than version 15 declared in library .../platforms/android/build/intermediates/exploded-aar/com.facebook.android/facebook-android-sdk/4.6.0/AndroidManifest.xml
  	Suggestion: use tools:overrideLibrary="com.facebook" to force usage
```

Then you can add the following entry into your config.xml file in the android platform tag:

```xml
<platform name="android">
    <preference name="android-minSdkVersion" value="15"/>
 </platform>
```

or compile your project using the following command, if the solution above doesn't work for you. Basically add `-- --minSdkVersion=15` to the end of the command line (mind the extra `--`, it's needed):

```bash
cordova compile android -- --minSdkVersion=15
cordova build android -- --minSdkVersion=15
cordova run android -- --minSdkVersion=15
cordova emulate android -- --minSdkVersion=15
```

#### Multidex

If you have an issue compiling the app and you're getting an error similar to this (`com.android.dex.DexException: Multiple dex files define`):

```
UNEXPECTED TOP-LEVEL EXCEPTION:
com.android.dex.DexException: Multiple dex files define Landroid/support/annotation/AnimRes;
	at com.android.dx.merge.DexMerger.readSortableTypes(DexMerger.java:596)
	at com.android.dx.merge.DexMerger.getSortedTypes(DexMerger.java:554)
	at com.android.dx.merge.DexMerger.mergeClassDefs(DexMerger.java:535)
	at com.android.dx.merge.DexMerger.mergeDexes(DexMerger.java:171)
	at com.android.dx.merge.DexMerger.merge(DexMerger.java:189)
	at com.android.dx.command.dexer.Main.mergeLibraryDexBuffers(Main.java:502)
	at com.android.dx.command.dexer.Main.runMonoDex(Main.java:334)
	at com.android.dx.command.dexer.Main.run(Main.java:277)
	at com.android.dx.command.dexer.Main.main(Main.java:245)
	at com.android.dx.command.Main.main(Main.java:106)
```

Then at least one other plugin you have installed is using an outdated way to declare dependencies such as `android-support` or `play-services-gcm`.
This causes gradle to fail, and you'll need to identify which plugin is causing it and request an update to the plugin author, so that it uses the proper way to declare dependencies for cordova.
See [this for the reference on the cordova plugin specification](https://cordova.apache.org/docs/en/5.4.0/plugin_ref/spec.html#link-18), it'll be usefull to mention it when creating an issue or requesting that plugin to be updated.

Common plugins to suffer from this outdated dependency management are plugins related to *facebook*, *google+*, *notifications*, *crosswalk* and *google maps*.

## iOS details

### XCode

XCode version 7.0 or greater is required for building this plugin.

### Bitcode

If you are running into a problem where the linker is complaining about bit code. For instance:

```
ld: '<file.o>' does not contain bitcode. You must rebuild it with bitcode enabled (Xcode setting ENABLE_BITCODE), obtain an updated library from the vendor, or disable bitcode for this target. for architecture arm64 clang: error: linker command failed with exit code 1 (use -v to see invocation)
```

You have two options. The first is to [disable bitcode as per this StackOverflow answer](http://stackoverflow.com/a/32466484/41679) or [upgrade to cordova-ios 4 or greater](https://cordova.apache.org/announcements/2015/12/08/cordova-ios-4.0.0.html).

```
cordova platform update ios@4.0.0
```

## PhoneGap Build Support

Including this plugin in a project that is built by PhoneGap Build is as easy as adding:

```xml
<preference name="android-build-tool" value="gradle" />
<plugin name="phonegap-plugin-push" source="npm" />
```

into your app's `config.xml` file. PhoneGap Build will pick up the latest version of phonegap-plugin-push published on npm. If you want to specify a particular version of the plugin you can add the `spec` attribute to the `plugin` tag.

```xml
<preference name="android-build-tool" value="gradle" />
<plugin name="phonegap-plugin-push" spec="~1.4.5" source="npm" />
```

Note: version 1.3.0 of this plugin begins to use Gradle to install the Android Support Framework. Support for Gradle has recently been added to PhoneGap Build. Please read [this blog post](http://phonegap.com/blog/2015/09/28/android-using-gradle/) for more information.

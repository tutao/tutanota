# These rules will be applied when the library is imported as a module.
# See https://developer.android.com/studio/projects/android-library#Considerations

# Keep generated SDK types. A lot of them are accessed using JNA or are part of generated entities.
-keep class de.tutao.tutasdk.**
# Some AWT things are referenced by JNA for some reason. But we really, really don't use AWT.
-dontwarn java.awt.*
# JNA is needed for uniffi and some things are resolved dynamically when called from native.
-keep class com.sun.jna.**
-keep class * extends com.sun.jna.**
-keep class * implements com.sun.jna.**
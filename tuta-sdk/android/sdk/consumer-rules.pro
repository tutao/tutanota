# These rules will be applied (to be more precise: packaged with the code) when the library is built as an artifact.
# See https://developer.android.com/build/shrink-code#configuration-files
# See https://developer.android.com/studio/projects/android-library#Considerations

# The rule below would keep all the generated classes. This is currently not necessary as shrinker should find the
# referenced classes and their methods from what is actually used by the application code. If that doesn't work it's
# probably misconfiguration on the app's side.
# This might change in the future if we reference the types in a more dynamic way but currently the graph can be
# traversed statically.
#-keep class de.tutao.tutasdk.** {
#	*;
#}

# Some AWT things are referenced by JNA for some reason. But we really, really don't use AWT.
-dontwarn java.awt.*
# JNA is needed for uniffi and some private static methods on it are called from native.
-keep class com.sun.jna.** {
	*;
}
-keep class * extends com.sun.jna.** {
	*;
}
-keep class * implements com.sun.jna.** {
	*;
}
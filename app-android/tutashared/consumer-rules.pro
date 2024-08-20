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


#
# kotlinx.serialization
#

# Keep `Companion` object fields of serializable classes.
# This avoids serializer lookup through `getDeclaredClasses` as done for named companion objects.
-if @kotlinx.serialization.Serializable class **
-keepclassmembers class <1> {
    static <1>$Companion Companion;
}

# Keep `serializer()` on companion objects (both default and named) of serializable classes.
-if @kotlinx.serialization.Serializable class ** {
    static **$* *;
}
-keepclassmembers class <2>$<3> {
    kotlinx.serialization.KSerializer serializer(...);
}

# Keep `INSTANCE.serializer()` of serializable objects.
-if @kotlinx.serialization.Serializable class ** {
    public static ** INSTANCE;
}
-keepclassmembers class <1> {
    public static <1> INSTANCE;
    kotlinx.serialization.KSerializer serializer(...);
}

# @Serializable and @Polymorphic are used at runtime for polymorphic serialization.
-keepattributes RuntimeVisibleAnnotations,AnnotationDefault

# Serializer for classes with named companion objects are retrieved using `getDeclaredClasses`.
# If you have any, uncomment and replace classes with those containing named companion objects.
-keepattributes InnerClasses # Needed for `getDeclaredClasses`.
-if @kotlinx.serialization.Serializable class
de.tutao.tutashared.IdTuple # <-- List serializable classes with named companions.
{
    static **$* *;
}
-keepnames class <1>$$serializer { # -keepnames suffices; class is kept when serializer() is kept.
    static <1>$$serializer INSTANCE;
}

# we dynamically load sqlcipher, so we should keep the classes around
-keep,includedescriptorclasses class net.sqlcipher.** { *; }
-keep,includedescriptorclasses interface net.sqlcipher.** { *; }

-keep public class de.tutao.tutashared.ipc.** { *; }
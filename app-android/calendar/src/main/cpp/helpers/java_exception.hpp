#ifndef APP_ANDROID_JAVA_EXCEPTION_HPP
#define APP_ANDROID_JAVA_EXCEPTION_HPP

/**
 * Convenience function for queueing up an exception in the Java environment.
 *
 * Note that the JNI function will continue executing even with a pending exception (unlike throwing an exception in
 * Java/Kotlin), but the return value will be ignored, and the exception will finally be thrown in the Java runtime upon
 * completion.
 *
 * @param classPath path to the class, with path components separated with forward slashes (e.g. "java/lang/Exception")
 */
#define JAVA_THROW_EXCEPTION(classPath, ...) { \
    char error[512]; \
    std::snprintf(error, sizeof(error), __VA_ARGS__); \
    env->ThrowNew(env->FindClass(classPath), error); \
}

#endif
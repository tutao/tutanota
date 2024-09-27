#ifndef APP_ANDROID_BYTE_ARRAY_ACCESSOR_HPP
#define APP_ANDROID_BYTE_ARRAY_ACCESSOR_HPP

#include <memory>
#include <jni.h>
#include "non_copyable.hpp"

/**
 * Container for holding byte arrays. Automatically releases the bytes pointer when out of scope.
 */
class ByteArrayAccessor {
    NON_COPYABLE
public:
    /**
     * Instantiate with an existing byte array
     * @param env java environment
     * @param byteArray byte array
     */
    ByteArrayAccessor(JNIEnv *env, jbyteArray byteArray) noexcept;

    /**
     * Instantiate a new byte array
     * @param env  java environment
     * @param length length of new byte array
     */
    ByteArrayAccessor(JNIEnv *env, jsize length) noexcept;

    /**
     * @return length of byte array
     */
    jint getLength() const noexcept;

    /**
     * @return bytes pointer
     */
    jbyte *getBytes() const noexcept;

    /**
     * @return byte array object
     */
    jbyteArray getByteArray() const noexcept;

    /**
     * @return new IPC data wrapper
     */
    jobject createDataWrapper() const noexcept;

    ~ByteArrayAccessor() noexcept;

private:
    JNIEnv *env;
    jbyte *bytes;
    jbyteArray byteArray;
};

#endif

#include "byte_array_accessor.hpp"

ByteArrayAccessor::ByteArrayAccessor(JNIEnv *env, jbyteArray byteArray) noexcept: env(env), byteArray(byteArray) {
    this->bytes = env->GetByteArrayElements(byteArray, nullptr);
}

ByteArrayAccessor::ByteArrayAccessor(JNIEnv *env, jsize length) noexcept
        : ByteArrayAccessor(env, env->NewByteArray(length)) {}

ByteArrayAccessor::~ByteArrayAccessor() noexcept {
    this->env->ReleaseByteArrayElements(this->byteArray, this->bytes, 0);
}

jint ByteArrayAccessor::getLength() const noexcept {
    return this->env->GetArrayLength(this->byteArray);
}

jbyte *ByteArrayAccessor::getBytes() const noexcept {
    return this->bytes;
}

jbyteArray ByteArrayAccessor::getByteArray() const noexcept {
    return this->byteArray;
}

jobject ByteArrayAccessor::createDataWrapper() const noexcept {
    auto dataWrapperClass = this->env->FindClass("de/tutao/tutashared/ipc/DataWrapper");
    return env->NewObject(dataWrapperClass,
                          env->GetMethodID(dataWrapperClass, "<init>", "([B)V"),
                          this->getByteArray());
}
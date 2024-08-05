#include <jni.h>
#include "argon2.h"
#include <memory>
#include <string>
#include "helpers/byte_array_accessor.hpp"
#include "helpers/java_exception.hpp"

extern "C" JNIEXPORT jbyteArray JNICALL Java_de_tutao_tutashared_AndroidNativeCryptoFacade_argon2idHashRawImpl(
        JNIEnv *env,
        jobject pThis,
        jbyteArray password,
        jbyteArray salt,
        jint timeCost,
        jint memoryCost,
        jint parallelism,
        jint hashLength
) {
    auto outBytes = ByteArrayAccessor(env, hashLength);
    auto inPassword = ByteArrayAccessor(env, password);
    auto inSalt = ByteArrayAccessor(env, salt);

    auto retval = argon2id_hash_raw(timeCost,
                                    memoryCost,
                                    parallelism,
                                    inPassword.getBytes(),
                                    inPassword.getLength(),
                                    inSalt.getBytes(),
                                    inSalt.getLength(),
                                    outBytes.getBytes(),
                                    hashLength);

    // zero out the password buffer (note: we can't do anything about the hash)
    std::memset(inPassword.getBytes(), 0, inPassword.getLength());

    if (retval != ARGON2_OK) {
        JAVA_THROW_EXCEPTION("de/tutao/tutashared/CryptoError",
                             "argon2id_hash_raw returned %d: %s",
                             retval,
                             argon2_error_message(retval)
        );
    }

    return outBytes.getByteArray();
}
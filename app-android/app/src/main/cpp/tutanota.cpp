#include <jni.h>
#include "argon2.h"
#include <memory>
#include <string>

static_assert(sizeof(jbyte) == sizeof(std::byte));

extern "C" JNIEXPORT jbyteArray JNICALL Java_de_tutao_tutanota_AndroidNativeCryptoFacade_argon2idHashRawImpl(
        JNIEnv *env,
        jobject pThis,
        jbyteArray password,
        jbyteArray salt,
        jint timeCost,
        jint memoryCost,
        jint parallelism,
        jint hashLength
) {
    jbyteArray ret = env->NewByteArray(hashLength);

    auto *outBytes = env->GetByteArrayElements(ret, nullptr);
    auto *inPassword = env->GetByteArrayElements(password, nullptr);
    auto *inSalt = env->GetByteArrayElements(salt, nullptr);

    auto passwordLength = env->GetArrayLength(password);
    auto saltLength = env->GetArrayLength(salt);

    auto retval = argon2id_hash_raw(timeCost,
                                    memoryCost,
                                    parallelism,
                                    inPassword,
                                    passwordLength,
                                    inSalt,
                                    saltLength,
                                    outBytes,
                                    hashLength);

    env->ReleaseByteArrayElements(ret, outBytes, 0);
    env->ReleaseByteArrayElements(password, inPassword, 0);
    env->ReleaseByteArrayElements(salt, inSalt, 0);

    if (retval != ARGON2_OK) {
        char error[256];
        std::snprintf(error, sizeof(error), "argon2id_hash_raw returned %d: %s", retval, argon2_error_message(retval));
        env->ThrowNew(env->FindClass("de/tutao/tutanota/CryptoError"), error);
    }

    return ret;
}
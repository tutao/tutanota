#include <jni.h>
#include <memory>
#include <string>
#include <cstdio>
#include <cstdint>

#include <oqs/kem.h>
#include "helpers/rand.h"

#include "helpers/java_exception.hpp"
#include "helpers/byte_array_accessor.hpp"
#include "helpers/kem.hpp"

static void fillEntropy(JNIEnv *env, jbyteArray seed);

// Guard to prevent UB
#define ASSERT_INPUT_LENGTH_EQUALS(name, expectedLength, actualLength) \
    if((expectedLength) != (actualLength)) { \
        JAVA_THROW_EXCEPTION("de/tutao/tutashared/CryptoError", "Bad input length for %s; expected %d, got %d instead", name, expectedLength, actualLength) \
        return nullptr; \
    }

extern "C" JNIEXPORT jobject JNICALL Java_de_tutao_tutashared_AndroidNativeCryptoFacade_generateKyberKeypairImpl(
        JNIEnv *env,
        jobject pThis,
        jbyteArray seed
) {
    fillEntropy(env, seed);

    auto kyberKeyPairClass = env->FindClass("de/tutao/tutashared/ipc/KyberKeyPair");
    auto kyberPrivateKeyClass = env->FindClass("de/tutao/tutashared/ipc/KyberPrivateKey");
    auto kyberPublicKeyClass = env->FindClass("de/tutao/tutashared/ipc/KyberPublicKey");

    auto publicKeyBytes = ByteArrayAccessor(env, OQS_KEM_kyber_1024_length_public_key);
    auto privateKeyBytes = ByteArrayAccessor(env, OQS_KEM_kyber_1024_length_secret_key);

    auto kyberPrivateKey = env->NewObject(kyberPrivateKeyClass,
                                          env->GetMethodID(kyberPrivateKeyClass, "<init>",
                                                           "(Lde/tutao/tutashared/ipc/DataWrapper;)V"),
                                          privateKeyBytes.createDataWrapper());
    auto kyberPublicKey = env->NewObject(kyberPublicKeyClass,
                                         env->GetMethodID(kyberPublicKeyClass, "<init>",
                                                          "(Lde/tutao/tutashared/ipc/DataWrapper;)V"),
                                         publicKeyBytes.createDataWrapper());
    auto kyberKeyPair = env->NewObject(kyberKeyPairClass,
                                       env->GetMethodID(kyberKeyPairClass, "<init>",
                                                        "(Lde/tutao/tutashared/ipc/KyberPublicKey;Lde/tutao/tutashared/ipc/KyberPrivateKey;)V"),
                                       kyberPublicKey, kyberPrivateKey);

    OQS_STATUS result = OQS_KEM_keypair(KEM(OQS_KEM_alg_kyber_1024),
                                        reinterpret_cast<std::uint8_t *>(publicKeyBytes.getBytes()),
                                        reinterpret_cast<std::uint8_t *>(privateKeyBytes.getBytes()));

    if (result != OQS_SUCCESS) {
        JAVA_THROW_EXCEPTION("de/tutao/tutashared/CryptoError", "OQS_KEM_keypair returned %d", result);
    }

    return kyberKeyPair;
}

extern "C" JNIEXPORT jobject JNICALL Java_de_tutao_tutashared_AndroidNativeCryptoFacade_kyberEncapsulateImpl(
        JNIEnv *env,
        jobject pThis,
        jbyteArray publicKey,
        jbyteArray seed
) {
    auto kyberEncapsulationClass = env->FindClass("de/tutao/tutashared/ipc/KyberEncapsulation");

    auto publicKeyBytes = ByteArrayAccessor(env, publicKey);
    auto cipherTextBytes = ByteArrayAccessor(env, OQS_KEM_kyber_1024_length_ciphertext);
    auto sharedSecretBytes = ByteArrayAccessor(env, OQS_KEM_kyber_1024_length_shared_secret);

    ASSERT_INPUT_LENGTH_EQUALS("public key", OQS_KEM_kyber_1024_length_public_key, publicKeyBytes.getLength())

    fillEntropy(env, seed);

    auto kyberEncapsulation = env->NewObject(kyberEncapsulationClass,
                                             env->GetMethodID(kyberEncapsulationClass, "<init>",
                                                              "(Lde/tutao/tutashared/ipc/DataWrapper;Lde/tutao/tutashared/ipc/DataWrapper;)V"),
                                             cipherTextBytes.createDataWrapper(),
                                             sharedSecretBytes.createDataWrapper());

    OQS_STATUS result = OQS_KEM_encaps(KEM(OQS_KEM_alg_kyber_1024),
                                       reinterpret_cast<std::uint8_t *>(cipherTextBytes.getBytes()),
                                       reinterpret_cast<std::uint8_t *>(sharedSecretBytes.getBytes()),
                                       reinterpret_cast<std::uint8_t *>(publicKeyBytes.getBytes()));

    if (result != OQS_SUCCESS) {
        JAVA_THROW_EXCEPTION("de/tutao/calendar/CryptoError", "OQS_KEM_encaps returned %d", result);
    }

    return kyberEncapsulation;
}

extern "C" JNIEXPORT jbyteArray JNICALL Java_de_tutao_tutashared_AndroidNativeCryptoFacade_kyberDecapsulateImpl(
        JNIEnv *env,
        jobject pThis,
        jbyteArray ciphertext,
        jbyteArray privateKey
) {
    auto ciphertextBytes = ByteArrayAccessor(env, ciphertext);
    auto privateKeyBytes = ByteArrayAccessor(env, privateKey);
    auto sharedSecretBytes = ByteArrayAccessor(env, OQS_KEM_kyber_1024_length_shared_secret);

    ASSERT_INPUT_LENGTH_EQUALS("private key", OQS_KEM_kyber_1024_length_secret_key, privateKeyBytes.getLength())
    ASSERT_INPUT_LENGTH_EQUALS("cipher text", OQS_KEM_kyber_1024_length_ciphertext, ciphertextBytes.getLength())

    OQS_STATUS result = OQS_KEM_decaps(KEM(OQS_KEM_alg_kyber_1024),
                                       reinterpret_cast<std::uint8_t *>(sharedSecretBytes.getBytes()),
                                       reinterpret_cast<std::uint8_t *>(ciphertextBytes.getBytes()),
                                       reinterpret_cast<std::uint8_t *>(privateKeyBytes.getBytes()));

    if (result != OQS_SUCCESS) {
        JAVA_THROW_EXCEPTION("de/tutao/calendar/CryptoError", "OQS_KEM_decaps returned %d", result);
    }

    return sharedSecretBytes.getByteArray();
}

static void fillEntropy(JNIEnv *env, jbyteArray seed) {
    auto bytes = ByteArrayAccessor(env, seed);

    // If amountWritten is negative, we passed too much entropy - programming error.
    //
    // We do not catch this, however, so be careful!
    int amountWritten = TUTA_inject_entropy(bytes.getBytes(), bytes.getLength());
    if (amountWritten < 0) {
        std::fprintf(stderr, "Tried to inject too much entropy! Got %d bytes leftover\n", amountWritten);
    }
}
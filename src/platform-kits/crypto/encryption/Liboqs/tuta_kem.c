#include <oqs/oqs.h>
#include <oqs/kem.h>
#include <oqs/tuta_kem.h>
#include <oqs/sha3.h>
#include <oqs/kem_ml_kem.h>
#include <string.h>
#include <stdlib.h>
#include <oqs/common.h>


const int SHA3_BYTE_LENGTH = 32;


/**
 * This is a redundant step to bind the derived shared secret to the ciphertext.
 * It was part of the original round 3 Kyber submission specification and the reference implementation.
 * It was removed from the NIST ML-KEM draft for efficiency because the re-encryption step in decapsulation prevents any attacks.
 * Therefore, liboqs updated the implementation, and we keep this step for compatibility in order to avoid rolling out a new TutaCrypt protocol version.
 *
 * @param unbound_shared_secret the ML-KEM shared secret. Will be overwritten by the shared secret that is bound to the ciphertext as per the Kyber spec.
 * @param[in] ciphertext the ML-KEM ciphertext the secret will be bound to.
 */
void bindSharedSecretToCiphertext( uint8_t *unbound_shared_secret, const uint8_t *ciphertext) {
    size_t kdf_input_length = OQS_KEM_ml_kem_1024_length_shared_secret + SHA3_BYTE_LENGTH;
    uint8_t *kdf_input = malloc(kdf_input_length);
    OQS_EXIT_IF_NULLPTR(kdf_input, "tuta_kem");
    memcpy(kdf_input, unbound_shared_secret, OQS_KEM_ml_kem_1024_length_shared_secret);
    OQS_SHA3_sha3_256(kdf_input + OQS_KEM_ml_kem_1024_length_shared_secret, ciphertext, OQS_KEM_ml_kem_1024_length_ciphertext);
    OQS_SHA3_shake256(unbound_shared_secret, OQS_KEM_ml_kem_1024_length_shared_secret, kdf_input, kdf_input_length);
    free(kdf_input);
    return;
}

/**
 * Encapsulation algorithm.
 *
 * This is a hack to turn ML-KEM into Kyber.
 *
 * Caller is responsible for allocating sufficient memory for `ciphertext` and
 * `shared_secret`, based on the `length_*` members in this object or the per-scheme
 * compile-time macros `OQS_KEM_*_length_*`.
 *
 * @param[in] kem The OQS_KEM object representing the KEM.
 * @param[out] ciphertext The ciphertext (encapsulation) represented as a byte string.
 * @param[out] shared_secret The shared secret represented as a byte string.
 * @param[in] public_key The public key represented as a byte string.
 * @return OQS_SUCCESS or OQS_ERROR
 */
OQS_API OQS_STATUS TUTA_KEM_encaps(const OQS_KEM *kem, uint8_t *ciphertext, uint8_t *shared_secret, const uint8_t *public_key){
    OQS_STATUS result = OQS_KEM_encaps(kem, ciphertext, shared_secret, public_key);
    bindSharedSecretToCiphertext(shared_secret, ciphertext);
    return result;
}

/**
 * Decapsulation algorithm.
 *
 * This is a hack to turn ML-KEM into Kyber. The implicit rejection value may differ from the specs as we uncoditiionally kdf and hash it again.
 *
 * Caller is responsible for allocating sufficient memory for `shared_secret`, based
 * on the `length_*` members in this object or the per-scheme compile-time macros
 * `OQS_KEM_*_length_*`.
 *
 * @param[in] kem The OQS_KEM object representing the KEM.
 * @param[out] shared_secret The shared secret represented as a byte string.
 * @param[in] ciphertext The ciphertext (encapsulation) represented as a byte string.
 * @param[in] secret_key The secret key represented as a byte string.
 * @return OQS_SUCCESS or OQS_ERROR
 */
OQS_API OQS_STATUS TUTA_KEM_decaps(const OQS_KEM *kem, uint8_t *shared_secret, const uint8_t *ciphertext, const uint8_t *secret_key){
    OQS_STATUS result = OQS_KEM_decaps(kem, shared_secret, ciphertext, secret_key);
    bindSharedSecretToCiphertext(shared_secret, ciphertext);
    return result;
}
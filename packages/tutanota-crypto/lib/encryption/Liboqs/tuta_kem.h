#include <oqs/oqs.h>

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
OQS_API OQS_STATUS TUTA_KEM_encaps(const OQS_KEM *kem, uint8_t *ciphertext, uint8_t *shared_secret, const uint8_t *public_key);

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
OQS_API OQS_STATUS TUTA_KEM_decaps(const OQS_KEM *kem, uint8_t *shared_secret, const uint8_t *ciphertext, const uint8_t *secret_key);
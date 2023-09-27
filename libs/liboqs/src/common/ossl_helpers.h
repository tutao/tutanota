// SPDX-License-Identifier: MIT
#ifndef OQS_OSSL_HELPERS_H
#define OQS_OSSL_HELPERS_H

#if defined(__cplusplus)
extern "C" {
#endif

#if defined(OQS_USE_OPENSSL)
void oqs_free_ossl_objects(void);

const EVP_MD *oqs_sha256(void);

const EVP_MD *oqs_sha384(void);

const EVP_MD *oqs_sha512(void);

const EVP_MD *oqs_shake128(void);

const EVP_MD *oqs_shake256(void);

const EVP_MD *oqs_sha3_256(void);

const EVP_MD *oqs_sha3_384(void);

const EVP_MD *oqs_sha3_512(void);

const EVP_CIPHER *oqs_aes_128_ecb(void);

const EVP_CIPHER *oqs_aes_256_ecb(void);

const EVP_CIPHER *oqs_aes_256_ctr(void);
#endif

#if defined(__cplusplus)
} // extern "C"
#endif

#endif // OQS_OSSL_HELPERS_H

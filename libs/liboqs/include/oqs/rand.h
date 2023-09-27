/**
 * \file rand.h
 * \brief Random number generator.
 *
 * SPDX-License-Identifier: MIT
 */

#ifndef OQS_RANDOM_H
#define OQS_RANDOM_H

#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

#include <oqs/common.h>

#if defined(__cplusplus)
extern "C" {
#endif

/** Algorithm identifier for system PRNG. */
#define OQS_RAND_alg_system "system"
/** Algorithm identifier for NIST deterministic RNG for KATs. */
#define OQS_RAND_alg_nist_kat "NIST-KAT"
/** Algorithm identifier for using OpenSSL's PRNG. */
#define OQS_RAND_alg_openssl "OpenSSL"

/**
 * Switches OQS_randombytes to use the specified algorithm.
 *
 * @param[in] algorithm The name of the algorithm to use.
 * @return OQS_SUCCESS if `algorithm` is a supported algorithm name, OQS_ERROR otherwise.
 */
OQS_API OQS_STATUS OQS_randombytes_switch_algorithm(const char *algorithm);

/**
 * Switches OQS_randombytes to use the given function.
 *
 * This allows additional custom RNGs besides the provided ones.  The provided RNG
 * function must have the same signature as `OQS_randombytes`.
 *
 * @param[in] algorithm_ptr Pointer to the RNG function to use.
 */
OQS_API void OQS_randombytes_custom_algorithm(void (*algorithm_ptr)(uint8_t *, size_t));

/**
 * Fills the given memory with the requested number of (pseudo)random bytes.
 *
 * This implementation uses whichever algorithm has been selected by
 * OQS_randombytes_switch_algorithm. The default is OQS_randombytes_system, which
 * reads bytes directly from `/dev/urandom`.
 *
 * The caller is responsible for providing a buffer allocated with sufficient room.
 *
 * @param[out] random_array Pointer to the memory to fill with (pseudo)random bytes
 * @param[in] bytes_to_read The number of random bytes to read into memory
 */
OQS_API void OQS_randombytes(uint8_t *random_array, size_t bytes_to_read);

/**
 * Initializes the NIST DRBG with a given seed and with 256-bit security.
 *
 * @param[in] entropy_input The seed; must be exactly 48 bytes
 * @param[in] personalization_string An optional personalization string;
 * may be NULL; if not NULL, must be at least 48 bytes long
 */
OQS_API void OQS_randombytes_nist_kat_init_256bit(const uint8_t *entropy_input, const uint8_t *personalization_string);

#if defined(__cplusplus)
} // extern "C"
#endif

#endif // OQS_RANDOM_H

/**
 * \file sha2_local.h
 * \brief Internal SHA2 functions that enable easy switching between native instructions
 *        and c implementations
 *
 * <b>Note this is not part of the OQS public API: implementations within liboqs can use these
 * functions, but external consumers of liboqs should not use these functions.</b>
 *
 * \author Douglas Stebila
 *
 * SPDX-License-Identifier: MIT
 */

#ifndef OQS_SHA2_LOCAL_H
#define OQS_SHA2_LOCAL_H

#include <stddef.h>
#include <stdint.h>

#if defined(__cplusplus)
extern "C" {
#endif

typedef struct {
	uint8_t *ctx;
} sha224ctx;

typedef struct {
	uint8_t *ctx;
} sha256ctx;

typedef struct {
	uint8_t *ctx;
} sha384ctx;

typedef struct {
	uint8_t *ctx;
} sha512ctx;

void oqs_sha2_sha224_inc_init_c(sha224ctx *state);
void oqs_sha2_sha224_inc_ctx_clone_c(sha224ctx *dest, const sha224ctx *src);
void oqs_sha2_sha224_inc_blocks_c(sha224ctx *state, const uint8_t *in, size_t inblocks);
void oqs_sha2_sha224_inc_finalize_c(uint8_t *out, sha224ctx *state, const uint8_t *in, size_t inlen);
void oqs_sha2_sha224_inc_ctx_release_c(sha224ctx *state);

void oqs_sha2_sha256_inc_init_c(sha256ctx *state);
void oqs_sha2_sha256_inc_ctx_clone_c(sha256ctx *dest, const sha256ctx *src);
void oqs_sha2_sha256_inc_blocks_c(sha256ctx *state, const uint8_t *in, size_t inblocks);
void oqs_sha2_sha256_inc_finalize_c(uint8_t *out, sha256ctx *state, const uint8_t *in, size_t inlen);
void oqs_sha2_sha256_inc_ctx_release_c(sha256ctx *state);

void oqs_sha2_sha384(uint8_t *output, const uint8_t *input, size_t inplen);
void oqs_sha2_sha384_inc_init_c(sha384ctx *state);
void oqs_sha2_sha384_inc_ctx_clone_c(sha384ctx *dest, const sha384ctx *src);
void oqs_sha2_sha384_inc_blocks_c(sha384ctx *state, const uint8_t *in, size_t inblocks);
void oqs_sha2_sha384_inc_finalize_c(uint8_t *out, sha384ctx *state, const uint8_t *in, size_t inlen);
void oqs_sha2_sha384_inc_ctx_release_c(sha384ctx *state);

void oqs_sha2_sha512_inc_init_c(sha512ctx *state);
void oqs_sha2_sha512_inc_ctx_clone_c(sha512ctx *dest, const sha512ctx *src);
void oqs_sha2_sha512_inc_blocks_c(sha512ctx *state, const uint8_t *in, size_t inblocks);
void oqs_sha2_sha512_inc_finalize_c(uint8_t *out, sha512ctx *state, const uint8_t *in, size_t inlen);
void oqs_sha2_sha512_inc_ctx_release_c(sha512ctx *state);

// ARMv8 Crypto Extension  functions
void oqs_sha2_sha224_inc_blocks_armv8(sha224ctx *state, const uint8_t *in, size_t inblocks);
void oqs_sha2_sha224_armv8(uint8_t *out, const uint8_t *in, size_t inlen);
void oqs_sha2_sha256_inc_blocks_armv8(sha256ctx *state, const uint8_t *in, size_t inblocks);
void oqs_sha2_sha256_armv8(uint8_t *out, const uint8_t *in, size_t inlen);

void oqs_sha2_sha384_inc_init_armv8(sha384ctx *state);
void oqs_sha2_sha384_inc_ctx_clone_armv8(sha384ctx *dest, const sha384ctx *src);
void oqs_sha2_sha384_inc_blocks_armv8(sha384ctx *state, const uint8_t *in, size_t inblocks);
void oqs_sha2_sha384_inc_finalize_armv8(uint8_t *out, sha384ctx *state, const uint8_t *in, size_t inlen);
void oqs_sha2_sha384_inc_ctx_release_armv8(sha384ctx *state);

void oqs_sha2_sha224_c(uint8_t *out, const uint8_t *in, size_t inlen);
void oqs_sha2_sha256_c(uint8_t *out, const uint8_t *in, size_t inlen);
void oqs_sha2_sha384_c(uint8_t *out, const uint8_t *in, size_t inlen);
void oqs_sha2_sha512_c(uint8_t *out, const uint8_t *in, size_t inlen);

#if defined(__cplusplus)
} // extern "C"
#endif

#endif // OQS_SHA2_LOCAL_H

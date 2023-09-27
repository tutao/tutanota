/**
* \file sha3_xkcp.c
* \brief Implementation of the OQS SHA3 API using the XKCP low interface.
* The high level keccak_absorb, squeezeblocks, etc. are based on fips202.c
* from PQClean (https://github.com/PQClean/PQClean/tree/master/common)
*
* SPDX-License-Identifier: MIT
*/

#include "sha3.h"

#include "xkcp_dispatch.h"

#include <oqs/common.h>

#include <stddef.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>

#define KECCAK_CTX_ALIGNMENT 32
#define _KECCAK_CTX_BYTES (200+sizeof(uint64_t))
#define KECCAK_CTX_BYTES (KECCAK_CTX_ALIGNMENT * \
  ((_KECCAK_CTX_BYTES + KECCAK_CTX_ALIGNMENT - 1)/KECCAK_CTX_ALIGNMENT))

/* The first call to Keccak_Initialize will be routed through dispatch, which
 * updates all of the function pointers used below.
 */
static KeccakInitFn Keccak_Dispatch;
static KeccakInitFn *Keccak_Initialize_ptr = &Keccak_Dispatch;
static KeccakAddByteFn *Keccak_AddByte_ptr = NULL;
static KeccakAddBytesFn *Keccak_AddBytes_ptr = NULL;
static KeccakPermuteFn *Keccak_Permute_ptr = NULL;
static KeccakExtractBytesFn *Keccak_ExtractBytes_ptr = NULL;
static KeccakFastLoopAbsorbFn *Keccak_FastLoopAbsorb_ptr = NULL;

static void Keccak_Dispatch(void *state) {
// TODO: Simplify this when we have a Windows-compatible AVX2 implementation of SHA3
#if defined(OQS_DIST_X86_64_BUILD)
#if defined(OQS_ENABLE_SHA3_xkcp_low_avx2)
	if (OQS_CPU_has_extension(OQS_CPU_EXT_AVX2)) {
		Keccak_Initialize_ptr = &KeccakP1600_Initialize_avx2;
		Keccak_AddByte_ptr = &KeccakP1600_AddByte_avx2;
		Keccak_AddBytes_ptr = &KeccakP1600_AddBytes_avx2;
		Keccak_Permute_ptr = &KeccakP1600_Permute_24rounds_avx2;
		Keccak_ExtractBytes_ptr = &KeccakP1600_ExtractBytes_avx2;
		Keccak_FastLoopAbsorb_ptr = &KeccakF1600_FastLoop_Absorb_avx2;
	} else {
		Keccak_Initialize_ptr = &KeccakP1600_Initialize_plain64;
		Keccak_AddByte_ptr = &KeccakP1600_AddByte_plain64;
		Keccak_AddBytes_ptr = &KeccakP1600_AddBytes_plain64;
		Keccak_Permute_ptr = &KeccakP1600_Permute_24rounds_plain64;
		Keccak_ExtractBytes_ptr = &KeccakP1600_ExtractBytes_plain64;
		Keccak_FastLoopAbsorb_ptr = &KeccakF1600_FastLoop_Absorb_plain64;
	}
#else // Windows
	Keccak_Initialize_ptr = &KeccakP1600_Initialize_plain64;
	Keccak_AddByte_ptr = &KeccakP1600_AddByte_plain64;
	Keccak_AddBytes_ptr = &KeccakP1600_AddBytes_plain64;
	Keccak_Permute_ptr = &KeccakP1600_Permute_24rounds_plain64;
	Keccak_ExtractBytes_ptr = &KeccakP1600_ExtractBytes_plain64;
	Keccak_FastLoopAbsorb_ptr = &KeccakF1600_FastLoop_Absorb_plain64;
#endif
#else
	Keccak_Initialize_ptr = &KeccakP1600_Initialize;
	Keccak_AddByte_ptr = &KeccakP1600_AddByte;
	Keccak_AddBytes_ptr = &KeccakP1600_AddBytes;
	Keccak_Permute_ptr = &KeccakP1600_Permute_24rounds;
	Keccak_ExtractBytes_ptr = &KeccakP1600_ExtractBytes;
	Keccak_FastLoopAbsorb_ptr = &KeccakF1600_FastLoop_Absorb;
#endif

	(*Keccak_Initialize_ptr)(state);
}

/*************************************************
 * Name:        keccak_inc_reset
 *
 * Description: Initializes the incremental Keccak state to zero.
 *
 * Arguments:   - uint64_t *s: pointer to input/output incremental state
 *                First 25 values represent Keccak state.
 *                26th value represents either the number of absorbed bytes
 *                that have not been permuted, or not-yet-squeezed bytes.
 **************************************************/
static void keccak_inc_reset(uint64_t *s) {
	(*Keccak_Initialize_ptr)(s);
	s[25] = 0;
}

/*************************************************
 * Name:        keccak_inc_absorb
 *
 * Description: Incremental keccak absorb
 *              Preceded by keccak_inc_reset, succeeded by keccak_inc_finalize
 *
 * Arguments:   - uint64_t *s: pointer to input/output incremental state
 *                First 25 values represent Keccak state.
 *                26th value represents either the number of absorbed bytes
 *                that have not been permuted, or not-yet-squeezed bytes.
 *              - uint32_t r: rate in bytes (e.g., 168 for SHAKE128)
 *              - const uint8_t *m: pointer to input to be absorbed into s
 *              - size_t mlen: length of input in bytes
 **************************************************/
static void keccak_inc_absorb(uint64_t *s, uint32_t r, const uint8_t *m,
                              size_t mlen) {
	uint64_t c = r - s[25];

	if (s[25] && mlen >= c) {
		(*Keccak_AddBytes_ptr)(s, m, (unsigned int)s[25], (unsigned int)c);
		(*Keccak_Permute_ptr)(s);
		mlen -= c;
		m += c;
		s[25] = 0;
	}

#ifdef KeccakF1600_FastLoop_supported
	if (mlen >= r) {
		c = (*Keccak_FastLoop_Absorb_ptr)(s, r / 8, m, mlen);
		mlen -= c;
		m += c;
	}
#else
	while (mlen >= r) {
		(*Keccak_AddBytes_ptr)(s, m, 0, r);
		(*Keccak_Permute_ptr)(s);
		mlen -= r;
		m += r;
	}
#endif

	(*Keccak_AddBytes_ptr)(s, m, (unsigned int)s[25], (unsigned int)mlen);
	s[25] += mlen;
}

/*************************************************
 * Name:        keccak_inc_finalize
 *
 * Description: Finalizes Keccak absorb phase, prepares for squeezing
 *
 * Arguments:   - uint64_t *s: pointer to input/output incremental state
 *                First 25 values represent Keccak state.
 *                26th value represents either the number of absorbed bytes
 *                that have not been permuted, or not-yet-squeezed bytes.
 *              - uint32_t r: rate in bytes (e.g., 168 for SHAKE128)
 *              - uint8_t p: domain-separation byte for different
 *                                 Keccak-derived functions
 **************************************************/
static void keccak_inc_finalize(uint64_t *s, uint32_t r, uint8_t p) {
	/* After keccak_inc_absorb, we are guaranteed that s[25] < r,
	   so we can always use one more byte for p in the current state. */
	(*Keccak_AddByte_ptr)(s, p, (unsigned int)s[25]);
	(*Keccak_AddByte_ptr)(s, 0x80, (unsigned int)(r - 1));
	s[25] = 0;
}

/*************************************************
 * Name:        keccak_inc_squeeze
 *
 * Description: Incremental Keccak squeeze; can be called on byte-level
 *
 * Arguments:   - uint8_t *h: pointer to output bytes
 *              - size_t outlen: number of bytes to be squeezed
 *              - uint64_t *s: pointer to input/output incremental state
 *                First 25 values represent Keccak state.
 *                26th value represents either the number of absorbed bytes
 *                that have not been permuted, or not-yet-squeezed bytes.
 *              - uint32_t r: rate in bytes (e.g., 168 for SHAKE128)
 **************************************************/
static void keccak_inc_squeeze(uint8_t *h, size_t outlen,
                               uint64_t *s, uint32_t r) {
	while (outlen > s[25]) {
		(*Keccak_ExtractBytes_ptr)(s, h, (unsigned int)(r - s[25]), (unsigned int)s[25]);
		(*Keccak_Permute_ptr)(s);
		h += s[25];
		outlen -= s[25];
		s[25] = r;
	}
	(*Keccak_ExtractBytes_ptr)(s, h, (unsigned int)(r - s[25]), (unsigned int)outlen);
	s[25] -= outlen;
}

/* SHA3-256 */

void OQS_SHA3_sha3_256(uint8_t *output, const uint8_t *input, size_t inlen) {
	OQS_SHA3_sha3_256_inc_ctx s;
	OQS_SHA3_sha3_256_inc_init(&s);
	OQS_SHA3_sha3_256_inc_absorb(&s, input, inlen);
	OQS_SHA3_sha3_256_inc_finalize(output, &s);
	OQS_SHA3_sha3_256_inc_ctx_release(&s);
}

void OQS_SHA3_sha3_256_inc_init(OQS_SHA3_sha3_256_inc_ctx *state) {
	state->ctx = OQS_MEM_aligned_alloc(KECCAK_CTX_ALIGNMENT, KECCAK_CTX_BYTES);
	if (state->ctx == NULL) {
		exit(111);
	}
	keccak_inc_reset((uint64_t *)state->ctx);
}

void OQS_SHA3_sha3_256_inc_absorb(OQS_SHA3_sha3_256_inc_ctx *state, const uint8_t *input, size_t inlen) {
	keccak_inc_absorb((uint64_t *)state->ctx, OQS_SHA3_SHA3_256_RATE, input, inlen);
}

void OQS_SHA3_sha3_256_inc_finalize(uint8_t *output, OQS_SHA3_sha3_256_inc_ctx *state) {
	keccak_inc_finalize((uint64_t *)state->ctx, OQS_SHA3_SHA3_256_RATE, 0x06);
	keccak_inc_squeeze(output, 32, (uint64_t *)state->ctx, OQS_SHA3_SHA3_256_RATE);
}

void OQS_SHA3_sha3_256_inc_ctx_release(OQS_SHA3_sha3_256_inc_ctx *state) {
	OQS_MEM_aligned_free(state->ctx);
}

void OQS_SHA3_sha3_256_inc_ctx_clone(OQS_SHA3_sha3_256_inc_ctx *dest, const OQS_SHA3_sha3_256_inc_ctx *src) {
	memcpy(dest->ctx, src->ctx, KECCAK_CTX_BYTES);
}

void OQS_SHA3_sha3_256_inc_ctx_reset(OQS_SHA3_sha3_256_inc_ctx *state) {
	keccak_inc_reset((uint64_t *)state->ctx);
}

/* SHA3-384 */

void OQS_SHA3_sha3_384(uint8_t *output, const uint8_t *input, size_t inlen) {
	OQS_SHA3_sha3_384_inc_ctx s;
	OQS_SHA3_sha3_384_inc_init(&s);
	OQS_SHA3_sha3_384_inc_absorb(&s, input, inlen);
	OQS_SHA3_sha3_384_inc_finalize(output, &s);
	OQS_SHA3_sha3_384_inc_ctx_release(&s);
}

void OQS_SHA3_sha3_384_inc_init(OQS_SHA3_sha3_384_inc_ctx *state) {
	state->ctx = OQS_MEM_aligned_alloc(KECCAK_CTX_ALIGNMENT, KECCAK_CTX_BYTES);
	if (state->ctx == NULL) {
		exit(111);
	}
	keccak_inc_reset((uint64_t *)state->ctx);
}

void OQS_SHA3_sha3_384_inc_absorb(OQS_SHA3_sha3_384_inc_ctx *state, const uint8_t *input, size_t inlen) {
	keccak_inc_absorb((uint64_t *)state->ctx, OQS_SHA3_SHA3_384_RATE, input, inlen);
}

void OQS_SHA3_sha3_384_inc_finalize(uint8_t *output, OQS_SHA3_sha3_384_inc_ctx *state) {
	keccak_inc_finalize((uint64_t *)state->ctx, OQS_SHA3_SHA3_384_RATE, 0x06);
	keccak_inc_squeeze(output, 48, (uint64_t *)state->ctx, OQS_SHA3_SHA3_384_RATE);
}

void OQS_SHA3_sha3_384_inc_ctx_release(OQS_SHA3_sha3_384_inc_ctx *state) {
	OQS_MEM_aligned_free(state->ctx);
}

void OQS_SHA3_sha3_384_inc_ctx_clone(OQS_SHA3_sha3_384_inc_ctx *dest, const OQS_SHA3_sha3_384_inc_ctx *src) {
	memcpy(dest->ctx, src->ctx, KECCAK_CTX_BYTES);
}

void OQS_SHA3_sha3_384_inc_ctx_reset(OQS_SHA3_sha3_384_inc_ctx *state) {
	keccak_inc_reset((uint64_t *)state->ctx);
}

/* SHA3-512 */

void OQS_SHA3_sha3_512(uint8_t *output, const uint8_t *input, size_t inlen) {
	OQS_SHA3_sha3_512_inc_ctx s;
	OQS_SHA3_sha3_512_inc_init(&s);
	OQS_SHA3_sha3_512_inc_absorb(&s, input, inlen);
	OQS_SHA3_sha3_512_inc_finalize(output, &s);
	OQS_SHA3_sha3_512_inc_ctx_release(&s);
}

void OQS_SHA3_sha3_512_inc_init(OQS_SHA3_sha3_512_inc_ctx *state) {
	state->ctx = OQS_MEM_aligned_alloc(KECCAK_CTX_ALIGNMENT, KECCAK_CTX_BYTES);
	if (state->ctx == NULL) {
		exit(111);
	}
	keccak_inc_reset((uint64_t *)state->ctx);
}

void OQS_SHA3_sha3_512_inc_absorb(OQS_SHA3_sha3_512_inc_ctx *state, const uint8_t *input, size_t inlen) {
	keccak_inc_absorb((uint64_t *)state->ctx, OQS_SHA3_SHA3_512_RATE, input, inlen);
}

void OQS_SHA3_sha3_512_inc_finalize(uint8_t *output, OQS_SHA3_sha3_512_inc_ctx *state) {
	keccak_inc_finalize((uint64_t *)state->ctx, OQS_SHA3_SHA3_512_RATE, 0x06);
	keccak_inc_squeeze(output, 64, (uint64_t *)state->ctx, OQS_SHA3_SHA3_512_RATE);
}

void OQS_SHA3_sha3_512_inc_ctx_release(OQS_SHA3_sha3_512_inc_ctx *state) {
	OQS_MEM_aligned_free(state->ctx);
}

void OQS_SHA3_sha3_512_inc_ctx_clone(OQS_SHA3_sha3_512_inc_ctx *dest, const OQS_SHA3_sha3_512_inc_ctx *src) {
	memcpy(dest->ctx, src->ctx, KECCAK_CTX_BYTES);
}

void OQS_SHA3_sha3_512_inc_ctx_reset(OQS_SHA3_sha3_512_inc_ctx *state) {
	keccak_inc_reset((uint64_t *)state->ctx);
}

/* SHAKE128 */

void OQS_SHA3_shake128(uint8_t *output, size_t outlen, const uint8_t *input, size_t inlen) {
	OQS_SHA3_shake128_inc_ctx s;
	OQS_SHA3_shake128_inc_init(&s);
	OQS_SHA3_shake128_inc_absorb(&s, input, inlen);
	OQS_SHA3_shake128_inc_finalize(&s);
	OQS_SHA3_shake128_inc_squeeze(output, outlen, &s);
	OQS_SHA3_shake128_inc_ctx_release(&s);
}

/* SHAKE128 incremental */

void OQS_SHA3_shake128_inc_init(OQS_SHA3_shake128_inc_ctx *state) {
	state->ctx = OQS_MEM_aligned_alloc(KECCAK_CTX_ALIGNMENT, KECCAK_CTX_BYTES);
	if (state->ctx == NULL) {
		exit(111);
	}
	keccak_inc_reset((uint64_t *)state->ctx);
}

void OQS_SHA3_shake128_inc_absorb(OQS_SHA3_shake128_inc_ctx *state, const uint8_t *input, size_t inlen) {
	keccak_inc_absorb((uint64_t *)state->ctx, OQS_SHA3_SHAKE128_RATE, input, inlen);
}

void OQS_SHA3_shake128_inc_finalize(OQS_SHA3_shake128_inc_ctx *state) {
	keccak_inc_finalize((uint64_t *)state->ctx, OQS_SHA3_SHAKE128_RATE, 0x1F);
}

void OQS_SHA3_shake128_inc_squeeze(uint8_t *output, size_t outlen, OQS_SHA3_shake128_inc_ctx *state) {
	keccak_inc_squeeze(output, outlen, (uint64_t *)state->ctx, OQS_SHA3_SHAKE128_RATE);
}

void OQS_SHA3_shake128_inc_ctx_clone(OQS_SHA3_shake128_inc_ctx *dest, const OQS_SHA3_shake128_inc_ctx *src) {
	memcpy(dest->ctx, src->ctx, KECCAK_CTX_BYTES);
}

void OQS_SHA3_shake128_inc_ctx_release(OQS_SHA3_shake128_inc_ctx *state) {
	OQS_MEM_aligned_free(state->ctx);
}

void OQS_SHA3_shake128_inc_ctx_reset(OQS_SHA3_shake128_inc_ctx *state) {
	keccak_inc_reset((uint64_t *)state->ctx);
}

/* SHAKE256 */

void OQS_SHA3_shake256(uint8_t *output, size_t outlen, const uint8_t *input, size_t inlen) {
	OQS_SHA3_shake256_inc_ctx s;
	OQS_SHA3_shake256_inc_init(&s);
	OQS_SHA3_shake256_inc_absorb(&s, input, inlen);
	OQS_SHA3_shake256_inc_finalize(&s);
	OQS_SHA3_shake256_inc_squeeze(output, outlen, &s);
	OQS_SHA3_shake256_inc_ctx_release(&s);
}

/* SHAKE256 incremental */

void OQS_SHA3_shake256_inc_init(OQS_SHA3_shake256_inc_ctx *state) {
	state->ctx = OQS_MEM_aligned_alloc(KECCAK_CTX_ALIGNMENT, KECCAK_CTX_BYTES);
	if (state->ctx == NULL) {
		exit(111);
	}
	keccak_inc_reset((uint64_t *)state->ctx);
}

void OQS_SHA3_shake256_inc_absorb(OQS_SHA3_shake256_inc_ctx *state, const uint8_t *input, size_t inlen) {
	keccak_inc_absorb((uint64_t *)state->ctx, OQS_SHA3_SHAKE256_RATE, input, inlen);
}

void OQS_SHA3_shake256_inc_finalize(OQS_SHA3_shake256_inc_ctx *state) {
	keccak_inc_finalize((uint64_t *)state->ctx, OQS_SHA3_SHAKE256_RATE, 0x1F);
}

void OQS_SHA3_shake256_inc_squeeze(uint8_t *output, size_t outlen, OQS_SHA3_shake256_inc_ctx *state) {
	keccak_inc_squeeze(output, outlen, state->ctx, OQS_SHA3_SHAKE256_RATE);
}

void OQS_SHA3_shake256_inc_ctx_release(OQS_SHA3_shake256_inc_ctx *state) {
	OQS_MEM_aligned_free(state->ctx);
}

void OQS_SHA3_shake256_inc_ctx_clone(OQS_SHA3_shake256_inc_ctx *dest, const OQS_SHA3_shake256_inc_ctx *src) {
	memcpy(dest->ctx, src->ctx, KECCAK_CTX_BYTES);
}

void OQS_SHA3_shake256_inc_ctx_reset(OQS_SHA3_shake256_inc_ctx *state) {
	keccak_inc_reset((uint64_t *)state->ctx);
}

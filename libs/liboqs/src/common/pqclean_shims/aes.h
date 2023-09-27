// SPDX-License-Identifier: MIT

#ifndef AES_H
#define AES_H

#include <stdint.h>
#include <stdlib.h>

#include <oqs/aes.h>

#define AES256_KEYBYTES 32
#define AESCTR_NONCEBYTES 12
#define AES_BLOCKBYTES 16

typedef void *aes256ctx;

#define aes256_ecb_keyexp(r, key) OQS_AES256_ECB_load_schedule((key), (r))
#define aes256_ecb(out, in, nblocks, ctx) OQS_AES256_ECB_enc_sch((in), (nblocks) * AES_BLOCKBYTES, *(ctx), (out))
#define aes256_ctr_keyexp(r, key) OQS_AES256_CTR_inc_init((key), (r))
#define aes256_ctr(out, outlen, iv, ctx) OQS_AES256_CTR_inc_stream_iv((iv), AESCTR_NONCEBYTES, *(ctx), (out), (outlen))
#define aes256_ctx_release(ctx) OQS_AES256_free_schedule(*(ctx))

#define aes256ctr_squeezeblocks(out, outlen, state) OQS_AES256_CTR_inc_stream_blks(*state, out, 4*outlen)
#define aes256ctr_squeezeblocks_u64(out, outlen, iv, ctx) OQS_AES256_CTR_inc_stream_ivu64_blks((iv), *(ctx), (out), (4*outlen))
#define aes256ctr_init_key(state, key) OQS_AES256_CTR_inc_init(key, state)
#define aes256ctr_init_iv(state, nonce) OQS_AES256_CTR_inc_iv(nonce, 12, *state)
#define aes256ctr_init_iv_u64(state, nonce) OQS_AES256_CTR_inc_ivu64(nonce, *state)

static inline void aes256ctr_init(void **_schedule, const uint8_t *key, const uint8_t *nonce) {
	OQS_AES256_CTR_inc_init(key, _schedule);
	OQS_AES256_CTR_inc_iv(nonce, 12, *_schedule);
}

static inline void aes256ctr_init_u64(void **_schedule, const uint8_t *key, uint64_t nonce) {
	OQS_AES256_CTR_inc_init(key, _schedule);
	OQS_AES256_CTR_inc_ivu64(nonce, *_schedule);
}

static inline void aes256ctr_prf(uint8_t *out, size_t outlen, const uint8_t key[32], uint8_t nonce[12]) {
	aes256ctx state;
	OQS_AES256_CTR_inc_init(key, &state);
	OQS_AES256_CTR_inc_stream_iv(nonce, 12, state, out, outlen);
	OQS_AES256_free_schedule(state);
}

#endif

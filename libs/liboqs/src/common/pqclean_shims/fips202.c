//  SPDX-License-Identifier: MIT

#include "fips202.h"

void shake128_absorb_once(shake128incctx *state, const uint8_t *in, size_t inlen) {
	shake128_inc_ctx_reset(state);
	shake128_inc_absorb(state, in, inlen);
	shake128_inc_finalize(state);
}

void shake256_absorb_once(shake256incctx *state, const uint8_t *in, size_t inlen) {
	shake256_inc_ctx_reset(state);
	shake256_inc_absorb(state, in, inlen);
	shake256_inc_finalize(state);
}

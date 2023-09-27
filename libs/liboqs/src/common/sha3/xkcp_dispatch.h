/* XKCP calls can be dispatched to platform-specific implementation at runtime.
 *
 * If this is a dist build we put a "_arch" suffix on each symbol in each xkcp_low
 * library that we build. If it's not a dist build, we omit the suffix and only build
 * one library. Hence we will either have a single "KeccakP1600_Initialize" or we will have
 * one or more symbols of the form "KeccakP1600_Initialize_arch".
 *
 * This header file defines all of the symbols that might be available.
 *
 * SPDX-License-Identifier: MIT
 */

#ifndef OQS_SHA3_XKCP_DISPATCH_H
#define OQS_SHA3_XKCP_DISPATCH_H

typedef void KeccakInitFn(void *);
extern KeccakInitFn \
KeccakP1600_Initialize, \
KeccakP1600_Initialize_plain64, \
KeccakP1600_Initialize_avx2;

typedef void KeccakAddByteFn(void *, const uint8_t, unsigned int);
extern KeccakAddByteFn \
KeccakP1600_AddByte, \
KeccakP1600_AddByte_plain64, \
KeccakP1600_AddByte_avx2;

typedef void KeccakAddBytesFn(void *, const uint8_t *, unsigned int, unsigned int);
extern KeccakAddBytesFn \
KeccakP1600_AddBytes, \
KeccakP1600_AddBytes_plain64, \
KeccakP1600_AddBytes_avx2;

typedef void KeccakPermuteFn(void *);
extern KeccakPermuteFn \
KeccakP1600_Permute_24rounds, \
KeccakP1600_Permute_24rounds_plain64, \
KeccakP1600_Permute_24rounds_avx2;

typedef void KeccakExtractBytesFn(const void *, uint8_t *, unsigned int, unsigned int);
extern KeccakExtractBytesFn \
KeccakP1600_ExtractBytes, \
KeccakP1600_ExtractBytes_plain64, \
KeccakP1600_ExtractBytes_avx2;

typedef size_t KeccakFastLoopAbsorbFn(void *, unsigned int, const uint8_t *, size_t);
extern KeccakFastLoopAbsorbFn \
KeccakF1600_FastLoop_Absorb, \
KeccakF1600_FastLoop_Absorb_plain64, \
KeccakF1600_FastLoop_Absorb_avx2;

typedef void KeccakX4InitFn(void *);
extern KeccakX4InitFn \
KeccakP1600times4_InitializeAll, \
KeccakP1600times4_InitializeAll_serial, \
KeccakP1600times4_InitializeAll_avx2;

typedef void KeccakX4AddByteFn(void *, unsigned int, unsigned char, unsigned int);
extern KeccakX4AddByteFn \
KeccakP1600times4_AddByte, \
KeccakP1600times4_AddByte_serial, \
KeccakP1600times4_AddByte_avx2;

typedef void KeccakX4AddBytesFn(void *, unsigned int, const unsigned char *, unsigned int, unsigned int);
extern KeccakX4AddBytesFn \
KeccakP1600times4_AddBytes, \
KeccakP1600times4_AddBytes_serial, \
KeccakP1600times4_AddBytes_avx2;

typedef void KeccakX4PermuteFn(void *);
extern KeccakX4PermuteFn \
KeccakP1600times4_PermuteAll_24rounds, \
KeccakP1600times4_PermuteAll_24rounds_serial, \
KeccakP1600times4_PermuteAll_24rounds_avx2;

typedef void KeccakX4ExtractBytesFn(const void *, unsigned int, unsigned char *, unsigned int, unsigned int);
extern KeccakX4ExtractBytesFn \
KeccakP1600times4_ExtractBytes, \
KeccakP1600times4_ExtractBytes_serial, \
KeccakP1600times4_ExtractBytes_avx2;

#endif // OQS_SHA3_XKCP_DISPATCH_H

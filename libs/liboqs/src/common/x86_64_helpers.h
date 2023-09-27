/* This file has been written using:
 * https://github.com/vectorclass/version2/blob/master/instrset_detect.cpp
 * https://github.com/google/cpu_features/blob/master/src/cpuinfo_x86.c
 * SPDX-License-Identifier: Apache-2.0
 */

#include <stdint.h>

#if defined(_MSC_VER)
#include <immintrin.h>
#include <intrin.h>
#endif

#define MASK_XMM 0x2
#define MASK_YMM 0x4
#define MASK_MASKREG 0x20
#define MASK_ZMM0_15 0x40
#define MASK_ZMM16_31 0x80

typedef struct {
	uint32_t eax;
	uint32_t ebx;
	uint32_t ecx;
	uint32_t edx;
} cpuid_out;

static inline uint32_t xgetbv_eax(uint32_t xcr) {
#if defined(__GNUC__) || defined(__clang__)
	uint32_t eax;
	__asm__ ( ".byte 0x0f, 0x01, 0xd0" : "=a"(eax) : "c"(xcr));
	return eax;
#elif defined(_MSC_VER)
	return _xgetbv(xcr) & 0xFFFF;
#else
#error "Only GCC, Clang, and MSVC are supported."
#endif
}

static unsigned int has_mask(const uint32_t value, const uint32_t mask) {
	return (value & mask) == mask;
}

static inline unsigned int is_bit_set(const uint32_t val, const unsigned int bit_pos) {
	return val & (1 << bit_pos) ? 1 : 0;
}

static inline void cpuid(cpuid_out *out, const uint32_t eax_leaf) {
	const uint32_t ecx_leaf = 0;

#if defined(__GNUC__) || defined(__clang__)
	uint32_t eax, ebx, ecx, edx;
	__asm__("cpuid" : "=a"(eax), "=b"(ebx), "=c"(ecx), "=d"(edx) : "a"(eax_leaf), "c"(ecx_leaf) : );
	out->eax = eax;
	out->ebx = ebx;
	out->ecx = ecx;
	out->edx = edx;
#elif defined(_MSC_VER)
	uint32_t output[4];
	__cpuidex(output, eax_leaf, ecx_leaf);
	out->eax = output[0];
	out->ebx = output[1];
	out->ecx = output[2];
	out->edx = output[3];
#else
#error "Only GCC, Clang, and MSVC are supported."
#endif
}

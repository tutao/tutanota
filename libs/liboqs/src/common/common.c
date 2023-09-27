// SPDX-License-Identifier: Apache-2.0 AND MIT

#if !defined(_WIN32) && !defined(OQS_HAVE_EXPLICIT_BZERO)
// Request memset_s
#define __STDC_WANT_LIB_EXT1__ 1
#endif

#include <oqs/common.h>

#include <errno.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#if !defined(OQS_HAVE_POSIX_MEMALIGN) || defined(__MINGW32__) || defined(__MINGW64__) || defined(_MSC_VER)
#include <malloc.h>
#endif

#if defined(_WIN32)
#include <windows.h>
#endif

#if defined(OQS_USE_OPENSSL)
#include <openssl/evp.h>
#include "ossl_helpers.h"
CRYPTO_ONCE OQS_ONCE_STATIC_FREE;
#endif

/* Identifying the CPU is expensive so we cache the results in cpu_ext_data */
#if defined(OQS_DIST_BUILD)
static unsigned int cpu_ext_data[OQS_CPU_EXT_COUNT] = {0};
#endif

#if defined(OQS_DIST_X86_64_BUILD)
/* set_available_cpu_extensions_x86_64() has been written using:
 * https://github.com/google/cpu_features/blob/master/src/cpuinfo_x86.c
 */
#include "x86_64_helpers.h"
static void set_available_cpu_extensions(void) {
	/* mark that this function has been called */
	cpu_ext_data[OQS_CPU_EXT_INIT] = 1;

	cpuid_out leaf_1;
	cpuid(&leaf_1, 1);
	if (leaf_1.eax == 0) {
		return;
	}

	cpuid_out leaf_7;
	cpuid(&leaf_7, 7);

	const unsigned int has_xsave = is_bit_set(leaf_1.ecx, 26);
	const unsigned int has_osxsave = is_bit_set(leaf_1.ecx, 27);
	const uint32_t xcr0_eax = (has_xsave && has_osxsave) ? xgetbv_eax(0) : 0;

	cpu_ext_data[OQS_CPU_EXT_AES] = is_bit_set(leaf_1.ecx, 25);
	if (has_mask(xcr0_eax, MASK_XMM | MASK_YMM)) {
		cpu_ext_data[OQS_CPU_EXT_AVX] = is_bit_set(leaf_1.ecx, 28);
		cpu_ext_data[OQS_CPU_EXT_AVX2] = is_bit_set(leaf_7.ebx, 5);
	}
	cpu_ext_data[OQS_CPU_EXT_PCLMULQDQ] = is_bit_set(leaf_1.ecx, 1);
	cpu_ext_data[OQS_CPU_EXT_POPCNT] = is_bit_set(leaf_1.ecx, 23);
	cpu_ext_data[OQS_CPU_EXT_BMI1] = is_bit_set(leaf_7.ebx, 3);
	cpu_ext_data[OQS_CPU_EXT_BMI2] = is_bit_set(leaf_7.ebx, 8);
	cpu_ext_data[OQS_CPU_EXT_ADX] = is_bit_set(leaf_7.ebx, 19);

	if (has_mask(xcr0_eax, MASK_XMM)) {
		cpu_ext_data[OQS_CPU_EXT_SSE] = is_bit_set(leaf_1.edx, 25);
		cpu_ext_data[OQS_CPU_EXT_SSE2] = is_bit_set(leaf_1.edx, 26);
		cpu_ext_data[OQS_CPU_EXT_SSE3] = is_bit_set(leaf_1.ecx, 0);
	}

	if (has_mask(xcr0_eax, MASK_XMM | MASK_YMM | MASK_MASKREG | MASK_ZMM0_15 | MASK_ZMM16_31)) {
		unsigned int avx512f = is_bit_set(leaf_7.ebx, 16);
		unsigned int avx512bw = is_bit_set(leaf_7.ebx, 30);
		unsigned int avx512dq = is_bit_set(leaf_7.ebx, 17);
		if (avx512f && avx512bw && avx512dq) {
			cpu_ext_data[OQS_CPU_EXT_AVX512] = 1;
		}
		cpu_ext_data[OQS_CPU_EXT_VPCLMULQDQ] = is_bit_set(leaf_7.ecx, 10);
	}
}
#elif defined(OQS_DIST_X86_BUILD)
static void set_available_cpu_extensions(void) {
	/* mark that this function has been called */
	cpu_ext_data[OQS_CPU_EXT_INIT] = 1;
}
#elif defined(OQS_DIST_ARM64_V8_BUILD)
#if defined(__APPLE__)
#include <sys/sysctl.h>
static unsigned int macos_feature_detection(const char *feature_name) {
	int p;
	size_t p_len = sizeof(p);
	int res = sysctlbyname(feature_name, &p, &p_len, NULL, 0);
	if (res != 0) {
		return 0;
	} else {
		return (p != 0) ? 1 : 0;
	}
}
static void set_available_cpu_extensions(void) {
	/* mark that this function has been called */
	cpu_ext_data[OQS_CPU_EXT_ARM_AES] = 1;
	cpu_ext_data[OQS_CPU_EXT_ARM_SHA2] = 1;
	cpu_ext_data[OQS_CPU_EXT_ARM_SHA3] = macos_feature_detection("hw.optional.armv8_2_sha3");
	cpu_ext_data[OQS_CPU_EXT_ARM_NEON] = macos_feature_detection("hw.optional.neon");
	cpu_ext_data[OQS_CPU_EXT_INIT] = 1;
}
#elif defined(__FreeBSD__) || defined(__FreeBSD)
#include <sys/auxv.h>
#include <machine/elf.h>

static void set_available_cpu_extensions(void) {
	/* mark that this function has been called */
	u_long hwcaps = 0;
	cpu_ext_data[OQS_CPU_EXT_INIT] = 1;
	if (elf_aux_info(AT_HWCAP, &hwcaps, sizeof(u_long))) {
		fprintf(stderr, "Error getting HWCAP for ARM on FreeBSD\n");
		return;
	}
	if (hwcaps & HWCAP_AES) {
		cpu_ext_data[OQS_CPU_EXT_ARM_AES] = 1;
	}
	if (hwcaps & HWCAP_ASIMD) {
		cpu_ext_data[OQS_CPU_EXT_ARM_NEON] = 1;
	}
	if (hwcaps & HWCAP_SHA2) {
		cpu_ext_data[OQS_CPU_EXT_ARM_SHA2] = 1;
	}
#ifdef HWCAP_SHA3
	if (hwcaps & HWCAP_SHA3) {
		cpu_ext_data[OQS_CPU_EXT_ARM_SHA3] = 1;
	}
#endif
}
#elif defined(_WIN32)
static void set_available_cpu_extensions(void) {
	/* mark that this function has been called */
	cpu_ext_data[OQS_CPU_EXT_INIT] = 1;
	BOOL crypto = IsProcessorFeaturePresent(PF_ARM_V8_CRYPTO_INSTRUCTIONS_AVAILABLE);
	if (crypto) {
		cpu_ext_data[OQS_CPU_EXT_ARM_AES] = 1;
		cpu_ext_data[OQS_CPU_EXT_ARM_SHA2] = 1;
	}
	BOOL neon = IsProcessorFeaturePresent(PF_ARM_VFP_32_REGISTERS_AVAILABLE);
	if (neon) {
		cpu_ext_data[OQS_CPU_EXT_ARM_NEON] = 1;
	}
}
#else
#include <sys/auxv.h>
#include <asm/hwcap.h>
static void set_available_cpu_extensions(void) {
	/* mark that this function has been called */
	cpu_ext_data[OQS_CPU_EXT_INIT] = 1;
	unsigned long int hwcaps = getauxval(AT_HWCAP);
	if (hwcaps & HWCAP_AES) {
		cpu_ext_data[OQS_CPU_EXT_ARM_AES] = 1;
	}
	if (hwcaps & HWCAP_SHA2) {
		cpu_ext_data[OQS_CPU_EXT_ARM_SHA2] = 1;
	}
#ifdef HWCAP_SHA3
	if (hwcaps & HWCAP_SHA3) {
		cpu_ext_data[OQS_CPU_EXT_ARM_SHA3] = 1;
	}
#endif
	if (hwcaps & HWCAP_ASIMD) {
		cpu_ext_data[OQS_CPU_EXT_ARM_NEON] = 1;
	}
}
#endif
#elif defined(OQS_DIST_ARM32v7_BUILD)
#include <sys/auxv.h>
#include <asm/hwcap.h>
static void set_available_cpu_extensions(void) {
	/* mark that this function has been called */
	cpu_ext_data[OQS_CPU_EXT_INIT] = 1;
	unsigned long int hwcaps = getauxval(AT_HWCAP);
	unsigned long int hwcaps2 = getauxval(AT_HWCAP2);
	if (hwcaps2 & HWCAP2_AES) {
		cpu_ext_data[OQS_CPU_EXT_ARM_AES] = 1;
	}
	if (hwcaps2 & HWCAP2_SHA2) {
		cpu_ext_data[OQS_CPU_EXT_ARM_SHA2] = 1;
	}
	if (hwcaps & HWCAP_NEON) {
		cpu_ext_data[OQS_CPU_EXT_ARM_NEON] = 1;
	}
}
#elif defined(OQS_DIST_PPC64LE_BUILD)
static void set_available_cpu_extensions(void) {
	/* mark that this function has been called */
	cpu_ext_data[OQS_CPU_EXT_INIT] = 1;
}
#elif defined(OQS_DIST_S390X_BUILD)
static void set_available_cpu_extensions(void) {
	/* mark that this function has been called */
	cpu_ext_data[OQS_CPU_EXT_INIT] = 1;
}
#elif defined(OQS_DIST_BUILD)
static void set_available_cpu_extensions(void) {
}
#endif

OQS_API int OQS_CPU_has_extension(OQS_CPU_EXT ext) {
#if defined(OQS_DIST_BUILD)
	if (0 == cpu_ext_data[OQS_CPU_EXT_INIT]) {
		set_available_cpu_extensions();
	}
	if (0 < ext && ext < OQS_CPU_EXT_COUNT) {
		return (int)cpu_ext_data[ext];
	}
#else
	(void)ext;
#endif
	return 0;
}

OQS_API void OQS_init(void) {
#if defined(OQS_DIST_BUILD)
	OQS_CPU_has_extension(OQS_CPU_EXT_INIT);
#endif
	return;
}

OQS_API const char *OQS_version(void) {
	return OQS_VERSION_TEXT;
}

OQS_API void OQS_destroy(void) {
#if defined(OQS_USE_OPENSSL)
	CRYPTO_THREAD_run_once(&OQS_ONCE_STATIC_FREE, oqs_free_ossl_objects);
#endif
	return;
}

OQS_API int OQS_MEM_secure_bcmp(const void *a, const void *b, size_t len) {
	/* Assume CHAR_BIT = 8 */
	uint8_t r = 0;

	for (size_t i = 0; i < len; i++) {
		r |= ((const uint8_t *)a)[i] ^ ((const uint8_t *)b)[i];
	}

	// We have 0 <= r < 256, and unsigned int is at least 16 bits.
	return 1 & ((-(unsigned int)r) >> 8);
}

OQS_API void OQS_MEM_cleanse(void *ptr, size_t len) {
#if defined(_WIN32)
	SecureZeroMemory(ptr, len);
#elif defined(OQS_HAVE_EXPLICIT_BZERO)
	explicit_bzero(ptr, len);
#elif defined(__STDC_LIB_EXT1__) || defined(OQS_HAVE_MEMSET_S)
	if (0U < len && memset_s(ptr, (rsize_t)len, 0, (rsize_t)len) != 0) {
		abort();
	}
#else
	typedef void *(*memset_t)(void *, int, size_t);
	static volatile memset_t memset_func = memset;
	memset_func(ptr, 0, len);
#endif
}

OQS_API void OQS_MEM_secure_free(void *ptr, size_t len) {
	if (ptr != NULL) {
		OQS_MEM_cleanse(ptr, len);
		free(ptr); // IGNORE free-check
	}
}

OQS_API void OQS_MEM_insecure_free(void *ptr) {
	free(ptr); // IGNORE free-check
}

void *OQS_MEM_aligned_alloc(size_t alignment, size_t size) {
#if defined(OQS_HAVE_ALIGNED_ALLOC) // glibc and other implementations providing aligned_alloc
	return aligned_alloc(alignment, size);
#else
	// Check alignment (power of 2, and >= sizeof(void*)) and size (multiple of alignment)
	if (alignment & (alignment - 1) || size & (alignment - 1) || alignment < sizeof(void *)) {
		errno = EINVAL;
		return NULL;
	}

#if defined(OQS_HAVE_POSIX_MEMALIGN)
	void *ptr = NULL;
	const int err = posix_memalign(&ptr, alignment, size);
	if (err) {
		errno = err;
		ptr = NULL;
	}
	return ptr;
#elif defined(OQS_HAVE_MEMALIGN)
	return memalign(alignment, size);
#elif defined(__MINGW32__) || defined(__MINGW64__)
	return __mingw_aligned_malloc(size, alignment);
#elif defined(_MSC_VER)
	return _aligned_malloc(size, alignment);
#else
	if (!size) {
		return NULL;
	}
	// Overallocate to be able to align the pointer (alignment -1) and to store
	// the difference between the pointer returned to the user (ptr) and the
	// pointer returned by malloc (buffer). The difference is caped to 255 and
	// can be made larger if necessary, but this should be enough for all users
	// in liboqs.
	//
	// buffer      ptr
	// ↓           ↓
	// ...........|...................
	//            |
	//       diff = ptr - buffer
	const size_t offset = alignment - 1 + sizeof(uint8_t);
	uint8_t *buffer = malloc(size + offset);
	if (!buffer) {
		return NULL;
	}

	// Align the pointer returned to the user.
	uint8_t *ptr = (uint8_t *)(((uintptr_t)(buffer) + offset) & ~(alignment - 1));
	ptrdiff_t diff = ptr - buffer;
	if (diff > UINT8_MAX) {
		// This should never happen in our code, but just to be safe
		free(buffer); // IGNORE free-check
		errno = EINVAL;
		return NULL;
	}
	// Store the difference one byte ahead the returned poitner so that free
	// can reconstruct buffer.
	ptr[-1] = diff;
	return ptr;
#endif
#endif
}

void OQS_MEM_aligned_free(void *ptr) {
#if defined(OQS_HAVE_ALIGNED_ALLOC) || defined(OQS_HAVE_POSIX_MEMALIGN) || defined(OQS_HAVE_MEMALIGN)
	free(ptr); // IGNORE free-check
#elif defined(__MINGW32__) || defined(__MINGW64__)
	__mingw_aligned_free(ptr);
#elif defined(_MSC_VER)
	_aligned_free(ptr);
#else
	if (ptr) {
		// Reconstruct the pointer returned from malloc using the difference
		// stored one byte ahead of ptr.
		uint8_t *u8ptr = ptr;
		free(u8ptr - u8ptr[-1]); // IGNORE free-check
	}
#endif
}

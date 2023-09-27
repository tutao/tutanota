// SPDX-License-Identifier: MIT

#include <assert.h>
#include <stdlib.h>
#if defined(_WIN32)
#include <string.h>
#define strcasecmp _stricmp
#else
#include <strings.h>
#endif

#include <oqs/oqs.h>

OQS_API const char *OQS_KEM_alg_identifier(size_t i) {
	// EDIT-WHEN-ADDING-KEM
	const char *a[OQS_KEM_algs_length] = {
		OQS_KEM_alg_bike_l1,
		OQS_KEM_alg_bike_l3,
		OQS_KEM_alg_bike_l5,
		///// OQS_COPY_FROM_UPSTREAM_FRAGMENT_ALG_IDENTIFIER_START
		OQS_KEM_alg_classic_mceliece_348864,
		OQS_KEM_alg_classic_mceliece_348864f,
		OQS_KEM_alg_classic_mceliece_460896,
		OQS_KEM_alg_classic_mceliece_460896f,
		OQS_KEM_alg_classic_mceliece_6688128,
		OQS_KEM_alg_classic_mceliece_6688128f,
		OQS_KEM_alg_classic_mceliece_6960119,
		OQS_KEM_alg_classic_mceliece_6960119f,
		OQS_KEM_alg_classic_mceliece_8192128,
		OQS_KEM_alg_classic_mceliece_8192128f,
		OQS_KEM_alg_hqc_128,
		OQS_KEM_alg_hqc_192,
		OQS_KEM_alg_hqc_256,
		OQS_KEM_alg_kyber_512,
		OQS_KEM_alg_kyber_768,
		OQS_KEM_alg_kyber_1024,
		///// OQS_COPY_FROM_UPSTREAM_FRAGMENT_ALG_IDENTIFIER_END
		OQS_KEM_alg_ntruprime_sntrup761,
		OQS_KEM_alg_frodokem_640_aes,
		OQS_KEM_alg_frodokem_640_shake,
		OQS_KEM_alg_frodokem_976_aes,
		OQS_KEM_alg_frodokem_976_shake,
		OQS_KEM_alg_frodokem_1344_aes,
		OQS_KEM_alg_frodokem_1344_shake,
	};
	if (i >= OQS_KEM_algs_length) {
		return NULL;
	} else {
		return a[i];
	}
}

OQS_API int OQS_KEM_alg_count(void) {
	return OQS_KEM_algs_length;
}

OQS_API int OQS_KEM_alg_is_enabled(const char *method_name) {
	if (method_name == NULL) {
		return 0;
	} else if (0 == strcasecmp(method_name, OQS_KEM_alg_bike_l1)) {
#ifdef OQS_ENABLE_KEM_bike_l1
		return 1;
#else
		return 0;
#endif
	} else if (0 == strcasecmp(method_name, OQS_KEM_alg_bike_l3)) {
#ifdef OQS_ENABLE_KEM_bike_l3
		return 1;
#else
		return 0;
#endif
	} else if (0 == strcasecmp(method_name, OQS_KEM_alg_bike_l5)) {
#ifdef OQS_ENABLE_KEM_bike_l5
		return 1;
#else
		return 0;
#endif
		///// OQS_COPY_FROM_UPSTREAM_FRAGMENT_ENABLED_CASE_START
	} else if (0 == strcasecmp(method_name, OQS_KEM_alg_classic_mceliece_348864)) {
#ifdef OQS_ENABLE_KEM_classic_mceliece_348864
		return 1;
#else
		return 0;
#endif
	} else if (0 == strcasecmp(method_name, OQS_KEM_alg_classic_mceliece_348864f)) {
#ifdef OQS_ENABLE_KEM_classic_mceliece_348864f
		return 1;
#else
		return 0;
#endif
	} else if (0 == strcasecmp(method_name, OQS_KEM_alg_classic_mceliece_460896)) {
#ifdef OQS_ENABLE_KEM_classic_mceliece_460896
		return 1;
#else
		return 0;
#endif
	} else if (0 == strcasecmp(method_name, OQS_KEM_alg_classic_mceliece_460896f)) {
#ifdef OQS_ENABLE_KEM_classic_mceliece_460896f
		return 1;
#else
		return 0;
#endif
	} else if (0 == strcasecmp(method_name, OQS_KEM_alg_classic_mceliece_6688128)) {
#ifdef OQS_ENABLE_KEM_classic_mceliece_6688128
		return 1;
#else
		return 0;
#endif
	} else if (0 == strcasecmp(method_name, OQS_KEM_alg_classic_mceliece_6688128f)) {
#ifdef OQS_ENABLE_KEM_classic_mceliece_6688128f
		return 1;
#else
		return 0;
#endif
	} else if (0 == strcasecmp(method_name, OQS_KEM_alg_classic_mceliece_6960119)) {
#ifdef OQS_ENABLE_KEM_classic_mceliece_6960119
		return 1;
#else
		return 0;
#endif
	} else if (0 == strcasecmp(method_name, OQS_KEM_alg_classic_mceliece_6960119f)) {
#ifdef OQS_ENABLE_KEM_classic_mceliece_6960119f
		return 1;
#else
		return 0;
#endif
	} else if (0 == strcasecmp(method_name, OQS_KEM_alg_classic_mceliece_8192128)) {
#ifdef OQS_ENABLE_KEM_classic_mceliece_8192128
		return 1;
#else
		return 0;
#endif
	} else if (0 == strcasecmp(method_name, OQS_KEM_alg_classic_mceliece_8192128f)) {
#ifdef OQS_ENABLE_KEM_classic_mceliece_8192128f
		return 1;
#else
		return 0;
#endif
	} else if (0 == strcasecmp(method_name, OQS_KEM_alg_hqc_128)) {
#ifdef OQS_ENABLE_KEM_hqc_128
		return 1;
#else
		return 0;
#endif
	} else if (0 == strcasecmp(method_name, OQS_KEM_alg_hqc_192)) {
#ifdef OQS_ENABLE_KEM_hqc_192
		return 1;
#else
		return 0;
#endif
	} else if (0 == strcasecmp(method_name, OQS_KEM_alg_hqc_256)) {
#ifdef OQS_ENABLE_KEM_hqc_256
		return 1;
#else
		return 0;
#endif
	} else if (0 == strcasecmp(method_name, OQS_KEM_alg_kyber_512)) {
#ifdef OQS_ENABLE_KEM_kyber_512
		return 1;
#else
		return 0;
#endif
	} else if (0 == strcasecmp(method_name, OQS_KEM_alg_kyber_768)) {
#ifdef OQS_ENABLE_KEM_kyber_768
		return 1;
#else
		return 0;
#endif
	} else if (0 == strcasecmp(method_name, OQS_KEM_alg_kyber_1024)) {
#ifdef OQS_ENABLE_KEM_kyber_1024
		return 1;
#else
		return 0;
#endif
		///// OQS_COPY_FROM_UPSTREAM_FRAGMENT_ENABLED_CASE_END
	} else if (0 == strcasecmp(method_name, OQS_KEM_alg_ntruprime_sntrup761)) {
#ifdef OQS_ENABLE_KEM_ntruprime_sntrup761
		return 1;
#else
		return 0;
#endif
	} else if (0 == strcasecmp(method_name, OQS_KEM_alg_frodokem_640_aes)) {
#ifdef OQS_ENABLE_KEM_frodokem_640_aes
		return 1;
#else
		return 0;
#endif
	} else if (0 == strcasecmp(method_name, OQS_KEM_alg_frodokem_640_shake)) {
#ifdef OQS_ENABLE_KEM_frodokem_640_shake
		return 1;
#else
		return 0;
#endif
	} else if (0 == strcasecmp(method_name, OQS_KEM_alg_frodokem_976_aes)) {
#ifdef OQS_ENABLE_KEM_frodokem_976_aes
		return 1;
#else
		return 0;
#endif
	} else if (0 == strcasecmp(method_name, OQS_KEM_alg_frodokem_976_shake)) {
#ifdef OQS_ENABLE_KEM_frodokem_976_shake
		return 1;
#else
		return 0;
#endif
	} else if (0 == strcasecmp(method_name, OQS_KEM_alg_frodokem_1344_aes)) {
#ifdef OQS_ENABLE_KEM_frodokem_1344_aes
		return 1;
#else
		return 0;
#endif
	} else if (0 == strcasecmp(method_name, OQS_KEM_alg_frodokem_1344_shake)) {
#ifdef OQS_ENABLE_KEM_frodokem_1344_shake
		return 1;
#else
		return 0;
#endif
		// EDIT-WHEN-ADDING-KEM
	} else {
		return 0;
	}
}

OQS_API OQS_KEM *OQS_KEM_new(const char *method_name) {
	if (method_name == NULL) {
		return NULL;
	}
	if (0 == strcasecmp(method_name, OQS_KEM_alg_bike_l1)) {
#ifdef OQS_ENABLE_KEM_bike_l1
		return OQS_KEM_bike_l1_new();
#else
		return NULL;
#endif
	} else if (0 == strcasecmp(method_name, OQS_KEM_alg_bike_l3)) {
#ifdef OQS_ENABLE_KEM_bike_l3
		return OQS_KEM_bike_l3_new();
#else
		return NULL;
#endif
	} else if (0 == strcasecmp(method_name, OQS_KEM_alg_bike_l5)) {
#ifdef OQS_ENABLE_KEM_bike_l5
		return OQS_KEM_bike_l5_new();
#else
		return NULL;
#endif
		///// OQS_COPY_FROM_UPSTREAM_FRAGMENT_NEW_CASE_START
	} else if (0 == strcasecmp(method_name, OQS_KEM_alg_classic_mceliece_348864)) {
#ifdef OQS_ENABLE_KEM_classic_mceliece_348864
		return OQS_KEM_classic_mceliece_348864_new();
#else
		return NULL;
#endif
	} else if (0 == strcasecmp(method_name, OQS_KEM_alg_classic_mceliece_348864f)) {
#ifdef OQS_ENABLE_KEM_classic_mceliece_348864f
		return OQS_KEM_classic_mceliece_348864f_new();
#else
		return NULL;
#endif
	} else if (0 == strcasecmp(method_name, OQS_KEM_alg_classic_mceliece_460896)) {
#ifdef OQS_ENABLE_KEM_classic_mceliece_460896
		return OQS_KEM_classic_mceliece_460896_new();
#else
		return NULL;
#endif
	} else if (0 == strcasecmp(method_name, OQS_KEM_alg_classic_mceliece_460896f)) {
#ifdef OQS_ENABLE_KEM_classic_mceliece_460896f
		return OQS_KEM_classic_mceliece_460896f_new();
#else
		return NULL;
#endif
	} else if (0 == strcasecmp(method_name, OQS_KEM_alg_classic_mceliece_6688128)) {
#ifdef OQS_ENABLE_KEM_classic_mceliece_6688128
		return OQS_KEM_classic_mceliece_6688128_new();
#else
		return NULL;
#endif
	} else if (0 == strcasecmp(method_name, OQS_KEM_alg_classic_mceliece_6688128f)) {
#ifdef OQS_ENABLE_KEM_classic_mceliece_6688128f
		return OQS_KEM_classic_mceliece_6688128f_new();
#else
		return NULL;
#endif
	} else if (0 == strcasecmp(method_name, OQS_KEM_alg_classic_mceliece_6960119)) {
#ifdef OQS_ENABLE_KEM_classic_mceliece_6960119
		return OQS_KEM_classic_mceliece_6960119_new();
#else
		return NULL;
#endif
	} else if (0 == strcasecmp(method_name, OQS_KEM_alg_classic_mceliece_6960119f)) {
#ifdef OQS_ENABLE_KEM_classic_mceliece_6960119f
		return OQS_KEM_classic_mceliece_6960119f_new();
#else
		return NULL;
#endif
	} else if (0 == strcasecmp(method_name, OQS_KEM_alg_classic_mceliece_8192128)) {
#ifdef OQS_ENABLE_KEM_classic_mceliece_8192128
		return OQS_KEM_classic_mceliece_8192128_new();
#else
		return NULL;
#endif
	} else if (0 == strcasecmp(method_name, OQS_KEM_alg_classic_mceliece_8192128f)) {
#ifdef OQS_ENABLE_KEM_classic_mceliece_8192128f
		return OQS_KEM_classic_mceliece_8192128f_new();
#else
		return NULL;
#endif
	} else if (0 == strcasecmp(method_name, OQS_KEM_alg_hqc_128)) {
#ifdef OQS_ENABLE_KEM_hqc_128
		return OQS_KEM_hqc_128_new();
#else
		return NULL;
#endif
	} else if (0 == strcasecmp(method_name, OQS_KEM_alg_hqc_192)) {
#ifdef OQS_ENABLE_KEM_hqc_192
		return OQS_KEM_hqc_192_new();
#else
		return NULL;
#endif
	} else if (0 == strcasecmp(method_name, OQS_KEM_alg_hqc_256)) {
#ifdef OQS_ENABLE_KEM_hqc_256
		return OQS_KEM_hqc_256_new();
#else
		return NULL;
#endif
	} else if (0 == strcasecmp(method_name, OQS_KEM_alg_kyber_512)) {
#ifdef OQS_ENABLE_KEM_kyber_512
		return OQS_KEM_kyber_512_new();
#else
		return NULL;
#endif
	} else if (0 == strcasecmp(method_name, OQS_KEM_alg_kyber_768)) {
#ifdef OQS_ENABLE_KEM_kyber_768
		return OQS_KEM_kyber_768_new();
#else
		return NULL;
#endif
	} else if (0 == strcasecmp(method_name, OQS_KEM_alg_kyber_1024)) {
#ifdef OQS_ENABLE_KEM_kyber_1024
		return OQS_KEM_kyber_1024_new();
#else
		return NULL;
#endif
		///// OQS_COPY_FROM_UPSTREAM_FRAGMENT_NEW_CASE_END
	} else if (0 == strcasecmp(method_name, OQS_KEM_alg_ntruprime_sntrup761)) {
#ifdef OQS_ENABLE_KEM_ntruprime_sntrup761
		return OQS_KEM_ntruprime_sntrup761_new();
#else
		return NULL;
#endif
	} else if (0 == strcasecmp(method_name, OQS_KEM_alg_frodokem_640_aes)) {
#ifdef OQS_ENABLE_KEM_frodokem_640_aes
		return OQS_KEM_frodokem_640_aes_new();
#else
		return NULL;
#endif
	} else if (0 == strcasecmp(method_name, OQS_KEM_alg_frodokem_640_shake)) {
#ifdef OQS_ENABLE_KEM_frodokem_640_shake
		return OQS_KEM_frodokem_640_shake_new();
#else
		return NULL;
#endif
	} else if (0 == strcasecmp(method_name, OQS_KEM_alg_frodokem_976_aes)) {
#ifdef OQS_ENABLE_KEM_frodokem_976_aes
		return OQS_KEM_frodokem_976_aes_new();
#else
		return NULL;
#endif
	} else if (0 == strcasecmp(method_name, OQS_KEM_alg_frodokem_976_shake)) {
#ifdef OQS_ENABLE_KEM_frodokem_976_shake
		return OQS_KEM_frodokem_976_shake_new();
#else
		return NULL;
#endif
	} else if (0 == strcasecmp(method_name, OQS_KEM_alg_frodokem_1344_aes)) {
#ifdef OQS_ENABLE_KEM_frodokem_1344_aes
		return OQS_KEM_frodokem_1344_aes_new();
#else
		return NULL;
#endif
	} else if (0 == strcasecmp(method_name, OQS_KEM_alg_frodokem_1344_shake)) {
#ifdef OQS_ENABLE_KEM_frodokem_1344_shake
		return OQS_KEM_frodokem_1344_shake_new();
#else
		return NULL;
#endif
		// EDIT-WHEN-ADDING-KEM
	} else {
		return NULL;
	}
}

OQS_API OQS_STATUS OQS_KEM_keypair(const OQS_KEM *kem, uint8_t *public_key, uint8_t *secret_key) {
	if (kem == NULL) {
		return OQS_ERROR;
	} else {
		return kem->keypair(public_key, secret_key);
	}
}

OQS_API OQS_STATUS OQS_KEM_encaps(const OQS_KEM *kem, uint8_t *ciphertext, uint8_t *shared_secret, const uint8_t *public_key) {
	if (kem == NULL) {
		return OQS_ERROR;
	} else {
		return kem->encaps(ciphertext, shared_secret, public_key);
	}
}

OQS_API OQS_STATUS OQS_KEM_decaps(const OQS_KEM *kem, uint8_t *shared_secret, const uint8_t *ciphertext, const uint8_t *secret_key) {
	if (kem == NULL) {
		return OQS_ERROR;
	} else {
		return kem->decaps(shared_secret, ciphertext, secret_key);
	}
}

OQS_API void OQS_KEM_free(OQS_KEM *kem) {
	OQS_MEM_insecure_free(kem);
}

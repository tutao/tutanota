// SPDX-License-Identifier: MIT

#include <stdint.h>

void oqs_aes128_load_schedule_ni(const uint8_t *key, void **_schedule);
void oqs_aes128_free_schedule_ni(void *schedule);
void oqs_aes128_enc_sch_block_ni(const uint8_t *plaintext, const void *_schedule, uint8_t *ciphertext);
void oqs_aes128_ecb_enc_sch_ni(const uint8_t *plaintext, const size_t plaintext_len, const void *schedule, uint8_t *ciphertext);

void oqs_aes128_load_schedule_c(const uint8_t *key, void **_schedule);
void oqs_aes128_free_schedule_c(void *schedule);
void oqs_aes128_ecb_enc_sch_c(const uint8_t *plaintext, const size_t plaintext_len, const void *schedule, uint8_t *ciphertext);

void oqs_aes128_load_schedule_no_bitslice(const uint8_t *key, void **_schedule);
void oqs_aes128_free_schedule_no_bitslice(void *schedule);
void oqs_aes128_enc_sch_block_armv8(const uint8_t *plaintext, const void *_schedule, uint8_t *ciphertext);
void oqs_aes128_ecb_enc_sch_armv8(const uint8_t *plaintext, const size_t plaintext_len, const void *schedule, uint8_t *ciphertext);

void oqs_aes256_load_schedule_ni(const uint8_t *key, void **_schedule);
void oqs_aes256_load_iv_ni(const uint8_t *iv, size_t iv_len, void *_schedule);
void oqs_aes256_load_iv_u64_ni(uint64_t iv, void *_schedule);
void oqs_aes256_free_schedule_ni(void *schedule);
void oqs_aes256_enc_sch_block_ni(const uint8_t *plaintext, const void *_schedule, uint8_t *ciphertext);
void oqs_aes256_ecb_enc_sch_ni(const uint8_t *plaintext, const size_t plaintext_len, const void *schedule, uint8_t *ciphertext);
void oqs_aes256_ctr_enc_sch_ni(const uint8_t *iv, const size_t iv_len, const void *schedule, uint8_t *out, size_t out_len);
void oqs_aes256_ctr_enc_sch_upd_blks_ni(void *schedule, uint8_t *out, size_t out_len);

void oqs_aes256_load_schedule_c(const uint8_t *key, void **_schedule);
void oqs_aes256_load_iv_c(const uint8_t *iv, size_t iv_len, void *_schedule);
void oqs_aes256_load_iv_u64_c(uint64_t iv, void *_schedule);
void oqs_aes256_free_schedule_c(void *schedule);
void oqs_aes256_ecb_enc_sch_c(const uint8_t *plaintext, const size_t plaintext_len, const void *schedule, uint8_t *ciphertext);
void oqs_aes256_ctr_enc_sch_c(const uint8_t *iv, const size_t iv_len, const void *schedule, uint8_t *out, size_t out_len);
void oqs_aes256_ctr_enc_sch_upd_blks_c(void *schedule, uint8_t *out, size_t out_len);

void oqs_aes256_load_schedule_no_bitslice(const uint8_t *key, void **_schedule);
void oqs_aes256_load_iv_armv8(const uint8_t *iv, size_t iv_len, void *_schedule);
void oqs_aes256_free_schedule_no_bitslice(void *schedule);
void oqs_aes256_enc_sch_block_armv8(const uint8_t *plaintext, const void *_schedule, uint8_t *ciphertext);
void oqs_aes256_ecb_enc_sch_armv8(const uint8_t *plaintext, const size_t plaintext_len, const void *schedule, uint8_t *ciphertext);
void oqs_aes256_ctr_enc_sch_armv8(const uint8_t *iv, const size_t iv_len, const void *schedule, uint8_t *out, size_t out_len);
void oqs_aes256_ctr_enc_sch_upd_blks_armv8(void *schedule, uint8_t *out, size_t out_blks);

/* crypto/rsa/rsa_oaep.c */
/* Written by Ulf Moeller. This software is distributed on an "AS IS"
   basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. */

/* EME-OAEP as defined in RFC 2437 (PKCS #1 v2.0) */

/* See Victor Shoup, "OAEP reconsidered," Nov. 2000,
 * <URL: http://www.shoup.net/papers/oaep.ps.Z>
 * for problems with the security proof for the
 * original OAEP scheme, which EME-OAEP is based on.
 * 
 * A new proof can be found in E. Fujisaki, T. Okamoto,
 * D. Pointcheval, J. Stern, "RSA-OEAP is Still Alive!",
 * Dec. 2000, <URL: http://eprint.iacr.org/2000/061/>.
 * The new proof has stronger requirements for the
 * underlying permutation: "partial-one-wayness" instead
 * of one-wayness.  For the RSA function, this is
 * an equivalent notion.
 */


#if !defined(OPENSSL_NO_SHA) && !defined(OPENSSL_NO_SHA1)
#include <stdio.h>
//#include "cryptlib.h"

#include <openssl/crypto.h>
#include <openssl/buffer.h> 
#include <openssl/bio.h> 
#include <openssl/err.h>
#include <openssl/opensslconf.h>

#include <openssl/bn.h>
#include <openssl/rsa.h>
#include <openssl/evp.h>
#include <openssl/rand.h>
#include <openssl/sha.h>
#include "rsa_oaep_sha256.h"

static int MGF1_SHA256(unsigned char *mask, long len,
	const unsigned char *seed, long seedlen);

int RSA_padding_add_PKCS1_OAEP_SHA256(unsigned char *to, int tlen,
	const unsigned char *from, int flen,
	const unsigned char *param, int plen)
	{
	int i, emlen = tlen - 1;
	unsigned char *db, *seed;
	unsigned char *dbmask, seedmask[SHA256_DIGEST_LENGTH];

	if (flen > emlen - 2 * SHA256_DIGEST_LENGTH - 1)
		{
		RSAerr(RSA_F_RSA_PADDING_ADD_PKCS1_OAEP,
		   RSA_R_DATA_TOO_LARGE_FOR_KEY_SIZE);
		return 0;
		}

	if (emlen < 2 * SHA256_DIGEST_LENGTH + 1)
		{
		RSAerr(RSA_F_RSA_PADDING_ADD_PKCS1_OAEP, RSA_R_KEY_SIZE_TOO_SMALL);
		return 0;
		}

	to[0] = 0;
	seed = to + 1;
	db = to + SHA256_DIGEST_LENGTH + 1;

	// TUTAO: replaced sha1 with sha256
	if (!EVP_Digest((void *)param, plen, db, NULL, EVP_sha256(), NULL))
		return 0;
	memset(db + SHA256_DIGEST_LENGTH, 0,
		emlen - flen - 2 * SHA256_DIGEST_LENGTH - 1);
	db[emlen - flen - SHA256_DIGEST_LENGTH - 1] = 0x01;
	memcpy(db + emlen - flen - SHA256_DIGEST_LENGTH, from, (unsigned int) flen);
	if (RAND_bytes(seed, SHA256_DIGEST_LENGTH) <= 0)
		return 0;
#ifdef PKCS_TESTVECT
	memcpy(seed,
	   "\xaa\xfd\x12\xf6\x59\xca\xe6\x34\x89\xb4\x79\xe5\x07\x6d\xde\xc2\xf0\x6c\xb5\x8f",
	   20);
#endif

	dbmask = OPENSSL_malloc(emlen - SHA256_DIGEST_LENGTH);
	if (dbmask == NULL)
		{
		RSAerr(RSA_F_RSA_PADDING_ADD_PKCS1_OAEP, ERR_R_MALLOC_FAILURE);
		return 0;
		}

	if (MGF1_SHA256(dbmask, emlen - SHA256_DIGEST_LENGTH, seed, SHA256_DIGEST_LENGTH) < 0)
		return 0;
	for (i = 0; i < emlen - SHA256_DIGEST_LENGTH; i++)
		db[i] ^= dbmask[i];

	if (MGF1_SHA256(seedmask, SHA256_DIGEST_LENGTH, db, emlen - SHA256_DIGEST_LENGTH) < 0)
		return 0;
	for (i = 0; i < SHA256_DIGEST_LENGTH; i++)
		seed[i] ^= seedmask[i];

	OPENSSL_free(dbmask);
	return 1;
	}

int RSA_padding_check_PKCS1_OAEP_SHA256(unsigned char *to, int tlen,
	const unsigned char *from, int flen, int num,
	const unsigned char *param, int plen)
	{
	int i, dblen, mlen = -1;
	const unsigned char *maskeddb;
	int lzero;
	unsigned char *db = NULL, seed[SHA256_DIGEST_LENGTH], phash[SHA256_DIGEST_LENGTH];
	unsigned char *padded_from;
	int bad = 0;

	if (--num < 2 * SHA256_DIGEST_LENGTH + 1)
		/* 'num' is the length of the modulus, i.e. does not depend on the
		 * particular ciphertext. */
		goto decoding_err;

	lzero = num - flen;
	if (lzero < 0)
		{
		/* signalling this error immediately after detection might allow
		 * for side-channel attacks (e.g. timing if 'plen' is huge
		 * -- cf. James H. Manger, "A Chosen Ciphertext Attack on RSA Optimal
		 * Asymmetric Encryption Padding (OAEP) [...]", CRYPTO 2001),
		 * so we use a 'bad' flag */
		bad = 1;
		lzero = 0;
		flen = num; /* don't overflow the memcpy to padded_from */
		}

	dblen = num - SHA256_DIGEST_LENGTH;
	db = OPENSSL_malloc(dblen + num);
	if (db == NULL)
		{
		RSAerr(RSA_F_RSA_PADDING_CHECK_PKCS1_OAEP, ERR_R_MALLOC_FAILURE);
		return -1;
		}

	/* Always do this zero-padding copy (even when lzero == 0)
	 * to avoid leaking timing info about the value of lzero. */
	padded_from = db + dblen;
	memset(padded_from, 0, lzero);
	memcpy(padded_from + lzero, from, flen);

	maskeddb = padded_from + SHA256_DIGEST_LENGTH;

	if (MGF1_SHA256(seed, SHA256_DIGEST_LENGTH, maskeddb, dblen))
		return -1;
	for (i = 0; i < SHA256_DIGEST_LENGTH; i++)
		seed[i] ^= padded_from[i];
  
	if (MGF1_SHA256(db, dblen, seed, SHA256_DIGEST_LENGTH))
		return -1;
	for (i = 0; i < dblen; i++)
		db[i] ^= maskeddb[i];

	// TUTAO: replaced sha1 with sha256
	if (!EVP_Digest((void *)param, plen, phash, NULL, EVP_sha256(), NULL))
		return -1;

	if (CRYPTO_memcmp(db, phash, SHA256_DIGEST_LENGTH) != 0 || bad)
		goto decoding_err;
	else
		{
		for (i = SHA256_DIGEST_LENGTH; i < dblen; i++)
			if (db[i] != 0x00)
				break;
		if (i == dblen || db[i] != 0x01)
			goto decoding_err;
		else
			{
			/* everything looks OK */

			mlen = dblen - ++i;
			if (tlen < mlen)
				{
				RSAerr(RSA_F_RSA_PADDING_CHECK_PKCS1_OAEP, RSA_R_DATA_TOO_LARGE);
				mlen = -1;
				}
			else
				memcpy(to, db + i, mlen);
			}
		}
	OPENSSL_free(db);
	return mlen;

decoding_err:
	/* to avoid chosen ciphertext attacks, the error message should not reveal
	 * which kind of decoding error happened */
	RSAerr(RSA_F_RSA_PADDING_CHECK_PKCS1_OAEP, RSA_R_OAEP_DECODING_ERROR);
	if (db != NULL) OPENSSL_free(db);
	return -1;
	}


static int MGF1_SHA256(unsigned char *mask, long len, const unsigned char *seed,
		 long seedlen)
	{
	return PKCS1_MGF1(mask, len, seed, seedlen, EVP_sha256());
	}
#endif

//
//  Crypto.m
//  Tutanota plugin
//
//  Created by Tutao GmbH on 24.09.14.
//
//

#import <Foundation/Foundation.h>
#import <CommonCrypto/CommonDigest.h>
#import <openssl/md5.h>
#import <openssl/rsa.h>
#import <openssl/err.h>
#import <openssl/evp.h>
#import <openssl/bn.h>
#import <openssl/rand.h>
#import "rsa_oaep_sha256.h"
#import "JFBCrypt.h"

#import "TUTCrypto.h"
#import "TUTAes128Facade.h"
#import "TUTEncodingConverter.h"
#import "TUTErrorFactory.h"
#import "../Utils/TUTLog.h"
#import "TUTBigNum.h"

#import "Swiftier.h"
#import "../Utils/PSPDFFastEnumeration.h"

static NSInteger const RSA_KEY_LENGTH_IN_BITS = 2048;
static NSInteger const PUBLIC_EXPONENT = 65537;
static const NSString *const PUBLIC_EXPONENT_STRING = @"65537";

@implementation TUTPublicKey : NSObject
- (instancetype)initWithVersion:(NSInteger)version
                      keyLength:(NSInteger)keyLength
                        modulus:(NSString *)modulus
                 publicExponent:(NSInteger)publicExponent {
  self = [super init];
  _version = version;
  _keyLength = keyLength;
  _modulus = modulus;
  _publicExponent = publicExponent;
  return self;
}
@end

@implementation TUTPrivateKey : NSObject
- (instancetype)initWithVersion:(NSInteger)version
                      keyLength:(NSInteger)keyLength
                        modulus:(NSString *)modulus
                privateExponent:(NSString *)privateExponent
                         primeP:(NSString *)primeP
                         primeQ:(NSString *)primeQ
                 primeExponentP:(NSString *)primeExponentP
                 primeExponentQ:(NSString *)primeExponentQ
                 crtCoefficient:(NSString *)crtCoefficient {

  self = [super init];
  _version = version;
  _keyLength = keyLength;
  _modulus = modulus;
  _privateExponent = privateExponent;
  _primeP = primeP;
  _primeQ = primeQ;
  _primeExponentP = primeExponentP;
  _primeExponentQ = primeExponentQ;
  _crtCoefficient = crtCoefficient;
  return self;
}
@end

@implementation TUTKeyPair : NSObject
- (instancetype)initWithPublicKey:(TUTPublicKey *)publicKey
                       privateKey:(TUTPrivateKey *)privateKey {
  self = [super init];
  _publicKey = publicKey;
  _privateKey = privateKey;
  return self;
}
@end

@interface TUTCrypto ()
@property (readwrite) dispatch_queue_t serialQueue;
@end

@implementation TUTCrypto

- (TUTKeyPair *_Nullable)generateRsaKeyWithSeed:(NSString * _Nonnull)base64Seed error:(NSError **)error {
  // seeds the PRNG (pseudorandom number generator)
  NSData * seed = [[NSData alloc] initWithBase64EncodedString:base64Seed options:0];
  RAND_seed([seed bytes], (int) [seed length]);
  
  
  RSA* rsaKey = RSA_new();
  BIGNUM * e = BN_new();
  BN_dec2bn(&e, [PUBLIC_EXPONENT_STRING UTF8String]); // public exponent <- 65537
  
  // generate rsa key
  int status = RSA_generate_key_ex(rsaKey, RSA_KEY_LENGTH_IN_BITS, e, NULL);
  TUTKeyPair *keyPair;
  if (status > 0){
    keyPair = [TUTCrypto createRSAKeyPair:rsaKey
                                keyLength:RSA_KEY_LENGTH_IN_BITS
                                  version:0];
  } else {
    *error = [TUTCrypto logOpenSslError:@"Error while generating rsa key" statusCode:status];
  }
  BN_free(e);
  RSA_free(rsaKey);
  return keyPair;
}

- (NSString *_Nullable)rsaEncryptWithPublicKey:(TUTPublicKey * _Nonnull)publicKey
                     base64Data:(NSString * _Nonnull)base64Data
                     base64Seed:(NSString * _Nonnull)base64Seed
                          error: (NSError **)error {
	//convert json data to private key;
	RSA* publicRsaKey = [TUTCrypto createPublicRSAKey:publicKey];

	// convert base64 data to bytes.
	NSData *decodedData = [[NSData alloc] initWithBase64EncodedString:base64Data options: 0];

  int rsaSize = RSA_size(publicRsaKey); // should be 256 for a 2048 bit rsa key
  NSMutableData *paddingBuffer = [NSMutableData dataWithLength:rsaSize];
  int paddingLength = (int) [paddingBuffer length];
  
  // seeds the PRNG (pseudorandom number generator)
  NSData *seed = [[NSData alloc] initWithBase64EncodedString:base64Seed options:0];
  RAND_seed([seed bytes], (int) [seed length]);
  
  // add padding
  int status = RSA_padding_add_PKCS1_OAEP_SHA256([paddingBuffer mutableBytes], paddingLength, [decodedData bytes], (int) [decodedData length], NULL, 0);
  
  NSMutableData *encryptedData = [NSMutableData dataWithLength:rsaSize];
  if (status >= 0) {
    // encrypt
    status = RSA_public_encrypt(paddingLength, [paddingBuffer bytes], [encryptedData mutableBytes], publicRsaKey,  RSA_NO_PADDING);
  }
  NSString *encryptedBase64;
  if (status >= 0) {
    // Success
    encryptedBase64 = [encryptedData base64EncodedStringWithOptions:0];
  } else {
    // Error handling
    *error = [TUTCrypto logOpenSslError:@"rsa encryption failed" statusCode:status];
  }
  RSA_free(publicRsaKey);
  return encryptedBase64;
}


- (NSString *_Nullable)rsaDecryptWithPrivateKey:(TUTPrivateKey * )privateKey
                                     base64Data:(NSString *)base64Data
                                          error:(NSError **)error {
  //convert json data to private key;
  RSA* privateRsaKey = [TUTCrypto createPrivateRSAKey:privateKey];
  
  int rsaCheckResult = RSA_check_key(privateRsaKey);
  if (rsaCheckResult != 1){
    *error = [TUTCrypto logOpenSslError:@"Invald private rsa key" statusCode:rsaCheckResult];
    RSA_free(privateRsaKey);
    return nil;
  }
  
  // convert encrypted base64 data to bytes.
  NSData *decodedData =  [[NSData alloc] initWithBase64EncodedString:base64Data options: 0];
  
  int rsaSize = RSA_size(privateRsaKey); // should be 256 for a 2048 bit rsa key
  NSMutableData *decryptedBuffer = [NSMutableData dataWithLength:rsaSize];
  
  // Decrypt
  int status = RSA_private_decrypt((int) [decodedData length], [decodedData bytes], [decryptedBuffer mutableBytes], privateRsaKey, RSA_NO_PADDING);
  
  NSMutableData *paddingBuffer =[NSMutableData dataWithLength:rsaSize];
  // decryption succesfull remove padding
  if ( status >= 0 ){
    // converstion to bn and back is necessary to prepare paremeter flen for RSA_padding_check. Passing 256 to flen does not work.
    // see: http://marc.info/?l=openssl-users&m=108573630510562&w=2
    BIGNUM *bn = BN_bin2bn([decryptedBuffer bytes], (int) [decryptedBuffer length], NULL);
    int flen = BN_bn2bin(bn, [decryptedBuffer mutableBytes]);
    status = RSA_padding_check_PKCS1_OAEP_SHA256([paddingBuffer mutableBytes], (int) [paddingBuffer length], [decryptedBuffer bytes], flen, rsaSize, NULL, 0);
  }
  
  NSString* decryptedBase64;
  if (status > 0) {
    // Success
    NSData* decryptedData = [NSData dataWithBytes:[paddingBuffer bytes] length:status];
    decryptedBase64 = [decryptedData base64EncodedStringWithOptions:0];
  } else {
    // Error handling
    *error = [TUTCrypto logOpenSslError:@"rsa decryption failed" statusCode:status];
  }
  RSA_free(privateRsaKey);
  
  return decryptedBase64;
}



+ (RSA *)createPrivateRSAKey:(TUTPrivateKey *)key {
	RSA *rsaKey = RSA_new();
	rsaKey->e = BN_new();
	rsaKey->n= BN_new();
	rsaKey->d= BN_new();
	rsaKey->p = BN_new();
	rsaKey->q = BN_new();
	rsaKey->dmp1 = BN_new();
	rsaKey->dmq1 = BN_new();
	rsaKey->iqmp = BN_new();

	const char *publicExponent = [PUBLIC_EXPONENT_STRING UTF8String];
	BN_dec2bn(&rsaKey->e, publicExponent); // public exponent <- 65537
	[TUTBigNum toBIGNUM:rsaKey->n fromB64:key.modulus]; // public modulus <- modulus
	[TUTBigNum toBIGNUM:rsaKey->d fromB64:key.privateExponent]; // private exponent <- privateExponent
	[TUTBigNum toBIGNUM:rsaKey->p fromB64:key.primeP]; // secret prime factor <- primeP
	[TUTBigNum toBIGNUM:rsaKey->q fromB64:key.primeQ]; // secret prime factor <- primeQ
	[TUTBigNum toBIGNUM:rsaKey->dmp1 fromB64:key.primeExponentP]; // d mod (p-1) <- primeExponentP
	[TUTBigNum toBIGNUM:rsaKey->dmq1 fromB64:key.primeExponentQ]; // d mod (q-1) <- primeExponentQ
	[TUTBigNum toBIGNUM:rsaKey->iqmp fromB64:key.crtCoefficient]; // q^-1 mod p <- crtCoefficient
	return rsaKey;
}


+ (RSA *)createPublicRSAKey:(NSObject *)key {
	NSString* modulus = [key valueForKey:@"modulus"];

	RSA *rsaKey = RSA_new();
	rsaKey->e = BN_new();
	rsaKey->n= BN_new();

	const char *publicExponent = "65537";
	BN_dec2bn(&rsaKey->e, publicExponent ); // public exponent <- 65537
	[TUTBigNum toBIGNUM:rsaKey->n fromB64:modulus]; // public modulus <- modulus
	return rsaKey;
}


+ (TUTKeyPair *)createRSAKeyPair:(RSA*)key
                       keyLength:(NSInteger)keyLength
                         version:(NSInteger)version
{
  let modulus = [TUTBigNum toB64:key->n];
  let publicKey = [[TUTPublicKey alloc] initWithVersion:version
                                              keyLength:keyLength
                                                modulus:modulus
                                         publicExponent:PUBLIC_EXPONENT
  ];
  
  let privateKey = [[TUTPrivateKey alloc] initWithVersion:version
                                                keyLength:keyLength
                                                modulus:modulus
                                                privateExponent:[TUTBigNum toB64:key->d]
                                                primeP:[TUTBigNum toB64:key->p]
                                                primeQ:[TUTBigNum toB64:key->q]
                                                primeExponentP:[TUTBigNum toB64:key->dmp1]
                                                primeExponentQ:[TUTBigNum toB64:key->dmq1]
                                                crtCoefficient:[TUTBigNum toB64:key->iqmp]
  ];
  
  return [[TUTKeyPair alloc] initWithPublicKey:publicKey privateKey:privateKey];
}

+ (NSData *)generateIv {
	unsigned char buffer[TUTAO_IV_BYTE_SIZE];
	int rc = RAND_bytes(buffer, (int) TUTAO_IV_BYTE_SIZE);
	if (rc!=1){
		return nil;
	}
	return [[NSData alloc]initWithBytes:buffer length:TUTAO_IV_BYTE_SIZE];
}


+ (NSData *)sha256:(NSData *)data {
	unsigned char hash[CC_SHA256_DIGEST_LENGTH];
	if (CC_SHA256([data bytes], (int) [data length], hash) ) {
		return [NSData dataWithBytes:hash length:CC_SHA256_DIGEST_LENGTH];
	}
	return nil;
}


+ (NSError *) logOpenSslError:(NSString *)msg statusCode:(int) statusCode{
	ERR_load_crypto_strings();

	size_t messageBufferSize = 256;
	char *messageBuffer = (char *)calloc(messageBufferSize, sizeof(char));

	int errorCode = (int) ERR_get_error();
	// loop until there is no more error code in the queue
	NSMutableArray<NSString*> *errors = [NSMutableArray new] ;
	while (errorCode != 0) {
		ERR_error_string( errorCode, messageBuffer);
		let errorString = [NSString stringWithFormat:@"Error: %@ <%i|%s>", msg, errorCode, messageBuffer ];
		TUTLog(@"%@", errorString);
		[errors addObject:errorString];
		errorCode = (int) ERR_get_error();
	}
	ERR_free_strings();
	return  [NSError errorWithDomain:TUT_CRYPTO_ERROR code:statusCode userInfo:@{ @"OpenSSLErrors": errors}];
}


@end




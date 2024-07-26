#import <Foundation/Foundation.h>
#import <CommonCrypto/CommonDigest.h>
#import <openssl/md5.h>
#import <openssl/rsa.h>
#import <openssl/err.h>
#import <openssl/evp.h>
#import <openssl/bn.h>
#import <openssl/rand.h>
#import "rsa_oaep_sha256.h"

#import "TUTCrypto.h"
#import "TUTEncodingConverter.h"
#import "TUTErrorFactory.h"
#import "../Utils/TUTLog.h"
#import "TUTBigNum.h"

#import "Swiftier.h"
#import "../Utils/PSPDFFastEnumeration.h"

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

- (NSData *_Nullable)rsaEncryptWithPublicKey:(TUTPublicKey * _Nonnull)publicKey
                                        data:(NSData * _Nonnull)data
                                        seed:(NSData * _Nonnull)seed
                                       error: (NSError **)error {
  //convert json data to private key;
  RSA* publicRsaKey = [TUTCrypto createPublicRSAKey:publicKey];


  int rsaSize = RSA_size(publicRsaKey); // should be 256 for a 2048 bit rsa key
  NSMutableData *paddingBuffer = [NSMutableData dataWithLength:rsaSize];
  int paddingLength = (int) [paddingBuffer length];

  // seeds the PRNG (pseudorandom number generator)
  RAND_seed([seed bytes], (int) [seed length]);

  // add padding
  int status = RSA_padding_add_PKCS1_OAEP_SHA256([paddingBuffer mutableBytes], paddingLength, [data bytes], (int) [data length], NULL, 0);

  NSMutableData *encryptedData = [NSMutableData dataWithLength:rsaSize];
  if (status >= 0) {
    // encrypt
    status = RSA_public_encrypt(paddingLength, [paddingBuffer bytes], [encryptedData mutableBytes], publicRsaKey,  RSA_NO_PADDING);
  }
  NSData *_Nullable returnData = nil;
  if (status >= 0) {
    // Success
    returnData = encryptedData;
  } else {
    // Error handling
    *error = [TUTCrypto logOpenSslError:@"rsa encryption failed" statusCode:status];
  }
  RSA_free(publicRsaKey);
  return returnData;
}


- (NSData *_Nullable)rsaDecryptWithPrivateKey:(TUTPrivateKey * )privateKey
                                         data:(NSData *)data
                                        error:(NSError **)error {
  //convert json data to private key;
  RSA* privateRsaKey = [TUTCrypto createPrivateRSAKey:privateKey];

  int rsaCheckResult = RSA_check_key(privateRsaKey);
  if (rsaCheckResult != 1){
    *error = [TUTCrypto logOpenSslError:@"Invald private rsa key" statusCode:rsaCheckResult];
    RSA_free(privateRsaKey);
    return nil;
  }

  int rsaSize = RSA_size(privateRsaKey); // should be 256 for a 2048 bit rsa key
  NSMutableData *decryptedBuffer = [NSMutableData dataWithLength:rsaSize];

  // Decrypt
  int status = RSA_private_decrypt((int) [data length], [data bytes], [decryptedBuffer mutableBytes], privateRsaKey, RSA_NO_PADDING);

  NSMutableData *paddingBuffer =[NSMutableData dataWithLength:rsaSize];
  // decryption succesfull remove padding
  if ( status >= 0 ){
    // converstion to bn and back is necessary to prepare paremeter flen for RSA_padding_check. Passing 256 to flen does not work.
    // see: http://marc.info/?l=openssl-users&m=108573630510562&w=2
    BIGNUM *bn = BN_bin2bn([decryptedBuffer bytes], (int) [decryptedBuffer length], NULL);
    int flen = BN_bn2bin(bn, [decryptedBuffer mutableBytes]);
    status = RSA_padding_check_PKCS1_OAEP_SHA256([paddingBuffer mutableBytes], (int) [paddingBuffer length], [decryptedBuffer bytes], flen, rsaSize, NULL, 0);
  }

  NSData*_Nullable returnData = nil;
  if (status > 0) {
    // Success
    returnData = [NSData dataWithBytes:[paddingBuffer bytes] length:status];
  } else {
    // Error handling
    *error = [TUTCrypto logOpenSslError:@"rsa decryption failed" statusCode:status];
  }
  RSA_free(privateRsaKey);

  return returnData;
}


+ (RSA *)createPrivateRSAKey:(TUTPrivateKey *)key {
  const char *publicExponent = [PUBLIC_EXPONENT_STRING UTF8String];
  RSA *rsaKey = RSA_new();

  BIGNUM *n = BN_new();
  [TUTBigNum toBIGNUM:n fromB64:key.modulus]; // public modulus <- modulus

  BIGNUM *e = BN_new();
  BN_dec2bn(&e, publicExponent); // public exponent <- 65537

  BIGNUM *d = BN_new();
  [TUTBigNum toBIGNUM:d fromB64:key.privateExponent]; // private exponent <- privateExponent

  RSA_set0_key(rsaKey, n, e, d);

  BIGNUM *p = BN_new();
  [TUTBigNum toBIGNUM:p fromB64:key.primeP]; // secret prime factor <- primeP

  BIGNUM *q = BN_new();
  [TUTBigNum toBIGNUM:q fromB64:key.primeQ]; // secret prime factor <- primeQ

  RSA_set0_factors(rsaKey, p, q);

  BIGNUM *dmp1 = BN_new();
  [TUTBigNum toBIGNUM:dmp1 fromB64:key.primeExponentP]; // d mod (p-1) <- primeExponentP

  BIGNUM *dmq1 = BN_new();
  [TUTBigNum toBIGNUM:dmq1 fromB64:key.primeExponentQ]; // d mod (q-1) <- primeExponentQ

  BIGNUM *iqmp = BN_new();
  [TUTBigNum toBIGNUM:iqmp fromB64:key.crtCoefficient]; // q^-1 mod p <- crtCoefficient

  RSA_set0_crt_params(rsaKey, dmp1, dmq1, iqmp);

  return rsaKey;
}


+ (RSA *)createPublicRSAKey:(NSObject *)key {
  const char *publicExponent = [PUBLIC_EXPONENT_STRING UTF8String];
  NSString* modulus = [key valueForKey:@"modulus"];

  RSA *rsaKey = RSA_new();

  BIGNUM *e = BN_new();
  BN_dec2bn(&e, publicExponent); // public exponent <- 65537
  BIGNUM *n = BN_new();
  [TUTBigNum toBIGNUM:n fromB64:modulus]; // public modulus <- modulus
  RSA_set0_key(rsaKey, n, e, NULL);
  return rsaKey;
}


+ (TUTKeyPair *)createRSAKeyPair:(RSA*)key
                       keyLength:(NSInteger)keyLength
                         version:(NSInteger)version
{
  let modulus = [TUTBigNum toB64:RSA_get0_n(key)];
  let publicKey = [[TUTPublicKey alloc] initWithVersion:version
                                              keyLength:keyLength
                                                modulus:modulus
                                         publicExponent:PUBLIC_EXPONENT
  ];

  let privateKey = [[TUTPrivateKey alloc] initWithVersion:version
                                                keyLength:keyLength
                                                  modulus:modulus
                                          privateExponent:[TUTBigNum toB64:RSA_get0_d(key)]
                                                   primeP:[TUTBigNum toB64:RSA_get0_p(key)]
                                                   primeQ:[TUTBigNum toB64:RSA_get0_q(key)]
                                           primeExponentP:[TUTBigNum toB64:RSA_get0_dmp1(key)]
                                           primeExponentQ:[TUTBigNum toB64:RSA_get0_dmq1(key)]
                                           crtCoefficient:[TUTBigNum toB64:RSA_get0_iqmp(key)]
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

+ (NSData *)generateAES256Key {
  const int key_length_bytes = AES_256_KEY_LENGTH_IN_BITS / 8;
  unsigned char buffer[key_length_bytes];
  int rc = RAND_bytes(buffer, key_length_bytes);
  if (rc!=1){
	return nil;
  }
  return [[NSData alloc]initWithBytes:buffer length:key_length_bytes];
}


+ (NSData *)sha256:(NSData *)data {
  unsigned char hash[CC_SHA256_DIGEST_LENGTH];
  if (CC_SHA256([data bytes], (CC_LONG) [data length], hash) ) {
    return [NSData dataWithBytes:hash length:sizeof(hash)];
  }
  return nil;
}


+ (NSError *) logOpenSslError:(NSString *)msg statusCode:(int) statusCode{

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
  return  [NSError errorWithDomain:TUT_CRYPTO_ERROR code:statusCode userInfo:@{ @"OpenSSLErrors": errors}];
}


@end




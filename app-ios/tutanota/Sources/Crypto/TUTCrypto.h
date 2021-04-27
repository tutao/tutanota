//
//  TUTCrypto.h
//  Tutanota plugin
//
//  Created by Tutao GmbH on 24.09.14.
//
//
#import <openssl/ossl_typ.h>

NS_ASSUME_NONNULL_BEGIN

@interface TUTCrypto : NSObject

/* Definitions from the Crypto.js interface. */
- (void)generateRsaKeyWithSeed:(NSString *)base64Seed
					completion:(void (^)(NSDictionary * _Nullable keyPair, NSError * _Nullable error))completion;

- (void)rsaEncryptWithPublicKey:(NSObject * )publicKey
					 base64Data:(NSString *)base64Data
					 base64Seed:(NSString *)base64Seed
					completion:(void (^)(NSString * _Nullable encryptedBase64, NSError * _Nullable error))completion;

- (void)rsaDecryptWithPrivateKey:(NSObject * )privateKey
					  base64Data:(NSString *)base64Data
					  completion:(void (^)(NSString * _Nullable decryptedBase64, NSError * _Nullable error))completion;

- (void)aesEncryptFileWithKey:(NSString * )keyBase64
					   atPath:(NSString *)filePath
				   completion:(void(^)(NSDictionary<NSString *, NSString *> * _Nullable fileInfo, NSError * _Nullable error))completion;

- (void)aesDecryptFileWithKey:(NSString * )base64key
					   atPath:(NSString *)filePath
				   completion:(void(^)(NSString * _Nullable filePath, NSError * _Nullable error))completion;

+ (NSData * )sha256:(NSData *)data;

+ (NSString * )toB64:(BIGNUM *)number;
+ (void)toBIGNUM:(BIGNUM *)number fromB64:(NSString *)value;

@end

NS_ASSUME_NONNULL_END

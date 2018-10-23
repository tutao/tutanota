//
//  TUTCrypto.h
//  Tutanota plugin
//
//  Created by Tutao GmbH on 24.09.14.
//
//
#import <openssl/ossl_typ.h>

@interface TUTCrypto : NSObject

/* Definitions from the Crypto.js interface. */
- (void)generateRsaKeyWithSeed:(NSString * _Nonnull)base64Seed
					completion:(void (^)(NSDictionary * _Nullable keyPair, NSError * _Nullable error))completion;

- (void)rsaEncryptWithPublicKey:(NSObject * _Nonnull)publicKey
					 base64Data:(NSString * _Nonnull)base64Data
					 base64Seed:(NSString * _Nonnull)base64Seed
					completion:(void (^ _Nonnull)(NSString * _Nullable encryptedBase64, NSError * _Nullable error))completion;

- (void)rsaDecryptWithPrivateKey:(NSObject * _Nonnull)privateKey
					  base64Data:(NSString * _Nonnull)base64Data
					  completion:(void (^ _Nonnull)(NSString * _Nullable decryptedBase64, NSError * _Nullable error))completion;

- (void)aesEncryptFileWithKey:(NSString * _Nonnull)keyBase64
					   atPath:(NSString * _Nonnull)filePath
				   completion:(void(^ _Nonnull)(NSString * _Nullable filePath, NSError * _Nullable error))completion;

- (void)aesDecryptFileWithKey:(NSString * _Nonnull)base64key
					   atPath:(NSString * _Nonnull)filePath
				   completion:(void(^ _Nonnull)(NSString * _Nullable filePath, NSError * _Nullable error))completion;

+ (NSData *)sha256:(NSData *)data;

+ (NSString *)toB64:(BIGNUM*)number;
+ (void)toBIGNUM:(BIGNUM *) number fromB64:(NSString*)value;

@end

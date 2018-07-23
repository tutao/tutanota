//
//  Crypto.h
//  Tutanota plugin
//
//  Created by Tutao GmbH on 24.09.14.
//
//

#ifndef Tutanota_plugin_Crypto_h
#define Tutanota_plugin_Crypto_h

@interface Crypto : NSObject

/* Definitions from the Crypto.js interface. */
- (void)generateRsaKeyWithSeed:(NSString * _Nonnull)base64Seed completion:(void (^)(NSDictionary *keyPair, NSError *error))completion;
- (void)rsaEncryptWithPublicKey:(NSObject * _Nonnull)publicKey base64Data:(NSString * _Nonnull)base64Data completeion:(void (^ _Nonnull)(NSString * _Nullable encryptedBase64, NSError * _Nullable error))completion;
- (void)rsaDecryptWithPrivateKey:(NSObject * _Nonnull)privateKey base64Data:(NSString * _Nonnull)base64Data completion:(void (^)(NSString * _Nullable decryptedBase64, NSError * _Nullable error))completion;
//- (void)aesEncrypt:(CDVInvokedUrlCommand*)command;
//- (void)aesEncryptFile:(CDVInvokedUrlCommand*)command;
//- (void)aesDecrypt:(CDVInvokedUrlCommand*)command;
//- (void)aesDecryptFile:(CDVInvokedUrlCommand*)command;

@end

#endif

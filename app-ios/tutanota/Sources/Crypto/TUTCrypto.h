//
//  TUTCrypto.h
//
//  Created by Tutao GmbH on 24.09.14.
//
//

NS_ASSUME_NONNULL_BEGIN

@interface TUTPublicKey : NSObject
@property(nonatomic, readonly) NSInteger version;
@property(nonatomic, readonly) NSInteger keyLength;
@property(nonatomic, nonnull, readonly) NSString *modulus;
@property(nonatomic, readonly) NSInteger publicExponent;

-(instancetype)initWithVersion:(NSInteger)version
                     keyLength:(NSInteger)keyLength
                       modulus:(NSString *)modulus
                publicExponent:(NSInteger)publicExponent;
@end

@interface TUTPrivateKey : NSObject
@property(nonatomic, readonly) NSInteger version;
@property(nonatomic, readonly) NSInteger keyLength;
@property(nonatomic, nonnull, readonly) NSString *modulus;
@property(nonatomic, nonnull, readonly) NSString *privateExponent;
@property(nonatomic, nonnull, readonly) NSString *primeP;
@property(nonatomic, nonnull, readonly) NSString *primeQ;
@property(nonatomic, nonnull, readonly) NSString *primeExponentP;
@property(nonatomic, nonnull, readonly) NSString *primeExponentQ;
@property(nonatomic, nonnull, readonly) NSString *crtCoefficient;

- (instancetype)initWithVersion:(NSInteger)version
                      keyLength:(NSInteger)keyLength
                        modulus:(NSString *)modulus
                privateExponent:(NSString *)privateExponent
                         primeP:(NSString *)primeP
                         primeQ:(NSString *)primeQ
                 primeExponentP:(NSString *)primeExponentP
                 primeExponentQ:(NSString *)primeExponentQ
                 crtCoefficient:(NSString *)crtCoefficient;
@end

@interface TUTKeyPair : NSObject
@property(nonatomic, nonnull, readonly) TUTPublicKey *publicKey;
@property(nonatomic, nonnull, readonly) TUTPrivateKey *privateKey;

- (instancetype)initWithPublicKey:(TUTPublicKey *)publicKey
                       privateKey:(TUTPrivateKey *)privateKey;
@end

/**
   Low-level cryptographic operations.
 */
@interface TUTCrypto : NSObject

- (TUTKeyPair *_Nullable)generateRsaKeyWithSeed:(NSString * _Nonnull)base64Seed error:(NSError **)error;

- (NSString *_Nullable)rsaEncryptWithPublicKey:(TUTPublicKey *_Nonnull)publicKey
                                    base64Data:(NSString * _Nonnull)base64Data
                                    base64Seed:(NSString * _Nonnull)base64Seed
                                         error: (NSError **)error;

- (NSString *_Nullable)rsaDecryptWithPrivateKey:(TUTPrivateKey *)privateKey
                                     base64Data:(NSString *)base64Data
                                          error:(NSError **)error;

+ (NSData * )sha256:(NSData *)data;

+ (NSData *)generateIv;

@end

NS_ASSUME_NONNULL_END

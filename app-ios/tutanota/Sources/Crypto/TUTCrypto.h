NS_ASSUME_NONNULL_BEGIN

static NSInteger const RSA_KEY_LENGTH_IN_BITS = 2048;
static NSInteger const PUBLIC_EXPONENT = 65537;

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

- (TUTKeyPair *_Nullable)generateRsaKeyWithSeed:(NSData * _Nonnull)seed error:(NSError **)error;

- (NSData *_Nullable)rsaEncryptWithPublicKey:(TUTPublicKey *_Nonnull)publicKey
                                        data:(NSData * _Nonnull)data
                                        seed:(NSData * _Nonnull)seed
                                       error: (NSError **)error;

- (NSData *_Nullable)rsaDecryptWithPrivateKey:(TUTPrivateKey *)privateKey
                                         data:(NSData *)data
                                        error:(NSError **)error;

+ (NSData * )sha256:(NSData *)data;

+ (NSData *)generateIv;

@end

NS_ASSUME_NONNULL_END

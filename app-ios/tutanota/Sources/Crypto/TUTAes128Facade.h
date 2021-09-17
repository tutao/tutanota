NS_ASSUME_NONNULL_BEGIN

extern NSInteger const TUTAO_IV_BYTE_SIZE;

@interface TUTAes128Facade : NSObject

+ (NSData *_Nullable)encrypt:(NSData*)plainText withKey:(NSData*)key withIv:(NSData*)iv withMac:(BOOL)useMac error:(NSError**)error;
+ (NSData *_Nullable)decrypt:(NSData*)encryptedData withKey:(NSData*)key error:(NSError**)error;
+ (NSData *_Nullable)decryptKey:(NSData *)encryptedKey withEncryptionKey:(NSData *)encryptionKey error:(NSError**)error;
+ (NSString *_Nullable)decryptBase64String:(NSString *)string encryptionKey:(NSData *)encryptionKey error:(NSError **)error;
@end

NS_ASSUME_NONNULL_END

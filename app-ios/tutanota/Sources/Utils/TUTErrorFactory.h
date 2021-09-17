NS_ASSUME_NONNULL_BEGIN

extern NSString *const TUT_ERROR_DOMAIN;
extern NSString *const TUT_CRYPTO_ERROR;
extern NSString *const TUT_FILEVIEWER_ERROR;
extern NSString *const TUT_NETWORK_ERROR;

@interface TUTErrorFactory : NSObject

+ (NSError *)createError:(NSString*) description;
+ (NSError *)createErrorWithDomain:(NSString*) domain message:(NSString*) description;
+ (NSError *)wrapNativeErrorWithDomain:(NSString *)domain message:(NSString *)description error:(NSError *)error;
+ (NSError *)wrapCryptoErrorWithMessage:(NSString *)descrption error:(NSError *)error;
@end

NS_ASSUME_NONNULL_END

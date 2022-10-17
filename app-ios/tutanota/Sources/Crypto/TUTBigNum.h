#import <Foundation/Foundation.h>
#import <openssl/ossl_typ.h>

NS_ASSUME_NONNULL_BEGIN

@interface TUTBigNum : NSObject
+ (NSString * )toB64:(const BIGNUM *)number;
+ (void)toBIGNUM:(const BIGNUM *)number fromB64:(NSString *)value;
@end

NS_ASSUME_NONNULL_END

NS_ASSUME_NONNULL_BEGIN

@interface TUTEncodingConverter : NSObject
+ (NSData*)hexToBytes:(NSString*)hex;
+ (NSString*)bytesToHex:(NSData*)data;
@end

NS_ASSUME_NONNULL_END

NS_ASSUME_NONNULL_BEGIN

@interface TUTEncodingConverter : NSObject
+ (NSData*)hexToBytes:(NSString*)hex;
+ (NSString*)bytesToHex:(NSData*)data;
+ (NSData*)base64ToBytes:(NSString*)base64String;
+ (NSString*)bytesToBase64:(NSData*)bytes;
+ (NSData*)stringToBytes:(NSString*)string;
+ (NSString*)bytesToString:(NSData*)bytes;
@end

NS_ASSUME_NONNULL_END

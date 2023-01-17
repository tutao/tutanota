#ifndef EncodingConverter_h
#define EncodingConverter_h

@interface TutaoEncodingConverter : NSObject

+ (NSData*)hexToBytes:(NSString*)hex;
+ (NSString*)bytesToHex:(NSData*)data;
+ (NSData*)base64ToBytes:(NSString*)base64String;
+ (NSString*)bytesToBase64:(NSData*)bytes;
+ (NSData*)stringToBytes:(NSString*)string;
+ (NSString*)bytesToString:(NSData*)bytes;

@end

#endif /* EncodingConverter_h */

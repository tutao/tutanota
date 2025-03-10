#import <Foundation/Foundation.h>
#include "TUTEncodingConverter.h"

@implementation TUTEncodingConverter {
}

+ (NSData*)hexToBytes:(NSString*)hex {
  const char* utf8string = hex.UTF8String;
	NSMutableData *bytes= [[NSMutableData alloc] init];
	unsigned long whole_byte;
	char byte_chars[3] = {'\0','\0','\0'};
	for (int i = 0; i < ([hex length] / 2); i++) {
		byte_chars[0] = utf8string[i*2];
		byte_chars[1] = utf8string[i*2+1];
		whole_byte = strtoul(byte_chars, NULL, 16);
		[bytes appendBytes:&whole_byte length:1];
	}
	return bytes;
}
	
	
+ (NSString*)bytesToHex:(NSData*)data{
    const unsigned char *dataBuffer = (const unsigned char *)[data bytes];
    NSUInteger          dataLength  = [data length];
    NSMutableString     *hexString  = [NSMutableString stringWithCapacity:(dataLength * 2)];

    for (int i = 0; i < dataLength; ++i){
        [hexString appendFormat:@"%02x", (unsigned int)dataBuffer[i]];
    }
    return [NSString stringWithString:hexString];
}

@end

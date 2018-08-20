//
//  EncodingConverter.m
//  CryptoIos
//
//  Created by Tutao GmbH on 20.10.16.
//  Copyright © 2016 Tutao GmbH. All rights reserved.
//

#import <Foundation/Foundation.h>
#include "TUTEncodingConverter.h"

@implementation TUTEncodingConverter {
}

+ (NSData*)hexToBytes:(NSString*)hex {
	NSMutableData *bytes= [[NSMutableData alloc] init];
	unsigned char whole_byte;
	char byte_chars[3] = {'\0','\0','\0'};
	for (int i = 0; i < ([hex length] / 2); i++) {
		byte_chars[0] = [hex characterAtIndex:i*2];
		byte_chars[1] = [hex characterAtIndex:i*2+1];
		whole_byte = strtol(byte_chars, NULL, 16);
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


+ (NSData*)base64ToBytes:(NSString*)base64String {
	return [[NSData alloc] initWithBase64EncodedString:base64String options: 0];
}

+ (NSString*)bytesToBase64:(NSData*)bytes {
	return [bytes base64EncodedStringWithOptions:0];
}


+ (NSData*)stringToBytes:(NSString*)string {
	return [string dataUsingEncoding:NSUTF8StringEncoding];
}

+ (NSString*)bytesToString:(NSData*)bytes {
   return [[NSString alloc] initWithData:bytes encoding:NSUTF8StringEncoding];
}

@end

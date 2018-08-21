//
//  TutaoErrorFactory.m
//  Tutanota
//
//  Created by Tutao GmbH on 28.10.16.
//
//

#import <Foundation/Foundation.h>
#import "TUTErrorFactory.h"

NSString *const TUT_ERROR_DOMAIN = @"de.tutao.tutanota";
NSString *const TUT_CRYPTO_ERROR = @"de.tutao.tutanota.CryptoError";

@implementation TUTErrorFactory

+ (NSError *)createError:(NSString*) description {
	return [TUTErrorFactory createErrorWithDomain:TUT_ERROR_DOMAIN msg:description];
}
+ (NSError *)createErrorWithDomain:(NSString*) domain msg:(NSString*) description {
	return [NSError errorWithDomain:domain code:-101 userInfo:@{NSLocalizedDescriptionKey:description}];
}

@end

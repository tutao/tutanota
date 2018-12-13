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
NSString *const TUT_CRYPTO_ERROR = @"de.tutao.tutanota.TutCrypto";
NSString *const TUT_FILEVIEWER_ERROR = @"de.tutao.tutanota.TutFileViewer";

@implementation TUTErrorFactory

+ (NSError *)createError:(NSString*) description {
	return [TUTErrorFactory createErrorWithDomain:TUT_ERROR_DOMAIN message:description];
}
+ (NSError *)createErrorWithDomain:(NSString*) domain message:(NSString*) description {
	return [NSError errorWithDomain:domain code:-101 userInfo:@{@"message":description}];
}

+ (NSError *)wrapNativeErrorWithDomain:(NSString *)domain message:(NSString *)description error:(NSError *)error {
	NSMutableDictionary * userInfo = [[NSMutableDictionary alloc] initWithDictionary:error.userInfo];
	[userInfo setValue:description forKey:@"message"];
	return [NSError errorWithDomain:domain code:error.code userInfo:userInfo];
}

+ (NSError *)wrapCryptoErrorWithMessage:(NSString *)descrption error:(NSError *)error {
	return [TUTErrorFactory wrapNativeErrorWithDomain:TUT_CRYPTO_ERROR message:descrption error:error];
}

@end

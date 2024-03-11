#import <Foundation/Foundation.h>
#import "TUTErrorFactory.h"

NSString *const TUT_ERROR_DOMAIN = @"de.tutao.tutanota";
NSString *const TUT_CRYPTO_ERROR = @"de.tutao.tutanota.TutCrypto";
NSString *const TUT_FILEVIEWER_ERROR = @"de.tutao.tutanota.TutFileViewer";
NSString *const TUT_NETWORK_ERROR = @"de.tutao.tutanota.network";

@implementation TUTErrorFactory

+ (NSError *)createError:(NSString*) description {
	return [TUTErrorFactory createErrorWithDomain:TUT_ERROR_DOMAIN message:description];
}
+ (NSError *)createErrorWithDomain:(NSString*) domain message:(NSString*) description {
	return [NSError errorWithDomain:domain code:-101 userInfo:@{@"message":description}];
}

+ (NSError *)wrapNativeErrorWithDomain:(NSString *)domain message:(NSString *)description error:(NSError *)error {
  return [NSError errorWithDomain:domain code:-101 userInfo:@{
      NSUnderlyingErrorKey: error,
      @"message": description
  }];
}

+ (NSError *)wrapCryptoErrorWithMessage:(NSString *)descrption error:(NSError *)error {
	return [TUTErrorFactory wrapNativeErrorWithDomain:TUT_CRYPTO_ERROR message:descrption error:error];
}

@end

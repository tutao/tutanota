//
//  TUTErrorFactory.h
//  Tutanota
//
//  Created by Tutao GmbH on 28.10.16.
//
//

extern NSString *const TUT_ERROR_DOMAIN;
extern NSString *const TUT_CRYPTO_ERROR;

@interface TUTErrorFactory : NSObject

+ (NSError *)createError:(NSString*) description;
+ (NSError *)createErrorWithDomain:(NSString*) domain msg:(NSString*) description;
@end

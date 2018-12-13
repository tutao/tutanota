//
//  TUTErrorFactory.h
//  Tutanota
//
//  Created by Tutao GmbH on 28.10.16.
//
//

extern NSString *const TUT_ERROR_DOMAIN;
extern NSString *const TUT_CRYPTO_ERROR;
extern NSString *const TUT_FILEVIEWER_ERROR;

@interface TUTErrorFactory : NSObject

+ (NSError *)createError:(NSString*) description;
+ (NSError *)createErrorWithDomain:(NSString*) domain message:(NSString*) description;
+ (NSError *)wrapNativeErrorWithDomain:(NSString *)domain message:(NSString *)description error:(NSError *)error;
+ (NSError *)wrapCryptoErrorWithMessage:(NSString *)descrption error:(NSError *)error;
@end

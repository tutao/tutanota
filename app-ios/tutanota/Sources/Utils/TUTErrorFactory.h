//
//  TUTErrorFactory.h
//  Tutanota
//
//  Created by Tutao GmbH on 28.10.16.
//
//

extern NSString *const TUT_ERROR_DOMAIN;


@interface TUTErrorFactory : NSObject

+ (NSError *)createError:(NSString*) description;

@end

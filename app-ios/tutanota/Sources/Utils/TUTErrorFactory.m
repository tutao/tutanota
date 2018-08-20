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

@implementation TUTErrorFactory

+ (NSError *)createError:(NSString*) description {
	return [NSError errorWithDomain:TUT_ERROR_DOMAIN code:-101 userInfo:@{NSLocalizedDescriptionKey:description}];
}

@end

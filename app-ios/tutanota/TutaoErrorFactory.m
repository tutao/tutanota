//
//  TutaoErrorFactory.m
//  Tutanota
//
//  Created by Tutao GmbH on 28.10.16.
//
//

#import <Foundation/Foundation.h>
#include "TutaoErrorFactory.h"

NSString *const TUTAO_ERROR_DOMAIN = @"de.tutao.tutanota";

@implementation TutaoErrorFactory

+ (NSError *)createError:(NSString*) description {
	return [NSError errorWithDomain:TUTAO_ERROR_DOMAIN code:-101 userInfo:@{NSLocalizedDescriptionKey:description}];
}

@end

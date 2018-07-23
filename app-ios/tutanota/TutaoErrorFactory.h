//
//  TutaoErrorFactory.h
//  Tutanota
//
//  Created by Tutao GmbH on 28.10.16.
//
//

#ifndef TutaoErrorFactory_h
#define TutaoErrorFactory_h

extern NSString *const TUTAO_ERROR_DOMAIN;


@interface TutaoErrorFactory : NSObject

+ (NSError *)createError:(NSString*) description;

@end


#endif /* TutaoErrorFactory_h */

//
//  TUTAUtils.h
//  Tutanota
//
//  Created by Tutao GmbH on 27.10.16.
//
//

#ifndef TUTAUtils_h
#define TUTAUtils_h

#import <Cordova/CDV.h>
#import <Cordova/CDVCommandDelegate.h>

@interface TutaoUtils : NSObject

+ (void) sendErrorMessage:(NSString*)errorMessage invokedCommand:(CDVInvokedUrlCommand*)command delegate:(id<CDVCommandDelegate>) commandDelegate;
+ (void) sendErrorResult:(NSError*)error invokedCommand:(CDVInvokedUrlCommand*)command delegate:(id<CDVCommandDelegate>) commandDelegate;
+ (NSString *) translate:(NSString *) key default:(NSString*) defaultValue;

@end

#endif /* TUTAUtils_h */

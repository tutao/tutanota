//
//  TUTAUtils.h
//  Tutanota
//
//  Created by Tutao GmbH on 27.10.16.
//
//

#ifndef TUTAUtils_h
#define TUTAUtils_h

@interface TutaoUtils : NSObject

+ (void) sendErrorMessage:(NSString*)errorMessage invokedCommand:(CDVInvokedUrlCommand*)command delegate:(id<CDVCommandDelegate>) commandDelegate;
+ (void) sendErrorResult:(NSError*)error invokedCommand:(CDVInvokedUrlCommand*)command delegate:(id<CDVCommandDelegate>) commandDelegate;
+ (NSString *) translate:(NSString *) key default:(NSString*) defaultValue;
+ (UIImage *) createFontImage:(NSString*) identifier fontName:(NSString*)fontName size:(CGFloat) fontSize;

@end

#endif /* TUTAUtils_h */

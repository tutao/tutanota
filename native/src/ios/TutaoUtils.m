//
//  TUTAUtils.m
//  Tutanota
//
//  Created by Tutao GmbH on 27.10.16.
//
//

#import <Foundation/Foundation.h>
#import <Cordova/CDV.h>
#import <Cordova/CDVCommandDelegate.h>
#include "TutaoUtils.h"



@implementation TutaoUtils

+ (void) sendErrorMessage:(NSString*)errorMessage invokedCommand:(CDVInvokedUrlCommand*)command delegate:(id<CDVCommandDelegate>) commandDelegate{
    NSLog(@"error %@.\n", errorMessage);
    CDVPluginResult * pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:errorMessage];
    [commandDelegate sendPluginResult: pluginResult callbackId:command.callbackId];
}


+ (void) sendErrorResult:(NSError*)error invokedCommand:(CDVInvokedUrlCommand*)command delegate:(id<CDVCommandDelegate>) commandDelegate{
	[self sendErrorMessage: [error description] invokedCommand:command delegate: commandDelegate];
}



+ (NSString *) translate:(NSString *) key default:(NSString*) defaultValue{
	return [[NSBundle mainBundle] localizedStringForKey:key value:defaultValue table:@"InfoPlist"];
}

+ (UIImage *) createFontImage:(NSString*) identifier fontName:(NSString*)fontName size:(CGFloat) fontSize{
	CGSize size = CGSizeMake(fontSize, fontSize);
	UIFont *font = [UIFont fontWithName:fontName size:fontSize];
	NSDictionary *attributes = @{NSFontAttributeName            : font,
								 NSForegroundColorAttributeName : [UIColor blueColor],
								 NSBackgroundColorAttributeName : [UIColor clearColor]};
	UIGraphicsBeginImageContextWithOptions(size, NO, 0);
	[identifier drawInRect:CGRectMake(0, 0, size.width, size.height) withAttributes:attributes];
	UIImage * fontImage = UIGraphicsGetImageFromCurrentImageContext();
	UIGraphicsEndImageContext();
	return fontImage;
}

@end

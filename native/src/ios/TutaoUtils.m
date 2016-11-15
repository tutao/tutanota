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


@end

/*
 Copyright 2013-2014 appPlant UG

 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements.  See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership.  The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance
 with the License.  You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
 */

#import "APPBadge.h"
#import <Cordova/CDVAvailability.h>

@implementation APPBadge

#pragma mark -
#pragma mark Plugin interface methods

/**
 * Clears the badge of the app icon.
 *
 */
- (void) clearBadge:(CDVInvokedUrlCommand *)command
{
    [self.commandDelegate runInBackground:^{
        [[UIApplication sharedApplication]
         setApplicationIconBadgeNumber:0];
    }];
}

/**
 * Sets the badge of the app icon.
 *
 * @param badge
 *      The badge to be set
 */
- (void) setBadge:(CDVInvokedUrlCommand *)command
{
    NSArray* args = [command arguments];
    int number    = [[args objectAtIndex:0] intValue];

    [self.commandDelegate runInBackground:^{
        [[UIApplication sharedApplication]
         setApplicationIconBadgeNumber:number];
    }];
}

/**
 * Gets the badge of the app icon.
 *
 * @param callback
 *      The function to be exec as the callback
 */
- (void) getBadge:(CDVInvokedUrlCommand *)command
{
    [self.commandDelegate runInBackground:^{
        CDVPluginResult* result;
        long badge = [[UIApplication sharedApplication]
                      applicationIconBadgeNumber];

        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                   messageAsDouble:badge];

        [self.commandDelegate sendPluginResult:result
                                    callbackId:command.callbackId];
    }];
}

/**
 * Informs if the app has the permission to show badges.
 *
 * @param callback
 *      The function to be exec as the callback
 */
- (void) hasPermission:(CDVInvokedUrlCommand *)command
{
    [self.commandDelegate runInBackground:^{
        CDVPluginResult* result;
        BOOL hasPermission = [self hasPermissionToSetBadges];

        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                     messageAsBool:hasPermission];

        [self.commandDelegate sendPluginResult:result
                                    callbackId:command.callbackId];
    }];
}

/**
 * Ask for permission to show badges.
 *
 * @param callback
 *      The function to be exec as the callback
 */
- (void) promptForPermission:(CDVInvokedUrlCommand *)command
{
    if (IsAtLeastiOSVersion(@"8.0")) {
        UIUserNotificationSettings *settings;

        settings = [UIUserNotificationSettings settingsForTypes:UIUserNotificationTypeBadge
                                                     categories:nil];

        [self.commandDelegate runInBackground:^{
            [[UIApplication sharedApplication]
             registerUserNotificationSettings:settings];
        }];
    }
}

#pragma mark -
#pragma mark Plugin helper methods

/**
 * If the app has the permission to show badges.
 */
- (BOOL) hasPermissionToSetBadges
{
    if (IsAtLeastiOSVersion(@"8.0")) {
        UIUserNotificationSettings *settings;

        settings = [[UIApplication sharedApplication]
                    currentUserNotificationSettings];

        return (settings.types & UIUserNotificationTypeBadge);
    } else {
        return YES;
    }
}

@end

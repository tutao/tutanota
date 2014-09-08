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

@implementation APPBadge

/**
 * Clears the badge of the app icon.
 *
 */
- (void) clearBadge:(CDVInvokedUrlCommand *)command
{
    [[UIApplication sharedApplication]
     setApplicationIconBadgeNumber:0];
}

/**
 * Sets the badge of the app icon.
 *
 * @param badge
 *      The badge to be set
 */
- (void) setBadge:(CDVInvokedUrlCommand *)command
{
    NSArray* arguments = [command arguments];
    int      badge     = [[arguments objectAtIndex:0] intValue];

    [[UIApplication sharedApplication]
     setApplicationIconBadgeNumber:badge];
}

/**
 * Gets the badge of the app icon.
 *
 * @param callback
 *      The function to be exec as the callback
 */
- (void) getBadge:(CDVInvokedUrlCommand *)command
{
    CDVPluginResult* result;
    int badge = [[UIApplication sharedApplication]
                 applicationIconBadgeNumber];

    result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                 messageAsInt:badge];

    [self.commandDelegate sendPluginResult:result
                                callbackId:command.callbackId];
}

@end
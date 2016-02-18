/*
 * Copyright (c) 2013-2015 by appPlant UG. All rights reserved.
 *
 * @APPPLANT_LICENSE_HEADER_START@
 *
 * This file contains Original Code and/or Modifications of Original Code
 * as defined in and that are subject to the Apache License
 * Version 2.0 (the 'License'). You may not use this file except in
 * compliance with the License. Please obtain a copy of the License at
 * http://opensource.org/licenses/Apache-2.0/ and read it before using this
 * file.
 *
 * The Original Code and all software distributed under the License are
 * distributed on an 'AS IS' basis, WITHOUT WARRANTY OF ANY KIND, EITHER
 * EXPRESS OR IMPLIED, AND APPLE HEREBY DISCLAIMS ALL SUCH WARRANTIES,
 * INCLUDING WITHOUT LIMITATION, ANY WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE, QUIET ENJOYMENT OR NON-INFRINGEMENT.
 * Please see the License for the specific language governing rights and
 * limitations under the License.
 *
 * @APPPLANT_LICENSE_HEADER_END@
 */

#import <Foundation/Foundation.h>
#import <Cordova/CDVPlugin.h>

@interface APPLocalNotification : CDVPlugin

// Execute all queued events
- (void) deviceready:(CDVInvokedUrlCommand*)command;

// Inform if the app has the permission to show notifications
- (void) hasPermission:(CDVInvokedUrlCommand*)command;
// Register permission to show notifications
- (void) registerPermission:(CDVInvokedUrlCommand*)command;

// Schedule set of notifications
- (void) schedule:(CDVInvokedUrlCommand*)command;
// Update set of notifications
- (void) update:(CDVInvokedUrlCommand*)command;
// Cancel set of notifications
- (void) cancel:(CDVInvokedUrlCommand*)command;
// Cancel all notifications
- (void) cancelAll:(CDVInvokedUrlCommand*)command;
// Clear set of notifications
- (void) clear:(CDVInvokedUrlCommand*)command;
// Clear all notifications
- (void) clearAll:(CDVInvokedUrlCommand*)command;

// If a notification with an ID is present
- (void) isPresent:(CDVInvokedUrlCommand*)command;
// If a notification with an ID is scheduled
- (void) isScheduled:(CDVInvokedUrlCommand*)command;
// If a notification with an ID is triggered
- (void) isTriggered:(CDVInvokedUrlCommand*)command;

// List all ids from all local notifications
- (void) getAllIds:(CDVInvokedUrlCommand*)command;
// List all ids from all pending notifications
- (void) getScheduledIds:(CDVInvokedUrlCommand*)command;
// List all ids from all triggered notifications
- (void) getTriggeredIds:(CDVInvokedUrlCommand*)command;

// Propertys for given local notification
- (void) getSingle:(CDVInvokedUrlCommand*)command;
// Propertya for given scheduled notification
- (void) getSingleScheduled:(CDVInvokedUrlCommand*)command;
// Propertys for given triggered notification
- (void) getSingleTriggered:(CDVInvokedUrlCommand*)command;

// Property list for given local notifications
- (void) getAll:(CDVInvokedUrlCommand*)command;
// Property list for given scheduled notifications
- (void) getScheduled:(CDVInvokedUrlCommand*)command;
// Property list for given triggered notifications
- (void) getTriggered:(CDVInvokedUrlCommand*)command;

@end

/*
 * Copyright (c) 2013-2016 by appPlant UG. All rights reserved.
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

#import "APPAppEventDelegate.h"
#import <Foundation/Foundation.h>
#import <Cordova/CDVPlugin.h>

@interface APPBadge : CDVPlugin <APPAppEventDelegate>

// Clears the badge of the app icon
- (void) clearBadge:(CDVInvokedUrlCommand *)command;
// Sets the badge of the app icon
- (void) setBadge:(CDVInvokedUrlCommand *)command;
// Gets the badge of the app icon
- (void) getBadge:(CDVInvokedUrlCommand *)command;
// Informs if the app has the permission to show badges
- (void) hasPermission:(CDVInvokedUrlCommand *)command;
// Register permission to show badges
- (void) registerPermission:(CDVInvokedUrlCommand *)command;

@end

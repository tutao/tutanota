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

#import "UILocalNotification+APPLocalNotification.h"

@interface UIApplication (APPLocalNotification)

@property (readonly, getter=localNotifications) NSArray* localNotifications;
@property (readonly, getter=localNotificationIds) NSArray* localNotificationIds;

// If the app has the permission to schedule local notifications
- (BOOL) hasPermissionToScheduleLocalNotifications;
// Ask for permission to schedule local notifications
- (void) registerPermissionToScheduleLocalNotifications;

// List of all local notification IDs from given type
- (NSArray*) localNotificationIdsByType:(APPLocalNotificationType)type;

// If local notification with ID exists
- (BOOL) localNotificationExist:(NSNumber*)id;
// If local notification with ID and type exists
- (BOOL) localNotificationExist:(NSNumber*)id type:(APPLocalNotificationType)type;

// Local notification by ID
- (UILocalNotification*) localNotificationWithId:(NSNumber*)id;
// Local notification by ID and type
- (UILocalNotification*) localNotificationWithId:(NSNumber*)id andType:(APPLocalNotificationType)type;

// Property list from all local notifications
- (NSArray*) localNotificationOptions;
// Property list from given local notifications
- (NSArray*) localNotificationOptionsById:(NSArray*)ids;
// Property list from all local notifications with type constraint
- (NSArray*) localNotificationOptionsByType:(APPLocalNotificationType)type;
// Property list from given local notifications with type constraint
- (NSArray*) localNotificationOptionsByType:(APPLocalNotificationType)type andId:(NSArray*)ids;

// Clear single local notfications
- (void) clearLocalNotification:(UILocalNotification*)notification;
// Clear all local notfications
- (void) clearAllLocalNotifications;

@end

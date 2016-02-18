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

#import "APPLocalNotificationOptions.h"

typedef NS_ENUM(NSUInteger, APPLocalNotificationType) {
    NotifcationTypeAll = 0,
    NotifcationTypeScheduled = 1,
    NotifcationTypeTriggered = 2
};

@interface UILocalNotification (APPLocalNotification)

// Initialize a new local notification
- (id) initWithOptions:(NSDictionary*)dict;
// The options provided by the plug-in
- (APPLocalNotificationOptions*) options;
// Timeinterval since last trigger date
- (double) timeIntervalSinceLastTrigger;
// Timeinterval since fire date
- (double) timeIntervalSinceFireDate;
// If the fire date was in the past
- (BOOL) wasInThePast;
// If the notification was already scheduled
- (BOOL) isScheduled;
// If the notification was already triggered
- (BOOL) isTriggered;
// If the notification was updated
- (BOOL) wasUpdated;
// If it's a repeating notification
- (BOOL) isRepeating;
// Notifciation type
- (APPLocalNotificationType) type;
// Encode the user info dict to JSON
- (NSString*) encodeToJSON;

@end

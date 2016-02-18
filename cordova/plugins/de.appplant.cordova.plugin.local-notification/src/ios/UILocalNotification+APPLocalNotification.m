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
#import "APPLocalNotificationOptions.h"
#import <objc/runtime.h>

static char optionsKey;

NSInteger const APPLocalNotificationTypeScheduled = 1;
NSInteger const APPLocalNotificationTypeTriggered = 2;

@implementation UILocalNotification (APPLocalNotification)

#pragma mark -
#pragma mark Init

/**
 * Initialize a local notification with the given options when calling on JS side:
 * notification.local.add(options)
 */
- (id) initWithOptions:(NSDictionary*)dict
{
    self = [self init];

    [self setUserInfo:dict];
    [self __init];

    return self;
}

/**
 * Applies the given options when calling on JS side:
 * notification.local.add(options)

 */
- (void) __init
{
    APPLocalNotificationOptions* options = self.options;

    self.fireDate = options.fireDate;
    self.timeZone = [NSTimeZone defaultTimeZone];
    self.applicationIconBadgeNumber = options.badgeNumber;
    self.repeatInterval = options.repeatInterval;
    self.alertBody = options.alertBody;
    self.soundName = options.soundName;

    if ([self wasInThePast]) {
        self.fireDate = [NSDate date];
    }
}

#pragma mark -
#pragma mark Methods

/**
 * The options provided by the plug-in.
 */
- (APPLocalNotificationOptions*) options
{
    APPLocalNotificationOptions* options = [self getOptions];

    if (!options) {
        options = [[APPLocalNotificationOptions alloc]
                   initWithDict:[self userInfo]];

        [self setOptions:options];
    }

    return options;
}

/**
 * Get associated option object
 */
- (APPLocalNotificationOptions*) getOptions
{
    return objc_getAssociatedObject(self, &optionsKey);
}

/**
 * Set associated option object
 */
- (void) setOptions:(APPLocalNotificationOptions*)options
{
    objc_setAssociatedObject(self, &optionsKey,
                             options, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

/**
 * The repeating interval in seconds.
 */
- (int) repeatIntervalInSeconds
{
    switch (self.repeatInterval) {
        case NSCalendarUnitMinute:
            return 60;

        case NSCalendarUnitHour:
            return 60000;

        case NSCalendarUnitDay:
        case NSCalendarUnitWeekOfYear:
        case NSCalendarUnitMonth:
        case NSCalendarUnitYear:
            return 86400;

        default:
            return 1;
    }
}

/**
 * Timeinterval since fire date.
 */
- (double) timeIntervalSinceFireDate
{
    NSDate* now      = [NSDate date];
    NSDate* fireDate = self.fireDate;

    int timespan = [now timeIntervalSinceDate:fireDate];

    return timespan;
}

/**
 * Timeinterval since last trigger date.
 */
- (double) timeIntervalSinceLastTrigger
{
    int timespan = [self timeIntervalSinceFireDate];

    if ([self isRepeating]) {
        timespan = timespan % [self repeatIntervalInSeconds];
    }

    return timespan;
}

/**
 * Encode the user info dict to JSON.
 */
- (NSString*) encodeToJSON
{
    NSString* json;
    NSData* data;
    NSMutableDictionary* obj = [self.userInfo mutableCopy];

    [obj removeObjectForKey:@"updatedAt"];

    if (obj == NULL || obj.count == 0)
        return json;

    data = [NSJSONSerialization dataWithJSONObject:obj
                                           options:NSJSONWritingPrettyPrinted
                                             error:NULL];

    json = [[NSString alloc] initWithData:data
                                 encoding:NSUTF8StringEncoding];

    return [json stringByReplacingOccurrencesOfString:@"\n"
                                           withString:@""];
}

#pragma mark -
#pragma mark State

/**
 * If the fire date was in the past.
 */
- (BOOL) wasInThePast
{
    return [self timeIntervalSinceLastTrigger] > 0;
}

// If the notification was already scheduled
- (BOOL) isScheduled
{
    return [self isRepeating] || ![self wasInThePast];
}

/**
 * If the notification was already triggered.
 */
- (BOOL) isTriggered
{
    NSDate* now      = [NSDate date];
    NSDate* fireDate = self.fireDate;

    bool isLaterThanFireDate = !([now compare:fireDate] == NSOrderedAscending);

    return isLaterThanFireDate;
}

/**
 * If the notification was updated.
 */
- (BOOL) wasUpdated
{
    NSDate* now       = [NSDate date];
    NSDate* updatedAt = [self.userInfo objectForKey:@"updatedAt"];

    if (updatedAt == NULL)
        return NO;

    int timespan = [now timeIntervalSinceDate:updatedAt];

    return timespan < 1;
}

/**
 * If it's a repeating notification.
 */
- (BOOL) isRepeating
{
    return [self.options isRepeating];
}

/**
 * Process state type of the local notification.
 */
- (APPLocalNotificationType) type
{
    return [self isTriggered] ? NotifcationTypeTriggered : NotifcationTypeScheduled;
}

@end

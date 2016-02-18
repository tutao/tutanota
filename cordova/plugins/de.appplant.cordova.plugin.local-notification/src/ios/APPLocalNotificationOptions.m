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

// Default sound ressource path
NSString* const DEFAULT_SOUND = @"res://platform_default";

@interface APPLocalNotificationOptions ()

// The dictionary which contains all notification properties
@property(nonatomic, retain) NSDictionary* dict;

@end

@implementation APPLocalNotificationOptions

@synthesize dict;

#pragma mark -
#pragma mark Initialization

/**
 * Initialize the object with the given options when calling on JS side:
 * notification.local.add(options)
 */
- (id) initWithDict:(NSDictionary*)dictionary
{
    self = [self init];

    self.dict = dictionary;

    return self;
}

#pragma mark -
#pragma mark Attributes

/**
 * The notification's ID.
 */
- (NSNumber*) id
{
    NSInteger id = [[dict objectForKey:@"id"] integerValue];

    return [NSNumber numberWithInteger:id];
}

/**
 * The notification's title.
 */
- (NSString*) title
{
    return [dict objectForKey:@"title"];
}

/**
 * The notification's message.
 */
- (NSString*) text
{
    return [dict objectForKey:@"text"];
}

/**
 * The notification's badge number.
 */
- (NSInteger) badgeNumber
{
    return [[dict objectForKey:@"badge"] intValue];
}

#pragma mark -
#pragma mark Complex Attributes

/**
 * The notification's alert body.
 */
- (NSString*) alertBody
{
    NSString* title = [self title];
    NSString* msg = [self text];

    NSString* alertBody = msg;

    if (![self stringIsNullOrEmpty:title])
    {
        alertBody = [NSString stringWithFormat:@"%@\n%@",
                     title, msg];
    }

    return alertBody;
}

/**
 * The notification's sound path.
 */
- (NSString*) soundName
{
    NSString* path = [dict objectForKey:@"sound"];

    if ([self stringIsNullOrEmpty:path])
        return NULL;

    if ([path isEqualToString:DEFAULT_SOUND])
        return UILocalNotificationDefaultSoundName;

    if ([path hasPrefix:@"file:/"])
        return [self soundNameForAsset:path];

    if ([path hasPrefix:@"res:"])
        return [self soundNameForResource:path];

    return NULL;
}

/**
 * The notification's fire date.
 */
- (NSDate*) fireDate
{
    double timestamp = [[dict objectForKey:@"at"]
                        doubleValue];

    return [NSDate dateWithTimeIntervalSince1970:timestamp];
}

/**
 * The notification's repeat interval.
 */
- (NSCalendarUnit) repeatInterval
{
    NSString* interval = [dict objectForKey:@"every"];

    if ([self stringIsNullOrEmpty:interval]) {
        return NSCalendarUnitEra;
    }
    else if ([interval isEqualToString:@"second"]) {
        return NSCalendarUnitSecond;
    }
    else if ([interval isEqualToString:@"minute"]) {
        return NSCalendarUnitMinute;
    }
    else if ([interval isEqualToString:@"hour"]) {
        return NSCalendarUnitHour;
    }
    else if ([interval isEqualToString:@"day"]) {
        return NSCalendarUnitDay;
    }
    else if ([interval isEqualToString:@"week"]) {
        return NSCalendarUnitWeekOfYear;
    }
    else if ([interval isEqualToString:@"month"]) {
        return NSCalendarUnitMonth;
    }
    else if ([interval isEqualToString:@"quarter"]) {
        return NSCalendarUnitQuarter;
    }
    else if ([interval isEqualToString:@"year"]) {
        return NSCalendarUnitYear;
    }

    return NSCalendarUnitEra;
}

#pragma mark -
#pragma mark Methods

/**
 * The notification's user info dict.
 */
- (NSDictionary*) userInfo
{
    if ([dict objectForKey:@"updatedAt"]) {
        NSMutableDictionary* data = [dict mutableCopy];

        [data removeObjectForKey:@"updatedAt"];

        return data;
    }

    return dict;
}

/**
 * If it's a repeating notification.
 */
- (BOOL) isRepeating
{
    NSCalendarUnit interval = self.repeatInterval;

    return !(interval == NSCalendarUnitEra || interval == 0);
}

#pragma mark -
#pragma mark Helpers

/**
 * Convert relative path to valid sound name attribute.
 */
- (NSString*) soundNameForAsset:(NSString*)path
{
    return [path stringByReplacingOccurrencesOfString:@"file:/"
                                           withString:@"www"];
}

/**
 * Convert resource path to valid sound name attribute.
 */
- (NSString*) soundNameForResource:(NSString*)path
{
    return [path pathComponents].lastObject;
}

/**
 * If the string is empty.
 */
- (BOOL) stringIsNullOrEmpty:(NSString*)str
{
    if (str == (NSString*)[NSNull null])
        return YES;

    if ([str isEqualToString:@""])
        return YES;

    return NO;
}

@end

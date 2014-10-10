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

#import "APPLocalNotification.h"
#import <Cordova/CDVAvailability.h>

@interface APPLocalNotification (Private)

// Schedules a new local notification and fies the coresponding event
- (void) scheduleNotificationWithProperties:(NSMutableDictionary*)properties;
// Cancels the given local notification and fires the cancel event
- (void) cancelNotification:(UILocalNotification*)notification fireEvent:(BOOL)fireEvent;
// Cancels all local notification with are older then
- (void) cancelAllNotificationsWhichAreOlderThen:(float)seconds;
// Retrurns a key-value dictionary for repeat intervals
- (NSMutableDictionary*) repeatDict;
// Returns the userDict for a local notification
- (NSDictionary*) userDict:(NSMutableDictionary*)options;
// Creates an notification object based on the given properties
- (UILocalNotification*) notificationWithProperties:(NSMutableDictionary*)options;
// Calls the cancel or trigger event after a local notification was received
- (void) didReceiveLocalNotification:(NSNotification*)localNotification;
// Calls the cancel or trigger event after a local notification was received
- (void) didFinishLaunchingWithOptions:(NSNotification*)notification;
// Registers obervers for the following events after plugin was initialized.
- (void) pluginInitialize;
// Clears all single repeating notifications which are older then 5 days
- (void) onAppTerminate;
// Checks weather the given string is empty or not
- (BOOL) stringIsNullOrEmpty:(NSString*)str;
// Checks wether a notification with an ID is scheduled or not
- (BOOL) isNotificationScheduledWithId:(NSString*)id;
// Retrieves the local notification by its ID
- (UILocalNotification*) notificationWithId:(NSString*)id;
// Retrieves the application state
- (NSString*) applicationState;
// Retrieves all scheduled notifications
- (NSArray*) scheduledNotifications;
// Fires the given event
- (void) fireEvent:(NSString*)event id:(NSString*)id json:(NSString*)json;

@end

@interface APPLocalNotification ()

// Retrieves all scheduled notifications
@property (readonly, getter=scheduledNotifications) NSArray* scheduledNotifications;
// Retrieves the application state
@property (readonly, getter=applicationState) NSString* applicationState;
// All events will be queued until deviceready has been fired
@property (readwrite, assign) BOOL deviceready;
// Event queue
@property (readonly, nonatomic, retain) NSMutableArray* eventQueue;

@end

@implementation APPLocalNotification

@synthesize deviceready, eventQueue, applicationState, scheduledNotifications;

/**
 * Executes all queued events.
 */
- (void) deviceready:(CDVInvokedUrlCommand*)command
{
    deviceready = YES;

    for (NSString* js in eventQueue) {
        [self.commandDelegate evalJs:js];
    }

    [eventQueue removeAllObjects];
}

/**
 * Schedules a new local notification.
 *
 * @param {NSMutableDictionary} properties
 *      The properties of the notification
 */
- (void) add:(CDVInvokedUrlCommand*)command
{
    [self.commandDelegate runInBackground:^{
        NSArray* arguments = [command arguments];
        NSMutableDictionary* properties = [arguments objectAtIndex:0];

        UILocalNotification* notification;
        NSString* id = [properties objectForKey:@"id"];

        if ([self isNotificationScheduledWithId:id]) {
            notification = [self notificationWithId:id];
        }

        if (notification) {
            dispatch_after(dispatch_time(DISPATCH_TIME_NOW, 0.3 * NSEC_PER_SEC),
                           dispatch_get_main_queue(), ^{
                               [self cancelNotification:notification fireEvent:NO];
                           });
        }

        [self scheduleNotificationWithProperties:properties];
    }];
}

/**
 * Cancels a given local notification.
 *
 * @param {NSString} id
 *      The ID of the local notification
 */
- (void) cancel:(CDVInvokedUrlCommand*)command
{
    [self.commandDelegate runInBackground:^{
        NSArray* arguments = [command arguments];
        NSString* id       = [arguments objectAtIndex:0];

        UILocalNotification* notification = [self notificationWithId:id];

        if (notification) {
            [self cancelNotification:notification fireEvent:YES];
        }
    }];
}

/**
 * Cancels all currently scheduled notifications.
 */
- (void) cancelAll:(CDVInvokedUrlCommand*)command
{
    [self.commandDelegate runInBackground:^{
        NSArray* notifications = self.scheduledNotifications;

        for (UILocalNotification* notification in notifications) {
            [self cancelNotification:notification fireEvent:YES];
        }

        [[UIApplication sharedApplication]
         cancelAllLocalNotifications];

        [[UIApplication sharedApplication]
         setApplicationIconBadgeNumber:0];
    }];
}

/**
 * Checks wether a notification with an ID is scheduled.
 *
 * @param {NSString} id
 *      The ID of the notification
 * @param callback
 *      The callback function to be called with the result
 */
- (void) isScheduled:(CDVInvokedUrlCommand*)command
{
    [self.commandDelegate runInBackground:^{
        NSArray* arguments = [command arguments];
        NSString* id       = [arguments objectAtIndex:0];
        bool isScheduled   = [self isNotificationScheduledWithId:id];
        CDVPluginResult* result;

        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                     messageAsBool:isScheduled];

        [self.commandDelegate sendPluginResult:result
                                    callbackId:command.callbackId];
    }];
}

/**
 * Retrieves a list of ids from all currently pending notifications.
 *
 * @param callback
 *      The callback function to be called with the result
 */
- (void) getScheduledIds:(CDVInvokedUrlCommand*)command
{
    [self.commandDelegate runInBackground:^{
        NSArray* notifications = self.scheduledNotifications;

        NSMutableArray* scheduledIds = [[NSMutableArray alloc] init];
        CDVPluginResult* result;

        for (UILocalNotification* notification in notifications)
        {
            NSString* id = [notification.userInfo objectForKey:@"id"];

            [scheduledIds addObject:id];
        }

        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                    messageAsArray:scheduledIds];

        [self.commandDelegate sendPluginResult:result
                                    callbackId:command.callbackId];
    }];
}

/**
 * Informs if the app has the permission to show
 * badges and local notifications.
 *
 * @param callback
 *      The function to be exec as the callback
 */
- (void) hasPermission:(CDVInvokedUrlCommand *)command
{
    [self.commandDelegate runInBackground:^{
        CDVPluginResult* result;
        BOOL hasPermission = [self hasPermissionToSheduleNotifications];

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
        UIUserNotificationType types;
        UIUserNotificationSettings *settings;

        types = UIUserNotificationTypeAlert|UIUserNotificationTypeBadge|UIUserNotificationTypeSound;

        settings = [UIUserNotificationSettings settingsForTypes:types
                                                     categories:nil];

        [self.commandDelegate runInBackground:^{
            [[UIApplication sharedApplication]
             registerUserNotificationSettings:settings];
        }];
    }
}

/**
 * If the app has the permission to show badges.
 */
- (BOOL) hasPermissionToSheduleNotifications
{
    if (IsAtLeastiOSVersion(@"8.0")) {
        UIUserNotificationType types;
        UIUserNotificationSettings *settings;

        settings = [[UIApplication sharedApplication]
                    currentUserNotificationSettings];

        types = UIUserNotificationTypeAlert|UIUserNotificationTypeBadge|UIUserNotificationTypeSound;

        return (settings.types & types);
    } else {
        return YES;
    }
}

/**
 * Schedules a new local notification and fies the coresponding event.
 *
 * @param {NSMutableDictionary} properties
 *      The properties of the notification
 */
- (void) scheduleNotificationWithProperties:(NSMutableDictionary*)properties
{
    UILocalNotification* notification = [self notificationWithProperties:
                                         properties];

    NSDictionary* userInfo = notification.userInfo;
    NSString* id = [userInfo objectForKey:@"id"];
    NSString* json = [userInfo objectForKey:@"json"];

    [self fireEvent:@"add" id:id json:json];

    [[UIApplication sharedApplication]
     scheduleLocalNotification:notification];
}

/**
 * Cancels the given local notification
 * and fires the cancel event.
 *
 * @param {NSString} id
 *      The ID of the local notification
 */
- (void) cancelNotification:(UILocalNotification*)notification
                  fireEvent:(BOOL)fireEvent
{
    NSDictionary* userInfo = notification.userInfo;
    NSString* id           = [userInfo objectForKey:@"id"];
    NSString* json         = [userInfo objectForKey:@"json"];

    [[UIApplication sharedApplication]
     cancelLocalNotification:notification];

    if (fireEvent) {
        [self fireEvent:@"cancel" id:id json:json];
    }
}

/**
 * Cancels all local notification with are older then
 * a specific amount of seconds
 *
 * @param {float} seconds
 *      The time interval in seconds
 */
- (void) cancelAllNotificationsWhichAreOlderThen:(float)seconds
{
    NSDate* now = [NSDate date];

    NSArray* notifications = self.scheduledNotifications;

    for (UILocalNotification* notification in notifications)
    {
        NSDate* fireDate = notification.fireDate;
        NSTimeInterval fireDateDistance = [now timeIntervalSinceDate:
                                           fireDate];

        if (notification.repeatInterval == NSEraCalendarUnit
            && fireDateDistance > seconds) {
            [self cancelNotification:notification fireEvent:YES];
        }
    }
}

/**
 * Retrurns a key-value dictionary for repeat intervals.
 *
 * @return {NSMutableDictionary}
 */
- (NSMutableDictionary*) repeatDict
{
    NSMutableDictionary* repeatDict = [[NSMutableDictionary alloc] init];

#ifdef NSCalendarUnitHour
    [repeatDict setObject:
     [NSNumber numberWithInt:NSCalendarUnitSecond] forKey:@"secondly"];
    [repeatDict setObject:
     [NSNumber numberWithInt:NSCalendarUnitMinute] forKey:@"minutely"];
    [repeatDict setObject:
     [NSNumber numberWithInt:NSCalendarUnitHour] forKey:@"hourly"];
    [repeatDict setObject:
     [NSNumber numberWithInt:NSCalendarUnitDay] forKey:@"daily"];
    [repeatDict setObject:
     [NSNumber numberWithInt:NSWeekCalendarUnit] forKey:@"weekly"];
    [repeatDict setObject:
     [NSNumber numberWithInt:NSCalendarUnitMonth] forKey:@"monthly"];
    [repeatDict setObject:
     [NSNumber numberWithInt:NSCalendarUnitYear] forKey:@"yearly"];
#else
    [repeatDict setObject:
     [NSNumber numberWithInt:NSSecondCalendarUnit] forKey:@"secondly"];
    [repeatDict setObject:
     [NSNumber numberWithInt:NSMinuteCalendarUnit] forKey:@"minutely"];
    [repeatDict setObject:
     [NSNumber numberWithInt:NSHourCalendarUnit] forKey:@"hourly"];
    [repeatDict setObject:
     [NSNumber numberWithInt:NSDayCalendarUnit] forKey:@"daily"];
    [repeatDict setObject:
     [NSNumber numberWithInt:NSWeekCalendarUnit] forKey:@"weekly"];
    [repeatDict setObject:
     [NSNumber numberWithInt:NSMonthCalendarUnit] forKey:@"monthly"];
    [repeatDict setObject:
     [NSNumber numberWithInt:NSYearCalendarUnit] forKey:@"yearly"];
#endif

    [repeatDict setObject:
     [NSNumber numberWithInt:NSEraCalendarUnit] forKey:@""];

    return repeatDict;
}

/**
 * Returns the userDict for a local notification.
 *
 * @param {NSMutableDictionary} options
 *      The properties for the local notification
 * @return {NSDictionary}
 */
- (NSDictionary*) userDict:(NSMutableDictionary*)options
{
    NSString* id = [options objectForKey:@"id"];
    NSString* ac = [options objectForKey:@"autoCancel"];
    NSString* js = [options objectForKey:@"json"];

    return [NSDictionary dictionaryWithObjectsAndKeys:
            id, @"id", ac, @"autoCancel", js, @"json", nil];
}

/**
 * Creates an notification object based on the given properties.
 *
 * @param {NSMutableDictionary} properties
 *      The properties for the local notification
 * @return {UILocalNotification}
 */
- (UILocalNotification*) notificationWithProperties:(NSMutableDictionary*)options
{
    UILocalNotification* notification = [[UILocalNotification alloc] init];

    double timestamp = [[options objectForKey:@"date"] doubleValue];
    NSString* msg = [options objectForKey:@"message"];
    NSString* title = [options objectForKey:@"title"];
    NSString* sound = [options objectForKey:@"sound"];
    NSString* repeat = [options objectForKey:@"repeat"];
    NSInteger badge = [[options objectForKey:@"badge"] intValue];

    notification.fireDate = [NSDate dateWithTimeIntervalSince1970:timestamp];
    notification.timeZone = [NSTimeZone defaultTimeZone];
    notification.userInfo = [self userDict:options];
    notification.applicationIconBadgeNumber = badge;

    notification.repeatInterval = [[[self repeatDict] objectForKey:repeat]
                                   intValue];

    if (![self stringIsNullOrEmpty:msg])
    {
        if (![self stringIsNullOrEmpty:title]) {
            notification.alertBody = [NSString stringWithFormat:
                                      @"%@\n%@", title, msg];
        } else {
            notification.alertBody = msg;
        }
    }

    if (sound != (NSString*)[NSNull null])
    {
        if ([sound isEqualToString:@""]) {
            notification.soundName = UILocalNotificationDefaultSoundName;
        } else {
            notification.soundName = sound;
        }
    }

    return notification;
}

/**
 * Calls the cancel or trigger event after a local notification was received.
 * Cancels the local notification if autoCancel was set to true.
 */
- (void) didReceiveLocalNotification:(NSNotification*)localNotification
{
    UILocalNotification* notification = [localNotification object];

    NSDictionary* userInfo = notification.userInfo;
    NSString* id = [userInfo objectForKey:@"id"];
    NSString* json = [userInfo objectForKey:@"json"];
    BOOL autoCancel = [[userInfo objectForKey:@"autoCancel"] boolValue];

    NSDate* now = [NSDate date];
    NSDate* fireDate = notification.fireDate;
    NSTimeInterval fireDateDistance = [now timeIntervalSinceDate:fireDate];
    NSString* event = (fireDateDistance < 1) ? @"trigger" : @"click";

    if (autoCancel && [event isEqualToString:@"click"]) {
        [self cancelNotification:notification fireEvent:YES];
    }

    [self fireEvent:event id:id json:json];
}

/**
 * Calls the cancel or trigger event after a local notification was received.
 */
- (void) didFinishLaunchingWithOptions:(NSNotification*)notification
{
    NSDictionary* launchOptions = [notification userInfo];

    UILocalNotification* localNotification = [launchOptions objectForKey:
                                              UIApplicationLaunchOptionsLocalNotificationKey];

    if (localNotification) {
        [self didReceiveLocalNotification:
         [NSNotification notificationWithName:CDVLocalNotification
                                       object:localNotification]];
    }
}

/**
 * Registers obervers for the following events after plugin was initialized.
 *      didReceiveLocalNotification:
 *      didFinishLaunchingWithOptions:
 */
- (void) pluginInitialize
{
    NSNotificationCenter* notificationCenter = [NSNotificationCenter
                                                defaultCenter];

    eventQueue = [[NSMutableArray alloc] init];

    [notificationCenter addObserver:self
                           selector:@selector(didReceiveLocalNotification:)
                               name:CDVLocalNotification
                             object:nil];

    [notificationCenter addObserver:self
                           selector:@selector(didFinishLaunchingWithOptions:)
                               name:UIApplicationDidFinishLaunchingNotification
                             object:nil];
}

/**
 * Clears all single repeating notifications which are older then 5 days
 * before the app terminates.
 */
- (void) onAppTerminate
{
    [self cancelAllNotificationsWhichAreOlderThen:432000];
}

/**
 * Checks weather the given string is empty or not.
 *
 * @param {NSString} str The string to be check
 * @return {BOOL}
 */
- (BOOL) stringIsNullOrEmpty:(NSString*)str
{
    if (str == (NSString*)[NSNull null]) {
        return YES;
    }

    if ([str isEqualToString:@""]) {
        return YES;
    }

    return NO;
}

/**
 * Checks wether a notification with an ID is scheduled or not.
 *
 * @param id
 *      The ID of the notification
 * @return BOOL
 */
- (BOOL) isNotificationScheduledWithId:(NSString*)id
{
    UILocalNotification* notification = [self notificationWithId:id];

    return notification != NULL;
}

/**
 * Retrieves the local notification by its ID.
 *
 * @param {NSString} id
 *      The ID of the notification
 * @return UILocalNotification*
 */
- (UILocalNotification*) notificationWithId:(NSString*)id
{
    NSArray* notifications = self.scheduledNotifications;

    for (UILocalNotification* notification in notifications)
    {
        // TUTAO: fix for iOS 7.1
        //NSString* notId = [notification.userInfo objectForKey:@"id"];
        NSString* notId =[NSString stringWithFormat:@"%@", [notification.userInfo objectForKey:@"id"]];

        if ([notId isEqualToString:id]) {
            return notification;
        }
    }

    return NULL;
}

/**
 * Retrieves the application state
 *
 * @return {NSString}
 *      Either "background" or "foreground"
 */
- (NSString*) applicationState
{
    UIApplicationState state = [[UIApplication sharedApplication]
                                applicationState];

    bool isActive = state == UIApplicationStateActive;

    return isActive ? @"foreground" : @"background";
}

/**
 * Retrieves all scheduled notifications.
 *
 * @return {NSArray}
 *      A list of all scheduled local notifications
 */
- (NSArray*) scheduledNotifications
{
    NSMutableArray* notificationsWithoutNIL = [[NSMutableArray alloc]
                                               init];

    NSArray* notifications = [[UIApplication sharedApplication]
                              scheduledLocalNotifications];

    for (UILocalNotification* notification in notifications)
    {
        if (notification) {
            [notificationsWithoutNIL addObject:notification];
        }
    }

    return notificationsWithoutNIL;
}

/**
 * Fires the given event.
 *
 * @param {NSString} event
 *      The Name of the event
 * @param {NSString} id
 *      The ID of the notification
 * @param {NSString} json
 *      A custom (JSON) string
 */
- (void) fireEvent:(NSString*)event id:(NSString*)id json:(NSString*)json
{
    NSString* appState = self.applicationState;

    NSString* params = [NSString stringWithFormat:
                        @"\"%@\",\"%@\",\\'%@\\'",
                        id, appState, json];

    NSString* js = [NSString stringWithFormat:
                    @"setTimeout('plugin.notification.local.on%@(%@)',0)",
                    event, params];

    if (deviceready) {
        [self.commandDelegate evalJs:js];
    } else {
        [self.eventQueue addObject:js];
    }
}

@end

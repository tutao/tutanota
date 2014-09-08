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

#pragma mark -
#pragma mark Plugin interface methods

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

        NSString* id = [properties objectForKey:@"id"];

        if ([self isNotificationScheduledWithId:id]) {
            UILocalNotification* notification = [self notificationWithId:id];

            dispatch_after(dispatch_time(DISPATCH_TIME_NOW, 0.3 * NSEC_PER_SEC),
                           dispatch_get_main_queue(), ^{
                               [self cancelNotification:notification fireEvent:NO];
                           });
        }

        [self scheduleNotificationWithProperties:properties];
        [self execCallback:command];
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

        [self execCallback:command];
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

        [self execCallback:command];
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
 * Checks wether a notification with an ID was triggered.
 *
 * @param {NSString} id
 *      The ID of the notification
 * @param callback
 *      The callback function to be called with the result
 */
- (void) isTriggered:(CDVInvokedUrlCommand*)command
{
    [self.commandDelegate runInBackground:^{
        NSArray* arguments = [command arguments];
        NSString* id       = [arguments objectAtIndex:0];
        bool isTriggered   = [self isNotificationTriggeredWithId:id];
        CDVPluginResult* result;

        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                     messageAsBool:isTriggered];

        [self.commandDelegate sendPluginResult:result
                                    callbackId:command.callbackId];
    }];
}

/**
 * Retrieves a list of ids from all currently triggered notifications.
 *
 * @param callback
 *      The callback function to be called with the result
 */
- (void) getTriggeredIds:(CDVInvokedUrlCommand*)command
{
    [self.commandDelegate runInBackground:^{
        NSArray* notifications = self.scheduledNotifications;

        NSMutableArray* scheduledIds = [[NSMutableArray alloc] init];
        CDVPluginResult* result;

        for (UILocalNotification* notification in notifications)
        {
            if (![self isNotificationTriggered:notification]) {
                continue;
            }

            NSString* id = [notification.userInfo objectForKey:@"id"];

            [scheduledIds addObject:id];
        }

        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                    messageAsArray:scheduledIds];

        [self.commandDelegate sendPluginResult:result
                                    callbackId:command.callbackId];
    }];
}

#pragma mark -
#pragma mark Plugin core methods

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

        if (notification.repeatInterval == NSCalendarUnitEra
            && fireDateDistance > seconds) {
            [self cancelNotification:notification fireEvent:YES];
        }
    }
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

#pragma mark -
#pragma mark Plugin delegate and life cycle methods

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

    if ([[self applicationState] isEqualToString:@"foreground"]) {
        event = @"trigger";
    }

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

#pragma mark -
#pragma mark Plugin helper methods

/**
 * Retrurns a key-value dictionary for repeat intervals.
 *
 * @return {NSMutableDictionary}
 */
- (NSMutableDictionary*) repeatDict
{
    NSMutableDictionary* repeatDict = [[NSMutableDictionary alloc] init];

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
    [repeatDict setObject:
     [NSNumber numberWithInt:NSCalendarUnitEra] forKey:@""];

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
 * Checks wether a notification with an ID was triggered or not.
 *
 * @param id
 *      The ID of the notification
 * @return BOOL
 */
- (BOOL) isNotificationTriggeredWithId:(NSString*)id
{
    UILocalNotification* notification = [self notificationWithId:id];

    if (notification == NULL) {
        return NO;
    }

    return [self isNotificationTriggered:notification];
}

/**
 * Checks wether a notification was triggered or not.
 *
 * @param notification
 *      The notification
 * @return BOOL
 */
- (BOOL) isNotificationTriggered:(UILocalNotification*)notification
{
    NSDate* now      = [NSDate date];
    NSDate* fireDate = notification.fireDate;

    bool isLaterThanOrEqualTo = !([now compare:fireDate] == NSOrderedAscending);

    return isLaterThanOrEqualTo;
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
        NSString* notId = [notification.userInfo objectForKey:@"id"];

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

#pragma mark -
#pragma mark Plugin callback methods

/**
 * Simply invokes the callback without any parameter.
 */
- (void) execCallback:(CDVInvokedUrlCommand*)command
{
    CDVPluginResult *result = [CDVPluginResult
                               resultWithStatus:CDVCommandStatus_OK];

    [self.commandDelegate sendPluginResult:result
                                callbackId:command.callbackId];
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

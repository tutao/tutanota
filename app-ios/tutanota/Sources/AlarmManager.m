//
//  AlarmManager.m
//  tutanota
//
//  Created by Tutao GmbH on 07.06.19.
//  Copyright © 2019 Tutao GmbH. All rights reserved.
//

#import "AlarmManager.h"

#import "Swiftier.h"
#import "PSPDFFastEnumeration.h"

#import <UserNotifications/UserNotifications.h>

@implementation AlarmManager

+ (void) scheduleAlarmsFromAlarmInfos:(NSArray<NSDictionary *> *)alarmInfos completionsHandler:(void(^)(void))completionHandler {
    dispatch_group_t group = dispatch_group_create();
    
    foreach(alarmInfo, (NSArray<NSDictionary *> *) alarmInfos) {
        dispatch_group_enter(group);
        [AlarmManager scheduleLocalAlarm:alarmInfo handler: ^(NSError * _Nullable error) {
            if (error) {
                NSLog(@"schedule error %@", error);
                completionHandler();
            } else {
                NSLog(@"schedule success");
                
            }
            dispatch_group_leave(group);
        }];
        
    }
    
    dispatch_group_notify(group, dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0),^{
        completionHandler();
    });
}

+ (void) scheduleLocalAlarm:(NSDictionary*)alarmInfo handler:(nullable void(^)(NSError *__nullable error))completionHandler {
    NSLog(@"Alarm info: %@", alarmInfo);
    NSString *identifier = alarmInfo[@"identifier"];
    let notificationCenter = UNUserNotificationCenter.currentNotificationCenter;
    
    if ([@"0" isEqualToString:alarmInfo[@"operation"]] ) { // create
        let trigger = ((NSString *) alarmInfo[@"trigger"]).longLongValue;
        let date = [NSDate dateWithTimeIntervalSince1970:trigger / 1000];
        unsigned unitFlags = NSCalendarUnitYear | NSCalendarUnitMonth | NSCalendarUnitDay | NSCalendarUnitHour | NSCalendarUnitMinute;
        
        let cal = [NSCalendar currentCalendar];
        let dateComponents = [cal components:unitFlags fromDate:date];
        let notificationTrigger = [UNCalendarNotificationTrigger triggerWithDateMatchingComponents:dateComponents repeats:NO];
        
        let content = [UNMutableNotificationContent new];
        content.title = @"Reminder";
        content.body = @"Tutanota calendar event";
        content.sound = [UNNotificationSound defaultSound];
        
        // Create the request
        let request = [UNNotificationRequest requestWithIdentifier:identifier content:content trigger:notificationTrigger];
        
        // Schedule the request with the system.
        NSLog(@"Scheduling a notification %@ at: %@", identifier, dateComponents);
        [notificationCenter addNotificationRequest:request withCompletionHandler:completionHandler];
    } else if( [@"2" isEqualToString:alarmInfo[@"operation"]] ) { // delete
        NSLog(@"Cancelling a notification %@", identifier);
        [notificationCenter removePendingNotificationRequestsWithIdentifiers:@[identifier]];
        completionHandler(nil);
    }
}
                         
@end

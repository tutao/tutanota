//
//  TUTUserPreferenceFacade.m
//  tutanota
//
//  Created by Tutao GmbH on 07.06.19.
//  Copyright © 2019 Tutao GmbH. All rights reserved.
//

#import "TUTUserPreferenceFacade.h"

#import "Swiftier.h"
#import "PSPDFFastEnumeration.h"

NSString *const SSE_INFO_KEY = @"sseInfo";
NSString *const REPEATING_ALARM_NOTIFICATION_KEY = @"repeatingAlarmNotification";

@implementation TUTUserPreferenceFacade

- (TUTSseInfo * _Nullable)getSseInfo {
    var dict = [NSUserDefaults.standardUserDefaults dictionaryForKey:SSE_INFO_KEY];
    if (!dict) {
        return nil;
    }
    return [[TUTSseInfo alloc] initWithDict:dict];
}

- (void)storeSseInfoWithPushIdentifier:(NSString *)pushIdentifier userId:(NSString *)userId sseOrign:(NSString *)sseOrigin {
    var sseInfo = self.getSseInfo;
    if (!sseInfo) {
        sseInfo = [TUTSseInfo new];
        sseInfo.pushIdentifier = pushIdentifier;
        sseInfo.userIds = @[userId];
        sseInfo.sseOrigin = sseOrigin;
    } else {
        sseInfo.pushIdentifier = pushIdentifier;
        sseInfo.sseOrigin = sseOrigin;
        NSMutableArray *userIds = sseInfo.userIds.mutableCopy;
        if (![userIds containsObject:userId]) {
            [userIds addObject:userId];
        }
        sseInfo.userIds = userIds;
    }
    [NSUserDefaults.standardUserDefaults setObject:sseInfo.toDict forKey:SSE_INFO_KEY];
}

-(void)storeRepeatingAlarmNotifications:(NSArray<TUTAlarmNotification *> *)alarmNotifications {
    NSMutableArray<NSDictionary *> *notificationsJson = [NSMutableArray new];
    foreach(notification, alarmNotifications) {
        [notificationsJson addObject:notification.jsonDict];
    }
    let jsonData = [NSJSONSerialization dataWithJSONObject:notificationsJson options:0 error:nil];
    [NSUserDefaults.standardUserDefaults setObject:jsonData forKey:REPEATING_ALARM_NOTIFICATION_KEY];
}

-(NSMutableArray<TUTAlarmNotification *> *)getRepeatingAlarmNotifications {
    let defaults = NSUserDefaults.standardUserDefaults;
    NSData *notificationsJsonData = [defaults objectForKey:REPEATING_ALARM_NOTIFICATION_KEY];
    NSMutableArray<TUTAlarmNotification *> * notifications = [NSMutableArray new];
    if (notificationsJsonData) {
        NSMutableArray<NSDictionary *> *_Nullable notificationsJson = [NSJSONSerialization JSONObjectWithData:notificationsJsonData options:0 error:nil];
        
        foreach(notificationDict, notificationsJson) {
            [notifications addObject:[TUTAlarmNotification fromJSON:notificationDict]];
        }
    }
    return notifications;
}

-(void)setLastProcessedNotificationId:(NSString *)lastProcessedNotificationId {
    return [NSUserDefaults.standardUserDefaults setValue:lastProcessedNotificationId
                                                  forKey:@"lastProcessedNotificationId"
            ];
}

-(NSString *)lastProcessedNotificationId {
    return [NSUserDefaults.standardUserDefaults stringForKey:@"lastProcessedNotificationId"];
}

@end

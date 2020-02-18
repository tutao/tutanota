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
#import "TUTLog.h"

NSString *const SSE_INFO_KEY = @"sseInfo";
NSString *const ALARMS_KEY = @"repeatingAlarmNotification";
NSString *const LAST_PROCESSED_NOTIFICAION_ID_KEY = @"lastProcessedNotificationId";
NSString *const LAST_MISSED_NOTIFICATION_CHECK_TIME = @"lastMissedNotificationCheckTime";

@implementation TUTUserPreferenceFacade

- (TUTSseInfo *_Nullable)sseInfo {
    var dict = [NSUserDefaults.standardUserDefaults dictionaryForKey:SSE_INFO_KEY];
    if (!dict) {
        return nil;
    }
    return [[TUTSseInfo alloc] initWithDict:dict];
}

- (void)clear {
    TUTLog(@"UserPreference clear");
    let sseInfo = self.sseInfo;
    sseInfo.userIds = @[];
    [self putSseInfo:sseInfo];
    self.lastMissedNotificationCheckTime = nil;
    [self storeAlarms:@[]];
    // We want to keep the lastProcessedNotificationId to not request old notifications
}

- (void)storeSseInfoWithPushIdentifier:(NSString *)pushIdentifier userId:(NSString *)userId sseOrign:(NSString *)sseOrigin {
    var sseInfo = self.sseInfo;
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
    [self putSseInfo:sseInfo];
}

-(void)putSseInfo:(TUTSseInfo *)sseInfo {
    [NSUserDefaults.standardUserDefaults setObject:sseInfo.toDict forKey:SSE_INFO_KEY];
}

-(void)storeAlarms:(NSArray<TUTAlarmNotification *> *)alarmNotifications {
    NSMutableArray<NSDictionary *> *notificationsJson = [NSMutableArray new];
    foreach(notification, alarmNotifications) {
        [notificationsJson addObject:notification.jsonDict];
    }
    let jsonData = [NSJSONSerialization dataWithJSONObject:notificationsJson options:0 error:nil];
    [NSUserDefaults.standardUserDefaults setObject:jsonData forKey:ALARMS_KEY];
}

-(NSMutableArray<TUTAlarmNotification *> *)alarms {
    let defaults = NSUserDefaults.standardUserDefaults;
    NSData *notificationsJsonData = [defaults objectForKey:ALARMS_KEY];
    NSMutableArray<TUTAlarmNotification *> * notifications = [NSMutableArray new];
    if (notificationsJsonData) {
        NSMutableArray<NSDictionary *> *_Nullable notificationsJson = [NSJSONSerialization JSONObjectWithData:notificationsJsonData options:0 error:nil];
        
        foreach(notificationDict, notificationsJson) {
            [notifications addObject:[TUTAlarmNotification fromJSON:notificationDict]];
        }
    }
    return notifications;
}

-(NSString *)lastProcessedNotificationId {
    return [NSUserDefaults.standardUserDefaults stringForKey:LAST_PROCESSED_NOTIFICAION_ID_KEY];
}

-(void)setLastProcessedNotificationId:(NSString *)lastProcessedNotificationId {
    return [NSUserDefaults.standardUserDefaults setValue:lastProcessedNotificationId
                                                  forKey:LAST_PROCESSED_NOTIFICAION_ID_KEY
            ];
}

-(NSDate *_Nullable)lastMissedNotificationCheckTime {
    return [NSUserDefaults.standardUserDefaults objectForKey:LAST_MISSED_NOTIFICATION_CHECK_TIME];
}

- (void)setLastMissedNotificationCheckTime:(NSDate *_Nullable)lastMissedNotificationCheckTime {
    [NSUserDefaults.standardUserDefaults setValue:lastMissedNotificationCheckTime forKey:LAST_MISSED_NOTIFICATION_CHECK_TIME];
}

@end

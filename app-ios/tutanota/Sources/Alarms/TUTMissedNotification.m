//
//  TUTNotificationMessage.m
//  tutanota
//
//  Created by Tutao GmbH on 17.06.19.
//  Copyright © 2019 Tutao GmbH. All rights reserved.
//

#import "TUTMissedNotification.h"
#import "TUTAlarmNotification.h"

#import "../Utils/Swiftier.h"
#import "../Utils/PSPDFFastEnumeration.h"

@implementation TUTMissedNotification

- (TUTMissedNotification *)initWithalarmNotifications:(NSArray<TUTAlarmNotification *> *)alarmNotifications
                          lastProcessedNotificationId:(NSString *)lastProcessedNotificationId {
    self = [super init];
    _alarmNotifications = alarmNotifications;
    _lastProcessedNotificationId = lastProcessedNotificationId;
    return self;
}

+(TUTMissedNotification *)fromJSON:(NSDictionary *)jsonDict{
    NSArray<NSDictionary *> *notificationsJson = jsonDict[@"alarmNotifications"];
    NSMutableArray<TUTAlarmNotification *> *notifications = [NSMutableArray new];
    foreach(notification, notificationsJson) {
        [notifications addObject:[TUTAlarmNotification fromJSON:notification]];
    }
    NSString *lastProcessedNotificationId = jsonDict[@"lastProcessedNotificationId"];
    return [[TUTMissedNotification alloc] initWithalarmNotifications:notifications
                                         lastProcessedNotificationId:lastProcessedNotificationId];
}

@end

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

- (TUTMissedNotification *)initWithConfirmationId:(NSString *) confirmationId alarmNotifications:(NSArray<TUTAlarmNotification *> *) alarmNotifications {
    self = [super init];
    _confirmationId = confirmationId;
    _alarmNotifications = alarmNotifications;
    return self;
}

+(TUTMissedNotification *)fromJSON:(NSDictionary *)jsonDict{
    NSArray<NSDictionary *> *notificationsJson = jsonDict[@"alarmNotifications"];
    NSMutableArray<TUTAlarmNotification *> *notifications = [NSMutableArray new];
    foreach(notification, notificationsJson) {
        [notifications addObject:[TUTAlarmNotification fromJSON:notification]];
    }
    return [[TUTMissedNotification alloc] initWithConfirmationId: jsonDict[@"confirmationId"] alarmNotifications:notifications];
}

@end

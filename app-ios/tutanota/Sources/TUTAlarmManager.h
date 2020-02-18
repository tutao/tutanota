//
//  TUTAlarmManager.h
//  tutanota
//
//  Created by Tutao GmbH on 07.06.19.
//  Copyright © 2019 Tutao GmbH. All rights reserved.
//

#import <Foundation/Foundation.h>

#import "Utils/TUTSseInfo.h"
#import "Utils/TUTUserPreferenceFacade.h"
#import "Alarms/TUTMissedNotification.h"

NS_ASSUME_NONNULL_BEGIN

@interface TUTAlarmManager : NSObject
- (instancetype) initWithUserPreferences:(TUTUserPreferenceFacade *)userPref;
- (void)fetchMissedNotifications:(void(^)(NSError *))completionHandler;
- (void)rescheduleEvents;
- (BOOL)hasNotificationTTLExpired;
- (void)resetStoredState;

@end

NS_ASSUME_NONNULL_END

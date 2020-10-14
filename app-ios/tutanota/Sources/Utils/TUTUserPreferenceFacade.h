//
//  TUTUserPreferenceFacade.h
//  tutanota
//
//  Created by Tutao GmbH on 07.06.19.
//  Copyright © 2019 Tutao GmbH. GPL-3.0-only.
//

#import <Foundation/Foundation.h>

#import "TUTSseInfo.h"
#import "../Alarms/TUTAlarmNotification.h"

NS_ASSUME_NONNULL_BEGIN

@interface TUTUserPreferenceFacade : NSObject
- (TUTSseInfo * _Nullable)sseInfo;
- (void)storeSseInfoWithPushIdentifier:(NSString *)pushIdentifier userId:(NSString *)userId sseOrign:(NSString *)sseOrigin;
- (void)storeAlarms:(NSArray<TUTAlarmNotification *> *)alarmNotifications;
- (NSMutableArray<TUTAlarmNotification *> *)alarms;
- (void)clear;
@property (nonatomic, nullable) NSString *lastProcessedNotificationId;
@property (nonatomic, nullable) NSDate *lastMissedNotificationCheckTime;
@end

NS_ASSUME_NONNULL_END

//
//  TUTUserPreferenceFacade.h
//  tutanota
//
//  Created by Tutao GmbH on 07.06.19.
//  Copyright © 2019 Tutao GmbH. All rights reserved.
//

#import <Foundation/Foundation.h>

#import "TUTSseInfo.h"
#import "../Alarms/TUTAlarmNotification.h"

NS_ASSUME_NONNULL_BEGIN

@interface TUTUserPreferenceFacade : NSObject
- (TUTSseInfo * _Nullable)getSseInfo;
- (void)storeSseInfoWithPushIdentifier:(NSString *)pushIdentifier userId:(NSString *)userId sseOrign:(NSString *)sseOrigin;
-(void)storeRepeatingAlarmNotifications:(NSArray<TUTAlarmNotification *> *)alarmNotifications;
-(NSMutableArray<TUTAlarmNotification *> *)getRepeatingAlarmNotifications;
@end

NS_ASSUME_NONNULL_END

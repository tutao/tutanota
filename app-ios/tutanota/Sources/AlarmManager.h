//
//  AlarmManager.h
//  tutanota
//
//  Created by Tutao GmbH on 07.06.19.
//  Copyright © 2019 Tutao GmbH. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface AlarmManager : NSObject
+ (void) scheduleAlarmsFromAlarmInfos:(NSArray<NSDictionary *> *)alarmInfos completionsHandler:(void(^)(void))completionHandler;
@end

NS_ASSUME_NONNULL_END

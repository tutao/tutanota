//
//  TUTAlarmModel.h
//  tutanota
//
//  Created by Tutao GmbH on 28.06.19.
//  Copyright © 2019 Tutao GmbH. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "TUTRepeatRule.h"

NS_ASSUME_NONNULL_BEGIN

@interface TUTAlarmModel : NSObject

+(void)iterateRepeatingAlarmWithNow:(NSDate *)now
                           timeZone:(NSString *)timeZoneName
                         eventStart:(NSDate *)eventStart
                           eventEnd:(NSDate *)eventEnd
                      repeatPerioud:(TUTRepeatPeriod)repeatPeriod
                           interval:(NSInteger)interval
                            endType:(TUTRepeatEndType)endType
                           endValue:(NSInteger)endValue
                            trigger:(NSString *)trigger
                      localTimeZone:(NSTimeZone *)localtimeZone
                      scheduleAhead:(NSInteger)scheduleAhead
                              block:(void(^)(NSDate *alarmtime, int occurrence, NSDate *occurrencetime))block;

+ (NSDate *)alarmTimeWithTrigger:(NSString*)alarmTrigger eventTime:(NSDate *)eventTime;

+(NSDate *)allDayDateUTC:(NSDate *)localDate;
+(NSDate *)allDayDateLocal:(NSDate *)utcDate;
@end

NS_ASSUME_NONNULL_END

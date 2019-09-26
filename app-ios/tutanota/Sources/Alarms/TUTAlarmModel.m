//
//  TUTAlarmModel.m
//  tutanota
//
//  Created by Tutao GmbH on 28.06.19.
//  Copyright © 2019 Tutao GmbH. All rights reserved.
//

#import "TUTAlarmModel.h"
#import "../Utils/Swiftier.h"
#import "../Utils/TUTLog.h"

@implementation TUTAlarmModel
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
                               block:(void(^)(NSDate *alarmtime, int occurrence, NSDate *occurrencetime))block {
    var occurrences = 0;
    var occurrencesAfterNow = 0;
    let cal = NSCalendar.currentCalendar;
    let calendarUnit = [TUTAlarmModel calendarUnitForRepeatPeriod:repeatPeriod];
    
    let isAllDayEvent = [TUTAlarmModel isAllDayEvenByTimes:eventStart:eventEnd];
    let calcEventStart = isAllDayEvent ? [TUTAlarmModel allDayDateLocal:eventStart] : eventStart;
    let endDate = endType == TUTRepeatEndTypeUntilDate
    ? isAllDayEvent
    ? [TUTAlarmModel allDayDateLocal:[NSDate dateWithTimeIntervalSince1970:endValue / 1000]]
    : [NSDate dateWithTimeIntervalSince1970:endValue / 1000]
    : nil;
    
    cal.timeZone = isAllDayEvent ? localtimeZone : [NSTimeZone timeZoneWithName:timeZoneName];
    
    while (occurrencesAfterNow < scheduleAhead &&
           (endType != TUTRepeatEndTypeCount || occurrences < endValue)) {
        let occurrenceDate = [cal dateByAddingUnit:calendarUnit value:interval * occurrences toDate:calcEventStart options:0];
        let alarmDate = [TUTAlarmModel alarmTimeWithTrigger:trigger eventTime:occurrenceDate];
        if (endDate != nil && [occurrenceDate compare:endDate] != NSOrderedAscending) {
            break;
        } else if ([now compare:alarmDate] != NSOrderedDescending) { // Only schedule alarms in the future
            block(alarmDate, occurrences, occurrenceDate);
            occurrencesAfterNow++;
        }
        occurrences++;
    }
}

+(NSCalendarUnit)calendarUnitForRepeatPeriod:(TUTRepeatPeriod)repeatPeriod {
    switch (repeatPeriod) {
        case TUTRepeatPeriodDaily:
            return NSCalendarUnitDay;
        case TUTRepeatPeriodWeekly:
            return NSCalendarUnitWeekOfYear;
        case TUTRepeatPeriodMonthly:
            return NSCalendarUnitMonth;
        case TUTRepeatPeriodAnnually:
            return NSCalendarUnitYear;
        default:
            TUTLog(@"Did not find repeat period: %zd", repeatPeriod);
            return NSCalendarUnitDay;
            break;
    }
}

+ (NSDate *)alarmTimeWithTrigger:(NSString*)alarmTrigger eventTime:(NSDate *)eventTime {
    let cal = [NSCalendar currentCalendar];
    if( [@"5M" isEqualToString:alarmTrigger]){
        return [cal dateByAddingUnit:NSCalendarUnitMinute value:-5 toDate:eventTime options:0];
    } else if( [@"10M" isEqualToString:alarmTrigger] ){
        return [cal dateByAddingUnit:NSCalendarUnitMinute value:-10 toDate:eventTime options:0];
    } else if([@"30M"isEqualToString:alarmTrigger]){
        return [cal dateByAddingUnit:NSCalendarUnitMinute value:-30 toDate:eventTime options:0];
    } else if([@"1H" isEqualToString:alarmTrigger]){
        return [cal dateByAddingUnit:NSCalendarUnitHour value:-1 toDate:eventTime options:0];
    } else if([@"1D" isEqualToString:alarmTrigger]){
        return [cal dateByAddingUnit:NSCalendarUnitDay value:-1 toDate:eventTime options:0];
    } else if([@"2D"isEqualToString:alarmTrigger]){
        return [cal dateByAddingUnit:NSCalendarUnitDay value:-2 toDate:eventTime options:0];
    } else if([@"3D"isEqualToString:alarmTrigger]){
        return [cal dateByAddingUnit:NSCalendarUnitDay value:-3 toDate:eventTime options:0];
    } else if([@"1W"isEqualToString:alarmTrigger]){
        return [cal dateByAddingUnit:NSCalendarUnitWeekOfYear value:-1 toDate:eventTime options:0];
    } else {
        return eventTime;
    }
}

+(NSDate *)allDayDateUTC:(NSDate *)localDate {
    let calendar = NSCalendar.currentCalendar;
    let localComponents = [calendar components:(NSCalendarUnitYear | NSCalendarUnitMonth | NSCalendarUnitDay) fromDate:localDate];
    let timeZone = [NSTimeZone timeZoneWithName:@"UTC"];
    localComponents.timeZone = timeZone;
    return [calendar dateFromComponents:localComponents];
}

+(NSDate *)allDayDateLocal:(NSDate *)utcDate {
    let calendar = NSCalendar.currentCalendar;
    let timeZone = [NSTimeZone timeZoneWithName:@"UTC"];
    calendar.timeZone = timeZone;
    let components = [calendar components:(NSCalendarUnitYear | NSCalendarUnitMonth | NSCalendarUnitDay) fromDate:utcDate];
    calendar.timeZone = NSTimeZone.localTimeZone;
    return [calendar dateFromComponents:components];
}

+(BOOL)isAllDayEvenByTimes:(NSDate *)startTime :(NSDate *)endTime {
    let calendar = NSCalendar.currentCalendar;
    calendar.timeZone = [NSTimeZone timeZoneWithName:@"UTC"];
    let componentUnits = (NSCalendarUnitHour | NSCalendarUnitMinute | NSCalendarUnitSecond);
    let startComponents = [calendar components:componentUnits fromDate:startTime];
    BOOL passesForStart = startComponents.hour == 0 && startComponents.minute == 0 && startComponents.second == 0;
    let endComponents = [calendar components:componentUnits
                                    fromDate:endTime];
    BOOL passedForEnd = endComponents.hour == 0 && endComponents.minute == 0 && endComponents.second == 0;
    return passesForStart && passedForEnd;
}
@end

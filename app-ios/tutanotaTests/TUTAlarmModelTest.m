//
//  TUTAlarmManagerTest.m
//  tutanotaTests
//
//  Created by Tutao GmbH on 28.06.19.
//  Copyright © 2019 Tutao GmbH. All rights reserved.
//

#import <XCTest/XCTest.h>
#import "../tutanota/Sources/Alarms/TUTAlarmModel.h"
#import "Swiftier.h"

@interface TUTAlarmModelTest : XCTestCase

@end

@implementation TUTAlarmModelTest

- (void)setUp {
    // Put setup code here. This method is called before the invocation of each test method in the class.
}

- (void)tearDown {
    // Put teardown code here. This method is called after the invocation of each test method in the class.
}

- (void)testIteratesRepeatAlarm {
    let timeZone = @"Europe/Berlin";
    let now = [self getDate:2019:6:2:0:timeZone];
    let eventStart = [self getDate:2019:6:2:12:timeZone];
    let eventEnd = [self getDate:2019:6:2:12:timeZone];
    NSMutableArray<NSDate *> *occurrences = [NSMutableArray new];
    let trigger = @"1H";
    
    [TUTAlarmModel iterateRepeatingAlarmWithNow:now
                                        timeZone:timeZone
                                      eventStart:eventStart
                                       eventEnd:eventEnd
                                   repeatPerioud:TUTRepeatPeriodWeekly
                                        interval:1
                                         endType:TUTRepeatEndTypeNever
                                        endValue:0
                                         trigger:trigger
                                  localTimeZone:[NSTimeZone timeZoneWithName:timeZone]
                                   scheduleAhead:4
                                          block:^(NSDate * _Nonnull time, int occurrence, NSDate * _Nonnull occurrencetime) {
                                       [occurrences addObject:time];
                                   }];
    
    let expected = @[
                     [self getDate:2019:6:2:11:timeZone],
                     [self getDate:2019:6:9:11:timeZone],
                     [self getDate:2019:6:16:11:timeZone],
                     [self getDate:2019:6:23:11:timeZone]
                     ];
    
    XCTAssertEqualObjects(occurrences, expected);
    
}

-(void)testIteratesAllDayEvenWithEnd {
    let timeZone = @"Europe/Berlin";
    let repeatRuleTimeZone = @"Asia/Anadyr";
    let now = [self getDate:2019:5:1:0:timeZone];
    let eventStart = [TUTAlarmModel allDayDateUTC:[self getDate:2019:5:2:0:timeZone]];
    let eventEnd = [TUTAlarmModel allDayDateUTC:[self getDate:2019:5:3:0:timeZone]];
    let repeatEnd = [TUTAlarmModel allDayDateUTC:[self getDate:2019:5:4:0:timeZone]];
    let trigger = @"1D";
    
    NSMutableArray<NSDate *> *occurrences = [NSMutableArray new];
    
    
    [TUTAlarmModel iterateRepeatingAlarmWithNow:now
                                       timeZone:repeatRuleTimeZone
                                     eventStart:eventStart
                                       eventEnd:eventEnd
                                  repeatPerioud:TUTRepeatPeriodDaily
                                       interval:1
                                        endType:TUTRepeatEndTypeUntilDate
                                       endValue:repeatEnd.timeIntervalSince1970 * 1000
                                        trigger:trigger
                                  localTimeZone:[NSTimeZone timeZoneWithName:timeZone]
                                  scheduleAhead:4
                                          block:^(NSDate * _Nonnull time, int occurrence, NSDate * _Nonnull occurrencetime) {
                                      [occurrences addObject:time];
                                  }];
    
    let expected = @[
                     [self getDate:2019:5:1:0:timeZone],
                     [self getDate:2019:5:2:0:timeZone],
                     ];
    
    XCTAssertEqualObjects(occurrences, expected);
}

-(NSDate *)getDate:(int)year :(int)month :(int)day :(int)hour :(NSString *)timeZoneName {
    let calendar = NSCalendar.currentCalendar;
    let components = [NSDateComponents new];
    let timeZone = [NSTimeZone timeZoneWithName:timeZoneName];
    [components setYear:year];
    [components setMonth:month];
    [components setDay:day];
    [components setHour:hour];
    [components setTimeZone:timeZone];
    return [calendar dateFromComponents:components];
}

@end

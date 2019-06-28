//
//  TUTAlarmManagerTest.m
//  tutanotaTests
//
//  Created by Tutao GmbH on 28.06.19.
//  Copyright © 2019 Tutao GmbH. All rights reserved.
//

#import <XCTest/XCTest.h>
#import "../tutanota/Sources/TUTAlarmManager.h"
#import "../tutanota/Sources/Utils/Swiftier.h"

@interface TUTAlarmModel : XCTestCase

@end

@implementation TUTAlarmModel

- (void)setUp {
    // Put setup code here. This method is called before the invocation of each test method in the class.
}

- (void)tearDown {
    // Put teardown code here. This method is called after the invocation of each test method in the class.
}

- (void)testExample {
    
    /*
     const timeZone = 'Europe/Berlin'
     o("iterates", function () {
     const now = DateTime.fromObject({year: 2019, month: 5, day: 2, zone: timeZone}).toJSDate()
     const eventStart = DateTime.fromObject({year: 2019, month: 5, day: 2, hour: 12, zone: timeZone}).toJSDate()
     const occurrences = []
     iterateEventOccurrences(now, timeZone, eventStart, RepeatPeriod.WEEKLY, 1, EndType.Never, 0, AlarmInterval.ONE_HOUR, (time) => {
     occurrences.push(time)
     })
     
     o(occurrences.slice(0, 4)).deepEquals([
     DateTime.fromObject({year: 2019, month: 5, day: 2, hour: 11, zone: timeZone}).toJSDate(),
     DateTime.fromObject({year: 2019, month: 5, day: 9, hour: 11, zone: timeZone}).toJSDate(),
     DateTime.fromObject({year: 2019, month: 5, day: 16, hour: 11, zone: timeZone}).toJSDate(),
     DateTime.fromObject({year: 2019, month: 5, day: 23, hour: 11, zone: timeZone}).toJSDate()
     ])
     })
     */
    let timeZone = @"Europe/Berlin";
    let now = [self getDate:2019:6:2:0:timeZone];
    let eventStart = [self getDate:2019:6:2:12:timeZone];
    NSMutableArray<NSDate *> *occurrences = [NSMutableArray new];
    let trigger = @"1H";
    
    let utcTimeZone = [NSTimeZone timeZoneWithName:@"UTC"];
    let utcComponents = [NSCalendar.currentCalendar componentsInTimeZone:utcTimeZone fromDate:eventStart];
    let date = [NSCalendar.currentCalendar dateFromComponents:utcComponents];
    NSLog(@"utcComponents %@", date);
}

-(NSDate *)getDate:(int)year :(int)month :(int)day :(int)hour :(NSString *)timeZoneName {
    let calendar = NSCalendar.currentCalendar;
    let components = [NSDateComponents new];
    let timeZone = [NSTimeZone timeZoneWithName:timeZoneName];
    [components setYear:year];
    [components setMonth:month];
    [components setDay:day];
    [components setTimeZone:timeZone];
    return [calendar dateFromComponents:components];
}

@end

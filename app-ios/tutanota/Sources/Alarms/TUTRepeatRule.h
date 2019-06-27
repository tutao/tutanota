//
//  TUTRepeatRule.h
//  tutanota
//
//  Created by Tutao GmbH on 18.06.19.
//  Copyright © 2019 Tutao GmbH. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, TUTRepeatPeriod) {
    TUTRepeatPeriodDaily,
    TUTRepeatPeriodWeekly,
    TUTRepeatPeriodMonthly,
    TUTRepeatPeriodAnnually
};

typedef NS_ENUM(NSInteger, TUTRepeatEndType) {
    TUTRepeatEndTypeNever,
    TUTRepeatEndTypeCount,
    TUTRepeatEndTypeUntilDate
};

@interface TUTRepeatRule : NSObject
@property (readonly, nonnull) NSString *frequency;
@property (readonly, nonnull) NSString *interval;
@property (readonly, nonnull) NSString *timeZone;
@property (readonly, nullable) NSString *endtype;
@property (readonly, nullable) NSString *endValue;

+(instancetype)fromJSON:(NSDictionary<NSString *, id> *)jsonDict;

-(TUTRepeatPeriod) getFrequencyDec:(NSData *)sessionKey error:(NSError**) error;
-(NSInteger) getIntervalDec:(NSData *)sessionKey error:(NSError**) error;
-(NSString *) getTimezoneDec:(NSData *)sessionKey error:(NSError**) error;
-(TUTRepeatEndType) getEndTypeDec:(NSData *)sessionKey error:(NSError**) error;
-(long long) getEndValueDec:(NSData *)sessionKey error:(NSError**) error;

@end

NS_ASSUME_NONNULL_END

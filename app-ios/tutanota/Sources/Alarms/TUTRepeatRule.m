//
//  TUTRepeatRule.m
//  tutanota
//
//  Created by Tutao GmbH on 18.06.19.
//  Copyright © 2019 Tutao GmbH. All rights reserved.
//

#import "TUTRepeatRule.h"

#import "../Utils/PSPDFFastEnumeration.h"
#import "../Utils/Swiftier.h"
#import "../Utils/TUTErrorFactory.h"
#import "../Crypto/TUTAes128Facade.h"

@implementation TUTRepeatRule

- (instancetype)initWithFrequency:(NSString *)frequency
                         interval:(NSString *)interval
                         timeZone:(NSString *)timeZone
                          endtype:(NSString *_Nullable)endtype
                         endValue:(NSString *_Nullable)endValue
{
    self = [super init];
    _frequency = frequency;
    _interval = interval;
    _timeZone = timeZone;
    _endtype = endtype;
    _endValue = endValue;
    return self;
}

+(instancetype)fromJSON:(NSDictionary<NSString *, id> *)jsonDict {
    return  [[TUTRepeatRule alloc] initWithFrequency:jsonDict[@"frequency"]
                                            interval:jsonDict[@"interval"]
                                            timeZone:jsonDict[@"timeZone"]
                                             endtype:jsonDict[@"endType"]
                                            endValue:jsonDict[@"endValue"]];
}

-(TUTRepeatPeriod) getFrequencyDec:(NSData *)sessionKey error:(NSError**) error {
    var decValue = [TUTAes128Facade decryptBase64String:_frequency encryptionKey:sessionKey error:error];
    let intValue = decValue.integerValue;
    if (intValue < TUTRepeatPeriodDaily || intValue > TUTRepeatPeriodAnnually) {
        *error = [TUTErrorFactory createError:
                  [NSString stringWithFormat:@"Unknown repeat period: %@", decValue]];
    }
    return intValue;
}

-(NSInteger) getIntervalDec:(NSData *)sessionKey error:(NSError**) error {
    var decValue = [TUTAes128Facade decryptBase64String:_interval encryptionKey:sessionKey error:error];
    return decValue.integerValue;
}

-(NSString *) getTimezoneDec:(NSData *)sessionKey error:(NSError**) error {
    return  [TUTAes128Facade decryptBase64String:_timeZone encryptionKey:sessionKey error:error];
}

-(TUTRepeatEndType) getEndTypeDec:(NSData *)sessionKey error:(NSError**) error {
    var decValue = [TUTAes128Facade decryptBase64String:_endtype encryptionKey:sessionKey error:error];
    let intValue = decValue.integerValue;
    if (intValue < TUTRepeatEndTypeNever || intValue > TUTRepeatEndTypeUntilDate) {
        *error = [TUTErrorFactory createError:
                  [NSString stringWithFormat:@"Unknown repeat end type: %@", decValue]];
    }
    return decValue.integerValue;
}

-(long long) getEndValueDec:(NSData *)sessionKey error:(NSError**) error {
    if(![_endValue isEqual:NSNull.null]){
        var decValue = [TUTAes128Facade decryptBase64String:_endValue encryptionKey:sessionKey error:error];
        return decValue.longLongValue;
    } else {
        return 0;
    }
}


@end

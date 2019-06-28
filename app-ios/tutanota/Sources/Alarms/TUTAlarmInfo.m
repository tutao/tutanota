//
//  TUTAlarmInfo.m
//  tutanota
//
//  Created by Tutao GmbH on 17.06.19.
//  Copyright © 2019 Tutao GmbH. All rights reserved.
//

#import "TUTAlarmInfo.h"
#import "../Crypto/TUTAes128Facade.h"

#import "../Utils/Swiftier.h"

@implementation TUTAlarmInfo
- (instancetype)initWithAlarmIdentifier:(NSString *)alarmIdentifier trigger:(NSString *)trigger
{
    self = [super init];
    _alarmIdentifier = alarmIdentifier;
    _trigger = trigger;
    return self;
}

-(NSString *)getTriggerDec:(NSData *)sessionkey error:(NSError **)error {
    return [TUTAes128Facade decryptBase64String:_trigger encryptionKey:sessionkey error:error];
}

+ (TUTAlarmInfo *)fromJSON:(NSDictionary *)jsonDict {
    return [[TUTAlarmInfo alloc] initWithAlarmIdentifier:jsonDict[@"alarmIdentifier"] trigger:jsonDict[@"trigger"]];
}

@end

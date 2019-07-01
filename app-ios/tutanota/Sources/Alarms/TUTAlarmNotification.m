//
//  TUTAlarmNotification.m
//  tutanota
//
//  Created by Tutao GmbH on 17.06.19.
//  Copyright © 2019 Tutao GmbH. All rights reserved.
//

#import "TUTAlarmNotification.h"

#import "../Utils/PSPDFFastEnumeration.h"
#import "../Crypto/TUTAes128Facade.h"
#import "../Utils/TUTEncodingConverter.h"

#import "../Utils/Swiftier.h"

@implementation TUTAlarmNotification

- (instancetype)initWithOperation:(NSString *)operation
                          summary:(NSString *)summary
                       eventStart:(NSString *)eventStart
                         eventEnd:(NSString *)eventEnd
                        alarmInfo:(TUTAlarmInfo *)alarmInfo
          notificationSessionKeys:(NSArray<TUTNotificationSessionKey *> *) notificationSessionKeys
                       repeatRule:(TUTRepeatRule *)repeatRule
                          jsonDict:(NSDictionary *)jsonDict
{
    self = [super init];
    _operation = operation;
    _summary = summary;
    _eventStart = eventStart;
    _eventEnd = eventEnd;
    _alarmInfo = alarmInfo;
    _notificationSessionKeys = notificationSessionKeys;
    _repeatRule = repeatRule;
    _jsonDict = jsonDict;
    return self;
}

-(NSDate * _Nullable)getEventStartDec:(NSData *)sessionKey error:(NSError**)error {
    let stringData = [TUTAes128Facade decryptBase64String:_eventStart encryptionKey:sessionKey error:error];
    return [NSDate dateWithTimeIntervalSince1970:stringData.integerValue / 1000];
}


-(NSDate * _Nullable)getEventEndDec:(NSData *)sessionKey error:(NSError**)error {
    let stringData = [TUTAes128Facade decryptBase64String:_eventEnd encryptionKey:sessionKey error:error];
    return [NSDate dateWithTimeIntervalSince1970:stringData.integerValue / 1000];
}

-(NSString * _Nullable)getSummaryDec:(NSData *)sessionKey error:(NSError**) error{
    return [TUTAes128Facade decryptBase64String:_summary encryptionKey:sessionKey error:error];
}

+ (instancetype)fromJSON:(NSDictionary *)jsonDict {
    NSArray<NSDictionary *> *notificationSessionKeysJson = jsonDict[@"notificationSessionKeys"];
    NSMutableArray<TUTNotificationSessionKey *> *notificationSessionKeys = [NSMutableArray new];
    
    foreach(sessionKeyJson, notificationSessionKeysJson) {
        [notificationSessionKeys addObject:[TUTNotificationSessionKey fromJSON:sessionKeyJson]];
    }
    
    TUTRepeatRule *repeatRule;
    if (![jsonDict[@"repeatRule"] isKindOfClass:NSNull.class]) {
        repeatRule = [TUTRepeatRule fromJSON:jsonDict[@"repeatRule"]];
    }
    
    return [[TUTAlarmNotification alloc] initWithOperation:jsonDict[@"operation"]
                                                   summary:jsonDict[@"summary"]
                                                eventStart:jsonDict[@"eventStart"]
                                                  eventEnd:jsonDict[@"eventEnd"]
                                                 alarmInfo:[TUTAlarmInfo fromJSON:jsonDict[@"alarmInfo"]]
                                   notificationSessionKeys:notificationSessionKeys
                                                repeatRule:repeatRule
                                                  jsonDict:jsonDict];
}

- (BOOL)isEqual:(id)object {
    if ([object isKindOfClass:TUTAlarmNotification.class]) {
        let otherNotification = (TUTAlarmNotification *) object;
        return [self.alarmInfo.alarmIdentifier isEqualToString:otherNotification.alarmInfo.alarmIdentifier];
    }
    return false;
}

@end

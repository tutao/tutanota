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
                        alarmInfo:(TUTAlarmInfo *)alarmInfo
          notificationSessionKeys:(NSArray<TUTNotificationSessionKey *> *) notificationSessionKeys
{
    self = [super init];
    _operation = operation;
    _summary = summary;
    _eventStart = eventStart;
    _alarmInfo = alarmInfo;
    _notificationSessionKeys = notificationSessionKeys;
    return self;
}

-(NSDate * _Nullable)getEventStartDec:(NSData *)sessionKey error:(NSError**) error{
    let stringData = [TUTAes128Facade decryptBase64String:_eventStart encryptionKey:sessionKey error:error];
    return [NSDate dateWithTimeIntervalSince1970:stringData.integerValue];
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
    
    return [[TUTAlarmNotification alloc] initWithOperation:jsonDict[@"operation"]
                                                   summary:jsonDict[@"summary"]
                                                eventStart:jsonDict[@"eventStart"]
                                                 alarmInfo:[TUTAlarmInfo fromJSON:jsonDict[@"alarmInfo"]]
                                   notificationSessionKeys:notificationSessionKeys];
}
@end

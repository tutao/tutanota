//
//  TUTAlarmNotification.h
//  tutanota
//
//  Created by Tutao GmbH on 17.06.19.
//  Copyright © 2019 Tutao GmbH. All rights reserved.
//

#import <Foundation/Foundation.h>

#import "TUTAlarmInfo.h"
#import "TUTNotificationSessionKey.h"

NS_ASSUME_NONNULL_BEGIN

@interface TUTAlarmNotification : NSObject
@property (readonly, nonnull) NSString *operation;
@property (readonly, nonnull) NSString *summary;
@property (readonly, nonnull) NSString *eventStart;
@property (readonly, nonnull) TUTAlarmInfo *alarmInfo;
@property (readonly, nonnull) NSArray<TUTNotificationSessionKey *> *notificationSessionKeys;

-(NSDate * _Nullable)getEventStartDec:(NSData *)sessionKey error:(NSError**) error;
-(NSString * _Nullable)getSummaryDec:(NSData *)sessionKey error:(NSError**) error;

+(instancetype)fromJSON:(NSDictionary *)jsonDict;
@end

NS_ASSUME_NONNULL_END

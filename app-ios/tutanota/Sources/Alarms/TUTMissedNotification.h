//
//  TUTNotificationMessage.h
//  tutanota
//
//  Created by Tutao GmbH on 17.06.19.
//  Copyright © 2019 Tutao GmbH. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "TUTAlarmNotification.h"

NS_ASSUME_NONNULL_BEGIN

@interface TUTMissedNotification : NSObject

@property (nonnull, readonly) NSArray<TUTAlarmNotification *> *alarmNotifications;
@property (nonnull, readonly) NSString *confirmationId;

+(TUTMissedNotification *)fromJSON:(NSDictionary *)jsonDict;

@end

NS_ASSUME_NONNULL_END

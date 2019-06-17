//
//  TUTAlarmManager.h
//  tutanota
//
//  Created by Tutao GmbH on 07.06.19.
//  Copyright © 2019 Tutao GmbH. All rights reserved.
//

#import <Foundation/Foundation.h>

#import "Utils/TUTSseInfo.h"
#import "Alarms/TUTMissedNotification.h"

NS_ASSUME_NONNULL_BEGIN

typedef void (^NotificationLoadingCompletionHandler)(NSDictionary<NSString *, id> *_Nullable dict, NSError *_Nullable err);

typedef NS_ENUM(NSUInteger, ShapeType) {

    kCircle,
    kRectangle,
    kOblateSpheroid
};


@interface TUTAlarmManager : NSObject
- (void)scheduleAlarms:(TUTMissedNotification*) notificaiton completionsHandler:(void(^)(void))completionHandler;
- (void)sendConfirmationForIdentifier:(NSString *)identifier
                       confirmationId:(NSString *)confirmationId
                               origin:(NSString *)origin
                    completionHandler:(void (^)(void))completionHandler;
- (void)fetchMissedNotificationsForSSEInfo:(TUTSseInfo *)sseInfo
                         completionHandler:(NotificationLoadingCompletionHandler)completionHandler;

@end

NS_ASSUME_NONNULL_END

//
//  TUTAppDelegate.h
//  tutanota
//
//  Created by Tutao GmbH on 13.07.18.
//  Copyright © 2018 Tutao GmbH. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <UserNotifications/UserNotifications.h>

#import "TUTAlarmManager.h"
#import "Utils/TUTSseStorage.h"

@interface TUTAppDelegate : UIResponder <UIApplicationDelegate, UNUserNotificationCenterDelegate>

@property (strong, nonatomic) UIWindow *_Nonnull window;
@property (nonnull, readonly) TUTAlarmManager *alarmManager;
@property (nonnull, readonly) TUTSseStorage *sseStorage;

- (void)registerForPushNotificationsWithCallback:(void (^ _Nonnull)(NSString *token, NSError *error))callback;

@end


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
#import "Utils/TUTUserPreferenceFacade.h"

@interface TUTAppDelegate : UIResponder <UIApplicationDelegate, UNUserNotificationCenterDelegate>

@property (strong, nonatomic) UIWindow *_Nonnull window;
@property (nonnull, readonly) TUTAlarmManager *alarmManager;
@property (nonnull, readonly) TUTUserPreferenceFacade *userPreferences;

- (void)registerForPushNotificationsWithCallback:(void (^ _Nonnull)(NSString * _Nullable token , NSError * _Nullable error))callback;

@end


//
//  AppDelegate.m
//  tutanota
//
//  Created by Tutao GmbH on 13.07.18.
//  Copyright © 2018 Tutao GmbH. All rights reserved.
//

#import "Swiftier.h"
#import "PSPDFFastEnumeration.h"

#import "TUTAppDelegate.h"
#import "TUTViewController.h"
#import "TUTAlarmManager.h"
#import "Utils/TUTUserPreferenceFacade.h"
#import "Utils/TUTLog.h"

@interface TUTAppDelegate ()
@property TUTViewController *viewController;
@property void (^ _Nonnull pushTokenCallback)(NSString *token, NSError *error);
@property NSURLSession *urlSession;
@end

@implementation TUTAppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
    TUTLog(@"start tutanota %@", launchOptions);
    // Override point for customization after application launch.
    _window = [[UIWindow alloc] initWithFrame:UIScreen.mainScreen.bounds];
    _viewController = [TUTViewController new];
    _window.rootViewController = _viewController;
    _userPreferences = [TUTUserPreferenceFacade new];
    _alarmManager = [[TUTAlarmManager alloc] initWithUserPreferences:_userPreferences];
    UNUserNotificationCenter.currentNotificationCenter.delegate = self;
    
    [_window makeKeyAndVisible];
    return YES;
}


- (void)applicationWillResignActive:(UIApplication *)application {
    // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
    // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
}


- (void)applicationDidEnterBackground:(UIApplication *)application {
    // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
    // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
}


- (void)applicationWillEnterForeground:(UIApplication *)application {
    // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    [UIApplication.sharedApplication setApplicationIconBadgeNumber:0];
}


- (void)applicationDidBecomeActive:(UIApplication *)application {
    // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
}


- (void)applicationWillTerminate:(UIApplication *)application {
    // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
}

- (void)registerForPushNotificationsWithCallback:(void (^ _Nonnull)(NSString *token, NSError *error))callback {
    [UNUserNotificationCenter.currentNotificationCenter
     requestAuthorizationWithOptions:(UNAuthorizationOptionAlert|UNAuthorizationOptionBadge|UNAuthorizationOptionSound)
     completionHandler:^(BOOL granted, NSError * _Nullable error) {
         if (!error) {
             dispatch_async(dispatch_get_main_queue(), ^{
                 self->_pushTokenCallback = callback;
                 [UIApplication.sharedApplication registerForRemoteNotifications];
             });
         } else {
             callback(nil, error);
         }
     }];
}

- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken {
    if (_pushTokenCallback) {
        let stringToken = [TUTAppDelegate stringFromDeviceToken:deviceToken];
        _pushTokenCallback(stringToken, nil);
        _pushTokenCallback = nil;
    }
}

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler{
    // Print full message.
    let apsDict = (NSDictionary *) userInfo[@"aps"];
    TUTLog(@"receive notification: %@ \n alarmInfos: \n %@", userInfo, (NSArray *) apsDict[@"alarmInfos"]);
    
    if (apsDict[@"content-available"]) {
        [_alarmManager fetchMissedNotifications:^(NSError *error) {
            completionHandler(error ? UIBackgroundFetchResultFailed : UIBackgroundFetchResultNewData);
        }];
    }
}

+ (NSString *)stringFromDeviceToken:(NSData *)deviceToken {
    NSUInteger length = deviceToken.length;
    if (length == 0) {
        return nil;
    }
    const unsigned char *buffer = deviceToken.bytes;
    NSMutableString *hexString  = [NSMutableString stringWithCapacity:(length * 2)];
    for (int i = 0; i < length; ++i) {
        [hexString appendFormat:@"%02x", buffer[i]];
    }
    return [hexString copy];
}

- (void)userNotificationCenter:(UNUserNotificationCenter *)center
       willPresentNotification:(UNNotification *)notification
         withCompletionHandler:(void (^)(UNNotificationPresentationOptions options))completionHandler {
    completionHandler(UNNotificationPresentationOptionBadge | UNNotificationPresentationOptionSound | UNNotificationPresentationOptionAlert);
}

@end

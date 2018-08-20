//
//  TUTAppDelegate.h
//  tutanota
//
//  Created by Tutao GmbH on 13.07.18.
//  Copyright © 2018 Tutao GmbH. All rights reserved.
//

#import <UIKit/UIKit.h>

@interface TUTAppDelegate : UIResponder <UIApplicationDelegate>

@property (strong, nonatomic) UIWindow *window;

- (void)registerForPushNotificationsWithCallback:(void (^ _Nonnull)(NSString *token, NSError *error))callback;

@end


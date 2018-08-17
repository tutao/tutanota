//
//  ViewController.h
//  tutanota
//
//  Created by Tutao GmbH on 13.07.18.
//  Copyright © 2018 Tutao GmbH. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <WebKit/WebKit.h>

@interface ViewController : UIViewController<UIScrollViewDelegate>

-(void)didRegisterForRemoteNotificationsWithToken:(NSData * _Nonnull)deviceToken;

@end


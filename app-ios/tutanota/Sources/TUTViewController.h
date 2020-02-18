//
//  TUTViewController.h
//  tutanota
//
//  Created by Tutao GmbH on 13.07.18.
//  Copyright © 2018 Tutao GmbH. All rights reserved.
//

#import <UIKit/UIKit.h>

@interface TUTViewController : UIViewController<UIScrollViewDelegate>

- (instancetype)initWithPreferenceFacade:(TUTUserPreferenceFacade *)preferenceFacade
                            alarmManager:(TUTAlarmManager *)alarmManager;

@end


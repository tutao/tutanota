//
//  TUTUtils.m
//  tutanota
//
//  Created by Tutao GmbH on 19.06.19.
//  Copyright © 2019 Tutao GmbH. All rights reserved.
//

#import "TUTUtils.h"

@implementation TUTUtils
+ (NSString *)translate:(NSString *)key default:(NSString*)defaultValue {
    return [[NSBundle mainBundle] localizedStringForKey:key value:defaultValue table:@"InfoPlist"];
}

@end

//
//  TUTSseStorage.m
//  tutanota
//
//  Created by Tutao GmbH on 07.06.19.
//  Copyright © 2019 Tutao GmbH. All rights reserved.
//

#import "TUTSseStorage.h"
#import "Swiftier.h"

NSString *const SSE_INFO_KEY = @"sseInfo";

@implementation TUTSseStorage

- (NSDictionary *)getSseInfo {
    return [NSUserDefaults.standardUserDefaults dictionaryForKey:SSE_INFO_KEY];
}

- (void) storeSseInfoWithPushIdentifier:(NSString *)pushIdentifier userId:(NSString *)userId sseOrign:(NSString *)sseOrigin {
    var sseInfo = self.getSseInfo;
    if (!sseInfo) {
        sseInfo = @{
                    @"pushIdentifier":pushIdentifier,
                    @"userIds":@[userId],
                    @"sseOrigin":sseOrigin
                    };
    } else {
        NSMutableArray<NSString *> *userIds = [NSMutableArray new];
        [userIds addObjectsFromArray: sseInfo[@"userIds"]];
        [userIds addObject:userId];
    }
    [NSUserDefaults.standardUserDefaults setObject:sseInfo forKey:SSE_INFO_KEY];
}

@end

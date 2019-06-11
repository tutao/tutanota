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

- (TUTSseInfo *)getSseInfo {
    var dict = [NSUserDefaults.standardUserDefaults dictionaryForKey:SSE_INFO_KEY];
    if (!dict) {
        return nil;
    }
    return [[TUTSseInfo alloc] initWithDict:dict];
}

- (void) storeSseInfoWithPushIdentifier:(NSString *)pushIdentifier userId:(NSString *)userId sseOrign:(NSString *)sseOrigin {
    var sseInfo = self.getSseInfo;
    if (!sseInfo) {
        sseInfo = [TUTSseInfo new];
        sseInfo.pushIdentifier = pushIdentifier;
        sseInfo.userIds = @[userId];
        sseInfo.sseOrigin = sseOrigin;
    } else {
        sseInfo.pushIdentifier = pushIdentifier;
        sseInfo.sseOrigin = sseOrigin;
        NSMutableArray *userIds = sseInfo.userIds.mutableCopy;
        if (![userIds containsObject:userId]) {
            [userIds addObject:userId];
        }
        sseInfo.userIds = userIds;
    }
    [NSUserDefaults.standardUserDefaults setObject:sseInfo.toDict forKey:SSE_INFO_KEY];
}

@end

//
//  TUTSseInfo.m
//  tutanota
//
//  Created by Tutao GmbH on 11.06.19.
//  Copyright © 2019 Tutao GmbH. All rights reserved.
//

#import "TUTSseInfo.h"

NSString *const PUSH_IDENTIFIER_KEY = @"pushIdentifier";
NSString *const SSE_ORIGIN_KEY = @"sseOrigin";
NSString *const USER_IDS_KEY = @"userIds";

@interface TUTSseInfo ()
@property NSMutableDictionary<NSString *, id> *dict;
@end

@implementation TUTSseInfo

- (instancetype)init
{
    self = [super init];
    if (self) {
        _dict = [NSMutableDictionary new];
    }
    return self;
}

- (instancetype)initWithDict:(NSDictionary<NSString *, id> *)dict {
    self = [super init];
    if (self) {
        _dict = dict.mutableCopy;
    }
    return self;
}

- (NSDictionary<NSString *,id> *)toDict {
    return _dict.copy;
}

-(NSString *)pushIdentifier {
    return _dict[PUSH_IDENTIFIER_KEY];
}

- (void)setPushIdentifier:(NSString *)pushIdentifier {
    _dict[PUSH_IDENTIFIER_KEY] = pushIdentifier;
}

-(NSString *)sseOrigin {
    return _dict[SSE_ORIGIN_KEY];
}

- (void)setSseOrigin:(NSString *)sseOrigin {
    _dict[SSE_ORIGIN_KEY] = sseOrigin;
}

- (NSArray *)userIds {
    return ((NSArray *) _dict[USER_IDS_KEY]).copy;
}

- (void)setUserIds:(NSArray *)userIds {
    _dict[USER_IDS_KEY] = userIds;
}


@end

//
//  TUTSseInfo.h
//  tutanota
//
//  Created by Tutao GmbH on 11.06.19.
//  Copyright © 2019 Tutao GmbH. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface TUTSseInfo : NSObject
@property NSString *pushIdentifier;
@property NSString *sseOrigin;
@property NSArray *userIds;

- (instancetype)initWithDict:(NSDictionary<NSString *, id> *)dict;
- (NSDictionary<NSString *, id> *)toDict;
@end

NS_ASSUME_NONNULL_END

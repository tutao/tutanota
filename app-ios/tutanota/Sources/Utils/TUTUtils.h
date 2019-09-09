//
//  TUTUtils.h
//  tutanota
//
//  Created by Tutao GmbH on 19.06.19.
//  Copyright © 2019 Tutao GmbH. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface TUTUtils : NSObject
+ (NSString *)translate:(NSString *)key default:(NSString*)defaultValue;
@end

NS_ASSUME_NONNULL_END

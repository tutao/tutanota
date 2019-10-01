//
//  TUTLog.h
//  tutanota
//
//  Created by Tutao GmbH on 26.09.19.
//  Copyright © 2019 Tutao GmbH. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

extern const int LOG_SIZE;

@interface TUTLogger : NSObject
+ (instancetype)sharedInstance;
-(NSArray<NSString *> *)entries;
-(void)addEntry:(NSString *)entry;
@end

void TUTLog(NSString *format, ...);

NS_ASSUME_NONNULL_END

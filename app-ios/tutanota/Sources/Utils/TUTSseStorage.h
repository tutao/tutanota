//
//  TUTSseStorage.h
//  tutanota
//
//  Created by Tutao GmbH on 07.06.19.
//  Copyright © 2019 Tutao GmbH. All rights reserved.
//

#import <Foundation/Foundation.h>

#import "TUTSseInfo.h"

NS_ASSUME_NONNULL_BEGIN

@interface TUTSseStorage : NSObject
- (TUTSseInfo *)getSseInfo;
- (void)storeSseInfoWithPushIdentifier:(NSString *)pushIdentifier userId:(NSString *)userId sseOrign:(NSString *)sseOrigin;
@end

NS_ASSUME_NONNULL_END

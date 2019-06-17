//
//  TUTNotificationSessionKey.h
//  tutanota
//
//  Created by Tutao GmbH on 17.06.19.
//  Copyright © 2019 Tutao GmbH. All rights reserved.
//

#import <Foundation/Foundation.h>

#import "TUTIdTuple.h"

NS_ASSUME_NONNULL_BEGIN

@interface TUTNotificationSessionKey : NSObject
@property (nonnull, readonly) TUTIdTuple *pushIdentifier;
@property (nonnull, readonly) NSString *pushIdentifierSessionEncSessionKey;

+(TUTNotificationSessionKey *)fromJSON:(NSDictionary *)jsonDict;

@end

NS_ASSUME_NONNULL_END

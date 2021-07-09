//
//  TUTSubKeys.h
//  tutanota
//
//  Created by Tutao GmbH on 28.08.18.
//  Copyright © 2018 Tutao GmbH. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface TUTSubKeys : NSObject

@property NSData *cKey;
@property NSData * _Nullable mKey;

- initWithCKey:(NSData *)cKey  mKey:(NSData  * _Nullable)mKey;

@end

NS_ASSUME_NONNULL_END

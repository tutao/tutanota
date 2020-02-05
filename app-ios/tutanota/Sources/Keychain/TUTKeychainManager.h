//
//  TUTKeychainManager.h
//  tutanota
//
//  Created by Tutao GmbH on 17.06.19.
//  Copyright © 2019 Tutao GmbH. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface TUTKeychainManager : NSObject

- (void)storeKey:(NSData *)key  withId:(NSString *)keyId error:(NSError **)error;
- ( NSData * _Nullable)getKeyWithError:(NSString *)keyId error:(NSError **)error;
- (void)removePushIdentifierKeys:(NSError **)error;

@end

NS_ASSUME_NONNULL_END

//
//  AsyncBlockOperation.h
//  tutanota
//
//  Created by Tutao GmbH on 18.02.20.
//  Copyright © 2020 Tutao GmbH. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

typedef void(^AsyncBlock)(dispatch_block_t completionHandler);

@interface AsyncBlockOperation : NSOperation

@property (nonatomic, readonly, copy) AsyncBlock block;

+ (instancetype)asyncBlockOperationWithBlock:(AsyncBlock)block;

- (instancetype)initWithAsyncBlock:(AsyncBlock)block;

@end


@interface NSOperationQueue (AsyncBlockOperation)

- (void)addAsyncOperationWithBlock:(AsyncBlock)block;

@end

NS_ASSUME_NONNULL_END

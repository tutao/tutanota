//
//  TUTIdTuple.h
//  tutanota
//
//  Created by Tutao GmbH on 17.06.19.
//  Copyright © 2019 Tutao GmbH. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface TUTIdTuple : NSObject
@property (readonly, nonnull) NSString *listId;
@property (readonly, nonnull) NSString *elementId;

+(TUTIdTuple *)fromJSON:(NSArray *)jsonArray;
@end

NS_ASSUME_NONNULL_END

//
//  TUTIdTuple.m
//  tutanota
//
//  Created by Tutao GmbH on 17.06.19.
//  Copyright © 2019 Tutao GmbH. All rights reserved.
//

#import "TUTIdTuple.h"

@implementation TUTIdTuple

- (TUTIdTuple *)initWithListId:(NSString *)listId elementId:(NSString *)elementId {
    self = [super init];
    _listId = listId;
    _elementId = elementId;
    return self;
}

+ (TUTIdTuple *)fromJSON:(NSArray *)jsonArray {
    return [[TUTIdTuple alloc] initWithListId:jsonArray[0] elementId:jsonArray[1]];
}
@end

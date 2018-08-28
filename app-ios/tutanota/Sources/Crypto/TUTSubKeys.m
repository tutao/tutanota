//
//  TUTSubKeys.m
//  tutanota
//
//  Created by Tutao GmbH on 28.08.18.
//  Copyright © 2018 Tutao GmbH. All rights reserved.
//

#import "TUTSubKeys.h"

@implementation TUTSubKeys


- initWithCKey: (NSData*)cKey  mKey: (NSData* _Nullable) mKey {
    self = [super init];
	self.cKey = cKey;
	self.mKey = mKey;
	return self;
}

@end

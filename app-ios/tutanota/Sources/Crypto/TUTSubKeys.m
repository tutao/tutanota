#import "TUTSubKeys.h"

@implementation TUTSubKeys


- initWithCKey: (NSData*)cKey  mKey: (NSData* _Nullable) mKey {
    self = [super init];
	self.cKey = cKey;
	self.mKey = mKey;
	return self;
}

@end

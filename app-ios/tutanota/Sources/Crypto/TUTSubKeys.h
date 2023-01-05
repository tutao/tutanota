#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface TUTSubKeys : NSObject

@property NSData *cKey;
@property NSData * _Nullable mKey;

- initWithCKey:(NSData *)cKey  mKey:(NSData  * _Nullable)mKey;

@end

NS_ASSUME_NONNULL_END

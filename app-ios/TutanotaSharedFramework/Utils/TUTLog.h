#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

extern const int LOG_SIZE;

@interface TUTLogger : NSObject
+ (instancetype)sharedInstance;
-(NSArray<NSString *> *)entries;
-(void)addEntry:(NSString *)entry;
@end

void TUTLog(NSString *format, ...);

/**
 Simple, non-variadic version of TUTLog which is usable in Swift.
 */
void TUTSLog(NSString *message);

NS_ASSUME_NONNULL_END

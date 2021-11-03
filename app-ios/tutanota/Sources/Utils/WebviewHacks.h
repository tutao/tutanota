#import <WebKit/WebKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface WebviewHacks : NSObject
+ (void)keyboardDisplayDoesNotRequireUserAction;
+ (void)hideAccessoryBar;
@end

NS_ASSUME_NONNULL_END

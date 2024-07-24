#import "WebviewHacks.h"
#import "Swiftier.h"

// Runtime magic
#import <objc/message.h>

@implementation WebviewHacks

// Swizzling WebKit to be show keyboard when we call focus() on fields
// Work quite slowly so forms should not be focused at the time of animation
// https://github.com/Telerik-Verified-Plugins/WKWebView/commit/04e8296adeb61f289f9c698045c19b62d080c7e3#L609-L620
+ (void) keyboardDisplayDoesNotRequireUserAction {
  Class class = NSClassFromString(@"WKContentView");
  
  SEL selector = sel_getUid("_startAssistingNode:userIsInteracting:blurPreviousNode:changingActivityState:userObject:");
  Method method = class_getInstanceMethod(class, selector);
  IMP original = method_getImplementation(method);
  IMP override = imp_implementationWithBlock(^void(id me, void* arg0, BOOL arg1, BOOL arg2, BOOL arg3, id arg4) {
    ((void (*)(id, SEL, void*, BOOL, BOOL, BOOL, id))original)(me, selector, arg0, TRUE, arg2, arg3, arg4);
  });
  method_setImplementation(method, override);
}

+ (void)hideAccessoryBar {
  let WKClassString = [@[@"WK", @"Content", @"View"] componentsJoinedByString:@""];
  let method = class_getInstanceMethod(NSClassFromString(WKClassString), @selector(inputAccessoryView));
  IMP newImp = imp_implementationWithBlock(^(id _s) {
    return nil;
  });
  method_setImplementation(method, newImp);
}

@end

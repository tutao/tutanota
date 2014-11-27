#import <objc/runtime.h>
#import <UIKit/UIKit.h>
#import "UIWebViewExtension.h"

//Credit: https://gist.github.com/bjhomer/2048571
//Also: http://stackoverflow.com/a/23398487/1091751
@implementation UIWebView (HackishAccessoryHiding)
 
static const char * const hackishFixClassName = "UIWebBrowserViewMinusAccessoryView";
static Class hackishFixClass = Nil;
 
- (UIView *)hackishlyFoundBrowserView {
    UIScrollView *scrollView = self.scrollView;
    
    UIView *browserView = nil;
    for (UIView *subview in scrollView.subviews) {
        if ([NSStringFromClass([subview class]) hasPrefix:@"UIWebBrowserView"]) {
            browserView = subview;
            break;
        }
    }
    return browserView;
}
 
- (id)methodReturningNil {
    return nil;
}
 
- (void)ensureHackishSubclassExistsOfBrowserViewClass:(Class)browserViewClass {
    if (!hackishFixClass) {
        Class newClass = objc_allocateClassPair(browserViewClass, hackishFixClassName, 0);
        IMP nilImp = [self methodForSelector:@selector(methodReturningNil)];
        class_addMethod(newClass, @selector(inputAccessoryView), nilImp, "@@:");
        objc_registerClassPair(newClass);
 
        hackishFixClass = newClass;
    }
}
 
- (BOOL) hackishlyHidesInputAccessoryView {
    UIView *browserView = [self hackishlyFoundBrowserView];
    return [browserView class] == hackishFixClass;
}
 
- (void) setHackishlyHidesInputAccessoryView:(BOOL)value {
    UIView *browserView = [self hackishlyFoundBrowserView];
    if (browserView == nil) {
        return;
    }
    [self ensureHackishSubclassExistsOfBrowserViewClass:[browserView class]];
	
    if (value) {
        object_setClass(browserView, hackishFixClass);
    }
    else {
        Class normalClass = objc_getClass("UIWebBrowserView");
        object_setClass(browserView, normalClass);
    }
    [browserView reloadInputViews];
}
/* ---------------------------------------------------------------- */

/*
- (UIKeyboardAppearance) darkKeyboardAppearanceTemplateMethod {
    return UIKeyboardAppearanceDark;
}

- (UIKeyboardAppearance) lightKeyboardAppearanceTemplateMethod {
    return UIKeyboardAppearanceLight;
}

- (BOOL) styleDark {
    UIView *browserView = [self hackishlyFoundBrowserView];
    if (browserView == nil) {
      return false;
    }
    
    Method m = class_getInstanceMethod( [self class], @selector( darkKeyboardAppearanceTemplateMethod ) );
    IMP imp = method_getImplementation( m );
    
    Method m2 = class_getInstanceMethod( [browserView class], @selector(keyboardAppearance) );
    IMP imp2 = method_getImplementation( m2 );
    
    return imp == imp2;
}
 
- (void) setStyleDark:(BOOL)styleDark {
    UIView *browserView = [self hackishlyFoundBrowserView];
    if (browserView == nil) {
        return;
    }
  
    if ( styleDark ) {
      Method m = class_getInstanceMethod( [self class], @selector( darkKeyboardAppearanceTemplateMethod ) );
      IMP imp = method_getImplementation( m );
      const char* typeEncoding = method_getTypeEncoding( m );
      class_replaceMethod( [browserView class], @selector(keyboardAppearance), imp, typeEncoding );
    }
    else {
      Method m = class_getInstanceMethod( [self class], @selector( lightKeyboardAppearanceTemplateMethod ) );
      IMP imp = method_getImplementation( m );
      const char* typeEncoding = method_getTypeEncoding( m );
      class_replaceMethod( [browserView class], @selector(keyboardAppearance), imp, typeEncoding );
    }
}
*/

@end


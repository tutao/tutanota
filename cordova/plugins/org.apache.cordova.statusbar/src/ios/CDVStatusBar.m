/*
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements.  See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership.  The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance
 with the License.  You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
 */

/*
 NOTE: plugman/cordova cli should have already installed this,
 but you need the value UIViewControllerBasedStatusBarAppearance
 in your Info.plist as well to set the styles in iOS 7
 */

#import "CDVStatusBar.h"
#import <objc/runtime.h>
#import <Cordova/CDVViewController.h>

static const void *kHideStatusBar = &kHideStatusBar;
static const void *kStatusBarStyle = &kStatusBarStyle;

@interface CDVViewController (StatusBar)

@property (nonatomic, retain) id sb_hideStatusBar;
@property (nonatomic, retain) id sb_statusBarStyle;

@end

@implementation CDVViewController (StatusBar)

@dynamic sb_hideStatusBar;
@dynamic sb_statusBarStyle;

- (id)sb_hideStatusBar {
    return objc_getAssociatedObject(self, kHideStatusBar);
}

- (void)setSb_hideStatusBar:(id)newHideStatusBar {
    objc_setAssociatedObject(self, kHideStatusBar, newHideStatusBar, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

- (id)sb_statusBarStyle {
    return objc_getAssociatedObject(self, kStatusBarStyle);
}

- (void)setSb_statusBarStyle:(id)newStatusBarStyle {
    objc_setAssociatedObject(self, kStatusBarStyle, newStatusBarStyle, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

- (BOOL) prefersStatusBarHidden {
    return [self.sb_hideStatusBar boolValue];
}

- (UIStatusBarStyle)preferredStatusBarStyle
{
    return (UIStatusBarStyle)[self.sb_statusBarStyle intValue];
}

@end


@interface CDVStatusBar () <UIScrollViewDelegate>
- (void)fireTappedEvent;
- (void)updateIsVisible:(BOOL)visible;
@end

@implementation CDVStatusBar

- (id)settingForKey:(NSString*)key
{
    return [self.commandDelegate.settings objectForKey:[key lowercaseString]];
}

- (void)observeValueForKeyPath:(NSString*)keyPath ofObject:(id)object change:(NSDictionary*)change context:(void*)context
{
    if ([keyPath isEqual:@"statusBarHidden"]) {
        NSNumber* newValue = [change objectForKey:NSKeyValueChangeNewKey];
        [self updateIsVisible:![newValue boolValue]];
    }
}

- (void)pluginInitialize
{
    BOOL isiOS7 = (IsAtLeastiOSVersion(@"7.0"));

    // init
    NSNumber* uiviewControllerBasedStatusBarAppearance = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"UIViewControllerBasedStatusBarAppearance"];
    _uiviewControllerBasedStatusBarAppearance = (uiviewControllerBasedStatusBarAppearance == nil || [uiviewControllerBasedStatusBarAppearance boolValue]) && isiOS7;

    // observe the statusBarHidden property
    [[UIApplication sharedApplication] addObserver:self forKeyPath:@"statusBarHidden" options:NSKeyValueObservingOptionNew context:NULL];

    _statusBarOverlaysWebView = YES; // default

    [self initializeStatusBarBackgroundView];

    self.viewController.view.autoresizesSubviews = YES;

    NSString* setting;

    setting  = @"StatusBarOverlaysWebView";
    if ([self settingForKey:setting]) {
        self.statusBarOverlaysWebView = [(NSNumber*)[self settingForKey:setting] boolValue];
    }

    setting  = @"StatusBarBackgroundColor";
    if ([self settingForKey:setting]) {
        [self _backgroundColorByHexString:[self settingForKey:setting]];
    }

    setting  = @"StatusBarStyle";
    if ([self settingForKey:setting]) {
        [self setStatusBarStyle:[self settingForKey:setting]];
    }

    // blank scroll view to intercept status bar taps
    self.webView.scrollView.scrollsToTop = NO;
    UIScrollView *fakeScrollView = [[UIScrollView alloc] initWithFrame:UIScreen.mainScreen.bounds];
    fakeScrollView.delegate = self;
    fakeScrollView.scrollsToTop = YES;
    [self.viewController.view addSubview:fakeScrollView]; // Add scrollview to the view heirarchy so that it will begin accepting status bar taps
    [self.viewController.view sendSubviewToBack:fakeScrollView]; // Send it to the very back of the view heirarchy
    fakeScrollView.contentSize = CGSizeMake(UIScreen.mainScreen.bounds.size.width, UIScreen.mainScreen.bounds.size.height * 2.0f); // Make the scroll view longer than the screen itself
    fakeScrollView.contentOffset = CGPointMake(0.0f, UIScreen.mainScreen.bounds.size.height); // Scroll down so a tap will take scroll view back to the top
}

- (void)onReset {
    _eventsCallbackId = nil;
}

- (void)fireTappedEvent {
    if (_eventsCallbackId == nil) {
        return;
    }
    NSDictionary* payload = @{@"type": @"tap"};
    CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:payload];
    [result setKeepCallbackAsBool:YES];
    [self.commandDelegate sendPluginResult:result callbackId:_eventsCallbackId];
}

- (void)updateIsVisible:(BOOL)visible {
    if (_eventsCallbackId == nil) {
        return;
    }
    CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsBool:visible];
    [result setKeepCallbackAsBool:YES];
    [self.commandDelegate sendPluginResult:result callbackId:_eventsCallbackId];
}


- (void) _ready:(CDVInvokedUrlCommand*)command
{
    _eventsCallbackId = command.callbackId;
    [self updateIsVisible:![UIApplication sharedApplication].statusBarHidden];
}

- (void) initializeStatusBarBackgroundView
{
    CGRect statusBarFrame = [UIApplication sharedApplication].statusBarFrame;
    if (UIDeviceOrientationIsLandscape(self.viewController.interfaceOrientation) && !IsAtLeastiOSVersion(@"8.0")) {
        // swap width and height. set origin to zero
        statusBarFrame = CGRectMake(0, 0, statusBarFrame.size.height, statusBarFrame.size.width);
    }

    _statusBarBackgroundView = [[UIView alloc] initWithFrame:statusBarFrame];
    _statusBarBackgroundView.backgroundColor = _statusBarBackgroundColor;
    _statusBarBackgroundView.autoresizingMask = (UIViewAutoresizingFlexibleWidth  | UIViewAutoresizingFlexibleBottomMargin);
    _statusBarBackgroundView.autoresizesSubviews = YES;
}

- (void) setStatusBarOverlaysWebView:(BOOL)statusBarOverlaysWebView
{
    // we only care about the latest iOS version or a change in setting
    if (!IsAtLeastiOSVersion(@"7.0") || statusBarOverlaysWebView == _statusBarOverlaysWebView) {
        return;
    }

    CGRect bounds = [[UIScreen mainScreen] bounds];

    if (statusBarOverlaysWebView) {

        [_statusBarBackgroundView removeFromSuperview];
        if (UIDeviceOrientationIsLandscape(self.viewController.interfaceOrientation)) {
            self.webView.frame = CGRectMake(0, 0, bounds.size.height, bounds.size.width);
        } else {
            self.webView.frame = bounds;
        }

    } else {

        CGRect statusBarFrame = [UIApplication sharedApplication].statusBarFrame;

        [self initializeStatusBarBackgroundView];

        CGRect frame = self.webView.frame;

        if (UIDeviceOrientationIsLandscape(self.viewController.interfaceOrientation) && !IsAtLeastiOSVersion(@"8.0")) {
            frame.origin.y = statusBarFrame.size.width;
            frame.size.height -= statusBarFrame.size.width;
        } else {
            frame.origin.y = statusBarFrame.size.height;
            frame.size.height -= statusBarFrame.size.height;
        }

        self.webView.frame = frame;
        [self.webView.superview addSubview:_statusBarBackgroundView];
    }

    _statusBarOverlaysWebView = statusBarOverlaysWebView;
}

- (BOOL) statusBarOverlaysWebView
{
    return _statusBarOverlaysWebView;
}

- (void) overlaysWebView:(CDVInvokedUrlCommand*)command
{
    id value = [command.arguments objectAtIndex:0];
    if (!([value isKindOfClass:[NSNumber class]])) {
        value = [NSNumber numberWithBool:YES];
    }

    self.statusBarOverlaysWebView = [value boolValue];
}

- (void) refreshStatusBarAppearance
{
    SEL sel = NSSelectorFromString(@"setNeedsStatusBarAppearanceUpdate");
    if ([self.viewController respondsToSelector:sel]) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Warc-performSelector-leaks"
        [self.viewController performSelector:sel withObject:nil];
#pragma clang diagnostic pop
    }
}

- (void) setStyleForStatusBar:(UIStatusBarStyle)style
{
    if (_uiviewControllerBasedStatusBarAppearance) {
        CDVViewController* vc = (CDVViewController*)self.viewController;
        vc.sb_statusBarStyle = [NSNumber numberWithInt:style];
        [self refreshStatusBarAppearance];

    } else {
        [[UIApplication sharedApplication] setStatusBarStyle:style];
    }
}

- (void) setStatusBarStyle:(NSString*)statusBarStyle
{
    // default, lightContent, blackTranslucent, blackOpaque
    NSString* lcStatusBarStyle = [statusBarStyle lowercaseString];

    if ([lcStatusBarStyle isEqualToString:@"default"]) {
        [self styleDefault:nil];
    } else if ([lcStatusBarStyle isEqualToString:@"lightcontent"]) {
        [self styleLightContent:nil];
    } else if ([lcStatusBarStyle isEqualToString:@"blacktranslucent"]) {
        [self styleBlackTranslucent:nil];
    } else if ([lcStatusBarStyle isEqualToString:@"blackopaque"]) {
        [self styleBlackOpaque:nil];
    }
}

- (void) styleDefault:(CDVInvokedUrlCommand*)command
{
    [self setStyleForStatusBar:UIStatusBarStyleDefault];
}

- (void) styleLightContent:(CDVInvokedUrlCommand*)command
{
    [self setStyleForStatusBar:UIStatusBarStyleLightContent];
}

- (void) styleBlackTranslucent:(CDVInvokedUrlCommand*)command
{
    [self setStyleForStatusBar:UIStatusBarStyleBlackTranslucent];
}

- (void) styleBlackOpaque:(CDVInvokedUrlCommand*)command
{
    [self setStyleForStatusBar:UIStatusBarStyleBlackOpaque];
}

- (void) backgroundColorByName:(CDVInvokedUrlCommand*)command
{
    id value = [command.arguments objectAtIndex:0];
    if (!([value isKindOfClass:[NSString class]])) {
        value = @"black";
    }

    SEL selector = NSSelectorFromString([value stringByAppendingString:@"Color"]);
    if ([UIColor respondsToSelector:selector]) {
        _statusBarBackgroundView.backgroundColor = [UIColor performSelector:selector];
    }
}

- (void) _backgroundColorByHexString:(NSString*)hexString
{
    unsigned int rgbValue = 0;
    NSScanner* scanner = [NSScanner scannerWithString:hexString];
    [scanner setScanLocation:1];
    [scanner scanHexInt:&rgbValue];

    _statusBarBackgroundColor = [UIColor colorWithRed:((rgbValue & 0xFF0000) >> 16)/255.0 green:((rgbValue & 0xFF00) >> 8)/255.0 blue:(rgbValue & 0xFF)/255.0 alpha:1.0];
    _statusBarBackgroundView.backgroundColor = _statusBarBackgroundColor;
}

- (void) backgroundColorByHexString:(CDVInvokedUrlCommand*)command
{
    NSString* value = [command.arguments objectAtIndex:0];
    if (!([value isKindOfClass:[NSString class]])) {
        value = @"#000000";
    }

    if (![value hasPrefix:@"#"] || [value length] < 7) {
        return;
    }

    [self _backgroundColorByHexString:value];
}

- (void) hideStatusBar
{
    if (_uiviewControllerBasedStatusBarAppearance) {
        CDVViewController* vc = (CDVViewController*)self.viewController;
        vc.sb_hideStatusBar = [NSNumber numberWithBool:YES];
        [self refreshStatusBarAppearance];

    } else {
        UIApplication* app = [UIApplication sharedApplication];
        [app setStatusBarHidden:YES];
    }
}

- (void) hide:(CDVInvokedUrlCommand*)command
{
    UIApplication* app = [UIApplication sharedApplication];

    if (!app.isStatusBarHidden)
    {
        self.viewController.wantsFullScreenLayout = YES;
        CGRect statusBarFrame = [UIApplication sharedApplication].statusBarFrame;

        [self hideStatusBar];

        if (IsAtLeastiOSVersion(@"7.0")) {
            [_statusBarBackgroundView removeFromSuperview];
        }

        if (!_statusBarOverlaysWebView) {

            CGRect frame = self.webView.frame;
            frame.origin.y = 0;
            if (!self.statusBarOverlaysWebView) {
                if (UIDeviceOrientationIsLandscape(self.viewController.interfaceOrientation)) {
                    frame.size.height += statusBarFrame.size.width;
                } else {
                    frame.size.height += statusBarFrame.size.height;
                }
            }

            self.webView.frame = frame;
        }

        _statusBarBackgroundView.hidden = YES;
    }
}

- (void) showStatusBar
{
    if (_uiviewControllerBasedStatusBarAppearance) {
        CDVViewController* vc = (CDVViewController*)self.viewController;
        vc.sb_hideStatusBar = [NSNumber numberWithBool:NO];
        [self refreshStatusBarAppearance];

    } else {
        UIApplication* app = [UIApplication sharedApplication];
        [app setStatusBarHidden:NO];
    }
}

- (void) show:(CDVInvokedUrlCommand*)command
{
    UIApplication* app = [UIApplication sharedApplication];

    if (app.isStatusBarHidden)
    {
        BOOL isIOS7 = (IsAtLeastiOSVersion(@"7.0"));
        self.viewController.wantsFullScreenLayout = isIOS7;

        [self showStatusBar];

        if (isIOS7) {
            CGRect frame = self.webView.frame;
            self.viewController.view.frame = [[UIScreen mainScreen] bounds];

            CGRect statusBarFrame = [UIApplication sharedApplication].statusBarFrame;

            if (!self.statusBarOverlaysWebView) {

                // there is a possibility that when the statusbar was hidden, it was in a different orientation
                // from the current one. Therefore we need to expand the statusBarBackgroundView as well to the
                // statusBar's current size
                CGRect sbBgFrame = _statusBarBackgroundView.frame;

                if (UIDeviceOrientationIsLandscape(self.viewController.interfaceOrientation)) {
                    frame.origin.y = statusBarFrame.size.width;
                    frame.size.height -= statusBarFrame.size.width;
                    sbBgFrame.size = CGSizeMake(statusBarFrame.size.height, statusBarFrame.size.width);
                } else {
                    frame.origin.y = statusBarFrame.size.height;
                    frame.size.height -= statusBarFrame.size.height;
                    sbBgFrame.size = statusBarFrame.size;
                }

                _statusBarBackgroundView.frame = sbBgFrame;
                [self.webView.superview addSubview:_statusBarBackgroundView];
            }

            self.webView.frame = frame;

        } else {

            CGRect bounds = [[UIScreen mainScreen] applicationFrame];
            self.viewController.view.frame = bounds;
        }

        _statusBarBackgroundView.hidden = NO;
    }
}

- (void) dealloc
{
    [[UIApplication sharedApplication] removeObserver:self forKeyPath:@"statusBarHidden"];
}


#pragma mark - UIScrollViewDelegate

- (BOOL)scrollViewShouldScrollToTop:(UIScrollView *)scrollView
{
    [self fireTappedEvent];
    return NO;
}

@end

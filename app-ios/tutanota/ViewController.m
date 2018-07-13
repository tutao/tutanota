//
//  ViewController.m
//  tutanota
//
//  Created by Tutao GmbH on 13.07.18.
//  Copyright © 2018 Tutao GmbH. All rights reserved.
//

#import "ViewController.h"
#import <WebKit/WebKit.h>
#import <UIkit/UIkit.h>

@interface ViewController () <WKNavigationDelegate>
@property (strong) WKWebView* webView;
@end

@implementation ViewController

- (void)loadView {
    WKWebViewConfiguration *config = [WKWebViewConfiguration new];
	_webView = [[WKWebView alloc] initWithFrame:CGRectZero configuration:config];
	_webView.UIDelegate = self;
	[_webView.configuration.preferences setValue:@YES forKey:@"allowFileAccessFromFileURLs"];
	_webView.navigationDelegate = self;
	self.view = _webView;
}

- (void)viewDidLoad {
	[super viewDidLoad];
	NSString *path = [[NSBundle mainBundle] pathForResource:@"build/dist/app" ofType:@"html"];
	NSURL *fileUrl = [NSURL fileURLWithPath:path];
	NSURL *folderUrl = [NSURL fileURLWithPath:[path stringByDeletingLastPathComponent]];
	[_webView loadFileURL:fileUrl allowingReadAccessToURL:folderUrl];
}

@end

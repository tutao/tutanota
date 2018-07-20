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

@interface ViewController () <WKNavigationDelegate, WKScriptMessageHandler>
@property (strong) WKWebView* webView;
@end

@implementation ViewController

- (void)loadView {
    WKWebViewConfiguration *config = [WKWebViewConfiguration new];
	_webView = [[WKWebView alloc] initWithFrame:CGRectZero configuration:config];
	[_webView.configuration.preferences setValue:@YES forKey:@"allowFileAccessFromFileURLs"];
	_webView.navigationDelegate = self;
	[config.userContentController addScriptMessageHandler:self name:@"nativeApp"];
	self.view = _webView;

	// We need to implement this bridging from native because we don't know if we are an iOS app before the init event
	[_webView evaluateJavaScript:@"window.nativeApp = {invoke: (message) => window.webkit.messageHandlers.nativeApp.postMessage(message)}"
	completionHandler:nil];
}

- (void)viewDidLoad {
	[super viewDidLoad];
	NSString *path = [[NSBundle mainBundle] pathForResource:@"build/app" ofType:@"html"];
	NSURL *fileUrl = [NSURL fileURLWithPath:path];
	NSURL *folderUrl = [NSURL fileURLWithPath:[path stringByDeletingLastPathComponent]];
	[_webView loadFileURL:fileUrl allowingReadAccessToURL:folderUrl];
}

- (void)userContentController:(nonnull WKUserContentController *)userContentController didReceiveScriptMessage:(nonnull WKScriptMessage *)message {
	NSData *jsonData = [[message body] dataUsingEncoding:NSUTF8StringEncoding];
	NSDictionary *json = [NSJSONSerialization JSONObjectWithData:jsonData options:0 error:nil];
	NSLog(@"Message dict: %@", json);
	NSString *type = [json valueForKey:@"type"];
	NSString *requestId = [json valueForKey:@"id"];
	if ([@"response" isEqualToString:type]) {
		NSLog(@"Is a response");
	} else if ([@"init" isEqualToString:type]) {
		[self sendResponseWithId:requestId value:@"ios"];
	} else if ([@"rsaEncrypt" isEqualToString:type]) {
		// TODO
	}
}

- (void) sendResponseWithId:(NSString*)responseId value:(id)value {
	NSDictionary *response = @{
		@"id":responseId,
		@"type":@"response",
		@"value":value
	};
	NSData *jsonData = [NSJSONSerialization dataWithJSONObject:response options:0 error:nil];
	[self postMessage:[[NSString alloc ] initWithData:jsonData encoding:NSUTF8StringEncoding]];
}

- (void) postMessage:(NSString*)message {
	[_webView evaluateJavaScript:message completionHandler:nil];
}

@end

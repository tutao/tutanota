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
#import "Crypto.h"
#import "TutaoFileChooser.h"

@interface ViewController () <WKNavigationDelegate, WKScriptMessageHandler>
@property WKWebView *webView;
@property (readonly) Crypto *crypto;
@property (readonly) TutaoFileChooser *fileChooser;
@property (readonly) FileUtil *fileUtil;
@end

@implementation ViewController

- (instancetype)init
{
	self = [super init];
	if (self) {
		_crypto = [Crypto new];
		_fileChooser = [[TutaoFileChooser alloc] initWithViewController:self];
		_fileUtil = [[FileUtil alloc] initWithViewController:self];
	}
	return self;
}

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
	[self loadMainPageWithParams:nil];
}

- (void)userContentController:(nonnull WKUserContentController *)userContentController didReceiveScriptMessage:(nonnull WKScriptMessage *)message {
	NSData *jsonData = [[message body] dataUsingEncoding:NSUTF8StringEncoding];
	NSDictionary *json = [NSJSONSerialization JSONObjectWithData:jsonData options:0 error:nil];
	NSLog(@"Message dict: %@", json);
	NSString *type = [json valueForKey:@"type"];
	NSString *requestId = [json valueForKey:@"id"];
	NSArray *arguments = [json valueForKey:@"args"];
	
	void (^sendResponseBlock)(id, NSError *) = [self responseBlockForRequestId:requestId];

	if ([@"response" isEqualToString:type]) {
		NSLog(@"Is a response");
	} else if ([@"init" isEqualToString:type]) {
		[self sendResponseWithId:requestId value:@"ios"];
	} else if ([@"rsaEncrypt" isEqualToString:type]) {
		[_crypto rsaEncryptWithPublicKey:arguments[0] base64Data:arguments[1] completeion:sendResponseBlock];
	} else if ([@"rsaDecrypt" isEqualToString:type]) {
		[_crypto rsaDecryptWithPrivateKey:arguments[0]
							   base64Data:arguments[1]
							   completion:sendResponseBlock];
	} else if ([@"reload" isEqualToString:type]) {
		dispatch_async(dispatch_get_main_queue(), ^{
			[self loadMainPageWithParams:arguments[0]];
		});
		[self sendResponseWithId:requestId value:[NSNull null]];
	} else if ([@"generateRsaKey" isEqualToString:type]) {
		[_crypto generateRsaKeyWithSeed:arguments[0] completion: sendResponseBlock];
	} else if ([@"openFileChooser" isEqualToString:type]) {
		[_fileChooser openWithCompletion:^(NSString *filePath, NSError *error) {
			if (error == nil) {
				if (filePath != nil) {
					[self sendResponseWithId:requestId value:@[filePath]];
				} else {
					[self sendResponseWithId:requestId value:[NSArray new]];
				}
			} else {
				[self sendErrorResponseWithId:requestId value:error];
			}
		}];
	} else if ([@"getName" isEqualToString:type]) {
		[_fileUtil getNameForPath:arguments[0] completion:sendResponseBlock];
	} else if ([@"getSize" isEqualToString:type]) {
		[_fileUtil getSizeForPath:arguments[0] completion:sendResponseBlock];
	} else if ([@"getMimeType" isEqualToString:type]) {
		[_fileUtil getMimeTypeForPath:arguments[0] completion:sendResponseBlock];
	} else if ([@"changeTheme" isEqualToString:type] || [@"closePushNotifications" isEqualToString:type]) {
		// No-op for now
		sendResponseBlock(NSNull.null, nil);
	} else if ([@"aesEncryptFile" isEqualToString:type]) {
		[_crypto aesEncryptFileWithKey:arguments[0] atPath:arguments[1] completion:sendResponseBlock];
	} else if ([@"aesDecryptFile" isEqualToString:type]) {
		[_crypto aesDecryptFileWithKey:arguments[0] atPath:arguments[1] completion:sendResponseBlock];
	} else if([@"upload" isEqualToString:type]) {
		[_fileUtil uploadFileAtPath:arguments[0] toUrl:arguments[1] withHeaders:arguments[2] completion:sendResponseBlock];
	} else if ([@"deleteFile" isEqualToString:type]) {
		[_fileUtil deleteFileAtPath:arguments[0] completion:^{
			sendResponseBlock(NSNull.null, nil);
		}];
	} else if ([@"download" isEqualToString:type]) {
		[_fileUtil downloadFileFromUrl:arguments[0]
							   forName:arguments[1]
						   withHeaders:arguments[2]
							completion:sendResponseBlock];
	} else if ([@"open" isEqualToString:type]) {
		[_fileUtil openFileAtPath:arguments[0] completion:^(NSError * _Nullable error) {
			if (error != nil) {
				[self sendErrorResponseWithId:requestId value:error];
			} else {
				[self sendResponseWithId:requestId value:NSNull.null];
			}
		}];
	} else {
		NSString *message = [NSString stringWithFormat:@"Unknown command: %@", type];
		NSError *error = [NSError errorWithDomain:@"tutanota" code:5 userInfo:@{@"message":message}];
		[self sendErrorResponseWithId:requestId value:error];
	}
}

-(void (^)(id, NSError *))responseBlockForRequestId:(NSString *)requestId {
	return ^void(id value, NSError *error) {
		if (error == nil) {
			[self sendResponseWithId:requestId value:value];
		} else {
			[self sendErrorResponseWithId:requestId value:error];
		}
	};
}

- (void) loadMainPageWithParams:(NSString * _Nullable)params {
	NSString *path = [[NSBundle mainBundle] pathForResource:@"build/app" ofType:@"html"];
	NSURL *fileUrl = [NSURL fileURLWithPath:path];
	NSURL *folderUrl = [NSURL fileURLWithPath:[path stringByDeletingLastPathComponent]];
	if (params != nil) {
		NSString *newUrlString = [NSString stringWithFormat:@"%@%@", [folderUrl absoluteString], params];
		folderUrl = [NSURL URLWithString:newUrlString];
	}
	[_webView loadFileURL:fileUrl allowingReadAccessToURL:folderUrl];
}

- (void) sendResponseWithId:(NSString*)responseId value:(id)value {
	[self sendResponseWithId:responseId type:@"response" value:value];
}

- (void) sendErrorResponseWithId:(NSString*)responseId value:(NSError *)value {
	NSDictionary *errorDict = @{
								@"name":[value domain],
								@"message":value.userInfo[@"message"]
								};
	[self sendResponseWithId:responseId type:@"requestError" value:errorDict];
}

- (void) sendResponseWithId:(NSString *)responseId type:(NSString *)type value:(id)value {
	NSDictionary *response = @{
							   @"id":responseId,
							   @"type":type,
							   @"value":value
							   };
	NSData *jsonData = [NSJSONSerialization dataWithJSONObject:response options:0 error:nil];
	NSString *jsonString = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
	NSLog(@"Sending response %@", jsonString);
	[self postMessage:jsonString];
}

- (void) postMessage:(NSString*)message {
	dispatch_async(dispatch_get_main_queue(), ^{
		NSString *escapted = [message stringByReplacingOccurrencesOfString:@"\\" withString:@"\\\\"];
		NSString *js = [NSString stringWithFormat:@"tutao.nativeApp.handleMessageFromNative('%@')", escapted];
		[self->_webView evaluateJavaScript:js completionHandler:nil];
	});
}

@end

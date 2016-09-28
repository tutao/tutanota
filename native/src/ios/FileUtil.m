#import "FileUtil.h"
#import <Cordova/CDV.h>

@implementation FileUtil

- (void)open:(CDVInvokedUrlCommand*)command{
	[self.commandDelegate runInBackground:^{
		CDVPluginResult* pluginResult = nil;
		
		pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR];
		
		[self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
	 }];
}

- (void)openFileChooser:(CDVInvokedUrlCommand*)command{
	[self.commandDelegate runInBackground:^{
		CDVPluginResult* pluginResult = nil;
		
		pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR];
		
		[self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
	 }];
};

- (void)write:(CDVInvokedUrlCommand*)command{
	[self.commandDelegate runInBackground:^{
		CDVPluginResult* pluginResult = nil;
		
		pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR];
		
		[self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
	 }];
};

- (void)read:(CDVInvokedUrlCommand*)command{
	[self.commandDelegate runInBackground:^{
		CDVPluginResult* pluginResult = nil;
		
		pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR];
		
		[self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
	 }];
};


- (void)deleteFile:(CDVInvokedUrlCommand*)command{
	[self.commandDelegate runInBackground:^{
		CDVPluginResult* pluginResult = nil;
		
		pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR];
		
		[self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
	 }];
};

- (void)getName:(CDVInvokedUrlCommand*)command{
	[self.commandDelegate runInBackground:^{
		CDVPluginResult* pluginResult = nil;
		
		pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR];
		
		[self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
	 }];
};

- (void)getMimeType:(CDVInvokedUrlCommand*)command{
	[self.commandDelegate runInBackground:^{
		CDVPluginResult* pluginResult = nil;
		
		pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR];
		
		[self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
	 }];
};

- (void)getSize:(CDVInvokedUrlCommand*)command{
	[self.commandDelegate runInBackground:^{
		CDVPluginResult* pluginResult = nil;
		
		pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR];
		
		[self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
	 }];
};


- (void)upload:(CDVInvokedUrlCommand*)command{
	[self.commandDelegate runInBackground:^{
		CDVPluginResult* pluginResult = nil;
		
		pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR];
		
		[self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
	 }];
};

- (void)download:(CDVInvokedUrlCommand*)command{
	[self.commandDelegate runInBackground:^{
		CDVPluginResult* pluginResult = nil;
		
		if ([command.arguments objectAtIndex:0] != [NSNull null] && [command.arguments objectAtIndex:1] != [NSNull null] && [command.arguments objectAtIndex:2] != [NSNull null] ) {
			NSURL * url = [NSURL URLWithString:[command.arguments objectAtIndex:0]];
			NSString * fileName = [command.arguments objectAtIndex:1];
			NSDictionary * headers = [command.arguments objectAtIndex:2];
			NSMutableURLRequest *request = [[NSMutableURLRequest alloc] init];
			[request setHTTPMethod:@"GET"];
			[request setURL:url];
			[request setAllHTTPHeaderFields:headers];
			
			NSURLSessionConfiguration * configuration = [NSURLSessionConfiguration ephemeralSessionConfiguration];	// Ephemeral sessions do not store any data to disk; all caches, credential stores, and so on are kept in RAM.
			NSURLSession *session = [NSURLSession sessionWithConfiguration:configuration];
			
			
			//- (NSURLSessionDataTask *)dataTaskWithRequest:(NSURLRequest *)request completionHandler:(void (^)(NSData * _Nullable data, NSURLResponse * 	 response, NSError * _Nullable error))completionHandler;
			[[session dataTaskWithRequest: request completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
			//[[session dataTaskWithURL:url completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
				NSLog(@"Got response %@ with error %@.\n", response, error);
				NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse*)response;
				if ([httpResponse statusCode] == 200) {
					//NSURL *tmpDirURL = [NSURL fileURLWithPath:NSTemporaryDirectory() isDirectory:YES];
					//NSURL *encryptedFileURL = [tmpDirURL URLByAppendingPathExtension:fileName];
					//NSString *path= [encryptedFileURL path];
					NSString *filePath = [NSTemporaryDirectory() stringByAppendingPathComponent:fileName];
					
					//data would be the NSData that you get from the S3 bucket
					NSError *error = nil;
					//[[NSFileManager defaultManager] createFileAtPath:path contents: data attributes: nil];
					[data writeToFile:filePath options: NSDataWritingAtomic error:&error];
					if (!error) {
						CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:filePath];
						[self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId ];
					} else {
					    NSLog(@"error %@.\n", error);
						[self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString: [error description]] callbackId:command.callbackId];
					}
				} else {
					[self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsInt:[httpResponse statusCode]] callbackId:command.callbackId];
				}
				//NSLog(@"DATA:\n%@\nEND DATA\n", [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
			}] resume];
		} else {
			[self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"invalid arguments"] callbackId:command.callbackId];
		}


		/*
					try {
						con.setConnectTimeout(HTTP_TIMEOUT);
						con.setReadTimeout(HTTP_TIMEOUT);
						con.setRequestMethod("GET");
						con.setDoInput(true);
						con.setUseCaches(false);
						addHeadersToRequest(con, headers);
						con.connect();

						Context context = webView.getContext();
						File encryptedDir = new File(Utils.getDir(context), Crypto.TEMP_DIR_ENCRYPTED);
						encryptedDir.mkdirs();
						File encryptedFile = new File(encryptedDir, filename);

						IOUtils.copy(con.getInputStream(), new FileOutputStream(encryptedFile));

						callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, Utils.fileToUri(encryptedFile)));
					} finally {
						con.disconnect();
					}
				} catch (Exception e) {
					Log.e(TAG, "error during download from " + sourceUrl, e);
					callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.ERROR, Utils.getStack(e)));
				}
			}
			*/
	
		
	 }];
};

@end


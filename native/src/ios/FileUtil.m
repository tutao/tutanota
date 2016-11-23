
#import <Cordova/CDV.h>
#import <QuickLook/QuickLook.h>
#import <MobileCoreServices/MobileCoreServices.h>
#include "TutaoUtils.h"
#include "TutaoFileViewer.h"
#include "FileUtil.h"
#include "TutaoFileChooser.h"

@implementation FileUtil {
	CDVInvokedUrlCommand *_command;
	TutaoFileChooser *_attachmentChooser;
	TutaoFileViewer *_viewer;
	NSMutableSet<NSString*> *_attachmentsForUpload;
}


- (void)pluginInitialize{
	//UINavigationBar* defaultNavigationBar = [UINavigationBar appearance];
	//[defaultNavigationBar setTintColor:[UIColor redColor]];  //iOS7

	_attachmentChooser = [[TutaoFileChooser alloc]initWithPlugin:self];
	_viewer = [[TutaoFileViewer alloc]initWithPlugin:self];
	_attachmentsForUpload = [[NSMutableSet alloc]init];
}


- (void)open:(CDVInvokedUrlCommand*)command{
	NSString * filePath = [command.arguments objectAtIndex:0];
	[_viewer openFileAtPath:filePath completionHandler:^(NSError *error) {
		if (error){
			[TutaoUtils sendErrorResult:error invokedCommand:command delegate:self.commandDelegate];
		} else {
			[self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK] callbackId:command.callbackId];
		}
	}];
}

- (void)openFileChooser:(CDVInvokedUrlCommand*)command{
	NSDictionary *srcRect = [command.arguments objectAtIndex:0];

	[_attachmentChooser openAt:srcRect completion:^(NSString *filePath, NSError *error) {
		if(error){
			[TutaoUtils sendErrorResult:error invokedCommand:command delegate:self.commandDelegate];
		} else {
			if (filePath){
				[_attachmentsForUpload addObject:filePath];
				[self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:filePath] callbackId:command.callbackId];
			} else {
				[self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_NO_RESULT] callbackId:command.callbackId];
			}
		}
	}];

}



- (void)write:(CDVInvokedUrlCommand*)command{
	[self.commandDelegate runInBackground:^{
		CDVPluginResult* pluginResult = nil;
		pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR];
		[self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
	 }];
}

- (void)read:(CDVInvokedUrlCommand*)command{
	[self.commandDelegate runInBackground:^{
		CDVPluginResult* pluginResult = nil;
		
		pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR];
		
		[self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
	 }];
}

- (void)deleteFile:(CDVInvokedUrlCommand*)command{
	[self.commandDelegate runInBackground:^{
		NSString * filePath = [command.arguments objectAtIndex:0];
		// do not delete files if they haven't been uploaded yet.
		if (![_attachmentsForUpload containsObject:filePath]){
			[[NSFileManager defaultManager] removeItemAtPath:filePath error:nil];
		}
		[self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK] callbackId:command.callbackId];
	 }];
}

- (void)getName:(CDVInvokedUrlCommand*)command{
	[self.commandDelegate runInBackground:^{
		CDVPluginResult* pluginResult = nil;
		NSString *filePath = [command.arguments objectAtIndex:0];
		NSString *fileName = [filePath lastPathComponent];		
		if ( [FileUtil fileExistsAtPath:filePath]){
			pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:fileName];
		} else {
			pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"file does not exists"];
		}
		[self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
	 }];
}

- (void)getMimeType:(CDVInvokedUrlCommand*)command{
	[self.commandDelegate runInBackground:^{
		CDVPluginResult* pluginResult = nil;
		
		NSString *filePath = [command.arguments objectAtIndex:0];
		NSString *mimeType = [self getFileMIMEType: [filePath lastPathComponent]];
		if (mimeType){
			pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:mimeType];
		} else {
			pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"no mime type available"];
		}
		[self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
	 }];
}

- (void)getSize:(CDVInvokedUrlCommand*)command{
	[self.commandDelegate runInBackground:^{
		NSString *filePath = [command.arguments objectAtIndex:0];
		NSURL *fileURL = [NSURL fileURLWithPath:filePath];
		
		NSNumber *fileSizeValue = nil;
		NSError *fileSizeError = nil;
		[fileURL getResourceValue:&fileSizeValue
                   forKey:NSURLFileSizeKey
                    error:&fileSizeError];
	
		if (fileSizeValue) {
			CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsNSInteger:[fileSizeValue integerValue]];
			[self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
		} else {
			[TutaoUtils sendErrorResult:fileSizeError invokedCommand:command delegate:self.commandDelegate];
		}

	 }];
}


- (void)upload:(CDVInvokedUrlCommand*)command{
	[self.commandDelegate runInBackground:^{
		NSString * filePath = [command.arguments objectAtIndex:0];
		NSURL * url = [NSURL URLWithString:[command.arguments objectAtIndex:1]];
		NSDictionary * headers = [command.arguments objectAtIndex:2];
		
		NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:url];
		[request setHTTPMethod:@"PUT"];
		[request setValue:@"application/octet-stream" forHTTPHeaderField:@"Content-Type"];
		[request setAllHTTPHeaderFields:headers];
		
		NSURLSessionConfiguration * configuration = [NSURLSessionConfiguration ephemeralSessionConfiguration];	// Ephemeral sessions do not store any data to disk; all caches, credential stores, and so on are kept in RAM.
		NSURLSession *session = [NSURLSession sessionWithConfiguration:configuration];
		
		NSURL *fileUrl = [FileUtil urlFromPath:filePath];
		NSURLSessionUploadTask *task = [session uploadTaskWithRequest:request fromFile:fileUrl completionHandler:^(NSData * data, NSURLResponse * response, NSError *error) {
			if (error){
				[TutaoUtils sendErrorResult:error invokedCommand:command delegate:self.commandDelegate];
                return;
            }
			NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse*)response;
			[self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsNSInteger:[httpResponse statusCode]] callbackId:command.callbackId];
		}];
		[task resume];
	 }];
}

- (void)download:(CDVInvokedUrlCommand*)command{
	[self.commandDelegate runInBackground:^{
		
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

			[[session dataTaskWithRequest: request completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
				//NSLog(@"Got response %@ with error %@.\n", response, error);
				NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse*)response;
                if (error){
                    [TutaoUtils sendErrorResult:error invokedCommand:command delegate:self.commandDelegate];
                    return;
                }
				if ([httpResponse statusCode] == 200) {
                    NSError *error = nil;
					NSString *encryptedPath = [FileUtil getEncryptedFolder: &error];
                    if (error) {
                        [TutaoUtils sendErrorResult:error invokedCommand:command delegate:self.commandDelegate];
                        return;
                    }
                    NSString *filePath = [encryptedPath stringByAppendingPathComponent:fileName];
					[data writeToFile:filePath options: NSDataWritingAtomic error:&error];
                    //NSLog(@"Filename: %@", filePath);
					if (!error) {
						CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:filePath];
						[self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId ];
					} else {
                        [TutaoUtils sendErrorResult:error invokedCommand:command delegate:self.commandDelegate];
                        return;
					}
				} else {
                    CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsNSInteger:[httpResponse statusCode]];
                    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
				}
				//NSLog(@"DATA:\n%@\nEND DATA\n", [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
			}] resume];
		} else {
			[self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"invalid arguments"] callbackId:command.callbackId];
		}
	 }];
}

- (void)clearFileData:(CDVInvokedUrlCommand*)command{
	NSFileManager *fileManager = [NSFileManager defaultManager];
	for(NSString *filePath in _attachmentsForUpload){
		// ignore errors
		[fileManager removeItemAtPath:filePath error:nil];
	}
	[_attachmentsForUpload removeAllObjects];
}



+ (NSString*) getEncryptedFolder:(NSError**)error {
    NSString * encryptedFolder = [NSTemporaryDirectory() stringByAppendingPathComponent:@"encrypted"];
    [[NSFileManager defaultManager] createDirectoryAtPath:encryptedFolder
                              withIntermediateDirectories:YES
                                               attributes:nil
                                                    error:error];
    return encryptedFolder;
}

+ (NSString*) getDecryptedFolder:(NSError**)error  {
    NSString * decryptedFolder = [NSTemporaryDirectory() stringByAppendingPathComponent:@"decrypted"];
    [[NSFileManager defaultManager] createDirectoryAtPath:decryptedFolder
                              withIntermediateDirectories:YES
                                               attributes:nil
                                                    error:error];
    return decryptedFolder;	
}


+ (BOOL) fileExistsAtPath:(NSString*)path  {
	return [[NSFileManager defaultManager] fileExistsAtPath:path];
};


- (NSString*) getFileMIMEType:(NSString*) file {
    CFStringRef UTI = UTTypeCreatePreferredIdentifierForTag(kUTTagClassFilenameExtension, (__bridge CFStringRef)[file pathExtension], NULL);
    CFStringRef MIMEType = UTTypeCopyPreferredTagWithClass (UTI, kUTTagClassMIMEType);
    CFRelease(UTI);
    return (__bridge NSString *)MIMEType;
}

+ (NSURL*) urlFromPath:(NSString*)path{
	return  [NSURL fileURLWithPath:path];
};

+ (NSString*) pathFromUrl:(NSURL*)url	{
	return [url path];
};




@end


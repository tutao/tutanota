
#import "Swiftier.h"

#import <MobileCoreServices/MobileCoreServices.h>
#import "TUTFileViewer.h"
#import "TUTFileUtil.h"
#import "tutanota-Swift.h"

static NSString * const FILES_ERROR_DOMAIN = @"tutanota_files";

@interface TUTFileUtil ()
@property (readonly) TUTFileChooser *attachmentChooser;
@property (readonly) TUTFileViewer *viewer;
@end

@implementation TUTFileUtil

- (instancetype)initWithViewController:(UIViewController * _Nonnull)viewController
{
    self = [super init];
    if (self) {
        _attachmentChooser = [[TUTFileChooser alloc] initWithViewController:viewController];
		_viewer = [[TUTFileViewer alloc] initWithViewController:viewController];
    }
    return self;
}


- (void)openFileAtPath:(NSString * _Nonnull)filePath
			completion:(void (^ _Nonnull)(NSError * _Nullable))completion {
	[self->_viewer openFileAtPath:filePath completion:completion];
}

- (void) openFile:(NSString*) name fileData:(NSData*) fileData completion:(void(^)(NSError * error))completion{
	NSError* error;
	let decryptedFolder = [TUTFileUtil getDecryptedFolder:&error];
	NSString *filePath = [decryptedFolder stringByAppendingPathComponent:name];
	[fileData writeToFile:filePath options: NSDataWritingAtomic error:&error];
	if (!error) {
		[self openFileAtPath:filePath completion:^(NSError * error){
			[[NSFileManager defaultManager] removeItemAtPath:filePath error:nil];
			completion(error);
		}];
	} else {
		completion(error);
	}
}

- (void)deleteFileAtPath:(NSString *)filePath
			  completion:(void (^)(void))completion {
	dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
		[[NSFileManager defaultManager] removeItemAtPath:filePath error:nil];
		completion();
	 });
}

- (void)getNameForPath:(NSString *)filePath completion:(void (^)(NSString *, NSError *))completion {
	dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
		NSString *fileName = [filePath lastPathComponent];
		if ([TUTFileUtil fileExistsAtPath:filePath]){
			completion(fileName, nil);
		} else {
			completion(nil, [NSError errorWithDomain:FILES_ERROR_DOMAIN
												code:1
											userInfo:@{@"message":@"file does not exist"}]);
		}
	 });
}

- (void)getMimeTypeForPath:(NSString *)filePath completion:(void (^)(NSString *, NSError *))completion {
	dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
		NSString *mimeType = [self getFileMIMEType: [filePath lastPathComponent]];
		if (mimeType == nil) {
			mimeType = @"application/octet-stream";
		}
		completion(mimeType, nil);
	});
}

- (void)getSizeForPath:(NSString *)filePath completion:(void (^)(NSNumber *, NSError *))completion {
	dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
		NSURL *fileURL = [NSURL fileURLWithPath:filePath];
		NSNumber *fileSizeValue = nil;
		NSError *fileSizeError = nil;
		[fileURL getResourceValue:&fileSizeValue
						   forKey:NSURLFileSizeKey
							error:&fileSizeError];
		if (fileSizeValue) {
			completion(fileSizeValue, nil);
		} else {
			completion(nil, [NSError errorWithDomain:FILES_ERROR_DOMAIN
												code:1
												userInfo:@{@"message":@"Could not determine file size"}]);
		}
	});
}


- (void)uploadFileAtPath:(NSString * _Nonnull)filePath
				   toUrl:(NSString * _Nonnull)urlString
			 withHeaders:(NSDictionary<NSString *, NSString *> * _Nonnull)headers
			  completion:(void (^ _Nonnull)(NSDictionary<NSString *, id> * _Nullable response, NSError * _Nullable error))completion {
	dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
		NSURL *url = [NSURL URLWithString:urlString];
		NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:url];
		[request setHTTPMethod:@"PUT"];
		[request setValue:@"application/octet-stream" forHTTPHeaderField:@"Content-Type"];
		[request setAllHTTPHeaderFields:headers];

		NSURLSessionConfiguration * configuration = [NSURLSessionConfiguration ephemeralSessionConfiguration];	// Ephemeral sessions do not store any data to disk; all caches, credential stores, and so on are kept in RAM.
		NSURLSession *session = [NSURLSession sessionWithConfiguration:configuration];

		NSURL *fileUrl = [TUTFileUtil urlFromPath:filePath];
		NSURLSessionUploadTask *task = [session uploadTaskWithRequest:request
															 fromFile:fileUrl
													completionHandler:^(NSData * data, NSURLResponse * response, NSError *error) {
														if (error) {
															completion(nil, error);
															return;
														}
														const NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse*)response;
            
                                                        // response for upload: statusCode: number, errorId: ?string, precondition: ?string
														NSMutableDictionary<NSString *, id> *responseDict = [NSMutableDictionary new];
                                                        [TUTFileUtil addStatusCodeToResponseDict:responseDict from:httpResponse];
                                                        [TUTFileUtil addErrorIdHeaderToResponseDict:responseDict from:httpResponse];
                                                        [TUTFileUtil addPreconditionHeaderToResponseDict:responseDict from:httpResponse];
                                                        [TUTFileUtil addSuspensionTimeHeaderToResponseDict:responseDict from:httpResponse];
														completion(responseDict, nil);
													}];
		[task resume];
	});
}

- (void)downloadFileFromUrl:(NSString * _Nonnull)urlString
					forName:(NSString * _Nonnull)fileName
				withHeaders:(NSDictionary<NSString *, NSString *> * _Nonnull)headers
				 completion:(void (^ _Nonnull)(NSDictionary<NSString *, id> * _Nullable response, NSError * _Nullable error))completion {
	dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
			NSURL * url = [NSURL URLWithString:urlString];
			NSMutableURLRequest *request = [[NSMutableURLRequest alloc] init];
			[request setHTTPMethod:@"GET"];
			[request setURL:url];
			[request setAllHTTPHeaderFields:headers];

			NSURLSessionConfiguration * configuration = [NSURLSessionConfiguration ephemeralSessionConfiguration];	// Ephemeral sessions do not store any data to disk; all caches, credential stores, and so on are kept in RAM.
			NSURLSession *session = [NSURLSession sessionWithConfiguration:configuration];

			[[session dataTaskWithRequest: request completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
				NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse*)response;
                if (error) {
					completion(nil, error);
                    return;
                }
                
                NSString *filePath;
                
				if ([httpResponse statusCode] == 200) {
                    NSError *error = nil;
					NSString *encryptedPath = [TUTFileUtil getEncryptedFolder: &error];
                    if (error) {
						completion(nil, error);
						return;
					}
					filePath = [encryptedPath stringByAppendingPathComponent:fileName];
					[data writeToFile:filePath options: NSDataWritingAtomic error:&error];
					if (error) {
						completion(nil, error);
                        return;
					}
				}
                //response for download: statusCode: number, encryptedFileUri: ?string, errorId: ?string, precondition: ?string
                NSMutableDictionary<NSString *, id> *responseDict = [NSMutableDictionary new];
                [TUTFileUtil addStatusCodeToResponseDict:responseDict from:httpResponse];
                [TUTFileUtil addEncFileUriToResponseDict:responseDict fileUri:filePath];
                [TUTFileUtil addErrorIdHeaderToResponseDict:responseDict from:httpResponse];
                [TUTFileUtil addPreconditionHeaderToResponseDict:responseDict from:httpResponse];
                [TUTFileUtil addSuspensionTimeHeaderToResponseDict:responseDict from:httpResponse];
                completion(responseDict, nil);
                
                
			}] resume];
		});
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


- (void)clearFileData{
	NSError* error;
	[self clearDirectory:[TUTFileUtil getEncryptedFolder: &error]];
	[self clearDirectory:[TUTFileUtil getDecryptedFolder: &error]];
	[self clearDirectory:NSTemporaryDirectory()];
}


-(void) clearDirectory:(NSString*) dirToDelete {
	NSFileManager *fileManager = [NSFileManager defaultManager];
	NSError* error;
	NSURL* folderUrl = [NSURL fileURLWithPath:dirToDelete];
	NSArray<NSURL *> *files = [fileManager contentsOfDirectoryAtURL:folderUrl includingPropertiesForKeys:nil options: 0 error:&error];
	if (error) {
		return;
	}
	for (NSURL *file in files) {
		if (!file.hasDirectoryPath){
			[fileManager removeItemAtURL:file error:&error];
		}
	}
}


+ (void) addStatusCodeToResponseDict:(NSMutableDictionary*)responseDict from:(const NSHTTPURLResponse*)httpResponse {
        [responseDict setValue:@(httpResponse.statusCode) forKey:@"statusCode"];
}

+ (void) addEncFileUriToResponseDict:(NSMutableDictionary*)responseDict fileUri:(NSString*)filePath {
    if (filePath == nil) {
        [responseDict setValue:NSNull.null forKey:@"encryptedFileUri"];
    } else {
        [responseDict setValue:filePath forKey:@"encryptedFileUri"];
    }
}

+ (void) addErrorIdHeaderToResponseDict:(NSMutableDictionary*)responseDict from:(const NSHTTPURLResponse*)httpResponse {
    const NSString *header = httpResponse.allHeaderFields[@"Error-Id"];
    if (header == nil) {
        [responseDict setValue:NSNull.null forKey:@"errorId"];
    } else {
        [responseDict setValue:header forKey:@"errorId"];
    }
}

+ (void) addPreconditionHeaderToResponseDict:(NSMutableDictionary*)responseDict from:(const NSHTTPURLResponse*)httpResponse {
    const NSString *header = httpResponse.allHeaderFields[@"Precondition"];
    if (header == nil) {
        [responseDict setValue:NSNull.null forKey:@"precondition"];
    } else {
        [responseDict setValue:header forKey:@"precondition"];
    }
}


+ (void) addSuspensionTimeHeaderToResponseDict:(NSMutableDictionary*)responseDict from:(const NSHTTPURLResponse*)httpResponse {
    const NSString *suspensionTime = httpResponse.allHeaderFields[@"Suspension-Time"];
    const NSString *retryAfter = httpResponse.allHeaderFields[@"Retry-After"];
    if (retryAfter != nil) {
        [responseDict setValue:retryAfter forKey:@"suspensionTime"];
    } else if (suspensionTime != nil) {
        [responseDict setValue:suspensionTime forKey:@"suspensionTime"];
    } else {
        [responseDict setValue:NSNull.null forKey:@"suspensionTime"];
    }
}

@end

			

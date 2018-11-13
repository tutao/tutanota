
#import <MobileCoreServices/MobileCoreServices.h>
#import "TUTFileViewer.h"
#import "TUTFileUtil.h"
#import "TUTFileChooser.h"

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
        _attachmentChooser = [[TUTFileChooser alloc] init];
		_viewer = [[TUTFileViewer alloc] initWithViewController:viewController];
    }
    return self;
}


- (void)openFileAtPath:(NSString * _Nonnull)filePath
			completion:(void (^ _Nonnull)(NSError * _Nullable))completion {
	[self->_viewer openFileAtPath:filePath completion:^(NSError * _Nullable error) {
		completion(error);
	}];
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
											userInfo:@{@"message":@"file does not exists"}]);
		}
	 });
}

- (void)getMimeTypeForPath:(NSString *)filePath completion:(void (^)(NSString *, NSError *))completion {
	dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
		NSString *mimeType = [self getFileMIMEType: [filePath lastPathComponent]];
		if (mimeType) {
			completion(mimeType, nil);
		} else {
			completion(nil, [NSError errorWithDomain:FILES_ERROR_DOMAIN
												code:1
												userInfo:@{@"message":@"Could not determine MIME type"}]);
		}
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


- (void)uploadFileAtPath:(NSString *)filePath
				   toUrl:(NSString *)urlString
			 withHeaders:(NSDictionary<NSString *, NSString *> *)headers
			  completion:(void (^)(NSNumber *, NSError *))completion {
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
														NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse*)response;
														completion([NSNumber numberWithInteger:httpResponse.statusCode], nil);
													}];
		[task resume];
	});
}

- (void)downloadFileFromUrl:(NSString *)urlString
					forName:(NSString *)fileName
				withHeaders:(NSDictionary<NSString *, NSString *> *)headers
				 completion:(void (^)(NSString * filePath, NSError * error))completion {
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
                if (error){
					completion(nil, error);
                    return;
                }
				if ([httpResponse statusCode] == 200) {
                    NSError *error = nil;
					NSString *encryptedPath = [TUTFileUtil getEncryptedFolder: &error];
                    if (error) {
						completion(nil, error);
                        return;
                    }
                    NSString *filePath = [encryptedPath stringByAppendingPathComponent:fileName];
					[data writeToFile:filePath options: NSDataWritingAtomic error:&error];
					if (!error) {
						completion(filePath, nil);
					} else {
						completion(nil, error);
					}
				} else {
					NSString *message = [NSString stringWithFormat:@"Response code: %ld", (long) httpResponse.statusCode];
					NSError *error = [NSError errorWithDomain:FILES_ERROR_DOMAIN code:15 userInfo:@{@"message":message}];
					completion(nil, error);
				}
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
}


-(void) clearDirectory:(NSString*) dirToDelete {
	NSFileManager *fileManager = [NSFileManager defaultManager];
	NSError* error;
	NSArray *files = [fileManager contentsOfDirectoryAtPath:dirToDelete
													  error:&error];
	if (error) {
		return;
	}

	for (NSString *file in files) {
		[fileManager removeItemAtPath:[dirToDelete stringByAppendingPathComponent:file]
								error:&error];
	}
}

@end


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

#import "CDVFile.h"
#import "CDVLocalFilesystem.h"
#import <objc/message.h>

static NSString* toBase64(NSData* data) {
    SEL s1 = NSSelectorFromString(@"cdv_base64EncodedString");
    SEL s2 = NSSelectorFromString(@"base64EncodedString");
    SEL s3 = NSSelectorFromString(@"base64EncodedStringWithOptions:");

    if ([data respondsToSelector:s1]) {
        NSString* (*func)(id, SEL) = (void *)[data methodForSelector:s1];
        return func(data, s1);
    } else if ([data respondsToSelector:s2]) {
        NSString* (*func)(id, SEL) = (void *)[data methodForSelector:s2];
        return func(data, s2);
    } else if ([data respondsToSelector:s3]) {
        NSString* (*func)(id, SEL, NSUInteger) = (void *)[data methodForSelector:s3];
        return func(data, s3, 0);
    } else {
        return nil;
    }
}

CDVFile *filePlugin = nil;

extern NSString * const NSURLIsExcludedFromBackupKey __attribute__((weak_import));

#ifndef __IPHONE_5_1
    NSString* const NSURLIsExcludedFromBackupKey = @"NSURLIsExcludedFromBackupKey";
#endif

NSString* const kCDVFilesystemURLPrefix = @"cdvfile";

@implementation CDVFilesystemURL
@synthesize url=_url;
@synthesize fileSystemName=_fileSystemName;
@synthesize fullPath=_fullPath;

- (id) initWithString:(NSString *)strURL
{
    if ( self = [super init] ) {
        NSURL *decodedURL = [NSURL URLWithString:strURL];
        return [self initWithURL:decodedURL];
    }
    return nil;
}

-(id) initWithURL:(NSURL *)URL
{
    if ( self = [super init] ) {
        _url = URL;
        _fileSystemName = [self filesystemNameForLocalURI:URL];
        _fullPath = [self fullPathForLocalURI:URL];
    }
    return self;
}

/*
 * IN
 *  NSString localURI
 * OUT
 *  NSString FileSystem Name for this URI, or nil if it is not recognized.
 */
- (NSString *)filesystemNameForLocalURI:(NSURL *)uri
{
    if ([[uri scheme] isEqualToString:kCDVFilesystemURLPrefix] && [[uri host] isEqualToString:@"localhost"]) {
        NSArray *pathComponents = [uri pathComponents];
        if (pathComponents != nil && pathComponents.count > 1) {
            return [pathComponents objectAtIndex:1];
        }
    }
    return nil;
}

/*
 * IN
 *  NSString localURI
 * OUT
 *  NSString fullPath component suitable for an Entry object.
 * The incoming URI should be properly escaped. The returned fullPath is unescaped.
 */
- (NSString *)fullPathForLocalURI:(NSURL *)uri
{
    if ([[uri scheme] isEqualToString:kCDVFilesystemURLPrefix] && [[uri host] isEqualToString:@"localhost"]) {
        NSString *path = [uri path];
        if ([uri query]) {
            path = [NSString stringWithFormat:@"%@?%@", path, [uri query]];
        }
        NSRange slashRange = [path rangeOfString:@"/" options:0 range:NSMakeRange(1, path.length-1)];
        if (slashRange.location == NSNotFound) {
            return @"";
        }
        return [path substringFromIndex:slashRange.location];
    }
    return nil;
}

+ (CDVFilesystemURL *)fileSystemURLWithString:(NSString *)strURL
{
    return [[CDVFilesystemURL alloc] initWithString:strURL];
}

+ (CDVFilesystemURL *)fileSystemURLWithURL:(NSURL *)URL
{
    return [[CDVFilesystemURL alloc] initWithURL:URL];
}

- (NSString *)absoluteURL
{
    return [NSString stringWithFormat:@"cdvfile://localhost/%@%@", self.fileSystemName, self.fullPath];
}

@end

@implementation CDVFilesystemURLProtocol

+ (BOOL)canInitWithRequest:(NSURLRequest*)request
{
    NSURL* url = [request URL];
    return [[url scheme] isEqualToString:kCDVFilesystemURLPrefix];
}

+ (NSURLRequest*)canonicalRequestForRequest:(NSURLRequest*)request
{
    return request;
}

+ (BOOL)requestIsCacheEquivalent:(NSURLRequest*)requestA toRequest:(NSURLRequest*)requestB
{
    return [[[requestA URL] resourceSpecifier] isEqualToString:[[requestB URL] resourceSpecifier]];
}

- (void)startLoading
{
    CDVFilesystemURL* url = [CDVFilesystemURL fileSystemURLWithURL:[[self request] URL]];
    NSObject<CDVFileSystem> *fs = [filePlugin filesystemForURL:url];
    [fs readFileAtURL:url start:0 end:-1 callback:^void(NSData *data, NSString *mimetype, CDVFileError error) {
        NSMutableDictionary* responseHeaders = [[NSMutableDictionary alloc] init];
        responseHeaders[@"Cache-Control"] = @"no-cache";

        if (!error) {
            responseHeaders[@"Content-Type"] = mimetype;
            NSURLResponse *response = [[NSHTTPURLResponse alloc] initWithURL:url.url statusCode:200 HTTPVersion:@"HTTP/1.1"headerFields:responseHeaders];
            [[self client] URLProtocol:self didReceiveResponse:response cacheStoragePolicy:NSURLCacheStorageNotAllowed];
            [[self client] URLProtocol:self didLoadData:data];
            [[self client] URLProtocolDidFinishLoading:self];
        } else {
            NSURLResponse *response = [[NSHTTPURLResponse alloc] initWithURL:url.url statusCode:404 HTTPVersion:@"HTTP/1.1"headerFields:responseHeaders];
            [[self client] URLProtocol:self didReceiveResponse:response cacheStoragePolicy:NSURLCacheStorageNotAllowed];
            [[self client] URLProtocolDidFinishLoading:self];
        }
    }];
}

- (void)stopLoading
{}

- (NSCachedURLResponse *)connection:(NSURLConnection *)connection
                  willCacheResponse:(NSCachedURLResponse*)cachedResponse {
    return nil;
}

@end


@implementation CDVFile

@synthesize appDocsPath, appDataPath, appSupportPath, appTempPath, appCachePath, userHasAllowed, fileSystems=fileSystems_;

- (void)registerFilesystem:(NSObject<CDVFileSystem> *)fs {
    __weak CDVFile* weakSelf = self;
    SEL sel = NSSelectorFromString(@"urlTransformer");
    // for backwards compatibility - we check if this property is there
    // we create a wrapper block because the urlTransformer property
    // on the commandDelegate might be set dynamically at a future time
    // (and not dependent on plugin loading order)
    if ([self.commandDelegate respondsToSelector:sel]) {
        fs.urlTransformer = ^NSURL*(NSURL* urlToTransform) {
            // grab the block from the commandDelegate
            NSURL* (^urlTransformer)(NSURL*) = ((id(*)(id, SEL))objc_msgSend)(weakSelf.commandDelegate, sel);
            // if block is not null, we call it
            if (urlTransformer) {
                return urlTransformer(urlToTransform);
            } else { // else we return the same url
                return urlToTransform;
            }
        };
    }
    [fileSystems_ addObject:fs];
}

- (NSObject<CDVFileSystem> *)fileSystemByName:(NSString *)fsName
{
    if (self.fileSystems != nil) {
        for (NSObject<CDVFileSystem> *fs in self.fileSystems) {
            if ([fs.name isEqualToString:fsName]) {
                return fs;
            }
        }
    }
    return nil;

}

- (NSObject<CDVFileSystem> *)filesystemForURL:(CDVFilesystemURL *)localURL {
    if (localURL.fileSystemName == nil) return nil;
    @try {
        return [self fileSystemByName:localURL.fileSystemName];
    }
    @catch (NSException *e) {
        return nil;
    }
}

- (NSArray *)getExtraFileSystemsPreference:(NSWindowController *)vc
{
    NSString *filesystemsStr = nil;
    if([self.viewController isKindOfClass:[CDVViewController class]]) {
        CDVViewController *vc = self.viewController;
        NSDictionary *settings = [vc settings];
        filesystemsStr = [settings[CDV_PREF_EXTRA_FILESYSTEM] lowercaseString];
    }
    if (!filesystemsStr) {
        filesystemsStr = CDV_FILESYSTEMS_DEFAULT;
    }
    return [filesystemsStr componentsSeparatedByString:@","];
}

- (void)makeNonSyncable:(NSString*)path {
    [[NSFileManager defaultManager] createDirectoryAtPath:path
              withIntermediateDirectories:YES
                               attributes:nil
                                    error:nil];
    NSURL* url = [NSURL fileURLWithPath:path];
    [url setResourceValue: [NSNumber numberWithBool: YES]
                   forKey: NSURLIsExcludedFromBackupKey error:nil];

}

- (void)registerExtraFileSystems:(NSArray *)filesystems fromAvailableSet:(NSDictionary *)availableFileSystems
{
    NSMutableSet *installedFilesystems = [[NSMutableSet alloc] initWithCapacity:7];

    /* Register filesystems in order */
    for (NSString *fsName in filesystems) {
        if (![installedFilesystems containsObject:fsName]) {
            NSString *fsRoot = availableFileSystems[fsName];
            if (fsRoot) {
                [filePlugin registerFilesystem:[[CDVLocalFilesystem alloc] initWithName:fsName root:fsRoot]];
                [installedFilesystems addObject:fsName];
            } else {
                NSLog(@"Unrecognized extra filesystem identifier: %@", fsName);
            }
        }
    }
}

- (NSDictionary *)getAvailableFileSystems
{
    return @{
        @"documents": self.appDocsPath,
        @"cache": self.appCachePath,
        @"bundle": [[NSBundle mainBundle] bundlePath],
        @"root": @"/"
    };
}

- (void)pluginInitialize
{   filePlugin = self;
    [NSURLProtocol registerClass:[CDVFilesystemURLProtocol class]];

    fileSystems_ = [[NSMutableArray alloc] initWithCapacity:3];

    // Get the Temporary directory path
    self.appTempPath = [NSTemporaryDirectory()stringByStandardizingPath];   // remove trailing slash from NSTemporaryDirectory()
    [self registerFilesystem:[[CDVLocalFilesystem alloc] initWithName:@"temporary" root:self.appTempPath]];

    // ~/Library/Application Support/<bundle-id>
    self.appSupportPath = [self getSupportDirectoryFor:NSApplicationSupportDirectory pathComponents:nil];

    // ~/Library/Application Support/<bundle-id>/files
    self.appDataPath = [self getSupportDirectoryFor:NSApplicationSupportDirectory pathComponents:@[@"files"]];
    [self registerFilesystem:[[CDVLocalFilesystem alloc] initWithName:@"persistent" root:self.appDataPath]];

    // ~/Documents/
    self.appDocsPath = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES)[0];

    // ~/Library/Caches/<bundle-id>/files
    self.appCachePath = [self getSupportDirectoryFor:NSCachesDirectory pathComponents:nil];

    [self registerExtraFileSystems:[self getExtraFileSystemsPreference:self.viewController]
                  fromAvailableSet:[self getAvailableFileSystems]];
}

- (NSString*) getSupportDirectoryFor: (NSSearchPathDirectory) directory pathComponents: (NSArray*) components  {
    NSError* error;
    NSFileManager* fm = [NSFileManager defaultManager];
    NSURL* supportDir = [fm URLForDirectory:directory inDomain:NSUserDomainMask appropriateForURL:nil create:YES error:&error];
    if (supportDir == nil) {
        NSLog(@"unable to get support directory: %@", error);
        return nil;
    }

    NSString* bundleID = [[NSBundle mainBundle] bundleIdentifier];
    NSURL *dirPath = [supportDir URLByAppendingPathComponent:bundleID];
    for (NSString* pathComponent in components) {
        dirPath = [dirPath URLByAppendingPathComponent:pathComponent];
    }

    if (![fm fileExistsAtPath:dirPath.path]) {
        if (![fm createDirectoryAtURL:dirPath withIntermediateDirectories:YES attributes:nil error:&error]) {
            NSLog(@"unable to create support directory: %@", error);
            return nil;
        }
    }
    return dirPath.path;
}


- (CDVFilesystemURL *)fileSystemURLforArg:(NSString *)urlArg
{
    CDVFilesystemURL* ret = nil;
    if ([urlArg hasPrefix:@"file://"]) {
        /* This looks like a file url. Get the path, and see if any handlers recognize it. */
        NSURL *fileURL = [NSURL URLWithString:urlArg];
        NSURL *resolvedFileURL = [fileURL URLByResolvingSymlinksInPath];
        NSString *path = [resolvedFileURL path];
        ret = [self fileSystemURLforLocalPath:path];
    } else {
        ret = [CDVFilesystemURL fileSystemURLWithString:urlArg];
    }
    return ret;
}

- (CDVFilesystemURL *)fileSystemURLforLocalPath:(NSString *)localPath
{
    CDVFilesystemURL *localURL = nil;
    NSUInteger shortestFullPath = 0;

    // Try all installed filesystems, in order. Return the most match url.
    for (id object in self.fileSystems) {
        if ([object respondsToSelector:@selector(URLforFilesystemPath:)]) {
            CDVFilesystemURL *url = [object URLforFilesystemPath:localPath];
            if (url){
                // A shorter fullPath would imply that the filesystem is a better match for the local path
                if (!localURL || ([[url fullPath] length] < shortestFullPath)) {
                    localURL = url;
                    shortestFullPath = [[url fullPath] length];
                }
            }
        }
    }
    return localURL;
}

- (NSNumber*)checkFreeDiskSpace:(NSString*)appPath
{
    NSFileManager* fMgr = [[NSFileManager alloc] init];

    NSError* __autoreleasing pError = nil;

    NSDictionary* pDict = [fMgr attributesOfFileSystemForPath:appPath error:&pError];
    NSNumber* pNumAvail = (NSNumber*)[pDict objectForKey:NSFileSystemFreeSize];

    return pNumAvail;
}

/* Request the File System info
 *
 * IN:
 * arguments[0] - type (number as string)
 *	TEMPORARY = 0, PERSISTENT = 1;
 * arguments[1] - size
 *
 * OUT:
 *	Dictionary representing FileSystem object
 *		name - the human readable directory name
 *		root = DirectoryEntry object
 *			bool isDirectory
 *			bool isFile
 *			string name
 *			string fullPath
 *			fileSystem = FileSystem object - !! ignored because creates circular reference !!
 */

- (void)requestFileSystem:(CDVInvokedUrlCommand*)command
{
    // arguments
    NSString* strType = [command argumentAtIndex:0];
    unsigned long long size = [[command argumentAtIndex:1] longLongValue];

    int type = [strType intValue];
    CDVPluginResult* result = nil;

    if (type > self.fileSystems.count) {
        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsInt:NOT_FOUND_ERR];
        NSLog(@"No filesystem of type requested");
    } else {
        NSString* fullPath = @"/";
        // check for avail space for size request
        NSNumber* pNumAvail = [self checkFreeDiskSpace:self.appSupportPath];
        // NSLog(@"Free space: %@", [NSString stringWithFormat:@"%qu", [ pNumAvail unsignedLongLongValue ]]);
        if (pNumAvail && ([pNumAvail unsignedLongLongValue] < size)) {
            result = [CDVPluginResult resultWithStatus:CDVCommandStatus_IO_EXCEPTION messageAsInt:QUOTA_EXCEEDED_ERR];
        } else {
            NSObject<CDVFileSystem> *rootFs = [self.fileSystems objectAtIndex:type];
            if (rootFs == nil) {
                result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsInt:NOT_FOUND_ERR];
                NSLog(@"No filesystem of type requested");
            } else {
                NSMutableDictionary* fileSystem = [NSMutableDictionary dictionaryWithCapacity:2];
                [fileSystem setObject:rootFs.name forKey:@"name"];
                NSDictionary* dirEntry = [self makeEntryForPath:fullPath fileSystemName:rootFs.name isDirectory:YES];
                [fileSystem setObject:dirEntry forKey:@"root"];
                result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:fileSystem];
            }
        }
    }
    [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}


- (void)requestAllFileSystems:(CDVInvokedUrlCommand*)command
{
    NSMutableArray* ret = [[NSMutableArray alloc] init];
    for (NSObject<CDVFileSystem>* root in fileSystems_) {
        [ret addObject:[self makeEntryForPath:@"/" fileSystemName:root.name isDirectory:YES]];
    }
    CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsArray:ret];
    [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}

- (void)requestAllPaths:(CDVInvokedUrlCommand*)command
{
    NSDictionary* ret = @{
        @"applicationDirectory": [[NSURL fileURLWithPath:[[NSBundle mainBundle] resourcePath]] absoluteString],
        @"applicationStorageDirectory": [[NSURL fileURLWithPath:self.appSupportPath] absoluteString],
        @"dataDirectory": [[NSURL fileURLWithPath:self.appDataPath] absoluteString],
        @"documentsDirectory": [[NSURL fileURLWithPath:self.appDocsPath] absoluteString],
        @"cacheDirectory": [[NSURL fileURLWithPath:self.appCachePath] absoluteString],
        @"tempDirectory":[[NSURL fileURLWithPath:self.appTempPath] absoluteString],
        @"rootDirectory": @"file:///",
    };

    CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:ret];
    [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}

/* Creates and returns a dictionary representing an Entry Object
 *
 * IN:
 * NSString* fullPath of the entry
 * int fsType - FileSystem type
 * BOOL isDirectory - YES if this is a directory, NO if is a file
 * OUT:
 * NSDictionary* Entry object
 *		bool as NSNumber isDirectory
 *		bool as NSNumber isFile
 *		NSString*  name - last part of path
 *		NSString* fullPath
 *		NSString* filesystemName - FileSystem name -- actual filesystem will be created on the JS side if necessary, to avoid
 *         creating circular reference (FileSystem contains DirectoryEntry which contains FileSystem.....!!)
 */
- (NSDictionary*)makeEntryForPath:(NSString*)fullPath fileSystemName:(NSString *)fsName isDirectory:(BOOL)isDir
{
    NSObject<CDVFileSystem> *fs = [self fileSystemByName:fsName];
    return [fs makeEntryForPath:fullPath isDirectory:isDir];
}

- (NSDictionary *)makeEntryForLocalURL:(CDVFilesystemURL *)localURL
{
    NSObject<CDVFileSystem> *fs = [self filesystemForURL:localURL];
    return [fs makeEntryForLocalURL:localURL];
}

- (NSDictionary *)makeEntryForURL:(NSURL *)URL
{
    CDVFilesystemURL* fsURL = [self fileSystemURLforArg:[URL absoluteString]];
    return [self makeEntryForLocalURL:fsURL];
}

/*
 * Given a URI determine the File System information associated with it and return an appropriate W3C entry object
 * IN
 *	NSString* localURI: Should be an escaped local filesystem URI
 * OUT
 *	Entry object
 *		bool isDirectory
 *		bool isFile
 *		string name
 *		string fullPath
 *		fileSystem = FileSystem object - !! ignored because creates circular reference FileSystem contains DirectoryEntry which contains FileSystem.....!!
 */
- (void)resolveLocalFileSystemURI:(CDVInvokedUrlCommand*)command
{
    // arguments
    NSString* localURIstr = [command argumentAtIndex:0];
    CDVPluginResult* result;

    localURIstr = [self encodePath:localURIstr]; //encode path before resolving
    CDVFilesystemURL* inputURI = [self fileSystemURLforArg:localURIstr];

    if (inputURI == nil || inputURI.fileSystemName == nil) {
        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsInt:ENCODING_ERR];
    } else {
        NSObject<CDVFileSystem> *fs = [self filesystemForURL:inputURI];
        if (fs == nil) {
            result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsInt:ENCODING_ERR];
        } else {
            result = [fs entryForLocalURI:inputURI];
        }
    }
    [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}

//encode path with percent escapes
-(NSString *)encodePath:(NSString *)path
{
    NSString *decodedPath = [path stringByReplacingPercentEscapesUsingEncoding:NSUTF8StringEncoding]; //decode incase it's already encoded to avoid encoding twice
    return [decodedPath stringByAddingPercentEscapesUsingEncoding:NSUTF8StringEncoding];
}


/* Part of DirectoryEntry interface,  creates or returns the specified directory
 * IN:
 *	NSString* localURI - local filesystem URI for this directory
 *	NSString* path - directory to be created/returned; may be full path or relative path
 *	NSDictionary* - Flags object
 *		boolean as NSNumber create -
 *			if create is true and directory does not exist, create dir and return directory entry
 *			if create is true and exclusive is true and directory does exist, return error
 *			if create is false and directory does not exist, return error
 *			if create is false and the path represents a file, return error
 *		boolean as NSNumber exclusive - used in conjunction with create
 *			if exclusive is true and create is true - specifies failure if directory already exists
 *
 *
 */
- (void)getDirectory:(CDVInvokedUrlCommand*)command
{
    NSMutableArray* arguments = [NSMutableArray arrayWithArray:command.arguments];
    NSMutableDictionary* options = nil;

    if ([arguments count] >= 3) {
        options = [command argumentAtIndex:2 withDefault:nil];
    }
    // add getDir to options and call getFile()
    if (options != nil) {
        options = [NSMutableDictionary dictionaryWithDictionary:options];
    } else {
        options = [NSMutableDictionary dictionaryWithCapacity:1];
    }
    [options setObject:[NSNumber numberWithInt:1] forKey:@"getDir"];
    if ([arguments count] >= 3) {
        [arguments replaceObjectAtIndex:2 withObject:options];
    } else {
        [arguments addObject:options];
    }
    CDVInvokedUrlCommand* subCommand =
        [[CDVInvokedUrlCommand alloc] initWithArguments:arguments
                                             callbackId:command.callbackId
                                              className:command.className
                                             methodName:command.methodName];

    [self getFile:subCommand];
}

/* Part of DirectoryEntry interface,  creates or returns the specified file
 * IN:
 *	NSString* baseURI - local filesytem URI for the base directory to search
 *	NSString* requestedPath - file to be created/returned; may be absolute path or relative path
 *	NSDictionary* options - Flags object
 *		boolean as NSNumber create -
 *			if create is true and file does not exist, create file and return File entry
 *			if create is true and exclusive is true and file does exist, return error
 *			if create is false and file does not exist, return error
 *			if create is false and the path represents a directory, return error
 *		boolean as NSNumber exclusive - used in conjunction with create
 *			if exclusive is true and create is true - specifies failure if file already exists
 */
- (void)getFile:(CDVInvokedUrlCommand*)command
{
    NSString* baseURIstr = [command argumentAtIndex:0];
    CDVFilesystemURL* baseURI = [self fileSystemURLforArg:baseURIstr];
    NSString* requestedPath = [command argumentAtIndex:1];
    NSDictionary* options = [command argumentAtIndex:2 withDefault:nil];

    NSObject<CDVFileSystem> *fs = [self filesystemForURL:baseURI];
    CDVPluginResult* result = [fs getFileForURL:baseURI requestedPath:requestedPath options:options];


    [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}

/*
 * Look up the parent Entry containing this Entry.
 * If this Entry is the root of its filesystem, its parent is itself.
 * IN:
 * NSArray* arguments
 *	0 - NSString* localURI
 * NSMutableDictionary* options
 *	empty
 */
- (void)getParent:(CDVInvokedUrlCommand*)command
{
    // arguments are URL encoded
    CDVFilesystemURL* localURI = [self fileSystemURLforArg:command.arguments[0]];

    NSObject<CDVFileSystem> *fs = [self filesystemForURL:localURI];
    CDVPluginResult* result = [fs getParentForURL:localURI];

    [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}

/*
 * set MetaData of entry
 * Currently we only support "com.apple.MobileBackup" (boolean)
 */
- (void)setMetadata:(CDVInvokedUrlCommand*)command
{
    // arguments
    CDVFilesystemURL* localURI = [self fileSystemURLforArg:command.arguments[0]];
    NSDictionary* options = [command argumentAtIndex:1 withDefault:nil];
    NSObject<CDVFileSystem> *fs = [self filesystemForURL:localURI];
    CDVPluginResult* result = [fs setMetadataForURL:localURI withObject:options];

    [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}

/* removes the directory or file entry
 * IN:
 * NSArray* arguments
 *	0 - NSString* localURI
 *
 * returns NO_MODIFICATION_ALLOWED_ERR  if is top level directory or no permission to delete dir
 * returns INVALID_MODIFICATION_ERR if is non-empty dir or asset library file
 * returns NOT_FOUND_ERR if file or dir is not found
*/
- (void)remove:(CDVInvokedUrlCommand*)command
{
    // arguments
    CDVFilesystemURL* localURI = [self fileSystemURLforArg:command.arguments[0]];
    CDVPluginResult* result = nil;

    if ([localURI.fullPath isEqualToString:@""]) {
        // error if try to remove top level (documents or tmp) dir
        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_IO_EXCEPTION messageAsInt:NO_MODIFICATION_ALLOWED_ERR];
    } else {
        NSObject<CDVFileSystem> *fs = [self filesystemForURL:localURI];
        result = [fs removeFileAtURL:localURI];
    }
    [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}

/* recursively removes the directory
 * IN:
 * NSArray* arguments
 *	0 - NSString* localURI
 *
 * returns NO_MODIFICATION_ALLOWED_ERR  if is top level directory or no permission to delete dir
 * returns NOT_FOUND_ERR if file or dir is not found
 */
- (void)removeRecursively:(CDVInvokedUrlCommand*)command
{
    // arguments
    CDVFilesystemURL* localURI = [self fileSystemURLforArg:command.arguments[0]];
    CDVPluginResult* result = nil;

    if ([localURI.fullPath isEqualToString:@""]) {
        // error if try to remove top level (documents or tmp) dir
        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_IO_EXCEPTION messageAsInt:NO_MODIFICATION_ALLOWED_ERR];
    } else {
        NSObject<CDVFileSystem> *fs = [self filesystemForURL:localURI];
        result = [fs recursiveRemoveFileAtURL:localURI];
    }
    [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}

- (void)copyTo:(CDVInvokedUrlCommand*)command
{
    [self doCopyMove:command isCopy:YES];
}

- (void)moveTo:(CDVInvokedUrlCommand*)command
{
    [self doCopyMove:command isCopy:NO];
}

/* Copy/move a file or directory to a new location
 * IN:
 * NSArray* arguments
 *	0 - NSString* URL of entry to copy
 *  1 - NSString* URL of the directory into which to copy/move the entry
 *  2 - Optionally, the new name of the entry, defaults to the current name
 *	BOOL - bCopy YES if copy, NO if move
 */
- (void)doCopyMove:(CDVInvokedUrlCommand*)command isCopy:(BOOL)bCopy
{
    NSArray* arguments = command.arguments;

    // arguments
    NSString* srcURLstr = [command argumentAtIndex:0];
    NSString* destURLstr = [command argumentAtIndex:1];

    CDVPluginResult *result;

    if (!srcURLstr || !destURLstr) {
        // either no source or no destination provided
        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_IO_EXCEPTION messageAsInt:NOT_FOUND_ERR];
        [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
        return;
    }

    CDVFilesystemURL* srcURL = [self fileSystemURLforArg:srcURLstr];
    CDVFilesystemURL* destURL = [self fileSystemURLforArg:destURLstr];

    NSObject<CDVFileSystem> *srcFs = [self filesystemForURL:srcURL];
    NSObject<CDVFileSystem> *destFs = [self filesystemForURL:destURL];

    // optional argument; use last component from srcFullPath if new name not provided
    NSString* newName = ([arguments count] > 2) ? [command argumentAtIndex:2] : [srcURL.url lastPathComponent];
    if ([newName rangeOfString:@":"].location != NSNotFound) {
        // invalid chars in new name
        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_IO_EXCEPTION messageAsInt:ENCODING_ERR];
        [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
        return;
    }

    [destFs copyFileToURL:destURL withName:newName fromFileSystem:srcFs atURL:srcURL copy:bCopy callback:^(CDVPluginResult* result) {
        [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
    }];

}

- (void)getFileMetadata:(CDVInvokedUrlCommand*)command
{
    // arguments
    CDVFilesystemURL* localURI = [self fileSystemURLforArg:command.arguments[0]];
    NSObject<CDVFileSystem> *fs = [self filesystemForURL:localURI];

    [fs getFileMetadataForURL:localURI callback:^(CDVPluginResult* result) {
        [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
    }];
}

- (void)readEntries:(CDVInvokedUrlCommand*)command
{
    CDVFilesystemURL* localURI = [self fileSystemURLforArg:command.arguments[0]];
    NSObject<CDVFileSystem> *fs = [self filesystemForURL:localURI];
    CDVPluginResult *result = [fs readEntriesAtURL:localURI];

    [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}

/* read and return file data
 * IN:
 * NSArray* arguments
 *	0 - NSString* fullPath
 *	1 - NSString* encoding
 *	2 - NSString* start
 *	3 - NSString* end
 */
- (void)readAsText:(CDVInvokedUrlCommand*)command
{
    // arguments
    CDVFilesystemURL* localURI = [self fileSystemURLforArg:command.arguments[0]];
    NSString* encoding = [command argumentAtIndex:1];
    NSInteger start = [[command argumentAtIndex:2] integerValue];
    NSInteger end = [[command argumentAtIndex:3] integerValue];

    NSObject<CDVFileSystem> *fs = [self filesystemForURL:localURI];

    if (fs == nil) {
        CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_IO_EXCEPTION messageAsInt:NOT_FOUND_ERR];
        [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
        return;
    }

    // TODO: implement
    if ([@"UTF-8" caseInsensitiveCompare : encoding] != NSOrderedSame) {
        NSLog(@"Only UTF-8 encodings are currently supported by readAsText");
        CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_IO_EXCEPTION messageAsInt:ENCODING_ERR];
        [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
        return;
    }

    [self.commandDelegate runInBackground:^ {
        [fs readFileAtURL:localURI start:start end:end callback:^(NSData* data, NSString* mimeType, CDVFileError errorCode) {
            CDVPluginResult* result = nil;
            if (data != nil) {
                NSString* str = [[NSString alloc] initWithBytesNoCopy:(void*)[data bytes] length:[data length] encoding:NSUTF8StringEncoding freeWhenDone:NO];
                // Check that UTF8 conversion did not fail.
                if (str != nil) {
                    result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:str];
                    result.associatedObject = data;
                } else {
                    errorCode = ENCODING_ERR;
                }
            }
            if (result == nil) {
                result = [CDVPluginResult resultWithStatus:CDVCommandStatus_IO_EXCEPTION messageAsInt:errorCode];
            }

            [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
        }];
    }];
}

/* Read content of text file and return as base64 encoded data url.
 * IN:
 * NSArray* arguments
 *	0 - NSString* fullPath
 *	1 - NSString* start
 *	2 - NSString* end
 *
 * Determines the mime type from the file extension, returns ENCODING_ERR if mimetype can not be determined.
 */

- (void)readAsDataURL:(CDVInvokedUrlCommand*)command
{
    CDVFilesystemURL* localURI = [self fileSystemURLforArg:command.arguments[0]];
    NSInteger start = [[command argumentAtIndex:1] integerValue];
    NSInteger end = [[command argumentAtIndex:2] integerValue];

    NSObject<CDVFileSystem> *fs = [self filesystemForURL:localURI];

    [self.commandDelegate runInBackground:^ {
        [fs readFileAtURL:localURI start:start end:end callback:^(NSData* data, NSString* mimeType, CDVFileError errorCode) {
            CDVPluginResult* result = nil;
            if (data != nil) {
                NSString* b64Str = toBase64(data);
                NSString* output = [NSString stringWithFormat:@"data:%@;base64,%@", mimeType, b64Str];
                result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:output];
            } else {
                result = [CDVPluginResult resultWithStatus:CDVCommandStatus_IO_EXCEPTION messageAsInt:errorCode];
            }

            [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
        }];
    }];
}

/* Read content of text file and return as an arraybuffer
 * IN:
 * NSArray* arguments
 *	0 - NSString* fullPath
 *	1 - NSString* start
 *	2 - NSString* end
 */

- (void)readAsArrayBuffer:(CDVInvokedUrlCommand*)command
{
    CDVFilesystemURL* localURI = [self fileSystemURLforArg:command.arguments[0]];
    NSInteger start = [[command argumentAtIndex:1] integerValue];
    NSInteger end = [[command argumentAtIndex:2] integerValue];

    NSObject<CDVFileSystem> *fs = [self filesystemForURL:localURI];

    [self.commandDelegate runInBackground:^ {
        [fs readFileAtURL:localURI start:start end:end callback:^(NSData* data, NSString* mimeType, CDVFileError errorCode) {
            CDVPluginResult* result = nil;
            if (data != nil) {
                result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsArrayBuffer:data];
            } else {
                result = [CDVPluginResult resultWithStatus:CDVCommandStatus_IO_EXCEPTION messageAsInt:errorCode];
            }

            [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
        }];
    }];
}

- (void)readAsBinaryString:(CDVInvokedUrlCommand*)command
{
    CDVFilesystemURL* localURI = [self fileSystemURLforArg:command.arguments[0]];
    NSInteger start = [[command argumentAtIndex:1] integerValue];
    NSInteger end = [[command argumentAtIndex:2] integerValue];

    NSObject<CDVFileSystem> *fs = [self filesystemForURL:localURI];

    [self.commandDelegate runInBackground:^ {
        [fs readFileAtURL:localURI start:start end:end callback:^(NSData* data, NSString* mimeType, CDVFileError errorCode) {
            CDVPluginResult* result = nil;
            if (data != nil) {
                NSString* payload = [[NSString alloc] initWithBytesNoCopy:(void*)[data bytes] length:[data length] encoding:NSASCIIStringEncoding freeWhenDone:NO];
                result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:payload];
                result.associatedObject = data;
            } else {
                result = [CDVPluginResult resultWithStatus:CDVCommandStatus_IO_EXCEPTION messageAsInt:errorCode];
            }

            [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
        }];
    }];
}


- (void)truncate:(CDVInvokedUrlCommand*)command
{
    // arguments
    CDVFilesystemURL* localURI = [self fileSystemURLforArg:command.arguments[0]];
    unsigned long long pos = (unsigned long long)[[command argumentAtIndex:1] longLongValue];

    NSObject<CDVFileSystem> *fs = [self filesystemForURL:localURI];
    CDVPluginResult *result = [fs truncateFileAtURL:localURI atPosition:pos];

    [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}

/* write
 * IN:
 * NSArray* arguments
 *  0 - NSString* localURI of file to write to
 *  1 - NSString* or NSData* data to write
 *  2 - NSNumber* position to begin writing
 */
- (void)write:(CDVInvokedUrlCommand*)command
{
    [self.commandDelegate runInBackground:^ {
        NSString* callbackId = command.callbackId;

        // arguments
        CDVFilesystemURL* localURI = [self fileSystemURLforArg:command.arguments[0]];
        id argData = [command argumentAtIndex:1];
        unsigned long long pos = (unsigned long long)[[command argumentAtIndex:2] longLongValue];

        NSObject<CDVFileSystem> *fs = [self filesystemForURL:localURI];


        [fs truncateFileAtURL:localURI atPosition:pos];
        CDVPluginResult *result;
        if ([argData isKindOfClass:[NSString class]]) {
            NSData *encData = [argData dataUsingEncoding:NSUTF8StringEncoding allowLossyConversion:YES];
            result = [fs writeToFileAtURL:localURI withData:encData append:YES];
        } else if ([argData isKindOfClass:[NSData class]]) {
            result = [fs writeToFileAtURL:localURI withData:argData append:YES];
        } else {
            result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Invalid parameter type"];
        }
        [self.commandDelegate sendPluginResult:result callbackId:callbackId];
    }];
}

#pragma mark Methods for converting between URLs and paths

- (NSString *)filesystemPathForURL:(CDVFilesystemURL *)localURL
{
    for (NSObject<CDVFileSystem> *fs in self.fileSystems) {
        if ([fs.name isEqualToString:localURL.fileSystemName]) {
            if ([fs respondsToSelector:@selector(filesystemPathForURL:)]) {
                return [fs filesystemPathForURL:localURL];
            }
        }
    }
    return nil;
}

#pragma mark Undocumented Filesystem API

- (void)testFileExists:(CDVInvokedUrlCommand*)command
{
    // arguments
    NSString* argPath = [command argumentAtIndex:0];

    // Get the file manager
    NSFileManager* fMgr = [NSFileManager defaultManager];
    NSString* appFile = argPath; // [ self getFullPath: argPath];

    BOOL bExists = [fMgr fileExistsAtPath:appFile];
    CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsInt:(bExists ? 1 : 0)];

    [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}

- (void)testDirectoryExists:(CDVInvokedUrlCommand*)command
{
    // arguments
    NSString* argPath = [command argumentAtIndex:0];

    // Get the file manager
    NSFileManager* fMgr = [[NSFileManager alloc] init];
    NSString* appFile = argPath; // [self getFullPath: argPath];
    BOOL bIsDir = NO;
    BOOL bExists = [fMgr fileExistsAtPath:appFile isDirectory:&bIsDir];

    CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsInt:((bExists && bIsDir) ? 1 : 0)];

    [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}

// Returns number of bytes available via callback
- (void)getFreeDiskSpace:(CDVInvokedUrlCommand*)command
{
    // no arguments

    NSNumber* pNumAvail = [self checkFreeDiskSpace:self.appDocsPath];

    NSString* strFreeSpace = [NSString stringWithFormat:@"%qu", [pNumAvail unsignedLongLongValue]];
    // NSLog(@"Free space is %@", strFreeSpace );

    CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:strFreeSpace];

    [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}

#pragma mark Compatibility with older File API

- (NSString*)getMimeTypeFromPath:(NSString*)fullPath
{
    return [CDVLocalFilesystem getMimeTypeFromPath:fullPath];
}

- (NSDictionary *)getDirectoryEntry:(NSString *)localPath isDirectory:(BOOL)bDirRequest
{
    CDVFilesystemURL *localURL = [self fileSystemURLforLocalPath:localPath];
    return [self makeEntryForPath:localURL.fullPath fileSystemName:localURL.fileSystemName isDirectory:bDirRequest];
}

#pragma mark Internal methods for testing
// Internal methods for testing: Get the on-disk location of a local filesystem url.
// [Currently used for testing file-transfer]

- (void)_getLocalFilesystemPath:(CDVInvokedUrlCommand*)command
{
    CDVFilesystemURL* localURL = [self fileSystemURLforArg:command.arguments[0]];

    NSString* fsPath = [self filesystemPathForURL:localURL];
    CDVPluginResult* result;
    if (fsPath) {
        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:fsPath];
    } else {
        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Cannot resolve URL to a file"];
    }
    [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}

@end

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

#import <Foundation/Foundation.h>
#import <Cordova/CDVPlugin.h>

NSString* const kCDVFilesystemURLPrefix;

/**
* The default filesystems if non are specified.
*/
#define CDV_FILESYSTEMS_DEFAULT @"documents,cache,bundle,root"

/**
* Preference name of the extra filesystems to be "mounted". the following are supported:
* 'bundle'    - mounts the application directory
* 'documents' - mounts the users Documents directory (~/Documents)
* 'root'      - mounts the root file system
* 'cache'     - mounts the caches directory (~/Library/Caches/<bundle-id/)
*/
#define CDV_PREF_EXTRA_FILESYSTEM @"osxextrafilesystems"

enum CDVFileError {
    NO_ERROR = 0,
    NOT_FOUND_ERR = 1,
    SECURITY_ERR = 2,
    ABORT_ERR = 3,
    NOT_READABLE_ERR = 4,
    ENCODING_ERR = 5,
    NO_MODIFICATION_ALLOWED_ERR = 6,
    INVALID_STATE_ERR = 7,
    SYNTAX_ERR = 8,
    INVALID_MODIFICATION_ERR = 9,
    QUOTA_EXCEEDED_ERR = 10,
    TYPE_MISMATCH_ERR = 11,
    PATH_EXISTS_ERR = 12
};
typedef int CDVFileError;

@interface CDVFilesystemURL : NSObject  {
    NSURL *_url;
    NSString *_fileSystemName;
    NSString *_fullPath;
}

- (id) initWithString:(NSString*)strURL;
- (id) initWithURL:(NSURL*)URL;
+ (CDVFilesystemURL *)fileSystemURLWithString:(NSString *)strURL;
+ (CDVFilesystemURL *)fileSystemURLWithURL:(NSURL *)URL;

- (NSString *)absoluteURL;

@property (atomic) NSURL *url;
@property (atomic) NSString *fileSystemName;
@property (atomic) NSString *fullPath;

@end

@interface CDVFilesystemURLProtocol : NSURLProtocol
@end

@protocol CDVFileSystem
- (CDVPluginResult *)entryForLocalURI:(CDVFilesystemURL *)url;
- (CDVPluginResult *)getFileForURL:(CDVFilesystemURL *)baseURI requestedPath:(NSString *)requestedPath options:(NSDictionary *)options;
- (CDVPluginResult *)getParentForURL:(CDVFilesystemURL *)localURI;
- (CDVPluginResult *)setMetadataForURL:(CDVFilesystemURL *)localURI withObject:(NSDictionary *)options;
- (CDVPluginResult *)removeFileAtURL:(CDVFilesystemURL *)localURI;
- (CDVPluginResult *)recursiveRemoveFileAtURL:(CDVFilesystemURL *)localURI;
- (CDVPluginResult *)readEntriesAtURL:(CDVFilesystemURL *)localURI;
- (CDVPluginResult *)truncateFileAtURL:(CDVFilesystemURL *)localURI atPosition:(unsigned long long)pos;
- (CDVPluginResult *)writeToFileAtURL:(CDVFilesystemURL *)localURL withData:(NSData*)encData append:(BOOL)shouldAppend;
- (void)copyFileToURL:(CDVFilesystemURL *)destURL withName:(NSString *)newName fromFileSystem:(NSObject<CDVFileSystem> *)srcFs atURL:(CDVFilesystemURL *)srcURL copy:(BOOL)bCopy callback:(void (^)(CDVPluginResult *))callback;
- (void)readFileAtURL:(CDVFilesystemURL *)localURL start:(NSInteger)start end:(NSInteger)end callback:(void (^)(NSData*, NSString* mimeType, CDVFileError))callback;
- (void)getFileMetadataForURL:(CDVFilesystemURL *)localURL callback:(void (^)(CDVPluginResult *))callback;

- (NSDictionary *)makeEntryForLocalURL:(CDVFilesystemURL *)url;
- (NSDictionary*)makeEntryForPath:(NSString*)fullPath isDirectory:(BOOL)isDir;

@property (nonatomic,strong) NSString *name;
@property (nonatomic, copy) NSURL*(^urlTransformer)(NSURL*);

@optional
- (NSString *)filesystemPathForURL:(CDVFilesystemURL *)localURI;
- (CDVFilesystemURL *)URLforFilesystemPath:(NSString *)path;

@end

@interface CDVFile : CDVPlugin {
    NSString* rootDocsPath;
    NSString* appDocsPath;
    NSString* appLibraryPath;
    NSString* appTempPath;

    NSMutableArray* fileSystems_;
    BOOL userHasAllowed;
}

- (NSNumber*)checkFreeDiskSpace:(NSString*)appPath;
- (NSDictionary*)makeEntryForPath:(NSString*)fullPath fileSystemName:(NSString *)fsName isDirectory:(BOOL)isDir;
- (NSDictionary *)makeEntryForURL:(NSURL *)URL;
- (CDVFilesystemURL *)fileSystemURLforLocalPath:(NSString *)localPath;

- (NSObject<CDVFileSystem> *)filesystemForURL:(CDVFilesystemURL *)localURL;

/* Native Registration API */
- (void)registerFilesystem:(NSObject<CDVFileSystem> *)fs;
- (NSObject<CDVFileSystem> *)fileSystemByName:(NSString *)fsName;

/* Exec API */
- (void)requestFileSystem:(CDVInvokedUrlCommand*)command;
- (void)resolveLocalFileSystemURI:(CDVInvokedUrlCommand*)command;
- (void)getDirectory:(CDVInvokedUrlCommand*)command;
- (void)getFile:(CDVInvokedUrlCommand*)command;
- (void)getParent:(CDVInvokedUrlCommand*)command;
- (void)removeRecursively:(CDVInvokedUrlCommand*)command;
- (void)remove:(CDVInvokedUrlCommand*)command;
- (void)copyTo:(CDVInvokedUrlCommand*)command;
- (void)moveTo:(CDVInvokedUrlCommand*)command;
- (void)getFileMetadata:(CDVInvokedUrlCommand*)command;
- (void)readEntries:(CDVInvokedUrlCommand*)command;
- (void)readAsText:(CDVInvokedUrlCommand*)command;
- (void)readAsDataURL:(CDVInvokedUrlCommand*)command;
- (void)readAsArrayBuffer:(CDVInvokedUrlCommand*)command;
- (void)write:(CDVInvokedUrlCommand*)command;
- (void)testFileExists:(CDVInvokedUrlCommand*)command;
- (void)testDirectoryExists:(CDVInvokedUrlCommand*)command;
- (void)getFreeDiskSpace:(CDVInvokedUrlCommand*)command;
- (void)truncate:(CDVInvokedUrlCommand*)command;
- (void)doCopyMove:(CDVInvokedUrlCommand*)command isCopy:(BOOL)bCopy;

/* Compatibilty with older File API */
- (NSString*)getMimeTypeFromPath:(NSString*)fullPath;
- (NSDictionary *)getDirectoryEntry:(NSString *)target isDirectory:(BOOL)bDirRequest;

/* Conversion between filesystem paths and URLs */
- (NSString *)filesystemPathForURL:(CDVFilesystemURL *)URL;

/* Internal methods for testing */
- (void)_getLocalFilesystemPath:(CDVInvokedUrlCommand*)command;

/**
 * local path of the 'documents' file system (~/Documents)
 */
@property (nonatomic, strong) NSString* appDocsPath;

/**
* local path of the 'applicationStorageDirectory' file system (~/Library/Application Support/<bundle-id>)
*/
@property (nonatomic, strong) NSString* appSupportPath;

/**
* local path of the 'persistent' file system (~/Library/Application Support/<bundle-id>/files)
*/
@property (nonatomic, strong) NSString* appDataPath;

/**
* local path of the 'documents' file system (~/Documents)
*/
@property (nonatomic, strong) NSString* appTempPath;

/**
* local path of the 'cache' file system (~/Library/Caches/<bundle-id>)
*/
@property (nonatomic, strong) NSString* appCachePath;

/**
 * registered file systems
 */
@property (nonatomic, strong) NSMutableArray* fileSystems;

@property BOOL userHasAllowed;

@end

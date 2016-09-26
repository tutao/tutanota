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
#import <Cordova/CDV.h>
#import <MobileCoreServices/MobileCoreServices.h>
#import <sys/xattr.h>

@implementation CDVLocalFilesystem
@synthesize name=_name, fsRoot=_fsRoot, urlTransformer;

- (id) initWithName:(NSString *)name root:(NSString *)fsRoot
{
    if (self) {
        _name = name;
        _fsRoot = fsRoot;
    }
    return self;
}

/*
 * IN
 *  NSString localURI
 * OUT
 *  CDVPluginResult result containing a file or directoryEntry for the localURI, or an error if the
 *   URI represents a non-existent path, or is unrecognized or otherwise malformed.
 */
- (CDVPluginResult *)entryForLocalURI:(CDVFilesystemURL *)url
{
    CDVPluginResult* result = nil;
    NSDictionary* entry = [self makeEntryForLocalURL:url];
    if (entry) {
        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:entry];
    } else {
        // return NOT_FOUND_ERR
        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_IO_EXCEPTION messageAsInt:NOT_FOUND_ERR];
    }
    return result;
}
- (NSDictionary *)makeEntryForLocalURL:(CDVFilesystemURL *)url {
    NSString *path = [self filesystemPathForURL:url];
    NSFileManager* fileMgr = [[NSFileManager alloc] init];
    BOOL isDir = NO;
    // see if exists and is file or dir
    BOOL bExists = [fileMgr fileExistsAtPath:path isDirectory:&isDir];
    if (bExists) {
        return [self makeEntryForPath:url.fullPath isDirectory:isDir];
    } else {
        return nil;
    }
}
- (NSDictionary*)makeEntryForPath:(NSString*)fullPath isDirectory:(BOOL)isDir
{
    NSMutableDictionary* dirEntry = [NSMutableDictionary dictionaryWithCapacity:5];
    NSString* lastPart = [[self stripQueryParametersFromPath:fullPath] lastPathComponent];
    if (isDir && ![fullPath hasSuffix:@"/"]) {
        fullPath = [fullPath stringByAppendingString:@"/"];
    }
    [dirEntry setObject:[NSNumber numberWithBool:!isDir]  forKey:@"isFile"];
    [dirEntry setObject:[NSNumber numberWithBool:isDir]  forKey:@"isDirectory"];
    [dirEntry setObject:fullPath forKey:@"fullPath"];
    [dirEntry setObject:lastPart forKey:@"name"];
    [dirEntry setObject:self.name forKey: @"filesystemName"];
    
    NSURL* nativeURL = [NSURL fileURLWithPath:[self filesystemPathForFullPath:fullPath]];
    if (self.urlTransformer) {
        nativeURL = self.urlTransformer(nativeURL);
    }
    
    dirEntry[@"nativeURL"] = [nativeURL absoluteString];

    return dirEntry;
}

- (NSString *)stripQueryParametersFromPath:(NSString *)fullPath
{
    NSRange questionMark = [fullPath rangeOfString:@"?"];
    if (questionMark.location != NSNotFound) {
        return [fullPath substringWithRange:NSMakeRange(0,questionMark.location)];
    }
    return fullPath;
}

- (NSString *)filesystemPathForFullPath:(NSString *)fullPath
{
    NSString *path = nil;
    NSString *strippedFullPath = [self stripQueryParametersFromPath:fullPath];
    path = [NSString stringWithFormat:@"%@%@", self.fsRoot, strippedFullPath];
    if ([path length] > 1 && [path hasSuffix:@"/"]) {
      path = [path substringToIndex:([path length]-1)];
    }
    return path;
}
/*
 * IN
 *  NSString localURI
 * OUT
 *  NSString full local filesystem path for the represented file or directory, or nil if no such path is possible
 *  The file or directory does not necessarily have to exist. nil is returned if the filesystem type is not recognized,
 *  or if the URL is malformed.
 * The incoming URI should be properly escaped (no raw spaces, etc. URI percent-encoding is expected).
 */
- (NSString *)filesystemPathForURL:(CDVFilesystemURL *)url
{
    return [self filesystemPathForFullPath:url.fullPath];
}

- (CDVFilesystemURL *)URLforFullPath:(NSString *)fullPath
{
    if (fullPath) {
        NSString* escapedPath = [fullPath stringByAddingPercentEscapesUsingEncoding:NSUTF8StringEncoding];
        if ([fullPath hasPrefix:@"/"]) {
            return [CDVFilesystemURL fileSystemURLWithString:[NSString stringWithFormat:@"%@://localhost/%@%@", kCDVFilesystemURLPrefix, self.name, escapedPath]];
        }
        return [CDVFilesystemURL fileSystemURLWithString:[NSString stringWithFormat:@"%@://localhost/%@/%@", kCDVFilesystemURLPrefix, self.name, escapedPath]];
    }
    return nil;
}

- (CDVFilesystemURL *)URLforFilesystemPath:(NSString *)path
{
    return [self URLforFullPath:[self fullPathForFileSystemPath:path]];

}

- (NSString *)normalizePath:(NSString *)rawPath
{
    // If this is an absolute path, the first path component will be '/'. Skip it if that's the case
    BOOL isAbsolutePath = [rawPath hasPrefix:@"/"];
    if (isAbsolutePath) {
        rawPath = [rawPath substringFromIndex:1];
    }
    NSMutableArray *components = [NSMutableArray arrayWithArray:[rawPath pathComponents]];
    for (int index = 0; index < [components count]; ++index) {
        if ([[components objectAtIndex:index] isEqualToString:@".."]) {
            [components removeObjectAtIndex:index];
            if (index > 0) {
                [components removeObjectAtIndex:index-1];
                --index;
            }
        }
    }

    if (isAbsolutePath) {
        return [NSString stringWithFormat:@"/%@", [components componentsJoinedByString:@"/"]];
    } else {
        return [components componentsJoinedByString:@"/"];
    }


}

- (BOOL)valueForKeyIsNumber:(NSDictionary*)dict key:(NSString*)key
{
    BOOL bNumber = NO;
    NSObject* value = dict[key];
    if (value) {
        bNumber = [value isKindOfClass:[NSNumber class]];
    }
    return bNumber;
}

- (CDVPluginResult *)getFileForURL:(CDVFilesystemURL *)baseURI requestedPath:(NSString *)requestedPath options:(NSDictionary *)options
{
    CDVPluginResult* result = nil;
    BOOL bDirRequest = NO;
    BOOL create = NO;
    BOOL exclusive = NO;
    int errorCode = 0;  // !!! risky - no error code currently defined for 0

    if ([self valueForKeyIsNumber:options key:@"create"]) {
        create = [(NSNumber*)[options valueForKey:@"create"] boolValue];
    }
    if ([self valueForKeyIsNumber:options key:@"exclusive"]) {
        exclusive = [(NSNumber*)[options valueForKey:@"exclusive"] boolValue];
    }
    if ([self valueForKeyIsNumber:options key:@"getDir"]) {
        // this will not exist for calls directly to getFile but will have been set by getDirectory before calling this method
        bDirRequest = [(NSNumber*)[options valueForKey:@"getDir"] boolValue];
    }
    // see if the requested path has invalid characters - should we be checking for  more than just ":"?
    if ([requestedPath rangeOfString:@":"].location != NSNotFound) {
        errorCode = ENCODING_ERR;
    } else {
        // Build new fullPath for the requested resource.
        // We concatenate the two paths together, and then scan the resulting string to remove
        // parent ("..") references. Any parent references at the beginning of the string are
        // silently removed.
        NSString *combinedPath = [baseURI.fullPath stringByAppendingPathComponent:requestedPath];
        combinedPath = [self normalizePath:combinedPath];
        CDVFilesystemURL* requestedURL = [self URLforFullPath:combinedPath];
        
        NSFileManager* fileMgr = [[NSFileManager alloc] init];
        BOOL bIsDir;
        BOOL bExists = [fileMgr fileExistsAtPath:[self filesystemPathForURL:requestedURL] isDirectory:&bIsDir];
        if (bExists && (create == NO) && (bIsDir == !bDirRequest)) {
            // path exists and is not of requested type  - return TYPE_MISMATCH_ERR
            errorCode = TYPE_MISMATCH_ERR;
        } else if (!bExists && (create == NO)) {
            // path does not exist and create is false - return NOT_FOUND_ERR
            errorCode = NOT_FOUND_ERR;
        } else if (bExists && (create == YES) && (exclusive == YES)) {
            // file/dir already exists and exclusive and create are both true - return PATH_EXISTS_ERR
            errorCode = PATH_EXISTS_ERR;
        } else {
            // if bExists and create == YES - just return data
            // if bExists and create == NO  - just return data
            // if !bExists and create == YES - create and return data
            BOOL bSuccess = YES;
            NSError __autoreleasing* pError = nil;
            if (!bExists && (create == YES)) {
                if (bDirRequest) {
                    // create the dir
                    bSuccess = [fileMgr createDirectoryAtPath:[self filesystemPathForURL:requestedURL] withIntermediateDirectories:NO attributes:nil error:&pError];
                } else {
                    // create the empty file
                    bSuccess = [fileMgr createFileAtPath:[self filesystemPathForURL:requestedURL] contents:nil attributes:nil];
                }
            }
            if (!bSuccess) {
                errorCode = ABORT_ERR;
                if (pError) {
                    NSLog(@"error creating directory: %@", [pError localizedDescription]);
                }
            } else {
                // NSLog(@"newly created file/dir (%@) exists: %d", reqFullPath, [fileMgr fileExistsAtPath:reqFullPath]);
                // file existed or was created
                result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:[self makeEntryForPath:requestedURL.fullPath isDirectory:bDirRequest]];
            }
        } // are all possible conditions met?
    }

    if (errorCode > 0) {
        // create error callback
        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_IO_EXCEPTION messageAsInt:errorCode];
    }
    return result;

}

- (CDVPluginResult*)getParentForURL:(CDVFilesystemURL *)localURI
{
    CDVPluginResult* result = nil;
    CDVFilesystemURL *newURI = nil;
    if ([localURI.fullPath isEqualToString:@""]) {
        // return self
        newURI = localURI;
    } else {
        newURI = [CDVFilesystemURL fileSystemURLWithURL:[localURI.url URLByDeletingLastPathComponent]]; /* TODO: UGLY - FIX */
    }
    NSFileManager* fileMgr = [[NSFileManager alloc] init];
    BOOL bIsDir;
    BOOL bExists = [fileMgr fileExistsAtPath:[self filesystemPathForURL:newURI] isDirectory:&bIsDir];
    if (bExists) {
        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:[self makeEntryForPath:newURI.fullPath isDirectory:bIsDir]];
    } else {
        // invalid path or file does not exist
        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_IO_EXCEPTION messageAsInt:NOT_FOUND_ERR];
    }
    return result;
}

- (CDVPluginResult*)setMetadataForURL:(CDVFilesystemURL *)localURI withObject:(NSDictionary *)options
{
    BOOL ok = NO;

    NSString* filePath = [self filesystemPathForURL:localURI];
    // we only care about this iCloud key for now.
    // set to 1/true to skip backup, set to 0/false to back it up (effectively removing the attribute)
    NSString* iCloudBackupExtendedAttributeKey = @"com.apple.MobileBackup";
    id iCloudBackupExtendedAttributeValue = [options objectForKey:iCloudBackupExtendedAttributeKey];

    if ((iCloudBackupExtendedAttributeValue != nil) && [iCloudBackupExtendedAttributeValue isKindOfClass:[NSNumber class]]) {
        if (IsAtLeastiOSVersion(@"5.1")) {
            NSURL* url = [NSURL fileURLWithPath:filePath];
            NSError* __autoreleasing error = nil;

            ok = [url setResourceValue:[NSNumber numberWithBool:[iCloudBackupExtendedAttributeValue boolValue]] forKey:NSURLIsExcludedFromBackupKey error:&error];
        } else { // below 5.1 (deprecated - only really supported in 5.01)
            u_int8_t value = [iCloudBackupExtendedAttributeValue intValue];
            if (value == 0) { // remove the attribute (allow backup, the default)
                ok = (removexattr([filePath fileSystemRepresentation], [iCloudBackupExtendedAttributeKey cStringUsingEncoding:NSUTF8StringEncoding], 0) == 0);
            } else { // set the attribute (skip backup)
                ok = (setxattr([filePath fileSystemRepresentation], [iCloudBackupExtendedAttributeKey cStringUsingEncoding:NSUTF8StringEncoding], &value, sizeof(value), 0, 0) == 0);
            }
        }
    }

    if (ok) {
        return [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    } else {
        return [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR];
    }
}

/* remove the file or directory (recursively)
 * IN:
 * NSString* fullPath - the full path to the file or directory to be removed
 * NSString* callbackId
 * called from remove and removeRecursively - check all pubic api specific error conditions (dir not empty, etc) before calling
 */

- (CDVPluginResult*)doRemove:(NSString*)fullPath
{
    CDVPluginResult* result = nil;
    BOOL bSuccess = NO;
    NSError* __autoreleasing pError = nil;
    NSFileManager* fileMgr = [[NSFileManager alloc] init];

    @try {
        bSuccess = [fileMgr removeItemAtPath:fullPath error:&pError];
        if (bSuccess) {
            result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
        } else {
            // see if we can give a useful error
            CDVFileError errorCode = ABORT_ERR;
            NSLog(@"error removing filesystem entry at %@: %@", fullPath, [pError localizedDescription]);
            if ([pError code] == NSFileNoSuchFileError) {
                errorCode = NOT_FOUND_ERR;
            } else if ([pError code] == NSFileWriteNoPermissionError) {
                errorCode = NO_MODIFICATION_ALLOWED_ERR;
            }

            result = [CDVPluginResult resultWithStatus:CDVCommandStatus_IO_EXCEPTION messageAsInt:errorCode];
        }
    } @catch(NSException* e) {  // NSInvalidArgumentException if path is . or ..
        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsInt:SYNTAX_ERR];
    }

    return result;
}

- (CDVPluginResult *)removeFileAtURL:(CDVFilesystemURL *)localURI
{
    NSString *fileSystemPath = [self filesystemPathForURL:localURI];

    NSFileManager* fileMgr = [[NSFileManager alloc] init];
    BOOL bIsDir = NO;
    BOOL bExists = [fileMgr fileExistsAtPath:fileSystemPath isDirectory:&bIsDir];
    if (!bExists) {
        return [CDVPluginResult resultWithStatus:CDVCommandStatus_IO_EXCEPTION messageAsInt:NOT_FOUND_ERR];
    }
    if (bIsDir && ([[fileMgr contentsOfDirectoryAtPath:fileSystemPath error:nil] count] != 0)) {
        // dir is not empty
        return [CDVPluginResult resultWithStatus:CDVCommandStatus_IO_EXCEPTION messageAsInt:INVALID_MODIFICATION_ERR];
    }
    return [self doRemove:fileSystemPath];
}

- (CDVPluginResult *)recursiveRemoveFileAtURL:(CDVFilesystemURL *)localURI
{
    NSString *fileSystemPath = [self filesystemPathForURL:localURI];
    return [self doRemove:fileSystemPath];
}

/*
 * IN
 *  NSString localURI
 * OUT
 *  NSString full local filesystem path for the represented file or directory, or nil if no such path is possible
 *  The file or directory does not necessarily have to exist. nil is returned if the filesystem type is not recognized,
 *  or if the URL is malformed.
 * The incoming URI should be properly escaped (no raw spaces, etc. URI percent-encoding is expected).
 */
- (NSString *)fullPathForFileSystemPath:(NSString *)fsPath
{
    if ([fsPath hasPrefix:self.fsRoot]) {
        return [fsPath substringFromIndex:[self.fsRoot length]];
    }
    return nil;
}


- (CDVPluginResult *)readEntriesAtURL:(CDVFilesystemURL *)localURI
{
    NSFileManager* fileMgr = [[NSFileManager alloc] init];
    NSError* __autoreleasing error = nil;
    NSString *fileSystemPath = [self filesystemPathForURL:localURI];

    NSArray* contents = [fileMgr contentsOfDirectoryAtPath:fileSystemPath error:&error];

    if (contents) {
        NSMutableArray* entries = [NSMutableArray arrayWithCapacity:1];
        if ([contents count] > 0) {
            // create an Entry (as JSON) for each file/dir
            for (NSString* name in contents) {
                // see if is dir or file
                NSString* entryPath = [fileSystemPath stringByAppendingPathComponent:name];
                BOOL bIsDir = NO;
                [fileMgr fileExistsAtPath:entryPath isDirectory:&bIsDir];
                NSDictionary* entryDict = [self makeEntryForPath:[self fullPathForFileSystemPath:entryPath] isDirectory:bIsDir];
                [entries addObject:entryDict];
            }
        }
        return [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsArray:entries];
    } else {
        // assume not found but could check error for more specific error conditions
        return [CDVPluginResult resultWithStatus:CDVCommandStatus_IO_EXCEPTION messageAsInt:NOT_FOUND_ERR];
    }
}

- (unsigned long long)truncateFile:(NSString*)filePath atPosition:(unsigned long long)pos
{
    unsigned long long newPos = 0UL;

    NSFileHandle* file = [NSFileHandle fileHandleForWritingAtPath:filePath];

    if (file) {
        [file truncateFileAtOffset:(unsigned long long)pos];
        newPos = [file offsetInFile];
        [file synchronizeFile];
        [file closeFile];
    }
    return newPos;
}

- (CDVPluginResult *)truncateFileAtURL:(CDVFilesystemURL *)localURI atPosition:(unsigned long long)pos
{
    unsigned long long newPos = [self truncateFile:[self filesystemPathForURL:localURI] atPosition:pos];
    return [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsInt:(int)newPos];
}

- (CDVPluginResult *)writeToFileAtURL:(CDVFilesystemURL *)localURL withData:(NSData*)encData append:(BOOL)shouldAppend
{
    NSString *filePath = [self filesystemPathForURL:localURL];

    CDVPluginResult* result = nil;
    CDVFileError errCode = INVALID_MODIFICATION_ERR;
    int bytesWritten = 0;

    if (filePath) {
        NSOutputStream* fileStream = [NSOutputStream outputStreamToFileAtPath:filePath append:shouldAppend];
        if (fileStream) {
            NSUInteger len = [encData length];
            if (len == 0) {
                result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDouble:(double)len];
            } else {
                [fileStream open];

                bytesWritten = (int)[fileStream write:[encData bytes] maxLength:len];

                [fileStream close];
                if (bytesWritten > 0) {
                    result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsInt:bytesWritten];
                    // } else {
                    // can probably get more detailed error info via [fileStream streamError]
                    // errCode already set to INVALID_MODIFICATION_ERR;
                    // bytesWritten = 0; // may be set to -1 on error
                }
            }
        } // else fileStream not created return INVALID_MODIFICATION_ERR
    } else {
        // invalid filePath
        errCode = NOT_FOUND_ERR;
    }
    if (!result) {
        // was an error
        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsInt:errCode];
    }
    return result;
}

/**
 * Helper function to check to see if the user attempted to copy an entry into its parent without changing its name,
 * or attempted to copy a directory into a directory that it contains directly or indirectly.
 *
 * IN:
 *  NSString* srcDir
 *  NSString* destinationDir
 * OUT:
 *  YES copy/ move is allows
 *  NO move is onto itself
 */
- (BOOL)canCopyMoveSrc:(NSString*)src ToDestination:(NSString*)dest
{
    // This weird test is to determine if we are copying or moving a directory into itself.
    // Copy /Documents/myDir to /Documents/myDir-backup is okay but
    // Copy /Documents/myDir to /Documents/myDir/backup not okay
    BOOL copyOK = YES;
    NSRange range = [dest rangeOfString:src];

    if (range.location != NSNotFound) {
        NSRange testRange = {range.length - 1, ([dest length] - range.length)};
        NSRange resultRange = [dest rangeOfString:@"/" options:0 range:testRange];
        if (resultRange.location != NSNotFound) {
            copyOK = NO;
        }
    }
    return copyOK;
}

- (void)copyFileToURL:(CDVFilesystemURL *)destURL withName:(NSString *)newName fromFileSystem:(NSObject<CDVFileSystem> *)srcFs atURL:(CDVFilesystemURL *)srcURL copy:(BOOL)bCopy callback:(void (^)(CDVPluginResult *))callback
{
    NSFileManager *fileMgr = [[NSFileManager alloc] init];
    NSString *destRootPath = [self filesystemPathForURL:destURL];
    BOOL bDestIsDir = NO;
    BOOL bDestExists = [fileMgr fileExistsAtPath:destRootPath isDirectory:&bDestIsDir];

    NSString *newFileSystemPath = [destRootPath stringByAppendingPathComponent:newName];
    NSString *newFullPath = [self fullPathForFileSystemPath:newFileSystemPath];

    BOOL bNewIsDir = NO;
    BOOL bNewExists = [fileMgr fileExistsAtPath:newFileSystemPath isDirectory:&bNewIsDir];

    CDVPluginResult *result = nil;
    int errCode = 0;

    if (!bDestExists) {
        // the destination root does not exist
        errCode = NOT_FOUND_ERR;
    }

    else if ([srcFs isKindOfClass:[CDVLocalFilesystem class]]) {
        /* Same FS, we can shortcut with NSFileManager operations */
        NSString *srcFullPath = [srcFs filesystemPathForURL:srcURL];

        BOOL bSrcIsDir = NO;
        BOOL bSrcExists = [fileMgr fileExistsAtPath:srcFullPath isDirectory:&bSrcIsDir];

        if (!bSrcExists) {
            // the source does not exist
            errCode = NOT_FOUND_ERR;
        } else if ([newFileSystemPath isEqualToString:srcFullPath]) {
            // source and destination can not be the same
            errCode = INVALID_MODIFICATION_ERR;
        } else if (bSrcIsDir && (bNewExists && !bNewIsDir)) {
            // can't copy/move dir to file
            errCode = INVALID_MODIFICATION_ERR;
        } else { // no errors yet
            NSError* __autoreleasing error = nil;
            BOOL bSuccess = NO;
            if (bCopy) {
                if (bSrcIsDir && ![self canCopyMoveSrc:srcFullPath ToDestination:newFileSystemPath]) {
                    // can't copy dir into self
                    errCode = INVALID_MODIFICATION_ERR;
                } else if (bNewExists) {
                    // the full destination should NOT already exist if a copy
                    errCode = PATH_EXISTS_ERR;
                } else {
                    bSuccess = [fileMgr copyItemAtPath:srcFullPath toPath:newFileSystemPath error:&error];
                }
            } else { // move
                // iOS requires that destination must not exist before calling moveTo
                // is W3C INVALID_MODIFICATION_ERR error if destination dir exists and has contents
                //
                if (!bSrcIsDir && (bNewExists && bNewIsDir)) {
                    // can't move a file to directory
                    errCode = INVALID_MODIFICATION_ERR;
                } else if (bSrcIsDir && ![self canCopyMoveSrc:srcFullPath ToDestination:newFileSystemPath]) {
                    // can't move a dir into itself
                    errCode = INVALID_MODIFICATION_ERR;
                } else if (bNewExists) {
                    if (bNewIsDir && ([[fileMgr contentsOfDirectoryAtPath:newFileSystemPath error:NULL] count] != 0)) {
                        // can't move dir to a dir that is not empty
                        errCode = INVALID_MODIFICATION_ERR;
                        newFileSystemPath = nil;  // so we won't try to move
                    } else {
                        // remove destination so can perform the moveItemAtPath
                        bSuccess = [fileMgr removeItemAtPath:newFileSystemPath error:NULL];
                        if (!bSuccess) {
                            errCode = INVALID_MODIFICATION_ERR; // is this the correct error?
                            newFileSystemPath = nil;
                        }
                    }
                } else if (bNewIsDir && [newFileSystemPath hasPrefix:srcFullPath]) {
                    // can't move a directory inside itself or to any child at any depth;
                    errCode = INVALID_MODIFICATION_ERR;
                    newFileSystemPath = nil;
                }

                if (newFileSystemPath != nil) {
                    bSuccess = [fileMgr moveItemAtPath:srcFullPath toPath:newFileSystemPath error:&error];
                }
            }
            if (bSuccess) {
                // should verify it is there and of the correct type???
                NSDictionary* newEntry = [self makeEntryForPath:newFullPath isDirectory:bSrcIsDir];
                result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:newEntry];
            } else {
                if (error) {
                    if (([error code] == NSFileReadUnknownError) || ([error code] == NSFileReadTooLargeError)) {
                        errCode = NOT_READABLE_ERR;
                    } else if ([error code] == NSFileWriteOutOfSpaceError) {
                        errCode = QUOTA_EXCEEDED_ERR;
                    } else if ([error code] == NSFileWriteNoPermissionError) {
                        errCode = NO_MODIFICATION_ALLOWED_ERR;
                    }
                }
            }
        }
    } else {
        // Need to copy the hard way
        [srcFs readFileAtURL:srcURL start:0 end:-1 callback:^(NSData* data, NSString* mimeType, CDVFileError errorCode) {
            CDVPluginResult* result = nil;
            if (data != nil) {
                BOOL bSuccess = [data writeToFile:newFileSystemPath atomically:YES];
                if (bSuccess) {
                    // should verify it is there and of the correct type???
                    NSDictionary* newEntry = [self makeEntryForPath:newFullPath isDirectory:NO];
                    result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:newEntry];
                } else {
                    result = [CDVPluginResult resultWithStatus:CDVCommandStatus_IO_EXCEPTION messageAsInt:ABORT_ERR];
                }
            } else {
                result = [CDVPluginResult resultWithStatus:CDVCommandStatus_IO_EXCEPTION messageAsInt:errorCode];
            }
            callback(result);
        }];
        return; // Async IO; return without callback.
    }
    if (result == nil) {
        if (!errCode) {
            errCode = INVALID_MODIFICATION_ERR; // Catch-all default
        }
        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_IO_EXCEPTION messageAsInt:errCode];
    }
    callback(result);
}

/* helper function to get the mimeType from the file extension
 * IN:
 *	NSString* fullPath - filename (may include path)
 * OUT:
 *	NSString* the mime type as type/subtype.  nil if not able to determine
 */
+ (NSString*)getMimeTypeFromPath:(NSString*)fullPath
{
    NSString* mimeType = nil;

    if (fullPath) {
        CFStringRef typeId = UTTypeCreatePreferredIdentifierForTag(kUTTagClassFilenameExtension, (__bridge CFStringRef)[fullPath pathExtension], NULL);
        if (typeId) {
            mimeType = (__bridge_transfer NSString*)UTTypeCopyPreferredTagWithClass(typeId, kUTTagClassMIMEType);
            if (!mimeType) {
                // special case for m4a
                if ([(__bridge NSString*)typeId rangeOfString : @"m4a-audio"].location != NSNotFound) {
                    mimeType = @"audio/mp4";
                } else if ([[fullPath pathExtension] rangeOfString:@"wav"].location != NSNotFound) {
                    mimeType = @"audio/wav";
                } else if ([[fullPath pathExtension] rangeOfString:@"css"].location != NSNotFound) {
                    mimeType = @"text/css";
                }
            }
            CFRelease(typeId);
        }
    }
    return mimeType;
}

- (void)readFileAtURL:(CDVFilesystemURL *)localURL start:(NSInteger)start end:(NSInteger)end callback:(void (^)(NSData*, NSString* mimeType, CDVFileError))callback
{
    NSString *path = [self filesystemPathForURL:localURL];

    NSString* mimeType = [CDVLocalFilesystem getMimeTypeFromPath:path];
    if (mimeType == nil) {
        mimeType = @"*/*";
    }
    NSFileHandle* file = [NSFileHandle fileHandleForReadingAtPath:path];
    if (start > 0) {
        [file seekToFileOffset:start];
    }

    NSData* readData;
    if (end < 0) {
        readData = [file readDataToEndOfFile];
    } else {
        readData = [file readDataOfLength:(end - start)];
    }
    [file closeFile];

    callback(readData, mimeType, readData != nil ? NO_ERROR : NOT_FOUND_ERR);
}

- (void)getFileMetadataForURL:(CDVFilesystemURL *)localURL callback:(void (^)(CDVPluginResult *))callback
{
    NSString *path = [self filesystemPathForURL:localURL];
    CDVPluginResult *result;
    NSFileManager* fileMgr = [[NSFileManager alloc] init];

    NSError* __autoreleasing error = nil;
    NSDictionary* fileAttrs = [fileMgr attributesOfItemAtPath:path error:&error];

    if (fileAttrs) {

        // create dictionary of file info
        NSMutableDictionary* fileInfo = [NSMutableDictionary dictionaryWithCapacity:5];

        [fileInfo setObject:localURL.fullPath forKey:@"fullPath"];
        [fileInfo setObject:@"" forKey:@"type"];  // can't easily get the mimetype unless create URL, send request and read response so skipping
        [fileInfo setObject:[path lastPathComponent] forKey:@"name"];

        // Ensure that directories (and other non-regular files) report size of 0
        unsigned long long size = ([fileAttrs fileType] == NSFileTypeRegular ? [fileAttrs fileSize] : 0);
        [fileInfo setObject:[NSNumber numberWithUnsignedLongLong:size] forKey:@"size"];

        NSDate* modDate = [fileAttrs fileModificationDate];
        if (modDate) {
            [fileInfo setObject:[NSNumber numberWithDouble:[modDate timeIntervalSince1970] * 1000] forKey:@"lastModifiedDate"];
        }

        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:fileInfo];

    } else {
        // didn't get fileAttribs
        CDVFileError errorCode = ABORT_ERR;
        NSLog(@"error getting metadata: %@", [error localizedDescription]);
        if ([error code] == NSFileNoSuchFileError || [error code] == NSFileReadNoSuchFileError) {
            errorCode = NOT_FOUND_ERR;
        }
        // log [NSNumber numberWithDouble: theMessage] objCtype to see what it returns
        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsInt:errorCode];
    }

    callback(result);
}

@end

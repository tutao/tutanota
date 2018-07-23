//
//  FileUtil.h
//  Tutanota plugin
//

#ifndef Tutanota_plugin_FileUtil_h
#define Tutanota_plugin_FileUtil_h

#import <Cordova/CDV.h>


@interface FileUtil : CDVPlugin<UIDocumentInteractionControllerDelegate>

/* Definitions from the FileUtil.js interface. */
- (void)open:(CDVInvokedUrlCommand*)command;
- (void)openFileChooser:(CDVInvokedUrlCommand*)command;
- (void)write:(CDVInvokedUrlCommand*)command;
- (void)read:(CDVInvokedUrlCommand*)command;
- (void)deleteFile:(CDVInvokedUrlCommand*)command;
- (void)getName:(CDVInvokedUrlCommand*)command;
- (void)getMimeType:(CDVInvokedUrlCommand*)command;
- (void)getSize:(CDVInvokedUrlCommand*)command;
- (void)upload:(CDVInvokedUrlCommand*)command;
- (void)download:(CDVInvokedUrlCommand*)command;
- (void)clearFileData:(CDVInvokedUrlCommand*)command;


/** Helper functions for file access. */
+ (NSString*) getEncryptedFolder:(NSError **) error;
+ (NSString*) getDecryptedFolder:(NSError **) error;
+ (BOOL) fileExistsAtPath:(NSString*)path;
+ (NSURL*) urlFromPath:(NSString*)path;
+ (NSString*) pathFromUrl:(NSURL*)url;

@end

#endif

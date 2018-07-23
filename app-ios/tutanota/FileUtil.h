//
//  FileUtil.h
//  Tutanota plugin
//

#ifndef Tutanota_plugin_FileUtil_h
#define Tutanota_plugin_FileUtil_h



@interface FileUtil : NSObject

/* Definitions from the FileUtil.js interface. */
//- (void)open:(CDVInvokedUrlCommand*)command;
//- (void)openFileChooser:(CDVInvokedUrlCommand*)command;
//- (void)write:(CDVInvokedUrlCommand*)command;
//- (void)read:(CDVInvokedUrlCommand*)command;
//- (void)deleteFile:(CDVInvokedUrlCommand*)command;
- (void)getNameForPath:(NSString *)filePath completion:(void (^)(NSString *, NSError *))completion;
- (void)getMimeTypeForPath:(NSString *)filePath completion:(void (^)(NSString *, NSError *))completion;
- (void)getSizeForPath:(NSString *)filePath completion:(void (^)(NSNumber *, NSError *))completion;
//- (void)upload:(CDVInvokedUrlCommand*)command;
//- (void)download:(CDVInvokedUrlCommand*)command;
//- (void)clearFileData:(CDVInvokedUrlCommand*)command;


/** Helper functions for file access. */
+ (NSString*) getEncryptedFolder:(NSError **) error;
+ (NSString*) getDecryptedFolder:(NSError **) error;
+ (BOOL) fileExistsAtPath:(NSString*)path;
+ (NSURL*) urlFromPath:(NSString*)path;
+ (NSString*) pathFromUrl:(NSURL*)url;

@end

#endif

//
//  FileUtil.h
//  Tutanota plugin
//

#ifndef Tutanota_plugin_FileUtil_h
#define Tutanota_plugin_FileUtil_h

#import <Cordova/CDV.h>

@interface FileUtil : CDVPlugin

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


@end

#endif

//
//  TUTFileUtil.h
//  Tutanota plugin
//
#import <UIKit/UIKit.h>

@interface TUTFileUtil : NSObject

- (instancetype)initWithViewController:(UIViewController * _Nonnull)viewController;

/* Definitions from the FileUtil.js interface. */
//- (void)openFileChooser:(CDVInvokedUrlCommand*)command;
//- (void)write:(CDVInvokedUrlCommand*)command;
//- (void)read:(CDVInvokedUrlCommand*)command;
- (void)openFileAtPath:(NSString * _Nonnull)filePath
			completion:(void (^ _Nonnull)(NSError * _Nullable))completion;

- (void) openFile:(NSString*) name fileData:(NSData*) fileData completion:(void(^)(NSError * error))completion;

- (void)deleteFileAtPath:(NSString * _Nonnull)filePath
			  completion:(void (^ _Nonnull)(void))completion;

- (void)getNameForPath:(NSString * _Nonnull)filePath
			completion:(void (^ _Nonnull)(NSString * _Nullable name, NSError * _Nullable error))completion;

- (void)getMimeTypeForPath:(NSString * _Nonnull)filePath
				completion:(void (^ _Nonnull)(NSString * _Nullable mime, NSError * _Nullable  error))completion;

- (void)getSizeForPath:(NSString * _Nonnull)filePath
			completion:(void (^ _Nonnull)(NSNumber * _Nullable size, NSError * _Nullable errir))completion;

- (void)uploadFileAtPath:(NSString * _Nonnull)filePath
				   toUrl:(NSString * _Nonnull)urlString
			 withHeaders:(NSDictionary<NSString *, NSString *> * _Nonnull)headers
			  completion:(void (^ _Nonnull)(NSDictionary<NSString *, id> * _Nullable response, NSError * _Nullable error))completion;

- (void)downloadFileFromUrl:(NSString * _Nonnull)urlString
					forName:(NSString * _Nonnull)fileName
				withHeaders:(NSDictionary<NSString *, NSString *> * _Nonnull)headers
				 completion:(void (^ _Nonnull)(NSDictionary<NSString *, id> * _Nullable response, NSError * _Nullable error))completion;

- (void)clearFileData;


/** Helper functions for file access. */
+ (NSString*) getEncryptedFolder:(NSError **) error;
+ (NSString*) getDecryptedFolder:(NSError **) error;
+ (BOOL) fileExistsAtPath:(NSString*)path;
+ (NSURL*) urlFromPath:(NSString*)path;
+ (NSString*) pathFromUrl:(NSURL*)url;

@end

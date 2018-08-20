//
//  TUTFileViewer.h
//  Tutanota
//
//  Created by Tutao GmbH on 31.10.16.
//

#import <QuickLook/QuickLook.h>

@interface TUTFileViewer : NSObject<UIDocumentInteractionControllerDelegate, QLPreviewControllerDataSource, QLPreviewControllerDelegate>

- (instancetype) initWithViewController:(UIViewController *)viewController;
- (void) openFileAtPath:(NSString*) filePath completion:(void(^)(NSError * error))completion;

@end

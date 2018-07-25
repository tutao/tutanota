//
//  TutaoDocumentInteractionController.h
//  Tutanota
//
//  Created by Tutao GmbH on 31.10.16.
//
//

#import <QuickLook/QuickLook.h>

#ifndef TutaoDocumentInteractionController_h
#define TutaoDocumentInteractionController_h

@interface TutaoFileViewer : NSObject<UIDocumentInteractionControllerDelegate, QLPreviewControllerDataSource, QLPreviewControllerDelegate>

- (instancetype) initWithViewController:(UIViewController *)viewController;
- (void) openFileAtPath:(NSString*) filePath completion:(void(^)(NSError * error))completion;

@end


#endif /* TutaoDocumentInteractionController_h */

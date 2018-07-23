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

//- (TutaoFileViewer*) initWithPlugin:(CDVPlugin*) plugin;
//- (void) openFileAtPath:(NSString*) filePath completionHandler:(void(^)(NSError * error))handler;

@end


#endif /* TutaoDocumentInteractionController_h */

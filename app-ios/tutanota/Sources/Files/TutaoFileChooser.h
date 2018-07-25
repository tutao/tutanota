//
//  TutaoFileChooser
//  Tutanota
//
//  Created by Tutao GmbH on 01.11.16.
//
//

#import <UIKit/UIDocumentMenuViewController.h>
#import "FileUtil.h"
#import <UIKit/UIKit.h>

#ifndef TutaoDocumentPickerDelegate_h
#define TutaoDocumentPickerDelegate_h

@interface TutaoFileChooser : NSObject<UIDocumentMenuDelegate, UIDocumentPickerDelegate, UINavigationControllerDelegate, UIImagePickerControllerDelegate, UIPopoverPresentationControllerDelegate>
- (instancetype) initWithViewController:(UIViewController *)viewController;

- (void)openWithCompletion:(void(^)(NSString *filePath, NSError *error))completionHandler;
@end


#endif /* TutaoDocumentPickerDelegate_h */

//
//  TUTFileChooser
//  Tutanota
//
//  Created by Tutao GmbH on 01.11.16.
//
//

#import <UIKit/UIDocumentMenuViewController.h>
#import "TUTFileUtil.h"
#import <UIKit/UIKit.h>

@interface TUTFileChooser : NSObject<UIDocumentMenuDelegate, UIDocumentPickerDelegate, UINavigationControllerDelegate, UIImagePickerControllerDelegate, UIPopoverPresentationControllerDelegate>
- (instancetype) initWithViewController:(UIViewController *)viewController;

- (void)openWithAnchorRect:(CGRect)anchorRect completion:(void(^)(NSArray<NSString *> *filePath, NSError *error))completionHandler;
@end



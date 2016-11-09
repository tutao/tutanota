//
//  TutaoFileChooser
//  Tutanota
//
//  Created by Tutao GmbH on 01.11.16.
//
//

#import <UIKit/UIDocumentMenuViewController.h>
#import <Cordova/CDVCommandDelegate.h>
#import "FileUtil.h"

#ifndef TutaoDocumentPickerDelegate_h
#define TutaoDocumentPickerDelegate_h

@interface TutaoFileChooser : NSObject<UIDocumentMenuDelegate, UIDocumentPickerDelegate, UINavigationControllerDelegate, UIImagePickerControllerDelegate>

- (TutaoFileChooser *) initWithPlugin:(CDVPlugin*) cdvPlugin;

- (void)openAt:(NSDictionary *)srcRect completion:(void(^)(NSString *filePath, NSError *error))completionHandler;

@end


#endif /* TutaoDocumentPickerDelegate_h */

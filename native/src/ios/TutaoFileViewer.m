//
//  TutaoDocumentInteractionController.m
//  Tutanota
//
//  Created by Tutao GmbH on 31.10.16.
//
//

#import <Foundation/Foundation.h>
#include "TutaoFileViewer.h"
#import <QuickLook/QuickLook.h>
#include "FileUtil.h"
#import <Cordova/CDV.h>
#include "TutaoErrorFactory.h"

@implementation TutaoFileViewer {
	CDVPlugin* _cdvPlugin;
	NSURL *_fileUrl;
	QLPreviewController *_previewController;
	void(^completionHandler)();
}

- (TutaoFileViewer*) initWithPlugin:(CDVPlugin*) plugin {
	_cdvPlugin = plugin;
	return self;
}


- (void) openFileAtPath:(NSString*) filePath completionHandler:(void(^)(NSError * error))handler{
	completionHandler = handler;
    _previewController= [[QLPreviewController alloc] init];
    _previewController.dataSource = self;
    _previewController.delegate = self;
    _fileUrl = [FileUtil urlFromPath:filePath];
  	if ([QLPreviewController canPreviewItem:_fileUrl]){
		[_cdvPlugin.viewController presentViewController:_previewController animated:YES completion:nil];
	} else {
		handler([TutaoErrorFactory createError:@"cannot display files"]);
	}
}



/*!
 * @abstract Returns the number of items that the preview controller should preview.
 * @param controller The Preview Controller.
 * @result The number of items.
 */
- (NSInteger)numberOfPreviewItemsInPreviewController:(QLPreviewController *)controller{
	return 1;
}

/*!
 * @abstract Returns the item that the preview controller should preview.
 * @param panel The Preview Controller.
 * @param index The index of the item to preview.
 * @result An item conforming to the QLPreviewItem protocol.
 */
- (id <QLPreviewItem>)previewController:(QLPreviewController *)controller previewItemAtIndex:(NSInteger)index{
	return _fileUrl;
}


/*!
 * @abstract Invoked after the preview controller is closed.
 */
- (void)previewControllerDidDismiss:(QLPreviewController *)controller{
	completionHandler(nil);
}

/*!
 * @abstract Invoked by the preview controller before trying to open an URL tapped in the preview.
 * @result Returns NO to prevent the preview controller from calling -[UIApplication openURL:] on url.
 * @discussion If not implemented, defaults is YES.
 */
- (BOOL)previewController:(QLPreviewController *)controller shouldOpenURL:(NSURL *)url forPreviewItem:(id <QLPreviewItem>)item{
	return YES;
}

@end

//
//  TUTFileViewer.m
//  Tutanota
//
//  Created by Tutao GmbH on 31.10.16.
//
//

#import <Foundation/Foundation.h>
#import "TUTFileViewer.h"
#import <QuickLook/QuickLook.h>
#import "TUTFileUtil.h"
#import "TUTErrorFactory.h"

@interface TUTFileViewer ()
	@property (readonly) UIViewController *sourceController;
	@property (readwrite) NSURL *fileUrl;
	@property (readwrite) QLPreviewController *previewController;
	@property (readwrite) void(^completionHandler)(NSError *error);
@end

@implementation TUTFileViewer

- (instancetype)initWithViewController:(UIViewController *)viewController {
	self = [super init];
    if (self) {
        _sourceController = viewController;
    }
    return self;
}

- (void) openFileAtPath:(NSString*) filePath completion:(void(^)(NSError * error))completion {
	_completionHandler = completion;
    _previewController= [[QLPreviewController alloc] init];
    _previewController.dataSource = self;
    _previewController.delegate = self;
	_fileUrl = [TUTFileUtil urlFromPath:filePath];
	if ([QLPreviewController canPreviewItem:_fileUrl]) {
		// ensure that ui related operations run in main thread
		dispatch_async(dispatch_get_main_queue(), ^{
			[self->_sourceController presentViewController:self->_previewController
												  animated:YES
												completion:nil];
			self->_completionHandler(nil);
		});
	} else {
		completion([TUTErrorFactory createError:@"cannot display files"]);
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
//	_completionHandler(nil);
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


//  TutaoFileChooser
//  Tutanota
//
//  Created by Tutao GmbH on 01.11.16.
//
//

#import <Foundation/Foundation.h>
#include "TutaoFileChooser.h"
#import <UIKit/UIViewController.h>
#import "FileUtil.h"
#import <Photos/Photos.h>
#include "TutaoErrorFactory.h"
#import <MobileCoreServices/MobileCoreServices.h>


@implementation TutaoFileChooser {
	UIDocumentMenuViewController *_attachmentTypeMenu;
	UIImagePickerController *_imagePickerController;
	NSArray *_supportedUTIs;
	void(^resultHandler)(NSString * filePath, NSError* error);
	UIPopoverPresentationController *_popOverPresentationController;
	CGRect _currentSrcRect;
	UIImage *_cameraImage;
	UIImage *_photoLibImage;
}

- (TutaoFileChooser*) init {
	_currentSrcRect = CGRectZero;
	_supportedUTIs = @[@"public.content"];
	_imagePickerController = [[UIImagePickerController alloc] init];
	_imagePickerController.delegate = self;
	
//	_cameraImage = [TutaoUtils createFontImage:@"\ue945" fontName:@"icomoon" size:24];
//	_photoLibImage = [TutaoUtils createFontImage:@"\ue93c" fontName:@"icomoon" size:24];
	return self;
}


- (void)openAt:(NSDictionary *)srcRect completion:(void(^)(NSString *filePath, NSError *error))completionHandler{
	if (resultHandler){
		completionHandler(nil, [TutaoErrorFactory createError:@"file chooser already open"]);
		return;
	}
	resultHandler = completionHandler;
	_currentSrcRect = CGRectZero;
	if (srcRect) {
		_currentSrcRect.origin.x   = [[srcRect valueForKey:@"x"] integerValue];
        _currentSrcRect.origin.y   = [[srcRect valueForKey:@"y"] integerValue];
		_currentSrcRect.size.width = [[srcRect valueForKey:@"width"] integerValue];
		_currentSrcRect.size.height= [[srcRect valueForKey:@"height"] integerValue];
	}

	_attachmentTypeMenu = [[UIDocumentMenuViewController alloc] initWithDocumentTypes:_supportedUTIs inMode:UIDocumentPickerModeImport];
	_attachmentTypeMenu.delegate = self;
	
	// avoid reference cycle in completion blocks.
	TutaoFileChooser *__weak weakSelf = self;

	// add menu item for selecting images from photo library.
	// according to developer documentation check if the source type is available first https://developer.apple.com/reference/uikit/uiimagepickercontroller
	if ([UIImagePickerController isSourceTypeAvailable:UIImagePickerControllerSourceTypeSavedPhotosAlbum]){
		if ([[UIDevice currentDevice] userInterfaceIdiom] == UIUserInterfaceIdiomPad) {
			_attachmentTypeMenu.modalPresentationStyle = UIModalPresentationPopover;
			_popOverPresentationController = [_attachmentTypeMenu popoverPresentationController];
			_popOverPresentationController.permittedArrowDirections = UIPopoverArrowDirectionUp | UIPopoverArrowDirectionDown;
//			_popOverPresentationController.sourceView = _cdvPlugin.webView;
			_popOverPresentationController.sourceRect = _currentSrcRect;
			//_popOverPresentationController.delegate = weakSelf;
		}
		[_attachmentTypeMenu addOptionWithTitle:@"Photos" image:_photoLibImage order:UIDocumentMenuOrderFirst handler:^void(){
			// ask for permission because of changed behaviour in iOS 11
			if(PHPhotoLibrary.authorizationStatus == PHAuthorizationStatusNotDetermined){
				[PHPhotoLibrary requestAuthorization:^(PHAuthorizationStatus status) {
					if (status == PHAuthorizationStatusAuthorized) {
						[weakSelf showImagePicker]; // capture the weak reference to avoid reference cycle
					} else {
						[weakSelf sendResult:nil];
					}
				}];
			} else if(PHPhotoLibrary.authorizationStatus == PHAuthorizationStatusAuthorized){
				[weakSelf showImagePicker]; // capture the weak reference to avoid reference cycle
			} else{
				[weakSelf showPermissionDeniedDialog];
			}
		}];
	}

	// add menu item for opening the camera and take a photo or video.
	// according to developer documentation check if the source type is available first https://developer.apple.com/reference/uikit/uiimagepickercontroller
	if ([UIImagePickerController isSourceTypeAvailable:UIImagePickerControllerSourceTypeCamera]){
		[_attachmentTypeMenu addOptionWithTitle:@"Camera" image:_cameraImage order:UIDocumentMenuOrderFirst handler:^void(){
			[weakSelf openCamera]; // capture the weak reference to avoid reference cycle
		}];
	}
	// TODO
//	[_cdvPlugin.viewController presentViewController:_attachmentTypeMenu animated:YES completion:nil];
}


-(void) showImagePicker{
	_imagePickerController.sourceType = UIImagePickerControllerSourceTypeSavedPhotosAlbum;
	_imagePickerController.mediaTypes = [UIImagePickerController availableMediaTypesForSourceType: UIImagePickerControllerSourceTypeSavedPhotosAlbum];
	_imagePickerController.modalPresentationStyle = UIModalPresentationFullScreen;
	_imagePickerController.allowsEditing = NO;
	if ([[UIDevice currentDevice] userInterfaceIdiom] == UIUserInterfaceIdiomPad) {
		_imagePickerController.modalPresentationStyle = UIModalPresentationPopover;
		UIPopoverPresentationController *popOverController = _imagePickerController.popoverPresentationController;
//		popOverController.sourceView = _cdvPlugin.webView;
		popOverController.permittedArrowDirections = UIPopoverArrowDirectionDown | UIPopoverArrowDirectionUp;
		popOverController.sourceRect = _currentSrcRect;
		popOverController.delegate = self;
	}
//	[_cdvPlugin.viewController presentViewController:_imagePickerController animated:YES completion:nil];
}

-(void) openCamera{
	_imagePickerController.sourceType = UIImagePickerControllerSourceTypeCamera;
	_imagePickerController.mediaTypes = [UIImagePickerController availableMediaTypesForSourceType: UIImagePickerControllerSourceTypeCamera];
	_imagePickerController.modalPresentationStyle = UIModalPresentationFullScreen;
	_imagePickerController.allowsEditing = NO;
	_imagePickerController.showsCameraControls = YES;
//	[_cdvPlugin.viewController presentViewController:_imagePickerController animated:YES completion:nil];
}



// from UIPopoverPresentationControllerDelegate
- (void)popoverPresentationControllerDidDismissPopover:(UIPopoverPresentationController *)popoverPresentationController{
	[self sendResult:nil];
}

// from UIDocumentMenuDelegate protocol
- (void)documentMenu:(UIDocumentMenuViewController *)documentMenu didPickDocumentPicker:(UIDocumentPickerViewController *)documentPicker{
	documentPicker.delegate = self;
//	[_cdvPlugin.viewController presentViewController:documentPicker animated:YES completion:nil];
}
// from UIDocumentMenuDelegate protocol
- (void)documentMenuWasCancelled:(UIDocumentMenuViewController *)documentMenu{
	[self sendResult:nil];
}

// from UIDocumentPickerDelegate protocol
- (void)documentPicker:(UIDocumentPickerViewController *)controller didPickDocumentAtURL:(NSURL *)url{
	//NSLog(@"picked url: %@", url);
	[self copyFileToLocalFolderAndSendResult:url fileName:[url lastPathComponent]];
}

// from UIDocumentPickerDelegate protocol
- (void)documentPickerWasCancelled:(UIDocumentPickerViewController *)controller{
	[self sendResult:nil];
}

// from UIImagePickerControllerDelegate protocol
- (void)imagePickerController:(UIImagePickerController *)picker didFinishPickingMediaWithInfo:(NSDictionary<NSString *,id> *)info {
//	[_cdvPlugin.viewController dismissViewControllerAnimated: YES completion: ^{
//		// we have to copy the file into a folder of this app.
//		NSError *error=nil;
//		NSString *targetFolder = [FileUtil getDecryptedFolder:&error];
//		if(error){
//			[self sendError:error];
//			return;
//		}
//
//		if ( _imagePickerController.sourceType == UIImagePickerControllerSourceTypeCamera) {
//			NSString *mediaType = [info objectForKey: UIImagePickerControllerMediaType];
//			if ([mediaType isEqualToString:@"public.image"]) {	// Handle a still image capture
//				UIImage *originalImage, *editedImage, *imageToSave;
//				editedImage = (UIImage *) [info objectForKey: UIImagePickerControllerEditedImage];
//				originalImage = (UIImage *) [info objectForKey: UIImagePickerControllerOriginalImage];
//				if (editedImage) {
//					imageToSave = editedImage;
//				} else {
//					imageToSave = originalImage;
//				}
//				NSString *fileName = [self generateFileName:@"img" withExtension:@"jpg"];
//				NSString *filePath = [targetFolder stringByAppendingPathComponent:fileName];
//				if ([UIImageJPEGRepresentation(imageToSave, 0.9) writeToFile:filePath atomically:YES]){
//					[self sendResult:filePath];
//				} else {
//					[self sendError:[TutaoErrorFactory createError:[NSString stringWithFormat:@"failed to save captured image to path %@", filePath]]];
//				}
//			} else if ([mediaType isEqualToString:@"public.movie"]) { // Handle a movie capture
//				NSURL *videoURL = [info objectForKey:UIImagePickerControllerMediaURL];
//				NSString *fileName = [self generateFileName:@"movie" withExtension:@"mp4"];
//				[self copyFileToLocalFolderAndSendResult:videoURL fileName:fileName];
//			} else {
//				[self sendError:[TutaoErrorFactory createError:[NSString stringWithFormat:@"Invalid media type %@", mediaType]]];
//			}
//		} else {
//			NSURL* srcUrl = [info objectForKey:UIImagePickerControllerReferenceURL];
//
//			// retrieve the filename of the image or video
//			PHFetchResult *result = [PHAsset fetchAssetsWithALAssetURLs:@[srcUrl] options:nil];
//			PHAsset *assetObject =[result firstObject];
//			PHAssetResource *assetResource = [[PHAssetResource assetResourcesForAsset:assetObject] firstObject];
//			if (!assetResource){
//				[self sendError:[TutaoErrorFactory createError:@"No asset resource for image"]];
//				return;
//			}
//
//			NSString *fileName = [assetResource originalFilename];
//			NSString *filePath = [targetFolder stringByAppendingPathComponent:fileName];
//
//			//extracting image from the picker and saving it
//			NSURL *mediaUrl =[info objectForKey:UIImagePickerControllerMediaURL];
//			NSString *mediaType = [info objectForKey:UIImagePickerControllerMediaType];
//			if ([mediaType isEqualToString:@"public.image"]){
//				[[PHImageManager defaultManager] requestImageDataForAsset:assetObject options:nil resultHandler:^(NSData * imageData, NSString * dataUTI, UIImageOrientation orientation, NSDictionary * info) {
//					if(!imageData){
//						[self sendError:[TutaoErrorFactory createError:@"No asset resource for image"]];
//						return;
//					}
//					if(![imageData writeToFile:filePath atomically:YES]){
//						[self sendError:[TutaoErrorFactory createError:@"failed to write image data"]];
//						return;
//					}
//					[self sendResult:filePath];
//				}];
//			} else if (mediaUrl) { // for videos
//				[self copyFileToLocalFolderAndSendResult:mediaUrl fileName:fileName];
//			} else {
//				[self sendError:[TutaoErrorFactory createError:[NSString stringWithFormat:@"Invalid media type %@", mediaType]]];
//			}
//		}
//	}];
};








// from UIImagePickerControllerDelegate protocol
- (void)imagePickerControllerDidCancel:(UIImagePickerController *)picker{
//	[_cdvPlugin.viewController dismissViewControllerAnimated: YES completion: ^{
//		[self sendResult:nil];
//	}];
};


-(void) copyFileToLocalFolderAndSendResult:(NSURL *) srcUrl fileName:(NSString*)fileName{
	NSError *error = nil;
	NSString *targetFolder = [FileUtil getDecryptedFolder:&error];
	if(error){
		[self sendError:error];
		return;
	}
	
	NSString *filePath = [targetFolder stringByAppendingPathComponent:fileName];
	NSURL *targetUrl = [FileUtil urlFromPath:filePath];
	NSFileManager *fileManager = [NSFileManager defaultManager];
	
	// NSFileManager copyItemAtUrl returns an error if the file alredy exists. so delete it first.
	if ([fileManager fileExistsAtPath:filePath]){
		[fileManager removeItemAtPath:filePath error:&error];
		if (error){
			[self sendError:error];
			return;
		}
	}
	
	[[NSFileManager defaultManager] copyItemAtURL:srcUrl toURL:targetUrl error:&error];
	if(error){
		[self sendError:error];
	} else {
		[self sendResult:filePath];
	}
}

- (NSString*)generateFileName:(NSString*)prefixString withExtension:(NSString *)extensionString{
	NSDate *time = [NSDate date];
	NSDateFormatter* df = [NSDateFormatter new];
	[df setDateFormat:@"hhmmss"];
	NSString *timeString = [df stringFromDate:time];
	NSString *fileName = [NSString stringWithFormat:@"%@_%@.%@", prefixString, timeString, extensionString];
	return fileName;
}

- (void)sendResult:(NSString* )filePath{
	resultHandler(filePath, nil);
	resultHandler = nil;
};

- (void)sendError:(NSError*) error{
	resultHandler(nil, error);
	resultHandler = nil;
};

-(void) showPermissionDeniedDialog{
		//User don't give us permission. Showing alert with redirection to settings
		NSString *permissionTitle = @"No permission";
		NSString *permissionInfo =  @"To grant access you have to modify the permissions for this device";
		NSString *settingsActionLabel = @"Settings";
		NSString *cancelActionLabel = @"Cancel";

		UIAlertController * alertController = [UIAlertController alertControllerWithTitle:permissionTitle message:permissionInfo preferredStyle:UIAlertControllerStyleAlert];
		UIAlertAction *cancelAction = [UIAlertAction actionWithTitle: cancelActionLabel style:UIAlertActionStyleCancel handler:nil];
		[alertController addAction:cancelAction];
		UIAlertAction *settingsAction = [UIAlertAction actionWithTitle:settingsActionLabel style:UIAlertActionStyleDefault handler:^(UIAlertAction * _Nonnull action) {
			[[UIApplication sharedApplication] openURL:[NSURL URLWithString:UIApplicationOpenSettingsURLString]];
		}];
		[alertController addAction:settingsAction];
		[[UIApplication sharedApplication].keyWindow.rootViewController presentViewController:alertController animated:YES completion:nil];
		[self sendResult:nil];
}



@end

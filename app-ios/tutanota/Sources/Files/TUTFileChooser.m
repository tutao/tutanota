
//  TutaoFileChooser
//  Tutanota
//
//  Created by Tutao GmbH on 01.11.16.
//
//

// Sweet, sweet sugar
#import "Swiftier.h"

// App classes
#import "TUTFileChooser.h"
#import "TUTErrorFactory.h"
#import "TUTFileUtil.h"
#import "TUTFontIconFactory.h"
#import "TUTIcons.h"

// Frameworks
#import <UIKit/UIViewController.h>
#import <Photos/Photos.h>


@interface TUTFileChooser ()
@property (readonly) UIViewController *sourceController;
@property (nonatomic, readonly) UIImage *cameraImage;
@property (nonatomic, readonly) UIImage *photoLibImage;
@property (nonatomic) UIDocumentMenuViewController *attachmentTypeMenu;
@property (nonatomic) UIImagePickerController *imagePickerController;
@property (nonatomic) NSArray *supportedUTIs;
@property (nonatomic) void(^resultHandler)(NSArray<NSString *> *filePath, NSError *error);
@property (nonatomic) UIPopoverPresentationController *popOverPresentationController;
@end

@implementation TUTFileChooser

- (TUTFileChooser*) initWithViewController:(UIViewController *)viewController {
	_supportedUTIs = @[@"public.content"];
	_imagePickerController = [[UIImagePickerController alloc] init];
	_imagePickerController.delegate = self;
	_sourceController = viewController;
	_cameraImage = [TUTFontIconFactory createFontImageForIconId:TUT_ICON_CAMERA fontName:@"ionicons" size:34];
	_photoLibImage = [TUTFontIconFactory createFontImageForIconId:TUT_ICON_FILES fontName:@"ionicons" size:34];
	return self;
}


- (void)openWithAnchorRect:(CGRect)anchorRect completion:(void(^)(NSArray<NSString *> *filePath, NSError *error))completionHandler {
	if (_resultHandler) {
		completionHandler(nil, [TUTErrorFactory createError:@"file chooser already open"]);
		return;
	}
	_resultHandler = completionHandler;

	_attachmentTypeMenu = [[UIDocumentMenuViewController alloc] initWithDocumentTypes:_supportedUTIs inMode:UIDocumentPickerModeImport];
	_attachmentTypeMenu.delegate = self;
	
	// avoid reference cycle in completion blocks.
	TUTFileChooser *__weak weakSelf = self;

	// add menu item for selecting images from photo library.
	// according to developer documentation check if the source type is available first https://developer.apple.com/reference/uikit/uiimagepickercontroller
	if ([UIImagePickerController isSourceTypeAvailable:UIImagePickerControllerSourceTypeSavedPhotosAlbum]){
		if ([[UIDevice currentDevice] userInterfaceIdiom] == UIUserInterfaceIdiomPad) {
			_attachmentTypeMenu.modalPresentationStyle = UIModalPresentationPopover;
			_popOverPresentationController = [_attachmentTypeMenu popoverPresentationController];
			_popOverPresentationController.permittedArrowDirections = UIPopoverArrowDirectionUp | UIPopoverArrowDirectionDown;
			_popOverPresentationController.sourceView = _sourceController.view;
			_popOverPresentationController.sourceRect = anchorRect;
		}
		[_attachmentTypeMenu addOptionWithTitle:[TUTFileChooser translate:@"TutaoChoosePhotosAction" default: @"Photos"] image:_photoLibImage order:UIDocumentMenuOrderFirst handler:^void(){
			// ask for permission because of changed behaviour in iOS 11
			if (PHPhotoLibrary.authorizationStatus == PHAuthorizationStatusNotDetermined) {
				[PHPhotoLibrary requestAuthorization:^(PHAuthorizationStatus status) {
					if (status == PHAuthorizationStatusAuthorized) {
						[weakSelf showImagePickerWithAnchor:anchorRect];
					} else {
						[weakSelf sendResult:nil];
					}
				}];
			} else if(PHPhotoLibrary.authorizationStatus == PHAuthorizationStatusAuthorized) {
				[weakSelf showImagePickerWithAnchor:anchorRect]; // capture the weak reference to avoid reference cycle
			} else{
				[weakSelf showPermissionDeniedDialog];
			}
		}];
	}

	// add menu item for opening the camera and take a photo or video.
	// according to developer documentation check if the source type is available first https://developer.apple.com/reference/uikit/uiimagepickercontroller
	if ([UIImagePickerController isSourceTypeAvailable:UIImagePickerControllerSourceTypeCamera]) {
		[_attachmentTypeMenu addOptionWithTitle:[TUTFileChooser translate:@"TutaoShowCameraAction" default: @"Camera"] image:_cameraImage order:UIDocumentMenuOrderFirst handler:^void(){
			[weakSelf openCamera]; // capture the weak reference to avoid refFFFFerence cycle
		}];
	}
	[self->_sourceController presentViewController:_attachmentTypeMenu animated:YES completion:nil];
}

-(void) showImagePickerWithAnchor:(CGRect)anchor {
	_imagePickerController.sourceType = UIImagePickerControllerSourceTypeSavedPhotosAlbum;
	_imagePickerController.mediaTypes = [UIImagePickerController availableMediaTypesForSourceType: UIImagePickerControllerSourceTypeSavedPhotosAlbum];
	_imagePickerController.modalPresentationStyle = UIModalPresentationFullScreen;
	_imagePickerController.allowsEditing = NO;
	if ([[UIDevice currentDevice] userInterfaceIdiom] == UIUserInterfaceIdiomPad) {
		_imagePickerController.modalPresentationStyle = UIModalPresentationPopover;
		UIPopoverPresentationController *popOverController = _imagePickerController.popoverPresentationController;
		popOverController.sourceView = _sourceController.view;
		popOverController.permittedArrowDirections = UIPopoverArrowDirectionDown | UIPopoverArrowDirectionUp;
		popOverController.sourceRect = anchor;
		popOverController.delegate = self;
	}
	[_sourceController presentViewController:_imagePickerController animated:YES completion:nil];
}

-(void) openCamera {
	_imagePickerController.sourceType = UIImagePickerControllerSourceTypeCamera;
	_imagePickerController.mediaTypes = [UIImagePickerController availableMediaTypesForSourceType: UIImagePickerControllerSourceTypeCamera];
	_imagePickerController.modalPresentationStyle = UIModalPresentationFullScreen;
	_imagePickerController.allowsEditing = NO;
	_imagePickerController.showsCameraControls = YES;
	[_sourceController presentViewController:_imagePickerController animated:YES completion:nil];
}



// from UIPopoverPresentationControllerDelegate
- (void)popoverPresentationControllerDidDismissPopover:(UIPopoverPresentationController *)popoverPresentationController{
	[self sendResult:nil];
}

// from UIDocumentMenuDelegate protocol
- (void)documentMenu:(UIDocumentMenuViewController *)documentMenu didPickDocumentPicker:(UIDocumentPickerViewController *)documentPicker{
	documentPicker.delegate = self;
	[_sourceController presentViewController:documentPicker animated:YES completion:nil];
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
	[_sourceController dismissViewControllerAnimated:YES completion: ^{
		// we have to copy the file into a folder of this app.
		NSError *error = nil;
		NSString *targetFolder = [TUTFileUtil getDecryptedFolder:&error];
		if (error) {
			[self sendError:error];
			return;
		}

		if (self->_imagePickerController.sourceType == UIImagePickerControllerSourceTypeCamera) {
			NSString *mediaType = [info objectForKey: UIImagePickerControllerMediaType];
			if ([mediaType isEqualToString:@"public.image"]) {	// Handle a still image capture
				UIImage *originalImage, *editedImage, *imageToSave;
				editedImage = (UIImage *) [info objectForKey: UIImagePickerControllerEditedImage];
				originalImage = (UIImage *) [info objectForKey: UIImagePickerControllerOriginalImage];
				if (editedImage) {
					imageToSave = editedImage;
				} else {
					imageToSave = originalImage;
				}
				NSString *fileName = [self generateFileName:@"img" withExtension:@"jpg"];
				NSString *filePath = [targetFolder stringByAppendingPathComponent:fileName];
				if ([UIImageJPEGRepresentation(imageToSave, 0.9) writeToFile:filePath atomically:YES]){
					[self sendResult:filePath];
				} else {
					[self sendError:[TUTErrorFactory createError:[NSString stringWithFormat:@"failed to save captured image to path %@", filePath]]];
				}
			} else if ([mediaType isEqualToString:@"public.movie"]) { // Handle a movie capture
				NSURL *videoURL = [info objectForKey:UIImagePickerControllerMediaURL];
				NSString *fileName = [self generateFileName:@"movie" withExtension:@"mp4"];
				[self copyFileToLocalFolderAndSendResult:videoURL fileName:fileName];
			} else {
				[self sendError:[TUTErrorFactory createError:[NSString stringWithFormat:@"Invalid media type %@", mediaType]]];
			}
		} else {
			NSURL* srcUrl = [info objectForKey:UIImagePickerControllerReferenceURL];

			// retrieve the filename of the image or video
			PHFetchResult *result = [PHAsset fetchAssetsWithALAssetURLs:@[srcUrl] options:nil];
			PHAsset *assetObject = [result firstObject];
			PHAssetResource *assetResource = [[PHAssetResource assetResourcesForAsset:assetObject] firstObject];
			if (!assetResource){
				[self sendError:[TUTErrorFactory createError:@"No asset resource for image"]];
				return;
			}

			let fileName = [self fixHeicFilename:[assetResource originalFilename]];
			let filePath = [targetFolder stringByAppendingPathComponent:fileName];

			//extracting image from the picker and saving it
			NSURL *mediaUrl =[info objectForKey:UIImagePickerControllerMediaURL];
			NSString *mediaType = [info objectForKey:UIImagePickerControllerMediaType];
			if ([mediaType isEqualToString:@"public.image"]) {
				[[PHImageManager defaultManager] requestImageForAsset:assetObject
														   targetSize:CGSizeMake(assetObject.pixelWidth, assetObject.pixelHeight)
														  contentMode:PHImageContentModeDefault
															  options:nil resultHandler:^(UIImage * _Nullable result, NSDictionary * _Nullable info) {
																  // We are calling this method asynchonously, it may be called with
																  // a low-res version of the image the first time
																  if ([info[PHImageResultIsDegradedKey] boolValue]) {
																	  return;
																  }
																  if (!result) {
																	  [self sendError:[TUTErrorFactory createError:@"No asset resource for image"]];
																	  return;
																  }

																  let imageData = UIImageJPEGRepresentation(result, 1.0);
																  if (![imageData writeToFile:filePath atomically:YES]) {
																	  [self sendError:
																	   [TUTErrorFactory createError:@"failed to write image data"]];
																	  return;
																  }
																  [self sendResult:filePath];
															  }];
			} else if (mediaUrl) { // for videos
				[self copyFileToLocalFolderAndSendResult:mediaUrl fileName:fileName];
			} else {
				[self sendError:[TUTErrorFactory createError:[NSString stringWithFormat:@"Invalid media type %@", mediaType]]];
			}
		}
	}];
};

// from UIImagePickerControllerDelegate protocol
- (void)imagePickerControllerDidCancel:(UIImagePickerController *)picker{
	[_sourceController dismissViewControllerAnimated:YES completion:^{
		[self sendResult:nil];
	}];
};


-(void) copyFileToLocalFolderAndSendResult:(NSURL *) srcUrl fileName:(NSString*)fileName{
	NSError *error = nil;
	NSString *targetFolder = [TUTFileUtil getDecryptedFolder:&error];
	if (error){
		[self sendError:error];
		return;
	}
	
	NSString *filePath = [targetFolder stringByAppendingPathComponent:fileName];
	NSURL *targetUrl = [TUTFileUtil urlFromPath:filePath];
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
	if (filePath != nil) {
		_resultHandler(@[filePath], nil);
	} else {
		_resultHandler(@[], nil);
	}
	_resultHandler = nil;
};

- (void)sendError:(NSError*) error{
	_resultHandler(nil, error);
	_resultHandler = nil;
};

-(void)showPermissionDeniedDialog {
		//User don't give us permission. Showing alert with redirection to settings
		NSString *permissionTitle = @"No permission";
		NSString *permissionInfo =  @"To grant access you have to modify the permissions for this device";
		NSString *settingsActionLabel = @"Settings";
		NSString *cancelActionLabel = @"Cancel";

		UIAlertController * alertController = [UIAlertController alertControllerWithTitle:permissionTitle message:permissionInfo preferredStyle:UIAlertControllerStyleAlert];
		UIAlertAction *cancelAction = [UIAlertAction actionWithTitle: cancelActionLabel style:UIAlertActionStyleCancel handler:nil];
	[alertController addAction:cancelAction];
	UIAlertAction *settingsAction = [UIAlertAction actionWithTitle:settingsActionLabel
															 style:UIAlertActionStyleDefault
														   handler:^(UIAlertAction * _Nonnull action) {
															   [UIApplication.sharedApplication openURL:[NSURL URLWithString:UIApplicationOpenSettingsURLString]
																								options:@{}
																					  completionHandler:nil];
														   }];
		[alertController addAction:settingsAction];
		[[UIApplication sharedApplication].keyWindow.rootViewController presentViewController:alertController animated:YES completion:nil];
		[self sendResult:nil];
}


/**
 * Replace ".heic" or ".heif" extensions with ".jpeg".
 */
-(NSString *)fixHeicFilename:(NSString *)filename {
	var range = [filename rangeOfString:@".heic" options:NSBackwardsSearch | NSCaseInsensitiveSearch];
	if (range.location == NSNotFound) {
		range = [filename rangeOfString:@".heif" options:NSBackwardsSearch | NSCaseInsensitiveSearch];
	}
	if (range.location == NSNotFound) {
		return filename;
	} else {
		return [filename stringByReplacingCharactersInRange:range withString:@".jpeg"];
	}
}


+ (NSString *) translate:(NSString *) key default:(NSString*) defaultValue{
	return [[NSBundle mainBundle] localizedStringForKey:key value:defaultValue table:@"InfoPlist"];
}

@end

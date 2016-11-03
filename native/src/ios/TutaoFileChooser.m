//
//  TutaoFileChooser
//  Tutanota
//
//  Created by Tutao GmbH on 01.11.16.
//
//

#import <Foundation/Foundation.h>
#include "TutaoFileChooser.h"
#import <Cordova/CDV.h>
#import <UIKit/UIViewController.h>
#import "FileUtil.h"
#include "TutaoUtils.h"
#import <Photos/Photos.h>
#include "TutaoErrorFactory.h"


@implementation TutaoFileChooser {
	UIViewController *_viewController;
	CDVPlugin *_cdvPlugin;
	UIDocumentMenuViewController *_attachmentTypeMenu;
	UIImagePickerController *_imagePickerController;
	NSArray *_supportedUTIs;
	void(^imagePickerCompletionHandler)();
	void(^resultHandler)(NSString * filePath, NSError* error);
}

- (TutaoFileChooser*) initWithPlugin:(CDVPlugin*) plugin {
	_cdvPlugin = plugin;
	_supportedUTIs = @[@"public.content"];
	
	UIImagePickerController *localImagePickerController = [[UIImagePickerController alloc] init];
	localImagePickerController.sourceType = UIImagePickerControllerSourceTypeSavedPhotosAlbum;
	localImagePickerController.mediaTypes = [UIImagePickerController availableMediaTypesForSourceType: UIImagePickerControllerSourceTypeSavedPhotosAlbum];
	localImagePickerController.allowsEditing = NO;
	
	_imagePickerController = localImagePickerController;
	_imagePickerController.delegate = self;
	
	UIViewController *localViewController = _cdvPlugin.viewController;;
	imagePickerCompletionHandler = ^void(){
        [localViewController presentViewController:localImagePickerController animated:YES completion:nil];
    };
	
	return self;
}


- (void)openWithResultHandler:(void(^)(NSString * filePath, NSError* error))completionHandler{
	if (resultHandler){
		completionHandler(nil, [TutaoErrorFactory createError:@"file chooser already open"]);
		return;
	}

	resultHandler = completionHandler;
	
	_attachmentTypeMenu = [[UIDocumentMenuViewController alloc] initWithDocumentTypes:_supportedUTIs inMode:UIDocumentPickerModeImport];
	_attachmentTypeMenu.delegate = self;
	
	[_attachmentTypeMenu addOptionWithTitle:@"Photos" image:nil order:UIDocumentMenuOrderFirst handler:imagePickerCompletionHandler];
	[_cdvPlugin.viewController presentViewController:_attachmentTypeMenu animated:YES completion:nil];
}


// from UIDocumentMenuDelegate protocol
- (void)documentMenu:(UIDocumentMenuViewController *)documentMenu didPickDocumentPicker:(UIDocumentPickerViewController *)documentPicker{
	documentPicker.delegate = self;
	[_cdvPlugin.viewController presentViewController:documentPicker animated:YES completion:nil];
	
}
// from UIDocumentMenuDelegate protocol
- (void)documentMenuWasCancelled:(UIDocumentMenuViewController *)documentMenu{
	[self sendResult:nil];
}

// from UIDocumentPickerDelegate protocol
- (void)documentPicker:(UIDocumentPickerViewController *)controller didPickDocumentAtURL:(NSURL *)url{
	//NSLog(@"picked url: %@", url);
	NSString *filePath = [FileUtil pathFromUrl:url];
	[self sendResult:filePath];
}

// from UIDocumentPickerDelegate protocol
- (void)documentPickerWasCancelled:(UIDocumentPickerViewController *)controller{
	[self sendResult:nil];
}

// from UIImagePickerControllerDelegate protocol
- (void)imagePickerController:(UIImagePickerController *)picker didFinishPickingMediaWithInfo:(NSDictionary<NSString *,id> *)info {
	[_cdvPlugin.viewController dismissViewControllerAnimated: YES completion: ^{
		NSURL* srcUrl = [info objectForKey:UIImagePickerControllerReferenceURL];
		// we have to copy the file into a folder of this app.
		NSError *error=nil;
		
		NSString *targetFolder = [FileUtil getDecryptedFolder:&error];
		if(error){
			[self sendError:error];
			return;
		}
	
		// retrieve the filename of the image or video
		PHFetchResult *result = [PHAsset fetchAssetsWithALAssetURLs:@[srcUrl] options:nil];
		PHAsset *assetObject =[result firstObject];
		PHAssetResource *assetResource = [[PHAssetResource assetResourcesForAsset:assetObject] firstObject];
		if (!assetResource){
			[self sendError:[TutaoErrorFactory createError:@"No asset resource for image"]];
			return;
		}
		
		NSString *fileName = [assetResource originalFilename];
		NSString *filePath = [targetFolder stringByAppendingPathComponent:fileName];
		
		//extracting image from the picker and saving it
		NSURL *mediaUrl =[info objectForKey:UIImagePickerControllerMediaURL];
		NSString *mediaType = [info objectForKey:UIImagePickerControllerMediaType];
		if ([mediaType isEqualToString:@"public.image"]){
			[[PHImageManager defaultManager] requestImageDataForAsset:assetObject options:nil resultHandler:^(NSData * imageData, NSString * dataUTI, UIImageOrientation orientation, NSDictionary * info) {
				if(!imageData){
					[self sendError:[TutaoErrorFactory createError:@"No asset resource for image"]];
					return;
				}
				if(![imageData writeToFile:filePath atomically:YES]){
					[self sendError:[TutaoErrorFactory createError:@"failed to write image data"]];
					return;
				}
				[self sendResult:filePath];
			}];
		} else if (mediaUrl) {
			NSURL *targetUrl = [FileUtil urlFromPath:filePath];
			NSFileManager *fileManager = [NSFileManager defaultManager];
			if ([fileManager fileExistsAtPath:filePath]){
				[fileManager removeItemAtPath:filePath error:&error];
				if (error){
					[self sendError:error];
					return;
				}
			}
			[[NSFileManager defaultManager] copyItemAtURL:mediaUrl toURL:targetUrl error:&error];
			if(error){
				[self sendError:error];
				return;
			}
			[self sendResult:filePath];
		} else {
			[self sendError:[TutaoErrorFactory createError:[NSString stringWithFormat:@"Invalid media type %@", mediaType]]];
			return;
		}
	}];
};

- (void)imagePickerControllerDidCancel:(UIImagePickerController *)picker{
	[_cdvPlugin.viewController dismissViewControllerAnimated: YES completion: ^{
		[self sendResult:nil];
	}];
};

- (void)sendResult:(NSString* )filePath{
	resultHandler(filePath, nil);
	resultHandler = nil;
};

- (void)sendError:(NSError*) error{
	resultHandler(nil, error);
	resultHandler = nil;
};


@end

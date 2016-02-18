#import "Open.h"

@implementation Open

/**
 *  open
 *
 *  @param command An array of arguments passed from javascript
 */
- (void)open:(CDVInvokedUrlCommand *)command {

  // Check command.arguments here.
  [self.commandDelegate runInBackground:^{
    CDVPluginResult* commandResult = nil;
    NSString *path = [command.arguments objectAtIndex:0];

    if (path != nil && [path length] > 0) {

      NSURL *url = [NSURL URLWithString:path];
      NSError *err;

      if (url.isFileURL &&
          [url checkResourceIsReachableAndReturnError:&err] == YES) {

        self.fileUrl = url;

        QLPreviewController *previewCtrl = [[QLPreviewController alloc] init];
        previewCtrl.delegate = self;
        previewCtrl.dataSource = self;
          
        [previewCtrl.navigationItem setRightBarButtonItem:nil];
          
        [self.viewController presentViewController:previewCtrl animated:YES completion:nil];

        NSLog(@"cordova.disusered.open - Success!");
        commandResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                          messageAsString:@""];

      } else {
        NSLog(@"cordova.disusered.open - Invalid file URL");
        commandResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR];
      }
    } else {
      NSLog(@"cordova.disusered.open - Missing URL argument");
      commandResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR];
    }

    [self.commandDelegate sendPluginResult:commandResult
                                callbackId:command.callbackId];
  }];
}

#pragma - QLPreviewControllerDataSource Protocol

- (NSInteger)numberOfPreviewItemsInPreviewController:
                 (QLPreviewController *)controller {
  return 1;
}

- (id<QLPreviewItem>)previewController:(QLPreviewController *)controller
                    previewItemAtIndex:(NSInteger)index {
  return self;
}

#pragma - QLPreviewItem Protocol

- (NSURL *)previewItemURL {
  return self.fileUrl;
}

@end

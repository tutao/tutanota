/**
 * Open.m
 *
 * Copyright (C) 2014 Carlos Antonio
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 */

#import "Open.h"

@implementation Open

/**
 *  open
 *
 *  @param command An array of arguments passed from javascript
 */
- (void)open:(CDVInvokedUrlCommand *)command {

  CDVPluginResult *commandResult = nil;
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

      UIViewController *context =
          [[[UIApplication sharedApplication] keyWindow] rootViewController];
      [context presentViewController:previewCtrl animated:YES completion:nil];

      NSLog(@"cordova.bridge.open - Success!");
      commandResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                        messageAsString:@""];

    } else {
      NSLog(@"cordova.bridge.open - Invalid file URL");
      commandResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR];
    }
  } else {
    NSLog(@"cordova.bridge.open - Missing URL argument");
    commandResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR];
  }

  [self.commandDelegate sendPluginResult:commandResult
                              callbackId:command.callbackId];
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

/**
 * Open.h
 *
 * Copyright (C) 2014 Carlos Antonio
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 */

#import <Foundation/Foundation.h>
#import <QuickLook/QuickLook.h>

#import <Cordova/CDV.h>
#import <Cordova/CDVPlugin.h>

@interface Open : CDVPlugin <QLPreviewControllerDelegate,
                             QLPreviewControllerDataSource, QLPreviewItem>

@property(strong, nonatomic) NSURL *fileUrl;
@property(readonly) NSURL *previewItemURL;

@end

/*
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements.  See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership.  The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance
 with the License.  You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
 */

#import "CDVAvailability.h"

#import "CDVPlugin.h"
#import "CDVViewController.h"
#import "CDVCommandDelegate.h"
#import "CDVURLProtocol.h"
#import "CDVInvokedUrlCommand.h"

#import "CDVDebug.h"
#import "CDVPluginResult.h"
#import "CDVWhitelist.h"
#import "CDVLocalStorage.h"
#import "CDVScreenOrientationDelegate.h"
#import "CDVTimer.h"

#import "NSArray+Comparisons.h"
#import "NSData+Base64.h"
#import "NSDictionary+Extensions.h"
#import "NSMutableArray+QueueAdditions.h"
#import "UIDevice+Extensions.h"

#import "CDVJSON.h"

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

#include <objc/message.h>
#import "CDV.h"
#import "CDVCommandQueue.h"
#import "CDVViewController.h"
#import "CDVCommandDelegateImpl.h"

// Parse JS on the main thread if it's shorter than this.
static const NSInteger JSON_SIZE_FOR_MAIN_THREAD = 4 * 1024; // Chosen arbitrarily.
// Execute multiple commands in one go until this many seconds have passed.
static const double MAX_EXECUTION_TIME = .008; // Half of a 60fps frame.

@interface CDVCommandQueue () {
    NSInteger _lastCommandQueueFlushRequestId;
    __weak CDVViewController* _viewController;
    NSMutableArray* _queue;
    NSTimeInterval _startExecutionTime;
}
@end

@implementation CDVCommandQueue

- (BOOL)currentlyExecuting
{
    return _startExecutionTime > 0;
}

- (id)initWithViewController:(CDVViewController*)viewController
{
    self = [super init];
    if (self != nil) {
        _viewController = viewController;
        _queue = [[NSMutableArray alloc] init];
    }
    return self;
}

- (void)dispose
{
    // TODO(agrieve): Make this a zeroing weak ref once we drop support for 4.3.
    _viewController = nil;
}

- (void)resetRequestId
{
    _lastCommandQueueFlushRequestId = 0;
}

- (void)enqueueCommandBatch:(NSString*)batchJSON
{
    if ([batchJSON length] > 0) {
        NSMutableArray* commandBatchHolder = [[NSMutableArray alloc] init];
        [_queue addObject:commandBatchHolder];
        if ([batchJSON length] < JSON_SIZE_FOR_MAIN_THREAD) {
            [commandBatchHolder addObject:[batchJSON JSONObject]];
        } else {
            dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^() {
                    NSMutableArray* result = [batchJSON JSONObject];
                    @synchronized(commandBatchHolder) {
                        [commandBatchHolder addObject:result];
                    }
                    [self performSelectorOnMainThread:@selector(executePending) withObject:nil waitUntilDone:NO];
                });
        }
    }
}

- (void)processXhrExecBridgePoke:(NSNumber*)requestId
{
    NSInteger rid = [requestId integerValue];

    // An ID of 1 is a special case because that signifies the first request of
    // the page. Since resetRequestId is called from webViewDidStartLoad, and the
    // JS context at the time of webViewDidStartLoad is still that of the previous
    // page, it's possible for requests from the previous page to come in after this
    // point. We ignore these by enforcing that ID=1 be the first ID.
    if ((_lastCommandQueueFlushRequestId == 0) && (rid != 1)) {
        CDV_EXEC_LOG(@"Exec: Ignoring exec request from previous page.");
        return;
    }

    // Use the request ID to determine if we've already flushed for this request.
    // This is required only because the NSURLProtocol enqueues the same request
    // multiple times.
    if (rid > _lastCommandQueueFlushRequestId) {
        _lastCommandQueueFlushRequestId = [requestId integerValue];
        [self fetchCommandsFromJs];
        [self executePending];
    }
}

- (void)fetchCommandsFromJs
{
    // Grab all the queued commands from the JS side.
    NSString* queuedCommandsJSON = [_viewController.webView stringByEvaluatingJavaScriptFromString:
        @"cordova.require('cordova/exec').nativeFetchMessages()"];

    CDV_EXEC_LOG(@"Exec: Flushed JS->native queue (hadCommands=%d).", [queuedCommandsJSON length] > 0);
    [self enqueueCommandBatch:queuedCommandsJSON];
}

- (void)executePending
{
    // Make us re-entrant-safe.
    if (_startExecutionTime > 0) {
        return;
    }
    @try {
        _startExecutionTime = [NSDate timeIntervalSinceReferenceDate];

        while ([_queue count] > 0) {
            NSMutableArray* commandBatchHolder = _queue[0];
            NSMutableArray* commandBatch = nil;
            @synchronized(commandBatchHolder) {
                // If the next-up command is still being decoded, wait for it.
                if ([commandBatchHolder count] == 0) {
                    break;
                }
                commandBatch = commandBatchHolder[0];
            }

            while ([commandBatch count] > 0) {
                @autoreleasepool {
                    // Execute the commands one-at-a-time.
                    NSArray* jsonEntry = [commandBatch dequeue];
                    if ([commandBatch count] == 0) {
                        [_queue removeObjectAtIndex:0];
                    }
                    CDVInvokedUrlCommand* command = [CDVInvokedUrlCommand commandFromJson:jsonEntry];
                    CDV_EXEC_LOG(@"Exec(%@): Calling %@.%@", command.callbackId, command.className, command.methodName);

                    if (![self execute:command]) {
#ifdef DEBUG
                            NSString* commandJson = [jsonEntry JSONString];
                            static NSUInteger maxLogLength = 1024;
                            NSString* commandString = ([commandJson length] > maxLogLength) ?
                                [NSString stringWithFormat:@"%@[...]", [commandJson substringToIndex:maxLogLength]] :
                                commandJson;

                            DLog(@"FAILED pluginJSON = %@", commandString);
#endif
                    }
                }

                // Yield if we're taking too long.
                if (([_queue count] > 0) && ([NSDate timeIntervalSinceReferenceDate] - _startExecutionTime > MAX_EXECUTION_TIME)) {
                    [self performSelector:@selector(executePending) withObject:nil afterDelay:0];
                    return;
                }
            }
        }
    } @finally
    {
        _startExecutionTime = 0;
    }
}

- (BOOL)execute:(CDVInvokedUrlCommand*)command
{
    if ((command.className == nil) || (command.methodName == nil)) {
        NSLog(@"ERROR: Classname and/or methodName not found for command.");
        return NO;
    }

    // Fetch an instance of this class
    CDVPlugin* obj = [_viewController.commandDelegate getCommandInstance:command.className];

    if (!([obj isKindOfClass:[CDVPlugin class]])) {
        NSLog(@"ERROR: Plugin '%@' not found, or is not a CDVPlugin. Check your plugin mapping in config.xml.", command.className);
        return NO;
    }
    BOOL retVal = YES;
    double started = [[NSDate date] timeIntervalSince1970] * 1000.0;
    // Find the proper selector to call.
    NSString* methodName = [NSString stringWithFormat:@"%@:", command.methodName];
    SEL normalSelector = NSSelectorFromString(methodName);
    if ([obj respondsToSelector:normalSelector]) {
        // [obj performSelector:normalSelector withObject:command];
        ((void (*)(id, SEL, id))objc_msgSend)(obj, normalSelector, command);
    } else {
        // There's no method to call, so throw an error.
        NSLog(@"ERROR: Method '%@' not defined in Plugin '%@'", methodName, command.className);
        retVal = NO;
    }
    double elapsed = [[NSDate date] timeIntervalSince1970] * 1000.0 - started;
    if (elapsed > 10) {
        NSLog(@"THREAD WARNING: ['%@'] took '%f' ms. Plugin should use a background thread.", command.className, elapsed);
    }
    return retVal;
}

@end

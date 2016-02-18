/*
 * Copyright (c) 2013-2016 by appPlant UG. All rights reserved.
 *
 * @APPPLANT_LICENSE_HEADER_START@
 *
 * This file contains Original Code and/or Modifications of Original Code
 * as defined in and that are subject to the Apache License
 * Version 2.0 (the 'License'). You may not use this file except in
 * compliance with the License. Please obtain a copy of the License at
 * http://opensource.org/licenses/Apache-2.0/ and read it before using this
 * file.
 *
 * The Original Code and all software distributed under the License are
 * distributed on an 'AS IS' basis, WITHOUT WARRANTY OF ANY KIND, EITHER
 * EXPRESS OR IMPLIED, AND APPLE HEREBY DISCLAIMS ALL SUCH WARRANTIES,
 * INCLUDING WITHOUT LIMITATION, ANY WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE, QUIET ENJOYMENT OR NON-INFRINGEMENT.
 * Please see the License for the specific language governing rights and
 * limitations under the License.
 *
 * @APPPLANT_LICENSE_HEADER_END@
 */

#import "APPAppEventDelegate.h"
#import "CDVPlugin+APPAppEvent.h"
#import "AppDelegate+APPAppEvent.h"

#import <objc/runtime.h>

@implementation CDVPlugin (APPAppEvent)

static IMP orig_pluginInitialize;

#pragma mark -
#pragma mark Life Cycle

/**
 * Its dangerous to override a method from within a category.
 * Instead we will use method swizzling.
 */
+ (void) initialize
{
    // To keep compatibility with local-notifiations v0.8.4
    if ([NSStringFromClass(self) isEqualToString:@"APPLocalNotification"]
        || [self conformsToProtocol:@protocol(APPAppEventDelegate)]) {

        orig_pluginInitialize = [self exchange_init_methods];
    }
}

#pragma mark -
#pragma mark Delegate

/**
 * Registers obervers after plugin was initialized.
 */
void swizzled_pluginInitialize(id self, SEL _cmd)
{
    if (orig_pluginInitialize != NULL) {
        ((void(*)(id, SEL))orig_pluginInitialize)(self, _cmd);
        orig_pluginInitialize = NULL;
    }

    [self addObserver:NSSelectorFromString(@"didReceiveLocalNotification:")
                 name:CDVLocalNotification
               object:NULL];

    [self addObserver:NSSelectorFromString(@"didFinishLaunchingWithOptions:")
                 name:UIApplicationDidFinishLaunchingNotification
               object:NULL];

    [self addObserver:NSSelectorFromString(@"didRegisterUserNotificationSettings:")
                 name:UIApplicationRegisterUserNotificationSettings
               object:NULL];
}

#pragma mark -
#pragma mark Core

/**
 * Exchange the method implementations for pluginInitialize
 * and return the original implementation.
 */
+ (IMP) exchange_init_methods
{
    IMP swizzleImp = (IMP) swizzled_pluginInitialize;
    Method origImp = class_getInstanceMethod(self, @selector(pluginInitialize));

    if (method_getImplementation(origImp) != swizzleImp) {
        return method_setImplementation(origImp, swizzleImp);
    }

    return NULL;
}

/**
 * Register an observer if the caller responds to it.
 */
- (void) addObserver:(SEL)selector
                name:(NSString*)event
              object:(id)object
{
    if (![self respondsToSelector:selector])
        return;

    NSNotificationCenter* center = [NSNotificationCenter
                                    defaultCenter];

    [center addObserver:self
               selector:selector
                   name:event
                 object:object];
}

@end

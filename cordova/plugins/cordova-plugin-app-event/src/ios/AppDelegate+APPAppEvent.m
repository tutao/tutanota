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

#import "AppDelegate+APPAppEvent.h"
#import <Availability.h>
#import <objc/runtime.h>

NSString* const UIApplicationRegisterUserNotificationSettings = @"UIApplicationRegisterUserNotificationSettings";

@implementation AppDelegate (APPAppEvent)

#pragma mark -
#pragma mark Life Cycle

/**
 * Its dangerous to override a method from within a category.
 * Instead we will use method swizzling.
 */
+ (void) load
{
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 80000
    [self exchange_methods:@selector(application:didRegisterUserNotificationSettings:)
                  swizzled:@selector(swizzled_application:didRegisterUserNotificationSettings:)];
#endif

#if CORDOVA_VERSION_MIN_REQUIRED >= 40000
    [self exchange_methods:@selector(application:didReceiveLocalNotification:)
                  swizzled:@selector(swizzled_application:didReceiveLocalNotification:)];
#endif
}

#pragma mark -
#pragma mark Delegate

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 80000
/**
 * Tells the delegate what types of notifications may be used
 * to get the user’s attention.
 */
- (void)           swizzled_application:(UIApplication*)application
    didRegisterUserNotificationSettings:(UIUserNotificationSettings*)settings
{
    // re-post (broadcast)
    [self postNotificationName:UIApplicationRegisterUserNotificationSettings object:settings];
    // This actually calls the original method over in AppDelegate
    [self swizzled_application:application didRegisterUserNotificationSettings:settings];
}
#endif

#if CORDOVA_VERSION_MIN_REQUIRED >= 40000
/**
 * Repost all local notification using the default NSNotificationCenter so
 * multiple plugins may respond.
 */
- (void)   swizzled_application:(UIApplication*)application
    didReceiveLocalNotification:(UILocalNotification*)notification
{
    // re-post (broadcast)
    [self postNotificationName:CDVLocalNotification object:notification];
    // This actually calls the original method over in AppDelegate
    [self swizzled_application:application didReceiveLocalNotification:notification];
}
#endif

#pragma mark -
#pragma mark Core

/**
 * Exchange the method implementations.
 */
+ (void) exchange_methods:(SEL)original swizzled:(SEL)swizzled
{
    class_addMethod(self, original, (IMP) defaultMethodIMP, "v@:");

    Method original_method = class_getInstanceMethod(self, original);
    Method swizzled_method = class_getInstanceMethod(self, swizzled);

    method_exchangeImplementations(original_method, swizzled_method);
}

#pragma mark -
#pragma mark Helper

void defaultMethodIMP (id self, SEL _cmd) { /* nothing to do here */ }

/**
 * Broadcasts the notification to all listeners.
 */
- (void) postNotificationName:(NSString*)aName object:(id)anObject
{
    [[NSNotificationCenter defaultCenter] postNotificationName:aName
                                                        object:anObject];
}

@end

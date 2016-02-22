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

#import "UIApplication+APPBadge.h"

@implementation UIApplication (APPBadge)

#pragma mark -
#pragma mark Permissions

/**
 * If the app has the permission to display badges.
 */
- (BOOL) hasPermissionToDisplayBadges
{
    if (![self respondsToRegisterUserNotificationSettings])
        return YES;

    UIUserNotificationSettings *settings;

    settings = [[UIApplication sharedApplication]
                currentUserNotificationSettings];

    return (settings.types & UIUserNotificationTypeBadge);
}

/**
 * Register permission to display badges.
 */
- (void) registerPermissionToDisplayBadges
{
    if (![self respondsToRegisterUserNotificationSettings])
        return;

    UIUserNotificationType types;
    UIUserNotificationSettings *settings;

    settings = [[UIApplication sharedApplication]
                currentUserNotificationSettings];

    types    = settings.types | UIUserNotificationTypeBadge;

    settings = [UIUserNotificationSettings settingsForTypes:types
                                                 categories:nil];

    [[UIApplication sharedApplication]
     registerUserNotificationSettings:settings];
}

#pragma mark -
#pragma mark Helper methods

/**
 * If UIApplication responds to seelctor registerUserNotificationSettings:
 *
 * @return
 *      true for iOS8 and above
 */
- (BOOL) respondsToRegisterUserNotificationSettings
{
    return [[UIApplication sharedApplication]
            respondsToSelector:@selector(registerUserNotificationSettings:)];
}

@end

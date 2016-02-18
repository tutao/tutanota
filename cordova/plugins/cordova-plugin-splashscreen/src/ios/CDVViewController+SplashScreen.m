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

#import "CDVViewController+SplashScreen.h"
#import <objc/runtime.h>

@implementation CDVViewController (SplashScreen)

@dynamic enabledAutorotation;

- (void)setEnabledAutorotation:(BOOL)value
{
    objc_setAssociatedObject(self,
                             @selector(enabledAutorotation),
                             [NSNumber numberWithBool:value],
                             OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

- (BOOL)enabledAutorotation
{
    NSNumber *number =  (NSNumber *)objc_getAssociatedObject(self, @selector(enabledAutorotation));

    // Defaulting to YES to correspond parent CDVViewController behavior
    if (number == nil)
    {
        return YES;
    }

    return [number boolValue];
}

+ (void)load
{
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        Class class = [self class];
        
        SEL originalSelector = @selector(shouldAutorotate);
        SEL swizzledSelector = @selector(splash_shouldAutorotate);
        
        Method originalMethod = class_getInstanceMethod(class, originalSelector);
        Method swizzledMethod = class_getInstanceMethod(class, swizzledSelector);
        
        BOOL didAddMethod = class_addMethod(class,
                                            originalSelector,
                                            method_getImplementation(swizzledMethod),
                                            method_getTypeEncoding(swizzledMethod));
        
        if (didAddMethod) {
            class_replaceMethod(class,
                                swizzledSelector,
                                method_getImplementation(originalMethod),
                                method_getTypeEncoding(originalMethod));
        } else {
            method_exchangeImplementations(originalMethod, swizzledMethod);
        }
    });
}

#pragma mark - Method Swizzling

- (BOOL)splash_shouldAutorotate
{
    return self.enabledAutorotation;
}


- (BOOL)shouldAutorotateDefaultValue
{
    return [self splash_shouldAutorotate];
}

@end

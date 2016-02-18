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

#include <sys/sysctl.h>

#import "CDVDevice.h"

#define SYSTEM_VERSION_PLIST    @"/System/Library/CoreServices/SystemVersion.plist"

@implementation CDVDevice

- (NSString*) modelVersion {
    size_t size;

    sysctlbyname("hw.machine", NULL, &size, NULL, 0);
    char* machine = malloc(size);
    sysctlbyname("hw.machine", machine, &size, NULL, 0);
    NSString* modelVersion = [NSString stringWithUTF8String:machine];
    free(machine);

    return modelVersion;
}


- (NSString*) getSerialNr {
    NSString* serialNr;
    io_service_t platformExpert = IOServiceGetMatchingService(kIOMasterPortDefault, IOServiceMatching("IOPlatformExpertDevice"));
    if (platformExpert) {
        CFTypeRef serialNumberAsCFString =
                IORegistryEntryCreateCFProperty(platformExpert,
                        CFSTR(kIOPlatformSerialNumberKey),
                        kCFAllocatorDefault, 0);
        if (serialNumberAsCFString) {
            serialNr = (__bridge NSString*) serialNumberAsCFString;
        }
        IOObjectRelease(platformExpert);
    }
    return serialNr;
}

- (NSString*) uniqueAppInstanceIdentifier {
    NSUserDefaults* userDefaults = [NSUserDefaults standardUserDefaults];
    static NSString* UUID_KEY = @"CDVUUID";

    NSString* app_uuid = [userDefaults stringForKey:UUID_KEY];

    if (app_uuid == nil) {
        CFUUIDRef uuidRef = CFUUIDCreate(kCFAllocatorDefault);
        CFStringRef uuidString = CFUUIDCreateString(kCFAllocatorDefault, uuidRef);

        app_uuid = [NSString stringWithString:(__bridge NSString*) uuidString];
        [userDefaults setObject:app_uuid forKey:UUID_KEY];
        [userDefaults synchronize];

        CFRelease(uuidString);
        CFRelease(uuidRef);
    }

    return app_uuid;
}

- (NSString*) platform {
    return [NSDictionary dictionaryWithContentsOfFile:SYSTEM_VERSION_PLIST][@"ProductName"];
}

- (NSString*) systemVersion {
    return [NSDictionary dictionaryWithContentsOfFile:SYSTEM_VERSION_PLIST][@"ProductVersion"];
}

- (void) getDeviceInfo:(CDVInvokedUrlCommand*) command {
    NSDictionary* deviceProperties = [self deviceProperties];
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:deviceProperties];

    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (NSDictionary*) deviceProperties {
    NSMutableDictionary* devProps = [NSMutableDictionary dictionaryWithCapacity:4];

    devProps[@"manufacturer"] = @"Apple";
    devProps[@"model"] = [self modelVersion];
    devProps[@"platform"] = [self platform];
    devProps[@"version"] = [self systemVersion];
    devProps[@"uuid"] = [self uniqueAppInstanceIdentifier];
    devProps[@"cordova"] = [[self class] cordovaVersion];
    devProps[@"serial"] = [self getSerialNr];
    devProps[@"isVirtual"] = @NO;

    NSDictionary* devReturn = [NSDictionary dictionaryWithDictionary:devProps];
    return devReturn;
}

+ (NSString*) cordovaVersion {
    return CDV_VERSION;
}

@end

//
//  TUTKeychainManager.m
//  tutanota
//
//  Created by Tutao GmbH on 17.06.19.
//  Copyright © 2019 Tutao GmbH. All rights reserved.
//

#import "TUTKeychainManager.h"

#import "../Utils/Swiftier.h"

#import "../Utils/TUTErrorFactory.h"

static const NSString *const tag = @"de.tutao.tutanota.notificationkey.";

@implementation TUTKeychainManager

- (void)storeKey:(NSData *)key withId:(NSString *)keyId error:(NSError **)error {
    let keyTag = [self keyTagFromKeyId:keyId];

    NSError *getKeyError;
    let existingKey = [self getKeyWithError:keyId error:&getKeyError];

    OSStatus status;
    if (existingKey) {
        let updateQuery = @{
                            (id)kSecClass:(id)kSecClassKey,
                            (id)kSecAttrApplicationTag:keyTag
                          };

        let updateFields = @{
                               (id)kSecValueData:key,
                               (id)kSecAttrAccessible:(id)kSecAttrAccessibleAlwaysThisDeviceOnly
                            };
        status = SecItemUpdate((__bridge CFDictionaryRef)updateQuery, (__bridge CFDictionaryRef) updateFields);
    } else {
        NSDictionary* addquery = @{
                                   (id)kSecValueData:key,
                                   (id)kSecClass:(id)kSecClassKey,
                                   (id)kSecAttrApplicationTag:keyTag,
                                   (id)kSecAttrAccessible:(id)kSecAttrAccessibleAlwaysThisDeviceOnly // Allow access to keychain item if the device is locked.
                                   };
        status = SecItemAdd((__bridge CFDictionaryRef)addquery, NULL);
    }


    if (status != errSecSuccess) {
        let errorString = [NSString stringWithFormat:@"Could not store the key, status: %jd", (intmax_t) status];
        *error = [TUTErrorFactory createError:errorString];
        return;
    }
}

- (NSData * _Nullable)getKeyWithError:(NSString *)keyId error:(NSError **)error {
    let keyTag = [self keyTagFromKeyId:keyId];
    let getquery = @{ (id)kSecClass:(id)kSecClassKey,
                      (id)kSecAttrApplicationTag:keyTag,
                      (id)kSecReturnData:[NSNumber numberWithBool:YES]
                      };
    // See here for some more context of these magic incantations:
    // https://stackoverflow.com/a/16901557

    // Core Foundation (C API) key
    CFDataRef key = NULL;
    // Retaining the query until we are done
    CFDictionaryRef cfquery = (CFDictionaryRef)CFBridgingRetain(getquery);
    OSStatus status = SecItemCopyMatching(cfquery, (CFTypeRef *)&key);
    // Manually releasing query when we are done
    CFRelease(cfquery);

    if (status != errSecSuccess) {
        *error = [TUTErrorFactory createError:[NSString stringWithFormat:@"Failed to get key %@, status: %jd", keyId, (intmax_t) status]];
        return nil;
    } else if (key) {
        // SecItemCopyMatching has "copy" in its name which means we own it and are responsible for
        // releasing it. Since we don't want to release it but want to return it to the caller we
        // transfer ownership to ARC.
        NSData *nsDataKey = CFBridgingRelease(key);
        return nsDataKey;
    } else {
        return nil;
    }
}

-(NSData *)keyTagFromKeyId:(NSString *)keyId {
    let keyTag = [NSString stringWithFormat:@"%@%@", tag, keyId];
    return [keyTag dataUsingEncoding:NSUTF8StringEncoding];
}

- (void)removePushIdentifierKeys:(NSError **)error  {
    NSDictionary* deleteQuery = @{
                               (id)kSecClass:(id)kSecClassKey,
                             };

    OSStatus status = SecItemDelete((__bridge CFDictionaryRef) deleteQuery);
    if (status != errSecSuccess) {
        let errorString = [NSString stringWithFormat:@"Could not delete the keys, status: %jd", (intmax_t) status];
        *error = [TUTErrorFactory createError:errorString];
        return;
    }
}

@end

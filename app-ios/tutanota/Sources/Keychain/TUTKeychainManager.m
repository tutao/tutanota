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
    let keyTag = [NSString stringWithFormat:@"%@%@", tag, keyId];
    let tagData = [keyTag dataUsingEncoding:NSUTF8StringEncoding];
    NSLog(@"Adding key with tag: %@, %@", keyTag, tagData);
    NSDictionary* addquery = @{
                               (id)kSecValueData:key,
                               (id)kSecClass:(id)kSecClassKey,
                               (id)kSecAttrApplicationTag:tagData,
                               };
    
    OSStatus status = SecItemAdd((__bridge CFDictionaryRef)addquery, NULL);
    if (status != errSecSuccess) {
        let errorString = [NSString stringWithFormat:@"Could not store the key, status: %zd", status];
        *error = [TUTErrorFactory createError:errorString];
        return;
    }
}

- (NSData * _Nullable)getKeyWithError:(NSString *)keyId error:(NSError **)error {;
    let keyTag = [NSString stringWithFormat:@"%@%@", tag, keyId];
    let tagData = [keyTag dataUsingEncoding:NSUTF8StringEncoding];
    NSLog(@"Getting key with tag: %@, %@", keyTag, tagData);
    let getquery = @{ (id)kSecClass:(id)kSecClassKey,
                      (id)kSecAttrApplicationTag:tagData,
                      (id)kSecReturnData:[NSNumber numberWithBool:YES]
                      };
    
    CFDataRef key = NULL;
    OSStatus status = SecItemCopyMatching((__bridge CFDictionaryRef)getquery,
                                          (CFTypeRef *)&key);
    
    if (status != errSecSuccess) {
        return NULL;
    } else if (key) {
        return (__bridge NSData *)key;
    } else {
        return NULL;
    }
}
@end

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
    NSDictionary* addquery = @{
                               (id)kSecValueData:key,
                               (id)kSecClass:(id)kSecClassKey,
                               (id)kSecAttrApplicationTag:keyTag,
                               };
    
    NSError *getKeyError;
    let existingKey = [self getKeyWithError:keyId error:&getKeyError];
    
    OSStatus status;
    if (existingKey) {
        let updateFields = @{
                               (id)kSecValueData:key
                               };
        status = SecItemUpdate((__bridge CFDictionaryRef)addquery, (__bridge CFDictionaryRef) updateFields);
    } else {
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
    
    CFDataRef key = NULL;
    OSStatus status = SecItemCopyMatching((__bridge CFDictionaryRef)getquery,
                                          (CFTypeRef *)&key);
    
    if (status != errSecSuccess) {
        *error = [TUTErrorFactory createError:[NSString stringWithFormat:@"Failed to get key %@, status: %jd", keyId, (intmax_t) status]];
        return nil;
    } else if (key) {
        return (__bridge NSData *)key;
    } else {
        return nil;
    }
}

-(NSData *)keyTagFromKeyId:(NSString *)keyId {
    let keyTag = [NSString stringWithFormat:@"%@%@", tag, keyId];
    return [keyTag dataUsingEncoding:NSUTF8StringEncoding];
}

@end

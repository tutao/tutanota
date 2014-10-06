//
//  Crypto.h
//  Tutanota plugin
//
//  Created by Tutao GmbH on 24.09.14.
//
//

#ifndef Tutanota_plugin_Crypto_h
#define Tutanota_plugin_Crypto_h

#import <Cordova/CDV.h>

@interface Crypto : CDVPlugin

- (void)generateRsaKey:(CDVInvokedUrlCommand*)command;
- (void)rsaEncrypt:(CDVInvokedUrlCommand*)command;
- (void)rsaDecrypt:(CDVInvokedUrlCommand*)command;

@end

#endif

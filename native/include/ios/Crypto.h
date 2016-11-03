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

/* Definitions from the Crypto.js interface. */
- (void)seed:(CDVInvokedUrlCommand*)command;
- (void)generateRsaKey:(CDVInvokedUrlCommand*)command;
- (void)rsaEncrypt:(CDVInvokedUrlCommand*)command;
- (void)rsaDecrypt:(CDVInvokedUrlCommand*)command;
- (void)generateKeyFromPassphrase:(CDVInvokedUrlCommand*)command;

- (void)aesEncrypt:(CDVInvokedUrlCommand*)command;
- (void)aesEncryptFile:(CDVInvokedUrlCommand*)command;
- (void)aesDecrypt:(CDVInvokedUrlCommand*)command;
- (void)aesDecryptFile:(CDVInvokedUrlCommand*)command;

@end

#endif

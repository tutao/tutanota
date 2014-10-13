//
//  Crypto.m
//  Tutanota plugin
//
//  Created by Tutao GmbH on 24.09.14.
//
//

#import <Foundation/Foundation.h>


#import "Crypto.h"
#import <Cordova/CDV.h>
#import <openssl/ossl_typ.h>
#import <openssl/md5.h>
#import <openssl/rsa.h>
#import <openssl/err.h>
#import <openssl/evp.h>
#import "rsa_oaep_sha256.h"
#import <openssl/bn.h>
#import <openssl/rand.h>
#import "JFBCrypt.h"

@implementation Crypto

- (void)rsaEncrypt:(CDVInvokedUrlCommand*)command{
	[self.commandDelegate runInBackground:^{
		CDVPluginResult* pluginResult = nil;
		if ([command.arguments objectAtIndex:0] != [NSNull null]) {
			// seeds the PRNG (pseudorandom number generator)
			NSString * base64Seed = [command.arguments objectAtIndex:0];
			NSData * seed = [NSData dataFromBase64String:base64Seed];
			RAND_seed([seed bytes], [seed length]);

			pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
		} else {
			pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR];
		}
		[self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
	 }];
}

- (void)generateRsaKey:(CDVInvokedUrlCommand*)command {
	[self.commandDelegate runInBackground:^{
		CDVPluginResult* pluginResult = nil;
		if ([command.arguments objectAtIndex:0] != [NSNull null]) {
			NSNumber* keyLength = [command.arguments objectAtIndex:0];
			RSA* rsaKey = RSA_new();
			int keyLengthInt = [keyLength integerValue];
			NSString * publicExponent = @"65537";
			BIGNUM * e = BN_new();
			BN_dec2bn(&e, [publicExponent UTF8String]); // public exponent <- 65537
		
			// generate rsa key
			int status = RSA_generate_key_ex(rsaKey, keyLengthInt, e, NULL);
			if ( status > 0 ){
				NSMutableDictionary* keyPair = [Crypto createRSAKeyPair:rsaKey keyLength:keyLength version:[NSNumber numberWithInt:0]];
				pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:keyPair];
			} else {
				[Crypto logError:@"Error while generating rsa key"];
				pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR];
			}
			BN_free(e);
			RSA_free(rsaKey);
		} else {
			pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR];
		}
		[self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
	 }];
}

- (void)rsaEncrypt:(CDVInvokedUrlCommand*)command{

	NSObject* jsPublicKey = [command.arguments objectAtIndex:0];
    NSString* base64Data = [command.arguments objectAtIndex:1];
	//convert json data to private key;
	RSA* publicRsaKey = [Crypto createPublicRSAKey:jsPublicKey];
	
	// convert base64 data to bytes.
	NSData *decodedData = [NSData dataFromBase64String:base64Data];
	
	
	[self.commandDelegate runInBackground:^{
		CDVPluginResult* pluginResult = nil;
		int rsaSize = RSA_size(publicRsaKey); // should be 256 for a 2048 bit rsa key
		NSMutableData *paddingBuffer = [NSMutableData dataWithLength:rsaSize];
	
		// add padding
		int status = RSA_padding_add_PKCS1_OAEP_SHA256([paddingBuffer mutableBytes], [paddingBuffer length], [decodedData bytes], [decodedData length], NULL, 0);

		NSMutableData *encryptedData = [NSMutableData dataWithLength:rsaSize];
		if ( status >= 0 ){
			// encrypt
			status = RSA_public_encrypt([paddingBuffer length], [paddingBuffer bytes], [encryptedData mutableBytes], publicRsaKey,  RSA_NO_PADDING);
		}
		if (status >= 0) {
			// Success
			NSString* encryptedBase64 = [encryptedData base64EncodedStringWithOptions:0];
			pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:encryptedBase64];
		} else {
			// Error handling
			[Crypto logError:@"encryption failed"];
			pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR];
		}
		[self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
		RSA_free(publicRsaKey);
	}];
}

- (void)rsaDecrypt:(CDVInvokedUrlCommand*)command{

    NSObject* jsPrivateKey = [command.arguments objectAtIndex:0];
    NSString* base64Data = [command.arguments objectAtIndex:1];
	
	//convert json data to private key;
	RSA* privateRsaKey = [Crypto createPrivateRSAKey:jsPrivateKey];
	
	int rsaCheckResult = RSA_check_key(privateRsaKey);
	if (rsaCheckResult != 1){
		[Crypto logError:@"Invald private key"];
	}
	
	// convert encrypted base64 data to bytes.
	NSData *decodedData = [NSData dataFromBase64String:base64Data];
	
	int rsaSize = RSA_size(privateRsaKey); // should be 256 for a 2048 bit rsa key
	NSMutableData *decryptedBuffer = [NSMutableData dataWithLength:rsaSize];


	[self.commandDelegate runInBackground:^{
		CDVPluginResult* pluginResult = nil;
		// Decrypt
		int status = RSA_private_decrypt([decodedData length], [decodedData bytes], [decryptedBuffer mutableBytes], privateRsaKey, RSA_NO_PADDING);

		NSMutableData *paddingBuffer =[NSMutableData dataWithLength:rsaSize];
		// decryption succesfull remove padding
		if ( status >= 0 ){
			// converstion to bn and back is necessary to prepare paremeter flen for RSA_padding_check. Passing 256 to flen does not work.
			// see: http://marc.info/?l=openssl-users&m=108573630510562&w=2
			BIGNUM *bn = BN_bin2bn([decryptedBuffer bytes], [decryptedBuffer length], NULL);
			int flen = BN_bn2bin(bn, [decryptedBuffer mutableBytes]);
			status = RSA_padding_check_PKCS1_OAEP_SHA256([paddingBuffer mutableBytes], [paddingBuffer length], [decryptedBuffer bytes], flen, rsaSize, NULL, 0);
		}
	
		if (status > 0) {
			// Success
			NSData* decryptedData = [NSData dataWithBytes:[paddingBuffer bytes] length:status];
			NSString* decryptedBase64 = [decryptedData base64EncodedStringWithOptions:0];
			pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:decryptedBase64];
		} else {
			// Error handling
			[Crypto logError:@"decryption failed"];
			pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR];
		}
		[self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
		RSA_free(privateRsaKey);
     }];
}



+ (RSA *)createPrivateRSAKey:(NSObject*)key {
 	NSString* modulus = [key valueForKey:@"modulus"];
	NSString* privateExponent = [key valueForKey:@"privateExponent"];
	NSString* primeP = [key valueForKey:@"primeP"];
	NSString* primeQ = [key valueForKey:@"primeQ"];
	NSString* primeExponentP = [key valueForKey:@"primeExponentP"];
 	NSString* primeExponentQ = [key valueForKey:@"primeExponentQ"];
 	NSString* crtCoefficient = [key valueForKey:@"crtCoefficient"];
	
	RSA* rsaKey = RSA_new();
	rsaKey->e = BN_new();
	rsaKey->n= BN_new();
	rsaKey->d= BN_new();
	rsaKey->p = BN_new();
	rsaKey->q = BN_new();
	rsaKey->dmp1 = BN_new();
	rsaKey->dmq1 = BN_new();
	rsaKey->iqmp = BN_new();
	
	const char * publicExponent = "65537";
	BN_dec2bn(&rsaKey->e, publicExponent ); // public exponent <- 65537
	[Crypto toBIGNUM:rsaKey->n fromB64:modulus]; // public modulus <- modulus
	[Crypto toBIGNUM:rsaKey->d fromB64:privateExponent]; // private exponent <- privateExponent
	[Crypto toBIGNUM:rsaKey->p fromB64:primeP]; // secret prime factor <- primeP
	[Crypto toBIGNUM:rsaKey->q fromB64:primeQ ]; // secret prime factor <- primeQ
	[Crypto toBIGNUM:rsaKey->dmp1 fromB64:primeExponentP]; // d mod (p-1) <- primeExponentP
	[Crypto toBIGNUM:rsaKey->dmq1 fromB64:primeExponentQ]; // d mod (q-1) <- primeExponentQ
	[Crypto toBIGNUM:rsaKey->iqmp fromB64:crtCoefficient]; // q^-1 mod p <- crtCoefficient
    return rsaKey;
}


+ (RSA *)createPublicRSAKey:(NSObject*)key {
 	NSString* modulus = [key valueForKey:@"modulus"];
	
	RSA* rsaKey = RSA_new();
	rsaKey->e = BN_new();
	rsaKey->n= BN_new();
	
	const char * publicExponent = "65537";
	BN_dec2bn(&rsaKey->e, publicExponent ); // public exponent <- 65537
	[Crypto toBIGNUM:rsaKey->n fromB64:modulus]; // public modulus <- modulus
    return rsaKey;
}



+ (BIGNUM *)toBIGNUM:(BIGNUM*)number fromB64:(NSString*)value{
	NSData *valueData = [NSData dataFromBase64String:value];
    return BN_bin2bn((unsigned char *) [valueData bytes], [valueData length], number);
}

+ (NSString *)toB64:(BIGNUM*)number{
	int numBytes = BN_num_bytes(number);
	NSMutableData* nsData = [NSMutableData dataWithLength:numBytes];
	BN_bn2bin(number, [nsData mutableBytes]);
	return [nsData base64EncodedStringWithOptions:0];
}


+ (void) logError:(NSString *)msg {
	ERR_load_crypto_strings();
	int errorCode = ERR_get_error();
		size_t messageBufferSize = 256;
		char* messageBuffer = (char *)calloc(messageBufferSize, sizeof(char));
	while( errorCode != 0){
		ERR_error_string( errorCode, messageBuffer);
		NSLog(@"Error: %@ <%i|%s>", msg, errorCode, messageBuffer);
		errorCode = ERR_get_error();
	}
	ERR_free_strings();
}


+ (NSMutableDictionary *)createRSAKeyPair:(RSA*)key keyLength:(NSNumber*)keyLength version:(NSNumber*)version {
	NSMutableDictionary* publicKey= [NSMutableDictionary new];
	[publicKey setObject: version forKey: @"version"];
	[publicKey setObject: keyLength forKey: @"keyLength"];
	[publicKey setObject: [Crypto toB64:key->n] forKey: @"modulus"];

	NSMutableDictionary* privateKey= [NSMutableDictionary new];
	[privateKey setObject: version forKey: @"version"];
	[privateKey setObject: keyLength forKey: @"keyLength"];
	[privateKey setObject: [Crypto toB64:key->n]  forKey: @"modulus"];

	[privateKey setObject: [Crypto toB64:key->d] forKey: @"privateExponent"];
	[privateKey setObject: [Crypto toB64:key->p] forKey: @"primeP"];
	[privateKey setObject: [Crypto toB64:key->q] forKey: @"primeQ"];
	[privateKey setObject: [Crypto toB64:key->dmp1] forKey: @"primeExponentP"];
	[privateKey setObject: [Crypto toB64:key->dmq1] forKey: @"primeExponentQ"];
	[privateKey setObject: [Crypto toB64:key->iqmp] forKey: @"crtCoefficient"];

	NSMutableDictionary* keyPair= [NSMutableDictionary new];
	[keyPair setObject: publicKey forKey: @"publicKey"];
	[keyPair setObject: privateKey forKey: @"privateKey"];
    return keyPair;
}



- (void)generateKeyFromPassphrase:(CDVInvokedUrlCommand*)command{
     [self.commandDelegate runInBackground:^{
		CDVPluginResult* pluginResult = nil;
		NSString* base64Passphrase = [command.arguments objectAtIndex:0];
		NSString* base64Salt = [command.arguments objectAtIndex:1];
		NSNumber* rounds = [command.arguments objectAtIndex:2];
	
		NSData * saltData = [NSData dataFromBase64String:base64Salt];
		NSData * passwordData = [NSData dataFromBase64String:base64Passphrase];
		
		JFBCrypt * bCrypt = [JFBCrypt new];
		NSData* hashedData = [bCrypt hashPassword: passwordData withSalt: saltData rounds: [rounds intValue]];
		// Only the first 16 bytes are needed for the generate key.
		NSData* returnData = [NSData dataWithBytes:[hashedData bytes] length:16];

		NSString * result = [returnData base64EncodedStringWithOptions:0];
		pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:result];
	
		[self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
     }];
}



@end




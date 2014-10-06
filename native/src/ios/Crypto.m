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

@implementation Crypto

- (void)generateRsaKey:(CDVInvokedUrlCommand*)command {
	CDVPluginResult* pluginResult = nil;
	if ([command.arguments objectAtIndex:0] != [NSNull null]) {
	    NSNumber* keyLength = [command.arguments objectAtIndex:0];	
		
		pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
	} else {
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR];
    }
   [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}


- (void)rsaEncrypt:(CDVInvokedUrlCommand*)command{
	CDVPluginResult* pluginResult = nil;
	NSObject* jsPublicKey = [command.arguments objectAtIndex:0];
    NSString* base64Data = [command.arguments objectAtIndex:1];
	//convert json data to private key;
	RSA* publicRsaKey = [Crypto createPublicRSAKey:jsPublicKey];
	
	// convert base64 data to bytes.
	NSData *decodedData = [NSData dataFromBase64String:base64Data];
	
	unsigned char * decryptedBuffer = (unsigned char *)[decodedData bytes];
	int decryptedBufferSize = (int)[decodedData length];
	

	int bufferSize = 256;
	unsigned char *paddingBuffer = (unsigned char *) calloc(bufferSize, sizeof(unsigned char));
	
	// add padding
	int status = RSA_padding_add_PKCS1_OAEP_SHA256(paddingBuffer, bufferSize, decryptedBuffer, decryptedBufferSize, NULL, 0);

	unsigned char *encryptedBuffer = (unsigned char *) calloc(bufferSize, sizeof(unsigned char));
	if ( status >= 0 ){
		// encrypt
		status = RSA_public_encrypt(bufferSize, paddingBuffer, encryptedBuffer, publicRsaKey,  RSA_NO_PADDING);
	}
	if (status >= 0) {
		// Success
		NSData* encryptedData = [NSData dataWithBytes:encryptedBuffer length:status];
		NSString* encryptedBase64 = [encryptedData base64EncodedStringWithOptions:0];
		pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:encryptedBase64];
	} else {
		// Error handling
		[Crypto logError:@"encryption failed"];
		pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR];
	}
   [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)rsaDecrypt:(CDVInvokedUrlCommand*)command{
	CDVPluginResult* pluginResult = nil;
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
	
	unsigned char * encryptedBuffer = (unsigned char *)[decodedData bytes];
	int encryptedBufferSize = (int)[decodedData length];
	
	int bufferSize = 256;
	unsigned char *decryptedBuffer = (unsigned char *) calloc(bufferSize, sizeof(unsigned char));

	// Decrypt
	int status = RSA_private_decrypt(encryptedBufferSize, encryptedBuffer, decryptedBuffer, privateRsaKey, RSA_NO_PADDING);

	unsigned char *paddingBuffer = (unsigned char *) calloc(bufferSize, sizeof(unsigned char));
	// decryption succesfull remove padding
	if ( status >= 0 ){
		// converstion to bn and back is necessary to prepare paremeter flen for RSA_padding_check. Passing 256 to flen does not work.
		// see: http://marc.info/?l=openssl-users&m=108573630510562&w=2
		BIGNUM *bn = BN_bin2bn(decryptedBuffer, bufferSize, NULL);
		int flen = BN_bn2bin(bn, decryptedBuffer);
		status = RSA_padding_check_PKCS1_OAEP_SHA256(paddingBuffer, bufferSize, decryptedBuffer, flen, 256, NULL, 0);
	}
	
	if (status > 0) {
		// Success
		NSData* decryptedData = [NSData dataWithBytes:paddingBuffer length:status];
		NSString* decryptedBase64 = [decryptedData base64EncodedStringWithOptions:0];
		pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:decryptedBase64];
	} else {
		// Error handling
		[Crypto logError:@"decryption failed"];
		pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR];
	}
	[self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
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
	[Crypto createBN:rsaKey->n fromB64:modulus]; // public modulus <- modulus
	[Crypto createBN:rsaKey->d fromB64:privateExponent]; // private exponent <- privateExponent
	[Crypto createBN:rsaKey->p fromB64:primeP]; // secret prime factor <- primeP
	[Crypto createBN:rsaKey->q fromB64:primeQ ]; // secret prime factor <- primeQ
	[Crypto createBN:rsaKey->dmp1 fromB64:primeExponentP]; // d mod (p-1) <- primeExponentP
	[Crypto createBN:rsaKey->dmq1 fromB64:primeExponentQ]; // d mod (q-1) <- primeExponentQ
	[Crypto createBN:rsaKey->iqmp fromB64:crtCoefficient]; // q^-1 mod p <- crtCoefficient
    return rsaKey;
}


+ (RSA *)createPublicRSAKey:(NSObject*)key {
 	NSString* modulus = [key valueForKey:@"modulus"];
	
	RSA* rsaKey = RSA_new();
	rsaKey->e = BN_new();
	rsaKey->n= BN_new();
	
	const char * publicExponent = "65537";
	BN_dec2bn(&rsaKey->e, publicExponent ); // public exponent <- 65537
	[Crypto createBN:rsaKey->n fromB64:modulus]; // public modulus <- modulus
    return rsaKey;
}



+ (BIGNUM *)createBN:(BIGNUM*)number fromB64:(NSString*)value{
	NSData *valueData = [NSData dataFromBase64String:value];
    return BN_bin2bn((unsigned char *) [valueData bytes], [valueData length], number);
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



@end




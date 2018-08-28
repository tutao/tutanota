//
//  TUTAes128Facade.m
//
//  Created by Tutao GmbH on 19.10.16.
//  Copyright © 2016 Tutao GmbH. All rights reserved.
//


#import <Foundation/Foundation.h>
#import <CommonCrypto/CommonCryptor.h>
#import <CommonCrypto/CommonHMAC.h>
#import "TUTAes128Facade.h"
#import "TUTErrorFactory.h"
#import "TUTEncodingConverter.h"
#import "Swiftier.h"
#import "TUTCrypto.h"
#import "TUTSubKeys.h"


NSInteger const TUTAO_CRYPT_BUFFER_SIZE = 16;
NSInteger const TUTAO_IV_BYTE_SIZE = 16;

@implementation TUTAes128Facade {
}


- (NSData*) encrypt:(NSData*)plainText withKey:(NSData*)key withIv:(NSData*)iv withMac:(BOOL)useMac error:(NSError**)error{
	NSInputStream *inputStream = [[NSInputStream alloc]initWithData:plainText];
	NSOutputStream *outputStream = [[NSOutputStream alloc] initToMemory];
	[outputStream open];
	[inputStream open];
	let subKeys = [self getSubKeys:key withMac:useMac];
	[self encryptStream:inputStream result:outputStream withKey:subKeys.cKey withIv:iv error:error];
	NSData *tmpEncryptedData = [outputStream propertyForKey: NSStreamDataWrittenToMemoryStreamKey];
	NSData *encryptedData;
	if (useMac){
		let mac = [self hmac256WithKey:subKeys.mKey data:tmpEncryptedData];
		NSMutableData  *mutableData  = [NSMutableData dataWithLength: (1l + tmpEncryptedData.length + mac.length)];
		uint8_t prefix[] = {0x01};
		[mutableData replaceBytesInRange:NSMakeRange(0,1) withBytes:prefix];
		[mutableData replaceBytesInRange:NSMakeRange(1,tmpEncryptedData.length) withBytes:tmpEncryptedData.bytes];
		[mutableData replaceBytesInRange:NSMakeRange(1 + tmpEncryptedData.length, mac.length) withBytes:mac.bytes];
		encryptedData =mutableData;
	} else {
		encryptedData = tmpEncryptedData;
	}
	[outputStream close];
	[inputStream close];
	return encryptedData;
}

-  (TUTSubKeys *)getSubKeys:(NSData *)key withMac:(BOOL)useMac{
	TUTSubKeys * subKeys;
	if (useMac) {
		NSData *hash = [TUTCrypto sha256:key];
		subKeys = [[TUTSubKeys alloc] initWithCKey: [hash subdataWithRange:NSMakeRange(0, 16)] mKey:[hash subdataWithRange:NSMakeRange(16, 16)]];
	} else {
		subKeys = [[TUTSubKeys alloc] initWithCKey: key mKey:nil];
	}
	return subKeys;
}

- (BOOL)encryptStream:(NSInputStream*)plainText result:(NSOutputStream*)output withKey:(NSData*)key withIv:(NSData*)iv error:(NSError**)error{
	if ([iv length] != TUTAO_IV_BYTE_SIZE){
		*error = [TUTErrorFactory createErrorWithDomain:TUT_CRYPTO_ERROR msg:@"invalid iv length"];
		return NO;
	}
	//NSLog(@"iv: %@", [TutaoEncodingConverter bytesToHex:iv]);
	
	if (![self writeBytes:iv.bytes dataInLength:iv.length to:output error:error]){
		return NO;
	};
	return [self executeCryptOperation:kCCEncrypt onStream:plainText result:output withKey:key iv:iv error:error];
}

- (NSData*) decrypt:(NSData*)encryptedData withKey:(NSData*)key error:(NSError**)error{

	NSData *cipherTextWithoutMac;
	BOOL useMac = [encryptedData length]  % 2 == 1;
	let subKeys = [self getSubKeys:key withMac:useMac];
	if (useMac) {
		cipherTextWithoutMac = [NSData dataWithBytesNoCopy:(void * _Nonnull)(encryptedData.bytes + 1) length:encryptedData.length - 33 freeWhenDone:NO];

		let providedMacBytes = [encryptedData subdataWithRange:NSMakeRange(encryptedData.length - 32, 32)];
		let computedMacBytes = [self hmac256WithKey:subKeys.mKey data:cipherTextWithoutMac];
		if (![providedMacBytes isEqual:computedMacBytes]) {
			*error = [TUTErrorFactory createErrorWithDomain:TUT_CRYPTO_ERROR msg:@"HMAC validation failed"];
			return nil;
		}
	} else {
		cipherTextWithoutMac = encryptedData;
	}

	NSInputStream *inputStream = [[NSInputStream alloc]initWithData:cipherTextWithoutMac];
	NSOutputStream *outputStream = [[NSOutputStream alloc] initToMemory];
	[outputStream open];
	[inputStream open];
	[self decryptStream:inputStream result:outputStream withKey:subKeys.cKey error:error];
	NSData *plainTextData = [outputStream propertyForKey: NSStreamDataWrittenToMemoryStreamKey];
	[outputStream close];
	[inputStream close];
	return plainTextData;
}


- (BOOL) decryptStream:(NSInputStream*)encryptedData result:(NSOutputStream*)output withKey:(NSData*)key error:(NSError**)error{
	NSData* iv = [self readIvFromStream:encryptedData];
	if (!iv){
		return NO;
	}
	return [self executeCryptOperation:kCCDecrypt onStream:encryptedData result:output withKey:key iv:iv error:(NSError**)error];
}


- (NSData*) readIvFromStream:(NSInputStream*)stream {
	uint8_t readBuffer[TUTAO_IV_BYTE_SIZE];
	size_t readBytes;
	
	NSData *iv = nil;
	readBytes = [stream read: readBuffer maxLength:TUTAO_IV_BYTE_SIZE];
	// check if iv available.
	if (readBytes == TUTAO_IV_BYTE_SIZE) {
		iv = [[NSData alloc] initWithBytes:&readBuffer length:TUTAO_IV_BYTE_SIZE];
	};
	return iv ;
}

- (BOOL) executeCryptOperation:(CCOperation) operation onStream:(NSInputStream*)inputStream result:(NSOutputStream*)outputStream withKey:(NSData*)key iv:(NSData*)iv error:(NSError**)error{
	CCCryptorRef cryptor = NULL;
	CCCryptorStatus cryptorStatus;
	
	cryptorStatus = CCCryptorCreate(operation,    // operation
                           kCCAlgorithmAES,       // algorithim
                           kCCOptionPKCS7Padding,
                           key.bytes,             // key
                           key.length,            // keylength
                           iv.bytes,              // IV
                           &cryptor);             // OUT cryptorRef

	if (cryptorStatus != kCCSuccess) {
		*error =  [TUTErrorFactory createErrorWithDomain:TUT_CRYPTO_ERROR msg:[NSString stringWithFormat:@"CCCryptorCreate failed: %d", cryptorStatus]];
		return NO;
	}

	uint8_t readBuffer[TUTAO_CRYPT_BUFFER_SIZE];
	size_t readBufferLength;
	
	uint8_t writeBuffer[TUTAO_CRYPT_BUFFER_SIZE];
	size_t writeBufferLength = 0;
	
	while ((readBufferLength = [inputStream read:readBuffer maxLength:TUTAO_CRYPT_BUFFER_SIZE]) > 0 ) {
		//CCCryptorUpdate(CCCryptorRef cryptorRef, const void *dataIn, size_t dataInLength, void *dataOut, size_t dataOutAvailable, size_t *dataOutMoved);
		cryptorStatus = CCCryptorUpdate(cryptor,
			&readBuffer,
			readBufferLength,
			&writeBuffer,
			TUTAO_CRYPT_BUFFER_SIZE,
			&writeBufferLength);
		
		if (cryptorStatus != kCCSuccess) {
			*error = [TUTErrorFactory createErrorWithDomain:TUT_CRYPTO_ERROR msg:[NSString stringWithFormat:@"CCCryptorUpdate failed: %d", cryptorStatus]];
			break;
		}
		// write to output stream
		if (writeBufferLength > 0 && ![self writeBytes:&writeBuffer dataInLength:writeBufferLength to:outputStream error:error]) {
			break;
		}
	}
	
	if (!*error) {
		//CCCryptorFinal(CCCryptorRef cryptorRef, void *dataOut, size_t dataOutAvailable, size_t *dataOutMoved);
		cryptorStatus = CCCryptorFinal(cryptor,
					&writeBuffer,
					TUTAO_CRYPT_BUFFER_SIZE,
					&writeBufferLength);
		if (cryptorStatus != kCCSuccess) {
			*error = [TUTErrorFactory createErrorWithDomain:TUT_CRYPTO_ERROR msg:[NSString stringWithFormat:@"CCCryptorFinal failed: %d", cryptorStatus]];
		} else {
			[self writeBytes:&writeBuffer dataInLength:writeBufferLength to:outputStream error:error];
		}
	}
	
	CCCryptorRelease(cryptor);
	if (error) {
		return NO;
	} else {
		return YES;
	}
}

- (BOOL)writeBytes:(const void *)dataIn dataInLength:(NSUInteger)dataInLength to: (NSOutputStream*) output error:(NSError**) error{
	if(![output hasSpaceAvailable]){
		*error = [TUTErrorFactory createError:@"No space available for output stream"];
		return NO;
	}
	
	NSInteger writtenBytes = [output write:dataIn maxLength:dataInLength];
	if (writtenBytes != dataInLength) {
		*error = [TUTErrorFactory createError:@"failed to write all data to ouput stream"];
		return NO;
	}
	return YES;
}

-(NSData *)hmac256WithKey:(NSData *)mKey data:(NSData *)data {
	uint8_t cHMAC[CC_SHA256_DIGEST_LENGTH];
	CCHmac(kCCHmacAlgSHA256, mKey.bytes, mKey.length, data.bytes, data.length, cHMAC);
	return [NSData dataWithBytes:cHMAC length:CC_SHA256_DIGEST_LENGTH];
}

@end

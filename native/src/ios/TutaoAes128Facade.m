//
//  AesCrypto.m
//  CryptoIos
//
//  Created by Tutao GmbH on 19.10.16.
//  Copyright © 2016 Tutao GmbH. All rights reserved.
//


#import <Foundation/Foundation.h>
#include <CommonCrypto/CommonCryptor.h>
#include "TutaoAes128Facade.h"
#include "TutaoErrorFactory.h"
#include "TutaoEncodingConverter.h"

NSInteger const TUTAO_CRYPT_BUFFER_SIZE = 16;
NSInteger const TUTAO_IV_BYTE_SIZE = 16;

@implementation TutaoAes128Facade {
}

- (NSData*) encrypt:(NSData*)plainText withKey:(NSData*)key withIv:(NSData*)iv error:(NSError**)error{
	NSInputStream *inputStream = [[NSInputStream alloc]initWithData:plainText];
	NSOutputStream *outputStream = [[NSOutputStream alloc] initToMemory];
	[outputStream open];
	[inputStream open];
	
	[self encryptStream:inputStream result:outputStream withKey:key withIv:iv error:error];
	
	NSData *encryptedData = [outputStream propertyForKey: NSStreamDataWrittenToMemoryStreamKey];
	[outputStream close];
	[inputStream close];
	return encryptedData;
}

- (BOOL)encryptStream:(NSInputStream*)plainText result:(NSOutputStream*)output withKey:(NSData*)key withIv:(NSData*)iv error:(NSError**)error{
	if ([iv length] != TUTAO_IV_BYTE_SIZE){
		*error = [TutaoErrorFactory createError:@"invalid iv length"];
		return NO;
	}
	//NSLog(@"iv: %@", [TutaoEncodingConverter bytesToHex:iv]);
	
	if (![self writeBytes:iv.bytes dataInLength:iv.length to:output error:error]){
		return NO;
	};
	return [self executeCryptOperation:kCCEncrypt onStream:plainText result:output withKey:key iv:iv error:error];
}

- (NSData*) decrypt:(NSData*)encryptedData withKey:(NSData*)key error:(NSError**)error{
	NSInputStream *inputStream = [[NSInputStream alloc]initWithData:encryptedData];
	NSOutputStream *outputStream = [[NSOutputStream alloc] initToMemory];
	
	[outputStream open];
	[inputStream open];
	[self decryptStream:inputStream result:outputStream withKey:key error:error];
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
	
	cryptorStatus = CCCryptorCreate(operation,             // operation
                           kCCAlgorithmAES,            // algorithim
                           kCCOptionPKCS7Padding,
                           key.bytes,             // key
                           key.length,            // keylength
                           iv.bytes,              // IV
                           &cryptor);             // OUT cryptorRef

	if (cryptorStatus != kCCSuccess) {
		*error =  [TutaoErrorFactory createError:[NSString stringWithFormat:@"CCCryptorCreate failed: %d", cryptorStatus]];
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
			*error = [TutaoErrorFactory createError:[NSString stringWithFormat:@"CCCryptorUpdate failed: %d", cryptorStatus]];
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
			*error = [TutaoErrorFactory createError:[NSString stringWithFormat:@"CCCryptorFinal failed: %d", cryptorStatus]];
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
		*error = [TutaoErrorFactory createError:@"No space available for output stream"];
		return NO;
	}
	
	NSInteger writtenBytes = [output write:dataIn maxLength:dataInLength];
	if (writtenBytes != dataInLength) {
		*error = [TutaoErrorFactory createError:@"failed to write all data to ouput stream"];
		return NO;
	}
	return YES;
}





@end

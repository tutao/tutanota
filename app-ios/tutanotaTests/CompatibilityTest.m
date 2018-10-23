//
//  CompatibilityTest.m
//  CryptoIos
//
//  Created by Tutao GmbH on 20.10.16.
//  Copyright © 2016 Tutao GmbH. All rights reserved.
//

#import <XCTest/XCTest.h>
#import "TUTAes128Facade.h"
#import "TUTEncodingConverter.h"
#import <Foundation/Foundation.h>
#import "TUTCrypto.h"
#import "Swiftier.h"
#import <openssl/bn.h>
#import <openssl/ossl_typ.h>

@interface CompatibilityTest : XCTestCase

@property NSDictionary *testData;

@end

@implementation CompatibilityTest

- (void)setUp {
    [super setUp];
	NSBundle *bundle = [NSBundle bundleForClass:[self class]];
	NSString *path =  [bundle pathForResource:@"CompatibilityTestData" ofType:@"json"];
    NSData *jsonData = [[NSData alloc] initWithContentsOfFile:path];
	NSError *error = nil;
	self.testData = [NSJSONSerialization JSONObjectWithData:jsonData options:NSJSONReadingAllowFragments error:&error];
	
	if (error){
		XCTFail(@"error %@", error);
	}
}

- (void) testBignumToB64 {
	BIGNUM *number = BN_new();
	BN_dec2bn(&number, "1");
	NSString *b64Number = [TUTCrypto toB64:number];
	BIGNUM *convertedNumber = BN_new();
	[TUTCrypto toBIGNUM:convertedNumber fromB64:b64Number];
	XCTAssertEqual(0, BN_cmp(number, convertedNumber));
}

- (void)testRsaEncryption {
	NSArray *testsCases = self.testData[@"rsaEncryptionTests"];
	let crypto = [TUTCrypto new];
	NSMutableArray<XCTestExpectation *> *expectations = [NSMutableArray new];
	for	(NSDictionary *testCase in testsCases ) {
		XCTestExpectation *expectation = [self expectationWithDescription:[NSString stringWithFormat:@"Testing %@", testCase]];
		[expectations addObject:expectation];

		let publicKey = [CompatibilityTest hexToPublicKey: testCase[@"publicKey"]];
		let plainTextB64 = [self hexToB64:testCase[@"input"]];
		let seed = [self hexToB64:testCase[@"seed"]];
		[crypto rsaEncryptWithPublicKey:publicKey base64Data:plainTextB64 base64Seed:seed
							 completion:^(NSString * _Nullable encryptedBase64, NSError * _Nullable error) {
								 // Cannot compare encrypted data because random number generation differs, should be okay if decrypted is the same
								 let privateKey = [CompatibilityTest hexToPrivateKey:testCase[@"privateKey"]];
								 [crypto rsaDecryptWithPrivateKey:privateKey base64Data:encryptedBase64
													   completion:^(NSString * _Nullable decryptedBase64, NSError * _Nullable error) {
														   XCTAssertEqualObjects(decryptedBase64, plainTextB64);
														   [expectation fulfill];
													   }];
							 }];
	}

	[self waitForExpectations:expectations timeout:10000];
}

- (void)testAes128{
	TUTAes128Facade *aesFacade = [[TUTAes128Facade alloc]init];
	for	(NSDictionary *td in self.testData[@"aes128Tests"]){
		NSData *iv = [TUTEncodingConverter base64ToBytes:td[@"ivBase64"]];
		NSData *key = [TUTEncodingConverter hexToBytes:td[@"hexKey"]];
		NSData *plainTextData = [TUTEncodingConverter base64ToBytes:td[@"plainTextBase64"]];
		NSError *error = nil;
		
		NSData *encryptedData = [aesFacade encrypt:plainTextData withKey:key withIv:iv withMac:NO error:&error];
		XCTAssertNil(error);
        XCTAssertEqualObjects(td[@"cipherTextBase64"], [TUTEncodingConverter bytesToBase64:encryptedData]);
		
		NSData *decryptedData = [aesFacade decrypt:encryptedData withKey:key error:&error];
		XCTAssertNil(error);
		NSString * plainTextAsHex = [TUTEncodingConverter bytesToHex:[TUTEncodingConverter base64ToBytes:td[@"plainTextBase64"]]];

		XCTAssertEqualObjects(plainTextAsHex, [TUTEncodingConverter bytesToHex:decryptedData]);
        XCTAssertEqualObjects(td[@"plainTextBase64"], [TUTEncodingConverter bytesToBase64:decryptedData]);
	
    }
}

- (void)testAes128WithMac{
	TUTAes128Facade *aesFacade = [[TUTAes128Facade alloc]init];
	for	(NSDictionary *td in self.testData[@"aes128MacTests"]){
		NSData *iv = [TUTEncodingConverter base64ToBytes:td[@"ivBase64"]];
		NSData *key = [TUTEncodingConverter hexToBytes:td[@"hexKey"]];
		NSData *plainTextData = [TUTEncodingConverter base64ToBytes:td[@"plainTextBase64"]];
		NSError *error = nil;

		NSData *encryptedData = [aesFacade encrypt:plainTextData withKey:key withIv:iv withMac:YES error:&error];
		XCTAssertNil(error);
        XCTAssertEqualObjects(td[@"cipherTextBase64"], [TUTEncodingConverter bytesToBase64:encryptedData]);

		NSData *decryptedData = [aesFacade decrypt:encryptedData withKey:key error:&error];
		XCTAssertNil(error);
		NSString * plainTextAsHex = [TUTEncodingConverter bytesToHex:[TUTEncodingConverter base64ToBytes:td[@"plainTextBase64"]]];

		XCTAssertEqualObjects(plainTextAsHex, [TUTEncodingConverter bytesToHex:decryptedData]);
        XCTAssertEqualObjects(td[@"plainTextBase64"], [TUTEncodingConverter bytesToBase64:decryptedData]);
    }
}

- (void)testUnicodeEncoding {
	for (NSDictionary *td in self.testData[@"encodingTests"]) {
		NSData *encoded = [TUTEncodingConverter stringToBytes:td[@"string"]];
		XCTAssertEqualObjects([TUTEncodingConverter base64ToBytes:td[@"encodedString"]], encoded);
		XCTAssertEqualObjects([TUTEncodingConverter bytesToBase64:encoded], td[@"encodedString"]);
		NSString *decoded = [TUTEncodingConverter bytesToString:encoded];
		XCTAssertEqualObjects(decoded, td[@"string"]);
		return;
	}
}

- (void)testEncodingSimple {
	NSData *data = [TUTEncodingConverter stringToBytes:@"abc"];
	NSData* b64Data = [TUTEncodingConverter base64ToBytes:@"YWJj"];
	NSData* hexData = [TUTEncodingConverter hexToBytes:@"616263"];
	
	XCTAssertEqualObjects(@"abc", [TUTEncodingConverter bytesToString:data]);
	XCTAssertEqualObjects(@"abc", [TUTEncodingConverter bytesToString:b64Data]);
	XCTAssertEqualObjects(@"abc", [TUTEncodingConverter bytesToString:hexData]);
	
	XCTAssertEqualObjects(@"YWJj", [TUTEncodingConverter bytesToBase64:data]);
	XCTAssertEqualObjects(@"YWJj", [TUTEncodingConverter bytesToBase64:b64Data]);
	XCTAssertEqualObjects(@"YWJj", [TUTEncodingConverter bytesToBase64:hexData]);


	XCTAssertEqualObjects(@"abc", [TUTEncodingConverter bytesToString:data]);
	XCTAssertEqualObjects(@"abc", [TUTEncodingConverter bytesToString:b64Data]);
	XCTAssertEqualObjects(@"abc", [TUTEncodingConverter bytesToString:hexData]);
	
	XCTAssertEqualObjects(@"616263", [TUTEncodingConverter bytesToHex:data]);
	XCTAssertEqualObjects(@"616263", [TUTEncodingConverter bytesToHex:hexData]);
	XCTAssertEqualObjects(@"616263", [TUTEncodingConverter bytesToHex:hexData]);
}


- (void)testEncodingEmptyString {
	NSData *data = [TUTEncodingConverter stringToBytes:@""];
	NSData* b64Data = [TUTEncodingConverter base64ToBytes:@""];
	NSData* hexData = [TUTEncodingConverter hexToBytes:@""];
	
	XCTAssertEqualObjects(@"", [TUTEncodingConverter bytesToString:data]);
	XCTAssertEqualObjects(@"", [TUTEncodingConverter bytesToString:b64Data]);
	XCTAssertEqualObjects(@"", [TUTEncodingConverter bytesToString:hexData]);
	
	XCTAssertEqualObjects(@"", [TUTEncodingConverter bytesToBase64:data]);
	XCTAssertEqualObjects(@"", [TUTEncodingConverter bytesToBase64:b64Data]);
	XCTAssertEqualObjects(@"", [TUTEncodingConverter bytesToBase64:hexData]);


	XCTAssertEqualObjects(@"", [TUTEncodingConverter bytesToString:data]);
	XCTAssertEqualObjects(@"", [TUTEncodingConverter bytesToString:b64Data]);
	XCTAssertEqualObjects(@"", [TUTEncodingConverter bytesToString:hexData]);
	
	XCTAssertEqualObjects(@"", [TUTEncodingConverter bytesToHex:data]);
	XCTAssertEqualObjects(@"", [TUTEncodingConverter bytesToHex:hexData]);
	XCTAssertEqualObjects(@"", [TUTEncodingConverter bytesToHex:hexData]);
}

+ (NSArray<NSString *>*) hexToKeyArray:(NSString*) hexKey {
		let key = [NSMutableArray new];
		var pos = 0;
		while (pos < hexKey.length) {
			let nextParamLenHex = [hexKey substringWithRange:NSMakeRange(pos, 4)];
			unsigned nextParamLen = 0;
			[[NSScanner scannerWithString:nextParamLenHex]scanHexInt:&nextParamLen];
			pos += 4;
			let nextParamValueHex = [hexKey substringWithRange:NSMakeRange(pos, nextParamLen)];
			//let nextParamValue = [TUTEncodingConverter bytesToBase64: [TUTEncodingConverter hexToBytes:nextParamValueHex]];
			var nextParamValue = BN_new();
			BN_hex2bn(&nextParamValue, nextParamValueHex.UTF8String);
			[key addObject:[TUTCrypto toB64:nextParamValue]];
			pos += nextParamLen;
		}
		//_validateKeyLength(key)
		return key;

}


+ (NSDictionary<NSString*, NSString*>*) hexToPrivateKey:( NSString*) hexKey {
	let privateKeyArray = [CompatibilityTest hexToKeyArray:hexKey];
	return @{
				 @"modulus": privateKeyArray[0],
				 @"privateExponent":privateKeyArray[1],
				 @"primeP":privateKeyArray[2],
				 @"primeQ":privateKeyArray[3],
				 @"primeExponentP":privateKeyArray[4],
				 @"primeExponentQ":privateKeyArray[5],
				 @"crtCoefficient":privateKeyArray[6],
				 };
}

+ (NSDictionary<NSString*, NSString*>*) hexToPublicKey:( NSString*) hexKey {
	let publicKeyArray = [CompatibilityTest hexToKeyArray:hexKey];
	return @{
			 @"modulus":publicKeyArray[0]
			 };
}

- (NSString*) hexToB64:(NSString *) hexString {
	return [TUTEncodingConverter bytesToBase64:[TUTEncodingConverter hexToBytes:hexString]];
}

@end

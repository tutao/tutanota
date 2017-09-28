//
//  CompatibilityTest.m
//  CryptoIos
//
//  Created by Tutao GmbH on 20.10.16.
//  Copyright © 2016 Tutao GmbH. All rights reserved.
//

#import <XCTest/XCTest.h>
#import "TutaoAes128Facade.h"
#import "TutaoEncodingConverter.h"
#import <Foundation/Foundation.h>

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

- (void)tearDown {
    // Put teardown code here. This method is called after the invocation of each test method in the class.
    [super tearDown];
}


- (void)rsaEncryption {
/*
	NSArray *testsCases = self.testData[@"rsaEncryptionTests"];
	
	for	(NSDictionary *testCase in testsCases ){
		
			BCRSAPrivateCrtKey privateKey = RsaFacade.hexToPrivateKey(td[@"PrivateKey());
            RSAPublicKey publicKey = RsaFacade.hexToPublicKey(td[@"PublicKey());

            RsaFacadeImpl rsa = new RsaFacadeImpl(stubRandom(td[@"Seed()));

            byte[] unencryptedInput = EncodingConverter.hexToBytes(td[@"Input());
            byte[] encryptedKey = rsa.encryptAesKey(publicKey, unencryptedInput.length == 16 ? AesFacade.bytesToKey(unencryptedInput) : Aes256GcmFacade.bytesToKey(unencryptedInput));
            XCTAssertEquals(td[@"Result(), EncodingConverter.bytesToHex(encryptedKey));
            XCTAssertEquals(td[@"Input(), EncodingConverter.bytesToHex(AesFacade.keyToBytes(RsaFacade.decryptAesKey(privateKey, encryptedKey))));

	}
	*/
   }


- (void)rsaSignature {
/*
        for (SignatureTestData td : CompatibilityTest.testData.getRsaSignatureTests()) {
            BCRSAPrivateCrtKey privateKey = RsaFacade.hexToPrivateKey(td[@"PrivateKey());
            RSAPublicKey publicKey = RsaFacade.hexToPublicKey(td[@"PublicKey());

            RsaFacadeImpl rsa = new RsaFacadeImpl(stubRandom(td[@"Seed()));

            byte[] signature = rsa.sign(privateKey, EncodingConverter.hexToBytes(td[@"Input()));
            XCTAssertEquals(td[@"Result(), EncodingConverter.bytesToHex(signature));
            RsaFacade.verifySignature(publicKey, EncodingConverter.hexToBytes(td[@"Input()), signature);
        }
		*/
    }

- (void)aes256{
/*
        for (AesTestData td : CompatibilityTest.testData.getAes256Tests()) {
            SecretKeySpec key = Aes256GcmFacade.bytesToKey(EncodingConverter.hexToBytes(td[@"HexKey()));
            byte[] encryptedBytes = Aes256GcmFacade.encryptWithIv(key, EncodingConverter.base64ToBytes(td[@"PlainTextBase64()), EncodingConverter.base64ToBytes(td[@"IvBase64()), true);
            XCTAssertEquals(td[@"CipherTextBase64(), EncodingConverter.bytesToBase64(encryptedBytes));
            byte[] decryptedBytes = Aes256GcmFacade.decryptBytes(key, encryptedBytes);
            XCTAssertEquals(td[@"PlainTextBase64(), EncodingConverter.bytesToBase64(decryptedBytes));
        }
*/
    }


- (void)testAes128{
	TutaoAes128Facade *aesFacade = [[TutaoAes128Facade alloc]init];
	for	(NSDictionary *td in self.testData[@"aes128Tests"]){
		NSData *iv = [TutaoEncodingConverter base64ToBytes:td[@"ivBase64"]];
		NSData *key = [TutaoEncodingConverter hexToBytes:td[@"hexKey"]];
		NSData *plainTextData = [TutaoEncodingConverter base64ToBytes:td[@"plainTextBase64"]];
		NSError *error = nil;
		
		NSData *encryptedData = [aesFacade encrypt:plainTextData withKey:key withIv:iv error:&error];
		XCTAssertNil(error);
        XCTAssertEqualObjects(td[@"cipherTextBase64"], [TutaoEncodingConverter bytesToBase64:encryptedData]);
		
		NSData *decryptedData = [aesFacade decrypt:encryptedData withKey:key error:&error];
		XCTAssertNil(error);
		NSString * plainTextAsHex = [TutaoEncodingConverter bytesToHex:[TutaoEncodingConverter base64ToBytes:td[@"plainTextBase64"]]];

		XCTAssertEqualObjects(plainTextAsHex, [TutaoEncodingConverter bytesToHex:decryptedData]);
        XCTAssertEqualObjects(td[@"plainTextBase64"], [TutaoEncodingConverter bytesToBase64:decryptedData]);
	
    }
}


- (void)testUnicodeEncoding {
        for (NSDictionary *td in self.testData[@"encodingTests"]) {
            NSData *encoded = [TutaoEncodingConverter stringToBytes:td[@"string"]];
			XCTAssertEqualObjects([TutaoEncodingConverter base64ToBytes:td[@"encodedString"]], encoded);
			XCTAssertEqualObjects([TutaoEncodingConverter bytesToBase64:encoded], td[@"encodedString"]);
            NSString *decoded = [TutaoEncodingConverter bytesToString:encoded];
            XCTAssertEqualObjects(decoded, td[@"string"]);
			return;
        }
}

- (void)testEncodingSimple {
	NSData *data = [TutaoEncodingConverter stringToBytes:@"abc"];
	NSData* b64Data = [TutaoEncodingConverter base64ToBytes:@"YWJj"];
	NSData* hexData = [TutaoEncodingConverter hexToBytes:@"616263"];
	
	XCTAssertEqualObjects(@"abc", [TutaoEncodingConverter bytesToString:data]);
	XCTAssertEqualObjects(@"abc", [TutaoEncodingConverter bytesToString:b64Data]);
	XCTAssertEqualObjects(@"abc", [TutaoEncodingConverter bytesToString:hexData]);
	
	XCTAssertEqualObjects(@"YWJj", [TutaoEncodingConverter bytesToBase64:data]);
	XCTAssertEqualObjects(@"YWJj", [TutaoEncodingConverter bytesToBase64:b64Data]);
	XCTAssertEqualObjects(@"YWJj", [TutaoEncodingConverter bytesToBase64:hexData]);


	XCTAssertEqualObjects(@"abc", [TutaoEncodingConverter bytesToString:data]);
	XCTAssertEqualObjects(@"abc", [TutaoEncodingConverter bytesToString:b64Data]);
	XCTAssertEqualObjects(@"abc", [TutaoEncodingConverter bytesToString:hexData]);
	
	XCTAssertEqualObjects(@"616263", [TutaoEncodingConverter bytesToHex:data]);
	XCTAssertEqualObjects(@"616263", [TutaoEncodingConverter bytesToHex:hexData]);
	XCTAssertEqualObjects(@"616263", [TutaoEncodingConverter bytesToHex:hexData]);
}


- (void)testEncodingEmptyString {
	NSData *data = [TutaoEncodingConverter stringToBytes:@""];
	NSData* b64Data = [TutaoEncodingConverter base64ToBytes:@""];
	NSData* hexData = [TutaoEncodingConverter hexToBytes:@""];
	
	XCTAssertEqualObjects(@"", [TutaoEncodingConverter bytesToString:data]);
	XCTAssertEqualObjects(@"", [TutaoEncodingConverter bytesToString:b64Data]);
	XCTAssertEqualObjects(@"", [TutaoEncodingConverter bytesToString:hexData]);
	
	XCTAssertEqualObjects(@"", [TutaoEncodingConverter bytesToBase64:data]);
	XCTAssertEqualObjects(@"", [TutaoEncodingConverter bytesToBase64:b64Data]);
	XCTAssertEqualObjects(@"", [TutaoEncodingConverter bytesToBase64:hexData]);


	XCTAssertEqualObjects(@"", [TutaoEncodingConverter bytesToString:data]);
	XCTAssertEqualObjects(@"", [TutaoEncodingConverter bytesToString:b64Data]);
	XCTAssertEqualObjects(@"", [TutaoEncodingConverter bytesToString:hexData]);
	
	XCTAssertEqualObjects(@"", [TutaoEncodingConverter bytesToHex:data]);
	XCTAssertEqualObjects(@"", [TutaoEncodingConverter bytesToHex:hexData]);
	XCTAssertEqualObjects(@"", [TutaoEncodingConverter bytesToHex:hexData]);
}


- (void)testEncodingComplex {
	NSData *data = [TutaoEncodingConverter stringToBytes:@""];
	NSData* b64Data = [TutaoEncodingConverter base64ToBytes:@""];
	NSData* hexData = [TutaoEncodingConverter hexToBytes:@""];
	
	XCTAssertEqualObjects(@"", [TutaoEncodingConverter bytesToString:data]);
	XCTAssertEqualObjects(@"", [TutaoEncodingConverter bytesToString:b64Data]);
	XCTAssertEqualObjects(@"", [TutaoEncodingConverter bytesToString:hexData]);
	
	XCTAssertEqualObjects(@"", [TutaoEncodingConverter bytesToBase64:data]);
	XCTAssertEqualObjects(@"", [TutaoEncodingConverter bytesToBase64:b64Data]);
	XCTAssertEqualObjects(@"", [TutaoEncodingConverter bytesToBase64:hexData]);


	XCTAssertEqualObjects(@"", [TutaoEncodingConverter bytesToString:data]);
	XCTAssertEqualObjects(@"", [TutaoEncodingConverter bytesToString:b64Data]);
	XCTAssertEqualObjects(@"", [TutaoEncodingConverter bytesToString:hexData]);
	
	XCTAssertEqualObjects(@"", [TutaoEncodingConverter bytesToHex:data]);
	XCTAssertEqualObjects(@"", [TutaoEncodingConverter bytesToHex:hexData]);
	XCTAssertEqualObjects(@"", [TutaoEncodingConverter bytesToHex:hexData]);
}


- (void)bcrypt128 {
/*
        for (BcryptTestData td : CompatibilityTest.testData.getBcrypt128Tests()) {
            byte[] key = AesFacade.keyToBytes(BCryptFacade.generateKeyFromPassphrase(td[@"Password(), EncodingConverter.hexToBytes(td[@"SaltHex()), AesKeyLength.Aes128));
            assertArrayEquals(EncodingConverter.hexToBytes(td.keyHex), key);
        }
		*/
    }

- (void)bcrypt256 {
	/*
		for (BcryptTestData td : CompatibilityTest.testData.getBcrypt256Tests()) {
            byte[] key = AesFacade.keyToBytes(BCryptFacade.generateKeyFromPassphrase(td[@"Password(), EncodingConverter.hexToBytes(td[@"SaltHex()), AesKeyLength.Aes256));
            assertArrayEquals(EncodingConverter.hexToBytes(td.keyHex), key);
        }
		*/
    }


@end

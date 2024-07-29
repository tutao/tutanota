#import <XCTest/XCTest.h>
#import "TUTEncodingConverter.h"
#import <Foundation/Foundation.h>
#import "TUTCrypto.h"
#import "TUTBigNum.h"
#import "Swiftier.h"
#import <openssl/bn.h>
#import <openssl/ossl_typ.h>
#include <openssl/rand.h>


@interface CompatibilityTest : XCTestCase

@property NSDictionary *testData;

@end

static unsigned char *randValueMock;
static size_t randValueMockLen;

// These don't need to do anything.
static void mock_rand_cleanup(void) {}
static int mock_rand_add(const void *buf, int num, double add_entropy) { return 0; }
static int mock_rand_status(void) { return 1; }
static int mock_rand_seed(const void *buf, int num) { return 0; }

static int mock_rand_bytes(unsigned char *buf, int num)
{
        for( int index = 0; index < num; ++index )
        {
                buf[index] = randValueMock[index % randValueMockLen];
        }
        return 1;
}



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
	NSString *b64Number = [TUTBigNum toB64:number];
	BIGNUM *convertedNumber = BN_new();
	[TUTBigNum toBIGNUM:convertedNumber fromB64:b64Number];
	XCTAssertEqual(0, BN_cmp(number, convertedNumber));
}

- (void)testRsaEncryption {

	// replace random number generator for rsa encryption
	RAND_METHOD stdlib_rand_meth = {
			mock_rand_seed,
			mock_rand_bytes,
			mock_rand_cleanup,
			mock_rand_add,
			mock_rand_bytes,
			mock_rand_status
	};

	RAND_set_rand_method(&stdlib_rand_meth);

	NSArray *testsCases = self.testData[@"rsaEncryptionTests"];
	let crypto = [TUTCrypto new];
	for	(NSDictionary *testCase in testsCases ) {

		let publicKey = [CompatibilityTest hexToPublicKey: testCase[@"publicKey"]];
		let plainText = [TUTEncodingConverter hexToBytes:testCase[@"input"]];
		let encResult = [TUTEncodingConverter hexToBytes:testCase[@"result"]];
		let seed = [TUTEncodingConverter hexToBytes:testCase[@"seed"]];

		randValueMock = (unsigned char *)seed.bytes;
		randValueMockLen = [seed length];

		NSError *error;
		let encrypted = [crypto rsaEncryptWithPublicKey:publicKey data:plainText seed:seed error:&error];
		XCTAssertEqualObjects(encrypted, encResult);
		let privateKey = [CompatibilityTest hexToPrivateKey:testCase[@"privateKey"]];
		let decryptedBase64 = [crypto rsaDecryptWithPrivateKey:privateKey data:encrypted error:&error];
		XCTAssertEqualObjects(decryptedBase64, plainText);
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
			[key addObject:[TUTBigNum toB64:nextParamValue]];
			pos += nextParamLen;
		}
		//_validateKeyLength(key)
		return key;

}

+ (TUTPrivateKey *) hexToPrivateKey:( NSString*) hexKey {
  let privateKeyArray = [CompatibilityTest hexToKeyArray:hexKey];
  return [[TUTPrivateKey alloc] initWithVersion:0
                               keyLength:RSA_KEY_LENGTH_IN_BITS
                                 modulus:privateKeyArray[0]
                         privateExponent:privateKeyArray[1]
                                  primeP:privateKeyArray[2]
                                  primeQ:privateKeyArray[3]
                          primeExponentP:privateKeyArray[4]
                          primeExponentQ:privateKeyArray[5]
                          crtCoefficient:privateKeyArray[6]
  ];
}

+ (TUTPublicKey *) hexToPublicKey:( NSString*) hexKey {
  let publicKeyArray = [CompatibilityTest hexToKeyArray:hexKey];
  return [[TUTPublicKey alloc] initWithVersion:0
                                     keyLength:RSA_KEY_LENGTH_IN_BITS
                                       modulus:publicKeyArray[0]
                                publicExponent:PUBLIC_EXPONENT
  ];
}

- (NSString*) hexToB64:(NSString *) hexString {
	return [TUTEncodingConverter bytesToBase64:[TUTEncodingConverter hexToBytes:hexString]];
}

@end

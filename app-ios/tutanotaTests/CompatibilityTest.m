#import <XCTest/XCTest.h>
#import "TUTEncodingConverter.h"
#import <Foundation/Foundation.h>
#import "Swiftier.h"


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

@end

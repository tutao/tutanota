import Foundation
import Testing

struct EncodingTest: Decodable {
	let string: String
	let encodedString: String
}

struct TestData: Decodable { let encodingTests: [EncodingTest] }

struct EncodingCompatibilityTest {
	private let testData: TestData = CompatibilityTestData.load()

	@Test func testUnicodeEncodingSwift() {
		for td in self.testData.encodingTests {
			let encoded = td.string.data(using: .utf8)!
			#expect(Data(base64Encoded: td.encodedString)! == encoded)
			#expect(encoded.base64EncodedString() == td.encodedString)

			let decoded = String(data: encoded, encoding: .utf8)!
			#expect(decoded == td.string)
		}
	}

	@Test("String to data conversion", arguments: [("abc", Data([97, 98, 99])), ("", Data())]) func testStringToData(string: String, data: Data) {
		#expect(string.data(using: .utf8)! == data)
		#expect(String(data: data, encoding: .utf8)! == string)
	}

	@Test("Base64 to data conversion", arguments: [("YWJj", Data([97, 98, 99])), ("", Data())]) func testBase64ToData(base64: String, data: Data) {
		#expect(Data(base64Encoded: base64)! == data)
		#expect(data.base64EncodedString() == base64)
	}

	@Test("Hex to data conversion", arguments: [("616263", Data([97, 98, 99])), ("", Data())]) func testHexToData(hex: String, data: Data) {
		#expect(Data(hexEncoded: hex) == data)
		#expect(data.hexEncodedString() == hex)
	}
}

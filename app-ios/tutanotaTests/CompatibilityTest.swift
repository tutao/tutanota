import Testing
import tutanota

struct EncodingTest: Decodable {
	let string: String
	let encodedString: String
}

struct TestData: Decodable {
	let encodingTests: [EncodingTest]
}

class CompatibilityTest {
	private let testData: TestData
	init() throws {
		let bundle = Bundle(for: Self.self)
		let dataurl = bundle.url(forResource: "CompatibilityTestData", withExtension: "json")!
		let jsonData = try Data(contentsOf: dataurl)
		testData = try JSONDecoder().decode(TestData.self, from: jsonData)
	}

	@Test func testUnicodeEncoding() {
		for td in self.testData.encodingTests {
			let encoded = TUTEncodingConverter.string(toBytes: td.string)
			#expect(TUTEncodingConverter.base64(toBytes: td.encodedString) == encoded)
			#expect(TUTEncodingConverter.bytes(toBase64: encoded) == td.encodedString)

			let decoded = TUTEncodingConverter.bytes(toString: encoded)
			#expect(decoded == td.string)
		}
	}

	@Test func testUnicodeEncodingSwift() {
		for td in self.testData.encodingTests {
			let encoded = td.string.data(using: .utf8)!
			#expect(Data(base64Encoded: td.encodedString)!  == encoded)
			#expect(encoded.base64EncodedString() == td.encodedString)

			let decoded = String(data: encoded, encoding: .utf8)!
			#expect(decoded == td.string)
		}
	}

	// FIXME the rest?

	//	@Test func testEncodingSimple() {
	//		let data = TUTEncodingConverter.string(toBytes: "abc")
	//		let b64Data = TUTEncodingConverter.base64(toBytes: "YWJj")
	//	}
	//}
}

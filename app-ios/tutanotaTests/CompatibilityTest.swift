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

	@Test func testStringToData() {
		let data = "abc".data(using: .utf8)!
		#expect(data == Data([97, 98, 99]))
	}

	@Test func testBaseToData() {
		let data = Data(base64Encoded: "YWJj")!
		#expect(data == Data([97, 98, 99]))
	}

	@Test func testHexToData() {
		let data = Data(hexEncoded: "616263")!
		#expect(data == Data([97, 98, 99]))
	}

	@Test func testEncodingSimple() {
		let data = "abc".data(using: .utf8)!
		let b64Data = Data(base64Encoded: "YWJj")!
		let hexData = Data(hexEncoded: "616263")!

		#expect(String(data: data, encoding: .utf8)! == "abc")
		#expect(String(data: b64Data, encoding: .utf8)! == "abc")
		#expect(String(data: hexData, encoding: .utf8)! == "abc")

		#expect(data.base64EncodedString() == "YWJj")
		#expect(b64Data.base64EncodedString() == "YWJj")
		#expect(hexData.base64EncodedString() == "YWJj")

		#expect(data.hexEncodedString() == "616263")
		#expect(hexData.hexEncodedString() == "616263")
		#expect(hexData.hexEncodedString() == "616263")
	}
}

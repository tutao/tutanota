import Foundation
import XCTest

@testable import TutanotaSharedFramework

class SharingUtilsTest: XCTestCase {

	private func generateVcardTemplate(fn: String) -> String {
		"""
		  BEGIN:VCARD
		  VERSION:3.0
		  PRODID:-//Apple Inc.//iPhone OS 15.6.1//EN
		  N:;armfortest@test.tutanota.de;;;
		  FN:\(fn)
		  EMAIL;type=INTERNET;type=pref:armfortest@test.tutanota.de
		  END:VCARD
		"""
	}

	func testExtractFNfromVCard() {
		let testCases = ["", "test", "h ello", "armfortest@test.tutanota.de"]

		let generatedNames = testCases.map { extractFNfrom(vcard: generateVcardTemplate(fn: $0)) }

		let expected = ["", "test", "h_ello", "armfortest_test_tutanota_de"]

		let defaultResult = extractFNfrom(
			vcard: """
				  BEGIN:VCARD
				  VERSION:3.0
				  PRODID:-//Apple Inc.//iPhone OS 15.6.1//EN
				  N:;armfortest@test.tutanota.de;;;
				  EMAIL;type=INTERNET;type=pref:armfortest@test.tutanota.de
				  END:VCARD
				"""
		)

		let dummyResult = extractFNfrom(
			vcard: """
				  BEGIN:VCARD
				  VERSION:3.0
				  EMAIL;type=INTERNET;type=pref:"FN:dummyname"@test.tutanota.de
				  FN: another name
				  FN: somme guy
				  PRODID:-//Apple Inc.//iPhone OS 15.6.1//EN
				  N:;armfortest@test.tutanota.de;;;
				  END:VCARD
				"""
		)

		XCTAssertEqual(generatedNames, expected)
		XCTAssertNotEqual(generatedNames, testCases)
		XCTAssertEqual(defaultResult, "contact")
		XCTAssertEqual(dummyResult, "_another_name")
	}
}

import TutanotaSharedFramework
import XCTest

class UIColorExtensionsTest: XCTestCase {
	func testIsColorLightPinkDark() throws { XCTAssertEqual(UIColor.init(hex: "#B73A9A")?.isLight(), false) }

	func testIsColorLightBlueLight() throws { XCTAssertEqual(UIColor.init(hex: "#3A9AFF")?.isLight(), true) }

	func testIsThreeDigitBlackDark() throws { XCTAssertEqual(UIColor.init(hex: "#000")?.isLight(), false) }

	func testIsThreeDigitWhiteLight() throws { XCTAssertEqual(UIColor.init(hex: "#FFF")?.isLight(), true) }

	func testIsThreeDigiCyanLight() throws { XCTAssertEqual(UIColor.init(hex: "#0FF")?.isLight(), true) }
}

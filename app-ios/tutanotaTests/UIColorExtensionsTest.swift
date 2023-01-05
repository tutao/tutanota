import XCTest
import tutanota

class UIColorExtensionsTest: XCTestCase {

    override func setUpWithError() throws {
        // Put setup code here. This method is called before the invocation of each test method in the class.
    }

    override func tearDownWithError() throws {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
    }

    func testIsColorLightPinkDark() throws {
      XCTAssertEqual(UIColor.init(hex: "#B73A9A")?.isLight(), false)
    }

    func testIsColorLightBlueLight() throws {
      XCTAssertEqual(UIColor.init(hex: "#3A9AFF")?.isLight(), true)
    }

    func testIsThreeDigitBlackDark() throws {
      XCTAssertEqual(UIColor.init(hex: "#000")?.isLight(), false)
    }

    func testIsThreeDigitWhiteLight() throws {
      XCTAssertEqual(UIColor.init(hex: "#FFF")?.isLight(), true)
    }

  func testIsThreeDigiCyanLight() throws {
    XCTAssertEqual(UIColor.init(hex: "#0FF")?.isLight(), true)
  }
}

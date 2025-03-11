import Testing
import TutanotaSharedFramework

struct UIColorExtensionsTest {
	@Test func testIsColorLightPinkDark() throws { #expect(UIColor.init(hex: "#B73A9A")?.isLight() == false) }

	@Test func testIsColorLightBlueLight() throws { #expect(UIColor.init(hex: "#3A9AFF")?.isLight() == true) }

	@Test func testIsThreeDigitBlackDark() throws { #expect(UIColor.init(hex: "#000")?.isLight() == false) }

	@Test func testIsThreeDigitWhiteLight() throws { #expect(UIColor.init(hex: "#FFF")?.isLight() == true) }

	@Test func testIsThreeDigiCyanLight() throws { #expect(UIColor.init(hex: "#0FF")?.isLight() == true) }
}

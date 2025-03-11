import Testing
import TutanotaSharedFramework

struct UIColorExtensionsTest {
	@Test func testIsColorLightPinkDark() throws { #expect(UIColor(hex: "#B73A9A")?.isLight() == false) }

	@Test func testIsColorLightBlueLight() throws { #expect(UIColor(hex: "#3A9AFF")?.isLight() == true) }

	@Test func testIsThreeDigitBlackDark() throws { #expect(UIColor(hex: "#000")?.isLight() == false) }

	@Test func testIsThreeDigitWhiteLight() throws { #expect(UIColor(hex: "#FFF")?.isLight() == true) }

	@Test func testIsThreeDigiCyanLight() throws { #expect(UIColor(hex: "#0FF")?.isLight() == true) }

	@Test(
		"parses hex color",
		arguments: [
			("#FFF", rgba(255, 255, 255, 1)), ("#FFFFFF", rgba(255, 255, 255, 1)), ("#FFFFFFFF", rgba(255, 255, 255, 1)), ("#4F537E", rgba(79, 83, 126, 1)),
			("#FFFFFF00", rgba(255, 255, 255, 0)), ("#979AB4BA", rgba(151, 154, 180, 0.7294117647058823)),
		]
	) func parsesHexColor(hex: String, color: RGBA) { #expect(UIColor(hex: hex) == color.uiColor, "Could not parse \(hex) as \(color)") }
}

private func rgba(_ red: UInt8, _ green: UInt8, _ blue: UInt8, _ alpha: Float64) -> RGBA { RGBA(red: red, green: green, blue: blue, alpha: alpha) }

// helper struct to make test assertions easier to read
struct RGBA {
	let red: UInt8
	let green: UInt8
	let blue: UInt8
	let alpha: Float64

	var uiColor: UIColor { UIColor(red: CGFloat(red) / 255, green: CGFloat(green) / 255, blue: CGFloat(blue) / 255, alpha: CGFloat(alpha)) }
}

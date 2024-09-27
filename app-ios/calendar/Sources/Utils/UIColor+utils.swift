import UIKit

public extension UIColor {

	/// Convenience constructor to initialize from a hex color string.
	/// Supported formats:
	/// #RGB
	/// #RRGGBB
	/// #RRGGBBAA
	convenience init?(hex: String) {
		var color: UInt32 = 0
		if parseColorCode(hex, &color) {
			let r = CGFloat(redPart(color)) / 255.0
			let g = CGFloat(greenPart(color)) / 255.0
			let b = CGFloat(bluePart(color)) / 255.0
			let a = CGFloat(alphaPart(color)) / 255

			self.init(red: r, green: g, blue: b, alpha: a)
			return
		}

		return nil
	}

	func isLight() -> Bool {
		var r: CGFloat = 0
		var g: CGFloat = 0
		var b: CGFloat = 0

		let success: Bool = self.getRed(&r, green: &g, blue: &b, alpha: nil)

		// lines with assertions are removed in release builds
		assert(success, "Invalid UI Color")

		// Counting the perceptive luminance
		// human eye favors green color...
		let lightness = 0.299 * r + 0.587 * g + 0.114 * b
		return lightness >= 0.5
	}
}

/** Parse a #RGB or #RRGGBB #RRGGBBAA color code into an 0xRRGGBBAA int */
private func parseColorCode(_ code: String, _ rrggbbaa: UnsafeMutablePointer<UInt32>?) -> Bool {
	if code.first != "#" || (code.count != 4 && code.count != 7 && code.count != 9) { return false }

	let start = code.index(code.startIndex, offsetBy: 1)
	var hexString = String(code[start...]).uppercased()

	// input was #RGB
	if hexString.count == 3 { hexString = expandShortHex(hex: hexString) }

	// input was #RGB or #RRGGBB, set alpha channel to max
	if hexString.count != 8 { hexString += "FF" }

	return Scanner(string: hexString).scanHexInt32(rrggbbaa)
}

private func expandShortHex(hex: String) -> String {
	assert(hex.count == 3, "hex string must be exactly 3 characters")

	var hexCode = ""
	for char in hex { hexCode += String(repeating: char, count: 2) }
	return hexCode
}

private func redPart(_ rrggbbaa: UInt32) -> UInt8 { UInt8((rrggbbaa >> 24) & 0xff) }

private func greenPart(_ rrggbbaa: UInt32) -> UInt8 { UInt8((rrggbbaa >> 16) & 0xff) }

private func bluePart(_ rrggbbaa: UInt32) -> UInt8 { UInt8((rrggbbaa >> 8) & 0xff) }

private func alphaPart(_ rrggbbaa: UInt32) -> UInt8 { UInt8(rrggbbaa & 0xff) }

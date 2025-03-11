import UIKit

extension UIColor {

	/// Convenience constructor to initialize from a hex color string.
	/// Supported formats:
	/// #RGB
	/// #RRGGBB
	/// #RRGGBBAA
	public convenience init?(hex: String) {
		if let color = parseColorCode(hex) {
			let r = CGFloat(redPart(color)) / 255.0
			let g = CGFloat(greenPart(color)) / 255.0
			let b = CGFloat(bluePart(color)) / 255.0
			let a = CGFloat(alphaPart(color)) / 255

			self.init(red: r, green: g, blue: b, alpha: a)
			return
		}

		return nil
	}

	public func isLight() -> Bool {
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

/// Parse a #RGB or #RRGGBB #RRGGBBAA color code into an 0xRRGGBBAA int
private func parseColorCode(_ code: String) -> UInt64? {
	if code.first != "#" || (code.count != 4 && code.count != 7 && code.count != 9) { return nil }

	let start = code.index(code.startIndex, offsetBy: 1)
	var hexString = String(code[start...]).uppercased()

	// input was #RGB
	if hexString.count == 3 { hexString = expandShortHex(hex: hexString) }

	var result: UInt64 = 0
	guard Scanner(string: hexString).scanHexInt64(&result) else { return nil }

	// input was #RGB or #RRGGBB, set alpha channel to max
	if hexString.count != 8 { result = (result << 8) | 0x000000FF }
	return result
}

private func expandShortHex(hex: String) -> String {
	assert(hex.count == 3, "hex string must be exactly 3 characters")

	var hexCode = ""
	for char in hex { hexCode += String(repeating: char, count: 2) }
	return hexCode
}

private func redPart(_ rrggbbaa: UInt64) -> UInt8 { UInt8((rrggbbaa & 0xFF00_0000) >> 24) }

private func greenPart(_ rrggbbaa: UInt64) -> UInt8 { UInt8((rrggbbaa & 0x00FF_0000) >> 16) }

private func bluePart(_ rrggbbaa: UInt64) -> UInt8 { UInt8((rrggbbaa & 0x0000_FF00) >> 8) }

private func alphaPart(_ rrggbbaa: UInt64) -> UInt8 { UInt8(rrggbbaa & 0x0000_00FF) }

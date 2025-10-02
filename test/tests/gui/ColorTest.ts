import o from "@tutao/otest"
import {
	hexToHSL,
	hexToRgb,
	hexToRgba,
	hslToHex,
	hslToRGB,
	isColorLight,
	isValidSolidColorCode,
	normalizeHueAngle,
	rgbaToHex,
	rgbToHex,
	rgbToHSL,
} from "../../../src/common/gui/base/Color.js"

o.spec("color", () => {
	o.test("hexToRGB 6digit", () => {
		o.check(hexToRgb("#b73a9a")).deepEquals({
			r: 183,
			g: 58,
			b: 154,
		})
	})
	o.test("hexToRGB 3digit", () => {
		o.check(hexToRgb("#ABC")).deepEquals({
			r: 170,
			g: 187,
			b: 204,
		})
	})
	o.test("normalizeHueAngle", () => {
		o.check(normalizeHueAngle(0)).equals(0)
		o.check(normalizeHueAngle(259)).equals(259)
		o.check(normalizeHueAngle(360)).equals(0)
		o.check(normalizeHueAngle(576)).equals(216)
		o.check(normalizeHueAngle(-120)).equals(240)
		o.check(normalizeHueAngle(-576)).equals(144)
	})
	o.test("rgbToHSL", () => {
		o.check(
			rgbToHSL({
				r: 186,
				g: 165,
				b: 228,
			}),
		).deepEquals({
			h: 260,
			s: 54,
			l: 77,
		})
	})
	o.test("hslToRGB", () => {
		o.check(
			hslToRGB({
				h: 260,
				s: 54,
				l: 77,
			}),
		).deepEquals({
			r: 186,
			g: 165,
			b: 228,
		})
	})
	o.test("hexToHSLToHex", () => {
		o.check(hslToHex(hexToHSL("#baa5e4"))).equals("#baa5e4")
	})
	o.test("hslToHexToHSL", () => {
		o.check(
			hexToHSL(
				hslToHex({
					h: 260,
					s: 54,
					l: 77,
				}),
			),
		).deepEquals({
			h: 260,
			s: 54,
			l: 77,
		})
	})
	o.test("isValidColorCode", () => {
		o.check(isValidSolidColorCode("#abc")).equals(true)
		o.check(isValidSolidColorCode("#ABC")).equals(true)
		o.check(isValidSolidColorCode("#aBc")).equals(true)
		o.check(isValidSolidColorCode("#aabbcc")).equals(true)
		o.check(isValidSolidColorCode("#AABBCC")).equals(true)
		o.check(isValidSolidColorCode("#aAbBcC")).equals(true)
		o.check(isValidSolidColorCode("AABBCC")).equals(false)
		o.check(isValidSolidColorCode("#ABCDEG")).equals(false)
	})
	o.test("rgbToHex", () => {
		o.check(
			rgbToHex({
				r: 183,
				g: 58,
				b: 154,
			}),
		).equals("#b73a9a")

		o.check(
			rgbToHex({
				r: 0,
				g: 58,
				b: 154,
			}),
		).equals("#003a9a")
	})
	o.test("rgbaToHex", () => {
		o.check(
			rgbaToHex({
				r: 183,
				g: 58,
				b: 154,
				a: 255,
			}),
		).equals("#b73a9aff")

		o.check(
			rgbaToHex({
				r: 0,
				g: 58,
				b: 154,
				a: 165,
			}),
		).equals("#003a9aa5")
	})
	o.spec("hexToRgba", () => {
		o.test("invalid color hex", () => {
			o.check(() => hexToRgba("fff")).throws(Error)
			o.check(() => hexToRgba("#ab")).throws(Error)
			o.check(() => hexToRgba("#abg")).throws(Error)
			o.check(() => hexToRgba("#abcdd")).throws(Error)
			o.check(() => hexToRgba("#aabbccd")).throws(Error)
		})
		o.test("rgb hex without a", () => {
			o.check(hexToRgba("#0ff")).deepEquals({
				r: 0,
				g: 255,
				b: 255,
				a: 255,
			})
		})
		o.test("rgba hex", () => {
			o.check(hexToRgba("#0faA")).deepEquals({
				r: 0,
				g: 255,
				b: 170,
				a: 170,
			})
		})
		o.test("rrggbb without aa", () => {
			o.check(hexToRgba("#0a6fa0")).deepEquals({
				r: 10,
				g: 111,
				b: 160,
				a: 255,
			})
		})
		o.test("rrggbbaa", () => {
			o.check(hexToRgba("#0a6fa09f")).deepEquals({
				r: 10,
				g: 111,
				b: 160,
				a: 159,
			})
		})
	})
	o.spec("isColorLight", () => {
		o.test("pink is dark", () => {
			o.check(isColorLight("#B73A9A")).equals(false)
		})
		o.test("blue is light", () => {
			o.check(isColorLight("#3A9AFF")).equals(true)
		})
		o.test("three digit white is light", () => {
			o.check(isColorLight("#FFF")).equals(true)
		})
		o.test("three digit black is dark", () => {
			o.check(isColorLight("#000")).equals(false)
		})
		o.test("three digit cyan is light", () => {
			o.check(isColorLight("#0FF")).equals(true)
		})
	})
})

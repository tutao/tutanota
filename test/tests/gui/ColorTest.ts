import o from "@tutao/otest"
import { hexToRgb, isColorLight, isValidColorCode, rgbToHex } from "../../../src/common/gui/base/Color.js"
o.spec("color", function () {
	o("hexToRGB 6digit", function () {
		o(hexToRgb("#b73a9a")).deepEquals({
			r: 183,
			g: 58,
			b: 154,
		})
	})
	o("hexToRGB 3digit", function () {
		o(hexToRgb("#ABC")).deepEquals({
			r: 170,
			g: 187,
			b: 204,
		})
	})
	o("isValidColorCode", function () {
		o(isValidColorCode("#abc")).equals(true)
		o(isValidColorCode("#ABC")).equals(true)
		o(isValidColorCode("#aBc")).equals(true)
		o(isValidColorCode("#aabbcc")).equals(true)
		o(isValidColorCode("#AABBCC")).equals(true)
		o(isValidColorCode("#aAbBcC")).equals(true)
		o(isValidColorCode("AABBCC")).equals(false)
		o(isValidColorCode("#ABCDEG")).equals(false)
	})
	o("rgbToHex", function () {
		o(
			rgbToHex({
				r: 183,
				g: 58,
				b: 154,
			}),
		).equals("#b73a9a")
	})
	o.spec("isColorLight", function () {
		o("pink is dark", function () {
			o(isColorLight("#B73A9A")).equals(false)
		})
		o("blue is light", function () {
			o(isColorLight("#3A9AFF")).equals(true)
		})
		o("three digit white is light", function () {
			o(isColorLight("#FFF")).equals(true)
		})
		o("three digit black is dark", function () {
			o(isColorLight("#000")).equals(false)
		})
		o("three digit cyan is light", function () {
			o(isColorLight("#0FF")).equals(true)
		})
	})
})

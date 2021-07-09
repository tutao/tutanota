//@flow
import o from "ospec"
import {hexToRgb, isColorLight, rgbToHex} from "../../../src/gui/base/Color"

o.spec("color", function () {
	o("hexToRGB 6digit", function () {
		o(hexToRgb('#b73a9a')).deepEquals({r: 183, g: 58, b: 154})
	})

	o("hexToRGB 3digit", function () {
		o(hexToRgb('#ABC')).deepEquals({r: 170, g: 187, b: 204})
	})

	o("rgbToHex", function () {
		o(rgbToHex({r: 183, g: 58, b: 154})).deepEquals('#b73a9a')
	})

	o.spec("isColorLight", function () {
		o("pink is dark", function () {
			o(isColorLight("#B73A9A")).equals(false)
		})

		o("blue is light", function () {
			o(isColorLight("#3A9AFF")).equals(true)
		})
	})
})

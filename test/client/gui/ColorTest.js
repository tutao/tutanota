//@flow
import o from "ospec"
import {hexToRgb, rgbToHex} from "../../../src/gui/base/Color"

o.spec("color", function () {
	o("hexToRGB and rgbToHex", function () {
		o(hexToRgb('#b73a9a')).deepEquals({r: 183, g: 58, b: 154})
		o(rgbToHex({r: 183, g: 58, b: 154})).deepEquals('#b73a9a')
	})
})

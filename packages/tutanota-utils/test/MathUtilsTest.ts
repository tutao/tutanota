import o from "@tutao/otest"
import { clamp } from "../lib/MathUtils.js"

o.spec("MathUtils", function () {
	o("clamp", function () {
		o(clamp(0, 0, 0)).equals(0)
		o(clamp(0, 0, 1)).equals(0)
		o(clamp(1, 0, 1)).equals(1)
		o(clamp(5, 0, 10)).equals(5)("within range")
		o(clamp(10, 0, 5)).equals(5)("above range")
		o(clamp(0, 5, 10)).equals(5)("below range")
	})
})

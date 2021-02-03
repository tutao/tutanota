import o from "ospec"
import {parseCaptchaInput} from "../../../src/subscription/SignupForm";

o.spec("CaptchaInputParse", function () {
	o("Hour", function () {
		o(parseCaptchaInput("nonsense")).equals(null)
		o(parseCaptchaInput("2:")).equals(null)
		o(parseCaptchaInput(":::")).equals(null)
		o(parseCaptchaInput("")).equals(null)
		o(parseCaptchaInput("25:01")).equals(null)
		o(parseCaptchaInput("08:84")).equals(null)

		o(parseCaptchaInput("1:1")).equals("01:01")
		o(parseCaptchaInput("13:1")).equals("01:01")
		o(parseCaptchaInput("13:01")).equals("01:01")
		o(parseCaptchaInput("01:1")).equals("01:01")
		o(parseCaptchaInput("1:01")).equals("01:01")

		o(parseCaptchaInput("24:00")).equals("00:00")
		o(parseCaptchaInput("12:00")).equals("00:00")
		o(parseCaptchaInput("24:14")).equals("00:14")
		o(parseCaptchaInput("2:00")).equals("02:00")
	})
})
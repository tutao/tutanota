import o from "ospec"
import { formatNameAndAddress } from "../../../src/misc/CommonFormatter.js"

o.spec("CommonFormatterTest", function () {
	o("formatNameAndAddress", function () {
		o(formatNameAndAddress("", "")).equals("")
		o(formatNameAndAddress("Bernd", "")).equals("Bernd")
		o(formatNameAndAddress("Bernd", "")).equals("Bernd")
		o(formatNameAndAddress("", "Hanomaghof")).equals("Hanomaghof")
		o(formatNameAndAddress("Bernd", "Hanomaghof 2\n30449 Hannover")).equals("Bernd\nHanomaghof 2\n30449 Hannover")
		o(formatNameAndAddress("Bernd", "Hanomaghof 2\n30449 Hannover", "FR")).equals("Bernd\nHanomaghof 2\n30449 Hannover\nFrance")
		o(formatNameAndAddress("", "", "DE")).equals("Deutschland")
		o(formatNameAndAddress("a", "", "DE")).equals("a\nDeutschland")
	})
})

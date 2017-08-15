//@flow
import o from "ospec/ospec.js"
import {urlify} from "../../../src/misc/Urlifier"

o.spec("UrlifierTest", function () {


	o(" validHtmlLinks", function () {
		// html links
		o(urlify("http://hello.it")).equals('<a href=\"http://hello.it\" target=\"_blank\" rel=\"noopener noreferrer\">http://hello.it</a>')
		o(urlify("https://hello.it")).equals('<a href=\"https://hello.it\" target=\"_blank\" rel=\"noopener noreferrer\">https://hello.it</a>')
		o(urlify("http://www.tutanota.de")).equals('<a href=\"http://www.tutanota.de\" target=\"_blank\" rel=\"noopener noreferrer\">http://www.tutanota.de</a>')
		o(urlify("https://www.tutanota.de")).equals('<a href=\"https://www.tutanota.de\" target=\"_blank\" rel=\"noopener noreferrer\">https://www.tutanota.de</a>')
		// email adresses
		o(urlify("bed-free@tutanota.de")).equals('<a href=\"mailto:bed-free@tutanota.de\" target=\"_blank\" rel=\"noopener noreferrer\">bed-free@tutanota.de</a>')
		o(urlify("www.tutanota.de")).equals('<a href=\"http://www.tutanota.de\" target=\"_blank\" rel=\"noopener noreferrer\">www.tutanota.de</a>')
	})

	o(" invalidHtmlLinks", function () {
		// no html links
		o(urlify("hello.it is nice to meet you.")).equals("hello.it is nice to meet you.")

		o(urlify("tutanota.de")).equals("tutanota.de")
		o(urlify("34.34.de")).equals("34.34.de")

		// twitter
		o(urlify("@de_tutanota")).equals("@de_tutanota")
		o(urlify("#de_tutanota")).equals("#de_tutanota")

		// no phone numbers
		o(urlify("0511202801-0")).equals("0511202801-0")
		o(urlify("+49511202801")).equals("+49511202801")
		o(urlify("(555)555-5555")).equals("(555)555-5555")
	})

})


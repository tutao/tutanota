// @flow
import o from "ospec/ospec.js"
import {htmlToText, byteLength, getAppId} from "../../../../src/api/worker/search/IndexUtils"
import {ContactTypeRef} from "../../../../src/api/entities/tutanota/Contact"
import {UserTypeRef} from "../../../../src/api/entities/sys/User"

o.spec("Index Utils", () => {
	o("htmlToPlainText", function () {
		o(htmlToText("")).equals("")
		o(htmlToText("test")).equals("test")
		let html = "this string has <i>html</i> code <!-- ignore comments-->i want to <b>remove</b><br>Link Number 1 -><a href='http://www.bbc.co.uk'>BBC</a> Link Number 1<br><p>Now back to normal text and stuff</p>"
		let plain = "this string has  html  code  i want to  remove  Link Number 1 -> BBC  Link Number 1  Now back to normal text and stuff "
		o(htmlToText(html)).equals(plain)
		o(htmlToText("<img src='>' >")).equals(" ' >") // TODO handle this case
		o(htmlToText("&nbsp;&amp;&lt;&gt;")).equals(" &<>")
		o(htmlToText("&ouml;")).equals("ö")
		o(htmlToText("&Ouml;")).equals("Ö")
		o(htmlToText("&Phi;")).equals("Φ")
		o(htmlToText(null)).equals("")
		o(htmlToText(undefined)).equals("")
	})

	o("byteLength", function () {
		o(byteLength("")).equals(0)
		o(byteLength("A")).equals(1)
		o(byteLength("A B")).equals(3)
		o(byteLength("µ")).equals(2)
		o(byteLength("€")).equals(3)
		o(byteLength("💩")).equals(4)
	})

	o("getAppId", function () {
		o(getAppId(UserTypeRef)).equals(0)
		o(getAppId(ContactTypeRef)).equals(1)
		try {
			getAppId({app: 5})
			o("Failure, non supported appid").equals(false)
		} catch(e) {
			o(e.message.startsWith("non indexed application")).equals(true)
		}
	})

})


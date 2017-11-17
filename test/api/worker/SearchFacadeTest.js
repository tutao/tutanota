// @flow
import o from "ospec/ospec.js"
import {searchFacade, htmlToText, _createNewIndexUpdate} from "../../../src/api/worker/facades/SearchFacade"
import {createContact} from "../../../src/api/entities/tutanota/Contact"

o.spec("SearchFacade test", () => {
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
	})

	o("new index update", function () {
		o(_createNewIndexUpdate()).deepEquals({
			encInstanceIdToIndexData: new Map(),
			indexMap: new Map(),
			batchId: null,
			contactListId: null,
			move: [],
			delete: new Map(),
		})
	})

	o("createContactIndexEntries", function () {
		let update = _createNewIndexUpdate()
		let c = createContact()
		searchFacade._createContactIndexEntries(c, update)
		o(update).deepEquals(_createNewIndexUpdate())
	})
})
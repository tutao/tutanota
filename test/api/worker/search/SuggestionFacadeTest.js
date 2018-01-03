/**
 * Created by bdeterding on 13.12.17.
 */
// @flow
import o from "ospec/ospec.js"
import {ContactTypeRef} from "../../../../src/api/entities/tutanota/Contact"
import {aes256RandomKey} from "../../../../src/api/worker/crypto/Aes"
import {SuggestionFacade} from "../../../../src/api/worker/search/SuggestionFacade"
import {SearchTermSuggestionsOS} from "../../../../src/api/worker/search/DbFacade"


o.spec("SuggestionFacade test", () => {

	var db
	var facade

	o.beforeEach(function () {
		db = {
			key: aes256RandomKey(),
			dbFacade: ({}:any),
			initialized: Promise.resolve()
		}
		facade = new SuggestionFacade(ContactTypeRef, db)
	})

	o("add and get suggestion", () => {
		o(facade.getSuggestions("a").join("")).equals("")
		let words = ["a"]
		facade.addSuggestions(words)
		o(facade.getSuggestions("a").join(" ")).equals("a")
		words = ["anton", "arne"]
		facade.addSuggestions(words)
		o(facade.getSuggestions("a").join(" ")).equals("a anton arne")

		words = ["ab", "az", "arne"]
		facade.addSuggestions(words)
		o(facade.getSuggestions("a").join(" ")).equals("a ab anton arne az")

		words = ["aa", "anne", "bernd"]
		facade.addSuggestions(words)
		o(facade.getSuggestions("a").join(" ")).equals("a aa ab anne anton arne az")
		o(facade.getSuggestions("an").join(" ")).equals("anne anton")
		o(facade.getSuggestions("ann").join(" ")).equals("anne")
		o(facade.getSuggestions("anne").join(" ")).equals("anne")
		o(facade.getSuggestions("annet").join(" ")).equals("")
		o(facade.getSuggestions("b").join(" ")).equals("bernd")
		o(facade.getSuggestions("be").join(" ")).equals("bernd")
		o(facade.getSuggestions("ben").join(" ")).equals("")
	})

	o("load empty", () => {
		let transactionMock = {}
		transactionMock.get = o.spy(() => Promise.resolve(null))
		db.dbFacade.createTransaction = o.spy(() => Promise.resolve(transactionMock))
		facade.addSuggestions(["aaaaaaa"])
		return facade.load().then(() => {
			o(transactionMock.get.callCount).equals(1)
			o(transactionMock.get.args[0]).equals(SearchTermSuggestionsOS)
			o(transactionMock.get.args[1]).equals("contact")
			o(facade.getSuggestions("a").join("")).equals("")
		})
	})

	o("store and load", () => {
		let transactionMock = {}
		transactionMock.put = o.spy(() => Promise.resolve())
		transactionMock.wait = o.spy(() => Promise.resolve())
		db.dbFacade.createTransaction = o.spy(() => Promise.resolve(transactionMock))

		facade.addSuggestions(["aaaa"])
		return facade.store().then(() => {
			o(transactionMock.put.args[0]).equals(SearchTermSuggestionsOS)
			o(transactionMock.put.args[1]).equals("contact")
			let encSuggestions = transactionMock.put.args[2]
			facade.addSuggestions(["accc", "bbbb"])
			// insert new values
			o(facade.getSuggestions("a").join(" ")).equals("aaaa accc")
			o(facade.getSuggestions("b").join(" ")).equals("bbbb")

			let transactionLoadMock = {}
			db.dbFacade.createTransaction = o.spy(() => Promise.resolve(transactionLoadMock))
			transactionLoadMock.get = o.spy(() => Promise.resolve(encSuggestions))
			return facade.load().then(() => {
				// restored
				o(transactionLoadMock.get.args[0]).equals(SearchTermSuggestionsOS)
				o(transactionLoadMock.get.args[1]).equals("contact")
				o(facade.getSuggestions("a").join(" ")).equals("aaaa")
				o(facade.getSuggestions("b").join(" ")).equals("")
			})
		})
	})

})
// @flow
import o from "ospec/ospec.js"
import {_search, search} from "../../../src/search/PlainTextSearch"

o.spec("PlainTextSearchTest", function () {

	const entries = [
		{
			title: "Some Title",
			tags: "tag",
			text: "Test text."
		},
		//real entry:
		{
			title: "How do I choose a strong password?",
			//missing tags property should not be a problem
			text: "Tutanota uses a password strength indicator that takes several aspects of a password into consideration to make sure your chosen password is a perfect match for your <a target=\"_blank\" rel=\"noreferrer\" href=\"https://www.tutanota.com/\">secure email</a> account. You can find additional tips on how to choose a strong password <a target=\"_blank\" rel=\"noreferrer\" href=\"https://en.wikipedia.org/wiki/Password_strength#Guidelines_for_strong_passwords\">here</a>.Tutanota has no limitations in regard to the password length or used characters; all unicode characters are respected.",
		},
		{
			title: "I want a stronger password?",
			tags: "password, login",
			text: "Tutanota uses a password x strength indicator. Password, Password, Password, Password, Password, Password Password, Password, Password, Password, Password, Password, Password, Password, Password, Password, Password, Password.",
		},
		{
			title: "Is my password strong enough?",
			tags: "password, login",
			text: "The indicator displays if the password is strong.",
		},
		{
			title: "Password strength",
			tags: "password, login",
			text: "The indicator displays the password strength. Password, Password, Password, Password, Password, Password, Password Password, Password, Password.",
		},
	]

	const _searchEntries = [
		{
			title: "Some Title. This test is random.",
			tags: "tag, attestation",
			text: "Test text. Their test is not ist random. Tests are easy."
		}
	]

	const attributeNames = ["title", "tags", "text"]

	o.spec("_search helper function", function () {

		o("check if completeMatch count is correct", function () {
			const searchResult = _search("test is", _searchEntries, attributeNames, false)
			o(searchResult[0].completeMatch).equals(2)
		})

		o("returned entry should not be modified", function () {
			const searchResult = _search("test is", _searchEntries, attributeNames, false)
			o(searchResult[0].entry).deepEquals(_searchEntries[0])
		})

		o("check if fullWordMatches count is correct", function () {
			const searchResult = _search("test", _searchEntries, attributeNames, false)
			o(searchResult[0].fullWordMatches).deepEquals(3)
		})

		o("check if matchedWords array is correct", function () {
			const query = "their some test notAHitForSure!"
			const searchResult = _search(query, _searchEntries, attributeNames, false)
			o(searchResult[0].matchedWords.length).deepEquals(3)
			searchResult[0].matchedWords.forEach((match) => {
				o(query.includes(match)).equals(true)
			})
		})

		o("check if partialWordMatches count is correct", function () {
			const query = ["their", "something", "tes", "randomness"]
			const searchResult = _search(query.join(" "), _searchEntries, attributeNames, false)
			o(searchResult[0].partialWordMatches).deepEquals(6)
		})

	})

	o.spec("search function", function () {

		o("empty query string", function () {
			o(search((""), entries, attributeNames, false)).deepEquals(entries)
		})

		o("no entries", function () {
			o(search(("a"), [], attributeNames, false)).deepEquals([])
		})

		o("incorrect attributeName", function () {
			o(search((entries[0].text), entries, ["test", "text"], false)).deepEquals([entries[0]])
		})

		o("ignore non-given attributeNames", function () {
			o(search((entries[0].title), entries, ["text"], false)).deepEquals([])
		})

		o("no search results", function () {
			o(search(("doesNotExistInEntries"), entries, attributeNames, false)).deepEquals([])
		})

		o("basic successful search", function () {
			o(search((entries[0].text), entries, attributeNames, false)).deepEquals([entries[0]])
		})

		o("check case insensitivity", function () {
			o(search((entries[0].text.toUpperCase()), entries, attributeNames, false)).deepEquals([entries[0]])
		})

		o("test the order of results", function () {
			// should return only entries [1..3] in that order because:
			// 1 contains the exact search string (completeMatch)
			// 2 all words are matched but lots of fullWordMatches
			// 3 all words are matched but less fullMatches
			// 4 contains only one word from the queryString
			// 0 does not include the query words
			o(search("strong password", entries, attributeNames, false)).deepEquals([entries[1], entries[2], entries[3], entries[4]])
		})

		// should not mark "is" and "a" (< 2 characters), should mark test even within longer words
		o("check if markhits causes correctly marked hits", function () {
			const searchResult = search("this is a test", _searchEntries, attributeNames, true)
			o(searchResult[0]).deepEquals({
					title: 'Some Title. <mark>This</mark> <mark>test</mark> is random.',
					tags: 'tag, at<mark>test</mark>ation',
					text:
						'<mark>Test</mark> text. Their <mark>test</mark> is not ist random. <mark>Test</mark>s are easy.'
				}
			)
		})

	})

})


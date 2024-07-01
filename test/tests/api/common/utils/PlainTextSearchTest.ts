import o from "@tutao/otest"
import { _findMatches, _search, search } from "../../../../../src/common/api/common/utils/PlainTextSearch.js"

o.spec("PlainTextSearchTest", function () {
	const entryWithNestedArray1 = {
		title: "Is my password strong enough?",
		tags: "password, login",
		text: "The indicator displays if the password is strong.",
		contentObject: {
			text: "Text content nestedEntry1 object.",
		},
		contentArray: [
			{
				text: "nestedEntry1 first array element",
			},
			{
				text: "nestedEntry1 second array element",
			},
		],
	}
	const entryWithNestedArray2 = {
		title: "Password strength",
		tags: "password, login",
		text: "The indicator displays the password strength. Password, Password, Password, Password, Password, Password, Password Password, Password, Password.",
		contentObject: {
			text: "Text content nestedEntry2 object.",
		},
		contentArray: [
			{
				text: "nestedEntry2 first array element",
			},
			{
				text: "nestedEntry2 second array element",
			},
		],
	}
	const someEntry = {
		title: "Some Title",
		tags: "tag",
		text: "Test text.",
	}
	const howChoosePasswordEntry = {
		title: "How do I choose a strong password?",
		//missing tags property should not be a problem
		text: 'Tutanota uses a password strength indicator that takes several aspects of a password into consideration to make sure your chosen password is a perfect match for your <a target="_blank" rel="noreferrer" href="https://www.tutanota.com/">secure email</a> account. You can find additional tips on how to choose a strong password <a target="_blank" rel="noreferrer" href="https://en.wikipedia.org/wiki/Password_strength#Guidelines_for_strong_passwords">here</a>.Tutanota has no limitations in regard to the password length or used characters; all unicode characters are respected.',
	}
	const wantPasswordEntry = {
		title: "I want a stronger password?",
		tags: "password, login",
		text: "Tutanota uses a password x strength indicator. Password, Password, Password, Password, Password, Password Password, Password, Password, Password, Password, Password, Password, Password, Password, Password, Password, Password.",
	}
	const entries = [someEntry, howChoosePasswordEntry, wantPasswordEntry, entryWithNestedArray1, entryWithNestedArray2]
	const _searchEntries = [
		{
			title: "Some Title. This test is random.",
			tags: "tag, attestation",
			text: "Test text. Their test is not ist random. Tests are easy.",
		},
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

			o(searchResult[0].fullWordMatches).equals(3)
		})
		o("check if matchedWords array is correct", function () {
			const query = "their some test notAHitForSure!"

			const searchResult = _search(query, _searchEntries, attributeNames, false)

			o(searchResult[0].matchedWords.length).equals(3)
			for (const match of searchResult[0].matchedWords) {
				o(query.includes(match)).equals(true)
			}
		})
		o("check if partialWordMatches count is correct", function () {
			const query = ["their", "something", "tes", "randomness"]

			const searchResult = _search(query.join(" "), _searchEntries, attributeNames, false)

			o(searchResult[0].partialWordMatches).equals(6)
		})
	})
	o.spec("search function", function () {
		o("empty query string", function () {
			o(search("", entries, attributeNames, false)).deepEquals(entries)
		})
		o("no entries", function () {
			o(search("a", [], attributeNames, false)).deepEquals([])
		})
		o("incorrect attributeName", function () {
			o(search(entries[0].text, entries, ["test", "text"], false)).deepEquals([entries[0]])
		})
		o("ignore non-given attributeNames", function () {
			o(search(entries[0].title, entries, ["text"], false)).deepEquals([])
		})
		o("no search results", function () {
			o(search("doesNotExistInEntries", entries, attributeNames, false)).deepEquals([])
		})
		o("basic successful search", function () {
			o(search(entries[0].text, entries, attributeNames, false)).deepEquals([entries[0]])
		})
		o("check case insensitivity", function () {
			o(search(entries[0].text.toUpperCase(), entries, attributeNames, false)).deepEquals([entries[0]])
		})
		o("do not check for empty words ", function () {
			o(search(" How \t \n choose  ", entries, attributeNames, false)).deepEquals([howChoosePasswordEntry])
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
				title: "Some Title. <mark>This</mark> <mark>test</mark> is random.",
				tags: "tag, at<mark>test</mark>ation",
				text: "<mark>Test</mark> text. Their <mark>test</mark> is not ist random. <mark>Test</mark>s are easy.",
			})
		})
	})
	o.spec("old test cases from website (modified)", function () {
		o("sort by match quality", function () {
			o(
				search(
					"lost password",
					[
						{
							title: "password",
						},
						{
							title: "lost my password",
						},
						{
							title: "lost password",
						},
					],
					["title"],
				),
			).deepEquals([
				{
					title: "lost password",
				},
				{
					title: "lost my password",
				},
				{
					title: "password",
				},
			])
		})
		o("simple find", function () {
			o(
				search(
					"test",
					[
						{
							title: "test",
						},
					],
					["title"],
				),
			).deepEquals([
				{
					title: "test",
				},
			])
			o(
				search(
					"test",
					[
						{
							title: "test",
						},
					],
					[],
				),
			).deepEquals([])
			o(
				search(
					"testing",
					[
						{
							title: "test",
						},
					],
					["title"],
				),
			).deepEquals([])
			o(
				search(
					"test",
					[
						{
							title: "test",
							text: "dummy",
						},
					],
					["text"],
				),
			).deepEquals([])
			o(
				search(
					"Test",
					[
						{
							title: "test",
						},
					],
					["title"],
				),
			).deepEquals([
				{
					title: "test",
				},
			])
			o(
				search(
					"test",
					[
						{
							title: "Test",
						},
					],
					["title"],
				),
			).deepEquals([
				{
					title: "Test",
				},
			])
			o(
				search(
					"mein ball",
					[
						{
							title: "mein neuer ball",
						},
					],
					["title"],
				),
			).deepEquals([
				{
					title: "mein neuer ball",
				},
			])
			o(
				search(
					"mein stuhl",
					[
						{
							title: "mein neuer ball",
						},
					],
					["title"],
				),
			).deepEquals([
				{
					title: "mein neuer ball",
				},
			])
			o(
				search(
					"dein ball",
					[
						{
							title: "mein neuer ball",
						},
					],
					["title"],
				),
			).deepEquals([
				{
					title: "mein neuer ball",
				},
			])
		})
		//should not mark less than 3 character hits
		o("mark search hits", function () {
			o(
				search(
					"test",
					[
						{
							title: "test",
						},
					],
					["title"],
					true,
				),
			).deepEquals([
				{
					title: "<mark>test</mark>",
				},
			])
			o(
				search(
					"test",
					[
						{
							title: "my test.",
						},
					],
					["title"],
					true,
				),
			).deepEquals([
				{
					title: "my <mark>test</mark>.",
				},
			])
			o(
				search(
					"hr",
					[
						{
							title: '<a href="hr-test.com">your hr department</a>',
						},
					],
					["title"],
					true,
				),
			).deepEquals([
				{
					title: '<a href="hr-test.com">your hr department</a>',
				},
			])
		})
		o("do not modify original structure", function () {
			let original = [
				{
					title: "test",
				},
			]
			o(search("test", original, ["title"], true)).deepEquals([
				{
					title: "<mark>test</mark>",
				},
			])
			o(original).deepEquals([
				{
					title: "test",
				},
			])
		})
		o("find matches", function () {
			let splittedValue = ["my", "<a href='test'>", "link", "</a>", "to other interesting pages with Links."]
			o(_findMatches(splittedValue, new RegExp("link|to", "gi"), false)).deepEquals({
				hits: 3,
				matchedQueryWords: ["link", "to"],
			})
			o(splittedValue).deepEquals(["my", "<a href='test'>", "link", "</a>", "to other interesting pages with Links."])
		})
		//should not mark less than 3 characters hits
		o("find matches and mark", function () {
			let splittedValue = ["my", "<a href='testlink'>", "link", "</a>", "to other interesting pages with Links."]
			o(_findMatches(splittedValue, new RegExp("link|to", "gi"), true)).deepEquals({
				hits: 3,
				matchedQueryWords: ["link", "to"],
			})
			o(splittedValue).deepEquals(["my", "<a href='testlink'>", "<mark>link</mark>", "</a>", "to other interesting pages with <mark>Link</mark>s."])
		})
		o("full matches", function () {
			let instance = {
				id: 32,
				title: "I have received an abusive email (spam, phishing) from one of your domains. What should I do?",
				text: "<p>If you would like to inform us about abusive us…contact addresses at abuse.net.</p>↵",
				tags: "fraud, stalker, threat, abuse, abusive, phishing",
				category: "other",
			}

			let result = _search("abuse", [instance], ["tags", "title", "text"], true)

			o(result[0].fullWordMatches).equals(2)
		})
		o("full matches 2", function () {
			let instance = {
				id: 39,
				title: "Are there email limits to protect Tutanota from being abused by spammers?",
				text: `<p>Yes, Tutanota uses different variables to calculate email limits for individual accounts. This is necessary to protect our free and anonymous email service from spammers who try to abuse Tutanota. If spammers were able to abuse Tutanota, it would harm all Tutanota users - ie Tutanota domains could end up on email blacklists, which we have to prevent under all circumstances.</p>↵<p>If you receive the following message in your Tutanota account &quot;It looks like you exceeded the number of allowed emails. Please try again later.&quot;, the anti-spam protection method has stopped your account temporarily from sending new emails. Please wait a day or two to send new emails again.</p>↵<p>If you need to send more emails immediately, please upgrade to our affordable Premium version (1 Euro per month) as limits for Premium users are much higher. Simply click on &#39;Premium&#39; in your top menu bar of Tutanota. </p>↵<p>Please note that Tutanota is not meant for sending out mass mailings such as newsletters. Please read our Terms &amp; Conditions for details: <a href="https://tutanota.com/terms">https://tutanota.com/terms</a></p>`,
				tags: "",
				category: "other",
			}

			let result = _search("abuse", [instance], ["tags", "title", "text"], true)

			o(result[0].fullWordMatches).equals(2)
		})
	})
	o.spec("Nested elements", function () {
		o("check nested attribute object - not implemented yet", function () {
			const query = "object"

			const _searchResult = search(query, entries, ["contentObject.text"], false)

			o(_searchResult).deepEquals([])
		})
		o("check nested attribute array", function () {
			const query = "array"

			const _searchResult = search(query, entries, ["contentArray.text"], false)

			o(_searchResult).deepEquals([entryWithNestedArray1, entryWithNestedArray2])
		})
		o("check nested attribute array one element", function () {
			const query = "nestedEntry1"

			const _searchResult = search(query, entries, ["contentArray.text"], false)

			o(_searchResult).deepEquals([entryWithNestedArray1])
		})
		o("check invalid attribute property", function () {
			const query = "nestedEntry1"
			o(search(query, entries, ["nonExistingProperty.text"], false).length).equals(0)
			o(search(query, entries, ["contentArray.nonExistingAttribute"], false).length).equals(0)
			o(search(query, entries, ["contentArray.text.level3"], false).length).equals(0)
			o(search(query, entries, ["contentArray"], false).length).equals(0)
			o(search(query, entries, ["title.text"], false).length).equals(0) // nested access on string value
		})
		o("check order in nested array", function () {
			const query = "nestedEntry2 array"
			const searchResult = search(query, entries, ["contentArray.text"], false)
			o(searchResult).deepEquals([entryWithNestedArray2, entryWithNestedArray1])
		})
		o("mark hits in nested array", function () {
			const query = "nestedEntry2"
			const searchResult = search(query, entries, ["contentArray.text"], true)
			const copyOfNestedEntry = JSON.parse(JSON.stringify(entryWithNestedArray2))
			copyOfNestedEntry.contentArray[0].text = "<mark>nestedEntry2</mark> first array element"
			copyOfNestedEntry.contentArray[1].text = "<mark>nestedEntry2</mark> second array element"
			o(searchResult).deepEquals([copyOfNestedEntry])
		})
	})
})

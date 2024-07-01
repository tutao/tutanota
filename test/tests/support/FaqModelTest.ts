import o from "@tutao/otest"
import { FaqModel } from "../../../src/common/support/FaqModel.js"
import { downcast } from "@tutao/tutanota-utils"
import { lang } from "../../../src/common/misc/LanguageViewModel.js"
import { spy } from "@tutao/tutanota-test-utils"

async function collect(generator: AsyncGenerator): Promise<Array<unknown>> {
	const result: Array<unknown> = []
	for await (const element of generator) {
		result.push(element)
	}
	return result
}

o.spec("FaqModelTest", function () {
	let faqModel
	let fetchFaqSpy
	const deTranslations = {
		name: "de",
		code: "de",
		keys: {
			"faq.otherEntry_title": "Eine Überschrift",
			"faq.otherEntry_markdown": "Ganz langer Inhalt",
			"faq.otherEntry_tags": "tag",
			"faq.entry_markdown": "Inhalt",
			"faq.entry_tags": "a, b, c",
			otherTranslation_label: "test",
		},
	}
	const enTranslations = {
		name: "en",
		code: "en",
		keys: {
			"faq.entry_title": "Heading",
			"faq.entry_markdown": "Content",
			"faq.entry_tags": "a, b, c",
			"faq.otherEntry_title": "Other Heading",
			"faq.otherEntry_markdown": "Much longer Content",
			"faq.otherEntry_tags": "tag",
			otherTranslation_label: "test",
		},
	}
	o.beforeEach(function () {
		lang.code = "de"
		faqModel = new FaqModel()
		fetchFaqSpy = spy((language) => {
			if (language === "en") {
				return Promise.resolve(enTranslations)
			} else if (language === "de") {
				return Promise.resolve(deTranslations)
			} else {
				return Promise.resolve({
					keys: {},
					code: language,
				})
			}
		})
		downcast(faqModel).fetchFAQ = fetchFaqSpy
	})
	o("initialize faq model", async function () {
		const translation = await faqModel.fetchFAQ("en")
		o(translation).deepEquals(enTranslations)
	})
	o("test init", async function () {
		await faqModel.init()
		o(fetchFaqSpy.callCount).equals(2)
		o(fetchFaqSpy.calls[0][0]).equals("en")
		o(fetchFaqSpy.calls[1][0]).equals("de")
		o(faqModel.faqLanguages.fallback).deepEquals(enTranslations)
		o(faqModel.faqLanguages.translations).deepEquals(deTranslations)
		const list = faqModel.getList()
		o(list.length).equals(2)
		const faqEntry = list[0]
		//use fallback for missing title
		o(faqEntry.title).equals("Heading")
		//use current language for missing title
		o(faqEntry.text).equals("Inhalt")
		o(faqEntry.tags).deepEquals(["a", "b", "c"])
		// do not invoke fetch faq entries twice
		await faqModel.init()
		o(fetchFaqSpy.callCount).equals(2)
	})
	o("init with language without faq entries", async function () {
		lang.code = "es"
		await faqModel.init()
		o(fetchFaqSpy.callCount).equals(2)
		o(fetchFaqSpy.calls[0][0]).equals("en")
		o(fetchFaqSpy.calls[1][0]).equals("es")
		o(faqModel.faqLanguages.fallback).deepEquals(enTranslations)
		o(faqModel.faqLanguages.translations).deepEquals({
			keys: {},
			code: "es",
		})
		const list = faqModel.getList()
		o(list.length).equals(2)
		const faqEntry = list[0]
		o(faqEntry.title).equals("Heading")
		o(faqEntry.text).equals("Content")
		o(faqEntry.tags).deepEquals(["a", "b", "c"])
	})
	o("init and search with failing fetch faq entries", async function () {
		fetchFaqSpy = spy((language) => {
			return {
				keys: {},
				code: language,
			}
		})
		downcast(faqModel).fetchFAQ = fetchFaqSpy
		await faqModel.init()
		o(fetchFaqSpy.callCount).equals(2)
		o(fetchFaqSpy.calls[0][0]).equals("en")
		o(fetchFaqSpy.calls[1][0]).equals("de")
		o(faqModel.faqLanguages.fallback).deepEquals({
			keys: {},
			code: "en",
		})
		o(faqModel.faqLanguages.translations).deepEquals({
			keys: {},
			code: "de",
		})
		const list = faqModel.getList()
		o(list.length).equals(0)
		o(await collect(faqModel.search("test"))).deepEquals([])
	})
	o("basic successful search in title", async function () {
		await faqModel.init()
		o(await collect(faqModel.search("Heading"))).deepEquals([
			{
				id: "entry",
				title: "<mark>Heading</mark>",
				text: "Inhalt",
				tags: ["a", "b", "c"],
			},
		])
	})
	o("basic successful search in tags", async function () {
		await faqModel.init()
		o(await collect(faqModel.search("tag"))).deepEquals([
			{
				id: "otherEntry",
				title: "Eine Überschrift",
				text: "Ganz langer Inhalt",
				tags: ["<mark>tag</mark>"],
			},
		])
	})
	o("basic successful search in text", async function () {
		await faqModel.init()
		o(await collect(faqModel.search("Inhalt"))).deepEquals([
			{
				id: "entry",
				title: "Heading",
				text: "<mark>Inhalt</mark>",
				tags: ["a", "b", "c"],
			},
			{
				id: "otherEntry",
				title: "Eine Überschrift",
				text: "Ganz langer <mark>Inhalt</mark>",
				tags: ["tag"],
			},
		])
	})
	o("search without results", async function () {
		await faqModel.init()
		const results = await collect(faqModel.search("Testquery_without_result"))
		o(results).deepEquals([])
	})
})

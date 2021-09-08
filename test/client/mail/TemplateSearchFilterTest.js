// @flow

import o from "ospec"
import {searchInTemplates} from "../../../src/templates/model/TemplateSearchFilter"
import type {EmailTemplate} from "../../../src/api/entities/tutanota/EmailTemplate"
import {createEmailTemplate} from "../../../src/api/entities/tutanota/EmailTemplate"
import {createEmailTemplateContent} from "../../../src/api/entities/tutanota/EmailTemplateContent"


o.spec("TemplateSearchFilter", function () {
	const abcTemplate = createEmailTemplate({
		tag: "aBc_tag",
		title: "aBc_title",
		contents: [
			createEmailTemplateContent({languageCode: "en", text: "aBc english"}),
			createEmailTemplateContent({languageCode: "de", text: "aBc deutsch"})
		]
	})

	const defTemplate = createEmailTemplate({
		tag: "dEf_tag",
		title: "dEf_title",
		contents: [
			createEmailTemplateContent({languageCode: "en", text: "dEf english"}),
			createEmailTemplateContent({languageCode: "de", text: "dEf deutsch"})
		]
	})
	const abcdefTemplate = createEmailTemplate({
		tag: "abcdef_tag",
		title: "abcdef_title",
		contents: [
			createEmailTemplateContent({languageCode: "en", text: "abcdef english"}),
			createEmailTemplateContent({languageCode: "de", text: "abcdef deutsch"})
		]
	})


	const emailTemplates: Array<EmailTemplate> = [
		abcTemplate,
		defTemplate,
		abcdefTemplate
	]

	o("find nothing ", function () {
		o(searchInTemplates("xyz", emailTemplates)).deepEquals([])
		o(searchInTemplates("abc xyz", emailTemplates)).deepEquals([])
	})

	o("no words", function () {
		o(searchInTemplates("", emailTemplates)).deepEquals(emailTemplates)
		o(searchInTemplates("", emailTemplates)).deepEquals(emailTemplates)

	})

	o("finds in tag", function () {
		o(searchInTemplates("tag", emailTemplates)).deepEquals(emailTemplates)
		o(searchInTemplates("AbC_Tag", emailTemplates)).deepEquals([abcTemplate])
		o(searchInTemplates("def_tag", emailTemplates)).deepEquals([defTemplate, abcdefTemplate])
		o(searchInTemplates("cdef_tag", emailTemplates)).deepEquals([abcdefTemplate])
	})


	o("tag search", function () {
		o(searchInTemplates("#abc_tag", emailTemplates)).deepEquals([abcTemplate])
		o(searchInTemplates("#abc tag", emailTemplates)).deepEquals([abcTemplate, abcdefTemplate]) // ignore second word
		o(searchInTemplates("#abc_title", emailTemplates)).deepEquals([]) // do not search in title
		o(searchInTemplates("#abc", emailTemplates)).deepEquals([abcTemplate, abcdefTemplate])
		o(searchInTemplates("#def_", emailTemplates)).deepEquals([defTemplate])

		// explicit tag search should use startWith and not contains
		o(searchInTemplates("#tag", emailTemplates)).deepEquals([])
		o(searchInTemplates("#def", emailTemplates)).deepEquals([defTemplate])
		o(searchInTemplates("#_", emailTemplates)).deepEquals([])
	})

	o("finds in title", function () {
		o(searchInTemplates("title", emailTemplates)).deepEquals(emailTemplates)
		o(searchInTemplates("abc_title", emailTemplates)).deepEquals([abcTemplate])
		o(searchInTemplates("def_title", emailTemplates)).deepEquals([defTemplate, abcdefTemplate])
		o(searchInTemplates("abcdef_title", emailTemplates)).deepEquals([abcdefTemplate])
	})

	o("finds in content", function () {
		o(searchInTemplates("english", emailTemplates)).deepEquals(emailTemplates)
		o(searchInTemplates("deutsch", emailTemplates)).deepEquals(emailTemplates)
	})

	o("multiple words - words must appear in same attribute", function () {
		o(searchInTemplates("def title deutsch", emailTemplates)).deepEquals([])
		o(searchInTemplates("title deutsch", emailTemplates)).deepEquals([])
		o(searchInTemplates("def deutsch", emailTemplates)).deepEquals([defTemplate, abcdefTemplate])
		o(searchInTemplates("ab deu", emailTemplates)).deepEquals([abcTemplate, abcdefTemplate])
		o(searchInTemplates("abc title", emailTemplates)).deepEquals([abcTemplate, abcdefTemplate])
		o(searchInTemplates("abc def title", emailTemplates)).deepEquals([abcdefTemplate])
		o(searchInTemplates("ab de ti", emailTemplates)).deepEquals([abcdefTemplate])
		o(searchInTemplates("abc   tag", emailTemplates)).deepEquals([abcTemplate, abcdefTemplate])
	})
})
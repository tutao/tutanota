import o from "@tutao/otest"
import type { EmailTemplate } from "../../../src/common/api/entities/tutanota/TypeRefs.js"
import {
	createEmailTemplate,
	createEmailTemplateContent,
	EmailTemplateContentTypeRef,
	EmailTemplateTypeRef,
} from "../../../src/common/api/entities/tutanota/TypeRefs.js"
import { searchInTemplates } from "../../../src/mail-app/templates/model/TemplatePopupModel.js"
import { createTestEntity } from "../TestUtils.js"

o.spec("TemplateSearchFilter", function () {
	const abcTemplate = createTestEntity(EmailTemplateTypeRef, {
		tag: "aBc_tag",
		title: "aBc_title",
		contents: [
			createTestEntity(EmailTemplateContentTypeRef, {
				languageCode: "en",
				text: "aBc english",
			}),
			createTestEntity(EmailTemplateContentTypeRef, {
				languageCode: "de",
				text: "aBc deutsch",
			}),
		],
	})
	const defTemplate = createTestEntity(EmailTemplateTypeRef, {
		tag: "dEf_tag",
		title: "dEf_title",
		contents: [
			createTestEntity(EmailTemplateContentTypeRef, {
				languageCode: "en",
				text: "dEf english",
			}),
			createTestEntity(EmailTemplateContentTypeRef, {
				languageCode: "de",
				text: "dEf deutsch",
			}),
		],
	})
	const abcdefTemplate = createTestEntity(EmailTemplateTypeRef, {
		tag: "abcdef_tag",
		title: "abcdef_title",
		contents: [
			createTestEntity(EmailTemplateContentTypeRef, {
				languageCode: "en",
				text: "abcdef english",
			}),
			createTestEntity(EmailTemplateContentTypeRef, {
				languageCode: "de",
				text: "abcdef deutsch",
			}),
		],
	})
	const emailTemplates: Array<EmailTemplate> = [abcTemplate, defTemplate, abcdefTemplate]
	o("find nothing ", function () {
		o(searchInTemplates("xyz", emailTemplates)).deepEquals([])
		o(searchInTemplates("123 xyz", emailTemplates)).deepEquals([])
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
		o(searchInTemplates("cdef_tag ", emailTemplates)).deepEquals([abcdefTemplate])
	})
	o("tag search", function () {
		o(searchInTemplates("#abc_tag", emailTemplates)).deepEquals([abcTemplate])
		o(searchInTemplates("#abc 123", emailTemplates)).deepEquals([abcTemplate, abcdefTemplate])
		o(searchInTemplates("#abc_title", emailTemplates)).deepEquals([]) // do not search in title

		o(searchInTemplates("#abc", emailTemplates)).deepEquals([abcTemplate, abcdefTemplate])
		o(searchInTemplates("#def_", emailTemplates)).deepEquals([defTemplate, abcdefTemplate])
		// explicit tag search uses contains as well
		o(searchInTemplates("#tag", emailTemplates)).deepEquals(emailTemplates)
		o(searchInTemplates("#def", emailTemplates)).deepEquals([defTemplate, abcdefTemplate])
		o(searchInTemplates("#_", emailTemplates)).deepEquals(emailTemplates)
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
	o("multiple words - one word must match but result order is changed", function () {
		o(searchInTemplates("abcdef title", emailTemplates)).deepEquals([abcdefTemplate, abcTemplate, defTemplate])
		o(searchInTemplates("#abc tag", emailTemplates)).deepEquals([abcTemplate, abcdefTemplate, defTemplate])
	})
})

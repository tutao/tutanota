import o from "@tutao/otest"
import { EmailTemplateContentTypeRef, EmailTemplateTypeRef, TemplateGroupRootTypeRef } from "../../../src/api/entities/tutanota/TypeRefs.js"
import { TemplateEditorModel } from "../../../src/settings/TemplateEditorModel.js"
import { EntityClient } from "../../../src/api/common/EntityClient.js"
import { downcast } from "@tutao/tutanota-utils"
import { LanguageNames, languages } from "../../../src/misc/LanguageViewModel.js"
import { createTestEntity } from "../TestUtils.js"

o.spec("TemplateEditorModel", function () {
	let entityClient: EntityClient
	o.beforeEach(function () {
		entityClient = downcast({})
	})
	o("content languages", function () {
		const template = createTestEntity(EmailTemplateTypeRef, {
			contents: [
				createTestEntity(EmailTemplateContentTypeRef, {
					languageCode: "en",
					text: "",
				}),
				createTestEntity(EmailTemplateContentTypeRef, {
					languageCode: "de",
					text: "",
				}),
			],
		})
		const templateGroupRoot = createTestEntity(TemplateGroupRootTypeRef)
		const model = new TemplateEditorModel(template, templateGroupRoot, entityClient)
		const addedLanguages = model.getAddedLanguages()
		const additionalLanguages = model.getAdditionalLanguages()
		o(additionalLanguages).deepEquals(languages.filter((language) => language.code !== "en" && language.code !== "de"))
		o(addedLanguages).deepEquals([
			{
				code: "en",
				textId: LanguageNames.en,
			},
			{
				code: "de",
				textId: LanguageNames.de,
			},
		])
	})
})

import o from "@tutao/otest"

import { EntityClient } from "../../../src/platform-kit/network/EntityClient.js"
import { downcast } from "../../../src/platform-kit/utils"
import { LanguageNames, languages } from "../../../src/ui/utils/LanguageViewModel.js"
import { createTestEntity } from "../TestUtils.js"
import { EmailTemplateContentTypeRef, EmailTemplateTypeRef, TemplateGroupRootTypeRef } from "@tutao/entities/tutanota"
import { TemplateEditorModel } from "../../../src/applications/mail-app/settings/TemplateEditorModel"

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

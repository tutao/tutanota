import o from "ospec"
import { createEmailTemplate } from "../../../src/api/entities/tutanota/TypeRefs.js"
import { TemplateEditorModel } from "../../../src/settings/TemplateEditorModel.js"
import { createTemplateGroupRoot } from "../../../src/api/entities/tutanota/TypeRefs.js"
import { EntityClient } from "../../../src/api/common/EntityClient.js"
import { downcast } from "@tutao/tutanota-utils"
import { createEmailTemplateContent } from "../../../src/api/entities/tutanota/TypeRefs.js"
import { LanguageNames, languages } from "../../../src/misc/LanguageViewModel.js"
o.spec("TemplateEditorModel", function () {
	let entityClient: EntityClient
	o.beforeEach(function () {
		entityClient = downcast({})
	})
	o("content languages", function () {
		const template = createEmailTemplate({
			contents: [
				createEmailTemplateContent({
					languageCode: "en",
					text: "",
				}),
				createEmailTemplateContent({
					languageCode: "de",
					text: "",
				}),
			],
		})
		const templateGroupRoot = createTemplateGroupRoot()
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

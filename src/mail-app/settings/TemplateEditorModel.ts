import type { Language, LanguageCode } from "../../common/misc/LanguageViewModel"
import { lang, languageByCode, languages } from "../../common/misc/LanguageViewModel"
import type { EmailTemplateContent } from "../../common/api/entities/tutanota/TypeRefs.js"
import type { EmailTemplate } from "../../common/api/entities/tutanota/TypeRefs.js"
import { createEmailTemplateContent } from "../../common/api/entities/tutanota/TypeRefs.js"
import { clone, downcast } from "@tutao/tutanota-utils"
import type { TemplateGroupRoot } from "../../common/api/entities/tutanota/TypeRefs.js"
import { createEmailTemplate, EmailTemplateTypeRef } from "../../common/api/entities/tutanota/TypeRefs.js"
import stream from "mithril/stream"
import { difference, getFirstOrThrow, remove } from "@tutao/tutanota-utils"
import { getElementId, isSameId } from "../../common/api/common/utils/EntityUtils"
import type { EntityClient } from "../../common/api/common/EntityClient"
import { UserError } from "../../common/api/main/UserError"
import Stream from "mithril/stream"

export class TemplateEditorModel {
	template: EmailTemplate
	title: Stream<string>
	tag: Stream<string>
	selectedContent: Stream<EmailTemplateContent>
	_templateGroupRoot: TemplateGroupRoot
	_entityClient: EntityClient
	_contentProvider: (() => string) | null

	constructor(template: EmailTemplate | null, templateGroupRoot: TemplateGroupRoot, entityClient: EntityClient) {
		this.template = template ? clone(template) : createEmailTemplate({ tag: "", title: "", contents: [] })
		this.title = stream("")
		this.tag = stream("")
		const contents = this.template.contents
		this.selectedContent = stream(contents.length > 0 ? getFirstOrThrow(contents) : this.createContent(lang.code))
		this._templateGroupRoot = templateGroupRoot
		this._entityClient = entityClient
		this._contentProvider = null
	}

	isUpdate(): boolean {
		return this.template._id != null
	}

	setContentProvider(provider: () => string) {
		this._contentProvider = provider
	}

	createContent(languageCode: LanguageCode): EmailTemplateContent {
		const emailTemplateContent = createEmailTemplateContent({
			languageCode: languageCode,
			text: "",
		})
		this.template.contents.push(emailTemplateContent)
		return emailTemplateContent
	}

	updateContent(): void {
		const selectedContent = this.selectedContent()

		if (selectedContent && this._contentProvider) {
			selectedContent.text = this._contentProvider()
		}
	}

	removeContent(): void {
		const content = this.selectedContent()

		if (content) {
			remove(this.template.contents, content)
		}
	}

	/**
	 * Returns all languages that are available for creating new template content. Returns them in alphabetic order sorted by name.
	 * @returns {Array<{name: string, value: LanguageCode}>}
	 */
	getAdditionalLanguages(): Array<Language> {
		return difference(languages, this.getAddedLanguages(), (lang1, lang2) => lang1.code === lang2.code)
	}

	getAddedLanguages(): Array<Language> {
		return this.template.contents.map((content) => languageByCode[getLanguageCode(content)])
	}

	tagAlreadyExists(): Promise<boolean> {
		if (this.template._id) {
			// the current edited template should not be included in find()
			return this._entityClient.loadAll(EmailTemplateTypeRef, this._templateGroupRoot.templates).then((allTemplates) => {
				const filteredTemplates = allTemplates.filter((template) => !isSameId(getElementId(this.template), getElementId(template)))
				return filteredTemplates.some((template) => template.tag.toLowerCase() === this.template.tag.toLowerCase())
			})
		} else {
			return this._entityClient.loadAll(EmailTemplateTypeRef, this._templateGroupRoot.templates).then((allTemplates) => {
				return allTemplates.some((template) => template.tag.toLowerCase() === this.template.tag.toLowerCase())
			})
		}
	}

	save(): Promise<any> {
		if (!this.title()) {
			return Promise.reject(new UserError("emptyTitle_msg"))
		}

		if (!this.tag()) {
			return Promise.reject(new UserError("emptyShortcut_msg"))
		}

		this.updateContent()
		this.template.title = this.title().trim()
		this.template.tag = this.tag().trim()
		return this.tagAlreadyExists().then(async (exists) => {
			if (exists) {
				return Promise.reject(new UserError("templateShortcutExists_msg"))
			} else if (this.template._id) {
				return this._entityClient.update(this.template)
			} else {
				this.template._ownerGroup = this._templateGroupRoot._id
				return this._entityClient.setup(this._templateGroupRoot.templates, this.template)
			}
		})
	}
}

export function getLanguageCode(content: EmailTemplateContent): LanguageCode {
	return downcast(content.languageCode)
}

export function getLanguageName(content: EmailTemplateContent): string {
	return lang.get(languageByCode[getLanguageCode(content)].textId)
}

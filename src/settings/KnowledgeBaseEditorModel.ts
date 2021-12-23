// @flow

import type {EmailTemplate} from "../api/entities/tutanota/EmailTemplate"
import {EmailTemplateTypeRef} from "../api/entities/tutanota/EmailTemplate"
import {EntityClient} from "../api/common/EntityClient"
import type {TemplateGroupRoot} from "../api/entities/tutanota/TemplateGroupRoot"
import type {KnowledgeBaseEntry} from "../api/entities/tutanota/KnowledgeBaseEntry"
import {createKnowledgeBaseEntry} from "../api/entities/tutanota/KnowledgeBaseEntry"
import {clone, noOp} from "@tutao/tutanota-utils"
import {LazyLoaded} from "@tutao/tutanota-utils"
import type {TextFieldAttrs} from "../gui/base/TextFieldN"
import stream from "mithril/stream/stream.js"
import {NotFoundError} from "../api/common/error/RestError"
import {UserError} from "../api/main/UserError"
import type {KnowledgeBaseEntryKeyword} from "../api/entities/tutanota/KnowledgeBaseEntryKeyword"
import {createKnowledgeBaseEntryKeyword} from "../api/entities/tutanota/KnowledgeBaseEntryKeyword"
import {deduplicate} from "@tutao/tutanota-utils"
import {localeCompare} from "@tutao/tutanota-utils"
import {ofClass} from "@tutao/tutanota-utils"

export class KnowledgeBaseEditorModel {
	title: Stream<string>
	keywords: Stream<string>
	_enterTitleAttrs: TextFieldAttrs
	_entityClient: EntityClient
	_templateGroupRoot: TemplateGroupRoot
	+entry: KnowledgeBaseEntry
	availableTemplates: LazyLoaded<Array<EmailTemplate>>
	_descriptionProvider: ?() => string

	constructor(entry: ?KnowledgeBaseEntry, templateGroupInstances: TemplateGroupRoot, entityClient: EntityClient) {
		this.title = stream(entry ? entry.title : "")
		this.keywords = stream(entry ? keywordsToString(entry.keywords) : "")
		this._entityClient = entityClient
		this._templateGroupRoot = templateGroupInstances
		this.entry = entry ? clone(entry) : createKnowledgeBaseEntry()
		this._descriptionProvider = null

		this.availableTemplates = new LazyLoaded(() => {
			return this._entityClient.loadAll(EmailTemplateTypeRef, this._templateGroupRoot.templates)
		}, [])
	}

	isUpdate(): boolean {
		return this.entry._id != null
	}

	save(): Promise<*> {
		if (!this.title()) {
			return Promise.reject(new UserError("emptyTitle_msg"))
		}
		this.entry.title = this.title()

		this.entry.keywords = stringToKeywords(this.keywords())

		if (this._descriptionProvider) {
			this.entry.description = this._descriptionProvider()
		}
		if (this.entry._id) {
			return this._entityClient.update(this.entry)
			           .catch(ofClass(NotFoundError, noOp))
		} else {
			this.entry._ownerGroup = this._templateGroupRoot._id
			return this._entityClient.setup(this._templateGroupRoot.knowledgeBase, this.entry)
		}
	}

	setDescriptionProvider(provider: () => string) {
		this._descriptionProvider = provider
	}

}

/**
 * get keywords as a space separated string
 * @param keywords
 */
function keywordsToString(keywords: Array<KnowledgeBaseEntryKeyword>): string {
	return keywords.map(keyword => keyword.keyword).join(" ")
}

function stringToKeywords(keywords: string): Array<KnowledgeBaseEntryKeyword> {
	return deduplicate(keywords.split(" ").filter(Boolean))
		.sort(localeCompare)
		.map(keyword => createKnowledgeBaseEntryKeyword({keyword}))
}
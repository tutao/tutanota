import type { EmailTemplate } from "../../common/api/entities/tutanota/TypeRefs.js"
import { EmailTemplateTypeRef } from "../../common/api/entities/tutanota/TypeRefs.js"
import { EntityClient } from "../../common/api/common/EntityClient"
import type { TemplateGroupRoot } from "../../common/api/entities/tutanota/TypeRefs.js"
import type { KnowledgeBaseEntry } from "../../common/api/entities/tutanota/TypeRefs.js"
import { createKnowledgeBaseEntry } from "../../common/api/entities/tutanota/TypeRefs.js"
import { clone, deduplicate, LazyLoaded, localeCompare, noOp, ofClass } from "@tutao/tutanota-utils"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import { NotFoundError } from "../../common/api/common/error/RestError"
import { UserError } from "../../common/api/main/UserError"
import type { KnowledgeBaseEntryKeyword } from "../../common/api/entities/tutanota/TypeRefs.js"
import { createKnowledgeBaseEntryKeyword } from "../../common/api/entities/tutanota/TypeRefs.js"

export class KnowledgeBaseEditorModel {
	title: Stream<string>
	keywords: Stream<string>
	private readonly _entityClient: EntityClient
	private readonly _templateGroupRoot: TemplateGroupRoot
	readonly entry: KnowledgeBaseEntry
	readonly availableTemplates: LazyLoaded<Array<EmailTemplate>>
	private _descriptionProvider: (() => string) | null

	constructor(entry: KnowledgeBaseEntry | null, templateGroupInstances: TemplateGroupRoot, entityClient: EntityClient) {
		this.title = stream(entry ? entry.title : "")
		this.keywords = stream(entry ? keywordsToString(entry.keywords) : "")
		this._entityClient = entityClient
		this._templateGroupRoot = templateGroupInstances
		this.entry = entry ? clone(entry) : createKnowledgeBaseEntry({ description: "", title: "", keywords: [] })
		this._descriptionProvider = null
		this.availableTemplates = new LazyLoaded(() => {
			return this._entityClient.loadAll(EmailTemplateTypeRef, this._templateGroupRoot.templates)
		}, [])
	}

	isUpdate(): boolean {
		return this.entry._id != null
	}

	save(): Promise<any> {
		if (!this.title()) {
			return Promise.reject(new UserError("emptyTitle_msg"))
		}

		this.entry.title = this.title()
		this.entry.keywords = stringToKeywords(this.keywords())

		if (this._descriptionProvider) {
			this.entry.description = this._descriptionProvider()
		}

		if (this.entry._id) {
			return this._entityClient.update(this.entry).catch(ofClass(NotFoundError, noOp))
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
	return keywords.map((keyword) => keyword.keyword).join(" ")
}

function stringToKeywords(keywords: string): Array<KnowledgeBaseEntryKeyword> {
	return deduplicate(keywords.split(" ").filter(Boolean))
		.sort(localeCompare)
		.map((keyword) =>
			createKnowledgeBaseEntryKeyword({
				keyword,
			}),
		)
}

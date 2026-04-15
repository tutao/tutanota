import { EntityClient } from "../../common/api/common/EntityClient"
import { clone, deduplicate, LazyLoaded, localeCompare, noOp, ofClass } from "@tutao/utils"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import { restError } from "@tutao/restClient"
import { UserError } from "../../common/api/main/UserError"
import { tutanotaTypeRefs } from "@tutao/typeRefs"

export class KnowledgeBaseEditorModel {
	title: Stream<string>
	keywords: Stream<string>
	private readonly _entityClient: EntityClient
	private readonly _templateGroupRoot: tutanotaTypeRefs.TemplateGroupRoot
	readonly entry: tutanotaTypeRefs.KnowledgeBaseEntry
	readonly availableTemplates: LazyLoaded<Array<tutanotaTypeRefs.EmailTemplate>>
	private _descriptionProvider: (() => string) | null

	constructor(entry: tutanotaTypeRefs.KnowledgeBaseEntry | null, templateGroupInstances: tutanotaTypeRefs.TemplateGroupRoot, entityClient: EntityClient) {
		this.title = stream(entry ? entry.title : "")
		this.keywords = stream(entry ? keywordsToString(entry.keywords) : "")
		this._entityClient = entityClient
		this._templateGroupRoot = templateGroupInstances
		this.entry = entry ? clone(entry) : tutanotaTypeRefs.createKnowledgeBaseEntry({ description: "", title: "", keywords: [] })
		this._descriptionProvider = null
		this.availableTemplates = new LazyLoaded(() => {
			return this._entityClient.loadAll(tutanotaTypeRefs.EmailTemplateTypeRef, this._templateGroupRoot.templates)
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
			return this._entityClient.update(this.entry).catch(ofClass(restError.NotFoundError, noOp))
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
function keywordsToString(keywords: Array<tutanotaTypeRefs.KnowledgeBaseEntryKeyword>): string {
	return keywords.map((keyword) => keyword.keyword).join(" ")
}

function stringToKeywords(keywords: string): Array<tutanotaTypeRefs.KnowledgeBaseEntryKeyword> {
	return deduplicate(keywords.split(" ").filter(Boolean))
		.sort(localeCompare)
		.map((keyword) =>
			tutanotaTypeRefs.createKnowledgeBaseEntryKeyword({
				keyword,
			}),
		)
}

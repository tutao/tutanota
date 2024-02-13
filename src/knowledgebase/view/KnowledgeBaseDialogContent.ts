import m, { Children, Component, Vnode } from "mithril"
import { KnowledgeBaseModel } from "../model/KnowledgeBaseModel"
import type { EmailTemplate, KnowledgeBaseEntry } from "../../api/entities/tutanota/TypeRefs.js"
import { KNOWLEDGEBASE_LIST_ENTRY_HEIGHT, KnowledgeBaseListEntry } from "./KnowledgeBaseListEntry"
import { lang } from "../../misc/LanguageViewModel"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import { KnowledgeBaseEntryView } from "./KnowledgeBaseEntryView"
import { NotFoundError } from "../../api/common/error/RestError"
import { Dialog } from "../../gui/base/Dialog"
import { TextField } from "../../gui/base/TextField.js"
import { makeListSelectionChangedScrollHandler } from "../../gui/base/GuiUtils"
import { ofClass } from "@tutao/tutanota-utils"

export type KnowledgebaseDialogContentAttrs = {
	readonly onTemplateSelect: (arg0: EmailTemplate) => void
	readonly model: KnowledgeBaseModel
}

/**
 *  Renders the SearchBar and the pages (list, entry, template) of the knowledgeBase besides the MailEditor
 */
export class KnowledgeBaseDialogContent implements Component<KnowledgebaseDialogContentAttrs> {
	private _streams: Array<Stream<any>>
	private filterValue: string = ""
	private _selectionChangedListener!: Stream<void>

	constructor() {
		this._streams = []
	}

	oncreate({ attrs }: Vnode<KnowledgebaseDialogContentAttrs>) {
		const { model } = attrs

		this._streams.push(
			stream.combine(() => {
				m.redraw()
			}, [model.selectedEntry, model.filteredEntries]),
		)
	}

	onremove() {
		for (let stream of this._streams) {
			stream.end(true)
		}
	}

	view({ attrs }: Vnode<KnowledgebaseDialogContentAttrs>): Children {
		const model = attrs.model
		const selectedEntry = model.selectedEntry()
		return selectedEntry
			? m(KnowledgeBaseEntryView, {
					entry: selectedEntry,
					onTemplateSelected: (templateId) => {
						model
							.loadTemplate(templateId)
							.then((fetchedTemplate) => {
								attrs.onTemplateSelect(fetchedTemplate)
							})
							.catch(ofClass(NotFoundError, () => Dialog.message("templateNotExists_msg")))
					},
					readonly: model.isReadOnly(selectedEntry),
			  })
			: [
					m(TextField, {
						label: () => lang.get("filter_label"),
						value: this.filterValue,
						oninput: (value) => {
							this.filterValue = value
							model.filter(value)
							m.redraw()
						},
					}),
					this._renderKeywords(model),
					this._renderList(model, attrs),
			  ]
	}

	_renderKeywords(model: KnowledgeBaseModel): Children {
		const matchedKeywords = model.getMatchedKeywordsInContent()
		return m(".flex.mt-s.wrap", [
			matchedKeywords.length > 0 ? m(".small.full-width", lang.get("matchingKeywords_label")) : null,
			matchedKeywords.map((keyword) => {
				return m(".keyword-bubble-no-padding.plr-button.pl-s.pr-s.border-radius.no-wrap.mr-s.min-content", keyword)
			}),
		])
	}

	_renderList(model: KnowledgeBaseModel, attrs: KnowledgebaseDialogContentAttrs): Children {
		return m(
			".mt-s.scroll",
			{
				oncreate: (vnode) => {
					this._selectionChangedListener = model.selectedEntry.map(
						makeListSelectionChangedScrollHandler(vnode.dom as HTMLElement, KNOWLEDGEBASE_LIST_ENTRY_HEIGHT, model.getSelectedEntryIndex.bind(model)),
					)
				},
				onbeforeremove: () => {
					this._selectionChangedListener.end()
				},
			},
			[model.containsResult() ? model.filteredEntries().map((entry) => this._renderListEntry(model, entry)) : m(".center", lang.get("noEntryFound_label"))],
		)
	}

	_renderListEntry(model: KnowledgeBaseModel, entry: KnowledgeBaseEntry): Children {
		return m(".flex.flex-column.click.hoverable-list-item", [
			m(
				".flex",
				{
					onclick: () => {
						model.selectedEntry(entry)
					},
				},
				[
					m(KnowledgeBaseListEntry, {
						entry: entry,
					}),
					m("", {
						style: {
							width: "17.1px",
							height: "16px",
						},
					}),
				],
			),
		])
	}
}

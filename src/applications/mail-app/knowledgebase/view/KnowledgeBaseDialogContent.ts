import m, { Children, Component, Vnode } from "mithril"
import { KnowledgeBaseModel } from "../model/KnowledgeBaseModel.js"
import { KNOWLEDGEBASE_LIST_ENTRY_HEIGHT, KnowledgeBaseListEntry } from "./KnowledgeBaseListEntry.js"
import { lang } from "../../../../ui/utils/LanguageViewModel.js"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import { KnowledgeBaseEntryView } from "./KnowledgeBaseEntryView.js"
import * as restError from "../../../../platform-kit/rest-client/error"
import { Dialog } from "../../../../ui/base/Dialog.js"
import { LegacyTextField } from "../../../../ui/base/LegacyTextField.js"
import { makeListSelectionChangedScrollHandler } from "../../../../ui/base/GuiUtils.js"
import { ofClass } from "../../../../platform-kit/utils"
import { EmailTemplate, KnowledgeBaseEntry } from "@tutao/entities/tutanota"

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
							.catch(ofClass(restError.NotFoundError, () => Dialog.message("templateNotExists_msg")))
					},
					readonly: model.isReadOnly(selectedEntry),
				})
			: [
					m(LegacyTextField, {
						label: "filter_label",
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
		return m(".flex.mt-8.wrap", [
			matchedKeywords.length > 0 ? m(".small.full-width", lang.get("matchingKeywords_label")) : null,
			matchedKeywords.map((keyword) => {
				return m(".keyword-bubble-no-padding.plr-8.pl-4.pr-4.border-radius.no-wrap.mr-8.min-content", keyword)
			}),
		])
	}

	_renderList(model: KnowledgeBaseModel, attrs: KnowledgebaseDialogContentAttrs): Children {
		return m(
			".mt-8.scroll",
			{
				oncreate: (vnode) => {
					this._selectionChangedListener = model.selectedEntry.map(
						makeListSelectionChangedScrollHandler(
							vnode.dom as HTMLElement,
							KNOWLEDGEBASE_LIST_ENTRY_HEIGHT,
							model.getSelectedEntryIndex.bind(model),
						),
					)
				},
				onbeforeremove: () => {
					this._selectionChangedListener.end()
				},
			},
			[
				model.containsResult()
					? model.filteredEntries().map((entry) => this._renderListEntry(model, entry))
					: m(".center", lang.get("noEntryFound_label")),
			],
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

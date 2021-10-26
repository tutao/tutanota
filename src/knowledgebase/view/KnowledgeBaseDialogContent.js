// @flow
import m from "mithril"
import {KnowledgeBaseModel} from "../model/KnowledgeBaseModel"
import type {KnowledgeBaseEntry} from "../../api/entities/tutanota/KnowledgeBaseEntry"
import {KNOWLEDGEBASE_LIST_ENTRY_HEIGHT, KnowledgeBaseListEntry} from "./KnowledgeBaseListEntry"
import {lang} from "../../misc/LanguageViewModel"
import stream from "mithril/stream/stream.js"
import {KnowledgeBaseEntryView} from "./KnowledgeBaseEntryView"
import type {EmailTemplate} from "../../api/entities/tutanota/EmailTemplate"
import {NotFoundError} from "../../api/common/error/RestError"
import {Dialog} from "../../gui/base/Dialog"
import type {TextFieldAttrs} from "../../gui/base/TextFieldN"
import {TextFieldN} from "../../gui/base/TextFieldN"
import {makeListSelectionChangedScrollHandler} from "../../gui/base/GuiUtils"
import {ofClass} from "@tutao/tutanota-utils"

export type KnowledgebaseDialogContentAttrs = {|
	+onTemplateSelect: (EmailTemplate,) => void,
	+model: KnowledgeBaseModel,
|}

/**
 *  Renders the SearchBar and the pages (list, entry, template) of the knowledgeBase besides the MailEditor
 */
export class KnowledgeBaseDialogContent implements MComponent<KnowledgebaseDialogContentAttrs> {

	_streams: Array<Stream<*>>
	_filterInputFieldAttrs: TextFieldAttrs
	_selectionChangedListener: Stream<void>

	constructor({attrs}: Vnode<KnowledgebaseDialogContentAttrs>) {
		this._streams = []
		this._filterInputFieldAttrs = {
			label: () => lang.get("filter_label"),
			value: stream(""),
		}
	}

	oncreate({attrs}: Vnode<KnowledgebaseDialogContentAttrs>) {
		const {model} = attrs
		this._streams.push(stream.combine(() => {
			m.redraw()
		}, [model.selectedEntry, model.filteredEntries]))

		this._streams.push(this._filterInputFieldAttrs.value.map((value: string) => {
			model.filter(value)
			m.redraw()
		}))
	}

	onremove() {
		for (let stream of this._streams) {
			stream.end(true)
		}
	}

	view({attrs}: Vnode<KnowledgebaseDialogContentAttrs>): Children {
		const model = attrs.model
		const selectedEntry = model.selectedEntry()
		return selectedEntry
			? m(KnowledgeBaseEntryView, {
				entry: selectedEntry,
				onTemplateSelected: (templateId) => {
					model.loadTemplate(templateId).then((fetchedTemplate) => {
						attrs.onTemplateSelect(fetchedTemplate)
					}).catch(ofClass(NotFoundError, () => Dialog.error("templateNotExists_msg")))
				},
				readonly: model.isReadOnly(selectedEntry)
			})
			: [
				m(TextFieldN, this._filterInputFieldAttrs),
				this._renderKeywords(model),
				this._renderList(model, attrs)
			]

	}

	_renderKeywords(model: KnowledgeBaseModel): Children {
		const matchedKeywords = model.getMatchedKeywordsInContent()
		return m(".flex.mt-s.wrap", [
			matchedKeywords.length > 0
				? m(".small.full-width", lang.get("matchingKeywords_label"))
				: null,
			matchedKeywords.map(keyword => {
				return m(".keyword-bubble-no-padding.plr-button.pl-s.pr-s.border-radius.no-wrap.mr-s.min-content", keyword)
			})
		])
	}

	_renderList(model: KnowledgeBaseModel, attrs: KnowledgebaseDialogContentAttrs): Children {
		return m(".mt-s.scroll", {
			oncreate: (vnode) => {
				this._selectionChangedListener =
					model.selectedEntry.map(
						makeListSelectionChangedScrollHandler(vnode.dom,
							KNOWLEDGEBASE_LIST_ENTRY_HEIGHT,
							model.getSelectedEntryIndex.bind(model)))
			},
			onbeforeremove: () => {
				this._selectionChangedListener.end()
			}
		}, [
			model.containsResult()
				? model.filteredEntries().map((entry) => this._renderListEntry(model, entry))
				: m(".center", lang.get("noEntryFound_label"))
		])
	}

	_renderListEntry(model: KnowledgeBaseModel, entry: KnowledgeBaseEntry): Children {
		return m(".flex.flex-column.click.hoverable-list-item", [
			m(".flex", {
				onclick: () => {
					model.selectedEntry(entry)
				}
			}, [
				m(KnowledgeBaseListEntry, {entry: entry}),
				m("", {style: {width: "17.1px", height: "16px"}})
			])
		])
	}
}




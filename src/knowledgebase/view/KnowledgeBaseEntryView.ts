// @flow

import m from "mithril"
import type {KnowledgeBaseEntry} from "../../api/entities/tutanota/KnowledgeBaseEntry"
import {memoized, neverNull, noOp} from "@tutao/tutanota-utils"
import {htmlSanitizer} from "../../misc/HtmlSanitizer"
import {startsWith} from "@tutao/tutanota-utils"
import {ButtonN, ButtonType} from "../../gui/base/ButtonN"
import type {ButtonAttrs} from "../../gui/base/ButtonN"
import {Icons} from "../../gui/base/icons/Icons"
import {TemplateGroupRootTypeRef} from "../../api/entities/tutanota/TemplateGroupRoot"
import {locator} from "../../api/main/MainLocator"
import {getConfirmation} from "../../gui/base/GuiUtils"
import {NotFoundError} from "../../api/common/error/RestError"
import {ofClass} from "@tutao/tutanota-utils"

type KnowledgeBaseEntryViewAttrs = {
	entry: KnowledgeBaseEntry,
	onTemplateSelected: (IdTuple) => mixed,
	readonly: boolean
}

/**
 *  Renders one knowledgeBase entry
 */

export class KnowledgeBaseEntryView implements MComponent<KnowledgeBaseEntryViewAttrs> {
	_sanitizedEntry: (KnowledgeBaseEntry) => {content: string}

	constructor() {
		this._sanitizedEntry = memoized((entry) => {
			return {
				content: htmlSanitizer.sanitize(entry.description, {blockExternalContent: true}).text,
			}
		})
	}

	view({attrs}: Vnode<KnowledgeBaseEntryViewAttrs>): Children {
		return m(".flex.flex-column", [
			this._renderContent(attrs)
		])
	}

	_renderContent(attrs: KnowledgeBaseEntryViewAttrs): Children {
		const {entry, readonly} = attrs

		const editButtonAttrs: ButtonAttrs = {
			label: "edit_action",
			icon: () => Icons.Edit,
			type: ButtonType.Action,
			click: () => {
				import("../../settings/KnowledgeBaseEditor").then(({showKnowledgeBaseEditor}) => {
					locator.entityClient.load(TemplateGroupRootTypeRef, neverNull(entry._ownerGroup)).then(groupRoot => {
						showKnowledgeBaseEditor(entry, groupRoot)
					})
				})
			}
		}

		const removeButtonAttrs: ButtonAttrs = {
			label: "remove_action",
			icon: () => Icons.Trash,
			type: ButtonType.Action,
			click: () => {
				getConfirmation("deleteEntryConfirm_msg")
					.confirmed(() => locator.entityClient.erase(entry).catch(ofClass(NotFoundError, noOp)))
			}
		}

		return m("", {
			onclick: (event) => {
				this._handleAnchorClick(event, attrs)
			}
		}, [
			m(".flex.mt-l.center-vertically.selectable",
				m(".h4.text-ellipsis", entry.title),
				!readonly
					? [
						m(".flex.flex-grow.justify-end", [
							m(ButtonN, editButtonAttrs),
							m(ButtonN, removeButtonAttrs)
						])
					] : null),
			m("", [
				m(".mt-s.flex.mt-s.wrap", [
					entry.keywords.map(entryKeyword => {
						return m(".keyword-bubble.selectable", entryKeyword.keyword)
					})
				]),
				m(".flex.flex-column.mt-s", [
					m(".editor-border.text-break.selectable", m.trust(this._sanitizedEntry(entry).content)),
				]),
			])
		])
	}

	_handleAnchorClick(event: Event, attrs: KnowledgeBaseEntryViewAttrs): void {
		let target = (event.target: any)
		if (target && target.closest) {
			let anchorElement = target.closest("a")
			if (anchorElement && startsWith(anchorElement.href, "tutatemplate:")) {
				event.preventDefault()
				const [listId, elementId] = new URL(anchorElement.href).pathname.split("/")
				attrs.onTemplateSelected([listId, elementId])
			}
		}
	}
}
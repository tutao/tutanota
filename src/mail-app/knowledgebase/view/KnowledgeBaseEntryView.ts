import m, { Children, Component, Vnode } from "mithril"
import type { KnowledgeBaseEntry } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { TemplateGroupRootTypeRef } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { memoized, neverNull, noOp, ofClass, startsWith } from "@tutao/tutanota-utils"
import { htmlSanitizer } from "../../../common/misc/HtmlSanitizer.js"
import { Icons } from "../../../common/gui/base/icons/Icons.js"
import { locator } from "../../../common/api/main/CommonLocator.js"
import { getConfirmation } from "../../../common/gui/base/GuiUtils.js"
import { NotFoundError } from "../../../common/api/common/error/RestError.js"
import { IconButton } from "../../../common/gui/base/IconButton.js"

type KnowledgeBaseEntryViewAttrs = {
	entry: KnowledgeBaseEntry
	onTemplateSelected: (arg0: IdTuple) => unknown
	readonly: boolean
}

/**
 *  Renders one knowledgeBase entry
 */
export class KnowledgeBaseEntryView implements Component<KnowledgeBaseEntryViewAttrs> {
	_sanitizedEntry: (arg0: KnowledgeBaseEntry) => {
		content: string
	}

	constructor() {
		this._sanitizedEntry = memoized((entry) => {
			return {
				content: htmlSanitizer.sanitizeHTML(entry.description, {
					blockExternalContent: true,
				}).html,
			}
		})
	}

	view({ attrs }: Vnode<KnowledgeBaseEntryViewAttrs>): Children {
		return m(".flex.flex-column", [this._renderContent(attrs)])
	}

	_renderContent(attrs: KnowledgeBaseEntryViewAttrs): Children {
		const { entry, readonly } = attrs
		return m(
			"",
			{
				onclick: (event: MouseEvent) => {
					this._handleAnchorClick(event, attrs)
				},
			},
			[
				m(
					".flex.mt-l.center-vertically.selectable",
					m(".h4.text-ellipsis", entry.title),
					!readonly ? [m(".flex.flex-grow.justify-end", [this.renderEditButton(entry), this.renderRemoveButton(entry)])] : null,
				),
				m("", [
					m(".mt-s.flex.mt-s.wrap", [
						entry.keywords.map((entryKeyword) => {
							return m(".keyword-bubble.selectable", entryKeyword.keyword)
						}),
					]),
					m(".flex.flex-column.mt-s", [m(".editor-border.text-break.selectable", m.trust(this._sanitizedEntry(entry).content))]),
				]),
			],
		)
	}

	private renderRemoveButton(entry: KnowledgeBaseEntry) {
		return m(IconButton, {
			title: "remove_action",
			icon: Icons.Trash,
			click: () => {
				getConfirmation("deleteEntryConfirm_msg").confirmed(() => locator.entityClient.erase(entry).catch(ofClass(NotFoundError, noOp)))
			},
		})
	}

	private renderEditButton(entry: KnowledgeBaseEntry) {
		return m(IconButton, {
			title: "edit_action",
			icon: Icons.Edit,
			click: () => {
				import("../../settings/KnowledgeBaseEditor.js").then(({ showKnowledgeBaseEditor }) => {
					locator.entityClient.load(TemplateGroupRootTypeRef, neverNull(entry._ownerGroup)).then((groupRoot) => {
						showKnowledgeBaseEditor(entry, groupRoot)
					})
				})
			},
		})
	}

	_handleAnchorClick(event: Event, attrs: KnowledgeBaseEntryViewAttrs): void {
		let target = event.target as any

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

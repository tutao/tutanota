import m from "mithril"
import stream from "mithril/stream"
import {neverNull} from "@tutao/tutanota-utils"
import type {TextFieldAttrs} from "../gui/base/TextFieldN"
import {TextFieldN} from "../gui/base/TextFieldN"
import type {EntityUpdateData} from "../api/main/EventController"
import type {ButtonAttrs} from "../gui/base/ButtonN"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import {Icons} from "../gui/base/icons/Icons"
import {getLanguageCode} from "./TemplateEditorModel"
import {showTemplateEditor} from "./TemplateEditor"
import {Dialog} from "../gui/base/Dialog"
import {lang, languageByCode} from "../misc/LanguageViewModel"
import type {EmailTemplate} from "../api/entities/tutanota/TypeRefs.js"
import {locator} from "../api/main/MainLocator"
import {EntityClient} from "../api/common/EntityClient"
import {TemplateGroupRootTypeRef} from "../api/entities/tutanota/TypeRefs.js"
import {HtmlEditor} from "../gui/editor/HtmlEditor"
import {TEMPLATE_SHORTCUT_PREFIX} from "../templates/model/TemplatePopupModel"
import type {UpdatableSettingsDetailsViewer, UpdatableSettingsViewer} from "./SettingsView"
import type {lazy} from "@tutao/tutanota-utils"

export class TemplateDetailsViewer implements UpdatableSettingsDetailsViewer {
	isReadOnly: lazy<boolean>
	readonly view: UpdatableSettingsDetailsViewer["view"]

	constructor(template: EmailTemplate, entityClient: EntityClient, isReadOnly: lazy<boolean>) {
		this.isReadOnly = isReadOnly
		const tagAttrs: TextFieldAttrs = {
			label: "shortcut_label",
			value: TEMPLATE_SHORTCUT_PREFIX + neverNull(template.tag),
			disabled: true,
		}
		const EditButtonAttrs: ButtonAttrs = {
			label: "edit_action",
			icon: () => Icons.Edit,
			type: ButtonType.Action,
			click: () => {
				locator.entityClient.load(TemplateGroupRootTypeRef, neverNull(template._ownerGroup)).then(groupRoot => {
					showTemplateEditor(template, groupRoot)
				})
			},
		}
		const RemoveButtonAttrs: ButtonAttrs = {
			label: "remove_action",
			icon: () => Icons.Trash,
			type: ButtonType.Action,
			click: () => {
				Dialog.confirm("deleteTemplate_msg").then(confirmed => {
					if (confirmed) {
						entityClient.erase(template)
					}
				})
			},
		}

		this.view = () => {
			return m("#user-viewer.fill-absolute.scroll.plr-l.pb-floating", [
				m(".flex.mt-l.center-vertically", [
					m(".h4.text-ellipsis", template.title),
					!this.isReadOnly() ? m(".flex.flex-grow.justify-end", [m(ButtonN, EditButtonAttrs), m(ButtonN, RemoveButtonAttrs)]) : null,
				]),
				m("", [
					m(TextFieldN, tagAttrs),
					template.contents.map(emailTemplateContent => {
						const language = languageByCode[getLanguageCode(emailTemplateContent)]
						return m(".flex.flex-column", [
							m(".h4.mt-l", lang.get(language.textId)),
							m(".editor-border.text-break", m.trust(emailTemplateContent.text)),
						])
					}),
				]),
			])
		}
	}

	entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		return Promise.resolve()
	}
}
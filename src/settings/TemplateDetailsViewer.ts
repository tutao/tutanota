import m from "mithril"
import type {lazy} from "@tutao/tutanota-utils"
import {neverNull} from "@tutao/tutanota-utils"
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
import {TemplateGroupRootTypeRef} from "../api/entities/tutanota/TypeRefs.js"
import {locator} from "../api/main/MainLocator"
import {EntityClient} from "../api/common/EntityClient"
import {TEMPLATE_SHORTCUT_PREFIX} from "../templates/model/TemplatePopupModel"
import type {UpdatableSettingsDetailsViewer} from "./SettingsView"

export class TemplateDetailsViewer implements UpdatableSettingsDetailsViewer {
	isReadOnly: lazy<boolean>
	readonly view: UpdatableSettingsDetailsViewer["view"]

	constructor(template: EmailTemplate, entityClient: EntityClient, isReadOnly: lazy<boolean>) {
		this.isReadOnly = isReadOnly
		this.view = () => {
			return m("#user-viewer.fill-absolute.scroll.plr-l.pb-floating", [
				m(".flex.mt-l.center-vertically", [
					m(".h4.text-ellipsis", template.title),
					!this.isReadOnly()
						? m(".flex.flex-grow.justify-end", [
							m(ButtonN, {
								label: "edit_action",
								icon: () => Icons.Edit,
								type: ButtonType.Action,
								click: () => this.editTemplate(template),
							}),
							m(ButtonN, {
								label: "remove_action",
								icon: () => Icons.Trash,
								type: ButtonType.Action,
								click: () => this.deleteTemplate(entityClient, template),
							}),
						])
						: null,
				]),
				m("", [
					m(TextFieldN, {
						label: "shortcut_label",
						value: TEMPLATE_SHORTCUT_PREFIX + neverNull(template.tag),
						disabled: true,
					}),
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

	private deleteTemplate(entityClient: EntityClient, template: EmailTemplate) {
		Dialog.confirm("deleteTemplate_msg").then(confirmed => {
			if (confirmed) {
				entityClient.erase(template)
			}
		})
	}

	private editTemplate(template: EmailTemplate) {
		locator.entityClient.load(TemplateGroupRootTypeRef, neverNull(template._ownerGroup)).then(groupRoot => {
			showTemplateEditor(template, groupRoot)
		})
	}

	entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		return Promise.resolve()
	}
}
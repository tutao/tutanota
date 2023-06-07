import m from "mithril"
import type { lazy } from "@tutao/tutanota-utils"
import { assertNotNull } from "@tutao/tutanota-utils"
import { TextField } from "../gui/base/TextField.js"
import type { EntityUpdateData } from "../api/main/EventController"
import { Icons } from "../gui/base/icons/Icons"
import { getLanguageCode } from "./TemplateEditorModel"
import { showTemplateEditor } from "./TemplateEditor"
import { Dialog } from "../gui/base/Dialog"
import { lang, languageByCode } from "../misc/LanguageViewModel"
import type { EmailTemplate } from "../api/entities/tutanota/TypeRefs.js"
import { TemplateGroupRootTypeRef } from "../api/entities/tutanota/TypeRefs.js"
import { locator } from "../api/main/MainLocator"
import { EntityClient } from "../api/common/EntityClient"
import { TEMPLATE_SHORTCUT_PREFIX } from "../templates/model/TemplatePopupModel"
import type { UpdatableSettingsDetailsViewer } from "./SettingsView"
import { ActionBar } from "../gui/base/ActionBar.js"
import { htmlSanitizer } from "../misc/HtmlSanitizer.js"

export class TemplateDetailsViewer implements UpdatableSettingsDetailsViewer {
	readonly renderView: UpdatableSettingsDetailsViewer["renderView"]

	constructor(private readonly template: EmailTemplate, private readonly entityClient: EntityClient, readonly isReadOnly: lazy<boolean>) {
		this.renderView = () => {
			return m("#user-viewer.fill-absolute.scroll.plr-l.pb-floating", [
				m(".flex.mt-l.center-vertically", [
					m(".h4.text-ellipsis", template.title),
					!this.isReadOnly()
						? m(ActionBar, {
								buttons: [
									{
										title: "edit_action",
										icon: Icons.Edit,
										click: () => this.editTemplate(template),
									},
									{
										title: "remove_action",
										icon: Icons.Trash,
										click: () => this.deleteTemplate(entityClient, template),
									},
								],
						  })
						: null,
				]),
				m("", [
					m(TextField, {
						label: "shortcut_label",
						value: TEMPLATE_SHORTCUT_PREFIX + assertNotNull(template.tag, "template without tag!"),
						disabled: true,
					}),
					template.contents.map((emailTemplateContent) => {
						const language = languageByCode[getLanguageCode(emailTemplateContent)]
						return m(".flex.flex-column", [
							m(".h4.mt-l", lang.get(language.textId)),
							m(".editor-border.text-break", m.trust(this.sanitize(emailTemplateContent.text))),
						])
					}),
				]),
			])
		}
	}

	private deleteTemplate(entityClient: EntityClient, template: EmailTemplate) {
		Dialog.confirm("deleteTemplate_msg").then((confirmed) => {
			if (confirmed) {
				entityClient.erase(template)
			}
		})
	}

	private editTemplate(template: EmailTemplate) {
		locator.entityClient.load(TemplateGroupRootTypeRef, assertNotNull(template._ownerGroup, "template without ownerGroup!")).then((groupRoot) => {
			showTemplateEditor(template, groupRoot)
		})
	}

	private sanitize(html: string): string {
		return htmlSanitizer.sanitizeHTML(html, { blockExternalContent: false, allowRelativeLinks: true }).html
	}

	entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		return Promise.resolve()
	}
}

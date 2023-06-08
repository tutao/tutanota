import m, { Children } from "mithril"
import type { lazy } from "@tutao/tutanota-utils"
import { assertNotNull } from "@tutao/tutanota-utils"
import { TextField } from "../gui/base/TextField.js"
import type { EntityUpdateData } from "../api/main/EventController"
import { Icons } from "../gui/base/icons/Icons"
import { getLanguageCode } from "./TemplateEditorModel"
import { showTemplateEditor } from "./TemplateEditor"
import { Dialog } from "../gui/base/Dialog"
import { lang, languageByCode, TranslationKey } from "../misc/LanguageViewModel"
import type { EmailTemplate } from "../api/entities/tutanota/TypeRefs.js"
import { TemplateGroupRootTypeRef } from "../api/entities/tutanota/TypeRefs.js"
import { locator } from "../api/main/MainLocator"
import { EntityClient } from "../api/common/EntityClient"
import { TEMPLATE_SHORTCUT_PREFIX } from "../templates/model/TemplatePopupModel"
import type { UpdatableSettingsDetailsViewer } from "./SettingsView"
import { ActionBar } from "../gui/base/ActionBar.js"
import { htmlSanitizer } from "../misc/HtmlSanitizer.js"

export class TemplateDetailsViewer implements UpdatableSettingsDetailsViewer {
	// we're not memoizing the translated language name since this is not a proper mithril component and may stick around after a language
	// switch.
	private readonly sanitizedContents: Array<{ text: string; languageCodeTextId: TranslationKey }>

	constructor(private readonly template: EmailTemplate, private readonly entityClient: EntityClient, readonly isReadOnly: lazy<boolean>) {
		this.sanitizedContents = template.contents.map((emailTemplateContent) => ({
			text: htmlSanitizer.sanitizeHTML(emailTemplateContent.text, { blockExternalContent: false, allowRelativeLinks: true }).html,
			languageCodeTextId: languageByCode[getLanguageCode(emailTemplateContent)].textId,
		}))
	}

	readonly renderView: UpdatableSettingsDetailsViewer["renderView"] = () => {
		return m("#user-viewer.fill-absolute.scroll.plr-l.pb-floating", [this.renderTitleLine(), this.renderContent()])
	}

	private renderTitleLine(): Children {
		return m(".flex.mt-l.center-vertically", [
			m(".h4.text-ellipsis", this.template.title),
			!this.isReadOnly()
				? m(ActionBar, {
						buttons: [
							{
								title: "edit_action",
								icon: Icons.Edit,
								click: () => this.editTemplate(),
							},
							{
								title: "remove_action",
								icon: Icons.Trash,
								click: () => this.deleteTemplate(),
							},
						],
				  })
				: null,
		])
	}

	private renderContent(): Children {
		return m("", [
			m(TextField, {
				label: "shortcut_label",
				value: TEMPLATE_SHORTCUT_PREFIX + assertNotNull(this.template.tag, "template without tag!"),
				disabled: true,
			}),
			this.sanitizedContents.map(({ text, languageCodeTextId }) => {
				return m(".flex.flex-column", [m(".h4.mt-l", lang.get(languageCodeTextId)), m(".editor-border.text-break", m.trust(text))])
			}),
		])
	}

	private async deleteTemplate(): Promise<void> {
		if (!(await Dialog.confirm("deleteTemplate_msg"))) return
		await this.entityClient.erase(this.template)
	}

	private async editTemplate() {
		const { template } = this
		const groupRoot = await locator.entityClient.load(TemplateGroupRootTypeRef, assertNotNull(template._ownerGroup, "template without ownerGroup!"))
		showTemplateEditor(template, groupRoot)
	}

	entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		return Promise.resolve()
	}
}

import m, { Children } from "mithril"
import type { lazy } from "@tutao/utils"
import { assertNotNull } from "@tutao/utils"
import { LegacyTextField } from "../../ui/base/LegacyTextField.js"
import { Icons } from "../../ui/base/icons/Icons"
import { getLanguageCode } from "./TemplateEditorModel"
import { showTemplateEditor } from "./TemplateEditor"
import { Dialog } from "../../ui/base/Dialog"
import { lang, languageByCode, TranslationKey } from "../../ui/utils/LanguageViewModel"
import { locator } from "../../common/api/main/CommonLocator"
import { EntityClient } from "../../network/EntityClient"
import { TEMPLATE_SHORTCUT_PREFIX } from "../templates/model/TemplatePopupModel"
import { ActionBar } from "../../ui/base/ActionBar.js"
import { getHtmlSanitizer } from "../../common/gui/utils/HtmlSanitizer.js"
import { UpdatableSettingsDetailsViewer } from "../../common/settings/Interfaces.js"
import { EmailTemplate, TemplateGroupRootTypeRef } from "@tutao/entities/tutanota"
import { EntityUpdateData } from "../../instance-pipeline/utils/EntityUpdateUtils"

export class TemplateDetailsViewer implements UpdatableSettingsDetailsViewer {
	// we're not memoizing the translated language name since this is not a proper mithril component and may stick around after a language
	// switch.
	private readonly sanitizedContents: Array<{ text: string; languageCodeTextId: TranslationKey }>

	constructor(
		private readonly template: EmailTemplate,
		private readonly entityClient: EntityClient,
		readonly isReadOnly: lazy<boolean>,
	) {
		const htmlSanitizer = getHtmlSanitizer()
		this.sanitizedContents = template.contents.map((emailTemplateContent) => ({
			text: htmlSanitizer.sanitizeHTML(emailTemplateContent.text, {
				blockExternalContent: false,
				allowRelativeLinks: true,
			}).html,
			languageCodeTextId: languageByCode[getLanguageCode(emailTemplateContent)].textId,
		}))
	}

	readonly renderView: UpdatableSettingsDetailsViewer["renderView"] = () => {
		return m("#user-viewer.fill-absolute.scroll.plr-24.pb-floating", [this.renderTitleLine(), this.renderContent()])
	}

	private renderTitleLine(): Children {
		return m(".flex.mt-32.center-vertically", [
			m(".h4.text-ellipsis", this.template.title),
			!this.isReadOnly()
				? m(ActionBar, {
						buttons: [
							{
								title: "edit_action",
								icon: Icons.PenFilled,
								click: () => this.editTemplate(),
							},
							{
								title: "remove_action",
								icon: Icons.TrashFilled,
								click: () => this.deleteTemplate(),
							},
						],
					})
				: null,
		])
	}

	private renderContent(): Children {
		return m("", [
			m(LegacyTextField, {
				label: "shortcut_label",
				value: TEMPLATE_SHORTCUT_PREFIX + assertNotNull(this.template.tag, "template without tag!"),
				isReadOnly: true,
			}),
			this.sanitizedContents.map(({ text, languageCodeTextId }) => {
				return m(".flex.flex-column", [m(".h4.mt-32", lang.get(languageCodeTextId)), m(".editor-border.text-break", m.trust(text))])
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

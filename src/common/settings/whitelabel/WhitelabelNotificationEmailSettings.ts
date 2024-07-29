import m, { Children, Component, Vnode } from "mithril"
import stream from "mithril/stream"
import { lang, languageByCode } from "../../misc/LanguageViewModel"
import { ExpanderButton, ExpanderPanel } from "../../gui/base/Expander"
import { ColumnWidth, Table } from "../../gui/base/Table.js"
import { ButtonType } from "../../gui/base/Button.js"
import { Icons } from "../../gui/base/icons/Icons"
import { attachDropdown } from "../../gui/base/Dropdown.js"
import type { NotificationMailTemplate } from "../../api/entities/sys/TypeRefs.js"
import { downcast } from "@tutao/tutanota-utils"
import type { LanguageCode } from "../../misc/LanguageViewModel"
import Stream from "mithril/stream"
import { ButtonSize } from "../../gui/base/ButtonSize.js"

export type WhitelabelNotificationEmailSettingsAttrs = {
	notificationMailTemplates: Array<NotificationMailTemplate>
	onAddTemplate: () => unknown
	onEditTemplate: (arg0: NotificationMailTemplate) => unknown
	onRemoveTemplate: (arg0: NotificationMailTemplate) => unknown
}

export class WhitelabelNotificationEmailSettings implements Component<WhitelabelNotificationEmailSettingsAttrs> {
	_notificationEmailsExpanded: Stream<boolean>

	constructor(vnode: Vnode<WhitelabelNotificationEmailSettingsAttrs>) {
		this._notificationEmailsExpanded = stream<boolean>(false)
	}

	view(vnode: Vnode<WhitelabelNotificationEmailSettingsAttrs>): Children {
		const { onAddTemplate, onEditTemplate, onRemoveTemplate, notificationMailTemplates } = vnode.attrs
		return this._renderNotificationEmailSettings(notificationMailTemplates, onAddTemplate, onEditTemplate, onRemoveTemplate)
	}

	_renderNotificationEmailSettings(
		notificationMailTemplates: Array<NotificationMailTemplate>,
		onAddTemplate: () => unknown,
		onEditTemplate: (arg0: NotificationMailTemplate) => unknown,
		onRemoveTemplate: (arg0: NotificationMailTemplate) => unknown,
	): Children {
		return [
			m(".flex-space-between.items-center.mt-l.mb-s", [
				m(".h4", lang.get("customNotificationEmails_label")),
				m(ExpanderButton, {
					label: "show_action",
					expanded: this._notificationEmailsExpanded(),
					onExpandedChange: this._notificationEmailsExpanded,
				}),
			]),
			m(
				ExpanderPanel,
				{
					expanded: this._notificationEmailsExpanded(),
				},
				m(Table, {
					columnHeading: ["language_label", "subject_label"],
					columnWidths: [ColumnWidth.Largest, ColumnWidth.Largest],
					showActionButtonColumn: true,
					addButtonAttrs: {
						title: "add_action",
						click: () => {
							onAddTemplate()
						},
						icon: Icons.Add,
						size: ButtonSize.Compact,
					},
					lines: notificationMailTemplates.map((template) => {
						const languageCode: LanguageCode = downcast(template.language)
						const langName = lang.get(languageByCode[languageCode].textId)
						return {
							cells: [langName, template.subject],
							actionButtonAttrs: attachDropdown({
								mainButtonAttrs: {
									title: "edit_action",
									icon: Icons.Edit,
									size: ButtonSize.Compact,
								},
								childAttrs: () => [
									{
										label: "edit_action",
										click: () => onEditTemplate(template),
									},
									{
										label: "remove_action",
										click: () => onRemoveTemplate(template),
									},
								],
							}),
						}
					}),
				}),
			),
			m(".small", lang.get("customNotificationEmailsHelp_msg")),
		]
	}
}

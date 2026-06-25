import m, { Children, Component, Vnode } from "mithril"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import type { LanguageCode } from "../../../../ui/utils/LanguageViewModel"
import { lang, languageByCode } from "../../../../ui/utils/LanguageViewModel"
import { ExpanderButton, ExpanderPanel } from "../../../../ui/base/Expander"
import { ColumnWidth, Table } from "../../../../ui/base/Table.js"
import { Icons } from "../../../../ui/base/icons/Icons"
import { attachDropdown } from "../../../../ui/base/Dropdown.js"
import { downcast } from "@tutao/utils"
import { ButtonSize } from "../../../../ui/base/ButtonSize.js"
import { NotificationMailTemplate } from "@tutao/entities/sys"

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
			m(".flex-space-between.items-center.mt-32.mb-8", [
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
						label: "add_action",
						click: () => {
							onAddTemplate()
						},
						icon: Icons.Plus,
						size: ButtonSize.Compact,
					},
					lines: notificationMailTemplates.map((template) => {
						const languageCode: LanguageCode = downcast(template.language)
						const langName = lang.get(languageByCode[languageCode].textId)
						return {
							cells: [langName, template.subject],
							actionButtonAttrs: attachDropdown({
								mainButtonAttrs: {
									label: "edit_action",
									icon: Icons.PenFilled,
									size: ButtonSize.Compact,
								},
								childAttrs: async () => [
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

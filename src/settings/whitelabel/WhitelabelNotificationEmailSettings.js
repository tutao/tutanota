// @flow

import m from "mithril"
import stream from "mithril/stream/stream.js"
import {lang, languageByCode} from "../../misc/LanguageViewModel"
import {ExpanderButtonN, ExpanderPanelN} from "../../gui/base/Expander"
import {ColumnWidth, TableN} from "../../gui/base/TableN"
import {ButtonType} from "../../gui/base/ButtonN"
import {Icons} from "../../gui/base/icons/Icons"
import {attachDropdown} from "../../gui/base/DropdownN"
import type {NotificationMailTemplate} from "../../api/entities/sys/NotificationMailTemplate"

export type WhitelabelNotificationEmailSettingsAttrs = {
	notificationMailTemplates: Array<NotificationMailTemplate>,
	onAddTemplate: () => mixed,
	onEditTemplate: (NotificationMailTemplate) => mixed,
	onRemoveTemplate: (NotificationMailTemplate) => mixed,
}

export class WhitelabelNotificationEmailSettings implements MComponent<WhitelabelNotificationEmailSettingsAttrs> {
	_notificationEmailsExpanded: Stream<boolean>

	constructor(vnode: Vnode<WhitelabelNotificationEmailSettingsAttrs>) {
		this._notificationEmailsExpanded = stream(false)
	}

	view(vnode: Vnode<WhitelabelNotificationEmailSettingsAttrs>): Children {
		const {onAddTemplate, onEditTemplate, onRemoveTemplate, notificationMailTemplates} = vnode.attrs

		return this._renderNotificationEmailSettings(notificationMailTemplates, onAddTemplate, onEditTemplate, onRemoveTemplate)
	}

	_renderNotificationEmailSettings(
		notificationMailTemplates: Array<NotificationMailTemplate>,
		onAddTemplate: () => mixed,
		onEditTemplate: (NotificationMailTemplate) => mixed,
		onRemoveTemplate: (NotificationMailTemplate) => mixed,
	): Children {
		return [
			m(".flex-space-between.items-center.mt-l.mb-s", [
				m(".h4", lang.get("customNotificationEmails_label")),
				m(ExpanderButtonN, {label: "show_action", expanded: this._notificationEmailsExpanded})
			]),
			m(ExpanderPanelN, {expanded: this._notificationEmailsExpanded}, m(TableN, {
				columnHeading: ["language_label", "subject_label"],
				columnWidths: [ColumnWidth.Largest, ColumnWidth.Largest],
				showActionButtonColumn: true,
				addButtonAttrs: {
					label: "add_action",
					click: () => {
						onAddTemplate()
					},
					type: ButtonType.Action,
					icon: () => Icons.Add
				},
				lines: notificationMailTemplates.map((template) => {
					const langName = lang.get(languageByCode[template.language].textId)
					return {
						cells: [langName, template.subject],
						actionButtonAttrs: attachDropdown(
							{
								label: "edit_action",
								type: ButtonType.Action,
								icon: () => Icons.Edit
							},
							() => [
								{
									label: "edit_action",
									click: () => onEditTemplate(template),
									type: ButtonType.Dropdown,
								},
								{
									label: "remove_action",
									click: () => onRemoveTemplate(template),
									type: ButtonType.Dropdown,
								}
							]
						)
					}

				})
			})),
			m(".small", lang.get("customNotificationEmailsHelp_msg")),
		]
	}
}
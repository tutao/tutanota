import m, { Children, Component, Vnode } from "mithril"
import { lang } from "../../common/misc/LanguageViewModel"
import { theme } from "../../common/gui/theme"
import { px } from "../../common/gui/size"
import { ProgressBar } from "../../common/gui/base/ProgressBar"
import { DropDownSelector, type DropDownSelectorAttrs } from "../../common/gui/base/DropDownSelector"
import { MailboxDetail } from "../../common/mailFunctionality/MailboxModel"
import { getMailboxName } from "../../common/mailFunctionality/SharedMailUtils"
import { mailLocator } from "../mailLocator"
import { first } from "@tutao/tutanota-utils"
import { LoginController } from "../../common/api/main/LoginController"
import { Button, ButtonType } from "../../common/gui/base/Button"
import { MailExportController } from "../mail/model/MailExportController"
import { formatDate } from "../../common/misc/Formatter"
import Stream from "mithril/stream"

interface MailExportSettingsAttrs {
	mailboxDetails: MailboxDetail[]
	logins: LoginController
	mailExportController: MailExportController
}

export class MailExportSettings implements Component<MailExportSettingsAttrs> {
	private selectedMailbox: MailboxDetail | null = null
	private controllerSubscription: Stream<void> | null = null

	oncreate(vnode: Vnode<MailExportSettingsAttrs>) {
		this.controllerSubscription = vnode.attrs.mailExportController.state.map(m.redraw)
	}

	onremove() {
		if (this.controllerSubscription) {
			this.controllerSubscription.end()
			this.controllerSubscription = null
		}
	}

	view(vnode: Vnode<MailExportSettingsAttrs>): Children {
		const { mailboxDetails } = vnode.attrs
		this.selectedMailbox = this.selectedMailbox ?? first(mailboxDetails)
		const state = vnode.attrs.mailExportController.state()
		return [
			m(DropDownSelector, {
				label: "mailboxToExport_label",
				items: mailboxDetails.map((mailboxDetail) => {
					return { name: getMailboxName(mailLocator.logins, mailboxDetail), value: mailboxDetail }
				}),
				selectedValue: this.selectedMailbox,
				selectionChangedHandler: (selectedMailbox) => {
					this.selectedMailbox = selectedMailbox
				},
				dropdownWidth: 300,
				disabled: state.type === "exporting",
			} satisfies DropDownSelectorAttrs<MailboxDetail>),
			state.type === "exporting"
				? [
						m(".flex-space-between.items-center.mt.mb-s", [
							m(".flex-grow.mr", [
								m(
									"small.noselect",
									lang.get("exportingEmails_label", {
										"{count}": state.exportedMails,
									}),
								),
								m(
									".rel.full-width.mt-s",
									{
										style: {
											"background-color": theme.content_border,
											height: px(2),
										},
									},
									m(ProgressBar, { progress: state.progress }),
								),
							]),
							m(Button, {
								label: "cancel_action",
								type: ButtonType.Secondary,
								click: () => {
									vnode.attrs.mailExportController.cancelExport()
								},
							}),
						]),
				  ]
				: state.type === "idle"
				? [
						m(".flex-space-between.items-center.mt.mb-s", [
							m(
								"small.noselect",
								state.lastExport
									? lang.get("lastExportTime_Label", {
											"{date}": formatDate(state.lastExport),
									  })
									: null,
							),
							m(Button, {
								label: "export_action",
								click: () => {
									if (this.selectedMailbox) {
										vnode.attrs.mailExportController.startExport(this.selectedMailbox)
									}
								},
								type: ButtonType.Secondary,
							}),
						]),
				  ]
				: [
						m(".flex-space-between.items-center.mt.mb-s", [
							m(
								"small.noselect",
								lang.get("mailsExported_label", {
									"{numbers}": state.exportedMails,
								}),
							),
							m(Button, {
								label: "open_action",
								click: () => {},
								type: ButtonType.Secondary,
							}),
						]),
				  ],
		]
	}
}

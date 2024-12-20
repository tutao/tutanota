import m, { Children, Component, Vnode } from "mithril"
import { lang } from "../../common/misc/LanguageViewModel"
import { DropDownSelector, type DropDownSelectorAttrs } from "../../common/gui/base/DropDownSelector"
import { MailboxDetail } from "../../common/mailFunctionality/MailboxModel"
import { getMailboxName } from "../../common/mailFunctionality/SharedMailUtils"
import { mailLocator } from "../mailLocator"
import { first } from "@tutao/tutanota-utils"
import { LoginController } from "../../common/api/main/LoginController"
import { MailExportController } from "../native/main/MailExportController.js"
import Stream from "mithril/stream"
import { Button, ButtonType } from "../../common/gui/base/Button"
import { formatDate } from "../../common/misc/Formatter"
import { IconButton } from "../../common/gui/base/IconButton"
import { Icons } from "../../common/gui/base/icons/Icons"
import { ButtonSize } from "../../common/gui/base/ButtonSize"

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
			this.renderState(vnode.attrs.mailExportController),
		]
	}

	private renderState(controller: MailExportController): Children {
		const state = controller.state()
		switch (state.type) {
			case "exporting":
				return [
					m(".flex-space-between.items-center.mt.mb-s", [
						m(".flex-grow.mr", [
							m(
								"small.noselect",
								lang.get("exportingEmails_label", {
									"{count}": state.exportedMails,
								}),
							),
						]),
						m(IconButton, {
							title: "cancel_action",
							icon: Icons.Cancel,
							click: () => {
								controller.cancelExport()
							},
							size: ButtonSize.Normal,
						}),
					]),
				]
			case "idle":
				return [
					m(".flex-space-between.items-center.mt.mb-s", [
						m(
							"small.noselect",
							controller.lastExport
								? lang.get("lastExportTime_Label", {
										"{date}": formatDate(controller.lastExport),
								  })
								: null,
						),
						m(Button, {
							label: "export_action",
							click: () => {
								if (this.selectedMailbox) {
									controller.startExport(this.selectedMailbox)
								}
							},
							type: ButtonType.Secondary,
						}),
					]),
				]
			case "error":
				return [
					m(".flex-space-between.items-center.mt.mb-s", [
						m("small.noselect", state.message),
						m(Button, {
							label: "retry_action",
							click: () => {
								controller.cancelExport()
								if (this.selectedMailbox) {
									controller.startExport(this.selectedMailbox)
								}
							},
							type: ButtonType.Secondary,
						}),
					]),
				]
			case "finished":
				return [
					m(".flex-space-between.items-center.mt.mb-s", [
						m("small.noselect", lang.get("exportFinished_label")),
						m(Button, {
							label: "open_action",
							click: () => this.onOpenClicked(controller),
							type: ButtonType.Secondary,
						}),
					]),
				]
			case "locked":
				return [
					m(".flex-space-between.items-center.mt.mb-s.button-height", [
						m("small.noselect", `${lang.get("exportRunningElsewhere_label")} ${lang.get("pleaseWait_msg")}`),
					]),
				]
		}
	}

	private async onOpenClicked(controller: MailExportController) {
		await controller.openExportDirectory()
		await controller.cancelExport()
	}
}

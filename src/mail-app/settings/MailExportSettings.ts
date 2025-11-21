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
import { IconButton } from "../../common/gui/base/IconButton"
import { Icons } from "../../common/gui/base/icons/Icons"
import { ButtonSize } from "../../common/gui/base/ButtonSize"
import { LoginButton, LoginButtonType } from "../../common/gui/base/buttons/LoginButton"
import { Icon, IconSize } from "../../common/gui/base/Icon"
import { BootIcons } from "../../common/gui/base/icons/BootIcons"

interface MailExportSettingsAttrs {
	mailboxDetails: MailboxDetail[]
	logins: LoginController
	mailExportController: MailExportController
}

export class MailExportSettings implements Component<MailExportSettingsAttrs> {
	private selectedMailbox: MailboxDetail | null = null
	private controllerSubscription: Stream<void> | null = null
	private isExportHistoryExpanded: boolean = false

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
		const emptyLabel = m("br")
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
				helpLabel: () => emptyLabel,
			} satisfies DropDownSelectorAttrs<MailboxDetail>),
			this.renderState(vnode.attrs.mailExportController),
		]
	}

	private renderState(controller: MailExportController): Children {
		const state = controller.state()
		switch (state.type) {
			case "exporting":
				return [
					m(
						".flex-start.mt-12.small",
						lang.get("exportingEmails_label", {
							"{count}": state.exportedMails,
						}),
					),
					m(".flex-space-between.border-radius-12.mt-8.rel.nav-bg.full-width.center-vertically", [
						m(Icon, {
							icon: BootIcons.Progress,
							class: "flex-center items-center icon-progress-tiny icon-progress ml-8",
							size: IconSize.PX24,
						}),
						m(IconButton, {
							title: "cancel_action",
							icon: Icons.Cancel,
							click: () => {
								controller.cancelExport()
							},
							size: ButtonSize.Normal,
						}),
					]),
					state.paused ? m(".flex-start.mt-12.small", lang.getTranslation("mailExportLimitReached_msg").text) : null,
				]
			case "idle":
				return [
					m(".flex-start.mt-12", this.renderExportInfoText()),
					m(
						".flex-start.mt-8",
						m(LoginButton, {
							type: LoginButtonType.FlexWidth,
							label: "export_action",
							onclick: () => {
								if (this.selectedMailbox) {
									controller.startExport(this.selectedMailbox)
								}
							},
						}),
					),
				]
			case "error":
				return [
					m(".flex-space-between.items-center.mt-16.mb-8", [
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
					m("small.noselect", lang.get("exportFinished_label")),
					m(
						".flex-start.mt-8",
						m(LoginButton, {
							type: LoginButtonType.FlexWidth,
							label: "open_action",
							onclick: () => this.onOpenClicked(controller),
						}),
					),
				]
			case "locked":
				return [
					m(".flex-space-between.items-center.mt-16.mb-8.button-height", [
						m("small.noselect", `${lang.get("exportRunningElsewhere_label")} ${lang.get("pleaseWait_msg")}`),
					]),
				]
		}
	}

	private async onOpenClicked(controller: MailExportController) {
		await controller.openExportDirectory()
		await controller.cancelExport()
	}

	private renderExportInfoText() {
		return [m(".small", lang.get("mailExportInfoText_label"))]
	}
}

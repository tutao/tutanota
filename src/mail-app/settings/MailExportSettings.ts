import m, { Children, Component, Vnode } from "mithril"
import { lang } from "../../common/misc/LanguageViewModel"
import { DropDownSelector, type DropDownSelectorAttrs } from "../../common/gui/base/DropDownSelector"
import { MailboxDetail } from "../../common/mailFunctionality/MailboxModel"
import { getMailboxName } from "../../common/mailFunctionality/SharedMailUtils"
import { mailLocator } from "../mailLocator"
import { first } from "@tutao/tutanota-utils"
import { LoginController } from "../../common/api/main/LoginController"
import { FailedMailDisplay, MailExportController } from "../native/main/MailExportController.js"
import Stream from "mithril/stream"
import { Button, ButtonType } from "../../common/gui/base/Button"
import { IconButton } from "../../common/gui/base/IconButton"
import { Icons } from "../../common/gui/base/icons/Icons"
import { ButtonSize } from "../../common/gui/base/ButtonSize"
import { LoginButton } from "../../common/gui/base/buttons/LoginButton"
import { Icon, IconSize } from "../../common/gui/base/Icon"
import { ExpanderButton, ExpanderPanel } from "../../common/gui/base/Expander"
import { ColumnWidth, Table } from "../../common/gui/base/Table"

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
		const expanded = controller.expanded
		switch (state.type) {
			case "exporting":
				return this.renderExportingState(state, controller)
			case "idle":
				return this.renderIdleState(controller)
			case "error":
				return this.renderErrorState(state, controller)
			case "finished":
				return this.renderFinishedState(controller, state, expanded)
			case "locked":
				return this.renderLockedState()
		}
	}

	private renderExportingState(
		state: {
			type: "exporting"
			mailboxDetail: MailboxDetail
			progress: number
			exportedMails: number
			paused: boolean
			failures: number
		},
		controller: MailExportController,
	) {
		return [
			m(
				".flex-start.mt-12.small",
				lang.get("exportingEmails_label", {
					"{count}": state.exportedMails,
				}),
			),
			state.failures === 0
				? null
				: m(
						".flex-start.mt-12.small",
						lang.get("exportingEmailsFailure_label", {
							"{count}": state.failures,
						}),
					),
			m(".flex-space-between.border-radius-12.mt-8.rel.nav-bg.full-width.center-vertically", [
				m(Icon, {
					icon: Icons.Sync,
					class: "flex-center items-center icon-progress-tiny icon-progress ml-8",
					size: IconSize.PX24,
				}),
				m(IconButton, {
					title: "cancel_action",
					icon: Icons.X,
					click: () => {
						controller.cancelExport()
					},
					size: ButtonSize.Normal,
				}),
			]),
			state.paused ? m(".flex-start.mt-12.small", lang.getTranslation("mailExportLimitReached_msg").text) : null,
		]
	}

	private renderIdleState(controller: MailExportController) {
		return [
			m(".flex-start.mt-12", this.renderExportInfoText()),
			m(
				".flex-start.mt-8",
				m(LoginButton, {
					width: "flex",
					label: "export_action",
					onclick: () => {
						if (this.selectedMailbox) {
							controller.startExport(this.selectedMailbox)
						}
					},
				}),
			),
		]
	}

	private renderFinishedState(
		controller: MailExportController,
		state: {
			type: "finished"
			mailboxDetail: MailboxDetail
			failures: number
			failedMails: FailedMailDisplay[]
			error: Error | null
		},
		expanded: Stream<boolean>,
	) {
		const noFailures = state.failures === 0
		const hasErrors = state.error !== null
		return [
			m(
				".flex-start.mt-8",
				m(LoginButton, {
					width: "flex",
					label: "open_action",
					onclick: () => this.onOpenClicked(controller),
				}),
			),
			m("small.noselect", lang.get("exportFinished_label")),
			noFailures
				? null
				: hasErrors
					? m(".pt-12", lang.get("failedToExport_label", { "{0}": String(state.error) }))
					: m("", [
							m(".pt-12", lang.get("failedToExport_msg")),
							m(".flex-start.items-center", [
								m(ExpanderButton, {
									label: lang.makeTranslation(
										"hide_show",
										`${lang.get(expanded() ? "hide_action" : "show_action")} ${lang.get("failedToExport_label", { "{0}": state.failures })}`,
									),
									expanded: expanded(),
									onExpandedChange: expanded,
								}),
							]),
							m(
								ExpanderPanel,
								{
									expanded: expanded(),
								},
								m(Table, {
									columnHeading: ["email_label", "subject_label"],
									columnWidths: [ColumnWidth.Largest, ColumnWidth.Largest],
									showActionButtonColumn: false,
									lines: state.failedMails,
								}),
							),
						]),
		]
	}

	private renderErrorState(state: { type: "error"; message: string }, controller: MailExportController) {
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
	}

	private renderLockedState() {
		return [
			m(".flex-space-between.items-center.mt-16.mb-8.button-height", [
				m("small.noselect", `${lang.get("exportRunningElsewhere_label")} ${lang.get("pleaseWait_msg")}`),
			]),
		]
	}

	private async onOpenClicked(controller: MailExportController) {
		await controller.openExportDirectory()
		await controller.cancelExport()
	}

	private renderExportInfoText() {
		return [m(".small", lang.get("mailExportInfoText_label"))]
	}
}

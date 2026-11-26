import m, { Children, Component, Vnode } from "mithril"
import { Button, ButtonType } from "../../../ui/base/Button.js"
import { showUserError } from "../misc/ErrorHandlerImpl.js"
import { locator } from "../api/main/CommonLocator.js"
import { InfoLink, lang } from "../../../ui/utils/LanguageViewModel.js"
import { newMailEditorFromTemplate } from "../../mail-app/mail/editor/MailEditor.js"
import { UserError } from "../api/main/UserError.js"
import { clientInfoString, getLogAttachments } from "../misc/ErrorReporter.js"
import { ExternalLink } from "../../../ui/base/ExternalLink.js"
import { px, size } from "../../../ui/size.js"
import { prepareLogContent, showLogsDialog } from "../gui/LogDialogUtils"
import { ClientDetector } from "../../../platform-kit/app-env/boot/ClientDetector"
import { EnvProvider, TabIndex } from "@tutao/app-env"
import { getTutaLogoSvg } from "../../../ui/base/Logo"
import { theme } from "../../../ui/theme"
import { isKeyPressed } from "../../../ui/utils/KeyManager"
import { Keys } from "../../../ui/utils/KeyboardKeys"
import { LegacyPrivatePlans, NewPersonalPlans } from "../../../entities/sys/Utils"

interface AboutDialogAttrs {
	onShowSetupWizard: () => unknown
}

export class AboutDialog implements Component<AboutDialogAttrs> {
	private showRateUsLink = false

	async oninit(): Promise<void> {
		if (!locator.logins.isInternalUserLoggedIn()) return

		try {
			const plan = await locator.logins.getUserController().getPlanType()
			this.showRateUsLink = NewPersonalPlans.some((personalPlan) => personalPlan === plan) || LegacyPrivatePlans.includes(plan)
			m.redraw()
		} catch (error) {
			console.warn("Could not determine the account plan for the About dialog", error)
		}
	}

	view(vnode: Vnode<AboutDialogAttrs>): Children {
		return m(".flex.col", [
			m(".center.mt-16", "Powered by"),
			m(
				".center",
				// Our logo must be padded but at least a certain amount.
				// This might be a bit more than needed but it's safe.
				{
					style: {
						margin: px(size.spacing_48),
					},
				},
				m.trust(getTutaLogoSvg(theme.outline_variant)),
			),
			m(".flex.justify-center.flex-wrap", [
				m(ExternalLink, {
					href: InfoLink.HomePage,
					text: "Website",
					isCompanySite: true,
					specialType: "me",
					class: "mlr-12 mt-16",
				}),
				m(ExternalLink, {
					href: "https://github.com/tutao/tutanota/releases",
					text: "Releases",
					isCompanySite: false,
					class: "mlr-12 mt-16",
				}),

				this.showRateUsLink &&
					m(
						"a.underline",
						{
							href: "#",
							class: "mlr-12 mt-16",
							// Allow keyboard usage in modals etc.
							tabindex: TabIndex.Default,
							onkeydown: (e: KeyboardEvent) => {
								if (isKeyPressed(e.key, Keys.RETURN)) {
									e.stopPropagation()
								}
							},
							onclick: async () => (await import("../ratings/UserSatisfactionUtils")).scheduleSatisfactionDialog(),
						},
						lang.getTranslation("rateUs_action").text,
					),
			]),
			m(".flex.justify-center.selectable.flex-wrap", [
				m("p.center.mt-16.mlr-12", `v${env.versionNumber}`),
				m("p.text-center.mlr-12", "GPL-v3"),
				m("p", "© 2026 Tutao GmbH"),
			]),
			this.logsLink(),
			// wrap it in a div so that it's not filling the whole width
			EnvProvider.get().isApp()
				? m(
						"",
						m(Button, {
							label: "showWelcomeDialog_action",
							type: ButtonType.Primary,
							click: vnode.attrs.onShowSetupWizard,
						}),
					)
				: null,
		])
	}

	logsLink(): Children {
		if (ClientDetector.get().isMailApp()) {
			// Sending logs opens a mail editor, we only want to do this in an app that handles mail
			return this.sendLogsLink()
		} else {
			return this.getLogsLink()
		}
	}

	sendLogsLink(): Children {
		return m(
			".mt-16",
			m(Button, {
				label: "sendLogs_action",
				click: () => this._sendDeviceLogs(),
				type: ButtonType.Primary,
			}),
		)
	}

	getLogsLink(): Children {
		return m(
			".mt-16",
			m(Button, {
				label: "getLogs_action",
				click: () => prepareLogContent().then((logInfo) => showLogsDialog(logInfo)),
				type: ButtonType.Primary,
			}),
		)
	}

	async _sendDeviceLogs(): Promise<void> {
		const timestamp = new Date()
		const attachments = await getLogAttachments(timestamp)
		const mailboxDetails = await locator.mailboxModel.getUserMailboxDetails()
		let { message, type, client } = clientInfoString(timestamp, true)
		message = message
			.split("\n")
			.filter(Boolean)
			.map((l) => `<div>${l}<br></div>`)
			.join("")

		try {
			const editor = await newMailEditorFromTemplate(
				mailboxDetails,
				{},
				`Device logs v${env.versionNumber} - ${type} - ${client}`,
				message,
				attachments,
				true,
			)
			editor?.show()
		} catch (e) {
			if (e instanceof UserError) {
				await showUserError(e)
			} else {
				throw e
			}
		}
	}
}

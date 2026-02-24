import { Dialog, DialogType } from "../gui/base/Dialog.js"
import { InfoLink, lang } from "./LanguageViewModel.js"
import { defer } from "@tutao/tutanota-utils"
import m from "mithril"
import { ExternalLink } from "../gui/base/ExternalLink.js"
import { Keys } from "../api/common/TutanotaConstants.js"
import { BannerButton, BannerButtonAttrs } from "../gui/base/buttons/BannerButton"
import { theme } from "../gui/theme"
import { LoginButton, LoginButtonAttrs } from "../gui/base/buttons/LoginButton"
import { CancelledError } from "../api/common/error/CancelledError"

function renderMoreInfoLink(link: InfoLink) {
	return [
		m(".block", { style: { "text-align": "center" } }, [
			m(ExternalLink, {
				text: lang.get("whyThisHappens_msg"),
				href: link,
				isCompanySite: true,
			}),
		]),
	]
}

export async function showApprovalNeededMessageDialog(): Promise<void> {
	const closeAction = () => {
		dialog.close()
		resolve()
	}

	const fastTrackAction = async () => {
		const { newMailtoUrlMailEditor } = await import("../../mail-app/mail/editor/MailEditor")
		try {
			const editor = await newMailtoUrlMailEditor("mailto:approval@tutanota.com", false)
			editor?.show()
			dialog.close()
		} catch (e) {
			if (e instanceof CancelledError) {
				// ignore
			}
			throw e
		}
	}

	const buttonAutomaticApproval: BannerButtonAttrs = {
		text: "waitApprovalButton_action",
		click: closeAction,
		borderColor: theme.primary,
		color: theme.primary,
	}
	const buttonFastTrack: LoginButtonAttrs = {
		label: "fastTrackButtonApproval_action",
		onclick: fastTrackAction,
	}

	const { promise, resolve } = defer<void>()

	const dialog = new Dialog(DialogType.EditSmall, {
		view: () => [
			m(
				".dialog-header.plr-24.flex-space-between.dialog-header-line-height",
				m(
					"#dialog-title.flex-third-middle.overflow-hidden.flex.justify-center.items-center.b",
					{
						"data-testid": `dialog:${lang.getTestId("one_step")}`,
					},
					[m("", lang.getTranslationText("one_step"))],
				),
			),
			m("div.mt-16.mb-16.mlr-12", [
				m(
					"p",
					{
						style: {
							"text-align": "center",
						},
					},
					lang.get("approvalWaitNotice_nice_msg"),
				),
				renderMoreInfoLink(InfoLink.AccountApprovalFaq),
				m(".flex-center.col.gap-8.mt-16", m(BannerButton, buttonAutomaticApproval), m(LoginButton, buttonFastTrack)),
			]),
		],
	})
		.setCloseHandler(closeAction)
		.addShortcut({
			help: "close_alt",
			key: Keys.ESC,
			exec: closeAction,
		})
		.show()

	return promise
}

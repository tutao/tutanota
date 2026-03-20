import { Dialog, DialogType } from "../gui/base/Dialog.js"
import { InfoLink, lang } from "./LanguageViewModel.js"
import { assertNotNull, defer } from "@tutao/tutanota-utils"
import m from "mithril"
import { ExternalLink } from "../gui/base/ExternalLink.js"
import { ApprovalStatus, Keys } from "../api/common/TutanotaConstants.js"
import { BannerButton, BannerButtonAttrs } from "../gui/base/buttons/BannerButton"
import { theme } from "../gui/theme"
import { PrimaryButton, PrimaryButtonAttrs } from "../gui/base/buttons/VariantButtons.js"
import { CancelledError } from "../api/common/error/CancelledError"
import { locator } from "../api/main/CommonLocator"

// Function for rendering the more info link
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

// Function that will be called if user presses fast-track buttons
// Opens a new MailEditor Window with prefilled mailto and subject
// mailto=approval@tutao.de, subject=Approval Mail for example@tutanota.de
export const fastTrackAction = async (dialog?: Dialog) => {
	const mailAddress = assertNotNull(locator.logins.getUserController().userGroupInfo.mailAddress)
	const { newMailtoUrlMailEditor } = await import("../../mail-app/mail/editor/MailEditor")
	try {
		const editor = await newMailtoUrlMailEditor("mailto:approval@tutao.de?&body=" + lang.getTranslation("approvalMailBody_msg").text, false)
		editor?.show()
		dialog?.close()
	} catch (e) {
		if (e instanceof CancelledError) {
			// ignore
		}
		throw e
	}
}

export async function showApprovalNeededMessageDialog(approvalStatus: ApprovalStatus): Promise<void> {
	if (![ApprovalStatus.DELAYED, ApprovalStatus.REGISTRATION_APPROVAL_NEEDED].includes(approvalStatus)) {
		return
	}
	const closeAction = () => {
		dialog.close()
		resolve()
	}
	//Button Attributes for automatic approval button
	const buttonAutomaticApproval: BannerButtonAttrs = {
		text: "waitApprovalButton_action",
		click: closeAction,
		borderColor: theme.primary,
		color: theme.primary,
	}
	//Button Attributes for fast-track button
	const buttonFastTrack: PrimaryButtonAttrs = {
		label: "fastTrackButtonApproval_action",
		onclick: () => fastTrackAction(dialog),
	}

	const { promise, resolve } = defer<void>()

	const dialog = new Dialog(DialogType.EditSmall, {
		view: () => [
			m(
				".dialog-header.plr-24.flex-space-between.dialog-header-line-height",
				m(
					"#dialog-title.flex-third-middle.overflow-hidden.flex.justify-center.items-center.b",
					{
						"data-testid": `dialog:${lang.getTestId("oneStep_label")}`,
					},
					[m("", lang.getTranslationText("oneStep_label"))],
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
					lang.getTranslationText(approvalStatus === ApprovalStatus.DELAYED ? "approvalWaitNoticeFastTrack_msg" : "approvalWaitNotice_msg"),
				),
				renderMoreInfoLink(InfoLink.AccountApprovalFaq),
				m(
					".flex-center.col.gap-8.mt-16",
					m(BannerButton, buttonAutomaticApproval),
					approvalStatus === ApprovalStatus.DELAYED && m(PrimaryButton, buttonFastTrack),
				),
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

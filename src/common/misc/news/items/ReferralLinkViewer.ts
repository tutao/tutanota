import { InfoLink, lang } from "../../LanguageViewModel.js"
import { isApp } from "../../../api/common/Env.js"
import { locator } from "../../../api/main/CommonLocator.js"
import { copyToClipboard } from "../../ClipboardUtils.js"
import { showSnackBar } from "../../../gui/base/SnackBar.js"
import { createReferralCodePostIn } from "../../../api/entities/sys/TypeRefs.js"
import { ReferralCodeService } from "../../../api/entities/sys/Services.js"
import { TextField, TextFieldAttrs } from "../../../gui/base/TextField.js"
import m, { Children, Component, Vnode } from "mithril"
import { IconButton } from "../../../gui/base/IconButton.js"
import { BootIcons } from "../../../gui/base/icons/BootIcons.js"
import { ButtonSize } from "../../../gui/base/ButtonSize.js"
import { Icons } from "../../../gui/base/icons/Icons.js"
import { ifAllowedTutaLinks } from "../../../gui/base/GuiUtils.js"
import { UserController } from "../../../api/main/UserController.js"
import { MoreInfoLink } from "../MoreInfoLink.js"

export type ReferralLinkAttrs = {
	referralLink: string
}

/**
 * Component to display the sharable referral link.
 */
export class ReferralLinkViewer implements Component<ReferralLinkAttrs> {
	view(vnode: Vnode<ReferralLinkAttrs>): Children {
		return m(".scroll", [
			m(".h4", lang.get("referralSettings_label")),
			m("", lang.get("referralLinkLong_msg")),
			m(TextField, this.getReferralLinkTextFieldAttrs(vnode.attrs.referralLink)),
		])
	}

	getReferralLinkTextFieldAttrs(referralLink: string): TextFieldAttrs {
		return {
			isReadOnly: true,
			label: "referralLink_label",
			value: referralLink,
			injectionsRight: () => this.renderButtons(referralLink),
			helpLabel: () => ifAllowedTutaLinks(locator.logins, InfoLink.ReferralLink, (link) => [m(MoreInfoLink, { link: link })]),
		}
	}

	private renderButtons(referralLink: string): Children {
		if (referralLink === "") {
			return [] // referral link not available yet
		}

		return [
			m(IconButton, {
				title: "copy_action",
				click: () => this.copyAction(referralLink),
				icon: Icons.Copy,
				size: ButtonSize.Compact,
			}),
			m(IconButton, {
				title: "share_action",
				click: () => this.shareAction(referralLink),
				icon: BootIcons.Share,
				size: ButtonSize.Compact,
			}),
		]
	}

	private async copyAction(referralLink: string): Promise<void> {
		await copyToClipboard(referralLink)
		await showSnackBar({
			message: "linkCopied_msg",
			button: {
				label: "close_alt",
				click: () => {},
			},
		})
	}

	private async shareAction(referralLink: string): Promise<void> {
		if (isApp()) {
			// open native share dialog on mobile
			const shareMessage = this.getReferralLinkMessage(referralLink)
			return locator.systemFacade.shareText(shareMessage, lang.get("referralSettings_label")).then()
		} else {
			// otherwise share via MailEditor
			import("../../../../mail-app/mail/editor/MailEditor.js").then((mailEditorModule) => mailEditorModule.writeInviteMail(referralLink))
		}
	}

	private getReferralLinkMessage(referralLink: string): string {
		return lang.get("referralLinkShare_msg", {
			"{referralLink}": referralLink,
		})
	}
}

/**
 * Get the referral link for the logged-in user
 */
export async function getReferralLink(userController: UserController): Promise<string> {
	const customer = await userController.loadCustomer()
	const referralCode = customer.referralCode ? customer.referralCode : await requestNewReferralCode()
	const referralBaseUrl = locator.domainConfigProvider().getCurrentDomainConfig().referralBaseUrl
	const referralUrl = new URL(referralBaseUrl)
	referralUrl.searchParams.set("ref", referralCode)
	return referralUrl.href
}

async function requestNewReferralCode(): Promise<string> {
	const { referralCode } = await locator.serviceExecutor.post(ReferralCodeService, createReferralCodePostIn({}))
	return referralCode
}

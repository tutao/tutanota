import { InfoLink, lang } from "../../../../../ui/utils/LanguageViewModel.js"
import { locator } from "../../../api/main/CommonLocator.js"
import { copyToClipboard } from "../../../../../ui/utils/ClipboardUtils.js"
import { showInfoSnackbar } from "../../../../../ui/base/SnackBar.js"
import { LegacyTextField, LegacyTextFieldAttrs } from "../../../../../ui/base/LegacyTextField.js"
import m, { Children, Component, Vnode } from "mithril"
import { IconButton } from "../../../../../ui/base/IconButton.js"
import { ButtonSize } from "../../../../../ui/base/ButtonSize.js"
import { Icons } from "../../../../../ui/base/icons/Icons.js"
import { UserController } from "../../../api/main/UserController.js"
import { MoreInfoLink } from "../MoreInfoLink.js"
import { isApp } from "@tutao/app-env"
import { ifAllowedTutaLinks } from "../../../gui/base/TutaLinkUtils"
import { createReferralCodePostIn, ReferralCodeService } from "@tutao/entities/sys"

export type ReferralLinkAttrs = {
	referralLink: string
}

/**
 * Component to display the sharable referral link.
 */
export class ReferralLinkViewer implements Component<ReferralLinkAttrs> {
	view(vnode: Vnode<ReferralLinkAttrs>): Children {
		return m(".scroll", [
			this.renderTitle(),
			this.renderSubTitle(),
			this.renderBodyText(),
			m(LegacyTextField, this.getReferralLinkTextFieldAttrs(vnode.attrs.referralLink)),
		])
	}

	private renderTitle() {
		return m("h4.mb-16", {}, lang.get("referAFriendTitle_label"))
	}

	private renderSubTitle() {
		return m("div", lang.get("referAFriendSubTitle_label"))
	}

	private renderBodyText() {
		return m("ul", [
			m("li", m("span.b.mr-4", lang.get("referAFriendFriendBenefit_title")), m("span", lang.get("referAFriendFriendBenefit_label"))),
			m("li", m("span.b.mr-4", lang.get("referAFriendOwnBenefit_title")), m("span", lang.get("referAFriendOwnBenefit_label"))),
			m("li", m("span.b.mr-4", lang.get("referAFriendBothBenefit_title")), m("span", lang.get("referAFriendBothBenefit_label"))),
		])
	}

	getReferralLinkTextFieldAttrs(referralLink: string): LegacyTextFieldAttrs {
		return {
			isReadOnly: true,
			label: "referralLink_label",
			value: referralLink,
			injectionsRight: () => this.renderButtons(referralLink),
			helpLabel: () =>
				ifAllowedTutaLinks(locator.logins, InfoLink.ReferralLink, (link) => [m(MoreInfoLink, { label: "referAFriendMoreInfo_label", link: link })]),
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
				icon: Icons.CopyFilled,
				size: ButtonSize.Compact,
			}),
			m(IconButton, {
				title: "share_action",
				click: () => this.shareAction(referralLink),
				icon: Icons.ShareFilled,
				size: ButtonSize.Compact,
			}),
		]
	}

	private async copyAction(referralLink: string): Promise<void> {
		await copyToClipboard(referralLink)
		showInfoSnackbar("linkCopied_msg")
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
export async function getReferralLink(userController: UserController, isCalledBySatisfactionDialog: boolean = false): Promise<string> {
	const customer = await userController.reloadCustomer()
	const referralCode = customer.referralCode ? customer.referralCode : await requestNewReferralCode()
	const referralBaseUrl = locator.domainConfigProvider().getCurrentDomainConfig().referralBaseUrl
	const referralUrl = new URL(referralBaseUrl)
	referralUrl.searchParams.set("ref", referralCode)
	referralUrl.searchParams.set("s", isCalledBySatisfactionDialog ? "1" : "0")
	return referralUrl.href
}

async function requestNewReferralCode(): Promise<string> {
	const { referralCode } = await locator.serviceExecutor.post(ReferralCodeService, createReferralCodePostIn({}), null)
	return referralCode
}

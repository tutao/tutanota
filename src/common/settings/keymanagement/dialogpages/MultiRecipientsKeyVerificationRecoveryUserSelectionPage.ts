import m, { Component, Vnode } from "mithril"
import { lang, Translation } from "../../../misc/LanguageViewModel"
import { RecipientKeyVerificationRecoveryModel } from "../../../misc/RecipientKeyVerificationRecoveryModel"
import { IdentityKeySourceOfTrust } from "../../../api/common/TutanotaConstants"
import { RadioSelector, type RadioSelectorAttrs, type RadioSelectorOption } from "../../../gui/base/RadioSelector"
import { ResolvableRecipient } from "../../../api/main/RecipientsModel"
import { LoginButton } from "../../../gui/base/buttons/LoginButton"
import { ExternalLink } from "../../../gui/base/ExternalLink"
import { Card } from "../../../gui/base/Card"
import { TitleSection } from "../../../gui/TitleSection"
import { Icons } from "../../../gui/base/icons/Icons"
import { theme } from "../../../gui/theme"

type VerificationErrorUserSelectionPageAttrs = {
	model: RecipientKeyVerificationRecoveryModel
	sourceOfTrust: IdentityKeySourceOfTrust
	goToInfoPage: () => void
}

export class MultiRecipientsKeyVerificationRecoveryUserSelectionPage implements Component<VerificationErrorUserSelectionPageAttrs> {
	view(vnode: Vnode<VerificationErrorUserSelectionPageAttrs>): Vnode<any, any> {
		if (vnode.attrs.model.hasRecipients()) {
			return this.viewRecoveryOptions(vnode)
		} else {
			return this.viewRecoveryConfirmation(vnode)
		}
	}

	viewRecoveryOptions(vnode: Vnode<VerificationErrorUserSelectionPageAttrs>): Vnode<any, any> {
		const title = lang.get("keyManagement.reverifyRecipients_title")

		const selectableRecipients = this.makeRecipientOptions(vnode.attrs.model.getUnverifiedRecipients())

		return m(".pt-16.pb-16.flex.col.gap-16", [
			m(TitleSection, {
				title,
				subTitle: "",
				icon: Icons.BrokenShield,
				iconOptions: { color: theme.error },
			}),
			m(
				Card,
				m(".plr-12.flex.flex-column.gap-16.pt-8.pb-8", [
					lang.get("keyManagement.mailRecipientsVerificationMismatchError_msg"),
					m(
						"",
						m(RadioSelector, {
							name: "credentialsEncryptionMode_label",
							options: selectableRecipients,
							selectedOption: vnode.attrs.model.getCurrentRecipientAddress(),
							onOptionSelected: (address: string) => {
								vnode.attrs.model.setCurrentRecipientFromAddress(address)
							},
						} satisfies RadioSelectorAttrs<string>),
					),
					m(ExternalLink, {
						isCompanySite: true,
						text: lang.get("keyVerificationLearnMoreAboutContactVerificationLink_msg"),
						href: "https://tuta.com/encryption",
					}),
				]),
			),
			m(LoginButton, {
				label: "keyManagement.reverifyRecipient_action",
				onclick: async () => {
					vnode.attrs.goToInfoPage()
				},
			}),
		])
	}

	viewRecoveryConfirmation(vnode: Vnode<VerificationErrorUserSelectionPageAttrs>): Vnode<any, any> {
		const title = lang.get("keyManagement.reverifyRecipientsCompleted_title")
		const message = lang.get("keyManagement.reverifyRecipientsCompleted_msg")

		return m(".pt-16.pb-16.flex.col.gap-16", [
			m(TitleSection, {
				title,
				subTitle: "",
				icon: Icons.CheckCircleOutline,
				iconOptions: { color: theme.success },
			}),
			m(Card, m(".plr-12.flex.flex-column.gap-16.pt-8.pb-8", [message])),
		])
	}

	private makeRecipientOptions(recipients: ResolvableRecipient[]): Array<RadioSelectorOption<string>> {
		const options: { name: Translation; value: any }[] = []

		for (const recipient of recipients) {
			options.push({
				name: lang.makeTranslation(`translation_${recipient.address}`, recipient.address),
				value: recipient.address,
			})
		}

		return options
	}
}

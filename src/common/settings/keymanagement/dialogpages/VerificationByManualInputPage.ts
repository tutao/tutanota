import m, { Children, Component, Vnode } from "mithril"
import { TextFieldType } from "../../../gui/base/TextField"
import { lang } from "../../../misc/LanguageViewModel"
import { Card } from "../../../gui/base/Card"
import { SingleLineTextField } from "../../../gui/base/SingleLineTextField"
import { Icons } from "../../../gui/base/icons/Icons"
import { ButtonColor, getColors } from "../../../gui/base/Button"
import { LoginButton } from "../../../gui/base/buttons/LoginButton"
import { KeyVerificationModel } from "../KeyVerificationModel"
import { Icon, IconSize } from "../../../gui/base/Icon"
import { theme } from "../../../gui/theme"
import { debounce } from "@tutao/tutanota-utils"
import { IdentityKeyVerificationMethod } from "../../../api/common/TutanotaConstants"
import { getCleanedMailAddress } from "../../../misc/parsing/MailAddressParser"
import { BootIcons } from "../../../gui/base/icons/BootIcons"
import { TitleSection } from "../../../gui/TitleSection"
import { FingerprintRow } from "../FingerprintRow"

type VerificationByTextPageAttrs = {
	model: KeyVerificationModel
	goToSuccessPage: () => void
	gotToMismatchPage: () => void
}

const debouncedFingerprintRequest = debounce(500, async (model: KeyVerificationModel, mailAddress: string) => {
	await model.loadIdentityKeyForMailAddress(mailAddress)
	m.redraw()
})

export class VerificationByManualInputPage implements Component<VerificationByTextPageAttrs> {
	view(vnode: Vnode<VerificationByTextPageAttrs>): Children {
		const { model, goToSuccessPage } = vnode.attrs

		const publicIdentity = model.getPublicIdentity()

		return m(".pt.pb.flex.col.gap-vpad", [
			m(TitleSection, {
				title: lang.get("keyManagement.textVerification_label"),
				subTitle: lang.get("keyManagement.verificationByTextMailAdress_label"),
			}),
			m(
				Card,
				{
					style: { padding: "0" },
				},
				m(SingleLineTextField, {
					ariaLabel: lang.get("mailAddress_label"),
					placeholder: lang.get("mailAddress_label"),
					disabled: false,
					classes: ["flex", "gap-vpad-s", "items-center", "pl-vpad-s"],
					leadingIcon: {
						icon: BootIcons.User,
						color: getColors(ButtonColor.Content).button,
					},
					value: model.mailAddressInput,
					type: TextFieldType.Text,

					oninput: async (newValue) => {
						model.mailAddressInput = newValue
						const cleanMailAddress = getCleanedMailAddress(newValue)
						if (cleanMailAddress == null) {
							return "mailAddressInvalid_msg"
						} else {
							try {
								debouncedFingerprintRequest(model, cleanMailAddress)
							} catch (e) {
								console.error("error while trying to fetch the public key service: ", e)
							}
						}
					},
				}),
			),
			publicIdentity
				? [
						m(
							Card,
							{ classes: ["flex", "flex-column", "gap-vpad"] },
							m(
								".pl-vpad-s",
								lang.get("keyManagement.verificationByText_label", {
									"{settings}": lang.get("settings_label"),
									"{keyManagement}": lang.get("keyManagement_label"),
								}),
							),
							m(FingerprintRow, {
								mailAddress: publicIdentity.mailAddress,
								publicKeyType: publicIdentity.trustDbEntry.publicIdentityKey.object.type,
								publicKeyFingerprint: publicIdentity.fingerprint,
								publicKeyVersion: publicIdentity.trustDbEntry.publicIdentityKey.version,
							}),
						),
						m(LoginButton, {
							class: "flex-center row center-vertically",
							label: "yes_label",
							onclick: async () => {
								await model.trust(IdentityKeyVerificationMethod.text)
								goToSuccessPage()
							},
							icon: m(Icon, {
								icon: Icons.XCheckmark,
								size: IconSize.Large,
								class: "mr-s flex-center",
							}),
						}),
						m(LoginButton, {
							class: "flex-center row center-vertically",
							label: "no_label",
							onclick: async () => {
								vnode.attrs.gotToMismatchPage()
							},
							icon: m(Icon, {
								icon: Icons.XCross,
								size: IconSize.Large,
								class: "mr-s flex-center",
								style: {
									fill: theme.surface,
								},
							}),
						}),
					]
				: null,
		])
	}
}

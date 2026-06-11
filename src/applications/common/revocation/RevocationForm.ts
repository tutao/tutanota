import m, { ChildArray, Children, Component, Vnode } from "mithril"
import { lang } from "../../../ui/utils/LanguageViewModel.js"
import { client } from "../../../platform-kit/app-env/boot/ClientDetector.js"
import { assertNotNull } from "@tutao/utils"
import { Autocomplete, LegacyTextField, LegacyTextFieldType } from "../../../ui/base/LegacyTextField.js"
import { liveDataAttrs } from "../../../ui/AriaUtils.js"
import { PrimaryButton } from "../../../ui/base/buttons/VariantButtons.js"
import { Button, ButtonType } from "../../../ui/base/Button.js"
import { LeavingUserSurveyData, showLeavingUserSurveyWizard } from "../subscription/LeavingUserSurveyWizard.js"
import { PasswordField } from "../misc/passwords/PasswordField.js"

export interface RevocationFormAttrs {
	onSubmit: (surveyData: LeavingUserSurveyData | null) => unknown
	mailAddress: string
	onMailAddressChanged: (mailAddress: string) => unknown
	password: string
	onPasswordChanged: (password: string) => unknown
	helpText?: string
}

export class RevocationForm implements Component<RevocationFormAttrs> {
	mailAddressTextField!: LegacyTextField
	passwordTextField!: LegacyTextField
	surveyResult: LeavingUserSurveyData | null = null

	onremove(vnode: Vnode<RevocationFormAttrs>) {
		this.passwordTextField.domInput.value = ""
	}

	view(vnode: Vnode<RevocationFormAttrs>): Children {
		const a = vnode.attrs

		return m(
			"form",
			{
				onsubmit: (e: SubmitEvent) => {
					// do not post the form, the form is just here to enable browser auto-fill
					e.preventDefault() // a.onSubmit(a.mailAddress(), a.password())
				},
			},
			[
				m(".h3", lang.get("revocationForm_title")),
				m(".mt-8", lang.get("termination_text")),
				m(
					"",
					{
						oncreate: (vnode) => {
							const childArray = assertNotNull(vnode.children) as ChildArray
							const child = childArray[0] as Vnode<unknown, LegacyTextField>
							this.mailAddressTextField = child.state
						},
					},
					m(LegacyTextField, {
						label: "mailAddress_label",
						value: a.mailAddress,
						autocompleteAs: Autocomplete.email,
						oninput: (value) => {
							this.handleAutofill(a)
							a.onMailAddressChanged(value)
						},
						type: LegacyTextFieldType.Email,
						onDomInputCreated: (dom) => {
							if (!client.isMobileDevice()) {
								dom.focus() // have email address auto-focus so the user can immediately type their username (unless on mobile)
							}
						},
					}),
				),
				m(PasswordField, {
					value: a.password,
					autocompleteAs: Autocomplete.currentPassword,
					oncreate: (vnode) => {
						this.passwordTextField = { ...vnode.state }
					},
					onDomInputCreated: (domInput) => {
						this.passwordTextField.domInput = domInput
					},
					oninput: (value) => {
						this.handleAutofill(a)
						a.onPasswordChanged(value)
					},
				}),
				m(".mt-32.text-center", lang.get("surveySecondaryMessageDelete_label")),
				m(
					".mt-16.flex-center",
					m(Button, {
						type: ButtonType.Secondary,
						label: "surveyParticipate_action",
						click: () => {
							showLeavingUserSurveyWizard(true, false).then((result) => (this.surveyResult = result))
						},
					}),
				),
				m(
					".mt-16",
					m(PrimaryButton, {
						label: "revocation_action",
						onclick: () => {
							a.onSubmit(this.surveyResult)
						},
					}),
				),
				m(".small.center.statusTextColor.mt-16.mb-16", liveDataAttrs(), [a.helpText]),
			],
		)
	}

	private handleAutofill(a: RevocationFormAttrs) {
		// When iOS does auto-filling (always in WebView as of iOS 12.2 and in older Safari)
		// it only sends one input/change event for all fields so we didn't know if fields
		// were updated. So we kindly ask our fields to update themselves with real DOM values.
		requestAnimationFrame(() => {
			const oldAddress = a.mailAddress
			const newAddress = this.mailAddressTextField.domInput.value
			const oldPassword = a.password
			const newPassword = this.passwordTextField.domInput.value
			// only update values when they are different or we get stuck in an infinite loop
			if (oldAddress !== newAddress) a.onMailAddressChanged(newAddress)
			if (oldPassword !== newPassword) a.onPasswordChanged(newPassword)
		})
	}
}

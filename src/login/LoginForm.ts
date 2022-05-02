import m, {ChildArray, Children, Component, Vnode} from "mithril"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import {BootstrapFeatureType} from "../api/common/TutanotaConstants"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import {liveDataAttrs} from "../gui/AriaUtils"
import {lang, TranslationKey} from "../misc/LanguageViewModel"
import {TextFieldAttrs, TextFieldN, TextFieldType} from "../gui/base/TextFieldN"
import {CheckboxN} from "../gui/base/CheckboxN"
import {client} from "../misc/ClientDetector"
import {getWhitelabelCustomizations} from "../misc/WhitelabelCustomizations"
import {assertNotNull} from "@tutao/tutanota-utils"
import {isOfflineStorageAvailable} from "../api/common/Env"

export type LoginFormAttrs = {
	onSubmit: (username: string, password: string) => unknown
	mailAddress: Stream<string>
	password: Stream<string>
	savePassword?: Stream<boolean>
	helpText?: Vnode<any> | string
	invalidCredentials?: boolean
	showRecoveryOption?: boolean
	accessExpired?: boolean
}

export class LoginForm implements Component<LoginFormAttrs> {
	mailAddressTextField!: TextFieldN
	passwordTextField!: TextFieldN
	// When iOS does auto-filling (always in WebView as of iOS 12.2 and in older Safari)
	// it only sends one input/change event for all fields so we didn't know if fields
	// were updated. So we kindly ask our fields to update themselves with real DOM values.
	autofillUpdateHandler!: Stream<void>

	oncreate(vnode: Vnode<LoginFormAttrs>) {
		const a = vnode.attrs
		this.autofillUpdateHandler = stream.combine(() => {
			requestAnimationFrame(() => {
				const oldAddress = a.mailAddress()
				const newAddress = this.mailAddressTextField.domInput.value
				const oldPassword = a.password()
				const newPassword = this.passwordTextField.domInput.value
				// only update values when they are different or we get stuck in an infinite loop
				if (oldAddress !== newAddress) a.mailAddress(newAddress)
				if (oldPassword !== newPassword) a.password(newPassword)
			})
		}, [a.mailAddress, a.password])
	}

	onremove(vnode: Vnode<LoginFormAttrs>) {
		vnode.attrs.password("")
		this.autofillUpdateHandler.end(true)
		this.passwordTextField.domInput.value = ""
	}

	_passwordDisabled(): boolean {
		const customizations = getWhitelabelCustomizations(window)
		return Boolean(customizations && customizations.bootstrapCustomizations.includes(BootstrapFeatureType.DisableSavePassword))
	}

	view(vnode: Vnode<LoginFormAttrs>): Children {
		const a = vnode.attrs
		const passwordFieldAttrs: TextFieldAttrs = {
			label: "password_label",
			value: a.password(),
			oninput: a.password,
			type: TextFieldType.Password,
		}
		const canSaveCredentials = !!client.localStorage()
		return m(
			"form",
			{
				onsubmit: (e: SubmitEvent) => {
					// do not post the form, the form is just here to enable browser auto-fill
					e.preventDefault() // a.onSubmit(a.mailAddress(), a.password())
				},
			},
			[
				m(
					"",
					{
						oncreate: vnode => {
							const childArray = assertNotNull(vnode.children) as ChildArray
							const child = childArray[0] as Vnode<unknown, TextFieldN>
							this.mailAddressTextField = child.state
						},
					},
					m(TextFieldN, {
						label: "mailAddress_label" as TranslationKey,
						value: a.mailAddress(),
						oninput: a.mailAddress,
						type: TextFieldType.Email,
					}),
				),
				m(
					"",
					{
						oncreate: vnode => {
							const childArray = assertNotNull(vnode.children) as ChildArray
							const child = childArray[0] as Vnode<unknown, TextFieldN>
							this.passwordTextField = child.state
						},
					},
					m(TextFieldN, passwordFieldAttrs),
				),
				a.savePassword && !this._passwordDisabled()
					? m(CheckboxN, {
						label: () => lang.get("storePassword_action"),
						checked: a.savePassword(),
						onChecked: a.savePassword,
						helpLabel: (canSaveCredentials)
							? () => lang.get("onlyPrivateComputer_msg") + (isOfflineStorageAvailable() ? "\n" + lang.get("dataWillBeStored_msg") : "")
							: "functionNotSupported_msg",
						disabled: !canSaveCredentials,
					})
					: null,
				m(
					".pt",
					m(ButtonN, {
						label: "login_action",
						click: () => a.onSubmit(a.mailAddress(), a.password()),
						type: ButtonType.Login,
					}),
				),
				m(
					"p.center.statusTextColor",
					m("small" + liveDataAttrs(), [
						a.helpText ? a.helpText : null,
						" ",
						a.invalidCredentials && a.showRecoveryOption
							? m(
								"a",
								{
									href: "/recover",
									onclick: (e: MouseEvent) => {
										m.route.set("/recover", {
											mailAddress: a.mailAddress(),
											resetAction: "password",
										})
										e.preventDefault()
									},
								},
								lang.get("recoverAccountAccess_action"),
							)
							: a.accessExpired && a.accessExpired
								? m(
									"a",
									{
										// We import the dialog directly rather than redirecting to /recover here in order to not pass the password in plaintext via the URL
										href: "#",
										onclick: (e: MouseEvent) => {
											import("./recover/TakeOverDeletedAddressDialog").then(({showTakeOverDialog}) =>
												showTakeOverDialog(a.mailAddress(), a.password()),
											)
											e.preventDefault()
										},
									},
									lang.get("help_label"),
								)
								: null,
					]),
				),
			],
		)
	}
}
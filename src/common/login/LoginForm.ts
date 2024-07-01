import m, { Children, Component, Vnode } from "mithril"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import { liveDataAttrs } from "../gui/AriaUtils"
import { lang, TranslationKey } from "../misc/LanguageViewModel.js"
import { Autocomplete, TextField, TextFieldType } from "../gui/base/TextField.js"
import { Checkbox } from "../gui/base/Checkbox.js"
import { client } from "../misc/ClientDetector.js"
import { isApp, isDesktop, isOfflineStorageAvailable } from "../api/common/Env"
import { ACTIVATED_MIGRATION, isLegacyDomain } from "./LoginViewModel.js"
import { LoginButton } from "../gui/base/buttons/LoginButton.js"
import { PasswordField } from "../misc/passwords/PasswordField.js"
import { Keys } from "../api/common/TutanotaConstants"
import { useKeyHandler } from "../misc/KeyManager.js"

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
	mailAddressTextField!: HTMLInputElement
	passwordTextField!: HTMLInputElement
	// When iOS does auto-filling (always in WebView as of iOS 12.2 and in older Safari)
	// it only sends one input/change event for all fields so we didn't know if fields
	// were updated. So we kindly ask our fields to update themselves with real DOM values.
	autofillUpdateHandler!: Stream<void>

	oncreate(vnode: Vnode<LoginFormAttrs>) {
		const a = vnode.attrs
		this.autofillUpdateHandler = stream.combine(() => {
			requestAnimationFrame(() => {
				const oldAddress = a.mailAddress()
				const newAddress = this.mailAddressTextField.value
				const oldPassword = a.password()
				const newPassword = this.passwordTextField.value
				// only update values when they are different or we get stuck in an infinite loop
				if (oldAddress !== newAddress && newAddress != "") a.mailAddress(newAddress)
				if (oldPassword !== newPassword && newPassword != "") a.password(newPassword)
			})
		}, [a.mailAddress, a.password])
	}

	onremove(vnode: Vnode<LoginFormAttrs>) {
		vnode.attrs.password("")
		this.autofillUpdateHandler.end(true)
		this.passwordTextField.value = ""
	}

	isSavePasswordDisabled(): boolean {
		return ACTIVATED_MIGRATION() && isLegacyDomain()
	}

	view(vnode: Vnode<LoginFormAttrs>): Children {
		const a = vnode.attrs
		const canSaveCredentials = client.localStorage()
		if (a.savePassword && (isApp() || isDesktop()) && !this.isSavePasswordDisabled()) {
			a.savePassword(true)
		}
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
					m(TextField, {
						label: "mailAddress_label" as TranslationKey,
						value: a.mailAddress(),
						oninput: a.mailAddress,
						type: TextFieldType.Email,
						autocompleteAs: Autocomplete.email,
						onDomInputCreated: (dom) => {
							this.mailAddressTextField = dom
							if (!client.isMobileDevice()) {
								dom.focus() // have email address auto-focus so the user can immediately type their username (unless on mobile)
							}
						},
						keyHandler: (key) => {
							if (key.key != null && key.key.toLowerCase() === Keys.RETURN.code) {
								a.onSubmit(a.mailAddress(), a.password())
								// this is so that when "Return" is pressed, the user is logged in
								// and the password reveal button is not triggered
								return false
							}
							return true
						},
					}),
				),
				m(
					"",
					m(PasswordField, {
						value: a.password(),
						oninput: a.password,
						autocompleteAs: Autocomplete.currentPassword,
						onDomInputCreated: (dom) => (this.passwordTextField = dom),
						keyHandler: (key) => {
							if (key.key != null && key.key.toLowerCase() === Keys.RETURN.code) {
								a.onSubmit(a.mailAddress(), a.password())
								// this is so that when "Return" is pressed, the user is logged in
								// and the password reveal button is not triggered
								return false
							}
							return true
						},
					}),
				),
				a.savePassword && !this.isSavePasswordDisabled()
					? isApp() || isDesktop()
						? m("small.block.content-fg", lang.get("dataWillBeStored_msg"))
						: m(
								"",
								{
									onkeydown: (e: KeyboardEvent) => {
										useKeyHandler(e, (key) => {
											if (key.key != null && key.key.toLowerCase() === Keys.RETURN.code) {
												a.onSubmit(a.mailAddress(), a.password())
												// this is so that when "Return" is pressed, the user is logged in
												// and the password reveal button is not triggered
												e.preventDefault()
												return false
											}
											return false
										})
									},
								},
								m(Checkbox, {
									label: () => lang.get("storePassword_action"),
									checked: a.savePassword(),
									onChecked: a.savePassword,
									helpLabel: canSaveCredentials
										? () =>
												lang.get("onlyPrivateComputer_msg") +
												(isOfflineStorageAvailable() ? "\n" + lang.get("dataWillBeStored_msg") : "")
										: "functionNotSupported_msg",
									disabled: !canSaveCredentials,
								}),
						  )
					: null,
				m(
					".pt",
					m(LoginButton, {
						label: isApp() || isDesktop() ? "addAccount_action" : "login_action",
						onclick: () => a.onSubmit(a.mailAddress(), a.password()),
					}),
				),
				m(
					"p.center.statusTextColor.mt-s",
					{
						style: {
							// browser reset
							marginBottom: 0,
						},
					},
					m("small", liveDataAttrs(), [
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
											import("./recover/TakeOverDeletedAddressDialog.js").then(({ showTakeOverDialog }) =>
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

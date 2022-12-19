import m, {ChildArray, Children, Component, Vnode} from "mithril"
import {lang} from "../misc/LanguageViewModel.js"
import {client} from "../misc/ClientDetector.js"
import {assertNotNull} from "@tutao/tutanota-utils"
import {AutocompleteValues, TextField, TextFieldType} from "../gui/base/TextField.js"
import {Button, ButtonType} from "../gui/base/Button.js"
import {DropDownSelector} from "../gui/base/DropDownSelector.js"
import {TerminationPeriodOptions} from "../api/common/TutanotaConstants.js"
import {DatePicker} from "../gui/date/DatePicker.js"
import {liveDataAttrs} from "../gui/AriaUtils.js"

export interface TerminationFormAttrs {
	onSubmit: () => unknown
	mailAddress: string
	onMailAddressChanged: (mailAddress: string) => unknown
	password: string
	onPasswordChanged: (password: string) => unknown
	date: Date
	onDateChanged: (date: Date) => unknown
	terminationPeriodOption: TerminationPeriodOptions
	onTerminationPeriodOptionChanged: (option: TerminationPeriodOptions) => unknown
	helpText?: string
}

export class TerminationForm implements Component<TerminationFormAttrs> {
	mailAddressTextField!: TextField
	passwordTextField!: TextField

	onremove(vnode: Vnode<TerminationFormAttrs>) {
		this.passwordTextField.domInput.value = ""
	}

	view(vnode: Vnode<TerminationFormAttrs>): Children {
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
				m(".h3.mt-l", lang.get("terminationForm_title")),
				m(".mt-s", lang.get("termination_text")),
				m(
					"",
					{
						oncreate: vnode => {
							const childArray = assertNotNull(vnode.children) as ChildArray
							const child = childArray[0] as Vnode<unknown, TextField>
							this.mailAddressTextField = child.state
						},
					},
					m(TextField, {
						label: "mailAddress_label",
						value: a.mailAddress,
						autocompleteValue: AutocompleteValues.email,
						oninput: (value) => {
							this.handleAutofill(a)
							a.onMailAddressChanged(value)
						},
						type: TextFieldType.Email,
						onDomInputCreated: (dom) => {
							if (!client.isMobileDevice()) {
								dom.focus() // have email address auto-focus so the user can immediately type their username (unless on mobile)
							}
						}
					}),
				),
				m(
					"",
					{
						oncreate: vnode => {
							const childArray = assertNotNull(vnode.children) as ChildArray
							const child = childArray[0] as Vnode<unknown, TextField>
							this.passwordTextField = child.state
						},
					},
					m(TextField, {
						label: "password_label",
						value: a.password,
						autocompleteValue: AutocompleteValues.currentPassword,
						oninput: (value) => {
							this.handleAutofill(a)
							a.onPasswordChanged(value)
						},
						type: TextFieldType.Password,
					}),
				),
				m(".h3.mt-l", lang.get("terminationDateRequest_title")),
				m(".mt-s", lang.get("terminationDateRequest_msg")),
				m(DropDownSelector, {
					label: "emptyString_msg",
					class: "", // by specifying an empty class attribute we remove the padding top for the DropDownSelector
					items: [{
						name: lang.get("endOfCurrentSubscriptionPeriod"),
						value: TerminationPeriodOptions.EndOfCurrentPeriod
					}, {
						name: lang.get("futureDate"),
						value: TerminationPeriodOptions.FutureDate
					}],
					selectedValue: a.terminationPeriodOption,
					selectionChangedHandler: a.onTerminationPeriodOptionChanged,
					dropdownWidth: 350,
					helpLabel: () => this.renderTerminationDateInfo(a.terminationPeriodOption)
				}),

				a.terminationPeriodOption === TerminationPeriodOptions.FutureDate
					? m(DatePicker, {
						date: a.date,
						onDateSelected: a.onDateChanged,
						startOfTheWeekOffset: 0,
						label: "date_label",
						disabled: false
					})
					: null,

				m(
					".mt-l",
					m(Button, {
						label: "termination_action",
						click: () => a.onSubmit(),
						type: ButtonType.Login,
					}),
				),
				m(".small.center.statusTextColor.mt" + liveDataAttrs(), [
					a.helpText
				])
			],
		)
	}

	private handleAutofill(a: TerminationFormAttrs) {
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

	private renderTerminationDateInfo(terminationPeriodOption: TerminationPeriodOptions): Children {
		let infoMessage = lang.get((terminationPeriodOption === TerminationPeriodOptions.EndOfCurrentPeriod ?
			"terminationOptionEndOfSubscriptionInfo_msg" : "terminationOptionFutureDateInfo_msg"))
		return m(".small", infoMessage + " " + lang.get("terminationUseAccountUntilTermination_msg"))

	}
}
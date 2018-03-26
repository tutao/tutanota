// @flow
import m from "mithril"
import {Dialog} from "../gui/base/Dialog"
import {lang} from "../misc/LanguageViewModel"
import {DropDownSelector} from "../gui/base/DropDownSelector"
import stream from "mithril/stream/stream.js"
import {TextField, Type} from "../gui/base/TextField"
import type {Country} from "../api/common/CountryList"
import {Countries, CountryType} from "../api/common/CountryList"
import type {SegmentControlItem} from "../gui/base/SegmentControl"
import {SegmentControl} from "../gui/base/SegmentControl"
import {PaymentMethodType} from "../api/common/TutanotaConstants"
import {DialogHeaderBar} from "../gui/base/DialogHeaderBar"
import {Button, ButtonType} from "../gui/base/Button"
import {windowFacade} from "../misc/WindowFacade"
import {Keys} from "../misc/KeyManager"
import {defer} from "../api/common/utils/Utils"
import {CreditCardInput} from "./CreditCardInput"
import {HtmlEditor, Mode} from "../gui/base/HtmlEditor"
import MessageBox from "../gui/base/MessageBox"
import {PayPalLogo} from "../gui/base/icons/Icons"

class InvoiceDataDialog {
	view: Function;
	dialog: Dialog;

	_subscriptionOptions: SubscriptionOptions;
	_paymentMethod: stream<SegmentControlItem<PaymentMethodTypeEnum>>;
	_invoiceName: TextField;
	_invoiceAddress: HtmlEditor;
	_country: stream<?Country>
	_vatNumber: TextField;

	_currentPaymentMethodComponent: Component;
	_waitForUserInput: {resolve:Function, reject: Function, promise: Promise<void>}

	constructor(subscriptionOptions: SubscriptionOptions) {
		this._waitForUserInput = defer()
		this._subscriptionOptions = subscriptionOptions
		this._invoiceName = new TextField("invoiceRecipient_label", () => subscriptionOptions.businessUse ? lang.get("invoiceAddressInfoBusiness_msg") : lang.get("invoiceAddressInfoConsumer_msg"))
		//this._invoiceAddress = new TextField("invoiceAddress_label", () => subscriptionOptions.businessUse ? lang.get("invoiceAddressInfoBusiness_msg") : lang.get("invoiceAddressInfoConsumer_msg")).setType(Type.Area)
		this._invoiceAddress = new HtmlEditor()
			.setMinHeight(120)
			.showBorders()
			.setPlaceholderId("invoiceAddress_label")
			.setMode(Mode.HTML)
			.setHtmlMonospace(false)

		this._vatNumber = new TextField("invoiceVatIdNo_label")

		//"creditCardCVVFormatDetails_label": "Please enter the {1} digit {2} code of your {3} card.",
		//"creditCardCVVInvalid_msg": "Security code is invalid.",
		//"creditCardExpirationDateFormat_msg": "Please enter the expiration date of your credit card. Format: MM/YYYY",
		//"creditCardExprationDateInvalid_msg": "Expiration date is invalid.",
		// "creditCardNumberInvalid_msg": "Credit card number is invalid.",


		const countries = Countries.map(c => ({value: c, name: c.n}))
		countries.push({value: null, name: lang.get("choose_label")});
		this._country = stream(null)
		let countryInput = new DropDownSelector("invoiceCountry_label",
			() => lang.get("invoiceCountryInfoConsumer_msg"),
			countries,
			this._country,
			250).setSelectionChangedHandler(value => {
			this._country(value)
		})


		let creditCardComponent = new CreditCardInput()

		let payPalComponent = {
			view: () => {
				return m(".flex-center", {style: {'margin-top': "100px"}},
					m(".button-height.flex.items-center.plr.border.border-radius", m("img[src=" + PayPalLogo + "]"))
				)
			}
		}

		let messageBox = new MessageBox(() => (this._country() && this._country().t == CountryType.OTHER) ? lang.get("paymentMethodNotAvailable_msg") : lang.get("paymentMethodOnAccount_msg"))
		let invoiceComponent = {
			view: () => {
				return m(".flex-center", m(messageBox))
			}
		}

		let paymentMethods = [
			{name: lang.get("paymentMethodCreditCard_label"), value: PaymentMethodType.CreditCard},
			{name: "PayPal", value: PaymentMethodType.Paypal}
		]
		if (subscriptionOptions.businessUse) {
			paymentMethods.push({name: lang.get("paymentMethodOnAccount_label"), value: PaymentMethodType.Invoice})
		}
		this._paymentMethod = stream(paymentMethods[0])
		this._currentPaymentMethodComponent = creditCardComponent

		let paymentMethodControl = new SegmentControl(paymentMethods, this._paymentMethod, 130).setSelectionChangedHandler(v => {
			this._paymentMethod(v)
			if (v.value == PaymentMethodType.CreditCard) {
				this._currentPaymentMethodComponent = creditCardComponent
			} else if (v.value == PaymentMethodType.Paypal) {
				this._currentPaymentMethodComponent = payPalComponent
			} else if (v.value == PaymentMethodType.Invoice) {
				this._currentPaymentMethodComponent = invoiceComponent
			}
			m.redraw()
		})


		let headerBar = new DialogHeaderBar()
			.addLeft(new Button("cancel_action", () => this._cancel()).setType(ButtonType.Secondary))
			.setMiddle(() => lang.get("adminPayment_action"))
			.addRight(new Button("next_action", () => {
				this._confirm()
			}).setType(ButtonType.Primary))

		this.view = () => m("#upgrade-account-dialog.pt", [
			m(paymentMethodControl),
			m(".flex-space-around.flex-wrap", [
				m(".flex-grow-shrink-half.plr-l", {style: {minWidth: "240px"}}, [
					m(this._invoiceName),
					m(".pt", m(this._invoiceAddress)),
					m(countryInput),
					this._showVatIdNoField() ? m(this._vatNumber) : null
				]),
				m(".flex-grow-shrink-half.plr-l", {style: {minWidth: "240px"}}, m(this._currentPaymentMethodComponent))
			])
		])

		this.dialog = Dialog.largeDialog(headerBar, this)
			.addShortcut({
				key: Keys.ESC,
				exec: () => this._cancel(),
				help: "closeDialog_msg"
			})
			.addShortcut({
				key: Keys.S,
				ctrl: true,
				exec: () => this._confirm(),
				help: "next_action"
			})
	}

	show(): Promise<?InvoiceData> {
		this.dialog.show()
		windowFacade.checkWindowClosing(true)
		return this._waitForUserInput.promise.then(() => {
			return {
				invoiceName: this._invoiceName.value(),
				invoiceAddress: this._invoiceAddress.getValue(),
				vatNumber: this._showVatIdNoField() ? this._vatNumber.value() : null,
				paymentMethod: this._paymentMethod().value,
				creditCardData: null, // TODO collect credit card and PayPal data
				payPalData: null,
			}
		}).catch(() => null)
	}


	_showVatIdNoField(): boolean {
		return this._subscriptionOptions.businessUse && this._country() != null && this._country().t == CountryType.EU;
	}


	_validateInvoiceData(): ?string {
		if (this._subscriptionOptions.businessUse) {
			if (this._invoiceName.value().trim() == "") {
				return "invoiceRecipientInfoBusiness_msg";
			} else if (this._invoiceAddress.getValue().trim() == "" || (this._invoiceAddress.getValue().match(/\n/g) || []).length > 3) {
				return "invoiceAddressInfoBusiness_msg";
			} else if (!this._country()) {
				return "invoiceCountryInfoBusiness_msg";
			} else if (this._showVatIdNoField() && this._vatNumber.value().trim() == "") {
				return "invoiceVatIdNoInfoBusiness_msg";
			} else if (!this._paymentMethod()) {
				return "invoicePaymentMethodInfo_msg";
			}
		} else {
			if (!this._country()) {
				return "invoiceCountryInfoBusiness_msg"; // use business text here because it fits better
			} else if (!this._paymentMethod()) {
				return "invoicePaymentMethodInfo_msg";
			} else if ((this._invoiceAddress.getValue().match(/\n/g) || []).length > 3) {
				return "invoiceAddressInfoBusiness_msg";
			}
		}
		// no error
		return null;
	}

	_cancel() {
		this._close()
		this._waitForUserInput.reject("cancelled invoice data dialog")
	}

	_confirm() {
		let error = this._validateInvoiceData()
		if (error) {
			Dialog.error(error)
		} else {
			this._close()
			this._waitForUserInput.resolve()
		}
	}

	_close() {
		windowFacade.checkWindowClosing(false)
		this.dialog.close()
	}
}


export function openInvoiceDataDialog(subscriptionOptions: SubscriptionOptions): Promise<?InvoiceData> {
	return new InvoiceDataDialog(subscriptionOptions).show()
}


export function openInvoiceDataDialogSmall(subscriptionOptions: SubscriptionOptions): Promise<void> {
	let invoiceNameInput = new TextField("invoiceRecipient_label", () => subscriptionOptions.businessUse ? lang.get("invoiceRecipientInfoBusiness_msg") : lang.get("invoiceRecipientInfoConsumer_msg"))
	let invoiceAddressInput = new TextField("invoiceAddress_label", () => subscriptionOptions.businessUse ? lang.get("invoiceAddressInfoBusiness_msg") : lang.get("invoiceAddressInfoConsumer_msg")).setType(Type.Area)

	const countries = Countries.map(c => ({value: c.a, name: c.n}))
	countries.push({value: null, name: lang.get("choose_label")});
	let countryCode = stream(null)
	let countryInput = new DropDownSelector("invoiceCountry_label",
		() => lang.get("invoiceCountryInfoConsumer_msg"),
		countries,
		countryCode,
		250).setSelectionChangedHandler(v => {
		countryCode(v)
	})

	let paymentMethod = stream(null)
	let paymentMethodInput = new DropDownSelector("paymentMethod_label",
		() => lang.get("invoicePaymentMethodInfo_msg"),
		[{name: lang.get("choose_label"), value: null}],
		paymentMethod,
		250).setSelectionChangedHandler(v => {
		paymentMethod(v)
	})

	return Promise.fromCallback((callback) => {
		let invoiceDataDialog = Dialog.smallActionDialog(lang.get("invoiceData_msg"), {
			view: () => m(".text-break", [
				m(invoiceNameInput),
				m(invoiceAddressInput),
				m(countryInput),
				m(paymentMethodInput)
			])
		}, () => {
			if (!paymentMethod()) {

			}
			invoiceDataDialog.close()
			callback(null, null)
		}, true, "next_action", () => {
			invoiceDataDialog.close()
			callback(null, null)
		})
	})
}
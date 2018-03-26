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
import {px} from "../gui/size"
import MessageBox from "../gui/base/MessageBox"

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
					m("img[src=data:image/png;base64,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]", {
							width: px(115),
							height: px(44)
						}
					)
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
// @flow
import m from "mithril"
import {Dialog} from "../gui/base/Dialog"
import {DialogHeaderBar} from "../gui/base/DialogHeaderBar"
import {lang} from "../misc/LanguageViewModel"
import {assertMainOrNode} from "../api/Env"
import {windowFacade} from "../misc/WindowFacade"
import {Keys} from "../misc/KeyManager"
import {BuyOptionBox} from "./BuyOptionBox"
import {DropDownSelector} from "../gui/base/DropDownSelector"
import stream from "mithril/stream/stream.js"
import {TextField, Type} from "../gui/base/TextField"
import {BookingItemFeatureType, AccountType} from "../api/common/TutanotaConstants"
import {worker} from "../api/main/WorkerClient"
import {neverNull} from "../api/common/utils/Utils"
import {formatPrice} from "../misc/Formatter"
import {Countries} from "../api/common/CountryList"

assertMainOrNode()

export class UpgradeAccountTypeDialog {

	view: Function;
	dialog: Dialog;

	/**
	 * The contact that should be update or the contact list that the new contact should be written to must be provided
	 * @param c An existing or new contact. If null a new contact is created.
	 * @param listId The list id of the new contact.
	 * @param newContactIdReceiver. Is called receiving the contact id as soon as the new contact was saved.
	 */
	constructor(accountingInfo: AccountingInfo) {

		let freeTypeBox = new BuyOptionBox(() => "Free", "order_action",
			() => this._close(),
			this._getOptions("Free"))
		freeTypeBox.setValue("0 €")
		freeTypeBox.setHelpLabel("current plan")

		let premiumTypeBox = new BuyOptionBox(() => "Premium", "buy_action",
			() => {
				this._close()
				this._lauchPaymentFlow()
			},
			this._getOptions("Premium"))
		premiumTypeBox.setValue("1 €")
		premiumTypeBox.setHelpLabel("per month(paid yearly)")

		let businessTypeBox = new BuyOptionBox(() => "Pro", "buy_action",
			() => {
				this._close()
				this._lauchPaymentFlow()
			},
			this._getOptions("Pro"))
		businessTypeBox.setValue("5 €")
		businessTypeBox.setHelpLabel("per month (paid yearly)")
		let buyOptions = [
			freeTypeBox,
			premiumTypeBox,
			businessTypeBox
		]

		let headerBar = new DialogHeaderBar()
			.setMiddle(() => lang.get("upgradeToPremium_action"))
		//.addRight(new Button('save_action', () => this.save()).setType(ButtonType.Primary))
		this.view = () => m("#upgrade-account-dialog.pt", m(".flex-center.flex-wrap", buyOptions.map(bo => m(bo))))

		this.dialog = Dialog.largeDialog(headerBar, this)
			.addShortcut({
				key: Keys.ESC,
				exec: () => this._close(),
				help: "closeDialog_msg"
			})
			.addShortcut({
				key: Keys.S,
				ctrl: true,
				exec: () => console.log("next"),
				help: "send_action"
			})
	}

	_lauchPaymentFlow() {
		this._openPaymentDataDialog().then(result => {
			if (result) {
				this._openInvoiceDataDialog(result.businiessUsage, result.period)
			}
		})
	}

	_openPaymentDataDialog(): Promise<?{businiessUsage: boolean, period: number}> {
		let businessUse = stream(false)
		let businessInput = new DropDownSelector("businessUse_label",
			null,
			[{name: lang.get("businessUse_label"), value: true}, {name: lang.get("privateUse_label"), value: false}],
			businessUse, // Private
			250).setSelectionChangedHandler(v => {
			businessUse(v)
		})

		const labelHelpConstantPart = lang.get("amountDueBeginOfSubscriptionPeriod_msg");
		const priceHelperText = () => {
			const prefix = lang.get(businessUse() ? "priceExcludesTaxes_msg" : "priceIncludesTaxes_msg")
			const suffix = lang.get(period() == 12 ? "twoMonthsForFreeIncluded_msg" : "twoMonthsForFreeYearly_msg")
			return prefix + " " + labelHelpConstantPart + " " + suffix
		}

		const priceLabel = new TextField("bookingPrice_label", priceHelperText).setValue(" ")
		let period = stream(12)

		worker.getPrice(BookingItemFeatureType.Users, 1, false, period(), AccountType.PREMIUM, businessUse())
			.then(response => priceLabel.setValue(formatPrice(Number(neverNull(response.futurePriceNextPeriod).price), true)))

		let subscriptionInput = new DropDownSelector("subscription_label",
			() => lang.get("renewedSubscriptionInfo_msg"),
			[{name: lang.get("yearly_label"), value: 12}, {name: lang.get("monthly_label"), value: 1}],
			period,
			250).setSelectionChangedHandler(v => {
			period(v)
			worker.getPrice(BookingItemFeatureType.Users, 1, false, period(), AccountType.PREMIUM, businessUse())
				.then(response => {
					priceLabel.setValue(formatPrice(Number(neverNull(response.futurePriceNextPeriod).price), true))
					//m.redraw()
				})
		})

		return Promise.fromCallback((callback) => {
			let paymentDataDialog = Dialog.smallActionDialog(lang.get("adminPayment_action"), {
				view: () => m(".text-break.pt", [
					m(businessInput),
					m(subscriptionInput),
					m(priceLabel)
				])
			}, () => {
				paymentDataDialog.close()
				callback(null, {businessUse: businessUse(), period: period()})
			}, true, "next_action", () => {
				paymentDataDialog.close()
				callback(null, null)
			})
		})
	}


	_openInvoiceDataDialog(businessUse: boolean, period: number): Promise<void> {
		let invoiceNameInput = new TextField("invoiceRecipient_label", () => businessUse ? lang.get("invoiceRecipientInfoBusiness_msg") : lang.get("invoiceRecipientInfoConsumer_msg"))
		let invoiceAddressInput = new TextField("invoiceAddress_label", () => businessUse ? lang.get("invoiceAddressInfoBusiness_msg") : lang.get("invoiceAddressInfoConsumer_msg")).setType(Type.Area)

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
				invoiceDataDialog.close()
				callback(null, null)
			}, true, "next_action", () => {
				invoiceDataDialog.close()
				callback(null, null)
			})
		})
	}

	_getOptions(type: string): Array<string> {
		const features = ["comparisonAlias", "comparisonDomain", "comparisonInboxRules", "comparisonSearch", "comparisonLogin"]
		return features.map(f => lang.get(f + type + "_msg"))
	}

	show() {
		this.dialog.show()
		windowFacade.checkWindowClosing(true)
	}

	_close() {
		windowFacade.checkWindowClosing(false)
		this.dialog.close()
	}
}


// @flow
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {Dialog} from "../gui/base/Dialog"
import {DialogHeaderBar} from "../gui/base/DialogHeaderBar"
import {lang} from "../misc/LanguageViewModel"
import {assertMainOrNode} from "../api/Env"
import {windowFacade} from "../misc/WindowFacade"
import {Keys} from "../misc/KeyManager"
import {BuyOptionBox} from "./BuyOptionBox"
import type {SegmentControlItem} from "../gui/base/SegmentControl"
import {SegmentControl} from "../gui/base/SegmentControl"
import {BookingItemFeatureType, AccountType} from "../api/common/TutanotaConstants"
import {worker} from "../api/main/WorkerClient"
import {neverNull} from "../api/common/utils/Utils"
import {formatPrice} from "../misc/Formatter"
import {LazyLoaded} from "../api/common/utils/LazyLoaded"
import {CustomerTypeRef} from "../api/entities/sys/Customer"
import {CustomerInfoTypeRef} from "../api/entities/sys/CustomerInfo"
import {AccountingInfoTypeRef} from "../api/entities/sys/AccountingInfo"
import {load} from "../api/main/Entity"
import {logins} from "../api/main/LoginController"
import {openUpgradeConfirmDialog} from "./UpgradeConfirmDialog"
import {openInvoiceDataDialog} from "./InvoiceDataDialog"

assertMainOrNode()


type UpgradePrices = {
	premiumPrice:number,
	proPrice:number
}

type UpgradeBox = {
	buyOptionBox:BuyOptionBox;
	paymentInterval:stream<SegmentControlItem<number>>
}

class UpgradeAccountTypeDialog {
	view: Function;
	dialog: Dialog;
	_premiumUpgradeBox: UpgradeBox;
	_proUpgradeBox: UpgradeBox;
	_businessUse: stream<SegmentControlItem<boolean>>
	_monthlyPrice: LazyLoaded<UpgradePrices>
	_yearlyPrice: LazyLoaded<UpgradePrices>
	_accountingInfo: AccountingInfo

	constructor(accountingInfo: AccountingInfo) {
		this._accountingInfo = accountingInfo
		let freeTypeBox = new BuyOptionBox(() => "Free", "choose_action",
			() => this._close(),
			this._getOptions(["comparisonUsers", "comparisonStorage", "comparisonDomain", "comparisonSearch"], "Free"), 230, 240)
		freeTypeBox.setValue("0 €")
		freeTypeBox.setHelpLabel(lang.get("upgradeLater_msg"))

		//"comparisonAlias", ""comparisonInboxRules"", "comparisonDomain", "comparisonLogin"
		this._premiumUpgradeBox = this._createUpgradeBox(false, ["comparisonUsers", "comparisonStorage", "comparisonDomain", "comparisonSearch", "comparisonAlias", "comparisonInboxRules"])
		this._proUpgradeBox = this._createUpgradeBox(true, ["comparisonUsers", "comparisonStorage", "comparisonDomain", "comparisonSearch", "comparisonAlias", "comparisonInboxRules", "comparisonLogin", "comparisonTheme"])

		let privateBuyOptions = [freeTypeBox, this._premiumUpgradeBox.buyOptionBox, this._proUpgradeBox.buyOptionBox]
		let businessBuyOptions = [this._premiumUpgradeBox.buyOptionBox, this._proUpgradeBox.buyOptionBox]

		let businessUseItems = [
			{name: lang.get("privateUse_label"), value: false},
			{name: lang.get("businessUse_label"), value: true}
		]
		this._businessUse = stream(accountingInfo.business ? businessUseItems[1] : businessUseItems[0])
		let privateBusinesUseControl = new SegmentControl(businessUseItems, this._businessUse).setSelectionChangedHandler(businessUseItem => {
			const helpLabel = lang.get(businessUseItem.value ? "priceExcludesTaxes_msg" : "priceIncludesTaxes_msg")
			this._premiumUpgradeBox.buyOptionBox.setHelpLabel(helpLabel)
			this._proUpgradeBox.buyOptionBox.setHelpLabel(helpLabel)
			this._businessUse(businessUseItem)
		})

		this._yearlyPrice = new LazyLoaded(() => this._getPrices(12), null)
		this._monthlyPrice = new LazyLoaded(() => {
			Dialog.error("twoMonthsForFreeYearly_msg")
			return this._getPrices(1)
		}, null)

		// initial help label and price
		this._yearlyPrice.getAsync().then(yearlyPrice => {
			this._premiumUpgradeBox.buyOptionBox.setValue(yearlyPrice.premiumPrice + " €")
			this._proUpgradeBox.buyOptionBox.setValue(yearlyPrice.proPrice + " €")

			const helpLabel = lang.get(this._businessUse.value ? "priceExcludesTaxes_msg" : "priceIncludesTaxes_msg")
			this._premiumUpgradeBox.buyOptionBox.setHelpLabel(helpLabel)
			this._proUpgradeBox.buyOptionBox.setHelpLabel(helpLabel)
			m.redraw()
		})

		let headerBar = new DialogHeaderBar()
			.setMiddle(() => lang.get("upgradeToPremium_action"))

		this.view = () => m("#upgrade-account-dialog.pt", [
				m(privateBusinesUseControl),
				m(".flex-center.flex-wrap", (this._businessUse().value ? businessBuyOptions : privateBuyOptions).map(bo => m(bo)))
			]
		)

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
				help: "next_action"
			})
	}


	_createUpgradeBox(proUpgrade: boolean, featurePrefixes: Array<string>): UpgradeBox {
		let title = proUpgrade ? "Pro" : "Premium"
		let buyOptionBox = new BuyOptionBox(() => title, "buy_action",
			() => {
				this._close()
				this._lauchPaymentFlow({
					businessUse: this._businessUse().value,
					paymentInterval: proUpgrade ? this._proUpgradeBox.paymentInterval().value : this._premiumUpgradeBox.paymentInterval().value,
					proUpgrade: proUpgrade,
					price: buyOptionBox.value()
				}, this._accountingInfo)
			},
			this._getOptions(featurePrefixes, title), 230, 240)

		buyOptionBox.setValue(lang.get("emptyString_msg"))
		buyOptionBox.setHelpLabel(lang.get("emptyString_msg"))

		let paymentIntervalItems = [
			{name: lang.get("yearly_label"), value: 12},
			{name: lang.get("monthly_label"), value: 1}
		]
		let upgradeBox: UpgradeBox = {
			buyOptionBox: buyOptionBox,
			paymentInterval: stream(paymentIntervalItems[0])
		}

		let subscriptionControl = new SegmentControl(paymentIntervalItems, upgradeBox.paymentInterval).setSelectionChangedHandler(paymentIntervalItem => {
			if (paymentIntervalItem.value == 12) {
				this._yearlyPrice.getAsync().then(upgradePrice => buyOptionBox.setValue((proUpgrade ? upgradePrice.proPrice : upgradePrice.premiumPrice ) + " €")).then(() => m.redraw())
			} else {
				this._monthlyPrice.getAsync().then(upgradePrice => buyOptionBox.setValue(formatPrice((proUpgrade ? upgradePrice.proPrice : upgradePrice.premiumPrice), false) + " €")).then(() => m.redraw())
			}
			upgradeBox.paymentInterval(paymentIntervalItem)
		})
		buyOptionBox.setInjection(subscriptionControl)
		return upgradeBox
	}

	_getPrices(paymentInterval: number): Promise<UpgradePrices> {
		return Promise.join(
			worker.getPrice(BookingItemFeatureType.Users, 1, false, paymentInterval, AccountType.PREMIUM),
			worker.getPrice(BookingItemFeatureType.Alias, 20, false, paymentInterval, AccountType.PREMIUM),
			worker.getPrice(BookingItemFeatureType.Storage, 10, false, paymentInterval, AccountType.PREMIUM),
			worker.getPrice(BookingItemFeatureType.Branding, 1, false, paymentInterval, AccountType.PREMIUM),
			(userReturn, aliasReturn, storageReturn, brandingReturn) => {
				return {
					premiumPrice: Number(neverNull(userReturn.futurePriceNextPeriod).price),
					proPrice: Number(neverNull(userReturn.futurePriceNextPeriod).price) + Number(neverNull(aliasReturn.futurePriceNextPeriod).price) + Number(neverNull(storageReturn.futurePriceNextPeriod).price) + Number(neverNull(brandingReturn.futurePriceNextPeriod).price)
				}
			})
	}

	_lauchPaymentFlow(subscriptionOptions: SubscriptionOptions, accountingInfo: AccountingInfo) {
		openInvoiceDataDialog(subscriptionOptions, accountingInfo).then(invoiceData => {
			if (invoiceData) {
				openUpgradeConfirmDialog(subscriptionOptions, invoiceData).then(confirm => {
					if (confirm) {
						console.log("upgrade to premium")
					}
				})
			}
		})
		//openInvoiceDataDialog(subscriptionOptions)
	}


	_getOptions(featurePrefixes: Array<string>, type: string): Array<string> {
		return featurePrefixes.map(f => lang.get(f + type + "_msg"))
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

export function openUpgradeDialog(): void {
	load(CustomerTypeRef, neverNull(logins.getUserController().user.customer))
		.then(customer => load(CustomerInfoTypeRef, customer.customerInfo))
		.then(customerInfo => load(AccountingInfoTypeRef, customerInfo.accountingInfo))
		.then(accountingInfo => {
			new UpgradeAccountTypeDialog(accountingInfo).show()
		})
}

import m from "mithril"
// @flow
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
import {openInvoiceDataDialog} from "./InvoiceDataDialog"
import {BookingItemFeatureType, AccountType} from "../api/common/TutanotaConstants"
import {worker} from "../api/main/WorkerClient"
import {neverNull} from "../api/common/utils/Utils"
import {formatPrice} from "../misc/Formatter"
import {LazyLoaded} from "../api/common/utils/LazyLoaded"


assertMainOrNode()


type UpgradePrices = {
	premiumPrice:number,
	proPrice:number
}

type UpgradeBox = {
	buyOptionBox:BuyOptionBox;
	paymentInterval:stream<SegmentControlItem<number>>
}


export class UpgradeAccountTypeDialog {

	view: Function;
	dialog: Dialog;
	_premiumUpgradeBox: UpgradeBox;
	_proUpgradeBox: UpgradeBox;
	_businessUse: stream<SegmentControlItem<boolean>>
	_monthlyPrice: LazyLoaded<UpgradePrices>
	_yearlyPrice: LazyLoaded<UpgradePrices>

	/**
	 * The contact that should be update or the contact list that the new contact should be written to must be provided
	 * @param c An existing or new contact. If null a new contact is created.
	 * @param listId The list id of the new contact.
	 * @param newContactIdReceiver. Is called receiving the contact id as soon as the new contact was saved.
	 */
	constructor(accountingInfo: AccountingInfo) {

		let freeTypeBox = new BuyOptionBox(() => "Free", "choose_action",
			() => this._close(),
			this._getOptions("Free"), 230, 240)
		freeTypeBox.setValue("0 €")
		freeTypeBox.setHelpLabel(lang.get("upgradeLater_msg"))

		this._premiumUpgradeBox = this._createUpgradeBox(true)
		this._proUpgradeBox = this._createUpgradeBox(false)

		let privateBuyOptions = [freeTypeBox, this._premiumUpgradeBox.buyOptionBox, this._proUpgradeBox.buyOptionBox]
		let businessBuyOptions = [this._premiumUpgradeBox.buyOptionBox, this._proUpgradeBox.buyOptionBox]

		let businessUseItems = [
			{name: lang.get("privateUse_label"), value: false},
			{name: lang.get("businessUse_label"), value: true}
		]
		this._businessUse = stream(businessUseItems[0])
		let privateBusinesUseControl = new SegmentControl(businessUseItems, this._businessUse, true).setSelectionChangedHandler(businessUseItem => {
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
			this._premiumUpgradeBox.buyOptionBox.setValue(formatPrice(yearlyPrice.premiumPrice, false) + " €")
			this._proUpgradeBox.buyOptionBox.setValue(formatPrice(yearlyPrice.proPrice, false) + " €")

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
				help: "send_action"
			})
	}


	_createUpgradeBox(premium: boolean): UpgradeBox {
		let title = premium ? "Premium" : "Pro"
		let buyOptionBox = new BuyOptionBox(() => title, "buy_action",
			() => {
				this._close()
				this._lauchPaymentFlow({
					businessUse: this._businessUse().value,
					paymentInterval: premium ? this._premiumUpgradeBox.paymentInterval().value : this._proUpgradeBox.paymentInterval().value
				})
			},
			this._getOptions(title), 230, 240)

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

		let subscriptionControl = new SegmentControl(paymentIntervalItems, upgradeBox.paymentInterval, true).setSelectionChangedHandler(paymentIntervalItem => {
			if (paymentIntervalItem.value == 12) {
				this._yearlyPrice.getAsync().then(upgradePrice => buyOptionBox.setValue(formatPrice((premium ? upgradePrice.premiumPrice : upgradePrice.proPrice), false) + " €")).then(() => m.redraw())
			} else {
				this._monthlyPrice.getAsync().then(upgradePrice => buyOptionBox.setValue(formatPrice((premium ? upgradePrice.premiumPrice : upgradePrice.proPrice), false) + " €")).then(() => m.redraw())
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

	_lauchPaymentFlow(subscriptionOptions: SubscriptionOptions) {
		return openInvoiceDataDialog(subscriptionOptions)
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


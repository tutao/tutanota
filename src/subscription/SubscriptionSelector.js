//@flow
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {Dialog} from "../gui/base/Dialog"
import {lang} from "../misc/LanguageViewModel"
import {BuyOptionBox} from "./BuyOptionBox"
import type {SegmentControlItem} from "../gui/base/SegmentControl"
import {SegmentControl} from "../gui/base/SegmentControl"
import type {AccountTypeEnum} from "../api/common/TutanotaConstants"
import {BookingItemFeatureType, AccountType} from "../api/common/TutanotaConstants"
import {worker} from "../api/main/WorkerClient"
import {neverNull} from "../api/common/utils/Utils"
import {formatPrice} from "../misc/Formatter"
import {LazyLoaded} from "../api/common/utils/LazyLoaded"
import {getPriceFromPriceData} from "./PriceUtils"

type UpgradePrices = {
	premiumPrice:number,
	proPrice:number
}

type UpgradeBox = {
	buyOptionBox:BuyOptionBox;
	paymentInterval:stream<SegmentControlItem<number>>
}

export class SubscriptionSelector {
	_premiumUpgradeBox: UpgradeBox;
	_proUpgradeBox: UpgradeBox;
	_monthlyPrice: LazyLoaded<UpgradePrices>;
	_yearlyPrice: LazyLoaded<UpgradePrices>;
	view: Function;

	constructor(current: AccountTypeEnum, freeAction: clickHandler, premiumAction: clickHandler, proAction: clickHandler, business: stream<boolean>) {

		let freeTypeBox = new BuyOptionBox(() => "Free", "choose_action",
			freeAction,
			() => this._getOptions(["comparisonUsers", "comparisonStorage", "comparisonDomain", "comparisonSearch"], "Free"), 230, 240)
		freeTypeBox.setValue("0 €")
		freeTypeBox.setHelpLabel(lang.get("upgradeLater_msg"))

		//"comparisonAlias", ""comparisonInboxRules"", "comparisonDomain", "comparisonLogin"
		this._premiumUpgradeBox = this._createUpgradeBox(false, premiumAction, () => [this._premiumUpgradeBox.paymentInterval().value == 1 ? "comparisonUsersMonthlyPayment" : "comparisonUsers", "comparisonStorage", "comparisonDomain", "comparisonSearch", "comparisonAlias", "comparisonInboxRules", "comparisonSupport"])
		this._proUpgradeBox = this._createUpgradeBox(true, proAction, () => [this._proUpgradeBox.paymentInterval().value == 1 ? "comparisonUsersMonthlyPayment" : "comparisonUsers", "comparisonStorage", "comparisonDomain", "comparisonSearch", "comparisonAlias", "comparisonInboxRules", "comparisonSupport", "comparisonLogin", "comparisonTheme", "comparisonContactForm"])

		this._yearlyPrice = new LazyLoaded(() => this._getPrices(current, 12), null)
		this._monthlyPrice = new LazyLoaded(() => {
			Dialog.error("twoMonthsForFreeYearly_msg")
			return this._getPrices(current, 1)
		}, null)

		// initial help label and price
		this._yearlyPrice.getAsync().then(yearlyPrice => {
			this._premiumUpgradeBox.buyOptionBox.setValue(yearlyPrice.premiumPrice + " €")
			this._proUpgradeBox.buyOptionBox.setValue(yearlyPrice.proPrice + " €")

			const helpLabel = lang.get(business() ? "priceExcludesTaxes_msg" : "priceIncludesTaxes_msg")
			this._premiumUpgradeBox.buyOptionBox.setHelpLabel(helpLabel)
			this._proUpgradeBox.buyOptionBox.setHelpLabel(helpLabel)
			m.redraw()
		})
		business.map(business => {
			const helpLabel = lang.get(business ? "priceExcludesTaxes_msg" : "priceIncludesTaxes_msg")
			this._premiumUpgradeBox.buyOptionBox.setHelpLabel(helpLabel)
			this._proUpgradeBox.buyOptionBox.setHelpLabel(helpLabel)
		})

		this.view = () => m(".flex-center.flex-wrap", [
			!business() ? m(freeTypeBox) : null,
			m(this._premiumUpgradeBox.buyOptionBox),
			m(this._proUpgradeBox.buyOptionBox)
		])
	}


	_createUpgradeBox(proUpgrade: boolean, action: clickHandler, featurePrefixes: lazy<string[]>, fixedPaymentInterval: ?number): UpgradeBox {
		let title = proUpgrade ? "Pro" : "Premium"
		let buyOptionBox = new BuyOptionBox(() => title, "choose_action",
			action,
			() => {
				return this._getOptions(featurePrefixes(), title)
			}, 230, 240)

		if (!proUpgrade) {
			buyOptionBox.selected = true
		}

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

	_getPrices(current: AccountTypeEnum, paymentInterval: number): Promise<UpgradePrices> {
		return Promise.join(
			worker.getPrice(BookingItemFeatureType.Users, current == AccountType.FREE ? 1 : 0, false, paymentInterval, AccountType.PREMIUM),
			worker.getPrice(BookingItemFeatureType.Alias, 20, false, paymentInterval, AccountType.PREMIUM),
			worker.getPrice(BookingItemFeatureType.Storage, 10, false, paymentInterval, AccountType.PREMIUM),
			worker.getPrice(BookingItemFeatureType.Branding, 1, false, paymentInterval, AccountType.PREMIUM),
			(userReturn, aliasReturn, storageReturn, brandingReturn) => {
				return {
					premiumPrice: Number(getPriceFromPriceData(userReturn.futurePriceNextPeriod, BookingItemFeatureType.Users)),
					proPrice: Number(getPriceFromPriceData(userReturn.futurePriceNextPeriod, BookingItemFeatureType.Users)) + Number(getPriceFromPriceData(aliasReturn.futurePriceNextPeriod, BookingItemFeatureType.Alias)) + Number(getPriceFromPriceData(storageReturn.futurePriceNextPeriod, BookingItemFeatureType.Storage)) + Number(neverNull(getPriceFromPriceData(brandingReturn.futurePriceNextPeriod, BookingItemFeatureType.Branding)))
				}
			})
	}

	_getOptions(featurePrefixes: Array<string>, type: string): Array<string> {
		return featurePrefixes.map(f => lang.get(f + type + "_msg"))
	}
}
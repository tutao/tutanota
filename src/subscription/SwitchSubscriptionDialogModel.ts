import {
	getIncludedAliases,
	getIncludedStorageCapacity,
	getNbrOfContactForms,
	getNbrOfUsers,
	getTotalAliases,
	getTotalStorageCapacity,
	isBusinessFeatureActive,
	isSharingActive,
	isWhitelabelActive,
} from "./SubscriptionUtils"
import {BookingItemFeatureType} from "../api/common/TutanotaConstants"
import {neverNull, promiseMap} from "@tutao/tutanota-utils"
import type {AccountingInfo, Booking, Customer, CustomerInfo, PlanPrices, PriceServiceReturn} from "../api/entities/sys/TypeRefs.js"
import {createPlanPrices} from "../api/entities/sys/TypeRefs.js"
import {getPriceFromPriceData, getPriceItem, isSubscriptionDowngrade, PriceAndConfigProvider} from "./PriceUtils"
import type {BookingFacade} from "../api/worker/facades/BookingFacade"
import {SubscriptionConfig, SubscriptionPlanPrices, SubscriptionType} from "./SubscriptionDataProvider"

type PlanPriceCalc = {
	monthlyPrice: number
	additionalUserPriceMonthly: number
	includedAliases: number
	includedStorage: number
	readonly targetIsDowngrade: boolean
	readonly targetSubscription: SubscriptionType
	readonly targetSubscriptionConfig: SubscriptionConfig
	readonly paymentIntervalFactor: number
}
export type CurrentSubscriptionInfo = {
	businessUse: boolean
	nbrOfUsers: number
	subscriptionType: SubscriptionType
	paymentInterval: number
	currentTotalStorage: number
	currentTotalAliases: number
	orderedContactForms: number
	includedStorage: number
	includedAliases: number
	currentlyWhitelabelOrdered: boolean
	currentlySharingOrdered: boolean
	currentlyBusinessOrdered: boolean
}
export type UpgradeDowngradePrices = {
	addUserPrice: PriceServiceReturn
	upgrade20AliasesPrice: PriceServiceReturn
	downgrade5AliasesPrice: PriceServiceReturn
	upgrade10GbStoragePrice: PriceServiceReturn
	downgrade1GbStoragePrice: PriceServiceReturn
	upgradeSharingPrice: PriceServiceReturn
	downgradeSharingPrice: PriceServiceReturn
	upgradeBusinessPrice: PriceServiceReturn
	downgradeBusinessPrice: PriceServiceReturn
	upgradeWhitelabelPrice: PriceServiceReturn
	downgradeWhitelabelPrice: PriceServiceReturn
	contactFormPrice: PriceServiceReturn
}

export class SwitchSubscriptionDialogModel {
	currentSubscriptionInfo: CurrentSubscriptionInfo

	constructor(
		private readonly bookingFacade: BookingFacade,
		private readonly customer: Customer,
		private readonly customerInfo: CustomerInfo,
		private readonly accountingInfo: AccountingInfo,
		private readonly lastBooking: Booking,
		private readonly priceAndConfigProvider: PriceAndConfigProvider
	) {
		this.currentSubscriptionInfo = this._initCurrentSubscriptionInfo()
	}

	_initCurrentSubscriptionInfo(): CurrentSubscriptionInfo {
		return {
			businessUse: !!this.customer.businessUse,
			subscriptionType: this.priceAndConfigProvider.getSubscriptionType(this.lastBooking, this.customer, this.customerInfo),
			nbrOfUsers: getNbrOfUsers(this.lastBooking),
			paymentInterval: Number(this.accountingInfo.paymentInterval),
			currentTotalStorage: getTotalStorageCapacity(this.customer, this.customerInfo, this.lastBooking),
			currentTotalAliases: getTotalAliases(this.customer, this.customerInfo, this.lastBooking),
			includedStorage: getIncludedStorageCapacity(this.customerInfo),
			includedAliases: getIncludedAliases(this.customerInfo),
			currentlyWhitelabelOrdered: isWhitelabelActive(this.lastBooking),
			currentlySharingOrdered: isSharingActive(this.lastBooking),
			currentlyBusinessOrdered: isBusinessFeatureActive(this.lastBooking),
			orderedContactForms: getNbrOfContactForms(this.lastBooking),
		}
	}

	async loadSwitchSubscriptionPrices(): Promise<SubscriptionPlanPrices> {
		const upgradeDowngradePrices = await this.fetchUpgradeDowngradePrices()
		return {
			Premium: this.getPrice(this.currentSubscriptionInfo, upgradeDowngradePrices, SubscriptionType.Premium, this.priceAndConfigProvider.getSubscriptionConfig(SubscriptionType.Premium)),
			PremiumBusiness: this.getPrice(this.currentSubscriptionInfo, upgradeDowngradePrices, SubscriptionType.PremiumBusiness, this.priceAndConfigProvider.getSubscriptionConfig(SubscriptionType.PremiumBusiness)),
			Teams: this.getPrice(this.currentSubscriptionInfo, upgradeDowngradePrices, SubscriptionType.Teams, this.priceAndConfigProvider.getSubscriptionConfig(SubscriptionType.Teams)),
			TeamsBusiness: this.getPrice(this.currentSubscriptionInfo, upgradeDowngradePrices, SubscriptionType.TeamsBusiness, this.priceAndConfigProvider.getSubscriptionConfig(SubscriptionType.TeamsBusiness)),
			Pro: this.getPrice(this.currentSubscriptionInfo, upgradeDowngradePrices, SubscriptionType.Pro, this.priceAndConfigProvider.getSubscriptionConfig(SubscriptionType.Pro)),
		}
	}

	getPrice(
		currentSubscription: CurrentSubscriptionInfo,
		prices: UpgradeDowngradePrices,
		targetSubscription: SubscriptionType,
		targetSubscriptionConfig: SubscriptionConfig
	): PlanPrices {
		let paymentIntervalFactor = neverNull(prices.addUserPrice.futurePriceNextPeriod).paymentInterval === "12" ? 1 / 10 : 1
		let monthlyPrice = Number(neverNull(prices.addUserPrice.currentPriceNextPeriod).price)
		let contactFormPrice = getMonthlySinglePrice(prices.contactFormPrice, BookingItemFeatureType.ContactForm, paymentIntervalFactor)
		let singleUserPriceMonthly = getMonthlySinglePrice(prices.addUserPrice, BookingItemFeatureType.Users, paymentIntervalFactor)
		let currentSharingPerUserMonthly = getMonthlySinglePrice(prices.addUserPrice, BookingItemFeatureType.Sharing, paymentIntervalFactor)
		let currentBusinessPerUserMonthly = getMonthlySinglePrice(prices.addUserPrice, BookingItemFeatureType.Business, paymentIntervalFactor)
		let currentWhitelabelPerUserMonthly = getMonthlySinglePrice(prices.addUserPrice, BookingItemFeatureType.Whitelabel, paymentIntervalFactor)
		let planPrices = createPlanPrices()
		planPrices.contactFormPriceMonthly = String(contactFormPrice)
		planPrices.firstYearDiscount = "0"

		if (currentSubscription.subscriptionType === targetSubscription) {
			// show the price we are currently paying
			monthlyPrice = Number((monthlyPrice * paymentIntervalFactor).toFixed(2))
			planPrices.includedAliases = String(currentSubscription.currentTotalAliases)
			planPrices.includedStorage = String(currentSubscription.currentTotalStorage)
			planPrices.monthlyPrice = String(monthlyPrice)
			planPrices.monthlyReferencePrice = String(monthlyPrice)
			// Ugly rounding to floor
			planPrices.additionalUserPriceMonthly = String(
				Number((singleUserPriceMonthly + currentSharingPerUserMonthly + currentBusinessPerUserMonthly + currentWhitelabelPerUserMonthly).toFixed(2)),
			)
		} else {
			const planPriceCalc: PlanPriceCalc = {
				monthlyPrice: monthlyPrice,
				additionalUserPriceMonthly: singleUserPriceMonthly,
				includedAliases: 0,
				includedStorage: 0,
				targetIsDowngrade: isSubscriptionDowngrade(targetSubscription, currentSubscription.subscriptionType),
				targetSubscription: targetSubscription,
				targetSubscriptionConfig,
				paymentIntervalFactor: paymentIntervalFactor,
			}
			// upgrade: show the current price plus all features not ordered yet
			// downgrade: show the current prices minus all features not in the target subscription (keep users as is)
			// singleUserPriceMonthly for feature is 0 for downgrade. therefore only added for upgrade or the current price (might be 0 as well)
			calcWhitelabelFeature(
				planPriceCalc,
				currentSubscription.currentlyWhitelabelOrdered,
				currentWhitelabelPerUserMonthly,
				prices.upgradeWhitelabelPrice,
				prices.downgradeWhitelabelPrice,
			)
			calcSharingFeature(
				planPriceCalc,
				currentSubscription.currentlySharingOrdered,
				currentSharingPerUserMonthly,
				prices.upgradeSharingPrice,
				prices.downgradeSharingPrice,
			)
			calcBusinessFeature(
				planPriceCalc,
				currentSubscription.currentlyBusinessOrdered,
				currentBusinessPerUserMonthly,
				prices.upgradeBusinessPrice,
				prices.downgradeBusinessPrice,
			)
			calcStorage(
				planPriceCalc,
				currentSubscription.currentTotalStorage,
				currentSubscription.includedStorage,
				prices.upgrade10GbStoragePrice,
				prices.downgrade1GbStoragePrice,
			)
			calcAliases(
				planPriceCalc,
				currentSubscription.currentTotalAliases,
				currentSubscription.includedAliases,
				prices.upgrade20AliasesPrice,
				prices.downgrade5AliasesPrice,
			)
			planPrices.includedAliases = String(planPriceCalc.includedAliases)
			planPrices.includedStorage = String(planPriceCalc.includedStorage)
			// TODO string number conversion needed for floor in test cases and string length -> fix floating point number calcs
			planPrices.monthlyPrice = String(Number((planPriceCalc.monthlyPrice * paymentIntervalFactor).toFixed(2)))
			planPrices.monthlyReferencePrice = planPrices.monthlyPrice
			planPrices.additionalUserPriceMonthly = String(Number(planPriceCalc.additionalUserPriceMonthly.toFixed(2)))
		}

		return planPrices
	}

	private async fetchUpgradeDowngradePrices(): Promise<UpgradeDowngradePrices> {
		const getPriceFeatureList = [
			// the order is important!
			{
				type: BookingItemFeatureType.Users,
				count: 1,
			},
			{
				type: BookingItemFeatureType.Alias,
				count: 20,
			},
			{
				type: BookingItemFeatureType.Alias,
				count: 0,
			},
			{
				type: BookingItemFeatureType.Storage,
				count: 10,
			},
			{
				type: BookingItemFeatureType.Storage,
				count: 0,
			},
			{
				type: BookingItemFeatureType.Sharing,
				count: 1,
			},
			{
				type: BookingItemFeatureType.Sharing,
				count: 0,
			},
			{
				type: BookingItemFeatureType.Business,
				count: 1,
			},
			{
				type: BookingItemFeatureType.Business,
				count: 0,
			},
			{
				type: BookingItemFeatureType.Whitelabel,
				count: 1,
			},
			{
				type: BookingItemFeatureType.Whitelabel,
				count: 0,
			},
			{
				type: BookingItemFeatureType.ContactForm,
				count: 1,
			},
		]
		return promiseMap(getPriceFeatureList, getPriceFeature => this.bookingFacade.getPrice(getPriceFeature.type, getPriceFeature.count, false)).then(
			([
				 addUserPrice,
				 upgrade20AliasesPrice,
				 downgrade5AliasesPrice,
				 upgrade10GbStoragePrice,
				 downgrade1GbStoragePrice,
				 upgradeSharingPrice,
				 downgradeSharingPrice,
				 upgradeBusinessPrice,
				 downgradeBusinessPrice,
				 upgradeWhitelabelPrice,
				 downgradeWhitelabelPrice,
				 contactFormPrice,
			 ]) => {
				return {
					addUserPrice: addUserPrice,
					upgrade20AliasesPrice: upgrade20AliasesPrice,
					downgrade5AliasesPrice: downgrade5AliasesPrice,
					upgrade10GbStoragePrice: upgrade10GbStoragePrice,
					downgrade1GbStoragePrice: downgrade1GbStoragePrice,
					upgradeSharingPrice: upgradeSharingPrice,
					downgradeSharingPrice: downgradeSharingPrice,
					upgradeBusinessPrice: upgradeBusinessPrice,
					downgradeBusinessPrice: downgradeBusinessPrice,
					upgradeWhitelabelPrice: upgradeWhitelabelPrice,
					downgradeWhitelabelPrice: downgradeWhitelabelPrice,
					contactFormPrice: contactFormPrice,
				}
			},
		)
	}
}

export function isUpgradeAliasesNeeded(targetSubscriptionConfig: SubscriptionConfig, currentNbrOfAliases: number): boolean {
	return currentNbrOfAliases < targetSubscriptionConfig.nbrOfAliases
}

export function isDowngradeAliasesNeeded(targetSubscriptionConfig: SubscriptionConfig, currentNbrOfAliases: number, includedAliases: number): boolean {
	// only order the target aliases package if it is smaller than the actual number of current aliases and if we have currently ordered more than the included aliases
	return currentNbrOfAliases > targetSubscriptionConfig.nbrOfAliases && currentNbrOfAliases > includedAliases
}

export function isUpgradeStorageNeeded(targetSubscriptionConfig: SubscriptionConfig, currentAmountOfStorage: number): boolean {
	return currentAmountOfStorage < targetSubscriptionConfig.storageGb
}

export function isDowngradeStorageNeeded(targetSubscriptionConfig: SubscriptionConfig, currentAmountOfStorage: number, includedStorage: number): boolean {
	return currentAmountOfStorage > targetSubscriptionConfig.storageGb && currentAmountOfStorage > includedStorage
}

export function isUpgradeSharingNeeded(targetSubscriptionConfig: SubscriptionConfig, currentlySharingOrdered: boolean): boolean {
	return !currentlySharingOrdered && targetSubscriptionConfig.sharing
}

export function isDowngradeSharingNeeded(targetSubscriptionConfig: SubscriptionConfig, currentlySharingOrdered: boolean): boolean {
	return currentlySharingOrdered && !targetSubscriptionConfig.sharing
}

export function isUpgradeBusinessNeeded(targetSubscriptionConfig: SubscriptionConfig, currentlyBusinessOrdered: boolean): boolean {
	return !currentlyBusinessOrdered && targetSubscriptionConfig.business
}

export function isDowngradeBusinessNeeded(targetSubscriptionConfig: SubscriptionConfig, currentlyBusinessOrdered: boolean): boolean {
	return currentlyBusinessOrdered && !targetSubscriptionConfig.business
}

export function isUpgradeWhitelabelNeeded(targetSubscriptionConfig: SubscriptionConfig, currentlyWhitelabelOrdered: boolean): boolean {
	return !currentlyWhitelabelOrdered && targetSubscriptionConfig.whitelabel
}

export function isDowngradeWhitelabelNeeded(targetSubscriptionConfig: SubscriptionConfig, currentlyWhitelabelOrdered: boolean): boolean {
	return currentlyWhitelabelOrdered && !targetSubscriptionConfig.whitelabel
}

function calcWhitelabelFeature(
	planPrices: PlanPriceCalc,
	currentlyWhitelabelOrdered: boolean,
	currentWhitelabelPerUserMonthly: number,
	upgradeWhitelabelPrice: PriceServiceReturn,
	downgradeWhitelabelPrice: PriceServiceReturn,
): void {
	const {targetSubscriptionConfig, targetIsDowngrade, paymentIntervalFactor} = planPrices

	if (isUpgradeWhitelabelNeeded(targetSubscriptionConfig, currentlyWhitelabelOrdered)) {
		planPrices.monthlyPrice +=
			Number(neverNull(upgradeWhitelabelPrice.futurePriceNextPeriod).price) - Number(neverNull(upgradeWhitelabelPrice.currentPriceNextPeriod).price)
		planPrices.additionalUserPriceMonthly += getMonthlySinglePrice(upgradeWhitelabelPrice, BookingItemFeatureType.Whitelabel, paymentIntervalFactor)
	} else if (targetIsDowngrade && isDowngradeWhitelabelNeeded(targetSubscriptionConfig, currentlyWhitelabelOrdered)) {
		planPrices.monthlyPrice +=
			Number(neverNull(downgradeWhitelabelPrice.futurePriceNextPeriod).price) - Number(neverNull(downgradeWhitelabelPrice.currentPriceNextPeriod).price)
	} else {
		planPrices.additionalUserPriceMonthly += currentWhitelabelPerUserMonthly
	}
}

function calcSharingFeature(
	planPrices: PlanPriceCalc,
	currentlySharingOrdered: boolean,
	currentSharingPerUserMonthly: number,
	upgradeSharingPrice: PriceServiceReturn,
	downgradeSharingPrice: PriceServiceReturn,
): void {
	const {targetSubscriptionConfig, targetIsDowngrade, paymentIntervalFactor} = planPrices

	if (isUpgradeSharingNeeded(targetSubscriptionConfig, currentlySharingOrdered)) {
		planPrices.monthlyPrice +=
			Number(neverNull(upgradeSharingPrice.futurePriceNextPeriod).price) - Number(neverNull(upgradeSharingPrice.currentPriceNextPeriod).price)
		planPrices.additionalUserPriceMonthly += getMonthlySinglePrice(upgradeSharingPrice, BookingItemFeatureType.Sharing, paymentIntervalFactor)
	} else if (targetIsDowngrade && isDowngradeSharingNeeded(targetSubscriptionConfig, currentlySharingOrdered)) {
		planPrices.monthlyPrice +=
			Number(neverNull(downgradeSharingPrice.futurePriceNextPeriod).price) - Number(neverNull(downgradeSharingPrice.currentPriceNextPeriod).price)
	} else {
		planPrices.additionalUserPriceMonthly += currentSharingPerUserMonthly
	}
}

function calcBusinessFeature(
	planPrices: PlanPriceCalc,
	currentlyBusinessOrdered: boolean,
	currentBusinessPerUserMonthly: number,
	upgradeBusinessPrice: PriceServiceReturn,
	downgradeBusinessPrice: PriceServiceReturn,
): void {
	const {targetSubscriptionConfig, targetIsDowngrade, paymentIntervalFactor} = planPrices

	if (isUpgradeBusinessNeeded(targetSubscriptionConfig, currentlyBusinessOrdered)) {
		planPrices.monthlyPrice +=
			Number(neverNull(upgradeBusinessPrice.futurePriceNextPeriod).price) - Number(neverNull(upgradeBusinessPrice.currentPriceNextPeriod).price)
		planPrices.additionalUserPriceMonthly += getMonthlySinglePrice(upgradeBusinessPrice, BookingItemFeatureType.Business, paymentIntervalFactor)
	} else if (targetIsDowngrade && isDowngradeBusinessNeeded(targetSubscriptionConfig, currentlyBusinessOrdered)) {
		planPrices.monthlyPrice +=
			Number(neverNull(downgradeBusinessPrice.futurePriceNextPeriod).price) - Number(neverNull(downgradeBusinessPrice.currentPriceNextPeriod).price)
	} else {
		planPrices.additionalUserPriceMonthly += currentBusinessPerUserMonthly
	}
}

function calcStorage(
	planPrices: PlanPriceCalc,
	currentTotalStorage: number,
	includedStorage: number,
	upgrade10GbStoragePrice: PriceServiceReturn,
	downgrade1GbStoragePrice: PriceServiceReturn,
): void {
	const {targetIsDowngrade, targetSubscriptionConfig} = planPrices

	if (isUpgradeStorageNeeded(targetSubscriptionConfig, currentTotalStorage)) {
		planPrices.monthlyPrice +=
			Number(neverNull(upgrade10GbStoragePrice.futurePriceNextPeriod).price) - Number(neverNull(upgrade10GbStoragePrice.currentPriceNextPeriod).price)
	} else if (targetIsDowngrade && isDowngradeStorageNeeded(targetSubscriptionConfig, currentTotalStorage, includedStorage)) {
		planPrices.monthlyPrice +=
			Number(neverNull(downgrade1GbStoragePrice.futurePriceNextPeriod).price) - Number(neverNull(downgrade1GbStoragePrice.currentPriceNextPeriod).price)
	}

	const targetAmountStorage = targetSubscriptionConfig.storageGb
	planPrices.includedStorage = !targetIsDowngrade ? Math.max(currentTotalStorage, targetAmountStorage) : targetAmountStorage
}

function calcAliases(
	planPrices: PlanPriceCalc,
	currentTotalAliases: number,
	includedAliases: number,
	upgrade20AliasesPrice: PriceServiceReturn,
	downgrade5AliasesPrice: PriceServiceReturn,
): void {
	const {targetSubscriptionConfig, targetIsDowngrade} = planPrices

	if (isUpgradeAliasesNeeded(targetSubscriptionConfig, currentTotalAliases)) {
		planPrices.monthlyPrice +=
			Number(neverNull(upgrade20AliasesPrice.futurePriceNextPeriod).price) - Number(neverNull(upgrade20AliasesPrice.currentPriceNextPeriod).price)
	} else if (targetIsDowngrade && isDowngradeAliasesNeeded(targetSubscriptionConfig, currentTotalAliases, includedAliases)) {
		planPrices.monthlyPrice +=
			Number(neverNull(downgrade5AliasesPrice.futurePriceNextPeriod).price) - Number(neverNull(downgrade5AliasesPrice.currentPriceNextPeriod).price)
	}

	const targetNbrAliases = targetSubscriptionConfig.nbrOfAliases
	planPrices.includedAliases = !targetIsDowngrade ? Math.max(currentTotalAliases, targetNbrAliases) : targetNbrAliases
}

function getMonthlySinglePrice(priceData: PriceServiceReturn, featureType: NumberString, additionalFactor: number): number {
	let futurePrice = getPriceFromPriceData(priceData.futurePriceNextPeriod, featureType)
	const item = getPriceItem(priceData.futurePriceNextPeriod, featureType)

	if (item && item.singleType) {
		futurePrice /= Number(item.count)
		return Number((futurePrice * additionalFactor).toFixed(2))
	} else {
		return 0 // total prices do not change
	}
}
//@flow

import type {SubscriptionPlanPrices, SubscriptionTypeEnum} from "./SubscriptionUtils"
import {
	getIncludedAliases,
	getIncludedStorageCapacity,
	getNbrOfContactForms,
	getNbrOfUsers,
	getSubscriptionType,
	getTotalAliases,
	getTotalStorageCapacity,
	isBusinessFeatureActive,
	isDowngrade,
	isSharingActive,
	isWhitelabelActive,
	subscriptions,
	SubscriptionType
} from "./SubscriptionUtils"
import {BookingItemFeatureType} from "../api/common/TutanotaConstants"
import {neverNull} from "@tutao/tutanota-utils"
import type {PriceServiceReturn} from "../api/entities/sys/PriceServiceReturn"
import type {PlanPrices} from "../api/entities/sys/PlanPrices"
import {createPlanPrices} from "../api/entities/sys/PlanPrices"
import {getPriceFromPriceData, getPriceItem} from "./PriceUtils"
import type {AccountingInfo} from "../api/entities/sys/AccountingInfo"
import type {Customer} from "../api/entities/sys/Customer"
import type {CustomerInfo} from "../api/entities/sys/CustomerInfo"
import type {Booking} from "../api/entities/sys/Booking"
import {promiseMap} from "@tutao/tutanota-utils"
import type {BookingFacade} from "../api/worker/facades/BookingFacade"


type PlanPriceCalc = {
	monthlyPrice: number,
	additionalUserPriceMonthly: number,
	includedAliases: number,
	includedStorage: number,
	+targetIsDowngrade: boolean,
	+targetSubscription: SubscriptionTypeEnum,
	+paymentIntervalFactor: number
}

export type CurrentSubscriptionInfo = {|
	businessUse: boolean,
	nbrOfUsers: number,
	subscriptionType: SubscriptionTypeEnum,
	paymentInterval: number,
	currentTotalStorage: number,
	currentTotalAliases: number,
	orderedContactForms: number,
	includedStorage: number,
	includedAliases: number,
	currentlyWhitelabelOrdered: boolean,
	currentlySharingOrdered: boolean,
	currentlyBusinessOrdered: boolean
|}


type UpgradeDowngradePrices = {|
	addUserPrice: PriceServiceReturn,
	upgrade20AliasesPrice: PriceServiceReturn,
	downgrade5AliasesPrice: PriceServiceReturn,
	upgrade10GbStoragePrice: PriceServiceReturn,
	downgrade1GbStoragePrice: PriceServiceReturn,
	upgradeSharingPrice: PriceServiceReturn,
	downgradeSharingPrice: PriceServiceReturn,
	upgradeBusinessPrice: PriceServiceReturn,
	downgradeBusinessPrice: PriceServiceReturn,
	upgradeWhitelabelPrice: PriceServiceReturn,
	downgradeWhitelabelPrice: PriceServiceReturn,
	contactFormPrice: PriceServiceReturn,
|}


export class SwitchSubscriptionDialogModel {
	+_bookingFacade: BookingFacade;
	_customer: Customer
	_customerInfo: CustomerInfo
	_accountingInfo: AccountingInfo
	_lastBooking: Booking
	currentSubscriptionInfo: CurrentSubscriptionInfo

	constructor(bookingFacade: BookingFacade, customer: Customer, customerInfo: CustomerInfo, accountingInfo: AccountingInfo, lastBooking: Booking) {
		this._bookingFacade = bookingFacade
		this._customer = customer
		this._customerInfo = customerInfo
		this._accountingInfo = accountingInfo
		this._lastBooking = lastBooking
		this.currentSubscriptionInfo = this._initCurrentSubscriptionInfo()
	}

	_initCurrentSubscriptionInfo(): CurrentSubscriptionInfo {
		return {
			businessUse: !!this._customer.businessUse,
			subscriptionType: getSubscriptionType(this._lastBooking, this._customer, this._customerInfo),
			nbrOfUsers: getNbrOfUsers(this._lastBooking),
			paymentInterval: Number(this._accountingInfo.paymentInterval),
			currentTotalStorage: getTotalStorageCapacity(this._customer, this._customerInfo, this._lastBooking),
			currentTotalAliases: getTotalAliases(this._customer, this._customerInfo, this._lastBooking),
			includedStorage: getIncludedStorageCapacity(this._customerInfo),
			includedAliases: getIncludedAliases(this._customerInfo),
			currentlyWhitelabelOrdered: isWhitelabelActive(this._lastBooking),
			currentlySharingOrdered: isSharingActive(this._lastBooking),
			currentlyBusinessOrdered: isBusinessFeatureActive(this._lastBooking),
			orderedContactForms: getNbrOfContactForms(this._lastBooking)
		}
	}

	_loadUpgradeDowngradePrices(): Promise<UpgradeDowngradePrices> {
		const getPriceFeatureList = [ // the order is important!
			{
				type: BookingItemFeatureType.Users,
				count: 1
			},
			{
				type: BookingItemFeatureType.Alias,
				count: 20
			},
			{
				type: BookingItemFeatureType.Alias,
				count: 0
			},
			{
				type: BookingItemFeatureType.Storage,
				count: 10
			},
			{
				type: BookingItemFeatureType.Storage,
				count: 0
			},
			{
				type: BookingItemFeatureType.Sharing,
				count: 1
			},
			{
				type: BookingItemFeatureType.Sharing,
				count: 0
			},
			{
				type: BookingItemFeatureType.Business,
				count: 1
			},
			{
				type: BookingItemFeatureType.Business,
				count: 0
			},
			{
				type: BookingItemFeatureType.Whitelabel,
				count: 1
			},
			{
				type: BookingItemFeatureType.Whitelabel,
				count: 0
			},
			{
				type: BookingItemFeatureType.ContactForm,
				count: 1
			},
		]
		return promiseMap(getPriceFeatureList, getPriceFeature => this._bookingFacade.getPrice(getPriceFeature.type, getPriceFeature.count, false))
			.then(([addUserPrice, upgrade20AliasesPrice, downgrade5AliasesPrice, upgrade10GbStoragePrice, downgrade1GbStoragePrice, upgradeSharingPrice, downgradeSharingPrice, upgradeBusinessPrice, downgradeBusinessPrice, upgradeWhitelabelPrice, downgradeWhitelabelPrice, contactFormPrice]) => {
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
			})
	}

	loadSwitchSubscriptionPrices(): Promise<SubscriptionPlanPrices> {
		return this._loadUpgradeDowngradePrices().then(upgradeDowngradePrices => {
			return {
				Premium: this.getPrice(this.currentSubscriptionInfo, upgradeDowngradePrices, SubscriptionType.Premium),
				PremiumBusiness: this.getPrice(this.currentSubscriptionInfo, upgradeDowngradePrices, SubscriptionType.PremiumBusiness),
				Teams: this.getPrice(this.currentSubscriptionInfo, upgradeDowngradePrices, SubscriptionType.Teams),
				TeamsBusiness: this.getPrice(this.currentSubscriptionInfo, upgradeDowngradePrices, SubscriptionType.TeamsBusiness),
				Pro: this.getPrice(this.currentSubscriptionInfo, upgradeDowngradePrices, SubscriptionType.Pro)
			}
		})
	}

	getPrice(currentSubscription: CurrentSubscriptionInfo, prices: UpgradeDowngradePrices, targetSubscription: SubscriptionTypeEnum): PlanPrices {
		let paymentIntervalFactor = neverNull(prices.addUserPrice.futurePriceNextPeriod).paymentInterval === "12"
			? 1 / 10
			: 1

		let monthlyPrice = Number(neverNull(prices.addUserPrice.currentPriceNextPeriod).price)
		let contactFormPrice = getMonthlySinglePrice(prices.contactFormPrice, BookingItemFeatureType.ContactForm, paymentIntervalFactor)
		let singleUserPriceMonthly = getMonthlySinglePrice(prices.addUserPrice, BookingItemFeatureType.Users, paymentIntervalFactor)
		let currentSharingPerUserMonthly = getMonthlySinglePrice(prices.addUserPrice, BookingItemFeatureType.Sharing, paymentIntervalFactor)
		let currentBusinessPerUserMonthly = getMonthlySinglePrice(prices.addUserPrice, BookingItemFeatureType.Business, paymentIntervalFactor)
		let currentWhitelabelPerUserMonthly = getMonthlySinglePrice(prices.addUserPrice, BookingItemFeatureType.Whitelabel, paymentIntervalFactor)

		let planPrices = createPlanPrices()
		planPrices.contactFormPriceMonthly = String(contactFormPrice)
		planPrices.firstYearDiscount = "0"
		if (currentSubscription === targetSubscription) {
			// show the price we are currently paying
			monthlyPrice = Number((monthlyPrice * paymentIntervalFactor).toFixed(2))
			planPrices.includedAliases = String(currentSubscription.currentTotalAliases)
			planPrices.includedStorage = String(currentSubscription.currentTotalStorage)
			planPrices.monthlyPrice = String(monthlyPrice)
			planPrices.monthlyReferencePrice = String(monthlyPrice)
			planPrices.additionalUserPriceMonthly = String(singleUserPriceMonthly + currentSharingPerUserMonthly
				+ currentBusinessPerUserMonthly
				+ currentWhitelabelPerUserMonthly)
		} else {
			const planPriceCalc: PlanPriceCalc = {
				monthlyPrice: monthlyPrice,
				additionalUserPriceMonthly: singleUserPriceMonthly,
				includedAliases: 0,
				includedStorage: 0,
				targetIsDowngrade: isDowngrade(targetSubscription, currentSubscription.subscriptionType),
				targetSubscription: targetSubscription,
				paymentIntervalFactor: paymentIntervalFactor
			}
			// upgrade: show the current price plus all features not ordered yet
			// downgrade: show the current prices minus all features not in the target subscription (keep users as is)
			// singleUserPriceMonthly for feature is 0 for downgrade. therefore only added for upgrade or the current price (might be 0 as well)
			calcWhitelabelFeature(planPriceCalc, currentSubscription.currentlyWhitelabelOrdered, currentWhitelabelPerUserMonthly, prices.upgradeWhitelabelPrice, prices.downgradeWhitelabelPrice)
			calcSharingFeature(planPriceCalc, currentSubscription.currentlySharingOrdered, currentSharingPerUserMonthly, prices.upgradeSharingPrice, prices.downgradeSharingPrice)
			calcBusinessFeature(planPriceCalc, currentSubscription.currentlyBusinessOrdered, currentBusinessPerUserMonthly, prices.upgradeBusinessPrice, prices.downgradeBusinessPrice)
			calcStorage(planPriceCalc, currentSubscription.currentTotalStorage, currentSubscription.includedStorage, prices.upgrade10GbStoragePrice, prices.downgrade1GbStoragePrice)
			calcAliases(planPriceCalc, currentSubscription.currentTotalAliases, currentSubscription.includedAliases, prices.upgrade20AliasesPrice, prices.downgrade5AliasesPrice)
			planPrices.includedAliases = String(planPriceCalc.includedAliases)
			planPrices.includedStorage = String(planPriceCalc.includedStorage)
			// TODO string number conversion needed for floor in test cases and string length -> fix floating point number calcs
			planPrices.monthlyPrice = String(Number((planPriceCalc.monthlyPrice * paymentIntervalFactor).toFixed(2)))
			planPrices.monthlyReferencePrice = planPrices.monthlyPrice
			planPrices.additionalUserPriceMonthly = String(Number(planPriceCalc.additionalUserPriceMonthly.toFixed(2)))
		}
		return planPrices
	}

	isBusinessUse(): boolean {
		return !!this._customer.businessUse
	}
}

export function isUpgradeAliasesNeeded(targetSubscription: SubscriptionTypeEnum, currentNbrOfAliases: number): boolean {
	return currentNbrOfAliases < subscriptions[targetSubscription].nbrOfAliases
}

export function isDowngradeAliasesNeeded(targetSubscription: SubscriptionTypeEnum, currentNbrOfAliases: number, includedAliases: number): boolean {
	// only order the target aliases package if it is smaller than the actual number of current aliases and if we have currently ordered more than the included aliases
	return currentNbrOfAliases > subscriptions[targetSubscription].nbrOfAliases && currentNbrOfAliases > includedAliases
}

export function isUpgradeStorageNeeded(targetSubscription: SubscriptionTypeEnum, currentAmountOfStorage: number): boolean {
	return currentAmountOfStorage < subscriptions[targetSubscription].storageGb
}

export function isDowngradeStorageNeeded(targetSubscription: SubscriptionTypeEnum, currentAmountOfStorage: number, includedStorage: number): boolean {
	return currentAmountOfStorage > subscriptions[targetSubscription].storageGb && currentAmountOfStorage > includedStorage
}

export function isUpgradeSharingNeeded(targetSubscription: SubscriptionTypeEnum, currentlySharingOrdered: boolean): boolean {
	return !currentlySharingOrdered && subscriptions[targetSubscription].sharing
}

export function isDowngradeSharingNeeded(targetSubscription: SubscriptionTypeEnum, currentlySharingOrdered: boolean): boolean {
	return currentlySharingOrdered && !subscriptions[targetSubscription].sharing
}

export function isUpgradeBusinessNeeded(targetSubscription: SubscriptionTypeEnum, currentlyBusinessOrdered: boolean): boolean {
	return !currentlyBusinessOrdered && subscriptions[targetSubscription].business
}

export function isDowngradeBusinessNeeded(targetSubscription: SubscriptionTypeEnum, currentlyBusinessOrdered: boolean): boolean {
	return currentlyBusinessOrdered && !subscriptions[targetSubscription].business
}

export function isUpgradeWhitelabelNeeded(targetSubscription: SubscriptionTypeEnum, currentlyWhitelabelOrdered: boolean): boolean {
	return !currentlyWhitelabelOrdered && subscriptions[targetSubscription].whitelabel
}

export function isDowngradeWhitelabelNeeded(targetSubscription: SubscriptionTypeEnum, currentlyWhitelabelOrdered: boolean): boolean {
	return currentlyWhitelabelOrdered && !subscriptions[targetSubscription].whitelabel
}


function calcWhitelabelFeature(planPrices: PlanPriceCalc, currentlyWhitelabelOrdered: boolean, currentWhitelabelPerUserMonthly: number, upgradeWhitelabelPrice: PriceServiceReturn, downgradeWhitelabelPrice: PriceServiceReturn): void {
	const {targetSubscription, targetIsDowngrade, paymentIntervalFactor} = planPrices
	if (isUpgradeWhitelabelNeeded(targetSubscription, currentlyWhitelabelOrdered)) {
		planPrices.monthlyPrice += Number(neverNull(upgradeWhitelabelPrice.futurePriceNextPeriod).price)
			- Number(neverNull(upgradeWhitelabelPrice.currentPriceNextPeriod).price)
		planPrices.additionalUserPriceMonthly += getMonthlySinglePrice(upgradeWhitelabelPrice, BookingItemFeatureType.Whitelabel, paymentIntervalFactor)
	} else if (targetIsDowngrade && isDowngradeWhitelabelNeeded(targetSubscription, currentlyWhitelabelOrdered)) {
		planPrices.monthlyPrice += Number(neverNull(downgradeWhitelabelPrice.futurePriceNextPeriod).price)
			- Number(neverNull(downgradeWhitelabelPrice.currentPriceNextPeriod).price)
	} else {
		planPrices.additionalUserPriceMonthly += currentWhitelabelPerUserMonthly
	}
}

function calcSharingFeature(planPrices: PlanPriceCalc, currentlySharingOrdered: boolean, currentSharingPerUserMonthly: number, upgradeSharingPrice: PriceServiceReturn, downgradeSharingPrice: PriceServiceReturn): void {
	const {targetSubscription, targetIsDowngrade, paymentIntervalFactor} = planPrices
	if (isUpgradeSharingNeeded(targetSubscription, currentlySharingOrdered)) {
		planPrices.monthlyPrice += Number(neverNull(upgradeSharingPrice.futurePriceNextPeriod).price)
			- Number(neverNull(upgradeSharingPrice.currentPriceNextPeriod).price)
		planPrices.additionalUserPriceMonthly += getMonthlySinglePrice(upgradeSharingPrice, BookingItemFeatureType.Sharing, paymentIntervalFactor)
	} else if (targetIsDowngrade && isDowngradeSharingNeeded(targetSubscription, currentlySharingOrdered)) {
		planPrices.monthlyPrice += Number(neverNull(downgradeSharingPrice.futurePriceNextPeriod).price)
			- Number(neverNull(downgradeSharingPrice.currentPriceNextPeriod).price)
	} else {
		planPrices.additionalUserPriceMonthly += currentSharingPerUserMonthly
	}
}

function calcBusinessFeature(planPrices: PlanPriceCalc, currentlyBusinessOrdered: boolean, currentBusinessPerUserMonthly: number, upgradeBusinessPrice: PriceServiceReturn, downgradeBusinessPrice: PriceServiceReturn): void {
	const {targetSubscription, targetIsDowngrade, paymentIntervalFactor} = planPrices
	if (isUpgradeBusinessNeeded(targetSubscription, currentlyBusinessOrdered)) {
		planPrices.monthlyPrice += Number(neverNull(upgradeBusinessPrice.futurePriceNextPeriod).price)
			- Number(neverNull(upgradeBusinessPrice.currentPriceNextPeriod).price)
		planPrices.additionalUserPriceMonthly += getMonthlySinglePrice(upgradeBusinessPrice, BookingItemFeatureType.Business, paymentIntervalFactor)
	} else if (targetIsDowngrade && isDowngradeBusinessNeeded(targetSubscription, currentlyBusinessOrdered)) {
		planPrices.monthlyPrice += Number(neverNull(downgradeBusinessPrice.futurePriceNextPeriod).price)
			- Number(neverNull(downgradeBusinessPrice.currentPriceNextPeriod).price)
	} else {
		planPrices.additionalUserPriceMonthly += currentBusinessPerUserMonthly
	}
}

function calcStorage(planPrices: PlanPriceCalc, currentTotalStorage: number, includedStorage: number, upgrade10GbStoragePrice: PriceServiceReturn, downgrade1GbStoragePrice: PriceServiceReturn): void {
	const {targetSubscription, targetIsDowngrade} = planPrices
	if (isUpgradeStorageNeeded(targetSubscription, currentTotalStorage)) {
		planPrices.monthlyPrice += Number(neverNull(upgrade10GbStoragePrice.futurePriceNextPeriod).price)
			- Number(neverNull(upgrade10GbStoragePrice.currentPriceNextPeriod).price)
	} else if (targetIsDowngrade && isDowngradeStorageNeeded(targetSubscription, currentTotalStorage, includedStorage)) {
		planPrices.monthlyPrice += Number(neverNull(downgrade1GbStoragePrice.futurePriceNextPeriod).price)
			- Number(neverNull(downgrade1GbStoragePrice.currentPriceNextPeriod).price)
	}
	const targetAmountStorage = subscriptions[targetSubscription].storageGb
	planPrices.includedStorage = !targetIsDowngrade ? Math.max(currentTotalStorage, targetAmountStorage) : targetAmountStorage
}

function calcAliases(planPrices: PlanPriceCalc, currentTotalAliases: number, includedAliases: number, upgrade20AliasesPrice: PriceServiceReturn, downgrade5AliasesPrice: PriceServiceReturn): void {
	const {targetSubscription, targetIsDowngrade} = planPrices
	if (isUpgradeAliasesNeeded(targetSubscription, currentTotalAliases)) {
		planPrices.monthlyPrice += Number(neverNull(upgrade20AliasesPrice.futurePriceNextPeriod).price)
			- Number(neverNull(upgrade20AliasesPrice.currentPriceNextPeriod).price)
	} else if (targetIsDowngrade && isDowngradeAliasesNeeded(targetSubscription, currentTotalAliases, includedAliases)) {
		planPrices.monthlyPrice += Number(neverNull(downgrade5AliasesPrice.futurePriceNextPeriod).price)
			- Number(neverNull(downgrade5AliasesPrice.currentPriceNextPeriod).price)
	}
	const targetNbrAliases = subscriptions[targetSubscription].nbrOfAliases
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

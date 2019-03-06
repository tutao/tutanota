// @flow
import m from "mithril"
import {Dialog} from "../gui/base/Dialog"
import {lang} from "../misc/LanguageViewModel"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import {Keys} from "../misc/KeyManager"
import {serviceRequestVoid} from "../api/main/Entity"
import {SysService} from "../api/entities/sys/Services"
import {HttpMethod} from "../api/common/EntityFunctions"
import {createSwitchAccountTypeData} from "../api/entities/sys/SwitchAccountTypeData"
import {AccountType, BookingItemFeatureType, Const} from "../api/common/TutanotaConstants"
import {BadRequestError, InvalidDataError, PreconditionFailedError} from "../api/common/error/RestError"
import {worker} from "../api/main/WorkerClient"
import {SubscriptionSelector} from "./SubscriptionSelector"
import stream from "mithril/stream/stream.js"
import {buyAliases} from "./EmailAliasOptionsDialog"
import {buyStorage} from "./StorageCapacityOptionsDialog"
import {buyWhitelabel} from "./WhitelabelBuyDialog"
import {changeSubscriptionInterval} from "./SubscriptionViewer"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import {SubscriptionType} from "./SubscriptionUtils"
import {createPlanPrices} from "../api/entities/sys/PlanPrices"
import {getPriceFromPriceData, getPriceItem} from "./PriceUtils"
import {neverNull} from "../api/common/utils/Utils"
import type {DialogHeaderBarAttrs} from "../gui/base/DialogHeaderBar"

/**
 * Only shown if the user is already a Premium user. Allows cancelling the subscription and switching between Premium and Pro.
 */
export function showSwitchDialog(accountingInfo: AccountingInfo, isPro: boolean,
                                 currentTotalStorage: number,
                                 currentTotalAliases: number,
                                 currentIncludedStorage: number,
                                 currentIncludedAliases: number,
                                 currentlyWhitelabelOrdered: boolean) {
	let businessStream = stream(accountingInfo.business)
	let paymentIntervalStream = stream(Number(accountingInfo.paymentInterval))

	return showProgressDialog("pleaseWait_msg", getPrices(isPro, currentTotalStorage, currentTotalAliases, currentIncludedStorage, currentIncludedAliases))
		.then(prices => {
			const cancelAction = () => {
				dialog.close()
			}

			const headerBarAttrs : DialogHeaderBarAttrs = {
				left: [{label: "cancel_action", click: cancelAction, type: ButtonType.Secondary}],
				right: [],
				middle: () => lang.get("subscription_label")
			}
			const dialog = Dialog.largeDialog(headerBarAttrs, {
				view: () => m("#upgrade-account-dialog.pt", m(SubscriptionSelector, {
					options: {businessUse: businessStream, paymentInterval: paymentIntervalStream},
					campaignInfoTextId: null,
					boxWidth: 230,
					boxHeight: 230,
					currentlyActive: isPro ? SubscriptionType.Pro : SubscriptionType.Premium,
					isInitialUpgrade: false,
					premiumPrices: prices.premiumPrices,
					proPrices: prices.proPrices,
					freeActionButton: {
						view: () => {
							return m(ButtonN, {
								label: "pricing.select_action",
								click: () => cancelSubscription(dialog),
								type: ButtonType.Login,
							})
						}
					},
					premiumActionButton: {
						view: () => {
							return m(ButtonN, {
								label: "pricing.select_action",
								click: () => {
									switchSubscription(false, isPro, accountingInfo, paymentIntervalStream(), dialog, currentTotalAliases, currentTotalStorage, currentlyWhitelabelOrdered)
								},
								type: ButtonType.Login,
							})
						}
					},
					proActionButton: {
						view: () => {
							return m(ButtonN, {
								label: "pricing.select_action",
								click: () => {
									switchSubscription(true, isPro, accountingInfo, paymentIntervalStream(), dialog, currentTotalAliases, currentTotalStorage, currentlyWhitelabelOrdered)
								},
								type: ButtonType.Login,
							})
						}
					}
				}))
			}).addShortcut({
				key: Keys.ESC,
				exec: cancelAction,
				help: "close_alt"
			}).setCloseHandler(cancelAction)
			                     .show()
		})
}

function getPrices(isPro: boolean, currentTotalStorage: number, currentTotalAliases: number, currentIncludedStorage: number, currentIncludedAliases: number): Promise<{proPrices: PlanPrices, premiumPrices: PlanPrices}> {
	return Promise.join(
		worker.getPrice(BookingItemFeatureType.Users, 1, false),
		worker.getPrice(BookingItemFeatureType.Alias, 20, false),
		worker.getPrice(BookingItemFeatureType.Storage, 10, false),
		worker.getPrice(BookingItemFeatureType.Branding, 1, false),
		worker.getPrice(BookingItemFeatureType.ContactForm, 1, false),
		(addUserReturn, aliasReturn, storageReturn, brandingReturn, contactFormReturn) => {
			let additionalFactor = neverNull(addUserReturn.futurePriceNextPeriod).paymentInterval === "12" ? 1 / 10 : 1
			const premiumPrices = getPremiumPrice(isPro, addUserReturn, additionalFactor, currentTotalStorage, currentTotalAliases, currentIncludedStorage, currentIncludedAliases)
			const proPrices = getProPrice(isPro, addUserReturn, aliasReturn, storageReturn, brandingReturn, contactFormReturn, additionalFactor,
				currentTotalStorage, currentTotalAliases, currentIncludedStorage, currentIncludedAliases)
			return {premiumPrices, proPrices}
		})


}

function getPremiumPrice(isPro: boolean, addUserReturn: PriceServiceReturn, paymentIntervalFactor: number,
                         currentTotalStorage: number, currentTotalAliases: number, currentIncludedStorage: number, currentIncludedAliases: number): PlanPrices {
	const prices = createPlanPrices()
	if (isPro) {
		// show the price for the current number of users and without any additional ordered features
		let currentPriceOnlyUsersMonthly = getPriceFromPriceData(addUserReturn.currentPriceNextPeriod, BookingItemFeatureType.Users) * paymentIntervalFactor
		let singleUserPriceMonthly = getMonthlySinglePrice(addUserReturn, BookingItemFeatureType.Users)
		prices.additionalUserPriceMonthly = String(singleUserPriceMonthly)
		prices.contactFormPriceMonthly = "0" // n/a
		prices.firstYearDiscount = "0"
		prices.includedAliases = String(currentIncludedAliases)
		prices.includedStorage = String(currentIncludedStorage)
		prices.monthlyPrice = String(currentPriceOnlyUsersMonthly)
		prices.monthlyReferencePrice = String(currentPriceOnlyUsersMonthly)
	} else {
		// show the price we are currently paying
		const currentMonthlyPrice = Number(neverNull(addUserReturn.currentPriceNextPeriod).price) * paymentIntervalFactor
		let singleUserPriceMonthly = getMonthlySinglePrice(addUserReturn, BookingItemFeatureType.Users)
		prices.additionalUserPriceMonthly = String(singleUserPriceMonthly)
		prices.contactFormPriceMonthly = "0" // n/a
		prices.firstYearDiscount = "0"
		prices.includedAliases = String(currentTotalAliases)
		prices.includedStorage = String(currentTotalStorage)
		prices.monthlyPrice = String(currentMonthlyPrice)
		prices.monthlyReferencePrice = String(currentMonthlyPrice)
	}
	return prices
}

function getProPrice(isPro: boolean, addUserReturn: PriceServiceReturn, aliasReturn: PriceServiceReturn, storageReturn: PriceServiceReturn,
                     brandingReturn: PriceServiceReturn, contactFormReturn: PriceServiceReturn, paymentIntervalFactor: number,
                     currentTotalStorage: number, currentTotalAliases: number, currentIncludedStorage: number, currentIncludedAliases: number): PlanPrices {
	const prices = createPlanPrices()
	let contactFormPrice = getMonthlySinglePrice(contactFormReturn, BookingItemFeatureType.ContactForm)
	if (isPro) {
		// show the price we are currently paying
		const currentMonthlyPrice = Number(neverNull(addUserReturn.currentPriceNextPeriod).price) * paymentIntervalFactor
		let singleUserPriceMonthly = getMonthlySinglePrice(addUserReturn, BookingItemFeatureType.Users)
		prices.additionalUserPriceMonthly = String(singleUserPriceMonthly)
		prices.contactFormPriceMonthly = String(contactFormPrice)
		prices.firstYearDiscount = "0"
		prices.includedAliases = String(currentTotalAliases)
		prices.includedStorage = String(currentTotalStorage)
		prices.monthlyPrice = String(currentMonthlyPrice)
		prices.monthlyReferencePrice = String(currentMonthlyPrice)
	} else {
		// show the current price plus all Pro features not ordered yet
		let monthlyPrice = Number(neverNull(addUserReturn.currentPriceNextPeriod).price)
		let additionalWhitelabelPrice = Number(neverNull(brandingReturn.futurePriceNextPeriod).price)
			- Number(neverNull(brandingReturn.currentPriceNextPeriod).price)
		if (additionalWhitelabelPrice > 0) {
			monthlyPrice += additionalWhitelabelPrice
		}
		let additionalStoragePrice = Number(neverNull(storageReturn.futurePriceNextPeriod).price)
			- Number(neverNull(storageReturn.currentPriceNextPeriod).price)
		if (additionalStoragePrice > 0) {
			monthlyPrice += additionalStoragePrice
		}
		let additionalAliasesPrice = Number(neverNull(aliasReturn.futurePriceNextPeriod).price) - Number(neverNull(aliasReturn.currentPriceNextPeriod).price)
		if (additionalAliasesPrice > 0) {
			monthlyPrice += additionalAliasesPrice
		}
		monthlyPrice *= paymentIntervalFactor

		let singleUserPriceMonthly = getMonthlySinglePrice(addUserReturn, BookingItemFeatureType.Users)
		let singleUserWhitelabelPrice = getMonthlySinglePrice(brandingReturn, BookingItemFeatureType.Branding)
		let contactFormPrice = getMonthlySinglePrice(contactFormReturn, BookingItemFeatureType.ContactForm)

		prices.additionalUserPriceMonthly = String(singleUserPriceMonthly + singleUserWhitelabelPrice)
		prices.contactFormPriceMonthly = String(contactFormPrice)
		prices.firstYearDiscount = "0"
		prices.includedAliases = String(Math.max(currentTotalAliases, 20))
		prices.includedStorage = String(Math.max(currentTotalStorage, 10))
		prices.monthlyPrice = String(monthlyPrice)
		prices.monthlyReferencePrice = String(monthlyPrice)
	}
	return prices
}


function getMonthlySinglePrice(priceData: PriceServiceReturn, featureType: NumberString): number {
	let futurePrice = getPriceFromPriceData(priceData.futurePriceNextPeriod, featureType)
	const item = getPriceItem(priceData.futurePriceNextPeriod, featureType)
	if (item && item.singleType) {
		futurePrice /= Number(item.count)
		let additionalFactor = neverNull(priceData.futurePriceNextPeriod).paymentInterval === "12" ? 1 / 10 : 1
		return futurePrice * additionalFactor
	} else {
		return 0 // total prices do not change
	}
}

function cancelSubscription(dialog: Dialog) {
	Dialog.confirm("unsubscribeConfirm_msg").then(ok => {
		if (ok) {
			let d = createSwitchAccountTypeData()
			d.accountType = AccountType.FREE
			d.date = Const.CURRENT_DATE

			showProgressDialog("pleaseWait_msg", serviceRequestVoid(SysService.SwitchAccountTypeService, HttpMethod.POST, d)
				.then(() => worker.switchPremiumToFreeGroup())
				.catch(InvalidDataError, e => Dialog.error("accountSwitchTooManyActiveUsers_msg"))
				.catch(PreconditionFailedError, e => Dialog.error("accountSwitchAdditionalPackagesActive_msg"))
				.catch(BadRequestError, e => Dialog.error("deactivatePremiumWithCustomDomainError_msg")))
				.finally(() => dialog.close())
		}
	})
}

function switchSubscription(
	bookPro: boolean,
	isPro: boolean,
	accountingInfo: AccountingInfo,
	paymentInterval: number,
	dialog: Dialog,
	currentNbrOfOrderedAliases: number,
	currentNbrOfOrderedStorage: number,
	currentlyWhitelabelOrdered: boolean) {
	let promise = Promise.resolve()
	if (bookPro && !isPro) {
		const proStorage = 10
		const proAliases = 20
		let msg = lang.get("upgradePro_msg")

		if (currentNbrOfOrderedAliases > proAliases || currentNbrOfOrderedStorage > proStorage) {
			msg = msg + "\n\n" + lang.get("upgradeProNoReduction_msg")
		}
		Dialog.confirm(() => msg).then(ok => {
			if (ok) {
				promise = showProgressDialog("pleaseWait_msg", Promise.resolve().then(() => {
					if (currentNbrOfOrderedAliases < proAliases) {
						return buyAliases(proAliases)
					}
				}).then(() => {
					if (currentNbrOfOrderedStorage < proStorage) {
						return buyStorage(proStorage)
					}
				}).then(() => {
					if (!currentlyWhitelabelOrdered) {
						return buyWhitelabel(true)
					}
				}).then(() => updatePaymentInterval(paymentInterval, accountingInfo)))
					.then(() => dialog.close())
			}
		})
	} else if (!bookPro && isPro) {
		Dialog.confirm("downgradeToPremium_msg").then(ok => {
			if (ok) {
				promise = showProgressDialog("pleaseWait_msg", buyAliases(0)
					.then(() => buyStorage(0))
					.then(() => buyWhitelabel(false))
					.then(() => updatePaymentInterval(paymentInterval, accountingInfo)))
					.then(() => dialog.close())
			}
		})
	}
}

function updatePaymentInterval(paymentInterval: number, accountingInfo: AccountingInfo) {
	if (paymentInterval !== Number(accountingInfo.paymentInterval)) {
		changeSubscriptionInterval(accountingInfo, paymentInterval)
	}
}
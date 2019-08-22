// @flow
import m from "mithril"
import {Dialog} from "../gui/base/Dialog"
import {lang} from "../misc/LanguageViewModel"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import {serviceRequestVoid} from "../api/main/Entity"
import {SysService} from "../api/entities/sys/Services"
import {HttpMethod} from "../api/common/EntityFunctions"
import {createSwitchAccountTypeData} from "../api/entities/sys/SwitchAccountTypeData"
import {
	AccountType,
	BookingItemFeatureByCode,
	BookingItemFeatureType,
	Const,
	Keys,
	UnsubscribeFailureReason
} from "../api/common/TutanotaConstants"
import {BadRequestError, InvalidDataError, PreconditionFailedError} from "../api/common/error/RestError"
import {worker} from "../api/main/WorkerClient"
import {SubscriptionSelector} from "./SubscriptionSelector"
import stream from "mithril/stream/stream.js"
import {buyAliases} from "./EmailAliasOptionsDialog"
import {buyStorage} from "./StorageCapacityOptionsDialog"
import {buySharing, buyWhitelabel} from "./WhitelabelAndSharingBuyDialog"
import {changeSubscriptionInterval} from "./SubscriptionViewer"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import type {SubscriptionTypeEnum} from "./SubscriptionUtils"
import {SubscriptionType} from "./SubscriptionUtils"
import type {DialogHeaderBarAttrs} from "../gui/base/DialogHeaderBar"
import {createPlanPrices} from "../api/entities/sys/PlanPrices"
import {neverNull} from "../api/common/utils/Utils"
import {getPriceFromPriceData, getPriceItem} from "./PriceUtils"
import type {AccountingInfo} from "../api/entities/sys/AccountingInfo"
import type {PlanPrices} from "../api/entities/sys/PlanPrices"
import type {PriceServiceReturn} from "../api/entities/sys/PriceServiceReturn"

type SubscriptionConfig = {
	nbrOfAliases: number,
	orderNbrOfAliases: number,
	storageGb: number,
	orderStorageGb: number,
	sharing: boolean,
	whitelabel: boolean,
}

let subscriptions: {[SubscriptionTypeEnum]: SubscriptionConfig} = {}
subscriptions[SubscriptionType.Free] = {
	nbrOfAliases: 0,
	orderNbrOfAliases: 0,
	storageGb: 1,
	orderStorageGb: 0,
	sharing: false,
	whitelabel: false
}
subscriptions[SubscriptionType.Premium] = {
	nbrOfAliases: 5,
	orderNbrOfAliases: 0,
	storageGb: 1,
	orderStorageGb: 0,
	sharing: false,
	whitelabel: false
}
subscriptions[SubscriptionType.Teams] = {
	nbrOfAliases: 5,
	orderNbrOfAliases: 0,
	storageGb: 10,
	orderStorageGb: 10,
	sharing: true,
	whitelabel: false
}
subscriptions[SubscriptionType.Pro] = {
	nbrOfAliases: 20,
	orderNbrOfAliases: 20,
	storageGb: 10,
	orderStorageGb: 10,
	sharing: true,
	whitelabel: true
}

/**
 * Only shown if the user is already a Premium user. Allows cancelling the subscription (only private use) and switching the subscription to a different paid subscription.
 */
export function showSwitchDialog(accountingInfo: AccountingInfo,
                                 currentSubscription: SubscriptionTypeEnum,
                                 currentNbrOfUsers: number,
                                 currentTotalStorage: number,
                                 currentTotalAliases: number,
                                 includedStorage: number,
                                 includedAliases: number,
                                 currentlySharingOrdered: boolean,
                                 currentlyWhitelabelOrdered: boolean): Promise<void> {
	let businessStream = stream(accountingInfo.business)
	let paymentIntervalStream = stream(Number(accountingInfo.paymentInterval))

	return showProgressDialog("pleaseWait_msg", getPrices(currentSubscription, currentNbrOfUsers, currentTotalStorage, currentTotalAliases, includedStorage, includedAliases, currentlyWhitelabelOrdered, currentlySharingOrdered))
		.then(prices => {
			const cancelAction = () => {
				dialog.close()
			}

			const headerBarAttrs: DialogHeaderBarAttrs = {
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
					currentlyActive: currentSubscription,
					currentlySharingOrdered: currentlySharingOrdered,
					currentlyWhitelabelOrdered: currentlyWhitelabelOrdered,
					isInitialUpgrade: false,
					premiumPrices: prices.premiumPrices,
					teamsPrices: prices.teamsPrices,
					proPrices: prices.proPrices,
					freeActionButton: {
						view: () => {
							return m(ButtonN, {
								label: "pricing.select_action",
								click: () => cancelSubscription(dialog,
									currentTotalAliases,
									currentTotalStorage,
									includedAliases,
									includedStorage,
									currentlySharingOrdered,
									currentlyWhitelabelOrdered),
								type: ButtonType.Login,
							})
						}
					},
					premiumActionButton: {
						view: () => {
							return m(ButtonN, {
								label: "pricing.select_action",
								click: () => {
									switchSubscription(SubscriptionType.Premium, currentSubscription, accountingInfo, paymentIntervalStream(), dialog, currentTotalAliases, currentTotalStorage, includedAliases, includedStorage, currentlySharingOrdered, currentlyWhitelabelOrdered)
								},
								type: ButtonType.Login,
							})
						}
					},
					teamsActionButton: {
						view: () => {
							return m(ButtonN, {
								label: "pricing.select_action",
								click: () => {
									switchSubscription(SubscriptionType.Teams, currentSubscription, accountingInfo, paymentIntervalStream(), dialog, currentTotalAliases, currentTotalStorage, includedAliases, includedStorage, currentlySharingOrdered, currentlyWhitelabelOrdered)
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
									switchSubscription(SubscriptionType.Pro, currentSubscription, accountingInfo, paymentIntervalStream(), dialog, currentTotalAliases, currentTotalStorage, includedAliases, includedStorage, currentlySharingOrdered, currentlyWhitelabelOrdered)
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

function getPrices(currentSubscription: SubscriptionTypeEnum, currentNbrOfUsers: number, currentTotalStorage: number, currentTotalAliases: number, includedStorage: number, includedAliases: number, currentlyWhitelabelOrdered: boolean, currentlySharingOrdered: boolean): Promise<{premiumPrices: PlanPrices, teamsPrices: PlanPrices, proPrices: PlanPrices}> {
	return Promise.join(
		worker.getPrice(BookingItemFeatureType.Users, 1, false),
		worker.getPrice(BookingItemFeatureType.Alias, 20, false),
		worker.getPrice(BookingItemFeatureType.Alias, 0, false),
		worker.getPrice(BookingItemFeatureType.Storage, 10, false),
		worker.getPrice(BookingItemFeatureType.Storage, 0, false),
		worker.getPrice(BookingItemFeatureType.Sharing, 1, false),
		worker.getPrice(BookingItemFeatureType.Sharing, 0, false),
		worker.getPrice(BookingItemFeatureType.Branding, 1, false),
		worker.getPrice(BookingItemFeatureType.Branding, 0, false),
		worker.getPrice(BookingItemFeatureType.ContactForm, 1, false),

		(addUserPrice, upgrade20AliasesPrice, downgrade5AliasesPrice, upgrade10GbStoragePrice, downgrade1GbStoragePrice, upgradeSharingPrice, downgradeSharingPrice, upgradeWhitelabelPrice, downgradeWhitelabelPrice, contactFormPrice) => {
			let additionalFactor = neverNull(addUserPrice.futurePriceNextPeriod).paymentInterval === "12" ? 1 / 10 : 1
			const premiumPrices = getPrice(currentSubscription, SubscriptionType.Premium, addUserPrice, upgrade20AliasesPrice, downgrade5AliasesPrice, upgrade10GbStoragePrice, downgrade1GbStoragePrice, upgradeSharingPrice, downgradeSharingPrice, upgradeWhitelabelPrice, downgradeWhitelabelPrice, contactFormPrice, additionalFactor, currentTotalStorage, currentTotalAliases, includedStorage, includedAliases, currentlyWhitelabelOrdered, currentlySharingOrdered)
			const teamsPrices = getPrice(currentSubscription, SubscriptionType.Teams, addUserPrice, upgrade20AliasesPrice, downgrade5AliasesPrice, upgrade10GbStoragePrice, downgrade1GbStoragePrice, upgradeSharingPrice, downgradeSharingPrice, upgradeWhitelabelPrice, downgradeWhitelabelPrice, contactFormPrice, additionalFactor, currentTotalStorage, currentTotalAliases, includedStorage, includedAliases, currentlyWhitelabelOrdered, currentlySharingOrdered)
			const proPrices = getPrice(currentSubscription, SubscriptionType.Pro, addUserPrice, upgrade20AliasesPrice, downgrade5AliasesPrice, upgrade10GbStoragePrice, downgrade1GbStoragePrice, upgradeSharingPrice, downgradeSharingPrice, upgradeWhitelabelPrice, downgradeWhitelabelPrice, contactFormPrice, additionalFactor, currentTotalStorage, currentTotalAliases, includedStorage, includedAliases, currentlyWhitelabelOrdered, currentlySharingOrdered)
			return {premiumPrices, teamsPrices, proPrices}
		}
	)
}

function getPrice(currentSubscription: SubscriptionTypeEnum, targetSubscription: SubscriptionTypeEnum,
                  addUserReturn: PriceServiceReturn,
                  upgrade20AliasesPrice: PriceServiceReturn, downgrade5AliasesPrice: PriceServiceReturn,
                  upgrade10GbStoragePrice: PriceServiceReturn, downgrade1GbStoragePrice: PriceServiceReturn,
                  upgradeSharingPrice: PriceServiceReturn, downgradeSharingPrice: PriceServiceReturn,
                  upgradeWhitelabelPrice: PriceServiceReturn, downgradeWhitelabelPrice: PriceServiceReturn,
                  contactFormReturn: PriceServiceReturn,
                  paymentIntervalFactor: number,
                  currentTotalStorage: number, currentTotalAliases: number,
                  includedStorage: number, includedAliases: number,
                  currentlyWhitelabelOrdered: boolean, currentlySharingOrdered: boolean): PlanPrices {
	let prices = createPlanPrices()

	let monthlyPrice = Number(neverNull(addUserReturn.currentPriceNextPeriod).price)

	let contactFormPrice = getMonthlySinglePrice(contactFormReturn, BookingItemFeatureType.ContactForm, paymentIntervalFactor)
	let singleUserPriceMonthly = getMonthlySinglePrice(addUserReturn, BookingItemFeatureType.Users, paymentIntervalFactor)
	let currentSharingPerUserMonthly = getMonthlySinglePrice(addUserReturn, BookingItemFeatureType.Sharing, paymentIntervalFactor)
	let currentWhitelabelPerUserMonthly = getMonthlySinglePrice(addUserReturn, BookingItemFeatureType.Branding, paymentIntervalFactor)

	prices.contactFormPriceMonthly = subscriptions[targetSubscription].whitelabel ? String(contactFormPrice) : "0"
	prices.firstYearDiscount = "0"
	if (currentSubscription === targetSubscription) {
		// show the price we are currently paying
		monthlyPrice *= paymentIntervalFactor
		prices.includedAliases = String(currentTotalAliases)
		prices.includedStorage = String(currentTotalStorage)
		prices.monthlyPrice = String(monthlyPrice)
		prices.monthlyReferencePrice = String(monthlyPrice)
		prices.additionalUserPriceMonthly = String(singleUserPriceMonthly + currentSharingPerUserMonthly + currentWhitelabelPerUserMonthly)
	} else if (isUpgrade(targetSubscription, currentSubscription)) {
		// show the current price plus all features not ordered yet

		if (isUpgradeWhitelabelNeeded(targetSubscription, currentlyWhitelabelOrdered)) {
			monthlyPrice += Number(neverNull(upgradeWhitelabelPrice.futurePriceNextPeriod).price)
				- Number(neverNull(upgradeWhitelabelPrice.currentPriceNextPeriod).price)
		}
		if (isUpgradeSharingNeeded(targetSubscription, currentlySharingOrdered)) {
			monthlyPrice += Number(neverNull(upgradeSharingPrice.futurePriceNextPeriod).price)
				- Number(neverNull(upgradeSharingPrice.currentPriceNextPeriod).price)
		}
		if (isUpgradeStorageNeeded(targetSubscription, currentTotalStorage)) {
			monthlyPrice += Number(neverNull(upgrade10GbStoragePrice.futurePriceNextPeriod).price)
				- Number(neverNull(upgrade10GbStoragePrice.currentPriceNextPeriod).price)
		}
		if (isUpgradeAliasesNeeded(targetSubscription, currentTotalAliases)) {
			monthlyPrice += Number(neverNull(upgrade20AliasesPrice.futurePriceNextPeriod).price)
				- Number(neverNull(upgrade20AliasesPrice.currentPriceNextPeriod).price)
		}

		monthlyPrice *= paymentIntervalFactor

		prices.includedAliases = String(Math.max(currentTotalAliases, subscriptions[targetSubscription].nbrOfAliases))
		prices.includedStorage = String(Math.max(currentTotalStorage, subscriptions[targetSubscription].storageGb))
		prices.monthlyPrice = String(monthlyPrice)
		prices.monthlyReferencePrice = String(monthlyPrice)
		prices.additionalUserPriceMonthly = String(singleUserPriceMonthly
			+ (isUpgradeWhitelabelNeeded(targetSubscription, currentlyWhitelabelOrdered) ? getMonthlySinglePrice(upgradeWhitelabelPrice, BookingItemFeatureType.Branding, paymentIntervalFactor) : currentWhitelabelPerUserMonthly)
			+ (isUpgradeSharingNeeded(targetSubscription, currentlySharingOrdered) ? getMonthlySinglePrice(upgradeSharingPrice, BookingItemFeatureType.Sharing, paymentIntervalFactor) : currentSharingPerUserMonthly))
	} else {
		// downgrade. show the current prices minus all features not in the target subscription (keep users as is)
		if (isDowngradeWhitelabelNeeded(targetSubscription, currentlyWhitelabelOrdered)) {
			monthlyPrice += Number(neverNull(downgradeWhitelabelPrice.futurePriceNextPeriod).price)
				- Number(neverNull(downgradeWhitelabelPrice.currentPriceNextPeriod).price)
		}
		if (isDowngradeSharingNeeded(targetSubscription, currentlySharingOrdered)) {
			monthlyPrice += Number(neverNull(downgradeSharingPrice.futurePriceNextPeriod).price)
				- Number(neverNull(downgradeSharingPrice.currentPriceNextPeriod).price)
		}
		if (isDowngradeStorageNeeded(targetSubscription, currentTotalStorage, includedStorage)) {
			monthlyPrice += Number(neverNull(downgrade1GbStoragePrice.futurePriceNextPeriod).price)
				- Number(neverNull(downgrade1GbStoragePrice.currentPriceNextPeriod).price)
		}
		if (isDowngradeAliasesNeeded(targetSubscription, currentTotalAliases, includedAliases)) {
			monthlyPrice += Number(neverNull(downgrade5AliasesPrice.futurePriceNextPeriod).price)
				- Number(neverNull(downgrade5AliasesPrice.currentPriceNextPeriod).price)
		}

		monthlyPrice *= paymentIntervalFactor

		prices.includedAliases = String(Math.max(includedAliases, subscriptions[targetSubscription].nbrOfAliases))
		prices.includedStorage = String(Math.max(includedStorage, subscriptions[targetSubscription].storageGb))
		prices.monthlyPrice = String(monthlyPrice)
		prices.monthlyReferencePrice = String(monthlyPrice)
		prices.additionalUserPriceMonthly = String(singleUserPriceMonthly
			+ (isDowngradeWhitelabelNeeded(targetSubscription, currentlyWhitelabelOrdered) ? 0 : currentWhitelabelPerUserMonthly)
			+ (isDowngradeSharingNeeded(targetSubscription, currentlySharingOrdered) ? 0 : currentSharingPerUserMonthly))
	}
	return prices
}


function getMonthlySinglePrice(priceData: PriceServiceReturn, featureType: NumberString, additionalFactor: number): number {
	let futurePrice = getPriceFromPriceData(priceData.futurePriceNextPeriod, featureType)
	const item = getPriceItem(priceData.futurePriceNextPeriod, featureType)
	if (item && item.singleType) {
		futurePrice /= Number(item.count)
		return futurePrice * additionalFactor
	} else {
		return 0 // total prices do not change
	}
}

function cancelSubscription(dialog: Dialog,
                            currentNbrOfAliases: number,
                            currentAmountOfStorage: number,
                            includedAliases: number,
                            includedStorage: number,
                            currentlySharingOrdered: boolean,
                            currentlyWhitelabelOrdered: boolean) {
	Dialog.confirm("unsubscribeConfirm_msg").then(ok => {
		if (ok) {
			let d = createSwitchAccountTypeData()
			d.accountType = AccountType.FREE
			d.date = Const.CURRENT_DATE

			showProgressDialog("pleaseWait_msg",
				cancelAllAdditionalFeatures(SubscriptionType.Free,
					currentNbrOfAliases,
					currentAmountOfStorage,
					includedAliases,
					includedStorage,
					currentlySharingOrdered,
					currentlyWhitelabelOrdered)
					.then(failed => {
						if (!failed) {
							return serviceRequestVoid(SysService.SwitchAccountTypeService, HttpMethod.POST, d)
								.then(() => worker.switchPremiumToFreeGroup())
								.catch(PreconditionFailedError, (e) => {
									const reason = e.data
									if (reason == null) {
										return Dialog.error("unknownError_msg")
									} else {
										let detailMsg;
										switch (reason) {
											case UnsubscribeFailureReason.TOO_MANY_ENABLED_USERS:
												detailMsg = lang.get("accountSwitchTooManyActiveUsers_msg")
												break
											case UnsubscribeFailureReason.CUSTOM_MAIL_ADDRESS:
												detailMsg = lang.get("accountSwitchCustomMailAddress_msg")
												break
											case UnsubscribeFailureReason.TOO_MANY_CALENDARS:
												detailMsg = lang.get("accountSwitchMultipleCalendars_msg")
												break
											case UnsubscribeFailureReason.CALENDAR_TYPE:
												detailMsg = lang.get("accountSwitchSharedCalendar_msg")
												break
											case UnsubscribeFailureReason.TOO_MANY_ALIASES:
												detailMsg = lang.get("accountSwitchAliases_msg")
												break
											default:
												if (reason.startsWith(UnsubscribeFailureReason.FEATURE)) {
													const feature = reason.slice(UnsubscribeFailureReason.FEATURE.length + 1)
													const featureName = BookingItemFeatureByCode[feature]
													detailMsg = lang.get("accountSwitchFeature_msg", {"{featureName}": featureName})
												} else {
													detailMsg = lang.get("unknownError_msg")
												}
												break
										}
										return Dialog.error(() => lang.get("accountSwitchNotPossible_msg", {"{detailMsg}": detailMsg}))
									}
								})
								.catch(InvalidDataError, e => Dialog.error("accountSwitchTooManyActiveUsers_msg"))
								.catch(BadRequestError, e => Dialog.error("deactivatePremiumWithCustomDomainError_msg"))
						}
					})).finally(() => dialog.close())
		}
	})
}

function isUpgrade(targetSubscription: SubscriptionTypeEnum, currentSubscription: SubscriptionTypeEnum): boolean {
	return (currentSubscription === SubscriptionType.Premium)
		|| (currentSubscription === SubscriptionType.Teams && targetSubscription === SubscriptionType.Pro)
}

function isUpgradeAliasesNeeded(targetSubscription: SubscriptionTypeEnum, currentNbrOfAliases: number): boolean {
	return currentNbrOfAliases < subscriptions[targetSubscription].nbrOfAliases
}

function isDowngradeAliasesNeeded(targetSubscription: SubscriptionTypeEnum, currentNbrOfAliases: number, includedAliases: number): boolean {
	// only order the target aliases package if it is smaller than the actual number of current aliases and if we have currently ordered more than the included aliases
	return currentNbrOfAliases > subscriptions[targetSubscription].nbrOfAliases && currentNbrOfAliases > includedAliases
}

function isUpgradeStorageNeeded(targetSubscription: SubscriptionTypeEnum, currentAmountOfStorage: number): boolean {
	return currentAmountOfStorage < subscriptions[targetSubscription].storageGb
}

function isDowngradeStorageNeeded(targetSubscription: SubscriptionTypeEnum, currentAmountOfStorage: number, includedStorage: number): boolean {
	return currentAmountOfStorage > subscriptions[targetSubscription].storageGb && currentAmountOfStorage > includedStorage
}

function isUpgradeSharingNeeded(targetSubscription: SubscriptionTypeEnum, currentlySharingOrdered: boolean): boolean {
	return !currentlySharingOrdered && subscriptions[targetSubscription].sharing
}

function isDowngradeSharingNeeded(targetSubscription: SubscriptionTypeEnum, currentlySharingOrdered: boolean): boolean {
	return currentlySharingOrdered && !subscriptions[targetSubscription].sharing
}

function isUpgradeWhitelabelNeeded(targetSubscription: SubscriptionTypeEnum, currentlyWhitelabelOrdered: boolean): boolean {
	return !currentlyWhitelabelOrdered && subscriptions[targetSubscription].whitelabel
}

function isDowngradeWhitelabelNeeded(targetSubscription: SubscriptionTypeEnum, currentlyWhitelabelOrdered: boolean): boolean {
	return currentlyWhitelabelOrdered && !subscriptions[targetSubscription].whitelabel
}

function switchSubscription(
	targetSubscription: SubscriptionTypeEnum,
	currentSubscription: SubscriptionTypeEnum,
	accountingInfo: AccountingInfo,
	paymentInterval: number,
	dialog: Dialog,
	currentNbrOfAliases: number,
	currentAmountOfStorage: number,
	includedAliases: number,
	includedStorage: number,
	currentlySharingOrdered: boolean,
	currentlyWhitelabelOrdered: boolean) {

	if (isUpgrade(targetSubscription, currentSubscription)) {
		let msg = lang.get(targetSubscription === SubscriptionType.Pro ? "upgradePro_msg" : "upgradeTeams_msg")
		if (isDowngradeAliasesNeeded(targetSubscription, currentNbrOfAliases, includedAliases)
			|| isDowngradeStorageNeeded(targetSubscription, currentAmountOfStorage, includedStorage)) {
			msg = msg + "\n\n" + lang.get("upgradeProNoReduction_msg")
		}
		Dialog.confirm(() => msg).then(ok => {
			if (ok) {
				return showProgressDialog("pleaseWait_msg", Promise.resolve().then(() => {
					if (isUpgradeAliasesNeeded(targetSubscription, currentNbrOfAliases)) {
						return buyAliases(subscriptions[targetSubscription].orderNbrOfAliases)
					}
				}).then(() => {
					if (isUpgradeStorageNeeded(targetSubscription, currentAmountOfStorage)) {
						return buyStorage(subscriptions[targetSubscription].orderStorageGb)
					}
				}).then(() => {
					if (isUpgradeSharingNeeded(targetSubscription, currentlySharingOrdered)) {
						return buySharing(true)
					}
				}).then(() => {
					if (isUpgradeWhitelabelNeeded(targetSubscription, currentlyWhitelabelOrdered)) {
						return buyWhitelabel(true)
					}
				}).then(() => updatePaymentInterval(paymentInterval, accountingInfo)))
					.then(() => dialog.close())
			}
		})
	} else {
		Dialog.confirm(targetSubscription === SubscriptionType.Premium ? "downgradeToPremium_msg" : "downgradeToTeams_msg").then(ok => {
			if (ok) {
				return showProgressDialog("pleaseWait_msg", cancelAllAdditionalFeatures(targetSubscription,
					currentNbrOfAliases,
					currentAmountOfStorage,
					includedAliases,
					includedStorage,
					currentlySharingOrdered,
					currentlyWhitelabelOrdered)
					.then(() => updatePaymentInterval(paymentInterval, accountingInfo)))
					.then(() => dialog.close())
			}
		})
	}
}

/**
 * @returns True if any of the additional features could not be canceled, false otherwise
 */
function cancelAllAdditionalFeatures(targetSubscription: SubscriptionTypeEnum,
                                     currentNbrOfAliases: number,
                                     currentAmountOfStorage: number,
                                     includedAliases: number,
                                     includedStorage: number,
                                     currentlySharingOrdered: boolean,
                                     currentlyWhitelabelOrdered: boolean): Promise<boolean> {
	return Promise.resolve().then(() => {
		if (isDowngradeAliasesNeeded(targetSubscription, currentNbrOfAliases, includedAliases)) {
			return buyAliases(subscriptions[targetSubscription].orderNbrOfAliases)
		} else {
			return false
		}
	}).then(previousFailed => {
		if (isDowngradeStorageNeeded(targetSubscription, currentAmountOfStorage, includedStorage)) {
			return buyStorage(subscriptions[targetSubscription].orderStorageGb).then(thisFailed => thisFailed || previousFailed)
		} else {
			return previousFailed
		}
	}).then(previousFailed => {
		if (isDowngradeSharingNeeded(targetSubscription, currentlySharingOrdered)) {
			return buySharing(false).then(thisFailed => thisFailed || previousFailed)
		} else {
			return previousFailed
		}
	}).then(previousFailed => {
		if (isDowngradeWhitelabelNeeded(targetSubscription, currentlyWhitelabelOrdered)) {
			return buyWhitelabel(false).then(thisFailed => thisFailed || previousFailed)
		} else {
			return previousFailed
		}
	})
}

function updatePaymentInterval(paymentInterval: number, accountingInfo: AccountingInfo) {
	if (paymentInterval !== Number(accountingInfo.paymentInterval)) {
		changeSubscriptionInterval(accountingInfo, paymentInterval)
	}
}
// @flow
import m from "mithril"
import {Dialog} from "../gui/base/Dialog"
import {lang} from "../misc/LanguageViewModel"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import {serviceRequestVoid} from "../api/main/Entity"
import {SysService} from "../api/entities/sys/Services"
import {HttpMethod} from "../api/common/EntityFunctions"
import {createSwitchAccountTypeData} from "../api/entities/sys/SwitchAccountTypeData"
import {AccountType, BookingItemFeatureByCode, Const, Keys, UnsubscribeFailureReason} from "../api/common/TutanotaConstants"
import {BadRequestError, InvalidDataError, PreconditionFailedError} from "../api/common/error/RestError"
import {worker} from "../api/main/WorkerClient"
import {SubscriptionSelector} from "./SubscriptionSelector"
import stream from "mithril/stream/stream.js"
import {showProgressDialog} from "../gui/dialogs/ProgressDialog"
import type {SubscriptionActionButtons, SubscriptionTypeEnum} from "./SubscriptionUtils"
import {
	buyAliases,
	buyBusiness,
	buySharing,
	buyStorage,
	buyWhitelabel,
	getDisplayNameOfSubscriptionType,
	isDowngrade,
	subscriptions,
	SubscriptionType
} from "./SubscriptionUtils"
import type {DialogHeaderBarAttrs} from "../gui/base/DialogHeaderBar"
import type {CurrentSubscriptionInfo} from "./SwitchSubscriptionDialogModel"
import {
	isDowngradeAliasesNeeded,
	isDowngradeBusinessNeeded,
	isDowngradeSharingNeeded,
	isDowngradeStorageNeeded,
	isDowngradeWhitelabelNeeded,
	isUpgradeAliasesNeeded,
	isUpgradeBusinessNeeded,
	isUpgradeSharingNeeded,
	isUpgradeStorageNeeded,
	isUpgradeWhitelabelNeeded,
	SwitchSubscriptionDialogModel
} from "./SwitchSubscriptionDialogModel"
import type {Customer} from "../api/entities/sys/Customer"
import type {CustomerInfo} from "../api/entities/sys/CustomerInfo"
import type {AccountingInfo} from "../api/entities/sys/AccountingInfo"
import type {Booking} from "../api/entities/sys/Booking"

/**
 * Only shown if the user is already a Premium user. Allows cancelling the subscription (only private use) and switching the subscription to a different paid subscription.
 */
export function showSwitchDialog(customer: Customer, customerInfo: CustomerInfo, accountingInfo: AccountingInfo, lastBooking: Booking): Promise<void> {

	const model = new SwitchSubscriptionDialogModel(worker, customer, customerInfo, accountingInfo, lastBooking)

	return showProgressDialog("pleaseWait_msg", model.loadSwitchSubscriptionPrices())
		.then(prices => {
			const cancelAction = () => {
				dialog.close()
			}
			const headerBarAttrs: DialogHeaderBarAttrs = {
				left: [{label: "cancel_action", click: cancelAction, type: ButtonType.Secondary}],
				right: [],
				middle: () => lang.get("subscription_label")
			}
			const currentSubscriptionInfo = model.currentSubscriptionInfo
			const dialog = Dialog.largeDialog(headerBarAttrs, {
				view: () => m("#upgrade-account-dialog.pt", m(SubscriptionSelector, {
					// paymentInterval will not be updated as isInitialUpgrade is false
					options: {
						businessUse: stream(currentSubscriptionInfo.businessUse),
						paymentInterval: stream(currentSubscriptionInfo.paymentInterval)
					},
					campaignInfoTextId: null,
					boxWidth: 230,
					boxHeight: 230,
					currentSubscriptionType: currentSubscriptionInfo.subscriptionType,
					currentlySharingOrdered: currentSubscriptionInfo.currentlySharingOrdered,
					currentlyBusinessOrdered: currentSubscriptionInfo.currentlyBusinessOrdered,
					currentlyWhitelabelOrdered: currentSubscriptionInfo.currentlyWhitelabelOrdered,
					orderedContactForms: currentSubscriptionInfo.orderedContactForms,
					isInitialUpgrade: false,
					planPrices: prices,
					actionButtons: subscriptionActionButtons
				}))
			}).addShortcut({
				key: Keys.ESC,
				exec: cancelAction,
				help: "close_alt"
			}).setCloseHandler(cancelAction)
			const subscriptionActionButtons: SubscriptionActionButtons = {
				Free: {
					view: () => {
						return m(ButtonN, {
							label: "pricing.select_action",
							click: () => cancelSubscription(dialog, currentSubscriptionInfo),
							type: ButtonType.Login,
						})
					}
				},
				Premium: createSubscriptionPlanButton(dialog, SubscriptionType.Premium, currentSubscriptionInfo),
				PremiumBusiness: createSubscriptionPlanButton(dialog, SubscriptionType.PremiumBusiness, currentSubscriptionInfo),
				Teams: createSubscriptionPlanButton(dialog, SubscriptionType.Teams, currentSubscriptionInfo),
				TeamsBusiness: createSubscriptionPlanButton(dialog, SubscriptionType.TeamsBusiness, currentSubscriptionInfo),
				Pro: createSubscriptionPlanButton(dialog, SubscriptionType.Pro, currentSubscriptionInfo)
			}
			dialog.show()
		})
}

function createSubscriptionPlanButton(dialog: Dialog, targetSubscription: SubscriptionTypeEnum, currentSubscriptionInfo: CurrentSubscriptionInfo): MComponent<void> {
	return {
		view: () => {
			return m(ButtonN, {
				label: "pricing.select_action",
				click: () => {
					switchSubscription(targetSubscription, dialog, currentSubscriptionInfo)
				},
				type: ButtonType.Login,
			})
		}
	}
}

function cancelSubscription(dialog: Dialog, currentSubscriptionInfo: CurrentSubscriptionInfo) {
	Dialog.confirm("unsubscribeConfirm_msg").then(ok => {
		if (!ok) {
			return
		}
		let d = createSwitchAccountTypeData()
		d.accountType = AccountType.FREE
		d.date = Const.CURRENT_DATE

		showProgressDialog("pleaseWait_msg",
			cancelAllAdditionalFeatures(SubscriptionType.Free, currentSubscriptionInfo)
				.then(failed => {
					if (failed) {
						return
					}
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
				})).finally(() => dialog.close())
	})
}

function getUpOrDowngradeMessage(targetSubscription: SubscriptionTypeEnum,
                                 currentSubscriptionInfo: CurrentSubscriptionInfo): string {
	// we can only switch from a non-business plan to a business plan and not vice verse
	// a business customer may not have booked the business feature and be forced to book it even if downgrading: e.g. Teams -> PremiumBusiness
	// switch to free is not allowed here.
	let msg = ""
	if (isDowngrade(targetSubscription, currentSubscriptionInfo.subscriptionType)) {
		msg = lang.get(targetSubscription === SubscriptionType.Premium || targetSubscription === SubscriptionType.PremiumBusiness
			? "downgradeToPremium_msg"
			: "downgradeToTeams_msg")
		if (targetSubscription === SubscriptionType.PremiumBusiness || targetSubscription === SubscriptionType.TeamsBusiness) {
			msg = msg + " " + lang.get("businessIncluded_msg")
		}
	} else {
		const planDisplayName = getDisplayNameOfSubscriptionType(targetSubscription)
		msg = lang.get("upgradePlan_msg", {"{plan}": planDisplayName})
		if (targetSubscription === SubscriptionType.PremiumBusiness
			|| targetSubscription === SubscriptionType.TeamsBusiness
			|| targetSubscription === SubscriptionType.Pro) {
			msg += " " + lang.get("businessIncluded_msg")
		}
		if (isDowngradeAliasesNeeded(targetSubscription, currentSubscriptionInfo.currentTotalAliases, currentSubscriptionInfo.includedAliases)
			|| isDowngradeStorageNeeded(targetSubscription, currentSubscriptionInfo.currentTotalAliases, currentSubscriptionInfo.includedStorage)) {
			msg = msg + "\n\n" + lang.get("upgradeProNoReduction_msg")
		}
	}
	return msg
}

function switchSubscription(targetSubscription: SubscriptionTypeEnum, dialog: Dialog, currentSubscriptionInfo: CurrentSubscriptionInfo) {
	if (targetSubscription === currentSubscriptionInfo.subscriptionType) {
		return
	}
	Dialog.confirm(() => getUpOrDowngradeMessage(targetSubscription, currentSubscriptionInfo))
	      .then(ok => {
		      if (!ok) {
			      return
		      }
		      return showProgressDialog("pleaseWait_msg", Promise.resolve().then(() => {
				      if (isUpgradeAliasesNeeded(targetSubscription, currentSubscriptionInfo.currentTotalAliases)) {
					      return buyAliases(subscriptions[targetSubscription].orderNbrOfAliases)
				      }
			      }).then(() => {
				      if (isUpgradeStorageNeeded(targetSubscription, currentSubscriptionInfo.currentTotalStorage)) {
					      return buyStorage(subscriptions[targetSubscription].orderStorageGb)
				      }
			      }).then(() => {
				      if (isUpgradeSharingNeeded(targetSubscription, currentSubscriptionInfo.currentlySharingOrdered)) {
					      return buySharing(true)
				      }
			      }).then(() => {
				      if (isUpgradeBusinessNeeded(targetSubscription, currentSubscriptionInfo.currentlyBusinessOrdered)) {
					      return buyBusiness(true)
				      }
			      }).then(() => {
				      if (isUpgradeWhitelabelNeeded(targetSubscription, currentSubscriptionInfo.currentlyWhitelabelOrdered)) {
					      return buyWhitelabel(true)
				      }
			      }).then(() => {
				      if (isDowngrade(targetSubscription, currentSubscriptionInfo.subscriptionType)) {
					      return cancelAllAdditionalFeatures(targetSubscription, currentSubscriptionInfo)
				      }
			      })
		      ).then(() => dialog.close())
	      })
}

/**
 * @returns True if any of the additional features could not be canceled, false otherwise
 */
function cancelAllAdditionalFeatures(targetSubscription: SubscriptionTypeEnum,
                                     currentSubscriptionInfo: CurrentSubscriptionInfo): Promise<boolean> {
	return Promise.resolve().then(() => {
		if (isDowngradeAliasesNeeded(targetSubscription, currentSubscriptionInfo.currentTotalAliases, currentSubscriptionInfo.includedAliases)) {
			return buyAliases(subscriptions[targetSubscription].orderNbrOfAliases)
		} else {
			return false
		}
	}).then(previousFailed => {
		if (isDowngradeStorageNeeded(targetSubscription, currentSubscriptionInfo.currentTotalStorage, currentSubscriptionInfo.includedStorage)) {
			return buyStorage(subscriptions[targetSubscription].orderStorageGb)
				.then(thisFailed => thisFailed || previousFailed)
		} else {
			return previousFailed
		}
	}).then(previousFailed => {
		if (isDowngradeSharingNeeded(targetSubscription, currentSubscriptionInfo.currentlySharingOrdered)) {
			return buySharing(false).then(thisFailed => thisFailed || previousFailed)
		} else {
			return previousFailed
		}
	}).then(previousFailed => {
		if (isDowngradeBusinessNeeded(targetSubscription, currentSubscriptionInfo.currentlyBusinessOrdered)) {
			return buyBusiness(false).then(thisFailed => thisFailed || previousFailed)
		} else {
			return previousFailed
		}
	}).then(previousFailed => {
		if (isDowngradeWhitelabelNeeded(targetSubscription, currentSubscriptionInfo.currentlyWhitelabelOrdered)) {
			return buyWhitelabel(false).then(thisFailed => thisFailed || previousFailed)
		} else {
			return previousFailed
		}
	})
}
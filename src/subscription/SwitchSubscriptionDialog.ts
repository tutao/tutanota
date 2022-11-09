import m, {Component} from "mithril"
import {Dialog} from "../gui/base/Dialog"
import {lang} from "../misc/LanguageViewModel"
import {Button, ButtonType} from "../gui/base/Button.js"
import type {AccountingInfo, Booking, Customer, CustomerInfo, SwitchAccountTypeData} from "../api/entities/sys/TypeRefs.js"
import {createSwitchAccountTypeData} from "../api/entities/sys/TypeRefs.js"
import {AccountType, BookingItemFeatureByCode, BookingItemFeatureType, Const, Keys, UnsubscribeFailureReason} from "../api/common/TutanotaConstants"
import {SubscriptionActionButtons, SubscriptionSelector} from "./SubscriptionSelector"
import stream from "mithril/stream"
import {showProgressDialog} from "../gui/dialogs/ProgressDialog"
import {
	buyAliases,
	buyBusiness,
	buySharing,
	buyStorage,
	buyWhitelabel,
	isDowngrade,
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
	SwitchSubscriptionDialogModel,
} from "./SwitchSubscriptionDialogModel"
import {locator} from "../api/main/MainLocator"
import {SwitchAccountTypeService} from "../api/entities/sys/Services.js"
import {BadRequestError, InvalidDataError, PreconditionFailedError} from "../api/common/error/RestError.js"
import {getDisplayNameOfSubscriptionType, getSubscriptionConfig, SubscriptionType} from "./SubscriptionDataProvider"

/**
 * Only shown if the user is already a Premium user. Allows cancelling the subscription (only private use) and switching the subscription to a different paid subscription.
 */
export async function showSwitchDialog(customer: Customer, customerInfo: CustomerInfo, accountingInfo: AccountingInfo, lastBooking: Booking): Promise<void> {
	const model = new SwitchSubscriptionDialogModel(locator.bookingFacade, customer, customerInfo, accountingInfo, lastBooking)
	const prices = await showProgressDialog("pleaseWait_msg", model.loadSwitchSubscriptionPrices())
	const cancelAction = () => dialog.close()

	const headerBarAttrs: DialogHeaderBarAttrs = {
		left: [
			{
				label: "cancel_action",
				click: cancelAction,
				type: ButtonType.Secondary,
			},
		],
		right: [],
		middle: () => lang.get("subscription_label"),
	}
	const currentSubscriptionInfo = model.currentSubscriptionInfo
	const dialog: Dialog = Dialog.largeDialog(headerBarAttrs, {
		view: () =>
			m(
				"#upgrade-account-dialog.pt",
				m(SubscriptionSelector, {
					// paymentInterval will not be updated as isInitialUpgrade is false
					options: {
						businessUse: stream(currentSubscriptionInfo.businessUse),
						paymentInterval: stream(currentSubscriptionInfo.paymentInterval),
					},
					campaignInfoTextId: null,
					boxWidth: 230,
					boxHeight: 270,
					currentSubscriptionType: currentSubscriptionInfo.subscriptionType,
					currentlySharingOrdered: currentSubscriptionInfo.currentlySharingOrdered,
					currentlyBusinessOrdered: currentSubscriptionInfo.currentlyBusinessOrdered,
					currentlyWhitelabelOrdered: currentSubscriptionInfo.currentlyWhitelabelOrdered,
					orderedContactForms: currentSubscriptionInfo.orderedContactForms,
					isInitialUpgrade: false,
					planPrices: prices,
					actionButtons: subscriptionActionButtons
				}),
			),
	}).addShortcut({
		key: Keys.ESC,
		exec: cancelAction,
		help: "close_alt",
	}).setCloseHandler(cancelAction)
	const subscriptionActionButtons: SubscriptionActionButtons = {
		Free: {
			view: () => {
				return m(Button, {
					label: "pricing.select_action",
					click: () => cancelSubscription(dialog, currentSubscriptionInfo),
					type: ButtonType.Login,
				})
			},
		},
		Premium: createSubscriptionPlanButton(dialog, SubscriptionType.Premium, currentSubscriptionInfo),
		PremiumBusiness: createSubscriptionPlanButton(dialog, SubscriptionType.PremiumBusiness, currentSubscriptionInfo),
		Teams: createSubscriptionPlanButton(dialog, SubscriptionType.Teams, currentSubscriptionInfo),
		TeamsBusiness: createSubscriptionPlanButton(dialog, SubscriptionType.TeamsBusiness, currentSubscriptionInfo),
		Pro: createSubscriptionPlanButton(dialog, SubscriptionType.Pro, currentSubscriptionInfo),
	}
	dialog.show()
}

function createSubscriptionPlanButton(
	dialog: Dialog,
	targetSubscription: SubscriptionType,
	currentSubscriptionInfo: CurrentSubscriptionInfo,
): Component {
	return {
		view: () => {
			return m(Button, {
				label: "pricing.select_action",
				click: () => {
					switchSubscription(targetSubscription, dialog, currentSubscriptionInfo)
				},
				type: ButtonType.Login,
			})
		},
	}
}

function handleSwitchAccountPreconditionFailed(e: PreconditionFailedError): Promise<void> {
	const reason = e.data

	if (reason == null) {
		return Dialog.message("unknownError_msg")
	} else {
		let detailMsg: string

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
					const featureName = BookingItemFeatureByCode[feature as BookingItemFeatureType]
					detailMsg = lang.get("accountSwitchFeature_msg", {
						"{featureName}": featureName,
					})
				} else {
					detailMsg = lang.get("unknownError_msg")
				}

				break
		}

		return Dialog.message(() =>
			lang.get("accountSwitchNotPossible_msg", {
				"{detailMsg}": detailMsg,
			}),
		)
	}
}


async function tryDowngradePremiumToFree(switchAccountTypeData: SwitchAccountTypeData, currentSubscriptionInfo: CurrentSubscriptionInfo): Promise<void> {
	const failed = await cancelAllAdditionalFeatures(SubscriptionType.Free, currentSubscriptionInfo)
	if (failed) {
		return
	}

	try {
		await locator.serviceExecutor.post(SwitchAccountTypeService, switchAccountTypeData)
		await locator.customerFacade.switchPremiumToFreeGroup()
	} catch (e) {
		if (e instanceof PreconditionFailedError) {
			return handleSwitchAccountPreconditionFailed(e)
		} else if (e instanceof InvalidDataError) {
			return Dialog.message("accountSwitchTooManyActiveUsers_msg")
		} else if (e instanceof BadRequestError) {
			return Dialog.message("deactivatePremiumWithCustomDomainError_msg")
		}
	}
}

async function cancelSubscription(dialog: Dialog, currentSubscriptionInfo: CurrentSubscriptionInfo): Promise<void> {
	if (!await Dialog.confirm("unsubscribeConfirm_msg")) {
		return
	}
	const switchAccountTypeData = createSwitchAccountTypeData()
	switchAccountTypeData.accountType = AccountType.FREE
	switchAccountTypeData.date = Const.CURRENT_DATE
	try {
		await showProgressDialog("pleaseWait_msg", tryDowngradePremiumToFree(switchAccountTypeData, currentSubscriptionInfo))
	} finally {
		dialog.close()
	}
}

function getUpOrDowngradeMessage(targetSubscription: SubscriptionType, currentSubscriptionInfo: CurrentSubscriptionInfo): string {
	// we can only switch from a non-business plan to a business plan and not vice verse
	// a business customer may not have booked the business feature and be forced to book it even if downgrading: e.g. Teams -> PremiumBusiness
	// switch to free is not allowed here.
	let msg = ""

	if (isDowngrade(targetSubscription, currentSubscriptionInfo.subscriptionType)) {
		msg = lang.get(
			targetSubscription === SubscriptionType.Premium || targetSubscription === SubscriptionType.PremiumBusiness
				? "downgradeToPremium_msg"
				: "downgradeToTeams_msg",
		)

		if (targetSubscription === SubscriptionType.PremiumBusiness || targetSubscription === SubscriptionType.TeamsBusiness) {
			msg = msg + " " + lang.get("businessIncluded_msg")
		}
	} else {
		const planDisplayName = getDisplayNameOfSubscriptionType(targetSubscription)
		msg = lang.get("upgradePlan_msg", {
			"{plan}": planDisplayName,
		})

		if (
			targetSubscription === SubscriptionType.PremiumBusiness ||
			targetSubscription === SubscriptionType.TeamsBusiness ||
			targetSubscription === SubscriptionType.Pro
		) {
			msg += " " + lang.get("businessIncluded_msg")
		}

		if (
			isDowngradeAliasesNeeded(targetSubscription, currentSubscriptionInfo.currentTotalAliases, currentSubscriptionInfo.includedAliases) ||
			isDowngradeStorageNeeded(targetSubscription, currentSubscriptionInfo.currentTotalAliases, currentSubscriptionInfo.includedStorage)
		) {
			msg = msg + "\n\n" + lang.get("upgradeProNoReduction_msg")
		}
	}

	return msg
}

async function checkNeededUpgrades(targetSubscription: SubscriptionType, currentSubscriptionInfo: CurrentSubscriptionInfo): Promise<void> {
	if (isUpgradeAliasesNeeded(targetSubscription, currentSubscriptionInfo.currentTotalAliases)) {
		await buyAliases(getSubscriptionConfig(targetSubscription).orderNbrOfAliases)
	}
	if (isUpgradeStorageNeeded(targetSubscription, currentSubscriptionInfo.currentTotalStorage)) {
		await buyStorage(getSubscriptionConfig(targetSubscription).orderStorageGb)
	}
	if (isUpgradeSharingNeeded(targetSubscription, currentSubscriptionInfo.currentlySharingOrdered)) {
		await buySharing(true)
	}
	if (isUpgradeBusinessNeeded(targetSubscription, currentSubscriptionInfo.currentlyBusinessOrdered)) {
		await buyBusiness(true)
	}
	if (isUpgradeWhitelabelNeeded(targetSubscription, currentSubscriptionInfo.currentlyWhitelabelOrdered)) {
		await buyWhitelabel(true)
	}
	if (isDowngrade(targetSubscription, currentSubscriptionInfo.subscriptionType)) {
		await cancelAllAdditionalFeatures(targetSubscription, currentSubscriptionInfo)
	}
}

async function switchSubscription(targetSubscription: SubscriptionType, dialog: Dialog, currentSubscriptionInfo: CurrentSubscriptionInfo) {
	if (targetSubscription === currentSubscriptionInfo.subscriptionType) {
		return
	}

	const ok = await Dialog.confirm(() => getUpOrDowngradeMessage(targetSubscription, currentSubscriptionInfo))
	if (!ok) {
		return
	}
	try {
		await showProgressDialog("pleaseWait_msg", checkNeededUpgrades(targetSubscription, currentSubscriptionInfo))
	} finally {
		dialog.close()
	}
}

/**
 * @returns True if any of the additional features could not be canceled, false otherwise
 */
async function cancelAllAdditionalFeatures(targetSubscription: SubscriptionType, currentSubscriptionInfo: CurrentSubscriptionInfo): Promise<boolean> {
	let failed = false
	if (isDowngradeAliasesNeeded(targetSubscription, currentSubscriptionInfo.currentTotalAliases, currentSubscriptionInfo.includedAliases)) {
		failed = await buyAliases(getSubscriptionConfig(targetSubscription).orderNbrOfAliases)
	}
	if (isDowngradeStorageNeeded(targetSubscription, currentSubscriptionInfo.currentTotalStorage, currentSubscriptionInfo.includedStorage)) {
		failed = failed || await buyStorage(getSubscriptionConfig(targetSubscription).orderStorageGb)
	}
	if (isDowngradeSharingNeeded(targetSubscription, currentSubscriptionInfo.currentlySharingOrdered)) {
		failed = failed || await buySharing(false)
	}
	if (isDowngradeBusinessNeeded(targetSubscription, currentSubscriptionInfo.currentlyBusinessOrdered)) {
		failed = failed || await buyBusiness(false)
	}
	if (isDowngradeWhitelabelNeeded(targetSubscription, currentSubscriptionInfo.currentlyWhitelabelOrdered)) {
		failed = failed || await buyWhitelabel(false)
	}
	return failed
}
import m from "mithril"
import { Dialog } from "../gui/base/Dialog"
import { lang, TranslationKey } from "../misc/LanguageViewModel"
import { ButtonType } from "../gui/base/Button.js"
import {
	AccountingInfo,
	Booking,
	createSurveyData,
	createSwitchAccountTypePostIn,
	Customer,
	GroupInfo,
	GroupInfoTypeRef,
	GroupTypeRef,
	SurveyData,
	UserTypeRef,
} from "../api/entities/sys/TypeRefs.js"
import {
	AccountType,
	AvailablePlanType,
	BookingFailureReason,
	Const,
	getPaymentMethodType,
	GroupType,
	InvoiceData,
	Keys,
	LegacyPlans,
	NewBusinessPlans,
	PaymentMethodType,
	PlanType,
	PlanTypeToName,
	UnsubscribeFailureReason,
} from "../api/common/TutanotaConstants"
import { SubscriptionActionButtons } from "./SubscriptionSelector"
import stream from "mithril/stream"
import { showProgressDialog } from "../gui/dialogs/ProgressDialog"
import { DialogHeaderBarAttrs } from "../gui/base/DialogHeaderBar"
import type { CurrentPlanInfo } from "./SwitchSubscriptionDialogModel"
import { SwitchSubscriptionDialogModel } from "./SwitchSubscriptionDialogModel"
import { locator } from "../api/main/CommonLocator"
import { SwitchAccountTypeService } from "../api/entities/sys/Services.js"
import { InvalidDataError, PreconditionFailedError } from "../api/common/error/RestError.js"
import { PaymentInterval, PriceAndConfigProvider } from "./utils/PriceUtils"
import { assertNotNull, base64ExtToBase64, base64ToUint8Array, defer, delay, downcast, lazy } from "@tutao/tutanota-utils"
import { showSwitchToBusinessInvoiceDataDialog } from "./SwitchToBusinessInvoiceDataDialog.js"
import { getByAbbreviation } from "../api/common/CountryList.js"
import { formatNameAndAddress } from "../api/common/utils/CommonFormatter.js"
import { LoginButtonAttrs } from "../gui/base/buttons/LoginButton.js"
import { showLeavingUserSurveyWizard } from "./LeavingUserSurveyWizard.js"
import { SURVEY_VERSION_NUMBER } from "./LeavingUserSurveyConstants.js"
import { isIOSApp } from "../api/common/Env.js"
import { MobilePaymentSubscriptionOwnership } from "../native/common/generatedipc/MobilePaymentSubscriptionOwnership.js"
import { showManageThroughAppStoreDialog } from "./PaymentViewer.js"
import {
	appStorePlanName,
	getCurrentPaymentInterval,
	hasRunningAppStoreSubscription,
	shouldShowApplePrices,
	SubscriptionApp,
} from "./utils/SubscriptionUtils.js"
import { MobilePaymentError } from "../api/common/error/MobilePaymentError.js"
import { mailLocator } from "../../mail-app/mailLocator"
import { client } from "../misc/ClientDetector.js"
import { completeUpgradeStage } from "../ratings/UserSatisfactionUtils"
import { PlanSelector } from "./PlanSelector.js"
import { getPrivateBusinessSwitchButton } from "./SubscriptionPage.js"
import { PlanSelectorHeadline } from "./components/PlanSelectorHeadline"
import { anyHasGlobalFirstYearCampaign, getDiscountDetails } from "./utils/PlanSelectorUtils"
import { BootIcons } from "../gui/base/icons/BootIcons"
import { px } from "../gui/size"
import { TemplateGroupService } from "../api/entities/tutanota/Services"
import { createUserAreaGroupDeleteData } from "../api/entities/tutanota/TypeRefs"
import { getUserGroupMemberships } from "../api/common/utils/GroupUtils"

/**
 * Allows cancelling the subscription (only private use) and switching the subscription to a different paid subscription.
 * Note: Only shown if the user is already a Premium user.
 */
export async function showSwitchDialog({
	customer,
	accountingInfo,
	lastBooking,
	acceptedPlans,
	reason,
}: {
	customer: Customer
	accountingInfo: AccountingInfo
	lastBooking: Booking
	acceptedPlans: readonly AvailablePlanType[]
	reason: TranslationKey | null
}): Promise<void> {
	if (hasRunningAppStoreSubscription(accountingInfo) && !isIOSApp()) {
		await showManageThroughAppStoreDialog()
		return
	}

	const priceAndConfigProvider = await showProgressDialog(
		"pleaseWait_msg",
		PriceAndConfigProvider.getInitializedInstance(null, locator.serviceExecutor, null),
	)
	const model = new SwitchSubscriptionDialogModel(customer, accountingInfo, await locator.logins.getUserController().getPlanType(), lastBooking)
	const deferred = defer<void>()
	const cancelAction = () => {
		deferred.resolve()
		dialog.close()
	}

	const currentPlanInfo = model.currentPlanInfo
	const businessUse = stream(currentPlanInfo.businessUse)
	const paymentInterval = stream(PaymentInterval.Yearly) // always default to yearly
	const options = { businessUse, paymentInterval }
	const multipleUsersAllowed = model.multipleUsersStillSupportedLegacy()
	const isApplePrice = shouldShowApplePrices(accountingInfo)
	const discountDetails = getDiscountDetails(isApplePrice, priceAndConfigProvider)

	if (currentPlanInfo.planType != null && LegacyPlans.includes(currentPlanInfo.planType)) {
		reason = "currentPlanDiscontinued_msg"
	}

	const newPlanSelectorHeaderBarAttrs: DialogHeaderBarAttrs = {
		left: [
			{
				label: "cancel_action",
				click: cancelAction,
				type: ButtonType.Secondary,
			},
		],
		right: isApplePrice ? [] : [getPrivateBusinessSwitchButton(businessUse, acceptedPlans)],
		middle: "subscription_label",
	}

	const renderPlanSelector = () => {
		// Reassigning the right button for header to update the label
		if (!isApplePrice) {
			newPlanSelectorHeaderBarAttrs.right = [getPrivateBusinessSwitchButton(businessUse, acceptedPlans)]
		}

		return m(
			".pt-16",
			// Headline for a global campaign
			!businessUse() &&
				anyHasGlobalFirstYearCampaign(discountDetails) &&
				m(PlanSelectorHeadline, {
					translation: lang.getTranslation("pricing.cyber_monday_msg"),
					icon: BootIcons.Heart,
				}),
			// Headline for general messages
			reason && m(PlanSelectorHeadline, { translation: lang.getTranslation(reason) }),
			m(
				"",
				{
					style: {
						"max-width": businessUse() ? "initial" : px(500),
						"margin-inline": "auto",
					},
				},
				m(PlanSelector, {
					options,
					actionButtons: subscriptionActionButtons,
					priceAndConfigProvider,
					availablePlans: acceptedPlans,
					isApplePrice,
					currentPlan: currentPlanInfo.planType,
					currentPaymentInterval: getCurrentPaymentInterval(accountingInfo),
					// We hide the payment interval switch in the setting and let the plan selector handles the interval changing for iOS
					allowSwitchingPaymentInterval: isApplePrice || currentPlanInfo.paymentInterval !== PaymentInterval.Yearly,
					showMultiUser: multipleUsersAllowed,
					targetPlan: currentPlanInfo.planType, // dummy property; only relevant for signup, but required to exist
					discountDetails,
				}),
			),
		)
	}

	const dialog: Dialog = Dialog.largeDialog(newPlanSelectorHeaderBarAttrs, {
		view: () => {
			return renderPlanSelector()
		},
	})
		.addShortcut({
			key: Keys.ESC,
			exec: cancelAction,
			help: "close_alt",
		})
		.setCloseHandler(cancelAction)

	const hasFirstYearDiscount = (targetPlan: PlanType) => {
		const paymentMethod = accountingInfo.paymentMethod
		const hasGlobalFirstYearDiscount = priceAndConfigProvider.getRawPricingData().hasGlobalFirstYearDiscount
		const isYearly = paymentInterval() === PaymentInterval.Yearly

		if (isIOSApp() && (!paymentMethod || paymentMethod === PaymentMethodType.AppStore)) {
			const prices = priceAndConfigProvider.getMobilePrices().get(PlanTypeToName[targetPlan].toLowerCase())
			return hasGlobalFirstYearDiscount && isYearly && !!prices?.isEligibleForIntroOffer && !!prices?.displayOfferYearlyPerYear
		} else {
			return hasGlobalFirstYearDiscount && isYearly
		}
	}

	const subscriptionActionButtons: SubscriptionActionButtons = {
		[PlanType.Free]: () =>
			({
				label: "pricing.select_action",
				onclick: () => onSwitchToFree(customer, dialog, currentPlanInfo),
			}) satisfies LoginButtonAttrs,
		[PlanType.Revolutionary]: createPlanButton(
			dialog,
			PlanType.Revolutionary,
			currentPlanInfo,
			paymentInterval,
			accountingInfo,
			hasFirstYearDiscount(PlanType.Revolutionary),
		),
		[PlanType.Legend]: createPlanButton(dialog, PlanType.Legend, currentPlanInfo, paymentInterval, accountingInfo, hasFirstYearDiscount(PlanType.Legend)),
		[PlanType.Essential]: createPlanButton(dialog, PlanType.Essential, currentPlanInfo, paymentInterval, accountingInfo),
		[PlanType.Advanced]: createPlanButton(dialog, PlanType.Advanced, currentPlanInfo, paymentInterval, accountingInfo),
		[PlanType.Unlimited]: createPlanButton(dialog, PlanType.Unlimited, currentPlanInfo, paymentInterval, accountingInfo),
	}
	dialog.show()
	return deferred.promise
}

async function onSwitchToFree(customer: Customer, dialog: Dialog, currentPlanInfo: CurrentPlanInfo) {
	if (isIOSApp()) {
		// We want the user to disable renewal in AppStore before they try to downgrade on our side
		const ownership = await locator.mobilePaymentsFacade.queryAppStoreSubscriptionOwnership(base64ToUint8Array(base64ExtToBase64(customer._id)))
		if (ownership === MobilePaymentSubscriptionOwnership.Owner && (await locator.mobilePaymentsFacade.isAppStoreRenewalEnabled())) {
			await locator.mobilePaymentsFacade.showSubscriptionConfigView()

			await showProgressDialog("pleaseWait_msg", waitUntilRenewalDisabled())

			if (await locator.mobilePaymentsFacade.isAppStoreRenewalEnabled()) {
				console.log("AppStore renewal is still enabled, canceling downgrade")
				// User probably did not disable the renewal still, cancel
				return
			}
		}
	}

	const reason = await showLeavingUserSurveyWizard(true, true)
	const data =
		reason.submitted && reason.category && reason.reason
			? createSurveyData({
					category: reason.category,
					reason: reason.reason,
					details: reason.details,
					version: SURVEY_VERSION_NUMBER,
					clientVersion: env.versionNumber,
					clientPlatform: client.getClientPlatform().valueOf().toString(),
				})
			: null
	const newPlanType = await cancelSubscription(dialog, currentPlanInfo, customer, data)

	if (newPlanType === PlanType.Free) {
		if (mailLocator.mailModel) {
			// there is no mailLocator for the calendar app
			for (const importedMailSet of mailLocator.mailModel.getImportedMailSets()) void mailLocator.mailModel.finallyDeleteCustomMailFolder(importedMailSet)
		}
	}
}

async function waitUntilRenewalDisabled() {
	for (let i = 0; i < 3; i++) {
		// Wait a bit before checking, it takes a bit to propagate
		await delay(2000)
		if (!(await locator.mobilePaymentsFacade.isAppStoreRenewalEnabled())) {
			return
		}
	}
}

async function doSwitchToPaidPlan(
	accountingInfo: AccountingInfo,
	newPaymentInterval: PaymentInterval,
	targetSubscription: PlanType,
	dialog: Dialog,
	currentPlanInfo: CurrentPlanInfo,
) {
	if (isIOSApp() && getPaymentMethodType(accountingInfo) === PaymentMethodType.AppStore) {
		const customerIdBytes = base64ToUint8Array(base64ExtToBase64(assertNotNull(locator.logins.getUserController().user.customer)))
		dialog.close()
		try {
			await locator.mobilePaymentsFacade.requestSubscriptionToPlan(appStorePlanName(targetSubscription), newPaymentInterval, customerIdBytes)
		} catch (e) {
			if (e instanceof MobilePaymentError) {
				console.error("AppStore subscription failed", e)
				void Dialog.message("appStoreSubscriptionError_msg", e.message)
			} else {
				throw e
			}
		}
	} else {
		if (currentPlanInfo.paymentInterval !== newPaymentInterval) {
			await locator.customerFacade.changePaymentInterval(accountingInfo, newPaymentInterval)
		}
		await switchSubscription(targetSubscription, dialog, currentPlanInfo)
	}
}

function createPlanButton(
	dialog: Dialog,
	targetSubscription: PlanType,
	currentPlanInfo: CurrentPlanInfo,
	newPaymentInterval: stream<PaymentInterval>,
	accountingInfo: AccountingInfo,
	shouldApplyDiscount: boolean = false,
): lazy<LoginButtonAttrs> {
	return () => ({
		label: "buy_action",
		...(shouldApplyDiscount && { class: "go-european-button" }),
		onclick: async () => {
			if (
				await Dialog.confirm(
					lang.getTranslation("switchPlan_msg", {
						"{plan}": PlanTypeToName[targetSubscription],
						"{interval}":
							newPaymentInterval() === PaymentInterval.Yearly
								? lang.getTranslationText("pricing.yearly_label").toLowerCase()
								: lang.getTranslationText("pricing.monthly_label").toLowerCase(),
					}),
					"paymentDataValidation_action",
				)
			) {
				await showProgressDialog(
					"pleaseWait_msg",
					doSwitchToPaidPlan(accountingInfo, newPaymentInterval(), targetSubscription, dialog, currentPlanInfo),
				)
			}
		},
	})
}

/** deletes all template group on the customer account (after confirmation) */
async function runTemplateCleanupFlow(customer: Customer) {
	if (!(await Dialog.confirm("autoDeleteTemplateGroupsConfirmation_msg", "delete_action"))) {
		return false
	}

	try {
		const groupInfos: Array<GroupInfo> = await locator.entityClient.loadAll(GroupInfoTypeRef, customer.userGroups)
		const userGroupIds = groupInfos.map((groupInfo) => groupInfo.group)
		const userGroups = await locator.entityClient.loadMultiple(GroupTypeRef, null, userGroupIds)
		const userIds: Array<string> = userGroups.map((g) => g.user).filter((userId) => userId !== null)
		if (userIds.length < userGroups.length) {
			console.error("customer.userGroups contains groups without user? customer: ", customer)
		}
		const users = await locator.entityClient.loadMultiple(UserTypeRef, null, userIds)
		const deletedTemplateGroups = new Set<string>()
		for (const user of users) {
			const templateMemberships = getUserGroupMemberships(user, GroupType.Template)
			for (const { group } of templateMemberships) {
				if (deletedTemplateGroups.has(group)) {
					continue
				}
				await locator.serviceExecutor.delete(TemplateGroupService, createUserAreaGroupDeleteData({ group }))
				deletedTemplateGroups.add(group)
			}
		}
	} catch (e) {
		console.error("failed to delete all template groups of customer:", e)
		return false
	}
	return true
}

/**
 * in cases where we can automatically handle the precondition, we run a sub-flow (with user confirmation) to fix
 * the issue.
 *
 * @param customer the customer the error refers to
 * @param e the precondition error we received from the server
 * @returns boolean true if we should re-try the switch, false if the customer cancelled the sub-flow or we can't handle
 * the issue automatically
 */
export async function handleSwitchAccountPreconditionFailed(customer: Customer, e: PreconditionFailedError): Promise<boolean> {
	const reason = e.data

	if (reason == null) {
		await Dialog.message("unknownError_msg")
		return false
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
			case BookingFailureReason.TOO_MANY_ALIASES:
				detailMsg = lang.get("accountSwitchAliases_msg")
				break

			case UnsubscribeFailureReason.TOO_MUCH_STORAGE_USED:
			case BookingFailureReason.TOO_MUCH_STORAGE_USED:
				detailMsg = lang.get("storageCapacityTooManyUsedForBooking_msg")
				break

			case UnsubscribeFailureReason.TOO_MANY_DOMAINS:
			case BookingFailureReason.TOO_MANY_DOMAINS:
				detailMsg = lang.get("tooManyCustomDomains_msg")
				break

			case UnsubscribeFailureReason.HAS_TEMPLATE_GROUP:
			case BookingFailureReason.HAS_TEMPLATE_GROUP:
				return await runTemplateCleanupFlow(customer)

			case UnsubscribeFailureReason.WHITELABEL_DOMAIN_ACTIVE:
			case BookingFailureReason.WHITELABEL_DOMAIN_ACTIVE:
				detailMsg = lang.get("whitelabelDomainExisting_msg")
				break

			case UnsubscribeFailureReason.HAS_CONTACT_LIST_GROUP:
				detailMsg = lang.get("contactListExisting_msg")
				break

			case UnsubscribeFailureReason.NOT_ENOUGH_CREDIT:
				detailMsg = lang.getTranslationText("insufficientBalanceError_msg")
				break

			case UnsubscribeFailureReason.INVOICE_NOT_PAID:
				detailMsg = lang.getTranslationText("invoiceNotPaidSwitch_msg")
				break

			case UnsubscribeFailureReason.ACTIVE_APPSTORE_SUBSCRIPTION:
				if (isIOSApp()) {
					await locator.mobilePaymentsFacade.showSubscriptionConfigView()
					return false
				} else {
					// we have an app store subscription, but the down/upgrade is attempted on another platform
					await showManageThroughAppStoreDialog()
					return false
				}

			case UnsubscribeFailureReason.LABEL_LIMIT_EXCEEDED:
				detailMsg = lang.getTranslationText("labelLimitExceeded_msg")
				break

			case UnsubscribeFailureReason.HAS_SCHEDULED_MAILS:
				detailMsg = lang.getTranslationText("removeScheduledMails_msg")
				break

			default:
				throw e
		}
		await Dialog.message(
			lang.getTranslation("accountSwitchNotPossible_msg", {
				"{detailMsg}": detailMsg,
			}),
		)
		return false
	}
}
/**
 * @param customer
 * @param currentPlanType
 * @param surveyData
 * @returns the new plan type after the attempt.
 */
export async function tryDowngradePremiumToFree(customer: Customer, currentPlanType: PlanType, surveyData: SurveyData | null): Promise<PlanType> {
	const switchAccountTypeData = createSwitchAccountTypePostIn({
		accountType: AccountType.FREE,
		date: Const.CURRENT_DATE,
		customer: customer._id,
		specialPriceUserSingle: null,
		referralCode: null,
		plan: PlanType.Free,
		surveyData: surveyData,
		app: client.isCalendarApp() ? SubscriptionApp.Calendar : SubscriptionApp.Mail,
	})
	try {
		await locator.serviceExecutor.post(SwitchAccountTypeService, switchAccountTypeData)
		return PlanType.Free
	} catch (e) {
		if (e instanceof PreconditionFailedError) {
			const shouldRetry = await handleSwitchAccountPreconditionFailed(customer, e)
			if (shouldRetry) {
				return tryDowngradePremiumToFree(customer, currentPlanType, surveyData)
			}
		} else if (e instanceof InvalidDataError) {
			await Dialog.message("accountSwitchTooManyActiveUsers_msg")
		} else {
			throw e
		}
		return currentPlanType
	}
}

async function cancelSubscription(
	dialog: Dialog,
	currentPlanInfo: CurrentPlanInfo,
	customer: Customer,
	surveyData: SurveyData | null = null,
): Promise<PlanType> {
	const confirmCancelSubscription = Dialog.confirm("unsubscribeConfirm_msg", "ok_action", () => {
		return m(
			".pt-16",
			m("ul.usage-test-opt-in-bullets", [
				m("li", lang.get("importedMailsWillBeDeleted_label")),
				m("li", lang.get("accountWillBeDeactivatedIn6Month_label")),
				m("li", lang.get("accountWillHaveLessStorage_label")),
			]),
		)
	})

	if (!(await confirmCancelSubscription)) {
		return currentPlanInfo.planType
	}

	try {
		return await showProgressDialog("pleaseWait_msg", tryDowngradePremiumToFree(customer, currentPlanInfo.planType, surveyData))
	} finally {
		dialog.close()
	}
}

async function switchSubscription(targetSubscription: PlanType, dialog: Dialog, currentPlanInfo: CurrentPlanInfo): Promise<void> {
	if (targetSubscription === currentPlanInfo.planType) {
		return
	}

	const userController = locator.logins.getUserController()
	const customer = await userController.reloadCustomer()
	if (!customer.businessUse && NewBusinessPlans.includes(downcast(targetSubscription))) {
		const accountingInfo = await userController.loadAccountingInfo()
		const invoiceData: InvoiceData = {
			invoiceAddress: formatNameAndAddress(accountingInfo.invoiceName, accountingInfo.invoiceAddress),
			country: accountingInfo.invoiceCountry ? getByAbbreviation(accountingInfo.invoiceCountry) : null,
			vatNumber: accountingInfo.invoiceVatIdNo, // only for EU countries otherwise empty
		}
		const updatedInvoiceData = await showSwitchToBusinessInvoiceDataDialog(customer, invoiceData, accountingInfo)
		if (!updatedInvoiceData) {
			return
		}
	}

	try {
		const postIn = createSwitchAccountTypePostIn({
			accountType: AccountType.PAID,
			plan: targetSubscription,
			date: Const.CURRENT_DATE,
			referralCode: null,
			customer: customer._id,
			specialPriceUserSingle: null,
			surveyData: null,
			app: client.isCalendarApp() ? SubscriptionApp.Calendar : SubscriptionApp.Mail,
		})

		try {
			await showProgressDialog("pleaseWait_msg", locator.serviceExecutor.post(SwitchAccountTypeService, postIn))
			completeUpgradeStage(currentPlanInfo.planType, targetSubscription) // this is just a usage test
			return
		} catch (e) {
			if (e instanceof PreconditionFailedError) {
				const shouldRetry = await handleSwitchAccountPreconditionFailed(customer, e)
				if (shouldRetry) {
					return switchSubscription(targetSubscription, dialog, currentPlanInfo)
				} else {
					return
				}
			}
			throw e
		}
	} finally {
		dialog.onClose()
	}
}

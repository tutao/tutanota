import m from "mithril"
import { Dialog } from "../gui/base/Dialog"
import { lang, TranslationText } from "../misc/LanguageViewModel"
import { ButtonType } from "../gui/base/Button.js"
import { AccountingInfo, Booking, createSurveyData, createSwitchAccountTypePostIn, Customer, CustomerInfo, SurveyData } from "../api/entities/sys/TypeRefs.js"
import {
	AccountType,
	AvailablePlanType,
	BookingFailureReason,
	Const,
	getPaymentMethodType,
	InvoiceData,
	Keys,
	LegacyPlans,
	NewBusinessPlans,
	PaymentMethodType,
	PlanType,
	PlanTypeToName,
	UnsubscribeFailureReason,
} from "../api/common/TutanotaConstants"
import { SubscriptionActionButtons, SubscriptionSelector } from "./SubscriptionSelector"
import stream from "mithril/stream"
import { showProgressDialog } from "../gui/dialogs/ProgressDialog"
import type { DialogHeaderBarAttrs } from "../gui/base/DialogHeaderBar"
import type { CurrentPlanInfo } from "./SwitchSubscriptionDialogModel"
import { SwitchSubscriptionDialogModel } from "./SwitchSubscriptionDialogModel"
import { locator } from "../api/main/CommonLocator"
import { SwitchAccountTypeService } from "../api/entities/sys/Services.js"
import { BadRequestError, InvalidDataError, PreconditionFailedError } from "../api/common/error/RestError.js"
import { FeatureListProvider } from "./FeatureListProvider"
import { PaymentInterval, PriceAndConfigProvider } from "./PriceUtils"
import { assertNotNull, base64ExtToBase64, base64ToUint8Array, delay, downcast, lazy } from "@tutao/tutanota-utils"
import { showSwitchToBusinessInvoiceDataDialog } from "./SwitchToBusinessInvoiceDataDialog.js"
import { getByAbbreviation } from "../api/common/CountryList.js"
import { formatNameAndAddress } from "../api/common/utils/CommonFormatter.js"
import { LoginButtonAttrs } from "../gui/base/buttons/LoginButton.js"
import { showLeavingUserSurveyWizard } from "./LeavingUserSurveyWizard.js"
import { SURVEY_VERSION_NUMBER } from "./LeavingUserSurveyConstants.js"
import { isIOSApp } from "../api/common/Env.js"
import { MobilePaymentSubscriptionOwnership } from "../native/common/generatedipc/MobilePaymentSubscriptionOwnership.js"
import { showManageThroughAppStoreDialog } from "./PaymentViewer.js"
import { appStorePlanName, hasRunningAppStoreSubscription } from "./SubscriptionUtils.js"
import { MobilePaymentError } from "../api/common/error/MobilePaymentError.js"

/**
 * Allows cancelling the subscription (only private use) and switching the subscription to a different paid subscription.
 * Note: Only shown if the user is already a Premium user.
 */
export async function showSwitchDialog(
	customer: Customer,
	customerInfo: CustomerInfo,
	accountingInfo: AccountingInfo,
	lastBooking: Booking,
	acceptedPlans: AvailablePlanType[],
	reason: TranslationText | null,
): Promise<void> {
	if (hasRunningAppStoreSubscription(accountingInfo) && !isIOSApp()) {
		await showManageThroughAppStoreDialog()
		return
	}

	const [featureListProvider, priceAndConfigProvider] = await showProgressDialog(
		"pleaseWait_msg",
		Promise.all([
			FeatureListProvider.getInitializedInstance(locator.domainConfigProvider().getCurrentDomainConfig()),
			PriceAndConfigProvider.getInitializedInstance(null, locator.serviceExecutor, null),
		]),
	)
	const model = new SwitchSubscriptionDialogModel(customer, accountingInfo, await locator.logins.getUserController().getPlanType(), lastBooking)
	const cancelAction = () => {
		dialog.close()
	}

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
	const currentPlanInfo = model.currentPlanInfo
	const businessUse = stream(currentPlanInfo.businessUse)
	const paymentInterval = stream(PaymentInterval.Yearly) // always default to yearly
	const multipleUsersAllowed = model.multipleUsersStillSupportedLegacy()

	const dialog: Dialog = Dialog.largeDialog(headerBarAttrs, {
		view: () =>
			m(
				"#upgrade-account-dialog.pt",
				m(SubscriptionSelector, {
					options: {
						businessUse,
						paymentInterval: paymentInterval,
					},
					priceInfoTextId: priceAndConfigProvider.getPriceInfoMessage(),
					msg: reason,
					boxWidth: 230,
					boxHeight: 270,
					acceptedPlans: acceptedPlans,
					currentPlanType: currentPlanInfo.planType,
					allowSwitchingPaymentInterval: currentPlanInfo.paymentInterval !== PaymentInterval.Yearly,
					actionButtons: subscriptionActionButtons,
					featureListProvider: featureListProvider,
					priceAndConfigProvider,
					multipleUsersAllowed,
				}),
			),
	})
		.addShortcut({
			key: Keys.ESC,
			exec: cancelAction,
			help: "close_alt",
		})
		.setCloseHandler(cancelAction)
	const subscriptionActionButtons: SubscriptionActionButtons = {
		[PlanType.Free]: () =>
			({
				label: "pricing.select_action",
				onclick: () => onSwitchToFree(customer, dialog, currentPlanInfo),
			} satisfies LoginButtonAttrs),
		[PlanType.Revolutionary]: createPlanButton(dialog, PlanType.Revolutionary, currentPlanInfo, paymentInterval, accountingInfo),
		[PlanType.Legend]: createPlanButton(dialog, PlanType.Legend, currentPlanInfo, paymentInterval, accountingInfo),
		[PlanType.Essential]: createPlanButton(dialog, PlanType.Essential, currentPlanInfo, paymentInterval, accountingInfo),
		[PlanType.Advanced]: createPlanButton(dialog, PlanType.Advanced, currentPlanInfo, paymentInterval, accountingInfo),
		[PlanType.Unlimited]: createPlanButton(dialog, PlanType.Unlimited, currentPlanInfo, paymentInterval, accountingInfo),
	}
	dialog.show()
	return
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
			  })
			: null
	cancelSubscription(dialog, currentPlanInfo, customer, data)
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
				Dialog.message("appStoreSubscriptionError_msg", e.message)
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
): lazy<LoginButtonAttrs> {
	return () => ({
		label: "buy_action",
		onclick: async () => {
			// Show an extra dialog in the case that someone is upgrading from a legacy plan to a new plan because they can't revert.
			if (
				LegacyPlans.includes(currentPlanInfo.planType) &&
				!(await Dialog.confirm(() => lang.get("upgradePlan_msg", { "{plan}": PlanTypeToName[targetSubscription] })))
			) {
				return
			}
			await showProgressDialog("pleaseWait_msg", doSwitchToPaidPlan(accountingInfo, newPaymentInterval(), targetSubscription, dialog, currentPlanInfo))
		},
	})
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
				detailMsg = lang.get("deleteTemplateGroups_msg")
				break

			case UnsubscribeFailureReason.WHITELABEL_DOMAIN_ACTIVE:
			case BookingFailureReason.WHITELABEL_DOMAIN_ACTIVE:
				detailMsg = lang.get("whitelabelDomainExisting_msg")
				break

			case UnsubscribeFailureReason.HAS_CONTACT_LIST_GROUP:
				detailMsg = lang.get("contactListExisting_msg")
				break

			case UnsubscribeFailureReason.NOT_ENOUGH_CREDIT:
				return Dialog.message("insufficientBalanceError_msg")

			case UnsubscribeFailureReason.INVOICE_NOT_PAID:
				return Dialog.message("invoiceNotPaidSwitch_msg")

			case UnsubscribeFailureReason.ACTIVE_APPSTORE_SUBSCRIPTION:
				if (isIOSApp()) {
					return locator.mobilePaymentsFacade.showSubscriptionConfigView()
				} else {
					return showManageThroughAppStoreDialog()
				}

			default:
				throw e
		}

		return Dialog.message(() =>
			lang.get("accountSwitchNotPossible_msg", {
				"{detailMsg}": detailMsg,
			}),
		)
	}
}

async function tryDowngradePremiumToFree(customer: Customer, currentPlanInfo: CurrentPlanInfo, surveyData: SurveyData | null): Promise<PlanType> {
	const switchAccountTypeData = createSwitchAccountTypePostIn({
		accountType: AccountType.FREE,
		date: Const.CURRENT_DATE,
		customer: customer._id,
		specialPriceUserSingle: null,
		referralCode: null,
		plan: PlanType.Free,
		surveyData: surveyData,
	})
	try {
		await locator.serviceExecutor.post(SwitchAccountTypeService, switchAccountTypeData)
		await locator.customerFacade.switchPremiumToFreeGroup()
		return PlanType.Free
	} catch (e) {
		if (e instanceof PreconditionFailedError) {
			await handleSwitchAccountPreconditionFailed(e)
		} else if (e instanceof InvalidDataError) {
			await Dialog.message("accountSwitchTooManyActiveUsers_msg")
		} else if (e instanceof BadRequestError) {
			await Dialog.message("deactivatePremiumWithCustomDomainError_msg")
		} else {
			throw e
		}
		return currentPlanInfo.planType
	}
}

async function cancelSubscription(dialog: Dialog, currentPlanInfo: CurrentPlanInfo, customer: Customer, surveyData: SurveyData | null = null): Promise<void> {
	if (!(await Dialog.confirm("unsubscribeConfirm_msg"))) {
		return
	}

	try {
		await showProgressDialog("pleaseWait_msg", tryDowngradePremiumToFree(customer, currentPlanInfo, surveyData))
	} finally {
		dialog.close()
	}
}

async function switchSubscription(targetSubscription: PlanType, dialog: Dialog, currentPlanInfo: CurrentPlanInfo): Promise<PlanType> {
	if (targetSubscription === currentPlanInfo.planType) {
		return currentPlanInfo.planType
	}

	const userController = locator.logins.getUserController()
	const customer = await userController.loadCustomer()
	if (!customer.businessUse && NewBusinessPlans.includes(downcast(targetSubscription))) {
		const accountingInfo = await userController.loadAccountingInfo()
		const invoiceData: InvoiceData = {
			invoiceAddress: formatNameAndAddress(accountingInfo.invoiceName, accountingInfo.invoiceAddress),
			country: accountingInfo.invoiceCountry ? getByAbbreviation(accountingInfo.invoiceCountry) : null,
			vatNumber: accountingInfo.invoiceVatIdNo, // only for EU countries otherwise empty
		}
		const updatedInvoiceData = await showSwitchToBusinessInvoiceDataDialog(customer, invoiceData, accountingInfo)
		if (!updatedInvoiceData) {
			return currentPlanInfo.planType
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
		})

		try {
			await showProgressDialog("pleaseWait_msg", locator.serviceExecutor.post(SwitchAccountTypeService, postIn))
			return targetSubscription
		} catch (e) {
			if (e instanceof PreconditionFailedError) {
				await handleSwitchAccountPreconditionFailed(e)
				return currentPlanInfo.planType
			}
			throw e
		}
	} finally {
		dialog.close()
	}
}

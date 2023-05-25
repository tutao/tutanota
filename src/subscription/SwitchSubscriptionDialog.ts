import m from "mithril"
import { Dialog } from "../gui/base/Dialog"
import { lang, TranslationText } from "../misc/LanguageViewModel"
import { ButtonAttrs, ButtonType } from "../gui/base/Button.js"
import type { AccountingInfo, Booking, Customer, CustomerInfo, SwitchAccountTypePostIn } from "../api/entities/sys/TypeRefs.js"
import { createSwitchAccountTypePostIn } from "../api/entities/sys/TypeRefs.js"
import {
	AccountType,
	AvailablePlanType,
	BookingFailureReason,
	Const,
	FeatureType,
	InvoiceData,
	Keys,
	LegacyPlans,
	NewBusinessPlans,
	PlanType,
	UnsubscribeFailureReason,
} from "../api/common/TutanotaConstants"
import { SubscriptionActionButtons, SubscriptionSelector } from "./SubscriptionSelector"
import stream from "mithril/stream"
import { showProgressDialog } from "../gui/dialogs/ProgressDialog"
import type { DialogHeaderBarAttrs } from "../gui/base/DialogHeaderBar"
import type { CurrentPlanInfo } from "./SwitchSubscriptionDialogModel"
import { SwitchSubscriptionDialogModel } from "./SwitchSubscriptionDialogModel"
import { locator } from "../api/main/MainLocator"
import { SwitchAccountTypeService } from "../api/entities/sys/Services.js"
import { BadRequestError, InvalidDataError, PreconditionFailedError } from "../api/common/error/RestError.js"
import { FeatureListProvider } from "./FeatureListProvider"
import { PaymentInterval, PriceAndConfigProvider } from "./PriceUtils"
import { defer, DeferredObject, downcast, lazy } from "@tutao/tutanota-utils"
import { showSwitchToBusinessInvoiceDataDialog } from "./SwitchToBusinessInvoiceDataDialog.js"
import { formatNameAndAddress } from "../misc/Formatter.js"
import { getByAbbreviation } from "../api/common/CountryList.js"
import { isCustomizationEnabledForCustomer } from "../api/common/utils/Utils.js"

/**
 * Only shown if the user is already a Premium user. Allows cancelling the subscription (only private use) and switching the subscription to a different paid subscription.
 */
export async function showSwitchDialog(
	customer: Customer,
	customerInfo: CustomerInfo,
	accountingInfo: AccountingInfo,
	lastBooking: Booking,
	acceptedPlans: AvailablePlanType[],
	reason: TranslationText | null,
): Promise<PlanType> {
	const deferred = defer<PlanType>()
	const [featureListProvider, priceAndConfigProvider] = await showProgressDialog(
		"pleaseWait_msg",
		Promise.all([FeatureListProvider.getInitializedInstance(), PriceAndConfigProvider.getInitializedInstance(null, locator.serviceExecutor, null)]),
	)
	const model = new SwitchSubscriptionDialogModel(customer, accountingInfo, await locator.logins.getUserController().getPlanType())
	const cancelAction = () => {
		dialog.close()
		deferred.resolve(customerInfo.plan as PlanType)
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
					allowSwitchingPaymentInterval: currentPlanInfo.paymentInterval !== PaymentInterval.Yearly && LegacyPlans.includes(currentPlanInfo.planType),
					actionButtons: subscriptionActionButtons,
					featureListProvider: featureListProvider,
					priceAndConfigProvider,
					multipleUsersAllowed: isCustomizationEnabledForCustomer(customer, FeatureType.MultipleUsers),
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
				click: () => cancelSubscription(dialog, currentPlanInfo, deferred),
				type: ButtonType.Login,
			} as ButtonAttrs),

		[PlanType.Revolutionary]: createPlanButton(dialog, PlanType.Revolutionary, currentPlanInfo, deferred, paymentInterval, accountingInfo),
		[PlanType.Legend]: createPlanButton(dialog, PlanType.Legend, currentPlanInfo, deferred, paymentInterval, accountingInfo),
		[PlanType.Essential]: createPlanButton(dialog, PlanType.Essential, currentPlanInfo, deferred, paymentInterval, accountingInfo),
		[PlanType.Advanced]: createPlanButton(dialog, PlanType.Advanced, currentPlanInfo, deferred, paymentInterval, accountingInfo),
		[PlanType.Unlimited]: createPlanButton(dialog, PlanType.Unlimited, currentPlanInfo, deferred, paymentInterval, accountingInfo),
	}
	dialog.show()
	return deferred.promise
}

async function doSwitchPlan(
	accountingInfo: AccountingInfo,
	newPaymentInterval: PaymentInterval,
	targetSubscription: PlanType,
	dialog: Dialog,
	currentPlanInfo: CurrentPlanInfo,
	deferredPlan: DeferredObject<PlanType>,
) {
	if (currentPlanInfo.paymentInterval !== newPaymentInterval) {
		await locator.customerFacade.changePaymentInterval(accountingInfo, newPaymentInterval)
	}
	await switchSubscription(targetSubscription, dialog, currentPlanInfo).then((newPlan) => deferredPlan.resolve(newPlan))
}

function createPlanButton(
	dialog: Dialog,
	targetSubscription: PlanType,
	currentPlanInfo: CurrentPlanInfo,
	deferredPlan: DeferredObject<PlanType>,
	newPaymentInterval: stream<PaymentInterval>,
	accountingInfo: AccountingInfo,
): lazy<ButtonAttrs> {
	return () => ({
		label: "buy_action",
		click: async () => {
			await showProgressDialog(
				"pleaseWait_msg",
				doSwitchPlan(accountingInfo, newPaymentInterval(), targetSubscription, dialog, currentPlanInfo, deferredPlan),
			)
		},
		type: ButtonType.Login,
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

			case UnsubscribeFailureReason.HAS_CONTACT_FORM:
				detailMsg = lang.get("contactFormLegacy_msg")
				break

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

async function tryDowngradePremiumToFree(switchAccountTypeData: SwitchAccountTypePostIn, currentPlanInfo: CurrentPlanInfo): Promise<PlanType> {
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

async function cancelSubscription(dialog: Dialog, currentPlanInfo: CurrentPlanInfo, planPromise: DeferredObject<PlanType>): Promise<void> {
	if (!(await Dialog.confirm("unsubscribeConfirm_msg"))) {
		return
	}
	const switchAccountTypeData = createSwitchAccountTypePostIn()
	switchAccountTypeData.accountType = AccountType.FREE
	switchAccountTypeData.date = Const.CURRENT_DATE
	try {
		await showProgressDialog(
			"pleaseWait_msg",
			tryDowngradePremiumToFree(switchAccountTypeData, currentPlanInfo).then((newPlan) => planPromise.resolve(newPlan)),
		)
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
		const postIn = createSwitchAccountTypePostIn()
		postIn.accountType = AccountType.PREMIUM
		postIn.plan = targetSubscription
		postIn.date = Const.CURRENT_DATE
		postIn.referralCode = null

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

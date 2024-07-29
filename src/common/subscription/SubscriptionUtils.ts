import type { TranslationKey } from "../misc/LanguageViewModel"
import {
	AccountType,
	AvailablePlanType,
	BookingItemFeatureType,
	getClientType,
	getPaymentMethodType,
	NewPaidPlans,
	PaymentMethodType,
	PlanType,
	PlanTypeToName,
} from "../api/common/TutanotaConstants"
import type { AccountingInfo, Customer, CustomerInfo, PlanConfiguration } from "../api/entities/sys/TypeRefs.js"
import { Booking, createPaymentDataServiceGetData } from "../api/entities/sys/TypeRefs.js"
import { isEmpty, LazyLoaded } from "@tutao/tutanota-utils"
import { locator } from "../api/main/CommonLocator"
import { PaymentDataService } from "../api/entities/sys/Services"
import { ProgrammingError } from "../api/common/error/ProgrammingError.js"
import { IServiceExecutor } from "../api/common/ServiceRequest.js"
import { MobilePaymentSubscriptionOwnership } from "../native/common/generatedipc/MobilePaymentSubscriptionOwnership.js"

export const enum UpgradeType {
	Signup = "Signup",
	// during signup
	Initial = "Initial",
	// when logged into Free account
	Switch = "Switch", // switching in paid account
}

export function getCurrentCount(featureType: BookingItemFeatureType, booking: Booking | null): number {
	if (booking) {
		let bookingItem = booking.items.find((item) => item.featureType === featureType)
		return bookingItem ? Number(bookingItem.currentCount) : 0
	} else {
		return 0
	}
}

/**
 * Returns the available storage capacity for the customer in GB
 */
export function getTotalStorageCapacityPerCustomer(customer: Customer, customerInfo: CustomerInfo, lastBooking: Booking | null): number {
	let freeStorageCapacity = getIncludedStorageCapacityPerCustomer(customerInfo)

	if (customer.type === AccountType.PAID) {
		return Math.max(freeStorageCapacity, getCurrentCount(BookingItemFeatureType.Storage, lastBooking))
	} else {
		return freeStorageCapacity
	}
}

function getIncludedStorageCapacityPerCustomer(customerInfo: CustomerInfo): number {
	return Math.max(Number(customerInfo.includedStorageCapacity), Number(customerInfo.promotionStorageCapacity))
}

export function isWhitelabelActive(lastBooking: Booking | null, planConfig: PlanConfiguration): boolean {
	return getCurrentCount(BookingItemFeatureType.Whitelabel, lastBooking) !== 0 || planConfig.whitelabel
}

export function isSharingActive(lastBooking: Booking | null, planConfig: PlanConfiguration): boolean {
	return getCurrentCount(BookingItemFeatureType.Sharing, lastBooking) !== 0 || planConfig.sharing
}

function isBusinessFeatureActive(lastBooking: Booking | null): boolean {
	return getCurrentCount(BookingItemFeatureType.Business, lastBooking) !== 0
}

export function isEventInvitesActive(lastBooking: Booking | null, planConfig: PlanConfiguration): boolean {
	return isBusinessFeatureActive(lastBooking) || planConfig.eventInvites
}

export function isAutoResponderActive(lastBooking: Booking | null, planConfig: PlanConfiguration): boolean {
	return isBusinessFeatureActive(lastBooking) || planConfig.autoResponder
}

export type PaymentErrorCode =
	| "paypal.change"
	| "paypal.confirm_again"
	| "paypal.other_source"
	| "card.contact_bank"
	| "card.insufficient_funds"
	| "card.expired_card"
	| "card.change"
	| "card.3ds2_needed"
	| "card.3ds2_pending"
	| "card.3ds2_failed"
	| "card.cvv_invalid"
	| "card.number_invalid"
	| "card.date_invalid"

export function getPreconditionFailedPaymentMsg(data: string | null): TranslationKey {
	// the type is mostly there to keep multiple locations that switch over these in sync
	switch (data as PaymentErrorCode) {
		case "paypal.change":
			return "payChangeError_msg"

		case "paypal.confirm_again":
			return "payPaypalConfirmAgainError_msg"

		case "paypal.other_source":
			return "payPaypalChangeSourceError_msg"

		case "card.contact_bank":
			return "payCardContactBankError_msg"

		case "card.insufficient_funds":
			return "payCardInsufficientFundsError_msg"

		case "card.expired_card":
			return "payCardExpiredError_msg"

		case "card.change":
			return "payChangeError_msg"

		case "card.3ds2_needed":
			return "creditCardPaymentErrorVerificationNeeded_msg"

		case "card.3ds2_pending":
			return "creditCardPendingVerification_msg"

		case "card.3ds2_failed":
			return "creditCardVerificationFailed_msg"

		case "card.cvv_invalid":
			return "creditCardCVVInvalid_msg"

		case "card.number_invalid":
			return "creditCardNumberInvalid_msg"

		case "card.date_invalid":
			return "creditCardExprationDateInvalid_msg"

		default:
			return "payContactUsError_msg"
	}
}

export function getLazyLoadedPayPalUrl(): LazyLoaded<string> {
	return new LazyLoaded(async () => {
		const clientType = getClientType()
		const result = await locator.serviceExecutor.get(
			PaymentDataService,
			createPaymentDataServiceGetData({
				clientType,
			}),
		)
		return result.loginUrl
	})
}

/**
 * only to be invoked for PlanTypes where isNewPlan returns true
 */
export function toFeatureType(type: PlanType): BookingItemFeatureType {
	switch (type) {
		case PlanType.Revolutionary:
			return BookingItemFeatureType.Revolutionary
		case PlanType.Legend:
			return BookingItemFeatureType.Legend
		case PlanType.Essential:
			return BookingItemFeatureType.Essential
		case PlanType.Advanced:
			return BookingItemFeatureType.Advanced
		case PlanType.Unlimited:
			return BookingItemFeatureType.Unlimited
		case PlanType.Premium:
			return BookingItemFeatureType.LegacyUsers
		default:
			throw new Error(`can't convert ${type} to BookingItemFeatureType`)
	}
}

/**
 * Get plans that are available for purchase and that comply with the given criteria.
 * @param serviceExecutor
 * @param predicate
 */
export async function getAvailableMatchingPlans(
	serviceExecutor: IServiceExecutor,
	predicate: (configuration: PlanConfiguration) => boolean,
): Promise<Array<AvailablePlanType>> {
	const { PriceAndConfigProvider } = await import("../subscription/PriceUtils.js")
	const priceAndConfigProvider = await PriceAndConfigProvider.getInitializedInstance(null, serviceExecutor, null)
	return NewPaidPlans.filter((p) => {
		const config = priceAndConfigProvider.getPlanPricesForPlan(p).planConfiguration
		return predicate(config)
	})
}

/**
 * Filter for plans a customer can upgrade to that include a feature, assuming that the feature must be available on at least one plan.
 * @param predicate the criterion to select plans by
 * @param errorMessage the error message to throw in case no plan satisfies the criterion
 */
async function getAtLeastOneAvailableMatchingPlan(
	predicate: (configuration: PlanConfiguration) => boolean,
	errorMessage: string,
): Promise<Array<AvailablePlanType>> {
	const plans = await getAvailableMatchingPlans(locator.serviceExecutor, predicate)
	if (isEmpty(plans)) {
		throw new ProgrammingError(errorMessage)
	}
	return plans
}

/**
 * Get plans that a customer can upgrade to that include the Whitelabel feature.
 * @throws ProgrammingError if no plans include it.
 */
export async function getAvailablePlansWithWhitelabel(): Promise<Array<AvailablePlanType>> {
	return getAtLeastOneAvailableMatchingPlan((config) => config.whitelabel, "no available plan with the Whitelabel feature")
}

/**
 * Get plans that a customer can upgrade to that include the Whitelabel feature.
 * @throws ProgrammingError if no plans include it.
 */
export async function getAvailablePlansWithTemplates(): Promise<Array<AvailablePlanType>> {
	return getAtLeastOneAvailableMatchingPlan((config) => config.templates, "no available plan with the Templates feature")
}

/**
 * Get plans that a customer can upgrade to that include the Sharing feature.
 * @throws ProgrammingError if no plans include it.
 */
export async function getAvailablePlansWithSharing(): Promise<Array<AvailablePlanType>> {
	return getAtLeastOneAvailableMatchingPlan((config) => config.sharing, "no available plan with the Sharing feature")
}

/**
 * Get plans that a customer can upgrade to that include the Event Invites feature.
 */
export async function getAvailablePlansWithEventInvites(): Promise<Array<AvailablePlanType>> {
	return getAtLeastOneAvailableMatchingPlan((config) => config.eventInvites, "no available plan with the Event Invites feature")
}

/**
 * Get plans that a customer can upgrade to that include the Auto-Responder feature.
 * @throws ProgrammingError if no plans include it.
 */
export async function getAvailablePlansWithAutoResponder(): Promise<Array<AvailablePlanType>> {
	return getAtLeastOneAvailableMatchingPlan((config) => config.autoResponder, "no available plan with the Auto-Responder feature")
}

/**
 * Get plans that a customer can upgrade to that include the Contact List feature.
 * @throws ProgrammingError if no plans include it.
 */
export async function getAvailablePlansWithContactList(): Promise<Array<AvailablePlanType>> {
	return getAtLeastOneAvailableMatchingPlan((config) => config.contactList, "no available plan with the Contact List feature")
}

export async function getAvailablePlansWithCalendarInvites(): Promise<Array<AvailablePlanType>> {
	return getAtLeastOneAvailableMatchingPlan((config) => config.eventInvites, "no available plan with the Calendar Invite feature")
}

/** name of the plan/product how it is expected by iOS AppStore */
export function appStorePlanName(planType: PlanType): string {
	return PlanTypeToName[planType].toLowerCase()
}

/** does current user has an active (non-expired) AppStore subscription? */
export function hasRunningAppStoreSubscription(accountingInfo: AccountingInfo): boolean {
	return getPaymentMethodType(accountingInfo) === PaymentMethodType.AppStore && accountingInfo.appStoreSubscription != null
}

/** Check if the latest transaction using the current Store Account belongs to the user */
export async function queryAppStoreSubscriptionOwnership(userIdBytes: Uint8Array | null): Promise<MobilePaymentSubscriptionOwnership> {
	return await locator.mobilePaymentsFacade.queryAppStoreSubscriptionOwnership(userIdBytes)
}

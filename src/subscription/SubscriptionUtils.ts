import type { TranslationKey } from "../misc/LanguageViewModel"
import { AccountType, BookingItemFeatureType, Const } from "../api/common/TutanotaConstants"
import { getCurrentCount } from "./PriceUtils"
import { PreconditionFailedError } from "../api/common/error/RestError"
import type { Booking, Customer, CustomerInfo } from "../api/entities/sys/TypeRefs.js"
import { createBookingServiceData } from "../api/entities/sys/TypeRefs.js"
import { Dialog } from "../gui/base/Dialog"
import { ofClass } from "@tutao/tutanota-utils"
import { locator } from "../api/main/MainLocator"
import { BookingService } from "../api/entities/sys/Services"
import { SubscriptionConfig } from "./FeatureListProvider"

export const enum UpgradeType {
	Signup = "Signup",
	// during signup
	Initial = "Initial",
	// when logged into Free account
	Switch = "Switch", // switching in paid account
}

/**
 * Returns the available storage capacity for the customer in GB
 */
export function getTotalStorageCapacity(customer: Customer, customerInfo: CustomerInfo, lastBooking: Booking | null): number {
	let freeStorageCapacity = getIncludedStorageCapacity(customerInfo)

	if (customer.type === AccountType.PREMIUM) {
		return Math.max(freeStorageCapacity, getCurrentCount(BookingItemFeatureType.Storage, lastBooking))
	} else {
		return freeStorageCapacity
	}
}

export function getIncludedStorageCapacity(customerInfo: CustomerInfo): number {
	return Math.max(Number(customerInfo.includedStorageCapacity), Number(customerInfo.promotionStorageCapacity))
}

export function getTotalAliases(customer: Customer, customerInfo: CustomerInfo, lastBooking: Booking | null): number {
	let freeAliases = getIncludedAliases(customerInfo)

	if (customer.type === AccountType.PREMIUM) {
		return Math.max(freeAliases, getCurrentCount(BookingItemFeatureType.Alias, lastBooking))
	} else {
		return freeAliases
	}
}

export function getNbrOfUsers(lastBooking: Booking | null): number {
	return getCurrentCount(BookingItemFeatureType.Users, lastBooking)
}

export function getNbrOfContactForms(lastBooking: Booking | null): number {
	return getCurrentCount(BookingItemFeatureType.ContactForm, lastBooking)
}

export function isWhitelabelActive(lastBooking: Booking | null): boolean {
	return getCurrentCount(BookingItemFeatureType.Whitelabel, lastBooking) !== 0
}

export function isSharingActive(lastBooking: Booking | null): boolean {
	return getCurrentCount(BookingItemFeatureType.Sharing, lastBooking) !== 0
}

export function isBusinessFeatureActive(lastBooking: Booking | null): boolean {
	return getCurrentCount(BookingItemFeatureType.Business, lastBooking) !== 0
}

export function getIncludedAliases(customerInfo: CustomerInfo): number {
	return Math.max(Number(customerInfo.includedEmailAliases), Number(customerInfo.promotionEmailAliases))
}

export function hasAllFeaturesInPlan(currentSubscription: SubscriptionConfig, planSubscription: SubscriptionConfig): boolean {
	return !(
		currentSubscription.nbrOfAliases < planSubscription.nbrOfAliases ||
		currentSubscription.storageGb < planSubscription.storageGb ||
		(!currentSubscription.sharing && planSubscription.sharing) ||
		(!currentSubscription.whitelabel && planSubscription.whitelabel) ||
		(!currentSubscription.business && planSubscription.business)
	)
}

export function getPreconditionFailedPaymentMsg(data: string | null): TranslationKey {
	switch (data) {
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

const enum BookingFailureReason {
	TOO_MANY_DOMAINS = "bookingservice.too_many_domains",
	BUSINESS_USE = "bookingservice.business_use",
	TOO_MANY_ALIASES = "bookingservice.too_many_aliases",
	TOO_MUCH_STORAGE_USED = "bookingservice.too_much_storage_used",
	SHARED_GROUP_ACTIVE = "bookingservice.shared_group_active",
	WHITELABEL_DOMAIN_ACTIVE = "bookingservice.whitelabel_domain_active",
	BALANCE_INSUFFICIENT = "balance.insufficient",
	HAS_TEMPLATE_GROUP = "bookingservice.has_template_group",
}

/**
 * @returns True if it failed, false otherwise
 */
export function bookItem(featureType: BookingItemFeatureType, amount: number): Promise<boolean> {
	const bookingData = createBookingServiceData({
		amount: amount.toString(),
		featureType,
		date: Const.CURRENT_DATE,
	})
	return locator.serviceExecutor
		.post(BookingService, bookingData)
		.then(() => false)
		.catch(
			ofClass(PreconditionFailedError, (error) => {
				// error handling for cancelling a feature.
				switch (error.data) {
					case BookingFailureReason.BALANCE_INSUFFICIENT:
						return Dialog.message("insufficientBalanceError_msg").then(() => true)

					case BookingFailureReason.TOO_MANY_DOMAINS:
						return Dialog.message("tooManyCustomDomains_msg").then(() => true)

					case BookingFailureReason.BUSINESS_USE:
						return Dialog.message("featureRequiredForBusinessUse_msg").then(() => true)

					case BookingFailureReason.HAS_TEMPLATE_GROUP:
						return Dialog.message("deleteTemplateGroups_msg").then(() => true)

					default:
						return Dialog.message(getBookingItemErrorMsg(featureType)).then(() => true)
				}
			}),
		)
}

export function buyAliases(amount: number): Promise<boolean> {
	return bookItem(BookingItemFeatureType.Alias, amount)
}

export function buyStorage(amount: number): Promise<boolean> {
	return bookItem(BookingItemFeatureType.Storage, amount)
}

/**
 * @returns True if it failed, false otherwise
 */
export function buyWhitelabel(enable: boolean): Promise<boolean> {
	return bookItem(BookingItemFeatureType.Whitelabel, enable ? 1 : 0)
}

/**
 * @returns True if it failed, false otherwise
 */
export function buySharing(enable: boolean): Promise<boolean> {
	return bookItem(BookingItemFeatureType.Sharing, enable ? 1 : 0)
}

/**
 * @returns True if it failed, false otherwise
 */
export function buyBusiness(enable: boolean): Promise<boolean> {
	return bookItem(BookingItemFeatureType.Business, enable ? 1 : 0)
}

function getBookingItemErrorMsg(feature: BookingItemFeatureType): TranslationKey {
	switch (feature) {
		case BookingItemFeatureType.Alias:
			return "emailAliasesTooManyActivatedForBooking_msg"

		case BookingItemFeatureType.Storage:
			return "storageCapacityTooManyUsedForBooking_msg"

		case BookingItemFeatureType.Whitelabel:
			return "whitelabelDomainExisting_msg"

		case BookingItemFeatureType.Sharing:
			return "unknownError_msg"

		default:
			return "unknownError_msg"
	}
}

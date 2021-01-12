// @flow
import o from "ospec"
import type {Customer} from "../../../src/api/entities/sys/Customer"
import {createCustomer} from "../../../src/api/entities/sys/Customer"
import type {CustomerInfo} from "../../../src/api/entities/sys/CustomerInfo"
import {createCustomerInfo} from "../../../src/api/entities/sys/CustomerInfo"
import type {AccountingInfo} from "../../../src/api/entities/sys/AccountingInfo"
import {createAccountingInfo} from "../../../src/api/entities/sys/AccountingInfo"
import type {Booking} from "../../../src/api/entities/sys/Booking"
import {createBooking} from "../../../src/api/entities/sys/Booking"
import {createBookingItem} from "../../../src/api/entities/sys/BookingItem"
import type {BookingItemFeatureTypeEnum} from "../../../src/api/common/TutanotaConstants"
import {AccountType, BookingItemFeatureType} from "../../../src/api/common/TutanotaConstants"
import {SwitchSubscriptionDialogModel} from "../../../src/subscription/SwitchSubscriptionDialogModel"
import type {WorkerClient} from "../../../src/api/main/WorkerClient"
import {downcast, neverNull} from "../../../src/api/common/utils/Utils"
import type {PlanPrices} from "../../../src/api/entities/sys/PlanPrices"
import {PlanPricesTypeRef} from "../../../src/api/entities/sys/PlanPrices"
import {createPriceData} from "../../../src/api/entities/sys/PriceData"
import type {PriceServiceReturn} from "../../../src/api/entities/sys/PriceServiceReturn"
import {createPriceServiceReturn} from "../../../src/api/entities/sys/PriceServiceReturn"
import {createPriceItemData} from "../../../src/api/entities/sys/PriceItemData"
import type {PriceData} from "../../../src/api/entities/sys/PriceData"
import {getCurrentCount} from "../../../src/subscription/PriceUtils"


const BookingItemPriceType = Object.freeze({
	Single: "0",
	Package: "1",
	Total: "2",
})

o.spec("SwitchSubscriptionModelTest", function () {
	const DEFAULT_PREMIUM_PRICE: PlanPrices = {
		_id: neverNull(null),
		_type: PlanPricesTypeRef,
		additionalUserPriceMonthly: "1.2",
		contactFormPriceMonthly: "24",
		firstYearDiscount: "0",
		includedAliases: "5",
		includedStorage: "1",
		monthlyPrice: "1.2",
		monthlyReferencePrice: "1.2"
	}
	const DEFAULT_PREMIUM_BUSINESS_PRICE: PlanPrices = {
		_id: neverNull(null),
		_type: PlanPricesTypeRef,
		additionalUserPriceMonthly: "2.4",
		contactFormPriceMonthly: "24",
		firstYearDiscount: "0",
		includedAliases: "5",
		includedStorage: "1",
		monthlyPrice: "2.4",
		monthlyReferencePrice: "2.4"
	}
	const DEFAULT_TEAMS_PRICE: PlanPrices = {
		_id: neverNull(null),
		_type: PlanPricesTypeRef,
		additionalUserPriceMonthly: "2.4",
		contactFormPriceMonthly: "24",
		firstYearDiscount: "0",
		includedAliases: "5",
		includedStorage: "10",
		monthlyPrice: "4.8",
		monthlyReferencePrice: "4.8"
	}
	const DEFAULT_TEAMS_BUSINESS_PRICE: PlanPrices = {
		_id: neverNull(null),
		_type: PlanPricesTypeRef,
		additionalUserPriceMonthly: "3.6",
		contactFormPriceMonthly: "24",
		firstYearDiscount: "0",
		includedAliases: "5",
		includedStorage: "10",
		monthlyPrice: "6",
		monthlyReferencePrice: "6"
	}
	const DEFAULT_PRO_PRICE: PlanPrices = {
		_id: neverNull(null),
		_type: PlanPricesTypeRef,
		additionalUserPriceMonthly: "4.8",
		contactFormPriceMonthly: "24",
		firstYearDiscount: "0",
		includedAliases: "20",
		includedStorage: "10",
		monthlyPrice: "8.4",
		monthlyReferencePrice: "8.4"
	}

	let _customer: Customer
	let _customerInfo: CustomerInfo
	let _accountingInfo: AccountingInfo
	let _lastBooking: Booking
	let _workerMock: WorkerClient

	let model: SwitchSubscriptionDialogModel

	o.spec("loadSwitchSubscriptionPrices", function () {
		o.beforeEach(function () {
			createPremiumCustomerInstances()
			_workerMock = createWorkerMock()
		})

		o("switch premium to default", async function () {
			model = new SwitchSubscriptionDialogModel(_workerMock, _customer, _customerInfo, _accountingInfo, _lastBooking)
			const subscriptionPlanPrices = await model.loadSwitchSubscriptionPrices()
			o(subscriptionPlanPrices.Premium).deepEquals(DEFAULT_PREMIUM_PRICE)
			o(subscriptionPlanPrices.PremiumBusiness).deepEquals(DEFAULT_PREMIUM_BUSINESS_PRICE)
			o(subscriptionPlanPrices.Teams).deepEquals(DEFAULT_TEAMS_PRICE)
			o(subscriptionPlanPrices.TeamsBusiness).deepEquals(DEFAULT_TEAMS_BUSINESS_PRICE)
			o(subscriptionPlanPrices.Pro).deepEquals(DEFAULT_PRO_PRICE)
		})

		o("switch premium business to default", async function () {
			setBookingItem(_lastBooking, BookingItemFeatureType.Business, 1)
			model = new SwitchSubscriptionDialogModel(_workerMock, _customer, _customerInfo, _accountingInfo, _lastBooking)
			const subscriptionPlanPrices = await model.loadSwitchSubscriptionPrices()
			o(subscriptionPlanPrices.Premium).deepEquals(DEFAULT_PREMIUM_PRICE)
			o(subscriptionPlanPrices.PremiumBusiness).deepEquals(DEFAULT_PREMIUM_BUSINESS_PRICE)
			// o(subscriptionPlanPrices.Teams).deepEquals(DEFAULT_TEAMS_PRICE) // business feature will not be deactivated
			o(subscriptionPlanPrices.TeamsBusiness).deepEquals(DEFAULT_TEAMS_BUSINESS_PRICE)
			o(subscriptionPlanPrices.Pro).deepEquals(DEFAULT_PRO_PRICE)
		})

		o("switch teams to default", async function () {
			setBookingItem(_lastBooking, BookingItemFeatureType.Sharing, 1)
			setBookingItem(_lastBooking, BookingItemFeatureType.Storage, 10)
			model = new SwitchSubscriptionDialogModel(_workerMock, _customer, _customerInfo, _accountingInfo, _lastBooking)
			const subscriptionPlanPrices = await model.loadSwitchSubscriptionPrices()
			o(subscriptionPlanPrices.Premium).deepEquals(DEFAULT_PREMIUM_PRICE)
			o(subscriptionPlanPrices.PremiumBusiness).deepEquals(DEFAULT_PREMIUM_BUSINESS_PRICE)
			o(subscriptionPlanPrices.Teams).deepEquals(DEFAULT_TEAMS_PRICE)
			o(subscriptionPlanPrices.TeamsBusiness).deepEquals(DEFAULT_TEAMS_BUSINESS_PRICE)
			o(subscriptionPlanPrices.Pro).deepEquals(DEFAULT_PRO_PRICE)
		})

		o("switch teams business to default", async function () {
			setBookingItem(_lastBooking, BookingItemFeatureType.Sharing, 1)
			setBookingItem(_lastBooking, BookingItemFeatureType.Business, 1)
			setBookingItem(_lastBooking, BookingItemFeatureType.Storage, 10)
			model = new SwitchSubscriptionDialogModel(_workerMock, _customer, _customerInfo, _accountingInfo, _lastBooking)
			const subscriptionPlanPrices = await model.loadSwitchSubscriptionPrices()
			o(subscriptionPlanPrices.Premium).deepEquals(DEFAULT_PREMIUM_PRICE)
			o(subscriptionPlanPrices.PremiumBusiness).deepEquals(DEFAULT_PREMIUM_BUSINESS_PRICE)
			o(subscriptionPlanPrices.Teams).deepEquals(DEFAULT_TEAMS_PRICE)
			o(subscriptionPlanPrices.TeamsBusiness).deepEquals(DEFAULT_TEAMS_BUSINESS_PRICE)
			o(subscriptionPlanPrices.Pro).deepEquals(DEFAULT_PRO_PRICE)
		})

		o("switch pro to default", async function () {
			setBookingItem(_lastBooking, BookingItemFeatureType.Sharing, 1)
			setBookingItem(_lastBooking, BookingItemFeatureType.Business, 1)
			setBookingItem(_lastBooking, BookingItemFeatureType.Whitelabel, 1)
			setBookingItem(_lastBooking, BookingItemFeatureType.Storage, 10)
			setBookingItem(_lastBooking, BookingItemFeatureType.Alias, 20)
			model = new SwitchSubscriptionDialogModel(_workerMock, _customer, _customerInfo, _accountingInfo, _lastBooking)
			const subscriptionPlanPrices = await model.loadSwitchSubscriptionPrices()
			o(subscriptionPlanPrices.Premium).deepEquals(DEFAULT_PREMIUM_PRICE)
			o(subscriptionPlanPrices.PremiumBusiness).deepEquals(DEFAULT_PREMIUM_BUSINESS_PRICE)
			o(subscriptionPlanPrices.Teams).deepEquals(DEFAULT_TEAMS_PRICE)
			o(subscriptionPlanPrices.TeamsBusiness).deepEquals(DEFAULT_TEAMS_BUSINESS_PRICE)
			o(subscriptionPlanPrices.Pro).deepEquals(DEFAULT_PRO_PRICE)
		})

		o("switch from premium + 100gb", async function () {
			const upgradedPremiumPrices: PlanPrices = {
				_id: neverNull(null),
				_type: PlanPricesTypeRef,
				additionalUserPriceMonthly: "1.2",
				contactFormPriceMonthly: "24",
				firstYearDiscount: "0",
				includedAliases: "5",
				includedStorage: "100",
				monthlyPrice: "13.2",
				monthlyReferencePrice: "13.2"
			}
			const upgradedPremiumBusinessPrices: PlanPrices = {
				_id: neverNull(null),
				_type: PlanPricesTypeRef,
				additionalUserPriceMonthly: "2.4",
				contactFormPriceMonthly: "24",
				firstYearDiscount: "0",
				includedAliases: "5",
				includedStorage: "100",
				monthlyPrice: "14.4",
				monthlyReferencePrice: "14.4"
			}
			const upgradedTeamsPrices: PlanPrices = {
				_id: neverNull(null),
				_type: PlanPricesTypeRef,
				additionalUserPriceMonthly: "2.4",
				contactFormPriceMonthly: "24",
				firstYearDiscount: "0",
				includedAliases: "5",
				includedStorage: "100",
				monthlyPrice: "14.4",
				monthlyReferencePrice: "14.4"
			}
			const upgradedTeamBusinessPrices: PlanPrices = {
				_id: neverNull(null),
				_type: PlanPricesTypeRef,
				additionalUserPriceMonthly: "3.6",
				contactFormPriceMonthly: "24",
				firstYearDiscount: "0",
				includedAliases: "5",
				includedStorage: "100",
				monthlyPrice: "15.6",
				monthlyReferencePrice: "15.6"
			}
			const upgradedProPrices: PlanPrices = {
				_id: neverNull(null),
				_type: PlanPricesTypeRef,
				additionalUserPriceMonthly: "4.8",
				contactFormPriceMonthly: "24",
				firstYearDiscount: "0",
				includedAliases: "20",
				includedStorage: "100",
				monthlyPrice: "18",
				monthlyReferencePrice: "18"
			}
			setBookingItem(_lastBooking, BookingItemFeatureType.Storage, 100)
			model = new SwitchSubscriptionDialogModel(_workerMock, _customer, _customerInfo, _accountingInfo, _lastBooking)
			const subscriptionPlanPrices = await model.loadSwitchSubscriptionPrices()
			o(subscriptionPlanPrices.Premium).deepEquals(upgradedPremiumPrices)
			o(subscriptionPlanPrices.PremiumBusiness).deepEquals(upgradedPremiumBusinessPrices)
			o(subscriptionPlanPrices.Teams).deepEquals(upgradedTeamsPrices)
			o(subscriptionPlanPrices.TeamsBusiness).deepEquals(upgradedTeamBusinessPrices)
			o(subscriptionPlanPrices.Pro).deepEquals(upgradedProPrices)
		})

		o("switch from teams + whitelabel", async function () {
			const upgradedTeamsPrices: PlanPrices = {
				_id: neverNull(null),
				_type: PlanPricesTypeRef,
				additionalUserPriceMonthly: "3.6",
				contactFormPriceMonthly: "24",
				firstYearDiscount: "0",
				includedAliases: "5",
				includedStorage: "10",
				monthlyPrice: "6",
				monthlyReferencePrice: "6"
			}
			const upgradedTeamBusinessPrices: PlanPrices = {
				_id: neverNull(null),
				_type: PlanPricesTypeRef,
				additionalUserPriceMonthly: "4.8",
				contactFormPriceMonthly: "24",
				firstYearDiscount: "0",
				includedAliases: "5",
				includedStorage: "10",
				monthlyPrice: "7.2",
				monthlyReferencePrice: "7.2"
			}
			setBookingItem(_lastBooking, BookingItemFeatureType.Whitelabel, 1)
			setBookingItem(_lastBooking, BookingItemFeatureType.Sharing, 1)
			setBookingItem(_lastBooking, BookingItemFeatureType.Storage, 10)
			model = new SwitchSubscriptionDialogModel(_workerMock, _customer, _customerInfo, _accountingInfo, _lastBooking)
			const subscriptionPlanPrices = await model.loadSwitchSubscriptionPrices()
			o(subscriptionPlanPrices.Premium).deepEquals(DEFAULT_PREMIUM_PRICE)
			o(subscriptionPlanPrices.PremiumBusiness).deepEquals(DEFAULT_PREMIUM_BUSINESS_PRICE)
			o(subscriptionPlanPrices.Teams).deepEquals(upgradedTeamsPrices)
			o(subscriptionPlanPrices.TeamsBusiness).deepEquals(upgradedTeamBusinessPrices)
			o(subscriptionPlanPrices.Pro).deepEquals(DEFAULT_PRO_PRICE)
		})

		o("switch from premium + 10gb + whitelabel", async function () {
			const upgradedPremiumPrices: PlanPrices = {
				_id: neverNull(null),
				_type: PlanPricesTypeRef,
				additionalUserPriceMonthly: "2.4",
				contactFormPriceMonthly: "24",
				firstYearDiscount: "0",
				includedAliases: "5",
				includedStorage: "10",
				monthlyPrice: "4.8",
				monthlyReferencePrice: "4.8"
			}
			const upgradedPremiumBusinessPrices: PlanPrices = {
				_id: neverNull(null),
				_type: PlanPricesTypeRef,
				additionalUserPriceMonthly: "3.6",
				contactFormPriceMonthly: "24",
				firstYearDiscount: "0",
				includedAliases: "5",
				includedStorage: "10",
				monthlyPrice: "6",
				monthlyReferencePrice: "6"
			}
			const upgradedTeamsPrices: PlanPrices = {
				_id: neverNull(null),
				_type: PlanPricesTypeRef,
				additionalUserPriceMonthly: "3.6",
				contactFormPriceMonthly: "24",
				firstYearDiscount: "0",
				includedAliases: "5",
				includedStorage: "10",
				monthlyPrice: "6",
				monthlyReferencePrice: "6"
			}
			const upgradedTeamBusinessPrices: PlanPrices = {
				_id: neverNull(null),
				_type: PlanPricesTypeRef,
				additionalUserPriceMonthly: "4.8",
				contactFormPriceMonthly: "24",
				firstYearDiscount: "0",
				includedAliases: "5",
				includedStorage: "10",
				monthlyPrice: "7.2",
				monthlyReferencePrice: "7.2"
			}
			setBookingItem(_lastBooking, BookingItemFeatureType.Storage, 10)
			setBookingItem(_lastBooking, BookingItemFeatureType.Whitelabel, 1)
			model = new SwitchSubscriptionDialogModel(_workerMock, _customer, _customerInfo, _accountingInfo, _lastBooking)
			const subscriptionPlanPrices = await model.loadSwitchSubscriptionPrices()
			o(subscriptionPlanPrices.Premium).deepEquals(upgradedPremiumPrices)
			o(subscriptionPlanPrices.PremiumBusiness).deepEquals(upgradedPremiumBusinessPrices)
			o(subscriptionPlanPrices.Teams).deepEquals(upgradedTeamsPrices)
			o(subscriptionPlanPrices.TeamsBusiness).deepEquals(upgradedTeamBusinessPrices)
			o(subscriptionPlanPrices.Pro).deepEquals(DEFAULT_PRO_PRICE)
		})

		o("switch from pro without business (~ Teams...)", async function () {
			const upgradedTeamsPrices: PlanPrices = {
				_id: neverNull(null),
				_type: PlanPricesTypeRef,
				additionalUserPriceMonthly: "3.6",
				contactFormPriceMonthly: "24",
				firstYearDiscount: "0",
				includedAliases: "20",
				includedStorage: "10",
				monthlyPrice: "7.2",
				monthlyReferencePrice: "7.2"
			}
			setBookingItem(_lastBooking, BookingItemFeatureType.Sharing, 1)
			setBookingItem(_lastBooking, BookingItemFeatureType.Whitelabel, 1)
			setBookingItem(_lastBooking, BookingItemFeatureType.Storage, 10)
			setBookingItem(_lastBooking, BookingItemFeatureType.Alias, 20)
			model = new SwitchSubscriptionDialogModel(_workerMock, _customer, _customerInfo, _accountingInfo, _lastBooking)
			const subscriptionPlanPrices = await model.loadSwitchSubscriptionPrices()
			o(subscriptionPlanPrices.Premium).deepEquals(DEFAULT_PREMIUM_PRICE)
			o(subscriptionPlanPrices.PremiumBusiness).deepEquals(DEFAULT_PREMIUM_BUSINESS_PRICE)
			o(subscriptionPlanPrices.Teams).deepEquals(upgradedTeamsPrices)
			o(subscriptionPlanPrices.TeamsBusiness).deepEquals(DEFAULT_PRO_PRICE) // same as new Pro
			o(subscriptionPlanPrices.Pro).deepEquals(DEFAULT_PRO_PRICE)
		})

		o("switch from teams with 3 users", async function () {
			const upgradedPremiumPrices: PlanPrices = {
				_id: neverNull(null),
				_type: PlanPricesTypeRef,
				additionalUserPriceMonthly: "1.2",
				contactFormPriceMonthly: "24",
				firstYearDiscount: "0",
				includedAliases: "5",
				includedStorage: "1",
				monthlyPrice: "3.6",
				monthlyReferencePrice: "3.6"
			}
			const upgradedPremiumBusinessPrices: PlanPrices = {
				_id: neverNull(null),
				_type: PlanPricesTypeRef,
				additionalUserPriceMonthly: "2.4",
				contactFormPriceMonthly: "24",
				firstYearDiscount: "0",
				includedAliases: "5",
				includedStorage: "1",
				monthlyPrice: "7.2",
				monthlyReferencePrice: "7.2"
			}
			const upgradedTeamsPrices: PlanPrices = {
				_id: neverNull(null),
				_type: PlanPricesTypeRef,
				additionalUserPriceMonthly: "2.4",
				contactFormPriceMonthly: "24",
				firstYearDiscount: "0",
				includedAliases: "5",
				includedStorage: "10",
				monthlyPrice: "9.6",
				monthlyReferencePrice: "9.6"
			}
			const upgradedTeamBusinessPrices: PlanPrices = {
				_id: neverNull(null),
				_type: PlanPricesTypeRef,
				additionalUserPriceMonthly: "3.6",
				contactFormPriceMonthly: "24",
				firstYearDiscount: "0",
				includedAliases: "5",
				includedStorage: "10",
				monthlyPrice: "13.2",
				monthlyReferencePrice: "13.2"
			}
			const upgradedProPrices: PlanPrices = {
				_id: neverNull(null),
				_type: PlanPricesTypeRef,
				additionalUserPriceMonthly: "4.8",
				contactFormPriceMonthly: "24",
				firstYearDiscount: "0",
				includedAliases: "20",
				includedStorage: "10",
				monthlyPrice: "18",
				monthlyReferencePrice: "18"
			}
			setBookingItem(_lastBooking, BookingItemFeatureType.Users, 3)
			setBookingItem(_lastBooking, BookingItemFeatureType.Storage, 10)
			setBookingItem(_lastBooking, BookingItemFeatureType.Sharing, 1)
			model = new SwitchSubscriptionDialogModel(_workerMock, _customer, _customerInfo, _accountingInfo, _lastBooking)
			const subscriptionPlanPrices = await model.loadSwitchSubscriptionPrices()
			o(subscriptionPlanPrices.Premium).deepEquals(upgradedPremiumPrices)
			o(subscriptionPlanPrices.PremiumBusiness).deepEquals(upgradedPremiumBusinessPrices)
			o(subscriptionPlanPrices.Teams).deepEquals(upgradedTeamsPrices)
			o(subscriptionPlanPrices.TeamsBusiness).deepEquals(upgradedTeamBusinessPrices)
			o(subscriptionPlanPrices.Pro).deepEquals(upgradedProPrices)
		})
	})

	function createPremiumCustomerInstances() {
		_customer = createCustomer({businessUse: false, type: AccountType.PREMIUM})
		_customerInfo = createCustomerInfo({includedEmailAliases: "5", includedStorageCapacity: "1"})
		_accountingInfo = createAccountingInfo({paymentInterval: "12"})
		_lastBooking = createBooking()
		// always create user booking
		_lastBooking.items.push(createBookingItem({
			featureType: BookingItemFeatureType.Users,
			currentCount: "1",
			maxCount: "1",
			price: "1.20"
		}))
	}

	function setBookingItem(booking: Booking, featureType: BookingItemFeatureTypeEnum, count: number) {
		const featureItem = booking.items.find(item => item.featureType === featureType)
		if (featureItem) {
			featureItem.currentCount = String(count)
			featureItem.maxCount = String(count)
			featureItem.price = getFeatureTypePrice(featureType, count)
		} else {
			booking.items.push(createBookingItem({
				featureType: featureType,
				currentCount: String(count),
				maxCount: String(count),
				price: getFeatureTypePrice(featureType, count)
			}))
		}
	}

	function createWorkerMock(): WorkerClient {
		return downcast({
			getPrice: function (featureType: BookingItemFeatureTypeEnum, count: number, reactivate: boolean): Promise<PriceServiceReturn> {
				const currentPriceData = getPriceData(_lastBooking)
				const futureBooking = JSON.parse(JSON.stringify(_lastBooking))
				setBookingItem(futureBooking, featureType, count)
				const futurePriceData = getPriceData(futureBooking)
				return Promise.resolve(createPriceServiceReturn({
						currentPriceNextPeriod: currentPriceData,
						currentPriceThisPeriod: currentPriceData,
						futurePriceNextPeriod: futurePriceData,
					}
				))
			}
		})
	}

})

function getPriceData(booking: Booking): PriceData {
	const currentTotalPrice = booking.items.reduce((total, item) => {
		const featureType: BookingItemFeatureTypeEnum = downcast(item.featureType)
		const singleType = isSingleType(featureType)
		const count = Number(item.currentCount)
		const itemPrice = Number(item.price)
		if (count === 0) {
			return total
		} else if (featureType === BookingItemFeatureType.Sharing
			|| featureType === BookingItemFeatureType.Business
			|| featureType === BookingItemFeatureType.Whitelabel) {
			const userCount = getCurrentCount(BookingItemFeatureType.Users, booking)
			return total + itemPrice * userCount
		} else if (singleType) {
			return total + itemPrice * count
		} else { // package price
			return total + itemPrice
		}
	}, 0)
	return createPriceData({
		price: String(currentTotalPrice),
		items: booking.items.map((item) => {
			return createPriceItemData({
				count: item.currentCount,
				featureType: item.featureType,
				price: item.price,
				singleType: isSingleType(downcast(item.featureType))
			})
		}),
		paymentInterval: booking.paymentInterval
	})
}

function isSingleType(featureType: BookingItemFeatureTypeEnum): boolean {
	switch (featureType) {
		case BookingItemFeatureType.Users:
		case BookingItemFeatureType.Sharing:
		case BookingItemFeatureType.Business:
		case BookingItemFeatureType.Whitelabel:
		case BookingItemFeatureType.ContactForm:
			return true
		case  BookingItemFeatureType.Alias:
		case BookingItemFeatureType.Storage:
			return false
		default:
			throw new Error("invalid feature type: " + featureType)
	}
}

function getFeatureTypePrice(featureType: BookingItemFeatureTypeEnum, count: number): NumberString {
	switch (featureType) {
		case BookingItemFeatureType.Users:
			return "1.20"
		case BookingItemFeatureType.Alias:
			if (count === 0) {
				return "0"
			} else if (count === 20) {
				return "1.20"
			} else if (count === 40) {
				return "2.40"
			} else if (count === 100) {
				return "4.80"
			} else {
				throw new Error("invalid alias count: " + count)
			}
		case BookingItemFeatureType.Storage: {
			if (count === 0) {
				return "0"
			} else if (count === 10) {
				return "2.40"
			} else if (count === 100) {
				return "12"
			} else if (count === 1000) {
				return "60"
			} else {
				throw new Error("invalid storage count: " + count)
			}
		}
		case BookingItemFeatureType.Sharing:
			return count === 1 ? "1.20" : "0"
		case BookingItemFeatureType.Business:
			return count === 1 ? "1.20" : "0"
		case BookingItemFeatureType.Whitelabel:
			return count === 1 ? "1.20" : "0"
		case BookingItemFeatureType.ContactForm:
			return "24.0"
		default:
			throw new Error("invalid feature type: " + featureType)
	}
}


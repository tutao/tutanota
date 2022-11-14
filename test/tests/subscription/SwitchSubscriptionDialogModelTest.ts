import o from "ospec"
import type {AccountingInfo, Booking, Customer, CustomerInfo, PlanPrices, PriceData, PriceServiceReturn} from "../../../src/api/entities/sys/TypeRefs.js"
import {
	createAccountingInfo,
	createBooking,
	createBookingItem,
	createCustomer,
	createCustomerInfo,
	createPriceData,
	createPriceItemData,
	createPriceServiceReturn,
	PlanPricesTypeRef
} from "../../../src/api/entities/sys/TypeRefs.js"
import {AccountType, BookingItemFeatureType} from "../../../src/api/common/TutanotaConstants.js"
import {SwitchSubscriptionDialogModel} from "../../../src/subscription/SwitchSubscriptionDialogModel.js"
import {downcast, neverNull} from "@tutao/tutanota-utils"
import {getCurrentCount, PriceAndConfigProvider} from "../../../src/subscription/PriceUtils.js"
import {BookingFacade} from "../../../src/api/worker/facades/BookingFacade.js"
import {matchers, object, when} from "testdouble"
import {SubscriptionConfig, SubscriptionType} from "../../../src/subscription/SubscriptionDataProvider"
import {createPriceMock} from "./PriceUtilsTest"

const SUBSCRIPTION_CONFIG = {
	"Free": {
		"nbrOfAliases": 0,
		"orderNbrOfAliases": 0,
		"storageGb": 1,
		"orderStorageGb": 0,
		"sharing": false,
		"business": false,
		"whitelabel": false
	},
	"Premium": {
		"nbrOfAliases": 5,
		"orderNbrOfAliases": 0,
		"storageGb": 1,
		"orderStorageGb": 0,
		"sharing": false,
		"business": false,
		"whitelabel": false
	},
	"PremiumBusiness": {
		"nbrOfAliases": 5,
		"orderNbrOfAliases": 0,
		"storageGb": 1,
		"orderStorageGb": 0,
		"sharing": false,
		"business": true,
		"whitelabel": false
	},
	"Teams": {
		"nbrOfAliases": 5,
		"orderNbrOfAliases": 0,
		"storageGb": 10,
		"orderStorageGb": 10,
		"sharing": true,
		"business": false,
		"whitelabel": false
	},
	"TeamsBusiness": {
		"nbrOfAliases": 5,
		"orderNbrOfAliases": 0,
		"storageGb": 10,
		"orderStorageGb": 10,
		"sharing": true,
		"business": true,
		"whitelabel": false
	},
	"Pro": {
		"nbrOfAliases": 20,
		"orderNbrOfAliases": 20,
		"storageGb": 10,
		"orderStorageGb": 10,
		"sharing": true,
		"business": true,
		"whitelabel": true
	}
} as { [K in SubscriptionType]: SubscriptionConfig }

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
		monthlyReferencePrice: "1.2",
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
		monthlyReferencePrice: "2.4",
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
		monthlyReferencePrice: "4.8",
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
		monthlyReferencePrice: "6",
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
		monthlyReferencePrice: "8.4",
	}

	let customer: Customer

	let customerInfo: CustomerInfo

	let accountingInfo: AccountingInfo

	let lastBooking: Booking

	let bookingMock: BookingFacade
	let model: SwitchSubscriptionDialogModel

	let planPricesAndConfigMock: PriceAndConfigProvider
	o.spec("loadSwitchSubscriptionPrices", function () {
		o.beforeEach(function () {
			({customer, customerInfo, accountingInfo, lastBooking} = createPremiumCustomerInstances())
			bookingMock = createbookingMock(lastBooking)
			planPricesAndConfigMock = object()
			when(planPricesAndConfigMock.getSubscriptionConfig(SubscriptionType.Free)).thenReturn(SUBSCRIPTION_CONFIG[SubscriptionType.Free])
			when(planPricesAndConfigMock.getSubscriptionConfig(SubscriptionType.Premium)).thenReturn(SUBSCRIPTION_CONFIG[SubscriptionType.Premium])
			when(planPricesAndConfigMock.getSubscriptionConfig(SubscriptionType.Teams)).thenReturn(SUBSCRIPTION_CONFIG[SubscriptionType.Teams])
			when(planPricesAndConfigMock.getSubscriptionConfig(SubscriptionType.PremiumBusiness)).thenReturn(SUBSCRIPTION_CONFIG[SubscriptionType.PremiumBusiness])
			when(planPricesAndConfigMock.getSubscriptionConfig(SubscriptionType.TeamsBusiness)).thenReturn(SUBSCRIPTION_CONFIG[SubscriptionType.TeamsBusiness])
			when(planPricesAndConfigMock.getSubscriptionConfig(SubscriptionType.Pro)).thenReturn(SUBSCRIPTION_CONFIG[SubscriptionType.Pro])
			when(planPricesAndConfigMock.getSubscriptionType(matchers.anything(), matchers.anything(), matchers.anything())).thenReturn(SubscriptionType.Premium)
		})
		o("switch premium to default", async function () {
			model = new SwitchSubscriptionDialogModel(
				bookingMock,
				customer,
				customerInfo,
				accountingInfo,
				lastBooking,
				planPricesAndConfigMock,
			)
			const subscriptionPlanPrices = await model.loadSwitchSubscriptionPrices()
			o(subscriptionPlanPrices.Premium).deepEquals(DEFAULT_PREMIUM_PRICE)
			o(subscriptionPlanPrices.PremiumBusiness).deepEquals(DEFAULT_PREMIUM_BUSINESS_PRICE)
			o(subscriptionPlanPrices.Teams).deepEquals(DEFAULT_TEAMS_PRICE)
			o(subscriptionPlanPrices.TeamsBusiness).deepEquals(DEFAULT_TEAMS_BUSINESS_PRICE)
			o(subscriptionPlanPrices.Pro).deepEquals(DEFAULT_PRO_PRICE)
		})
		o("switch premium business to default", async function () {
			setBookingItem(lastBooking, BookingItemFeatureType.Business, 1)
			when(planPricesAndConfigMock.getSubscriptionType(matchers.anything(), matchers.anything(), matchers.anything())).thenReturn(SubscriptionType.PremiumBusiness)
			model = new SwitchSubscriptionDialogModel(
				bookingMock,
				customer,
				customerInfo,
				accountingInfo,
				lastBooking,
				planPricesAndConfigMock,
			)
			const subscriptionPlanPrices = await model.loadSwitchSubscriptionPrices()
			o(subscriptionPlanPrices.Premium).deepEquals(DEFAULT_PREMIUM_PRICE)
			o(subscriptionPlanPrices.PremiumBusiness).deepEquals(DEFAULT_PREMIUM_BUSINESS_PRICE)
			// o(subscriptionPlanPrices.Teams).deepEquals(DEFAULT_TEAMS_PRICE) // business feature will not be deactivated
			o(subscriptionPlanPrices.TeamsBusiness).deepEquals(DEFAULT_TEAMS_BUSINESS_PRICE)
			o(subscriptionPlanPrices.Pro).deepEquals(DEFAULT_PRO_PRICE)
		})
		o("switch teams to default", async function () {
			setBookingItem(lastBooking, BookingItemFeatureType.Sharing, 1)
			setBookingItem(lastBooking, BookingItemFeatureType.Storage, 10)
			when(planPricesAndConfigMock.getSubscriptionType(matchers.anything(), matchers.anything(), matchers.anything())).thenReturn(SubscriptionType.Teams)
			model = new SwitchSubscriptionDialogModel(
				bookingMock,
				customer,
				customerInfo,
				accountingInfo,
				lastBooking,
				planPricesAndConfigMock,
			)
			const subscriptionPlanPrices = await model.loadSwitchSubscriptionPrices()
			o(subscriptionPlanPrices.Premium).deepEquals(DEFAULT_PREMIUM_PRICE)
			o(subscriptionPlanPrices.PremiumBusiness).deepEquals(DEFAULT_PREMIUM_BUSINESS_PRICE)
			o(subscriptionPlanPrices.Teams).deepEquals(DEFAULT_TEAMS_PRICE)
			o(subscriptionPlanPrices.TeamsBusiness).deepEquals(DEFAULT_TEAMS_BUSINESS_PRICE)
			o(subscriptionPlanPrices.Pro).deepEquals(DEFAULT_PRO_PRICE)
		})
		o("switch teams business to default", async function () {
			setBookingItem(lastBooking, BookingItemFeatureType.Sharing, 1)
			setBookingItem(lastBooking, BookingItemFeatureType.Business, 1)
			setBookingItem(lastBooking, BookingItemFeatureType.Storage, 10)
			when(planPricesAndConfigMock.getSubscriptionType(matchers.anything(), matchers.anything(), matchers.anything())).thenReturn(SubscriptionType.TeamsBusiness)
			model = new SwitchSubscriptionDialogModel(
				bookingMock,
				customer,
				customerInfo,
				accountingInfo,
				lastBooking,
				planPricesAndConfigMock,
			)
			const subscriptionPlanPrices = await model.loadSwitchSubscriptionPrices()
			o(subscriptionPlanPrices.Premium).deepEquals(DEFAULT_PREMIUM_PRICE)
			o(subscriptionPlanPrices.PremiumBusiness).deepEquals(DEFAULT_PREMIUM_BUSINESS_PRICE)
			o(subscriptionPlanPrices.Teams).deepEquals(DEFAULT_TEAMS_PRICE)
			o(subscriptionPlanPrices.TeamsBusiness).deepEquals(DEFAULT_TEAMS_BUSINESS_PRICE)
			o(subscriptionPlanPrices.Pro).deepEquals(DEFAULT_PRO_PRICE)
		})
		o("switch pro to default", async function () {
			setBookingItem(lastBooking, BookingItemFeatureType.Sharing, 1)
			setBookingItem(lastBooking, BookingItemFeatureType.Business, 1)
			setBookingItem(lastBooking, BookingItemFeatureType.Whitelabel, 1)
			setBookingItem(lastBooking, BookingItemFeatureType.Storage, 10)
			setBookingItem(lastBooking, BookingItemFeatureType.Alias, 20)
			when(planPricesAndConfigMock.getSubscriptionType(matchers.anything(), matchers.anything(), matchers.anything())).thenReturn(SubscriptionType.Pro)
			model = new SwitchSubscriptionDialogModel(
				bookingMock,
				customer,
				customerInfo,
				accountingInfo,
				lastBooking,
				planPricesAndConfigMock,
			)
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
				monthlyReferencePrice: "13.2",
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
				monthlyReferencePrice: "14.4",
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
				monthlyReferencePrice: "14.4",
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
				monthlyReferencePrice: "15.6",
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
				monthlyReferencePrice: "18",
			}
			setBookingItem(lastBooking, BookingItemFeatureType.Storage, 100)
			model = new SwitchSubscriptionDialogModel(
				bookingMock,
				customer,
				customerInfo,
				accountingInfo,
				lastBooking,
				planPricesAndConfigMock,
			)
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
				monthlyReferencePrice: "6",
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
				monthlyReferencePrice: "7.2",
			}
			setBookingItem(lastBooking, BookingItemFeatureType.Whitelabel, 1)
			setBookingItem(lastBooking, BookingItemFeatureType.Sharing, 1)
			setBookingItem(lastBooking, BookingItemFeatureType.Storage, 10)
			when(planPricesAndConfigMock.getSubscriptionType(matchers.anything(), matchers.anything(), matchers.anything())).thenReturn(SubscriptionType.Teams)
			model = new SwitchSubscriptionDialogModel(
				bookingMock,
				customer,
				customerInfo,
				accountingInfo,
				lastBooking,
				planPricesAndConfigMock,
			)
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
				monthlyReferencePrice: "4.8",
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
				monthlyReferencePrice: "6",
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
				monthlyReferencePrice: "6",
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
				monthlyReferencePrice: "7.2",
			}
			setBookingItem(lastBooking, BookingItemFeatureType.Storage, 10)
			setBookingItem(lastBooking, BookingItemFeatureType.Whitelabel, 1)
			model = new SwitchSubscriptionDialogModel(
				bookingMock,
				customer,
				customerInfo,
				accountingInfo,
				lastBooking,
				planPricesAndConfigMock,
			)
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
				monthlyReferencePrice: "7.2",
			}
			setBookingItem(lastBooking, BookingItemFeatureType.Sharing, 1)
			setBookingItem(lastBooking, BookingItemFeatureType.Whitelabel, 1)
			setBookingItem(lastBooking, BookingItemFeatureType.Storage, 10)
			setBookingItem(lastBooking, BookingItemFeatureType.Alias, 20)
			when(planPricesAndConfigMock.getSubscriptionType(matchers.anything(), matchers.anything(), matchers.anything())).thenReturn(SubscriptionType.Teams)
			model = new SwitchSubscriptionDialogModel(
				bookingMock,
				customer,
				customerInfo,
				accountingInfo,
				lastBooking,
				planPricesAndConfigMock,
			)
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
				monthlyReferencePrice: "3.6",
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
				monthlyReferencePrice: "7.2",
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
				monthlyReferencePrice: "9.6",
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
				monthlyReferencePrice: "13.2",
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
				monthlyReferencePrice: "18",
			}
			setBookingItem(lastBooking, BookingItemFeatureType.Users, 3)
			setBookingItem(lastBooking, BookingItemFeatureType.Storage, 10)
			setBookingItem(lastBooking, BookingItemFeatureType.Sharing, 1)
			when(planPricesAndConfigMock.getSubscriptionType(matchers.anything(), matchers.anything(), matchers.anything())).thenReturn(SubscriptionType.Teams)
			model = new SwitchSubscriptionDialogModel(
				bookingMock,
				customer,
				customerInfo,
				accountingInfo,
				lastBooking,
				planPricesAndConfigMock,
			)
			const subscriptionPlanPrices = await model.loadSwitchSubscriptionPrices()
			o(subscriptionPlanPrices.Premium).deepEquals(upgradedPremiumPrices)
			o(subscriptionPlanPrices.PremiumBusiness).deepEquals(upgradedPremiumBusinessPrices)
			o(subscriptionPlanPrices.Teams).deepEquals(upgradedTeamsPrices)
			o(subscriptionPlanPrices.TeamsBusiness).deepEquals(upgradedTeamBusinessPrices)
			o(subscriptionPlanPrices.Pro).deepEquals(upgradedProPrices)
		})
	})
})
o.spec("getSubscriptionType test", () => {
	const originalFetch = global.fetch
	let customer: Customer
	let customerInfo: CustomerInfo
	let lastBooking: Booking
	let bookingMock: BookingFacade
	o.before(() => {
		const fakeFetch = () => ({
			json: () => Promise.resolve(SUBSCRIPTION_CONFIG)
		})

		global.fetch = fakeFetch as any
	})
	o.after(() => {
		global.fetch = originalFetch
	})
	o.beforeEach(() => {
		({customer, customerInfo, lastBooking} = createPremiumCustomerInstances())
		bookingMock = createbookingMock(lastBooking)
	})

	o("price and config provider getSubscriptionType, vanilla Premium", async () => {
		const provider = await createPriceMock()
		o(provider.getSubscriptionType(lastBooking, customer, customerInfo)).equals(SubscriptionType.Premium)
	})
	o("price and config provider getSubscriptionType, vanilla Free", async () => {
		const provider = await createPriceMock()
		customer.type = AccountType.FREE
		o(provider.getSubscriptionType(lastBooking, customer, customerInfo)).equals(SubscriptionType.Free)
	})
	o("price and config provider getSubscriptionType, vanilla Teams", async () => {
		const provider = await createPriceMock()
		setBookingItem(lastBooking, BookingItemFeatureType.Sharing, 1)
		setBookingItem(lastBooking, BookingItemFeatureType.Storage, 10)
		o(provider.getSubscriptionType(lastBooking, customer, customerInfo)).equals(SubscriptionType.Teams)
	})
	o("price and config provider getSubscriptionType, vanilla PremiumBusiness", async () => {
		const provider = await createPriceMock()
		setBookingItem(lastBooking, BookingItemFeatureType.Business, 1)
		o(provider.getSubscriptionType(lastBooking, customer, customerInfo)).equals(SubscriptionType.PremiumBusiness)
	})
	o("price and config provider getSubscriptionType, vanilla TeamsBusiness", async () => {
		const provider = await createPriceMock()
		setBookingItem(lastBooking, BookingItemFeatureType.Sharing, 1)
		setBookingItem(lastBooking, BookingItemFeatureType.Business, 1)
		setBookingItem(lastBooking, BookingItemFeatureType.Storage, 10)
		o(provider.getSubscriptionType(lastBooking, customer, customerInfo)).equals(SubscriptionType.TeamsBusiness)
	})
	o("price and config provider getSubscriptionType, vanilla Pro", async () => {
		const provider = await createPriceMock()
		setBookingItem(lastBooking, BookingItemFeatureType.Sharing, 1)
		setBookingItem(lastBooking, BookingItemFeatureType.Business, 1)
		setBookingItem(lastBooking, BookingItemFeatureType.Whitelabel, 1)
		setBookingItem(lastBooking, BookingItemFeatureType.Storage, 10)
		setBookingItem(lastBooking, BookingItemFeatureType.Alias, 20)
		o(provider.getSubscriptionType(lastBooking, customer, customerInfo)).equals(SubscriptionType.Pro)
	})
	o("price and config provider getSubscriptionType, TeamsBusiness + Whitelabel gives TeamsBusiness, not Pro", async () => {
		const provider = await createPriceMock()
		setBookingItem(lastBooking, BookingItemFeatureType.Sharing, 1)
		setBookingItem(lastBooking, BookingItemFeatureType.Business, 1)
		setBookingItem(lastBooking, BookingItemFeatureType.Whitelabel, 1)
		setBookingItem(lastBooking, BookingItemFeatureType.Storage, 10)
		o(provider.getSubscriptionType(lastBooking, customer, customerInfo)).equals(SubscriptionType.TeamsBusiness)
	})
})

function createPremiumCustomerInstances() {
	const customer = createCustomer({
		businessUse: false,
		type: AccountType.PREMIUM,
	})
	const customerInfo = createCustomerInfo({
		includedEmailAliases: "5",
		includedStorageCapacity: "1",
	})
	const accountingInfo = createAccountingInfo({
		paymentInterval: "12",
	})
	const lastBooking = createBooking()

	// always create user booking
	lastBooking.items.push(
		createBookingItem({
			featureType: BookingItemFeatureType.Users,
			currentCount: "1",
			maxCount: "1",
			price: "1.20",
		}),
	)
	return {customer, customerInfo, accountingInfo, lastBooking}
}

function createbookingMock(lastBooking: Booking): BookingFacade {
	return downcast({
		getPrice(
			type: BookingItemFeatureType,
			count: number,
			reactivate: boolean,
		): Promise<PriceServiceReturn> {
			const currentPriceData = getPriceData(lastBooking)
			const futureBooking = JSON.parse(JSON.stringify(lastBooking))
			setBookingItem(futureBooking, type, count)
			const futurePriceData = getPriceData(futureBooking)
			return Promise.resolve(
				createPriceServiceReturn({
					currentPriceNextPeriod: currentPriceData,
					currentPriceThisPeriod: currentPriceData,
					futurePriceNextPeriod: futurePriceData,
				}),
			)
		},
	})
}

function setBookingItem(booking: Booking, featureType: BookingItemFeatureType, count: number) {
	const featureItem = booking.items.find(item => item.featureType === featureType)

	if (featureItem) {
		featureItem.currentCount = String(count)
		featureItem.maxCount = String(count)
		featureItem.price = getFeatureTypePrice(featureType, count)
	} else {
		booking.items.push(
			createBookingItem({
				featureType: featureType,
				currentCount: String(count),
				maxCount: String(count),
				price: getFeatureTypePrice(featureType, count),
			}),
		)
	}
}

function getPriceData(booking: Booking): PriceData {
	const currentTotalPrice = booking.items.reduce((total, item) => {
		const featureType: BookingItemFeatureType = downcast(item.featureType)
		const singleType = isSingleType(featureType)
		const count = Number(item.currentCount)
		const itemPrice = Number(item.price)

		if (count === 0) {
			return total
		} else if (
			featureType === BookingItemFeatureType.Sharing ||
			featureType === BookingItemFeatureType.Business ||
			featureType === BookingItemFeatureType.Whitelabel
		) {
			const userCount = getCurrentCount(BookingItemFeatureType.Users, booking)
			return total + itemPrice * userCount
		} else if (singleType) {
			return total + itemPrice * count
		} else {
			// package price
			return total + itemPrice
		}
	}, 0)
	return createPriceData({
		price: String(currentTotalPrice),
		items: booking.items.map(item => {
			return createPriceItemData({
				count: item.currentCount,
				featureType: item.featureType,
				price: item.price,
				singleType: isSingleType(downcast(item.featureType)),
			})
		}),
		paymentInterval: booking.paymentInterval,
	})
}

function isSingleType(featureType: BookingItemFeatureType): boolean {
	switch (featureType) {
		case BookingItemFeatureType.Users:
		case BookingItemFeatureType.Sharing:
		case BookingItemFeatureType.Business:
		case BookingItemFeatureType.Whitelabel:
		case BookingItemFeatureType.ContactForm:
			return true

		case BookingItemFeatureType.Alias:
		case BookingItemFeatureType.Storage:
			return false

		default:
			throw new Error("invalid feature type: " + featureType)
	}
}

function getFeatureTypePrice(featureType: BookingItemFeatureType, count: number): NumberString {
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
// @flow
import type {SettingsSection, SettingsValue} from "./SettingsModel"
import type {EntityUpdateData} from "../../api/main/EventController"
import type {TextFieldAttrs} from "../../gui/base/TextFieldN"
import {TextFieldN} from "../../gui/base/TextFieldN"
import {logins} from "../../api/main/LoginController"
import m from "mithril"
import {ButtonN} from "../../gui/base/ButtonN"
import {showUpgradeWizard} from "../../subscription/UpgradeSubscriptionWizard"
import {Icons} from "../../gui/base/icons/Icons"
import {Button} from "../../gui/base/Button"
import {showSwitchDialog} from "../../subscription/SwitchSubscriptionDialog"
import type {AccountingInfo} from "../../api/entities/sys/AccountingInfo"
import {AccountingInfoTypeRef} from "../../api/entities/sys/AccountingInfo"
import type {Customer} from "../../api/entities/sys/Customer"
import {CustomerTypeRef} from "../../api/entities/sys/Customer"
import type {CustomerInfo} from "../../api/entities/sys/CustomerInfo"
import {CustomerInfoTypeRef} from "../../api/entities/sys/CustomerInfo"
import type {Booking} from "../../api/entities/sys/Booking"
import {BookingTypeRef} from "../../api/entities/sys/Booking"
import {getByAbbreviation} from "../../api/common/CountryList"
import * as SwitchToBusinessInvoiceDataDialog from "../../subscription/SwitchToBusinessInvoiceDataDialog"
import {formatDate, formatNameAndAddress} from "../../misc/Formatter"
import type {SubscriptionTypeEnum} from "../../subscription/SubscriptionUtils"
import {getSubscriptionType, isBusinessFeatureActive} from "../../subscription/SubscriptionUtils"
import {lang} from "../../misc/LanguageViewModel"
import type {OrderProcessingAgreement} from "../../api/entities/sys/OrderProcessingAgreement"
import {OrderProcessingAgreementTypeRef} from "../../api/entities/sys/OrderProcessingAgreement"
import * as SignOrderAgreementDialog from "../../subscription/SignOrderProcessingAgreementDialog"
import {locator} from "../../api/main/MainLocator"
import {GroupInfoTypeRef} from "../../api/entities/sys/GroupInfo"
import type {DropDownSelectorAttrs} from "../../gui/base/DropDownSelectorN"
import {DropDownSelectorN} from "../../gui/base/DropDownSelectorN"
import {_getAccountTypeName, changeSubscriptionInterval} from "../../subscription/SubscriptionViewer"
import stream from "mithril/stream/stream.js"
import {formatPriceDataWithInfo} from "../../subscription/PriceUtils"
import {NotFoundError} from "../../api/common/error/RestError"
import {GENERATED_MAX_ID} from "../../api/common/utils/EntityUtils"
import type {AccountTypeEnum} from "../../api/common/TutanotaConstants"
import {downcast, neverNull, ofClass} from "@tutao/tutanota-utils"
import {BookingFacade} from "../../api/worker/facades/BookingFacade"

export class SubscriptionSettingsSection implements SettingsSection {
	heading: string
	category: string
	settingsValues: Array<SettingsValue<any>>

	accountingInfo: ?AccountingInfo
	customer: ?Customer
	customerInfo: ?CustomerInfo
	lastBooking: ?Booking
	subscriptionFieldValue: Stream<string>
	isCancelled: boolean
	usageTypeFieldValue: Stream<string>
	orderAgreement: ?OrderProcessingAgreement
	orderAgreementFieldValue: Stream<string>
	periodEndDate: ?Date
	selectedSubscriptionInterval: Stream<?number>
	nextPeriodPriceVisible: boolean
	currentPriceFieldValue: Stream<string>
	nextPriceFieldValue: Stream<string>
	currentSubscription: SubscriptionTypeEnum
	bookingFacade: BookingFacade

	constructor(bookingFacade: BookingFacade) {
		this.heading = "Subscription"
		this.category = "Subscription"
		this.settingsValues = []

		const loadingString = lang.get("loading_msg")
		this.currentPriceFieldValue = stream(loadingString)
		this.subscriptionFieldValue = stream(loadingString)
		this.usageTypeFieldValue = stream(loadingString)
		this.orderAgreementFieldValue = stream(loadingString)
		this.nextPriceFieldValue = stream(loadingString)
		this.selectedSubscriptionInterval = stream(null)
		this.bookingFacade = bookingFacade
		this.updatePriceInfo()
		this.updateBookings()

		locator.entityClient.load(CustomerTypeRef, neverNull(logins.getUserController().user.customer))
		       .then(customer => {
			       this.updateCustomerData(customer)
			       return locator.entityClient.load(CustomerInfoTypeRef, customer.customerInfo)
		       })
		       .then(customerInfo => {
			       this.customerInfo = customerInfo
			       return locator.entityClient.load(AccountingInfoTypeRef, customerInfo.accountingInfo)
		       })
		       .then(accountingInfo => {
			       this.updateAccountInfoData(accountingInfo)
		       })
		       .finally(() => {
			       this.settingsValues.push(this.createSubscriptionSetting())
			       if (this.showOrderAgreement()) {
				       this.settingsValues.push(this.createOderProcessingSetting())
			       }
			       if (this.showPriceData()) {
				       this.settingsValues.push(this.createBusinessOrPrivateSetting())
				       this.settingsValues.push(this.createSubscriptionPeriodSetting())
				       this.settingsValues.push(this.createPeriodicPriceSetting())
				       if (this.nextPeriodPriceVisible && this.periodEndDate) {
					       this.settingsValues.push(this.createPriceFromSetting())
				       }
			       }
		       })
	}

	createSubscriptionSetting(): SettingsValue<TextFieldAttrs> {

		const upgradeActionAttrs = {
			label: "upgrade_action",
			click: showUpgradeWizard,
			icon: () => Icons.Edit
		}

		let subscriptionAction = new Button("subscription_label", () => {
			if (this.accountingInfo && this.customer && this.customerInfo && this.lastBooking) {
				showSwitchDialog(
					this.customer,
					this.customerInfo,
					this.accountingInfo,
					this.lastBooking)
			}
		}, () => Icons.Edit)

		const SettingsAttrs: TextFieldAttrs = {
			label: "subscription_label",
			value: this.subscriptionFieldValue,
			disabled: true,
			injectionsRight: () => logins.getUserController().isFreeAccount()
				? m(ButtonN, upgradeActionAttrs)
				: !this.isCancelled
					? [m(subscriptionAction)]
					: null
		}
		return {
			name: "subscription_label",
			component: TextFieldN,
			attrs: SettingsAttrs
		}
	}

	createBusinessOrPrivateSetting(): SettingsValue<TextFieldAttrs> {

		const usageTypeActionAttrs = {
			label: "pricing.businessUse_label",
			click: () => this.switchToBusinessUse(),
			icon: () => Icons.Edit
		}

		const SettingsAttrs: TextFieldAttrs = {
			label: "businessOrPrivateUsage_label",
			value: this.usageTypeFieldValue,
			disabled: true,
			injectionsRight: () => this.customer && this.customer.businessUse === false && !this.customer.canceledPremiumAccount
				? m(ButtonN, usageTypeActionAttrs)
				: null,
		}

		return {
			name: "businessOrPrivateUsage_label",
			component: TextFieldN,
			attrs: SettingsAttrs
		}
	}

	createOderProcessingSetting(): SettingsValue<TextFieldAttrs> {

		const signOrderAgreementActionAttrs = {
			label: "sign_action",
			click: () => SignOrderAgreementDialog.showForSigning(neverNull(this.customer), neverNull(this.accountingInfo)),
			icon: () => Icons.Edit
		}

		const showOrderAgreementActionAttrs = {
			label: "show_action",
			click: () => locator.entityClient.load(GroupInfoTypeRef, neverNull(this.orderAgreement).signerUserGroupInfo)
			                    .then(signerUserGroupInfo => SignOrderAgreementDialog.showForViewing(neverNull(this.orderAgreement), signerUserGroupInfo)),
			icon: () => Icons.Download,
		}

		const SettingsAttrs: TextFieldAttrs = {
			label: "orderProcessingAgreement_label",
			helpLabel: () => lang.get("orderProcessingAgreementInfo_msg"),
			value: this.orderAgreementFieldValue,
			disabled: true,
			injectionsRight: () => {
				if (this.orderAgreement && this.customer && this.customer.orderProcessingAgreementNeeded) {
					return [m(ButtonN, signOrderAgreementActionAttrs), m(ButtonN, showOrderAgreementActionAttrs)]
				} else if (this.orderAgreement) {
					return [m(ButtonN, showOrderAgreementActionAttrs)]
				} else if (this.customer && this.customer.orderProcessingAgreementNeeded) {
					return [m(ButtonN, signOrderAgreementActionAttrs)]
				} else {
					return []
				}
			},
		}

		return {
			name: "orderProcessingAgreement_label",
			component: TextFieldN,
			attrs: SettingsAttrs
		}
	}

	createSubscriptionPeriodSetting(): SettingsValue<DropDownSelectorAttrs<number>> {

		let subscriptionPeriods = [
			{name: lang.get("pricing.yearly_label") + ', ' + lang.get('automaticRenewal_label'), value: 12},
			{name: lang.get("pricing.monthly_label") + ', ' + lang.get('automaticRenewal_label'), value: 1}
		]

		const SettingsAttrs: DropDownSelectorAttrs<number> = {
			label: "subscriptionPeriod_label",
			helpLabel: () => this.periodEndDate
				? lang.get("endOfSubscriptionPeriod_label", {"{1}": formatDate(this.periodEndDate)})
				: "",
			items: subscriptionPeriods,
			selectedValue: this.selectedSubscriptionInterval,
			dropdownWidth: 300,
			selectionChangedHandler: (value) => {
				if (this.accountingInfo) {
					changeSubscriptionInterval(this.accountingInfo, value, this.periodEndDate)
				}
			}
		}

		return {
			name: "subscriptionPeriod_label",
			component: DropDownSelectorN,
			attrs: SettingsAttrs
		}
	}

	createPeriodicPriceSetting(): SettingsValue<TextFieldAttrs> {

		const SettingsAttrs: TextFieldAttrs = {
			label: () => this.nextPeriodPriceVisible && this.periodEndDate
				? lang.get("priceTill_label", {"{date}": formatDate(this.periodEndDate)})
				: lang.get("price_label"),
			value: this.currentPriceFieldValue,
			disabled: true,
		}

		return {
			name: "priceTill_label",
			component: TextFieldN,
			attrs: SettingsAttrs
		}
	}

	createPriceFromSetting(): SettingsValue<TextFieldAttrs> {

		const DAY = 1000 * 60 * 60 * 24;

		const SettingsAttrs: TextFieldAttrs = {
			label: () => lang.get("priceFrom_label", {
				"{date}": formatDate(new Date(neverNull(this.periodEndDate).getTime() + DAY))
			}),
			helpLabel: () => lang.get("nextSubscriptionPrice_msg"),
			value: this.nextPriceFieldValue,
			disabled: true,
		}

		return {
			name: "priceFrom_label",
			component: TextFieldN,
			attrs: SettingsAttrs
		}
	}

	switchToBusinessUse(): void {
		const customer = this.customer
		if (customer && customer.businessUse === false) {
			let accountingInfo = neverNull(this.accountingInfo)
			const invoiceCountry = neverNull(getByAbbreviation(neverNull(accountingInfo.invoiceCountry)))
			SwitchToBusinessInvoiceDataDialog.show(customer, {
					invoiceAddress: formatNameAndAddress(accountingInfo.invoiceName, accountingInfo.invoiceAddress),
					country: invoiceCountry,
					vatNumber: ""
				}, accountingInfo,
				isBusinessFeatureActive(this.lastBooking),
				"pricing.businessUse_label",
				"businessChangeInfo_msg")
		}
	}

	updateAccountInfoData(accountingInfo: AccountingInfo) {
		this.accountingInfo = accountingInfo
		this.selectedSubscriptionInterval(Number(accountingInfo.paymentInterval))
		m.redraw()
	}

	updateCustomerData(customer: Customer): Promise<*> {
		let p = Promise.resolve()
		this.customer = customer
		this.usageTypeFieldValue(customer.businessUse ? lang.get("pricing.businessUse_label") : lang.get("pricing.privateUse_label"))
		if (customer.orderProcessingAgreement) {
			p = locator.entityClient.load(OrderProcessingAgreementTypeRef, customer.orderProcessingAgreement).then(a => {
				this.orderAgreement = a
			})
		} else {
			this.orderAgreement = null
		}
		return p.then(() => {
			if (customer.orderProcessingAgreementNeeded) {
				this.orderAgreementFieldValue(lang.get("signingNeeded_msg"))
			} else if (this.orderAgreement) {
				this.orderAgreementFieldValue(lang.get("signedOn_msg", {"{date}": formatDate(this.orderAgreement.signatureDate)}))
			} else {
				this.orderAgreementFieldValue(lang.get("notSigned_msg"))
			}
			m.redraw()
		})
	}

	showPriceData(): boolean {
		return logins.getUserController().isPremiumAccount()
	}

	updatePriceInfo(): Promise<void> {
		if (!this.showPriceData()) {
			return Promise.resolve();
		} else {
			return this.bookingFacade.getCurrentPrice().then(priceServiceReturn => {
				if (priceServiceReturn.currentPriceThisPeriod != null && priceServiceReturn.currentPriceNextPeriod != null) {
					if (priceServiceReturn.currentPriceThisPeriod.price !== priceServiceReturn.currentPriceNextPeriod.price) {
						this.currentPriceFieldValue(formatPriceDataWithInfo(priceServiceReturn.currentPriceThisPeriod))
						this.nextPriceFieldValue(formatPriceDataWithInfo(neverNull(priceServiceReturn.currentPriceNextPeriod)))
						this.nextPeriodPriceVisible = true
					} else {
						this.currentPriceFieldValue(formatPriceDataWithInfo(priceServiceReturn.currentPriceThisPeriod))
						this.nextPeriodPriceVisible = false
					}
					this.periodEndDate = priceServiceReturn.periodEndDate
					m.redraw()
				}
			})
		}
	}

	updateSubscriptionField(cancelled: boolean) {
		const cancelledText = cancelled && this.periodEndDate
			? " "
			+ lang.get("cancelledBy_label", {"{endOfSubscriptionPeriod}": formatDate(this.periodEndDate)}) : ""
		const accountType: AccountTypeEnum = downcast(logins.getUserController().user.accountType)
		this.subscriptionFieldValue(_getAccountTypeName(accountType, this.currentSubscription) + cancelledText)
	}

	updateBookings(): Promise<void> {
		return locator.entityClient.load(CustomerTypeRef, neverNull(logins.getUserController().user.customer)).then(customer => {
			return locator.entityClient.load(CustomerInfoTypeRef, customer.customerInfo)
			              .catch(ofClass(NotFoundError, e => {
				              console.log("could not update bookings as customer info does not exist (moved between free/premium lists)")
			              }))
			              .then(customerInfo => {
				              if (!customerInfo) {
					              return
				              }
				              this.customerInfo = customerInfo
				              return locator.entityClient.loadRange(BookingTypeRef, neverNull(customerInfo.bookings).items, GENERATED_MAX_ID, 1, true)
				                            .then(bookings => {
					                            this.lastBooking = bookings.length > 0 ? bookings[bookings.length - 1] : null
					                            this.customer = customer
					                            this.isCancelled = customer.canceledPremiumAccount
					                            this.currentSubscription = getSubscriptionType(this.lastBooking, customer, customerInfo)
					                            this.updateSubscriptionField(this.isCancelled)
				                            })
			              })
		})
	}

	showOrderAgreement(): boolean {
		return (logins.getUserController().isPremiumAccount())
			&& ((this.customer != null && this.customer.businessUse)
				|| (this.customer != null && (this.customer.orderProcessingAgreement != null
					|| this.customer.orderProcessingAgreementNeeded)))
	}

	entityEventReceived(updates: $ReadOnlyArray<EntityUpdateData>, eventOwnerGroupId: Id): Promise<mixed> {
		return Promise.resolve(undefined);
	}
}
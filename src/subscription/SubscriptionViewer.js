// @flow
import m from "mithril"
import {assertMainOrNode} from "../api/Env"
import type {BookingItemFeatureTypeEnum, OperationTypeEnum, AccountTypeEnum} from "../api/common/TutanotaConstants"
import {Const, BookingItemFeatureType, AccountType, AccountTypeNames} from "../api/common/TutanotaConstants"
import {CustomerTypeRef} from "../api/entities/sys/Customer"
import {neverNull} from "../api/common/utils/Utils"
import {CustomerInfoTypeRef} from "../api/entities/sys/CustomerInfo"
import {load, loadRange, serviceRequest} from "../api/main/Entity"
import {logins} from "../api/main/LoginController"
import {lang} from "../misc/LanguageViewModel.js"
import {Button, ButtonType, createDropDownButton} from "../gui/base/Button"
import {TextField} from "../gui/base/TextField"
import {Icons} from "../gui/base/icons/Icons"
import {AccountingInfoTypeRef} from "../api/entities/sys/AccountingInfo"
import {worker} from "../api/main/WorkerClient"
import {isSameTypeRef, GENERATED_MAX_ID, HttpMethod} from "../api/common/EntityFunctions"
import {openUpgradeDialog} from "./UpgradeAccountTypeDialog"
import {Dialog} from "../gui/base/Dialog"
import {UserTypeRef} from "../api/entities/sys/User"
import {formatPriceDataWithInfo} from "./PriceUtils"
import {formatDate, formatStorageSize} from "../misc/Formatter"
import {getByAbbreviation} from "../api/common/CountryList"
import {openInvoiceDataDialog} from "./InvoiceDataDialog"
import {BookingTypeRef} from "../api/entities/sys/Booking"
import {SysService} from "../api/entities/sys/Services"
import {MailAddressAliasServiceReturnTypeRef} from "../api/entities/sys/MailAddressAliasServiceReturn"
import {showNotAvailableForFreeDialog} from "../misc/ErrorHandlerImpl"
import * as AddUserDialog from "../settings/AddUserDialog"
import {openStorageCapacityOptionsDialog} from "./StorageCapacityOptionsDialog"
import {openEmailAliasOptionsDialog} from "./EmailAliasOptionsDialog"
assertMainOrNode()

export class SubscriptionViewer {

	view: Function;
	_accountTypeField: TextField;
	_usageTypeField: TextField;
	_subscriptionIntervalField: TextField;
	_currentPriceField: TextField;

	_usersField: TextField;
	_storageField: TextField;
	_emailAliasField: TextField;
	_contactFormsField: TextField;
	_whitelabelField: TextField;
	_periodEndDate: Date;
	_nextPeriodPriceVisible: boolean;
	_accountingInfo: ?AccountingInfo;
	_lastBooking: ?Booking;

	constructor() {
		this._accountTypeField = new TextField("accountType_label")
		//let accountTypeAction = createDropDownButton("accountType_label", () => Icons.Edit, () => {
		let accountTypeAction = new Button("accountType_label", () => {
			if (logins.getUserController().user.accountType == AccountType.PREMIUM) {
				//return [new Button("unsubscribePremium_label", () => console.log("unsubscribe from premium")).setType(ButtonType.Dropdown)]
				Dialog.error("unsubscribePremium_label")
			} else if (logins.getUserController().user.accountType == AccountType.FREE) {
				//return [new Button("upgradeToPremium_action", () => this._showUpgradeDialog()).setType(ButtonType.Dropdown)]
				openUpgradeDialog()
			}
		}, () => Icons.Edit)
		this._accountTypeField._injectionsRight = () => logins.getUserController().isFreeAccount() || logins.getUserController().isPremiumAccount() ? [m(accountTypeAction)] : []
		this._usageTypeField = new TextField("businessOrPrivateUsage_label").setValue(lang.get("loading_msg")).setDisabled()
		let usageTypeAction = createDropDownButton("businessOrPrivateUsage_label", () => Icons.Edit, () => {
			return [
				new Button("businessUse_label", () => {
					this._changeBusinessUse(true)
				}).setType(ButtonType.Dropdown),
				new Button("privateUse_label", () => {
					this._changeBusinessUse(false)
				}).setType(ButtonType.Dropdown)
			]
		})
		this._usageTypeField._injectionsRight = () => m(usageTypeAction)

		this._subscriptionIntervalField = new TextField("subscription_label", () => {
			return this._periodEndDate ? lang.get("endOfSubscriptionPeriod_label", {"{1}": formatDate(this._periodEndDate)}) : ""
		}).setValue(lang.get("loading_msg")).setDisabled()
		let subscriptionIntervalAction = createDropDownButton("subscription_label", () => Icons.Edit, () => {
			return [
				new Button("yearly_label", () => {
					this._changeSubscriptionInterval(12)
				}).setType(ButtonType.Dropdown),
				new Button("monthly_label", () => {
					this._changeSubscriptionInterval(1)
				}).setType(ButtonType.Dropdown)
			]
		})
		this._subscriptionIntervalField._injectionsRight = () => m(subscriptionIntervalAction)

		this._currentPriceField = new TextField("price_label", () => {
			return this._nextPeriodPriceVisible ? "* " + lang.get("nextSubscriptionPrice_msg") : ""
		}).setValue(lang.get("loading_msg")).setDisabled()

		this._usersField = new TextField("bookingItemUsers_label").setValue(lang.get("loading_msg")).setDisabled()
		const addUserActionButton = createBuyButton("addUsers_action", () => AddUserDialog.show(), () => Icons.Add);
		this._usersField._injectionsRight = () => m(addUserActionButton)

		this._storageField = new TextField("storageCapacity_label").setValue(lang.get("loading_msg")).setDisabled()
		const changeStorageCapacityButton = createBuyButton("storageCapacity_label", () => {
			openStorageCapacityOptionsDialog()
		}, () => Icons.Edit)
		this._storageField._injectionsRight = () => m(changeStorageCapacityButton)

		this._emailAliasField = new TextField("mailAddressAliases_label").setValue(lang.get("loading_msg")).setDisabled()
		const changeEmailAliasPackageButton = createBuyButton("emailAlias_label", () => {
			openEmailAliasOptionsDialog()
		}, () => Icons.Edit)
		this._emailAliasField._injectionsRight = () => m(changeEmailAliasPackageButton)


		this._contactFormsField = new TextField("contactForms_label").setValue(lang.get("loading_msg")).setDisabled()
		this._whitelabelField = new TextField("whitelabel_label").setValue(lang.get("loading_msg")).setDisabled()

		this.view = (): VirtualElement => {
			return m("#subscription-settings.fill-absolute.scroll.plr-l", [
				m(".h4.mt-l", lang.get('currentlyBooked_label')),
				m(this._accountTypeField),
				this._showPriceData() ? m(this._usageTypeField) : null,
				this._showPriceData() ? m(this._subscriptionIntervalField) : null,
				this._showPriceData() ? m(this._currentPriceField) : null,
				m(".h4.mt-l", lang.get('adminPremiumFeatures_action')),
				m(this._usersField),
				m(this._storageField),
				m(this._emailAliasField),
				m(this._contactFormsField),
				m(this._whitelabelField),
			])
		}

		load(CustomerTypeRef, neverNull(logins.getUserController().user.customer))
			.then(customer => load(CustomerInfoTypeRef, customer.customerInfo))
			.then(customerInfo => load(AccountingInfoTypeRef, customerInfo.accountingInfo))
			.then(accountingInfo => {
				this._updateAccountInfoData(accountingInfo)
			})
		this._updateAccountTypeFields()
		this._updatePriceInfo()
		this._updateBookings()
	}

	_changeSubscriptionInterval(paymentInterval: number): void {
		if (this._accountingInfo && this._accountingInfo.invoiceCountry && Number(this._accountingInfo.paymentInterval) != paymentInterval) {
			let accountInfo = neverNull(this._accountingInfo)
			const invoiceCountry = neverNull(getByAbbreviation(neverNull(accountInfo.invoiceCountry)))

			worker.updatePaymentData({
				businessUse: accountInfo.business,
				paymentInterval: paymentInterval,
				proUpgrade: false,
				price: ""
			}, {
				invoiceName: accountInfo.invoiceName,
				invoiceAddress: accountInfo.invoiceAddress,
				country: invoiceCountry,
				vatNumber: accountInfo.invoiceVatIdNo,
				paymentMethod: accountInfo.paymentMethod,
				paymentMethodInfo: accountInfo.paymentMethodInfo ? accountInfo.paymentMethodInfo : "",
				creditCardData: null,
				payPalData: null,
			}, invoiceCountry)
		}
	}

	_changeBusinessUse(businessUse: boolean): void {
		if (this._accountingInfo && this._accountingInfo.business != businessUse) {
			openInvoiceDataDialog({
					businessUse: businessUse,
					paymentInterval: Number(this._accountingInfo.paymentInterval),
					proUpgrade: false,
					price: ""
				},
				this._accountingInfo,
				"save_action"
			)
		}
	}

	_showPriceData(): boolean {
		return logins.getUserController().isPremiumAccount() || logins.getUserController().isOutlookAccount()
	}

	_updatePriceInfo() {
		if (!this._showPriceData()) {
			return;
		}
		worker.getCurrentPrice().then(priceServiceReturn => {
			if (priceServiceReturn.currentPriceThisPeriod != null && priceServiceReturn.currentPriceNextPeriod != null) {
				if (priceServiceReturn.currentPriceThisPeriod.price != priceServiceReturn.currentPriceNextPeriod.price) {
					this._currentPriceField.setValue(formatPriceDataWithInfo(priceServiceReturn.currentPriceThisPeriod) + " / " + formatPriceDataWithInfo(neverNull(priceServiceReturn.currentPriceNextPeriod)) + "*")
					this._nextPeriodPriceVisible = true
				} else {
					this._currentPriceField.setValue(formatPriceDataWithInfo(priceServiceReturn.currentPriceThisPeriod))
					this._nextPeriodPriceVisible = false
				}
				this._periodEndDate = priceServiceReturn.periodEndDate
				m.redraw()
			}
		})
	}

	_updateAccountInfoData(accountingInfo: AccountingInfo) {
		this._accountingInfo = accountingInfo
		this._usageTypeField.setValue(accountingInfo.business ? lang.get("businessUse_label") : lang.get("privateUse_label"))
		this._subscriptionIntervalField
			.setValue((Number(accountingInfo.paymentInterval) == 12 ? lang.get("yearly_label") : lang.get("monthly_label")))

		m.redraw()
	}

	_updateAccountTypeFields() {
		this._accountTypeField.setValue(_getAccountTypeName(logins.getUserController().user.accountType)).setDisabled()
	}

	_updateBookings() {
		load(CustomerTypeRef, neverNull(logins.getUserController().user.customer)).then(customer => {
			load(CustomerInfoTypeRef, customer.customerInfo).then(customerInfo => {
				loadRange(BookingTypeRef, neverNull(customerInfo.bookings).items, GENERATED_MAX_ID, 1, true).then(bookings => {
					this._lastBooking = bookings.length > 0 ? bookings[bookings.length - 1] : null
					Promise.all([
							this._updateUserField(this._lastBooking),
							this._updateStorageField(customer, customerInfo, this._lastBooking),
							this._updateAliasField(customer, customerInfo, this._lastBooking),
							this._updateContactFormsField(this._lastBooking),
							this._updateWhitelabelField(this._lastBooking)
						]
					).then(() => m.redraw())
				})
			})
		})
	}


	_updateUserField(lastBooking: ?Booking): Promise<void> {
		this._usersField.setValue("" + Math.max(1, getCurrentCount(BookingItemFeatureType.Users, this._lastBooking)))
		return Promise.resolve()
	}

	_updateStorageField(customer: Customer, customerInfo: CustomerInfo, lastBooking: ?Booking): Promise<void> {
		return worker.readUsedCustomerStorage().then(usedStorage => {
			const usedStorageFormatted = formatStorageSize(Number(usedStorage))
			const totalStorageFormatted = formatStorageSize(getTotalStorageCapacity(customer, customerInfo, this._lastBooking) * Const.MEMORY_GB_FACTOR)
			this._storageField.setValue(lang.get("amountUsedOf_label", {
				"{amount}": usedStorageFormatted,
				"{totalAmount}": totalStorageFormatted
			}))
		})
	}

	_updateAliasField(customer: Customer, customerInfo: CustomerInfo, lastBooking: ?Booking): Promise<void> {
		const totalAmount = getTotalAliases(customer, customerInfo, lastBooking)
		if (totalAmount == 0) {
			this._emailAliasField.setValue("0")
			return Promise.resolve()
		} else {
			return serviceRequest(SysService.MailAddressAliasService, HttpMethod.GET, null, MailAddressAliasServiceReturnTypeRef).then(aliasServiceReturn => {
				this._emailAliasField.setValue(lang.get("amountUsedAndActivatedOf_label", {
					"{used}": aliasServiceReturn.usedAliases,
					"{active}": aliasServiceReturn.enabledAliases,
					"{totalAmount}": totalAmount
				}))
			}).return()
		}
	}

	_updateContactFormsField(lastBooking: ?Booking): Promise<void> {
		const totalAmount = getCurrentCount(BookingItemFeatureType.ContactForm, lastBooking)
		this._contactFormsField.setValue(totalAmount.toString())
		return Promise.resolve()
	}

	_updateWhitelabelField(lastBooking: ?Booking): Promise<void> {
		const totalAmount = getCurrentCount(BookingItemFeatureType.Branding, lastBooking)
		if (totalAmount == 0) {
			this._whitelabelField.setValue(lang.get("deactivated_label"))
		} else {
			this._whitelabelField.setValue(lang.get("active_label"))
		}
		return Promise.resolve()
	}

	entityEventReceived<T>(typeRef: TypeRef<any>, listId: ?string, elementId: string, operation: OperationTypeEnum): void {
		if (isSameTypeRef(typeRef, AccountingInfoTypeRef)) {
			load(AccountingInfoTypeRef, elementId).then(accountingInfo => this._updateAccountInfoData(accountingInfo))
			this._updatePriceInfo()
		} else if (isSameTypeRef(typeRef, UserTypeRef)) {
			this._updateAccountTypeFields()
			this._updatePriceInfo()
		} else if (isSameTypeRef(typeRef, BookingTypeRef)) {
			this._updateBookings()
			this._updatePriceInfo()
		}
	}
}


function createBuyButton(labelId: string, buyAction: clickHandler, icon: lazy<SVG>): Button {
	return new Button(labelId, () => {
		if (logins.getUserController().isFreeAccount()) {
			showNotAvailableForFreeDialog()
		} else {
			buyAction()
		}
	}, icon)
}


/**
 * Returns the available storage capacity for the customer in GB
 */
function getTotalStorageCapacity(customer: Customer, customerInfo: CustomerInfo, lastBooking: ?Booking): number {
	let freeStorageCapacity = Math.max(Number(customerInfo.includedStorageCapacity), Number(customerInfo.promotionStorageCapacity))
	if (customer.type === AccountType.PREMIUM) {
		return Math.max(freeStorageCapacity, getCurrentCount(BookingItemFeatureType.Storage, lastBooking))
	} else {
		return freeStorageCapacity
	}
}

function getTotalAliases(customer: Customer, customerInfo: CustomerInfo, lastBooking: ?Booking): number {
	let freeAliases = Math.max(Number(customerInfo.includedEmailAliases), Number(customerInfo.promotionEmailAliases))
	if (customer.type === AccountType.PREMIUM) {
		return Math.max(freeAliases, getCurrentCount(BookingItemFeatureType.Alias, lastBooking))
	} else {
		return freeAliases
	}
}


function getCurrentCount(featureType: BookingItemFeatureTypeEnum, booking: ?Booking): number {
	if (booking) {
		let bookingItem = booking.items.find(item => item.featureType == featureType)
		return bookingItem ? Number(bookingItem.currentCount) : 0
	} else {
		return 0
	}
}


function _getAccountTypeName(type: AccountTypeEnum): string {
	return "Tutanota " + AccountTypeNames[Number(type)];
}
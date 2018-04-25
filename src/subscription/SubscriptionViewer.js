// @flow
import m from "mithril"
import {assertMainOrNode} from "../api/Env"
import type {OperationTypeEnum, AccountTypeEnum} from "../api/common/TutanotaConstants"
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
import {UserTypeRef} from "../api/entities/sys/User"
import {formatPriceDataWithInfo, getCurrentCount, createNotAvailableForFreeButton} from "./PriceUtils"
import {formatDate, formatStorageSize, formatNameAndAddress} from "../misc/Formatter"
import {getByAbbreviation} from "../api/common/CountryList"
import {BookingTypeRef} from "../api/entities/sys/Booking"
import {SysService} from "../api/entities/sys/Services"
import {MailAddressAliasServiceReturnTypeRef} from "../api/entities/sys/MailAddressAliasServiceReturn"
import * as AddUserDialog from "../settings/AddUserDialog"
import * as EmailAliasOptionsDialog from "./EmailAliasOptionsDialog"
import * as AddGroupDialog from "../settings/AddGroupDialog"
import * as ContactFormEditor from "../settings/ContactFormEditor"
import * as WhitelabelBuyDialog from "./WhitelabelBuyDialog"
import * as StorageCapacityOptionsDialog from "./StorageCapacityOptionsDialog"
import * as UpgradeWizard from "./UpgradeSubscriptionWizard"
import {showDowngradeDialog} from "./SwitchSubscriptionDialog"
assertMainOrNode()

const DAY = 1000 * 60 * 60 * 24;

export class SubscriptionViewer {

	view: Function;
	_subscriptionField: TextField;
	_usageTypeField: TextField;
	_subscriptionIntervalField: TextField;
	_currentPriceField: TextField;
	_nextPriceField: TextField;

	_usersField: TextField;
	_storageField: TextField;
	_emailAliasField: TextField;
	_groupsField: TextField;
	_contactFormsField: TextField;
	_whitelabelField: TextField;
	_periodEndDate: Date;
	_nextPeriodPriceVisible: boolean;
	_accountingInfo: ?AccountingInfo;
	_lastBooking: ?Booking;
	_isPro: boolean;
	_isCancelled: boolean;

	constructor() {
		this._isPro = false
		this._subscriptionField = new TextField("subscription_label")
		let subscriptionAction = new Button("subscription_label", () => {
			if (logins.getUserController().user.accountType == AccountType.PREMIUM) {
				if (this._accountingInfo) {
					showDowngradeDialog(this._accountingInfo, this._isPro)
				}
			} else if (logins.getUserController().user.accountType == AccountType.FREE) {
				UpgradeWizard.show()
			}
		}, () => Icons.Edit)
		let upgradeAction = new Button("upgrade_action", () => UpgradeWizard.show())
			.setType(ButtonType.Accent)
		this._subscriptionField._injectionsRight = () => (logins.getUserController().isFreeAccount()) ? [m(".mr-s", {style: {'margin-bottom': '3px'}}, m(upgradeAction))] : (logins.getUserController().isPremiumAccount() && !this._isCancelled ? [m(subscriptionAction)] : null)
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
		//this._usageTypeField._injectionsRight = () => m(usageTypeAction)

		this._subscriptionIntervalField = new TextField("subscriptionPeriod_label", () => {
			return this._periodEndDate ? lang.get("endOfSubscriptionPeriod_label", {"{1}": formatDate(this._periodEndDate)}) : ""
		}).setValue(lang.get("loading_msg")).setDisabled()
		let subscriptionIntervalAction = createDropDownButton("subscription_label", () => Icons.Edit, () => {
			return [
				new Button("yearly_label", () => {
					if (this._accountingInfo) changeSubscriptionInterval(this._accountingInfo, 12)
				}).setType(ButtonType.Dropdown),
				new Button("monthly_label", () => {
					if (this._accountingInfo) changeSubscriptionInterval(this._accountingInfo, 1)
				}).setType(ButtonType.Dropdown)
			]
		})
		this._subscriptionIntervalField._injectionsRight = () => m(subscriptionIntervalAction)

		this._currentPriceField = new TextField(() => this._nextPeriodPriceVisible ? lang.get("priceTill_label", {"{date}": formatDate(this._periodEndDate)}) : lang.get("price_label")).setValue(lang.get("loading_msg")).setDisabled()
		this._nextPriceField = new TextField(() => lang.get("priceFrom_label", {"{date}": formatDate(new Date(this._periodEndDate.getTime() + DAY))}), () => lang.get("nextSubscriptionPrice_msg")).setValue(lang.get("loading_msg")).setDisabled()

		this._usersField = new TextField("bookingItemUsers_label").setValue(lang.get("loading_msg")).setDisabled()
		const addUserActionButton = createNotAvailableForFreeButton("addUsers_action", () => AddUserDialog.show(), () => Icons.Add);
		const editUsersAction = createNotAvailableForFreeButton("bookingItemUsers_label", () => m.route.set("/settings/users"), () => Icons.Edit)
		this._usersField._injectionsRight = () => [m(addUserActionButton), m(editUsersAction)]

		this._storageField = new TextField("storageCapacity_label").setValue(lang.get("loading_msg")).setDisabled()
		const changeStorageCapacityButton = createNotAvailableForFreeButton("storageCapacity_label", () => {
			StorageCapacityOptionsDialog.show()
		}, () => Icons.Edit)
		this._storageField._injectionsRight = () => m(changeStorageCapacityButton)

		this._emailAliasField = new TextField("mailAddressAliases_label").setValue(lang.get("loading_msg")).setDisabled()
		const changeEmailAliasPackageButton = createNotAvailableForFreeButton("emailAlias_label", () => {
			EmailAliasOptionsDialog.show()
		}, () => Icons.Edit)
		this._emailAliasField._injectionsRight = () => m(changeEmailAliasPackageButton)

		this._groupsField = new TextField("groups_label").setValue(lang.get("loading_msg")).setDisabled()
		const addGroupsAction = createNotAvailableForFreeButton("addGroup_label", () => {
			AddGroupDialog.show()
		}, () => Icons.Add)
		const editGroupsAction = createNotAvailableForFreeButton("groups_label", () => m.route.set("/settings/groups"), () => Icons.Edit)
		this._groupsField._injectionsRight = () => [m(addGroupsAction), m(editGroupsAction)]

		this._contactFormsField = new TextField("contactForms_label").setValue(lang.get("loading_msg")).setDisabled()
		const addContactFormAction = createNotAvailableForFreeButton("createContactForm_label", () => {
			ContactFormEditor.show(null, true, contactFormId => {
			})
		}, () => Icons.Add)
		const editContactFormsAction = createNotAvailableForFreeButton("contactForms_label", () => m.route.set("/settings/contactforms"), () => Icons.Edit)
		this._contactFormsField._injectionsRight = () => [m(addContactFormAction), m(editContactFormsAction)]

		this._whitelabelField = new TextField("whitelabel_label").setValue(lang.get("loading_msg")).setDisabled()
		const enableWhiteLabelAction = createNotAvailableForFreeButton("whitelabelDomain_label", () => WhitelabelBuyDialog.show(true), () => Icons.Edit)
		const disableWhiteLabelAction = createNotAvailableForFreeButton("whitelabelDomain_label", () => WhitelabelBuyDialog.show(false), () => Icons.Cancel)
		this._whitelabelField._injectionsRight = () => (getCurrentCount(BookingItemFeatureType.Branding, this._lastBooking) == 0) ? m(enableWhiteLabelAction) : m(disableWhiteLabelAction)


		this.view = (): VirtualElement => {
			return m("#subscription-settings.fill-absolute.scroll.plr-l", [
				m(".h4.mt-l", lang.get('currentlyBooked_label')),
				m(this._subscriptionField),
				this._showPriceData() ? m(this._usageTypeField) : null,
				this._showPriceData() ? m(this._subscriptionIntervalField) : null,
				this._showPriceData() ? m(this._currentPriceField) : null,
				(this._showPriceData() && this._nextPeriodPriceVisible) ? m(this._nextPriceField) : null,
				m(".h4.mt-l", lang.get('adminPremiumFeatures_action')),
				m(this._usersField),
				m(this._storageField),
				m(this._emailAliasField),
				m(this._groupsField),
				m(this._whitelabelField),
				m(this._contactFormsField)
			])
		}

		load(CustomerTypeRef, neverNull(logins.getUserController().user.customer))
			.then(customer => load(CustomerInfoTypeRef, customer.customerInfo))
			.then(customerInfo => load(AccountingInfoTypeRef, customerInfo.accountingInfo))
			.then(accountingInfo => {
				this._updateAccountInfoData(accountingInfo)
			})
		this._subscriptionField.setValue(lang.get("loading_msg")).setDisabled()
		this._updatePriceInfo()
		this._updateBookings()
	}

	_changeBusinessUse(businessUse: boolean): void {
		if (this._accountingInfo && this._accountingInfo.business != businessUse) {
			// TODO allow private to business only.
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
					this._currentPriceField.setValue(formatPriceDataWithInfo(priceServiceReturn.currentPriceThisPeriod))
					this._nextPriceField.setValue(formatPriceDataWithInfo(neverNull(priceServiceReturn.currentPriceNextPeriod)))
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

	_updateSubscriptionField(cancelled: boolean) {
		let cancelledText = !cancelled ? "" : " " + lang.get("cancelledBy_label", {"{endOfSubscriptionPeriod}": formatDate(this._periodEndDate)})
		this._subscriptionField.setValue(_getAccountTypeName(logins.getUserController().user.accountType, this._isPro) + cancelledText).setDisabled()
	}

	_updatePro(customer: Customer, customerInfo: CustomerInfo, lastBooking: Booking) {
		let aliases = getTotalAliases(customer, customerInfo, lastBooking)
		let storage = getTotalStorageCapacity(customer, customerInfo, lastBooking)
		this._isPro = this._isWhitelabelActive() && aliases >= 20 && storage >= 10
	}

	_updateBookings() {
		load(CustomerTypeRef, neverNull(logins.getUserController().user.customer)).then(customer => {
			load(CustomerInfoTypeRef, customer.customerInfo).then(customerInfo => {
				loadRange(BookingTypeRef, neverNull(customerInfo.bookings).items, GENERATED_MAX_ID, 1, true).then(bookings => {
					this._lastBooking = bookings.length > 0 ? bookings[bookings.length - 1] : null
					this._isCancelled = customer.canceledPremiumAccount
					this._updatePro(customer, customerInfo, neverNull(this._lastBooking))
					this._updateSubscriptionField(this._isCancelled)
					Promise.all([
							this._updateUserField(),
							this._updateStorageField(customer, customerInfo),
							this._updateAliasField(customer, customerInfo),
							this._updateGroupsField(),
							this._updateWhitelabelField(),
							this._updateContactFormsField()
						]
					).then(() => m.redraw())
				})
			})
		})
	}


	_updateUserField(): Promise<void> {
		this._usersField.setValue("" + Math.max(1, getCurrentCount(BookingItemFeatureType.Users, this._lastBooking)))
		return Promise.resolve()
	}

	_updateStorageField(customer: Customer, customerInfo: CustomerInfo): Promise<void> {
		return worker.readUsedCustomerStorage().then(usedStorage => {
			const usedStorageFormatted = formatStorageSize(Number(usedStorage))
			const totalStorageFormatted = formatStorageSize(getTotalStorageCapacity(customer, customerInfo, this._lastBooking) * Const.MEMORY_GB_FACTOR)
			this._storageField.setValue(lang.get("amountUsedOf_label", {
				"{amount}": usedStorageFormatted,
				"{totalAmount}": totalStorageFormatted
			}))
		})
	}

	_updateAliasField(customer: Customer, customerInfo: CustomerInfo): Promise<void> {
		const totalAmount = getTotalAliases(customer, customerInfo, this._lastBooking)
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

	_updateGroupsField(): Promise<void> {
		let localAdminCount = getCurrentCount(BookingItemFeatureType.LocalAdminGroup, this._lastBooking)
		const localAdminText = localAdminCount > 0 ? ", " + getCurrentCount(BookingItemFeatureType.LocalAdminGroup, this._lastBooking) + " " + lang.get("localAdminGroup_label") : ""
		this._groupsField.setValue(getCurrentCount(BookingItemFeatureType.SharedMailGroup, this._lastBooking) + " " + lang.get("sharedMailbox_label") + localAdminText)
		return Promise.resolve()
	}

	_updateContactFormsField(): Promise<void> {
		const totalAmount = getCurrentCount(BookingItemFeatureType.ContactForm, this._lastBooking)
		this._contactFormsField.setValue(totalAmount.toString())
		return Promise.resolve()
	}

	_updateWhitelabelField(): Promise<void> {
		if (this._isWhitelabelActive()) {
			this._whitelabelField.setValue(lang.get("active_label"))
		} else {
			this._whitelabelField.setValue(lang.get("deactivated_label"))
		}
		return Promise.resolve()
	}

	_isWhitelabelActive(): boolean {
		return getCurrentCount(BookingItemFeatureType.Branding, this._lastBooking) != 0
	}

	entityEventReceived<T>(typeRef: TypeRef<any>, listId: ?string, elementId: string, operation: OperationTypeEnum): void {
		if (isSameTypeRef(typeRef, AccountingInfoTypeRef)) {
			load(AccountingInfoTypeRef, elementId).then(accountingInfo => this._updateAccountInfoData(accountingInfo))
			this._updatePriceInfo()
		} else if (isSameTypeRef(typeRef, UserTypeRef)) {
			this._updateBookings()
			this._updatePriceInfo()
		} else if (isSameTypeRef(typeRef, BookingTypeRef)) {
			this._updateBookings()
			this._updatePriceInfo()
		}
	}
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


function _getAccountTypeName(type: AccountTypeEnum, isPro: boolean): string {
	if (type == AccountType.PREMIUM && isPro) {
		return "Pro"
	} else {
		return AccountTypeNames[Number(type)];
	}
}

export function changeSubscriptionInterval(accountingInfo: AccountingInfo, paymentInterval: number): void {
	if (accountingInfo && accountingInfo.invoiceCountry && Number(accountingInfo.paymentInterval) != paymentInterval) {
		const invoiceCountry = neverNull(getByAbbreviation(neverNull(accountingInfo.invoiceCountry)))
		worker.updatePaymentData({
				businessUse: accountingInfo.business,
				paymentInterval: paymentInterval,
			}, {
				invoiceAddress: formatNameAndAddress(accountingInfo.invoiceName, accountingInfo.invoiceAddress),
				country: invoiceCountry,
				vatNumber: accountingInfo.invoiceVatIdNo
			},
			null,
			invoiceCountry)
	}
}
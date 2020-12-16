// @flow
import m from "mithril"
import {assertMainOrNode} from "../api/Env"
import type {AccountTypeEnum} from "../api/common/TutanotaConstants"
import {AccountType, AccountTypeNames, BookingItemFeatureType, Const, OperationType} from "../api/common/TutanotaConstants"
import type {Customer} from "../api/entities/sys/Customer"
import {CustomerTypeRef} from "../api/entities/sys/Customer"
import {assertNotNull, downcast, neverNull, noOp} from "../api/common/utils/Utils"
import type {CustomerInfo} from "../api/entities/sys/CustomerInfo"
import {CustomerInfoTypeRef} from "../api/entities/sys/CustomerInfo"
import {serviceRequest} from "../api/main/Entity"
import {logins} from "../api/main/LoginController"
import {lang} from "../misc/LanguageViewModel.js"
import {Button} from "../gui/base/Button"
import {Icons} from "../gui/base/icons/Icons"
import type {AccountingInfo} from "../api/entities/sys/AccountingInfo"
import {AccountingInfoTypeRef} from "../api/entities/sys/AccountingInfo"
import {worker} from "../api/main/WorkerClient"
import {elementIdPart, GENERATED_MAX_ID, HttpMethod} from "../api/common/EntityFunctions"
import {UserTypeRef} from "../api/entities/sys/User"
import {createNotAvailableForFreeClickHandler, formatPriceDataWithInfo, getCurrentCount} from "./PriceUtils"
import {formatDate, formatNameAndAddress, formatStorageSize} from "../misc/Formatter"
import {getByAbbreviation} from "../api/common/CountryList"
import type {Booking} from "../api/entities/sys/Booking"
import {BookingTypeRef} from "../api/entities/sys/Booking"
import {SysService} from "../api/entities/sys/Services"
import {MailAddressAliasServiceReturnTypeRef} from "../api/entities/sys/MailAddressAliasServiceReturn"
import * as AddUserDialog from "../settings/AddUserDialog"
import * as EmailAliasOptionsDialog from "./EmailAliasOptionsDialog"
import * as AddGroupDialog from "../settings/AddGroupDialog"
import * as ContactFormEditor from "../settings/ContactFormEditor"
import * as StorageCapacityOptionsDialog from "./StorageCapacityOptionsDialog"
import {showUpgradeWizard} from "./UpgradeSubscriptionWizard"
import {showSwitchDialog} from "./SwitchSubscriptionDialog"
import stream from "mithril/stream/stream.js"
import {showDeleteAccountDialog} from "./DeleteAccountDialog"
import {ExpanderButton, ExpanderPanel} from "../gui/base/Expander"
import type {OrderProcessingAgreement} from "../api/entities/sys/OrderProcessingAgreement"
import {OrderProcessingAgreementTypeRef} from "../api/entities/sys/OrderProcessingAgreement"
import * as SignOrderAgreementDialog from "./SignOrderProcessingAgreementDialog"
import {GroupInfoTypeRef} from "../api/entities/sys/GroupInfo"
import * as InvoiceDataDialog from "./InvoiceDataDialog"
import {NotFoundError} from "../api/common/error/RestError"
import type {EntityUpdateData} from "../api/main/EventController"
import {isUpdateForTypeRef} from "../api/main/EventController"
import type {SubscriptionTypeEnum} from "./SubscriptionUtils"
import {
	getIncludedAliases,
	getIncludedStorageCapacity,
	getNbrOfUsers,
	getSubscriptionType,
	getTotalAliases,
	getTotalStorageCapacity,
	isSharingActive,
	isWhitelabelActive,
	showSharingBuyDialog,
	showWhitelabelBuyDialog
} from "./SubscriptionUtils"
import type {ButtonAttrs} from "../gui/base/ButtonN"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import {TextFieldN} from "../gui/base/TextFieldN"
import {DropDownSelectorN} from "../gui/base/DropDownSelectorN"
import {Dialog} from "../gui/base/Dialog"
import {ColumnWidth, TableN} from "../gui/base/TableN"
import {showPurchaseGiftCardDialog} from "./giftcards/PurchaseGiftCardDialog"
import {
	createGiftCardTableLine, GIFT_CARD_TABLE_COLUMNS,
	GIFT_CARD_TABLE_HEADER,
	loadGiftCards,
} from "./giftcards/GiftCardUtils"
import type {GiftCard} from "../api/entities/sys/GiftCard"
import {GiftCardTypeRef} from "../api/entities/sys/GiftCard"
import {locator} from "../api/main/MainLocator"
import {Expandable} from "../settings/Expandable"
import type {ExpandableAttrs} from "../settings/Expandable"

assertMainOrNode()

const DAY = 1000 * 60 * 60 * 24;


export class SubscriptionViewer implements UpdatableSettingsViewer {
	view: () => Children;
	_subscriptionFieldValue: Stream<string>;
	_usageTypeFieldValue: Stream<string>;
	_orderAgreementFieldValue: Stream<string>;
	_selectedSubscriptionInterval: Stream<?number>;
	_currentPriceFieldValue: Stream<string>;
	_nextPriceFieldValue: Stream<string>;
	_usersFieldValue: Stream<string>;
	_storageFieldValue: Stream<string>;
	_emailAliasFieldValue: Stream<string>;
	_groupsFieldValue: Stream<string>;
	_contactFormsFieldValue: Stream<string>;
	_whitelabelFieldValue: Stream<string>;
	_sharingFieldValue: Stream<string>;
	_periodEndDate: ?Date;
	_nextPeriodPriceVisible: boolean;
	_customer: ?Customer;
	_customerInfo: ?CustomerInfo;
	_accountingInfo: ?AccountingInfo;
	_lastBooking: ?Booking;
	_orderAgreement: ?OrderProcessingAgreement;
	_currentSubscription: SubscriptionTypeEnum;
	_isCancelled: boolean;
	_giftCards: Map<Id, GiftCard>;
	_giftCardsExpanded: Stream<boolean>

	constructor() {
		let subscriptionAction = new Button("subscription_label", () => {
			if (this._accountingInfo && this._customer && this._customerInfo) {
				showSwitchDialog(this._accountingInfo,
					this._currentSubscription,
					getNbrOfUsers(this._lastBooking),
					getTotalStorageCapacity(neverNull(this._customer), neverNull(this._customerInfo), this._lastBooking),
					getTotalAliases(neverNull(this._customer), neverNull(this._customerInfo), this._lastBooking),
					getIncludedStorageCapacity(neverNull(this._customerInfo)),
					getIncludedAliases(neverNull(this._customerInfo)),
					isSharingActive(this._lastBooking),
					isWhitelabelActive(this._lastBooking))
			}
		}, () => Icons.Edit)

		const upgradeActionAttrs = {
			label: "upgrade_action",
			click: showUpgradeWizard,
			icon: () => Icons.Edit
		}
		const usageTypeActionAttrs = {
			label: "pricing.businessUse_label",
			click: () => this._switchToBusinessUse(),
			icon: () => Icons.Edit
		}
		const signOrderAgreementActionAttrs = {
			label: "sign_action",
			click: () => SignOrderAgreementDialog.showForSigning(neverNull(this._customer), neverNull(this._accountingInfo)),
			icon: () => Icons.Edit
		}
		const showOrderAgreementActionAttrs = {
			label: "show_action",
			click: () => locator.entityClient.load(GroupInfoTypeRef, neverNull(this._orderAgreement).signerUserGroupInfo)
			                    .then(signerUserGroupInfo => SignOrderAgreementDialog.showForViewing(neverNull(this._orderAgreement), signerUserGroupInfo)),
			icon: () => Icons.Download,

		}

		let subscriptionPeriods = [
			{name: lang.get("pricing.yearly_label") + ', ' + lang.get('automaticRenewal_label'), value: 12},
			{name: lang.get("pricing.monthly_label") + ', ' + lang.get('automaticRenewal_label'), value: 1}
		]

		const isPremiumPredicate = () => logins.getUserController().isPremiumAccount()

		const addUserButtonAttrs = {
			label: "addUsers_action",
			click: createNotAvailableForFreeClickHandler(false, AddUserDialog.show, isPremiumPredicate),
			icon: () => Icons.Add,
			type: ButtonType.Action,
		}
		const editUsersButtonAttrs = {
			label: "bookingItemUsers_label",
			click: createNotAvailableForFreeClickHandler(false, () => m.route.set("/settings/users"), isPremiumPredicate),
			icon: () => Icons.Edit,
			type: ButtonType.Action,
		}
		const changeStorageCapacityButtonAttrs = {
			label: "storageCapacity_label",
			click: createNotAvailableForFreeClickHandler(false, () => StorageCapacityOptionsDialog.show(), isPremiumPredicate),
			icon: () => Icons.Edit,
			type: ButtonType.Action,
		}
		const changeEmailAliasPackageButtonAttrs = {
			label: "emailAlias_label",
			click: createNotAvailableForFreeClickHandler(true, EmailAliasOptionsDialog.show, isPremiumPredicate),
			icon: () => Icons.Edit,
		}
		const addGroupsActionAttrs = {
			label: "addGroup_label",
			click: createNotAvailableForFreeClickHandler(false, AddGroupDialog.show, isPremiumPredicate),
			icon: () => Icons.Add,
		}
		const editGroupsActionAttrs = {
			label: "groups_label",
			click: createNotAvailableForFreeClickHandler(false, () => m.route.set("/settings/groups"), isPremiumPredicate),
			icon: () => Icons.Edit,
		}
		const addContactFormActionAttrs = {
			label: "createContactForm_label",
			click: createNotAvailableForFreeClickHandler(false, () => ContactFormEditor.show(null, true, noOp), isPremiumPredicate),
			icon: () => Icons.Add,
		}
		const editContactFormsActionAttrs = {
			label: "contactForms_label",
			click: createNotAvailableForFreeClickHandler(false, () => m.route.set("/settings/contactforms"), isPremiumPredicate),
			icon: () => Icons.Edit,

		}
		const enableWhiteLabelActionAttrs = {
			label: "whitelabelDomain_label",
			click: createNotAvailableForFreeClickHandler(false,
				() => showWhitelabelBuyDialog(true), isPremiumPredicate),
			icon: () => Icons.Edit,
		}
		const disableWhiteLabelActionAttrs = {
			label: "whitelabelDomain_label",
			click: createNotAvailableForFreeClickHandler(false,
				() => showWhitelabelBuyDialog(false), isPremiumPredicate),
			icon: () => Icons.Cancel,
		}
		const enableSharingActionAttrs = {
			label: "sharingFeature_label",
			click: createNotAvailableForFreeClickHandler(false,
				() => showSharingBuyDialog(true), isPremiumPredicate),
			icon: () => Icons.Edit,
		}
		const disableSharingActionAttrs = {
			label: "sharingFeature_label",
			click: createNotAvailableForFreeClickHandler(false,
				() => showSharingBuyDialog(false), isPremiumPredicate),
			icon: () => Icons.Cancel,
		}
		const deleteButtonAttrs = {
			label: "adminDeleteAccount_action",
			click: showDeleteAccountDialog,
			type: ButtonType.Login,
		}
		let deleteAccountExpander = new ExpanderButton("adminDeleteAccount_action", new ExpanderPanel({
			view: () => m(".flex-center.mb-l", m("", {style: {"width": '200px'}}, m(ButtonN, deleteButtonAttrs)))
		}), false)


		this._giftCards = new Map()
		loadGiftCards(assertNotNull(logins.getUserController().user.customer))
			.then(giftCards => {
				giftCards.forEach(giftCard => this._giftCards.set(elementIdPart(giftCard._id), giftCard))
			})
		this._giftCardsExpanded = stream(false)

		this.view = (): VirtualElement => {
			return m("#subscription-settings.fill-absolute.scroll.plr-l", [
				m(".h4.mt-l", lang.get('currentlyBooked_label')),
				m(TextFieldN, {
					label: "subscription_label",
					value: this._subscriptionFieldValue,
					disabled: true,
					injectionsRight: () => logins.getUserController().isFreeAccount()
						? m(ButtonN, upgradeActionAttrs)
						: !this._isCancelled
							? [m(subscriptionAction)]
							: null
				}),
				this._showPriceData()
					? m(TextFieldN, {
						label: "businessOrPrivateUsage_label",
						value: this._usageTypeFieldValue,
						disabled: true,
						injectionsRight: () => this._accountingInfo && !this._accountingInfo.business
						&& this._customer && !this._customer.canceledPremiumAccount
							? m(ButtonN, usageTypeActionAttrs)
							: null,
					})
					: null,
				this._showOrderAgreement()
					? m(TextFieldN, {
						label: "orderProcessingAgreement_label",
						helpLabel: () => lang.get("orderProcessingAgreementInfo_msg"),
						value: this._orderAgreementFieldValue,
						disabled: true,
						injectionsRight: () => {
							if (this._orderAgreement && this._customer && this._customer.orderProcessingAgreementNeeded) {
								return [m(ButtonN, signOrderAgreementActionAttrs), m(ButtonN, showOrderAgreementActionAttrs)]
							} else if (this._orderAgreement) {
								return [m(ButtonN, showOrderAgreementActionAttrs)]
							} else if (this._customer && this._customer.orderProcessingAgreementNeeded) {
								return [m(ButtonN, signOrderAgreementActionAttrs)]
							} else {
								return []
							}
						},
					})
					: null,
				this._showPriceData()
					? m(DropDownSelectorN, {
						label: "subscriptionPeriod_label",
						helpLabel: () => this._periodEndDate
							? lang.get("endOfSubscriptionPeriod_label", {"{1}": formatDate(this._periodEndDate)})
							: "",
						items: subscriptionPeriods,
						selectedValue: this._selectedSubscriptionInterval,
						dropdownWidth: 300,
						selectionChangedHandler: (value) => {
							if (this._accountingInfo) {
								changeSubscriptionInterval(this._accountingInfo, value, this._periodEndDate)
							}
						}
					})
					: null,
				this._showPriceData()
					? m(TextFieldN, {
						label: () => this._nextPeriodPriceVisible && this._periodEndDate
							? lang.get("priceTill_label", {"{date}": formatDate(this._periodEndDate)})
							: lang.get("price_label"),
						value: this._currentPriceFieldValue,
						disabled: true,
					})
					: null,
				this._showPriceData() && this._nextPeriodPriceVisible && this._periodEndDate
					? m(TextFieldN, {
						label: () => lang.get("priceFrom_label", {
							"{date}": formatDate(new Date(neverNull(this._periodEndDate).getTime() + DAY))
						}),
						helpLabel: () => lang.get("nextSubscriptionPrice_msg"),
						value: this._nextPriceFieldValue,
						disabled: true,
					})
					: null,
				m(".h4.mt-l", lang.get('adminPremiumFeatures_action')),
				m(TextFieldN, {
					label: "bookingItemUsers_label",
					value: this._usersFieldValue,
					disabled: true,
					injectionsRight: () => [m(ButtonN, addUserButtonAttrs), m(ButtonN, editUsersButtonAttrs)]
				}),
				m(Expandable, renderGiftCardExpandable(Array.from(this._giftCards.values()), isPremiumPredicate, this._giftCardsExpanded)),
				m(".h4.mt-l", lang.get('adminPremiumFeatures_action')),
				m(TextFieldN, {
					label: "bookingItemUsers_label",
					value: this._usersFieldValue,
					disabled: true,
					injectionsRight: () => [m(ButtonN, addUserButtonAttrs), m(ButtonN, editUsersButtonAttrs)]
				}),
				m(TextFieldN, {
					label: "storageCapacity_label",
					value: this._storageFieldValue,
					disabled: true,
					injectionsRight: () => m(ButtonN, changeStorageCapacityButtonAttrs)
				}),
				m(TextFieldN, {
					label: "mailAddressAliases_label",
					value: this._emailAliasFieldValue,
					disabled: true,
					injectionsRight: () => m(ButtonN, changeEmailAliasPackageButtonAttrs),
				}),
				m(TextFieldN, {
					label: "groups_label",
					value: this._groupsFieldValue,
					disabled: true,
					injectionsRight: () => [m(ButtonN, addGroupsActionAttrs), m(ButtonN, editGroupsActionAttrs)],
				}),
				m(TextFieldN, {
					label: "whitelabel_label",
					value: this._whitelabelFieldValue,
					disabled: true,
					injectionsRight: () => (getCurrentCount(BookingItemFeatureType.Whitelabel, this._lastBooking) === 0)
						? m(ButtonN, enableWhiteLabelActionAttrs)
						: m(ButtonN, disableWhiteLabelActionAttrs),
				}),
				m(TextFieldN, {
					label: "sharingFeature_label",
					value: this._sharingFieldValue,
					disabled: true,
					injectionsRight: () => (getCurrentCount(BookingItemFeatureType.Sharing, this._lastBooking) === 0)
						? m(ButtonN, enableSharingActionAttrs)
						: m(ButtonN, disableSharingActionAttrs)
					,
				}),
				m(TextFieldN, {
					label: "contactForms_label",
					value: this._contactFormsFieldValue,
					disabled: true,
					injectionsRight: () => [m(ButtonN, addContactFormActionAttrs), m(ButtonN, editContactFormsActionAttrs)],
				}),
				m(".flex-space-between.items-center.mt-l.mb", [
					m(".h4", lang.get('adminDeleteAccount_action')),
					m(deleteAccountExpander)
				]),
				m(deleteAccountExpander.panel),
			])
		}

		locator.entityClient.load(CustomerTypeRef, neverNull(logins.getUserController().user.customer))
		       .then(customer => {
			       this._updateOrderProcessingAgreement(customer)
			       return locator.entityClient.load(CustomerInfoTypeRef, customer.customerInfo)
		       })
		       .then(customerInfo => {
			       this._customerInfo = customerInfo
			       return locator.entityClient.load(AccountingInfoTypeRef, customerInfo.accountingInfo)
		       })
		       .then(accountingInfo => {
			       this._updateAccountInfoData(accountingInfo)
		       })

		const loadingString = lang.get("loading_msg")
		this._currentPriceFieldValue = stream(loadingString)
		this._subscriptionFieldValue = stream(loadingString)
		this._usageTypeFieldValue = stream(loadingString)
		this._orderAgreementFieldValue = stream(loadingString)
		this._nextPriceFieldValue = stream(loadingString)
		this._usersFieldValue = stream(loadingString)
		this._storageFieldValue = stream(loadingString)
		this._emailAliasFieldValue = stream(loadingString)
		this._groupsFieldValue = stream(loadingString)
		this._whitelabelFieldValue = stream(loadingString)
		this._sharingFieldValue = stream(loadingString)
		this._contactFormsFieldValue = stream(loadingString)
		this._selectedSubscriptionInterval = stream(null)
		this._updatePriceInfo()
		this._updateBookings()
	}

	_showOrderAgreement(): boolean {
		return (logins.getUserController().isPremiumAccount() || logins.getUserController().isOutlookAccount())
			&& (this._accountingInfo != null && this._accountingInfo.business
				|| this._customer != null && (this._customer.orderProcessingAgreement != null
					|| this._customer.orderProcessingAgreementNeeded))
	}

	_updateOrderProcessingAgreement(customer: Customer) {
		let p = Promise.resolve()
		this._customer = customer
		if (this._customer.orderProcessingAgreement) {
			p = locator.entityClient.load(OrderProcessingAgreementTypeRef, this._customer.orderProcessingAgreement).then(a => {
				this._orderAgreement = a
			})
		} else {
			this._orderAgreement = null
		}
		p.then(() => {
			if (customer.orderProcessingAgreementNeeded) {
				this._orderAgreementFieldValue(lang.get("signingNeeded_msg"))
			} else if (this._orderAgreement) {
				this._orderAgreementFieldValue(lang.get("signedOn_msg", {"{date}": formatDate(this._orderAgreement.signatureDate)}))
			} else {
				this._orderAgreementFieldValue(lang.get("notSigned_msg"))
			}
			m.redraw()
		})
	}

	_switchToBusinessUse(): void {
		if (this._accountingInfo && !this._accountingInfo.business) {
			let accountingInfo = neverNull(this._accountingInfo)
			const invoiceCountry = neverNull(getByAbbreviation(neverNull(accountingInfo.invoiceCountry)))
			InvoiceDataDialog.show({
				businessUse: stream(true),
				paymentInterval: stream(Number(accountingInfo.paymentInterval)),
			}, {
				invoiceAddress: formatNameAndAddress(accountingInfo.invoiceName, accountingInfo.invoiceAddress),
				country: invoiceCountry,
				vatNumber: ""
			}, "pricing.businessUse_label", "businessChangeInfo_msg")
		}
	}

	_showPriceData(): boolean {
		return logins.getUserController().isPremiumAccount() || logins.getUserController().isOutlookAccount()
	}

	_updatePriceInfo(): Promise<void> {
		if (!this._showPriceData()) {
			return Promise.resolve();
		} else {
			return worker.getCurrentPrice().then(priceServiceReturn => {
				if (priceServiceReturn.currentPriceThisPeriod != null && priceServiceReturn.currentPriceNextPeriod != null) {
					if (priceServiceReturn.currentPriceThisPeriod.price !== priceServiceReturn.currentPriceNextPeriod.price) {
						this._currentPriceFieldValue(formatPriceDataWithInfo(priceServiceReturn.currentPriceThisPeriod))
						this._nextPriceFieldValue(formatPriceDataWithInfo(neverNull(priceServiceReturn.currentPriceNextPeriod)))
						this._nextPeriodPriceVisible = true
					} else {
						this._currentPriceFieldValue(formatPriceDataWithInfo(priceServiceReturn.currentPriceThisPeriod))
						this._nextPeriodPriceVisible = false
					}
					this._periodEndDate = priceServiceReturn.periodEndDate
					m.redraw()
				}
			})
		}
	}

	_updateAccountInfoData(accountingInfo: AccountingInfo) {
		this._accountingInfo = accountingInfo
		this._usageTypeFieldValue(accountingInfo.business ? lang.get("pricing.businessUse_label") : lang.get("pricing.privateUse_label"))
		this._selectedSubscriptionInterval(Number(accountingInfo.paymentInterval))

		m.redraw()
	}

	_updateSubscriptionField(cancelled: boolean) {
		const cancelledText = cancelled && this._periodEndDate
			? " "
			+ lang.get("cancelledBy_label", {"{endOfSubscriptionPeriod}": formatDate(this._periodEndDate)}) : ""
		const accountType: AccountTypeEnum = downcast(logins.getUserController().user.accountType)
		this._subscriptionFieldValue(_getAccountTypeName(accountType, this._currentSubscription) + cancelledText)
	}

	_updateBookings(): Promise<void> {
		return locator.entityClient.load(CustomerTypeRef, neverNull(logins.getUserController().user.customer)).then(customer => {
			return locator.entityClient.load(CustomerInfoTypeRef, customer.customerInfo)
			              .catch(NotFoundError, e => console.log("could not update bookings as customer info does not exist (moved between free/premium lists)"))
			              .then(customerInfo => {
				              if (!customerInfo) {
					              return
				              }
				              this._customerInfo = customerInfo
				              return locator.entityClient.loadRange(BookingTypeRef, neverNull(customerInfo.bookings).items, GENERATED_MAX_ID, 1, true)
				                            .then(bookings => {
					                            this._lastBooking = bookings.length > 0 ? bookings[bookings.length - 1] : null
					                            this._isCancelled = customer.canceledPremiumAccount
					                            this._currentSubscription = getSubscriptionType(this._lastBooking, customer, customerInfo)
					                            this._updateSubscriptionField(this._isCancelled)
					                            return Promise.all([
							                            this._updateUserField(),
							                            this._updateStorageField(customer, customerInfo),
							                            this._updateAliasField(customer, customerInfo),
							                            this._updateGroupsField(),
							                            this._updateWhitelabelField(),
							                            this._updateSharingField(),
							                            this._updateContactFormsField()
						                            ]
					                            ).then(() => m.redraw())
				                            })
			              })
		})
	}


	_updateUserField(): Promise<void> {
		this._usersFieldValue("" + Math.max(1, getCurrentCount(BookingItemFeatureType.Users, this._lastBooking)))
		return Promise.resolve()
	}

	_updateStorageField(customer: Customer, customerInfo: CustomerInfo): Promise<void> {
		return worker.readUsedCustomerStorage().then(usedStorage => {
			const usedStorageFormatted = formatStorageSize(Number(usedStorage))
			const totalStorageFormatted = formatStorageSize(getTotalStorageCapacity(customer, customerInfo, this._lastBooking)
				* Const.MEMORY_GB_FACTOR)
			this._storageFieldValue(lang.get("amountUsedOf_label", {
				"{amount}": usedStorageFormatted,
				"{totalAmount}": totalStorageFormatted
			}))
		})
	}

	_updateAliasField(customer: Customer, customerInfo: CustomerInfo): Promise<void> {
		const totalAmount = getTotalAliases(customer, customerInfo, this._lastBooking)
		if (totalAmount === 0) {
			this._emailAliasFieldValue("0")
			return Promise.resolve()
		} else {
			return serviceRequest(SysService.MailAddressAliasService, HttpMethod.GET, null, MailAddressAliasServiceReturnTypeRef)
				.then(aliasServiceReturn => {
					this._emailAliasFieldValue(lang.get("amountUsedAndActivatedOf_label", {
						"{used}": aliasServiceReturn.usedAliases,
						"{active}": aliasServiceReturn.enabledAliases,
						"{totalAmount}": totalAmount
					}))
				})
				.return()
		}
	}

	_updateGroupsField(): Promise<void> {
		let localAdminCount = getCurrentCount(BookingItemFeatureType.LocalAdminGroup, this._lastBooking)
		const localAdminText = localAdminCount + " " + lang.get(localAdminCount === 1 ? "localAdminGroup_label" : "localAdminGroups_label")
		let sharedMailCount = getCurrentCount(BookingItemFeatureType.SharedMailGroup, this._lastBooking)
		const sharedMailText = sharedMailCount + " " + lang.get(sharedMailCount === 1 ? "sharedMailbox_label" : "sharedMailboxes_label")
		if (localAdminCount === 0) { // also show the shared mailboxes text if no groups exists at all
			this._groupsFieldValue(sharedMailText)
		} else if (localAdminCount > 0 && sharedMailCount > 0) {
			this._groupsFieldValue(sharedMailText + ", " + localAdminText)
		} else {
			this._groupsFieldValue(localAdminText)
		}
		return Promise.resolve()
	}

	_updateContactFormsField(): Promise<void> {
		const totalAmount = getCurrentCount(BookingItemFeatureType.ContactForm, this._lastBooking)
		this._contactFormsFieldValue(totalAmount.toString())
		return Promise.resolve()
	}

	_updateWhitelabelField(): Promise<void> {
		if (isWhitelabelActive(this._lastBooking)) {
			this._whitelabelFieldValue(lang.get("active_label"))
		} else {
			this._whitelabelFieldValue(lang.get("deactivated_label"))
		}
		return Promise.resolve()
	}

	_updateSharingField(): Promise<void> {
		if (isSharingActive(this._lastBooking)) {
			this._sharingFieldValue(lang.get("active_label"))
		} else {
			this._sharingFieldValue(lang.get("deactivated_label"))
		}
		return Promise.resolve()
	}

	entityEventsReceived(updates: $ReadOnlyArray<EntityUpdateData>): Promise<void> {
		return Promise.each(updates, update => {
			return this.processUpdate(update)
		}).return()
	}

	processUpdate(update: EntityUpdateData): Promise<void> {
		const {instanceListId, instanceId} = update
		if (isUpdateForTypeRef(AccountingInfoTypeRef, update)) {
			return locator.entityClient.load(AccountingInfoTypeRef, instanceId).then(accountingInfo => this._updateAccountInfoData(accountingInfo)).then(() => {
				return this._updatePriceInfo()
			})
		} else if (isUpdateForTypeRef(UserTypeRef, update)) {
			return this._updateBookings().then(() => {
				return this._updatePriceInfo()
			})
		} else if (isUpdateForTypeRef(BookingTypeRef, update)) {
			return this._updateBookings().then(() => {
				return this._updatePriceInfo()
			})
		} else if (isUpdateForTypeRef(CustomerTypeRef, update)) {
			return locator.entityClient.load(CustomerTypeRef, instanceId).then(customer => this._updateOrderProcessingAgreement(customer))
		} else if (isUpdateForTypeRef(GiftCardTypeRef, update)) {
			return locator.entityClient.load(GiftCardTypeRef, [instanceListId, instanceId]).then(giftCard => {
				this._giftCards.set(elementIdPart(giftCard._id), giftCard)
				if (update.operation === OperationType.CREATE) this._giftCardsExpanded(true)
			})
		} else {
			return Promise.resolve()
		}
	}
}

function _getAccountTypeName(type: AccountTypeEnum, subscription: SubscriptionTypeEnum): string {
	if (type === AccountType.PREMIUM) {
		return subscription
	} else {
		return AccountTypeNames[Number(type)];
	}
}

function changeSubscriptionInterval(accountingInfo: AccountingInfo, paymentInterval: number, periodEndDate: ?Date): void {
	if (accountingInfo && accountingInfo.invoiceCountry && Number(accountingInfo.paymentInterval) !== paymentInterval) {
		const confirmationMessage = () => {
			return periodEndDate
				? lang.get("subscriptionChangePeriod_msg", {"{1}": formatDate(periodEndDate)})
				: lang.get("subscriptionChange_msg")
		}
		Dialog.confirm(confirmationMessage).then((confirmed) => {
			if (confirmed) {
				const invoiceCountry = neverNull(getByAbbreviation(neverNull(accountingInfo.invoiceCountry)))
				worker.updatePaymentData(accountingInfo.business, paymentInterval, {
						invoiceAddress: formatNameAndAddress(accountingInfo.invoiceName, accountingInfo.invoiceAddress),
						country: invoiceCountry,
						vatNumber: accountingInfo.invoiceVatIdNo
					},
					null,
					invoiceCountry)
			}
		})
	}
}

function renderGiftCardExpandable(giftCards: GiftCard[], isPremiumPredicate: () => boolean, expanded: Stream<boolean>): ExpandableAttrs {
	const purchaseGiftCardButtonAttrs: ButtonAttrs = {
		label: "buyGiftCard_label",
		click: createNotAvailableForFreeClickHandler(false, () => showPurchaseGiftCardDialog(), isPremiumPredicate),
		icon: () => Icons.Add
	}

	return {
		title: "giftCards_label",
		infoMsg: "giftCardSection_label",
		children: [
			m(TableN, {
				columnHeading: GIFT_CARD_TABLE_HEADER,
				columnWidths: GIFT_CARD_TABLE_COLUMNS,
				showActionButtonColumn: true,
				addButtonAttrs: purchaseGiftCardButtonAttrs,
				lines: giftCards.filter(giftCard => giftCard.usable).map(giftCard => createGiftCardTableLine(giftCard)),
			})
		],
		expanded,
	}
}


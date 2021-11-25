// @flow
import type {SettingsSection, SettingsValue} from "./SettingsModel"
import type {EntityUpdateData} from "../../api/main/EventController"
import m from "mithril"
import type {TextFieldAttrs} from "../../gui/base/TextFieldN"
import {ButtonN, ButtonType} from "../../gui/base/ButtonN"
import {createNotAvailableForFreeClickHandler} from "../../misc/SubscriptionDialogs"
import * as AddUserDialog from "../AddUserDialog"
import {Icons} from "../../gui/base/icons/Icons"
import {showStorageCapacityOptionsDialog} from "../../subscription/StorageCapacityOptionsDialog"
import {logins} from "../../api/main/LoginController"
import * as EmailAliasOptionsDialog from "../../subscription/EmailAliasOptionsDialog"
import * as AddGroupDialog from "../AddGroupDialog"
import {getCurrentCount} from "../../subscription/PriceUtils"
import {BookingItemFeatureType, Const} from "../../api/common/TutanotaConstants"
import type {Booking} from "../../api/entities/sys/Booking"
import {showBusinessBuyDialog, showSharingBuyDialog, showWhitelabelBuyDialog} from "../../subscription/BuyDialog"
import {
	getSubscriptionType,
	getTotalAliases,
	getTotalStorageCapacity,
	isBusinessFeatureActive, isSharingActive,
	isWhitelabelActive
} from "../../subscription/SubscriptionUtils"
import type {Customer} from "../../api/entities/sys/Customer"
import {CustomerTypeRef} from "../../api/entities/sys/Customer"
import * as ContactFormEditor from "../ContactFormEditor"
import {neverNull, noOp} from "../../api/common/utils/Utils"
import {locator} from "../../api/main/MainLocator"
import {lang} from "../../misc/LanguageViewModel"
import stream from "mithril/stream/stream.js"
import {BookingTypeRef} from "../../api/entities/sys/Booking"
import {GENERATED_MAX_ID, getEtId} from "../../api/common/utils/EntityUtils"
import {CustomerInfoTypeRef} from "../../api/entities/sys/CustomerInfo"
import {ofClass} from "../../api/common/utils/PromiseUtils"
import {NotFoundError} from "../../api/common/error/RestError"
import type {CustomerInfo} from "../../api/entities/sys/CustomerInfo"
import {worker} from "../../api/main/WorkerClient"
import {formatStorageSize} from "../../misc/Formatter"
import {serviceRequest} from "../../api/main/Entity"
import {SysService} from "../../api/entities/sys/Services"
import {HttpMethod} from "../../api/common/EntityFunctions"
import {MailAddressAliasServiceReturnTypeRef} from "../../api/entities/sys/MailAddressAliasServiceReturn"
import {TextFieldN} from "../../gui/base/TextFieldN"

export class ExtensionsSettingsSection implements SettingsSection {
	heading: string
	category: string
	settingsValues: Array<SettingsValue<any>>

	isPremiumPredicate: Function
	usersFieldValue: Stream<string>
	storageFieldValue: Stream<string>
	emailAliasFieldValue: Stream<string>
	groupsFieldValue: Stream<string>
	lastBooking: ?Booking
	whitelabelFieldValue: Stream<string>
	sharingFieldValue: Stream<string>
	businessFeatureFieldValue: Stream<string>
	customer: ?Customer
	contactFormsFieldValue: Stream<string>

	constructor() {
		this.heading = "Extensions"
		this.category = "Subscription"
		this.settingsValues = []

		const loadingString = lang.get("loading_msg")
		this.usersFieldValue = stream(loadingString)
		this.storageFieldValue = stream(loadingString)
		this.emailAliasFieldValue = stream(loadingString)
		this.groupsFieldValue = stream(loadingString)
		this.whitelabelFieldValue = stream(loadingString)
		this.sharingFieldValue = stream(loadingString)
		this.businessFeatureFieldValue = stream(loadingString)
		this.contactFormsFieldValue = stream(loadingString)
		this.updateBookings()
		this.isPremiumPredicate = () => logins.getUserController().isPremiumAccount()
		locator.entityClient.load(CustomerTypeRef, neverNull(logins.getUserController().user.customer))
		       .then(customer => this.customer = customer)

		this.settingsValues.push(this.createBookingItemSetting())
		this.settingsValues.push(this.createStorageSetting())
		this.settingsValues.push(this.createEmailAliasSetting())
		this.settingsValues.push(this.createGroupSetting())
		this.settingsValues.push(this.createWhitelabelSetting())
		this.settingsValues.push(this.createSharingSetting())
		this.settingsValues.push(this.createBusinessSetting())
		this.settingsValues.push(this.createContactSetting())
	}

	createBookingItemSetting(): SettingsValue<TextFieldAttrs> {

		const addUserButtonAttrs = {
			label: "addUsers_action",
			click: createNotAvailableForFreeClickHandler(false, AddUserDialog.show, this.isPremiumPredicate),
			icon: () => Icons.Add,
			type: ButtonType.Action,
		}
		const editUsersButtonAttrs = {
			label: "bookingItemUsers_label",
			click: createNotAvailableForFreeClickHandler(false, () => m.route.set("/settings/users"), this.isPremiumPredicate),
			icon: () => Icons.Edit,
			type: ButtonType.Action,
		}

		const SettingsAttrs: TextFieldAttrs = {
			label: "bookingItemUsers_label",
			value: this.usersFieldValue,
			disabled: true,
			injectionsRight: () => [m(ButtonN, addUserButtonAttrs), m(ButtonN, editUsersButtonAttrs)]
		}

		return {
			component: TextFieldN,
			attrs: SettingsAttrs
		}
	}

	createStorageSetting(): SettingsValue<TextFieldAttrs> {

		const changeStorageCapacityButtonAttrs = {
			label: "storageCapacity_label",
			click: createNotAvailableForFreeClickHandler(false, () => showStorageCapacityOptionsDialog(), this.isPremiumPredicate),
			icon: () => Icons.Edit,
			type: ButtonType.Action,
		}

		const SettingsAttrs: TextFieldAttrs = {
			label: "storageCapacity_label",
			value: this.storageFieldValue,
			disabled: true,
			injectionsRight: () => m(ButtonN, changeStorageCapacityButtonAttrs)
		}

		return {
			component: TextFieldN,
			attrs: SettingsAttrs
		}
	}

	createEmailAliasSetting(): SettingsValue<TextFieldAttrs> {

		const changeEmailAliasPackageButtonAttrs = {
			label: "emailAlias_label",
			click: createNotAvailableForFreeClickHandler(true, EmailAliasOptionsDialog.show, this.isPremiumPredicate),
			icon: () => Icons.Edit,
		}

		const SettingsAttrs: TextFieldAttrs = {
			label: "mailAddressAliases_label",
			value: this.emailAliasFieldValue,
			disabled: true,
			injectionsRight: () => m(ButtonN, changeEmailAliasPackageButtonAttrs),
		}

		return {
			component: TextFieldN,
			attrs: SettingsAttrs
		}
	}

	createGroupSetting(): SettingsValue<TextFieldAttrs> {

		const addGroupsActionAttrs = {
			label: "addGroup_label",
			click: createNotAvailableForFreeClickHandler(false, AddGroupDialog.show, this.isPremiumPredicate),
			icon: () => Icons.Add,
		}
		const editGroupsActionAttrs = {
			label: "groups_label",
			click: createNotAvailableForFreeClickHandler(false, () => m.route.set("/settings/groups"), this.isPremiumPredicate),
			icon: () => Icons.Edit,
		}

		const SettingsAttrs: TextFieldAttrs = {
			label: "groups_label",
			value: this.groupsFieldValue,
			disabled: true,
			injectionsRight: () => [m(ButtonN, addGroupsActionAttrs), m(ButtonN, editGroupsActionAttrs)],
		}

		return {
			component: TextFieldN,
			attrs: SettingsAttrs
		}
	}

	createWhitelabelSetting(): SettingsValue<TextFieldAttrs> {

		const enableWhiteLabelActionAttrs = {
			label: "activate_action",
			click: createNotAvailableForFreeClickHandler(false,
				() => showWhitelabelBuyDialog(true), this.isPremiumPredicate),
			icon: () => Icons.Edit,
		}
		const disableWhiteLabelActionAttrs = {
			label: "deactivate_action",
			click: createNotAvailableForFreeClickHandler(false,
				() => showWhitelabelBuyDialog(false), this.isPremiumPredicate),
			icon: () => Icons.Cancel,
		}

		const SettingsAttrs: TextFieldAttrs = {
			label: "whitelabelFeature_label",
			value: this.whitelabelFieldValue,
			disabled: true,
			injectionsRight: () => (getCurrentCount(BookingItemFeatureType.Whitelabel, this.lastBooking) === 0)
				? m(ButtonN, enableWhiteLabelActionAttrs)
				: m(ButtonN, disableWhiteLabelActionAttrs),
		}

		return {
			component: TextFieldN,
			attrs: SettingsAttrs
		}
	}

	createSharingSetting(): SettingsValue<TextFieldAttrs> {

		const enableSharingActionAttrs = {
			label: "activate_action",
			click: createNotAvailableForFreeClickHandler(
				false,
				() => showSharingBuyDialog(true),
				this.isPremiumPredicate
			),
			icon: () => Icons.Edit,
		}
		const disableSharingActionAttrs = {
			label: "deactivate_action",
			click: createNotAvailableForFreeClickHandler(
				false,
				() => showSharingBuyDialog(false),
				this.isPremiumPredicate
			),
			icon: () => Icons.Cancel,
		}

		const SettingsAttrs: TextFieldAttrs = {
			label: "sharingFeature_label",
			value: this.sharingFieldValue,
			disabled: true,
			injectionsRight: () => (getCurrentCount(BookingItemFeatureType.Sharing, this.lastBooking) === 0)
				? m(ButtonN, enableSharingActionAttrs)
				: m(ButtonN, disableSharingActionAttrs)
		}

		return {
			component: TextFieldN,
			attrs: SettingsAttrs
		}
	}

	createBusinessSetting(): SettingsValue<TextFieldAttrs> {

		const enableBusinessActionAttrs = {
			label: "activate_action",
			click: createNotAvailableForFreeClickHandler(false,
				() => showBusinessBuyDialog(true), this.isPremiumPredicate),
			icon: () => Icons.Edit,
		}
		const disableBusinessActionAttrs = {
			label: "deactivate_action",
			click: createNotAvailableForFreeClickHandler(false,
				() => showBusinessBuyDialog(false), this.isPremiumPredicate),
			icon: () => Icons.Cancel,
		}

		const SettingsAttrs: TextFieldAttrs = {
			label: "businessFeature_label",
			value: this.businessFeatureFieldValue,
			disabled: true,
			injectionsRight: () => {
				if (!this.customer || this.customer.businessUse && isBusinessFeatureActive(this.lastBooking)) {
					// viewer not initialized yet or customer is business customer as they are not allowed to disable business feature
					return null
				} else if (isBusinessFeatureActive(this.lastBooking)) {
					return m(ButtonN, disableBusinessActionAttrs)
				} else {
					return m(ButtonN, enableBusinessActionAttrs)
				}
			}
		}

		return {
			component: TextFieldN,
			attrs: SettingsAttrs
		}
	}

	createContactSetting(): SettingsValue<TextFieldAttrs> {

		const addContactFormActionAttrs = {
			label: "createContactForm_label",
			click: createNotAvailableForFreeClickHandler(false, () => ContactFormEditor.show(null, true, noOp), this.isPremiumPredicate),
			icon: () => Icons.Add,
		}
		const editContactFormsActionAttrs = {
			label: "contactForms_label",
			click: createNotAvailableForFreeClickHandler(false, () => m.route.set("/settings/contactforms"), this.isPremiumPredicate),
			icon: () => Icons.Edit,

		}

		const SettingsAttrs: TextFieldAttrs = {
			label: "contactForms_label",
			value: this.contactFormsFieldValue,
			disabled: true,
			injectionsRight: () => [m(ButtonN, addContactFormActionAttrs), m(ButtonN, editContactFormsActionAttrs)],
		}

		return {
			component: TextFieldN,
			attrs: SettingsAttrs
		}
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
				              return locator.entityClient.loadRange(BookingTypeRef, neverNull(customerInfo.bookings).items, GENERATED_MAX_ID, 1, true)
				                            .then(bookings => {
					                            this.lastBooking = bookings.length > 0 ? bookings[bookings.length - 1] : null
					                            this.customer = customer
					                            return Promise.all([
							                            this.updateUserField(),
							                            this.updateStorageField(customer, customerInfo),
							                            this.updateAliasField(customer, customerInfo),
							                            this.updateGroupsField(),
							                            this.updateWhitelabelField(),
							                            this.updateSharingField(),
							                            this.updateBusinessFeatureField(),
							                            this.updateContactFormsField()
						                            ]
					                            ).then(() => m.redraw())
				                            })
			              })
		})
	}

	updateUserField(): Promise<void> {
		this.usersFieldValue("" + Math.max(1, getCurrentCount(BookingItemFeatureType.Users, this.lastBooking)))
		return Promise.resolve()
	}

	updateStorageField(customer: Customer, customerInfo: CustomerInfo): Promise<void> {
		return worker.customerFacade.readUsedCustomerStorage(getEtId(customer)).then(usedStorage => {
			const usedStorageFormatted = formatStorageSize(Number(usedStorage))
			const totalStorageFormatted = formatStorageSize(getTotalStorageCapacity(customer, customerInfo, this.lastBooking)
				* Const.MEMORY_GB_FACTOR)
			this.storageFieldValue(lang.get("amountUsedOf_label", {
				"{amount}": usedStorageFormatted,
				"{totalAmount}": totalStorageFormatted
			}))
		})
	}

	updateAliasField(customer: Customer, customerInfo: CustomerInfo): Promise<void> {
		const totalAmount = getTotalAliases(customer, customerInfo, this.lastBooking)
		if (totalAmount === 0) {
			this.emailAliasFieldValue("0")
			return Promise.resolve()
		} else {
			return serviceRequest(SysService.MailAddressAliasService, HttpMethod.GET, null, MailAddressAliasServiceReturnTypeRef)
				.then(aliasServiceReturn => {
					this.emailAliasFieldValue(lang.get("amountUsedAndActivatedOf_label", {
						"{used}": aliasServiceReturn.usedAliases,
						"{active}": aliasServiceReturn.enabledAliases,
						"{totalAmount}": totalAmount
					}))
				})
				.then(noOp)
		}
	}

	updateGroupsField(): Promise<void> {
		let localAdminCount = getCurrentCount(BookingItemFeatureType.LocalAdminGroup, this.lastBooking)
		const localAdminText = localAdminCount + " " + lang.get(localAdminCount === 1 ? "localAdminGroup_label" : "localAdminGroups_label")
		let sharedMailCount = getCurrentCount(BookingItemFeatureType.SharedMailGroup, this.lastBooking)
		const sharedMailText = sharedMailCount + " " + lang.get(sharedMailCount === 1 ? "sharedMailbox_label" : "sharedMailboxes_label")
		if (localAdminCount === 0) { // also show the shared mailboxes text if no groups exists at all
			this.groupsFieldValue(sharedMailText)
		} else if (localAdminCount > 0 && sharedMailCount > 0) {
			this.groupsFieldValue(sharedMailText + ", " + localAdminText)
		} else {
			this.groupsFieldValue(localAdminText)
		}
		return Promise.resolve()
	}

	updateContactFormsField(): Promise<void> {
		const totalAmount = getCurrentCount(BookingItemFeatureType.ContactForm, this.lastBooking)
		this.contactFormsFieldValue(totalAmount.toString())
		return Promise.resolve()
	}

	updateWhitelabelField(): Promise<void> {
		if (isWhitelabelActive(this.lastBooking)) {
			this.whitelabelFieldValue(lang.get("active_label"))
		} else {
			this.whitelabelFieldValue(lang.get("deactivated_label"))
		}
		return Promise.resolve()
	}

	updateSharingField(): Promise<void> {
		if (isSharingActive(this.lastBooking)) {
			this.sharingFieldValue(lang.get("active_label"))
		} else {
			this.sharingFieldValue(lang.get("deactivated_label"))
		}
		return Promise.resolve()
	}

	updateBusinessFeatureField(): Promise<void> {
		if (!this.customer) {
			this.businessFeatureFieldValue("")
		} else if (isBusinessFeatureActive(this.lastBooking)) {
			this.businessFeatureFieldValue(lang.get("active_label"))
		} else {
			this.businessFeatureFieldValue(lang.get("deactivated_label"))
		}
		return Promise.resolve()
	}

	entityEventReceived(updates: $ReadOnlyArray<EntityUpdateData>, eventOwnerGroupId: Id): Promise<mixed> {
		return Promise.resolve(undefined);
	}
}
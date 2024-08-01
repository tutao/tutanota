import m, { Children } from "mithril"
import { assertMainOrNode, isIOSApp } from "../api/common/Env"
import {
	AccountType,
	AccountTypeNames,
	ApprovalStatus,
	AvailablePlans,
	BookingItemFeatureType,
	Const,
	getPaymentMethodType,
	LegacyPlans,
	NewPaidPlans,
	OperationType,
	PaymentMethodType,
	PlanType,
} from "../api/common/TutanotaConstants"
import type { AccountingInfo, Booking, Customer, CustomerInfo, GiftCard, OrderProcessingAgreement, PlanConfiguration } from "../api/entities/sys/TypeRefs.js"
import {
	AccountingInfoTypeRef,
	BookingTypeRef,
	CustomerInfoTypeRef,
	CustomerTypeRef,
	GiftCardTypeRef,
	GroupInfoTypeRef,
	OrderProcessingAgreementTypeRef,
	UserTypeRef,
} from "../api/entities/sys/TypeRefs.js"
import { assertNotNull, base64ExtToBase64, base64ToUint8Array, downcast, incrementDate, neverNull, promiseMap } from "@tutao/tutanota-utils"
import { InfoLink, lang, TranslationKey } from "../misc/LanguageViewModel"
import { Icons } from "../gui/base/icons/Icons"
import { asPaymentInterval, formatPrice, formatPriceDataWithInfo, PaymentInterval } from "./PriceUtils"
import { formatDate, formatStorageSize } from "../misc/Formatter"
import { showUpgradeWizard } from "./UpgradeSubscriptionWizard"
import { showSwitchDialog } from "./SwitchSubscriptionDialog"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import * as SignOrderAgreementDialog from "./SignOrderProcessingAgreementDialog"
import { NotFoundError } from "../api/common/error/RestError"
import {
	appStorePlanName,
	getCurrentCount,
	getTotalStorageCapacityPerCustomer,
	isAutoResponderActive,
	isEventInvitesActive,
	isSharingActive,
	isWhitelabelActive,
	queryAppStoreSubscriptionOwnership,
} from "./SubscriptionUtils"
import { TextField } from "../gui/base/TextField.js"
import { Dialog, DialogType } from "../gui/base/Dialog"
import { ColumnWidth, Table } from "../gui/base/Table.js"
import { showPurchaseGiftCardDialog } from "./giftcards/PurchaseGiftCardDialog"
import { GiftCardStatus, loadGiftCards, showGiftCardToShare } from "./giftcards/GiftCardUtils"
import { locator } from "../api/main/CommonLocator"
import { GiftCardMessageEditorField } from "./giftcards/GiftCardMessageEditorField"
import { attachDropdown } from "../gui/base/Dropdown.js"
import { createNotAvailableForFreeClickHandler } from "../misc/SubscriptionDialogs"
import { SettingsExpander } from "../settings/SettingsExpander.js"
import { elementIdPart, GENERATED_MAX_ID, getEtId } from "../api/common/utils/EntityUtils"
import {
	CURRENT_GIFT_CARD_TERMS_VERSION,
	CURRENT_PRIVACY_VERSION,
	CURRENT_TERMS_VERSION,
	renderTermsAndConditionsButton,
	TermsSection,
} from "./TermsAndConditions"
import { DropDownSelector, SelectorItemList } from "../gui/base/DropDownSelector.js"
import { IconButton, IconButtonAttrs } from "../gui/base/IconButton.js"
import { ButtonSize } from "../gui/base/ButtonSize.js"
import { getDisplayNameOfPlanType } from "./FeatureListProvider"
import { EntityUpdateData, isUpdateForTypeRef } from "../api/common/utils/EntityUpdateUtils.js"
import { showProgressDialog } from "../gui/dialogs/ProgressDialog"
import { MobilePaymentsFacade } from "../native/common/generatedipc/MobilePaymentsFacade"
import { MobilePaymentSubscriptionOwnership } from "../native/common/generatedipc/MobilePaymentSubscriptionOwnership"
import { AppStorePaymentPicker } from "../misc/AppStorePaymentPicker.js"
import { MobilePaymentError } from "../api/common/error/MobilePaymentError"
import { showManageThroughAppStoreDialog } from "./PaymentViewer.js"
import type { UpdatableSettingsViewer } from "../settings/Interfaces.js"

assertMainOrNode()
const DAY = 1000 * 60 * 60 * 24

export class SubscriptionViewer implements UpdatableSettingsViewer {
	readonly view: UpdatableSettingsViewer["view"]
	private _subscriptionFieldValue: Stream<string>
	private _orderAgreementFieldValue: Stream<string>
	private _selectedSubscriptionInterval: Stream<PaymentInterval | null>
	private _currentPriceFieldValue: Stream<string>
	private _nextPriceFieldValue: Stream<string>
	private _usersFieldValue: Stream<string>
	private _storageFieldValue: Stream<string>
	private _emailAliasFieldValue: Stream<string>
	private _groupsFieldValue: Stream<string>
	private _whitelabelFieldValue: Stream<string>
	private _sharingFieldValue: Stream<string>
	private _eventInvitesFieldValue: Stream<string>
	private _autoResponderFieldValue: Stream<string>
	private _periodEndDate: Date | null = null
	private _nextPeriodPriceVisible: boolean | null = null
	private _customer: Customer | null = null
	private _customerInfo: CustomerInfo | null = null
	private _accountingInfo: AccountingInfo | null = null
	private _lastBooking: Booking | null = null
	private _orderAgreement: OrderProcessingAgreement | null = null
	private currentPlanType: PlanType
	private _isCancelled: boolean | null = null
	private _giftCards: Map<Id, GiftCard>
	private _giftCardsExpanded: Stream<boolean>

	constructor(
		currentPlanType: PlanType,
		private readonly mobilePaymentsFacade: MobilePaymentsFacade | null,
		private readonly appStorePaymentPicker: AppStorePaymentPicker,
	) {
		this.currentPlanType = currentPlanType
		const isPremiumPredicate = () => locator.logins.getUserController().isPremiumAccount()

		this._giftCards = new Map()
		loadGiftCards(assertNotNull(locator.logins.getUserController().user.customer)).then((giftCards) => {
			for (const giftCard of giftCards) {
				this._giftCards.set(elementIdPart(giftCard._id), giftCard)
			}
		})
		this._giftCardsExpanded = stream<boolean>(false)

		this.view = (): Children => {
			return m("#subscription-settings.fill-absolute.scroll.plr-l", [
				m(".h4.mt-l", lang.get("currentlyBooked_label")),
				m(TextField, {
					label: "subscription_label",
					value: this._subscriptionFieldValue(),
					oninput: this._subscriptionFieldValue,
					isReadOnly: true,
					injectionsRight: () =>
						locator.logins.getUserController().isFreeAccount()
							? m(IconButton, {
									title: "upgrade_action",
									click: () => showProgressDialog("pleaseWait_msg", this.handleUpgradeSubscription()),
									icon: Icons.Edit,
									size: ButtonSize.Compact,
							  })
							: !this._isCancelled
							? m(IconButton, {
									title: "subscription_label",
									click: () => this.onSubscriptionClick(),
									icon: Icons.Edit,
									size: ButtonSize.Compact,
							  })
							: null,
				}),
				this.showOrderAgreement() ? this.renderAgreement() : null,
				this.showPriceData() ? this.renderIntervals() : null,
				this.showPriceData() && this._nextPeriodPriceVisible && this._periodEndDate
					? m(TextField, {
							label: () =>
								lang.get("priceFrom_label", {
									"{date}": formatDate(new Date(neverNull(this._periodEndDate).getTime() + DAY)),
								}),
							helpLabel: () => lang.get("nextSubscriptionPrice_msg"),
							value: this._nextPriceFieldValue(),
							oninput: this._nextPriceFieldValue,
							isReadOnly: true,
					  })
					: null,
				m(".small.mt-s", renderTermsAndConditionsButton(TermsSection.Terms, CURRENT_TERMS_VERSION)),
				m(".small.mt-s", renderTermsAndConditionsButton(TermsSection.Privacy, CURRENT_PRIVACY_VERSION)),
				m(
					SettingsExpander,
					{
						title: "giftCards_label",
						infoMsg: "giftCardSection_label",
						expanded: this._giftCardsExpanded,
					},
					renderGiftCardTable(Array.from(this._giftCards.values()), isPremiumPredicate),
				),
				LegacyPlans.includes(this.currentPlanType)
					? [
							m(".h4.mt-l", lang.get("adminPremiumFeatures_action")),
							m(TextField, {
								label: "storageCapacity_label",
								value: this._storageFieldValue(),
								oninput: this._storageFieldValue,
								isReadOnly: true,
							}),
							m(TextField, {
								label: "mailAddressAliases_label",
								value: this._emailAliasFieldValue(),
								oninput: this._emailAliasFieldValue,
								isReadOnly: true,
							}),
							m(TextField, {
								label: "pricing.comparisonSharingCalendar_msg",
								value: this._sharingFieldValue(),
								oninput: this._sharingFieldValue,
								isReadOnly: true,
							}),
							m(TextField, {
								label: "pricing.comparisonEventInvites_msg",
								value: this._eventInvitesFieldValue(),
								oninput: this._eventInvitesFieldValue,
								isReadOnly: true,
							}),
							m(TextField, {
								label: "pricing.comparisonOutOfOffice_msg",
								value: this._autoResponderFieldValue(),
								oninput: this._autoResponderFieldValue,
								isReadOnly: true,
							}),
							m(TextField, {
								label: "whitelabel.login_title",
								value: this._whitelabelFieldValue(),
								oninput: this._whitelabelFieldValue,
								isReadOnly: true,
							}),
							m(TextField, {
								label: "whitelabel.custom_title",
								value: this._whitelabelFieldValue(),
								oninput: this._whitelabelFieldValue,
								isReadOnly: true,
							}),
					  ]
					: [],
			])
		}

		locator.entityClient
			.load(CustomerTypeRef, neverNull(locator.logins.getUserController().user.customer))
			.then((customer) => {
				this.updateCustomerData(customer)
				return locator.logins.getUserController().loadCustomerInfo()
			})
			.then((customerInfo) => {
				this._customerInfo = customerInfo
				return locator.entityClient.load(AccountingInfoTypeRef, customerInfo.accountingInfo)
			})
			.then((accountingInfo) => {
				this.updateAccountInfoData(accountingInfo)
				this.updatePriceInfo()
			})
		const loadingString = lang.get("loading_msg")
		this._currentPriceFieldValue = stream(loadingString)
		this._subscriptionFieldValue = stream(loadingString)
		this._orderAgreementFieldValue = stream(loadingString)
		this._nextPriceFieldValue = stream(loadingString)
		this._usersFieldValue = stream(loadingString)
		this._storageFieldValue = stream(loadingString)
		this._emailAliasFieldValue = stream(loadingString)
		this._groupsFieldValue = stream(loadingString)
		this._whitelabelFieldValue = stream(loadingString)
		this._sharingFieldValue = stream(loadingString)
		this._eventInvitesFieldValue = stream(loadingString)
		this._autoResponderFieldValue = stream(loadingString)
		this._selectedSubscriptionInterval = stream<PaymentInterval | null>(null)

		this.updateBookings()
	}

	private onSubscriptionClick() {
		const paymentMethod = this._accountingInfo ? getPaymentMethodType(this._accountingInfo) : null

		if (isIOSApp() && (paymentMethod == null || paymentMethod == PaymentMethodType.AppStore)) {
			// case 1: we are in iOS app and we either are not paying or are already on AppStore
			this.handleAppStoreSubscriptionChange()
		} else if (paymentMethod == PaymentMethodType.AppStore && this._accountingInfo?.appStoreSubscription) {
			// case 2: we have a running AppStore subscription but this is not an iOS app

			// If there's a running App Store subscription it must be managed through Apple.
			// This includes the case where renewal is already disabled, but it's not expired yet.
			// Running subscription cannot be changed from other client, but it can still be managed through iOS app or when subscription expires.

			return showManageThroughAppStoreDialog()
		} else {
			// other cases (not iOS app, not app store payment method, no running AppStore subscription, iOS but another payment method)
			if (this._accountingInfo && this._customer && this._customerInfo && this._lastBooking) {
				showSwitchDialog(this._customer, this._customerInfo, this._accountingInfo, this._lastBooking, AvailablePlans, null)
			}
		}
	}

	private async handleUpgradeSubscription() {
		if (isIOSApp()) {
			const currentPaymentType = this._accountingInfo ? getPaymentMethodType(this._accountingInfo) : null
			const shouldEnableiOSPayment = await this.appStorePaymentPicker.shouldEnableAppStorePayment(currentPaymentType)

			if (!shouldEnableiOSPayment) {
				return Dialog.message("notAvailableInApp_msg")
			}

			// We pass `null` because we expect no subscription when upgrading
			const appStoreSubscriptionOwnership = await queryAppStoreSubscriptionOwnership(null)

			if (appStoreSubscriptionOwnership !== MobilePaymentSubscriptionOwnership.NoSubscription) {
				return Dialog.message(() =>
					lang.get("storeMultiSubscriptionError_msg", {
						"{AppStorePayment}": InfoLink.AppStorePayment,
					}),
				)
			}
		}

		return showUpgradeWizard(locator.logins)
	}

	private async handleAppStoreSubscriptionChange() {
		if (!this.mobilePaymentsFacade) {
			throw Error("Not allowed to change AppStore subscription from web client")
		}

		let customer
		let accountingInfo
		if (this._customer && this._accountingInfo) {
			customer = this._customer
			accountingInfo = this._accountingInfo
		} else {
			return
		}
		const appStoreSubscriptionOwnership = await queryAppStoreSubscriptionOwnership(base64ToUint8Array(base64ExtToBase64(customer._id)))
		const isAppStorePayment = getPaymentMethodType(accountingInfo) === PaymentMethodType.AppStore
		const userStatus = customer.approvalStatus
		// Show a dialog only if the user's Apple account's last transaction was with this customer ID
		//
		// This prevents the user from accidentally changing a subscription that they don't own
		if (appStoreSubscriptionOwnership === MobilePaymentSubscriptionOwnership.NotOwner) {
			// There's a subscription with this apple account that doesn't belong to this user
			return Dialog.message(() =>
				lang.get("storeMultiSubscriptionError_msg", {
					"{AppStorePayment}": InfoLink.AppStorePayment,
				}),
			)
		} else if (
			isAppStorePayment &&
			appStoreSubscriptionOwnership === MobilePaymentSubscriptionOwnership.NoSubscription &&
			userStatus === ApprovalStatus.REGISTRATION_APPROVED
		) {
			// User has an ongoing subscriptions but not on the current Apple Account, so we shouldn't allow them to change their plan with this account
			// instead of the account owner of the subscriptions
			return Dialog.message(() => lang.get("storeNoSubscription_msg", { "{AppStorePayment}": InfoLink.AppStorePayment }))
		} else if (appStoreSubscriptionOwnership === MobilePaymentSubscriptionOwnership.NoSubscription) {
			// User has no ongoing subscription and isn't approved. We should allow them to downgrade their accounts or resubscribe and
			// restart an Apple Subscription flow
			const isResubscribe = await Dialog.choice(
				() => lang.get("storeDowngradeOrResubscribe_msg", { "{AppStoreDowngrade}": InfoLink.AppStoreDowngrade }),
				[
					{
						text: "changePlan_action",
						value: false,
					},
					{
						text: "resubscribe_action",
						value: true,
					},
				],
			)

			if (isResubscribe) {
				const planType = await locator.logins.getUserController().getPlanType()
				const customerId = locator.logins.getUserController().user.customer!
				const customerIdBytes = base64ToUint8Array(base64ExtToBase64(customerId))
				try {
					await this.mobilePaymentsFacade.requestSubscriptionToPlan(
						appStorePlanName(planType),
						asPaymentInterval(accountingInfo.paymentInterval),
						customerIdBytes,
					)
				} catch (e) {
					if (e instanceof MobilePaymentError) {
						console.error("AppStore subscription failed", e)
						Dialog.message("appStoreSubscriptionError_msg", e.message)
					} else {
						throw e
					}
				}
			} else {
				if (this._customerInfo && this._lastBooking) {
					return showSwitchDialog(customer, this._customerInfo, accountingInfo, this._lastBooking, AvailablePlans, null)
				}
			}
		} else {
			if (this._customerInfo && this._lastBooking) {
				return showSwitchDialog(customer, this._customerInfo, accountingInfo, this._lastBooking, AvailablePlans, null)
			}
		}
	}

	private showOrderAgreement(): boolean {
		return (
			locator.logins.getUserController().isPremiumAccount() &&
			((this._customer != null && this._customer.businessUse) ||
				(this._customer != null && (this._customer.orderProcessingAgreement != null || this._customer.orderProcessingAgreementNeeded)))
		)
	}

	private async updateCustomerData(customer: Customer): Promise<void> {
		this._customer = customer

		if (customer.orderProcessingAgreement) {
			this._orderAgreement = await locator.entityClient.load(OrderProcessingAgreementTypeRef, customer.orderProcessingAgreement)
		} else {
			this._orderAgreement = null
		}

		if (customer.orderProcessingAgreementNeeded) {
			this._orderAgreementFieldValue(lang.get("signingNeeded_msg"))
		} else if (this._orderAgreement) {
			this._orderAgreementFieldValue(
				lang.get("signedOn_msg", {
					"{date}": formatDate(this._orderAgreement.signatureDate),
				}),
			)
		} else {
			this._orderAgreementFieldValue(lang.get("notSigned_msg"))
		}

		m.redraw()
	}

	private showPriceData(): boolean {
		const isAppStorePayment = this._accountingInfo && getPaymentMethodType(this._accountingInfo) === PaymentMethodType.AppStore
		return locator.logins.getUserController().isPremiumAccount() && !isIOSApp() && !isAppStorePayment
	}

	private async updatePriceInfo(): Promise<void> {
		if (!this.showPriceData()) {
			return
		}

		const priceServiceReturn = await locator.bookingFacade.getCurrentPrice()
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
	}

	private updateAccountInfoData(accountingInfo: AccountingInfo) {
		this._accountingInfo = accountingInfo

		this._selectedSubscriptionInterval(asPaymentInterval(accountingInfo.paymentInterval))

		m.redraw()
	}

	private async updateSubscriptionField() {
		const userController = locator.logins.getUserController()
		const accountType: AccountType = downcast(userController.user.accountType)
		const planType = await userController.getPlanType()

		this._subscriptionFieldValue(_getAccountTypeName(accountType, planType))
	}

	private async updateBookings(): Promise<void> {
		const userController = locator.logins.getUserController()

		const customer = await userController.loadCustomer()
		let customerInfo: CustomerInfo
		try {
			customerInfo = await userController.loadCustomerInfo()
		} catch (e) {
			if (e instanceof NotFoundError) {
				console.log("could not update bookings as customer info does not exist (moved between free/premium lists)")
				return
			} else {
				throw e
			}
		}

		this._customerInfo = customerInfo
		const bookings = await locator.entityClient.loadRange(BookingTypeRef, neverNull(customerInfo.bookings).items, GENERATED_MAX_ID, 1, true)
		this._lastBooking = bookings.length > 0 ? bookings[bookings.length - 1] : null
		this._customer = customer
		this.currentPlanType = await userController.getPlanType()

		const planConfig = await userController.getPlanConfig()
		await this.updateSubscriptionField()

		await Promise.all([
			this.updateUserField(),
			this.updateStorageField(customer, customerInfo),
			this.updateAliasField(),
			this.updateGroupsField(),
			this.updateWhitelabelField(planConfig),
			this.updateSharingField(planConfig),
			this.updateEventInvitesField(planConfig),
			this.updateAutoResponderField(planConfig),
		])
		m.redraw()
	}

	private async updateUserField(): Promise<void> {
		this._usersFieldValue("" + Math.max(1, getCurrentCount(BookingItemFeatureType.LegacyUsers, this._lastBooking)))
	}

	private async updateStorageField(customer: Customer, customerInfo: CustomerInfo): Promise<void> {
		const usedStorage = await locator.customerFacade.readUsedCustomerStorage(getEtId(customer))
		const usedStorageFormatted = formatStorageSize(Number(usedStorage))
		const totalStorageFormatted = formatStorageSize(getTotalStorageCapacityPerCustomer(customer, customerInfo, this._lastBooking) * Const.MEMORY_GB_FACTOR)

		this._storageFieldValue(
			lang.get("amountUsedOf_label", {
				"{amount}": usedStorageFormatted,
				"{totalAmount}": totalStorageFormatted,
			}),
		)
	}

	private async updateAliasField(): Promise<void> {
		// we pass in the user group id here even though for legacy plans the id is ignored
		const counters = await locator.mailAddressFacade.getAliasCounters(locator.logins.getUserController().user.userGroup.group)
		this._emailAliasFieldValue(
			lang.get("amountUsedAndActivatedOf_label", {
				"{used}": counters.usedAliases,
				"{active}": counters.enabledAliases,
				"{totalAmount}": counters.totalAliases,
			}),
		)
	}

	private async updateGroupsField(): Promise<void> {
		let localAdminCount = getCurrentCount(BookingItemFeatureType.LocalAdminGroup, this._lastBooking)
		const localAdminText = localAdminCount + " " + lang.get(localAdminCount === 1 ? "localAdminGroup_label" : "localAdminGroups_label")
		let sharedMailCount = getCurrentCount(BookingItemFeatureType.SharedMailGroup, this._lastBooking)
		const sharedMailText = sharedMailCount + " " + lang.get(sharedMailCount === 1 ? "sharedMailbox_label" : "sharedMailboxes_label")

		if (localAdminCount === 0) {
			// also show the shared mailboxes text if no groups exists at all
			this._groupsFieldValue(sharedMailText)
		} else if (localAdminCount > 0 && sharedMailCount > 0) {
			this._groupsFieldValue(sharedMailText + ", " + localAdminText)
		} else {
			this._groupsFieldValue(localAdminText)
		}
	}

	private async updateWhitelabelField(planConfig: PlanConfiguration): Promise<void> {
		if (isWhitelabelActive(this._lastBooking, planConfig)) {
			this._whitelabelFieldValue(lang.get("active_label"))
		} else {
			this._whitelabelFieldValue(lang.get("deactivated_label"))
		}
	}

	private async updateSharingField(planConfig: PlanConfiguration): Promise<void> {
		if (isSharingActive(this._lastBooking, planConfig)) {
			this._sharingFieldValue(lang.get("active_label"))
		} else {
			this._sharingFieldValue(lang.get("deactivated_label"))
		}
	}

	private async updateEventInvitesField(planConfig: PlanConfiguration): Promise<void> {
		if (!this._customer) {
			this._eventInvitesFieldValue("")
		} else if (isEventInvitesActive(this._lastBooking, planConfig)) {
			this._eventInvitesFieldValue(lang.get("active_label"))
		} else {
			this._eventInvitesFieldValue(lang.get("deactivated_label"))
		}
	}

	private async updateAutoResponderField(planConfig: PlanConfiguration): Promise<void> {
		if (!this._customer) {
			this._autoResponderFieldValue("")
		} else if (isAutoResponderActive(this._lastBooking, planConfig)) {
			this._autoResponderFieldValue(lang.get("active_label"))
		} else {
			this._autoResponderFieldValue(lang.get("deactivated_label"))
		}
	}

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		await promiseMap(updates, (update) => this.processUpdate(update))
	}

	async processUpdate(update: EntityUpdateData): Promise<void> {
		const { instanceListId, instanceId } = update

		if (isUpdateForTypeRef(AccountingInfoTypeRef, update)) {
			const accountingInfo = await locator.entityClient.load(AccountingInfoTypeRef, instanceId)
			this.updateAccountInfoData(accountingInfo)
			return await this.updatePriceInfo()
		} else if (isUpdateForTypeRef(UserTypeRef, update)) {
			await this.updateBookings()
			return await this.updatePriceInfo()
		} else if (isUpdateForTypeRef(BookingTypeRef, update)) {
			await this.updateBookings()
			return await this.updatePriceInfo()
		} else if (isUpdateForTypeRef(CustomerTypeRef, update)) {
			const customer = await locator.entityClient.load(CustomerTypeRef, instanceId)
			return await this.updateCustomerData(customer)
		} else if (isUpdateForTypeRef(CustomerInfoTypeRef, update)) {
			// needed to update the displayed plan
			await this.updateBookings()
			return await this.updatePriceInfo()
		} else if (isUpdateForTypeRef(GiftCardTypeRef, update)) {
			const giftCard = await locator.entityClient.load(GiftCardTypeRef, [instanceListId, instanceId])
			this._giftCards.set(elementIdPart(giftCard._id), giftCard)
			if (update.operation === OperationType.CREATE) this._giftCardsExpanded(true)
		}
	}

	private renderIntervals() {
		const isAppStorePayment = this._accountingInfo && getPaymentMethodType(this._accountingInfo) === PaymentMethodType.AppStore
		if (isIOSApp() || isAppStorePayment) {
			return
		}

		const subscriptionPeriods: SelectorItemList<PaymentInterval | null> = [
			{
				name: lang.get("pricing.yearly_label"),
				value: PaymentInterval.Yearly,
			},
			{
				name: lang.get("pricing.monthly_label"),
				value: PaymentInterval.Monthly,
			},
			{
				name: lang.get("loading_msg"),
				value: null,
				selectable: false,
			},
		]

		const bonusMonths = this._lastBooking ? Number(this._lastBooking.bonusMonth) : 0
		return [
			m(DropDownSelector, {
				label: "paymentInterval_label",
				helpLabel: () => this.getChargeDateText(),
				items: subscriptionPeriods,
				selectedValue: this._selectedSubscriptionInterval(),
				dropdownWidth: 300,
				selectionChangedHandler: (value: number) => {
					if (this._accountingInfo) {
						showChangeSubscriptionIntervalDialog(this._accountingInfo, value, this._periodEndDate)
					}
				},
			}),
			bonusMonths === 0
				? null
				: m(TextField, {
						label: "bonus_label",
						value: lang.get("bonusMonth_msg", { "{months}": bonusMonths }),
						isReadOnly: true,
				  }),
			m(TextField, {
				label: () =>
					this._nextPeriodPriceVisible && this._periodEndDate
						? lang.get("priceTill_label", {
								"{date}": formatDate(this._periodEndDate),
						  })
						: lang.get("price_label"),
				value: this._currentPriceFieldValue(),
				oninput: this._currentPriceFieldValue,
				isReadOnly: true,
				helpLabel: () => (this._customer && this._customer.businessUse === true ? lang.get("pricing.subscriptionPeriodInfoBusiness_msg") : null),
			}),
		]
	}

	private renderAgreement() {
		return m(TextField, {
			label: "orderProcessingAgreement_label",
			helpLabel: () => lang.get("orderProcessingAgreementInfo_msg"),
			value: this._orderAgreementFieldValue(),
			oninput: this._orderAgreementFieldValue,
			isReadOnly: true,
			injectionsRight: () => {
				if (this._orderAgreement && this._customer && this._customer.orderProcessingAgreementNeeded) {
					return [this.renderSignProcessingAgreementAction(), this.renderShowProcessingAgreementAction()]
				} else if (this._orderAgreement) {
					return [this.renderShowProcessingAgreementAction()]
				} else if (this._customer && this._customer.orderProcessingAgreementNeeded) {
					return [this.renderSignProcessingAgreementAction()]
				} else {
					return []
				}
			},
		})
	}

	private renderShowProcessingAgreementAction() {
		return m(IconButton, {
			title: "show_action",
			click: () =>
				locator.entityClient
					.load(GroupInfoTypeRef, neverNull(this._orderAgreement).signerUserGroupInfo)
					.then((signerUserGroupInfo) => SignOrderAgreementDialog.showForViewing(neverNull(this._orderAgreement), signerUserGroupInfo)),
			icon: Icons.Download,
			size: ButtonSize.Compact,
		})
	}

	private renderSignProcessingAgreementAction() {
		return m(IconButton, {
			title: "sign_action",
			click: () => SignOrderAgreementDialog.showForSigning(neverNull(this._customer), neverNull(this._accountingInfo)),
			icon: Icons.Edit,
			size: ButtonSize.Compact,
		})
	}

	private getChargeDateText(): string {
		if (this._periodEndDate) {
			const chargeDate = formatDate(incrementDate(new Date(this._periodEndDate), 1))
			return lang.get("nextChargeOn_label", { "{chargeDate}": chargeDate })
		} else {
			return ""
		}
	}
}

function _getAccountTypeName(type: AccountType, subscription: PlanType): string {
	if (type === AccountType.PAID) {
		return getDisplayNameOfPlanType(subscription)
	} else {
		return AccountTypeNames[type]
	}
}

function showChangeSubscriptionIntervalDialog(accountingInfo: AccountingInfo, paymentInterval: PaymentInterval, periodEndDate: Date | null): void {
	if (accountingInfo && accountingInfo.invoiceCountry && asPaymentInterval(accountingInfo.paymentInterval) !== paymentInterval) {
		const confirmationMessage = () => {
			return periodEndDate
				? lang.get("subscriptionChangePeriod_msg", {
						"{1}": formatDate(periodEndDate),
				  })
				: lang.get("subscriptionChange_msg")
		}

		Dialog.confirm(confirmationMessage).then(async (confirmed) => {
			if (confirmed) {
				await locator.customerFacade.changePaymentInterval(accountingInfo, paymentInterval)
			}
		})
	}
}

function renderGiftCardTable(giftCards: GiftCard[], isPremiumPredicate: () => boolean): Children {
	const addButtonAttrs: IconButtonAttrs = {
		title: "buyGiftCard_label",
		click: createNotAvailableForFreeClickHandler(NewPaidPlans, () => showPurchaseGiftCardDialog(), isPremiumPredicate),
		icon: Icons.Add,
		size: ButtonSize.Compact,
	}
	const columnHeading: [TranslationKey, TranslationKey] = ["purchaseDate_label", "value_label"]
	const columnWidths = [ColumnWidth.Largest, ColumnWidth.Small, ColumnWidth.Small]
	const lines = giftCards
		.filter((giftCard) => giftCard.status === GiftCardStatus.Usable)
		.map((giftCard) => {
			return {
				cells: [formatDate(giftCard.orderDate), formatPrice(parseFloat(giftCard.value), true)],
				actionButtonAttrs: attachDropdown({
					mainButtonAttrs: {
						title: "options_action",
						icon: Icons.More,
						size: ButtonSize.Compact,
					},
					childAttrs: () => [
						{
							label: "view_label",
							click: () => showGiftCardToShare(giftCard),
						},
						{
							label: "edit_action",
							click: () => {
								let message = stream(giftCard.message)
								Dialog.showActionDialog({
									title: lang.get("editMessage_label"),
									child: () =>
										m(
											".flex-center",
											m(GiftCardMessageEditorField, {
												message: message(),
												onMessageChanged: message,
											}),
										),
									okAction: (dialog: Dialog) => {
										giftCard.message = message()
										locator.entityClient
											.update(giftCard)
											.then(() => dialog.close())
											.catch(() => Dialog.message("giftCardUpdateError_msg"))
										showGiftCardToShare(giftCard)
									},
									okActionTextId: "save_action",
									type: DialogType.EditSmall,
								})
							},
						},
					],
				}),
			}
		})
	return [
		m(Table, {
			addButtonAttrs,
			columnHeading,
			columnWidths,
			lines,
			showActionButtonColumn: true,
		}),
		m(".small", renderTermsAndConditionsButton(TermsSection.GiftCards, CURRENT_GIFT_CARD_TERMS_VERSION)),
	]
}

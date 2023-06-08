import m, { Children } from "mithril"
import { assertMainOrNode } from "../api/common/Env"
import {
	AccountType,
	AccountTypeNames,
	AvailablePlans,
	BookingItemFeatureType,
	Const,
	LegacyPlans,
	NewPaidPlans,
	OperationType,
	PlanType,
} from "../api/common/TutanotaConstants"
import type { AccountingInfo, Booking, Customer, CustomerInfo, GiftCard, OrderProcessingAgreement, PlanConfiguration } from "../api/entities/sys/TypeRefs.js"
import {
	AccountingInfoTypeRef,
	BookingTypeRef,
	createMailAddressAliasGetIn,
	CustomerTypeRef,
	GiftCardTypeRef,
	GroupInfoTypeRef,
	OrderProcessingAgreementTypeRef,
	UserTypeRef,
} from "../api/entities/sys/TypeRefs.js"
import { assertNotNull, downcast, incrementDate, neverNull, noOp, ofClass, promiseMap } from "@tutao/tutanota-utils"
import { lang, TranslationKey } from "../misc/LanguageViewModel"
import { Icons } from "../gui/base/icons/Icons"
import { asPaymentInterval, formatPrice, formatPriceDataWithInfo, PaymentInterval } from "./PriceUtils"
import { formatDate, formatStorageSize } from "../misc/Formatter"
import { showUpgradeWizard } from "./UpgradeSubscriptionWizard"
import { showSwitchDialog } from "./SwitchSubscriptionDialog"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import * as SignOrderAgreementDialog from "./SignOrderProcessingAgreementDialog"
import { NotFoundError } from "../api/common/error/RestError"
import type { EntityUpdateData } from "../api/main/EventController"
import { isUpdateForTypeRef } from "../api/main/EventController"
import { getCurrentCount, getTotalStorageCapacityPerCustomer, isBusinessFeatureActive, isSharingActive, isWhitelabelActive } from "./SubscriptionUtils"
import { TextField } from "../gui/base/TextField.js"
import { Dialog, DialogType } from "../gui/base/Dialog"
import { ColumnWidth, Table } from "../gui/base/Table.js"
import { showPurchaseGiftCardDialog } from "./giftcards/PurchaseGiftCardDialog"
import { GiftCardStatus, loadGiftCards, showGiftCardToShare } from "./giftcards/GiftCardUtils"
import { locator } from "../api/main/MainLocator"
import { GiftCardMessageEditorField } from "./giftcards/GiftCardMessageEditorField"
import { attachDropdown } from "../gui/base/Dropdown.js"
import { createNotAvailableForFreeClickHandler } from "../misc/SubscriptionDialogs"
import { SettingsExpander } from "../settings/SettingsExpander"
import { elementIdPart, GENERATED_MAX_ID, getEtId } from "../api/common/utils/EntityUtils"
import type { UpdatableSettingsViewer } from "../settings/SettingsView"
import {
	CURRENT_GIFT_CARD_TERMS_VERSION,
	CURRENT_PRIVACY_VERSION,
	CURRENT_TERMS_VERSION,
	renderTermsAndConditionsButton,
	TermsSection,
} from "./TermsAndConditions"
import { MailAddressAliasService } from "../api/entities/sys/Services"
import { DropDownSelector, SelectorItemList } from "../gui/base/DropDownSelector.js"
import { IconButton, IconButtonAttrs } from "../gui/base/IconButton.js"
import { ButtonSize } from "../gui/base/ButtonSize.js"
import { getDisplayNameOfPlanType } from "./FeatureListProvider"

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
	private _contactFormsFieldValue: Stream<string>
	private _whitelabelFieldValue: Stream<string>
	private _sharingFieldValue: Stream<string>
	private _businessFeatureFieldValue: Stream<string>
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

	constructor(currentPlanType: PlanType) {
		this.currentPlanType = currentPlanType
		const isPremiumPredicate = () => locator.logins.getUserController().isPremiumAccount()

		const deleteAccountExpanded = stream(false)
		this._giftCards = new Map()
		loadGiftCards(assertNotNull(locator.logins.getUserController().user.customer)).then((giftCards) => {
			giftCards.forEach((giftCard) => this._giftCards.set(elementIdPart(giftCard._id), giftCard))
		})
		this._giftCardsExpanded = stream<boolean>(false)

		this.view = (): Children => {
			return m("#subscription-settings.fill-absolute.scroll.plr-l", [
				m(".h4.mt-l", lang.get("currentlyBooked_label")),
				m(TextField, {
					label: "subscription_label",
					value: this._subscriptionFieldValue(),
					oninput: this._subscriptionFieldValue,
					disabled: true,
					injectionsRight: () =>
						locator.logins.getUserController().isFreeAccount()
							? m(IconButton, {
									title: "upgrade_action",
									click: () => showUpgradeWizard(locator.logins),
									icon: Icons.Edit,
									size: ButtonSize.Compact,
							  })
							: !this._isCancelled
							? m(IconButton, {
									title: "subscription_label",
									click: () => {
										if (this._accountingInfo && this._customer && this._customerInfo && this._lastBooking) {
											showSwitchDialog(this._customer, this._customerInfo, this._accountingInfo, this._lastBooking, AvailablePlans, null)
										}
									},
									icon: Icons.Edit,
									size: ButtonSize.Compact,
							  })
							: null,
				}),
				this._showOrderAgreement() ? this.renderAgreement() : null,
				this._showPriceData() ? this.renderIntervals() : null,
				this._showPriceData() && this._nextPeriodPriceVisible && this._periodEndDate
					? m(TextField, {
							label: () =>
								lang.get("priceFrom_label", {
									"{date}": formatDate(new Date(neverNull(this._periodEndDate).getTime() + DAY)),
								}),
							helpLabel: () => lang.get("nextSubscriptionPrice_msg"),
							value: this._nextPriceFieldValue(),
							oninput: this._nextPriceFieldValue,
							disabled: true,
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
								disabled: true,
							}),
							m(TextField, {
								label: "mailAddressAliases_label",
								value: this._emailAliasFieldValue(),
								oninput: this._emailAliasFieldValue,
								disabled: true,
							}),
							m(TextField, {
								label: "pricing.comparisonSharingCalendar_msg",
								value: this._sharingFieldValue(),
								oninput: this._sharingFieldValue,
								disabled: true,
							}),
							m(TextField, {
								label: "pricing.comparisonEventInvites_msg",
								value: this._businessFeatureFieldValue(),
								oninput: this._businessFeatureFieldValue,
								disabled: true,
							}),
							m(TextField, {
								label: "pricing.comparisonOutOfOffice_msg",
								value: this._businessFeatureFieldValue(),
								oninput: this._businessFeatureFieldValue,
								disabled: true,
							}),
							m(TextField, {
								label: "whitelabel.login_title",
								value: this._whitelabelFieldValue(),
								oninput: this._whitelabelFieldValue,
								disabled: true,
							}),
							m(TextField, {
								label: "whitelabel.custom_title",
								value: this._whitelabelFieldValue(),
								oninput: this._whitelabelFieldValue,
								disabled: true,
							}),
					  ]
					: [],
			])
		}

		locator.entityClient
			.load(CustomerTypeRef, neverNull(locator.logins.getUserController().user.customer))
			.then((customer) => {
				this._updateCustomerData(customer)
				return locator.logins.getUserController().loadCustomerInfo()
			})
			.then((customerInfo) => {
				this._customerInfo = customerInfo
				return locator.entityClient.load(AccountingInfoTypeRef, customerInfo.accountingInfo)
			})
			.then((accountingInfo) => {
				this._updateAccountInfoData(accountingInfo)
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
		this._businessFeatureFieldValue = stream(loadingString)
		this._contactFormsFieldValue = stream(loadingString)
		this._selectedSubscriptionInterval = stream<PaymentInterval | null>(null)

		this._updatePriceInfo()

		this._updateBookings()
	}

	_showOrderAgreement(): boolean {
		return (
			locator.logins.getUserController().isPremiumAccount() &&
			((this._customer != null && this._customer.businessUse) ||
				(this._customer != null && (this._customer.orderProcessingAgreement != null || this._customer.orderProcessingAgreementNeeded)))
		)
	}

	_updateCustomerData(customer: Customer): Promise<any> {
		let p = Promise.resolve()
		this._customer = customer

		if (customer.orderProcessingAgreement) {
			p = locator.entityClient.load(OrderProcessingAgreementTypeRef, customer.orderProcessingAgreement).then((a) => {
				this._orderAgreement = a
			})
		} else {
			this._orderAgreement = null
		}

		return p.then(() => {
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
		})
	}

	_showPriceData(): boolean {
		return locator.logins.getUserController().isPremiumAccount()
	}

	_updatePriceInfo(): Promise<void> {
		if (!this._showPriceData()) {
			return Promise.resolve()
		} else {
			return locator.bookingFacade.getCurrentPrice().then((priceServiceReturn) => {
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

		this._selectedSubscriptionInterval(asPaymentInterval(accountingInfo.paymentInterval))

		m.redraw()
	}

	async _updateSubscriptionField(cancelled: boolean) {
		const cancelledText =
			cancelled && this._periodEndDate
				? " " +
				  lang.get("cancelledBy_label", {
						"{endOfSubscriptionPeriod}": formatDate(this._periodEndDate),
				  })
				: ""
		const userController = locator.logins.getUserController()
		const accountType: AccountType = downcast(userController.user.accountType)
		const planType = await userController.getPlanType()

		this._subscriptionFieldValue(_getAccountTypeName(accountType, planType) + cancelledText)
	}

	_updateBookings(): Promise<void> {
		const userController = locator.logins.getUserController()

		return userController.loadCustomer().then((customer) => {
			return userController
				.loadCustomerInfo()
				.catch(
					ofClass(NotFoundError, (e) => {
						console.log("could not update bookings as customer info does not exist (moved between free/premium lists)")
					}),
				)
				.then((customerInfo) => {
					if (!customerInfo) {
						return
					}

					this._customerInfo = customerInfo
					return locator.entityClient
						.loadRange(BookingTypeRef, neverNull(customerInfo.bookings).items, GENERATED_MAX_ID, 1, true)
						.then(async (bookings) => {
							this._lastBooking = bookings.length > 0 ? bookings[bookings.length - 1] : null
							this._customer = customer
							this._isCancelled = customer.canceledPremiumAccount
							this.currentPlanType = await userController.getPlanType()

							const planConfig = await userController.getPlanConfig()
							await this._updateSubscriptionField(this._isCancelled)

							return Promise.all([
								this._updateUserField(),
								this._updateStorageField(customer, customerInfo),
								this._updateAliasField(customer, customerInfo, userController.user.userGroup.group),
								this._updateGroupsField(),
								this._updateWhitelabelField(planConfig),
								this._updateSharingField(planConfig),
								this._updateBusinessFeatureField(planConfig),
								this._updateContactFormsField(),
							]).then(() => m.redraw())
						})
				})
		})
	}

	_updateUserField(): Promise<void> {
		this._usersFieldValue("" + Math.max(1, getCurrentCount(BookingItemFeatureType.LegacyUsers, this._lastBooking)))

		return Promise.resolve()
	}

	_updateStorageField(customer: Customer, customerInfo: CustomerInfo): Promise<void> {
		return locator.customerFacade.readUsedCustomerStorage(getEtId(customer)).then((usedStorage) => {
			const usedStorageFormatted = formatStorageSize(Number(usedStorage))
			const totalStorageFormatted = formatStorageSize(
				getTotalStorageCapacityPerCustomer(customer, customerInfo, this._lastBooking) * Const.MEMORY_GB_FACTOR,
			)

			this._storageFieldValue(
				lang.get("amountUsedOf_label", {
					"{amount}": usedStorageFormatted,
					"{totalAmount}": totalStorageFormatted,
				}),
			)
		})
	}

	_updateAliasField(customer: Customer, customerInfo: CustomerInfo, userGroupId: Id): Promise<void> {
		const data = createMailAddressAliasGetIn({ targetGroup: userGroupId })
		return locator.serviceExecutor
			.get(MailAddressAliasService, data)
			.then((aliasServiceReturn) => {
				this._emailAliasFieldValue(
					lang.get("amountUsedAndActivatedOf_label", {
						"{used}": aliasServiceReturn.usedAliases,
						"{active}": aliasServiceReturn.enabledAliases,
						"{totalAmount}": aliasServiceReturn.totalAliases,
					}),
				)
			})
			.then(noOp)
	}

	_updateGroupsField(): Promise<void> {
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

		return Promise.resolve()
	}

	_updateContactFormsField(): Promise<void> {
		const totalAmount = getCurrentCount(BookingItemFeatureType.ContactForm, this._lastBooking)

		this._contactFormsFieldValue(totalAmount.toString())

		return Promise.resolve()
	}

	_updateWhitelabelField(planConfig: PlanConfiguration): Promise<void> {
		if (isWhitelabelActive(this._lastBooking, planConfig)) {
			this._whitelabelFieldValue(lang.get("active_label"))
		} else {
			this._whitelabelFieldValue(lang.get("deactivated_label"))
		}

		return Promise.resolve()
	}

	_updateSharingField(planConfig: PlanConfiguration): Promise<void> {
		if (isSharingActive(this._lastBooking, planConfig)) {
			this._sharingFieldValue(lang.get("active_label"))
		} else {
			this._sharingFieldValue(lang.get("deactivated_label"))
		}

		return Promise.resolve()
	}

	_updateBusinessFeatureField(planConfig: PlanConfiguration): Promise<void> {
		if (!this._customer) {
			this._businessFeatureFieldValue("")
		} else if (isBusinessFeatureActive(this._lastBooking, planConfig)) {
			this._businessFeatureFieldValue(lang.get("active_label"))
		} else {
			this._businessFeatureFieldValue(lang.get("deactivated_label"))
		}

		return Promise.resolve()
	}

	entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		return promiseMap(updates, (update) => {
			return this.processUpdate(update)
		}).then(noOp)
	}

	processUpdate(update: EntityUpdateData): Promise<void> {
		const { instanceListId, instanceId } = update

		if (isUpdateForTypeRef(AccountingInfoTypeRef, update)) {
			return locator.entityClient
				.load(AccountingInfoTypeRef, instanceId)
				.then((accountingInfo) => this._updateAccountInfoData(accountingInfo))
				.then(() => {
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
			return locator.entityClient.load(CustomerTypeRef, instanceId).then((customer) => {
				this._updateCustomerData(customer)
			})
		} else if (isUpdateForTypeRef(GiftCardTypeRef, update)) {
			return locator.entityClient.load(GiftCardTypeRef, [instanceListId, instanceId]).then((giftCard) => {
				this._giftCards.set(elementIdPart(giftCard._id), giftCard)

				if (update.operation === OperationType.CREATE) this._giftCardsExpanded(true)
			})
		} else {
			return Promise.resolve()
		}
	}

	private renderIntervals() {
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
						disabled: true,
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
				disabled: true,
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
			disabled: true,
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
	if (type === AccountType.PREMIUM) {
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

// @flow
import m from "mithril"
import {assertMainOrNode} from "../api/Env"
import type {OperationTypeEnum, AccountTypeEnum} from "../api/common/TutanotaConstants"
import {AccountType, AccountTypeNames} from "../api/common/TutanotaConstants"
import {CustomerTypeRef} from "../api/entities/sys/Customer"
import {neverNull} from "../api/common/utils/Utils"
import {CustomerInfoTypeRef} from "../api/entities/sys/CustomerInfo"
import {load} from "../api/main/Entity"
import {logins} from "../api/main/LoginController"
import {lang} from "../misc/LanguageViewModel.js"
import {Button, createDropDownButton, ButtonType} from "../gui/base/Button"
import {TextField, Type} from "../gui/base/TextField"
import {Icons} from "../gui/base/icons/Icons"
import {AccountingInfoTypeRef} from "../api/entities/sys/AccountingInfo"
import {formatPrice} from "../misc/Formatter"
import {worker} from "../api/main/WorkerClient"
import {isSameTypeRef} from "../api/common/EntityFunctions"
import {UpgradeAccountTypeDialog} from "./UpgradeAccountTypeDialog"

assertMainOrNode()

export class SubscriptionViewer {

	view: Function;
	_accountTypeField: TextField;
	_usageTypeField: TextField;
	_subscriptionIntervalField: TextField;
	_currentPriceField: TextField;
	_invoiceRecipientField: TextField;
	_invoiceAddressField: TextField;
	_invoiceCountryField: TextField;
	_paymentMehthodField: TextField;

	_usersField: TextField;
	_storageField: TextField;
	_emailAliasField: TextField;
	_contactFormsField: TextField;
	_whitelabelField: TextField;

	constructor() {
		this._accountTypeField = new TextField("accountType_label").setValue(_getAccountTypeName(logins.getUserController().user.accountType)).setDisabled()
		let accountTypeAction = createDropDownButton("accountType_label", () => Icons.Edit, () => {
			if (logins.getUserController().user.accountType == AccountType.PREMIUM) {
				return [new Button("unsubscribePremium_label", () => console.log("unsubscribe from premium")).setType(ButtonType.Dropdown)]
			} else if (logins.getUserController().user.accountType == AccountType.FREE) {
				return [new Button("upgradeToPremium_action", () => this._showUpgradeDialog()).setType(ButtonType.Dropdown)]
			} else {
				return []
			}
		}, 250)
		this._accountTypeField._injectionsRight = () => logins.getUserController().isFreeAccount() || logins.getUserController().isPremiumAccount() ? [m(accountTypeAction)] : []
		this._usageTypeField = new TextField("businessOrPrivateUsage_label").setValue(lang.get("loading_msg")).setDisabled()
		this._subscriptionIntervalField = new TextField("subscription_label").setValue(lang.get("loading_msg")).setDisabled()
		this._currentPriceField = new TextField("price_label").setValue(lang.get("loading_msg")).setDisabled()

		this._invoiceRecipientField = new TextField("invoiceRecipient_label").setValue(lang.get("loading_msg")).setDisabled()
		this._invoiceAddressField = new TextField("address_label").setValue(lang.get("loading_msg")).setDisabled().setType(Type.Area)
		this._invoiceCountryField = new TextField("invoiceCountry_label").setValue(lang.get("loading_msg")).setDisabled()
		this._paymentMehthodField = new TextField("paymentMethod_label").setValue(lang.get("loading_msg")).setDisabled()

		this._usersField = new TextField("bookingItemUsers_label").setValue(lang.get("loading_msg")).setDisabled()
		this._storageField = new TextField("storageCapacity_label").setValue(lang.get("loading_msg")).setDisabled()
		this._emailAliasField = new TextField("emailAlias_label").setValue(lang.get("loading_msg")).setDisabled()
		this._contactFormsField = new TextField("contactForms_label").setValue(lang.get("loading_msg")).setDisabled()
		this._whitelabelField = new TextField("whitelabel_label").setValue(lang.get("loading_msg")).setDisabled()

		this.view = (): VirtualElement => {
			return m("#subscription-settings.fill-absolute.scroll.plr-l", [
				m(".h4.mt-l", lang.get('currentlyBooked_label')),
				m(this._accountTypeField),
				this._showPriceData() ? m(this._usageTypeField) : null,
				this._showPriceData() ? m(this._subscriptionIntervalField) : null,
				this._showPriceData() ? m(this._currentPriceField) : null,
				m(".h4.mt-l", lang.get('adminPayment_action')),
				m(this._invoiceRecipientField),
				m(this._invoiceAddressField),
				m(this._invoiceCountryField),
				m(this._paymentMehthodField),
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
				this._updateAccountTypeData(accountingInfo)
			})
		this._updatePriceInfo()
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
					this._currentPriceField.setValue(formatPrice(Number(priceServiceReturn.currentPriceThisPeriod.price), true) + " (" + formatPrice(Number(neverNull(priceServiceReturn.currentPriceNextPeriod).price), true) + ")*")
				} else {
					this._currentPriceField.setValue(formatPrice(Number(priceServiceReturn.currentPriceThisPeriod.price), true))
				}

				m.redraw()
			}
		})
	}

	_updateAccountTypeData(accountingInfo: AccountingInfo) {
		this._usageTypeField.setValue(accountingInfo.business ? lang.get("businessUse_label") : lang.get("privateUse_label"))
		this._subscriptionIntervalField.setValue(accountingInfo.paymentInterval)
		this._invoiceRecipientField.setValue(accountingInfo.invoiceName)
		this._invoiceAddressField.setValue(accountingInfo.invoiceAddress)
		this._invoiceCountryField.setValue(accountingInfo.invoiceCountry)
		m.redraw()
	}

	entityEventReceived<T>(typeRef: TypeRef<any>, listId: ?string, elementId: string, operation: OperationTypeEnum): void {
		if (isSameTypeRef(typeRef, AccountingInfoTypeRef)) {
			load(AccountingInfoTypeRef, elementId).then(accountingInfo => this._updateAccountTypeData(accountingInfo))
		}
	}


	_showUpgradeDialog() {
		load(CustomerTypeRef, neverNull(logins.getUserController().user.customer))
			.then(customer => load(CustomerInfoTypeRef, customer.customerInfo))
			.then(customerInfo => load(AccountingInfoTypeRef, customerInfo.accountingInfo))
			.then(accountingInfo => {
				new UpgradeAccountTypeDialog(accountingInfo).show()
			})
	}
}


function _getAccountTypeName(type: AccountTypeEnum): string {
	return "Tutanota " + AccountTypeNames[Number(type)];
}
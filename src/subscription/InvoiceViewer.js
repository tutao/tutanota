// @flow
import m from "mithril"
import {assertMainOrNode} from "../api/Env"
import {CustomerTypeRef} from "../api/entities/sys/Customer"
import {neverNull} from "../api/common/utils/Utils"
import {CustomerInfoTypeRef} from "../api/entities/sys/CustomerInfo"
import {load, loadAll, serviceRequestVoid} from "../api/main/Entity"
import {logins} from "../api/main/LoginController"
import {lang} from "../misc/LanguageViewModel.js"
import {TextField} from "../gui/base/TextField"
import {AccountingInfoTypeRef} from "../api/entities/sys/AccountingInfo"
import {InvoiceInfoTypeRef} from "../api/entities/sys/InvoiceInfo"
import {InvoiceTypeRef} from "../api/entities/sys/Invoice"
import {HtmlEditor, Mode} from "../gui/base/HtmlEditor"
import {
	getPaymentMethodInfoText,
	getPaymentMethodName,
	createNotAvailableForFreeButton,
	getInvoiceStatusText
} from "./PriceUtils"
import * as InvoiceDataDialog from "./InvoiceDataDialog"
import {Icons} from "../gui/base/icons/Icons"
import {isSameTypeRef, isSameId, sortCompareByReverseId, HttpMethod} from "../api/common/EntityFunctions"
import {ColumnWidth, Table} from "../gui/base/Table"
import {ExpanderButton, ExpanderPanel} from "../gui/base/Expander"
import {Button, ButtonType, createDropDownButton} from "../gui/base/Button"
import {formatDate, formatPrice} from "../misc/Formatter"
import {OperationType, InvoiceStatus, PaymentMethodType} from "../api/common/TutanotaConstants"
import {worker} from "../api/main/WorkerClient"
import {fileController} from "../file/FileController"
import TableLine from "../gui/base/TableLine"
import {findAndRemove} from "../api/common/utils/ArrayUtils"
import {BadGatewayError, TooManyRequestsError, PreconditionFailedError} from "../api/common/error/RestError"
import {Dialog} from "../gui/base/Dialog"
import {createDebitServicePutData} from "../api/entities/sys/DebitServicePutData"
import {SysService} from "../api/entities/sys/Services"
import {getByAbbreviation} from "../api/common/CountryList"
import * as PaymentDataDialog from "./PaymentDataDialog"

assertMainOrNode()

export class InvoiceViewer {
	_invoiceAddressField: HtmlEditor;
	_invoiceCountryField: TextField;
	_paymentMehthodField: TextField;
	_invoiceTable: Table;
	_accountingInfo: ?AccountingInfo;
	_invoices: Array<Invoice>;
	_paymentBusy: boolean;
	_invoiceVatNumber: TextField;

	view: Function;

	constructor() {
		this._invoiceAddressField = new HtmlEditor()
			.setMinHeight(120)
			.showBorders()
			.setMode(Mode.HTML)
			.setHtmlMonospace(false)
			.setEnabled(false)
			.setPlaceholderId("invoiceAddress_label")

		this._invoiceCountryField = new TextField("invoiceCountry_label").setValue(lang.get("loading_msg")).setDisabled()
		this._invoiceVatNumber = new TextField("invoiceVatIdNo_label").setValue(lang.get("loading_msg")).setDisabled()
		this._paymentMehthodField = new TextField("paymentMethod_label").setValue(lang.get("loading_msg")).setDisabled()
		this._invoices = []
		this._paymentBusy = false

		const changeInvoiceDataButton = createNotAvailableForFreeButton("edit_action", () => {
			if (this._accountingInfo) {
				const accountingInfo = neverNull(this._accountingInfo)
				const invoiceCountry = accountingInfo.invoiceCountry ? getByAbbreviation(accountingInfo.invoiceCountry) : null
				InvoiceDataDialog.show({
						businessUse: accountingInfo.business,
						paymentInterval: Number(accountingInfo.paymentInterval)
					}, {
						invoiceAddress: accountingInfo.invoiceName != "" ? (accountingInfo.invoiceName + "\n" + accountingInfo.invoiceAddress) : accountingInfo.invoiceAddress,
						country: invoiceCountry,
						vatNumber: accountingInfo.invoiceVatIdNo,
						paymentMethod: null,
						paymentMethodInfo: "",
						creditCardData: null,
						payPalData: null
					}
				)
			}
		}, () => Icons.Edit)

		const changePaymentDataButton = createNotAvailableForFreeButton("edit_action", () => {
			if (this._accountingInfo) {
				PaymentDataDialog.show(this._accountingInfo)
			}
		}, () => Icons.Edit)


		//this._invoiceCountryField._injectionsRight = () => m(changeInvoiceDataButton)
		//this._invoiceVatNumber._injectionsRight = () => m(changeInvoiceDataButton)
		//this._paymentMehthodField._injectionsRight = () => m(changePaymentDataButton)

		this._invoiceTable = new Table(["date_label", "invoiceState_label", "invoiceTotal_label"], [ColumnWidth.Small, ColumnWidth.Largest, ColumnWidth.Small], true)
		let invoiceExpander = new ExpanderButton("show_action", new ExpanderPanel(this._invoiceTable), false)


		this.view = (): VirtualElement => {
			return m("#invoicing-settings.fill-absolute.scroll.plr-l", [
				m(".flex-space-between.items-center.mt-l.mb-s", [
					m(".h4", lang.get('invoiceData_msg')),
					m(".mr-negative-s", m(changeInvoiceDataButton))
				]),
				//m(".small", lang.get("invoiceAddress_label")),
				m(this._invoiceAddressField),
				m(this._invoiceCountryField),
				(this._accountingInfo && this._accountingInfo.invoiceVatIdNo.trim().length > 0) ? m(this._invoiceVatNumber) : null,
				m(".flex-space-between.items-center.mt-l", [
					m(".h4", lang.get('adminPayment_action')),
					m(".mr-negative-s", m(changePaymentDataButton))
				]),
				m(this._paymentMehthodField),
				m(".flex-space-between.items-center.mt-l.mb-s", [
					m(".h4", lang.get('invoices_label')),
					m(invoiceExpander)
				]),
				m(invoiceExpander.panel),
				m(".small", lang.get("invoiceSettingDescription_msg"))
			])
		}

		load(CustomerTypeRef, neverNull(logins.getUserController().user.customer))
			.then(customer => load(CustomerInfoTypeRef, customer.customerInfo))
			.then(customerInfo => load(AccountingInfoTypeRef, customerInfo.accountingInfo))
			.then(accountingInfo => {
				this._updateAccountingInfoData(accountingInfo)
				if (accountingInfo.invoiceInfo) {
					load(InvoiceInfoTypeRef, accountingInfo.invoiceInfo)
						.then(invoiceInfo => loadAll(InvoiceTypeRef, invoiceInfo.invoices))
						.then(invoices => {
							invoices.sort(sortCompareByReverseId)
							this._invoices = invoices
							this._updateInvoiceTable()
						})
				}
			})

	}

	_updateAccountingInfoData(accountingInfo: AccountingInfo) {
		this._accountingInfo = accountingInfo
		this._invoiceAddressField.setValue(accountingInfo.invoiceAddress)

		this._invoiceVatNumber.setValue(accountingInfo.invoiceVatIdNo)
		this._invoiceCountryField.setValue(accountingInfo.invoiceCountry ? accountingInfo.invoiceCountry : "<" + lang.get("comboBoxSelectionNone_msg") + ">")
		this._paymentMehthodField.setValue(getPaymentMethodName(accountingInfo.paymentMethod) + " " + getPaymentMethodInfoText(accountingInfo))
		m.redraw()
	}

	_updateInvoiceTable() {
		this._invoiceTable.updateEntries(this._invoices.map((invoice) => {

			const downloadButton = new Button("download_action", () => {
				worker.downloadInvoice(invoice).then(pdfInvoice => fileController.open(pdfInvoice))
			}, () => Icons.Download)

			let invoiceButton;
			if (this._isPayButtonVisible(invoice)) {
				const payButton = new Button("invoicePay_action", () => {
					this._payInvoice(invoice)
				}, () => Icons.Download)
				invoiceButton = createDropDownButton("more_label", Icons.Warning, () => {
					downloadButton.setType(ButtonType.Dropdown)
					payButton.setType(ButtonType.Dropdown)
				})
			} else {
				invoiceButton = downloadButton
			}
			return new TableLine([formatDate(invoice.date), getInvoiceStatusText(invoice), formatPrice(Number(invoice.grandTotal), true)], invoiceButton)
		}))
	}

	entityEventReceived<T>(typeRef: TypeRef<any>, listId: ?string, elementId: string, operation: OperationTypeEnum): void {
		if (isSameTypeRef(typeRef, AccountingInfoTypeRef)) {
			load(AccountingInfoTypeRef, elementId).then(accountingInfo => this._updateAccountingInfoData(accountingInfo))
		} else if (isSameTypeRef(typeRef, InvoiceTypeRef) && operation != OperationType.DELETE) {
			load(InvoiceTypeRef, [neverNull(listId), elementId]).then(invoice => {
				if (operation == OperationType.UPDATE) {
					findAndRemove(this._invoices, (element) => isSameId(element._id, invoice._id))
				}
				const newInvoices = this._invoices.concat([invoice])
				newInvoices.sort(sortCompareByReverseId)
				this._invoices = newInvoices
				this._updateInvoiceTable()
			})
		}
	}


	_isPayButtonVisible(invoice: Invoice): boolean {
		return (invoice.paymentMethod == PaymentMethodType.CreditCard || invoice.paymentMethod == PaymentMethodType.Paypal)
			&& (invoice.status == InvoiceStatus.FIRSTREMINDER || invoice.status == InvoiceStatus.SECONDREMINDER)
	}

	_payInvoice(invoice: Invoice): void {
		if (!this._isPayButtonVisible(invoice) || this._paymentBusy) {
			return
		}
		this._paymentBusy = true
		let confirmMessage = lang.get("invoicePayConfirm_msg", {
			"{invoiceNumber}": invoice.number,
			"{invoiceDate}": formatDate(invoice.date)
		})
		let priceMessage = lang.get('bookingTotalPrice_label') + ": " + formatPrice(Number(invoice.grandTotal), true)
		Dialog.confirm(() => confirmMessage + " " + priceMessage, "invoicePay_action").then(confirmed => {
			if (confirmed) {
				let service = createDebitServicePutData()
				service.invoice = invoice._id
				return serviceRequestVoid(SysService.PaymentDataService, HttpMethod.PUT, service)
					.catch(PreconditionFailedError, error => {
						return error("paymentProviderTransactionFailedError_msg")
					}).catch(BadGatewayError, error => {
						return error("paymentProviderNotAvailableError_msg")
					}).catch(TooManyRequestsError, error => {
						return error("tooManyAttempts_msg")
					})
			}
		}).finally(() => this._paymentBusy = false)
	}
}


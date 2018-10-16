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
	createNotAvailableForFreeButton,
	getInvoiceStatusText,
	getPaymentMethodInfoText,
	getPaymentMethodName
} from "./PriceUtils"
import * as InvoiceDataDialog from "./InvoiceDataDialog"
import {Icons} from "../gui/base/icons/Icons"
import {HttpMethod, isSameId, isSameTypeRef, sortCompareByReverseId} from "../api/common/EntityFunctions"
import {ColumnWidth, Table} from "../gui/base/Table"
import {ExpanderButton, ExpanderPanel} from "../gui/base/Expander"
import {Button, ButtonType, createDropDownButton} from "../gui/base/Button"
import {formatDate, formatNameAndAddress, formatPrice} from "../misc/Formatter"
import {InvoiceStatus, OperationType, PaymentMethodType} from "../api/common/TutanotaConstants"
import {worker} from "../api/main/WorkerClient"
import {fileController} from "../file/FileController"
import TableLine from "../gui/base/TableLine"
import {findAndRemove} from "../api/common/utils/ArrayUtils"
import {BadGatewayError, PreconditionFailedError, TooManyRequestsError} from "../api/common/error/RestError"
import {Dialog, DialogType} from "../gui/base/Dialog"
import {createDebitServicePutData} from "../api/entities/sys/DebitServicePutData"
import {SysService} from "../api/entities/sys/Services"
import {getByAbbreviation} from "../api/common/CountryList"
import * as PaymentDataDialog from "./PaymentDataDialog"
import {DialogHeaderBar} from "../gui/base/DialogHeaderBar"
import {showProgressDialog} from "../gui/base/ProgressDialog"

assertMainOrNode()

export class PaymentViewer {
	_invoiceAddressField: HtmlEditor;
	_paymentMethodField: TextField;
	_invoiceTable: Table;
	_accountingInfo: ?AccountingInfo;
	_invoices: Array<Invoice>;
	_paymentBusy: boolean;
	_invoiceVatNumber: TextField;
	_invoiceExpanderButton: ExpanderButton;

	view: Function;

	constructor() {
		this._invoiceAddressField = new HtmlEditor()
			.setMinHeight(120)
			.showBorders()
			.setMode(Mode.HTML)
			.setHtmlMonospace(false)
			.setEnabled(false)
			.setPlaceholderId("invoiceAddress_label")

		this._invoiceVatNumber = new TextField("invoiceVatIdNo_label").setValue(lang.get("loading_msg")).setDisabled()
		this._paymentMethodField = new TextField("paymentMethod_label").setValue(lang.get("loading_msg")).setDisabled()
		this._paymentMethodField._injectionsRight = () => [m(changePaymentDataButton)]
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
						invoiceAddress: formatNameAndAddress(accountingInfo.invoiceName, accountingInfo.invoiceAddress),
						country: invoiceCountry,
						vatNumber: accountingInfo.invoiceVatIdNo
					}
				)
			}
		}, () => Icons.Edit, true)

		const changePaymentDataButton = createNotAvailableForFreeButton("edit_action", () => {
			if (this._accountingInfo) {
				PaymentDataDialog.show(this._accountingInfo).then(success => {
					if (success) {
						return Promise.each(this._invoices, (invoice) => {
							if (this._isPayButtonVisible(invoice)) {
								return this._showPayInvoiceDialog(invoice)
							}
						})
					}
				})
			}
		}, () => Icons.Edit, true)


		this._invoiceTable = new Table(["date_label", "invoiceState_label", "invoiceTotal_label"], [
			ColumnWidth.Small, ColumnWidth.Largest, ColumnWidth.Small
		], true)
		this._invoiceExpanderButton = new ExpanderButton("show_action", new ExpanderPanel(this._invoiceTable), false)


		this.view = (): VirtualElement => {
			return m("#invoicing-settings.fill-absolute.scroll.plr-l", [
				m(".flex-space-between.items-center.mt-l.mb-s", [
					m(".h4", lang.get('invoiceData_msg')),
					m(".mr-negative-s", m(changeInvoiceDataButton))
				]),
				//m(".small", lang.get("invoiceAddress_label")),
				m(this._invoiceAddressField),
				(this._accountingInfo && this._accountingInfo.invoiceVatIdNo.trim().length
					> 0) ? m(this._invoiceVatNumber) : null,
				m(this._paymentMethodField),
				m(".flex-space-between.items-center.mt-l.mb-s", [
					m(".h4", lang.get('invoices_label')),
					m(this._invoiceExpanderButton)
				]),
				m(this._invoiceExpanderButton.panel),
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
		this._invoiceAddressField.setValue(formatNameAndAddress(accountingInfo.invoiceName, accountingInfo.invoiceAddress, accountingInfo.invoiceCountry))
		this._invoiceVatNumber.setValue(accountingInfo.invoiceVatIdNo)
		this._paymentMethodField.setValue(getPaymentMethodName(accountingInfo.paymentMethod) + " "
			+ getPaymentMethodInfoText(accountingInfo))
		m.redraw()
	}

	_updateInvoiceTable() {
		let showExpanderWarning = false
		this._invoiceTable.updateEntries(this._invoices.map((invoice) => {
			const downloadButton = new Button("download_action", () => {
				showProgressDialog("pleaseWait_msg", worker.downloadInvoice(invoice)).then(pdfInvoice => fileController.open(pdfInvoice))
			}, () => Icons.Download)

			let invoiceButton;
			if (this._isPayButtonVisible(invoice)) {
				showExpanderWarning = true
				const payButton = new Button("invoicePay_action", () => {
					this._showPayInvoiceDialog(invoice)
				}, () => Icons.Cash)
				invoiceButton = createDropDownButton("more_label", () => Icons.Warning, () => {
					downloadButton.setType(ButtonType.Dropdown)
					payButton.setType(ButtonType.Dropdown)
					return [downloadButton, payButton]
				})
			} else {
				invoiceButton = downloadButton
			}
			return new TableLine([
				formatDate(invoice.date), getInvoiceStatusText(invoice), formatPrice(Number(invoice.grandTotal), true)
			], invoiceButton)
		}))
		this._invoiceExpanderButton.setShowWarning(showExpanderWarning)
	}

	entityEventReceived<T>(typeRef: TypeRef<any>, listId: ?string, elementId: string, operation: OperationTypeEnum): void {
		if (isSameTypeRef(typeRef, AccountingInfoTypeRef)) {
			load(AccountingInfoTypeRef, elementId)
				.then(accountingInfo => this._updateAccountingInfoData(accountingInfo))
		} else if (isSameTypeRef(typeRef, InvoiceTypeRef) && operation !== OperationType.DELETE) {
			load(InvoiceTypeRef, [neverNull(listId), elementId]).then(invoice => {
				if (operation === OperationType.UPDATE) {
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
		return (invoice.paymentMethod === PaymentMethodType.CreditCard || invoice.paymentMethod
			=== PaymentMethodType.Paypal)
			&& (invoice.status === InvoiceStatus.FIRSTREMINDER || invoice.status === InvoiceStatus.SECONDREMINDER)
	}

	_showPayInvoiceDialog(invoice: Invoice): Promise<void> {
		if (!this._isPayButtonVisible(invoice) || this._paymentBusy) {
			return Promise.resolve()
		}
		this._paymentBusy = true
		return _showPayInvoiceConfirmDialog(invoice.number, invoice.date, Number(invoice.grandTotal))
			.then(confirmed => {
				if (confirmed) {
					let service = createDebitServicePutData()
					service.invoice = invoice._id
					return showProgressDialog("invoiceUpdateProgress", serviceRequestVoid(SysService.DebitService, HttpMethod.PUT, service)
						.catch(PreconditionFailedError, error => {
							return "paymentProviderTransactionFailedError_msg"
						}).catch(BadGatewayError, error => {
							return "paymentProviderNotAvailableError_msg"
						}).catch(TooManyRequestsError, error => {
							return "tooManyAttempts_msg"
						}), false)
				}
			})
			.then(errorId => {
				if (errorId) {
					return Dialog.error(errorId)
				}
			})
			.finally(() => this._paymentBusy = false)
	}
}


function _showPayInvoiceConfirmDialog(invoiceNumber: string, invoiceDate: Date, price: number): Promise<boolean> {
	return Promise.fromCallback(cb => {
		let actionBar = new DialogHeaderBar()
		const dialog = new Dialog(DialogType.EditSmall, {
			view: (): Children => [
				m(".dialog-header.plr-l", m(actionBar)),
				m(".plr-l.pb", m("", [
					m(".pt", lang.get("invoicePayConfirm_msg")),
					m(orderField),
					m(dateField),
					m(priceField),
				]))
			]
		})
		const cancelAction = () => {
			dialog.close()
			cb(null, false)
		}
		actionBar.setMiddle(() => lang.get("adminPayment_action"))
		actionBar.addLeft(new Button("cancel_action", cancelAction).setType(ButtonType.Secondary))
		actionBar.addRight(new Button("invoicePay_action", () => {
			dialog.close()
			cb(null, true)
		}).setType(ButtonType.Primary))

		let orderField = new TextField("number_label").setValue(invoiceNumber).setDisabled()
		let dateField = new TextField("date_label").setValue(formatDate(invoiceDate)).setDisabled()
		let priceField = new TextField("price_label").setValue(formatPrice(price, true)).setDisabled()

		dialog.setCloseHandler(cancelAction)
			.show()
	})
}

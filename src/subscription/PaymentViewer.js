// @flow
import m from "mithril"
import {assertMainOrNode} from "../api/Env"
import {neverNull} from "../api/common/utils/Utils"
import {load, serviceRequest, serviceRequestVoid} from "../api/main/Entity"
import {lang} from "../misc/LanguageViewModel.js"
import {TextField} from "../gui/base/TextField"
import {AccountingInfoTypeRef} from "../api/entities/sys/AccountingInfo"
import {InvoiceTypeRef} from "../api/entities/sys/Invoice"
import {HtmlEditor, Mode} from "../gui/base/HtmlEditor"
import {createNotAvailableForFreeButton, getPaymentMethodInfoText, getPaymentMethodName} from "./PriceUtils"
import * as InvoiceDataDialog from "./InvoiceDataDialog"
import {Icons} from "../gui/base/icons/Icons"
import {HttpMethod} from "../api/common/EntityFunctions"
import {ColumnWidth} from "../gui/base/Table"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import {formatDate, formatNameAndAddress} from "../misc/Formatter"
import {getPaymentMethodType, OperationType, PaymentMethodType, PostingType} from "../api/common/TutanotaConstants"
import {worker} from "../api/main/WorkerClient"
import {fileController} from "../file/FileController"
import {BadGatewayError, PreconditionFailedError, TooManyRequestsError} from "../api/common/error/RestError"
import {Dialog, DialogType} from "../gui/base/Dialog"
import {createDebitServicePutData} from "../api/entities/sys/DebitServicePutData"
import {SysService} from "../api/entities/sys/Services"
import {getByAbbreviation} from "../api/common/CountryList"
import * as PaymentDataDialog from "./PaymentDataDialog"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import type {EntityUpdateData} from "../api/main/EventController"
import {isUpdateForTypeRef} from "../api/main/EventController"
import stream from "mithril/stream/stream.js"
import {formatPrice, getPreconditionFailedPaymentMsg} from "./SubscriptionUtils"
import type {DialogHeaderBarAttrs} from "../gui/base/DialogHeaderBar"
import {DialogHeaderBar} from "../gui/base/DialogHeaderBar"
import {TextFieldN} from "../gui/base/TextFieldN"
import {AccountingService} from "../api/entities/accounting/Services"
import {CustomerAccountReturnTypeRef} from "../api/entities/accounting/CustomerAccountReturn"
import {CustomerTypeRef} from "../api/entities/sys/Customer"
import {logins} from "../api/main/LoginController"
import {CustomerInfoTypeRef} from "../api/entities/sys/CustomerInfo"
import {InvoiceInfoTypeRef} from "../api/entities/sys/InvoiceInfo"
import {createCustomerAccountPosting} from "../api/entities/accounting/CustomerAccountPosting"
import {ExpanderButtonN, ExpanderPanelN} from "../gui/base/ExpanderN"
import {TableN} from "../gui/base/TableN"

assertMainOrNode()

export class PaymentViewer implements UpdatableSettingsViewer {
	_invoiceAddressField: HtmlEditor;
	_paymentMethodField: TextField;
	_accountingInfo: ?AccountingInfo;
	_postings: CustomerAccountPosting[]
	_paymentBusy: boolean;
	_invoiceVatNumber: TextField;
	_invoiceInfo: ?InvoiceInfo;

	view: Function;

	constructor() {
		this._invoiceAddressField = new HtmlEditor()
			.setMinHeight(140)
			.showBorders()
			.setMode(Mode.HTML)
			.setHtmlMonospace(false)
			.setEnabled(false)
			.setPlaceholderId("invoiceAddress_label")

		this._invoiceVatNumber = new TextField("invoiceVatIdNo_label").setValue(lang.get("loading_msg")).setDisabled()
		this._paymentMethodField = new TextField("paymentMethod_label").setValue(lang.get("loading_msg")).setDisabled()
		this._paymentMethodField._injectionsRight = () => [m(changePaymentDataButton)]
		this._postings = []
		this._paymentBusy = false

		const changeInvoiceDataButton = createNotAvailableForFreeButton("edit_action", () => {
			if (this._accountingInfo) {
				const accountingInfo = neverNull(this._accountingInfo)
				const invoiceCountry = accountingInfo.invoiceCountry ? getByAbbreviation(accountingInfo.invoiceCountry) : null
				InvoiceDataDialog.show({
						businessUse: stream(accountingInfo.business),
						paymentInterval: stream(Number(accountingInfo.paymentInterval)),
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
						if (this._isPayButtonVisible()) {
							return this._showPayDialog(this._openBalance())
						}
					}
				})
			}
		}, () => Icons.Edit, true)

		const postingExpanded = stream(false)


		this.view = (): VirtualElement => {
			return m("#invoicing-settings.fill-absolute.scroll.plr-l", [
				m(".flex-space-between.items-center.mt-l.mb-s", [
					m(".h4", lang.get('invoiceData_msg')),
					m(".mr-negative-s", m(changeInvoiceDataButton))
				]),
				m(this._invoiceAddressField),
				(this._accountingInfo && this._accountingInfo.invoiceVatIdNo.trim().length
					> 0) ? m(this._invoiceVatNumber) : null,
				m(this._paymentMethodField),
				this._postings && this._postings.length > 0 ? [
					m(".h4.mt-l", lang.get('currentBalance_label')),
					m(".flex.center-horizontally.center-vertically.col", [
						m("div.h4.pt.pb"
							+ (this._openBalance() ? ".content-accent-fg" : ""), formatPrice(Number(this._postings[0].balance), true)),
						this._isPayButtonVisible()
							? m(".pb", {style: {width: '200px'}}, m(ButtonN, {
								label: "invoicePay_action",
								type: ButtonType.Login,
								click: () => this._showPayDialog(this._openBalance())
							}))
							: null,
					]),
					(this._openBalance() && this._accountingInfo && this._accountingInfo.paymentMethod !== PaymentMethodType.Invoice)
						? (
							(this._invoiceInfo && this._invoiceInfo.paymentErrorInfo)
								? m(".small.underline.b", lang.get(getPreconditionFailedPaymentMsg(new PreconditionFailedError("dummy-msg", this._invoiceInfo.paymentErrorInfo.errorCode))))
								: m(".small.underline.b", lang.get("failedDebitAttempt_msg"))
						)
						: null,
					m(".flex-space-between.items-center.mt-l.mb-s", [
						m(".h4", lang.get('postings_label')),
						m(ExpanderButtonN, {
							label: "show_action",
							expanded: postingExpanded
						}),
					]),
					m(ExpanderPanelN, {expanded: postingExpanded}, m(TableN, {
						columnHeadingTextIds: ["type_label", "amount_label"],
						columnWidths: [ColumnWidth.Largest, ColumnWidth.Small, ColumnWidth.Small],
						columnAlignments: [false, true, false],
						showActionButtonColumn: true,
						lines: this._postings.map((posting: CustomerAccountPosting) => {
							return {
								cells: () => [
									{
										main: getPostingTypeText(posting),
										info: formatDate(posting.valueDate)
									},
									{
										main: formatPrice(Number(posting.amount), true)
									}
								],
								actionButtonAttrs: posting.type === PostingType.UsageFee
									? {
										label: "download_action",
										icon: () => Icons.Download,
										click: () => {
											showProgressDialog("pleaseWait_msg", worker.downloadInvoice(neverNull(posting.invoiceNumber))).then(pdfInvoice => fileController.open(pdfInvoice))
										}
									}
									: null
							}
						})
					})),
					m(".small", lang.get("invoiceSettingDescription_msg") + " " + lang.get("laterInvoicingInfo_msg")),
				] : null,
			])
		}

		load(CustomerTypeRef, neverNull(logins.getUserController().user.customer))
			.then(customer => load(CustomerInfoTypeRef, customer.customerInfo))
			.then(customerInfo => load(AccountingInfoTypeRef, customerInfo.accountingInfo))
			.then(accountingInfo => {
				this._updateAccountingInfoData(accountingInfo)

				load(InvoiceInfoTypeRef, neverNull(accountingInfo.invoiceInfo))
					.then((invoiceInfo) => {
						this._invoiceInfo = invoiceInfo
					})
			})


		this._updatePostingsTable()
	}

	_updateAccountingInfoData(accountingInfo: AccountingInfo) {
		this._accountingInfo = accountingInfo
		this._invoiceAddressField.setValue(formatNameAndAddress(accountingInfo.invoiceName, accountingInfo.invoiceAddress, accountingInfo.invoiceCountry))
		this._invoiceVatNumber.setValue(accountingInfo.invoiceVatIdNo)
		this._paymentMethodField.setValue(getPaymentMethodName(getPaymentMethodType(accountingInfo)) + " "
			+ getPaymentMethodInfoText(accountingInfo))
		m.redraw()
	}

	_openBalance(): number {
		if (this._postings != null && this._postings.length > 0) {
			let balance = Number(this._postings[0].balance)
			if (balance < 0) {
				return balance
			}
		}
		return 0
	}

	_updatePostingsTable() {
		serviceRequest(AccountingService.CustomerAccountService, HttpMethod.GET, null, CustomerAccountReturnTypeRef).then(result => {
			this._postings = result.postings
			m.redraw()
		})
	}

	entityEventsReceived(updates: $ReadOnlyArray<EntityUpdateData>) {
		for (let update of updates) {
			this.processUpdate(update)
		}
	}

	processUpdate(update: EntityUpdateData): void {
		const {instanceListId, instanceId, operation} = update
		if (isUpdateForTypeRef(AccountingInfoTypeRef, update)) {
			load(AccountingInfoTypeRef, instanceId)
				.then(accountingInfo => this._updateAccountingInfoData(accountingInfo))
		} else if (isUpdateForTypeRef(InvoiceTypeRef, update) && operation !== OperationType.DELETE) {
			load(InvoiceTypeRef, [neverNull(instanceListId), instanceId]).then(invoice => {
				// FIXME how do we receive an event after we have paid?
				this._updatePostingsTable()
			})
		}
	}


	_isPayButtonVisible(): boolean {
		return this._accountingInfo != null &&
			(this._accountingInfo.paymentMethod === PaymentMethodType.CreditCard || this._accountingInfo.paymentMethod
				=== PaymentMethodType.Paypal)
			&& this._openBalance() < 0
	}

	_showPayDialog(openBalance: number): Promise<void> {
		this._paymentBusy = true
		return _showPayConfirmDialog(openBalance)
			.then(confirmed => {
				if (confirmed) {
					let service = createDebitServicePutData()
					return showProgressDialog("pleaseWait_msg", serviceRequestVoid(SysService.DebitService, HttpMethod.PUT, service)
						.then(() => {
							// accounting is updated async but we know that the balance will be 0 when the payment was successful.
							let mostCurrentPosting = this._postings[0]
							let newPosting = createCustomerAccountPosting({
								valueDate: new Date(),
								amount: String(-Number.parseFloat(mostCurrentPosting.balance)),
								balance: "0",
								type: PostingType.Payment,
							})
							this._postings.unshift(newPosting)
							m.redraw()
						})
						.catch(PreconditionFailedError, error => {
							return getPreconditionFailedPaymentMsg(error)
						}).catch(BadGatewayError, error => {
							return "paymentProviderNotAvailableError_msg"
						}).catch(TooManyRequestsError, error => {
							return "tooManyAttempts_msg"
						}))
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


function _showPayConfirmDialog(price: number): Promise<boolean> {
	return new Promise(resolve => {
		let dialog: Dialog

		const doAction = res => {
			dialog.close()
			resolve(res)
		}

		const actionBarAttrs: DialogHeaderBarAttrs = {
			left: [{label: "cancel_action", click: () => doAction(false), type: ButtonType.Secondary}],
			right: [{label: "invoicePay_action", click: () => doAction(true), type: ButtonType.Primary}],
			middle: () => lang.get("adminPayment_action")
		}

		dialog = new Dialog(DialogType.EditSmall, {
			view: (): Children => [
				m(".dialog-header.plr-l", m(DialogHeaderBar, actionBarAttrs)),
				m(".plr-l.pb", m("", [
					m(".pt", lang.get("invoicePayConfirm_msg")),
					m(TextFieldN, {label: "price_label", value: stream(formatPrice(-price, true)), disabled: true}),
				]))
			]
		}).setCloseHandler(() => doAction(false)).show()
	})
}

function getPostingTypeText(posting: CustomerAccountPosting): string {
	switch (posting.type) {
		case PostingType.UsageFee:
			return lang.get("invoice_label")
		case PostingType.Credit:
			return lang.get("credit_label")
		case PostingType.Payment:
			return lang.get("adminPayment_action")
		case PostingType.Refund:
			return lang.get("refund_label")
		default:
			return "" // Generic, Dispute, Suspension, SuspensionCancel
	}
}
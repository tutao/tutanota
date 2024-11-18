import { MARGIN_LEFT, MARGIN_TOP, PDF_FONTS, PDF_IMAGES, PdfDocument, TABLE_VERTICAL_SPACING, TableColumn } from "../pdf/PdfDocument.js"
import InvoiceTexts from "./InvoiceTexts.js"
import { PdfWriter } from "../pdf/PdfWriter.js"
import { InvoiceDataGetOut } from "../../entities/sys/TypeRefs.js"
import { countryUsesGerman, getInvoiceItemTypeName, InvoiceItemType, InvoiceType, PaymentMethod, VatType } from "./InvoiceUtils.js"

/**
 * Object generating a PDF invoice document.
 * This generator is ONLY responsible for rendering the data it gets and formatting it in a way that does not change anything about it.
 * If adjustments to the data must be made prior to rendering, then these should take place within the RenderInvoice service.
 */
export class PdfInvoiceGenerator {
	private readonly doc: PdfDocument
	private readonly languageCode: "de" | "en" = "en"
	private readonly invoiceNumber: string
	private readonly customerId: string
	private invoice: InvoiceDataGetOut

	constructor(pdfWriter: PdfWriter, invoice: InvoiceDataGetOut, invoiceNumber: string, customerId: string) {
		this.invoice = invoice
		this.invoiceNumber = invoiceNumber
		this.customerId = customerId
		this.languageCode = countryUsesGerman(this.invoice.country)
		this.doc = new PdfDocument(pdfWriter)
	}

	/**
	 * Generate the PDF document
	 */
	async generate(): Promise<Uint8Array> {
		await this.doc.addPage()
		this.doc.addImage(PDF_IMAGES.TUTA_LOGO, [25, MARGIN_TOP + 15.7], [45, 15.7])
		this.renderSideBarInfo()
		await this.renderAddressField()
		this.renderInvoiceInfo()
		await this.renderInvoiceTable()
		this.renderAdditional()
		this.renderLegalDisclaimer()
		return await this.doc.create()
	}

	/**
	 * The sidebar on the document in the top-right corner
	 */
	renderSideBarInfo() {
		this.doc
			.changeFont(PDF_FONTS.BOLD, 11)
			.addText(InvoiceTexts.universal.companyName, [MARGIN_LEFT + 125, MARGIN_TOP])
			.changeFont(PDF_FONTS.REGULAR, 11)
			.addLineBreak()
			.addText(InvoiceTexts.universal.addressStreet)
			.addLineBreak()
			.addText(InvoiceTexts[this.languageCode].addressPostal)
			.addLineBreak()
			.addText(InvoiceTexts[this.languageCode].addressCountry)
			.addLineBreak()
			.addLineBreak()
			.addText(InvoiceTexts[this.languageCode].tutaPhone)
			.addLineBreak()
			.addText(InvoiceTexts.universal.tutaFax)
			.addLineBreak()
			.addText(InvoiceTexts.universal.tutaEmail)
			.addLineBreak()
			.addText(InvoiceTexts.universal.tutaWebsite)
			.addLineBreak()
			.addLineBreak()
			.addText(InvoiceTexts[this.languageCode].yourCustomerId)
			.addLineBreak()
			.addText(this.customerId)
			.changeFontSize(12)
			.addText(`${InvoiceTexts[this.languageCode].addressCity}, ${this.formatInvoiceDate(this.invoice.date)}`, [MARGIN_LEFT + 125, MARGIN_TOP + 70])
	}

	/**
	 * The short address field of Tuta and the address field of the customer below the image
	 */
	async renderAddressField() {
		this.doc
			.changeFontSize(9)
			.addText(`${InvoiceTexts.universal.companyName} - ${InvoiceTexts.universal.addressStreet} - ${InvoiceTexts[this.languageCode].addressPostal}`, [
				MARGIN_LEFT,
				MARGIN_TOP + 35,
			])
			.addLineBreak()
			.changeFontSize(11)
			.addLineBreak()
		await this.doc.addAddressField([MARGIN_LEFT, MARGIN_TOP + 82], this.invoice.address)
	}

	/**
	 * The basic invoice info above the invoice table
	 */
	renderInvoiceInfo() {
		this.doc
			.changeFontSize(18)
			.addText(this.getInvoiceTypeName(this.invoice.invoiceType, this.invoice.grandTotal), [MARGIN_LEFT, MARGIN_TOP + 90])
			.changeFont(PDF_FONTS.BOLD, 12)
			.addText(`${InvoiceTexts[this.languageCode].invoiceNumber} ${this.invoiceNumber}`, [MARGIN_LEFT, MARGIN_TOP + 100])
			.changeFont(PDF_FONTS.REGULAR, 11)
		if (this.invoice.invoiceType === InvoiceType.INVOICE) {
			this.doc.addText(InvoiceTexts[this.languageCode].asAgreedBlock, [MARGIN_LEFT, MARGIN_TOP + 110])
		}
	}

	/**
	 * The table with all invoice items
	 */
	async renderInvoiceTable() {
		// Define headers and column widths
		const columns: TableColumn[] = [
			{ headerName: InvoiceTexts[this.languageCode].quantity, columnWidth: 19.8 },
			{ headerName: InvoiceTexts[this.languageCode].item, columnWidth: 95.7 },
			{ headerName: InvoiceTexts[this.languageCode].singlePrice, columnWidth: 24.75 },
			{ headerName: InvoiceTexts[this.languageCode].totalPrice, columnWidth: 24.75 },
		]
		const tableData: Array<Array<string>> = []

		// Fill table data (two entries at the time) and render it
		for (const invoiceItem of this.invoice.items) {
			// Entry with all invoice info
			tableData.push([
				this.formatAmount(invoiceItem.itemType, invoiceItem.amount),
				getInvoiceItemTypeName(invoiceItem.itemType, this.languageCode),
				invoiceItem.singlePrice == null ? "" : this.formatInvoiceCurrency(invoiceItem.singlePrice),
				this.formatInvoiceCurrency(invoiceItem.totalPrice),
			])
			// Entry with date range
			tableData.push(["", `${this.formatInvoiceDate(invoiceItem.startDate)} - ${this.formatInvoiceDate(invoiceItem.endDate)}`, "", ""])
		}
		const tableEndPoint = await this.doc.addTable([MARGIN_LEFT, MARGIN_TOP + 120], 165, columns, tableData, this.getTableRowsForFirstPage())

		this.renderTableSummary(tableEndPoint, columns)
		this.doc.changeTextCursorPosition([MARGIN_LEFT, tableEndPoint + 4 * TABLE_VERTICAL_SPACING])
	}

	/**
	 * Summary of totals and applied VAT below the rendered table
	 */
	renderTableSummary(tableEndPoint: number, columns: TableColumn[]) {
		// Line break that's to be removed if no VAT appears in the summary
		let additionalVerticalSpace = 1

		this.doc.changeFont(PDF_FONTS.REGULAR, 11)

		// Sub total
		this.doc.addTableRow([MARGIN_LEFT, tableEndPoint], columns, [
			"",
			"",
			InvoiceTexts[this.languageCode].subTotal,
			this.formatInvoiceCurrency(this.invoice.subTotal),
		])
		// VAT
		if (this.invoice.vatType === VatType.ADD_VAT) {
			// AddedVat
			this.doc.addTableRow([MARGIN_LEFT, tableEndPoint + TABLE_VERTICAL_SPACING], columns, [
				"",
				"",
				`${InvoiceTexts[this.languageCode].addedVat} ${this.invoice.vatRate}${InvoiceTexts[this.languageCode].vatPercent}`,
				this.formatInvoiceCurrency(this.invoice.vat),
			])
		} else if (this.invoice.vatType === VatType.VAT_INCLUDED_SHOWN) {
			// IncludedVat
			this.doc.addTableRow([MARGIN_LEFT, tableEndPoint + TABLE_VERTICAL_SPACING], columns, [
				"",
				"",
				`${InvoiceTexts[this.languageCode].includedVat} ${this.invoice.vatRate}${InvoiceTexts[this.languageCode].vatPercent}`,
				this.formatInvoiceCurrency(this.invoice.vat),
			])
		} else {
			additionalVerticalSpace -= 1
		}
		// Grand total
		this.doc.changeFont(PDF_FONTS.BOLD, 11)
		this.doc.addTableRow([MARGIN_LEFT, tableEndPoint + (additionalVerticalSpace + 1) * TABLE_VERTICAL_SPACING], columns, [
			"",
			"",
			InvoiceTexts[this.languageCode].grandTotal,
			// in case of NO_VAT_CHARGE_TUTAO we must not show the VAT in the invoice, but we pay the taxes ourselves, so they need to be existing on the invoice
			this.formatInvoiceCurrency(this.invoice.vatType == VatType.NO_VAT_CHARGE_TUTAO ? this.invoice.subTotal : this.invoice.grandTotal),
		])
	}

	/**
	 * Additional blocks displayed below the table depending on invoice type, vat type and payment method
	 */
	renderAdditional() {
		this.doc.changeFont(PDF_FONTS.REGULAR, 11)

		// No VAT / VAT not shown in table
		switch (this.invoice.vatType) {
			case VatType.ADD_VAT:
			case VatType.VAT_INCLUDED_SHOWN:
				break
			case VatType.NO_VAT:
				if (this.invoice.vatIdNumber != null) {
					this.doc
						.addText(InvoiceTexts[this.languageCode].reverseChargeVatIdNumber1)
						.addLineBreak()
						.addText(InvoiceTexts[this.languageCode].reverseChargeVatIdNumber2)
						.addLineBreak()
						.addText(`${InvoiceTexts[this.languageCode].yourVatId} `)
						.changeFont(PDF_FONTS.BOLD, 11)
						.addText(`${this.invoice.vatIdNumber}`)
						.changeFont(PDF_FONTS.REGULAR, 11)
				} else {
					this.doc.addText(InvoiceTexts[this.languageCode].netPricesNoVatInGermany)
				}
				break
			case VatType.NO_VAT_CHARGE_TUTAO:
				this.doc
					.addText(InvoiceTexts[this.languageCode].reverseChargeAffiliate)
					.addLineBreak()
					.addText(InvoiceTexts[this.languageCode].reverseChargeVatIdNumber2)
				if (this.invoice.vatIdNumber != null) {
					this.doc
						.addLineBreak()
						.addText(`${InvoiceTexts[this.languageCode].yourVatId} `)
						.changeFont(PDF_FONTS.BOLD, 11)
						.addText(`${this.invoice.vatIdNumber}`)
				}
				break
			case VatType.VAT_INCLUDED_HIDDEN:
				this.doc.addText(InvoiceTexts[this.languageCode].noVatInGermany)
				break
			default:
				throw new Error("Unknown VatType " + this.invoice.vatType)
		}
		this.doc.addLineBreak()
		this.doc.addLineBreak()

		// Payment info
		if (this.invoice.invoiceType === InvoiceType.INVOICE) {
			switch (this.invoice.paymentMethod) {
				case PaymentMethod.INVOICE:
					this.doc
						.addText(InvoiceTexts[this.languageCode].paymentInvoiceDue1)
						.addLineBreak()
						.addText(InvoiceTexts[this.languageCode].paymentInvoiceDue2)
						.addLineBreak()
						.addLineBreak()
						.addText(InvoiceTexts[this.languageCode].paymentInvoiceHolder)
						.addLineBreak()
						.addText(InvoiceTexts[this.languageCode].paymentInvoiceBank)
						.addLineBreak()
						.addText(InvoiceTexts[this.languageCode].paymentInvoiceIBAN)
						.addLineBreak()
						.addText(InvoiceTexts[this.languageCode].paymentInvoiceBIC)
						.addLineBreak()
						.addText(InvoiceTexts[this.languageCode].paymentInvoiceProvideNumber1)
						.changeFont(PDF_FONTS.BOLD, 11)
						.addText(` ${this.invoiceNumber} `)
						.changeFont(PDF_FONTS.REGULAR, 11)
						.addLineBreak()
						.addText(InvoiceTexts[this.languageCode].paymentInvoiceProvideNumber2)
					break
				case PaymentMethod.CREDIT_CARD:
					this.doc.addText(InvoiceTexts[this.languageCode].paymentCreditCard)
					break
				case PaymentMethod.PAYPAL:
					this.doc.addText(InvoiceTexts[this.languageCode].paymentPaypal)
					break
				case PaymentMethod.ACCOUNT_BALANCE:
					this.doc.addText(InvoiceTexts[this.languageCode].paymentAccountBalance)
					break
			}
			this.doc.addLineBreak().addLineBreak().addText(InvoiceTexts[this.languageCode].thankYou)
		}
	}

	/**
	 * The legal disclaimer info at the bottom of the last page
	 */
	renderLegalDisclaimer() {
		this.doc
			.changeFont(PDF_FONTS.REGULAR, 10)
			.addText(InvoiceTexts[this.languageCode].legalNoSigned, [MARGIN_LEFT, MARGIN_TOP + 240])
			.addLineBreak()
			.addLineBreak()
			.changeTextGrayscale(0.5)
			.addText(InvoiceTexts[this.languageCode].legalRepresented, [MARGIN_LEFT, MARGIN_TOP + 250])
			.addLineBreak()
			.addText(InvoiceTexts[this.languageCode].legalRegistration)
			.addLineBreak()
			.addText(InvoiceTexts[this.languageCode].legalVatIdentification)
			.addLineBreak()
			.addText(InvoiceTexts[this.languageCode].legalBankAccount)
	}

	/**
	 * Determines how many table rows (invoice items) can be rendered on the first page depending on the texts that follow after the table
	 */
	getTableRowsForFirstPage(): number {
		if (
			this.invoice.paymentMethod === PaymentMethod.INVOICE &&
			this.invoice.vatIdNumber != null &&
			// Needs fix @arm, @jug, @jop
			(this.invoice.vatType === VatType.NO_VAT || this.invoice.vatType === VatType.NO_VAT_CHARGE_TUTAO)
		) {
			// In these scenarios, there will be a lot of text after the table summary, so few rows can render
			return 4
		} else {
			// In all other scenarios, there will be little text after the table summary, so more rows can render
			return 8
		}
	}

	/**
	 * Get the name of a given InvoiceType
	 */
	getInvoiceTypeName(type: NumberString, amount: NumberString): string {
		switch (type) {
			case InvoiceType.INVOICE:
				return InvoiceTexts[this.languageCode].invoice
			case InvoiceType.CREDIT:
				return InvoiceTexts[this.languageCode].credit
			case InvoiceType.REFERRAL_CREDIT:
				if (parseFloat(amount) >= 0) {
					return InvoiceTexts[this.languageCode].credit
				} else {
					return InvoiceTexts[this.languageCode].cancelCredit
				}
			default:
				throw new Error("Invalid InvoiceType " + type)
		}
	}

	/**
	 * Format the date depending on document language (dd.mm.yyyy) / (dd. Mon yyyy)
	 */
	formatInvoiceDate(date: Date | null): string {
		if (date == null) return ""
		if (this.languageCode === "de") {
			return date.toLocaleDateString("de-DE", {
				day: "2-digit",
				month: "2-digit",
				year: "numeric",
			})
		} else {
			return date.toLocaleDateString("en-UK", {
				day: "2-digit",
				month: "short",
				year: "numeric",
			})
		}
	}

	/**
	 * Format the currency separator (dot, comma) depending on the country
	 */
	formatInvoiceCurrency(price: string | number): string {
		price = `${price} EUR`
		return this.languageCode === "de" ? price.replace(".", ",") : price
	}

	/**
	 * Format the amount of storage into the appropriate byte unit if the item is a legacy storage package. Otherwise, return as is
	 */
	formatAmount(itemType: string, amount: string): string {
		if (itemType === InvoiceItemType.StoragePackage || itemType === InvoiceItemType.StoragePackageUpgrade) {
			const numAmount = Number(amount)
			return numAmount < 1000 ? `${amount} GB` : `${numAmount / 1000} TB`
		} else {
			return amount
		}
	}
}

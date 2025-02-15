import { InvoiceTexts_default, InvoiceType, PaymentMethod, VatType, countryUsesGerman, getInvoiceItemTypeName } from "./InvoiceUtils-chunk.js";

//#region src/common/api/worker/invoicegen/XRechnungUBLTemplate.ts
var XRechnungUBLTemplate_default = {
	RootInvoice: `
		<ubl:Invoice xmlns:ubl="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
					 xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
					 xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
			<cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0#conformant#urn:xeinkauf.de:kosit:extension:xrechnung_3.0</cbc:CustomizationID>
			{slotMain}
		</ubl:Invoice>`,
	RootCreditNote: `
		<ubl:CreditNote xmlns:ubl="urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2"
						xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
						xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
			<cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0</cbc:CustomizationID>
			{slotMain}
		</ubl:CreditNote>`,
	Main: `
		<cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
		<cbc:ID>{invoiceNumber}</cbc:ID>
		<cbc:IssueDate>{issueDate}</cbc:IssueDate>
		{slotInvoiceType}
		<cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>
		<cbc:BuyerReference>{buyerId}</cbc:BuyerReference>
		{slotSeller}
		{slotBuyer}
		<cac:PaymentMeans>
			<cbc:PaymentMeansCode>{paymentMeansCode}</cbc:PaymentMeansCode>
			<cac:PayeeFinancialAccount>
				<cbc:ID>DE67250800200138040001</cbc:ID>
				<cbc:Name>Tutao GmbH</cbc:Name>
				<cac:FinancialInstitutionBranch>
					<cbc:ID>DRESDEFF250</cbc:ID>
				</cac:FinancialInstitutionBranch>
			</cac:PayeeFinancialAccount>
		</cac:PaymentMeans>
		{slotPaymentTerms}
		{slotAllowanceCharge}
		{slotTotalTax}
		{slotDocumentTotals}
		{slotInvoiceLines}`,
	Seller: `
		<cac:AccountingSupplierParty>
			<cac:Party>
				<cbc:EndpointID schemeID="EM">sales@tutao.de</cbc:EndpointID>
				<cac:PartyName>
					<cbc:Name>Tutao GmbH</cbc:Name>
				</cac:PartyName>
				<cac:PostalAddress>
					<cbc:StreetName>Deisterstraße 17a</cbc:StreetName>
					<cbc:CityName>Hannover</cbc:CityName>
					<cbc:PostalZone>30449</cbc:PostalZone>
					<cac:Country>
						<cbc:IdentificationCode>DE</cbc:IdentificationCode>
					</cac:Country>
				</cac:PostalAddress>
				<cac:PartyTaxScheme>
					<cbc:CompanyID>DE280903265</cbc:CompanyID>
					<cac:TaxScheme>
						<cbc:ID>VAT</cbc:ID>
					</cac:TaxScheme>
				</cac:PartyTaxScheme>
				<cac:PartyLegalEntity>
					<cbc:RegistrationName>Tutao GmbH</cbc:RegistrationName>
					<cbc:CompanyID>208014</cbc:CompanyID>
				</cac:PartyLegalEntity>
				<cac:Contact>
					<cbc:Name>Tutao GmbH</cbc:Name>
					<cbc:Telephone>+49 511202801-0</cbc:Telephone>
					<cbc:ElectronicMail>sales@tutao.de</cbc:ElectronicMail>
				</cac:Contact>
			</cac:Party>
		</cac:AccountingSupplierParty>`,
	Buyer: `
		<cac:AccountingCustomerParty>
			<cac:Party>
				<cbc:EndpointID schemeID="EM">{buyerMail}</cbc:EndpointID>
				<cac:PostalAddress>
					<cbc:StreetName>{buyerStreetName}</cbc:StreetName>
					<cbc:CityName>{buyerCityName}</cbc:CityName>
					<cbc:PostalZone>{buyerPostalZone}</cbc:PostalZone>
					<cac:AddressLine>
						<cbc:Line>{buyerAddressLine}</cbc:Line>
					</cac:AddressLine>
					<cac:Country>
						<cbc:IdentificationCode>{buyerCountryCode}</cbc:IdentificationCode>
					</cac:Country>
				</cac:PostalAddress>
				{slotBuyerVatInfo}
				<cac:PartyLegalEntity>
					<cbc:RegistrationName>{buyerName}</cbc:RegistrationName>
				</cac:PartyLegalEntity>
			</cac:Party>
		</cac:AccountingCustomerParty>`,
	BuyerVatInfo: `
		<cac:PartyTaxScheme>
			<cbc:CompanyID>{buyerVatId}</cbc:CompanyID>
			<cac:TaxScheme>
				<cbc:ID>VAT</cbc:ID>
			</cac:TaxScheme>
		</cac:PartyTaxScheme>`,
	AllowanceCharge: `
		<cac:AllowanceCharge>
			<cbc:ChargeIndicator>false</cbc:ChargeIndicator>
			<cbc:AllowanceChargeReasonCode>95</cbc:AllowanceChargeReasonCode>
			<cbc:Amount currencyID="EUR">{totalDiscount}</cbc:Amount>
			<cac:TaxCategory>
				<cbc:ID>{vatType}</cbc:ID>
				<cbc:Percent>{vatPercent}</cbc:Percent>
				{slotTaxExemptionReason}
				<cac:TaxScheme>
					<cbc:ID>VAT</cbc:ID>
				</cac:TaxScheme>
			</cac:TaxCategory>
		</cac:AllowanceCharge>
	`,
	TaxTotal: `
		<cac:TaxTotal>
			<cbc:TaxAmount currencyID="EUR">{vatAmount}</cbc:TaxAmount>
			<cac:TaxSubtotal>
				<cbc:TaxableAmount currencyID="EUR">{taxableAmount}</cbc:TaxableAmount>
				<cbc:TaxAmount currencyID="EUR">{vatAmount}</cbc:TaxAmount>
				<cac:TaxCategory>
					<cbc:ID>{vatType}</cbc:ID>
					<cbc:Percent>{vatPercent}</cbc:Percent>
					{slotTaxExemptionReason}
					<cac:TaxScheme>
						<cbc:ID>VAT</cbc:ID>
					</cac:TaxScheme>
				</cac:TaxCategory>
			</cac:TaxSubtotal>
		</cac:TaxTotal>`,
	DocumentTotals: `
		<cac:LegalMonetaryTotal>
			<cbc:LineExtensionAmount currencyID="EUR">{sumOfInvoiceLines}</cbc:LineExtensionAmount>
			<cbc:TaxExclusiveAmount currencyID="EUR">{invoiceExclusiveVat}</cbc:TaxExclusiveAmount>
			<cbc:TaxInclusiveAmount currencyID="EUR">{invoiceInclusiveVat}</cbc:TaxInclusiveAmount>
			<cbc:AllowanceTotalAmount currencyID="EUR">{totalDiscount}</cbc:AllowanceTotalAmount>
			<cbc:PayableAmount currencyID="EUR">{amountDueForPayment}</cbc:PayableAmount>
		</cac:LegalMonetaryTotal>`,
	InvoiceLine: `
		<cac:InvoiceLine>
			<cbc:ID>{invoiceLineId}</cbc:ID>
			<cbc:InvoicedQuantity unitCode="XPP">{invoiceLineQuantity}</cbc:InvoicedQuantity>
			<cbc:LineExtensionAmount currencyID="EUR">{invoiceLineTotal}</cbc:LineExtensionAmount>
			<cac:InvoicePeriod>
				<cbc:StartDate>{invoiceLineStartDate}</cbc:StartDate>
				<cbc:EndDate>{invoiceLineEndDate}</cbc:EndDate>
			</cac:InvoicePeriod>
			<cac:Item>
				<cbc:Name>{invoiceLineItemName}</cbc:Name>
				<cac:ClassifiedTaxCategory>
					<cbc:ID>{invoiceLineItemVatType}</cbc:ID>
					<cbc:Percent>{invoiceLineItemVatPercent}</cbc:Percent>
					<cac:TaxScheme>
						<cbc:ID>VAT</cbc:ID>
					</cac:TaxScheme>
				</cac:ClassifiedTaxCategory>
			</cac:Item>
			<cac:Price>
				<cbc:PriceAmount currencyID="EUR">{invoiceLineItemPrice}</cbc:PriceAmount>
			</cac:Price>
		</cac:InvoiceLine>`,
	CreditNoteLine: `
		<cac:CreditNoteLine>
			<cbc:ID>{invoiceLineId}</cbc:ID>
			<cbc:CreditedQuantity unitCode="XPP">{invoiceLineQuantity}</cbc:CreditedQuantity>
			<cbc:LineExtensionAmount currencyID="EUR">{invoiceLineTotal}</cbc:LineExtensionAmount>
			<cac:InvoicePeriod>
				<cbc:StartDate>{invoiceLineStartDate}</cbc:StartDate>
				<cbc:EndDate>{invoiceLineEndDate}</cbc:EndDate>
			</cac:InvoicePeriod>
			<cac:Item>
				<cbc:Name>{invoiceLineItemName}</cbc:Name>
				<cac:ClassifiedTaxCategory>
					<cbc:ID>{invoiceLineItemVatType}</cbc:ID>
					<cbc:Percent>{invoiceLineItemVatPercent}</cbc:Percent>
					<cac:TaxScheme>
						<cbc:ID>VAT</cbc:ID>
					</cac:TaxScheme>
				</cac:ClassifiedTaxCategory>
			</cac:Item>
			<cac:Price>
				<cbc:PriceAmount currencyID="EUR">{invoiceLineItemPrice}</cbc:PriceAmount>
			</cac:Price>
		</cac:CreditNoteLine>
	`
};

//#endregion
//#region src/common/api/worker/invoicegen/XRechnungInvoiceGenerator.ts
const DE_POSTAL_CODE_REGEX = new RegExp(/\d{5}/);
const CITY_NAME_REGEX = new RegExp(/\d{5}/);
const PaymentMethodTypeCodes = Object.freeze({
	[PaymentMethod.INVOICE]: "31",
	[PaymentMethod.CREDIT_CARD]: "97",
	[PaymentMethod.SEPA_UNUSED]: "59",
	[PaymentMethod.PAYPAL]: "68",
	[PaymentMethod.ACCOUNT_BALANCE]: "97"
});
const VatTypeCategoryCodes = Object.freeze({
	[VatType.NO_VAT]: "E",
	[VatType.ADD_VAT]: "S",
	[VatType.VAT_INCLUDED_SHOWN]: "S",
	[VatType.VAT_INCLUDED_HIDDEN]: "S",
	[VatType.NO_VAT_CHARGE_TUTAO]: "AE"
});
var XRechnungInvoiceGenerator = class {
	languageCode = "en";
	invoiceNumber;
	customerId;
	buyerMailAddress;
	invoice;
	itemIndex = 0;
	discountItems = [];
	totalDiscountSum = -1;
	constructor(invoice, invoiceNumber, customerId, buyerMailAddress) {
		this.invoice = invoice;
		this.invoiceNumber = invoiceNumber;
		this.customerId = customerId;
		this.languageCode = countryUsesGerman(this.invoice.country);
		this.buyerMailAddress = buyerMailAddress;
	}
	/**
	* Generate the XRechnung xml file
	*/
	generate() {
		let stringTemplate = `<?xml version="1.0" encoding="UTF-8"?>\n` + (this.invoice.invoiceType === InvoiceType.INVOICE ? XRechnungUBLTemplate_default.RootInvoice : XRechnungUBLTemplate_default.RootCreditNote);
		stringTemplate = stringTemplate.replace("{slotMain}", XRechnungUBLTemplate_default.Main).replace("{slotInvoiceLines}", this.resolveInvoiceLines()).replace("{invoiceNumber}", this.invoiceNumber).replace("{issueDate}", formatDate(this.invoice.date)).replace("{slotInvoiceType}", this.resolveInvoiceType()).replace("{buyerId}", this.customerId).replace("{slotSeller}", XRechnungUBLTemplate_default.Seller).replace("{slotBuyer}", this.resolveBuyer()).replace("{paymentMeansCode}", PaymentMethodTypeCodes[this.invoice.paymentMethod]).replace("{slotPaymentTerms}", this.resolvePaymentTerms()).replace("{slotAllowanceCharge}", this.resolveAllowanceCharge()).replace("{slotTotalTax}", this.resolveTotalTax()).replace("{slotDocumentTotals}", this.resolveDocumentsTotal()).replaceAll(/^\t\t/gm, "");
		return new TextEncoder().encode(stringTemplate);
	}
	/**
	* Resolves the root of the xml depending on invoice type (billing invoice or credit)
	* @private
	*/
	resolveInvoiceType() {
		if (this.invoice.invoiceType === InvoiceType.INVOICE) return `<cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>`;
		return `<cbc:CreditNoteTypeCode>381</cbc:CreditNoteTypeCode>`;
	}
	/**
	* Resolves placeholders concerning the buyer (customer)
	* buyerMail - Electronic address of the customer
	* buyerStreetName - despite its name, also includes the street number
	* buyerCityName - self-explanatory
	* buyerPostalZone - despite its name, only refers to the postal code, not any associated city
	* buyerCountryCode - self-explanatory
	* buyerName - Legal name / company name of the customer -> The first line of the address field
	* @private
	*/
	resolveBuyer() {
		const addressParts = this.invoice.address.split("\n");
		return XRechnungUBLTemplate_default.Buyer.replace("{buyerMail}", this.buyerMailAddress).replace("{buyerStreetName}", addressParts[1] ?? "STREET NAME UNKNOWN").replace("{buyerCityName}", extractCityName(addressParts[2] ?? "")).replace("{buyerPostalZone}", extractPostalCode(addressParts[2] ?? "")).replace("{buyerCountryCode}", this.invoice.country).replace("{buyerAddressLine}", this.invoice.address.replaceAll("\n", " ")).replace("{slotBuyerVatInfo}", this.resolveBuyerVatInfo()).replace("{buyerName}", addressParts[0] ?? "BUYER NAME UNKNOWN");
	}
	/**
	* Resolves tax info about the buyer (customer). Only resolved if the buyer has a vatIdNumber.
	* buyerVatId - Customer's vatIdNumber
	* @private
	*/
	resolveBuyerVatInfo() {
		if (this.invoice.vatIdNumber != null) return XRechnungUBLTemplate_default.BuyerVatInfo.replace("{buyerVatId}", this.invoice.vatIdNumber);
		return "";
	}
	/**
	* Resolves the payment note, i.e. the instructions for the buyer
	* These are the same texts below the summary table of a PDF invoice
	* @private
	*/
	resolvePaymentNote() {
		let paymentNote = "";
		if (this.invoice.invoiceType === InvoiceType.INVOICE) {
			switch (this.invoice.paymentMethod) {
				case PaymentMethod.INVOICE:
					paymentNote += `${InvoiceTexts_default[this.languageCode].paymentInvoiceDue1} ${InvoiceTexts_default[this.languageCode].paymentInvoiceDue2} ${InvoiceTexts_default[this.languageCode].paymentInvoiceHolder} ${InvoiceTexts_default[this.languageCode].paymentInvoiceBank} ${InvoiceTexts_default[this.languageCode].paymentInvoiceIBAN} ${InvoiceTexts_default[this.languageCode].paymentInvoiceBIC} ${InvoiceTexts_default[this.languageCode].paymentInvoiceProvideNumber1} ${this.invoiceNumber} ${InvoiceTexts_default[this.languageCode].paymentInvoiceProvideNumber2}`;
					break;
				case PaymentMethod.CREDIT_CARD:
					paymentNote += `${InvoiceTexts_default[this.languageCode].paymentCreditCard}`;
					break;
				case PaymentMethod.PAYPAL:
					paymentNote += `${InvoiceTexts_default[this.languageCode].paymentPaypal}`;
					break;
				case PaymentMethod.ACCOUNT_BALANCE:
					paymentNote += `${InvoiceTexts_default[this.languageCode].paymentAccountBalance}`;
					break;
			}
			paymentNote += " " + InvoiceTexts_default[this.languageCode].thankYou;
		}
		return paymentNote;
	}
	/**
	* Resolves the payment terms (supplementary note to customer) if the invoice is a billing invoice
	* @private
	*/
	resolvePaymentTerms() {
		if (this.invoice.invoiceType === InvoiceType.INVOICE) return `
				<cac:PaymentTerms>
					<cbc:Note>${this.resolvePaymentNote()}</cbc:Note>
				</cac:PaymentTerms>
			`;
		return "";
	}
	/**
	* Resolves all information about potential discounts
	* totalDiscount - Inverted sum of all discount invoiceitems
	* vatType - Standardized VAT category code
	* vatPercent - Percentage of the vat applied. I.e. 19% -> vatPercent == 19
	* taxableAmount - Amount that is subject to the tax. Usually this is the entire amount, so the subTotal
	* vatAmount - The amount of the tax. This is equal to "taxableAmount * vatPercent"
	* @private
	*/
	resolveAllowanceCharge() {
		return XRechnungUBLTemplate_default.AllowanceCharge.replace("{totalDiscount}", this.calculateTotalDiscount().toFixed(2)).replace("{vatType}", VatTypeCategoryCodes[this.invoice.vatType]).replace("{vatPercent}", this.invoice.vatRate).replace("{slotTaxExemptionReason}", this.resolveTaxExemptionReason()).replace("{taxableAmount}", this.getVatExcludedPrice(this.invoice.subTotal)).replaceAll("{vatAmount}", this.invoice.vat);
	}
	/**
	* Resolves the total tax slot: summarized information of all applied taxes (vat)
	* vatType - Standardized VAT category code
	* vatPercent - Percentage of the vat applied. I.e. 19% -> vatPercent == 19
	* taxableAmount - Amount that is subject to the tax. Usually this is the entire amount, so the subTotal
	* vatAmount - The amount of the tax. This is equal to "taxableAmount * vatPercent"
	* @private
	*/
	resolveTotalTax() {
		return XRechnungUBLTemplate_default.TaxTotal.replace("{vatType}", VatTypeCategoryCodes[this.invoice.vatType]).replace("{vatPercent}", this.invoice.vatRate).replace("{slotTaxExemptionReason}", this.resolveTaxExemptionReason()).replace("{taxableAmount}", this.getVatExcludedPrice(this.invoice.subTotal)).replaceAll("{vatAmount}", this.invoice.vat);
	}
	/**
	* Resolves the textual reason why taxes are exempt. Only resolved if the vat type is reverse-charge
	* @private
	*/
	resolveTaxExemptionReason() {
		if (this.invoice.vatType === VatType.NO_VAT || this.invoice.vatType === VatType.NO_VAT_CHARGE_TUTAO) return `<cbc:TaxExemptionReason>Umkehrung der Steuerschuldnerschaft</cbc:TaxExemptionReason>`;
		return "";
	}
	/**
	* Resolves the document total slot: summarized information of the pricing
	* sumOfInvoiceLines - The total amount of all invoice items summed up alongside their quantity (amount): subTotal
	* invoiceExclusiveVat - The total amount of the entire invoice without vat: subTotal
	* invoiceInclusiveVat - The total amount of the entire invoice with vat: grandTotal
	* amountDueForPayment - The final amount the buyer is billed with: grandTotal
	* @private
	*/
	resolveDocumentsTotal() {
		return XRechnungUBLTemplate_default.DocumentTotals.replace("{sumOfInvoiceLines}", this.getVatExcludedPrice((parseFloat(this.invoice.subTotal) + this.calculateTotalDiscount()).toFixed(2))).replace("{invoiceExclusiveVat}", this.getVatExcludedPrice(this.invoice.subTotal)).replace("{invoiceInclusiveVat}", this.invoice.grandTotal).replace("{amountDueForPayment}", this.invoice.grandTotal).replace("{totalDiscount}", this.calculateTotalDiscount().toFixed(2));
	}
	/**
	* Resolves all invoice items (invoiceLines) by iterating over every invoice item and resolving a list for it
	* @private
	*/
	resolveInvoiceLines() {
		let invoiceLines = "";
		if (this.invoice.invoiceType === InvoiceType.INVOICE) for (const invoiceItem of this.invoice.items) invoiceLines += this.resolveInvoiceLine(invoiceItem);
else for (const invoiceItem of this.invoice.items) invoiceLines += this.resolveCreditNoteLine(invoiceItem);
		return invoiceLines;
	}
	/**
	* Resolves a singular invoice item (invoiceLine): information about one row in an invoice table
	* invoiceLineQuantity - The amount (quantity) of the item in the invoice line, so the invoiceItem's amount
	* invoiceLineTotal - The total price of the invoice line. This is equal to "itemPrice * quantity" == totalPrice
	* invoiceLineStartDate - self-explanatory
	* invoiceLineEndDate - self-explanatory
	* invoiceLineItemName - self-explanatory
	* invoiceLineItemVatType - Standardized Vat category code for this item. Equal to the vat type of the entire invoice
	* invoiceLineItemVatPercent - Percentage of vat applied to this item. Equal to the vat percentage of the entire invoice
	* invoiceLineItemPrice - Price of the singular item: singlePrice
	* @param invoiceItem
	* @private
	*/
	resolveInvoiceLine(invoiceItem) {
		this.itemIndex++;
		if (parseFloat(invoiceItem.totalPrice) < 0) {
			this.discountItems.push(invoiceItem);
			return "";
		}
		return XRechnungUBLTemplate_default.InvoiceLine.replace("{invoiceLineId}", this.itemIndex.toString()).replace("{invoiceLineQuantity}", invoiceItem.amount).replace("{invoiceLineTotal}", this.getVatExcludedPrice(invoiceItem.totalPrice)).replace("{invoiceLineStartDate}", formatDate(invoiceItem.startDate)).replace("{invoiceLineEndDate}", formatDate(invoiceItem.endDate)).replace("{invoiceLineItemName}", getInvoiceItemTypeName(invoiceItem.itemType, this.languageCode)).replace("{invoiceLineItemVatType}", VatTypeCategoryCodes[this.invoice.vatType]).replace("{invoiceLineItemVatPercent}", this.invoice.vatRate).replace("{invoiceLineItemPrice}", this.getVatExcludedPrice(getInvoiceItemPrice(invoiceItem)));
	}
	/**
	* Same as resolveInvoiceLine but for CreditNotes
	* @param invoiceItem
	* @private
	*/
	resolveCreditNoteLine(invoiceItem) {
		this.itemIndex++;
		return XRechnungUBLTemplate_default.CreditNoteLine.replace("{invoiceLineId}", this.itemIndex.toString()).replace("{invoiceLineQuantity}", invoiceItem.amount).replace("{invoiceLineTotal}", this.getVatExcludedPrice(invoiceItem.totalPrice)).replace("{invoiceLineStartDate}", formatDate(invoiceItem.startDate)).replace("{invoiceLineEndDate}", formatDate(invoiceItem.endDate)).replace("{invoiceLineItemName}", getInvoiceItemTypeName(invoiceItem.itemType, this.languageCode)).replace("{invoiceLineItemVatType}", VatTypeCategoryCodes[this.invoice.vatType]).replace("{invoiceLineItemVatPercent}", this.invoice.vatRate).replace("{invoiceLineItemPrice}", this.getVatExcludedPrice(getInvoiceItemPrice(invoiceItem)));
	}
	/**
	* Calculates the total discount applied to the entire invoice. The discount is a positive number that is to be subtracted from the invoice total
	* The discount is calculated by iterating over every invoiceItem that is of type "discount" and adding it up.
	* @private
	*/
	calculateTotalDiscount() {
		if (this.totalDiscountSum !== -1) return this.totalDiscountSum;
		this.totalDiscountSum = 0;
		for (const discountItem of this.discountItems) this.totalDiscountSum += parseFloat(discountItem.totalPrice);
		this.totalDiscountSum *= -1;
		return this.totalDiscountSum;
	}
	/**
	* Recalculates a price if the vat is already included. I.e. subtracts the applied vat
	* Returns the price with vat excluded
	* @param priceValue
	* @private
	*/
	getVatExcludedPrice(priceValue) {
		switch (this.invoice.vatType) {
			case VatType.VAT_INCLUDED_SHOWN:
			case VatType.VAT_INCLUDED_HIDDEN: {
				const nPriceValue = parseFloat(priceValue);
				const nVat = parseFloat(this.invoice.vat);
				return (nPriceValue - nVat).toFixed(2);
			}
			default: break;
		}
		return priceValue;
	}
};
/**
* Formats a date to be of the pattern "yyyy-mm-dd"
* @param date
*/
function formatDate(date) {
	if (date != null) return date.toISOString().split("T")[0];
	return "No date given.";
}
/**
* Returns the price of an invoice item.
* This is singlePrice if the amount of item is 1 or totalPrice if not.
* @param invoiceItem
*/
function getInvoiceItemPrice(invoiceItem) {
	if (invoiceItem.singlePrice != null) return invoiceItem.singlePrice;
	return invoiceItem.totalPrice;
}
function extractPostalCode(addressLine) {
	const match = addressLine.match(DE_POSTAL_CODE_REGEX);
	if (match && match[0]) return match[0].trim();
	return "Could not extract postal code. Please refer to full address line.";
}
function extractCityName(addressLine) {
	const cityName = addressLine.replace(CITY_NAME_REGEX, "").replace(",", "").trim();
	if (cityName === "") return "Could not extract city name. Please refer to full address line.";
	return cityName;
}

//#endregion
export { XRechnungInvoiceGenerator };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiWFJlY2hudW5nSW52b2ljZUdlbmVyYXRvci1jaHVuay5qcyIsIm5hbWVzIjpbIlBheW1lbnRNZXRob2RUeXBlQ29kZXM6IFJlY29yZDxQYXltZW50TWV0aG9kLCBOdW1iZXJTdHJpbmc+IiwiVmF0VHlwZUNhdGVnb3J5Q29kZXM6IFJlY29yZDxWYXRUeXBlLCBzdHJpbmc+IiwiaW52b2ljZTogSW52b2ljZURhdGFHZXRPdXQiLCJpbnZvaWNlTnVtYmVyOiBzdHJpbmciLCJjdXN0b21lcklkOiBzdHJpbmciLCJidXllck1haWxBZGRyZXNzOiBzdHJpbmciLCJYUmVjaG51bmdVQkxUZW1wbGF0ZSIsIkludm9pY2VUZXh0cyIsImludm9pY2VJdGVtOiBJbnZvaWNlRGF0YUl0ZW0iLCJwcmljZVZhbHVlOiBOdW1iZXJTdHJpbmciLCJkYXRlOiBEYXRlIHwgbnVsbCIsImFkZHJlc3NMaW5lOiBzdHJpbmciXSwic291cmNlcyI6WyIuLi9zcmMvY29tbW9uL2FwaS93b3JrZXIvaW52b2ljZWdlbi9YUmVjaG51bmdVQkxUZW1wbGF0ZS50cyIsIi4uL3NyYy9jb21tb24vYXBpL3dvcmtlci9pbnZvaWNlZ2VuL1hSZWNobnVuZ0ludm9pY2VHZW5lcmF0b3IudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gV0FSTklORzogSWYgeW91IHdvcmsgd2l0aCB0aGlzLCBub3RlIHRoYXQgdGhlIE9SREVSIGluIHdoaWNoIGVsZW1lbnRzIGFwcGVhciBjYW4gc29tZXRpbWVzIG1hdHRlciB0byB0aGUgdmFsaWRhdG9yLiAoSS5lLiBQb3N0YWxBZGRyZXNzIG11c3QgY29tZSBiZWZvcmUgUGFydHlMZWdhbEVudGl0eSlcbi8vIE5PVEU6IERvIG5vdCBhdXRvLWZvcm1hdCB0aGlzIGZpbGUgYXMgaXQgd2lsbCBkZWxldGUgWE1MIHJvb3QgYXR0cmlidXRlIChjYWMsIGNiYyBldGMuKVxuZXhwb3J0IGRlZmF1bHQge1xuXHRSb290SW52b2ljZTogYFxuXHRcdDx1Ymw6SW52b2ljZSB4bWxuczp1Ymw9XCJ1cm46b2FzaXM6bmFtZXM6c3BlY2lmaWNhdGlvbjp1Ymw6c2NoZW1hOnhzZDpJbnZvaWNlLTJcIlxuXHRcdFx0XHRcdCB4bWxuczpjYWM9XCJ1cm46b2FzaXM6bmFtZXM6c3BlY2lmaWNhdGlvbjp1Ymw6c2NoZW1hOnhzZDpDb21tb25BZ2dyZWdhdGVDb21wb25lbnRzLTJcIlxuXHRcdFx0XHRcdCB4bWxuczpjYmM9XCJ1cm46b2FzaXM6bmFtZXM6c3BlY2lmaWNhdGlvbjp1Ymw6c2NoZW1hOnhzZDpDb21tb25CYXNpY0NvbXBvbmVudHMtMlwiPlxuXHRcdFx0PGNiYzpDdXN0b21pemF0aW9uSUQ+dXJuOmNlbi5ldTplbjE2OTMxOjIwMTcjY29tcGxpYW50I3Vybjp4ZWlua2F1Zi5kZTprb3NpdDp4cmVjaG51bmdfMy4wI2NvbmZvcm1hbnQjdXJuOnhlaW5rYXVmLmRlOmtvc2l0OmV4dGVuc2lvbjp4cmVjaG51bmdfMy4wPC9jYmM6Q3VzdG9taXphdGlvbklEPlxuXHRcdFx0e3Nsb3RNYWlufVxuXHRcdDwvdWJsOkludm9pY2U+YCxcblxuXHRSb290Q3JlZGl0Tm90ZTogYFxuXHRcdDx1Ymw6Q3JlZGl0Tm90ZSB4bWxuczp1Ymw9XCJ1cm46b2FzaXM6bmFtZXM6c3BlY2lmaWNhdGlvbjp1Ymw6c2NoZW1hOnhzZDpDcmVkaXROb3RlLTJcIlxuXHRcdFx0XHRcdFx0eG1sbnM6Y2FjPVwidXJuOm9hc2lzOm5hbWVzOnNwZWNpZmljYXRpb246dWJsOnNjaGVtYTp4c2Q6Q29tbW9uQWdncmVnYXRlQ29tcG9uZW50cy0yXCJcblx0XHRcdFx0XHRcdHhtbG5zOmNiYz1cInVybjpvYXNpczpuYW1lczpzcGVjaWZpY2F0aW9uOnVibDpzY2hlbWE6eHNkOkNvbW1vbkJhc2ljQ29tcG9uZW50cy0yXCI+XG5cdFx0XHQ8Y2JjOkN1c3RvbWl6YXRpb25JRD51cm46Y2VuLmV1OmVuMTY5MzE6MjAxNyNjb21wbGlhbnQjdXJuOnhlaW5rYXVmLmRlOmtvc2l0OnhyZWNobnVuZ18zLjA8L2NiYzpDdXN0b21pemF0aW9uSUQ+XG5cdFx0XHR7c2xvdE1haW59XG5cdFx0PC91Ymw6Q3JlZGl0Tm90ZT5gLFxuXG5cdC8vIGxhbmd1YWdlPUhUTUxcblx0TWFpbjogYFxuXHRcdDxjYmM6UHJvZmlsZUlEPnVybjpmZGM6cGVwcG9sLmV1OjIwMTc6cG9hY2M6YmlsbGluZzowMToxLjA8L2NiYzpQcm9maWxlSUQ+XG5cdFx0PGNiYzpJRD57aW52b2ljZU51bWJlcn08L2NiYzpJRD5cblx0XHQ8Y2JjOklzc3VlRGF0ZT57aXNzdWVEYXRlfTwvY2JjOklzc3VlRGF0ZT5cblx0XHR7c2xvdEludm9pY2VUeXBlfVxuXHRcdDxjYmM6RG9jdW1lbnRDdXJyZW5jeUNvZGU+RVVSPC9jYmM6RG9jdW1lbnRDdXJyZW5jeUNvZGU+XG5cdFx0PGNiYzpCdXllclJlZmVyZW5jZT57YnV5ZXJJZH08L2NiYzpCdXllclJlZmVyZW5jZT5cblx0XHR7c2xvdFNlbGxlcn1cblx0XHR7c2xvdEJ1eWVyfVxuXHRcdDxjYWM6UGF5bWVudE1lYW5zPlxuXHRcdFx0PGNiYzpQYXltZW50TWVhbnNDb2RlPntwYXltZW50TWVhbnNDb2RlfTwvY2JjOlBheW1lbnRNZWFuc0NvZGU+XG5cdFx0XHQ8Y2FjOlBheWVlRmluYW5jaWFsQWNjb3VudD5cblx0XHRcdFx0PGNiYzpJRD5ERTY3MjUwODAwMjAwMTM4MDQwMDAxPC9jYmM6SUQ+XG5cdFx0XHRcdDxjYmM6TmFtZT5UdXRhbyBHbWJIPC9jYmM6TmFtZT5cblx0XHRcdFx0PGNhYzpGaW5hbmNpYWxJbnN0aXR1dGlvbkJyYW5jaD5cblx0XHRcdFx0XHQ8Y2JjOklEPkRSRVNERUZGMjUwPC9jYmM6SUQ+XG5cdFx0XHRcdDwvY2FjOkZpbmFuY2lhbEluc3RpdHV0aW9uQnJhbmNoPlxuXHRcdFx0PC9jYWM6UGF5ZWVGaW5hbmNpYWxBY2NvdW50PlxuXHRcdDwvY2FjOlBheW1lbnRNZWFucz5cblx0XHR7c2xvdFBheW1lbnRUZXJtc31cblx0XHR7c2xvdEFsbG93YW5jZUNoYXJnZX1cblx0XHR7c2xvdFRvdGFsVGF4fVxuXHRcdHtzbG90RG9jdW1lbnRUb3RhbHN9XG5cdFx0e3Nsb3RJbnZvaWNlTGluZXN9YCxcblxuXHQvLyBsYW5ndWFnZT1YTUxcblx0U2VsbGVyOiBgXG5cdFx0PGNhYzpBY2NvdW50aW5nU3VwcGxpZXJQYXJ0eT5cblx0XHRcdDxjYWM6UGFydHk+XG5cdFx0XHRcdDxjYmM6RW5kcG9pbnRJRCBzY2hlbWVJRD1cIkVNXCI+c2FsZXNAdHV0YW8uZGU8L2NiYzpFbmRwb2ludElEPlxuXHRcdFx0XHQ8Y2FjOlBhcnR5TmFtZT5cblx0XHRcdFx0XHQ8Y2JjOk5hbWU+VHV0YW8gR21iSDwvY2JjOk5hbWU+XG5cdFx0XHRcdDwvY2FjOlBhcnR5TmFtZT5cblx0XHRcdFx0PGNhYzpQb3N0YWxBZGRyZXNzPlxuXHRcdFx0XHRcdDxjYmM6U3RyZWV0TmFtZT5EZWlzdGVyc3RyYcOfZSAxN2E8L2NiYzpTdHJlZXROYW1lPlxuXHRcdFx0XHRcdDxjYmM6Q2l0eU5hbWU+SGFubm92ZXI8L2NiYzpDaXR5TmFtZT5cblx0XHRcdFx0XHQ8Y2JjOlBvc3RhbFpvbmU+MzA0NDk8L2NiYzpQb3N0YWxab25lPlxuXHRcdFx0XHRcdDxjYWM6Q291bnRyeT5cblx0XHRcdFx0XHRcdDxjYmM6SWRlbnRpZmljYXRpb25Db2RlPkRFPC9jYmM6SWRlbnRpZmljYXRpb25Db2RlPlxuXHRcdFx0XHRcdDwvY2FjOkNvdW50cnk+XG5cdFx0XHRcdDwvY2FjOlBvc3RhbEFkZHJlc3M+XG5cdFx0XHRcdDxjYWM6UGFydHlUYXhTY2hlbWU+XG5cdFx0XHRcdFx0PGNiYzpDb21wYW55SUQ+REUyODA5MDMyNjU8L2NiYzpDb21wYW55SUQ+XG5cdFx0XHRcdFx0PGNhYzpUYXhTY2hlbWU+XG5cdFx0XHRcdFx0XHQ8Y2JjOklEPlZBVDwvY2JjOklEPlxuXHRcdFx0XHRcdDwvY2FjOlRheFNjaGVtZT5cblx0XHRcdFx0PC9jYWM6UGFydHlUYXhTY2hlbWU+XG5cdFx0XHRcdDxjYWM6UGFydHlMZWdhbEVudGl0eT5cblx0XHRcdFx0XHQ8Y2JjOlJlZ2lzdHJhdGlvbk5hbWU+VHV0YW8gR21iSDwvY2JjOlJlZ2lzdHJhdGlvbk5hbWU+XG5cdFx0XHRcdFx0PGNiYzpDb21wYW55SUQ+MjA4MDE0PC9jYmM6Q29tcGFueUlEPlxuXHRcdFx0XHQ8L2NhYzpQYXJ0eUxlZ2FsRW50aXR5PlxuXHRcdFx0XHQ8Y2FjOkNvbnRhY3Q+XG5cdFx0XHRcdFx0PGNiYzpOYW1lPlR1dGFvIEdtYkg8L2NiYzpOYW1lPlxuXHRcdFx0XHRcdDxjYmM6VGVsZXBob25lPis0OSA1MTEyMDI4MDEtMDwvY2JjOlRlbGVwaG9uZT5cblx0XHRcdFx0XHQ8Y2JjOkVsZWN0cm9uaWNNYWlsPnNhbGVzQHR1dGFvLmRlPC9jYmM6RWxlY3Ryb25pY01haWw+XG5cdFx0XHRcdDwvY2FjOkNvbnRhY3Q+XG5cdFx0XHQ8L2NhYzpQYXJ0eT5cblx0XHQ8L2NhYzpBY2NvdW50aW5nU3VwcGxpZXJQYXJ0eT5gLFxuXG5cdC8vIGxhbmd1YWdlPVhNTFxuXHRCdXllcjogYFxuXHRcdDxjYWM6QWNjb3VudGluZ0N1c3RvbWVyUGFydHk+XG5cdFx0XHQ8Y2FjOlBhcnR5PlxuXHRcdFx0XHQ8Y2JjOkVuZHBvaW50SUQgc2NoZW1lSUQ9XCJFTVwiPntidXllck1haWx9PC9jYmM6RW5kcG9pbnRJRD5cblx0XHRcdFx0PGNhYzpQb3N0YWxBZGRyZXNzPlxuXHRcdFx0XHRcdDxjYmM6U3RyZWV0TmFtZT57YnV5ZXJTdHJlZXROYW1lfTwvY2JjOlN0cmVldE5hbWU+XG5cdFx0XHRcdFx0PGNiYzpDaXR5TmFtZT57YnV5ZXJDaXR5TmFtZX08L2NiYzpDaXR5TmFtZT5cblx0XHRcdFx0XHQ8Y2JjOlBvc3RhbFpvbmU+e2J1eWVyUG9zdGFsWm9uZX08L2NiYzpQb3N0YWxab25lPlxuXHRcdFx0XHRcdDxjYWM6QWRkcmVzc0xpbmU+XG5cdFx0XHRcdFx0XHQ8Y2JjOkxpbmU+e2J1eWVyQWRkcmVzc0xpbmV9PC9jYmM6TGluZT5cblx0XHRcdFx0XHQ8L2NhYzpBZGRyZXNzTGluZT5cblx0XHRcdFx0XHQ8Y2FjOkNvdW50cnk+XG5cdFx0XHRcdFx0XHQ8Y2JjOklkZW50aWZpY2F0aW9uQ29kZT57YnV5ZXJDb3VudHJ5Q29kZX08L2NiYzpJZGVudGlmaWNhdGlvbkNvZGU+XG5cdFx0XHRcdFx0PC9jYWM6Q291bnRyeT5cblx0XHRcdFx0PC9jYWM6UG9zdGFsQWRkcmVzcz5cblx0XHRcdFx0e3Nsb3RCdXllclZhdEluZm99XG5cdFx0XHRcdDxjYWM6UGFydHlMZWdhbEVudGl0eT5cblx0XHRcdFx0XHQ8Y2JjOlJlZ2lzdHJhdGlvbk5hbWU+e2J1eWVyTmFtZX08L2NiYzpSZWdpc3RyYXRpb25OYW1lPlxuXHRcdFx0XHQ8L2NhYzpQYXJ0eUxlZ2FsRW50aXR5PlxuXHRcdFx0PC9jYWM6UGFydHk+XG5cdFx0PC9jYWM6QWNjb3VudGluZ0N1c3RvbWVyUGFydHk+YCxcblxuXHQvLyBsYW5ndWFnZT1YTUxcblx0QnV5ZXJWYXRJbmZvOiBgXG5cdFx0PGNhYzpQYXJ0eVRheFNjaGVtZT5cblx0XHRcdDxjYmM6Q29tcGFueUlEPntidXllclZhdElkfTwvY2JjOkNvbXBhbnlJRD5cblx0XHRcdDxjYWM6VGF4U2NoZW1lPlxuXHRcdFx0XHQ8Y2JjOklEPlZBVDwvY2JjOklEPlxuXHRcdFx0PC9jYWM6VGF4U2NoZW1lPlxuXHRcdDwvY2FjOlBhcnR5VGF4U2NoZW1lPmAsXG5cblx0Ly8gbGFuZ3VhZ2U9WE1MXG5cdEFsbG93YW5jZUNoYXJnZTogYFxuXHRcdDxjYWM6QWxsb3dhbmNlQ2hhcmdlPlxuXHRcdFx0PGNiYzpDaGFyZ2VJbmRpY2F0b3I+ZmFsc2U8L2NiYzpDaGFyZ2VJbmRpY2F0b3I+XG5cdFx0XHQ8Y2JjOkFsbG93YW5jZUNoYXJnZVJlYXNvbkNvZGU+OTU8L2NiYzpBbGxvd2FuY2VDaGFyZ2VSZWFzb25Db2RlPlxuXHRcdFx0PGNiYzpBbW91bnQgY3VycmVuY3lJRD1cIkVVUlwiPnt0b3RhbERpc2NvdW50fTwvY2JjOkFtb3VudD5cblx0XHRcdDxjYWM6VGF4Q2F0ZWdvcnk+XG5cdFx0XHRcdDxjYmM6SUQ+e3ZhdFR5cGV9PC9jYmM6SUQ+XG5cdFx0XHRcdDxjYmM6UGVyY2VudD57dmF0UGVyY2VudH08L2NiYzpQZXJjZW50PlxuXHRcdFx0XHR7c2xvdFRheEV4ZW1wdGlvblJlYXNvbn1cblx0XHRcdFx0PGNhYzpUYXhTY2hlbWU+XG5cdFx0XHRcdFx0PGNiYzpJRD5WQVQ8L2NiYzpJRD5cblx0XHRcdFx0PC9jYWM6VGF4U2NoZW1lPlxuXHRcdFx0PC9jYWM6VGF4Q2F0ZWdvcnk+XG5cdFx0PC9jYWM6QWxsb3dhbmNlQ2hhcmdlPlxuXHRgLFxuXG5cdC8vIGxhbmd1YWdlPVhNTFxuXHRUYXhUb3RhbDogYFxuXHRcdDxjYWM6VGF4VG90YWw+XG5cdFx0XHQ8Y2JjOlRheEFtb3VudCBjdXJyZW5jeUlEPVwiRVVSXCI+e3ZhdEFtb3VudH08L2NiYzpUYXhBbW91bnQ+XG5cdFx0XHQ8Y2FjOlRheFN1YnRvdGFsPlxuXHRcdFx0XHQ8Y2JjOlRheGFibGVBbW91bnQgY3VycmVuY3lJRD1cIkVVUlwiPnt0YXhhYmxlQW1vdW50fTwvY2JjOlRheGFibGVBbW91bnQ+XG5cdFx0XHRcdDxjYmM6VGF4QW1vdW50IGN1cnJlbmN5SUQ9XCJFVVJcIj57dmF0QW1vdW50fTwvY2JjOlRheEFtb3VudD5cblx0XHRcdFx0PGNhYzpUYXhDYXRlZ29yeT5cblx0XHRcdFx0XHQ8Y2JjOklEPnt2YXRUeXBlfTwvY2JjOklEPlxuXHRcdFx0XHRcdDxjYmM6UGVyY2VudD57dmF0UGVyY2VudH08L2NiYzpQZXJjZW50PlxuXHRcdFx0XHRcdHtzbG90VGF4RXhlbXB0aW9uUmVhc29ufVxuXHRcdFx0XHRcdDxjYWM6VGF4U2NoZW1lPlxuXHRcdFx0XHRcdFx0PGNiYzpJRD5WQVQ8L2NiYzpJRD5cblx0XHRcdFx0XHQ8L2NhYzpUYXhTY2hlbWU+XG5cdFx0XHRcdDwvY2FjOlRheENhdGVnb3J5PlxuXHRcdFx0PC9jYWM6VGF4U3VidG90YWw+XG5cdFx0PC9jYWM6VGF4VG90YWw+YCxcblxuXHQvLyBsYW5ndWFnZT1YTUxcblx0RG9jdW1lbnRUb3RhbHM6IGBcblx0XHQ8Y2FjOkxlZ2FsTW9uZXRhcnlUb3RhbD5cblx0XHRcdDxjYmM6TGluZUV4dGVuc2lvbkFtb3VudCBjdXJyZW5jeUlEPVwiRVVSXCI+e3N1bU9mSW52b2ljZUxpbmVzfTwvY2JjOkxpbmVFeHRlbnNpb25BbW91bnQ+XG5cdFx0XHQ8Y2JjOlRheEV4Y2x1c2l2ZUFtb3VudCBjdXJyZW5jeUlEPVwiRVVSXCI+e2ludm9pY2VFeGNsdXNpdmVWYXR9PC9jYmM6VGF4RXhjbHVzaXZlQW1vdW50PlxuXHRcdFx0PGNiYzpUYXhJbmNsdXNpdmVBbW91bnQgY3VycmVuY3lJRD1cIkVVUlwiPntpbnZvaWNlSW5jbHVzaXZlVmF0fTwvY2JjOlRheEluY2x1c2l2ZUFtb3VudD5cblx0XHRcdDxjYmM6QWxsb3dhbmNlVG90YWxBbW91bnQgY3VycmVuY3lJRD1cIkVVUlwiPnt0b3RhbERpc2NvdW50fTwvY2JjOkFsbG93YW5jZVRvdGFsQW1vdW50PlxuXHRcdFx0PGNiYzpQYXlhYmxlQW1vdW50IGN1cnJlbmN5SUQ9XCJFVVJcIj57YW1vdW50RHVlRm9yUGF5bWVudH08L2NiYzpQYXlhYmxlQW1vdW50PlxuXHRcdDwvY2FjOkxlZ2FsTW9uZXRhcnlUb3RhbD5gLFxuXG5cdC8vIGxhbmd1YWdlPVhNTFxuXHRJbnZvaWNlTGluZTogYFxuXHRcdDxjYWM6SW52b2ljZUxpbmU+XG5cdFx0XHQ8Y2JjOklEPntpbnZvaWNlTGluZUlkfTwvY2JjOklEPlxuXHRcdFx0PGNiYzpJbnZvaWNlZFF1YW50aXR5IHVuaXRDb2RlPVwiWFBQXCI+e2ludm9pY2VMaW5lUXVhbnRpdHl9PC9jYmM6SW52b2ljZWRRdWFudGl0eT5cblx0XHRcdDxjYmM6TGluZUV4dGVuc2lvbkFtb3VudCBjdXJyZW5jeUlEPVwiRVVSXCI+e2ludm9pY2VMaW5lVG90YWx9PC9jYmM6TGluZUV4dGVuc2lvbkFtb3VudD5cblx0XHRcdDxjYWM6SW52b2ljZVBlcmlvZD5cblx0XHRcdFx0PGNiYzpTdGFydERhdGU+e2ludm9pY2VMaW5lU3RhcnREYXRlfTwvY2JjOlN0YXJ0RGF0ZT5cblx0XHRcdFx0PGNiYzpFbmREYXRlPntpbnZvaWNlTGluZUVuZERhdGV9PC9jYmM6RW5kRGF0ZT5cblx0XHRcdDwvY2FjOkludm9pY2VQZXJpb2Q+XG5cdFx0XHQ8Y2FjOkl0ZW0+XG5cdFx0XHRcdDxjYmM6TmFtZT57aW52b2ljZUxpbmVJdGVtTmFtZX08L2NiYzpOYW1lPlxuXHRcdFx0XHQ8Y2FjOkNsYXNzaWZpZWRUYXhDYXRlZ29yeT5cblx0XHRcdFx0XHQ8Y2JjOklEPntpbnZvaWNlTGluZUl0ZW1WYXRUeXBlfTwvY2JjOklEPlxuXHRcdFx0XHRcdDxjYmM6UGVyY2VudD57aW52b2ljZUxpbmVJdGVtVmF0UGVyY2VudH08L2NiYzpQZXJjZW50PlxuXHRcdFx0XHRcdDxjYWM6VGF4U2NoZW1lPlxuXHRcdFx0XHRcdFx0PGNiYzpJRD5WQVQ8L2NiYzpJRD5cblx0XHRcdFx0XHQ8L2NhYzpUYXhTY2hlbWU+XG5cdFx0XHRcdDwvY2FjOkNsYXNzaWZpZWRUYXhDYXRlZ29yeT5cblx0XHRcdDwvY2FjOkl0ZW0+XG5cdFx0XHQ8Y2FjOlByaWNlPlxuXHRcdFx0XHQ8Y2JjOlByaWNlQW1vdW50IGN1cnJlbmN5SUQ9XCJFVVJcIj57aW52b2ljZUxpbmVJdGVtUHJpY2V9PC9jYmM6UHJpY2VBbW91bnQ+XG5cdFx0XHQ8L2NhYzpQcmljZT5cblx0XHQ8L2NhYzpJbnZvaWNlTGluZT5gLFxuXG5cdC8vIGxhbmd1YWdlPVhNTFxuXHRDcmVkaXROb3RlTGluZTogYFxuXHRcdDxjYWM6Q3JlZGl0Tm90ZUxpbmU+XG5cdFx0XHQ8Y2JjOklEPntpbnZvaWNlTGluZUlkfTwvY2JjOklEPlxuXHRcdFx0PGNiYzpDcmVkaXRlZFF1YW50aXR5IHVuaXRDb2RlPVwiWFBQXCI+e2ludm9pY2VMaW5lUXVhbnRpdHl9PC9jYmM6Q3JlZGl0ZWRRdWFudGl0eT5cblx0XHRcdDxjYmM6TGluZUV4dGVuc2lvbkFtb3VudCBjdXJyZW5jeUlEPVwiRVVSXCI+e2ludm9pY2VMaW5lVG90YWx9PC9jYmM6TGluZUV4dGVuc2lvbkFtb3VudD5cblx0XHRcdDxjYWM6SW52b2ljZVBlcmlvZD5cblx0XHRcdFx0PGNiYzpTdGFydERhdGU+e2ludm9pY2VMaW5lU3RhcnREYXRlfTwvY2JjOlN0YXJ0RGF0ZT5cblx0XHRcdFx0PGNiYzpFbmREYXRlPntpbnZvaWNlTGluZUVuZERhdGV9PC9jYmM6RW5kRGF0ZT5cblx0XHRcdDwvY2FjOkludm9pY2VQZXJpb2Q+XG5cdFx0XHQ8Y2FjOkl0ZW0+XG5cdFx0XHRcdDxjYmM6TmFtZT57aW52b2ljZUxpbmVJdGVtTmFtZX08L2NiYzpOYW1lPlxuXHRcdFx0XHQ8Y2FjOkNsYXNzaWZpZWRUYXhDYXRlZ29yeT5cblx0XHRcdFx0XHQ8Y2JjOklEPntpbnZvaWNlTGluZUl0ZW1WYXRUeXBlfTwvY2JjOklEPlxuXHRcdFx0XHRcdDxjYmM6UGVyY2VudD57aW52b2ljZUxpbmVJdGVtVmF0UGVyY2VudH08L2NiYzpQZXJjZW50PlxuXHRcdFx0XHRcdDxjYWM6VGF4U2NoZW1lPlxuXHRcdFx0XHRcdFx0PGNiYzpJRD5WQVQ8L2NiYzpJRD5cblx0XHRcdFx0XHQ8L2NhYzpUYXhTY2hlbWU+XG5cdFx0XHRcdDwvY2FjOkNsYXNzaWZpZWRUYXhDYXRlZ29yeT5cblx0XHRcdDwvY2FjOkl0ZW0+XG5cdFx0XHQ8Y2FjOlByaWNlPlxuXHRcdFx0XHQ8Y2JjOlByaWNlQW1vdW50IGN1cnJlbmN5SUQ9XCJFVVJcIj57aW52b2ljZUxpbmVJdGVtUHJpY2V9PC9jYmM6UHJpY2VBbW91bnQ+XG5cdFx0XHQ8L2NhYzpQcmljZT5cblx0XHQ8L2NhYzpDcmVkaXROb3RlTGluZT5cblx0YCxcbn1cbiIsImltcG9ydCB7IEludm9pY2VEYXRhR2V0T3V0LCBJbnZvaWNlRGF0YUl0ZW0gfSBmcm9tIFwiLi4vLi4vZW50aXRpZXMvc3lzL1R5cGVSZWZzLmpzXCJcbmltcG9ydCBYUmVjaG51bmdVQkxUZW1wbGF0ZSBmcm9tIFwiLi9YUmVjaG51bmdVQkxUZW1wbGF0ZS5qc1wiXG5pbXBvcnQgSW52b2ljZVRleHRzIGZyb20gXCIuL0ludm9pY2VUZXh0cy5qc1wiXG5pbXBvcnQgeyBjb3VudHJ5VXNlc0dlcm1hbiwgZ2V0SW52b2ljZUl0ZW1UeXBlTmFtZSwgSW52b2ljZVR5cGUsIFBheW1lbnRNZXRob2QsIFZhdFR5cGUgfSBmcm9tIFwiLi9JbnZvaWNlVXRpbHMuanNcIlxuXG5jb25zdCBERV9QT1NUQUxfQ09ERV9SRUdFWCA9IG5ldyBSZWdFeHAoL1xcZHs1fS8pXG5jb25zdCBDSVRZX05BTUVfUkVHRVggPSBuZXcgUmVnRXhwKC9cXGR7NX0vKVxuXG5jb25zdCBQYXltZW50TWV0aG9kVHlwZUNvZGVzOiBSZWNvcmQ8UGF5bWVudE1ldGhvZCwgTnVtYmVyU3RyaW5nPiA9IE9iamVjdC5mcmVlemUoe1xuXHRbUGF5bWVudE1ldGhvZC5JTlZPSUNFXTogXCIzMVwiLFxuXHRbUGF5bWVudE1ldGhvZC5DUkVESVRfQ0FSRF06IFwiOTdcIixcblx0W1BheW1lbnRNZXRob2QuU0VQQV9VTlVTRURdOiBcIjU5XCIsXG5cdFtQYXltZW50TWV0aG9kLlBBWVBBTF06IFwiNjhcIixcblx0W1BheW1lbnRNZXRob2QuQUNDT1VOVF9CQUxBTkNFXTogXCI5N1wiLFxufSlcblxuY29uc3QgVmF0VHlwZUNhdGVnb3J5Q29kZXM6IFJlY29yZDxWYXRUeXBlLCBzdHJpbmc+ID0gT2JqZWN0LmZyZWV6ZSh7XG5cdFtWYXRUeXBlLk5PX1ZBVF06IFwiRVwiLFxuXHRbVmF0VHlwZS5BRERfVkFUXTogXCJTXCIsXG5cdFtWYXRUeXBlLlZBVF9JTkNMVURFRF9TSE9XTl06IFwiU1wiLFxuXHRbVmF0VHlwZS5WQVRfSU5DTFVERURfSElEREVOXTogXCJTXCIsXG5cdFtWYXRUeXBlLk5PX1ZBVF9DSEFSR0VfVFVUQU9dOiBcIkFFXCIsXG59KVxuXG4vKipcbiAqIE9iamVjdCBmb3IgZ2VuZXJhdGluZyBYUmVjaG51bmcgaW52b2ljZXMuXG4gKiBUaGVzZSBhcmUgZWxlY3Ryb25pYyBpbnZvaWNlcyBjb25mb3JtaW5nIHRvIHRoZSBFdXJvcGVhbiBzdGFuZGFyZCBFTjE2OTMxIGFuZCB0aGUgR2VybWFuIENJVVMrRXh0ZW5zaW9uIFhSZWNobnVuZyBzdGFuZGFyZC5cbiAqIFRoZXkgYXJlIGEgbGVnYWwgcmVxdWlyZW1lbnQgYW5kIGFsc28gaW1wcm92ZSB0aGUgYmlsbGluZyBwcm9jZXNzIGZvciBidXNpbmVzcyB1c2Vycy5cbiAqIFRoZSByZXN1bHRpbmcgaW52b2ljZSBpcyBhbiBYTUwgZmlsZSBpbiBVQkwgc3ludGF4LlxuICpcbiAqIFRoaXMgZ2VuZXJhdG9yIGlzIE9OTFkgcmVzcG9uc2libGUgZm9yIHByb2Nlc3NpbmcgdGhlIGRhdGEgaXQgZ2V0cyBhbmQgZm9ybWF0dGluZyBpdCBpbiBhIHdheSB0aGF0IGRvZXMgbm90IGNoYW5nZSBhbnl0aGluZyBhYm91dCBpdC5cbiAqIElmIGFkanVzdG1lbnRzIHRvIHRoZSBkYXRhIG11c3QgYmUgbWFkZSBwcmlvciB0byBnZW5lcmF0aW9uLCB0aGVuIHRoZXNlIHNob3VsZCB0YWtlIHBsYWNlIHdpdGhpbiB0aGUgUmVuZGVySW52b2ljZSBzZXJ2aWNlLlxuICovXG5leHBvcnQgY2xhc3MgWFJlY2hudW5nSW52b2ljZUdlbmVyYXRvciB7XG5cdHByaXZhdGUgcmVhZG9ubHkgbGFuZ3VhZ2VDb2RlOiBcImRlXCIgfCBcImVuXCIgPSBcImVuXCJcblx0cHJpdmF0ZSByZWFkb25seSBpbnZvaWNlTnVtYmVyOiBzdHJpbmdcblx0cHJpdmF0ZSByZWFkb25seSBjdXN0b21lcklkOiBzdHJpbmdcblx0cHJpdmF0ZSByZWFkb25seSBidXllck1haWxBZGRyZXNzOiBzdHJpbmdcblx0cHJpdmF0ZSBpbnZvaWNlOiBJbnZvaWNlRGF0YUdldE91dFxuXHRwcml2YXRlIGl0ZW1JbmRleDogbnVtYmVyID0gMFxuXHRwcml2YXRlIGRpc2NvdW50SXRlbXM6IEludm9pY2VEYXRhSXRlbVtdID0gW11cblx0cHJpdmF0ZSB0b3RhbERpc2NvdW50U3VtOiBudW1iZXIgPSAtMVxuXG5cdGNvbnN0cnVjdG9yKGludm9pY2U6IEludm9pY2VEYXRhR2V0T3V0LCBpbnZvaWNlTnVtYmVyOiBzdHJpbmcsIGN1c3RvbWVySWQ6IHN0cmluZywgYnV5ZXJNYWlsQWRkcmVzczogc3RyaW5nKSB7XG5cdFx0dGhpcy5pbnZvaWNlID0gaW52b2ljZVxuXHRcdHRoaXMuaW52b2ljZU51bWJlciA9IGludm9pY2VOdW1iZXJcblx0XHR0aGlzLmN1c3RvbWVySWQgPSBjdXN0b21lcklkXG5cdFx0dGhpcy5sYW5ndWFnZUNvZGUgPSBjb3VudHJ5VXNlc0dlcm1hbih0aGlzLmludm9pY2UuY291bnRyeSlcblx0XHR0aGlzLmJ1eWVyTWFpbEFkZHJlc3MgPSBidXllck1haWxBZGRyZXNzXG5cdH1cblxuXHQvKipcblx0ICogR2VuZXJhdGUgdGhlIFhSZWNobnVuZyB4bWwgZmlsZVxuXHQgKi9cblx0Z2VuZXJhdGUoKTogVWludDhBcnJheSB7XG5cdFx0bGV0IHN0cmluZ1RlbXBsYXRlID1cblx0XHRcdGA8P3htbCB2ZXJzaW9uPVwiMS4wXCIgZW5jb2Rpbmc9XCJVVEYtOFwiPz5cXG5gICtcblx0XHRcdCh0aGlzLmludm9pY2UuaW52b2ljZVR5cGUgPT09IEludm9pY2VUeXBlLklOVk9JQ0UgPyBYUmVjaG51bmdVQkxUZW1wbGF0ZS5Sb290SW52b2ljZSA6IFhSZWNobnVuZ1VCTFRlbXBsYXRlLlJvb3RDcmVkaXROb3RlKVxuXHRcdHN0cmluZ1RlbXBsYXRlID0gc3RyaW5nVGVtcGxhdGVcblx0XHRcdC5yZXBsYWNlKFwie3Nsb3RNYWlufVwiLCBYUmVjaG51bmdVQkxUZW1wbGF0ZS5NYWluKVxuXHRcdFx0LnJlcGxhY2UoXCJ7c2xvdEludm9pY2VMaW5lc31cIiwgdGhpcy5yZXNvbHZlSW52b2ljZUxpbmVzKCkpIC8vIE11c3QgcnVuIGZpcnN0IHRvIGNhbGN1bGF0ZSBwb3RlbnRpYWwgZGlzY291bnRzXG5cdFx0XHQucmVwbGFjZShcIntpbnZvaWNlTnVtYmVyfVwiLCB0aGlzLmludm9pY2VOdW1iZXIpXG5cdFx0XHQucmVwbGFjZShcIntpc3N1ZURhdGV9XCIsIGZvcm1hdERhdGUodGhpcy5pbnZvaWNlLmRhdGUpKVxuXHRcdFx0LnJlcGxhY2UoXCJ7c2xvdEludm9pY2VUeXBlfVwiLCB0aGlzLnJlc29sdmVJbnZvaWNlVHlwZSgpKVxuXHRcdFx0LnJlcGxhY2UoXCJ7YnV5ZXJJZH1cIiwgdGhpcy5jdXN0b21lcklkKVxuXHRcdFx0LnJlcGxhY2UoXCJ7c2xvdFNlbGxlcn1cIiwgWFJlY2hudW5nVUJMVGVtcGxhdGUuU2VsbGVyKVxuXHRcdFx0LnJlcGxhY2UoXCJ7c2xvdEJ1eWVyfVwiLCB0aGlzLnJlc29sdmVCdXllcigpKVxuXHRcdFx0LnJlcGxhY2UoXCJ7cGF5bWVudE1lYW5zQ29kZX1cIiwgUGF5bWVudE1ldGhvZFR5cGVDb2Rlc1t0aGlzLmludm9pY2UucGF5bWVudE1ldGhvZCBhcyBQYXltZW50TWV0aG9kXSlcblx0XHRcdC5yZXBsYWNlKFwie3Nsb3RQYXltZW50VGVybXN9XCIsIHRoaXMucmVzb2x2ZVBheW1lbnRUZXJtcygpKVxuXHRcdFx0LnJlcGxhY2UoXCJ7c2xvdEFsbG93YW5jZUNoYXJnZX1cIiwgdGhpcy5yZXNvbHZlQWxsb3dhbmNlQ2hhcmdlKCkpXG5cdFx0XHQucmVwbGFjZShcIntzbG90VG90YWxUYXh9XCIsIHRoaXMucmVzb2x2ZVRvdGFsVGF4KCkpXG5cdFx0XHQucmVwbGFjZShcIntzbG90RG9jdW1lbnRUb3RhbHN9XCIsIHRoaXMucmVzb2x2ZURvY3VtZW50c1RvdGFsKCkpXG5cdFx0XHQucmVwbGFjZUFsbCgvXlxcdFxcdC9nbSwgXCJcIilcblx0XHRyZXR1cm4gbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKHN0cmluZ1RlbXBsYXRlKVxuXHR9XG5cblx0LyoqXG5cdCAqIFJlc29sdmVzIHRoZSByb290IG9mIHRoZSB4bWwgZGVwZW5kaW5nIG9uIGludm9pY2UgdHlwZSAoYmlsbGluZyBpbnZvaWNlIG9yIGNyZWRpdClcblx0ICogQHByaXZhdGVcblx0ICovXG5cdHByaXZhdGUgcmVzb2x2ZUludm9pY2VUeXBlKCk6IHN0cmluZyB7XG5cdFx0aWYgKHRoaXMuaW52b2ljZS5pbnZvaWNlVHlwZSA9PT0gSW52b2ljZVR5cGUuSU5WT0lDRSkge1xuXHRcdFx0cmV0dXJuIGA8Y2JjOkludm9pY2VUeXBlQ29kZT4zODA8L2NiYzpJbnZvaWNlVHlwZUNvZGU+YFxuXHRcdH1cblx0XHRyZXR1cm4gYDxjYmM6Q3JlZGl0Tm90ZVR5cGVDb2RlPjM4MTwvY2JjOkNyZWRpdE5vdGVUeXBlQ29kZT5gXG5cdH1cblxuXHQvKipcblx0ICogUmVzb2x2ZXMgcGxhY2Vob2xkZXJzIGNvbmNlcm5pbmcgdGhlIGJ1eWVyIChjdXN0b21lcilcblx0ICogYnV5ZXJNYWlsIC0gRWxlY3Ryb25pYyBhZGRyZXNzIG9mIHRoZSBjdXN0b21lclxuXHQgKiBidXllclN0cmVldE5hbWUgLSBkZXNwaXRlIGl0cyBuYW1lLCBhbHNvIGluY2x1ZGVzIHRoZSBzdHJlZXQgbnVtYmVyXG5cdCAqIGJ1eWVyQ2l0eU5hbWUgLSBzZWxmLWV4cGxhbmF0b3J5XG5cdCAqIGJ1eWVyUG9zdGFsWm9uZSAtIGRlc3BpdGUgaXRzIG5hbWUsIG9ubHkgcmVmZXJzIHRvIHRoZSBwb3N0YWwgY29kZSwgbm90IGFueSBhc3NvY2lhdGVkIGNpdHlcblx0ICogYnV5ZXJDb3VudHJ5Q29kZSAtIHNlbGYtZXhwbGFuYXRvcnlcblx0ICogYnV5ZXJOYW1lIC0gTGVnYWwgbmFtZSAvIGNvbXBhbnkgbmFtZSBvZiB0aGUgY3VzdG9tZXIgLT4gVGhlIGZpcnN0IGxpbmUgb2YgdGhlIGFkZHJlc3MgZmllbGRcblx0ICogQHByaXZhdGVcblx0ICovXG5cdHByaXZhdGUgcmVzb2x2ZUJ1eWVyKCk6IHN0cmluZyB7XG5cdFx0Y29uc3QgYWRkcmVzc1BhcnRzID0gdGhpcy5pbnZvaWNlLmFkZHJlc3Muc3BsaXQoXCJcXG5cIilcblx0XHRyZXR1cm4gWFJlY2hudW5nVUJMVGVtcGxhdGUuQnV5ZXIucmVwbGFjZShcIntidXllck1haWx9XCIsIHRoaXMuYnV5ZXJNYWlsQWRkcmVzcylcblx0XHRcdC5yZXBsYWNlKFwie2J1eWVyU3RyZWV0TmFtZX1cIiwgYWRkcmVzc1BhcnRzWzFdID8/IFwiU1RSRUVUIE5BTUUgVU5LTk9XTlwiKVxuXHRcdFx0LnJlcGxhY2UoXCJ7YnV5ZXJDaXR5TmFtZX1cIiwgZXh0cmFjdENpdHlOYW1lKGFkZHJlc3NQYXJ0c1syXSA/PyBcIlwiKSlcblx0XHRcdC5yZXBsYWNlKFwie2J1eWVyUG9zdGFsWm9uZX1cIiwgZXh0cmFjdFBvc3RhbENvZGUoYWRkcmVzc1BhcnRzWzJdID8/IFwiXCIpKVxuXHRcdFx0LnJlcGxhY2UoXCJ7YnV5ZXJDb3VudHJ5Q29kZX1cIiwgdGhpcy5pbnZvaWNlLmNvdW50cnkpXG5cdFx0XHQucmVwbGFjZShcIntidXllckFkZHJlc3NMaW5lfVwiLCB0aGlzLmludm9pY2UuYWRkcmVzcy5yZXBsYWNlQWxsKFwiXFxuXCIsIFwiIFwiKSlcblx0XHRcdC5yZXBsYWNlKFwie3Nsb3RCdXllclZhdEluZm99XCIsIHRoaXMucmVzb2x2ZUJ1eWVyVmF0SW5mbygpKVxuXHRcdFx0LnJlcGxhY2UoXCJ7YnV5ZXJOYW1lfVwiLCBhZGRyZXNzUGFydHNbMF0gPz8gXCJCVVlFUiBOQU1FIFVOS05PV05cIilcblx0fVxuXG5cdC8qKlxuXHQgKiBSZXNvbHZlcyB0YXggaW5mbyBhYm91dCB0aGUgYnV5ZXIgKGN1c3RvbWVyKS4gT25seSByZXNvbHZlZCBpZiB0aGUgYnV5ZXIgaGFzIGEgdmF0SWROdW1iZXIuXG5cdCAqIGJ1eWVyVmF0SWQgLSBDdXN0b21lcidzIHZhdElkTnVtYmVyXG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRwcml2YXRlIHJlc29sdmVCdXllclZhdEluZm8oKTogc3RyaW5nIHtcblx0XHRpZiAodGhpcy5pbnZvaWNlLnZhdElkTnVtYmVyICE9IG51bGwpIHtcblx0XHRcdHJldHVybiBYUmVjaG51bmdVQkxUZW1wbGF0ZS5CdXllclZhdEluZm8ucmVwbGFjZShcIntidXllclZhdElkfVwiLCB0aGlzLmludm9pY2UudmF0SWROdW1iZXIpXG5cdFx0fVxuXHRcdHJldHVybiBcIlwiXG5cdH1cblxuXHQvKipcblx0ICogUmVzb2x2ZXMgdGhlIHBheW1lbnQgbm90ZSwgaS5lLiB0aGUgaW5zdHJ1Y3Rpb25zIGZvciB0aGUgYnV5ZXJcblx0ICogVGhlc2UgYXJlIHRoZSBzYW1lIHRleHRzIGJlbG93IHRoZSBzdW1tYXJ5IHRhYmxlIG9mIGEgUERGIGludm9pY2Vcblx0ICogQHByaXZhdGVcblx0ICovXG5cdHByaXZhdGUgcmVzb2x2ZVBheW1lbnROb3RlKCk6IHN0cmluZyB7XG5cdFx0bGV0IHBheW1lbnROb3RlID0gXCJcIlxuXHRcdGlmICh0aGlzLmludm9pY2UuaW52b2ljZVR5cGUgPT09IEludm9pY2VUeXBlLklOVk9JQ0UpIHtcblx0XHRcdHN3aXRjaCAodGhpcy5pbnZvaWNlLnBheW1lbnRNZXRob2QpIHtcblx0XHRcdFx0Y2FzZSBQYXltZW50TWV0aG9kLklOVk9JQ0U6XG5cdFx0XHRcdFx0cGF5bWVudE5vdGUgKz0gYCR7SW52b2ljZVRleHRzW3RoaXMubGFuZ3VhZ2VDb2RlXS5wYXltZW50SW52b2ljZUR1ZTF9ICR7SW52b2ljZVRleHRzW3RoaXMubGFuZ3VhZ2VDb2RlXS5wYXltZW50SW52b2ljZUR1ZTJ9ICR7XG5cdFx0XHRcdFx0XHRJbnZvaWNlVGV4dHNbdGhpcy5sYW5ndWFnZUNvZGVdLnBheW1lbnRJbnZvaWNlSG9sZGVyXG5cdFx0XHRcdFx0fSAke0ludm9pY2VUZXh0c1t0aGlzLmxhbmd1YWdlQ29kZV0ucGF5bWVudEludm9pY2VCYW5rfSAke0ludm9pY2VUZXh0c1t0aGlzLmxhbmd1YWdlQ29kZV0ucGF5bWVudEludm9pY2VJQkFOfSAke1xuXHRcdFx0XHRcdFx0SW52b2ljZVRleHRzW3RoaXMubGFuZ3VhZ2VDb2RlXS5wYXltZW50SW52b2ljZUJJQ1xuXHRcdFx0XHRcdH0gJHtJbnZvaWNlVGV4dHNbdGhpcy5sYW5ndWFnZUNvZGVdLnBheW1lbnRJbnZvaWNlUHJvdmlkZU51bWJlcjF9ICR7dGhpcy5pbnZvaWNlTnVtYmVyfSAke1xuXHRcdFx0XHRcdFx0SW52b2ljZVRleHRzW3RoaXMubGFuZ3VhZ2VDb2RlXS5wYXltZW50SW52b2ljZVByb3ZpZGVOdW1iZXIyXG5cdFx0XHRcdFx0fWBcblx0XHRcdFx0XHRicmVha1xuXHRcdFx0XHRjYXNlIFBheW1lbnRNZXRob2QuQ1JFRElUX0NBUkQ6XG5cdFx0XHRcdFx0cGF5bWVudE5vdGUgKz0gYCR7SW52b2ljZVRleHRzW3RoaXMubGFuZ3VhZ2VDb2RlXS5wYXltZW50Q3JlZGl0Q2FyZH1gXG5cdFx0XHRcdFx0YnJlYWtcblx0XHRcdFx0Y2FzZSBQYXltZW50TWV0aG9kLlBBWVBBTDpcblx0XHRcdFx0XHRwYXltZW50Tm90ZSArPSBgJHtJbnZvaWNlVGV4dHNbdGhpcy5sYW5ndWFnZUNvZGVdLnBheW1lbnRQYXlwYWx9YFxuXHRcdFx0XHRcdGJyZWFrXG5cdFx0XHRcdGNhc2UgUGF5bWVudE1ldGhvZC5BQ0NPVU5UX0JBTEFOQ0U6XG5cdFx0XHRcdFx0cGF5bWVudE5vdGUgKz0gYCR7SW52b2ljZVRleHRzW3RoaXMubGFuZ3VhZ2VDb2RlXS5wYXltZW50QWNjb3VudEJhbGFuY2V9YFxuXHRcdFx0XHRcdGJyZWFrXG5cdFx0XHR9XG5cdFx0XHRwYXltZW50Tm90ZSArPSBcIiBcIiArIEludm9pY2VUZXh0c1t0aGlzLmxhbmd1YWdlQ29kZV0udGhhbmtZb3Vcblx0XHR9XG5cdFx0cmV0dXJuIHBheW1lbnROb3RlXG5cdH1cblxuXHQvKipcblx0ICogUmVzb2x2ZXMgdGhlIHBheW1lbnQgdGVybXMgKHN1cHBsZW1lbnRhcnkgbm90ZSB0byBjdXN0b21lcikgaWYgdGhlIGludm9pY2UgaXMgYSBiaWxsaW5nIGludm9pY2Vcblx0ICogQHByaXZhdGVcblx0ICovXG5cdHByaXZhdGUgcmVzb2x2ZVBheW1lbnRUZXJtcygpOiBzdHJpbmcge1xuXHRcdGlmICh0aGlzLmludm9pY2UuaW52b2ljZVR5cGUgPT09IEludm9pY2VUeXBlLklOVk9JQ0UpIHtcblx0XHRcdC8vIGxhbmd1YWdlPUhUTUxcblx0XHRcdHJldHVybiBgXG5cdFx0XHRcdDxjYWM6UGF5bWVudFRlcm1zPlxuXHRcdFx0XHRcdDxjYmM6Tm90ZT4ke3RoaXMucmVzb2x2ZVBheW1lbnROb3RlKCl9PC9jYmM6Tm90ZT5cblx0XHRcdFx0PC9jYWM6UGF5bWVudFRlcm1zPlxuXHRcdFx0YFxuXHRcdH1cblx0XHRyZXR1cm4gXCJcIlxuXHR9XG5cblx0LyoqXG5cdCAqIFJlc29sdmVzIGFsbCBpbmZvcm1hdGlvbiBhYm91dCBwb3RlbnRpYWwgZGlzY291bnRzXG5cdCAqIHRvdGFsRGlzY291bnQgLSBJbnZlcnRlZCBzdW0gb2YgYWxsIGRpc2NvdW50IGludm9pY2VpdGVtc1xuXHQgKiB2YXRUeXBlIC0gU3RhbmRhcmRpemVkIFZBVCBjYXRlZ29yeSBjb2RlXG5cdCAqIHZhdFBlcmNlbnQgLSBQZXJjZW50YWdlIG9mIHRoZSB2YXQgYXBwbGllZC4gSS5lLiAxOSUgLT4gdmF0UGVyY2VudCA9PSAxOVxuXHQgKiB0YXhhYmxlQW1vdW50IC0gQW1vdW50IHRoYXQgaXMgc3ViamVjdCB0byB0aGUgdGF4LiBVc3VhbGx5IHRoaXMgaXMgdGhlIGVudGlyZSBhbW91bnQsIHNvIHRoZSBzdWJUb3RhbFxuXHQgKiB2YXRBbW91bnQgLSBUaGUgYW1vdW50IG9mIHRoZSB0YXguIFRoaXMgaXMgZXF1YWwgdG8gXCJ0YXhhYmxlQW1vdW50ICogdmF0UGVyY2VudFwiXG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRwcml2YXRlIHJlc29sdmVBbGxvd2FuY2VDaGFyZ2UoKTogc3RyaW5nIHtcblx0XHRyZXR1cm4gWFJlY2hudW5nVUJMVGVtcGxhdGUuQWxsb3dhbmNlQ2hhcmdlLnJlcGxhY2UoXCJ7dG90YWxEaXNjb3VudH1cIiwgdGhpcy5jYWxjdWxhdGVUb3RhbERpc2NvdW50KCkudG9GaXhlZCgyKSlcblx0XHRcdC5yZXBsYWNlKFwie3ZhdFR5cGV9XCIsIFZhdFR5cGVDYXRlZ29yeUNvZGVzW3RoaXMuaW52b2ljZS52YXRUeXBlIGFzIFZhdFR5cGVdKVxuXHRcdFx0LnJlcGxhY2UoXCJ7dmF0UGVyY2VudH1cIiwgdGhpcy5pbnZvaWNlLnZhdFJhdGUpXG5cdFx0XHQucmVwbGFjZShcIntzbG90VGF4RXhlbXB0aW9uUmVhc29ufVwiLCB0aGlzLnJlc29sdmVUYXhFeGVtcHRpb25SZWFzb24oKSlcblx0XHRcdC5yZXBsYWNlKFwie3RheGFibGVBbW91bnR9XCIsIHRoaXMuZ2V0VmF0RXhjbHVkZWRQcmljZSh0aGlzLmludm9pY2Uuc3ViVG90YWwpKVxuXHRcdFx0LnJlcGxhY2VBbGwoXCJ7dmF0QW1vdW50fVwiLCB0aGlzLmludm9pY2UudmF0KVxuXHR9XG5cblx0LyoqXG5cdCAqIFJlc29sdmVzIHRoZSB0b3RhbCB0YXggc2xvdDogc3VtbWFyaXplZCBpbmZvcm1hdGlvbiBvZiBhbGwgYXBwbGllZCB0YXhlcyAodmF0KVxuXHQgKiB2YXRUeXBlIC0gU3RhbmRhcmRpemVkIFZBVCBjYXRlZ29yeSBjb2RlXG5cdCAqIHZhdFBlcmNlbnQgLSBQZXJjZW50YWdlIG9mIHRoZSB2YXQgYXBwbGllZC4gSS5lLiAxOSUgLT4gdmF0UGVyY2VudCA9PSAxOVxuXHQgKiB0YXhhYmxlQW1vdW50IC0gQW1vdW50IHRoYXQgaXMgc3ViamVjdCB0byB0aGUgdGF4LiBVc3VhbGx5IHRoaXMgaXMgdGhlIGVudGlyZSBhbW91bnQsIHNvIHRoZSBzdWJUb3RhbFxuXHQgKiB2YXRBbW91bnQgLSBUaGUgYW1vdW50IG9mIHRoZSB0YXguIFRoaXMgaXMgZXF1YWwgdG8gXCJ0YXhhYmxlQW1vdW50ICogdmF0UGVyY2VudFwiXG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRwcml2YXRlIHJlc29sdmVUb3RhbFRheCgpOiBzdHJpbmcge1xuXHRcdHJldHVybiBYUmVjaG51bmdVQkxUZW1wbGF0ZS5UYXhUb3RhbC5yZXBsYWNlKFwie3ZhdFR5cGV9XCIsIFZhdFR5cGVDYXRlZ29yeUNvZGVzW3RoaXMuaW52b2ljZS52YXRUeXBlIGFzIFZhdFR5cGVdKVxuXHRcdFx0LnJlcGxhY2UoXCJ7dmF0UGVyY2VudH1cIiwgdGhpcy5pbnZvaWNlLnZhdFJhdGUpXG5cdFx0XHQucmVwbGFjZShcIntzbG90VGF4RXhlbXB0aW9uUmVhc29ufVwiLCB0aGlzLnJlc29sdmVUYXhFeGVtcHRpb25SZWFzb24oKSlcblx0XHRcdC5yZXBsYWNlKFwie3RheGFibGVBbW91bnR9XCIsIHRoaXMuZ2V0VmF0RXhjbHVkZWRQcmljZSh0aGlzLmludm9pY2Uuc3ViVG90YWwpKVxuXHRcdFx0LnJlcGxhY2VBbGwoXCJ7dmF0QW1vdW50fVwiLCB0aGlzLmludm9pY2UudmF0KVxuXHR9XG5cblx0LyoqXG5cdCAqIFJlc29sdmVzIHRoZSB0ZXh0dWFsIHJlYXNvbiB3aHkgdGF4ZXMgYXJlIGV4ZW1wdC4gT25seSByZXNvbHZlZCBpZiB0aGUgdmF0IHR5cGUgaXMgcmV2ZXJzZS1jaGFyZ2Vcblx0ICogQHByaXZhdGVcblx0ICovXG5cdHByaXZhdGUgcmVzb2x2ZVRheEV4ZW1wdGlvblJlYXNvbigpOiBzdHJpbmcge1xuXHRcdC8vIE5lZWRzIGZpeCBAYXJtLCBAanVnLCBAam9wXG5cdFx0aWYgKHRoaXMuaW52b2ljZS52YXRUeXBlID09PSBWYXRUeXBlLk5PX1ZBVCB8fCB0aGlzLmludm9pY2UudmF0VHlwZSA9PT0gVmF0VHlwZS5OT19WQVRfQ0hBUkdFX1RVVEFPKSB7XG5cdFx0XHRyZXR1cm4gYDxjYmM6VGF4RXhlbXB0aW9uUmVhc29uPlVta2VocnVuZyBkZXIgU3RldWVyc2NodWxkbmVyc2NoYWZ0PC9jYmM6VGF4RXhlbXB0aW9uUmVhc29uPmBcblx0XHR9XG5cdFx0cmV0dXJuIFwiXCJcblx0fVxuXG5cdC8qKlxuXHQgKiBSZXNvbHZlcyB0aGUgZG9jdW1lbnQgdG90YWwgc2xvdDogc3VtbWFyaXplZCBpbmZvcm1hdGlvbiBvZiB0aGUgcHJpY2luZ1xuXHQgKiBzdW1PZkludm9pY2VMaW5lcyAtIFRoZSB0b3RhbCBhbW91bnQgb2YgYWxsIGludm9pY2UgaXRlbXMgc3VtbWVkIHVwIGFsb25nc2lkZSB0aGVpciBxdWFudGl0eSAoYW1vdW50KTogc3ViVG90YWxcblx0ICogaW52b2ljZUV4Y2x1c2l2ZVZhdCAtIFRoZSB0b3RhbCBhbW91bnQgb2YgdGhlIGVudGlyZSBpbnZvaWNlIHdpdGhvdXQgdmF0OiBzdWJUb3RhbFxuXHQgKiBpbnZvaWNlSW5jbHVzaXZlVmF0IC0gVGhlIHRvdGFsIGFtb3VudCBvZiB0aGUgZW50aXJlIGludm9pY2Ugd2l0aCB2YXQ6IGdyYW5kVG90YWxcblx0ICogYW1vdW50RHVlRm9yUGF5bWVudCAtIFRoZSBmaW5hbCBhbW91bnQgdGhlIGJ1eWVyIGlzIGJpbGxlZCB3aXRoOiBncmFuZFRvdGFsXG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRwcml2YXRlIHJlc29sdmVEb2N1bWVudHNUb3RhbCgpOiBzdHJpbmcge1xuXHRcdHJldHVybiBYUmVjaG51bmdVQkxUZW1wbGF0ZS5Eb2N1bWVudFRvdGFscy5yZXBsYWNlKFxuXHRcdFx0XCJ7c3VtT2ZJbnZvaWNlTGluZXN9XCIsXG5cdFx0XHR0aGlzLmdldFZhdEV4Y2x1ZGVkUHJpY2UoKHBhcnNlRmxvYXQodGhpcy5pbnZvaWNlLnN1YlRvdGFsKSArIHRoaXMuY2FsY3VsYXRlVG90YWxEaXNjb3VudCgpKS50b0ZpeGVkKDIpKSxcblx0XHQpXG5cdFx0XHQucmVwbGFjZShcIntpbnZvaWNlRXhjbHVzaXZlVmF0fVwiLCB0aGlzLmdldFZhdEV4Y2x1ZGVkUHJpY2UodGhpcy5pbnZvaWNlLnN1YlRvdGFsKSlcblx0XHRcdC5yZXBsYWNlKFwie2ludm9pY2VJbmNsdXNpdmVWYXR9XCIsIHRoaXMuaW52b2ljZS5ncmFuZFRvdGFsKVxuXHRcdFx0LnJlcGxhY2UoXCJ7YW1vdW50RHVlRm9yUGF5bWVudH1cIiwgdGhpcy5pbnZvaWNlLmdyYW5kVG90YWwpXG5cdFx0XHQucmVwbGFjZShcInt0b3RhbERpc2NvdW50fVwiLCB0aGlzLmNhbGN1bGF0ZVRvdGFsRGlzY291bnQoKS50b0ZpeGVkKDIpKVxuXHR9XG5cblx0LyoqXG5cdCAqIFJlc29sdmVzIGFsbCBpbnZvaWNlIGl0ZW1zIChpbnZvaWNlTGluZXMpIGJ5IGl0ZXJhdGluZyBvdmVyIGV2ZXJ5IGludm9pY2UgaXRlbSBhbmQgcmVzb2x2aW5nIGEgbGlzdCBmb3IgaXRcblx0ICogQHByaXZhdGVcblx0ICovXG5cdHByaXZhdGUgcmVzb2x2ZUludm9pY2VMaW5lcygpOiBzdHJpbmcge1xuXHRcdGxldCBpbnZvaWNlTGluZXMgPSBcIlwiXG5cdFx0aWYgKHRoaXMuaW52b2ljZS5pbnZvaWNlVHlwZSA9PT0gSW52b2ljZVR5cGUuSU5WT0lDRSkge1xuXHRcdFx0Zm9yIChjb25zdCBpbnZvaWNlSXRlbSBvZiB0aGlzLmludm9pY2UuaXRlbXMpIHtcblx0XHRcdFx0aW52b2ljZUxpbmVzICs9IHRoaXMucmVzb2x2ZUludm9pY2VMaW5lKGludm9pY2VJdGVtKVxuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRmb3IgKGNvbnN0IGludm9pY2VJdGVtIG9mIHRoaXMuaW52b2ljZS5pdGVtcykge1xuXHRcdFx0XHRpbnZvaWNlTGluZXMgKz0gdGhpcy5yZXNvbHZlQ3JlZGl0Tm90ZUxpbmUoaW52b2ljZUl0ZW0pXG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBpbnZvaWNlTGluZXNcblx0fVxuXG5cdC8qKlxuXHQgKiBSZXNvbHZlcyBhIHNpbmd1bGFyIGludm9pY2UgaXRlbSAoaW52b2ljZUxpbmUpOiBpbmZvcm1hdGlvbiBhYm91dCBvbmUgcm93IGluIGFuIGludm9pY2UgdGFibGVcblx0ICogaW52b2ljZUxpbmVRdWFudGl0eSAtIFRoZSBhbW91bnQgKHF1YW50aXR5KSBvZiB0aGUgaXRlbSBpbiB0aGUgaW52b2ljZSBsaW5lLCBzbyB0aGUgaW52b2ljZUl0ZW0ncyBhbW91bnRcblx0ICogaW52b2ljZUxpbmVUb3RhbCAtIFRoZSB0b3RhbCBwcmljZSBvZiB0aGUgaW52b2ljZSBsaW5lLiBUaGlzIGlzIGVxdWFsIHRvIFwiaXRlbVByaWNlICogcXVhbnRpdHlcIiA9PSB0b3RhbFByaWNlXG5cdCAqIGludm9pY2VMaW5lU3RhcnREYXRlIC0gc2VsZi1leHBsYW5hdG9yeVxuXHQgKiBpbnZvaWNlTGluZUVuZERhdGUgLSBzZWxmLWV4cGxhbmF0b3J5XG5cdCAqIGludm9pY2VMaW5lSXRlbU5hbWUgLSBzZWxmLWV4cGxhbmF0b3J5XG5cdCAqIGludm9pY2VMaW5lSXRlbVZhdFR5cGUgLSBTdGFuZGFyZGl6ZWQgVmF0IGNhdGVnb3J5IGNvZGUgZm9yIHRoaXMgaXRlbS4gRXF1YWwgdG8gdGhlIHZhdCB0eXBlIG9mIHRoZSBlbnRpcmUgaW52b2ljZVxuXHQgKiBpbnZvaWNlTGluZUl0ZW1WYXRQZXJjZW50IC0gUGVyY2VudGFnZSBvZiB2YXQgYXBwbGllZCB0byB0aGlzIGl0ZW0uIEVxdWFsIHRvIHRoZSB2YXQgcGVyY2VudGFnZSBvZiB0aGUgZW50aXJlIGludm9pY2Vcblx0ICogaW52b2ljZUxpbmVJdGVtUHJpY2UgLSBQcmljZSBvZiB0aGUgc2luZ3VsYXIgaXRlbTogc2luZ2xlUHJpY2Vcblx0ICogQHBhcmFtIGludm9pY2VJdGVtXG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRwcml2YXRlIHJlc29sdmVJbnZvaWNlTGluZShpbnZvaWNlSXRlbTogSW52b2ljZURhdGFJdGVtKTogc3RyaW5nIHtcblx0XHR0aGlzLml0ZW1JbmRleCsrXG5cdFx0Ly8gSWYgdGhlIGludm9pY2UgaGFzIGEgbmVnYXRpdmUgcHJpY2UgaXQgaXMgc29tZSBmb3JtIG9mIGNyZWRpdCBvciBkaXNjb3VudC5cblx0XHQvLyBUaGlzIGlzIG5vdCB0aGUgZGVmaW5pdGlvbiBvZiBhbiBcImludm9pY2UgaXRlbVwiIGluIHRoZSB0cmFkaXRpb25hbCBzZW5zZSwgYW5kIHRoZXJlZm9yZSB3ZSB0cmVhdCBpdCBhcyBhIGRpc2NvdW50IGxhdGVyIGFwcGxpZWQgdG8gdGhlIHdob2xlIGludm9pY2UuXG5cdFx0aWYgKHBhcnNlRmxvYXQoaW52b2ljZUl0ZW0udG90YWxQcmljZSkgPCAwKSB7XG5cdFx0XHR0aGlzLmRpc2NvdW50SXRlbXMucHVzaChpbnZvaWNlSXRlbSlcblx0XHRcdHJldHVybiBcIlwiXG5cdFx0fVxuXHRcdHJldHVybiBYUmVjaG51bmdVQkxUZW1wbGF0ZS5JbnZvaWNlTGluZS5yZXBsYWNlKFwie2ludm9pY2VMaW5lSWR9XCIsIHRoaXMuaXRlbUluZGV4LnRvU3RyaW5nKCkpXG5cdFx0XHQucmVwbGFjZShcIntpbnZvaWNlTGluZVF1YW50aXR5fVwiLCBpbnZvaWNlSXRlbS5hbW91bnQpXG5cdFx0XHQucmVwbGFjZShcIntpbnZvaWNlTGluZVRvdGFsfVwiLCB0aGlzLmdldFZhdEV4Y2x1ZGVkUHJpY2UoaW52b2ljZUl0ZW0udG90YWxQcmljZSkpXG5cdFx0XHQucmVwbGFjZShcIntpbnZvaWNlTGluZVN0YXJ0RGF0ZX1cIiwgZm9ybWF0RGF0ZShpbnZvaWNlSXRlbS5zdGFydERhdGUpKVxuXHRcdFx0LnJlcGxhY2UoXCJ7aW52b2ljZUxpbmVFbmREYXRlfVwiLCBmb3JtYXREYXRlKGludm9pY2VJdGVtLmVuZERhdGUpKVxuXHRcdFx0LnJlcGxhY2UoXCJ7aW52b2ljZUxpbmVJdGVtTmFtZX1cIiwgZ2V0SW52b2ljZUl0ZW1UeXBlTmFtZShpbnZvaWNlSXRlbS5pdGVtVHlwZSwgdGhpcy5sYW5ndWFnZUNvZGUpKVxuXHRcdFx0LnJlcGxhY2UoXCJ7aW52b2ljZUxpbmVJdGVtVmF0VHlwZX1cIiwgVmF0VHlwZUNhdGVnb3J5Q29kZXNbdGhpcy5pbnZvaWNlLnZhdFR5cGUgYXMgVmF0VHlwZV0pXG5cdFx0XHQucmVwbGFjZShcIntpbnZvaWNlTGluZUl0ZW1WYXRQZXJjZW50fVwiLCB0aGlzLmludm9pY2UudmF0UmF0ZSlcblx0XHRcdC5yZXBsYWNlKFwie2ludm9pY2VMaW5lSXRlbVByaWNlfVwiLCB0aGlzLmdldFZhdEV4Y2x1ZGVkUHJpY2UoZ2V0SW52b2ljZUl0ZW1QcmljZShpbnZvaWNlSXRlbSkpKVxuXHR9XG5cblx0LyoqXG5cdCAqIFNhbWUgYXMgcmVzb2x2ZUludm9pY2VMaW5lIGJ1dCBmb3IgQ3JlZGl0Tm90ZXNcblx0ICogQHBhcmFtIGludm9pY2VJdGVtXG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRwcml2YXRlIHJlc29sdmVDcmVkaXROb3RlTGluZShpbnZvaWNlSXRlbTogSW52b2ljZURhdGFJdGVtKTogc3RyaW5nIHtcblx0XHR0aGlzLml0ZW1JbmRleCsrXG5cdFx0cmV0dXJuIFhSZWNobnVuZ1VCTFRlbXBsYXRlLkNyZWRpdE5vdGVMaW5lLnJlcGxhY2UoXCJ7aW52b2ljZUxpbmVJZH1cIiwgdGhpcy5pdGVtSW5kZXgudG9TdHJpbmcoKSlcblx0XHRcdC5yZXBsYWNlKFwie2ludm9pY2VMaW5lUXVhbnRpdHl9XCIsIGludm9pY2VJdGVtLmFtb3VudClcblx0XHRcdC5yZXBsYWNlKFwie2ludm9pY2VMaW5lVG90YWx9XCIsIHRoaXMuZ2V0VmF0RXhjbHVkZWRQcmljZShpbnZvaWNlSXRlbS50b3RhbFByaWNlKSlcblx0XHRcdC5yZXBsYWNlKFwie2ludm9pY2VMaW5lU3RhcnREYXRlfVwiLCBmb3JtYXREYXRlKGludm9pY2VJdGVtLnN0YXJ0RGF0ZSkpXG5cdFx0XHQucmVwbGFjZShcIntpbnZvaWNlTGluZUVuZERhdGV9XCIsIGZvcm1hdERhdGUoaW52b2ljZUl0ZW0uZW5kRGF0ZSkpXG5cdFx0XHQucmVwbGFjZShcIntpbnZvaWNlTGluZUl0ZW1OYW1lfVwiLCBnZXRJbnZvaWNlSXRlbVR5cGVOYW1lKGludm9pY2VJdGVtLml0ZW1UeXBlLCB0aGlzLmxhbmd1YWdlQ29kZSkpXG5cdFx0XHQucmVwbGFjZShcIntpbnZvaWNlTGluZUl0ZW1WYXRUeXBlfVwiLCBWYXRUeXBlQ2F0ZWdvcnlDb2Rlc1t0aGlzLmludm9pY2UudmF0VHlwZSBhcyBWYXRUeXBlXSlcblx0XHRcdC5yZXBsYWNlKFwie2ludm9pY2VMaW5lSXRlbVZhdFBlcmNlbnR9XCIsIHRoaXMuaW52b2ljZS52YXRSYXRlKVxuXHRcdFx0LnJlcGxhY2UoXCJ7aW52b2ljZUxpbmVJdGVtUHJpY2V9XCIsIHRoaXMuZ2V0VmF0RXhjbHVkZWRQcmljZShnZXRJbnZvaWNlSXRlbVByaWNlKGludm9pY2VJdGVtKSkpXG5cdH1cblxuXHQvKipcblx0ICogQ2FsY3VsYXRlcyB0aGUgdG90YWwgZGlzY291bnQgYXBwbGllZCB0byB0aGUgZW50aXJlIGludm9pY2UuIFRoZSBkaXNjb3VudCBpcyBhIHBvc2l0aXZlIG51bWJlciB0aGF0IGlzIHRvIGJlIHN1YnRyYWN0ZWQgZnJvbSB0aGUgaW52b2ljZSB0b3RhbFxuXHQgKiBUaGUgZGlzY291bnQgaXMgY2FsY3VsYXRlZCBieSBpdGVyYXRpbmcgb3ZlciBldmVyeSBpbnZvaWNlSXRlbSB0aGF0IGlzIG9mIHR5cGUgXCJkaXNjb3VudFwiIGFuZCBhZGRpbmcgaXQgdXAuXG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRwcml2YXRlIGNhbGN1bGF0ZVRvdGFsRGlzY291bnQoKTogbnVtYmVyIHtcblx0XHRpZiAodGhpcy50b3RhbERpc2NvdW50U3VtICE9PSAtMSkge1xuXHRcdFx0cmV0dXJuIHRoaXMudG90YWxEaXNjb3VudFN1bVxuXHRcdH1cblx0XHR0aGlzLnRvdGFsRGlzY291bnRTdW0gPSAwXG5cdFx0Zm9yIChjb25zdCBkaXNjb3VudEl0ZW0gb2YgdGhpcy5kaXNjb3VudEl0ZW1zKSB7XG5cdFx0XHR0aGlzLnRvdGFsRGlzY291bnRTdW0gKz0gcGFyc2VGbG9hdChkaXNjb3VudEl0ZW0udG90YWxQcmljZSlcblx0XHR9XG5cdFx0dGhpcy50b3RhbERpc2NvdW50U3VtICo9IC0xXG5cdFx0cmV0dXJuIHRoaXMudG90YWxEaXNjb3VudFN1bVxuXHR9XG5cblx0LyoqXG5cdCAqIFJlY2FsY3VsYXRlcyBhIHByaWNlIGlmIHRoZSB2YXQgaXMgYWxyZWFkeSBpbmNsdWRlZC4gSS5lLiBzdWJ0cmFjdHMgdGhlIGFwcGxpZWQgdmF0XG5cdCAqIFJldHVybnMgdGhlIHByaWNlIHdpdGggdmF0IGV4Y2x1ZGVkXG5cdCAqIEBwYXJhbSBwcmljZVZhbHVlXG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRwcml2YXRlIGdldFZhdEV4Y2x1ZGVkUHJpY2UocHJpY2VWYWx1ZTogTnVtYmVyU3RyaW5nKTogTnVtYmVyU3RyaW5nIHtcblx0XHRzd2l0Y2ggKHRoaXMuaW52b2ljZS52YXRUeXBlKSB7XG5cdFx0XHRjYXNlIFZhdFR5cGUuVkFUX0lOQ0xVREVEX1NIT1dOOlxuXHRcdFx0Y2FzZSBWYXRUeXBlLlZBVF9JTkNMVURFRF9ISURERU46IHtcblx0XHRcdFx0Y29uc3QgblByaWNlVmFsdWUgPSBwYXJzZUZsb2F0KHByaWNlVmFsdWUpXG5cdFx0XHRcdGNvbnN0IG5WYXQgPSBwYXJzZUZsb2F0KHRoaXMuaW52b2ljZS52YXQpXG5cdFx0XHRcdHJldHVybiAoblByaWNlVmFsdWUgLSBuVmF0KS50b0ZpeGVkKDIpXG5cdFx0XHR9XG5cdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRicmVha1xuXHRcdH1cblx0XHRyZXR1cm4gcHJpY2VWYWx1ZVxuXHR9XG59XG5cbi8qKlxuICogRm9ybWF0cyBhIGRhdGUgdG8gYmUgb2YgdGhlIHBhdHRlcm4gXCJ5eXl5LW1tLWRkXCJcbiAqIEBwYXJhbSBkYXRlXG4gKi9cbmZ1bmN0aW9uIGZvcm1hdERhdGUoZGF0ZTogRGF0ZSB8IG51bGwpOiBzdHJpbmcge1xuXHRpZiAoZGF0ZSAhPSBudWxsKSB7XG5cdFx0cmV0dXJuIGRhdGUudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF1cblx0fVxuXHRyZXR1cm4gXCJObyBkYXRlIGdpdmVuLlwiXG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgcHJpY2Ugb2YgYW4gaW52b2ljZSBpdGVtLlxuICogVGhpcyBpcyBzaW5nbGVQcmljZSBpZiB0aGUgYW1vdW50IG9mIGl0ZW0gaXMgMSBvciB0b3RhbFByaWNlIGlmIG5vdC5cbiAqIEBwYXJhbSBpbnZvaWNlSXRlbVxuICovXG5mdW5jdGlvbiBnZXRJbnZvaWNlSXRlbVByaWNlKGludm9pY2VJdGVtOiBJbnZvaWNlRGF0YUl0ZW0pOiBzdHJpbmcge1xuXHRpZiAoaW52b2ljZUl0ZW0uc2luZ2xlUHJpY2UgIT0gbnVsbCkge1xuXHRcdHJldHVybiBpbnZvaWNlSXRlbS5zaW5nbGVQcmljZVxuXHR9XG5cdHJldHVybiBpbnZvaWNlSXRlbS50b3RhbFByaWNlXG59XG5cbi8qKlxuICogTmFpdmVseSB0cmllcyB0byBleHRyYWN0IGEgR2VybWFuIHBvc3RhbCBjb2RlLlxuICogSWYgdGhpcyBleHRyYWN0aW9uIGZhaWxzLCByZXR1cm5zIGEgc3RyaW5nIG5vdGlmeWluZyB0aGUgdXNlciB0byBjb25zdWx0IHRoZWlyIGZ1bGwgYWRkcmVzcyBsaW5lXG4gKiBAcGFyYW0gYWRkcmVzc0xpbmVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RQb3N0YWxDb2RlKGFkZHJlc3NMaW5lOiBzdHJpbmcpOiBzdHJpbmcge1xuXHRjb25zdCBtYXRjaCA9IGFkZHJlc3NMaW5lLm1hdGNoKERFX1BPU1RBTF9DT0RFX1JFR0VYKVxuXHRpZiAobWF0Y2ggJiYgbWF0Y2hbMF0pIHtcblx0XHRyZXR1cm4gbWF0Y2hbMF0udHJpbSgpXG5cdH1cblx0cmV0dXJuIFwiQ291bGQgbm90IGV4dHJhY3QgcG9zdGFsIGNvZGUuIFBsZWFzZSByZWZlciB0byBmdWxsIGFkZHJlc3MgbGluZS5cIlxufVxuXG4vKipcbiAqIE5haXZlbHkgdHJpZXMgdG8gZXh0cmFjdCB0aGUgY2l0eSBuYW1lIGZyb20gdGhlIHRoaXJkIGxpbmUuXG4gKiBJZiB0aGlzIGV4dHJhY3Rpb24gZmFpbHMsIHRoZW4gd2UgYWNjZXB0IHRoYXQgdGhlIGNpdHkgZmllbGQgb2YgdGhlIGN1c3RvbWVyIGlzIGZpbGxlZCBpbmNvcnJlY3RseSBhbmQgbXVzdCBiZSBtYW51YWxseSBjaGFuZ2VkIGJ5IHRoZW1cbiAqIEBwYXJhbSBhZGRyZXNzTGluZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdENpdHlOYW1lKGFkZHJlc3NMaW5lOiBzdHJpbmcpOiBzdHJpbmcge1xuXHRjb25zdCBjaXR5TmFtZSA9IGFkZHJlc3NMaW5lLnJlcGxhY2UoQ0lUWV9OQU1FX1JFR0VYLCBcIlwiKS5yZXBsYWNlKFwiLFwiLCBcIlwiKS50cmltKClcblx0aWYgKGNpdHlOYW1lID09PSBcIlwiKSB7XG5cdFx0cmV0dXJuIFwiQ291bGQgbm90IGV4dHJhY3QgY2l0eSBuYW1lLiBQbGVhc2UgcmVmZXIgdG8gZnVsbCBhZGRyZXNzIGxpbmUuXCJcblx0fVxuXHRyZXR1cm4gY2l0eU5hbWVcbn1cbiJdLCJtYXBwaW5ncyI6Ijs7O21DQUVlO0NBQ2QsY0FBYzs7Ozs7OztDQVFkLGlCQUFpQjs7Ozs7OztDQVNqQixPQUFPOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0EwQlAsU0FBUzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FrQ1QsUUFBUTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBdUJSLGVBQWU7Ozs7Ozs7Q0FTZixrQkFBa0I7Ozs7Ozs7Ozs7Ozs7OztDQWlCbEIsV0FBVzs7Ozs7Ozs7Ozs7Ozs7OztDQWtCWCxpQkFBaUI7Ozs7Ozs7O0NBVWpCLGNBQWM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBeUJkLGlCQUFpQjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBd0JqQjs7OztBQ3pNRCxNQUFNLHVCQUF1QixJQUFJLE9BQU87QUFDeEMsTUFBTSxrQkFBa0IsSUFBSSxPQUFPO0FBRW5DLE1BQU1BLHlCQUE4RCxPQUFPLE9BQU87RUFDaEYsY0FBYyxVQUFVO0VBQ3hCLGNBQWMsY0FBYztFQUM1QixjQUFjLGNBQWM7RUFDNUIsY0FBYyxTQUFTO0VBQ3ZCLGNBQWMsa0JBQWtCO0FBQ2pDLEVBQUM7QUFFRixNQUFNQyx1QkFBZ0QsT0FBTyxPQUFPO0VBQ2xFLFFBQVEsU0FBUztFQUNqQixRQUFRLFVBQVU7RUFDbEIsUUFBUSxxQkFBcUI7RUFDN0IsUUFBUSxzQkFBc0I7RUFDOUIsUUFBUSxzQkFBc0I7QUFDL0IsRUFBQztJQVdXLDRCQUFOLE1BQWdDO0NBQ3RDLEFBQWlCLGVBQTRCO0NBQzdDLEFBQWlCO0NBQ2pCLEFBQWlCO0NBQ2pCLEFBQWlCO0NBQ2pC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
// WARNING: If you work with this, note that the ORDER in which elements appear can sometimes matter to the validator. (I.e. PostalAddress must come before PartyLegalEntity)
// NOTE: Do not auto-format this file as it will delete XML root attribute (cac, cbc etc.)
export default {
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

	// language=HTML
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

	// language=XML
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

	// language=XML
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

	// language=XML
	BuyerVatInfo: `
		<cac:PartyTaxScheme>
			<cbc:CompanyID>{buyerVatId}</cbc:CompanyID>
			<cac:TaxScheme>
				<cbc:ID>VAT</cbc:ID>
			</cac:TaxScheme>
		</cac:PartyTaxScheme>`,

	// language=XML
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

	// language=XML
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

	// language=XML
	DocumentTotals: `
		<cac:LegalMonetaryTotal>
			<cbc:LineExtensionAmount currencyID="EUR">{sumOfInvoiceLines}</cbc:LineExtensionAmount>
			<cbc:TaxExclusiveAmount currencyID="EUR">{invoiceExclusiveVat}</cbc:TaxExclusiveAmount>
			<cbc:TaxInclusiveAmount currencyID="EUR">{invoiceInclusiveVat}</cbc:TaxInclusiveAmount>
			<cbc:AllowanceTotalAmount currencyID="EUR">{totalDiscount}</cbc:AllowanceTotalAmount>
			<cbc:PayableAmount currencyID="EUR">{amountDueForPayment}</cbc:PayableAmount>
		</cac:LegalMonetaryTotal>`,

	// language=XML
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

	// language=XML
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
	`,
}

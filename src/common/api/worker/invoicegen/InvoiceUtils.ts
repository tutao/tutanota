import InvoiceTexts from "./InvoiceTexts.js"

export const enum VatType {
	NO_VAT = "0",
	ADD_VAT = "1",
	VAT_INCLUDED_SHOWN = "2",
	VAT_INCLUDED_HIDDEN = "3",
	NO_VAT_REVERSE_CHARGE = "4",
}

export const enum InvoiceType {
	INVOICE = "0",
	CREDIT = "1",
	REFERRAL_CREDIT = "2",
}

export const enum PaymentMethod {
	INVOICE = "0",
	CREDIT_CARD = "1",
	SEPA_UNUSED = "2",
	PAYPAL = "3",
	ACCOUNT_BALANCE = "4",
}

export const enum InvoiceItemType {
	PREMIUM_USER = "0",
	StarterUser = "1",
	StarterUserPackage = "2",
	StarterUserPackageUpgrade = "3",
	StoragePackage = "4",
	StoragePackageUpgrade = "5",
	EmailAliasPackage = "6",
	EmailAliasPackageUpgrade = "7",
	SharedMailGroup = "8",
	WhitelabelFeature = "9",
	ContactForm_UNUSED = "10",
	WhitelabelChild = "11",
	LocalAdminGroup = "12",
	Discount = "13",
	SharingFeature = "14",
	Credit = "15",
	GiftCard = "16",
	BusinessFeature = "17",
	GiftCardMigration = "18",
	ReferralCredit = "19",
	CancelledReferralCredit = "20",
	RevolutionaryAccount = "21",
	LegendAccount = "22",
	EssentialAccount = "23",
	AdvancedAccount = "24",
	UnlimitedAccount = "25",
}

/**
 * Returns the language code of country as either "en" or "de"
 * "de" is only returned if the country is Germany or Austria
 * @param country
 */
export function countryUsesGerman(country: string): "de" | "en" {
	return country === "DE" || country === "AT" ? "de" : "en"
}

/**
 * Get the name of a given InvoiceItemType
 */
export function getInvoiceItemTypeName(type: NumberString, languageCode: "en" | "de"): string {
	switch (type) {
		case InvoiceItemType.PREMIUM_USER:
			return InvoiceTexts[languageCode].premiumUser
		case InvoiceItemType.StarterUser:
			return InvoiceTexts[languageCode].starterUser
		case InvoiceItemType.StarterUserPackage:
			return InvoiceTexts[languageCode].starterUserPackage
		case InvoiceItemType.StarterUserPackageUpgrade:
			return InvoiceTexts[languageCode].starterUserPackageUpgrade
		case InvoiceItemType.StoragePackage:
			return InvoiceTexts[languageCode].storagePackage
		case InvoiceItemType.StoragePackageUpgrade:
			return InvoiceTexts[languageCode].storagePackageUpgrade
		case InvoiceItemType.EmailAliasPackage:
			return InvoiceTexts[languageCode].emailAliasPackage
		case InvoiceItemType.EmailAliasPackageUpgrade:
			return InvoiceTexts[languageCode].emailAliasPackageUpgrade
		case InvoiceItemType.SharedMailGroup:
			return InvoiceTexts[languageCode].sharedMailGroup
		case InvoiceItemType.WhitelabelFeature:
			return InvoiceTexts[languageCode].whitelabelFeature
		case InvoiceItemType.ContactForm_UNUSED:
			return InvoiceTexts[languageCode].contactFormUnused
		case InvoiceItemType.WhitelabelChild:
			return InvoiceTexts[languageCode].whitelabelChild
		case InvoiceItemType.LocalAdminGroup:
			return InvoiceTexts[languageCode].localAdminGroup
		case InvoiceItemType.Discount:
			return InvoiceTexts[languageCode].discount
		case InvoiceItemType.SharingFeature:
			return InvoiceTexts[languageCode].sharingFeature
		case InvoiceItemType.Credit:
			return InvoiceTexts[languageCode].creditType
		case InvoiceItemType.GiftCard:
			return InvoiceTexts[languageCode].giftCard
		case InvoiceItemType.BusinessFeature:
			return InvoiceTexts[languageCode].businessFeature
		case InvoiceItemType.GiftCardMigration:
			return InvoiceTexts[languageCode].giftCardMigration
		case InvoiceItemType.ReferralCredit:
			return InvoiceTexts[languageCode].referralCredit
		case InvoiceItemType.CancelledReferralCredit:
			return InvoiceTexts[languageCode].cancelledReferralCredit
		case InvoiceItemType.RevolutionaryAccount:
			return InvoiceTexts[languageCode].revolutionaryAccount
		case InvoiceItemType.LegendAccount:
			return InvoiceTexts[languageCode].legendAccount
		case InvoiceItemType.EssentialAccount:
			return InvoiceTexts[languageCode].essentialAccount
		case InvoiceItemType.AdvancedAccount:
			return InvoiceTexts[languageCode].advancedAccount
		case InvoiceItemType.UnlimitedAccount:
			return InvoiceTexts[languageCode].unlimitedAccount
		default:
			throw new Error("Unknown InvoiceItemType " + type)
	}
}

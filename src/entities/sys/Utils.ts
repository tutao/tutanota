import { reverse } from "@tutao/app-env"

export enum GroupType {
	User = "0",
	Admin = "1",
	MailingList = "2",
	Customer = "3",
	External = "4",
	Mail = "5",
	Contact = "6",
	File = "7",
	Deprecated_LocalAdmin = "8",
	Calendar = "9",
	Template = "10",
	ContactList = "11",
}

export const enum ArchiveDataType {
	AuthorityRequests = "0",
	Attachments = "1",
	MailDetails = "2",
	ErrorReports = "3",
	DriveFile = "4",
}

export enum BlobAccessTokenKind {
	Archive = "0",
	Instances = "1",
}

export const SYSTEM_GROUP_MAIL_ADDRESS = "system@tutanota.de"

/**
 * Permission is a kind of a metadata instance. Primarily used for two purposes:
 *  - key sharing
 *  - reference counting in the db
 * */
export const enum PermissionType {
	/** Used in combination with bucket permission to send multiple things encrypted with the same public key. */
	Public = "0",
	/** Used to encrypt an instance for another group (which we are member of). */
	Symmetric = "1",
	/** Used to updating public permission with symmetric key. */
	Public_Symmetric = "2",
	/** Instances without ownerEncSessionKey (e.g. MailBody, FileData) after asymmetric decryption, used for reference counting. */
	Unencrypted = "3",
	/** Sending components of email for external users. */
	External = "5",
	/** Used to mark the owner of the list. */
	Owner_List = "8",
}

export enum AccountType {
	SYSTEM = "0",
	FREE = "1",
	STARTER = "2",
	PAID = "3",
	EXTERNAL = "5",
}

export const AccountTypeNames: Record<AccountType, string> = {
	[AccountType.SYSTEM]: "System",
	[AccountType.FREE]: "Free",
	[AccountType.STARTER]: "Outlook",
	[AccountType.PAID]: "Paid",
	[AccountType.EXTERNAL]: "External",
}

export enum CustomDomainType {
	NONE = "0",
	ONE = "1",
	THREE = "2",
	TEN = "3",
	UNLIMITED = "4",
}

export const CustomDomainTypeCount: Record<CustomDomainType, number> = {
	[CustomDomainType.NONE]: 0,
	[CustomDomainType.ONE]: 1,
	[CustomDomainType.THREE]: 3,
	[CustomDomainType.TEN]: 10,
	[CustomDomainType.UNLIMITED]: -1,
}

export enum PlanType {
	Premium = "0",
	Pro = "2",
	Teams = "3",
	PremiumBusiness = "4",
	TeamsBusiness = "5",
	Revolutionary = "6",
	Legend = "7",
	Essential = "8",
	Advanced = "9",
	Unlimited = "10",
	Free = "11",
}

export type PlanName = keyof typeof PlanType
export type AvailablePlanType = Exclude<PlanType, PlanType.Premium | PlanType.Pro | PlanType.Teams | PlanType.PremiumBusiness | PlanType.TeamsBusiness>
export const AvailablePlans: readonly AvailablePlanType[] = Object.freeze([
	PlanType.Free,
	PlanType.Revolutionary,
	PlanType.Legend,
	PlanType.Essential,
	PlanType.Advanced,
	PlanType.Unlimited,
])
export const NewPaidPlans: readonly AvailablePlanType[] = Object.freeze([
	PlanType.Revolutionary,
	PlanType.Legend,
	PlanType.Essential,
	PlanType.Advanced,
	PlanType.Unlimited,
])
export const NewBusinessPlans: readonly AvailablePlanType[] = Object.freeze([PlanType.Essential, PlanType.Advanced, PlanType.Unlimited])
export const NewPersonalPlans: readonly AvailablePlanType[] = Object.freeze([PlanType.Free, PlanType.Revolutionary, PlanType.Legend])
export const NewPersonalPaidPlans: readonly AvailablePlanType[] = Object.freeze([PlanType.Revolutionary, PlanType.Legend])
export const LegacyPlans: readonly PlanType[] = Object.freeze([
	PlanType.Premium,
	PlanType.PremiumBusiness,
	PlanType.Teams,
	PlanType.TeamsBusiness,
	PlanType.Pro,
])
export const LegacyPrivatePlans: readonly PlanType[] = Object.freeze([PlanType.Premium, PlanType.Teams])
export const LegacyBusinessPlans: readonly PlanType[] = Object.freeze([PlanType.Pro, PlanType.TeamsBusiness, PlanType.PremiumBusiness])
export const HighlightedPlans: readonly AvailablePlanType[] = Object.freeze([PlanType.Revolutionary, PlanType.Advanced])
export const HighestTierPlans: readonly AvailablePlanType[] = Object.freeze([PlanType.Legend, PlanType.Unlimited])

export function isHighestTierPlan(planType: PlanType): boolean {
	return (HighestTierPlans as readonly PlanType[]).includes(planType)
}

export enum SubscriptionType {
	Personal,
	Business,
	PaidPersonal,
}

export enum BookingItemFeatureType {
	LegacyUsers = "0",
	Storage = "1",
	Alias = "2",
	SharedMailGroup = "3",
	Whitelabel = "4",
	ContactForm = "5",
	WhitelabelChild = "6",
	LocalAdminGroup = "7",
	Discount = "8",
	Sharing = "9",
	Business = "10",
	Revolutionary = "11",
	Legend = "12",
	Essential = "13",
	Advanced = "14",
	Unlimited = "15",
}

export enum PaymentMethodType {
	Invoice = "0",
	CreditCard = "1",
	Sepa = "2",
	Paypal = "3",
	AccountBalance = "4",
	AppStore = "5",
}

export const PaymentMethodTypeToName = reverse(PaymentMethodType)
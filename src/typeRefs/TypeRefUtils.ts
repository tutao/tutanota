import * as sysTypeRefs from "./entities/sys/TypeRefs.js"
import * as tutanotaTypeRefs from "./entities/tutanota/TypeRefs.js"
import {
	AccountType,
	ApprovalStatus,
	BookingItemFeatureType,
	CalendarAttendeeStatus,
	CertificateType,
	ClientType,
	Const,
	ContactCustomDateType,
	ContactRelationshipType,
	ContactSocialType,
	CounterType,
	CryptoProtocolVersion,
	FREE_OFFLINE_STORAGE_DEFAULT_TIME_RANGE_DAYS,
	GroupKeyRotationType,
	GroupType,
	isApp,
	isDesktop,
	isIOSApp,
	KdfType,
	MailSetKind,
	Mode,
	PAID_OFFLINE_STORAGE_DEFAULT_TIME_RANGE_DAYS,
	PaymentMethodType,
	PlanName,
	PlanType,
	PublicKeyIdentifierType,
	SpamRuleFieldType,
	SpamRuleType,
	SYSTEM_FOLDERS,
	UpgradePromptType,
	UsageTestMetricType,
	UsageTestParticipationMode,
	UsageTestState,
	WeekStart,
} from "@tutao/appEnv"
import { downcast } from "@tutao/utils"

export const getMailFolderType = (folder: tutanotaTypeRefs.MailSet): MailSetKind => downcast(folder.folderType)

export function isFolder(folder: tutanotaTypeRefs.MailSet): boolean {
	switch (folder.folderType) {
		case MailSetKind.CUSTOM:
		case MailSetKind.INBOX:
		case MailSetKind.SENT:
		case MailSetKind.TRASH:
		case MailSetKind.ARCHIVE:
		case MailSetKind.SPAM:
		case MailSetKind.DRAFT:
		case MailSetKind.SCHEDULED:
			return true
		case MailSetKind.ALL:
		case MailSetKind.LABEL:
		case MailSetKind.IMPORTED:
		default:
			return false
	}
}

/**
 * @return true if {@link mailSet} is a read-only folder (see {@link READ_ONLY_SYSTEM_FOLDERS} for more info)
 */
export function isFolderReadOnly(mailSet: tutanotaTypeRefs.MailSet) {
	return READ_ONLY_SYSTEM_FOLDERS.includes(mailSet.folderType as MailSetKind)
}

export function isPermanentDeleteAllowedForFolder(mailSet: tutanotaTypeRefs.MailSet) {
	return isPermanentDeleteAllowedMailSetKind(mailSet.folderType as MailSetKind)
}

export function isNestableMailSet(mailSet: tutanotaTypeRefs.MailSet): boolean {
	return mailSet.folderType === MailSetKind.CUSTOM
}

export function isVisibleSystemMailSet(mailSet: tutanotaTypeRefs.MailSet): boolean {
	switch (mailSet.folderType) {
		case MailSetKind.INBOX:
		case MailSetKind.SENT:
		case MailSetKind.TRASH:
		case MailSetKind.ARCHIVE:
		case MailSetKind.SPAM:
		case MailSetKind.DRAFT:
		case MailSetKind.SCHEDULED:
			return true
		case MailSetKind.CUSTOM:
		case MailSetKind.ALL:
		case MailSetKind.LABEL:
		case MailSetKind.IMPORTED:
		default:
			return false
	}
}

export function canHaveDescendents(mailSet: tutanotaTypeRefs.MailSet): boolean {
	switch (mailSet.folderType) {
		case MailSetKind.CUSTOM:
		case MailSetKind.INBOX:
		case MailSetKind.DRAFT:
		case MailSetKind.SENT:
		case MailSetKind.ARCHIVE:
			return true
		case MailSetKind.TRASH:
		case MailSetKind.SPAM:
		case MailSetKind.ALL:
		case MailSetKind.LABEL:
		case MailSetKind.IMPORTED:
		case MailSetKind.SCHEDULED:
		default:
			return false
	}
}

export function isEditableMailSet(mailSet: tutanotaTypeRefs.MailSet): boolean {
	switch (mailSet.folderType) {
		case MailSetKind.CUSTOM:
		case MailSetKind.LABEL:
			return true
		case MailSetKind.INBOX:
		case MailSetKind.DRAFT:
		case MailSetKind.SENT:
		case MailSetKind.TRASH:
		case MailSetKind.ARCHIVE:
		case MailSetKind.SPAM:
		case MailSetKind.ALL:
		case MailSetKind.IMPORTED:
		case MailSetKind.SCHEDULED:
		default:
			return false
	}
}

export function isPermanentDeleteAllowedMailSetKind(mailsetKind: MailSetKind) {
	switch (mailsetKind) {
		case MailSetKind.TRASH:
		case MailSetKind.SPAM:
			return true
		case MailSetKind.CUSTOM:
		case MailSetKind.LABEL:
		case MailSetKind.INBOX:
		case MailSetKind.DRAFT:
		case MailSetKind.SENT:
		case MailSetKind.ARCHIVE:
		case MailSetKind.ALL:
		case MailSetKind.IMPORTED:
		case MailSetKind.SCHEDULED:
		default:
			return false
	}
}

export function isTopLevelMailSet(mailSet: tutanotaTypeRefs.MailSet): boolean {
	return mailSet.parentFolder == null
}

export function isLabel(folder: tutanotaTypeRefs.MailSet): boolean {
	return folder.folderType === MailSetKind.LABEL
}

type ObjectPropertyKey = string | number | symbol
export const reverse = <K extends ObjectPropertyKey, V extends ObjectPropertyKey>(objectMap: Record<K, V>): Record<V, K> =>
	Object.keys(objectMap).reduce(
		(r, k) => {
			// @ts-ignore
			const v = objectMap[downcast(k)]
			return Object.assign(r, { [v]: k })
		},
		{} as Record<V, K>,
	)

export const GroupTypeNameByCode = reverse(GroupType)
export const getMembershipGroupType = (membership: sysTypeRefs.GroupMembership): GroupType => downcast(membership.groupType)

export function getMailSetKind(folder: tutanotaTypeRefs.MailSet): MailSetKind {
	return folder.folderType as MailSetKind
}

export const MOVE_SYSTEM_FOLDERS = Object.freeze([
	MailSetKind.INBOX,
	MailSetKind.SENT,
	MailSetKind.TRASH,
	MailSetKind.ARCHIVE,
	MailSetKind.SPAM,
	MailSetKind.DRAFT,
] as const)

/**
 * These are mail sets that are managed by the server and cannot be mutated by the client
 *
 * They have the following restrictions:
 *
 * - Mails cannot be moved in or out of these folders by the client (most other actions are still possible, such as labels and marking read/unread)
 * - Subfolders cannot be created or moved in this folder by the client
 */
export const READ_ONLY_SYSTEM_FOLDERS = Object.freeze([MailSetKind.SCHEDULED])

export type SimpleMoveMailTarget = (typeof SYSTEM_FOLDERS)[number]

export const getContactSocialType = (contactSocialId: tutanotaTypeRefs.ContactSocialId): ContactSocialType => downcast(contactSocialId.type)
export const getCustomDateType = (customDate: tutanotaTypeRefs.ContactCustomDate): ContactCustomDateType => downcast(customDate.type)
export const getRelationshipType = (relationship: tutanotaTypeRefs.ContactRelationship): ContactRelationshipType => downcast(relationship.type)

export const BookingItemFeatureByCode = reverse(BookingItemFeatureType)
export const getPaymentMethodType = (accountingInfo: sysTypeRefs.AccountingInfo): PaymentMethodType => downcast<PaymentMethodType>(accountingInfo.paymentMethod)

export function getDefaultPaymentMethod(): PaymentMethodType {
	if (isIOSApp()) {
		return PaymentMethodType.AppStore
	}

	return PaymentMethodType.CreditCard
}

export const PaymentMethodTypeToName = reverse(PaymentMethodType)

export function getSpamRuleType(spamRule: sysTypeRefs.EmailSenderListElement): SpamRuleType | null {
	return getAsEnumValue(SpamRuleType, spamRule.type)
}

export function getSpamRuleField(spamRule: sysTypeRefs.EmailSenderListElement): SpamRuleFieldType {
	return downcast(spamRule.field)
}

export function getWeekStart(userSettings: tutanotaTypeRefs.UserSettingsGroupRoot): WeekStart {
	return downcast(userSettings.startOfTheWeek)
}

export const CounterTypeToName = reverse(CounterType)

export function getAsEnumValue<K extends keyof any, V>(enumValues: Record<K, V>, value: string): V | null {
	for (const key of Object.getOwnPropertyNames(enumValues)) {
		// @ts-ignore
		const enumValue = enumValues[key]

		if (enumValue === value) {
			return enumValue
		}
	}

	return null
}

export function assertEnumValue<K extends keyof any, V>(enumValues: Record<K, V>, value: string): V {
	for (const key of Object.getOwnPropertyNames(enumValues)) {
		// @ts-ignore
		const enumValue = enumValues[key]

		if (enumValue === value) {
			return enumValue
		}
	}

	throw new Error(`Invalid enum value ${value} for ${JSON.stringify(enumValues)}`)
}

export function assertEnumKey<K extends string, V>(obj: Record<K, V>, key: string): K {
	if (key in obj) {
		return downcast(key)
	} else {
		throw Error("Not valid enum value: " + key)
	}
}

export function getClientType(): ClientType {
	return isApp() ? ClientType.App : isDesktop() || env.mode === Mode.Admin ? ClientType.Desktop : ClientType.Browser
}

export function getOfflineStorageDefaultTimeRangeDays(accountType: AccountType): number {
	return accountType === AccountType.PAID ? PAID_OFFLINE_STORAGE_DEFAULT_TIME_RANGE_DAYS : FREE_OFFLINE_STORAGE_DEFAULT_TIME_RANGE_DAYS
}

export const UsageTestParticipationModeToName = reverse(UsageTestParticipationMode)

/**
 * Convert the input to KdfType.
 *
 * This actually returns the input without modifying it, as it wraps around TypeScript's 'as' operator, but
 * it also does a runtime check, guaranteeing that the input is truly a KdfType.
 *
 * @param maybe kdf type
 * @return `maybe` as KdfType
 * @throws Error if the input doesn't correspond to a KdfType
 */
export function asKdfType(maybe: string): KdfType {
	if (Object.values(KdfType).includes(maybe as KdfType)) {
		return maybe as KdfType
	}
	throw new Error("bad kdf type")
}

export function asCryptoProtoocolVersion(maybe: NumberString): CryptoProtocolVersion {
	if (Object.values(CryptoProtocolVersion).includes(maybe as CryptoProtocolVersion)) {
		return maybe as CryptoProtocolVersion
	}
	throw new Error("bad protocol version")
}

export const GroupKeyRotationTypeNameByCode = reverse(GroupKeyRotationType)

export function asPublicKeyIdentifier(maybe: NumberString): PublicKeyIdentifierType {
	if (Object.values(PublicKeyIdentifierType).includes(maybe as PublicKeyIdentifierType)) {
		return maybe as PublicKeyIdentifierType
	}
	throw new Error("bad key identifier type")
}

export const UsageTestMetricTypeToName = reverse(UsageTestMetricType)

export const UsageTestStateToName = reverse(UsageTestState)

export type PaymentData = {
	paymentMethod: PaymentMethodType
	creditCardData: sysTypeRefs.CreditCard | null
}

export function getAttendeeStatus(attendee: tutanotaTypeRefs.CalendarEventAttendee): CalendarAttendeeStatus {
	return downcast(attendee.status)
}

export function getCertificateType(certificateInfo: sysTypeRefs.CertificateInfo): CertificateType {
	return downcast(certificateInfo.type)
}

/**
 * Gets the current date defined in the global `Const` object for testing purposes.
 * If null, fall back to the given parameter which defaults to `new Date()`
 */
export function getCurrentDate(fallback = new Date()) {
	return Const.CURRENT_DATE ?? fallback
}

export function getCustomerApprovalStatus(customer: sysTypeRefs.Customer): ApprovalStatus {
	return downcast(customer.approvalStatus)
}

export const PlanTypeToName: Record<PlanType, PlanName> = Object.freeze(reverse(PlanType))

export const UpgradePromptTypeByName = Object.freeze(reverse(UpgradePromptType))

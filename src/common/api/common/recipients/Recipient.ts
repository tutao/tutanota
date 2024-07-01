import { Contact } from "../../entities/tutanota/TypeRefs"

export const enum RecipientType {
	UNKNOWN = "unknown",
	INTERNAL = "internal",
	EXTERNAL = "external",
}

export interface Recipient {
	readonly address: string
	readonly name: string
	readonly type: RecipientType
	readonly contact: Contact | null
}

/**
 * A more convenient representation of a recipient,
 * For when you don't have all the recipient data yet
 * Generally should be used as an input, rather than as an output
 */
export interface PartialRecipient {
	address: string
	name?: string | None
	type?: RecipientType | None
	contact?: Contact | IdTuple | None
}

export type RecipientList = Array<PartialRecipient>
/**
 * A collection of recipients
 * When it's a single list, will generally be interpreted as "to" recipients
 */
export type Recipients =
	| {
			to?: RecipientList
			cc?: RecipientList
			bcc?: RecipientList
	  }
	| RecipientList

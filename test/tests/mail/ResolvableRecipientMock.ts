import { ResolvableRecipient, ResolveMode } from "../../../src/common/api/main/RecipientsModel.js"
import { Recipient, RecipientType } from "../../../src/common/api/common/recipients/Recipient.js"
import { LazyLoaded } from "@tutao/tutanota-utils"
import { Contact } from "../../../src/common/api/entities/tutanota/TypeRefs.js"
import { User } from "../../../src/common/api/entities/sys/TypeRefs.js"
import { createNewContact, isTutaMailAddress } from "../../../src/common/mailFunctionality/SharedMailUtils.js"

/**
 * Creating actual ResolvableRecipients is annoying because you have to mock a bunch of stuff in other model classes
 */
export class ResolvableRecipientMock implements ResolvableRecipient {
	public name: string
	public type: RecipientType

	private _resolved = false
	private lazyResolve = new LazyLoaded<Recipient>(async () => {
		this._resolved = true
		this.type =
			this.type !== RecipientType.UNKNOWN ? this.type : this.internalAddresses.includes(this.address) ? RecipientType.INTERNAL : RecipientType.EXTERNAL
		this.contact =
			this.contact ??
			this.existingContacts.find(({ mailAddresses }) => mailAddresses.some(({ address }) => address === this.address)) ??
			createNewContact(this.user, this.address, this.name)

		return {
			address: this.address,
			name: this.name,
			contact: this.contact,
			type: this.type,
		}
	})

	constructor(
		public address: string,
		name: string | null,
		public contact: Contact | null,
		type: RecipientType | null,
		/** non-tutanota addresses that should resolve to be INTERNAL */
		private internalAddresses: string[],
		/** contacts that should be resolved as though they were found by the contact model */
		private existingContacts: Contact[],
		resolveMode: ResolveMode,
		private user: User,
	) {
		this.name = name ?? ""
		this.type = type ?? (isTutaMailAddress(address) ? RecipientType.INTERNAL : RecipientType.UNKNOWN)

		if (resolveMode === ResolveMode.Eager) {
			this.lazyResolve.getAsync()
		}
	}

	isResolved(): boolean {
		return this._resolved
	}

	resolved(): Promise<Recipient> {
		return this.lazyResolve.getAsync()
	}

	setContact(contact: Contact): void {
		this.contact = contact
	}

	setName(name: string): void {
		this.name = name
	}

	whenResolved(onResolved: (resolvedRecipient: Recipient) => void): this {
		throw new Error("STUB")
	}
}

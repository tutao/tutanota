import type { ContactModel } from "../../contactsFunctionality/ContactModel.js"
import type { LoginController } from "./LoginController.js"
import type { MailFacade } from "../worker/facades/lazy/MailFacade.js"
import type { EntityClient } from "../common/EntityClient.js"
import { getContactDisplayName } from "../../contactsFunctionality/ContactUtils.js"
import { PartialRecipient, Recipient, RecipientType } from "../common/recipients/Recipient.js"
import { BoundedExecutor, LazyLoaded } from "@tutao/tutanota-utils"
import { Contact, ContactTypeRef } from "../entities/tutanota/TypeRefs"
import { cleanMailAddress } from "../common/utils/CommonCalendarUtils.js"
import { createNewContact, isTutaMailAddress } from "../../mailFunctionality/SharedMailUtils.js"

/**
 * A recipient that can be resolved to obtain contact and recipient type
 * It is defined as an interface, because it should only be created using RecipientsModel.resolve
 * rather than directly constructing one
 */
export interface ResolvableRecipient extends Recipient {
	/** get the resolved value of the recipient, when it's ready */
	resolved(): Promise<Recipient>

	/** check if resolution is complete */
	isResolved(): boolean

	/** provide a handler to run when resolution is done, handy for chaining */
	whenResolved(onResolved: (resolvedRecipient: Recipient) => void): this

	/** update the contact. will override whatever contact gets resolved */
	setContact(contact: Contact): void

	/** update the name. will override whatever the name has resolved to */
	setName(name: string): void
}

export enum ResolveMode {
	Lazy,
	Eager,
}

export class RecipientsModel {
	private executor = new BoundedExecutor(5)

	constructor(
		private readonly contactModel: ContactModel,
		private readonly loginController: LoginController,
		private readonly mailFacade: MailFacade,
		private readonly entityClient: EntityClient,
	) {}

	/**
	 * Start resolving a recipient
	 * If resolveLazily === true, Then resolution will not be initiated (i.e. no server calls will be made) until the first call to `resolved`
	 */
	resolve(recipient: PartialRecipient, resolveMode: ResolveMode): ResolvableRecipient {
		return new ResolvableRecipientImpl(
			recipient,
			this.contactModel,
			this.loginController,
			(mailAddress) => this.executor.run(this.resolveRecipientType(mailAddress)),
			this.entityClient,
			resolveMode,
		)
	}

	private readonly resolveRecipientType = (mailAddress: string) => async () => {
		const keyData = await this.mailFacade.getRecipientKeyData(mailAddress)
		return keyData == null ? RecipientType.EXTERNAL : RecipientType.INTERNAL
	}
}

class ResolvableRecipientImpl implements ResolvableRecipient {
	private _address: string
	private _name: string | null
	private readonly lazyType: LazyLoaded<RecipientType>
	private readonly lazyContact: LazyLoaded<Contact | null>

	private readonly initialType: RecipientType = RecipientType.UNKNOWN
	private readonly initialContact: Contact | null = null

	private overrideContact: Contact | null = null

	get address(): string {
		return this._address
	}

	get name(): string {
		return this._name ?? ""
	}

	get type(): RecipientType {
		return this.lazyType.getSync() ?? this.initialType
	}

	get contact(): Contact | null {
		return this.lazyContact.getSync() ?? this.initialContact
	}

	constructor(
		arg: PartialRecipient,
		private readonly contactModel: ContactModel,
		private readonly loginController: LoginController,
		private readonly typeResolver: (mailAddress: string) => Promise<RecipientType>,
		private readonly entityClient: EntityClient,
		resolveMode: ResolveMode,
	) {
		if (isTutaMailAddress(arg.address) || arg.type === RecipientType.INTERNAL) {
			this.initialType = RecipientType.INTERNAL
			this._address = cleanMailAddress(arg.address)
		} else if (arg.type) {
			this.initialType = arg.type
			this._address = arg.address
		} else {
			this._address = arg.address
		}

		this._name = arg.name ?? null

		if (!(arg.contact instanceof Array)) {
			this.initialContact = arg.contact ?? null
		}

		this.lazyType = new LazyLoaded(() => this.resolveType())
		this.lazyContact = new LazyLoaded(async () => {
			const contact = await this.resolveContact(arg.contact)
			// sometimes we create resolvable contact and then dissect it into parts and resolve it again in which case we will default to an empty name
			// (see the getter) but we actually want the name from contact.
			if (contact != null && (this._name == null || this._name === "")) {
				this._name = getContactDisplayName(contact)
			}
			return contact
		})

		if (resolveMode === ResolveMode.Eager) {
			this.lazyType.load()
			this.lazyContact.load()
		}
	}

	setName(newName: string) {
		this._name = newName
	}

	setContact(newContact: Contact) {
		this.overrideContact = newContact
		this.lazyContact.reload()
	}

	async resolved(): Promise<Recipient> {
		await Promise.all([this.lazyType.getAsync(), this.lazyContact.getAsync()])
		return {
			address: this.address,
			name: this.name,
			type: this.type,
			contact: this.contact,
		}
	}

	isResolved(): boolean {
		// We are only resolved when both type and contact are non-null and finished
		return this.lazyType.isLoaded() && this.lazyContact.isLoaded()
	}

	whenResolved(handler: (resolvedRecipient: Recipient) => void): this {
		this.resolved().then(handler)
		return this
	}

	/**
	 * Determine whether recipient is INTERNAL or EXTERNAL based on the existence of key data (external recipients don't have any)
	 */
	private async resolveType(): Promise<RecipientType> {
		if (this.initialType === RecipientType.UNKNOWN) {
			const cleanedAddress = cleanMailAddress(this.address)
			const recipientType = await this.typeResolver(cleanedAddress)
			if (recipientType === RecipientType.INTERNAL) {
				// we know this is one of ours, so it's safe to clean it up
				this._address = cleanedAddress
			}
			return recipientType
		} else {
			return this.initialType
		}
	}

	/**
	 * Resolve the recipients contact.
	 * If {@param contact} is an Id, the contact will be loaded directly
	 * Otherwise, the contact will be searched for in the ContactModel
	 */
	private async resolveContact(contact: Contact | IdTuple | None): Promise<Contact | null> {
		try {
			if (this.overrideContact) {
				return this.overrideContact
			} else if ((await this.contactModel.getContactListId()) == null) {
				console.log("can't resolve contacts for users with no contact list id")
				return null
			} else if (contact instanceof Array) {
				return await this.entityClient.load(ContactTypeRef, contact)
			} else if (contact == null) {
				const foundContact = await this.contactModel.searchForContact(this.address)
				if (foundContact) {
					return foundContact
				} else {
					// we don't want to create a mixed-case contact if the address is an internal one.
					// after lazyType is loaded, if it resolves to RecipientType.INTERNAL, we have the
					// cleaned address in this.address.
					await this.lazyType
					return createNewContact(this.loginController.getUserController().user, this.address, this.name)
				}
			} else {
				return contact
			}
		} catch (e) {
			console.log("error resolving contact", e)
			return null
		}
	}
}

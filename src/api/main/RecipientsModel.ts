import type {ContactModel} from "../../contacts/model/ContactModel.js";
import type {LoginController} from "./LoginController.js";
import type {MailFacade} from "../worker/facades/MailFacade.js";
import type {EntityClient} from "../common/EntityClient.js";
import {createNewContact, isTutanotaMailAddress} from "../../mail/model/MailUtils.js";
import {getContactDisplayName} from "../../contacts/model/ContactUtils.js";
import {PartialRecipient, Recipient, RecipientType} from "../common/recipients/Recipient.js";
import {LazyLoaded} from "@tutao/tutanota-utils"
import {Contact, ContactTypeRef} from "../entities/tutanota/TypeRefs"

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
	Eager
}

export class RecipientsModel {
	constructor(
		private readonly contactModel: ContactModel,
		private readonly loginController: LoginController,
		private readonly mailFacade: MailFacade,
		private readonly entityClient: EntityClient,
	) {
	}

	/**
	 * Start resolving a recipient
	 * If resolveLazily === true, Then resolution will not be initiated (i.e. no server calls will be made) until the first call to `resolved`
	 */
	resolve(recipient: PartialRecipient, resolveMode: ResolveMode): ResolvableRecipient {
		return new ResolvableRecipientImpl(
			recipient,
			this.contactModel,
			this.loginController,
			this.mailFacade,
			this.entityClient,
			resolveMode
		)
	}
}

class ResolvableRecipientImpl implements ResolvableRecipient {
	public readonly address: string
	private _name: string | null
	private readonly lazyType: LazyLoaded<RecipientType>
	private readonly lazyContact: LazyLoaded<Contact | null>

	private readonly initialType: RecipientType = RecipientType.UNKNOWN
	private readonly initialContact: Contact | null = null

	private overrideContact: Contact | null = null

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
		private readonly mailFacade: MailFacade,
		private readonly entityClient: EntityClient,
		resolveMode: ResolveMode
	) {
		this.address = arg.address
		this._name = arg.name ?? null

		if (!(arg.contact instanceof Array)) {
			this.initialContact = arg.contact ?? null
		}

		if (isTutanotaMailAddress(this.address)) {
			this.initialType = RecipientType.INTERNAL
		} else if (arg.type) {
			this.initialType = arg.type
		}

		this.lazyType = new LazyLoaded(() => this.resolveType())
		this.lazyContact = new LazyLoaded(
			async () => {
				const contact = await this.resolveContact(arg.contact)
				if (contact != null && this._name == null) {
					this._name = getContactDisplayName(contact)
				}
				return contact
			}
		)

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
			const keyData = await this.mailFacade.getRecipientKeyData(this.address)
			return keyData == null ? RecipientType.EXTERNAL : RecipientType.INTERNAL
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
			} else if (contact instanceof Array) {
				return await this.entityClient.load(ContactTypeRef, contact)
			} else if (contact == null) {
				return await this.contactModel.searchForContact(this.address)
					?? createNewContact(this.loginController.getUserController().user, this.address, this.name)
			} else {
				return contact
			}
		} catch (e) {
			console.log("error resolving contact", e)
			return null
		}
	}
}

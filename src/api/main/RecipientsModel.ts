import {Contact, ContactTypeRef} from "../entities/tutanota/Contact.js";
import type {ContactModel} from "../../contacts/model/ContactModel.js";
import type {LoginController} from "./LoginController.js";
import type {MailFacade} from "../worker/facades/MailFacade.js";
import type {EntityClient} from "../common/EntityClient.js";
import {createNewContact, isTutanotaMailAddress} from "../../mail/model/MailUtils.js";
import {getContactDisplayName} from "../../contacts/model/ContactUtils.js";
import {PartialRecipient, Recipient, RecipientType} from "../common/recipients/Recipient.js";
import {LazyLoaded} from "@tutao/tutanota-utils"

/**
 * A recipient that can be resolved to obtain contact and recipient type
 */
export interface ResolvableRecipient extends Recipient {
	resolved(): Promise<Recipient>

	isResolved(): boolean

	setContact(contact: Contact): void

	setName(name: string): void
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
	resolve(parameters: PartialRecipient & {resolveLazily?: boolean}): ResolvableRecipient {
		return new ResolvableRecipientImpl(
			parameters,
			this.contactModel,
			this.loginController,
			this.mailFacade,
			this.entityClient,
			parameters.resolveLazily ?? false
		)
	}
}

class ResolvableRecipientImpl implements ResolvableRecipient {
	public readonly address: string
	private _name: string | null
	private readonly _type: LazyLoaded<RecipientType>
	private readonly _contact: LazyLoaded<Contact | null>
	private overrideContact: Contact | null = null

	get name(): string {
		return this._name ?? ""
	}

	get type(): RecipientType {
		return this._type.getSync() ?? RecipientType.UNKNOWN
	}

	get contact(): Contact | null {
		return this._contact.getSync()
	}

	constructor(
		arg: PartialRecipient,
		private readonly contactModel: ContactModel,
		private readonly loginController: LoginController,
		private readonly mailFacade: MailFacade,
		private readonly entityClient: EntityClient,
		resolveLazily: boolean = false
	) {
		this.address = arg.address
		this._name = arg.name ?? null
		this._type = new LazyLoaded(() => this.resolveType(arg.type))
		this._contact = new LazyLoaded(
			async () => {
				const contact = await this.resolveContact(arg.contact)
				if (contact != null && this._name == null) {
					this._name = getContactDisplayName(contact)
				}
				return contact
			}
		)

		if (!resolveLazily) {
			this._type.load()
			this._contact.load()
		}
	}

	setName(newName: string) {
		this._name = newName
	}

	setContact(newContact: Contact) {
		this.overrideContact = newContact
		this._contact.reload()
	}

	async resolved(): Promise<Recipient> {

		await Promise.all([this._type.getAsync(), this._contact.getAsync()])

		return {
			address: this.address,
			name: this.name,
			type: this.type,
			contact: this.contact,
		}
	}

	isResolved(): boolean {
		// We are only resolved when both type and contact are non-null and finished
		return this._type.isLoaded() && this._contact.isLoaded()
	}

	/**
	 * Determine whether recipient is INTERNAL or EXTERNAL based on the existence of key data (external recipients don't have any)
	 */
	private async resolveType(type: RecipientType | None): Promise<RecipientType> {

		if (isTutanotaMailAddress(this.address)) {
			return RecipientType.INTERNAL
		}

		if (type && type !== RecipientType.UNKNOWN) {
			return type
		}

		const keyData = await this.mailFacade.getRecipientKeyData(this.address)
		return keyData == null ? RecipientType.EXTERNAL : RecipientType.INTERNAL
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

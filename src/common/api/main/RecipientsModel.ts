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
import { EncryptionKeyVerificationState, PresentableKeyVerificationState } from "../common/TutanotaConstants.js"
import { KeyVerificationMismatchError } from "../common/error/KeyVerificationMismatchError"
import { ProgrammingError } from "../common/error/ProgrammingError"
import { VerifiedPublicEncryptionKey } from "../worker/facades/lazy/KeyVerificationFacade"

/**
 * A recipient that can be resolved to obtain contact and recipient type
 * It is defined as an interface, because it should only be created using RecipientsModel.resolve
 * rather than directly constructing one
 */
export interface ResolvableRecipient extends Recipient {
	/** get the resolved value of the recipient, when it's ready */
	resolve(): Promise<Recipient>

	/** check if resolution is complete */
	isResolved(): boolean

	/** provide a handler to run when resolution is done, handy for chaining */
	whenResolved(onResolved: (resolvedRecipient: Recipient) => void): this

	/** update the contact. will override whatever contact gets resolved */
	setContact(contact: Contact): void

	/** update the name. will override whatever the name has resolved to */
	setName(name: string): void

	markAsKeyVerificationMismatch(): Promise<void>

	reset(): void
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
	 * Resolve a recipient
	 */
	initialize(recipient: PartialRecipient): ResolvableRecipient {
		return new ResolvableRecipientImpl(
			recipient,
			this.contactModel,
			this.loginController,
			(mailAddress) => this.executor.run(this.resolveRecipientType(mailAddress)),
			this.entityClient,
		)
	}

	private readonly resolveRecipientType: (mailAddress: string) => () => Promise<[RecipientType, PresentableKeyVerificationState]> =
		(mailAddress: string) => async () => {
			let verifiedPublicEncryptionKey: VerifiedPublicEncryptionKey | null = null
			try {
				verifiedPublicEncryptionKey = await this.mailFacade.getRecipientKeyData(mailAddress)
			} catch (e) {
				if (e instanceof KeyVerificationMismatchError) {
					return [RecipientType.INTERNAL, PresentableKeyVerificationState.ALERT]
				} else {
					throw e
				}
			}

			if (verifiedPublicEncryptionKey != null) {
				const keyVerificationState = verifiedPublicEncryptionKey.verificationState
				switch (keyVerificationState) {
					case EncryptionKeyVerificationState.NO_ENTRY:
						return [RecipientType.INTERNAL, PresentableKeyVerificationState.NONE]
					case EncryptionKeyVerificationState.VERIFIED_MANUAL:
						return [RecipientType.INTERNAL, PresentableKeyVerificationState.SECURE]
					case EncryptionKeyVerificationState.VERIFIED_TOFU:
						return [RecipientType.INTERNAL, PresentableKeyVerificationState.NONE]
					case EncryptionKeyVerificationState.NOT_SUPPORTED:
						return [RecipientType.INTERNAL, PresentableKeyVerificationState.NONE]
					default:
						throw new ProgrammingError("no mapping for key verification state: " + keyVerificationState)
				}
			} else if (isTutaMailAddress(mailAddress)) {
				return [RecipientType.INTERNAL, PresentableKeyVerificationState.NONE]
			} else {
				return [RecipientType.EXTERNAL, PresentableKeyVerificationState.NONE]
			}
		}
}

type RecipientInfo = {
	type: RecipientType
	verificationState: PresentableKeyVerificationState
}

class ResolvableRecipientImpl implements ResolvableRecipient {
	private _address: string
	private _name: string | null

	private readonly lazyInfo: LazyLoaded<RecipientInfo>
	private readonly initialInfo: RecipientInfo

	private readonly lazyContact: LazyLoaded<Contact | null>
	private readonly initialContact: Contact | null = null

	private overrideContact: Contact | null = null
	private overrideRecipientInfo: RecipientInfo | null

	get address(): string {
		return this._address
	}

	get name(): string {
		return this._name ?? ""
	}

	get type(): RecipientType {
		const lazyInfo = this.lazyInfo.getSync()
		if (lazyInfo) {
			return lazyInfo.type
		} else {
			return this.initialInfo.type
		}
	}

	get contact(): Contact | null {
		return this.lazyContact.getSync() ?? this.initialContact
	}

	get verificationState(): PresentableKeyVerificationState {
		const lazyInfo = this.lazyInfo.getSync()
		if (this.overrideRecipientInfo) {
			return this.overrideRecipientInfo.verificationState
		} else if (lazyInfo) {
			return lazyInfo.verificationState
		} else {
			return this.initialInfo.verificationState
		}
	}

	constructor(
		arg: PartialRecipient,
		private readonly contactModel: ContactModel,
		private readonly loginController: LoginController,
		private readonly typeResolver: (mailAddress: string) => Promise<[RecipientType, PresentableKeyVerificationState]>,
		private readonly entityClient: EntityClient,
	) {
		this.initialInfo = {
			type: arg.type ?? RecipientType.UNKNOWN,
			verificationState: PresentableKeyVerificationState.NONE,
		}
		this._address = cleanMailAddress(arg.address)

		this._name = arg.name ?? null
		this.overrideRecipientInfo = null

		if (!(arg.contact instanceof Array)) {
			this.initialContact = arg.contact ?? null
		}

		this.lazyInfo = new LazyLoaded(() => this.resolveInfo())
		this.lazyContact = new LazyLoaded(async () => {
			const contact = await this.resolveContact(arg.contact)
			// sometimes we create resolvable contact and then dissect it into parts and resolve it again in which case we will default to an empty name
			// (see the getter) but we actually want the name from contact.
			if (contact != null && (this._name == null || this._name === "")) {
				this._name = getContactDisplayName(contact)
			}
			return contact
		})
	}

	reset() {
		this.lazyInfo.reset()
		this.lazyContact.reset()
	}

	setName(newName: string) {
		this._name = newName
	}

	setContact(newContact: Contact) {
		this.overrideContact = newContact
		this.lazyContact.reload()
	}

	async resolve(): Promise<Recipient> {
		await Promise.all([this.lazyInfo.getAsync(), this.lazyContact.getAsync()])
		return {
			address: this.address,
			name: this.name,
			type: this.type,
			contact: this.contact,
			verificationState: this.verificationState,
		}
	}

	isResolved(): boolean {
		// We are only resolved when both type and contact are non-null and finished
		return this.lazyInfo.isLoaded() && this.lazyContact.isLoaded()
	}

	whenResolved(handler: (resolvedRecipient: Recipient) => void): this {
		this.resolve().then(handler)
		return this
	}

	/**
	 * Determine whether recipient is INTERNAL or EXTERNAL based on the existence of key data (external recipients don't have any)
	 */
	private async resolveInfo(): Promise<RecipientInfo> {
		const cleanedAddress = cleanMailAddress(this.address)
		const [recipientType, presentableKeyVerificationState] = await this.typeResolver(cleanedAddress)
		if (recipientType === RecipientType.INTERNAL) {
			// we know this is one of ours, so it's safe to clean it up
			this._address = cleanedAddress
		}
		return { type: recipientType, verificationState: presentableKeyVerificationState }
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
					await this.lazyInfo
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

	async markAsKeyVerificationMismatch(): Promise<void> {
		this.overrideRecipientInfo = {
			type: this.type,
			verificationState: PresentableKeyVerificationState.ALERT,
		}
	}
}

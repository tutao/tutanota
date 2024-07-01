import { EncryptedMailAddress, Mail, MailAddress, MailBody, MailDetails } from "../entities/tutanota/TypeRefs.js"
import { neverNull } from "@tutao/tutanota-utils"
import { ProgrammingError } from "./error/ProgrammingError.js"

type LegacyDetails = { type: "legacy"; body: MailBody }

type NewDetails = { type: "details"; details: MailDetails }

/**
 * Temporary wrapper to convert from body to details.
 * Should be removed after blob migration is complete.
 */
export class MailWrapper {
	private readonly mail: Mail
	private readonly details: LegacyDetails | NewDetails

	private constructor(mail: Mail, details: LegacyDetails | NewDetails) {
		this.mail = mail
		this.details = details
	}

	static body(mail: Mail, body: MailBody): MailWrapper {
		return new MailWrapper(mail, { type: "legacy", body })
	}

	static details(mail: Mail, details: MailDetails): MailWrapper {
		return new MailWrapper(mail, { type: "details", details })
	}

	isLegacy(): boolean {
		return isLegacy(this.details)
	}

	getMail(): Mail {
		return this.mail
	}

	getDetails(): MailDetails {
		if (isLegacy(this.details)) {
			throw new ProgrammingError("can't retrieve details from legacy mail")
		} else {
			return this.details.details
		}
	}

	getBody(): MailBody {
		if (!isLegacy(this.details)) {
			throw new ProgrammingError("can't retrieve body from new mail")
		}
		return this.details.body
	}

	getAttachmentIds(): IdTuple[] {
		return this.mail.attachments
	}

	getSentDate(): Date {
		if (isLegacy(this.details)) {
			return neverNull(this.mail.sentDate)
		} else {
			return this.details.details.sentDate
		}
	}

	getReplyTos(): EncryptedMailAddress[] {
		if (isLegacy(this.details)) {
			return this.mail.replyTos
		} else {
			return this.details.details.replyTos
		}
	}

	getToRecipients(): MailAddress[] {
		if (isLegacy(this.details)) {
			return this.mail.toRecipients
		} else {
			return this.details.details.recipients.toRecipients
		}
	}

	getCcRecipients(): MailAddress[] {
		if (isLegacy(this.details)) {
			return this.mail.ccRecipients
		} else {
			return this.details.details.recipients.ccRecipients
		}
	}

	getBccRecipients(): MailAddress[] {
		if (isLegacy(this.details)) {
			return this.mail.bccRecipients
		} else {
			return this.details.details.recipients.bccRecipients
		}
	}

	getMailBodyText(): string {
		if (isLegacy(this.details)) {
			return this.details.body.compressedText ?? this.details.body.text ?? ""
		} else {
			return this.details.details.body.compressedText ?? this.details.details.body.text ?? ""
		}
	}
}

function isLegacy(details: LegacyDetails | NewDetails): details is LegacyDetails {
	return details.type === "legacy"
}

export function isLegacyMail(mail: Mail): boolean {
	return mail.mailDetails == null && mail.mailDetailsDraft == null
}

export function isDetailsDraft(mail: Mail): boolean {
	return mail.mailDetailsDraft != null
}

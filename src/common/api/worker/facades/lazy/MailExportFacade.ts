import { File as TutanotaFile, Mail } from "../../../entities/tutanota/TypeRefs"
import { assertWorkerOrNode } from "../../../common/Env"
import { isNotNull, promiseMap } from "@tutao/tutanota-utils"
import { NotFoundError } from "../../../common/error/RestError"
import { BulkMailLoader, MailWithMailDetails } from "../../../../../mail-app/workerUtils/index/BulkMailLoader.js"
import { convertToDataFile, DataFile } from "../../../common/DataFile.js"
import { ArchiveDataType } from "../../../common/TutanotaConstants.js"
import { BlobFacade } from "./BlobFacade.js"
import { CryptoFacade } from "../../crypto/CryptoFacade.js"
import { createReferencingInstance } from "../../../common/utils/BlobUtils.js"
import { MailExportTokenFacade } from "./MailExportTokenFacade.js"

assertWorkerOrNode()

/**
 * Denotes the header that will have the mail export token.
 */
export const MAIL_EXPORT_TOKEN_HEADER = "mailExportToken"

/**
 * Wraps bulk loading of mails for mail export.
 *
 * Takes care of using mail export tokens.
 */
export class MailExportFacade {
	constructor(
		private readonly mailExportTokenFacade: MailExportTokenFacade,
		private readonly bulkMailLoader: BulkMailLoader,
		private readonly blobFacade: BlobFacade,
		private readonly cryptoFacade: CryptoFacade,
	) {}

	async loadFixedNumberOfMailsWithCache(mailListId: Id, startId: Id): Promise<Mail[]> {
		return this.mailExportTokenFacade.loadWithToken((token) =>
			this.bulkMailLoader.loadFixedNumberOfMailsWithCache(mailListId, startId, this.options(token)),
		)
	}

	async loadMailDetails(mails: readonly Mail[]): Promise<MailWithMailDetails[]> {
		return this.mailExportTokenFacade.loadWithToken((token) => this.bulkMailLoader.loadMailDetails(mails, this.options(token)))
	}

	async loadAttachments(mails: readonly Mail[]): Promise<TutanotaFile[]> {
		return this.mailExportTokenFacade.loadWithToken((token) => this.bulkMailLoader.loadAttachments(mails, this.options(token)))
	}

	async loadAttachmentData(mail: Mail, attachments: readonly TutanotaFile[]): Promise<DataFile[]> {
		const attachmentsWithKeys = await this.cryptoFacade.enforceSessionKeyUpdateIfNeeded(mail, attachments)
		// TODO: download attachments efficiently.
		//  - download multiple blobs at once if possible
		//  - use file references instead of data files (introduce a similar type to MailBundle or change MailBundle)
		const attachmentData = await promiseMap(attachmentsWithKeys, async (attachment) => {
			try {
				const bytes = await this.mailExportTokenFacade.loadWithToken((token) =>
					this.blobFacade.downloadAndDecrypt(ArchiveDataType.Attachments, createReferencingInstance(attachment), this.options(token)),
				)
				return convertToDataFile(attachment, bytes)
			} catch (e) {
				if (e instanceof NotFoundError) {
					return null
				} else {
					throw e
				}
			}
		})
		return attachmentData.filter(isNotNull)
	}

	private options(token: string): { extraHeaders: Dict } {
		return {
			extraHeaders: {
				[MAIL_EXPORT_TOKEN_HEADER]: token,
			},
		}
	}
}

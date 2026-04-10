import { elementIdPart, tutanotaTypeRefs } from "@tutao/typeRefs"
import { assertWorkerOrNode } from "../../../common/Env"
import { BulkMailLoader, MailWithMailDetails } from "../../../../../mail-app/workerUtils/index/BulkMailLoader.js"
import { convertToDataFile, DataFile } from "../../../common/DataFile.js"
import { ArchiveDataType } from "../../../common/TutanotaConstants.js"
import { BlobFacade } from "./BlobFacade.js"
import { CryptoFacade } from "../../crypto/CryptoFacade.js"
import { createReferencingInstance } from "../../../common/utils/BlobUtils.js"
import { MailExportTokenFacade } from "./MailExportTokenFacade.js"
import { assertNotNull, isNotNull } from "@tutao/utils"
import { NotFoundError } from "../../../common/error/RestError"
import { elementIdPart } from "@tutao/typeRefs"
import { BlobAccessTokenFacade } from "../BlobAccessTokenFacade"
import { BlobServerUrl } from "../../../entities/storage/TypeRefs"
import { Group } from "../../../entities/sys/TypeRefs"
import { restSuspension } from "@tutao/restClient"

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
		private readonly blobAccessTokenFacade: BlobAccessTokenFacade,
	) {}

	/**
	 * Returns a list of servers that can be used to request data from.
	 */
	async getExportServers(group: Group): Promise<BlobServerUrl[]> {
		const blobServerAccessInfo = await this.blobAccessTokenFacade.requestWriteToken(ArchiveDataType.Attachments, group._id)
		return blobServerAccessInfo.servers
	}

	async loadFixedNumberOfMailsWithCache(mailListId: Id, startId: Id, baseUrl: string): Promise<tutanotaTypeRefs.Mail[]> {
		return this.mailExportTokenFacade.loadWithToken((token) =>
			this.bulkMailLoader.loadFixedNumberOfMailsWithCache(mailListId, startId, { baseUrl, ...this.options(token) }),
		)
	}

	async loadMailDetails(mails: readonly tutanotaTypeRefs.Mail[], baseUrl: string): Promise<MailWithMailDetails[]> {
		return this.mailExportTokenFacade.loadWithToken((token) => this.bulkMailLoader.loadMailDetails(mails, { baseUrl, ...this.options(token) }))
	}

	async loadAttachments(mails: readonly tutanotaTypeRefs.Mail[], baseUrl: string): Promise<tutanotaTypeRefs.File[]> {
		return this.mailExportTokenFacade.loadWithToken((token) => this.bulkMailLoader.loadAttachments(mails, { baseUrl, ...this.options(token) }))
	}

	async loadAttachmentData(mail: tutanotaTypeRefs.Mail, attachments: readonly tutanotaTypeRefs.File[]): Promise<DataFile[]> {
		const attachmentsWithKeys = await this.cryptoFacade.enforceSessionKeyUpdateIfNeeded(mail, attachments)

		const downloads = await this.mailExportTokenFacade.loadWithToken((token) => {
			const referencingInstances = attachmentsWithKeys.map(createReferencingInstance)
			return this.blobFacade.downloadAndDecryptBlobsOfMultipleInstances(ArchiveDataType.Attachments, referencingInstances, {
				...this.options(token),
			})
		})

		const attachmentData = Array.from(downloads.entries()).map(([fileId, bytes]) => {
			try {
				if (bytes == null) {
					return null
				} else {
					const attachment = assertNotNull(attachmentsWithKeys.find((attachment) => elementIdPart(attachment._id) === fileId))
					return convertToDataFile(attachment, bytes)
				}
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

	private options(token: string): {
		extraHeaders: Dict
		suspensionBehavior: restSuspension.SuspensionBehavior
	} {
		return {
			extraHeaders: {
				[MAIL_EXPORT_TOKEN_HEADER]: token,
			},
			suspensionBehavior: restSuspension.SuspensionBehavior.Throw,
		}
	}
}

import { assertWorkerOrNode } from "@tutao/app-env"
import { BulkMailLoader, MailWithMailDetails } from "../../../../../mail-app/workerUtils/index/BulkMailLoader.js"
import { BlobFacade } from "./BlobFacade.js"
import { CryptoFacade } from "../../../../../base/crypto/CryptoFacade.js"
import { MailExportTokenFacade } from "./MailExportTokenFacade.js"
import { assertNotNull, isNotNull } from "@tutao/utils"
import * as restError from "@tutao/rest-client/error"
import { BlobAccessTokenFacade } from "../../../../../network/BlobAccessTokenFacade"
import { SuspensionBehavior } from "../../../../../rest-client/types"
import { Group } from "@tutao/entities/sys"
import { ArchiveDataType } from "../../../../../entities/sys/Utils"
import { DataFile, File, Mail } from "@tutao/entities/tutanota"
import { BlobServerUrl, createReferencingInstance } from "@tutao/entities/storage"
import { elementIdPart } from "@tutao/meta"
import { convertToDataFile } from "../../utils/DataFile"

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

	async loadFixedNumberOfMailsWithCache(mailListId: Id, startId: Id, baseUrl: string): Promise<Mail[]> {
		return this.mailExportTokenFacade.loadWithToken((token) =>
			this.bulkMailLoader.loadFixedNumberOfMailsWithCache(mailListId, startId, { baseUrl, ...this.options(token) }),
		)
	}

	async loadMailDetails(mails: readonly Mail[], baseUrl: string): Promise<MailWithMailDetails[]> {
		return this.mailExportTokenFacade.loadWithToken((token) => this.bulkMailLoader.loadMailDetails(mails, { baseUrl, ...this.options(token) }))
	}

	async loadAttachments(mails: readonly Mail[], baseUrl: string): Promise<File[]> {
		return this.mailExportTokenFacade.loadWithToken((token) => this.bulkMailLoader.loadAttachments(mails, { baseUrl, ...this.options(token) }))
	}

	async loadAttachmentData(mail: Mail, attachments: readonly File[]): Promise<DataFile[]> {
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
				if (e instanceof restError.NotFoundError) {
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
		suspensionBehavior: SuspensionBehavior
	} {
		return {
			extraHeaders: {
				[MAIL_EXPORT_TOKEN_HEADER]: token,
			},
			suspensionBehavior: SuspensionBehavior.Throw,
		}
	}
}

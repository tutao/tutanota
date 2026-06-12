import { User } from "@tutao/entities/sys"
import { EntityUpdateData } from "../../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { MailWithDetailsAndAttachments } from "./MailIndexerBackend"
import { EntityClient } from "../../../../platform-kit/network/EntityClient"
import { EntityRestClient } from "../../../../platform-kit/network/EntityRestClient"
import { MailFacade } from "../../../common/api/worker/facades/lazy/MailFacade"
import { MailDetails, MailDetailsBlobTypeRef, MailDetailsDraftTypeRef, MailTypeRef } from "@tutao/entities/tutanota"
import { assertNotNull, first } from "@tutao/utils"
import { isDraft } from "../../mail/model/MailChecks"
import { elementIdPart, listIdPart } from "@tutao/meta"
import { cryptoUtils } from "@tutao/crypto"
import { NotAuthorizedError, NotFoundError } from "@tutao/rest-client/error"

/**
 * Handles indexing mails for mail groups.
 */
export interface MailIndexer {
	readonly currentIndexTimestamp: number
	readonly mailIndexingEnabled: boolean

	init(user: User): Promise<void>
	processEntityEvents(events: readonly EntityUpdateData[], groupId: Id, batchId: Id): Promise<void>
	beforeMailDeleted(mailid: IdTuple): Promise<void>
	afterMailDeleted(mailid: IdTuple): Promise<void>
	afterMailCreated(mailid: IdTuple): Promise<void>
	afterMailUpdated(mailid: IdTuple): Promise<void>
	beforeImportedMailFinished(importedMailsList: Id): Promise<void>
	rebuildIndex(user: User): Promise<void>
	extendMailIndex(user: User): Promise<void>
}

/**
 * Interface for downloading new mails for updates.
 */
export interface MailIndexerNewMailDownloader {
	(mailId: IdTuple): Promise<MailWithDetailsAndAttachments | null>
}

/**
 * Shared functionality for downloading new mail data.
 *
 * Note: The mail must be resolvable with its session key.
 */
export function defaultMailIndexerNewMailDownloader(entityClient: EntityClient | EntityRestClient, mailFacade: MailFacade): MailIndexerNewMailDownloader {
	return async (mailId: IdTuple) => {
		try {
			const mail = await entityClient.load(MailTypeRef, mailId)
			// Will be always there, if it was not updated yet, it will still be set by CryptoFacade
			const mailOwnerEncSessionKey = assertNotNull(mail._ownerEncSessionKey)
			let mailDetails: MailDetails
			if (isDraft(mail)) {
				const mailDetailsDraftId = assertNotNull(mail.mailDetailsDraft)
				mailDetails = await entityClient
					.loadMultiple(MailDetailsDraftTypeRef, listIdPart(mailDetailsDraftId), [elementIdPart(mailDetailsDraftId)], async () => ({
						key: mailOwnerEncSessionKey,
						encryptingKeyVersion: cryptoUtils.parseKeyVersion(mail._ownerKeyVersion ?? "0"),
					}))
					.then((d) => {
						const draft = first(d)
						if (draft == null) {
							throw new NotFoundError(`MailDetailsDraft ${mailDetailsDraftId}`)
						}
						return draft.details
					})
			} else {
				const mailDetailsBlobId = assertNotNull(mail.mailDetails)
				mailDetails = await entityClient
					.loadMultiple(MailDetailsBlobTypeRef, listIdPart(mailDetailsBlobId), [elementIdPart(mailDetailsBlobId)], async () => ({
						key: mailOwnerEncSessionKey,
						encryptingKeyVersion: cryptoUtils.parseKeyVersion(mail._ownerKeyVersion ?? "0"),
					}))
					.then((d) => {
						const blob = first(d)
						if (blob == null) {
							throw new NotFoundError(`MailDetailsBlob ${mailDetailsBlobId}`)
						}
						return blob.details
					})
			}
			// we do not use BulkMailLoader here because we actually do want to rely on cache
			const attachments = await mailFacade.loadAttachments(mail)
			return {
				mail,
				mailDetails,
				attachments,
			}
		} catch (e) {
			if (e instanceof NotFoundError) {
				console.log("tried to index non existing mail", mailId)
				return null
			} else if (e instanceof NotAuthorizedError) {
				console.log("tried to index mail without permission", mailId)
				return null
			} else {
				throw e
			}
		}
	}
}

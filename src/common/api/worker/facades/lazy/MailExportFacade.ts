import { MailExportTokenService } from "../../../entities/tutanota/Services"
import { assertWorkerOrNode } from "../../../common/Env"
import { IServiceExecutor } from "../../../common/ServiceRequest"
import { EntityClient } from "../../../common/EntityClient"
import { CacheMode, EntityRestClientLoadOptions } from "../../rest/EntityRestClient"
import type { ListElementEntity, SomeEntity } from "../../../common/EntityTypes"
import { assertNotNull, TypeRef } from "@tutao/tutanota-utils"
import { AccessExpiredError } from "../../../common/error/RestError"

assertWorkerOrNode()

const TAG = "[MailExportFacade]"

/**
 * Denotes the header that will have the mail export token.
 */
export const MAIL_EXPORT_TOKEN_HEADER = "mailExportToken"

/**
 * Denotes an export token. This is internally just a string, but we want the TypeScript compiler to enforce strong
 * typing.
 */
type MailExportToken = string & { _exportToken: undefined }

/**
 * Mail exporter functions
 *
 * This implements loadForMailGroup and loadRangeForMailGroup which uses mail export tokens retrieved from the server
 * and does not write to cache. Note that no loadAll method is implemented since tokens expire after a short period of
 * time, and it is better to process in batches.
 */
export class MailExportFacade {
	// This will only be set if a request is in progress
	private currentExportTokenRequest: Promise<MailExportToken> | null = null
	// Set when we have a known valid token
	private currentExportToken: MailExportToken | null = null

	constructor(private readonly serviceExecutor: IServiceExecutor, private readonly entityClient: EntityClient) {}

	/**
	 * Load a single element for export, (re-)generating a mail export token if needed
	 */
	async load<T extends SomeEntity>(typeRef: TypeRef<T>, id: PropertyType<T, "_id">): Promise<T> {
		return this.handleRequest((options) => this.entityClient.load(typeRef, id, options))
	}

	/**
	 * Load a multiple elements for export, (re-)generating a mail export token if needed
	 */
	async loadMultiple<T extends SomeEntity>(typeRef: TypeRef<T>, listId: Id | null, elementIds: Id[]): Promise<T[]> {
		return this.handleRequest((options) => this.entityClient.loadMultiple(typeRef, listId, elementIds, undefined, options))
	}

	/**
	 * Load a range of elements for export, (re-)generating a mail export token if needed
	 */
	async loadRange<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, firstId: Id, count: number, reverse: boolean): Promise<T[]> {
		return this.handleRequest((options) => this.entityClient.loadRange<T>(typeRef, listId, firstId, count, reverse, options))
	}

	/**
	 * Runs `request`.
	 *
	 * If `AccessExpiredError` is thrown, delete the cached token and re-run it again.
	 * @param request function to run
	 * @private
	 */
	private async handleRequest<T>(request: (options: EntityRestClientLoadOptions) => Promise<T>): Promise<T> {
		const token = this.currentExportToken ?? (await this.requestNewToken())
		try {
			const options = this.applyExportOptions(token)
			return await request(options)
		} catch (e) {
			// We only allow one retry
			if (e instanceof AccessExpiredError) {
				let newToken
				if (this.currentExportToken === token) {
					console.log(TAG, `token expired for exporting and will be renewed`)
					newToken = await this.requestNewToken()
				} else {
					// Already a request going on... wait for that to finish
					newToken = this.currentExportToken ?? (await this.requestNewToken())
				}

				const options = this.applyExportOptions(newToken)
				return await request(options)
			} else {
				throw e
			}
		}
	}

	private applyExportOptions(token: MailExportToken): EntityRestClientLoadOptions {
		return {
			cacheMode: CacheMode.ReadOnly,
			extraHeaders: {
				[MAIL_EXPORT_TOKEN_HEADER]: token,
			},
		}
	}

	/**
	 * Request a new token and write it to the tokenCache.
	 *
	 * This token will be valid for the mail group and current user for a short amount of time, after which you will get
	 * an `AccessExpiredError` when using the token (or `NotAuthorizedError` if the user lost access to the group in the
	 * meantime).
	 * @throws TooManyRequestsError the user cannot request any more tokens right now
	 * @return the token
	 */
	private requestNewToken(): Promise<MailExportToken> {
		if (this.currentExportTokenRequest) {
			return this.currentExportTokenRequest
		}

		this.currentExportToken = null
		this.currentExportTokenRequest = this.serviceExecutor.post(MailExportTokenService, null).then(
			(result) => {
				this.currentExportToken = result.mailExportToken as MailExportToken
				this.currentExportTokenRequest = null
				return this.currentExportToken
			},
			(error) => {
				// Re-initialize in case MailExportTokenService won't fail on a future request
				this.currentExportTokenRequest = null
				throw error
			},
		)
		return this.currentExportTokenRequest
	}

	// @VisibleForTesting
	_setCurrentExportToken(token: string) {
		this.currentExportToken = token as MailExportToken
		this.currentExportTokenRequest = null
	}

	// @VisibleForTesting
	_getCurrentExportToken(): string | null {
		return this.currentExportToken
	}
}

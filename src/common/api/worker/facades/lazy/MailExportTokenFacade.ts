import { AccessExpiredError } from "../../../common/error/RestError.js"
import { MailExportTokenService } from "../../../entities/tutanota/Services.js"
import { IServiceExecutor } from "../../../common/ServiceRequest.js"
import { SuspensionBehavior } from "../../rest/RestClient"

const TAG = "[MailExportTokenFacade]"

/**
 * Denotes an export token. This is internally just a string, but we want the TypeScript compiler to enforce strong
 * typing.
 */
type MailExportToken = string & { _exportToken: undefined }

/**
 * Takes care of requested and invalidating export tokens as needed.
 *
 * Export token should be passed with network requests to avoid server penalties.
 */
export class MailExportTokenFacade {
	// This will only be set if a request is in progress
	private currentExportTokenRequest: Promise<MailExportToken> | null = null
	// Set when we have a known valid token
	private currentExportToken: MailExportToken | null = null

	constructor(private readonly serviceExecutor: IServiceExecutor) {}

	/**
	 * Runs {@param request}.
	 *
	 * If {@link AccessExpiredError} is thrown, deletes the cached token and re-runs it again.
	 */
	async loadWithToken<T>(request: (token: string) => Promise<T>): Promise<T> {
		const token = this.currentExportToken ?? (await this.requestNewToken())
		try {
			return await request(token)
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

				return await request(newToken)
			} else {
				throw e
			}
		}
	}

	/**
	 * Request a new token and write it to {@link currentExportToken}.
	 *
	 * This token will be valid for the mail group and current user for a short amount of time, after which you will get
	 * an {@link AccessExpiredError} when using the token (or {@link NotAuthorizedError} if the user lost access to the group in the
	 * meantime).
	 * @throws TooManyRequestsError the user cannot request any more tokens right now
	 */
	private requestNewToken(): Promise<MailExportToken> {
		if (this.currentExportTokenRequest) {
			return this.currentExportTokenRequest
		}

		this.currentExportToken = null
		this.currentExportTokenRequest = this.serviceExecutor.post(MailExportTokenService, null, { suspensionBehavior: SuspensionBehavior.Throw }).then(
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

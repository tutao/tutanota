import { getImapConfigForProvider, ImapProvider } from "../../../../common/api/common/utils/imapImportUtils/ImapKnownConfigs"
import { EntityClient } from "../../../../../platform-kit/network/EntityClient"
import { ImapAccountSyncState } from "@tutao/entities/tutanota"
import { tokenEndpointResponseToOAuthTokenEndpointResponse } from "../../../../common/api/common/utils/imapImportUtils/ImapImportUtils"
import { ImapError, ImapErrorCause } from "../../../../common/api/common/error/ImapError"
import { OAuthHandler, OAuthHandlerFactory } from "./OAuthHandler"
import { ImapAccountSyncStatus } from "../../../../../entities/tutanota/Utils"
import { ProgrammingError } from "@tutao/app-env"

export class OAuthErrorHandler {
	constructor(
		private readonly entityClient: EntityClient,
		private readonly imapOauthProviderToSecretConfig: Map<ImapProvider, string>,
		private readonly oauthHandlerFactory: OAuthHandlerFactory = (config) => new OAuthHandler(config),
	) {}

	/**
	 *
	 * @param imapAccountSyncState This has side effects that update the token.
	 *
	 * @return shouldRetry, a value indicating whether the error was handled and import can be continued.
	 */
	public async handleAuthError(imapAccountSyncState: ImapAccountSyncState) {
		const provider = parseInt(imapAccountSyncState.provider) as ImapProvider
		const isOAuth = provider !== ImapProvider.Other

		if (isOAuth) {
			const oAuthConfig = getImapConfigForProvider(provider, this.imapOauthProviderToSecretConfig)?.oauthConfig
			if (oAuthConfig) {
				if (imapAccountSyncState.imapAccount.oAuthTokenEndpointResponse?.refreshToken) {
					// we need get a new token using refresh token
					const oauthHandler = this.oauthHandlerFactory(oAuthConfig)
					await oauthHandler.setupOauthLoginParams()
					try {
						const tokenEndpointResponse = await oauthHandler.refreshTokens(imapAccountSyncState.imapAccount.oAuthTokenEndpointResponse.refreshToken)
						const oAuthTokenEndpointResponse = tokenEndpointResponseToOAuthTokenEndpointResponse(tokenEndpointResponse)
						// When refreshing a token, the refresh token itself is not part of the response, so we must *not*
						// replace the entire response.
						const previousToken = imapAccountSyncState.imapAccount.oAuthTokenEndpointResponse.refreshToken
						imapAccountSyncState.imapAccount.oAuthTokenEndpointResponse = oAuthTokenEndpointResponse
						if (imapAccountSyncState.imapAccount.oAuthTokenEndpointResponse.refreshToken === null) {
							imapAccountSyncState.imapAccount.oAuthTokenEndpointResponse.refreshToken = previousToken
						}

						await this.entityClient.update(imapAccountSyncState)
						return true
					} catch (e) {
						// we need to get a new refreshToken
						await this.requestCredentialUpdate(imapAccountSyncState)
						return false
					}
				} else {
					// We somehow have lost the refreshToken
					await this.requestCredentialUpdate(imapAccountSyncState)
					return false
				}
			} else {
				throw new ProgrammingError("imap sync found no Oauth config")
			}
		} else {
			// we need to get a new user password
			await this.requestCredentialUpdate(imapAccountSyncState)
			return false
		}
	}

	isAuthError(e: ImapError) {
		return e.data === ImapErrorCause.AUTH_FAILED
	}

	private async requestCredentialUpdate(imapAccountSyncState: ImapAccountSyncState) {
		imapAccountSyncState.status = ImapAccountSyncStatus.AUTH_ERROR
		// Updated to error state, which will cause an entity event
		await this.entityClient.update(imapAccountSyncState)
	}
}

import { getImapConfigForProvider, ImapProvider } from "../../../common/api/common/utils/imapImportUtils/ImapKnownConfigs"
import { EntityClient } from "../../../../platform-kit/network/EntityClient"
import { ImapAccountSyncState, ImapAccountSyncStateTypeRef } from "@tutao/entities/tutanota"
import { tokenEndpointResponseToOAuthTokenEndpointResponse } from "../../../common/api/common/utils/imapImportUtils/ImapImportUtils"
import { ImapError, ImapErrorCause } from "../../../common/api/common/error/ImapError"
import { OAuthHandler, OAuthHandlerFactory } from "./oauth/OAuthHandler"
import { ImapAccountSyncStatus } from "../../../../entities/tutanota/Utils"
import { ProgrammingError } from "@tutao/app-env"
import { IServiceExecutor } from "../../../../platform-kit/network/ServiceRequest"
import { CacheMode, DEFAULT_ENTITY_RESTCLIENT_LOAD_OPTIONS } from "../../../../platform-kit/instance-pipeline/RestClientOptions"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { showImapCertificateErrorDialog } from "../../../common/gui/dialogs/ImapCertificateErrorDialog"
import { FileChooserMultiMode, showFileChooser } from "../../../common/file/FileController"
import { ImapCredentials } from "../../../common/api/common/utils/imapImportUtils/ImapSyncContext"

export type ReadableImapError = {
	cause: ImapErrorCause
	errorMessage: string
}

export type ImapErrorHandlerResult = {
	shouldRetry: boolean
	updatedImapCredentials?: ImapCredentials
	readableImapError: ReadableImapError
}

type HandleCertificateErrorResult = { result?: { ignoreCertificateErrors: boolean; customCertificateData: Uint8Array | null } }

function imapErrorToReadableImapError(imapError: ImapError): ReadableImapError {
	switch (imapError.data) {
		case ImapErrorCause.INITIAL_CONNECT_FAILED:
			return {
				cause: imapError.data,
				errorMessage: lang.getTranslation("migrationAccountConnectionFailure_msg", { "{errorCode}": imapError.data }).text,
			}
		case ImapErrorCause.AUTH_FAILED:
			return {
				cause: imapError.data,
				errorMessage: lang.getTranslationText("migrationAuthFailed_msg"),
			}
		case ImapErrorCause.HOST_NOT_FOUND:
			return {
				cause: imapError.data,
				errorMessage: lang.getTranslationText("migrationHostNotFoundError_msg"),
			}
		case ImapErrorCause.HOST_NOT_REACHABLE:
			return {
				cause: imapError.data,
				errorMessage: lang.getTranslationText("migrationHostNotReachableError_msg"),
			}
		case ImapErrorCause.CERT_ERROR:
			return {
				cause: imapError.data,
				errorMessage: lang.getTranslationText("migrationCertError_msg"),
			}
		case ImapErrorCause.PERMANENT_ERROR:
			return {
				cause: imapError.data,
				errorMessage: lang.getTranslationText("migrationSyncFailure_msg"),
			}
		case ImapErrorCause.UNKNOWN:
		case ImapErrorCause.POSTPONE:
		default:
			return {
				cause: imapError.data,
				errorMessage: lang.getTranslation("migrationGenericError_msg", { "{errorCode}": imapError.data }).text,
			}
	}
}

export class ImapErrorHandler {
	constructor(
		private readonly entityClient: EntityClient,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly oauthHandlerFactory: OAuthHandlerFactory = async (config) => {
			return new OAuthHandler(config, serviceExecutor)
		},
	) {}

	/**
	 *
	 * @param imapError to handle
	 * @param imapAccountSyncStateId This has side effects that update the token.
	 *
	 * @param imapCredentials
	 * @return shouldRetry, a value indicating whether the error was handled and import can be continued.
	 */
	public async handleImapError(imapError: ImapError, imapCredentials?: ImapCredentials, imapAccountSyncStateId?: IdTuple): Promise<ImapErrorHandlerResult> {
		console.error("imap error occurred", imapError)

		const readableImapError = imapErrorToReadableImapError(imapError)
		if (this.isAuthError(imapError) && imapAccountSyncStateId) {
			return {
				shouldRetry: await this.handleAuthError(imapAccountSyncStateId),
				readableImapError: readableImapError,
			}
		} else if (this.isCertificateError(imapError) && imapCredentials) {
			const handleCertificateErrorResult = await this.handleCertificateError()
			if (handleCertificateErrorResult.result) {
				const { ignoreCertificateErrors, customCertificateData } = handleCertificateErrorResult.result
				const updatedImapCredentials = { ...imapCredentials, ignoreCertificateErrors, customCertificateData }
				return {
					shouldRetry: true,
					updatedImapCredentials,
					readableImapError: readableImapError,
				}
			} else {
				return {
					shouldRetry: false,
					readableImapError: readableImapError,
				}
			}
		} else {
			return {
				shouldRetry: false,
				readableImapError: readableImapError,
			}
		}
	}

	async handleAuthError(imapAccountSyncStateId: IdTuple) {
		const imapAccountSyncState = await this.entityClient.load(ImapAccountSyncStateTypeRef, imapAccountSyncStateId)
		const provider = parseInt(imapAccountSyncState.provider) as ImapProvider
		const isOAuth = provider !== ImapProvider.Other

		if (isOAuth) {
			const oAuthConfig = getImapConfigForProvider(provider)?.oauthConfig
			if (oAuthConfig) {
				if (imapAccountSyncState.imapAccount.oAuthTokenEndpointResponse?.refreshToken) {
					// we need get a new token using refresh token
					const oauthHandler = await this.oauthHandlerFactory(oAuthConfig, this.serviceExecutor)
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

						await this.entityClient.load(ImapAccountSyncStateTypeRef, imapAccountSyncStateId, {
							...DEFAULT_ENTITY_RESTCLIENT_LOAD_OPTIONS,
							cacheMode: CacheMode.WriteOnly,
						})
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

	async handleCertificateError(): Promise<HandleCertificateErrorResult> {
		const userChoice = await showImapCertificateErrorDialog()

		if (userChoice === "ignore") {
			return { result: { ignoreCertificateErrors: true, customCertificateData: null } }
		} else if (userChoice === "upload") {
			const [certificateFile] = await showFileChooser(FileChooserMultiMode.Single, ["crt"])
			if (certificateFile) {
				return { result: { ignoreCertificateErrors: false, customCertificateData: certificateFile.data } }
			}
		}
		return {}
	}

	isAuthError(e: ImapError) {
		return e.data === ImapErrorCause.AUTH_FAILED
	}

	isCertificateError(e: ImapError) {
		return e.data === ImapErrorCause.CERT_ERROR
	}

	private async requestCredentialUpdate(imapAccountSyncState: ImapAccountSyncState) {
		imapAccountSyncState.status = ImapAccountSyncStatus.AUTH_ERROR
		// Updated to error state, which will cause an entity event
		await this.entityClient.update(imapAccountSyncState)
	}
}

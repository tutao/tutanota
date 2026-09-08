import { getImapConfigForProvider, MailboxMigrationProvider } from "../../../common/api/common/utils/migrationImportUtils/ImapKnownConfigs"
import { EntityClient } from "../../../../platform-kit/network/EntityClient"
import { MailboxMigrationSyncState, MailboxMigrationSyncStateTypeRef } from "@tutao/entities/tutanota"
import { UserMigrationInformation, UserMigrationInformationTypeRef } from "@tutao/entities/sys"
import {
	findUserMigrationInfoForSyncState,
	getMailboxMigrationCredential,
	tokenEndpointResponseToOAuthToken,
	tokenEndpointResponseToOAuthTokenEndpointResponseLegacy,
} from "../../../common/api/common/utils/migrationImportUtils/MigrationImportUtils"
import { ImapError, ImapErrorCause } from "../../../common/api/common/error/ImapError"
import { OAuthHandler, OAuthHandlerFactory } from "./oauth/OAuthHandler"
import { MailboxMigrationSyncStatus } from "../../../../entities/tutanota/Utils"
import { IServiceExecutor } from "../../../../platform-kit/network/ServiceRequest"
import { CacheMode, DEFAULT_ENTITY_RESTCLIENT_LOAD_OPTIONS } from "../../../../platform-kit/instance-pipeline/RestClientOptions"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { showImapCertificateErrorDialog } from "../../../common/gui/dialogs/ImapCertificateErrorDialog"
import { FileChooserMultiMode, showFileChooser } from "../../../common/file/FileController"
import { ImapCredentials } from "../../../common/api/common/utils/migrationImportUtils/ImapSyncContext"
import { assertNotNull } from "@tutao/utils"
import { ProgrammingError } from "@tutao/app-env"
import { LoginController } from "../../../common/api/main/LoginController"

export type ReadableImapError = {
	cause: ImapErrorCause
	errorMessage: string
}

export type ImapErrorHandlerResult = {
	shouldRetry: boolean
	updatedImapCredentials?: ImapCredentials
	readableImapError: ReadableImapError
}

type HandleCertificateErrorResult = { result?: { ignoreCertificateErrors: boolean; customCertificateData: Uint8Array<ArrayBuffer> | null } }

function imapErrorToReadableImapError(imapError: ImapError): ReadableImapError {
	const cause = imapError.data.cause
	switch (cause) {
		case ImapErrorCause.INITIAL_CONNECT_FAILED:
			return {
				cause: cause,
				errorMessage: lang.getTranslation("migrationAccountConnectionFailure_msg", { "{errorCode}": cause }).text,
			}
		case ImapErrorCause.AUTH_FAILED:
			return {
				cause: cause,
				errorMessage: lang.getTranslationText("migrationAuthFailed_msg"),
			}
		case ImapErrorCause.HOST_NOT_FOUND:
			return {
				cause: cause,
				errorMessage: lang.getTranslationText("migrationHostNotFoundError_msg"),
			}
		case ImapErrorCause.HOST_NOT_REACHABLE:
			return {
				cause: cause,
				errorMessage: lang.getTranslationText("migrationHostNotReachableError_msg"),
			}
		case ImapErrorCause.CERT_ERROR:
			return {
				cause: cause,
				errorMessage: lang.getTranslationText("migrationConnectionCertError_msg"),
			}
		case ImapErrorCause.PERMANENT_ERROR:
			return {
				cause: cause,
				errorMessage: lang.getTranslationText("migrationSyncFailure_msg"),
			}
		case ImapErrorCause.GREETING_TIMEOUT:
			return {
				cause: cause,
				errorMessage: lang.getTranslationText("migrationGreetingTimeout_msg"),
			}
		case ImapErrorCause.GMAIL_ALL_MAILS_IMAP_DISABLED:
			return {
				cause: cause,
				errorMessage: lang.getTranslationText("migrationGmailAllMailsDisabledImapError_msg"),
			}
		case ImapErrorCause.UNKNOWN:
		case ImapErrorCause.POSTPONE:
		default:
			return {
				cause: cause,
				errorMessage: lang.getTranslation("migrationGenericError_msg", { "{errorCode}": cause }).text,
			}
	}
}

export class ImapErrorHandler {
	constructor(
		private readonly entityClient: EntityClient,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly loginController: LoginController,
		private readonly oauthHandlerFactory: OAuthHandlerFactory = async (config) => {
			return new OAuthHandler(config, serviceExecutor)
		},
	) {}

	private async loadUserMigrationInfoForSyncState(migrationSyncStateId: IdTuple): Promise<UserMigrationInformation | null> {
		const userMigrationInfoListId = this.loginController.getUserController().user.userMigrationInfos
		if (userMigrationInfoListId) {
			const userMigrationInfos = await this.entityClient.loadAll(UserMigrationInformationTypeRef, userMigrationInfoListId)
			return findUserMigrationInfoForSyncState(userMigrationInfos, migrationSyncStateId)
		} else {
			// legacy case
			return null
		}
	}

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

	async handleAuthError(mailboxMigrationSyncStateId: IdTuple) {
		const mailboxMigrationSyncState = await this.entityClient.load(MailboxMigrationSyncStateTypeRef, mailboxMigrationSyncStateId)
		const userMigrationInformation = await this.loadUserMigrationInfoForSyncState(mailboxMigrationSyncStateId)
		const mailboxMigrationCredential = getMailboxMigrationCredential(mailboxMigrationSyncState, userMigrationInformation)
		const isOAuth = mailboxMigrationCredential.provider !== MailboxMigrationProvider.Other

		if (isOAuth) {
			const oAuthConfig = getImapConfigForProvider(mailboxMigrationCredential.provider)?.oauthConfig
			if (oAuthConfig) {
				if (mailboxMigrationCredential.oAuthToken?.refreshToken) {
					// we need get a new token using refresh token
					const oauthHandler = await this.oauthHandlerFactory(oAuthConfig, this.serviceExecutor)
					await oauthHandler.setupOauthLoginParams()
					try {
						const previousRefreshToken = mailboxMigrationCredential.oAuthToken.refreshToken
						const tokenEndpointResponse = await oauthHandler.refreshTokens(previousRefreshToken)

						// When refreshing a token, the refresh token itself is not part of the response, so we must *not*
						// replace the entire response.
						if (userMigrationInformation?.credential) {
							const oAuthToken = tokenEndpointResponseToOAuthToken(tokenEndpointResponse)
							if (oAuthToken.refreshToken === null) {
								oAuthToken.refreshToken = previousRefreshToken
							}
							userMigrationInformation.credential.oAuthToken = oAuthToken
							await this.entityClient.update(userMigrationInformation)
						} else {
							const oAuthTokenEndpointResponse = tokenEndpointResponseToOAuthTokenEndpointResponseLegacy(tokenEndpointResponse)
							if (oAuthTokenEndpointResponse.refreshToken === null) {
								oAuthTokenEndpointResponse.refreshToken = previousRefreshToken
							}
							assertNotNull(mailboxMigrationSyncState.imapConfiguration).sharedOauthToken = oAuthTokenEndpointResponse
							await this.entityClient.update(mailboxMigrationSyncState)
						}

						await this.entityClient.load(MailboxMigrationSyncStateTypeRef, mailboxMigrationSyncStateId, {
							...DEFAULT_ENTITY_RESTCLIENT_LOAD_OPTIONS,
							cacheMode: CacheMode.WriteOnly,
						})
						return true
					} catch (e) {
						// we need to get a new refreshToken
						await this.requestCredentialUpdate(mailboxMigrationSyncState)
						return false
					}
				} else {
					// We somehow have lost the refreshToken
					await this.requestCredentialUpdate(mailboxMigrationSyncState)
					return false
				}
			} else {
				throw new ProgrammingError("imap sync found no Oauth config")
			}
		} else {
			// we need to get a new user password
			await this.requestCredentialUpdate(mailboxMigrationSyncState)
			return false
		}
	}

	async handleCertificateError(): Promise<HandleCertificateErrorResult> {
		const userChoice = await showImapCertificateErrorDialog()

		if (userChoice === "ignore") {
			return { result: { ignoreCertificateErrors: true, customCertificateData: null } }
		} else if (userChoice === "upload") {
			const [certificateFile] = await showFileChooser(FileChooserMultiMode.Single, ["crt", "pem"])
			if (certificateFile) {
				return { result: { ignoreCertificateErrors: false, customCertificateData: certificateFile.data } }
			}
		}
		return {}
	}

	isImapError(e: any) {
		return !Number.isNaN(e.data?.cause)
	}

	isAuthError(e: ImapError) {
		return this.isImapError(e) && e.data.cause === ImapErrorCause.AUTH_FAILED
	}

	isCertificateError(e: ImapError) {
		return this.isImapError(e) && e.data.cause === ImapErrorCause.CERT_ERROR
	}

	isGmailAllMailsIMAPDisabledError(e: ImapError) {
		return this.isImapError(e) && e.data.cause === ImapErrorCause.GMAIL_ALL_MAILS_IMAP_DISABLED
	}

	private async requestCredentialUpdate(imapAccountSyncState: MailboxMigrationSyncState) {
		imapAccountSyncState.status = MailboxMigrationSyncStatus.AUTH_ERROR
		// Updated to error state, which will cause an entity event
		await this.entityClient.update(imapAccountSyncState)
	}
}

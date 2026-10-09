import { getServerMigrationConfigForProvider, MailboxMigrationProvider } from "../../../common/api/common/utils/migrationImportUtils/MigrationKnownConfigs"
import { EntityClient } from "../../../../platform-kit/network/EntityClient"
import { MailboxMigrationSyncState, MailboxMigrationSyncStateTypeRef } from "@tutao/entities/tutanota"
import { UserMigrationInformation, UserMigrationInformationTypeRef } from "@tutao/entities/sys"
import {
	findUserMigrationInfoForSyncState,
	getMailboxMigrationCredential,
	tokenEndpointResponseToOAuthToken,
	tokenEndpointResponseToOAuthTokenEndpointResponseLegacy,
} from "../../../common/api/common/utils/migrationImportUtils/MigrationImportUtils"
import { MigrationError, MigrationErrorCause } from "../../../common/api/common/error/MigrationError"
import { OAuthHandler, OAuthHandlerFactory } from "./oauth/OAuthHandler"
import { MailboxMigrationSyncStatus } from "../../../../entities/tutanota/Utils"
import { IServiceExecutor } from "../../../../platform-kit/network/ServiceRequest"
import { CacheMode, DEFAULT_ENTITY_RESTCLIENT_LOAD_OPTIONS } from "../../../../platform-kit/instance-pipeline/RestClientOptions"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { showImapCertificateErrorDialog } from "../../../common/gui/dialogs/ImapCertificateErrorDialog"
import { FileChooserMultiMode, showFileChooser } from "../../../common/file/FileController"
import { MigrationCredentials } from "../../../common/api/common/utils/migrationImportUtils/MigrationSyncContext"
import { assertNotNull } from "@tutao/utils"
import { ProgrammingError } from "@tutao/app-env"
import { LoginController } from "../../../common/api/main/LoginController"

export type ReadableMigrationError = {
	cause: MigrationErrorCause
	errorMessage: string
}

export type MigrationErrorHandlerResult = {
	shouldRetry: boolean
	updatedMigrationCredentials?: MigrationCredentials
	readableMigrationError: ReadableMigrationError
}

type HandleCertificateErrorResult = { result?: { ignoreCertificateErrors: boolean; customCertificateData: Uint8Array<ArrayBuffer> | null } }

function migrationErrorToReadableMigrationError(migrationError: MigrationError): ReadableMigrationError {
	const cause = migrationError.data.cause
	switch (cause) {
		case MigrationErrorCause.INITIAL_CONNECT_FAILED:
			return {
				cause: cause,
				errorMessage: lang.getTranslation("migrationAccountConnectionFailure_msg", { "{errorCode}": cause }).text,
			}
		case MigrationErrorCause.AUTH_FAILED:
			return {
				cause: cause,
				errorMessage: lang.getTranslationText("migrationAuthFailed_msg"),
			}
		case MigrationErrorCause.HOST_NOT_FOUND:
			return {
				cause: cause,
				errorMessage: lang.getTranslationText("migrationHostNotFoundError_msg"),
			}
		case MigrationErrorCause.HOST_NOT_REACHABLE:
			return {
				cause: cause,
				errorMessage: lang.getTranslationText("migrationHostNotReachableError_msg"),
			}
		case MigrationErrorCause.CERT_ERROR:
			return {
				cause: cause,
				errorMessage: lang.getTranslationText("migrationConnectionCertError_msg"),
			}
		case MigrationErrorCause.PERMANENT_ERROR:
			return {
				cause: cause,
				errorMessage: lang.getTranslationText("migrationSyncFailure_msg"),
			}
		case MigrationErrorCause.GREETING_TIMEOUT:
			return {
				cause: cause,
				errorMessage: lang.getTranslationText("migrationGreetingTimeout_msg"),
			}
		case MigrationErrorCause.GMAIL_ALL_MAILS_IMAP_DISABLED:
			return {
				cause: cause,
				errorMessage: lang.getTranslationText("migrationGmailAllMailsDisabledImapError_msg"),
			}
		case MigrationErrorCause.UNKNOWN:
		case MigrationErrorCause.POSTPONE:
		default:
			return {
				cause: cause,
				errorMessage: lang.getTranslation("migrationGenericError_msg", { "{errorCode}": cause }).text,
			}
	}
}

/** For callers that only have a stored error cause (e.g. `MailboxMigrationInformation.errorCode`), not a live `MigrationError`. */
export function migrationErrorCauseToReadableMigrationError(cause: MigrationErrorCause): ReadableMigrationError {
	return migrationErrorToReadableMigrationError(new MigrationError("", cause))
}

export class MigrationErrorHandler {
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
	 * @param migrationError to handle
	 * @param mailboxMigrationSyncStateId This has side effects that update the token.
	 *
	 * @param migrationCredentials
	 * @return shouldRetry, a value indicating whether the error was handled and import can be continued.
	 */
	public async handleMigrationError(
		migrationError: MigrationError,
		migrationCredentials?: MigrationCredentials,
		mailboxMigrationSyncStateId?: IdTuple,
	): Promise<MigrationErrorHandlerResult> {
		console.error("migration error occurred", migrationError)

		const readableMigrationError = migrationErrorToReadableMigrationError(migrationError)
		if (this.isAuthError(migrationError) && mailboxMigrationSyncStateId) {
			return {
				shouldRetry: await this.handleAuthError(mailboxMigrationSyncStateId),
				readableMigrationError: readableMigrationError,
			}
		} else if (this.isCertificateError(migrationError) && migrationCredentials) {
			const handleCertificateErrorResult = await this.handleCertificateError()
			if (handleCertificateErrorResult.result) {
				const { ignoreCertificateErrors, customCertificateData } = handleCertificateErrorResult.result
				const updatedMigrationCredentials = { ...migrationCredentials, ignoreCertificateErrors, customCertificateData }
				return {
					shouldRetry: true,
					updatedMigrationCredentials: updatedMigrationCredentials,
					readableMigrationError: readableMigrationError,
				}
			} else {
				return {
					shouldRetry: false,
					readableMigrationError: readableMigrationError,
				}
			}
		} else {
			return {
				shouldRetry: false,
				readableMigrationError: readableMigrationError,
			}
		}
	}

	async handleAuthError(mailboxMigrationSyncStateId: IdTuple) {
		const mailboxMigrationSyncState = await this.entityClient.load(MailboxMigrationSyncStateTypeRef, mailboxMigrationSyncStateId)
		const userMigrationInformation = await this.loadUserMigrationInfoForSyncState(mailboxMigrationSyncStateId)
		const mailboxMigrationCredential = getMailboxMigrationCredential(mailboxMigrationSyncState, userMigrationInformation)
		const isOAuth = mailboxMigrationCredential.provider !== MailboxMigrationProvider.Other

		if (isOAuth) {
			const oAuthConfig = getServerMigrationConfigForProvider(mailboxMigrationCredential.provider)?.oauthConfig
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
				throw new ProgrammingError("migration sync found no Oauth config")
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

	isMigrationError(e: any) {
		return !Number.isNaN(e.data?.cause)
	}

	isAuthError(e: MigrationError) {
		return this.isMigrationError(e) && e.data.cause === MigrationErrorCause.AUTH_FAILED
	}

	isCertificateError(e: MigrationError) {
		return this.isMigrationError(e) && e.data.cause === MigrationErrorCause.CERT_ERROR
	}

	isGmailAllMailsIMAPDisabledError(e: MigrationError) {
		return this.isMigrationError(e) && e.data.cause === MigrationErrorCause.GMAIL_ALL_MAILS_IMAP_DISABLED
	}

	private async requestCredentialUpdate(mailboxMigrationSyncState: MailboxMigrationSyncState) {
		if (mailboxMigrationSyncState.status !== MailboxMigrationSyncStatus.SCHEDULED) {
			mailboxMigrationSyncState.status = MailboxMigrationSyncStatus.AUTH_ERROR
			// Updated to error state, which will cause an entity event
			await this.entityClient.update(mailboxMigrationSyncState)
		}
	}
}

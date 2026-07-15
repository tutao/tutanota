import { LoginState } from "../login/LoginViewModel.js"
import { InfoLink, lang, MaybeTranslation } from "../../../ui/utils/LanguageViewModel.js"
import { LoginController } from "../api/main/LoginController.js"
import { getLoginErrorStateAndMessage } from "../misc/LoginUtils.js"
import { SecondFactorHandler } from "../misc/2fa/SecondFactorHandler.js"
import { IServiceExecutor } from "../../../platform-kit/network/ServiceRequest.js"
import { EntityClient } from "../../../platform-kit/network/EntityClient.js"
import { PreconditionFailedError } from "@tutao/rest-client/error"
import type { NewSessionData } from "../../../platform-kit/base/facades/LoginFacade"
import { createSubscriptionRevocationServicePostIn, SubscriptionRevocationService, SurveyData } from "@tutao/entities/sys"

export type RevocationRequestError = "alreadyRevoked" | "noActiveSubscription" | "hasAppStoreSubscription" | "olderThanTwoWeeks" | "noPersonalPlan"

export class RevocationViewModel {
	mailAddress: string
	password: string
	acceptedRevocationRequest: boolean
	helpText: MaybeTranslation
	loginState: LoginState
	private temporarySession: NewSessionData | null

	constructor(
		private readonly loginController: LoginController,
		private readonly secondFactorHandler: SecondFactorHandler,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly entityClient: EntityClient,
	) {
		this.mailAddress = ""
		this.password = ""
		this.acceptedRevocationRequest = false
		this.helpText = "emptyString_msg"
		this.loginState = LoginState.NotAuthenticated
		this.temporarySession = null
	}

	async createSubscriptionRevocationRequest(surveyData: SurveyData | null = null): Promise<void> {
		await this.authenticate()
		if (this.loginState === LoginState.LoggedIn) {
			await this.revocationRequest(surveyData)
		}
	}

	/**
	 * Creates the subscription revocation request; assumes that the authentication was successful.
	 */
	private async revocationRequest(surveyData: SurveyData | null) {
		try {
			const inputData = createSubscriptionRevocationServicePostIn({ surveyData })
			await this.serviceExecutor.post(SubscriptionRevocationService, inputData, null)
			this.acceptedRevocationRequest = true
		} catch (e) {
			if (e instanceof PreconditionFailedError) {
				switch (e.data) {
					case "alreadyRevoked":
						this.onRevocationRequestFailed("revocationAlreadySubmitted_msg")
						break
					case "noActiveSubscription":
						this.onRevocationRequestFailed("terminationNoActiveSubscription_msg") // message is generic enough to work for both termination and revocation requests
						break
					case "hasAppStoreSubscription":
						this.onRevocationRequestFailed(
							lang.getTranslation("deleteAccountWithAppStoreSubscription_msg", { "{AppStorePayment}": InfoLink.AppStorePayment }),
						)
						break
					case "olderThanTwoWeeks":
						this.onRevocationRequestFailed("revocationPeriodEnded_msg")
						break
					case "noPersonalPlan":
						this.onRevocationRequestFailed("revocationOnlyPersonalPlans_msg")
						break
					default:
						throw e
				}
			} else {
				throw e
			}
		} finally {
			try {
				if (this.temporarySession != null) {
					await this.loginController
						.deleteSession(this.temporarySession.credentials.accessToken)
						.catch((e) => console.log("Error ignored on Logout:", e))
				}
			} finally {
				this.temporarySession = null
				await this.loginController.logout(false)
			}
			this.loginState = LoginState.NotAuthenticated
		}
	}

	private onRevocationRequestFailed(errorMessage: MaybeTranslation) {
		this.helpText = errorMessage
	}

	private onAuthentication() {
		this.helpText = "emptyString_msg"
		this.loginState = LoginState.LoggedIn
	}

	private onError(helpText: MaybeTranslation, state: LoginState) {
		this.helpText = helpText
		this.loginState = state
	}

	async authenticate(): Promise<void> {
		const mailAddress = this.mailAddress
		const password = this.password

		if (mailAddress === "" || password === "") {
			this.onError("loginFailed_msg", LoginState.InvalidCredentials)
			return
		}
		this.helpText = "emptyString_msg"
		try {
			this.temporarySession = await this.loginController.createTemporarySessionOnly(mailAddress, password)
			this.onAuthentication()
		} catch (e) {
			const { errorMessage, state } = getLoginErrorStateAndMessage(e)
			this.onError(errorMessage, state)
		} finally {
			await this.secondFactorHandler.closeWaitingForSecondFactorDialog()
		}
	}
}

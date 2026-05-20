import { SessionType } from "../../../platform-kit/app-env"

export type LoggedInEvent = {
	readonly sessionType: SessionType
	readonly userId: Id
}

export interface PostLoginAction {
	/** Partial login is achieved with getting the user, can happen offline. The login will wait for the returned promise. */
	onPartialLoginSuccess(loggedInEvent: LoggedInEvent): Promise<void>

	/** Full login is achieved with getting group keys. Can do service calls from this point on. */
	onFullLoginSuccess(loggedInEvent: LoggedInEvent): Promise<void>
}

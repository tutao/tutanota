import { SessionType } from "@tutao/app-env"
import { Nullable } from "@tutao/lang-api"

export interface SessionTypeProvider {
	getSessionType(): Promise<Nullable<SessionType>>
}

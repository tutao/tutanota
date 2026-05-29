import { SessionType } from "@tutao/app-env"

export interface SessionTypeProvider {
	getSessionType(): Promise<SessionType | null>
}

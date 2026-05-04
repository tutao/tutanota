import { OfflineIndicatorAttrs } from "./base/OfflineIndicator"

export interface IOfflineIndicatorViewModel {
	getProgress(): number
	getCurrentAttrs(): OfflineIndicatorAttrs
}

/**
 * The structure that defines which messages may be sent with our InterWindowEventBus
 */
export interface InterWindowEventTypes {
	logout: {
		userId: Id
	}
}
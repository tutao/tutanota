/**
 * The structure that defines which messages may be sent with our InterWindowEventBus
 */
export interface InterWindowEventTypes {
	credentialsDeleted: {
		userId: Id
	},
	outOfSync: {
		userId: Id
	}
}
export interface PreLogoutAction {
	onBeforeLogout(): Promise<void>
}

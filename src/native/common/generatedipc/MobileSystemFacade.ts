/* generated file, don't edit. */

import { PermissionType } from "./PermissionType.js"
/**
 * Common operations implemented by each mobile platform.
 */
export interface MobileSystemFacade {
	/**
	 * Redirect the user to Phone's Settings
	 */
	goToSettings(): Promise<void>

	/**
	 * Open URI in the OS.
	 */
	openLink(uri: string): Promise<boolean>

	/**
	 * Share the text via OS sharing mechanism.
	 */
	shareText(text: string, title: string): Promise<boolean>

	/**
	 * Returns whether the specified system permission has already been granted by the user.
	 */
	hasPermission(permission: PermissionType): Promise<boolean>

	/**
	 * Requests a system permission from the user.
	 */
	requestPermission(permission: PermissionType): Promise<void>
}

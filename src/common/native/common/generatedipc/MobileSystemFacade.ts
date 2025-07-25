/* generated file, don't edit. */

import { PermissionType } from "./PermissionType.js"
import { AppLockMethod } from "./AppLockMethod.js"
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

	getAppLockMethod(): Promise<AppLockMethod>

	setAppLockMethod(method: AppLockMethod): Promise<void>

	enforceAppLock(method: AppLockMethod): Promise<void>

	getSupportedAppLockMethods(): Promise<ReadonlyArray<AppLockMethod>>

	openMailApp(query: string): Promise<void>

	openCalendarApp(query: string): Promise<void>

	/**
	 * Returns the date and time the app was installed as a string with milliseconds in UNIX epoch.
	 */
	getInstallationDate(): Promise<string>

	/**
	 * Requests the system in-app rating dialog to be displayed
	 */
	requestInAppRating(): Promise<void>

	/**
	 * Sends a refresh signal to the native side, updating widget last sync
	 */
	requestWidgetRefresh(): Promise<void>

	/**
	 * Sends the URL from the remote origin to be stored on the device
	 */
	storeServerRemoteOrigin(origin: string): Promise<void>

	print(): Promise<void>
}

import {IncomingMessage} from "electron"

/**
 * this file is highly inaccurate, check the docs at electronjs.org
 */

type NotificationConstructorOptions = {
	/**
	 * A title for the notification, which will be shown at the top of the notification
	 * window when it is shown.
	 */
	title: string;
	/**
	 * A subtitle for the notification, which will be displayed below the title.
	 */
	subtitle?: string;
	/**
	 * The body text of the notification, which will be displayed below the title or
	 * subtitle.
	 */
	body: string;
	/**
	 * Whether or not to emit an OS notification noise when showing the notification.
	 */
	silent?: boolean;
	/**
	 * An icon to use in the notification.
	 */
	icon?: (string) | (NativeImage);
	/**
	 * Whether or not to add an inline reply option to the notification.
	 */
	hasReply?: boolean;
	/**
	 * The placeholder to write in the inline reply input field.
	 */
	replyPlaceholder?: string;
	/**
	 * The name of the sound file to play when the notification is shown.
	 */
	sound?: string;
	/**
	 * Actions to add to the notification. Please read the available actions and
	 * limitations in the NotificationAction documentation.
	 */
	actions?: NotificationAction[];
	/**
	 * A custom title for the close button of an alert. An empty string will cause the
	 * default localized text to be used.
	 */
	closeButtonText?: string;
}


declare module 'electron' {
	declare export var app: App;
	declare export var net: {
		request: (string) => ClientRequest;
	};
	declare export var remote: any;
	declare export var screen: ElectronScreen;
	declare export var webFrame: WebFrame;
	declare export var dialog: ElectronDialog;
	declare export var globalShortcut: {
		register(shortcut: string, cb: Function): void;
		unregister(shortcut: string): void;
	};
	declare export var ipcRenderer: any;
	declare export var ipcMain: any;
	declare export var nativeImage: {
		// https://electronjs.org/docs/api/native-image
		createEmpty(): NativeImage;
		createFromPath(string): NativeImage;
		createFromBuffer(Buffer, opts?: {width: number, height: number, scaleFactor: number}): NativeImage;
	};
	declare export var shell: {
		// Open the given external protocol URL in the desktop's default manner.
		// (For example, mailto: URLs in the user's default mail agent).
		openExternal(url: string): void;
		showItemInFolder(fullPath: string): void;
		// Open the given file in the desktop's default manner.
		openItem(fullPath: string): boolean;
	};

	declare export type NativeImage = {};

	declare export type Rectangle = {|
		x: number,
		y: number,
		width: number,
		height: number
	|};

	declare export type IncomingMessage = {
		on('error' | 'data' | 'end', (any) => void): IncomingMessage,
	}

	declare export class Menu {
		// https://electronjs.org/docs/api/menu
		constructor(): Menu;
		popup(opts?: {window: BrowserWindow, x: number, y: number, positioningItem: number, callback: Function}): void;
		append(MenuItem): void;
		static setApplicationMenu(Menu | null): void;
		static getApplicationMenu(): Menu | null;
	}

	declare export class App {
		on(AppEvent, (Event, ...Array<any>) => void): App,
		once(AppEvent, (Event, ...Array<any>) => void): App,
		requestSingleInstanceLock(): void,
		quit(): void,
		exit(code: number): void,
		relaunch({args: Array<string>, execPath?: string}): void,
		getVersion(): string,
		getName(): string,
		setPath(name: string, path: string): void;
		getLoginItemSettings(opts?: {path: string, args: string}): {
			openAtLogin: boolean,
			openAsHidden: boolean,
			wasOpenedAtLogin: boolean,
			restoreState: boolean
		};
		setLoginItemSettings({
			                     openAtLogin?: boolean,
			                     openAsHidden?: boolean,
			                     path?: string,
			                     args?: string
		                     }): void;
		getAppPath(): string;
		getPath(name: 'home'
			| 'appData' //Per-user application data directory
			| 'userData' // directory for your app's configuration files, by default it is appData + app name.
			| 'temp' //Temporary directory.
			| 'exe' // The current executable file.
			| 'module' // The libchromiumcontent library.
			| 'desktop' // The current user's Desktop directory.
			| 'documents' // Directory for a user's "My Documents".
			| 'downloads' // Directory for a user's downloads.
			| 'music' // Directory for a user's music.
			| 'pictures'// Directory for a user's pictures.
			| 'videos' //Directory for a user's videos.
			| 'logs' // Directory for your app's log folder.
			| 'pepperFlashSystemPlugin'// Full path to the system version of the Pepper Flash plugin.
		): string,
		setAppUserModelId(string): void,
		isDefaultProtocolClient(protocol: string, path?: string, args?: [string]): boolean,
		setAsDefaultProtocolClient(protocol: string, path?: string, args?: [string]): boolean,
		removeAsDefaultProtocolClient(protocol: string, path?: string, args?: [string]): boolean,
		hide(): void,
		dock: Dock,
	}

	declare export class ElectronDialog {
		showMessageBox(browserWindow: ?BrowserWindow, options: MessageBoxOptions, cb: ?((response: number, checkboxChecked: boolean) => void)): ?number,
		showOpenDialog(browserWindow: ?BrowserWindow, options: OpenDialogOptions, cb: ?((paths: Array<strings>) => void)): ?Array<string>
	}

	declare export type OpenDialogOptions = {
		title?: string,
		defaultPath?: string,
		buttonLabel?: string,
		filters?: Array<{name: string, extensions: Array<string>}>,
		properties: Array<'openFile' | 'openDirectory' | 'multiSelection' | 'showHiddenFiles'>,
	}

	declare export type MessageBoxOptions = {
		// type of the message box
		type: "none" | "info" | "error" | "question" | "warning",
		// array of button labels
		buttons: Array<string>,
		// Index of the button in the buttons array which will be selected by default when the message box opens.
		defaultId: number,
		// Title of the message box, some platforms will not show it.
		title?: string,
		// Content of the message box.
		message: string,
		// Extra information of the message.
		detail?: string,
		// If provided, the message box will include a checkbox with the given label.
		// The checkbox state can be inspected only when using callback.
		checkboxLabel?: string,
		// Initial checked state of the checkbox. false by default.
		checkboxChecked?: boolean,
		icon?: NativeImage,
		// The index of the button to be used to cancel the dialog, via the Esc key.
		// By default this is assigned to the first button with "cancel" or "no" as the label.
		// If no such labeled buttons exist and this option is not set, 0 will be used
		// as the return value or callback response.
		cancelId?: number,
		// On Windows Electron will try to figure out which one of the buttons are common
		// buttons(like "Cancel" or "Yes"), and show the others as command links in the
		// dialog. This can make the dialog appear in the style of modern Windows apps.
		// If you don't like this behavior, you can set noLink to true.
		noLink?: boolean,
		// Normalize the keyboard access keys across platforms. Default is false.
		// Enabling this assumes & is used in the button labels for the placement
		// of the keyboard shortcut access key and labels will be converted so
		// they work correctly on each platform, & characters are removed on
		// macOS, converted to _ on Linux, and left untouched on Windows. For
		// example, a button label of Vie&w will be converted to Vie_w on Linux
		// and View on macOS and can be selected via Alt-W on Windows and Linux.
		normalizeAccessKeys?: boolean
	}

	declare export type Dock = {
		setMenu(Menu): void,
		bounce(): void,
		isVisible(): boolean;
		hide(): void,
		show(): void,
	}

	declare export type ElectronScreen = {
		on(event: 'display-added' | 'display-removed', (ev: Event, display: Display) => void): void;
		on(event: 'display-metrics-changed', (ev: Event, changedMetrics: Array<'bounds' | 'workArea' | 'scaleFactor' | 'rotation'>) => void): void;
		getAllDisplays(): Array<Display>;
		getDisplayMatching(rect: Rectangle): Display;
	}

	declare export type Display = {|
		id: number,
		rotation: number,
		scaleFactor: number,
		touchSupport: 'available' | 'unavailable' | 'unknown',
		bounds: Rectangle,
		size: {width: number, height: number},
		workArea: Rectangle,
		workAreaSize: {width: number, height: number},
	|}

	declare export class MenuItem {
		// https://electronjs.org/docs/api/menu-item
		constructor(opts: {
			click?: Function,
			menuItem?: MenuItem,
			browserWindow?: BrowserWindow,
			event?: Event,
			role?: string,
			type?: string,
			label?: string,
			sublabel?: string,
			accelerator?: string,
			icon?: NativeImage | string,
			enabled?: boolean,
			visible?: boolean,
			checked?: boolean,
			registerAccelerator?: boolean,
			id?: string,
			before?: string,
			after?: string,
			beforeGroupContaining?: string,
			afterGroupContaining?: string,
		}): MenuItem;
	}

	declare export class BrowserWindow {
		// https://github.com/electron/electron/blob/master/docs/api/browser-window.md#new-browserwindowoptions
		constructor(any): BrowserWindow;
		on(BrowserWindowEvent, (Event, ...Array<any>) => void): BrowserWindow;
		once(BrowserWindowEvent, (Event, ...Array<any>) => void): BrowserWindow;
		focus(): void;
		hide(): void;
		close(): void;
		destroy(): void;
		restore(): void;
		show(): void;
		showInactive(): void;
		maximize(): void;
		unmaximize(): void;
		isMaximized(): boolean;
		loadFile(string): void;
		loadURL(string): void;
		minimize(): void;
		isMinimized(): boolean;
		isFocused(): boolean;
		isFullScreen(): boolean;
		isDestroyed(): boolean;
		setFullScreen(boolean): void;
		isVisible(): boolean;
		isSimpleFullScreen(): boolean;
		setSimpleFullScreen(boolean): void;
		setFullScreen(boolean): void;
		isFocused(): boolean;
		openDevTools(): void;
		getTitle(): string;
		getBounds(): Rectangle;
		setBounds(Rectangle): void;
		getContentBounds(): Rectangle;
		setContentBounds(Rectangle): void;
		center(): void;
		setMenuBarVisibility(boolean): void;
		setMinimumSize(width: number, height: number): void;
		getPosition(): number[];
		setPosition(x: number, y: number): void;
		setMenu(menu: Menu | null): void;
		webContents: WebContents;
		id: number;

		static fromId(number): BrowserWindow;
	}

	declare export class Tray {
		// https://electronjs.org/docs/api/tray
		constructor(string | NativeImage): Tray;
		destroy(): void;
		setImage(string | NativeImage): void;
		setPressedImage(string | NativeImage): void;
		setTooltip(string): void;
		setTitle(string): void;
		setContextMenu(Menu | null): void;
		on(TrayEvent, (Event, ...Array<any>) => void): Tray;
	}

	declare class EventEmitter {
		addListener(event: string, listener: Function): this;
		on(event: string, listener: Function): this;
		once(event: string, listener: Function): this;
		removeListener(event: string, listener: Function): this;
		removeAllListeners(event?: string): this;
		setMaxListeners(n: number): this;
		getMaxListeners(): number;
		listeners(event: string): Function[];
		emit(event: string, ...args: any[]): boolean;
		listenerCount(type: string): number;
		prependListener(event: string, listener: Function): this;
		prependOnceListener(event: string, listener: Function): this;
		eventNames(): string[];
	}

	declare export class Notification extends EventEmitter {
		constructor(options: NotificationConstructorOptions): Notification;

		on(event: 'action', listener: (event: Event,
		                               /**
		                                * The index of the action that was activated.
		                                */
		                               index: number) => void): this;
		once(event: 'action', listener: (event: Event,
		                                 /**
		                                  * The index of the action that was activated.
		                                  */
		                                 index: number) => void): this;
		addListener(event: 'action', listener: (event: Event,
		                                        /**
		                                         * The index of the action that was activated.
		                                         */
		                                        index: number) => void): this;
		removeListener(event: 'action', listener: (event: Event,
		                                           /**
		                                            * The index of the action that was activated.
		                                            */
		                                           index: number) => void): this;
		/**
		 * Emitted when the notification is clicked by the user.
		 */
		on(event: 'click', listener: (event: Event) => void): this;
		once(event: 'click', listener: (event: Event) => void): this;
		addListener(event: 'click', listener: (event: Event) => void): this;
		removeListener(event: 'click', listener: (event: Event) => void): this;
		/**
		 * Emitted when the notification is closed by manual intervention from the user.
		 * This event is not guaranteed to be emitted in all cases where the notification
		 * is closed.
		 */
		on(event: 'close', listener: (event: Event) => void): this;
		once(event: 'close', listener: (event: Event) => void): this;
		addListener(event: 'close', listener: (event: Event) => void): this;
		removeListener(event: 'close', listener: (event: Event) => void): this;
		/**
		 * Emitted when the user clicks the "Reply" button on a notification with hasReply:
		 * true.
		 */
		on(event: 'reply', listener: (event: Event,
		                              /**
		                               * The string the user entered into the inline reply field.
		                               */
		                              reply: string) => void): this;
		once(event: 'reply', listener: (event: Event,
		                                /**
		                                 * The string the user entered into the inline reply field.
		                                 */
		                                reply: string) => void): this;
		addListener(event: 'reply', listener: (event: Event,
		                                       /**
		                                        * The string the user entered into the inline reply field.
		                                        */
		                                       reply: string) => void): this;
		removeListener(event: 'reply', listener: (event: Event,
		                                          /**
		                                           * The string the user entered into the inline reply field.
		                                           */
		                                          reply: string) => void): this;
		/**
		 * Emitted when the notification is shown to the user, note this could be fired
		 * multiple times as a notification can be shown multiple times through the show()
		 * method.
		 */
		on(event: 'show', listener: (event: Event) => void): this;
		once(event: 'show', listener: (event: Event) => void): this;
		addListener(event: 'show', listener: (event: Event) => void): this;
		removeListener(event: 'show', listener: (event: Event) => void): this;
		static isSupported(): boolean;
		/**
		 * Dismisses the notification.
		 */
		close(): void;
		/**
		 * Immediately shows the notification to the user, please note this means unlike
		 * the HTML5 Notification implementation, instantiating a new Notification does not
		 * immediately show it to the user, you need to call this method before the OS will
		 * display it. If the notification has been shown before, this method will dismiss
		 * the previously shown notification and create a new one with identical
		 * properties.
		 */
		show(): void;
	}

	declare export class WebContents {
		on(WebContentsEvent, (Event, ...Array<any>) => void): WebContents;
		once(WebContentsEvent, (Event, ...Array<any>) => void): WebContents;
		send(string, any): void;
		session: ElectronSession;
		getURL(): string;
		getTitle(): string;
		getZoomFactor((factor: number) => void): void;
		setZoomFactor(factor: number): void;
		openDevTools(opts?: {|mode: string|}): void;
		isDevToolsOpened(): boolean;
		isDestroyed(): boolean;
		closeDevTools(): void;
		goBack(): void;
		goForward(): void;
		print(): void;
		toggleDevTools(): void;
		reloadIgnoringCache(): void;
		executeJavaScript(code: string): Promise<any>;
		findInPage(searchstring: string, opts: {forward: boolean, matchCase: boolean}): void;
		stopFindInPage(action: "clearSelection" | "keepSelection" | "activateSelection"): void;
	}

	declare export class WebFrame {
		getZoomFactor(): number;
		setZoomFactor(factor: number): void;
	}

	declare export type ElectronSession = {
		setPermissionRequestHandler: (PermissionRequestHandler | null) => void;
		on: (event: ElectronSessionEvent, (ev: Event, item: DownloadItem, webContents: WebContents) => void) => void;
		removeAllListeners: (event: ElectronSessionEvent) => ElectronSession;
	}

	declare export type DownloadItem = {
		on('done' | 'updated', (event: Event, state: string) => void): DownloadItem;
		setSavePath: (path: string) => void;
		getSavePath: () => string;
		getFilename: () => string;
		pause: () => void;
		resume: () => void;
	}

	declare export type PermissionRequestHandler = (WebContents, ElectronPermission, (boolean) => void) => void;
	declare export type ElectronPermission
		= 'media'
		| 'geolocation'
		| 'notifications'
		| 'midiSysex'
		| 'pointerLock'
		| 'fullscreen'
		| 'openExternal';
	declare export type ElectronSessionEvent
		= 'will-download';
}


declare type ClientRequest = {
	on('error' | 'response' | 'information' | 'connect' | 'timeout', (Error & IncomingMessage)=>void): ClientRequest,
	end(): void,
	abort(): void,
};

declare module 'electron-updater' {
	declare export var autoUpdater: AutoUpdater
}

declare module 'electron-localshortcut' {
	declare module .exports: {
		register(win?: BrowserWindow, shortcut: string, cb: Function): void;
		unregister(shortcut: string): void;
		isRegistered(shortcut: string): boolean;
		unregisterAll(): void;
		enableAll(win?: BrowserWindow): void;
		disableAll(win?: BrowserWindow): void;
	}
;
}


declare class AutoUpdater {
	on: (AutoUpdaterEvent, (Event, ...Array<any>) => void) => AutoUpdater;
	removeAllListeners: (AutoUpdaterEvent) => AutoUpdater;
	logger: ?{
		info: (string) => void,
		debug: (string) => void,
		verbose: (string) => void,
		error: (string) => void,
		warn: (string) => void,
		silly: (string) => void
	};
	checkForUpdatesAndNotify(): Promise<any>;
	checkForUpdates(): Promise<UpdateCheckResult>;
	getUpdateInfo(): Promise<UpdateInfo>;
	downloadUpdate(): Promise<any>;
	quitAndInstall(isSilent?: boolean, isForceRunAfter?: boolean): void;
	autoInstallOnAppQuit: boolean;
	downloadedUpdateHelper: any;
	currentVersion: SemVer;
	autoDownload: boolean;
}

// https://electronjs.org/docs/api/structures/notification-action
export type NotificationAction = {|
	type: string,
	text?: string
|}

export type UpdateCheckResult = {
	updateInfo: UpdateInfo,
	downloadPromise: Promise<Array<string>>,
	cancellationToken: CancellationToken
}

declare type UpdateInfo = {
	version: string,
	files: Array<UpdateFileInfo>,
	path: string,
	sha512: string,
	releaseName: string,
	releaseNotes: string,
	releaseDate: string,
	stagingPercentage: number,
	signature: string
}

export type SemVer = {
	raw: string,
	major: number,
	minor: number,
	patch: number,
	version: string
}

export type CancellationToken = {
	cancel(): void,
	onCancel(Function): void
}

export type UpdateFileInfo = {
	url: string
}

// https://github.com/electron/electron/blob/master/docs/api/app.md#events
export type AppEvent
	= 'will-finish-launching'
	| 'ready'
	| 'second-instance'
	| 'activate'
	| 'window-all-closed'
	| 'before-quit'
	| 'will-quit'
	| 'open-file'
	| 'open-url'
	| 'continue-activity'
	| 'will-continue-activity'
	| 'continue-activity-error'
	| 'activity-was-continued'
	| 'update-activity-state'
	| 'new-window-for-tab'
	| 'browser-window-blur'
	| 'browser-window-focus'
	| 'browser-window-created'
	| 'web-contents-created'
	| 'certificate-error'
	| 'select-client-certificate'
	| 'login'
	| 'gpu-process-crashed'
	| 'accessibility-support-changed'
	| 'session-created'


// https://github.com/electron/electron/blob/master/docs/api/browser-window.md#instance-events
export type BrowserWindowEvent
	= 'page-title-updated'
	| 'close'
	| 'closed'
	| 'session-end'
	| 'unresponsive'
	| 'responsive'
	| 'blur'
	| 'focus'
	| 'show'
	| 'hide'
	| 'ready-to-show'
	| 'maximize'
	| 'unmaximize'
	| 'minimize'
	| 'restore'
	| 'will-resize'
	| 'resize'
	| 'will-move'
	| 'move'
	| 'moved'
	| 'enter-full-screen'
	| 'leave-full-screen'
	| 'enter-html-full-screen'
	| 'leave-html-full-screen'
	| 'always-on-top-changed'
	| 'app-command'
	| 'scroll-touch-begin'
	| 'scroll-touch-end'
	| 'scroll-touch-edge'
	| 'swipe'
	| 'sheet-begin'
	| 'sheet-end'
	| 'new-window-for-tab'

// https://github.com/electron/electron/blob/master/docs/api/web-contents.md#instance-events
export type WebContentsEvent
	= 'did-finish-load'
	| 'did-fail-load'
	| 'did-frame-finish-load'
	| 'did-start-loading'
	| 'did-stop-loading'
	| 'dom-ready'
	| 'page-favicon-updated'
	| 'new-window'
	| 'will-navigate'
	| 'did-start-navigation'
	| 'will-redirect'
	| 'did-redirect-navigation'
	| 'did-navigate'
	| 'did-frame-navigate'
	| 'did-navigate-in-page'
	| 'will-prevent-unload'
	| 'crashed'
	| 'unresponsive'
	| 'responsive'
	| 'plugin-crashed'
	| 'destroyed'
	| 'before-input-event'
	| 'devtools-opened'
	| 'devtools-closed'
	| 'devtools-focused'
	| 'certificate-error'
	| 'select-client-certificate'
	| 'login'
	| 'found-in-page'
	| 'media-started-playing'
	| 'media-paused'
	| 'did-change-theme-color'
	| 'update-target-url'
	| 'cursor-changed'
	| 'context-menu'
	| 'select-bluetooth-device'
	| 'paint'
	| 'devtools-reload-page'
	| 'will-attach-webview'
	| 'did-attach-webview'
	| 'console-message'

export type AutoUpdaterEvent
	= 'error'
	| 'checking-for-update'
	| 'update-available'
	| 'update-not-available'
	| 'download-progress'
	| 'update-downloaded'

export type TrayEvent
	= 'click'


declare module 'fs-extra' {
	declare export default any;
	//declare export var fs: any;
}

declare module 'bluebird' {
	declare export default any;
}

declare module 'request' {
	declare export default any;
}

declare module 'https' {
	declare module .exports: {
		request: (url: string, options: any, callback: ?() => void)=> ClientRequest;
	}
}

declare module 'http' {
	declare module .exports: {
		request: (url: string, options: any, callback: ?() => void)=> ClientRequest;
	}
}

declare module 'node-forge' {
	declare export default any;
}

declare module 'winreg' {
	declare export default any;
}

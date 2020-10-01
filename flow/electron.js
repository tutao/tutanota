import {IncomingMessage} from "electron"
import {ElectronHttpExecutor} from "electron-updater/out/electronHttpExecutor"

/**
 * this file is highly inaccurate, check the docs at electronjs.org
 */

declare module 'electron' {
	declare export var app: App;
	declare export var net: {
		request: (string) => ClientRequest;
	};
	declare export var remote: any;
	declare export var screen: ElectronScreen;
	declare export var webFrame: WebFrame;
	declare export var clipboard: ClipBoard;
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
		openPath(fullPath: string): Promise<string>;
	};

	declare export type NativeImage = {};

	declare export type Rectangle = {|
		x: number,
		y: number,
		width: number,
		height: number
	|};

	declare export type ClipBoard = {
		writeText(string): void;
	}

	declare export type ContextMenuParams = {
		linkURL: string,
		editFlags: {
			canCut: boolean,
			canPaste: boolean,
			canCopy: boolean,
			canUndo: boolean,
			canRedo: boolean
		}
	}

	declare export type IncomingMessage = {
		on('error' | 'data' | 'end', (any) => void): IncomingMessage,
	}

	// tutao: our own definitions to make it more readable
	declare type MenuItemRole = 'undo'
		| 'redo'
		| 'cut'
		| 'copy'
		| 'paste'
		| 'pasteAndMatchStyle'
		| 'delete'
		| 'selectAll'
		| 'reload'
		| 'forceReload'
		| 'toggleDevTools'
		| 'resetZoom'
		| 'zoomIn'
		| 'zoomOut'
		| 'togglefullscreen'
		| 'window'
		| 'minimize'
		| 'close'
		| 'help'
		| 'about'
		| 'services'
		| 'hide'
		| 'hideOthers'
		| 'unhide'
		| 'quit'
		| 'startSpeaking'
		| 'stopSpeaking'
		| 'close'
		| 'minimize'
		| 'zoom'
		| 'front'
		| 'appMenu'
		| 'fileMenu'
		| 'editMenu'
		| 'viewMenu'
		| 'recentDocuments'
		| 'toggleTabBar'
		| 'selectNextTab'
		| 'selectPreviousTab'
		| 'mergeAllWindows'
		| 'clearRecentDocuments'
		| 'moveTabToNewWindow'
		| 'windowMenu'
		| 'startSpeaking'
		| 'stopSpeaking'

	// should be a "type" instead probably
	declare export interface MenuItemConstructorOptions {
		/**
		 * Will be called with `click(menuItem, browserWindow, event)` when the menu item
		 * is clicked.
		 */
		+click?: (menuItem: MenuItem, browserWindow: BrowserWindow, event: KeyboardEvent) => void;
		/**
		 * Can be `undo`, `redo`, `cut`, `copy`, `paste`, `pasteAndMatchStyle`, `delete`,
		 * `selectAll`, `reload`, `forceReload`, `toggleDevTools`, `resetZoom`, `zoomIn`,
		 * `zoomOut`, `togglefullscreen`, `window`, `minimize`, `close`, `help`, `about`,
		 * `services`, `hide`, `hideOthers`, `unhide`, `quit`, `startSpeaking`,
		 * `stopSpeaking`, `close`, `minimize`, `zoom`, `front`, `appMenu`, `fileMenu`,
		 * `editMenu`, `viewMenu`, `recentDocuments`, `toggleTabBar`, `selectNextTab`,
		 * `selectPreviousTab`, `mergeAllWindows`, `clearRecentDocuments`,
		 * `moveTabToNewWindow` or `windowMenu` - Define the action of the menu item, when
		 * specified the `click` property will be ignored. See roles.
		 */
		role?: MenuItemRole;
		/**
		 * Can be `normal`, `separator`, `submenu`, `checkbox` or `radio`.
		 */
		type?: ('normal' | 'separator' | 'submenu' | 'checkbox' | 'radio');
		label?: string;
		sublabel?: string;
		/**
		 * Hover text for this menu item.
		 *
		 * @platform darwin
		 */
		toolTip?: string;
		accelerator?: Accelerator;
		icon?: (NativeImage) | (string);
		/**
		 * If false, the menu item will be greyed out and unclickable.
		 */
		enabled?: boolean;
		/**
		 * default is `true`, and when `false` will prevent the accelerator from triggering
		 * the item if the item is not visible`.
		 *
		 * @platform darwin
		 */
		acceleratorWorksWhenHidden?: boolean;
		/**
		 * If false, the menu item will be entirely hidden.
		 */
		visible?: boolean;
		/**
		 * Should only be specified for `checkbox` or `radio` type menu items.
		 */
		checked?: boolean;
		/**
		 * If false, the accelerator won't be registered with the system, but it will still
		 * be displayed. Defaults to true.
		 *
		 * @platform linux,win32
		 */
		registerAccelerator?: boolean;
		/**
		 * Should be specified for `submenu` type menu items. If `submenu` is specified,
		 * the `type: 'submenu'` can be omitted. If the value is not a `Menu` then it will
		 * be automatically converted to one using `Menu.buildFromTemplate`.
		 */
		submenu?: (MenuItemConstructorOptions[]) | (Menu);
		/**
		 * Unique within a single menu. If defined then it can be used as a reference to
		 * this item by the position attribute.
		 */
		id?: string;
		/**
		 * Inserts this item before the item with the specified label. If the referenced
		 * item doesn't exist the item will be inserted at the end of  the menu. Also
		 * implies that the menu item in question should be placed in the same “group” as
		 * the item.
		 */
		before?: string[];
		/**
		 * Inserts this item after the item with the specified label. If the referenced
		 * item doesn't exist the item will be inserted at the end of the menu.
		 */
		after?: string[];
		/**
		 * Provides a means for a single context menu to declare the placement of their
		 * containing group before the containing group of the item with the specified
		 * label.
		 */
		beforeGroupContaining?: string[];
		/**
		 * Provides a means for a single context menu to declare the placement of their
		 * containing group after the containing group of the item with the specified
		 * label.
		 */
		afterGroupContaining?: string[];
	}

	declare export class Menu {
		// https://electronjs.org/docs/api/menu
		constructor(): Menu;
		items: MenuItem[];
		popup(opts?: {window: BrowserWindow, x: number, y: number, positioningItem: number, callback: Function}): void;
		append(MenuItem): void;
		static setApplicationMenu(Menu | null): void;
		static getApplicationMenu(): Menu | null;
		static buildFromTemplate(template: Array<(MenuItemConstructorOptions) | (MenuItem)>): Menu;
	}

	declare export class App {
		on(AppEvent, (Event, ...Array<any>) => any): App,
		once(AppEvent, (Event, ...Array<any>) => any): App,
		emit(AppEvent): App,
		removeListener(AppEvent, Function): App,
		requestSingleInstanceLock(): void,
		quit(): void,
		exit(code: number): void,
		relaunch({args: Array<string>, execPath?: string}): void,
		getVersion(): string,
		isReady(): boolean,
		name: string,
		setPath(name: string, path: string): void;
		allowRendererProcessReuse: boolean;
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
		showMessageBox(
			parent: ?BrowserWindow,
			options: MessageBoxOptions
		): Promise<{response: number, checkboxChecked: boolean}>,
		showOpenDialog(browserWindow: ?BrowserWindow, options: OpenDialogOptions): Promise<{canceled: boolean, filePaths: string[]}>
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
		setBadge(text: string): void,
		isVisible(): boolean;
		hide(): void,
		show(): void,
	}

	declare export type FindInPageResult = {
		requestId: number,
		activeMatchOrdinal: number,
		matches: number,
		selectionArea: Rectangle,
		finalUpdate: boolean,
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
		click(): void;
		enabled: boolean;
	}

	declare export class BrowserWindow {
		// https://github.com/electron/electron/blob/master/docs/api/browser-window.md#new-browserwindowoptions
		constructor(any): BrowserWindow;
		on(BrowserWindowEvent, (Event, ...Array<any>) => void): BrowserWindow;
		once(BrowserWindowEvent, (Event, ...Array<any>) => void): BrowserWindow;
		emit(BrowserWindowEvent): void;
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
		loadURL(string): Promise<void>;
		minimize(): void;
		isMinimized(): boolean;
		isFocused(): boolean;
		isFullScreen(): boolean;
		isDestroyed(): boolean;
		setFullScreen(boolean): void;
		isVisible(): boolean;
		removeMenu(): void;
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

	declare export class Notification {
		constructor({|
			            title: string,
			            subtitle?: string,
			            body: string,
			            silent?: boolean,
			            icon?: string | NativeImage,
			            hasReply?: boolean,
			            replyPlaceholder?: string,
			            sound?: string,
			            actions?: [NotificationAction],
			            closeButtonText?: string
		            |}): Notification;
		on(DesktopNotificationEvent, (Event, ...Array<any>) => void): Notification;
		show(): void;
		close(): void;
		static isSupported(): boolean;
		removeAllListeners(event: DesktopNotificationEvent): Notification;
	}

	declare export type DragInfo = {files: string[] | string, icon?: NativeImage | string}

	declare export class WebContents {
		on(WebContentsEvent, (Event, ...Array<any>) => void): WebContents;
		once(WebContentsEvent, (Event, ...Array<any>) => void): WebContents;
		send(string, any): void;
		session: ElectronSession;
		getURL(): string;
		getTitle(): string;
		zoomFactor: number;
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
		findInPage(searchString: string, opts: {forward: boolean, matchCase: boolean}): void;
		stopFindInPage(action: "clearSelection" | "keepSelection" | "activateSelection"): void;
		copy(): void;
		cut(): void;
		paste(): void;
		undo(): void;
		redo(): void;
		startDrag(item: DragInfo): void;
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
		savePath: string;
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
	on('error' | 'response' | 'information' | 'connect' | 'timeout', (Error & IncomingMessage) => void): ClientRequest,
	end(): ClientRequest,
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
		unregisterAll(win?: BrowserWindow): void;
		enableAll(win?: BrowserWindow): void;
		disableAll(win?: BrowserWindow): void;
	}
;
}

// https://electronjs.org/docs/api/structures/notification-action
export type NotificationAction = {|
	type: string,
	text?: string
|}

declare class AutoUpdater {
	on: (AutoUpdaterEvent, (...Array<any>) => void) => AutoUpdater;
	once: (AutoUpdaterEvent, (...Array<any>) => void) => AutoUpdater;
	removeListener: (AutoUpdaterEvent, (...Array<any>) => void) => void;
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
	downloadUpdate(): Promise<Array<String>>; // paths of the dl'd assets
	quitAndInstall(isSilent?: boolean, isForceRunAfter?: boolean): void;
	autoInstallOnAppQuit: boolean;
	allowDowngrade: boolean;
	allowPrerelease: boolean;
	fullChangelog: boolean;
	updateInfoAndProvider: UpdateAndProviderInfo;
	checkForUpdatesPromise: Promise<UpdateCheckResult>;
	downloadedUpdateHelper: DownloadedUpdateHelper;
	currentVersion: SemVer;
	autoDownload: boolean;
	httpExecutor: ElectronHttpExecutor;
}

export type DownloadedUpdateHelper = {
	cacheDir: string; // absolute path
	versionInfo: UpdateInfo;
	fileInfo: {
		url: URL;
		info: UpdateFileInfo;
	};
}

export type UpdateAndProviderInfo = {
	info: UpdateInfo;
	configuration: UpdateConfig;
	provider: GenericProvider;
	executor: ElectronHttpExecutor;
	baseUrl: URL;
}

export type GenericProvider = {
	runtimeOptions: {
		isUseMultipleRangeRequest: boolean;
		platform: 'linux' | 'win32' | 'darwin';
		executor: ElectronHttpExecutor
	};
	requestHeaders: {[string]: string}
}

export type UpdateConfig = {
	provider: string,
	url: string,
	channel: string,
	publishAutoUpdate: boolean,
	updaterCacheDirName: string,
}

export type UpdateCheckResult = {
	versionInfo: UpdateInfo,
	updateInfo: UpdateInfo,
	cancellationToken?: CancellationToken;
	downloadPromise?: Promise<any>;
}

export type UpdateInfo = {
	version: string,
	files: Array<UpdateFileInfo>,
	path: string,
	sha512: string,
	releaseDate: string,
	signature: string,
}

export type SemVer = {
	raw: string,
	major: number,
	minor: number,
	patch: number,
	version: string,
	loose: boolean,
	includePrerelease: boolean,
}

export type DownloadProgressInfo = {
	total: number,
	delta: number,
	transferred: number,
	percent: number,
	bytesPerSecond: number
}

export type CancellationToken = {
	cancel(): void,
	onCancel(Function): void
}

export type UpdateFileInfo = {
	url: string;
	sha512: string;
	size: number;
	blockMapSize: number;
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
	| 'enable-force-quit'


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
	| 'did-start-navigation' // passed through from webContents

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
		request: (url: string, options: any, callback: ?() => void) => ClientRequest;
	}
}

declare module 'http' {
	declare module .exports: {
		request: (url: string, options: any, callback: ?() => void) => ClientRequest;
	}
}

declare module 'node-forge' {
	declare export default any;
}

declare module 'winreg' {
	declare export default any;
}

declare module 'keytar' {
	declare export function getPassword(service: string, account: string): Promise<?string>;

	declare export function setPassword(service: string, account: string, password: string): Promise<void>;

	declare export function deletePassword(service: string, account: string): Promise<boolean>;

	declare export function findCredentials(service: string): Promise<{account: string, password: string}>;

	declare export function findPassword(service: string): Promise<?string>;
}

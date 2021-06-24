/**
 * this file is highly inaccurate, check the docs at electronjs.org
 */

type Record<A, B> = {[A]: B}

// Little hack, we can"t override properties with event name (like on() or once()) but we need some other generic things
declare class EventEmitterStub {
	emit(event: string, ...args:Array<any>): boolean;
	removeAllListeners(event?: string): this;
}

declare module 'electron' {
	// It is declared as class Accelerator extends String for some reason in ts
	declare type Accelerator = string

	declare export var app: App;
	declare export var session: {
		defaultSession: ElectronSession
	}
	declare export var net: {
		request: (string) => ClientRequest;
	};
	declare export var remote: any;
	declare export var screen: ElectronScreen;
	declare export var webFrame: WebFrame;
	declare export var clipboard: ClipBoard;
	declare export var dialog: ElectronDialog;
	declare export var contextBridge: {
		exposeInMainWorld: (string, any) => void
	};
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
		createFromDataURL(string): NativeImage
	};
	declare export var shell: {
		// Open the given external protocol URL in the desktop's default manner.
		// (For example, mailto: URLs in the user's default mail agent).
		openExternal(url: string): void;
		showItemInFolder(fullPath: string): void;
		// Open the given file in the desktop's default manner.
		openPath(fullPath: string): Promise<string>;
	};

	declare export class NativeImage {
	}

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
		misspelledWord: string,
		dictionarySuggestions: Array<string>,
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
		| 'help'
		| 'about'
		| 'services'
		| 'hide'
		| 'hideOthers'
		| 'unhide'
		| 'quit'
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

	declare interface ProtocolRequest {

		// Docs: https://electronjs.org/docs/api/structures/protocol-request

		headers: Record<string, string>;
		method: string;
		referrer: string;
		uploadData?: UploadData[];
		url: string;
	}

	declare interface ProtocolResponse {

		// Docs: https://electronjs.org/docs/api/structures/protocol-response

		/**
		 * The charset of response body, default is `"utf-8"`.
		 */
		charset?: string;
		/**
		 * The response body. When returning stream as response, this is a Node.js readable
		 * stream representing the response body. When returning `Buffer` as response, this
		 * is a `Buffer`. When returning `String` as response, this is a `String`. This is
		 * ignored for other types of responses.
		 */
		data?: (Buffer) | (string) | (ReadableStream);
		/**
		 * When assigned, the `request` will fail with the `error` number . For the
		 * available error numbers you can use, please see the net error list.
		 */
		error?: number;
		/**
		 * An object containing the response headers. The keys must be String, and values
		 * must be either String or Array of String.
		 */
		headers?: Record<string, (string) | (string[])>;
		/**
		 * The HTTP `method`. This is only used for file and URL responses.
		 */
		method?: string;
		/**
		 * The MIME type of response body, default is `"text/html"`. Setting `mimeType`
		 * would implicitly set the `content-type` header in response, but if
		 * `content-type` is already set in `headers`, the `mimeType` would be ignored.
		 */
		mimeType?: string;
		/**
		 * Path to the file which would be sent as response body. This is only used for
		 * file responses.
		 */
		path?: string;
		/**
		 * The `referrer` URL. This is only used for file and URL responses.
		 */
		referrer?: string;
		/**
		 * The session used for requesting URL, by default the HTTP request will reuse the
		 * current session. Setting `session` to `null` would use a random independent
		 * session. This is only used for URL responses.
		 */
		session?: Session;
		/**
		 * The HTTP response code, default is 200.
		 */
		statusCode?: number;
		/**
		 * The data used as upload data. This is only used for URL responses when `method`
		 * is `"POST"`.
		 */
		uploadData?: ProtocolResponseUploadData;
		/**
		 * Download the `url` and pipe the result as response body. This is only used for
		 * URL responses.
		 */
		url?: string;
	}

	declare export class Menu {
		// https://electronjs.org/docs/api/menu
		constructor(): Menu;
		items: MenuItem[];
		popup(opts?: {window: BrowserWindow, x: number, y: number, positioningItem: number, callback: Function}): void;
		append(MenuItem): void;
		static setApplicationMenu(Menu | null): void;
		static getApplicationMenu(): Menu | null;
		static buildFromTemplate(template: $ReadOnlyArray<(MenuItemConstructorOptions) | (MenuItem)>): Menu;
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
		whenReady(): Promise<void>,
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
		showOpenDialog(browserWindow: ?BrowserWindow, options: OpenDialogOptions): Promise<{canceled: boolean, filePaths: string[]}>,
		showSaveDialog(browserWindow: ?BrowserWindow, options: SaveDialogOptions): Promise<{canceled: boolean, filePath?: string, bookmark?: string}>,
		showErrorBox(title: string, content: string): void,
	}

	declare export type OpenDialogOptions = {
		title?: string,
		defaultPath?: string,
		buttonLabel?: string,
		filters?: Array<{name: string, extensions: Array<string>}>,
		properties: Array<'openFile' | 'openDirectory' | 'multiSelection' | 'showHiddenFiles'>,
	}

	declare export type SaveDialogOptions = {
		title?: string,
		defaultPath?: string,
		// Incomplete
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
		on(BrowserWindowEvent, (Event, ...Array<any>) => mixed): BrowserWindow;
		once(BrowserWindowEvent, (Event, ...Array<any>) => mixed): BrowserWindow;
		emit(BrowserWindowEvent, ...Array<any>): void;
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
		setBackgroundColor(backgroundColor: string): void;
		webContents: WebContents;
		id: number;

		static fromId(number): BrowserWindow;
		static fromWebContents(WebContents): BrowserWindow;
		static getAllWindows(): Array<BrowserWindow>
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

	// events$EventEmitter is declared in node.js of flowlib.
	// I tried to import it but it doesn't work.

	declare export class Notification extends EventEmitterStub {
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
		on(event: 'action', listener: (event: Event,
		                               /**
		                                * The index of the action that was activated.
		                                */
		                               index: number) => void): this;
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
		 *
		 * This event is not guaranteed to be emitted in all cases where the notification
		 * is closed.
		 */
		on(event: 'close', listener: (event: Event) => void): this;

		once(event: 'close', listener: (event: Event) => void): this;

		addListener(event: 'close', listener: (event: Event) => void): this;

		removeListener(event: 'close', listener: (event: Event) => void): this;
		/**
		 * Emitted when the user clicks the "Reply" button on a notification with
		 * `hasReply: true`.
		 *
		 * @platform darwin
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
		 * multiple times as a notification can be shown multiple times through the
		 * `show()` method.
		 */
		on(event: 'show', listener: (event: Event) => void): this;

		once(event: 'show', listener: (event: Event) => void): this;

		addListener(event: 'show', listener: (event: Event) => void): this;

		removeListener(event: 'show', listener: (event: Event) => void): this;
		show(): void;
		close(): void;
		static isSupported(): boolean;
	}

	declare interface MessageDetails {
		/**
		 * The actual console message
		 */
		message: string;
		/**
		 * The version ID of the service worker that sent the log message
		 */
		versionId: number;
		/**
		 * The type of source for this message.  Can be `javascript`, `xml`, `network`,
		 * `console-api`, `storage`, `app-cache`, `rendering`, `security`, `deprecation`,
		 * `worker`, `violation`, `intervention`, `recommendation` or `other`.
		 */
		source: ('javascript' | 'xml' | 'network' | 'console-api' | 'storage' | 'app-cache' | 'rendering' | 'security' | 'deprecation' | 'worker' | 'violation' | 'intervention' | 'recommendation' | 'other');
		/**
		 * The log level, from 0 to 3. In order it matches `verbose`, `info`, `warning` and
		 * `error`.
		 */
		level: number;
		/**
		 * The URL the message came from
		 */
		sourceUrl: string;
		/**
		 * The line number of the source that triggered this console message
		 */
		lineNumber: number;
	}

	declare export type DragInfo = {files: string[] | string, icon?: NativeImage | string}

	declare export type WebContentsEvent = {+sender: WebContents, +preventDefault: ()=>void}

	declare export class WebContents {
		on(WebContentsEventType, (WebContentsEvent, ...Array<any>) => void): WebContents;
		once(WebContentsEventType, (WebContentsEvent, ...Array<any>) => void): WebContents;
		removeListener(WebContentsEventType, (WebContentsEvent, ...any) => void): WebContents;
		removeAllListeners(WebContentsEventType): WebContents;
		send(string, any): void;
		session: ElectronSession;
		getURL(): string;
		getTitle(): string;
		zoomFactor: number;
		id: number;
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
		setZoomFactor(f: number): void;
		getZoomFactor(): number;
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
		on: (event: ElectronSessionEvent, (ev: Event, item: DownloadItem, webContents: WebContents) => mixed) => void;
		removeAllListeners: (event: ElectronSessionEvent) => ElectronSession;
		setSpellCheckerDictionaryDownloadURL: (string) => void;
		setSpellCheckerLanguages: (Array<string>) => void;
		getSpellCheckerLanguages: () => Array<string>;
		availableSpellCheckerLanguages: Array<string>;
	}


	declare export class DownloadItem extends EventEmitterStub {

		// Docs: https://electronjs.org/docs/api/download-item

		/**
		 * Emitted when the download is in a terminal state. This includes a completed
		 * download, a cancelled download (via `downloadItem.cancel()`), and interrupted
		 * download that can't be resumed.
		 *
		 * The `state` can be one of following:
		 *
		 * * `completed` - The download completed successfully.
		 * * `cancelled` - The download has been cancelled.
		 * * `interrupted` - The download has interrupted and can not resume.
		 */
		on(event: 'done', listener: (event: Event,
		                             /**
		                              * Can be `completed`, `cancelled` or `interrupted`.
		                              */
		                             state: ('completed' | 'cancelled' | 'interrupted')) => void): this;

		once(event: 'done', listener: (event: Event,
		                               /**
		                                * Can be `completed`, `cancelled` or `interrupted`.
		                                */
		                               state: ('completed' | 'cancelled' | 'interrupted')) => void): this;

		addListener(event: 'done', listener: (event: Event,
		                                      /**
		                                       * Can be `completed`, `cancelled` or `interrupted`.
		                                       */
		                                      state: ('completed' | 'cancelled' | 'interrupted')) => void): this;

		removeListener(event: 'done', listener: (event: Event,
		                                         /**
		                                          * Can be `completed`, `cancelled` or `interrupted`.
		                                          */
		                                         state: ('completed' | 'cancelled' | 'interrupted')) => void): this;
		/**
		 * Emitted when the download has been updated and is not done.
		 *
		 * The `state` can be one of following:
		 *
		 * * `progressing` - The download is in-progress.
		 * * `interrupted` - The download has interrupted and can be resumed.
		 */
		on(event: 'updated', listener: (event: Event,
		                                /**
		                                 * Can be `progressing` or `interrupted`.
		                                 */
		                                state: ('progressing' | 'interrupted')) => void): this;

		once(event: 'updated', listener: (event: Event,
		                                  /**
		                                   * Can be `progressing` or `interrupted`.
		                                   */
		                                  state: ('progressing' | 'interrupted')) => void): this;

		addListener(event: 'updated', listener: (event: Event,
		                                         /**
		                                          * Can be `progressing` or `interrupted`.
		                                          */
		                                         state: ('progressing' | 'interrupted')) => void): this;

		removeListener(event: 'updated', listener: (event: Event,
		                                            /**
		                                             * Can be `progressing` or `interrupted`.
		                                             */
		                                            state: ('progressing' | 'interrupted')) => void): this;
		/**
		 * Cancels the download operation.
		 */
		cancel(): void;
		/**
		 * Whether the download can resume.
		 */
		canResume(): boolean;
		/**
		 * The Content-Disposition field from the response header.
		 */
		getContentDisposition(): string;
		/**
		 * ETag header value.
		 */
		getETag(): string;
		/**
		 * The file name of the download item.
		 *
		 * **Note:** The file name is not always the same as the actual one saved in local
		 * disk. If user changes the file name in a prompted download saving dialog, the
		 * actual name of saved file will be different.
		 */
		getFilename(): string;
		/**
		 * Last-Modified header value.
		 */
		getLastModifiedTime(): string;
		/**
		 * The files mime type.
		 */
		getMimeType(): string;
		/**
		 * The received bytes of the download item.
		 */
		getReceivedBytes(): number;
		/**
		 * Returns the object previously set by
		 * `downloadItem.setSaveDialogOptions(options)`.
		 */
		getSaveDialogOptions(): SaveDialogOptions;
		/**
		 * The save path of the download item. This will be either the path set via
		 * `downloadItem.setSavePath(path)` or the path selected from the shown save
		 * dialog.
		 */
		getSavePath(): string;
		/**
		 * Number of seconds since the UNIX epoch when the download was started.
		 */
		getStartTime(): number;
		/**
		 * The current state. Can be `progressing`, `completed`, `cancelled` or
		 * `interrupted`.
		 *
		 * **Note:** The following methods are useful specifically to resume a `cancelled`
		 * item when session is restarted.
		 */
		getState(): ('progressing' | 'completed' | 'cancelled' | 'interrupted');
		/**
		 * The total size in bytes of the download item.
		 *
If the size is unknown, it returns 0.
		 */
		getTotalBytes(): number;
		/**
		 * The origin URL where the item is downloaded from.
		 */
		getURL(): string;
		/**
		 * The complete URL chain of the item including any redirects.
		 */
		getURLChain(): string[];
		/**
		 * Whether the download has user gesture.
		 */
		hasUserGesture(): boolean;
		/**
		 * Whether the download is paused.
		 */
		isPaused(): boolean;
		/**
		 * Pauses the download.
		 */
		pause(): void;
		/**
		 * Resumes the download that has been paused.
		 *
		 * **Note:** To enable resumable downloads the server you are downloading from must
		 * support range requests and provide both `Last-Modified` and `ETag` header
		 * values. Otherwise `resume()` will dismiss previously received bytes and restart
		 * the download from the beginning.
		 */
		resume(): void;
		/**
		 * This API allows the user to set custom options for the save dialog that opens
		 * for the download item by default. The API is only available in session's
		 * `will-download` callback function.
		 */
		setSaveDialogOptions(options: SaveDialogOptions): void;
		/**
		 * The API is only available in session's `will-download` callback function. If
		 * user doesn't set the save path via the API, Electron will use the original
		 * routine to determine the save path; this usually prompts a save dialog.
		 */
		setSavePath(path: string): void;
		savePath: string;
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
		= 'will-download'
		| 'spellcheck-dictionary-download-failure';

	declare interface FromPartitionOptions {
		/**
		 * Whether to enable cache.
		 */
		cache: boolean;
	}

	declare interface ClearStorageDataOptions {
		/**
		 * Should follow `window.location.origin`’s representation `scheme://host:port`.
		 */
		origin?: string;
		/**
		 * The types of storages to clear, can contain: `appcache`, `cookies`,
		 * `filesystem`, `indexdb`, `localstorage`, `shadercache`, `websql`,
		 * `serviceworkers`, `cachestorage`. If not specified, clear all storage types.
		 */
		storages?: string[];
		/**
		 * The types of quotas to clear, can contain: `temporary`, `persistent`,
		 * `syncable`. If not specified, clear all quotas.
		 */
		quotas?: string[];
	}

	declare interface CreateInterruptedDownloadOptions {
		/**
		 * Absolute path of the download.
		 */
		path: string;
		/**
		 * Complete URL chain for the download.
		 */
		urlChain: string[];
		mimeType?: string;
		/**
		 * Start range for the download.
		 */
		offset: number;
		/**
		 * Total length of the download.
		 */
		length: number;
		/**
		 * Last-Modified header value.
		 */
		lastModified?: string;
		/**
		 * ETag header value.
		 */
		eTag?: string;
		/**
		 * Time when download was started in number of seconds since UNIX epoch.
		 */
		startTime?: number;
	}

	declare interface PreconnectOptions {
		/**
		 * URL for preconnect. Only the origin is relevant for opening the socket.
		 */
		url: string;
		/**
		 * number of sockets to preconnect. Must be between 1 and 6. Defaults to 1.
		 */
		numSockets?: number;
	}

	declare interface PermissionCheckHandlerHandlerDetails {
		/**
		 * The security origin of the `media` check.
		 */
		securityOrigin: string;
		/**
		 * The type of media access being requested, can be `video`, `audio` or `unknown`
		 */
		mediaType: ('video' | 'audio' | 'unknown');
		/**
		 * The last URL the requesting frame loaded
		 */
		requestingUrl: string;
		/**
		 * Whether the frame making the request is the main frame
		 */
		isMainFrame: boolean;
	}

	declare interface PermissionRequestHandlerHandlerDetails {
		/**
		 * The url of the `openExternal` request.
		 */
		externalURL?: string;
		/**
		 * The types of media access being requested, elements can be `video` or `audio`
		 */
		mediaTypes?: Array<'video' | 'audio'>;
		/**
		 * The last URL the requesting frame loaded
		 */
		requestingUrl: string;
		/**
		 * Whether the frame making the request is the main frame
		 */
		isMainFrame: boolean;
	}

	declare interface Extension {

		// Docs: https://electronjs.org/docs/api/structures/extension

		id: string;
		/**
		 * Copy of the extension's manifest data.
		 */
		manifest: any;
		name: string;
		/**
		 * The extension's file path.
		 */
		path: string;
		/**
		 * The extension's `chrome-extension://` URL.
		 */
		url: string;
		version: string;
	}

	declare interface EnableNetworkEmulationOptions {
		/**
		 * Whether to emulate network outage. Defaults to false.
		 */
		offline?: boolean;
		/**
		 * RTT in ms. Defaults to 0 which will disable latency throttling.
		 */
		latency?: number;
		/**
		 * Download rate in Bps. Defaults to 0 which will disable download throttling.
		 */
		downloadThroughput?: number;
		/**
		 * Upload rate in Bps. Defaults to 0 which will disable upload throttling.
		 */
		uploadThroughput?: number;
	}

	declare interface LoadExtensionOptions {
		/**
		 * Whether to allow the extension to read local files over `file://` protocol and
		 * inject content scripts into `file://` pages. This is required e.g. for loading
		 * devtools extensions on `file://` URLs. Defaults to false.
		 */
		allowFileAccess: boolean;
	}

	declare interface Config {
		/**
		 * The URL associated with the PAC file.
		 */
		pacScript?: string;
		/**
		 * Rules indicating which proxies to use.
		 */
		proxyRules?: string;
		/**
		 * Rules indicating which URLs should bypass the proxy settings.
		 */
		proxyBypassRules?: string;
	}

	declare interface Protocol {

		// Docs: https://electronjs.org/docs/api/protocol

		/**
		 * Whether the protocol was successfully intercepted
		 *
		 * Intercepts `scheme` protocol and uses `handler` as the protocol's new handler
		 * which sends a `Buffer` as a response.
		 */
		interceptBufferProtocol(scheme: string, handler: (request: ProtocolRequest, callback: (response: (Buffer) | (ProtocolResponse)) => void) => void): boolean;

		/**
		 * Whether the protocol was successfully intercepted
		 *
		 * Intercepts `scheme` protocol and uses `handler` as the protocol's new handler
		 * which sends a file as a response.
		 */
		interceptFileProtocol(scheme: string, handler: (request: ProtocolRequest, callback: (response: (string) | (ProtocolResponse)) => void) => void): boolean;

		/**
		 * Whether the protocol was successfully intercepted
		 *
		 * Intercepts `scheme` protocol and uses `handler` as the protocol's new handler
		 * which sends a new HTTP request as a response.
		 */
		interceptHttpProtocol(scheme: string, handler: (request: ProtocolRequest, callback: (response: ProtocolResponse) => void) => void): boolean;

		/**
		 * Whether the protocol was successfully intercepted
		 *
		 * Same as `protocol.registerStreamProtocol`, except that it replaces an existing
		 * protocol handler.
		 */
		interceptStreamProtocol(scheme: string, handler: (request: ProtocolRequest, callback: (response: (ReadableStream) | (ProtocolResponse)) => void) => void): boolean;

		/**
		 * Whether the protocol was successfully intercepted
		 *
		 * Intercepts `scheme` protocol and uses `handler` as the protocol's new handler
		 * which sends a `String` as a response.
		 */
		interceptStringProtocol(scheme: string, handler: (request: ProtocolRequest, callback: (response: (string) | (ProtocolResponse)) => void) => void): boolean;

		/**
		 * Whether `scheme` is already intercepted.
		 */
		isProtocolIntercepted(scheme: string): boolean;

		/**
		 * Whether `scheme` is already registered.
		 */
		isProtocolRegistered(scheme: string): boolean;

		/**
		 * Whether the protocol was successfully registered
		 *
		 * Registers a protocol of `scheme` that will send a `Buffer` as a response.
		 *
		 * The usage is the same with `registerFileProtocol`, except that the `callback`
		 * should be called with either a `Buffer` object or an object that has the `data`
		 * property.

Example:
		 */
		registerBufferProtocol(scheme: string, handler: (request: ProtocolRequest, callback: (response: (Buffer) | (ProtocolResponse)) => void) => void): boolean;

		/**
		 * Whether the protocol was successfully registered
		 *
		 * Registers a protocol of `scheme` that will send a file as the response. The
		 * `handler` will be called with `request` and `callback` where `request` is an
		 * incoming request for the `scheme`.
		 *
		 * To handle the `request`, the `callback` should be called with either the file's
		 * path or an object that has a `path` property, e.g. `callback(filePath)` or
		 * `callback({ path: filePath })`. The `filePath` must be an absolute path.
		 *
		 * By default the `scheme` is treated like `http:`, which is parsed differently
		 * from protocols that follow the "generic URI syntax" like `file:`.
		 */
		registerFileProtocol(scheme: string, handler: (request: ProtocolRequest, callback: (response: (string) | (ProtocolResponse)) => void) => void): boolean;

		/**
		 * Whether the protocol was successfully registered
		 *
		 * Registers a protocol of `scheme` that will send an HTTP request as a response.
		 *
		 * The usage is the same with `registerFileProtocol`, except that the `callback`
		 * should be called with an object that has the `url` property.
		 */
		registerHttpProtocol(scheme: string, handler: (request: ProtocolRequest, callback: (response: ProtocolResponse) => void) => void): boolean;

		/**
		 * **Note:** This method can only be used before the `ready` event of the `app`
		 * module gets emitted and can be called only once.
		 *
		 * Registers the `scheme` as standard, secure, bypasses content security policy for
		 * resources, allows registering ServiceWorker, supports fetch API, and streaming
		 * video/audio. Specify a privilege with the value of `true` to enable the
		 * capability.
		 *
		 * An example of registering a privileged scheme, that bypasses Content Security
		 * Policy:
		 *
		 * A standard scheme adheres to what RFC 3986 calls generic URI syntax. For example
		 * `http` and `https` are standard schemes, while `file` is not.
		 *
		 * Registering a scheme as standard allows relative and absolute resources to be
		 * resolved correctly when served. Otherwise the scheme will behave like the `file`
		 * protocol, but without the ability to resolve relative URLs.
		 *
		 * For example when you load following page with custom protocol without
		 * registering it as standard scheme, the image will not be loaded because
		 * non-standard schemes can not recognize relative URLs:
		 *
		 * Registering a scheme as standard will allow access to files through the
		 * FileSystem API. Otherwise the renderer will throw a security error for the
		 * scheme.
		 *
		 * By default web storage apis (localStorage, sessionStorage, webSQL, indexedDB,
		 * cookies) are disabled for non standard schemes. So in general if you want to
		 * register a custom protocol to replace the `http` protocol, you have to register
		 * it as a standard scheme.
		 *
		 * Protocols that use streams (http and stream protocols) should set `stream:
		 * true`. The `<video>` and `<audio>` HTML elements expect protocols to buffer
		 * their responses by default. The `stream` flag configures those elements to
		 * correctly expect streaming responses.
		 */
		registerSchemesAsPrivileged(customSchemes: CustomScheme[]): void;

		/**
		 * Whether the protocol was successfully registered
		 *
		 * Registers a protocol of `scheme` that will send a stream as a response.
		 *
		 * The usage is the same with `registerFileProtocol`, except that the `callback`
		 * should be called with either a `ReadableStream` object or an object that has the
		 * `data` property.
		 *
		 * Example:
		 *
		 * It is possible to pass any object that implements the readable stream API (emits
		 * `data`/`end`/`error` events). For example, here's how a file could be returned:
		 */
		registerStreamProtocol(scheme: string, handler: (request: ProtocolRequest, callback: (response: (ReadableStream) | (ProtocolResponse)) => void) => void): boolean;

		/**
		 * Whether the protocol was successfully registered
		 *
		 * Registers a protocol of `scheme` that will send a `String` as a response.
		 *
		 * The usage is the same with `registerFileProtocol`, except that the `callback`
		 * should be called with either a `String` or an object that has the `data`
		 * property.
		 */
		registerStringProtocol(scheme: string, handler: (request: ProtocolRequest, callback: (response: (string) | (ProtocolResponse)) => void) => void): boolean;

		/**
		 * Whether the protocol was successfully unintercepted
		 *
Remove the interceptor installed for `scheme` and restore its original handler.
		 */
		uninterceptProtocol(scheme: string): boolean;

		/**
		 * Whether the protocol was successfully unregistered
		 *
Unregisters the custom protocol of `scheme`.
		 */
		unregisterProtocol(scheme: string): boolean;
	}

	declare interface CustomScheme {

		// Docs: https://electronjs.org/docs/api/structures/custom-scheme

		privileges?: Privileges;
		/**
		 * Custom schemes to be registered with options.
		 */
		scheme: string;
	}

	declare interface NetLog {

		// Docs: https://electronjs.org/docs/api/net-log

		/**
		 * resolves when the net log has begun recording.
		 *
Starts recording network events to `path`.
		 */
		startLogging(path: string, options?: StartLoggingOptions): Promise<void>;

		/**
		 * resolves when the net log has been flushed to disk.
		 *
		 * Stops recording network events. If not called, net logging will automatically
		 * end when app quits.
		 */
		stopLogging(): Promise<void>;

		/**
		 * A `Boolean` property that indicates whether network logs are currently being
		 * recorded.
		 *
		 */
		+currentlyLogging: boolean;
	}

	declare class ServiceWorkers extends EventEmitterStub {

		// Docs: https://electronjs.org/docs/api/service-workers

		/**
		 * Emitted when a service worker logs something to the console.
		 */

		on(event: 'console-message', listener: (event: Event,
		                                        /**
		                                         * Information about the console message
		                                         */
		                                        messageDetails: MessageDetails) => void): this;

		once(event: 'console-message', listener: (event: Event,
		                                          /**
		                                           * Information about the console message
		                                           */
		                                          messageDetails: MessageDetails) => void): this;

		addListener(event: 'console-message', listener: (event: Event,
		                                                 /**
		                                                  * Information about the console message
		                                                  */
		                                                 messageDetails: MessageDetails) => void): this;

		removeListener(event: 'console-message', listener: (event: Event,
		                                                    /**
		                                                     * Information about the console message
		                                                     */
		                                                    messageDetails: MessageDetails) => void): this;
		/**
		 * A ServiceWorkerInfo object where the keys are the service worker version ID and
		 * the values are the information about that service worker.
		 */
		getAllRunning(): Record<number, ServiceWorkerInfo>;
		/**
		 * Information about this service worker
		 *
		 * If the service worker does not exist or is not running this method will throw an
		 * exception.
		 */
		getFromVersionID(versionId: number): ServiceWorkerInfo;
	}

	declare interface ServiceWorkerInfo {

		// Docs: https://electronjs.org/docs/api/structures/service-worker-info

		/**
		 * The virtual ID of the process that this service worker is running in.  This is
		 * not an OS level PID.  This aligns with the ID set used for
		 * `webContents.getProcessId()`.
		 */
		renderProcessId: number;
		/**
		 * The base URL that this service worker is active for.
		 */
		scope: string;
		/**
		 * The full URL to the script that this service worker runs
		 */
		scriptUrl: string;
	}

	declare interface Filter {
		/**
		 * Array of URL patterns that will be used to filter out the requests that do not
		 * match the URL patterns.
		 */
		urls: string[];
	}

	declare interface OnBeforeRequestListenerDetails {
		id: number;
		url: string;
		method: string;
		webContentsId?: number;
		resourceType: string;
		referrer: string;
		timestamp: number;
		uploadData: UploadData[];
	}

	declare interface OnBeforeSendHeadersListenerDetails {
		id: number;
		url: string;
		method: string;
		webContentsId?: number;
		resourceType: string;
		referrer: string;
		timestamp: number;
		requestHeaders: Record<string, string>;
	}

	declare interface OnBeforeRedirectListenerDetails {
		id: number;
		url: string;
		method: string;
		webContentsId?: number;
		resourceType: string;
		referrer: string;
		timestamp: number;
		redirectURL: string;
		statusCode: number;
		statusLine: string;
		/**
		 * The server IP address that the request was actually sent to.
		 */
		ip?: string;
		fromCache: boolean;
		responseHeaders?: Record<string, string[]>;
	}

	declare interface OnErrorOccurredListenerDetails {
		id: number;
		url: string;
		method: string;
		webContentsId?: number;
		resourceType: string;
		referrer: string;
		timestamp: number;
		fromCache: boolean;
		/**
		 * The error description.
		 */
		error: string;
	}

	declare interface HeadersReceivedResponse {
		cancel?: boolean;
		/**
		 * When provided, the server is assumed to have responded with these headers.
		 */
		responseHeaders?: Record<string, (string) | (string[])>;
		/**
		 * Should be provided when overriding `responseHeaders` to change header status
		 * otherwise original response header's status will be used.
		 */
		statusLine?: string;
	}

	declare interface OnCompletedListenerDetails {
		id: number;
		url: string;
		method: string;
		webContentsId?: number;
		resourceType: string;
		referrer: string;
		timestamp: number;
		responseHeaders?: Record<string, string[]>;
		fromCache: boolean;
		statusCode: number;
		statusLine: string;
		error: string;
	}

	declare interface Cookie {

		// Docs: https://electronjs.org/docs/api/structures/cookie

		/**
		 * The domain of the cookie; this will be normalized with a preceding dot so that
		 * it's also valid for subdomains.
		 */
		domain?: string;
		/**
		 * The expiration date of the cookie as the number of seconds since the UNIX epoch.
		 * Not provided for session cookies.
		 */
		expirationDate?: number;
		/**
		 * Whether the cookie is a host-only cookie; this will only be `true` if no domain
		 * was passed.
		 */
		hostOnly?: boolean;
		/**
		 * Whether the cookie is marked as HTTP only.
		 */
		httpOnly?: boolean;
		/**
		 * The name of the cookie.
		 */
		name: string;
		/**
		 * The path of the cookie.
		 */
		path?: string;
		/**
		 * The Same Site policy applied to this cookie.  Can be `unspecified`,
		 * `no_restriction`, `lax` or `strict`.
		 */
		sameSite: ('unspecified' | 'no_restriction' | 'lax' | 'strict');
		/**
		 * Whether the cookie is marked as secure.
		 */
		secure?: boolean;
		/**
		 * Whether the cookie is a session cookie or a persistent cookie with an expiration
		 * date.
		 */
		session?: boolean;
		/**
		 * The value of the cookie.
		 */
		value: string;
	}

	declare interface CookiesGetFilter {
		/**
		 * Retrieves cookies which are associated with `url`. Empty implies retrieving
		 * cookies of all URLs.
		 */
		url?: string;
		/**
		 * Filters cookies by name.
		 */
		name?: string;
		/**
		 * Retrieves cookies whose domains match or are subdomains of `domains`.
		 */
		domain?: string;
		/**
		 * Retrieves cookies whose path matches `path`.
		 */
		path?: string;
		/**
		 * Filters cookies by their Secure property.
		 */
		secure?: boolean;
		/**
		 * Filters out session or persistent cookies.
		 */
		session?: boolean;
	}


	declare interface BeforeSendResponse {
		cancel?: boolean;
		/**
		 * When provided, request will be made with these headers.
		 */
		requestHeaders?: Record<string, (string) | (string[])>;
	}

	declare interface UploadData {

		// Docs: https://electronjs.org/docs/api/structures/upload-data

		/**
		 * UUID of blob data. Use ses.getBlobData method to retrieve the data.
		 */
		blobUUID?: string;
		/**
		 * Content being sent.
		 */
		bytes: Buffer;
		/**
		 * Path of file being uploaded.
		 */
		file?: string;
	}

	declare interface ProtocolResponseUploadData {

		// Docs: https://electronjs.org/docs/api/structures/protocol-response-upload-data

		/**
		 * MIME type of the content.
		 */
		contentType: string;
		/**
		 * Content to be sent.
		 */
		data: (string) | (Buffer);
	}

	declare interface Privileges {
		/**
		 * Default false.
		 */
		standard?: boolean;
		/**
		 * Default false.
		 */
		secure?: boolean;
		/**
		 * Default false.
		 */
		bypassCSP?: boolean;
		/**
		 * Default false.
		 */
		allowServiceWorkers?: boolean;
		/**
		 * Default false.
		 */
		supportFetchAPI?: boolean;
		/**
		 * Default false.
		 */
		corsEnabled?: boolean;
		/**
		 * Default false.
		 */
		stream?: boolean;
	}

	declare interface StartLoggingOptions {
		/**
		 * What kinds of data should be captured. By default, only metadata about requests
		 * will be captured. Setting this to `includeSensitive` will include cookies and
		 * authentication data. Setting it to `everything` will include all bytes
		 * transferred on sockets. Can be `default`, `includeSensitive` or `everything`.
		 */
		captureMode?: ('default' | 'includeSensitive' | 'everything');
		/**
		 * When the log grows beyond this size, logging will automatically stop. Defaults
		 * to unlimited.
		 */
		maxFileSize?: number;
	}


	declare interface AuthInfo {
		isProxy: boolean;
		scheme: string;
		host: string;
		port: number;
		realm: string;
	}

	declare class WebRequest {

		// Docs: https://electronjs.org/docs/api/web-request

		/**
		 * The `listener` will be called with `listener(details)` when a server initiated
		 * redirect is about to occur.
		 */
		onBeforeRedirect(filter: Filter, listener: ((details: OnBeforeRedirectListenerDetails) => void) | (null)): void;
		/**
		 * The `listener` will be called with `listener(details)` when a server initiated
		 * redirect is about to occur.
		 */
		onBeforeRedirect(listener: ((details: OnBeforeRedirectListenerDetails) => void) | (null)): void;
		/**
		 * The `listener` will be called with `listener(details, callback)` when a request
		 * is about to occur.
		 *
		 * The `uploadData` is an array of `UploadData` objects.
		 *
		 * The `callback` has to be called with an `response` object.
		 *
Some examples of valid `urls`:
		 */
		onBeforeRequest(filter: Filter, listener: ((details: OnBeforeRequestListenerDetails, callback: (response: Response) => void) => void) | (null)): void;
		/**
		 * The `listener` will be called with `listener(details, callback)` when a request
		 * is about to occur.
		 *
		 * The `uploadData` is an array of `UploadData` objects.
		 *
		 * The `callback` has to be called with an `response` object.
		 *
Some examples of valid `urls`:
		 */
		onBeforeRequest(listener: ((details: OnBeforeRequestListenerDetails, callback: (response: Response) => void) => void) | (null)): void;
		/**
		 * The `listener` will be called with `listener(details, callback)` before sending
		 * an HTTP request, once the request headers are available. This may occur after a
		 * TCP connection is made to the server, but before any http data is sent.
		 *
The `callback` has to be called with a `response` object.
		 */
		onBeforeSendHeaders(filter: Filter, listener: ((details: OnBeforeSendHeadersListenerDetails, callback: (beforeSendResponse: BeforeSendResponse) => void) => void) | (null)): void;
		/**
		 * The `listener` will be called with `listener(details, callback)` before sending
		 * an HTTP request, once the request headers are available. This may occur after a
		 * TCP connection is made to the server, but before any http data is sent.
		 *
The `callback` has to be called with a `response` object.
		 */
		onBeforeSendHeaders(listener: ((details: OnBeforeSendHeadersListenerDetails, callback: (beforeSendResponse: BeforeSendResponse) => void) => void) | (null)): void;
		/**
		 * The `listener` will be called with `listener(details)` when a request is
		 * completed.
		 */
		onCompleted(filter: Filter, listener: ((details: OnCompletedListenerDetails) => void) | (null)): void;
		/**
		 * The `listener` will be called with `listener(details)` when a request is
		 * completed.
		 */
		onCompleted(listener: ((details: OnCompletedListenerDetails) => void) | (null)): void;
		/**
		 * The `listener` will be called with `listener(details)` when an error occurs.
		 */
		onErrorOccurred(filter: Filter, listener: ((details: OnErrorOccurredListenerDetails) => void) | (null)): void;
		/**
		 * The `listener` will be called with `listener(details)` when an error occurs.
		 */
		onErrorOccurred(listener: ((details: OnErrorOccurredListenerDetails) => void) | (null)): void;
		/**
		 * The `listener` will be called with `listener(details, callback)` when HTTP
		 * response headers of a request have been received.
		 *
The `callback` has to be called with a `response` object.
		 */
		onHeadersReceived(filter: Filter, listener: ((details: OnHeadersReceivedListenerDetails, callback: (headersReceivedResponse: HeadersReceivedResponse) => void) => void) | (null)): void;
		/**
		 * The `listener` will be called with `listener(details, callback)` when HTTP
		 * response headers of a request have been received.
		 *
The `callback` has to be called with a `response` object.
		 */
		onHeadersReceived(listener: ((details: OnHeadersReceivedListenerDetails, callback: (headersReceivedResponse: HeadersReceivedResponse) => void) => void) | (null)): void;
		/**
		 * The `listener` will be called with `listener(details)` when first byte of the
		 * response body is received. For HTTP requests, this means that the status line
		 * and response headers are available.
		 */
		onResponseStarted(filter: Filter, listener: ((details: OnResponseStartedListenerDetails) => void) | (null)): void;
		/**
		 * The `listener` will be called with `listener(details)` when first byte of the
		 * response body is received. For HTTP requests, this means that the status line
		 * and response headers are available.
		 */
		onResponseStarted(listener: ((details: OnResponseStartedListenerDetails) => void) | (null)): void;
		/**
		 * The `listener` will be called with `listener(details)` just before a request is
		 * going to be sent to the server, modifications of previous `onBeforeSendHeaders`
		 * response are visible by the time this listener is fired.
		 */
		onSendHeaders(filter: Filter, listener: ((details: OnSendHeadersListenerDetails) => void) | (null)): void;
		/**
		 * The `listener` will be called with `listener(details)` just before a request is
		 * going to be sent to the server, modifications of previous `onBeforeSendHeaders`
		 * response are visible by the time this listener is fired.
		 */
		onSendHeaders(listener: ((details: OnSendHeadersListenerDetails) => void) | (null)): void;
	}

	declare interface OnHeadersReceivedListenerDetails {
		id: number;
		url: string;
		method: string;
		webContentsId?: number;
		resourceType: string;
		referrer: string;
		timestamp: number;
		statusLine: string;
		statusCode: number;
		requestHeaders: Record<string, string>;
		responseHeaders?: Record<string, string[]>;
	}

	declare interface OnResponseStartedListenerDetails {
		id: number;
		url: string;
		method: string;
		webContentsId?: number;
		resourceType: string;
		referrer: string;
		timestamp: number;
		responseHeaders?: Record<string, string[]>;
		/**
		 * Indicates whether the response was fetched from disk cache.
		 */
		fromCache: boolean;
		statusCode: number;
		statusLine: string;
	}

	declare interface OnSendHeadersListenerDetails {
		id: number;
		url: string;
		method: string;
		webContentsId?: number;
		resourceType: string;
		referrer: string;
		timestamp: number;
		requestHeaders: Record<string, string>;
	}


	declare class Cookies extends EventEmitterStub {

		// Docs: https://electronjs.org/docs/api/cookies

		/**
		 * Emitted when a cookie is changed because it was added, edited, removed, or
		 * expired.
		 */

		on(event: 'changed', listener: (event: Event,
		                                /**
		                                 * The cookie that was changed.
		                                 */
		                                cookie: Cookie,
		                                /**
		                                 * The cause of the change with one of the following values:
		                                 */
		                                cause: ('explicit' | 'overwrite' | 'expired' | 'evicted' | 'expired-overwrite'),
		                                /**
		                                 * `true` if the cookie was removed, `false` otherwise.
		                                 */
		                                removed: boolean) => void): this;

		once(event: 'changed', listener: (event: Event,
		                                  /**
		                                   * The cookie that was changed.
		                                   */
		                                  cookie: Cookie,
		                                  /**
		                                   * The cause of the change with one of the following values:
		                                   */
		                                  cause: ('explicit' | 'overwrite' | 'expired' | 'evicted' | 'expired-overwrite'),
		                                  /**
		                                   * `true` if the cookie was removed, `false` otherwise.
		                                   */
		                                  removed: boolean) => void): this;

		addListener(event: 'changed', listener: (event: Event,
		                                         /**
		                                          * The cookie that was changed.
		                                          */
		                                         cookie: Cookie,
		                                         /**
		                                          * The cause of the change with one of the following values:
		                                          */
		                                         cause: ('explicit' | 'overwrite' | 'expired' | 'evicted' | 'expired-overwrite'),
		                                         /**
		                                          * `true` if the cookie was removed, `false` otherwise.
		                                          */
		                                         removed: boolean) => void): this;

		removeListener(event: 'changed', listener: (event: Event,
		                                            /**
		                                             * The cookie that was changed.
		                                             */
		                                            cookie: Cookie,
		                                            /**
		                                             * The cause of the change with one of the following values:
		                                             */
		                                            cause: ('explicit' | 'overwrite' | 'expired' | 'evicted' | 'expired-overwrite'),
		                                            /**
		                                             * `true` if the cookie was removed, `false` otherwise.
		                                             */
		                                            removed: boolean) => void): this;
		/**
		 * A promise which resolves when the cookie store has been flushed
		 *
Writes any unwritten cookies data to disk.
		 */
		flushStore(): Promise<void>;
		/**
		 * A promise which resolves an array of cookie objects.
		 *
		 * Sends a request to get all cookies matching `filter`, and resolves a promise
		 * with the response.
		 */
		get(filter: CookiesGetFilter): Promise<Cookie[]>;
		/**
		 * A promise which resolves when the cookie has been removed
		 *
Removes the cookies matching `url` and `name`
		 */
		remove(url: string, name: string): Promise<void>;
		/**
		 * A promise which resolves when the cookie has been set
		 *
Sets a cookie with `details`.
		 */
		set(details: CookiesSetDetails): Promise<void>;
	}

	declare interface CookiesSetDetails {
		/**
		 * The URL to associate the cookie with. The promise will be rejected if the URL is
		 * invalid.
		 */
		url: string;
		/**
		 * The name of the cookie. Empty by default if omitted.
		 */
		name?: string;
		/**
		 * The value of the cookie. Empty by default if omitted.
		 */
		value?: string;
		/**
		 * The domain of the cookie; this will be normalized with a preceding dot so that
		 * it's also valid for subdomains. Empty by default if omitted.
		 */
		domain?: string;
		/**
		 * The path of the cookie. Empty by default if omitted.
		 */
		path?: string;
		/**
		 * Whether the cookie should be marked as Secure. Defaults to false.
		 */
		secure?: boolean;
		/**
		 * Whether the cookie should be marked as HTTP only. Defaults to false.
		 */
		httpOnly?: boolean;
		/**
		 * The expiration date of the cookie as the number of seconds since the UNIX epoch.
		 * If omitted then the cookie becomes a session cookie and will not be retained
		 * between sessions.
		 */
		expirationDate?: number;
		/**
		 * The Same Site policy to apply to this cookie.  Can be `unspecified`,
		 * `no_restriction`, `lax` or `strict`.  Default is `no_restriction`.
		 */
		sameSite?: ('unspecified' | 'no_restriction' | 'lax' | 'strict');
	}

	declare interface UploadProgress {
		/**
		 * Whether the request is currently active. If this is false no other properties
		 * will be set
		 */
		active: boolean;
		/**
		 * Whether the upload has started. If this is false both `current` and `total` will
		 * be set to 0.
		 */
		started: boolean;
		/**
		 * The number of bytes that have been uploaded so far
		 */
		current: number;
		/**
		 * The number of bytes that will be uploaded this request
		 */
		total: number;
	}


	declare class Session extends EventEmitterStub {

		// Docs: https://electronjs.org/docs/api/session

		/**
		 * A session instance from `partition` string. When there is an existing `Session`
		 * with the same `partition`, it will be returned; otherwise a new `Session`
		 * instance will be created with `options`.
		 *
		 * If `partition` starts with `persist:`, the page will use a persistent session
		 * available to all pages in the app with the same `partition`. if there is no
		 * `persist:` prefix, the page will use an in-memory session. If the `partition` is
		 * empty then default session of the app will be returned.
		 *
		 * To create a `Session` with `options`, you have to ensure the `Session` with the
		 * `partition` has never been used before. There is no way to change the `options`
		 * of an existing `Session` object.
		 */
		static fromPartition(partition: string, options?: FromPartitionOptions): Session;
		/**
		 * A `Session` object, the default session object of the app.
		 */
		static defaultSession: Session;
		/**
		 * Emitted when a render process requests preconnection to a URL, generally due to
		 * a resource hint.
		 */

		on(event: 'preconnect', listener: (event: Event,
		                                   /**
		                                    * The URL being requested for preconnection by the renderer.
		                                    */
		                                   preconnectUrl: string,
		                                   /**
		                                    * True if the renderer is requesting that the connection include credentials (see
		                                    * the spec for more details.)
		                                    */
		                                   allowCredentials: boolean) => void): this;

		once(event: 'preconnect', listener: (event: Event,
		                                     /**
		                                      * The URL being requested for preconnection by the renderer.
		                                      */
		                                     preconnectUrl: string,
		                                     /**
		                                      * True if the renderer is requesting that the connection include credentials (see
		                                      * the spec for more details.)
		                                      */
		                                     allowCredentials: boolean) => void): this;

		addListener(event: 'preconnect', listener: (event: Event,
		                                            /**
		                                             * The URL being requested for preconnection by the renderer.
		                                             */
		                                            preconnectUrl: string,
		                                            /**
		                                             * True if the renderer is requesting that the connection include credentials (see
		                                             * the spec for more details.)
		                                             */
		                                            allowCredentials: boolean) => void): this;

		removeListener(event: 'preconnect', listener: (event: Event,
		                                               /**
		                                                * The URL being requested for preconnection by the renderer.
		                                                */
		                                               preconnectUrl: string,
		                                               /**
		                                                * True if the renderer is requesting that the connection include credentials (see
		                                                * the spec for more details.)
		                                                */
		                                               allowCredentials: boolean) => void): this;
		/**
		 * Emitted when a hunspell dictionary file starts downloading
		 */

		on(event: 'spellcheck-dictionary-download-begin', listener: (event: Event,
		                                                             /**
		                                                              * The language code of the dictionary file
		                                                              */
		                                                             languageCode: string) => void): this;

		once(event: 'spellcheck-dictionary-download-begin', listener: (event: Event,
		                                                               /**
		                                                                * The language code of the dictionary file
		                                                                */
		                                                               languageCode: string) => void): this;

		addListener(event: 'spellcheck-dictionary-download-begin', listener: (event: Event,
		                                                                      /**
		                                                                       * The language code of the dictionary file
		                                                                       */
		                                                                      languageCode: string) => void): this;

		removeListener(event: 'spellcheck-dictionary-download-begin', listener: (event: Event,
		                                                                         /**
		                                                                          * The language code of the dictionary file
		                                                                          */
		                                                                         languageCode: string) => void): this;
		/**
		 * Emitted when a hunspell dictionary file download fails.  For details on the
		 * failure you should collect a netlog and inspect the download request.
		 */

		on(event: 'spellcheck-dictionary-download-failure', listener: (event: Event,
		                                                               /**
		                                                                * The language code of the dictionary file
		                                                                */
		                                                               languageCode: string) => void): this;

		once(event: 'spellcheck-dictionary-download-failure', listener: (event: Event,
		                                                                 /**
		                                                                  * The language code of the dictionary file
		                                                                  */
		                                                                 languageCode: string) => void): this;

		addListener(event: 'spellcheck-dictionary-download-failure', listener: (event: Event,
		                                                                        /**
		                                                                         * The language code of the dictionary file
		                                                                         */
		                                                                        languageCode: string) => void): this;

		removeListener(event: 'spellcheck-dictionary-download-failure', listener: (event: Event,
		                                                                           /**
		                                                                            * The language code of the dictionary file
		                                                                            */
		                                                                           languageCode: string) => void): this;
		/**
		 * Emitted when a hunspell dictionary file has been successfully downloaded
		 */

		on(event: 'spellcheck-dictionary-download-success', listener: (event: Event,
		                                                               /**
		                                                                * The language code of the dictionary file
		                                                                */
		                                                               languageCode: string) => void): this;

		once(event: 'spellcheck-dictionary-download-success', listener: (event: Event,
		                                                                 /**
		                                                                  * The language code of the dictionary file
		                                                                  */
		                                                                 languageCode: string) => void): this;

		addListener(event: 'spellcheck-dictionary-download-success', listener: (event: Event,
		                                                                        /**
		                                                                         * The language code of the dictionary file
		                                                                         */
		                                                                        languageCode: string) => void): this;

		removeListener(event: 'spellcheck-dictionary-download-success', listener: (event: Event,
		                                                                           /**
		                                                                            * The language code of the dictionary file
		                                                                            */
		                                                                           languageCode: string) => void): this;
		/**
		 * Emitted when a hunspell dictionary file has been successfully initialized. This
		 * occurs after the file has been downloaded.
		 */

		on(event: 'spellcheck-dictionary-initialized', listener: (event: Event,
		                                                          /**
		                                                           * The language code of the dictionary file
		                                                           */
		                                                          languageCode: string) => void): this;

		once(event: 'spellcheck-dictionary-initialized', listener: (event: Event,
		                                                            /**
		                                                             * The language code of the dictionary file
		                                                             */
		                                                            languageCode: string) => void): this;

		addListener(event: 'spellcheck-dictionary-initialized', listener: (event: Event,
		                                                                   /**
		                                                                    * The language code of the dictionary file
		                                                                    */
		                                                                   languageCode: string) => void): this;

		removeListener(event: 'spellcheck-dictionary-initialized', listener: (event: Event,
		                                                                      /**
		                                                                       * The language code of the dictionary file
		                                                                       */
		                                                                      languageCode: string) => void): this;
		/**
		 * Emitted when Electron is about to download `item` in `webContents`.
		 *
		 * Calling `event.preventDefault()` will cancel the download and `item` will not be
		 * available from next tick of the process.
		 */

		on(event: 'will-download', listener: (event: Event,
		                                      item: DownloadItem,
		                                      webContents: WebContents) => void): this;

		once(event: 'will-download', listener: (event: Event,
		                                        item: DownloadItem,
		                                        webContents: WebContents) => void): this;

		addListener(event: 'will-download', listener: (event: Event,
		                                               item: DownloadItem,
		                                               webContents: WebContents) => void): this;

		removeListener(event: 'will-download', listener: (event: Event,
		                                                  item: DownloadItem,
		                                                  webContents: WebContents) => void): this;
		/**
		 * Whether the word was successfully written to the custom dictionary. This API
		 * will not work on non-persistent (in-memory) sessions.
		 *
		 * **Note:** On macOS and Windows 10 this word will be written to the OS custom
		 * dictionary as well
		 */
		addWordToSpellCheckerDictionary(word: string): boolean;
		/**
		 * Dynamically sets whether to always send credentials for HTTP NTLM or Negotiate
		 * authentication.
		 */
		allowNTLMCredentialsForDomains(domains: string): void;
		/**
		 * resolves when the session’s HTTP authentication cache has been cleared.
		 */
		clearAuthCache(): Promise<void>;
		/**
		 * resolves when the cache clear operation is complete.
		 *
Clears the session’s HTTP cache.
		 */
		clearCache(): Promise<void>;
		/**
		 * Resolves when the operation is complete.

Clears the host resolver cache.
		 */
		clearHostResolverCache(): Promise<void>;
		/**
		 * resolves when the storage data has been cleared.
		 */
		clearStorageData(options?: ClearStorageDataOptions): Promise<void>;
		/**
		 * Allows resuming `cancelled` or `interrupted` downloads from previous `Session`.
		 * The API will generate a DownloadItem that can be accessed with the will-download
		 * event. The DownloadItem will not have any `WebContents` associated with it and
		 * the initial state will be `interrupted`. The download will start only when the
		 * `resume` API is called on the DownloadItem.
		 */
		createInterruptedDownload(options: CreateInterruptedDownloadOptions): void;
		/**
		 * Disables any network emulation already active for the `session`. Resets to the
		 * original network configuration.
		 */
		disableNetworkEmulation(): void;
		/**
		 * Initiates a download of the resource at `url`. The API will generate a
		 * DownloadItem that can be accessed with the will-download event.
		 *
		 * **Note:** This does not perform any security checks that relate to a page's
		 * origin, unlike `webContents.downloadURL`.
		 */
		downloadURL(url: string): void;
		/**
		 * Emulates network with the given configuration for the `session`.
		 */
		enableNetworkEmulation(options: EnableNetworkEmulationOptions): void;
		/**
		 * Writes any unwritten DOMStorage data to disk.
		 */
		flushStorageData(): void;
		/**
		 * A list of all loaded extensions.
		 *
		 * **Note:** This API cannot be called before the `ready` event of the `app` module
		 * is emitted.
		 */
		getAllExtensions(): Extension[];
		/**
		 * resolves with blob data.
		 */
		getBlobData(identifier: string): Promise<Buffer>;
		/**
		 * the session's current cache size, in bytes.
		 */
		getCacheSize(): Promise<number>;
		/**
		 * | `null` - The loaded extension with the given ID.
		 *
		 * **Note:** This API cannot be called before the `ready` event of the `app` module
		 * is emitted.
		 */
		getExtension(extensionId: string): Extension;
		/**
		 * an array of paths to preload scripts that have been registered.
		 */
		getPreloads(): string[];
		/**
		 * An array of language codes the spellchecker is enabled for.  If this list is
		 * empty the spellchecker will fallback to using `en-US`.  By default on launch if
		 * this setting is an empty list Electron will try to populate this setting with
		 * the current OS locale.  This setting is persisted across restarts.
		 *
		 * **Note:** On macOS the OS spellchecker is used and has its own list of
		 * languages.  This API is a no-op on macOS.
		 */
		getSpellCheckerLanguages(): string[];
		/**
		 * The user agent for this session.
		 */
		getUserAgent(): string;
		/**
		 * Whether or not this session is a persistent one. The default `webContents`
		 * session of a `BrowserWindow` is persistent. When creating a session from a
		 * partition, session prefixed with `persist:` will be persistent, while others
		 * will be temporary.
		 */
		isPersistent(): boolean;
		/**
		 * An array of all words in app's custom dictionary. Resolves when the full
		 * dictionary is loaded from disk.
		 */
		listWordsInSpellCheckerDictionary(): Promise<string[]>;
		/**
		 * resolves when the extension is loaded.
		 *
		 * This method will raise an exception if the extension could not be loaded. If
		 * there are warnings when installing the extension (e.g. if the extension requests
		 * an API that Electron does not support) then they will be logged to the console.
		 *
		 * Note that Electron does not support the full range of Chrome extensions APIs.
		 * See Supported Extensions APIs for more details on what is supported.
		 *
		 * Note that in previous versions of Electron, extensions that were loaded would be
		 * remembered for future runs of the application. This is no longer the case:
		 * `loadExtension` must be called on every boot of your app if you want the
		 * extension to be loaded.
		 *
		 * This API does not support loading packed (.crx) extensions.
		 *
		 * **Note:** This API cannot be called before the `ready` event of the `app` module
		 * is emitted.
		 *
		 * **Note:** Loading extensions into in-memory (non-persistent) sessions is not
		 * supported and will throw an error.
		 */
		loadExtension(path: string, options?: LoadExtensionOptions): Promise<Extension>;
		/**
		 * Preconnects the given number of sockets to an origin.
		 */
		preconnect(options: PreconnectOptions): void;
		/**
		 * Unloads an extension.
		 *
		 * **Note:** This API cannot be called before the `ready` event of the `app` module
		 * is emitted.
		 */
		removeExtension(extensionId: string): void;
		/**
		 * Whether the word was successfully removed from the custom dictionary. This API
		 * will not work on non-persistent (in-memory) sessions.
		 *
		 * **Note:** On macOS and Windows 10 this word will be removed from the OS custom
		 * dictionary as well
		 */
		removeWordFromSpellCheckerDictionary(word: string): boolean;
		/**
		 * Resolves with the proxy information for `url`.
		 */
		resolveProxy(url: string): Promise<string>;
		/**
		 * Sets the certificate verify proc for `session`, the `proc` will be called with
		 * `proc(request, callback)` whenever a server certificate verification is
		 * requested. Calling `callback(0)` accepts the certificate, calling `callback(-2)`
		 * rejects it.
		 *
		 * Calling `setCertificateVerifyProc(null)` will revert back to default certificate
		 * verify proc.
		 */
		setCertificateVerifyProc(proc: ((request: Request, callback: (verificationResult: number) => void) => void) | (null)): void;
		/**
		 * Sets download saving directory. By default, the download directory will be the
		 * `Downloads` under the respective app folder.
		 */
		setDownloadPath(path: string): void;
		/**
		 * Sets the handler which can be used to respond to permission checks for the
		 * `session`. Returning `true` will allow the permission and `false` will reject
		 * it. To clear the handler, call `setPermissionCheckHandler(null)`.
		 */
		setPermissionCheckHandler(handler: ((webContents: WebContents, permission: string, requestingOrigin: string, details: PermissionCheckHandlerHandlerDetails) => boolean) | (null)): void;
		/**
		 * Sets the handler which can be used to respond to permission requests for the
		 * `session`. Calling `callback(true)` will allow the permission and
		 * `callback(false)` will reject it. To clear the handler, call
		 * `setPermissionRequestHandler(null)`.
		 */
		setPermissionRequestHandler(handler: ((webContents: WebContents, permission: 'clipboard-read' | 'media' | 'mediaKeySystem' | 'geolocation' | 'notifications' | 'midi' | 'midiSysex' | 'pointerLock' | 'fullscreen' | 'openExternal', callback: (permissionGranted: boolean) => void, details: PermissionRequestHandlerHandlerDetails) => void) | (null)): void;
		/**
		 * Adds scripts that will be executed on ALL web contents that are associated with
		 * this session just before normal `preload` scripts run.
		 */
		setPreloads(preloads: string[]): void;
		/**
		 * Resolves when the proxy setting process is complete.
		 *
		 * Sets the proxy settings.
		 *
		 * When `pacScript` and `proxyRules` are provided together, the `proxyRules` option
		 * is ignored and `pacScript` configuration is applied.
		 *
		 * The `proxyRules` has to follow the rules below:
		 *
		 * For example:
		 *
		 * * `http=foopy:80;ftp=foopy2` - Use HTTP proxy `foopy:80` for `http://` URLs, and
		 * HTTP proxy `foopy2:80` for `ftp://` URLs.
		 * * `foopy:80` - Use HTTP proxy `foopy:80` for all URLs.
		 * * `foopy:80,bar,direct://` - Use HTTP proxy `foopy:80` for all URLs, failing
		 * over to `bar` if `foopy:80` is unavailable, and after that using no proxy.
		 * * `socks4://foopy` - Use SOCKS v4 proxy `foopy:1080` for all URLs.
		 * * `http=foopy,socks5://bar.com` - Use HTTP proxy `foopy` for http URLs, and fail
		 * over to the SOCKS5 proxy `bar.com` if `foopy` is unavailable.
		 * * `http=foopy,direct://` - Use HTTP proxy `foopy` for http URLs, and use no
		 * proxy if `foopy` is unavailable.
		 * * `http=foopy;socks=foopy2` - Use HTTP proxy `foopy` for http URLs, and use
		 * `socks4://foopy2` for all other URLs.
		 *
		 * The `proxyBypassRules` is a comma separated list of rules described below:
		 *
		 * * `[ URL_SCHEME "://" ] HOSTNAME_PATTERN [ ":" <port> ]`
		 *
		 * Match all hostnames that match the pattern HOSTNAME_PATTERN.
		 *
		 * Examples: "foobar.com", "*foobar.com", "*.foobar.com", "*foobar.com:99",
		 * "https://x.*.y.com:99"
		 * * `"." HOSTNAME_SUFFIX_PATTERN [ ":" PORT ]`
		 *
		 * Match a particular domain suffix.
		 *
		 * Examples: ".google.com", ".com", "http://.google.com"
		 * * `[ SCHEME "://" ] IP_LITERAL [ ":" PORT ]`
		 *
		 * Match URLs which are IP address literals.
		 *
		 * Examples: "127.0.1", "[0:0::1]", "[::1]", "http://[::1]:99"
		 * * `IP_LITERAL "/" PREFIX_LENGTH_IN_BITS`
		 *
		 * Match any URL that is to an IP literal that falls between the given range. IP
		 * range is specified using CIDR notation.
		 *
		 * Examples: "192.168.1.1/16", "fefe:13::abc/33".
		 * * `<local>`
		 *
		 * Match local addresses. The meaning of `<local>` is whether the host matches one
		 * of: "127.0.0.1", "::1", "localhost".
		 */
		setProxy(config: Config): Promise<void>;
		/**
		 * By default Electron will download hunspell dictionaries from the Chromium CDN.
		 * If you want to override this behavior you can use this API to point the
		 * dictionary downloader at your own hosted version of the hunspell dictionaries.
		 * We publish a `hunspell_dictionaries.zip` file with each release which contains
		 * the files you need to host here, the file server must be **case insensitive**
		 * you must upload each file twice, once with the case it has in the ZIP file and
		 * once with the filename as all lower case.
		 *
		 * If the files present in `hunspell_dictionaries.zip` are available at
		 * `https://example.com/dictionaries/language-code.bdic` then you should call this
		 * api with
		 * `ses.setSpellCheckerDictionaryDownloadURL('https://example.com/dictionaries/')`.
		 *  Please note the trailing slash.  The URL to the dictionaries is formed as
		 * `${url}${filename}`.
		 *
		 * **Note:** On macOS the OS spellchecker is used and therefore we do not download
		 * any dictionary files.  This API is a no-op on macOS.
		 */
		setSpellCheckerDictionaryDownloadURL(url: string): void;
		/**
		 * The built in spellchecker does not automatically detect what language a user is
		 * typing in.  In order for the spell checker to correctly check their words you
		 * must call this API with an array of language codes.  You can get the list of
		 * supported language codes with the `ses.availableSpellCheckerLanguages` property.
		 *
		 * **Note:** On macOS the OS spellchecker is used and will detect your language
		 * automatically.  This API is a no-op on macOS.
		 */
		setSpellCheckerLanguages(languages: string[]): void;
		/**
		 * Overrides the `userAgent` and `acceptLanguages` for this session.
		 *
		 * The `acceptLanguages` must a comma separated ordered list of language codes, for
		 * example `"en-US,fr,de,ko,zh-CN,ja"`.
		 *
		 * This doesn't affect existing `WebContents`, and each `WebContents` can use
		 * `webContents.setUserAgent` to override the session-wide user agent.
		 */
		setUserAgent(userAgent: string, acceptLanguages?: string): void;

		+availableSpellCheckerLanguages: string[];
		+cookies: Cookies;
		+netLog: NetLog;
		+protocol: Protocol;
		+serviceWorkers: ServiceWorkers;
		+webRequest: WebRequest;
	}

	declare interface ClientRequestConstructorOptions {
		/**
		 * The HTTP request method. Defaults to the GET method.
		 */
		method?: string;
		/**
		 * The request URL. Must be provided in the absolute form with the protocol scheme
		 * specified as http or https.
		 */
		url?: string;
		/**
		 * The `Session` instance with which the request is associated.
		 */
		session?: Session;
		/**
		 * The name of the `partition` with which the request is associated. Defaults to
		 * the empty string. The `session` option prevails on `partition`. Thus if a
		 * `session` is explicitly specified, `partition` is ignored.
		 */
		partition?: string;
		/**
		 * Whether to send cookies with this request from the provided session.  This will
		 * make the `net` request's cookie behavior match a `fetch` request. Default is
		 * `false`.
		 */
		useSessionCookies?: boolean;
		/**
		 * The protocol scheme in the form 'scheme:'. Currently supported values are
		 * 'http:' or 'https:'. Defaults to 'http:'.
		 */
		protocol?: string;
		/**
		 * The server host provided as a concatenation of the hostname and the port number
		 * 'hostname:port'.
		 */
		host?: string;
		/**
		 * The server host name.
		 */
		hostname?: string;
		/**
		 * The server's listening port number.
		 */
		port?: number;
		/**
		 * The path part of the request URL.
		 */
		path?: string;
		/**
		 * The redirect mode for this request. Should be one of `follow`, `error` or
		 * `manual`. Defaults to `follow`. When mode is `error`, any redirection will be
		 * aborted. When mode is `manual` the redirection will be cancelled unless
		 * `request.followRedirect` is invoked synchronously during the `redirect` event.
		 */
		redirect?: string;
	}


	declare export class ClientRequest extends EventEmitterStub {
		// Docs: https://electronjs.org/docs/api/client-request

		/**
		 * ClientRequest
		 */
		constructor(options: (ClientRequestConstructorOptions) | (string)): this;

		/**
		 * Emitted when the `request` is aborted. The `abort` event will not be fired if
		 * the `request` is already closed.
		 */

		on(event: 'abort', listener: Function): this;

		once(event: 'abort', listener: Function): this;

		addListener(event: 'abort', listener: Function): this;

		removeListener(event: 'abort', listener: Function): this;
		/**
		 * Emitted as the last event in the HTTP request-response transaction. The `close`
		 * event indicates that no more events will be emitted on either the `request` or
		 * `response` objects.
		 */

		on(event: 'close', listener: Function): this;

		once(event: 'close', listener: Function): this;

		addListener(event: 'close', listener: Function): this;

		removeListener(event: 'close', listener: Function): this;
		/**
		 * Emitted when the `net` module fails to issue a network request. Typically when
		 * the `request` object emits an `error` event, a `close` event will subsequently
		 * follow and no response object will be provided.
		 */

		on(event: 'error', listener: (
			/**
			 * an error object providing some information about the failure.
			 */
			error: Error) => void): this;

		once(event: 'error', listener: (
			/**
			 * an error object providing some information about the failure.
			 */
			error: Error) => void): this;

		addListener(event: 'error', listener: (
			/**
			 * an error object providing some information about the failure.
			 */
			error: Error) => void): this;

		removeListener(event: 'error', listener: (
			/**
			 * an error object providing some information about the failure.
			 */
			error: Error) => void): this;
		/**
		 * Emitted just after the last chunk of the `request`'s data has been written into
		 * the `request` object.
		 */

		on(event: 'finish', listener: Function): this;

		once(event: 'finish', listener: Function): this;

		addListener(event: 'finish', listener: Function): this;

		removeListener(event: 'finish', listener: Function): this;
		/**
		 * Emitted when an authenticating proxy is asking for user credentials.
		 *
		 * The `callback` function is expected to be called back with user credentials:
		 *
		 * * `username` String
		 * * `password` String
		 *
		 * Providing empty credentials will cancel the request and report an authentication
		 * error on the response object:
		 */

		on(event: 'login', listener: (authInfo: AuthInfo,
		                              callback: (username?: string, password?: string) => void) => void): this;
		once(event: 'login', listener: (authInfo: AuthInfo,
		                                callback: (username?: string, password?: string) => void) => void): this;

		addListener(event: 'login', listener: (authInfo: AuthInfo,
		                                       callback: (username?: string, password?: string) => void) => void): this;

		removeListener(event: 'login', listener: (authInfo: AuthInfo,
		                                          callback: (username?: string, password?: string) => void) => void): this;
		/**
		 * Emitted when the server returns a redirect response (e.g. 301 Moved
		 * Permanently). Calling `request.followRedirect` will continue with the
		 * redirection.  If this event is handled, `request.followRedirect` must be called
		 * **synchronously**, otherwise the request will be cancelled.
		 */

		on(event: 'redirect', listener: (statusCode: number,
		                                 method: string,
		                                 redirectUrl: string,
		                                 responseHeaders: Record<string, string[]>) => void): this;

		once(event: 'redirect', listener: (statusCode: number,
		                                   method: string,
		                                   redirectUrl: string,
		                                   responseHeaders: Record<string, string[]>) => void): this;

		addListener(event: 'redirect', listener: (statusCode: number,
		                                          method: string,
		                                          redirectUrl: string,
		                                          responseHeaders: Record<string, string[]>) => void): this;

		removeListener(event: 'redirect', listener: (statusCode: number,
		                                             method: string,
		                                             redirectUrl: string,
		                                             responseHeaders: Record<string, string[]>) => void): this;

		on(event: 'response', listener: (
			/**
			 * An object representing the HTTP response message.
			 */
			response: IncomingMessage) => void): this;

		once(event: 'response', listener: (
			/**
			 * An object representing the HTTP response message.
			 */
			response: IncomingMessage) => void): this;

		addListener(event: 'response', listener: (
			/**
			 * An object representing the HTTP response message.
			 */
			response: IncomingMessage) => void): this;

		removeListener(event: 'response', listener: (
			/**
			 * An object representing the HTTP response message.
			 */
			response: IncomingMessage) => void): this;

		/**
		 * Cancels an ongoing HTTP transaction. If the request has already emitted the
		 * `close` event, the abort operation will have no effect. Otherwise an ongoing
		 * event will emit `abort` and `close` events. Additionally, if there is an ongoing
		 * response object,it will emit the `aborted` event.
		 */
		abort(): void;
		/**
		 * Sends the last chunk of the request data. Subsequent write or end operations
		 * will not be allowed. The `finish` event is emitted just after the end operation.
		 */
		end(chunk?: (string) | (Buffer), encoding?: string, callback?: () => void): void;
		/**
		 * Continues any pending redirection. Can only be called during a `'redirect'`
		 * event.
		 */
		followRedirect(): void;
		/**
		 * The value of a previously set extra header name.
		 */
		getHeader(name: string): string;
		/**
		 * * `active` Boolean - Whether the request is currently active. If this is false
		 * no other properties will be set
		 * * `started` Boolean - Whether the upload has started. If this is false both
		 * `current` and `total` will be set to 0.
		 * * `current` Integer - The number of bytes that have been uploaded so far
		 * * `total` Integer - The number of bytes that will be uploaded this request
		 *
		 * You can use this method in conjunction with `POST` requests to get the progress
		 * of a file upload or other data transfer.
		 */
		getUploadProgress(): UploadProgress;
		/**
		 * Removes a previously set extra header name. This method can be called only
		 * before first write. Trying to call it after the first write will throw an error.
		 */
		removeHeader(name: string): void;
		/**
		 * Adds an extra HTTP header. The header name will be issued as-is without
		 * lowercasing. It can be called only before first write. Calling this method after
		 * the first write will throw an error. If the passed value is not a `String`, its
		 * `toString()` method will be called to obtain the final value.
		 *
		 * Certain headers are restricted from being set by apps. These headers are listed
		 * below. More information on restricted headers can be found in Chromium's header
		 * utils.
		 *
		 * * `Content-Length`
		 * * `Host`
		 * * `Trailer` or `Te`
		 * * `Upgrade`
		 * * `Cookie2`
		 * * `Keep-Alive`
		 * * `Transfer-Encoding`
		 *
		 * Additionally, setting the `Connection` header to the value `upgrade` is also
		 * disallowed.
		 */
		setHeader(name: string, value: string): void;
		/**
		 * `callback` is essentially a dummy function introduced in the purpose of keeping
		 * similarity with the Node.js API. It is called asynchronously in the next tick
		 * after `chunk` content have been delivered to the Chromium networking layer.
		 * Contrary to the Node.js implementation, it is not guaranteed that `chunk`
		 * content have been flushed on the wire before `callback` is called.
		 *
		 * Adds a chunk of data to the request body. The first write operation may cause
		 * the request headers to be issued on the wire. After the first write operation,
		 * it is not allowed to add or remove a custom header.
		 */
		write(chunk: (string) | (Buffer), encoding?: string, callback?: () => void): void;
		chunkedEncoding: boolean;
	}
}


declare module 'electron-updater' {
	declare export var autoUpdater: AutoUpdater
}

// https://electronjs.org/docs/api/structures/notification-action
export type NotificationAction = {|
	type: string,
	text?: string
|}

/** Stub definition */
declare class ElectronHttpExecutor {
}

declare class AutoUpdater {
	on(AutoUpdaterEvent, (...Array<any>) => mixed): this;
	once(AutoUpdaterEvent, (...Array<any>) => mixed): this;
	removeListener(AutoUpdaterEvent, (...Array<any>) => void): void;
	removeAllListeners(AutoUpdaterEvent): this;
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
	downloadUpdate(): Promise<Array<string>>; // paths of the dl'd assets
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
	| 'did-navigate' // passed through from webContents
	| 'zoom-changed' // passed through from webContents

// https://github.com/electron/electron/blob/master/docs/api/web-contents.md#instance-events
export type WebContentsEventType
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
	| 'closed'
	| 'zoom-changed'
	| 'remote-get-current-window'
	| 'remote-get-current-web-contents'
	| 'remote-get-builtin'
	| 'remote-get-global'
	| 'remote-require'

export type AutoUpdaterEvent
	= 'error'
	| 'checking-for-update'
	| 'update-available'
	| 'update-not-available'
	| 'download-progress'
	| 'update-downloaded'

export type TrayEvent
	= 'click'

declare module 'request' {
	declare export default any;
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

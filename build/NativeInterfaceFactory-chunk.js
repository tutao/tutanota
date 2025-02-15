import "./dist-chunk.js";
import { ProgrammingError } from "./ProgrammingError-chunk.js";
import { assertMainOrNode, isAndroidApp, isApp, isBrowser, isDesktop, isElectronClient, isIOSApp } from "./Env-chunk.js";
import { client } from "./ClientDetector-chunk.js";
import { assertNotNull, base64ToUint8Array, defer, utf8Uint8ArrayToString } from "./dist2-chunk.js";
import "./WhitelabelCustomizations-chunk.js";
import { lang } from "./LanguageViewModel-chunk.js";
import { PushServiceType } from "./TutanotaConstants-chunk.js";
import "./luxon-chunk.js";
import { getElementId } from "./EntityUtils-chunk.js";
import "./TypeModels-chunk.js";
import "./TypeRefs-chunk.js";
import "./CommonCalendarUtils-chunk.js";
import "./TypeModels2-chunk.js";
import { PushIdentifierTypeRef, createPushIdentifier } from "./TypeRefs2-chunk.js";
import "./ParserCombinator-chunk.js";
import "./CalendarUtils-chunk.js";
import "./ImportExportUtils-chunk.js";
import "./FormatValidator-chunk.js";
import "./stream-chunk.js";
import { deviceConfig } from "./DeviceConfig-chunk.js";
import { ModelInfo_default$1 as ModelInfo_default } from "./ModelInfo-chunk.js";
import "./ErrorUtils-chunk.js";
import "./RestError-chunk.js";
import "./OutOfSyncError-chunk.js";
import "./CancelledError-chunk.js";
import "./SuspensionError-chunk.js";
import "./LoginIncompleteError-chunk.js";
import "./CryptoError-chunk.js";
import "./RecipientsNotFoundError-chunk.js";
import "./DbError-chunk.js";
import "./QuotaExceededError-chunk.js";
import { DeviceStorageUnavailableError } from "./DeviceStorageUnavailableError-chunk.js";
import "./MailBodyTooLargeError-chunk.js";
import "./ImportError-chunk.js";
import "./WebauthnError-chunk.js";
import "./PermissionError-chunk.js";
import { MessageDispatcher, Request } from "./MessageDispatcher-chunk.js";
import { ExportFacadeSendDispatcher, FileFacadeSendDispatcher, InterWindowEventFacadeSendDispatcher, NativeFileApp, NativePushFacadeSendDispatcher } from "./InterWindowEventFacadeSendDispatcher-chunk.js";
import { locator } from "./CommonLocator-chunk.js";
import { decodeNativeMessage, encodeNativeMessage } from "./NativeLineProtocol-chunk.js";
import { DesktopNativeTransport } from "./DesktopNativeTransport-chunk.js";

//#region src/common/native/main/IosNativeTransport.ts
assertMainOrNode();
var IosNativeTransport = class {
	messageHandler = null;
	constructor(window$1) {
		this.window = window$1;
		this.window.tutao.nativeApp = this;
	}
	postMessage(message) {
		const encoded = encodeNativeMessage(message);
		this.window.webkit.messageHandlers.nativeApp.postMessage(encoded);
	}
	setMessageHandler(handler) {
		this.messageHandler = handler;
	}
	receiveMessageFromApp(msg64) {
		const handler = this.messageHandler;
		if (handler) {
			const msg = utf8Uint8ArrayToString(base64ToUint8Array(msg64));
			const parsed = decodeNativeMessage(msg);
			handler(parsed);
		} else console.warn("Request from native but no handler is set!");
	}
};

//#endregion
//#region src/common/native/main/AndroidNativeTransport.ts
assertMainOrNode();
var AndroidNativeTransport = class {
	messageHandler = null;
	deferredPort = defer();
	constructor(window$1) {
		this.window = window$1;
	}
	/**
	* Creates a global `window.onmessage` handler, and then tells native to create the messageport channel
	*/
	start() {
		this.window.onmessage = (message) => {
			const port = message.ports[0];
			port.onmessage = (messageEvent) => {
				const handler = this.messageHandler;
				if (handler) {
					const response = decodeNativeMessage(messageEvent.data);
					handler(response);
				}
			};
			this.deferredPort.resolve(port);
		};
		this.window.nativeApp.startWebMessageChannel();
	}
	postMessage(message) {
		const encoded = encodeNativeMessage(message);
		this.deferredPort.promise.then((port) => port.postMessage(encoded));
	}
	setMessageHandler(handler) {
		this.messageHandler = handler;
	}
};

//#endregion
//#region src/common/native/main/NativeInterfaceMain.ts
assertMainOrNode();
var NativeInterfaceMain = class {
	_dispatchDeferred = defer();
	_appUpdateListener = null;
	constructor(globalDispatcher) {
		this.globalDispatcher = globalDispatcher;
	}
	async init() {
		let transport;
		if (isAndroidApp()) {
			const androidTransport = new AndroidNativeTransport(window);
			androidTransport.start();
			transport = androidTransport;
		} else if (isIOSApp()) transport = new IosNativeTransport(window);
else if (isElectronClient()) transport = new DesktopNativeTransport(window.nativeApp);
else throw new ProgrammingError("Tried to create a native interface in the browser");
		const queue = new MessageDispatcher(transport, { ipc: (request) => this.globalDispatcher.dispatch(request.args[0], request.args[1], request.args.slice(2)) }, "main-worker");
		await queue.postRequest(new Request("ipc", ["CommonSystemFacade", "initializeRemoteBridge"]));
		this._dispatchDeferred.resolve(queue);
	}
	async initWithQueue(queue) {
		this._dispatchDeferred.resolve(queue);
	}
	/**
	* Send a request to the native side.
	*/
	async invokeNative(requestType, args) {
		const dispatch = await this._dispatchDeferred.promise;
		return dispatch.postRequest(new Request(requestType, args));
	}
	/**
	* Saves a listener method to be called when an app update has been downloaded on the native side.
	*/
	setAppUpdateListener(listener) {
		this._appUpdateListener = listener;
	}
	/**
	* Call the update listener if set.
	*/
	handleUpdateDownload() {
		this._appUpdateListener?.();
	}
};

//#endregion
//#region src/common/native/main/NativePushServiceApp.ts
const MOBILE_SYS_MODEL_VERSION = 99;
function effectiveModelVersion() {
	return isDesktop() ? ModelInfo_default.version : MOBILE_SYS_MODEL_VERSION;
}
var NativePushServiceApp = class {
	_currentIdentifier = null;
	constructor(nativePushFacade, logins, cryptoFacade, entityClient, deviceConfig$1, calendarFacade, app) {
		this.nativePushFacade = nativePushFacade;
		this.logins = logins;
		this.cryptoFacade = cryptoFacade;
		this.entityClient = entityClient;
		this.deviceConfig = deviceConfig$1;
		this.calendarFacade = calendarFacade;
		this.app = app;
	}
	async register() {
		console.log("Registering for push notifications for app", this.app);
		if (isAndroidApp() || isDesktop()) try {
			const identifier = await this.loadPushIdentifierFromNative() ?? await locator.workerFacade.generateSsePushIdentifer();
			const pushIdentifier = await this.loadPushIdentifier(identifier) ?? await this.createPushIdentifierInstance(identifier, PushServiceType.SSE);
			this._currentIdentifier = {
				identifier,
				disabled: pushIdentifier.disabled
			};
			await this.storePushIdentifierLocally(pushIdentifier);
			const userId = this.logins.getUserController().userId;
			if (!await locator.pushService.allowReceiveCalendarNotifications()) await this.nativePushFacade.invalidateAlarmsForUser(userId);
else await this.scheduleAlarmsIfNeeded(pushIdentifier);
			await this.initPushNotifications();
		} catch (e) {
			if (e instanceof DeviceStorageUnavailableError) console.warn("Device storage is unavailable, cannot register for push notifications", e);
else throw e;
		}
else if (isIOSApp()) {
			const identifier = await this.loadPushIdentifierFromNative();
			if (identifier) {
				const pushIdentifier = await this.loadPushIdentifier(identifier) ?? await this.createPushIdentifierInstance(identifier, PushServiceType.IOS);
				this._currentIdentifier = {
					identifier,
					disabled: pushIdentifier.disabled
				};
				if (pushIdentifier.language !== lang.code) {
					pushIdentifier.language = lang.code;
					locator.entityClient.update(pushIdentifier);
				}
				await this.storePushIdentifierLocally(pushIdentifier);
				const userId = this.logins.getUserController().userId;
				if (!await locator.pushService.allowReceiveCalendarNotifications()) await this.nativePushFacade.invalidateAlarmsForUser(userId);
else await this.scheduleAlarmsIfNeeded(pushIdentifier);
			} else console.log("Push notifications were rejected by user");
		}
	}
	async reRegister() {
		console.log("re-registering for push notifications, setting no alarms as scheduled");
		this.deviceConfig.setNoAlarmsScheduled();
		if (this.logins.isUserLoggedIn()) {
			await this.logins.waitForFullLogin();
			return this.register();
		} else return Promise.resolve();
	}
	async invalidateAlarmsForUser(userId) {
		return this.nativePushFacade.invalidateAlarmsForUser(userId);
	}
	removeUserFromNotifications(userId) {
		return this.nativePushFacade.removeUser(userId);
	}
	loadPushIdentifierFromNative() {
		return this.nativePushFacade.getPushIdentifier();
	}
	async storePushIdentifierLocally(pushIdentifier) {
		const userId = this.logins.getUserController().user._id;
		const sk = assertNotNull(await this.cryptoFacade.resolveSessionKeyForInstanceBinary(pushIdentifier));
		const origin = assertNotNull(env.staticUrl);
		await this.nativePushFacade.storePushIdentifierLocally(pushIdentifier.identifier, userId, origin, getElementId(pushIdentifier), sk);
	}
	async loadPushIdentifier(identifier) {
		const list = assertNotNull(this.logins.getUserController().user.pushIdentifierList);
		const identifiers = await this.entityClient.loadAll(PushIdentifierTypeRef, list.list);
		return identifiers.find((i) => i.identifier === identifier) ?? null;
	}
	async createPushIdentifierInstance(identifier, pushServiceType) {
		const list = assertNotNull(this.logins.getUserController().user.pushIdentifierList?.list);
		const pushIdentifier = createPushIdentifier({
			_area: "0",
			_owner: this.logins.getUserController().userGroupInfo.group,
			_ownerGroup: this.logins.getUserController().userGroupInfo.group,
			displayName: client.getIdentifier(),
			pushServiceType,
			identifier,
			language: lang.code,
			disabled: false,
			lastUsageTime: new Date(),
			lastNotificationDate: null,
			app: this.app
		});
		const id = await this.entityClient.setup(list, pushIdentifier);
		return this.entityClient.load(PushIdentifierTypeRef, [list, id]);
	}
	async closePushNotification(addresses) {
		await this.nativePushFacade.closePushNotifications(addresses);
	}
	getLoadedPushIdentifier() {
		return this._currentIdentifier;
	}
	getExtendedNotificationMode() {
		return this.nativePushFacade.getExtendedNotificationConfig(this.logins.getUserController().userId);
	}
	async setExtendedNotificationMode(type) {
		await this.nativePushFacade.setExtendedNotificationConfig(this.logins.getUserController().userId, type);
	}
	initPushNotifications() {
		return this.nativePushFacade.initPushNotifications();
	}
	async scheduleAlarmsIfNeeded(pushIdentifier) {
		if (this._currentIdentifier?.disabled) return;
		const userId = this.logins.getUserController().user._id;
		const scheduledAlarmsModelVersion = this.deviceConfig.getScheduledAlarmsModelVersion(userId);
		if (scheduledAlarmsModelVersion == null || scheduledAlarmsModelVersion < effectiveModelVersion()) {
			console.log(`Alarms not scheduled for user ${userId} (stored v ${scheduledAlarmsModelVersion}), scheduling`);
			await this.nativePushFacade.invalidateAlarmsForUser(userId);
			await this.calendarFacade.scheduleAlarmsForNewDevice(pushIdentifier);
			this.deviceConfig.setScheduledAlarmsModelVersion(userId, effectiveModelVersion());
		}
	}
	async setReceiveCalendarNotificationConfig(value) {
		await this.nativePushFacade.setReceiveCalendarNotificationConfig(this.getLoadedPushIdentifier().identifier, value);
	}
	async getReceiveCalendarNotificationConfig() {
		const pushIdentifier = this.getLoadedPushIdentifier();
		if (!pushIdentifier) return true;
		return await this.nativePushFacade.getReceiveCalendarNotificationConfig(pushIdentifier.identifier);
	}
	async allowReceiveCalendarNotifications() {
		return !isApp() || await this.getReceiveCalendarNotificationConfig();
	}
};

//#endregion
//#region src/common/native/common/generatedipc/CommonNativeFacadeReceiveDispatcher.ts
var CommonNativeFacadeReceiveDispatcher = class {
	constructor(facade) {
		this.facade = facade;
	}
	async dispatch(method, arg) {
		switch (method) {
			case "createMailEditor": {
				const filesUris = arg[0];
				const text = arg[1];
				const addresses = arg[2];
				const subject = arg[3];
				const mailToUrlString = arg[4];
				return this.facade.createMailEditor(filesUris, text, addresses, subject, mailToUrlString);
			}
			case "openMailBox": {
				const userId = arg[0];
				const address = arg[1];
				const requestedPath = arg[2];
				return this.facade.openMailBox(userId, address, requestedPath);
			}
			case "openCalendar": {
				const userId = arg[0];
				return this.facade.openCalendar(userId);
			}
			case "openContactEditor": {
				const contactId = arg[0];
				return this.facade.openContactEditor(contactId);
			}
			case "showAlertDialog": {
				const translationKey = arg[0];
				return this.facade.showAlertDialog(translationKey);
			}
			case "invalidateAlarms": return this.facade.invalidateAlarms();
			case "updateTheme": return this.facade.updateTheme();
			case "promptForNewPassword": {
				const title = arg[0];
				const oldPassword = arg[1];
				return this.facade.promptForNewPassword(title, oldPassword);
			}
			case "promptForPassword": {
				const title = arg[0];
				return this.facade.promptForPassword(title);
			}
			case "handleFileImport": {
				const filesUris = arg[0];
				return this.facade.handleFileImport(filesUris);
			}
			case "openSettings": {
				const path = arg[0];
				return this.facade.openSettings(path);
			}
		}
	}
};

//#endregion
//#region src/common/native/common/generatedipc/DesktopFacadeReceiveDispatcher.ts
var DesktopFacadeReceiveDispatcher = class {
	constructor(facade) {
		this.facade = facade;
	}
	async dispatch(method, arg) {
		switch (method) {
			case "print": return this.facade.print();
			case "showSpellcheckDropdown": return this.facade.showSpellcheckDropdown();
			case "openFindInPage": return this.facade.openFindInPage();
			case "applySearchResultToOverlay": {
				const result = arg[0];
				return this.facade.applySearchResultToOverlay(result);
			}
			case "reportError": {
				const errorInfo = arg[0];
				return this.facade.reportError(errorInfo);
			}
			case "updateTargetUrl": {
				const url = arg[0];
				const appPath = arg[1];
				return this.facade.updateTargetUrl(url, appPath);
			}
			case "openCustomer": {
				const mailAddress = arg[0];
				return this.facade.openCustomer(mailAddress);
			}
			case "addShortcuts": {
				const shortcuts = arg[0];
				return this.facade.addShortcuts(shortcuts);
			}
			case "appUpdateDownloaded": return this.facade.appUpdateDownloaded();
		}
	}
};

//#endregion
//#region src/common/native/common/generatedipc/InterWindowEventFacadeReceiveDispatcher.ts
var InterWindowEventFacadeReceiveDispatcher = class {
	constructor(facade) {
		this.facade = facade;
	}
	async dispatch(method, arg) {
		switch (method) {
			case "localUserDataInvalidated": {
				const userId = arg[0];
				return this.facade.localUserDataInvalidated(userId);
			}
			case "reloadDeviceConfig": return this.facade.reloadDeviceConfig();
		}
	}
};

//#endregion
//#region src/common/native/common/generatedipc/MobileFacadeReceiveDispatcher.ts
var MobileFacadeReceiveDispatcher = class {
	constructor(facade) {
		this.facade = facade;
	}
	async dispatch(method, arg) {
		switch (method) {
			case "handleBackPress": return this.facade.handleBackPress();
			case "visibilityChange": {
				const visibility = arg[0];
				return this.facade.visibilityChange(visibility);
			}
			case "keyboardSizeChanged": {
				const newSize = arg[0];
				return this.facade.keyboardSizeChanged(newSize);
			}
		}
	}
};

//#endregion
//#region src/common/native/common/generatedipc/WebGlobalDispatcher.ts
var WebGlobalDispatcher = class {
	commonNativeFacade;
	desktopFacade;
	interWindowEventFacade;
	mobileFacade;
	constructor(commonNativeFacade, desktopFacade, interWindowEventFacade, mobileFacade) {
		this.commonNativeFacade = new CommonNativeFacadeReceiveDispatcher(commonNativeFacade);
		this.desktopFacade = new DesktopFacadeReceiveDispatcher(desktopFacade);
		this.interWindowEventFacade = new InterWindowEventFacadeReceiveDispatcher(interWindowEventFacade);
		this.mobileFacade = new MobileFacadeReceiveDispatcher(mobileFacade);
	}
	async dispatch(facadeName, methodName, args) {
		switch (facadeName) {
			case "CommonNativeFacade": return this.commonNativeFacade.dispatch(methodName, args);
			case "DesktopFacade": return this.desktopFacade.dispatch(methodName, args);
			case "InterWindowEventFacade": return this.interWindowEventFacade.dispatch(methodName, args);
			case "MobileFacade": return this.mobileFacade.dispatch(methodName, args);
			default: throw new Error("licc messed up! " + facadeName);
		}
	}
};

//#endregion
//#region src/common/native/common/generatedipc/CommonSystemFacadeSendDispatcher.ts
var CommonSystemFacadeSendDispatcher = class {
	constructor(transport) {
		this.transport = transport;
	}
	async initializeRemoteBridge(...args) {
		return this.transport.invokeNative("ipc", [
			"CommonSystemFacade",
			"initializeRemoteBridge",
			...args
		]);
	}
	async reload(...args) {
		return this.transport.invokeNative("ipc", [
			"CommonSystemFacade",
			"reload",
			...args
		]);
	}
	async getLog(...args) {
		return this.transport.invokeNative("ipc", [
			"CommonSystemFacade",
			"getLog",
			...args
		]);
	}
};

//#endregion
//#region src/common/native/common/generatedipc/MobileSystemFacadeSendDispatcher.ts
var MobileSystemFacadeSendDispatcher = class {
	constructor(transport) {
		this.transport = transport;
	}
	async goToSettings(...args) {
		return this.transport.invokeNative("ipc", [
			"MobileSystemFacade",
			"goToSettings",
			...args
		]);
	}
	async openLink(...args) {
		return this.transport.invokeNative("ipc", [
			"MobileSystemFacade",
			"openLink",
			...args
		]);
	}
	async shareText(...args) {
		return this.transport.invokeNative("ipc", [
			"MobileSystemFacade",
			"shareText",
			...args
		]);
	}
	async hasPermission(...args) {
		return this.transport.invokeNative("ipc", [
			"MobileSystemFacade",
			"hasPermission",
			...args
		]);
	}
	async requestPermission(...args) {
		return this.transport.invokeNative("ipc", [
			"MobileSystemFacade",
			"requestPermission",
			...args
		]);
	}
	async getAppLockMethod(...args) {
		return this.transport.invokeNative("ipc", [
			"MobileSystemFacade",
			"getAppLockMethod",
			...args
		]);
	}
	async setAppLockMethod(...args) {
		return this.transport.invokeNative("ipc", [
			"MobileSystemFacade",
			"setAppLockMethod",
			...args
		]);
	}
	async enforceAppLock(...args) {
		return this.transport.invokeNative("ipc", [
			"MobileSystemFacade",
			"enforceAppLock",
			...args
		]);
	}
	async getSupportedAppLockMethods(...args) {
		return this.transport.invokeNative("ipc", [
			"MobileSystemFacade",
			"getSupportedAppLockMethods",
			...args
		]);
	}
	async openMailApp(...args) {
		return this.transport.invokeNative("ipc", [
			"MobileSystemFacade",
			"openMailApp",
			...args
		]);
	}
	async openCalendarApp(...args) {
		return this.transport.invokeNative("ipc", [
			"MobileSystemFacade",
			"openCalendarApp",
			...args
		]);
	}
	async getInstallationDate(...args) {
		return this.transport.invokeNative("ipc", [
			"MobileSystemFacade",
			"getInstallationDate",
			...args
		]);
	}
	async requestInAppRating(...args) {
		return this.transport.invokeNative("ipc", [
			"MobileSystemFacade",
			"requestInAppRating",
			...args
		]);
	}
};

//#endregion
//#region src/common/native/common/generatedipc/ThemeFacadeSendDispatcher.ts
var ThemeFacadeSendDispatcher = class {
	constructor(transport) {
		this.transport = transport;
	}
	async getThemes(...args) {
		return this.transport.invokeNative("ipc", [
			"ThemeFacade",
			"getThemes",
			...args
		]);
	}
	async setThemes(...args) {
		return this.transport.invokeNative("ipc", [
			"ThemeFacade",
			"setThemes",
			...args
		]);
	}
	async getThemePreference(...args) {
		return this.transport.invokeNative("ipc", [
			"ThemeFacade",
			"getThemePreference",
			...args
		]);
	}
	async setThemePreference(...args) {
		return this.transport.invokeNative("ipc", [
			"ThemeFacade",
			"setThemePreference",
			...args
		]);
	}
	async prefersDark(...args) {
		return this.transport.invokeNative("ipc", [
			"ThemeFacade",
			"prefersDark",
			...args
		]);
	}
};

//#endregion
//#region src/common/native/common/generatedipc/SearchTextInAppFacadeSendDispatcher.ts
var SearchTextInAppFacadeSendDispatcher = class {
	constructor(transport) {
		this.transport = transport;
	}
	async findInPage(...args) {
		return this.transport.invokeNative("ipc", [
			"SearchTextInAppFacade",
			"findInPage",
			...args
		]);
	}
	async stopFindInPage(...args) {
		return this.transport.invokeNative("ipc", [
			"SearchTextInAppFacade",
			"stopFindInPage",
			...args
		]);
	}
	async setSearchOverlayState(...args) {
		return this.transport.invokeNative("ipc", [
			"SearchTextInAppFacade",
			"setSearchOverlayState",
			...args
		]);
	}
};

//#endregion
//#region src/common/native/common/generatedipc/SettingsFacadeSendDispatcher.ts
var SettingsFacadeSendDispatcher = class {
	constructor(transport) {
		this.transport = transport;
	}
	async getStringConfigValue(...args) {
		return this.transport.invokeNative("ipc", [
			"SettingsFacade",
			"getStringConfigValue",
			...args
		]);
	}
	async setStringConfigValue(...args) {
		return this.transport.invokeNative("ipc", [
			"SettingsFacade",
			"setStringConfigValue",
			...args
		]);
	}
	async getBooleanConfigValue(...args) {
		return this.transport.invokeNative("ipc", [
			"SettingsFacade",
			"getBooleanConfigValue",
			...args
		]);
	}
	async setBooleanConfigValue(...args) {
		return this.transport.invokeNative("ipc", [
			"SettingsFacade",
			"setBooleanConfigValue",
			...args
		]);
	}
	async getUpdateInfo(...args) {
		return this.transport.invokeNative("ipc", [
			"SettingsFacade",
			"getUpdateInfo",
			...args
		]);
	}
	async registerMailto(...args) {
		return this.transport.invokeNative("ipc", [
			"SettingsFacade",
			"registerMailto",
			...args
		]);
	}
	async unregisterMailto(...args) {
		return this.transport.invokeNative("ipc", [
			"SettingsFacade",
			"unregisterMailto",
			...args
		]);
	}
	async integrateDesktop(...args) {
		return this.transport.invokeNative("ipc", [
			"SettingsFacade",
			"integrateDesktop",
			...args
		]);
	}
	async unIntegrateDesktop(...args) {
		return this.transport.invokeNative("ipc", [
			"SettingsFacade",
			"unIntegrateDesktop",
			...args
		]);
	}
	async getSpellcheckLanguages(...args) {
		return this.transport.invokeNative("ipc", [
			"SettingsFacade",
			"getSpellcheckLanguages",
			...args
		]);
	}
	async getIntegrationInfo(...args) {
		return this.transport.invokeNative("ipc", [
			"SettingsFacade",
			"getIntegrationInfo",
			...args
		]);
	}
	async enableAutoLaunch(...args) {
		return this.transport.invokeNative("ipc", [
			"SettingsFacade",
			"enableAutoLaunch",
			...args
		]);
	}
	async disableAutoLaunch(...args) {
		return this.transport.invokeNative("ipc", [
			"SettingsFacade",
			"disableAutoLaunch",
			...args
		]);
	}
	async manualUpdate(...args) {
		return this.transport.invokeNative("ipc", [
			"SettingsFacade",
			"manualUpdate",
			...args
		]);
	}
	async changeLanguage(...args) {
		return this.transport.invokeNative("ipc", [
			"SettingsFacade",
			"changeLanguage",
			...args
		]);
	}
};

//#endregion
//#region src/common/native/common/generatedipc/DesktopSystemFacadeSendDispatcher.ts
var DesktopSystemFacadeSendDispatcher = class {
	constructor(transport) {
		this.transport = transport;
	}
	async openNewWindow(...args) {
		return this.transport.invokeNative("ipc", [
			"DesktopSystemFacade",
			"openNewWindow",
			...args
		]);
	}
	async focusApplicationWindow(...args) {
		return this.transport.invokeNative("ipc", [
			"DesktopSystemFacade",
			"focusApplicationWindow",
			...args
		]);
	}
	async sendSocketMessage(...args) {
		return this.transport.invokeNative("ipc", [
			"DesktopSystemFacade",
			"sendSocketMessage",
			...args
		]);
	}
};

//#endregion
//#region src/common/native/common/generatedipc/MobileContactsFacadeSendDispatcher.ts
var MobileContactsFacadeSendDispatcher = class {
	constructor(transport) {
		this.transport = transport;
	}
	async findSuggestions(...args) {
		return this.transport.invokeNative("ipc", [
			"MobileContactsFacade",
			"findSuggestions",
			...args
		]);
	}
	async saveContacts(...args) {
		return this.transport.invokeNative("ipc", [
			"MobileContactsFacade",
			"saveContacts",
			...args
		]);
	}
	async syncContacts(...args) {
		return this.transport.invokeNative("ipc", [
			"MobileContactsFacade",
			"syncContacts",
			...args
		]);
	}
	async getContactBooks(...args) {
		return this.transport.invokeNative("ipc", [
			"MobileContactsFacade",
			"getContactBooks",
			...args
		]);
	}
	async getContactsInContactBook(...args) {
		return this.transport.invokeNative("ipc", [
			"MobileContactsFacade",
			"getContactsInContactBook",
			...args
		]);
	}
	async deleteContacts(...args) {
		return this.transport.invokeNative("ipc", [
			"MobileContactsFacade",
			"deleteContacts",
			...args
		]);
	}
	async isLocalStorageAvailable(...args) {
		return this.transport.invokeNative("ipc", [
			"MobileContactsFacade",
			"isLocalStorageAvailable",
			...args
		]);
	}
	async findLocalMatches(...args) {
		return this.transport.invokeNative("ipc", [
			"MobileContactsFacade",
			"findLocalMatches",
			...args
		]);
	}
	async deleteLocalContacts(...args) {
		return this.transport.invokeNative("ipc", [
			"MobileContactsFacade",
			"deleteLocalContacts",
			...args
		]);
	}
};

//#endregion
//#region src/common/native/common/generatedipc/NativeCredentialsFacadeSendDispatcher.ts
var NativeCredentialsFacadeSendDispatcher = class {
	constructor(transport) {
		this.transport = transport;
	}
	async getSupportedEncryptionModes(...args) {
		return this.transport.invokeNative("ipc", [
			"NativeCredentialsFacade",
			"getSupportedEncryptionModes",
			...args
		]);
	}
	async loadAll(...args) {
		return this.transport.invokeNative("ipc", [
			"NativeCredentialsFacade",
			"loadAll",
			...args
		]);
	}
	async store(...args) {
		return this.transport.invokeNative("ipc", [
			"NativeCredentialsFacade",
			"store",
			...args
		]);
	}
	async storeEncrypted(...args) {
		return this.transport.invokeNative("ipc", [
			"NativeCredentialsFacade",
			"storeEncrypted",
			...args
		]);
	}
	async loadByUserId(...args) {
		return this.transport.invokeNative("ipc", [
			"NativeCredentialsFacade",
			"loadByUserId",
			...args
		]);
	}
	async deleteByUserId(...args) {
		return this.transport.invokeNative("ipc", [
			"NativeCredentialsFacade",
			"deleteByUserId",
			...args
		]);
	}
	async getCredentialEncryptionMode(...args) {
		return this.transport.invokeNative("ipc", [
			"NativeCredentialsFacade",
			"getCredentialEncryptionMode",
			...args
		]);
	}
	async setCredentialEncryptionMode(...args) {
		return this.transport.invokeNative("ipc", [
			"NativeCredentialsFacade",
			"setCredentialEncryptionMode",
			...args
		]);
	}
	async clear(...args) {
		return this.transport.invokeNative("ipc", [
			"NativeCredentialsFacade",
			"clear",
			...args
		]);
	}
	async migrateToNativeCredentials(...args) {
		return this.transport.invokeNative("ipc", [
			"NativeCredentialsFacade",
			"migrateToNativeCredentials",
			...args
		]);
	}
};

//#endregion
//#region src/common/native/common/generatedipc/MobilePaymentsFacadeSendDispatcher.ts
var MobilePaymentsFacadeSendDispatcher = class {
	constructor(transport) {
		this.transport = transport;
	}
	async requestSubscriptionToPlan(...args) {
		return this.transport.invokeNative("ipc", [
			"MobilePaymentsFacade",
			"requestSubscriptionToPlan",
			...args
		]);
	}
	async getPlanPrices(...args) {
		return this.transport.invokeNative("ipc", [
			"MobilePaymentsFacade",
			"getPlanPrices",
			...args
		]);
	}
	async showSubscriptionConfigView(...args) {
		return this.transport.invokeNative("ipc", [
			"MobilePaymentsFacade",
			"showSubscriptionConfigView",
			...args
		]);
	}
	async queryAppStoreSubscriptionOwnership(...args) {
		return this.transport.invokeNative("ipc", [
			"MobilePaymentsFacade",
			"queryAppStoreSubscriptionOwnership",
			...args
		]);
	}
	async isAppStoreRenewalEnabled(...args) {
		return this.transport.invokeNative("ipc", [
			"MobilePaymentsFacade",
			"isAppStoreRenewalEnabled",
			...args
		]);
	}
};

//#endregion
//#region src/common/native/common/generatedipc/ExternalCalendarFacadeSendDispatcher.ts
var ExternalCalendarFacadeSendDispatcher = class {
	constructor(transport) {
		this.transport = transport;
	}
	async fetchExternalCalendar(...args) {
		return this.transport.invokeNative("ipc", [
			"ExternalCalendarFacade",
			"fetchExternalCalendar",
			...args
		]);
	}
};

//#endregion
//#region src/common/native/common/generatedipc/NativeMailImportFacadeSendDispatcher.ts
var NativeMailImportFacadeSendDispatcher = class {
	constructor(transport) {
		this.transport = transport;
	}
	async getResumableImport(...args) {
		return this.transport.invokeNative("ipc", [
			"NativeMailImportFacade",
			"getResumableImport",
			...args
		]);
	}
	async prepareNewImport(...args) {
		return this.transport.invokeNative("ipc", [
			"NativeMailImportFacade",
			"prepareNewImport",
			...args
		]);
	}
	async setProgressAction(...args) {
		return this.transport.invokeNative("ipc", [
			"NativeMailImportFacade",
			"setProgressAction",
			...args
		]);
	}
	async setAsyncErrorHook(...args) {
		return this.transport.invokeNative("ipc", [
			"NativeMailImportFacade",
			"setAsyncErrorHook",
			...args
		]);
	}
};

//#endregion
//#region src/common/native/main/NativeInterfaceFactory.ts
function createNativeInterfaces(mobileFacade, desktopFacade, interWindowEventFacade, commonNativeFacade, cryptoFacade, calendarFacade, entityClient, logins, app) {
	if (isBrowser()) throw new ProgrammingError("Tried to make native interfaces in non-native");
	const dispatcher = new WebGlobalDispatcher(commonNativeFacade, desktopFacade, interWindowEventFacade, mobileFacade);
	const native = new NativeInterfaceMain(dispatcher);
	const nativePushFacadeSendDispatcher = new NativePushFacadeSendDispatcher(native);
	const pushService = new NativePushServiceApp(nativePushFacadeSendDispatcher, logins, cryptoFacade, entityClient, deviceConfig, calendarFacade, app);
	const fileApp = new NativeFileApp(new FileFacadeSendDispatcher(native), new ExportFacadeSendDispatcher(native));
	const commonSystemFacade = new CommonSystemFacadeSendDispatcher(native);
	const mobileSystemFacade = new MobileSystemFacadeSendDispatcher(native);
	const themeFacade = new ThemeFacadeSendDispatcher(native);
	const mobileContactsFacade = new MobileContactsFacadeSendDispatcher(native);
	const nativeCredentialsFacade = new NativeCredentialsFacadeSendDispatcher(native);
	const mobilePaymentsFacade = new MobilePaymentsFacadeSendDispatcher(native);
	const externalCalendarFacade = new ExternalCalendarFacadeSendDispatcher(native);
	return {
		native,
		fileApp,
		pushService,
		mobileSystemFacade,
		commonSystemFacade,
		themeFacade,
		mobileContactsFacade,
		nativeCredentialsFacade,
		mobilePaymentsFacade,
		externalCalendarFacade
	};
}
function createDesktopInterfaces(native) {
	if (!isElectronClient()) throw new ProgrammingError("tried to create desktop interfaces in non-electron client");
	return {
		searchTextFacade: new SearchTextInAppFacadeSendDispatcher(native),
		desktopSettingsFacade: new SettingsFacadeSendDispatcher(native),
		desktopSystemFacade: new DesktopSystemFacadeSendDispatcher(native),
		nativeMailImportFacade: new NativeMailImportFacadeSendDispatcher(native),
		interWindowEventSender: new InterWindowEventFacadeSendDispatcher(native),
		exportFacade: new ExportFacadeSendDispatcher(native)
	};
}

//#endregion
export { createDesktopInterfaces, createNativeInterfaces };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTmF0aXZlSW50ZXJmYWNlRmFjdG9yeS1jaHVuay5qcyIsIm5hbWVzIjpbIndpbmRvdzogV2luZG93IiwibWVzc2FnZTogTmF0aXZlTWVzc2FnZSIsImhhbmRsZXI6IEpzTWVzc2FnZUhhbmRsZXIiLCJtc2c2NDogQmFzZTY0Iiwid2luZG93OiBXaW5kb3ciLCJtZXNzYWdlOiBNZXNzYWdlRXZlbnQiLCJtZXNzYWdlRXZlbnQ6IE1lc3NhZ2VFdmVudCIsIm1lc3NhZ2U6IE5hdGl2ZU1lc3NhZ2UiLCJoYW5kbGVyOiBKc01lc3NhZ2VIYW5kbGVyIiwiZ2xvYmFsRGlzcGF0Y2hlcjogV2ViR2xvYmFsRGlzcGF0Y2hlciIsInRyYW5zcG9ydDogVHJhbnNwb3J0PE5hdGl2ZVJlcXVlc3RUeXBlLCBKc1JlcXVlc3RUeXBlPiIsInJlcXVlc3Q6IFJlcXVlc3Q8SnNSZXF1ZXN0VHlwZT4iLCJxdWV1ZTogTWVzc2FnZURpc3BhdGNoZXI8TmF0aXZlUmVxdWVzdFR5cGUsIEpzUmVxdWVzdFR5cGU+IiwicmVxdWVzdFR5cGU6IE5hdGl2ZVJlcXVlc3RUeXBlIiwiYXJnczogUmVhZG9ubHlBcnJheTx1bmtub3duPiIsImxpc3RlbmVyOiAoKSA9PiB2b2lkIiwibW9kZWxJbmZvIiwibmF0aXZlUHVzaEZhY2FkZTogTmF0aXZlUHVzaEZhY2FkZSIsImxvZ2luczogTG9naW5Db250cm9sbGVyIiwiY3J5cHRvRmFjYWRlOiBDcnlwdG9GYWNhZGUiLCJlbnRpdHlDbGllbnQ6IEVudGl0eUNsaWVudCIsImRldmljZUNvbmZpZzogRGV2aWNlQ29uZmlnIiwiY2FsZW5kYXJGYWNhZGU6IENhbGVuZGFyRmFjYWRlIiwiYXBwOiBBcHBUeXBlIiwidXNlcklkOiBJZCIsInB1c2hJZGVudGlmaWVyOiBQdXNoSWRlbnRpZmllciIsImlkZW50aWZpZXI6IHN0cmluZyIsInB1c2hTZXJ2aWNlVHlwZTogUHVzaFNlcnZpY2VUeXBlIiwiYWRkcmVzc2VzOiBzdHJpbmdbXSIsInR5cGU6IEV4dGVuZGVkTm90aWZpY2F0aW9uTW9kZSIsInZhbHVlOiBib29sZWFuIiwiZmFjYWRlOiBDb21tb25OYXRpdmVGYWNhZGUiLCJtZXRob2Q6IHN0cmluZyIsImFyZzogQXJyYXk8YW55PiIsImZpbGVzVXJpczogUmVhZG9ubHlBcnJheTxzdHJpbmc+IiwidGV4dDogc3RyaW5nIiwiYWRkcmVzc2VzOiBSZWFkb25seUFycmF5PHN0cmluZz4iLCJzdWJqZWN0OiBzdHJpbmciLCJtYWlsVG9VcmxTdHJpbmc6IHN0cmluZyIsInVzZXJJZDogc3RyaW5nIiwiYWRkcmVzczogc3RyaW5nIiwicmVxdWVzdGVkUGF0aDogc3RyaW5nIHwgbnVsbCIsImNvbnRhY3RJZDogc3RyaW5nIiwidHJhbnNsYXRpb25LZXk6IHN0cmluZyIsInRpdGxlOiBzdHJpbmciLCJvbGRQYXNzd29yZDogc3RyaW5nIHwgbnVsbCIsInBhdGg6IHN0cmluZyIsImZhY2FkZTogRGVza3RvcEZhY2FkZSIsIm1ldGhvZDogc3RyaW5nIiwiYXJnOiBBcnJheTxhbnk+IiwicmVzdWx0OiBFbGVjdHJvblJlc3VsdCB8IG51bGwiLCJlcnJvckluZm86IEVycm9ySW5mbyIsInVybDogc3RyaW5nIiwiYXBwUGF0aDogc3RyaW5nIiwibWFpbEFkZHJlc3M6IHN0cmluZyB8IG51bGwiLCJzaG9ydGN1dHM6IFJlYWRvbmx5QXJyYXk8TmF0aXZlU2hvcnRjdXQ+IiwiZmFjYWRlOiBJbnRlcldpbmRvd0V2ZW50RmFjYWRlIiwibWV0aG9kOiBzdHJpbmciLCJhcmc6IEFycmF5PGFueT4iLCJ1c2VySWQ6IHN0cmluZyIsImZhY2FkZTogTW9iaWxlRmFjYWRlIiwibWV0aG9kOiBzdHJpbmciLCJhcmc6IEFycmF5PGFueT4iLCJ2aXNpYmlsaXR5OiBib29sZWFuIiwibmV3U2l6ZTogbnVtYmVyIiwiY29tbW9uTmF0aXZlRmFjYWRlOiBDb21tb25OYXRpdmVGYWNhZGUiLCJkZXNrdG9wRmFjYWRlOiBEZXNrdG9wRmFjYWRlIiwiaW50ZXJXaW5kb3dFdmVudEZhY2FkZTogSW50ZXJXaW5kb3dFdmVudEZhY2FkZSIsIm1vYmlsZUZhY2FkZTogTW9iaWxlRmFjYWRlIiwiZmFjYWRlTmFtZTogc3RyaW5nIiwibWV0aG9kTmFtZTogc3RyaW5nIiwiYXJnczogQXJyYXk8YW55PiIsInRyYW5zcG9ydDogTmF0aXZlSW50ZXJmYWNlIiwidHJhbnNwb3J0OiBOYXRpdmVJbnRlcmZhY2UiLCJ0cmFuc3BvcnQ6IE5hdGl2ZUludGVyZmFjZSIsInRyYW5zcG9ydDogTmF0aXZlSW50ZXJmYWNlIiwidHJhbnNwb3J0OiBOYXRpdmVJbnRlcmZhY2UiLCJ0cmFuc3BvcnQ6IE5hdGl2ZUludGVyZmFjZSIsInRyYW5zcG9ydDogTmF0aXZlSW50ZXJmYWNlIiwidHJhbnNwb3J0OiBOYXRpdmVJbnRlcmZhY2UiLCJ0cmFuc3BvcnQ6IE5hdGl2ZUludGVyZmFjZSIsInRyYW5zcG9ydDogTmF0aXZlSW50ZXJmYWNlIiwidHJhbnNwb3J0OiBOYXRpdmVJbnRlcmZhY2UiLCJtb2JpbGVGYWNhZGU6IFdlYk1vYmlsZUZhY2FkZSIsImRlc2t0b3BGYWNhZGU6IERlc2t0b3BGYWNhZGUiLCJpbnRlcldpbmRvd0V2ZW50RmFjYWRlOiBJbnRlcldpbmRvd0V2ZW50RmFjYWRlIiwiY29tbW9uTmF0aXZlRmFjYWRlOiBDb21tb25OYXRpdmVGYWNhZGUiLCJjcnlwdG9GYWNhZGU6IENyeXB0b0ZhY2FkZSIsImNhbGVuZGFyRmFjYWRlOiBDYWxlbmRhckZhY2FkZSIsImVudGl0eUNsaWVudDogRW50aXR5Q2xpZW50IiwibG9naW5zOiBMb2dpbkNvbnRyb2xsZXIiLCJhcHA6IEFwcFR5cGUiLCJuYXRpdmU6IE5hdGl2ZUludGVyZmFjZU1haW4iXSwic291cmNlcyI6WyIuLi9zcmMvY29tbW9uL25hdGl2ZS9tYWluL0lvc05hdGl2ZVRyYW5zcG9ydC50cyIsIi4uL3NyYy9jb21tb24vbmF0aXZlL21haW4vQW5kcm9pZE5hdGl2ZVRyYW5zcG9ydC50cyIsIi4uL3NyYy9jb21tb24vbmF0aXZlL21haW4vTmF0aXZlSW50ZXJmYWNlTWFpbi50cyIsIi4uL3NyYy9jb21tb24vbmF0aXZlL21haW4vTmF0aXZlUHVzaFNlcnZpY2VBcHAudHMiLCIuLi9zcmMvY29tbW9uL25hdGl2ZS9jb21tb24vZ2VuZXJhdGVkaXBjL0NvbW1vbk5hdGl2ZUZhY2FkZVJlY2VpdmVEaXNwYXRjaGVyLnRzIiwiLi4vc3JjL2NvbW1vbi9uYXRpdmUvY29tbW9uL2dlbmVyYXRlZGlwYy9EZXNrdG9wRmFjYWRlUmVjZWl2ZURpc3BhdGNoZXIudHMiLCIuLi9zcmMvY29tbW9uL25hdGl2ZS9jb21tb24vZ2VuZXJhdGVkaXBjL0ludGVyV2luZG93RXZlbnRGYWNhZGVSZWNlaXZlRGlzcGF0Y2hlci50cyIsIi4uL3NyYy9jb21tb24vbmF0aXZlL2NvbW1vbi9nZW5lcmF0ZWRpcGMvTW9iaWxlRmFjYWRlUmVjZWl2ZURpc3BhdGNoZXIudHMiLCIuLi9zcmMvY29tbW9uL25hdGl2ZS9jb21tb24vZ2VuZXJhdGVkaXBjL1dlYkdsb2JhbERpc3BhdGNoZXIudHMiLCIuLi9zcmMvY29tbW9uL25hdGl2ZS9jb21tb24vZ2VuZXJhdGVkaXBjL0NvbW1vblN5c3RlbUZhY2FkZVNlbmREaXNwYXRjaGVyLnRzIiwiLi4vc3JjL2NvbW1vbi9uYXRpdmUvY29tbW9uL2dlbmVyYXRlZGlwYy9Nb2JpbGVTeXN0ZW1GYWNhZGVTZW5kRGlzcGF0Y2hlci50cyIsIi4uL3NyYy9jb21tb24vbmF0aXZlL2NvbW1vbi9nZW5lcmF0ZWRpcGMvVGhlbWVGYWNhZGVTZW5kRGlzcGF0Y2hlci50cyIsIi4uL3NyYy9jb21tb24vbmF0aXZlL2NvbW1vbi9nZW5lcmF0ZWRpcGMvU2VhcmNoVGV4dEluQXBwRmFjYWRlU2VuZERpc3BhdGNoZXIudHMiLCIuLi9zcmMvY29tbW9uL25hdGl2ZS9jb21tb24vZ2VuZXJhdGVkaXBjL1NldHRpbmdzRmFjYWRlU2VuZERpc3BhdGNoZXIudHMiLCIuLi9zcmMvY29tbW9uL25hdGl2ZS9jb21tb24vZ2VuZXJhdGVkaXBjL0Rlc2t0b3BTeXN0ZW1GYWNhZGVTZW5kRGlzcGF0Y2hlci50cyIsIi4uL3NyYy9jb21tb24vbmF0aXZlL2NvbW1vbi9nZW5lcmF0ZWRpcGMvTW9iaWxlQ29udGFjdHNGYWNhZGVTZW5kRGlzcGF0Y2hlci50cyIsIi4uL3NyYy9jb21tb24vbmF0aXZlL2NvbW1vbi9nZW5lcmF0ZWRpcGMvTmF0aXZlQ3JlZGVudGlhbHNGYWNhZGVTZW5kRGlzcGF0Y2hlci50cyIsIi4uL3NyYy9jb21tb24vbmF0aXZlL2NvbW1vbi9nZW5lcmF0ZWRpcGMvTW9iaWxlUGF5bWVudHNGYWNhZGVTZW5kRGlzcGF0Y2hlci50cyIsIi4uL3NyYy9jb21tb24vbmF0aXZlL2NvbW1vbi9nZW5lcmF0ZWRpcGMvRXh0ZXJuYWxDYWxlbmRhckZhY2FkZVNlbmREaXNwYXRjaGVyLnRzIiwiLi4vc3JjL2NvbW1vbi9uYXRpdmUvY29tbW9uL2dlbmVyYXRlZGlwYy9OYXRpdmVNYWlsSW1wb3J0RmFjYWRlU2VuZERpc3BhdGNoZXIudHMiLCIuLi9zcmMvY29tbW9uL25hdGl2ZS9tYWluL05hdGl2ZUludGVyZmFjZUZhY3RvcnkudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVHJhbnNwb3J0IH0gZnJvbSBcIi4uLy4uL2FwaS9jb21tb24vdGhyZWFkaW5nL1RyYW5zcG9ydC5qc1wiXG5pbXBvcnQgeyBkZWNvZGVOYXRpdmVNZXNzYWdlLCBlbmNvZGVOYXRpdmVNZXNzYWdlLCBKc01lc3NhZ2VIYW5kbGVyLCBOYXRpdmVNZXNzYWdlIH0gZnJvbSBcIi4uL2NvbW1vbi9OYXRpdmVMaW5lUHJvdG9jb2wuanNcIlxuaW1wb3J0IHsgQmFzZTY0LCBiYXNlNjRUb1VpbnQ4QXJyYXksIHV0ZjhVaW50OEFycmF5VG9TdHJpbmcgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IGFzc2VydE1haW5Pck5vZGUgfSBmcm9tIFwiLi4vLi4vYXBpL2NvbW1vbi9FbnYuanNcIlxuXG5hc3NlcnRNYWluT3JOb2RlKClcblxuLyoqXG4gKiBUcmFuc3BvcnQgZm9yIGNvbW11bmljYXRpb24gYmV0d2VlbiBpb3MgbmF0aXZlIGFuZCB3ZWJ2aWV3XG4gKiBNZXNzYWdlcyBhcmUgcGFzc2VkIGZyb20gbmF0aXZlIHZpYSBhcyBldmFsKCktdHlwZSBjYWxsIHdoaWNoIGludm9rZXMgc2VuZE1lc3NhZ2VGcm9tQXBwLCBzZWUgV2ViVmlld0JyaWRnZS5zd2lmdFxuICogd2luZG93LnR1dGFvLm5hdGl2ZUFwcCBpcyBpbmplY3RlZCBkdXJpbmcgd2VidmlldyBpbml0aWFsaXphdGlvblxuICovXG5cbmV4cG9ydCBjbGFzcyBJb3NOYXRpdmVUcmFuc3BvcnQgaW1wbGVtZW50cyBUcmFuc3BvcnQ8TmF0aXZlUmVxdWVzdFR5cGUsIEpzUmVxdWVzdFR5cGU+IHtcblx0cHJpdmF0ZSBtZXNzYWdlSGFuZGxlcjogSnNNZXNzYWdlSGFuZGxlciB8IG51bGwgPSBudWxsXG5cblx0Y29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSB3aW5kb3c6IFdpbmRvdykge1xuXHRcdHRoaXMud2luZG93LnR1dGFvLm5hdGl2ZUFwcCA9IHRoaXNcblx0fVxuXG5cdHBvc3RNZXNzYWdlKG1lc3NhZ2U6IE5hdGl2ZU1lc3NhZ2UpIHtcblx0XHRjb25zdCBlbmNvZGVkID0gZW5jb2RlTmF0aXZlTWVzc2FnZShtZXNzYWdlKVxuXHRcdC8vIEB0cy1pZ25vcmUgdGhpcyBpcyBzZXQgaW4gdGhlIFdlYlZpZXdCcmlnZGUgb24gSW9zXG5cdFx0dGhpcy53aW5kb3cud2Via2l0Lm1lc3NhZ2VIYW5kbGVycy5uYXRpdmVBcHAucG9zdE1lc3NhZ2UoZW5jb2RlZClcblx0fVxuXG5cdHNldE1lc3NhZ2VIYW5kbGVyKGhhbmRsZXI6IEpzTWVzc2FnZUhhbmRsZXIpOiB2b2lkIHtcblx0XHR0aGlzLm1lc3NhZ2VIYW5kbGVyID0gaGFuZGxlclxuXHR9XG5cblx0cmVjZWl2ZU1lc3NhZ2VGcm9tQXBwKG1zZzY0OiBCYXNlNjQpOiB2b2lkIHtcblx0XHRjb25zdCBoYW5kbGVyID0gdGhpcy5tZXNzYWdlSGFuZGxlclxuXG5cdFx0aWYgKGhhbmRsZXIpIHtcblx0XHRcdGNvbnN0IG1zZyA9IHV0ZjhVaW50OEFycmF5VG9TdHJpbmcoYmFzZTY0VG9VaW50OEFycmF5KG1zZzY0KSlcblx0XHRcdGNvbnN0IHBhcnNlZCA9IGRlY29kZU5hdGl2ZU1lc3NhZ2UobXNnKVxuXHRcdFx0aGFuZGxlcihwYXJzZWQpXG5cdFx0fSBlbHNlIHtcblx0XHRcdGNvbnNvbGUud2FybihcIlJlcXVlc3QgZnJvbSBuYXRpdmUgYnV0IG5vIGhhbmRsZXIgaXMgc2V0IVwiKVxuXHRcdH1cblx0fVxufVxuIiwiaW1wb3J0IHsgVHJhbnNwb3J0IH0gZnJvbSBcIi4uLy4uL2FwaS9jb21tb24vdGhyZWFkaW5nL1RyYW5zcG9ydC5qc1wiXG5pbXBvcnQgeyBkZWNvZGVOYXRpdmVNZXNzYWdlLCBlbmNvZGVOYXRpdmVNZXNzYWdlLCBKc01lc3NhZ2VIYW5kbGVyLCBOYXRpdmVNZXNzYWdlIH0gZnJvbSBcIi4uL2NvbW1vbi9OYXRpdmVMaW5lUHJvdG9jb2wuanNcIlxuaW1wb3J0IHsgZGVmZXIsIERlZmVycmVkT2JqZWN0IH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBhc3NlcnRNYWluT3JOb2RlIH0gZnJvbSBcIi4uLy4uL2FwaS9jb21tb24vRW52LmpzXCJcblxuYXNzZXJ0TWFpbk9yTm9kZSgpXG5cbi8qKlxuICogVHJhbnNwb3J0IGZvciBjb21tdW5pY2F0aW9uIGJldHdlZW4gYW5kcm9pZCBuYXRpdmUgYW5kIHdlYnZpZXcsIHVzaW5nIFdlYk1lc3NhZ2VQb3J0cyBmb3IgdHdvLXdheSBjb21tdW5pY2F0aW9uLlxuICogVGhlIGludGVyZmFjZSBgbmF0aXZlQXBwLnN0YXJ0V2ViTWVzc2FnZUNoYW5uZWxgIGlzIGRlZmluZWQgaW4gTmF0aXZlLmphdmEgaW4gb3JkZXIgdG8gaW5pdGlhdGUgdGhlIHNldHVwIG9mIHRoZSBwb3J0IGNoYW5uZWxcbiAqL1xuXG5leHBvcnQgY2xhc3MgQW5kcm9pZE5hdGl2ZVRyYW5zcG9ydCBpbXBsZW1lbnRzIFRyYW5zcG9ydDxOYXRpdmVSZXF1ZXN0VHlwZSwgSnNSZXF1ZXN0VHlwZT4ge1xuXHRwcml2YXRlIG1lc3NhZ2VIYW5kbGVyOiBKc01lc3NhZ2VIYW5kbGVyIHwgbnVsbCA9IG51bGxcblx0cHJpdmF0ZSBkZWZlcnJlZFBvcnQ6IERlZmVycmVkT2JqZWN0PE1lc3NhZ2VQb3J0PiA9IGRlZmVyKClcblxuXHRjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IHdpbmRvdzogV2luZG93KSB7fVxuXG5cdC8qKlxuXHQgKiBDcmVhdGVzIGEgZ2xvYmFsIGB3aW5kb3cub25tZXNzYWdlYCBoYW5kbGVyLCBhbmQgdGhlbiB0ZWxscyBuYXRpdmUgdG8gY3JlYXRlIHRoZSBtZXNzYWdlcG9ydCBjaGFubmVsXG5cdCAqL1xuXHRzdGFydCgpIHtcblx0XHQvLyBXZSB3aWxsIHJlY2VpdmUgYSBtZXNzYWdlIGZyb20gbmF0aXZlIGFmdGVyIHRoZSBjYWxsIHRvXG5cdFx0Ly8gd2luZG93Lm5hdGl2ZUFwcC5zdGFydFdlYk1lc3NhZ2VDaGFubmVsXG5cdFx0dGhpcy53aW5kb3cub25tZXNzYWdlID0gKG1lc3NhZ2U6IE1lc3NhZ2VFdmVudCkgPT4ge1xuXHRcdFx0Ly8gQWxsIGZ1cnRoZXIgbWVzc2FnZXMgdG8gYW5kIGZyb20gbmF0aXZlIHdpbGwgYmUgdmlhIHRoaXMgcG9ydFxuXHRcdFx0Y29uc3QgcG9ydCA9IG1lc3NhZ2UucG9ydHNbMF1cblxuXHRcdFx0cG9ydC5vbm1lc3NhZ2UgPSAobWVzc2FnZUV2ZW50OiBNZXNzYWdlRXZlbnQpID0+IHtcblx0XHRcdFx0Y29uc3QgaGFuZGxlciA9IHRoaXMubWVzc2FnZUhhbmRsZXJcblxuXHRcdFx0XHRpZiAoaGFuZGxlcikge1xuXHRcdFx0XHRcdC8vIFdlIGNhbiBiZSBzdXJlIHdlIGhhdmUgYSBzdHJpbmcgaGVyZSwgYmVjYXVzZVxuXHRcdFx0XHRcdC8vIEFuZHJvaWQgb25seSBhbGxvd3Mgc2VuZGluZyBzdHJpbmdzIGFjcm9zcyBNZXNzYWdlUG9ydHNcblx0XHRcdFx0XHRjb25zdCByZXNwb25zZSA9IGRlY29kZU5hdGl2ZU1lc3NhZ2UobWVzc2FnZUV2ZW50LmRhdGEpXG5cdFx0XHRcdFx0aGFuZGxlcihyZXNwb25zZSlcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLmRlZmVycmVkUG9ydC5yZXNvbHZlKHBvcnQpXG5cdFx0fVxuXG5cdFx0Ly8gd2luZG93Lm5hdGl2ZUFwcCBpcyBkZWZpbmVkIGluIE5hdGl2ZS5qYXZhIHVzaW5nIFdlYlZpZXcuYWRkSmF2YVNjcmlwdEludGVyZmFjZVxuXHRcdC8vIFRoZSBuYXRpdmUgc2lkZSBuZWVkcyB0byBpbml0aWFsaXplIHRoZSBXZWJNZXNzYWdlUG9ydHNcblx0XHQvLyBXZSBoYXZlIHRvIHRlbGwgaXQgd2hlbiB3ZSBhcmUgcmVhZHksIG90aGVyd2lzZSBpdCB3aWxsIGhhcHBlbiB0b28gZWFybHkgYW5kIHdlIHdvbid0IHJlY2VpdmUgdGhlIG1lc3NhZ2UgZXZlbnRcblx0XHR0aGlzLndpbmRvdy5uYXRpdmVBcHAuc3RhcnRXZWJNZXNzYWdlQ2hhbm5lbCgpXG5cdH1cblxuXHRwb3N0TWVzc2FnZShtZXNzYWdlOiBOYXRpdmVNZXNzYWdlKTogdm9pZCB7XG5cdFx0Y29uc3QgZW5jb2RlZCA9IGVuY29kZU5hdGl2ZU1lc3NhZ2UobWVzc2FnZSlcblx0XHR0aGlzLmRlZmVycmVkUG9ydC5wcm9taXNlLnRoZW4oKHBvcnQpID0+IHBvcnQucG9zdE1lc3NhZ2UoZW5jb2RlZCkpXG5cdH1cblxuXHRzZXRNZXNzYWdlSGFuZGxlcihoYW5kbGVyOiBKc01lc3NhZ2VIYW5kbGVyKTogdm9pZCB7XG5cdFx0dGhpcy5tZXNzYWdlSGFuZGxlciA9IGhhbmRsZXJcblx0fVxufVxuIiwiaW1wb3J0IHsgYXNzZXJ0TWFpbk9yTm9kZSwgaXNBbmRyb2lkQXBwLCBpc0VsZWN0cm9uQ2xpZW50LCBpc0lPU0FwcCB9IGZyb20gXCIuLi8uLi9hcGkvY29tbW9uL0VudlwiXG5pbXBvcnQgdHlwZSB7IFRyYW5zcG9ydCB9IGZyb20gXCIuLi8uLi9hcGkvY29tbW9uL3RocmVhZGluZy9UcmFuc3BvcnQuanNcIlxuaW1wb3J0IHsgTWVzc2FnZURpc3BhdGNoZXIsIFJlcXVlc3QgfSBmcm9tIFwiLi4vLi4vYXBpL2NvbW1vbi90aHJlYWRpbmcvTWVzc2FnZURpc3BhdGNoZXIuanNcIlxuaW1wb3J0IHR5cGUgeyBEZWZlcnJlZE9iamVjdCB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgZGVmZXIgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB0eXBlIHsgTmF0aXZlSW50ZXJmYWNlIH0gZnJvbSBcIi4uL2NvbW1vbi9OYXRpdmVJbnRlcmZhY2VcIlxuaW1wb3J0IHsgUHJvZ3JhbW1pbmdFcnJvciB9IGZyb20gXCIuLi8uLi9hcGkvY29tbW9uL2Vycm9yL1Byb2dyYW1taW5nRXJyb3JcIlxuaW1wb3J0IHsgSW9zTmF0aXZlVHJhbnNwb3J0IH0gZnJvbSBcIi4vSW9zTmF0aXZlVHJhbnNwb3J0LmpzXCJcbmltcG9ydCB7IEFuZHJvaWROYXRpdmVUcmFuc3BvcnQgfSBmcm9tIFwiLi9BbmRyb2lkTmF0aXZlVHJhbnNwb3J0LmpzXCJcbmltcG9ydCB7IERlc2t0b3BOYXRpdmVUcmFuc3BvcnQgfSBmcm9tIFwiLi9EZXNrdG9wTmF0aXZlVHJhbnNwb3J0LmpzXCJcbmltcG9ydCB7IFdlYkdsb2JhbERpc3BhdGNoZXIgfSBmcm9tIFwiLi4vY29tbW9uL2dlbmVyYXRlZGlwYy9XZWJHbG9iYWxEaXNwYXRjaGVyLmpzXCJcblxuYXNzZXJ0TWFpbk9yTm9kZSgpXG5cbi8qKiB0aGUgc2lkZSBvZiB0aGUgbm9kZS1tYWluIGludGVyZmFjZSB0aGF0J3MgcnVubmluZyBpbiB0aGUgYnJvd3NlciB3aW5kb3dzIHJlbmRlcmVyL21haW4gdGhyZWFkLiAqL1xuZXhwb3J0IGNsYXNzIE5hdGl2ZUludGVyZmFjZU1haW4gaW1wbGVtZW50cyBOYXRpdmVJbnRlcmZhY2Uge1xuXHRwcml2YXRlIHJlYWRvbmx5IF9kaXNwYXRjaERlZmVycmVkOiBEZWZlcnJlZE9iamVjdDxNZXNzYWdlRGlzcGF0Y2hlcjxOYXRpdmVSZXF1ZXN0VHlwZSwgSnNSZXF1ZXN0VHlwZT4+ID0gZGVmZXIoKVxuXHRwcml2YXRlIF9hcHBVcGRhdGVMaXN0ZW5lcjogKCgpID0+IHZvaWQpIHwgbnVsbCA9IG51bGxcblxuXHRjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IGdsb2JhbERpc3BhdGNoZXI6IFdlYkdsb2JhbERpc3BhdGNoZXIpIHt9XG5cblx0YXN5bmMgaW5pdCgpIHtcblx0XHRsZXQgdHJhbnNwb3J0OiBUcmFuc3BvcnQ8TmF0aXZlUmVxdWVzdFR5cGUsIEpzUmVxdWVzdFR5cGU+XG5cblx0XHRpZiAoaXNBbmRyb2lkQXBwKCkpIHtcblx0XHRcdGNvbnN0IGFuZHJvaWRUcmFuc3BvcnQgPSBuZXcgQW5kcm9pZE5hdGl2ZVRyYW5zcG9ydCh3aW5kb3cpXG5cdFx0XHRhbmRyb2lkVHJhbnNwb3J0LnN0YXJ0KClcblx0XHRcdHRyYW5zcG9ydCA9IGFuZHJvaWRUcmFuc3BvcnRcblx0XHR9IGVsc2UgaWYgKGlzSU9TQXBwKCkpIHtcblx0XHRcdHRyYW5zcG9ydCA9IG5ldyBJb3NOYXRpdmVUcmFuc3BvcnQod2luZG93KVxuXHRcdH0gZWxzZSBpZiAoaXNFbGVjdHJvbkNsaWVudCgpKSB7XG5cdFx0XHR0cmFuc3BvcnQgPSBuZXcgRGVza3RvcE5hdGl2ZVRyYW5zcG9ydCh3aW5kb3cubmF0aXZlQXBwKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aHJvdyBuZXcgUHJvZ3JhbW1pbmdFcnJvcihcIlRyaWVkIHRvIGNyZWF0ZSBhIG5hdGl2ZSBpbnRlcmZhY2UgaW4gdGhlIGJyb3dzZXJcIilcblx0XHR9XG5cblx0XHQvLyBFbnN1cmUgdGhhdCB3ZSBoYXZlIG1lc3NhZ2VkIG5hdGl2ZSB3aXRoIFwiaW5pdFwiIGJlZm9yZSB3ZSBhbGxvdyBhbnlvbmUgZWxzZSB0byBtYWtlIG5hdGl2ZSByZXF1ZXN0c1xuXHRcdGNvbnN0IHF1ZXVlID0gbmV3IE1lc3NhZ2VEaXNwYXRjaGVyPE5hdGl2ZVJlcXVlc3RUeXBlLCBKc1JlcXVlc3RUeXBlPihcblx0XHRcdHRyYW5zcG9ydCxcblx0XHRcdHtcblx0XHRcdFx0aXBjOiAocmVxdWVzdDogUmVxdWVzdDxKc1JlcXVlc3RUeXBlPikgPT4gdGhpcy5nbG9iYWxEaXNwYXRjaGVyLmRpc3BhdGNoKHJlcXVlc3QuYXJnc1swXSwgcmVxdWVzdC5hcmdzWzFdLCByZXF1ZXN0LmFyZ3Muc2xpY2UoMikpLFxuXHRcdFx0fSxcblx0XHRcdFwibWFpbi13b3JrZXJcIixcblx0XHQpXG5cdFx0YXdhaXQgcXVldWUucG9zdFJlcXVlc3QobmV3IFJlcXVlc3QoXCJpcGNcIiwgW1wiQ29tbW9uU3lzdGVtRmFjYWRlXCIsIFwiaW5pdGlhbGl6ZVJlbW90ZUJyaWRnZVwiXSkpXG5cdFx0dGhpcy5fZGlzcGF0Y2hEZWZlcnJlZC5yZXNvbHZlKHF1ZXVlKVxuXHR9XG5cblx0Ly8gZm9yIHRlc3Rpbmdcblx0YXN5bmMgaW5pdFdpdGhRdWV1ZShxdWV1ZTogTWVzc2FnZURpc3BhdGNoZXI8TmF0aXZlUmVxdWVzdFR5cGUsIEpzUmVxdWVzdFR5cGU+KSB7XG5cdFx0dGhpcy5fZGlzcGF0Y2hEZWZlcnJlZC5yZXNvbHZlKHF1ZXVlKVxuXHR9XG5cblx0LyoqXG5cdCAqIFNlbmQgYSByZXF1ZXN0IHRvIHRoZSBuYXRpdmUgc2lkZS5cblx0ICovXG5cdGFzeW5jIGludm9rZU5hdGl2ZShyZXF1ZXN0VHlwZTogTmF0aXZlUmVxdWVzdFR5cGUsIGFyZ3M6IFJlYWRvbmx5QXJyYXk8dW5rbm93bj4pOiBQcm9taXNlPGFueT4ge1xuXHRcdGNvbnN0IGRpc3BhdGNoID0gYXdhaXQgdGhpcy5fZGlzcGF0Y2hEZWZlcnJlZC5wcm9taXNlXG5cdFx0cmV0dXJuIGRpc3BhdGNoLnBvc3RSZXF1ZXN0KG5ldyBSZXF1ZXN0PE5hdGl2ZVJlcXVlc3RUeXBlPihyZXF1ZXN0VHlwZSwgYXJncykpXG5cdH1cblxuXHQvKipcblx0ICogU2F2ZXMgYSBsaXN0ZW5lciBtZXRob2QgdG8gYmUgY2FsbGVkIHdoZW4gYW4gYXBwIHVwZGF0ZSBoYXMgYmVlbiBkb3dubG9hZGVkIG9uIHRoZSBuYXRpdmUgc2lkZS5cblx0ICovXG5cdHNldEFwcFVwZGF0ZUxpc3RlbmVyKGxpc3RlbmVyOiAoKSA9PiB2b2lkKTogdm9pZCB7XG5cdFx0dGhpcy5fYXBwVXBkYXRlTGlzdGVuZXIgPSBsaXN0ZW5lclxuXHR9XG5cblx0LyoqXG5cdCAqIENhbGwgdGhlIHVwZGF0ZSBsaXN0ZW5lciBpZiBzZXQuXG5cdCAqL1xuXHRoYW5kbGVVcGRhdGVEb3dubG9hZCgpOiB2b2lkIHtcblx0XHR0aGlzLl9hcHBVcGRhdGVMaXN0ZW5lcj8uKClcblx0fVxufVxuIiwiaW1wb3J0IHR5cGUgeyBQdXNoSWRlbnRpZmllciB9IGZyb20gXCIuLi8uLi9hcGkvZW50aXRpZXMvc3lzL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IGNyZWF0ZVB1c2hJZGVudGlmaWVyLCBQdXNoSWRlbnRpZmllclR5cGVSZWYgfSBmcm9tIFwiLi4vLi4vYXBpL2VudGl0aWVzL3N5cy9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgeyBhc3NlcnROb3ROdWxsIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBQdXNoU2VydmljZVR5cGUgfSBmcm9tIFwiLi4vLi4vYXBpL2NvbW1vbi9UdXRhbm90YUNvbnN0YW50c1wiXG5pbXBvcnQgeyBsYW5nIH0gZnJvbSBcIi4uLy4uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWxcIlxuaW1wb3J0IHsgaXNBbmRyb2lkQXBwLCBpc0FwcCwgaXNEZXNrdG9wLCBpc0lPU0FwcCB9IGZyb20gXCIuLi8uLi9hcGkvY29tbW9uL0VudlwiXG5pbXBvcnQgeyBMb2dpbkNvbnRyb2xsZXIgfSBmcm9tIFwiLi4vLi4vYXBpL21haW4vTG9naW5Db250cm9sbGVyXCJcbmltcG9ydCB7IGNsaWVudCB9IGZyb20gXCIuLi8uLi9taXNjL0NsaWVudERldGVjdG9yXCJcbmltcG9ydCB7IERldmljZUNvbmZpZyB9IGZyb20gXCIuLi8uLi9taXNjL0RldmljZUNvbmZpZ1wiXG5pbXBvcnQgeyBnZXRFbGVtZW50SWQgfSBmcm9tIFwiLi4vLi4vYXBpL2NvbW1vbi91dGlscy9FbnRpdHlVdGlsc1wiXG5pbXBvcnQgeyBsb2NhdG9yIH0gZnJvbSBcIi4uLy4uL2FwaS9tYWluL0NvbW1vbkxvY2F0b3JcIlxuaW1wb3J0IHsgRGV2aWNlU3RvcmFnZVVuYXZhaWxhYmxlRXJyb3IgfSBmcm9tIFwiLi4vLi4vYXBpL2NvbW1vbi9lcnJvci9EZXZpY2VTdG9yYWdlVW5hdmFpbGFibGVFcnJvclwiXG5pbXBvcnQgeyBOYXRpdmVQdXNoRmFjYWRlIH0gZnJvbSBcIi4uL2NvbW1vbi9nZW5lcmF0ZWRpcGMvTmF0aXZlUHVzaEZhY2FkZS5qc1wiXG5pbXBvcnQgeyBDcnlwdG9GYWNhZGUgfSBmcm9tIFwiLi4vLi4vYXBpL3dvcmtlci9jcnlwdG8vQ3J5cHRvRmFjYWRlLmpzXCJcbmltcG9ydCB7IEVudGl0eUNsaWVudCB9IGZyb20gXCIuLi8uLi9hcGkvY29tbW9uL0VudGl0eUNsaWVudC5qc1wiXG5pbXBvcnQgeyBDYWxlbmRhckZhY2FkZSB9IGZyb20gXCIuLi8uLi9hcGkvd29ya2VyL2ZhY2FkZXMvbGF6eS9DYWxlbmRhckZhY2FkZS5qc1wiXG5pbXBvcnQgbW9kZWxJbmZvIGZyb20gXCIuLi8uLi9hcGkvZW50aXRpZXMvc3lzL01vZGVsSW5mby5qc1wiXG5pbXBvcnQgeyBFeHRlbmRlZE5vdGlmaWNhdGlvbk1vZGUgfSBmcm9tIFwiLi4vY29tbW9uL2dlbmVyYXRlZGlwYy9FeHRlbmRlZE5vdGlmaWNhdGlvbk1vZGUuanNcIlxuaW1wb3J0IHsgQXBwVHlwZSB9IGZyb20gXCIuLi8uLi9taXNjL0NsaWVudENvbnN0YW50cy5qc1wiXG5cbi8vIGtlZXAgaW4gc3luYyB3aXRoIFNZU19NT0RFTF9WRVJTSU9OIGluIGFwcC1hbmRyb2lkL2FwcC9idWlsZC5ncmFkbGVcbi8vIGtlZXAgaW4gc3luYyB3aXRoIFNZU19NT0RFTF9WRVJTSU9OIGluIGFwcC1hbmRyb2lkL2NhbGVuZGFyL2J1aWxkLmdyYWRsZS5rdHNcbi8vIGtlZXAgaW4gc3luYyB3aXRoIGFwcC1pb3MvVHV0YW5vdGFTaGFyZWRGcmFtZXdvcmsvVXRpbHMvVXRpbHMuc3dpZnRcbmNvbnN0IE1PQklMRV9TWVNfTU9ERUxfVkVSU0lPTiA9IDk5XG5cbmZ1bmN0aW9uIGVmZmVjdGl2ZU1vZGVsVmVyc2lvbigpOiBudW1iZXIge1xuXHQvLyBvbiBkZXNrdG9wIHdlIHVzZSBnZW5lcmF0ZWQgY2xhc3Nlc1xuXHQvLyBvbiBtb2JpbGUgd2UgdXNlIGhhbmQtd3JpdHRlbiBjbGFzc2VzXG5cdHJldHVybiBpc0Rlc2t0b3AoKSA/IG1vZGVsSW5mby52ZXJzaW9uIDogTU9CSUxFX1NZU19NT0RFTF9WRVJTSU9OXG59XG5cbmludGVyZmFjZSBDdXJyZW50UHVzaElkZW50aWZpZXIge1xuXHRpZGVudGlmaWVyOiBzdHJpbmdcblx0ZGlzYWJsZWQ6IGJvb2xlYW5cbn1cblxuZXhwb3J0IGNsYXNzIE5hdGl2ZVB1c2hTZXJ2aWNlQXBwIHtcblx0cHJpdmF0ZSBfY3VycmVudElkZW50aWZpZXI6IEN1cnJlbnRQdXNoSWRlbnRpZmllciB8IG51bGwgPSBudWxsXG5cblx0Y29uc3RydWN0b3IoXG5cdFx0cHJpdmF0ZSByZWFkb25seSBuYXRpdmVQdXNoRmFjYWRlOiBOYXRpdmVQdXNoRmFjYWRlLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgbG9naW5zOiBMb2dpbkNvbnRyb2xsZXIsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBjcnlwdG9GYWNhZGU6IENyeXB0b0ZhY2FkZSxcblx0XHRwcml2YXRlIHJlYWRvbmx5IGVudGl0eUNsaWVudDogRW50aXR5Q2xpZW50LFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgZGV2aWNlQ29uZmlnOiBEZXZpY2VDb25maWcsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBjYWxlbmRhckZhY2FkZTogQ2FsZW5kYXJGYWNhZGUsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBhcHA6IEFwcFR5cGUsXG5cdCkge31cblxuXHRhc3luYyByZWdpc3RlcigpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRjb25zb2xlLmxvZyhcIlJlZ2lzdGVyaW5nIGZvciBwdXNoIG5vdGlmaWNhdGlvbnMgZm9yIGFwcFwiLCB0aGlzLmFwcClcblx0XHRpZiAoaXNBbmRyb2lkQXBwKCkgfHwgaXNEZXNrdG9wKCkpIHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGNvbnN0IGlkZW50aWZpZXIgPSAoYXdhaXQgdGhpcy5sb2FkUHVzaElkZW50aWZpZXJGcm9tTmF0aXZlKCkpID8/IChhd2FpdCBsb2NhdG9yLndvcmtlckZhY2FkZS5nZW5lcmF0ZVNzZVB1c2hJZGVudGlmZXIoKSlcblx0XHRcdFx0Y29uc3QgcHVzaElkZW50aWZpZXIgPSAoYXdhaXQgdGhpcy5sb2FkUHVzaElkZW50aWZpZXIoaWRlbnRpZmllcikpID8/IChhd2FpdCB0aGlzLmNyZWF0ZVB1c2hJZGVudGlmaWVySW5zdGFuY2UoaWRlbnRpZmllciwgUHVzaFNlcnZpY2VUeXBlLlNTRSkpXG5cdFx0XHRcdHRoaXMuX2N1cnJlbnRJZGVudGlmaWVyID0geyBpZGVudGlmaWVyLCBkaXNhYmxlZDogcHVzaElkZW50aWZpZXIuZGlzYWJsZWQgfVxuXG5cdFx0XHRcdGF3YWl0IHRoaXMuc3RvcmVQdXNoSWRlbnRpZmllckxvY2FsbHkocHVzaElkZW50aWZpZXIpIC8vIEFsc28gc2V0cyB0aGUgZXh0ZW5kZWQgbm90aWZpY2F0aW9uIG1vZGUgdG8gU0VOREVSX0FORF9TVUJKRUNUIGlmIHRoZSB1c2VyIGlzIG5ld1xuXG5cdFx0XHRcdGNvbnN0IHVzZXJJZCA9IHRoaXMubG9naW5zLmdldFVzZXJDb250cm9sbGVyKCkudXNlcklkXG5cdFx0XHRcdGlmICghKGF3YWl0IGxvY2F0b3IucHVzaFNlcnZpY2UuYWxsb3dSZWNlaXZlQ2FsZW5kYXJOb3RpZmljYXRpb25zKCkpKSB7XG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5uYXRpdmVQdXNoRmFjYWRlLmludmFsaWRhdGVBbGFybXNGb3JVc2VyKHVzZXJJZClcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRhd2FpdCB0aGlzLnNjaGVkdWxlQWxhcm1zSWZOZWVkZWQocHVzaElkZW50aWZpZXIpXG5cdFx0XHRcdH1cblxuXHRcdFx0XHRhd2FpdCB0aGlzLmluaXRQdXNoTm90aWZpY2F0aW9ucygpXG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdGlmIChlIGluc3RhbmNlb2YgRGV2aWNlU3RvcmFnZVVuYXZhaWxhYmxlRXJyb3IpIHtcblx0XHRcdFx0XHRjb25zb2xlLndhcm4oXCJEZXZpY2Ugc3RvcmFnZSBpcyB1bmF2YWlsYWJsZSwgY2Fubm90IHJlZ2lzdGVyIGZvciBwdXNoIG5vdGlmaWNhdGlvbnNcIiwgZSlcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0aHJvdyBlXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9IGVsc2UgaWYgKGlzSU9TQXBwKCkpIHtcblx0XHRcdGNvbnN0IGlkZW50aWZpZXIgPSBhd2FpdCB0aGlzLmxvYWRQdXNoSWRlbnRpZmllckZyb21OYXRpdmUoKVxuXG5cdFx0XHRpZiAoaWRlbnRpZmllcikge1xuXHRcdFx0XHRjb25zdCBwdXNoSWRlbnRpZmllciA9IChhd2FpdCB0aGlzLmxvYWRQdXNoSWRlbnRpZmllcihpZGVudGlmaWVyKSkgPz8gKGF3YWl0IHRoaXMuY3JlYXRlUHVzaElkZW50aWZpZXJJbnN0YW5jZShpZGVudGlmaWVyLCBQdXNoU2VydmljZVR5cGUuSU9TKSlcblxuXHRcdFx0XHR0aGlzLl9jdXJyZW50SWRlbnRpZmllciA9IHsgaWRlbnRpZmllciwgZGlzYWJsZWQ6IHB1c2hJZGVudGlmaWVyLmRpc2FibGVkIH1cblxuXHRcdFx0XHRpZiAocHVzaElkZW50aWZpZXIubGFuZ3VhZ2UgIT09IGxhbmcuY29kZSkge1xuXHRcdFx0XHRcdHB1c2hJZGVudGlmaWVyLmxhbmd1YWdlID0gbGFuZy5jb2RlXG5cdFx0XHRcdFx0bG9jYXRvci5lbnRpdHlDbGllbnQudXBkYXRlKHB1c2hJZGVudGlmaWVyKVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0YXdhaXQgdGhpcy5zdG9yZVB1c2hJZGVudGlmaWVyTG9jYWxseShwdXNoSWRlbnRpZmllcilcblx0XHRcdFx0Y29uc3QgdXNlcklkID0gdGhpcy5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS51c2VySWRcblx0XHRcdFx0aWYgKCEoYXdhaXQgbG9jYXRvci5wdXNoU2VydmljZS5hbGxvd1JlY2VpdmVDYWxlbmRhck5vdGlmaWNhdGlvbnMoKSkpIHtcblx0XHRcdFx0XHRhd2FpdCB0aGlzLm5hdGl2ZVB1c2hGYWNhZGUuaW52YWxpZGF0ZUFsYXJtc0ZvclVzZXIodXNlcklkKVxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMuc2NoZWR1bGVBbGFybXNJZk5lZWRlZChwdXNoSWRlbnRpZmllcilcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Y29uc29sZS5sb2coXCJQdXNoIG5vdGlmaWNhdGlvbnMgd2VyZSByZWplY3RlZCBieSB1c2VyXCIpXG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0YXN5bmMgcmVSZWdpc3RlcigpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRjb25zb2xlLmxvZyhcInJlLXJlZ2lzdGVyaW5nIGZvciBwdXNoIG5vdGlmaWNhdGlvbnMsIHNldHRpbmcgbm8gYWxhcm1zIGFzIHNjaGVkdWxlZFwiKVxuXHRcdHRoaXMuZGV2aWNlQ29uZmlnLnNldE5vQWxhcm1zU2NoZWR1bGVkKClcblxuXHRcdGlmICh0aGlzLmxvZ2lucy5pc1VzZXJMb2dnZWRJbigpKSB7XG5cdFx0XHRhd2FpdCB0aGlzLmxvZ2lucy53YWl0Rm9yRnVsbExvZ2luKClcblx0XHRcdHJldHVybiB0aGlzLnJlZ2lzdGVyKClcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIFByb21pc2UucmVzb2x2ZSgpXG5cdFx0fVxuXHR9XG5cblx0YXN5bmMgaW52YWxpZGF0ZUFsYXJtc0ZvclVzZXIodXNlcklkOiBJZCkge1xuXHRcdHJldHVybiB0aGlzLm5hdGl2ZVB1c2hGYWNhZGUuaW52YWxpZGF0ZUFsYXJtc0ZvclVzZXIodXNlcklkKVxuXHR9XG5cblx0cmVtb3ZlVXNlckZyb21Ob3RpZmljYXRpb25zKHVzZXJJZDogSWQpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRyZXR1cm4gdGhpcy5uYXRpdmVQdXNoRmFjYWRlLnJlbW92ZVVzZXIodXNlcklkKVxuXHR9XG5cblx0bG9hZFB1c2hJZGVudGlmaWVyRnJvbU5hdGl2ZSgpOiBQcm9taXNlPHN0cmluZyB8IG51bGw+IHtcblx0XHRyZXR1cm4gdGhpcy5uYXRpdmVQdXNoRmFjYWRlLmdldFB1c2hJZGVudGlmaWVyKClcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgc3RvcmVQdXNoSWRlbnRpZmllckxvY2FsbHkocHVzaElkZW50aWZpZXI6IFB1c2hJZGVudGlmaWVyKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Y29uc3QgdXNlcklkID0gdGhpcy5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS51c2VyLl9pZFxuXG5cdFx0Y29uc3Qgc2sgPSBhc3NlcnROb3ROdWxsKGF3YWl0IHRoaXMuY3J5cHRvRmFjYWRlLnJlc29sdmVTZXNzaW9uS2V5Rm9ySW5zdGFuY2VCaW5hcnkocHVzaElkZW50aWZpZXIpKVxuXHRcdGNvbnN0IG9yaWdpbiA9IGFzc2VydE5vdE51bGwoZW52LnN0YXRpY1VybClcblx0XHRhd2FpdCB0aGlzLm5hdGl2ZVB1c2hGYWNhZGUuc3RvcmVQdXNoSWRlbnRpZmllckxvY2FsbHkocHVzaElkZW50aWZpZXIuaWRlbnRpZmllciwgdXNlcklkLCBvcmlnaW4sIGdldEVsZW1lbnRJZChwdXNoSWRlbnRpZmllciksIHNrKVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBsb2FkUHVzaElkZW50aWZpZXIoaWRlbnRpZmllcjogc3RyaW5nKTogUHJvbWlzZTxQdXNoSWRlbnRpZmllciB8IG51bGw+IHtcblx0XHRjb25zdCBsaXN0ID0gYXNzZXJ0Tm90TnVsbCh0aGlzLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLnVzZXIucHVzaElkZW50aWZpZXJMaXN0KVxuXHRcdGNvbnN0IGlkZW50aWZpZXJzID0gYXdhaXQgdGhpcy5lbnRpdHlDbGllbnQubG9hZEFsbChQdXNoSWRlbnRpZmllclR5cGVSZWYsIGxpc3QubGlzdClcblx0XHRyZXR1cm4gaWRlbnRpZmllcnMuZmluZCgoaSkgPT4gaS5pZGVudGlmaWVyID09PSBpZGVudGlmaWVyKSA/PyBudWxsXG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGNyZWF0ZVB1c2hJZGVudGlmaWVySW5zdGFuY2UoaWRlbnRpZmllcjogc3RyaW5nLCBwdXNoU2VydmljZVR5cGU6IFB1c2hTZXJ2aWNlVHlwZSk6IFByb21pc2U8UHVzaElkZW50aWZpZXI+IHtcblx0XHRjb25zdCBsaXN0ID0gYXNzZXJ0Tm90TnVsbCh0aGlzLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLnVzZXIucHVzaElkZW50aWZpZXJMaXN0Py5saXN0KVxuXHRcdGNvbnN0IHB1c2hJZGVudGlmaWVyID0gY3JlYXRlUHVzaElkZW50aWZpZXIoe1xuXHRcdFx0X2FyZWE6IFwiMFwiLFxuXHRcdFx0X293bmVyOiB0aGlzLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLnVzZXJHcm91cEluZm8uZ3JvdXAsXG5cdFx0XHRfb3duZXJHcm91cDogdGhpcy5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS51c2VyR3JvdXBJbmZvLmdyb3VwLFxuXHRcdFx0ZGlzcGxheU5hbWU6IGNsaWVudC5nZXRJZGVudGlmaWVyKCksXG5cdFx0XHRwdXNoU2VydmljZVR5cGU6IHB1c2hTZXJ2aWNlVHlwZSxcblx0XHRcdGlkZW50aWZpZXIsXG5cdFx0XHRsYW5ndWFnZTogbGFuZy5jb2RlLFxuXHRcdFx0ZGlzYWJsZWQ6IGZhbHNlLFxuXHRcdFx0bGFzdFVzYWdlVGltZTogbmV3IERhdGUoKSxcblx0XHRcdGxhc3ROb3RpZmljYXRpb25EYXRlOiBudWxsLFxuXHRcdFx0YXBwOiB0aGlzLmFwcCxcblx0XHR9KVxuXHRcdGNvbnN0IGlkID0gYXdhaXQgdGhpcy5lbnRpdHlDbGllbnQuc2V0dXAobGlzdCwgcHVzaElkZW50aWZpZXIpXG5cdFx0cmV0dXJuIHRoaXMuZW50aXR5Q2xpZW50LmxvYWQoUHVzaElkZW50aWZpZXJUeXBlUmVmLCBbbGlzdCwgaWRdKVxuXHR9XG5cblx0YXN5bmMgY2xvc2VQdXNoTm90aWZpY2F0aW9uKGFkZHJlc3Nlczogc3RyaW5nW10pIHtcblx0XHRhd2FpdCB0aGlzLm5hdGl2ZVB1c2hGYWNhZGUuY2xvc2VQdXNoTm90aWZpY2F0aW9ucyhhZGRyZXNzZXMpXG5cdH1cblxuXHRnZXRMb2FkZWRQdXNoSWRlbnRpZmllcigpOiBDdXJyZW50UHVzaElkZW50aWZpZXIgfCBudWxsIHtcblx0XHRyZXR1cm4gdGhpcy5fY3VycmVudElkZW50aWZpZXJcblx0fVxuXG5cdGdldEV4dGVuZGVkTm90aWZpY2F0aW9uTW9kZSgpOiBQcm9taXNlPEV4dGVuZGVkTm90aWZpY2F0aW9uTW9kZT4ge1xuXHRcdHJldHVybiB0aGlzLm5hdGl2ZVB1c2hGYWNhZGUuZ2V0RXh0ZW5kZWROb3RpZmljYXRpb25Db25maWcodGhpcy5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS51c2VySWQpXG5cdH1cblxuXHRhc3luYyBzZXRFeHRlbmRlZE5vdGlmaWNhdGlvbk1vZGUodHlwZTogRXh0ZW5kZWROb3RpZmljYXRpb25Nb2RlKSB7XG5cdFx0YXdhaXQgdGhpcy5uYXRpdmVQdXNoRmFjYWRlLnNldEV4dGVuZGVkTm90aWZpY2F0aW9uQ29uZmlnKHRoaXMubG9naW5zLmdldFVzZXJDb250cm9sbGVyKCkudXNlcklkLCB0eXBlKVxuXHR9XG5cblx0cHJpdmF0ZSBpbml0UHVzaE5vdGlmaWNhdGlvbnMoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0cmV0dXJuIHRoaXMubmF0aXZlUHVzaEZhY2FkZS5pbml0UHVzaE5vdGlmaWNhdGlvbnMoKVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBzY2hlZHVsZUFsYXJtc0lmTmVlZGVkKHB1c2hJZGVudGlmaWVyOiBQdXNoSWRlbnRpZmllcik6IFByb21pc2U8dm9pZD4ge1xuXHRcdGlmICh0aGlzLl9jdXJyZW50SWRlbnRpZmllcj8uZGlzYWJsZWQpIHtcblx0XHRcdHJldHVyblxuXHRcdH1cblxuXHRcdGNvbnN0IHVzZXJJZCA9IHRoaXMubG9naW5zLmdldFVzZXJDb250cm9sbGVyKCkudXNlci5faWRcblxuXHRcdC8vIFRoZSBuYXRpdmUgcGFydCBtaWdodCBoYXZlIGFsYXJtcyBzdG9yZWQgZm9yIHRoZSBvbGRlciBtb2RlbCB2ZXJzaW9uIGFuZCB0aGV5IG1pZ2h0IG1pc3Mgc29tZSBuZXcgZmllbGRzLlxuXHRcdC8vIFdlIG5lZWQgdG8gcmVtb3ZlIGFsbCBvZiB0aGVtLCByZS1kb3dubG9hZCBhbmQgcmUtc2NoZWR1bGUgYWxsIG9mIHRoZW0uXG5cdFx0Y29uc3Qgc2NoZWR1bGVkQWxhcm1zTW9kZWxWZXJzaW9uID0gdGhpcy5kZXZpY2VDb25maWcuZ2V0U2NoZWR1bGVkQWxhcm1zTW9kZWxWZXJzaW9uKHVzZXJJZClcblx0XHRpZiAoc2NoZWR1bGVkQWxhcm1zTW9kZWxWZXJzaW9uID09IG51bGwgfHwgc2NoZWR1bGVkQWxhcm1zTW9kZWxWZXJzaW9uIDwgZWZmZWN0aXZlTW9kZWxWZXJzaW9uKCkpIHtcblx0XHRcdGNvbnNvbGUubG9nKGBBbGFybXMgbm90IHNjaGVkdWxlZCBmb3IgdXNlciAke3VzZXJJZH0gKHN0b3JlZCB2ICR7c2NoZWR1bGVkQWxhcm1zTW9kZWxWZXJzaW9ufSksIHNjaGVkdWxpbmdgKVxuXHRcdFx0YXdhaXQgdGhpcy5uYXRpdmVQdXNoRmFjYWRlLmludmFsaWRhdGVBbGFybXNGb3JVc2VyKHVzZXJJZClcblx0XHRcdGF3YWl0IHRoaXMuY2FsZW5kYXJGYWNhZGUuc2NoZWR1bGVBbGFybXNGb3JOZXdEZXZpY2UocHVzaElkZW50aWZpZXIpXG5cdFx0XHQvLyB0ZWxsIG5hdGl2ZSB0byBkZWxldGUgYWxsIGFsYXJtcyBmb3IgdGhlIHVzZXJcblx0XHRcdHRoaXMuZGV2aWNlQ29uZmlnLnNldFNjaGVkdWxlZEFsYXJtc01vZGVsVmVyc2lvbih1c2VySWQsIGVmZmVjdGl2ZU1vZGVsVmVyc2lvbigpKVxuXHRcdH1cblx0fVxuXG5cdGFzeW5jIHNldFJlY2VpdmVDYWxlbmRhck5vdGlmaWNhdGlvbkNvbmZpZyh2YWx1ZTogYm9vbGVhbikge1xuXHRcdGF3YWl0IHRoaXMubmF0aXZlUHVzaEZhY2FkZS5zZXRSZWNlaXZlQ2FsZW5kYXJOb3RpZmljYXRpb25Db25maWcodGhpcy5nZXRMb2FkZWRQdXNoSWRlbnRpZmllcigpIS5pZGVudGlmaWVyLCB2YWx1ZSlcblx0fVxuXG5cdGFzeW5jIGdldFJlY2VpdmVDYWxlbmRhck5vdGlmaWNhdGlvbkNvbmZpZygpIHtcblx0XHRjb25zdCBwdXNoSWRlbnRpZmllciA9IHRoaXMuZ2V0TG9hZGVkUHVzaElkZW50aWZpZXIoKVxuXHRcdGlmICghcHVzaElkZW50aWZpZXIpIHJldHVybiB0cnVlXG5cdFx0cmV0dXJuIGF3YWl0IHRoaXMubmF0aXZlUHVzaEZhY2FkZS5nZXRSZWNlaXZlQ2FsZW5kYXJOb3RpZmljYXRpb25Db25maWcocHVzaElkZW50aWZpZXIuaWRlbnRpZmllcilcblx0fVxuXG5cdGFzeW5jIGFsbG93UmVjZWl2ZUNhbGVuZGFyTm90aWZpY2F0aW9ucygpIHtcblx0XHRyZXR1cm4gIWlzQXBwKCkgfHwgKGF3YWl0IHRoaXMuZ2V0UmVjZWl2ZUNhbGVuZGFyTm90aWZpY2F0aW9uQ29uZmlnKCkpXG5cdH1cbn1cbiIsIi8qIGdlbmVyYXRlZCBmaWxlLCBkb24ndCBlZGl0LiAqL1xuXG5pbXBvcnQgeyBDb21tb25OYXRpdmVGYWNhZGUgfSBmcm9tIFwiLi9Db21tb25OYXRpdmVGYWNhZGUuanNcIlxuXG5leHBvcnQgY2xhc3MgQ29tbW9uTmF0aXZlRmFjYWRlUmVjZWl2ZURpc3BhdGNoZXIge1xuXHRjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IGZhY2FkZTogQ29tbW9uTmF0aXZlRmFjYWRlKSB7fVxuXHRhc3luYyBkaXNwYXRjaChtZXRob2Q6IHN0cmluZywgYXJnOiBBcnJheTxhbnk+KTogUHJvbWlzZTxhbnk+IHtcblx0XHRzd2l0Y2ggKG1ldGhvZCkge1xuXHRcdFx0Y2FzZSBcImNyZWF0ZU1haWxFZGl0b3JcIjoge1xuXHRcdFx0XHRjb25zdCBmaWxlc1VyaXM6IFJlYWRvbmx5QXJyYXk8c3RyaW5nPiA9IGFyZ1swXVxuXHRcdFx0XHRjb25zdCB0ZXh0OiBzdHJpbmcgPSBhcmdbMV1cblx0XHRcdFx0Y29uc3QgYWRkcmVzc2VzOiBSZWFkb25seUFycmF5PHN0cmluZz4gPSBhcmdbMl1cblx0XHRcdFx0Y29uc3Qgc3ViamVjdDogc3RyaW5nID0gYXJnWzNdXG5cdFx0XHRcdGNvbnN0IG1haWxUb1VybFN0cmluZzogc3RyaW5nID0gYXJnWzRdXG5cdFx0XHRcdHJldHVybiB0aGlzLmZhY2FkZS5jcmVhdGVNYWlsRWRpdG9yKGZpbGVzVXJpcywgdGV4dCwgYWRkcmVzc2VzLCBzdWJqZWN0LCBtYWlsVG9VcmxTdHJpbmcpXG5cdFx0XHR9XG5cdFx0XHRjYXNlIFwib3Blbk1haWxCb3hcIjoge1xuXHRcdFx0XHRjb25zdCB1c2VySWQ6IHN0cmluZyA9IGFyZ1swXVxuXHRcdFx0XHRjb25zdCBhZGRyZXNzOiBzdHJpbmcgPSBhcmdbMV1cblx0XHRcdFx0Y29uc3QgcmVxdWVzdGVkUGF0aDogc3RyaW5nIHwgbnVsbCA9IGFyZ1syXVxuXHRcdFx0XHRyZXR1cm4gdGhpcy5mYWNhZGUub3Blbk1haWxCb3godXNlcklkLCBhZGRyZXNzLCByZXF1ZXN0ZWRQYXRoKVxuXHRcdFx0fVxuXHRcdFx0Y2FzZSBcIm9wZW5DYWxlbmRhclwiOiB7XG5cdFx0XHRcdGNvbnN0IHVzZXJJZDogc3RyaW5nID0gYXJnWzBdXG5cdFx0XHRcdHJldHVybiB0aGlzLmZhY2FkZS5vcGVuQ2FsZW5kYXIodXNlcklkKVxuXHRcdFx0fVxuXHRcdFx0Y2FzZSBcIm9wZW5Db250YWN0RWRpdG9yXCI6IHtcblx0XHRcdFx0Y29uc3QgY29udGFjdElkOiBzdHJpbmcgPSBhcmdbMF1cblx0XHRcdFx0cmV0dXJuIHRoaXMuZmFjYWRlLm9wZW5Db250YWN0RWRpdG9yKGNvbnRhY3RJZClcblx0XHRcdH1cblx0XHRcdGNhc2UgXCJzaG93QWxlcnREaWFsb2dcIjoge1xuXHRcdFx0XHRjb25zdCB0cmFuc2xhdGlvbktleTogc3RyaW5nID0gYXJnWzBdXG5cdFx0XHRcdHJldHVybiB0aGlzLmZhY2FkZS5zaG93QWxlcnREaWFsb2codHJhbnNsYXRpb25LZXkpXG5cdFx0XHR9XG5cdFx0XHRjYXNlIFwiaW52YWxpZGF0ZUFsYXJtc1wiOiB7XG5cdFx0XHRcdHJldHVybiB0aGlzLmZhY2FkZS5pbnZhbGlkYXRlQWxhcm1zKClcblx0XHRcdH1cblx0XHRcdGNhc2UgXCJ1cGRhdGVUaGVtZVwiOiB7XG5cdFx0XHRcdHJldHVybiB0aGlzLmZhY2FkZS51cGRhdGVUaGVtZSgpXG5cdFx0XHR9XG5cdFx0XHRjYXNlIFwicHJvbXB0Rm9yTmV3UGFzc3dvcmRcIjoge1xuXHRcdFx0XHRjb25zdCB0aXRsZTogc3RyaW5nID0gYXJnWzBdXG5cdFx0XHRcdGNvbnN0IG9sZFBhc3N3b3JkOiBzdHJpbmcgfCBudWxsID0gYXJnWzFdXG5cdFx0XHRcdHJldHVybiB0aGlzLmZhY2FkZS5wcm9tcHRGb3JOZXdQYXNzd29yZCh0aXRsZSwgb2xkUGFzc3dvcmQpXG5cdFx0XHR9XG5cdFx0XHRjYXNlIFwicHJvbXB0Rm9yUGFzc3dvcmRcIjoge1xuXHRcdFx0XHRjb25zdCB0aXRsZTogc3RyaW5nID0gYXJnWzBdXG5cdFx0XHRcdHJldHVybiB0aGlzLmZhY2FkZS5wcm9tcHRGb3JQYXNzd29yZCh0aXRsZSlcblx0XHRcdH1cblx0XHRcdGNhc2UgXCJoYW5kbGVGaWxlSW1wb3J0XCI6IHtcblx0XHRcdFx0Y29uc3QgZmlsZXNVcmlzOiBSZWFkb25seUFycmF5PHN0cmluZz4gPSBhcmdbMF1cblx0XHRcdFx0cmV0dXJuIHRoaXMuZmFjYWRlLmhhbmRsZUZpbGVJbXBvcnQoZmlsZXNVcmlzKVxuXHRcdFx0fVxuXHRcdFx0Y2FzZSBcIm9wZW5TZXR0aW5nc1wiOiB7XG5cdFx0XHRcdGNvbnN0IHBhdGg6IHN0cmluZyA9IGFyZ1swXVxuXHRcdFx0XHRyZXR1cm4gdGhpcy5mYWNhZGUub3BlblNldHRpbmdzKHBhdGgpXG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59XG4iLCIvKiBnZW5lcmF0ZWQgZmlsZSwgZG9uJ3QgZWRpdC4gKi9cblxuaW1wb3J0IHsgRWxlY3Ryb25SZXN1bHQgfSBmcm9tIFwiLi9FbGVjdHJvblJlc3VsdC5qc1wiXG5pbXBvcnQgeyBFcnJvckluZm8gfSBmcm9tIFwiLi9FcnJvckluZm8uanNcIlxuaW1wb3J0IHsgTmF0aXZlU2hvcnRjdXQgfSBmcm9tIFwiLi9OYXRpdmVTaG9ydGN1dC5qc1wiXG5pbXBvcnQgeyBEZXNrdG9wRmFjYWRlIH0gZnJvbSBcIi4vRGVza3RvcEZhY2FkZS5qc1wiXG5cbmV4cG9ydCBjbGFzcyBEZXNrdG9wRmFjYWRlUmVjZWl2ZURpc3BhdGNoZXIge1xuXHRjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IGZhY2FkZTogRGVza3RvcEZhY2FkZSkge31cblx0YXN5bmMgZGlzcGF0Y2gobWV0aG9kOiBzdHJpbmcsIGFyZzogQXJyYXk8YW55Pik6IFByb21pc2U8YW55PiB7XG5cdFx0c3dpdGNoIChtZXRob2QpIHtcblx0XHRcdGNhc2UgXCJwcmludFwiOiB7XG5cdFx0XHRcdHJldHVybiB0aGlzLmZhY2FkZS5wcmludCgpXG5cdFx0XHR9XG5cdFx0XHRjYXNlIFwic2hvd1NwZWxsY2hlY2tEcm9wZG93blwiOiB7XG5cdFx0XHRcdHJldHVybiB0aGlzLmZhY2FkZS5zaG93U3BlbGxjaGVja0Ryb3Bkb3duKClcblx0XHRcdH1cblx0XHRcdGNhc2UgXCJvcGVuRmluZEluUGFnZVwiOiB7XG5cdFx0XHRcdHJldHVybiB0aGlzLmZhY2FkZS5vcGVuRmluZEluUGFnZSgpXG5cdFx0XHR9XG5cdFx0XHRjYXNlIFwiYXBwbHlTZWFyY2hSZXN1bHRUb092ZXJsYXlcIjoge1xuXHRcdFx0XHRjb25zdCByZXN1bHQ6IEVsZWN0cm9uUmVzdWx0IHwgbnVsbCA9IGFyZ1swXVxuXHRcdFx0XHRyZXR1cm4gdGhpcy5mYWNhZGUuYXBwbHlTZWFyY2hSZXN1bHRUb092ZXJsYXkocmVzdWx0KVxuXHRcdFx0fVxuXHRcdFx0Y2FzZSBcInJlcG9ydEVycm9yXCI6IHtcblx0XHRcdFx0Y29uc3QgZXJyb3JJbmZvOiBFcnJvckluZm8gPSBhcmdbMF1cblx0XHRcdFx0cmV0dXJuIHRoaXMuZmFjYWRlLnJlcG9ydEVycm9yKGVycm9ySW5mbylcblx0XHRcdH1cblx0XHRcdGNhc2UgXCJ1cGRhdGVUYXJnZXRVcmxcIjoge1xuXHRcdFx0XHRjb25zdCB1cmw6IHN0cmluZyA9IGFyZ1swXVxuXHRcdFx0XHRjb25zdCBhcHBQYXRoOiBzdHJpbmcgPSBhcmdbMV1cblx0XHRcdFx0cmV0dXJuIHRoaXMuZmFjYWRlLnVwZGF0ZVRhcmdldFVybCh1cmwsIGFwcFBhdGgpXG5cdFx0XHR9XG5cdFx0XHRjYXNlIFwib3BlbkN1c3RvbWVyXCI6IHtcblx0XHRcdFx0Y29uc3QgbWFpbEFkZHJlc3M6IHN0cmluZyB8IG51bGwgPSBhcmdbMF1cblx0XHRcdFx0cmV0dXJuIHRoaXMuZmFjYWRlLm9wZW5DdXN0b21lcihtYWlsQWRkcmVzcylcblx0XHRcdH1cblx0XHRcdGNhc2UgXCJhZGRTaG9ydGN1dHNcIjoge1xuXHRcdFx0XHRjb25zdCBzaG9ydGN1dHM6IFJlYWRvbmx5QXJyYXk8TmF0aXZlU2hvcnRjdXQ+ID0gYXJnWzBdXG5cdFx0XHRcdHJldHVybiB0aGlzLmZhY2FkZS5hZGRTaG9ydGN1dHMoc2hvcnRjdXRzKVxuXHRcdFx0fVxuXHRcdFx0Y2FzZSBcImFwcFVwZGF0ZURvd25sb2FkZWRcIjoge1xuXHRcdFx0XHRyZXR1cm4gdGhpcy5mYWNhZGUuYXBwVXBkYXRlRG93bmxvYWRlZCgpXG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59XG4iLCIvKiBnZW5lcmF0ZWQgZmlsZSwgZG9uJ3QgZWRpdC4gKi9cblxuaW1wb3J0IHsgSW50ZXJXaW5kb3dFdmVudEZhY2FkZSB9IGZyb20gXCIuL0ludGVyV2luZG93RXZlbnRGYWNhZGUuanNcIlxuXG5leHBvcnQgY2xhc3MgSW50ZXJXaW5kb3dFdmVudEZhY2FkZVJlY2VpdmVEaXNwYXRjaGVyIHtcblx0Y29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBmYWNhZGU6IEludGVyV2luZG93RXZlbnRGYWNhZGUpIHt9XG5cdGFzeW5jIGRpc3BhdGNoKG1ldGhvZDogc3RyaW5nLCBhcmc6IEFycmF5PGFueT4pOiBQcm9taXNlPGFueT4ge1xuXHRcdHN3aXRjaCAobWV0aG9kKSB7XG5cdFx0XHRjYXNlIFwibG9jYWxVc2VyRGF0YUludmFsaWRhdGVkXCI6IHtcblx0XHRcdFx0Y29uc3QgdXNlcklkOiBzdHJpbmcgPSBhcmdbMF1cblx0XHRcdFx0cmV0dXJuIHRoaXMuZmFjYWRlLmxvY2FsVXNlckRhdGFJbnZhbGlkYXRlZCh1c2VySWQpXG5cdFx0XHR9XG5cdFx0XHRjYXNlIFwicmVsb2FkRGV2aWNlQ29uZmlnXCI6IHtcblx0XHRcdFx0cmV0dXJuIHRoaXMuZmFjYWRlLnJlbG9hZERldmljZUNvbmZpZygpXG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59XG4iLCIvKiBnZW5lcmF0ZWQgZmlsZSwgZG9uJ3QgZWRpdC4gKi9cblxuaW1wb3J0IHsgTW9iaWxlRmFjYWRlIH0gZnJvbSBcIi4vTW9iaWxlRmFjYWRlLmpzXCJcblxuZXhwb3J0IGNsYXNzIE1vYmlsZUZhY2FkZVJlY2VpdmVEaXNwYXRjaGVyIHtcblx0Y29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBmYWNhZGU6IE1vYmlsZUZhY2FkZSkge31cblx0YXN5bmMgZGlzcGF0Y2gobWV0aG9kOiBzdHJpbmcsIGFyZzogQXJyYXk8YW55Pik6IFByb21pc2U8YW55PiB7XG5cdFx0c3dpdGNoIChtZXRob2QpIHtcblx0XHRcdGNhc2UgXCJoYW5kbGVCYWNrUHJlc3NcIjoge1xuXHRcdFx0XHRyZXR1cm4gdGhpcy5mYWNhZGUuaGFuZGxlQmFja1ByZXNzKClcblx0XHRcdH1cblx0XHRcdGNhc2UgXCJ2aXNpYmlsaXR5Q2hhbmdlXCI6IHtcblx0XHRcdFx0Y29uc3QgdmlzaWJpbGl0eTogYm9vbGVhbiA9IGFyZ1swXVxuXHRcdFx0XHRyZXR1cm4gdGhpcy5mYWNhZGUudmlzaWJpbGl0eUNoYW5nZSh2aXNpYmlsaXR5KVxuXHRcdFx0fVxuXHRcdFx0Y2FzZSBcImtleWJvYXJkU2l6ZUNoYW5nZWRcIjoge1xuXHRcdFx0XHRjb25zdCBuZXdTaXplOiBudW1iZXIgPSBhcmdbMF1cblx0XHRcdFx0cmV0dXJuIHRoaXMuZmFjYWRlLmtleWJvYXJkU2l6ZUNoYW5nZWQobmV3U2l6ZSlcblx0XHRcdH1cblx0XHR9XG5cdH1cbn1cbiIsIi8qIGdlbmVyYXRlZCBmaWxlLCBkb24ndCBlZGl0LiAqL1xuXG5pbXBvcnQgeyBDb21tb25OYXRpdmVGYWNhZGUgfSBmcm9tIFwiLi9Db21tb25OYXRpdmVGYWNhZGUuanNcIlxuaW1wb3J0IHsgQ29tbW9uTmF0aXZlRmFjYWRlUmVjZWl2ZURpc3BhdGNoZXIgfSBmcm9tIFwiLi9Db21tb25OYXRpdmVGYWNhZGVSZWNlaXZlRGlzcGF0Y2hlci5qc1wiXG5pbXBvcnQgeyBEZXNrdG9wRmFjYWRlIH0gZnJvbSBcIi4vRGVza3RvcEZhY2FkZS5qc1wiXG5pbXBvcnQgeyBEZXNrdG9wRmFjYWRlUmVjZWl2ZURpc3BhdGNoZXIgfSBmcm9tIFwiLi9EZXNrdG9wRmFjYWRlUmVjZWl2ZURpc3BhdGNoZXIuanNcIlxuaW1wb3J0IHsgSW50ZXJXaW5kb3dFdmVudEZhY2FkZSB9IGZyb20gXCIuL0ludGVyV2luZG93RXZlbnRGYWNhZGUuanNcIlxuaW1wb3J0IHsgSW50ZXJXaW5kb3dFdmVudEZhY2FkZVJlY2VpdmVEaXNwYXRjaGVyIH0gZnJvbSBcIi4vSW50ZXJXaW5kb3dFdmVudEZhY2FkZVJlY2VpdmVEaXNwYXRjaGVyLmpzXCJcbmltcG9ydCB7IE1vYmlsZUZhY2FkZSB9IGZyb20gXCIuL01vYmlsZUZhY2FkZS5qc1wiXG5pbXBvcnQgeyBNb2JpbGVGYWNhZGVSZWNlaXZlRGlzcGF0Y2hlciB9IGZyb20gXCIuL01vYmlsZUZhY2FkZVJlY2VpdmVEaXNwYXRjaGVyLmpzXCJcblxuZXhwb3J0IGNsYXNzIFdlYkdsb2JhbERpc3BhdGNoZXIge1xuXHRwcml2YXRlIHJlYWRvbmx5IGNvbW1vbk5hdGl2ZUZhY2FkZTogQ29tbW9uTmF0aXZlRmFjYWRlUmVjZWl2ZURpc3BhdGNoZXJcblx0cHJpdmF0ZSByZWFkb25seSBkZXNrdG9wRmFjYWRlOiBEZXNrdG9wRmFjYWRlUmVjZWl2ZURpc3BhdGNoZXJcblx0cHJpdmF0ZSByZWFkb25seSBpbnRlcldpbmRvd0V2ZW50RmFjYWRlOiBJbnRlcldpbmRvd0V2ZW50RmFjYWRlUmVjZWl2ZURpc3BhdGNoZXJcblx0cHJpdmF0ZSByZWFkb25seSBtb2JpbGVGYWNhZGU6IE1vYmlsZUZhY2FkZVJlY2VpdmVEaXNwYXRjaGVyXG5cdGNvbnN0cnVjdG9yKFxuXHRcdGNvbW1vbk5hdGl2ZUZhY2FkZTogQ29tbW9uTmF0aXZlRmFjYWRlLFxuXHRcdGRlc2t0b3BGYWNhZGU6IERlc2t0b3BGYWNhZGUsXG5cdFx0aW50ZXJXaW5kb3dFdmVudEZhY2FkZTogSW50ZXJXaW5kb3dFdmVudEZhY2FkZSxcblx0XHRtb2JpbGVGYWNhZGU6IE1vYmlsZUZhY2FkZSxcblx0KSB7XG5cdFx0dGhpcy5jb21tb25OYXRpdmVGYWNhZGUgPSBuZXcgQ29tbW9uTmF0aXZlRmFjYWRlUmVjZWl2ZURpc3BhdGNoZXIoY29tbW9uTmF0aXZlRmFjYWRlKVxuXHRcdHRoaXMuZGVza3RvcEZhY2FkZSA9IG5ldyBEZXNrdG9wRmFjYWRlUmVjZWl2ZURpc3BhdGNoZXIoZGVza3RvcEZhY2FkZSlcblx0XHR0aGlzLmludGVyV2luZG93RXZlbnRGYWNhZGUgPSBuZXcgSW50ZXJXaW5kb3dFdmVudEZhY2FkZVJlY2VpdmVEaXNwYXRjaGVyKGludGVyV2luZG93RXZlbnRGYWNhZGUpXG5cdFx0dGhpcy5tb2JpbGVGYWNhZGUgPSBuZXcgTW9iaWxlRmFjYWRlUmVjZWl2ZURpc3BhdGNoZXIobW9iaWxlRmFjYWRlKVxuXHR9XG5cblx0YXN5bmMgZGlzcGF0Y2goZmFjYWRlTmFtZTogc3RyaW5nLCBtZXRob2ROYW1lOiBzdHJpbmcsIGFyZ3M6IEFycmF5PGFueT4pIHtcblx0XHRzd2l0Y2ggKGZhY2FkZU5hbWUpIHtcblx0XHRcdGNhc2UgXCJDb21tb25OYXRpdmVGYWNhZGVcIjpcblx0XHRcdFx0cmV0dXJuIHRoaXMuY29tbW9uTmF0aXZlRmFjYWRlLmRpc3BhdGNoKG1ldGhvZE5hbWUsIGFyZ3MpXG5cdFx0XHRjYXNlIFwiRGVza3RvcEZhY2FkZVwiOlxuXHRcdFx0XHRyZXR1cm4gdGhpcy5kZXNrdG9wRmFjYWRlLmRpc3BhdGNoKG1ldGhvZE5hbWUsIGFyZ3MpXG5cdFx0XHRjYXNlIFwiSW50ZXJXaW5kb3dFdmVudEZhY2FkZVwiOlxuXHRcdFx0XHRyZXR1cm4gdGhpcy5pbnRlcldpbmRvd0V2ZW50RmFjYWRlLmRpc3BhdGNoKG1ldGhvZE5hbWUsIGFyZ3MpXG5cdFx0XHRjYXNlIFwiTW9iaWxlRmFjYWRlXCI6XG5cdFx0XHRcdHJldHVybiB0aGlzLm1vYmlsZUZhY2FkZS5kaXNwYXRjaChtZXRob2ROYW1lLCBhcmdzKVxuXHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKFwibGljYyBtZXNzZWQgdXAhIFwiICsgZmFjYWRlTmFtZSlcblx0XHR9XG5cdH1cbn1cbiIsIi8qIGdlbmVyYXRlZCBmaWxlLCBkb24ndCBlZGl0LiAqL1xuXG5pbXBvcnQgeyBDb21tb25TeXN0ZW1GYWNhZGUgfSBmcm9tIFwiLi9Db21tb25TeXN0ZW1GYWNhZGUuanNcIlxuXG5pbnRlcmZhY2UgTmF0aXZlSW50ZXJmYWNlIHtcblx0aW52b2tlTmF0aXZlKHJlcXVlc3RUeXBlOiBzdHJpbmcsIGFyZ3M6IHVua25vd25bXSk6IFByb21pc2U8YW55PlxufVxuZXhwb3J0IGNsYXNzIENvbW1vblN5c3RlbUZhY2FkZVNlbmREaXNwYXRjaGVyIGltcGxlbWVudHMgQ29tbW9uU3lzdGVtRmFjYWRlIHtcblx0Y29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSB0cmFuc3BvcnQ6IE5hdGl2ZUludGVyZmFjZSkge31cblx0YXN5bmMgaW5pdGlhbGl6ZVJlbW90ZUJyaWRnZSguLi5hcmdzOiBQYXJhbWV0ZXJzPENvbW1vblN5c3RlbUZhY2FkZVtcImluaXRpYWxpemVSZW1vdGVCcmlkZ2VcIl0+KSB7XG5cdFx0cmV0dXJuIHRoaXMudHJhbnNwb3J0Lmludm9rZU5hdGl2ZShcImlwY1wiLCBbXCJDb21tb25TeXN0ZW1GYWNhZGVcIiwgXCJpbml0aWFsaXplUmVtb3RlQnJpZGdlXCIsIC4uLmFyZ3NdKVxuXHR9XG5cdGFzeW5jIHJlbG9hZCguLi5hcmdzOiBQYXJhbWV0ZXJzPENvbW1vblN5c3RlbUZhY2FkZVtcInJlbG9hZFwiXT4pIHtcblx0XHRyZXR1cm4gdGhpcy50cmFuc3BvcnQuaW52b2tlTmF0aXZlKFwiaXBjXCIsIFtcIkNvbW1vblN5c3RlbUZhY2FkZVwiLCBcInJlbG9hZFwiLCAuLi5hcmdzXSlcblx0fVxuXHRhc3luYyBnZXRMb2coLi4uYXJnczogUGFyYW1ldGVyczxDb21tb25TeXN0ZW1GYWNhZGVbXCJnZXRMb2dcIl0+KSB7XG5cdFx0cmV0dXJuIHRoaXMudHJhbnNwb3J0Lmludm9rZU5hdGl2ZShcImlwY1wiLCBbXCJDb21tb25TeXN0ZW1GYWNhZGVcIiwgXCJnZXRMb2dcIiwgLi4uYXJnc10pXG5cdH1cbn1cbiIsIi8qIGdlbmVyYXRlZCBmaWxlLCBkb24ndCBlZGl0LiAqL1xuXG5pbXBvcnQgeyBNb2JpbGVTeXN0ZW1GYWNhZGUgfSBmcm9tIFwiLi9Nb2JpbGVTeXN0ZW1GYWNhZGUuanNcIlxuXG5pbnRlcmZhY2UgTmF0aXZlSW50ZXJmYWNlIHtcblx0aW52b2tlTmF0aXZlKHJlcXVlc3RUeXBlOiBzdHJpbmcsIGFyZ3M6IHVua25vd25bXSk6IFByb21pc2U8YW55PlxufVxuZXhwb3J0IGNsYXNzIE1vYmlsZVN5c3RlbUZhY2FkZVNlbmREaXNwYXRjaGVyIGltcGxlbWVudHMgTW9iaWxlU3lzdGVtRmFjYWRlIHtcblx0Y29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSB0cmFuc3BvcnQ6IE5hdGl2ZUludGVyZmFjZSkge31cblx0YXN5bmMgZ29Ub1NldHRpbmdzKC4uLmFyZ3M6IFBhcmFtZXRlcnM8TW9iaWxlU3lzdGVtRmFjYWRlW1wiZ29Ub1NldHRpbmdzXCJdPikge1xuXHRcdHJldHVybiB0aGlzLnRyYW5zcG9ydC5pbnZva2VOYXRpdmUoXCJpcGNcIiwgW1wiTW9iaWxlU3lzdGVtRmFjYWRlXCIsIFwiZ29Ub1NldHRpbmdzXCIsIC4uLmFyZ3NdKVxuXHR9XG5cdGFzeW5jIG9wZW5MaW5rKC4uLmFyZ3M6IFBhcmFtZXRlcnM8TW9iaWxlU3lzdGVtRmFjYWRlW1wib3BlbkxpbmtcIl0+KSB7XG5cdFx0cmV0dXJuIHRoaXMudHJhbnNwb3J0Lmludm9rZU5hdGl2ZShcImlwY1wiLCBbXCJNb2JpbGVTeXN0ZW1GYWNhZGVcIiwgXCJvcGVuTGlua1wiLCAuLi5hcmdzXSlcblx0fVxuXHRhc3luYyBzaGFyZVRleHQoLi4uYXJnczogUGFyYW1ldGVyczxNb2JpbGVTeXN0ZW1GYWNhZGVbXCJzaGFyZVRleHRcIl0+KSB7XG5cdFx0cmV0dXJuIHRoaXMudHJhbnNwb3J0Lmludm9rZU5hdGl2ZShcImlwY1wiLCBbXCJNb2JpbGVTeXN0ZW1GYWNhZGVcIiwgXCJzaGFyZVRleHRcIiwgLi4uYXJnc10pXG5cdH1cblx0YXN5bmMgaGFzUGVybWlzc2lvbiguLi5hcmdzOiBQYXJhbWV0ZXJzPE1vYmlsZVN5c3RlbUZhY2FkZVtcImhhc1Blcm1pc3Npb25cIl0+KSB7XG5cdFx0cmV0dXJuIHRoaXMudHJhbnNwb3J0Lmludm9rZU5hdGl2ZShcImlwY1wiLCBbXCJNb2JpbGVTeXN0ZW1GYWNhZGVcIiwgXCJoYXNQZXJtaXNzaW9uXCIsIC4uLmFyZ3NdKVxuXHR9XG5cdGFzeW5jIHJlcXVlc3RQZXJtaXNzaW9uKC4uLmFyZ3M6IFBhcmFtZXRlcnM8TW9iaWxlU3lzdGVtRmFjYWRlW1wicmVxdWVzdFBlcm1pc3Npb25cIl0+KSB7XG5cdFx0cmV0dXJuIHRoaXMudHJhbnNwb3J0Lmludm9rZU5hdGl2ZShcImlwY1wiLCBbXCJNb2JpbGVTeXN0ZW1GYWNhZGVcIiwgXCJyZXF1ZXN0UGVybWlzc2lvblwiLCAuLi5hcmdzXSlcblx0fVxuXHRhc3luYyBnZXRBcHBMb2NrTWV0aG9kKC4uLmFyZ3M6IFBhcmFtZXRlcnM8TW9iaWxlU3lzdGVtRmFjYWRlW1wiZ2V0QXBwTG9ja01ldGhvZFwiXT4pIHtcblx0XHRyZXR1cm4gdGhpcy50cmFuc3BvcnQuaW52b2tlTmF0aXZlKFwiaXBjXCIsIFtcIk1vYmlsZVN5c3RlbUZhY2FkZVwiLCBcImdldEFwcExvY2tNZXRob2RcIiwgLi4uYXJnc10pXG5cdH1cblx0YXN5bmMgc2V0QXBwTG9ja01ldGhvZCguLi5hcmdzOiBQYXJhbWV0ZXJzPE1vYmlsZVN5c3RlbUZhY2FkZVtcInNldEFwcExvY2tNZXRob2RcIl0+KSB7XG5cdFx0cmV0dXJuIHRoaXMudHJhbnNwb3J0Lmludm9rZU5hdGl2ZShcImlwY1wiLCBbXCJNb2JpbGVTeXN0ZW1GYWNhZGVcIiwgXCJzZXRBcHBMb2NrTWV0aG9kXCIsIC4uLmFyZ3NdKVxuXHR9XG5cdGFzeW5jIGVuZm9yY2VBcHBMb2NrKC4uLmFyZ3M6IFBhcmFtZXRlcnM8TW9iaWxlU3lzdGVtRmFjYWRlW1wiZW5mb3JjZUFwcExvY2tcIl0+KSB7XG5cdFx0cmV0dXJuIHRoaXMudHJhbnNwb3J0Lmludm9rZU5hdGl2ZShcImlwY1wiLCBbXCJNb2JpbGVTeXN0ZW1GYWNhZGVcIiwgXCJlbmZvcmNlQXBwTG9ja1wiLCAuLi5hcmdzXSlcblx0fVxuXHRhc3luYyBnZXRTdXBwb3J0ZWRBcHBMb2NrTWV0aG9kcyguLi5hcmdzOiBQYXJhbWV0ZXJzPE1vYmlsZVN5c3RlbUZhY2FkZVtcImdldFN1cHBvcnRlZEFwcExvY2tNZXRob2RzXCJdPikge1xuXHRcdHJldHVybiB0aGlzLnRyYW5zcG9ydC5pbnZva2VOYXRpdmUoXCJpcGNcIiwgW1wiTW9iaWxlU3lzdGVtRmFjYWRlXCIsIFwiZ2V0U3VwcG9ydGVkQXBwTG9ja01ldGhvZHNcIiwgLi4uYXJnc10pXG5cdH1cblx0YXN5bmMgb3Blbk1haWxBcHAoLi4uYXJnczogUGFyYW1ldGVyczxNb2JpbGVTeXN0ZW1GYWNhZGVbXCJvcGVuTWFpbEFwcFwiXT4pIHtcblx0XHRyZXR1cm4gdGhpcy50cmFuc3BvcnQuaW52b2tlTmF0aXZlKFwiaXBjXCIsIFtcIk1vYmlsZVN5c3RlbUZhY2FkZVwiLCBcIm9wZW5NYWlsQXBwXCIsIC4uLmFyZ3NdKVxuXHR9XG5cdGFzeW5jIG9wZW5DYWxlbmRhckFwcCguLi5hcmdzOiBQYXJhbWV0ZXJzPE1vYmlsZVN5c3RlbUZhY2FkZVtcIm9wZW5DYWxlbmRhckFwcFwiXT4pIHtcblx0XHRyZXR1cm4gdGhpcy50cmFuc3BvcnQuaW52b2tlTmF0aXZlKFwiaXBjXCIsIFtcIk1vYmlsZVN5c3RlbUZhY2FkZVwiLCBcIm9wZW5DYWxlbmRhckFwcFwiLCAuLi5hcmdzXSlcblx0fVxuXHRhc3luYyBnZXRJbnN0YWxsYXRpb25EYXRlKC4uLmFyZ3M6IFBhcmFtZXRlcnM8TW9iaWxlU3lzdGVtRmFjYWRlW1wiZ2V0SW5zdGFsbGF0aW9uRGF0ZVwiXT4pIHtcblx0XHRyZXR1cm4gdGhpcy50cmFuc3BvcnQuaW52b2tlTmF0aXZlKFwiaXBjXCIsIFtcIk1vYmlsZVN5c3RlbUZhY2FkZVwiLCBcImdldEluc3RhbGxhdGlvbkRhdGVcIiwgLi4uYXJnc10pXG5cdH1cblx0YXN5bmMgcmVxdWVzdEluQXBwUmF0aW5nKC4uLmFyZ3M6IFBhcmFtZXRlcnM8TW9iaWxlU3lzdGVtRmFjYWRlW1wicmVxdWVzdEluQXBwUmF0aW5nXCJdPikge1xuXHRcdHJldHVybiB0aGlzLnRyYW5zcG9ydC5pbnZva2VOYXRpdmUoXCJpcGNcIiwgW1wiTW9iaWxlU3lzdGVtRmFjYWRlXCIsIFwicmVxdWVzdEluQXBwUmF0aW5nXCIsIC4uLmFyZ3NdKVxuXHR9XG59XG4iLCIvKiBnZW5lcmF0ZWQgZmlsZSwgZG9uJ3QgZWRpdC4gKi9cblxuaW1wb3J0IHsgVGhlbWVGYWNhZGUgfSBmcm9tIFwiLi9UaGVtZUZhY2FkZS5qc1wiXG5cbmludGVyZmFjZSBOYXRpdmVJbnRlcmZhY2Uge1xuXHRpbnZva2VOYXRpdmUocmVxdWVzdFR5cGU6IHN0cmluZywgYXJnczogdW5rbm93bltdKTogUHJvbWlzZTxhbnk+XG59XG5leHBvcnQgY2xhc3MgVGhlbWVGYWNhZGVTZW5kRGlzcGF0Y2hlciBpbXBsZW1lbnRzIFRoZW1lRmFjYWRlIHtcblx0Y29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSB0cmFuc3BvcnQ6IE5hdGl2ZUludGVyZmFjZSkge31cblx0YXN5bmMgZ2V0VGhlbWVzKC4uLmFyZ3M6IFBhcmFtZXRlcnM8VGhlbWVGYWNhZGVbXCJnZXRUaGVtZXNcIl0+KSB7XG5cdFx0cmV0dXJuIHRoaXMudHJhbnNwb3J0Lmludm9rZU5hdGl2ZShcImlwY1wiLCBbXCJUaGVtZUZhY2FkZVwiLCBcImdldFRoZW1lc1wiLCAuLi5hcmdzXSlcblx0fVxuXHRhc3luYyBzZXRUaGVtZXMoLi4uYXJnczogUGFyYW1ldGVyczxUaGVtZUZhY2FkZVtcInNldFRoZW1lc1wiXT4pIHtcblx0XHRyZXR1cm4gdGhpcy50cmFuc3BvcnQuaW52b2tlTmF0aXZlKFwiaXBjXCIsIFtcIlRoZW1lRmFjYWRlXCIsIFwic2V0VGhlbWVzXCIsIC4uLmFyZ3NdKVxuXHR9XG5cdGFzeW5jIGdldFRoZW1lUHJlZmVyZW5jZSguLi5hcmdzOiBQYXJhbWV0ZXJzPFRoZW1lRmFjYWRlW1wiZ2V0VGhlbWVQcmVmZXJlbmNlXCJdPikge1xuXHRcdHJldHVybiB0aGlzLnRyYW5zcG9ydC5pbnZva2VOYXRpdmUoXCJpcGNcIiwgW1wiVGhlbWVGYWNhZGVcIiwgXCJnZXRUaGVtZVByZWZlcmVuY2VcIiwgLi4uYXJnc10pXG5cdH1cblx0YXN5bmMgc2V0VGhlbWVQcmVmZXJlbmNlKC4uLmFyZ3M6IFBhcmFtZXRlcnM8VGhlbWVGYWNhZGVbXCJzZXRUaGVtZVByZWZlcmVuY2VcIl0+KSB7XG5cdFx0cmV0dXJuIHRoaXMudHJhbnNwb3J0Lmludm9rZU5hdGl2ZShcImlwY1wiLCBbXCJUaGVtZUZhY2FkZVwiLCBcInNldFRoZW1lUHJlZmVyZW5jZVwiLCAuLi5hcmdzXSlcblx0fVxuXHRhc3luYyBwcmVmZXJzRGFyayguLi5hcmdzOiBQYXJhbWV0ZXJzPFRoZW1lRmFjYWRlW1wicHJlZmVyc0RhcmtcIl0+KSB7XG5cdFx0cmV0dXJuIHRoaXMudHJhbnNwb3J0Lmludm9rZU5hdGl2ZShcImlwY1wiLCBbXCJUaGVtZUZhY2FkZVwiLCBcInByZWZlcnNEYXJrXCIsIC4uLmFyZ3NdKVxuXHR9XG59XG4iLCIvKiBnZW5lcmF0ZWQgZmlsZSwgZG9uJ3QgZWRpdC4gKi9cblxuaW1wb3J0IHsgU2VhcmNoVGV4dEluQXBwRmFjYWRlIH0gZnJvbSBcIi4vU2VhcmNoVGV4dEluQXBwRmFjYWRlLmpzXCJcblxuaW50ZXJmYWNlIE5hdGl2ZUludGVyZmFjZSB7XG5cdGludm9rZU5hdGl2ZShyZXF1ZXN0VHlwZTogc3RyaW5nLCBhcmdzOiB1bmtub3duW10pOiBQcm9taXNlPGFueT5cbn1cbmV4cG9ydCBjbGFzcyBTZWFyY2hUZXh0SW5BcHBGYWNhZGVTZW5kRGlzcGF0Y2hlciBpbXBsZW1lbnRzIFNlYXJjaFRleHRJbkFwcEZhY2FkZSB7XG5cdGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgdHJhbnNwb3J0OiBOYXRpdmVJbnRlcmZhY2UpIHt9XG5cdGFzeW5jIGZpbmRJblBhZ2UoLi4uYXJnczogUGFyYW1ldGVyczxTZWFyY2hUZXh0SW5BcHBGYWNhZGVbXCJmaW5kSW5QYWdlXCJdPikge1xuXHRcdHJldHVybiB0aGlzLnRyYW5zcG9ydC5pbnZva2VOYXRpdmUoXCJpcGNcIiwgW1wiU2VhcmNoVGV4dEluQXBwRmFjYWRlXCIsIFwiZmluZEluUGFnZVwiLCAuLi5hcmdzXSlcblx0fVxuXHRhc3luYyBzdG9wRmluZEluUGFnZSguLi5hcmdzOiBQYXJhbWV0ZXJzPFNlYXJjaFRleHRJbkFwcEZhY2FkZVtcInN0b3BGaW5kSW5QYWdlXCJdPikge1xuXHRcdHJldHVybiB0aGlzLnRyYW5zcG9ydC5pbnZva2VOYXRpdmUoXCJpcGNcIiwgW1wiU2VhcmNoVGV4dEluQXBwRmFjYWRlXCIsIFwic3RvcEZpbmRJblBhZ2VcIiwgLi4uYXJnc10pXG5cdH1cblx0YXN5bmMgc2V0U2VhcmNoT3ZlcmxheVN0YXRlKC4uLmFyZ3M6IFBhcmFtZXRlcnM8U2VhcmNoVGV4dEluQXBwRmFjYWRlW1wic2V0U2VhcmNoT3ZlcmxheVN0YXRlXCJdPikge1xuXHRcdHJldHVybiB0aGlzLnRyYW5zcG9ydC5pbnZva2VOYXRpdmUoXCJpcGNcIiwgW1wiU2VhcmNoVGV4dEluQXBwRmFjYWRlXCIsIFwic2V0U2VhcmNoT3ZlcmxheVN0YXRlXCIsIC4uLmFyZ3NdKVxuXHR9XG59XG4iLCIvKiBnZW5lcmF0ZWQgZmlsZSwgZG9uJ3QgZWRpdC4gKi9cblxuaW1wb3J0IHsgU2V0dGluZ3NGYWNhZGUgfSBmcm9tIFwiLi9TZXR0aW5nc0ZhY2FkZS5qc1wiXG5cbmludGVyZmFjZSBOYXRpdmVJbnRlcmZhY2Uge1xuXHRpbnZva2VOYXRpdmUocmVxdWVzdFR5cGU6IHN0cmluZywgYXJnczogdW5rbm93bltdKTogUHJvbWlzZTxhbnk+XG59XG5leHBvcnQgY2xhc3MgU2V0dGluZ3NGYWNhZGVTZW5kRGlzcGF0Y2hlciBpbXBsZW1lbnRzIFNldHRpbmdzRmFjYWRlIHtcblx0Y29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSB0cmFuc3BvcnQ6IE5hdGl2ZUludGVyZmFjZSkge31cblx0YXN5bmMgZ2V0U3RyaW5nQ29uZmlnVmFsdWUoLi4uYXJnczogUGFyYW1ldGVyczxTZXR0aW5nc0ZhY2FkZVtcImdldFN0cmluZ0NvbmZpZ1ZhbHVlXCJdPikge1xuXHRcdHJldHVybiB0aGlzLnRyYW5zcG9ydC5pbnZva2VOYXRpdmUoXCJpcGNcIiwgW1wiU2V0dGluZ3NGYWNhZGVcIiwgXCJnZXRTdHJpbmdDb25maWdWYWx1ZVwiLCAuLi5hcmdzXSlcblx0fVxuXHRhc3luYyBzZXRTdHJpbmdDb25maWdWYWx1ZSguLi5hcmdzOiBQYXJhbWV0ZXJzPFNldHRpbmdzRmFjYWRlW1wic2V0U3RyaW5nQ29uZmlnVmFsdWVcIl0+KSB7XG5cdFx0cmV0dXJuIHRoaXMudHJhbnNwb3J0Lmludm9rZU5hdGl2ZShcImlwY1wiLCBbXCJTZXR0aW5nc0ZhY2FkZVwiLCBcInNldFN0cmluZ0NvbmZpZ1ZhbHVlXCIsIC4uLmFyZ3NdKVxuXHR9XG5cdGFzeW5jIGdldEJvb2xlYW5Db25maWdWYWx1ZSguLi5hcmdzOiBQYXJhbWV0ZXJzPFNldHRpbmdzRmFjYWRlW1wiZ2V0Qm9vbGVhbkNvbmZpZ1ZhbHVlXCJdPikge1xuXHRcdHJldHVybiB0aGlzLnRyYW5zcG9ydC5pbnZva2VOYXRpdmUoXCJpcGNcIiwgW1wiU2V0dGluZ3NGYWNhZGVcIiwgXCJnZXRCb29sZWFuQ29uZmlnVmFsdWVcIiwgLi4uYXJnc10pXG5cdH1cblx0YXN5bmMgc2V0Qm9vbGVhbkNvbmZpZ1ZhbHVlKC4uLmFyZ3M6IFBhcmFtZXRlcnM8U2V0dGluZ3NGYWNhZGVbXCJzZXRCb29sZWFuQ29uZmlnVmFsdWVcIl0+KSB7XG5cdFx0cmV0dXJuIHRoaXMudHJhbnNwb3J0Lmludm9rZU5hdGl2ZShcImlwY1wiLCBbXCJTZXR0aW5nc0ZhY2FkZVwiLCBcInNldEJvb2xlYW5Db25maWdWYWx1ZVwiLCAuLi5hcmdzXSlcblx0fVxuXHRhc3luYyBnZXRVcGRhdGVJbmZvKC4uLmFyZ3M6IFBhcmFtZXRlcnM8U2V0dGluZ3NGYWNhZGVbXCJnZXRVcGRhdGVJbmZvXCJdPikge1xuXHRcdHJldHVybiB0aGlzLnRyYW5zcG9ydC5pbnZva2VOYXRpdmUoXCJpcGNcIiwgW1wiU2V0dGluZ3NGYWNhZGVcIiwgXCJnZXRVcGRhdGVJbmZvXCIsIC4uLmFyZ3NdKVxuXHR9XG5cdGFzeW5jIHJlZ2lzdGVyTWFpbHRvKC4uLmFyZ3M6IFBhcmFtZXRlcnM8U2V0dGluZ3NGYWNhZGVbXCJyZWdpc3Rlck1haWx0b1wiXT4pIHtcblx0XHRyZXR1cm4gdGhpcy50cmFuc3BvcnQuaW52b2tlTmF0aXZlKFwiaXBjXCIsIFtcIlNldHRpbmdzRmFjYWRlXCIsIFwicmVnaXN0ZXJNYWlsdG9cIiwgLi4uYXJnc10pXG5cdH1cblx0YXN5bmMgdW5yZWdpc3Rlck1haWx0byguLi5hcmdzOiBQYXJhbWV0ZXJzPFNldHRpbmdzRmFjYWRlW1widW5yZWdpc3Rlck1haWx0b1wiXT4pIHtcblx0XHRyZXR1cm4gdGhpcy50cmFuc3BvcnQuaW52b2tlTmF0aXZlKFwiaXBjXCIsIFtcIlNldHRpbmdzRmFjYWRlXCIsIFwidW5yZWdpc3Rlck1haWx0b1wiLCAuLi5hcmdzXSlcblx0fVxuXHRhc3luYyBpbnRlZ3JhdGVEZXNrdG9wKC4uLmFyZ3M6IFBhcmFtZXRlcnM8U2V0dGluZ3NGYWNhZGVbXCJpbnRlZ3JhdGVEZXNrdG9wXCJdPikge1xuXHRcdHJldHVybiB0aGlzLnRyYW5zcG9ydC5pbnZva2VOYXRpdmUoXCJpcGNcIiwgW1wiU2V0dGluZ3NGYWNhZGVcIiwgXCJpbnRlZ3JhdGVEZXNrdG9wXCIsIC4uLmFyZ3NdKVxuXHR9XG5cdGFzeW5jIHVuSW50ZWdyYXRlRGVza3RvcCguLi5hcmdzOiBQYXJhbWV0ZXJzPFNldHRpbmdzRmFjYWRlW1widW5JbnRlZ3JhdGVEZXNrdG9wXCJdPikge1xuXHRcdHJldHVybiB0aGlzLnRyYW5zcG9ydC5pbnZva2VOYXRpdmUoXCJpcGNcIiwgW1wiU2V0dGluZ3NGYWNhZGVcIiwgXCJ1bkludGVncmF0ZURlc2t0b3BcIiwgLi4uYXJnc10pXG5cdH1cblx0YXN5bmMgZ2V0U3BlbGxjaGVja0xhbmd1YWdlcyguLi5hcmdzOiBQYXJhbWV0ZXJzPFNldHRpbmdzRmFjYWRlW1wiZ2V0U3BlbGxjaGVja0xhbmd1YWdlc1wiXT4pIHtcblx0XHRyZXR1cm4gdGhpcy50cmFuc3BvcnQuaW52b2tlTmF0aXZlKFwiaXBjXCIsIFtcIlNldHRpbmdzRmFjYWRlXCIsIFwiZ2V0U3BlbGxjaGVja0xhbmd1YWdlc1wiLCAuLi5hcmdzXSlcblx0fVxuXHRhc3luYyBnZXRJbnRlZ3JhdGlvbkluZm8oLi4uYXJnczogUGFyYW1ldGVyczxTZXR0aW5nc0ZhY2FkZVtcImdldEludGVncmF0aW9uSW5mb1wiXT4pIHtcblx0XHRyZXR1cm4gdGhpcy50cmFuc3BvcnQuaW52b2tlTmF0aXZlKFwiaXBjXCIsIFtcIlNldHRpbmdzRmFjYWRlXCIsIFwiZ2V0SW50ZWdyYXRpb25JbmZvXCIsIC4uLmFyZ3NdKVxuXHR9XG5cdGFzeW5jIGVuYWJsZUF1dG9MYXVuY2goLi4uYXJnczogUGFyYW1ldGVyczxTZXR0aW5nc0ZhY2FkZVtcImVuYWJsZUF1dG9MYXVuY2hcIl0+KSB7XG5cdFx0cmV0dXJuIHRoaXMudHJhbnNwb3J0Lmludm9rZU5hdGl2ZShcImlwY1wiLCBbXCJTZXR0aW5nc0ZhY2FkZVwiLCBcImVuYWJsZUF1dG9MYXVuY2hcIiwgLi4uYXJnc10pXG5cdH1cblx0YXN5bmMgZGlzYWJsZUF1dG9MYXVuY2goLi4uYXJnczogUGFyYW1ldGVyczxTZXR0aW5nc0ZhY2FkZVtcImRpc2FibGVBdXRvTGF1bmNoXCJdPikge1xuXHRcdHJldHVybiB0aGlzLnRyYW5zcG9ydC5pbnZva2VOYXRpdmUoXCJpcGNcIiwgW1wiU2V0dGluZ3NGYWNhZGVcIiwgXCJkaXNhYmxlQXV0b0xhdW5jaFwiLCAuLi5hcmdzXSlcblx0fVxuXHRhc3luYyBtYW51YWxVcGRhdGUoLi4uYXJnczogUGFyYW1ldGVyczxTZXR0aW5nc0ZhY2FkZVtcIm1hbnVhbFVwZGF0ZVwiXT4pIHtcblx0XHRyZXR1cm4gdGhpcy50cmFuc3BvcnQuaW52b2tlTmF0aXZlKFwiaXBjXCIsIFtcIlNldHRpbmdzRmFjYWRlXCIsIFwibWFudWFsVXBkYXRlXCIsIC4uLmFyZ3NdKVxuXHR9XG5cdGFzeW5jIGNoYW5nZUxhbmd1YWdlKC4uLmFyZ3M6IFBhcmFtZXRlcnM8U2V0dGluZ3NGYWNhZGVbXCJjaGFuZ2VMYW5ndWFnZVwiXT4pIHtcblx0XHRyZXR1cm4gdGhpcy50cmFuc3BvcnQuaW52b2tlTmF0aXZlKFwiaXBjXCIsIFtcIlNldHRpbmdzRmFjYWRlXCIsIFwiY2hhbmdlTGFuZ3VhZ2VcIiwgLi4uYXJnc10pXG5cdH1cbn1cbiIsIi8qIGdlbmVyYXRlZCBmaWxlLCBkb24ndCBlZGl0LiAqL1xuXG5pbXBvcnQgeyBEZXNrdG9wU3lzdGVtRmFjYWRlIH0gZnJvbSBcIi4vRGVza3RvcFN5c3RlbUZhY2FkZS5qc1wiXG5cbmludGVyZmFjZSBOYXRpdmVJbnRlcmZhY2Uge1xuXHRpbnZva2VOYXRpdmUocmVxdWVzdFR5cGU6IHN0cmluZywgYXJnczogdW5rbm93bltdKTogUHJvbWlzZTxhbnk+XG59XG5leHBvcnQgY2xhc3MgRGVza3RvcFN5c3RlbUZhY2FkZVNlbmREaXNwYXRjaGVyIGltcGxlbWVudHMgRGVza3RvcFN5c3RlbUZhY2FkZSB7XG5cdGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgdHJhbnNwb3J0OiBOYXRpdmVJbnRlcmZhY2UpIHt9XG5cdGFzeW5jIG9wZW5OZXdXaW5kb3coLi4uYXJnczogUGFyYW1ldGVyczxEZXNrdG9wU3lzdGVtRmFjYWRlW1wib3Blbk5ld1dpbmRvd1wiXT4pIHtcblx0XHRyZXR1cm4gdGhpcy50cmFuc3BvcnQuaW52b2tlTmF0aXZlKFwiaXBjXCIsIFtcIkRlc2t0b3BTeXN0ZW1GYWNhZGVcIiwgXCJvcGVuTmV3V2luZG93XCIsIC4uLmFyZ3NdKVxuXHR9XG5cdGFzeW5jIGZvY3VzQXBwbGljYXRpb25XaW5kb3coLi4uYXJnczogUGFyYW1ldGVyczxEZXNrdG9wU3lzdGVtRmFjYWRlW1wiZm9jdXNBcHBsaWNhdGlvbldpbmRvd1wiXT4pIHtcblx0XHRyZXR1cm4gdGhpcy50cmFuc3BvcnQuaW52b2tlTmF0aXZlKFwiaXBjXCIsIFtcIkRlc2t0b3BTeXN0ZW1GYWNhZGVcIiwgXCJmb2N1c0FwcGxpY2F0aW9uV2luZG93XCIsIC4uLmFyZ3NdKVxuXHR9XG5cdGFzeW5jIHNlbmRTb2NrZXRNZXNzYWdlKC4uLmFyZ3M6IFBhcmFtZXRlcnM8RGVza3RvcFN5c3RlbUZhY2FkZVtcInNlbmRTb2NrZXRNZXNzYWdlXCJdPikge1xuXHRcdHJldHVybiB0aGlzLnRyYW5zcG9ydC5pbnZva2VOYXRpdmUoXCJpcGNcIiwgW1wiRGVza3RvcFN5c3RlbUZhY2FkZVwiLCBcInNlbmRTb2NrZXRNZXNzYWdlXCIsIC4uLmFyZ3NdKVxuXHR9XG59XG4iLCIvKiBnZW5lcmF0ZWQgZmlsZSwgZG9uJ3QgZWRpdC4gKi9cblxuaW1wb3J0IHsgTW9iaWxlQ29udGFjdHNGYWNhZGUgfSBmcm9tIFwiLi9Nb2JpbGVDb250YWN0c0ZhY2FkZS5qc1wiXG5cbmludGVyZmFjZSBOYXRpdmVJbnRlcmZhY2Uge1xuXHRpbnZva2VOYXRpdmUocmVxdWVzdFR5cGU6IHN0cmluZywgYXJnczogdW5rbm93bltdKTogUHJvbWlzZTxhbnk+XG59XG5leHBvcnQgY2xhc3MgTW9iaWxlQ29udGFjdHNGYWNhZGVTZW5kRGlzcGF0Y2hlciBpbXBsZW1lbnRzIE1vYmlsZUNvbnRhY3RzRmFjYWRlIHtcblx0Y29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSB0cmFuc3BvcnQ6IE5hdGl2ZUludGVyZmFjZSkge31cblx0YXN5bmMgZmluZFN1Z2dlc3Rpb25zKC4uLmFyZ3M6IFBhcmFtZXRlcnM8TW9iaWxlQ29udGFjdHNGYWNhZGVbXCJmaW5kU3VnZ2VzdGlvbnNcIl0+KSB7XG5cdFx0cmV0dXJuIHRoaXMudHJhbnNwb3J0Lmludm9rZU5hdGl2ZShcImlwY1wiLCBbXCJNb2JpbGVDb250YWN0c0ZhY2FkZVwiLCBcImZpbmRTdWdnZXN0aW9uc1wiLCAuLi5hcmdzXSlcblx0fVxuXHRhc3luYyBzYXZlQ29udGFjdHMoLi4uYXJnczogUGFyYW1ldGVyczxNb2JpbGVDb250YWN0c0ZhY2FkZVtcInNhdmVDb250YWN0c1wiXT4pIHtcblx0XHRyZXR1cm4gdGhpcy50cmFuc3BvcnQuaW52b2tlTmF0aXZlKFwiaXBjXCIsIFtcIk1vYmlsZUNvbnRhY3RzRmFjYWRlXCIsIFwic2F2ZUNvbnRhY3RzXCIsIC4uLmFyZ3NdKVxuXHR9XG5cdGFzeW5jIHN5bmNDb250YWN0cyguLi5hcmdzOiBQYXJhbWV0ZXJzPE1vYmlsZUNvbnRhY3RzRmFjYWRlW1wic3luY0NvbnRhY3RzXCJdPikge1xuXHRcdHJldHVybiB0aGlzLnRyYW5zcG9ydC5pbnZva2VOYXRpdmUoXCJpcGNcIiwgW1wiTW9iaWxlQ29udGFjdHNGYWNhZGVcIiwgXCJzeW5jQ29udGFjdHNcIiwgLi4uYXJnc10pXG5cdH1cblx0YXN5bmMgZ2V0Q29udGFjdEJvb2tzKC4uLmFyZ3M6IFBhcmFtZXRlcnM8TW9iaWxlQ29udGFjdHNGYWNhZGVbXCJnZXRDb250YWN0Qm9va3NcIl0+KSB7XG5cdFx0cmV0dXJuIHRoaXMudHJhbnNwb3J0Lmludm9rZU5hdGl2ZShcImlwY1wiLCBbXCJNb2JpbGVDb250YWN0c0ZhY2FkZVwiLCBcImdldENvbnRhY3RCb29rc1wiLCAuLi5hcmdzXSlcblx0fVxuXHRhc3luYyBnZXRDb250YWN0c0luQ29udGFjdEJvb2soLi4uYXJnczogUGFyYW1ldGVyczxNb2JpbGVDb250YWN0c0ZhY2FkZVtcImdldENvbnRhY3RzSW5Db250YWN0Qm9va1wiXT4pIHtcblx0XHRyZXR1cm4gdGhpcy50cmFuc3BvcnQuaW52b2tlTmF0aXZlKFwiaXBjXCIsIFtcIk1vYmlsZUNvbnRhY3RzRmFjYWRlXCIsIFwiZ2V0Q29udGFjdHNJbkNvbnRhY3RCb29rXCIsIC4uLmFyZ3NdKVxuXHR9XG5cdGFzeW5jIGRlbGV0ZUNvbnRhY3RzKC4uLmFyZ3M6IFBhcmFtZXRlcnM8TW9iaWxlQ29udGFjdHNGYWNhZGVbXCJkZWxldGVDb250YWN0c1wiXT4pIHtcblx0XHRyZXR1cm4gdGhpcy50cmFuc3BvcnQuaW52b2tlTmF0aXZlKFwiaXBjXCIsIFtcIk1vYmlsZUNvbnRhY3RzRmFjYWRlXCIsIFwiZGVsZXRlQ29udGFjdHNcIiwgLi4uYXJnc10pXG5cdH1cblx0YXN5bmMgaXNMb2NhbFN0b3JhZ2VBdmFpbGFibGUoLi4uYXJnczogUGFyYW1ldGVyczxNb2JpbGVDb250YWN0c0ZhY2FkZVtcImlzTG9jYWxTdG9yYWdlQXZhaWxhYmxlXCJdPikge1xuXHRcdHJldHVybiB0aGlzLnRyYW5zcG9ydC5pbnZva2VOYXRpdmUoXCJpcGNcIiwgW1wiTW9iaWxlQ29udGFjdHNGYWNhZGVcIiwgXCJpc0xvY2FsU3RvcmFnZUF2YWlsYWJsZVwiLCAuLi5hcmdzXSlcblx0fVxuXHRhc3luYyBmaW5kTG9jYWxNYXRjaGVzKC4uLmFyZ3M6IFBhcmFtZXRlcnM8TW9iaWxlQ29udGFjdHNGYWNhZGVbXCJmaW5kTG9jYWxNYXRjaGVzXCJdPikge1xuXHRcdHJldHVybiB0aGlzLnRyYW5zcG9ydC5pbnZva2VOYXRpdmUoXCJpcGNcIiwgW1wiTW9iaWxlQ29udGFjdHNGYWNhZGVcIiwgXCJmaW5kTG9jYWxNYXRjaGVzXCIsIC4uLmFyZ3NdKVxuXHR9XG5cdGFzeW5jIGRlbGV0ZUxvY2FsQ29udGFjdHMoLi4uYXJnczogUGFyYW1ldGVyczxNb2JpbGVDb250YWN0c0ZhY2FkZVtcImRlbGV0ZUxvY2FsQ29udGFjdHNcIl0+KSB7XG5cdFx0cmV0dXJuIHRoaXMudHJhbnNwb3J0Lmludm9rZU5hdGl2ZShcImlwY1wiLCBbXCJNb2JpbGVDb250YWN0c0ZhY2FkZVwiLCBcImRlbGV0ZUxvY2FsQ29udGFjdHNcIiwgLi4uYXJnc10pXG5cdH1cbn1cbiIsIi8qIGdlbmVyYXRlZCBmaWxlLCBkb24ndCBlZGl0LiAqL1xuXG5pbXBvcnQgeyBOYXRpdmVDcmVkZW50aWFsc0ZhY2FkZSB9IGZyb20gXCIuL05hdGl2ZUNyZWRlbnRpYWxzRmFjYWRlLmpzXCJcblxuaW50ZXJmYWNlIE5hdGl2ZUludGVyZmFjZSB7XG5cdGludm9rZU5hdGl2ZShyZXF1ZXN0VHlwZTogc3RyaW5nLCBhcmdzOiB1bmtub3duW10pOiBQcm9taXNlPGFueT5cbn1cbmV4cG9ydCBjbGFzcyBOYXRpdmVDcmVkZW50aWFsc0ZhY2FkZVNlbmREaXNwYXRjaGVyIGltcGxlbWVudHMgTmF0aXZlQ3JlZGVudGlhbHNGYWNhZGUge1xuXHRjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IHRyYW5zcG9ydDogTmF0aXZlSW50ZXJmYWNlKSB7fVxuXHRhc3luYyBnZXRTdXBwb3J0ZWRFbmNyeXB0aW9uTW9kZXMoLi4uYXJnczogUGFyYW1ldGVyczxOYXRpdmVDcmVkZW50aWFsc0ZhY2FkZVtcImdldFN1cHBvcnRlZEVuY3J5cHRpb25Nb2Rlc1wiXT4pIHtcblx0XHRyZXR1cm4gdGhpcy50cmFuc3BvcnQuaW52b2tlTmF0aXZlKFwiaXBjXCIsIFtcIk5hdGl2ZUNyZWRlbnRpYWxzRmFjYWRlXCIsIFwiZ2V0U3VwcG9ydGVkRW5jcnlwdGlvbk1vZGVzXCIsIC4uLmFyZ3NdKVxuXHR9XG5cdGFzeW5jIGxvYWRBbGwoLi4uYXJnczogUGFyYW1ldGVyczxOYXRpdmVDcmVkZW50aWFsc0ZhY2FkZVtcImxvYWRBbGxcIl0+KSB7XG5cdFx0cmV0dXJuIHRoaXMudHJhbnNwb3J0Lmludm9rZU5hdGl2ZShcImlwY1wiLCBbXCJOYXRpdmVDcmVkZW50aWFsc0ZhY2FkZVwiLCBcImxvYWRBbGxcIiwgLi4uYXJnc10pXG5cdH1cblx0YXN5bmMgc3RvcmUoLi4uYXJnczogUGFyYW1ldGVyczxOYXRpdmVDcmVkZW50aWFsc0ZhY2FkZVtcInN0b3JlXCJdPikge1xuXHRcdHJldHVybiB0aGlzLnRyYW5zcG9ydC5pbnZva2VOYXRpdmUoXCJpcGNcIiwgW1wiTmF0aXZlQ3JlZGVudGlhbHNGYWNhZGVcIiwgXCJzdG9yZVwiLCAuLi5hcmdzXSlcblx0fVxuXHRhc3luYyBzdG9yZUVuY3J5cHRlZCguLi5hcmdzOiBQYXJhbWV0ZXJzPE5hdGl2ZUNyZWRlbnRpYWxzRmFjYWRlW1wic3RvcmVFbmNyeXB0ZWRcIl0+KSB7XG5cdFx0cmV0dXJuIHRoaXMudHJhbnNwb3J0Lmludm9rZU5hdGl2ZShcImlwY1wiLCBbXCJOYXRpdmVDcmVkZW50aWFsc0ZhY2FkZVwiLCBcInN0b3JlRW5jcnlwdGVkXCIsIC4uLmFyZ3NdKVxuXHR9XG5cdGFzeW5jIGxvYWRCeVVzZXJJZCguLi5hcmdzOiBQYXJhbWV0ZXJzPE5hdGl2ZUNyZWRlbnRpYWxzRmFjYWRlW1wibG9hZEJ5VXNlcklkXCJdPikge1xuXHRcdHJldHVybiB0aGlzLnRyYW5zcG9ydC5pbnZva2VOYXRpdmUoXCJpcGNcIiwgW1wiTmF0aXZlQ3JlZGVudGlhbHNGYWNhZGVcIiwgXCJsb2FkQnlVc2VySWRcIiwgLi4uYXJnc10pXG5cdH1cblx0YXN5bmMgZGVsZXRlQnlVc2VySWQoLi4uYXJnczogUGFyYW1ldGVyczxOYXRpdmVDcmVkZW50aWFsc0ZhY2FkZVtcImRlbGV0ZUJ5VXNlcklkXCJdPikge1xuXHRcdHJldHVybiB0aGlzLnRyYW5zcG9ydC5pbnZva2VOYXRpdmUoXCJpcGNcIiwgW1wiTmF0aXZlQ3JlZGVudGlhbHNGYWNhZGVcIiwgXCJkZWxldGVCeVVzZXJJZFwiLCAuLi5hcmdzXSlcblx0fVxuXHRhc3luYyBnZXRDcmVkZW50aWFsRW5jcnlwdGlvbk1vZGUoLi4uYXJnczogUGFyYW1ldGVyczxOYXRpdmVDcmVkZW50aWFsc0ZhY2FkZVtcImdldENyZWRlbnRpYWxFbmNyeXB0aW9uTW9kZVwiXT4pIHtcblx0XHRyZXR1cm4gdGhpcy50cmFuc3BvcnQuaW52b2tlTmF0aXZlKFwiaXBjXCIsIFtcIk5hdGl2ZUNyZWRlbnRpYWxzRmFjYWRlXCIsIFwiZ2V0Q3JlZGVudGlhbEVuY3J5cHRpb25Nb2RlXCIsIC4uLmFyZ3NdKVxuXHR9XG5cdGFzeW5jIHNldENyZWRlbnRpYWxFbmNyeXB0aW9uTW9kZSguLi5hcmdzOiBQYXJhbWV0ZXJzPE5hdGl2ZUNyZWRlbnRpYWxzRmFjYWRlW1wic2V0Q3JlZGVudGlhbEVuY3J5cHRpb25Nb2RlXCJdPikge1xuXHRcdHJldHVybiB0aGlzLnRyYW5zcG9ydC5pbnZva2VOYXRpdmUoXCJpcGNcIiwgW1wiTmF0aXZlQ3JlZGVudGlhbHNGYWNhZGVcIiwgXCJzZXRDcmVkZW50aWFsRW5jcnlwdGlvbk1vZGVcIiwgLi4uYXJnc10pXG5cdH1cblx0YXN5bmMgY2xlYXIoLi4uYXJnczogUGFyYW1ldGVyczxOYXRpdmVDcmVkZW50aWFsc0ZhY2FkZVtcImNsZWFyXCJdPikge1xuXHRcdHJldHVybiB0aGlzLnRyYW5zcG9ydC5pbnZva2VOYXRpdmUoXCJpcGNcIiwgW1wiTmF0aXZlQ3JlZGVudGlhbHNGYWNhZGVcIiwgXCJjbGVhclwiLCAuLi5hcmdzXSlcblx0fVxuXHRhc3luYyBtaWdyYXRlVG9OYXRpdmVDcmVkZW50aWFscyguLi5hcmdzOiBQYXJhbWV0ZXJzPE5hdGl2ZUNyZWRlbnRpYWxzRmFjYWRlW1wibWlncmF0ZVRvTmF0aXZlQ3JlZGVudGlhbHNcIl0+KSB7XG5cdFx0cmV0dXJuIHRoaXMudHJhbnNwb3J0Lmludm9rZU5hdGl2ZShcImlwY1wiLCBbXCJOYXRpdmVDcmVkZW50aWFsc0ZhY2FkZVwiLCBcIm1pZ3JhdGVUb05hdGl2ZUNyZWRlbnRpYWxzXCIsIC4uLmFyZ3NdKVxuXHR9XG59XG4iLCIvKiBnZW5lcmF0ZWQgZmlsZSwgZG9uJ3QgZWRpdC4gKi9cblxuaW1wb3J0IHsgTW9iaWxlUGF5bWVudHNGYWNhZGUgfSBmcm9tIFwiLi9Nb2JpbGVQYXltZW50c0ZhY2FkZS5qc1wiXG5cbmludGVyZmFjZSBOYXRpdmVJbnRlcmZhY2Uge1xuXHRpbnZva2VOYXRpdmUocmVxdWVzdFR5cGU6IHN0cmluZywgYXJnczogdW5rbm93bltdKTogUHJvbWlzZTxhbnk+XG59XG5leHBvcnQgY2xhc3MgTW9iaWxlUGF5bWVudHNGYWNhZGVTZW5kRGlzcGF0Y2hlciBpbXBsZW1lbnRzIE1vYmlsZVBheW1lbnRzRmFjYWRlIHtcblx0Y29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSB0cmFuc3BvcnQ6IE5hdGl2ZUludGVyZmFjZSkge31cblx0YXN5bmMgcmVxdWVzdFN1YnNjcmlwdGlvblRvUGxhbiguLi5hcmdzOiBQYXJhbWV0ZXJzPE1vYmlsZVBheW1lbnRzRmFjYWRlW1wicmVxdWVzdFN1YnNjcmlwdGlvblRvUGxhblwiXT4pIHtcblx0XHRyZXR1cm4gdGhpcy50cmFuc3BvcnQuaW52b2tlTmF0aXZlKFwiaXBjXCIsIFtcIk1vYmlsZVBheW1lbnRzRmFjYWRlXCIsIFwicmVxdWVzdFN1YnNjcmlwdGlvblRvUGxhblwiLCAuLi5hcmdzXSlcblx0fVxuXHRhc3luYyBnZXRQbGFuUHJpY2VzKC4uLmFyZ3M6IFBhcmFtZXRlcnM8TW9iaWxlUGF5bWVudHNGYWNhZGVbXCJnZXRQbGFuUHJpY2VzXCJdPikge1xuXHRcdHJldHVybiB0aGlzLnRyYW5zcG9ydC5pbnZva2VOYXRpdmUoXCJpcGNcIiwgW1wiTW9iaWxlUGF5bWVudHNGYWNhZGVcIiwgXCJnZXRQbGFuUHJpY2VzXCIsIC4uLmFyZ3NdKVxuXHR9XG5cdGFzeW5jIHNob3dTdWJzY3JpcHRpb25Db25maWdWaWV3KC4uLmFyZ3M6IFBhcmFtZXRlcnM8TW9iaWxlUGF5bWVudHNGYWNhZGVbXCJzaG93U3Vic2NyaXB0aW9uQ29uZmlnVmlld1wiXT4pIHtcblx0XHRyZXR1cm4gdGhpcy50cmFuc3BvcnQuaW52b2tlTmF0aXZlKFwiaXBjXCIsIFtcIk1vYmlsZVBheW1lbnRzRmFjYWRlXCIsIFwic2hvd1N1YnNjcmlwdGlvbkNvbmZpZ1ZpZXdcIiwgLi4uYXJnc10pXG5cdH1cblx0YXN5bmMgcXVlcnlBcHBTdG9yZVN1YnNjcmlwdGlvbk93bmVyc2hpcCguLi5hcmdzOiBQYXJhbWV0ZXJzPE1vYmlsZVBheW1lbnRzRmFjYWRlW1wicXVlcnlBcHBTdG9yZVN1YnNjcmlwdGlvbk93bmVyc2hpcFwiXT4pIHtcblx0XHRyZXR1cm4gdGhpcy50cmFuc3BvcnQuaW52b2tlTmF0aXZlKFwiaXBjXCIsIFtcIk1vYmlsZVBheW1lbnRzRmFjYWRlXCIsIFwicXVlcnlBcHBTdG9yZVN1YnNjcmlwdGlvbk93bmVyc2hpcFwiLCAuLi5hcmdzXSlcblx0fVxuXHRhc3luYyBpc0FwcFN0b3JlUmVuZXdhbEVuYWJsZWQoLi4uYXJnczogUGFyYW1ldGVyczxNb2JpbGVQYXltZW50c0ZhY2FkZVtcImlzQXBwU3RvcmVSZW5ld2FsRW5hYmxlZFwiXT4pIHtcblx0XHRyZXR1cm4gdGhpcy50cmFuc3BvcnQuaW52b2tlTmF0aXZlKFwiaXBjXCIsIFtcIk1vYmlsZVBheW1lbnRzRmFjYWRlXCIsIFwiaXNBcHBTdG9yZVJlbmV3YWxFbmFibGVkXCIsIC4uLmFyZ3NdKVxuXHR9XG59XG4iLCIvKiBnZW5lcmF0ZWQgZmlsZSwgZG9uJ3QgZWRpdC4gKi9cblxuaW1wb3J0IHsgRXh0ZXJuYWxDYWxlbmRhckZhY2FkZSB9IGZyb20gXCIuL0V4dGVybmFsQ2FsZW5kYXJGYWNhZGUuanNcIlxuXG5pbnRlcmZhY2UgTmF0aXZlSW50ZXJmYWNlIHtcblx0aW52b2tlTmF0aXZlKHJlcXVlc3RUeXBlOiBzdHJpbmcsIGFyZ3M6IHVua25vd25bXSk6IFByb21pc2U8YW55PlxufVxuZXhwb3J0IGNsYXNzIEV4dGVybmFsQ2FsZW5kYXJGYWNhZGVTZW5kRGlzcGF0Y2hlciBpbXBsZW1lbnRzIEV4dGVybmFsQ2FsZW5kYXJGYWNhZGUge1xuXHRjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IHRyYW5zcG9ydDogTmF0aXZlSW50ZXJmYWNlKSB7fVxuXHRhc3luYyBmZXRjaEV4dGVybmFsQ2FsZW5kYXIoLi4uYXJnczogUGFyYW1ldGVyczxFeHRlcm5hbENhbGVuZGFyRmFjYWRlW1wiZmV0Y2hFeHRlcm5hbENhbGVuZGFyXCJdPikge1xuXHRcdHJldHVybiB0aGlzLnRyYW5zcG9ydC5pbnZva2VOYXRpdmUoXCJpcGNcIiwgW1wiRXh0ZXJuYWxDYWxlbmRhckZhY2FkZVwiLCBcImZldGNoRXh0ZXJuYWxDYWxlbmRhclwiLCAuLi5hcmdzXSlcblx0fVxufVxuIiwiLyogZ2VuZXJhdGVkIGZpbGUsIGRvbid0IGVkaXQuICovXG5cbmltcG9ydCB7IE5hdGl2ZU1haWxJbXBvcnRGYWNhZGUgfSBmcm9tIFwiLi9OYXRpdmVNYWlsSW1wb3J0RmFjYWRlLmpzXCJcblxuaW50ZXJmYWNlIE5hdGl2ZUludGVyZmFjZSB7XG5cdGludm9rZU5hdGl2ZShyZXF1ZXN0VHlwZTogc3RyaW5nLCBhcmdzOiB1bmtub3duW10pOiBQcm9taXNlPGFueT5cbn1cbmV4cG9ydCBjbGFzcyBOYXRpdmVNYWlsSW1wb3J0RmFjYWRlU2VuZERpc3BhdGNoZXIgaW1wbGVtZW50cyBOYXRpdmVNYWlsSW1wb3J0RmFjYWRlIHtcblx0Y29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSB0cmFuc3BvcnQ6IE5hdGl2ZUludGVyZmFjZSkge31cblx0YXN5bmMgZ2V0UmVzdW1hYmxlSW1wb3J0KC4uLmFyZ3M6IFBhcmFtZXRlcnM8TmF0aXZlTWFpbEltcG9ydEZhY2FkZVtcImdldFJlc3VtYWJsZUltcG9ydFwiXT4pIHtcblx0XHRyZXR1cm4gdGhpcy50cmFuc3BvcnQuaW52b2tlTmF0aXZlKFwiaXBjXCIsIFtcIk5hdGl2ZU1haWxJbXBvcnRGYWNhZGVcIiwgXCJnZXRSZXN1bWFibGVJbXBvcnRcIiwgLi4uYXJnc10pXG5cdH1cblx0YXN5bmMgcHJlcGFyZU5ld0ltcG9ydCguLi5hcmdzOiBQYXJhbWV0ZXJzPE5hdGl2ZU1haWxJbXBvcnRGYWNhZGVbXCJwcmVwYXJlTmV3SW1wb3J0XCJdPikge1xuXHRcdHJldHVybiB0aGlzLnRyYW5zcG9ydC5pbnZva2VOYXRpdmUoXCJpcGNcIiwgW1wiTmF0aXZlTWFpbEltcG9ydEZhY2FkZVwiLCBcInByZXBhcmVOZXdJbXBvcnRcIiwgLi4uYXJnc10pXG5cdH1cblx0YXN5bmMgc2V0UHJvZ3Jlc3NBY3Rpb24oLi4uYXJnczogUGFyYW1ldGVyczxOYXRpdmVNYWlsSW1wb3J0RmFjYWRlW1wic2V0UHJvZ3Jlc3NBY3Rpb25cIl0+KSB7XG5cdFx0cmV0dXJuIHRoaXMudHJhbnNwb3J0Lmludm9rZU5hdGl2ZShcImlwY1wiLCBbXCJOYXRpdmVNYWlsSW1wb3J0RmFjYWRlXCIsIFwic2V0UHJvZ3Jlc3NBY3Rpb25cIiwgLi4uYXJnc10pXG5cdH1cblx0YXN5bmMgc2V0QXN5bmNFcnJvckhvb2soLi4uYXJnczogUGFyYW1ldGVyczxOYXRpdmVNYWlsSW1wb3J0RmFjYWRlW1wic2V0QXN5bmNFcnJvckhvb2tcIl0+KSB7XG5cdFx0cmV0dXJuIHRoaXMudHJhbnNwb3J0Lmludm9rZU5hdGl2ZShcImlwY1wiLCBbXCJOYXRpdmVNYWlsSW1wb3J0RmFjYWRlXCIsIFwic2V0QXN5bmNFcnJvckhvb2tcIiwgLi4uYXJnc10pXG5cdH1cbn1cbiIsImltcG9ydCB7IE5hdGl2ZUludGVyZmFjZU1haW4gfSBmcm9tIFwiLi9OYXRpdmVJbnRlcmZhY2VNYWluLmpzXCJcbmltcG9ydCB7IE5hdGl2ZVB1c2hTZXJ2aWNlQXBwIH0gZnJvbSBcIi4vTmF0aXZlUHVzaFNlcnZpY2VBcHAuanNcIlxuaW1wb3J0IHsgTmF0aXZlRmlsZUFwcCB9IGZyb20gXCIuLi9jb21tb24vRmlsZUFwcC5qc1wiXG5pbXBvcnQgeyBpc0Jyb3dzZXIsIGlzRWxlY3Ryb25DbGllbnQgfSBmcm9tIFwiLi4vLi4vYXBpL2NvbW1vbi9FbnYuanNcIlxuaW1wb3J0IHsgUHJvZ3JhbW1pbmdFcnJvciB9IGZyb20gXCIuLi8uLi9hcGkvY29tbW9uL2Vycm9yL1Byb2dyYW1taW5nRXJyb3IuanNcIlxuaW1wb3J0IHsgRGVza3RvcEZhY2FkZSB9IGZyb20gXCIuLi9jb21tb24vZ2VuZXJhdGVkaXBjL0Rlc2t0b3BGYWNhZGUuanNcIlxuaW1wb3J0IHsgQ29tbW9uTmF0aXZlRmFjYWRlIH0gZnJvbSBcIi4uL2NvbW1vbi9nZW5lcmF0ZWRpcGMvQ29tbW9uTmF0aXZlRmFjYWRlLmpzXCJcbmltcG9ydCB7IENyeXB0b0ZhY2FkZSB9IGZyb20gXCIuLi8uLi9hcGkvd29ya2VyL2NyeXB0by9DcnlwdG9GYWNhZGUuanNcIlxuaW1wb3J0IHsgRW50aXR5Q2xpZW50IH0gZnJvbSBcIi4uLy4uL2FwaS9jb21tb24vRW50aXR5Q2xpZW50LmpzXCJcbmltcG9ydCB7IGRldmljZUNvbmZpZyB9IGZyb20gXCIuLi8uLi9taXNjL0RldmljZUNvbmZpZy5qc1wiXG5pbXBvcnQgeyBDYWxlbmRhckZhY2FkZSB9IGZyb20gXCIuLi8uLi9hcGkvd29ya2VyL2ZhY2FkZXMvbGF6eS9DYWxlbmRhckZhY2FkZS5qc1wiXG5pbXBvcnQgeyBNb2JpbGVTeXN0ZW1GYWNhZGUgfSBmcm9tIFwiLi4vY29tbW9uL2dlbmVyYXRlZGlwYy9Nb2JpbGVTeXN0ZW1GYWNhZGUuanNcIlxuaW1wb3J0IHsgQ29tbW9uU3lzdGVtRmFjYWRlIH0gZnJvbSBcIi4uL2NvbW1vbi9nZW5lcmF0ZWRpcGMvQ29tbW9uU3lzdGVtRmFjYWRlLmpzXCJcbmltcG9ydCB7IFRoZW1lRmFjYWRlIH0gZnJvbSBcIi4uL2NvbW1vbi9nZW5lcmF0ZWRpcGMvVGhlbWVGYWNhZGUuanNcIlxuaW1wb3J0IHsgV2ViR2xvYmFsRGlzcGF0Y2hlciB9IGZyb20gXCIuLi9jb21tb24vZ2VuZXJhdGVkaXBjL1dlYkdsb2JhbERpc3BhdGNoZXIuanNcIlxuaW1wb3J0IHsgTmF0aXZlUHVzaEZhY2FkZVNlbmREaXNwYXRjaGVyIH0gZnJvbSBcIi4uL2NvbW1vbi9nZW5lcmF0ZWRpcGMvTmF0aXZlUHVzaEZhY2FkZVNlbmREaXNwYXRjaGVyLmpzXCJcbmltcG9ydCB7IEZpbGVGYWNhZGVTZW5kRGlzcGF0Y2hlciB9IGZyb20gXCIuLi9jb21tb24vZ2VuZXJhdGVkaXBjL0ZpbGVGYWNhZGVTZW5kRGlzcGF0Y2hlci5qc1wiXG5pbXBvcnQgeyBFeHBvcnRGYWNhZGVTZW5kRGlzcGF0Y2hlciB9IGZyb20gXCIuLi9jb21tb24vZ2VuZXJhdGVkaXBjL0V4cG9ydEZhY2FkZVNlbmREaXNwYXRjaGVyLmpzXCJcbmltcG9ydCB7IENvbW1vblN5c3RlbUZhY2FkZVNlbmREaXNwYXRjaGVyIH0gZnJvbSBcIi4uL2NvbW1vbi9nZW5lcmF0ZWRpcGMvQ29tbW9uU3lzdGVtRmFjYWRlU2VuZERpc3BhdGNoZXIuanNcIlxuaW1wb3J0IHsgTW9iaWxlU3lzdGVtRmFjYWRlU2VuZERpc3BhdGNoZXIgfSBmcm9tIFwiLi4vY29tbW9uL2dlbmVyYXRlZGlwYy9Nb2JpbGVTeXN0ZW1GYWNhZGVTZW5kRGlzcGF0Y2hlci5qc1wiXG5pbXBvcnQgeyBUaGVtZUZhY2FkZVNlbmREaXNwYXRjaGVyIH0gZnJvbSBcIi4uL2NvbW1vbi9nZW5lcmF0ZWRpcGMvVGhlbWVGYWNhZGVTZW5kRGlzcGF0Y2hlci5qc1wiXG5pbXBvcnQgeyBTZWFyY2hUZXh0SW5BcHBGYWNhZGVTZW5kRGlzcGF0Y2hlciB9IGZyb20gXCIuLi9jb21tb24vZ2VuZXJhdGVkaXBjL1NlYXJjaFRleHRJbkFwcEZhY2FkZVNlbmREaXNwYXRjaGVyLmpzXCJcbmltcG9ydCB7IFNldHRpbmdzRmFjYWRlU2VuZERpc3BhdGNoZXIgfSBmcm9tIFwiLi4vY29tbW9uL2dlbmVyYXRlZGlwYy9TZXR0aW5nc0ZhY2FkZVNlbmREaXNwYXRjaGVyLmpzXCJcbmltcG9ydCB7IERlc2t0b3BTeXN0ZW1GYWNhZGVTZW5kRGlzcGF0Y2hlciB9IGZyb20gXCIuLi9jb21tb24vZ2VuZXJhdGVkaXBjL0Rlc2t0b3BTeXN0ZW1GYWNhZGVTZW5kRGlzcGF0Y2hlci5qc1wiXG5pbXBvcnQgeyBTZWFyY2hUZXh0SW5BcHBGYWNhZGUgfSBmcm9tIFwiLi4vY29tbW9uL2dlbmVyYXRlZGlwYy9TZWFyY2hUZXh0SW5BcHBGYWNhZGUuanNcIlxuaW1wb3J0IHsgRGVza3RvcFN5c3RlbUZhY2FkZSB9IGZyb20gXCIuLi9jb21tb24vZ2VuZXJhdGVkaXBjL0Rlc2t0b3BTeXN0ZW1GYWNhZGUuanNcIlxuaW1wb3J0IHsgSW50ZXJXaW5kb3dFdmVudEZhY2FkZSB9IGZyb20gXCIuLi9jb21tb24vZ2VuZXJhdGVkaXBjL0ludGVyV2luZG93RXZlbnRGYWNhZGUuanNcIlxuaW1wb3J0IHsgSW50ZXJXaW5kb3dFdmVudEZhY2FkZVNlbmREaXNwYXRjaGVyIH0gZnJvbSBcIi4uL2NvbW1vbi9nZW5lcmF0ZWRpcGMvSW50ZXJXaW5kb3dFdmVudEZhY2FkZVNlbmREaXNwYXRjaGVyLmpzXCJcbmltcG9ydCB7IExvZ2luQ29udHJvbGxlciB9IGZyb20gXCIuLi8uLi9hcGkvbWFpbi9Mb2dpbkNvbnRyb2xsZXIuanNcIlxuaW1wb3J0IHsgTW9iaWxlQ29udGFjdHNGYWNhZGUgfSBmcm9tIFwiLi4vY29tbW9uL2dlbmVyYXRlZGlwYy9Nb2JpbGVDb250YWN0c0ZhY2FkZS5qc1wiXG5pbXBvcnQgeyBNb2JpbGVDb250YWN0c0ZhY2FkZVNlbmREaXNwYXRjaGVyIH0gZnJvbSBcIi4uL2NvbW1vbi9nZW5lcmF0ZWRpcGMvTW9iaWxlQ29udGFjdHNGYWNhZGVTZW5kRGlzcGF0Y2hlci5qc1wiXG5pbXBvcnQgeyBXZWJNb2JpbGVGYWNhZGUgfSBmcm9tIFwiLi9XZWJNb2JpbGVGYWNhZGUuanNcIlxuaW1wb3J0IHsgTmF0aXZlQ3JlZGVudGlhbHNGYWNhZGUgfSBmcm9tIFwiLi4vY29tbW9uL2dlbmVyYXRlZGlwYy9OYXRpdmVDcmVkZW50aWFsc0ZhY2FkZS5qc1wiXG5pbXBvcnQgeyBOYXRpdmVDcmVkZW50aWFsc0ZhY2FkZVNlbmREaXNwYXRjaGVyIH0gZnJvbSBcIi4uL2NvbW1vbi9nZW5lcmF0ZWRpcGMvTmF0aXZlQ3JlZGVudGlhbHNGYWNhZGVTZW5kRGlzcGF0Y2hlci5qc1wiXG5pbXBvcnQgeyBNb2JpbGVQYXltZW50c0ZhY2FkZSB9IGZyb20gXCIuLi9jb21tb24vZ2VuZXJhdGVkaXBjL01vYmlsZVBheW1lbnRzRmFjYWRlLmpzXCJcbmltcG9ydCB7IE1vYmlsZVBheW1lbnRzRmFjYWRlU2VuZERpc3BhdGNoZXIgfSBmcm9tIFwiLi4vY29tbW9uL2dlbmVyYXRlZGlwYy9Nb2JpbGVQYXltZW50c0ZhY2FkZVNlbmREaXNwYXRjaGVyLmpzXCJcblxuaW1wb3J0IHsgQXBwVHlwZSB9IGZyb20gXCIuLi8uLi9taXNjL0NsaWVudENvbnN0YW50cy5qc1wiXG5pbXBvcnQgeyBFeHRlcm5hbENhbGVuZGFyRmFjYWRlIH0gZnJvbSBcIi4uL2NvbW1vbi9nZW5lcmF0ZWRpcGMvRXh0ZXJuYWxDYWxlbmRhckZhY2FkZS5qc1wiXG5pbXBvcnQgeyBFeHRlcm5hbENhbGVuZGFyRmFjYWRlU2VuZERpc3BhdGNoZXIgfSBmcm9tIFwiLi4vY29tbW9uL2dlbmVyYXRlZGlwYy9FeHRlcm5hbENhbGVuZGFyRmFjYWRlU2VuZERpc3BhdGNoZXIuanNcIlxuaW1wb3J0IHsgTmF0aXZlTWFpbEltcG9ydEZhY2FkZVNlbmREaXNwYXRjaGVyIH0gZnJvbSBcIi4uL2NvbW1vbi9nZW5lcmF0ZWRpcGMvTmF0aXZlTWFpbEltcG9ydEZhY2FkZVNlbmREaXNwYXRjaGVyXCJcbmltcG9ydCB7IE5hdGl2ZU1haWxJbXBvcnRGYWNhZGUgfSBmcm9tIFwiLi4vY29tbW9uL2dlbmVyYXRlZGlwYy9OYXRpdmVNYWlsSW1wb3J0RmFjYWRlXCJcbmltcG9ydCB7IEV4cG9ydEZhY2FkZSB9IGZyb20gXCIuLi9jb21tb24vZ2VuZXJhdGVkaXBjL0V4cG9ydEZhY2FkZS5qc1wiXG5cbmV4cG9ydCB0eXBlIE5hdGl2ZUludGVyZmFjZXMgPSB7XG5cdG5hdGl2ZTogTmF0aXZlSW50ZXJmYWNlTWFpblxuXHRmaWxlQXBwOiBOYXRpdmVGaWxlQXBwXG5cdHB1c2hTZXJ2aWNlOiBOYXRpdmVQdXNoU2VydmljZUFwcFxuXHRtb2JpbGVTeXN0ZW1GYWNhZGU6IE1vYmlsZVN5c3RlbUZhY2FkZVxuXHRjb21tb25TeXN0ZW1GYWNhZGU6IENvbW1vblN5c3RlbUZhY2FkZVxuXHR0aGVtZUZhY2FkZTogVGhlbWVGYWNhZGVcblx0bW9iaWxlQ29udGFjdHNGYWNhZGU6IE1vYmlsZUNvbnRhY3RzRmFjYWRlXG5cdG5hdGl2ZUNyZWRlbnRpYWxzRmFjYWRlOiBOYXRpdmVDcmVkZW50aWFsc0ZhY2FkZVxuXHRtb2JpbGVQYXltZW50c0ZhY2FkZTogTW9iaWxlUGF5bWVudHNGYWNhZGVcblx0ZXh0ZXJuYWxDYWxlbmRhckZhY2FkZTogRXh0ZXJuYWxDYWxlbmRhckZhY2FkZVxufVxuXG5leHBvcnQgdHlwZSBEZXNrdG9wSW50ZXJmYWNlcyA9IHtcblx0c2VhcmNoVGV4dEZhY2FkZTogU2VhcmNoVGV4dEluQXBwRmFjYWRlXG5cdGRlc2t0b3BTZXR0aW5nc0ZhY2FkZTogU2V0dGluZ3NGYWNhZGVTZW5kRGlzcGF0Y2hlclxuXHRkZXNrdG9wU3lzdGVtRmFjYWRlOiBEZXNrdG9wU3lzdGVtRmFjYWRlXG5cdG5hdGl2ZU1haWxJbXBvcnRGYWNhZGU6IE5hdGl2ZU1haWxJbXBvcnRGYWNhZGVcblx0aW50ZXJXaW5kb3dFdmVudFNlbmRlcjogSW50ZXJXaW5kb3dFdmVudEZhY2FkZVNlbmREaXNwYXRjaGVyXG5cdGV4cG9ydEZhY2FkZTogRXhwb3J0RmFjYWRlXG59XG5cbi8qKlxuICogQHJldHVybnMgTmF0aXZlSW50ZXJmYWNlc1xuICogQHRocm93cyBQcm9ncmFtbWluZ0Vycm9yIHdoZW4geW91IHRyeSB0byBjYWxsIHRoaXMgaW4gdGhlIHdlYiBicm93c2VyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVOYXRpdmVJbnRlcmZhY2VzKFxuXHRtb2JpbGVGYWNhZGU6IFdlYk1vYmlsZUZhY2FkZSxcblx0ZGVza3RvcEZhY2FkZTogRGVza3RvcEZhY2FkZSxcblx0aW50ZXJXaW5kb3dFdmVudEZhY2FkZTogSW50ZXJXaW5kb3dFdmVudEZhY2FkZSxcblx0Y29tbW9uTmF0aXZlRmFjYWRlOiBDb21tb25OYXRpdmVGYWNhZGUsXG5cdGNyeXB0b0ZhY2FkZTogQ3J5cHRvRmFjYWRlLFxuXHRjYWxlbmRhckZhY2FkZTogQ2FsZW5kYXJGYWNhZGUsXG5cdGVudGl0eUNsaWVudDogRW50aXR5Q2xpZW50LFxuXHRsb2dpbnM6IExvZ2luQ29udHJvbGxlcixcblx0YXBwOiBBcHBUeXBlLFxuKTogTmF0aXZlSW50ZXJmYWNlcyB7XG5cdGlmIChpc0Jyb3dzZXIoKSkge1xuXHRcdHRocm93IG5ldyBQcm9ncmFtbWluZ0Vycm9yKFwiVHJpZWQgdG8gbWFrZSBuYXRpdmUgaW50ZXJmYWNlcyBpbiBub24tbmF0aXZlXCIpXG5cdH1cblxuXHRjb25zdCBkaXNwYXRjaGVyID0gbmV3IFdlYkdsb2JhbERpc3BhdGNoZXIoY29tbW9uTmF0aXZlRmFjYWRlLCBkZXNrdG9wRmFjYWRlLCBpbnRlcldpbmRvd0V2ZW50RmFjYWRlLCBtb2JpbGVGYWNhZGUpXG5cdGNvbnN0IG5hdGl2ZSA9IG5ldyBOYXRpdmVJbnRlcmZhY2VNYWluKGRpc3BhdGNoZXIpXG5cdGNvbnN0IG5hdGl2ZVB1c2hGYWNhZGVTZW5kRGlzcGF0Y2hlciA9IG5ldyBOYXRpdmVQdXNoRmFjYWRlU2VuZERpc3BhdGNoZXIobmF0aXZlKVxuXHRjb25zdCBwdXNoU2VydmljZSA9IG5ldyBOYXRpdmVQdXNoU2VydmljZUFwcChuYXRpdmVQdXNoRmFjYWRlU2VuZERpc3BhdGNoZXIsIGxvZ2lucywgY3J5cHRvRmFjYWRlLCBlbnRpdHlDbGllbnQsIGRldmljZUNvbmZpZywgY2FsZW5kYXJGYWNhZGUsIGFwcClcblx0Y29uc3QgZmlsZUFwcCA9IG5ldyBOYXRpdmVGaWxlQXBwKG5ldyBGaWxlRmFjYWRlU2VuZERpc3BhdGNoZXIobmF0aXZlKSwgbmV3IEV4cG9ydEZhY2FkZVNlbmREaXNwYXRjaGVyKG5hdGl2ZSkpXG5cdGNvbnN0IGNvbW1vblN5c3RlbUZhY2FkZSA9IG5ldyBDb21tb25TeXN0ZW1GYWNhZGVTZW5kRGlzcGF0Y2hlcihuYXRpdmUpXG5cdGNvbnN0IG1vYmlsZVN5c3RlbUZhY2FkZSA9IG5ldyBNb2JpbGVTeXN0ZW1GYWNhZGVTZW5kRGlzcGF0Y2hlcihuYXRpdmUpXG5cdGNvbnN0IHRoZW1lRmFjYWRlID0gbmV3IFRoZW1lRmFjYWRlU2VuZERpc3BhdGNoZXIobmF0aXZlKVxuXHRjb25zdCBtb2JpbGVDb250YWN0c0ZhY2FkZSA9IG5ldyBNb2JpbGVDb250YWN0c0ZhY2FkZVNlbmREaXNwYXRjaGVyKG5hdGl2ZSlcblx0Y29uc3QgbmF0aXZlQ3JlZGVudGlhbHNGYWNhZGUgPSBuZXcgTmF0aXZlQ3JlZGVudGlhbHNGYWNhZGVTZW5kRGlzcGF0Y2hlcihuYXRpdmUpXG5cdGNvbnN0IG1vYmlsZVBheW1lbnRzRmFjYWRlID0gbmV3IE1vYmlsZVBheW1lbnRzRmFjYWRlU2VuZERpc3BhdGNoZXIobmF0aXZlKVxuXHRjb25zdCBleHRlcm5hbENhbGVuZGFyRmFjYWRlID0gbmV3IEV4dGVybmFsQ2FsZW5kYXJGYWNhZGVTZW5kRGlzcGF0Y2hlcihuYXRpdmUpXG5cblx0cmV0dXJuIHtcblx0XHRuYXRpdmUsXG5cdFx0ZmlsZUFwcCxcblx0XHRwdXNoU2VydmljZSxcblx0XHRtb2JpbGVTeXN0ZW1GYWNhZGUsXG5cdFx0Y29tbW9uU3lzdGVtRmFjYWRlLFxuXHRcdHRoZW1lRmFjYWRlLFxuXHRcdG1vYmlsZUNvbnRhY3RzRmFjYWRlLFxuXHRcdG5hdGl2ZUNyZWRlbnRpYWxzRmFjYWRlLFxuXHRcdG1vYmlsZVBheW1lbnRzRmFjYWRlLFxuXHRcdGV4dGVybmFsQ2FsZW5kYXJGYWNhZGUsXG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZURlc2t0b3BJbnRlcmZhY2VzKG5hdGl2ZTogTmF0aXZlSW50ZXJmYWNlTWFpbik6IERlc2t0b3BJbnRlcmZhY2VzIHtcblx0aWYgKCFpc0VsZWN0cm9uQ2xpZW50KCkpIHtcblx0XHR0aHJvdyBuZXcgUHJvZ3JhbW1pbmdFcnJvcihcInRyaWVkIHRvIGNyZWF0ZSBkZXNrdG9wIGludGVyZmFjZXMgaW4gbm9uLWVsZWN0cm9uIGNsaWVudFwiKVxuXHR9XG5cdHJldHVybiB7XG5cdFx0c2VhcmNoVGV4dEZhY2FkZTogbmV3IFNlYXJjaFRleHRJbkFwcEZhY2FkZVNlbmREaXNwYXRjaGVyKG5hdGl2ZSksXG5cdFx0ZGVza3RvcFNldHRpbmdzRmFjYWRlOiBuZXcgU2V0dGluZ3NGYWNhZGVTZW5kRGlzcGF0Y2hlcihuYXRpdmUpLFxuXHRcdGRlc2t0b3BTeXN0ZW1GYWNhZGU6IG5ldyBEZXNrdG9wU3lzdGVtRmFjYWRlU2VuZERpc3BhdGNoZXIobmF0aXZlKSxcblx0XHRuYXRpdmVNYWlsSW1wb3J0RmFjYWRlOiBuZXcgTmF0aXZlTWFpbEltcG9ydEZhY2FkZVNlbmREaXNwYXRjaGVyKG5hdGl2ZSksXG5cdFx0aW50ZXJXaW5kb3dFdmVudFNlbmRlcjogbmV3IEludGVyV2luZG93RXZlbnRGYWNhZGVTZW5kRGlzcGF0Y2hlcihuYXRpdmUpLFxuXHRcdGV4cG9ydEZhY2FkZTogbmV3IEV4cG9ydEZhY2FkZVNlbmREaXNwYXRjaGVyKG5hdGl2ZSksXG5cdH1cbn1cbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFLQSxrQkFBa0I7SUFRTCxxQkFBTixNQUFnRjtDQUN0RixBQUFRLGlCQUEwQztDQUVsRCxZQUE2QkEsVUFBZ0I7RUEwQjdDLEtBMUI2QjtBQUM1QixPQUFLLE9BQU8sTUFBTSxZQUFZO0NBQzlCO0NBRUQsWUFBWUMsU0FBd0I7RUFDbkMsTUFBTSxVQUFVLG9CQUFvQixRQUFRO0FBRTVDLE9BQUssT0FBTyxPQUFPLGdCQUFnQixVQUFVLFlBQVksUUFBUTtDQUNqRTtDQUVELGtCQUFrQkMsU0FBaUM7QUFDbEQsT0FBSyxpQkFBaUI7Q0FDdEI7Q0FFRCxzQkFBc0JDLE9BQXFCO0VBQzFDLE1BQU0sVUFBVSxLQUFLO0FBRXJCLE1BQUksU0FBUztHQUNaLE1BQU0sTUFBTSx1QkFBdUIsbUJBQW1CLE1BQU0sQ0FBQztHQUM3RCxNQUFNLFNBQVMsb0JBQW9CLElBQUk7QUFDdkMsV0FBUSxPQUFPO0VBQ2YsTUFDQSxTQUFRLEtBQUssNkNBQTZDO0NBRTNEO0FBQ0Q7Ozs7QUNwQ0Qsa0JBQWtCO0lBT0wseUJBQU4sTUFBb0Y7Q0FDMUYsQUFBUSxpQkFBMEM7Q0FDbEQsQUFBUSxlQUE0QyxPQUFPO0NBRTNELFlBQTZCQyxVQUFnQjtFQXlDN0MsS0F6QzZCO0NBQWtCOzs7O0NBSy9DLFFBQVE7QUFHUCxPQUFLLE9BQU8sWUFBWSxDQUFDQyxZQUEwQjtHQUVsRCxNQUFNLE9BQU8sUUFBUSxNQUFNO0FBRTNCLFFBQUssWUFBWSxDQUFDQyxpQkFBK0I7SUFDaEQsTUFBTSxVQUFVLEtBQUs7QUFFckIsUUFBSSxTQUFTO0tB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
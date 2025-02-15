import { __toESM } from "./chunk-chunk.js";
import { ProgrammingError } from "./ProgrammingError-chunk.js";
import { assertMainOrNode, isApp, isDesktop, isOfflineStorageAvailable } from "./Env-chunk.js";
import { DeviceType, client } from "./ClientDetector-chunk.js";
import { mithril_default } from "./mithril-chunk.js";
import { defer, first, mapNullable, noOp, ofClass } from "./dist2-chunk.js";
import { getWhitelabelCustomizations } from "./WhitelabelCustomizations-chunk.js";
import { InfoLink, lang } from "./LanguageViewModel-chunk.js";
import { styles } from "./styles-chunk.js";
import { ApprovalStatus, AvailablePlans, Keys, NewBusinessPlans, NewPaidPlans, NewPersonalPlans, SubscriptionType, getCustomerApprovalStatus } from "./TutanotaConstants-chunk.js";
import { useKeyHandler } from "./KeyManager-chunk.js";
import { windowFacade } from "./WindowFacade-chunk.js";
import { generatedIdToTimestamp } from "./EntityUtils-chunk.js";
import { require_stream } from "./stream-chunk.js";
import { CredentialAuthenticationError, KeyPermanentlyInvalidatedError, isOfflineError } from "./ErrorUtils-chunk.js";
import { AccessBlockedError, AccessDeactivatedError, AccessExpiredError, BadRequestError, ConnectionError, NotAuthenticatedError, NotAuthorizedError, NotFoundError, TooManyRequestsError } from "./RestError-chunk.js";
import { CancelledError } from "./CancelledError-chunk.js";
import { DeviceStorageUnavailableError } from "./DeviceStorageUnavailableError-chunk.js";
import { SessionType } from "./SessionType-chunk.js";
import { Button, ButtonType } from "./Button-chunk.js";
import { Autocomplete, Dialog, TextField, TextFieldType, createAsyncDropdown, createDropdown } from "./Dialog-chunk.js";
import { BootIcons } from "./Icon-chunk.js";
import { AriaLandmarks, landmarkAttrs, liveDataAttrs } from "./AriaUtils-chunk.js";
import { IconButton } from "./IconButton-chunk.js";
import { locator } from "./CommonLocator-chunk.js";
import { UserError } from "./UserError-chunk.js";
import { showProgressDialog } from "./ProgressDialog-chunk.js";
import { ExternalLink } from "./ExternalLink-chunk.js";
import { showSnackBar } from "./SnackBar-chunk.js";
import { credentialsToUnencrypted } from "./Credentials-chunk.js";
import { Checkbox } from "./Checkbox-chunk.js";
import { copyToClipboard } from "./ClipboardUtils-chunk.js";
import { clientInfoString } from "./ErrorReporter-chunk.js";
import { PasswordField } from "./PasswordField-chunk.js";
import { showUserError } from "./ErrorHandlerImpl-chunk.js";
import { BaseTopLevelView, LoginScreenHeader } from "./LoginScreenHeader-chunk.js";
import { LoginButton } from "./LoginButton-chunk.js";

//#region src/common/login/LoginForm.ts
var import_stream$1 = __toESM(require_stream(), 1);
var LoginForm = class {
	mailAddressTextField;
	passwordTextField;
	autofillUpdateHandler;
	oncreate(vnode) {
		const a = vnode.attrs;
		this.autofillUpdateHandler = import_stream$1.default.combine(() => {
			requestAnimationFrame(() => {
				const oldAddress = a.mailAddress();
				const newAddress = this.mailAddressTextField.value;
				const oldPassword = a.password();
				const newPassword = this.passwordTextField.value;
				if (oldAddress !== newAddress && newAddress != "") a.mailAddress(newAddress);
				if (oldPassword !== newPassword && newPassword != "") a.password(newPassword);
			});
		}, [a.mailAddress, a.password]);
	}
	onremove(vnode) {
		vnode.attrs.password("");
		this.autofillUpdateHandler.end(true);
		this.passwordTextField.value = "";
	}
	view(vnode) {
		const a = vnode.attrs;
		const canSaveCredentials = client.localStorage();
		if (a.savePassword && (isApp() || isDesktop())) a.savePassword(true);
		return mithril_default("form", { onsubmit: (e) => {
			e.preventDefault();
		} }, [
			mithril_default("", mithril_default(TextField, {
				label: "mailAddress_label",
				value: a.mailAddress(),
				oninput: a.mailAddress,
				type: TextFieldType.Email,
				autocompleteAs: Autocomplete.email,
				onDomInputCreated: (dom) => {
					this.mailAddressTextField = dom;
					if (!client.isMobileDevice()) dom.focus();
				},
				keyHandler: (key) => {
					if (key.key != null && key.key.toLowerCase() === Keys.RETURN.code) {
						a.onSubmit(a.mailAddress(), a.password());
						return false;
					}
					return true;
				}
			})),
			mithril_default("", mithril_default(PasswordField, {
				value: a.password(),
				oninput: a.password,
				autocompleteAs: Autocomplete.currentPassword,
				onDomInputCreated: (dom) => this.passwordTextField = dom,
				keyHandler: (key) => {
					if (key.key != null && key.key.toLowerCase() === Keys.RETURN.code) {
						a.onSubmit(a.mailAddress(), a.password());
						return false;
					}
					return true;
				}
			})),
			a.savePassword ? isApp() || isDesktop() ? mithril_default("small.block.content-fg", lang.get("dataWillBeStored_msg")) : mithril_default("", { onkeydown: (e) => {
				useKeyHandler(e, (key) => {
					if (key.key != null && key.key.toLowerCase() === Keys.RETURN.code) {
						a.onSubmit(a.mailAddress(), a.password());
						e.preventDefault();
						return false;
					}
					return false;
				});
			} }, mithril_default(Checkbox, {
				label: () => lang.get("storePassword_action"),
				checked: a.savePassword(),
				onChecked: a.savePassword,
				helpLabel: canSaveCredentials ? lang.makeTranslation("onlyPrivateComputer_msg", lang.get("onlyPrivateComputer_msg") + (isOfflineStorageAvailable() ? "\n" + lang.get("dataWillBeStored_msg") : "")) : "functionNotSupported_msg",
				disabled: !canSaveCredentials
			})) : null,
			mithril_default(".pt", mithril_default(LoginButton, {
				label: isApp() || isDesktop() ? "addAccount_action" : "login_action",
				onclick: () => a.onSubmit(a.mailAddress(), a.password())
			})),
			mithril_default("p.center.statusTextColor.mt-s", { style: { marginBottom: 0 } }, mithril_default("small", liveDataAttrs(), [
				a.helpText ? a.helpText : null,
				" ",
				a.invalidCredentials && a.showRecoveryOption ? mithril_default("a", {
					href: "/recover",
					onclick: (e) => {
						mithril_default.route.set("/recover", {
							mailAddress: a.mailAddress(),
							resetAction: "password"
						});
						e.preventDefault();
					}
				}, lang.get("recoverAccountAccess_action")) : a.accessExpired && a.accessExpired ? mithril_default("a", {
					href: "#",
					onclick: (e) => {
						import("./TakeOverDeletedAddressDialog-chunk.js").then(({ showTakeOverDialog }) => showTakeOverDialog(a.mailAddress(), a.password()));
						e.preventDefault();
					}
				}, lang.get("help_label")) : null
			]))
		]);
	}
};

//#endregion
//#region src/common/login/CredentialsSelector.ts
var CredentialsSelector = class {
	view(vnode) {
		const a = vnode.attrs;
		return a.credentials.map((c) => {
			const buttons = [];
			const onCredentialsDeleted = a.onCredentialsDeleted;
			buttons.push(mithril_default(LoginButton, {
				label: lang.makeTranslation("login_label", c.login),
				onclick: () => a.onCredentialsSelected(c)
			}));
			if (onCredentialsDeleted) buttons.push(mithril_default(Button, {
				label: "delete_action",
				click: () => onCredentialsDeleted(c),
				type: ButtonType.Secondary
			}));
			return mithril_default(".flex-space-between.pt.child-grow.last-child-fixed", buttons);
		});
	}
};

//#endregion
//#region src/common/gui/RenderLoginInfoLinks.ts
function renderInfoLinks() {
	const privacyPolicyLink = getPrivacyStatementLink();
	const imprintLink = getImprintLink();
	return mithril_default(".flex.col.mt-l", mithril_default(".flex.wrap.justify-center", !isApp() && privacyPolicyLink ? mithril_default(ExternalLink, {
		href: privacyPolicyLink,
		text: lang.get("privacyLink_label"),
		class: "plr",
		isCompanySite: true,
		specialType: "privacy-policy"
	}) : null, !isApp() && imprintLink ? mithril_default(ExternalLink, {
		href: imprintLink,
		text: lang.get("imprint_label"),
		class: "plr",
		isCompanySite: true,
		specialType: "license"
	}) : null), mithril_default(".mt.mb.center.small.full-width", { onclick: (e) => showVersionDropdown(e) }, `v${env.versionNumber}`));
}
function getImprintLink() {
	return mapNullable(getWhitelabelCustomizations(window), (c) => c.imprintUrl) || InfoLink.About;
}
function getPrivacyStatementLink() {
	return mapNullable(getWhitelabelCustomizations(window), (c) => c.privacyStatementUrl) || InfoLink.Privacy;
}
/**
* Show a simple dialog with client info and all the logs inside of it.
*/
function showVersionDropdown(e) {
	createDropdown({ lazyButtons: () => [{
		label: "getLogs_action",
		click: () => showLogsDialog()
	}] })(e, e.target);
}
async function showLogsDialog() {
	const logContent = await prepareLogContent();
	const dialog = Dialog.editDialog({
		middle: lang.makeTranslation("logs", "Logs"),
		right: () => [{
			type: ButtonType.Secondary,
			label: "copy_action",
			click: () => copyToClipboard(logContent)
		}, {
			type: ButtonType.Primary,
			label: "ok_action",
			click: () => dialog.close()
		}]
	}, class {
		view() {
			return mithril_default(".fill-absolute.selectable.scroll.white-space-pre.plr.pt.pb", logContent);
		}
	}, {});
	dialog.show();
}
async function prepareLogContent() {
	const entries = [];
	if (window.logger) entries.push(`== MAIN LOG ==
${window.logger.getEntries().join("\n")}
`);
	const workerLog = await locator.workerFacade.getLog();
	if (workerLog.length > 0) entries.push(`== WORKER LOG ==
${workerLog.join("\n")}
`);
	if (isDesktop() || isApp()) entries.push(`== NATIVE LOG ==
${await locator.commonSystemFacade.getLog()}
`);
	let { message, type, client: client$1 } = clientInfoString(new Date(), false);
	return `v${env.versionNumber} - ${client$1}
${message}

${entries.join("\n")}`;
}

//#endregion
//#region src/common/login/LoginView.ts
assertMainOrNode();
/** create a string provider that changes periodically until promise is resolved */
function makeDynamicLoggingInMessage(promise) {
	const messageArray = [
		"dynamicLoginDecryptingMails_msg",
		"dynamicLoginOrganizingCalendarEvents_msg",
		"dynamicLoginSortingContacts_msg",
		"dynamicLoginUpdatingOfflineDatabase_msg",
		"dynamicLoginCyclingToWork_msg",
		"dynamicLoginRestockingTutaFridge_msg",
		"dynamicLoginPreparingRocketLaunch_msg",
		"dynamicLoginSwitchingOnPrivacy_msg"
	];
	let currentMessage = "login_msg";
	let messageIndex = 0;
	const messageIntervalId = setInterval(
		() => {
			currentMessage = messageArray[messageIndex];
			messageIndex = ++messageIndex % 8;
			mithril_default.redraw();
		},
		4e3
		/** spinner spins every 2s */
);
	promise.finally(() => clearInterval(messageIntervalId));
	return () => currentMessage;
}
var LoginView = class extends BaseTopLevelView {
	viewModel;
	defaultRedirect;
	initPromise;
	moreExpanded;
	loginForm;
	selectedRedirect;
	bottomMargin = 0;
	constructor({ attrs }) {
		super();
		this.defaultRedirect = attrs.targetPath;
		this.selectedRedirect = this.defaultRedirect;
		this.loginForm = defer();
		this.moreExpanded = false;
		this.viewModel = attrs.makeViewModel();
		this.initPromise = this.viewModel.init().then(mithril_default.redraw);
	}
	keyboardListener = (keyboardSize) => {
		this.bottomMargin = keyboardSize;
		mithril_default.redraw();
	};
	view({ attrs }) {
		return mithril_default("#login-view.main-view.flex.col.nav-bg", {
			oncreate: () => windowFacade.addKeyboardSizeListener(this.keyboardListener),
			onremove: () => windowFacade.removeKeyboardSizeListener(this.keyboardListener),
			style: { marginBottom: this.bottomMargin + "px" }
		}, [mithril_default(LoginScreenHeader), mithril_default(".flex-grow.flex-center.scroll", mithril_default(".flex.col.flex-grow-shrink-auto.max-width-m.plr-l." + (styles.isSingleColumnLayout() ? "pt" : "pt-l"), {
			...landmarkAttrs(AriaLandmarks.Main, isApp() || isDesktop() ? lang.get("addAccount_action") : lang.get("login_label")),
			oncreate: (vnode) => {
				vnode.dom.focus();
			}
		}, [
			mithril_default(".content-bg.border-radius-big.pb", { class: styles.isSingleColumnLayout() ? "plr-l" : "plr-2l" }, this._renderFormForDisplayMode(), this.renderMoreOptions()),
			mithril_default(".flex-grow"),
			!(isApp() || isDesktop()) && this.viewModel.shouldShowAppButtons() ? this._renderAppButtons() : null,
			renderInfoLinks()
		]))]);
	}
	_renderFormForDisplayMode() {
		switch (this.viewModel.displayMode) {
			case DisplayMode.DeleteCredentials:
			case DisplayMode.Credentials: return this._renderCredentialsSelector();
			case DisplayMode.Form: return this._renderLoginForm();
		}
	}
	renderMoreOptions() {
		return mithril_default(".flex-center.flex-column", [
			this._loginAnotherLinkVisible() ? mithril_default(Button, {
				label: "loginOtherAccount_action",
				type: ButtonType.Secondary,
				click: () => {
					this.viewModel.showLoginForm();
				}
			}) : null,
			this._deleteCredentialsLinkVisible() ? mithril_default(Button, {
				label: this.viewModel.displayMode === DisplayMode.DeleteCredentials ? "cancel_action" : "removeAccount_action",
				type: ButtonType.Secondary,
				click: () => this._switchDeleteCredentialsState()
			}) : null,
			this._knownCredentialsLinkVisible() ? mithril_default(Button, {
				label: "knownCredentials_label",
				type: ButtonType.Secondary,
				click: () => this.viewModel.showCredentials()
			}) : null,
			this._signupLinkVisible() ? mithril_default(Button, {
				label: "register_label",
				type: ButtonType.Secondary,
				click: () => mithril_default.route.set("/signup")
			}) : null,
			this._switchThemeLinkVisible() ? mithril_default(Button, {
				label: "switchColorTheme_action",
				type: ButtonType.Secondary,
				click: this.themeSwitchListener()
			}) : null,
			this._recoverLoginVisible() ? mithril_default(Button, {
				label: "recoverAccountAccess_action",
				click: () => {
					mithril_default.route.set("/recover");
				},
				type: ButtonType.Secondary
			}) : null
		]);
	}
	themeSwitchListener() {
		return createAsyncDropdown({
			lazyButtons: async () => {
				const defaultButtons = [
					{
						label: "systemThemePref_label",
						click: () => locator.themeController.setThemePreference("auto:light|dark")
					},
					{
						label: "light_label",
						click: () => locator.themeController.setThemePreference("light")
					},
					{
						label: "dark_label",
						click: () => locator.themeController.setThemePreference("dark")
					},
					{
						label: client.isCalendarApp() ? "light_red_label" : "light_blue_label",
						click: () => locator.themeController.setThemePreference("light_secondary")
					},
					{
						label: client.isCalendarApp() ? "dark_red_label" : "dark_blue_label",
						click: () => locator.themeController.setThemePreference("dark_secondary")
					}
				];
				const customButtons = (await locator.themeController.getCustomThemes()).map((themeId) => {
					return {
						label: lang.makeTranslation(themeId, themeId),
						click: () => locator.themeController.setThemePreference(themeId)
					};
				});
				return defaultButtons.concat(customButtons);
			},
			width: 300
		});
	}
	_signupLinkVisible() {
		return this.viewModel.displayMode === DisplayMode.Form && this.viewModel.shouldShowSignup();
	}
	_loginAnotherLinkVisible() {
		return this.viewModel.displayMode === DisplayMode.Credentials || this.viewModel.displayMode === DisplayMode.DeleteCredentials;
	}
	_deleteCredentialsLinkVisible() {
		return this.viewModel.displayMode === DisplayMode.Credentials || this.viewModel.displayMode === DisplayMode.DeleteCredentials;
	}
	_knownCredentialsLinkVisible() {
		return this.viewModel.displayMode === DisplayMode.Form && this.viewModel.getSavedCredentials().length > 0;
	}
	_switchThemeLinkVisible() {
		return locator.themeController.shouldAllowChangingTheme();
	}
	_recoverLoginVisible() {
		return this.viewModel.shouldShowRecover();
	}
	_renderLoginForm() {
		return mithril_default(".flex.col.pb", [mithril_default(LoginForm, {
			oncreate: (vnode) => {
				const form = vnode;
				this.loginForm.resolve(form.state);
			},
			onremove: () => {
				this.loginForm = defer();
			},
			onSubmit: () => this._loginWithProgressDialog(),
			mailAddress: this.viewModel.mailAddress,
			password: this.viewModel.password,
			savePassword: this.viewModel.savePassword,
			helpText: lang.getTranslationText(this.viewModel.helpText),
			invalidCredentials: this.viewModel.state === LoginState.InvalidCredentials,
			showRecoveryOption: this._recoverLoginVisible(),
			accessExpired: this.viewModel.state === LoginState.AccessExpired
		})]);
	}
	async _loginWithProgressDialog() {
		const loginPromise = this.viewModel.login();
		const dynamicMessage = makeDynamicLoggingInMessage(loginPromise);
		await showProgressDialog(dynamicMessage, loginPromise);
		if (this.viewModel.state === LoginState.LoggedIn) mithril_default.route.set(this.selectedRedirect);
	}
	_renderCredentialsSelector() {
		return mithril_default(".flex.col.pb-l", [mithril_default(".small.center.statusTextColor", {
			...liveDataAttrs(),
			class: styles.isSingleColumnLayout() ? "" : "pt-xs"
		}, lang.getTranslationText(this.viewModel.helpText)), mithril_default(CredentialsSelector, {
			credentials: this.viewModel.getSavedCredentials(),
			onCredentialsSelected: async (c) => {
				await this.viewModel.useCredentials(c);
				await this._loginWithProgressDialog();
			},
			onCredentialsDeleted: this.viewModel.displayMode === DisplayMode.DeleteCredentials ? (credentials) => {
				this.viewModel.deleteCredentials(credentials).then((result) => {
					if (result == "networkError") showSnackBar({
						message: "deleteCredentialOffline_msg",
						button: {
							label: "ok_action",
							click: () => {}
						}
					});
					mithril_default.redraw();
				});
			} : null
		})]);
	}
	_renderAppButtons() {
		return mithril_default(".flex-center.pt-l.ml-between-s", [
			client.isDesktopDevice() || client.device === DeviceType.ANDROID ? mithril_default(IconButton, {
				title: "appInfoAndroidImageAlt_alt",
				click: (e) => {
					this._openUrl("https://play.google.com/store/apps/details?id=de.tutao.tutanota");
					e.preventDefault();
				},
				icon: BootIcons.Android
			}) : null,
			client.isDesktopDevice() || client.device === DeviceType.IPAD || client.device === DeviceType.IPHONE ? mithril_default(IconButton, {
				title: "appInfoIosImageAlt_alt",
				click: (e) => {
					this._openUrl("https://itunes.apple.com/app/tutanota/id922429609?mt=8&uo=4&at=10lSfb");
					e.preventDefault();
				},
				icon: BootIcons.Apple
			}) : null,
			client.isDesktopDevice() || client.device === DeviceType.ANDROID ? mithril_default(IconButton, {
				title: "appInfoFDroidImageAlt_alt",
				click: (e) => {
					this._openUrl("https://f-droid.org/packages/de.tutao.tutanota/");
					e.preventDefault();
				},
				icon: BootIcons.FDroid
			}) : null
		]);
	}
	onNewUrl(args, requestedPath) {
		if (args.requestedPath) this.selectedRedirect = args.requestedPath;
else if (args.action) this.selectedRedirect = `/mail?action=${args.action}`;
else this.selectedRedirect = this.defaultRedirect;
		this.handleLoginArguments(args, requestedPath);
	}
	async handleLoginArguments(args, requestedPath) {
		await this.initPromise;
		if (mithril_default.route.get() !== requestedPath) return;
		const autoLogin = args.noAutoLogin == null || args.noAutoLogin === false;
		if (autoLogin) {
			if (args.userId) await this.viewModel.useUserId(args.userId);
			if (this.viewModel.canLogin()) {
				this._loginWithProgressDialog();
				mithril_default.redraw();
				return;
			}
		}
		if (args.loginWith) this.viewModel.showLoginForm();
		if (args.loginWith) this.loginForm.promise.then((loginForm) => {
			loginForm.mailAddressTextField.value = "";
			loginForm.passwordTextField.value = "";
			this.viewModel.mailAddress(args.loginWith ?? "");
			this.viewModel.password("");
			loginForm.passwordTextField.focus();
		});
		mithril_default.redraw();
	}
	_openUrl(url) {
		window.open(url, "_blank");
	}
	_switchDeleteCredentialsState() {
		this.viewModel.switchDeleteState();
	}
};
function getWhitelabelRegistrationDomains() {
	return mapNullable(getWhitelabelCustomizations(window), (c) => c.registrationDomains) || [];
}

//#endregion
//#region src/common/login/LoginViewModel.ts
var import_stream = __toESM(require_stream(), 1);
assertMainOrNode();
let DisplayMode = function(DisplayMode$1) {
	DisplayMode$1["Credentials"] = "credentials";
	DisplayMode$1["Form"] = "form";
	DisplayMode$1["DeleteCredentials"] = "deleteCredentials";
	return DisplayMode$1;
}({});
let LoginState = function(LoginState$1) {
	LoginState$1["LoggingIn"] = "LoggingIn";
	LoginState$1["UnknownError"] = "UnknownError";
	LoginState$1["InvalidCredentials"] = "InvalidCredentials";
	LoginState$1["AccessExpired"] = "AccessExpired";
	LoginState$1["NotAuthenticated"] = "NotAuthenticated";
	LoginState$1["LoggedIn"] = "LoggedIn";
	return LoginState$1;
}({});
var LoginViewModel = class {
	mailAddress;
	password;
	displayMode;
	state;
	helpText;
	savePassword;
	savedInternalCredentials;
	autoLoginCredentials;
	constructor(loginController, credentialsProvider, secondFactorHandler, deviceConfig, domainConfig, credentialRemovalHandler, pushServiceApp, appLock) {
		this.loginController = loginController;
		this.credentialsProvider = credentialsProvider;
		this.secondFactorHandler = secondFactorHandler;
		this.deviceConfig = deviceConfig;
		this.domainConfig = domainConfig;
		this.credentialRemovalHandler = credentialRemovalHandler;
		this.pushServiceApp = pushServiceApp;
		this.appLock = appLock;
		this.state = LoginState.NotAuthenticated;
		this.displayMode = DisplayMode.Form;
		this.helpText = "emptyString_msg";
		this.mailAddress = (0, import_stream.default)("");
		this.password = (0, import_stream.default)("");
		this.autoLoginCredentials = null;
		this.savePassword = (0, import_stream.default)(false);
		this.savedInternalCredentials = [];
	}
	/**
	* This method should be called right after creation of the view model by whoever created the viewmodel. The view model will not be
	* fully functional before this method has been called!
	* @returns {Promise<void>}
	*/
	async init() {
		await this.updateCachedCredentials();
	}
	async useUserId(userId) {
		this.autoLoginCredentials = await this.credentialsProvider.getCredentialsInfoByUserId(userId);
		if (this.autoLoginCredentials) this.displayMode = DisplayMode.Credentials;
else this.displayMode = DisplayMode.Form;
	}
	canLogin() {
		if (this.displayMode === DisplayMode.Credentials) return this.autoLoginCredentials != null || this.savedInternalCredentials.length === 1;
else if (this.displayMode === DisplayMode.Form) return Boolean(this.mailAddress() && this.password());
else return false;
	}
	async useCredentials(encryptedCredentials) {
		const credentialsInfo = await this.credentialsProvider.getCredentialsInfoByUserId(encryptedCredentials.userId);
		if (credentialsInfo) {
			this.autoLoginCredentials = credentialsInfo;
			this.displayMode = DisplayMode.Credentials;
		}
	}
	async login() {
		if (this.state === LoginState.LoggingIn) return;
		this.state = LoginState.LoggingIn;
		if (this.displayMode === DisplayMode.Credentials || this.displayMode === DisplayMode.DeleteCredentials) await this.autologin();
else if (this.displayMode === DisplayMode.Form) await this.formLogin();
else throw new ProgrammingError(`Cannot login with current display mode: ${this.displayMode}`);
	}
	async deleteCredentials(credentialsInfo) {
		let credentials;
		try {
			/**
			* We have to decrypt the credentials here (and hence deal with any potential errors), because :LoginController.deleteOldSession
			* expects the full credentials. The reason for this is that the accessToken contained within credentials has a double function:
			* 1. It is used as an actual access token to re-authenticate
			* 2. It is used as a session ID
			* Since we want to also delete the session from the server, we need the (decrypted) accessToken in its function as a session id.
			*/
			credentials = await this.unlockAppAndGetCredentials(credentialsInfo.userId);
		} catch (e) {
			if (e instanceof KeyPermanentlyInvalidatedError) {
				await this.credentialsProvider.clearCredentials(e);
				await this.updateCachedCredentials();
				this.state = LoginState.NotAuthenticated;
				return null;
			} else if (e instanceof CancelledError) return null;
else if (e instanceof CredentialAuthenticationError) {
				this.helpText = getLoginErrorMessage(e, false);
				return null;
			} else if (e instanceof DeviceStorageUnavailableError) {
				await this.credentialsProvider.deleteByUserId(credentialsInfo.userId);
				await this.credentialRemovalHandler.onCredentialsRemoved(credentialsInfo);
				await this.updateCachedCredentials();
			} else throw e;
		}
		if (credentials) {
			await this.credentialsProvider.deleteByUserId(credentials.credentialInfo.userId);
			await this.credentialRemovalHandler.onCredentialsRemoved(credentials.credentialInfo);
			await this.updateCachedCredentials();
			try {
				await this.loginController.deleteOldSession(credentials, await this.pushServiceApp?.loadPushIdentifierFromNative() ?? null);
			} catch (e) {
				if (isOfflineError(e)) return "networkError";
			}
		}
		return null;
	}
	/** @throws CredentialAuthenticationError */
	async unlockAppAndGetCredentials(userId) {
		await this.appLock.enforce();
		return await this.credentialsProvider.getDecryptedCredentialsByUserId(userId);
	}
	getSavedCredentials() {
		return this.savedInternalCredentials;
	}
	switchDeleteState() {
		if (this.displayMode === DisplayMode.DeleteCredentials) this.displayMode = DisplayMode.Credentials;
else if (this.displayMode === DisplayMode.Credentials) this.displayMode = DisplayMode.DeleteCredentials;
else throw new ProgrammingError("invalid state");
	}
	showLoginForm() {
		this.displayMode = DisplayMode.Form;
		this.helpText = "emptyString_msg";
	}
	showCredentials() {
		this.displayMode = DisplayMode.Credentials;
		this.helpText = "emptyString_msg";
	}
	shouldShowRecover() {
		return this.domainConfig.firstPartyDomain;
	}
	shouldShowSignup() {
		return this.domainConfig.firstPartyDomain || getWhitelabelRegistrationDomains().length > 0;
	}
	shouldShowAppButtons() {
		return this.domainConfig.firstPartyDomain;
	}
	async updateCachedCredentials() {
		this.savedInternalCredentials = await this.credentialsProvider.getInternalCredentialsInfos();
		this.autoLoginCredentials = null;
		if (this.savedInternalCredentials.length > 0) {
			if (this.displayMode !== DisplayMode.DeleteCredentials) this.displayMode = DisplayMode.Credentials;
		} else this.displayMode = DisplayMode.Form;
	}
	async autologin() {
		let credentials = null;
		try {
			if (this.autoLoginCredentials == null) {
				const allCredentials = await this.credentialsProvider.getInternalCredentialsInfos();
				this.autoLoginCredentials = first(allCredentials);
			}
			if (this.autoLoginCredentials) {
				credentials = await this.unlockAppAndGetCredentials(this.autoLoginCredentials.userId);
				if (credentials) {
					const offlineTimeRange = this.deviceConfig.getOfflineTimeRangeDays(this.autoLoginCredentials.userId);
					const result = await this.loginController.resumeSession(credentials, null, offlineTimeRange);
					if (result.type == "success") await this.onLogin();
else {
						this.state = LoginState.NotAuthenticated;
						this.helpText = "offlineLoginPremiumOnly_msg";
					}
				}
			} else this.state = LoginState.NotAuthenticated;
		} catch (e) {
			if (e instanceof NotAuthenticatedError && this.autoLoginCredentials) {
				const autoLoginCredentials = this.autoLoginCredentials;
				await this.credentialsProvider.deleteByUserId(autoLoginCredentials.userId);
				if (credentials) await this.credentialRemovalHandler.onCredentialsRemoved(credentials.credentialInfo);
				await this.updateCachedCredentials();
				await this.onLoginFailed(e);
			} else if (e instanceof KeyPermanentlyInvalidatedError) {
				await this.credentialsProvider.clearCredentials(e);
				await this.updateCachedCredentials();
				this.state = LoginState.NotAuthenticated;
				this.helpText = "credentialsKeyInvalidated_msg";
			} else if (e instanceof DeviceStorageUnavailableError) {
				this.state = LoginState.NotAuthenticated;
				this.helpText = lang.makeTranslation("help_text", "Could not access secret storage");
			} else await this.onLoginFailed(e);
		}
		if (this.state === LoginState.AccessExpired || this.state === LoginState.InvalidCredentials) {
			this.displayMode = DisplayMode.Form;
			this.mailAddress(this.autoLoginCredentials?.login ?? "");
		}
	}
	async formLogin() {
		const mailAddress = this.mailAddress();
		const password = this.password();
		const savePassword = this.savePassword();
		if (mailAddress === "" || password === "") {
			this.state = LoginState.InvalidCredentials;
			this.helpText = "loginFailed_msg";
			return;
		}
		this.helpText = "login_msg";
		try {
			const sessionType = savePassword ? SessionType.Persistent : SessionType.Login;
			const { credentials, databaseKey } = await this.loginController.createSession(mailAddress, password, sessionType);
			await this.onLogin();
			await this.appLock.enforce();
			const storedCredentialsToDelete = this.savedInternalCredentials.filter((c) => c.login === mailAddress || c.userId === credentials.userId);
			for (const credentialToDelete of storedCredentialsToDelete) {
				const credentials$1 = await this.credentialsProvider.getDecryptedCredentialsByUserId(credentialToDelete.userId);
				if (credentials$1) {
					await this.loginController.deleteOldSession(credentials$1);
					await this.credentialsProvider.deleteByUserId(credentials$1.credentialInfo.userId, { deleteOfflineDb: false });
				}
			}
			if (savePassword) try {
				await this.credentialsProvider.store(credentialsToUnencrypted(credentials, databaseKey));
			} catch (e) {
				if (e instanceof KeyPermanentlyInvalidatedError) {
					await this.credentialsProvider.clearCredentials(e);
					await this.updateCachedCredentials();
				} else if (e instanceof DeviceStorageUnavailableError || e instanceof CancelledError) console.warn("will proceed with ephemeral credentials because device storage is unavailable:", e);
else throw e;
			}
		} catch (e) {
			if (e instanceof DeviceStorageUnavailableError) console.warn("cannot log in: failed to get credentials from device storage", e);
			await this.onLoginFailed(e);
		} finally {
			await this.secondFactorHandler.closeWaitingForSecondFactorDialog();
		}
	}
	async onLogin() {
		this.helpText = "emptyString_msg";
		this.state = LoginState.LoggedIn;
	}
	async onLoginFailed(error) {
		this.helpText = getLoginErrorMessage(error, false);
		if (error instanceof BadRequestError || error instanceof NotAuthenticatedError) this.state = LoginState.InvalidCredentials;
else if (error instanceof AccessExpiredError) this.state = LoginState.AccessExpired;
else this.state = LoginState.UnknownError;
		handleExpectedLoginError(error, noOp);
	}
};

//#endregion
//#region src/common/misc/LoginUtils.ts
function checkApprovalStatus(logins, includeInvoiceNotPaidForAdmin, defaultStatus) {
	if (!logins.getUserController().isInternalUser()) return Promise.resolve(true);
	return logins.getUserController().loadCustomer().then((customer) => {
		const approvalStatus = getCustomerApprovalStatus(customer);
		const status = approvalStatus === ApprovalStatus.REGISTRATION_APPROVED && defaultStatus != null ? defaultStatus : approvalStatus;
		if (status === ApprovalStatus.REGISTRATION_APPROVAL_NEEDED || status === ApprovalStatus.DELAYED || status === ApprovalStatus.REGISTRATION_APPROVAL_NEEDED_AND_INITIALLY_ACCESSED) return Dialog.message("waitingForApproval_msg").then(() => false);
else if (status === ApprovalStatus.DELAYED_AND_INITIALLY_ACCESSED) if (new Date().getTime() - generatedIdToTimestamp(customer._id) > 1728e5) return Dialog.message("requestApproval_msg").then(() => true);
else return Dialog.message("waitingForApproval_msg").then(() => false);
else if (status === ApprovalStatus.INVOICE_NOT_PAID) if (logins.getUserController().isGlobalAdmin()) if (includeInvoiceNotPaidForAdmin) return Dialog.message("invoiceNotPaid_msg").then(() => {}).then(() => true);
else return true;
else {
			const errorMessage = lang.makeTranslation("invoiceNotPaidUser_msg", lang.get("invoiceNotPaidUser_msg") + " " + lang.get("contactAdmin_msg"));
			return Dialog.message(errorMessage).then(() => false);
		}
else if (status === ApprovalStatus.SPAM_SENDER) {
			Dialog.message("loginAbuseDetected_msg");
			return false;
		} else if (status === ApprovalStatus.PAID_SUBSCRIPTION_NEEDED) {
			const message = lang.get("upgradeNeeded_msg");
			return Dialog.reminder(lang.get("upgradeReminderTitle_msg"), message).then((confirmed) => {
				if (confirmed) import("./UpgradeSubscriptionWizard-chunk.js").then((m) => m.showUpgradeWizard(logins));
				return false;
			});
		} else return true;
	});
}
function getLoginErrorMessage(error, isExternalLogin) {
	switch (error.constructor) {
		case BadRequestError:
		case NotAuthenticatedError:
		case AccessDeactivatedError: return "loginFailed_msg";
		case AccessBlockedError: return "loginFailedOften_msg";
		case AccessExpiredError: return isExternalLogin ? "expiredLink_msg" : "inactiveAccount_msg";
		case TooManyRequestsError: return "tooManyAttempts_msg";
		case CancelledError: return "emptyString_msg";
		case CredentialAuthenticationError: return lang.getTranslation("couldNotUnlockCredentials_msg", { "{reason}": error.message });
		case ConnectionError: return "connectionLostLong_msg";
		default: return "emptyString_msg";
	}
}
function handleExpectedLoginError(error, handler) {
	if (error instanceof BadRequestError || error instanceof NotAuthenticatedError || error instanceof AccessExpiredError || error instanceof AccessBlockedError || error instanceof AccessDeactivatedError || error instanceof TooManyRequestsError || error instanceof CancelledError || error instanceof CredentialAuthenticationError || error instanceof ConnectionError) handler(error);
else throw error;
}
function getLoginErrorStateAndMessage(error) {
	let errorMessage = getLoginErrorMessage(error, false);
	let state;
	if (error instanceof BadRequestError || error instanceof NotAuthenticatedError) state = LoginState.InvalidCredentials;
else if (error instanceof AccessExpiredError) state = LoginState.AccessExpired;
else state = LoginState.UnknownError;
	handleExpectedLoginError(error, noOp);
	return {
		errorMessage,
		state
	};
}
async function showSignupDialog(urlParams) {
	const subscriptionParams = getSubscriptionParameters(urlParams);
	const registrationDataId = getRegistrationDataIdFromParams(urlParams);
	const referralCode = getReferralCodeFromParams(urlParams);
	const availablePlans = getAvailablePlansFromSubscriptionParameters(subscriptionParams);
	await showProgressDialog("loading_msg", locator.worker.initialized.then(async () => {
		const { loadSignupWizard } = await import("./UpgradeSubscriptionWizard-chunk.js");
		await loadSignupWizard(subscriptionParams, registrationDataId, referralCode, availablePlans);
	})).catch(ofClass(UserError, async (e) => {
		const m = await import("./mithril2-chunk.js");
		await showUserError(e);
		m.route.set("/signup");
	}));
}
function getAvailablePlansFromSubscriptionParameters(params) {
	if (params == null || params.type == null) return AvailablePlans;
	try {
		const type = stringToSubscriptionType(params.type);
		switch (type) {
			case SubscriptionType.Business: return NewBusinessPlans;
			case SubscriptionType.Personal: return NewPersonalPlans;
			case SubscriptionType.PaidPersonal: return NewPaidPlans.filter((paidPlan) => NewPersonalPlans.includes(paidPlan));
		}
	} catch (e) {
		return AvailablePlans;
	}
}
function stringToSubscriptionType(string) {
	switch (string.toLowerCase()) {
		case "business": return SubscriptionType.Business;
		case "private": return SubscriptionType.Personal;
		case "privatepaid": return SubscriptionType.PaidPersonal;
		default: throw new Error(`Failed to get subscription type: ${string}`);
	}
}
function getSubscriptionParameters(hashParams) {
	const { subscription, type, interval } = hashParams;
	const isSubscriptionString = typeof subscription === "string";
	const isTypeString = typeof type === "string";
	const isIntervalString = typeof interval === "string";
	if (!isSubscriptionString && !isTypeString && !isIntervalString) return null;
	return {
		subscription: isSubscriptionString ? subscription : null,
		type: isTypeString ? type : null,
		interval: isIntervalString ? interval : null
	};
}
function getReferralCodeFromParams(urlParams) {
	if (typeof urlParams.ref === "string") return urlParams.ref;
	return null;
}
function getRegistrationDataIdFromParams(hashParams) {
	if (typeof hashParams.token === "string") return hashParams.token;
	return null;
}
async function loadRedeemGiftCardWizard(urlHash) {
	const wizard = await import("./RedeemGiftCardWizard-chunk.js");
	return wizard.loadRedeemGiftCardWizard(urlHash);
}
async function showGiftCardDialog(urlHash) {
	showProgressDialog("loading_msg", loadRedeemGiftCardWizard(urlHash)).then((dialog) => dialog.show()).catch((e) => {
		if (e instanceof NotAuthorizedError || e instanceof NotFoundError) throw new UserError("invalidGiftCard_msg");
else throw e;
	}).catch(ofClass(UserError, showUserError));
}
async function showRecoverDialog(mailAddress, resetAction) {
	const dialog = await import("./RecoverLoginDialog-chunk.js");
	dialog.show(mailAddress, resetAction);
}

//#endregion
export { CredentialsSelector, DisplayMode, LoginForm, LoginState, LoginView, LoginViewModel, checkApprovalStatus, getLoginErrorMessage, getLoginErrorStateAndMessage, getReferralCodeFromParams, getRegistrationDataIdFromParams, getWhitelabelRegistrationDomains, handleExpectedLoginError, renderInfoLinks, showGiftCardDialog, showRecoverDialog, showSignupDialog, stringToSubscriptionType };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTG9naW5VdGlscy1jaHVuay5qcyIsIm5hbWVzIjpbInZub2RlOiBWbm9kZTxMb2dpbkZvcm1BdHRycz4iLCJlOiBTdWJtaXRFdmVudCIsImU6IEtleWJvYXJkRXZlbnQiLCJlOiBNb3VzZUV2ZW50Iiwidm5vZGU6IFZub2RlPENyZWRlbnRpYWxzU2VsZWN0b3JBdHRycz4iLCJidXR0b25zOiBDaGlsZHJlbiIsImU6IE1vdXNlRXZlbnQiLCJkaWFsb2c6IERpYWxvZyIsImVudHJpZXM6IHN0cmluZ1tdIiwiY2xpZW50IiwicHJvbWlzZTogUHJvbWlzZTx1bmtub3duPiIsIm1lc3NhZ2VBcnJheTogQXJyYXk8VHJhbnNsYXRpb25LZXk+IiwiY3VycmVudE1lc3NhZ2U6IFRyYW5zbGF0aW9uS2V5IiwibWVzc2FnZUluZGV4OiBudW1iZXIiLCJtIiwia2V5Ym9hcmRTaXplOiBudW1iZXIiLCJkZWZhdWx0QnV0dG9uczogUmVhZG9ubHlBcnJheTxEcm9wZG93bkJ1dHRvbkF0dHJzPiIsImFyZ3M6IFJlY29yZDxzdHJpbmcsIGFueT4iLCJyZXF1ZXN0ZWRQYXRoOiBzdHJpbmciLCJsb2dpbkZvcm06IExvZ2luRm9ybSIsInVybDogc3RyaW5nIiwibG9naW5Db250cm9sbGVyOiBMb2dpbkNvbnRyb2xsZXIiLCJjcmVkZW50aWFsc1Byb3ZpZGVyOiBDcmVkZW50aWFsc1Byb3ZpZGVyIiwic2Vjb25kRmFjdG9ySGFuZGxlcjogU2Vjb25kRmFjdG9ySGFuZGxlciIsImRldmljZUNvbmZpZzogRGV2aWNlQ29uZmlnIiwiZG9tYWluQ29uZmlnOiBEb21haW5Db25maWciLCJjcmVkZW50aWFsUmVtb3ZhbEhhbmRsZXI6IENyZWRlbnRpYWxSZW1vdmFsSGFuZGxlciIsInB1c2hTZXJ2aWNlQXBwOiBOYXRpdmVQdXNoU2VydmljZUFwcCB8IG51bGwiLCJhcHBMb2NrOiBBcHBMb2NrIiwidXNlcklkOiBzdHJpbmciLCJlbmNyeXB0ZWRDcmVkZW50aWFsczogQ3JlZGVudGlhbHNJbmZvIiwiY3JlZGVudGlhbHNJbmZvOiBDcmVkZW50aWFsc0luZm8iLCJ1c2VySWQ6IElkIiwiY3JlZGVudGlhbHM6IFVuZW5jcnlwdGVkQ3JlZGVudGlhbHMgfCBudWxsIiwiY3JlZGVudGlhbHMiLCJlcnJvcjogRXJyb3IiLCJsb2dpbnM6IExvZ2luQ29udHJvbGxlciIsImluY2x1ZGVJbnZvaWNlTm90UGFpZEZvckFkbWluOiBib29sZWFuIiwiZGVmYXVsdFN0YXR1cz86IEFwcHJvdmFsU3RhdHVzIiwiZXJyb3I6IEVycm9yIiwiaXNFeHRlcm5hbExvZ2luOiBib29sZWFuIiwiZXJyb3I6IEUiLCJoYW5kbGVyOiAoZXJyb3I6IEUpID0+IHZvaWQiLCJ1cmxQYXJhbXM6IFBhcmFtcyIsInBhcmFtczogU3Vic2NyaXB0aW9uUGFyYW1ldGVycyB8IG51bGwiLCJzdHJpbmc6IHN0cmluZyIsImhhc2hQYXJhbXM6IFBhcmFtcyIsInVybEhhc2g6IHN0cmluZyIsIm1haWxBZGRyZXNzOiBzdHJpbmciLCJyZXNldEFjdGlvbjogUmVzZXRBY3Rpb24iXSwic291cmNlcyI6WyIuLi9zcmMvY29tbW9uL2xvZ2luL0xvZ2luRm9ybS50cyIsIi4uL3NyYy9jb21tb24vbG9naW4vQ3JlZGVudGlhbHNTZWxlY3Rvci50cyIsIi4uL3NyYy9jb21tb24vZ3VpL1JlbmRlckxvZ2luSW5mb0xpbmtzLnRzIiwiLi4vc3JjL2NvbW1vbi9sb2dpbi9Mb2dpblZpZXcudHMiLCIuLi9zcmMvY29tbW9uL2xvZ2luL0xvZ2luVmlld01vZGVsLnRzIiwiLi4vc3JjL2NvbW1vbi9taXNjL0xvZ2luVXRpbHMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IG0sIHsgQ2hpbGRyZW4sIENvbXBvbmVudCwgVm5vZGUgfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgc3RyZWFtIGZyb20gXCJtaXRocmlsL3N0cmVhbVwiXG5pbXBvcnQgU3RyZWFtIGZyb20gXCJtaXRocmlsL3N0cmVhbVwiXG5pbXBvcnQgeyBsaXZlRGF0YUF0dHJzIH0gZnJvbSBcIi4uL2d1aS9BcmlhVXRpbHNcIlxuaW1wb3J0IHsgbGFuZywgVHJhbnNsYXRpb25LZXkgfSBmcm9tIFwiLi4vbWlzYy9MYW5ndWFnZVZpZXdNb2RlbC5qc1wiXG5pbXBvcnQgeyBBdXRvY29tcGxldGUsIFRleHRGaWVsZCwgVGV4dEZpZWxkVHlwZSB9IGZyb20gXCIuLi9ndWkvYmFzZS9UZXh0RmllbGQuanNcIlxuaW1wb3J0IHsgQ2hlY2tib3ggfSBmcm9tIFwiLi4vZ3VpL2Jhc2UvQ2hlY2tib3guanNcIlxuaW1wb3J0IHsgY2xpZW50IH0gZnJvbSBcIi4uL21pc2MvQ2xpZW50RGV0ZWN0b3IuanNcIlxuaW1wb3J0IHsgaXNBcHAsIGlzRGVza3RvcCwgaXNPZmZsaW5lU3RvcmFnZUF2YWlsYWJsZSB9IGZyb20gXCIuLi9hcGkvY29tbW9uL0VudlwiXG5pbXBvcnQgeyBMb2dpbkJ1dHRvbiB9IGZyb20gXCIuLi9ndWkvYmFzZS9idXR0b25zL0xvZ2luQnV0dG9uLmpzXCJcbmltcG9ydCB7IFBhc3N3b3JkRmllbGQgfSBmcm9tIFwiLi4vbWlzYy9wYXNzd29yZHMvUGFzc3dvcmRGaWVsZC5qc1wiXG5pbXBvcnQgeyBLZXlzIH0gZnJvbSBcIi4uL2FwaS9jb21tb24vVHV0YW5vdGFDb25zdGFudHNcIlxuaW1wb3J0IHsgdXNlS2V5SGFuZGxlciB9IGZyb20gXCIuLi9taXNjL0tleU1hbmFnZXIuanNcIlxuXG5leHBvcnQgdHlwZSBMb2dpbkZvcm1BdHRycyA9IHtcblx0b25TdWJtaXQ6ICh1c2VybmFtZTogc3RyaW5nLCBwYXNzd29yZDogc3RyaW5nKSA9PiB1bmtub3duXG5cdG1haWxBZGRyZXNzOiBTdHJlYW08c3RyaW5nPlxuXHRwYXNzd29yZDogU3RyZWFtPHN0cmluZz5cblx0c2F2ZVBhc3N3b3JkPzogU3RyZWFtPGJvb2xlYW4+XG5cdGhlbHBUZXh0PzogVm5vZGU8YW55PiB8IHN0cmluZ1xuXHRpbnZhbGlkQ3JlZGVudGlhbHM/OiBib29sZWFuXG5cdHNob3dSZWNvdmVyeU9wdGlvbj86IGJvb2xlYW5cblx0YWNjZXNzRXhwaXJlZD86IGJvb2xlYW5cbn1cblxuZXhwb3J0IGNsYXNzIExvZ2luRm9ybSBpbXBsZW1lbnRzIENvbXBvbmVudDxMb2dpbkZvcm1BdHRycz4ge1xuXHRtYWlsQWRkcmVzc1RleHRGaWVsZCE6IEhUTUxJbnB1dEVsZW1lbnRcblx0cGFzc3dvcmRUZXh0RmllbGQhOiBIVE1MSW5wdXRFbGVtZW50XG5cdC8vIFdoZW4gaU9TIGRvZXMgYXV0by1maWxsaW5nIChhbHdheXMgaW4gV2ViVmlldyBhcyBvZiBpT1MgMTIuMiBhbmQgaW4gb2xkZXIgU2FmYXJpKVxuXHQvLyBpdCBvbmx5IHNlbmRzIG9uZSBpbnB1dC9jaGFuZ2UgZXZlbnQgZm9yIGFsbCBmaWVsZHMgc28gd2UgZGlkbid0IGtub3cgaWYgZmllbGRzXG5cdC8vIHdlcmUgdXBkYXRlZC4gU28gd2Uga2luZGx5IGFzayBvdXIgZmllbGRzIHRvIHVwZGF0ZSB0aGVtc2VsdmVzIHdpdGggcmVhbCBET00gdmFsdWVzLlxuXHRhdXRvZmlsbFVwZGF0ZUhhbmRsZXIhOiBTdHJlYW08dm9pZD5cblxuXHRvbmNyZWF0ZSh2bm9kZTogVm5vZGU8TG9naW5Gb3JtQXR0cnM+KSB7XG5cdFx0Y29uc3QgYSA9IHZub2RlLmF0dHJzXG5cdFx0dGhpcy5hdXRvZmlsbFVwZGF0ZUhhbmRsZXIgPSBzdHJlYW0uY29tYmluZSgoKSA9PiB7XG5cdFx0XHRyZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuXHRcdFx0XHRjb25zdCBvbGRBZGRyZXNzID0gYS5tYWlsQWRkcmVzcygpXG5cdFx0XHRcdGNvbnN0IG5ld0FkZHJlc3MgPSB0aGlzLm1haWxBZGRyZXNzVGV4dEZpZWxkLnZhbHVlXG5cdFx0XHRcdGNvbnN0IG9sZFBhc3N3b3JkID0gYS5wYXNzd29yZCgpXG5cdFx0XHRcdGNvbnN0IG5ld1Bhc3N3b3JkID0gdGhpcy5wYXNzd29yZFRleHRGaWVsZC52YWx1ZVxuXHRcdFx0XHQvLyBvbmx5IHVwZGF0ZSB2YWx1ZXMgd2hlbiB0aGV5IGFyZSBkaWZmZXJlbnQgb3Igd2UgZ2V0IHN0dWNrIGluIGFuIGluZmluaXRlIGxvb3Bcblx0XHRcdFx0aWYgKG9sZEFkZHJlc3MgIT09IG5ld0FkZHJlc3MgJiYgbmV3QWRkcmVzcyAhPSBcIlwiKSBhLm1haWxBZGRyZXNzKG5ld0FkZHJlc3MpXG5cdFx0XHRcdGlmIChvbGRQYXNzd29yZCAhPT0gbmV3UGFzc3dvcmQgJiYgbmV3UGFzc3dvcmQgIT0gXCJcIikgYS5wYXNzd29yZChuZXdQYXNzd29yZClcblx0XHRcdH0pXG5cdFx0fSwgW2EubWFpbEFkZHJlc3MsIGEucGFzc3dvcmRdKVxuXHR9XG5cblx0b25yZW1vdmUodm5vZGU6IFZub2RlPExvZ2luRm9ybUF0dHJzPikge1xuXHRcdHZub2RlLmF0dHJzLnBhc3N3b3JkKFwiXCIpXG5cdFx0dGhpcy5hdXRvZmlsbFVwZGF0ZUhhbmRsZXIuZW5kKHRydWUpXG5cdFx0dGhpcy5wYXNzd29yZFRleHRGaWVsZC52YWx1ZSA9IFwiXCJcblx0fVxuXG5cdHZpZXcodm5vZGU6IFZub2RlPExvZ2luRm9ybUF0dHJzPik6IENoaWxkcmVuIHtcblx0XHRjb25zdCBhID0gdm5vZGUuYXR0cnNcblx0XHRjb25zdCBjYW5TYXZlQ3JlZGVudGlhbHMgPSBjbGllbnQubG9jYWxTdG9yYWdlKClcblx0XHRpZiAoYS5zYXZlUGFzc3dvcmQgJiYgKGlzQXBwKCkgfHwgaXNEZXNrdG9wKCkpKSB7XG5cdFx0XHRhLnNhdmVQYXNzd29yZCh0cnVlKVxuXHRcdH1cblx0XHRyZXR1cm4gbShcblx0XHRcdFwiZm9ybVwiLFxuXHRcdFx0e1xuXHRcdFx0XHRvbnN1Ym1pdDogKGU6IFN1Ym1pdEV2ZW50KSA9PiB7XG5cdFx0XHRcdFx0Ly8gZG8gbm90IHBvc3QgdGhlIGZvcm0sIHRoZSBmb3JtIGlzIGp1c3QgaGVyZSB0byBlbmFibGUgYnJvd3NlciBhdXRvLWZpbGxcblx0XHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KCkgLy8gYS5vblN1Ym1pdChhLm1haWxBZGRyZXNzKCksIGEucGFzc3dvcmQoKSlcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XHRbXG5cdFx0XHRcdG0oXG5cdFx0XHRcdFx0XCJcIixcblx0XHRcdFx0XHRtKFRleHRGaWVsZCwge1xuXHRcdFx0XHRcdFx0bGFiZWw6IFwibWFpbEFkZHJlc3NfbGFiZWxcIiBhcyBUcmFuc2xhdGlvbktleSxcblx0XHRcdFx0XHRcdHZhbHVlOiBhLm1haWxBZGRyZXNzKCksXG5cdFx0XHRcdFx0XHRvbmlucHV0OiBhLm1haWxBZGRyZXNzLFxuXHRcdFx0XHRcdFx0dHlwZTogVGV4dEZpZWxkVHlwZS5FbWFpbCxcblx0XHRcdFx0XHRcdGF1dG9jb21wbGV0ZUFzOiBBdXRvY29tcGxldGUuZW1haWwsXG5cdFx0XHRcdFx0XHRvbkRvbUlucHV0Q3JlYXRlZDogKGRvbSkgPT4ge1xuXHRcdFx0XHRcdFx0XHR0aGlzLm1haWxBZGRyZXNzVGV4dEZpZWxkID0gZG9tXG5cdFx0XHRcdFx0XHRcdGlmICghY2xpZW50LmlzTW9iaWxlRGV2aWNlKCkpIHtcblx0XHRcdFx0XHRcdFx0XHRkb20uZm9jdXMoKSAvLyBoYXZlIGVtYWlsIGFkZHJlc3MgYXV0by1mb2N1cyBzbyB0aGUgdXNlciBjYW4gaW1tZWRpYXRlbHkgdHlwZSB0aGVpciB1c2VybmFtZSAodW5sZXNzIG9uIG1vYmlsZSlcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdGtleUhhbmRsZXI6IChrZXkpID0+IHtcblx0XHRcdFx0XHRcdFx0aWYgKGtleS5rZXkgIT0gbnVsbCAmJiBrZXkua2V5LnRvTG93ZXJDYXNlKCkgPT09IEtleXMuUkVUVVJOLmNvZGUpIHtcblx0XHRcdFx0XHRcdFx0XHRhLm9uU3VibWl0KGEubWFpbEFkZHJlc3MoKSwgYS5wYXNzd29yZCgpKVxuXHRcdFx0XHRcdFx0XHRcdC8vIHRoaXMgaXMgc28gdGhhdCB3aGVuIFwiUmV0dXJuXCIgaXMgcHJlc3NlZCwgdGhlIHVzZXIgaXMgbG9nZ2VkIGluXG5cdFx0XHRcdFx0XHRcdFx0Ly8gYW5kIHRoZSBwYXNzd29yZCByZXZlYWwgYnV0dG9uIGlzIG5vdCB0cmlnZ2VyZWRcblx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gdHJ1ZVxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHR9KSxcblx0XHRcdFx0KSxcblx0XHRcdFx0bShcblx0XHRcdFx0XHRcIlwiLFxuXHRcdFx0XHRcdG0oUGFzc3dvcmRGaWVsZCwge1xuXHRcdFx0XHRcdFx0dmFsdWU6IGEucGFzc3dvcmQoKSxcblx0XHRcdFx0XHRcdG9uaW5wdXQ6IGEucGFzc3dvcmQsXG5cdFx0XHRcdFx0XHRhdXRvY29tcGxldGVBczogQXV0b2NvbXBsZXRlLmN1cnJlbnRQYXNzd29yZCxcblx0XHRcdFx0XHRcdG9uRG9tSW5wdXRDcmVhdGVkOiAoZG9tKSA9PiAodGhpcy5wYXNzd29yZFRleHRGaWVsZCA9IGRvbSksXG5cdFx0XHRcdFx0XHRrZXlIYW5kbGVyOiAoa2V5KSA9PiB7XG5cdFx0XHRcdFx0XHRcdGlmIChrZXkua2V5ICE9IG51bGwgJiYga2V5LmtleS50b0xvd2VyQ2FzZSgpID09PSBLZXlzLlJFVFVSTi5jb2RlKSB7XG5cdFx0XHRcdFx0XHRcdFx0YS5vblN1Ym1pdChhLm1haWxBZGRyZXNzKCksIGEucGFzc3dvcmQoKSlcblx0XHRcdFx0XHRcdFx0XHQvLyB0aGlzIGlzIHNvIHRoYXQgd2hlbiBcIlJldHVyblwiIGlzIHByZXNzZWQsIHRoZSB1c2VyIGlzIGxvZ2dlZCBpblxuXHRcdFx0XHRcdFx0XHRcdC8vIGFuZCB0aGUgcGFzc3dvcmQgcmV2ZWFsIGJ1dHRvbiBpcyBub3QgdHJpZ2dlcmVkXG5cdFx0XHRcdFx0XHRcdFx0cmV0dXJuIGZhbHNlXG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0cmV0dXJuIHRydWVcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdCksXG5cdFx0XHRcdGEuc2F2ZVBhc3N3b3JkXG5cdFx0XHRcdFx0PyBpc0FwcCgpIHx8IGlzRGVza3RvcCgpXG5cdFx0XHRcdFx0XHQ/IG0oXCJzbWFsbC5ibG9jay5jb250ZW50LWZnXCIsIGxhbmcuZ2V0KFwiZGF0YVdpbGxCZVN0b3JlZF9tc2dcIikpXG5cdFx0XHRcdFx0XHQ6IG0oXG5cdFx0XHRcdFx0XHRcdFx0XCJcIixcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRvbmtleWRvd246IChlOiBLZXlib2FyZEV2ZW50KSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHVzZUtleUhhbmRsZXIoZSwgKGtleSkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGlmIChrZXkua2V5ICE9IG51bGwgJiYga2V5LmtleS50b0xvd2VyQ2FzZSgpID09PSBLZXlzLlJFVFVSTi5jb2RlKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRhLm9uU3VibWl0KGEubWFpbEFkZHJlc3MoKSwgYS5wYXNzd29yZCgpKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Ly8gdGhpcyBpcyBzbyB0aGF0IHdoZW4gXCJSZXR1cm5cIiBpcyBwcmVzc2VkLCB0aGUgdXNlciBpcyBsb2dnZWQgaW5cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdC8vIGFuZCB0aGUgcGFzc3dvcmQgcmV2ZWFsIGJ1dHRvbiBpcyBub3QgdHJpZ2dlcmVkXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KClcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiBmYWxzZVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHRcdFx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRtKENoZWNrYm94LCB7XG5cdFx0XHRcdFx0XHRcdFx0XHRsYWJlbDogKCkgPT4gbGFuZy5nZXQoXCJzdG9yZVBhc3N3b3JkX2FjdGlvblwiKSxcblx0XHRcdFx0XHRcdFx0XHRcdGNoZWNrZWQ6IGEuc2F2ZVBhc3N3b3JkKCksXG5cdFx0XHRcdFx0XHRcdFx0XHRvbkNoZWNrZWQ6IGEuc2F2ZVBhc3N3b3JkLFxuXHRcdFx0XHRcdFx0XHRcdFx0aGVscExhYmVsOiBjYW5TYXZlQ3JlZGVudGlhbHNcblx0XHRcdFx0XHRcdFx0XHRcdFx0PyBsYW5nLm1ha2VUcmFuc2xhdGlvbihcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFwib25seVByaXZhdGVDb21wdXRlcl9tc2dcIixcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGxhbmcuZ2V0KFwib25seVByaXZhdGVDb21wdXRlcl9tc2dcIikgK1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQoaXNPZmZsaW5lU3RvcmFnZUF2YWlsYWJsZSgpID8gXCJcXG5cIiArIGxhbmcuZ2V0KFwiZGF0YVdpbGxCZVN0b3JlZF9tc2dcIikgOiBcIlwiKSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0ICApXG5cdFx0XHRcdFx0XHRcdFx0XHRcdDogXCJmdW5jdGlvbk5vdFN1cHBvcnRlZF9tc2dcIixcblx0XHRcdFx0XHRcdFx0XHRcdGRpc2FibGVkOiAhY2FuU2F2ZUNyZWRlbnRpYWxzLFxuXHRcdFx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdFx0ICApXG5cdFx0XHRcdFx0OiBudWxsLFxuXHRcdFx0XHRtKFxuXHRcdFx0XHRcdFwiLnB0XCIsXG5cdFx0XHRcdFx0bShMb2dpbkJ1dHRvbiwge1xuXHRcdFx0XHRcdFx0bGFiZWw6IGlzQXBwKCkgfHwgaXNEZXNrdG9wKCkgPyBcImFkZEFjY291bnRfYWN0aW9uXCIgOiBcImxvZ2luX2FjdGlvblwiLFxuXHRcdFx0XHRcdFx0b25jbGljazogKCkgPT4gYS5vblN1Ym1pdChhLm1haWxBZGRyZXNzKCksIGEucGFzc3dvcmQoKSksXG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdCksXG5cdFx0XHRcdG0oXG5cdFx0XHRcdFx0XCJwLmNlbnRlci5zdGF0dXNUZXh0Q29sb3IubXQtc1wiLFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XHRcdC8vIGJyb3dzZXIgcmVzZXRcblx0XHRcdFx0XHRcdFx0bWFyZ2luQm90dG9tOiAwLFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdG0oXCJzbWFsbFwiLCBsaXZlRGF0YUF0dHJzKCksIFtcblx0XHRcdFx0XHRcdGEuaGVscFRleHQgPyBhLmhlbHBUZXh0IDogbnVsbCxcblx0XHRcdFx0XHRcdFwiIFwiLFxuXHRcdFx0XHRcdFx0YS5pbnZhbGlkQ3JlZGVudGlhbHMgJiYgYS5zaG93UmVjb3ZlcnlPcHRpb25cblx0XHRcdFx0XHRcdFx0PyBtKFxuXHRcdFx0XHRcdFx0XHRcdFx0XCJhXCIsXG5cdFx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGhyZWY6IFwiL3JlY292ZXJcIixcblx0XHRcdFx0XHRcdFx0XHRcdFx0b25jbGljazogKGU6IE1vdXNlRXZlbnQpID0+IHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRtLnJvdXRlLnNldChcIi9yZWNvdmVyXCIsIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdG1haWxBZGRyZXNzOiBhLm1haWxBZGRyZXNzKCksXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRyZXNldEFjdGlvbjogXCJwYXNzd29yZFwiLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpXG5cdFx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdFx0bGFuZy5nZXQoXCJyZWNvdmVyQWNjb3VudEFjY2Vzc19hY3Rpb25cIiksXG5cdFx0XHRcdFx0XHRcdCAgKVxuXHRcdFx0XHRcdFx0XHQ6IGEuYWNjZXNzRXhwaXJlZCAmJiBhLmFjY2Vzc0V4cGlyZWRcblx0XHRcdFx0XHRcdFx0PyBtKFxuXHRcdFx0XHRcdFx0XHRcdFx0XCJhXCIsXG5cdFx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdC8vIFdlIGltcG9ydCB0aGUgZGlhbG9nIGRpcmVjdGx5IHJhdGhlciB0aGFuIHJlZGlyZWN0aW5nIHRvIC9yZWNvdmVyIGhlcmUgaW4gb3JkZXIgdG8gbm90IHBhc3MgdGhlIHBhc3N3b3JkIGluIHBsYWludGV4dCB2aWEgdGhlIFVSTFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRocmVmOiBcIiNcIixcblx0XHRcdFx0XHRcdFx0XHRcdFx0b25jbGljazogKGU6IE1vdXNlRXZlbnQpID0+IHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRpbXBvcnQoXCIuL3JlY292ZXIvVGFrZU92ZXJEZWxldGVkQWRkcmVzc0RpYWxvZy5qc1wiKS50aGVuKCh7IHNob3dUYWtlT3ZlckRpYWxvZyB9KSA9PlxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0c2hvd1Rha2VPdmVyRGlhbG9nKGEubWFpbEFkZHJlc3MoKSwgYS5wYXNzd29yZCgpKSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHQpXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpXG5cdFx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdFx0bGFuZy5nZXQoXCJoZWxwX2xhYmVsXCIpLFxuXHRcdFx0XHRcdFx0XHQgIClcblx0XHRcdFx0XHRcdFx0OiBudWxsLFxuXHRcdFx0XHRcdF0pLFxuXHRcdFx0XHQpLFxuXHRcdFx0XSxcblx0XHQpXG5cdH1cbn1cbiIsImltcG9ydCBtLCB7IENoaWxkcmVuLCBDb21wb25lbnQsIFZub2RlIH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgQnV0dG9uLCBCdXR0b25UeXBlIH0gZnJvbSBcIi4uL2d1aS9iYXNlL0J1dHRvbi5qc1wiXG5pbXBvcnQgeyBMb2dpbkJ1dHRvbiB9IGZyb20gXCIuLi9ndWkvYmFzZS9idXR0b25zL0xvZ2luQnV0dG9uLmpzXCJcbmltcG9ydCB7IENyZWRlbnRpYWxzSW5mbyB9IGZyb20gXCIuLi9uYXRpdmUvY29tbW9uL2dlbmVyYXRlZGlwYy9DcmVkZW50aWFsc0luZm8uanNcIlxuaW1wb3J0IHsgbGFuZyB9IGZyb20gXCIuLi9taXNjL0xhbmd1YWdlVmlld01vZGVsLmpzXCJcblxuZXhwb3J0IHR5cGUgQ3JlZGVudGlhbHNTZWxlY3RvckF0dHJzID0ge1xuXHRjcmVkZW50aWFsczogUmVhZG9ubHlBcnJheTxDcmVkZW50aWFsc0luZm8+XG5cdG9uQ3JlZGVudGlhbHNTZWxlY3RlZDogKGFyZzA6IENyZWRlbnRpYWxzSW5mbykgPT4gdW5rbm93blxuXHQvLyB3aWxsIHNob3cgdGhlIGRlbGV0ZSBvcHRpb25zIGlmIHRoaXMgaXMgcHJvdmlkZWRcblx0b25DcmVkZW50aWFsc0RlbGV0ZWQ/OiAoKGFyZzA6IENyZWRlbnRpYWxzSW5mbykgPT4gdm9pZCkgfCBudWxsXG59XG5cbmV4cG9ydCBjbGFzcyBDcmVkZW50aWFsc1NlbGVjdG9yIGltcGxlbWVudHMgQ29tcG9uZW50PENyZWRlbnRpYWxzU2VsZWN0b3JBdHRycz4ge1xuXHR2aWV3KHZub2RlOiBWbm9kZTxDcmVkZW50aWFsc1NlbGVjdG9yQXR0cnM+KTogQ2hpbGRyZW4ge1xuXHRcdGNvbnN0IGEgPSB2bm9kZS5hdHRyc1xuXHRcdHJldHVybiBhLmNyZWRlbnRpYWxzLm1hcCgoYykgPT4ge1xuXHRcdFx0Y29uc3QgYnV0dG9uczogQ2hpbGRyZW4gPSBbXVxuXHRcdFx0Y29uc3Qgb25DcmVkZW50aWFsc0RlbGV0ZWQgPSBhLm9uQ3JlZGVudGlhbHNEZWxldGVkXG5cdFx0XHRidXR0b25zLnB1c2goXG5cdFx0XHRcdG0oTG9naW5CdXR0b24sIHtcblx0XHRcdFx0XHRsYWJlbDogbGFuZy5tYWtlVHJhbnNsYXRpb24oXCJsb2dpbl9sYWJlbFwiLCBjLmxvZ2luKSxcblx0XHRcdFx0XHRvbmNsaWNrOiAoKSA9PiBhLm9uQ3JlZGVudGlhbHNTZWxlY3RlZChjKSxcblx0XHRcdFx0fSksXG5cdFx0XHQpXG5cblx0XHRcdGlmIChvbkNyZWRlbnRpYWxzRGVsZXRlZCkge1xuXHRcdFx0XHRidXR0b25zLnB1c2goXG5cdFx0XHRcdFx0bShCdXR0b24sIHtcblx0XHRcdFx0XHRcdGxhYmVsOiBcImRlbGV0ZV9hY3Rpb25cIixcblx0XHRcdFx0XHRcdGNsaWNrOiAoKSA9PiBvbkNyZWRlbnRpYWxzRGVsZXRlZChjKSxcblx0XHRcdFx0XHRcdHR5cGU6IEJ1dHRvblR5cGUuU2Vjb25kYXJ5LFxuXHRcdFx0XHRcdH0pLFxuXHRcdFx0XHQpXG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBtKFwiLmZsZXgtc3BhY2UtYmV0d2Vlbi5wdC5jaGlsZC1ncm93Lmxhc3QtY2hpbGQtZml4ZWRcIiwgYnV0dG9ucylcblx0XHR9KVxuXHR9XG59XG4iLCJpbXBvcnQgbSwgeyBDaGlsZHJlbiB9IGZyb20gXCJtaXRocmlsXCJcbmltcG9ydCB7IGlzQXBwLCBpc0Rlc2t0b3AgfSBmcm9tIFwiLi4vYXBpL2NvbW1vbi9FbnYuanNcIlxuaW1wb3J0IHsgRXh0ZXJuYWxMaW5rIH0gZnJvbSBcIi4vYmFzZS9FeHRlcm5hbExpbmsuanNcIlxuaW1wb3J0IHsgSW5mb0xpbmssIGxhbmcgfSBmcm9tIFwiLi4vbWlzYy9MYW5ndWFnZVZpZXdNb2RlbC5qc1wiXG5pbXBvcnQgeyBjcmVhdGVEcm9wZG93biB9IGZyb20gXCIuL2Jhc2UvRHJvcGRvd24uanNcIlxuaW1wb3J0IHsgbWFwTnVsbGFibGUgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IGdldFdoaXRlbGFiZWxDdXN0b21pemF0aW9ucyB9IGZyb20gXCIuLi9taXNjL1doaXRlbGFiZWxDdXN0b21pemF0aW9ucy5qc1wiXG5pbXBvcnQgeyBEaWFsb2cgfSBmcm9tIFwiLi9iYXNlL0RpYWxvZy5qc1wiXG5pbXBvcnQgeyBCdXR0b25UeXBlIH0gZnJvbSBcIi4vYmFzZS9CdXR0b24uanNcIlxuaW1wb3J0IHsgY29weVRvQ2xpcGJvYXJkIH0gZnJvbSBcIi4uL21pc2MvQ2xpcGJvYXJkVXRpbHMuanNcIlxuaW1wb3J0IHsgbG9jYXRvciB9IGZyb20gXCIuLi9hcGkvbWFpbi9Db21tb25Mb2NhdG9yLmpzXCJcbmltcG9ydCB7IGNsaWVudEluZm9TdHJpbmcgfSBmcm9tIFwiLi4vbWlzYy9FcnJvclJlcG9ydGVyLmpzXCJcblxuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlckluZm9MaW5rcygpOiBDaGlsZHJlbiB7XG5cdGNvbnN0IHByaXZhY3lQb2xpY3lMaW5rID0gZ2V0UHJpdmFjeVN0YXRlbWVudExpbmsoKVxuXHRjb25zdCBpbXByaW50TGluayA9IGdldEltcHJpbnRMaW5rKClcblx0cmV0dXJuIG0oXG5cdFx0XCIuZmxleC5jb2wubXQtbFwiLFxuXHRcdG0oXG5cdFx0XHRcIi5mbGV4LndyYXAuanVzdGlmeS1jZW50ZXJcIixcblx0XHRcdCFpc0FwcCgpICYmIHByaXZhY3lQb2xpY3lMaW5rXG5cdFx0XHRcdD8gbShFeHRlcm5hbExpbmssIHtcblx0XHRcdFx0XHRcdGhyZWY6IHByaXZhY3lQb2xpY3lMaW5rLFxuXHRcdFx0XHRcdFx0dGV4dDogbGFuZy5nZXQoXCJwcml2YWN5TGlua19sYWJlbFwiKSxcblx0XHRcdFx0XHRcdGNsYXNzOiBcInBsclwiLFxuXHRcdFx0XHRcdFx0aXNDb21wYW55U2l0ZTogdHJ1ZSxcblx0XHRcdFx0XHRcdHNwZWNpYWxUeXBlOiBcInByaXZhY3ktcG9saWN5XCIsXG5cdFx0XHRcdCAgfSlcblx0XHRcdFx0OiBudWxsLFxuXHRcdFx0IWlzQXBwKCkgJiYgaW1wcmludExpbmtcblx0XHRcdFx0PyBtKEV4dGVybmFsTGluaywge1xuXHRcdFx0XHRcdFx0aHJlZjogaW1wcmludExpbmssXG5cdFx0XHRcdFx0XHR0ZXh0OiBsYW5nLmdldChcImltcHJpbnRfbGFiZWxcIiksXG5cdFx0XHRcdFx0XHRjbGFzczogXCJwbHJcIixcblx0XHRcdFx0XHRcdGlzQ29tcGFueVNpdGU6IHRydWUsXG5cdFx0XHRcdFx0XHRzcGVjaWFsVHlwZTogXCJsaWNlbnNlXCIsXG5cdFx0XHRcdCAgfSlcblx0XHRcdFx0OiBudWxsLFxuXHRcdCksXG5cdFx0bShcblx0XHRcdFwiLm10Lm1iLmNlbnRlci5zbWFsbC5mdWxsLXdpZHRoXCIsXG5cdFx0XHR7XG5cdFx0XHRcdG9uY2xpY2s6IChlOiBNb3VzZUV2ZW50KSA9PiBzaG93VmVyc2lvbkRyb3Bkb3duKGUpLFxuXHRcdFx0fSxcblx0XHRcdGB2JHtlbnYudmVyc2lvbk51bWJlcn1gLFxuXHRcdCksXG5cdClcbn1cblxuZnVuY3Rpb24gZ2V0SW1wcmludExpbmsoKTogc3RyaW5nIHwgbnVsbCB7XG5cdHJldHVybiBtYXBOdWxsYWJsZShnZXRXaGl0ZWxhYmVsQ3VzdG9taXphdGlvbnMod2luZG93KSwgKGMpID0+IGMuaW1wcmludFVybCkgfHwgSW5mb0xpbmsuQWJvdXRcbn1cblxuZnVuY3Rpb24gZ2V0UHJpdmFjeVN0YXRlbWVudExpbmsoKTogc3RyaW5nIHwgbnVsbCB7XG5cdHJldHVybiBtYXBOdWxsYWJsZShnZXRXaGl0ZWxhYmVsQ3VzdG9taXphdGlvbnMod2luZG93KSwgKGMpID0+IGMucHJpdmFjeVN0YXRlbWVudFVybCkgfHwgSW5mb0xpbmsuUHJpdmFjeVxufVxuXG4vKipcbiAqIFNob3cgYSBzaW1wbGUgZGlhbG9nIHdpdGggY2xpZW50IGluZm8gYW5kIGFsbCB0aGUgbG9ncyBpbnNpZGUgb2YgaXQuXG4gKi9cbmZ1bmN0aW9uIHNob3dWZXJzaW9uRHJvcGRvd24oZTogTW91c2VFdmVudCkge1xuXHQvLyBBIHNlbWktaGlkZGVuIG9wdGlvbiB0byBnZXQgdGhlIGxvZ3MgYmVmb3JlIGxvZ2dpbmcgaW4sIGluIGEgdGV4dCBmb3JtXG5cdGNyZWF0ZURyb3Bkb3duKHtcblx0XHRsYXp5QnV0dG9uczogKCkgPT4gW1xuXHRcdFx0e1xuXHRcdFx0XHRsYWJlbDogXCJnZXRMb2dzX2FjdGlvblwiLFxuXHRcdFx0XHRjbGljazogKCkgPT4gc2hvd0xvZ3NEaWFsb2coKSxcblx0XHRcdH0sXG5cdFx0XSxcblx0fSkoZSwgZS50YXJnZXQgYXMgSFRNTEVsZW1lbnQpXG59XG5cbmFzeW5jIGZ1bmN0aW9uIHNob3dMb2dzRGlhbG9nKCkge1xuXHRjb25zdCBsb2dDb250ZW50ID0gYXdhaXQgcHJlcGFyZUxvZ0NvbnRlbnQoKVxuXG5cdGNvbnN0IGRpYWxvZzogRGlhbG9nID0gRGlhbG9nLmVkaXREaWFsb2coXG5cdFx0e1xuXHRcdFx0bWlkZGxlOiBsYW5nLm1ha2VUcmFuc2xhdGlvbihcImxvZ3NcIiwgXCJMb2dzXCIpLFxuXHRcdFx0cmlnaHQ6ICgpID0+IFtcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHR5cGU6IEJ1dHRvblR5cGUuU2Vjb25kYXJ5LFxuXHRcdFx0XHRcdGxhYmVsOiBcImNvcHlfYWN0aW9uXCIsXG5cdFx0XHRcdFx0Y2xpY2s6ICgpID0+IGNvcHlUb0NsaXBib2FyZChsb2dDb250ZW50KSxcblx0XHRcdFx0fSxcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHR5cGU6IEJ1dHRvblR5cGUuUHJpbWFyeSxcblx0XHRcdFx0XHRsYWJlbDogXCJva19hY3Rpb25cIixcblx0XHRcdFx0XHRjbGljazogKCkgPT4gZGlhbG9nLmNsb3NlKCksXG5cdFx0XHRcdH0sXG5cdFx0XHRdLFxuXHRcdH0sXG5cdFx0Y2xhc3Mge1xuXHRcdFx0dmlldygpIHtcblx0XHRcdFx0cmV0dXJuIG0oXCIuZmlsbC1hYnNvbHV0ZS5zZWxlY3RhYmxlLnNjcm9sbC53aGl0ZS1zcGFjZS1wcmUucGxyLnB0LnBiXCIsIGxvZ0NvbnRlbnQpXG5cdFx0XHR9XG5cdFx0fSxcblx0XHR7fSxcblx0KVxuXHRkaWFsb2cuc2hvdygpXG59XG5cbmFzeW5jIGZ1bmN0aW9uIHByZXBhcmVMb2dDb250ZW50KCkge1xuXHRjb25zdCBlbnRyaWVzOiBzdHJpbmdbXSA9IFtdXG5cdGlmICh3aW5kb3cubG9nZ2VyKSB7XG5cdFx0ZW50cmllcy5wdXNoKGA9PSBNQUlOIExPRyA9PVxuJHt3aW5kb3cubG9nZ2VyLmdldEVudHJpZXMoKS5qb2luKFwiXFxuXCIpfVxuYClcblx0fVxuXHRjb25zdCB3b3JrZXJMb2cgPSBhd2FpdCBsb2NhdG9yLndvcmtlckZhY2FkZS5nZXRMb2coKVxuXHRpZiAod29ya2VyTG9nLmxlbmd0aCA+IDApIHtcblx0XHRlbnRyaWVzLnB1c2goYD09IFdPUktFUiBMT0cgPT1cbiR7d29ya2VyTG9nLmpvaW4oXCJcXG5cIil9XG5gKVxuXHR9XG5cblx0aWYgKGlzRGVza3RvcCgpIHx8IGlzQXBwKCkpIHtcblx0XHRlbnRyaWVzLnB1c2goYD09IE5BVElWRSBMT0cgPT1cbiR7YXdhaXQgbG9jYXRvci5jb21tb25TeXN0ZW1GYWNhZGUuZ2V0TG9nKCl9XG5gKVxuXHR9XG5cdGxldCB7IG1lc3NhZ2UsIHR5cGUsIGNsaWVudCB9ID0gY2xpZW50SW5mb1N0cmluZyhuZXcgRGF0ZSgpLCBmYWxzZSlcblx0cmV0dXJuIGB2JHtlbnYudmVyc2lvbk51bWJlcn0gLSAke2NsaWVudH1cbiR7bWVzc2FnZX1cblxuJHtlbnRyaWVzLmpvaW4oXCJcXG5cIil9YFxufVxuIiwiaW1wb3J0IG0sIHsgQ2hpbGRyZW4sIFZub2RlIH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgY2xpZW50IH0gZnJvbSBcIi4uL21pc2MvQ2xpZW50RGV0ZWN0b3IuanNcIlxuaW1wb3J0IHsgYXNzZXJ0TWFpbk9yTm9kZSwgaXNBcHAsIGlzRGVza3RvcCB9IGZyb20gXCIuLi9hcGkvY29tbW9uL0VudlwiXG5pbXBvcnQgeyBsYW5nLCBUcmFuc2xhdGlvbktleSwgTWF5YmVUcmFuc2xhdGlvbiB9IGZyb20gXCIuLi9taXNjL0xhbmd1YWdlVmlld01vZGVsLmpzXCJcbmltcG9ydCB7IGRlZmVyLCBEZWZlcnJlZE9iamVjdCwgbWFwTnVsbGFibGUgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IEJvb3RJY29ucyB9IGZyb20gXCIuLi9ndWkvYmFzZS9pY29ucy9Cb290SWNvbnNcIlxuaW1wb3J0IHsgc2hvd1Byb2dyZXNzRGlhbG9nIH0gZnJvbSBcIi4uL2d1aS9kaWFsb2dzL1Byb2dyZXNzRGlhbG9nXCJcbmltcG9ydCB7IHdpbmRvd0ZhY2FkZSB9IGZyb20gXCIuLi9taXNjL1dpbmRvd0ZhY2FkZS5qc1wiXG5pbXBvcnQgeyBEZXZpY2VUeXBlIH0gZnJvbSBcIi4uL21pc2MvQ2xpZW50Q29uc3RhbnRzLmpzXCJcbmltcG9ydCB7IEJ1dHRvbiwgQnV0dG9uVHlwZSB9IGZyb20gXCIuLi9ndWkvYmFzZS9CdXR0b24uanNcIlxuaW1wb3J0IHsgQXJpYUxhbmRtYXJrcywgbGFuZG1hcmtBdHRycywgbGl2ZURhdGFBdHRycyB9IGZyb20gXCIuLi9ndWkvQXJpYVV0aWxzXCJcbmltcG9ydCB7IERpc3BsYXlNb2RlLCBMb2dpblN0YXRlLCBMb2dpblZpZXdNb2RlbCB9IGZyb20gXCIuL0xvZ2luVmlld01vZGVsLmpzXCJcbmltcG9ydCB7IExvZ2luRm9ybSB9IGZyb20gXCIuL0xvZ2luRm9ybS5qc1wiXG5pbXBvcnQgeyBDcmVkZW50aWFsc1NlbGVjdG9yIH0gZnJvbSBcIi4vQ3JlZGVudGlhbHNTZWxlY3Rvci5qc1wiXG5pbXBvcnQgeyBnZXRXaGl0ZWxhYmVsQ3VzdG9taXphdGlvbnMgfSBmcm9tIFwiLi4vbWlzYy9XaGl0ZWxhYmVsQ3VzdG9taXphdGlvbnMuanNcIlxuaW1wb3J0IHsgY3JlYXRlQXN5bmNEcm9wZG93biwgRHJvcGRvd25CdXR0b25BdHRycyB9IGZyb20gXCIuLi9ndWkvYmFzZS9Ecm9wZG93bi5qc1wiXG5pbXBvcnQgdHlwZSB7IENsaWNrSGFuZGxlciB9IGZyb20gXCIuLi9ndWkvYmFzZS9HdWlVdGlsc1wiXG5pbXBvcnQgeyBJY29uQnV0dG9uIH0gZnJvbSBcIi4uL2d1aS9iYXNlL0ljb25CdXR0b24uanNcIlxuaW1wb3J0IHsgQmFzZVRvcExldmVsVmlldyB9IGZyb20gXCIuLi9ndWkvQmFzZVRvcExldmVsVmlldy5qc1wiXG5pbXBvcnQgeyBUb3BMZXZlbEF0dHJzLCBUb3BMZXZlbFZpZXcgfSBmcm9tIFwiLi4vLi4vVG9wTGV2ZWxWaWV3LmpzXCJcbmltcG9ydCB7IExvZ2luU2NyZWVuSGVhZGVyIH0gZnJvbSBcIi4uL2d1aS9Mb2dpblNjcmVlbkhlYWRlci5qc1wiXG5pbXBvcnQgeyBzdHlsZXMgfSBmcm9tIFwiLi4vZ3VpL3N0eWxlcy5qc1wiXG5pbXBvcnQgeyBsb2NhdG9yIH0gZnJvbSBcIi4uL2FwaS9tYWluL0NvbW1vbkxvY2F0b3IuanNcIlxuaW1wb3J0IHsgcmVuZGVySW5mb0xpbmtzIH0gZnJvbSBcIi4uL2d1aS9SZW5kZXJMb2dpbkluZm9MaW5rcy5qc1wiXG5pbXBvcnQgeyBzaG93U25hY2tCYXIgfSBmcm9tIFwiLi4vZ3VpL2Jhc2UvU25hY2tCYXIuanNcIlxuXG5hc3NlcnRNYWluT3JOb2RlKClcblxuZXhwb3J0IGludGVyZmFjZSBMb2dpblZpZXdBdHRycyBleHRlbmRzIFRvcExldmVsQXR0cnMge1xuXHQvKiogRGVmYXVsdCBwYXRoIHRvIHJlZGlyZWN0IHRvIGFmdGVyIHRoZSBsb2dpbi4gQ2FuIGJlIG92ZXJyaWRkZW4gd2l0aCBxdWVyeSBwYXJhbSBgcmVxdWVzdGVkUGF0aGAuICovXG5cdHRhcmdldFBhdGg6IHN0cmluZ1xuXHRtYWtlVmlld01vZGVsOiAoKSA9PiBMb2dpblZpZXdNb2RlbFxufVxuXG4vKiogY3JlYXRlIGEgc3RyaW5nIHByb3ZpZGVyIHRoYXQgY2hhbmdlcyBwZXJpb2RpY2FsbHkgdW50aWwgcHJvbWlzZSBpcyByZXNvbHZlZCAqL1xuZnVuY3Rpb24gbWFrZUR5bmFtaWNMb2dnaW5nSW5NZXNzYWdlKHByb21pc2U6IFByb21pc2U8dW5rbm93bj4pOiAoKSA9PiBUcmFuc2xhdGlvbktleSB7XG5cdGNvbnN0IG1lc3NhZ2VBcnJheTogQXJyYXk8VHJhbnNsYXRpb25LZXk+ID0gW1xuXHRcdFwiZHluYW1pY0xvZ2luRGVjcnlwdGluZ01haWxzX21zZ1wiLFxuXHRcdFwiZHluYW1pY0xvZ2luT3JnYW5pemluZ0NhbGVuZGFyRXZlbnRzX21zZ1wiLFxuXHRcdFwiZHluYW1pY0xvZ2luU29ydGluZ0NvbnRhY3RzX21zZ1wiLFxuXHRcdFwiZHluYW1pY0xvZ2luVXBkYXRpbmdPZmZsaW5lRGF0YWJhc2VfbXNnXCIsXG5cdFx0XCJkeW5hbWljTG9naW5DeWNsaW5nVG9Xb3JrX21zZ1wiLFxuXHRcdFwiZHluYW1pY0xvZ2luUmVzdG9ja2luZ1R1dGFGcmlkZ2VfbXNnXCIsXG5cdFx0XCJkeW5hbWljTG9naW5QcmVwYXJpbmdSb2NrZXRMYXVuY2hfbXNnXCIsXG5cdFx0XCJkeW5hbWljTG9naW5Td2l0Y2hpbmdPblByaXZhY3lfbXNnXCIsXG5cdF1cblx0bGV0IGN1cnJlbnRNZXNzYWdlOiBUcmFuc2xhdGlvbktleSA9IFwibG9naW5fbXNnXCJcblx0bGV0IG1lc3NhZ2VJbmRleDogbnVtYmVyID0gMFxuXHRjb25zdCBtZXNzYWdlSW50ZXJ2YWxJZCA9IHNldEludGVydmFsKCgpID0+IHtcblx0XHRjdXJyZW50TWVzc2FnZSA9IG1lc3NhZ2VBcnJheVttZXNzYWdlSW5kZXhdXG5cdFx0bWVzc2FnZUluZGV4ID0gKyttZXNzYWdlSW5kZXggJSA4XG5cdFx0bS5yZWRyYXcoKVxuXHR9LCA0MDAwIC8qKiBzcGlubmVyIHNwaW5zIGV2ZXJ5IDJzICovKVxuXHRwcm9taXNlLmZpbmFsbHkoKCkgPT4gY2xlYXJJbnRlcnZhbChtZXNzYWdlSW50ZXJ2YWxJZCkpXG5cdHJldHVybiAoKSA9PiBjdXJyZW50TWVzc2FnZVxufVxuXG5leHBvcnQgY2xhc3MgTG9naW5WaWV3IGV4dGVuZHMgQmFzZVRvcExldmVsVmlldyBpbXBsZW1lbnRzIFRvcExldmVsVmlldzxMb2dpblZpZXdBdHRycz4ge1xuXHRwcml2YXRlIHJlYWRvbmx5IHZpZXdNb2RlbDogTG9naW5WaWV3TW9kZWxcblx0cHJpdmF0ZSByZWFkb25seSBkZWZhdWx0UmVkaXJlY3Q6IHN0cmluZ1xuXHRwcml2YXRlIHJlYWRvbmx5IGluaXRQcm9taXNlOiBQcm9taXNlPHZvaWQ+XG5cblx0cHJpdmF0ZSBtb3JlRXhwYW5kZWQ6IGJvb2xlYW5cblx0Ly8gd2Ugc2F2ZSB0aGUgbG9naW4gZm9ybSBiZWNhdXNlIHdlIG5lZWQgYWNjZXNzIHRvIHRoZSBwYXNzd29yZCBpbnB1dCBmaWVsZCBpbnNpZGUgb2YgaXQgZm9yIHdoZW4gXCJsb2dpbldpdGhcIiBpcyBzZXQgaW4gdGhlIHVybCxcblx0Ly8gaW4gb3JkZXIgdG8gZm9jdXMgaXRcblx0cHJpdmF0ZSBsb2dpbkZvcm06IERlZmVycmVkT2JqZWN0PExvZ2luRm9ybT5cblx0cHJpdmF0ZSBzZWxlY3RlZFJlZGlyZWN0OiBzdHJpbmdcblx0cHJpdmF0ZSBib3R0b21NYXJnaW4gPSAwXG5cblx0Y29uc3RydWN0b3IoeyBhdHRycyB9OiBWbm9kZTxMb2dpblZpZXdBdHRycz4pIHtcblx0XHRzdXBlcigpXG5cdFx0dGhpcy5kZWZhdWx0UmVkaXJlY3QgPSBhdHRycy50YXJnZXRQYXRoXG5cdFx0dGhpcy5zZWxlY3RlZFJlZGlyZWN0ID0gdGhpcy5kZWZhdWx0UmVkaXJlY3RcblxuXHRcdHRoaXMubG9naW5Gb3JtID0gZGVmZXIoKVxuXHRcdHRoaXMubW9yZUV4cGFuZGVkID0gZmFsc2Vcblx0XHR0aGlzLnZpZXdNb2RlbCA9IGF0dHJzLm1ha2VWaWV3TW9kZWwoKVxuXHRcdHRoaXMuaW5pdFByb21pc2UgPSB0aGlzLnZpZXdNb2RlbC5pbml0KCkudGhlbihtLnJlZHJhdylcblx0fVxuXG5cdGtleWJvYXJkTGlzdGVuZXIgPSAoa2V5Ym9hcmRTaXplOiBudW1iZXIpID0+IHtcblx0XHR0aGlzLmJvdHRvbU1hcmdpbiA9IGtleWJvYXJkU2l6ZVxuXHRcdG0ucmVkcmF3KClcblx0fVxuXG5cdHZpZXcoeyBhdHRycyB9OiBWbm9kZTxMb2dpblZpZXdBdHRycz4pIHtcblx0XHRyZXR1cm4gbShcblx0XHRcdFwiI2xvZ2luLXZpZXcubWFpbi12aWV3LmZsZXguY29sLm5hdi1iZ1wiLFxuXHRcdFx0e1xuXHRcdFx0XHRvbmNyZWF0ZTogKCkgPT4gd2luZG93RmFjYWRlLmFkZEtleWJvYXJkU2l6ZUxpc3RlbmVyKHRoaXMua2V5Ym9hcmRMaXN0ZW5lciksXG5cdFx0XHRcdG9ucmVtb3ZlOiAoKSA9PiB3aW5kb3dGYWNhZGUucmVtb3ZlS2V5Ym9hcmRTaXplTGlzdGVuZXIodGhpcy5rZXlib2FyZExpc3RlbmVyKSxcblx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRtYXJnaW5Cb3R0b206IHRoaXMuYm90dG9tTWFyZ2luICsgXCJweFwiLFxuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHRcdFtcblx0XHRcdFx0bShMb2dpblNjcmVlbkhlYWRlciksXG5cdFx0XHRcdG0oXG5cdFx0XHRcdFx0XCIuZmxleC1ncm93LmZsZXgtY2VudGVyLnNjcm9sbFwiLFxuXHRcdFx0XHRcdG0oXG5cdFx0XHRcdFx0XHRcIi5mbGV4LmNvbC5mbGV4LWdyb3ctc2hyaW5rLWF1dG8ubWF4LXdpZHRoLW0ucGxyLWwuXCIgKyAoc3R5bGVzLmlzU2luZ2xlQ29sdW1uTGF5b3V0KCkgPyBcInB0XCIgOiBcInB0LWxcIiksXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdC4uLmxhbmRtYXJrQXR0cnMoQXJpYUxhbmRtYXJrcy5NYWluLCBpc0FwcCgpIHx8IGlzRGVza3RvcCgpID8gbGFuZy5nZXQoXCJhZGRBY2NvdW50X2FjdGlvblwiKSA6IGxhbmcuZ2V0KFwibG9naW5fbGFiZWxcIikpLFxuXHRcdFx0XHRcdFx0XHRvbmNyZWF0ZTogKHZub2RlKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0Oyh2bm9kZS5kb20gYXMgSFRNTEVsZW1lbnQpLmZvY3VzKClcblx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRbXG5cdFx0XHRcdFx0XHRcdG0oXG5cdFx0XHRcdFx0XHRcdFx0XCIuY29udGVudC1iZy5ib3JkZXItcmFkaXVzLWJpZy5wYlwiLFxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdGNsYXNzOiBzdHlsZXMuaXNTaW5nbGVDb2x1bW5MYXlvdXQoKSA/IFwicGxyLWxcIiA6IFwicGxyLTJsXCIsXG5cdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHR0aGlzLl9yZW5kZXJGb3JtRm9yRGlzcGxheU1vZGUoKSxcblx0XHRcdFx0XHRcdFx0XHR0aGlzLnJlbmRlck1vcmVPcHRpb25zKCksXG5cdFx0XHRcdFx0XHRcdCksXG5cdFx0XHRcdFx0XHRcdG0oXCIuZmxleC1ncm93XCIpLFxuXHRcdFx0XHRcdFx0XHQhKGlzQXBwKCkgfHwgaXNEZXNrdG9wKCkpICYmIHRoaXMudmlld01vZGVsLnNob3VsZFNob3dBcHBCdXR0b25zKCkgPyB0aGlzLl9yZW5kZXJBcHBCdXR0b25zKCkgOiBudWxsLFxuXHRcdFx0XHRcdFx0XHRyZW5kZXJJbmZvTGlua3MoKSxcblx0XHRcdFx0XHRcdF0sXG5cdFx0XHRcdFx0KSxcblx0XHRcdFx0KSxcblx0XHRcdF0sXG5cdFx0KVxuXHR9XG5cblx0cHJpdmF0ZSBfcmVuZGVyRm9ybUZvckRpc3BsYXlNb2RlKCk6IENoaWxkcmVuIHtcblx0XHRzd2l0Y2ggKHRoaXMudmlld01vZGVsLmRpc3BsYXlNb2RlKSB7XG5cdFx0XHRjYXNlIERpc3BsYXlNb2RlLkRlbGV0ZUNyZWRlbnRpYWxzOlxuXHRcdFx0Y2FzZSBEaXNwbGF5TW9kZS5DcmVkZW50aWFsczpcblx0XHRcdFx0cmV0dXJuIHRoaXMuX3JlbmRlckNyZWRlbnRpYWxzU2VsZWN0b3IoKVxuXHRcdFx0Y2FzZSBEaXNwbGF5TW9kZS5Gb3JtOlxuXHRcdFx0XHRyZXR1cm4gdGhpcy5fcmVuZGVyTG9naW5Gb3JtKClcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIHJlbmRlck1vcmVPcHRpb25zKCk6IENoaWxkcmVuIHtcblx0XHRyZXR1cm4gbShcIi5mbGV4LWNlbnRlci5mbGV4LWNvbHVtblwiLCBbXG5cdFx0XHR0aGlzLl9sb2dpbkFub3RoZXJMaW5rVmlzaWJsZSgpXG5cdFx0XHRcdD8gbShCdXR0b24sIHtcblx0XHRcdFx0XHRcdGxhYmVsOiBcImxvZ2luT3RoZXJBY2NvdW50X2FjdGlvblwiLFxuXHRcdFx0XHRcdFx0dHlwZTogQnV0dG9uVHlwZS5TZWNvbmRhcnksXG5cdFx0XHRcdFx0XHRjbGljazogKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHR0aGlzLnZpZXdNb2RlbC5zaG93TG9naW5Gb3JtKClcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdCAgfSlcblx0XHRcdFx0OiBudWxsLFxuXHRcdFx0dGhpcy5fZGVsZXRlQ3JlZGVudGlhbHNMaW5rVmlzaWJsZSgpXG5cdFx0XHRcdD8gbShCdXR0b24sIHtcblx0XHRcdFx0XHRcdGxhYmVsOiB0aGlzLnZpZXdNb2RlbC5kaXNwbGF5TW9kZSA9PT0gRGlzcGxheU1vZGUuRGVsZXRlQ3JlZGVudGlhbHMgPyBcImNhbmNlbF9hY3Rpb25cIiA6IFwicmVtb3ZlQWNjb3VudF9hY3Rpb25cIixcblx0XHRcdFx0XHRcdHR5cGU6IEJ1dHRvblR5cGUuU2Vjb25kYXJ5LFxuXHRcdFx0XHRcdFx0Y2xpY2s6ICgpID0+IHRoaXMuX3N3aXRjaERlbGV0ZUNyZWRlbnRpYWxzU3RhdGUoKSxcblx0XHRcdFx0ICB9KVxuXHRcdFx0XHQ6IG51bGwsXG5cdFx0XHR0aGlzLl9rbm93bkNyZWRlbnRpYWxzTGlua1Zpc2libGUoKVxuXHRcdFx0XHQ/IG0oQnV0dG9uLCB7XG5cdFx0XHRcdFx0XHRsYWJlbDogXCJrbm93bkNyZWRlbnRpYWxzX2xhYmVsXCIsXG5cdFx0XHRcdFx0XHR0eXBlOiBCdXR0b25UeXBlLlNlY29uZGFyeSxcblx0XHRcdFx0XHRcdGNsaWNrOiAoKSA9PiB0aGlzLnZpZXdNb2RlbC5zaG93Q3JlZGVudGlhbHMoKSxcblx0XHRcdFx0ICB9KVxuXHRcdFx0XHQ6IG51bGwsXG5cdFx0XHR0aGlzLl9zaWdudXBMaW5rVmlzaWJsZSgpXG5cdFx0XHRcdD8gbShCdXR0b24sIHtcblx0XHRcdFx0XHRcdGxhYmVsOiBcInJlZ2lzdGVyX2xhYmVsXCIsXG5cdFx0XHRcdFx0XHR0eXBlOiBCdXR0b25UeXBlLlNlY29uZGFyeSxcblx0XHRcdFx0XHRcdGNsaWNrOiAoKSA9PiBtLnJvdXRlLnNldChcIi9zaWdudXBcIiksXG5cdFx0XHRcdCAgfSlcblx0XHRcdFx0OiBudWxsLFxuXHRcdFx0dGhpcy5fc3dpdGNoVGhlbWVMaW5rVmlzaWJsZSgpXG5cdFx0XHRcdD8gbShCdXR0b24sIHtcblx0XHRcdFx0XHRcdGxhYmVsOiBcInN3aXRjaENvbG9yVGhlbWVfYWN0aW9uXCIsXG5cdFx0XHRcdFx0XHR0eXBlOiBCdXR0b25UeXBlLlNlY29uZGFyeSxcblx0XHRcdFx0XHRcdGNsaWNrOiB0aGlzLnRoZW1lU3dpdGNoTGlzdGVuZXIoKSxcblx0XHRcdFx0ICB9KVxuXHRcdFx0XHQ6IG51bGwsXG5cdFx0XHR0aGlzLl9yZWNvdmVyTG9naW5WaXNpYmxlKClcblx0XHRcdFx0PyBtKEJ1dHRvbiwge1xuXHRcdFx0XHRcdFx0bGFiZWw6IFwicmVjb3ZlckFjY291bnRBY2Nlc3NfYWN0aW9uXCIsXG5cdFx0XHRcdFx0XHRjbGljazogKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRtLnJvdXRlLnNldChcIi9yZWNvdmVyXCIpXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0dHlwZTogQnV0dG9uVHlwZS5TZWNvbmRhcnksXG5cdFx0XHRcdCAgfSlcblx0XHRcdFx0OiBudWxsLFxuXHRcdF0pXG5cdH1cblxuXHR0aGVtZVN3aXRjaExpc3RlbmVyKCk6IENsaWNrSGFuZGxlciB7XG5cdFx0cmV0dXJuIGNyZWF0ZUFzeW5jRHJvcGRvd24oe1xuXHRcdFx0bGF6eUJ1dHRvbnM6IGFzeW5jICgpID0+IHtcblx0XHRcdFx0Y29uc3QgZGVmYXVsdEJ1dHRvbnM6IFJlYWRvbmx5QXJyYXk8RHJvcGRvd25CdXR0b25BdHRycz4gPSBbXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0bGFiZWw6IFwic3lzdGVtVGhlbWVQcmVmX2xhYmVsXCIsXG5cdFx0XHRcdFx0XHRjbGljazogKCkgPT4gbG9jYXRvci50aGVtZUNvbnRyb2xsZXIuc2V0VGhlbWVQcmVmZXJlbmNlKFwiYXV0bzpsaWdodHxkYXJrXCIpLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0bGFiZWw6IFwibGlnaHRfbGFiZWxcIixcblx0XHRcdFx0XHRcdGNsaWNrOiAoKSA9PiBsb2NhdG9yLnRoZW1lQ29udHJvbGxlci5zZXRUaGVtZVByZWZlcmVuY2UoXCJsaWdodFwiKSxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGxhYmVsOiBcImRhcmtfbGFiZWxcIixcblx0XHRcdFx0XHRcdGNsaWNrOiAoKSA9PiBsb2NhdG9yLnRoZW1lQ29udHJvbGxlci5zZXRUaGVtZVByZWZlcmVuY2UoXCJkYXJrXCIpLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0bGFiZWw6IGNsaWVudC5pc0NhbGVuZGFyQXBwKCkgPyBcImxpZ2h0X3JlZF9sYWJlbFwiIDogXCJsaWdodF9ibHVlX2xhYmVsXCIsXG5cdFx0XHRcdFx0XHRjbGljazogKCkgPT4gbG9jYXRvci50aGVtZUNvbnRyb2xsZXIuc2V0VGhlbWVQcmVmZXJlbmNlKFwibGlnaHRfc2Vjb25kYXJ5XCIpLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0bGFiZWw6IGNsaWVudC5pc0NhbGVuZGFyQXBwKCkgPyBcImRhcmtfcmVkX2xhYmVsXCIgOiBcImRhcmtfYmx1ZV9sYWJlbFwiLFxuXHRcdFx0XHRcdFx0Y2xpY2s6ICgpID0+IGxvY2F0b3IudGhlbWVDb250cm9sbGVyLnNldFRoZW1lUHJlZmVyZW5jZShcImRhcmtfc2Vjb25kYXJ5XCIpLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdF1cblx0XHRcdFx0Y29uc3QgY3VzdG9tQnV0dG9ucyA9IChhd2FpdCBsb2NhdG9yLnRoZW1lQ29udHJvbGxlci5nZXRDdXN0b21UaGVtZXMoKSkubWFwKCh0aGVtZUlkKSA9PiB7XG5cdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdGxhYmVsOiBsYW5nLm1ha2VUcmFuc2xhdGlvbih0aGVtZUlkLCB0aGVtZUlkKSxcblx0XHRcdFx0XHRcdGNsaWNrOiAoKSA9PiBsb2NhdG9yLnRoZW1lQ29udHJvbGxlci5zZXRUaGVtZVByZWZlcmVuY2UodGhlbWVJZCksXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KVxuXHRcdFx0XHRyZXR1cm4gZGVmYXVsdEJ1dHRvbnMuY29uY2F0KGN1c3RvbUJ1dHRvbnMpXG5cdFx0XHR9LFxuXHRcdFx0d2lkdGg6IDMwMCxcblx0XHR9KVxuXHR9XG5cblx0X3NpZ251cExpbmtWaXNpYmxlKCk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiB0aGlzLnZpZXdNb2RlbC5kaXNwbGF5TW9kZSA9PT0gRGlzcGxheU1vZGUuRm9ybSAmJiB0aGlzLnZpZXdNb2RlbC5zaG91bGRTaG93U2lnbnVwKClcblx0fVxuXG5cdF9sb2dpbkFub3RoZXJMaW5rVmlzaWJsZSgpOiBib29sZWFuIHtcblx0XHRyZXR1cm4gdGhpcy52aWV3TW9kZWwuZGlzcGxheU1vZGUgPT09IERpc3BsYXlNb2RlLkNyZWRlbnRpYWxzIHx8IHRoaXMudmlld01vZGVsLmRpc3BsYXlNb2RlID09PSBEaXNwbGF5TW9kZS5EZWxldGVDcmVkZW50aWFsc1xuXHR9XG5cblx0X2RlbGV0ZUNyZWRlbnRpYWxzTGlua1Zpc2libGUoKTogYm9vbGVhbiB7XG5cdFx0cmV0dXJuIHRoaXMudmlld01vZGVsLmRpc3BsYXlNb2RlID09PSBEaXNwbGF5TW9kZS5DcmVkZW50aWFscyB8fCB0aGlzLnZpZXdNb2RlbC5kaXNwbGF5TW9kZSA9PT0gRGlzcGxheU1vZGUuRGVsZXRlQ3JlZGVudGlhbHNcblx0fVxuXG5cdF9rbm93bkNyZWRlbnRpYWxzTGlua1Zpc2libGUoKTogYm9vbGVhbiB7XG5cdFx0cmV0dXJuIHRoaXMudmlld01vZGVsLmRpc3BsYXlNb2RlID09PSBEaXNwbGF5TW9kZS5Gb3JtICYmIHRoaXMudmlld01vZGVsLmdldFNhdmVkQ3JlZGVudGlhbHMoKS5sZW5ndGggPiAwXG5cdH1cblxuXHRfc3dpdGNoVGhlbWVMaW5rVmlzaWJsZSgpOiBib29sZWFuIHtcblx0XHRyZXR1cm4gbG9jYXRvci50aGVtZUNvbnRyb2xsZXIuc2hvdWxkQWxsb3dDaGFuZ2luZ1RoZW1lKClcblx0fVxuXG5cdF9yZWNvdmVyTG9naW5WaXNpYmxlKCk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiB0aGlzLnZpZXdNb2RlbC5zaG91bGRTaG93UmVjb3ZlcigpXG5cdH1cblxuXHRfcmVuZGVyTG9naW5Gb3JtKCk6IENoaWxkcmVuIHtcblx0XHRyZXR1cm4gbShcIi5mbGV4LmNvbC5wYlwiLCBbXG5cdFx0XHRtKExvZ2luRm9ybSwge1xuXHRcdFx0XHRvbmNyZWF0ZTogKHZub2RlKSA9PiB7XG5cdFx0XHRcdFx0Y29uc3QgZm9ybSA9IHZub2RlIGFzIFZub2RlPHVua25vd24sIExvZ2luRm9ybT5cblx0XHRcdFx0XHR0aGlzLmxvZ2luRm9ybS5yZXNvbHZlKGZvcm0uc3RhdGUpXG5cdFx0XHRcdH0sXG5cdFx0XHRcdG9ucmVtb3ZlOiAoKSA9PiB7XG5cdFx0XHRcdFx0Ly8gd2UgbmVlZCB0byByZS1yZXNvbHZlIHRoaXMgcHJvbWlzZSBzb21ldGltZXMgYW5kIGZvciB0aGF0IHdlXG5cdFx0XHRcdFx0Ly8gbmVlZCBhIG5ldyBwcm9taXNlLiBvdGhlcndpc2UsIGNhbGxiYWNrcyB0aGF0IGFyZSByZWdpc3RlcmVkIGFmdGVyXG5cdFx0XHRcdFx0Ly8gdGhpcyBwb2ludCBuZXZlciBnZXQgY2FsbGVkIGJlY2F1c2UgdGhleSBoYXZlIGJlZW4gcmVnaXN0ZXJlZCBhZnRlclxuXHRcdFx0XHRcdC8vIGl0IHdhcyByZXNvbHZlZCB0aGUgZmlyc3QgdGltZS5cblx0XHRcdFx0XHR0aGlzLmxvZ2luRm9ybSA9IGRlZmVyKClcblx0XHRcdFx0fSxcblx0XHRcdFx0b25TdWJtaXQ6ICgpID0+IHRoaXMuX2xvZ2luV2l0aFByb2dyZXNzRGlhbG9nKCksXG5cdFx0XHRcdG1haWxBZGRyZXNzOiB0aGlzLnZpZXdNb2RlbC5tYWlsQWRkcmVzcyxcblx0XHRcdFx0cGFzc3dvcmQ6IHRoaXMudmlld01vZGVsLnBhc3N3b3JkLFxuXHRcdFx0XHRzYXZlUGFzc3dvcmQ6IHRoaXMudmlld01vZGVsLnNhdmVQYXNzd29yZCxcblx0XHRcdFx0aGVscFRleHQ6IGxhbmcuZ2V0VHJhbnNsYXRpb25UZXh0KHRoaXMudmlld01vZGVsLmhlbHBUZXh0KSxcblx0XHRcdFx0aW52YWxpZENyZWRlbnRpYWxzOiB0aGlzLnZpZXdNb2RlbC5zdGF0ZSA9PT0gTG9naW5TdGF0ZS5JbnZhbGlkQ3JlZGVudGlhbHMsXG5cdFx0XHRcdHNob3dSZWNvdmVyeU9wdGlvbjogdGhpcy5fcmVjb3ZlckxvZ2luVmlzaWJsZSgpLFxuXHRcdFx0XHRhY2Nlc3NFeHBpcmVkOiB0aGlzLnZpZXdNb2RlbC5zdGF0ZSA9PT0gTG9naW5TdGF0ZS5BY2Nlc3NFeHBpcmVkLFxuXHRcdFx0fSksXG5cdFx0XSlcblx0fVxuXG5cdGFzeW5jIF9sb2dpbldpdGhQcm9ncmVzc0RpYWxvZygpIHtcblx0XHRjb25zdCBsb2dpblByb21pc2UgPSB0aGlzLnZpZXdNb2RlbC5sb2dpbigpXG5cdFx0Y29uc3QgZHluYW1pY01lc3NhZ2UgPSBtYWtlRHluYW1pY0xvZ2dpbmdJbk1lc3NhZ2UobG9naW5Qcm9taXNlKVxuXHRcdGF3YWl0IHNob3dQcm9ncmVzc0RpYWxvZyhkeW5hbWljTWVzc2FnZSwgbG9naW5Qcm9taXNlKVxuXG5cdFx0aWYgKHRoaXMudmlld01vZGVsLnN0YXRlID09PSBMb2dpblN0YXRlLkxvZ2dlZEluKSB7XG5cdFx0XHRtLnJvdXRlLnNldCh0aGlzLnNlbGVjdGVkUmVkaXJlY3QpXG5cdFx0fVxuXHR9XG5cblx0X3JlbmRlckNyZWRlbnRpYWxzU2VsZWN0b3IoKTogQ2hpbGRyZW4ge1xuXHRcdHJldHVybiBtKFwiLmZsZXguY29sLnBiLWxcIiwgW1xuXHRcdFx0bShcblx0XHRcdFx0XCIuc21hbGwuY2VudGVyLnN0YXR1c1RleHRDb2xvclwiLFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0Li4ubGl2ZURhdGFBdHRycygpLFxuXHRcdFx0XHRcdGNsYXNzOiBzdHlsZXMuaXNTaW5nbGVDb2x1bW5MYXlvdXQoKSA/IFwiXCIgOiBcInB0LXhzXCIsXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGxhbmcuZ2V0VHJhbnNsYXRpb25UZXh0KHRoaXMudmlld01vZGVsLmhlbHBUZXh0KSxcblx0XHRcdCksXG5cdFx0XHRtKENyZWRlbnRpYWxzU2VsZWN0b3IsIHtcblx0XHRcdFx0Y3JlZGVudGlhbHM6IHRoaXMudmlld01vZGVsLmdldFNhdmVkQ3JlZGVudGlhbHMoKSxcblx0XHRcdFx0b25DcmVkZW50aWFsc1NlbGVjdGVkOiBhc3luYyAoYykgPT4ge1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMudmlld01vZGVsLnVzZUNyZWRlbnRpYWxzKGMpXG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5fbG9naW5XaXRoUHJvZ3Jlc3NEaWFsb2coKVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRvbkNyZWRlbnRpYWxzRGVsZXRlZDpcblx0XHRcdFx0XHR0aGlzLnZpZXdNb2RlbC5kaXNwbGF5TW9kZSA9PT0gRGlzcGxheU1vZGUuRGVsZXRlQ3JlZGVudGlhbHNcblx0XHRcdFx0XHRcdD8gKGNyZWRlbnRpYWxzKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0dGhpcy52aWV3TW9kZWwuZGVsZXRlQ3JlZGVudGlhbHMoY3JlZGVudGlhbHMpLnRoZW4oKHJlc3VsdCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0aWYgKHJlc3VsdCA9PSBcIm5ldHdvcmtFcnJvclwiKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHNob3dTbmFja0Jhcih7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0bWVzc2FnZTogXCJkZWxldGVDcmVkZW50aWFsT2ZmbGluZV9tc2dcIixcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRidXR0b246IHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGxhYmVsOiBcIm9rX2FjdGlvblwiLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Y2xpY2s6ICgpID0+IHt9LFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHRtLnJlZHJhdygpXG5cdFx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdCAgfVxuXHRcdFx0XHRcdFx0OiBudWxsLFxuXHRcdFx0fSksXG5cdFx0XSlcblx0fVxuXG5cdF9yZW5kZXJBcHBCdXR0b25zKCk6IENoaWxkcmVuIHtcblx0XHRyZXR1cm4gbShcIi5mbGV4LWNlbnRlci5wdC1sLm1sLWJldHdlZW4tc1wiLCBbXG5cdFx0XHRjbGllbnQuaXNEZXNrdG9wRGV2aWNlKCkgfHwgY2xpZW50LmRldmljZSA9PT0gRGV2aWNlVHlwZS5BTkRST0lEXG5cdFx0XHRcdD8gbShJY29uQnV0dG9uLCB7XG5cdFx0XHRcdFx0XHR0aXRsZTogXCJhcHBJbmZvQW5kcm9pZEltYWdlQWx0X2FsdFwiLFxuXHRcdFx0XHRcdFx0Y2xpY2s6IChlKSA9PiB7XG5cdFx0XHRcdFx0XHRcdHRoaXMuX29wZW5VcmwoXCJodHRwczovL3BsYXkuZ29vZ2xlLmNvbS9zdG9yZS9hcHBzL2RldGFpbHM/aWQ9ZGUudHV0YW8udHV0YW5vdGFcIilcblxuXHRcdFx0XHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KClcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRpY29uOiBCb290SWNvbnMuQW5kcm9pZCxcblx0XHRcdFx0ICB9KVxuXHRcdFx0XHQ6IG51bGwsXG5cdFx0XHRjbGllbnQuaXNEZXNrdG9wRGV2aWNlKCkgfHwgY2xpZW50LmRldmljZSA9PT0gRGV2aWNlVHlwZS5JUEFEIHx8IGNsaWVudC5kZXZpY2UgPT09IERldmljZVR5cGUuSVBIT05FXG5cdFx0XHRcdD8gbShJY29uQnV0dG9uLCB7XG5cdFx0XHRcdFx0XHR0aXRsZTogXCJhcHBJbmZvSW9zSW1hZ2VBbHRfYWx0XCIsXG5cdFx0XHRcdFx0XHRjbGljazogKGUpID0+IHtcblx0XHRcdFx0XHRcdFx0dGhpcy5fb3BlblVybChcImh0dHBzOi8vaXR1bmVzLmFwcGxlLmNvbS9hcHAvdHV0YW5vdGEvaWQ5MjI0Mjk2MDk/bXQ9OCZ1bz00JmF0PTEwbFNmYlwiKVxuXG5cdFx0XHRcdFx0XHRcdGUucHJldmVudERlZmF1bHQoKVxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdGljb246IEJvb3RJY29ucy5BcHBsZSxcblx0XHRcdFx0ICB9KVxuXHRcdFx0XHQ6IG51bGwsXG5cdFx0XHRjbGllbnQuaXNEZXNrdG9wRGV2aWNlKCkgfHwgY2xpZW50LmRldmljZSA9PT0gRGV2aWNlVHlwZS5BTkRST0lEXG5cdFx0XHRcdD8gbShJY29uQnV0dG9uLCB7XG5cdFx0XHRcdFx0XHR0aXRsZTogXCJhcHBJbmZvRkRyb2lkSW1hZ2VBbHRfYWx0XCIsXG5cdFx0XHRcdFx0XHRjbGljazogKGUpID0+IHtcblx0XHRcdFx0XHRcdFx0dGhpcy5fb3BlblVybChcImh0dHBzOi8vZi1kcm9pZC5vcmcvcGFja2FnZXMvZGUudHV0YW8udHV0YW5vdGEvXCIpXG5cblx0XHRcdFx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0aWNvbjogQm9vdEljb25zLkZEcm9pZCxcblx0XHRcdFx0ICB9KVxuXHRcdFx0XHQ6IG51bGwsXG5cdFx0XSlcblx0fVxuXG5cdG9uTmV3VXJsKGFyZ3M6IFJlY29yZDxzdHJpbmcsIGFueT4sIHJlcXVlc3RlZFBhdGg6IHN0cmluZykge1xuXHRcdGlmIChhcmdzLnJlcXVlc3RlZFBhdGgpIHtcblx0XHRcdHRoaXMuc2VsZWN0ZWRSZWRpcmVjdCA9IGFyZ3MucmVxdWVzdGVkUGF0aFxuXHRcdH0gZWxzZSBpZiAoYXJncy5hY3Rpb24pIHtcblx0XHRcdC8vIEFjdGlvbiBuZWVkcyBiZSBmb3J3YXJkZWQgdGhpcyB3YXkgaW4gb3JkZXIgdG8gYmUgYWJsZSB0byBkZWFsIHdpdGggY2FzZXMgd2hlcmUgYSB1c2VyIGlzIG5vdCBsb2dnZWQgaW4gYW5kIGNsaWNrc1xuXHRcdFx0Ly8gb24gdGhlIHN1cHBvcnQgbGluayBvbiBvdXIgd2Vic2l0ZSAoaHR0cHM6Ly9hcHAudHV0YS5jb20/YWN0aW9uPXN1cHBvcnRNYWlsKVxuXHRcdFx0dGhpcy5zZWxlY3RlZFJlZGlyZWN0ID0gYC9tYWlsP2FjdGlvbj0ke2FyZ3MuYWN0aW9ufWBcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5zZWxlY3RlZFJlZGlyZWN0ID0gdGhpcy5kZWZhdWx0UmVkaXJlY3Rcblx0XHR9XG5cdFx0dGhpcy5oYW5kbGVMb2dpbkFyZ3VtZW50cyhhcmdzLCByZXF1ZXN0ZWRQYXRoKVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBoYW5kbGVMb2dpbkFyZ3VtZW50cyhhcmdzOiBSZWNvcmQ8c3RyaW5nLCBhbnk+LCByZXF1ZXN0ZWRQYXRoOiBzdHJpbmcpIHtcblx0XHRhd2FpdCB0aGlzLmluaXRQcm9taXNlXG5cdFx0Ly8gc2luY2Ugd2Ugd2FpdCBmb3Igc29tZXRoaW5nIGFzeW5jIGhlcmUgdGhlIFVSTCBtaWdodCBoYXZlIGFscmVhZHkgY2hhbmdlZCBhbmRcblx0XHQvLyB3ZSBzaG91bGRuJ3QgaGFuZGxlIGFueSBvdXRkYXRlZCBVUkwgY2hhbmdlcy5cblx0XHRpZiAobS5yb3V0ZS5nZXQoKSAhPT0gcmVxdWVzdGVkUGF0aCkgcmV0dXJuXG5cblx0XHRjb25zdCBhdXRvTG9naW4gPSBhcmdzLm5vQXV0b0xvZ2luID09IG51bGwgfHwgYXJncy5ub0F1dG9Mb2dpbiA9PT0gZmFsc2VcblxuXHRcdGlmIChhdXRvTG9naW4pIHtcblx0XHRcdGlmIChhcmdzLnVzZXJJZCkge1xuXHRcdFx0XHRhd2FpdCB0aGlzLnZpZXdNb2RlbC51c2VVc2VySWQoYXJncy51c2VySWQpXG5cdFx0XHR9XG5cblx0XHRcdGlmICh0aGlzLnZpZXdNb2RlbC5jYW5Mb2dpbigpKSB7XG5cdFx0XHRcdHRoaXMuX2xvZ2luV2l0aFByb2dyZXNzRGlhbG9nKClcblxuXHRcdFx0XHRtLnJlZHJhdygpXG5cdFx0XHRcdHJldHVyblxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmIChhcmdzLmxvZ2luV2l0aCkge1xuXHRcdFx0dGhpcy52aWV3TW9kZWwuc2hvd0xvZ2luRm9ybSgpXG5cdFx0fVxuXG5cdFx0Ly8gV2Ugd2FudCB0byBmb2N1cyBwYXNzd29yZCBmaWVsZCBpZiBsb2dpbiBmaWVsZCBpcyBhbHJlYWR5IGZpbGxlZCBpblxuXHRcdGlmIChhcmdzLmxvZ2luV2l0aCkge1xuXHRcdFx0dGhpcy5sb2dpbkZvcm0ucHJvbWlzZS50aGVuKChsb2dpbkZvcm06IExvZ2luRm9ybSkgPT4ge1xuXHRcdFx0XHRsb2dpbkZvcm0ubWFpbEFkZHJlc3NUZXh0RmllbGQudmFsdWUgPSBcIlwiXG5cdFx0XHRcdGxvZ2luRm9ybS5wYXNzd29yZFRleHRGaWVsZC52YWx1ZSA9IFwiXCJcblx0XHRcdFx0dGhpcy52aWV3TW9kZWwubWFpbEFkZHJlc3MoYXJncy5sb2dpbldpdGggPz8gXCJcIilcblx0XHRcdFx0dGhpcy52aWV3TW9kZWwucGFzc3dvcmQoXCJcIilcblx0XHRcdFx0bG9naW5Gb3JtLnBhc3N3b3JkVGV4dEZpZWxkLmZvY3VzKClcblx0XHRcdH0pXG5cdFx0fVxuXG5cdFx0bS5yZWRyYXcoKVxuXHR9XG5cblx0X29wZW5VcmwodXJsOiBzdHJpbmcpIHtcblx0XHR3aW5kb3cub3Blbih1cmwsIFwiX2JsYW5rXCIpXG5cdH1cblxuXHRfc3dpdGNoRGVsZXRlQ3JlZGVudGlhbHNTdGF0ZSgpOiB2b2lkIHtcblx0XHR0aGlzLnZpZXdNb2RlbC5zd2l0Y2hEZWxldGVTdGF0ZSgpXG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFdoaXRlbGFiZWxSZWdpc3RyYXRpb25Eb21haW5zKCk6IHN0cmluZ1tdIHtcblx0cmV0dXJuIG1hcE51bGxhYmxlKGdldFdoaXRlbGFiZWxDdXN0b21pemF0aW9ucyh3aW5kb3cpLCAoYykgPT4gYy5yZWdpc3RyYXRpb25Eb21haW5zKSB8fCBbXVxufVxuIiwiaW1wb3J0IHsgQWNjZXNzRXhwaXJlZEVycm9yLCBCYWRSZXF1ZXN0RXJyb3IsIE5vdEF1dGhlbnRpY2F0ZWRFcnJvciB9IGZyb20gXCIuLi9hcGkvY29tbW9uL2Vycm9yL1Jlc3RFcnJvclwiXG5pbXBvcnQgeyBsYW5nLCBNYXliZVRyYW5zbGF0aW9uIH0gZnJvbSBcIi4uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWwuanNcIlxuaW1wb3J0IHsgU2Vjb25kRmFjdG9ySGFuZGxlciB9IGZyb20gXCIuLi9taXNjLzJmYS9TZWNvbmRGYWN0b3JIYW5kbGVyLmpzXCJcbmltcG9ydCB7IGdldExvZ2luRXJyb3JNZXNzYWdlLCBoYW5kbGVFeHBlY3RlZExvZ2luRXJyb3IgfSBmcm9tIFwiLi4vbWlzYy9Mb2dpblV0aWxzLmpzXCJcbmltcG9ydCB0eXBlIHsgTG9naW5Db250cm9sbGVyIH0gZnJvbSBcIi4uL2FwaS9tYWluL0xvZ2luQ29udHJvbGxlclwiXG5pbXBvcnQgc3RyZWFtIGZyb20gXCJtaXRocmlsL3N0cmVhbVwiXG5pbXBvcnQgU3RyZWFtIGZyb20gXCJtaXRocmlsL3N0cmVhbVwiXG5pbXBvcnQgeyBQcm9ncmFtbWluZ0Vycm9yIH0gZnJvbSBcIi4uL2FwaS9jb21tb24vZXJyb3IvUHJvZ3JhbW1pbmdFcnJvclwiXG5pbXBvcnQgdHlwZSB7IENyZWRlbnRpYWxzUHJvdmlkZXIgfSBmcm9tIFwiLi4vbWlzYy9jcmVkZW50aWFscy9DcmVkZW50aWFsc1Byb3ZpZGVyLmpzXCJcbmltcG9ydCB7IENyZWRlbnRpYWxBdXRoZW50aWNhdGlvbkVycm9yIH0gZnJvbSBcIi4uL2FwaS9jb21tb24vZXJyb3IvQ3JlZGVudGlhbEF1dGhlbnRpY2F0aW9uRXJyb3JcIlxuaW1wb3J0IHsgZmlyc3QsIG5vT3AgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IEtleVBlcm1hbmVudGx5SW52YWxpZGF0ZWRFcnJvciB9IGZyb20gXCIuLi9hcGkvY29tbW9uL2Vycm9yL0tleVBlcm1hbmVudGx5SW52YWxpZGF0ZWRFcnJvclwiXG5pbXBvcnQgeyBhc3NlcnRNYWluT3JOb2RlIH0gZnJvbSBcIi4uL2FwaS9jb21tb24vRW52XCJcbmltcG9ydCB7IFNlc3Npb25UeXBlIH0gZnJvbSBcIi4uL2FwaS9jb21tb24vU2Vzc2lvblR5cGVcIlxuaW1wb3J0IHsgRGV2aWNlU3RvcmFnZVVuYXZhaWxhYmxlRXJyb3IgfSBmcm9tIFwiLi4vYXBpL2NvbW1vbi9lcnJvci9EZXZpY2VTdG9yYWdlVW5hdmFpbGFibGVFcnJvclwiXG5pbXBvcnQgeyBEZXZpY2VDb25maWcgfSBmcm9tIFwiLi4vbWlzYy9EZXZpY2VDb25maWcuanNcIlxuaW1wb3J0IHsgZ2V0V2hpdGVsYWJlbFJlZ2lzdHJhdGlvbkRvbWFpbnMgfSBmcm9tIFwiLi9Mb2dpblZpZXcuanNcIlxuaW1wb3J0IHsgQ2FuY2VsbGVkRXJyb3IgfSBmcm9tIFwiLi4vYXBpL2NvbW1vbi9lcnJvci9DYW5jZWxsZWRFcnJvci5qc1wiXG5pbXBvcnQgeyBDcmVkZW50aWFsUmVtb3ZhbEhhbmRsZXIgfSBmcm9tIFwiLi9DcmVkZW50aWFsUmVtb3ZhbEhhbmRsZXIuanNcIlxuaW1wb3J0IHsgTmF0aXZlUHVzaFNlcnZpY2VBcHAgfSBmcm9tIFwiLi4vbmF0aXZlL21haW4vTmF0aXZlUHVzaFNlcnZpY2VBcHAuanNcIlxuaW1wb3J0IHsgQ3JlZGVudGlhbHNJbmZvIH0gZnJvbSBcIi4uL25hdGl2ZS9jb21tb24vZ2VuZXJhdGVkaXBjL0NyZWRlbnRpYWxzSW5mby5qc1wiXG5pbXBvcnQgeyBjcmVkZW50aWFsc1RvVW5lbmNyeXB0ZWQgfSBmcm9tIFwiLi4vbWlzYy9jcmVkZW50aWFscy9DcmVkZW50aWFscy5qc1wiXG5pbXBvcnQgeyBVbmVuY3J5cHRlZENyZWRlbnRpYWxzIH0gZnJvbSBcIi4uL25hdGl2ZS9jb21tb24vZ2VuZXJhdGVkaXBjL1VuZW5jcnlwdGVkQ3JlZGVudGlhbHMuanNcIlxuaW1wb3J0IHsgQXBwTG9jayB9IGZyb20gXCIuL0FwcExvY2suanNcIlxuaW1wb3J0IHsgaXNPZmZsaW5lRXJyb3IgfSBmcm9tIFwiLi4vYXBpL2NvbW1vbi91dGlscy9FcnJvclV0aWxzLmpzXCJcblxuYXNzZXJ0TWFpbk9yTm9kZSgpXG5cbi8qKlxuICogRGVmaW5lcyB3aGF0IHRoZSB2aWV3IHNob3VsZCBjdXJyZW50bHkgcmVuZGVyLlxuICovXG5leHBvcnQgY29uc3QgZW51bSBEaXNwbGF5TW9kZSB7XG5cdC8qIERpc3BsYXkgdGhlIHN0b3JlZCBjcmVkZW50aWFscyAqL1xuXHRDcmVkZW50aWFscyA9IFwiY3JlZGVudGlhbHNcIixcblxuXHQvKiBEaXNwbGF5IGxvZ2luIGZvcm0gKHVzZXJuYW1lLCBwYXNzd29yZCkgKi9cblx0Rm9ybSA9IFwiZm9ybVwiLFxuXG5cdC8qIERpc3BsYXkgdGhlIHN0b3JlZCBjcmVkZW50aWFscyBhbmQgb3B0aW9ucyB0byBkZWxldGUgdGhlbSAqL1xuXHREZWxldGVDcmVkZW50aWFscyA9IFwiZGVsZXRlQ3JlZGVudGlhbHNcIixcbn1cblxuLyoqXG4gKiBSZWZsZWN0cyB3aGljaCBzdGF0ZSB0aGUgY3VycmVudCBsb2dpbiBwcm9jZXNzIGhhcy5cbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gTG9naW5TdGF0ZSB7XG5cdC8qIExvZyBpbiBpbiBwcm9jZXNzLiAqL1xuXHRMb2dnaW5nSW4gPSBcIkxvZ2dpbmdJblwiLFxuXG5cdC8qIFNvbWUgdW5rbm93biBlcnJvciBvY2N1cmVkIGR1cmluZyBsb2dpbi4gKi9cblx0VW5rbm93bkVycm9yID0gXCJVbmtub3duRXJyb3JcIixcblxuXHQvKiBUaGUgY3JlZGVudGlhbHMgdXNlZCBmb3IgdGhlIGxhc3QgbG9naW4gYXR0ZW1wdCB3aGVyZSBpbnZhbGlkIChlLmcuIGJhZCBwYXNzd29yZCkuICovXG5cdEludmFsaWRDcmVkZW50aWFscyA9IFwiSW52YWxpZENyZWRlbnRpYWxzXCIsXG5cblx0LyogVGhlIGFjY2VzcyB0b2tlbiB1c2VkIGZvciBsb2dpbiBoYXMgZXhwaXJlZC4gKi9cblx0QWNjZXNzRXhwaXJlZCA9IFwiQWNjZXNzRXhwaXJlZFwiLFxuXG5cdC8qIERlZmF1bHQgc3RhdGUgLSB0aGUgdXNlciBpcyBub3QgbG9nZ2VkIGluIG5vciBoYXMgbG9naW4gYmVlbiBhdHRlbXB0ZWQgeWV0LiAqL1xuXHROb3RBdXRoZW50aWNhdGVkID0gXCJOb3RBdXRoZW50aWNhdGVkXCIsXG5cblx0LyogVGhlIHVzZXIgaGFzIHN1Y2Nlc3NmdWxseSBsb2dnZWQgaW4uICovXG5cdExvZ2dlZEluID0gXCJMb2dnZWRJblwiLFxufVxuXG4vKipcbiAqIEludGVyZmFjZSBmb3IgdGhlIHZpZXcgbW9kZWwgdXNlZCBvbiB0aGUgbG9naW4gcGFnZS4gVGhlcmUgaXMgbm8gcmVhbCB0ZWNobmljYWwgcmVhc29uIGZvciBleHRyYWN0aW5nIGFuIGludGVyZmFjZSBmb3IgdGhlIHZpZXcgbW9kZWxcbiAqIG90aGVyIHRoYW4gbWFraW5nIGl0IGVhc2llciB0byBkb2N1bWVudCBpdHMgbWV0aG9kcyBhbmQgZm9yIHNvbWUgYWRkaXRpb25hbCBjaGVja3Mgd2hlbiBtb2NraW5nIHRoaXMuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSUxvZ2luVmlld01vZGVsIHtcblx0cmVhZG9ubHkgc3RhdGU6IExvZ2luU3RhdGVcblx0cmVhZG9ubHkgZGlzcGxheU1vZGU6IERpc3BsYXlNb2RlXG5cdHJlYWRvbmx5IG1haWxBZGRyZXNzOiBTdHJlYW08c3RyaW5nPlxuXHRyZWFkb25seSBwYXNzd29yZDogU3RyZWFtPHN0cmluZz5cblx0cmVhZG9ubHkgaGVscFRleHQ6IE1heWJlVHJhbnNsYXRpb25cblx0cmVhZG9ubHkgc2F2ZVBhc3N3b3JkOiBTdHJlYW08Ym9vbGVhbj5cblxuXHQvKipcblx0ICogQ2hlY2tzIHdoZXRoZXIgdGhlIHZpZXdtb2RlbCBpcyBpbiBhIHN0YXRlIHdoZXJlIGl0IGNhbiBhdHRlbXB0IHRvIGxvZ2luLiBUaGlzIGRlcGVuZHMgb24gdGhlIGN1cnJlbnQgZGlzcGxheU1vZGUgYXMgd2VsbCBhc1xuXHQgKiB3aGF0IGRhdGEgKGVtYWlsLCBwYXNzd29yZCwgdXNlcklkLCAuLi4pIGhhcyBiZWVuIHNldC5cblx0ICovXG5cdGNhbkxvZ2luKCk6IGJvb2xlYW5cblxuXHQvKipcblx0ICogV2lsbCB0ZWxsIHRoZSB2aWV3bW9kZWwgdG8gdXNlIGEgY2VydGFpbiB1c2VySWQuIElmIHRoZXJlIGFyZSBhbnkgc3RvcmVkIGNyZWRlbnRpYWxzIGZvciB0aGF0IHVzZXItaWQgb24gdGhlIGRldmljZSwgaXQgd2lsbFxuXHQgKiBsb2FkIHRob3NlLCBzZXQgdGhlbSBhcyBwb3RlbnRpYWwgY3JlZGVudGlhbHMgZm9yIGxvZ2luIGFuZCBzd2l0Y2ggdG8gRGlzcGxheU1vZGUuQ3JlZGVudGlhbHMuIFRoaXMgaXMgdXNlZnVsIGluIG9yZGVyIHRvIHByZXBhcmVcblx0ICogdGhlIHZpZXdtb2RlbCBmb3IgYW4gYXV0b21hdGljIGxvZ2luIHdpdGhvdXQgdXNlciBpbnRlcmFjdGlvbi5cblx0ICogQHBhcmFtIHVzZXJJZFxuXHQgKi9cblx0dXNlVXNlcklkKHVzZXJJZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPlxuXG5cdC8qKlxuXHQgKiBJbnN0cnVjdHMgdGhlIHZpZXdtb2RlbCB0byB1c2UgdGhlIGNyZWRlbnRpYWxzIHBhc3NlZCBmb3IgdGhlIG5leHQgbG9naW4gYXR0ZW1wdC4gQ2hhbmdlcyBkaXNwbGF5TW9kZSB0byBEaXNwbGF5TW9kZS5DcmVkZW50aWFscy5cblx0ICogQHBhcmFtIGNyZWRlbnRpYWxzXG5cdCAqL1xuXHR1c2VDcmVkZW50aWFscyhjcmVkZW50aWFsczogQ3JlZGVudGlhbHNJbmZvKTogUHJvbWlzZTx2b2lkPlxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIGFsbCBjcmVkZW50aWFscyBzdG9yZWQgb24gdGhlIGRldmljZS5cblx0ICovXG5cdGdldFNhdmVkQ3JlZGVudGlhbHMoKTogUmVhZG9ubHlBcnJheTxDcmVkZW50aWFsc0luZm8+XG5cblx0LyoqXG5cdCAqIEF0dGVtcHRzIHRvIGxvZyBpbi4gSG93IHRoZSBsb2dpbiB3aWxsIGJlIHBlcmZvcm1lZCAodXNpbmcgc3RvcmVkIGNyZWRlbnRpYWxzL3VzaW5nIGVtYWlsIGFuZCBwYXNzd29yZCkgZGVwZW5kcyBvbiB0aGUgY3VycmVudFxuXHQgKiBEaXNwbGF5TW9kZS5cblx0ICovXG5cdGxvZ2luKCk6IFByb21pc2U8dm9pZD5cblxuXHQvKipcblx0ICogRGVsZXRlcyBzdG9yZWQgY3JlZGVudGlhbHMgZnJvbSB0aGUgZGV2aWNlLlxuXHQgKiBAcGFyYW0gY3JlZGVudGlhbHNcblx0ICovXG5cdGRlbGV0ZUNyZWRlbnRpYWxzKGNyZWRlbnRpYWxzOiBDcmVkZW50aWFsc0luZm8pOiBQcm9taXNlPFwibmV0d29ya0Vycm9yXCIgfCBudWxsPlxuXG5cdC8qKlxuXHQgKiBDaGFuZ2VzIHRoZSBkaXNwbGF5IG1vZGUgdG8gRGlzcGxheU1vZGUuRm9ybS5cblx0ICovXG5cdHNob3dMb2dpbkZvcm0oKTogdm9pZFxuXG5cdC8qKlxuXHQgKiBDaGFuZ2VzIHRoZSBkaXNwbGF5IG1vZGUgdG8gRGlzcGxheU1vZGUuQ3JlZGVudGlhbHMuXG5cdCAqL1xuXHRzaG93Q3JlZGVudGlhbHMoKTogdm9pZFxuXG5cdC8qKlxuXHQgKiBUb2dnbGVzIGJldHdlZW4gRGlzcGxheU1vZGUuQ3JlZGVudGlhbHMgYW5kIERpc3BsYXlNb2RlLkRlbGV0ZUNyZWRlbnRpYWxzLlxuXHQgKi9cblx0c3dpdGNoRGVsZXRlU3RhdGUoKTogdm9pZFxufVxuXG5leHBvcnQgY2xhc3MgTG9naW5WaWV3TW9kZWwgaW1wbGVtZW50cyBJTG9naW5WaWV3TW9kZWwge1xuXHRyZWFkb25seSBtYWlsQWRkcmVzczogU3RyZWFtPHN0cmluZz5cblx0cmVhZG9ubHkgcGFzc3dvcmQ6IFN0cmVhbTxzdHJpbmc+XG5cdGRpc3BsYXlNb2RlOiBEaXNwbGF5TW9kZVxuXHRzdGF0ZTogTG9naW5TdGF0ZVxuXHRoZWxwVGV4dDogTWF5YmVUcmFuc2xhdGlvblxuXHRyZWFkb25seSBzYXZlUGFzc3dvcmQ6IFN0cmVhbTxib29sZWFuPlxuXHRwcml2YXRlIHNhdmVkSW50ZXJuYWxDcmVkZW50aWFsczogUmVhZG9ubHlBcnJheTxDcmVkZW50aWFsc0luZm8+XG5cblx0Ly8gdmlzaWJsZUZvclRlc3Rpbmdcblx0YXV0b0xvZ2luQ3JlZGVudGlhbHM6IENyZWRlbnRpYWxzSW5mbyB8IG51bGxcblxuXHRjb25zdHJ1Y3Rvcihcblx0XHRwcml2YXRlIHJlYWRvbmx5IGxvZ2luQ29udHJvbGxlcjogTG9naW5Db250cm9sbGVyLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgY3JlZGVudGlhbHNQcm92aWRlcjogQ3JlZGVudGlhbHNQcm92aWRlcixcblx0XHRwcml2YXRlIHJlYWRvbmx5IHNlY29uZEZhY3RvckhhbmRsZXI6IFNlY29uZEZhY3RvckhhbmRsZXIsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBkZXZpY2VDb25maWc6IERldmljZUNvbmZpZyxcblx0XHRwcml2YXRlIHJlYWRvbmx5IGRvbWFpbkNvbmZpZzogRG9tYWluQ29uZmlnLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgY3JlZGVudGlhbFJlbW92YWxIYW5kbGVyOiBDcmVkZW50aWFsUmVtb3ZhbEhhbmRsZXIsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBwdXNoU2VydmljZUFwcDogTmF0aXZlUHVzaFNlcnZpY2VBcHAgfCBudWxsLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgYXBwTG9jazogQXBwTG9jayxcblx0KSB7XG5cdFx0dGhpcy5zdGF0ZSA9IExvZ2luU3RhdGUuTm90QXV0aGVudGljYXRlZFxuXHRcdHRoaXMuZGlzcGxheU1vZGUgPSBEaXNwbGF5TW9kZS5Gb3JtXG5cdFx0dGhpcy5oZWxwVGV4dCA9IFwiZW1wdHlTdHJpbmdfbXNnXCJcblx0XHR0aGlzLm1haWxBZGRyZXNzID0gc3RyZWFtKFwiXCIpXG5cdFx0dGhpcy5wYXNzd29yZCA9IHN0cmVhbShcIlwiKVxuXHRcdHRoaXMuYXV0b0xvZ2luQ3JlZGVudGlhbHMgPSBudWxsXG5cdFx0dGhpcy5zYXZlUGFzc3dvcmQgPSBzdHJlYW0oZmFsc2UpXG5cdFx0dGhpcy5zYXZlZEludGVybmFsQ3JlZGVudGlhbHMgPSBbXVxuXHR9XG5cblx0LyoqXG5cdCAqIFRoaXMgbWV0aG9kIHNob3VsZCBiZSBjYWxsZWQgcmlnaHQgYWZ0ZXIgY3JlYXRpb24gb2YgdGhlIHZpZXcgbW9kZWwgYnkgd2hvZXZlciBjcmVhdGVkIHRoZSB2aWV3bW9kZWwuIFRoZSB2aWV3IG1vZGVsIHdpbGwgbm90IGJlXG5cdCAqIGZ1bGx5IGZ1bmN0aW9uYWwgYmVmb3JlIHRoaXMgbWV0aG9kIGhhcyBiZWVuIGNhbGxlZCFcblx0ICogQHJldHVybnMge1Byb21pc2U8dm9pZD59XG5cdCAqL1xuXHRhc3luYyBpbml0KCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGF3YWl0IHRoaXMudXBkYXRlQ2FjaGVkQ3JlZGVudGlhbHMoKVxuXHR9XG5cblx0YXN5bmMgdXNlVXNlcklkKHVzZXJJZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0dGhpcy5hdXRvTG9naW5DcmVkZW50aWFscyA9IGF3YWl0IHRoaXMuY3JlZGVudGlhbHNQcm92aWRlci5nZXRDcmVkZW50aWFsc0luZm9CeVVzZXJJZCh1c2VySWQpXG5cblx0XHRpZiAodGhpcy5hdXRvTG9naW5DcmVkZW50aWFscykge1xuXHRcdFx0dGhpcy5kaXNwbGF5TW9kZSA9IERpc3BsYXlNb2RlLkNyZWRlbnRpYWxzXG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuZGlzcGxheU1vZGUgPSBEaXNwbGF5TW9kZS5Gb3JtXG5cdFx0fVxuXHR9XG5cblx0Y2FuTG9naW4oKTogYm9vbGVhbiB7XG5cdFx0aWYgKHRoaXMuZGlzcGxheU1vZGUgPT09IERpc3BsYXlNb2RlLkNyZWRlbnRpYWxzKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5hdXRvTG9naW5DcmVkZW50aWFscyAhPSBudWxsIHx8IHRoaXMuc2F2ZWRJbnRlcm5hbENyZWRlbnRpYWxzLmxlbmd0aCA9PT0gMVxuXHRcdH0gZWxzZSBpZiAodGhpcy5kaXNwbGF5TW9kZSA9PT0gRGlzcGxheU1vZGUuRm9ybSkge1xuXHRcdFx0cmV0dXJuIEJvb2xlYW4odGhpcy5tYWlsQWRkcmVzcygpICYmIHRoaXMucGFzc3dvcmQoKSlcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIGZhbHNlXG5cdFx0fVxuXHR9XG5cblx0YXN5bmMgdXNlQ3JlZGVudGlhbHMoZW5jcnlwdGVkQ3JlZGVudGlhbHM6IENyZWRlbnRpYWxzSW5mbyk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IGNyZWRlbnRpYWxzSW5mbyA9IGF3YWl0IHRoaXMuY3JlZGVudGlhbHNQcm92aWRlci5nZXRDcmVkZW50aWFsc0luZm9CeVVzZXJJZChlbmNyeXB0ZWRDcmVkZW50aWFscy51c2VySWQpXG5cblx0XHRpZiAoY3JlZGVudGlhbHNJbmZvKSB7XG5cdFx0XHR0aGlzLmF1dG9Mb2dpbkNyZWRlbnRpYWxzID0gY3JlZGVudGlhbHNJbmZvXG5cdFx0XHR0aGlzLmRpc3BsYXlNb2RlID0gRGlzcGxheU1vZGUuQ3JlZGVudGlhbHNcblx0XHR9XG5cdH1cblxuXHRhc3luYyBsb2dpbigpIHtcblx0XHRpZiAodGhpcy5zdGF0ZSA9PT0gTG9naW5TdGF0ZS5Mb2dnaW5nSW4pIHJldHVyblxuXHRcdHRoaXMuc3RhdGUgPSBMb2dpblN0YXRlLkxvZ2dpbmdJblxuXG5cdFx0aWYgKHRoaXMuZGlzcGxheU1vZGUgPT09IERpc3BsYXlNb2RlLkNyZWRlbnRpYWxzIHx8IHRoaXMuZGlzcGxheU1vZGUgPT09IERpc3BsYXlNb2RlLkRlbGV0ZUNyZWRlbnRpYWxzKSB7XG5cdFx0XHRhd2FpdCB0aGlzLmF1dG9sb2dpbigpXG5cdFx0fSBlbHNlIGlmICh0aGlzLmRpc3BsYXlNb2RlID09PSBEaXNwbGF5TW9kZS5Gb3JtKSB7XG5cdFx0XHRhd2FpdCB0aGlzLmZvcm1Mb2dpbigpXG5cdFx0fSBlbHNlIHtcblx0XHRcdHRocm93IG5ldyBQcm9ncmFtbWluZ0Vycm9yKGBDYW5ub3QgbG9naW4gd2l0aCBjdXJyZW50IGRpc3BsYXkgbW9kZTogJHt0aGlzLmRpc3BsYXlNb2RlfWApXG5cdFx0fVxuXHR9XG5cblx0YXN5bmMgZGVsZXRlQ3JlZGVudGlhbHMoY3JlZGVudGlhbHNJbmZvOiBDcmVkZW50aWFsc0luZm8pOiBQcm9taXNlPFwibmV0d29ya0Vycm9yXCIgfCBudWxsPiB7XG5cdFx0bGV0IGNyZWRlbnRpYWxzXG5cblx0XHR0cnkge1xuXHRcdFx0LyoqXG5cdFx0XHQgKiBXZSBoYXZlIHRvIGRlY3J5cHQgdGhlIGNyZWRlbnRpYWxzIGhlcmUgKGFuZCBoZW5jZSBkZWFsIHdpdGggYW55IHBvdGVudGlhbCBlcnJvcnMpLCBiZWNhdXNlIDpMb2dpbkNvbnRyb2xsZXIuZGVsZXRlT2xkU2Vzc2lvblxuXHRcdFx0ICogZXhwZWN0cyB0aGUgZnVsbCBjcmVkZW50aWFscy4gVGhlIHJlYXNvbiBmb3IgdGhpcyBpcyB0aGF0IHRoZSBhY2Nlc3NUb2tlbiBjb250YWluZWQgd2l0aGluIGNyZWRlbnRpYWxzIGhhcyBhIGRvdWJsZSBmdW5jdGlvbjpcblx0XHRcdCAqIDEuIEl0IGlzIHVzZWQgYXMgYW4gYWN0dWFsIGFjY2VzcyB0b2tlbiB0byByZS1hdXRoZW50aWNhdGVcblx0XHRcdCAqIDIuIEl0IGlzIHVzZWQgYXMgYSBzZXNzaW9uIElEXG5cdFx0XHQgKiBTaW5jZSB3ZSB3YW50IHRvIGFsc28gZGVsZXRlIHRoZSBzZXNzaW9uIGZyb20gdGhlIHNlcnZlciwgd2UgbmVlZCB0aGUgKGRlY3J5cHRlZCkgYWNjZXNzVG9rZW4gaW4gaXRzIGZ1bmN0aW9uIGFzIGEgc2Vzc2lvbiBpZC5cblx0XHRcdCAqL1xuXHRcdFx0Y3JlZGVudGlhbHMgPSBhd2FpdCB0aGlzLnVubG9ja0FwcEFuZEdldENyZWRlbnRpYWxzKGNyZWRlbnRpYWxzSW5mby51c2VySWQpXG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0aWYgKGUgaW5zdGFuY2VvZiBLZXlQZXJtYW5lbnRseUludmFsaWRhdGVkRXJyb3IpIHtcblx0XHRcdFx0YXdhaXQgdGhpcy5jcmVkZW50aWFsc1Byb3ZpZGVyLmNsZWFyQ3JlZGVudGlhbHMoZSlcblx0XHRcdFx0YXdhaXQgdGhpcy51cGRhdGVDYWNoZWRDcmVkZW50aWFscygpXG5cdFx0XHRcdHRoaXMuc3RhdGUgPSBMb2dpblN0YXRlLk5vdEF1dGhlbnRpY2F0ZWRcblx0XHRcdFx0cmV0dXJuIG51bGxcblx0XHRcdH0gZWxzZSBpZiAoZSBpbnN0YW5jZW9mIENhbmNlbGxlZEVycm9yKSB7XG5cdFx0XHRcdC8vIGlnbm9yZSwgaGFwcGVucyBpZiB3ZSBoYXZlIGFwcCBwaW4gYWN0aXZhdGVkIGFuZCB0aGUgdXNlclxuXHRcdFx0XHQvLyBjYW5jZWxzIHRoZSBwcm9tcHQgb3IgcHJvdmlkZXMgYSB3cm9uZyBwYXNzd29yZC5cblx0XHRcdFx0cmV0dXJuIG51bGxcblx0XHRcdH0gZWxzZSBpZiAoZSBpbnN0YW5jZW9mIENyZWRlbnRpYWxBdXRoZW50aWNhdGlvbkVycm9yKSB7XG5cdFx0XHRcdHRoaXMuaGVscFRleHQgPSBnZXRMb2dpbkVycm9yTWVzc2FnZShlLCBmYWxzZSlcblx0XHRcdFx0cmV0dXJuIG51bGxcblx0XHRcdH0gZWxzZSBpZiAoZSBpbnN0YW5jZW9mIERldmljZVN0b3JhZ2VVbmF2YWlsYWJsZUVycm9yKSB7XG5cdFx0XHRcdC8vIFdlIHdhbnQgdG8gYWxsb3cgZGVsZXRpbmcgY3JlZGVudGlhbHMgZXZlbiBpZiBrZXljaGFpbiBmYWlsc1xuXHRcdFx0XHRhd2FpdCB0aGlzLmNyZWRlbnRpYWxzUHJvdmlkZXIuZGVsZXRlQnlVc2VySWQoY3JlZGVudGlhbHNJbmZvLnVzZXJJZClcblx0XHRcdFx0YXdhaXQgdGhpcy5jcmVkZW50aWFsUmVtb3ZhbEhhbmRsZXIub25DcmVkZW50aWFsc1JlbW92ZWQoY3JlZGVudGlhbHNJbmZvKVxuXHRcdFx0XHRhd2FpdCB0aGlzLnVwZGF0ZUNhY2hlZENyZWRlbnRpYWxzKClcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRocm93IGVcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAoY3JlZGVudGlhbHMpIHtcblx0XHRcdGF3YWl0IHRoaXMuY3JlZGVudGlhbHNQcm92aWRlci5kZWxldGVCeVVzZXJJZChjcmVkZW50aWFscy5jcmVkZW50aWFsSW5mby51c2VySWQpXG5cdFx0XHRhd2FpdCB0aGlzLmNyZWRlbnRpYWxSZW1vdmFsSGFuZGxlci5vbkNyZWRlbnRpYWxzUmVtb3ZlZChjcmVkZW50aWFscy5jcmVkZW50aWFsSW5mbylcblx0XHRcdGF3YWl0IHRoaXMudXBkYXRlQ2FjaGVkQ3JlZGVudGlhbHMoKVxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0YXdhaXQgdGhpcy5sb2dpbkNvbnRyb2xsZXIuZGVsZXRlT2xkU2Vzc2lvbihjcmVkZW50aWFscywgKGF3YWl0IHRoaXMucHVzaFNlcnZpY2VBcHA/LmxvYWRQdXNoSWRlbnRpZmllckZyb21OYXRpdmUoKSkgPz8gbnVsbClcblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0aWYgKGlzT2ZmbGluZUVycm9yKGUpKSB7XG5cdFx0XHRcdFx0cmV0dXJuIFwibmV0d29ya0Vycm9yXCJcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gbnVsbFxuXHR9XG5cblx0LyoqIEB0aHJvd3MgQ3JlZGVudGlhbEF1dGhlbnRpY2F0aW9uRXJyb3IgKi9cblx0cHJpdmF0ZSBhc3luYyB1bmxvY2tBcHBBbmRHZXRDcmVkZW50aWFscyh1c2VySWQ6IElkKTogUHJvbWlzZTxVbmVuY3J5cHRlZENyZWRlbnRpYWxzIHwgbnVsbD4ge1xuXHRcdGF3YWl0IHRoaXMuYXBwTG9jay5lbmZvcmNlKClcblx0XHRyZXR1cm4gYXdhaXQgdGhpcy5jcmVkZW50aWFsc1Byb3ZpZGVyLmdldERlY3J5cHRlZENyZWRlbnRpYWxzQnlVc2VySWQodXNlcklkKVxuXHR9XG5cblx0Z2V0U2F2ZWRDcmVkZW50aWFscygpOiBSZWFkb25seUFycmF5PENyZWRlbnRpYWxzSW5mbz4ge1xuXHRcdHJldHVybiB0aGlzLnNhdmVkSW50ZXJuYWxDcmVkZW50aWFsc1xuXHR9XG5cblx0c3dpdGNoRGVsZXRlU3RhdGUoKSB7XG5cdFx0aWYgKHRoaXMuZGlzcGxheU1vZGUgPT09IERpc3BsYXlNb2RlLkRlbGV0ZUNyZWRlbnRpYWxzKSB7XG5cdFx0XHR0aGlzLmRpc3BsYXlNb2RlID0gRGlzcGxheU1vZGUuQ3JlZGVudGlhbHNcblx0XHR9IGVsc2UgaWYgKHRoaXMuZGlzcGxheU1vZGUgPT09IERpc3BsYXlNb2RlLkNyZWRlbnRpYWxzKSB7XG5cdFx0XHR0aGlzLmRpc3BsYXlNb2RlID0gRGlzcGxheU1vZGUuRGVsZXRlQ3JlZGVudGlhbHNcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhyb3cgbmV3IFByb2dyYW1taW5nRXJyb3IoXCJpbnZhbGlkIHN0YXRlXCIpXG5cdFx0fVxuXHR9XG5cblx0c2hvd0xvZ2luRm9ybSgpIHtcblx0XHR0aGlzLmRpc3BsYXlNb2RlID0gRGlzcGxheU1vZGUuRm9ybVxuXHRcdHRoaXMuaGVscFRleHQgPSBcImVtcHR5U3RyaW5nX21zZ1wiXG5cdH1cblxuXHRzaG93Q3JlZGVudGlhbHMoKSB7XG5cdFx0dGhpcy5kaXNwbGF5TW9kZSA9IERpc3BsYXlNb2RlLkNyZWRlbnRpYWxzXG5cdFx0dGhpcy5oZWxwVGV4dCA9IFwiZW1wdHlTdHJpbmdfbXNnXCJcblx0fVxuXG5cdHNob3VsZFNob3dSZWNvdmVyKCk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiB0aGlzLmRvbWFpbkNvbmZpZy5maXJzdFBhcnR5RG9tYWluXG5cdH1cblxuXHRzaG91bGRTaG93U2lnbnVwKCk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiB0aGlzLmRvbWFpbkNvbmZpZy5maXJzdFBhcnR5RG9tYWluIHx8IGdldFdoaXRlbGFiZWxSZWdpc3RyYXRpb25Eb21haW5zKCkubGVuZ3RoID4gMFxuXHR9XG5cblx0c2hvdWxkU2hvd0FwcEJ1dHRvbnMoKTogYm9vbGVhbiB7XG5cdFx0cmV0dXJuIHRoaXMuZG9tYWluQ29uZmlnLmZpcnN0UGFydHlEb21haW5cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgdXBkYXRlQ2FjaGVkQ3JlZGVudGlhbHMoKSB7XG5cdFx0dGhpcy5zYXZlZEludGVybmFsQ3JlZGVudGlhbHMgPSBhd2FpdCB0aGlzLmNyZWRlbnRpYWxzUHJvdmlkZXIuZ2V0SW50ZXJuYWxDcmVkZW50aWFsc0luZm9zKClcblx0XHR0aGlzLmF1dG9Mb2dpbkNyZWRlbnRpYWxzID0gbnVsbFxuXG5cdFx0aWYgKHRoaXMuc2F2ZWRJbnRlcm5hbENyZWRlbnRpYWxzLmxlbmd0aCA+IDApIHtcblx0XHRcdGlmICh0aGlzLmRpc3BsYXlNb2RlICE9PSBEaXNwbGF5TW9kZS5EZWxldGVDcmVkZW50aWFscykge1xuXHRcdFx0XHR0aGlzLmRpc3BsYXlNb2RlID0gRGlzcGxheU1vZGUuQ3JlZGVudGlhbHNcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5kaXNwbGF5TW9kZSA9IERpc3BsYXlNb2RlLkZvcm1cblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGF1dG9sb2dpbigpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRsZXQgY3JlZGVudGlhbHM6IFVuZW5jcnlwdGVkQ3JlZGVudGlhbHMgfCBudWxsID0gbnVsbFxuXHRcdHRyeSB7XG5cdFx0XHRpZiAodGhpcy5hdXRvTG9naW5DcmVkZW50aWFscyA9PSBudWxsKSB7XG5cdFx0XHRcdGNvbnN0IGFsbENyZWRlbnRpYWxzID0gYXdhaXQgdGhpcy5jcmVkZW50aWFsc1Byb3ZpZGVyLmdldEludGVybmFsQ3JlZGVudGlhbHNJbmZvcygpXG5cdFx0XHRcdHRoaXMuYXV0b0xvZ2luQ3JlZGVudGlhbHMgPSBmaXJzdChhbGxDcmVkZW50aWFscylcblx0XHRcdH1cblxuXHRcdFx0Ly8gd2UgZG9uJ3Qgd2FudCB0byBhdXRvLWxvZ2luIG9uIHRoZSBsZWdhY3kgZG9tYWluLCB0aGVyZSdzIGEgYmFubmVyXG5cdFx0XHQvLyB0aGVyZSB0byBtb3ZlIHBlb3BsZSB0byB0aGUgbmV3IGRvbWFpbi5cblx0XHRcdGlmICh0aGlzLmF1dG9Mb2dpbkNyZWRlbnRpYWxzKSB7XG5cdFx0XHRcdGNyZWRlbnRpYWxzID0gYXdhaXQgdGhpcy51bmxvY2tBcHBBbmRHZXRDcmVkZW50aWFscyh0aGlzLmF1dG9Mb2dpbkNyZWRlbnRpYWxzLnVzZXJJZClcblxuXHRcdFx0XHRpZiAoY3JlZGVudGlhbHMpIHtcblx0XHRcdFx0XHRjb25zdCBvZmZsaW5lVGltZVJhbmdlID0gdGhpcy5kZXZpY2VDb25maWcuZ2V0T2ZmbGluZVRpbWVSYW5nZURheXModGhpcy5hdXRvTG9naW5DcmVkZW50aWFscy51c2VySWQpXG5cdFx0XHRcdFx0Y29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5sb2dpbkNvbnRyb2xsZXIucmVzdW1lU2Vzc2lvbihjcmVkZW50aWFscywgbnVsbCwgb2ZmbGluZVRpbWVSYW5nZSlcblx0XHRcdFx0XHRpZiAocmVzdWx0LnR5cGUgPT0gXCJzdWNjZXNzXCIpIHtcblx0XHRcdFx0XHRcdGF3YWl0IHRoaXMub25Mb2dpbigpXG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdHRoaXMuc3RhdGUgPSBMb2dpblN0YXRlLk5vdEF1dGhlbnRpY2F0ZWRcblx0XHRcdFx0XHRcdHRoaXMuaGVscFRleHQgPSBcIm9mZmxpbmVMb2dpblByZW1pdW1Pbmx5X21zZ1wiXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aGlzLnN0YXRlID0gTG9naW5TdGF0ZS5Ob3RBdXRoZW50aWNhdGVkXG5cdFx0XHR9XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0aWYgKGUgaW5zdGFuY2VvZiBOb3RBdXRoZW50aWNhdGVkRXJyb3IgJiYgdGhpcy5hdXRvTG9naW5DcmVkZW50aWFscykge1xuXHRcdFx0XHRjb25zdCBhdXRvTG9naW5DcmVkZW50aWFscyA9IHRoaXMuYXV0b0xvZ2luQ3JlZGVudGlhbHNcblx0XHRcdFx0YXdhaXQgdGhpcy5jcmVkZW50aWFsc1Byb3ZpZGVyLmRlbGV0ZUJ5VXNlcklkKGF1dG9Mb2dpbkNyZWRlbnRpYWxzLnVzZXJJZClcblx0XHRcdFx0aWYgKGNyZWRlbnRpYWxzKSB7XG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5jcmVkZW50aWFsUmVtb3ZhbEhhbmRsZXIub25DcmVkZW50aWFsc1JlbW92ZWQoY3JlZGVudGlhbHMuY3JlZGVudGlhbEluZm8pXG5cdFx0XHRcdH1cblx0XHRcdFx0YXdhaXQgdGhpcy51cGRhdGVDYWNoZWRDcmVkZW50aWFscygpXG5cdFx0XHRcdGF3YWl0IHRoaXMub25Mb2dpbkZhaWxlZChlKVxuXHRcdFx0fSBlbHNlIGlmIChlIGluc3RhbmNlb2YgS2V5UGVybWFuZW50bHlJbnZhbGlkYXRlZEVycm9yKSB7XG5cdFx0XHRcdGF3YWl0IHRoaXMuY3JlZGVudGlhbHNQcm92aWRlci5jbGVhckNyZWRlbnRpYWxzKGUpXG5cdFx0XHRcdGF3YWl0IHRoaXMudXBkYXRlQ2FjaGVkQ3JlZGVudGlhbHMoKVxuXHRcdFx0XHR0aGlzLnN0YXRlID0gTG9naW5TdGF0ZS5Ob3RBdXRoZW50aWNhdGVkXG5cdFx0XHRcdHRoaXMuaGVscFRleHQgPSBcImNyZWRlbnRpYWxzS2V5SW52YWxpZGF0ZWRfbXNnXCJcblx0XHRcdH0gZWxzZSBpZiAoZSBpbnN0YW5jZW9mIERldmljZVN0b3JhZ2VVbmF2YWlsYWJsZUVycm9yKSB7XG5cdFx0XHRcdC8vIFRoZSBhcHAgYWxyZWFkeSBzaG93cyBhIGRpYWxvZyB3aXRoIEZBUSBsaW5rIHNvIHdlIGRvbid0IGhhdmUgdG8gZXhwbGFpblxuXHRcdFx0XHQvLyBtdWNoIGhlcmUsIGp1c3QgY2F0Y2hpbmcgaXQgdG8gYXZvaWQgdW5leHBlY3RlZCBlcnJvciBkaWFsb2dcblx0XHRcdFx0dGhpcy5zdGF0ZSA9IExvZ2luU3RhdGUuTm90QXV0aGVudGljYXRlZFxuXHRcdFx0XHR0aGlzLmhlbHBUZXh0ID0gbGFuZy5tYWtlVHJhbnNsYXRpb24oXCJoZWxwX3RleHRcIiwgXCJDb3VsZCBub3QgYWNjZXNzIHNlY3JldCBzdG9yYWdlXCIpXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRhd2FpdCB0aGlzLm9uTG9naW5GYWlsZWQoZSlcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAodGhpcy5zdGF0ZSA9PT0gTG9naW5TdGF0ZS5BY2Nlc3NFeHBpcmVkIHx8IHRoaXMuc3RhdGUgPT09IExvZ2luU3RhdGUuSW52YWxpZENyZWRlbnRpYWxzKSB7XG5cdFx0XHR0aGlzLmRpc3BsYXlNb2RlID0gRGlzcGxheU1vZGUuRm9ybVxuXHRcdFx0dGhpcy5tYWlsQWRkcmVzcyh0aGlzLmF1dG9Mb2dpbkNyZWRlbnRpYWxzPy5sb2dpbiA/PyBcIlwiKVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgZm9ybUxvZ2luKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IG1haWxBZGRyZXNzID0gdGhpcy5tYWlsQWRkcmVzcygpXG5cdFx0Y29uc3QgcGFzc3dvcmQgPSB0aGlzLnBhc3N3b3JkKClcblx0XHRjb25zdCBzYXZlUGFzc3dvcmQgPSB0aGlzLnNhdmVQYXNzd29yZCgpXG5cblx0XHRpZiAobWFpbEFkZHJlc3MgPT09IFwiXCIgfHwgcGFzc3dvcmQgPT09IFwiXCIpIHtcblx0XHRcdHRoaXMuc3RhdGUgPSBMb2dpblN0YXRlLkludmFsaWRDcmVkZW50aWFsc1xuXHRcdFx0dGhpcy5oZWxwVGV4dCA9IFwibG9naW5GYWlsZWRfbXNnXCJcblx0XHRcdHJldHVyblxuXHRcdH1cblxuXHRcdHRoaXMuaGVscFRleHQgPSBcImxvZ2luX21zZ1wiXG5cblx0XHR0cnkge1xuXHRcdFx0Y29uc3Qgc2Vzc2lvblR5cGUgPSBzYXZlUGFzc3dvcmQgPyBTZXNzaW9uVHlwZS5QZXJzaXN0ZW50IDogU2Vzc2lvblR5cGUuTG9naW5cblxuXHRcdFx0Y29uc3QgeyBjcmVkZW50aWFscywgZGF0YWJhc2VLZXkgfSA9IGF3YWl0IHRoaXMubG9naW5Db250cm9sbGVyLmNyZWF0ZVNlc3Npb24obWFpbEFkZHJlc3MsIHBhc3N3b3JkLCBzZXNzaW9uVHlwZSlcblx0XHRcdGF3YWl0IHRoaXMub25Mb2dpbigpXG5cdFx0XHQvLyBlbmZvcmNlIGFwcCBsb2NrIGFsd2F5cywgZXZlbiBpZiB3ZSBkb24ndCBhY2Nlc3Mgc3RvcmVkIGNyZWRlbnRpYWxzXG5cdFx0XHRhd2FpdCB0aGlzLmFwcExvY2suZW5mb3JjZSgpXG5cblx0XHRcdC8vIHdlIGRvbid0IHdhbnQgdG8gaGF2ZSBtdWx0aXBsZSBjcmVkZW50aWFscyB0aGF0XG5cdFx0XHQvLyAqIHNoYXJlIHRoZSBzYW1lIHVzZXJJZCB3aXRoIGRpZmZlcmVudCBtYWlsIGFkZHJlc3NlcyAobWF5IGhhcHBlbiBpZiBhIHVzZXIgY2hvb3NlcyBhIGRpZmZlcmVudCBhbGlhcyB0byBsb2cgaW4gdGhhbiB0aGUgb25lIHRoZXkgc2F2ZWQpXG5cdFx0XHQvLyAqIHNoYXJlIHRoZSBzYW1lIG1haWwgYWRkcmVzcyAobWF5IGhhcHBlbiBpZiBtYWlsIGFsaWFzZXMgYXJlIG1vdmVkIGJldHdlZW4gdXNlcnMpXG5cdFx0XHRjb25zdCBzdG9yZWRDcmVkZW50aWFsc1RvRGVsZXRlID0gdGhpcy5zYXZlZEludGVybmFsQ3JlZGVudGlhbHMuZmlsdGVyKChjKSA9PiBjLmxvZ2luID09PSBtYWlsQWRkcmVzcyB8fCBjLnVzZXJJZCA9PT0gY3JlZGVudGlhbHMudXNlcklkKVxuXG5cdFx0XHRmb3IgKGNvbnN0IGNyZWRlbnRpYWxUb0RlbGV0ZSBvZiBzdG9yZWRDcmVkZW50aWFsc1RvRGVsZXRlKSB7XG5cdFx0XHRcdGNvbnN0IGNyZWRlbnRpYWxzID0gYXdhaXQgdGhpcy5jcmVkZW50aWFsc1Byb3ZpZGVyLmdldERlY3J5cHRlZENyZWRlbnRpYWxzQnlVc2VySWQoY3JlZGVudGlhbFRvRGVsZXRlLnVzZXJJZClcblxuXHRcdFx0XHRpZiAoY3JlZGVudGlhbHMpIHtcblx0XHRcdFx0XHRhd2FpdCB0aGlzLmxvZ2luQ29udHJvbGxlci5kZWxldGVPbGRTZXNzaW9uKGNyZWRlbnRpYWxzKVxuXHRcdFx0XHRcdC8vIHdlIGhhbmRsZWQgdGhlIGRlbGV0aW9uIG9mIHRoZSBvZmZsaW5lRGIgaW4gY3JlYXRlU2Vzc2lvbiBhbHJlYWR5XG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5jcmVkZW50aWFsc1Byb3ZpZGVyLmRlbGV0ZUJ5VXNlcklkKGNyZWRlbnRpYWxzLmNyZWRlbnRpYWxJbmZvLnVzZXJJZCwgeyBkZWxldGVPZmZsaW5lRGI6IGZhbHNlIH0pXG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0aWYgKHNhdmVQYXNzd29yZCkge1xuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMuY3JlZGVudGlhbHNQcm92aWRlci5zdG9yZShjcmVkZW50aWFsc1RvVW5lbmNyeXB0ZWQoY3JlZGVudGlhbHMsIGRhdGFiYXNlS2V5KSlcblx0XHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRcdGlmIChlIGluc3RhbmNlb2YgS2V5UGVybWFuZW50bHlJbnZhbGlkYXRlZEVycm9yKSB7XG5cdFx0XHRcdFx0XHRhd2FpdCB0aGlzLmNyZWRlbnRpYWxzUHJvdmlkZXIuY2xlYXJDcmVkZW50aWFscyhlKVxuXHRcdFx0XHRcdFx0YXdhaXQgdGhpcy51cGRhdGVDYWNoZWRDcmVkZW50aWFscygpXG5cdFx0XHRcdFx0fSBlbHNlIGlmIChlIGluc3RhbmNlb2YgRGV2aWNlU3RvcmFnZVVuYXZhaWxhYmxlRXJyb3IgfHwgZSBpbnN0YW5jZW9mIENhbmNlbGxlZEVycm9yKSB7XG5cdFx0XHRcdFx0XHRjb25zb2xlLndhcm4oXCJ3aWxsIHByb2NlZWQgd2l0aCBlcGhlbWVyYWwgY3JlZGVudGlhbHMgYmVjYXVzZSBkZXZpY2Ugc3RvcmFnZSBpcyB1bmF2YWlsYWJsZTpcIiwgZSlcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0dGhyb3cgZVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGlmIChlIGluc3RhbmNlb2YgRGV2aWNlU3RvcmFnZVVuYXZhaWxhYmxlRXJyb3IpIHtcblx0XHRcdFx0Y29uc29sZS53YXJuKFwiY2Fubm90IGxvZyBpbjogZmFpbGVkIHRvIGdldCBjcmVkZW50aWFscyBmcm9tIGRldmljZSBzdG9yYWdlXCIsIGUpXG5cdFx0XHR9XG5cdFx0XHRhd2FpdCB0aGlzLm9uTG9naW5GYWlsZWQoZSlcblx0XHR9IGZpbmFsbHkge1xuXHRcdFx0YXdhaXQgdGhpcy5zZWNvbmRGYWN0b3JIYW5kbGVyLmNsb3NlV2FpdGluZ0ZvclNlY29uZEZhY3RvckRpYWxvZygpXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBvbkxvZ2luKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRoaXMuaGVscFRleHQgPSBcImVtcHR5U3RyaW5nX21zZ1wiXG5cdFx0dGhpcy5zdGF0ZSA9IExvZ2luU3RhdGUuTG9nZ2VkSW5cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgb25Mb2dpbkZhaWxlZChlcnJvcjogRXJyb3IpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0aGlzLmhlbHBUZXh0ID0gZ2V0TG9naW5FcnJvck1lc3NhZ2UoZXJyb3IsIGZhbHNlKVxuXG5cdFx0aWYgKGVycm9yIGluc3RhbmNlb2YgQmFkUmVxdWVzdEVycm9yIHx8IGVycm9yIGluc3RhbmNlb2YgTm90QXV0aGVudGljYXRlZEVycm9yKSB7XG5cdFx0XHR0aGlzLnN0YXRlID0gTG9naW5TdGF0ZS5JbnZhbGlkQ3JlZGVudGlhbHNcblx0XHR9IGVsc2UgaWYgKGVycm9yIGluc3RhbmNlb2YgQWNjZXNzRXhwaXJlZEVycm9yKSB7XG5cdFx0XHR0aGlzLnN0YXRlID0gTG9naW5TdGF0ZS5BY2Nlc3NFeHBpcmVkXG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuc3RhdGUgPSBMb2dpblN0YXRlLlVua25vd25FcnJvclxuXHRcdH1cblxuXHRcdGhhbmRsZUV4cGVjdGVkTG9naW5FcnJvcihlcnJvciwgbm9PcClcblx0fVxufVxuIiwiaW1wb3J0IHR5cGUgeyBMb2dpbkNvbnRyb2xsZXIgfSBmcm9tIFwiLi4vYXBpL21haW4vTG9naW5Db250cm9sbGVyXCJcbmltcG9ydCB7IERpYWxvZyB9IGZyb20gXCIuLi9ndWkvYmFzZS9EaWFsb2dcIlxuaW1wb3J0IHsgZ2VuZXJhdGVkSWRUb1RpbWVzdGFtcCB9IGZyb20gXCIuLi9hcGkvY29tbW9uL3V0aWxzL0VudGl0eVV0aWxzXCJcbmltcG9ydCB0eXBlIHsgTWF5YmVUcmFuc2xhdGlvbiB9IGZyb20gXCIuL0xhbmd1YWdlVmlld01vZGVsXCJcbmltcG9ydCB7IGxhbmcgfSBmcm9tIFwiLi9MYW5ndWFnZVZpZXdNb2RlbFwiXG5pbXBvcnQge1xuXHRBY2Nlc3NCbG9ja2VkRXJyb3IsXG5cdEFjY2Vzc0RlYWN0aXZhdGVkRXJyb3IsXG5cdEFjY2Vzc0V4cGlyZWRFcnJvcixcblx0QmFkUmVxdWVzdEVycm9yLFxuXHRDb25uZWN0aW9uRXJyb3IsXG5cdE5vdEF1dGhlbnRpY2F0ZWRFcnJvcixcblx0Tm90QXV0aG9yaXplZEVycm9yLFxuXHROb3RGb3VuZEVycm9yLFxuXHRUb29NYW55UmVxdWVzdHNFcnJvcixcbn0gZnJvbSBcIi4uL2FwaS9jb21tb24vZXJyb3IvUmVzdEVycm9yXCJcbmltcG9ydCB7IENhbmNlbGxlZEVycm9yIH0gZnJvbSBcIi4uL2FwaS9jb21tb24vZXJyb3IvQ2FuY2VsbGVkRXJyb3JcIlxuaW1wb3J0IHtcblx0QXBwcm92YWxTdGF0dXMsXG5cdEF2YWlsYWJsZVBsYW5zLFxuXHRBdmFpbGFibGVQbGFuVHlwZSxcblx0Z2V0Q3VzdG9tZXJBcHByb3ZhbFN0YXR1cyxcblx0S2RmVHlwZSxcblx0TmV3QnVzaW5lc3NQbGFucyxcblx0TmV3UGFpZFBsYW5zLFxuXHROZXdQZXJzb25hbFBsYW5zLFxuXHRTdWJzY3JpcHRpb25UeXBlLFxufSBmcm9tIFwiLi4vYXBpL2NvbW1vbi9UdXRhbm90YUNvbnN0YW50c1wiXG5pbXBvcnQgdHlwZSB7IFJlc2V0QWN0aW9uIH0gZnJvbSBcIi4uL2xvZ2luL3JlY292ZXIvUmVjb3ZlckxvZ2luRGlhbG9nXCJcbmltcG9ydCB7IHNob3dQcm9ncmVzc0RpYWxvZyB9IGZyb20gXCIuLi9ndWkvZGlhbG9ncy9Qcm9ncmVzc0RpYWxvZ1wiXG5pbXBvcnQgeyBVc2VyRXJyb3IgfSBmcm9tIFwiLi4vYXBpL21haW4vVXNlckVycm9yXCJcbmltcG9ydCB7IG5vT3AsIG9mQ2xhc3MgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IHNob3dVc2VyRXJyb3IgfSBmcm9tIFwiLi9FcnJvckhhbmRsZXJJbXBsXCJcbmltcG9ydCB0eXBlIHsgU3Vic2NyaXB0aW9uUGFyYW1ldGVycyB9IGZyb20gXCIuLi9zdWJzY3JpcHRpb24vVXBncmFkZVN1YnNjcmlwdGlvbldpemFyZFwiXG5pbXBvcnQgeyBsb2NhdG9yIH0gZnJvbSBcIi4uL2FwaS9tYWluL0NvbW1vbkxvY2F0b3JcIlxuaW1wb3J0IHsgQ3JlZGVudGlhbEF1dGhlbnRpY2F0aW9uRXJyb3IgfSBmcm9tIFwiLi4vYXBpL2NvbW1vbi9lcnJvci9DcmVkZW50aWFsQXV0aGVudGljYXRpb25FcnJvclwiXG5pbXBvcnQgdHlwZSB7IFBhcmFtcyB9IGZyb20gXCJtaXRocmlsXCJcbmltcG9ydCB7IExvZ2luU3RhdGUgfSBmcm9tIFwiLi4vbG9naW4vTG9naW5WaWV3TW9kZWwuanNcIlxuXG4vKipcbiAqIFNob3dzIHdhcm5pbmdzIGlmIHRoZSBpbnZvaWNlcyBhcmUgbm90IHBhaWQgb3IgdGhlIHJlZ2lzdHJhdGlvbiBpcyBub3QgYXBwcm92ZWQgeWV0LlxuICogQHBhcmFtIGxvZ2lucyBUaGUgYExvZ2luQ29udHJvbGxlcmAgdXNlZCB0byByZXRyaWV2ZSB0aGUgY3VycmVudCB1c2VycyBjdXN0b21lciBpbmZvcm1hdGlvbiBmcm9tLlxuICogQHBhcmFtIGluY2x1ZGVJbnZvaWNlTm90UGFpZEZvckFkbWluIElmIHRydWUsIGFsc28gc2hvd3MgYSB3YXJuaW5nIGZvciBhbiBhZG1pbiBpZiB0aGUgaW52b2ljZSBpcyBub3QgcGFpZCAodXNlIGF0IGxvZ2luKSwgaWYgZmFsc2UgZG9lcyBub3Qgc2hvdyB0aGlzIHdhcm5pbmcgKHVzZSB3aGVuIHNlbmRpbmcgYW4gZW1haWwpLlxuICogQHBhcmFtIGRlZmF1bHRTdGF0dXMgVGhpcyBzdGF0dXMgaXMgdXNlZCBpZiB0aGUgYWN0dWFsIHN0YXR1cyBvbiB0aGUgY3VzdG9tZXIgaXMgXCIwXCJcbiAqIEByZXR1cm5zIFRydWUgaWYgdGhlIHVzZXIgbWF5IHN0aWxsIHNlbmQgZW1haWxzLCBmYWxzZSBvdGhlcndpc2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjaGVja0FwcHJvdmFsU3RhdHVzKGxvZ2luczogTG9naW5Db250cm9sbGVyLCBpbmNsdWRlSW52b2ljZU5vdFBhaWRGb3JBZG1pbjogYm9vbGVhbiwgZGVmYXVsdFN0YXR1cz86IEFwcHJvdmFsU3RhdHVzKTogUHJvbWlzZTxib29sZWFuPiB7XG5cdGlmICghbG9naW5zLmdldFVzZXJDb250cm9sbGVyKCkuaXNJbnRlcm5hbFVzZXIoKSkge1xuXHRcdC8vIGV4dGVybmFsIHVzZXJzIGFyZSBub3QgYXV0aG9yaXplZCB0byBsb2FkIHRoZSBjdXN0b21lclxuXHRcdHJldHVybiBQcm9taXNlLnJlc29sdmUodHJ1ZSlcblx0fVxuXG5cdHJldHVybiBsb2dpbnNcblx0XHQuZ2V0VXNlckNvbnRyb2xsZXIoKVxuXHRcdC5sb2FkQ3VzdG9tZXIoKVxuXHRcdC50aGVuKChjdXN0b21lcikgPT4ge1xuXHRcdFx0Y29uc3QgYXBwcm92YWxTdGF0dXMgPSBnZXRDdXN0b21lckFwcHJvdmFsU3RhdHVzKGN1c3RvbWVyKVxuXHRcdFx0Y29uc3Qgc3RhdHVzID0gYXBwcm92YWxTdGF0dXMgPT09IEFwcHJvdmFsU3RhdHVzLlJFR0lTVFJBVElPTl9BUFBST1ZFRCAmJiBkZWZhdWx0U3RhdHVzICE9IG51bGwgPyBkZWZhdWx0U3RhdHVzIDogYXBwcm92YWxTdGF0dXNcblx0XHRcdGlmIChcblx0XHRcdFx0c3RhdHVzID09PSBBcHByb3ZhbFN0YXR1cy5SRUdJU1RSQVRJT05fQVBQUk9WQUxfTkVFREVEIHx8XG5cdFx0XHRcdHN0YXR1cyA9PT0gQXBwcm92YWxTdGF0dXMuREVMQVlFRCB8fFxuXHRcdFx0XHRzdGF0dXMgPT09IEFwcHJvdmFsU3RhdHVzLlJFR0lTVFJBVElPTl9BUFBST1ZBTF9ORUVERURfQU5EX0lOSVRJQUxMWV9BQ0NFU1NFRFxuXHRcdFx0KSB7XG5cdFx0XHRcdHJldHVybiBEaWFsb2cubWVzc2FnZShcIndhaXRpbmdGb3JBcHByb3ZhbF9tc2dcIikudGhlbigoKSA9PiBmYWxzZSlcblx0XHRcdH0gZWxzZSBpZiAoc3RhdHVzID09PSBBcHByb3ZhbFN0YXR1cy5ERUxBWUVEX0FORF9JTklUSUFMTFlfQUNDRVNTRUQpIHtcblx0XHRcdFx0aWYgKG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gZ2VuZXJhdGVkSWRUb1RpbWVzdGFtcChjdXN0b21lci5faWQpID4gMiAqIDI0ICogNjAgKiA2MCAqIDEwMDApIHtcblx0XHRcdFx0XHRyZXR1cm4gRGlhbG9nLm1lc3NhZ2UoXCJyZXF1ZXN0QXBwcm92YWxfbXNnXCIpLnRoZW4oKCkgPT4gdHJ1ZSlcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRyZXR1cm4gRGlhbG9nLm1lc3NhZ2UoXCJ3YWl0aW5nRm9yQXBwcm92YWxfbXNnXCIpLnRoZW4oKCkgPT4gZmFsc2UpXG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZiAoc3RhdHVzID09PSBBcHByb3ZhbFN0YXR1cy5JTlZPSUNFX05PVF9QQUlEKSB7XG5cdFx0XHRcdGlmIChsb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS5pc0dsb2JhbEFkbWluKCkpIHtcblx0XHRcdFx0XHRpZiAoaW5jbHVkZUludm9pY2VOb3RQYWlkRm9yQWRtaW4pIHtcblx0XHRcdFx0XHRcdHJldHVybiBEaWFsb2cubWVzc2FnZShcImludm9pY2VOb3RQYWlkX21zZ1wiKVxuXHRcdFx0XHRcdFx0XHQudGhlbigoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0Ly8gVE9ETzogbmF2aWdhdGUgdG8gcGF5bWVudCBzaXRlIGluIHNldHRpbmdzXG5cdFx0XHRcdFx0XHRcdFx0Ly9tLnJvdXRlLnNldChcIi9zZXR0aW5nc1wiKVxuXHRcdFx0XHRcdFx0XHRcdC8vdHV0YW8ubG9jYXRvci5zZXR0aW5nc1ZpZXdNb2RlbC5zaG93KHR1dGFvLnR1dGFub3RhLmN0cmwuU2V0dGluZ3NWaWV3TW9kZWwuRElTUExBWV9BRE1JTl9QQVlNRU5UKTtcblx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdFx0LnRoZW4oKCkgPT4gdHJ1ZSlcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHRydWVcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Y29uc3QgZXJyb3JNZXNzYWdlID0gbGFuZy5tYWtlVHJhbnNsYXRpb24oXCJpbnZvaWNlTm90UGFpZFVzZXJfbXNnXCIsIGxhbmcuZ2V0KFwiaW52b2ljZU5vdFBhaWRVc2VyX21zZ1wiKSArIFwiIFwiICsgbGFuZy5nZXQoXCJjb250YWN0QWRtaW5fbXNnXCIpKVxuXG5cdFx0XHRcdFx0cmV0dXJuIERpYWxvZy5tZXNzYWdlKGVycm9yTWVzc2FnZSkudGhlbigoKSA9PiBmYWxzZSlcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIGlmIChzdGF0dXMgPT09IEFwcHJvdmFsU3RhdHVzLlNQQU1fU0VOREVSKSB7XG5cdFx0XHRcdERpYWxvZy5tZXNzYWdlKFwibG9naW5BYnVzZURldGVjdGVkX21zZ1wiKSAvLyBkbyBub3QgbG9nb3V0IHRvIGF2b2lkIHRoYXQgd2UgdHJ5IHRvIHJlbG9hZCB3aXRoIG1haWwgZWRpdG9yIG9wZW5cblxuXHRcdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHRcdH0gZWxzZSBpZiAoc3RhdHVzID09PSBBcHByb3ZhbFN0YXR1cy5QQUlEX1NVQlNDUklQVElPTl9ORUVERUQpIHtcblx0XHRcdFx0Y29uc3QgbWVzc2FnZSA9IGxhbmcuZ2V0KFwidXBncmFkZU5lZWRlZF9tc2dcIilcblx0XHRcdFx0cmV0dXJuIERpYWxvZy5yZW1pbmRlcihsYW5nLmdldChcInVwZ3JhZGVSZW1pbmRlclRpdGxlX21zZ1wiKSwgbWVzc2FnZSkudGhlbigoY29uZmlybWVkKSA9PiB7XG5cdFx0XHRcdFx0aWYgKGNvbmZpcm1lZCkge1xuXHRcdFx0XHRcdFx0aW1wb3J0KFwiLi4vc3Vic2NyaXB0aW9uL1VwZ3JhZGVTdWJzY3JpcHRpb25XaXphcmRcIikudGhlbigobSkgPT4gbS5zaG93VXBncmFkZVdpemFyZChsb2dpbnMpKVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHJldHVybiBmYWxzZVxuXHRcdFx0XHR9KVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmV0dXJuIHRydWVcblx0XHRcdH1cblx0XHR9KVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TG9naW5FcnJvck1lc3NhZ2UoZXJyb3I6IEVycm9yLCBpc0V4dGVybmFsTG9naW46IGJvb2xlYW4pOiBNYXliZVRyYW5zbGF0aW9uIHtcblx0c3dpdGNoIChlcnJvci5jb25zdHJ1Y3Rvcikge1xuXHRcdGNhc2UgQmFkUmVxdWVzdEVycm9yOlxuXHRcdGNhc2UgTm90QXV0aGVudGljYXRlZEVycm9yOlxuXHRcdGNhc2UgQWNjZXNzRGVhY3RpdmF0ZWRFcnJvcjpcblx0XHRcdHJldHVybiBcImxvZ2luRmFpbGVkX21zZ1wiXG5cblx0XHRjYXNlIEFjY2Vzc0Jsb2NrZWRFcnJvcjpcblx0XHRcdHJldHVybiBcImxvZ2luRmFpbGVkT2Z0ZW5fbXNnXCJcblxuXHRcdGNhc2UgQWNjZXNzRXhwaXJlZEVycm9yOlxuXHRcdFx0cmV0dXJuIGlzRXh0ZXJuYWxMb2dpbiA/IFwiZXhwaXJlZExpbmtfbXNnXCIgOiBcImluYWN0aXZlQWNjb3VudF9tc2dcIlxuXG5cdFx0Y2FzZSBUb29NYW55UmVxdWVzdHNFcnJvcjpcblx0XHRcdHJldHVybiBcInRvb01hbnlBdHRlbXB0c19tc2dcIlxuXG5cdFx0Y2FzZSBDYW5jZWxsZWRFcnJvcjpcblx0XHRcdHJldHVybiBcImVtcHR5U3RyaW5nX21zZ1wiXG5cblx0XHRjYXNlIENyZWRlbnRpYWxBdXRoZW50aWNhdGlvbkVycm9yOlxuXHRcdFx0cmV0dXJuIGxhbmcuZ2V0VHJhbnNsYXRpb24oXCJjb3VsZE5vdFVubG9ja0NyZWRlbnRpYWxzX21zZ1wiLCB7XG5cdFx0XHRcdFwie3JlYXNvbn1cIjogZXJyb3IubWVzc2FnZSxcblx0XHRcdH0pXG5cblx0XHRjYXNlIENvbm5lY3Rpb25FcnJvcjpcblx0XHRcdHJldHVybiBcImNvbm5lY3Rpb25Mb3N0TG9uZ19tc2dcIlxuXG5cdFx0ZGVmYXVsdDpcblx0XHRcdHJldHVybiBcImVtcHR5U3RyaW5nX21zZ1wiXG5cdH1cbn1cblxuLyoqXG4gKiBIYW5kbGUgZXhwZWN0ZWQgbG9naW4gZXJyb3JzXG4gKiBBbnkgdW5leHBlY3RlZCBlcnJvcnMgd2lsbCBiZSByZXRocm93blxuICovXG5leHBvcnQgZnVuY3Rpb24gaGFuZGxlRXhwZWN0ZWRMb2dpbkVycm9yPEUgZXh0ZW5kcyBFcnJvcj4oZXJyb3I6IEUsIGhhbmRsZXI6IChlcnJvcjogRSkgPT4gdm9pZCkge1xuXHRpZiAoXG5cdFx0ZXJyb3IgaW5zdGFuY2VvZiBCYWRSZXF1ZXN0RXJyb3IgfHxcblx0XHRlcnJvciBpbnN0YW5jZW9mIE5vdEF1dGhlbnRpY2F0ZWRFcnJvciB8fFxuXHRcdGVycm9yIGluc3RhbmNlb2YgQWNjZXNzRXhwaXJlZEVycm9yIHx8XG5cdFx0ZXJyb3IgaW5zdGFuY2VvZiBBY2Nlc3NCbG9ja2VkRXJyb3IgfHxcblx0XHRlcnJvciBpbnN0YW5jZW9mIEFjY2Vzc0RlYWN0aXZhdGVkRXJyb3IgfHxcblx0XHRlcnJvciBpbnN0YW5jZW9mIFRvb01hbnlSZXF1ZXN0c0Vycm9yIHx8XG5cdFx0ZXJyb3IgaW5zdGFuY2VvZiBDYW5jZWxsZWRFcnJvciB8fFxuXHRcdGVycm9yIGluc3RhbmNlb2YgQ3JlZGVudGlhbEF1dGhlbnRpY2F0aW9uRXJyb3IgfHxcblx0XHRlcnJvciBpbnN0YW5jZW9mIENvbm5lY3Rpb25FcnJvclxuXHQpIHtcblx0XHRoYW5kbGVyKGVycm9yKVxuXHR9IGVsc2Uge1xuXHRcdHRocm93IGVycm9yXG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldExvZ2luRXJyb3JTdGF0ZUFuZE1lc3NhZ2UoZXJyb3I6IEVycm9yKTogeyBlcnJvck1lc3NhZ2U6IE1heWJlVHJhbnNsYXRpb247IHN0YXRlOiBMb2dpblN0YXRlIH0ge1xuXHRsZXQgZXJyb3JNZXNzYWdlID0gZ2V0TG9naW5FcnJvck1lc3NhZ2UoZXJyb3IsIGZhbHNlKVxuXHRsZXQgc3RhdGVcblx0aWYgKGVycm9yIGluc3RhbmNlb2YgQmFkUmVxdWVzdEVycm9yIHx8IGVycm9yIGluc3RhbmNlb2YgTm90QXV0aGVudGljYXRlZEVycm9yKSB7XG5cdFx0c3RhdGUgPSBMb2dpblN0YXRlLkludmFsaWRDcmVkZW50aWFsc1xuXHR9IGVsc2UgaWYgKGVycm9yIGluc3RhbmNlb2YgQWNjZXNzRXhwaXJlZEVycm9yKSB7XG5cdFx0c3RhdGUgPSBMb2dpblN0YXRlLkFjY2Vzc0V4cGlyZWRcblx0fSBlbHNlIHtcblx0XHRzdGF0ZSA9IExvZ2luU3RhdGUuVW5rbm93bkVycm9yXG5cdH1cblx0aGFuZGxlRXhwZWN0ZWRMb2dpbkVycm9yKGVycm9yLCBub09wKVxuXHRyZXR1cm4ge1xuXHRcdGVycm9yTWVzc2FnZSxcblx0XHRzdGF0ZSxcblx0fVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2hvd1NpZ251cERpYWxvZyh1cmxQYXJhbXM6IFBhcmFtcykge1xuXHRjb25zdCBzdWJzY3JpcHRpb25QYXJhbXMgPSBnZXRTdWJzY3JpcHRpb25QYXJhbWV0ZXJzKHVybFBhcmFtcylcblx0Y29uc3QgcmVnaXN0cmF0aW9uRGF0YUlkID0gZ2V0UmVnaXN0cmF0aW9uRGF0YUlkRnJvbVBhcmFtcyh1cmxQYXJhbXMpXG5cdGNvbnN0IHJlZmVycmFsQ29kZSA9IGdldFJlZmVycmFsQ29kZUZyb21QYXJhbXModXJsUGFyYW1zKVxuXHRjb25zdCBhdmFpbGFibGVQbGFucyA9IGdldEF2YWlsYWJsZVBsYW5zRnJvbVN1YnNjcmlwdGlvblBhcmFtZXRlcnMoc3Vic2NyaXB0aW9uUGFyYW1zKVxuXHRhd2FpdCBzaG93UHJvZ3Jlc3NEaWFsb2coXG5cdFx0XCJsb2FkaW5nX21zZ1wiLFxuXHRcdGxvY2F0b3Iud29ya2VyLmluaXRpYWxpemVkLnRoZW4oYXN5bmMgKCkgPT4ge1xuXHRcdFx0Y29uc3QgeyBsb2FkU2lnbnVwV2l6YXJkIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9zdWJzY3JpcHRpb24vVXBncmFkZVN1YnNjcmlwdGlvbldpemFyZFwiKVxuXHRcdFx0YXdhaXQgbG9hZFNpZ251cFdpemFyZChzdWJzY3JpcHRpb25QYXJhbXMsIHJlZ2lzdHJhdGlvbkRhdGFJZCwgcmVmZXJyYWxDb2RlLCBhdmFpbGFibGVQbGFucylcblx0XHR9KSxcblx0KS5jYXRjaChcblx0XHRvZkNsYXNzKFVzZXJFcnJvciwgYXN5bmMgKGUpID0+IHtcblx0XHRcdGNvbnN0IG0gPSBhd2FpdCBpbXBvcnQoXCJtaXRocmlsXCIpXG5cdFx0XHRhd2FpdCBzaG93VXNlckVycm9yKGUpXG5cdFx0XHQvLyByZWRpcmVjdHMgaWYgdGhlcmUgd2VyZSBpbnZhbGlkIHBhcmFtZXRlcnMsIGUuZy4gZm9yIHJlZmVycmFsIGNvZGVzIGFuZCBjYW1wYWlnbklkc1xuXHRcdFx0bS5yb3V0ZS5zZXQoXCIvc2lnbnVwXCIpXG5cdFx0fSksXG5cdClcbn1cblxuZnVuY3Rpb24gZ2V0QXZhaWxhYmxlUGxhbnNGcm9tU3Vic2NyaXB0aW9uUGFyYW1ldGVycyhwYXJhbXM6IFN1YnNjcmlwdGlvblBhcmFtZXRlcnMgfCBudWxsKTogQXZhaWxhYmxlUGxhblR5cGVbXSB7XG5cdC8vIERlZmF1bHQgdG8gYWxsIGF2YWlsYWJsZSBwbGFucyBpZiB0aGUgcGFyYW1zIGRvIG5vdCBoYXZlIHRoZSBuZWVkZWQgaW5mb3JtYXRpb25cblx0aWYgKHBhcmFtcyA9PSBudWxsIHx8IHBhcmFtcy50eXBlID09IG51bGwpIHJldHVybiBBdmFpbGFibGVQbGFuc1xuXG5cdHRyeSB7XG5cdFx0Y29uc3QgdHlwZSA9IHN0cmluZ1RvU3Vic2NyaXB0aW9uVHlwZShwYXJhbXMudHlwZSlcblx0XHRzd2l0Y2ggKHR5cGUpIHtcblx0XHRcdGNhc2UgU3Vic2NyaXB0aW9uVHlwZS5CdXNpbmVzczpcblx0XHRcdFx0cmV0dXJuIE5ld0J1c2luZXNzUGxhbnNcblx0XHRcdGNhc2UgU3Vic2NyaXB0aW9uVHlwZS5QZXJzb25hbDpcblx0XHRcdFx0cmV0dXJuIE5ld1BlcnNvbmFsUGxhbnNcblx0XHRcdGNhc2UgU3Vic2NyaXB0aW9uVHlwZS5QYWlkUGVyc29uYWw6XG5cdFx0XHRcdHJldHVybiBOZXdQYWlkUGxhbnMuZmlsdGVyKChwYWlkUGxhbikgPT4gTmV3UGVyc29uYWxQbGFucy5pbmNsdWRlcyhwYWlkUGxhbikpXG5cdFx0fVxuXHR9IGNhdGNoIChlKSB7XG5cdFx0Ly8gSWYgcGFyYW1zLnR5cGUgaXMgbm90IGEgdmFsaWQgc3Vic2NyaXB0aW9uIHR5cGUsIHJldHVybiB0aGUgZGVmYXVsdCB2YWx1ZVxuXHRcdHJldHVybiBBdmFpbGFibGVQbGFuc1xuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdHJpbmdUb1N1YnNjcmlwdGlvblR5cGUoc3RyaW5nOiBzdHJpbmcpOiBTdWJzY3JpcHRpb25UeXBlIHtcblx0c3dpdGNoIChzdHJpbmcudG9Mb3dlckNhc2UoKSkge1xuXHRcdGNhc2UgXCJidXNpbmVzc1wiOlxuXHRcdFx0cmV0dXJuIFN1YnNjcmlwdGlvblR5cGUuQnVzaW5lc3Ncblx0XHRjYXNlIFwicHJpdmF0ZVwiOlxuXHRcdFx0cmV0dXJuIFN1YnNjcmlwdGlvblR5cGUuUGVyc29uYWxcblx0XHRjYXNlIFwicHJpdmF0ZXBhaWRcIjpcblx0XHRcdHJldHVybiBTdWJzY3JpcHRpb25UeXBlLlBhaWRQZXJzb25hbFxuXHRcdGRlZmF1bHQ6XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byBnZXQgc3Vic2NyaXB0aW9uIHR5cGU6ICR7c3RyaW5nfWApXG5cdH1cbn1cblxuZnVuY3Rpb24gZ2V0U3Vic2NyaXB0aW9uUGFyYW1ldGVycyhoYXNoUGFyYW1zOiBQYXJhbXMpOiBTdWJzY3JpcHRpb25QYXJhbWV0ZXJzIHwgbnVsbCB7XG5cdGNvbnN0IHsgc3Vic2NyaXB0aW9uLCB0eXBlLCBpbnRlcnZhbCB9ID0gaGFzaFBhcmFtc1xuXHRjb25zdCBpc1N1YnNjcmlwdGlvblN0cmluZyA9IHR5cGVvZiBzdWJzY3JpcHRpb24gPT09IFwic3RyaW5nXCJcblx0Y29uc3QgaXNUeXBlU3RyaW5nID0gdHlwZW9mIHR5cGUgPT09IFwic3RyaW5nXCJcblx0Y29uc3QgaXNJbnRlcnZhbFN0cmluZyA9IHR5cGVvZiBpbnRlcnZhbCA9PT0gXCJzdHJpbmdcIlxuXG5cdGlmICghaXNTdWJzY3JpcHRpb25TdHJpbmcgJiYgIWlzVHlwZVN0cmluZyAmJiAhaXNJbnRlcnZhbFN0cmluZykgcmV0dXJuIG51bGxcblxuXHRyZXR1cm4ge1xuXHRcdHN1YnNjcmlwdGlvbjogaXNTdWJzY3JpcHRpb25TdHJpbmcgPyBzdWJzY3JpcHRpb24gOiBudWxsLFxuXHRcdHR5cGU6IGlzVHlwZVN0cmluZyA/IHR5cGUgOiBudWxsLFxuXHRcdGludGVydmFsOiBpc0ludGVydmFsU3RyaW5nID8gaW50ZXJ2YWwgOiBudWxsLFxuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRSZWZlcnJhbENvZGVGcm9tUGFyYW1zKHVybFBhcmFtczogUGFyYW1zKTogc3RyaW5nIHwgbnVsbCB7XG5cdGlmICh0eXBlb2YgdXJsUGFyYW1zLnJlZiA9PT0gXCJzdHJpbmdcIikge1xuXHRcdHJldHVybiB1cmxQYXJhbXMucmVmXG5cdH1cblx0cmV0dXJuIG51bGxcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFJlZ2lzdHJhdGlvbkRhdGFJZEZyb21QYXJhbXMoaGFzaFBhcmFtczogUGFyYW1zKTogc3RyaW5nIHwgbnVsbCB7XG5cdGlmICh0eXBlb2YgaGFzaFBhcmFtcy50b2tlbiA9PT0gXCJzdHJpbmdcIikge1xuXHRcdHJldHVybiBoYXNoUGFyYW1zLnRva2VuXG5cdH1cblx0cmV0dXJuIG51bGxcbn1cblxuYXN5bmMgZnVuY3Rpb24gbG9hZFJlZGVlbUdpZnRDYXJkV2l6YXJkKHVybEhhc2g6IHN0cmluZyk6IFByb21pc2U8RGlhbG9nPiB7XG5cdGNvbnN0IHdpemFyZCA9IGF3YWl0IGltcG9ydChcIi4uL3N1YnNjcmlwdGlvbi9naWZ0Y2FyZHMvUmVkZWVtR2lmdENhcmRXaXphcmRcIilcblx0cmV0dXJuIHdpemFyZC5sb2FkUmVkZWVtR2lmdENhcmRXaXphcmQodXJsSGFzaClcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNob3dHaWZ0Q2FyZERpYWxvZyh1cmxIYXNoOiBzdHJpbmcpIHtcblx0c2hvd1Byb2dyZXNzRGlhbG9nKFwibG9hZGluZ19tc2dcIiwgbG9hZFJlZGVlbUdpZnRDYXJkV2l6YXJkKHVybEhhc2gpKVxuXHRcdC50aGVuKChkaWFsb2cpID0+IGRpYWxvZy5zaG93KCkpXG5cdFx0LmNhdGNoKChlKSA9PiB7XG5cdFx0XHRpZiAoZSBpbnN0YW5jZW9mIE5vdEF1dGhvcml6ZWRFcnJvciB8fCBlIGluc3RhbmNlb2YgTm90Rm91bmRFcnJvcikge1xuXHRcdFx0XHR0aHJvdyBuZXcgVXNlckVycm9yKFwiaW52YWxpZEdpZnRDYXJkX21zZ1wiKVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhyb3cgZVxuXHRcdFx0fVxuXHRcdH0pXG5cdFx0LmNhdGNoKG9mQ2xhc3MoVXNlckVycm9yLCBzaG93VXNlckVycm9yKSlcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNob3dSZWNvdmVyRGlhbG9nKG1haWxBZGRyZXNzOiBzdHJpbmcsIHJlc2V0QWN0aW9uOiBSZXNldEFjdGlvbikge1xuXHRjb25zdCBkaWFsb2cgPSBhd2FpdCBpbXBvcnQoXCIuLi9sb2dpbi9yZWNvdmVyL1JlY292ZXJMb2dpbkRpYWxvZ1wiKVxuXHRkaWFsb2cuc2hvdyhtYWlsQWRkcmVzcywgcmVzZXRBY3Rpb24pXG59XG5cbmV4cG9ydCB0eXBlIEV4dGVybmFsVXNlcktleURlcml2ZXIgPSB7XG5cdGtkZlR5cGU6IEtkZlR5cGVcblx0c2FsdDogVWludDhBcnJheVxufVxuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBeUJhLFlBQU4sTUFBcUQ7Q0FDM0Q7Q0FDQTtDQUlBO0NBRUEsU0FBU0EsT0FBOEI7RUFDdEMsTUFBTSxJQUFJLE1BQU07QUFDaEIsT0FBSyx3QkFBd0Isd0JBQU8sUUFBUSxNQUFNO0FBQ2pELHlCQUFzQixNQUFNO0lBQzNCLE1BQU0sYUFBYSxFQUFFLGFBQWE7SUFDbEMsTUFBTSxhQUFhLEtBQUsscUJBQXFCO0lBQzdDLE1BQU0sY0FBYyxFQUFFLFVBQVU7SUFDaEMsTUFBTSxjQUFjLEtBQUssa0JBQWtCO0FBRTNDLFFBQUksZUFBZSxjQUFjLGNBQWMsR0FBSSxHQUFFLFlBQVksV0FBVztBQUM1RSxRQUFJLGdCQUFnQixlQUFlLGVBQWUsR0FBSSxHQUFFLFNBQVMsWUFBWTtHQUM3RSxFQUFDO0VBQ0YsR0FBRSxDQUFDLEVBQUUsYUFBYSxFQUFFLFFBQVMsRUFBQztDQUMvQjtDQUVELFNBQVNBLE9BQThCO0FBQ3RDLFFBQU0sTUFBTSxTQUFTLEdBQUc7QUFDeEIsT0FBSyxzQkFBc0IsSUFBSSxLQUFLO0FBQ3BDLE9BQUssa0JBQWtCLFFBQVE7Q0FDL0I7Q0FFRCxLQUFLQSxPQUF3QztFQUM1QyxNQUFNLElBQUksTUFBTTtFQUNoQixNQUFNLHFCQUFxQixPQUFPLGNBQWM7QUFDaEQsTUFBSSxFQUFFLGlCQUFpQixPQUFPLElBQUksV0FBVyxFQUM1QyxHQUFFLGFBQWEsS0FBSztBQUVyQixTQUFPLGdCQUNOLFFBQ0EsRUFDQyxVQUFVLENBQUNDLE1BQW1CO0FBRTdCLEtBQUUsZ0JBQWdCO0VBQ2xCLEVBQ0QsR0FDRDtHQUNDLGdCQUNDLElBQ0EsZ0JBQUUsV0FBVztJQUNaLE9BQU87SUFDUCxPQUFPLEVBQUUsYUFBYTtJ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
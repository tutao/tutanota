"use strict";

tutao.provide('tutao.Locator');

/**
 * The Locator is our central instance cache. It is a "singleton store"
 * that is used to retrieve instances.
 * The Locator is used instead of dependency injection.
 * @constructor
 * @param {Object.<string, Object>} services A map of service names and constructors or constructor/argument pairs.
 * @param {function()=} initializer The initializer sets up the locator and is used on each reset
 * The constructors are used to create the services. Getters are defined for every service.
 */
tutao.Locator = function(services, initializer) {
	/**
	 * @type {Object.<string, Object>} the mapping from service names to cached instances
	 */
	this._services = services;
	this._initializer = initializer ? initializer : function() {};
	this._replacedStaticMethods = [];

    // @type {tutao.native.CryptoInterface}
    this.crypto = null;
    // @type {tutao.native.PhoneInterface}
    this.phone = null;
    // @type {tutao.native.NotificationInterface}
    this.notification = null;
    // @type {tutao.native.ContactInterface}
    this.contacts = null;
    // @type {tutao.native.FileTransferInterface}
    this.fileTransfer = null;
    // @type {tutao.native.FileFacade}
    this.fileFacade = null;
    // @type {tutao.native.ConfigFacade}
    this.configFacade = null;

    // @type {tutao.crypto.SjclRandomizer}
    this.randomizer= null;
    // @type {tutao.crypto.AesWorkerProxy}
    this.aesCrypter= null;
    // @type {tutao.crypto.RsaWorkerProxy}
    this.rsaUtil= null;
    // @type {tutao.crypto.JBCryptAdapter}
    this.kdfCrypter= null;
    // @type {tutao.crypto.SjclSha256}
    this.shaCrypter= null;
    // @type {tutao.ctrl.UserController}
    this.userController= null;
    // @type {tutao.db.WebSqlDb}
    this.dao= null;
    // @type {tutao.rest.RestClient}
    this.restClient= null;
    // @type {tutao.rest.EntityRestClient}
    this.entityRestClient= null;
    // @type {tutao.tutanota.index.Indexer}
    this.indexer= null;
    // @type {tutao.tutanota.ctrl.MailBoxController}
    this.mailBoxController= null;
    // @type {tutao.tutanota.ctrl.ViewManager}
    this.viewManager= null;
    // @type {tutao.tutanota.ctrl.LoginViewModel}
    this.loginViewModel= null;
    // @type {tutao.tutanota.ctrl.ExternalLoginViewModel}
    this.externalLoginViewModel= null;
    // @type {tutao.tutanota.ctrl.MailFolderListViewModel}
    this.mailFolderListViewModel= null;
    // @type {tutao.tutanota.ctrl.MailListViewModel}
    this.mailListViewModel= null;
    // @type {tutao.tutanota.ctrl.MailViewModel}
    this.mailViewModel= null;
    // @type {tutao.tutanota.ctrl.PasswordChannelViewModel}
    this.passwordChannelViewModel= null;
    // @type {tutao.tutanota.ctrl.ContactListViewModel}
    this.contactListViewModel= null;
    // @type {tutao.tutanota.ctrl.ContactViewModel}
    this.contactViewModel= null;
    // @type {tutao.tutanota.ctrl.FeedbackViewModel}
    this.feedbackViewModel= null;
    // @type {tutao.tutanota.ctrl.FontViewModel}
    this.fontViewModel= null;
    // @type {tutao.tutanota.ctrl.ThemeViewModel}
    this.themeViewModel= null;
    // @type {tutao.tutanota.gui.LoginView}
    this.loginView= null;
    // @type {tutao.tutanota.gui.ExternalLoginView}
    this.externalLoginView= null;
    // @type {tutao.tutanota.gui.LoginView}
    this.notFoundView= null;
    // @type {tutao.tutanota.gui.MailView}
    this.mailView= null;
    // @type {tutao.tutanota.gui.ContactView}
    this.contactView= null;
    // @type {tutao.tutanota.gui.FastMessageView}
    this.fastMessageView= null;
    // @type {tutao.tutanota.gui.NotSupportedView}
    this.notSupportedView= null;
    // @type {tutao.tutanota.gui.RegistrationView}
    this.registrationView= null;
    // @type {tutao.tutanota.ctrl.RegistrationViewModel}
    this.registrationViewModel= null;
    // @type {tutao.tutanota.gui.LogView}
    this.logView= null;
    // @type {tutao.tutanota.ctrl.LogViewModel}
    this.logViewModel= null;
    // @type {tutao.tutanota.gui.DbView}
    this.dbView= null;
    // @type {tutao.tutanota.ctrl.DbViewModel}
    this.dbViewModel= null;
    // @type {tutao.tutanota.gui.MonitorView}
    this.monitorView= null;
    // @type {tutao.tutanota.ctrl.MonitorViewModel}
    this.monitorViewModel= null;
    // @type {tutao.tutanota.gui.ConfigView}
    this.configView= null;
    // @type {tutao.tutanota.ctrl.ConfigViewModel}
    this.configViewModel= null;
    // @type {tutao.tutanota.gui.CustomerView}
    this.customerView= null;
    // @type {tutao.tutanota.ctrl.CustomerViewModel}
    this.customerViewModel= null;
    // @type {tutao.tutanota.gui.SettingsView}
    this.settingsView= null;
    // @type {tutao.tutanota.ctrl.SettingsViewModel}
    this.settingsViewModel= null;
    // @type {tutao.crypto.EntropyCollector}
    this.entropyCollector= null;
    // @type {tutao.tutanota.security.CajaSanitizer}
    this.htmlSanitizer= null;
    // @type {tutao.tutanota.ctrl.LanguageViewModel}
    this.languageViewModel= null;
    // @type {tutao.event.EventBusClient}
    this.eventBus= null;
    // @type {tutao.tutanota.ctrl.FileViewModel}
    this.fileViewModel= null;
    // @type {tutao.tutanota.gui.FileView}
    this.fileView= null;
    // @type {tutao.tutanota.ctrl.Navigator}
    this.navigator= null;
    // @type {tutao.tutanota.ctrl.LegacyDownloadViewModel}
    this.legacyDownloadViewModel= null;
    // @type {tutao.tutanota.ctrl.ProgressDialogModel}
    this.progressDialogModel= null;
    // @type {tutao.tutanota.ctrl.ModalDialogViewModel}
    this.modalDialogViewModel= null;
    // @type {tutao.tutanota.ctrl.FolderNameDialogViewModel}
    this.folderNameDialogViewModel = null;

	this.reset();
};

/**
 * Only for Testing: sets an instance to be returned on requests for a specific serviceName
 * @param {string} serviceName Service name.
 * @param {Object} instance Instance to return.
 */
tutao.Locator.prototype.replace = function(serviceName, instance) {
	var self = this;
	self[serviceName] = instance;
};

/**
 * Only for Testing: overrides a static method and saves it's original behavior.
 * @param {Object} clazz The class where the function should be replaced.
 * @param {function(...[Object])} original The original function defined on class.
 * @param {function(...[Object])} replacement The replacement function to define on class.
 */
tutao.Locator.prototype.replaceStatic = function(clazz, original, replacement) {
	for (var attributeName in clazz) {
		if (clazz[attributeName] === original) {
			clazz[attributeName] = replacement;
			this._replacedStaticMethods.push({clazz: clazz, attributeName: attributeName, original: original});
			return;
		}
	}
	throw new Error("did not find function in clazz");
};

/**
 * removes all cached instances
 */
tutao.Locator.prototype.reset = function() {
	var self = this;
	for (var serviceName in this._services) {
		var Constructor = this._services[serviceName];
        if (typeof Constructor == "undefined") {
            throw new Error("failed to create " + serviceName);
        }
		self[serviceName] = new Constructor();
	}

	for (var i = 0; i < this._replacedStaticMethods.length; i++) {
		var a = this._replacedStaticMethods[i];
		a.clazz[a.attributeName] = a.original;
	}
	this._replacedStaticMethods = [];
	this._initializer();
};

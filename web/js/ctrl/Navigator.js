"use strict";

tutao.provide('tutao.tutanota.ctrl.Navigator');

// written for knockout and more active. Page bindings and params come into index.html
tutao.tutanota.ctrl.Navigator = function() {
    tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	this.clientSupported = (tutao.tutanota.util.ClientDetector.getSupportedType() == tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_SUPPORTED);
	this.externalClientSupported = this.clientSupported || (tutao.tutanota.util.ClientDetector.getSupportedType() == tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_LEGACY_SAFARI);
	this.mailRef = ko.observable(null); // the mail reference for an external user
	this._allowAutoLogin = true; // indicates if auto login allowed. needs to be disabled if logout is clicked
    this.hash = ko.observable();
    this._viewSwitchFinishedCallback = null;
    this._takeoverCredentials = null;
};

tutao.tutanota.ctrl.Navigator.prototype.viewSwitchFinished = function() {
    if (this._viewSwitchFinishedCallback) {
        this._viewSwitchFinishedCallback();
        this._viewSwitchFinishedCallback = null;
    }
};

tutao.tutanota.ctrl.Navigator.prototype.updateHash = function(hash) {
    location.replace(hash);
    this.hash(hash);
};

/**
 * Displays the not supported view if this client is not supported
 * @return {boolean} true, if this client is supported
 */
tutao.tutanota.ctrl.Navigator.prototype.verifyClientSupported = function() {
	if (!this.clientSupported) {
		this.notSupported();
		return false;
	} else {
		return true;
	}
};

/**
 * Displays the not supported view if this client is not supported
 * @return {boolean} true, if this client is supported
 */
tutao.tutanota.ctrl.Navigator.prototype.verifyExternalClientSupported = function() {
	if (!this.externalClientSupported) {
		this.notSupported();
		return false;
	} else {
		return true;
	}
};

tutao.tutanota.ctrl.Navigator.prototype.logout = function() {
	this._login(false);
};

tutao.tutanota.ctrl.Navigator.prototype._login = function(autoLoginAllowed) {
    this._allowAutoLogin = autoLoginAllowed;
    if (this.mailRef() == null) {
        this.updateHash("#login");
    } else {
        this.updateHash("#mail/" + this.mailRef()); // an external user was logged in, we redirect him to his login page
    }
};

tutao.tutanota.ctrl.Navigator.prototype.notSupported = function() {
	this.updateHash("#notSupported");
};

tutao.tutanota.ctrl.Navigator.prototype.mail = function() {
    var self = this;
    return new Promise(function(resolve, reject) {
        self._viewSwitchFinishedCallback = resolve;
        if ( tutao.locator.navigator.mailRef() != null){
            self.updateHash("#box/" + tutao.locator.navigator.mailRef());
        }else{
            self.updateHash("#box");
        }
    });
};

/**
 * @param {tutao.tutanota.ctrl.RecipientInfo=} recipient
 * @return {Promise.<bool>} True if the new mail was opened.
 */
tutao.tutanota.ctrl.Navigator.prototype.newMail = function(recipient) {
    var self = this;
	return tutao.locator.mailViewModel.newMail(recipient).then(function (success) {
        if (success) {
            self.mail();
        }
        return success;
    });
};

tutao.tutanota.ctrl.Navigator.prototype.contact = function() {
	this.updateHash("#contact");
};

/**
* @param {string=} mailAddress The mail address of the contact.
* @param {string=} name The name of the contact.
* @return {Promise.<bool>} True if creating a new contact was cancelled.
*/
tutao.tutanota.ctrl.Navigator.prototype.newContact = function(mailAddress, name) {
    var self = this;
	return tutao.locator.contactViewModel.newContact(mailAddress, name).then(function(cancelled) {
        if (!cancelled) {
            self.contact();
        }
        return cancelled;
    });
};

tutao.tutanota.ctrl.Navigator.prototype.settings = function() {
	this.updateHash("#settings");
};

tutao.tutanota.ctrl.Navigator.prototype.register = function() {
    this.updateHash("#register");
};

/**
 * Switches to the provided view, if the user is authenticated. Otherwise, switches to the LoginView
 * @param {tutao.tutanota.ctrl.View} view The view to switch to.
 */
tutao.tutanota.ctrl.Navigator.prototype.authenticateAndSwitchToView = function(view) {
	/* TODO (story mobile support) for ios 7: to make sliding work, we need to open a new window on login and close the current.
	var type = tutao.tutanota.util.ClientDetector.getDeviceType();
	if (window.history.length > 1 && (type == tutao.tutanota.util.ClientDetector.DEVICE_TYPE_IPHONE || type == tutao.tutanota.util.ClientDetector.DEVICE_TYPE_IPAD)) {
		alert("open");
		window.open(window.location.href, "_blank")
	}*/
	if (tutao.locator.userController.isInternalUserLoggedIn() || tutao.locator.userController.isExternalUserLoggedIn()) {
		tutao.locator.viewManager.select(view);
	} else {
		console.log("User not authenticated, switching to login view.");
		this._login(true);
	}
};

tutao.tutanota.ctrl.Navigator.prototype.setup = function() {
	var self = this;
	// configure all routes
	Path.map("#register(/:parameters)").to(function() {
		if (tutao.locator.userController.isInternalUserLoggedIn() || tutao.locator.userController.isExternalUserLoggedIn()) {
			tutao.tutanota.Bootstrap.init();
		}
		if (self.verifyClientSupported()) {
			if (this.params["parameters"]) {
				var parameters = self.getQueryParams(this.params["parameters"]);
				tutao.locator.viewManager.select(tutao.locator.registrationView, parameters);
			} else {
				tutao.locator.viewManager.select(tutao.locator.registrationView, {});
			}
		}
	});

	Path.map("#login(/:param)").to(function() {
		var param = this.params["param"];
        tutao.locator.navigator.mailRef(null);
		if (tutao.locator.userController.isInternalUserLoggedIn() || tutao.locator.userController.isExternalUserLoggedIn()) {
			tutao.tutanota.Bootstrap.init();
		}
		if (param && param != "force") {
			self._takeoverCredentials = param;
            // remove the credentials from the url
            location.replace("#login");
		} else {
            // if force is set we must not call verifyClientSupported because otherwise it would set the #notSupported tag befor we reload in loginAnyway()
            if (param == "force" || self.verifyClientSupported()) {
                // even if a connection error is thrown we have to switch to the login view
                tutao.locator.loginViewModel.setup(self._allowAutoLogin, self._takeoverCredentials);
            }
        }
	});

	Path.map("#notSupported").to(function() {
		tutao.locator.viewManager.select(tutao.locator.notSupportedView);
	});

	Path.map("#mail/:mailRef(/:credentials)").to(function() {
        var credentials = this.params["credentials"];
		if (tutao.locator.userController.isInternalUserLoggedIn() || tutao.locator.userController.isExternalUserLoggedIn()) {
			tutao.tutanota.Bootstrap.init();
		}
        if (credentials) {
            self._takeoverCredentials = credentials;
            // remove the credentials from the url
            location.replace("#mail/" + this.params["mailRef"]);
        } else {
            // the mail reference must not be set on self, but on tutao.locator.navigator because it was replaced in Bootstrap
            // we have to set mailRef here before calling verifyExternalClientSupported() to make sure the notSupported view knows if this is an external user
            tutao.locator.navigator.mailRef(this.params["mailRef"]);
            if (self.verifyExternalClientSupported()) {
                tutao.locator.externalLoginViewModel.setup(self._allowAutoLogin, tutao.locator.navigator.mailRef(), self._takeoverCredentials);
            }
		}
	});
	
	Path.map("#contact").to(function() {
		self.authenticateAndSwitchToView(tutao.locator.contactView);
	});

	Path.map("#box").to(function() {
		self.authenticateAndSwitchToView(tutao.locator.mailView);
	});

    Path.map("#box/:mailRef").to(function() {
        tutao.locator.navigator.mailRef(this.params["mailRef"]);
        self.authenticateAndSwitchToView(tutao.locator.mailView)
    });


	Path.map("#file").to(function() {
		self.authenticateAndSwitchToView(tutao.locator.fileView);
	});
	
	Path.map("#settings").to(function() {
		self.authenticateAndSwitchToView(tutao.locator.settingsView);
	});
	
	Path.rescue(function() {
		tutao.locator.viewManager.select(tutao.locator.notFoundView);
	});

	if (this.clientSupported) {
		Path.root("#login");
	} else {
		Path.root("#notSupported");
	}
	Path.listen();

};

tutao.tutanota.ctrl.Navigator.prototype.getQueryParams = function(query) {
    var vars = query.split('&');
    var map = {};
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        map[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
    }
    return map;
};

tutao.tutanota.ctrl.Navigator.prototype.loginAnyway = function() {
	window.location.href = "#login/force";
	// we have to reload to avoid the legacy settings which changed the encryption classes
	location.reload();
};

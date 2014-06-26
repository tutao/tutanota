"use strict";

goog.provide('tutao.tutanota.ctrl.Navigator');

// TODO (before release) check if switching to http://oscar.finnsson.nu/pagerjs/ is an alternative:
// written for knockout and more active. Page bindings and params come into index.html
tutao.tutanota.ctrl.Navigator = function() {
	this.clientSupported = (tutao.tutanota.util.ClientDetector.getSupportedType() == tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_SUPPORTED);
	this.externalClientSupported = this.clientSupported || (tutao.tutanota.util.ClientDetector.getSupportedType() == tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_LEGACY_IE) || (tutao.tutanota.util.ClientDetector.getSupportedType() == tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_LEGACY_SAFARI) || (tutao.tutanota.util.ClientDetector.getSupportedType() == tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_LEGACY_ANDROID) || (tutao.tutanota.util.ClientDetector.getSupportedType() == tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_LEGACY_IE_MOBILE);
	this.mailRef = null; // the mail reference for an external user
	this._allowAutoLogin = true; // indicates if auto login allowed. needs to be disabled if logout is clicked 
};

/**
 * Displays the not supported view if this client is not supported
 * @return {boolean} true, if this client is supported
 */
tutao.tutanota.ctrl.Navigator.prototype.verifyClientSupported = function() {
	if (!this.clientSupported) {
		tutao.locator.viewManager.select(tutao.locator.notSupportedView);
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
		tutao.locator.viewManager.select(tutao.locator.notSupportedView);
		return false;
	} else {
		return true;
	}
};

tutao.tutanota.ctrl.Navigator.prototype.logout = function(autoLoginAllowed, storeEntropy) {
    if (storeEntropy){
        tutao.locator.loginViewModel.storeEntropy();
    }
	this._login(autoLoginAllowed);
};

tutao.tutanota.ctrl.Navigator.prototype._login = function(autoLoginAllowed) {
    this._allowAutoLogin = autoLoginAllowed;
    if (this.mailRef == null) {
        location.replace("#login");
    } else {
        location.replace("#mail/" + this.mailRef); // an external user was logged in, we redirect him to his login page
    }
};

tutao.tutanota.ctrl.Navigator.prototype.notSupported = function() {
	location.replace("#notSupported");
};

tutao.tutanota.ctrl.Navigator.prototype.mail = function() {
    if ( tutao.locator.navigator.mailRef != null){
        location.replace("#box/" + tutao.locator.navigator.mailRef);
    }else{
        location.replace("#box");
    }
};

tutao.tutanota.ctrl.Navigator.prototype.newMail = function(recipient) {
	if (tutao.locator.mailViewModel.newMail(recipient)) {
		this.mail();
	}
};

tutao.tutanota.ctrl.Navigator.prototype.contact = function() {
	location.replace("#contact");
};

tutao.tutanota.ctrl.Navigator.prototype.newContact = function() {
	tutao.locator.contactViewModel.newContact();
	this.contact();
};

tutao.tutanota.ctrl.Navigator.prototype.logs = function() {
	location.replace("#logs");
};

tutao.tutanota.ctrl.Navigator.prototype.db = function() {
	location.replace("#db");
};

tutao.tutanota.ctrl.Navigator.prototype.monitor = function() {
	location.replace("#monitor");
};

tutao.tutanota.ctrl.Navigator.prototype.config = function() {
	location.replace("#config");
};

tutao.tutanota.ctrl.Navigator.prototype.customer = function() {
	location.replace("#customer");
};

tutao.tutanota.ctrl.Navigator.prototype.settings = function() {
	location.replace("#settings");
};

tutao.tutanota.ctrl.Navigator.prototype.register = function() {
    location.replace("#register");
};

/**
 * Switches to the provided view, if the user is authenticated. Otherwise, switches to the LoginView
 * @param {Object} view The view to switch to.
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
    Path.map("#registerstarter").to(function() {
        if (tutao.locator.userController.isInternalUserLoggedIn() || tutao.locator.userController.isExternalUserLoggedIn()) {
            tutao.tutanota.Bootstrap.init();
        }
        if (self.verifyClientSupported()) {
            tutao.locator.viewManager.select(tutao.locator.registrationVerifyDomainView, {});
        }
    });

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

	Path.map("#login").to(function() {
        tutao.locator.navigator.mailRef = null;
		if (tutao.locator.userController.isInternalUserLoggedIn() || tutao.locator.userController.isExternalUserLoggedIn()) {
			tutao.tutanota.Bootstrap.init();
			tutao.tutanota.gui.resetLogoBindings();
		}
		if (self.verifyClientSupported()) {
			// provide allowAutoLogin to loginViewModel here as soon as device management is running
			tutao.locator.viewManager.select(tutao.locator.loginView);
		}
	});

	Path.map("#notSupported").to(function() {
		tutao.locator.viewManager.select(tutao.locator.notSupportedView);
	});

	Path.map("#mail/:mailRef").to(function() {
		if (tutao.locator.userController.isInternalUserLoggedIn() || tutao.locator.userController.isExternalUserLoggedIn()) {
			tutao.tutanota.Bootstrap.init();
            tutao.tutanota.gui.resetLogoBindings();
		}
		if (self.verifyExternalClientSupported()) {
			// the mail reference must not be set on self, but on tutao.locator.navigator because it was replaced in Bootstrap
			tutao.locator.navigator.mailRef = this.params["mailRef"];
			tutao.locator.externalLoginViewModel.setup(self._allowAutoLogin, tutao.locator.navigator.mailRef, function() {
				tutao.locator.viewManager.select(tutao.locator.externalLoginView);
			});
		}
	});
	
	Path.map("#contact").to(function() {
		self.authenticateAndSwitchToView(tutao.locator.contactView);
	});

	Path.map("#box").to(function() {
		self.authenticateAndSwitchToView(tutao.locator.mailView);
	});

    Path.map("#box/:mailRef").to(function() {
        tutao.locator.navigator.mailRef = this.params["mailRef"];
        self.authenticateAndSwitchToView(tutao.locator.mailView)
    });


	Path.map("#file").to(function() {
		self.authenticateAndSwitchToView(tutao.locator.fileView);
	});
	
	Path.map("#db").to(function() {
		self.authenticateAndSwitchToView(tutao.locator.dbView);
	});
	
	Path.map("#logs").to(function() {
		self.authenticateAndSwitchToView(tutao.locator.logView);
	});
	
	Path.map("#monitor").to(function() {
		self.authenticateAndSwitchToView(tutao.locator.monitorView);
	});
	
	Path.map("#config").to(function() {
		self.authenticateAndSwitchToView(tutao.locator.configView);
	});
	
	Path.map("#customer").to(function() {
		self.authenticateAndSwitchToView(tutao.locator.customerView);
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

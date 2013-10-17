"use strict";

goog.provide('tutao.tutanota.ctrl.Navigator');

// TODO (before beta) check if switching to http://oscar.finnsson.nu/pagerjs/ is an alternative:
// written for knockout and more active. Page bindings and params come into index.html
tutao.tutanota.ctrl.Navigator = function() {
	// just for testing: tutao.tutanota.util.ClientDetector._supported = tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_UNKNOWN;
	this.clientSupported = (tutao.tutanota.util.ClientDetector.getSupportedType() == tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_SUPPORTED);
	this.externalClientSupported = this.clientSupported || (tutao.tutanota.util.ClientDetector.getSupportedType() == tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_LEGACY);

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

tutao.tutanota.ctrl.Navigator.prototype.login = function() {
	window.location.hash = "login";
};

tutao.tutanota.ctrl.Navigator.prototype.notSupported = function() {
	window.location.hash = "#notSupported";
};

tutao.tutanota.ctrl.Navigator.prototype.mail = function(mail) {
	window.location.hash = "#box";
	if (mail) {
		tutao.locator.mailViewModel.showMail(mail);
	}
};

tutao.tutanota.ctrl.Navigator.prototype.newMail = function(recipient) {
	if (tutao.locator.mailViewModel.newMail(recipient)) {
		this.mail();
	}
};

tutao.tutanota.ctrl.Navigator.prototype.contact = function() {
	window.location.hash = "#contact";
};

tutao.tutanota.ctrl.Navigator.prototype.newContact = function() {
	tutao.locator.contactViewModel.newContact();
	this.contact();
};

tutao.tutanota.ctrl.Navigator.prototype.logs = function() {
	window.location.hash = "#logs";
};

tutao.tutanota.ctrl.Navigator.prototype.db = function() {
	window.location.hash = "#db";
};

tutao.tutanota.ctrl.Navigator.prototype.monitor = function() {
	window.location.hash = "#monitor";
};

tutao.tutanota.ctrl.Navigator.prototype.config = function() {
	window.location.hash = "#config";
};

tutao.tutanota.ctrl.Navigator.prototype.customer = function() {
	window.location.hash = "#customer";
};

tutao.tutanota.ctrl.Navigator.prototype.settings = function() {
	window.location.hash = "#settings";
};

/**
 * Switches to the provided view, if the user is authenticated. Otherwise, switches to the LoginView
 * @param {Object} view The view to switch to.
 */
tutao.tutanota.ctrl.Navigator.prototype.authenticateAndSwitchToView = function(view) {
	if (tutao.locator.userController.isInternalUserLoggedIn() || tutao.locator.userController.isExternalUserLoggedIn()) {
		tutao.locator.viewManager.select(view);
	} else {
		console.log("User not authenticated, switching to login view.");
		this.login();
	}
};

tutao.tutanota.ctrl.Navigator.prototype.setup = function(view) {
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

	Path.map("#login").to(function() {
		if (tutao.locator.userController.isInternalUserLoggedIn() || tutao.locator.userController.isExternalUserLoggedIn()) {
			tutao.tutanota.Bootstrap.init();
		}
		if (self.verifyClientSupported()) {
			tutao.locator.viewManager.select(tutao.locator.loginView);
		}
	});

	Path.map("#notSupported").to(function() {
		tutao.locator.viewManager.select(tutao.locator.notSupportedView);
	});

	Path.map("#mail/:mailRef").to(function() {
		if (tutao.locator.userController.isInternalUserLoggedIn() || tutao.locator.userController.isExternalUserLoggedIn()) {
			tutao.tutanota.Bootstrap.init();
		}
		if (self.verifyExternalClientSupported()) {
			var mailRef = this.params["mailRef"];
			tutao.locator.externalLoginViewModel.setup(mailRef, function() {
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

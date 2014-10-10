"use strict";

tutao.provide('tutao.tutanota.ctrl.DeveloperViewModel');
tutao.provide('tutao.tutanota.ctrl.DeveloperTest');

/**
 * @constructor
 * {string} title
 * {function} action
 */
tutao.tutanota.ctrl.DeveloperTest = function(title, action) {
    this.title = title;
    this.action = action;
    this.action.bind(this);
    this.details = ko.observable("");

};

/**
 * The ViewModel for the devloper tests wizard.
 * @constructor
 */
tutao.tutanota.ctrl.DeveloperViewModel = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

	this.showDialog = ko.observable(false);
    this.badge = 0;

    var self = this;

    this.tests = [
        new tutao.tutanota.ctrl.DeveloperTest("Get phone number", function () {
            var self = this;
            tutao.locator.phone.getNumber()
                .then(function (number) {
                    self.details(number);
                })
                .catch(function (e) {
                    console.log(e);
                    self.details("could not fetch phoneNumber");
                });
        }),
        new tutao.tutanota.ctrl.DeveloperTest("Generate rsa key", function () {
            var self = this;
            self.details("started...");
            var start = new Date().getTime();
            tutao.locator.crypto.generateRsaKey()
                .then(function (key) {
                    var time = new Date().getTime() - start;
                    self.details("|took " + time);
                })
                .catch(function (e) {
                    console.log(e);
                    self.details("could not generate key");
                });
        }),
        new tutao.tutanota.ctrl.DeveloperTest("Create notification", function () {
            var self = this;
            tutao.locator.notification.add("Title", "message", 1).then(function () {
                console.log("user clicked on notification");
            });
        }),
        new tutao.tutanota.ctrl.DeveloperTest("Increase Badge", function () {
            tutao.locator.notification.updateBadge(self.badge++);
        }),
        new tutao.tutanota.ctrl.DeveloperTest("Decrease Badge", function () {
            tutao.locator.notification.updateBadge(self.badge--);
        }),

        new tutao.tutanota.ctrl.DeveloperTest("run tests", function () {
            var self = this;
            self.details("forwarding...");
            var locationArray = location.href.split('/')
            var rootFolder = locationArray.slice(0, locationArray.length - 1).join('/') + ('/');
            location.href = rootFolder + "test/index.html";
        })
    ];
};

/**
 */
tutao.tutanota.ctrl.DeveloperViewModel.prototype.open = function() {
    this.showDialog(true);
};

tutao.tutanota.ctrl.DeveloperViewModel.prototype.close = function() {
    this.showDialog(false);
};
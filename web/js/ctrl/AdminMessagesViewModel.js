"use strict";

tutao.provide('tutao.tutanota.ctrl.AdminMessagesViewModel');

tutao.tutanota.ctrl.AdminMessagesViewModel = function() {
    tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

    this.saveStatus = ko.observable({ type: "neutral", text: "emptyString_msg" });
    this.busy = ko.observable(true);
    this.properties = ko.observable(null);

    var self = this;
    tutao.locator.userController.getLoggedInUser().loadCustomer().then(function(customer) {
        return customer.loadProperties().then(function(properties) {
            self.properties(new tutao.entity.sys.CustomerPropertiesEditable(properties));
            self.busy(false);
        });
    });
};

tutao.tutanota.ctrl.AdminMessagesViewModel.prototype.confirm = function() {
    if (tutao.locator.viewManager.isFreeAccount()) {
        tutao.locator.viewManager.showNotAvailableForFreeDialog();
        return;
    }
    if (this.busy()) {
        return;
    }
    this.busy(true);
    var self = this;
    this.properties().update();
    this.properties().getCustomerProperties().update().then(function() {
        self.saveStatus({ type: "valid", text: "saved_msg" });
    });
};

tutao.tutanota.ctrl.AdminMessagesViewModel.prototype._updateLogos = function() {
    var properties = new tutao.entity.sys.CustomerProperties();
    if (this.properties().smallLogo()) {
        properties.setSmallLogo(new tutao.entity.sys.File(properties).setMimeType(this.properties().smallLogo().mimeType()).setData(this.properties().smallLogo().data()));
    }
    if (this.properties().bigLogo()) {
        properties.setBigLogo(new tutao.entity.sys.File(properties).setMimeType(this.properties().bigLogo().mimeType()).setData(this.properties().bigLogo().data()));
    }
    tutao.locator.viewManager.updateLogos(properties);
};

tutao.tutanota.ctrl.AdminMessagesViewModel.prototype.selectSmallLogo = function() {
    if (tutao.locator.viewManager.isFreeAccount()) {
        tutao.locator.viewManager.showNotAvailableForFreeDialog();
        return;
    }
    if (this.busy()) {
        return;
    }
    this._selectLogo(this.properties().smallLogo);
};

tutao.tutanota.ctrl.AdminMessagesViewModel.prototype.selectBigLogo = function() {
    if (tutao.locator.viewManager.isFreeAccount()) {
        tutao.locator.viewManager.showNotAvailableForFreeDialog();
        return;
    }
    if (this.busy()) {
        return;
    }
    this._selectLogo(this.properties().bigLogo);
};

tutao.tutanota.ctrl.AdminMessagesViewModel.prototype._selectLogo = function(logoObservable) {
    var self = this;
    tutao.locator.fileFacade.showFileChooser().then(function(fileList) {
        if (fileList.length > 1) {
            tutao.tutanota.gui.alert(tutao.lang("couldNotAttachFile_msg"));
        } else {
            var logo = new tutao.entity.sys.FileEditable(new tutao.entity.sys.File(self.properties)
                .setName(fileList[0].getName())
                .setMimeType(fileList[0].getMimeType())
                .setData(tutao.util.EncodingConverter.arrayBufferToBase64(fileList[0].getData())));
            logoObservable(logo);
            self._updateLogos();
        }
    }).caught(function(error) {
        tutao.tutanota.gui.alert(tutao.lang("couldNotAttachFile_msg"));
        console.log(error);
    });
};

tutao.tutanota.ctrl.AdminMessagesViewModel.prototype.deleteSmallLogo = function() {
    if (this.busy() || !this.properties().smallLogo()) {
        return;
    }
    this.properties().smallLogo(null);
    this._updateLogos();
};

tutao.tutanota.ctrl.AdminMessagesViewModel.prototype.deleteBigLogo = function() {
    if (this.busy() || !this.properties().bigLogo()) {
        return;
    }
    this.properties().bigLogo(null);
    this._updateLogos();
};

tutao.tutanota.ctrl.AdminMessagesViewModel.prototype.getLogoInfoLink = function() {
    return tutao.locator.languageViewModel.getCurrentLanguage() == "de" ? "http://tutanota.uservoice.com/knowledgebase/articles/746151" : "http://tutanota.uservoice.com/knowledgebase/articles/746133";
};
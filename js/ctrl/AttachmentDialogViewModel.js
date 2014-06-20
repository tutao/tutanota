"use strict";

goog.provide('tutao.tutanota.ctrl.AttachmentDialogViewModel');

/**
 * The ViewModel for the safari legacy download.
 * @constructor
 */
tutao.tutanota.ctrl.AttachmentDialogViewModel = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

	this.filename = ko.observable("");
    this.mimeType = ko.observable("");
    this.blobUrl = ko.observable("");
    this.textId = ko.observable(null);
	this.dialogVisible = ko.observable(false);
    this._callback = null;

};


tutao.tutanota.ctrl.AttachmentDialogViewModel.prototype.showDialog = function(filename, pMimeType, pBlobUrl, textId, callback) {
	this.filename(filename);
    this.mimeType(pMimeType);
    this.blobUrl(pBlobUrl);
    this.textId(textId);
    this._callback = callback;

    var attachmentDialog = $("#attachmentDialog").get(0);
    var lastElement = document.getElementById("attachmentObject");

    if (lastElement) {
        attachmentDialog.removeChild(lastElement);
    }

    //
    this.dialogVisible(true);

    var objectElement = document.createElement("div");
    objectElement.setAttribute( "text", "cannot show file");

    if ( this.isImageType()){
        var objectElement = document.createElement("img");
        objectElement.setAttribute("id", "attachmentObject");
        objectElement.setAttribute("src", pBlobUrl);
    } else if (this.isVideoType() ){
        var objectElement = document.createElement("video");
        objectElement.setAttribute("id", "attachmentObject");
        objectElement.setAttribute("src", pBlobUrl);
        objectElement.setAttribute("controls", "true");
    } else if (this.isTextType() ){
        var objectElement = document.createElement("iframe");
        objectElement.setAttribute("id", "attachmentObject");
        objectElement.setAttribute("src", pBlobUrl);
    }
    attachmentDialog.appendChild(objectElement);
};



tutao.tutanota.ctrl.AttachmentDialogViewModel.prototype.closeDialog = function() {
	this.dialogVisible(false);
    this._callback();
};

tutao.tutanota.ctrl.AttachmentDialogViewModel.prototype.isVideoType = function() {
    return this.mimeType().indexOf("video") != -1;
};

tutao.tutanota.ctrl.AttachmentDialogViewModel.prototype.isImageType = function() {
    return this.mimeType().indexOf("image")!= -1;
};

tutao.tutanota.ctrl.AttachmentDialogViewModel.prototype.isTextType = function() {
    return this.mimeType().indexOf("text")!= -1;
};






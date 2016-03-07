"use strict";

tutao.provide('tutao.native.FileFacadeAndroidApp');

/**
 * @implements {tutao.native.FileFacade}
 * @constructor
 */
tutao.native.FileFacadeAndroidApp = function() {
    this.fileUtil = new tutao.native.device.FileUtil();
    tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
};

/**
 * @inheritDoc
 */
tutao.native.FileFacadeAndroidApp.prototype.createFile = function(file, sessionKey) {
	// implement together with FileView.
};


/**
 * @inheritDoc
 */
tutao.native.FileFacadeAndroidApp.prototype.showFileChooser = function() {
    var self = this;
    return self.fileUtil.openFileChooser().then(function (uri) {
        return Promise.join(self.fileUtil.getName(uri), self.fileUtil.getMimeType(uri), self.fileUtil.getSize(uri), function (name, mimeType, size) {
            return [new tutao.native.AndroidFile(uri, name, mimeType, size)];
        });
    });
};

/**
 * @inheritDoc
 */
tutao.native.FileFacadeAndroidApp.prototype.uploadFileData = function(/*tutao.native.AndroidFile*/file, sessionKey) {
    tutao.util.Assert.assert(file instanceof tutao.native.AndroidFile, "unsupported file type");
    var self = this;

    var fileData = new tutao.entity.tutanota.FileDataDataPost();
    var byteSessionKey = new Uint8Array(sjcl.codec.bytes.fromBits(sessionKey));
    return tutao.locator.crypto.aesEncryptFile(byteSessionKey, file.getLocation()).then(function (encryptedFileUrl) {
        // create file data
        fileData.setSize(String(file.getSize()))
            .setGroup(tutao.locator.userController.getUserGroupId());

        return fileData.setup({}, null).then(function(fileDataPostReturn) {
            // upload file data
            var fileDataId = fileDataPostReturn.getFileData();
            var putParams = { fileDataId: fileDataId };
            putParams[tutao.rest.ResourceConstants.SW_VERSION_PARAMETER] = tutao.entity.tutanota.FileDataDataReturn.MODEL_VERSION;
            var path = tutao.env.getHttpOrigin() + tutao.rest.EntityRestClient.createUrl(tutao.entity.tutanota.FileDataDataReturn.PATH, null, null, putParams)
            return self.fileUtil.upload(encryptedFileUrl, path, tutao.entity.EntityHelper.createAuthHeaders()).then(function (responseCode) {
                if (responseCode == 200) {
                    return fileDataId;
                } else {
                    throw new tutao.util.ErrorFactory().handleRestError(responseCode, "failed to natively upload attachment");
                }
            });
        }).lastly(function () {
            self.fileUtil.deleteFile(encryptedFileUrl);
        });
    });
};

/**
 * @inheritDoc
 */
tutao.native.FileFacadeAndroidApp.prototype.readFileData = function(file) {
    var self = this;

    var fileParams = new tutao.entity.tutanota.FileDataDataGet()
        .setFile(file.getId())
        .setBase64(false);
	var params = {};
	params[tutao.rest.ResourceConstants.GET_BODY_PARAM] = encodeURIComponent(JSON.stringify(fileParams.toJsonData()));
	var headers = tutao.entity.EntityHelper.createAuthHeaders();
    var path = tutao.env.getHttpOrigin() + tutao.rest.EntityRestClient.createUrl(tutao.entity.tutanota.FileDataDataReturn.PATH, null, null, params);
    return self.fileUtil.download(path, file.getName(), headers).then(function (downloadedFileUri) {
        var byteSessionKey = new Uint8Array(sjcl.codec.bytes.fromBits(file._entityHelper._sessionKey));
        return tutao.locator.crypto.aesDecryptFile(byteSessionKey, downloadedFileUri).then(function(decryptedFileUri) {
            return new tutao.native.AndroidFile(decryptedFileUri, file.getName(), file.getMimeType(), Number(file.getSize()));
        }).lastly(function () {
            self.fileUtil.deleteFile(downloadedFileUri);
        });
    });
};

/**
 * @inheritDoc
 */
tutao.native.FileFacadeAndroidApp.prototype.open = function(file) {
    var self = this;
    self.fileUtil.open(file.getLocation(), file.getMimeType()).caught(function() {
        return tutao.tutanota.gui.alert(tutao.lang("canNotOpenFileOnDevice_msg"));
/* use when sending feedback. currently java exceptions are not received here
        var message = tutao.lang("canNotOpenFileOnDevice_msg");
        var timestamp = new Date().toUTCString();
        return tutao.locator.modalDialogViewModel.showDialog(message, ["send_action", "ok_action"]).then(function(buttonIndex) {
            if (buttonIndex == 1) {
                tutao.tutanota.ctrl.FeedbackViewModel.sendFeedbackMail(e.message, timestamp, e).caught(function(e) {
                    console.log("could not send feedback", e);
                });
            }
        });
*/
    }).lastly(function () {
        self.fileUtil.deleteFile(file.getLocation());
    });
};

/**
 * @inheritDoc
 */
tutao.native.FileFacadeAndroidApp.prototype.bytesToFile = function(bytes, file) {
    var fileUri = this.configFile = cordova.file.dataDirectory + "temp/decrypted/" + file.getName();
    return this.fileUtil.write(fileUri, bytes).then(function () {
        return new tutao.native.AndroidFile(fileUri, file.getName(), file.getMimeType(), bytes.byteLength);
    });
};
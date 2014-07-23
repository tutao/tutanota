"use strict";

goog.provide('tutao.tutanota.ctrl.FileFacade');

/**
 * Creates a new file on the server in the user file system.
 * @param {tutao.tutanota.util.DataFile} dataFile The data file.
 * @param {Object} sessionKey The session key used to encrypt the file.
 * @return {Promise.<Array.<String>>} Resolves to the id of the created File, rejected if failed.
 */
tutao.tutanota.ctrl.FileFacade.createFile = function(dataFile, sessionKey) {
	return tutao.tutanota.ctrl.FileFacade.uploadFileData(dataFile, sessionKey).then(function(fileDataId) {
        // create file
        var fileService = new tutao.entity.tutanota.CreateFileData();
        fileService._entityHelper.setSessionKey(sessionKey);
        fileService.setFileName(dataFile.getName())
            .setMimeType(dataFile.getMimeType())
            .setParentFolder(null)
            .setFileData(fileDataId);

        var fileListId = tutao.locator.mailBoxController.getUserFileSystem().getFiles();
        return fileService._entityHelper.createListEncSessionKey(fileListId).then(function(listEncSessionKey) {
            return fileService.setGroup(tutao.locator.userController.getUserGroupId())
                .setListEncSessionKey(listEncSessionKey)
                .setup({}, null)
                .then(function(createFileReturn) {
                var fileId = createFileReturn.getFile();
                return fileId;
            });
        });
	});
};

/**
 * Creates a new file data instance on the server and uploads the data from the given DataFile to it.
 * @param {tutao.tutanota.util.DataFile} dataFile The data file.
 * @param {Object} sessionKey The session key used to encrypt the file.
 * @return {Promise.<String>} Resolves to the id of the created FileData, rejected if failed.
 */
tutao.tutanota.ctrl.FileFacade.uploadFileData = function(dataFile, sessionKey) {
	var fileData = new tutao.entity.tutanota.FileDataDataPost();
    return new Promise(function(resolve, reject) {
        tutao.locator.aesCrypter.encryptArrayBuffer(sessionKey, dataFile.getData(), function(encryptedData, exception) {
            if (exception) {
                reject(exception);
            }
            // create file data
            fileData.setSize(dataFile.getSize().toString())
                .setGroup(tutao.locator.userController.getUserGroupId());

            resolve(fileData.setup({}, null).then(function(fileDataPostReturn) {
                // upload file data
                var fileDataId = fileDataPostReturn.getFileData();
                var putParams = { fileDataId: fileDataId };
                putParams[tutao.rest.ResourceConstants.SW_VERSION_PARAMETER] = tutao.entity.tutanota.FileDataDataReturn.MODEL_VERSION;
                return tutao.locator.restClient.putBinary(tutao.rest.EntityRestClient.createUrl(tutao.entity.tutanota.FileDataDataReturn.PATH, null, null, putParams), tutao.entity.EntityHelper.createAuthHeaders(), encryptedData).then(function() {
                    return fileDataId;
                });
            }));
        })
    });
};

/**
 * Loads the content of a file from the server and provides it as DataFile.
 * @param {tutao.entity.tutanota.File} file The File.
 * @return {Promise.<tutao.tutanota.util.DataFile>} Resolves to the read DataFile, rejected if loading failed.
 */
tutao.tutanota.ctrl.FileFacade.readFileData = function(file) {
    var fileParams = new tutao.entity.tutanota.FileDataDataGet()
        .setFile(file.getId())
        .setBase64(tutao.tutanota.util.ClientDetector.getSupportedType() == tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_LEGACY_IE);
	var params = {};
	params[tutao.rest.ResourceConstants.GET_BODY_PARAM] = encodeURIComponent(JSON.stringify(fileParams.toJsonData()));
	var headers = tutao.entity.EntityHelper.createAuthHeaders();
	return tutao.locator.restClient.getBinary(tutao.rest.EntityRestClient.createUrl(tutao.entity.tutanota.FileDataDataReturn.PATH, null, null, params), headers).then(function(data) {
        return new Promise(function(resolve, reject) {
            if (typeof data === "string") {
                // LEGACY variant for IE8/9 which uses an Array instead of ArrayBuffer
                tutao.locator.aesCrypter.decryptBase64(file._entityHelper._sessionKey, data, file.getSize(), function(decryptedData, exception) {
                    if (exception) {
                        reject(exception);
                    } else {
                        resolve(new tutao.tutanota.util.DataFile(decryptedData, file));
                    }
                });
            } else {
                tutao.locator.aesCrypter.decryptArrayBuffer(file._entityHelper._sessionKey, data, file.getSize(), function(decryptedData, exception) {
                    if (exception) {
                        reject(exception);
                    } else {
                        resolve(new tutao.tutanota.util.DataFile(decryptedData, file));
                    }
                });
            }
        });
	});
};

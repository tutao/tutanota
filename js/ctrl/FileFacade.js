"use strict";

goog.provide('tutao.tutanota.ctrl.FileFacade');

/**
 * Creates a new file on the server in the user file system.
 * @param {tutao.tutanota.util.DataFile} dataFile The data file.
 * @param {Object} sessionKey The session key used to encrypt the file.
 * @param {function(?Array.<String>,tutao.rest.EntityRestException=)} callback Is called when finished with the id of the created File. Passes an exception if creating the file fails.
 */
tutao.tutanota.ctrl.FileFacade.createFile = function(dataFile, sessionKey, callback) {
	tutao.tutanota.ctrl.FileFacade.uploadFileData(dataFile, sessionKey, function(fileDataId, exception) {
		if (exception) {
			callback(null, exception);
			return;
		}
        // create file
        var fileService = new tutao.entity.tutanota.CreateFileData();
        fileService._entityHelper.setSessionKey(sessionKey);
        fileService.setFileName(dataFile.getName())
            .setMimeType(dataFile.getMimeType())
            .setParentFolder(null)
            .setFileData(fileDataId);

        var fileListId = tutao.locator.mailBoxController.getUserFileSystem().getFiles();
        fileService._entityHelper.createListEncSessionKey(fileListId, function(listEncSessionKey, exception) {
            if (exception) {
                callback(null, exception);
                return;
            }
            fileService.setGroup(tutao.locator.userController.getUserGroupId())
                .setListEncSessionKey(listEncSessionKey)
                .setup({}, null, function(createFileReturn, exception) {
                var fileId = createFileReturn.getFile();
                if (exception) {
                    callback(null, new tutao.rest.EntityRestException(exception));
                    return;
                }
                callback(fileId);
            });
        });
	});
};

/**
 * Creates a new file data instance on the server and uploads the data from the given DataFile to it.
 * @param {tutao.tutanota.util.DataFile} dataFile The data file.
 * @param {Object} sessionKey The session key used to encrypt the file.
 * @param {function(?String,tutao.rest.EntityRestException=)} callback Is called when finished with the id of the created FileData. Passes an exception if creating the file fails.
 */
tutao.tutanota.ctrl.FileFacade.uploadFileData = function(dataFile, sessionKey, callback) {
	var fileData = new tutao.entity.tutanota.FileDataDataPost();
	tutao.locator.aesCrypter.encryptArrayBuffer(sessionKey, dataFile.getData(), function(encryptedData, exception) {
		if (exception) {
			callback(null, new tutao.rest.EntityRestException(exception));
			return;
		}
		// create file data
		fileData.setSize(dataFile.getSize().toString())
            .setGroup(tutao.locator.userController.getUserGroupId());

		fileData.setup({}, null, function(fileDataPostReturn, exception) {
			if (exception) {
				callback(null, new tutao.rest.EntityRestException(exception));
				return;
			}
			// upload file data
			var fileDataId = fileDataPostReturn.getFileData();
			var putParams = { fileDataId: fileDataId };
			putParams[tutao.rest.ResourceConstants.SW_VERSION_PARAMETER] = tutao.entity.Constants.Version;
			tutao.locator.restClient.putBinary(tutao.rest.EntityRestClient.createUrl(tutao.entity.tutanota.FileDataDataReturn.PATH, null, null, putParams), tutao.entity.EntityHelper.createAuthHeaders(), encryptedData, function(exception) {
				if (exception) {
					callback(null, new tutao.rest.EntityRestException(exception));
					return;
				}
				callback(fileDataId);
			});
		});
	});
};

/**
 * Loads the content of a file from the server and provides it as DataFile.
 * @param {tutao.entity.tutanota.File} file The File.
 * @param {function(?tutao.tutanota.util.DataFile,tutao.rest.EntityRestException=)} callback Called when finished with the DataFile. Passes an exception if loading the file fails.
 */
tutao.tutanota.ctrl.FileFacade.readFileData = function(file, callback) {
    var fileParams = new tutao.entity.tutanota.FileDataDataGet()
        .setFile(file.getId())
        .setBase64(tutao.tutanota.util.ClientDetector.getSupportedType() == tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_LEGACY);
	var params = {};
	params[tutao.rest.ResourceConstants.GET_BODY_PARAM] = encodeURIComponent(JSON.stringify(fileParams.toJsonData()));
	var headers = tutao.entity.EntityHelper.createAuthHeaders();
	tutao.locator.restClient.getBinary(tutao.rest.EntityRestClient.createUrl(tutao.entity.tutanota.FileDataDataReturn.PATH, null, null, params), headers, function(data, exception) {
		if (exception) {
			callback(null, new tutao.rest.EntityRestException(exception));
			return;
		}
		if (typeof data === "string") {
			// LEGACY variant for IE8/9 which uses an Array instead of ArrayBuffer
			tutao.locator.aesCrypter.decryptBase64(file._entityHelper._sessionKey, data, file.getSize(), function(decryptedData, exception) {
				if (exception) {
					callback(null, new tutao.rest.EntityRestException(exception));
					return;
				}
				callback(new tutao.tutanota.util.DataFile(decryptedData, file));
			});
		} else {
			tutao.locator.aesCrypter.decryptArrayBuffer(file._entityHelper._sessionKey, data, file.getSize(), function(decryptedData, exception) {
				if (exception) {
					callback(null, new tutao.rest.EntityRestException(exception));
					return;
				}
				callback(new tutao.tutanota.util.DataFile(decryptedData, file));
			});
		}
	});
};

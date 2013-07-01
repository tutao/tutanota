"use strict";

goog.provide('tutao.tutanota.ctrl.FileFacade');

/**
 * Creates a new file on the server in the user file system.
 * @param {tutao.tutanota.util.DataFile} dataFile The data file.
 * @param {function(?Array.<String>,tutao.rest.EntityRestException=)} callback Is called when finished with the id of the created File. Passes an exception if creating the file fails.
 */
tutao.tutanota.ctrl.FileFacade.createFile = function(dataFile, callback) {
	tutao.tutanota.ctrl.FileFacade.uploadFileData(dataFile, function(fileDataId, exception) {
		if (exception) {
			callback(null, exception);
			return;
		}
		// load the file data to get the session key
		tutao.entity.tutanota.FileData.load(fileDataId, function(fileData, exception) {
			if (exception) {
				callback(null, exception);
				return;
			}
			// create file
			var fileService = new tutao.entity.tutanota.CreateDataFileService();
			fileService._entityHelper.setSessionKey(fileData._entityHelper.getSessionKey());
			fileService.setFileName(dataFile.getName());
			fileService.setMimeType(dataFile.getMimeType());
			fileService.setParentFolder(null);
			fileService.setFileData(fileDataId);

			var fileListId = tutao.locator.mailBoxController.getUserFileSystem().getFiles();
			fileService._entityHelper.createListEncSessionKey(fileListId, function(listEncSessionKey, exception) {
				if (exception) {
					callback(null, exception);
					return;
				}
				var headers = tutao.entity.EntityHelper.createAuthHeaders();
				var fileParams = fileService._entityHelper.createPostPermissionMap(tutao.locator.mailBoxController.getUserFileSystemBucketData());
				fileParams[tutao.rest.ResourceConstants.LIST_ENC_SESSION_KEY] = tutao.util.EncodingConverter.base64ToBase64Url(listEncSessionKey);
				fileParams[tutao.rest.ResourceConstants.SW_VERSION_PARAMETER] = tutao.entity.tutanota.Constants.Version;
				fileService.setup(fileParams, headers, function(fileId, exception) {
					if (exception) {
						callback(null, new tutao.rest.EntityRestException(exception));
						return;
					}
					callback(fileId);
				});
			});
		});
	});
};

/**
 * Creates a new file data instance on the server and uploads the data from the given DataFile to it.
 * @param {tutao.tutanota.util.DataFile} dataFile The data file.
 * @param {function(?String,tutao.rest.EntityRestException=)} callback Is called when finished with the id of the created FileData. Passes an exception if creating the file fails.
 */
tutao.tutanota.ctrl.FileFacade.uploadFileData = function(dataFile, callback) {
	var fileDataService = new tutao.entity.tutanota.FileDataService();
	tutao.locator.aesCrypter.encryptArrayBuffer(fileDataService._entityHelper.getSessionKey(), dataFile.getData(), function(encryptedData, exception) {
		if (exception) {
			callback(null, new tutao.rest.EntityRestException(exception));
			return;
		}
		var headers = tutao.entity.EntityHelper.createAuthHeaders();
		// create file data
		fileDataService.setSize(dataFile.getSize().toString());
		var postParams = {};
		postParams[tutao.rest.ResourceConstants.GROUP_ID] = tutao.locator.userController.getUserGroupId();
		var symEncSessionKey = tutao.locator.aesCrypter.encryptKey(tutao.locator.userController.getUserGroupKey(), fileDataService._entityHelper.getSessionKey());
		postParams[tutao.rest.ResourceConstants.SYM_ENC_SESSION_KEY] = tutao.util.EncodingConverter.base64ToBase64Url(symEncSessionKey);
		postParams[tutao.rest.ResourceConstants.SW_VERSION_PARAMETER] = tutao.entity.tutanota.Constants.Version;
		
		fileDataService.setup(postParams, headers, function(fileDataId, exception) {
			if (exception) {
				callback(null, new tutao.rest.EntityRestException(exception));
				return;
			}
			// upload file data
			var putParams = { fileDataId: fileDataId };
			putParams[tutao.rest.ResourceConstants.SW_VERSION_PARAMETER] = tutao.entity.tutanota.Constants.Version;
			tutao.locator.restClient.putBinary(tutao.rest.EntityRestClient.createUrl(tutao.entity.tutanota.FileDataService.PATH, null, null, putParams), headers, encryptedData, function(exception) {
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
 * @param {function(!tutao.tutanota.util.DataFile,tutao.rest.EntityRestException=)} callback Called when finished with the DataFile. Passes an exception if loading the file fails.
 */
tutao.tutanota.ctrl.FileFacade.readFileData = function(file, callback) {
	var params = {};
	params["fileListId"] = file.getId()[0];
	params["fileId"] = file.getId()[1];
	if (tutao.tutanota.util.ClientDetector.getSupportedType() == tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_LEGACY) {
		params["base64"] = "true";
	}
	params[tutao.rest.ResourceConstants.SW_VERSION_PARAMETER] = tutao.entity.tutanota.Constants.Version;
	var headers = tutao.entity.EntityHelper.createAuthHeaders();
	tutao.locator.restClient.getBinary(tutao.rest.EntityRestClient.createUrl(tutao.entity.tutanota.FileDataService.PATH, null, null, params), headers, function(data, exception) {
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

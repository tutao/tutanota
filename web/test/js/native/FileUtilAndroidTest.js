"use strict";

describe("FileUtilAndroidTest", function () {

    var assert = chai.assert;

    // only run on android
    if (typeof cordova == 'undefined'    || cordova.platformId != 'android') {
        return;
    }

    it("fileRoundtrip ", function () {
        var fileUtil = new tutao.native.device.FileUtil();
        var file = cordova.file.dataDirectory + "test/small.bin";
        var data = new Uint8Array([3, 240, 19]);
        return fileUtil.write(file, data).then(function () {
            return fileUtil.read(file).then(function (fileContents) {
                assert.deepEqual(fileContents, data);
            });
        });
    });

    it("size", function () {
        var fileUtil = new tutao.native.device.FileUtil();
        var file = cordova.file.dataDirectory + "test/small.bin";
        var data = new Uint8Array([3, 240, 19]);
        return fileUtil.write(file, data).then(function () {
            return fileUtil.getSize(file).then(function (size) {
                assert.equal(3, size);
            });
        });
    });

    it("mimeType for jpg file", function () {
        var fileUtil = new tutao.native.device.FileUtil();
        var file = cordova.file.dataDirectory + "test/small.jpg";
        var data = new Uint8Array([3, 240, 19]);
        return fileUtil.write(file, data).then(function () {
            return fileUtil.getMimeType(file).then(function (mimeType) {
                assert.equal("image/jpeg", mimeType);
            });
        });
    });

    it("mimeType for unknown file", function () {
        var fileUtil = new tutao.native.device.FileUtil();
        var file = cordova.file.dataDirectory + "test/small.bin";
        var data = new Uint8Array([3, 240, 19]);
        return fileUtil.write(file, data).then(function () {
            return fileUtil.getMimeType(file).then(function (mimeType) {
                assert.equal("application/octet-stream", mimeType);
            });
        });
    });
});
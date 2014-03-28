"use strict";

goog.provide('EncodingConverterTest');

var EncodingConverterTest = TestCase("EncodingConverterTest");

EncodingConverterTest.prototype.testHexBase64Roundtrip = function() {
	assertEquals("ba9012cb349de910924ed81239d18423", tutao.util.EncodingConverter.base64ToHex(tutao.util.EncodingConverter.hexToBase64("ba9012cb349de910924ed81239d18423")));
};

EncodingConverterTest.prototype.testBase64Base64UrlRoundtrip = function() {
	var base64 = tutao.util.EncodingConverter.hexToBase64("ba9012cb349de910924ed81239d18423");
	assertEquals(base64, tutao.util.EncodingConverter.base64UrlToBase64(tutao.util.EncodingConverter.base64ToBase64Url(base64)));
	base64 = tutao.util.EncodingConverter.hexToBase64("");
	assertEquals(base64, tutao.util.EncodingConverter.base64UrlToBase64(tutao.util.EncodingConverter.base64ToBase64Url(base64)));
	base64 = tutao.util.EncodingConverter.hexToBase64("e4");
	assertEquals(base64, tutao.util.EncodingConverter.base64UrlToBase64(tutao.util.EncodingConverter.base64ToBase64Url(base64)));
	base64 = tutao.util.EncodingConverter.hexToBase64("e445");
	assertEquals(base64, tutao.util.EncodingConverter.base64UrlToBase64(tutao.util.EncodingConverter.base64ToBase64Url(base64)));
	base64 = tutao.util.EncodingConverter.hexToBase64("e43434");
	assertEquals(base64, tutao.util.EncodingConverter.base64UrlToBase64(tutao.util.EncodingConverter.base64ToBase64Url(base64)));
	base64 = tutao.util.EncodingConverter.hexToBase64("e4323434");
	assertEquals(base64, tutao.util.EncodingConverter.base64UrlToBase64(tutao.util.EncodingConverter.base64ToBase64Url(base64)));
};

EncodingConverterTest.prototype.testStringToUtf8Bytes = function() {
	assertEquals("", tutao.util.EncodingConverter.hexToUtf8(tutao.util.EncodingConverter.utf8ToHex("")));
	assertEquals("€", tutao.util.EncodingConverter.hexToUtf8(tutao.util.EncodingConverter.utf8ToHex("€")));
	//TODO (jstestdriver utf8) enable as soon as jstestdriver supports utf8 or is not used any more: assertEquals([226, 130, 172], tutao.util.EncodingConverter.stringToUtf8Bytes("€"));
	assertEquals("7=/=£±™⅛°™⅜£¤°±⅛™¤°°®↑°°ÆÐª±↑£°±↑Ω£®°±đ]łæ}đ2w034r70uf", tutao.util.EncodingConverter.hexToUtf8(tutao.util.EncodingConverter.utf8ToHex("7=/=£±™⅛°™⅜£¤°±⅛™¤°°®↑°°ÆÐª±↑£°±↑Ω£®°±đ]łæ}đ2w034r70uf")));
};

EncodingConverterTest.prototype.testBytesToBase64 = function() {
	assertEquals("", tutao.util.EncodingConverter.bytesToBase64([]));
	assertEquals(tutao.util.EncodingConverter.hexToBase64(tutao.util.EncodingConverter.bytesToHex([32])), tutao.util.EncodingConverter.bytesToBase64([32]));
	assertEquals(tutao.util.EncodingConverter.hexToBase64(tutao.util.EncodingConverter.bytesToHex([32, 65])), tutao.util.EncodingConverter.bytesToBase64([32, 65]));
	assertEquals(tutao.util.EncodingConverter.hexToBase64(tutao.util.EncodingConverter.bytesToHex([32, 65, 66])), tutao.util.EncodingConverter.bytesToBase64([32, 65, 66]));
	assertEquals(tutao.util.EncodingConverter.hexToBase64(tutao.util.EncodingConverter.bytesToHex([32, 65, 66, 67])), tutao.util.EncodingConverter.bytesToBase64([32, 65, 66, 67]));
	assertEquals(tutao.util.EncodingConverter.hexToBase64(tutao.util.EncodingConverter.bytesToHex([32, 65, 66, 67, 68])), tutao.util.EncodingConverter.bytesToBase64([32, 65, 66, 67, 68]));
	assertEquals(tutao.util.EncodingConverter.hexToBase64(tutao.util.EncodingConverter.bytesToHex([0, 255])), tutao.util.EncodingConverter.bytesToBase64([0, 255]));
};

EncodingConverterTest.prototype.testBase64ToBase64Ext = function() {
	var hexPaddedGeneratedId = "4fc6fbb10000000000";
	assertEquals("IwQvgF------", tutao.util.EncodingConverter.base64ToBase64Ext(tutao.util.EncodingConverter.hexToBase64(hexPaddedGeneratedId)));
};

EncodingConverterTest.prototype.testTimestampToHexGeneratedId = function() {
	var timestamp = 1370563200000;
	assertEquals("4fc6fbb10000000000", tutao.util.EncodingConverter.timestampToHexGeneratedId(timestamp));
	assertEquals("4fc6fbb10000000000", tutao.util.EncodingConverter.timestampToHexGeneratedId(timestamp + ""));
};

EncodingConverterTest.prototype.testAsciiToArrayBuffer = function() {
    // TODO enable, after we do not use chrome 17 for testing anymore (has wrong equals implementation on array <-> arraybuffer)
    // assertEquals([97, 98, 99, 35], new Uint8Array(tutao.util.EncodingConverter.asciiToArrayBuffer("abc#")));
    // ATTENTION, unicode chars are not converted correctly, this function works only for ASCII chars
    // TODO enable after jstestdriver allows utf-8 assertEquals([172], new Uint8Array(tutao.util.EncodingConverter.asciiToArrayBuffer("€")));
};

EncodingConverterTest.prototype.testArrayBufferToBase64 = function() {
    assertEquals("YWJjIw==", tutao.util.EncodingConverter.arrayBufferToBase64(tutao.util.EncodingConverter.asciiToArrayBuffer("abc#")));
};

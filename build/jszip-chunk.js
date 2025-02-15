import { __commonJS } from "./chunk-chunk.js";

//#region libs/jszip.js
var require_jszip = __commonJS({ "libs/jszip.js"(exports, module) {
	/*!
	
	JSZip v3.10.1 - A JavaScript class for generating and reading zip files
	<http://stuartk.com/jszip>
	
	(c) 2009-2016 Stuart Knightley <stuart [at] stuartk.com>
	Dual licenced under the MIT license or GPLv3. See https://raw.github.com/Stuk/jszip/main/LICENSE.markdown.
	
	JSZip uses the library pako released under the MIT license :
	https://github.com/nodeca/pako/blob/main/LICENSE
	*/
	(function(f) {
		if (typeof exports === "object" && typeof module !== "undefined") module.exports = f();
else if (typeof define === "function" && define.amd) define([], f);
else {
			var g;
			if (typeof window !== "undefined") g = window;
else if (typeof global !== "undefined") g = global;
else if (typeof self !== "undefined") g = self;
else g = this;
			g.JSZip = f();
		}
	})(function() {
		return function e(t, n, r) {
			function s(o$1, u) {
				if (!n[o$1]) {
					if (!t[o$1]) {
						var a = typeof require == "function" && require;
						if (!u && a) return a(o$1, !0);
						if (i) return i(o$1, !0);
						var f = new Error("Cannot find module '" + o$1 + "'");
						throw f.code = "MODULE_NOT_FOUND", f;
					}
					var l = n[o$1] = { exports: {} };
					t[o$1][0].call(l.exports, function(e$1) {
						var n$1 = t[o$1][1][e$1];
						return s(n$1 ? n$1 : e$1);
					}, l, l.exports, e, t, n, r);
				}
				return n[o$1].exports;
			}
			var i = typeof require == "function" && require;
			for (var o = 0; o < r.length; o++) s(r[o]);
			return s;
		}({
			1: [function(require$1, module$1, exports$1) {
				var utils = require$1("./utils");
				var support = require$1("./support");
				var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
				exports$1.encode = function(input) {
					var output = [];
					var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
					var i = 0, len = input.length, remainingBytes = len;
					var isArray = utils.getTypeOf(input) !== "string";
					while (i < input.length) {
						remainingBytes = len - i;
						if (!isArray) {
							chr1 = input.charCodeAt(i++);
							chr2 = i < len ? input.charCodeAt(i++) : 0;
							chr3 = i < len ? input.charCodeAt(i++) : 0;
						} else {
							chr1 = input[i++];
							chr2 = i < len ? input[i++] : 0;
							chr3 = i < len ? input[i++] : 0;
						}
						enc1 = chr1 >> 2;
						enc2 = (chr1 & 3) << 4 | chr2 >> 4;
						enc3 = remainingBytes > 1 ? (chr2 & 15) << 2 | chr3 >> 6 : 64;
						enc4 = remainingBytes > 2 ? chr3 & 63 : 64;
						output.push(_keyStr.charAt(enc1) + _keyStr.charAt(enc2) + _keyStr.charAt(enc3) + _keyStr.charAt(enc4));
					}
					return output.join("");
				};
				exports$1.decode = function(input) {
					var chr1, chr2, chr3;
					var enc1, enc2, enc3, enc4;
					var i = 0, resultIndex = 0;
					var dataUrlPrefix = "data:";
					if (input.substr(0, dataUrlPrefix.length) === dataUrlPrefix) throw new Error("Invalid base64 input, it looks like a data url.");
					input = input.replace(/[^A-Za-z0-9+/=]/g, "");
					var totalLength = input.length * 3 / 4;
					if (input.charAt(input.length - 1) === _keyStr.charAt(64)) totalLength--;
					if (input.charAt(input.length - 2) === _keyStr.charAt(64)) totalLength--;
					if (totalLength % 1 !== 0) throw new Error("Invalid base64 input, bad content length.");
					var output;
					if (support.uint8array) output = new Uint8Array(totalLength | 0);
else output = new Array(totalLength | 0);
					while (i < input.length) {
						enc1 = _keyStr.indexOf(input.charAt(i++));
						enc2 = _keyStr.indexOf(input.charAt(i++));
						enc3 = _keyStr.indexOf(input.charAt(i++));
						enc4 = _keyStr.indexOf(input.charAt(i++));
						chr1 = enc1 << 2 | enc2 >> 4;
						chr2 = (enc2 & 15) << 4 | enc3 >> 2;
						chr3 = (enc3 & 3) << 6 | enc4;
						output[resultIndex++] = chr1;
						if (enc3 !== 64) output[resultIndex++] = chr2;
						if (enc4 !== 64) output[resultIndex++] = chr3;
					}
					return output;
				};
			}, {
				"./support": 30,
				"./utils": 32
			}],
			2: [function(require$1, module$1, exports$1) {
				var external = require$1("./external");
				var DataWorker = require$1("./stream/DataWorker");
				var Crc32Probe = require$1("./stream/Crc32Probe");
				var DataLengthProbe = require$1("./stream/DataLengthProbe");
				/**
				* Represent a compressed object, with everything needed to decompress it.
				* @constructor
				* @param {number} compressedSize the size of the data compressed.
				* @param {number} uncompressedSize the size of the data after decompression.
				* @param {number} crc32 the crc32 of the decompressed file.
				* @param {object} compression the type of compression, see lib/compressions.js.
				* @param {String|ArrayBuffer|Uint8Array|Buffer} data the compressed data.
				*/
				function CompressedObject(compressedSize, uncompressedSize, crc32, compression, data) {
					this.compressedSize = compressedSize;
					this.uncompressedSize = uncompressedSize;
					this.crc32 = crc32;
					this.compression = compression;
					this.compressedContent = data;
				}
				CompressedObject.prototype = {
					getContentWorker: function() {
						var worker = new DataWorker(external.Promise.resolve(this.compressedContent)).pipe(this.compression.uncompressWorker()).pipe(new DataLengthProbe("data_length"));
						var that = this;
						worker.on("end", function() {
							if (this.streamInfo["data_length"] !== that.uncompressedSize) throw new Error("Bug : uncompressed data size mismatch");
						});
						return worker;
					},
					getCompressedWorker: function() {
						return new DataWorker(external.Promise.resolve(this.compressedContent)).withStreamInfo("compressedSize", this.compressedSize).withStreamInfo("uncompressedSize", this.uncompressedSize).withStreamInfo("crc32", this.crc32).withStreamInfo("compression", this.compression);
					}
				};
				/**
				* Chain the given worker with other workers to compress the content with the
				* given compression.
				* @param {GenericWorker} uncompressedWorker the worker to pipe.
				* @param {Object} compression the compression object.
				* @param {Object} compressionOptions the options to use when compressing.
				* @return {GenericWorker} the new worker compressing the content.
				*/
				CompressedObject.createWorkerFrom = function(uncompressedWorker, compression, compressionOptions) {
					return uncompressedWorker.pipe(new Crc32Probe()).pipe(new DataLengthProbe("uncompressedSize")).pipe(compression.compressWorker(compressionOptions)).pipe(new DataLengthProbe("compressedSize")).withStreamInfo("compression", compression);
				};
				module$1.exports = CompressedObject;
			}, {
				"./external": 6,
				"./stream/Crc32Probe": 25,
				"./stream/DataLengthProbe": 26,
				"./stream/DataWorker": 27
			}],
			3: [function(require$1, module$1, exports$1) {
				var GenericWorker = require$1("./stream/GenericWorker");
				exports$1.STORE = {
					magic: "\0\0",
					compressWorker: function() {
						return new GenericWorker("STORE compression");
					},
					uncompressWorker: function() {
						return new GenericWorker("STORE decompression");
					}
				};
				exports$1.DEFLATE = require$1("./flate");
			}, {
				"./flate": 7,
				"./stream/GenericWorker": 28
			}],
			4: [function(require$1, module$1, exports$1) {
				var utils = require$1("./utils");
				/**
				* The following functions come from pako, from pako/lib/zlib/crc32.js
				* released under the MIT license, see pako https://github.com/nodeca/pako/
				*/
				function makeTable() {
					var c, table = [];
					for (var n = 0; n < 256; n++) {
						c = n;
						for (var k = 0; k < 8; k++) c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
						table[n] = c;
					}
					return table;
				}
				var crcTable = makeTable();
				function crc32(crc, buf, len, pos) {
					var t = crcTable, end = pos + len;
					crc = crc ^ -1;
					for (var i = pos; i < end; i++) crc = crc >>> 8 ^ t[(crc ^ buf[i]) & 255];
					return crc ^ -1;
				}
				/**
				* Compute the crc32 of a string.
				* This is almost the same as the function crc32, but for strings. Using the
				* same function for the two use cases leads to horrible performances.
				* @param {Number} crc the starting value of the crc.
				* @param {String} str the string to use.
				* @param {Number} len the length of the string.
				* @param {Number} pos the starting position for the crc32 computation.
				* @return {Number} the computed crc32.
				*/
				function crc32str(crc, str, len, pos) {
					var t = crcTable, end = pos + len;
					crc = crc ^ -1;
					for (var i = pos; i < end; i++) crc = crc >>> 8 ^ t[(crc ^ str.charCodeAt(i)) & 255];
					return crc ^ -1;
				}
				module$1.exports = function crc32wrapper(input, crc) {
					if (typeof input === "undefined" || !input.length) return 0;
					var isArray = utils.getTypeOf(input) !== "string";
					if (isArray) return crc32(crc | 0, input, input.length, 0);
else return crc32str(crc | 0, input, input.length, 0);
				};
			}, { "./utils": 32 }],
			5: [function(require$1, module$1, exports$1) {
				exports$1.base64 = false;
				exports$1.binary = false;
				exports$1.dir = false;
				exports$1.createFolders = true;
				exports$1.date = null;
				exports$1.compression = null;
				exports$1.compressionOptions = null;
				exports$1.comment = null;
				exports$1.unixPermissions = null;
				exports$1.dosPermissions = null;
			}, {}],
			6: [function(require$1, module$1, exports$1) {
				var ES6Promise = null;
				if (typeof Promise !== "undefined") ES6Promise = Promise;
else ES6Promise = require$1("lie");
				/**
				* Let the user use/change some implementations.
				*/
				module$1.exports = { Promise: ES6Promise };
			}, { "lie": 37 }],
			7: [function(require$1, module$1, exports$1) {
				var USE_TYPEDARRAY = typeof Uint8Array !== "undefined" && typeof Uint16Array !== "undefined" && typeof Uint32Array !== "undefined";
				var pako = require$1("pako");
				var utils = require$1("./utils");
				var GenericWorker = require$1("./stream/GenericWorker");
				var ARRAY_TYPE = USE_TYPEDARRAY ? "uint8array" : "array";
				exports$1.magic = "\b\0";
				/**
				* Create a worker that uses pako to inflate/deflate.
				* @constructor
				* @param {String} action the name of the pako function to call : either "Deflate" or "Inflate".
				* @param {Object} options the options to use when (de)compressing.
				*/
				function FlateWorker(action, options) {
					GenericWorker.call(this, "FlateWorker/" + action);
					this._pako = null;
					this._pakoAction = action;
					this._pakoOptions = options;
					this.meta = {};
				}
				utils.inherits(FlateWorker, GenericWorker);
				/**
				* @see GenericWorker.processChunk
				*/
				FlateWorker.prototype.processChunk = function(chunk) {
					this.meta = chunk.meta;
					if (this._pako === null) this._createPako();
					this._pako.push(utils.transformTo(ARRAY_TYPE, chunk.data), false);
				};
				/**
				* @see GenericWorker.flush
				*/
				FlateWorker.prototype.flush = function() {
					GenericWorker.prototype.flush.call(this);
					if (this._pako === null) this._createPako();
					this._pako.push([], true);
				};
				/**
				* @see GenericWorker.cleanUp
				*/
				FlateWorker.prototype.cleanUp = function() {
					GenericWorker.prototype.cleanUp.call(this);
					this._pako = null;
				};
				/**
				* Create the _pako object.
				* TODO: lazy-loading this object isn't the best solution but it's the
				* quickest. The best solution is to lazy-load the worker list. See also the
				* issue #446.
				*/
				FlateWorker.prototype._createPako = function() {
					this._pako = new pako[this._pakoAction]({
						raw: true,
						level: this._pakoOptions.level || -1
					});
					var self$1 = this;
					this._pako.onData = function(data) {
						self$1.push({
							data,
							meta: self$1.meta
						});
					};
				};
				exports$1.compressWorker = function(compressionOptions) {
					return new FlateWorker("Deflate", compressionOptions);
				};
				exports$1.uncompressWorker = function() {
					return new FlateWorker("Inflate", {});
				};
			}, {
				"./stream/GenericWorker": 28,
				"./utils": 32,
				"pako": 38
			}],
			8: [function(require$1, module$1, exports$1) {
				var utils = require$1("../utils");
				var GenericWorker = require$1("../stream/GenericWorker");
				var utf8 = require$1("../utf8");
				var crc32 = require$1("../crc32");
				var signature = require$1("../signature");
				/**
				* Transform an integer into a string in hexadecimal.
				* @private
				* @param {number} dec the number to convert.
				* @param {number} bytes the number of bytes to generate.
				* @returns {string} the result.
				*/
				var decToHex = function(dec, bytes) {
					var hex = "", i;
					for (i = 0; i < bytes; i++) {
						hex += String.fromCharCode(dec & 255);
						dec = dec >>> 8;
					}
					return hex;
				};
				/**
				* Generate the UNIX part of the external file attributes.
				* @param {Object} unixPermissions the unix permissions or null.
				* @param {Boolean} isDir true if the entry is a directory, false otherwise.
				* @return {Number} a 32 bit integer.
				*
				* adapted from http://unix.stackexchange.com/questions/14705/the-zip-formats-external-file-attribute :
				*
				* TTTTsstrwxrwxrwx0000000000ADVSHR
				* ^^^^____________________________ file type, see zipinfo.c (UNX_*)
				*     ^^^_________________________ setuid, setgid, sticky
				*        ^^^^^^^^^________________ permissions
				*                 ^^^^^^^^^^______ not used ?
				*                           ^^^^^^ DOS attribute bits : Archive, Directory, Volume label, System file, Hidden, Read only
				*/
				var generateUnixExternalFileAttr = function(unixPermissions, isDir) {
					var result = unixPermissions;
					if (!unixPermissions) result = isDir ? 16893 : 33204;
					return (result & 65535) << 16;
				};
				/**
				* Generate the DOS part of the external file attributes.
				* @param {Object} dosPermissions the dos permissions or null.
				* @param {Boolean} isDir true if the entry is a directory, false otherwise.
				* @return {Number} a 32 bit integer.
				*
				* Bit 0     Read-Only
				* Bit 1     Hidden
				* Bit 2     System
				* Bit 3     Volume Label
				* Bit 4     Directory
				* Bit 5     Archive
				*/
				var generateDosExternalFileAttr = function(dosPermissions) {
					return (dosPermissions || 0) & 63;
				};
				/**
				* Generate the various parts used in the construction of the final zip file.
				* @param {Object} streamInfo the hash with information about the compressed file.
				* @param {Boolean} streamedContent is the content streamed ?
				* @param {Boolean} streamingEnded is the stream finished ?
				* @param {number} offset the current offset from the start of the zip file.
				* @param {String} platform let's pretend we are this platform (change platform dependents fields)
				* @param {Function} encodeFileName the function to encode the file name / comment.
				* @return {Object} the zip parts.
				*/
				var generateZipParts = function(streamInfo, streamedContent, streamingEnded, offset, platform, encodeFileName) {
					var file = streamInfo["file"], compression = streamInfo["compression"], useCustomEncoding = encodeFileName !== utf8.utf8encode, encodedFileName = utils.transformTo("string", encodeFileName(file.name)), utfEncodedFileName = utils.transformTo("string", utf8.utf8encode(file.name)), comment = file.comment, encodedComment = utils.transformTo("string", encodeFileName(comment)), utfEncodedComment = utils.transformTo("string", utf8.utf8encode(comment)), useUTF8ForFileName = utfEncodedFileName.length !== file.name.length, useUTF8ForComment = utfEncodedComment.length !== comment.length, dosTime, dosDate, extraFields = "", unicodePathExtraField = "", unicodeCommentExtraField = "", dir = file.dir, date = file.date;
					var dataInfo = {
						crc32: 0,
						compressedSize: 0,
						uncompressedSize: 0
					};
					if (!streamedContent || streamingEnded) {
						dataInfo.crc32 = streamInfo["crc32"];
						dataInfo.compressedSize = streamInfo["compressedSize"];
						dataInfo.uncompressedSize = streamInfo["uncompressedSize"];
					}
					var bitflag = 0;
					if (streamedContent) bitflag |= 8;
					if (!useCustomEncoding && (useUTF8ForFileName || useUTF8ForComment)) bitflag |= 2048;
					var extFileAttr = 0;
					var versionMadeBy = 0;
					if (dir) extFileAttr |= 16;
					if (platform === "UNIX") {
						versionMadeBy = 798;
						extFileAttr |= generateUnixExternalFileAttr(file.unixPermissions, dir);
					} else {
						versionMadeBy = 20;
						extFileAttr |= generateDosExternalFileAttr(file.dosPermissions);
					}
					dosTime = date.getUTCHours();
					dosTime = dosTime << 6;
					dosTime = dosTime | date.getUTCMinutes();
					dosTime = dosTime << 5;
					dosTime = dosTime | date.getUTCSeconds() / 2;
					dosDate = date.getUTCFullYear() - 1980;
					dosDate = dosDate << 4;
					dosDate = dosDate | date.getUTCMonth() + 1;
					dosDate = dosDate << 5;
					dosDate = dosDate | date.getUTCDate();
					if (useUTF8ForFileName) {
						unicodePathExtraField = decToHex(1, 1) + decToHex(crc32(encodedFileName), 4) + utfEncodedFileName;
						extraFields += "up" + decToHex(unicodePathExtraField.length, 2) + unicodePathExtraField;
					}
					if (useUTF8ForComment) {
						unicodeCommentExtraField = decToHex(1, 1) + decToHex(crc32(encodedComment), 4) + utfEncodedComment;
						extraFields += "uc" + decToHex(unicodeCommentExtraField.length, 2) + unicodeCommentExtraField;
					}
					var header = "";
					header += "\n\0";
					header += decToHex(bitflag, 2);
					header += compression.magic;
					header += decToHex(dosTime, 2);
					header += decToHex(dosDate, 2);
					header += decToHex(dataInfo.crc32, 4);
					header += decToHex(dataInfo.compressedSize, 4);
					header += decToHex(dataInfo.uncompressedSize, 4);
					header += decToHex(encodedFileName.length, 2);
					header += decToHex(extraFields.length, 2);
					var fileRecord = signature.LOCAL_FILE_HEADER + header + encodedFileName + extraFields;
					var dirRecord = signature.CENTRAL_FILE_HEADER + decToHex(versionMadeBy, 2) + header + decToHex(encodedComment.length, 2) + "\0\0" + "\0\0" + decToHex(extFileAttr, 4) + decToHex(offset, 4) + encodedFileName + extraFields + encodedComment;
					return {
						fileRecord,
						dirRecord
					};
				};
				/**
				* Generate the EOCD record.
				* @param {Number} entriesCount the number of entries in the zip file.
				* @param {Number} centralDirLength the length (in bytes) of the central dir.
				* @param {Number} localDirLength the length (in bytes) of the local dir.
				* @param {String} comment the zip file comment as a binary string.
				* @param {Function} encodeFileName the function to encode the comment.
				* @return {String} the EOCD record.
				*/
				var generateCentralDirectoryEnd = function(entriesCount, centralDirLength, localDirLength, comment, encodeFileName) {
					var dirEnd = "";
					var encodedComment = utils.transformTo("string", encodeFileName(comment));
					dirEnd = signature.CENTRAL_DIRECTORY_END + "\0\0" + "\0\0" + decToHex(entriesCount, 2) + decToHex(entriesCount, 2) + decToHex(centralDirLength, 4) + decToHex(localDirLength, 4) + decToHex(encodedComment.length, 2) + encodedComment;
					return dirEnd;
				};
				/**
				* Generate data descriptors for a file entry.
				* @param {Object} streamInfo the hash generated by a worker, containing information
				* on the file entry.
				* @return {String} the data descriptors.
				*/
				var generateDataDescriptors = function(streamInfo) {
					var descriptor = "";
					descriptor = signature.DATA_DESCRIPTOR + decToHex(streamInfo["crc32"], 4) + decToHex(streamInfo["compressedSize"], 4) + decToHex(streamInfo["uncompressedSize"], 4);
					return descriptor;
				};
				/**
				* A worker to concatenate other workers to create a zip file.
				* @param {Boolean} streamFiles `true` to stream the content of the files,
				* `false` to accumulate it.
				* @param {String} comment the comment to use.
				* @param {String} platform the platform to use, "UNIX" or "DOS".
				* @param {Function} encodeFileName the function to encode file names and comments.
				*/
				function ZipFileWorker(streamFiles, comment, platform, encodeFileName) {
					GenericWorker.call(this, "ZipFileWorker");
					this.bytesWritten = 0;
					this.zipComment = comment;
					this.zipPlatform = platform;
					this.encodeFileName = encodeFileName;
					this.streamFiles = streamFiles;
					this.accumulate = false;
					this.contentBuffer = [];
					this.dirRecords = [];
					this.currentSourceOffset = 0;
					this.entriesCount = 0;
					this.currentFile = null;
					this._sources = [];
				}
				utils.inherits(ZipFileWorker, GenericWorker);
				/**
				* @see GenericWorker.push
				*/
				ZipFileWorker.prototype.push = function(chunk) {
					var currentFilePercent = chunk.meta.percent || 0;
					var entriesCount = this.entriesCount;
					var remainingFiles = this._sources.length;
					if (this.accumulate) this.contentBuffer.push(chunk);
else {
						this.bytesWritten += chunk.data.length;
						GenericWorker.prototype.push.call(this, {
							data: chunk.data,
							meta: {
								currentFile: this.currentFile,
								percent: entriesCount ? (currentFilePercent + 100 * (entriesCount - remainingFiles - 1)) / entriesCount : 100
							}
						});
					}
				};
				/**
				* The worker started a new source (an other worker).
				* @param {Object} streamInfo the streamInfo object from the new source.
				*/
				ZipFileWorker.prototype.openedSource = function(streamInfo) {
					this.currentSourceOffset = this.bytesWritten;
					this.currentFile = streamInfo["file"].name;
					var streamedContent = this.streamFiles && !streamInfo["file"].dir;
					if (streamedContent) {
						var record = generateZipParts(streamInfo, streamedContent, false, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
						this.push({
							data: record.fileRecord,
							meta: { percent: 0 }
						});
					} else this.accumulate = true;
				};
				/**
				* The worker finished a source (an other worker).
				* @param {Object} streamInfo the streamInfo object from the finished source.
				*/
				ZipFileWorker.prototype.closedSource = function(streamInfo) {
					this.accumulate = false;
					var streamedContent = this.streamFiles && !streamInfo["file"].dir;
					var record = generateZipParts(streamInfo, streamedContent, true, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
					this.dirRecords.push(record.dirRecord);
					if (streamedContent) this.push({
						data: generateDataDescriptors(streamInfo),
						meta: { percent: 100 }
					});
else {
						this.push({
							data: record.fileRecord,
							meta: { percent: 0 }
						});
						while (this.contentBuffer.length) this.push(this.contentBuffer.shift());
					}
					this.currentFile = null;
				};
				/**
				* @see GenericWorker.flush
				*/
				ZipFileWorker.prototype.flush = function() {
					var localDirLength = this.bytesWritten;
					for (var i = 0; i < this.dirRecords.length; i++) this.push({
						data: this.dirRecords[i],
						meta: { percent: 100 }
					});
					var centralDirLength = this.bytesWritten - localDirLength;
					var dirEnd = generateCentralDirectoryEnd(this.dirRecords.length, centralDirLength, localDirLength, this.zipComment, this.encodeFileName);
					this.push({
						data: dirEnd,
						meta: { percent: 100 }
					});
				};
				/**
				* Prepare the next source to be read.
				*/
				ZipFileWorker.prototype.prepareNextSource = function() {
					this.previous = this._sources.shift();
					this.openedSource(this.previous.streamInfo);
					if (this.isPaused) this.previous.pause();
else this.previous.resume();
				};
				/**
				* @see GenericWorker.registerPrevious
				*/
				ZipFileWorker.prototype.registerPrevious = function(previous) {
					this._sources.push(previous);
					var self$1 = this;
					previous.on("data", function(chunk) {
						self$1.processChunk(chunk);
					});
					previous.on("end", function() {
						self$1.closedSource(self$1.previous.streamInfo);
						if (self$1._sources.length) self$1.prepareNextSource();
else self$1.end();
					});
					previous.on("error", function(e) {
						self$1.error(e);
					});
					return this;
				};
				/**
				* @see GenericWorker.resume
				*/
				ZipFileWorker.prototype.resume = function() {
					if (!GenericWorker.prototype.resume.call(this)) return false;
					if (!this.previous && this._sources.length) {
						this.prepareNextSource();
						return true;
					}
					if (!this.previous && !this._sources.length && !this.generatedError) {
						this.end();
						return true;
					}
				};
				/**
				* @see GenericWorker.error
				*/
				ZipFileWorker.prototype.error = function(e) {
					var sources = this._sources;
					if (!GenericWorker.prototype.error.call(this, e)) return false;
					for (var i = 0; i < sources.length; i++) try {
						sources[i].error(e);
					} catch (e$1) {}
					return true;
				};
				/**
				* @see GenericWorker.lock
				*/
				ZipFileWorker.prototype.lock = function() {
					GenericWorker.prototype.lock.call(this);
					var sources = this._sources;
					for (var i = 0; i < sources.length; i++) sources[i].lock();
				};
				module$1.exports = ZipFileWorker;
			}, {
				"../crc32": 4,
				"../signature": 23,
				"../stream/GenericWorker": 28,
				"../utf8": 31,
				"../utils": 32
			}],
			9: [function(require$1, module$1, exports$1) {
				var compressions = require$1("../compressions");
				var ZipFileWorker = require$1("./ZipFileWorker");
				/**
				* Find the compression to use.
				* @param {String} fileCompression the compression defined at the file level, if any.
				* @param {String} zipCompression the compression defined at the load() level.
				* @return {Object} the compression object to use.
				*/
				var getCompression = function(fileCompression, zipCompression) {
					var compressionName = fileCompression || zipCompression;
					var compression = compressions[compressionName];
					if (!compression) throw new Error(compressionName + " is not a valid compression method !");
					return compression;
				};
				/**
				* Create a worker to generate a zip file.
				* @param {JSZip} zip the JSZip instance at the right root level.
				* @param {Object} options to generate the zip file.
				* @param {String} comment the comment to use.
				*/
				exports$1.generateWorker = function(zip, options, comment) {
					var zipFileWorker = new ZipFileWorker(options.streamFiles, comment, options.platform, options.encodeFileName);
					var entriesCount = 0;
					try {
						zip.forEach(function(relativePath, file) {
							entriesCount++;
							var compression = getCompression(file.options.compression, options.compression);
							var compressionOptions = file.options.compressionOptions || options.compressionOptions || {};
							var dir = file.dir, date = file.date;
							file._compressWorker(compression, compressionOptions).withStreamInfo("file", {
								name: relativePath,
								dir,
								date,
								comment: file.comment || "",
								unixPermissions: file.unixPermissions,
								dosPermissions: file.dosPermissions
							}).pipe(zipFileWorker);
						});
						zipFileWorker.entriesCount = entriesCount;
					} catch (e) {
						zipFileWorker.error(e);
					}
					return zipFileWorker;
				};
			}, {
				"../compressions": 3,
				"./ZipFileWorker": 8
			}],
			10: [function(require$1, module$1, exports$1) {
				/**
				* Representation a of zip file in js
				* @constructor
				*/
				function JSZip() {
					if (!(this instanceof JSZip)) return new JSZip();
					if (arguments.length) throw new Error("The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.");
					this.files = Object.create(null);
					this.comment = null;
					this.root = "";
					this.clone = function() {
						var newObj = new JSZip();
						for (var i in this) if (typeof this[i] !== "function") newObj[i] = this[i];
						return newObj;
					};
				}
				JSZip.prototype = require$1("./object");
				JSZip.prototype.loadAsync = require$1("./load");
				JSZip.support = require$1("./support");
				JSZip.defaults = require$1("./defaults");
				JSZip.version = "3.10.1";
				JSZip.loadAsync = function(content, options) {
					return new JSZip().loadAsync(content, options);
				};
				JSZip.external = require$1("./external");
				module$1.exports = JSZip;
			}, {
				"./defaults": 5,
				"./external": 6,
				"./load": 11,
				"./object": 15,
				"./support": 30
			}],
			11: [function(require$1, module$1, exports$1) {
				var utils = require$1("./utils");
				var external = require$1("./external");
				var utf8 = require$1("./utf8");
				var ZipEntries = require$1("./zipEntries");
				var Crc32Probe = require$1("./stream/Crc32Probe");
				var nodejsUtils = require$1("./nodejsUtils");
				/**
				* Check the CRC32 of an entry.
				* @param {ZipEntry} zipEntry the zip entry to check.
				* @return {Promise} the result.
				*/
				function checkEntryCRC32(zipEntry) {
					return new external.Promise(function(resolve, reject) {
						var worker = zipEntry.decompressed.getContentWorker().pipe(new Crc32Probe());
						worker.on("error", function(e) {
							reject(e);
						}).on("end", function() {
							if (worker.streamInfo.crc32 !== zipEntry.decompressed.crc32) reject(new Error("Corrupted zip : CRC32 mismatch"));
else resolve();
						}).resume();
					});
				}
				module$1.exports = function(data, options) {
					var zip = this;
					options = utils.extend(options || {}, {
						base64: false,
						checkCRC32: false,
						optimizedBinaryString: false,
						createFolders: false,
						decodeFileName: utf8.utf8decode
					});
					if (nodejsUtils.isNode && nodejsUtils.isStream(data)) return external.Promise.reject(new Error("JSZip can't accept a stream when loading a zip file."));
					return utils.prepareContent("the loaded zip file", data, true, options.optimizedBinaryString, options.base64).then(function(data$1) {
						var zipEntries = new ZipEntries(options);
						zipEntries.load(data$1);
						return zipEntries;
					}).then(function checkCRC32(zipEntries) {
						var promises = [external.Promise.resolve(zipEntries)];
						var files = zipEntries.files;
						if (options.checkCRC32) for (var i = 0; i < files.length; i++) promises.push(checkEntryCRC32(files[i]));
						return external.Promise.all(promises);
					}).then(function addFiles(results) {
						var zipEntries = results.shift();
						var files = zipEntries.files;
						for (var i = 0; i < files.length; i++) {
							var input = files[i];
							var unsafeName = input.fileNameStr;
							var safeName = utils.resolve(input.fileNameStr);
							zip.file(safeName, input.decompressed, {
								binary: true,
								optimizedBinaryString: true,
								date: input.date,
								dir: input.dir,
								comment: input.fileCommentStr.length ? input.fileCommentStr : null,
								unixPermissions: input.unixPermissions,
								dosPermissions: input.dosPermissions,
								createFolders: options.createFolders
							});
							if (!input.dir) zip.file(safeName).unsafeOriginalName = unsafeName;
						}
						if (zipEntries.zipComment.length) zip.comment = zipEntries.zipComment;
						return zip;
					});
				};
			}, {
				"./external": 6,
				"./nodejsUtils": 14,
				"./stream/Crc32Probe": 25,
				"./utf8": 31,
				"./utils": 32,
				"./zipEntries": 33
			}],
			12: [function(require$1, module$1, exports$1) {
				var utils = require$1("../utils");
				var GenericWorker = require$1("../stream/GenericWorker");
				/**
				* A worker that use a nodejs stream as source.
				* @constructor
				* @param {String} filename the name of the file entry for this stream.
				* @param {Readable} stream the nodejs stream.
				*/
				function NodejsStreamInputAdapter(filename, stream) {
					GenericWorker.call(this, "Nodejs stream input adapter for " + filename);
					this._upstreamEnded = false;
					this._bindStream(stream);
				}
				utils.inherits(NodejsStreamInputAdapter, GenericWorker);
				/**
				* Prepare the stream and bind the callbacks on it.
				* Do this ASAP on node 0.10 ! A lazy binding doesn't always work.
				* @param {Stream} stream the nodejs stream to use.
				*/
				NodejsStreamInputAdapter.prototype._bindStream = function(stream) {
					var self$1 = this;
					this._stream = stream;
					stream.pause();
					stream.on("data", function(chunk) {
						self$1.push({
							data: chunk,
							meta: { percent: 0 }
						});
					}).on("error", function(e) {
						if (self$1.isPaused) this.generatedError = e;
else self$1.error(e);
					}).on("end", function() {
						if (self$1.isPaused) self$1._upstreamEnded = true;
else self$1.end();
					});
				};
				NodejsStreamInputAdapter.prototype.pause = function() {
					if (!GenericWorker.prototype.pause.call(this)) return false;
					this._stream.pause();
					return true;
				};
				NodejsStreamInputAdapter.prototype.resume = function() {
					if (!GenericWorker.prototype.resume.call(this)) return false;
					if (this._upstreamEnded) this.end();
else this._stream.resume();
					return true;
				};
				module$1.exports = NodejsStreamInputAdapter;
			}, {
				"../stream/GenericWorker": 28,
				"../utils": 32
			}],
			13: [function(require$1, module$1, exports$1) {
				var Readable = require$1("readable-stream").Readable;
				var utils = require$1("../utils");
				utils.inherits(NodejsStreamOutputAdapter, Readable);
				/**
				* A nodejs stream using a worker as source.
				* @see the SourceWrapper in http://nodejs.org/api/stream.html
				* @constructor
				* @param {StreamHelper} helper the helper wrapping the worker
				* @param {Object} options the nodejs stream options
				* @param {Function} updateCb the update callback.
				*/
				function NodejsStreamOutputAdapter(helper, options, updateCb) {
					Readable.call(this, options);
					this._helper = helper;
					var self$1 = this;
					helper.on("data", function(data, meta) {
						if (!self$1.push(data)) self$1._helper.pause();
						if (updateCb) updateCb(meta);
					}).on("error", function(e) {
						self$1.emit("error", e);
					}).on("end", function() {
						self$1.push(null);
					});
				}
				NodejsStreamOutputAdapter.prototype._read = function() {
					this._helper.resume();
				};
				module$1.exports = NodejsStreamOutputAdapter;
			}, {
				"../utils": 32,
				"readable-stream": 16
			}],
			14: [function(require$1, module$1, exports$1) {
				module$1.exports = {
					isNode: typeof Buffer !== "undefined",
					newBufferFrom: function(data, encoding) {
						if (Buffer.from && Buffer.from !== Uint8Array.from) return Buffer.from(data, encoding);
else {
							if (typeof data === "number") throw new Error("The \"data\" argument must not be a number");
							return new Buffer(data, encoding);
						}
					},
					allocBuffer: function(size) {
						if (Buffer.alloc) return Buffer.alloc(size);
else {
							var buf = new Buffer(size);
							buf.fill(0);
							return buf;
						}
					},
					isBuffer: function(b) {
						return Buffer.isBuffer(b);
					},
					isStream: function(obj) {
						return obj && typeof obj.on === "function" && typeof obj.pause === "function" && typeof obj.resume === "function";
					}
				};
			}, {}],
			15: [function(require$1, module$1, exports$1) {
				var utf8 = require$1("./utf8");
				var utils = require$1("./utils");
				var GenericWorker = require$1("./stream/GenericWorker");
				var StreamHelper = require$1("./stream/StreamHelper");
				var defaults = require$1("./defaults");
				var CompressedObject = require$1("./compressedObject");
				var ZipObject = require$1("./zipObject");
				var generate = require$1("./generate");
				var nodejsUtils = require$1("./nodejsUtils");
				var NodejsStreamInputAdapter = require$1("./nodejs/NodejsStreamInputAdapter");
				/**
				* Add a file in the current folder.
				* @private
				* @param {string} name the name of the file
				* @param {String|ArrayBuffer|Uint8Array|Buffer} data the data of the file
				* @param {Object} originalOptions the options of the file
				* @return {Object} the new file.
				*/
				var fileAdd = function(name, data, originalOptions) {
					var dataType = utils.getTypeOf(data), parent;
					var o = utils.extend(originalOptions || {}, defaults);
					o.date = o.date || new Date();
					if (o.compression !== null) o.compression = o.compression.toUpperCase();
					if (typeof o.unixPermissions === "string") o.unixPermissions = parseInt(o.unixPermissions, 8);
					if (o.unixPermissions && o.unixPermissions & 16384) o.dir = true;
					if (o.dosPermissions && o.dosPermissions & 16) o.dir = true;
					if (o.dir) name = forceTrailingSlash(name);
					if (o.createFolders && (parent = parentFolder(name))) folderAdd.call(this, parent, true);
					var isUnicodeString = dataType === "string" && o.binary === false && o.base64 === false;
					if (!originalOptions || typeof originalOptions.binary === "undefined") o.binary = !isUnicodeString;
					var isCompressedEmpty = data instanceof CompressedObject && data.uncompressedSize === 0;
					if (isCompressedEmpty || o.dir || !data || data.length === 0) {
						o.base64 = false;
						o.binary = true;
						data = "";
						o.compression = "STORE";
						dataType = "string";
					}
					var zipObjectContent = null;
					if (data instanceof CompressedObject || data instanceof GenericWorker) zipObjectContent = data;
else if (nodejsUtils.isNode && nodejsUtils.isStream(data)) zipObjectContent = new NodejsStreamInputAdapter(name, data);
else zipObjectContent = utils.prepareContent(name, data, o.binary, o.optimizedBinaryString, o.base64);
					var object = new ZipObject(name, zipObjectContent, o);
					this.files[name] = object;
				};
				/**
				* Find the parent folder of the path.
				* @private
				* @param {string} path the path to use
				* @return {string} the parent folder, or ""
				*/
				var parentFolder = function(path) {
					if (path.slice(-1) === "/") path = path.substring(0, path.length - 1);
					var lastSlash = path.lastIndexOf("/");
					return lastSlash > 0 ? path.substring(0, lastSlash) : "";
				};
				/**
				* Returns the path with a slash at the end.
				* @private
				* @param {String} path the path to check.
				* @return {String} the path with a trailing slash.
				*/
				var forceTrailingSlash = function(path) {
					if (path.slice(-1) !== "/") path += "/";
					return path;
				};
				/**
				* Add a (sub) folder in the current folder.
				* @private
				* @param {string} name the folder's name
				* @param {boolean=} [createFolders] If true, automatically create sub
				*  folders. Defaults to false.
				* @return {Object} the new folder.
				*/
				var folderAdd = function(name, createFolders) {
					createFolders = typeof createFolders !== "undefined" ? createFolders : defaults.createFolders;
					name = forceTrailingSlash(name);
					if (!this.files[name]) fileAdd.call(this, name, null, {
						dir: true,
						createFolders
					});
					return this.files[name];
				};
				/**
				* Cross-window, cross-Node-context regular expression detection
				* @param  {Object}  object Anything
				* @return {Boolean}        true if the object is a regular expression,
				* false otherwise
				*/
				function isRegExp(object) {
					return Object.prototype.toString.call(object) === "[object RegExp]";
				}
				var out = {
					load: function() {
						throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
					},
					forEach: function(cb) {
						var filename, relativePath, file;
						for (filename in this.files) {
							file = this.files[filename];
							relativePath = filename.slice(this.root.length, filename.length);
							if (relativePath && filename.slice(0, this.root.length) === this.root) cb(relativePath, file);
						}
					},
					filter: function(search) {
						var result = [];
						this.forEach(function(relativePath, entry) {
							if (search(relativePath, entry)) result.push(entry);
						});
						return result;
					},
					file: function(name, data, o) {
						if (arguments.length === 1) if (isRegExp(name)) {
							var regexp = name;
							return this.filter(function(relativePath, file) {
								return !file.dir && regexp.test(relativePath);
							});
						} else {
							var obj = this.files[this.root + name];
							if (obj && !obj.dir) return obj;
else return null;
						}
else {
							name = this.root + name;
							fileAdd.call(this, name, data, o);
						}
						return this;
					},
					folder: function(arg) {
						if (!arg) return this;
						if (isRegExp(arg)) return this.filter(function(relativePath, file) {
							return file.dir && arg.test(relativePath);
						});
						var name = this.root + arg;
						var newFolder = folderAdd.call(this, name);
						var ret = this.clone();
						ret.root = newFolder.name;
						return ret;
					},
					remove: function(name) {
						name = this.root + name;
						var file = this.files[name];
						if (!file) {
							if (name.slice(-1) !== "/") name += "/";
							file = this.files[name];
						}
						if (file && !file.dir) delete this.files[name];
else {
							var kids = this.filter(function(relativePath, file$1) {
								return file$1.name.slice(0, name.length) === name;
							});
							for (var i = 0; i < kids.length; i++) delete this.files[kids[i].name];
						}
						return this;
					},
					generate: function() {
						throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
					},
					generateInternalStream: function(options) {
						var worker, opts = {};
						try {
							opts = utils.extend(options || {}, {
								streamFiles: false,
								compression: "STORE",
								compressionOptions: null,
								type: "",
								platform: "DOS",
								comment: null,
								mimeType: "application/zip",
								encodeFileName: utf8.utf8encode
							});
							opts.type = opts.type.toLowerCase();
							opts.compression = opts.compression.toUpperCase();
							if (opts.type === "binarystring") opts.type = "string";
							if (!opts.type) throw new Error("No output type specified.");
							utils.checkSupport(opts.type);
							if (opts.platform === "darwin" || opts.platform === "freebsd" || opts.platform === "linux" || opts.platform === "sunos") opts.platform = "UNIX";
							if (opts.platform === "win32") opts.platform = "DOS";
							var comment = opts.comment || this.comment || "";
							worker = generate.generateWorker(this, opts, comment);
						} catch (e) {
							worker = new GenericWorker("error");
							worker.error(e);
						}
						return new StreamHelper(worker, opts.type || "string", opts.mimeType);
					},
					generateAsync: function(options, onUpdate) {
						return this.generateInternalStream(options).accumulate(onUpdate);
					},
					generateNodeStream: function(options, onUpdate) {
						options = options || {};
						if (!options.type) options.type = "nodebuffer";
						return this.generateInternalStream(options).toNodejsStream(onUpdate);
					}
				};
				module$1.exports = out;
			}, {
				"./compressedObject": 2,
				"./defaults": 5,
				"./generate": 9,
				"./nodejs/NodejsStreamInputAdapter": 12,
				"./nodejsUtils": 14,
				"./stream/GenericWorker": 28,
				"./stream/StreamHelper": 29,
				"./utf8": 31,
				"./utils": 32,
				"./zipObject": 35
			}],
			16: [function(require$1, module$1, exports$1) {
				module$1.exports = require$1("stream");
			}, { "stream": undefined }],
			17: [function(require$1, module$1, exports$1) {
				var DataReader = require$1("./DataReader");
				var utils = require$1("../utils");
				function ArrayReader(data) {
					DataReader.call(this, data);
					for (var i = 0; i < this.data.length; i++) data[i] = data[i] & 255;
				}
				utils.inherits(ArrayReader, DataReader);
				/**
				* @see DataReader.byteAt
				*/
				ArrayReader.prototype.byteAt = function(i) {
					return this.data[this.zero + i];
				};
				/**
				* @see DataReader.lastIndexOfSignature
				*/
				ArrayReader.prototype.lastIndexOfSignature = function(sig) {
					var sig0 = sig.charCodeAt(0), sig1 = sig.charCodeAt(1), sig2 = sig.charCodeAt(2), sig3 = sig.charCodeAt(3);
					for (var i = this.length - 4; i >= 0; --i) if (this.data[i] === sig0 && this.data[i + 1] === sig1 && this.data[i + 2] === sig2 && this.data[i + 3] === sig3) return i - this.zero;
					return -1;
				};
				/**
				* @see DataReader.readAndCheckSignature
				*/
				ArrayReader.prototype.readAndCheckSignature = function(sig) {
					var sig0 = sig.charCodeAt(0), sig1 = sig.charCodeAt(1), sig2 = sig.charCodeAt(2), sig3 = sig.charCodeAt(3), data = this.readData(4);
					return sig0 === data[0] && sig1 === data[1] && sig2 === data[2] && sig3 === data[3];
				};
				/**
				* @see DataReader.readData
				*/
				ArrayReader.prototype.readData = function(size) {
					this.checkOffset(size);
					if (size === 0) return [];
					var result = this.data.slice(this.zero + this.index, this.zero + this.index + size);
					this.index += size;
					return result;
				};
				module$1.exports = ArrayReader;
			}, {
				"../utils": 32,
				"./DataReader": 18
			}],
			18: [function(require$1, module$1, exports$1) {
				var utils = require$1("../utils");
				function DataReader(data) {
					this.data = data;
					this.length = data.length;
					this.index = 0;
					this.zero = 0;
				}
				DataReader.prototype = {
					checkOffset: function(offset) {
						this.checkIndex(this.index + offset);
					},
					checkIndex: function(newIndex) {
						if (this.length < this.zero + newIndex || newIndex < 0) throw new Error("End of data reached (data length = " + this.length + ", asked index = " + newIndex + "). Corrupted zip ?");
					},
					setIndex: function(newIndex) {
						this.checkIndex(newIndex);
						this.index = newIndex;
					},
					skip: function(n) {
						this.setIndex(this.index + n);
					},
					byteAt: function() {},
					readInt: function(size) {
						var result = 0, i;
						this.checkOffset(size);
						for (i = this.index + size - 1; i >= this.index; i--) result = (result << 8) + this.byteAt(i);
						this.index += size;
						return result;
					},
					readString: function(size) {
						return utils.transformTo("string", this.readData(size));
					},
					readData: function() {},
					lastIndexOfSignature: function() {},
					readAndCheckSignature: function() {},
					readDate: function() {
						var dostime = this.readInt(4);
						return new Date(Date.UTC((dostime >> 25 & 127) + 1980, (dostime >> 21 & 15) - 1, dostime >> 16 & 31, dostime >> 11 & 31, dostime >> 5 & 63, (dostime & 31) << 1));
					}
				};
				module$1.exports = DataReader;
			}, { "../utils": 32 }],
			19: [function(require$1, module$1, exports$1) {
				var Uint8ArrayReader = require$1("./Uint8ArrayReader");
				var utils = require$1("../utils");
				function NodeBufferReader(data) {
					Uint8ArrayReader.call(this, data);
				}
				utils.inherits(NodeBufferReader, Uint8ArrayReader);
				/**
				* @see DataReader.readData
				*/
				NodeBufferReader.prototype.readData = function(size) {
					this.checkOffset(size);
					var result = this.data.slice(this.zero + this.index, this.zero + this.index + size);
					this.index += size;
					return result;
				};
				module$1.exports = NodeBufferReader;
			}, {
				"../utils": 32,
				"./Uint8ArrayReader": 21
			}],
			20: [function(require$1, module$1, exports$1) {
				var DataReader = require$1("./DataReader");
				var utils = require$1("../utils");
				function StringReader(data) {
					DataReader.call(this, data);
				}
				utils.inherits(StringReader, DataReader);
				/**
				* @see DataReader.byteAt
				*/
				StringReader.prototype.byteAt = function(i) {
					return this.data.charCodeAt(this.zero + i);
				};
				/**
				* @see DataReader.lastIndexOfSignature
				*/
				StringReader.prototype.lastIndexOfSignature = function(sig) {
					return this.data.lastIndexOf(sig) - this.zero;
				};
				/**
				* @see DataReader.readAndCheckSignature
				*/
				StringReader.prototype.readAndCheckSignature = function(sig) {
					var data = this.readData(4);
					return sig === data;
				};
				/**
				* @see DataReader.readData
				*/
				StringReader.prototype.readData = function(size) {
					this.checkOffset(size);
					var result = this.data.slice(this.zero + this.index, this.zero + this.index + size);
					this.index += size;
					return result;
				};
				module$1.exports = StringReader;
			}, {
				"../utils": 32,
				"./DataReader": 18
			}],
			21: [function(require$1, module$1, exports$1) {
				var ArrayReader = require$1("./ArrayReader");
				var utils = require$1("../utils");
				function Uint8ArrayReader(data) {
					ArrayReader.call(this, data);
				}
				utils.inherits(Uint8ArrayReader, ArrayReader);
				/**
				* @see DataReader.readData
				*/
				Uint8ArrayReader.prototype.readData = function(size) {
					this.checkOffset(size);
					if (size === 0) return new Uint8Array(0);
					var result = this.data.subarray(this.zero + this.index, this.zero + this.index + size);
					this.index += size;
					return result;
				};
				module$1.exports = Uint8ArrayReader;
			}, {
				"../utils": 32,
				"./ArrayReader": 17
			}],
			22: [function(require$1, module$1, exports$1) {
				var utils = require$1("../utils");
				var support = require$1("../support");
				var ArrayReader = require$1("./ArrayReader");
				var StringReader = require$1("./StringReader");
				var NodeBufferReader = require$1("./NodeBufferReader");
				var Uint8ArrayReader = require$1("./Uint8ArrayReader");
				/**
				* Create a reader adapted to the data.
				* @param {String|ArrayBuffer|Uint8Array|Buffer} data the data to read.
				* @return {DataReader} the data reader.
				*/
				module$1.exports = function(data) {
					var type = utils.getTypeOf(data);
					utils.checkSupport(type);
					if (type === "string" && !support.uint8array) return new StringReader(data);
					if (type === "nodebuffer") return new NodeBufferReader(data);
					if (support.uint8array) return new Uint8ArrayReader(utils.transformTo("uint8array", data));
					return new ArrayReader(utils.transformTo("array", data));
				};
			}, {
				"../support": 30,
				"../utils": 32,
				"./ArrayReader": 17,
				"./NodeBufferReader": 19,
				"./StringReader": 20,
				"./Uint8ArrayReader": 21
			}],
			23: [function(require$1, module$1, exports$1) {
				exports$1.LOCAL_FILE_HEADER = "PK";
				exports$1.CENTRAL_FILE_HEADER = "PK";
				exports$1.CENTRAL_DIRECTORY_END = "PK";
				exports$1.ZIP64_CENTRAL_DIRECTORY_LOCATOR = "PK\x07";
				exports$1.ZIP64_CENTRAL_DIRECTORY_END = "PK";
				exports$1.DATA_DESCRIPTOR = "PK\x07\b";
			}, {}],
			24: [function(require$1, module$1, exports$1) {
				var GenericWorker = require$1("./GenericWorker");
				var utils = require$1("../utils");
				/**
				* A worker which convert chunks to a specified type.
				* @constructor
				* @param {String} destType the destination type.
				*/
				function ConvertWorker(destType) {
					GenericWorker.call(this, "ConvertWorker to " + destType);
					this.destType = destType;
				}
				utils.inherits(ConvertWorker, GenericWorker);
				/**
				* @see GenericWorker.processChunk
				*/
				ConvertWorker.prototype.processChunk = function(chunk) {
					this.push({
						data: utils.transformTo(this.destType, chunk.data),
						meta: chunk.meta
					});
				};
				module$1.exports = ConvertWorker;
			}, {
				"../utils": 32,
				"./GenericWorker": 28
			}],
			25: [function(require$1, module$1, exports$1) {
				var GenericWorker = require$1("./GenericWorker");
				var crc32 = require$1("../crc32");
				var utils = require$1("../utils");
				/**
				* A worker which calculate the crc32 of the data flowing through.
				* @constructor
				*/
				function Crc32Probe() {
					GenericWorker.call(this, "Crc32Probe");
					this.withStreamInfo("crc32", 0);
				}
				utils.inherits(Crc32Probe, GenericWorker);
				/**
				* @see GenericWorker.processChunk
				*/
				Crc32Probe.prototype.processChunk = function(chunk) {
					this.streamInfo.crc32 = crc32(chunk.data, this.streamInfo.crc32 || 0);
					this.push(chunk);
				};
				module$1.exports = Crc32Probe;
			}, {
				"../crc32": 4,
				"../utils": 32,
				"./GenericWorker": 28
			}],
			26: [function(require$1, module$1, exports$1) {
				var utils = require$1("../utils");
				var GenericWorker = require$1("./GenericWorker");
				/**
				* A worker which calculate the total length of the data flowing through.
				* @constructor
				* @param {String} propName the name used to expose the length
				*/
				function DataLengthProbe(propName) {
					GenericWorker.call(this, "DataLengthProbe for " + propName);
					this.propName = propName;
					this.withStreamInfo(propName, 0);
				}
				utils.inherits(DataLengthProbe, GenericWorker);
				/**
				* @see GenericWorker.processChunk
				*/
				DataLengthProbe.prototype.processChunk = function(chunk) {
					if (chunk) {
						var length = this.streamInfo[this.propName] || 0;
						this.streamInfo[this.propName] = length + chunk.data.length;
					}
					GenericWorker.prototype.processChunk.call(this, chunk);
				};
				module$1.exports = DataLengthProbe;
			}, {
				"../utils": 32,
				"./GenericWorker": 28
			}],
			27: [function(require$1, module$1, exports$1) {
				var utils = require$1("../utils");
				var GenericWorker = require$1("./GenericWorker");
				var DEFAULT_BLOCK_SIZE = 16384;
				/**
				* A worker that reads a content and emits chunks.
				* @constructor
				* @param {Promise} dataP the promise of the data to split
				*/
				function DataWorker(dataP) {
					GenericWorker.call(this, "DataWorker");
					var self$1 = this;
					this.dataIsReady = false;
					this.index = 0;
					this.max = 0;
					this.data = null;
					this.type = "";
					this._tickScheduled = false;
					dataP.then(function(data) {
						self$1.dataIsReady = true;
						self$1.data = data;
						self$1.max = data && data.length || 0;
						self$1.type = utils.getTypeOf(data);
						if (!self$1.isPaused) self$1._tickAndRepeat();
					}, function(e) {
						self$1.error(e);
					});
				}
				utils.inherits(DataWorker, GenericWorker);
				/**
				* @see GenericWorker.cleanUp
				*/
				DataWorker.prototype.cleanUp = function() {
					GenericWorker.prototype.cleanUp.call(this);
					this.data = null;
				};
				/**
				* @see GenericWorker.resume
				*/
				DataWorker.prototype.resume = function() {
					if (!GenericWorker.prototype.resume.call(this)) return false;
					if (!this._tickScheduled && this.dataIsReady) {
						this._tickScheduled = true;
						utils.delay(this._tickAndRepeat, [], this);
					}
					return true;
				};
				/**
				* Trigger a tick a schedule an other call to this function.
				*/
				DataWorker.prototype._tickAndRepeat = function() {
					this._tickScheduled = false;
					if (this.isPaused || this.isFinished) return;
					this._tick();
					if (!this.isFinished) {
						utils.delay(this._tickAndRepeat, [], this);
						this._tickScheduled = true;
					}
				};
				/**
				* Read and push a chunk.
				*/
				DataWorker.prototype._tick = function() {
					if (this.isPaused || this.isFinished) return false;
					var size = DEFAULT_BLOCK_SIZE;
					var data = null, nextIndex = Math.min(this.max, this.index + size);
					if (this.index >= this.max) return this.end();
else {
						switch (this.type) {
							case "string":
								data = this.data.substring(this.index, nextIndex);
								break;
							case "uint8array":
								data = this.data.subarray(this.index, nextIndex);
								break;
							case "array":
							case "nodebuffer":
								data = this.data.slice(this.index, nextIndex);
								break;
						}
						this.index = nextIndex;
						return this.push({
							data,
							meta: { percent: this.max ? this.index / this.max * 100 : 0 }
						});
					}
				};
				module$1.exports = DataWorker;
			}, {
				"../utils": 32,
				"./GenericWorker": 28
			}],
			28: [function(require$1, module$1, exports$1) {
				/**
				* A worker that does nothing but passing chunks to the next one. This is like
				* a nodejs stream but with some differences. On the good side :
				* - it works on IE 6-9 without any issue / polyfill
				* - it weights less than the full dependencies bundled with browserify
				* - it forwards errors (no need to declare an error handler EVERYWHERE)
				*
				* A chunk is an object with 2 attributes : `meta` and `data`. The former is an
				* object containing anything (`percent` for example), see each worker for more
				* details. The latter is the real data (String, Uint8Array, etc).
				*
				* @constructor
				* @param {String} name the name of the stream (mainly used for debugging purposes)
				*/
				function GenericWorker(name) {
					this.name = name || "default";
					this.streamInfo = {};
					this.generatedError = null;
					this.extraStreamInfo = {};
					this.isPaused = true;
					this.isFinished = false;
					this.isLocked = false;
					this._listeners = {
						"data": [],
						"end": [],
						"error": []
					};
					this.previous = null;
				}
				GenericWorker.prototype = {
					push: function(chunk) {
						this.emit("data", chunk);
					},
					end: function() {
						if (this.isFinished) return false;
						this.flush();
						try {
							this.emit("end");
							this.cleanUp();
							this.isFinished = true;
						} catch (e) {
							this.emit("error", e);
						}
						return true;
					},
					error: function(e) {
						if (this.isFinished) return false;
						if (this.isPaused) this.generatedError = e;
else {
							this.isFinished = true;
							this.emit("error", e);
							if (this.previous) this.previous.error(e);
							this.cleanUp();
						}
						return true;
					},
					on: function(name, listener) {
						this._listeners[name].push(listener);
						return this;
					},
					cleanUp: function() {
						this.streamInfo = this.generatedError = this.extraStreamInfo = null;
						this._listeners = [];
					},
					emit: function(name, arg) {
						if (this._listeners[name]) for (var i = 0; i < this._listeners[name].length; i++) this._listeners[name][i].call(this, arg);
					},
					pipe: function(next) {
						return next.registerPrevious(this);
					},
					registerPrevious: function(previous) {
						if (this.isLocked) throw new Error("The stream '" + this + "' has already been used.");
						this.streamInfo = previous.streamInfo;
						this.mergeStreamInfo();
						this.previous = previous;
						var self$1 = this;
						previous.on("data", function(chunk) {
							self$1.processChunk(chunk);
						});
						previous.on("end", function() {
							self$1.end();
						});
						previous.on("error", function(e) {
							self$1.error(e);
						});
						return this;
					},
					pause: function() {
						if (this.isPaused || this.isFinished) return false;
						this.isPaused = true;
						if (this.previous) this.previous.pause();
						return true;
					},
					resume: function() {
						if (!this.isPaused || this.isFinished) return false;
						this.isPaused = false;
						var withError = false;
						if (this.generatedError) {
							this.error(this.generatedError);
							withError = true;
						}
						if (this.previous) this.previous.resume();
						return !withError;
					},
					flush: function() {},
					processChunk: function(chunk) {
						this.push(chunk);
					},
					withStreamInfo: function(key, value) {
						this.extraStreamInfo[key] = value;
						this.mergeStreamInfo();
						return this;
					},
					mergeStreamInfo: function() {
						for (var key in this.extraStreamInfo) {
							if (!Object.prototype.hasOwnProperty.call(this.extraStreamInfo, key)) continue;
							this.streamInfo[key] = this.extraStreamInfo[key];
						}
					},
					lock: function() {
						if (this.isLocked) throw new Error("The stream '" + this + "' has already been used.");
						this.isLocked = true;
						if (this.previous) this.previous.lock();
					},
					toString: function() {
						var me = "Worker " + this.name;
						if (this.previous) return this.previous + " -> " + me;
else return me;
					}
				};
				module$1.exports = GenericWorker;
			}, {}],
			29: [function(require$1, module$1, exports$1) {
				var utils = require$1("../utils");
				var ConvertWorker = require$1("./ConvertWorker");
				var GenericWorker = require$1("./GenericWorker");
				var base64 = require$1("../base64");
				var support = require$1("../support");
				var external = require$1("../external");
				var NodejsStreamOutputAdapter = null;
				if (support.nodestream) try {
					NodejsStreamOutputAdapter = require$1("../nodejs/NodejsStreamOutputAdapter");
				} catch (e) {}
				/**
				* Apply the final transformation of the data. If the user wants a Blob for
				* example, it's easier to work with an U8intArray and finally do the
				* ArrayBuffer/Blob conversion.
				* @param {String} type the name of the final type
				* @param {String|Uint8Array|Buffer} content the content to transform
				* @param {String} mimeType the mime type of the content, if applicable.
				* @return {String|Uint8Array|ArrayBuffer|Buffer|Blob} the content in the right format.
				*/
				function transformZipOutput(type, content, mimeType) {
					switch (type) {
						case "blob": return utils.newBlob(utils.transformTo("arraybuffer", content), mimeType);
						case "base64": return base64.encode(content);
						default: return utils.transformTo(type, content);
					}
				}
				/**
				* Concatenate an array of data of the given type.
				* @param {String} type the type of the data in the given array.
				* @param {Array} dataArray the array containing the data chunks to concatenate
				* @return {String|Uint8Array|Buffer} the concatenated data
				* @throws Error if the asked type is unsupported
				*/
				function concat(type, dataArray) {
					var i, index = 0, res = null, totalLength = 0;
					for (i = 0; i < dataArray.length; i++) totalLength += dataArray[i].length;
					switch (type) {
						case "string": return dataArray.join("");
						case "array": return Array.prototype.concat.apply([], dataArray);
						case "uint8array":
							res = new Uint8Array(totalLength);
							for (i = 0; i < dataArray.length; i++) {
								res.set(dataArray[i], index);
								index += dataArray[i].length;
							}
							return res;
						case "nodebuffer": return Buffer.concat(dataArray);
						default: throw new Error("concat : unsupported type '" + type + "'");
					}
				}
				/**
				* Listen a StreamHelper, accumulate its content and concatenate it into a
				* complete block.
				* @param {StreamHelper} helper the helper to use.
				* @param {Function} updateCallback a callback called on each update. Called
				* with one arg :
				* - the metadata linked to the update received.
				* @return Promise the promise for the accumulation.
				*/
				function accumulate(helper, updateCallback) {
					return new external.Promise(function(resolve, reject) {
						var dataArray = [];
						var chunkType = helper._internalType, resultType = helper._outputType, mimeType = helper._mimeType;
						helper.on("data", function(data, meta) {
							dataArray.push(data);
							if (updateCallback) updateCallback(meta);
						}).on("error", function(err) {
							dataArray = [];
							reject(err);
						}).on("end", function() {
							try {
								var result = transformZipOutput(resultType, concat(chunkType, dataArray), mimeType);
								resolve(result);
							} catch (e) {
								reject(e);
							}
							dataArray = [];
						}).resume();
					});
				}
				/**
				* An helper to easily use workers outside of JSZip.
				* @constructor
				* @param {Worker} worker the worker to wrap
				* @param {String} outputType the type of data expected by the use
				* @param {String} mimeType the mime type of the content, if applicable.
				*/
				function StreamHelper(worker, outputType, mimeType) {
					var internalType = outputType;
					switch (outputType) {
						case "blob":
						case "arraybuffer":
							internalType = "uint8array";
							break;
						case "base64":
							internalType = "string";
							break;
					}
					try {
						this._internalType = internalType;
						this._outputType = outputType;
						this._mimeType = mimeType;
						utils.checkSupport(internalType);
						this._worker = worker.pipe(new ConvertWorker(internalType));
						worker.lock();
					} catch (e) {
						this._worker = new GenericWorker("error");
						this._worker.error(e);
					}
				}
				StreamHelper.prototype = {
					accumulate: function(updateCb) {
						return accumulate(this, updateCb);
					},
					on: function(evt, fn) {
						var self$1 = this;
						if (evt === "data") this._worker.on(evt, function(chunk) {
							fn.call(self$1, chunk.data, chunk.meta);
						});
else this._worker.on(evt, function() {
							utils.delay(fn, arguments, self$1);
						});
						return this;
					},
					resume: function() {
						utils.delay(this._worker.resume, [], this._worker);
						return this;
					},
					pause: function() {
						this._worker.pause();
						return this;
					},
					toNodejsStream: function(updateCb) {
						utils.checkSupport("nodestream");
						if (this._outputType !== "nodebuffer") throw new Error(this._outputType + " is not supported by this method");
						return new NodejsStreamOutputAdapter(this, { objectMode: this._outputType !== "nodebuffer" }, updateCb);
					}
				};
				module$1.exports = StreamHelper;
			}, {
				"../base64": 1,
				"../external": 6,
				"../nodejs/NodejsStreamOutputAdapter": 13,
				"../support": 30,
				"../utils": 32,
				"./ConvertWorker": 24,
				"./GenericWorker": 28
			}],
			30: [function(require$1, module$1, exports$1) {
				exports$1.base64 = true;
				exports$1.array = true;
				exports$1.string = true;
				exports$1.arraybuffer = typeof ArrayBuffer !== "undefined" && typeof Uint8Array !== "undefined";
				exports$1.nodebuffer = typeof Buffer !== "undefined";
				exports$1.uint8array = typeof Uint8Array !== "undefined";
				if (typeof ArrayBuffer === "undefined") exports$1.blob = false;
else {
					var buffer = new ArrayBuffer(0);
					try {
						exports$1.blob = new Blob([buffer], { type: "application/zip" }).size === 0;
					} catch (e) {
						try {
							var Builder = self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder;
							var builder = new Builder();
							builder.append(buffer);
							exports$1.blob = builder.getBlob("application/zip").size === 0;
						} catch (e$1) {
							exports$1.blob = false;
						}
					}
				}
				try {
					exports$1.nodestream = !!require$1("readable-stream").Readable;
				} catch (e) {
					exports$1.nodestream = false;
				}
			}, { "readable-stream": 16 }],
			31: [function(require$1, module$1, exports$1) {
				var utils = require$1("./utils");
				var support = require$1("./support");
				var nodejsUtils = require$1("./nodejsUtils");
				var GenericWorker = require$1("./stream/GenericWorker");
				/**
				* The following functions come from pako, from pako/lib/utils/strings
				* released under the MIT license, see pako https://github.com/nodeca/pako/
				*/
				var _utf8len = new Array(256);
				for (var i = 0; i < 256; i++) _utf8len[i] = i >= 252 ? 6 : i >= 248 ? 5 : i >= 240 ? 4 : i >= 224 ? 3 : i >= 192 ? 2 : 1;
				_utf8len[254] = _utf8len[254] = 1;
				var string2buf = function(str) {
					var buf, c, c2, m_pos, i$1, str_len = str.length, buf_len = 0;
					for (m_pos = 0; m_pos < str_len; m_pos++) {
						c = str.charCodeAt(m_pos);
						if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
							c2 = str.charCodeAt(m_pos + 1);
							if ((c2 & 64512) === 56320) {
								c = 65536 + (c - 55296 << 10) + (c2 - 56320);
								m_pos++;
							}
						}
						buf_len += c < 128 ? 1 : c < 2048 ? 2 : c < 65536 ? 3 : 4;
					}
					if (support.uint8array) buf = new Uint8Array(buf_len);
else buf = new Array(buf_len);
					for (i$1 = 0, m_pos = 0; i$1 < buf_len; m_pos++) {
						c = str.charCodeAt(m_pos);
						if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
							c2 = str.charCodeAt(m_pos + 1);
							if ((c2 & 64512) === 56320) {
								c = 65536 + (c - 55296 << 10) + (c2 - 56320);
								m_pos++;
							}
						}
						if (c < 128) buf[i$1++] = c;
else if (c < 2048) {
							buf[i$1++] = 192 | c >>> 6;
							buf[i$1++] = 128 | c & 63;
						} else if (c < 65536) {
							buf[i$1++] = 224 | c >>> 12;
							buf[i$1++] = 128 | c >>> 6 & 63;
							buf[i$1++] = 128 | c & 63;
						} else {
							buf[i$1++] = 240 | c >>> 18;
							buf[i$1++] = 128 | c >>> 12 & 63;
							buf[i$1++] = 128 | c >>> 6 & 63;
							buf[i$1++] = 128 | c & 63;
						}
					}
					return buf;
				};
				var utf8border = function(buf, max) {
					var pos;
					max = max || buf.length;
					if (max > buf.length) max = buf.length;
					pos = max - 1;
					while (pos >= 0 && (buf[pos] & 192) === 128) pos--;
					if (pos < 0) return max;
					if (pos === 0) return max;
					return pos + _utf8len[buf[pos]] > max ? pos : max;
				};
				var buf2string = function(buf) {
					var i$1, out, c, c_len;
					var len = buf.length;
					var utf16buf = new Array(len * 2);
					for (out = 0, i$1 = 0; i$1 < len;) {
						c = buf[i$1++];
						if (c < 128) {
							utf16buf[out++] = c;
							continue;
						}
						c_len = _utf8len[c];
						if (c_len > 4) {
							utf16buf[out++] = 65533;
							i$1 += c_len - 1;
							continue;
						}
						c &= c_len === 2 ? 31 : c_len === 3 ? 15 : 7;
						while (c_len > 1 && i$1 < len) {
							c = c << 6 | buf[i$1++] & 63;
							c_len--;
						}
						if (c_len > 1) {
							utf16buf[out++] = 65533;
							continue;
						}
						if (c < 65536) utf16buf[out++] = c;
else {
							c -= 65536;
							utf16buf[out++] = 55296 | c >> 10 & 1023;
							utf16buf[out++] = 56320 | c & 1023;
						}
					}
					if (utf16buf.length !== out) if (utf16buf.subarray) utf16buf = utf16buf.subarray(0, out);
else utf16buf.length = out;
					return utils.applyFromCharCode(utf16buf);
				};
				/**
				* Transform a javascript string into an array (typed if possible) of bytes,
				* UTF-8 encoded.
				* @param {String} str the string to encode
				* @return {Array|Uint8Array|Buffer} the UTF-8 encoded string.
				*/
				exports$1.utf8encode = function utf8encode(str) {
					if (support.nodebuffer) return nodejsUtils.newBufferFrom(str, "utf-8");
					return string2buf(str);
				};
				/**
				* Transform a bytes array (or a representation) representing an UTF-8 encoded
				* string into a javascript string.
				* @param {Array|Uint8Array|Buffer} buf the data de decode
				* @return {String} the decoded string.
				*/
				exports$1.utf8decode = function utf8decode(buf) {
					if (support.nodebuffer) return utils.transformTo("nodebuffer", buf).toString("utf-8");
					buf = utils.transformTo(support.uint8array ? "uint8array" : "array", buf);
					return buf2string(buf);
				};
				/**
				* A worker to decode utf8 encoded binary chunks into string chunks.
				* @constructor
				*/
				function Utf8DecodeWorker() {
					GenericWorker.call(this, "utf-8 decode");
					this.leftOver = null;
				}
				utils.inherits(Utf8DecodeWorker, GenericWorker);
				/**
				* @see GenericWorker.processChunk
				*/
				Utf8DecodeWorker.prototype.processChunk = function(chunk) {
					var data = utils.transformTo(support.uint8array ? "uint8array" : "array", chunk.data);
					if (this.leftOver && this.leftOver.length) {
						if (support.uint8array) {
							var previousData = data;
							data = new Uint8Array(previousData.length + this.leftOver.length);
							data.set(this.leftOver, 0);
							data.set(previousData, this.leftOver.length);
						} else data = this.leftOver.concat(data);
						this.leftOver = null;
					}
					var nextBoundary = utf8border(data);
					var usableData = data;
					if (nextBoundary !== data.length) if (support.uint8array) {
						usableData = data.subarray(0, nextBoundary);
						this.leftOver = data.subarray(nextBoundary, data.length);
					} else {
						usableData = data.slice(0, nextBoundary);
						this.leftOver = data.slice(nextBoundary, data.length);
					}
					this.push({
						data: exports$1.utf8decode(usableData),
						meta: chunk.meta
					});
				};
				/**
				* @see GenericWorker.flush
				*/
				Utf8DecodeWorker.prototype.flush = function() {
					if (this.leftOver && this.leftOver.length) {
						this.push({
							data: exports$1.utf8decode(this.leftOver),
							meta: {}
						});
						this.leftOver = null;
					}
				};
				exports$1.Utf8DecodeWorker = Utf8DecodeWorker;
				/**
				* A worker to endcode string chunks into utf8 encoded binary chunks.
				* @constructor
				*/
				function Utf8EncodeWorker() {
					GenericWorker.call(this, "utf-8 encode");
				}
				utils.inherits(Utf8EncodeWorker, GenericWorker);
				/**
				* @see GenericWorker.processChunk
				*/
				Utf8EncodeWorker.prototype.processChunk = function(chunk) {
					this.push({
						data: exports$1.utf8encode(chunk.data),
						meta: chunk.meta
					});
				};
				exports$1.Utf8EncodeWorker = Utf8EncodeWorker;
			}, {
				"./nodejsUtils": 14,
				"./stream/GenericWorker": 28,
				"./support": 30,
				"./utils": 32
			}],
			32: [function(require$1, module$1, exports$1) {
				var support = require$1("./support");
				var base64 = require$1("./base64");
				var nodejsUtils = require$1("./nodejsUtils");
				var external = require$1("./external");
				require$1("setimmediate");
				/**
				* Convert a string that pass as a "binary string": it should represent a byte
				* array but may have > 255 char codes. Be sure to take only the first byte
				* and returns the byte array.
				* @param {String} str the string to transform.
				* @return {Array|Uint8Array} the string in a binary format.
				*/
				function string2binary(str) {
					var result = null;
					if (support.uint8array) result = new Uint8Array(str.length);
else result = new Array(str.length);
					return stringToArrayLike(str, result);
				}
				/**
				* Create a new blob with the given content and the given type.
				* @param {String|ArrayBuffer} part the content to put in the blob. DO NOT use
				* an Uint8Array because the stock browser of android 4 won't accept it (it
				* will be silently converted to a string, "[object Uint8Array]").
				*
				* Use only ONE part to build the blob to avoid a memory leak in IE11 / Edge:
				* when a large amount of Array is used to create the Blob, the amount of
				* memory consumed is nearly 100 times the original data amount.
				*
				* @param {String} type the mime type of the blob.
				* @return {Blob} the created blob.
				*/
				exports$1.newBlob = function(part, type) {
					exports$1.checkSupport("blob");
					try {
						return new Blob([part], { type });
					} catch (e) {
						try {
							var Builder = self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder;
							var builder = new Builder();
							builder.append(part);
							return builder.getBlob(type);
						} catch (e$1) {
							throw new Error("Bug : can't construct the Blob.");
						}
					}
				};
				/**
				* The identity function.
				* @param {Object} input the input.
				* @return {Object} the same input.
				*/
				function identity(input) {
					return input;
				}
				/**
				* Fill in an array with a string.
				* @param {String} str the string to use.
				* @param {Array|ArrayBuffer|Uint8Array|Buffer} array the array to fill in (will be mutated).
				* @return {Array|ArrayBuffer|Uint8Array|Buffer} the updated array.
				*/
				function stringToArrayLike(str, array) {
					for (var i = 0; i < str.length; ++i) array[i] = str.charCodeAt(i) & 255;
					return array;
				}
				/**
				* An helper for the function arrayLikeToString.
				* This contains static information and functions that
				* can be optimized by the browser JIT compiler.
				*/
				var arrayToStringHelper = {
					stringifyByChunk: function(array, type, chunk) {
						var result = [], k = 0, len = array.length;
						if (len <= chunk) return String.fromCharCode.apply(null, array);
						while (k < len) {
							if (type === "array" || type === "nodebuffer") result.push(String.fromCharCode.apply(null, array.slice(k, Math.min(k + chunk, len))));
else result.push(String.fromCharCode.apply(null, array.subarray(k, Math.min(k + chunk, len))));
							k += chunk;
						}
						return result.join("");
					},
					stringifyByChar: function(array) {
						var resultStr = "";
						for (var i = 0; i < array.length; i++) resultStr += String.fromCharCode(array[i]);
						return resultStr;
					},
					applyCanBeUsed: {
						uint8array: function() {
							try {
								return support.uint8array && String.fromCharCode.apply(null, new Uint8Array(1)).length === 1;
							} catch (e) {
								return false;
							}
						}(),
						nodebuffer: function() {
							try {
								return support.nodebuffer && String.fromCharCode.apply(null, nodejsUtils.allocBuffer(1)).length === 1;
							} catch (e) {
								return false;
							}
						}()
					}
				};
				/**
				* Transform an array-like object to a string.
				* @param {Array|ArrayBuffer|Uint8Array|Buffer} array the array to transform.
				* @return {String} the result.
				*/
				function arrayLikeToString(array) {
					var chunk = 65536, type = exports$1.getTypeOf(array), canUseApply = true;
					if (type === "uint8array") canUseApply = arrayToStringHelper.applyCanBeUsed.uint8array;
else if (type === "nodebuffer") canUseApply = arrayToStringHelper.applyCanBeUsed.nodebuffer;
					if (canUseApply) while (chunk > 1) try {
						return arrayToStringHelper.stringifyByChunk(array, type, chunk);
					} catch (e) {
						chunk = Math.floor(chunk / 2);
					}
					return arrayToStringHelper.stringifyByChar(array);
				}
				exports$1.applyFromCharCode = arrayLikeToString;
				/**
				* Copy the data from an array-like to an other array-like.
				* @param {Array|ArrayBuffer|Uint8Array|Buffer} arrayFrom the origin array.
				* @param {Array|ArrayBuffer|Uint8Array|Buffer} arrayTo the destination array which will be mutated.
				* @return {Array|ArrayBuffer|Uint8Array|Buffer} the updated destination array.
				*/
				function arrayLikeToArrayLike(arrayFrom, arrayTo) {
					for (var i = 0; i < arrayFrom.length; i++) arrayTo[i] = arrayFrom[i];
					return arrayTo;
				}
				var transform = {};
				transform["string"] = {
					"string": identity,
					"array": function(input) {
						return stringToArrayLike(input, new Array(input.length));
					},
					"arraybuffer": function(input) {
						return transform["string"]["uint8array"](input).buffer;
					},
					"uint8array": function(input) {
						return stringToArrayLike(input, new Uint8Array(input.length));
					},
					"nodebuffer": function(input) {
						return stringToArrayLike(input, nodejsUtils.allocBuffer(input.length));
					}
				};
				transform["array"] = {
					"string": arrayLikeToString,
					"array": identity,
					"arraybuffer": function(input) {
						return new Uint8Array(input).buffer;
					},
					"uint8array": function(input) {
						return new Uint8Array(input);
					},
					"nodebuffer": function(input) {
						return nodejsUtils.newBufferFrom(input);
					}
				};
				transform["arraybuffer"] = {
					"string": function(input) {
						return arrayLikeToString(new Uint8Array(input));
					},
					"array": function(input) {
						return arrayLikeToArrayLike(new Uint8Array(input), new Array(input.byteLength));
					},
					"arraybuffer": identity,
					"uint8array": function(input) {
						return new Uint8Array(input);
					},
					"nodebuffer": function(input) {
						return nodejsUtils.newBufferFrom(new Uint8Array(input));
					}
				};
				transform["uint8array"] = {
					"string": arrayLikeToString,
					"array": function(input) {
						return arrayLikeToArrayLike(input, new Array(input.length));
					},
					"arraybuffer": function(input) {
						return input.buffer;
					},
					"uint8array": identity,
					"nodebuffer": function(input) {
						return nodejsUtils.newBufferFrom(input);
					}
				};
				transform["nodebuffer"] = {
					"string": arrayLikeToString,
					"array": function(input) {
						return arrayLikeToArrayLike(input, new Array(input.length));
					},
					"arraybuffer": function(input) {
						return transform["nodebuffer"]["uint8array"](input).buffer;
					},
					"uint8array": function(input) {
						return arrayLikeToArrayLike(input, new Uint8Array(input.length));
					},
					"nodebuffer": identity
				};
				/**
				* Transform an input into any type.
				* The supported output type are : string, array, uint8array, arraybuffer, nodebuffer.
				* If no output type is specified, the unmodified input will be returned.
				* @param {String} outputType the output type.
				* @param {String|Array|ArrayBuffer|Uint8Array|Buffer} input the input to convert.
				* @throws {Error} an Error if the browser doesn't support the requested output type.
				*/
				exports$1.transformTo = function(outputType, input) {
					if (!input) input = "";
					if (!outputType) return input;
					exports$1.checkSupport(outputType);
					var inputType = exports$1.getTypeOf(input);
					var result = transform[inputType][outputType](input);
					return result;
				};
				/**
				* Resolve all relative path components, "." and "..", in a path. If these relative components
				* traverse above the root then the resulting path will only contain the final path component.
				*
				* All empty components, e.g. "//", are removed.
				* @param {string} path A path with / or \ separators
				* @returns {string} The path with all relative path components resolved.
				*/
				exports$1.resolve = function(path) {
					var parts = path.split("/");
					var result = [];
					for (var index = 0; index < parts.length; index++) {
						var part = parts[index];
						if (part === "." || part === "" && index !== 0 && index !== parts.length - 1) continue;
else if (part === "..") result.pop();
else result.push(part);
					}
					return result.join("/");
				};
				/**
				* Return the type of the input.
				* The type will be in a format valid for JSZip.utils.transformTo : string, array, uint8array, arraybuffer.
				* @param {Object} input the input to identify.
				* @return {String} the (lowercase) type of the input.
				*/
				exports$1.getTypeOf = function(input) {
					if (typeof input === "string") return "string";
					if (Object.prototype.toString.call(input) === "[object Array]") return "array";
					if (support.nodebuffer && nodejsUtils.isBuffer(input)) return "nodebuffer";
					if (support.uint8array && input instanceof Uint8Array) return "uint8array";
					if (support.arraybuffer && input instanceof ArrayBuffer) return "arraybuffer";
				};
				/**
				* Throw an exception if the type is not supported.
				* @param {String} type the type to check.
				* @throws {Error} an Error if the browser doesn't support the requested type.
				*/
				exports$1.checkSupport = function(type) {
					var supported = support[type.toLowerCase()];
					if (!supported) throw new Error(type + " is not supported by this platform");
				};
				exports$1.MAX_VALUE_16BITS = 65535;
				exports$1.MAX_VALUE_32BITS = -1;
				/**
				* Prettify a string read as binary.
				* @param {string} str the string to prettify.
				* @return {string} a pretty string.
				*/
				exports$1.pretty = function(str) {
					var res = "", code, i;
					for (i = 0; i < (str || "").length; i++) {
						code = str.charCodeAt(i);
						res += "\\x" + (code < 16 ? "0" : "") + code.toString(16).toUpperCase();
					}
					return res;
				};
				/**
				* Defer the call of a function.
				* @param {Function} callback the function to call asynchronously.
				* @param {Array} args the arguments to give to the callback.
				*/
				exports$1.delay = function(callback, args, self$1) {
					setImmediate(function() {
						callback.apply(self$1 || null, args || []);
					});
				};
				/**
				* Extends a prototype with an other, without calling a constructor with
				* side effects. Inspired by nodejs' `utils.inherits`
				* @param {Function} ctor the constructor to augment
				* @param {Function} superCtor the parent constructor to use
				*/
				exports$1.inherits = function(ctor, superCtor) {
					var Obj = function() {};
					Obj.prototype = superCtor.prototype;
					ctor.prototype = new Obj();
				};
				/**
				* Merge the objects passed as parameters into a new one.
				* @private
				* @param {...Object} var_args All objects to merge.
				* @return {Object} a new object with the data of the others.
				*/
				exports$1.extend = function() {
					var result = {}, i, attr;
					for (i = 0; i < arguments.length; i++) for (attr in arguments[i]) if (Object.prototype.hasOwnProperty.call(arguments[i], attr) && typeof result[attr] === "undefined") result[attr] = arguments[i][attr];
					return result;
				};
				/**
				* Transform arbitrary content into a Promise.
				* @param {String} name a name for the content being processed.
				* @param {Object} inputData the content to process.
				* @param {Boolean} isBinary true if the content is not an unicode string
				* @param {Boolean} isOptimizedBinaryString true if the string content only has one byte per character.
				* @param {Boolean} isBase64 true if the string content is encoded with base64.
				* @return {Promise} a promise in a format usable by JSZip.
				*/
				exports$1.prepareContent = function(name, inputData, isBinary, isOptimizedBinaryString, isBase64) {
					var promise = external.Promise.resolve(inputData).then(function(data) {
						var isBlob = support.blob && (data instanceof Blob || ["[object File]", "[object Blob]"].indexOf(Object.prototype.toString.call(data)) !== -1);
						if (isBlob && typeof FileReader !== "undefined") return new external.Promise(function(resolve, reject) {
							var reader = new FileReader();
							reader.onload = function(e) {
								resolve(e.target.result);
							};
							reader.onerror = function(e) {
								reject(e.target.error);
							};
							reader.readAsArrayBuffer(data);
						});
else return data;
					});
					return promise.then(function(data) {
						var dataType = exports$1.getTypeOf(data);
						if (!dataType) return external.Promise.reject(new Error("Can't read the data of '" + name + "'. Is it " + "in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?"));
						if (dataType === "arraybuffer") data = exports$1.transformTo("uint8array", data);
else if (dataType === "string") {
							if (isBase64) data = base64.decode(data);
else if (isBinary) {
								if (isOptimizedBinaryString !== true) data = string2binary(data);
							}
						}
						return data;
					});
				};
			}, {
				"./base64": 1,
				"./external": 6,
				"./nodejsUtils": 14,
				"./support": 30,
				"setimmediate": 54
			}],
			33: [function(require$1, module$1, exports$1) {
				var readerFor = require$1("./reader/readerFor");
				var utils = require$1("./utils");
				var sig = require$1("./signature");
				var ZipEntry = require$1("./zipEntry");
				var support = require$1("./support");
				/**
				* All the entries in the zip file.
				* @constructor
				* @param {Object} loadOptions Options for loading the stream.
				*/
				function ZipEntries(loadOptions) {
					this.files = [];
					this.loadOptions = loadOptions;
				}
				ZipEntries.prototype = {
					checkSignature: function(expectedSignature) {
						if (!this.reader.readAndCheckSignature(expectedSignature)) {
							this.reader.index -= 4;
							var signature = this.reader.readString(4);
							throw new Error("Corrupted zip or bug: unexpected signature (" + utils.pretty(signature) + ", expected " + utils.pretty(expectedSignature) + ")");
						}
					},
					isSignature: function(askedIndex, expectedSignature) {
						var currentIndex = this.reader.index;
						this.reader.setIndex(askedIndex);
						var signature = this.reader.readString(4);
						var result = signature === expectedSignature;
						this.reader.setIndex(currentIndex);
						return result;
					},
					readBlockEndOfCentral: function() {
						this.diskNumber = this.reader.readInt(2);
						this.diskWithCentralDirStart = this.reader.readInt(2);
						this.centralDirRecordsOnThisDisk = this.reader.readInt(2);
						this.centralDirRecords = this.reader.readInt(2);
						this.centralDirSize = this.reader.readInt(4);
						this.centralDirOffset = this.reader.readInt(4);
						this.zipCommentLength = this.reader.readInt(2);
						var zipComment = this.reader.readData(this.zipCommentLength);
						var decodeParamType = support.uint8array ? "uint8array" : "array";
						var decodeContent = utils.transformTo(decodeParamType, zipComment);
						this.zipComment = this.loadOptions.decodeFileName(decodeContent);
					},
					readBlockZip64EndOfCentral: function() {
						this.zip64EndOfCentralSize = this.reader.readInt(8);
						this.reader.skip(4);
						this.diskNumber = this.reader.readInt(4);
						this.diskWithCentralDirStart = this.reader.readInt(4);
						this.centralDirRecordsOnThisDisk = this.reader.readInt(8);
						this.centralDirRecords = this.reader.readInt(8);
						this.centralDirSize = this.reader.readInt(8);
						this.centralDirOffset = this.reader.readInt(8);
						this.zip64ExtensibleData = {};
						var extraDataSize = this.zip64EndOfCentralSize - 44, index = 0, extraFieldId, extraFieldLength, extraFieldValue;
						while (index < extraDataSize) {
							extraFieldId = this.reader.readInt(2);
							extraFieldLength = this.reader.readInt(4);
							extraFieldValue = this.reader.readData(extraFieldLength);
							this.zip64ExtensibleData[extraFieldId] = {
								id: extraFieldId,
								length: extraFieldLength,
								value: extraFieldValue
							};
						}
					},
					readBlockZip64EndOfCentralLocator: function() {
						this.diskWithZip64CentralDirStart = this.reader.readInt(4);
						this.relativeOffsetEndOfZip64CentralDir = this.reader.readInt(8);
						this.disksCount = this.reader.readInt(4);
						if (this.disksCount > 1) throw new Error("Multi-volumes zip are not supported");
					},
					readLocalFiles: function() {
						var i, file;
						for (i = 0; i < this.files.length; i++) {
							file = this.files[i];
							this.reader.setIndex(file.localHeaderOffset);
							this.checkSignature(sig.LOCAL_FILE_HEADER);
							file.readLocalPart(this.reader);
							file.handleUTF8();
							file.processAttributes();
						}
					},
					readCentralDir: function() {
						var file;
						this.reader.setIndex(this.centralDirOffset);
						while (this.reader.readAndCheckSignature(sig.CENTRAL_FILE_HEADER)) {
							file = new ZipEntry({ zip64: this.zip64 }, this.loadOptions);
							file.readCentralPart(this.reader);
							this.files.push(file);
						}
						if (this.centralDirRecords !== this.files.length) {
							if (this.centralDirRecords !== 0 && this.files.length === 0) throw new Error("Corrupted zip or bug: expected " + this.centralDirRecords + " records in central dir, got " + this.files.length);
						}
					},
					readEndOfCentral: function() {
						var offset = this.reader.lastIndexOfSignature(sig.CENTRAL_DIRECTORY_END);
						if (offset < 0) {
							var isGarbage = !this.isSignature(0, sig.LOCAL_FILE_HEADER);
							if (isGarbage) throw new Error("Can't find end of central directory : is this a zip file ? If it is, see https://stuk.github.io/jszip/documentation/howto/read_zip.html");
else throw new Error("Corrupted zip: can't find end of central directory");
						}
						this.reader.setIndex(offset);
						var endOfCentralDirOffset = offset;
						this.checkSignature(sig.CENTRAL_DIRECTORY_END);
						this.readBlockEndOfCentral();
						if (this.diskNumber === utils.MAX_VALUE_16BITS || this.diskWithCentralDirStart === utils.MAX_VALUE_16BITS || this.centralDirRecordsOnThisDisk === utils.MAX_VALUE_16BITS || this.centralDirRecords === utils.MAX_VALUE_16BITS || this.centralDirSize === utils.MAX_VALUE_32BITS || this.centralDirOffset === utils.MAX_VALUE_32BITS) {
							this.zip64 = true;
							offset = this.reader.lastIndexOfSignature(sig.ZIP64_CENTRAL_DIRECTORY_LOCATOR);
							if (offset < 0) throw new Error("Corrupted zip: can't find the ZIP64 end of central directory locator");
							this.reader.setIndex(offset);
							this.checkSignature(sig.ZIP64_CENTRAL_DIRECTORY_LOCATOR);
							this.readBlockZip64EndOfCentralLocator();
							if (!this.isSignature(this.relativeOffsetEndOfZip64CentralDir, sig.ZIP64_CENTRAL_DIRECTORY_END)) {
								this.relativeOffsetEndOfZip64CentralDir = this.reader.lastIndexOfSignature(sig.ZIP64_CENTRAL_DIRECTORY_END);
								if (this.relativeOffsetEndOfZip64CentralDir < 0) throw new Error("Corrupted zip: can't find the ZIP64 end of central directory");
							}
							this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir);
							this.checkSignature(sig.ZIP64_CENTRAL_DIRECTORY_END);
							this.readBlockZip64EndOfCentral();
						}
						var expectedEndOfCentralDirOffset = this.centralDirOffset + this.centralDirSize;
						if (this.zip64) {
							expectedEndOfCentralDirOffset += 20;
							expectedEndOfCentralDirOffset += 12 + this.zip64EndOfCentralSize;
						}
						var extraBytes = endOfCentralDirOffset - expectedEndOfCentralDirOffset;
						if (extraBytes > 0) if (this.isSignature(endOfCentralDirOffset, sig.CENTRAL_FILE_HEADER));
else this.reader.zero = extraBytes;
else if (extraBytes < 0) throw new Error("Corrupted zip: missing " + Math.abs(extraBytes) + " bytes.");
					},
					prepareReader: function(data) {
						this.reader = readerFor(data);
					},
					load: function(data) {
						this.prepareReader(data);
						this.readEndOfCentral();
						this.readCentralDir();
						this.readLocalFiles();
					}
				};
				module$1.exports = ZipEntries;
			}, {
				"./reader/readerFor": 22,
				"./signature": 23,
				"./support": 30,
				"./utils": 32,
				"./zipEntry": 34
			}],
			34: [function(require$1, module$1, exports$1) {
				var readerFor = require$1("./reader/readerFor");
				var utils = require$1("./utils");
				var CompressedObject = require$1("./compressedObject");
				var crc32fn = require$1("./crc32");
				var utf8 = require$1("./utf8");
				var compressions = require$1("./compressions");
				var support = require$1("./support");
				var MADE_BY_DOS = 0;
				var MADE_BY_UNIX = 3;
				/**
				* Find a compression registered in JSZip.
				* @param {string} compressionMethod the method magic to find.
				* @return {Object|null} the JSZip compression object, null if none found.
				*/
				var findCompression = function(compressionMethod) {
					for (var method in compressions) {
						if (!Object.prototype.hasOwnProperty.call(compressions, method)) continue;
						if (compressions[method].magic === compressionMethod) return compressions[method];
					}
					return null;
				};
				/**
				* An entry in the zip file.
				* @constructor
				* @param {Object} options Options of the current file.
				* @param {Object} loadOptions Options for loading the stream.
				*/
				function ZipEntry(options, loadOptions) {
					this.options = options;
					this.loadOptions = loadOptions;
				}
				ZipEntry.prototype = {
					isEncrypted: function() {
						return (this.bitFlag & 1) === 1;
					},
					useUTF8: function() {
						return (this.bitFlag & 2048) === 2048;
					},
					readLocalPart: function(reader) {
						var compression, localExtraFieldsLength;
						reader.skip(22);
						this.fileNameLength = reader.readInt(2);
						localExtraFieldsLength = reader.readInt(2);
						this.fileName = reader.readData(this.fileNameLength);
						reader.skip(localExtraFieldsLength);
						if (this.compressedSize === -1 || this.uncompressedSize === -1) throw new Error("Bug or corrupted zip : didn't get enough information from the central directory (compressedSize === -1 || uncompressedSize === -1)");
						compression = findCompression(this.compressionMethod);
						if (compression === null) throw new Error("Corrupted zip : compression " + utils.pretty(this.compressionMethod) + " unknown (inner file : " + utils.transformTo("string", this.fileName) + ")");
						this.decompressed = new CompressedObject(this.compressedSize, this.uncompressedSize, this.crc32, compression, reader.readData(this.compressedSize));
					},
					readCentralPart: function(reader) {
						this.versionMadeBy = reader.readInt(2);
						reader.skip(2);
						this.bitFlag = reader.readInt(2);
						this.compressionMethod = reader.readString(2);
						this.date = reader.readDate();
						this.crc32 = reader.readInt(4);
						this.compressedSize = reader.readInt(4);
						this.uncompressedSize = reader.readInt(4);
						var fileNameLength = reader.readInt(2);
						this.extraFieldsLength = reader.readInt(2);
						this.fileCommentLength = reader.readInt(2);
						this.diskNumberStart = reader.readInt(2);
						this.internalFileAttributes = reader.readInt(2);
						this.externalFileAttributes = reader.readInt(4);
						this.localHeaderOffset = reader.readInt(4);
						if (this.isEncrypted()) throw new Error("Encrypted zip are not supported");
						reader.skip(fileNameLength);
						this.readExtraFields(reader);
						this.parseZIP64ExtraField(reader);
						this.fileComment = reader.readData(this.fileCommentLength);
					},
					processAttributes: function() {
						this.unixPermissions = null;
						this.dosPermissions = null;
						var madeBy = this.versionMadeBy >> 8;
						this.dir = this.externalFileAttributes & 16 ? true : false;
						if (madeBy === MADE_BY_DOS) this.dosPermissions = this.externalFileAttributes & 63;
						if (madeBy === MADE_BY_UNIX) this.unixPermissions = this.externalFileAttributes >> 16 & 65535;
						if (!this.dir && this.fileNameStr.slice(-1) === "/") this.dir = true;
					},
					parseZIP64ExtraField: function() {
						if (!this.extraFields[1]) return;
						var extraReader = readerFor(this.extraFields[1].value);
						if (this.uncompressedSize === utils.MAX_VALUE_32BITS) this.uncompressedSize = extraReader.readInt(8);
						if (this.compressedSize === utils.MAX_VALUE_32BITS) this.compressedSize = extraReader.readInt(8);
						if (this.localHeaderOffset === utils.MAX_VALUE_32BITS) this.localHeaderOffset = extraReader.readInt(8);
						if (this.diskNumberStart === utils.MAX_VALUE_32BITS) this.diskNumberStart = extraReader.readInt(4);
					},
					readExtraFields: function(reader) {
						var end = reader.index + this.extraFieldsLength, extraFieldId, extraFieldLength, extraFieldValue;
						if (!this.extraFields) this.extraFields = {};
						while (reader.index + 4 < end) {
							extraFieldId = reader.readInt(2);
							extraFieldLength = reader.readInt(2);
							extraFieldValue = reader.readData(extraFieldLength);
							this.extraFields[extraFieldId] = {
								id: extraFieldId,
								length: extraFieldLength,
								value: extraFieldValue
							};
						}
						reader.setIndex(end);
					},
					handleUTF8: function() {
						var decodeParamType = support.uint8array ? "uint8array" : "array";
						if (this.useUTF8()) {
							this.fileNameStr = utf8.utf8decode(this.fileName);
							this.fileCommentStr = utf8.utf8decode(this.fileComment);
						} else {
							var upath = this.findExtraFieldUnicodePath();
							if (upath !== null) this.fileNameStr = upath;
else {
								var fileNameByteArray = utils.transformTo(decodeParamType, this.fileName);
								this.fileNameStr = this.loadOptions.decodeFileName(fileNameByteArray);
							}
							var ucomment = this.findExtraFieldUnicodeComment();
							if (ucomment !== null) this.fileCommentStr = ucomment;
else {
								var commentByteArray = utils.transformTo(decodeParamType, this.fileComment);
								this.fileCommentStr = this.loadOptions.decodeFileName(commentByteArray);
							}
						}
					},
					findExtraFieldUnicodePath: function() {
						var upathField = this.extraFields[28789];
						if (upathField) {
							var extraReader = readerFor(upathField.value);
							if (extraReader.readInt(1) !== 1) return null;
							if (crc32fn(this.fileName) !== extraReader.readInt(4)) return null;
							return utf8.utf8decode(extraReader.readData(upathField.length - 5));
						}
						return null;
					},
					findExtraFieldUnicodeComment: function() {
						var ucommentField = this.extraFields[25461];
						if (ucommentField) {
							var extraReader = readerFor(ucommentField.value);
							if (extraReader.readInt(1) !== 1) return null;
							if (crc32fn(this.fileComment) !== extraReader.readInt(4)) return null;
							return utf8.utf8decode(extraReader.readData(ucommentField.length - 5));
						}
						return null;
					}
				};
				module$1.exports = ZipEntry;
			}, {
				"./compressedObject": 2,
				"./compressions": 3,
				"./crc32": 4,
				"./reader/readerFor": 22,
				"./support": 30,
				"./utf8": 31,
				"./utils": 32
			}],
			35: [function(require$1, module$1, exports$1) {
				var StreamHelper = require$1("./stream/StreamHelper");
				var DataWorker = require$1("./stream/DataWorker");
				var utf8 = require$1("./utf8");
				var CompressedObject = require$1("./compressedObject");
				var GenericWorker = require$1("./stream/GenericWorker");
				/**
				* A simple object representing a file in the zip file.
				* @constructor
				* @param {string} name the name of the file
				* @param {String|ArrayBuffer|Uint8Array|Buffer} data the data
				* @param {Object} options the options of the file
				*/
				var ZipObject = function(name, data, options) {
					this.name = name;
					this.dir = options.dir;
					this.date = options.date;
					this.comment = options.comment;
					this.unixPermissions = options.unixPermissions;
					this.dosPermissions = options.dosPermissions;
					this._data = data;
					this._dataBinary = options.binary;
					this.options = {
						compression: options.compression,
						compressionOptions: options.compressionOptions
					};
				};
				ZipObject.prototype = {
					internalStream: function(type) {
						var result = null, outputType = "string";
						try {
							if (!type) throw new Error("No output type specified.");
							outputType = type.toLowerCase();
							var askUnicodeString = outputType === "string" || outputType === "text";
							if (outputType === "binarystring" || outputType === "text") outputType = "string";
							result = this._decompressWorker();
							var isUnicodeString = !this._dataBinary;
							if (isUnicodeString && !askUnicodeString) result = result.pipe(new utf8.Utf8EncodeWorker());
							if (!isUnicodeString && askUnicodeString) result = result.pipe(new utf8.Utf8DecodeWorker());
						} catch (e) {
							result = new GenericWorker("error");
							result.error(e);
						}
						return new StreamHelper(result, outputType, "");
					},
					async: function(type, onUpdate) {
						return this.internalStream(type).accumulate(onUpdate);
					},
					nodeStream: function(type, onUpdate) {
						return this.internalStream(type || "nodebuffer").toNodejsStream(onUpdate);
					},
					_compressWorker: function(compression, compressionOptions) {
						if (this._data instanceof CompressedObject && this._data.compression.magic === compression.magic) return this._data.getCompressedWorker();
else {
							var result = this._decompressWorker();
							if (!this._dataBinary) result = result.pipe(new utf8.Utf8EncodeWorker());
							return CompressedObject.createWorkerFrom(result, compression, compressionOptions);
						}
					},
					_decompressWorker: function() {
						if (this._data instanceof CompressedObject) return this._data.getContentWorker();
else if (this._data instanceof GenericWorker) return this._data;
else return new DataWorker(this._data);
					}
				};
				var removedMethods = [
					"asText",
					"asBinary",
					"asNodeBuffer",
					"asUint8Array",
					"asArrayBuffer"
				];
				var removedFn = function() {
					throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
				};
				for (var i = 0; i < removedMethods.length; i++) ZipObject.prototype[removedMethods[i]] = removedFn;
				module$1.exports = ZipObject;
			}, {
				"./compressedObject": 2,
				"./stream/DataWorker": 27,
				"./stream/GenericWorker": 28,
				"./stream/StreamHelper": 29,
				"./utf8": 31
			}],
			36: [function(require$1, module$1, exports$1) {
				(function(global$1) {
					var Mutation = global$1.MutationObserver || global$1.WebKitMutationObserver;
					var scheduleDrain;
					if (Mutation) {
						var called = 0;
						var observer = new Mutation(nextTick);
						var element = global$1.document.createTextNode("");
						observer.observe(element, { characterData: true });
						scheduleDrain = function() {
							element.data = called = ++called % 2;
						};
					} else if (!global$1.setImmediate && typeof global$1.MessageChannel !== "undefined") {
						var channel = new global$1.MessageChannel();
						channel.port1.onmessage = nextTick;
						scheduleDrain = function() {
							channel.port2.postMessage(0);
						};
					} else if ("document" in global$1 && "onreadystatechange" in global$1.document.createElement("script")) scheduleDrain = function() {
						var scriptEl = global$1.document.createElement("script");
						scriptEl.onreadystatechange = function() {
							nextTick();
							scriptEl.onreadystatechange = null;
							scriptEl.parentNode.removeChild(scriptEl);
							scriptEl = null;
						};
						global$1.document.documentElement.appendChild(scriptEl);
					};
else scheduleDrain = function() {
						setTimeout(nextTick, 0);
					};
					var draining;
					var queue = [];
					function nextTick() {
						draining = true;
						var i, oldQueue;
						var len = queue.length;
						while (len) {
							oldQueue = queue;
							queue = [];
							i = -1;
							while (++i < len) oldQueue[i]();
							len = queue.length;
						}
						draining = false;
					}
					module$1.exports = immediate;
					function immediate(task) {
						if (queue.push(task) === 1 && !draining) scheduleDrain();
					}
				}).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
			}, {}],
			37: [function(require$1, module$1, exports$1) {
				var immediate = require$1("immediate");
				function INTERNAL() {}
				var handlers = {};
				var REJECTED = ["REJECTED"];
				var FULFILLED = ["FULFILLED"];
				var PENDING = ["PENDING"];
				module$1.exports = Promise$1;
				function Promise$1(resolver) {
					if (typeof resolver !== "function") throw new TypeError("resolver must be a function");
					this.state = PENDING;
					this.queue = [];
					this.outcome = void 0;
					if (resolver !== INTERNAL) safelyResolveThenable(this, resolver);
				}
				Promise$1.prototype["finally"] = function(callback) {
					if (typeof callback !== "function") return this;
					var p = this.constructor;
					return this.then(resolve$1, reject$1);
					function resolve$1(value) {
						function yes() {
							return value;
						}
						return p.resolve(callback()).then(yes);
					}
					function reject$1(reason) {
						function no() {
							throw reason;
						}
						return p.resolve(callback()).then(no);
					}
				};
				Promise$1.prototype["catch"] = function(onRejected) {
					return this.then(null, onRejected);
				};
				Promise$1.prototype.then = function(onFulfilled, onRejected) {
					if (typeof onFulfilled !== "function" && this.state === FULFILLED || typeof onRejected !== "function" && this.state === REJECTED) return this;
					var promise = new this.constructor(INTERNAL);
					if (this.state !== PENDING) {
						var resolver = this.state === FULFILLED ? onFulfilled : onRejected;
						unwrap(promise, resolver, this.outcome);
					} else this.queue.push(new QueueItem(promise, onFulfilled, onRejected));
					return promise;
				};
				function QueueItem(promise, onFulfilled, onRejected) {
					this.promise = promise;
					if (typeof onFulfilled === "function") {
						this.onFulfilled = onFulfilled;
						this.callFulfilled = this.otherCallFulfilled;
					}
					if (typeof onRejected === "function") {
						this.onRejected = onRejected;
						this.callRejected = this.otherCallRejected;
					}
				}
				QueueItem.prototype.callFulfilled = function(value) {
					handlers.resolve(this.promise, value);
				};
				QueueItem.prototype.otherCallFulfilled = function(value) {
					unwrap(this.promise, this.onFulfilled, value);
				};
				QueueItem.prototype.callRejected = function(value) {
					handlers.reject(this.promise, value);
				};
				QueueItem.prototype.otherCallRejected = function(value) {
					unwrap(this.promise, this.onRejected, value);
				};
				function unwrap(promise, func, value) {
					immediate(function() {
						var returnValue;
						try {
							returnValue = func(value);
						} catch (e) {
							return handlers.reject(promise, e);
						}
						if (returnValue === promise) handlers.reject(promise, new TypeError("Cannot resolve promise with itself"));
else handlers.resolve(promise, returnValue);
					});
				}
				handlers.resolve = function(self$1, value) {
					var result = tryCatch(getThen, value);
					if (result.status === "error") return handlers.reject(self$1, result.value);
					var thenable = result.value;
					if (thenable) safelyResolveThenable(self$1, thenable);
else {
						self$1.state = FULFILLED;
						self$1.outcome = value;
						var i = -1;
						var len = self$1.queue.length;
						while (++i < len) self$1.queue[i].callFulfilled(value);
					}
					return self$1;
				};
				handlers.reject = function(self$1, error) {
					self$1.state = REJECTED;
					self$1.outcome = error;
					var i = -1;
					var len = self$1.queue.length;
					while (++i < len) self$1.queue[i].callRejected(error);
					return self$1;
				};
				function getThen(obj) {
					var then = obj && obj.then;
					if (obj && (typeof obj === "object" || typeof obj === "function") && typeof then === "function") return function appyThen() {
						then.apply(obj, arguments);
					};
				}
				function safelyResolveThenable(self$1, thenable) {
					var called = false;
					function onError(value) {
						if (called) return;
						called = true;
						handlers.reject(self$1, value);
					}
					function onSuccess(value) {
						if (called) return;
						called = true;
						handlers.resolve(self$1, value);
					}
					function tryToUnwrap() {
						thenable(onSuccess, onError);
					}
					var result = tryCatch(tryToUnwrap);
					if (result.status === "error") onError(result.value);
				}
				function tryCatch(func, value) {
					var out = {};
					try {
						out.value = func(value);
						out.status = "success";
					} catch (e) {
						out.status = "error";
						out.value = e;
					}
					return out;
				}
				Promise$1.resolve = resolve;
				function resolve(value) {
					if (value instanceof this) return value;
					return handlers.resolve(new this(INTERNAL), value);
				}
				Promise$1.reject = reject;
				function reject(reason) {
					var promise = new this(INTERNAL);
					return handlers.reject(promise, reason);
				}
				Promise$1.all = all;
				function all(iterable) {
					var self$1 = this;
					if (Object.prototype.toString.call(iterable) !== "[object Array]") return this.reject(new TypeError("must be an array"));
					var len = iterable.length;
					var called = false;
					if (!len) return this.resolve([]);
					var values = new Array(len);
					var resolved = 0;
					var i = -1;
					var promise = new this(INTERNAL);
					while (++i < len) allResolver(iterable[i], i);
					return promise;
					function allResolver(value, i$1) {
						self$1.resolve(value).then(resolveFromAll, function(error) {
							if (!called) {
								called = true;
								handlers.reject(promise, error);
							}
						});
						function resolveFromAll(outValue) {
							values[i$1] = outValue;
							if (++resolved === len && !called) {
								called = true;
								handlers.resolve(promise, values);
							}
						}
					}
				}
				Promise$1.race = race;
				function race(iterable) {
					var self$1 = this;
					if (Object.prototype.toString.call(iterable) !== "[object Array]") return this.reject(new TypeError("must be an array"));
					var len = iterable.length;
					var called = false;
					if (!len) return this.resolve([]);
					var i = -1;
					var promise = new this(INTERNAL);
					while (++i < len) resolver(iterable[i]);
					return promise;
					function resolver(value) {
						self$1.resolve(value).then(function(response) {
							if (!called) {
								called = true;
								handlers.resolve(promise, response);
							}
						}, function(error) {
							if (!called) {
								called = true;
								handlers.reject(promise, error);
							}
						});
					}
				}
			}, { "immediate": 36 }],
			38: [function(require$1, module$1, exports$1) {
				var assign = require$1("./lib/utils/common").assign;
				var deflate = require$1("./lib/deflate");
				var inflate = require$1("./lib/inflate");
				var constants = require$1("./lib/zlib/constants");
				var pako = {};
				assign(pako, deflate, inflate, constants);
				module$1.exports = pako;
			}, {
				"./lib/deflate": 39,
				"./lib/inflate": 40,
				"./lib/utils/common": 41,
				"./lib/zlib/constants": 44
			}],
			39: [function(require$1, module$1, exports$1) {
				var zlib_deflate = require$1("./zlib/deflate");
				var utils = require$1("./utils/common");
				var strings = require$1("./utils/strings");
				var msg = require$1("./zlib/messages");
				var ZStream = require$1("./zlib/zstream");
				var toString = Object.prototype.toString;
				var Z_NO_FLUSH = 0;
				var Z_FINISH = 4;
				var Z_OK = 0;
				var Z_STREAM_END = 1;
				var Z_SYNC_FLUSH = 2;
				var Z_DEFAULT_COMPRESSION = -1;
				var Z_DEFAULT_STRATEGY = 0;
				var Z_DEFLATED = 8;
				/**
				* class Deflate
				*
				* Generic JS-style wrapper for zlib calls. If you don't need
				* streaming behaviour - use more simple functions: [[deflate]],
				* [[deflateRaw]] and [[gzip]].
				**/
				/**
				* Deflate.result -> Uint8Array|Array
				*
				* Compressed result, generated by default [[Deflate#onData]]
				* and [[Deflate#onEnd]] handlers. Filled after you push last chunk
				* (call [[Deflate#push]] with `Z_FINISH` / `true` param)  or if you
				* push a chunk with explicit flush (call [[Deflate#push]] with
				* `Z_SYNC_FLUSH` param).
				**/
				/**
				* Deflate.err -> Number
				*
				* Error code after deflate finished. 0 (Z_OK) on success.
				* You will not need it in real life, because deflate errors
				* are possible only on wrong options or bad `onData` / `onEnd`
				* custom handlers.
				**/
				/**
				* Deflate.msg -> String
				*
				* Error message, if [[Deflate.err]] != 0
				**/
				/**
				* new Deflate(options)
				* - options (Object): zlib deflate options.
				*
				* Creates new deflator instance with specified params. Throws exception
				* on bad params. Supported options:
				*
				* - `level`
				* - `windowBits`
				* - `memLevel`
				* - `strategy`
				* - `dictionary`
				*
				* [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
				* for more information on these.
				*
				* Additional options, for internal needs:
				*
				* - `chunkSize` - size of generated data chunks (16K by default)
				* - `raw` (Boolean) - do raw deflate
				* - `gzip` (Boolean) - create gzip wrapper
				* - `to` (String) - if equal to 'string', then result will be "binary string"
				*    (each char code [0..255])
				* - `header` (Object) - custom header for gzip
				*   - `text` (Boolean) - true if compressed data believed to be text
				*   - `time` (Number) - modification time, unix timestamp
				*   - `os` (Number) - operation system code
				*   - `extra` (Array) - array of bytes with extra data (max 65536)
				*   - `name` (String) - file name (binary string)
				*   - `comment` (String) - comment (binary string)
				*   - `hcrc` (Boolean) - true if header crc should be added
				*
				* ##### Example:
				*
				* ```javascript
				* var pako = require('pako')
				*   , chunk1 = Uint8Array([1,2,3,4,5,6,7,8,9])
				*   , chunk2 = Uint8Array([10,11,12,13,14,15,16,17,18,19]);
				*
				* var deflate = new pako.Deflate({ level: 3});
				*
				* deflate.push(chunk1, false);
				* deflate.push(chunk2, true);  // true -> last chunk
				*
				* if (deflate.err) { throw new Error(deflate.err); }
				*
				* console.log(deflate.result);
				* ```
				**/
				function Deflate(options) {
					if (!(this instanceof Deflate)) return new Deflate(options);
					this.options = utils.assign({
						level: Z_DEFAULT_COMPRESSION,
						method: Z_DEFLATED,
						chunkSize: 16384,
						windowBits: 15,
						memLevel: 8,
						strategy: Z_DEFAULT_STRATEGY,
						to: ""
					}, options || {});
					var opt = this.options;
					if (opt.raw && opt.windowBits > 0) opt.windowBits = -opt.windowBits;
else if (opt.gzip && opt.windowBits > 0 && opt.windowBits < 16) opt.windowBits += 16;
					this.err = 0;
					this.msg = "";
					this.ended = false;
					this.chunks = [];
					this.strm = new ZStream();
					this.strm.avail_out = 0;
					var status = zlib_deflate.deflateInit2(this.strm, opt.level, opt.method, opt.windowBits, opt.memLevel, opt.strategy);
					if (status !== Z_OK) throw new Error(msg[status]);
					if (opt.header) zlib_deflate.deflateSetHeader(this.strm, opt.header);
					if (opt.dictionary) {
						var dict;
						if (typeof opt.dictionary === "string") dict = strings.string2buf(opt.dictionary);
else if (toString.call(opt.dictionary) === "[object ArrayBuffer]") dict = new Uint8Array(opt.dictionary);
else dict = opt.dictionary;
						status = zlib_deflate.deflateSetDictionary(this.strm, dict);
						if (status !== Z_OK) throw new Error(msg[status]);
						this._dict_set = true;
					}
				}
				/**
				* Deflate#push(data[, mode]) -> Boolean
				* - data (Uint8Array|Array|ArrayBuffer|String): input data. Strings will be
				*   converted to utf8 byte sequence.
				* - mode (Number|Boolean): 0..6 for corresponding Z_NO_FLUSH..Z_TREE modes.
				*   See constants. Skipped or `false` means Z_NO_FLUSH, `true` meansh Z_FINISH.
				*
				* Sends input data to deflate pipe, generating [[Deflate#onData]] calls with
				* new compressed chunks. Returns `true` on success. The last data block must have
				* mode Z_FINISH (or `true`). That will flush internal pending buffers and call
				* [[Deflate#onEnd]]. For interim explicit flushes (without ending the stream) you
				* can use mode Z_SYNC_FLUSH, keeping the compression context.
				*
				* On fail call [[Deflate#onEnd]] with error code and return false.
				*
				* We strongly recommend to use `Uint8Array` on input for best speed (output
				* array format is detected automatically). Also, don't skip last param and always
				* use the same type in your code (boolean or number). That will improve JS speed.
				*
				* For regular `Array`-s make sure all elements are [0..255].
				*
				* ##### Example
				*
				* ```javascript
				* push(chunk, false); // push one of data chunks
				* ...
				* push(chunk, true);  // push last chunk
				* ```
				**/
				Deflate.prototype.push = function(data, mode) {
					var strm = this.strm;
					var chunkSize = this.options.chunkSize;
					var status, _mode;
					if (this.ended) return false;
					_mode = mode === ~~mode ? mode : mode === true ? Z_FINISH : Z_NO_FLUSH;
					if (typeof data === "string") strm.input = strings.string2buf(data);
else if (toString.call(data) === "[object ArrayBuffer]") strm.input = new Uint8Array(data);
else strm.input = data;
					strm.next_in = 0;
					strm.avail_in = strm.input.length;
					do {
						if (strm.avail_out === 0) {
							strm.output = new utils.Buf8(chunkSize);
							strm.next_out = 0;
							strm.avail_out = chunkSize;
						}
						status = zlib_deflate.deflate(strm, _mode);
						if (status !== Z_STREAM_END && status !== Z_OK) {
							this.onEnd(status);
							this.ended = true;
							return false;
						}
						if (strm.avail_out === 0 || strm.avail_in === 0 && (_mode === Z_FINISH || _mode === Z_SYNC_FLUSH)) if (this.options.to === "string") this.onData(strings.buf2binstring(utils.shrinkBuf(strm.output, strm.next_out)));
else this.onData(utils.shrinkBuf(strm.output, strm.next_out));
					} while ((strm.avail_in > 0 || strm.avail_out === 0) && status !== Z_STREAM_END);
					if (_mode === Z_FINISH) {
						status = zlib_deflate.deflateEnd(this.strm);
						this.onEnd(status);
						this.ended = true;
						return status === Z_OK;
					}
					if (_mode === Z_SYNC_FLUSH) {
						this.onEnd(Z_OK);
						strm.avail_out = 0;
						return true;
					}
					return true;
				};
				/**
				* Deflate#onData(chunk) -> Void
				* - chunk (Uint8Array|Array|String): ouput data. Type of array depends
				*   on js engine support. When string output requested, each chunk
				*   will be string.
				*
				* By default, stores data blocks in `chunks[]` property and glue
				* those in `onEnd`. Override this handler, if you need another behaviour.
				**/
				Deflate.prototype.onData = function(chunk) {
					this.chunks.push(chunk);
				};
				/**
				* Deflate#onEnd(status) -> Void
				* - status (Number): deflate status. 0 (Z_OK) on success,
				*   other if not.
				*
				* Called once after you tell deflate that the input stream is
				* complete (Z_FINISH) or should be flushed (Z_SYNC_FLUSH)
				* or if an error happened. By default - join collected chunks,
				* free memory and fill `results` / `err` properties.
				**/
				Deflate.prototype.onEnd = function(status) {
					if (status === Z_OK) if (this.options.to === "string") this.result = this.chunks.join("");
else this.result = utils.flattenChunks(this.chunks);
					this.chunks = [];
					this.err = status;
					this.msg = this.strm.msg;
				};
				/**
				* deflate(data[, options]) -> Uint8Array|Array|String
				* - data (Uint8Array|Array|String): input data to compress.
				* - options (Object): zlib deflate options.
				*
				* Compress `data` with deflate algorithm and `options`.
				*
				* Supported options are:
				*
				* - level
				* - windowBits
				* - memLevel
				* - strategy
				* - dictionary
				*
				* [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
				* for more information on these.
				*
				* Sugar (options):
				*
				* - `raw` (Boolean) - say that we work with raw stream, if you don't wish to specify
				*   negative windowBits implicitly.
				* - `to` (String) - if equal to 'string', then result will be "binary string"
				*    (each char code [0..255])
				*
				* ##### Example:
				*
				* ```javascript
				* var pako = require('pako')
				*   , data = Uint8Array([1,2,3,4,5,6,7,8,9]);
				*
				* console.log(pako.deflate(data));
				* ```
				**/
				function deflate(input, options) {
					var deflator = new Deflate(options);
					deflator.push(input, true);
					if (deflator.err) throw deflator.msg || msg[deflator.err];
					return deflator.result;
				}
				/**
				* deflateRaw(data[, options]) -> Uint8Array|Array|String
				* - data (Uint8Array|Array|String): input data to compress.
				* - options (Object): zlib deflate options.
				*
				* The same as [[deflate]], but creates raw data, without wrapper
				* (header and adler32 crc).
				**/
				function deflateRaw(input, options) {
					options = options || {};
					options.raw = true;
					return deflate(input, options);
				}
				/**
				* gzip(data[, options]) -> Uint8Array|Array|String
				* - data (Uint8Array|Array|String): input data to compress.
				* - options (Object): zlib deflate options.
				*
				* The same as [[deflate]], but create gzip wrapper instead of
				* deflate one.
				**/
				function gzip(input, options) {
					options = options || {};
					options.gzip = true;
					return deflate(input, options);
				}
				exports$1.Deflate = Deflate;
				exports$1.deflate = deflate;
				exports$1.deflateRaw = deflateRaw;
				exports$1.gzip = gzip;
			}, {
				"./utils/common": 41,
				"./utils/strings": 42,
				"./zlib/deflate": 46,
				"./zlib/messages": 51,
				"./zlib/zstream": 53
			}],
			40: [function(require$1, module$1, exports$1) {
				var zlib_inflate = require$1("./zlib/inflate");
				var utils = require$1("./utils/common");
				var strings = require$1("./utils/strings");
				var c = require$1("./zlib/constants");
				var msg = require$1("./zlib/messages");
				var ZStream = require$1("./zlib/zstream");
				var GZheader = require$1("./zlib/gzheader");
				var toString = Object.prototype.toString;
				/**
				* class Inflate
				*
				* Generic JS-style wrapper for zlib calls. If you don't need
				* streaming behaviour - use more simple functions: [[inflate]]
				* and [[inflateRaw]].
				**/
				/**
				* Inflate.result -> Uint8Array|Array|String
				*
				* Uncompressed result, generated by default [[Inflate#onData]]
				* and [[Inflate#onEnd]] handlers. Filled after you push last chunk
				* (call [[Inflate#push]] with `Z_FINISH` / `true` param) or if you
				* push a chunk with explicit flush (call [[Inflate#push]] with
				* `Z_SYNC_FLUSH` param).
				**/
				/**
				* Inflate.err -> Number
				*
				* Error code after inflate finished. 0 (Z_OK) on success.
				* Should be checked if broken data possible.
				**/
				/**
				* Inflate.msg -> String
				*
				* Error message, if [[Inflate.err]] != 0
				**/
				/**
				* new Inflate(options)
				* - options (Object): zlib inflate options.
				*
				* Creates new inflator instance with specified params. Throws exception
				* on bad params. Supported options:
				*
				* - `windowBits`
				* - `dictionary`
				*
				* [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
				* for more information on these.
				*
				* Additional options, for internal needs:
				*
				* - `chunkSize` - size of generated data chunks (16K by default)
				* - `raw` (Boolean) - do raw inflate
				* - `to` (String) - if equal to 'string', then result will be converted
				*   from utf8 to utf16 (javascript) string. When string output requested,
				*   chunk length can differ from `chunkSize`, depending on content.
				*
				* By default, when no options set, autodetect deflate/gzip data format via
				* wrapper header.
				*
				* ##### Example:
				*
				* ```javascript
				* var pako = require('pako')
				*   , chunk1 = Uint8Array([1,2,3,4,5,6,7,8,9])
				*   , chunk2 = Uint8Array([10,11,12,13,14,15,16,17,18,19]);
				*
				* var inflate = new pako.Inflate({ level: 3});
				*
				* inflate.push(chunk1, false);
				* inflate.push(chunk2, true);  // true -> last chunk
				*
				* if (inflate.err) { throw new Error(inflate.err); }
				*
				* console.log(inflate.result);
				* ```
				**/
				function Inflate(options) {
					if (!(this instanceof Inflate)) return new Inflate(options);
					this.options = utils.assign({
						chunkSize: 16384,
						windowBits: 0,
						to: ""
					}, options || {});
					var opt = this.options;
					if (opt.raw && opt.windowBits >= 0 && opt.windowBits < 16) {
						opt.windowBits = -opt.windowBits;
						if (opt.windowBits === 0) opt.windowBits = -15;
					}
					if (opt.windowBits >= 0 && opt.windowBits < 16 && !(options && options.windowBits)) opt.windowBits += 32;
					if (opt.windowBits > 15 && opt.windowBits < 48) {
						if ((opt.windowBits & 15) === 0) opt.windowBits |= 15;
					}
					this.err = 0;
					this.msg = "";
					this.ended = false;
					this.chunks = [];
					this.strm = new ZStream();
					this.strm.avail_out = 0;
					var status = zlib_inflate.inflateInit2(this.strm, opt.windowBits);
					if (status !== c.Z_OK) throw new Error(msg[status]);
					this.header = new GZheader();
					zlib_inflate.inflateGetHeader(this.strm, this.header);
				}
				/**
				* Inflate#push(data[, mode]) -> Boolean
				* - data (Uint8Array|Array|ArrayBuffer|String): input data
				* - mode (Number|Boolean): 0..6 for corresponding Z_NO_FLUSH..Z_TREE modes.
				*   See constants. Skipped or `false` means Z_NO_FLUSH, `true` meansh Z_FINISH.
				*
				* Sends input data to inflate pipe, generating [[Inflate#onData]] calls with
				* new output chunks. Returns `true` on success. The last data block must have
				* mode Z_FINISH (or `true`). That will flush internal pending buffers and call
				* [[Inflate#onEnd]]. For interim explicit flushes (without ending the stream) you
				* can use mode Z_SYNC_FLUSH, keeping the decompression context.
				*
				* On fail call [[Inflate#onEnd]] with error code and return false.
				*
				* We strongly recommend to use `Uint8Array` on input for best speed (output
				* format is detected automatically). Also, don't skip last param and always
				* use the same type in your code (boolean or number). That will improve JS speed.
				*
				* For regular `Array`-s make sure all elements are [0..255].
				*
				* ##### Example
				*
				* ```javascript
				* push(chunk, false); // push one of data chunks
				* ...
				* push(chunk, true);  // push last chunk
				* ```
				**/
				Inflate.prototype.push = function(data, mode) {
					var strm = this.strm;
					var chunkSize = this.options.chunkSize;
					var dictionary = this.options.dictionary;
					var status, _mode;
					var next_out_utf8, tail, utf8str;
					var dict;
					var allowBufError = false;
					if (this.ended) return false;
					_mode = mode === ~~mode ? mode : mode === true ? c.Z_FINISH : c.Z_NO_FLUSH;
					if (typeof data === "string") strm.input = strings.binstring2buf(data);
else if (toString.call(data) === "[object ArrayBuffer]") strm.input = new Uint8Array(data);
else strm.input = data;
					strm.next_in = 0;
					strm.avail_in = strm.input.length;
					do {
						if (strm.avail_out === 0) {
							strm.output = new utils.Buf8(chunkSize);
							strm.next_out = 0;
							strm.avail_out = chunkSize;
						}
						status = zlib_inflate.inflate(strm, c.Z_NO_FLUSH);
						if (status === c.Z_NEED_DICT && dictionary) {
							if (typeof dictionary === "string") dict = strings.string2buf(dictionary);
else if (toString.call(dictionary) === "[object ArrayBuffer]") dict = new Uint8Array(dictionary);
else dict = dictionary;
							status = zlib_inflate.inflateSetDictionary(this.strm, dict);
						}
						if (status === c.Z_BUF_ERROR && allowBufError === true) {
							status = c.Z_OK;
							allowBufError = false;
						}
						if (status !== c.Z_STREAM_END && status !== c.Z_OK) {
							this.onEnd(status);
							this.ended = true;
							return false;
						}
						if (strm.next_out) {
							if (strm.avail_out === 0 || status === c.Z_STREAM_END || strm.avail_in === 0 && (_mode === c.Z_FINISH || _mode === c.Z_SYNC_FLUSH)) if (this.options.to === "string") {
								next_out_utf8 = strings.utf8border(strm.output, strm.next_out);
								tail = strm.next_out - next_out_utf8;
								utf8str = strings.buf2string(strm.output, next_out_utf8);
								strm.next_out = tail;
								strm.avail_out = chunkSize - tail;
								if (tail) utils.arraySet(strm.output, strm.output, next_out_utf8, tail, 0);
								this.onData(utf8str);
							} else this.onData(utils.shrinkBuf(strm.output, strm.next_out));
						}
						if (strm.avail_in === 0 && strm.avail_out === 0) allowBufError = true;
					} while ((strm.avail_in > 0 || strm.avail_out === 0) && status !== c.Z_STREAM_END);
					if (status === c.Z_STREAM_END) _mode = c.Z_FINISH;
					if (_mode === c.Z_FINISH) {
						status = zlib_inflate.inflateEnd(this.strm);
						this.onEnd(status);
						this.ended = true;
						return status === c.Z_OK;
					}
					if (_mode === c.Z_SYNC_FLUSH) {
						this.onEnd(c.Z_OK);
						strm.avail_out = 0;
						return true;
					}
					return true;
				};
				/**
				* Inflate#onData(chunk) -> Void
				* - chunk (Uint8Array|Array|String): ouput data. Type of array depends
				*   on js engine support. When string output requested, each chunk
				*   will be string.
				*
				* By default, stores data blocks in `chunks[]` property and glue
				* those in `onEnd`. Override this handler, if you need another behaviour.
				**/
				Inflate.prototype.onData = function(chunk) {
					this.chunks.push(chunk);
				};
				/**
				* Inflate#onEnd(status) -> Void
				* - status (Number): inflate status. 0 (Z_OK) on success,
				*   other if not.
				*
				* Called either after you tell inflate that the input stream is
				* complete (Z_FINISH) or should be flushed (Z_SYNC_FLUSH)
				* or if an error happened. By default - join collected chunks,
				* free memory and fill `results` / `err` properties.
				**/
				Inflate.prototype.onEnd = function(status) {
					if (status === c.Z_OK) if (this.options.to === "string") this.result = this.chunks.join("");
else this.result = utils.flattenChunks(this.chunks);
					this.chunks = [];
					this.err = status;
					this.msg = this.strm.msg;
				};
				/**
				* inflate(data[, options]) -> Uint8Array|Array|String
				* - data (Uint8Array|Array|String): input data to decompress.
				* - options (Object): zlib inflate options.
				*
				* Decompress `data` with inflate/ungzip and `options`. Autodetect
				* format via wrapper header by default. That's why we don't provide
				* separate `ungzip` method.
				*
				* Supported options are:
				*
				* - windowBits
				*
				* [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
				* for more information.
				*
				* Sugar (options):
				*
				* - `raw` (Boolean) - say that we work with raw stream, if you don't wish to specify
				*   negative windowBits implicitly.
				* - `to` (String) - if equal to 'string', then result will be converted
				*   from utf8 to utf16 (javascript) string. When string output requested,
				*   chunk length can differ from `chunkSize`, depending on content.
				*
				*
				* ##### Example:
				*
				* ```javascript
				* var pako = require('pako')
				*   , input = pako.deflate([1,2,3,4,5,6,7,8,9])
				*   , output;
				*
				* try {
				*   output = pako.inflate(input);
				* } catch (err)
				*   console.log(err);
				* }
				* ```
				**/
				function inflate(input, options) {
					var inflator = new Inflate(options);
					inflator.push(input, true);
					if (inflator.err) throw inflator.msg || msg[inflator.err];
					return inflator.result;
				}
				/**
				* inflateRaw(data[, options]) -> Uint8Array|Array|String
				* - data (Uint8Array|Array|String): input data to decompress.
				* - options (Object): zlib inflate options.
				*
				* The same as [[inflate]], but creates raw data, without wrapper
				* (header and adler32 crc).
				**/
				function inflateRaw(input, options) {
					options = options || {};
					options.raw = true;
					return inflate(input, options);
				}
				/**
				* ungzip(data[, options]) -> Uint8Array|Array|String
				* - data (Uint8Array|Array|String): input data to decompress.
				* - options (Object): zlib inflate options.
				*
				* Just shortcut to [[inflate]], because it autodetects format
				* by header.content. Done for convenience.
				**/
				exports$1.Inflate = Inflate;
				exports$1.inflate = inflate;
				exports$1.inflateRaw = inflateRaw;
				exports$1.ungzip = inflate;
			}, {
				"./utils/common": 41,
				"./utils/strings": 42,
				"./zlib/constants": 44,
				"./zlib/gzheader": 47,
				"./zlib/inflate": 49,
				"./zlib/messages": 51,
				"./zlib/zstream": 53
			}],
			41: [function(require$1, module$1, exports$1) {
				var TYPED_OK = typeof Uint8Array !== "undefined" && typeof Uint16Array !== "undefined" && typeof Int32Array !== "undefined";
				exports$1.assign = function(obj) {
					var sources = Array.prototype.slice.call(arguments, 1);
					while (sources.length) {
						var source = sources.shift();
						if (!source) continue;
						if (typeof source !== "object") throw new TypeError(source + "must be non-object");
						for (var p in source) if (source.hasOwnProperty(p)) obj[p] = source[p];
					}
					return obj;
				};
				exports$1.shrinkBuf = function(buf, size) {
					if (buf.length === size) return buf;
					if (buf.subarray) return buf.subarray(0, size);
					buf.length = size;
					return buf;
				};
				var fnTyped = {
					arraySet: function(dest, src, src_offs, len, dest_offs) {
						if (src.subarray && dest.subarray) {
							dest.set(src.subarray(src_offs, src_offs + len), dest_offs);
							return;
						}
						for (var i = 0; i < len; i++) dest[dest_offs + i] = src[src_offs + i];
					},
					flattenChunks: function(chunks) {
						var i, l, len, pos, chunk, result;
						len = 0;
						for (i = 0, l = chunks.length; i < l; i++) len += chunks[i].length;
						result = new Uint8Array(len);
						pos = 0;
						for (i = 0, l = chunks.length; i < l; i++) {
							chunk = chunks[i];
							result.set(chunk, pos);
							pos += chunk.length;
						}
						return result;
					}
				};
				var fnUntyped = {
					arraySet: function(dest, src, src_offs, len, dest_offs) {
						for (var i = 0; i < len; i++) dest[dest_offs + i] = src[src_offs + i];
					},
					flattenChunks: function(chunks) {
						return [].concat.apply([], chunks);
					}
				};
				exports$1.setTyped = function(on) {
					if (on) {
						exports$1.Buf8 = Uint8Array;
						exports$1.Buf16 = Uint16Array;
						exports$1.Buf32 = Int32Array;
						exports$1.assign(exports$1, fnTyped);
					} else {
						exports$1.Buf8 = Array;
						exports$1.Buf16 = Array;
						exports$1.Buf32 = Array;
						exports$1.assign(exports$1, fnUntyped);
					}
				};
				exports$1.setTyped(TYPED_OK);
			}, {}],
			42: [function(require$1, module$1, exports$1) {
				var utils = require$1("./common");
				var STR_APPLY_OK = true;
				var STR_APPLY_UIA_OK = true;
				try {
					String.fromCharCode.apply(null, [0]);
				} catch (__) {
					STR_APPLY_OK = false;
				}
				try {
					String.fromCharCode.apply(null, new Uint8Array(1));
				} catch (__) {
					STR_APPLY_UIA_OK = false;
				}
				var _utf8len = new utils.Buf8(256);
				for (var q = 0; q < 256; q++) _utf8len[q] = q >= 252 ? 6 : q >= 248 ? 5 : q >= 240 ? 4 : q >= 224 ? 3 : q >= 192 ? 2 : 1;
				_utf8len[254] = _utf8len[254] = 1;
				exports$1.string2buf = function(str) {
					var buf, c, c2, m_pos, i, str_len = str.length, buf_len = 0;
					for (m_pos = 0; m_pos < str_len; m_pos++) {
						c = str.charCodeAt(m_pos);
						if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
							c2 = str.charCodeAt(m_pos + 1);
							if ((c2 & 64512) === 56320) {
								c = 65536 + (c - 55296 << 10) + (c2 - 56320);
								m_pos++;
							}
						}
						buf_len += c < 128 ? 1 : c < 2048 ? 2 : c < 65536 ? 3 : 4;
					}
					buf = new utils.Buf8(buf_len);
					for (i = 0, m_pos = 0; i < buf_len; m_pos++) {
						c = str.charCodeAt(m_pos);
						if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
							c2 = str.charCodeAt(m_pos + 1);
							if ((c2 & 64512) === 56320) {
								c = 65536 + (c - 55296 << 10) + (c2 - 56320);
								m_pos++;
							}
						}
						if (c < 128) buf[i++] = c;
else if (c < 2048) {
							buf[i++] = 192 | c >>> 6;
							buf[i++] = 128 | c & 63;
						} else if (c < 65536) {
							buf[i++] = 224 | c >>> 12;
							buf[i++] = 128 | c >>> 6 & 63;
							buf[i++] = 128 | c & 63;
						} else {
							buf[i++] = 240 | c >>> 18;
							buf[i++] = 128 | c >>> 12 & 63;
							buf[i++] = 128 | c >>> 6 & 63;
							buf[i++] = 128 | c & 63;
						}
					}
					return buf;
				};
				function buf2binstring(buf, len) {
					if (len < 65537) {
						if (buf.subarray && STR_APPLY_UIA_OK || !buf.subarray && STR_APPLY_OK) return String.fromCharCode.apply(null, utils.shrinkBuf(buf, len));
					}
					var result = "";
					for (var i = 0; i < len; i++) result += String.fromCharCode(buf[i]);
					return result;
				}
				exports$1.buf2binstring = function(buf) {
					return buf2binstring(buf, buf.length);
				};
				exports$1.binstring2buf = function(str) {
					var buf = new utils.Buf8(str.length);
					for (var i = 0, len = buf.length; i < len; i++) buf[i] = str.charCodeAt(i);
					return buf;
				};
				exports$1.buf2string = function(buf, max) {
					var i, out, c, c_len;
					var len = max || buf.length;
					var utf16buf = new Array(len * 2);
					for (out = 0, i = 0; i < len;) {
						c = buf[i++];
						if (c < 128) {
							utf16buf[out++] = c;
							continue;
						}
						c_len = _utf8len[c];
						if (c_len > 4) {
							utf16buf[out++] = 65533;
							i += c_len - 1;
							continue;
						}
						c &= c_len === 2 ? 31 : c_len === 3 ? 15 : 7;
						while (c_len > 1 && i < len) {
							c = c << 6 | buf[i++] & 63;
							c_len--;
						}
						if (c_len > 1) {
							utf16buf[out++] = 65533;
							continue;
						}
						if (c < 65536) utf16buf[out++] = c;
else {
							c -= 65536;
							utf16buf[out++] = 55296 | c >> 10 & 1023;
							utf16buf[out++] = 56320 | c & 1023;
						}
					}
					return buf2binstring(utf16buf, out);
				};
				exports$1.utf8border = function(buf, max) {
					var pos;
					max = max || buf.length;
					if (max > buf.length) max = buf.length;
					pos = max - 1;
					while (pos >= 0 && (buf[pos] & 192) === 128) pos--;
					if (pos < 0) return max;
					if (pos === 0) return max;
					return pos + _utf8len[buf[pos]] > max ? pos : max;
				};
			}, { "./common": 41 }],
			43: [function(require$1, module$1, exports$1) {
				function adler32(adler, buf, len, pos) {
					var s1 = adler & 65535 | 0, s2 = adler >>> 16 & 65535 | 0, n = 0;
					while (len !== 0) {
						n = len > 2e3 ? 2e3 : len;
						len -= n;
						do {
							s1 = s1 + buf[pos++] | 0;
							s2 = s2 + s1 | 0;
						} while (--n);
						s1 %= 65521;
						s2 %= 65521;
					}
					return s1 | s2 << 16 | 0;
				}
				module$1.exports = adler32;
			}, {}],
			44: [function(require$1, module$1, exports$1) {
				module$1.exports = {
					Z_NO_FLUSH: 0,
					Z_PARTIAL_FLUSH: 1,
					Z_SYNC_FLUSH: 2,
					Z_FULL_FLUSH: 3,
					Z_FINISH: 4,
					Z_BLOCK: 5,
					Z_TREES: 6,
					Z_OK: 0,
					Z_STREAM_END: 1,
					Z_NEED_DICT: 2,
					Z_ERRNO: -1,
					Z_STREAM_ERROR: -2,
					Z_DATA_ERROR: -3,
					Z_BUF_ERROR: -5,
					Z_NO_COMPRESSION: 0,
					Z_BEST_SPEED: 1,
					Z_BEST_COMPRESSION: 9,
					Z_DEFAULT_COMPRESSION: -1,
					Z_FILTERED: 1,
					Z_HUFFMAN_ONLY: 2,
					Z_RLE: 3,
					Z_FIXED: 4,
					Z_DEFAULT_STRATEGY: 0,
					Z_BINARY: 0,
					Z_TEXT: 1,
					Z_UNKNOWN: 2,
					Z_DEFLATED: 8
				};
			}, {}],
			45: [function(require$1, module$1, exports$1) {
				function makeTable() {
					var c, table = [];
					for (var n = 0; n < 256; n++) {
						c = n;
						for (var k = 0; k < 8; k++) c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
						table[n] = c;
					}
					return table;
				}
				var crcTable = makeTable();
				function crc32(crc, buf, len, pos) {
					var t = crcTable, end = pos + len;
					crc ^= -1;
					for (var i = pos; i < end; i++) crc = crc >>> 8 ^ t[(crc ^ buf[i]) & 255];
					return crc ^ -1;
				}
				module$1.exports = crc32;
			}, {}],
			46: [function(require$1, module$1, exports$1) {
				var utils = require$1("../utils/common");
				var trees = require$1("./trees");
				var adler32 = require$1("./adler32");
				var crc32 = require$1("./crc32");
				var msg = require$1("./messages");
				var Z_NO_FLUSH = 0;
				var Z_PARTIAL_FLUSH = 1;
				var Z_FULL_FLUSH = 3;
				var Z_FINISH = 4;
				var Z_BLOCK = 5;
				var Z_OK = 0;
				var Z_STREAM_END = 1;
				var Z_STREAM_ERROR = -2;
				var Z_DATA_ERROR = -3;
				var Z_BUF_ERROR = -5;
				var Z_DEFAULT_COMPRESSION = -1;
				var Z_FILTERED = 1;
				var Z_HUFFMAN_ONLY = 2;
				var Z_RLE = 3;
				var Z_FIXED = 4;
				var Z_DEFAULT_STRATEGY = 0;
				var Z_UNKNOWN = 2;
				var Z_DEFLATED = 8;
				var MAX_MEM_LEVEL = 9;
				var MAX_WBITS = 15;
				var DEF_MEM_LEVEL = 8;
				var LENGTH_CODES = 29;
				var LITERALS = 256;
				var L_CODES = LITERALS + 1 + LENGTH_CODES;
				var D_CODES = 30;
				var BL_CODES = 19;
				var HEAP_SIZE = 2 * L_CODES + 1;
				var MAX_BITS = 15;
				var MIN_MATCH = 3;
				var MAX_MATCH = 258;
				var MIN_LOOKAHEAD = MAX_MATCH + MIN_MATCH + 1;
				var PRESET_DICT = 32;
				var INIT_STATE = 42;
				var EXTRA_STATE = 69;
				var NAME_STATE = 73;
				var COMMENT_STATE = 91;
				var HCRC_STATE = 103;
				var BUSY_STATE = 113;
				var FINISH_STATE = 666;
				var BS_NEED_MORE = 1;
				var BS_BLOCK_DONE = 2;
				var BS_FINISH_STARTED = 3;
				var BS_FINISH_DONE = 4;
				var OS_CODE = 3;
				function err(strm, errorCode) {
					strm.msg = msg[errorCode];
					return errorCode;
				}
				function rank(f) {
					return (f << 1) - (f > 4 ? 9 : 0);
				}
				function zero(buf) {
					var len = buf.length;
					while (--len >= 0) buf[len] = 0;
				}
				function flush_pending(strm) {
					var s = strm.state;
					var len = s.pending;
					if (len > strm.avail_out) len = strm.avail_out;
					if (len === 0) return;
					utils.arraySet(strm.output, s.pending_buf, s.pending_out, len, strm.next_out);
					strm.next_out += len;
					s.pending_out += len;
					strm.total_out += len;
					strm.avail_out -= len;
					s.pending -= len;
					if (s.pending === 0) s.pending_out = 0;
				}
				function flush_block_only(s, last) {
					trees._tr_flush_block(s, s.block_start >= 0 ? s.block_start : -1, s.strstart - s.block_start, last);
					s.block_start = s.strstart;
					flush_pending(s.strm);
				}
				function put_byte(s, b) {
					s.pending_buf[s.pending++] = b;
				}
				function putShortMSB(s, b) {
					s.pending_buf[s.pending++] = b >>> 8 & 255;
					s.pending_buf[s.pending++] = b & 255;
				}
				function read_buf(strm, buf, start, size) {
					var len = strm.avail_in;
					if (len > size) len = size;
					if (len === 0) return 0;
					strm.avail_in -= len;
					utils.arraySet(buf, strm.input, strm.next_in, len, start);
					if (strm.state.wrap === 1) strm.adler = adler32(strm.adler, buf, len, start);
else if (strm.state.wrap === 2) strm.adler = crc32(strm.adler, buf, len, start);
					strm.next_in += len;
					strm.total_in += len;
					return len;
				}
				function longest_match(s, cur_match) {
					var chain_length = s.max_chain_length;
					var scan = s.strstart;
					var match;
					var len;
					var best_len = s.prev_length;
					var nice_match = s.nice_match;
					var limit = s.strstart > s.w_size - MIN_LOOKAHEAD ? s.strstart - (s.w_size - MIN_LOOKAHEAD) : 0;
					var _win = s.window;
					var wmask = s.w_mask;
					var prev = s.prev;
					var strend = s.strstart + MAX_MATCH;
					var scan_end1 = _win[scan + best_len - 1];
					var scan_end = _win[scan + best_len];
					if (s.prev_length >= s.good_match) chain_length >>= 2;
					if (nice_match > s.lookahead) nice_match = s.lookahead;
					do {
						match = cur_match;
						if (_win[match + best_len] !== scan_end || _win[match + best_len - 1] !== scan_end1 || _win[match] !== _win[scan] || _win[++match] !== _win[scan + 1]) continue;
						scan += 2;
						match++;
						do {} while (_win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && scan < strend);
						len = MAX_MATCH - (strend - scan);
						scan = strend - MAX_MATCH;
						if (len > best_len) {
							s.match_start = cur_match;
							best_len = len;
							if (len >= nice_match) break;
							scan_end1 = _win[scan + best_len - 1];
							scan_end = _win[scan + best_len];
						}
					} while ((cur_match = prev[cur_match & wmask]) > limit && --chain_length !== 0);
					if (best_len <= s.lookahead) return best_len;
					return s.lookahead;
				}
				function fill_window(s) {
					var _w_size = s.w_size;
					var p, n, m, more, str;
					do {
						more = s.window_size - s.lookahead - s.strstart;
						if (s.strstart >= _w_size + (_w_size - MIN_LOOKAHEAD)) {
							utils.arraySet(s.window, s.window, _w_size, _w_size, 0);
							s.match_start -= _w_size;
							s.strstart -= _w_size;
							s.block_start -= _w_size;
							n = s.hash_size;
							p = n;
							do {
								m = s.head[--p];
								s.head[p] = m >= _w_size ? m - _w_size : 0;
							} while (--n);
							n = _w_size;
							p = n;
							do {
								m = s.prev[--p];
								s.prev[p] = m >= _w_size ? m - _w_size : 0;
							} while (--n);
							more += _w_size;
						}
						if (s.strm.avail_in === 0) break;
						n = read_buf(s.strm, s.window, s.strstart + s.lookahead, more);
						s.lookahead += n;
						if (s.lookahead + s.insert >= MIN_MATCH) {
							str = s.strstart - s.insert;
							s.ins_h = s.window[str];
							s.ins_h = (s.ins_h << s.hash_shift ^ s.window[str + 1]) & s.hash_mask;
							while (s.insert) {
								s.ins_h = (s.ins_h << s.hash_shift ^ s.window[str + MIN_MATCH - 1]) & s.hash_mask;
								s.prev[str & s.w_mask] = s.head[s.ins_h];
								s.head[s.ins_h] = str;
								str++;
								s.insert--;
								if (s.lookahead + s.insert < MIN_MATCH) break;
							}
						}
					} while (s.lookahead < MIN_LOOKAHEAD && s.strm.avail_in !== 0);
				}
				function deflate_stored(s, flush) {
					var max_block_size = 65535;
					if (max_block_size > s.pending_buf_size - 5) max_block_size = s.pending_buf_size - 5;
					for (;;) {
						if (s.lookahead <= 1) {
							fill_window(s);
							if (s.lookahead === 0 && flush === Z_NO_FLUSH) return BS_NEED_MORE;
							if (s.lookahead === 0) break;
						}
						s.strstart += s.lookahead;
						s.lookahead = 0;
						var max_start = s.block_start + max_block_size;
						if (s.strstart === 0 || s.strstart >= max_start) {
							s.lookahead = s.strstart - max_start;
							s.strstart = max_start;
							/*** FLUSH_BLOCK(s, 0); ***/
							flush_block_only(s, false);
							if (s.strm.avail_out === 0) return BS_NEED_MORE;
						}
						if (s.strstart - s.block_start >= s.w_size - MIN_LOOKAHEAD) {
							/*** FLUSH_BLOCK(s, 0); ***/
							flush_block_only(s, false);
							if (s.strm.avail_out === 0) return BS_NEED_MORE;
						}
					}
					s.insert = 0;
					if (flush === Z_FINISH) {
						/*** FLUSH_BLOCK(s, 1); ***/
						flush_block_only(s, true);
						if (s.strm.avail_out === 0) return BS_FINISH_STARTED;
						return BS_FINISH_DONE;
					}
					if (s.strstart > s.block_start) {
						/*** FLUSH_BLOCK(s, 0); ***/
						flush_block_only(s, false);
						if (s.strm.avail_out === 0) return BS_NEED_MORE;
					}
					return BS_NEED_MORE;
				}
				function deflate_fast(s, flush) {
					var hash_head;
					var bflush;
					for (;;) {
						if (s.lookahead < MIN_LOOKAHEAD) {
							fill_window(s);
							if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) return BS_NEED_MORE;
							if (s.lookahead === 0) break;
						}
						hash_head = 0;
						if (s.lookahead >= MIN_MATCH) {
							/*** INSERT_STRING(s, s.strstart, hash_head); ***/
							s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
							hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
							s.head[s.ins_h] = s.strstart;
						}
						if (hash_head !== 0 && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD) s.match_length = longest_match(s, hash_head);
						if (s.match_length >= MIN_MATCH) {
							/*** _tr_tally_dist(s, s.strstart - s.match_start,
							s.match_length - MIN_MATCH, bflush); ***/
							bflush = trees._tr_tally(s, s.strstart - s.match_start, s.match_length - MIN_MATCH);
							s.lookahead -= s.match_length;
							if (s.match_length <= s.max_lazy_match && s.lookahead >= MIN_MATCH) {
								s.match_length--;
								do {
									s.strstart++;
									/*** INSERT_STRING(s, s.strstart, hash_head); ***/
									s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
									hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
									s.head[s.ins_h] = s.strstart;
								} while (--s.match_length !== 0);
								s.strstart++;
							} else {
								s.strstart += s.match_length;
								s.match_length = 0;
								s.ins_h = s.window[s.strstart];
								s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + 1]) & s.hash_mask;
							}
						} else {
							/*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
							bflush = trees._tr_tally(s, 0, s.window[s.strstart]);
							s.lookahead--;
							s.strstart++;
						}
						if (bflush) {
							/*** FLUSH_BLOCK(s, 0); ***/
							flush_block_only(s, false);
							if (s.strm.avail_out === 0) return BS_NEED_MORE;
						}
					}
					s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
					if (flush === Z_FINISH) {
						/*** FLUSH_BLOCK(s, 1); ***/
						flush_block_only(s, true);
						if (s.strm.avail_out === 0) return BS_FINISH_STARTED;
						return BS_FINISH_DONE;
					}
					if (s.last_lit) {
						/*** FLUSH_BLOCK(s, 0); ***/
						flush_block_only(s, false);
						if (s.strm.avail_out === 0) return BS_NEED_MORE;
					}
					return BS_BLOCK_DONE;
				}
				function deflate_slow(s, flush) {
					var hash_head;
					var bflush;
					var max_insert;
					for (;;) {
						if (s.lookahead < MIN_LOOKAHEAD) {
							fill_window(s);
							if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) return BS_NEED_MORE;
							if (s.lookahead === 0) break;
						}
						hash_head = 0;
						if (s.lookahead >= MIN_MATCH) {
							/*** INSERT_STRING(s, s.strstart, hash_head); ***/
							s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
							hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
							s.head[s.ins_h] = s.strstart;
						}
						s.prev_length = s.match_length;
						s.prev_match = s.match_start;
						s.match_length = MIN_MATCH - 1;
						if (hash_head !== 0 && s.prev_length < s.max_lazy_match && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD) {
							s.match_length = longest_match(s, hash_head);
							if (s.match_length <= 5 && (s.strategy === Z_FILTERED || s.match_length === MIN_MATCH && s.strstart - s.match_start > 4096)) s.match_length = MIN_MATCH - 1;
						}
						if (s.prev_length >= MIN_MATCH && s.match_length <= s.prev_length) {
							max_insert = s.strstart + s.lookahead - MIN_MATCH;
							/***_tr_tally_dist(s, s.strstart - 1 - s.prev_match,
							s.prev_length - MIN_MATCH, bflush);***/
							bflush = trees._tr_tally(s, s.strstart - 1 - s.prev_match, s.prev_length - MIN_MATCH);
							s.lookahead -= s.prev_length - 1;
							s.prev_length -= 2;
							do 
								if (++s.strstart <= max_insert) {
									/*** INSERT_STRING(s, s.strstart, hash_head); ***/
									s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
									hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
									s.head[s.ins_h] = s.strstart;
								}
							while (--s.prev_length !== 0);
							s.match_available = 0;
							s.match_length = MIN_MATCH - 1;
							s.strstart++;
							if (bflush) {
								/*** FLUSH_BLOCK(s, 0); ***/
								flush_block_only(s, false);
								if (s.strm.avail_out === 0) return BS_NEED_MORE;
							}
						} else if (s.match_available) {
							/*** _tr_tally_lit(s, s.window[s.strstart-1], bflush); ***/
							bflush = trees._tr_tally(s, 0, s.window[s.strstart - 1]);
							if (bflush)
 /*** FLUSH_BLOCK_ONLY(s, 0) ***/
							flush_block_only(s, false);
							s.strstart++;
							s.lookahead--;
							if (s.strm.avail_out === 0) return BS_NEED_MORE;
						} else {
							s.match_available = 1;
							s.strstart++;
							s.lookahead--;
						}
					}
					if (s.match_available) {
						/*** _tr_tally_lit(s, s.window[s.strstart-1], bflush); ***/
						bflush = trees._tr_tally(s, 0, s.window[s.strstart - 1]);
						s.match_available = 0;
					}
					s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
					if (flush === Z_FINISH) {
						/*** FLUSH_BLOCK(s, 1); ***/
						flush_block_only(s, true);
						if (s.strm.avail_out === 0) return BS_FINISH_STARTED;
						return BS_FINISH_DONE;
					}
					if (s.last_lit) {
						/*** FLUSH_BLOCK(s, 0); ***/
						flush_block_only(s, false);
						if (s.strm.avail_out === 0) return BS_NEED_MORE;
					}
					return BS_BLOCK_DONE;
				}
				function deflate_rle(s, flush) {
					var bflush;
					var prev;
					var scan, strend;
					var _win = s.window;
					for (;;) {
						if (s.lookahead <= MAX_MATCH) {
							fill_window(s);
							if (s.lookahead <= MAX_MATCH && flush === Z_NO_FLUSH) return BS_NEED_MORE;
							if (s.lookahead === 0) break;
						}
						s.match_length = 0;
						if (s.lookahead >= MIN_MATCH && s.strstart > 0) {
							scan = s.strstart - 1;
							prev = _win[scan];
							if (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan]) {
								strend = s.strstart + MAX_MATCH;
								do {} while (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && scan < strend);
								s.match_length = MAX_MATCH - (strend - scan);
								if (s.match_length > s.lookahead) s.match_length = s.lookahead;
							}
						}
						if (s.match_length >= MIN_MATCH) {
							/*** _tr_tally_dist(s, 1, s.match_length - MIN_MATCH, bflush); ***/
							bflush = trees._tr_tally(s, 1, s.match_length - MIN_MATCH);
							s.lookahead -= s.match_length;
							s.strstart += s.match_length;
							s.match_length = 0;
						} else {
							/*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
							bflush = trees._tr_tally(s, 0, s.window[s.strstart]);
							s.lookahead--;
							s.strstart++;
						}
						if (bflush) {
							/*** FLUSH_BLOCK(s, 0); ***/
							flush_block_only(s, false);
							if (s.strm.avail_out === 0) return BS_NEED_MORE;
						}
					}
					s.insert = 0;
					if (flush === Z_FINISH) {
						/*** FLUSH_BLOCK(s, 1); ***/
						flush_block_only(s, true);
						if (s.strm.avail_out === 0) return BS_FINISH_STARTED;
						return BS_FINISH_DONE;
					}
					if (s.last_lit) {
						/*** FLUSH_BLOCK(s, 0); ***/
						flush_block_only(s, false);
						if (s.strm.avail_out === 0) return BS_NEED_MORE;
					}
					return BS_BLOCK_DONE;
				}
				function deflate_huff(s, flush) {
					var bflush;
					for (;;) {
						if (s.lookahead === 0) {
							fill_window(s);
							if (s.lookahead === 0) {
								if (flush === Z_NO_FLUSH) return BS_NEED_MORE;
								break;
							}
						}
						s.match_length = 0;
						/*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
						bflush = trees._tr_tally(s, 0, s.window[s.strstart]);
						s.lookahead--;
						s.strstart++;
						if (bflush) {
							/*** FLUSH_BLOCK(s, 0); ***/
							flush_block_only(s, false);
							if (s.strm.avail_out === 0) return BS_NEED_MORE;
						}
					}
					s.insert = 0;
					if (flush === Z_FINISH) {
						/*** FLUSH_BLOCK(s, 1); ***/
						flush_block_only(s, true);
						if (s.strm.avail_out === 0) return BS_FINISH_STARTED;
						return BS_FINISH_DONE;
					}
					if (s.last_lit) {
						/*** FLUSH_BLOCK(s, 0); ***/
						flush_block_only(s, false);
						if (s.strm.avail_out === 0) return BS_NEED_MORE;
					}
					return BS_BLOCK_DONE;
				}
				function Config(good_length, max_lazy, nice_length, max_chain, func) {
					this.good_length = good_length;
					this.max_lazy = max_lazy;
					this.nice_length = nice_length;
					this.max_chain = max_chain;
					this.func = func;
				}
				var configuration_table;
				configuration_table = [
					new Config(0, 0, 0, 0, deflate_stored),
					new Config(4, 4, 8, 4, deflate_fast),
					new Config(4, 5, 16, 8, deflate_fast),
					new Config(4, 6, 32, 32, deflate_fast),
					new Config(4, 4, 16, 16, deflate_slow),
					new Config(8, 16, 32, 32, deflate_slow),
					new Config(8, 16, 128, 128, deflate_slow),
					new Config(8, 32, 128, 256, deflate_slow),
					new Config(32, 128, 258, 1024, deflate_slow),
					new Config(32, 258, 258, 4096, deflate_slow)
				];
				function lm_init(s) {
					s.window_size = 2 * s.w_size;
					/*** CLEAR_HASH(s); ***/
					zero(s.head);
					s.max_lazy_match = configuration_table[s.level].max_lazy;
					s.good_match = configuration_table[s.level].good_length;
					s.nice_match = configuration_table[s.level].nice_length;
					s.max_chain_length = configuration_table[s.level].max_chain;
					s.strstart = 0;
					s.block_start = 0;
					s.lookahead = 0;
					s.insert = 0;
					s.match_length = s.prev_length = MIN_MATCH - 1;
					s.match_available = 0;
					s.ins_h = 0;
				}
				function DeflateState() {
					this.strm = null;
					this.status = 0;
					this.pending_buf = null;
					this.pending_buf_size = 0;
					this.pending_out = 0;
					this.pending = 0;
					this.wrap = 0;
					this.gzhead = null;
					this.gzindex = 0;
					this.method = Z_DEFLATED;
					this.last_flush = -1;
					this.w_size = 0;
					this.w_bits = 0;
					this.w_mask = 0;
					this.window = null;
					this.window_size = 0;
					this.prev = null;
					this.head = null;
					this.ins_h = 0;
					this.hash_size = 0;
					this.hash_bits = 0;
					this.hash_mask = 0;
					this.hash_shift = 0;
					this.block_start = 0;
					this.match_length = 0;
					this.prev_match = 0;
					this.match_available = 0;
					this.strstart = 0;
					this.match_start = 0;
					this.lookahead = 0;
					this.prev_length = 0;
					this.max_chain_length = 0;
					this.max_lazy_match = 0;
					this.level = 0;
					this.strategy = 0;
					this.good_match = 0;
					this.nice_match = 0;
					this.dyn_ltree = new utils.Buf16(HEAP_SIZE * 2);
					this.dyn_dtree = new utils.Buf16((2 * D_CODES + 1) * 2);
					this.bl_tree = new utils.Buf16((2 * BL_CODES + 1) * 2);
					zero(this.dyn_ltree);
					zero(this.dyn_dtree);
					zero(this.bl_tree);
					this.l_desc = null;
					this.d_desc = null;
					this.bl_desc = null;
					this.bl_count = new utils.Buf16(MAX_BITS + 1);
					this.heap = new utils.Buf16(2 * L_CODES + 1);
					zero(this.heap);
					this.heap_len = 0;
					this.heap_max = 0;
					this.depth = new utils.Buf16(2 * L_CODES + 1);
					zero(this.depth);
					this.l_buf = 0;
					this.lit_bufsize = 0;
					this.last_lit = 0;
					this.d_buf = 0;
					this.opt_len = 0;
					this.static_len = 0;
					this.matches = 0;
					this.insert = 0;
					this.bi_buf = 0;
					this.bi_valid = 0;
				}
				function deflateResetKeep(strm) {
					var s;
					if (!strm || !strm.state) return err(strm, Z_STREAM_ERROR);
					strm.total_in = strm.total_out = 0;
					strm.data_type = Z_UNKNOWN;
					s = strm.state;
					s.pending = 0;
					s.pending_out = 0;
					if (s.wrap < 0) s.wrap = -s.wrap;
					s.status = s.wrap ? INIT_STATE : BUSY_STATE;
					strm.adler = s.wrap === 2 ? 0 : 1;
					s.last_flush = Z_NO_FLUSH;
					trees._tr_init(s);
					return Z_OK;
				}
				function deflateReset(strm) {
					var ret = deflateResetKeep(strm);
					if (ret === Z_OK) lm_init(strm.state);
					return ret;
				}
				function deflateSetHeader(strm, head) {
					if (!strm || !strm.state) return Z_STREAM_ERROR;
					if (strm.state.wrap !== 2) return Z_STREAM_ERROR;
					strm.state.gzhead = head;
					return Z_OK;
				}
				function deflateInit2(strm, level, method, windowBits, memLevel, strategy) {
					if (!strm) return Z_STREAM_ERROR;
					var wrap = 1;
					if (level === Z_DEFAULT_COMPRESSION) level = 6;
					if (windowBits < 0) {
						wrap = 0;
						windowBits = -windowBits;
					} else if (windowBits > 15) {
						wrap = 2;
						windowBits -= 16;
					}
					if (memLevel < 1 || memLevel > MAX_MEM_LEVEL || method !== Z_DEFLATED || windowBits < 8 || windowBits > 15 || level < 0 || level > 9 || strategy < 0 || strategy > Z_FIXED) return err(strm, Z_STREAM_ERROR);
					if (windowBits === 8) windowBits = 9;
					var s = new DeflateState();
					strm.state = s;
					s.strm = strm;
					s.wrap = wrap;
					s.gzhead = null;
					s.w_bits = windowBits;
					s.w_size = 1 << s.w_bits;
					s.w_mask = s.w_size - 1;
					s.hash_bits = memLevel + 7;
					s.hash_size = 1 << s.hash_bits;
					s.hash_mask = s.hash_size - 1;
					s.hash_shift = ~~((s.hash_bits + MIN_MATCH - 1) / MIN_MATCH);
					s.window = new utils.Buf8(s.w_size * 2);
					s.head = new utils.Buf16(s.hash_size);
					s.prev = new utils.Buf16(s.w_size);
					s.lit_bufsize = 1 << memLevel + 6;
					s.pending_buf_size = s.lit_bufsize * 4;
					s.pending_buf = new utils.Buf8(s.pending_buf_size);
					s.d_buf = 1 * s.lit_bufsize;
					s.l_buf = 3 * s.lit_bufsize;
					s.level = level;
					s.strategy = strategy;
					s.method = method;
					return deflateReset(strm);
				}
				function deflateInit(strm, level) {
					return deflateInit2(strm, level, Z_DEFLATED, MAX_WBITS, DEF_MEM_LEVEL, Z_DEFAULT_STRATEGY);
				}
				function deflate(strm, flush) {
					var old_flush, s;
					var beg, val;
					if (!strm || !strm.state || flush > Z_BLOCK || flush < 0) return strm ? err(strm, Z_STREAM_ERROR) : Z_STREAM_ERROR;
					s = strm.state;
					if (!strm.output || !strm.input && strm.avail_in !== 0 || s.status === FINISH_STATE && flush !== Z_FINISH) return err(strm, strm.avail_out === 0 ? Z_BUF_ERROR : Z_STREAM_ERROR);
					s.strm = strm;
					old_flush = s.last_flush;
					s.last_flush = flush;
					if (s.status === INIT_STATE) if (s.wrap === 2) {
						strm.adler = 0;
						put_byte(s, 31);
						put_byte(s, 139);
						put_byte(s, 8);
						if (!s.gzhead) {
							put_byte(s, 0);
							put_byte(s, 0);
							put_byte(s, 0);
							put_byte(s, 0);
							put_byte(s, 0);
							put_byte(s, s.level === 9 ? 2 : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 4 : 0);
							put_byte(s, OS_CODE);
							s.status = BUSY_STATE;
						} else {
							put_byte(s, (s.gzhead.text ? 1 : 0) + (s.gzhead.hcrc ? 2 : 0) + (!s.gzhead.extra ? 0 : 4) + (!s.gzhead.name ? 0 : 8) + (!s.gzhead.comment ? 0 : 16));
							put_byte(s, s.gzhead.time & 255);
							put_byte(s, s.gzhead.time >> 8 & 255);
							put_byte(s, s.gzhead.time >> 16 & 255);
							put_byte(s, s.gzhead.time >> 24 & 255);
							put_byte(s, s.level === 9 ? 2 : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 4 : 0);
							put_byte(s, s.gzhead.os & 255);
							if (s.gzhead.extra && s.gzhead.extra.length) {
								put_byte(s, s.gzhead.extra.length & 255);
								put_byte(s, s.gzhead.extra.length >> 8 & 255);
							}
							if (s.gzhead.hcrc) strm.adler = crc32(strm.adler, s.pending_buf, s.pending, 0);
							s.gzindex = 0;
							s.status = EXTRA_STATE;
						}
					} else {
						var header = Z_DEFLATED + (s.w_bits - 8 << 4) << 8;
						var level_flags = -1;
						if (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2) level_flags = 0;
else if (s.level < 6) level_flags = 1;
else if (s.level === 6) level_flags = 2;
else level_flags = 3;
						header |= level_flags << 6;
						if (s.strstart !== 0) header |= PRESET_DICT;
						header += 31 - header % 31;
						s.status = BUSY_STATE;
						putShortMSB(s, header);
						if (s.strstart !== 0) {
							putShortMSB(s, strm.adler >>> 16);
							putShortMSB(s, strm.adler & 65535);
						}
						strm.adler = 1;
					}
					if (s.status === EXTRA_STATE) if (s.gzhead.extra) {
						beg = s.pending;
						while (s.gzindex < (s.gzhead.extra.length & 65535)) {
							if (s.pending === s.pending_buf_size) {
								if (s.gzhead.hcrc && s.pending > beg) strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
								flush_pending(strm);
								beg = s.pending;
								if (s.pending === s.pending_buf_size) break;
							}
							put_byte(s, s.gzhead.extra[s.gzindex] & 255);
							s.gzindex++;
						}
						if (s.gzhead.hcrc && s.pending > beg) strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
						if (s.gzindex === s.gzhead.extra.length) {
							s.gzindex = 0;
							s.status = NAME_STATE;
						}
					} else s.status = NAME_STATE;
					if (s.status === NAME_STATE) if (s.gzhead.name) {
						beg = s.pending;
						do {
							if (s.pending === s.pending_buf_size) {
								if (s.gzhead.hcrc && s.pending > beg) strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
								flush_pending(strm);
								beg = s.pending;
								if (s.pending === s.pending_buf_size) {
									val = 1;
									break;
								}
							}
							if (s.gzindex < s.gzhead.name.length) val = s.gzhead.name.charCodeAt(s.gzindex++) & 255;
else val = 0;
							put_byte(s, val);
						} while (val !== 0);
						if (s.gzhead.hcrc && s.pending > beg) strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
						if (val === 0) {
							s.gzindex = 0;
							s.status = COMMENT_STATE;
						}
					} else s.status = COMMENT_STATE;
					if (s.status === COMMENT_STATE) if (s.gzhead.comment) {
						beg = s.pending;
						do {
							if (s.pending === s.pending_buf_size) {
								if (s.gzhead.hcrc && s.pending > beg) strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
								flush_pending(strm);
								beg = s.pending;
								if (s.pending === s.pending_buf_size) {
									val = 1;
									break;
								}
							}
							if (s.gzindex < s.gzhead.comment.length) val = s.gzhead.comment.charCodeAt(s.gzindex++) & 255;
else val = 0;
							put_byte(s, val);
						} while (val !== 0);
						if (s.gzhead.hcrc && s.pending > beg) strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
						if (val === 0) s.status = HCRC_STATE;
					} else s.status = HCRC_STATE;
					if (s.status === HCRC_STATE) if (s.gzhead.hcrc) {
						if (s.pending + 2 > s.pending_buf_size) flush_pending(strm);
						if (s.pending + 2 <= s.pending_buf_size) {
							put_byte(s, strm.adler & 255);
							put_byte(s, strm.adler >> 8 & 255);
							strm.adler = 0;
							s.status = BUSY_STATE;
						}
					} else s.status = BUSY_STATE;
					if (s.pending !== 0) {
						flush_pending(strm);
						if (strm.avail_out === 0) {
							s.last_flush = -1;
							return Z_OK;
						}
					} else if (strm.avail_in === 0 && rank(flush) <= rank(old_flush) && flush !== Z_FINISH) return err(strm, Z_BUF_ERROR);
					if (s.status === FINISH_STATE && strm.avail_in !== 0) return err(strm, Z_BUF_ERROR);
					if (strm.avail_in !== 0 || s.lookahead !== 0 || flush !== Z_NO_FLUSH && s.status !== FINISH_STATE) {
						var bstate = s.strategy === Z_HUFFMAN_ONLY ? deflate_huff(s, flush) : s.strategy === Z_RLE ? deflate_rle(s, flush) : configuration_table[s.level].func(s, flush);
						if (bstate === BS_FINISH_STARTED || bstate === BS_FINISH_DONE) s.status = FINISH_STATE;
						if (bstate === BS_NEED_MORE || bstate === BS_FINISH_STARTED) {
							if (strm.avail_out === 0) s.last_flush = -1;
							return Z_OK;
						}
						if (bstate === BS_BLOCK_DONE) {
							if (flush === Z_PARTIAL_FLUSH) trees._tr_align(s);
else if (flush !== Z_BLOCK) {
								trees._tr_stored_block(s, 0, 0, false);
								if (flush === Z_FULL_FLUSH) {
									/*** CLEAR_HASH(s); ***/ zero(s.head);
									if (s.lookahead === 0) {
										s.strstart = 0;
										s.block_start = 0;
										s.insert = 0;
									}
								}
							}
							flush_pending(strm);
							if (strm.avail_out === 0) {
								s.last_flush = -1;
								return Z_OK;
							}
						}
					}
					if (flush !== Z_FINISH) return Z_OK;
					if (s.wrap <= 0) return Z_STREAM_END;
					if (s.wrap === 2) {
						put_byte(s, strm.adler & 255);
						put_byte(s, strm.adler >> 8 & 255);
						put_byte(s, strm.adler >> 16 & 255);
						put_byte(s, strm.adler >> 24 & 255);
						put_byte(s, strm.total_in & 255);
						put_byte(s, strm.total_in >> 8 & 255);
						put_byte(s, strm.total_in >> 16 & 255);
						put_byte(s, strm.total_in >> 24 & 255);
					} else {
						putShortMSB(s, strm.adler >>> 16);
						putShortMSB(s, strm.adler & 65535);
					}
					flush_pending(strm);
					if (s.wrap > 0) s.wrap = -s.wrap;
					return s.pending !== 0 ? Z_OK : Z_STREAM_END;
				}
				function deflateEnd(strm) {
					var status;
					if (!strm || !strm.state) return Z_STREAM_ERROR;
					status = strm.state.status;
					if (status !== INIT_STATE && status !== EXTRA_STATE && status !== NAME_STATE && status !== COMMENT_STATE && status !== HCRC_STATE && status !== BUSY_STATE && status !== FINISH_STATE) return err(strm, Z_STREAM_ERROR);
					strm.state = null;
					return status === BUSY_STATE ? err(strm, Z_DATA_ERROR) : Z_OK;
				}
				function deflateSetDictionary(strm, dictionary) {
					var dictLength = dictionary.length;
					var s;
					var str, n;
					var wrap;
					var avail;
					var next;
					var input;
					var tmpDict;
					if (!strm || !strm.state) return Z_STREAM_ERROR;
					s = strm.state;
					wrap = s.wrap;
					if (wrap === 2 || wrap === 1 && s.status !== INIT_STATE || s.lookahead) return Z_STREAM_ERROR;
					if (wrap === 1) strm.adler = adler32(strm.adler, dictionary, dictLength, 0);
					s.wrap = 0;
					if (dictLength >= s.w_size) {
						if (wrap === 0) {
							/*** CLEAR_HASH(s); ***/
							zero(s.head);
							s.strstart = 0;
							s.block_start = 0;
							s.insert = 0;
						}
						tmpDict = new utils.Buf8(s.w_size);
						utils.arraySet(tmpDict, dictionary, dictLength - s.w_size, s.w_size, 0);
						dictionary = tmpDict;
						dictLength = s.w_size;
					}
					avail = strm.avail_in;
					next = strm.next_in;
					input = strm.input;
					strm.avail_in = dictLength;
					strm.next_in = 0;
					strm.input = dictionary;
					fill_window(s);
					while (s.lookahead >= MIN_MATCH) {
						str = s.strstart;
						n = s.lookahead - (MIN_MATCH - 1);
						do {
							s.ins_h = (s.ins_h << s.hash_shift ^ s.window[str + MIN_MATCH - 1]) & s.hash_mask;
							s.prev[str & s.w_mask] = s.head[s.ins_h];
							s.head[s.ins_h] = str;
							str++;
						} while (--n);
						s.strstart = str;
						s.lookahead = MIN_MATCH - 1;
						fill_window(s);
					}
					s.strstart += s.lookahead;
					s.block_start = s.strstart;
					s.insert = s.lookahead;
					s.lookahead = 0;
					s.match_length = s.prev_length = MIN_MATCH - 1;
					s.match_available = 0;
					strm.next_in = next;
					strm.input = input;
					strm.avail_in = avail;
					s.wrap = wrap;
					return Z_OK;
				}
				exports$1.deflateInit = deflateInit;
				exports$1.deflateInit2 = deflateInit2;
				exports$1.deflateReset = deflateReset;
				exports$1.deflateResetKeep = deflateResetKeep;
				exports$1.deflateSetHeader = deflateSetHeader;
				exports$1.deflate = deflate;
				exports$1.deflateEnd = deflateEnd;
				exports$1.deflateSetDictionary = deflateSetDictionary;
				exports$1.deflateInfo = "pako deflate (from Nodeca project)";
			}, {
				"../utils/common": 41,
				"./adler32": 43,
				"./crc32": 45,
				"./messages": 51,
				"./trees": 52
			}],
			47: [function(require$1, module$1, exports$1) {
				function GZheader() {
					this.text = 0;
					this.time = 0;
					this.xflags = 0;
					this.os = 0;
					this.extra = null;
					this.extra_len = 0;
					this.name = "";
					this.comment = "";
					this.hcrc = 0;
					this.done = false;
				}
				module$1.exports = GZheader;
			}, {}],
			48: [function(require$1, module$1, exports$1) {
				var BAD = 30;
				var TYPE = 12;
				module$1.exports = function inflate_fast(strm, start) {
					var state;
					var _in;
					var last;
					var _out;
					var beg;
					var end;
					var dmax;
					var wsize;
					var whave;
					var wnext;
					var s_window;
					var hold;
					var bits;
					var lcode;
					var dcode;
					var lmask;
					var dmask;
					var here;
					var op;
					var len;
					var dist;
					var from;
					var from_source;
					var input, output;
					state = strm.state;
					_in = strm.next_in;
					input = strm.input;
					last = _in + (strm.avail_in - 5);
					_out = strm.next_out;
					output = strm.output;
					beg = _out - (start - strm.avail_out);
					end = _out + (strm.avail_out - 257);
					dmax = state.dmax;
					wsize = state.wsize;
					whave = state.whave;
					wnext = state.wnext;
					s_window = state.window;
					hold = state.hold;
					bits = state.bits;
					lcode = state.lencode;
					dcode = state.distcode;
					lmask = (1 << state.lenbits) - 1;
					dmask = (1 << state.distbits) - 1;
					top: do {
						if (bits < 15) {
							hold += input[_in++] << bits;
							bits += 8;
							hold += input[_in++] << bits;
							bits += 8;
						}
						here = lcode[hold & lmask];
						dolen: for (;;) {
							op = here >>> 24;
							hold >>>= op;
							bits -= op;
							op = here >>> 16 & 255;
							if (op === 0) output[_out++] = here & 65535;
else if (op & 16) {
								len = here & 65535;
								op &= 15;
								if (op) {
									if (bits < op) {
										hold += input[_in++] << bits;
										bits += 8;
									}
									len += hold & (1 << op) - 1;
									hold >>>= op;
									bits -= op;
								}
								if (bits < 15) {
									hold += input[_in++] << bits;
									bits += 8;
									hold += input[_in++] << bits;
									bits += 8;
								}
								here = dcode[hold & dmask];
								dodist: for (;;) {
									op = here >>> 24;
									hold >>>= op;
									bits -= op;
									op = here >>> 16 & 255;
									if (op & 16) {
										dist = here & 65535;
										op &= 15;
										if (bits < op) {
											hold += input[_in++] << bits;
											bits += 8;
											if (bits < op) {
												hold += input[_in++] << bits;
												bits += 8;
											}
										}
										dist += hold & (1 << op) - 1;
										if (dist > dmax) {
											strm.msg = "invalid distance too far back";
											state.mode = BAD;
											break top;
										}
										hold >>>= op;
										bits -= op;
										op = _out - beg;
										if (dist > op) {
											op = dist - op;
											if (op > whave) {
												if (state.sane) {
													strm.msg = "invalid distance too far back";
													state.mode = BAD;
													break top;
												}
											}
											from = 0;
											from_source = s_window;
											if (wnext === 0) {
												from += wsize - op;
												if (op < len) {
													len -= op;
													do 
														output[_out++] = s_window[from++];
													while (--op);
													from = _out - dist;
													from_source = output;
												}
											} else if (wnext < op) {
												from += wsize + wnext - op;
												op -= wnext;
												if (op < len) {
													len -= op;
													do 
														output[_out++] = s_window[from++];
													while (--op);
													from = 0;
													if (wnext < len) {
														op = wnext;
														len -= op;
														do 
															output[_out++] = s_window[from++];
														while (--op);
														from = _out - dist;
														from_source = output;
													}
												}
											} else {
												from += wnext - op;
												if (op < len) {
													len -= op;
													do 
														output[_out++] = s_window[from++];
													while (--op);
													from = _out - dist;
													from_source = output;
												}
											}
											while (len > 2) {
												output[_out++] = from_source[from++];
												output[_out++] = from_source[from++];
												output[_out++] = from_source[from++];
												len -= 3;
											}
											if (len) {
												output[_out++] = from_source[from++];
												if (len > 1) output[_out++] = from_source[from++];
											}
										} else {
											from = _out - dist;
											do {
												output[_out++] = output[from++];
												output[_out++] = output[from++];
												output[_out++] = output[from++];
												len -= 3;
											} while (len > 2);
											if (len) {
												output[_out++] = output[from++];
												if (len > 1) output[_out++] = output[from++];
											}
										}
									} else if ((op & 64) === 0) {
										here = dcode[(here & 65535) + (hold & (1 << op) - 1)];
										continue dodist;
									} else {
										strm.msg = "invalid distance code";
										state.mode = BAD;
										break top;
									}
									break;
								}
							} else if ((op & 64) === 0) {
								here = lcode[(here & 65535) + (hold & (1 << op) - 1)];
								continue dolen;
							} else if (op & 32) {
								state.mode = TYPE;
								break top;
							} else {
								strm.msg = "invalid literal/length code";
								state.mode = BAD;
								break top;
							}
							break;
						}
					} while (_in < last && _out < end);
					len = bits >> 3;
					_in -= len;
					bits -= len << 3;
					hold &= (1 << bits) - 1;
					strm.next_in = _in;
					strm.next_out = _out;
					strm.avail_in = _in < last ? 5 + (last - _in) : 5 - (_in - last);
					strm.avail_out = _out < end ? 257 + (end - _out) : 257 - (_out - end);
					state.hold = hold;
					state.bits = bits;
					return;
				};
			}, {}],
			49: [function(require$1, module$1, exports$1) {
				var utils = require$1("../utils/common");
				var adler32 = require$1("./adler32");
				var crc32 = require$1("./crc32");
				var inflate_fast = require$1("./inffast");
				var inflate_table = require$1("./inftrees");
				var CODES = 0;
				var LENS = 1;
				var DISTS = 2;
				var Z_FINISH = 4;
				var Z_BLOCK = 5;
				var Z_TREES = 6;
				var Z_OK = 0;
				var Z_STREAM_END = 1;
				var Z_NEED_DICT = 2;
				var Z_STREAM_ERROR = -2;
				var Z_DATA_ERROR = -3;
				var Z_MEM_ERROR = -4;
				var Z_BUF_ERROR = -5;
				var Z_DEFLATED = 8;
				var HEAD = 1;
				var FLAGS = 2;
				var TIME = 3;
				var OS = 4;
				var EXLEN = 5;
				var EXTRA = 6;
				var NAME = 7;
				var COMMENT = 8;
				var HCRC = 9;
				var DICTID = 10;
				var DICT = 11;
				var TYPE = 12;
				var TYPEDO = 13;
				var STORED = 14;
				var COPY_ = 15;
				var COPY = 16;
				var TABLE = 17;
				var LENLENS = 18;
				var CODELENS = 19;
				var LEN_ = 20;
				var LEN = 21;
				var LENEXT = 22;
				var DIST = 23;
				var DISTEXT = 24;
				var MATCH = 25;
				var LIT = 26;
				var CHECK = 27;
				var LENGTH = 28;
				var DONE = 29;
				var BAD = 30;
				var MEM = 31;
				var SYNC = 32;
				var ENOUGH_LENS = 852;
				var ENOUGH_DISTS = 592;
				var MAX_WBITS = 15;
				var DEF_WBITS = MAX_WBITS;
				function zswap32(q) {
					return (q >>> 24 & 255) + (q >>> 8 & 65280) + ((q & 65280) << 8) + ((q & 255) << 24);
				}
				function InflateState() {
					this.mode = 0;
					this.last = false;
					this.wrap = 0;
					this.havedict = false;
					this.flags = 0;
					this.dmax = 0;
					this.check = 0;
					this.total = 0;
					this.head = null;
					this.wbits = 0;
					this.wsize = 0;
					this.whave = 0;
					this.wnext = 0;
					this.window = null;
					this.hold = 0;
					this.bits = 0;
					this.length = 0;
					this.offset = 0;
					this.extra = 0;
					this.lencode = null;
					this.distcode = null;
					this.lenbits = 0;
					this.distbits = 0;
					this.ncode = 0;
					this.nlen = 0;
					this.ndist = 0;
					this.have = 0;
					this.next = null;
					this.lens = new utils.Buf16(320);
					this.work = new utils.Buf16(288);
					this.lendyn = null;
					this.distdyn = null;
					this.sane = 0;
					this.back = 0;
					this.was = 0;
				}
				function inflateResetKeep(strm) {
					var state;
					if (!strm || !strm.state) return Z_STREAM_ERROR;
					state = strm.state;
					strm.total_in = strm.total_out = state.total = 0;
					strm.msg = "";
					if (state.wrap) strm.adler = state.wrap & 1;
					state.mode = HEAD;
					state.last = 0;
					state.havedict = 0;
					state.dmax = 32768;
					state.head = null;
					state.hold = 0;
					state.bits = 0;
					state.lencode = state.lendyn = new utils.Buf32(ENOUGH_LENS);
					state.distcode = state.distdyn = new utils.Buf32(ENOUGH_DISTS);
					state.sane = 1;
					state.back = -1;
					return Z_OK;
				}
				function inflateReset(strm) {
					var state;
					if (!strm || !strm.state) return Z_STREAM_ERROR;
					state = strm.state;
					state.wsize = 0;
					state.whave = 0;
					state.wnext = 0;
					return inflateResetKeep(strm);
				}
				function inflateReset2(strm, windowBits) {
					var wrap;
					var state;
					if (!strm || !strm.state) return Z_STREAM_ERROR;
					state = strm.state;
					if (windowBits < 0) {
						wrap = 0;
						windowBits = -windowBits;
					} else {
						wrap = (windowBits >> 4) + 1;
						if (windowBits < 48) windowBits &= 15;
					}
					if (windowBits && (windowBits < 8 || windowBits > 15)) return Z_STREAM_ERROR;
					if (state.window !== null && state.wbits !== windowBits) state.window = null;
					state.wrap = wrap;
					state.wbits = windowBits;
					return inflateReset(strm);
				}
				function inflateInit2(strm, windowBits) {
					var ret;
					var state;
					if (!strm) return Z_STREAM_ERROR;
					state = new InflateState();
					strm.state = state;
					state.window = null;
					ret = inflateReset2(strm, windowBits);
					if (ret !== Z_OK) strm.state = null;
					return ret;
				}
				function inflateInit(strm) {
					return inflateInit2(strm, DEF_WBITS);
				}
				var virgin = true;
				var lenfix, distfix;
				function fixedtables(state) {
					if (virgin) {
						var sym;
						lenfix = new utils.Buf32(512);
						distfix = new utils.Buf32(32);
						sym = 0;
						while (sym < 144) state.lens[sym++] = 8;
						while (sym < 256) state.lens[sym++] = 9;
						while (sym < 280) state.lens[sym++] = 7;
						while (sym < 288) state.lens[sym++] = 8;
						inflate_table(LENS, state.lens, 0, 288, lenfix, 0, state.work, { bits: 9 });
						sym = 0;
						while (sym < 32) state.lens[sym++] = 5;
						inflate_table(DISTS, state.lens, 0, 32, distfix, 0, state.work, { bits: 5 });
						virgin = false;
					}
					state.lencode = lenfix;
					state.lenbits = 9;
					state.distcode = distfix;
					state.distbits = 5;
				}
				function updatewindow(strm, src, end, copy) {
					var dist;
					var state = strm.state;
					if (state.window === null) {
						state.wsize = 1 << state.wbits;
						state.wnext = 0;
						state.whave = 0;
						state.window = new utils.Buf8(state.wsize);
					}
					if (copy >= state.wsize) {
						utils.arraySet(state.window, src, end - state.wsize, state.wsize, 0);
						state.wnext = 0;
						state.whave = state.wsize;
					} else {
						dist = state.wsize - state.wnext;
						if (dist > copy) dist = copy;
						utils.arraySet(state.window, src, end - copy, dist, state.wnext);
						copy -= dist;
						if (copy) {
							utils.arraySet(state.window, src, end - copy, copy, 0);
							state.wnext = copy;
							state.whave = state.wsize;
						} else {
							state.wnext += dist;
							if (state.wnext === state.wsize) state.wnext = 0;
							if (state.whave < state.wsize) state.whave += dist;
						}
					}
					return 0;
				}
				function inflate(strm, flush) {
					var state;
					var input, output;
					var next;
					var put;
					var have, left;
					var hold;
					var bits;
					var _in, _out;
					var copy;
					var from;
					var from_source;
					var here = 0;
					var here_bits, here_op, here_val;
					var last_bits, last_op, last_val;
					var len;
					var ret;
					var hbuf = new utils.Buf8(4);
					var opts;
					var n;
					var order = [
						16,
						17,
						18,
						0,
						8,
						7,
						9,
						6,
						10,
						5,
						11,
						4,
						12,
						3,
						13,
						2,
						14,
						1,
						15
					];
					if (!strm || !strm.state || !strm.output || !strm.input && strm.avail_in !== 0) return Z_STREAM_ERROR;
					state = strm.state;
					if (state.mode === TYPE) state.mode = TYPEDO;
					put = strm.next_out;
					output = strm.output;
					left = strm.avail_out;
					next = strm.next_in;
					input = strm.input;
					have = strm.avail_in;
					hold = state.hold;
					bits = state.bits;
					_in = have;
					_out = left;
					ret = Z_OK;
					inf_leave: for (;;) switch (state.mode) {
						case HEAD:
							if (state.wrap === 0) {
								state.mode = TYPEDO;
								break;
							}
							while (bits < 16) {
								if (have === 0) break inf_leave;
								have--;
								hold += input[next++] << bits;
								bits += 8;
							}
							if (state.wrap & 2 && hold === 35615) {
								state.check = 0;
								hbuf[0] = hold & 255;
								hbuf[1] = hold >>> 8 & 255;
								state.check = crc32(state.check, hbuf, 2, 0);
								hold = 0;
								bits = 0;
								state.mode = FLAGS;
								break;
							}
							state.flags = 0;
							if (state.head) state.head.done = false;
							if (!(state.wrap & 1) || (((hold & 255) << 8) + (hold >> 8)) % 31) {
								strm.msg = "incorrect header check";
								state.mode = BAD;
								break;
							}
							if ((hold & 15) !== Z_DEFLATED) {
								strm.msg = "unknown compression method";
								state.mode = BAD;
								break;
							}
							hold >>>= 4;
							bits -= 4;
							len = (hold & 15) + 8;
							if (state.wbits === 0) state.wbits = len;
else if (len > state.wbits) {
								strm.msg = "invalid window size";
								state.mode = BAD;
								break;
							}
							state.dmax = 1 << len;
							strm.adler = state.check = 1;
							state.mode = hold & 512 ? DICTID : TYPE;
							hold = 0;
							bits = 0;
							break;
						case FLAGS:
							while (bits < 16) {
								if (have === 0) break inf_leave;
								have--;
								hold += input[next++] << bits;
								bits += 8;
							}
							state.flags = hold;
							if ((state.flags & 255) !== Z_DEFLATED) {
								strm.msg = "unknown compression method";
								state.mode = BAD;
								break;
							}
							if (state.flags & 57344) {
								strm.msg = "unknown header flags set";
								state.mode = BAD;
								break;
							}
							if (state.head) state.head.text = hold >> 8 & 1;
							if (state.flags & 512) {
								hbuf[0] = hold & 255;
								hbuf[1] = hold >>> 8 & 255;
								state.check = crc32(state.check, hbuf, 2, 0);
							}
							hold = 0;
							bits = 0;
							state.mode = TIME;
						case TIME:
							while (bits < 32) {
								if (have === 0) break inf_leave;
								have--;
								hold += input[next++] << bits;
								bits += 8;
							}
							if (state.head) state.head.time = hold;
							if (state.flags & 512) {
								hbuf[0] = hold & 255;
								hbuf[1] = hold >>> 8 & 255;
								hbuf[2] = hold >>> 16 & 255;
								hbuf[3] = hold >>> 24 & 255;
								state.check = crc32(state.check, hbuf, 4, 0);
							}
							hold = 0;
							bits = 0;
							state.mode = OS;
						case OS:
							while (bits < 16) {
								if (have === 0) break inf_leave;
								have--;
								hold += input[next++] << bits;
								bits += 8;
							}
							if (state.head) {
								state.head.xflags = hold & 255;
								state.head.os = hold >> 8;
							}
							if (state.flags & 512) {
								hbuf[0] = hold & 255;
								hbuf[1] = hold >>> 8 & 255;
								state.check = crc32(state.check, hbuf, 2, 0);
							}
							hold = 0;
							bits = 0;
							state.mode = EXLEN;
						case EXLEN:
							if (state.flags & 1024) {
								while (bits < 16) {
									if (have === 0) break inf_leave;
									have--;
									hold += input[next++] << bits;
									bits += 8;
								}
								state.length = hold;
								if (state.head) state.head.extra_len = hold;
								if (state.flags & 512) {
									hbuf[0] = hold & 255;
									hbuf[1] = hold >>> 8 & 255;
									state.check = crc32(state.check, hbuf, 2, 0);
								}
								hold = 0;
								bits = 0;
							} else if (state.head) state.head.extra = null;
							state.mode = EXTRA;
						case EXTRA:
							if (state.flags & 1024) {
								copy = state.length;
								if (copy > have) copy = have;
								if (copy) {
									if (state.head) {
										len = state.head.extra_len - state.length;
										if (!state.head.extra) state.head.extra = new Array(state.head.extra_len);
										utils.arraySet(
											state.head.extra,
											input,
											next,
											// extra field is limited to 65536 bytes
											// - no need for additional size check
											copy,
											/*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/
											len
);
									}
									if (state.flags & 512) state.check = crc32(state.check, input, copy, next);
									have -= copy;
									next += copy;
									state.length -= copy;
								}
								if (state.length) break inf_leave;
							}
							state.length = 0;
							state.mode = NAME;
						case NAME:
							if (state.flags & 2048) {
								if (have === 0) break inf_leave;
								copy = 0;
								do {
									len = input[next + copy++];
									if (state.head && len && state.length < 65536) state.head.name += String.fromCharCode(len);
								} while (len && copy < have);
								if (state.flags & 512) state.check = crc32(state.check, input, copy, next);
								have -= copy;
								next += copy;
								if (len) break inf_leave;
							} else if (state.head) state.head.name = null;
							state.length = 0;
							state.mode = COMMENT;
						case COMMENT:
							if (state.flags & 4096) {
								if (have === 0) break inf_leave;
								copy = 0;
								do {
									len = input[next + copy++];
									if (state.head && len && state.length < 65536) state.head.comment += String.fromCharCode(len);
								} while (len && copy < have);
								if (state.flags & 512) state.check = crc32(state.check, input, copy, next);
								have -= copy;
								next += copy;
								if (len) break inf_leave;
							} else if (state.head) state.head.comment = null;
							state.mode = HCRC;
						case HCRC:
							if (state.flags & 512) {
								while (bits < 16) {
									if (have === 0) break inf_leave;
									have--;
									hold += input[next++] << bits;
									bits += 8;
								}
								if (hold !== (state.check & 65535)) {
									strm.msg = "header crc mismatch";
									state.mode = BAD;
									break;
								}
								hold = 0;
								bits = 0;
							}
							if (state.head) {
								state.head.hcrc = state.flags >> 9 & 1;
								state.head.done = true;
							}
							strm.adler = state.check = 0;
							state.mode = TYPE;
							break;
						case DICTID:
							while (bits < 32) {
								if (have === 0) break inf_leave;
								have--;
								hold += input[next++] << bits;
								bits += 8;
							}
							strm.adler = state.check = zswap32(hold);
							hold = 0;
							bits = 0;
							state.mode = DICT;
						case DICT:
							if (state.havedict === 0) {
								strm.next_out = put;
								strm.avail_out = left;
								strm.next_in = next;
								strm.avail_in = have;
								state.hold = hold;
								state.bits = bits;
								return Z_NEED_DICT;
							}
							strm.adler = state.check = 1;
							state.mode = TYPE;
						case TYPE: if (flush === Z_BLOCK || flush === Z_TREES) break inf_leave;
						case TYPEDO:
							if (state.last) {
								hold >>>= bits & 7;
								bits -= bits & 7;
								state.mode = CHECK;
								break;
							}
							while (bits < 3) {
								if (have === 0) break inf_leave;
								have--;
								hold += input[next++] << bits;
								bits += 8;
							}
							state.last = hold & 1;
							hold >>>= 1;
							bits -= 1;
							switch (hold & 3) {
								case 0:
									state.mode = STORED;
									break;
								case 1:
									fixedtables(state);
									state.mode = LEN_;
									if (flush === Z_TREES) {
										hold >>>= 2;
										bits -= 2;
										break inf_leave;
									}
									break;
								case 2:
									state.mode = TABLE;
									break;
								case 3:
									strm.msg = "invalid block type";
									state.mode = BAD;
							}
							hold >>>= 2;
							bits -= 2;
							break;
						case STORED:
							hold >>>= bits & 7;
							bits -= bits & 7;
							while (bits < 32) {
								if (have === 0) break inf_leave;
								have--;
								hold += input[next++] << bits;
								bits += 8;
							}
							if ((hold & 65535) !== (hold >>> 16 ^ 65535)) {
								strm.msg = "invalid stored block lengths";
								state.mode = BAD;
								break;
							}
							state.length = hold & 65535;
							hold = 0;
							bits = 0;
							state.mode = COPY_;
							if (flush === Z_TREES) break inf_leave;
						case COPY_: state.mode = COPY;
						case COPY:
							copy = state.length;
							if (copy) {
								if (copy > have) copy = have;
								if (copy > left) copy = left;
								if (copy === 0) break inf_leave;
								utils.arraySet(output, input, next, copy, put);
								have -= copy;
								next += copy;
								left -= copy;
								put += copy;
								state.length -= copy;
								break;
							}
							state.mode = TYPE;
							break;
						case TABLE:
							while (bits < 14) {
								if (have === 0) break inf_leave;
								have--;
								hold += input[next++] << bits;
								bits += 8;
							}
							state.nlen = (hold & 31) + 257;
							hold >>>= 5;
							bits -= 5;
							state.ndist = (hold & 31) + 1;
							hold >>>= 5;
							bits -= 5;
							state.ncode = (hold & 15) + 4;
							hold >>>= 4;
							bits -= 4;
							if (state.nlen > 286 || state.ndist > 30) {
								strm.msg = "too many length or distance symbols";
								state.mode = BAD;
								break;
							}
							state.have = 0;
							state.mode = LENLENS;
						case LENLENS:
							while (state.have < state.ncode) {
								while (bits < 3) {
									if (have === 0) break inf_leave;
									have--;
									hold += input[next++] << bits;
									bits += 8;
								}
								state.lens[order[state.have++]] = hold & 7;
								hold >>>= 3;
								bits -= 3;
							}
							while (state.have < 19) state.lens[order[state.have++]] = 0;
							state.lencode = state.lendyn;
							state.lenbits = 7;
							opts = { bits: state.lenbits };
							ret = inflate_table(CODES, state.lens, 0, 19, state.lencode, 0, state.work, opts);
							state.lenbits = opts.bits;
							if (ret) {
								strm.msg = "invalid code lengths set";
								state.mode = BAD;
								break;
							}
							state.have = 0;
							state.mode = CODELENS;
						case CODELENS:
							while (state.have < state.nlen + state.ndist) {
								for (;;) {
									here = state.lencode[hold & (1 << state.lenbits) - 1];
									here_bits = here >>> 24;
									here_op = here >>> 16 & 255;
									here_val = here & 65535;
									if (here_bits <= bits) break;
									if (have === 0) break inf_leave;
									have--;
									hold += input[next++] << bits;
									bits += 8;
								}
								if (here_val < 16) {
									hold >>>= here_bits;
									bits -= here_bits;
									state.lens[state.have++] = here_val;
								} else {
									if (here_val === 16) {
										n = here_bits + 2;
										while (bits < n) {
											if (have === 0) break inf_leave;
											have--;
											hold += input[next++] << bits;
											bits += 8;
										}
										hold >>>= here_bits;
										bits -= here_bits;
										if (state.have === 0) {
											strm.msg = "invalid bit length repeat";
											state.mode = BAD;
											break;
										}
										len = state.lens[state.have - 1];
										copy = 3 + (hold & 3);
										hold >>>= 2;
										bits -= 2;
									} else if (here_val === 17) {
										n = here_bits + 3;
										while (bits < n) {
											if (have === 0) break inf_leave;
											have--;
											hold += input[next++] << bits;
											bits += 8;
										}
										hold >>>= here_bits;
										bits -= here_bits;
										len = 0;
										copy = 3 + (hold & 7);
										hold >>>= 3;
										bits -= 3;
									} else {
										n = here_bits + 7;
										while (bits < n) {
											if (have === 0) break inf_leave;
											have--;
											hold += input[next++] << bits;
											bits += 8;
										}
										hold >>>= here_bits;
										bits -= here_bits;
										len = 0;
										copy = 11 + (hold & 127);
										hold >>>= 7;
										bits -= 7;
									}
									if (state.have + copy > state.nlen + state.ndist) {
										strm.msg = "invalid bit length repeat";
										state.mode = BAD;
										break;
									}
									while (copy--) state.lens[state.have++] = len;
								}
							}
							if (state.mode === BAD) break;
							if (state.lens[256] === 0) {
								strm.msg = "invalid code -- missing end-of-block";
								state.mode = BAD;
								break;
							}
							state.lenbits = 9;
							opts = { bits: state.lenbits };
							ret = inflate_table(LENS, state.lens, 0, state.nlen, state.lencode, 0, state.work, opts);
							state.lenbits = opts.bits;
							if (ret) {
								strm.msg = "invalid literal/lengths set";
								state.mode = BAD;
								break;
							}
							state.distbits = 6;
							state.distcode = state.distdyn;
							opts = { bits: state.distbits };
							ret = inflate_table(DISTS, state.lens, state.nlen, state.ndist, state.distcode, 0, state.work, opts);
							state.distbits = opts.bits;
							if (ret) {
								strm.msg = "invalid distances set";
								state.mode = BAD;
								break;
							}
							state.mode = LEN_;
							if (flush === Z_TREES) break inf_leave;
						case LEN_: state.mode = LEN;
						case LEN:
							if (have >= 6 && left >= 258) {
								strm.next_out = put;
								strm.avail_out = left;
								strm.next_in = next;
								strm.avail_in = have;
								state.hold = hold;
								state.bits = bits;
								inflate_fast(strm, _out);
								put = strm.next_out;
								output = strm.output;
								left = strm.avail_out;
								next = strm.next_in;
								input = strm.input;
								have = strm.avail_in;
								hold = state.hold;
								bits = state.bits;
								if (state.mode === TYPE) state.back = -1;
								break;
							}
							state.back = 0;
							for (;;) {
								here = state.lencode[hold & (1 << state.lenbits) - 1];
								here_bits = here >>> 24;
								here_op = here >>> 16 & 255;
								here_val = here & 65535;
								if (here_bits <= bits) break;
								if (have === 0) break inf_leave;
								have--;
								hold += input[next++] << bits;
								bits += 8;
							}
							if (here_op && (here_op & 240) === 0) {
								last_bits = here_bits;
								last_op = here_op;
								last_val = here_val;
								for (;;) {
									here = state.lencode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
									here_bits = here >>> 24;
									here_op = here >>> 16 & 255;
									here_val = here & 65535;
									if (last_bits + here_bits <= bits) break;
									if (have === 0) break inf_leave;
									have--;
									hold += input[next++] << bits;
									bits += 8;
								}
								hold >>>= last_bits;
								bits -= last_bits;
								state.back += last_bits;
							}
							hold >>>= here_bits;
							bits -= here_bits;
							state.back += here_bits;
							state.length = here_val;
							if (here_op === 0) {
								state.mode = LIT;
								break;
							}
							if (here_op & 32) {
								state.back = -1;
								state.mode = TYPE;
								break;
							}
							if (here_op & 64) {
								strm.msg = "invalid literal/length code";
								state.mode = BAD;
								break;
							}
							state.extra = here_op & 15;
							state.mode = LENEXT;
						case LENEXT:
							if (state.extra) {
								n = state.extra;
								while (bits < n) {
									if (have === 0) break inf_leave;
									have--;
									hold += input[next++] << bits;
									bits += 8;
								}
								state.length += hold & (1 << state.extra) - 1;
								hold >>>= state.extra;
								bits -= state.extra;
								state.back += state.extra;
							}
							state.was = state.length;
							state.mode = DIST;
						case DIST:
							for (;;) {
								here = state.distcode[hold & (1 << state.distbits) - 1];
								here_bits = here >>> 24;
								here_op = here >>> 16 & 255;
								here_val = here & 65535;
								if (here_bits <= bits) break;
								if (have === 0) break inf_leave;
								have--;
								hold += input[next++] << bits;
								bits += 8;
							}
							if ((here_op & 240) === 0) {
								last_bits = here_bits;
								last_op = here_op;
								last_val = here_val;
								for (;;) {
									here = state.distcode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
									here_bits = here >>> 24;
									here_op = here >>> 16 & 255;
									here_val = here & 65535;
									if (last_bits + here_bits <= bits) break;
									if (have === 0) break inf_leave;
									have--;
									hold += input[next++] << bits;
									bits += 8;
								}
								hold >>>= last_bits;
								bits -= last_bits;
								state.back += last_bits;
							}
							hold >>>= here_bits;
							bits -= here_bits;
							state.back += here_bits;
							if (here_op & 64) {
								strm.msg = "invalid distance code";
								state.mode = BAD;
								break;
							}
							state.offset = here_val;
							state.extra = here_op & 15;
							state.mode = DISTEXT;
						case DISTEXT:
							if (state.extra) {
								n = state.extra;
								while (bits < n) {
									if (have === 0) break inf_leave;
									have--;
									hold += input[next++] << bits;
									bits += 8;
								}
								state.offset += hold & (1 << state.extra) - 1;
								hold >>>= state.extra;
								bits -= state.extra;
								state.back += state.extra;
							}
							if (state.offset > state.dmax) {
								strm.msg = "invalid distance too far back";
								state.mode = BAD;
								break;
							}
							state.mode = MATCH;
						case MATCH:
							if (left === 0) break inf_leave;
							copy = _out - left;
							if (state.offset > copy) {
								copy = state.offset - copy;
								if (copy > state.whave) {
									if (state.sane) {
										strm.msg = "invalid distance too far back";
										state.mode = BAD;
										break;
									}
								}
								if (copy > state.wnext) {
									copy -= state.wnext;
									from = state.wsize - copy;
								} else from = state.wnext - copy;
								if (copy > state.length) copy = state.length;
								from_source = state.window;
							} else {
								from_source = output;
								from = put - state.offset;
								copy = state.length;
							}
							if (copy > left) copy = left;
							left -= copy;
							state.length -= copy;
							do 
								output[put++] = from_source[from++];
							while (--copy);
							if (state.length === 0) state.mode = LEN;
							break;
						case LIT:
							if (left === 0) break inf_leave;
							output[put++] = state.length;
							left--;
							state.mode = LEN;
							break;
						case CHECK:
							if (state.wrap) {
								while (bits < 32) {
									if (have === 0) break inf_leave;
									have--;
									hold |= input[next++] << bits;
									bits += 8;
								}
								_out -= left;
								strm.total_out += _out;
								state.total += _out;
								if (_out) strm.adler = state.check = state.flags ? crc32(state.check, output, _out, put - _out) : adler32(state.check, output, _out, put - _out);
								_out = left;
								if ((state.flags ? hold : zswap32(hold)) !== state.check) {
									strm.msg = "incorrect data check";
									state.mode = BAD;
									break;
								}
								hold = 0;
								bits = 0;
							}
							state.mode = LENGTH;
						case LENGTH:
							if (state.wrap && state.flags) {
								while (bits < 32) {
									if (have === 0) break inf_leave;
									have--;
									hold += input[next++] << bits;
									bits += 8;
								}
								if (hold !== (state.total & 4294967295)) {
									strm.msg = "incorrect length check";
									state.mode = BAD;
									break;
								}
								hold = 0;
								bits = 0;
							}
							state.mode = DONE;
						case DONE:
							ret = Z_STREAM_END;
							break inf_leave;
						case BAD:
							ret = Z_DATA_ERROR;
							break inf_leave;
						case MEM: return Z_MEM_ERROR;
						case SYNC:
						default: return Z_STREAM_ERROR;
					}
					strm.next_out = put;
					strm.avail_out = left;
					strm.next_in = next;
					strm.avail_in = have;
					state.hold = hold;
					state.bits = bits;
					if (state.wsize || _out !== strm.avail_out && state.mode < BAD && (state.mode < CHECK || flush !== Z_FINISH)) {
						if (updatewindow(strm, strm.output, strm.next_out, _out - strm.avail_out));
					}
					_in -= strm.avail_in;
					_out -= strm.avail_out;
					strm.total_in += _in;
					strm.total_out += _out;
					state.total += _out;
					if (state.wrap && _out) strm.adler = state.check = state.flags ? crc32(state.check, output, _out, strm.next_out - _out) : adler32(state.check, output, _out, strm.next_out - _out);
					strm.data_type = state.bits + (state.last ? 64 : 0) + (state.mode === TYPE ? 128 : 0) + (state.mode === LEN_ || state.mode === COPY_ ? 256 : 0);
					if ((_in === 0 && _out === 0 || flush === Z_FINISH) && ret === Z_OK) ret = Z_BUF_ERROR;
					return ret;
				}
				function inflateEnd(strm) {
					if (!strm || !strm.state) return Z_STREAM_ERROR;
					var state = strm.state;
					if (state.window) state.window = null;
					strm.state = null;
					return Z_OK;
				}
				function inflateGetHeader(strm, head) {
					var state;
					if (!strm || !strm.state) return Z_STREAM_ERROR;
					state = strm.state;
					if ((state.wrap & 2) === 0) return Z_STREAM_ERROR;
					state.head = head;
					head.done = false;
					return Z_OK;
				}
				function inflateSetDictionary(strm, dictionary) {
					var dictLength = dictionary.length;
					var state;
					var dictid;
					var ret;
					if (!strm || !strm.state) return Z_STREAM_ERROR;
					state = strm.state;
					if (state.wrap !== 0 && state.mode !== DICT) return Z_STREAM_ERROR;
					if (state.mode === DICT) {
						dictid = 1;
						dictid = adler32(dictid, dictionary, dictLength, 0);
						if (dictid !== state.check) return Z_DATA_ERROR;
					}
					ret = updatewindow(strm, dictionary, dictLength, dictLength);
					if (ret) {
						state.mode = MEM;
						return Z_MEM_ERROR;
					}
					state.havedict = 1;
					return Z_OK;
				}
				exports$1.inflateReset = inflateReset;
				exports$1.inflateReset2 = inflateReset2;
				exports$1.inflateResetKeep = inflateResetKeep;
				exports$1.inflateInit = inflateInit;
				exports$1.inflateInit2 = inflateInit2;
				exports$1.inflate = inflate;
				exports$1.inflateEnd = inflateEnd;
				exports$1.inflateGetHeader = inflateGetHeader;
				exports$1.inflateSetDictionary = inflateSetDictionary;
				exports$1.inflateInfo = "pako inflate (from Nodeca project)";
			}, {
				"../utils/common": 41,
				"./adler32": 43,
				"./crc32": 45,
				"./inffast": 48,
				"./inftrees": 50
			}],
			50: [function(require$1, module$1, exports$1) {
				var utils = require$1("../utils/common");
				var MAXBITS = 15;
				var ENOUGH_LENS = 852;
				var ENOUGH_DISTS = 592;
				var CODES = 0;
				var LENS = 1;
				var DISTS = 2;
				var lbase = [
					3,
					4,
					5,
					6,
					7,
					8,
					9,
					10,
					11,
					13,
					15,
					17,
					19,
					23,
					27,
					31,
					35,
					43,
					51,
					59,
					67,
					83,
					99,
					115,
					131,
					163,
					195,
					227,
					258,
					0,
					0
				];
				var lext = [
					16,
					16,
					16,
					16,
					16,
					16,
					16,
					16,
					17,
					17,
					17,
					17,
					18,
					18,
					18,
					18,
					19,
					19,
					19,
					19,
					20,
					20,
					20,
					20,
					21,
					21,
					21,
					21,
					16,
					72,
					78
				];
				var dbase = [
					1,
					2,
					3,
					4,
					5,
					7,
					9,
					13,
					17,
					25,
					33,
					49,
					65,
					97,
					129,
					193,
					257,
					385,
					513,
					769,
					1025,
					1537,
					2049,
					3073,
					4097,
					6145,
					8193,
					12289,
					16385,
					24577,
					0,
					0
				];
				var dext = [
					16,
					16,
					16,
					16,
					17,
					17,
					18,
					18,
					19,
					19,
					20,
					20,
					21,
					21,
					22,
					22,
					23,
					23,
					24,
					24,
					25,
					25,
					26,
					26,
					27,
					27,
					28,
					28,
					29,
					29,
					64,
					64
				];
				module$1.exports = function inflate_table(type, lens, lens_index, codes, table, table_index, work, opts) {
					var bits = opts.bits;
					var len = 0;
					var sym = 0;
					var min = 0, max = 0;
					var root = 0;
					var curr = 0;
					var drop = 0;
					var left = 0;
					var used = 0;
					var huff = 0;
					var incr;
					var fill;
					var low;
					var mask;
					var next;
					var base = null;
					var base_index = 0;
					var end;
					var count = new utils.Buf16(MAXBITS + 1);
					var offs = new utils.Buf16(MAXBITS + 1);
					var extra = null;
					var extra_index = 0;
					var here_bits, here_op, here_val;
					for (len = 0; len <= MAXBITS; len++) count[len] = 0;
					for (sym = 0; sym < codes; sym++) count[lens[lens_index + sym]]++;
					root = bits;
					for (max = MAXBITS; max >= 1; max--) if (count[max] !== 0) break;
					if (root > max) root = max;
					if (max === 0) {
						table[table_index++] = 20971520;
						table[table_index++] = 20971520;
						opts.bits = 1;
						return 0;
					}
					for (min = 1; min < max; min++) if (count[min] !== 0) break;
					if (root < min) root = min;
					left = 1;
					for (len = 1; len <= MAXBITS; len++) {
						left <<= 1;
						left -= count[len];
						if (left < 0) return -1;
					}
					if (left > 0 && (type === CODES || max !== 1)) return -1;
					offs[1] = 0;
					for (len = 1; len < MAXBITS; len++) offs[len + 1] = offs[len] + count[len];
					for (sym = 0; sym < codes; sym++) if (lens[lens_index + sym] !== 0) work[offs[lens[lens_index + sym]]++] = sym;
					if (type === CODES) {
						base = extra = work;
						end = 19;
					} else if (type === LENS) {
						base = lbase;
						base_index -= 257;
						extra = lext;
						extra_index -= 257;
						end = 256;
					} else {
						base = dbase;
						extra = dext;
						end = -1;
					}
					huff = 0;
					sym = 0;
					len = min;
					next = table_index;
					curr = root;
					drop = 0;
					low = -1;
					used = 1 << root;
					mask = used - 1;
					if (type === LENS && used > ENOUGH_LENS || type === DISTS && used > ENOUGH_DISTS) return 1;
					for (;;) {
						here_bits = len - drop;
						if (work[sym] < end) {
							here_op = 0;
							here_val = work[sym];
						} else if (work[sym] > end) {
							here_op = extra[extra_index + work[sym]];
							here_val = base[base_index + work[sym]];
						} else {
							here_op = 96;
							here_val = 0;
						}
						incr = 1 << len - drop;
						fill = 1 << curr;
						min = fill;
						do {
							fill -= incr;
							table[next + (huff >> drop) + fill] = here_bits << 24 | here_op << 16 | here_val | 0;
						} while (fill !== 0);
						incr = 1 << len - 1;
						while (huff & incr) incr >>= 1;
						if (incr !== 0) {
							huff &= incr - 1;
							huff += incr;
						} else huff = 0;
						sym++;
						if (--count[len] === 0) {
							if (len === max) break;
							len = lens[lens_index + work[sym]];
						}
						if (len > root && (huff & mask) !== low) {
							if (drop === 0) drop = root;
							next += min;
							curr = len - drop;
							left = 1 << curr;
							while (curr + drop < max) {
								left -= count[curr + drop];
								if (left <= 0) break;
								curr++;
								left <<= 1;
							}
							used += 1 << curr;
							if (type === LENS && used > ENOUGH_LENS || type === DISTS && used > ENOUGH_DISTS) return 1;
							low = huff & mask;
							table[low] = root << 24 | curr << 16 | next - table_index | 0;
						}
					}
					if (huff !== 0) table[next + huff] = len - drop << 24 | 4194304;
					opts.bits = root;
					return 0;
				};
			}, { "../utils/common": 41 }],
			51: [function(require$1, module$1, exports$1) {
				module$1.exports = {
					2: "need dictionary",
					1: "stream end",
					0: "",
					"-1": "file error",
					"-2": "stream error",
					"-3": "data error",
					"-4": "insufficient memory",
					"-5": "buffer error",
					"-6": "incompatible version"
				};
			}, {}],
			52: [function(require$1, module$1, exports$1) {
				var utils = require$1("../utils/common");
				var Z_FIXED = 4;
				var Z_BINARY = 0;
				var Z_TEXT = 1;
				var Z_UNKNOWN = 2;
				function zero(buf) {
					var len = buf.length;
					while (--len >= 0) buf[len] = 0;
				}
				var STORED_BLOCK = 0;
				var STATIC_TREES = 1;
				var DYN_TREES = 2;
				var MIN_MATCH = 3;
				var MAX_MATCH = 258;
				var LENGTH_CODES = 29;
				var LITERALS = 256;
				var L_CODES = LITERALS + 1 + LENGTH_CODES;
				var D_CODES = 30;
				var BL_CODES = 19;
				var HEAP_SIZE = 2 * L_CODES + 1;
				var MAX_BITS = 15;
				var Buf_size = 16;
				var MAX_BL_BITS = 7;
				var END_BLOCK = 256;
				var REP_3_6 = 16;
				var REPZ_3_10 = 17;
				var REPZ_11_138 = 18;
				var extra_lbits = [
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					1,
					1,
					1,
					1,
					2,
					2,
					2,
					2,
					3,
					3,
					3,
					3,
					4,
					4,
					4,
					4,
					5,
					5,
					5,
					5,
					0
				];
				var extra_dbits = [
					0,
					0,
					0,
					0,
					1,
					1,
					2,
					2,
					3,
					3,
					4,
					4,
					5,
					5,
					6,
					6,
					7,
					7,
					8,
					8,
					9,
					9,
					10,
					10,
					11,
					11,
					12,
					12,
					13,
					13
				];
				var extra_blbits = [
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					2,
					3,
					7
				];
				var bl_order = [
					16,
					17,
					18,
					0,
					8,
					7,
					9,
					6,
					10,
					5,
					11,
					4,
					12,
					3,
					13,
					2,
					14,
					1,
					15
				];
				var DIST_CODE_LEN = 512;
				var static_ltree = new Array((L_CODES + 2) * 2);
				zero(static_ltree);
				var static_dtree = new Array(D_CODES * 2);
				zero(static_dtree);
				var _dist_code = new Array(DIST_CODE_LEN);
				zero(_dist_code);
				var _length_code = new Array(MAX_MATCH - MIN_MATCH + 1);
				zero(_length_code);
				var base_length = new Array(LENGTH_CODES);
				zero(base_length);
				var base_dist = new Array(D_CODES);
				zero(base_dist);
				function StaticTreeDesc(static_tree, extra_bits, extra_base, elems, max_length) {
					this.static_tree = static_tree;
					this.extra_bits = extra_bits;
					this.extra_base = extra_base;
					this.elems = elems;
					this.max_length = max_length;
					this.has_stree = static_tree && static_tree.length;
				}
				var static_l_desc;
				var static_d_desc;
				var static_bl_desc;
				function TreeDesc(dyn_tree, stat_desc) {
					this.dyn_tree = dyn_tree;
					this.max_code = 0;
					this.stat_desc = stat_desc;
				}
				function d_code(dist) {
					return dist < 256 ? _dist_code[dist] : _dist_code[256 + (dist >>> 7)];
				}
				function put_short(s, w) {
					s.pending_buf[s.pending++] = w & 255;
					s.pending_buf[s.pending++] = w >>> 8 & 255;
				}
				function send_bits(s, value, length) {
					if (s.bi_valid > Buf_size - length) {
						s.bi_buf |= value << s.bi_valid & 65535;
						put_short(s, s.bi_buf);
						s.bi_buf = value >> Buf_size - s.bi_valid;
						s.bi_valid += length - Buf_size;
					} else {
						s.bi_buf |= value << s.bi_valid & 65535;
						s.bi_valid += length;
					}
				}
				function send_code(s, c, tree) {
					send_bits(
						s,
						tree[c * 2],
						tree[c * 2 + 1]
						/*.Len*/
);
				}
				function bi_reverse(code, len) {
					var res = 0;
					do {
						res |= code & 1;
						code >>>= 1;
						res <<= 1;
					} while (--len > 0);
					return res >>> 1;
				}
				function bi_flush(s) {
					if (s.bi_valid === 16) {
						put_short(s, s.bi_buf);
						s.bi_buf = 0;
						s.bi_valid = 0;
					} else if (s.bi_valid >= 8) {
						s.pending_buf[s.pending++] = s.bi_buf & 255;
						s.bi_buf >>= 8;
						s.bi_valid -= 8;
					}
				}
				function gen_bitlen(s, desc) {
					var tree = desc.dyn_tree;
					var max_code = desc.max_code;
					var stree = desc.stat_desc.static_tree;
					var has_stree = desc.stat_desc.has_stree;
					var extra = desc.stat_desc.extra_bits;
					var base = desc.stat_desc.extra_base;
					var max_length = desc.stat_desc.max_length;
					var h;
					var n, m;
					var bits;
					var xbits;
					var f;
					var overflow = 0;
					for (bits = 0; bits <= MAX_BITS; bits++) s.bl_count[bits] = 0;
					tree[s.heap[s.heap_max] * 2 + 1] = 0;
					for (h = s.heap_max + 1; h < HEAP_SIZE; h++) {
						n = s.heap[h];
						bits = tree[tree[n * 2 + 1] * 2 + 1] + 1;
						if (bits > max_length) {
							bits = max_length;
							overflow++;
						}
						tree[n * 2 + 1] = bits;
						if (n > max_code) continue;
						s.bl_count[bits]++;
						xbits = 0;
						if (n >= base) xbits = extra[n - base];
						f = tree[n * 2];
						s.opt_len += f * (bits + xbits);
						if (has_stree) s.static_len += f * (stree[n * 2 + 1] + xbits);
					}
					if (overflow === 0) return;
					do {
						bits = max_length - 1;
						while (s.bl_count[bits] === 0) bits--;
						s.bl_count[bits]--;
						s.bl_count[bits + 1] += 2;
						s.bl_count[max_length]--;
						overflow -= 2;
					} while (overflow > 0);
					for (bits = max_length; bits !== 0; bits--) {
						n = s.bl_count[bits];
						while (n !== 0) {
							m = s.heap[--h];
							if (m > max_code) continue;
							if (tree[m * 2 + 1] !== bits) {
								s.opt_len += (bits - tree[m * 2 + 1]) * tree[m * 2];
								tree[m * 2 + 1] = bits;
							}
							n--;
						}
					}
				}
				function gen_codes(tree, max_code, bl_count) {
					var next_code = new Array(MAX_BITS + 1);
					var code = 0;
					var bits;
					var n;
					for (bits = 1; bits <= MAX_BITS; bits++) next_code[bits] = code = code + bl_count[bits - 1] << 1;
					for (n = 0; n <= max_code; n++) {
						var len = tree[n * 2 + 1];
						if (len === 0) continue;
						tree[n * 2] = bi_reverse(next_code[len]++, len);
					}
				}
				function tr_static_init() {
					var n;
					var bits;
					var length;
					var code;
					var dist;
					var bl_count = new Array(MAX_BITS + 1);
					length = 0;
					for (code = 0; code < LENGTH_CODES - 1; code++) {
						base_length[code] = length;
						for (n = 0; n < 1 << extra_lbits[code]; n++) _length_code[length++] = code;
					}
					_length_code[length - 1] = code;
					dist = 0;
					for (code = 0; code < 16; code++) {
						base_dist[code] = dist;
						for (n = 0; n < 1 << extra_dbits[code]; n++) _dist_code[dist++] = code;
					}
					dist >>= 7;
					for (; code < D_CODES; code++) {
						base_dist[code] = dist << 7;
						for (n = 0; n < 1 << extra_dbits[code] - 7; n++) _dist_code[256 + dist++] = code;
					}
					for (bits = 0; bits <= MAX_BITS; bits++) bl_count[bits] = 0;
					n = 0;
					while (n <= 143) {
						static_ltree[n * 2 + 1] = 8;
						n++;
						bl_count[8]++;
					}
					while (n <= 255) {
						static_ltree[n * 2 + 1] = 9;
						n++;
						bl_count[9]++;
					}
					while (n <= 279) {
						static_ltree[n * 2 + 1] = 7;
						n++;
						bl_count[7]++;
					}
					while (n <= 287) {
						static_ltree[n * 2 + 1] = 8;
						n++;
						bl_count[8]++;
					}
					gen_codes(static_ltree, L_CODES + 1, bl_count);
					for (n = 0; n < D_CODES; n++) {
						static_dtree[n * 2 + 1] = 5;
						static_dtree[n * 2] = bi_reverse(n, 5);
					}
					static_l_desc = new StaticTreeDesc(static_ltree, extra_lbits, LITERALS + 1, L_CODES, MAX_BITS);
					static_d_desc = new StaticTreeDesc(static_dtree, extra_dbits, 0, D_CODES, MAX_BITS);
					static_bl_desc = new StaticTreeDesc(new Array(0), extra_blbits, 0, BL_CODES, MAX_BL_BITS);
				}
				function init_block(s) {
					var n;
					for (n = 0; n < L_CODES; n++) s.dyn_ltree[n * 2] = 0;
					for (n = 0; n < D_CODES; n++) s.dyn_dtree[n * 2] = 0;
					for (n = 0; n < BL_CODES; n++) s.bl_tree[n * 2] = 0;
					s.dyn_ltree[END_BLOCK * 2] = 1;
					s.opt_len = s.static_len = 0;
					s.last_lit = s.matches = 0;
				}
				function bi_windup(s) {
					if (s.bi_valid > 8) put_short(s, s.bi_buf);
else if (s.bi_valid > 0) s.pending_buf[s.pending++] = s.bi_buf;
					s.bi_buf = 0;
					s.bi_valid = 0;
				}
				function copy_block(s, buf, len, header) {
					bi_windup(s);
					{
						put_short(s, len);
						put_short(s, ~len);
					}
					utils.arraySet(s.pending_buf, s.window, buf, len, s.pending);
					s.pending += len;
				}
				function smaller(tree, n, m, depth) {
					var _n2 = n * 2;
					var _m2 = m * 2;
					return tree[_n2] < tree[_m2] || tree[_n2] === tree[_m2] && depth[n] <= depth[m];
				}
				function pqdownheap(s, tree, k) {
					var v = s.heap[k];
					var j = k << 1;
					while (j <= s.heap_len) {
						if (j < s.heap_len && smaller(tree, s.heap[j + 1], s.heap[j], s.depth)) j++;
						if (smaller(tree, v, s.heap[j], s.depth)) break;
						s.heap[k] = s.heap[j];
						k = j;
						j <<= 1;
					}
					s.heap[k] = v;
				}
				function compress_block(s, ltree, dtree) {
					var dist;
					var lc;
					var lx = 0;
					var code;
					var extra;
					if (s.last_lit !== 0) do {
						dist = s.pending_buf[s.d_buf + lx * 2] << 8 | s.pending_buf[s.d_buf + lx * 2 + 1];
						lc = s.pending_buf[s.l_buf + lx];
						lx++;
						if (dist === 0) send_code(s, lc, ltree);
else {
							code = _length_code[lc];
							send_code(s, code + LITERALS + 1, ltree);
							extra = extra_lbits[code];
							if (extra !== 0) {
								lc -= base_length[code];
								send_bits(s, lc, extra);
							}
							dist--;
							code = d_code(dist);
							send_code(s, code, dtree);
							extra = extra_dbits[code];
							if (extra !== 0) {
								dist -= base_dist[code];
								send_bits(s, dist, extra);
							}
						}
					} while (lx < s.last_lit);
					send_code(s, END_BLOCK, ltree);
				}
				function build_tree(s, desc) {
					var tree = desc.dyn_tree;
					var stree = desc.stat_desc.static_tree;
					var has_stree = desc.stat_desc.has_stree;
					var elems = desc.stat_desc.elems;
					var n, m;
					var max_code = -1;
					var node;
					s.heap_len = 0;
					s.heap_max = HEAP_SIZE;
					for (n = 0; n < elems; n++) if (tree[n * 2] !== 0) {
						s.heap[++s.heap_len] = max_code = n;
						s.depth[n] = 0;
					} else tree[n * 2 + 1] = 0;
					while (s.heap_len < 2) {
						node = s.heap[++s.heap_len] = max_code < 2 ? ++max_code : 0;
						tree[node * 2] = 1;
						s.depth[node] = 0;
						s.opt_len--;
						if (has_stree) s.static_len -= stree[node * 2 + 1];
					}
					desc.max_code = max_code;
					for (n = s.heap_len >> 1; n >= 1; n--) pqdownheap(s, tree, n);
					node = elems;
					do {
						/*** pqremove ***/
						n = s.heap[1];
						s.heap[1] = s.heap[s.heap_len--];
						pqdownheap(
							s,
							tree,
							1
							/*SMALLEST*/
);
						m = s.heap[1];
						s.heap[--s.heap_max] = n;
						s.heap[--s.heap_max] = m;
						tree[node * 2] = tree[n * 2] + tree[m * 2];
						s.depth[node] = (s.depth[n] >= s.depth[m] ? s.depth[n] : s.depth[m]) + 1;
						tree[n * 2 + 1] = tree[m * 2 + 1] = node;
						s.heap[1] = node++;
						pqdownheap(
							s,
							tree,
							1
							/*SMALLEST*/
);
					} while (s.heap_len >= 2);
					s.heap[--s.heap_max] = s.heap[1];
					gen_bitlen(s, desc);
					gen_codes(tree, max_code, s.bl_count);
				}
				function scan_tree(s, tree, max_code) {
					var n;
					var prevlen = -1;
					var curlen;
					var nextlen = tree[1];
					var count = 0;
					var max_count = 7;
					var min_count = 4;
					if (nextlen === 0) {
						max_count = 138;
						min_count = 3;
					}
					tree[(max_code + 1) * 2 + 1] = 65535;
					for (n = 0; n <= max_code; n++) {
						curlen = nextlen;
						nextlen = tree[(n + 1) * 2 + 1];
						if (++count < max_count && curlen === nextlen) continue;
else if (count < min_count) s.bl_tree[curlen * 2] += count;
else if (curlen !== 0) {
							if (curlen !== prevlen) s.bl_tree[curlen * 2]++;
							s.bl_tree[REP_3_6 * 2]++;
						} else if (count <= 10) s.bl_tree[REPZ_3_10 * 2]++;
else s.bl_tree[REPZ_11_138 * 2]++;
						count = 0;
						prevlen = curlen;
						if (nextlen === 0) {
							max_count = 138;
							min_count = 3;
						} else if (curlen === nextlen) {
							max_count = 6;
							min_count = 3;
						} else {
							max_count = 7;
							min_count = 4;
						}
					}
				}
				function send_tree(s, tree, max_code) {
					var n;
					var prevlen = -1;
					var curlen;
					var nextlen = tree[1];
					var count = 0;
					var max_count = 7;
					var min_count = 4;
					if (nextlen === 0) {
						max_count = 138;
						min_count = 3;
					}
					for (n = 0; n <= max_code; n++) {
						curlen = nextlen;
						nextlen = tree[(n + 1) * 2 + 1];
						if (++count < max_count && curlen === nextlen) continue;
else if (count < min_count) do 
							send_code(s, curlen, s.bl_tree);
						while (--count !== 0);
else if (curlen !== 0) {
							if (curlen !== prevlen) {
								send_code(s, curlen, s.bl_tree);
								count--;
							}
							send_code(s, REP_3_6, s.bl_tree);
							send_bits(s, count - 3, 2);
						} else if (count <= 10) {
							send_code(s, REPZ_3_10, s.bl_tree);
							send_bits(s, count - 3, 3);
						} else {
							send_code(s, REPZ_11_138, s.bl_tree);
							send_bits(s, count - 11, 7);
						}
						count = 0;
						prevlen = curlen;
						if (nextlen === 0) {
							max_count = 138;
							min_count = 3;
						} else if (curlen === nextlen) {
							max_count = 6;
							min_count = 3;
						} else {
							max_count = 7;
							min_count = 4;
						}
					}
				}
				function build_bl_tree(s) {
					var max_blindex;
					scan_tree(s, s.dyn_ltree, s.l_desc.max_code);
					scan_tree(s, s.dyn_dtree, s.d_desc.max_code);
					build_tree(s, s.bl_desc);
					for (max_blindex = BL_CODES - 1; max_blindex >= 3; max_blindex--) if (s.bl_tree[bl_order[max_blindex] * 2 + 1] !== 0) break;
					s.opt_len += 3 * (max_blindex + 1) + 5 + 5 + 4;
					return max_blindex;
				}
				function send_all_trees(s, lcodes, dcodes, blcodes) {
					var rank;
					send_bits(s, lcodes - 257, 5);
					send_bits(s, dcodes - 1, 5);
					send_bits(s, blcodes - 4, 4);
					for (rank = 0; rank < blcodes; rank++) send_bits(s, s.bl_tree[bl_order[rank] * 2 + 1], 3);
					send_tree(s, s.dyn_ltree, lcodes - 1);
					send_tree(s, s.dyn_dtree, dcodes - 1);
				}
				function detect_data_type(s) {
					var black_mask = 4093624447;
					var n;
					for (n = 0; n <= 31; n++, black_mask >>>= 1) if (black_mask & 1 && s.dyn_ltree[n * 2] !== 0) return Z_BINARY;
					if (s.dyn_ltree[18] !== 0 || s.dyn_ltree[20] !== 0 || s.dyn_ltree[26] !== 0) return Z_TEXT;
					for (n = 32; n < LITERALS; n++) if (s.dyn_ltree[n * 2] !== 0) return Z_TEXT;
					return Z_BINARY;
				}
				var static_init_done = false;
				function _tr_init(s) {
					if (!static_init_done) {
						tr_static_init();
						static_init_done = true;
					}
					s.l_desc = new TreeDesc(s.dyn_ltree, static_l_desc);
					s.d_desc = new TreeDesc(s.dyn_dtree, static_d_desc);
					s.bl_desc = new TreeDesc(s.bl_tree, static_bl_desc);
					s.bi_buf = 0;
					s.bi_valid = 0;
					init_block(s);
				}
				function _tr_stored_block(s, buf, stored_len, last) {
					send_bits(s, (STORED_BLOCK << 1) + (last ? 1 : 0), 3);
					copy_block(s, buf, stored_len);
				}
				function _tr_align(s) {
					send_bits(s, STATIC_TREES << 1, 3);
					send_code(s, END_BLOCK, static_ltree);
					bi_flush(s);
				}
				function _tr_flush_block(s, buf, stored_len, last) {
					var opt_lenb, static_lenb;
					var max_blindex = 0;
					if (s.level > 0) {
						if (s.strm.data_type === Z_UNKNOWN) s.strm.data_type = detect_data_type(s);
						build_tree(s, s.l_desc);
						build_tree(s, s.d_desc);
						max_blindex = build_bl_tree(s);
						opt_lenb = s.opt_len + 3 + 7 >>> 3;
						static_lenb = s.static_len + 3 + 7 >>> 3;
						if (static_lenb <= opt_lenb) opt_lenb = static_lenb;
					} else opt_lenb = static_lenb = stored_len + 5;
					if (stored_len + 4 <= opt_lenb && buf !== -1) _tr_stored_block(s, buf, stored_len, last);
else if (s.strategy === Z_FIXED || static_lenb === opt_lenb) {
						send_bits(s, (STATIC_TREES << 1) + (last ? 1 : 0), 3);
						compress_block(s, static_ltree, static_dtree);
					} else {
						send_bits(s, (DYN_TREES << 1) + (last ? 1 : 0), 3);
						send_all_trees(s, s.l_desc.max_code + 1, s.d_desc.max_code + 1, max_blindex + 1);
						compress_block(s, s.dyn_ltree, s.dyn_dtree);
					}
					init_block(s);
					if (last) bi_windup(s);
				}
				function _tr_tally(s, dist, lc) {
					s.pending_buf[s.d_buf + s.last_lit * 2] = dist >>> 8 & 255;
					s.pending_buf[s.d_buf + s.last_lit * 2 + 1] = dist & 255;
					s.pending_buf[s.l_buf + s.last_lit] = lc & 255;
					s.last_lit++;
					if (dist === 0) s.dyn_ltree[lc * 2]++;
else {
						s.matches++;
						dist--;
						s.dyn_ltree[(_length_code[lc] + LITERALS + 1) * 2]++;
						s.dyn_dtree[d_code(dist) * 2]++;
					}
					return s.last_lit === s.lit_bufsize - 1;
				}
				exports$1._tr_init = _tr_init;
				exports$1._tr_stored_block = _tr_stored_block;
				exports$1._tr_flush_block = _tr_flush_block;
				exports$1._tr_tally = _tr_tally;
				exports$1._tr_align = _tr_align;
			}, { "../utils/common": 41 }],
			53: [function(require$1, module$1, exports$1) {
				function ZStream() {
					this.input = null;
					this.next_in = 0;
					this.avail_in = 0;
					this.total_in = 0;
					this.output = null;
					this.next_out = 0;
					this.avail_out = 0;
					this.total_out = 0;
					this.msg = "";
					this.state = null;
					this.data_type = 2;
					this.adler = 0;
				}
				module$1.exports = ZStream;
			}, {}],
			54: [function(require$1, module$1, exports$1) {
				(function(global$1) {
					(function(global$2, undefined$1) {
						if (global$2.setImmediate) return;
						var nextHandle = 1;
						var tasksByHandle = {};
						var currentlyRunningATask = false;
						var doc = global$2.document;
						var registerImmediate;
						function setImmediate$1(callback) {
							if (typeof callback !== "function") callback = new Function("" + callback);
							var args = new Array(arguments.length - 1);
							for (var i = 0; i < args.length; i++) args[i] = arguments[i + 1];
							var task = {
								callback,
								args
							};
							tasksByHandle[nextHandle] = task;
							registerImmediate(nextHandle);
							return nextHandle++;
						}
						function clearImmediate(handle) {
							delete tasksByHandle[handle];
						}
						function run(task) {
							var callback = task.callback;
							var args = task.args;
							switch (args.length) {
								case 0:
									callback();
									break;
								case 1:
									callback(args[0]);
									break;
								case 2:
									callback(args[0], args[1]);
									break;
								case 3:
									callback(args[0], args[1], args[2]);
									break;
								default:
									callback.apply(undefined$1, args);
									break;
							}
						}
						function runIfPresent(handle) {
							if (currentlyRunningATask) setTimeout(runIfPresent, 0, handle);
else {
								var task = tasksByHandle[handle];
								if (task) {
									currentlyRunningATask = true;
									try {
										run(task);
									} finally {
										clearImmediate(handle);
										currentlyRunningATask = false;
									}
								}
							}
						}
						function installNextTickImplementation() {
							registerImmediate = function(handle) {
								process.nextTick(function() {
									runIfPresent(handle);
								});
							};
						}
						function canUsePostMessage() {
							if (global$2.postMessage && !global$2.importScripts) {
								var postMessageIsAsynchronous = true;
								var oldOnMessage = global$2.onmessage;
								global$2.onmessage = function() {
									postMessageIsAsynchronous = false;
								};
								global$2.postMessage("", "*");
								global$2.onmessage = oldOnMessage;
								return postMessageIsAsynchronous;
							}
						}
						function installPostMessageImplementation() {
							var messagePrefix = "setImmediate$" + Math.random() + "$";
							var onGlobalMessage = function(event) {
								if (event.source === global$2 && typeof event.data === "string" && event.data.indexOf(messagePrefix) === 0) runIfPresent(+event.data.slice(messagePrefix.length));
							};
							if (global$2.addEventListener) global$2.addEventListener("message", onGlobalMessage, false);
else global$2.attachEvent("onmessage", onGlobalMessage);
							registerImmediate = function(handle) {
								global$2.postMessage(messagePrefix + handle, "*");
							};
						}
						function installMessageChannelImplementation() {
							var channel = new MessageChannel();
							channel.port1.onmessage = function(event) {
								var handle = event.data;
								runIfPresent(handle);
							};
							registerImmediate = function(handle) {
								channel.port2.postMessage(handle);
							};
						}
						function installReadyStateChangeImplementation() {
							var html = doc.documentElement;
							registerImmediate = function(handle) {
								var script = doc.createElement("script");
								script.onreadystatechange = function() {
									runIfPresent(handle);
									script.onreadystatechange = null;
									html.removeChild(script);
									script = null;
								};
								html.appendChild(script);
							};
						}
						function installSetTimeoutImplementation() {
							registerImmediate = function(handle) {
								setTimeout(runIfPresent, 0, handle);
							};
						}
						var attachTo = Object.getPrototypeOf && Object.getPrototypeOf(global$2);
						attachTo = attachTo && attachTo.setTimeout ? attachTo : global$2;
						if ({}.toString.call(global$2.process) === "[object process]") installNextTickImplementation();
else if (canUsePostMessage()) installPostMessageImplementation();
else if (global$2.MessageChannel) installMessageChannelImplementation();
else if (doc && "onreadystatechange" in doc.createElement("script")) installReadyStateChangeImplementation();
else installSetTimeoutImplementation();
						attachTo.setImmediate = setImmediate$1;
						attachTo.clearImmediate = clearImmediate;
					})(typeof self === "undefined" ? typeof global$1 === "undefined" ? this : global$1 : self);
				}).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
			}, {}]
		}, {}, [10])(10);
	});
} });

//#endregion
export default require_jszip();

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianN6aXAtY2h1bmsuanMiLCJuYW1lcyI6WyJvIiwiZSIsIm4iLCJyZXF1aXJlIiwibW9kdWxlIiwiZXhwb3J0cyIsInNlbGYiLCJkYXRhIiwiZmlsZSIsImkiLCJnbG9iYWwiLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsInNldEltbWVkaWF0ZSJdLCJzb3VyY2VzIjpbIi4uL2xpYnMvanN6aXAuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyohXG5cbkpTWmlwIHYzLjEwLjEgLSBBIEphdmFTY3JpcHQgY2xhc3MgZm9yIGdlbmVyYXRpbmcgYW5kIHJlYWRpbmcgemlwIGZpbGVzXG48aHR0cDovL3N0dWFydGsuY29tL2pzemlwPlxuXG4oYykgMjAwOS0yMDE2IFN0dWFydCBLbmlnaHRsZXkgPHN0dWFydCBbYXRdIHN0dWFydGsuY29tPlxuRHVhbCBsaWNlbmNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2Ugb3IgR1BMdjMuIFNlZSBodHRwczovL3Jhdy5naXRodWIuY29tL1N0dWsvanN6aXAvbWFpbi9MSUNFTlNFLm1hcmtkb3duLlxuXG5KU1ppcCB1c2VzIHRoZSBsaWJyYXJ5IHBha28gcmVsZWFzZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlIDpcbmh0dHBzOi8vZ2l0aHViLmNvbS9ub2RlY2EvcGFrby9ibG9iL21haW4vTElDRU5TRVxuKi9cblxuKGZ1bmN0aW9uKGYpe2lmKHR5cGVvZiBleHBvcnRzPT09XCJvYmplY3RcIiYmdHlwZW9mIG1vZHVsZSE9PVwidW5kZWZpbmVkXCIpe21vZHVsZS5leHBvcnRzPWYoKTt9ZWxzZSBpZih0eXBlb2YgZGVmaW5lPT09XCJmdW5jdGlvblwiJiZkZWZpbmUuYW1kKXtkZWZpbmUoW10sZik7fWVsc2Uge3ZhciBnO2lmKHR5cGVvZiB3aW5kb3chPT1cInVuZGVmaW5lZFwiKXtnPXdpbmRvdzt9ZWxzZSBpZih0eXBlb2YgZ2xvYmFsIT09XCJ1bmRlZmluZWRcIil7Zz1nbG9iYWw7fWVsc2UgaWYodHlwZW9mIHNlbGYhPT1cInVuZGVmaW5lZFwiKXtnPXNlbGY7fWVsc2Uge2c9dGhpczt9Zy5KU1ppcCA9IGYoKTt9fSkoZnVuY3Rpb24oKXtyZXR1cm4gKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpO31yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pKHsxOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbnZhciB1dGlscyA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpO1xudmFyIHN1cHBvcnQgPSByZXF1aXJlKFwiLi9zdXBwb3J0XCIpO1xuLy8gcHJpdmF0ZSBwcm9wZXJ0eVxudmFyIF9rZXlTdHIgPSBcIkFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Ky89XCI7XG5cblxuLy8gcHVibGljIG1ldGhvZCBmb3IgZW5jb2RpbmdcbmV4cG9ydHMuZW5jb2RlID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgICB2YXIgb3V0cHV0ID0gW107XG4gICAgdmFyIGNocjEsIGNocjIsIGNocjMsIGVuYzEsIGVuYzIsIGVuYzMsIGVuYzQ7XG4gICAgdmFyIGkgPSAwLCBsZW4gPSBpbnB1dC5sZW5ndGgsIHJlbWFpbmluZ0J5dGVzID0gbGVuO1xuXG4gICAgdmFyIGlzQXJyYXkgPSB1dGlscy5nZXRUeXBlT2YoaW5wdXQpICE9PSBcInN0cmluZ1wiO1xuICAgIHdoaWxlIChpIDwgaW5wdXQubGVuZ3RoKSB7XG4gICAgICAgIHJlbWFpbmluZ0J5dGVzID0gbGVuIC0gaTtcblxuICAgICAgICBpZiAoIWlzQXJyYXkpIHtcbiAgICAgICAgICAgIGNocjEgPSBpbnB1dC5jaGFyQ29kZUF0KGkrKyk7XG4gICAgICAgICAgICBjaHIyID0gaSA8IGxlbiA/IGlucHV0LmNoYXJDb2RlQXQoaSsrKSA6IDA7XG4gICAgICAgICAgICBjaHIzID0gaSA8IGxlbiA/IGlucHV0LmNoYXJDb2RlQXQoaSsrKSA6IDA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjaHIxID0gaW5wdXRbaSsrXTtcbiAgICAgICAgICAgIGNocjIgPSBpIDwgbGVuID8gaW5wdXRbaSsrXSA6IDA7XG4gICAgICAgICAgICBjaHIzID0gaSA8IGxlbiA/IGlucHV0W2krK10gOiAwO1xuICAgICAgICB9XG5cbiAgICAgICAgZW5jMSA9IGNocjEgPj4gMjtcbiAgICAgICAgZW5jMiA9ICgoY2hyMSAmIDMpIDw8IDQpIHwgKGNocjIgPj4gNCk7XG4gICAgICAgIGVuYzMgPSByZW1haW5pbmdCeXRlcyA+IDEgPyAoKChjaHIyICYgMTUpIDw8IDIpIHwgKGNocjMgPj4gNikpIDogNjQ7XG4gICAgICAgIGVuYzQgPSByZW1haW5pbmdCeXRlcyA+IDIgPyAoY2hyMyAmIDYzKSA6IDY0O1xuXG4gICAgICAgIG91dHB1dC5wdXNoKF9rZXlTdHIuY2hhckF0KGVuYzEpICsgX2tleVN0ci5jaGFyQXQoZW5jMikgKyBfa2V5U3RyLmNoYXJBdChlbmMzKSArIF9rZXlTdHIuY2hhckF0KGVuYzQpKTtcblxuICAgIH1cblxuICAgIHJldHVybiBvdXRwdXQuam9pbihcIlwiKTtcbn07XG5cbi8vIHB1YmxpYyBtZXRob2QgZm9yIGRlY29kaW5nXG5leHBvcnRzLmRlY29kZSA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgdmFyIGNocjEsIGNocjIsIGNocjM7XG4gICAgdmFyIGVuYzEsIGVuYzIsIGVuYzMsIGVuYzQ7XG4gICAgdmFyIGkgPSAwLCByZXN1bHRJbmRleCA9IDA7XG5cbiAgICB2YXIgZGF0YVVybFByZWZpeCA9IFwiZGF0YTpcIjtcblxuICAgIGlmIChpbnB1dC5zdWJzdHIoMCwgZGF0YVVybFByZWZpeC5sZW5ndGgpID09PSBkYXRhVXJsUHJlZml4KSB7XG4gICAgICAgIC8vIFRoaXMgaXMgYSBjb21tb24gZXJyb3I6IHBlb3BsZSBnaXZlIGEgZGF0YSB1cmxcbiAgICAgICAgLy8gKGRhdGE6aW1hZ2UvcG5nO2Jhc2U2NCxpVkJPUi4uLikgd2l0aCBhIHtiYXNlNjQ6IHRydWV9IGFuZFxuICAgICAgICAvLyB3b25kZXJzIHdoeSB0aGluZ3MgZG9uJ3Qgd29yay5cbiAgICAgICAgLy8gV2UgY2FuIGRldGVjdCB0aGF0IHRoZSBzdHJpbmcgaW5wdXQgbG9va3MgbGlrZSBhIGRhdGEgdXJsIGJ1dCB3ZVxuICAgICAgICAvLyAqY2FuJ3QqIGJlIHN1cmUgaXQgaXMgb25lOiByZW1vdmluZyBldmVyeXRoaW5nIHVwIHRvIHRoZSBjb21tYSB3b3VsZFxuICAgICAgICAvLyBiZSB0b28gZGFuZ2Vyb3VzLlxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIGJhc2U2NCBpbnB1dCwgaXQgbG9va3MgbGlrZSBhIGRhdGEgdXJsLlwiKTtcbiAgICB9XG5cbiAgICBpbnB1dCA9IGlucHV0LnJlcGxhY2UoL1teQS1aYS16MC05Ky89XS9nLCBcIlwiKTtcblxuICAgIHZhciB0b3RhbExlbmd0aCA9IGlucHV0Lmxlbmd0aCAqIDMgLyA0O1xuICAgIGlmKGlucHV0LmNoYXJBdChpbnB1dC5sZW5ndGggLSAxKSA9PT0gX2tleVN0ci5jaGFyQXQoNjQpKSB7XG4gICAgICAgIHRvdGFsTGVuZ3RoLS07XG4gICAgfVxuICAgIGlmKGlucHV0LmNoYXJBdChpbnB1dC5sZW5ndGggLSAyKSA9PT0gX2tleVN0ci5jaGFyQXQoNjQpKSB7XG4gICAgICAgIHRvdGFsTGVuZ3RoLS07XG4gICAgfVxuICAgIGlmICh0b3RhbExlbmd0aCAlIDEgIT09IDApIHtcbiAgICAgICAgLy8gdG90YWxMZW5ndGggaXMgbm90IGFuIGludGVnZXIsIHRoZSBsZW5ndGggZG9lcyBub3QgbWF0Y2ggYSB2YWxpZFxuICAgICAgICAvLyBiYXNlNjQgY29udGVudC4gVGhhdCBjYW4gaGFwcGVuIGlmOlxuICAgICAgICAvLyAtIHRoZSBpbnB1dCBpcyBub3QgYSBiYXNlNjQgY29udGVudFxuICAgICAgICAvLyAtIHRoZSBpbnB1dCBpcyAqYWxtb3N0KiBhIGJhc2U2NCBjb250ZW50LCB3aXRoIGEgZXh0cmEgY2hhcnMgYXQgdGhlXG4gICAgICAgIC8vICAgYmVnaW5uaW5nIG9yIGF0IHRoZSBlbmRcbiAgICAgICAgLy8gLSB0aGUgaW5wdXQgdXNlcyBhIGJhc2U2NCB2YXJpYW50IChiYXNlNjR1cmwgZm9yIGV4YW1wbGUpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgYmFzZTY0IGlucHV0LCBiYWQgY29udGVudCBsZW5ndGguXCIpO1xuICAgIH1cbiAgICB2YXIgb3V0cHV0O1xuICAgIGlmIChzdXBwb3J0LnVpbnQ4YXJyYXkpIHtcbiAgICAgICAgb3V0cHV0ID0gbmV3IFVpbnQ4QXJyYXkodG90YWxMZW5ndGh8MCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgb3V0cHV0ID0gbmV3IEFycmF5KHRvdGFsTGVuZ3RofDApO1xuICAgIH1cblxuICAgIHdoaWxlIChpIDwgaW5wdXQubGVuZ3RoKSB7XG5cbiAgICAgICAgZW5jMSA9IF9rZXlTdHIuaW5kZXhPZihpbnB1dC5jaGFyQXQoaSsrKSk7XG4gICAgICAgIGVuYzIgPSBfa2V5U3RyLmluZGV4T2YoaW5wdXQuY2hhckF0KGkrKykpO1xuICAgICAgICBlbmMzID0gX2tleVN0ci5pbmRleE9mKGlucHV0LmNoYXJBdChpKyspKTtcbiAgICAgICAgZW5jNCA9IF9rZXlTdHIuaW5kZXhPZihpbnB1dC5jaGFyQXQoaSsrKSk7XG5cbiAgICAgICAgY2hyMSA9IChlbmMxIDw8IDIpIHwgKGVuYzIgPj4gNCk7XG4gICAgICAgIGNocjIgPSAoKGVuYzIgJiAxNSkgPDwgNCkgfCAoZW5jMyA+PiAyKTtcbiAgICAgICAgY2hyMyA9ICgoZW5jMyAmIDMpIDw8IDYpIHwgZW5jNDtcblxuICAgICAgICBvdXRwdXRbcmVzdWx0SW5kZXgrK10gPSBjaHIxO1xuXG4gICAgICAgIGlmIChlbmMzICE9PSA2NCkge1xuICAgICAgICAgICAgb3V0cHV0W3Jlc3VsdEluZGV4KytdID0gY2hyMjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZW5jNCAhPT0gNjQpIHtcbiAgICAgICAgICAgIG91dHB1dFtyZXN1bHRJbmRleCsrXSA9IGNocjM7XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIHJldHVybiBvdXRwdXQ7XG59O1xuXG59LHtcIi4vc3VwcG9ydFwiOjMwLFwiLi91dGlsc1wiOjMyfV0sMjpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG5cbnZhciBleHRlcm5hbCA9IHJlcXVpcmUoXCIuL2V4dGVybmFsXCIpO1xudmFyIERhdGFXb3JrZXIgPSByZXF1aXJlKFwiLi9zdHJlYW0vRGF0YVdvcmtlclwiKTtcbnZhciBDcmMzMlByb2JlID0gcmVxdWlyZShcIi4vc3RyZWFtL0NyYzMyUHJvYmVcIik7XG52YXIgRGF0YUxlbmd0aFByb2JlID0gcmVxdWlyZShcIi4vc3RyZWFtL0RhdGFMZW5ndGhQcm9iZVwiKTtcblxuLyoqXG4gKiBSZXByZXNlbnQgYSBjb21wcmVzc2VkIG9iamVjdCwgd2l0aCBldmVyeXRoaW5nIG5lZWRlZCB0byBkZWNvbXByZXNzIGl0LlxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge251bWJlcn0gY29tcHJlc3NlZFNpemUgdGhlIHNpemUgb2YgdGhlIGRhdGEgY29tcHJlc3NlZC5cbiAqIEBwYXJhbSB7bnVtYmVyfSB1bmNvbXByZXNzZWRTaXplIHRoZSBzaXplIG9mIHRoZSBkYXRhIGFmdGVyIGRlY29tcHJlc3Npb24uXG4gKiBAcGFyYW0ge251bWJlcn0gY3JjMzIgdGhlIGNyYzMyIG9mIHRoZSBkZWNvbXByZXNzZWQgZmlsZS5cbiAqIEBwYXJhbSB7b2JqZWN0fSBjb21wcmVzc2lvbiB0aGUgdHlwZSBvZiBjb21wcmVzc2lvbiwgc2VlIGxpYi9jb21wcmVzc2lvbnMuanMuXG4gKiBAcGFyYW0ge1N0cmluZ3xBcnJheUJ1ZmZlcnxVaW50OEFycmF5fEJ1ZmZlcn0gZGF0YSB0aGUgY29tcHJlc3NlZCBkYXRhLlxuICovXG5mdW5jdGlvbiBDb21wcmVzc2VkT2JqZWN0KGNvbXByZXNzZWRTaXplLCB1bmNvbXByZXNzZWRTaXplLCBjcmMzMiwgY29tcHJlc3Npb24sIGRhdGEpIHtcbiAgICB0aGlzLmNvbXByZXNzZWRTaXplID0gY29tcHJlc3NlZFNpemU7XG4gICAgdGhpcy51bmNvbXByZXNzZWRTaXplID0gdW5jb21wcmVzc2VkU2l6ZTtcbiAgICB0aGlzLmNyYzMyID0gY3JjMzI7XG4gICAgdGhpcy5jb21wcmVzc2lvbiA9IGNvbXByZXNzaW9uO1xuICAgIHRoaXMuY29tcHJlc3NlZENvbnRlbnQgPSBkYXRhO1xufVxuXG5Db21wcmVzc2VkT2JqZWN0LnByb3RvdHlwZSA9IHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSB3b3JrZXIgdG8gZ2V0IHRoZSB1bmNvbXByZXNzZWQgY29udGVudC5cbiAgICAgKiBAcmV0dXJuIHtHZW5lcmljV29ya2VyfSB0aGUgd29ya2VyLlxuICAgICAqL1xuICAgIGdldENvbnRlbnRXb3JrZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHdvcmtlciA9IG5ldyBEYXRhV29ya2VyKGV4dGVybmFsLlByb21pc2UucmVzb2x2ZSh0aGlzLmNvbXByZXNzZWRDb250ZW50KSlcbiAgICAgICAgICAgIC5waXBlKHRoaXMuY29tcHJlc3Npb24udW5jb21wcmVzc1dvcmtlcigpKVxuICAgICAgICAgICAgLnBpcGUobmV3IERhdGFMZW5ndGhQcm9iZShcImRhdGFfbGVuZ3RoXCIpKTtcblxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgIHdvcmtlci5vbihcImVuZFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5zdHJlYW1JbmZvW1wiZGF0YV9sZW5ndGhcIl0gIT09IHRoYXQudW5jb21wcmVzc2VkU2l6ZSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkJ1ZyA6IHVuY29tcHJlc3NlZCBkYXRhIHNpemUgbWlzbWF0Y2hcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gd29ya2VyO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgd29ya2VyIHRvIGdldCB0aGUgY29tcHJlc3NlZCBjb250ZW50LlxuICAgICAqIEByZXR1cm4ge0dlbmVyaWNXb3JrZXJ9IHRoZSB3b3JrZXIuXG4gICAgICovXG4gICAgZ2V0Q29tcHJlc3NlZFdvcmtlcjogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IERhdGFXb3JrZXIoZXh0ZXJuYWwuUHJvbWlzZS5yZXNvbHZlKHRoaXMuY29tcHJlc3NlZENvbnRlbnQpKVxuICAgICAgICAgICAgLndpdGhTdHJlYW1JbmZvKFwiY29tcHJlc3NlZFNpemVcIiwgdGhpcy5jb21wcmVzc2VkU2l6ZSlcbiAgICAgICAgICAgIC53aXRoU3RyZWFtSW5mbyhcInVuY29tcHJlc3NlZFNpemVcIiwgdGhpcy51bmNvbXByZXNzZWRTaXplKVxuICAgICAgICAgICAgLndpdGhTdHJlYW1JbmZvKFwiY3JjMzJcIiwgdGhpcy5jcmMzMilcbiAgICAgICAgICAgIC53aXRoU3RyZWFtSW5mbyhcImNvbXByZXNzaW9uXCIsIHRoaXMuY29tcHJlc3Npb24pXG4gICAgICAgIDtcbiAgICB9XG59O1xuXG4vKipcbiAqIENoYWluIHRoZSBnaXZlbiB3b3JrZXIgd2l0aCBvdGhlciB3b3JrZXJzIHRvIGNvbXByZXNzIHRoZSBjb250ZW50IHdpdGggdGhlXG4gKiBnaXZlbiBjb21wcmVzc2lvbi5cbiAqIEBwYXJhbSB7R2VuZXJpY1dvcmtlcn0gdW5jb21wcmVzc2VkV29ya2VyIHRoZSB3b3JrZXIgdG8gcGlwZS5cbiAqIEBwYXJhbSB7T2JqZWN0fSBjb21wcmVzc2lvbiB0aGUgY29tcHJlc3Npb24gb2JqZWN0LlxuICogQHBhcmFtIHtPYmplY3R9IGNvbXByZXNzaW9uT3B0aW9ucyB0aGUgb3B0aW9ucyB0byB1c2Ugd2hlbiBjb21wcmVzc2luZy5cbiAqIEByZXR1cm4ge0dlbmVyaWNXb3JrZXJ9IHRoZSBuZXcgd29ya2VyIGNvbXByZXNzaW5nIHRoZSBjb250ZW50LlxuICovXG5Db21wcmVzc2VkT2JqZWN0LmNyZWF0ZVdvcmtlckZyb20gPSBmdW5jdGlvbiAodW5jb21wcmVzc2VkV29ya2VyLCBjb21wcmVzc2lvbiwgY29tcHJlc3Npb25PcHRpb25zKSB7XG4gICAgcmV0dXJuIHVuY29tcHJlc3NlZFdvcmtlclxuICAgICAgICAucGlwZShuZXcgQ3JjMzJQcm9iZSgpKVxuICAgICAgICAucGlwZShuZXcgRGF0YUxlbmd0aFByb2JlKFwidW5jb21wcmVzc2VkU2l6ZVwiKSlcbiAgICAgICAgLnBpcGUoY29tcHJlc3Npb24uY29tcHJlc3NXb3JrZXIoY29tcHJlc3Npb25PcHRpb25zKSlcbiAgICAgICAgLnBpcGUobmV3IERhdGFMZW5ndGhQcm9iZShcImNvbXByZXNzZWRTaXplXCIpKVxuICAgICAgICAud2l0aFN0cmVhbUluZm8oXCJjb21wcmVzc2lvblwiLCBjb21wcmVzc2lvbik7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbXByZXNzZWRPYmplY3Q7XG5cbn0se1wiLi9leHRlcm5hbFwiOjYsXCIuL3N0cmVhbS9DcmMzMlByb2JlXCI6MjUsXCIuL3N0cmVhbS9EYXRhTGVuZ3RoUHJvYmVcIjoyNixcIi4vc3RyZWFtL0RhdGFXb3JrZXJcIjoyN31dLDM6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXG52YXIgR2VuZXJpY1dvcmtlciA9IHJlcXVpcmUoXCIuL3N0cmVhbS9HZW5lcmljV29ya2VyXCIpO1xuXG5leHBvcnRzLlNUT1JFID0ge1xuICAgIG1hZ2ljOiBcIlxceDAwXFx4MDBcIixcbiAgICBjb21wcmVzc1dvcmtlciA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBHZW5lcmljV29ya2VyKFwiU1RPUkUgY29tcHJlc3Npb25cIik7XG4gICAgfSxcbiAgICB1bmNvbXByZXNzV29ya2VyIDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IEdlbmVyaWNXb3JrZXIoXCJTVE9SRSBkZWNvbXByZXNzaW9uXCIpO1xuICAgIH1cbn07XG5leHBvcnRzLkRFRkxBVEUgPSByZXF1aXJlKFwiLi9mbGF0ZVwiKTtcblxufSx7XCIuL2ZsYXRlXCI6NyxcIi4vc3RyZWFtL0dlbmVyaWNXb3JrZXJcIjoyOH1dLDQ6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXG52YXIgdXRpbHMgPSByZXF1aXJlKFwiLi91dGlsc1wiKTtcblxuLyoqXG4gKiBUaGUgZm9sbG93aW5nIGZ1bmN0aW9ucyBjb21lIGZyb20gcGFrbywgZnJvbSBwYWtvL2xpYi96bGliL2NyYzMyLmpzXG4gKiByZWxlYXNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UsIHNlZSBwYWtvIGh0dHBzOi8vZ2l0aHViLmNvbS9ub2RlY2EvcGFrby9cbiAqL1xuXG4vLyBVc2Ugb3JkaW5hcnkgYXJyYXksIHNpbmNlIHVudHlwZWQgbWFrZXMgbm8gYm9vc3QgaGVyZVxuZnVuY3Rpb24gbWFrZVRhYmxlKCkge1xuICAgIHZhciBjLCB0YWJsZSA9IFtdO1xuXG4gICAgZm9yKHZhciBuID0wOyBuIDwgMjU2OyBuKyspe1xuICAgICAgICBjID0gbjtcbiAgICAgICAgZm9yKHZhciBrID0wOyBrIDwgODsgaysrKXtcbiAgICAgICAgICAgIGMgPSAoKGMmMSkgPyAoMHhFREI4ODMyMCBeIChjID4+PiAxKSkgOiAoYyA+Pj4gMSkpO1xuICAgICAgICB9XG4gICAgICAgIHRhYmxlW25dID0gYztcbiAgICB9XG5cbiAgICByZXR1cm4gdGFibGU7XG59XG5cbi8vIENyZWF0ZSB0YWJsZSBvbiBsb2FkLiBKdXN0IDI1NSBzaWduZWQgbG9uZ3MuIE5vdCBhIHByb2JsZW0uXG52YXIgY3JjVGFibGUgPSBtYWtlVGFibGUoKTtcblxuXG5mdW5jdGlvbiBjcmMzMihjcmMsIGJ1ZiwgbGVuLCBwb3MpIHtcbiAgICB2YXIgdCA9IGNyY1RhYmxlLCBlbmQgPSBwb3MgKyBsZW47XG5cbiAgICBjcmMgPSBjcmMgXiAoLTEpO1xuXG4gICAgZm9yICh2YXIgaSA9IHBvczsgaSA8IGVuZDsgaSsrICkge1xuICAgICAgICBjcmMgPSAoY3JjID4+PiA4KSBeIHRbKGNyYyBeIGJ1ZltpXSkgJiAweEZGXTtcbiAgICB9XG5cbiAgICByZXR1cm4gKGNyYyBeICgtMSkpOyAvLyA+Pj4gMDtcbn1cblxuLy8gVGhhdCdzIGFsbCBmb3IgdGhlIHBha28gZnVuY3Rpb25zLlxuXG4vKipcbiAqIENvbXB1dGUgdGhlIGNyYzMyIG9mIGEgc3RyaW5nLlxuICogVGhpcyBpcyBhbG1vc3QgdGhlIHNhbWUgYXMgdGhlIGZ1bmN0aW9uIGNyYzMyLCBidXQgZm9yIHN0cmluZ3MuIFVzaW5nIHRoZVxuICogc2FtZSBmdW5jdGlvbiBmb3IgdGhlIHR3byB1c2UgY2FzZXMgbGVhZHMgdG8gaG9ycmlibGUgcGVyZm9ybWFuY2VzLlxuICogQHBhcmFtIHtOdW1iZXJ9IGNyYyB0aGUgc3RhcnRpbmcgdmFsdWUgb2YgdGhlIGNyYy5cbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHIgdGhlIHN0cmluZyB0byB1c2UuXG4gKiBAcGFyYW0ge051bWJlcn0gbGVuIHRoZSBsZW5ndGggb2YgdGhlIHN0cmluZy5cbiAqIEBwYXJhbSB7TnVtYmVyfSBwb3MgdGhlIHN0YXJ0aW5nIHBvc2l0aW9uIGZvciB0aGUgY3JjMzIgY29tcHV0YXRpb24uXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IHRoZSBjb21wdXRlZCBjcmMzMi5cbiAqL1xuZnVuY3Rpb24gY3JjMzJzdHIoY3JjLCBzdHIsIGxlbiwgcG9zKSB7XG4gICAgdmFyIHQgPSBjcmNUYWJsZSwgZW5kID0gcG9zICsgbGVuO1xuXG4gICAgY3JjID0gY3JjIF4gKC0xKTtcblxuICAgIGZvciAodmFyIGkgPSBwb3M7IGkgPCBlbmQ7IGkrKyApIHtcbiAgICAgICAgY3JjID0gKGNyYyA+Pj4gOCkgXiB0WyhjcmMgXiBzdHIuY2hhckNvZGVBdChpKSkgJiAweEZGXTtcbiAgICB9XG5cbiAgICByZXR1cm4gKGNyYyBeICgtMSkpOyAvLyA+Pj4gMDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjcmMzMndyYXBwZXIoaW5wdXQsIGNyYykge1xuICAgIGlmICh0eXBlb2YgaW5wdXQgPT09IFwidW5kZWZpbmVkXCIgfHwgIWlucHV0Lmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG5cbiAgICB2YXIgaXNBcnJheSA9IHV0aWxzLmdldFR5cGVPZihpbnB1dCkgIT09IFwic3RyaW5nXCI7XG5cbiAgICBpZihpc0FycmF5KSB7XG4gICAgICAgIHJldHVybiBjcmMzMihjcmN8MCwgaW5wdXQsIGlucHV0Lmxlbmd0aCwgMCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGNyYzMyc3RyKGNyY3wwLCBpbnB1dCwgaW5wdXQubGVuZ3RoLCAwKTtcbiAgICB9XG59O1xuXG59LHtcIi4vdXRpbHNcIjozMn1dLDU6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuZXhwb3J0cy5iYXNlNjQgPSBmYWxzZTtcbmV4cG9ydHMuYmluYXJ5ID0gZmFsc2U7XG5leHBvcnRzLmRpciA9IGZhbHNlO1xuZXhwb3J0cy5jcmVhdGVGb2xkZXJzID0gdHJ1ZTtcbmV4cG9ydHMuZGF0ZSA9IG51bGw7XG5leHBvcnRzLmNvbXByZXNzaW9uID0gbnVsbDtcbmV4cG9ydHMuY29tcHJlc3Npb25PcHRpb25zID0gbnVsbDtcbmV4cG9ydHMuY29tbWVudCA9IG51bGw7XG5leHBvcnRzLnVuaXhQZXJtaXNzaW9ucyA9IG51bGw7XG5leHBvcnRzLmRvc1Blcm1pc3Npb25zID0gbnVsbDtcblxufSx7fV0sNjpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG5cbi8vIGxvYWQgdGhlIGdsb2JhbCBvYmplY3QgZmlyc3Q6XG4vLyAtIGl0IHNob3VsZCBiZSBiZXR0ZXIgaW50ZWdyYXRlZCBpbiB0aGUgc3lzdGVtICh1bmhhbmRsZWRSZWplY3Rpb24gaW4gbm9kZSlcbi8vIC0gdGhlIGVudmlyb25tZW50IG1heSBoYXZlIGEgY3VzdG9tIFByb21pc2UgaW1wbGVtZW50YXRpb24gKHNlZSB6b25lLmpzKVxudmFyIEVTNlByb21pc2UgPSBudWxsO1xuaWYgKHR5cGVvZiBQcm9taXNlICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgRVM2UHJvbWlzZSA9IFByb21pc2U7XG59IGVsc2Uge1xuICAgIEVTNlByb21pc2UgPSByZXF1aXJlKFwibGllXCIpO1xufVxuXG4vKipcbiAqIExldCB0aGUgdXNlciB1c2UvY2hhbmdlIHNvbWUgaW1wbGVtZW50YXRpb25zLlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBQcm9taXNlOiBFUzZQcm9taXNlXG59O1xuXG59LHtcImxpZVwiOjM3fV0sNzpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG52YXIgVVNFX1RZUEVEQVJSQVkgPSAodHlwZW9mIFVpbnQ4QXJyYXkgIT09IFwidW5kZWZpbmVkXCIpICYmICh0eXBlb2YgVWludDE2QXJyYXkgIT09IFwidW5kZWZpbmVkXCIpICYmICh0eXBlb2YgVWludDMyQXJyYXkgIT09IFwidW5kZWZpbmVkXCIpO1xuXG52YXIgcGFrbyA9IHJlcXVpcmUoXCJwYWtvXCIpO1xudmFyIHV0aWxzID0gcmVxdWlyZShcIi4vdXRpbHNcIik7XG52YXIgR2VuZXJpY1dvcmtlciA9IHJlcXVpcmUoXCIuL3N0cmVhbS9HZW5lcmljV29ya2VyXCIpO1xuXG52YXIgQVJSQVlfVFlQRSA9IFVTRV9UWVBFREFSUkFZID8gXCJ1aW50OGFycmF5XCIgOiBcImFycmF5XCI7XG5cbmV4cG9ydHMubWFnaWMgPSBcIlxceDA4XFx4MDBcIjtcblxuLyoqXG4gKiBDcmVhdGUgYSB3b3JrZXIgdGhhdCB1c2VzIHBha28gdG8gaW5mbGF0ZS9kZWZsYXRlLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge1N0cmluZ30gYWN0aW9uIHRoZSBuYW1lIG9mIHRoZSBwYWtvIGZ1bmN0aW9uIHRvIGNhbGwgOiBlaXRoZXIgXCJEZWZsYXRlXCIgb3IgXCJJbmZsYXRlXCIuXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyB0aGUgb3B0aW9ucyB0byB1c2Ugd2hlbiAoZGUpY29tcHJlc3NpbmcuXG4gKi9cbmZ1bmN0aW9uIEZsYXRlV29ya2VyKGFjdGlvbiwgb3B0aW9ucykge1xuICAgIEdlbmVyaWNXb3JrZXIuY2FsbCh0aGlzLCBcIkZsYXRlV29ya2VyL1wiICsgYWN0aW9uKTtcblxuICAgIHRoaXMuX3Bha28gPSBudWxsO1xuICAgIHRoaXMuX3Bha29BY3Rpb24gPSBhY3Rpb247XG4gICAgdGhpcy5fcGFrb09wdGlvbnMgPSBvcHRpb25zO1xuICAgIC8vIHRoZSBgbWV0YWAgb2JqZWN0IGZyb20gdGhlIGxhc3QgY2h1bmsgcmVjZWl2ZWRcbiAgICAvLyB0aGlzIGFsbG93IHRoaXMgd29ya2VyIHRvIHBhc3MgYXJvdW5kIG1ldGFkYXRhXG4gICAgdGhpcy5tZXRhID0ge307XG59XG5cbnV0aWxzLmluaGVyaXRzKEZsYXRlV29ya2VyLCBHZW5lcmljV29ya2VyKTtcblxuLyoqXG4gKiBAc2VlIEdlbmVyaWNXb3JrZXIucHJvY2Vzc0NodW5rXG4gKi9cbkZsYXRlV29ya2VyLnByb3RvdHlwZS5wcm9jZXNzQ2h1bmsgPSBmdW5jdGlvbiAoY2h1bmspIHtcbiAgICB0aGlzLm1ldGEgPSBjaHVuay5tZXRhO1xuICAgIGlmICh0aGlzLl9wYWtvID09PSBudWxsKSB7XG4gICAgICAgIHRoaXMuX2NyZWF0ZVBha28oKTtcbiAgICB9XG4gICAgdGhpcy5fcGFrby5wdXNoKHV0aWxzLnRyYW5zZm9ybVRvKEFSUkFZX1RZUEUsIGNodW5rLmRhdGEpLCBmYWxzZSk7XG59O1xuXG4vKipcbiAqIEBzZWUgR2VuZXJpY1dvcmtlci5mbHVzaFxuICovXG5GbGF0ZVdvcmtlci5wcm90b3R5cGUuZmx1c2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgR2VuZXJpY1dvcmtlci5wcm90b3R5cGUuZmx1c2guY2FsbCh0aGlzKTtcbiAgICBpZiAodGhpcy5fcGFrbyA9PT0gbnVsbCkge1xuICAgICAgICB0aGlzLl9jcmVhdGVQYWtvKCk7XG4gICAgfVxuICAgIHRoaXMuX3Bha28ucHVzaChbXSwgdHJ1ZSk7XG59O1xuLyoqXG4gKiBAc2VlIEdlbmVyaWNXb3JrZXIuY2xlYW5VcFxuICovXG5GbGF0ZVdvcmtlci5wcm90b3R5cGUuY2xlYW5VcCA9IGZ1bmN0aW9uICgpIHtcbiAgICBHZW5lcmljV29ya2VyLnByb3RvdHlwZS5jbGVhblVwLmNhbGwodGhpcyk7XG4gICAgdGhpcy5fcGFrbyA9IG51bGw7XG59O1xuXG4vKipcbiAqIENyZWF0ZSB0aGUgX3Bha28gb2JqZWN0LlxuICogVE9ETzogbGF6eS1sb2FkaW5nIHRoaXMgb2JqZWN0IGlzbid0IHRoZSBiZXN0IHNvbHV0aW9uIGJ1dCBpdCdzIHRoZVxuICogcXVpY2tlc3QuIFRoZSBiZXN0IHNvbHV0aW9uIGlzIHRvIGxhenktbG9hZCB0aGUgd29ya2VyIGxpc3QuIFNlZSBhbHNvIHRoZVxuICogaXNzdWUgIzQ0Ni5cbiAqL1xuRmxhdGVXb3JrZXIucHJvdG90eXBlLl9jcmVhdGVQYWtvID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX3Bha28gPSBuZXcgcGFrb1t0aGlzLl9wYWtvQWN0aW9uXSh7XG4gICAgICAgIHJhdzogdHJ1ZSxcbiAgICAgICAgbGV2ZWw6IHRoaXMuX3Bha29PcHRpb25zLmxldmVsIHx8IC0xIC8vIGRlZmF1bHQgY29tcHJlc3Npb25cbiAgICB9KTtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdGhpcy5fcGFrby5vbkRhdGEgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHNlbGYucHVzaCh7XG4gICAgICAgICAgICBkYXRhIDogZGF0YSxcbiAgICAgICAgICAgIG1ldGEgOiBzZWxmLm1ldGFcbiAgICAgICAgfSk7XG4gICAgfTtcbn07XG5cbmV4cG9ydHMuY29tcHJlc3NXb3JrZXIgPSBmdW5jdGlvbiAoY29tcHJlc3Npb25PcHRpb25zKSB7XG4gICAgcmV0dXJuIG5ldyBGbGF0ZVdvcmtlcihcIkRlZmxhdGVcIiwgY29tcHJlc3Npb25PcHRpb25zKTtcbn07XG5leHBvcnRzLnVuY29tcHJlc3NXb3JrZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIG5ldyBGbGF0ZVdvcmtlcihcIkluZmxhdGVcIiwge30pO1xufTtcblxufSx7XCIuL3N0cmVhbS9HZW5lcmljV29ya2VyXCI6MjgsXCIuL3V0aWxzXCI6MzIsXCJwYWtvXCI6Mzh9XSw4OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcblxudmFyIHV0aWxzID0gcmVxdWlyZShcIi4uL3V0aWxzXCIpO1xudmFyIEdlbmVyaWNXb3JrZXIgPSByZXF1aXJlKFwiLi4vc3RyZWFtL0dlbmVyaWNXb3JrZXJcIik7XG52YXIgdXRmOCA9IHJlcXVpcmUoXCIuLi91dGY4XCIpO1xudmFyIGNyYzMyID0gcmVxdWlyZShcIi4uL2NyYzMyXCIpO1xudmFyIHNpZ25hdHVyZSA9IHJlcXVpcmUoXCIuLi9zaWduYXR1cmVcIik7XG5cbi8qKlxuICogVHJhbnNmb3JtIGFuIGludGVnZXIgaW50byBhIHN0cmluZyBpbiBoZXhhZGVjaW1hbC5cbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge251bWJlcn0gZGVjIHRoZSBudW1iZXIgdG8gY29udmVydC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBieXRlcyB0aGUgbnVtYmVyIG9mIGJ5dGVzIHRvIGdlbmVyYXRlLlxuICogQHJldHVybnMge3N0cmluZ30gdGhlIHJlc3VsdC5cbiAqL1xudmFyIGRlY1RvSGV4ID0gZnVuY3Rpb24oZGVjLCBieXRlcykge1xuICAgIHZhciBoZXggPSBcIlwiLCBpO1xuICAgIGZvciAoaSA9IDA7IGkgPCBieXRlczsgaSsrKSB7XG4gICAgICAgIGhleCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGRlYyAmIDB4ZmYpO1xuICAgICAgICBkZWMgPSBkZWMgPj4+IDg7XG4gICAgfVxuICAgIHJldHVybiBoZXg7XG59O1xuXG4vKipcbiAqIEdlbmVyYXRlIHRoZSBVTklYIHBhcnQgb2YgdGhlIGV4dGVybmFsIGZpbGUgYXR0cmlidXRlcy5cbiAqIEBwYXJhbSB7T2JqZWN0fSB1bml4UGVybWlzc2lvbnMgdGhlIHVuaXggcGVybWlzc2lvbnMgb3IgbnVsbC5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gaXNEaXIgdHJ1ZSBpZiB0aGUgZW50cnkgaXMgYSBkaXJlY3RvcnksIGZhbHNlIG90aGVyd2lzZS5cbiAqIEByZXR1cm4ge051bWJlcn0gYSAzMiBiaXQgaW50ZWdlci5cbiAqXG4gKiBhZGFwdGVkIGZyb20gaHR0cDovL3VuaXguc3RhY2tleGNoYW5nZS5jb20vcXVlc3Rpb25zLzE0NzA1L3RoZS16aXAtZm9ybWF0cy1leHRlcm5hbC1maWxlLWF0dHJpYnV0ZSA6XG4gKlxuICogVFRUVHNzdHJ3eHJ3eHJ3eDAwMDAwMDAwMDBBRFZTSFJcbiAqIF5eXl5fX19fX19fX19fX19fX19fX19fX19fX19fX19fIGZpbGUgdHlwZSwgc2VlIHppcGluZm8uYyAoVU5YXyopXG4gKiAgICAgXl5eX19fX19fX19fX19fX19fX19fX19fX19fXyBzZXR1aWQsIHNldGdpZCwgc3RpY2t5XG4gKiAgICAgICAgXl5eXl5eXl5eX19fX19fX19fX19fX19fXyBwZXJtaXNzaW9uc1xuICogICAgICAgICAgICAgICAgIF5eXl5eXl5eXl5fX19fX18gbm90IHVzZWQgP1xuICogICAgICAgICAgICAgICAgICAgICAgICAgICBeXl5eXl4gRE9TIGF0dHJpYnV0ZSBiaXRzIDogQXJjaGl2ZSwgRGlyZWN0b3J5LCBWb2x1bWUgbGFiZWwsIFN5c3RlbSBmaWxlLCBIaWRkZW4sIFJlYWQgb25seVxuICovXG52YXIgZ2VuZXJhdGVVbml4RXh0ZXJuYWxGaWxlQXR0ciA9IGZ1bmN0aW9uICh1bml4UGVybWlzc2lvbnMsIGlzRGlyKSB7XG5cbiAgICB2YXIgcmVzdWx0ID0gdW5peFBlcm1pc3Npb25zO1xuICAgIGlmICghdW5peFBlcm1pc3Npb25zKSB7XG4gICAgICAgIC8vIEkgY2FuJ3QgdXNlIG9jdGFsIHZhbHVlcyBpbiBzdHJpY3QgbW9kZSwgaGVuY2UgdGhlIGhleGEuXG4gICAgICAgIC8vICAwNDA3NzUgPT4gMHg0MWZkXG4gICAgICAgIC8vIDAxMDA2NjQgPT4gMHg4MWI0XG4gICAgICAgIHJlc3VsdCA9IGlzRGlyID8gMHg0MWZkIDogMHg4MWI0O1xuICAgIH1cbiAgICByZXR1cm4gKHJlc3VsdCAmIDB4RkZGRikgPDwgMTY7XG59O1xuXG4vKipcbiAqIEdlbmVyYXRlIHRoZSBET1MgcGFydCBvZiB0aGUgZXh0ZXJuYWwgZmlsZSBhdHRyaWJ1dGVzLlxuICogQHBhcmFtIHtPYmplY3R9IGRvc1Blcm1pc3Npb25zIHRoZSBkb3MgcGVybWlzc2lvbnMgb3IgbnVsbC5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gaXNEaXIgdHJ1ZSBpZiB0aGUgZW50cnkgaXMgYSBkaXJlY3RvcnksIGZhbHNlIG90aGVyd2lzZS5cbiAqIEByZXR1cm4ge051bWJlcn0gYSAzMiBiaXQgaW50ZWdlci5cbiAqXG4gKiBCaXQgMCAgICAgUmVhZC1Pbmx5XG4gKiBCaXQgMSAgICAgSGlkZGVuXG4gKiBCaXQgMiAgICAgU3lzdGVtXG4gKiBCaXQgMyAgICAgVm9sdW1lIExhYmVsXG4gKiBCaXQgNCAgICAgRGlyZWN0b3J5XG4gKiBCaXQgNSAgICAgQXJjaGl2ZVxuICovXG52YXIgZ2VuZXJhdGVEb3NFeHRlcm5hbEZpbGVBdHRyID0gZnVuY3Rpb24gKGRvc1Blcm1pc3Npb25zKSB7XG4gICAgLy8gdGhlIGRpciBmbGFnIGlzIGFscmVhZHkgc2V0IGZvciBjb21wYXRpYmlsaXR5XG4gICAgcmV0dXJuIChkb3NQZXJtaXNzaW9ucyB8fCAwKSAgJiAweDNGO1xufTtcblxuLyoqXG4gKiBHZW5lcmF0ZSB0aGUgdmFyaW91cyBwYXJ0cyB1c2VkIGluIHRoZSBjb25zdHJ1Y3Rpb24gb2YgdGhlIGZpbmFsIHppcCBmaWxlLlxuICogQHBhcmFtIHtPYmplY3R9IHN0cmVhbUluZm8gdGhlIGhhc2ggd2l0aCBpbmZvcm1hdGlvbiBhYm91dCB0aGUgY29tcHJlc3NlZCBmaWxlLlxuICogQHBhcmFtIHtCb29sZWFufSBzdHJlYW1lZENvbnRlbnQgaXMgdGhlIGNvbnRlbnQgc3RyZWFtZWQgP1xuICogQHBhcmFtIHtCb29sZWFufSBzdHJlYW1pbmdFbmRlZCBpcyB0aGUgc3RyZWFtIGZpbmlzaGVkID9cbiAqIEBwYXJhbSB7bnVtYmVyfSBvZmZzZXQgdGhlIGN1cnJlbnQgb2Zmc2V0IGZyb20gdGhlIHN0YXJ0IG9mIHRoZSB6aXAgZmlsZS5cbiAqIEBwYXJhbSB7U3RyaW5nfSBwbGF0Zm9ybSBsZXQncyBwcmV0ZW5kIHdlIGFyZSB0aGlzIHBsYXRmb3JtIChjaGFuZ2UgcGxhdGZvcm0gZGVwZW5kZW50cyBmaWVsZHMpXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBlbmNvZGVGaWxlTmFtZSB0aGUgZnVuY3Rpb24gdG8gZW5jb2RlIHRoZSBmaWxlIG5hbWUgLyBjb21tZW50LlxuICogQHJldHVybiB7T2JqZWN0fSB0aGUgemlwIHBhcnRzLlxuICovXG52YXIgZ2VuZXJhdGVaaXBQYXJ0cyA9IGZ1bmN0aW9uKHN0cmVhbUluZm8sIHN0cmVhbWVkQ29udGVudCwgc3RyZWFtaW5nRW5kZWQsIG9mZnNldCwgcGxhdGZvcm0sIGVuY29kZUZpbGVOYW1lKSB7XG4gICAgdmFyIGZpbGUgPSBzdHJlYW1JbmZvW1wiZmlsZVwiXSxcbiAgICAgICAgY29tcHJlc3Npb24gPSBzdHJlYW1JbmZvW1wiY29tcHJlc3Npb25cIl0sXG4gICAgICAgIHVzZUN1c3RvbUVuY29kaW5nID0gZW5jb2RlRmlsZU5hbWUgIT09IHV0ZjgudXRmOGVuY29kZSxcbiAgICAgICAgZW5jb2RlZEZpbGVOYW1lID0gdXRpbHMudHJhbnNmb3JtVG8oXCJzdHJpbmdcIiwgZW5jb2RlRmlsZU5hbWUoZmlsZS5uYW1lKSksXG4gICAgICAgIHV0ZkVuY29kZWRGaWxlTmFtZSA9IHV0aWxzLnRyYW5zZm9ybVRvKFwic3RyaW5nXCIsIHV0ZjgudXRmOGVuY29kZShmaWxlLm5hbWUpKSxcbiAgICAgICAgY29tbWVudCA9IGZpbGUuY29tbWVudCxcbiAgICAgICAgZW5jb2RlZENvbW1lbnQgPSB1dGlscy50cmFuc2Zvcm1UbyhcInN0cmluZ1wiLCBlbmNvZGVGaWxlTmFtZShjb21tZW50KSksXG4gICAgICAgIHV0ZkVuY29kZWRDb21tZW50ID0gdXRpbHMudHJhbnNmb3JtVG8oXCJzdHJpbmdcIiwgdXRmOC51dGY4ZW5jb2RlKGNvbW1lbnQpKSxcbiAgICAgICAgdXNlVVRGOEZvckZpbGVOYW1lID0gdXRmRW5jb2RlZEZpbGVOYW1lLmxlbmd0aCAhPT0gZmlsZS5uYW1lLmxlbmd0aCxcbiAgICAgICAgdXNlVVRGOEZvckNvbW1lbnQgPSB1dGZFbmNvZGVkQ29tbWVudC5sZW5ndGggIT09IGNvbW1lbnQubGVuZ3RoLFxuICAgICAgICBkb3NUaW1lLFxuICAgICAgICBkb3NEYXRlLFxuICAgICAgICBleHRyYUZpZWxkcyA9IFwiXCIsXG4gICAgICAgIHVuaWNvZGVQYXRoRXh0cmFGaWVsZCA9IFwiXCIsXG4gICAgICAgIHVuaWNvZGVDb21tZW50RXh0cmFGaWVsZCA9IFwiXCIsXG4gICAgICAgIGRpciA9IGZpbGUuZGlyLFxuICAgICAgICBkYXRlID0gZmlsZS5kYXRlO1xuXG5cbiAgICB2YXIgZGF0YUluZm8gPSB7XG4gICAgICAgIGNyYzMyIDogMCxcbiAgICAgICAgY29tcHJlc3NlZFNpemUgOiAwLFxuICAgICAgICB1bmNvbXByZXNzZWRTaXplIDogMFxuICAgIH07XG5cbiAgICAvLyBpZiB0aGUgY29udGVudCBpcyBzdHJlYW1lZCwgdGhlIHNpemVzL2NyYzMyIGFyZSBvbmx5IGF2YWlsYWJsZSBBRlRFUlxuICAgIC8vIHRoZSBlbmQgb2YgdGhlIHN0cmVhbS5cbiAgICBpZiAoIXN0cmVhbWVkQ29udGVudCB8fCBzdHJlYW1pbmdFbmRlZCkge1xuICAgICAgICBkYXRhSW5mby5jcmMzMiA9IHN0cmVhbUluZm9bXCJjcmMzMlwiXTtcbiAgICAgICAgZGF0YUluZm8uY29tcHJlc3NlZFNpemUgPSBzdHJlYW1JbmZvW1wiY29tcHJlc3NlZFNpemVcIl07XG4gICAgICAgIGRhdGFJbmZvLnVuY29tcHJlc3NlZFNpemUgPSBzdHJlYW1JbmZvW1widW5jb21wcmVzc2VkU2l6ZVwiXTtcbiAgICB9XG5cbiAgICB2YXIgYml0ZmxhZyA9IDA7XG4gICAgaWYgKHN0cmVhbWVkQ29udGVudCkge1xuICAgICAgICAvLyBCaXQgMzogdGhlIHNpemVzL2NyYzMyIGFyZSBzZXQgdG8gemVybyBpbiB0aGUgbG9jYWwgaGVhZGVyLlxuICAgICAgICAvLyBUaGUgY29ycmVjdCB2YWx1ZXMgYXJlIHB1dCBpbiB0aGUgZGF0YSBkZXNjcmlwdG9yIGltbWVkaWF0ZWx5XG4gICAgICAgIC8vIGZvbGxvd2luZyB0aGUgY29tcHJlc3NlZCBkYXRhLlxuICAgICAgICBiaXRmbGFnIHw9IDB4MDAwODtcbiAgICB9XG4gICAgaWYgKCF1c2VDdXN0b21FbmNvZGluZyAmJiAodXNlVVRGOEZvckZpbGVOYW1lIHx8IHVzZVVURjhGb3JDb21tZW50KSkge1xuICAgICAgICAvLyBCaXQgMTE6IExhbmd1YWdlIGVuY29kaW5nIGZsYWcgKEVGUykuXG4gICAgICAgIGJpdGZsYWcgfD0gMHgwODAwO1xuICAgIH1cblxuXG4gICAgdmFyIGV4dEZpbGVBdHRyID0gMDtcbiAgICB2YXIgdmVyc2lvbk1hZGVCeSA9IDA7XG4gICAgaWYgKGRpcikge1xuICAgICAgICAvLyBkb3Mgb3IgdW5peCwgd2Ugc2V0IHRoZSBkb3MgZGlyIGZsYWdcbiAgICAgICAgZXh0RmlsZUF0dHIgfD0gMHgwMDAxMDtcbiAgICB9XG4gICAgaWYocGxhdGZvcm0gPT09IFwiVU5JWFwiKSB7XG4gICAgICAgIHZlcnNpb25NYWRlQnkgPSAweDAzMUU7IC8vIFVOSVgsIHZlcnNpb24gMy4wXG4gICAgICAgIGV4dEZpbGVBdHRyIHw9IGdlbmVyYXRlVW5peEV4dGVybmFsRmlsZUF0dHIoZmlsZS51bml4UGVybWlzc2lvbnMsIGRpcik7XG4gICAgfSBlbHNlIHsgLy8gRE9TIG9yIG90aGVyLCBmYWxsYmFjayB0byBET1NcbiAgICAgICAgdmVyc2lvbk1hZGVCeSA9IDB4MDAxNDsgLy8gRE9TLCB2ZXJzaW9uIDIuMFxuICAgICAgICBleHRGaWxlQXR0ciB8PSBnZW5lcmF0ZURvc0V4dGVybmFsRmlsZUF0dHIoZmlsZS5kb3NQZXJtaXNzaW9ucyk7XG4gICAgfVxuXG4gICAgLy8gZGF0ZVxuICAgIC8vIEBzZWUgaHR0cDovL3d3dy5kZWxvcmllLmNvbS9kamdwcC9kb2MvcmJpbnRlci9pdC81Mi8xMy5odG1sXG4gICAgLy8gQHNlZSBodHRwOi8vd3d3LmRlbG9yaWUuY29tL2RqZ3BwL2RvYy9yYmludGVyL2l0LzY1LzE2Lmh0bWxcbiAgICAvLyBAc2VlIGh0dHA6Ly93d3cuZGVsb3JpZS5jb20vZGpncHAvZG9jL3JiaW50ZXIvaXQvNjYvMTYuaHRtbFxuXG4gICAgZG9zVGltZSA9IGRhdGUuZ2V0VVRDSG91cnMoKTtcbiAgICBkb3NUaW1lID0gZG9zVGltZSA8PCA2O1xuICAgIGRvc1RpbWUgPSBkb3NUaW1lIHwgZGF0ZS5nZXRVVENNaW51dGVzKCk7XG4gICAgZG9zVGltZSA9IGRvc1RpbWUgPDwgNTtcbiAgICBkb3NUaW1lID0gZG9zVGltZSB8IGRhdGUuZ2V0VVRDU2Vjb25kcygpIC8gMjtcblxuICAgIGRvc0RhdGUgPSBkYXRlLmdldFVUQ0Z1bGxZZWFyKCkgLSAxOTgwO1xuICAgIGRvc0RhdGUgPSBkb3NEYXRlIDw8IDQ7XG4gICAgZG9zRGF0ZSA9IGRvc0RhdGUgfCAoZGF0ZS5nZXRVVENNb250aCgpICsgMSk7XG4gICAgZG9zRGF0ZSA9IGRvc0RhdGUgPDwgNTtcbiAgICBkb3NEYXRlID0gZG9zRGF0ZSB8IGRhdGUuZ2V0VVRDRGF0ZSgpO1xuXG4gICAgaWYgKHVzZVVURjhGb3JGaWxlTmFtZSkge1xuICAgICAgICAvLyBzZXQgdGhlIHVuaWNvZGUgcGF0aCBleHRyYSBmaWVsZC4gdW56aXAgbmVlZHMgYXQgbGVhc3Qgb25lIGV4dHJhXG4gICAgICAgIC8vIGZpZWxkIHRvIGNvcnJlY3RseSBoYW5kbGUgdW5pY29kZSBwYXRoLCBzbyB1c2luZyB0aGUgcGF0aCBpcyBhcyBnb29kXG4gICAgICAgIC8vIGFzIGFueSBvdGhlciBpbmZvcm1hdGlvbi4gVGhpcyBjb3VsZCBpbXByb3ZlIHRoZSBzaXR1YXRpb24gd2l0aFxuICAgICAgICAvLyBvdGhlciBhcmNoaXZlIG1hbmFnZXJzIHRvby5cbiAgICAgICAgLy8gVGhpcyBmaWVsZCBpcyB1c3VhbGx5IHVzZWQgd2l0aG91dCB0aGUgdXRmOCBmbGFnLCB3aXRoIGEgbm9uXG4gICAgICAgIC8vIHVuaWNvZGUgcGF0aCBpbiB0aGUgaGVhZGVyICh3aW5yYXIsIHdpbnppcCkuIFRoaXMgaGVscHMgKGEgYml0KVxuICAgICAgICAvLyB3aXRoIHRoZSBtZXNzeSBXaW5kb3dzJyBkZWZhdWx0IGNvbXByZXNzZWQgZm9sZGVycyBmZWF0dXJlIGJ1dFxuICAgICAgICAvLyBicmVha3Mgb24gcDd6aXAgd2hpY2ggZG9lc24ndCBzZWVrIHRoZSB1bmljb2RlIHBhdGggZXh0cmEgZmllbGQuXG4gICAgICAgIC8vIFNvIGZvciBub3csIFVURi04IGV2ZXJ5d2hlcmUgIVxuICAgICAgICB1bmljb2RlUGF0aEV4dHJhRmllbGQgPVxuICAgICAgICAgICAgLy8gVmVyc2lvblxuICAgICAgICAgICAgZGVjVG9IZXgoMSwgMSkgK1xuICAgICAgICAgICAgLy8gTmFtZUNSQzMyXG4gICAgICAgICAgICBkZWNUb0hleChjcmMzMihlbmNvZGVkRmlsZU5hbWUpLCA0KSArXG4gICAgICAgICAgICAvLyBVbmljb2RlTmFtZVxuICAgICAgICAgICAgdXRmRW5jb2RlZEZpbGVOYW1lO1xuXG4gICAgICAgIGV4dHJhRmllbGRzICs9XG4gICAgICAgICAgICAvLyBJbmZvLVpJUCBVbmljb2RlIFBhdGggRXh0cmEgRmllbGRcbiAgICAgICAgICAgIFwiXFx4NzVcXHg3MFwiICtcbiAgICAgICAgICAgIC8vIHNpemVcbiAgICAgICAgICAgIGRlY1RvSGV4KHVuaWNvZGVQYXRoRXh0cmFGaWVsZC5sZW5ndGgsIDIpICtcbiAgICAgICAgICAgIC8vIGNvbnRlbnRcbiAgICAgICAgICAgIHVuaWNvZGVQYXRoRXh0cmFGaWVsZDtcbiAgICB9XG5cbiAgICBpZih1c2VVVEY4Rm9yQ29tbWVudCkge1xuXG4gICAgICAgIHVuaWNvZGVDb21tZW50RXh0cmFGaWVsZCA9XG4gICAgICAgICAgICAvLyBWZXJzaW9uXG4gICAgICAgICAgICBkZWNUb0hleCgxLCAxKSArXG4gICAgICAgICAgICAvLyBDb21tZW50Q1JDMzJcbiAgICAgICAgICAgIGRlY1RvSGV4KGNyYzMyKGVuY29kZWRDb21tZW50KSwgNCkgK1xuICAgICAgICAgICAgLy8gVW5pY29kZU5hbWVcbiAgICAgICAgICAgIHV0ZkVuY29kZWRDb21tZW50O1xuXG4gICAgICAgIGV4dHJhRmllbGRzICs9XG4gICAgICAgICAgICAvLyBJbmZvLVpJUCBVbmljb2RlIFBhdGggRXh0cmEgRmllbGRcbiAgICAgICAgICAgIFwiXFx4NzVcXHg2M1wiICtcbiAgICAgICAgICAgIC8vIHNpemVcbiAgICAgICAgICAgIGRlY1RvSGV4KHVuaWNvZGVDb21tZW50RXh0cmFGaWVsZC5sZW5ndGgsIDIpICtcbiAgICAgICAgICAgIC8vIGNvbnRlbnRcbiAgICAgICAgICAgIHVuaWNvZGVDb21tZW50RXh0cmFGaWVsZDtcbiAgICB9XG5cbiAgICB2YXIgaGVhZGVyID0gXCJcIjtcblxuICAgIC8vIHZlcnNpb24gbmVlZGVkIHRvIGV4dHJhY3RcbiAgICBoZWFkZXIgKz0gXCJcXHgwQVxceDAwXCI7XG4gICAgLy8gZ2VuZXJhbCBwdXJwb3NlIGJpdCBmbGFnXG4gICAgaGVhZGVyICs9IGRlY1RvSGV4KGJpdGZsYWcsIDIpO1xuICAgIC8vIGNvbXByZXNzaW9uIG1ldGhvZFxuICAgIGhlYWRlciArPSBjb21wcmVzc2lvbi5tYWdpYztcbiAgICAvLyBsYXN0IG1vZCBmaWxlIHRpbWVcbiAgICBoZWFkZXIgKz0gZGVjVG9IZXgoZG9zVGltZSwgMik7XG4gICAgLy8gbGFzdCBtb2QgZmlsZSBkYXRlXG4gICAgaGVhZGVyICs9IGRlY1RvSGV4KGRvc0RhdGUsIDIpO1xuICAgIC8vIGNyYy0zMlxuICAgIGhlYWRlciArPSBkZWNUb0hleChkYXRhSW5mby5jcmMzMiwgNCk7XG4gICAgLy8gY29tcHJlc3NlZCBzaXplXG4gICAgaGVhZGVyICs9IGRlY1RvSGV4KGRhdGFJbmZvLmNvbXByZXNzZWRTaXplLCA0KTtcbiAgICAvLyB1bmNvbXByZXNzZWQgc2l6ZVxuICAgIGhlYWRlciArPSBkZWNUb0hleChkYXRhSW5mby51bmNvbXByZXNzZWRTaXplLCA0KTtcbiAgICAvLyBmaWxlIG5hbWUgbGVuZ3RoXG4gICAgaGVhZGVyICs9IGRlY1RvSGV4KGVuY29kZWRGaWxlTmFtZS5sZW5ndGgsIDIpO1xuICAgIC8vIGV4dHJhIGZpZWxkIGxlbmd0aFxuICAgIGhlYWRlciArPSBkZWNUb0hleChleHRyYUZpZWxkcy5sZW5ndGgsIDIpO1xuXG5cbiAgICB2YXIgZmlsZVJlY29yZCA9IHNpZ25hdHVyZS5MT0NBTF9GSUxFX0hFQURFUiArIGhlYWRlciArIGVuY29kZWRGaWxlTmFtZSArIGV4dHJhRmllbGRzO1xuXG4gICAgdmFyIGRpclJlY29yZCA9IHNpZ25hdHVyZS5DRU5UUkFMX0ZJTEVfSEVBREVSICtcbiAgICAgICAgLy8gdmVyc2lvbiBtYWRlIGJ5ICgwMDogRE9TKVxuICAgICAgICBkZWNUb0hleCh2ZXJzaW9uTWFkZUJ5LCAyKSArXG4gICAgICAgIC8vIGZpbGUgaGVhZGVyIChjb21tb24gdG8gZmlsZSBhbmQgY2VudHJhbCBkaXJlY3RvcnkpXG4gICAgICAgIGhlYWRlciArXG4gICAgICAgIC8vIGZpbGUgY29tbWVudCBsZW5ndGhcbiAgICAgICAgZGVjVG9IZXgoZW5jb2RlZENvbW1lbnQubGVuZ3RoLCAyKSArXG4gICAgICAgIC8vIGRpc2sgbnVtYmVyIHN0YXJ0XG4gICAgICAgIFwiXFx4MDBcXHgwMFwiICtcbiAgICAgICAgLy8gaW50ZXJuYWwgZmlsZSBhdHRyaWJ1dGVzIFRPRE9cbiAgICAgICAgXCJcXHgwMFxceDAwXCIgK1xuICAgICAgICAvLyBleHRlcm5hbCBmaWxlIGF0dHJpYnV0ZXNcbiAgICAgICAgZGVjVG9IZXgoZXh0RmlsZUF0dHIsIDQpICtcbiAgICAgICAgLy8gcmVsYXRpdmUgb2Zmc2V0IG9mIGxvY2FsIGhlYWRlclxuICAgICAgICBkZWNUb0hleChvZmZzZXQsIDQpICtcbiAgICAgICAgLy8gZmlsZSBuYW1lXG4gICAgICAgIGVuY29kZWRGaWxlTmFtZSArXG4gICAgICAgIC8vIGV4dHJhIGZpZWxkXG4gICAgICAgIGV4dHJhRmllbGRzICtcbiAgICAgICAgLy8gZmlsZSBjb21tZW50XG4gICAgICAgIGVuY29kZWRDb21tZW50O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZmlsZVJlY29yZDogZmlsZVJlY29yZCxcbiAgICAgICAgZGlyUmVjb3JkOiBkaXJSZWNvcmRcbiAgICB9O1xufTtcblxuLyoqXG4gKiBHZW5lcmF0ZSB0aGUgRU9DRCByZWNvcmQuXG4gKiBAcGFyYW0ge051bWJlcn0gZW50cmllc0NvdW50IHRoZSBudW1iZXIgb2YgZW50cmllcyBpbiB0aGUgemlwIGZpbGUuXG4gKiBAcGFyYW0ge051bWJlcn0gY2VudHJhbERpckxlbmd0aCB0aGUgbGVuZ3RoIChpbiBieXRlcykgb2YgdGhlIGNlbnRyYWwgZGlyLlxuICogQHBhcmFtIHtOdW1iZXJ9IGxvY2FsRGlyTGVuZ3RoIHRoZSBsZW5ndGggKGluIGJ5dGVzKSBvZiB0aGUgbG9jYWwgZGlyLlxuICogQHBhcmFtIHtTdHJpbmd9IGNvbW1lbnQgdGhlIHppcCBmaWxlIGNvbW1lbnQgYXMgYSBiaW5hcnkgc3RyaW5nLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZW5jb2RlRmlsZU5hbWUgdGhlIGZ1bmN0aW9uIHRvIGVuY29kZSB0aGUgY29tbWVudC5cbiAqIEByZXR1cm4ge1N0cmluZ30gdGhlIEVPQ0QgcmVjb3JkLlxuICovXG52YXIgZ2VuZXJhdGVDZW50cmFsRGlyZWN0b3J5RW5kID0gZnVuY3Rpb24gKGVudHJpZXNDb3VudCwgY2VudHJhbERpckxlbmd0aCwgbG9jYWxEaXJMZW5ndGgsIGNvbW1lbnQsIGVuY29kZUZpbGVOYW1lKSB7XG4gICAgdmFyIGRpckVuZCA9IFwiXCI7XG4gICAgdmFyIGVuY29kZWRDb21tZW50ID0gdXRpbHMudHJhbnNmb3JtVG8oXCJzdHJpbmdcIiwgZW5jb2RlRmlsZU5hbWUoY29tbWVudCkpO1xuXG4gICAgLy8gZW5kIG9mIGNlbnRyYWwgZGlyIHNpZ25hdHVyZVxuICAgIGRpckVuZCA9IHNpZ25hdHVyZS5DRU5UUkFMX0RJUkVDVE9SWV9FTkQgK1xuICAgICAgICAvLyBudW1iZXIgb2YgdGhpcyBkaXNrXG4gICAgICAgIFwiXFx4MDBcXHgwMFwiICtcbiAgICAgICAgLy8gbnVtYmVyIG9mIHRoZSBkaXNrIHdpdGggdGhlIHN0YXJ0IG9mIHRoZSBjZW50cmFsIGRpcmVjdG9yeVxuICAgICAgICBcIlxceDAwXFx4MDBcIiArXG4gICAgICAgIC8vIHRvdGFsIG51bWJlciBvZiBlbnRyaWVzIGluIHRoZSBjZW50cmFsIGRpcmVjdG9yeSBvbiB0aGlzIGRpc2tcbiAgICAgICAgZGVjVG9IZXgoZW50cmllc0NvdW50LCAyKSArXG4gICAgICAgIC8vIHRvdGFsIG51bWJlciBvZiBlbnRyaWVzIGluIHRoZSBjZW50cmFsIGRpcmVjdG9yeVxuICAgICAgICBkZWNUb0hleChlbnRyaWVzQ291bnQsIDIpICtcbiAgICAgICAgLy8gc2l6ZSBvZiB0aGUgY2VudHJhbCBkaXJlY3RvcnkgICA0IGJ5dGVzXG4gICAgICAgIGRlY1RvSGV4KGNlbnRyYWxEaXJMZW5ndGgsIDQpICtcbiAgICAgICAgLy8gb2Zmc2V0IG9mIHN0YXJ0IG9mIGNlbnRyYWwgZGlyZWN0b3J5IHdpdGggcmVzcGVjdCB0byB0aGUgc3RhcnRpbmcgZGlzayBudW1iZXJcbiAgICAgICAgZGVjVG9IZXgobG9jYWxEaXJMZW5ndGgsIDQpICtcbiAgICAgICAgLy8gLlpJUCBmaWxlIGNvbW1lbnQgbGVuZ3RoXG4gICAgICAgIGRlY1RvSGV4KGVuY29kZWRDb21tZW50Lmxlbmd0aCwgMikgK1xuICAgICAgICAvLyAuWklQIGZpbGUgY29tbWVudFxuICAgICAgICBlbmNvZGVkQ29tbWVudDtcblxuICAgIHJldHVybiBkaXJFbmQ7XG59O1xuXG4vKipcbiAqIEdlbmVyYXRlIGRhdGEgZGVzY3JpcHRvcnMgZm9yIGEgZmlsZSBlbnRyeS5cbiAqIEBwYXJhbSB7T2JqZWN0fSBzdHJlYW1JbmZvIHRoZSBoYXNoIGdlbmVyYXRlZCBieSBhIHdvcmtlciwgY29udGFpbmluZyBpbmZvcm1hdGlvblxuICogb24gdGhlIGZpbGUgZW50cnkuXG4gKiBAcmV0dXJuIHtTdHJpbmd9IHRoZSBkYXRhIGRlc2NyaXB0b3JzLlxuICovXG52YXIgZ2VuZXJhdGVEYXRhRGVzY3JpcHRvcnMgPSBmdW5jdGlvbiAoc3RyZWFtSW5mbykge1xuICAgIHZhciBkZXNjcmlwdG9yID0gXCJcIjtcbiAgICBkZXNjcmlwdG9yID0gc2lnbmF0dXJlLkRBVEFfREVTQ1JJUFRPUiArXG4gICAgICAgIC8vIGNyYy0zMiAgICAgICAgICAgICAgICAgICAgICAgICAgNCBieXRlc1xuICAgICAgICBkZWNUb0hleChzdHJlYW1JbmZvW1wiY3JjMzJcIl0sIDQpICtcbiAgICAgICAgLy8gY29tcHJlc3NlZCBzaXplICAgICAgICAgICAgICAgICA0IGJ5dGVzXG4gICAgICAgIGRlY1RvSGV4KHN0cmVhbUluZm9bXCJjb21wcmVzc2VkU2l6ZVwiXSwgNCkgK1xuICAgICAgICAvLyB1bmNvbXByZXNzZWQgc2l6ZSAgICAgICAgICAgICAgIDQgYnl0ZXNcbiAgICAgICAgZGVjVG9IZXgoc3RyZWFtSW5mb1tcInVuY29tcHJlc3NlZFNpemVcIl0sIDQpO1xuXG4gICAgcmV0dXJuIGRlc2NyaXB0b3I7XG59O1xuXG5cbi8qKlxuICogQSB3b3JrZXIgdG8gY29uY2F0ZW5hdGUgb3RoZXIgd29ya2VycyB0byBjcmVhdGUgYSB6aXAgZmlsZS5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gc3RyZWFtRmlsZXMgYHRydWVgIHRvIHN0cmVhbSB0aGUgY29udGVudCBvZiB0aGUgZmlsZXMsXG4gKiBgZmFsc2VgIHRvIGFjY3VtdWxhdGUgaXQuXG4gKiBAcGFyYW0ge1N0cmluZ30gY29tbWVudCB0aGUgY29tbWVudCB0byB1c2UuXG4gKiBAcGFyYW0ge1N0cmluZ30gcGxhdGZvcm0gdGhlIHBsYXRmb3JtIHRvIHVzZSwgXCJVTklYXCIgb3IgXCJET1NcIi5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGVuY29kZUZpbGVOYW1lIHRoZSBmdW5jdGlvbiB0byBlbmNvZGUgZmlsZSBuYW1lcyBhbmQgY29tbWVudHMuXG4gKi9cbmZ1bmN0aW9uIFppcEZpbGVXb3JrZXIoc3RyZWFtRmlsZXMsIGNvbW1lbnQsIHBsYXRmb3JtLCBlbmNvZGVGaWxlTmFtZSkge1xuICAgIEdlbmVyaWNXb3JrZXIuY2FsbCh0aGlzLCBcIlppcEZpbGVXb3JrZXJcIik7XG4gICAgLy8gVGhlIG51bWJlciBvZiBieXRlcyB3cml0dGVuIHNvIGZhci4gVGhpcyBkb2Vzbid0IGNvdW50IGFjY3VtdWxhdGVkIGNodW5rcy5cbiAgICB0aGlzLmJ5dGVzV3JpdHRlbiA9IDA7XG4gICAgLy8gVGhlIGNvbW1lbnQgb2YgdGhlIHppcCBmaWxlXG4gICAgdGhpcy56aXBDb21tZW50ID0gY29tbWVudDtcbiAgICAvLyBUaGUgcGxhdGZvcm0gXCJnZW5lcmF0aW5nXCIgdGhlIHppcCBmaWxlLlxuICAgIHRoaXMuemlwUGxhdGZvcm0gPSBwbGF0Zm9ybTtcbiAgICAvLyB0aGUgZnVuY3Rpb24gdG8gZW5jb2RlIGZpbGUgbmFtZXMgYW5kIGNvbW1lbnRzLlxuICAgIHRoaXMuZW5jb2RlRmlsZU5hbWUgPSBlbmNvZGVGaWxlTmFtZTtcbiAgICAvLyBTaG91bGQgd2Ugc3RyZWFtIHRoZSBjb250ZW50IG9mIHRoZSBmaWxlcyA/XG4gICAgdGhpcy5zdHJlYW1GaWxlcyA9IHN0cmVhbUZpbGVzO1xuICAgIC8vIElmIGBzdHJlYW1GaWxlc2AgaXMgZmFsc2UsIHdlIHdpbGwgbmVlZCB0byBhY2N1bXVsYXRlIHRoZSBjb250ZW50IG9mIHRoZVxuICAgIC8vIGZpbGVzIHRvIGNhbGN1bGF0ZSBzaXplcyAvIGNyYzMyIChhbmQgd3JpdGUgdGhlbSAqYmVmb3JlKiB0aGUgY29udGVudCkuXG4gICAgLy8gVGhpcyBib29sZWFuIGluZGljYXRlcyBpZiB3ZSBhcmUgYWNjdW11bGF0aW5nIGNodW5rcyAoaXQgd2lsbCBjaGFuZ2UgYSBsb3RcbiAgICAvLyBkdXJpbmcgdGhlIGxpZmV0aW1lIG9mIHRoaXMgd29ya2VyKS5cbiAgICB0aGlzLmFjY3VtdWxhdGUgPSBmYWxzZTtcbiAgICAvLyBUaGUgYnVmZmVyIHJlY2VpdmluZyBjaHVua3Mgd2hlbiBhY2N1bXVsYXRpbmcgY29udGVudC5cbiAgICB0aGlzLmNvbnRlbnRCdWZmZXIgPSBbXTtcbiAgICAvLyBUaGUgbGlzdCBvZiBnZW5lcmF0ZWQgZGlyZWN0b3J5IHJlY29yZHMuXG4gICAgdGhpcy5kaXJSZWNvcmRzID0gW107XG4gICAgLy8gVGhlIG9mZnNldCAoaW4gYnl0ZXMpIGZyb20gdGhlIGJlZ2lubmluZyBvZiB0aGUgemlwIGZpbGUgZm9yIHRoZSBjdXJyZW50IHNvdXJjZS5cbiAgICB0aGlzLmN1cnJlbnRTb3VyY2VPZmZzZXQgPSAwO1xuICAgIC8vIFRoZSB0b3RhbCBudW1iZXIgb2YgZW50cmllcyBpbiB0aGlzIHppcCBmaWxlLlxuICAgIHRoaXMuZW50cmllc0NvdW50ID0gMDtcbiAgICAvLyB0aGUgbmFtZSBvZiB0aGUgZmlsZSBjdXJyZW50bHkgYmVpbmcgYWRkZWQsIG51bGwgd2hlbiBoYW5kbGluZyB0aGUgZW5kIG9mIHRoZSB6aXAgZmlsZS5cbiAgICAvLyBVc2VkIGZvciB0aGUgZW1pdHRlZCBtZXRhZGF0YS5cbiAgICB0aGlzLmN1cnJlbnRGaWxlID0gbnVsbDtcblxuXG5cbiAgICB0aGlzLl9zb3VyY2VzID0gW107XG59XG51dGlscy5pbmhlcml0cyhaaXBGaWxlV29ya2VyLCBHZW5lcmljV29ya2VyKTtcblxuLyoqXG4gKiBAc2VlIEdlbmVyaWNXb3JrZXIucHVzaFxuICovXG5aaXBGaWxlV29ya2VyLnByb3RvdHlwZS5wdXNoID0gZnVuY3Rpb24gKGNodW5rKSB7XG5cbiAgICB2YXIgY3VycmVudEZpbGVQZXJjZW50ID0gY2h1bmsubWV0YS5wZXJjZW50IHx8IDA7XG4gICAgdmFyIGVudHJpZXNDb3VudCA9IHRoaXMuZW50cmllc0NvdW50O1xuICAgIHZhciByZW1haW5pbmdGaWxlcyA9IHRoaXMuX3NvdXJjZXMubGVuZ3RoO1xuXG4gICAgaWYodGhpcy5hY2N1bXVsYXRlKSB7XG4gICAgICAgIHRoaXMuY29udGVudEJ1ZmZlci5wdXNoKGNodW5rKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmJ5dGVzV3JpdHRlbiArPSBjaHVuay5kYXRhLmxlbmd0aDtcblxuICAgICAgICBHZW5lcmljV29ya2VyLnByb3RvdHlwZS5wdXNoLmNhbGwodGhpcywge1xuICAgICAgICAgICAgZGF0YSA6IGNodW5rLmRhdGEsXG4gICAgICAgICAgICBtZXRhIDoge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRGaWxlIDogdGhpcy5jdXJyZW50RmlsZSxcbiAgICAgICAgICAgICAgICBwZXJjZW50IDogZW50cmllc0NvdW50ID8gKGN1cnJlbnRGaWxlUGVyY2VudCArIDEwMCAqIChlbnRyaWVzQ291bnQgLSByZW1haW5pbmdGaWxlcyAtIDEpKSAvIGVudHJpZXNDb3VudCA6IDEwMFxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59O1xuXG4vKipcbiAqIFRoZSB3b3JrZXIgc3RhcnRlZCBhIG5ldyBzb3VyY2UgKGFuIG90aGVyIHdvcmtlcikuXG4gKiBAcGFyYW0ge09iamVjdH0gc3RyZWFtSW5mbyB0aGUgc3RyZWFtSW5mbyBvYmplY3QgZnJvbSB0aGUgbmV3IHNvdXJjZS5cbiAqL1xuWmlwRmlsZVdvcmtlci5wcm90b3R5cGUub3BlbmVkU291cmNlID0gZnVuY3Rpb24gKHN0cmVhbUluZm8pIHtcbiAgICB0aGlzLmN1cnJlbnRTb3VyY2VPZmZzZXQgPSB0aGlzLmJ5dGVzV3JpdHRlbjtcbiAgICB0aGlzLmN1cnJlbnRGaWxlID0gc3RyZWFtSW5mb1tcImZpbGVcIl0ubmFtZTtcblxuICAgIHZhciBzdHJlYW1lZENvbnRlbnQgPSB0aGlzLnN0cmVhbUZpbGVzICYmICFzdHJlYW1JbmZvW1wiZmlsZVwiXS5kaXI7XG5cbiAgICAvLyBkb24ndCBzdHJlYW0gZm9sZGVycyAoYmVjYXVzZSB0aGV5IGRvbid0IGhhdmUgYW55IGNvbnRlbnQpXG4gICAgaWYoc3RyZWFtZWRDb250ZW50KSB7XG4gICAgICAgIHZhciByZWNvcmQgPSBnZW5lcmF0ZVppcFBhcnRzKHN0cmVhbUluZm8sIHN0cmVhbWVkQ29udGVudCwgZmFsc2UsIHRoaXMuY3VycmVudFNvdXJjZU9mZnNldCwgdGhpcy56aXBQbGF0Zm9ybSwgdGhpcy5lbmNvZGVGaWxlTmFtZSk7XG4gICAgICAgIHRoaXMucHVzaCh7XG4gICAgICAgICAgICBkYXRhIDogcmVjb3JkLmZpbGVSZWNvcmQsXG4gICAgICAgICAgICBtZXRhIDoge3BlcmNlbnQ6MH1cbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gd2UgbmVlZCB0byB3YWl0IGZvciB0aGUgd2hvbGUgZmlsZSBiZWZvcmUgcHVzaGluZyBhbnl0aGluZ1xuICAgICAgICB0aGlzLmFjY3VtdWxhdGUgPSB0cnVlO1xuICAgIH1cbn07XG5cbi8qKlxuICogVGhlIHdvcmtlciBmaW5pc2hlZCBhIHNvdXJjZSAoYW4gb3RoZXIgd29ya2VyKS5cbiAqIEBwYXJhbSB7T2JqZWN0fSBzdHJlYW1JbmZvIHRoZSBzdHJlYW1JbmZvIG9iamVjdCBmcm9tIHRoZSBmaW5pc2hlZCBzb3VyY2UuXG4gKi9cblppcEZpbGVXb3JrZXIucHJvdG90eXBlLmNsb3NlZFNvdXJjZSA9IGZ1bmN0aW9uIChzdHJlYW1JbmZvKSB7XG4gICAgdGhpcy5hY2N1bXVsYXRlID0gZmFsc2U7XG4gICAgdmFyIHN0cmVhbWVkQ29udGVudCA9IHRoaXMuc3RyZWFtRmlsZXMgJiYgIXN0cmVhbUluZm9bXCJmaWxlXCJdLmRpcjtcbiAgICB2YXIgcmVjb3JkID0gZ2VuZXJhdGVaaXBQYXJ0cyhzdHJlYW1JbmZvLCBzdHJlYW1lZENvbnRlbnQsIHRydWUsIHRoaXMuY3VycmVudFNvdXJjZU9mZnNldCwgdGhpcy56aXBQbGF0Zm9ybSwgdGhpcy5lbmNvZGVGaWxlTmFtZSk7XG5cbiAgICB0aGlzLmRpclJlY29yZHMucHVzaChyZWNvcmQuZGlyUmVjb3JkKTtcbiAgICBpZihzdHJlYW1lZENvbnRlbnQpIHtcbiAgICAgICAgLy8gYWZ0ZXIgdGhlIHN0cmVhbWVkIGZpbGUsIHdlIHB1dCBkYXRhIGRlc2NyaXB0b3JzXG4gICAgICAgIHRoaXMucHVzaCh7XG4gICAgICAgICAgICBkYXRhIDogZ2VuZXJhdGVEYXRhRGVzY3JpcHRvcnMoc3RyZWFtSW5mbyksXG4gICAgICAgICAgICBtZXRhIDoge3BlcmNlbnQ6MTAwfVxuICAgICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyB0aGUgY29udGVudCB3YXNuJ3Qgc3RyZWFtZWQsIHdlIG5lZWQgdG8gcHVzaCBldmVyeXRoaW5nIG5vd1xuICAgICAgICAvLyBmaXJzdCB0aGUgZmlsZSByZWNvcmQsIHRoZW4gdGhlIGNvbnRlbnRcbiAgICAgICAgdGhpcy5wdXNoKHtcbiAgICAgICAgICAgIGRhdGEgOiByZWNvcmQuZmlsZVJlY29yZCxcbiAgICAgICAgICAgIG1ldGEgOiB7cGVyY2VudDowfVxuICAgICAgICB9KTtcbiAgICAgICAgd2hpbGUodGhpcy5jb250ZW50QnVmZmVyLmxlbmd0aCkge1xuICAgICAgICAgICAgdGhpcy5wdXNoKHRoaXMuY29udGVudEJ1ZmZlci5zaGlmdCgpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmN1cnJlbnRGaWxlID0gbnVsbDtcbn07XG5cbi8qKlxuICogQHNlZSBHZW5lcmljV29ya2VyLmZsdXNoXG4gKi9cblppcEZpbGVXb3JrZXIucHJvdG90eXBlLmZsdXNoID0gZnVuY3Rpb24gKCkge1xuXG4gICAgdmFyIGxvY2FsRGlyTGVuZ3RoID0gdGhpcy5ieXRlc1dyaXR0ZW47XG4gICAgZm9yKHZhciBpID0gMDsgaSA8IHRoaXMuZGlyUmVjb3Jkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB0aGlzLnB1c2goe1xuICAgICAgICAgICAgZGF0YSA6IHRoaXMuZGlyUmVjb3Jkc1tpXSxcbiAgICAgICAgICAgIG1ldGEgOiB7cGVyY2VudDoxMDB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICB2YXIgY2VudHJhbERpckxlbmd0aCA9IHRoaXMuYnl0ZXNXcml0dGVuIC0gbG9jYWxEaXJMZW5ndGg7XG5cbiAgICB2YXIgZGlyRW5kID0gZ2VuZXJhdGVDZW50cmFsRGlyZWN0b3J5RW5kKHRoaXMuZGlyUmVjb3Jkcy5sZW5ndGgsIGNlbnRyYWxEaXJMZW5ndGgsIGxvY2FsRGlyTGVuZ3RoLCB0aGlzLnppcENvbW1lbnQsIHRoaXMuZW5jb2RlRmlsZU5hbWUpO1xuXG4gICAgdGhpcy5wdXNoKHtcbiAgICAgICAgZGF0YSA6IGRpckVuZCxcbiAgICAgICAgbWV0YSA6IHtwZXJjZW50OjEwMH1cbiAgICB9KTtcbn07XG5cbi8qKlxuICogUHJlcGFyZSB0aGUgbmV4dCBzb3VyY2UgdG8gYmUgcmVhZC5cbiAqL1xuWmlwRmlsZVdvcmtlci5wcm90b3R5cGUucHJlcGFyZU5leHRTb3VyY2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5wcmV2aW91cyA9IHRoaXMuX3NvdXJjZXMuc2hpZnQoKTtcbiAgICB0aGlzLm9wZW5lZFNvdXJjZSh0aGlzLnByZXZpb3VzLnN0cmVhbUluZm8pO1xuICAgIGlmICh0aGlzLmlzUGF1c2VkKSB7XG4gICAgICAgIHRoaXMucHJldmlvdXMucGF1c2UoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnByZXZpb3VzLnJlc3VtZSgpO1xuICAgIH1cbn07XG5cbi8qKlxuICogQHNlZSBHZW5lcmljV29ya2VyLnJlZ2lzdGVyUHJldmlvdXNcbiAqL1xuWmlwRmlsZVdvcmtlci5wcm90b3R5cGUucmVnaXN0ZXJQcmV2aW91cyA9IGZ1bmN0aW9uIChwcmV2aW91cykge1xuICAgIHRoaXMuX3NvdXJjZXMucHVzaChwcmV2aW91cyk7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgcHJldmlvdXMub24oXCJkYXRhXCIsIGZ1bmN0aW9uIChjaHVuaykge1xuICAgICAgICBzZWxmLnByb2Nlc3NDaHVuayhjaHVuayk7XG4gICAgfSk7XG4gICAgcHJldmlvdXMub24oXCJlbmRcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICBzZWxmLmNsb3NlZFNvdXJjZShzZWxmLnByZXZpb3VzLnN0cmVhbUluZm8pO1xuICAgICAgICBpZihzZWxmLl9zb3VyY2VzLmxlbmd0aCkge1xuICAgICAgICAgICAgc2VsZi5wcmVwYXJlTmV4dFNvdXJjZSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VsZi5lbmQoKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHByZXZpb3VzLm9uKFwiZXJyb3JcIiwgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgc2VsZi5lcnJvcihlKTtcbiAgICB9KTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQHNlZSBHZW5lcmljV29ya2VyLnJlc3VtZVxuICovXG5aaXBGaWxlV29ya2VyLnByb3RvdHlwZS5yZXN1bWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYoIUdlbmVyaWNXb3JrZXIucHJvdG90eXBlLnJlc3VtZS5jYWxsKHRoaXMpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMucHJldmlvdXMgJiYgdGhpcy5fc291cmNlcy5sZW5ndGgpIHtcbiAgICAgICAgdGhpcy5wcmVwYXJlTmV4dFNvdXJjZSgpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKCF0aGlzLnByZXZpb3VzICYmICF0aGlzLl9zb3VyY2VzLmxlbmd0aCAmJiAhdGhpcy5nZW5lcmF0ZWRFcnJvcikge1xuICAgICAgICB0aGlzLmVuZCgpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG59O1xuXG4vKipcbiAqIEBzZWUgR2VuZXJpY1dvcmtlci5lcnJvclxuICovXG5aaXBGaWxlV29ya2VyLnByb3RvdHlwZS5lcnJvciA9IGZ1bmN0aW9uIChlKSB7XG4gICAgdmFyIHNvdXJjZXMgPSB0aGlzLl9zb3VyY2VzO1xuICAgIGlmKCFHZW5lcmljV29ya2VyLnByb3RvdHlwZS5lcnJvci5jYWxsKHRoaXMsIGUpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgZm9yKHZhciBpID0gMDsgaSA8IHNvdXJjZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHNvdXJjZXNbaV0uZXJyb3IoZSk7XG4gICAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICAgICAgLy8gdGhlIGBlcnJvcmAgZXhwbG9kZWQsIG5vdGhpbmcgdG8gZG9cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbn07XG5cbi8qKlxuICogQHNlZSBHZW5lcmljV29ya2VyLmxvY2tcbiAqL1xuWmlwRmlsZVdvcmtlci5wcm90b3R5cGUubG9jayA9IGZ1bmN0aW9uICgpIHtcbiAgICBHZW5lcmljV29ya2VyLnByb3RvdHlwZS5sb2NrLmNhbGwodGhpcyk7XG4gICAgdmFyIHNvdXJjZXMgPSB0aGlzLl9zb3VyY2VzO1xuICAgIGZvcih2YXIgaSA9IDA7IGkgPCBzb3VyY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHNvdXJjZXNbaV0ubG9jaygpO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gWmlwRmlsZVdvcmtlcjtcblxufSx7XCIuLi9jcmMzMlwiOjQsXCIuLi9zaWduYXR1cmVcIjoyMyxcIi4uL3N0cmVhbS9HZW5lcmljV29ya2VyXCI6MjgsXCIuLi91dGY4XCI6MzEsXCIuLi91dGlsc1wiOjMyfV0sOTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG5cbnZhciBjb21wcmVzc2lvbnMgPSByZXF1aXJlKFwiLi4vY29tcHJlc3Npb25zXCIpO1xudmFyIFppcEZpbGVXb3JrZXIgPSByZXF1aXJlKFwiLi9aaXBGaWxlV29ya2VyXCIpO1xuXG4vKipcbiAqIEZpbmQgdGhlIGNvbXByZXNzaW9uIHRvIHVzZS5cbiAqIEBwYXJhbSB7U3RyaW5nfSBmaWxlQ29tcHJlc3Npb24gdGhlIGNvbXByZXNzaW9uIGRlZmluZWQgYXQgdGhlIGZpbGUgbGV2ZWwsIGlmIGFueS5cbiAqIEBwYXJhbSB7U3RyaW5nfSB6aXBDb21wcmVzc2lvbiB0aGUgY29tcHJlc3Npb24gZGVmaW5lZCBhdCB0aGUgbG9hZCgpIGxldmVsLlxuICogQHJldHVybiB7T2JqZWN0fSB0aGUgY29tcHJlc3Npb24gb2JqZWN0IHRvIHVzZS5cbiAqL1xudmFyIGdldENvbXByZXNzaW9uID0gZnVuY3Rpb24gKGZpbGVDb21wcmVzc2lvbiwgemlwQ29tcHJlc3Npb24pIHtcblxuICAgIHZhciBjb21wcmVzc2lvbk5hbWUgPSBmaWxlQ29tcHJlc3Npb24gfHwgemlwQ29tcHJlc3Npb247XG4gICAgdmFyIGNvbXByZXNzaW9uID0gY29tcHJlc3Npb25zW2NvbXByZXNzaW9uTmFtZV07XG4gICAgaWYgKCFjb21wcmVzc2lvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoY29tcHJlc3Npb25OYW1lICsgXCIgaXMgbm90IGEgdmFsaWQgY29tcHJlc3Npb24gbWV0aG9kICFcIik7XG4gICAgfVxuICAgIHJldHVybiBjb21wcmVzc2lvbjtcbn07XG5cbi8qKlxuICogQ3JlYXRlIGEgd29ya2VyIHRvIGdlbmVyYXRlIGEgemlwIGZpbGUuXG4gKiBAcGFyYW0ge0pTWmlwfSB6aXAgdGhlIEpTWmlwIGluc3RhbmNlIGF0IHRoZSByaWdodCByb290IGxldmVsLlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgdG8gZ2VuZXJhdGUgdGhlIHppcCBmaWxlLlxuICogQHBhcmFtIHtTdHJpbmd9IGNvbW1lbnQgdGhlIGNvbW1lbnQgdG8gdXNlLlxuICovXG5leHBvcnRzLmdlbmVyYXRlV29ya2VyID0gZnVuY3Rpb24gKHppcCwgb3B0aW9ucywgY29tbWVudCkge1xuXG4gICAgdmFyIHppcEZpbGVXb3JrZXIgPSBuZXcgWmlwRmlsZVdvcmtlcihvcHRpb25zLnN0cmVhbUZpbGVzLCBjb21tZW50LCBvcHRpb25zLnBsYXRmb3JtLCBvcHRpb25zLmVuY29kZUZpbGVOYW1lKTtcbiAgICB2YXIgZW50cmllc0NvdW50ID0gMDtcbiAgICB0cnkge1xuXG4gICAgICAgIHppcC5mb3JFYWNoKGZ1bmN0aW9uIChyZWxhdGl2ZVBhdGgsIGZpbGUpIHtcbiAgICAgICAgICAgIGVudHJpZXNDb3VudCsrO1xuICAgICAgICAgICAgdmFyIGNvbXByZXNzaW9uID0gZ2V0Q29tcHJlc3Npb24oZmlsZS5vcHRpb25zLmNvbXByZXNzaW9uLCBvcHRpb25zLmNvbXByZXNzaW9uKTtcbiAgICAgICAgICAgIHZhciBjb21wcmVzc2lvbk9wdGlvbnMgPSBmaWxlLm9wdGlvbnMuY29tcHJlc3Npb25PcHRpb25zIHx8IG9wdGlvbnMuY29tcHJlc3Npb25PcHRpb25zIHx8IHt9O1xuICAgICAgICAgICAgdmFyIGRpciA9IGZpbGUuZGlyLCBkYXRlID0gZmlsZS5kYXRlO1xuXG4gICAgICAgICAgICBmaWxlLl9jb21wcmVzc1dvcmtlcihjb21wcmVzc2lvbiwgY29tcHJlc3Npb25PcHRpb25zKVxuICAgICAgICAgICAgICAgIC53aXRoU3RyZWFtSW5mbyhcImZpbGVcIiwge1xuICAgICAgICAgICAgICAgICAgICBuYW1lIDogcmVsYXRpdmVQYXRoLFxuICAgICAgICAgICAgICAgICAgICBkaXIgOiBkaXIsXG4gICAgICAgICAgICAgICAgICAgIGRhdGUgOiBkYXRlLFxuICAgICAgICAgICAgICAgICAgICBjb21tZW50IDogZmlsZS5jb21tZW50IHx8IFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIHVuaXhQZXJtaXNzaW9ucyA6IGZpbGUudW5peFBlcm1pc3Npb25zLFxuICAgICAgICAgICAgICAgICAgICBkb3NQZXJtaXNzaW9ucyA6IGZpbGUuZG9zUGVybWlzc2lvbnNcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5waXBlKHppcEZpbGVXb3JrZXIpO1xuICAgICAgICB9KTtcbiAgICAgICAgemlwRmlsZVdvcmtlci5lbnRyaWVzQ291bnQgPSBlbnRyaWVzQ291bnQ7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICB6aXBGaWxlV29ya2VyLmVycm9yKGUpO1xuICAgIH1cblxuICAgIHJldHVybiB6aXBGaWxlV29ya2VyO1xufTtcblxufSx7XCIuLi9jb21wcmVzc2lvbnNcIjozLFwiLi9aaXBGaWxlV29ya2VyXCI6OH1dLDEwOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcblxuLyoqXG4gKiBSZXByZXNlbnRhdGlvbiBhIG9mIHppcCBmaWxlIGluIGpzXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gSlNaaXAoKSB7XG4gICAgLy8gaWYgdGhpcyBjb25zdHJ1Y3RvciBpcyB1c2VkIHdpdGhvdXQgYG5ld2AsIGl0IGFkZHMgYG5ld2AgYmVmb3JlIGl0c2VsZjpcbiAgICBpZighKHRoaXMgaW5zdGFuY2VvZiBKU1ppcCkpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBKU1ppcCgpO1xuICAgIH1cblxuICAgIGlmKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVGhlIGNvbnN0cnVjdG9yIHdpdGggcGFyYW1ldGVycyBoYXMgYmVlbiByZW1vdmVkIGluIEpTWmlwIDMuMCwgcGxlYXNlIGNoZWNrIHRoZSB1cGdyYWRlIGd1aWRlLlwiKTtcbiAgICB9XG5cbiAgICAvLyBvYmplY3QgY29udGFpbmluZyB0aGUgZmlsZXMgOlxuICAgIC8vIHtcbiAgICAvLyAgIFwiZm9sZGVyL1wiIDogey4uLn0sXG4gICAgLy8gICBcImZvbGRlci9kYXRhLnR4dFwiIDogey4uLn1cbiAgICAvLyB9XG4gICAgLy8gTk9URTogd2UgdXNlIGEgbnVsbCBwcm90b3R5cGUgYmVjYXVzZSB3ZSBkbyBub3RcbiAgICAvLyB3YW50IGZpbGVuYW1lcyBsaWtlIFwidG9TdHJpbmdcIiBjb21pbmcgZnJvbSBhIHppcCBmaWxlXG4gICAgLy8gdG8gb3ZlcndyaXRlIG1ldGhvZHMgYW5kIGF0dHJpYnV0ZXMgaW4gYSBub3JtYWwgT2JqZWN0LlxuICAgIHRoaXMuZmlsZXMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG4gICAgdGhpcy5jb21tZW50ID0gbnVsbDtcblxuICAgIC8vIFdoZXJlIHdlIGFyZSBpbiB0aGUgaGllcmFyY2h5XG4gICAgdGhpcy5yb290ID0gXCJcIjtcbiAgICB0aGlzLmNsb25lID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBuZXdPYmogPSBuZXcgSlNaaXAoKTtcbiAgICAgICAgZm9yICh2YXIgaSBpbiB0aGlzKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHRoaXNbaV0gIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgIG5ld09ialtpXSA9IHRoaXNbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ld09iajtcbiAgICB9O1xufVxuSlNaaXAucHJvdG90eXBlID0gcmVxdWlyZShcIi4vb2JqZWN0XCIpO1xuSlNaaXAucHJvdG90eXBlLmxvYWRBc3luYyA9IHJlcXVpcmUoXCIuL2xvYWRcIik7XG5KU1ppcC5zdXBwb3J0ID0gcmVxdWlyZShcIi4vc3VwcG9ydFwiKTtcbkpTWmlwLmRlZmF1bHRzID0gcmVxdWlyZShcIi4vZGVmYXVsdHNcIik7XG5cbi8vIFRPRE8gZmluZCBhIGJldHRlciB3YXkgdG8gaGFuZGxlIHRoaXMgdmVyc2lvbixcbi8vIGEgcmVxdWlyZSgncGFja2FnZS5qc29uJykudmVyc2lvbiBkb2Vzbid0IHdvcmsgd2l0aCB3ZWJwYWNrLCBzZWUgIzMyN1xuSlNaaXAudmVyc2lvbiA9IFwiMy4xMC4xXCI7XG5cbkpTWmlwLmxvYWRBc3luYyA9IGZ1bmN0aW9uIChjb250ZW50LCBvcHRpb25zKSB7XG4gICAgcmV0dXJuIG5ldyBKU1ppcCgpLmxvYWRBc3luYyhjb250ZW50LCBvcHRpb25zKTtcbn07XG5cbkpTWmlwLmV4dGVybmFsID0gcmVxdWlyZShcIi4vZXh0ZXJuYWxcIik7XG5tb2R1bGUuZXhwb3J0cyA9IEpTWmlwO1xuXG59LHtcIi4vZGVmYXVsdHNcIjo1LFwiLi9leHRlcm5hbFwiOjYsXCIuL2xvYWRcIjoxMSxcIi4vb2JqZWN0XCI6MTUsXCIuL3N1cHBvcnRcIjozMH1dLDExOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbnZhciB1dGlscyA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpO1xudmFyIGV4dGVybmFsID0gcmVxdWlyZShcIi4vZXh0ZXJuYWxcIik7XG52YXIgdXRmOCA9IHJlcXVpcmUoXCIuL3V0ZjhcIik7XG52YXIgWmlwRW50cmllcyA9IHJlcXVpcmUoXCIuL3ppcEVudHJpZXNcIik7XG52YXIgQ3JjMzJQcm9iZSA9IHJlcXVpcmUoXCIuL3N0cmVhbS9DcmMzMlByb2JlXCIpO1xudmFyIG5vZGVqc1V0aWxzID0gcmVxdWlyZShcIi4vbm9kZWpzVXRpbHNcIik7XG5cbi8qKlxuICogQ2hlY2sgdGhlIENSQzMyIG9mIGFuIGVudHJ5LlxuICogQHBhcmFtIHtaaXBFbnRyeX0gemlwRW50cnkgdGhlIHppcCBlbnRyeSB0byBjaGVjay5cbiAqIEByZXR1cm4ge1Byb21pc2V9IHRoZSByZXN1bHQuXG4gKi9cbmZ1bmN0aW9uIGNoZWNrRW50cnlDUkMzMih6aXBFbnRyeSkge1xuICAgIHJldHVybiBuZXcgZXh0ZXJuYWwuUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIHZhciB3b3JrZXIgPSB6aXBFbnRyeS5kZWNvbXByZXNzZWQuZ2V0Q29udGVudFdvcmtlcigpLnBpcGUobmV3IENyYzMyUHJvYmUoKSk7XG4gICAgICAgIHdvcmtlci5vbihcImVycm9yXCIsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICByZWplY3QoZSk7XG4gICAgICAgIH0pXG4gICAgICAgICAgICAub24oXCJlbmRcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmICh3b3JrZXIuc3RyZWFtSW5mby5jcmMzMiAhPT0gemlwRW50cnkuZGVjb21wcmVzc2VkLmNyYzMyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoXCJDb3JydXB0ZWQgemlwIDogQ1JDMzIgbWlzbWF0Y2hcIikpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnJlc3VtZSgpO1xuICAgIH0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChkYXRhLCBvcHRpb25zKSB7XG4gICAgdmFyIHppcCA9IHRoaXM7XG4gICAgb3B0aW9ucyA9IHV0aWxzLmV4dGVuZChvcHRpb25zIHx8IHt9LCB7XG4gICAgICAgIGJhc2U2NDogZmFsc2UsXG4gICAgICAgIGNoZWNrQ1JDMzI6IGZhbHNlLFxuICAgICAgICBvcHRpbWl6ZWRCaW5hcnlTdHJpbmc6IGZhbHNlLFxuICAgICAgICBjcmVhdGVGb2xkZXJzOiBmYWxzZSxcbiAgICAgICAgZGVjb2RlRmlsZU5hbWU6IHV0ZjgudXRmOGRlY29kZVxuICAgIH0pO1xuXG4gICAgaWYgKG5vZGVqc1V0aWxzLmlzTm9kZSAmJiBub2RlanNVdGlscy5pc1N0cmVhbShkYXRhKSkge1xuICAgICAgICByZXR1cm4gZXh0ZXJuYWwuUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKFwiSlNaaXAgY2FuJ3QgYWNjZXB0IGEgc3RyZWFtIHdoZW4gbG9hZGluZyBhIHppcCBmaWxlLlwiKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHV0aWxzLnByZXBhcmVDb250ZW50KFwidGhlIGxvYWRlZCB6aXAgZmlsZVwiLCBkYXRhLCB0cnVlLCBvcHRpb25zLm9wdGltaXplZEJpbmFyeVN0cmluZywgb3B0aW9ucy5iYXNlNjQpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICB2YXIgemlwRW50cmllcyA9IG5ldyBaaXBFbnRyaWVzKG9wdGlvbnMpO1xuICAgICAgICAgICAgemlwRW50cmllcy5sb2FkKGRhdGEpO1xuICAgICAgICAgICAgcmV0dXJuIHppcEVudHJpZXM7XG4gICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gY2hlY2tDUkMzMih6aXBFbnRyaWVzKSB7XG4gICAgICAgICAgICB2YXIgcHJvbWlzZXMgPSBbZXh0ZXJuYWwuUHJvbWlzZS5yZXNvbHZlKHppcEVudHJpZXMpXTtcbiAgICAgICAgICAgIHZhciBmaWxlcyA9IHppcEVudHJpZXMuZmlsZXM7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5jaGVja0NSQzMyKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBmaWxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBwcm9taXNlcy5wdXNoKGNoZWNrRW50cnlDUkMzMihmaWxlc1tpXSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBleHRlcm5hbC5Qcm9taXNlLmFsbChwcm9taXNlcyk7XG4gICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gYWRkRmlsZXMocmVzdWx0cykge1xuICAgICAgICAgICAgdmFyIHppcEVudHJpZXMgPSByZXN1bHRzLnNoaWZ0KCk7XG4gICAgICAgICAgICB2YXIgZmlsZXMgPSB6aXBFbnRyaWVzLmZpbGVzO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBmaWxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBpbnB1dCA9IGZpbGVzW2ldO1xuXG4gICAgICAgICAgICAgICAgdmFyIHVuc2FmZU5hbWUgPSBpbnB1dC5maWxlTmFtZVN0cjtcbiAgICAgICAgICAgICAgICB2YXIgc2FmZU5hbWUgPSB1dGlscy5yZXNvbHZlKGlucHV0LmZpbGVOYW1lU3RyKTtcblxuICAgICAgICAgICAgICAgIHppcC5maWxlKHNhZmVOYW1lLCBpbnB1dC5kZWNvbXByZXNzZWQsIHtcbiAgICAgICAgICAgICAgICAgICAgYmluYXJ5OiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBvcHRpbWl6ZWRCaW5hcnlTdHJpbmc6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGRhdGU6IGlucHV0LmRhdGUsXG4gICAgICAgICAgICAgICAgICAgIGRpcjogaW5wdXQuZGlyLFxuICAgICAgICAgICAgICAgICAgICBjb21tZW50OiBpbnB1dC5maWxlQ29tbWVudFN0ci5sZW5ndGggPyBpbnB1dC5maWxlQ29tbWVudFN0ciA6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgIHVuaXhQZXJtaXNzaW9uczogaW5wdXQudW5peFBlcm1pc3Npb25zLFxuICAgICAgICAgICAgICAgICAgICBkb3NQZXJtaXNzaW9uczogaW5wdXQuZG9zUGVybWlzc2lvbnMsXG4gICAgICAgICAgICAgICAgICAgIGNyZWF0ZUZvbGRlcnM6IG9wdGlvbnMuY3JlYXRlRm9sZGVyc1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGlmICghaW5wdXQuZGlyKSB7XG4gICAgICAgICAgICAgICAgICAgIHppcC5maWxlKHNhZmVOYW1lKS51bnNhZmVPcmlnaW5hbE5hbWUgPSB1bnNhZmVOYW1lO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh6aXBFbnRyaWVzLnppcENvbW1lbnQubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgemlwLmNvbW1lbnQgPSB6aXBFbnRyaWVzLnppcENvbW1lbnQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB6aXA7XG4gICAgICAgIH0pO1xufTtcblxufSx7XCIuL2V4dGVybmFsXCI6NixcIi4vbm9kZWpzVXRpbHNcIjoxNCxcIi4vc3RyZWFtL0NyYzMyUHJvYmVcIjoyNSxcIi4vdXRmOFwiOjMxLFwiLi91dGlsc1wiOjMyLFwiLi96aXBFbnRyaWVzXCI6MzN9XSwxMjpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG5cbnZhciB1dGlscyA9IHJlcXVpcmUoXCIuLi91dGlsc1wiKTtcbnZhciBHZW5lcmljV29ya2VyID0gcmVxdWlyZShcIi4uL3N0cmVhbS9HZW5lcmljV29ya2VyXCIpO1xuXG4vKipcbiAqIEEgd29ya2VyIHRoYXQgdXNlIGEgbm9kZWpzIHN0cmVhbSBhcyBzb3VyY2UuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7U3RyaW5nfSBmaWxlbmFtZSB0aGUgbmFtZSBvZiB0aGUgZmlsZSBlbnRyeSBmb3IgdGhpcyBzdHJlYW0uXG4gKiBAcGFyYW0ge1JlYWRhYmxlfSBzdHJlYW0gdGhlIG5vZGVqcyBzdHJlYW0uXG4gKi9cbmZ1bmN0aW9uIE5vZGVqc1N0cmVhbUlucHV0QWRhcHRlcihmaWxlbmFtZSwgc3RyZWFtKSB7XG4gICAgR2VuZXJpY1dvcmtlci5jYWxsKHRoaXMsIFwiTm9kZWpzIHN0cmVhbSBpbnB1dCBhZGFwdGVyIGZvciBcIiArIGZpbGVuYW1lKTtcbiAgICB0aGlzLl91cHN0cmVhbUVuZGVkID0gZmFsc2U7XG4gICAgdGhpcy5fYmluZFN0cmVhbShzdHJlYW0pO1xufVxuXG51dGlscy5pbmhlcml0cyhOb2RlanNTdHJlYW1JbnB1dEFkYXB0ZXIsIEdlbmVyaWNXb3JrZXIpO1xuXG4vKipcbiAqIFByZXBhcmUgdGhlIHN0cmVhbSBhbmQgYmluZCB0aGUgY2FsbGJhY2tzIG9uIGl0LlxuICogRG8gdGhpcyBBU0FQIG9uIG5vZGUgMC4xMCAhIEEgbGF6eSBiaW5kaW5nIGRvZXNuJ3QgYWx3YXlzIHdvcmsuXG4gKiBAcGFyYW0ge1N0cmVhbX0gc3RyZWFtIHRoZSBub2RlanMgc3RyZWFtIHRvIHVzZS5cbiAqL1xuTm9kZWpzU3RyZWFtSW5wdXRBZGFwdGVyLnByb3RvdHlwZS5fYmluZFN0cmVhbSA9IGZ1bmN0aW9uIChzdHJlYW0pIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdGhpcy5fc3RyZWFtID0gc3RyZWFtO1xuICAgIHN0cmVhbS5wYXVzZSgpO1xuICAgIHN0cmVhbVxuICAgICAgICAub24oXCJkYXRhXCIsIGZ1bmN0aW9uIChjaHVuaykge1xuICAgICAgICAgICAgc2VsZi5wdXNoKHtcbiAgICAgICAgICAgICAgICBkYXRhOiBjaHVuayxcbiAgICAgICAgICAgICAgICBtZXRhIDoge1xuICAgICAgICAgICAgICAgICAgICBwZXJjZW50IDogMFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KVxuICAgICAgICAub24oXCJlcnJvclwiLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgaWYoc2VsZi5pc1BhdXNlZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZ2VuZXJhdGVkRXJyb3IgPSBlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZWxmLmVycm9yKGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAub24oXCJlbmRcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYoc2VsZi5pc1BhdXNlZCkge1xuICAgICAgICAgICAgICAgIHNlbGYuX3Vwc3RyZWFtRW5kZWQgPSB0cnVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZWxmLmVuZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbn07XG5Ob2RlanNTdHJlYW1JbnB1dEFkYXB0ZXIucHJvdG90eXBlLnBhdXNlID0gZnVuY3Rpb24gKCkge1xuICAgIGlmKCFHZW5lcmljV29ya2VyLnByb3RvdHlwZS5wYXVzZS5jYWxsKHRoaXMpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdGhpcy5fc3RyZWFtLnBhdXNlKCk7XG4gICAgcmV0dXJuIHRydWU7XG59O1xuTm9kZWpzU3RyZWFtSW5wdXRBZGFwdGVyLnByb3RvdHlwZS5yZXN1bWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYoIUdlbmVyaWNXb3JrZXIucHJvdG90eXBlLnJlc3VtZS5jYWxsKHRoaXMpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBpZih0aGlzLl91cHN0cmVhbUVuZGVkKSB7XG4gICAgICAgIHRoaXMuZW5kKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fc3RyZWFtLnJlc3VtZSgpO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBOb2RlanNTdHJlYW1JbnB1dEFkYXB0ZXI7XG5cbn0se1wiLi4vc3RyZWFtL0dlbmVyaWNXb3JrZXJcIjoyOCxcIi4uL3V0aWxzXCI6MzJ9XSwxMzpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG5cbnZhciBSZWFkYWJsZSA9IHJlcXVpcmUoXCJyZWFkYWJsZS1zdHJlYW1cIikuUmVhZGFibGU7XG5cbnZhciB1dGlscyA9IHJlcXVpcmUoXCIuLi91dGlsc1wiKTtcbnV0aWxzLmluaGVyaXRzKE5vZGVqc1N0cmVhbU91dHB1dEFkYXB0ZXIsIFJlYWRhYmxlKTtcblxuLyoqXG4qIEEgbm9kZWpzIHN0cmVhbSB1c2luZyBhIHdvcmtlciBhcyBzb3VyY2UuXG4qIEBzZWUgdGhlIFNvdXJjZVdyYXBwZXIgaW4gaHR0cDovL25vZGVqcy5vcmcvYXBpL3N0cmVhbS5odG1sXG4qIEBjb25zdHJ1Y3RvclxuKiBAcGFyYW0ge1N0cmVhbUhlbHBlcn0gaGVscGVyIHRoZSBoZWxwZXIgd3JhcHBpbmcgdGhlIHdvcmtlclxuKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyB0aGUgbm9kZWpzIHN0cmVhbSBvcHRpb25zXG4qIEBwYXJhbSB7RnVuY3Rpb259IHVwZGF0ZUNiIHRoZSB1cGRhdGUgY2FsbGJhY2suXG4qL1xuZnVuY3Rpb24gTm9kZWpzU3RyZWFtT3V0cHV0QWRhcHRlcihoZWxwZXIsIG9wdGlvbnMsIHVwZGF0ZUNiKSB7XG4gICAgUmVhZGFibGUuY2FsbCh0aGlzLCBvcHRpb25zKTtcbiAgICB0aGlzLl9oZWxwZXIgPSBoZWxwZXI7XG5cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgaGVscGVyLm9uKFwiZGF0YVwiLCBmdW5jdGlvbiAoZGF0YSwgbWV0YSkge1xuICAgICAgICBpZiAoIXNlbGYucHVzaChkYXRhKSkge1xuICAgICAgICAgICAgc2VsZi5faGVscGVyLnBhdXNlKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYodXBkYXRlQ2IpIHtcbiAgICAgICAgICAgIHVwZGF0ZUNiKG1ldGEpO1xuICAgICAgICB9XG4gICAgfSlcbiAgICAgICAgLm9uKFwiZXJyb3JcIiwgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgc2VsZi5lbWl0KFwiZXJyb3JcIiwgZSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5vbihcImVuZFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLnB1c2gobnVsbCk7XG4gICAgICAgIH0pO1xufVxuXG5cbk5vZGVqc1N0cmVhbU91dHB1dEFkYXB0ZXIucHJvdG90eXBlLl9yZWFkID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5faGVscGVyLnJlc3VtZSgpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBOb2RlanNTdHJlYW1PdXRwdXRBZGFwdGVyO1xuXG59LHtcIi4uL3V0aWxzXCI6MzIsXCJyZWFkYWJsZS1zdHJlYW1cIjoxNn1dLDE0OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgLyoqXG4gICAgICogVHJ1ZSBpZiB0aGlzIGlzIHJ1bm5pbmcgaW4gTm9kZWpzLCB3aWxsIGJlIHVuZGVmaW5lZCBpbiBhIGJyb3dzZXIuXG4gICAgICogSW4gYSBicm93c2VyLCBicm93c2VyaWZ5IHdvbid0IGluY2x1ZGUgdGhpcyBmaWxlIGFuZCB0aGUgd2hvbGUgbW9kdWxlXG4gICAgICogd2lsbCBiZSByZXNvbHZlZCBhbiBlbXB0eSBvYmplY3QuXG4gICAgICovXG4gICAgaXNOb2RlIDogdHlwZW9mIEJ1ZmZlciAhPT0gXCJ1bmRlZmluZWRcIixcbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSBuZXcgbm9kZWpzIEJ1ZmZlciBmcm9tIGFuIGV4aXN0aW5nIGNvbnRlbnQuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgdGhlIGRhdGEgdG8gcGFzcyB0byB0aGUgY29uc3RydWN0b3IuXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGVuY29kaW5nIHRoZSBlbmNvZGluZyB0byB1c2UuXG4gICAgICogQHJldHVybiB7QnVmZmVyfSBhIG5ldyBCdWZmZXIuXG4gICAgICovXG4gICAgbmV3QnVmZmVyRnJvbTogZnVuY3Rpb24oZGF0YSwgZW5jb2RpbmcpIHtcbiAgICAgICAgaWYgKEJ1ZmZlci5mcm9tICYmIEJ1ZmZlci5mcm9tICE9PSBVaW50OEFycmF5LmZyb20pIHtcbiAgICAgICAgICAgIHJldHVybiBCdWZmZXIuZnJvbShkYXRhLCBlbmNvZGluZyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGRhdGEgPT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgICAgICAgICAvLyBTYWZlZ3VhcmQgZm9yIG9sZCBOb2RlLmpzIHZlcnNpb25zLiBPbiBuZXdlciB2ZXJzaW9ucyxcbiAgICAgICAgICAgICAgICAvLyBCdWZmZXIuZnJvbShudW1iZXIpIC8gQnVmZmVyKG51bWJlciwgZW5jb2RpbmcpIGFscmVhZHkgdGhyb3cuXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVGhlIFxcXCJkYXRhXFxcIiBhcmd1bWVudCBtdXN0IG5vdCBiZSBhIG51bWJlclwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBuZXcgQnVmZmVyKGRhdGEsIGVuY29kaW5nKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgbmV3IG5vZGVqcyBCdWZmZXIgd2l0aCB0aGUgc3BlY2lmaWVkIHNpemUuXG4gICAgICogQHBhcmFtIHtJbnRlZ2VyfSBzaXplIHRoZSBzaXplIG9mIHRoZSBidWZmZXIuXG4gICAgICogQHJldHVybiB7QnVmZmVyfSBhIG5ldyBCdWZmZXIuXG4gICAgICovXG4gICAgYWxsb2NCdWZmZXI6IGZ1bmN0aW9uIChzaXplKSB7XG4gICAgICAgIGlmIChCdWZmZXIuYWxsb2MpIHtcbiAgICAgICAgICAgIHJldHVybiBCdWZmZXIuYWxsb2Moc2l6ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgYnVmID0gbmV3IEJ1ZmZlcihzaXplKTtcbiAgICAgICAgICAgIGJ1Zi5maWxsKDApO1xuICAgICAgICAgICAgcmV0dXJuIGJ1ZjtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICogRmluZCBvdXQgaWYgYW4gb2JqZWN0IGlzIGEgQnVmZmVyLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBiIHRoZSBvYmplY3QgdG8gdGVzdC5cbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufSB0cnVlIGlmIHRoZSBvYmplY3QgaXMgYSBCdWZmZXIsIGZhbHNlIG90aGVyd2lzZS5cbiAgICAgKi9cbiAgICBpc0J1ZmZlciA6IGZ1bmN0aW9uKGIpe1xuICAgICAgICByZXR1cm4gQnVmZmVyLmlzQnVmZmVyKGIpO1xuICAgIH0sXG5cbiAgICBpc1N0cmVhbSA6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgcmV0dXJuIG9iaiAmJlxuICAgICAgICAgICAgdHlwZW9mIG9iai5vbiA9PT0gXCJmdW5jdGlvblwiICYmXG4gICAgICAgICAgICB0eXBlb2Ygb2JqLnBhdXNlID09PSBcImZ1bmN0aW9uXCIgJiZcbiAgICAgICAgICAgIHR5cGVvZiBvYmoucmVzdW1lID09PSBcImZ1bmN0aW9uXCI7XG4gICAgfVxufTtcblxufSx7fV0sMTU6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xudmFyIHV0ZjggPSByZXF1aXJlKFwiLi91dGY4XCIpO1xudmFyIHV0aWxzID0gcmVxdWlyZShcIi4vdXRpbHNcIik7XG52YXIgR2VuZXJpY1dvcmtlciA9IHJlcXVpcmUoXCIuL3N0cmVhbS9HZW5lcmljV29ya2VyXCIpO1xudmFyIFN0cmVhbUhlbHBlciA9IHJlcXVpcmUoXCIuL3N0cmVhbS9TdHJlYW1IZWxwZXJcIik7XG52YXIgZGVmYXVsdHMgPSByZXF1aXJlKFwiLi9kZWZhdWx0c1wiKTtcbnZhciBDb21wcmVzc2VkT2JqZWN0ID0gcmVxdWlyZShcIi4vY29tcHJlc3NlZE9iamVjdFwiKTtcbnZhciBaaXBPYmplY3QgPSByZXF1aXJlKFwiLi96aXBPYmplY3RcIik7XG52YXIgZ2VuZXJhdGUgPSByZXF1aXJlKFwiLi9nZW5lcmF0ZVwiKTtcbnZhciBub2RlanNVdGlscyA9IHJlcXVpcmUoXCIuL25vZGVqc1V0aWxzXCIpO1xudmFyIE5vZGVqc1N0cmVhbUlucHV0QWRhcHRlciA9IHJlcXVpcmUoXCIuL25vZGVqcy9Ob2RlanNTdHJlYW1JbnB1dEFkYXB0ZXJcIik7XG5cblxuLyoqXG4gKiBBZGQgYSBmaWxlIGluIHRoZSBjdXJyZW50IGZvbGRlci5cbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSB0aGUgbmFtZSBvZiB0aGUgZmlsZVxuICogQHBhcmFtIHtTdHJpbmd8QXJyYXlCdWZmZXJ8VWludDhBcnJheXxCdWZmZXJ9IGRhdGEgdGhlIGRhdGEgb2YgdGhlIGZpbGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcmlnaW5hbE9wdGlvbnMgdGhlIG9wdGlvbnMgb2YgdGhlIGZpbGVcbiAqIEByZXR1cm4ge09iamVjdH0gdGhlIG5ldyBmaWxlLlxuICovXG52YXIgZmlsZUFkZCA9IGZ1bmN0aW9uKG5hbWUsIGRhdGEsIG9yaWdpbmFsT3B0aW9ucykge1xuICAgIC8vIGJlIHN1cmUgc3ViIGZvbGRlcnMgZXhpc3RcbiAgICB2YXIgZGF0YVR5cGUgPSB1dGlscy5nZXRUeXBlT2YoZGF0YSksXG4gICAgICAgIHBhcmVudDtcblxuXG4gICAgLypcbiAgICAgKiBDb3JyZWN0IG9wdGlvbnMuXG4gICAgICovXG5cbiAgICB2YXIgbyA9IHV0aWxzLmV4dGVuZChvcmlnaW5hbE9wdGlvbnMgfHwge30sIGRlZmF1bHRzKTtcbiAgICBvLmRhdGUgPSBvLmRhdGUgfHwgbmV3IERhdGUoKTtcbiAgICBpZiAoby5jb21wcmVzc2lvbiAhPT0gbnVsbCkge1xuICAgICAgICBvLmNvbXByZXNzaW9uID0gby5jb21wcmVzc2lvbi50b1VwcGVyQ2FzZSgpO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygby51bml4UGVybWlzc2lvbnMgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgby51bml4UGVybWlzc2lvbnMgPSBwYXJzZUludChvLnVuaXhQZXJtaXNzaW9ucywgOCk7XG4gICAgfVxuXG4gICAgLy8gVU5YX0lGRElSICAwMDQwMDAwIHNlZSB6aXBpbmZvLmNcbiAgICBpZiAoby51bml4UGVybWlzc2lvbnMgJiYgKG8udW5peFBlcm1pc3Npb25zICYgMHg0MDAwKSkge1xuICAgICAgICBvLmRpciA9IHRydWU7XG4gICAgfVxuICAgIC8vIEJpdCA0ICAgIERpcmVjdG9yeVxuICAgIGlmIChvLmRvc1Blcm1pc3Npb25zICYmIChvLmRvc1Blcm1pc3Npb25zICYgMHgwMDEwKSkge1xuICAgICAgICBvLmRpciA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKG8uZGlyKSB7XG4gICAgICAgIG5hbWUgPSBmb3JjZVRyYWlsaW5nU2xhc2gobmFtZSk7XG4gICAgfVxuICAgIGlmIChvLmNyZWF0ZUZvbGRlcnMgJiYgKHBhcmVudCA9IHBhcmVudEZvbGRlcihuYW1lKSkpIHtcbiAgICAgICAgZm9sZGVyQWRkLmNhbGwodGhpcywgcGFyZW50LCB0cnVlKTtcbiAgICB9XG5cbiAgICB2YXIgaXNVbmljb2RlU3RyaW5nID0gZGF0YVR5cGUgPT09IFwic3RyaW5nXCIgJiYgby5iaW5hcnkgPT09IGZhbHNlICYmIG8uYmFzZTY0ID09PSBmYWxzZTtcbiAgICBpZiAoIW9yaWdpbmFsT3B0aW9ucyB8fCB0eXBlb2Ygb3JpZ2luYWxPcHRpb25zLmJpbmFyeSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICBvLmJpbmFyeSA9ICFpc1VuaWNvZGVTdHJpbmc7XG4gICAgfVxuXG5cbiAgICB2YXIgaXNDb21wcmVzc2VkRW1wdHkgPSAoZGF0YSBpbnN0YW5jZW9mIENvbXByZXNzZWRPYmplY3QpICYmIGRhdGEudW5jb21wcmVzc2VkU2l6ZSA9PT0gMDtcblxuICAgIGlmIChpc0NvbXByZXNzZWRFbXB0eSB8fCBvLmRpciB8fCAhZGF0YSB8fCBkYXRhLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBvLmJhc2U2NCA9IGZhbHNlO1xuICAgICAgICBvLmJpbmFyeSA9IHRydWU7XG4gICAgICAgIGRhdGEgPSBcIlwiO1xuICAgICAgICBvLmNvbXByZXNzaW9uID0gXCJTVE9SRVwiO1xuICAgICAgICBkYXRhVHlwZSA9IFwic3RyaW5nXCI7XG4gICAgfVxuXG4gICAgLypcbiAgICAgKiBDb252ZXJ0IGNvbnRlbnQgdG8gZml0LlxuICAgICAqL1xuXG4gICAgdmFyIHppcE9iamVjdENvbnRlbnQgPSBudWxsO1xuICAgIGlmIChkYXRhIGluc3RhbmNlb2YgQ29tcHJlc3NlZE9iamVjdCB8fCBkYXRhIGluc3RhbmNlb2YgR2VuZXJpY1dvcmtlcikge1xuICAgICAgICB6aXBPYmplY3RDb250ZW50ID0gZGF0YTtcbiAgICB9IGVsc2UgaWYgKG5vZGVqc1V0aWxzLmlzTm9kZSAmJiBub2RlanNVdGlscy5pc1N0cmVhbShkYXRhKSkge1xuICAgICAgICB6aXBPYmplY3RDb250ZW50ID0gbmV3IE5vZGVqc1N0cmVhbUlucHV0QWRhcHRlcihuYW1lLCBkYXRhKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB6aXBPYmplY3RDb250ZW50ID0gdXRpbHMucHJlcGFyZUNvbnRlbnQobmFtZSwgZGF0YSwgby5iaW5hcnksIG8ub3B0aW1pemVkQmluYXJ5U3RyaW5nLCBvLmJhc2U2NCk7XG4gICAgfVxuXG4gICAgdmFyIG9iamVjdCA9IG5ldyBaaXBPYmplY3QobmFtZSwgemlwT2JqZWN0Q29udGVudCwgbyk7XG4gICAgdGhpcy5maWxlc1tuYW1lXSA9IG9iamVjdDtcbiAgICAvKlxuICAgIFRPRE86IHdlIGNhbid0IHRocm93IGFuIGV4Y2VwdGlvbiBiZWNhdXNlIHdlIGhhdmUgYXN5bmMgcHJvbWlzZXNcbiAgICAod2UgY2FuIGhhdmUgYSBwcm9taXNlIG9mIGEgRGF0ZSgpIGZvciBleGFtcGxlKSBidXQgcmV0dXJuaW5nIGFcbiAgICBwcm9taXNlIGlzIHVzZWxlc3MgYmVjYXVzZSBmaWxlKG5hbWUsIGRhdGEpIHJldHVybnMgdGhlIEpTWmlwXG4gICAgb2JqZWN0IGZvciBjaGFpbmluZy4gU2hvdWxkIHdlIGJyZWFrIHRoYXQgdG8gYWxsb3cgdGhlIHVzZXJcbiAgICB0byBjYXRjaCB0aGUgZXJyb3IgP1xuXG4gICAgcmV0dXJuIGV4dGVybmFsLlByb21pc2UucmVzb2x2ZSh6aXBPYmplY3RDb250ZW50KVxuICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG9iamVjdDtcbiAgICB9KTtcbiAgICAqL1xufTtcblxuLyoqXG4gKiBGaW5kIHRoZSBwYXJlbnQgZm9sZGVyIG9mIHRoZSBwYXRoLlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIHRoZSBwYXRoIHRvIHVzZVxuICogQHJldHVybiB7c3RyaW5nfSB0aGUgcGFyZW50IGZvbGRlciwgb3IgXCJcIlxuICovXG52YXIgcGFyZW50Rm9sZGVyID0gZnVuY3Rpb24gKHBhdGgpIHtcbiAgICBpZiAocGF0aC5zbGljZSgtMSkgPT09IFwiL1wiKSB7XG4gICAgICAgIHBhdGggPSBwYXRoLnN1YnN0cmluZygwLCBwYXRoLmxlbmd0aCAtIDEpO1xuICAgIH1cbiAgICB2YXIgbGFzdFNsYXNoID0gcGF0aC5sYXN0SW5kZXhPZihcIi9cIik7XG4gICAgcmV0dXJuIChsYXN0U2xhc2ggPiAwKSA/IHBhdGguc3Vic3RyaW5nKDAsIGxhc3RTbGFzaCkgOiBcIlwiO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBwYXRoIHdpdGggYSBzbGFzaCBhdCB0aGUgZW5kLlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoIHRoZSBwYXRoIHRvIGNoZWNrLlxuICogQHJldHVybiB7U3RyaW5nfSB0aGUgcGF0aCB3aXRoIGEgdHJhaWxpbmcgc2xhc2guXG4gKi9cbnZhciBmb3JjZVRyYWlsaW5nU2xhc2ggPSBmdW5jdGlvbihwYXRoKSB7XG4gICAgLy8gQ2hlY2sgdGhlIG5hbWUgZW5kcyB3aXRoIGEgL1xuICAgIGlmIChwYXRoLnNsaWNlKC0xKSAhPT0gXCIvXCIpIHtcbiAgICAgICAgcGF0aCArPSBcIi9cIjsgLy8gSUUgZG9lc24ndCBsaWtlIHN1YnN0cigtMSlcbiAgICB9XG4gICAgcmV0dXJuIHBhdGg7XG59O1xuXG4vKipcbiAqIEFkZCBhIChzdWIpIGZvbGRlciBpbiB0aGUgY3VycmVudCBmb2xkZXIuXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgdGhlIGZvbGRlcidzIG5hbWVcbiAqIEBwYXJhbSB7Ym9vbGVhbj19IFtjcmVhdGVGb2xkZXJzXSBJZiB0cnVlLCBhdXRvbWF0aWNhbGx5IGNyZWF0ZSBzdWJcbiAqICBmb2xkZXJzLiBEZWZhdWx0cyB0byBmYWxzZS5cbiAqIEByZXR1cm4ge09iamVjdH0gdGhlIG5ldyBmb2xkZXIuXG4gKi9cbnZhciBmb2xkZXJBZGQgPSBmdW5jdGlvbihuYW1lLCBjcmVhdGVGb2xkZXJzKSB7XG4gICAgY3JlYXRlRm9sZGVycyA9ICh0eXBlb2YgY3JlYXRlRm9sZGVycyAhPT0gXCJ1bmRlZmluZWRcIikgPyBjcmVhdGVGb2xkZXJzIDogZGVmYXVsdHMuY3JlYXRlRm9sZGVycztcblxuICAgIG5hbWUgPSBmb3JjZVRyYWlsaW5nU2xhc2gobmFtZSk7XG5cbiAgICAvLyBEb2VzIHRoaXMgZm9sZGVyIGFscmVhZHkgZXhpc3Q/XG4gICAgaWYgKCF0aGlzLmZpbGVzW25hbWVdKSB7XG4gICAgICAgIGZpbGVBZGQuY2FsbCh0aGlzLCBuYW1lLCBudWxsLCB7XG4gICAgICAgICAgICBkaXI6IHRydWUsXG4gICAgICAgICAgICBjcmVhdGVGb2xkZXJzOiBjcmVhdGVGb2xkZXJzXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5maWxlc1tuYW1lXTtcbn07XG5cbi8qKlxuKiBDcm9zcy13aW5kb3csIGNyb3NzLU5vZGUtY29udGV4dCByZWd1bGFyIGV4cHJlc3Npb24gZGV0ZWN0aW9uXG4qIEBwYXJhbSAge09iamVjdH0gIG9iamVjdCBBbnl0aGluZ1xuKiBAcmV0dXJuIHtCb29sZWFufSAgICAgICAgdHJ1ZSBpZiB0aGUgb2JqZWN0IGlzIGEgcmVndWxhciBleHByZXNzaW9uLFxuKiBmYWxzZSBvdGhlcndpc2VcbiovXG5mdW5jdGlvbiBpc1JlZ0V4cChvYmplY3QpIHtcbiAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iamVjdCkgPT09IFwiW29iamVjdCBSZWdFeHBdXCI7XG59XG5cbi8vIHJldHVybiB0aGUgYWN0dWFsIHByb3RvdHlwZSBvZiBKU1ppcFxudmFyIG91dCA9IHtcbiAgICAvKipcbiAgICAgKiBAc2VlIGxvYWRBc3luY1xuICAgICAqL1xuICAgIGxvYWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGlzIG1ldGhvZCBoYXMgYmVlbiByZW1vdmVkIGluIEpTWmlwIDMuMCwgcGxlYXNlIGNoZWNrIHRoZSB1cGdyYWRlIGd1aWRlLlwiKTtcbiAgICB9LFxuXG5cbiAgICAvKipcbiAgICAgKiBDYWxsIGEgY2FsbGJhY2sgZnVuY3Rpb24gZm9yIGVhY2ggZW50cnkgYXQgdGhpcyBmb2xkZXIgbGV2ZWwuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgdGhlIGNhbGxiYWNrIGZ1bmN0aW9uOlxuICAgICAqIGZ1bmN0aW9uIChyZWxhdGl2ZVBhdGgsIGZpbGUpIHsuLi59XG4gICAgICogSXQgdGFrZXMgMiBhcmd1bWVudHMgOiB0aGUgcmVsYXRpdmUgcGF0aCBhbmQgdGhlIGZpbGUuXG4gICAgICovXG4gICAgZm9yRWFjaDogZnVuY3Rpb24oY2IpIHtcbiAgICAgICAgdmFyIGZpbGVuYW1lLCByZWxhdGl2ZVBhdGgsIGZpbGU7XG4gICAgICAgIC8vIGlnbm9yZSB3YXJuaW5nIGFib3V0IHVud2FudGVkIHByb3BlcnRpZXMgYmVjYXVzZSB0aGlzLmZpbGVzIGlzIGEgbnVsbCBwcm90b3R5cGUgb2JqZWN0XG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBndWFyZC1mb3ItaW4gKi9cbiAgICAgICAgZm9yIChmaWxlbmFtZSBpbiB0aGlzLmZpbGVzKSB7XG4gICAgICAgICAgICBmaWxlID0gdGhpcy5maWxlc1tmaWxlbmFtZV07XG4gICAgICAgICAgICByZWxhdGl2ZVBhdGggPSBmaWxlbmFtZS5zbGljZSh0aGlzLnJvb3QubGVuZ3RoLCBmaWxlbmFtZS5sZW5ndGgpO1xuICAgICAgICAgICAgaWYgKHJlbGF0aXZlUGF0aCAmJiBmaWxlbmFtZS5zbGljZSgwLCB0aGlzLnJvb3QubGVuZ3RoKSA9PT0gdGhpcy5yb290KSB7IC8vIHRoZSBmaWxlIGlzIGluIHRoZSBjdXJyZW50IHJvb3RcbiAgICAgICAgICAgICAgICBjYihyZWxhdGl2ZVBhdGgsIGZpbGUpOyAvLyBUT0RPIHJldmVyc2UgdGhlIHBhcmFtZXRlcnMgPyBuZWVkIHRvIGJlIGNsZWFuIEFORCBjb25zaXN0ZW50IHdpdGggdGhlIGZpbHRlciBzZWFyY2ggZm4uLi5cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBGaWx0ZXIgbmVzdGVkIGZpbGVzL2ZvbGRlcnMgd2l0aCB0aGUgc3BlY2lmaWVkIGZ1bmN0aW9uLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IHNlYXJjaCB0aGUgcHJlZGljYXRlIHRvIHVzZSA6XG4gICAgICogZnVuY3Rpb24gKHJlbGF0aXZlUGF0aCwgZmlsZSkgey4uLn1cbiAgICAgKiBJdCB0YWtlcyAyIGFyZ3VtZW50cyA6IHRoZSByZWxhdGl2ZSBwYXRoIGFuZCB0aGUgZmlsZS5cbiAgICAgKiBAcmV0dXJuIHtBcnJheX0gQW4gYXJyYXkgb2YgbWF0Y2hpbmcgZWxlbWVudHMuXG4gICAgICovXG4gICAgZmlsdGVyOiBmdW5jdGlvbihzZWFyY2gpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xuICAgICAgICB0aGlzLmZvckVhY2goZnVuY3Rpb24gKHJlbGF0aXZlUGF0aCwgZW50cnkpIHtcbiAgICAgICAgICAgIGlmIChzZWFyY2gocmVsYXRpdmVQYXRoLCBlbnRyeSkpIHsgLy8gdGhlIGZpbGUgbWF0Y2hlcyB0aGUgZnVuY3Rpb25cbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChlbnRyeSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBhIGZpbGUgdG8gdGhlIHppcCBmaWxlLCBvciBzZWFyY2ggYSBmaWxlLlxuICAgICAqIEBwYXJhbSAgIHtzdHJpbmd8UmVnRXhwfSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBmaWxlIHRvIGFkZCAoaWYgZGF0YSBpcyBkZWZpbmVkKSxcbiAgICAgKiB0aGUgbmFtZSBvZiB0aGUgZmlsZSB0byBmaW5kIChpZiBubyBkYXRhKSBvciBhIHJlZ2V4IHRvIG1hdGNoIGZpbGVzLlxuICAgICAqIEBwYXJhbSAgIHtTdHJpbmd8QXJyYXlCdWZmZXJ8VWludDhBcnJheXxCdWZmZXJ9IGRhdGEgIFRoZSBmaWxlIGRhdGEsIGVpdGhlciByYXcgb3IgYmFzZTY0IGVuY29kZWRcbiAgICAgKiBAcGFyYW0gICB7T2JqZWN0fSBvICAgICBGaWxlIG9wdGlvbnNcbiAgICAgKiBAcmV0dXJuICB7SlNaaXB8T2JqZWN0fEFycmF5fSB0aGlzIEpTWmlwIG9iamVjdCAod2hlbiBhZGRpbmcgYSBmaWxlKSxcbiAgICAgKiBhIGZpbGUgKHdoZW4gc2VhcmNoaW5nIGJ5IHN0cmluZykgb3IgYW4gYXJyYXkgb2YgZmlsZXMgKHdoZW4gc2VhcmNoaW5nIGJ5IHJlZ2V4KS5cbiAgICAgKi9cbiAgICBmaWxlOiBmdW5jdGlvbihuYW1lLCBkYXRhLCBvKSB7XG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICBpZiAoaXNSZWdFeHAobmFtZSkpIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVnZXhwID0gbmFtZTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5maWx0ZXIoZnVuY3Rpb24ocmVsYXRpdmVQYXRoLCBmaWxlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAhZmlsZS5kaXIgJiYgcmVnZXhwLnRlc3QocmVsYXRpdmVQYXRoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgeyAvLyB0ZXh0XG4gICAgICAgICAgICAgICAgdmFyIG9iaiA9IHRoaXMuZmlsZXNbdGhpcy5yb290ICsgbmFtZV07XG4gICAgICAgICAgICAgICAgaWYgKG9iaiAmJiAhb2JqLmRpcikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2JqO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHsgLy8gbW9yZSB0aGFuIG9uZSBhcmd1bWVudCA6IHdlIGhhdmUgZGF0YSAhXG4gICAgICAgICAgICBuYW1lID0gdGhpcy5yb290ICsgbmFtZTtcbiAgICAgICAgICAgIGZpbGVBZGQuY2FsbCh0aGlzLCBuYW1lLCBkYXRhLCBvKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGEgZGlyZWN0b3J5IHRvIHRoZSB6aXAgZmlsZSwgb3Igc2VhcmNoLlxuICAgICAqIEBwYXJhbSAgIHtTdHJpbmd8UmVnRXhwfSBhcmcgVGhlIG5hbWUgb2YgdGhlIGRpcmVjdG9yeSB0byBhZGQsIG9yIGEgcmVnZXggdG8gc2VhcmNoIGZvbGRlcnMuXG4gICAgICogQHJldHVybiAge0pTWmlwfSBhbiBvYmplY3Qgd2l0aCB0aGUgbmV3IGRpcmVjdG9yeSBhcyB0aGUgcm9vdCwgb3IgYW4gYXJyYXkgY29udGFpbmluZyBtYXRjaGluZyBmb2xkZXJzLlxuICAgICAqL1xuICAgIGZvbGRlcjogZnVuY3Rpb24oYXJnKSB7XG4gICAgICAgIGlmICghYXJnKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc1JlZ0V4cChhcmcpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5maWx0ZXIoZnVuY3Rpb24ocmVsYXRpdmVQYXRoLCBmaWxlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpbGUuZGlyICYmIGFyZy50ZXN0KHJlbGF0aXZlUGF0aCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGVsc2UsIG5hbWUgaXMgYSBuZXcgZm9sZGVyXG4gICAgICAgIHZhciBuYW1lID0gdGhpcy5yb290ICsgYXJnO1xuICAgICAgICB2YXIgbmV3Rm9sZGVyID0gZm9sZGVyQWRkLmNhbGwodGhpcywgbmFtZSk7XG5cbiAgICAgICAgLy8gQWxsb3cgY2hhaW5pbmcgYnkgcmV0dXJuaW5nIGEgbmV3IG9iamVjdCB3aXRoIHRoaXMgZm9sZGVyIGFzIHRoZSByb290XG4gICAgICAgIHZhciByZXQgPSB0aGlzLmNsb25lKCk7XG4gICAgICAgIHJldC5yb290ID0gbmV3Rm9sZGVyLm5hbWU7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERlbGV0ZSBhIGZpbGUsIG9yIGEgZGlyZWN0b3J5IGFuZCBhbGwgc3ViLWZpbGVzLCBmcm9tIHRoZSB6aXBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSB0aGUgbmFtZSBvZiB0aGUgZmlsZSB0byBkZWxldGVcbiAgICAgKiBAcmV0dXJuIHtKU1ppcH0gdGhpcyBKU1ppcCBvYmplY3RcbiAgICAgKi9cbiAgICByZW1vdmU6IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgbmFtZSA9IHRoaXMucm9vdCArIG5hbWU7XG4gICAgICAgIHZhciBmaWxlID0gdGhpcy5maWxlc1tuYW1lXTtcbiAgICAgICAgaWYgKCFmaWxlKSB7XG4gICAgICAgICAgICAvLyBMb29rIGZvciBhbnkgZm9sZGVyc1xuICAgICAgICAgICAgaWYgKG5hbWUuc2xpY2UoLTEpICE9PSBcIi9cIikge1xuICAgICAgICAgICAgICAgIG5hbWUgKz0gXCIvXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmaWxlID0gdGhpcy5maWxlc1tuYW1lXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChmaWxlICYmICFmaWxlLmRpcikge1xuICAgICAgICAgICAgLy8gZmlsZVxuICAgICAgICAgICAgZGVsZXRlIHRoaXMuZmlsZXNbbmFtZV07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBtYXliZSBhIGZvbGRlciwgZGVsZXRlIHJlY3Vyc2l2ZWx5XG4gICAgICAgICAgICB2YXIga2lkcyA9IHRoaXMuZmlsdGVyKGZ1bmN0aW9uKHJlbGF0aXZlUGF0aCwgZmlsZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmaWxlLm5hbWUuc2xpY2UoMCwgbmFtZS5sZW5ndGgpID09PSBuYW1lO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtpZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5maWxlc1traWRzW2ldLm5hbWVdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEBkZXByZWNhdGVkIFRoaXMgbWV0aG9kIGhhcyBiZWVuIHJlbW92ZWQgaW4gSlNaaXAgMy4wLCBwbGVhc2UgY2hlY2sgdGhlIHVwZ3JhZGUgZ3VpZGUuXG4gICAgICovXG4gICAgZ2VuZXJhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGlzIG1ldGhvZCBoYXMgYmVlbiByZW1vdmVkIGluIEpTWmlwIDMuMCwgcGxlYXNlIGNoZWNrIHRoZSB1cGdyYWRlIGd1aWRlLlwiKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2VuZXJhdGUgdGhlIGNvbXBsZXRlIHppcCBmaWxlIGFzIGFuIGludGVybmFsIHN0cmVhbS5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyB0aGUgb3B0aW9ucyB0byBnZW5lcmF0ZSB0aGUgemlwIGZpbGUgOlxuICAgICAqIC0gY29tcHJlc3Npb24sIFwiU1RPUkVcIiBieSBkZWZhdWx0LlxuICAgICAqIC0gdHlwZSwgXCJiYXNlNjRcIiBieSBkZWZhdWx0LiBWYWx1ZXMgYXJlIDogc3RyaW5nLCBiYXNlNjQsIHVpbnQ4YXJyYXksIGFycmF5YnVmZmVyLCBibG9iLlxuICAgICAqIEByZXR1cm4ge1N0cmVhbUhlbHBlcn0gdGhlIHN0cmVhbWVkIHppcCBmaWxlLlxuICAgICAqL1xuICAgIGdlbmVyYXRlSW50ZXJuYWxTdHJlYW06IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIHdvcmtlciwgb3B0cyA9IHt9O1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgb3B0cyA9IHV0aWxzLmV4dGVuZChvcHRpb25zIHx8IHt9LCB7XG4gICAgICAgICAgICAgICAgc3RyZWFtRmlsZXM6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGNvbXByZXNzaW9uOiBcIlNUT1JFXCIsXG4gICAgICAgICAgICAgICAgY29tcHJlc3Npb25PcHRpb25zIDogbnVsbCxcbiAgICAgICAgICAgICAgICB0eXBlOiBcIlwiLFxuICAgICAgICAgICAgICAgIHBsYXRmb3JtOiBcIkRPU1wiLFxuICAgICAgICAgICAgICAgIGNvbW1lbnQ6IG51bGwsXG4gICAgICAgICAgICAgICAgbWltZVR5cGU6IFwiYXBwbGljYXRpb24vemlwXCIsXG4gICAgICAgICAgICAgICAgZW5jb2RlRmlsZU5hbWU6IHV0ZjgudXRmOGVuY29kZVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIG9wdHMudHlwZSA9IG9wdHMudHlwZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgb3B0cy5jb21wcmVzc2lvbiA9IG9wdHMuY29tcHJlc3Npb24udG9VcHBlckNhc2UoKTtcblxuICAgICAgICAgICAgLy8gXCJiaW5hcnlzdHJpbmdcIiBpcyBwcmVmZXJyZWQgYnV0IHRoZSBpbnRlcm5hbHMgdXNlIFwic3RyaW5nXCIuXG4gICAgICAgICAgICBpZihvcHRzLnR5cGUgPT09IFwiYmluYXJ5c3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICBvcHRzLnR5cGUgPSBcInN0cmluZ1wiO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIW9wdHMudHlwZSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vIG91dHB1dCB0eXBlIHNwZWNpZmllZC5cIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHV0aWxzLmNoZWNrU3VwcG9ydChvcHRzLnR5cGUpO1xuXG4gICAgICAgICAgICAvLyBhY2NlcHQgbm9kZWpzIGBwcm9jZXNzLnBsYXRmb3JtYFxuICAgICAgICAgICAgaWYoXG4gICAgICAgICAgICAgICAgb3B0cy5wbGF0Zm9ybSA9PT0gXCJkYXJ3aW5cIiB8fFxuICAgICAgICAgICAgICAgIG9wdHMucGxhdGZvcm0gPT09IFwiZnJlZWJzZFwiIHx8XG4gICAgICAgICAgICAgICAgb3B0cy5wbGF0Zm9ybSA9PT0gXCJsaW51eFwiIHx8XG4gICAgICAgICAgICAgICAgb3B0cy5wbGF0Zm9ybSA9PT0gXCJzdW5vc1wiXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICBvcHRzLnBsYXRmb3JtID0gXCJVTklYXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAob3B0cy5wbGF0Zm9ybSA9PT0gXCJ3aW4zMlwiKSB7XG4gICAgICAgICAgICAgICAgb3B0cy5wbGF0Zm9ybSA9IFwiRE9TXCI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBjb21tZW50ID0gb3B0cy5jb21tZW50IHx8IHRoaXMuY29tbWVudCB8fCBcIlwiO1xuICAgICAgICAgICAgd29ya2VyID0gZ2VuZXJhdGUuZ2VuZXJhdGVXb3JrZXIodGhpcywgb3B0cywgY29tbWVudCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHdvcmtlciA9IG5ldyBHZW5lcmljV29ya2VyKFwiZXJyb3JcIik7XG4gICAgICAgICAgICB3b3JrZXIuZXJyb3IoZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBTdHJlYW1IZWxwZXIod29ya2VyLCBvcHRzLnR5cGUgfHwgXCJzdHJpbmdcIiwgb3B0cy5taW1lVHlwZSk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZSB0aGUgY29tcGxldGUgemlwIGZpbGUgYXN5bmNocm9ub3VzbHkuXG4gICAgICogQHNlZSBnZW5lcmF0ZUludGVybmFsU3RyZWFtXG4gICAgICovXG4gICAgZ2VuZXJhdGVBc3luYzogZnVuY3Rpb24ob3B0aW9ucywgb25VcGRhdGUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2VuZXJhdGVJbnRlcm5hbFN0cmVhbShvcHRpb25zKS5hY2N1bXVsYXRlKG9uVXBkYXRlKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlIHRoZSBjb21wbGV0ZSB6aXAgZmlsZSBhc3luY2hyb25vdXNseS5cbiAgICAgKiBAc2VlIGdlbmVyYXRlSW50ZXJuYWxTdHJlYW1cbiAgICAgKi9cbiAgICBnZW5lcmF0ZU5vZGVTdHJlYW06IGZ1bmN0aW9uKG9wdGlvbnMsIG9uVXBkYXRlKSB7XG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgICAgICBpZiAoIW9wdGlvbnMudHlwZSkge1xuICAgICAgICAgICAgb3B0aW9ucy50eXBlID0gXCJub2RlYnVmZmVyXCI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuZ2VuZXJhdGVJbnRlcm5hbFN0cmVhbShvcHRpb25zKS50b05vZGVqc1N0cmVhbShvblVwZGF0ZSk7XG4gICAgfVxufTtcbm1vZHVsZS5leHBvcnRzID0gb3V0O1xuXG59LHtcIi4vY29tcHJlc3NlZE9iamVjdFwiOjIsXCIuL2RlZmF1bHRzXCI6NSxcIi4vZ2VuZXJhdGVcIjo5LFwiLi9ub2RlanMvTm9kZWpzU3RyZWFtSW5wdXRBZGFwdGVyXCI6MTIsXCIuL25vZGVqc1V0aWxzXCI6MTQsXCIuL3N0cmVhbS9HZW5lcmljV29ya2VyXCI6MjgsXCIuL3N0cmVhbS9TdHJlYW1IZWxwZXJcIjoyOSxcIi4vdXRmOFwiOjMxLFwiLi91dGlsc1wiOjMyLFwiLi96aXBPYmplY3RcIjozNX1dLDE2OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbi8qXG4gKiBUaGlzIGZpbGUgaXMgdXNlZCBieSBtb2R1bGUgYnVuZGxlcnMgKGJyb3dzZXJpZnkvd2VicGFjay9ldGMpIHdoZW5cbiAqIGluY2x1ZGluZyBhIHN0cmVhbSBpbXBsZW1lbnRhdGlvbi4gV2UgdXNlIFwicmVhZGFibGUtc3RyZWFtXCIgdG8gZ2V0IGFcbiAqIGNvbnNpc3RlbnQgYmVoYXZpb3IgYmV0d2VlbiBub2RlanMgdmVyc2lvbnMgYnV0IGJ1bmRsZXJzIG9mdGVuIGhhdmUgYSBzaGltXG4gKiBmb3IgXCJzdHJlYW1cIi4gVXNpbmcgdGhpcyBzaGltIGdyZWF0bHkgaW1wcm92ZSB0aGUgY29tcGF0aWJpbGl0eSBhbmQgZ3JlYXRseVxuICogcmVkdWNlIHRoZSBmaW5hbCBzaXplIG9mIHRoZSBidW5kbGUgKG9ubHkgb25lIHN0cmVhbSBpbXBsZW1lbnRhdGlvbiwgbm90XG4gKiB0d28pLlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCJzdHJlYW1cIik7XG5cbn0se1wic3RyZWFtXCI6dW5kZWZpbmVkfV0sMTc6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xudmFyIERhdGFSZWFkZXIgPSByZXF1aXJlKFwiLi9EYXRhUmVhZGVyXCIpO1xudmFyIHV0aWxzID0gcmVxdWlyZShcIi4uL3V0aWxzXCIpO1xuXG5mdW5jdGlvbiBBcnJheVJlYWRlcihkYXRhKSB7XG4gICAgRGF0YVJlYWRlci5jYWxsKHRoaXMsIGRhdGEpO1xuICAgIGZvcih2YXIgaSA9IDA7IGkgPCB0aGlzLmRhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZGF0YVtpXSA9IGRhdGFbaV0gJiAweEZGO1xuICAgIH1cbn1cbnV0aWxzLmluaGVyaXRzKEFycmF5UmVhZGVyLCBEYXRhUmVhZGVyKTtcbi8qKlxuICogQHNlZSBEYXRhUmVhZGVyLmJ5dGVBdFxuICovXG5BcnJheVJlYWRlci5wcm90b3R5cGUuYnl0ZUF0ID0gZnVuY3Rpb24oaSkge1xuICAgIHJldHVybiB0aGlzLmRhdGFbdGhpcy56ZXJvICsgaV07XG59O1xuLyoqXG4gKiBAc2VlIERhdGFSZWFkZXIubGFzdEluZGV4T2ZTaWduYXR1cmVcbiAqL1xuQXJyYXlSZWFkZXIucHJvdG90eXBlLmxhc3RJbmRleE9mU2lnbmF0dXJlID0gZnVuY3Rpb24oc2lnKSB7XG4gICAgdmFyIHNpZzAgPSBzaWcuY2hhckNvZGVBdCgwKSxcbiAgICAgICAgc2lnMSA9IHNpZy5jaGFyQ29kZUF0KDEpLFxuICAgICAgICBzaWcyID0gc2lnLmNoYXJDb2RlQXQoMiksXG4gICAgICAgIHNpZzMgPSBzaWcuY2hhckNvZGVBdCgzKTtcbiAgICBmb3IgKHZhciBpID0gdGhpcy5sZW5ndGggLSA0OyBpID49IDA7IC0taSkge1xuICAgICAgICBpZiAodGhpcy5kYXRhW2ldID09PSBzaWcwICYmIHRoaXMuZGF0YVtpICsgMV0gPT09IHNpZzEgJiYgdGhpcy5kYXRhW2kgKyAyXSA9PT0gc2lnMiAmJiB0aGlzLmRhdGFbaSArIDNdID09PSBzaWczKSB7XG4gICAgICAgICAgICByZXR1cm4gaSAtIHRoaXMuemVybztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiAtMTtcbn07XG4vKipcbiAqIEBzZWUgRGF0YVJlYWRlci5yZWFkQW5kQ2hlY2tTaWduYXR1cmVcbiAqL1xuQXJyYXlSZWFkZXIucHJvdG90eXBlLnJlYWRBbmRDaGVja1NpZ25hdHVyZSA9IGZ1bmN0aW9uIChzaWcpIHtcbiAgICB2YXIgc2lnMCA9IHNpZy5jaGFyQ29kZUF0KDApLFxuICAgICAgICBzaWcxID0gc2lnLmNoYXJDb2RlQXQoMSksXG4gICAgICAgIHNpZzIgPSBzaWcuY2hhckNvZGVBdCgyKSxcbiAgICAgICAgc2lnMyA9IHNpZy5jaGFyQ29kZUF0KDMpLFxuICAgICAgICBkYXRhID0gdGhpcy5yZWFkRGF0YSg0KTtcbiAgICByZXR1cm4gc2lnMCA9PT0gZGF0YVswXSAmJiBzaWcxID09PSBkYXRhWzFdICYmIHNpZzIgPT09IGRhdGFbMl0gJiYgc2lnMyA9PT0gZGF0YVszXTtcbn07XG4vKipcbiAqIEBzZWUgRGF0YVJlYWRlci5yZWFkRGF0YVxuICovXG5BcnJheVJlYWRlci5wcm90b3R5cGUucmVhZERhdGEgPSBmdW5jdGlvbihzaXplKSB7XG4gICAgdGhpcy5jaGVja09mZnNldChzaXplKTtcbiAgICBpZihzaXplID09PSAwKSB7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgdmFyIHJlc3VsdCA9IHRoaXMuZGF0YS5zbGljZSh0aGlzLnplcm8gKyB0aGlzLmluZGV4LCB0aGlzLnplcm8gKyB0aGlzLmluZGV4ICsgc2l6ZSk7XG4gICAgdGhpcy5pbmRleCArPSBzaXplO1xuICAgIHJldHVybiByZXN1bHQ7XG59O1xubW9kdWxlLmV4cG9ydHMgPSBBcnJheVJlYWRlcjtcblxufSx7XCIuLi91dGlsc1wiOjMyLFwiLi9EYXRhUmVhZGVyXCI6MTh9XSwxODpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG52YXIgdXRpbHMgPSByZXF1aXJlKFwiLi4vdXRpbHNcIik7XG5cbmZ1bmN0aW9uIERhdGFSZWFkZXIoZGF0YSkge1xuICAgIHRoaXMuZGF0YSA9IGRhdGE7IC8vIHR5cGUgOiBzZWUgaW1wbGVtZW50YXRpb25cbiAgICB0aGlzLmxlbmd0aCA9IGRhdGEubGVuZ3RoO1xuICAgIHRoaXMuaW5kZXggPSAwO1xuICAgIHRoaXMuemVybyA9IDA7XG59XG5EYXRhUmVhZGVyLnByb3RvdHlwZSA9IHtcbiAgICAvKipcbiAgICAgKiBDaGVjayB0aGF0IHRoZSBvZmZzZXQgd2lsbCBub3QgZ28gdG9vIGZhci5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gb2Zmc2V0IHRoZSBhZGRpdGlvbmFsIG9mZnNldCB0byBjaGVjay5cbiAgICAgKiBAdGhyb3dzIHtFcnJvcn0gYW4gRXJyb3IgaWYgdGhlIG9mZnNldCBpcyBvdXQgb2YgYm91bmRzLlxuICAgICAqL1xuICAgIGNoZWNrT2Zmc2V0OiBmdW5jdGlvbihvZmZzZXQpIHtcbiAgICAgICAgdGhpcy5jaGVja0luZGV4KHRoaXMuaW5kZXggKyBvZmZzZXQpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogQ2hlY2sgdGhhdCB0aGUgc3BlY2lmaWVkIGluZGV4IHdpbGwgbm90IGJlIHRvbyBmYXIuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5ld0luZGV4IHRoZSBpbmRleCB0byBjaGVjay5cbiAgICAgKiBAdGhyb3dzIHtFcnJvcn0gYW4gRXJyb3IgaWYgdGhlIGluZGV4IGlzIG91dCBvZiBib3VuZHMuXG4gICAgICovXG4gICAgY2hlY2tJbmRleDogZnVuY3Rpb24obmV3SW5kZXgpIHtcbiAgICAgICAgaWYgKHRoaXMubGVuZ3RoIDwgdGhpcy56ZXJvICsgbmV3SW5kZXggfHwgbmV3SW5kZXggPCAwKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFbmQgb2YgZGF0YSByZWFjaGVkIChkYXRhIGxlbmd0aCA9IFwiICsgdGhpcy5sZW5ndGggKyBcIiwgYXNrZWQgaW5kZXggPSBcIiArIChuZXdJbmRleCkgKyBcIikuIENvcnJ1cHRlZCB6aXAgP1wiKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICogQ2hhbmdlIHRoZSBpbmRleC5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gbmV3SW5kZXggVGhlIG5ldyBpbmRleC5cbiAgICAgKiBAdGhyb3dzIHtFcnJvcn0gaWYgdGhlIG5ldyBpbmRleCBpcyBvdXQgb2YgdGhlIGRhdGEuXG4gICAgICovXG4gICAgc2V0SW5kZXg6IGZ1bmN0aW9uKG5ld0luZGV4KSB7XG4gICAgICAgIHRoaXMuY2hlY2tJbmRleChuZXdJbmRleCk7XG4gICAgICAgIHRoaXMuaW5kZXggPSBuZXdJbmRleDtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIFNraXAgdGhlIG5leHQgbiBieXRlcy5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gbiB0aGUgbnVtYmVyIG9mIGJ5dGVzIHRvIHNraXAuXG4gICAgICogQHRocm93cyB7RXJyb3J9IGlmIHRoZSBuZXcgaW5kZXggaXMgb3V0IG9mIHRoZSBkYXRhLlxuICAgICAqL1xuICAgIHNraXA6IGZ1bmN0aW9uKG4pIHtcbiAgICAgICAgdGhpcy5zZXRJbmRleCh0aGlzLmluZGV4ICsgbik7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIGJ5dGUgYXQgdGhlIHNwZWNpZmllZCBpbmRleC5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gaSB0aGUgaW5kZXggdG8gdXNlLlxuICAgICAqIEByZXR1cm4ge251bWJlcn0gYSBieXRlLlxuICAgICAqL1xuICAgIGJ5dGVBdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIHNlZSBpbXBsZW1lbnRhdGlvbnNcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgbmV4dCBudW1iZXIgd2l0aCBhIGdpdmVuIGJ5dGUgc2l6ZS5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gc2l6ZSB0aGUgbnVtYmVyIG9mIGJ5dGVzIHRvIHJlYWQuXG4gICAgICogQHJldHVybiB7bnVtYmVyfSB0aGUgY29ycmVzcG9uZGluZyBudW1iZXIuXG4gICAgICovXG4gICAgcmVhZEludDogZnVuY3Rpb24oc2l6ZSkge1xuICAgICAgICB2YXIgcmVzdWx0ID0gMCxcbiAgICAgICAgICAgIGk7XG4gICAgICAgIHRoaXMuY2hlY2tPZmZzZXQoc2l6ZSk7XG4gICAgICAgIGZvciAoaSA9IHRoaXMuaW5kZXggKyBzaXplIC0gMTsgaSA+PSB0aGlzLmluZGV4OyBpLS0pIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IChyZXN1bHQgPDwgOCkgKyB0aGlzLmJ5dGVBdChpKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmluZGV4ICs9IHNpemU7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIG5leHQgc3RyaW5nIHdpdGggYSBnaXZlbiBieXRlIHNpemUuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHNpemUgdGhlIG51bWJlciBvZiBieXRlcyB0byByZWFkLlxuICAgICAqIEByZXR1cm4ge3N0cmluZ30gdGhlIGNvcnJlc3BvbmRpbmcgc3RyaW5nLlxuICAgICAqL1xuICAgIHJlYWRTdHJpbmc6IGZ1bmN0aW9uKHNpemUpIHtcbiAgICAgICAgcmV0dXJuIHV0aWxzLnRyYW5zZm9ybVRvKFwic3RyaW5nXCIsIHRoaXMucmVhZERhdGEoc2l6ZSkpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogR2V0IHJhdyBkYXRhIHdpdGhvdXQgY29udmVyc2lvbiwgPHNpemU+IGJ5dGVzLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBzaXplIHRoZSBudW1iZXIgb2YgYnl0ZXMgdG8gcmVhZC5cbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IHRoZSByYXcgZGF0YSwgaW1wbGVtZW50YXRpb24gc3BlY2lmaWMuXG4gICAgICovXG4gICAgcmVhZERhdGE6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBzZWUgaW1wbGVtZW50YXRpb25zXG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBGaW5kIHRoZSBsYXN0IG9jY3VycmVuY2Ugb2YgYSB6aXAgc2lnbmF0dXJlICg0IGJ5dGVzKS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc2lnIHRoZSBzaWduYXR1cmUgdG8gZmluZC5cbiAgICAgKiBAcmV0dXJuIHtudW1iZXJ9IHRoZSBpbmRleCBvZiB0aGUgbGFzdCBvY2N1cnJlbmNlLCAtMSBpZiBub3QgZm91bmQuXG4gICAgICovXG4gICAgbGFzdEluZGV4T2ZTaWduYXR1cmU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBzZWUgaW1wbGVtZW50YXRpb25zXG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBSZWFkIHRoZSBzaWduYXR1cmUgKDQgYnl0ZXMpIGF0IHRoZSBjdXJyZW50IHBvc2l0aW9uIGFuZCBjb21wYXJlIGl0IHdpdGggc2lnLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzaWcgdGhlIGV4cGVjdGVkIHNpZ25hdHVyZVxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhlIHNpZ25hdHVyZSBtYXRjaGVzLCBmYWxzZSBvdGhlcndpc2UuXG4gICAgICovXG4gICAgcmVhZEFuZENoZWNrU2lnbmF0dXJlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gc2VlIGltcGxlbWVudGF0aW9uc1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBuZXh0IGRhdGUuXG4gICAgICogQHJldHVybiB7RGF0ZX0gdGhlIGRhdGUuXG4gICAgICovXG4gICAgcmVhZERhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZG9zdGltZSA9IHRoaXMucmVhZEludCg0KTtcbiAgICAgICAgcmV0dXJuIG5ldyBEYXRlKERhdGUuVVRDKFxuICAgICAgICAgICAgKChkb3N0aW1lID4+IDI1KSAmIDB4N2YpICsgMTk4MCwgLy8geWVhclxuICAgICAgICAgICAgKChkb3N0aW1lID4+IDIxKSAmIDB4MGYpIC0gMSwgLy8gbW9udGhcbiAgICAgICAgICAgIChkb3N0aW1lID4+IDE2KSAmIDB4MWYsIC8vIGRheVxuICAgICAgICAgICAgKGRvc3RpbWUgPj4gMTEpICYgMHgxZiwgLy8gaG91clxuICAgICAgICAgICAgKGRvc3RpbWUgPj4gNSkgJiAweDNmLCAvLyBtaW51dGVcbiAgICAgICAgICAgIChkb3N0aW1lICYgMHgxZikgPDwgMSkpOyAvLyBzZWNvbmRcbiAgICB9XG59O1xubW9kdWxlLmV4cG9ydHMgPSBEYXRhUmVhZGVyO1xuXG59LHtcIi4uL3V0aWxzXCI6MzJ9XSwxOTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG52YXIgVWludDhBcnJheVJlYWRlciA9IHJlcXVpcmUoXCIuL1VpbnQ4QXJyYXlSZWFkZXJcIik7XG52YXIgdXRpbHMgPSByZXF1aXJlKFwiLi4vdXRpbHNcIik7XG5cbmZ1bmN0aW9uIE5vZGVCdWZmZXJSZWFkZXIoZGF0YSkge1xuICAgIFVpbnQ4QXJyYXlSZWFkZXIuY2FsbCh0aGlzLCBkYXRhKTtcbn1cbnV0aWxzLmluaGVyaXRzKE5vZGVCdWZmZXJSZWFkZXIsIFVpbnQ4QXJyYXlSZWFkZXIpO1xuXG4vKipcbiAqIEBzZWUgRGF0YVJlYWRlci5yZWFkRGF0YVxuICovXG5Ob2RlQnVmZmVyUmVhZGVyLnByb3RvdHlwZS5yZWFkRGF0YSA9IGZ1bmN0aW9uKHNpemUpIHtcbiAgICB0aGlzLmNoZWNrT2Zmc2V0KHNpemUpO1xuICAgIHZhciByZXN1bHQgPSB0aGlzLmRhdGEuc2xpY2UodGhpcy56ZXJvICsgdGhpcy5pbmRleCwgdGhpcy56ZXJvICsgdGhpcy5pbmRleCArIHNpemUpO1xuICAgIHRoaXMuaW5kZXggKz0gc2l6ZTtcbiAgICByZXR1cm4gcmVzdWx0O1xufTtcbm1vZHVsZS5leHBvcnRzID0gTm9kZUJ1ZmZlclJlYWRlcjtcblxufSx7XCIuLi91dGlsc1wiOjMyLFwiLi9VaW50OEFycmF5UmVhZGVyXCI6MjF9XSwyMDpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG52YXIgRGF0YVJlYWRlciA9IHJlcXVpcmUoXCIuL0RhdGFSZWFkZXJcIik7XG52YXIgdXRpbHMgPSByZXF1aXJlKFwiLi4vdXRpbHNcIik7XG5cbmZ1bmN0aW9uIFN0cmluZ1JlYWRlcihkYXRhKSB7XG4gICAgRGF0YVJlYWRlci5jYWxsKHRoaXMsIGRhdGEpO1xufVxudXRpbHMuaW5oZXJpdHMoU3RyaW5nUmVhZGVyLCBEYXRhUmVhZGVyKTtcbi8qKlxuICogQHNlZSBEYXRhUmVhZGVyLmJ5dGVBdFxuICovXG5TdHJpbmdSZWFkZXIucHJvdG90eXBlLmJ5dGVBdCA9IGZ1bmN0aW9uKGkpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhLmNoYXJDb2RlQXQodGhpcy56ZXJvICsgaSk7XG59O1xuLyoqXG4gKiBAc2VlIERhdGFSZWFkZXIubGFzdEluZGV4T2ZTaWduYXR1cmVcbiAqL1xuU3RyaW5nUmVhZGVyLnByb3RvdHlwZS5sYXN0SW5kZXhPZlNpZ25hdHVyZSA9IGZ1bmN0aW9uKHNpZykge1xuICAgIHJldHVybiB0aGlzLmRhdGEubGFzdEluZGV4T2Yoc2lnKSAtIHRoaXMuemVybztcbn07XG4vKipcbiAqIEBzZWUgRGF0YVJlYWRlci5yZWFkQW5kQ2hlY2tTaWduYXR1cmVcbiAqL1xuU3RyaW5nUmVhZGVyLnByb3RvdHlwZS5yZWFkQW5kQ2hlY2tTaWduYXR1cmUgPSBmdW5jdGlvbiAoc2lnKSB7XG4gICAgdmFyIGRhdGEgPSB0aGlzLnJlYWREYXRhKDQpO1xuICAgIHJldHVybiBzaWcgPT09IGRhdGE7XG59O1xuLyoqXG4gKiBAc2VlIERhdGFSZWFkZXIucmVhZERhdGFcbiAqL1xuU3RyaW5nUmVhZGVyLnByb3RvdHlwZS5yZWFkRGF0YSA9IGZ1bmN0aW9uKHNpemUpIHtcbiAgICB0aGlzLmNoZWNrT2Zmc2V0KHNpemUpO1xuICAgIC8vIHRoaXMgd2lsbCB3b3JrIGJlY2F1c2UgdGhlIGNvbnN0cnVjdG9yIGFwcGxpZWQgdGhlIFwiJiAweGZmXCIgbWFzay5cbiAgICB2YXIgcmVzdWx0ID0gdGhpcy5kYXRhLnNsaWNlKHRoaXMuemVybyArIHRoaXMuaW5kZXgsIHRoaXMuemVybyArIHRoaXMuaW5kZXggKyBzaXplKTtcbiAgICB0aGlzLmluZGV4ICs9IHNpemU7XG4gICAgcmV0dXJuIHJlc3VsdDtcbn07XG5tb2R1bGUuZXhwb3J0cyA9IFN0cmluZ1JlYWRlcjtcblxufSx7XCIuLi91dGlsc1wiOjMyLFwiLi9EYXRhUmVhZGVyXCI6MTh9XSwyMTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG52YXIgQXJyYXlSZWFkZXIgPSByZXF1aXJlKFwiLi9BcnJheVJlYWRlclwiKTtcbnZhciB1dGlscyA9IHJlcXVpcmUoXCIuLi91dGlsc1wiKTtcblxuZnVuY3Rpb24gVWludDhBcnJheVJlYWRlcihkYXRhKSB7XG4gICAgQXJyYXlSZWFkZXIuY2FsbCh0aGlzLCBkYXRhKTtcbn1cbnV0aWxzLmluaGVyaXRzKFVpbnQ4QXJyYXlSZWFkZXIsIEFycmF5UmVhZGVyKTtcbi8qKlxuICogQHNlZSBEYXRhUmVhZGVyLnJlYWREYXRhXG4gKi9cblVpbnQ4QXJyYXlSZWFkZXIucHJvdG90eXBlLnJlYWREYXRhID0gZnVuY3Rpb24oc2l6ZSkge1xuICAgIHRoaXMuY2hlY2tPZmZzZXQoc2l6ZSk7XG4gICAgaWYoc2l6ZSA9PT0gMCkge1xuICAgICAgICAvLyBpbiBJRTEwLCB3aGVuIHVzaW5nIHN1YmFycmF5KGlkeCwgaWR4KSwgd2UgZ2V0IHRoZSBhcnJheSBbMHgwMF0gaW5zdGVhZCBvZiBbXS5cbiAgICAgICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KDApO1xuICAgIH1cbiAgICB2YXIgcmVzdWx0ID0gdGhpcy5kYXRhLnN1YmFycmF5KHRoaXMuemVybyArIHRoaXMuaW5kZXgsIHRoaXMuemVybyArIHRoaXMuaW5kZXggKyBzaXplKTtcbiAgICB0aGlzLmluZGV4ICs9IHNpemU7XG4gICAgcmV0dXJuIHJlc3VsdDtcbn07XG5tb2R1bGUuZXhwb3J0cyA9IFVpbnQ4QXJyYXlSZWFkZXI7XG5cbn0se1wiLi4vdXRpbHNcIjozMixcIi4vQXJyYXlSZWFkZXJcIjoxN31dLDIyOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcblxudmFyIHV0aWxzID0gcmVxdWlyZShcIi4uL3V0aWxzXCIpO1xudmFyIHN1cHBvcnQgPSByZXF1aXJlKFwiLi4vc3VwcG9ydFwiKTtcbnZhciBBcnJheVJlYWRlciA9IHJlcXVpcmUoXCIuL0FycmF5UmVhZGVyXCIpO1xudmFyIFN0cmluZ1JlYWRlciA9IHJlcXVpcmUoXCIuL1N0cmluZ1JlYWRlclwiKTtcbnZhciBOb2RlQnVmZmVyUmVhZGVyID0gcmVxdWlyZShcIi4vTm9kZUJ1ZmZlclJlYWRlclwiKTtcbnZhciBVaW50OEFycmF5UmVhZGVyID0gcmVxdWlyZShcIi4vVWludDhBcnJheVJlYWRlclwiKTtcblxuLyoqXG4gKiBDcmVhdGUgYSByZWFkZXIgYWRhcHRlZCB0byB0aGUgZGF0YS5cbiAqIEBwYXJhbSB7U3RyaW5nfEFycmF5QnVmZmVyfFVpbnQ4QXJyYXl8QnVmZmVyfSBkYXRhIHRoZSBkYXRhIHRvIHJlYWQuXG4gKiBAcmV0dXJuIHtEYXRhUmVhZGVyfSB0aGUgZGF0YSByZWFkZXIuXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICB2YXIgdHlwZSA9IHV0aWxzLmdldFR5cGVPZihkYXRhKTtcbiAgICB1dGlscy5jaGVja1N1cHBvcnQodHlwZSk7XG4gICAgaWYgKHR5cGUgPT09IFwic3RyaW5nXCIgJiYgIXN1cHBvcnQudWludDhhcnJheSkge1xuICAgICAgICByZXR1cm4gbmV3IFN0cmluZ1JlYWRlcihkYXRhKTtcbiAgICB9XG4gICAgaWYgKHR5cGUgPT09IFwibm9kZWJ1ZmZlclwiKSB7XG4gICAgICAgIHJldHVybiBuZXcgTm9kZUJ1ZmZlclJlYWRlcihkYXRhKTtcbiAgICB9XG4gICAgaWYgKHN1cHBvcnQudWludDhhcnJheSkge1xuICAgICAgICByZXR1cm4gbmV3IFVpbnQ4QXJyYXlSZWFkZXIodXRpbHMudHJhbnNmb3JtVG8oXCJ1aW50OGFycmF5XCIsIGRhdGEpKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBBcnJheVJlYWRlcih1dGlscy50cmFuc2Zvcm1UbyhcImFycmF5XCIsIGRhdGEpKTtcbn07XG5cbn0se1wiLi4vc3VwcG9ydFwiOjMwLFwiLi4vdXRpbHNcIjozMixcIi4vQXJyYXlSZWFkZXJcIjoxNyxcIi4vTm9kZUJ1ZmZlclJlYWRlclwiOjE5LFwiLi9TdHJpbmdSZWFkZXJcIjoyMCxcIi4vVWludDhBcnJheVJlYWRlclwiOjIxfV0sMjM6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuZXhwb3J0cy5MT0NBTF9GSUxFX0hFQURFUiA9IFwiUEtcXHgwM1xceDA0XCI7XG5leHBvcnRzLkNFTlRSQUxfRklMRV9IRUFERVIgPSBcIlBLXFx4MDFcXHgwMlwiO1xuZXhwb3J0cy5DRU5UUkFMX0RJUkVDVE9SWV9FTkQgPSBcIlBLXFx4MDVcXHgwNlwiO1xuZXhwb3J0cy5aSVA2NF9DRU5UUkFMX0RJUkVDVE9SWV9MT0NBVE9SID0gXCJQS1xceDA2XFx4MDdcIjtcbmV4cG9ydHMuWklQNjRfQ0VOVFJBTF9ESVJFQ1RPUllfRU5EID0gXCJQS1xceDA2XFx4MDZcIjtcbmV4cG9ydHMuREFUQV9ERVNDUklQVE9SID0gXCJQS1xceDA3XFx4MDhcIjtcblxufSx7fV0sMjQ6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXG52YXIgR2VuZXJpY1dvcmtlciA9IHJlcXVpcmUoXCIuL0dlbmVyaWNXb3JrZXJcIik7XG52YXIgdXRpbHMgPSByZXF1aXJlKFwiLi4vdXRpbHNcIik7XG5cbi8qKlxuICogQSB3b3JrZXIgd2hpY2ggY29udmVydCBjaHVua3MgdG8gYSBzcGVjaWZpZWQgdHlwZS5cbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtTdHJpbmd9IGRlc3RUeXBlIHRoZSBkZXN0aW5hdGlvbiB0eXBlLlxuICovXG5mdW5jdGlvbiBDb252ZXJ0V29ya2VyKGRlc3RUeXBlKSB7XG4gICAgR2VuZXJpY1dvcmtlci5jYWxsKHRoaXMsIFwiQ29udmVydFdvcmtlciB0byBcIiArIGRlc3RUeXBlKTtcbiAgICB0aGlzLmRlc3RUeXBlID0gZGVzdFR5cGU7XG59XG51dGlscy5pbmhlcml0cyhDb252ZXJ0V29ya2VyLCBHZW5lcmljV29ya2VyKTtcblxuLyoqXG4gKiBAc2VlIEdlbmVyaWNXb3JrZXIucHJvY2Vzc0NodW5rXG4gKi9cbkNvbnZlcnRXb3JrZXIucHJvdG90eXBlLnByb2Nlc3NDaHVuayA9IGZ1bmN0aW9uIChjaHVuaykge1xuICAgIHRoaXMucHVzaCh7XG4gICAgICAgIGRhdGEgOiB1dGlscy50cmFuc2Zvcm1Ubyh0aGlzLmRlc3RUeXBlLCBjaHVuay5kYXRhKSxcbiAgICAgICAgbWV0YSA6IGNodW5rLm1ldGFcbiAgICB9KTtcbn07XG5tb2R1bGUuZXhwb3J0cyA9IENvbnZlcnRXb3JrZXI7XG5cbn0se1wiLi4vdXRpbHNcIjozMixcIi4vR2VuZXJpY1dvcmtlclwiOjI4fV0sMjU6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXG52YXIgR2VuZXJpY1dvcmtlciA9IHJlcXVpcmUoXCIuL0dlbmVyaWNXb3JrZXJcIik7XG52YXIgY3JjMzIgPSByZXF1aXJlKFwiLi4vY3JjMzJcIik7XG52YXIgdXRpbHMgPSByZXF1aXJlKFwiLi4vdXRpbHNcIik7XG5cbi8qKlxuICogQSB3b3JrZXIgd2hpY2ggY2FsY3VsYXRlIHRoZSBjcmMzMiBvZiB0aGUgZGF0YSBmbG93aW5nIHRocm91Z2guXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gQ3JjMzJQcm9iZSgpIHtcbiAgICBHZW5lcmljV29ya2VyLmNhbGwodGhpcywgXCJDcmMzMlByb2JlXCIpO1xuICAgIHRoaXMud2l0aFN0cmVhbUluZm8oXCJjcmMzMlwiLCAwKTtcbn1cbnV0aWxzLmluaGVyaXRzKENyYzMyUHJvYmUsIEdlbmVyaWNXb3JrZXIpO1xuXG4vKipcbiAqIEBzZWUgR2VuZXJpY1dvcmtlci5wcm9jZXNzQ2h1bmtcbiAqL1xuQ3JjMzJQcm9iZS5wcm90b3R5cGUucHJvY2Vzc0NodW5rID0gZnVuY3Rpb24gKGNodW5rKSB7XG4gICAgdGhpcy5zdHJlYW1JbmZvLmNyYzMyID0gY3JjMzIoY2h1bmsuZGF0YSwgdGhpcy5zdHJlYW1JbmZvLmNyYzMyIHx8IDApO1xuICAgIHRoaXMucHVzaChjaHVuayk7XG59O1xubW9kdWxlLmV4cG9ydHMgPSBDcmMzMlByb2JlO1xuXG59LHtcIi4uL2NyYzMyXCI6NCxcIi4uL3V0aWxzXCI6MzIsXCIuL0dlbmVyaWNXb3JrZXJcIjoyOH1dLDI2OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcblxudmFyIHV0aWxzID0gcmVxdWlyZShcIi4uL3V0aWxzXCIpO1xudmFyIEdlbmVyaWNXb3JrZXIgPSByZXF1aXJlKFwiLi9HZW5lcmljV29ya2VyXCIpO1xuXG4vKipcbiAqIEEgd29ya2VyIHdoaWNoIGNhbGN1bGF0ZSB0aGUgdG90YWwgbGVuZ3RoIG9mIHRoZSBkYXRhIGZsb3dpbmcgdGhyb3VnaC5cbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtTdHJpbmd9IHByb3BOYW1lIHRoZSBuYW1lIHVzZWQgdG8gZXhwb3NlIHRoZSBsZW5ndGhcbiAqL1xuZnVuY3Rpb24gRGF0YUxlbmd0aFByb2JlKHByb3BOYW1lKSB7XG4gICAgR2VuZXJpY1dvcmtlci5jYWxsKHRoaXMsIFwiRGF0YUxlbmd0aFByb2JlIGZvciBcIiArIHByb3BOYW1lKTtcbiAgICB0aGlzLnByb3BOYW1lID0gcHJvcE5hbWU7XG4gICAgdGhpcy53aXRoU3RyZWFtSW5mbyhwcm9wTmFtZSwgMCk7XG59XG51dGlscy5pbmhlcml0cyhEYXRhTGVuZ3RoUHJvYmUsIEdlbmVyaWNXb3JrZXIpO1xuXG4vKipcbiAqIEBzZWUgR2VuZXJpY1dvcmtlci5wcm9jZXNzQ2h1bmtcbiAqL1xuRGF0YUxlbmd0aFByb2JlLnByb3RvdHlwZS5wcm9jZXNzQ2h1bmsgPSBmdW5jdGlvbiAoY2h1bmspIHtcbiAgICBpZihjaHVuaykge1xuICAgICAgICB2YXIgbGVuZ3RoID0gdGhpcy5zdHJlYW1JbmZvW3RoaXMucHJvcE5hbWVdIHx8IDA7XG4gICAgICAgIHRoaXMuc3RyZWFtSW5mb1t0aGlzLnByb3BOYW1lXSA9IGxlbmd0aCArIGNodW5rLmRhdGEubGVuZ3RoO1xuICAgIH1cbiAgICBHZW5lcmljV29ya2VyLnByb3RvdHlwZS5wcm9jZXNzQ2h1bmsuY2FsbCh0aGlzLCBjaHVuayk7XG59O1xubW9kdWxlLmV4cG9ydHMgPSBEYXRhTGVuZ3RoUHJvYmU7XG5cblxufSx7XCIuLi91dGlsc1wiOjMyLFwiLi9HZW5lcmljV29ya2VyXCI6Mjh9XSwyNzpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG5cbnZhciB1dGlscyA9IHJlcXVpcmUoXCIuLi91dGlsc1wiKTtcbnZhciBHZW5lcmljV29ya2VyID0gcmVxdWlyZShcIi4vR2VuZXJpY1dvcmtlclwiKTtcblxuLy8gdGhlIHNpemUgb2YgdGhlIGdlbmVyYXRlZCBjaHVua3Ncbi8vIFRPRE8gZXhwb3NlIHRoaXMgYXMgYSBwdWJsaWMgdmFyaWFibGVcbnZhciBERUZBVUxUX0JMT0NLX1NJWkUgPSAxNiAqIDEwMjQ7XG5cbi8qKlxuICogQSB3b3JrZXIgdGhhdCByZWFkcyBhIGNvbnRlbnQgYW5kIGVtaXRzIGNodW5rcy5cbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtQcm9taXNlfSBkYXRhUCB0aGUgcHJvbWlzZSBvZiB0aGUgZGF0YSB0byBzcGxpdFxuICovXG5mdW5jdGlvbiBEYXRhV29ya2VyKGRhdGFQKSB7XG4gICAgR2VuZXJpY1dvcmtlci5jYWxsKHRoaXMsIFwiRGF0YVdvcmtlclwiKTtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdGhpcy5kYXRhSXNSZWFkeSA9IGZhbHNlO1xuICAgIHRoaXMuaW5kZXggPSAwO1xuICAgIHRoaXMubWF4ID0gMDtcbiAgICB0aGlzLmRhdGEgPSBudWxsO1xuICAgIHRoaXMudHlwZSA9IFwiXCI7XG5cbiAgICB0aGlzLl90aWNrU2NoZWR1bGVkID0gZmFsc2U7XG5cbiAgICBkYXRhUC50aGVuKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgIHNlbGYuZGF0YUlzUmVhZHkgPSB0cnVlO1xuICAgICAgICBzZWxmLmRhdGEgPSBkYXRhO1xuICAgICAgICBzZWxmLm1heCA9IGRhdGEgJiYgZGF0YS5sZW5ndGggfHwgMDtcbiAgICAgICAgc2VsZi50eXBlID0gdXRpbHMuZ2V0VHlwZU9mKGRhdGEpO1xuICAgICAgICBpZighc2VsZi5pc1BhdXNlZCkge1xuICAgICAgICAgICAgc2VsZi5fdGlja0FuZFJlcGVhdCgpO1xuICAgICAgICB9XG4gICAgfSwgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgc2VsZi5lcnJvcihlKTtcbiAgICB9KTtcbn1cblxudXRpbHMuaW5oZXJpdHMoRGF0YVdvcmtlciwgR2VuZXJpY1dvcmtlcik7XG5cbi8qKlxuICogQHNlZSBHZW5lcmljV29ya2VyLmNsZWFuVXBcbiAqL1xuRGF0YVdvcmtlci5wcm90b3R5cGUuY2xlYW5VcCA9IGZ1bmN0aW9uICgpIHtcbiAgICBHZW5lcmljV29ya2VyLnByb3RvdHlwZS5jbGVhblVwLmNhbGwodGhpcyk7XG4gICAgdGhpcy5kYXRhID0gbnVsbDtcbn07XG5cbi8qKlxuICogQHNlZSBHZW5lcmljV29ya2VyLnJlc3VtZVxuICovXG5EYXRhV29ya2VyLnByb3RvdHlwZS5yZXN1bWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYoIUdlbmVyaWNXb3JrZXIucHJvdG90eXBlLnJlc3VtZS5jYWxsKHRoaXMpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuX3RpY2tTY2hlZHVsZWQgJiYgdGhpcy5kYXRhSXNSZWFkeSkge1xuICAgICAgICB0aGlzLl90aWNrU2NoZWR1bGVkID0gdHJ1ZTtcbiAgICAgICAgdXRpbHMuZGVsYXkodGhpcy5fdGlja0FuZFJlcGVhdCwgW10sIHRoaXMpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbn07XG5cbi8qKlxuICogVHJpZ2dlciBhIHRpY2sgYSBzY2hlZHVsZSBhbiBvdGhlciBjYWxsIHRvIHRoaXMgZnVuY3Rpb24uXG4gKi9cbkRhdGFXb3JrZXIucHJvdG90eXBlLl90aWNrQW5kUmVwZWF0ID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5fdGlja1NjaGVkdWxlZCA9IGZhbHNlO1xuICAgIGlmKHRoaXMuaXNQYXVzZWQgfHwgdGhpcy5pc0ZpbmlzaGVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5fdGljaygpO1xuICAgIGlmKCF0aGlzLmlzRmluaXNoZWQpIHtcbiAgICAgICAgdXRpbHMuZGVsYXkodGhpcy5fdGlja0FuZFJlcGVhdCwgW10sIHRoaXMpO1xuICAgICAgICB0aGlzLl90aWNrU2NoZWR1bGVkID0gdHJ1ZTtcbiAgICB9XG59O1xuXG4vKipcbiAqIFJlYWQgYW5kIHB1c2ggYSBjaHVuay5cbiAqL1xuRGF0YVdvcmtlci5wcm90b3R5cGUuX3RpY2sgPSBmdW5jdGlvbigpIHtcblxuICAgIGlmKHRoaXMuaXNQYXVzZWQgfHwgdGhpcy5pc0ZpbmlzaGVkKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICB2YXIgc2l6ZSA9IERFRkFVTFRfQkxPQ0tfU0laRTtcbiAgICB2YXIgZGF0YSA9IG51bGwsIG5leHRJbmRleCA9IE1hdGgubWluKHRoaXMubWF4LCB0aGlzLmluZGV4ICsgc2l6ZSk7XG4gICAgaWYgKHRoaXMuaW5kZXggPj0gdGhpcy5tYXgpIHtcbiAgICAgICAgLy8gRU9GXG4gICAgICAgIHJldHVybiB0aGlzLmVuZCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHN3aXRjaCh0aGlzLnR5cGUpIHtcbiAgICAgICAgY2FzZSBcInN0cmluZ1wiOlxuICAgICAgICAgICAgZGF0YSA9IHRoaXMuZGF0YS5zdWJzdHJpbmcodGhpcy5pbmRleCwgbmV4dEluZGV4KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwidWludDhhcnJheVwiOlxuICAgICAgICAgICAgZGF0YSA9IHRoaXMuZGF0YS5zdWJhcnJheSh0aGlzLmluZGV4LCBuZXh0SW5kZXgpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJhcnJheVwiOlxuICAgICAgICBjYXNlIFwibm9kZWJ1ZmZlclwiOlxuICAgICAgICAgICAgZGF0YSA9IHRoaXMuZGF0YS5zbGljZSh0aGlzLmluZGV4LCBuZXh0SW5kZXgpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pbmRleCA9IG5leHRJbmRleDtcbiAgICAgICAgcmV0dXJuIHRoaXMucHVzaCh7XG4gICAgICAgICAgICBkYXRhIDogZGF0YSxcbiAgICAgICAgICAgIG1ldGEgOiB7XG4gICAgICAgICAgICAgICAgcGVyY2VudCA6IHRoaXMubWF4ID8gdGhpcy5pbmRleCAvIHRoaXMubWF4ICogMTAwIDogMFxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IERhdGFXb3JrZXI7XG5cbn0se1wiLi4vdXRpbHNcIjozMixcIi4vR2VuZXJpY1dvcmtlclwiOjI4fV0sMjg6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXG4vKipcbiAqIEEgd29ya2VyIHRoYXQgZG9lcyBub3RoaW5nIGJ1dCBwYXNzaW5nIGNodW5rcyB0byB0aGUgbmV4dCBvbmUuIFRoaXMgaXMgbGlrZVxuICogYSBub2RlanMgc3RyZWFtIGJ1dCB3aXRoIHNvbWUgZGlmZmVyZW5jZXMuIE9uIHRoZSBnb29kIHNpZGUgOlxuICogLSBpdCB3b3JrcyBvbiBJRSA2LTkgd2l0aG91dCBhbnkgaXNzdWUgLyBwb2x5ZmlsbFxuICogLSBpdCB3ZWlnaHRzIGxlc3MgdGhhbiB0aGUgZnVsbCBkZXBlbmRlbmNpZXMgYnVuZGxlZCB3aXRoIGJyb3dzZXJpZnlcbiAqIC0gaXQgZm9yd2FyZHMgZXJyb3JzIChubyBuZWVkIHRvIGRlY2xhcmUgYW4gZXJyb3IgaGFuZGxlciBFVkVSWVdIRVJFKVxuICpcbiAqIEEgY2h1bmsgaXMgYW4gb2JqZWN0IHdpdGggMiBhdHRyaWJ1dGVzIDogYG1ldGFgIGFuZCBgZGF0YWAuIFRoZSBmb3JtZXIgaXMgYW5cbiAqIG9iamVjdCBjb250YWluaW5nIGFueXRoaW5nIChgcGVyY2VudGAgZm9yIGV4YW1wbGUpLCBzZWUgZWFjaCB3b3JrZXIgZm9yIG1vcmVcbiAqIGRldGFpbHMuIFRoZSBsYXR0ZXIgaXMgdGhlIHJlYWwgZGF0YSAoU3RyaW5nLCBVaW50OEFycmF5LCBldGMpLlxuICpcbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgdGhlIG5hbWUgb2YgdGhlIHN0cmVhbSAobWFpbmx5IHVzZWQgZm9yIGRlYnVnZ2luZyBwdXJwb3NlcylcbiAqL1xuZnVuY3Rpb24gR2VuZXJpY1dvcmtlcihuYW1lKSB7XG4gICAgLy8gdGhlIG5hbWUgb2YgdGhlIHdvcmtlclxuICAgIHRoaXMubmFtZSA9IG5hbWUgfHwgXCJkZWZhdWx0XCI7XG4gICAgLy8gYW4gb2JqZWN0IGNvbnRhaW5pbmcgbWV0YWRhdGEgYWJvdXQgdGhlIHdvcmtlcnMgY2hhaW5cbiAgICB0aGlzLnN0cmVhbUluZm8gPSB7fTtcbiAgICAvLyBhbiBlcnJvciB3aGljaCBoYXBwZW5lZCB3aGVuIHRoZSB3b3JrZXIgd2FzIHBhdXNlZFxuICAgIHRoaXMuZ2VuZXJhdGVkRXJyb3IgPSBudWxsO1xuICAgIC8vIGFuIG9iamVjdCBjb250YWluaW5nIG1ldGFkYXRhIHRvIGJlIG1lcmdlZCBieSB0aGlzIHdvcmtlciBpbnRvIHRoZSBnZW5lcmFsIG1ldGFkYXRhXG4gICAgdGhpcy5leHRyYVN0cmVhbUluZm8gPSB7fTtcbiAgICAvLyB0cnVlIGlmIHRoZSBzdHJlYW0gaXMgcGF1c2VkIChhbmQgc2hvdWxkIG5vdCBkbyBhbnl0aGluZyksIGZhbHNlIG90aGVyd2lzZVxuICAgIHRoaXMuaXNQYXVzZWQgPSB0cnVlO1xuICAgIC8vIHRydWUgaWYgdGhlIHN0cmVhbSBpcyBmaW5pc2hlZCAoYW5kIHNob3VsZCBub3QgZG8gYW55dGhpbmcpLCBmYWxzZSBvdGhlcndpc2VcbiAgICB0aGlzLmlzRmluaXNoZWQgPSBmYWxzZTtcbiAgICAvLyB0cnVlIGlmIHRoZSBzdHJlYW0gaXMgbG9ja2VkIHRvIHByZXZlbnQgZnVydGhlciBzdHJ1Y3R1cmUgdXBkYXRlcyAocGlwZSksIGZhbHNlIG90aGVyd2lzZVxuICAgIHRoaXMuaXNMb2NrZWQgPSBmYWxzZTtcbiAgICAvLyB0aGUgZXZlbnQgbGlzdGVuZXJzXG4gICAgdGhpcy5fbGlzdGVuZXJzID0ge1xuICAgICAgICBcImRhdGFcIjpbXSxcbiAgICAgICAgXCJlbmRcIjpbXSxcbiAgICAgICAgXCJlcnJvclwiOltdXG4gICAgfTtcbiAgICAvLyB0aGUgcHJldmlvdXMgd29ya2VyLCBpZiBhbnlcbiAgICB0aGlzLnByZXZpb3VzID0gbnVsbDtcbn1cblxuR2VuZXJpY1dvcmtlci5wcm90b3R5cGUgPSB7XG4gICAgLyoqXG4gICAgICogUHVzaCBhIGNodW5rIHRvIHRoZSBuZXh0IHdvcmtlcnMuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGNodW5rIHRoZSBjaHVuayB0byBwdXNoXG4gICAgICovXG4gICAgcHVzaCA6IGZ1bmN0aW9uIChjaHVuaykge1xuICAgICAgICB0aGlzLmVtaXQoXCJkYXRhXCIsIGNodW5rKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIEVuZCB0aGUgc3RyZWFtLlxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IHRydWUgaWYgdGhpcyBjYWxsIGVuZGVkIHRoZSB3b3JrZXIsIGZhbHNlIG90aGVyd2lzZS5cbiAgICAgKi9cbiAgICBlbmQgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLmlzRmluaXNoZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZmx1c2goKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRoaXMuZW1pdChcImVuZFwiKTtcbiAgICAgICAgICAgIHRoaXMuY2xlYW5VcCgpO1xuICAgICAgICAgICAgdGhpcy5pc0ZpbmlzaGVkID0gdHJ1ZTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgdGhpcy5lbWl0KFwiZXJyb3JcIiwgZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBFbmQgdGhlIHN0cmVhbSB3aXRoIGFuIGVycm9yLlxuICAgICAqIEBwYXJhbSB7RXJyb3J9IGUgdGhlIGVycm9yIHdoaWNoIGNhdXNlZCB0aGUgcHJlbWF0dXJlIGVuZC5cbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufSB0cnVlIGlmIHRoaXMgY2FsbCBlbmRlZCB0aGUgd29ya2VyIHdpdGggYW4gZXJyb3IsIGZhbHNlIG90aGVyd2lzZS5cbiAgICAgKi9cbiAgICBlcnJvciA6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGlmICh0aGlzLmlzRmluaXNoZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKHRoaXMuaXNQYXVzZWQpIHtcbiAgICAgICAgICAgIHRoaXMuZ2VuZXJhdGVkRXJyb3IgPSBlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5pc0ZpbmlzaGVkID0gdHJ1ZTtcblxuICAgICAgICAgICAgdGhpcy5lbWl0KFwiZXJyb3JcIiwgZSk7XG5cbiAgICAgICAgICAgIC8vIGluIHRoZSB3b3JrZXJzIGNoYWluIGV4cGxvZGVkIGluIHRoZSBtaWRkbGUgb2YgdGhlIGNoYWluLFxuICAgICAgICAgICAgLy8gdGhlIGVycm9yIGV2ZW50IHdpbGwgZ28gZG93bndhcmQgYnV0IHdlIGFsc28gbmVlZCB0byBub3RpZnlcbiAgICAgICAgICAgIC8vIHdvcmtlcnMgdXB3YXJkIHRoYXQgdGhlcmUgaGFzIGJlZW4gYW4gZXJyb3IuXG4gICAgICAgICAgICBpZih0aGlzLnByZXZpb3VzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wcmV2aW91cy5lcnJvcihlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5jbGVhblVwKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBBZGQgYSBjYWxsYmFjayBvbiBhbiBldmVudC5cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZSB0aGUgbmFtZSBvZiB0aGUgZXZlbnQgKGRhdGEsIGVuZCwgZXJyb3IpXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgdGhlIGZ1bmN0aW9uIHRvIGNhbGwgd2hlbiB0aGUgZXZlbnQgaXMgdHJpZ2dlcmVkXG4gICAgICogQHJldHVybiB7R2VuZXJpY1dvcmtlcn0gdGhlIGN1cnJlbnQgb2JqZWN0IGZvciBjaGFpbmFiaWxpdHlcbiAgICAgKi9cbiAgICBvbiA6IGZ1bmN0aW9uIChuYW1lLCBsaXN0ZW5lcikge1xuICAgICAgICB0aGlzLl9saXN0ZW5lcnNbbmFtZV0ucHVzaChsaXN0ZW5lcik7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogQ2xlYW4gYW55IHJlZmVyZW5jZXMgd2hlbiBhIHdvcmtlciBpcyBlbmRpbmcuXG4gICAgICovXG4gICAgY2xlYW5VcCA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5zdHJlYW1JbmZvID0gdGhpcy5nZW5lcmF0ZWRFcnJvciA9IHRoaXMuZXh0cmFTdHJlYW1JbmZvID0gbnVsbDtcbiAgICAgICAgdGhpcy5fbGlzdGVuZXJzID0gW107XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBUcmlnZ2VyIGFuIGV2ZW50LiBUaGlzIHdpbGwgY2FsbCByZWdpc3RlcmVkIGNhbGxiYWNrIHdpdGggdGhlIHByb3ZpZGVkIGFyZy5cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZSB0aGUgbmFtZSBvZiB0aGUgZXZlbnQgKGRhdGEsIGVuZCwgZXJyb3IpXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGFyZyB0aGUgYXJndW1lbnQgdG8gY2FsbCB0aGUgY2FsbGJhY2sgd2l0aC5cbiAgICAgKi9cbiAgICBlbWl0IDogZnVuY3Rpb24gKG5hbWUsIGFyZykge1xuICAgICAgICBpZiAodGhpcy5fbGlzdGVuZXJzW25hbWVdKSB7XG4gICAgICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgdGhpcy5fbGlzdGVuZXJzW25hbWVdLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fbGlzdGVuZXJzW25hbWVdW2ldLmNhbGwodGhpcywgYXJnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICogQ2hhaW4gYSB3b3JrZXIgd2l0aCBhbiBvdGhlci5cbiAgICAgKiBAcGFyYW0ge1dvcmtlcn0gbmV4dCB0aGUgd29ya2VyIHJlY2VpdmluZyBldmVudHMgZnJvbSB0aGUgY3VycmVudCBvbmUuXG4gICAgICogQHJldHVybiB7d29ya2VyfSB0aGUgbmV4dCB3b3JrZXIgZm9yIGNoYWluYWJpbGl0eVxuICAgICAqL1xuICAgIHBpcGUgOiBmdW5jdGlvbiAobmV4dCkge1xuICAgICAgICByZXR1cm4gbmV4dC5yZWdpc3RlclByZXZpb3VzKHRoaXMpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogU2FtZSBhcyBgcGlwZWAgaW4gdGhlIG90aGVyIGRpcmVjdGlvbi5cbiAgICAgKiBVc2luZyBhbiBBUEkgd2l0aCBgcGlwZShuZXh0KWAgaXMgdmVyeSBlYXN5LlxuICAgICAqIEltcGxlbWVudGluZyB0aGUgQVBJIHdpdGggdGhlIHBvaW50IG9mIHZpZXcgb2YgdGhlIG5leHQgb25lIHJlZ2lzdGVyaW5nXG4gICAgICogYSBzb3VyY2UgaXMgZWFzaWVyLCBzZWUgdGhlIFppcEZpbGVXb3JrZXIuXG4gICAgICogQHBhcmFtIHtXb3JrZXJ9IHByZXZpb3VzIHRoZSBwcmV2aW91cyB3b3JrZXIsIHNlbmRpbmcgZXZlbnRzIHRvIHRoaXMgb25lXG4gICAgICogQHJldHVybiB7V29ya2VyfSB0aGUgY3VycmVudCB3b3JrZXIgZm9yIGNoYWluYWJpbGl0eVxuICAgICAqL1xuICAgIHJlZ2lzdGVyUHJldmlvdXMgOiBmdW5jdGlvbiAocHJldmlvdXMpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNMb2NrZWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRoZSBzdHJlYW0gJ1wiICsgdGhpcyArIFwiJyBoYXMgYWxyZWFkeSBiZWVuIHVzZWQuXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gc2hhcmluZyB0aGUgc3RyZWFtSW5mby4uLlxuICAgICAgICB0aGlzLnN0cmVhbUluZm8gPSBwcmV2aW91cy5zdHJlYW1JbmZvO1xuICAgICAgICAvLyAuLi4gYW5kIGFkZGluZyBvdXIgb3duIGJpdHNcbiAgICAgICAgdGhpcy5tZXJnZVN0cmVhbUluZm8oKTtcbiAgICAgICAgdGhpcy5wcmV2aW91cyA9ICBwcmV2aW91cztcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBwcmV2aW91cy5vbihcImRhdGFcIiwgZnVuY3Rpb24gKGNodW5rKSB7XG4gICAgICAgICAgICBzZWxmLnByb2Nlc3NDaHVuayhjaHVuayk7XG4gICAgICAgIH0pO1xuICAgICAgICBwcmV2aW91cy5vbihcImVuZFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLmVuZCgpO1xuICAgICAgICB9KTtcbiAgICAgICAgcHJldmlvdXMub24oXCJlcnJvclwiLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgc2VsZi5lcnJvcihlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogUGF1c2UgdGhlIHN0cmVhbSBzbyBpdCBkb2Vzbid0IHNlbmQgZXZlbnRzIGFueW1vcmUuXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn0gdHJ1ZSBpZiB0aGlzIGNhbGwgcGF1c2VkIHRoZSB3b3JrZXIsIGZhbHNlIG90aGVyd2lzZS5cbiAgICAgKi9cbiAgICBwYXVzZSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYodGhpcy5pc1BhdXNlZCB8fCB0aGlzLmlzRmluaXNoZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmlzUGF1c2VkID0gdHJ1ZTtcblxuICAgICAgICBpZih0aGlzLnByZXZpb3VzKSB7XG4gICAgICAgICAgICB0aGlzLnByZXZpb3VzLnBhdXNlKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBSZXN1bWUgYSBwYXVzZWQgc3RyZWFtLlxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IHRydWUgaWYgdGhpcyBjYWxsIHJlc3VtZWQgdGhlIHdvcmtlciwgZmFsc2Ugb3RoZXJ3aXNlLlxuICAgICAqL1xuICAgIHJlc3VtZSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYoIXRoaXMuaXNQYXVzZWQgfHwgdGhpcy5pc0ZpbmlzaGVkKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pc1BhdXNlZCA9IGZhbHNlO1xuXG4gICAgICAgIC8vIGlmIHRydWUsIHRoZSB3b3JrZXIgdHJpZWQgdG8gcmVzdW1lIGJ1dCBmYWlsZWRcbiAgICAgICAgdmFyIHdpdGhFcnJvciA9IGZhbHNlO1xuICAgICAgICBpZih0aGlzLmdlbmVyYXRlZEVycm9yKSB7XG4gICAgICAgICAgICB0aGlzLmVycm9yKHRoaXMuZ2VuZXJhdGVkRXJyb3IpO1xuICAgICAgICAgICAgd2l0aEVycm9yID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZih0aGlzLnByZXZpb3VzKSB7XG4gICAgICAgICAgICB0aGlzLnByZXZpb3VzLnJlc3VtZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuICF3aXRoRXJyb3I7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBGbHVzaCBhbnkgcmVtYWluaW5nIGJ5dGVzIGFzIHRoZSBzdHJlYW0gaXMgZW5kaW5nLlxuICAgICAqL1xuICAgIGZsdXNoIDogZnVuY3Rpb24gKCkge30sXG4gICAgLyoqXG4gICAgICogUHJvY2VzcyBhIGNodW5rLiBUaGlzIGlzIHVzdWFsbHkgdGhlIG1ldGhvZCBvdmVycmlkZGVuLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjaHVuayB0aGUgY2h1bmsgdG8gcHJvY2Vzcy5cbiAgICAgKi9cbiAgICBwcm9jZXNzQ2h1bmsgOiBmdW5jdGlvbihjaHVuaykge1xuICAgICAgICB0aGlzLnB1c2goY2h1bmspO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogQWRkIGEga2V5L3ZhbHVlIHRvIGJlIGFkZGVkIGluIHRoZSB3b3JrZXJzIGNoYWluIHN0cmVhbUluZm8gb25jZSBhY3RpdmF0ZWQuXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGtleSB0aGUga2V5IHRvIHVzZVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSB2YWx1ZSB0aGUgYXNzb2NpYXRlZCB2YWx1ZVxuICAgICAqIEByZXR1cm4ge1dvcmtlcn0gdGhlIGN1cnJlbnQgd29ya2VyIGZvciBjaGFpbmFiaWxpdHlcbiAgICAgKi9cbiAgICB3aXRoU3RyZWFtSW5mbyA6IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgIHRoaXMuZXh0cmFTdHJlYW1JbmZvW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgdGhpcy5tZXJnZVN0cmVhbUluZm8oKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBNZXJnZSB0aGlzIHdvcmtlcidzIHN0cmVhbUluZm8gaW50byB0aGUgY2hhaW4ncyBzdHJlYW1JbmZvLlxuICAgICAqL1xuICAgIG1lcmdlU3RyZWFtSW5mbyA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZm9yKHZhciBrZXkgaW4gdGhpcy5leHRyYVN0cmVhbUluZm8pIHtcbiAgICAgICAgICAgIGlmICghT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHRoaXMuZXh0cmFTdHJlYW1JbmZvLCBrZXkpKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnN0cmVhbUluZm9ba2V5XSA9IHRoaXMuZXh0cmFTdHJlYW1JbmZvW2tleV07XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTG9jayB0aGUgc3RyZWFtIHRvIHByZXZlbnQgZnVydGhlciB1cGRhdGVzIG9uIHRoZSB3b3JrZXJzIGNoYWluLlxuICAgICAqIEFmdGVyIGNhbGxpbmcgdGhpcyBtZXRob2QsIGFsbCBjYWxscyB0byBwaXBlIHdpbGwgZmFpbC5cbiAgICAgKi9cbiAgICBsb2NrOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLmlzTG9ja2VkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGUgc3RyZWFtICdcIiArIHRoaXMgKyBcIicgaGFzIGFscmVhZHkgYmVlbiB1c2VkLlwiKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmlzTG9ja2VkID0gdHJ1ZTtcbiAgICAgICAgaWYgKHRoaXMucHJldmlvdXMpIHtcbiAgICAgICAgICAgIHRoaXMucHJldmlvdXMubG9jaygpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogUHJldHR5IHByaW50IHRoZSB3b3JrZXJzIGNoYWluLlxuICAgICAqL1xuICAgIHRvU3RyaW5nIDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbWUgPSBcIldvcmtlciBcIiArIHRoaXMubmFtZTtcbiAgICAgICAgaWYgKHRoaXMucHJldmlvdXMpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnByZXZpb3VzICsgXCIgLT4gXCIgKyBtZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBtZTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gR2VuZXJpY1dvcmtlcjtcblxufSx7fV0sMjk6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXG52YXIgdXRpbHMgPSByZXF1aXJlKFwiLi4vdXRpbHNcIik7XG52YXIgQ29udmVydFdvcmtlciA9IHJlcXVpcmUoXCIuL0NvbnZlcnRXb3JrZXJcIik7XG52YXIgR2VuZXJpY1dvcmtlciA9IHJlcXVpcmUoXCIuL0dlbmVyaWNXb3JrZXJcIik7XG52YXIgYmFzZTY0ID0gcmVxdWlyZShcIi4uL2Jhc2U2NFwiKTtcbnZhciBzdXBwb3J0ID0gcmVxdWlyZShcIi4uL3N1cHBvcnRcIik7XG52YXIgZXh0ZXJuYWwgPSByZXF1aXJlKFwiLi4vZXh0ZXJuYWxcIik7XG5cbnZhciBOb2RlanNTdHJlYW1PdXRwdXRBZGFwdGVyID0gbnVsbDtcbmlmIChzdXBwb3J0Lm5vZGVzdHJlYW0pIHtcbiAgICB0cnkge1xuICAgICAgICBOb2RlanNTdHJlYW1PdXRwdXRBZGFwdGVyID0gcmVxdWlyZShcIi4uL25vZGVqcy9Ob2RlanNTdHJlYW1PdXRwdXRBZGFwdGVyXCIpO1xuICAgIH0gY2F0Y2goZSkge1xuICAgICAgICAvLyBpZ25vcmVcbiAgICB9XG59XG5cbi8qKlxuICogQXBwbHkgdGhlIGZpbmFsIHRyYW5zZm9ybWF0aW9uIG9mIHRoZSBkYXRhLiBJZiB0aGUgdXNlciB3YW50cyBhIEJsb2IgZm9yXG4gKiBleGFtcGxlLCBpdCdzIGVhc2llciB0byB3b3JrIHdpdGggYW4gVThpbnRBcnJheSBhbmQgZmluYWxseSBkbyB0aGVcbiAqIEFycmF5QnVmZmVyL0Jsb2IgY29udmVyc2lvbi5cbiAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlIHRoZSBuYW1lIG9mIHRoZSBmaW5hbCB0eXBlXG4gKiBAcGFyYW0ge1N0cmluZ3xVaW50OEFycmF5fEJ1ZmZlcn0gY29udGVudCB0aGUgY29udGVudCB0byB0cmFuc2Zvcm1cbiAqIEBwYXJhbSB7U3RyaW5nfSBtaW1lVHlwZSB0aGUgbWltZSB0eXBlIG9mIHRoZSBjb250ZW50LCBpZiBhcHBsaWNhYmxlLlxuICogQHJldHVybiB7U3RyaW5nfFVpbnQ4QXJyYXl8QXJyYXlCdWZmZXJ8QnVmZmVyfEJsb2J9IHRoZSBjb250ZW50IGluIHRoZSByaWdodCBmb3JtYXQuXG4gKi9cbmZ1bmN0aW9uIHRyYW5zZm9ybVppcE91dHB1dCh0eXBlLCBjb250ZW50LCBtaW1lVHlwZSkge1xuICAgIHN3aXRjaCh0eXBlKSB7XG4gICAgY2FzZSBcImJsb2JcIiA6XG4gICAgICAgIHJldHVybiB1dGlscy5uZXdCbG9iKHV0aWxzLnRyYW5zZm9ybVRvKFwiYXJyYXlidWZmZXJcIiwgY29udGVudCksIG1pbWVUeXBlKTtcbiAgICBjYXNlIFwiYmFzZTY0XCIgOlxuICAgICAgICByZXR1cm4gYmFzZTY0LmVuY29kZShjb250ZW50KTtcbiAgICBkZWZhdWx0IDpcbiAgICAgICAgcmV0dXJuIHV0aWxzLnRyYW5zZm9ybVRvKHR5cGUsIGNvbnRlbnQpO1xuICAgIH1cbn1cblxuLyoqXG4gKiBDb25jYXRlbmF0ZSBhbiBhcnJheSBvZiBkYXRhIG9mIHRoZSBnaXZlbiB0eXBlLlxuICogQHBhcmFtIHtTdHJpbmd9IHR5cGUgdGhlIHR5cGUgb2YgdGhlIGRhdGEgaW4gdGhlIGdpdmVuIGFycmF5LlxuICogQHBhcmFtIHtBcnJheX0gZGF0YUFycmF5IHRoZSBhcnJheSBjb250YWluaW5nIHRoZSBkYXRhIGNodW5rcyB0byBjb25jYXRlbmF0ZVxuICogQHJldHVybiB7U3RyaW5nfFVpbnQ4QXJyYXl8QnVmZmVyfSB0aGUgY29uY2F0ZW5hdGVkIGRhdGFcbiAqIEB0aHJvd3MgRXJyb3IgaWYgdGhlIGFza2VkIHR5cGUgaXMgdW5zdXBwb3J0ZWRcbiAqL1xuZnVuY3Rpb24gY29uY2F0ICh0eXBlLCBkYXRhQXJyYXkpIHtcbiAgICB2YXIgaSwgaW5kZXggPSAwLCByZXMgPSBudWxsLCB0b3RhbExlbmd0aCA9IDA7XG4gICAgZm9yKGkgPSAwOyBpIDwgZGF0YUFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRvdGFsTGVuZ3RoICs9IGRhdGFBcnJheVtpXS5sZW5ndGg7XG4gICAgfVxuICAgIHN3aXRjaCh0eXBlKSB7XG4gICAgY2FzZSBcInN0cmluZ1wiOlxuICAgICAgICByZXR1cm4gZGF0YUFycmF5LmpvaW4oXCJcIik7XG4gICAgY2FzZSBcImFycmF5XCI6XG4gICAgICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuY29uY2F0LmFwcGx5KFtdLCBkYXRhQXJyYXkpO1xuICAgIGNhc2UgXCJ1aW50OGFycmF5XCI6XG4gICAgICAgIHJlcyA9IG5ldyBVaW50OEFycmF5KHRvdGFsTGVuZ3RoKTtcbiAgICAgICAgZm9yKGkgPSAwOyBpIDwgZGF0YUFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICByZXMuc2V0KGRhdGFBcnJheVtpXSwgaW5kZXgpO1xuICAgICAgICAgICAgaW5kZXggKz0gZGF0YUFycmF5W2ldLmxlbmd0aDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzO1xuICAgIGNhc2UgXCJub2RlYnVmZmVyXCI6XG4gICAgICAgIHJldHVybiBCdWZmZXIuY29uY2F0KGRhdGFBcnJheSk7XG4gICAgZGVmYXVsdDpcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiY29uY2F0IDogdW5zdXBwb3J0ZWQgdHlwZSAnXCIgICsgdHlwZSArIFwiJ1wiKTtcbiAgICB9XG59XG5cbi8qKlxuICogTGlzdGVuIGEgU3RyZWFtSGVscGVyLCBhY2N1bXVsYXRlIGl0cyBjb250ZW50IGFuZCBjb25jYXRlbmF0ZSBpdCBpbnRvIGFcbiAqIGNvbXBsZXRlIGJsb2NrLlxuICogQHBhcmFtIHtTdHJlYW1IZWxwZXJ9IGhlbHBlciB0aGUgaGVscGVyIHRvIHVzZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IHVwZGF0ZUNhbGxiYWNrIGEgY2FsbGJhY2sgY2FsbGVkIG9uIGVhY2ggdXBkYXRlLiBDYWxsZWRcbiAqIHdpdGggb25lIGFyZyA6XG4gKiAtIHRoZSBtZXRhZGF0YSBsaW5rZWQgdG8gdGhlIHVwZGF0ZSByZWNlaXZlZC5cbiAqIEByZXR1cm4gUHJvbWlzZSB0aGUgcHJvbWlzZSBmb3IgdGhlIGFjY3VtdWxhdGlvbi5cbiAqL1xuZnVuY3Rpb24gYWNjdW11bGF0ZShoZWxwZXIsIHVwZGF0ZUNhbGxiYWNrKSB7XG4gICAgcmV0dXJuIG5ldyBleHRlcm5hbC5Qcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3Qpe1xuICAgICAgICB2YXIgZGF0YUFycmF5ID0gW107XG4gICAgICAgIHZhciBjaHVua1R5cGUgPSBoZWxwZXIuX2ludGVybmFsVHlwZSxcbiAgICAgICAgICAgIHJlc3VsdFR5cGUgPSBoZWxwZXIuX291dHB1dFR5cGUsXG4gICAgICAgICAgICBtaW1lVHlwZSA9IGhlbHBlci5fbWltZVR5cGU7XG4gICAgICAgIGhlbHBlclxuICAgICAgICAgICAgLm9uKFwiZGF0YVwiLCBmdW5jdGlvbiAoZGF0YSwgbWV0YSkge1xuICAgICAgICAgICAgICAgIGRhdGFBcnJheS5wdXNoKGRhdGEpO1xuICAgICAgICAgICAgICAgIGlmKHVwZGF0ZUNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZUNhbGxiYWNrKG1ldGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAub24oXCJlcnJvclwiLCBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgICAgICBkYXRhQXJyYXkgPSBbXTtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAub24oXCJlbmRcIiwgZnVuY3Rpb24gKCl7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHRyYW5zZm9ybVppcE91dHB1dChyZXN1bHRUeXBlLCBjb25jYXQoY2h1bmtUeXBlLCBkYXRhQXJyYXkpLCBtaW1lVHlwZSk7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzdWx0KTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZGF0YUFycmF5ID0gW107XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnJlc3VtZSgpO1xuICAgIH0pO1xufVxuXG4vKipcbiAqIEFuIGhlbHBlciB0byBlYXNpbHkgdXNlIHdvcmtlcnMgb3V0c2lkZSBvZiBKU1ppcC5cbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtXb3JrZXJ9IHdvcmtlciB0aGUgd29ya2VyIHRvIHdyYXBcbiAqIEBwYXJhbSB7U3RyaW5nfSBvdXRwdXRUeXBlIHRoZSB0eXBlIG9mIGRhdGEgZXhwZWN0ZWQgYnkgdGhlIHVzZVxuICogQHBhcmFtIHtTdHJpbmd9IG1pbWVUeXBlIHRoZSBtaW1lIHR5cGUgb2YgdGhlIGNvbnRlbnQsIGlmIGFwcGxpY2FibGUuXG4gKi9cbmZ1bmN0aW9uIFN0cmVhbUhlbHBlcih3b3JrZXIsIG91dHB1dFR5cGUsIG1pbWVUeXBlKSB7XG4gICAgdmFyIGludGVybmFsVHlwZSA9IG91dHB1dFR5cGU7XG4gICAgc3dpdGNoKG91dHB1dFR5cGUpIHtcbiAgICBjYXNlIFwiYmxvYlwiOlxuICAgIGNhc2UgXCJhcnJheWJ1ZmZlclwiOlxuICAgICAgICBpbnRlcm5hbFR5cGUgPSBcInVpbnQ4YXJyYXlcIjtcbiAgICAgICAgYnJlYWs7XG4gICAgY2FzZSBcImJhc2U2NFwiOlxuICAgICAgICBpbnRlcm5hbFR5cGUgPSBcInN0cmluZ1wiO1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgICAvLyB0aGUgdHlwZSB1c2VkIGludGVybmFsbHlcbiAgICAgICAgdGhpcy5faW50ZXJuYWxUeXBlID0gaW50ZXJuYWxUeXBlO1xuICAgICAgICAvLyB0aGUgdHlwZSB1c2VkIHRvIG91dHB1dCByZXN1bHRzXG4gICAgICAgIHRoaXMuX291dHB1dFR5cGUgPSBvdXRwdXRUeXBlO1xuICAgICAgICAvLyB0aGUgbWltZSB0eXBlXG4gICAgICAgIHRoaXMuX21pbWVUeXBlID0gbWltZVR5cGU7XG4gICAgICAgIHV0aWxzLmNoZWNrU3VwcG9ydChpbnRlcm5hbFR5cGUpO1xuICAgICAgICB0aGlzLl93b3JrZXIgPSB3b3JrZXIucGlwZShuZXcgQ29udmVydFdvcmtlcihpbnRlcm5hbFR5cGUpKTtcbiAgICAgICAgLy8gdGhlIGxhc3Qgd29ya2VycyBjYW4gYmUgcmV3aXJlZCB3aXRob3V0IGlzc3VlcyBidXQgd2UgbmVlZCB0b1xuICAgICAgICAvLyBwcmV2ZW50IGFueSB1cGRhdGVzIG9uIHByZXZpb3VzIHdvcmtlcnMuXG4gICAgICAgIHdvcmtlci5sb2NrKCk7XG4gICAgfSBjYXRjaChlKSB7XG4gICAgICAgIHRoaXMuX3dvcmtlciA9IG5ldyBHZW5lcmljV29ya2VyKFwiZXJyb3JcIik7XG4gICAgICAgIHRoaXMuX3dvcmtlci5lcnJvcihlKTtcbiAgICB9XG59XG5cblN0cmVhbUhlbHBlci5wcm90b3R5cGUgPSB7XG4gICAgLyoqXG4gICAgICogTGlzdGVuIGEgU3RyZWFtSGVscGVyLCBhY2N1bXVsYXRlIGl0cyBjb250ZW50IGFuZCBjb25jYXRlbmF0ZSBpdCBpbnRvIGFcbiAgICAgKiBjb21wbGV0ZSBibG9jay5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSB1cGRhdGVDYiB0aGUgdXBkYXRlIGNhbGxiYWNrLlxuICAgICAqIEByZXR1cm4gUHJvbWlzZSB0aGUgcHJvbWlzZSBmb3IgdGhlIGFjY3VtdWxhdGlvbi5cbiAgICAgKi9cbiAgICBhY2N1bXVsYXRlIDogZnVuY3Rpb24gKHVwZGF0ZUNiKSB7XG4gICAgICAgIHJldHVybiBhY2N1bXVsYXRlKHRoaXMsIHVwZGF0ZUNiKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIEFkZCBhIGxpc3RlbmVyIG9uIGFuIGV2ZW50IHRyaWdnZXJlZCBvbiBhIHN0cmVhbS5cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZXZ0IHRoZSBuYW1lIG9mIHRoZSBldmVudFxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIHRoZSBsaXN0ZW5lclxuICAgICAqIEByZXR1cm4ge1N0cmVhbUhlbHBlcn0gdGhlIGN1cnJlbnQgaGVscGVyLlxuICAgICAqL1xuICAgIG9uIDogZnVuY3Rpb24gKGV2dCwgZm4pIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIGlmKGV2dCA9PT0gXCJkYXRhXCIpIHtcbiAgICAgICAgICAgIHRoaXMuX3dvcmtlci5vbihldnQsIGZ1bmN0aW9uIChjaHVuaykge1xuICAgICAgICAgICAgICAgIGZuLmNhbGwoc2VsZiwgY2h1bmsuZGF0YSwgY2h1bmsubWV0YSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3dvcmtlci5vbihldnQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB1dGlscy5kZWxheShmbiwgYXJndW1lbnRzLCBzZWxmKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogUmVzdW1lIHRoZSBmbG93IG9mIGNodW5rcy5cbiAgICAgKiBAcmV0dXJuIHtTdHJlYW1IZWxwZXJ9IHRoZSBjdXJyZW50IGhlbHBlci5cbiAgICAgKi9cbiAgICByZXN1bWUgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHV0aWxzLmRlbGF5KHRoaXMuX3dvcmtlci5yZXN1bWUsIFtdLCB0aGlzLl93b3JrZXIpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIFBhdXNlIHRoZSBmbG93IG9mIGNodW5rcy5cbiAgICAgKiBAcmV0dXJuIHtTdHJlYW1IZWxwZXJ9IHRoZSBjdXJyZW50IGhlbHBlci5cbiAgICAgKi9cbiAgICBwYXVzZSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5fd29ya2VyLnBhdXNlKCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogUmV0dXJuIGEgbm9kZWpzIHN0cmVhbSBmb3IgdGhpcyBoZWxwZXIuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gdXBkYXRlQ2IgdGhlIHVwZGF0ZSBjYWxsYmFjay5cbiAgICAgKiBAcmV0dXJuIHtOb2RlanNTdHJlYW1PdXRwdXRBZGFwdGVyfSB0aGUgbm9kZWpzIHN0cmVhbS5cbiAgICAgKi9cbiAgICB0b05vZGVqc1N0cmVhbSA6IGZ1bmN0aW9uICh1cGRhdGVDYikge1xuICAgICAgICB1dGlscy5jaGVja1N1cHBvcnQoXCJub2Rlc3RyZWFtXCIpO1xuICAgICAgICBpZiAodGhpcy5fb3V0cHV0VHlwZSAhPT0gXCJub2RlYnVmZmVyXCIpIHtcbiAgICAgICAgICAgIC8vIGFuIG9iamVjdCBzdHJlYW0gY29udGFpbmluZyBibG9iL2FycmF5YnVmZmVyL3VpbnQ4YXJyYXkvc3RyaW5nXG4gICAgICAgICAgICAvLyBpcyBzdHJhbmdlIGFuZCBJIGRvbid0IGtub3cgaWYgaXQgd291bGQgYmUgdXNlZnVsLlxuICAgICAgICAgICAgLy8gSSB5b3UgZmluZCB0aGlzIGNvbW1lbnQgYW5kIGhhdmUgYSBnb29kIHVzZWNhc2UsIHBsZWFzZSBvcGVuIGFcbiAgICAgICAgICAgIC8vIGJ1ZyByZXBvcnQgIVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKHRoaXMuX291dHB1dFR5cGUgKyBcIiBpcyBub3Qgc3VwcG9ydGVkIGJ5IHRoaXMgbWV0aG9kXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBOb2RlanNTdHJlYW1PdXRwdXRBZGFwdGVyKHRoaXMsIHtcbiAgICAgICAgICAgIG9iamVjdE1vZGUgOiB0aGlzLl9vdXRwdXRUeXBlICE9PSBcIm5vZGVidWZmZXJcIlxuICAgICAgICB9LCB1cGRhdGVDYik7XG4gICAgfVxufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IFN0cmVhbUhlbHBlcjtcblxufSx7XCIuLi9iYXNlNjRcIjoxLFwiLi4vZXh0ZXJuYWxcIjo2LFwiLi4vbm9kZWpzL05vZGVqc1N0cmVhbU91dHB1dEFkYXB0ZXJcIjoxMyxcIi4uL3N1cHBvcnRcIjozMCxcIi4uL3V0aWxzXCI6MzIsXCIuL0NvbnZlcnRXb3JrZXJcIjoyNCxcIi4vR2VuZXJpY1dvcmtlclwiOjI4fV0sMzA6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXG5leHBvcnRzLmJhc2U2NCA9IHRydWU7XG5leHBvcnRzLmFycmF5ID0gdHJ1ZTtcbmV4cG9ydHMuc3RyaW5nID0gdHJ1ZTtcbmV4cG9ydHMuYXJyYXlidWZmZXIgPSB0eXBlb2YgQXJyYXlCdWZmZXIgIT09IFwidW5kZWZpbmVkXCIgJiYgdHlwZW9mIFVpbnQ4QXJyYXkgIT09IFwidW5kZWZpbmVkXCI7XG5leHBvcnRzLm5vZGVidWZmZXIgPSB0eXBlb2YgQnVmZmVyICE9PSBcInVuZGVmaW5lZFwiO1xuLy8gY29udGFpbnMgdHJ1ZSBpZiBKU1ppcCBjYW4gcmVhZC9nZW5lcmF0ZSBVaW50OEFycmF5LCBmYWxzZSBvdGhlcndpc2UuXG5leHBvcnRzLnVpbnQ4YXJyYXkgPSB0eXBlb2YgVWludDhBcnJheSAhPT0gXCJ1bmRlZmluZWRcIjtcblxuaWYgKHR5cGVvZiBBcnJheUJ1ZmZlciA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgIGV4cG9ydHMuYmxvYiA9IGZhbHNlO1xufVxuZWxzZSB7XG4gICAgdmFyIGJ1ZmZlciA9IG5ldyBBcnJheUJ1ZmZlcigwKTtcbiAgICB0cnkge1xuICAgICAgICBleHBvcnRzLmJsb2IgPSBuZXcgQmxvYihbYnVmZmVyXSwge1xuICAgICAgICAgICAgdHlwZTogXCJhcHBsaWNhdGlvbi96aXBcIlxuICAgICAgICB9KS5zaXplID09PSAwO1xuICAgIH1cbiAgICBjYXRjaCAoZSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdmFyIEJ1aWxkZXIgPSBzZWxmLkJsb2JCdWlsZGVyIHx8IHNlbGYuV2ViS2l0QmxvYkJ1aWxkZXIgfHwgc2VsZi5Nb3pCbG9iQnVpbGRlciB8fCBzZWxmLk1TQmxvYkJ1aWxkZXI7XG4gICAgICAgICAgICB2YXIgYnVpbGRlciA9IG5ldyBCdWlsZGVyKCk7XG4gICAgICAgICAgICBidWlsZGVyLmFwcGVuZChidWZmZXIpO1xuICAgICAgICAgICAgZXhwb3J0cy5ibG9iID0gYnVpbGRlci5nZXRCbG9iKFwiYXBwbGljYXRpb24vemlwXCIpLnNpemUgPT09IDA7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGV4cG9ydHMuYmxvYiA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxufVxuXG50cnkge1xuICAgIGV4cG9ydHMubm9kZXN0cmVhbSA9ICEhcmVxdWlyZShcInJlYWRhYmxlLXN0cmVhbVwiKS5SZWFkYWJsZTtcbn0gY2F0Y2goZSkge1xuICAgIGV4cG9ydHMubm9kZXN0cmVhbSA9IGZhbHNlO1xufVxuXG59LHtcInJlYWRhYmxlLXN0cmVhbVwiOjE2fV0sMzE6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXG52YXIgdXRpbHMgPSByZXF1aXJlKFwiLi91dGlsc1wiKTtcbnZhciBzdXBwb3J0ID0gcmVxdWlyZShcIi4vc3VwcG9ydFwiKTtcbnZhciBub2RlanNVdGlscyA9IHJlcXVpcmUoXCIuL25vZGVqc1V0aWxzXCIpO1xudmFyIEdlbmVyaWNXb3JrZXIgPSByZXF1aXJlKFwiLi9zdHJlYW0vR2VuZXJpY1dvcmtlclwiKTtcblxuLyoqXG4gKiBUaGUgZm9sbG93aW5nIGZ1bmN0aW9ucyBjb21lIGZyb20gcGFrbywgZnJvbSBwYWtvL2xpYi91dGlscy9zdHJpbmdzXG4gKiByZWxlYXNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UsIHNlZSBwYWtvIGh0dHBzOi8vZ2l0aHViLmNvbS9ub2RlY2EvcGFrby9cbiAqL1xuXG4vLyBUYWJsZSB3aXRoIHV0ZjggbGVuZ3RocyAoY2FsY3VsYXRlZCBieSBmaXJzdCBieXRlIG9mIHNlcXVlbmNlKVxuLy8gTm90ZSwgdGhhdCA1ICYgNi1ieXRlIHZhbHVlcyBhbmQgc29tZSA0LWJ5dGUgdmFsdWVzIGNhbiBub3QgYmUgcmVwcmVzZW50ZWQgaW4gSlMsXG4vLyBiZWNhdXNlIG1heCBwb3NzaWJsZSBjb2RlcG9pbnQgaXMgMHgxMGZmZmZcbnZhciBfdXRmOGxlbiA9IG5ldyBBcnJheSgyNTYpO1xuZm9yICh2YXIgaT0wOyBpPDI1NjsgaSsrKSB7XG4gICAgX3V0ZjhsZW5baV0gPSAoaSA+PSAyNTIgPyA2IDogaSA+PSAyNDggPyA1IDogaSA+PSAyNDAgPyA0IDogaSA+PSAyMjQgPyAzIDogaSA+PSAxOTIgPyAyIDogMSk7XG59XG5fdXRmOGxlblsyNTRdPV91dGY4bGVuWzI1NF09MTsgLy8gSW52YWxpZCBzZXF1ZW5jZSBzdGFydFxuXG4vLyBjb252ZXJ0IHN0cmluZyB0byBhcnJheSAodHlwZWQsIHdoZW4gcG9zc2libGUpXG52YXIgc3RyaW5nMmJ1ZiA9IGZ1bmN0aW9uIChzdHIpIHtcbiAgICB2YXIgYnVmLCBjLCBjMiwgbV9wb3MsIGksIHN0cl9sZW4gPSBzdHIubGVuZ3RoLCBidWZfbGVuID0gMDtcblxuICAgIC8vIGNvdW50IGJpbmFyeSBzaXplXG4gICAgZm9yIChtX3BvcyA9IDA7IG1fcG9zIDwgc3RyX2xlbjsgbV9wb3MrKykge1xuICAgICAgICBjID0gc3RyLmNoYXJDb2RlQXQobV9wb3MpO1xuICAgICAgICBpZiAoKGMgJiAweGZjMDApID09PSAweGQ4MDAgJiYgKG1fcG9zKzEgPCBzdHJfbGVuKSkge1xuICAgICAgICAgICAgYzIgPSBzdHIuY2hhckNvZGVBdChtX3BvcysxKTtcbiAgICAgICAgICAgIGlmICgoYzIgJiAweGZjMDApID09PSAweGRjMDApIHtcbiAgICAgICAgICAgICAgICBjID0gMHgxMDAwMCArICgoYyAtIDB4ZDgwMCkgPDwgMTApICsgKGMyIC0gMHhkYzAwKTtcbiAgICAgICAgICAgICAgICBtX3BvcysrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGJ1Zl9sZW4gKz0gYyA8IDB4ODAgPyAxIDogYyA8IDB4ODAwID8gMiA6IGMgPCAweDEwMDAwID8gMyA6IDQ7XG4gICAgfVxuXG4gICAgLy8gYWxsb2NhdGUgYnVmZmVyXG4gICAgaWYgKHN1cHBvcnQudWludDhhcnJheSkge1xuICAgICAgICBidWYgPSBuZXcgVWludDhBcnJheShidWZfbGVuKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBidWYgPSBuZXcgQXJyYXkoYnVmX2xlbik7XG4gICAgfVxuXG4gICAgLy8gY29udmVydFxuICAgIGZvciAoaT0wLCBtX3BvcyA9IDA7IGkgPCBidWZfbGVuOyBtX3BvcysrKSB7XG4gICAgICAgIGMgPSBzdHIuY2hhckNvZGVBdChtX3Bvcyk7XG4gICAgICAgIGlmICgoYyAmIDB4ZmMwMCkgPT09IDB4ZDgwMCAmJiAobV9wb3MrMSA8IHN0cl9sZW4pKSB7XG4gICAgICAgICAgICBjMiA9IHN0ci5jaGFyQ29kZUF0KG1fcG9zKzEpO1xuICAgICAgICAgICAgaWYgKChjMiAmIDB4ZmMwMCkgPT09IDB4ZGMwMCkge1xuICAgICAgICAgICAgICAgIGMgPSAweDEwMDAwICsgKChjIC0gMHhkODAwKSA8PCAxMCkgKyAoYzIgLSAweGRjMDApO1xuICAgICAgICAgICAgICAgIG1fcG9zKys7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGMgPCAweDgwKSB7XG4gICAgICAgICAgICAvKiBvbmUgYnl0ZSAqL1xuICAgICAgICAgICAgYnVmW2krK10gPSBjO1xuICAgICAgICB9IGVsc2UgaWYgKGMgPCAweDgwMCkge1xuICAgICAgICAgICAgLyogdHdvIGJ5dGVzICovXG4gICAgICAgICAgICBidWZbaSsrXSA9IDB4QzAgfCAoYyA+Pj4gNik7XG4gICAgICAgICAgICBidWZbaSsrXSA9IDB4ODAgfCAoYyAmIDB4M2YpO1xuICAgICAgICB9IGVsc2UgaWYgKGMgPCAweDEwMDAwKSB7XG4gICAgICAgICAgICAvKiB0aHJlZSBieXRlcyAqL1xuICAgICAgICAgICAgYnVmW2krK10gPSAweEUwIHwgKGMgPj4+IDEyKTtcbiAgICAgICAgICAgIGJ1ZltpKytdID0gMHg4MCB8IChjID4+PiA2ICYgMHgzZik7XG4gICAgICAgICAgICBidWZbaSsrXSA9IDB4ODAgfCAoYyAmIDB4M2YpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLyogZm91ciBieXRlcyAqL1xuICAgICAgICAgICAgYnVmW2krK10gPSAweGYwIHwgKGMgPj4+IDE4KTtcbiAgICAgICAgICAgIGJ1ZltpKytdID0gMHg4MCB8IChjID4+PiAxMiAmIDB4M2YpO1xuICAgICAgICAgICAgYnVmW2krK10gPSAweDgwIHwgKGMgPj4+IDYgJiAweDNmKTtcbiAgICAgICAgICAgIGJ1ZltpKytdID0gMHg4MCB8IChjICYgMHgzZik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gYnVmO1xufTtcblxuLy8gQ2FsY3VsYXRlIG1heCBwb3NzaWJsZSBwb3NpdGlvbiBpbiB1dGY4IGJ1ZmZlcixcbi8vIHRoYXQgd2lsbCBub3QgYnJlYWsgc2VxdWVuY2UuIElmIHRoYXQncyBub3QgcG9zc2libGVcbi8vIC0gKHZlcnkgc21hbGwgbGltaXRzKSByZXR1cm4gbWF4IHNpemUgYXMgaXMuXG4vL1xuLy8gYnVmW10gLSB1dGY4IGJ5dGVzIGFycmF5XG4vLyBtYXggICAtIGxlbmd0aCBsaW1pdCAobWFuZGF0b3J5KTtcbnZhciB1dGY4Ym9yZGVyID0gZnVuY3Rpb24oYnVmLCBtYXgpIHtcbiAgICB2YXIgcG9zO1xuXG4gICAgbWF4ID0gbWF4IHx8IGJ1Zi5sZW5ndGg7XG4gICAgaWYgKG1heCA+IGJ1Zi5sZW5ndGgpIHsgbWF4ID0gYnVmLmxlbmd0aDsgfVxuXG4gICAgLy8gZ28gYmFjayBmcm9tIGxhc3QgcG9zaXRpb24sIHVudGlsIHN0YXJ0IG9mIHNlcXVlbmNlIGZvdW5kXG4gICAgcG9zID0gbWF4LTE7XG4gICAgd2hpbGUgKHBvcyA+PSAwICYmIChidWZbcG9zXSAmIDB4QzApID09PSAweDgwKSB7IHBvcy0tOyB9XG5cbiAgICAvLyBGdWNrdXAgLSB2ZXJ5IHNtYWxsIGFuZCBicm9rZW4gc2VxdWVuY2UsXG4gICAgLy8gcmV0dXJuIG1heCwgYmVjYXVzZSB3ZSBzaG91bGQgcmV0dXJuIHNvbWV0aGluZyBhbnl3YXkuXG4gICAgaWYgKHBvcyA8IDApIHsgcmV0dXJuIG1heDsgfVxuXG4gICAgLy8gSWYgd2UgY2FtZSB0byBzdGFydCBvZiBidWZmZXIgLSB0aGF0IG1lYW5zIHZ1ZmZlciBpcyB0b28gc21hbGwsXG4gICAgLy8gcmV0dXJuIG1heCB0b28uXG4gICAgaWYgKHBvcyA9PT0gMCkgeyByZXR1cm4gbWF4OyB9XG5cbiAgICByZXR1cm4gKHBvcyArIF91dGY4bGVuW2J1Zltwb3NdXSA+IG1heCkgPyBwb3MgOiBtYXg7XG59O1xuXG4vLyBjb252ZXJ0IGFycmF5IHRvIHN0cmluZ1xudmFyIGJ1ZjJzdHJpbmcgPSBmdW5jdGlvbiAoYnVmKSB7XG4gICAgdmFyIGksIG91dCwgYywgY19sZW47XG4gICAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGg7XG5cbiAgICAvLyBSZXNlcnZlIG1heCBwb3NzaWJsZSBsZW5ndGggKDIgd29yZHMgcGVyIGNoYXIpXG4gICAgLy8gTkI6IGJ5IHVua25vd24gcmVhc29ucywgQXJyYXkgaXMgc2lnbmlmaWNhbnRseSBmYXN0ZXIgZm9yXG4gICAgLy8gICAgIFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkgdGhhbiBVaW50MTZBcnJheS5cbiAgICB2YXIgdXRmMTZidWYgPSBuZXcgQXJyYXkobGVuKjIpO1xuXG4gICAgZm9yIChvdXQ9MCwgaT0wOyBpPGxlbjspIHtcbiAgICAgICAgYyA9IGJ1ZltpKytdO1xuICAgICAgICAvLyBxdWljayBwcm9jZXNzIGFzY2lpXG4gICAgICAgIGlmIChjIDwgMHg4MCkgeyB1dGYxNmJ1ZltvdXQrK10gPSBjOyBjb250aW51ZTsgfVxuXG4gICAgICAgIGNfbGVuID0gX3V0ZjhsZW5bY107XG4gICAgICAgIC8vIHNraXAgNSAmIDYgYnl0ZSBjb2Rlc1xuICAgICAgICBpZiAoY19sZW4gPiA0KSB7IHV0ZjE2YnVmW291dCsrXSA9IDB4ZmZmZDsgaSArPSBjX2xlbi0xOyBjb250aW51ZTsgfVxuXG4gICAgICAgIC8vIGFwcGx5IG1hc2sgb24gZmlyc3QgYnl0ZVxuICAgICAgICBjICY9IGNfbGVuID09PSAyID8gMHgxZiA6IGNfbGVuID09PSAzID8gMHgwZiA6IDB4MDc7XG4gICAgICAgIC8vIGpvaW4gdGhlIHJlc3RcbiAgICAgICAgd2hpbGUgKGNfbGVuID4gMSAmJiBpIDwgbGVuKSB7XG4gICAgICAgICAgICBjID0gKGMgPDwgNikgfCAoYnVmW2krK10gJiAweDNmKTtcbiAgICAgICAgICAgIGNfbGVuLS07XG4gICAgICAgIH1cblxuICAgICAgICAvLyB0ZXJtaW5hdGVkIGJ5IGVuZCBvZiBzdHJpbmc/XG4gICAgICAgIGlmIChjX2xlbiA+IDEpIHsgdXRmMTZidWZbb3V0KytdID0gMHhmZmZkOyBjb250aW51ZTsgfVxuXG4gICAgICAgIGlmIChjIDwgMHgxMDAwMCkge1xuICAgICAgICAgICAgdXRmMTZidWZbb3V0KytdID0gYztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGMgLT0gMHgxMDAwMDtcbiAgICAgICAgICAgIHV0ZjE2YnVmW291dCsrXSA9IDB4ZDgwMCB8ICgoYyA+PiAxMCkgJiAweDNmZik7XG4gICAgICAgICAgICB1dGYxNmJ1ZltvdXQrK10gPSAweGRjMDAgfCAoYyAmIDB4M2ZmKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIHNocmlua0J1Zih1dGYxNmJ1Ziwgb3V0KVxuICAgIGlmICh1dGYxNmJ1Zi5sZW5ndGggIT09IG91dCkge1xuICAgICAgICBpZih1dGYxNmJ1Zi5zdWJhcnJheSkge1xuICAgICAgICAgICAgdXRmMTZidWYgPSB1dGYxNmJ1Zi5zdWJhcnJheSgwLCBvdXQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdXRmMTZidWYubGVuZ3RoID0gb3V0O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkobnVsbCwgdXRmMTZidWYpO1xuICAgIHJldHVybiB1dGlscy5hcHBseUZyb21DaGFyQ29kZSh1dGYxNmJ1Zik7XG59O1xuXG5cbi8vIFRoYXQncyBhbGwgZm9yIHRoZSBwYWtvIGZ1bmN0aW9ucy5cblxuXG4vKipcbiAqIFRyYW5zZm9ybSBhIGphdmFzY3JpcHQgc3RyaW5nIGludG8gYW4gYXJyYXkgKHR5cGVkIGlmIHBvc3NpYmxlKSBvZiBieXRlcyxcbiAqIFVURi04IGVuY29kZWQuXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyIHRoZSBzdHJpbmcgdG8gZW5jb2RlXG4gKiBAcmV0dXJuIHtBcnJheXxVaW50OEFycmF5fEJ1ZmZlcn0gdGhlIFVURi04IGVuY29kZWQgc3RyaW5nLlxuICovXG5leHBvcnRzLnV0ZjhlbmNvZGUgPSBmdW5jdGlvbiB1dGY4ZW5jb2RlKHN0cikge1xuICAgIGlmIChzdXBwb3J0Lm5vZGVidWZmZXIpIHtcbiAgICAgICAgcmV0dXJuIG5vZGVqc1V0aWxzLm5ld0J1ZmZlckZyb20oc3RyLCBcInV0Zi04XCIpO1xuICAgIH1cblxuICAgIHJldHVybiBzdHJpbmcyYnVmKHN0cik7XG59O1xuXG5cbi8qKlxuICogVHJhbnNmb3JtIGEgYnl0ZXMgYXJyYXkgKG9yIGEgcmVwcmVzZW50YXRpb24pIHJlcHJlc2VudGluZyBhbiBVVEYtOCBlbmNvZGVkXG4gKiBzdHJpbmcgaW50byBhIGphdmFzY3JpcHQgc3RyaW5nLlxuICogQHBhcmFtIHtBcnJheXxVaW50OEFycmF5fEJ1ZmZlcn0gYnVmIHRoZSBkYXRhIGRlIGRlY29kZVxuICogQHJldHVybiB7U3RyaW5nfSB0aGUgZGVjb2RlZCBzdHJpbmcuXG4gKi9cbmV4cG9ydHMudXRmOGRlY29kZSA9IGZ1bmN0aW9uIHV0ZjhkZWNvZGUoYnVmKSB7XG4gICAgaWYgKHN1cHBvcnQubm9kZWJ1ZmZlcikge1xuICAgICAgICByZXR1cm4gdXRpbHMudHJhbnNmb3JtVG8oXCJub2RlYnVmZmVyXCIsIGJ1ZikudG9TdHJpbmcoXCJ1dGYtOFwiKTtcbiAgICB9XG5cbiAgICBidWYgPSB1dGlscy50cmFuc2Zvcm1UbyhzdXBwb3J0LnVpbnQ4YXJyYXkgPyBcInVpbnQ4YXJyYXlcIiA6IFwiYXJyYXlcIiwgYnVmKTtcblxuICAgIHJldHVybiBidWYyc3RyaW5nKGJ1Zik7XG59O1xuXG4vKipcbiAqIEEgd29ya2VyIHRvIGRlY29kZSB1dGY4IGVuY29kZWQgYmluYXJ5IGNodW5rcyBpbnRvIHN0cmluZyBjaHVua3MuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gVXRmOERlY29kZVdvcmtlcigpIHtcbiAgICBHZW5lcmljV29ya2VyLmNhbGwodGhpcywgXCJ1dGYtOCBkZWNvZGVcIik7XG4gICAgLy8gdGhlIGxhc3QgYnl0ZXMgaWYgYSBjaHVuayBkaWRuJ3QgZW5kIHdpdGggYSBjb21wbGV0ZSBjb2RlcG9pbnQuXG4gICAgdGhpcy5sZWZ0T3ZlciA9IG51bGw7XG59XG51dGlscy5pbmhlcml0cyhVdGY4RGVjb2RlV29ya2VyLCBHZW5lcmljV29ya2VyKTtcblxuLyoqXG4gKiBAc2VlIEdlbmVyaWNXb3JrZXIucHJvY2Vzc0NodW5rXG4gKi9cblV0ZjhEZWNvZGVXb3JrZXIucHJvdG90eXBlLnByb2Nlc3NDaHVuayA9IGZ1bmN0aW9uIChjaHVuaykge1xuXG4gICAgdmFyIGRhdGEgPSB1dGlscy50cmFuc2Zvcm1UbyhzdXBwb3J0LnVpbnQ4YXJyYXkgPyBcInVpbnQ4YXJyYXlcIiA6IFwiYXJyYXlcIiwgY2h1bmsuZGF0YSk7XG5cbiAgICAvLyAxc3Qgc3RlcCwgcmUtdXNlIHdoYXQncyBsZWZ0IG9mIHRoZSBwcmV2aW91cyBjaHVua1xuICAgIGlmICh0aGlzLmxlZnRPdmVyICYmIHRoaXMubGVmdE92ZXIubGVuZ3RoKSB7XG4gICAgICAgIGlmKHN1cHBvcnQudWludDhhcnJheSkge1xuICAgICAgICAgICAgdmFyIHByZXZpb3VzRGF0YSA9IGRhdGE7XG4gICAgICAgICAgICBkYXRhID0gbmV3IFVpbnQ4QXJyYXkocHJldmlvdXNEYXRhLmxlbmd0aCArIHRoaXMubGVmdE92ZXIubGVuZ3RoKTtcbiAgICAgICAgICAgIGRhdGEuc2V0KHRoaXMubGVmdE92ZXIsIDApO1xuICAgICAgICAgICAgZGF0YS5zZXQocHJldmlvdXNEYXRhLCB0aGlzLmxlZnRPdmVyLmxlbmd0aCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkYXRhID0gdGhpcy5sZWZ0T3Zlci5jb25jYXQoZGF0YSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5sZWZ0T3ZlciA9IG51bGw7XG4gICAgfVxuXG4gICAgdmFyIG5leHRCb3VuZGFyeSA9IHV0Zjhib3JkZXIoZGF0YSk7XG4gICAgdmFyIHVzYWJsZURhdGEgPSBkYXRhO1xuICAgIGlmIChuZXh0Qm91bmRhcnkgIT09IGRhdGEubGVuZ3RoKSB7XG4gICAgICAgIGlmIChzdXBwb3J0LnVpbnQ4YXJyYXkpIHtcbiAgICAgICAgICAgIHVzYWJsZURhdGEgPSBkYXRhLnN1YmFycmF5KDAsIG5leHRCb3VuZGFyeSk7XG4gICAgICAgICAgICB0aGlzLmxlZnRPdmVyID0gZGF0YS5zdWJhcnJheShuZXh0Qm91bmRhcnksIGRhdGEubGVuZ3RoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHVzYWJsZURhdGEgPSBkYXRhLnNsaWNlKDAsIG5leHRCb3VuZGFyeSk7XG4gICAgICAgICAgICB0aGlzLmxlZnRPdmVyID0gZGF0YS5zbGljZShuZXh0Qm91bmRhcnksIGRhdGEubGVuZ3RoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMucHVzaCh7XG4gICAgICAgIGRhdGEgOiBleHBvcnRzLnV0ZjhkZWNvZGUodXNhYmxlRGF0YSksXG4gICAgICAgIG1ldGEgOiBjaHVuay5tZXRhXG4gICAgfSk7XG59O1xuXG4vKipcbiAqIEBzZWUgR2VuZXJpY1dvcmtlci5mbHVzaFxuICovXG5VdGY4RGVjb2RlV29ya2VyLnByb3RvdHlwZS5mbHVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZih0aGlzLmxlZnRPdmVyICYmIHRoaXMubGVmdE92ZXIubGVuZ3RoKSB7XG4gICAgICAgIHRoaXMucHVzaCh7XG4gICAgICAgICAgICBkYXRhIDogZXhwb3J0cy51dGY4ZGVjb2RlKHRoaXMubGVmdE92ZXIpLFxuICAgICAgICAgICAgbWV0YSA6IHt9XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmxlZnRPdmVyID0gbnVsbDtcbiAgICB9XG59O1xuZXhwb3J0cy5VdGY4RGVjb2RlV29ya2VyID0gVXRmOERlY29kZVdvcmtlcjtcblxuLyoqXG4gKiBBIHdvcmtlciB0byBlbmRjb2RlIHN0cmluZyBjaHVua3MgaW50byB1dGY4IGVuY29kZWQgYmluYXJ5IGNodW5rcy5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBVdGY4RW5jb2RlV29ya2VyKCkge1xuICAgIEdlbmVyaWNXb3JrZXIuY2FsbCh0aGlzLCBcInV0Zi04IGVuY29kZVwiKTtcbn1cbnV0aWxzLmluaGVyaXRzKFV0ZjhFbmNvZGVXb3JrZXIsIEdlbmVyaWNXb3JrZXIpO1xuXG4vKipcbiAqIEBzZWUgR2VuZXJpY1dvcmtlci5wcm9jZXNzQ2h1bmtcbiAqL1xuVXRmOEVuY29kZVdvcmtlci5wcm90b3R5cGUucHJvY2Vzc0NodW5rID0gZnVuY3Rpb24gKGNodW5rKSB7XG4gICAgdGhpcy5wdXNoKHtcbiAgICAgICAgZGF0YSA6IGV4cG9ydHMudXRmOGVuY29kZShjaHVuay5kYXRhKSxcbiAgICAgICAgbWV0YSA6IGNodW5rLm1ldGFcbiAgICB9KTtcbn07XG5leHBvcnRzLlV0ZjhFbmNvZGVXb3JrZXIgPSBVdGY4RW5jb2RlV29ya2VyO1xuXG59LHtcIi4vbm9kZWpzVXRpbHNcIjoxNCxcIi4vc3RyZWFtL0dlbmVyaWNXb3JrZXJcIjoyOCxcIi4vc3VwcG9ydFwiOjMwLFwiLi91dGlsc1wiOjMyfV0sMzI6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXG52YXIgc3VwcG9ydCA9IHJlcXVpcmUoXCIuL3N1cHBvcnRcIik7XG52YXIgYmFzZTY0ID0gcmVxdWlyZShcIi4vYmFzZTY0XCIpO1xudmFyIG5vZGVqc1V0aWxzID0gcmVxdWlyZShcIi4vbm9kZWpzVXRpbHNcIik7XG52YXIgZXh0ZXJuYWwgPSByZXF1aXJlKFwiLi9leHRlcm5hbFwiKTtcbnJlcXVpcmUoXCJzZXRpbW1lZGlhdGVcIik7XG5cblxuLyoqXG4gKiBDb252ZXJ0IGEgc3RyaW5nIHRoYXQgcGFzcyBhcyBhIFwiYmluYXJ5IHN0cmluZ1wiOiBpdCBzaG91bGQgcmVwcmVzZW50IGEgYnl0ZVxuICogYXJyYXkgYnV0IG1heSBoYXZlID4gMjU1IGNoYXIgY29kZXMuIEJlIHN1cmUgdG8gdGFrZSBvbmx5IHRoZSBmaXJzdCBieXRlXG4gKiBhbmQgcmV0dXJucyB0aGUgYnl0ZSBhcnJheS5cbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHIgdGhlIHN0cmluZyB0byB0cmFuc2Zvcm0uXG4gKiBAcmV0dXJuIHtBcnJheXxVaW50OEFycmF5fSB0aGUgc3RyaW5nIGluIGEgYmluYXJ5IGZvcm1hdC5cbiAqL1xuZnVuY3Rpb24gc3RyaW5nMmJpbmFyeShzdHIpIHtcbiAgICB2YXIgcmVzdWx0ID0gbnVsbDtcbiAgICBpZiAoc3VwcG9ydC51aW50OGFycmF5KSB7XG4gICAgICAgIHJlc3VsdCA9IG5ldyBVaW50OEFycmF5KHN0ci5sZW5ndGgpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdCA9IG5ldyBBcnJheShzdHIubGVuZ3RoKTtcbiAgICB9XG4gICAgcmV0dXJuIHN0cmluZ1RvQXJyYXlMaWtlKHN0ciwgcmVzdWx0KTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBuZXcgYmxvYiB3aXRoIHRoZSBnaXZlbiBjb250ZW50IGFuZCB0aGUgZ2l2ZW4gdHlwZS5cbiAqIEBwYXJhbSB7U3RyaW5nfEFycmF5QnVmZmVyfSBwYXJ0IHRoZSBjb250ZW50IHRvIHB1dCBpbiB0aGUgYmxvYi4gRE8gTk9UIHVzZVxuICogYW4gVWludDhBcnJheSBiZWNhdXNlIHRoZSBzdG9jayBicm93c2VyIG9mIGFuZHJvaWQgNCB3b24ndCBhY2NlcHQgaXQgKGl0XG4gKiB3aWxsIGJlIHNpbGVudGx5IGNvbnZlcnRlZCB0byBhIHN0cmluZywgXCJbb2JqZWN0IFVpbnQ4QXJyYXldXCIpLlxuICpcbiAqIFVzZSBvbmx5IE9ORSBwYXJ0IHRvIGJ1aWxkIHRoZSBibG9iIHRvIGF2b2lkIGEgbWVtb3J5IGxlYWsgaW4gSUUxMSAvIEVkZ2U6XG4gKiB3aGVuIGEgbGFyZ2UgYW1vdW50IG9mIEFycmF5IGlzIHVzZWQgdG8gY3JlYXRlIHRoZSBCbG9iLCB0aGUgYW1vdW50IG9mXG4gKiBtZW1vcnkgY29uc3VtZWQgaXMgbmVhcmx5IDEwMCB0aW1lcyB0aGUgb3JpZ2luYWwgZGF0YSBhbW91bnQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHR5cGUgdGhlIG1pbWUgdHlwZSBvZiB0aGUgYmxvYi5cbiAqIEByZXR1cm4ge0Jsb2J9IHRoZSBjcmVhdGVkIGJsb2IuXG4gKi9cbmV4cG9ydHMubmV3QmxvYiA9IGZ1bmN0aW9uKHBhcnQsIHR5cGUpIHtcbiAgICBleHBvcnRzLmNoZWNrU3VwcG9ydChcImJsb2JcIik7XG5cbiAgICB0cnkge1xuICAgICAgICAvLyBCbG9iIGNvbnN0cnVjdG9yXG4gICAgICAgIHJldHVybiBuZXcgQmxvYihbcGFydF0sIHtcbiAgICAgICAgICAgIHR5cGU6IHR5cGVcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGNhdGNoIChlKSB7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIGRlcHJlY2F0ZWQsIGJyb3dzZXIgb25seSwgb2xkIHdheVxuICAgICAgICAgICAgdmFyIEJ1aWxkZXIgPSBzZWxmLkJsb2JCdWlsZGVyIHx8IHNlbGYuV2ViS2l0QmxvYkJ1aWxkZXIgfHwgc2VsZi5Nb3pCbG9iQnVpbGRlciB8fCBzZWxmLk1TQmxvYkJ1aWxkZXI7XG4gICAgICAgICAgICB2YXIgYnVpbGRlciA9IG5ldyBCdWlsZGVyKCk7XG4gICAgICAgICAgICBidWlsZGVyLmFwcGVuZChwYXJ0KTtcbiAgICAgICAgICAgIHJldHVybiBidWlsZGVyLmdldEJsb2IodHlwZSk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGUpIHtcblxuICAgICAgICAgICAgLy8gd2VsbCwgZnVjayA/IVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQnVnIDogY2FuJ3QgY29uc3RydWN0IHRoZSBCbG9iLlwiKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG59O1xuLyoqXG4gKiBUaGUgaWRlbnRpdHkgZnVuY3Rpb24uXG4gKiBAcGFyYW0ge09iamVjdH0gaW5wdXQgdGhlIGlucHV0LlxuICogQHJldHVybiB7T2JqZWN0fSB0aGUgc2FtZSBpbnB1dC5cbiAqL1xuZnVuY3Rpb24gaWRlbnRpdHkoaW5wdXQpIHtcbiAgICByZXR1cm4gaW5wdXQ7XG59XG5cbi8qKlxuICogRmlsbCBpbiBhbiBhcnJheSB3aXRoIGEgc3RyaW5nLlxuICogQHBhcmFtIHtTdHJpbmd9IHN0ciB0aGUgc3RyaW5nIHRvIHVzZS5cbiAqIEBwYXJhbSB7QXJyYXl8QXJyYXlCdWZmZXJ8VWludDhBcnJheXxCdWZmZXJ9IGFycmF5IHRoZSBhcnJheSB0byBmaWxsIGluICh3aWxsIGJlIG11dGF0ZWQpLlxuICogQHJldHVybiB7QXJyYXl8QXJyYXlCdWZmZXJ8VWludDhBcnJheXxCdWZmZXJ9IHRoZSB1cGRhdGVkIGFycmF5LlxuICovXG5mdW5jdGlvbiBzdHJpbmdUb0FycmF5TGlrZShzdHIsIGFycmF5KSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgYXJyYXlbaV0gPSBzdHIuY2hhckNvZGVBdChpKSAmIDB4RkY7XG4gICAgfVxuICAgIHJldHVybiBhcnJheTtcbn1cblxuLyoqXG4gKiBBbiBoZWxwZXIgZm9yIHRoZSBmdW5jdGlvbiBhcnJheUxpa2VUb1N0cmluZy5cbiAqIFRoaXMgY29udGFpbnMgc3RhdGljIGluZm9ybWF0aW9uIGFuZCBmdW5jdGlvbnMgdGhhdFxuICogY2FuIGJlIG9wdGltaXplZCBieSB0aGUgYnJvd3NlciBKSVQgY29tcGlsZXIuXG4gKi9cbnZhciBhcnJheVRvU3RyaW5nSGVscGVyID0ge1xuICAgIC8qKlxuICAgICAqIFRyYW5zZm9ybSBhbiBhcnJheSBvZiBpbnQgaW50byBhIHN0cmluZywgY2h1bmsgYnkgY2h1bmsuXG4gICAgICogU2VlIHRoZSBwZXJmb3JtYW5jZXMgbm90ZXMgb24gYXJyYXlMaWtlVG9TdHJpbmcuXG4gICAgICogQHBhcmFtIHtBcnJheXxBcnJheUJ1ZmZlcnxVaW50OEFycmF5fEJ1ZmZlcn0gYXJyYXkgdGhlIGFycmF5IHRvIHRyYW5zZm9ybS5cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gdHlwZSB0aGUgdHlwZSBvZiB0aGUgYXJyYXkuXG4gICAgICogQHBhcmFtIHtJbnRlZ2VyfSBjaHVuayB0aGUgY2h1bmsgc2l6ZS5cbiAgICAgKiBAcmV0dXJuIHtTdHJpbmd9IHRoZSByZXN1bHRpbmcgc3RyaW5nLlxuICAgICAqIEB0aHJvd3MgRXJyb3IgaWYgdGhlIGNodW5rIGlzIHRvbyBiaWcgZm9yIHRoZSBzdGFjay5cbiAgICAgKi9cbiAgICBzdHJpbmdpZnlCeUNodW5rOiBmdW5jdGlvbihhcnJheSwgdHlwZSwgY2h1bmspIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdLCBrID0gMCwgbGVuID0gYXJyYXkubGVuZ3RoO1xuICAgICAgICAvLyBzaG9ydGN1dFxuICAgICAgICBpZiAobGVuIDw9IGNodW5rKSB7XG4gICAgICAgICAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShudWxsLCBhcnJheSk7XG4gICAgICAgIH1cbiAgICAgICAgd2hpbGUgKGsgPCBsZW4pIHtcbiAgICAgICAgICAgIGlmICh0eXBlID09PSBcImFycmF5XCIgfHwgdHlwZSA9PT0gXCJub2RlYnVmZmVyXCIpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KG51bGwsIGFycmF5LnNsaWNlKGssIE1hdGgubWluKGsgKyBjaHVuaywgbGVuKSkpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkobnVsbCwgYXJyYXkuc3ViYXJyYXkoaywgTWF0aC5taW4oayArIGNodW5rLCBsZW4pKSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgayArPSBjaHVuaztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0LmpvaW4oXCJcIik7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBDYWxsIFN0cmluZy5mcm9tQ2hhckNvZGUgb24gZXZlcnkgaXRlbSBpbiB0aGUgYXJyYXkuXG4gICAgICogVGhpcyBpcyB0aGUgbmFpdmUgaW1wbGVtZW50YXRpb24sIHdoaWNoIGdlbmVyYXRlIEEgTE9UIG9mIGludGVybWVkaWF0ZSBzdHJpbmcuXG4gICAgICogVGhpcyBzaG91bGQgYmUgdXNlZCB3aGVuIGV2ZXJ5dGhpbmcgZWxzZSBmYWlsLlxuICAgICAqIEBwYXJhbSB7QXJyYXl8QXJyYXlCdWZmZXJ8VWludDhBcnJheXxCdWZmZXJ9IGFycmF5IHRoZSBhcnJheSB0byB0cmFuc2Zvcm0uXG4gICAgICogQHJldHVybiB7U3RyaW5nfSB0aGUgcmVzdWx0LlxuICAgICAqL1xuICAgIHN0cmluZ2lmeUJ5Q2hhcjogZnVuY3Rpb24oYXJyYXkpe1xuICAgICAgICB2YXIgcmVzdWx0U3RyID0gXCJcIjtcbiAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICByZXN1bHRTdHIgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShhcnJheVtpXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdFN0cjtcbiAgICB9LFxuICAgIGFwcGx5Q2FuQmVVc2VkIDoge1xuICAgICAgICAvKipcbiAgICAgICAgICogdHJ1ZSBpZiB0aGUgYnJvd3NlciBhY2NlcHRzIHRvIHVzZSBTdHJpbmcuZnJvbUNoYXJDb2RlIG9uIFVpbnQ4QXJyYXlcbiAgICAgICAgICovXG4gICAgICAgIHVpbnQ4YXJyYXkgOiAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3VwcG9ydC51aW50OGFycmF5ICYmIFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkobnVsbCwgbmV3IFVpbnQ4QXJyYXkoMSkpLmxlbmd0aCA9PT0gMTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKCksXG4gICAgICAgIC8qKlxuICAgICAgICAgKiB0cnVlIGlmIHRoZSBicm93c2VyIGFjY2VwdHMgdG8gdXNlIFN0cmluZy5mcm9tQ2hhckNvZGUgb24gbm9kZWpzIEJ1ZmZlci5cbiAgICAgICAgICovXG4gICAgICAgIG5vZGVidWZmZXIgOiAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3VwcG9ydC5ub2RlYnVmZmVyICYmIFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkobnVsbCwgbm9kZWpzVXRpbHMuYWxsb2NCdWZmZXIoMSkpLmxlbmd0aCA9PT0gMTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKClcbiAgICB9XG59O1xuXG4vKipcbiAqIFRyYW5zZm9ybSBhbiBhcnJheS1saWtlIG9iamVjdCB0byBhIHN0cmluZy5cbiAqIEBwYXJhbSB7QXJyYXl8QXJyYXlCdWZmZXJ8VWludDhBcnJheXxCdWZmZXJ9IGFycmF5IHRoZSBhcnJheSB0byB0cmFuc2Zvcm0uXG4gKiBAcmV0dXJuIHtTdHJpbmd9IHRoZSByZXN1bHQuXG4gKi9cbmZ1bmN0aW9uIGFycmF5TGlrZVRvU3RyaW5nKGFycmF5KSB7XG4gICAgLy8gUGVyZm9ybWFuY2VzIG5vdGVzIDpcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vIFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkobnVsbCwgYXJyYXkpIGlzIHRoZSBmYXN0ZXN0LCBzZWVcbiAgICAvLyBzZWUgaHR0cDovL2pzcGVyZi5jb20vY29udmVydGluZy1hLXVpbnQ4YXJyYXktdG8tYS1zdHJpbmcvMlxuICAgIC8vIGJ1dCB0aGUgc3RhY2sgaXMgbGltaXRlZCAoYW5kIHdlIGNhbiBnZXQgaHVnZSBhcnJheXMgISkuXG4gICAgLy9cbiAgICAvLyByZXN1bHQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShhcnJheVtpXSk7IGdlbmVyYXRlIHRvbyBtYW55IHN0cmluZ3MgIVxuICAgIC8vXG4gICAgLy8gVGhpcyBjb2RlIGlzIGluc3BpcmVkIGJ5IGh0dHA6Ly9qc3BlcmYuY29tL2FycmF5YnVmZmVyLXRvLXN0cmluZy1hcHBseS1wZXJmb3JtYW5jZS8yXG4gICAgLy8gVE9ETyA6IHdlIG5vdyBoYXZlIHdvcmtlcnMgdGhhdCBzcGxpdCB0aGUgd29yay4gRG8gd2Ugc3RpbGwgbmVlZCB0aGF0ID9cbiAgICB2YXIgY2h1bmsgPSA2NTUzNixcbiAgICAgICAgdHlwZSA9IGV4cG9ydHMuZ2V0VHlwZU9mKGFycmF5KSxcbiAgICAgICAgY2FuVXNlQXBwbHkgPSB0cnVlO1xuICAgIGlmICh0eXBlID09PSBcInVpbnQ4YXJyYXlcIikge1xuICAgICAgICBjYW5Vc2VBcHBseSA9IGFycmF5VG9TdHJpbmdIZWxwZXIuYXBwbHlDYW5CZVVzZWQudWludDhhcnJheTtcbiAgICB9IGVsc2UgaWYgKHR5cGUgPT09IFwibm9kZWJ1ZmZlclwiKSB7XG4gICAgICAgIGNhblVzZUFwcGx5ID0gYXJyYXlUb1N0cmluZ0hlbHBlci5hcHBseUNhbkJlVXNlZC5ub2RlYnVmZmVyO1xuICAgIH1cblxuICAgIGlmIChjYW5Vc2VBcHBseSkge1xuICAgICAgICB3aGlsZSAoY2h1bmsgPiAxKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHJldHVybiBhcnJheVRvU3RyaW5nSGVscGVyLnN0cmluZ2lmeUJ5Q2h1bmsoYXJyYXksIHR5cGUsIGNodW5rKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBjaHVuayA9IE1hdGguZmxvb3IoY2h1bmsgLyAyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIG5vIGFwcGx5IG9yIGNodW5rIGVycm9yIDogc2xvdyBhbmQgcGFpbmZ1bCBhbGdvcml0aG1cbiAgICAvLyBkZWZhdWx0IGJyb3dzZXIgb24gYW5kcm9pZCA0LipcbiAgICByZXR1cm4gYXJyYXlUb1N0cmluZ0hlbHBlci5zdHJpbmdpZnlCeUNoYXIoYXJyYXkpO1xufVxuXG5leHBvcnRzLmFwcGx5RnJvbUNoYXJDb2RlID0gYXJyYXlMaWtlVG9TdHJpbmc7XG5cblxuLyoqXG4gKiBDb3B5IHRoZSBkYXRhIGZyb20gYW4gYXJyYXktbGlrZSB0byBhbiBvdGhlciBhcnJheS1saWtlLlxuICogQHBhcmFtIHtBcnJheXxBcnJheUJ1ZmZlcnxVaW50OEFycmF5fEJ1ZmZlcn0gYXJyYXlGcm9tIHRoZSBvcmlnaW4gYXJyYXkuXG4gKiBAcGFyYW0ge0FycmF5fEFycmF5QnVmZmVyfFVpbnQ4QXJyYXl8QnVmZmVyfSBhcnJheVRvIHRoZSBkZXN0aW5hdGlvbiBhcnJheSB3aGljaCB3aWxsIGJlIG11dGF0ZWQuXG4gKiBAcmV0dXJuIHtBcnJheXxBcnJheUJ1ZmZlcnxVaW50OEFycmF5fEJ1ZmZlcn0gdGhlIHVwZGF0ZWQgZGVzdGluYXRpb24gYXJyYXkuXG4gKi9cbmZ1bmN0aW9uIGFycmF5TGlrZVRvQXJyYXlMaWtlKGFycmF5RnJvbSwgYXJyYXlUbykge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyYXlGcm9tLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGFycmF5VG9baV0gPSBhcnJheUZyb21baV07XG4gICAgfVxuICAgIHJldHVybiBhcnJheVRvO1xufVxuXG4vLyBhIG1hdHJpeCBjb250YWluaW5nIGZ1bmN0aW9ucyB0byB0cmFuc2Zvcm0gZXZlcnl0aGluZyBpbnRvIGV2ZXJ5dGhpbmcuXG52YXIgdHJhbnNmb3JtID0ge307XG5cbi8vIHN0cmluZyB0byA/XG50cmFuc2Zvcm1bXCJzdHJpbmdcIl0gPSB7XG4gICAgXCJzdHJpbmdcIjogaWRlbnRpdHksXG4gICAgXCJhcnJheVwiOiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICByZXR1cm4gc3RyaW5nVG9BcnJheUxpa2UoaW5wdXQsIG5ldyBBcnJheShpbnB1dC5sZW5ndGgpKTtcbiAgICB9LFxuICAgIFwiYXJyYXlidWZmZXJcIjogZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgcmV0dXJuIHRyYW5zZm9ybVtcInN0cmluZ1wiXVtcInVpbnQ4YXJyYXlcIl0oaW5wdXQpLmJ1ZmZlcjtcbiAgICB9LFxuICAgIFwidWludDhhcnJheVwiOiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICByZXR1cm4gc3RyaW5nVG9BcnJheUxpa2UoaW5wdXQsIG5ldyBVaW50OEFycmF5KGlucHV0Lmxlbmd0aCkpO1xuICAgIH0sXG4gICAgXCJub2RlYnVmZmVyXCI6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHJldHVybiBzdHJpbmdUb0FycmF5TGlrZShpbnB1dCwgbm9kZWpzVXRpbHMuYWxsb2NCdWZmZXIoaW5wdXQubGVuZ3RoKSk7XG4gICAgfVxufTtcblxuLy8gYXJyYXkgdG8gP1xudHJhbnNmb3JtW1wiYXJyYXlcIl0gPSB7XG4gICAgXCJzdHJpbmdcIjogYXJyYXlMaWtlVG9TdHJpbmcsXG4gICAgXCJhcnJheVwiOiBpZGVudGl0eSxcbiAgICBcImFycmF5YnVmZmVyXCI6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHJldHVybiAobmV3IFVpbnQ4QXJyYXkoaW5wdXQpKS5idWZmZXI7XG4gICAgfSxcbiAgICBcInVpbnQ4YXJyYXlcIjogZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KGlucHV0KTtcbiAgICB9LFxuICAgIFwibm9kZWJ1ZmZlclwiOiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICByZXR1cm4gbm9kZWpzVXRpbHMubmV3QnVmZmVyRnJvbShpbnB1dCk7XG4gICAgfVxufTtcblxuLy8gYXJyYXlidWZmZXIgdG8gP1xudHJhbnNmb3JtW1wiYXJyYXlidWZmZXJcIl0gPSB7XG4gICAgXCJzdHJpbmdcIjogZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgcmV0dXJuIGFycmF5TGlrZVRvU3RyaW5nKG5ldyBVaW50OEFycmF5KGlucHV0KSk7XG4gICAgfSxcbiAgICBcImFycmF5XCI6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHJldHVybiBhcnJheUxpa2VUb0FycmF5TGlrZShuZXcgVWludDhBcnJheShpbnB1dCksIG5ldyBBcnJheShpbnB1dC5ieXRlTGVuZ3RoKSk7XG4gICAgfSxcbiAgICBcImFycmF5YnVmZmVyXCI6IGlkZW50aXR5LFxuICAgIFwidWludDhhcnJheVwiOiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoaW5wdXQpO1xuICAgIH0sXG4gICAgXCJub2RlYnVmZmVyXCI6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHJldHVybiBub2RlanNVdGlscy5uZXdCdWZmZXJGcm9tKG5ldyBVaW50OEFycmF5KGlucHV0KSk7XG4gICAgfVxufTtcblxuLy8gdWludDhhcnJheSB0byA/XG50cmFuc2Zvcm1bXCJ1aW50OGFycmF5XCJdID0ge1xuICAgIFwic3RyaW5nXCI6IGFycmF5TGlrZVRvU3RyaW5nLFxuICAgIFwiYXJyYXlcIjogZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgcmV0dXJuIGFycmF5TGlrZVRvQXJyYXlMaWtlKGlucHV0LCBuZXcgQXJyYXkoaW5wdXQubGVuZ3RoKSk7XG4gICAgfSxcbiAgICBcImFycmF5YnVmZmVyXCI6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHJldHVybiBpbnB1dC5idWZmZXI7XG4gICAgfSxcbiAgICBcInVpbnQ4YXJyYXlcIjogaWRlbnRpdHksXG4gICAgXCJub2RlYnVmZmVyXCI6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHJldHVybiBub2RlanNVdGlscy5uZXdCdWZmZXJGcm9tKGlucHV0KTtcbiAgICB9XG59O1xuXG4vLyBub2RlYnVmZmVyIHRvID9cbnRyYW5zZm9ybVtcIm5vZGVidWZmZXJcIl0gPSB7XG4gICAgXCJzdHJpbmdcIjogYXJyYXlMaWtlVG9TdHJpbmcsXG4gICAgXCJhcnJheVwiOiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICByZXR1cm4gYXJyYXlMaWtlVG9BcnJheUxpa2UoaW5wdXQsIG5ldyBBcnJheShpbnB1dC5sZW5ndGgpKTtcbiAgICB9LFxuICAgIFwiYXJyYXlidWZmZXJcIjogZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgcmV0dXJuIHRyYW5zZm9ybVtcIm5vZGVidWZmZXJcIl1bXCJ1aW50OGFycmF5XCJdKGlucHV0KS5idWZmZXI7XG4gICAgfSxcbiAgICBcInVpbnQ4YXJyYXlcIjogZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgcmV0dXJuIGFycmF5TGlrZVRvQXJyYXlMaWtlKGlucHV0LCBuZXcgVWludDhBcnJheShpbnB1dC5sZW5ndGgpKTtcbiAgICB9LFxuICAgIFwibm9kZWJ1ZmZlclwiOiBpZGVudGl0eVxufTtcblxuLyoqXG4gKiBUcmFuc2Zvcm0gYW4gaW5wdXQgaW50byBhbnkgdHlwZS5cbiAqIFRoZSBzdXBwb3J0ZWQgb3V0cHV0IHR5cGUgYXJlIDogc3RyaW5nLCBhcnJheSwgdWludDhhcnJheSwgYXJyYXlidWZmZXIsIG5vZGVidWZmZXIuXG4gKiBJZiBubyBvdXRwdXQgdHlwZSBpcyBzcGVjaWZpZWQsIHRoZSB1bm1vZGlmaWVkIGlucHV0IHdpbGwgYmUgcmV0dXJuZWQuXG4gKiBAcGFyYW0ge1N0cmluZ30gb3V0cHV0VHlwZSB0aGUgb3V0cHV0IHR5cGUuXG4gKiBAcGFyYW0ge1N0cmluZ3xBcnJheXxBcnJheUJ1ZmZlcnxVaW50OEFycmF5fEJ1ZmZlcn0gaW5wdXQgdGhlIGlucHV0IHRvIGNvbnZlcnQuXG4gKiBAdGhyb3dzIHtFcnJvcn0gYW4gRXJyb3IgaWYgdGhlIGJyb3dzZXIgZG9lc24ndCBzdXBwb3J0IHRoZSByZXF1ZXN0ZWQgb3V0cHV0IHR5cGUuXG4gKi9cbmV4cG9ydHMudHJhbnNmb3JtVG8gPSBmdW5jdGlvbihvdXRwdXRUeXBlLCBpbnB1dCkge1xuICAgIGlmICghaW5wdXQpIHtcbiAgICAgICAgLy8gdW5kZWZpbmVkLCBudWxsLCBldGNcbiAgICAgICAgLy8gYW4gZW1wdHkgc3RyaW5nIHdvbid0IGhhcm0uXG4gICAgICAgIGlucHV0ID0gXCJcIjtcbiAgICB9XG4gICAgaWYgKCFvdXRwdXRUeXBlKSB7XG4gICAgICAgIHJldHVybiBpbnB1dDtcbiAgICB9XG4gICAgZXhwb3J0cy5jaGVja1N1cHBvcnQob3V0cHV0VHlwZSk7XG4gICAgdmFyIGlucHV0VHlwZSA9IGV4cG9ydHMuZ2V0VHlwZU9mKGlucHV0KTtcbiAgICB2YXIgcmVzdWx0ID0gdHJhbnNmb3JtW2lucHV0VHlwZV1bb3V0cHV0VHlwZV0oaW5wdXQpO1xuICAgIHJldHVybiByZXN1bHQ7XG59O1xuXG4vKipcbiAqIFJlc29sdmUgYWxsIHJlbGF0aXZlIHBhdGggY29tcG9uZW50cywgXCIuXCIgYW5kIFwiLi5cIiwgaW4gYSBwYXRoLiBJZiB0aGVzZSByZWxhdGl2ZSBjb21wb25lbnRzXG4gKiB0cmF2ZXJzZSBhYm92ZSB0aGUgcm9vdCB0aGVuIHRoZSByZXN1bHRpbmcgcGF0aCB3aWxsIG9ubHkgY29udGFpbiB0aGUgZmluYWwgcGF0aCBjb21wb25lbnQuXG4gKlxuICogQWxsIGVtcHR5IGNvbXBvbmVudHMsIGUuZy4gXCIvL1wiLCBhcmUgcmVtb3ZlZC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIEEgcGF0aCB3aXRoIC8gb3IgXFwgc2VwYXJhdG9yc1xuICogQHJldHVybnMge3N0cmluZ30gVGhlIHBhdGggd2l0aCBhbGwgcmVsYXRpdmUgcGF0aCBjb21wb25lbnRzIHJlc29sdmVkLlxuICovXG5leHBvcnRzLnJlc29sdmUgPSBmdW5jdGlvbihwYXRoKSB7XG4gICAgdmFyIHBhcnRzID0gcGF0aC5zcGxpdChcIi9cIik7XG4gICAgdmFyIHJlc3VsdCA9IFtdO1xuICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCBwYXJ0cy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgdmFyIHBhcnQgPSBwYXJ0c1tpbmRleF07XG4gICAgICAgIC8vIEFsbG93IHRoZSBmaXJzdCBhbmQgbGFzdCBjb21wb25lbnQgdG8gYmUgZW1wdHkgZm9yIHRyYWlsaW5nIHNsYXNoZXMuXG4gICAgICAgIGlmIChwYXJ0ID09PSBcIi5cIiB8fCAocGFydCA9PT0gXCJcIiAmJiBpbmRleCAhPT0gMCAmJiBpbmRleCAhPT0gcGFydHMubGVuZ3RoIC0gMSkpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9IGVsc2UgaWYgKHBhcnQgPT09IFwiLi5cIikge1xuICAgICAgICAgICAgcmVzdWx0LnBvcCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzdWx0LnB1c2gocGFydCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdC5qb2luKFwiL1wiKTtcbn07XG5cbi8qKlxuICogUmV0dXJuIHRoZSB0eXBlIG9mIHRoZSBpbnB1dC5cbiAqIFRoZSB0eXBlIHdpbGwgYmUgaW4gYSBmb3JtYXQgdmFsaWQgZm9yIEpTWmlwLnV0aWxzLnRyYW5zZm9ybVRvIDogc3RyaW5nLCBhcnJheSwgdWludDhhcnJheSwgYXJyYXlidWZmZXIuXG4gKiBAcGFyYW0ge09iamVjdH0gaW5wdXQgdGhlIGlucHV0IHRvIGlkZW50aWZ5LlxuICogQHJldHVybiB7U3RyaW5nfSB0aGUgKGxvd2VyY2FzZSkgdHlwZSBvZiB0aGUgaW5wdXQuXG4gKi9cbmV4cG9ydHMuZ2V0VHlwZU9mID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgICBpZiAodHlwZW9mIGlucHV0ID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHJldHVybiBcInN0cmluZ1wiO1xuICAgIH1cbiAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGlucHV0KSA9PT0gXCJbb2JqZWN0IEFycmF5XVwiKSB7XG4gICAgICAgIHJldHVybiBcImFycmF5XCI7XG4gICAgfVxuICAgIGlmIChzdXBwb3J0Lm5vZGVidWZmZXIgJiYgbm9kZWpzVXRpbHMuaXNCdWZmZXIoaW5wdXQpKSB7XG4gICAgICAgIHJldHVybiBcIm5vZGVidWZmZXJcIjtcbiAgICB9XG4gICAgaWYgKHN1cHBvcnQudWludDhhcnJheSAmJiBpbnB1dCBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpIHtcbiAgICAgICAgcmV0dXJuIFwidWludDhhcnJheVwiO1xuICAgIH1cbiAgICBpZiAoc3VwcG9ydC5hcnJheWJ1ZmZlciAmJiBpbnB1dCBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XG4gICAgICAgIHJldHVybiBcImFycmF5YnVmZmVyXCI7XG4gICAgfVxufTtcblxuLyoqXG4gKiBUaHJvdyBhbiBleGNlcHRpb24gaWYgdGhlIHR5cGUgaXMgbm90IHN1cHBvcnRlZC5cbiAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlIHRoZSB0eXBlIHRvIGNoZWNrLlxuICogQHRocm93cyB7RXJyb3J9IGFuIEVycm9yIGlmIHRoZSBicm93c2VyIGRvZXNuJ3Qgc3VwcG9ydCB0aGUgcmVxdWVzdGVkIHR5cGUuXG4gKi9cbmV4cG9ydHMuY2hlY2tTdXBwb3J0ID0gZnVuY3Rpb24odHlwZSkge1xuICAgIHZhciBzdXBwb3J0ZWQgPSBzdXBwb3J0W3R5cGUudG9Mb3dlckNhc2UoKV07XG4gICAgaWYgKCFzdXBwb3J0ZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKHR5cGUgKyBcIiBpcyBub3Qgc3VwcG9ydGVkIGJ5IHRoaXMgcGxhdGZvcm1cIik7XG4gICAgfVxufTtcblxuZXhwb3J0cy5NQVhfVkFMVUVfMTZCSVRTID0gNjU1MzU7XG5leHBvcnRzLk1BWF9WQUxVRV8zMkJJVFMgPSAtMTsgLy8gd2VsbCwgXCJcXHhGRlxceEZGXFx4RkZcXHhGRlxceEZGXFx4RkZcXHhGRlxceEZGXCIgaXMgcGFyc2VkIGFzIC0xXG5cbi8qKlxuICogUHJldHRpZnkgYSBzdHJpbmcgcmVhZCBhcyBiaW5hcnkuXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyIHRoZSBzdHJpbmcgdG8gcHJldHRpZnkuXG4gKiBAcmV0dXJuIHtzdHJpbmd9IGEgcHJldHR5IHN0cmluZy5cbiAqL1xuZXhwb3J0cy5wcmV0dHkgPSBmdW5jdGlvbihzdHIpIHtcbiAgICB2YXIgcmVzID0gXCJcIixcbiAgICAgICAgY29kZSwgaTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgKHN0ciB8fCBcIlwiKS5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb2RlID0gc3RyLmNoYXJDb2RlQXQoaSk7XG4gICAgICAgIHJlcyArPSBcIlxcXFx4XCIgKyAoY29kZSA8IDE2ID8gXCIwXCIgOiBcIlwiKSArIGNvZGUudG9TdHJpbmcoMTYpLnRvVXBwZXJDYXNlKCk7XG4gICAgfVxuICAgIHJldHVybiByZXM7XG59O1xuXG4vKipcbiAqIERlZmVyIHRoZSBjYWxsIG9mIGEgZnVuY3Rpb24uXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayB0aGUgZnVuY3Rpb24gdG8gY2FsbCBhc3luY2hyb25vdXNseS5cbiAqIEBwYXJhbSB7QXJyYXl9IGFyZ3MgdGhlIGFyZ3VtZW50cyB0byBnaXZlIHRvIHRoZSBjYWxsYmFjay5cbiAqL1xuZXhwb3J0cy5kZWxheSA9IGZ1bmN0aW9uKGNhbGxiYWNrLCBhcmdzLCBzZWxmKSB7XG4gICAgc2V0SW1tZWRpYXRlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY2FsbGJhY2suYXBwbHkoc2VsZiB8fCBudWxsLCBhcmdzIHx8IFtdKTtcbiAgICB9KTtcbn07XG5cbi8qKlxuICogRXh0ZW5kcyBhIHByb3RvdHlwZSB3aXRoIGFuIG90aGVyLCB3aXRob3V0IGNhbGxpbmcgYSBjb25zdHJ1Y3RvciB3aXRoXG4gKiBzaWRlIGVmZmVjdHMuIEluc3BpcmVkIGJ5IG5vZGVqcycgYHV0aWxzLmluaGVyaXRzYFxuICogQHBhcmFtIHtGdW5jdGlvbn0gY3RvciB0aGUgY29uc3RydWN0b3IgdG8gYXVnbWVudFxuICogQHBhcmFtIHtGdW5jdGlvbn0gc3VwZXJDdG9yIHRoZSBwYXJlbnQgY29uc3RydWN0b3IgdG8gdXNlXG4gKi9cbmV4cG9ydHMuaW5oZXJpdHMgPSBmdW5jdGlvbiAoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgdmFyIE9iaiA9IGZ1bmN0aW9uKCkge307XG4gICAgT2JqLnByb3RvdHlwZSA9IHN1cGVyQ3Rvci5wcm90b3R5cGU7XG4gICAgY3Rvci5wcm90b3R5cGUgPSBuZXcgT2JqKCk7XG59O1xuXG4vKipcbiAqIE1lcmdlIHRoZSBvYmplY3RzIHBhc3NlZCBhcyBwYXJhbWV0ZXJzIGludG8gYSBuZXcgb25lLlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Li4uT2JqZWN0fSB2YXJfYXJncyBBbGwgb2JqZWN0cyB0byBtZXJnZS5cbiAqIEByZXR1cm4ge09iamVjdH0gYSBuZXcgb2JqZWN0IHdpdGggdGhlIGRhdGEgb2YgdGhlIG90aGVycy5cbiAqL1xuZXhwb3J0cy5leHRlbmQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgcmVzdWx0ID0ge30sIGksIGF0dHI7XG4gICAgZm9yIChpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykgeyAvLyBhcmd1bWVudHMgaXMgbm90IGVudW1lcmFibGUgaW4gc29tZSBicm93c2Vyc1xuICAgICAgICBmb3IgKGF0dHIgaW4gYXJndW1lbnRzW2ldKSB7XG4gICAgICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGFyZ3VtZW50c1tpXSwgYXR0cikgJiYgdHlwZW9mIHJlc3VsdFthdHRyXSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgICAgIHJlc3VsdFthdHRyXSA9IGFyZ3VtZW50c1tpXVthdHRyXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufTtcblxuLyoqXG4gKiBUcmFuc2Zvcm0gYXJiaXRyYXJ5IGNvbnRlbnQgaW50byBhIFByb21pc2UuXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBhIG5hbWUgZm9yIHRoZSBjb250ZW50IGJlaW5nIHByb2Nlc3NlZC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBpbnB1dERhdGEgdGhlIGNvbnRlbnQgdG8gcHJvY2Vzcy5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gaXNCaW5hcnkgdHJ1ZSBpZiB0aGUgY29udGVudCBpcyBub3QgYW4gdW5pY29kZSBzdHJpbmdcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gaXNPcHRpbWl6ZWRCaW5hcnlTdHJpbmcgdHJ1ZSBpZiB0aGUgc3RyaW5nIGNvbnRlbnQgb25seSBoYXMgb25lIGJ5dGUgcGVyIGNoYXJhY3Rlci5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gaXNCYXNlNjQgdHJ1ZSBpZiB0aGUgc3RyaW5nIGNvbnRlbnQgaXMgZW5jb2RlZCB3aXRoIGJhc2U2NC5cbiAqIEByZXR1cm4ge1Byb21pc2V9IGEgcHJvbWlzZSBpbiBhIGZvcm1hdCB1c2FibGUgYnkgSlNaaXAuXG4gKi9cbmV4cG9ydHMucHJlcGFyZUNvbnRlbnQgPSBmdW5jdGlvbihuYW1lLCBpbnB1dERhdGEsIGlzQmluYXJ5LCBpc09wdGltaXplZEJpbmFyeVN0cmluZywgaXNCYXNlNjQpIHtcblxuICAgIC8vIGlmIGlucHV0RGF0YSBpcyBhbHJlYWR5IGEgcHJvbWlzZSwgdGhpcyBmbGF0dGVuIGl0LlxuICAgIHZhciBwcm9taXNlID0gZXh0ZXJuYWwuUHJvbWlzZS5yZXNvbHZlKGlucHV0RGF0YSkudGhlbihmdW5jdGlvbihkYXRhKSB7XG5cblxuICAgICAgICB2YXIgaXNCbG9iID0gc3VwcG9ydC5ibG9iICYmIChkYXRhIGluc3RhbmNlb2YgQmxvYiB8fCBbXCJbb2JqZWN0IEZpbGVdXCIsIFwiW29iamVjdCBCbG9iXVwiXS5pbmRleE9mKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChkYXRhKSkgIT09IC0xKTtcblxuICAgICAgICBpZiAoaXNCbG9iICYmIHR5cGVvZiBGaWxlUmVhZGVyICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IGV4dGVybmFsLlByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuXG4gICAgICAgICAgICAgICAgcmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShlLnRhcmdldC5yZXN1bHQpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcmVhZGVyLm9uZXJyb3IgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlLnRhcmdldC5lcnJvcik7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICByZWFkZXIucmVhZEFzQXJyYXlCdWZmZXIoZGF0YSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBkYXRhO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcHJvbWlzZS50aGVuKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdmFyIGRhdGFUeXBlID0gZXhwb3J0cy5nZXRUeXBlT2YoZGF0YSk7XG5cbiAgICAgICAgaWYgKCFkYXRhVHlwZSkge1xuICAgICAgICAgICAgcmV0dXJuIGV4dGVybmFsLlByb21pc2UucmVqZWN0KFxuICAgICAgICAgICAgICAgIG5ldyBFcnJvcihcIkNhbid0IHJlYWQgdGhlIGRhdGEgb2YgJ1wiICsgbmFtZSArIFwiJy4gSXMgaXQgXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICBcImluIGEgc3VwcG9ydGVkIEphdmFTY3JpcHQgdHlwZSAoU3RyaW5nLCBCbG9iLCBBcnJheUJ1ZmZlciwgZXRjKSA/XCIpXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIC8vIHNwZWNpYWwgY2FzZSA6IGl0J3Mgd2F5IGVhc2llciB0byB3b3JrIHdpdGggVWludDhBcnJheSB0aGFuIHdpdGggQXJyYXlCdWZmZXJcbiAgICAgICAgaWYgKGRhdGFUeXBlID09PSBcImFycmF5YnVmZmVyXCIpIHtcbiAgICAgICAgICAgIGRhdGEgPSBleHBvcnRzLnRyYW5zZm9ybVRvKFwidWludDhhcnJheVwiLCBkYXRhKTtcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhVHlwZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgaWYgKGlzQmFzZTY0KSB7XG4gICAgICAgICAgICAgICAgZGF0YSA9IGJhc2U2NC5kZWNvZGUoZGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChpc0JpbmFyeSkge1xuICAgICAgICAgICAgICAgIC8vIG9wdGltaXplZEJpbmFyeVN0cmluZyA9PT0gdHJ1ZSBtZWFucyB0aGF0IHRoZSBmaWxlIGhhcyBhbHJlYWR5IGJlZW4gZmlsdGVyZWQgd2l0aCBhIDB4RkYgbWFza1xuICAgICAgICAgICAgICAgIGlmIChpc09wdGltaXplZEJpbmFyeVN0cmluZyAhPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICAvLyB0aGlzIGlzIGEgc3RyaW5nLCBub3QgaW4gYSBiYXNlNjQgZm9ybWF0LlxuICAgICAgICAgICAgICAgICAgICAvLyBCZSBzdXJlIHRoYXQgdGhpcyBpcyBhIGNvcnJlY3QgXCJiaW5hcnkgc3RyaW5nXCJcbiAgICAgICAgICAgICAgICAgICAgZGF0YSA9IHN0cmluZzJiaW5hcnkoZGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkYXRhO1xuICAgIH0pO1xufTtcblxufSx7XCIuL2Jhc2U2NFwiOjEsXCIuL2V4dGVybmFsXCI6NixcIi4vbm9kZWpzVXRpbHNcIjoxNCxcIi4vc3VwcG9ydFwiOjMwLFwic2V0aW1tZWRpYXRlXCI6NTR9XSwzMzpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG52YXIgcmVhZGVyRm9yID0gcmVxdWlyZShcIi4vcmVhZGVyL3JlYWRlckZvclwiKTtcbnZhciB1dGlscyA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpO1xudmFyIHNpZyA9IHJlcXVpcmUoXCIuL3NpZ25hdHVyZVwiKTtcbnZhciBaaXBFbnRyeSA9IHJlcXVpcmUoXCIuL3ppcEVudHJ5XCIpO1xudmFyIHN1cHBvcnQgPSByZXF1aXJlKFwiLi9zdXBwb3J0XCIpO1xuLy8gIGNsYXNzIFppcEVudHJpZXMge3t7XG4vKipcbiAqIEFsbCB0aGUgZW50cmllcyBpbiB0aGUgemlwIGZpbGUuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7T2JqZWN0fSBsb2FkT3B0aW9ucyBPcHRpb25zIGZvciBsb2FkaW5nIHRoZSBzdHJlYW0uXG4gKi9cbmZ1bmN0aW9uIFppcEVudHJpZXMobG9hZE9wdGlvbnMpIHtcbiAgICB0aGlzLmZpbGVzID0gW107XG4gICAgdGhpcy5sb2FkT3B0aW9ucyA9IGxvYWRPcHRpb25zO1xufVxuWmlwRW50cmllcy5wcm90b3R5cGUgPSB7XG4gICAgLyoqXG4gICAgICogQ2hlY2sgdGhhdCB0aGUgcmVhZGVyIGlzIG9uIHRoZSBzcGVjaWZpZWQgc2lnbmF0dXJlLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBleHBlY3RlZFNpZ25hdHVyZSB0aGUgZXhwZWN0ZWQgc2lnbmF0dXJlLlxuICAgICAqIEB0aHJvd3Mge0Vycm9yfSBpZiBpdCBpcyBhbiBvdGhlciBzaWduYXR1cmUuXG4gICAgICovXG4gICAgY2hlY2tTaWduYXR1cmU6IGZ1bmN0aW9uKGV4cGVjdGVkU2lnbmF0dXJlKSB7XG4gICAgICAgIGlmICghdGhpcy5yZWFkZXIucmVhZEFuZENoZWNrU2lnbmF0dXJlKGV4cGVjdGVkU2lnbmF0dXJlKSkge1xuICAgICAgICAgICAgdGhpcy5yZWFkZXIuaW5kZXggLT0gNDtcbiAgICAgICAgICAgIHZhciBzaWduYXR1cmUgPSB0aGlzLnJlYWRlci5yZWFkU3RyaW5nKDQpO1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ29ycnVwdGVkIHppcCBvciBidWc6IHVuZXhwZWN0ZWQgc2lnbmF0dXJlIFwiICsgXCIoXCIgKyB1dGlscy5wcmV0dHkoc2lnbmF0dXJlKSArIFwiLCBleHBlY3RlZCBcIiArIHV0aWxzLnByZXR0eShleHBlY3RlZFNpZ25hdHVyZSkgKyBcIilcIik7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIENoZWNrIGlmIHRoZSBnaXZlbiBzaWduYXR1cmUgaXMgYXQgdGhlIGdpdmVuIGluZGV4LlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBhc2tlZEluZGV4IHRoZSBpbmRleCB0byBjaGVjay5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXhwZWN0ZWRTaWduYXR1cmUgdGhlIHNpZ25hdHVyZSB0byBleHBlY3QuXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGUgc2lnbmF0dXJlIGlzIGhlcmUsIGZhbHNlIG90aGVyd2lzZS5cbiAgICAgKi9cbiAgICBpc1NpZ25hdHVyZTogZnVuY3Rpb24oYXNrZWRJbmRleCwgZXhwZWN0ZWRTaWduYXR1cmUpIHtcbiAgICAgICAgdmFyIGN1cnJlbnRJbmRleCA9IHRoaXMucmVhZGVyLmluZGV4O1xuICAgICAgICB0aGlzLnJlYWRlci5zZXRJbmRleChhc2tlZEluZGV4KTtcbiAgICAgICAgdmFyIHNpZ25hdHVyZSA9IHRoaXMucmVhZGVyLnJlYWRTdHJpbmcoNCk7XG4gICAgICAgIHZhciByZXN1bHQgPSBzaWduYXR1cmUgPT09IGV4cGVjdGVkU2lnbmF0dXJlO1xuICAgICAgICB0aGlzLnJlYWRlci5zZXRJbmRleChjdXJyZW50SW5kZXgpO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogUmVhZCB0aGUgZW5kIG9mIHRoZSBjZW50cmFsIGRpcmVjdG9yeS5cbiAgICAgKi9cbiAgICByZWFkQmxvY2tFbmRPZkNlbnRyYWw6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmRpc2tOdW1iZXIgPSB0aGlzLnJlYWRlci5yZWFkSW50KDIpO1xuICAgICAgICB0aGlzLmRpc2tXaXRoQ2VudHJhbERpclN0YXJ0ID0gdGhpcy5yZWFkZXIucmVhZEludCgyKTtcbiAgICAgICAgdGhpcy5jZW50cmFsRGlyUmVjb3Jkc09uVGhpc0Rpc2sgPSB0aGlzLnJlYWRlci5yZWFkSW50KDIpO1xuICAgICAgICB0aGlzLmNlbnRyYWxEaXJSZWNvcmRzID0gdGhpcy5yZWFkZXIucmVhZEludCgyKTtcbiAgICAgICAgdGhpcy5jZW50cmFsRGlyU2l6ZSA9IHRoaXMucmVhZGVyLnJlYWRJbnQoNCk7XG4gICAgICAgIHRoaXMuY2VudHJhbERpck9mZnNldCA9IHRoaXMucmVhZGVyLnJlYWRJbnQoNCk7XG5cbiAgICAgICAgdGhpcy56aXBDb21tZW50TGVuZ3RoID0gdGhpcy5yZWFkZXIucmVhZEludCgyKTtcbiAgICAgICAgLy8gd2FybmluZyA6IHRoZSBlbmNvZGluZyBkZXBlbmRzIG9mIHRoZSBzeXN0ZW0gbG9jYWxlXG4gICAgICAgIC8vIE9uIGEgbGludXggbWFjaGluZSB3aXRoIExBTkc9ZW5fVVMudXRmOCwgdGhpcyBmaWVsZCBpcyB1dGY4IGVuY29kZWQuXG4gICAgICAgIC8vIE9uIGEgd2luZG93cyBtYWNoaW5lLCB0aGlzIGZpZWxkIGlzIGVuY29kZWQgd2l0aCB0aGUgbG9jYWxpemVkIHdpbmRvd3MgY29kZSBwYWdlLlxuICAgICAgICB2YXIgemlwQ29tbWVudCA9IHRoaXMucmVhZGVyLnJlYWREYXRhKHRoaXMuemlwQ29tbWVudExlbmd0aCk7XG4gICAgICAgIHZhciBkZWNvZGVQYXJhbVR5cGUgPSBzdXBwb3J0LnVpbnQ4YXJyYXkgPyBcInVpbnQ4YXJyYXlcIiA6IFwiYXJyYXlcIjtcbiAgICAgICAgLy8gVG8gZ2V0IGNvbnNpc3RlbnQgYmVoYXZpb3Igd2l0aCB0aGUgZ2VuZXJhdGlvbiBwYXJ0LCB3ZSB3aWxsIGFzc3VtZSB0aGF0XG4gICAgICAgIC8vIHRoaXMgaXMgdXRmOCBlbmNvZGVkIHVubGVzcyBzcGVjaWZpZWQgb3RoZXJ3aXNlLlxuICAgICAgICB2YXIgZGVjb2RlQ29udGVudCA9IHV0aWxzLnRyYW5zZm9ybVRvKGRlY29kZVBhcmFtVHlwZSwgemlwQ29tbWVudCk7XG4gICAgICAgIHRoaXMuemlwQ29tbWVudCA9IHRoaXMubG9hZE9wdGlvbnMuZGVjb2RlRmlsZU5hbWUoZGVjb2RlQ29udGVudCk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBSZWFkIHRoZSBlbmQgb2YgdGhlIFppcCA2NCBjZW50cmFsIGRpcmVjdG9yeS5cbiAgICAgKiBOb3QgbWVyZ2VkIHdpdGggdGhlIG1ldGhvZCByZWFkRW5kT2ZDZW50cmFsIDpcbiAgICAgKiBUaGUgZW5kIG9mIGNlbnRyYWwgY2FuIGNvZXhpc3Qgd2l0aCBpdHMgWmlwNjQgYnJvdGhlcixcbiAgICAgKiBJIGRvbid0IHdhbnQgdG8gcmVhZCB0aGUgd3JvbmcgbnVtYmVyIG9mIGJ5dGVzICFcbiAgICAgKi9cbiAgICByZWFkQmxvY2taaXA2NEVuZE9mQ2VudHJhbDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuemlwNjRFbmRPZkNlbnRyYWxTaXplID0gdGhpcy5yZWFkZXIucmVhZEludCg4KTtcbiAgICAgICAgdGhpcy5yZWFkZXIuc2tpcCg0KTtcbiAgICAgICAgLy8gdGhpcy52ZXJzaW9uTWFkZUJ5ID0gdGhpcy5yZWFkZXIucmVhZFN0cmluZygyKTtcbiAgICAgICAgLy8gdGhpcy52ZXJzaW9uTmVlZGVkID0gdGhpcy5yZWFkZXIucmVhZEludCgyKTtcbiAgICAgICAgdGhpcy5kaXNrTnVtYmVyID0gdGhpcy5yZWFkZXIucmVhZEludCg0KTtcbiAgICAgICAgdGhpcy5kaXNrV2l0aENlbnRyYWxEaXJTdGFydCA9IHRoaXMucmVhZGVyLnJlYWRJbnQoNCk7XG4gICAgICAgIHRoaXMuY2VudHJhbERpclJlY29yZHNPblRoaXNEaXNrID0gdGhpcy5yZWFkZXIucmVhZEludCg4KTtcbiAgICAgICAgdGhpcy5jZW50cmFsRGlyUmVjb3JkcyA9IHRoaXMucmVhZGVyLnJlYWRJbnQoOCk7XG4gICAgICAgIHRoaXMuY2VudHJhbERpclNpemUgPSB0aGlzLnJlYWRlci5yZWFkSW50KDgpO1xuICAgICAgICB0aGlzLmNlbnRyYWxEaXJPZmZzZXQgPSB0aGlzLnJlYWRlci5yZWFkSW50KDgpO1xuXG4gICAgICAgIHRoaXMuemlwNjRFeHRlbnNpYmxlRGF0YSA9IHt9O1xuICAgICAgICB2YXIgZXh0cmFEYXRhU2l6ZSA9IHRoaXMuemlwNjRFbmRPZkNlbnRyYWxTaXplIC0gNDQsXG4gICAgICAgICAgICBpbmRleCA9IDAsXG4gICAgICAgICAgICBleHRyYUZpZWxkSWQsXG4gICAgICAgICAgICBleHRyYUZpZWxkTGVuZ3RoLFxuICAgICAgICAgICAgZXh0cmFGaWVsZFZhbHVlO1xuICAgICAgICB3aGlsZSAoaW5kZXggPCBleHRyYURhdGFTaXplKSB7XG4gICAgICAgICAgICBleHRyYUZpZWxkSWQgPSB0aGlzLnJlYWRlci5yZWFkSW50KDIpO1xuICAgICAgICAgICAgZXh0cmFGaWVsZExlbmd0aCA9IHRoaXMucmVhZGVyLnJlYWRJbnQoNCk7XG4gICAgICAgICAgICBleHRyYUZpZWxkVmFsdWUgPSB0aGlzLnJlYWRlci5yZWFkRGF0YShleHRyYUZpZWxkTGVuZ3RoKTtcbiAgICAgICAgICAgIHRoaXMuemlwNjRFeHRlbnNpYmxlRGF0YVtleHRyYUZpZWxkSWRdID0ge1xuICAgICAgICAgICAgICAgIGlkOiBleHRyYUZpZWxkSWQsXG4gICAgICAgICAgICAgICAgbGVuZ3RoOiBleHRyYUZpZWxkTGVuZ3RoLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBleHRyYUZpZWxkVmFsdWVcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIFJlYWQgdGhlIGVuZCBvZiB0aGUgWmlwIDY0IGNlbnRyYWwgZGlyZWN0b3J5IGxvY2F0b3IuXG4gICAgICovXG4gICAgcmVhZEJsb2NrWmlwNjRFbmRPZkNlbnRyYWxMb2NhdG9yOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5kaXNrV2l0aFppcDY0Q2VudHJhbERpclN0YXJ0ID0gdGhpcy5yZWFkZXIucmVhZEludCg0KTtcbiAgICAgICAgdGhpcy5yZWxhdGl2ZU9mZnNldEVuZE9mWmlwNjRDZW50cmFsRGlyID0gdGhpcy5yZWFkZXIucmVhZEludCg4KTtcbiAgICAgICAgdGhpcy5kaXNrc0NvdW50ID0gdGhpcy5yZWFkZXIucmVhZEludCg0KTtcbiAgICAgICAgaWYgKHRoaXMuZGlza3NDb3VudCA+IDEpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk11bHRpLXZvbHVtZXMgemlwIGFyZSBub3Qgc3VwcG9ydGVkXCIpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBSZWFkIHRoZSBsb2NhbCBmaWxlcywgYmFzZWQgb24gdGhlIG9mZnNldCByZWFkIGluIHRoZSBjZW50cmFsIHBhcnQuXG4gICAgICovXG4gICAgcmVhZExvY2FsRmlsZXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaSwgZmlsZTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHRoaXMuZmlsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGZpbGUgPSB0aGlzLmZpbGVzW2ldO1xuICAgICAgICAgICAgdGhpcy5yZWFkZXIuc2V0SW5kZXgoZmlsZS5sb2NhbEhlYWRlck9mZnNldCk7XG4gICAgICAgICAgICB0aGlzLmNoZWNrU2lnbmF0dXJlKHNpZy5MT0NBTF9GSUxFX0hFQURFUik7XG4gICAgICAgICAgICBmaWxlLnJlYWRMb2NhbFBhcnQodGhpcy5yZWFkZXIpO1xuICAgICAgICAgICAgZmlsZS5oYW5kbGVVVEY4KCk7XG4gICAgICAgICAgICBmaWxlLnByb2Nlc3NBdHRyaWJ1dGVzKCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIFJlYWQgdGhlIGNlbnRyYWwgZGlyZWN0b3J5LlxuICAgICAqL1xuICAgIHJlYWRDZW50cmFsRGlyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGZpbGU7XG5cbiAgICAgICAgdGhpcy5yZWFkZXIuc2V0SW5kZXgodGhpcy5jZW50cmFsRGlyT2Zmc2V0KTtcbiAgICAgICAgd2hpbGUgKHRoaXMucmVhZGVyLnJlYWRBbmRDaGVja1NpZ25hdHVyZShzaWcuQ0VOVFJBTF9GSUxFX0hFQURFUikpIHtcbiAgICAgICAgICAgIGZpbGUgPSBuZXcgWmlwRW50cnkoe1xuICAgICAgICAgICAgICAgIHppcDY0OiB0aGlzLnppcDY0XG4gICAgICAgICAgICB9LCB0aGlzLmxvYWRPcHRpb25zKTtcbiAgICAgICAgICAgIGZpbGUucmVhZENlbnRyYWxQYXJ0KHRoaXMucmVhZGVyKTtcbiAgICAgICAgICAgIHRoaXMuZmlsZXMucHVzaChmaWxlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmNlbnRyYWxEaXJSZWNvcmRzICE9PSB0aGlzLmZpbGVzLmxlbmd0aCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuY2VudHJhbERpclJlY29yZHMgIT09IDAgJiYgdGhpcy5maWxlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAvLyBXZSBleHBlY3RlZCBzb21lIHJlY29yZHMgYnV0IGNvdWxkbid0IGZpbmQgQU5ZLlxuICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgcmVhbGx5IHN1c3BpY2lvdXMsIGFzIGlmIHNvbWV0aGluZyB3ZW50IHdyb25nLlxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvcnJ1cHRlZCB6aXAgb3IgYnVnOiBleHBlY3RlZCBcIiArIHRoaXMuY2VudHJhbERpclJlY29yZHMgKyBcIiByZWNvcmRzIGluIGNlbnRyYWwgZGlyLCBnb3QgXCIgKyB0aGlzLmZpbGVzLmxlbmd0aCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIFJlYWQgdGhlIGVuZCBvZiBjZW50cmFsIGRpcmVjdG9yeS5cbiAgICAgKi9cbiAgICByZWFkRW5kT2ZDZW50cmFsOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG9mZnNldCA9IHRoaXMucmVhZGVyLmxhc3RJbmRleE9mU2lnbmF0dXJlKHNpZy5DRU5UUkFMX0RJUkVDVE9SWV9FTkQpO1xuICAgICAgICBpZiAob2Zmc2V0IDwgMCkge1xuICAgICAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIGNvbnRlbnQgaXMgYSB0cnVuY2F0ZWQgemlwIG9yIGNvbXBsZXRlIGdhcmJhZ2UuXG4gICAgICAgICAgICAvLyBBIFwiTE9DQUxfRklMRV9IRUFERVJcIiBpcyBub3QgcmVxdWlyZWQgYXQgdGhlIGJlZ2lubmluZyAoYXV0b1xuICAgICAgICAgICAgLy8gZXh0cmFjdGlibGUgemlwIGZvciBleGFtcGxlKSBidXQgaXQgY2FuIGdpdmUgYSBnb29kIGhpbnQuXG4gICAgICAgICAgICAvLyBJZiBhbiBhamF4IHJlcXVlc3Qgd2FzIHVzZWQgd2l0aG91dCByZXNwb25zZVR5cGUsIHdlIHdpbGwgYWxzb1xuICAgICAgICAgICAgLy8gZ2V0IHVucmVhZGFibGUgZGF0YS5cbiAgICAgICAgICAgIHZhciBpc0dhcmJhZ2UgPSAhdGhpcy5pc1NpZ25hdHVyZSgwLCBzaWcuTE9DQUxfRklMRV9IRUFERVIpO1xuXG4gICAgICAgICAgICBpZiAoaXNHYXJiYWdlKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2FuJ3QgZmluZCBlbmQgb2YgY2VudHJhbCBkaXJlY3RvcnkgOiBpcyB0aGlzIGEgemlwIGZpbGUgPyBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiSWYgaXQgaXMsIHNlZSBodHRwczovL3N0dWsuZ2l0aHViLmlvL2pzemlwL2RvY3VtZW50YXRpb24vaG93dG8vcmVhZF96aXAuaHRtbFwiKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ29ycnVwdGVkIHppcDogY2FuJ3QgZmluZCBlbmQgb2YgY2VudHJhbCBkaXJlY3RvcnlcIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfVxuICAgICAgICB0aGlzLnJlYWRlci5zZXRJbmRleChvZmZzZXQpO1xuICAgICAgICB2YXIgZW5kT2ZDZW50cmFsRGlyT2Zmc2V0ID0gb2Zmc2V0O1xuICAgICAgICB0aGlzLmNoZWNrU2lnbmF0dXJlKHNpZy5DRU5UUkFMX0RJUkVDVE9SWV9FTkQpO1xuICAgICAgICB0aGlzLnJlYWRCbG9ja0VuZE9mQ2VudHJhbCgpO1xuXG5cbiAgICAgICAgLyogZXh0cmFjdCBmcm9tIHRoZSB6aXAgc3BlYyA6XG4gICAgICAgICAgICA0KSAgSWYgb25lIG9mIHRoZSBmaWVsZHMgaW4gdGhlIGVuZCBvZiBjZW50cmFsIGRpcmVjdG9yeVxuICAgICAgICAgICAgICAgIHJlY29yZCBpcyB0b28gc21hbGwgdG8gaG9sZCByZXF1aXJlZCBkYXRhLCB0aGUgZmllbGRcbiAgICAgICAgICAgICAgICBzaG91bGQgYmUgc2V0IHRvIC0xICgweEZGRkYgb3IgMHhGRkZGRkZGRikgYW5kIHRoZVxuICAgICAgICAgICAgICAgIFpJUDY0IGZvcm1hdCByZWNvcmQgc2hvdWxkIGJlIGNyZWF0ZWQuXG4gICAgICAgICAgICA1KSAgVGhlIGVuZCBvZiBjZW50cmFsIGRpcmVjdG9yeSByZWNvcmQgYW5kIHRoZVxuICAgICAgICAgICAgICAgIFppcDY0IGVuZCBvZiBjZW50cmFsIGRpcmVjdG9yeSBsb2NhdG9yIHJlY29yZCBtdXN0XG4gICAgICAgICAgICAgICAgcmVzaWRlIG9uIHRoZSBzYW1lIGRpc2sgd2hlbiBzcGxpdHRpbmcgb3Igc3Bhbm5pbmdcbiAgICAgICAgICAgICAgICBhbiBhcmNoaXZlLlxuICAgICAgICAgKi9cbiAgICAgICAgaWYgKHRoaXMuZGlza051bWJlciA9PT0gdXRpbHMuTUFYX1ZBTFVFXzE2QklUUyB8fCB0aGlzLmRpc2tXaXRoQ2VudHJhbERpclN0YXJ0ID09PSB1dGlscy5NQVhfVkFMVUVfMTZCSVRTIHx8IHRoaXMuY2VudHJhbERpclJlY29yZHNPblRoaXNEaXNrID09PSB1dGlscy5NQVhfVkFMVUVfMTZCSVRTIHx8IHRoaXMuY2VudHJhbERpclJlY29yZHMgPT09IHV0aWxzLk1BWF9WQUxVRV8xNkJJVFMgfHwgdGhpcy5jZW50cmFsRGlyU2l6ZSA9PT0gdXRpbHMuTUFYX1ZBTFVFXzMyQklUUyB8fCB0aGlzLmNlbnRyYWxEaXJPZmZzZXQgPT09IHV0aWxzLk1BWF9WQUxVRV8zMkJJVFMpIHtcbiAgICAgICAgICAgIHRoaXMuemlwNjQgPSB0cnVlO1xuXG4gICAgICAgICAgICAvKlxuICAgICAgICAgICAgV2FybmluZyA6IHRoZSB6aXA2NCBleHRlbnNpb24gaXMgc3VwcG9ydGVkLCBidXQgT05MWSBpZiB0aGUgNjRiaXRzIGludGVnZXIgcmVhZCBmcm9tXG4gICAgICAgICAgICB0aGUgemlwIGZpbGUgY2FuIGZpdCBpbnRvIGEgMzJiaXRzIGludGVnZXIuIFRoaXMgY2Fubm90IGJlIHNvbHZlZCA6IEphdmFTY3JpcHQgcmVwcmVzZW50c1xuICAgICAgICAgICAgYWxsIG51bWJlcnMgYXMgNjQtYml0IGRvdWJsZSBwcmVjaXNpb24gSUVFRSA3NTQgZmxvYXRpbmcgcG9pbnQgbnVtYmVycy5cbiAgICAgICAgICAgIFNvLCB3ZSBoYXZlIDUzYml0cyBmb3IgaW50ZWdlcnMgYW5kIGJpdHdpc2Ugb3BlcmF0aW9ucyB0cmVhdCBldmVyeXRoaW5nIGFzIDMyYml0cy5cbiAgICAgICAgICAgIHNlZSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL0phdmFTY3JpcHQvUmVmZXJlbmNlL09wZXJhdG9ycy9CaXR3aXNlX09wZXJhdG9yc1xuICAgICAgICAgICAgYW5kIGh0dHA6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9wdWJsaWNhdGlvbnMvZmlsZXMvRUNNQS1TVC9FQ01BLTI2Mi5wZGYgc2VjdGlvbiA4LjVcbiAgICAgICAgICAgICovXG5cbiAgICAgICAgICAgIC8vIHNob3VsZCBsb29rIGZvciBhIHppcDY0IEVPQ0QgbG9jYXRvclxuICAgICAgICAgICAgb2Zmc2V0ID0gdGhpcy5yZWFkZXIubGFzdEluZGV4T2ZTaWduYXR1cmUoc2lnLlpJUDY0X0NFTlRSQUxfRElSRUNUT1JZX0xPQ0FUT1IpO1xuICAgICAgICAgICAgaWYgKG9mZnNldCA8IDApIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb3JydXB0ZWQgemlwOiBjYW4ndCBmaW5kIHRoZSBaSVA2NCBlbmQgb2YgY2VudHJhbCBkaXJlY3RvcnkgbG9jYXRvclwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMucmVhZGVyLnNldEluZGV4KG9mZnNldCk7XG4gICAgICAgICAgICB0aGlzLmNoZWNrU2lnbmF0dXJlKHNpZy5aSVA2NF9DRU5UUkFMX0RJUkVDVE9SWV9MT0NBVE9SKTtcbiAgICAgICAgICAgIHRoaXMucmVhZEJsb2NrWmlwNjRFbmRPZkNlbnRyYWxMb2NhdG9yKCk7XG5cbiAgICAgICAgICAgIC8vIG5vdyB0aGUgemlwNjQgRU9DRCByZWNvcmRcbiAgICAgICAgICAgIGlmICghdGhpcy5pc1NpZ25hdHVyZSh0aGlzLnJlbGF0aXZlT2Zmc2V0RW5kT2ZaaXA2NENlbnRyYWxEaXIsIHNpZy5aSVA2NF9DRU5UUkFMX0RJUkVDVE9SWV9FTkQpKSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS53YXJuKFwiWklQNjQgZW5kIG9mIGNlbnRyYWwgZGlyZWN0b3J5IG5vdCB3aGVyZSBleHBlY3RlZC5cIik7XG4gICAgICAgICAgICAgICAgdGhpcy5yZWxhdGl2ZU9mZnNldEVuZE9mWmlwNjRDZW50cmFsRGlyID0gdGhpcy5yZWFkZXIubGFzdEluZGV4T2ZTaWduYXR1cmUoc2lnLlpJUDY0X0NFTlRSQUxfRElSRUNUT1JZX0VORCk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucmVsYXRpdmVPZmZzZXRFbmRPZlppcDY0Q2VudHJhbERpciA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ29ycnVwdGVkIHppcDogY2FuJ3QgZmluZCB0aGUgWklQNjQgZW5kIG9mIGNlbnRyYWwgZGlyZWN0b3J5XCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMucmVhZGVyLnNldEluZGV4KHRoaXMucmVsYXRpdmVPZmZzZXRFbmRPZlppcDY0Q2VudHJhbERpcik7XG4gICAgICAgICAgICB0aGlzLmNoZWNrU2lnbmF0dXJlKHNpZy5aSVA2NF9DRU5UUkFMX0RJUkVDVE9SWV9FTkQpO1xuICAgICAgICAgICAgdGhpcy5yZWFkQmxvY2taaXA2NEVuZE9mQ2VudHJhbCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGV4cGVjdGVkRW5kT2ZDZW50cmFsRGlyT2Zmc2V0ID0gdGhpcy5jZW50cmFsRGlyT2Zmc2V0ICsgdGhpcy5jZW50cmFsRGlyU2l6ZTtcbiAgICAgICAgaWYgKHRoaXMuemlwNjQpIHtcbiAgICAgICAgICAgIGV4cGVjdGVkRW5kT2ZDZW50cmFsRGlyT2Zmc2V0ICs9IDIwOyAvLyBlbmQgb2YgY2VudHJhbCBkaXIgNjQgbG9jYXRvclxuICAgICAgICAgICAgZXhwZWN0ZWRFbmRPZkNlbnRyYWxEaXJPZmZzZXQgKz0gMTIgLyogc2hvdWxkIG5vdCBpbmNsdWRlIHRoZSBsZWFkaW5nIDEyIGJ5dGVzICovICsgdGhpcy56aXA2NEVuZE9mQ2VudHJhbFNpemU7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZXh0cmFCeXRlcyA9IGVuZE9mQ2VudHJhbERpck9mZnNldCAtIGV4cGVjdGVkRW5kT2ZDZW50cmFsRGlyT2Zmc2V0O1xuXG4gICAgICAgIGlmIChleHRyYUJ5dGVzID4gMCkge1xuICAgICAgICAgICAgLy8gY29uc29sZS53YXJuKGV4dHJhQnl0ZXMsIFwiZXh0cmEgYnl0ZXMgYXQgYmVnaW5uaW5nIG9yIHdpdGhpbiB6aXBmaWxlXCIpO1xuICAgICAgICAgICAgaWYgKHRoaXMuaXNTaWduYXR1cmUoZW5kT2ZDZW50cmFsRGlyT2Zmc2V0LCBzaWcuQ0VOVFJBTF9GSUxFX0hFQURFUikpIDsgZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gdGhlIG9mZnNldCBpcyB3cm9uZywgdXBkYXRlIHRoZSBcInplcm9cIiBvZiB0aGUgcmVhZGVyXG4gICAgICAgICAgICAgICAgLy8gdGhpcyBoYXBwZW5zIGlmIGRhdGEgaGFzIGJlZW4gcHJlcGVuZGVkIChjcnggZmlsZXMgZm9yIGV4YW1wbGUpXG4gICAgICAgICAgICAgICAgdGhpcy5yZWFkZXIuemVybyA9IGV4dHJhQnl0ZXM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoZXh0cmFCeXRlcyA8IDApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvcnJ1cHRlZCB6aXA6IG1pc3NpbmcgXCIgKyBNYXRoLmFicyhleHRyYUJ5dGVzKSArIFwiIGJ5dGVzLlwiKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgcHJlcGFyZVJlYWRlcjogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB0aGlzLnJlYWRlciA9IHJlYWRlckZvcihkYXRhKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIFJlYWQgYSB6aXAgZmlsZSBhbmQgY3JlYXRlIFppcEVudHJpZXMuXG4gICAgICogQHBhcmFtIHtTdHJpbmd8QXJyYXlCdWZmZXJ8VWludDhBcnJheXxCdWZmZXJ9IGRhdGEgdGhlIGJpbmFyeSBzdHJpbmcgcmVwcmVzZW50aW5nIGEgemlwIGZpbGUuXG4gICAgICovXG4gICAgbG9hZDogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB0aGlzLnByZXBhcmVSZWFkZXIoZGF0YSk7XG4gICAgICAgIHRoaXMucmVhZEVuZE9mQ2VudHJhbCgpO1xuICAgICAgICB0aGlzLnJlYWRDZW50cmFsRGlyKCk7XG4gICAgICAgIHRoaXMucmVhZExvY2FsRmlsZXMoKTtcbiAgICB9XG59O1xuLy8gfX19IGVuZCBvZiBaaXBFbnRyaWVzXG5tb2R1bGUuZXhwb3J0cyA9IFppcEVudHJpZXM7XG5cbn0se1wiLi9yZWFkZXIvcmVhZGVyRm9yXCI6MjIsXCIuL3NpZ25hdHVyZVwiOjIzLFwiLi9zdXBwb3J0XCI6MzAsXCIuL3V0aWxzXCI6MzIsXCIuL3ppcEVudHJ5XCI6MzR9XSwzNDpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG52YXIgcmVhZGVyRm9yID0gcmVxdWlyZShcIi4vcmVhZGVyL3JlYWRlckZvclwiKTtcbnZhciB1dGlscyA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpO1xudmFyIENvbXByZXNzZWRPYmplY3QgPSByZXF1aXJlKFwiLi9jb21wcmVzc2VkT2JqZWN0XCIpO1xudmFyIGNyYzMyZm4gPSByZXF1aXJlKFwiLi9jcmMzMlwiKTtcbnZhciB1dGY4ID0gcmVxdWlyZShcIi4vdXRmOFwiKTtcbnZhciBjb21wcmVzc2lvbnMgPSByZXF1aXJlKFwiLi9jb21wcmVzc2lvbnNcIik7XG52YXIgc3VwcG9ydCA9IHJlcXVpcmUoXCIuL3N1cHBvcnRcIik7XG5cbnZhciBNQURFX0JZX0RPUyA9IDB4MDA7XG52YXIgTUFERV9CWV9VTklYID0gMHgwMztcblxuLyoqXG4gKiBGaW5kIGEgY29tcHJlc3Npb24gcmVnaXN0ZXJlZCBpbiBKU1ppcC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBjb21wcmVzc2lvbk1ldGhvZCB0aGUgbWV0aG9kIG1hZ2ljIHRvIGZpbmQuXG4gKiBAcmV0dXJuIHtPYmplY3R8bnVsbH0gdGhlIEpTWmlwIGNvbXByZXNzaW9uIG9iamVjdCwgbnVsbCBpZiBub25lIGZvdW5kLlxuICovXG52YXIgZmluZENvbXByZXNzaW9uID0gZnVuY3Rpb24oY29tcHJlc3Npb25NZXRob2QpIHtcbiAgICBmb3IgKHZhciBtZXRob2QgaW4gY29tcHJlc3Npb25zKSB7XG4gICAgICAgIGlmICghT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGNvbXByZXNzaW9ucywgbWV0aG9kKSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvbXByZXNzaW9uc1ttZXRob2RdLm1hZ2ljID09PSBjb21wcmVzc2lvbk1ldGhvZCkge1xuICAgICAgICAgICAgcmV0dXJuIGNvbXByZXNzaW9uc1ttZXRob2RdO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xufTtcblxuLy8gY2xhc3MgWmlwRW50cnkge3t7XG4vKipcbiAqIEFuIGVudHJ5IGluIHRoZSB6aXAgZmlsZS5cbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgT3B0aW9ucyBvZiB0aGUgY3VycmVudCBmaWxlLlxuICogQHBhcmFtIHtPYmplY3R9IGxvYWRPcHRpb25zIE9wdGlvbnMgZm9yIGxvYWRpbmcgdGhlIHN0cmVhbS5cbiAqL1xuZnVuY3Rpb24gWmlwRW50cnkob3B0aW9ucywgbG9hZE9wdGlvbnMpIHtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIHRoaXMubG9hZE9wdGlvbnMgPSBsb2FkT3B0aW9ucztcbn1cblppcEVudHJ5LnByb3RvdHlwZSA9IHtcbiAgICAvKipcbiAgICAgKiBzYXkgaWYgdGhlIGZpbGUgaXMgZW5jcnlwdGVkLlxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhlIGZpbGUgaXMgZW5jcnlwdGVkLCBmYWxzZSBvdGhlcndpc2UuXG4gICAgICovXG4gICAgaXNFbmNyeXB0ZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBiaXQgMSBpcyBzZXRcbiAgICAgICAgcmV0dXJuICh0aGlzLmJpdEZsYWcgJiAweDAwMDEpID09PSAweDAwMDE7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBzYXkgaWYgdGhlIGZpbGUgaGFzIHV0Zi04IGZpbGVuYW1lL2NvbW1lbnQuXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGUgZmlsZW5hbWUvY29tbWVudCBpcyBpbiB1dGYtOCwgZmFsc2Ugb3RoZXJ3aXNlLlxuICAgICAqL1xuICAgIHVzZVVURjg6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBiaXQgMTEgaXMgc2V0XG4gICAgICAgIHJldHVybiAodGhpcy5iaXRGbGFnICYgMHgwODAwKSA9PT0gMHgwODAwO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogUmVhZCB0aGUgbG9jYWwgcGFydCBvZiBhIHppcCBmaWxlIGFuZCBhZGQgdGhlIGluZm8gaW4gdGhpcyBvYmplY3QuXG4gICAgICogQHBhcmFtIHtEYXRhUmVhZGVyfSByZWFkZXIgdGhlIHJlYWRlciB0byB1c2UuXG4gICAgICovXG4gICAgcmVhZExvY2FsUGFydDogZnVuY3Rpb24ocmVhZGVyKSB7XG4gICAgICAgIHZhciBjb21wcmVzc2lvbiwgbG9jYWxFeHRyYUZpZWxkc0xlbmd0aDtcblxuICAgICAgICAvLyB3ZSBhbHJlYWR5IGtub3cgZXZlcnl0aGluZyBmcm9tIHRoZSBjZW50cmFsIGRpciAhXG4gICAgICAgIC8vIElmIHRoZSBjZW50cmFsIGRpciBkYXRhIGFyZSBmYWxzZSwgd2UgYXJlIGRvb21lZC5cbiAgICAgICAgLy8gT24gdGhlIGJyaWdodCBzaWRlLCB0aGUgbG9jYWwgcGFydCBpcyBzY2FyeSAgOiB6aXA2NCwgZGF0YSBkZXNjcmlwdG9ycywgYm90aCwgZXRjLlxuICAgICAgICAvLyBUaGUgbGVzcyBkYXRhIHdlIGdldCBoZXJlLCB0aGUgbW9yZSByZWxpYWJsZSB0aGlzIHNob3VsZCBiZS5cbiAgICAgICAgLy8gTGV0J3Mgc2tpcCB0aGUgd2hvbGUgaGVhZGVyIGFuZCBkYXNoIHRvIHRoZSBkYXRhICFcbiAgICAgICAgcmVhZGVyLnNraXAoMjIpO1xuICAgICAgICAvLyBpbiBzb21lIHppcCBjcmVhdGVkIG9uIHdpbmRvd3MsIHRoZSBmaWxlbmFtZSBzdG9yZWQgaW4gdGhlIGNlbnRyYWwgZGlyIGNvbnRhaW5zIFxcIGluc3RlYWQgb2YgLy5cbiAgICAgICAgLy8gU3RyYW5nZWx5LCB0aGUgZmlsZW5hbWUgaGVyZSBpcyBPSy5cbiAgICAgICAgLy8gSSB3b3VsZCBsb3ZlIHRvIHRyZWF0IHRoZXNlIHppcCBmaWxlcyBhcyBjb3JydXB0ZWQgKHNlZSBodHRwOi8vd3d3LmluZm8temlwLm9yZy9GQVEuaHRtbCNiYWNrc2xhc2hlc1xuICAgICAgICAvLyBvciBBUFBOT1RFIzQuNC4xNy4xLCBcIkFsbCBzbGFzaGVzIE1VU1QgYmUgZm9yd2FyZCBzbGFzaGVzICcvJ1wiKSBidXQgdGhlcmUgYXJlIGEgbG90IG9mIGJhZCB6aXAgZ2VuZXJhdG9ycy4uLlxuICAgICAgICAvLyBTZWFyY2ggXCJ1bnppcCBtaXNtYXRjaGluZyBcImxvY2FsXCIgZmlsZW5hbWUgY29udGludWluZyB3aXRoIFwiY2VudHJhbFwiIGZpbGVuYW1lIHZlcnNpb25cIiBvblxuICAgICAgICAvLyB0aGUgaW50ZXJuZXQuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIEkgdGhpbmsgSSBzZWUgdGhlIGxvZ2ljIGhlcmUgOiB0aGUgY2VudHJhbCBkaXJlY3RvcnkgaXMgdXNlZCB0byBkaXNwbGF5XG4gICAgICAgIC8vIGNvbnRlbnQgYW5kIHRoZSBsb2NhbCBkaXJlY3RvcnkgaXMgdXNlZCB0byBleHRyYWN0IHRoZSBmaWxlcy4gTWl4aW5nIC8gYW5kIFxcXG4gICAgICAgIC8vIG1heSBiZSB1c2VkIHRvIGRpc3BsYXkgXFwgdG8gd2luZG93cyB1c2VycyBhbmQgdXNlIC8gd2hlbiBleHRyYWN0aW5nIHRoZSBmaWxlcy5cbiAgICAgICAgLy8gVW5mb3J0dW5hdGVseSwgdGhpcyBsZWFkIGFsc28gdG8gc29tZSBpc3N1ZXMgOiBodHRwOi8vc2VjbGlzdHMub3JnL2Z1bGxkaXNjbG9zdXJlLzIwMDkvU2VwLzM5NFxuICAgICAgICB0aGlzLmZpbGVOYW1lTGVuZ3RoID0gcmVhZGVyLnJlYWRJbnQoMik7XG4gICAgICAgIGxvY2FsRXh0cmFGaWVsZHNMZW5ndGggPSByZWFkZXIucmVhZEludCgyKTsgLy8gY2FuJ3QgYmUgc3VyZSB0aGlzIHdpbGwgYmUgdGhlIHNhbWUgYXMgdGhlIGNlbnRyYWwgZGlyXG4gICAgICAgIC8vIHRoZSBmaWxlTmFtZSBpcyBzdG9yZWQgYXMgYmluYXJ5IGRhdGEsIHRoZSBoYW5kbGVVVEY4IG1ldGhvZCB3aWxsIHRha2UgY2FyZSBvZiB0aGUgZW5jb2RpbmcuXG4gICAgICAgIHRoaXMuZmlsZU5hbWUgPSByZWFkZXIucmVhZERhdGEodGhpcy5maWxlTmFtZUxlbmd0aCk7XG4gICAgICAgIHJlYWRlci5za2lwKGxvY2FsRXh0cmFGaWVsZHNMZW5ndGgpO1xuXG4gICAgICAgIGlmICh0aGlzLmNvbXByZXNzZWRTaXplID09PSAtMSB8fCB0aGlzLnVuY29tcHJlc3NlZFNpemUgPT09IC0xKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJCdWcgb3IgY29ycnVwdGVkIHppcCA6IGRpZG4ndCBnZXQgZW5vdWdoIGluZm9ybWF0aW9uIGZyb20gdGhlIGNlbnRyYWwgZGlyZWN0b3J5IFwiICsgXCIoY29tcHJlc3NlZFNpemUgPT09IC0xIHx8IHVuY29tcHJlc3NlZFNpemUgPT09IC0xKVwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbXByZXNzaW9uID0gZmluZENvbXByZXNzaW9uKHRoaXMuY29tcHJlc3Npb25NZXRob2QpO1xuICAgICAgICBpZiAoY29tcHJlc3Npb24gPT09IG51bGwpIHsgLy8gbm8gY29tcHJlc3Npb24gZm91bmRcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvcnJ1cHRlZCB6aXAgOiBjb21wcmVzc2lvbiBcIiArIHV0aWxzLnByZXR0eSh0aGlzLmNvbXByZXNzaW9uTWV0aG9kKSArIFwiIHVua25vd24gKGlubmVyIGZpbGUgOiBcIiArIHV0aWxzLnRyYW5zZm9ybVRvKFwic3RyaW5nXCIsIHRoaXMuZmlsZU5hbWUpICsgXCIpXCIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZGVjb21wcmVzc2VkID0gbmV3IENvbXByZXNzZWRPYmplY3QodGhpcy5jb21wcmVzc2VkU2l6ZSwgdGhpcy51bmNvbXByZXNzZWRTaXplLCB0aGlzLmNyYzMyLCBjb21wcmVzc2lvbiwgcmVhZGVyLnJlYWREYXRhKHRoaXMuY29tcHJlc3NlZFNpemUpKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVhZCB0aGUgY2VudHJhbCBwYXJ0IG9mIGEgemlwIGZpbGUgYW5kIGFkZCB0aGUgaW5mbyBpbiB0aGlzIG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge0RhdGFSZWFkZXJ9IHJlYWRlciB0aGUgcmVhZGVyIHRvIHVzZS5cbiAgICAgKi9cbiAgICByZWFkQ2VudHJhbFBhcnQ6IGZ1bmN0aW9uKHJlYWRlcikge1xuICAgICAgICB0aGlzLnZlcnNpb25NYWRlQnkgPSByZWFkZXIucmVhZEludCgyKTtcbiAgICAgICAgcmVhZGVyLnNraXAoMik7XG4gICAgICAgIC8vIHRoaXMudmVyc2lvbk5lZWRlZCA9IHJlYWRlci5yZWFkSW50KDIpO1xuICAgICAgICB0aGlzLmJpdEZsYWcgPSByZWFkZXIucmVhZEludCgyKTtcbiAgICAgICAgdGhpcy5jb21wcmVzc2lvbk1ldGhvZCA9IHJlYWRlci5yZWFkU3RyaW5nKDIpO1xuICAgICAgICB0aGlzLmRhdGUgPSByZWFkZXIucmVhZERhdGUoKTtcbiAgICAgICAgdGhpcy5jcmMzMiA9IHJlYWRlci5yZWFkSW50KDQpO1xuICAgICAgICB0aGlzLmNvbXByZXNzZWRTaXplID0gcmVhZGVyLnJlYWRJbnQoNCk7XG4gICAgICAgIHRoaXMudW5jb21wcmVzc2VkU2l6ZSA9IHJlYWRlci5yZWFkSW50KDQpO1xuICAgICAgICB2YXIgZmlsZU5hbWVMZW5ndGggPSByZWFkZXIucmVhZEludCgyKTtcbiAgICAgICAgdGhpcy5leHRyYUZpZWxkc0xlbmd0aCA9IHJlYWRlci5yZWFkSW50KDIpO1xuICAgICAgICB0aGlzLmZpbGVDb21tZW50TGVuZ3RoID0gcmVhZGVyLnJlYWRJbnQoMik7XG4gICAgICAgIHRoaXMuZGlza051bWJlclN0YXJ0ID0gcmVhZGVyLnJlYWRJbnQoMik7XG4gICAgICAgIHRoaXMuaW50ZXJuYWxGaWxlQXR0cmlidXRlcyA9IHJlYWRlci5yZWFkSW50KDIpO1xuICAgICAgICB0aGlzLmV4dGVybmFsRmlsZUF0dHJpYnV0ZXMgPSByZWFkZXIucmVhZEludCg0KTtcbiAgICAgICAgdGhpcy5sb2NhbEhlYWRlck9mZnNldCA9IHJlYWRlci5yZWFkSW50KDQpO1xuXG4gICAgICAgIGlmICh0aGlzLmlzRW5jcnlwdGVkKCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkVuY3J5cHRlZCB6aXAgYXJlIG5vdCBzdXBwb3J0ZWRcIik7XG4gICAgICAgIH1cblxuICAgICAgICAvLyB3aWxsIGJlIHJlYWQgaW4gdGhlIGxvY2FsIHBhcnQsIHNlZSB0aGUgY29tbWVudHMgdGhlcmVcbiAgICAgICAgcmVhZGVyLnNraXAoZmlsZU5hbWVMZW5ndGgpO1xuICAgICAgICB0aGlzLnJlYWRFeHRyYUZpZWxkcyhyZWFkZXIpO1xuICAgICAgICB0aGlzLnBhcnNlWklQNjRFeHRyYUZpZWxkKHJlYWRlcik7XG4gICAgICAgIHRoaXMuZmlsZUNvbW1lbnQgPSByZWFkZXIucmVhZERhdGEodGhpcy5maWxlQ29tbWVudExlbmd0aCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFBhcnNlIHRoZSBleHRlcm5hbCBmaWxlIGF0dHJpYnV0ZXMgYW5kIGdldCB0aGUgdW5peC9kb3MgcGVybWlzc2lvbnMuXG4gICAgICovXG4gICAgcHJvY2Vzc0F0dHJpYnV0ZXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy51bml4UGVybWlzc2lvbnMgPSBudWxsO1xuICAgICAgICB0aGlzLmRvc1Blcm1pc3Npb25zID0gbnVsbDtcbiAgICAgICAgdmFyIG1hZGVCeSA9IHRoaXMudmVyc2lvbk1hZGVCeSA+PiA4O1xuXG4gICAgICAgIC8vIENoZWNrIGlmIHdlIGhhdmUgdGhlIERPUyBkaXJlY3RvcnkgZmxhZyBzZXQuXG4gICAgICAgIC8vIFdlIGxvb2sgZm9yIGl0IGluIHRoZSBET1MgYW5kIFVOSVggcGVybWlzc2lvbnNcbiAgICAgICAgLy8gYnV0IHNvbWUgdW5rbm93biBwbGF0Zm9ybSBjb3VsZCBzZXQgaXQgYXMgYSBjb21wYXRpYmlsaXR5IGZsYWcuXG4gICAgICAgIHRoaXMuZGlyID0gdGhpcy5leHRlcm5hbEZpbGVBdHRyaWJ1dGVzICYgMHgwMDEwID8gdHJ1ZSA6IGZhbHNlO1xuXG4gICAgICAgIGlmKG1hZGVCeSA9PT0gTUFERV9CWV9ET1MpIHtcbiAgICAgICAgICAgIC8vIGZpcnN0IDYgYml0cyAoMCB0byA1KVxuICAgICAgICAgICAgdGhpcy5kb3NQZXJtaXNzaW9ucyA9IHRoaXMuZXh0ZXJuYWxGaWxlQXR0cmlidXRlcyAmIDB4M0Y7XG4gICAgICAgIH1cblxuICAgICAgICBpZihtYWRlQnkgPT09IE1BREVfQllfVU5JWCkge1xuICAgICAgICAgICAgdGhpcy51bml4UGVybWlzc2lvbnMgPSAodGhpcy5leHRlcm5hbEZpbGVBdHRyaWJ1dGVzID4+IDE2KSAmIDB4RkZGRjtcbiAgICAgICAgICAgIC8vIHRoZSBvY3RhbCBwZXJtaXNzaW9ucyBhcmUgaW4gKHRoaXMudW5peFBlcm1pc3Npb25zICYgMHgwMUZGKS50b1N0cmluZyg4KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGZhaWwgc2FmZSA6IGlmIHRoZSBuYW1lIGVuZHMgd2l0aCBhIC8gaXQgcHJvYmFibHkgbWVhbnMgYSBmb2xkZXJcbiAgICAgICAgaWYgKCF0aGlzLmRpciAmJiB0aGlzLmZpbGVOYW1lU3RyLnNsaWNlKC0xKSA9PT0gXCIvXCIpIHtcbiAgICAgICAgICAgIHRoaXMuZGlyID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBQYXJzZSB0aGUgWklQNjQgZXh0cmEgZmllbGQgYW5kIG1lcmdlIHRoZSBpbmZvIGluIHRoZSBjdXJyZW50IFppcEVudHJ5LlxuICAgICAqIEBwYXJhbSB7RGF0YVJlYWRlcn0gcmVhZGVyIHRoZSByZWFkZXIgdG8gdXNlLlxuICAgICAqL1xuICAgIHBhcnNlWklQNjRFeHRyYUZpZWxkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLmV4dHJhRmllbGRzWzB4MDAwMV0pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHNob3VsZCBiZSBzb21ldGhpbmcsIHByZXBhcmluZyB0aGUgZXh0cmEgcmVhZGVyXG4gICAgICAgIHZhciBleHRyYVJlYWRlciA9IHJlYWRlckZvcih0aGlzLmV4dHJhRmllbGRzWzB4MDAwMV0udmFsdWUpO1xuXG4gICAgICAgIC8vIEkgcmVhbGx5IGhvcGUgdGhhdCB0aGVzZSA2NGJpdHMgaW50ZWdlciBjYW4gZml0IGluIDMyIGJpdHMgaW50ZWdlciwgYmVjYXVzZSBqc1xuICAgICAgICAvLyB3b24ndCBsZXQgdXMgaGF2ZSBtb3JlLlxuICAgICAgICBpZiAodGhpcy51bmNvbXByZXNzZWRTaXplID09PSB1dGlscy5NQVhfVkFMVUVfMzJCSVRTKSB7XG4gICAgICAgICAgICB0aGlzLnVuY29tcHJlc3NlZFNpemUgPSBleHRyYVJlYWRlci5yZWFkSW50KDgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmNvbXByZXNzZWRTaXplID09PSB1dGlscy5NQVhfVkFMVUVfMzJCSVRTKSB7XG4gICAgICAgICAgICB0aGlzLmNvbXByZXNzZWRTaXplID0gZXh0cmFSZWFkZXIucmVhZEludCg4KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5sb2NhbEhlYWRlck9mZnNldCA9PT0gdXRpbHMuTUFYX1ZBTFVFXzMyQklUUykge1xuICAgICAgICAgICAgdGhpcy5sb2NhbEhlYWRlck9mZnNldCA9IGV4dHJhUmVhZGVyLnJlYWRJbnQoOCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuZGlza051bWJlclN0YXJ0ID09PSB1dGlscy5NQVhfVkFMVUVfMzJCSVRTKSB7XG4gICAgICAgICAgICB0aGlzLmRpc2tOdW1iZXJTdGFydCA9IGV4dHJhUmVhZGVyLnJlYWRJbnQoNCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIFJlYWQgdGhlIGNlbnRyYWwgcGFydCBvZiBhIHppcCBmaWxlIGFuZCBhZGQgdGhlIGluZm8gaW4gdGhpcyBvYmplY3QuXG4gICAgICogQHBhcmFtIHtEYXRhUmVhZGVyfSByZWFkZXIgdGhlIHJlYWRlciB0byB1c2UuXG4gICAgICovXG4gICAgcmVhZEV4dHJhRmllbGRzOiBmdW5jdGlvbihyZWFkZXIpIHtcbiAgICAgICAgdmFyIGVuZCA9IHJlYWRlci5pbmRleCArIHRoaXMuZXh0cmFGaWVsZHNMZW5ndGgsXG4gICAgICAgICAgICBleHRyYUZpZWxkSWQsXG4gICAgICAgICAgICBleHRyYUZpZWxkTGVuZ3RoLFxuICAgICAgICAgICAgZXh0cmFGaWVsZFZhbHVlO1xuXG4gICAgICAgIGlmICghdGhpcy5leHRyYUZpZWxkcykge1xuICAgICAgICAgICAgdGhpcy5leHRyYUZpZWxkcyA9IHt9O1xuICAgICAgICB9XG5cbiAgICAgICAgd2hpbGUgKHJlYWRlci5pbmRleCArIDQgPCBlbmQpIHtcbiAgICAgICAgICAgIGV4dHJhRmllbGRJZCA9IHJlYWRlci5yZWFkSW50KDIpO1xuICAgICAgICAgICAgZXh0cmFGaWVsZExlbmd0aCA9IHJlYWRlci5yZWFkSW50KDIpO1xuICAgICAgICAgICAgZXh0cmFGaWVsZFZhbHVlID0gcmVhZGVyLnJlYWREYXRhKGV4dHJhRmllbGRMZW5ndGgpO1xuXG4gICAgICAgICAgICB0aGlzLmV4dHJhRmllbGRzW2V4dHJhRmllbGRJZF0gPSB7XG4gICAgICAgICAgICAgICAgaWQ6IGV4dHJhRmllbGRJZCxcbiAgICAgICAgICAgICAgICBsZW5ndGg6IGV4dHJhRmllbGRMZW5ndGgsXG4gICAgICAgICAgICAgICAgdmFsdWU6IGV4dHJhRmllbGRWYWx1ZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlYWRlci5zZXRJbmRleChlbmQpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogQXBwbHkgYW4gVVRGOCB0cmFuc2Zvcm1hdGlvbiBpZiBuZWVkZWQuXG4gICAgICovXG4gICAgaGFuZGxlVVRGODogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBkZWNvZGVQYXJhbVR5cGUgPSBzdXBwb3J0LnVpbnQ4YXJyYXkgPyBcInVpbnQ4YXJyYXlcIiA6IFwiYXJyYXlcIjtcbiAgICAgICAgaWYgKHRoaXMudXNlVVRGOCgpKSB7XG4gICAgICAgICAgICB0aGlzLmZpbGVOYW1lU3RyID0gdXRmOC51dGY4ZGVjb2RlKHRoaXMuZmlsZU5hbWUpO1xuICAgICAgICAgICAgdGhpcy5maWxlQ29tbWVudFN0ciA9IHV0ZjgudXRmOGRlY29kZSh0aGlzLmZpbGVDb21tZW50KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciB1cGF0aCA9IHRoaXMuZmluZEV4dHJhRmllbGRVbmljb2RlUGF0aCgpO1xuICAgICAgICAgICAgaWYgKHVwYXRoICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5maWxlTmFtZVN0ciA9IHVwYXRoO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBBU0NJSSB0ZXh0IG9yIHVuc3VwcG9ydGVkIGNvZGUgcGFnZVxuICAgICAgICAgICAgICAgIHZhciBmaWxlTmFtZUJ5dGVBcnJheSA9ICB1dGlscy50cmFuc2Zvcm1UbyhkZWNvZGVQYXJhbVR5cGUsIHRoaXMuZmlsZU5hbWUpO1xuICAgICAgICAgICAgICAgIHRoaXMuZmlsZU5hbWVTdHIgPSB0aGlzLmxvYWRPcHRpb25zLmRlY29kZUZpbGVOYW1lKGZpbGVOYW1lQnl0ZUFycmF5KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHVjb21tZW50ID0gdGhpcy5maW5kRXh0cmFGaWVsZFVuaWNvZGVDb21tZW50KCk7XG4gICAgICAgICAgICBpZiAodWNvbW1lbnQgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZpbGVDb21tZW50U3RyID0gdWNvbW1lbnQ7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIEFTQ0lJIHRleHQgb3IgdW5zdXBwb3J0ZWQgY29kZSBwYWdlXG4gICAgICAgICAgICAgICAgdmFyIGNvbW1lbnRCeXRlQXJyYXkgPSAgdXRpbHMudHJhbnNmb3JtVG8oZGVjb2RlUGFyYW1UeXBlLCB0aGlzLmZpbGVDb21tZW50KTtcbiAgICAgICAgICAgICAgICB0aGlzLmZpbGVDb21tZW50U3RyID0gdGhpcy5sb2FkT3B0aW9ucy5kZWNvZGVGaWxlTmFtZShjb21tZW50Qnl0ZUFycmF5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBGaW5kIHRoZSB1bmljb2RlIHBhdGggZGVjbGFyZWQgaW4gdGhlIGV4dHJhIGZpZWxkLCBpZiBhbnkuXG4gICAgICogQHJldHVybiB7U3RyaW5nfSB0aGUgdW5pY29kZSBwYXRoLCBudWxsIG90aGVyd2lzZS5cbiAgICAgKi9cbiAgICBmaW5kRXh0cmFGaWVsZFVuaWNvZGVQYXRoOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHVwYXRoRmllbGQgPSB0aGlzLmV4dHJhRmllbGRzWzB4NzA3NV07XG4gICAgICAgIGlmICh1cGF0aEZpZWxkKSB7XG4gICAgICAgICAgICB2YXIgZXh0cmFSZWFkZXIgPSByZWFkZXJGb3IodXBhdGhGaWVsZC52YWx1ZSk7XG5cbiAgICAgICAgICAgIC8vIHdyb25nIHZlcnNpb25cbiAgICAgICAgICAgIGlmIChleHRyYVJlYWRlci5yZWFkSW50KDEpICE9PSAxKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHRoZSBjcmMgb2YgdGhlIGZpbGVuYW1lIGNoYW5nZWQsIHRoaXMgZmllbGQgaXMgb3V0IG9mIGRhdGUuXG4gICAgICAgICAgICBpZiAoY3JjMzJmbih0aGlzLmZpbGVOYW1lKSAhPT0gZXh0cmFSZWFkZXIucmVhZEludCg0KSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdXRmOC51dGY4ZGVjb2RlKGV4dHJhUmVhZGVyLnJlYWREYXRhKHVwYXRoRmllbGQubGVuZ3RoIC0gNSkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBGaW5kIHRoZSB1bmljb2RlIGNvbW1lbnQgZGVjbGFyZWQgaW4gdGhlIGV4dHJhIGZpZWxkLCBpZiBhbnkuXG4gICAgICogQHJldHVybiB7U3RyaW5nfSB0aGUgdW5pY29kZSBjb21tZW50LCBudWxsIG90aGVyd2lzZS5cbiAgICAgKi9cbiAgICBmaW5kRXh0cmFGaWVsZFVuaWNvZGVDb21tZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHVjb21tZW50RmllbGQgPSB0aGlzLmV4dHJhRmllbGRzWzB4NjM3NV07XG4gICAgICAgIGlmICh1Y29tbWVudEZpZWxkKSB7XG4gICAgICAgICAgICB2YXIgZXh0cmFSZWFkZXIgPSByZWFkZXJGb3IodWNvbW1lbnRGaWVsZC52YWx1ZSk7XG5cbiAgICAgICAgICAgIC8vIHdyb25nIHZlcnNpb25cbiAgICAgICAgICAgIGlmIChleHRyYVJlYWRlci5yZWFkSW50KDEpICE9PSAxKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHRoZSBjcmMgb2YgdGhlIGNvbW1lbnQgY2hhbmdlZCwgdGhpcyBmaWVsZCBpcyBvdXQgb2YgZGF0ZS5cbiAgICAgICAgICAgIGlmIChjcmMzMmZuKHRoaXMuZmlsZUNvbW1lbnQpICE9PSBleHRyYVJlYWRlci5yZWFkSW50KDQpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB1dGY4LnV0ZjhkZWNvZGUoZXh0cmFSZWFkZXIucmVhZERhdGEodWNvbW1lbnRGaWVsZC5sZW5ndGggLSA1KSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcbm1vZHVsZS5leHBvcnRzID0gWmlwRW50cnk7XG5cbn0se1wiLi9jb21wcmVzc2VkT2JqZWN0XCI6MixcIi4vY29tcHJlc3Npb25zXCI6MyxcIi4vY3JjMzJcIjo0LFwiLi9yZWFkZXIvcmVhZGVyRm9yXCI6MjIsXCIuL3N1cHBvcnRcIjozMCxcIi4vdXRmOFwiOjMxLFwiLi91dGlsc1wiOjMyfV0sMzU6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXG52YXIgU3RyZWFtSGVscGVyID0gcmVxdWlyZShcIi4vc3RyZWFtL1N0cmVhbUhlbHBlclwiKTtcbnZhciBEYXRhV29ya2VyID0gcmVxdWlyZShcIi4vc3RyZWFtL0RhdGFXb3JrZXJcIik7XG52YXIgdXRmOCA9IHJlcXVpcmUoXCIuL3V0ZjhcIik7XG52YXIgQ29tcHJlc3NlZE9iamVjdCA9IHJlcXVpcmUoXCIuL2NvbXByZXNzZWRPYmplY3RcIik7XG52YXIgR2VuZXJpY1dvcmtlciA9IHJlcXVpcmUoXCIuL3N0cmVhbS9HZW5lcmljV29ya2VyXCIpO1xuXG4vKipcbiAqIEEgc2ltcGxlIG9iamVjdCByZXByZXNlbnRpbmcgYSBmaWxlIGluIHRoZSB6aXAgZmlsZS5cbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgdGhlIG5hbWUgb2YgdGhlIGZpbGVcbiAqIEBwYXJhbSB7U3RyaW5nfEFycmF5QnVmZmVyfFVpbnQ4QXJyYXl8QnVmZmVyfSBkYXRhIHRoZSBkYXRhXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyB0aGUgb3B0aW9ucyBvZiB0aGUgZmlsZVxuICovXG52YXIgWmlwT2JqZWN0ID0gZnVuY3Rpb24obmFtZSwgZGF0YSwgb3B0aW9ucykge1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgdGhpcy5kaXIgPSBvcHRpb25zLmRpcjtcbiAgICB0aGlzLmRhdGUgPSBvcHRpb25zLmRhdGU7XG4gICAgdGhpcy5jb21tZW50ID0gb3B0aW9ucy5jb21tZW50O1xuICAgIHRoaXMudW5peFBlcm1pc3Npb25zID0gb3B0aW9ucy51bml4UGVybWlzc2lvbnM7XG4gICAgdGhpcy5kb3NQZXJtaXNzaW9ucyA9IG9wdGlvbnMuZG9zUGVybWlzc2lvbnM7XG5cbiAgICB0aGlzLl9kYXRhID0gZGF0YTtcbiAgICB0aGlzLl9kYXRhQmluYXJ5ID0gb3B0aW9ucy5iaW5hcnk7XG4gICAgLy8ga2VlcCBvbmx5IHRoZSBjb21wcmVzc2lvblxuICAgIHRoaXMub3B0aW9ucyA9IHtcbiAgICAgICAgY29tcHJlc3Npb24gOiBvcHRpb25zLmNvbXByZXNzaW9uLFxuICAgICAgICBjb21wcmVzc2lvbk9wdGlvbnMgOiBvcHRpb25zLmNvbXByZXNzaW9uT3B0aW9uc1xuICAgIH07XG59O1xuXG5aaXBPYmplY3QucHJvdG90eXBlID0ge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhbiBpbnRlcm5hbCBzdHJlYW0gZm9yIHRoZSBjb250ZW50IG9mIHRoaXMgb2JqZWN0LlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlIHRoZSB0eXBlIG9mIGVhY2ggY2h1bmsuXG4gICAgICogQHJldHVybiBTdHJlYW1IZWxwZXIgdGhlIHN0cmVhbS5cbiAgICAgKi9cbiAgICBpbnRlcm5hbFN0cmVhbTogZnVuY3Rpb24gKHR5cGUpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IG51bGwsIG91dHB1dFR5cGUgPSBcInN0cmluZ1wiO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKCF0eXBlKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gb3V0cHV0IHR5cGUgc3BlY2lmaWVkLlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG91dHB1dFR5cGUgPSB0eXBlLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICB2YXIgYXNrVW5pY29kZVN0cmluZyA9IG91dHB1dFR5cGUgPT09IFwic3RyaW5nXCIgfHwgb3V0cHV0VHlwZSA9PT0gXCJ0ZXh0XCI7XG4gICAgICAgICAgICBpZiAob3V0cHV0VHlwZSA9PT0gXCJiaW5hcnlzdHJpbmdcIiB8fCBvdXRwdXRUeXBlID09PSBcInRleHRcIikge1xuICAgICAgICAgICAgICAgIG91dHB1dFR5cGUgPSBcInN0cmluZ1wiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzdWx0ID0gdGhpcy5fZGVjb21wcmVzc1dvcmtlcigpO1xuXG4gICAgICAgICAgICB2YXIgaXNVbmljb2RlU3RyaW5nID0gIXRoaXMuX2RhdGFCaW5hcnk7XG5cbiAgICAgICAgICAgIGlmIChpc1VuaWNvZGVTdHJpbmcgJiYgIWFza1VuaWNvZGVTdHJpbmcpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSByZXN1bHQucGlwZShuZXcgdXRmOC5VdGY4RW5jb2RlV29ya2VyKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFpc1VuaWNvZGVTdHJpbmcgJiYgYXNrVW5pY29kZVN0cmluZykge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdC5waXBlKG5ldyB1dGY4LlV0ZjhEZWNvZGVXb3JrZXIoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IG5ldyBHZW5lcmljV29ya2VyKFwiZXJyb3JcIik7XG4gICAgICAgICAgICByZXN1bHQuZXJyb3IoZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IFN0cmVhbUhlbHBlcihyZXN1bHQsIG91dHB1dFR5cGUsIFwiXCIpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBQcmVwYXJlIHRoZSBjb250ZW50IGluIHRoZSBhc2tlZCB0eXBlLlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlIHRoZSB0eXBlIG9mIHRoZSByZXN1bHQuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gb25VcGRhdGUgYSBmdW5jdGlvbiB0byBjYWxsIG9uIGVhY2ggaW50ZXJuYWwgdXBkYXRlLlxuICAgICAqIEByZXR1cm4gUHJvbWlzZSB0aGUgcHJvbWlzZSBvZiB0aGUgcmVzdWx0LlxuICAgICAqL1xuICAgIGFzeW5jOiBmdW5jdGlvbiAodHlwZSwgb25VcGRhdGUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaW50ZXJuYWxTdHJlYW0odHlwZSkuYWNjdW11bGF0ZShvblVwZGF0ZSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFByZXBhcmUgdGhlIGNvbnRlbnQgYXMgYSBub2RlanMgc3RyZWFtLlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlIHRoZSB0eXBlIG9mIGVhY2ggY2h1bmsuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gb25VcGRhdGUgYSBmdW5jdGlvbiB0byBjYWxsIG9uIGVhY2ggaW50ZXJuYWwgdXBkYXRlLlxuICAgICAqIEByZXR1cm4gU3RyZWFtIHRoZSBzdHJlYW0uXG4gICAgICovXG4gICAgbm9kZVN0cmVhbTogZnVuY3Rpb24gKHR5cGUsIG9uVXBkYXRlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmludGVybmFsU3RyZWFtKHR5cGUgfHwgXCJub2RlYnVmZmVyXCIpLnRvTm9kZWpzU3RyZWFtKG9uVXBkYXRlKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIGEgd29ya2VyIGZvciB0aGUgY29tcHJlc3NlZCBjb250ZW50LlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGNvbXByZXNzaW9uIHRoZSBjb21wcmVzc2lvbiBvYmplY3QgdG8gdXNlLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjb21wcmVzc2lvbk9wdGlvbnMgdGhlIG9wdGlvbnMgdG8gdXNlIHdoZW4gY29tcHJlc3NpbmcuXG4gICAgICogQHJldHVybiBXb3JrZXIgdGhlIHdvcmtlci5cbiAgICAgKi9cbiAgICBfY29tcHJlc3NXb3JrZXI6IGZ1bmN0aW9uIChjb21wcmVzc2lvbiwgY29tcHJlc3Npb25PcHRpb25zKSB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIHRoaXMuX2RhdGEgaW5zdGFuY2VvZiBDb21wcmVzc2VkT2JqZWN0ICYmXG4gICAgICAgICAgICB0aGlzLl9kYXRhLmNvbXByZXNzaW9uLm1hZ2ljID09PSBjb21wcmVzc2lvbi5tYWdpY1xuICAgICAgICApIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9kYXRhLmdldENvbXByZXNzZWRXb3JrZXIoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSB0aGlzLl9kZWNvbXByZXNzV29ya2VyKCk7XG4gICAgICAgICAgICBpZighdGhpcy5fZGF0YUJpbmFyeSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdC5waXBlKG5ldyB1dGY4LlV0ZjhFbmNvZGVXb3JrZXIoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gQ29tcHJlc3NlZE9iamVjdC5jcmVhdGVXb3JrZXJGcm9tKHJlc3VsdCwgY29tcHJlc3Npb24sIGNvbXByZXNzaW9uT3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIFJldHVybiBhIHdvcmtlciBmb3IgdGhlIGRlY29tcHJlc3NlZCBjb250ZW50LlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHJldHVybiBXb3JrZXIgdGhlIHdvcmtlci5cbiAgICAgKi9cbiAgICBfZGVjb21wcmVzc1dvcmtlciA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuX2RhdGEgaW5zdGFuY2VvZiBDb21wcmVzc2VkT2JqZWN0KSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fZGF0YS5nZXRDb250ZW50V29ya2VyKCk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5fZGF0YSBpbnN0YW5jZW9mIEdlbmVyaWNXb3JrZXIpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9kYXRhO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBEYXRhV29ya2VyKHRoaXMuX2RhdGEpO1xuICAgICAgICB9XG4gICAgfVxufTtcblxudmFyIHJlbW92ZWRNZXRob2RzID0gW1wiYXNUZXh0XCIsIFwiYXNCaW5hcnlcIiwgXCJhc05vZGVCdWZmZXJcIiwgXCJhc1VpbnQ4QXJyYXlcIiwgXCJhc0FycmF5QnVmZmVyXCJdO1xudmFyIHJlbW92ZWRGbiA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGlzIG1ldGhvZCBoYXMgYmVlbiByZW1vdmVkIGluIEpTWmlwIDMuMCwgcGxlYXNlIGNoZWNrIHRoZSB1cGdyYWRlIGd1aWRlLlwiKTtcbn07XG5cbmZvcih2YXIgaSA9IDA7IGkgPCByZW1vdmVkTWV0aG9kcy5sZW5ndGg7IGkrKykge1xuICAgIFppcE9iamVjdC5wcm90b3R5cGVbcmVtb3ZlZE1ldGhvZHNbaV1dID0gcmVtb3ZlZEZuO1xufVxubW9kdWxlLmV4cG9ydHMgPSBaaXBPYmplY3Q7XG5cbn0se1wiLi9jb21wcmVzc2VkT2JqZWN0XCI6MixcIi4vc3RyZWFtL0RhdGFXb3JrZXJcIjoyNyxcIi4vc3RyZWFtL0dlbmVyaWNXb3JrZXJcIjoyOCxcIi4vc3RyZWFtL1N0cmVhbUhlbHBlclwiOjI5LFwiLi91dGY4XCI6MzF9XSwzNjpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4oZnVuY3Rpb24gKGdsb2JhbCl7XG52YXIgTXV0YXRpb24gPSBnbG9iYWwuTXV0YXRpb25PYnNlcnZlciB8fCBnbG9iYWwuV2ViS2l0TXV0YXRpb25PYnNlcnZlcjtcblxudmFyIHNjaGVkdWxlRHJhaW47XG5cbntcbiAgaWYgKE11dGF0aW9uKSB7XG4gICAgdmFyIGNhbGxlZCA9IDA7XG4gICAgdmFyIG9ic2VydmVyID0gbmV3IE11dGF0aW9uKG5leHRUaWNrKTtcbiAgICB2YXIgZWxlbWVudCA9IGdsb2JhbC5kb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSgnJyk7XG4gICAgb2JzZXJ2ZXIub2JzZXJ2ZShlbGVtZW50LCB7XG4gICAgICBjaGFyYWN0ZXJEYXRhOiB0cnVlXG4gICAgfSk7XG4gICAgc2NoZWR1bGVEcmFpbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGVsZW1lbnQuZGF0YSA9IChjYWxsZWQgPSArK2NhbGxlZCAlIDIpO1xuICAgIH07XG4gIH0gZWxzZSBpZiAoIWdsb2JhbC5zZXRJbW1lZGlhdGUgJiYgdHlwZW9mIGdsb2JhbC5NZXNzYWdlQ2hhbm5lbCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICB2YXIgY2hhbm5lbCA9IG5ldyBnbG9iYWwuTWVzc2FnZUNoYW5uZWwoKTtcbiAgICBjaGFubmVsLnBvcnQxLm9ubWVzc2FnZSA9IG5leHRUaWNrO1xuICAgIHNjaGVkdWxlRHJhaW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICBjaGFubmVsLnBvcnQyLnBvc3RNZXNzYWdlKDApO1xuICAgIH07XG4gIH0gZWxzZSBpZiAoJ2RvY3VtZW50JyBpbiBnbG9iYWwgJiYgJ29ucmVhZHlzdGF0ZWNoYW5nZScgaW4gZ2xvYmFsLmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpKSB7XG4gICAgc2NoZWR1bGVEcmFpbiA9IGZ1bmN0aW9uICgpIHtcblxuICAgICAgLy8gQ3JlYXRlIGEgPHNjcmlwdD4gZWxlbWVudDsgaXRzIHJlYWR5c3RhdGVjaGFuZ2UgZXZlbnQgd2lsbCBiZSBmaXJlZCBhc3luY2hyb25vdXNseSBvbmNlIGl0IGlzIGluc2VydGVkXG4gICAgICAvLyBpbnRvIHRoZSBkb2N1bWVudC4gRG8gc28sIHRodXMgcXVldWluZyB1cCB0aGUgdGFzay4gUmVtZW1iZXIgdG8gY2xlYW4gdXAgb25jZSBpdCdzIGJlZW4gY2FsbGVkLlxuICAgICAgdmFyIHNjcmlwdEVsID0gZ2xvYmFsLmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICAgICAgc2NyaXB0RWwub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBuZXh0VGljaygpO1xuXG4gICAgICAgIHNjcmlwdEVsLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IG51bGw7XG4gICAgICAgIHNjcmlwdEVsLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoc2NyaXB0RWwpO1xuICAgICAgICBzY3JpcHRFbCA9IG51bGw7XG4gICAgICB9O1xuICAgICAgZ2xvYmFsLmRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5hcHBlbmRDaGlsZChzY3JpcHRFbCk7XG4gICAgfTtcbiAgfSBlbHNlIHtcbiAgICBzY2hlZHVsZURyYWluID0gZnVuY3Rpb24gKCkge1xuICAgICAgc2V0VGltZW91dChuZXh0VGljaywgMCk7XG4gICAgfTtcbiAgfVxufVxuXG52YXIgZHJhaW5pbmc7XG52YXIgcXVldWUgPSBbXTtcbi8vbmFtZWQgbmV4dFRpY2sgZm9yIGxlc3MgY29uZnVzaW5nIHN0YWNrIHRyYWNlc1xuZnVuY3Rpb24gbmV4dFRpY2soKSB7XG4gIGRyYWluaW5nID0gdHJ1ZTtcbiAgdmFyIGksIG9sZFF1ZXVlO1xuICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICB3aGlsZSAobGVuKSB7XG4gICAgb2xkUXVldWUgPSBxdWV1ZTtcbiAgICBxdWV1ZSA9IFtdO1xuICAgIGkgPSAtMTtcbiAgICB3aGlsZSAoKytpIDwgbGVuKSB7XG4gICAgICBvbGRRdWV1ZVtpXSgpO1xuICAgIH1cbiAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gIH1cbiAgZHJhaW5pbmcgPSBmYWxzZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpbW1lZGlhdGU7XG5mdW5jdGlvbiBpbW1lZGlhdGUodGFzaykge1xuICBpZiAocXVldWUucHVzaCh0YXNrKSA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICBzY2hlZHVsZURyYWluKCk7XG4gIH1cbn1cblxufSkuY2FsbCh0aGlzLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pO1xufSx7fV0sMzc6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xudmFyIGltbWVkaWF0ZSA9IHJlcXVpcmUoJ2ltbWVkaWF0ZScpO1xuXG4vKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuZnVuY3Rpb24gSU5URVJOQUwoKSB7fVxuXG52YXIgaGFuZGxlcnMgPSB7fTtcblxudmFyIFJFSkVDVEVEID0gWydSRUpFQ1RFRCddO1xudmFyIEZVTEZJTExFRCA9IFsnRlVMRklMTEVEJ107XG52YXIgUEVORElORyA9IFsnUEVORElORyddO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFByb21pc2U7XG5cbmZ1bmN0aW9uIFByb21pc2UocmVzb2x2ZXIpIHtcbiAgaWYgKHR5cGVvZiByZXNvbHZlciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ3Jlc29sdmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuICB9XG4gIHRoaXMuc3RhdGUgPSBQRU5ESU5HO1xuICB0aGlzLnF1ZXVlID0gW107XG4gIHRoaXMub3V0Y29tZSA9IHZvaWQgMDtcbiAgaWYgKHJlc29sdmVyICE9PSBJTlRFUk5BTCkge1xuICAgIHNhZmVseVJlc29sdmVUaGVuYWJsZSh0aGlzLCByZXNvbHZlcik7XG4gIH1cbn1cblxuUHJvbWlzZS5wcm90b3R5cGVbXCJmaW5hbGx5XCJdID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICB2YXIgcCA9IHRoaXMuY29uc3RydWN0b3I7XG4gIHJldHVybiB0aGlzLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcblxuICBmdW5jdGlvbiByZXNvbHZlKHZhbHVlKSB7XG4gICAgZnVuY3Rpb24geWVzICgpIHtcbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gICAgcmV0dXJuIHAucmVzb2x2ZShjYWxsYmFjaygpKS50aGVuKHllcyk7XG4gIH1cbiAgZnVuY3Rpb24gcmVqZWN0KHJlYXNvbikge1xuICAgIGZ1bmN0aW9uIG5vICgpIHtcbiAgICAgIHRocm93IHJlYXNvbjtcbiAgICB9XG4gICAgcmV0dXJuIHAucmVzb2x2ZShjYWxsYmFjaygpKS50aGVuKG5vKTtcbiAgfVxufTtcblByb21pc2UucHJvdG90eXBlW1wiY2F0Y2hcIl0gPSBmdW5jdGlvbiAob25SZWplY3RlZCkge1xuICByZXR1cm4gdGhpcy50aGVuKG51bGwsIG9uUmVqZWN0ZWQpO1xufTtcblByb21pc2UucHJvdG90eXBlLnRoZW4gPSBmdW5jdGlvbiAob25GdWxmaWxsZWQsIG9uUmVqZWN0ZWQpIHtcbiAgaWYgKHR5cGVvZiBvbkZ1bGZpbGxlZCAhPT0gJ2Z1bmN0aW9uJyAmJiB0aGlzLnN0YXRlID09PSBGVUxGSUxMRUQgfHxcbiAgICB0eXBlb2Ygb25SZWplY3RlZCAhPT0gJ2Z1bmN0aW9uJyAmJiB0aGlzLnN0YXRlID09PSBSRUpFQ1RFRCkge1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIHZhciBwcm9taXNlID0gbmV3IHRoaXMuY29uc3RydWN0b3IoSU5URVJOQUwpO1xuICBpZiAodGhpcy5zdGF0ZSAhPT0gUEVORElORykge1xuICAgIHZhciByZXNvbHZlciA9IHRoaXMuc3RhdGUgPT09IEZVTEZJTExFRCA/IG9uRnVsZmlsbGVkIDogb25SZWplY3RlZDtcbiAgICB1bndyYXAocHJvbWlzZSwgcmVzb2x2ZXIsIHRoaXMub3V0Y29tZSk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5xdWV1ZS5wdXNoKG5ldyBRdWV1ZUl0ZW0ocHJvbWlzZSwgb25GdWxmaWxsZWQsIG9uUmVqZWN0ZWQpKTtcbiAgfVxuXG4gIHJldHVybiBwcm9taXNlO1xufTtcbmZ1bmN0aW9uIFF1ZXVlSXRlbShwcm9taXNlLCBvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCkge1xuICB0aGlzLnByb21pc2UgPSBwcm9taXNlO1xuICBpZiAodHlwZW9mIG9uRnVsZmlsbGVkID09PSAnZnVuY3Rpb24nKSB7XG4gICAgdGhpcy5vbkZ1bGZpbGxlZCA9IG9uRnVsZmlsbGVkO1xuICAgIHRoaXMuY2FsbEZ1bGZpbGxlZCA9IHRoaXMub3RoZXJDYWxsRnVsZmlsbGVkO1xuICB9XG4gIGlmICh0eXBlb2Ygb25SZWplY3RlZCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHRoaXMub25SZWplY3RlZCA9IG9uUmVqZWN0ZWQ7XG4gICAgdGhpcy5jYWxsUmVqZWN0ZWQgPSB0aGlzLm90aGVyQ2FsbFJlamVjdGVkO1xuICB9XG59XG5RdWV1ZUl0ZW0ucHJvdG90eXBlLmNhbGxGdWxmaWxsZWQgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgaGFuZGxlcnMucmVzb2x2ZSh0aGlzLnByb21pc2UsIHZhbHVlKTtcbn07XG5RdWV1ZUl0ZW0ucHJvdG90eXBlLm90aGVyQ2FsbEZ1bGZpbGxlZCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICB1bndyYXAodGhpcy5wcm9taXNlLCB0aGlzLm9uRnVsZmlsbGVkLCB2YWx1ZSk7XG59O1xuUXVldWVJdGVtLnByb3RvdHlwZS5jYWxsUmVqZWN0ZWQgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgaGFuZGxlcnMucmVqZWN0KHRoaXMucHJvbWlzZSwgdmFsdWUpO1xufTtcblF1ZXVlSXRlbS5wcm90b3R5cGUub3RoZXJDYWxsUmVqZWN0ZWQgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgdW53cmFwKHRoaXMucHJvbWlzZSwgdGhpcy5vblJlamVjdGVkLCB2YWx1ZSk7XG59O1xuXG5mdW5jdGlvbiB1bndyYXAocHJvbWlzZSwgZnVuYywgdmFsdWUpIHtcbiAgaW1tZWRpYXRlKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcmV0dXJuVmFsdWU7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVyblZhbHVlID0gZnVuYyh2YWx1ZSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcmV0dXJuIGhhbmRsZXJzLnJlamVjdChwcm9taXNlLCBlKTtcbiAgICB9XG4gICAgaWYgKHJldHVyblZhbHVlID09PSBwcm9taXNlKSB7XG4gICAgICBoYW5kbGVycy5yZWplY3QocHJvbWlzZSwgbmV3IFR5cGVFcnJvcignQ2Fubm90IHJlc29sdmUgcHJvbWlzZSB3aXRoIGl0c2VsZicpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaGFuZGxlcnMucmVzb2x2ZShwcm9taXNlLCByZXR1cm5WYWx1ZSk7XG4gICAgfVxuICB9KTtcbn1cblxuaGFuZGxlcnMucmVzb2x2ZSA9IGZ1bmN0aW9uIChzZWxmLCB2YWx1ZSkge1xuICB2YXIgcmVzdWx0ID0gdHJ5Q2F0Y2goZ2V0VGhlbiwgdmFsdWUpO1xuICBpZiAocmVzdWx0LnN0YXR1cyA9PT0gJ2Vycm9yJykge1xuICAgIHJldHVybiBoYW5kbGVycy5yZWplY3Qoc2VsZiwgcmVzdWx0LnZhbHVlKTtcbiAgfVxuICB2YXIgdGhlbmFibGUgPSByZXN1bHQudmFsdWU7XG5cbiAgaWYgKHRoZW5hYmxlKSB7XG4gICAgc2FmZWx5UmVzb2x2ZVRoZW5hYmxlKHNlbGYsIHRoZW5hYmxlKTtcbiAgfSBlbHNlIHtcbiAgICBzZWxmLnN0YXRlID0gRlVMRklMTEVEO1xuICAgIHNlbGYub3V0Y29tZSA9IHZhbHVlO1xuICAgIHZhciBpID0gLTE7XG4gICAgdmFyIGxlbiA9IHNlbGYucXVldWUubGVuZ3RoO1xuICAgIHdoaWxlICgrK2kgPCBsZW4pIHtcbiAgICAgIHNlbGYucXVldWVbaV0uY2FsbEZ1bGZpbGxlZCh2YWx1ZSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBzZWxmO1xufTtcbmhhbmRsZXJzLnJlamVjdCA9IGZ1bmN0aW9uIChzZWxmLCBlcnJvcikge1xuICBzZWxmLnN0YXRlID0gUkVKRUNURUQ7XG4gIHNlbGYub3V0Y29tZSA9IGVycm9yO1xuICB2YXIgaSA9IC0xO1xuICB2YXIgbGVuID0gc2VsZi5xdWV1ZS5sZW5ndGg7XG4gIHdoaWxlICgrK2kgPCBsZW4pIHtcbiAgICBzZWxmLnF1ZXVlW2ldLmNhbGxSZWplY3RlZChlcnJvcik7XG4gIH1cbiAgcmV0dXJuIHNlbGY7XG59O1xuXG5mdW5jdGlvbiBnZXRUaGVuKG9iaikge1xuICAvLyBNYWtlIHN1cmUgd2Ugb25seSBhY2Nlc3MgdGhlIGFjY2Vzc29yIG9uY2UgYXMgcmVxdWlyZWQgYnkgdGhlIHNwZWNcbiAgdmFyIHRoZW4gPSBvYmogJiYgb2JqLnRoZW47XG4gIGlmIChvYmogJiYgKHR5cGVvZiBvYmogPT09ICdvYmplY3QnIHx8IHR5cGVvZiBvYmogPT09ICdmdW5jdGlvbicpICYmIHR5cGVvZiB0aGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIGFwcHlUaGVuKCkge1xuICAgICAgdGhlbi5hcHBseShvYmosIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzYWZlbHlSZXNvbHZlVGhlbmFibGUoc2VsZiwgdGhlbmFibGUpIHtcbiAgLy8gRWl0aGVyIGZ1bGZpbGwsIHJlamVjdCBvciByZWplY3Qgd2l0aCBlcnJvclxuICB2YXIgY2FsbGVkID0gZmFsc2U7XG4gIGZ1bmN0aW9uIG9uRXJyb3IodmFsdWUpIHtcbiAgICBpZiAoY2FsbGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNhbGxlZCA9IHRydWU7XG4gICAgaGFuZGxlcnMucmVqZWN0KHNlbGYsIHZhbHVlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG9uU3VjY2Vzcyh2YWx1ZSkge1xuICAgIGlmIChjYWxsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY2FsbGVkID0gdHJ1ZTtcbiAgICBoYW5kbGVycy5yZXNvbHZlKHNlbGYsIHZhbHVlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRyeVRvVW53cmFwKCkge1xuICAgIHRoZW5hYmxlKG9uU3VjY2Vzcywgb25FcnJvcik7XG4gIH1cblxuICB2YXIgcmVzdWx0ID0gdHJ5Q2F0Y2godHJ5VG9VbndyYXApO1xuICBpZiAocmVzdWx0LnN0YXR1cyA9PT0gJ2Vycm9yJykge1xuICAgIG9uRXJyb3IocmVzdWx0LnZhbHVlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiB0cnlDYXRjaChmdW5jLCB2YWx1ZSkge1xuICB2YXIgb3V0ID0ge307XG4gIHRyeSB7XG4gICAgb3V0LnZhbHVlID0gZnVuYyh2YWx1ZSk7XG4gICAgb3V0LnN0YXR1cyA9ICdzdWNjZXNzJztcbiAgfSBjYXRjaCAoZSkge1xuICAgIG91dC5zdGF0dXMgPSAnZXJyb3InO1xuICAgIG91dC52YWx1ZSA9IGU7XG4gIH1cbiAgcmV0dXJuIG91dDtcbn1cblxuUHJvbWlzZS5yZXNvbHZlID0gcmVzb2x2ZTtcbmZ1bmN0aW9uIHJlc29sdmUodmFsdWUpIHtcbiAgaWYgKHZhbHVlIGluc3RhbmNlb2YgdGhpcykge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuICByZXR1cm4gaGFuZGxlcnMucmVzb2x2ZShuZXcgdGhpcyhJTlRFUk5BTCksIHZhbHVlKTtcbn1cblxuUHJvbWlzZS5yZWplY3QgPSByZWplY3Q7XG5mdW5jdGlvbiByZWplY3QocmVhc29uKSB7XG4gIHZhciBwcm9taXNlID0gbmV3IHRoaXMoSU5URVJOQUwpO1xuICByZXR1cm4gaGFuZGxlcnMucmVqZWN0KHByb21pc2UsIHJlYXNvbik7XG59XG5cblByb21pc2UuYWxsID0gYWxsO1xuZnVuY3Rpb24gYWxsKGl0ZXJhYmxlKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChpdGVyYWJsZSkgIT09ICdbb2JqZWN0IEFycmF5XScpIHtcbiAgICByZXR1cm4gdGhpcy5yZWplY3QobmV3IFR5cGVFcnJvcignbXVzdCBiZSBhbiBhcnJheScpKTtcbiAgfVxuXG4gIHZhciBsZW4gPSBpdGVyYWJsZS5sZW5ndGg7XG4gIHZhciBjYWxsZWQgPSBmYWxzZTtcbiAgaWYgKCFsZW4pIHtcbiAgICByZXR1cm4gdGhpcy5yZXNvbHZlKFtdKTtcbiAgfVxuXG4gIHZhciB2YWx1ZXMgPSBuZXcgQXJyYXkobGVuKTtcbiAgdmFyIHJlc29sdmVkID0gMDtcbiAgdmFyIGkgPSAtMTtcbiAgdmFyIHByb21pc2UgPSBuZXcgdGhpcyhJTlRFUk5BTCk7XG5cbiAgd2hpbGUgKCsraSA8IGxlbikge1xuICAgIGFsbFJlc29sdmVyKGl0ZXJhYmxlW2ldLCBpKTtcbiAgfVxuICByZXR1cm4gcHJvbWlzZTtcbiAgZnVuY3Rpb24gYWxsUmVzb2x2ZXIodmFsdWUsIGkpIHtcbiAgICBzZWxmLnJlc29sdmUodmFsdWUpLnRoZW4ocmVzb2x2ZUZyb21BbGwsIGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgaWYgKCFjYWxsZWQpIHtcbiAgICAgICAgY2FsbGVkID0gdHJ1ZTtcbiAgICAgICAgaGFuZGxlcnMucmVqZWN0KHByb21pc2UsIGVycm9yKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBmdW5jdGlvbiByZXNvbHZlRnJvbUFsbChvdXRWYWx1ZSkge1xuICAgICAgdmFsdWVzW2ldID0gb3V0VmFsdWU7XG4gICAgICBpZiAoKytyZXNvbHZlZCA9PT0gbGVuICYmICFjYWxsZWQpIHtcbiAgICAgICAgY2FsbGVkID0gdHJ1ZTtcbiAgICAgICAgaGFuZGxlcnMucmVzb2x2ZShwcm9taXNlLCB2YWx1ZXMpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5Qcm9taXNlLnJhY2UgPSByYWNlO1xuZnVuY3Rpb24gcmFjZShpdGVyYWJsZSkge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoaXRlcmFibGUpICE9PSAnW29iamVjdCBBcnJheV0nKSB7XG4gICAgcmV0dXJuIHRoaXMucmVqZWN0KG5ldyBUeXBlRXJyb3IoJ211c3QgYmUgYW4gYXJyYXknKSk7XG4gIH1cblxuICB2YXIgbGVuID0gaXRlcmFibGUubGVuZ3RoO1xuICB2YXIgY2FsbGVkID0gZmFsc2U7XG4gIGlmICghbGVuKSB7XG4gICAgcmV0dXJuIHRoaXMucmVzb2x2ZShbXSk7XG4gIH1cblxuICB2YXIgaSA9IC0xO1xuICB2YXIgcHJvbWlzZSA9IG5ldyB0aGlzKElOVEVSTkFMKTtcblxuICB3aGlsZSAoKytpIDwgbGVuKSB7XG4gICAgcmVzb2x2ZXIoaXRlcmFibGVbaV0pO1xuICB9XG4gIHJldHVybiBwcm9taXNlO1xuICBmdW5jdGlvbiByZXNvbHZlcih2YWx1ZSkge1xuICAgIHNlbGYucmVzb2x2ZSh2YWx1ZSkudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgIGlmICghY2FsbGVkKSB7XG4gICAgICAgIGNhbGxlZCA9IHRydWU7XG4gICAgICAgIGhhbmRsZXJzLnJlc29sdmUocHJvbWlzZSwgcmVzcG9uc2UpO1xuICAgICAgfVxuICAgIH0sIGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgaWYgKCFjYWxsZWQpIHtcbiAgICAgICAgY2FsbGVkID0gdHJ1ZTtcbiAgICAgICAgaGFuZGxlcnMucmVqZWN0KHByb21pc2UsIGVycm9yKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuXG59LHtcImltbWVkaWF0ZVwiOjM2fV0sMzg6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXG52YXIgYXNzaWduICAgID0gcmVxdWlyZSgnLi9saWIvdXRpbHMvY29tbW9uJykuYXNzaWduO1xuXG52YXIgZGVmbGF0ZSAgID0gcmVxdWlyZSgnLi9saWIvZGVmbGF0ZScpO1xudmFyIGluZmxhdGUgICA9IHJlcXVpcmUoJy4vbGliL2luZmxhdGUnKTtcbnZhciBjb25zdGFudHMgPSByZXF1aXJlKCcuL2xpYi96bGliL2NvbnN0YW50cycpO1xuXG52YXIgcGFrbyA9IHt9O1xuXG5hc3NpZ24ocGFrbywgZGVmbGF0ZSwgaW5mbGF0ZSwgY29uc3RhbnRzKTtcblxubW9kdWxlLmV4cG9ydHMgPSBwYWtvO1xuXG59LHtcIi4vbGliL2RlZmxhdGVcIjozOSxcIi4vbGliL2luZmxhdGVcIjo0MCxcIi4vbGliL3V0aWxzL2NvbW1vblwiOjQxLFwiLi9saWIvemxpYi9jb25zdGFudHNcIjo0NH1dLDM5OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcblxuXG52YXIgemxpYl9kZWZsYXRlID0gcmVxdWlyZSgnLi96bGliL2RlZmxhdGUnKTtcbnZhciB1dGlscyAgICAgICAgPSByZXF1aXJlKCcuL3V0aWxzL2NvbW1vbicpO1xudmFyIHN0cmluZ3MgICAgICA9IHJlcXVpcmUoJy4vdXRpbHMvc3RyaW5ncycpO1xudmFyIG1zZyAgICAgICAgICA9IHJlcXVpcmUoJy4vemxpYi9tZXNzYWdlcycpO1xudmFyIFpTdHJlYW0gICAgICA9IHJlcXVpcmUoJy4vemxpYi96c3RyZWFtJyk7XG5cbnZhciB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cbi8qIFB1YmxpYyBjb25zdGFudHMgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSovXG4vKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0qL1xuXG52YXIgWl9OT19GTFVTSCAgICAgID0gMDtcbnZhciBaX0ZJTklTSCAgICAgICAgPSA0O1xuXG52YXIgWl9PSyAgICAgICAgICAgID0gMDtcbnZhciBaX1NUUkVBTV9FTkQgICAgPSAxO1xudmFyIFpfU1lOQ19GTFVTSCAgICA9IDI7XG5cbnZhciBaX0RFRkFVTFRfQ09NUFJFU1NJT04gPSAtMTtcblxudmFyIFpfREVGQVVMVF9TVFJBVEVHWSAgICA9IDA7XG5cbnZhciBaX0RFRkxBVEVEICA9IDg7XG5cbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSovXG5cblxuLyoqXG4gKiBjbGFzcyBEZWZsYXRlXG4gKlxuICogR2VuZXJpYyBKUy1zdHlsZSB3cmFwcGVyIGZvciB6bGliIGNhbGxzLiBJZiB5b3UgZG9uJ3QgbmVlZFxuICogc3RyZWFtaW5nIGJlaGF2aW91ciAtIHVzZSBtb3JlIHNpbXBsZSBmdW5jdGlvbnM6IFtbZGVmbGF0ZV1dLFxuICogW1tkZWZsYXRlUmF3XV0gYW5kIFtbZ3ppcF1dLlxuICoqL1xuXG4vKiBpbnRlcm5hbFxuICogRGVmbGF0ZS5jaHVua3MgLT4gQXJyYXlcbiAqXG4gKiBDaHVua3Mgb2Ygb3V0cHV0IGRhdGEsIGlmIFtbRGVmbGF0ZSNvbkRhdGFdXSBub3Qgb3ZlcnJpZGVuLlxuICoqL1xuXG4vKipcbiAqIERlZmxhdGUucmVzdWx0IC0+IFVpbnQ4QXJyYXl8QXJyYXlcbiAqXG4gKiBDb21wcmVzc2VkIHJlc3VsdCwgZ2VuZXJhdGVkIGJ5IGRlZmF1bHQgW1tEZWZsYXRlI29uRGF0YV1dXG4gKiBhbmQgW1tEZWZsYXRlI29uRW5kXV0gaGFuZGxlcnMuIEZpbGxlZCBhZnRlciB5b3UgcHVzaCBsYXN0IGNodW5rXG4gKiAoY2FsbCBbW0RlZmxhdGUjcHVzaF1dIHdpdGggYFpfRklOSVNIYCAvIGB0cnVlYCBwYXJhbSkgIG9yIGlmIHlvdVxuICogcHVzaCBhIGNodW5rIHdpdGggZXhwbGljaXQgZmx1c2ggKGNhbGwgW1tEZWZsYXRlI3B1c2hdXSB3aXRoXG4gKiBgWl9TWU5DX0ZMVVNIYCBwYXJhbSkuXG4gKiovXG5cbi8qKlxuICogRGVmbGF0ZS5lcnIgLT4gTnVtYmVyXG4gKlxuICogRXJyb3IgY29kZSBhZnRlciBkZWZsYXRlIGZpbmlzaGVkLiAwIChaX09LKSBvbiBzdWNjZXNzLlxuICogWW91IHdpbGwgbm90IG5lZWQgaXQgaW4gcmVhbCBsaWZlLCBiZWNhdXNlIGRlZmxhdGUgZXJyb3JzXG4gKiBhcmUgcG9zc2libGUgb25seSBvbiB3cm9uZyBvcHRpb25zIG9yIGJhZCBgb25EYXRhYCAvIGBvbkVuZGBcbiAqIGN1c3RvbSBoYW5kbGVycy5cbiAqKi9cblxuLyoqXG4gKiBEZWZsYXRlLm1zZyAtPiBTdHJpbmdcbiAqXG4gKiBFcnJvciBtZXNzYWdlLCBpZiBbW0RlZmxhdGUuZXJyXV0gIT0gMFxuICoqL1xuXG5cbi8qKlxuICogbmV3IERlZmxhdGUob3B0aW9ucylcbiAqIC0gb3B0aW9ucyAoT2JqZWN0KTogemxpYiBkZWZsYXRlIG9wdGlvbnMuXG4gKlxuICogQ3JlYXRlcyBuZXcgZGVmbGF0b3IgaW5zdGFuY2Ugd2l0aCBzcGVjaWZpZWQgcGFyYW1zLiBUaHJvd3MgZXhjZXB0aW9uXG4gKiBvbiBiYWQgcGFyYW1zLiBTdXBwb3J0ZWQgb3B0aW9uczpcbiAqXG4gKiAtIGBsZXZlbGBcbiAqIC0gYHdpbmRvd0JpdHNgXG4gKiAtIGBtZW1MZXZlbGBcbiAqIC0gYHN0cmF0ZWd5YFxuICogLSBgZGljdGlvbmFyeWBcbiAqXG4gKiBbaHR0cDovL3psaWIubmV0L21hbnVhbC5odG1sI0FkdmFuY2VkXShodHRwOi8vemxpYi5uZXQvbWFudWFsLmh0bWwjQWR2YW5jZWQpXG4gKiBmb3IgbW9yZSBpbmZvcm1hdGlvbiBvbiB0aGVzZS5cbiAqXG4gKiBBZGRpdGlvbmFsIG9wdGlvbnMsIGZvciBpbnRlcm5hbCBuZWVkczpcbiAqXG4gKiAtIGBjaHVua1NpemVgIC0gc2l6ZSBvZiBnZW5lcmF0ZWQgZGF0YSBjaHVua3MgKDE2SyBieSBkZWZhdWx0KVxuICogLSBgcmF3YCAoQm9vbGVhbikgLSBkbyByYXcgZGVmbGF0ZVxuICogLSBgZ3ppcGAgKEJvb2xlYW4pIC0gY3JlYXRlIGd6aXAgd3JhcHBlclxuICogLSBgdG9gIChTdHJpbmcpIC0gaWYgZXF1YWwgdG8gJ3N0cmluZycsIHRoZW4gcmVzdWx0IHdpbGwgYmUgXCJiaW5hcnkgc3RyaW5nXCJcbiAqICAgIChlYWNoIGNoYXIgY29kZSBbMC4uMjU1XSlcbiAqIC0gYGhlYWRlcmAgKE9iamVjdCkgLSBjdXN0b20gaGVhZGVyIGZvciBnemlwXG4gKiAgIC0gYHRleHRgIChCb29sZWFuKSAtIHRydWUgaWYgY29tcHJlc3NlZCBkYXRhIGJlbGlldmVkIHRvIGJlIHRleHRcbiAqICAgLSBgdGltZWAgKE51bWJlcikgLSBtb2RpZmljYXRpb24gdGltZSwgdW5peCB0aW1lc3RhbXBcbiAqICAgLSBgb3NgIChOdW1iZXIpIC0gb3BlcmF0aW9uIHN5c3RlbSBjb2RlXG4gKiAgIC0gYGV4dHJhYCAoQXJyYXkpIC0gYXJyYXkgb2YgYnl0ZXMgd2l0aCBleHRyYSBkYXRhIChtYXggNjU1MzYpXG4gKiAgIC0gYG5hbWVgIChTdHJpbmcpIC0gZmlsZSBuYW1lIChiaW5hcnkgc3RyaW5nKVxuICogICAtIGBjb21tZW50YCAoU3RyaW5nKSAtIGNvbW1lbnQgKGJpbmFyeSBzdHJpbmcpXG4gKiAgIC0gYGhjcmNgIChCb29sZWFuKSAtIHRydWUgaWYgaGVhZGVyIGNyYyBzaG91bGQgYmUgYWRkZWRcbiAqXG4gKiAjIyMjIyBFeGFtcGxlOlxuICpcbiAqIGBgYGphdmFzY3JpcHRcbiAqIHZhciBwYWtvID0gcmVxdWlyZSgncGFrbycpXG4gKiAgICwgY2h1bmsxID0gVWludDhBcnJheShbMSwyLDMsNCw1LDYsNyw4LDldKVxuICogICAsIGNodW5rMiA9IFVpbnQ4QXJyYXkoWzEwLDExLDEyLDEzLDE0LDE1LDE2LDE3LDE4LDE5XSk7XG4gKlxuICogdmFyIGRlZmxhdGUgPSBuZXcgcGFrby5EZWZsYXRlKHsgbGV2ZWw6IDN9KTtcbiAqXG4gKiBkZWZsYXRlLnB1c2goY2h1bmsxLCBmYWxzZSk7XG4gKiBkZWZsYXRlLnB1c2goY2h1bmsyLCB0cnVlKTsgIC8vIHRydWUgLT4gbGFzdCBjaHVua1xuICpcbiAqIGlmIChkZWZsYXRlLmVycikgeyB0aHJvdyBuZXcgRXJyb3IoZGVmbGF0ZS5lcnIpOyB9XG4gKlxuICogY29uc29sZS5sb2coZGVmbGF0ZS5yZXN1bHQpO1xuICogYGBgXG4gKiovXG5mdW5jdGlvbiBEZWZsYXRlKG9wdGlvbnMpIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIERlZmxhdGUpKSByZXR1cm4gbmV3IERlZmxhdGUob3B0aW9ucyk7XG5cbiAgdGhpcy5vcHRpb25zID0gdXRpbHMuYXNzaWduKHtcbiAgICBsZXZlbDogWl9ERUZBVUxUX0NPTVBSRVNTSU9OLFxuICAgIG1ldGhvZDogWl9ERUZMQVRFRCxcbiAgICBjaHVua1NpemU6IDE2Mzg0LFxuICAgIHdpbmRvd0JpdHM6IDE1LFxuICAgIG1lbUxldmVsOiA4LFxuICAgIHN0cmF0ZWd5OiBaX0RFRkFVTFRfU1RSQVRFR1ksXG4gICAgdG86ICcnXG4gIH0sIG9wdGlvbnMgfHwge30pO1xuXG4gIHZhciBvcHQgPSB0aGlzLm9wdGlvbnM7XG5cbiAgaWYgKG9wdC5yYXcgJiYgKG9wdC53aW5kb3dCaXRzID4gMCkpIHtcbiAgICBvcHQud2luZG93Qml0cyA9IC1vcHQud2luZG93Qml0cztcbiAgfVxuXG4gIGVsc2UgaWYgKG9wdC5nemlwICYmIChvcHQud2luZG93Qml0cyA+IDApICYmIChvcHQud2luZG93Qml0cyA8IDE2KSkge1xuICAgIG9wdC53aW5kb3dCaXRzICs9IDE2O1xuICB9XG5cbiAgdGhpcy5lcnIgICAgPSAwOyAgICAgIC8vIGVycm9yIGNvZGUsIGlmIGhhcHBlbnMgKDAgPSBaX09LKVxuICB0aGlzLm1zZyAgICA9ICcnOyAgICAgLy8gZXJyb3IgbWVzc2FnZVxuICB0aGlzLmVuZGVkICA9IGZhbHNlOyAgLy8gdXNlZCB0byBhdm9pZCBtdWx0aXBsZSBvbkVuZCgpIGNhbGxzXG4gIHRoaXMuY2h1bmtzID0gW107ICAgICAvLyBjaHVua3Mgb2YgY29tcHJlc3NlZCBkYXRhXG5cbiAgdGhpcy5zdHJtID0gbmV3IFpTdHJlYW0oKTtcbiAgdGhpcy5zdHJtLmF2YWlsX291dCA9IDA7XG5cbiAgdmFyIHN0YXR1cyA9IHpsaWJfZGVmbGF0ZS5kZWZsYXRlSW5pdDIoXG4gICAgdGhpcy5zdHJtLFxuICAgIG9wdC5sZXZlbCxcbiAgICBvcHQubWV0aG9kLFxuICAgIG9wdC53aW5kb3dCaXRzLFxuICAgIG9wdC5tZW1MZXZlbCxcbiAgICBvcHQuc3RyYXRlZ3lcbiAgKTtcblxuICBpZiAoc3RhdHVzICE9PSBaX09LKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKG1zZ1tzdGF0dXNdKTtcbiAgfVxuXG4gIGlmIChvcHQuaGVhZGVyKSB7XG4gICAgemxpYl9kZWZsYXRlLmRlZmxhdGVTZXRIZWFkZXIodGhpcy5zdHJtLCBvcHQuaGVhZGVyKTtcbiAgfVxuXG4gIGlmIChvcHQuZGljdGlvbmFyeSkge1xuICAgIHZhciBkaWN0O1xuICAgIC8vIENvbnZlcnQgZGF0YSBpZiBuZWVkZWRcbiAgICBpZiAodHlwZW9mIG9wdC5kaWN0aW9uYXJ5ID09PSAnc3RyaW5nJykge1xuICAgICAgLy8gSWYgd2UgbmVlZCB0byBjb21wcmVzcyB0ZXh0LCBjaGFuZ2UgZW5jb2RpbmcgdG8gdXRmOC5cbiAgICAgIGRpY3QgPSBzdHJpbmdzLnN0cmluZzJidWYob3B0LmRpY3Rpb25hcnkpO1xuICAgIH0gZWxzZSBpZiAodG9TdHJpbmcuY2FsbChvcHQuZGljdGlvbmFyeSkgPT09ICdbb2JqZWN0IEFycmF5QnVmZmVyXScpIHtcbiAgICAgIGRpY3QgPSBuZXcgVWludDhBcnJheShvcHQuZGljdGlvbmFyeSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRpY3QgPSBvcHQuZGljdGlvbmFyeTtcbiAgICB9XG5cbiAgICBzdGF0dXMgPSB6bGliX2RlZmxhdGUuZGVmbGF0ZVNldERpY3Rpb25hcnkodGhpcy5zdHJtLCBkaWN0KTtcblxuICAgIGlmIChzdGF0dXMgIT09IFpfT0spIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihtc2dbc3RhdHVzXSk7XG4gICAgfVxuXG4gICAgdGhpcy5fZGljdF9zZXQgPSB0cnVlO1xuICB9XG59XG5cbi8qKlxuICogRGVmbGF0ZSNwdXNoKGRhdGFbLCBtb2RlXSkgLT4gQm9vbGVhblxuICogLSBkYXRhIChVaW50OEFycmF5fEFycmF5fEFycmF5QnVmZmVyfFN0cmluZyk6IGlucHV0IGRhdGEuIFN0cmluZ3Mgd2lsbCBiZVxuICogICBjb252ZXJ0ZWQgdG8gdXRmOCBieXRlIHNlcXVlbmNlLlxuICogLSBtb2RlIChOdW1iZXJ8Qm9vbGVhbik6IDAuLjYgZm9yIGNvcnJlc3BvbmRpbmcgWl9OT19GTFVTSC4uWl9UUkVFIG1vZGVzLlxuICogICBTZWUgY29uc3RhbnRzLiBTa2lwcGVkIG9yIGBmYWxzZWAgbWVhbnMgWl9OT19GTFVTSCwgYHRydWVgIG1lYW5zaCBaX0ZJTklTSC5cbiAqXG4gKiBTZW5kcyBpbnB1dCBkYXRhIHRvIGRlZmxhdGUgcGlwZSwgZ2VuZXJhdGluZyBbW0RlZmxhdGUjb25EYXRhXV0gY2FsbHMgd2l0aFxuICogbmV3IGNvbXByZXNzZWQgY2h1bmtzLiBSZXR1cm5zIGB0cnVlYCBvbiBzdWNjZXNzLiBUaGUgbGFzdCBkYXRhIGJsb2NrIG11c3QgaGF2ZVxuICogbW9kZSBaX0ZJTklTSCAob3IgYHRydWVgKS4gVGhhdCB3aWxsIGZsdXNoIGludGVybmFsIHBlbmRpbmcgYnVmZmVycyBhbmQgY2FsbFxuICogW1tEZWZsYXRlI29uRW5kXV0uIEZvciBpbnRlcmltIGV4cGxpY2l0IGZsdXNoZXMgKHdpdGhvdXQgZW5kaW5nIHRoZSBzdHJlYW0pIHlvdVxuICogY2FuIHVzZSBtb2RlIFpfU1lOQ19GTFVTSCwga2VlcGluZyB0aGUgY29tcHJlc3Npb24gY29udGV4dC5cbiAqXG4gKiBPbiBmYWlsIGNhbGwgW1tEZWZsYXRlI29uRW5kXV0gd2l0aCBlcnJvciBjb2RlIGFuZCByZXR1cm4gZmFsc2UuXG4gKlxuICogV2Ugc3Ryb25nbHkgcmVjb21tZW5kIHRvIHVzZSBgVWludDhBcnJheWAgb24gaW5wdXQgZm9yIGJlc3Qgc3BlZWQgKG91dHB1dFxuICogYXJyYXkgZm9ybWF0IGlzIGRldGVjdGVkIGF1dG9tYXRpY2FsbHkpLiBBbHNvLCBkb24ndCBza2lwIGxhc3QgcGFyYW0gYW5kIGFsd2F5c1xuICogdXNlIHRoZSBzYW1lIHR5cGUgaW4geW91ciBjb2RlIChib29sZWFuIG9yIG51bWJlcikuIFRoYXQgd2lsbCBpbXByb3ZlIEpTIHNwZWVkLlxuICpcbiAqIEZvciByZWd1bGFyIGBBcnJheWAtcyBtYWtlIHN1cmUgYWxsIGVsZW1lbnRzIGFyZSBbMC4uMjU1XS5cbiAqXG4gKiAjIyMjIyBFeGFtcGxlXG4gKlxuICogYGBgamF2YXNjcmlwdFxuICogcHVzaChjaHVuaywgZmFsc2UpOyAvLyBwdXNoIG9uZSBvZiBkYXRhIGNodW5rc1xuICogLi4uXG4gKiBwdXNoKGNodW5rLCB0cnVlKTsgIC8vIHB1c2ggbGFzdCBjaHVua1xuICogYGBgXG4gKiovXG5EZWZsYXRlLnByb3RvdHlwZS5wdXNoID0gZnVuY3Rpb24gKGRhdGEsIG1vZGUpIHtcbiAgdmFyIHN0cm0gPSB0aGlzLnN0cm07XG4gIHZhciBjaHVua1NpemUgPSB0aGlzLm9wdGlvbnMuY2h1bmtTaXplO1xuICB2YXIgc3RhdHVzLCBfbW9kZTtcblxuICBpZiAodGhpcy5lbmRlZCkgeyByZXR1cm4gZmFsc2U7IH1cblxuICBfbW9kZSA9IChtb2RlID09PSB+fm1vZGUpID8gbW9kZSA6ICgobW9kZSA9PT0gdHJ1ZSkgPyBaX0ZJTklTSCA6IFpfTk9fRkxVU0gpO1xuXG4gIC8vIENvbnZlcnQgZGF0YSBpZiBuZWVkZWRcbiAgaWYgKHR5cGVvZiBkYXRhID09PSAnc3RyaW5nJykge1xuICAgIC8vIElmIHdlIG5lZWQgdG8gY29tcHJlc3MgdGV4dCwgY2hhbmdlIGVuY29kaW5nIHRvIHV0ZjguXG4gICAgc3RybS5pbnB1dCA9IHN0cmluZ3Muc3RyaW5nMmJ1ZihkYXRhKTtcbiAgfSBlbHNlIGlmICh0b1N0cmluZy5jYWxsKGRhdGEpID09PSAnW29iamVjdCBBcnJheUJ1ZmZlcl0nKSB7XG4gICAgc3RybS5pbnB1dCA9IG5ldyBVaW50OEFycmF5KGRhdGEpO1xuICB9IGVsc2Uge1xuICAgIHN0cm0uaW5wdXQgPSBkYXRhO1xuICB9XG5cbiAgc3RybS5uZXh0X2luID0gMDtcbiAgc3RybS5hdmFpbF9pbiA9IHN0cm0uaW5wdXQubGVuZ3RoO1xuXG4gIGRvIHtcbiAgICBpZiAoc3RybS5hdmFpbF9vdXQgPT09IDApIHtcbiAgICAgIHN0cm0ub3V0cHV0ID0gbmV3IHV0aWxzLkJ1ZjgoY2h1bmtTaXplKTtcbiAgICAgIHN0cm0ubmV4dF9vdXQgPSAwO1xuICAgICAgc3RybS5hdmFpbF9vdXQgPSBjaHVua1NpemU7XG4gICAgfVxuICAgIHN0YXR1cyA9IHpsaWJfZGVmbGF0ZS5kZWZsYXRlKHN0cm0sIF9tb2RlKTsgICAgLyogbm8gYmFkIHJldHVybiB2YWx1ZSAqL1xuXG4gICAgaWYgKHN0YXR1cyAhPT0gWl9TVFJFQU1fRU5EICYmIHN0YXR1cyAhPT0gWl9PSykge1xuICAgICAgdGhpcy5vbkVuZChzdGF0dXMpO1xuICAgICAgdGhpcy5lbmRlZCA9IHRydWU7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmIChzdHJtLmF2YWlsX291dCA9PT0gMCB8fCAoc3RybS5hdmFpbF9pbiA9PT0gMCAmJiAoX21vZGUgPT09IFpfRklOSVNIIHx8IF9tb2RlID09PSBaX1NZTkNfRkxVU0gpKSkge1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy50byA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgdGhpcy5vbkRhdGEoc3RyaW5ncy5idWYyYmluc3RyaW5nKHV0aWxzLnNocmlua0J1ZihzdHJtLm91dHB1dCwgc3RybS5uZXh0X291dCkpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMub25EYXRhKHV0aWxzLnNocmlua0J1ZihzdHJtLm91dHB1dCwgc3RybS5uZXh0X291dCkpO1xuICAgICAgfVxuICAgIH1cbiAgfSB3aGlsZSAoKHN0cm0uYXZhaWxfaW4gPiAwIHx8IHN0cm0uYXZhaWxfb3V0ID09PSAwKSAmJiBzdGF0dXMgIT09IFpfU1RSRUFNX0VORCk7XG5cbiAgLy8gRmluYWxpemUgb24gdGhlIGxhc3QgY2h1bmsuXG4gIGlmIChfbW9kZSA9PT0gWl9GSU5JU0gpIHtcbiAgICBzdGF0dXMgPSB6bGliX2RlZmxhdGUuZGVmbGF0ZUVuZCh0aGlzLnN0cm0pO1xuICAgIHRoaXMub25FbmQoc3RhdHVzKTtcbiAgICB0aGlzLmVuZGVkID0gdHJ1ZTtcbiAgICByZXR1cm4gc3RhdHVzID09PSBaX09LO1xuICB9XG5cbiAgLy8gY2FsbGJhY2sgaW50ZXJpbSByZXN1bHRzIGlmIFpfU1lOQ19GTFVTSC5cbiAgaWYgKF9tb2RlID09PSBaX1NZTkNfRkxVU0gpIHtcbiAgICB0aGlzLm9uRW5kKFpfT0spO1xuICAgIHN0cm0uYXZhaWxfb3V0ID0gMDtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuXG4vKipcbiAqIERlZmxhdGUjb25EYXRhKGNodW5rKSAtPiBWb2lkXG4gKiAtIGNodW5rIChVaW50OEFycmF5fEFycmF5fFN0cmluZyk6IG91cHV0IGRhdGEuIFR5cGUgb2YgYXJyYXkgZGVwZW5kc1xuICogICBvbiBqcyBlbmdpbmUgc3VwcG9ydC4gV2hlbiBzdHJpbmcgb3V0cHV0IHJlcXVlc3RlZCwgZWFjaCBjaHVua1xuICogICB3aWxsIGJlIHN0cmluZy5cbiAqXG4gKiBCeSBkZWZhdWx0LCBzdG9yZXMgZGF0YSBibG9ja3MgaW4gYGNodW5rc1tdYCBwcm9wZXJ0eSBhbmQgZ2x1ZVxuICogdGhvc2UgaW4gYG9uRW5kYC4gT3ZlcnJpZGUgdGhpcyBoYW5kbGVyLCBpZiB5b3UgbmVlZCBhbm90aGVyIGJlaGF2aW91ci5cbiAqKi9cbkRlZmxhdGUucHJvdG90eXBlLm9uRGF0YSA9IGZ1bmN0aW9uIChjaHVuaykge1xuICB0aGlzLmNodW5rcy5wdXNoKGNodW5rKTtcbn07XG5cblxuLyoqXG4gKiBEZWZsYXRlI29uRW5kKHN0YXR1cykgLT4gVm9pZFxuICogLSBzdGF0dXMgKE51bWJlcik6IGRlZmxhdGUgc3RhdHVzLiAwIChaX09LKSBvbiBzdWNjZXNzLFxuICogICBvdGhlciBpZiBub3QuXG4gKlxuICogQ2FsbGVkIG9uY2UgYWZ0ZXIgeW91IHRlbGwgZGVmbGF0ZSB0aGF0IHRoZSBpbnB1dCBzdHJlYW0gaXNcbiAqIGNvbXBsZXRlIChaX0ZJTklTSCkgb3Igc2hvdWxkIGJlIGZsdXNoZWQgKFpfU1lOQ19GTFVTSClcbiAqIG9yIGlmIGFuIGVycm9yIGhhcHBlbmVkLiBCeSBkZWZhdWx0IC0gam9pbiBjb2xsZWN0ZWQgY2h1bmtzLFxuICogZnJlZSBtZW1vcnkgYW5kIGZpbGwgYHJlc3VsdHNgIC8gYGVycmAgcHJvcGVydGllcy5cbiAqKi9cbkRlZmxhdGUucHJvdG90eXBlLm9uRW5kID0gZnVuY3Rpb24gKHN0YXR1cykge1xuICAvLyBPbiBzdWNjZXNzIC0gam9pblxuICBpZiAoc3RhdHVzID09PSBaX09LKSB7XG4gICAgaWYgKHRoaXMub3B0aW9ucy50byA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHRoaXMucmVzdWx0ID0gdGhpcy5jaHVua3Muam9pbignJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucmVzdWx0ID0gdXRpbHMuZmxhdHRlbkNodW5rcyh0aGlzLmNodW5rcyk7XG4gICAgfVxuICB9XG4gIHRoaXMuY2h1bmtzID0gW107XG4gIHRoaXMuZXJyID0gc3RhdHVzO1xuICB0aGlzLm1zZyA9IHRoaXMuc3RybS5tc2c7XG59O1xuXG5cbi8qKlxuICogZGVmbGF0ZShkYXRhWywgb3B0aW9uc10pIC0+IFVpbnQ4QXJyYXl8QXJyYXl8U3RyaW5nXG4gKiAtIGRhdGEgKFVpbnQ4QXJyYXl8QXJyYXl8U3RyaW5nKTogaW5wdXQgZGF0YSB0byBjb21wcmVzcy5cbiAqIC0gb3B0aW9ucyAoT2JqZWN0KTogemxpYiBkZWZsYXRlIG9wdGlvbnMuXG4gKlxuICogQ29tcHJlc3MgYGRhdGFgIHdpdGggZGVmbGF0ZSBhbGdvcml0aG0gYW5kIGBvcHRpb25zYC5cbiAqXG4gKiBTdXBwb3J0ZWQgb3B0aW9ucyBhcmU6XG4gKlxuICogLSBsZXZlbFxuICogLSB3aW5kb3dCaXRzXG4gKiAtIG1lbUxldmVsXG4gKiAtIHN0cmF0ZWd5XG4gKiAtIGRpY3Rpb25hcnlcbiAqXG4gKiBbaHR0cDovL3psaWIubmV0L21hbnVhbC5odG1sI0FkdmFuY2VkXShodHRwOi8vemxpYi5uZXQvbWFudWFsLmh0bWwjQWR2YW5jZWQpXG4gKiBmb3IgbW9yZSBpbmZvcm1hdGlvbiBvbiB0aGVzZS5cbiAqXG4gKiBTdWdhciAob3B0aW9ucyk6XG4gKlxuICogLSBgcmF3YCAoQm9vbGVhbikgLSBzYXkgdGhhdCB3ZSB3b3JrIHdpdGggcmF3IHN0cmVhbSwgaWYgeW91IGRvbid0IHdpc2ggdG8gc3BlY2lmeVxuICogICBuZWdhdGl2ZSB3aW5kb3dCaXRzIGltcGxpY2l0bHkuXG4gKiAtIGB0b2AgKFN0cmluZykgLSBpZiBlcXVhbCB0byAnc3RyaW5nJywgdGhlbiByZXN1bHQgd2lsbCBiZSBcImJpbmFyeSBzdHJpbmdcIlxuICogICAgKGVhY2ggY2hhciBjb2RlIFswLi4yNTVdKVxuICpcbiAqICMjIyMjIEV4YW1wbGU6XG4gKlxuICogYGBgamF2YXNjcmlwdFxuICogdmFyIHBha28gPSByZXF1aXJlKCdwYWtvJylcbiAqICAgLCBkYXRhID0gVWludDhBcnJheShbMSwyLDMsNCw1LDYsNyw4LDldKTtcbiAqXG4gKiBjb25zb2xlLmxvZyhwYWtvLmRlZmxhdGUoZGF0YSkpO1xuICogYGBgXG4gKiovXG5mdW5jdGlvbiBkZWZsYXRlKGlucHV0LCBvcHRpb25zKSB7XG4gIHZhciBkZWZsYXRvciA9IG5ldyBEZWZsYXRlKG9wdGlvbnMpO1xuXG4gIGRlZmxhdG9yLnB1c2goaW5wdXQsIHRydWUpO1xuXG4gIC8vIFRoYXQgd2lsbCBuZXZlciBoYXBwZW5zLCBpZiB5b3UgZG9uJ3QgY2hlYXQgd2l0aCBvcHRpb25zIDopXG4gIGlmIChkZWZsYXRvci5lcnIpIHsgdGhyb3cgZGVmbGF0b3IubXNnIHx8IG1zZ1tkZWZsYXRvci5lcnJdOyB9XG5cbiAgcmV0dXJuIGRlZmxhdG9yLnJlc3VsdDtcbn1cblxuXG4vKipcbiAqIGRlZmxhdGVSYXcoZGF0YVssIG9wdGlvbnNdKSAtPiBVaW50OEFycmF5fEFycmF5fFN0cmluZ1xuICogLSBkYXRhIChVaW50OEFycmF5fEFycmF5fFN0cmluZyk6IGlucHV0IGRhdGEgdG8gY29tcHJlc3MuXG4gKiAtIG9wdGlvbnMgKE9iamVjdCk6IHpsaWIgZGVmbGF0ZSBvcHRpb25zLlxuICpcbiAqIFRoZSBzYW1lIGFzIFtbZGVmbGF0ZV1dLCBidXQgY3JlYXRlcyByYXcgZGF0YSwgd2l0aG91dCB3cmFwcGVyXG4gKiAoaGVhZGVyIGFuZCBhZGxlcjMyIGNyYykuXG4gKiovXG5mdW5jdGlvbiBkZWZsYXRlUmF3KGlucHV0LCBvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICBvcHRpb25zLnJhdyA9IHRydWU7XG4gIHJldHVybiBkZWZsYXRlKGlucHV0LCBvcHRpb25zKTtcbn1cblxuXG4vKipcbiAqIGd6aXAoZGF0YVssIG9wdGlvbnNdKSAtPiBVaW50OEFycmF5fEFycmF5fFN0cmluZ1xuICogLSBkYXRhIChVaW50OEFycmF5fEFycmF5fFN0cmluZyk6IGlucHV0IGRhdGEgdG8gY29tcHJlc3MuXG4gKiAtIG9wdGlvbnMgKE9iamVjdCk6IHpsaWIgZGVmbGF0ZSBvcHRpb25zLlxuICpcbiAqIFRoZSBzYW1lIGFzIFtbZGVmbGF0ZV1dLCBidXQgY3JlYXRlIGd6aXAgd3JhcHBlciBpbnN0ZWFkIG9mXG4gKiBkZWZsYXRlIG9uZS5cbiAqKi9cbmZ1bmN0aW9uIGd6aXAoaW5wdXQsIG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIG9wdGlvbnMuZ3ppcCA9IHRydWU7XG4gIHJldHVybiBkZWZsYXRlKGlucHV0LCBvcHRpb25zKTtcbn1cblxuXG5leHBvcnRzLkRlZmxhdGUgPSBEZWZsYXRlO1xuZXhwb3J0cy5kZWZsYXRlID0gZGVmbGF0ZTtcbmV4cG9ydHMuZGVmbGF0ZVJhdyA9IGRlZmxhdGVSYXc7XG5leHBvcnRzLmd6aXAgPSBnemlwO1xuXG59LHtcIi4vdXRpbHMvY29tbW9uXCI6NDEsXCIuL3V0aWxzL3N0cmluZ3NcIjo0MixcIi4vemxpYi9kZWZsYXRlXCI6NDYsXCIuL3psaWIvbWVzc2FnZXNcIjo1MSxcIi4vemxpYi96c3RyZWFtXCI6NTN9XSw0MDpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG5cblxudmFyIHpsaWJfaW5mbGF0ZSA9IHJlcXVpcmUoJy4vemxpYi9pbmZsYXRlJyk7XG52YXIgdXRpbHMgICAgICAgID0gcmVxdWlyZSgnLi91dGlscy9jb21tb24nKTtcbnZhciBzdHJpbmdzICAgICAgPSByZXF1aXJlKCcuL3V0aWxzL3N0cmluZ3MnKTtcbnZhciBjICAgICAgICAgICAgPSByZXF1aXJlKCcuL3psaWIvY29uc3RhbnRzJyk7XG52YXIgbXNnICAgICAgICAgID0gcmVxdWlyZSgnLi96bGliL21lc3NhZ2VzJyk7XG52YXIgWlN0cmVhbSAgICAgID0gcmVxdWlyZSgnLi96bGliL3pzdHJlYW0nKTtcbnZhciBHWmhlYWRlciAgICAgPSByZXF1aXJlKCcuL3psaWIvZ3poZWFkZXInKTtcblxudmFyIHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcblxuLyoqXG4gKiBjbGFzcyBJbmZsYXRlXG4gKlxuICogR2VuZXJpYyBKUy1zdHlsZSB3cmFwcGVyIGZvciB6bGliIGNhbGxzLiBJZiB5b3UgZG9uJ3QgbmVlZFxuICogc3RyZWFtaW5nIGJlaGF2aW91ciAtIHVzZSBtb3JlIHNpbXBsZSBmdW5jdGlvbnM6IFtbaW5mbGF0ZV1dXG4gKiBhbmQgW1tpbmZsYXRlUmF3XV0uXG4gKiovXG5cbi8qIGludGVybmFsXG4gKiBpbmZsYXRlLmNodW5rcyAtPiBBcnJheVxuICpcbiAqIENodW5rcyBvZiBvdXRwdXQgZGF0YSwgaWYgW1tJbmZsYXRlI29uRGF0YV1dIG5vdCBvdmVycmlkZW4uXG4gKiovXG5cbi8qKlxuICogSW5mbGF0ZS5yZXN1bHQgLT4gVWludDhBcnJheXxBcnJheXxTdHJpbmdcbiAqXG4gKiBVbmNvbXByZXNzZWQgcmVzdWx0LCBnZW5lcmF0ZWQgYnkgZGVmYXVsdCBbW0luZmxhdGUjb25EYXRhXV1cbiAqIGFuZCBbW0luZmxhdGUjb25FbmRdXSBoYW5kbGVycy4gRmlsbGVkIGFmdGVyIHlvdSBwdXNoIGxhc3QgY2h1bmtcbiAqIChjYWxsIFtbSW5mbGF0ZSNwdXNoXV0gd2l0aCBgWl9GSU5JU0hgIC8gYHRydWVgIHBhcmFtKSBvciBpZiB5b3VcbiAqIHB1c2ggYSBjaHVuayB3aXRoIGV4cGxpY2l0IGZsdXNoIChjYWxsIFtbSW5mbGF0ZSNwdXNoXV0gd2l0aFxuICogYFpfU1lOQ19GTFVTSGAgcGFyYW0pLlxuICoqL1xuXG4vKipcbiAqIEluZmxhdGUuZXJyIC0+IE51bWJlclxuICpcbiAqIEVycm9yIGNvZGUgYWZ0ZXIgaW5mbGF0ZSBmaW5pc2hlZC4gMCAoWl9PSykgb24gc3VjY2Vzcy5cbiAqIFNob3VsZCBiZSBjaGVja2VkIGlmIGJyb2tlbiBkYXRhIHBvc3NpYmxlLlxuICoqL1xuXG4vKipcbiAqIEluZmxhdGUubXNnIC0+IFN0cmluZ1xuICpcbiAqIEVycm9yIG1lc3NhZ2UsIGlmIFtbSW5mbGF0ZS5lcnJdXSAhPSAwXG4gKiovXG5cblxuLyoqXG4gKiBuZXcgSW5mbGF0ZShvcHRpb25zKVxuICogLSBvcHRpb25zIChPYmplY3QpOiB6bGliIGluZmxhdGUgb3B0aW9ucy5cbiAqXG4gKiBDcmVhdGVzIG5ldyBpbmZsYXRvciBpbnN0YW5jZSB3aXRoIHNwZWNpZmllZCBwYXJhbXMuIFRocm93cyBleGNlcHRpb25cbiAqIG9uIGJhZCBwYXJhbXMuIFN1cHBvcnRlZCBvcHRpb25zOlxuICpcbiAqIC0gYHdpbmRvd0JpdHNgXG4gKiAtIGBkaWN0aW9uYXJ5YFxuICpcbiAqIFtodHRwOi8vemxpYi5uZXQvbWFudWFsLmh0bWwjQWR2YW5jZWRdKGh0dHA6Ly96bGliLm5ldC9tYW51YWwuaHRtbCNBZHZhbmNlZClcbiAqIGZvciBtb3JlIGluZm9ybWF0aW9uIG9uIHRoZXNlLlxuICpcbiAqIEFkZGl0aW9uYWwgb3B0aW9ucywgZm9yIGludGVybmFsIG5lZWRzOlxuICpcbiAqIC0gYGNodW5rU2l6ZWAgLSBzaXplIG9mIGdlbmVyYXRlZCBkYXRhIGNodW5rcyAoMTZLIGJ5IGRlZmF1bHQpXG4gKiAtIGByYXdgIChCb29sZWFuKSAtIGRvIHJhdyBpbmZsYXRlXG4gKiAtIGB0b2AgKFN0cmluZykgLSBpZiBlcXVhbCB0byAnc3RyaW5nJywgdGhlbiByZXN1bHQgd2lsbCBiZSBjb252ZXJ0ZWRcbiAqICAgZnJvbSB1dGY4IHRvIHV0ZjE2IChqYXZhc2NyaXB0KSBzdHJpbmcuIFdoZW4gc3RyaW5nIG91dHB1dCByZXF1ZXN0ZWQsXG4gKiAgIGNodW5rIGxlbmd0aCBjYW4gZGlmZmVyIGZyb20gYGNodW5rU2l6ZWAsIGRlcGVuZGluZyBvbiBjb250ZW50LlxuICpcbiAqIEJ5IGRlZmF1bHQsIHdoZW4gbm8gb3B0aW9ucyBzZXQsIGF1dG9kZXRlY3QgZGVmbGF0ZS9nemlwIGRhdGEgZm9ybWF0IHZpYVxuICogd3JhcHBlciBoZWFkZXIuXG4gKlxuICogIyMjIyMgRXhhbXBsZTpcbiAqXG4gKiBgYGBqYXZhc2NyaXB0XG4gKiB2YXIgcGFrbyA9IHJlcXVpcmUoJ3Bha28nKVxuICogICAsIGNodW5rMSA9IFVpbnQ4QXJyYXkoWzEsMiwzLDQsNSw2LDcsOCw5XSlcbiAqICAgLCBjaHVuazIgPSBVaW50OEFycmF5KFsxMCwxMSwxMiwxMywxNCwxNSwxNiwxNywxOCwxOV0pO1xuICpcbiAqIHZhciBpbmZsYXRlID0gbmV3IHBha28uSW5mbGF0ZSh7IGxldmVsOiAzfSk7XG4gKlxuICogaW5mbGF0ZS5wdXNoKGNodW5rMSwgZmFsc2UpO1xuICogaW5mbGF0ZS5wdXNoKGNodW5rMiwgdHJ1ZSk7ICAvLyB0cnVlIC0+IGxhc3QgY2h1bmtcbiAqXG4gKiBpZiAoaW5mbGF0ZS5lcnIpIHsgdGhyb3cgbmV3IEVycm9yKGluZmxhdGUuZXJyKTsgfVxuICpcbiAqIGNvbnNvbGUubG9nKGluZmxhdGUucmVzdWx0KTtcbiAqIGBgYFxuICoqL1xuZnVuY3Rpb24gSW5mbGF0ZShvcHRpb25zKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBJbmZsYXRlKSkgcmV0dXJuIG5ldyBJbmZsYXRlKG9wdGlvbnMpO1xuXG4gIHRoaXMub3B0aW9ucyA9IHV0aWxzLmFzc2lnbih7XG4gICAgY2h1bmtTaXplOiAxNjM4NCxcbiAgICB3aW5kb3dCaXRzOiAwLFxuICAgIHRvOiAnJ1xuICB9LCBvcHRpb25zIHx8IHt9KTtcblxuICB2YXIgb3B0ID0gdGhpcy5vcHRpb25zO1xuXG4gIC8vIEZvcmNlIHdpbmRvdyBzaXplIGZvciBgcmF3YCBkYXRhLCBpZiBub3Qgc2V0IGRpcmVjdGx5LFxuICAvLyBiZWNhdXNlIHdlIGhhdmUgbm8gaGVhZGVyIGZvciBhdXRvZGV0ZWN0LlxuICBpZiAob3B0LnJhdyAmJiAob3B0LndpbmRvd0JpdHMgPj0gMCkgJiYgKG9wdC53aW5kb3dCaXRzIDwgMTYpKSB7XG4gICAgb3B0LndpbmRvd0JpdHMgPSAtb3B0LndpbmRvd0JpdHM7XG4gICAgaWYgKG9wdC53aW5kb3dCaXRzID09PSAwKSB7IG9wdC53aW5kb3dCaXRzID0gLTE1OyB9XG4gIH1cblxuICAvLyBJZiBgd2luZG93Qml0c2Agbm90IGRlZmluZWQgKGFuZCBtb2RlIG5vdCByYXcpIC0gc2V0IGF1dG9kZXRlY3QgZmxhZyBmb3IgZ3ppcC9kZWZsYXRlXG4gIGlmICgob3B0LndpbmRvd0JpdHMgPj0gMCkgJiYgKG9wdC53aW5kb3dCaXRzIDwgMTYpICYmXG4gICAgICAhKG9wdGlvbnMgJiYgb3B0aW9ucy53aW5kb3dCaXRzKSkge1xuICAgIG9wdC53aW5kb3dCaXRzICs9IDMyO1xuICB9XG5cbiAgLy8gR3ppcCBoZWFkZXIgaGFzIG5vIGluZm8gYWJvdXQgd2luZG93cyBzaXplLCB3ZSBjYW4gZG8gYXV0b2RldGVjdCBvbmx5XG4gIC8vIGZvciBkZWZsYXRlLiBTbywgaWYgd2luZG93IHNpemUgbm90IHNldCwgZm9yY2UgaXQgdG8gbWF4IHdoZW4gZ3ppcCBwb3NzaWJsZVxuICBpZiAoKG9wdC53aW5kb3dCaXRzID4gMTUpICYmIChvcHQud2luZG93Qml0cyA8IDQ4KSkge1xuICAgIC8vIGJpdCAzICgxNikgLT4gZ3ppcHBlZCBkYXRhXG4gICAgLy8gYml0IDQgKDMyKSAtPiBhdXRvZGV0ZWN0IGd6aXAvZGVmbGF0ZVxuICAgIGlmICgob3B0LndpbmRvd0JpdHMgJiAxNSkgPT09IDApIHtcbiAgICAgIG9wdC53aW5kb3dCaXRzIHw9IDE1O1xuICAgIH1cbiAgfVxuXG4gIHRoaXMuZXJyICAgID0gMDsgICAgICAvLyBlcnJvciBjb2RlLCBpZiBoYXBwZW5zICgwID0gWl9PSylcbiAgdGhpcy5tc2cgICAgPSAnJzsgICAgIC8vIGVycm9yIG1lc3NhZ2VcbiAgdGhpcy5lbmRlZCAgPSBmYWxzZTsgIC8vIHVzZWQgdG8gYXZvaWQgbXVsdGlwbGUgb25FbmQoKSBjYWxsc1xuICB0aGlzLmNodW5rcyA9IFtdOyAgICAgLy8gY2h1bmtzIG9mIGNvbXByZXNzZWQgZGF0YVxuXG4gIHRoaXMuc3RybSAgID0gbmV3IFpTdHJlYW0oKTtcbiAgdGhpcy5zdHJtLmF2YWlsX291dCA9IDA7XG5cbiAgdmFyIHN0YXR1cyAgPSB6bGliX2luZmxhdGUuaW5mbGF0ZUluaXQyKFxuICAgIHRoaXMuc3RybSxcbiAgICBvcHQud2luZG93Qml0c1xuICApO1xuXG4gIGlmIChzdGF0dXMgIT09IGMuWl9PSykge1xuICAgIHRocm93IG5ldyBFcnJvcihtc2dbc3RhdHVzXSk7XG4gIH1cblxuICB0aGlzLmhlYWRlciA9IG5ldyBHWmhlYWRlcigpO1xuXG4gIHpsaWJfaW5mbGF0ZS5pbmZsYXRlR2V0SGVhZGVyKHRoaXMuc3RybSwgdGhpcy5oZWFkZXIpO1xufVxuXG4vKipcbiAqIEluZmxhdGUjcHVzaChkYXRhWywgbW9kZV0pIC0+IEJvb2xlYW5cbiAqIC0gZGF0YSAoVWludDhBcnJheXxBcnJheXxBcnJheUJ1ZmZlcnxTdHJpbmcpOiBpbnB1dCBkYXRhXG4gKiAtIG1vZGUgKE51bWJlcnxCb29sZWFuKTogMC4uNiBmb3IgY29ycmVzcG9uZGluZyBaX05PX0ZMVVNILi5aX1RSRUUgbW9kZXMuXG4gKiAgIFNlZSBjb25zdGFudHMuIFNraXBwZWQgb3IgYGZhbHNlYCBtZWFucyBaX05PX0ZMVVNILCBgdHJ1ZWAgbWVhbnNoIFpfRklOSVNILlxuICpcbiAqIFNlbmRzIGlucHV0IGRhdGEgdG8gaW5mbGF0ZSBwaXBlLCBnZW5lcmF0aW5nIFtbSW5mbGF0ZSNvbkRhdGFdXSBjYWxscyB3aXRoXG4gKiBuZXcgb3V0cHV0IGNodW5rcy4gUmV0dXJucyBgdHJ1ZWAgb24gc3VjY2Vzcy4gVGhlIGxhc3QgZGF0YSBibG9jayBtdXN0IGhhdmVcbiAqIG1vZGUgWl9GSU5JU0ggKG9yIGB0cnVlYCkuIFRoYXQgd2lsbCBmbHVzaCBpbnRlcm5hbCBwZW5kaW5nIGJ1ZmZlcnMgYW5kIGNhbGxcbiAqIFtbSW5mbGF0ZSNvbkVuZF1dLiBGb3IgaW50ZXJpbSBleHBsaWNpdCBmbHVzaGVzICh3aXRob3V0IGVuZGluZyB0aGUgc3RyZWFtKSB5b3VcbiAqIGNhbiB1c2UgbW9kZSBaX1NZTkNfRkxVU0gsIGtlZXBpbmcgdGhlIGRlY29tcHJlc3Npb24gY29udGV4dC5cbiAqXG4gKiBPbiBmYWlsIGNhbGwgW1tJbmZsYXRlI29uRW5kXV0gd2l0aCBlcnJvciBjb2RlIGFuZCByZXR1cm4gZmFsc2UuXG4gKlxuICogV2Ugc3Ryb25nbHkgcmVjb21tZW5kIHRvIHVzZSBgVWludDhBcnJheWAgb24gaW5wdXQgZm9yIGJlc3Qgc3BlZWQgKG91dHB1dFxuICogZm9ybWF0IGlzIGRldGVjdGVkIGF1dG9tYXRpY2FsbHkpLiBBbHNvLCBkb24ndCBza2lwIGxhc3QgcGFyYW0gYW5kIGFsd2F5c1xuICogdXNlIHRoZSBzYW1lIHR5cGUgaW4geW91ciBjb2RlIChib29sZWFuIG9yIG51bWJlcikuIFRoYXQgd2lsbCBpbXByb3ZlIEpTIHNwZWVkLlxuICpcbiAqIEZvciByZWd1bGFyIGBBcnJheWAtcyBtYWtlIHN1cmUgYWxsIGVsZW1lbnRzIGFyZSBbMC4uMjU1XS5cbiAqXG4gKiAjIyMjIyBFeGFtcGxlXG4gKlxuICogYGBgamF2YXNjcmlwdFxuICogcHVzaChjaHVuaywgZmFsc2UpOyAvLyBwdXNoIG9uZSBvZiBkYXRhIGNodW5rc1xuICogLi4uXG4gKiBwdXNoKGNodW5rLCB0cnVlKTsgIC8vIHB1c2ggbGFzdCBjaHVua1xuICogYGBgXG4gKiovXG5JbmZsYXRlLnByb3RvdHlwZS5wdXNoID0gZnVuY3Rpb24gKGRhdGEsIG1vZGUpIHtcbiAgdmFyIHN0cm0gPSB0aGlzLnN0cm07XG4gIHZhciBjaHVua1NpemUgPSB0aGlzLm9wdGlvbnMuY2h1bmtTaXplO1xuICB2YXIgZGljdGlvbmFyeSA9IHRoaXMub3B0aW9ucy5kaWN0aW9uYXJ5O1xuICB2YXIgc3RhdHVzLCBfbW9kZTtcbiAgdmFyIG5leHRfb3V0X3V0ZjgsIHRhaWwsIHV0ZjhzdHI7XG4gIHZhciBkaWN0O1xuXG4gIC8vIEZsYWcgdG8gcHJvcGVybHkgcHJvY2VzcyBaX0JVRl9FUlJPUiBvbiB0ZXN0aW5nIGluZmxhdGUgY2FsbFxuICAvLyB3aGVuIHdlIGNoZWNrIHRoYXQgYWxsIG91dHB1dCBkYXRhIHdhcyBmbHVzaGVkLlxuICB2YXIgYWxsb3dCdWZFcnJvciA9IGZhbHNlO1xuXG4gIGlmICh0aGlzLmVuZGVkKSB7IHJldHVybiBmYWxzZTsgfVxuICBfbW9kZSA9IChtb2RlID09PSB+fm1vZGUpID8gbW9kZSA6ICgobW9kZSA9PT0gdHJ1ZSkgPyBjLlpfRklOSVNIIDogYy5aX05PX0ZMVVNIKTtcblxuICAvLyBDb252ZXJ0IGRhdGEgaWYgbmVlZGVkXG4gIGlmICh0eXBlb2YgZGF0YSA9PT0gJ3N0cmluZycpIHtcbiAgICAvLyBPbmx5IGJpbmFyeSBzdHJpbmdzIGNhbiBiZSBkZWNvbXByZXNzZWQgb24gcHJhY3RpY2VcbiAgICBzdHJtLmlucHV0ID0gc3RyaW5ncy5iaW5zdHJpbmcyYnVmKGRhdGEpO1xuICB9IGVsc2UgaWYgKHRvU3RyaW5nLmNhbGwoZGF0YSkgPT09ICdbb2JqZWN0IEFycmF5QnVmZmVyXScpIHtcbiAgICBzdHJtLmlucHV0ID0gbmV3IFVpbnQ4QXJyYXkoZGF0YSk7XG4gIH0gZWxzZSB7XG4gICAgc3RybS5pbnB1dCA9IGRhdGE7XG4gIH1cblxuICBzdHJtLm5leHRfaW4gPSAwO1xuICBzdHJtLmF2YWlsX2luID0gc3RybS5pbnB1dC5sZW5ndGg7XG5cbiAgZG8ge1xuICAgIGlmIChzdHJtLmF2YWlsX291dCA9PT0gMCkge1xuICAgICAgc3RybS5vdXRwdXQgPSBuZXcgdXRpbHMuQnVmOChjaHVua1NpemUpO1xuICAgICAgc3RybS5uZXh0X291dCA9IDA7XG4gICAgICBzdHJtLmF2YWlsX291dCA9IGNodW5rU2l6ZTtcbiAgICB9XG5cbiAgICBzdGF0dXMgPSB6bGliX2luZmxhdGUuaW5mbGF0ZShzdHJtLCBjLlpfTk9fRkxVU0gpOyAgICAvKiBubyBiYWQgcmV0dXJuIHZhbHVlICovXG5cbiAgICBpZiAoc3RhdHVzID09PSBjLlpfTkVFRF9ESUNUICYmIGRpY3Rpb25hcnkpIHtcbiAgICAgIC8vIENvbnZlcnQgZGF0YSBpZiBuZWVkZWRcbiAgICAgIGlmICh0eXBlb2YgZGljdGlvbmFyeSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgZGljdCA9IHN0cmluZ3Muc3RyaW5nMmJ1ZihkaWN0aW9uYXJ5KTtcbiAgICAgIH0gZWxzZSBpZiAodG9TdHJpbmcuY2FsbChkaWN0aW9uYXJ5KSA9PT0gJ1tvYmplY3QgQXJyYXlCdWZmZXJdJykge1xuICAgICAgICBkaWN0ID0gbmV3IFVpbnQ4QXJyYXkoZGljdGlvbmFyeSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkaWN0ID0gZGljdGlvbmFyeTtcbiAgICAgIH1cblxuICAgICAgc3RhdHVzID0gemxpYl9pbmZsYXRlLmluZmxhdGVTZXREaWN0aW9uYXJ5KHRoaXMuc3RybSwgZGljdCk7XG5cbiAgICB9XG5cbiAgICBpZiAoc3RhdHVzID09PSBjLlpfQlVGX0VSUk9SICYmIGFsbG93QnVmRXJyb3IgPT09IHRydWUpIHtcbiAgICAgIHN0YXR1cyA9IGMuWl9PSztcbiAgICAgIGFsbG93QnVmRXJyb3IgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAoc3RhdHVzICE9PSBjLlpfU1RSRUFNX0VORCAmJiBzdGF0dXMgIT09IGMuWl9PSykge1xuICAgICAgdGhpcy5vbkVuZChzdGF0dXMpO1xuICAgICAgdGhpcy5lbmRlZCA9IHRydWU7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKHN0cm0ubmV4dF9vdXQpIHtcbiAgICAgIGlmIChzdHJtLmF2YWlsX291dCA9PT0gMCB8fCBzdGF0dXMgPT09IGMuWl9TVFJFQU1fRU5EIHx8IChzdHJtLmF2YWlsX2luID09PSAwICYmIChfbW9kZSA9PT0gYy5aX0ZJTklTSCB8fCBfbW9kZSA9PT0gYy5aX1NZTkNfRkxVU0gpKSkge1xuXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMudG8gPT09ICdzdHJpbmcnKSB7XG5cbiAgICAgICAgICBuZXh0X291dF91dGY4ID0gc3RyaW5ncy51dGY4Ym9yZGVyKHN0cm0ub3V0cHV0LCBzdHJtLm5leHRfb3V0KTtcblxuICAgICAgICAgIHRhaWwgPSBzdHJtLm5leHRfb3V0IC0gbmV4dF9vdXRfdXRmODtcbiAgICAgICAgICB1dGY4c3RyID0gc3RyaW5ncy5idWYyc3RyaW5nKHN0cm0ub3V0cHV0LCBuZXh0X291dF91dGY4KTtcblxuICAgICAgICAgIC8vIG1vdmUgdGFpbFxuICAgICAgICAgIHN0cm0ubmV4dF9vdXQgPSB0YWlsO1xuICAgICAgICAgIHN0cm0uYXZhaWxfb3V0ID0gY2h1bmtTaXplIC0gdGFpbDtcbiAgICAgICAgICBpZiAodGFpbCkgeyB1dGlscy5hcnJheVNldChzdHJtLm91dHB1dCwgc3RybS5vdXRwdXQsIG5leHRfb3V0X3V0ZjgsIHRhaWwsIDApOyB9XG5cbiAgICAgICAgICB0aGlzLm9uRGF0YSh1dGY4c3RyKTtcblxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMub25EYXRhKHV0aWxzLnNocmlua0J1ZihzdHJtLm91dHB1dCwgc3RybS5uZXh0X291dCkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gV2hlbiBubyBtb3JlIGlucHV0IGRhdGEsIHdlIHNob3VsZCBjaGVjayB0aGF0IGludGVybmFsIGluZmxhdGUgYnVmZmVyc1xuICAgIC8vIGFyZSBmbHVzaGVkLiBUaGUgb25seSB3YXkgdG8gZG8gaXQgd2hlbiBhdmFpbF9vdXQgPSAwIC0gcnVuIG9uZSBtb3JlXG4gICAgLy8gaW5mbGF0ZSBwYXNzLiBCdXQgaWYgb3V0cHV0IGRhdGEgbm90IGV4aXN0cywgaW5mbGF0ZSByZXR1cm4gWl9CVUZfRVJST1IuXG4gICAgLy8gSGVyZSB3ZSBzZXQgZmxhZyB0byBwcm9jZXNzIHRoaXMgZXJyb3IgcHJvcGVybHkuXG4gICAgLy9cbiAgICAvLyBOT1RFLiBEZWZsYXRlIGRvZXMgbm90IHJldHVybiBlcnJvciBpbiB0aGlzIGNhc2UgYW5kIGRvZXMgbm90IG5lZWRzIHN1Y2hcbiAgICAvLyBsb2dpYy5cbiAgICBpZiAoc3RybS5hdmFpbF9pbiA9PT0gMCAmJiBzdHJtLmF2YWlsX291dCA9PT0gMCkge1xuICAgICAgYWxsb3dCdWZFcnJvciA9IHRydWU7XG4gICAgfVxuXG4gIH0gd2hpbGUgKChzdHJtLmF2YWlsX2luID4gMCB8fCBzdHJtLmF2YWlsX291dCA9PT0gMCkgJiYgc3RhdHVzICE9PSBjLlpfU1RSRUFNX0VORCk7XG5cbiAgaWYgKHN0YXR1cyA9PT0gYy5aX1NUUkVBTV9FTkQpIHtcbiAgICBfbW9kZSA9IGMuWl9GSU5JU0g7XG4gIH1cblxuICAvLyBGaW5hbGl6ZSBvbiB0aGUgbGFzdCBjaHVuay5cbiAgaWYgKF9tb2RlID09PSBjLlpfRklOSVNIKSB7XG4gICAgc3RhdHVzID0gemxpYl9pbmZsYXRlLmluZmxhdGVFbmQodGhpcy5zdHJtKTtcbiAgICB0aGlzLm9uRW5kKHN0YXR1cyk7XG4gICAgdGhpcy5lbmRlZCA9IHRydWU7XG4gICAgcmV0dXJuIHN0YXR1cyA9PT0gYy5aX09LO1xuICB9XG5cbiAgLy8gY2FsbGJhY2sgaW50ZXJpbSByZXN1bHRzIGlmIFpfU1lOQ19GTFVTSC5cbiAgaWYgKF9tb2RlID09PSBjLlpfU1lOQ19GTFVTSCkge1xuICAgIHRoaXMub25FbmQoYy5aX09LKTtcbiAgICBzdHJtLmF2YWlsX291dCA9IDA7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cblxuLyoqXG4gKiBJbmZsYXRlI29uRGF0YShjaHVuaykgLT4gVm9pZFxuICogLSBjaHVuayAoVWludDhBcnJheXxBcnJheXxTdHJpbmcpOiBvdXB1dCBkYXRhLiBUeXBlIG9mIGFycmF5IGRlcGVuZHNcbiAqICAgb24ganMgZW5naW5lIHN1cHBvcnQuIFdoZW4gc3RyaW5nIG91dHB1dCByZXF1ZXN0ZWQsIGVhY2ggY2h1bmtcbiAqICAgd2lsbCBiZSBzdHJpbmcuXG4gKlxuICogQnkgZGVmYXVsdCwgc3RvcmVzIGRhdGEgYmxvY2tzIGluIGBjaHVua3NbXWAgcHJvcGVydHkgYW5kIGdsdWVcbiAqIHRob3NlIGluIGBvbkVuZGAuIE92ZXJyaWRlIHRoaXMgaGFuZGxlciwgaWYgeW91IG5lZWQgYW5vdGhlciBiZWhhdmlvdXIuXG4gKiovXG5JbmZsYXRlLnByb3RvdHlwZS5vbkRhdGEgPSBmdW5jdGlvbiAoY2h1bmspIHtcbiAgdGhpcy5jaHVua3MucHVzaChjaHVuayk7XG59O1xuXG5cbi8qKlxuICogSW5mbGF0ZSNvbkVuZChzdGF0dXMpIC0+IFZvaWRcbiAqIC0gc3RhdHVzIChOdW1iZXIpOiBpbmZsYXRlIHN0YXR1cy4gMCAoWl9PSykgb24gc3VjY2VzcyxcbiAqICAgb3RoZXIgaWYgbm90LlxuICpcbiAqIENhbGxlZCBlaXRoZXIgYWZ0ZXIgeW91IHRlbGwgaW5mbGF0ZSB0aGF0IHRoZSBpbnB1dCBzdHJlYW0gaXNcbiAqIGNvbXBsZXRlIChaX0ZJTklTSCkgb3Igc2hvdWxkIGJlIGZsdXNoZWQgKFpfU1lOQ19GTFVTSClcbiAqIG9yIGlmIGFuIGVycm9yIGhhcHBlbmVkLiBCeSBkZWZhdWx0IC0gam9pbiBjb2xsZWN0ZWQgY2h1bmtzLFxuICogZnJlZSBtZW1vcnkgYW5kIGZpbGwgYHJlc3VsdHNgIC8gYGVycmAgcHJvcGVydGllcy5cbiAqKi9cbkluZmxhdGUucHJvdG90eXBlLm9uRW5kID0gZnVuY3Rpb24gKHN0YXR1cykge1xuICAvLyBPbiBzdWNjZXNzIC0gam9pblxuICBpZiAoc3RhdHVzID09PSBjLlpfT0spIHtcbiAgICBpZiAodGhpcy5vcHRpb25zLnRvID09PSAnc3RyaW5nJykge1xuICAgICAgLy8gR2x1ZSAmIGNvbnZlcnQgaGVyZSwgdW50aWwgd2UgdGVhY2ggcGFrbyB0byBzZW5kXG4gICAgICAvLyB1dGY4IGFsbGlnbmVkIHN0cmluZ3MgdG8gb25EYXRhXG4gICAgICB0aGlzLnJlc3VsdCA9IHRoaXMuY2h1bmtzLmpvaW4oJycpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnJlc3VsdCA9IHV0aWxzLmZsYXR0ZW5DaHVua3ModGhpcy5jaHVua3MpO1xuICAgIH1cbiAgfVxuICB0aGlzLmNodW5rcyA9IFtdO1xuICB0aGlzLmVyciA9IHN0YXR1cztcbiAgdGhpcy5tc2cgPSB0aGlzLnN0cm0ubXNnO1xufTtcblxuXG4vKipcbiAqIGluZmxhdGUoZGF0YVssIG9wdGlvbnNdKSAtPiBVaW50OEFycmF5fEFycmF5fFN0cmluZ1xuICogLSBkYXRhIChVaW50OEFycmF5fEFycmF5fFN0cmluZyk6IGlucHV0IGRhdGEgdG8gZGVjb21wcmVzcy5cbiAqIC0gb3B0aW9ucyAoT2JqZWN0KTogemxpYiBpbmZsYXRlIG9wdGlvbnMuXG4gKlxuICogRGVjb21wcmVzcyBgZGF0YWAgd2l0aCBpbmZsYXRlL3VuZ3ppcCBhbmQgYG9wdGlvbnNgLiBBdXRvZGV0ZWN0XG4gKiBmb3JtYXQgdmlhIHdyYXBwZXIgaGVhZGVyIGJ5IGRlZmF1bHQuIFRoYXQncyB3aHkgd2UgZG9uJ3QgcHJvdmlkZVxuICogc2VwYXJhdGUgYHVuZ3ppcGAgbWV0aG9kLlxuICpcbiAqIFN1cHBvcnRlZCBvcHRpb25zIGFyZTpcbiAqXG4gKiAtIHdpbmRvd0JpdHNcbiAqXG4gKiBbaHR0cDovL3psaWIubmV0L21hbnVhbC5odG1sI0FkdmFuY2VkXShodHRwOi8vemxpYi5uZXQvbWFudWFsLmh0bWwjQWR2YW5jZWQpXG4gKiBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAqXG4gKiBTdWdhciAob3B0aW9ucyk6XG4gKlxuICogLSBgcmF3YCAoQm9vbGVhbikgLSBzYXkgdGhhdCB3ZSB3b3JrIHdpdGggcmF3IHN0cmVhbSwgaWYgeW91IGRvbid0IHdpc2ggdG8gc3BlY2lmeVxuICogICBuZWdhdGl2ZSB3aW5kb3dCaXRzIGltcGxpY2l0bHkuXG4gKiAtIGB0b2AgKFN0cmluZykgLSBpZiBlcXVhbCB0byAnc3RyaW5nJywgdGhlbiByZXN1bHQgd2lsbCBiZSBjb252ZXJ0ZWRcbiAqICAgZnJvbSB1dGY4IHRvIHV0ZjE2IChqYXZhc2NyaXB0KSBzdHJpbmcuIFdoZW4gc3RyaW5nIG91dHB1dCByZXF1ZXN0ZWQsXG4gKiAgIGNodW5rIGxlbmd0aCBjYW4gZGlmZmVyIGZyb20gYGNodW5rU2l6ZWAsIGRlcGVuZGluZyBvbiBjb250ZW50LlxuICpcbiAqXG4gKiAjIyMjIyBFeGFtcGxlOlxuICpcbiAqIGBgYGphdmFzY3JpcHRcbiAqIHZhciBwYWtvID0gcmVxdWlyZSgncGFrbycpXG4gKiAgICwgaW5wdXQgPSBwYWtvLmRlZmxhdGUoWzEsMiwzLDQsNSw2LDcsOCw5XSlcbiAqICAgLCBvdXRwdXQ7XG4gKlxuICogdHJ5IHtcbiAqICAgb3V0cHV0ID0gcGFrby5pbmZsYXRlKGlucHV0KTtcbiAqIH0gY2F0Y2ggKGVycilcbiAqICAgY29uc29sZS5sb2coZXJyKTtcbiAqIH1cbiAqIGBgYFxuICoqL1xuZnVuY3Rpb24gaW5mbGF0ZShpbnB1dCwgb3B0aW9ucykge1xuICB2YXIgaW5mbGF0b3IgPSBuZXcgSW5mbGF0ZShvcHRpb25zKTtcblxuICBpbmZsYXRvci5wdXNoKGlucHV0LCB0cnVlKTtcblxuICAvLyBUaGF0IHdpbGwgbmV2ZXIgaGFwcGVucywgaWYgeW91IGRvbid0IGNoZWF0IHdpdGggb3B0aW9ucyA6KVxuICBpZiAoaW5mbGF0b3IuZXJyKSB7IHRocm93IGluZmxhdG9yLm1zZyB8fCBtc2dbaW5mbGF0b3IuZXJyXTsgfVxuXG4gIHJldHVybiBpbmZsYXRvci5yZXN1bHQ7XG59XG5cblxuLyoqXG4gKiBpbmZsYXRlUmF3KGRhdGFbLCBvcHRpb25zXSkgLT4gVWludDhBcnJheXxBcnJheXxTdHJpbmdcbiAqIC0gZGF0YSAoVWludDhBcnJheXxBcnJheXxTdHJpbmcpOiBpbnB1dCBkYXRhIHRvIGRlY29tcHJlc3MuXG4gKiAtIG9wdGlvbnMgKE9iamVjdCk6IHpsaWIgaW5mbGF0ZSBvcHRpb25zLlxuICpcbiAqIFRoZSBzYW1lIGFzIFtbaW5mbGF0ZV1dLCBidXQgY3JlYXRlcyByYXcgZGF0YSwgd2l0aG91dCB3cmFwcGVyXG4gKiAoaGVhZGVyIGFuZCBhZGxlcjMyIGNyYykuXG4gKiovXG5mdW5jdGlvbiBpbmZsYXRlUmF3KGlucHV0LCBvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICBvcHRpb25zLnJhdyA9IHRydWU7XG4gIHJldHVybiBpbmZsYXRlKGlucHV0LCBvcHRpb25zKTtcbn1cblxuXG4vKipcbiAqIHVuZ3ppcChkYXRhWywgb3B0aW9uc10pIC0+IFVpbnQ4QXJyYXl8QXJyYXl8U3RyaW5nXG4gKiAtIGRhdGEgKFVpbnQ4QXJyYXl8QXJyYXl8U3RyaW5nKTogaW5wdXQgZGF0YSB0byBkZWNvbXByZXNzLlxuICogLSBvcHRpb25zIChPYmplY3QpOiB6bGliIGluZmxhdGUgb3B0aW9ucy5cbiAqXG4gKiBKdXN0IHNob3J0Y3V0IHRvIFtbaW5mbGF0ZV1dLCBiZWNhdXNlIGl0IGF1dG9kZXRlY3RzIGZvcm1hdFxuICogYnkgaGVhZGVyLmNvbnRlbnQuIERvbmUgZm9yIGNvbnZlbmllbmNlLlxuICoqL1xuXG5cbmV4cG9ydHMuSW5mbGF0ZSA9IEluZmxhdGU7XG5leHBvcnRzLmluZmxhdGUgPSBpbmZsYXRlO1xuZXhwb3J0cy5pbmZsYXRlUmF3ID0gaW5mbGF0ZVJhdztcbmV4cG9ydHMudW5nemlwICA9IGluZmxhdGU7XG5cbn0se1wiLi91dGlscy9jb21tb25cIjo0MSxcIi4vdXRpbHMvc3RyaW5nc1wiOjQyLFwiLi96bGliL2NvbnN0YW50c1wiOjQ0LFwiLi96bGliL2d6aGVhZGVyXCI6NDcsXCIuL3psaWIvaW5mbGF0ZVwiOjQ5LFwiLi96bGliL21lc3NhZ2VzXCI6NTEsXCIuL3psaWIvenN0cmVhbVwiOjUzfV0sNDE6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXG5cbnZhciBUWVBFRF9PSyA9ICAodHlwZW9mIFVpbnQ4QXJyYXkgIT09ICd1bmRlZmluZWQnKSAmJlxuICAgICAgICAgICAgICAgICh0eXBlb2YgVWludDE2QXJyYXkgIT09ICd1bmRlZmluZWQnKSAmJlxuICAgICAgICAgICAgICAgICh0eXBlb2YgSW50MzJBcnJheSAhPT0gJ3VuZGVmaW5lZCcpO1xuXG5cbmV4cG9ydHMuYXNzaWduID0gZnVuY3Rpb24gKG9iaiAvKmZyb20xLCBmcm9tMiwgZnJvbTMsIC4uLiovKSB7XG4gIHZhciBzb3VyY2VzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgd2hpbGUgKHNvdXJjZXMubGVuZ3RoKSB7XG4gICAgdmFyIHNvdXJjZSA9IHNvdXJjZXMuc2hpZnQoKTtcbiAgICBpZiAoIXNvdXJjZSkgeyBjb250aW51ZTsgfVxuXG4gICAgaWYgKHR5cGVvZiBzb3VyY2UgIT09ICdvYmplY3QnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKHNvdXJjZSArICdtdXN0IGJlIG5vbi1vYmplY3QnKTtcbiAgICB9XG5cbiAgICBmb3IgKHZhciBwIGluIHNvdXJjZSkge1xuICAgICAgaWYgKHNvdXJjZS5oYXNPd25Qcm9wZXJ0eShwKSkge1xuICAgICAgICBvYmpbcF0gPSBzb3VyY2VbcF07XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG9iajtcbn07XG5cblxuLy8gcmVkdWNlIGJ1ZmZlciBzaXplLCBhdm9pZGluZyBtZW0gY29weVxuZXhwb3J0cy5zaHJpbmtCdWYgPSBmdW5jdGlvbiAoYnVmLCBzaXplKSB7XG4gIGlmIChidWYubGVuZ3RoID09PSBzaXplKSB7IHJldHVybiBidWY7IH1cbiAgaWYgKGJ1Zi5zdWJhcnJheSkgeyByZXR1cm4gYnVmLnN1YmFycmF5KDAsIHNpemUpOyB9XG4gIGJ1Zi5sZW5ndGggPSBzaXplO1xuICByZXR1cm4gYnVmO1xufTtcblxuXG52YXIgZm5UeXBlZCA9IHtcbiAgYXJyYXlTZXQ6IGZ1bmN0aW9uIChkZXN0LCBzcmMsIHNyY19vZmZzLCBsZW4sIGRlc3Rfb2Zmcykge1xuICAgIGlmIChzcmMuc3ViYXJyYXkgJiYgZGVzdC5zdWJhcnJheSkge1xuICAgICAgZGVzdC5zZXQoc3JjLnN1YmFycmF5KHNyY19vZmZzLCBzcmNfb2ZmcyArIGxlbiksIGRlc3Rfb2Zmcyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIEZhbGxiYWNrIHRvIG9yZGluYXJ5IGFycmF5XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgZGVzdFtkZXN0X29mZnMgKyBpXSA9IHNyY1tzcmNfb2ZmcyArIGldO1xuICAgIH1cbiAgfSxcbiAgLy8gSm9pbiBhcnJheSBvZiBjaHVua3MgdG8gc2luZ2xlIGFycmF5LlxuICBmbGF0dGVuQ2h1bmtzOiBmdW5jdGlvbiAoY2h1bmtzKSB7XG4gICAgdmFyIGksIGwsIGxlbiwgcG9zLCBjaHVuaywgcmVzdWx0O1xuXG4gICAgLy8gY2FsY3VsYXRlIGRhdGEgbGVuZ3RoXG4gICAgbGVuID0gMDtcbiAgICBmb3IgKGkgPSAwLCBsID0gY2h1bmtzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgbGVuICs9IGNodW5rc1tpXS5sZW5ndGg7XG4gICAgfVxuXG4gICAgLy8gam9pbiBjaHVua3NcbiAgICByZXN1bHQgPSBuZXcgVWludDhBcnJheShsZW4pO1xuICAgIHBvcyA9IDA7XG4gICAgZm9yIChpID0gMCwgbCA9IGNodW5rcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIGNodW5rID0gY2h1bmtzW2ldO1xuICAgICAgcmVzdWx0LnNldChjaHVuaywgcG9zKTtcbiAgICAgIHBvcyArPSBjaHVuay5sZW5ndGg7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxufTtcblxudmFyIGZuVW50eXBlZCA9IHtcbiAgYXJyYXlTZXQ6IGZ1bmN0aW9uIChkZXN0LCBzcmMsIHNyY19vZmZzLCBsZW4sIGRlc3Rfb2Zmcykge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGRlc3RbZGVzdF9vZmZzICsgaV0gPSBzcmNbc3JjX29mZnMgKyBpXTtcbiAgICB9XG4gIH0sXG4gIC8vIEpvaW4gYXJyYXkgb2YgY2h1bmtzIHRvIHNpbmdsZSBhcnJheS5cbiAgZmxhdHRlbkNodW5rczogZnVuY3Rpb24gKGNodW5rcykge1xuICAgIHJldHVybiBbXS5jb25jYXQuYXBwbHkoW10sIGNodW5rcyk7XG4gIH1cbn07XG5cblxuLy8gRW5hYmxlL0Rpc2FibGUgdHlwZWQgYXJyYXlzIHVzZSwgZm9yIHRlc3Rpbmdcbi8vXG5leHBvcnRzLnNldFR5cGVkID0gZnVuY3Rpb24gKG9uKSB7XG4gIGlmIChvbikge1xuICAgIGV4cG9ydHMuQnVmOCAgPSBVaW50OEFycmF5O1xuICAgIGV4cG9ydHMuQnVmMTYgPSBVaW50MTZBcnJheTtcbiAgICBleHBvcnRzLkJ1ZjMyID0gSW50MzJBcnJheTtcbiAgICBleHBvcnRzLmFzc2lnbihleHBvcnRzLCBmblR5cGVkKTtcbiAgfSBlbHNlIHtcbiAgICBleHBvcnRzLkJ1ZjggID0gQXJyYXk7XG4gICAgZXhwb3J0cy5CdWYxNiA9IEFycmF5O1xuICAgIGV4cG9ydHMuQnVmMzIgPSBBcnJheTtcbiAgICBleHBvcnRzLmFzc2lnbihleHBvcnRzLCBmblVudHlwZWQpO1xuICB9XG59O1xuXG5leHBvcnRzLnNldFR5cGVkKFRZUEVEX09LKTtcblxufSx7fV0sNDI6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXG5cbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vY29tbW9uJyk7XG5cblxuLy8gUXVpY2sgY2hlY2sgaWYgd2UgY2FuIHVzZSBmYXN0IGFycmF5IHRvIGJpbiBzdHJpbmcgY29udmVyc2lvblxuLy9cbi8vIC0gYXBwbHkoQXJyYXkpIGNhbiBmYWlsIG9uIEFuZHJvaWQgMi4yXG4vLyAtIGFwcGx5KFVpbnQ4QXJyYXkpIGNhbiBmYWlsIG9uIGlPUyA1LjEgU2FmYXJ5XG4vL1xudmFyIFNUUl9BUFBMWV9PSyA9IHRydWU7XG52YXIgU1RSX0FQUExZX1VJQV9PSyA9IHRydWU7XG5cbnRyeSB7IFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkobnVsbCwgWyAwIF0pOyB9IGNhdGNoIChfXykgeyBTVFJfQVBQTFlfT0sgPSBmYWxzZTsgfVxudHJ5IHsgU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShudWxsLCBuZXcgVWludDhBcnJheSgxKSk7IH0gY2F0Y2ggKF9fKSB7IFNUUl9BUFBMWV9VSUFfT0sgPSBmYWxzZTsgfVxuXG5cbi8vIFRhYmxlIHdpdGggdXRmOCBsZW5ndGhzIChjYWxjdWxhdGVkIGJ5IGZpcnN0IGJ5dGUgb2Ygc2VxdWVuY2UpXG4vLyBOb3RlLCB0aGF0IDUgJiA2LWJ5dGUgdmFsdWVzIGFuZCBzb21lIDQtYnl0ZSB2YWx1ZXMgY2FuIG5vdCBiZSByZXByZXNlbnRlZCBpbiBKUyxcbi8vIGJlY2F1c2UgbWF4IHBvc3NpYmxlIGNvZGVwb2ludCBpcyAweDEwZmZmZlxudmFyIF91dGY4bGVuID0gbmV3IHV0aWxzLkJ1ZjgoMjU2KTtcbmZvciAodmFyIHEgPSAwOyBxIDwgMjU2OyBxKyspIHtcbiAgX3V0ZjhsZW5bcV0gPSAocSA+PSAyNTIgPyA2IDogcSA+PSAyNDggPyA1IDogcSA+PSAyNDAgPyA0IDogcSA+PSAyMjQgPyAzIDogcSA+PSAxOTIgPyAyIDogMSk7XG59XG5fdXRmOGxlblsyNTRdID0gX3V0ZjhsZW5bMjU0XSA9IDE7IC8vIEludmFsaWQgc2VxdWVuY2Ugc3RhcnRcblxuXG4vLyBjb252ZXJ0IHN0cmluZyB0byBhcnJheSAodHlwZWQsIHdoZW4gcG9zc2libGUpXG5leHBvcnRzLnN0cmluZzJidWYgPSBmdW5jdGlvbiAoc3RyKSB7XG4gIHZhciBidWYsIGMsIGMyLCBtX3BvcywgaSwgc3RyX2xlbiA9IHN0ci5sZW5ndGgsIGJ1Zl9sZW4gPSAwO1xuXG4gIC8vIGNvdW50IGJpbmFyeSBzaXplXG4gIGZvciAobV9wb3MgPSAwOyBtX3BvcyA8IHN0cl9sZW47IG1fcG9zKyspIHtcbiAgICBjID0gc3RyLmNoYXJDb2RlQXQobV9wb3MpO1xuICAgIGlmICgoYyAmIDB4ZmMwMCkgPT09IDB4ZDgwMCAmJiAobV9wb3MgKyAxIDwgc3RyX2xlbikpIHtcbiAgICAgIGMyID0gc3RyLmNoYXJDb2RlQXQobV9wb3MgKyAxKTtcbiAgICAgIGlmICgoYzIgJiAweGZjMDApID09PSAweGRjMDApIHtcbiAgICAgICAgYyA9IDB4MTAwMDAgKyAoKGMgLSAweGQ4MDApIDw8IDEwKSArIChjMiAtIDB4ZGMwMCk7XG4gICAgICAgIG1fcG9zKys7XG4gICAgICB9XG4gICAgfVxuICAgIGJ1Zl9sZW4gKz0gYyA8IDB4ODAgPyAxIDogYyA8IDB4ODAwID8gMiA6IGMgPCAweDEwMDAwID8gMyA6IDQ7XG4gIH1cblxuICAvLyBhbGxvY2F0ZSBidWZmZXJcbiAgYnVmID0gbmV3IHV0aWxzLkJ1ZjgoYnVmX2xlbik7XG5cbiAgLy8gY29udmVydFxuICBmb3IgKGkgPSAwLCBtX3BvcyA9IDA7IGkgPCBidWZfbGVuOyBtX3BvcysrKSB7XG4gICAgYyA9IHN0ci5jaGFyQ29kZUF0KG1fcG9zKTtcbiAgICBpZiAoKGMgJiAweGZjMDApID09PSAweGQ4MDAgJiYgKG1fcG9zICsgMSA8IHN0cl9sZW4pKSB7XG4gICAgICBjMiA9IHN0ci5jaGFyQ29kZUF0KG1fcG9zICsgMSk7XG4gICAgICBpZiAoKGMyICYgMHhmYzAwKSA9PT0gMHhkYzAwKSB7XG4gICAgICAgIGMgPSAweDEwMDAwICsgKChjIC0gMHhkODAwKSA8PCAxMCkgKyAoYzIgLSAweGRjMDApO1xuICAgICAgICBtX3BvcysrO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoYyA8IDB4ODApIHtcbiAgICAgIC8qIG9uZSBieXRlICovXG4gICAgICBidWZbaSsrXSA9IGM7XG4gICAgfSBlbHNlIGlmIChjIDwgMHg4MDApIHtcbiAgICAgIC8qIHR3byBieXRlcyAqL1xuICAgICAgYnVmW2krK10gPSAweEMwIHwgKGMgPj4+IDYpO1xuICAgICAgYnVmW2krK10gPSAweDgwIHwgKGMgJiAweDNmKTtcbiAgICB9IGVsc2UgaWYgKGMgPCAweDEwMDAwKSB7XG4gICAgICAvKiB0aHJlZSBieXRlcyAqL1xuICAgICAgYnVmW2krK10gPSAweEUwIHwgKGMgPj4+IDEyKTtcbiAgICAgIGJ1ZltpKytdID0gMHg4MCB8IChjID4+PiA2ICYgMHgzZik7XG4gICAgICBidWZbaSsrXSA9IDB4ODAgfCAoYyAmIDB4M2YpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvKiBmb3VyIGJ5dGVzICovXG4gICAgICBidWZbaSsrXSA9IDB4ZjAgfCAoYyA+Pj4gMTgpO1xuICAgICAgYnVmW2krK10gPSAweDgwIHwgKGMgPj4+IDEyICYgMHgzZik7XG4gICAgICBidWZbaSsrXSA9IDB4ODAgfCAoYyA+Pj4gNiAmIDB4M2YpO1xuICAgICAgYnVmW2krK10gPSAweDgwIHwgKGMgJiAweDNmKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYnVmO1xufTtcblxuLy8gSGVscGVyICh1c2VkIGluIDIgcGxhY2VzKVxuZnVuY3Rpb24gYnVmMmJpbnN0cmluZyhidWYsIGxlbikge1xuICAvLyB1c2UgZmFsbGJhY2sgZm9yIGJpZyBhcnJheXMgdG8gYXZvaWQgc3RhY2sgb3ZlcmZsb3dcbiAgaWYgKGxlbiA8IDY1NTM3KSB7XG4gICAgaWYgKChidWYuc3ViYXJyYXkgJiYgU1RSX0FQUExZX1VJQV9PSykgfHwgKCFidWYuc3ViYXJyYXkgJiYgU1RSX0FQUExZX09LKSkge1xuICAgICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkobnVsbCwgdXRpbHMuc2hyaW5rQnVmKGJ1ZiwgbGVuKSk7XG4gICAgfVxuICB9XG5cbiAgdmFyIHJlc3VsdCA9ICcnO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgcmVzdWx0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnVmW2ldKTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5cbi8vIENvbnZlcnQgYnl0ZSBhcnJheSB0byBiaW5hcnkgc3RyaW5nXG5leHBvcnRzLmJ1ZjJiaW5zdHJpbmcgPSBmdW5jdGlvbiAoYnVmKSB7XG4gIHJldHVybiBidWYyYmluc3RyaW5nKGJ1ZiwgYnVmLmxlbmd0aCk7XG59O1xuXG5cbi8vIENvbnZlcnQgYmluYXJ5IHN0cmluZyAodHlwZWQsIHdoZW4gcG9zc2libGUpXG5leHBvcnRzLmJpbnN0cmluZzJidWYgPSBmdW5jdGlvbiAoc3RyKSB7XG4gIHZhciBidWYgPSBuZXcgdXRpbHMuQnVmOChzdHIubGVuZ3RoKTtcbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGJ1Zi5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgIGJ1ZltpXSA9IHN0ci5jaGFyQ29kZUF0KGkpO1xuICB9XG4gIHJldHVybiBidWY7XG59O1xuXG5cbi8vIGNvbnZlcnQgYXJyYXkgdG8gc3RyaW5nXG5leHBvcnRzLmJ1ZjJzdHJpbmcgPSBmdW5jdGlvbiAoYnVmLCBtYXgpIHtcbiAgdmFyIGksIG91dCwgYywgY19sZW47XG4gIHZhciBsZW4gPSBtYXggfHwgYnVmLmxlbmd0aDtcblxuICAvLyBSZXNlcnZlIG1heCBwb3NzaWJsZSBsZW5ndGggKDIgd29yZHMgcGVyIGNoYXIpXG4gIC8vIE5COiBieSB1bmtub3duIHJlYXNvbnMsIEFycmF5IGlzIHNpZ25pZmljYW50bHkgZmFzdGVyIGZvclxuICAvLyAgICAgU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseSB0aGFuIFVpbnQxNkFycmF5LlxuICB2YXIgdXRmMTZidWYgPSBuZXcgQXJyYXkobGVuICogMik7XG5cbiAgZm9yIChvdXQgPSAwLCBpID0gMDsgaSA8IGxlbjspIHtcbiAgICBjID0gYnVmW2krK107XG4gICAgLy8gcXVpY2sgcHJvY2VzcyBhc2NpaVxuICAgIGlmIChjIDwgMHg4MCkgeyB1dGYxNmJ1ZltvdXQrK10gPSBjOyBjb250aW51ZTsgfVxuXG4gICAgY19sZW4gPSBfdXRmOGxlbltjXTtcbiAgICAvLyBza2lwIDUgJiA2IGJ5dGUgY29kZXNcbiAgICBpZiAoY19sZW4gPiA0KSB7IHV0ZjE2YnVmW291dCsrXSA9IDB4ZmZmZDsgaSArPSBjX2xlbiAtIDE7IGNvbnRpbnVlOyB9XG5cbiAgICAvLyBhcHBseSBtYXNrIG9uIGZpcnN0IGJ5dGVcbiAgICBjICY9IGNfbGVuID09PSAyID8gMHgxZiA6IGNfbGVuID09PSAzID8gMHgwZiA6IDB4MDc7XG4gICAgLy8gam9pbiB0aGUgcmVzdFxuICAgIHdoaWxlIChjX2xlbiA+IDEgJiYgaSA8IGxlbikge1xuICAgICAgYyA9IChjIDw8IDYpIHwgKGJ1ZltpKytdICYgMHgzZik7XG4gICAgICBjX2xlbi0tO1xuICAgIH1cblxuICAgIC8vIHRlcm1pbmF0ZWQgYnkgZW5kIG9mIHN0cmluZz9cbiAgICBpZiAoY19sZW4gPiAxKSB7IHV0ZjE2YnVmW291dCsrXSA9IDB4ZmZmZDsgY29udGludWU7IH1cblxuICAgIGlmIChjIDwgMHgxMDAwMCkge1xuICAgICAgdXRmMTZidWZbb3V0KytdID0gYztcbiAgICB9IGVsc2Uge1xuICAgICAgYyAtPSAweDEwMDAwO1xuICAgICAgdXRmMTZidWZbb3V0KytdID0gMHhkODAwIHwgKChjID4+IDEwKSAmIDB4M2ZmKTtcbiAgICAgIHV0ZjE2YnVmW291dCsrXSA9IDB4ZGMwMCB8IChjICYgMHgzZmYpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBidWYyYmluc3RyaW5nKHV0ZjE2YnVmLCBvdXQpO1xufTtcblxuXG4vLyBDYWxjdWxhdGUgbWF4IHBvc3NpYmxlIHBvc2l0aW9uIGluIHV0ZjggYnVmZmVyLFxuLy8gdGhhdCB3aWxsIG5vdCBicmVhayBzZXF1ZW5jZS4gSWYgdGhhdCdzIG5vdCBwb3NzaWJsZVxuLy8gLSAodmVyeSBzbWFsbCBsaW1pdHMpIHJldHVybiBtYXggc2l6ZSBhcyBpcy5cbi8vXG4vLyBidWZbXSAtIHV0ZjggYnl0ZXMgYXJyYXlcbi8vIG1heCAgIC0gbGVuZ3RoIGxpbWl0IChtYW5kYXRvcnkpO1xuZXhwb3J0cy51dGY4Ym9yZGVyID0gZnVuY3Rpb24gKGJ1ZiwgbWF4KSB7XG4gIHZhciBwb3M7XG5cbiAgbWF4ID0gbWF4IHx8IGJ1Zi5sZW5ndGg7XG4gIGlmIChtYXggPiBidWYubGVuZ3RoKSB7IG1heCA9IGJ1Zi5sZW5ndGg7IH1cblxuICAvLyBnbyBiYWNrIGZyb20gbGFzdCBwb3NpdGlvbiwgdW50aWwgc3RhcnQgb2Ygc2VxdWVuY2UgZm91bmRcbiAgcG9zID0gbWF4IC0gMTtcbiAgd2hpbGUgKHBvcyA+PSAwICYmIChidWZbcG9zXSAmIDB4QzApID09PSAweDgwKSB7IHBvcy0tOyB9XG5cbiAgLy8gRnVja3VwIC0gdmVyeSBzbWFsbCBhbmQgYnJva2VuIHNlcXVlbmNlLFxuICAvLyByZXR1cm4gbWF4LCBiZWNhdXNlIHdlIHNob3VsZCByZXR1cm4gc29tZXRoaW5nIGFueXdheS5cbiAgaWYgKHBvcyA8IDApIHsgcmV0dXJuIG1heDsgfVxuXG4gIC8vIElmIHdlIGNhbWUgdG8gc3RhcnQgb2YgYnVmZmVyIC0gdGhhdCBtZWFucyB2dWZmZXIgaXMgdG9vIHNtYWxsLFxuICAvLyByZXR1cm4gbWF4IHRvby5cbiAgaWYgKHBvcyA9PT0gMCkgeyByZXR1cm4gbWF4OyB9XG5cbiAgcmV0dXJuIChwb3MgKyBfdXRmOGxlbltidWZbcG9zXV0gPiBtYXgpID8gcG9zIDogbWF4O1xufTtcblxufSx7XCIuL2NvbW1vblwiOjQxfV0sNDM6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXG4vLyBOb3RlOiBhZGxlcjMyIHRha2VzIDEyJSBmb3IgbGV2ZWwgMCBhbmQgMiUgZm9yIGxldmVsIDYuXG4vLyBJdCBkb2Vzbid0IHdvcnRoIHRvIG1ha2UgYWRkaXRpb25hbCBvcHRpbWl6YXRpb25hIGFzIGluIG9yaWdpbmFsLlxuLy8gU21hbGwgc2l6ZSBpcyBwcmVmZXJhYmxlLlxuXG4vLyAoQykgMTk5NS0yMDEzIEplYW4tbG91cCBHYWlsbHkgYW5kIE1hcmsgQWRsZXJcbi8vIChDKSAyMDE0LTIwMTcgVml0YWx5IFB1enJpbiBhbmQgQW5kcmV5IFR1cGl0c2luXG4vL1xuLy8gVGhpcyBzb2Z0d2FyZSBpcyBwcm92aWRlZCAnYXMtaXMnLCB3aXRob3V0IGFueSBleHByZXNzIG9yIGltcGxpZWRcbi8vIHdhcnJhbnR5LiBJbiBubyBldmVudCB3aWxsIHRoZSBhdXRob3JzIGJlIGhlbGQgbGlhYmxlIGZvciBhbnkgZGFtYWdlc1xuLy8gYXJpc2luZyBmcm9tIHRoZSB1c2Ugb2YgdGhpcyBzb2Z0d2FyZS5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGdyYW50ZWQgdG8gYW55b25lIHRvIHVzZSB0aGlzIHNvZnR3YXJlIGZvciBhbnkgcHVycG9zZSxcbi8vIGluY2x1ZGluZyBjb21tZXJjaWFsIGFwcGxpY2F0aW9ucywgYW5kIHRvIGFsdGVyIGl0IGFuZCByZWRpc3RyaWJ1dGUgaXRcbi8vIGZyZWVseSwgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIHJlc3RyaWN0aW9uczpcbi8vXG4vLyAxLiBUaGUgb3JpZ2luIG9mIHRoaXMgc29mdHdhcmUgbXVzdCBub3QgYmUgbWlzcmVwcmVzZW50ZWQ7IHlvdSBtdXN0IG5vdFxuLy8gICBjbGFpbSB0aGF0IHlvdSB3cm90ZSB0aGUgb3JpZ2luYWwgc29mdHdhcmUuIElmIHlvdSB1c2UgdGhpcyBzb2Z0d2FyZVxuLy8gICBpbiBhIHByb2R1Y3QsIGFuIGFja25vd2xlZGdtZW50IGluIHRoZSBwcm9kdWN0IGRvY3VtZW50YXRpb24gd291bGQgYmVcbi8vICAgYXBwcmVjaWF0ZWQgYnV0IGlzIG5vdCByZXF1aXJlZC5cbi8vIDIuIEFsdGVyZWQgc291cmNlIHZlcnNpb25zIG11c3QgYmUgcGxhaW5seSBtYXJrZWQgYXMgc3VjaCwgYW5kIG11c3Qgbm90IGJlXG4vLyAgIG1pc3JlcHJlc2VudGVkIGFzIGJlaW5nIHRoZSBvcmlnaW5hbCBzb2Z0d2FyZS5cbi8vIDMuIFRoaXMgbm90aWNlIG1heSBub3QgYmUgcmVtb3ZlZCBvciBhbHRlcmVkIGZyb20gYW55IHNvdXJjZSBkaXN0cmlidXRpb24uXG5cbmZ1bmN0aW9uIGFkbGVyMzIoYWRsZXIsIGJ1ZiwgbGVuLCBwb3MpIHtcbiAgdmFyIHMxID0gKGFkbGVyICYgMHhmZmZmKSB8MCxcbiAgICAgIHMyID0gKChhZGxlciA+Pj4gMTYpICYgMHhmZmZmKSB8MCxcbiAgICAgIG4gPSAwO1xuXG4gIHdoaWxlIChsZW4gIT09IDApIHtcbiAgICAvLyBTZXQgbGltaXQgfiB0d2ljZSBsZXNzIHRoYW4gNTU1MiwgdG8ga2VlcFxuICAgIC8vIHMyIGluIDMxLWJpdHMsIGJlY2F1c2Ugd2UgZm9yY2Ugc2lnbmVkIGludHMuXG4gICAgLy8gaW4gb3RoZXIgY2FzZSAlPSB3aWxsIGZhaWwuXG4gICAgbiA9IGxlbiA+IDIwMDAgPyAyMDAwIDogbGVuO1xuICAgIGxlbiAtPSBuO1xuXG4gICAgZG8ge1xuICAgICAgczEgPSAoczEgKyBidWZbcG9zKytdKSB8MDtcbiAgICAgIHMyID0gKHMyICsgczEpIHwwO1xuICAgIH0gd2hpbGUgKC0tbik7XG5cbiAgICBzMSAlPSA2NTUyMTtcbiAgICBzMiAlPSA2NTUyMTtcbiAgfVxuXG4gIHJldHVybiAoczEgfCAoczIgPDwgMTYpKSB8MDtcbn1cblxuXG5tb2R1bGUuZXhwb3J0cyA9IGFkbGVyMzI7XG5cbn0se31dLDQ0OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcblxuLy8gKEMpIDE5OTUtMjAxMyBKZWFuLWxvdXAgR2FpbGx5IGFuZCBNYXJrIEFkbGVyXG4vLyAoQykgMjAxNC0yMDE3IFZpdGFseSBQdXpyaW4gYW5kIEFuZHJleSBUdXBpdHNpblxuLy9cbi8vIFRoaXMgc29mdHdhcmUgaXMgcHJvdmlkZWQgJ2FzLWlzJywgd2l0aG91dCBhbnkgZXhwcmVzcyBvciBpbXBsaWVkXG4vLyB3YXJyYW50eS4gSW4gbm8gZXZlbnQgd2lsbCB0aGUgYXV0aG9ycyBiZSBoZWxkIGxpYWJsZSBmb3IgYW55IGRhbWFnZXNcbi8vIGFyaXNpbmcgZnJvbSB0aGUgdXNlIG9mIHRoaXMgc29mdHdhcmUuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBncmFudGVkIHRvIGFueW9uZSB0byB1c2UgdGhpcyBzb2Z0d2FyZSBmb3IgYW55IHB1cnBvc2UsXG4vLyBpbmNsdWRpbmcgY29tbWVyY2lhbCBhcHBsaWNhdGlvbnMsIGFuZCB0byBhbHRlciBpdCBhbmQgcmVkaXN0cmlidXRlIGl0XG4vLyBmcmVlbHksIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyByZXN0cmljdGlvbnM6XG4vL1xuLy8gMS4gVGhlIG9yaWdpbiBvZiB0aGlzIHNvZnR3YXJlIG11c3Qgbm90IGJlIG1pc3JlcHJlc2VudGVkOyB5b3UgbXVzdCBub3Rcbi8vICAgY2xhaW0gdGhhdCB5b3Ugd3JvdGUgdGhlIG9yaWdpbmFsIHNvZnR3YXJlLiBJZiB5b3UgdXNlIHRoaXMgc29mdHdhcmVcbi8vICAgaW4gYSBwcm9kdWN0LCBhbiBhY2tub3dsZWRnbWVudCBpbiB0aGUgcHJvZHVjdCBkb2N1bWVudGF0aW9uIHdvdWxkIGJlXG4vLyAgIGFwcHJlY2lhdGVkIGJ1dCBpcyBub3QgcmVxdWlyZWQuXG4vLyAyLiBBbHRlcmVkIHNvdXJjZSB2ZXJzaW9ucyBtdXN0IGJlIHBsYWlubHkgbWFya2VkIGFzIHN1Y2gsIGFuZCBtdXN0IG5vdCBiZVxuLy8gICBtaXNyZXByZXNlbnRlZCBhcyBiZWluZyB0aGUgb3JpZ2luYWwgc29mdHdhcmUuXG4vLyAzLiBUaGlzIG5vdGljZSBtYXkgbm90IGJlIHJlbW92ZWQgb3IgYWx0ZXJlZCBmcm9tIGFueSBzb3VyY2UgZGlzdHJpYnV0aW9uLlxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuICAvKiBBbGxvd2VkIGZsdXNoIHZhbHVlczsgc2VlIGRlZmxhdGUoKSBhbmQgaW5mbGF0ZSgpIGJlbG93IGZvciBkZXRhaWxzICovXG4gIFpfTk9fRkxVU0g6ICAgICAgICAgMCxcbiAgWl9QQVJUSUFMX0ZMVVNIOiAgICAxLFxuICBaX1NZTkNfRkxVU0g6ICAgICAgIDIsXG4gIFpfRlVMTF9GTFVTSDogICAgICAgMyxcbiAgWl9GSU5JU0g6ICAgICAgICAgICA0LFxuICBaX0JMT0NLOiAgICAgICAgICAgIDUsXG4gIFpfVFJFRVM6ICAgICAgICAgICAgNixcblxuICAvKiBSZXR1cm4gY29kZXMgZm9yIHRoZSBjb21wcmVzc2lvbi9kZWNvbXByZXNzaW9uIGZ1bmN0aW9ucy4gTmVnYXRpdmUgdmFsdWVzXG4gICogYXJlIGVycm9ycywgcG9zaXRpdmUgdmFsdWVzIGFyZSB1c2VkIGZvciBzcGVjaWFsIGJ1dCBub3JtYWwgZXZlbnRzLlxuICAqL1xuICBaX09LOiAgICAgICAgICAgICAgIDAsXG4gIFpfU1RSRUFNX0VORDogICAgICAgMSxcbiAgWl9ORUVEX0RJQ1Q6ICAgICAgICAyLFxuICBaX0VSUk5POiAgICAgICAgICAgLTEsXG4gIFpfU1RSRUFNX0VSUk9SOiAgICAtMixcbiAgWl9EQVRBX0VSUk9SOiAgICAgIC0zLFxuICAvL1pfTUVNX0VSUk9SOiAgICAgLTQsXG4gIFpfQlVGX0VSUk9SOiAgICAgICAtNSxcbiAgLy9aX1ZFUlNJT05fRVJST1I6IC02LFxuXG4gIC8qIGNvbXByZXNzaW9uIGxldmVscyAqL1xuICBaX05PX0NPTVBSRVNTSU9OOiAgICAgICAgIDAsXG4gIFpfQkVTVF9TUEVFRDogICAgICAgICAgICAgMSxcbiAgWl9CRVNUX0NPTVBSRVNTSU9OOiAgICAgICA5LFxuICBaX0RFRkFVTFRfQ09NUFJFU1NJT046ICAgLTEsXG5cblxuICBaX0ZJTFRFUkVEOiAgICAgICAgICAgICAgIDEsXG4gIFpfSFVGRk1BTl9PTkxZOiAgICAgICAgICAgMixcbiAgWl9STEU6ICAgICAgICAgICAgICAgICAgICAzLFxuICBaX0ZJWEVEOiAgICAgICAgICAgICAgICAgIDQsXG4gIFpfREVGQVVMVF9TVFJBVEVHWTogICAgICAgMCxcblxuICAvKiBQb3NzaWJsZSB2YWx1ZXMgb2YgdGhlIGRhdGFfdHlwZSBmaWVsZCAodGhvdWdoIHNlZSBpbmZsYXRlKCkpICovXG4gIFpfQklOQVJZOiAgICAgICAgICAgICAgICAgMCxcbiAgWl9URVhUOiAgICAgICAgICAgICAgICAgICAxLFxuICAvL1pfQVNDSUk6ICAgICAgICAgICAgICAgIDEsIC8vID0gWl9URVhUIChkZXByZWNhdGVkKVxuICBaX1VOS05PV046ICAgICAgICAgICAgICAgIDIsXG5cbiAgLyogVGhlIGRlZmxhdGUgY29tcHJlc3Npb24gbWV0aG9kICovXG4gIFpfREVGTEFURUQ6ICAgICAgICAgICAgICAgOFxuICAvL1pfTlVMTDogICAgICAgICAgICAgICAgIG51bGwgLy8gVXNlIC0xIG9yIG51bGwgaW5saW5lLCBkZXBlbmRpbmcgb24gdmFyIHR5cGVcbn07XG5cbn0se31dLDQ1OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcblxuLy8gTm90ZTogd2UgY2FuJ3QgZ2V0IHNpZ25pZmljYW50IHNwZWVkIGJvb3N0IGhlcmUuXG4vLyBTbyB3cml0ZSBjb2RlIHRvIG1pbmltaXplIHNpemUgLSBubyBwcmVnZW5lcmF0ZWQgdGFibGVzXG4vLyBhbmQgYXJyYXkgdG9vbHMgZGVwZW5kZW5jaWVzLlxuXG4vLyAoQykgMTk5NS0yMDEzIEplYW4tbG91cCBHYWlsbHkgYW5kIE1hcmsgQWRsZXJcbi8vIChDKSAyMDE0LTIwMTcgVml0YWx5IFB1enJpbiBhbmQgQW5kcmV5IFR1cGl0c2luXG4vL1xuLy8gVGhpcyBzb2Z0d2FyZSBpcyBwcm92aWRlZCAnYXMtaXMnLCB3aXRob3V0IGFueSBleHByZXNzIG9yIGltcGxpZWRcbi8vIHdhcnJhbnR5LiBJbiBubyBldmVudCB3aWxsIHRoZSBhdXRob3JzIGJlIGhlbGQgbGlhYmxlIGZvciBhbnkgZGFtYWdlc1xuLy8gYXJpc2luZyBmcm9tIHRoZSB1c2Ugb2YgdGhpcyBzb2Z0d2FyZS5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGdyYW50ZWQgdG8gYW55b25lIHRvIHVzZSB0aGlzIHNvZnR3YXJlIGZvciBhbnkgcHVycG9zZSxcbi8vIGluY2x1ZGluZyBjb21tZXJjaWFsIGFwcGxpY2F0aW9ucywgYW5kIHRvIGFsdGVyIGl0IGFuZCByZWRpc3RyaWJ1dGUgaXRcbi8vIGZyZWVseSwgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIHJlc3RyaWN0aW9uczpcbi8vXG4vLyAxLiBUaGUgb3JpZ2luIG9mIHRoaXMgc29mdHdhcmUgbXVzdCBub3QgYmUgbWlzcmVwcmVzZW50ZWQ7IHlvdSBtdXN0IG5vdFxuLy8gICBjbGFpbSB0aGF0IHlvdSB3cm90ZSB0aGUgb3JpZ2luYWwgc29mdHdhcmUuIElmIHlvdSB1c2UgdGhpcyBzb2Z0d2FyZVxuLy8gICBpbiBhIHByb2R1Y3QsIGFuIGFja25vd2xlZGdtZW50IGluIHRoZSBwcm9kdWN0IGRvY3VtZW50YXRpb24gd291bGQgYmVcbi8vICAgYXBwcmVjaWF0ZWQgYnV0IGlzIG5vdCByZXF1aXJlZC5cbi8vIDIuIEFsdGVyZWQgc291cmNlIHZlcnNpb25zIG11c3QgYmUgcGxhaW5seSBtYXJrZWQgYXMgc3VjaCwgYW5kIG11c3Qgbm90IGJlXG4vLyAgIG1pc3JlcHJlc2VudGVkIGFzIGJlaW5nIHRoZSBvcmlnaW5hbCBzb2Z0d2FyZS5cbi8vIDMuIFRoaXMgbm90aWNlIG1heSBub3QgYmUgcmVtb3ZlZCBvciBhbHRlcmVkIGZyb20gYW55IHNvdXJjZSBkaXN0cmlidXRpb24uXG5cbi8vIFVzZSBvcmRpbmFyeSBhcnJheSwgc2luY2UgdW50eXBlZCBtYWtlcyBubyBib29zdCBoZXJlXG5mdW5jdGlvbiBtYWtlVGFibGUoKSB7XG4gIHZhciBjLCB0YWJsZSA9IFtdO1xuXG4gIGZvciAodmFyIG4gPSAwOyBuIDwgMjU2OyBuKyspIHtcbiAgICBjID0gbjtcbiAgICBmb3IgKHZhciBrID0gMDsgayA8IDg7IGsrKykge1xuICAgICAgYyA9ICgoYyAmIDEpID8gKDB4RURCODgzMjAgXiAoYyA+Pj4gMSkpIDogKGMgPj4+IDEpKTtcbiAgICB9XG4gICAgdGFibGVbbl0gPSBjO1xuICB9XG5cbiAgcmV0dXJuIHRhYmxlO1xufVxuXG4vLyBDcmVhdGUgdGFibGUgb24gbG9hZC4gSnVzdCAyNTUgc2lnbmVkIGxvbmdzLiBOb3QgYSBwcm9ibGVtLlxudmFyIGNyY1RhYmxlID0gbWFrZVRhYmxlKCk7XG5cblxuZnVuY3Rpb24gY3JjMzIoY3JjLCBidWYsIGxlbiwgcG9zKSB7XG4gIHZhciB0ID0gY3JjVGFibGUsXG4gICAgICBlbmQgPSBwb3MgKyBsZW47XG5cbiAgY3JjIF49IC0xO1xuXG4gIGZvciAodmFyIGkgPSBwb3M7IGkgPCBlbmQ7IGkrKykge1xuICAgIGNyYyA9IChjcmMgPj4+IDgpIF4gdFsoY3JjIF4gYnVmW2ldKSAmIDB4RkZdO1xuICB9XG5cbiAgcmV0dXJuIChjcmMgXiAoLTEpKTsgLy8gPj4+IDA7XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSBjcmMzMjtcblxufSx7fV0sNDY6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXG4vLyAoQykgMTk5NS0yMDEzIEplYW4tbG91cCBHYWlsbHkgYW5kIE1hcmsgQWRsZXJcbi8vIChDKSAyMDE0LTIwMTcgVml0YWx5IFB1enJpbiBhbmQgQW5kcmV5IFR1cGl0c2luXG4vL1xuLy8gVGhpcyBzb2Z0d2FyZSBpcyBwcm92aWRlZCAnYXMtaXMnLCB3aXRob3V0IGFueSBleHByZXNzIG9yIGltcGxpZWRcbi8vIHdhcnJhbnR5LiBJbiBubyBldmVudCB3aWxsIHRoZSBhdXRob3JzIGJlIGhlbGQgbGlhYmxlIGZvciBhbnkgZGFtYWdlc1xuLy8gYXJpc2luZyBmcm9tIHRoZSB1c2Ugb2YgdGhpcyBzb2Z0d2FyZS5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGdyYW50ZWQgdG8gYW55b25lIHRvIHVzZSB0aGlzIHNvZnR3YXJlIGZvciBhbnkgcHVycG9zZSxcbi8vIGluY2x1ZGluZyBjb21tZXJjaWFsIGFwcGxpY2F0aW9ucywgYW5kIHRvIGFsdGVyIGl0IGFuZCByZWRpc3RyaWJ1dGUgaXRcbi8vIGZyZWVseSwgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIHJlc3RyaWN0aW9uczpcbi8vXG4vLyAxLiBUaGUgb3JpZ2luIG9mIHRoaXMgc29mdHdhcmUgbXVzdCBub3QgYmUgbWlzcmVwcmVzZW50ZWQ7IHlvdSBtdXN0IG5vdFxuLy8gICBjbGFpbSB0aGF0IHlvdSB3cm90ZSB0aGUgb3JpZ2luYWwgc29mdHdhcmUuIElmIHlvdSB1c2UgdGhpcyBzb2Z0d2FyZVxuLy8gICBpbiBhIHByb2R1Y3QsIGFuIGFja25vd2xlZGdtZW50IGluIHRoZSBwcm9kdWN0IGRvY3VtZW50YXRpb24gd291bGQgYmVcbi8vICAgYXBwcmVjaWF0ZWQgYnV0IGlzIG5vdCByZXF1aXJlZC5cbi8vIDIuIEFsdGVyZWQgc291cmNlIHZlcnNpb25zIG11c3QgYmUgcGxhaW5seSBtYXJrZWQgYXMgc3VjaCwgYW5kIG11c3Qgbm90IGJlXG4vLyAgIG1pc3JlcHJlc2VudGVkIGFzIGJlaW5nIHRoZSBvcmlnaW5hbCBzb2Z0d2FyZS5cbi8vIDMuIFRoaXMgbm90aWNlIG1heSBub3QgYmUgcmVtb3ZlZCBvciBhbHRlcmVkIGZyb20gYW55IHNvdXJjZSBkaXN0cmlidXRpb24uXG5cbnZhciB1dGlscyAgID0gcmVxdWlyZSgnLi4vdXRpbHMvY29tbW9uJyk7XG52YXIgdHJlZXMgICA9IHJlcXVpcmUoJy4vdHJlZXMnKTtcbnZhciBhZGxlcjMyID0gcmVxdWlyZSgnLi9hZGxlcjMyJyk7XG52YXIgY3JjMzIgICA9IHJlcXVpcmUoJy4vY3JjMzInKTtcbnZhciBtc2cgICAgID0gcmVxdWlyZSgnLi9tZXNzYWdlcycpO1xuXG4vKiBQdWJsaWMgY29uc3RhbnRzID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0qL1xuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09Ki9cblxuXG4vKiBBbGxvd2VkIGZsdXNoIHZhbHVlczsgc2VlIGRlZmxhdGUoKSBhbmQgaW5mbGF0ZSgpIGJlbG93IGZvciBkZXRhaWxzICovXG52YXIgWl9OT19GTFVTSCAgICAgID0gMDtcbnZhciBaX1BBUlRJQUxfRkxVU0ggPSAxO1xuLy92YXIgWl9TWU5DX0ZMVVNIICAgID0gMjtcbnZhciBaX0ZVTExfRkxVU0ggICAgPSAzO1xudmFyIFpfRklOSVNIICAgICAgICA9IDQ7XG52YXIgWl9CTE9DSyAgICAgICAgID0gNTtcbi8vdmFyIFpfVFJFRVMgICAgICAgICA9IDY7XG5cblxuLyogUmV0dXJuIGNvZGVzIGZvciB0aGUgY29tcHJlc3Npb24vZGVjb21wcmVzc2lvbiBmdW5jdGlvbnMuIE5lZ2F0aXZlIHZhbHVlc1xuICogYXJlIGVycm9ycywgcG9zaXRpdmUgdmFsdWVzIGFyZSB1c2VkIGZvciBzcGVjaWFsIGJ1dCBub3JtYWwgZXZlbnRzLlxuICovXG52YXIgWl9PSyAgICAgICAgICAgID0gMDtcbnZhciBaX1NUUkVBTV9FTkQgICAgPSAxO1xuLy92YXIgWl9ORUVEX0RJQ1QgICAgID0gMjtcbi8vdmFyIFpfRVJSTk8gICAgICAgICA9IC0xO1xudmFyIFpfU1RSRUFNX0VSUk9SICA9IC0yO1xudmFyIFpfREFUQV9FUlJPUiAgICA9IC0zO1xuLy92YXIgWl9NRU1fRVJST1IgICAgID0gLTQ7XG52YXIgWl9CVUZfRVJST1IgICAgID0gLTU7XG4vL3ZhciBaX1ZFUlNJT05fRVJST1IgPSAtNjtcblxuXG4vKiBjb21wcmVzc2lvbiBsZXZlbHMgKi9cbi8vdmFyIFpfTk9fQ09NUFJFU1NJT04gICAgICA9IDA7XG4vL3ZhciBaX0JFU1RfU1BFRUQgICAgICAgICAgPSAxO1xuLy92YXIgWl9CRVNUX0NPTVBSRVNTSU9OICAgID0gOTtcbnZhciBaX0RFRkFVTFRfQ09NUFJFU1NJT04gPSAtMTtcblxuXG52YXIgWl9GSUxURVJFRCAgICAgICAgICAgID0gMTtcbnZhciBaX0hVRkZNQU5fT05MWSAgICAgICAgPSAyO1xudmFyIFpfUkxFICAgICAgICAgICAgICAgICA9IDM7XG52YXIgWl9GSVhFRCAgICAgICAgICAgICAgID0gNDtcbnZhciBaX0RFRkFVTFRfU1RSQVRFR1kgICAgPSAwO1xuXG4vKiBQb3NzaWJsZSB2YWx1ZXMgb2YgdGhlIGRhdGFfdHlwZSBmaWVsZCAodGhvdWdoIHNlZSBpbmZsYXRlKCkpICovXG4vL3ZhciBaX0JJTkFSWSAgICAgICAgICAgICAgPSAwO1xuLy92YXIgWl9URVhUICAgICAgICAgICAgICAgID0gMTtcbi8vdmFyIFpfQVNDSUkgICAgICAgICAgICAgICA9IDE7IC8vID0gWl9URVhUXG52YXIgWl9VTktOT1dOICAgICAgICAgICAgID0gMjtcblxuXG4vKiBUaGUgZGVmbGF0ZSBjb21wcmVzc2lvbiBtZXRob2QgKi9cbnZhciBaX0RFRkxBVEVEICA9IDg7XG5cbi8qPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSovXG5cblxudmFyIE1BWF9NRU1fTEVWRUwgPSA5O1xuLyogTWF4aW11bSB2YWx1ZSBmb3IgbWVtTGV2ZWwgaW4gZGVmbGF0ZUluaXQyICovXG52YXIgTUFYX1dCSVRTID0gMTU7XG4vKiAzMksgTFo3NyB3aW5kb3cgKi9cbnZhciBERUZfTUVNX0xFVkVMID0gODtcblxuXG52YXIgTEVOR1RIX0NPREVTICA9IDI5O1xuLyogbnVtYmVyIG9mIGxlbmd0aCBjb2Rlcywgbm90IGNvdW50aW5nIHRoZSBzcGVjaWFsIEVORF9CTE9DSyBjb2RlICovXG52YXIgTElURVJBTFMgICAgICA9IDI1Njtcbi8qIG51bWJlciBvZiBsaXRlcmFsIGJ5dGVzIDAuLjI1NSAqL1xudmFyIExfQ09ERVMgICAgICAgPSBMSVRFUkFMUyArIDEgKyBMRU5HVEhfQ09ERVM7XG4vKiBudW1iZXIgb2YgTGl0ZXJhbCBvciBMZW5ndGggY29kZXMsIGluY2x1ZGluZyB0aGUgRU5EX0JMT0NLIGNvZGUgKi9cbnZhciBEX0NPREVTICAgICAgID0gMzA7XG4vKiBudW1iZXIgb2YgZGlzdGFuY2UgY29kZXMgKi9cbnZhciBCTF9DT0RFUyAgICAgID0gMTk7XG4vKiBudW1iZXIgb2YgY29kZXMgdXNlZCB0byB0cmFuc2ZlciB0aGUgYml0IGxlbmd0aHMgKi9cbnZhciBIRUFQX1NJWkUgICAgID0gMiAqIExfQ09ERVMgKyAxO1xuLyogbWF4aW11bSBoZWFwIHNpemUgKi9cbnZhciBNQVhfQklUUyAgPSAxNTtcbi8qIEFsbCBjb2RlcyBtdXN0IG5vdCBleGNlZWQgTUFYX0JJVFMgYml0cyAqL1xuXG52YXIgTUlOX01BVENIID0gMztcbnZhciBNQVhfTUFUQ0ggPSAyNTg7XG52YXIgTUlOX0xPT0tBSEVBRCA9IChNQVhfTUFUQ0ggKyBNSU5fTUFUQ0ggKyAxKTtcblxudmFyIFBSRVNFVF9ESUNUID0gMHgyMDtcblxudmFyIElOSVRfU1RBVEUgPSA0MjtcbnZhciBFWFRSQV9TVEFURSA9IDY5O1xudmFyIE5BTUVfU1RBVEUgPSA3MztcbnZhciBDT01NRU5UX1NUQVRFID0gOTE7XG52YXIgSENSQ19TVEFURSA9IDEwMztcbnZhciBCVVNZX1NUQVRFID0gMTEzO1xudmFyIEZJTklTSF9TVEFURSA9IDY2NjtcblxudmFyIEJTX05FRURfTU9SRSAgICAgID0gMTsgLyogYmxvY2sgbm90IGNvbXBsZXRlZCwgbmVlZCBtb3JlIGlucHV0IG9yIG1vcmUgb3V0cHV0ICovXG52YXIgQlNfQkxPQ0tfRE9ORSAgICAgPSAyOyAvKiBibG9jayBmbHVzaCBwZXJmb3JtZWQgKi9cbnZhciBCU19GSU5JU0hfU1RBUlRFRCA9IDM7IC8qIGZpbmlzaCBzdGFydGVkLCBuZWVkIG9ubHkgbW9yZSBvdXRwdXQgYXQgbmV4dCBkZWZsYXRlICovXG52YXIgQlNfRklOSVNIX0RPTkUgICAgPSA0OyAvKiBmaW5pc2ggZG9uZSwgYWNjZXB0IG5vIG1vcmUgaW5wdXQgb3Igb3V0cHV0ICovXG5cbnZhciBPU19DT0RFID0gMHgwMzsgLy8gVW5peCA6KSAuIERvbid0IGRldGVjdCwgdXNlIHRoaXMgZGVmYXVsdC5cblxuZnVuY3Rpb24gZXJyKHN0cm0sIGVycm9yQ29kZSkge1xuICBzdHJtLm1zZyA9IG1zZ1tlcnJvckNvZGVdO1xuICByZXR1cm4gZXJyb3JDb2RlO1xufVxuXG5mdW5jdGlvbiByYW5rKGYpIHtcbiAgcmV0dXJuICgoZikgPDwgMSkgLSAoKGYpID4gNCA/IDkgOiAwKTtcbn1cblxuZnVuY3Rpb24gemVybyhidWYpIHsgdmFyIGxlbiA9IGJ1Zi5sZW5ndGg7IHdoaWxlICgtLWxlbiA+PSAwKSB7IGJ1ZltsZW5dID0gMDsgfSB9XG5cblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogRmx1c2ggYXMgbXVjaCBwZW5kaW5nIG91dHB1dCBhcyBwb3NzaWJsZS4gQWxsIGRlZmxhdGUoKSBvdXRwdXQgZ29lc1xuICogdGhyb3VnaCB0aGlzIGZ1bmN0aW9uIHNvIHNvbWUgYXBwbGljYXRpb25zIG1heSB3aXNoIHRvIG1vZGlmeSBpdFxuICogdG8gYXZvaWQgYWxsb2NhdGluZyBhIGxhcmdlIHN0cm0tPm91dHB1dCBidWZmZXIgYW5kIGNvcHlpbmcgaW50byBpdC5cbiAqIChTZWUgYWxzbyByZWFkX2J1ZigpKS5cbiAqL1xuZnVuY3Rpb24gZmx1c2hfcGVuZGluZyhzdHJtKSB7XG4gIHZhciBzID0gc3RybS5zdGF0ZTtcblxuICAvL190cl9mbHVzaF9iaXRzKHMpO1xuICB2YXIgbGVuID0gcy5wZW5kaW5nO1xuICBpZiAobGVuID4gc3RybS5hdmFpbF9vdXQpIHtcbiAgICBsZW4gPSBzdHJtLmF2YWlsX291dDtcbiAgfVxuICBpZiAobGVuID09PSAwKSB7IHJldHVybjsgfVxuXG4gIHV0aWxzLmFycmF5U2V0KHN0cm0ub3V0cHV0LCBzLnBlbmRpbmdfYnVmLCBzLnBlbmRpbmdfb3V0LCBsZW4sIHN0cm0ubmV4dF9vdXQpO1xuICBzdHJtLm5leHRfb3V0ICs9IGxlbjtcbiAgcy5wZW5kaW5nX291dCArPSBsZW47XG4gIHN0cm0udG90YWxfb3V0ICs9IGxlbjtcbiAgc3RybS5hdmFpbF9vdXQgLT0gbGVuO1xuICBzLnBlbmRpbmcgLT0gbGVuO1xuICBpZiAocy5wZW5kaW5nID09PSAwKSB7XG4gICAgcy5wZW5kaW5nX291dCA9IDA7XG4gIH1cbn1cblxuXG5mdW5jdGlvbiBmbHVzaF9ibG9ja19vbmx5KHMsIGxhc3QpIHtcbiAgdHJlZXMuX3RyX2ZsdXNoX2Jsb2NrKHMsIChzLmJsb2NrX3N0YXJ0ID49IDAgPyBzLmJsb2NrX3N0YXJ0IDogLTEpLCBzLnN0cnN0YXJ0IC0gcy5ibG9ja19zdGFydCwgbGFzdCk7XG4gIHMuYmxvY2tfc3RhcnQgPSBzLnN0cnN0YXJ0O1xuICBmbHVzaF9wZW5kaW5nKHMuc3RybSk7XG59XG5cblxuZnVuY3Rpb24gcHV0X2J5dGUocywgYikge1xuICBzLnBlbmRpbmdfYnVmW3MucGVuZGluZysrXSA9IGI7XG59XG5cblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogUHV0IGEgc2hvcnQgaW4gdGhlIHBlbmRpbmcgYnVmZmVyLiBUaGUgMTYtYml0IHZhbHVlIGlzIHB1dCBpbiBNU0Igb3JkZXIuXG4gKiBJTiBhc3NlcnRpb246IHRoZSBzdHJlYW0gc3RhdGUgaXMgY29ycmVjdCBhbmQgdGhlcmUgaXMgZW5vdWdoIHJvb20gaW5cbiAqIHBlbmRpbmdfYnVmLlxuICovXG5mdW5jdGlvbiBwdXRTaG9ydE1TQihzLCBiKSB7XG4vLyAgcHV0X2J5dGUocywgKEJ5dGUpKGIgPj4gOCkpO1xuLy8gIHB1dF9ieXRlKHMsIChCeXRlKShiICYgMHhmZikpO1xuICBzLnBlbmRpbmdfYnVmW3MucGVuZGluZysrXSA9IChiID4+PiA4KSAmIDB4ZmY7XG4gIHMucGVuZGluZ19idWZbcy5wZW5kaW5nKytdID0gYiAmIDB4ZmY7XG59XG5cblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBSZWFkIGEgbmV3IGJ1ZmZlciBmcm9tIHRoZSBjdXJyZW50IGlucHV0IHN0cmVhbSwgdXBkYXRlIHRoZSBhZGxlcjMyXG4gKiBhbmQgdG90YWwgbnVtYmVyIG9mIGJ5dGVzIHJlYWQuICBBbGwgZGVmbGF0ZSgpIGlucHV0IGdvZXMgdGhyb3VnaFxuICogdGhpcyBmdW5jdGlvbiBzbyBzb21lIGFwcGxpY2F0aW9ucyBtYXkgd2lzaCB0byBtb2RpZnkgaXQgdG8gYXZvaWRcbiAqIGFsbG9jYXRpbmcgYSBsYXJnZSBzdHJtLT5pbnB1dCBidWZmZXIgYW5kIGNvcHlpbmcgZnJvbSBpdC5cbiAqIChTZWUgYWxzbyBmbHVzaF9wZW5kaW5nKCkpLlxuICovXG5mdW5jdGlvbiByZWFkX2J1ZihzdHJtLCBidWYsIHN0YXJ0LCBzaXplKSB7XG4gIHZhciBsZW4gPSBzdHJtLmF2YWlsX2luO1xuXG4gIGlmIChsZW4gPiBzaXplKSB7IGxlbiA9IHNpemU7IH1cbiAgaWYgKGxlbiA9PT0gMCkgeyByZXR1cm4gMDsgfVxuXG4gIHN0cm0uYXZhaWxfaW4gLT0gbGVuO1xuXG4gIC8vIHptZW1jcHkoYnVmLCBzdHJtLT5uZXh0X2luLCBsZW4pO1xuICB1dGlscy5hcnJheVNldChidWYsIHN0cm0uaW5wdXQsIHN0cm0ubmV4dF9pbiwgbGVuLCBzdGFydCk7XG4gIGlmIChzdHJtLnN0YXRlLndyYXAgPT09IDEpIHtcbiAgICBzdHJtLmFkbGVyID0gYWRsZXIzMihzdHJtLmFkbGVyLCBidWYsIGxlbiwgc3RhcnQpO1xuICB9XG5cbiAgZWxzZSBpZiAoc3RybS5zdGF0ZS53cmFwID09PSAyKSB7XG4gICAgc3RybS5hZGxlciA9IGNyYzMyKHN0cm0uYWRsZXIsIGJ1ZiwgbGVuLCBzdGFydCk7XG4gIH1cblxuICBzdHJtLm5leHRfaW4gKz0gbGVuO1xuICBzdHJtLnRvdGFsX2luICs9IGxlbjtcblxuICByZXR1cm4gbGVuO1xufVxuXG5cbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogU2V0IG1hdGNoX3N0YXJ0IHRvIHRoZSBsb25nZXN0IG1hdGNoIHN0YXJ0aW5nIGF0IHRoZSBnaXZlbiBzdHJpbmcgYW5kXG4gKiByZXR1cm4gaXRzIGxlbmd0aC4gTWF0Y2hlcyBzaG9ydGVyIG9yIGVxdWFsIHRvIHByZXZfbGVuZ3RoIGFyZSBkaXNjYXJkZWQsXG4gKiBpbiB3aGljaCBjYXNlIHRoZSByZXN1bHQgaXMgZXF1YWwgdG8gcHJldl9sZW5ndGggYW5kIG1hdGNoX3N0YXJ0IGlzXG4gKiBnYXJiYWdlLlxuICogSU4gYXNzZXJ0aW9uczogY3VyX21hdGNoIGlzIHRoZSBoZWFkIG9mIHRoZSBoYXNoIGNoYWluIGZvciB0aGUgY3VycmVudFxuICogICBzdHJpbmcgKHN0cnN0YXJ0KSBhbmQgaXRzIGRpc3RhbmNlIGlzIDw9IE1BWF9ESVNULCBhbmQgcHJldl9sZW5ndGggPj0gMVxuICogT1VUIGFzc2VydGlvbjogdGhlIG1hdGNoIGxlbmd0aCBpcyBub3QgZ3JlYXRlciB0aGFuIHMtPmxvb2thaGVhZC5cbiAqL1xuZnVuY3Rpb24gbG9uZ2VzdF9tYXRjaChzLCBjdXJfbWF0Y2gpIHtcbiAgdmFyIGNoYWluX2xlbmd0aCA9IHMubWF4X2NoYWluX2xlbmd0aDsgICAgICAvKiBtYXggaGFzaCBjaGFpbiBsZW5ndGggKi9cbiAgdmFyIHNjYW4gPSBzLnN0cnN0YXJ0OyAvKiBjdXJyZW50IHN0cmluZyAqL1xuICB2YXIgbWF0Y2g7ICAgICAgICAgICAgICAgICAgICAgICAvKiBtYXRjaGVkIHN0cmluZyAqL1xuICB2YXIgbGVuOyAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIGxlbmd0aCBvZiBjdXJyZW50IG1hdGNoICovXG4gIHZhciBiZXN0X2xlbiA9IHMucHJldl9sZW5ndGg7ICAgICAgICAgICAgICAvKiBiZXN0IG1hdGNoIGxlbmd0aCBzbyBmYXIgKi9cbiAgdmFyIG5pY2VfbWF0Y2ggPSBzLm5pY2VfbWF0Y2g7ICAgICAgICAgICAgIC8qIHN0b3AgaWYgbWF0Y2ggbG9uZyBlbm91Z2ggKi9cbiAgdmFyIGxpbWl0ID0gKHMuc3Ryc3RhcnQgPiAocy53X3NpemUgLSBNSU5fTE9PS0FIRUFEKSkgP1xuICAgICAgcy5zdHJzdGFydCAtIChzLndfc2l6ZSAtIE1JTl9MT09LQUhFQUQpIDogMC8qTklMKi87XG5cbiAgdmFyIF93aW4gPSBzLndpbmRvdzsgLy8gc2hvcnRjdXRcblxuICB2YXIgd21hc2sgPSBzLndfbWFzaztcbiAgdmFyIHByZXYgID0gcy5wcmV2O1xuXG4gIC8qIFN0b3Agd2hlbiBjdXJfbWF0Y2ggYmVjb21lcyA8PSBsaW1pdC4gVG8gc2ltcGxpZnkgdGhlIGNvZGUsXG4gICAqIHdlIHByZXZlbnQgbWF0Y2hlcyB3aXRoIHRoZSBzdHJpbmcgb2Ygd2luZG93IGluZGV4IDAuXG4gICAqL1xuXG4gIHZhciBzdHJlbmQgPSBzLnN0cnN0YXJ0ICsgTUFYX01BVENIO1xuICB2YXIgc2Nhbl9lbmQxICA9IF93aW5bc2NhbiArIGJlc3RfbGVuIC0gMV07XG4gIHZhciBzY2FuX2VuZCAgID0gX3dpbltzY2FuICsgYmVzdF9sZW5dO1xuXG4gIC8qIFRoZSBjb2RlIGlzIG9wdGltaXplZCBmb3IgSEFTSF9CSVRTID49IDggYW5kIE1BWF9NQVRDSC0yIG11bHRpcGxlIG9mIDE2LlxuICAgKiBJdCBpcyBlYXN5IHRvIGdldCByaWQgb2YgdGhpcyBvcHRpbWl6YXRpb24gaWYgbmVjZXNzYXJ5LlxuICAgKi9cbiAgLy8gQXNzZXJ0KHMtPmhhc2hfYml0cyA+PSA4ICYmIE1BWF9NQVRDSCA9PSAyNTgsIFwiQ29kZSB0b28gY2xldmVyXCIpO1xuXG4gIC8qIERvIG5vdCB3YXN0ZSB0b28gbXVjaCB0aW1lIGlmIHdlIGFscmVhZHkgaGF2ZSBhIGdvb2QgbWF0Y2g6ICovXG4gIGlmIChzLnByZXZfbGVuZ3RoID49IHMuZ29vZF9tYXRjaCkge1xuICAgIGNoYWluX2xlbmd0aCA+Pj0gMjtcbiAgfVxuICAvKiBEbyBub3QgbG9vayBmb3IgbWF0Y2hlcyBiZXlvbmQgdGhlIGVuZCBvZiB0aGUgaW5wdXQuIFRoaXMgaXMgbmVjZXNzYXJ5XG4gICAqIHRvIG1ha2UgZGVmbGF0ZSBkZXRlcm1pbmlzdGljLlxuICAgKi9cbiAgaWYgKG5pY2VfbWF0Y2ggPiBzLmxvb2thaGVhZCkgeyBuaWNlX21hdGNoID0gcy5sb29rYWhlYWQ7IH1cblxuICAvLyBBc3NlcnQoKHVsZylzLT5zdHJzdGFydCA8PSBzLT53aW5kb3dfc2l6ZS1NSU5fTE9PS0FIRUFELCBcIm5lZWQgbG9va2FoZWFkXCIpO1xuXG4gIGRvIHtcbiAgICAvLyBBc3NlcnQoY3VyX21hdGNoIDwgcy0+c3Ryc3RhcnQsIFwibm8gZnV0dXJlXCIpO1xuICAgIG1hdGNoID0gY3VyX21hdGNoO1xuXG4gICAgLyogU2tpcCB0byBuZXh0IG1hdGNoIGlmIHRoZSBtYXRjaCBsZW5ndGggY2Fubm90IGluY3JlYXNlXG4gICAgICogb3IgaWYgdGhlIG1hdGNoIGxlbmd0aCBpcyBsZXNzIHRoYW4gMi4gIE5vdGUgdGhhdCB0aGUgY2hlY2tzIGJlbG93XG4gICAgICogZm9yIGluc3VmZmljaWVudCBsb29rYWhlYWQgb25seSBvY2N1ciBvY2Nhc2lvbmFsbHkgZm9yIHBlcmZvcm1hbmNlXG4gICAgICogcmVhc29ucy4gIFRoZXJlZm9yZSB1bmluaXRpYWxpemVkIG1lbW9yeSB3aWxsIGJlIGFjY2Vzc2VkLCBhbmRcbiAgICAgKiBjb25kaXRpb25hbCBqdW1wcyB3aWxsIGJlIG1hZGUgdGhhdCBkZXBlbmQgb24gdGhvc2UgdmFsdWVzLlxuICAgICAqIEhvd2V2ZXIgdGhlIGxlbmd0aCBvZiB0aGUgbWF0Y2ggaXMgbGltaXRlZCB0byB0aGUgbG9va2FoZWFkLCBzb1xuICAgICAqIHRoZSBvdXRwdXQgb2YgZGVmbGF0ZSBpcyBub3QgYWZmZWN0ZWQgYnkgdGhlIHVuaW5pdGlhbGl6ZWQgdmFsdWVzLlxuICAgICAqL1xuXG4gICAgaWYgKF93aW5bbWF0Y2ggKyBiZXN0X2xlbl0gICAgICE9PSBzY2FuX2VuZCAgfHxcbiAgICAgICAgX3dpblttYXRjaCArIGJlc3RfbGVuIC0gMV0gIT09IHNjYW5fZW5kMSB8fFxuICAgICAgICBfd2luW21hdGNoXSAgICAgICAgICAgICAgICAhPT0gX3dpbltzY2FuXSB8fFxuICAgICAgICBfd2luWysrbWF0Y2hdICAgICAgICAgICAgICAhPT0gX3dpbltzY2FuICsgMV0pIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8qIFRoZSBjaGVjayBhdCBiZXN0X2xlbi0xIGNhbiBiZSByZW1vdmVkIGJlY2F1c2UgaXQgd2lsbCBiZSBtYWRlXG4gICAgICogYWdhaW4gbGF0ZXIuIChUaGlzIGhldXJpc3RpYyBpcyBub3QgYWx3YXlzIGEgd2luLilcbiAgICAgKiBJdCBpcyBub3QgbmVjZXNzYXJ5IHRvIGNvbXBhcmUgc2NhblsyXSBhbmQgbWF0Y2hbMl0gc2luY2UgdGhleVxuICAgICAqIGFyZSBhbHdheXMgZXF1YWwgd2hlbiB0aGUgb3RoZXIgYnl0ZXMgbWF0Y2gsIGdpdmVuIHRoYXRcbiAgICAgKiB0aGUgaGFzaCBrZXlzIGFyZSBlcXVhbCBhbmQgdGhhdCBIQVNIX0JJVFMgPj0gOC5cbiAgICAgKi9cbiAgICBzY2FuICs9IDI7XG4gICAgbWF0Y2grKztcbiAgICAvLyBBc3NlcnQoKnNjYW4gPT0gKm1hdGNoLCBcIm1hdGNoWzJdP1wiKTtcblxuICAgIC8qIFdlIGNoZWNrIGZvciBpbnN1ZmZpY2llbnQgbG9va2FoZWFkIG9ubHkgZXZlcnkgOHRoIGNvbXBhcmlzb247XG4gICAgICogdGhlIDI1NnRoIGNoZWNrIHdpbGwgYmUgbWFkZSBhdCBzdHJzdGFydCsyNTguXG4gICAgICovXG4gICAgZG8ge1xuICAgICAgLypqc2hpbnQgbm9lbXB0eTpmYWxzZSovXG4gICAgfSB3aGlsZSAoX3dpblsrK3NjYW5dID09PSBfd2luWysrbWF0Y2hdICYmIF93aW5bKytzY2FuXSA9PT0gX3dpblsrK21hdGNoXSAmJlxuICAgICAgICAgICAgIF93aW5bKytzY2FuXSA9PT0gX3dpblsrK21hdGNoXSAmJiBfd2luWysrc2Nhbl0gPT09IF93aW5bKyttYXRjaF0gJiZcbiAgICAgICAgICAgICBfd2luWysrc2Nhbl0gPT09IF93aW5bKyttYXRjaF0gJiYgX3dpblsrK3NjYW5dID09PSBfd2luWysrbWF0Y2hdICYmXG4gICAgICAgICAgICAgX3dpblsrK3NjYW5dID09PSBfd2luWysrbWF0Y2hdICYmIF93aW5bKytzY2FuXSA9PT0gX3dpblsrK21hdGNoXSAmJlxuICAgICAgICAgICAgIHNjYW4gPCBzdHJlbmQpO1xuXG4gICAgLy8gQXNzZXJ0KHNjYW4gPD0gcy0+d2luZG93Kyh1bnNpZ25lZCkocy0+d2luZG93X3NpemUtMSksIFwid2lsZCBzY2FuXCIpO1xuXG4gICAgbGVuID0gTUFYX01BVENIIC0gKHN0cmVuZCAtIHNjYW4pO1xuICAgIHNjYW4gPSBzdHJlbmQgLSBNQVhfTUFUQ0g7XG5cbiAgICBpZiAobGVuID4gYmVzdF9sZW4pIHtcbiAgICAgIHMubWF0Y2hfc3RhcnQgPSBjdXJfbWF0Y2g7XG4gICAgICBiZXN0X2xlbiA9IGxlbjtcbiAgICAgIGlmIChsZW4gPj0gbmljZV9tYXRjaCkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIHNjYW5fZW5kMSAgPSBfd2luW3NjYW4gKyBiZXN0X2xlbiAtIDFdO1xuICAgICAgc2Nhbl9lbmQgICA9IF93aW5bc2NhbiArIGJlc3RfbGVuXTtcbiAgICB9XG4gIH0gd2hpbGUgKChjdXJfbWF0Y2ggPSBwcmV2W2N1cl9tYXRjaCAmIHdtYXNrXSkgPiBsaW1pdCAmJiAtLWNoYWluX2xlbmd0aCAhPT0gMCk7XG5cbiAgaWYgKGJlc3RfbGVuIDw9IHMubG9va2FoZWFkKSB7XG4gICAgcmV0dXJuIGJlc3RfbGVuO1xuICB9XG4gIHJldHVybiBzLmxvb2thaGVhZDtcbn1cblxuXG4vKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIEZpbGwgdGhlIHdpbmRvdyB3aGVuIHRoZSBsb29rYWhlYWQgYmVjb21lcyBpbnN1ZmZpY2llbnQuXG4gKiBVcGRhdGVzIHN0cnN0YXJ0IGFuZCBsb29rYWhlYWQuXG4gKlxuICogSU4gYXNzZXJ0aW9uOiBsb29rYWhlYWQgPCBNSU5fTE9PS0FIRUFEXG4gKiBPVVQgYXNzZXJ0aW9uczogc3Ryc3RhcnQgPD0gd2luZG93X3NpemUtTUlOX0xPT0tBSEVBRFxuICogICAgQXQgbGVhc3Qgb25lIGJ5dGUgaGFzIGJlZW4gcmVhZCwgb3IgYXZhaWxfaW4gPT0gMDsgcmVhZHMgYXJlXG4gKiAgICBwZXJmb3JtZWQgZm9yIGF0IGxlYXN0IHR3byBieXRlcyAocmVxdWlyZWQgZm9yIHRoZSB6aXAgdHJhbnNsYXRlX2VvbFxuICogICAgb3B0aW9uIC0tIG5vdCBzdXBwb3J0ZWQgaGVyZSkuXG4gKi9cbmZ1bmN0aW9uIGZpbGxfd2luZG93KHMpIHtcbiAgdmFyIF93X3NpemUgPSBzLndfc2l6ZTtcbiAgdmFyIHAsIG4sIG0sIG1vcmUsIHN0cjtcblxuICAvL0Fzc2VydChzLT5sb29rYWhlYWQgPCBNSU5fTE9PS0FIRUFELCBcImFscmVhZHkgZW5vdWdoIGxvb2thaGVhZFwiKTtcblxuICBkbyB7XG4gICAgbW9yZSA9IHMud2luZG93X3NpemUgLSBzLmxvb2thaGVhZCAtIHMuc3Ryc3RhcnQ7XG5cbiAgICAvLyBKUyBpbnRzIGhhdmUgMzIgYml0LCBibG9jayBiZWxvdyBub3QgbmVlZGVkXG4gICAgLyogRGVhbCB3aXRoICFAIyQlIDY0SyBsaW1pdDogKi9cbiAgICAvL2lmIChzaXplb2YoaW50KSA8PSAyKSB7XG4gICAgLy8gICAgaWYgKG1vcmUgPT0gMCAmJiBzLT5zdHJzdGFydCA9PSAwICYmIHMtPmxvb2thaGVhZCA9PSAwKSB7XG4gICAgLy8gICAgICAgIG1vcmUgPSB3c2l6ZTtcbiAgICAvL1xuICAgIC8vICB9IGVsc2UgaWYgKG1vcmUgPT0gKHVuc2lnbmVkKSgtMSkpIHtcbiAgICAvLyAgICAgICAgLyogVmVyeSB1bmxpa2VseSwgYnV0IHBvc3NpYmxlIG9uIDE2IGJpdCBtYWNoaW5lIGlmXG4gICAgLy8gICAgICAgICAqIHN0cnN0YXJ0ID09IDAgJiYgbG9va2FoZWFkID09IDEgKGlucHV0IGRvbmUgYSBieXRlIGF0IHRpbWUpXG4gICAgLy8gICAgICAgICAqL1xuICAgIC8vICAgICAgICBtb3JlLS07XG4gICAgLy8gICAgfVxuICAgIC8vfVxuXG5cbiAgICAvKiBJZiB0aGUgd2luZG93IGlzIGFsbW9zdCBmdWxsIGFuZCB0aGVyZSBpcyBpbnN1ZmZpY2llbnQgbG9va2FoZWFkLFxuICAgICAqIG1vdmUgdGhlIHVwcGVyIGhhbGYgdG8gdGhlIGxvd2VyIG9uZSB0byBtYWtlIHJvb20gaW4gdGhlIHVwcGVyIGhhbGYuXG4gICAgICovXG4gICAgaWYgKHMuc3Ryc3RhcnQgPj0gX3dfc2l6ZSArIChfd19zaXplIC0gTUlOX0xPT0tBSEVBRCkpIHtcblxuICAgICAgdXRpbHMuYXJyYXlTZXQocy53aW5kb3csIHMud2luZG93LCBfd19zaXplLCBfd19zaXplLCAwKTtcbiAgICAgIHMubWF0Y2hfc3RhcnQgLT0gX3dfc2l6ZTtcbiAgICAgIHMuc3Ryc3RhcnQgLT0gX3dfc2l6ZTtcbiAgICAgIC8qIHdlIG5vdyBoYXZlIHN0cnN0YXJ0ID49IE1BWF9ESVNUICovXG4gICAgICBzLmJsb2NrX3N0YXJ0IC09IF93X3NpemU7XG5cbiAgICAgIC8qIFNsaWRlIHRoZSBoYXNoIHRhYmxlIChjb3VsZCBiZSBhdm9pZGVkIHdpdGggMzIgYml0IHZhbHVlc1xuICAgICAgIGF0IHRoZSBleHBlbnNlIG9mIG1lbW9yeSB1c2FnZSkuIFdlIHNsaWRlIGV2ZW4gd2hlbiBsZXZlbCA9PSAwXG4gICAgICAgdG8ga2VlcCB0aGUgaGFzaCB0YWJsZSBjb25zaXN0ZW50IGlmIHdlIHN3aXRjaCBiYWNrIHRvIGxldmVsID4gMFxuICAgICAgIGxhdGVyLiAoVXNpbmcgbGV2ZWwgMCBwZXJtYW5lbnRseSBpcyBub3QgYW4gb3B0aW1hbCB1c2FnZSBvZlxuICAgICAgIHpsaWIsIHNvIHdlIGRvbid0IGNhcmUgYWJvdXQgdGhpcyBwYXRob2xvZ2ljYWwgY2FzZS4pXG4gICAgICAgKi9cblxuICAgICAgbiA9IHMuaGFzaF9zaXplO1xuICAgICAgcCA9IG47XG4gICAgICBkbyB7XG4gICAgICAgIG0gPSBzLmhlYWRbLS1wXTtcbiAgICAgICAgcy5oZWFkW3BdID0gKG0gPj0gX3dfc2l6ZSA/IG0gLSBfd19zaXplIDogMCk7XG4gICAgICB9IHdoaWxlICgtLW4pO1xuXG4gICAgICBuID0gX3dfc2l6ZTtcbiAgICAgIHAgPSBuO1xuICAgICAgZG8ge1xuICAgICAgICBtID0gcy5wcmV2Wy0tcF07XG4gICAgICAgIHMucHJldltwXSA9IChtID49IF93X3NpemUgPyBtIC0gX3dfc2l6ZSA6IDApO1xuICAgICAgICAvKiBJZiBuIGlzIG5vdCBvbiBhbnkgaGFzaCBjaGFpbiwgcHJldltuXSBpcyBnYXJiYWdlIGJ1dFxuICAgICAgICAgKiBpdHMgdmFsdWUgd2lsbCBuZXZlciBiZSB1c2VkLlxuICAgICAgICAgKi9cbiAgICAgIH0gd2hpbGUgKC0tbik7XG5cbiAgICAgIG1vcmUgKz0gX3dfc2l6ZTtcbiAgICB9XG4gICAgaWYgKHMuc3RybS5hdmFpbF9pbiA9PT0gMCkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgLyogSWYgdGhlcmUgd2FzIG5vIHNsaWRpbmc6XG4gICAgICogICAgc3Ryc3RhcnQgPD0gV1NJWkUrTUFYX0RJU1QtMSAmJiBsb29rYWhlYWQgPD0gTUlOX0xPT0tBSEVBRCAtIDEgJiZcbiAgICAgKiAgICBtb3JlID09IHdpbmRvd19zaXplIC0gbG9va2FoZWFkIC0gc3Ryc3RhcnRcbiAgICAgKiA9PiBtb3JlID49IHdpbmRvd19zaXplIC0gKE1JTl9MT09LQUhFQUQtMSArIFdTSVpFICsgTUFYX0RJU1QtMSlcbiAgICAgKiA9PiBtb3JlID49IHdpbmRvd19zaXplIC0gMipXU0laRSArIDJcbiAgICAgKiBJbiB0aGUgQklHX01FTSBvciBNTUFQIGNhc2UgKG5vdCB5ZXQgc3VwcG9ydGVkKSxcbiAgICAgKiAgIHdpbmRvd19zaXplID09IGlucHV0X3NpemUgKyBNSU5fTE9PS0FIRUFEICAmJlxuICAgICAqICAgc3Ryc3RhcnQgKyBzLT5sb29rYWhlYWQgPD0gaW5wdXRfc2l6ZSA9PiBtb3JlID49IE1JTl9MT09LQUhFQUQuXG4gICAgICogT3RoZXJ3aXNlLCB3aW5kb3dfc2l6ZSA9PSAyKldTSVpFIHNvIG1vcmUgPj0gMi5cbiAgICAgKiBJZiB0aGVyZSB3YXMgc2xpZGluZywgbW9yZSA+PSBXU0laRS4gU28gaW4gYWxsIGNhc2VzLCBtb3JlID49IDIuXG4gICAgICovXG4gICAgLy9Bc3NlcnQobW9yZSA+PSAyLCBcIm1vcmUgPCAyXCIpO1xuICAgIG4gPSByZWFkX2J1ZihzLnN0cm0sIHMud2luZG93LCBzLnN0cnN0YXJ0ICsgcy5sb29rYWhlYWQsIG1vcmUpO1xuICAgIHMubG9va2FoZWFkICs9IG47XG5cbiAgICAvKiBJbml0aWFsaXplIHRoZSBoYXNoIHZhbHVlIG5vdyB0aGF0IHdlIGhhdmUgc29tZSBpbnB1dDogKi9cbiAgICBpZiAocy5sb29rYWhlYWQgKyBzLmluc2VydCA+PSBNSU5fTUFUQ0gpIHtcbiAgICAgIHN0ciA9IHMuc3Ryc3RhcnQgLSBzLmluc2VydDtcbiAgICAgIHMuaW5zX2ggPSBzLndpbmRvd1tzdHJdO1xuXG4gICAgICAvKiBVUERBVEVfSEFTSChzLCBzLT5pbnNfaCwgcy0+d2luZG93W3N0ciArIDFdKTsgKi9cbiAgICAgIHMuaW5zX2ggPSAoKHMuaW5zX2ggPDwgcy5oYXNoX3NoaWZ0KSBeIHMud2luZG93W3N0ciArIDFdKSAmIHMuaGFzaF9tYXNrO1xuLy8jaWYgTUlOX01BVENIICE9IDNcbi8vICAgICAgICBDYWxsIHVwZGF0ZV9oYXNoKCkgTUlOX01BVENILTMgbW9yZSB0aW1lc1xuLy8jZW5kaWZcbiAgICAgIHdoaWxlIChzLmluc2VydCkge1xuICAgICAgICAvKiBVUERBVEVfSEFTSChzLCBzLT5pbnNfaCwgcy0+d2luZG93W3N0ciArIE1JTl9NQVRDSC0xXSk7ICovXG4gICAgICAgIHMuaW5zX2ggPSAoKHMuaW5zX2ggPDwgcy5oYXNoX3NoaWZ0KSBeIHMud2luZG93W3N0ciArIE1JTl9NQVRDSCAtIDFdKSAmIHMuaGFzaF9tYXNrO1xuXG4gICAgICAgIHMucHJldltzdHIgJiBzLndfbWFza10gPSBzLmhlYWRbcy5pbnNfaF07XG4gICAgICAgIHMuaGVhZFtzLmluc19oXSA9IHN0cjtcbiAgICAgICAgc3RyKys7XG4gICAgICAgIHMuaW5zZXJ0LS07XG4gICAgICAgIGlmIChzLmxvb2thaGVhZCArIHMuaW5zZXJ0IDwgTUlOX01BVENIKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgLyogSWYgdGhlIHdob2xlIGlucHV0IGhhcyBsZXNzIHRoYW4gTUlOX01BVENIIGJ5dGVzLCBpbnNfaCBpcyBnYXJiYWdlLFxuICAgICAqIGJ1dCB0aGlzIGlzIG5vdCBpbXBvcnRhbnQgc2luY2Ugb25seSBsaXRlcmFsIGJ5dGVzIHdpbGwgYmUgZW1pdHRlZC5cbiAgICAgKi9cblxuICB9IHdoaWxlIChzLmxvb2thaGVhZCA8IE1JTl9MT09LQUhFQUQgJiYgcy5zdHJtLmF2YWlsX2luICE9PSAwKTtcblxuICAvKiBJZiB0aGUgV0lOX0lOSVQgYnl0ZXMgYWZ0ZXIgdGhlIGVuZCBvZiB0aGUgY3VycmVudCBkYXRhIGhhdmUgbmV2ZXIgYmVlblxuICAgKiB3cml0dGVuLCB0aGVuIHplcm8gdGhvc2UgYnl0ZXMgaW4gb3JkZXIgdG8gYXZvaWQgbWVtb3J5IGNoZWNrIHJlcG9ydHMgb2ZcbiAgICogdGhlIHVzZSBvZiB1bmluaXRpYWxpemVkIChvciB1bmluaXRpYWxpc2VkIGFzIEp1bGlhbiB3cml0ZXMpIGJ5dGVzIGJ5XG4gICAqIHRoZSBsb25nZXN0IG1hdGNoIHJvdXRpbmVzLiAgVXBkYXRlIHRoZSBoaWdoIHdhdGVyIG1hcmsgZm9yIHRoZSBuZXh0XG4gICAqIHRpbWUgdGhyb3VnaCBoZXJlLiAgV0lOX0lOSVQgaXMgc2V0IHRvIE1BWF9NQVRDSCBzaW5jZSB0aGUgbG9uZ2VzdCBtYXRjaFxuICAgKiByb3V0aW5lcyBhbGxvdyBzY2FubmluZyB0byBzdHJzdGFydCArIE1BWF9NQVRDSCwgaWdub3JpbmcgbG9va2FoZWFkLlxuICAgKi9cbi8vICBpZiAocy5oaWdoX3dhdGVyIDwgcy53aW5kb3dfc2l6ZSkge1xuLy8gICAgdmFyIGN1cnIgPSBzLnN0cnN0YXJ0ICsgcy5sb29rYWhlYWQ7XG4vLyAgICB2YXIgaW5pdCA9IDA7XG4vL1xuLy8gICAgaWYgKHMuaGlnaF93YXRlciA8IGN1cnIpIHtcbi8vICAgICAgLyogUHJldmlvdXMgaGlnaCB3YXRlciBtYXJrIGJlbG93IGN1cnJlbnQgZGF0YSAtLSB6ZXJvIFdJTl9JTklUXG4vLyAgICAgICAqIGJ5dGVzIG9yIHVwIHRvIGVuZCBvZiB3aW5kb3csIHdoaWNoZXZlciBpcyBsZXNzLlxuLy8gICAgICAgKi9cbi8vICAgICAgaW5pdCA9IHMud2luZG93X3NpemUgLSBjdXJyO1xuLy8gICAgICBpZiAoaW5pdCA+IFdJTl9JTklUKVxuLy8gICAgICAgIGluaXQgPSBXSU5fSU5JVDtcbi8vICAgICAgem1lbXplcm8ocy0+d2luZG93ICsgY3VyciwgKHVuc2lnbmVkKWluaXQpO1xuLy8gICAgICBzLT5oaWdoX3dhdGVyID0gY3VyciArIGluaXQ7XG4vLyAgICB9XG4vLyAgICBlbHNlIGlmIChzLT5oaWdoX3dhdGVyIDwgKHVsZyljdXJyICsgV0lOX0lOSVQpIHtcbi8vICAgICAgLyogSGlnaCB3YXRlciBtYXJrIGF0IG9yIGFib3ZlIGN1cnJlbnQgZGF0YSwgYnV0IGJlbG93IGN1cnJlbnQgZGF0YVxuLy8gICAgICAgKiBwbHVzIFdJTl9JTklUIC0tIHplcm8gb3V0IHRvIGN1cnJlbnQgZGF0YSBwbHVzIFdJTl9JTklULCBvciB1cFxuLy8gICAgICAgKiB0byBlbmQgb2Ygd2luZG93LCB3aGljaGV2ZXIgaXMgbGVzcy5cbi8vICAgICAgICovXG4vLyAgICAgIGluaXQgPSAodWxnKWN1cnIgKyBXSU5fSU5JVCAtIHMtPmhpZ2hfd2F0ZXI7XG4vLyAgICAgIGlmIChpbml0ID4gcy0+d2luZG93X3NpemUgLSBzLT5oaWdoX3dhdGVyKVxuLy8gICAgICAgIGluaXQgPSBzLT53aW5kb3dfc2l6ZSAtIHMtPmhpZ2hfd2F0ZXI7XG4vLyAgICAgIHptZW16ZXJvKHMtPndpbmRvdyArIHMtPmhpZ2hfd2F0ZXIsICh1bnNpZ25lZClpbml0KTtcbi8vICAgICAgcy0+aGlnaF93YXRlciArPSBpbml0O1xuLy8gICAgfVxuLy8gIH1cbi8vXG4vLyAgQXNzZXJ0KCh1bGcpcy0+c3Ryc3RhcnQgPD0gcy0+d2luZG93X3NpemUgLSBNSU5fTE9PS0FIRUFELFxuLy8gICAgXCJub3QgZW5vdWdoIHJvb20gZm9yIHNlYXJjaFwiKTtcbn1cblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBDb3B5IHdpdGhvdXQgY29tcHJlc3Npb24gYXMgbXVjaCBhcyBwb3NzaWJsZSBmcm9tIHRoZSBpbnB1dCBzdHJlYW0sIHJldHVyblxuICogdGhlIGN1cnJlbnQgYmxvY2sgc3RhdGUuXG4gKiBUaGlzIGZ1bmN0aW9uIGRvZXMgbm90IGluc2VydCBuZXcgc3RyaW5ncyBpbiB0aGUgZGljdGlvbmFyeSBzaW5jZVxuICogdW5jb21wcmVzc2libGUgZGF0YSBpcyBwcm9iYWJseSBub3QgdXNlZnVsLiBUaGlzIGZ1bmN0aW9uIGlzIHVzZWRcbiAqIG9ubHkgZm9yIHRoZSBsZXZlbD0wIGNvbXByZXNzaW9uIG9wdGlvbi5cbiAqIE5PVEU6IHRoaXMgZnVuY3Rpb24gc2hvdWxkIGJlIG9wdGltaXplZCB0byBhdm9pZCBleHRyYSBjb3B5aW5nIGZyb21cbiAqIHdpbmRvdyB0byBwZW5kaW5nX2J1Zi5cbiAqL1xuZnVuY3Rpb24gZGVmbGF0ZV9zdG9yZWQocywgZmx1c2gpIHtcbiAgLyogU3RvcmVkIGJsb2NrcyBhcmUgbGltaXRlZCB0byAweGZmZmYgYnl0ZXMsIHBlbmRpbmdfYnVmIGlzIGxpbWl0ZWRcbiAgICogdG8gcGVuZGluZ19idWZfc2l6ZSwgYW5kIGVhY2ggc3RvcmVkIGJsb2NrIGhhcyBhIDUgYnl0ZSBoZWFkZXI6XG4gICAqL1xuICB2YXIgbWF4X2Jsb2NrX3NpemUgPSAweGZmZmY7XG5cbiAgaWYgKG1heF9ibG9ja19zaXplID4gcy5wZW5kaW5nX2J1Zl9zaXplIC0gNSkge1xuICAgIG1heF9ibG9ja19zaXplID0gcy5wZW5kaW5nX2J1Zl9zaXplIC0gNTtcbiAgfVxuXG4gIC8qIENvcHkgYXMgbXVjaCBhcyBwb3NzaWJsZSBmcm9tIGlucHV0IHRvIG91dHB1dDogKi9cbiAgZm9yICg7Oykge1xuICAgIC8qIEZpbGwgdGhlIHdpbmRvdyBhcyBtdWNoIGFzIHBvc3NpYmxlOiAqL1xuICAgIGlmIChzLmxvb2thaGVhZCA8PSAxKSB7XG5cbiAgICAgIC8vQXNzZXJ0KHMtPnN0cnN0YXJ0IDwgcy0+d19zaXplK01BWF9ESVNUKHMpIHx8XG4gICAgICAvLyAgcy0+YmxvY2tfc3RhcnQgPj0gKGxvbmcpcy0+d19zaXplLCBcInNsaWRlIHRvbyBsYXRlXCIpO1xuLy8gICAgICBpZiAoIShzLnN0cnN0YXJ0IDwgcy53X3NpemUgKyAocy53X3NpemUgLSBNSU5fTE9PS0FIRUFEKSB8fFxuLy8gICAgICAgIHMuYmxvY2tfc3RhcnQgPj0gcy53X3NpemUpKSB7XG4vLyAgICAgICAgdGhyb3cgIG5ldyBFcnJvcihcInNsaWRlIHRvbyBsYXRlXCIpO1xuLy8gICAgICB9XG5cbiAgICAgIGZpbGxfd2luZG93KHMpO1xuICAgICAgaWYgKHMubG9va2FoZWFkID09PSAwICYmIGZsdXNoID09PSBaX05PX0ZMVVNIKSB7XG4gICAgICAgIHJldHVybiBCU19ORUVEX01PUkU7XG4gICAgICB9XG5cbiAgICAgIGlmIChzLmxvb2thaGVhZCA9PT0gMCkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIC8qIGZsdXNoIHRoZSBjdXJyZW50IGJsb2NrICovXG4gICAgfVxuICAgIC8vQXNzZXJ0KHMtPmJsb2NrX3N0YXJ0ID49IDBMLCBcImJsb2NrIGdvbmVcIik7XG4vLyAgICBpZiAocy5ibG9ja19zdGFydCA8IDApIHRocm93IG5ldyBFcnJvcihcImJsb2NrIGdvbmVcIik7XG5cbiAgICBzLnN0cnN0YXJ0ICs9IHMubG9va2FoZWFkO1xuICAgIHMubG9va2FoZWFkID0gMDtcblxuICAgIC8qIEVtaXQgYSBzdG9yZWQgYmxvY2sgaWYgcGVuZGluZ19idWYgd2lsbCBiZSBmdWxsOiAqL1xuICAgIHZhciBtYXhfc3RhcnQgPSBzLmJsb2NrX3N0YXJ0ICsgbWF4X2Jsb2NrX3NpemU7XG5cbiAgICBpZiAocy5zdHJzdGFydCA9PT0gMCB8fCBzLnN0cnN0YXJ0ID49IG1heF9zdGFydCkge1xuICAgICAgLyogc3Ryc3RhcnQgPT0gMCBpcyBwb3NzaWJsZSB3aGVuIHdyYXBhcm91bmQgb24gMTYtYml0IG1hY2hpbmUgKi9cbiAgICAgIHMubG9va2FoZWFkID0gcy5zdHJzdGFydCAtIG1heF9zdGFydDtcbiAgICAgIHMuc3Ryc3RhcnQgPSBtYXhfc3RhcnQ7XG4gICAgICAvKioqIEZMVVNIX0JMT0NLKHMsIDApOyAqKiovXG4gICAgICBmbHVzaF9ibG9ja19vbmx5KHMsIGZhbHNlKTtcbiAgICAgIGlmIChzLnN0cm0uYXZhaWxfb3V0ID09PSAwKSB7XG4gICAgICAgIHJldHVybiBCU19ORUVEX01PUkU7XG4gICAgICB9XG4gICAgICAvKioqL1xuXG5cbiAgICB9XG4gICAgLyogRmx1c2ggaWYgd2UgbWF5IGhhdmUgdG8gc2xpZGUsIG90aGVyd2lzZSBibG9ja19zdGFydCBtYXkgYmVjb21lXG4gICAgICogbmVnYXRpdmUgYW5kIHRoZSBkYXRhIHdpbGwgYmUgZ29uZTpcbiAgICAgKi9cbiAgICBpZiAocy5zdHJzdGFydCAtIHMuYmxvY2tfc3RhcnQgPj0gKHMud19zaXplIC0gTUlOX0xPT0tBSEVBRCkpIHtcbiAgICAgIC8qKiogRkxVU0hfQkxPQ0socywgMCk7ICoqKi9cbiAgICAgIGZsdXNoX2Jsb2NrX29ubHkocywgZmFsc2UpO1xuICAgICAgaWYgKHMuc3RybS5hdmFpbF9vdXQgPT09IDApIHtcbiAgICAgICAgcmV0dXJuIEJTX05FRURfTU9SRTtcbiAgICAgIH1cbiAgICAgIC8qKiovXG4gICAgfVxuICB9XG5cbiAgcy5pbnNlcnQgPSAwO1xuXG4gIGlmIChmbHVzaCA9PT0gWl9GSU5JU0gpIHtcbiAgICAvKioqIEZMVVNIX0JMT0NLKHMsIDEpOyAqKiovXG4gICAgZmx1c2hfYmxvY2tfb25seShzLCB0cnVlKTtcbiAgICBpZiAocy5zdHJtLmF2YWlsX291dCA9PT0gMCkge1xuICAgICAgcmV0dXJuIEJTX0ZJTklTSF9TVEFSVEVEO1xuICAgIH1cbiAgICAvKioqL1xuICAgIHJldHVybiBCU19GSU5JU0hfRE9ORTtcbiAgfVxuXG4gIGlmIChzLnN0cnN0YXJ0ID4gcy5ibG9ja19zdGFydCkge1xuICAgIC8qKiogRkxVU0hfQkxPQ0socywgMCk7ICoqKi9cbiAgICBmbHVzaF9ibG9ja19vbmx5KHMsIGZhbHNlKTtcbiAgICBpZiAocy5zdHJtLmF2YWlsX291dCA9PT0gMCkge1xuICAgICAgcmV0dXJuIEJTX05FRURfTU9SRTtcbiAgICB9XG4gICAgLyoqKi9cbiAgfVxuXG4gIHJldHVybiBCU19ORUVEX01PUkU7XG59XG5cbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQ29tcHJlc3MgYXMgbXVjaCBhcyBwb3NzaWJsZSBmcm9tIHRoZSBpbnB1dCBzdHJlYW0sIHJldHVybiB0aGUgY3VycmVudFxuICogYmxvY2sgc3RhdGUuXG4gKiBUaGlzIGZ1bmN0aW9uIGRvZXMgbm90IHBlcmZvcm0gbGF6eSBldmFsdWF0aW9uIG9mIG1hdGNoZXMgYW5kIGluc2VydHNcbiAqIG5ldyBzdHJpbmdzIGluIHRoZSBkaWN0aW9uYXJ5IG9ubHkgZm9yIHVubWF0Y2hlZCBzdHJpbmdzIG9yIGZvciBzaG9ydFxuICogbWF0Y2hlcy4gSXQgaXMgdXNlZCBvbmx5IGZvciB0aGUgZmFzdCBjb21wcmVzc2lvbiBvcHRpb25zLlxuICovXG5mdW5jdGlvbiBkZWZsYXRlX2Zhc3QocywgZmx1c2gpIHtcbiAgdmFyIGhhc2hfaGVhZDsgICAgICAgIC8qIGhlYWQgb2YgdGhlIGhhc2ggY2hhaW4gKi9cbiAgdmFyIGJmbHVzaDsgICAgICAgICAgIC8qIHNldCBpZiBjdXJyZW50IGJsb2NrIG11c3QgYmUgZmx1c2hlZCAqL1xuXG4gIGZvciAoOzspIHtcbiAgICAvKiBNYWtlIHN1cmUgdGhhdCB3ZSBhbHdheXMgaGF2ZSBlbm91Z2ggbG9va2FoZWFkLCBleGNlcHRcbiAgICAgKiBhdCB0aGUgZW5kIG9mIHRoZSBpbnB1dCBmaWxlLiBXZSBuZWVkIE1BWF9NQVRDSCBieXRlc1xuICAgICAqIGZvciB0aGUgbmV4dCBtYXRjaCwgcGx1cyBNSU5fTUFUQ0ggYnl0ZXMgdG8gaW5zZXJ0IHRoZVxuICAgICAqIHN0cmluZyBmb2xsb3dpbmcgdGhlIG5leHQgbWF0Y2guXG4gICAgICovXG4gICAgaWYgKHMubG9va2FoZWFkIDwgTUlOX0xPT0tBSEVBRCkge1xuICAgICAgZmlsbF93aW5kb3cocyk7XG4gICAgICBpZiAocy5sb29rYWhlYWQgPCBNSU5fTE9PS0FIRUFEICYmIGZsdXNoID09PSBaX05PX0ZMVVNIKSB7XG4gICAgICAgIHJldHVybiBCU19ORUVEX01PUkU7XG4gICAgICB9XG4gICAgICBpZiAocy5sb29rYWhlYWQgPT09IDApIHtcbiAgICAgICAgYnJlYWs7IC8qIGZsdXNoIHRoZSBjdXJyZW50IGJsb2NrICovXG4gICAgICB9XG4gICAgfVxuXG4gICAgLyogSW5zZXJ0IHRoZSBzdHJpbmcgd2luZG93W3N0cnN0YXJ0IC4uIHN0cnN0YXJ0KzJdIGluIHRoZVxuICAgICAqIGRpY3Rpb25hcnksIGFuZCBzZXQgaGFzaF9oZWFkIHRvIHRoZSBoZWFkIG9mIHRoZSBoYXNoIGNoYWluOlxuICAgICAqL1xuICAgIGhhc2hfaGVhZCA9IDAvKk5JTCovO1xuICAgIGlmIChzLmxvb2thaGVhZCA+PSBNSU5fTUFUQ0gpIHtcbiAgICAgIC8qKiogSU5TRVJUX1NUUklORyhzLCBzLnN0cnN0YXJ0LCBoYXNoX2hlYWQpOyAqKiovXG4gICAgICBzLmluc19oID0gKChzLmluc19oIDw8IHMuaGFzaF9zaGlmdCkgXiBzLndpbmRvd1tzLnN0cnN0YXJ0ICsgTUlOX01BVENIIC0gMV0pICYgcy5oYXNoX21hc2s7XG4gICAgICBoYXNoX2hlYWQgPSBzLnByZXZbcy5zdHJzdGFydCAmIHMud19tYXNrXSA9IHMuaGVhZFtzLmluc19oXTtcbiAgICAgIHMuaGVhZFtzLmluc19oXSA9IHMuc3Ryc3RhcnQ7XG4gICAgICAvKioqL1xuICAgIH1cblxuICAgIC8qIEZpbmQgdGhlIGxvbmdlc3QgbWF0Y2gsIGRpc2NhcmRpbmcgdGhvc2UgPD0gcHJldl9sZW5ndGguXG4gICAgICogQXQgdGhpcyBwb2ludCB3ZSBoYXZlIGFsd2F5cyBtYXRjaF9sZW5ndGggPCBNSU5fTUFUQ0hcbiAgICAgKi9cbiAgICBpZiAoaGFzaF9oZWFkICE9PSAwLypOSUwqLyAmJiAoKHMuc3Ryc3RhcnQgLSBoYXNoX2hlYWQpIDw9IChzLndfc2l6ZSAtIE1JTl9MT09LQUhFQUQpKSkge1xuICAgICAgLyogVG8gc2ltcGxpZnkgdGhlIGNvZGUsIHdlIHByZXZlbnQgbWF0Y2hlcyB3aXRoIHRoZSBzdHJpbmdcbiAgICAgICAqIG9mIHdpbmRvdyBpbmRleCAwIChpbiBwYXJ0aWN1bGFyIHdlIGhhdmUgdG8gYXZvaWQgYSBtYXRjaFxuICAgICAgICogb2YgdGhlIHN0cmluZyB3aXRoIGl0c2VsZiBhdCB0aGUgc3RhcnQgb2YgdGhlIGlucHV0IGZpbGUpLlxuICAgICAgICovXG4gICAgICBzLm1hdGNoX2xlbmd0aCA9IGxvbmdlc3RfbWF0Y2gocywgaGFzaF9oZWFkKTtcbiAgICAgIC8qIGxvbmdlc3RfbWF0Y2goKSBzZXRzIG1hdGNoX3N0YXJ0ICovXG4gICAgfVxuICAgIGlmIChzLm1hdGNoX2xlbmd0aCA+PSBNSU5fTUFUQ0gpIHtcbiAgICAgIC8vIGNoZWNrX21hdGNoKHMsIHMuc3Ryc3RhcnQsIHMubWF0Y2hfc3RhcnQsIHMubWF0Y2hfbGVuZ3RoKTsgLy8gZm9yIGRlYnVnIG9ubHlcblxuICAgICAgLyoqKiBfdHJfdGFsbHlfZGlzdChzLCBzLnN0cnN0YXJ0IC0gcy5tYXRjaF9zdGFydCxcbiAgICAgICAgICAgICAgICAgICAgIHMubWF0Y2hfbGVuZ3RoIC0gTUlOX01BVENILCBiZmx1c2gpOyAqKiovXG4gICAgICBiZmx1c2ggPSB0cmVlcy5fdHJfdGFsbHkocywgcy5zdHJzdGFydCAtIHMubWF0Y2hfc3RhcnQsIHMubWF0Y2hfbGVuZ3RoIC0gTUlOX01BVENIKTtcblxuICAgICAgcy5sb29rYWhlYWQgLT0gcy5tYXRjaF9sZW5ndGg7XG5cbiAgICAgIC8qIEluc2VydCBuZXcgc3RyaW5ncyBpbiB0aGUgaGFzaCB0YWJsZSBvbmx5IGlmIHRoZSBtYXRjaCBsZW5ndGhcbiAgICAgICAqIGlzIG5vdCB0b28gbGFyZ2UuIFRoaXMgc2F2ZXMgdGltZSBidXQgZGVncmFkZXMgY29tcHJlc3Npb24uXG4gICAgICAgKi9cbiAgICAgIGlmIChzLm1hdGNoX2xlbmd0aCA8PSBzLm1heF9sYXp5X21hdGNoLyptYXhfaW5zZXJ0X2xlbmd0aCovICYmIHMubG9va2FoZWFkID49IE1JTl9NQVRDSCkge1xuICAgICAgICBzLm1hdGNoX2xlbmd0aC0tOyAvKiBzdHJpbmcgYXQgc3Ryc3RhcnQgYWxyZWFkeSBpbiB0YWJsZSAqL1xuICAgICAgICBkbyB7XG4gICAgICAgICAgcy5zdHJzdGFydCsrO1xuICAgICAgICAgIC8qKiogSU5TRVJUX1NUUklORyhzLCBzLnN0cnN0YXJ0LCBoYXNoX2hlYWQpOyAqKiovXG4gICAgICAgICAgcy5pbnNfaCA9ICgocy5pbnNfaCA8PCBzLmhhc2hfc2hpZnQpIF4gcy53aW5kb3dbcy5zdHJzdGFydCArIE1JTl9NQVRDSCAtIDFdKSAmIHMuaGFzaF9tYXNrO1xuICAgICAgICAgIGhhc2hfaGVhZCA9IHMucHJldltzLnN0cnN0YXJ0ICYgcy53X21hc2tdID0gcy5oZWFkW3MuaW5zX2hdO1xuICAgICAgICAgIHMuaGVhZFtzLmluc19oXSA9IHMuc3Ryc3RhcnQ7XG4gICAgICAgICAgLyoqKi9cbiAgICAgICAgICAvKiBzdHJzdGFydCBuZXZlciBleGNlZWRzIFdTSVpFLU1BWF9NQVRDSCwgc28gdGhlcmUgYXJlXG4gICAgICAgICAgICogYWx3YXlzIE1JTl9NQVRDSCBieXRlcyBhaGVhZC5cbiAgICAgICAgICAgKi9cbiAgICAgICAgfSB3aGlsZSAoLS1zLm1hdGNoX2xlbmd0aCAhPT0gMCk7XG4gICAgICAgIHMuc3Ryc3RhcnQrKztcbiAgICAgIH0gZWxzZVxuICAgICAge1xuICAgICAgICBzLnN0cnN0YXJ0ICs9IHMubWF0Y2hfbGVuZ3RoO1xuICAgICAgICBzLm1hdGNoX2xlbmd0aCA9IDA7XG4gICAgICAgIHMuaW5zX2ggPSBzLndpbmRvd1tzLnN0cnN0YXJ0XTtcbiAgICAgICAgLyogVVBEQVRFX0hBU0gocywgcy5pbnNfaCwgcy53aW5kb3dbcy5zdHJzdGFydCsxXSk7ICovXG4gICAgICAgIHMuaW5zX2ggPSAoKHMuaW5zX2ggPDwgcy5oYXNoX3NoaWZ0KSBeIHMud2luZG93W3Muc3Ryc3RhcnQgKyAxXSkgJiBzLmhhc2hfbWFzaztcblxuLy8jaWYgTUlOX01BVENIICE9IDNcbi8vICAgICAgICAgICAgICAgIENhbGwgVVBEQVRFX0hBU0goKSBNSU5fTUFUQ0gtMyBtb3JlIHRpbWVzXG4vLyNlbmRpZlxuICAgICAgICAvKiBJZiBsb29rYWhlYWQgPCBNSU5fTUFUQ0gsIGluc19oIGlzIGdhcmJhZ2UsIGJ1dCBpdCBkb2VzIG5vdFxuICAgICAgICAgKiBtYXR0ZXIgc2luY2UgaXQgd2lsbCBiZSByZWNvbXB1dGVkIGF0IG5leHQgZGVmbGF0ZSBjYWxsLlxuICAgICAgICAgKi9cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLyogTm8gbWF0Y2gsIG91dHB1dCBhIGxpdGVyYWwgYnl0ZSAqL1xuICAgICAgLy9UcmFjZXZ2KChzdGRlcnIsXCIlY1wiLCBzLndpbmRvd1tzLnN0cnN0YXJ0XSkpO1xuICAgICAgLyoqKiBfdHJfdGFsbHlfbGl0KHMsIHMud2luZG93W3Muc3Ryc3RhcnRdLCBiZmx1c2gpOyAqKiovXG4gICAgICBiZmx1c2ggPSB0cmVlcy5fdHJfdGFsbHkocywgMCwgcy53aW5kb3dbcy5zdHJzdGFydF0pO1xuXG4gICAgICBzLmxvb2thaGVhZC0tO1xuICAgICAgcy5zdHJzdGFydCsrO1xuICAgIH1cbiAgICBpZiAoYmZsdXNoKSB7XG4gICAgICAvKioqIEZMVVNIX0JMT0NLKHMsIDApOyAqKiovXG4gICAgICBmbHVzaF9ibG9ja19vbmx5KHMsIGZhbHNlKTtcbiAgICAgIGlmIChzLnN0cm0uYXZhaWxfb3V0ID09PSAwKSB7XG4gICAgICAgIHJldHVybiBCU19ORUVEX01PUkU7XG4gICAgICB9XG4gICAgICAvKioqL1xuICAgIH1cbiAgfVxuICBzLmluc2VydCA9ICgocy5zdHJzdGFydCA8IChNSU5fTUFUQ0ggLSAxKSkgPyBzLnN0cnN0YXJ0IDogTUlOX01BVENIIC0gMSk7XG4gIGlmIChmbHVzaCA9PT0gWl9GSU5JU0gpIHtcbiAgICAvKioqIEZMVVNIX0JMT0NLKHMsIDEpOyAqKiovXG4gICAgZmx1c2hfYmxvY2tfb25seShzLCB0cnVlKTtcbiAgICBpZiAocy5zdHJtLmF2YWlsX291dCA9PT0gMCkge1xuICAgICAgcmV0dXJuIEJTX0ZJTklTSF9TVEFSVEVEO1xuICAgIH1cbiAgICAvKioqL1xuICAgIHJldHVybiBCU19GSU5JU0hfRE9ORTtcbiAgfVxuICBpZiAocy5sYXN0X2xpdCkge1xuICAgIC8qKiogRkxVU0hfQkxPQ0socywgMCk7ICoqKi9cbiAgICBmbHVzaF9ibG9ja19vbmx5KHMsIGZhbHNlKTtcbiAgICBpZiAocy5zdHJtLmF2YWlsX291dCA9PT0gMCkge1xuICAgICAgcmV0dXJuIEJTX05FRURfTU9SRTtcbiAgICB9XG4gICAgLyoqKi9cbiAgfVxuICByZXR1cm4gQlNfQkxPQ0tfRE9ORTtcbn1cblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBTYW1lIGFzIGFib3ZlLCBidXQgYWNoaWV2ZXMgYmV0dGVyIGNvbXByZXNzaW9uLiBXZSB1c2UgYSBsYXp5XG4gKiBldmFsdWF0aW9uIGZvciBtYXRjaGVzOiBhIG1hdGNoIGlzIGZpbmFsbHkgYWRvcHRlZCBvbmx5IGlmIHRoZXJlIGlzXG4gKiBubyBiZXR0ZXIgbWF0Y2ggYXQgdGhlIG5leHQgd2luZG93IHBvc2l0aW9uLlxuICovXG5mdW5jdGlvbiBkZWZsYXRlX3Nsb3cocywgZmx1c2gpIHtcbiAgdmFyIGhhc2hfaGVhZDsgICAgICAgICAgLyogaGVhZCBvZiBoYXNoIGNoYWluICovXG4gIHZhciBiZmx1c2g7ICAgICAgICAgICAgICAvKiBzZXQgaWYgY3VycmVudCBibG9jayBtdXN0IGJlIGZsdXNoZWQgKi9cblxuICB2YXIgbWF4X2luc2VydDtcblxuICAvKiBQcm9jZXNzIHRoZSBpbnB1dCBibG9jay4gKi9cbiAgZm9yICg7Oykge1xuICAgIC8qIE1ha2Ugc3VyZSB0aGF0IHdlIGFsd2F5cyBoYXZlIGVub3VnaCBsb29rYWhlYWQsIGV4Y2VwdFxuICAgICAqIGF0IHRoZSBlbmQgb2YgdGhlIGlucHV0IGZpbGUuIFdlIG5lZWQgTUFYX01BVENIIGJ5dGVzXG4gICAgICogZm9yIHRoZSBuZXh0IG1hdGNoLCBwbHVzIE1JTl9NQVRDSCBieXRlcyB0byBpbnNlcnQgdGhlXG4gICAgICogc3RyaW5nIGZvbGxvd2luZyB0aGUgbmV4dCBtYXRjaC5cbiAgICAgKi9cbiAgICBpZiAocy5sb29rYWhlYWQgPCBNSU5fTE9PS0FIRUFEKSB7XG4gICAgICBmaWxsX3dpbmRvdyhzKTtcbiAgICAgIGlmIChzLmxvb2thaGVhZCA8IE1JTl9MT09LQUhFQUQgJiYgZmx1c2ggPT09IFpfTk9fRkxVU0gpIHtcbiAgICAgICAgcmV0dXJuIEJTX05FRURfTU9SRTtcbiAgICAgIH1cbiAgICAgIGlmIChzLmxvb2thaGVhZCA9PT0gMCkgeyBicmVhazsgfSAvKiBmbHVzaCB0aGUgY3VycmVudCBibG9jayAqL1xuICAgIH1cblxuICAgIC8qIEluc2VydCB0aGUgc3RyaW5nIHdpbmRvd1tzdHJzdGFydCAuLiBzdHJzdGFydCsyXSBpbiB0aGVcbiAgICAgKiBkaWN0aW9uYXJ5LCBhbmQgc2V0IGhhc2hfaGVhZCB0byB0aGUgaGVhZCBvZiB0aGUgaGFzaCBjaGFpbjpcbiAgICAgKi9cbiAgICBoYXNoX2hlYWQgPSAwLypOSUwqLztcbiAgICBpZiAocy5sb29rYWhlYWQgPj0gTUlOX01BVENIKSB7XG4gICAgICAvKioqIElOU0VSVF9TVFJJTkcocywgcy5zdHJzdGFydCwgaGFzaF9oZWFkKTsgKioqL1xuICAgICAgcy5pbnNfaCA9ICgocy5pbnNfaCA8PCBzLmhhc2hfc2hpZnQpIF4gcy53aW5kb3dbcy5zdHJzdGFydCArIE1JTl9NQVRDSCAtIDFdKSAmIHMuaGFzaF9tYXNrO1xuICAgICAgaGFzaF9oZWFkID0gcy5wcmV2W3Muc3Ryc3RhcnQgJiBzLndfbWFza10gPSBzLmhlYWRbcy5pbnNfaF07XG4gICAgICBzLmhlYWRbcy5pbnNfaF0gPSBzLnN0cnN0YXJ0O1xuICAgICAgLyoqKi9cbiAgICB9XG5cbiAgICAvKiBGaW5kIHRoZSBsb25nZXN0IG1hdGNoLCBkaXNjYXJkaW5nIHRob3NlIDw9IHByZXZfbGVuZ3RoLlxuICAgICAqL1xuICAgIHMucHJldl9sZW5ndGggPSBzLm1hdGNoX2xlbmd0aDtcbiAgICBzLnByZXZfbWF0Y2ggPSBzLm1hdGNoX3N0YXJ0O1xuICAgIHMubWF0Y2hfbGVuZ3RoID0gTUlOX01BVENIIC0gMTtcblxuICAgIGlmIChoYXNoX2hlYWQgIT09IDAvKk5JTCovICYmIHMucHJldl9sZW5ndGggPCBzLm1heF9sYXp5X21hdGNoICYmXG4gICAgICAgIHMuc3Ryc3RhcnQgLSBoYXNoX2hlYWQgPD0gKHMud19zaXplIC0gTUlOX0xPT0tBSEVBRCkvKk1BWF9ESVNUKHMpKi8pIHtcbiAgICAgIC8qIFRvIHNpbXBsaWZ5IHRoZSBjb2RlLCB3ZSBwcmV2ZW50IG1hdGNoZXMgd2l0aCB0aGUgc3RyaW5nXG4gICAgICAgKiBvZiB3aW5kb3cgaW5kZXggMCAoaW4gcGFydGljdWxhciB3ZSBoYXZlIHRvIGF2b2lkIGEgbWF0Y2hcbiAgICAgICAqIG9mIHRoZSBzdHJpbmcgd2l0aCBpdHNlbGYgYXQgdGhlIHN0YXJ0IG9mIHRoZSBpbnB1dCBmaWxlKS5cbiAgICAgICAqL1xuICAgICAgcy5tYXRjaF9sZW5ndGggPSBsb25nZXN0X21hdGNoKHMsIGhhc2hfaGVhZCk7XG4gICAgICAvKiBsb25nZXN0X21hdGNoKCkgc2V0cyBtYXRjaF9zdGFydCAqL1xuXG4gICAgICBpZiAocy5tYXRjaF9sZW5ndGggPD0gNSAmJlxuICAgICAgICAgKHMuc3RyYXRlZ3kgPT09IFpfRklMVEVSRUQgfHwgKHMubWF0Y2hfbGVuZ3RoID09PSBNSU5fTUFUQ0ggJiYgcy5zdHJzdGFydCAtIHMubWF0Y2hfc3RhcnQgPiA0MDk2LypUT09fRkFSKi8pKSkge1xuXG4gICAgICAgIC8qIElmIHByZXZfbWF0Y2ggaXMgYWxzbyBNSU5fTUFUQ0gsIG1hdGNoX3N0YXJ0IGlzIGdhcmJhZ2VcbiAgICAgICAgICogYnV0IHdlIHdpbGwgaWdub3JlIHRoZSBjdXJyZW50IG1hdGNoIGFueXdheS5cbiAgICAgICAgICovXG4gICAgICAgIHMubWF0Y2hfbGVuZ3RoID0gTUlOX01BVENIIC0gMTtcbiAgICAgIH1cbiAgICB9XG4gICAgLyogSWYgdGhlcmUgd2FzIGEgbWF0Y2ggYXQgdGhlIHByZXZpb3VzIHN0ZXAgYW5kIHRoZSBjdXJyZW50XG4gICAgICogbWF0Y2ggaXMgbm90IGJldHRlciwgb3V0cHV0IHRoZSBwcmV2aW91cyBtYXRjaDpcbiAgICAgKi9cbiAgICBpZiAocy5wcmV2X2xlbmd0aCA+PSBNSU5fTUFUQ0ggJiYgcy5tYXRjaF9sZW5ndGggPD0gcy5wcmV2X2xlbmd0aCkge1xuICAgICAgbWF4X2luc2VydCA9IHMuc3Ryc3RhcnQgKyBzLmxvb2thaGVhZCAtIE1JTl9NQVRDSDtcbiAgICAgIC8qIERvIG5vdCBpbnNlcnQgc3RyaW5ncyBpbiBoYXNoIHRhYmxlIGJleW9uZCB0aGlzLiAqL1xuXG4gICAgICAvL2NoZWNrX21hdGNoKHMsIHMuc3Ryc3RhcnQtMSwgcy5wcmV2X21hdGNoLCBzLnByZXZfbGVuZ3RoKTtcblxuICAgICAgLyoqKl90cl90YWxseV9kaXN0KHMsIHMuc3Ryc3RhcnQgLSAxIC0gcy5wcmV2X21hdGNoLFxuICAgICAgICAgICAgICAgICAgICAgcy5wcmV2X2xlbmd0aCAtIE1JTl9NQVRDSCwgYmZsdXNoKTsqKiovXG4gICAgICBiZmx1c2ggPSB0cmVlcy5fdHJfdGFsbHkocywgcy5zdHJzdGFydCAtIDEgLSBzLnByZXZfbWF0Y2gsIHMucHJldl9sZW5ndGggLSBNSU5fTUFUQ0gpO1xuICAgICAgLyogSW5zZXJ0IGluIGhhc2ggdGFibGUgYWxsIHN0cmluZ3MgdXAgdG8gdGhlIGVuZCBvZiB0aGUgbWF0Y2guXG4gICAgICAgKiBzdHJzdGFydC0xIGFuZCBzdHJzdGFydCBhcmUgYWxyZWFkeSBpbnNlcnRlZC4gSWYgdGhlcmUgaXMgbm90XG4gICAgICAgKiBlbm91Z2ggbG9va2FoZWFkLCB0aGUgbGFzdCB0d28gc3RyaW5ncyBhcmUgbm90IGluc2VydGVkIGluXG4gICAgICAgKiB0aGUgaGFzaCB0YWJsZS5cbiAgICAgICAqL1xuICAgICAgcy5sb29rYWhlYWQgLT0gcy5wcmV2X2xlbmd0aCAtIDE7XG4gICAgICBzLnByZXZfbGVuZ3RoIC09IDI7XG4gICAgICBkbyB7XG4gICAgICAgIGlmICgrK3Muc3Ryc3RhcnQgPD0gbWF4X2luc2VydCkge1xuICAgICAgICAgIC8qKiogSU5TRVJUX1NUUklORyhzLCBzLnN0cnN0YXJ0LCBoYXNoX2hlYWQpOyAqKiovXG4gICAgICAgICAgcy5pbnNfaCA9ICgocy5pbnNfaCA8PCBzLmhhc2hfc2hpZnQpIF4gcy53aW5kb3dbcy5zdHJzdGFydCArIE1JTl9NQVRDSCAtIDFdKSAmIHMuaGFzaF9tYXNrO1xuICAgICAgICAgIGhhc2hfaGVhZCA9IHMucHJldltzLnN0cnN0YXJ0ICYgcy53X21hc2tdID0gcy5oZWFkW3MuaW5zX2hdO1xuICAgICAgICAgIHMuaGVhZFtzLmluc19oXSA9IHMuc3Ryc3RhcnQ7XG4gICAgICAgICAgLyoqKi9cbiAgICAgICAgfVxuICAgICAgfSB3aGlsZSAoLS1zLnByZXZfbGVuZ3RoICE9PSAwKTtcbiAgICAgIHMubWF0Y2hfYXZhaWxhYmxlID0gMDtcbiAgICAgIHMubWF0Y2hfbGVuZ3RoID0gTUlOX01BVENIIC0gMTtcbiAgICAgIHMuc3Ryc3RhcnQrKztcblxuICAgICAgaWYgKGJmbHVzaCkge1xuICAgICAgICAvKioqIEZMVVNIX0JMT0NLKHMsIDApOyAqKiovXG4gICAgICAgIGZsdXNoX2Jsb2NrX29ubHkocywgZmFsc2UpO1xuICAgICAgICBpZiAocy5zdHJtLmF2YWlsX291dCA9PT0gMCkge1xuICAgICAgICAgIHJldHVybiBCU19ORUVEX01PUkU7XG4gICAgICAgIH1cbiAgICAgICAgLyoqKi9cbiAgICAgIH1cblxuICAgIH0gZWxzZSBpZiAocy5tYXRjaF9hdmFpbGFibGUpIHtcbiAgICAgIC8qIElmIHRoZXJlIHdhcyBubyBtYXRjaCBhdCB0aGUgcHJldmlvdXMgcG9zaXRpb24sIG91dHB1dCBhXG4gICAgICAgKiBzaW5nbGUgbGl0ZXJhbC4gSWYgdGhlcmUgd2FzIGEgbWF0Y2ggYnV0IHRoZSBjdXJyZW50IG1hdGNoXG4gICAgICAgKiBpcyBsb25nZXIsIHRydW5jYXRlIHRoZSBwcmV2aW91cyBtYXRjaCB0byBhIHNpbmdsZSBsaXRlcmFsLlxuICAgICAgICovXG4gICAgICAvL1RyYWNldnYoKHN0ZGVycixcIiVjXCIsIHMtPndpbmRvd1tzLT5zdHJzdGFydC0xXSkpO1xuICAgICAgLyoqKiBfdHJfdGFsbHlfbGl0KHMsIHMud2luZG93W3Muc3Ryc3RhcnQtMV0sIGJmbHVzaCk7ICoqKi9cbiAgICAgIGJmbHVzaCA9IHRyZWVzLl90cl90YWxseShzLCAwLCBzLndpbmRvd1tzLnN0cnN0YXJ0IC0gMV0pO1xuXG4gICAgICBpZiAoYmZsdXNoKSB7XG4gICAgICAgIC8qKiogRkxVU0hfQkxPQ0tfT05MWShzLCAwKSAqKiovXG4gICAgICAgIGZsdXNoX2Jsb2NrX29ubHkocywgZmFsc2UpO1xuICAgICAgICAvKioqL1xuICAgICAgfVxuICAgICAgcy5zdHJzdGFydCsrO1xuICAgICAgcy5sb29rYWhlYWQtLTtcbiAgICAgIGlmIChzLnN0cm0uYXZhaWxfb3V0ID09PSAwKSB7XG4gICAgICAgIHJldHVybiBCU19ORUVEX01PUkU7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8qIFRoZXJlIGlzIG5vIHByZXZpb3VzIG1hdGNoIHRvIGNvbXBhcmUgd2l0aCwgd2FpdCBmb3JcbiAgICAgICAqIHRoZSBuZXh0IHN0ZXAgdG8gZGVjaWRlLlxuICAgICAgICovXG4gICAgICBzLm1hdGNoX2F2YWlsYWJsZSA9IDE7XG4gICAgICBzLnN0cnN0YXJ0Kys7XG4gICAgICBzLmxvb2thaGVhZC0tO1xuICAgIH1cbiAgfVxuICAvL0Fzc2VydCAoZmx1c2ggIT0gWl9OT19GTFVTSCwgXCJubyBmbHVzaD9cIik7XG4gIGlmIChzLm1hdGNoX2F2YWlsYWJsZSkge1xuICAgIC8vVHJhY2V2digoc3RkZXJyLFwiJWNcIiwgcy0+d2luZG93W3MtPnN0cnN0YXJ0LTFdKSk7XG4gICAgLyoqKiBfdHJfdGFsbHlfbGl0KHMsIHMud2luZG93W3Muc3Ryc3RhcnQtMV0sIGJmbHVzaCk7ICoqKi9cbiAgICBiZmx1c2ggPSB0cmVlcy5fdHJfdGFsbHkocywgMCwgcy53aW5kb3dbcy5zdHJzdGFydCAtIDFdKTtcblxuICAgIHMubWF0Y2hfYXZhaWxhYmxlID0gMDtcbiAgfVxuICBzLmluc2VydCA9IHMuc3Ryc3RhcnQgPCBNSU5fTUFUQ0ggLSAxID8gcy5zdHJzdGFydCA6IE1JTl9NQVRDSCAtIDE7XG4gIGlmIChmbHVzaCA9PT0gWl9GSU5JU0gpIHtcbiAgICAvKioqIEZMVVNIX0JMT0NLKHMsIDEpOyAqKiovXG4gICAgZmx1c2hfYmxvY2tfb25seShzLCB0cnVlKTtcbiAgICBpZiAocy5zdHJtLmF2YWlsX291dCA9PT0gMCkge1xuICAgICAgcmV0dXJuIEJTX0ZJTklTSF9TVEFSVEVEO1xuICAgIH1cbiAgICAvKioqL1xuICAgIHJldHVybiBCU19GSU5JU0hfRE9ORTtcbiAgfVxuICBpZiAocy5sYXN0X2xpdCkge1xuICAgIC8qKiogRkxVU0hfQkxPQ0socywgMCk7ICoqKi9cbiAgICBmbHVzaF9ibG9ja19vbmx5KHMsIGZhbHNlKTtcbiAgICBpZiAocy5zdHJtLmF2YWlsX291dCA9PT0gMCkge1xuICAgICAgcmV0dXJuIEJTX05FRURfTU9SRTtcbiAgICB9XG4gICAgLyoqKi9cbiAgfVxuXG4gIHJldHVybiBCU19CTE9DS19ET05FO1xufVxuXG5cbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogRm9yIFpfUkxFLCBzaW1wbHkgbG9vayBmb3IgcnVucyBvZiBieXRlcywgZ2VuZXJhdGUgbWF0Y2hlcyBvbmx5IG9mIGRpc3RhbmNlXG4gKiBvbmUuICBEbyBub3QgbWFpbnRhaW4gYSBoYXNoIHRhYmxlLiAgKEl0IHdpbGwgYmUgcmVnZW5lcmF0ZWQgaWYgdGhpcyBydW4gb2ZcbiAqIGRlZmxhdGUgc3dpdGNoZXMgYXdheSBmcm9tIFpfUkxFLilcbiAqL1xuZnVuY3Rpb24gZGVmbGF0ZV9ybGUocywgZmx1c2gpIHtcbiAgdmFyIGJmbHVzaDsgICAgICAgICAgICAvKiBzZXQgaWYgY3VycmVudCBibG9jayBtdXN0IGJlIGZsdXNoZWQgKi9cbiAgdmFyIHByZXY7ICAgICAgICAgICAgICAvKiBieXRlIGF0IGRpc3RhbmNlIG9uZSB0byBtYXRjaCAqL1xuICB2YXIgc2Nhbiwgc3RyZW5kOyAgICAgIC8qIHNjYW4gZ29lcyB1cCB0byBzdHJlbmQgZm9yIGxlbmd0aCBvZiBydW4gKi9cblxuICB2YXIgX3dpbiA9IHMud2luZG93O1xuXG4gIGZvciAoOzspIHtcbiAgICAvKiBNYWtlIHN1cmUgdGhhdCB3ZSBhbHdheXMgaGF2ZSBlbm91Z2ggbG9va2FoZWFkLCBleGNlcHRcbiAgICAgKiBhdCB0aGUgZW5kIG9mIHRoZSBpbnB1dCBmaWxlLiBXZSBuZWVkIE1BWF9NQVRDSCBieXRlc1xuICAgICAqIGZvciB0aGUgbG9uZ2VzdCBydW4sIHBsdXMgb25lIGZvciB0aGUgdW5yb2xsZWQgbG9vcC5cbiAgICAgKi9cbiAgICBpZiAocy5sb29rYWhlYWQgPD0gTUFYX01BVENIKSB7XG4gICAgICBmaWxsX3dpbmRvdyhzKTtcbiAgICAgIGlmIChzLmxvb2thaGVhZCA8PSBNQVhfTUFUQ0ggJiYgZmx1c2ggPT09IFpfTk9fRkxVU0gpIHtcbiAgICAgICAgcmV0dXJuIEJTX05FRURfTU9SRTtcbiAgICAgIH1cbiAgICAgIGlmIChzLmxvb2thaGVhZCA9PT0gMCkgeyBicmVhazsgfSAvKiBmbHVzaCB0aGUgY3VycmVudCBibG9jayAqL1xuICAgIH1cblxuICAgIC8qIFNlZSBob3cgbWFueSB0aW1lcyB0aGUgcHJldmlvdXMgYnl0ZSByZXBlYXRzICovXG4gICAgcy5tYXRjaF9sZW5ndGggPSAwO1xuICAgIGlmIChzLmxvb2thaGVhZCA+PSBNSU5fTUFUQ0ggJiYgcy5zdHJzdGFydCA+IDApIHtcbiAgICAgIHNjYW4gPSBzLnN0cnN0YXJ0IC0gMTtcbiAgICAgIHByZXYgPSBfd2luW3NjYW5dO1xuICAgICAgaWYgKHByZXYgPT09IF93aW5bKytzY2FuXSAmJiBwcmV2ID09PSBfd2luWysrc2Nhbl0gJiYgcHJldiA9PT0gX3dpblsrK3NjYW5dKSB7XG4gICAgICAgIHN0cmVuZCA9IHMuc3Ryc3RhcnQgKyBNQVhfTUFUQ0g7XG4gICAgICAgIGRvIHtcbiAgICAgICAgICAvKmpzaGludCBub2VtcHR5OmZhbHNlKi9cbiAgICAgICAgfSB3aGlsZSAocHJldiA9PT0gX3dpblsrK3NjYW5dICYmIHByZXYgPT09IF93aW5bKytzY2FuXSAmJlxuICAgICAgICAgICAgICAgICBwcmV2ID09PSBfd2luWysrc2Nhbl0gJiYgcHJldiA9PT0gX3dpblsrK3NjYW5dICYmXG4gICAgICAgICAgICAgICAgIHByZXYgPT09IF93aW5bKytzY2FuXSAmJiBwcmV2ID09PSBfd2luWysrc2Nhbl0gJiZcbiAgICAgICAgICAgICAgICAgcHJldiA9PT0gX3dpblsrK3NjYW5dICYmIHByZXYgPT09IF93aW5bKytzY2FuXSAmJlxuICAgICAgICAgICAgICAgICBzY2FuIDwgc3RyZW5kKTtcbiAgICAgICAgcy5tYXRjaF9sZW5ndGggPSBNQVhfTUFUQ0ggLSAoc3RyZW5kIC0gc2Nhbik7XG4gICAgICAgIGlmIChzLm1hdGNoX2xlbmd0aCA+IHMubG9va2FoZWFkKSB7XG4gICAgICAgICAgcy5tYXRjaF9sZW5ndGggPSBzLmxvb2thaGVhZDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy9Bc3NlcnQoc2NhbiA8PSBzLT53aW5kb3crKHVJbnQpKHMtPndpbmRvd19zaXplLTEpLCBcIndpbGQgc2NhblwiKTtcbiAgICB9XG5cbiAgICAvKiBFbWl0IG1hdGNoIGlmIGhhdmUgcnVuIG9mIE1JTl9NQVRDSCBvciBsb25nZXIsIGVsc2UgZW1pdCBsaXRlcmFsICovXG4gICAgaWYgKHMubWF0Y2hfbGVuZ3RoID49IE1JTl9NQVRDSCkge1xuICAgICAgLy9jaGVja19tYXRjaChzLCBzLnN0cnN0YXJ0LCBzLnN0cnN0YXJ0IC0gMSwgcy5tYXRjaF9sZW5ndGgpO1xuXG4gICAgICAvKioqIF90cl90YWxseV9kaXN0KHMsIDEsIHMubWF0Y2hfbGVuZ3RoIC0gTUlOX01BVENILCBiZmx1c2gpOyAqKiovXG4gICAgICBiZmx1c2ggPSB0cmVlcy5fdHJfdGFsbHkocywgMSwgcy5tYXRjaF9sZW5ndGggLSBNSU5fTUFUQ0gpO1xuXG4gICAgICBzLmxvb2thaGVhZCAtPSBzLm1hdGNoX2xlbmd0aDtcbiAgICAgIHMuc3Ryc3RhcnQgKz0gcy5tYXRjaF9sZW5ndGg7XG4gICAgICBzLm1hdGNoX2xlbmd0aCA9IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8qIE5vIG1hdGNoLCBvdXRwdXQgYSBsaXRlcmFsIGJ5dGUgKi9cbiAgICAgIC8vVHJhY2V2digoc3RkZXJyLFwiJWNcIiwgcy0+d2luZG93W3MtPnN0cnN0YXJ0XSkpO1xuICAgICAgLyoqKiBfdHJfdGFsbHlfbGl0KHMsIHMud2luZG93W3Muc3Ryc3RhcnRdLCBiZmx1c2gpOyAqKiovXG4gICAgICBiZmx1c2ggPSB0cmVlcy5fdHJfdGFsbHkocywgMCwgcy53aW5kb3dbcy5zdHJzdGFydF0pO1xuXG4gICAgICBzLmxvb2thaGVhZC0tO1xuICAgICAgcy5zdHJzdGFydCsrO1xuICAgIH1cbiAgICBpZiAoYmZsdXNoKSB7XG4gICAgICAvKioqIEZMVVNIX0JMT0NLKHMsIDApOyAqKiovXG4gICAgICBmbHVzaF9ibG9ja19vbmx5KHMsIGZhbHNlKTtcbiAgICAgIGlmIChzLnN0cm0uYXZhaWxfb3V0ID09PSAwKSB7XG4gICAgICAgIHJldHVybiBCU19ORUVEX01PUkU7XG4gICAgICB9XG4gICAgICAvKioqL1xuICAgIH1cbiAgfVxuICBzLmluc2VydCA9IDA7XG4gIGlmIChmbHVzaCA9PT0gWl9GSU5JU0gpIHtcbiAgICAvKioqIEZMVVNIX0JMT0NLKHMsIDEpOyAqKiovXG4gICAgZmx1c2hfYmxvY2tfb25seShzLCB0cnVlKTtcbiAgICBpZiAocy5zdHJtLmF2YWlsX291dCA9PT0gMCkge1xuICAgICAgcmV0dXJuIEJTX0ZJTklTSF9TVEFSVEVEO1xuICAgIH1cbiAgICAvKioqL1xuICAgIHJldHVybiBCU19GSU5JU0hfRE9ORTtcbiAgfVxuICBpZiAocy5sYXN0X2xpdCkge1xuICAgIC8qKiogRkxVU0hfQkxPQ0socywgMCk7ICoqKi9cbiAgICBmbHVzaF9ibG9ja19vbmx5KHMsIGZhbHNlKTtcbiAgICBpZiAocy5zdHJtLmF2YWlsX291dCA9PT0gMCkge1xuICAgICAgcmV0dXJuIEJTX05FRURfTU9SRTtcbiAgICB9XG4gICAgLyoqKi9cbiAgfVxuICByZXR1cm4gQlNfQkxPQ0tfRE9ORTtcbn1cblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBGb3IgWl9IVUZGTUFOX09OTFksIGRvIG5vdCBsb29rIGZvciBtYXRjaGVzLiAgRG8gbm90IG1haW50YWluIGEgaGFzaCB0YWJsZS5cbiAqIChJdCB3aWxsIGJlIHJlZ2VuZXJhdGVkIGlmIHRoaXMgcnVuIG9mIGRlZmxhdGUgc3dpdGNoZXMgYXdheSBmcm9tIEh1ZmZtYW4uKVxuICovXG5mdW5jdGlvbiBkZWZsYXRlX2h1ZmYocywgZmx1c2gpIHtcbiAgdmFyIGJmbHVzaDsgICAgICAgICAgICAgLyogc2V0IGlmIGN1cnJlbnQgYmxvY2sgbXVzdCBiZSBmbHVzaGVkICovXG5cbiAgZm9yICg7Oykge1xuICAgIC8qIE1ha2Ugc3VyZSB0aGF0IHdlIGhhdmUgYSBsaXRlcmFsIHRvIHdyaXRlLiAqL1xuICAgIGlmIChzLmxvb2thaGVhZCA9PT0gMCkge1xuICAgICAgZmlsbF93aW5kb3cocyk7XG4gICAgICBpZiAocy5sb29rYWhlYWQgPT09IDApIHtcbiAgICAgICAgaWYgKGZsdXNoID09PSBaX05PX0ZMVVNIKSB7XG4gICAgICAgICAgcmV0dXJuIEJTX05FRURfTU9SRTtcbiAgICAgICAgfVxuICAgICAgICBicmVhazsgICAgICAvKiBmbHVzaCB0aGUgY3VycmVudCBibG9jayAqL1xuICAgICAgfVxuICAgIH1cblxuICAgIC8qIE91dHB1dCBhIGxpdGVyYWwgYnl0ZSAqL1xuICAgIHMubWF0Y2hfbGVuZ3RoID0gMDtcbiAgICAvL1RyYWNldnYoKHN0ZGVycixcIiVjXCIsIHMtPndpbmRvd1tzLT5zdHJzdGFydF0pKTtcbiAgICAvKioqIF90cl90YWxseV9saXQocywgcy53aW5kb3dbcy5zdHJzdGFydF0sIGJmbHVzaCk7ICoqKi9cbiAgICBiZmx1c2ggPSB0cmVlcy5fdHJfdGFsbHkocywgMCwgcy53aW5kb3dbcy5zdHJzdGFydF0pO1xuICAgIHMubG9va2FoZWFkLS07XG4gICAgcy5zdHJzdGFydCsrO1xuICAgIGlmIChiZmx1c2gpIHtcbiAgICAgIC8qKiogRkxVU0hfQkxPQ0socywgMCk7ICoqKi9cbiAgICAgIGZsdXNoX2Jsb2NrX29ubHkocywgZmFsc2UpO1xuICAgICAgaWYgKHMuc3RybS5hdmFpbF9vdXQgPT09IDApIHtcbiAgICAgICAgcmV0dXJuIEJTX05FRURfTU9SRTtcbiAgICAgIH1cbiAgICAgIC8qKiovXG4gICAgfVxuICB9XG4gIHMuaW5zZXJ0ID0gMDtcbiAgaWYgKGZsdXNoID09PSBaX0ZJTklTSCkge1xuICAgIC8qKiogRkxVU0hfQkxPQ0socywgMSk7ICoqKi9cbiAgICBmbHVzaF9ibG9ja19vbmx5KHMsIHRydWUpO1xuICAgIGlmIChzLnN0cm0uYXZhaWxfb3V0ID09PSAwKSB7XG4gICAgICByZXR1cm4gQlNfRklOSVNIX1NUQVJURUQ7XG4gICAgfVxuICAgIC8qKiovXG4gICAgcmV0dXJuIEJTX0ZJTklTSF9ET05FO1xuICB9XG4gIGlmIChzLmxhc3RfbGl0KSB7XG4gICAgLyoqKiBGTFVTSF9CTE9DSyhzLCAwKTsgKioqL1xuICAgIGZsdXNoX2Jsb2NrX29ubHkocywgZmFsc2UpO1xuICAgIGlmIChzLnN0cm0uYXZhaWxfb3V0ID09PSAwKSB7XG4gICAgICByZXR1cm4gQlNfTkVFRF9NT1JFO1xuICAgIH1cbiAgICAvKioqL1xuICB9XG4gIHJldHVybiBCU19CTE9DS19ET05FO1xufVxuXG4vKiBWYWx1ZXMgZm9yIG1heF9sYXp5X21hdGNoLCBnb29kX21hdGNoIGFuZCBtYXhfY2hhaW5fbGVuZ3RoLCBkZXBlbmRpbmcgb25cbiAqIHRoZSBkZXNpcmVkIHBhY2sgbGV2ZWwgKDAuLjkpLiBUaGUgdmFsdWVzIGdpdmVuIGJlbG93IGhhdmUgYmVlbiB0dW5lZCB0b1xuICogZXhjbHVkZSB3b3JzdCBjYXNlIHBlcmZvcm1hbmNlIGZvciBwYXRob2xvZ2ljYWwgZmlsZXMuIEJldHRlciB2YWx1ZXMgbWF5IGJlXG4gKiBmb3VuZCBmb3Igc3BlY2lmaWMgZmlsZXMuXG4gKi9cbmZ1bmN0aW9uIENvbmZpZyhnb29kX2xlbmd0aCwgbWF4X2xhenksIG5pY2VfbGVuZ3RoLCBtYXhfY2hhaW4sIGZ1bmMpIHtcbiAgdGhpcy5nb29kX2xlbmd0aCA9IGdvb2RfbGVuZ3RoO1xuICB0aGlzLm1heF9sYXp5ID0gbWF4X2xhenk7XG4gIHRoaXMubmljZV9sZW5ndGggPSBuaWNlX2xlbmd0aDtcbiAgdGhpcy5tYXhfY2hhaW4gPSBtYXhfY2hhaW47XG4gIHRoaXMuZnVuYyA9IGZ1bmM7XG59XG5cbnZhciBjb25maWd1cmF0aW9uX3RhYmxlO1xuXG5jb25maWd1cmF0aW9uX3RhYmxlID0gW1xuICAvKiAgICAgIGdvb2QgbGF6eSBuaWNlIGNoYWluICovXG4gIG5ldyBDb25maWcoMCwgMCwgMCwgMCwgZGVmbGF0ZV9zdG9yZWQpLCAgICAgICAgICAvKiAwIHN0b3JlIG9ubHkgKi9cbiAgbmV3IENvbmZpZyg0LCA0LCA4LCA0LCBkZWZsYXRlX2Zhc3QpLCAgICAgICAgICAgIC8qIDEgbWF4IHNwZWVkLCBubyBsYXp5IG1hdGNoZXMgKi9cbiAgbmV3IENvbmZpZyg0LCA1LCAxNiwgOCwgZGVmbGF0ZV9mYXN0KSwgICAgICAgICAgIC8qIDIgKi9cbiAgbmV3IENvbmZpZyg0LCA2LCAzMiwgMzIsIGRlZmxhdGVfZmFzdCksICAgICAgICAgIC8qIDMgKi9cblxuICBuZXcgQ29uZmlnKDQsIDQsIDE2LCAxNiwgZGVmbGF0ZV9zbG93KSwgICAgICAgICAgLyogNCBsYXp5IG1hdGNoZXMgKi9cbiAgbmV3IENvbmZpZyg4LCAxNiwgMzIsIDMyLCBkZWZsYXRlX3Nsb3cpLCAgICAgICAgIC8qIDUgKi9cbiAgbmV3IENvbmZpZyg4LCAxNiwgMTI4LCAxMjgsIGRlZmxhdGVfc2xvdyksICAgICAgIC8qIDYgKi9cbiAgbmV3IENvbmZpZyg4LCAzMiwgMTI4LCAyNTYsIGRlZmxhdGVfc2xvdyksICAgICAgIC8qIDcgKi9cbiAgbmV3IENvbmZpZygzMiwgMTI4LCAyNTgsIDEwMjQsIGRlZmxhdGVfc2xvdyksICAgIC8qIDggKi9cbiAgbmV3IENvbmZpZygzMiwgMjU4LCAyNTgsIDQwOTYsIGRlZmxhdGVfc2xvdykgICAgIC8qIDkgbWF4IGNvbXByZXNzaW9uICovXG5dO1xuXG5cbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogSW5pdGlhbGl6ZSB0aGUgXCJsb25nZXN0IG1hdGNoXCIgcm91dGluZXMgZm9yIGEgbmV3IHpsaWIgc3RyZWFtXG4gKi9cbmZ1bmN0aW9uIGxtX2luaXQocykge1xuICBzLndpbmRvd19zaXplID0gMiAqIHMud19zaXplO1xuXG4gIC8qKiogQ0xFQVJfSEFTSChzKTsgKioqL1xuICB6ZXJvKHMuaGVhZCk7IC8vIEZpbGwgd2l0aCBOSUwgKD0gMCk7XG5cbiAgLyogU2V0IHRoZSBkZWZhdWx0IGNvbmZpZ3VyYXRpb24gcGFyYW1ldGVyczpcbiAgICovXG4gIHMubWF4X2xhenlfbWF0Y2ggPSBjb25maWd1cmF0aW9uX3RhYmxlW3MubGV2ZWxdLm1heF9sYXp5O1xuICBzLmdvb2RfbWF0Y2ggPSBjb25maWd1cmF0aW9uX3RhYmxlW3MubGV2ZWxdLmdvb2RfbGVuZ3RoO1xuICBzLm5pY2VfbWF0Y2ggPSBjb25maWd1cmF0aW9uX3RhYmxlW3MubGV2ZWxdLm5pY2VfbGVuZ3RoO1xuICBzLm1heF9jaGFpbl9sZW5ndGggPSBjb25maWd1cmF0aW9uX3RhYmxlW3MubGV2ZWxdLm1heF9jaGFpbjtcblxuICBzLnN0cnN0YXJ0ID0gMDtcbiAgcy5ibG9ja19zdGFydCA9IDA7XG4gIHMubG9va2FoZWFkID0gMDtcbiAgcy5pbnNlcnQgPSAwO1xuICBzLm1hdGNoX2xlbmd0aCA9IHMucHJldl9sZW5ndGggPSBNSU5fTUFUQ0ggLSAxO1xuICBzLm1hdGNoX2F2YWlsYWJsZSA9IDA7XG4gIHMuaW5zX2ggPSAwO1xufVxuXG5cbmZ1bmN0aW9uIERlZmxhdGVTdGF0ZSgpIHtcbiAgdGhpcy5zdHJtID0gbnVsbDsgICAgICAgICAgICAvKiBwb2ludGVyIGJhY2sgdG8gdGhpcyB6bGliIHN0cmVhbSAqL1xuICB0aGlzLnN0YXR1cyA9IDA7ICAgICAgICAgICAgLyogYXMgdGhlIG5hbWUgaW1wbGllcyAqL1xuICB0aGlzLnBlbmRpbmdfYnVmID0gbnVsbDsgICAgICAvKiBvdXRwdXQgc3RpbGwgcGVuZGluZyAqL1xuICB0aGlzLnBlbmRpbmdfYnVmX3NpemUgPSAwOyAgLyogc2l6ZSBvZiBwZW5kaW5nX2J1ZiAqL1xuICB0aGlzLnBlbmRpbmdfb3V0ID0gMDsgICAgICAgLyogbmV4dCBwZW5kaW5nIGJ5dGUgdG8gb3V0cHV0IHRvIHRoZSBzdHJlYW0gKi9cbiAgdGhpcy5wZW5kaW5nID0gMDsgICAgICAgICAgIC8qIG5iIG9mIGJ5dGVzIGluIHRoZSBwZW5kaW5nIGJ1ZmZlciAqL1xuICB0aGlzLndyYXAgPSAwOyAgICAgICAgICAgICAgLyogYml0IDAgdHJ1ZSBmb3IgemxpYiwgYml0IDEgdHJ1ZSBmb3IgZ3ppcCAqL1xuICB0aGlzLmd6aGVhZCA9IG51bGw7ICAgICAgICAgLyogZ3ppcCBoZWFkZXIgaW5mb3JtYXRpb24gdG8gd3JpdGUgKi9cbiAgdGhpcy5nemluZGV4ID0gMDsgICAgICAgICAgIC8qIHdoZXJlIGluIGV4dHJhLCBuYW1lLCBvciBjb21tZW50ICovXG4gIHRoaXMubWV0aG9kID0gWl9ERUZMQVRFRDsgLyogY2FuIG9ubHkgYmUgREVGTEFURUQgKi9cbiAgdGhpcy5sYXN0X2ZsdXNoID0gLTE7ICAgLyogdmFsdWUgb2YgZmx1c2ggcGFyYW0gZm9yIHByZXZpb3VzIGRlZmxhdGUgY2FsbCAqL1xuXG4gIHRoaXMud19zaXplID0gMDsgIC8qIExaNzcgd2luZG93IHNpemUgKDMySyBieSBkZWZhdWx0KSAqL1xuICB0aGlzLndfYml0cyA9IDA7ICAvKiBsb2cyKHdfc2l6ZSkgICg4Li4xNikgKi9cbiAgdGhpcy53X21hc2sgPSAwOyAgLyogd19zaXplIC0gMSAqL1xuXG4gIHRoaXMud2luZG93ID0gbnVsbDtcbiAgLyogU2xpZGluZyB3aW5kb3cuIElucHV0IGJ5dGVzIGFyZSByZWFkIGludG8gdGhlIHNlY29uZCBoYWxmIG9mIHRoZSB3aW5kb3csXG4gICAqIGFuZCBtb3ZlIHRvIHRoZSBmaXJzdCBoYWxmIGxhdGVyIHRvIGtlZXAgYSBkaWN0aW9uYXJ5IG9mIGF0IGxlYXN0IHdTaXplXG4gICAqIGJ5dGVzLiBXaXRoIHRoaXMgb3JnYW5pemF0aW9uLCBtYXRjaGVzIGFyZSBsaW1pdGVkIHRvIGEgZGlzdGFuY2Ugb2ZcbiAgICogd1NpemUtTUFYX01BVENIIGJ5dGVzLCBidXQgdGhpcyBlbnN1cmVzIHRoYXQgSU8gaXMgYWx3YXlzXG4gICAqIHBlcmZvcm1lZCB3aXRoIGEgbGVuZ3RoIG11bHRpcGxlIG9mIHRoZSBibG9jayBzaXplLlxuICAgKi9cblxuICB0aGlzLndpbmRvd19zaXplID0gMDtcbiAgLyogQWN0dWFsIHNpemUgb2Ygd2luZG93OiAyKndTaXplLCBleGNlcHQgd2hlbiB0aGUgdXNlciBpbnB1dCBidWZmZXJcbiAgICogaXMgZGlyZWN0bHkgdXNlZCBhcyBzbGlkaW5nIHdpbmRvdy5cbiAgICovXG5cbiAgdGhpcy5wcmV2ID0gbnVsbDtcbiAgLyogTGluayB0byBvbGRlciBzdHJpbmcgd2l0aCBzYW1lIGhhc2ggaW5kZXguIFRvIGxpbWl0IHRoZSBzaXplIG9mIHRoaXNcbiAgICogYXJyYXkgdG8gNjRLLCB0aGlzIGxpbmsgaXMgbWFpbnRhaW5lZCBvbmx5IGZvciB0aGUgbGFzdCAzMksgc3RyaW5ncy5cbiAgICogQW4gaW5kZXggaW4gdGhpcyBhcnJheSBpcyB0aHVzIGEgd2luZG93IGluZGV4IG1vZHVsbyAzMksuXG4gICAqL1xuXG4gIHRoaXMuaGVhZCA9IG51bGw7ICAgLyogSGVhZHMgb2YgdGhlIGhhc2ggY2hhaW5zIG9yIE5JTC4gKi9cblxuICB0aGlzLmluc19oID0gMDsgICAgICAgLyogaGFzaCBpbmRleCBvZiBzdHJpbmcgdG8gYmUgaW5zZXJ0ZWQgKi9cbiAgdGhpcy5oYXNoX3NpemUgPSAwOyAgIC8qIG51bWJlciBvZiBlbGVtZW50cyBpbiBoYXNoIHRhYmxlICovXG4gIHRoaXMuaGFzaF9iaXRzID0gMDsgICAvKiBsb2cyKGhhc2hfc2l6ZSkgKi9cbiAgdGhpcy5oYXNoX21hc2sgPSAwOyAgIC8qIGhhc2hfc2l6ZS0xICovXG5cbiAgdGhpcy5oYXNoX3NoaWZ0ID0gMDtcbiAgLyogTnVtYmVyIG9mIGJpdHMgYnkgd2hpY2ggaW5zX2ggbXVzdCBiZSBzaGlmdGVkIGF0IGVhY2ggaW5wdXRcbiAgICogc3RlcC4gSXQgbXVzdCBiZSBzdWNoIHRoYXQgYWZ0ZXIgTUlOX01BVENIIHN0ZXBzLCB0aGUgb2xkZXN0XG4gICAqIGJ5dGUgbm8gbG9uZ2VyIHRha2VzIHBhcnQgaW4gdGhlIGhhc2gga2V5LCB0aGF0IGlzOlxuICAgKiAgIGhhc2hfc2hpZnQgKiBNSU5fTUFUQ0ggPj0gaGFzaF9iaXRzXG4gICAqL1xuXG4gIHRoaXMuYmxvY2tfc3RhcnQgPSAwO1xuICAvKiBXaW5kb3cgcG9zaXRpb24gYXQgdGhlIGJlZ2lubmluZyBvZiB0aGUgY3VycmVudCBvdXRwdXQgYmxvY2suIEdldHNcbiAgICogbmVnYXRpdmUgd2hlbiB0aGUgd2luZG93IGlzIG1vdmVkIGJhY2t3YXJkcy5cbiAgICovXG5cbiAgdGhpcy5tYXRjaF9sZW5ndGggPSAwOyAgICAgIC8qIGxlbmd0aCBvZiBiZXN0IG1hdGNoICovXG4gIHRoaXMucHJldl9tYXRjaCA9IDA7ICAgICAgICAvKiBwcmV2aW91cyBtYXRjaCAqL1xuICB0aGlzLm1hdGNoX2F2YWlsYWJsZSA9IDA7ICAgLyogc2V0IGlmIHByZXZpb3VzIG1hdGNoIGV4aXN0cyAqL1xuICB0aGlzLnN0cnN0YXJ0ID0gMDsgICAgICAgICAgLyogc3RhcnQgb2Ygc3RyaW5nIHRvIGluc2VydCAqL1xuICB0aGlzLm1hdGNoX3N0YXJ0ID0gMDsgICAgICAgLyogc3RhcnQgb2YgbWF0Y2hpbmcgc3RyaW5nICovXG4gIHRoaXMubG9va2FoZWFkID0gMDsgICAgICAgICAvKiBudW1iZXIgb2YgdmFsaWQgYnl0ZXMgYWhlYWQgaW4gd2luZG93ICovXG5cbiAgdGhpcy5wcmV2X2xlbmd0aCA9IDA7XG4gIC8qIExlbmd0aCBvZiB0aGUgYmVzdCBtYXRjaCBhdCBwcmV2aW91cyBzdGVwLiBNYXRjaGVzIG5vdCBncmVhdGVyIHRoYW4gdGhpc1xuICAgKiBhcmUgZGlzY2FyZGVkLiBUaGlzIGlzIHVzZWQgaW4gdGhlIGxhenkgbWF0Y2ggZXZhbHVhdGlvbi5cbiAgICovXG5cbiAgdGhpcy5tYXhfY2hhaW5fbGVuZ3RoID0gMDtcbiAgLyogVG8gc3BlZWQgdXAgZGVmbGF0aW9uLCBoYXNoIGNoYWlucyBhcmUgbmV2ZXIgc2VhcmNoZWQgYmV5b25kIHRoaXNcbiAgICogbGVuZ3RoLiAgQSBoaWdoZXIgbGltaXQgaW1wcm92ZXMgY29tcHJlc3Npb24gcmF0aW8gYnV0IGRlZ3JhZGVzIHRoZVxuICAgKiBzcGVlZC5cbiAgICovXG5cbiAgdGhpcy5tYXhfbGF6eV9tYXRjaCA9IDA7XG4gIC8qIEF0dGVtcHQgdG8gZmluZCBhIGJldHRlciBtYXRjaCBvbmx5IHdoZW4gdGhlIGN1cnJlbnQgbWF0Y2ggaXMgc3RyaWN0bHlcbiAgICogc21hbGxlciB0aGFuIHRoaXMgdmFsdWUuIFRoaXMgbWVjaGFuaXNtIGlzIHVzZWQgb25seSBmb3IgY29tcHJlc3Npb25cbiAgICogbGV2ZWxzID49IDQuXG4gICAqL1xuICAvLyBUaGF0J3MgYWxpYXMgdG8gbWF4X2xhenlfbWF0Y2gsIGRvbid0IHVzZSBkaXJlY3RseVxuICAvL3RoaXMubWF4X2luc2VydF9sZW5ndGggPSAwO1xuICAvKiBJbnNlcnQgbmV3IHN0cmluZ3MgaW4gdGhlIGhhc2ggdGFibGUgb25seSBpZiB0aGUgbWF0Y2ggbGVuZ3RoIGlzIG5vdFxuICAgKiBncmVhdGVyIHRoYW4gdGhpcyBsZW5ndGguIFRoaXMgc2F2ZXMgdGltZSBidXQgZGVncmFkZXMgY29tcHJlc3Npb24uXG4gICAqIG1heF9pbnNlcnRfbGVuZ3RoIGlzIHVzZWQgb25seSBmb3IgY29tcHJlc3Npb24gbGV2ZWxzIDw9IDMuXG4gICAqL1xuXG4gIHRoaXMubGV2ZWwgPSAwOyAgICAgLyogY29tcHJlc3Npb24gbGV2ZWwgKDEuLjkpICovXG4gIHRoaXMuc3RyYXRlZ3kgPSAwOyAgLyogZmF2b3Igb3IgZm9yY2UgSHVmZm1hbiBjb2RpbmcqL1xuXG4gIHRoaXMuZ29vZF9tYXRjaCA9IDA7XG4gIC8qIFVzZSBhIGZhc3RlciBzZWFyY2ggd2hlbiB0aGUgcHJldmlvdXMgbWF0Y2ggaXMgbG9uZ2VyIHRoYW4gdGhpcyAqL1xuXG4gIHRoaXMubmljZV9tYXRjaCA9IDA7IC8qIFN0b3Agc2VhcmNoaW5nIHdoZW4gY3VycmVudCBtYXRjaCBleGNlZWRzIHRoaXMgKi9cblxuICAgICAgICAgICAgICAvKiB1c2VkIGJ5IHRyZWVzLmM6ICovXG5cbiAgLyogRGlkbid0IHVzZSBjdF9kYXRhIHR5cGVkZWYgYmVsb3cgdG8gc3VwcHJlc3MgY29tcGlsZXIgd2FybmluZyAqL1xuXG4gIC8vIHN0cnVjdCBjdF9kYXRhX3MgZHluX2x0cmVlW0hFQVBfU0laRV07ICAgLyogbGl0ZXJhbCBhbmQgbGVuZ3RoIHRyZWUgKi9cbiAgLy8gc3RydWN0IGN0X2RhdGFfcyBkeW5fZHRyZWVbMipEX0NPREVTKzFdOyAvKiBkaXN0YW5jZSB0cmVlICovXG4gIC8vIHN0cnVjdCBjdF9kYXRhX3MgYmxfdHJlZVsyKkJMX0NPREVTKzFdOyAgLyogSHVmZm1hbiB0cmVlIGZvciBiaXQgbGVuZ3RocyAqL1xuXG4gIC8vIFVzZSBmbGF0IGFycmF5IG9mIERPVUJMRSBzaXplLCB3aXRoIGludGVybGVhdmVkIGZhdGEsXG4gIC8vIGJlY2F1c2UgSlMgZG9lcyBub3Qgc3VwcG9ydCBlZmZlY3RpdmVcbiAgdGhpcy5keW5fbHRyZWUgID0gbmV3IHV0aWxzLkJ1ZjE2KEhFQVBfU0laRSAqIDIpO1xuICB0aGlzLmR5bl9kdHJlZSAgPSBuZXcgdXRpbHMuQnVmMTYoKDIgKiBEX0NPREVTICsgMSkgKiAyKTtcbiAgdGhpcy5ibF90cmVlICAgID0gbmV3IHV0aWxzLkJ1ZjE2KCgyICogQkxfQ09ERVMgKyAxKSAqIDIpO1xuICB6ZXJvKHRoaXMuZHluX2x0cmVlKTtcbiAgemVybyh0aGlzLmR5bl9kdHJlZSk7XG4gIHplcm8odGhpcy5ibF90cmVlKTtcblxuICB0aGlzLmxfZGVzYyAgID0gbnVsbDsgICAgICAgICAvKiBkZXNjLiBmb3IgbGl0ZXJhbCB0cmVlICovXG4gIHRoaXMuZF9kZXNjICAgPSBudWxsOyAgICAgICAgIC8qIGRlc2MuIGZvciBkaXN0YW5jZSB0cmVlICovXG4gIHRoaXMuYmxfZGVzYyAgPSBudWxsOyAgICAgICAgIC8qIGRlc2MuIGZvciBiaXQgbGVuZ3RoIHRyZWUgKi9cblxuICAvL3VzaCBibF9jb3VudFtNQVhfQklUUysxXTtcbiAgdGhpcy5ibF9jb3VudCA9IG5ldyB1dGlscy5CdWYxNihNQVhfQklUUyArIDEpO1xuICAvKiBudW1iZXIgb2YgY29kZXMgYXQgZWFjaCBiaXQgbGVuZ3RoIGZvciBhbiBvcHRpbWFsIHRyZWUgKi9cblxuICAvL2ludCBoZWFwWzIqTF9DT0RFUysxXTsgICAgICAvKiBoZWFwIHVzZWQgdG8gYnVpbGQgdGhlIEh1ZmZtYW4gdHJlZXMgKi9cbiAgdGhpcy5oZWFwID0gbmV3IHV0aWxzLkJ1ZjE2KDIgKiBMX0NPREVTICsgMSk7ICAvKiBoZWFwIHVzZWQgdG8gYnVpbGQgdGhlIEh1ZmZtYW4gdHJlZXMgKi9cbiAgemVybyh0aGlzLmhlYXApO1xuXG4gIHRoaXMuaGVhcF9sZW4gPSAwOyAgICAgICAgICAgICAgIC8qIG51bWJlciBvZiBlbGVtZW50cyBpbiB0aGUgaGVhcCAqL1xuICB0aGlzLmhlYXBfbWF4ID0gMDsgICAgICAgICAgICAgICAvKiBlbGVtZW50IG9mIGxhcmdlc3QgZnJlcXVlbmN5ICovXG4gIC8qIFRoZSBzb25zIG9mIGhlYXBbbl0gYXJlIGhlYXBbMipuXSBhbmQgaGVhcFsyKm4rMV0uIGhlYXBbMF0gaXMgbm90IHVzZWQuXG4gICAqIFRoZSBzYW1lIGhlYXAgYXJyYXkgaXMgdXNlZCB0byBidWlsZCBhbGwgdHJlZXMuXG4gICAqL1xuXG4gIHRoaXMuZGVwdGggPSBuZXcgdXRpbHMuQnVmMTYoMiAqIExfQ09ERVMgKyAxKTsgLy91Y2ggZGVwdGhbMipMX0NPREVTKzFdO1xuICB6ZXJvKHRoaXMuZGVwdGgpO1xuICAvKiBEZXB0aCBvZiBlYWNoIHN1YnRyZWUgdXNlZCBhcyB0aWUgYnJlYWtlciBmb3IgdHJlZXMgb2YgZXF1YWwgZnJlcXVlbmN5XG4gICAqL1xuXG4gIHRoaXMubF9idWYgPSAwOyAgICAgICAgICAvKiBidWZmZXIgaW5kZXggZm9yIGxpdGVyYWxzIG9yIGxlbmd0aHMgKi9cblxuICB0aGlzLmxpdF9idWZzaXplID0gMDtcbiAgLyogU2l6ZSBvZiBtYXRjaCBidWZmZXIgZm9yIGxpdGVyYWxzL2xlbmd0aHMuICBUaGVyZSBhcmUgNCByZWFzb25zIGZvclxuICAgKiBsaW1pdGluZyBsaXRfYnVmc2l6ZSB0byA2NEs6XG4gICAqICAgLSBmcmVxdWVuY2llcyBjYW4gYmUga2VwdCBpbiAxNiBiaXQgY291bnRlcnNcbiAgICogICAtIGlmIGNvbXByZXNzaW9uIGlzIG5vdCBzdWNjZXNzZnVsIGZvciB0aGUgZmlyc3QgYmxvY2ssIGFsbCBpbnB1dFxuICAgKiAgICAgZGF0YSBpcyBzdGlsbCBpbiB0aGUgd2luZG93IHNvIHdlIGNhbiBzdGlsbCBlbWl0IGEgc3RvcmVkIGJsb2NrIGV2ZW5cbiAgICogICAgIHdoZW4gaW5wdXQgY29tZXMgZnJvbSBzdGFuZGFyZCBpbnB1dC4gIChUaGlzIGNhbiBhbHNvIGJlIGRvbmUgZm9yXG4gICAqICAgICBhbGwgYmxvY2tzIGlmIGxpdF9idWZzaXplIGlzIG5vdCBncmVhdGVyIHRoYW4gMzJLLilcbiAgICogICAtIGlmIGNvbXByZXNzaW9uIGlzIG5vdCBzdWNjZXNzZnVsIGZvciBhIGZpbGUgc21hbGxlciB0aGFuIDY0Sywgd2UgY2FuXG4gICAqICAgICBldmVuIGVtaXQgYSBzdG9yZWQgZmlsZSBpbnN0ZWFkIG9mIGEgc3RvcmVkIGJsb2NrIChzYXZpbmcgNSBieXRlcykuXG4gICAqICAgICBUaGlzIGlzIGFwcGxpY2FibGUgb25seSBmb3IgemlwIChub3QgZ3ppcCBvciB6bGliKS5cbiAgICogICAtIGNyZWF0aW5nIG5ldyBIdWZmbWFuIHRyZWVzIGxlc3MgZnJlcXVlbnRseSBtYXkgbm90IHByb3ZpZGUgZmFzdFxuICAgKiAgICAgYWRhcHRhdGlvbiB0byBjaGFuZ2VzIGluIHRoZSBpbnB1dCBkYXRhIHN0YXRpc3RpY3MuIChUYWtlIGZvclxuICAgKiAgICAgZXhhbXBsZSBhIGJpbmFyeSBmaWxlIHdpdGggcG9vcmx5IGNvbXByZXNzaWJsZSBjb2RlIGZvbGxvd2VkIGJ5XG4gICAqICAgICBhIGhpZ2hseSBjb21wcmVzc2libGUgc3RyaW5nIHRhYmxlLikgU21hbGxlciBidWZmZXIgc2l6ZXMgZ2l2ZVxuICAgKiAgICAgZmFzdCBhZGFwdGF0aW9uIGJ1dCBoYXZlIG9mIGNvdXJzZSB0aGUgb3ZlcmhlYWQgb2YgdHJhbnNtaXR0aW5nXG4gICAqICAgICB0cmVlcyBtb3JlIGZyZXF1ZW50bHkuXG4gICAqICAgLSBJIGNhbid0IGNvdW50IGFib3ZlIDRcbiAgICovXG5cbiAgdGhpcy5sYXN0X2xpdCA9IDA7ICAgICAgLyogcnVubmluZyBpbmRleCBpbiBsX2J1ZiAqL1xuXG4gIHRoaXMuZF9idWYgPSAwO1xuICAvKiBCdWZmZXIgaW5kZXggZm9yIGRpc3RhbmNlcy4gVG8gc2ltcGxpZnkgdGhlIGNvZGUsIGRfYnVmIGFuZCBsX2J1ZiBoYXZlXG4gICAqIHRoZSBzYW1lIG51bWJlciBvZiBlbGVtZW50cy4gVG8gdXNlIGRpZmZlcmVudCBsZW5ndGhzLCBhbiBleHRyYSBmbGFnXG4gICAqIGFycmF5IHdvdWxkIGJlIG5lY2Vzc2FyeS5cbiAgICovXG5cbiAgdGhpcy5vcHRfbGVuID0gMDsgICAgICAgLyogYml0IGxlbmd0aCBvZiBjdXJyZW50IGJsb2NrIHdpdGggb3B0aW1hbCB0cmVlcyAqL1xuICB0aGlzLnN0YXRpY19sZW4gPSAwOyAgICAvKiBiaXQgbGVuZ3RoIG9mIGN1cnJlbnQgYmxvY2sgd2l0aCBzdGF0aWMgdHJlZXMgKi9cbiAgdGhpcy5tYXRjaGVzID0gMDsgICAgICAgLyogbnVtYmVyIG9mIHN0cmluZyBtYXRjaGVzIGluIGN1cnJlbnQgYmxvY2sgKi9cbiAgdGhpcy5pbnNlcnQgPSAwOyAgICAgICAgLyogYnl0ZXMgYXQgZW5kIG9mIHdpbmRvdyBsZWZ0IHRvIGluc2VydCAqL1xuXG5cbiAgdGhpcy5iaV9idWYgPSAwO1xuICAvKiBPdXRwdXQgYnVmZmVyLiBiaXRzIGFyZSBpbnNlcnRlZCBzdGFydGluZyBhdCB0aGUgYm90dG9tIChsZWFzdFxuICAgKiBzaWduaWZpY2FudCBiaXRzKS5cbiAgICovXG4gIHRoaXMuYmlfdmFsaWQgPSAwO1xuICAvKiBOdW1iZXIgb2YgdmFsaWQgYml0cyBpbiBiaV9idWYuICBBbGwgYml0cyBhYm92ZSB0aGUgbGFzdCB2YWxpZCBiaXRcbiAgICogYXJlIGFsd2F5cyB6ZXJvLlxuICAgKi9cblxuICAvLyBVc2VkIGZvciB3aW5kb3cgbWVtb3J5IGluaXQuIFdlIHNhZmVseSBpZ25vcmUgaXQgZm9yIEpTLiBUaGF0IG1ha2VzXG4gIC8vIHNlbnNlIG9ubHkgZm9yIHBvaW50ZXJzIGFuZCBtZW1vcnkgY2hlY2sgdG9vbHMuXG4gIC8vdGhpcy5oaWdoX3dhdGVyID0gMDtcbiAgLyogSGlnaCB3YXRlciBtYXJrIG9mZnNldCBpbiB3aW5kb3cgZm9yIGluaXRpYWxpemVkIGJ5dGVzIC0tIGJ5dGVzIGFib3ZlXG4gICAqIHRoaXMgYXJlIHNldCB0byB6ZXJvIGluIG9yZGVyIHRvIGF2b2lkIG1lbW9yeSBjaGVjayB3YXJuaW5ncyB3aGVuXG4gICAqIGxvbmdlc3QgbWF0Y2ggcm91dGluZXMgYWNjZXNzIGJ5dGVzIHBhc3QgdGhlIGlucHV0LiAgVGhpcyBpcyB0aGVuXG4gICAqIHVwZGF0ZWQgdG8gdGhlIG5ldyBoaWdoIHdhdGVyIG1hcmsuXG4gICAqL1xufVxuXG5cbmZ1bmN0aW9uIGRlZmxhdGVSZXNldEtlZXAoc3RybSkge1xuICB2YXIgcztcblxuICBpZiAoIXN0cm0gfHwgIXN0cm0uc3RhdGUpIHtcbiAgICByZXR1cm4gZXJyKHN0cm0sIFpfU1RSRUFNX0VSUk9SKTtcbiAgfVxuXG4gIHN0cm0udG90YWxfaW4gPSBzdHJtLnRvdGFsX291dCA9IDA7XG4gIHN0cm0uZGF0YV90eXBlID0gWl9VTktOT1dOO1xuXG4gIHMgPSBzdHJtLnN0YXRlO1xuICBzLnBlbmRpbmcgPSAwO1xuICBzLnBlbmRpbmdfb3V0ID0gMDtcblxuICBpZiAocy53cmFwIDwgMCkge1xuICAgIHMud3JhcCA9IC1zLndyYXA7XG4gICAgLyogd2FzIG1hZGUgbmVnYXRpdmUgYnkgZGVmbGF0ZSguLi4sIFpfRklOSVNIKTsgKi9cbiAgfVxuICBzLnN0YXR1cyA9IChzLndyYXAgPyBJTklUX1NUQVRFIDogQlVTWV9TVEFURSk7XG4gIHN0cm0uYWRsZXIgPSAocy53cmFwID09PSAyKSA/XG4gICAgMCAgLy8gY3JjMzIoMCwgWl9OVUxMLCAwKVxuICA6XG4gICAgMTsgLy8gYWRsZXIzMigwLCBaX05VTEwsIDApXG4gIHMubGFzdF9mbHVzaCA9IFpfTk9fRkxVU0g7XG4gIHRyZWVzLl90cl9pbml0KHMpO1xuICByZXR1cm4gWl9PSztcbn1cblxuXG5mdW5jdGlvbiBkZWZsYXRlUmVzZXQoc3RybSkge1xuICB2YXIgcmV0ID0gZGVmbGF0ZVJlc2V0S2VlcChzdHJtKTtcbiAgaWYgKHJldCA9PT0gWl9PSykge1xuICAgIGxtX2luaXQoc3RybS5zdGF0ZSk7XG4gIH1cbiAgcmV0dXJuIHJldDtcbn1cblxuXG5mdW5jdGlvbiBkZWZsYXRlU2V0SGVhZGVyKHN0cm0sIGhlYWQpIHtcbiAgaWYgKCFzdHJtIHx8ICFzdHJtLnN0YXRlKSB7IHJldHVybiBaX1NUUkVBTV9FUlJPUjsgfVxuICBpZiAoc3RybS5zdGF0ZS53cmFwICE9PSAyKSB7IHJldHVybiBaX1NUUkVBTV9FUlJPUjsgfVxuICBzdHJtLnN0YXRlLmd6aGVhZCA9IGhlYWQ7XG4gIHJldHVybiBaX09LO1xufVxuXG5cbmZ1bmN0aW9uIGRlZmxhdGVJbml0MihzdHJtLCBsZXZlbCwgbWV0aG9kLCB3aW5kb3dCaXRzLCBtZW1MZXZlbCwgc3RyYXRlZ3kpIHtcbiAgaWYgKCFzdHJtKSB7IC8vID09PSBaX05VTExcbiAgICByZXR1cm4gWl9TVFJFQU1fRVJST1I7XG4gIH1cbiAgdmFyIHdyYXAgPSAxO1xuXG4gIGlmIChsZXZlbCA9PT0gWl9ERUZBVUxUX0NPTVBSRVNTSU9OKSB7XG4gICAgbGV2ZWwgPSA2O1xuICB9XG5cbiAgaWYgKHdpbmRvd0JpdHMgPCAwKSB7IC8qIHN1cHByZXNzIHpsaWIgd3JhcHBlciAqL1xuICAgIHdyYXAgPSAwO1xuICAgIHdpbmRvd0JpdHMgPSAtd2luZG93Qml0cztcbiAgfVxuXG4gIGVsc2UgaWYgKHdpbmRvd0JpdHMgPiAxNSkge1xuICAgIHdyYXAgPSAyOyAgICAgICAgICAgLyogd3JpdGUgZ3ppcCB3cmFwcGVyIGluc3RlYWQgKi9cbiAgICB3aW5kb3dCaXRzIC09IDE2O1xuICB9XG5cblxuICBpZiAobWVtTGV2ZWwgPCAxIHx8IG1lbUxldmVsID4gTUFYX01FTV9MRVZFTCB8fCBtZXRob2QgIT09IFpfREVGTEFURUQgfHxcbiAgICB3aW5kb3dCaXRzIDwgOCB8fCB3aW5kb3dCaXRzID4gMTUgfHwgbGV2ZWwgPCAwIHx8IGxldmVsID4gOSB8fFxuICAgIHN0cmF0ZWd5IDwgMCB8fCBzdHJhdGVneSA+IFpfRklYRUQpIHtcbiAgICByZXR1cm4gZXJyKHN0cm0sIFpfU1RSRUFNX0VSUk9SKTtcbiAgfVxuXG5cbiAgaWYgKHdpbmRvd0JpdHMgPT09IDgpIHtcbiAgICB3aW5kb3dCaXRzID0gOTtcbiAgfVxuICAvKiB1bnRpbCAyNTYtYnl0ZSB3aW5kb3cgYnVnIGZpeGVkICovXG5cbiAgdmFyIHMgPSBuZXcgRGVmbGF0ZVN0YXRlKCk7XG5cbiAgc3RybS5zdGF0ZSA9IHM7XG4gIHMuc3RybSA9IHN0cm07XG5cbiAgcy53cmFwID0gd3JhcDtcbiAgcy5nemhlYWQgPSBudWxsO1xuICBzLndfYml0cyA9IHdpbmRvd0JpdHM7XG4gIHMud19zaXplID0gMSA8PCBzLndfYml0cztcbiAgcy53X21hc2sgPSBzLndfc2l6ZSAtIDE7XG5cbiAgcy5oYXNoX2JpdHMgPSBtZW1MZXZlbCArIDc7XG4gIHMuaGFzaF9zaXplID0gMSA8PCBzLmhhc2hfYml0cztcbiAgcy5oYXNoX21hc2sgPSBzLmhhc2hfc2l6ZSAtIDE7XG4gIHMuaGFzaF9zaGlmdCA9IH5+KChzLmhhc2hfYml0cyArIE1JTl9NQVRDSCAtIDEpIC8gTUlOX01BVENIKTtcblxuICBzLndpbmRvdyA9IG5ldyB1dGlscy5CdWY4KHMud19zaXplICogMik7XG4gIHMuaGVhZCA9IG5ldyB1dGlscy5CdWYxNihzLmhhc2hfc2l6ZSk7XG4gIHMucHJldiA9IG5ldyB1dGlscy5CdWYxNihzLndfc2l6ZSk7XG5cbiAgLy8gRG9uJ3QgbmVlZCBtZW0gaW5pdCBtYWdpYyBmb3IgSlMuXG4gIC8vcy5oaWdoX3dhdGVyID0gMDsgIC8qIG5vdGhpbmcgd3JpdHRlbiB0byBzLT53aW5kb3cgeWV0ICovXG5cbiAgcy5saXRfYnVmc2l6ZSA9IDEgPDwgKG1lbUxldmVsICsgNik7IC8qIDE2SyBlbGVtZW50cyBieSBkZWZhdWx0ICovXG5cbiAgcy5wZW5kaW5nX2J1Zl9zaXplID0gcy5saXRfYnVmc2l6ZSAqIDQ7XG5cbiAgLy9vdmVybGF5ID0gKHVzaGYgKikgWkFMTE9DKHN0cm0sIHMtPmxpdF9idWZzaXplLCBzaXplb2YodXNoKSsyKTtcbiAgLy9zLT5wZW5kaW5nX2J1ZiA9ICh1Y2hmICopIG92ZXJsYXk7XG4gIHMucGVuZGluZ19idWYgPSBuZXcgdXRpbHMuQnVmOChzLnBlbmRpbmdfYnVmX3NpemUpO1xuXG4gIC8vIEl0IGlzIG9mZnNldCBmcm9tIGBzLnBlbmRpbmdfYnVmYCAoc2l6ZSBpcyBgcy5saXRfYnVmc2l6ZSAqIDJgKVxuICAvL3MtPmRfYnVmID0gb3ZlcmxheSArIHMtPmxpdF9idWZzaXplL3NpemVvZih1c2gpO1xuICBzLmRfYnVmID0gMSAqIHMubGl0X2J1ZnNpemU7XG5cbiAgLy9zLT5sX2J1ZiA9IHMtPnBlbmRpbmdfYnVmICsgKDErc2l6ZW9mKHVzaCkpKnMtPmxpdF9idWZzaXplO1xuICBzLmxfYnVmID0gKDEgKyAyKSAqIHMubGl0X2J1ZnNpemU7XG5cbiAgcy5sZXZlbCA9IGxldmVsO1xuICBzLnN0cmF0ZWd5ID0gc3RyYXRlZ3k7XG4gIHMubWV0aG9kID0gbWV0aG9kO1xuXG4gIHJldHVybiBkZWZsYXRlUmVzZXQoc3RybSk7XG59XG5cbmZ1bmN0aW9uIGRlZmxhdGVJbml0KHN0cm0sIGxldmVsKSB7XG4gIHJldHVybiBkZWZsYXRlSW5pdDIoc3RybSwgbGV2ZWwsIFpfREVGTEFURUQsIE1BWF9XQklUUywgREVGX01FTV9MRVZFTCwgWl9ERUZBVUxUX1NUUkFURUdZKTtcbn1cblxuXG5mdW5jdGlvbiBkZWZsYXRlKHN0cm0sIGZsdXNoKSB7XG4gIHZhciBvbGRfZmx1c2gsIHM7XG4gIHZhciBiZWcsIHZhbDsgLy8gZm9yIGd6aXAgaGVhZGVyIHdyaXRlIG9ubHlcblxuICBpZiAoIXN0cm0gfHwgIXN0cm0uc3RhdGUgfHxcbiAgICBmbHVzaCA+IFpfQkxPQ0sgfHwgZmx1c2ggPCAwKSB7XG4gICAgcmV0dXJuIHN0cm0gPyBlcnIoc3RybSwgWl9TVFJFQU1fRVJST1IpIDogWl9TVFJFQU1fRVJST1I7XG4gIH1cblxuICBzID0gc3RybS5zdGF0ZTtcblxuICBpZiAoIXN0cm0ub3V0cHV0IHx8XG4gICAgICAoIXN0cm0uaW5wdXQgJiYgc3RybS5hdmFpbF9pbiAhPT0gMCkgfHxcbiAgICAgIChzLnN0YXR1cyA9PT0gRklOSVNIX1NUQVRFICYmIGZsdXNoICE9PSBaX0ZJTklTSCkpIHtcbiAgICByZXR1cm4gZXJyKHN0cm0sIChzdHJtLmF2YWlsX291dCA9PT0gMCkgPyBaX0JVRl9FUlJPUiA6IFpfU1RSRUFNX0VSUk9SKTtcbiAgfVxuXG4gIHMuc3RybSA9IHN0cm07IC8qIGp1c3QgaW4gY2FzZSAqL1xuICBvbGRfZmx1c2ggPSBzLmxhc3RfZmx1c2g7XG4gIHMubGFzdF9mbHVzaCA9IGZsdXNoO1xuXG4gIC8qIFdyaXRlIHRoZSBoZWFkZXIgKi9cbiAgaWYgKHMuc3RhdHVzID09PSBJTklUX1NUQVRFKSB7XG5cbiAgICBpZiAocy53cmFwID09PSAyKSB7IC8vIEdaSVAgaGVhZGVyXG4gICAgICBzdHJtLmFkbGVyID0gMDsgIC8vY3JjMzIoMEwsIFpfTlVMTCwgMCk7XG4gICAgICBwdXRfYnl0ZShzLCAzMSk7XG4gICAgICBwdXRfYnl0ZShzLCAxMzkpO1xuICAgICAgcHV0X2J5dGUocywgOCk7XG4gICAgICBpZiAoIXMuZ3poZWFkKSB7IC8vIHMtPmd6aGVhZCA9PSBaX05VTExcbiAgICAgICAgcHV0X2J5dGUocywgMCk7XG4gICAgICAgIHB1dF9ieXRlKHMsIDApO1xuICAgICAgICBwdXRfYnl0ZShzLCAwKTtcbiAgICAgICAgcHV0X2J5dGUocywgMCk7XG4gICAgICAgIHB1dF9ieXRlKHMsIDApO1xuICAgICAgICBwdXRfYnl0ZShzLCBzLmxldmVsID09PSA5ID8gMiA6XG4gICAgICAgICAgICAgICAgICAgIChzLnN0cmF0ZWd5ID49IFpfSFVGRk1BTl9PTkxZIHx8IHMubGV2ZWwgPCAyID9cbiAgICAgICAgICAgICAgICAgICAgIDQgOiAwKSk7XG4gICAgICAgIHB1dF9ieXRlKHMsIE9TX0NPREUpO1xuICAgICAgICBzLnN0YXR1cyA9IEJVU1lfU1RBVEU7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgcHV0X2J5dGUocywgKHMuZ3poZWFkLnRleHQgPyAxIDogMCkgK1xuICAgICAgICAgICAgICAgICAgICAocy5nemhlYWQuaGNyYyA/IDIgOiAwKSArXG4gICAgICAgICAgICAgICAgICAgICghcy5nemhlYWQuZXh0cmEgPyAwIDogNCkgK1xuICAgICAgICAgICAgICAgICAgICAoIXMuZ3poZWFkLm5hbWUgPyAwIDogOCkgK1xuICAgICAgICAgICAgICAgICAgICAoIXMuZ3poZWFkLmNvbW1lbnQgPyAwIDogMTYpXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgcHV0X2J5dGUocywgcy5nemhlYWQudGltZSAmIDB4ZmYpO1xuICAgICAgICBwdXRfYnl0ZShzLCAocy5nemhlYWQudGltZSA+PiA4KSAmIDB4ZmYpO1xuICAgICAgICBwdXRfYnl0ZShzLCAocy5nemhlYWQudGltZSA+PiAxNikgJiAweGZmKTtcbiAgICAgICAgcHV0X2J5dGUocywgKHMuZ3poZWFkLnRpbWUgPj4gMjQpICYgMHhmZik7XG4gICAgICAgIHB1dF9ieXRlKHMsIHMubGV2ZWwgPT09IDkgPyAyIDpcbiAgICAgICAgICAgICAgICAgICAgKHMuc3RyYXRlZ3kgPj0gWl9IVUZGTUFOX09OTFkgfHwgcy5sZXZlbCA8IDIgP1xuICAgICAgICAgICAgICAgICAgICAgNCA6IDApKTtcbiAgICAgICAgcHV0X2J5dGUocywgcy5nemhlYWQub3MgJiAweGZmKTtcbiAgICAgICAgaWYgKHMuZ3poZWFkLmV4dHJhICYmIHMuZ3poZWFkLmV4dHJhLmxlbmd0aCkge1xuICAgICAgICAgIHB1dF9ieXRlKHMsIHMuZ3poZWFkLmV4dHJhLmxlbmd0aCAmIDB4ZmYpO1xuICAgICAgICAgIHB1dF9ieXRlKHMsIChzLmd6aGVhZC5leHRyYS5sZW5ndGggPj4gOCkgJiAweGZmKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocy5nemhlYWQuaGNyYykge1xuICAgICAgICAgIHN0cm0uYWRsZXIgPSBjcmMzMihzdHJtLmFkbGVyLCBzLnBlbmRpbmdfYnVmLCBzLnBlbmRpbmcsIDApO1xuICAgICAgICB9XG4gICAgICAgIHMuZ3ppbmRleCA9IDA7XG4gICAgICAgIHMuc3RhdHVzID0gRVhUUkFfU1RBVEU7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2UgLy8gREVGTEFURSBoZWFkZXJcbiAgICB7XG4gICAgICB2YXIgaGVhZGVyID0gKFpfREVGTEFURUQgKyAoKHMud19iaXRzIC0gOCkgPDwgNCkpIDw8IDg7XG4gICAgICB2YXIgbGV2ZWxfZmxhZ3MgPSAtMTtcblxuICAgICAgaWYgKHMuc3RyYXRlZ3kgPj0gWl9IVUZGTUFOX09OTFkgfHwgcy5sZXZlbCA8IDIpIHtcbiAgICAgICAgbGV2ZWxfZmxhZ3MgPSAwO1xuICAgICAgfSBlbHNlIGlmIChzLmxldmVsIDwgNikge1xuICAgICAgICBsZXZlbF9mbGFncyA9IDE7XG4gICAgICB9IGVsc2UgaWYgKHMubGV2ZWwgPT09IDYpIHtcbiAgICAgICAgbGV2ZWxfZmxhZ3MgPSAyO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGV2ZWxfZmxhZ3MgPSAzO1xuICAgICAgfVxuICAgICAgaGVhZGVyIHw9IChsZXZlbF9mbGFncyA8PCA2KTtcbiAgICAgIGlmIChzLnN0cnN0YXJ0ICE9PSAwKSB7IGhlYWRlciB8PSBQUkVTRVRfRElDVDsgfVxuICAgICAgaGVhZGVyICs9IDMxIC0gKGhlYWRlciAlIDMxKTtcblxuICAgICAgcy5zdGF0dXMgPSBCVVNZX1NUQVRFO1xuICAgICAgcHV0U2hvcnRNU0IocywgaGVhZGVyKTtcblxuICAgICAgLyogU2F2ZSB0aGUgYWRsZXIzMiBvZiB0aGUgcHJlc2V0IGRpY3Rpb25hcnk6ICovXG4gICAgICBpZiAocy5zdHJzdGFydCAhPT0gMCkge1xuICAgICAgICBwdXRTaG9ydE1TQihzLCBzdHJtLmFkbGVyID4+PiAxNik7XG4gICAgICAgIHB1dFNob3J0TVNCKHMsIHN0cm0uYWRsZXIgJiAweGZmZmYpO1xuICAgICAgfVxuICAgICAgc3RybS5hZGxlciA9IDE7IC8vIGFkbGVyMzIoMEwsIFpfTlVMTCwgMCk7XG4gICAgfVxuICB9XG5cbi8vI2lmZGVmIEdaSVBcbiAgaWYgKHMuc3RhdHVzID09PSBFWFRSQV9TVEFURSkge1xuICAgIGlmIChzLmd6aGVhZC5leHRyYS8qICE9IFpfTlVMTCovKSB7XG4gICAgICBiZWcgPSBzLnBlbmRpbmc7ICAvKiBzdGFydCBvZiBieXRlcyB0byB1cGRhdGUgY3JjICovXG5cbiAgICAgIHdoaWxlIChzLmd6aW5kZXggPCAocy5nemhlYWQuZXh0cmEubGVuZ3RoICYgMHhmZmZmKSkge1xuICAgICAgICBpZiAocy5wZW5kaW5nID09PSBzLnBlbmRpbmdfYnVmX3NpemUpIHtcbiAgICAgICAgICBpZiAocy5nemhlYWQuaGNyYyAmJiBzLnBlbmRpbmcgPiBiZWcpIHtcbiAgICAgICAgICAgIHN0cm0uYWRsZXIgPSBjcmMzMihzdHJtLmFkbGVyLCBzLnBlbmRpbmdfYnVmLCBzLnBlbmRpbmcgLSBiZWcsIGJlZyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGZsdXNoX3BlbmRpbmcoc3RybSk7XG4gICAgICAgICAgYmVnID0gcy5wZW5kaW5nO1xuICAgICAgICAgIGlmIChzLnBlbmRpbmcgPT09IHMucGVuZGluZ19idWZfc2l6ZSkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHB1dF9ieXRlKHMsIHMuZ3poZWFkLmV4dHJhW3MuZ3ppbmRleF0gJiAweGZmKTtcbiAgICAgICAgcy5nemluZGV4Kys7XG4gICAgICB9XG4gICAgICBpZiAocy5nemhlYWQuaGNyYyAmJiBzLnBlbmRpbmcgPiBiZWcpIHtcbiAgICAgICAgc3RybS5hZGxlciA9IGNyYzMyKHN0cm0uYWRsZXIsIHMucGVuZGluZ19idWYsIHMucGVuZGluZyAtIGJlZywgYmVnKTtcbiAgICAgIH1cbiAgICAgIGlmIChzLmd6aW5kZXggPT09IHMuZ3poZWFkLmV4dHJhLmxlbmd0aCkge1xuICAgICAgICBzLmd6aW5kZXggPSAwO1xuICAgICAgICBzLnN0YXR1cyA9IE5BTUVfU1RBVEU7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcy5zdGF0dXMgPSBOQU1FX1NUQVRFO1xuICAgIH1cbiAgfVxuICBpZiAocy5zdGF0dXMgPT09IE5BTUVfU1RBVEUpIHtcbiAgICBpZiAocy5nemhlYWQubmFtZS8qICE9IFpfTlVMTCovKSB7XG4gICAgICBiZWcgPSBzLnBlbmRpbmc7ICAvKiBzdGFydCBvZiBieXRlcyB0byB1cGRhdGUgY3JjICovXG4gICAgICAvL2ludCB2YWw7XG5cbiAgICAgIGRvIHtcbiAgICAgICAgaWYgKHMucGVuZGluZyA9PT0gcy5wZW5kaW5nX2J1Zl9zaXplKSB7XG4gICAgICAgICAgaWYgKHMuZ3poZWFkLmhjcmMgJiYgcy5wZW5kaW5nID4gYmVnKSB7XG4gICAgICAgICAgICBzdHJtLmFkbGVyID0gY3JjMzIoc3RybS5hZGxlciwgcy5wZW5kaW5nX2J1Ziwgcy5wZW5kaW5nIC0gYmVnLCBiZWcpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBmbHVzaF9wZW5kaW5nKHN0cm0pO1xuICAgICAgICAgIGJlZyA9IHMucGVuZGluZztcbiAgICAgICAgICBpZiAocy5wZW5kaW5nID09PSBzLnBlbmRpbmdfYnVmX3NpemUpIHtcbiAgICAgICAgICAgIHZhbCA9IDE7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gSlMgc3BlY2lmaWM6IGxpdHRsZSBtYWdpYyB0byBhZGQgemVybyB0ZXJtaW5hdG9yIHRvIGVuZCBvZiBzdHJpbmdcbiAgICAgICAgaWYgKHMuZ3ppbmRleCA8IHMuZ3poZWFkLm5hbWUubGVuZ3RoKSB7XG4gICAgICAgICAgdmFsID0gcy5nemhlYWQubmFtZS5jaGFyQ29kZUF0KHMuZ3ppbmRleCsrKSAmIDB4ZmY7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFsID0gMDtcbiAgICAgICAgfVxuICAgICAgICBwdXRfYnl0ZShzLCB2YWwpO1xuICAgICAgfSB3aGlsZSAodmFsICE9PSAwKTtcblxuICAgICAgaWYgKHMuZ3poZWFkLmhjcmMgJiYgcy5wZW5kaW5nID4gYmVnKSB7XG4gICAgICAgIHN0cm0uYWRsZXIgPSBjcmMzMihzdHJtLmFkbGVyLCBzLnBlbmRpbmdfYnVmLCBzLnBlbmRpbmcgLSBiZWcsIGJlZyk7XG4gICAgICB9XG4gICAgICBpZiAodmFsID09PSAwKSB7XG4gICAgICAgIHMuZ3ppbmRleCA9IDA7XG4gICAgICAgIHMuc3RhdHVzID0gQ09NTUVOVF9TVEFURTtcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBzLnN0YXR1cyA9IENPTU1FTlRfU1RBVEU7XG4gICAgfVxuICB9XG4gIGlmIChzLnN0YXR1cyA9PT0gQ09NTUVOVF9TVEFURSkge1xuICAgIGlmIChzLmd6aGVhZC5jb21tZW50LyogIT0gWl9OVUxMKi8pIHtcbiAgICAgIGJlZyA9IHMucGVuZGluZzsgIC8qIHN0YXJ0IG9mIGJ5dGVzIHRvIHVwZGF0ZSBjcmMgKi9cbiAgICAgIC8vaW50IHZhbDtcblxuICAgICAgZG8ge1xuICAgICAgICBpZiAocy5wZW5kaW5nID09PSBzLnBlbmRpbmdfYnVmX3NpemUpIHtcbiAgICAgICAgICBpZiAocy5nemhlYWQuaGNyYyAmJiBzLnBlbmRpbmcgPiBiZWcpIHtcbiAgICAgICAgICAgIHN0cm0uYWRsZXIgPSBjcmMzMihzdHJtLmFkbGVyLCBzLnBlbmRpbmdfYnVmLCBzLnBlbmRpbmcgLSBiZWcsIGJlZyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGZsdXNoX3BlbmRpbmcoc3RybSk7XG4gICAgICAgICAgYmVnID0gcy5wZW5kaW5nO1xuICAgICAgICAgIGlmIChzLnBlbmRpbmcgPT09IHMucGVuZGluZ19idWZfc2l6ZSkge1xuICAgICAgICAgICAgdmFsID0gMTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBKUyBzcGVjaWZpYzogbGl0dGxlIG1hZ2ljIHRvIGFkZCB6ZXJvIHRlcm1pbmF0b3IgdG8gZW5kIG9mIHN0cmluZ1xuICAgICAgICBpZiAocy5nemluZGV4IDwgcy5nemhlYWQuY29tbWVudC5sZW5ndGgpIHtcbiAgICAgICAgICB2YWwgPSBzLmd6aGVhZC5jb21tZW50LmNoYXJDb2RlQXQocy5nemluZGV4KyspICYgMHhmZjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YWwgPSAwO1xuICAgICAgICB9XG4gICAgICAgIHB1dF9ieXRlKHMsIHZhbCk7XG4gICAgICB9IHdoaWxlICh2YWwgIT09IDApO1xuXG4gICAgICBpZiAocy5nemhlYWQuaGNyYyAmJiBzLnBlbmRpbmcgPiBiZWcpIHtcbiAgICAgICAgc3RybS5hZGxlciA9IGNyYzMyKHN0cm0uYWRsZXIsIHMucGVuZGluZ19idWYsIHMucGVuZGluZyAtIGJlZywgYmVnKTtcbiAgICAgIH1cbiAgICAgIGlmICh2YWwgPT09IDApIHtcbiAgICAgICAgcy5zdGF0dXMgPSBIQ1JDX1NUQVRFO1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHMuc3RhdHVzID0gSENSQ19TVEFURTtcbiAgICB9XG4gIH1cbiAgaWYgKHMuc3RhdHVzID09PSBIQ1JDX1NUQVRFKSB7XG4gICAgaWYgKHMuZ3poZWFkLmhjcmMpIHtcbiAgICAgIGlmIChzLnBlbmRpbmcgKyAyID4gcy5wZW5kaW5nX2J1Zl9zaXplKSB7XG4gICAgICAgIGZsdXNoX3BlbmRpbmcoc3RybSk7XG4gICAgICB9XG4gICAgICBpZiAocy5wZW5kaW5nICsgMiA8PSBzLnBlbmRpbmdfYnVmX3NpemUpIHtcbiAgICAgICAgcHV0X2J5dGUocywgc3RybS5hZGxlciAmIDB4ZmYpO1xuICAgICAgICBwdXRfYnl0ZShzLCAoc3RybS5hZGxlciA+PiA4KSAmIDB4ZmYpO1xuICAgICAgICBzdHJtLmFkbGVyID0gMDsgLy9jcmMzMigwTCwgWl9OVUxMLCAwKTtcbiAgICAgICAgcy5zdGF0dXMgPSBCVVNZX1NUQVRFO1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHMuc3RhdHVzID0gQlVTWV9TVEFURTtcbiAgICB9XG4gIH1cbi8vI2VuZGlmXG5cbiAgLyogRmx1c2ggYXMgbXVjaCBwZW5kaW5nIG91dHB1dCBhcyBwb3NzaWJsZSAqL1xuICBpZiAocy5wZW5kaW5nICE9PSAwKSB7XG4gICAgZmx1c2hfcGVuZGluZyhzdHJtKTtcbiAgICBpZiAoc3RybS5hdmFpbF9vdXQgPT09IDApIHtcbiAgICAgIC8qIFNpbmNlIGF2YWlsX291dCBpcyAwLCBkZWZsYXRlIHdpbGwgYmUgY2FsbGVkIGFnYWluIHdpdGhcbiAgICAgICAqIG1vcmUgb3V0cHV0IHNwYWNlLCBidXQgcG9zc2libHkgd2l0aCBib3RoIHBlbmRpbmcgYW5kXG4gICAgICAgKiBhdmFpbF9pbiBlcXVhbCB0byB6ZXJvLiBUaGVyZSB3b24ndCBiZSBhbnl0aGluZyB0byBkbyxcbiAgICAgICAqIGJ1dCB0aGlzIGlzIG5vdCBhbiBlcnJvciBzaXR1YXRpb24gc28gbWFrZSBzdXJlIHdlXG4gICAgICAgKiByZXR1cm4gT0sgaW5zdGVhZCBvZiBCVUZfRVJST1IgYXQgbmV4dCBjYWxsIG9mIGRlZmxhdGU6XG4gICAgICAgKi9cbiAgICAgIHMubGFzdF9mbHVzaCA9IC0xO1xuICAgICAgcmV0dXJuIFpfT0s7XG4gICAgfVxuXG4gICAgLyogTWFrZSBzdXJlIHRoZXJlIGlzIHNvbWV0aGluZyB0byBkbyBhbmQgYXZvaWQgZHVwbGljYXRlIGNvbnNlY3V0aXZlXG4gICAgICogZmx1c2hlcy4gRm9yIHJlcGVhdGVkIGFuZCB1c2VsZXNzIGNhbGxzIHdpdGggWl9GSU5JU0gsIHdlIGtlZXBcbiAgICAgKiByZXR1cm5pbmcgWl9TVFJFQU1fRU5EIGluc3RlYWQgb2YgWl9CVUZfRVJST1IuXG4gICAgICovXG4gIH0gZWxzZSBpZiAoc3RybS5hdmFpbF9pbiA9PT0gMCAmJiByYW5rKGZsdXNoKSA8PSByYW5rKG9sZF9mbHVzaCkgJiZcbiAgICBmbHVzaCAhPT0gWl9GSU5JU0gpIHtcbiAgICByZXR1cm4gZXJyKHN0cm0sIFpfQlVGX0VSUk9SKTtcbiAgfVxuXG4gIC8qIFVzZXIgbXVzdCBub3QgcHJvdmlkZSBtb3JlIGlucHV0IGFmdGVyIHRoZSBmaXJzdCBGSU5JU0g6ICovXG4gIGlmIChzLnN0YXR1cyA9PT0gRklOSVNIX1NUQVRFICYmIHN0cm0uYXZhaWxfaW4gIT09IDApIHtcbiAgICByZXR1cm4gZXJyKHN0cm0sIFpfQlVGX0VSUk9SKTtcbiAgfVxuXG4gIC8qIFN0YXJ0IGEgbmV3IGJsb2NrIG9yIGNvbnRpbnVlIHRoZSBjdXJyZW50IG9uZS5cbiAgICovXG4gIGlmIChzdHJtLmF2YWlsX2luICE9PSAwIHx8IHMubG9va2FoZWFkICE9PSAwIHx8XG4gICAgKGZsdXNoICE9PSBaX05PX0ZMVVNIICYmIHMuc3RhdHVzICE9PSBGSU5JU0hfU1RBVEUpKSB7XG4gICAgdmFyIGJzdGF0ZSA9IChzLnN0cmF0ZWd5ID09PSBaX0hVRkZNQU5fT05MWSkgPyBkZWZsYXRlX2h1ZmYocywgZmx1c2gpIDpcbiAgICAgIChzLnN0cmF0ZWd5ID09PSBaX1JMRSA/IGRlZmxhdGVfcmxlKHMsIGZsdXNoKSA6XG4gICAgICAgIGNvbmZpZ3VyYXRpb25fdGFibGVbcy5sZXZlbF0uZnVuYyhzLCBmbHVzaCkpO1xuXG4gICAgaWYgKGJzdGF0ZSA9PT0gQlNfRklOSVNIX1NUQVJURUQgfHwgYnN0YXRlID09PSBCU19GSU5JU0hfRE9ORSkge1xuICAgICAgcy5zdGF0dXMgPSBGSU5JU0hfU1RBVEU7XG4gICAgfVxuICAgIGlmIChic3RhdGUgPT09IEJTX05FRURfTU9SRSB8fCBic3RhdGUgPT09IEJTX0ZJTklTSF9TVEFSVEVEKSB7XG4gICAgICBpZiAoc3RybS5hdmFpbF9vdXQgPT09IDApIHtcbiAgICAgICAgcy5sYXN0X2ZsdXNoID0gLTE7XG4gICAgICAgIC8qIGF2b2lkIEJVRl9FUlJPUiBuZXh0IGNhbGwsIHNlZSBhYm92ZSAqL1xuICAgICAgfVxuICAgICAgcmV0dXJuIFpfT0s7XG4gICAgICAvKiBJZiBmbHVzaCAhPSBaX05PX0ZMVVNIICYmIGF2YWlsX291dCA9PSAwLCB0aGUgbmV4dCBjYWxsXG4gICAgICAgKiBvZiBkZWZsYXRlIHNob3VsZCB1c2UgdGhlIHNhbWUgZmx1c2ggcGFyYW1ldGVyIHRvIG1ha2Ugc3VyZVxuICAgICAgICogdGhhdCB0aGUgZmx1c2ggaXMgY29tcGxldGUuIFNvIHdlIGRvbid0IGhhdmUgdG8gb3V0cHV0IGFuXG4gICAgICAgKiBlbXB0eSBibG9jayBoZXJlLCB0aGlzIHdpbGwgYmUgZG9uZSBhdCBuZXh0IGNhbGwuIFRoaXMgYWxzb1xuICAgICAgICogZW5zdXJlcyB0aGF0IGZvciBhIHZlcnkgc21hbGwgb3V0cHV0IGJ1ZmZlciwgd2UgZW1pdCBhdCBtb3N0XG4gICAgICAgKiBvbmUgZW1wdHkgYmxvY2suXG4gICAgICAgKi9cbiAgICB9XG4gICAgaWYgKGJzdGF0ZSA9PT0gQlNfQkxPQ0tfRE9ORSkge1xuICAgICAgaWYgKGZsdXNoID09PSBaX1BBUlRJQUxfRkxVU0gpIHtcbiAgICAgICAgdHJlZXMuX3RyX2FsaWduKHMpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoZmx1c2ggIT09IFpfQkxPQ0spIHsgLyogRlVMTF9GTFVTSCBvciBTWU5DX0ZMVVNIICovXG5cbiAgICAgICAgdHJlZXMuX3RyX3N0b3JlZF9ibG9jayhzLCAwLCAwLCBmYWxzZSk7XG4gICAgICAgIC8qIEZvciBhIGZ1bGwgZmx1c2gsIHRoaXMgZW1wdHkgYmxvY2sgd2lsbCBiZSByZWNvZ25pemVkXG4gICAgICAgICAqIGFzIGEgc3BlY2lhbCBtYXJrZXIgYnkgaW5mbGF0ZV9zeW5jKCkuXG4gICAgICAgICAqL1xuICAgICAgICBpZiAoZmx1c2ggPT09IFpfRlVMTF9GTFVTSCkge1xuICAgICAgICAgIC8qKiogQ0xFQVJfSEFTSChzKTsgKioqLyAgICAgICAgICAgICAvKiBmb3JnZXQgaGlzdG9yeSAqL1xuICAgICAgICAgIHplcm8ocy5oZWFkKTsgLy8gRmlsbCB3aXRoIE5JTCAoPSAwKTtcblxuICAgICAgICAgIGlmIChzLmxvb2thaGVhZCA9PT0gMCkge1xuICAgICAgICAgICAgcy5zdHJzdGFydCA9IDA7XG4gICAgICAgICAgICBzLmJsb2NrX3N0YXJ0ID0gMDtcbiAgICAgICAgICAgIHMuaW5zZXJ0ID0gMDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGZsdXNoX3BlbmRpbmcoc3RybSk7XG4gICAgICBpZiAoc3RybS5hdmFpbF9vdXQgPT09IDApIHtcbiAgICAgICAgcy5sYXN0X2ZsdXNoID0gLTE7IC8qIGF2b2lkIEJVRl9FUlJPUiBhdCBuZXh0IGNhbGwsIHNlZSBhYm92ZSAqL1xuICAgICAgICByZXR1cm4gWl9PSztcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLy9Bc3NlcnQoc3RybS0+YXZhaWxfb3V0ID4gMCwgXCJidWcyXCIpO1xuICAvL2lmIChzdHJtLmF2YWlsX291dCA8PSAwKSB7IHRocm93IG5ldyBFcnJvcihcImJ1ZzJcIik7fVxuXG4gIGlmIChmbHVzaCAhPT0gWl9GSU5JU0gpIHsgcmV0dXJuIFpfT0s7IH1cbiAgaWYgKHMud3JhcCA8PSAwKSB7IHJldHVybiBaX1NUUkVBTV9FTkQ7IH1cblxuICAvKiBXcml0ZSB0aGUgdHJhaWxlciAqL1xuICBpZiAocy53cmFwID09PSAyKSB7XG4gICAgcHV0X2J5dGUocywgc3RybS5hZGxlciAmIDB4ZmYpO1xuICAgIHB1dF9ieXRlKHMsIChzdHJtLmFkbGVyID4+IDgpICYgMHhmZik7XG4gICAgcHV0X2J5dGUocywgKHN0cm0uYWRsZXIgPj4gMTYpICYgMHhmZik7XG4gICAgcHV0X2J5dGUocywgKHN0cm0uYWRsZXIgPj4gMjQpICYgMHhmZik7XG4gICAgcHV0X2J5dGUocywgc3RybS50b3RhbF9pbiAmIDB4ZmYpO1xuICAgIHB1dF9ieXRlKHMsIChzdHJtLnRvdGFsX2luID4+IDgpICYgMHhmZik7XG4gICAgcHV0X2J5dGUocywgKHN0cm0udG90YWxfaW4gPj4gMTYpICYgMHhmZik7XG4gICAgcHV0X2J5dGUocywgKHN0cm0udG90YWxfaW4gPj4gMjQpICYgMHhmZik7XG4gIH1cbiAgZWxzZVxuICB7XG4gICAgcHV0U2hvcnRNU0Iocywgc3RybS5hZGxlciA+Pj4gMTYpO1xuICAgIHB1dFNob3J0TVNCKHMsIHN0cm0uYWRsZXIgJiAweGZmZmYpO1xuICB9XG5cbiAgZmx1c2hfcGVuZGluZyhzdHJtKTtcbiAgLyogSWYgYXZhaWxfb3V0IGlzIHplcm8sIHRoZSBhcHBsaWNhdGlvbiB3aWxsIGNhbGwgZGVmbGF0ZSBhZ2FpblxuICAgKiB0byBmbHVzaCB0aGUgcmVzdC5cbiAgICovXG4gIGlmIChzLndyYXAgPiAwKSB7IHMud3JhcCA9IC1zLndyYXA7IH1cbiAgLyogd3JpdGUgdGhlIHRyYWlsZXIgb25seSBvbmNlISAqL1xuICByZXR1cm4gcy5wZW5kaW5nICE9PSAwID8gWl9PSyA6IFpfU1RSRUFNX0VORDtcbn1cblxuZnVuY3Rpb24gZGVmbGF0ZUVuZChzdHJtKSB7XG4gIHZhciBzdGF0dXM7XG5cbiAgaWYgKCFzdHJtLyo9PSBaX05VTEwqLyB8fCAhc3RybS5zdGF0ZS8qPT0gWl9OVUxMKi8pIHtcbiAgICByZXR1cm4gWl9TVFJFQU1fRVJST1I7XG4gIH1cblxuICBzdGF0dXMgPSBzdHJtLnN0YXRlLnN0YXR1cztcbiAgaWYgKHN0YXR1cyAhPT0gSU5JVF9TVEFURSAmJlxuICAgIHN0YXR1cyAhPT0gRVhUUkFfU1RBVEUgJiZcbiAgICBzdGF0dXMgIT09IE5BTUVfU1RBVEUgJiZcbiAgICBzdGF0dXMgIT09IENPTU1FTlRfU1RBVEUgJiZcbiAgICBzdGF0dXMgIT09IEhDUkNfU1RBVEUgJiZcbiAgICBzdGF0dXMgIT09IEJVU1lfU1RBVEUgJiZcbiAgICBzdGF0dXMgIT09IEZJTklTSF9TVEFURVxuICApIHtcbiAgICByZXR1cm4gZXJyKHN0cm0sIFpfU1RSRUFNX0VSUk9SKTtcbiAgfVxuXG4gIHN0cm0uc3RhdGUgPSBudWxsO1xuXG4gIHJldHVybiBzdGF0dXMgPT09IEJVU1lfU1RBVEUgPyBlcnIoc3RybSwgWl9EQVRBX0VSUk9SKSA6IFpfT0s7XG59XG5cblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogSW5pdGlhbGl6ZXMgdGhlIGNvbXByZXNzaW9uIGRpY3Rpb25hcnkgZnJvbSB0aGUgZ2l2ZW4gYnl0ZVxuICogc2VxdWVuY2Ugd2l0aG91dCBwcm9kdWNpbmcgYW55IGNvbXByZXNzZWQgb3V0cHV0LlxuICovXG5mdW5jdGlvbiBkZWZsYXRlU2V0RGljdGlvbmFyeShzdHJtLCBkaWN0aW9uYXJ5KSB7XG4gIHZhciBkaWN0TGVuZ3RoID0gZGljdGlvbmFyeS5sZW5ndGg7XG5cbiAgdmFyIHM7XG4gIHZhciBzdHIsIG47XG4gIHZhciB3cmFwO1xuICB2YXIgYXZhaWw7XG4gIHZhciBuZXh0O1xuICB2YXIgaW5wdXQ7XG4gIHZhciB0bXBEaWN0O1xuXG4gIGlmICghc3RybS8qPT0gWl9OVUxMKi8gfHwgIXN0cm0uc3RhdGUvKj09IFpfTlVMTCovKSB7XG4gICAgcmV0dXJuIFpfU1RSRUFNX0VSUk9SO1xuICB9XG5cbiAgcyA9IHN0cm0uc3RhdGU7XG4gIHdyYXAgPSBzLndyYXA7XG5cbiAgaWYgKHdyYXAgPT09IDIgfHwgKHdyYXAgPT09IDEgJiYgcy5zdGF0dXMgIT09IElOSVRfU1RBVEUpIHx8IHMubG9va2FoZWFkKSB7XG4gICAgcmV0dXJuIFpfU1RSRUFNX0VSUk9SO1xuICB9XG5cbiAgLyogd2hlbiB1c2luZyB6bGliIHdyYXBwZXJzLCBjb21wdXRlIEFkbGVyLTMyIGZvciBwcm92aWRlZCBkaWN0aW9uYXJ5ICovXG4gIGlmICh3cmFwID09PSAxKSB7XG4gICAgLyogYWRsZXIzMihzdHJtLT5hZGxlciwgZGljdGlvbmFyeSwgZGljdExlbmd0aCk7ICovXG4gICAgc3RybS5hZGxlciA9IGFkbGVyMzIoc3RybS5hZGxlciwgZGljdGlvbmFyeSwgZGljdExlbmd0aCwgMCk7XG4gIH1cblxuICBzLndyYXAgPSAwOyAgIC8qIGF2b2lkIGNvbXB1dGluZyBBZGxlci0zMiBpbiByZWFkX2J1ZiAqL1xuXG4gIC8qIGlmIGRpY3Rpb25hcnkgd291bGQgZmlsbCB3aW5kb3csIGp1c3QgcmVwbGFjZSB0aGUgaGlzdG9yeSAqL1xuICBpZiAoZGljdExlbmd0aCA+PSBzLndfc2l6ZSkge1xuICAgIGlmICh3cmFwID09PSAwKSB7ICAgICAgICAgICAgLyogYWxyZWFkeSBlbXB0eSBvdGhlcndpc2UgKi9cbiAgICAgIC8qKiogQ0xFQVJfSEFTSChzKTsgKioqL1xuICAgICAgemVybyhzLmhlYWQpOyAvLyBGaWxsIHdpdGggTklMICg9IDApO1xuICAgICAgcy5zdHJzdGFydCA9IDA7XG4gICAgICBzLmJsb2NrX3N0YXJ0ID0gMDtcbiAgICAgIHMuaW5zZXJ0ID0gMDtcbiAgICB9XG4gICAgLyogdXNlIHRoZSB0YWlsICovXG4gICAgLy8gZGljdGlvbmFyeSA9IGRpY3Rpb25hcnkuc2xpY2UoZGljdExlbmd0aCAtIHMud19zaXplKTtcbiAgICB0bXBEaWN0ID0gbmV3IHV0aWxzLkJ1Zjgocy53X3NpemUpO1xuICAgIHV0aWxzLmFycmF5U2V0KHRtcERpY3QsIGRpY3Rpb25hcnksIGRpY3RMZW5ndGggLSBzLndfc2l6ZSwgcy53X3NpemUsIDApO1xuICAgIGRpY3Rpb25hcnkgPSB0bXBEaWN0O1xuICAgIGRpY3RMZW5ndGggPSBzLndfc2l6ZTtcbiAgfVxuICAvKiBpbnNlcnQgZGljdGlvbmFyeSBpbnRvIHdpbmRvdyBhbmQgaGFzaCAqL1xuICBhdmFpbCA9IHN0cm0uYXZhaWxfaW47XG4gIG5leHQgPSBzdHJtLm5leHRfaW47XG4gIGlucHV0ID0gc3RybS5pbnB1dDtcbiAgc3RybS5hdmFpbF9pbiA9IGRpY3RMZW5ndGg7XG4gIHN0cm0ubmV4dF9pbiA9IDA7XG4gIHN0cm0uaW5wdXQgPSBkaWN0aW9uYXJ5O1xuICBmaWxsX3dpbmRvdyhzKTtcbiAgd2hpbGUgKHMubG9va2FoZWFkID49IE1JTl9NQVRDSCkge1xuICAgIHN0ciA9IHMuc3Ryc3RhcnQ7XG4gICAgbiA9IHMubG9va2FoZWFkIC0gKE1JTl9NQVRDSCAtIDEpO1xuICAgIGRvIHtcbiAgICAgIC8qIFVQREFURV9IQVNIKHMsIHMtPmluc19oLCBzLT53aW5kb3dbc3RyICsgTUlOX01BVENILTFdKTsgKi9cbiAgICAgIHMuaW5zX2ggPSAoKHMuaW5zX2ggPDwgcy5oYXNoX3NoaWZ0KSBeIHMud2luZG93W3N0ciArIE1JTl9NQVRDSCAtIDFdKSAmIHMuaGFzaF9tYXNrO1xuXG4gICAgICBzLnByZXZbc3RyICYgcy53X21hc2tdID0gcy5oZWFkW3MuaW5zX2hdO1xuXG4gICAgICBzLmhlYWRbcy5pbnNfaF0gPSBzdHI7XG4gICAgICBzdHIrKztcbiAgICB9IHdoaWxlICgtLW4pO1xuICAgIHMuc3Ryc3RhcnQgPSBzdHI7XG4gICAgcy5sb29rYWhlYWQgPSBNSU5fTUFUQ0ggLSAxO1xuICAgIGZpbGxfd2luZG93KHMpO1xuICB9XG4gIHMuc3Ryc3RhcnQgKz0gcy5sb29rYWhlYWQ7XG4gIHMuYmxvY2tfc3RhcnQgPSBzLnN0cnN0YXJ0O1xuICBzLmluc2VydCA9IHMubG9va2FoZWFkO1xuICBzLmxvb2thaGVhZCA9IDA7XG4gIHMubWF0Y2hfbGVuZ3RoID0gcy5wcmV2X2xlbmd0aCA9IE1JTl9NQVRDSCAtIDE7XG4gIHMubWF0Y2hfYXZhaWxhYmxlID0gMDtcbiAgc3RybS5uZXh0X2luID0gbmV4dDtcbiAgc3RybS5pbnB1dCA9IGlucHV0O1xuICBzdHJtLmF2YWlsX2luID0gYXZhaWw7XG4gIHMud3JhcCA9IHdyYXA7XG4gIHJldHVybiBaX09LO1xufVxuXG5cbmV4cG9ydHMuZGVmbGF0ZUluaXQgPSBkZWZsYXRlSW5pdDtcbmV4cG9ydHMuZGVmbGF0ZUluaXQyID0gZGVmbGF0ZUluaXQyO1xuZXhwb3J0cy5kZWZsYXRlUmVzZXQgPSBkZWZsYXRlUmVzZXQ7XG5leHBvcnRzLmRlZmxhdGVSZXNldEtlZXAgPSBkZWZsYXRlUmVzZXRLZWVwO1xuZXhwb3J0cy5kZWZsYXRlU2V0SGVhZGVyID0gZGVmbGF0ZVNldEhlYWRlcjtcbmV4cG9ydHMuZGVmbGF0ZSA9IGRlZmxhdGU7XG5leHBvcnRzLmRlZmxhdGVFbmQgPSBkZWZsYXRlRW5kO1xuZXhwb3J0cy5kZWZsYXRlU2V0RGljdGlvbmFyeSA9IGRlZmxhdGVTZXREaWN0aW9uYXJ5O1xuZXhwb3J0cy5kZWZsYXRlSW5mbyA9ICdwYWtvIGRlZmxhdGUgKGZyb20gTm9kZWNhIHByb2plY3QpJztcblxuLyogTm90IGltcGxlbWVudGVkXG5leHBvcnRzLmRlZmxhdGVCb3VuZCA9IGRlZmxhdGVCb3VuZDtcbmV4cG9ydHMuZGVmbGF0ZUNvcHkgPSBkZWZsYXRlQ29weTtcbmV4cG9ydHMuZGVmbGF0ZVBhcmFtcyA9IGRlZmxhdGVQYXJhbXM7XG5leHBvcnRzLmRlZmxhdGVQZW5kaW5nID0gZGVmbGF0ZVBlbmRpbmc7XG5leHBvcnRzLmRlZmxhdGVQcmltZSA9IGRlZmxhdGVQcmltZTtcbmV4cG9ydHMuZGVmbGF0ZVR1bmUgPSBkZWZsYXRlVHVuZTtcbiovXG5cbn0se1wiLi4vdXRpbHMvY29tbW9uXCI6NDEsXCIuL2FkbGVyMzJcIjo0MyxcIi4vY3JjMzJcIjo0NSxcIi4vbWVzc2FnZXNcIjo1MSxcIi4vdHJlZXNcIjo1Mn1dLDQ3OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcblxuLy8gKEMpIDE5OTUtMjAxMyBKZWFuLWxvdXAgR2FpbGx5IGFuZCBNYXJrIEFkbGVyXG4vLyAoQykgMjAxNC0yMDE3IFZpdGFseSBQdXpyaW4gYW5kIEFuZHJleSBUdXBpdHNpblxuLy9cbi8vIFRoaXMgc29mdHdhcmUgaXMgcHJvdmlkZWQgJ2FzLWlzJywgd2l0aG91dCBhbnkgZXhwcmVzcyBvciBpbXBsaWVkXG4vLyB3YXJyYW50eS4gSW4gbm8gZXZlbnQgd2lsbCB0aGUgYXV0aG9ycyBiZSBoZWxkIGxpYWJsZSBmb3IgYW55IGRhbWFnZXNcbi8vIGFyaXNpbmcgZnJvbSB0aGUgdXNlIG9mIHRoaXMgc29mdHdhcmUuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBncmFudGVkIHRvIGFueW9uZSB0byB1c2UgdGhpcyBzb2Z0d2FyZSBmb3IgYW55IHB1cnBvc2UsXG4vLyBpbmNsdWRpbmcgY29tbWVyY2lhbCBhcHBsaWNhdGlvbnMsIGFuZCB0byBhbHRlciBpdCBhbmQgcmVkaXN0cmlidXRlIGl0XG4vLyBmcmVlbHksIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyByZXN0cmljdGlvbnM6XG4vL1xuLy8gMS4gVGhlIG9yaWdpbiBvZiB0aGlzIHNvZnR3YXJlIG11c3Qgbm90IGJlIG1pc3JlcHJlc2VudGVkOyB5b3UgbXVzdCBub3Rcbi8vICAgY2xhaW0gdGhhdCB5b3Ugd3JvdGUgdGhlIG9yaWdpbmFsIHNvZnR3YXJlLiBJZiB5b3UgdXNlIHRoaXMgc29mdHdhcmVcbi8vICAgaW4gYSBwcm9kdWN0LCBhbiBhY2tub3dsZWRnbWVudCBpbiB0aGUgcHJvZHVjdCBkb2N1bWVudGF0aW9uIHdvdWxkIGJlXG4vLyAgIGFwcHJlY2lhdGVkIGJ1dCBpcyBub3QgcmVxdWlyZWQuXG4vLyAyLiBBbHRlcmVkIHNvdXJjZSB2ZXJzaW9ucyBtdXN0IGJlIHBsYWlubHkgbWFya2VkIGFzIHN1Y2gsIGFuZCBtdXN0IG5vdCBiZVxuLy8gICBtaXNyZXByZXNlbnRlZCBhcyBiZWluZyB0aGUgb3JpZ2luYWwgc29mdHdhcmUuXG4vLyAzLiBUaGlzIG5vdGljZSBtYXkgbm90IGJlIHJlbW92ZWQgb3IgYWx0ZXJlZCBmcm9tIGFueSBzb3VyY2UgZGlzdHJpYnV0aW9uLlxuXG5mdW5jdGlvbiBHWmhlYWRlcigpIHtcbiAgLyogdHJ1ZSBpZiBjb21wcmVzc2VkIGRhdGEgYmVsaWV2ZWQgdG8gYmUgdGV4dCAqL1xuICB0aGlzLnRleHQgICAgICAgPSAwO1xuICAvKiBtb2RpZmljYXRpb24gdGltZSAqL1xuICB0aGlzLnRpbWUgICAgICAgPSAwO1xuICAvKiBleHRyYSBmbGFncyAobm90IHVzZWQgd2hlbiB3cml0aW5nIGEgZ3ppcCBmaWxlKSAqL1xuICB0aGlzLnhmbGFncyAgICAgPSAwO1xuICAvKiBvcGVyYXRpbmcgc3lzdGVtICovXG4gIHRoaXMub3MgICAgICAgICA9IDA7XG4gIC8qIHBvaW50ZXIgdG8gZXh0cmEgZmllbGQgb3IgWl9OVUxMIGlmIG5vbmUgKi9cbiAgdGhpcy5leHRyYSAgICAgID0gbnVsbDtcbiAgLyogZXh0cmEgZmllbGQgbGVuZ3RoICh2YWxpZCBpZiBleHRyYSAhPSBaX05VTEwpICovXG4gIHRoaXMuZXh0cmFfbGVuICA9IDA7IC8vIEFjdHVhbGx5LCB3ZSBkb24ndCBuZWVkIGl0IGluIEpTLFxuICAgICAgICAgICAgICAgICAgICAgICAvLyBidXQgbGVhdmUgZm9yIGZldyBjb2RlIG1vZGlmaWNhdGlvbnNcblxuICAvL1xuICAvLyBTZXR1cCBsaW1pdHMgaXMgbm90IG5lY2Vzc2FyeSBiZWNhdXNlIGluIGpzIHdlIHNob3VsZCBub3QgcHJlYWxsb2NhdGUgbWVtb3J5XG4gIC8vIGZvciBpbmZsYXRlIHVzZSBjb25zdGFudCBsaW1pdCBpbiA2NTUzNiBieXRlc1xuICAvL1xuXG4gIC8qIHNwYWNlIGF0IGV4dHJhIChvbmx5IHdoZW4gcmVhZGluZyBoZWFkZXIpICovXG4gIC8vIHRoaXMuZXh0cmFfbWF4ICA9IDA7XG4gIC8qIHBvaW50ZXIgdG8gemVyby10ZXJtaW5hdGVkIGZpbGUgbmFtZSBvciBaX05VTEwgKi9cbiAgdGhpcy5uYW1lICAgICAgID0gJyc7XG4gIC8qIHNwYWNlIGF0IG5hbWUgKG9ubHkgd2hlbiByZWFkaW5nIGhlYWRlcikgKi9cbiAgLy8gdGhpcy5uYW1lX21heCAgID0gMDtcbiAgLyogcG9pbnRlciB0byB6ZXJvLXRlcm1pbmF0ZWQgY29tbWVudCBvciBaX05VTEwgKi9cbiAgdGhpcy5jb21tZW50ICAgID0gJyc7XG4gIC8qIHNwYWNlIGF0IGNvbW1lbnQgKG9ubHkgd2hlbiByZWFkaW5nIGhlYWRlcikgKi9cbiAgLy8gdGhpcy5jb21tX21heCAgID0gMDtcbiAgLyogdHJ1ZSBpZiB0aGVyZSB3YXMgb3Igd2lsbCBiZSBhIGhlYWRlciBjcmMgKi9cbiAgdGhpcy5oY3JjICAgICAgID0gMDtcbiAgLyogdHJ1ZSB3aGVuIGRvbmUgcmVhZGluZyBnemlwIGhlYWRlciAobm90IHVzZWQgd2hlbiB3cml0aW5nIGEgZ3ppcCBmaWxlKSAqL1xuICB0aGlzLmRvbmUgICAgICAgPSBmYWxzZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBHWmhlYWRlcjtcblxufSx7fV0sNDg6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXG4vLyAoQykgMTk5NS0yMDEzIEplYW4tbG91cCBHYWlsbHkgYW5kIE1hcmsgQWRsZXJcbi8vIChDKSAyMDE0LTIwMTcgVml0YWx5IFB1enJpbiBhbmQgQW5kcmV5IFR1cGl0c2luXG4vL1xuLy8gVGhpcyBzb2Z0d2FyZSBpcyBwcm92aWRlZCAnYXMtaXMnLCB3aXRob3V0IGFueSBleHByZXNzIG9yIGltcGxpZWRcbi8vIHdhcnJhbnR5LiBJbiBubyBldmVudCB3aWxsIHRoZSBhdXRob3JzIGJlIGhlbGQgbGlhYmxlIGZvciBhbnkgZGFtYWdlc1xuLy8gYXJpc2luZyBmcm9tIHRoZSB1c2Ugb2YgdGhpcyBzb2Z0d2FyZS5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGdyYW50ZWQgdG8gYW55b25lIHRvIHVzZSB0aGlzIHNvZnR3YXJlIGZvciBhbnkgcHVycG9zZSxcbi8vIGluY2x1ZGluZyBjb21tZXJjaWFsIGFwcGxpY2F0aW9ucywgYW5kIHRvIGFsdGVyIGl0IGFuZCByZWRpc3RyaWJ1dGUgaXRcbi8vIGZyZWVseSwgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIHJlc3RyaWN0aW9uczpcbi8vXG4vLyAxLiBUaGUgb3JpZ2luIG9mIHRoaXMgc29mdHdhcmUgbXVzdCBub3QgYmUgbWlzcmVwcmVzZW50ZWQ7IHlvdSBtdXN0IG5vdFxuLy8gICBjbGFpbSB0aGF0IHlvdSB3cm90ZSB0aGUgb3JpZ2luYWwgc29mdHdhcmUuIElmIHlvdSB1c2UgdGhpcyBzb2Z0d2FyZVxuLy8gICBpbiBhIHByb2R1Y3QsIGFuIGFja25vd2xlZGdtZW50IGluIHRoZSBwcm9kdWN0IGRvY3VtZW50YXRpb24gd291bGQgYmVcbi8vICAgYXBwcmVjaWF0ZWQgYnV0IGlzIG5vdCByZXF1aXJlZC5cbi8vIDIuIEFsdGVyZWQgc291cmNlIHZlcnNpb25zIG11c3QgYmUgcGxhaW5seSBtYXJrZWQgYXMgc3VjaCwgYW5kIG11c3Qgbm90IGJlXG4vLyAgIG1pc3JlcHJlc2VudGVkIGFzIGJlaW5nIHRoZSBvcmlnaW5hbCBzb2Z0d2FyZS5cbi8vIDMuIFRoaXMgbm90aWNlIG1heSBub3QgYmUgcmVtb3ZlZCBvciBhbHRlcmVkIGZyb20gYW55IHNvdXJjZSBkaXN0cmlidXRpb24uXG5cbi8vIFNlZSBzdGF0ZSBkZWZzIGZyb20gaW5mbGF0ZS5qc1xudmFyIEJBRCA9IDMwOyAgICAgICAvKiBnb3QgYSBkYXRhIGVycm9yIC0tIHJlbWFpbiBoZXJlIHVudGlsIHJlc2V0ICovXG52YXIgVFlQRSA9IDEyOyAgICAgIC8qIGk6IHdhaXRpbmcgZm9yIHR5cGUgYml0cywgaW5jbHVkaW5nIGxhc3QtZmxhZyBiaXQgKi9cblxuLypcbiAgIERlY29kZSBsaXRlcmFsLCBsZW5ndGgsIGFuZCBkaXN0YW5jZSBjb2RlcyBhbmQgd3JpdGUgb3V0IHRoZSByZXN1bHRpbmdcbiAgIGxpdGVyYWwgYW5kIG1hdGNoIGJ5dGVzIHVudGlsIGVpdGhlciBub3QgZW5vdWdoIGlucHV0IG9yIG91dHB1dCBpc1xuICAgYXZhaWxhYmxlLCBhbiBlbmQtb2YtYmxvY2sgaXMgZW5jb3VudGVyZWQsIG9yIGEgZGF0YSBlcnJvciBpcyBlbmNvdW50ZXJlZC5cbiAgIFdoZW4gbGFyZ2UgZW5vdWdoIGlucHV0IGFuZCBvdXRwdXQgYnVmZmVycyBhcmUgc3VwcGxpZWQgdG8gaW5mbGF0ZSgpLCBmb3JcbiAgIGV4YW1wbGUsIGEgMTZLIGlucHV0IGJ1ZmZlciBhbmQgYSA2NEsgb3V0cHV0IGJ1ZmZlciwgbW9yZSB0aGFuIDk1JSBvZiB0aGVcbiAgIGluZmxhdGUgZXhlY3V0aW9uIHRpbWUgaXMgc3BlbnQgaW4gdGhpcyByb3V0aW5lLlxuXG4gICBFbnRyeSBhc3N1bXB0aW9uczpcblxuICAgICAgICBzdGF0ZS5tb2RlID09PSBMRU5cbiAgICAgICAgc3RybS5hdmFpbF9pbiA+PSA2XG4gICAgICAgIHN0cm0uYXZhaWxfb3V0ID49IDI1OFxuICAgICAgICBzdGFydCA+PSBzdHJtLmF2YWlsX291dFxuICAgICAgICBzdGF0ZS5iaXRzIDwgOFxuXG4gICBPbiByZXR1cm4sIHN0YXRlLm1vZGUgaXMgb25lIG9mOlxuXG4gICAgICAgIExFTiAtLSByYW4gb3V0IG9mIGVub3VnaCBvdXRwdXQgc3BhY2Ugb3IgZW5vdWdoIGF2YWlsYWJsZSBpbnB1dFxuICAgICAgICBUWVBFIC0tIHJlYWNoZWQgZW5kIG9mIGJsb2NrIGNvZGUsIGluZmxhdGUoKSB0byBpbnRlcnByZXQgbmV4dCBibG9ja1xuICAgICAgICBCQUQgLS0gZXJyb3IgaW4gYmxvY2sgZGF0YVxuXG4gICBOb3RlczpcblxuICAgIC0gVGhlIG1heGltdW0gaW5wdXQgYml0cyB1c2VkIGJ5IGEgbGVuZ3RoL2Rpc3RhbmNlIHBhaXIgaXMgMTUgYml0cyBmb3IgdGhlXG4gICAgICBsZW5ndGggY29kZSwgNSBiaXRzIGZvciB0aGUgbGVuZ3RoIGV4dHJhLCAxNSBiaXRzIGZvciB0aGUgZGlzdGFuY2UgY29kZSxcbiAgICAgIGFuZCAxMyBiaXRzIGZvciB0aGUgZGlzdGFuY2UgZXh0cmEuICBUaGlzIHRvdGFscyA0OCBiaXRzLCBvciBzaXggYnl0ZXMuXG4gICAgICBUaGVyZWZvcmUgaWYgc3RybS5hdmFpbF9pbiA+PSA2LCB0aGVuIHRoZXJlIGlzIGVub3VnaCBpbnB1dCB0byBhdm9pZFxuICAgICAgY2hlY2tpbmcgZm9yIGF2YWlsYWJsZSBpbnB1dCB3aGlsZSBkZWNvZGluZy5cblxuICAgIC0gVGhlIG1heGltdW0gYnl0ZXMgdGhhdCBhIHNpbmdsZSBsZW5ndGgvZGlzdGFuY2UgcGFpciBjYW4gb3V0cHV0IGlzIDI1OFxuICAgICAgYnl0ZXMsIHdoaWNoIGlzIHRoZSBtYXhpbXVtIGxlbmd0aCB0aGF0IGNhbiBiZSBjb2RlZC4gIGluZmxhdGVfZmFzdCgpXG4gICAgICByZXF1aXJlcyBzdHJtLmF2YWlsX291dCA+PSAyNTggZm9yIGVhY2ggbG9vcCB0byBhdm9pZCBjaGVja2luZyBmb3JcbiAgICAgIG91dHB1dCBzcGFjZS5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmZsYXRlX2Zhc3Qoc3RybSwgc3RhcnQpIHtcbiAgdmFyIHN0YXRlO1xuICB2YXIgX2luOyAgICAgICAgICAgICAgICAgICAgLyogbG9jYWwgc3RybS5pbnB1dCAqL1xuICB2YXIgbGFzdDsgICAgICAgICAgICAgICAgICAgLyogaGF2ZSBlbm91Z2ggaW5wdXQgd2hpbGUgaW4gPCBsYXN0ICovXG4gIHZhciBfb3V0OyAgICAgICAgICAgICAgICAgICAvKiBsb2NhbCBzdHJtLm91dHB1dCAqL1xuICB2YXIgYmVnOyAgICAgICAgICAgICAgICAgICAgLyogaW5mbGF0ZSgpJ3MgaW5pdGlhbCBzdHJtLm91dHB1dCAqL1xuICB2YXIgZW5kOyAgICAgICAgICAgICAgICAgICAgLyogd2hpbGUgb3V0IDwgZW5kLCBlbm91Z2ggc3BhY2UgYXZhaWxhYmxlICovXG4vLyNpZmRlZiBJTkZMQVRFX1NUUklDVFxuICB2YXIgZG1heDsgICAgICAgICAgICAgICAgICAgLyogbWF4aW11bSBkaXN0YW5jZSBmcm9tIHpsaWIgaGVhZGVyICovXG4vLyNlbmRpZlxuICB2YXIgd3NpemU7ICAgICAgICAgICAgICAgICAgLyogd2luZG93IHNpemUgb3IgemVybyBpZiBub3QgdXNpbmcgd2luZG93ICovXG4gIHZhciB3aGF2ZTsgICAgICAgICAgICAgICAgICAvKiB2YWxpZCBieXRlcyBpbiB0aGUgd2luZG93ICovXG4gIHZhciB3bmV4dDsgICAgICAgICAgICAgICAgICAvKiB3aW5kb3cgd3JpdGUgaW5kZXggKi9cbiAgLy8gVXNlIGBzX3dpbmRvd2AgaW5zdGVhZCBgd2luZG93YCwgYXZvaWQgY29uZmxpY3Qgd2l0aCBpbnN0cnVtZW50YXRpb24gdG9vbHNcbiAgdmFyIHNfd2luZG93OyAgICAgICAgICAgICAgIC8qIGFsbG9jYXRlZCBzbGlkaW5nIHdpbmRvdywgaWYgd3NpemUgIT0gMCAqL1xuICB2YXIgaG9sZDsgICAgICAgICAgICAgICAgICAgLyogbG9jYWwgc3RybS5ob2xkICovXG4gIHZhciBiaXRzOyAgICAgICAgICAgICAgICAgICAvKiBsb2NhbCBzdHJtLmJpdHMgKi9cbiAgdmFyIGxjb2RlOyAgICAgICAgICAgICAgICAgIC8qIGxvY2FsIHN0cm0ubGVuY29kZSAqL1xuICB2YXIgZGNvZGU7ICAgICAgICAgICAgICAgICAgLyogbG9jYWwgc3RybS5kaXN0Y29kZSAqL1xuICB2YXIgbG1hc2s7ICAgICAgICAgICAgICAgICAgLyogbWFzayBmb3IgZmlyc3QgbGV2ZWwgb2YgbGVuZ3RoIGNvZGVzICovXG4gIHZhciBkbWFzazsgICAgICAgICAgICAgICAgICAvKiBtYXNrIGZvciBmaXJzdCBsZXZlbCBvZiBkaXN0YW5jZSBjb2RlcyAqL1xuICB2YXIgaGVyZTsgICAgICAgICAgICAgICAgICAgLyogcmV0cmlldmVkIHRhYmxlIGVudHJ5ICovXG4gIHZhciBvcDsgICAgICAgICAgICAgICAgICAgICAvKiBjb2RlIGJpdHMsIG9wZXJhdGlvbiwgZXh0cmEgYml0cywgb3IgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qICB3aW5kb3cgcG9zaXRpb24sIHdpbmRvdyBieXRlcyB0byBjb3B5ICovXG4gIHZhciBsZW47ICAgICAgICAgICAgICAgICAgICAvKiBtYXRjaCBsZW5ndGgsIHVudXNlZCBieXRlcyAqL1xuICB2YXIgZGlzdDsgICAgICAgICAgICAgICAgICAgLyogbWF0Y2ggZGlzdGFuY2UgKi9cbiAgdmFyIGZyb207ICAgICAgICAgICAgICAgICAgIC8qIHdoZXJlIHRvIGNvcHkgbWF0Y2ggZnJvbSAqL1xuICB2YXIgZnJvbV9zb3VyY2U7XG5cblxuICB2YXIgaW5wdXQsIG91dHB1dDsgLy8gSlMgc3BlY2lmaWMsIGJlY2F1c2Ugd2UgaGF2ZSBubyBwb2ludGVyc1xuXG4gIC8qIGNvcHkgc3RhdGUgdG8gbG9jYWwgdmFyaWFibGVzICovXG4gIHN0YXRlID0gc3RybS5zdGF0ZTtcbiAgLy9oZXJlID0gc3RhdGUuaGVyZTtcbiAgX2luID0gc3RybS5uZXh0X2luO1xuICBpbnB1dCA9IHN0cm0uaW5wdXQ7XG4gIGxhc3QgPSBfaW4gKyAoc3RybS5hdmFpbF9pbiAtIDUpO1xuICBfb3V0ID0gc3RybS5uZXh0X291dDtcbiAgb3V0cHV0ID0gc3RybS5vdXRwdXQ7XG4gIGJlZyA9IF9vdXQgLSAoc3RhcnQgLSBzdHJtLmF2YWlsX291dCk7XG4gIGVuZCA9IF9vdXQgKyAoc3RybS5hdmFpbF9vdXQgLSAyNTcpO1xuLy8jaWZkZWYgSU5GTEFURV9TVFJJQ1RcbiAgZG1heCA9IHN0YXRlLmRtYXg7XG4vLyNlbmRpZlxuICB3c2l6ZSA9IHN0YXRlLndzaXplO1xuICB3aGF2ZSA9IHN0YXRlLndoYXZlO1xuICB3bmV4dCA9IHN0YXRlLnduZXh0O1xuICBzX3dpbmRvdyA9IHN0YXRlLndpbmRvdztcbiAgaG9sZCA9IHN0YXRlLmhvbGQ7XG4gIGJpdHMgPSBzdGF0ZS5iaXRzO1xuICBsY29kZSA9IHN0YXRlLmxlbmNvZGU7XG4gIGRjb2RlID0gc3RhdGUuZGlzdGNvZGU7XG4gIGxtYXNrID0gKDEgPDwgc3RhdGUubGVuYml0cykgLSAxO1xuICBkbWFzayA9ICgxIDw8IHN0YXRlLmRpc3RiaXRzKSAtIDE7XG5cblxuICAvKiBkZWNvZGUgbGl0ZXJhbHMgYW5kIGxlbmd0aC9kaXN0YW5jZXMgdW50aWwgZW5kLW9mLWJsb2NrIG9yIG5vdCBlbm91Z2hcbiAgICAgaW5wdXQgZGF0YSBvciBvdXRwdXQgc3BhY2UgKi9cblxuICB0b3A6XG4gIGRvIHtcbiAgICBpZiAoYml0cyA8IDE1KSB7XG4gICAgICBob2xkICs9IGlucHV0W19pbisrXSA8PCBiaXRzO1xuICAgICAgYml0cyArPSA4O1xuICAgICAgaG9sZCArPSBpbnB1dFtfaW4rK10gPDwgYml0cztcbiAgICAgIGJpdHMgKz0gODtcbiAgICB9XG5cbiAgICBoZXJlID0gbGNvZGVbaG9sZCAmIGxtYXNrXTtcblxuICAgIGRvbGVuOlxuICAgIGZvciAoOzspIHsgLy8gR290byBlbXVsYXRpb25cbiAgICAgIG9wID0gaGVyZSA+Pj4gMjQvKmhlcmUuYml0cyovO1xuICAgICAgaG9sZCA+Pj49IG9wO1xuICAgICAgYml0cyAtPSBvcDtcbiAgICAgIG9wID0gKGhlcmUgPj4+IDE2KSAmIDB4ZmYvKmhlcmUub3AqLztcbiAgICAgIGlmIChvcCA9PT0gMCkgeyAgICAgICAgICAgICAgICAgICAgICAgICAgLyogbGl0ZXJhbCAqL1xuICAgICAgICAvL1RyYWNldnYoKHN0ZGVyciwgaGVyZS52YWwgPj0gMHgyMCAmJiBoZXJlLnZhbCA8IDB4N2YgP1xuICAgICAgICAvLyAgICAgICAgXCJpbmZsYXRlOiAgICAgICAgIGxpdGVyYWwgJyVjJ1xcblwiIDpcbiAgICAgICAgLy8gICAgICAgIFwiaW5mbGF0ZTogICAgICAgICBsaXRlcmFsIDB4JTAyeFxcblwiLCBoZXJlLnZhbCkpO1xuICAgICAgICBvdXRwdXRbX291dCsrXSA9IGhlcmUgJiAweGZmZmYvKmhlcmUudmFsKi87XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChvcCAmIDE2KSB7ICAgICAgICAgICAgICAgICAgICAgLyogbGVuZ3RoIGJhc2UgKi9cbiAgICAgICAgbGVuID0gaGVyZSAmIDB4ZmZmZi8qaGVyZS52YWwqLztcbiAgICAgICAgb3AgJj0gMTU7ICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogbnVtYmVyIG9mIGV4dHJhIGJpdHMgKi9cbiAgICAgICAgaWYgKG9wKSB7XG4gICAgICAgICAgaWYgKGJpdHMgPCBvcCkge1xuICAgICAgICAgICAgaG9sZCArPSBpbnB1dFtfaW4rK10gPDwgYml0cztcbiAgICAgICAgICAgIGJpdHMgKz0gODtcbiAgICAgICAgICB9XG4gICAgICAgICAgbGVuICs9IGhvbGQgJiAoKDEgPDwgb3ApIC0gMSk7XG4gICAgICAgICAgaG9sZCA+Pj49IG9wO1xuICAgICAgICAgIGJpdHMgLT0gb3A7XG4gICAgICAgIH1cbiAgICAgICAgLy9UcmFjZXZ2KChzdGRlcnIsIFwiaW5mbGF0ZTogICAgICAgICBsZW5ndGggJXVcXG5cIiwgbGVuKSk7XG4gICAgICAgIGlmIChiaXRzIDwgMTUpIHtcbiAgICAgICAgICBob2xkICs9IGlucHV0W19pbisrXSA8PCBiaXRzO1xuICAgICAgICAgIGJpdHMgKz0gODtcbiAgICAgICAgICBob2xkICs9IGlucHV0W19pbisrXSA8PCBiaXRzO1xuICAgICAgICAgIGJpdHMgKz0gODtcbiAgICAgICAgfVxuICAgICAgICBoZXJlID0gZGNvZGVbaG9sZCAmIGRtYXNrXTtcblxuICAgICAgICBkb2Rpc3Q6XG4gICAgICAgIGZvciAoOzspIHsgLy8gZ290byBlbXVsYXRpb25cbiAgICAgICAgICBvcCA9IGhlcmUgPj4+IDI0LypoZXJlLmJpdHMqLztcbiAgICAgICAgICBob2xkID4+Pj0gb3A7XG4gICAgICAgICAgYml0cyAtPSBvcDtcbiAgICAgICAgICBvcCA9IChoZXJlID4+PiAxNikgJiAweGZmLypoZXJlLm9wKi87XG5cbiAgICAgICAgICBpZiAob3AgJiAxNikgeyAgICAgICAgICAgICAgICAgICAgICAvKiBkaXN0YW5jZSBiYXNlICovXG4gICAgICAgICAgICBkaXN0ID0gaGVyZSAmIDB4ZmZmZi8qaGVyZS52YWwqLztcbiAgICAgICAgICAgIG9wICY9IDE1OyAgICAgICAgICAgICAgICAgICAgICAgLyogbnVtYmVyIG9mIGV4dHJhIGJpdHMgKi9cbiAgICAgICAgICAgIGlmIChiaXRzIDwgb3ApIHtcbiAgICAgICAgICAgICAgaG9sZCArPSBpbnB1dFtfaW4rK10gPDwgYml0cztcbiAgICAgICAgICAgICAgYml0cyArPSA4O1xuICAgICAgICAgICAgICBpZiAoYml0cyA8IG9wKSB7XG4gICAgICAgICAgICAgICAgaG9sZCArPSBpbnB1dFtfaW4rK10gPDwgYml0cztcbiAgICAgICAgICAgICAgICBiaXRzICs9IDg7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRpc3QgKz0gaG9sZCAmICgoMSA8PCBvcCkgLSAxKTtcbi8vI2lmZGVmIElORkxBVEVfU1RSSUNUXG4gICAgICAgICAgICBpZiAoZGlzdCA+IGRtYXgpIHtcbiAgICAgICAgICAgICAgc3RybS5tc2cgPSAnaW52YWxpZCBkaXN0YW5jZSB0b28gZmFyIGJhY2snO1xuICAgICAgICAgICAgICBzdGF0ZS5tb2RlID0gQkFEO1xuICAgICAgICAgICAgICBicmVhayB0b3A7XG4gICAgICAgICAgICB9XG4vLyNlbmRpZlxuICAgICAgICAgICAgaG9sZCA+Pj49IG9wO1xuICAgICAgICAgICAgYml0cyAtPSBvcDtcbiAgICAgICAgICAgIC8vVHJhY2V2digoc3RkZXJyLCBcImluZmxhdGU6ICAgICAgICAgZGlzdGFuY2UgJXVcXG5cIiwgZGlzdCkpO1xuICAgICAgICAgICAgb3AgPSBfb3V0IC0gYmVnOyAgICAgICAgICAgICAgICAvKiBtYXggZGlzdGFuY2UgaW4gb3V0cHV0ICovXG4gICAgICAgICAgICBpZiAoZGlzdCA+IG9wKSB7ICAgICAgICAgICAgICAgIC8qIHNlZSBpZiBjb3B5IGZyb20gd2luZG93ICovXG4gICAgICAgICAgICAgIG9wID0gZGlzdCAtIG9wOyAgICAgICAgICAgICAgIC8qIGRpc3RhbmNlIGJhY2sgaW4gd2luZG93ICovXG4gICAgICAgICAgICAgIGlmIChvcCA+IHdoYXZlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXRlLnNhbmUpIHtcbiAgICAgICAgICAgICAgICAgIHN0cm0ubXNnID0gJ2ludmFsaWQgZGlzdGFuY2UgdG9vIGZhciBiYWNrJztcbiAgICAgICAgICAgICAgICAgIHN0YXRlLm1vZGUgPSBCQUQ7XG4gICAgICAgICAgICAgICAgICBicmVhayB0b3A7XG4gICAgICAgICAgICAgICAgfVxuXG4vLyAoISkgVGhpcyBibG9jayBpcyBkaXNhYmxlZCBpbiB6bGliIGRlZmFpbHRzLFxuLy8gZG9uJ3QgZW5hYmxlIGl0IGZvciBiaW5hcnkgY29tcGF0aWJpbGl0eVxuLy8jaWZkZWYgSU5GTEFURV9BTExPV19JTlZBTElEX0RJU1RBTkNFX1RPT0ZBUl9BUlJSXG4vLyAgICAgICAgICAgICAgICBpZiAobGVuIDw9IG9wIC0gd2hhdmUpIHtcbi8vICAgICAgICAgICAgICAgICAgZG8ge1xuLy8gICAgICAgICAgICAgICAgICAgIG91dHB1dFtfb3V0KytdID0gMDtcbi8vICAgICAgICAgICAgICAgICAgfSB3aGlsZSAoLS1sZW4pO1xuLy8gICAgICAgICAgICAgICAgICBjb250aW51ZSB0b3A7XG4vLyAgICAgICAgICAgICAgICB9XG4vLyAgICAgICAgICAgICAgICBsZW4gLT0gb3AgLSB3aGF2ZTtcbi8vICAgICAgICAgICAgICAgIGRvIHtcbi8vICAgICAgICAgICAgICAgICAgb3V0cHV0W19vdXQrK10gPSAwO1xuLy8gICAgICAgICAgICAgICAgfSB3aGlsZSAoLS1vcCA+IHdoYXZlKTtcbi8vICAgICAgICAgICAgICAgIGlmIChvcCA9PT0gMCkge1xuLy8gICAgICAgICAgICAgICAgICBmcm9tID0gX291dCAtIGRpc3Q7XG4vLyAgICAgICAgICAgICAgICAgIGRvIHtcbi8vICAgICAgICAgICAgICAgICAgICBvdXRwdXRbX291dCsrXSA9IG91dHB1dFtmcm9tKytdO1xuLy8gICAgICAgICAgICAgICAgICB9IHdoaWxlICgtLWxlbik7XG4vLyAgICAgICAgICAgICAgICAgIGNvbnRpbnVlIHRvcDtcbi8vICAgICAgICAgICAgICAgIH1cbi8vI2VuZGlmXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZnJvbSA9IDA7IC8vIHdpbmRvdyBpbmRleFxuICAgICAgICAgICAgICBmcm9tX3NvdXJjZSA9IHNfd2luZG93O1xuICAgICAgICAgICAgICBpZiAod25leHQgPT09IDApIHsgICAgICAgICAgIC8qIHZlcnkgY29tbW9uIGNhc2UgKi9cbiAgICAgICAgICAgICAgICBmcm9tICs9IHdzaXplIC0gb3A7XG4gICAgICAgICAgICAgICAgaWYgKG9wIDwgbGVuKSB7ICAgICAgICAgLyogc29tZSBmcm9tIHdpbmRvdyAqL1xuICAgICAgICAgICAgICAgICAgbGVuIC09IG9wO1xuICAgICAgICAgICAgICAgICAgZG8ge1xuICAgICAgICAgICAgICAgICAgICBvdXRwdXRbX291dCsrXSA9IHNfd2luZG93W2Zyb20rK107XG4gICAgICAgICAgICAgICAgICB9IHdoaWxlICgtLW9wKTtcbiAgICAgICAgICAgICAgICAgIGZyb20gPSBfb3V0IC0gZGlzdDsgIC8qIHJlc3QgZnJvbSBvdXRwdXQgKi9cbiAgICAgICAgICAgICAgICAgIGZyb21fc291cmNlID0gb3V0cHV0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBlbHNlIGlmICh3bmV4dCA8IG9wKSB7ICAgICAgLyogd3JhcCBhcm91bmQgd2luZG93ICovXG4gICAgICAgICAgICAgICAgZnJvbSArPSB3c2l6ZSArIHduZXh0IC0gb3A7XG4gICAgICAgICAgICAgICAgb3AgLT0gd25leHQ7XG4gICAgICAgICAgICAgICAgaWYgKG9wIDwgbGVuKSB7ICAgICAgICAgLyogc29tZSBmcm9tIGVuZCBvZiB3aW5kb3cgKi9cbiAgICAgICAgICAgICAgICAgIGxlbiAtPSBvcDtcbiAgICAgICAgICAgICAgICAgIGRvIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0W19vdXQrK10gPSBzX3dpbmRvd1tmcm9tKytdO1xuICAgICAgICAgICAgICAgICAgfSB3aGlsZSAoLS1vcCk7XG4gICAgICAgICAgICAgICAgICBmcm9tID0gMDtcbiAgICAgICAgICAgICAgICAgIGlmICh3bmV4dCA8IGxlbikgeyAgLyogc29tZSBmcm9tIHN0YXJ0IG9mIHdpbmRvdyAqL1xuICAgICAgICAgICAgICAgICAgICBvcCA9IHduZXh0O1xuICAgICAgICAgICAgICAgICAgICBsZW4gLT0gb3A7XG4gICAgICAgICAgICAgICAgICAgIGRvIHtcbiAgICAgICAgICAgICAgICAgICAgICBvdXRwdXRbX291dCsrXSA9IHNfd2luZG93W2Zyb20rK107XG4gICAgICAgICAgICAgICAgICAgIH0gd2hpbGUgKC0tb3ApO1xuICAgICAgICAgICAgICAgICAgICBmcm9tID0gX291dCAtIGRpc3Q7ICAgICAgLyogcmVzdCBmcm9tIG91dHB1dCAqL1xuICAgICAgICAgICAgICAgICAgICBmcm9tX3NvdXJjZSA9IG91dHB1dDtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxzZSB7ICAgICAgICAgICAgICAgICAgICAgIC8qIGNvbnRpZ3VvdXMgaW4gd2luZG93ICovXG4gICAgICAgICAgICAgICAgZnJvbSArPSB3bmV4dCAtIG9wO1xuICAgICAgICAgICAgICAgIGlmIChvcCA8IGxlbikgeyAgICAgICAgIC8qIHNvbWUgZnJvbSB3aW5kb3cgKi9cbiAgICAgICAgICAgICAgICAgIGxlbiAtPSBvcDtcbiAgICAgICAgICAgICAgICAgIGRvIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0W19vdXQrK10gPSBzX3dpbmRvd1tmcm9tKytdO1xuICAgICAgICAgICAgICAgICAgfSB3aGlsZSAoLS1vcCk7XG4gICAgICAgICAgICAgICAgICBmcm9tID0gX291dCAtIGRpc3Q7ICAvKiByZXN0IGZyb20gb3V0cHV0ICovXG4gICAgICAgICAgICAgICAgICBmcm9tX3NvdXJjZSA9IG91dHB1dDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgd2hpbGUgKGxlbiA+IDIpIHtcbiAgICAgICAgICAgICAgICBvdXRwdXRbX291dCsrXSA9IGZyb21fc291cmNlW2Zyb20rK107XG4gICAgICAgICAgICAgICAgb3V0cHV0W19vdXQrK10gPSBmcm9tX3NvdXJjZVtmcm9tKytdO1xuICAgICAgICAgICAgICAgIG91dHB1dFtfb3V0KytdID0gZnJvbV9zb3VyY2VbZnJvbSsrXTtcbiAgICAgICAgICAgICAgICBsZW4gLT0gMztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAobGVuKSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0W19vdXQrK10gPSBmcm9tX3NvdXJjZVtmcm9tKytdO1xuICAgICAgICAgICAgICAgIGlmIChsZW4gPiAxKSB7XG4gICAgICAgICAgICAgICAgICBvdXRwdXRbX291dCsrXSA9IGZyb21fc291cmNlW2Zyb20rK107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZnJvbSA9IF9vdXQgLSBkaXN0OyAgICAgICAgICAvKiBjb3B5IGRpcmVjdCBmcm9tIG91dHB1dCAqL1xuICAgICAgICAgICAgICBkbyB7ICAgICAgICAgICAgICAgICAgICAgICAgLyogbWluaW11bSBsZW5ndGggaXMgdGhyZWUgKi9cbiAgICAgICAgICAgICAgICBvdXRwdXRbX291dCsrXSA9IG91dHB1dFtmcm9tKytdO1xuICAgICAgICAgICAgICAgIG91dHB1dFtfb3V0KytdID0gb3V0cHV0W2Zyb20rK107XG4gICAgICAgICAgICAgICAgb3V0cHV0W19vdXQrK10gPSBvdXRwdXRbZnJvbSsrXTtcbiAgICAgICAgICAgICAgICBsZW4gLT0gMztcbiAgICAgICAgICAgICAgfSB3aGlsZSAobGVuID4gMik7XG4gICAgICAgICAgICAgIGlmIChsZW4pIHtcbiAgICAgICAgICAgICAgICBvdXRwdXRbX291dCsrXSA9IG91dHB1dFtmcm9tKytdO1xuICAgICAgICAgICAgICAgIGlmIChsZW4gPiAxKSB7XG4gICAgICAgICAgICAgICAgICBvdXRwdXRbX291dCsrXSA9IG91dHB1dFtmcm9tKytdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIGlmICgob3AgJiA2NCkgPT09IDApIHsgICAgICAgICAgLyogMm5kIGxldmVsIGRpc3RhbmNlIGNvZGUgKi9cbiAgICAgICAgICAgIGhlcmUgPSBkY29kZVsoaGVyZSAmIDB4ZmZmZikvKmhlcmUudmFsKi8gKyAoaG9sZCAmICgoMSA8PCBvcCkgLSAxKSldO1xuICAgICAgICAgICAgY29udGludWUgZG9kaXN0O1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHN0cm0ubXNnID0gJ2ludmFsaWQgZGlzdGFuY2UgY29kZSc7XG4gICAgICAgICAgICBzdGF0ZS5tb2RlID0gQkFEO1xuICAgICAgICAgICAgYnJlYWsgdG9wO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGJyZWFrOyAvLyBuZWVkIHRvIGVtdWxhdGUgZ290byB2aWEgXCJjb250aW51ZVwiXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKChvcCAmIDY0KSA9PT0gMCkgeyAgICAgICAgICAgICAgLyogMm5kIGxldmVsIGxlbmd0aCBjb2RlICovXG4gICAgICAgIGhlcmUgPSBsY29kZVsoaGVyZSAmIDB4ZmZmZikvKmhlcmUudmFsKi8gKyAoaG9sZCAmICgoMSA8PCBvcCkgLSAxKSldO1xuICAgICAgICBjb250aW51ZSBkb2xlbjtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKG9wICYgMzIpIHsgICAgICAgICAgICAgICAgICAgICAvKiBlbmQtb2YtYmxvY2sgKi9cbiAgICAgICAgLy9UcmFjZXZ2KChzdGRlcnIsIFwiaW5mbGF0ZTogICAgICAgICBlbmQgb2YgYmxvY2tcXG5cIikpO1xuICAgICAgICBzdGF0ZS5tb2RlID0gVFlQRTtcbiAgICAgICAgYnJlYWsgdG9wO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHN0cm0ubXNnID0gJ2ludmFsaWQgbGl0ZXJhbC9sZW5ndGggY29kZSc7XG4gICAgICAgIHN0YXRlLm1vZGUgPSBCQUQ7XG4gICAgICAgIGJyZWFrIHRvcDtcbiAgICAgIH1cblxuICAgICAgYnJlYWs7IC8vIG5lZWQgdG8gZW11bGF0ZSBnb3RvIHZpYSBcImNvbnRpbnVlXCJcbiAgICB9XG4gIH0gd2hpbGUgKF9pbiA8IGxhc3QgJiYgX291dCA8IGVuZCk7XG5cbiAgLyogcmV0dXJuIHVudXNlZCBieXRlcyAob24gZW50cnksIGJpdHMgPCA4LCBzbyBpbiB3b24ndCBnbyB0b28gZmFyIGJhY2spICovXG4gIGxlbiA9IGJpdHMgPj4gMztcbiAgX2luIC09IGxlbjtcbiAgYml0cyAtPSBsZW4gPDwgMztcbiAgaG9sZCAmPSAoMSA8PCBiaXRzKSAtIDE7XG5cbiAgLyogdXBkYXRlIHN0YXRlIGFuZCByZXR1cm4gKi9cbiAgc3RybS5uZXh0X2luID0gX2luO1xuICBzdHJtLm5leHRfb3V0ID0gX291dDtcbiAgc3RybS5hdmFpbF9pbiA9IChfaW4gPCBsYXN0ID8gNSArIChsYXN0IC0gX2luKSA6IDUgLSAoX2luIC0gbGFzdCkpO1xuICBzdHJtLmF2YWlsX291dCA9IChfb3V0IDwgZW5kID8gMjU3ICsgKGVuZCAtIF9vdXQpIDogMjU3IC0gKF9vdXQgLSBlbmQpKTtcbiAgc3RhdGUuaG9sZCA9IGhvbGQ7XG4gIHN0YXRlLmJpdHMgPSBiaXRzO1xuICByZXR1cm47XG59O1xuXG59LHt9XSw0OTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG5cbi8vIChDKSAxOTk1LTIwMTMgSmVhbi1sb3VwIEdhaWxseSBhbmQgTWFyayBBZGxlclxuLy8gKEMpIDIwMTQtMjAxNyBWaXRhbHkgUHV6cmluIGFuZCBBbmRyZXkgVHVwaXRzaW5cbi8vXG4vLyBUaGlzIHNvZnR3YXJlIGlzIHByb3ZpZGVkICdhcy1pcycsIHdpdGhvdXQgYW55IGV4cHJlc3Mgb3IgaW1wbGllZFxuLy8gd2FycmFudHkuIEluIG5vIGV2ZW50IHdpbGwgdGhlIGF1dGhvcnMgYmUgaGVsZCBsaWFibGUgZm9yIGFueSBkYW1hZ2VzXG4vLyBhcmlzaW5nIGZyb20gdGhlIHVzZSBvZiB0aGlzIHNvZnR3YXJlLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgZ3JhbnRlZCB0byBhbnlvbmUgdG8gdXNlIHRoaXMgc29mdHdhcmUgZm9yIGFueSBwdXJwb3NlLFxuLy8gaW5jbHVkaW5nIGNvbW1lcmNpYWwgYXBwbGljYXRpb25zLCBhbmQgdG8gYWx0ZXIgaXQgYW5kIHJlZGlzdHJpYnV0ZSBpdFxuLy8gZnJlZWx5LCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgcmVzdHJpY3Rpb25zOlxuLy9cbi8vIDEuIFRoZSBvcmlnaW4gb2YgdGhpcyBzb2Z0d2FyZSBtdXN0IG5vdCBiZSBtaXNyZXByZXNlbnRlZDsgeW91IG11c3Qgbm90XG4vLyAgIGNsYWltIHRoYXQgeW91IHdyb3RlIHRoZSBvcmlnaW5hbCBzb2Z0d2FyZS4gSWYgeW91IHVzZSB0aGlzIHNvZnR3YXJlXG4vLyAgIGluIGEgcHJvZHVjdCwgYW4gYWNrbm93bGVkZ21lbnQgaW4gdGhlIHByb2R1Y3QgZG9jdW1lbnRhdGlvbiB3b3VsZCBiZVxuLy8gICBhcHByZWNpYXRlZCBidXQgaXMgbm90IHJlcXVpcmVkLlxuLy8gMi4gQWx0ZXJlZCBzb3VyY2UgdmVyc2lvbnMgbXVzdCBiZSBwbGFpbmx5IG1hcmtlZCBhcyBzdWNoLCBhbmQgbXVzdCBub3QgYmVcbi8vICAgbWlzcmVwcmVzZW50ZWQgYXMgYmVpbmcgdGhlIG9yaWdpbmFsIHNvZnR3YXJlLlxuLy8gMy4gVGhpcyBub3RpY2UgbWF5IG5vdCBiZSByZW1vdmVkIG9yIGFsdGVyZWQgZnJvbSBhbnkgc291cmNlIGRpc3RyaWJ1dGlvbi5cblxudmFyIHV0aWxzICAgICAgICAgPSByZXF1aXJlKCcuLi91dGlscy9jb21tb24nKTtcbnZhciBhZGxlcjMyICAgICAgID0gcmVxdWlyZSgnLi9hZGxlcjMyJyk7XG52YXIgY3JjMzIgICAgICAgICA9IHJlcXVpcmUoJy4vY3JjMzInKTtcbnZhciBpbmZsYXRlX2Zhc3QgID0gcmVxdWlyZSgnLi9pbmZmYXN0Jyk7XG52YXIgaW5mbGF0ZV90YWJsZSA9IHJlcXVpcmUoJy4vaW5mdHJlZXMnKTtcblxudmFyIENPREVTID0gMDtcbnZhciBMRU5TID0gMTtcbnZhciBESVNUUyA9IDI7XG5cbi8qIFB1YmxpYyBjb25zdGFudHMgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSovXG4vKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0qL1xuXG5cbi8qIEFsbG93ZWQgZmx1c2ggdmFsdWVzOyBzZWUgZGVmbGF0ZSgpIGFuZCBpbmZsYXRlKCkgYmVsb3cgZm9yIGRldGFpbHMgKi9cbi8vdmFyIFpfTk9fRkxVU0ggICAgICA9IDA7XG4vL3ZhciBaX1BBUlRJQUxfRkxVU0ggPSAxO1xuLy92YXIgWl9TWU5DX0ZMVVNIICAgID0gMjtcbi8vdmFyIFpfRlVMTF9GTFVTSCAgICA9IDM7XG52YXIgWl9GSU5JU0ggICAgICAgID0gNDtcbnZhciBaX0JMT0NLICAgICAgICAgPSA1O1xudmFyIFpfVFJFRVMgICAgICAgICA9IDY7XG5cblxuLyogUmV0dXJuIGNvZGVzIGZvciB0aGUgY29tcHJlc3Npb24vZGVjb21wcmVzc2lvbiBmdW5jdGlvbnMuIE5lZ2F0aXZlIHZhbHVlc1xuICogYXJlIGVycm9ycywgcG9zaXRpdmUgdmFsdWVzIGFyZSB1c2VkIGZvciBzcGVjaWFsIGJ1dCBub3JtYWwgZXZlbnRzLlxuICovXG52YXIgWl9PSyAgICAgICAgICAgID0gMDtcbnZhciBaX1NUUkVBTV9FTkQgICAgPSAxO1xudmFyIFpfTkVFRF9ESUNUICAgICA9IDI7XG4vL3ZhciBaX0VSUk5PICAgICAgICAgPSAtMTtcbnZhciBaX1NUUkVBTV9FUlJPUiAgPSAtMjtcbnZhciBaX0RBVEFfRVJST1IgICAgPSAtMztcbnZhciBaX01FTV9FUlJPUiAgICAgPSAtNDtcbnZhciBaX0JVRl9FUlJPUiAgICAgPSAtNTtcbi8vdmFyIFpfVkVSU0lPTl9FUlJPUiA9IC02O1xuXG4vKiBUaGUgZGVmbGF0ZSBjb21wcmVzc2lvbiBtZXRob2QgKi9cbnZhciBaX0RFRkxBVEVEICA9IDg7XG5cblxuLyogU1RBVEVTID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09Ki9cbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSovXG5cblxudmFyICAgIEhFQUQgPSAxOyAgICAgICAvKiBpOiB3YWl0aW5nIGZvciBtYWdpYyBoZWFkZXIgKi9cbnZhciAgICBGTEFHUyA9IDI7ICAgICAgLyogaTogd2FpdGluZyBmb3IgbWV0aG9kIGFuZCBmbGFncyAoZ3ppcCkgKi9cbnZhciAgICBUSU1FID0gMzsgICAgICAgLyogaTogd2FpdGluZyBmb3IgbW9kaWZpY2F0aW9uIHRpbWUgKGd6aXApICovXG52YXIgICAgT1MgPSA0OyAgICAgICAgIC8qIGk6IHdhaXRpbmcgZm9yIGV4dHJhIGZsYWdzIGFuZCBvcGVyYXRpbmcgc3lzdGVtIChnemlwKSAqL1xudmFyICAgIEVYTEVOID0gNTsgICAgICAvKiBpOiB3YWl0aW5nIGZvciBleHRyYSBsZW5ndGggKGd6aXApICovXG52YXIgICAgRVhUUkEgPSA2OyAgICAgIC8qIGk6IHdhaXRpbmcgZm9yIGV4dHJhIGJ5dGVzIChnemlwKSAqL1xudmFyICAgIE5BTUUgPSA3OyAgICAgICAvKiBpOiB3YWl0aW5nIGZvciBlbmQgb2YgZmlsZSBuYW1lIChnemlwKSAqL1xudmFyICAgIENPTU1FTlQgPSA4OyAgICAvKiBpOiB3YWl0aW5nIGZvciBlbmQgb2YgY29tbWVudCAoZ3ppcCkgKi9cbnZhciAgICBIQ1JDID0gOTsgICAgICAgLyogaTogd2FpdGluZyBmb3IgaGVhZGVyIGNyYyAoZ3ppcCkgKi9cbnZhciAgICBESUNUSUQgPSAxMDsgICAgLyogaTogd2FpdGluZyBmb3IgZGljdGlvbmFyeSBjaGVjayB2YWx1ZSAqL1xudmFyICAgIERJQ1QgPSAxMTsgICAgICAvKiB3YWl0aW5nIGZvciBpbmZsYXRlU2V0RGljdGlvbmFyeSgpIGNhbGwgKi9cbnZhciAgICAgICAgVFlQRSA9IDEyOyAgICAgIC8qIGk6IHdhaXRpbmcgZm9yIHR5cGUgYml0cywgaW5jbHVkaW5nIGxhc3QtZmxhZyBiaXQgKi9cbnZhciAgICAgICAgVFlQRURPID0gMTM7ICAgIC8qIGk6IHNhbWUsIGJ1dCBza2lwIGNoZWNrIHRvIGV4aXQgaW5mbGF0ZSBvbiBuZXcgYmxvY2sgKi9cbnZhciAgICAgICAgU1RPUkVEID0gMTQ7ICAgIC8qIGk6IHdhaXRpbmcgZm9yIHN0b3JlZCBzaXplIChsZW5ndGggYW5kIGNvbXBsZW1lbnQpICovXG52YXIgICAgICAgIENPUFlfID0gMTU7ICAgICAvKiBpL286IHNhbWUgYXMgQ09QWSBiZWxvdywgYnV0IG9ubHkgZmlyc3QgdGltZSBpbiAqL1xudmFyICAgICAgICBDT1BZID0gMTY7ICAgICAgLyogaS9vOiB3YWl0aW5nIGZvciBpbnB1dCBvciBvdXRwdXQgdG8gY29weSBzdG9yZWQgYmxvY2sgKi9cbnZhciAgICAgICAgVEFCTEUgPSAxNzsgICAgIC8qIGk6IHdhaXRpbmcgZm9yIGR5bmFtaWMgYmxvY2sgdGFibGUgbGVuZ3RocyAqL1xudmFyICAgICAgICBMRU5MRU5TID0gMTg7ICAgLyogaTogd2FpdGluZyBmb3IgY29kZSBsZW5ndGggY29kZSBsZW5ndGhzICovXG52YXIgICAgICAgIENPREVMRU5TID0gMTk7ICAvKiBpOiB3YWl0aW5nIGZvciBsZW5ndGgvbGl0IGFuZCBkaXN0YW5jZSBjb2RlIGxlbmd0aHMgKi9cbnZhciAgICAgICAgICAgIExFTl8gPSAyMDsgICAgICAvKiBpOiBzYW1lIGFzIExFTiBiZWxvdywgYnV0IG9ubHkgZmlyc3QgdGltZSBpbiAqL1xudmFyICAgICAgICAgICAgTEVOID0gMjE7ICAgICAgIC8qIGk6IHdhaXRpbmcgZm9yIGxlbmd0aC9saXQvZW9iIGNvZGUgKi9cbnZhciAgICAgICAgICAgIExFTkVYVCA9IDIyOyAgICAvKiBpOiB3YWl0aW5nIGZvciBsZW5ndGggZXh0cmEgYml0cyAqL1xudmFyICAgICAgICAgICAgRElTVCA9IDIzOyAgICAgIC8qIGk6IHdhaXRpbmcgZm9yIGRpc3RhbmNlIGNvZGUgKi9cbnZhciAgICAgICAgICAgIERJU1RFWFQgPSAyNDsgICAvKiBpOiB3YWl0aW5nIGZvciBkaXN0YW5jZSBleHRyYSBiaXRzICovXG52YXIgICAgICAgICAgICBNQVRDSCA9IDI1OyAgICAgLyogbzogd2FpdGluZyBmb3Igb3V0cHV0IHNwYWNlIHRvIGNvcHkgc3RyaW5nICovXG52YXIgICAgICAgICAgICBMSVQgPSAyNjsgICAgICAgLyogbzogd2FpdGluZyBmb3Igb3V0cHV0IHNwYWNlIHRvIHdyaXRlIGxpdGVyYWwgKi9cbnZhciAgICBDSEVDSyA9IDI3OyAgICAgLyogaTogd2FpdGluZyBmb3IgMzItYml0IGNoZWNrIHZhbHVlICovXG52YXIgICAgTEVOR1RIID0gMjg7ICAgIC8qIGk6IHdhaXRpbmcgZm9yIDMyLWJpdCBsZW5ndGggKGd6aXApICovXG52YXIgICAgRE9ORSA9IDI5OyAgICAgIC8qIGZpbmlzaGVkIGNoZWNrLCBkb25lIC0tIHJlbWFpbiBoZXJlIHVudGlsIHJlc2V0ICovXG52YXIgICAgQkFEID0gMzA7ICAgICAgIC8qIGdvdCBhIGRhdGEgZXJyb3IgLS0gcmVtYWluIGhlcmUgdW50aWwgcmVzZXQgKi9cbnZhciAgICBNRU0gPSAzMTsgICAgICAgLyogZ290IGFuIGluZmxhdGUoKSBtZW1vcnkgZXJyb3IgLS0gcmVtYWluIGhlcmUgdW50aWwgcmVzZXQgKi9cbnZhciAgICBTWU5DID0gMzI7ICAgICAgLyogbG9va2luZyBmb3Igc3luY2hyb25pemF0aW9uIGJ5dGVzIHRvIHJlc3RhcnQgaW5mbGF0ZSgpICovXG5cbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSovXG5cblxuXG52YXIgRU5PVUdIX0xFTlMgPSA4NTI7XG52YXIgRU5PVUdIX0RJU1RTID0gNTkyO1xuLy92YXIgRU5PVUdIID0gIChFTk9VR0hfTEVOUytFTk9VR0hfRElTVFMpO1xuXG52YXIgTUFYX1dCSVRTID0gMTU7XG4vKiAzMksgTFo3NyB3aW5kb3cgKi9cbnZhciBERUZfV0JJVFMgPSBNQVhfV0JJVFM7XG5cblxuZnVuY3Rpb24genN3YXAzMihxKSB7XG4gIHJldHVybiAgKCgocSA+Pj4gMjQpICYgMHhmZikgK1xuICAgICAgICAgICgocSA+Pj4gOCkgJiAweGZmMDApICtcbiAgICAgICAgICAoKHEgJiAweGZmMDApIDw8IDgpICtcbiAgICAgICAgICAoKHEgJiAweGZmKSA8PCAyNCkpO1xufVxuXG5cbmZ1bmN0aW9uIEluZmxhdGVTdGF0ZSgpIHtcbiAgdGhpcy5tb2RlID0gMDsgICAgICAgICAgICAgLyogY3VycmVudCBpbmZsYXRlIG1vZGUgKi9cbiAgdGhpcy5sYXN0ID0gZmFsc2U7ICAgICAgICAgIC8qIHRydWUgaWYgcHJvY2Vzc2luZyBsYXN0IGJsb2NrICovXG4gIHRoaXMud3JhcCA9IDA7ICAgICAgICAgICAgICAvKiBiaXQgMCB0cnVlIGZvciB6bGliLCBiaXQgMSB0cnVlIGZvciBnemlwICovXG4gIHRoaXMuaGF2ZWRpY3QgPSBmYWxzZTsgICAgICAvKiB0cnVlIGlmIGRpY3Rpb25hcnkgcHJvdmlkZWQgKi9cbiAgdGhpcy5mbGFncyA9IDA7ICAgICAgICAgICAgIC8qIGd6aXAgaGVhZGVyIG1ldGhvZCBhbmQgZmxhZ3MgKDAgaWYgemxpYikgKi9cbiAgdGhpcy5kbWF4ID0gMDsgICAgICAgICAgICAgIC8qIHpsaWIgaGVhZGVyIG1heCBkaXN0YW5jZSAoSU5GTEFURV9TVFJJQ1QpICovXG4gIHRoaXMuY2hlY2sgPSAwOyAgICAgICAgICAgICAvKiBwcm90ZWN0ZWQgY29weSBvZiBjaGVjayB2YWx1ZSAqL1xuICB0aGlzLnRvdGFsID0gMDsgICAgICAgICAgICAgLyogcHJvdGVjdGVkIGNvcHkgb2Ygb3V0cHV0IGNvdW50ICovXG4gIC8vIFRPRE86IG1heSBiZSB7fVxuICB0aGlzLmhlYWQgPSBudWxsOyAgICAgICAgICAgLyogd2hlcmUgdG8gc2F2ZSBnemlwIGhlYWRlciBpbmZvcm1hdGlvbiAqL1xuXG4gIC8qIHNsaWRpbmcgd2luZG93ICovXG4gIHRoaXMud2JpdHMgPSAwOyAgICAgICAgICAgICAvKiBsb2cgYmFzZSAyIG9mIHJlcXVlc3RlZCB3aW5kb3cgc2l6ZSAqL1xuICB0aGlzLndzaXplID0gMDsgICAgICAgICAgICAgLyogd2luZG93IHNpemUgb3IgemVybyBpZiBub3QgdXNpbmcgd2luZG93ICovXG4gIHRoaXMud2hhdmUgPSAwOyAgICAgICAgICAgICAvKiB2YWxpZCBieXRlcyBpbiB0aGUgd2luZG93ICovXG4gIHRoaXMud25leHQgPSAwOyAgICAgICAgICAgICAvKiB3aW5kb3cgd3JpdGUgaW5kZXggKi9cbiAgdGhpcy53aW5kb3cgPSBudWxsOyAgICAgICAgIC8qIGFsbG9jYXRlZCBzbGlkaW5nIHdpbmRvdywgaWYgbmVlZGVkICovXG5cbiAgLyogYml0IGFjY3VtdWxhdG9yICovXG4gIHRoaXMuaG9sZCA9IDA7ICAgICAgICAgICAgICAvKiBpbnB1dCBiaXQgYWNjdW11bGF0b3IgKi9cbiAgdGhpcy5iaXRzID0gMDsgICAgICAgICAgICAgIC8qIG51bWJlciBvZiBiaXRzIGluIFwiaW5cIiAqL1xuXG4gIC8qIGZvciBzdHJpbmcgYW5kIHN0b3JlZCBibG9jayBjb3B5aW5nICovXG4gIHRoaXMubGVuZ3RoID0gMDsgICAgICAgICAgICAvKiBsaXRlcmFsIG9yIGxlbmd0aCBvZiBkYXRhIHRvIGNvcHkgKi9cbiAgdGhpcy5vZmZzZXQgPSAwOyAgICAgICAgICAgIC8qIGRpc3RhbmNlIGJhY2sgdG8gY29weSBzdHJpbmcgZnJvbSAqL1xuXG4gIC8qIGZvciB0YWJsZSBhbmQgY29kZSBkZWNvZGluZyAqL1xuICB0aGlzLmV4dHJhID0gMDsgICAgICAgICAgICAgLyogZXh0cmEgYml0cyBuZWVkZWQgKi9cblxuICAvKiBmaXhlZCBhbmQgZHluYW1pYyBjb2RlIHRhYmxlcyAqL1xuICB0aGlzLmxlbmNvZGUgPSBudWxsOyAgICAgICAgICAvKiBzdGFydGluZyB0YWJsZSBmb3IgbGVuZ3RoL2xpdGVyYWwgY29kZXMgKi9cbiAgdGhpcy5kaXN0Y29kZSA9IG51bGw7ICAgICAgICAgLyogc3RhcnRpbmcgdGFibGUgZm9yIGRpc3RhbmNlIGNvZGVzICovXG4gIHRoaXMubGVuYml0cyA9IDA7ICAgICAgICAgICAvKiBpbmRleCBiaXRzIGZvciBsZW5jb2RlICovXG4gIHRoaXMuZGlzdGJpdHMgPSAwOyAgICAgICAgICAvKiBpbmRleCBiaXRzIGZvciBkaXN0Y29kZSAqL1xuXG4gIC8qIGR5bmFtaWMgdGFibGUgYnVpbGRpbmcgKi9cbiAgdGhpcy5uY29kZSA9IDA7ICAgICAgICAgICAgIC8qIG51bWJlciBvZiBjb2RlIGxlbmd0aCBjb2RlIGxlbmd0aHMgKi9cbiAgdGhpcy5ubGVuID0gMDsgICAgICAgICAgICAgIC8qIG51bWJlciBvZiBsZW5ndGggY29kZSBsZW5ndGhzICovXG4gIHRoaXMubmRpc3QgPSAwOyAgICAgICAgICAgICAvKiBudW1iZXIgb2YgZGlzdGFuY2UgY29kZSBsZW5ndGhzICovXG4gIHRoaXMuaGF2ZSA9IDA7ICAgICAgICAgICAgICAvKiBudW1iZXIgb2YgY29kZSBsZW5ndGhzIGluIGxlbnNbXSAqL1xuICB0aGlzLm5leHQgPSBudWxsOyAgICAgICAgICAgICAgLyogbmV4dCBhdmFpbGFibGUgc3BhY2UgaW4gY29kZXNbXSAqL1xuXG4gIHRoaXMubGVucyA9IG5ldyB1dGlscy5CdWYxNigzMjApOyAvKiB0ZW1wb3Jhcnkgc3RvcmFnZSBmb3IgY29kZSBsZW5ndGhzICovXG4gIHRoaXMud29yayA9IG5ldyB1dGlscy5CdWYxNigyODgpOyAvKiB3b3JrIGFyZWEgZm9yIGNvZGUgdGFibGUgYnVpbGRpbmcgKi9cblxuICAvKlxuICAgYmVjYXVzZSB3ZSBkb24ndCBoYXZlIHBvaW50ZXJzIGluIGpzLCB3ZSB1c2UgbGVuY29kZSBhbmQgZGlzdGNvZGUgZGlyZWN0bHlcbiAgIGFzIGJ1ZmZlcnMgc28gd2UgZG9uJ3QgbmVlZCBjb2Rlc1xuICAqL1xuICAvL3RoaXMuY29kZXMgPSBuZXcgdXRpbHMuQnVmMzIoRU5PVUdIKTsgICAgICAgLyogc3BhY2UgZm9yIGNvZGUgdGFibGVzICovXG4gIHRoaXMubGVuZHluID0gbnVsbDsgICAgICAgICAgICAgIC8qIGR5bmFtaWMgdGFibGUgZm9yIGxlbmd0aC9saXRlcmFsIGNvZGVzIChKUyBzcGVjaWZpYykgKi9cbiAgdGhpcy5kaXN0ZHluID0gbnVsbDsgICAgICAgICAgICAgLyogZHluYW1pYyB0YWJsZSBmb3IgZGlzdGFuY2UgY29kZXMgKEpTIHNwZWNpZmljKSAqL1xuICB0aGlzLnNhbmUgPSAwOyAgICAgICAgICAgICAgICAgICAvKiBpZiBmYWxzZSwgYWxsb3cgaW52YWxpZCBkaXN0YW5jZSB0b28gZmFyICovXG4gIHRoaXMuYmFjayA9IDA7ICAgICAgICAgICAgICAgICAgIC8qIGJpdHMgYmFjayBvZiBsYXN0IHVucHJvY2Vzc2VkIGxlbmd0aC9saXQgKi9cbiAgdGhpcy53YXMgPSAwOyAgICAgICAgICAgICAgICAgICAgLyogaW5pdGlhbCBsZW5ndGggb2YgbWF0Y2ggKi9cbn1cblxuZnVuY3Rpb24gaW5mbGF0ZVJlc2V0S2VlcChzdHJtKSB7XG4gIHZhciBzdGF0ZTtcblxuICBpZiAoIXN0cm0gfHwgIXN0cm0uc3RhdGUpIHsgcmV0dXJuIFpfU1RSRUFNX0VSUk9SOyB9XG4gIHN0YXRlID0gc3RybS5zdGF0ZTtcbiAgc3RybS50b3RhbF9pbiA9IHN0cm0udG90YWxfb3V0ID0gc3RhdGUudG90YWwgPSAwO1xuICBzdHJtLm1zZyA9ICcnOyAvKlpfTlVMTCovXG4gIGlmIChzdGF0ZS53cmFwKSB7ICAgICAgIC8qIHRvIHN1cHBvcnQgaWxsLWNvbmNlaXZlZCBKYXZhIHRlc3Qgc3VpdGUgKi9cbiAgICBzdHJtLmFkbGVyID0gc3RhdGUud3JhcCAmIDE7XG4gIH1cbiAgc3RhdGUubW9kZSA9IEhFQUQ7XG4gIHN0YXRlLmxhc3QgPSAwO1xuICBzdGF0ZS5oYXZlZGljdCA9IDA7XG4gIHN0YXRlLmRtYXggPSAzMjc2ODtcbiAgc3RhdGUuaGVhZCA9IG51bGwvKlpfTlVMTCovO1xuICBzdGF0ZS5ob2xkID0gMDtcbiAgc3RhdGUuYml0cyA9IDA7XG4gIC8vc3RhdGUubGVuY29kZSA9IHN0YXRlLmRpc3Rjb2RlID0gc3RhdGUubmV4dCA9IHN0YXRlLmNvZGVzO1xuICBzdGF0ZS5sZW5jb2RlID0gc3RhdGUubGVuZHluID0gbmV3IHV0aWxzLkJ1ZjMyKEVOT1VHSF9MRU5TKTtcbiAgc3RhdGUuZGlzdGNvZGUgPSBzdGF0ZS5kaXN0ZHluID0gbmV3IHV0aWxzLkJ1ZjMyKEVOT1VHSF9ESVNUUyk7XG5cbiAgc3RhdGUuc2FuZSA9IDE7XG4gIHN0YXRlLmJhY2sgPSAtMTtcbiAgLy9UcmFjZXYoKHN0ZGVyciwgXCJpbmZsYXRlOiByZXNldFxcblwiKSk7XG4gIHJldHVybiBaX09LO1xufVxuXG5mdW5jdGlvbiBpbmZsYXRlUmVzZXQoc3RybSkge1xuICB2YXIgc3RhdGU7XG5cbiAgaWYgKCFzdHJtIHx8ICFzdHJtLnN0YXRlKSB7IHJldHVybiBaX1NUUkVBTV9FUlJPUjsgfVxuICBzdGF0ZSA9IHN0cm0uc3RhdGU7XG4gIHN0YXRlLndzaXplID0gMDtcbiAgc3RhdGUud2hhdmUgPSAwO1xuICBzdGF0ZS53bmV4dCA9IDA7XG4gIHJldHVybiBpbmZsYXRlUmVzZXRLZWVwKHN0cm0pO1xuXG59XG5cbmZ1bmN0aW9uIGluZmxhdGVSZXNldDIoc3RybSwgd2luZG93Qml0cykge1xuICB2YXIgd3JhcDtcbiAgdmFyIHN0YXRlO1xuXG4gIC8qIGdldCB0aGUgc3RhdGUgKi9cbiAgaWYgKCFzdHJtIHx8ICFzdHJtLnN0YXRlKSB7IHJldHVybiBaX1NUUkVBTV9FUlJPUjsgfVxuICBzdGF0ZSA9IHN0cm0uc3RhdGU7XG5cbiAgLyogZXh0cmFjdCB3cmFwIHJlcXVlc3QgZnJvbSB3aW5kb3dCaXRzIHBhcmFtZXRlciAqL1xuICBpZiAod2luZG93Qml0cyA8IDApIHtcbiAgICB3cmFwID0gMDtcbiAgICB3aW5kb3dCaXRzID0gLXdpbmRvd0JpdHM7XG4gIH1cbiAgZWxzZSB7XG4gICAgd3JhcCA9ICh3aW5kb3dCaXRzID4+IDQpICsgMTtcbiAgICBpZiAod2luZG93Qml0cyA8IDQ4KSB7XG4gICAgICB3aW5kb3dCaXRzICY9IDE1O1xuICAgIH1cbiAgfVxuXG4gIC8qIHNldCBudW1iZXIgb2Ygd2luZG93IGJpdHMsIGZyZWUgd2luZG93IGlmIGRpZmZlcmVudCAqL1xuICBpZiAod2luZG93Qml0cyAmJiAod2luZG93Qml0cyA8IDggfHwgd2luZG93Qml0cyA+IDE1KSkge1xuICAgIHJldHVybiBaX1NUUkVBTV9FUlJPUjtcbiAgfVxuICBpZiAoc3RhdGUud2luZG93ICE9PSBudWxsICYmIHN0YXRlLndiaXRzICE9PSB3aW5kb3dCaXRzKSB7XG4gICAgc3RhdGUud2luZG93ID0gbnVsbDtcbiAgfVxuXG4gIC8qIHVwZGF0ZSBzdGF0ZSBhbmQgcmVzZXQgdGhlIHJlc3Qgb2YgaXQgKi9cbiAgc3RhdGUud3JhcCA9IHdyYXA7XG4gIHN0YXRlLndiaXRzID0gd2luZG93Qml0cztcbiAgcmV0dXJuIGluZmxhdGVSZXNldChzdHJtKTtcbn1cblxuZnVuY3Rpb24gaW5mbGF0ZUluaXQyKHN0cm0sIHdpbmRvd0JpdHMpIHtcbiAgdmFyIHJldDtcbiAgdmFyIHN0YXRlO1xuXG4gIGlmICghc3RybSkgeyByZXR1cm4gWl9TVFJFQU1fRVJST1I7IH1cbiAgLy9zdHJtLm1zZyA9IFpfTlVMTDsgICAgICAgICAgICAgICAgIC8qIGluIGNhc2Ugd2UgcmV0dXJuIGFuIGVycm9yICovXG5cbiAgc3RhdGUgPSBuZXcgSW5mbGF0ZVN0YXRlKCk7XG5cbiAgLy9pZiAoc3RhdGUgPT09IFpfTlVMTCkgcmV0dXJuIFpfTUVNX0VSUk9SO1xuICAvL1RyYWNldigoc3RkZXJyLCBcImluZmxhdGU6IGFsbG9jYXRlZFxcblwiKSk7XG4gIHN0cm0uc3RhdGUgPSBzdGF0ZTtcbiAgc3RhdGUud2luZG93ID0gbnVsbC8qWl9OVUxMKi87XG4gIHJldCA9IGluZmxhdGVSZXNldDIoc3RybSwgd2luZG93Qml0cyk7XG4gIGlmIChyZXQgIT09IFpfT0spIHtcbiAgICBzdHJtLnN0YXRlID0gbnVsbC8qWl9OVUxMKi87XG4gIH1cbiAgcmV0dXJuIHJldDtcbn1cblxuZnVuY3Rpb24gaW5mbGF0ZUluaXQoc3RybSkge1xuICByZXR1cm4gaW5mbGF0ZUluaXQyKHN0cm0sIERFRl9XQklUUyk7XG59XG5cblxuLypcbiBSZXR1cm4gc3RhdGUgd2l0aCBsZW5ndGggYW5kIGRpc3RhbmNlIGRlY29kaW5nIHRhYmxlcyBhbmQgaW5kZXggc2l6ZXMgc2V0IHRvXG4gZml4ZWQgY29kZSBkZWNvZGluZy4gIE5vcm1hbGx5IHRoaXMgcmV0dXJucyBmaXhlZCB0YWJsZXMgZnJvbSBpbmZmaXhlZC5oLlxuIElmIEJVSUxERklYRUQgaXMgZGVmaW5lZCwgdGhlbiBpbnN0ZWFkIHRoaXMgcm91dGluZSBidWlsZHMgdGhlIHRhYmxlcyB0aGVcbiBmaXJzdCB0aW1lIGl0J3MgY2FsbGVkLCBhbmQgcmV0dXJucyB0aG9zZSB0YWJsZXMgdGhlIGZpcnN0IHRpbWUgYW5kXG4gdGhlcmVhZnRlci4gIFRoaXMgcmVkdWNlcyB0aGUgc2l6ZSBvZiB0aGUgY29kZSBieSBhYm91dCAySyBieXRlcywgaW5cbiBleGNoYW5nZSBmb3IgYSBsaXR0bGUgZXhlY3V0aW9uIHRpbWUuICBIb3dldmVyLCBCVUlMREZJWEVEIHNob3VsZCBub3QgYmVcbiB1c2VkIGZvciB0aHJlYWRlZCBhcHBsaWNhdGlvbnMsIHNpbmNlIHRoZSByZXdyaXRpbmcgb2YgdGhlIHRhYmxlcyBhbmQgdmlyZ2luXG4gbWF5IG5vdCBiZSB0aHJlYWQtc2FmZS5cbiAqL1xudmFyIHZpcmdpbiA9IHRydWU7XG5cbnZhciBsZW5maXgsIGRpc3RmaXg7IC8vIFdlIGhhdmUgbm8gcG9pbnRlcnMgaW4gSlMsIHNvIGtlZXAgdGFibGVzIHNlcGFyYXRlXG5cbmZ1bmN0aW9uIGZpeGVkdGFibGVzKHN0YXRlKSB7XG4gIC8qIGJ1aWxkIGZpeGVkIGh1ZmZtYW4gdGFibGVzIGlmIGZpcnN0IGNhbGwgKG1heSBub3QgYmUgdGhyZWFkIHNhZmUpICovXG4gIGlmICh2aXJnaW4pIHtcbiAgICB2YXIgc3ltO1xuXG4gICAgbGVuZml4ID0gbmV3IHV0aWxzLkJ1ZjMyKDUxMik7XG4gICAgZGlzdGZpeCA9IG5ldyB1dGlscy5CdWYzMigzMik7XG5cbiAgICAvKiBsaXRlcmFsL2xlbmd0aCB0YWJsZSAqL1xuICAgIHN5bSA9IDA7XG4gICAgd2hpbGUgKHN5bSA8IDE0NCkgeyBzdGF0ZS5sZW5zW3N5bSsrXSA9IDg7IH1cbiAgICB3aGlsZSAoc3ltIDwgMjU2KSB7IHN0YXRlLmxlbnNbc3ltKytdID0gOTsgfVxuICAgIHdoaWxlIChzeW0gPCAyODApIHsgc3RhdGUubGVuc1tzeW0rK10gPSA3OyB9XG4gICAgd2hpbGUgKHN5bSA8IDI4OCkgeyBzdGF0ZS5sZW5zW3N5bSsrXSA9IDg7IH1cblxuICAgIGluZmxhdGVfdGFibGUoTEVOUywgIHN0YXRlLmxlbnMsIDAsIDI4OCwgbGVuZml4LCAgIDAsIHN0YXRlLndvcmssIHsgYml0czogOSB9KTtcblxuICAgIC8qIGRpc3RhbmNlIHRhYmxlICovXG4gICAgc3ltID0gMDtcbiAgICB3aGlsZSAoc3ltIDwgMzIpIHsgc3RhdGUubGVuc1tzeW0rK10gPSA1OyB9XG5cbiAgICBpbmZsYXRlX3RhYmxlKERJU1RTLCBzdGF0ZS5sZW5zLCAwLCAzMiwgICBkaXN0Zml4LCAwLCBzdGF0ZS53b3JrLCB7IGJpdHM6IDUgfSk7XG5cbiAgICAvKiBkbyB0aGlzIGp1c3Qgb25jZSAqL1xuICAgIHZpcmdpbiA9IGZhbHNlO1xuICB9XG5cbiAgc3RhdGUubGVuY29kZSA9IGxlbmZpeDtcbiAgc3RhdGUubGVuYml0cyA9IDk7XG4gIHN0YXRlLmRpc3Rjb2RlID0gZGlzdGZpeDtcbiAgc3RhdGUuZGlzdGJpdHMgPSA1O1xufVxuXG5cbi8qXG4gVXBkYXRlIHRoZSB3aW5kb3cgd2l0aCB0aGUgbGFzdCB3c2l6ZSAobm9ybWFsbHkgMzJLKSBieXRlcyB3cml0dGVuIGJlZm9yZVxuIHJldHVybmluZy4gIElmIHdpbmRvdyBkb2VzIG5vdCBleGlzdCB5ZXQsIGNyZWF0ZSBpdC4gIFRoaXMgaXMgb25seSBjYWxsZWRcbiB3aGVuIGEgd2luZG93IGlzIGFscmVhZHkgaW4gdXNlLCBvciB3aGVuIG91dHB1dCBoYXMgYmVlbiB3cml0dGVuIGR1cmluZyB0aGlzXG4gaW5mbGF0ZSBjYWxsLCBidXQgdGhlIGVuZCBvZiB0aGUgZGVmbGF0ZSBzdHJlYW0gaGFzIG5vdCBiZWVuIHJlYWNoZWQgeWV0LlxuIEl0IGlzIGFsc28gY2FsbGVkIHRvIGNyZWF0ZSBhIHdpbmRvdyBmb3IgZGljdGlvbmFyeSBkYXRhIHdoZW4gYSBkaWN0aW9uYXJ5XG4gaXMgbG9hZGVkLlxuXG4gUHJvdmlkaW5nIG91dHB1dCBidWZmZXJzIGxhcmdlciB0aGFuIDMySyB0byBpbmZsYXRlKCkgc2hvdWxkIHByb3ZpZGUgYSBzcGVlZFxuIGFkdmFudGFnZSwgc2luY2Ugb25seSB0aGUgbGFzdCAzMksgb2Ygb3V0cHV0IGlzIGNvcGllZCB0byB0aGUgc2xpZGluZyB3aW5kb3dcbiB1cG9uIHJldHVybiBmcm9tIGluZmxhdGUoKSwgYW5kIHNpbmNlIGFsbCBkaXN0YW5jZXMgYWZ0ZXIgdGhlIGZpcnN0IDMySyBvZlxuIG91dHB1dCB3aWxsIGZhbGwgaW4gdGhlIG91dHB1dCBkYXRhLCBtYWtpbmcgbWF0Y2ggY29waWVzIHNpbXBsZXIgYW5kIGZhc3Rlci5cbiBUaGUgYWR2YW50YWdlIG1heSBiZSBkZXBlbmRlbnQgb24gdGhlIHNpemUgb2YgdGhlIHByb2Nlc3NvcidzIGRhdGEgY2FjaGVzLlxuICovXG5mdW5jdGlvbiB1cGRhdGV3aW5kb3coc3RybSwgc3JjLCBlbmQsIGNvcHkpIHtcbiAgdmFyIGRpc3Q7XG4gIHZhciBzdGF0ZSA9IHN0cm0uc3RhdGU7XG5cbiAgLyogaWYgaXQgaGFzbid0IGJlZW4gZG9uZSBhbHJlYWR5LCBhbGxvY2F0ZSBzcGFjZSBmb3IgdGhlIHdpbmRvdyAqL1xuICBpZiAoc3RhdGUud2luZG93ID09PSBudWxsKSB7XG4gICAgc3RhdGUud3NpemUgPSAxIDw8IHN0YXRlLndiaXRzO1xuICAgIHN0YXRlLnduZXh0ID0gMDtcbiAgICBzdGF0ZS53aGF2ZSA9IDA7XG5cbiAgICBzdGF0ZS53aW5kb3cgPSBuZXcgdXRpbHMuQnVmOChzdGF0ZS53c2l6ZSk7XG4gIH1cblxuICAvKiBjb3B5IHN0YXRlLT53c2l6ZSBvciBsZXNzIG91dHB1dCBieXRlcyBpbnRvIHRoZSBjaXJjdWxhciB3aW5kb3cgKi9cbiAgaWYgKGNvcHkgPj0gc3RhdGUud3NpemUpIHtcbiAgICB1dGlscy5hcnJheVNldChzdGF0ZS53aW5kb3csIHNyYywgZW5kIC0gc3RhdGUud3NpemUsIHN0YXRlLndzaXplLCAwKTtcbiAgICBzdGF0ZS53bmV4dCA9IDA7XG4gICAgc3RhdGUud2hhdmUgPSBzdGF0ZS53c2l6ZTtcbiAgfVxuICBlbHNlIHtcbiAgICBkaXN0ID0gc3RhdGUud3NpemUgLSBzdGF0ZS53bmV4dDtcbiAgICBpZiAoZGlzdCA+IGNvcHkpIHtcbiAgICAgIGRpc3QgPSBjb3B5O1xuICAgIH1cbiAgICAvL3ptZW1jcHkoc3RhdGUtPndpbmRvdyArIHN0YXRlLT53bmV4dCwgZW5kIC0gY29weSwgZGlzdCk7XG4gICAgdXRpbHMuYXJyYXlTZXQoc3RhdGUud2luZG93LCBzcmMsIGVuZCAtIGNvcHksIGRpc3QsIHN0YXRlLnduZXh0KTtcbiAgICBjb3B5IC09IGRpc3Q7XG4gICAgaWYgKGNvcHkpIHtcbiAgICAgIC8vem1lbWNweShzdGF0ZS0+d2luZG93LCBlbmQgLSBjb3B5LCBjb3B5KTtcbiAgICAgIHV0aWxzLmFycmF5U2V0KHN0YXRlLndpbmRvdywgc3JjLCBlbmQgLSBjb3B5LCBjb3B5LCAwKTtcbiAgICAgIHN0YXRlLnduZXh0ID0gY29weTtcbiAgICAgIHN0YXRlLndoYXZlID0gc3RhdGUud3NpemU7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgc3RhdGUud25leHQgKz0gZGlzdDtcbiAgICAgIGlmIChzdGF0ZS53bmV4dCA9PT0gc3RhdGUud3NpemUpIHsgc3RhdGUud25leHQgPSAwOyB9XG4gICAgICBpZiAoc3RhdGUud2hhdmUgPCBzdGF0ZS53c2l6ZSkgeyBzdGF0ZS53aGF2ZSArPSBkaXN0OyB9XG4gICAgfVxuICB9XG4gIHJldHVybiAwO1xufVxuXG5mdW5jdGlvbiBpbmZsYXRlKHN0cm0sIGZsdXNoKSB7XG4gIHZhciBzdGF0ZTtcbiAgdmFyIGlucHV0LCBvdXRwdXQ7ICAgICAgICAgIC8vIGlucHV0L291dHB1dCBidWZmZXJzXG4gIHZhciBuZXh0OyAgICAgICAgICAgICAgICAgICAvKiBuZXh0IGlucHV0IElOREVYICovXG4gIHZhciBwdXQ7ICAgICAgICAgICAgICAgICAgICAvKiBuZXh0IG91dHB1dCBJTkRFWCAqL1xuICB2YXIgaGF2ZSwgbGVmdDsgICAgICAgICAgICAgLyogYXZhaWxhYmxlIGlucHV0IGFuZCBvdXRwdXQgKi9cbiAgdmFyIGhvbGQ7ICAgICAgICAgICAgICAgICAgIC8qIGJpdCBidWZmZXIgKi9cbiAgdmFyIGJpdHM7ICAgICAgICAgICAgICAgICAgIC8qIGJpdHMgaW4gYml0IGJ1ZmZlciAqL1xuICB2YXIgX2luLCBfb3V0OyAgICAgICAgICAgICAgLyogc2F2ZSBzdGFydGluZyBhdmFpbGFibGUgaW5wdXQgYW5kIG91dHB1dCAqL1xuICB2YXIgY29weTsgICAgICAgICAgICAgICAgICAgLyogbnVtYmVyIG9mIHN0b3JlZCBvciBtYXRjaCBieXRlcyB0byBjb3B5ICovXG4gIHZhciBmcm9tOyAgICAgICAgICAgICAgICAgICAvKiB3aGVyZSB0byBjb3B5IG1hdGNoIGJ5dGVzIGZyb20gKi9cbiAgdmFyIGZyb21fc291cmNlO1xuICB2YXIgaGVyZSA9IDA7ICAgICAgICAgICAgICAgLyogY3VycmVudCBkZWNvZGluZyB0YWJsZSBlbnRyeSAqL1xuICB2YXIgaGVyZV9iaXRzLCBoZXJlX29wLCBoZXJlX3ZhbDsgLy8gcGFrZWQgXCJoZXJlXCIgZGVub3JtYWxpemVkIChKUyBzcGVjaWZpYylcbiAgLy92YXIgbGFzdDsgICAgICAgICAgICAgICAgICAgLyogcGFyZW50IHRhYmxlIGVudHJ5ICovXG4gIHZhciBsYXN0X2JpdHMsIGxhc3Rfb3AsIGxhc3RfdmFsOyAvLyBwYWtlZCBcImxhc3RcIiBkZW5vcm1hbGl6ZWQgKEpTIHNwZWNpZmljKVxuICB2YXIgbGVuOyAgICAgICAgICAgICAgICAgICAgLyogbGVuZ3RoIHRvIGNvcHkgZm9yIHJlcGVhdHMsIGJpdHMgdG8gZHJvcCAqL1xuICB2YXIgcmV0OyAgICAgICAgICAgICAgICAgICAgLyogcmV0dXJuIGNvZGUgKi9cbiAgdmFyIGhidWYgPSBuZXcgdXRpbHMuQnVmOCg0KTsgICAgLyogYnVmZmVyIGZvciBnemlwIGhlYWRlciBjcmMgY2FsY3VsYXRpb24gKi9cbiAgdmFyIG9wdHM7XG5cbiAgdmFyIG47IC8vIHRlbXBvcmFyeSB2YXIgZm9yIE5FRURfQklUU1xuXG4gIHZhciBvcmRlciA9IC8qIHBlcm11dGF0aW9uIG9mIGNvZGUgbGVuZ3RocyAqL1xuICAgIFsgMTYsIDE3LCAxOCwgMCwgOCwgNywgOSwgNiwgMTAsIDUsIDExLCA0LCAxMiwgMywgMTMsIDIsIDE0LCAxLCAxNSBdO1xuXG5cbiAgaWYgKCFzdHJtIHx8ICFzdHJtLnN0YXRlIHx8ICFzdHJtLm91dHB1dCB8fFxuICAgICAgKCFzdHJtLmlucHV0ICYmIHN0cm0uYXZhaWxfaW4gIT09IDApKSB7XG4gICAgcmV0dXJuIFpfU1RSRUFNX0VSUk9SO1xuICB9XG5cbiAgc3RhdGUgPSBzdHJtLnN0YXRlO1xuICBpZiAoc3RhdGUubW9kZSA9PT0gVFlQRSkgeyBzdGF0ZS5tb2RlID0gVFlQRURPOyB9ICAgIC8qIHNraXAgY2hlY2sgKi9cblxuXG4gIC8vLS0tIExPQUQoKSAtLS1cbiAgcHV0ID0gc3RybS5uZXh0X291dDtcbiAgb3V0cHV0ID0gc3RybS5vdXRwdXQ7XG4gIGxlZnQgPSBzdHJtLmF2YWlsX291dDtcbiAgbmV4dCA9IHN0cm0ubmV4dF9pbjtcbiAgaW5wdXQgPSBzdHJtLmlucHV0O1xuICBoYXZlID0gc3RybS5hdmFpbF9pbjtcbiAgaG9sZCA9IHN0YXRlLmhvbGQ7XG4gIGJpdHMgPSBzdGF0ZS5iaXRzO1xuICAvLy0tLVxuXG4gIF9pbiA9IGhhdmU7XG4gIF9vdXQgPSBsZWZ0O1xuICByZXQgPSBaX09LO1xuXG4gIGluZl9sZWF2ZTogLy8gZ290byBlbXVsYXRpb25cbiAgZm9yICg7Oykge1xuICAgIHN3aXRjaCAoc3RhdGUubW9kZSkge1xuICAgIGNhc2UgSEVBRDpcbiAgICAgIGlmIChzdGF0ZS53cmFwID09PSAwKSB7XG4gICAgICAgIHN0YXRlLm1vZGUgPSBUWVBFRE87XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgLy89PT0gTkVFREJJVFMoMTYpO1xuICAgICAgd2hpbGUgKGJpdHMgPCAxNikge1xuICAgICAgICBpZiAoaGF2ZSA9PT0gMCkgeyBicmVhayBpbmZfbGVhdmU7IH1cbiAgICAgICAgaGF2ZS0tO1xuICAgICAgICBob2xkICs9IGlucHV0W25leHQrK10gPDwgYml0cztcbiAgICAgICAgYml0cyArPSA4O1xuICAgICAgfVxuICAgICAgLy89PT0vL1xuICAgICAgaWYgKChzdGF0ZS53cmFwICYgMikgJiYgaG9sZCA9PT0gMHg4YjFmKSB7ICAvKiBnemlwIGhlYWRlciAqL1xuICAgICAgICBzdGF0ZS5jaGVjayA9IDAvKmNyYzMyKDBMLCBaX05VTEwsIDApKi87XG4gICAgICAgIC8vPT09IENSQzIoc3RhdGUuY2hlY2ssIGhvbGQpO1xuICAgICAgICBoYnVmWzBdID0gaG9sZCAmIDB4ZmY7XG4gICAgICAgIGhidWZbMV0gPSAoaG9sZCA+Pj4gOCkgJiAweGZmO1xuICAgICAgICBzdGF0ZS5jaGVjayA9IGNyYzMyKHN0YXRlLmNoZWNrLCBoYnVmLCAyLCAwKTtcbiAgICAgICAgLy89PT0vL1xuXG4gICAgICAgIC8vPT09IElOSVRCSVRTKCk7XG4gICAgICAgIGhvbGQgPSAwO1xuICAgICAgICBiaXRzID0gMDtcbiAgICAgICAgLy89PT0vL1xuICAgICAgICBzdGF0ZS5tb2RlID0gRkxBR1M7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgc3RhdGUuZmxhZ3MgPSAwOyAgICAgICAgICAgLyogZXhwZWN0IHpsaWIgaGVhZGVyICovXG4gICAgICBpZiAoc3RhdGUuaGVhZCkge1xuICAgICAgICBzdGF0ZS5oZWFkLmRvbmUgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmICghKHN0YXRlLndyYXAgJiAxKSB8fCAgIC8qIGNoZWNrIGlmIHpsaWIgaGVhZGVyIGFsbG93ZWQgKi9cbiAgICAgICAgKCgoaG9sZCAmIDB4ZmYpLypCSVRTKDgpKi8gPDwgOCkgKyAoaG9sZCA+PiA4KSkgJSAzMSkge1xuICAgICAgICBzdHJtLm1zZyA9ICdpbmNvcnJlY3QgaGVhZGVyIGNoZWNrJztcbiAgICAgICAgc3RhdGUubW9kZSA9IEJBRDtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBpZiAoKGhvbGQgJiAweDBmKS8qQklUUyg0KSovICE9PSBaX0RFRkxBVEVEKSB7XG4gICAgICAgIHN0cm0ubXNnID0gJ3Vua25vd24gY29tcHJlc3Npb24gbWV0aG9kJztcbiAgICAgICAgc3RhdGUubW9kZSA9IEJBRDtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICAvLy0tLSBEUk9QQklUUyg0KSAtLS0vL1xuICAgICAgaG9sZCA+Pj49IDQ7XG4gICAgICBiaXRzIC09IDQ7XG4gICAgICAvLy0tLS8vXG4gICAgICBsZW4gPSAoaG9sZCAmIDB4MGYpLypCSVRTKDQpKi8gKyA4O1xuICAgICAgaWYgKHN0YXRlLndiaXRzID09PSAwKSB7XG4gICAgICAgIHN0YXRlLndiaXRzID0gbGVuO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAobGVuID4gc3RhdGUud2JpdHMpIHtcbiAgICAgICAgc3RybS5tc2cgPSAnaW52YWxpZCB3aW5kb3cgc2l6ZSc7XG4gICAgICAgIHN0YXRlLm1vZGUgPSBCQUQ7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgc3RhdGUuZG1heCA9IDEgPDwgbGVuO1xuICAgICAgLy9UcmFjZXYoKHN0ZGVyciwgXCJpbmZsYXRlOiAgIHpsaWIgaGVhZGVyIG9rXFxuXCIpKTtcbiAgICAgIHN0cm0uYWRsZXIgPSBzdGF0ZS5jaGVjayA9IDEvKmFkbGVyMzIoMEwsIFpfTlVMTCwgMCkqLztcbiAgICAgIHN0YXRlLm1vZGUgPSBob2xkICYgMHgyMDAgPyBESUNUSUQgOiBUWVBFO1xuICAgICAgLy89PT0gSU5JVEJJVFMoKTtcbiAgICAgIGhvbGQgPSAwO1xuICAgICAgYml0cyA9IDA7XG4gICAgICAvLz09PS8vXG4gICAgICBicmVhaztcbiAgICBjYXNlIEZMQUdTOlxuICAgICAgLy89PT0gTkVFREJJVFMoMTYpOyAqL1xuICAgICAgd2hpbGUgKGJpdHMgPCAxNikge1xuICAgICAgICBpZiAoaGF2ZSA9PT0gMCkgeyBicmVhayBpbmZfbGVhdmU7IH1cbiAgICAgICAgaGF2ZS0tO1xuICAgICAgICBob2xkICs9IGlucHV0W25leHQrK10gPDwgYml0cztcbiAgICAgICAgYml0cyArPSA4O1xuICAgICAgfVxuICAgICAgLy89PT0vL1xuICAgICAgc3RhdGUuZmxhZ3MgPSBob2xkO1xuICAgICAgaWYgKChzdGF0ZS5mbGFncyAmIDB4ZmYpICE9PSBaX0RFRkxBVEVEKSB7XG4gICAgICAgIHN0cm0ubXNnID0gJ3Vua25vd24gY29tcHJlc3Npb24gbWV0aG9kJztcbiAgICAgICAgc3RhdGUubW9kZSA9IEJBRDtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBpZiAoc3RhdGUuZmxhZ3MgJiAweGUwMDApIHtcbiAgICAgICAgc3RybS5tc2cgPSAndW5rbm93biBoZWFkZXIgZmxhZ3Mgc2V0JztcbiAgICAgICAgc3RhdGUubW9kZSA9IEJBRDtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBpZiAoc3RhdGUuaGVhZCkge1xuICAgICAgICBzdGF0ZS5oZWFkLnRleHQgPSAoKGhvbGQgPj4gOCkgJiAxKTtcbiAgICAgIH1cbiAgICAgIGlmIChzdGF0ZS5mbGFncyAmIDB4MDIwMCkge1xuICAgICAgICAvLz09PSBDUkMyKHN0YXRlLmNoZWNrLCBob2xkKTtcbiAgICAgICAgaGJ1ZlswXSA9IGhvbGQgJiAweGZmO1xuICAgICAgICBoYnVmWzFdID0gKGhvbGQgPj4+IDgpICYgMHhmZjtcbiAgICAgICAgc3RhdGUuY2hlY2sgPSBjcmMzMihzdGF0ZS5jaGVjaywgaGJ1ZiwgMiwgMCk7XG4gICAgICAgIC8vPT09Ly9cbiAgICAgIH1cbiAgICAgIC8vPT09IElOSVRCSVRTKCk7XG4gICAgICBob2xkID0gMDtcbiAgICAgIGJpdHMgPSAwO1xuICAgICAgLy89PT0vL1xuICAgICAgc3RhdGUubW9kZSA9IFRJTUU7XG4gICAgICAvKiBmYWxscyB0aHJvdWdoICovXG4gICAgY2FzZSBUSU1FOlxuICAgICAgLy89PT0gTkVFREJJVFMoMzIpOyAqL1xuICAgICAgd2hpbGUgKGJpdHMgPCAzMikge1xuICAgICAgICBpZiAoaGF2ZSA9PT0gMCkgeyBicmVhayBpbmZfbGVhdmU7IH1cbiAgICAgICAgaGF2ZS0tO1xuICAgICAgICBob2xkICs9IGlucHV0W25leHQrK10gPDwgYml0cztcbiAgICAgICAgYml0cyArPSA4O1xuICAgICAgfVxuICAgICAgLy89PT0vL1xuICAgICAgaWYgKHN0YXRlLmhlYWQpIHtcbiAgICAgICAgc3RhdGUuaGVhZC50aW1lID0gaG9sZDtcbiAgICAgIH1cbiAgICAgIGlmIChzdGF0ZS5mbGFncyAmIDB4MDIwMCkge1xuICAgICAgICAvLz09PSBDUkM0KHN0YXRlLmNoZWNrLCBob2xkKVxuICAgICAgICBoYnVmWzBdID0gaG9sZCAmIDB4ZmY7XG4gICAgICAgIGhidWZbMV0gPSAoaG9sZCA+Pj4gOCkgJiAweGZmO1xuICAgICAgICBoYnVmWzJdID0gKGhvbGQgPj4+IDE2KSAmIDB4ZmY7XG4gICAgICAgIGhidWZbM10gPSAoaG9sZCA+Pj4gMjQpICYgMHhmZjtcbiAgICAgICAgc3RhdGUuY2hlY2sgPSBjcmMzMihzdGF0ZS5jaGVjaywgaGJ1ZiwgNCwgMCk7XG4gICAgICAgIC8vPT09XG4gICAgICB9XG4gICAgICAvLz09PSBJTklUQklUUygpO1xuICAgICAgaG9sZCA9IDA7XG4gICAgICBiaXRzID0gMDtcbiAgICAgIC8vPT09Ly9cbiAgICAgIHN0YXRlLm1vZGUgPSBPUztcbiAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICBjYXNlIE9TOlxuICAgICAgLy89PT0gTkVFREJJVFMoMTYpOyAqL1xuICAgICAgd2hpbGUgKGJpdHMgPCAxNikge1xuICAgICAgICBpZiAoaGF2ZSA9PT0gMCkgeyBicmVhayBpbmZfbGVhdmU7IH1cbiAgICAgICAgaGF2ZS0tO1xuICAgICAgICBob2xkICs9IGlucHV0W25leHQrK10gPDwgYml0cztcbiAgICAgICAgYml0cyArPSA4O1xuICAgICAgfVxuICAgICAgLy89PT0vL1xuICAgICAgaWYgKHN0YXRlLmhlYWQpIHtcbiAgICAgICAgc3RhdGUuaGVhZC54ZmxhZ3MgPSAoaG9sZCAmIDB4ZmYpO1xuICAgICAgICBzdGF0ZS5oZWFkLm9zID0gKGhvbGQgPj4gOCk7XG4gICAgICB9XG4gICAgICBpZiAoc3RhdGUuZmxhZ3MgJiAweDAyMDApIHtcbiAgICAgICAgLy89PT0gQ1JDMihzdGF0ZS5jaGVjaywgaG9sZCk7XG4gICAgICAgIGhidWZbMF0gPSBob2xkICYgMHhmZjtcbiAgICAgICAgaGJ1ZlsxXSA9IChob2xkID4+PiA4KSAmIDB4ZmY7XG4gICAgICAgIHN0YXRlLmNoZWNrID0gY3JjMzIoc3RhdGUuY2hlY2ssIGhidWYsIDIsIDApO1xuICAgICAgICAvLz09PS8vXG4gICAgICB9XG4gICAgICAvLz09PSBJTklUQklUUygpO1xuICAgICAgaG9sZCA9IDA7XG4gICAgICBiaXRzID0gMDtcbiAgICAgIC8vPT09Ly9cbiAgICAgIHN0YXRlLm1vZGUgPSBFWExFTjtcbiAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICBjYXNlIEVYTEVOOlxuICAgICAgaWYgKHN0YXRlLmZsYWdzICYgMHgwNDAwKSB7XG4gICAgICAgIC8vPT09IE5FRURCSVRTKDE2KTsgKi9cbiAgICAgICAgd2hpbGUgKGJpdHMgPCAxNikge1xuICAgICAgICAgIGlmIChoYXZlID09PSAwKSB7IGJyZWFrIGluZl9sZWF2ZTsgfVxuICAgICAgICAgIGhhdmUtLTtcbiAgICAgICAgICBob2xkICs9IGlucHV0W25leHQrK10gPDwgYml0cztcbiAgICAgICAgICBiaXRzICs9IDg7XG4gICAgICAgIH1cbiAgICAgICAgLy89PT0vL1xuICAgICAgICBzdGF0ZS5sZW5ndGggPSBob2xkO1xuICAgICAgICBpZiAoc3RhdGUuaGVhZCkge1xuICAgICAgICAgIHN0YXRlLmhlYWQuZXh0cmFfbGVuID0gaG9sZDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3RhdGUuZmxhZ3MgJiAweDAyMDApIHtcbiAgICAgICAgICAvLz09PSBDUkMyKHN0YXRlLmNoZWNrLCBob2xkKTtcbiAgICAgICAgICBoYnVmWzBdID0gaG9sZCAmIDB4ZmY7XG4gICAgICAgICAgaGJ1ZlsxXSA9IChob2xkID4+PiA4KSAmIDB4ZmY7XG4gICAgICAgICAgc3RhdGUuY2hlY2sgPSBjcmMzMihzdGF0ZS5jaGVjaywgaGJ1ZiwgMiwgMCk7XG4gICAgICAgICAgLy89PT0vL1xuICAgICAgICB9XG4gICAgICAgIC8vPT09IElOSVRCSVRTKCk7XG4gICAgICAgIGhvbGQgPSAwO1xuICAgICAgICBiaXRzID0gMDtcbiAgICAgICAgLy89PT0vL1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoc3RhdGUuaGVhZCkge1xuICAgICAgICBzdGF0ZS5oZWFkLmV4dHJhID0gbnVsbC8qWl9OVUxMKi87XG4gICAgICB9XG4gICAgICBzdGF0ZS5tb2RlID0gRVhUUkE7XG4gICAgICAvKiBmYWxscyB0aHJvdWdoICovXG4gICAgY2FzZSBFWFRSQTpcbiAgICAgIGlmIChzdGF0ZS5mbGFncyAmIDB4MDQwMCkge1xuICAgICAgICBjb3B5ID0gc3RhdGUubGVuZ3RoO1xuICAgICAgICBpZiAoY29weSA+IGhhdmUpIHsgY29weSA9IGhhdmU7IH1cbiAgICAgICAgaWYgKGNvcHkpIHtcbiAgICAgICAgICBpZiAoc3RhdGUuaGVhZCkge1xuICAgICAgICAgICAgbGVuID0gc3RhdGUuaGVhZC5leHRyYV9sZW4gLSBzdGF0ZS5sZW5ndGg7XG4gICAgICAgICAgICBpZiAoIXN0YXRlLmhlYWQuZXh0cmEpIHtcbiAgICAgICAgICAgICAgLy8gVXNlIHVudHlwZWQgYXJyYXkgZm9yIG1vcmUgY29udmVuaWVuZCBwcm9jZXNzaW5nIGxhdGVyXG4gICAgICAgICAgICAgIHN0YXRlLmhlYWQuZXh0cmEgPSBuZXcgQXJyYXkoc3RhdGUuaGVhZC5leHRyYV9sZW4pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdXRpbHMuYXJyYXlTZXQoXG4gICAgICAgICAgICAgIHN0YXRlLmhlYWQuZXh0cmEsXG4gICAgICAgICAgICAgIGlucHV0LFxuICAgICAgICAgICAgICBuZXh0LFxuICAgICAgICAgICAgICAvLyBleHRyYSBmaWVsZCBpcyBsaW1pdGVkIHRvIDY1NTM2IGJ5dGVzXG4gICAgICAgICAgICAgIC8vIC0gbm8gbmVlZCBmb3IgYWRkaXRpb25hbCBzaXplIGNoZWNrXG4gICAgICAgICAgICAgIGNvcHksXG4gICAgICAgICAgICAgIC8qbGVuICsgY29weSA+IHN0YXRlLmhlYWQuZXh0cmFfbWF4IC0gbGVuID8gc3RhdGUuaGVhZC5leHRyYV9tYXggOiBjb3B5LCovXG4gICAgICAgICAgICAgIGxlblxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIC8vem1lbWNweShzdGF0ZS5oZWFkLmV4dHJhICsgbGVuLCBuZXh0LFxuICAgICAgICAgICAgLy8gICAgICAgIGxlbiArIGNvcHkgPiBzdGF0ZS5oZWFkLmV4dHJhX21heCA/XG4gICAgICAgICAgICAvLyAgICAgICAgc3RhdGUuaGVhZC5leHRyYV9tYXggLSBsZW4gOiBjb3B5KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHN0YXRlLmZsYWdzICYgMHgwMjAwKSB7XG4gICAgICAgICAgICBzdGF0ZS5jaGVjayA9IGNyYzMyKHN0YXRlLmNoZWNrLCBpbnB1dCwgY29weSwgbmV4dCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGhhdmUgLT0gY29weTtcbiAgICAgICAgICBuZXh0ICs9IGNvcHk7XG4gICAgICAgICAgc3RhdGUubGVuZ3RoIC09IGNvcHk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN0YXRlLmxlbmd0aCkgeyBicmVhayBpbmZfbGVhdmU7IH1cbiAgICAgIH1cbiAgICAgIHN0YXRlLmxlbmd0aCA9IDA7XG4gICAgICBzdGF0ZS5tb2RlID0gTkFNRTtcbiAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICBjYXNlIE5BTUU6XG4gICAgICBpZiAoc3RhdGUuZmxhZ3MgJiAweDA4MDApIHtcbiAgICAgICAgaWYgKGhhdmUgPT09IDApIHsgYnJlYWsgaW5mX2xlYXZlOyB9XG4gICAgICAgIGNvcHkgPSAwO1xuICAgICAgICBkbyB7XG4gICAgICAgICAgLy8gVE9ETzogMiBvciAxIGJ5dGVzP1xuICAgICAgICAgIGxlbiA9IGlucHV0W25leHQgKyBjb3B5KytdO1xuICAgICAgICAgIC8qIHVzZSBjb25zdGFudCBsaW1pdCBiZWNhdXNlIGluIGpzIHdlIHNob3VsZCBub3QgcHJlYWxsb2NhdGUgbWVtb3J5ICovXG4gICAgICAgICAgaWYgKHN0YXRlLmhlYWQgJiYgbGVuICYmXG4gICAgICAgICAgICAgIChzdGF0ZS5sZW5ndGggPCA2NTUzNiAvKnN0YXRlLmhlYWQubmFtZV9tYXgqLykpIHtcbiAgICAgICAgICAgIHN0YXRlLmhlYWQubmFtZSArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGxlbik7XG4gICAgICAgICAgfVxuICAgICAgICB9IHdoaWxlIChsZW4gJiYgY29weSA8IGhhdmUpO1xuXG4gICAgICAgIGlmIChzdGF0ZS5mbGFncyAmIDB4MDIwMCkge1xuICAgICAgICAgIHN0YXRlLmNoZWNrID0gY3JjMzIoc3RhdGUuY2hlY2ssIGlucHV0LCBjb3B5LCBuZXh0KTtcbiAgICAgICAgfVxuICAgICAgICBoYXZlIC09IGNvcHk7XG4gICAgICAgIG5leHQgKz0gY29weTtcbiAgICAgICAgaWYgKGxlbikgeyBicmVhayBpbmZfbGVhdmU7IH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKHN0YXRlLmhlYWQpIHtcbiAgICAgICAgc3RhdGUuaGVhZC5uYW1lID0gbnVsbDtcbiAgICAgIH1cbiAgICAgIHN0YXRlLmxlbmd0aCA9IDA7XG4gICAgICBzdGF0ZS5tb2RlID0gQ09NTUVOVDtcbiAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICBjYXNlIENPTU1FTlQ6XG4gICAgICBpZiAoc3RhdGUuZmxhZ3MgJiAweDEwMDApIHtcbiAgICAgICAgaWYgKGhhdmUgPT09IDApIHsgYnJlYWsgaW5mX2xlYXZlOyB9XG4gICAgICAgIGNvcHkgPSAwO1xuICAgICAgICBkbyB7XG4gICAgICAgICAgbGVuID0gaW5wdXRbbmV4dCArIGNvcHkrK107XG4gICAgICAgICAgLyogdXNlIGNvbnN0YW50IGxpbWl0IGJlY2F1c2UgaW4ganMgd2Ugc2hvdWxkIG5vdCBwcmVhbGxvY2F0ZSBtZW1vcnkgKi9cbiAgICAgICAgICBpZiAoc3RhdGUuaGVhZCAmJiBsZW4gJiZcbiAgICAgICAgICAgICAgKHN0YXRlLmxlbmd0aCA8IDY1NTM2IC8qc3RhdGUuaGVhZC5jb21tX21heCovKSkge1xuICAgICAgICAgICAgc3RhdGUuaGVhZC5jb21tZW50ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUobGVuKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gd2hpbGUgKGxlbiAmJiBjb3B5IDwgaGF2ZSk7XG4gICAgICAgIGlmIChzdGF0ZS5mbGFncyAmIDB4MDIwMCkge1xuICAgICAgICAgIHN0YXRlLmNoZWNrID0gY3JjMzIoc3RhdGUuY2hlY2ssIGlucHV0LCBjb3B5LCBuZXh0KTtcbiAgICAgICAgfVxuICAgICAgICBoYXZlIC09IGNvcHk7XG4gICAgICAgIG5leHQgKz0gY29weTtcbiAgICAgICAgaWYgKGxlbikgeyBicmVhayBpbmZfbGVhdmU7IH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKHN0YXRlLmhlYWQpIHtcbiAgICAgICAgc3RhdGUuaGVhZC5jb21tZW50ID0gbnVsbDtcbiAgICAgIH1cbiAgICAgIHN0YXRlLm1vZGUgPSBIQ1JDO1xuICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgIGNhc2UgSENSQzpcbiAgICAgIGlmIChzdGF0ZS5mbGFncyAmIDB4MDIwMCkge1xuICAgICAgICAvLz09PSBORUVEQklUUygxNik7ICovXG4gICAgICAgIHdoaWxlIChiaXRzIDwgMTYpIHtcbiAgICAgICAgICBpZiAoaGF2ZSA9PT0gMCkgeyBicmVhayBpbmZfbGVhdmU7IH1cbiAgICAgICAgICBoYXZlLS07XG4gICAgICAgICAgaG9sZCArPSBpbnB1dFtuZXh0KytdIDw8IGJpdHM7XG4gICAgICAgICAgYml0cyArPSA4O1xuICAgICAgICB9XG4gICAgICAgIC8vPT09Ly9cbiAgICAgICAgaWYgKGhvbGQgIT09IChzdGF0ZS5jaGVjayAmIDB4ZmZmZikpIHtcbiAgICAgICAgICBzdHJtLm1zZyA9ICdoZWFkZXIgY3JjIG1pc21hdGNoJztcbiAgICAgICAgICBzdGF0ZS5tb2RlID0gQkFEO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIC8vPT09IElOSVRCSVRTKCk7XG4gICAgICAgIGhvbGQgPSAwO1xuICAgICAgICBiaXRzID0gMDtcbiAgICAgICAgLy89PT0vL1xuICAgICAgfVxuICAgICAgaWYgKHN0YXRlLmhlYWQpIHtcbiAgICAgICAgc3RhdGUuaGVhZC5oY3JjID0gKChzdGF0ZS5mbGFncyA+PiA5KSAmIDEpO1xuICAgICAgICBzdGF0ZS5oZWFkLmRvbmUgPSB0cnVlO1xuICAgICAgfVxuICAgICAgc3RybS5hZGxlciA9IHN0YXRlLmNoZWNrID0gMDtcbiAgICAgIHN0YXRlLm1vZGUgPSBUWVBFO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBESUNUSUQ6XG4gICAgICAvLz09PSBORUVEQklUUygzMik7ICovXG4gICAgICB3aGlsZSAoYml0cyA8IDMyKSB7XG4gICAgICAgIGlmIChoYXZlID09PSAwKSB7IGJyZWFrIGluZl9sZWF2ZTsgfVxuICAgICAgICBoYXZlLS07XG4gICAgICAgIGhvbGQgKz0gaW5wdXRbbmV4dCsrXSA8PCBiaXRzO1xuICAgICAgICBiaXRzICs9IDg7XG4gICAgICB9XG4gICAgICAvLz09PS8vXG4gICAgICBzdHJtLmFkbGVyID0gc3RhdGUuY2hlY2sgPSB6c3dhcDMyKGhvbGQpO1xuICAgICAgLy89PT0gSU5JVEJJVFMoKTtcbiAgICAgIGhvbGQgPSAwO1xuICAgICAgYml0cyA9IDA7XG4gICAgICAvLz09PS8vXG4gICAgICBzdGF0ZS5tb2RlID0gRElDVDtcbiAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICBjYXNlIERJQ1Q6XG4gICAgICBpZiAoc3RhdGUuaGF2ZWRpY3QgPT09IDApIHtcbiAgICAgICAgLy8tLS0gUkVTVE9SRSgpIC0tLVxuICAgICAgICBzdHJtLm5leHRfb3V0ID0gcHV0O1xuICAgICAgICBzdHJtLmF2YWlsX291dCA9IGxlZnQ7XG4gICAgICAgIHN0cm0ubmV4dF9pbiA9IG5leHQ7XG4gICAgICAgIHN0cm0uYXZhaWxfaW4gPSBoYXZlO1xuICAgICAgICBzdGF0ZS5ob2xkID0gaG9sZDtcbiAgICAgICAgc3RhdGUuYml0cyA9IGJpdHM7XG4gICAgICAgIC8vLS0tXG4gICAgICAgIHJldHVybiBaX05FRURfRElDVDtcbiAgICAgIH1cbiAgICAgIHN0cm0uYWRsZXIgPSBzdGF0ZS5jaGVjayA9IDEvKmFkbGVyMzIoMEwsIFpfTlVMTCwgMCkqLztcbiAgICAgIHN0YXRlLm1vZGUgPSBUWVBFO1xuICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgIGNhc2UgVFlQRTpcbiAgICAgIGlmIChmbHVzaCA9PT0gWl9CTE9DSyB8fCBmbHVzaCA9PT0gWl9UUkVFUykgeyBicmVhayBpbmZfbGVhdmU7IH1cbiAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICBjYXNlIFRZUEVETzpcbiAgICAgIGlmIChzdGF0ZS5sYXN0KSB7XG4gICAgICAgIC8vLS0tIEJZVEVCSVRTKCkgLS0tLy9cbiAgICAgICAgaG9sZCA+Pj49IGJpdHMgJiA3O1xuICAgICAgICBiaXRzIC09IGJpdHMgJiA3O1xuICAgICAgICAvLy0tLS8vXG4gICAgICAgIHN0YXRlLm1vZGUgPSBDSEVDSztcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICAvLz09PSBORUVEQklUUygzKTsgKi9cbiAgICAgIHdoaWxlIChiaXRzIDwgMykge1xuICAgICAgICBpZiAoaGF2ZSA9PT0gMCkgeyBicmVhayBpbmZfbGVhdmU7IH1cbiAgICAgICAgaGF2ZS0tO1xuICAgICAgICBob2xkICs9IGlucHV0W25leHQrK10gPDwgYml0cztcbiAgICAgICAgYml0cyArPSA4O1xuICAgICAgfVxuICAgICAgLy89PT0vL1xuICAgICAgc3RhdGUubGFzdCA9IChob2xkICYgMHgwMSkvKkJJVFMoMSkqLztcbiAgICAgIC8vLS0tIERST1BCSVRTKDEpIC0tLS8vXG4gICAgICBob2xkID4+Pj0gMTtcbiAgICAgIGJpdHMgLT0gMTtcbiAgICAgIC8vLS0tLy9cblxuICAgICAgc3dpdGNoICgoaG9sZCAmIDB4MDMpLypCSVRTKDIpKi8pIHtcbiAgICAgIGNhc2UgMDogICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIHN0b3JlZCBibG9jayAqL1xuICAgICAgICAvL1RyYWNldigoc3RkZXJyLCBcImluZmxhdGU6ICAgICBzdG9yZWQgYmxvY2slc1xcblwiLFxuICAgICAgICAvLyAgICAgICAgc3RhdGUubGFzdCA/IFwiIChsYXN0KVwiIDogXCJcIikpO1xuICAgICAgICBzdGF0ZS5tb2RlID0gU1RPUkVEO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMTogICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIGZpeGVkIGJsb2NrICovXG4gICAgICAgIGZpeGVkdGFibGVzKHN0YXRlKTtcbiAgICAgICAgLy9UcmFjZXYoKHN0ZGVyciwgXCJpbmZsYXRlOiAgICAgZml4ZWQgY29kZXMgYmxvY2slc1xcblwiLFxuICAgICAgICAvLyAgICAgICAgc3RhdGUubGFzdCA/IFwiIChsYXN0KVwiIDogXCJcIikpO1xuICAgICAgICBzdGF0ZS5tb2RlID0gTEVOXzsgICAgICAgICAgICAgLyogZGVjb2RlIGNvZGVzICovXG4gICAgICAgIGlmIChmbHVzaCA9PT0gWl9UUkVFUykge1xuICAgICAgICAgIC8vLS0tIERST1BCSVRTKDIpIC0tLS8vXG4gICAgICAgICAgaG9sZCA+Pj49IDI7XG4gICAgICAgICAgYml0cyAtPSAyO1xuICAgICAgICAgIC8vLS0tLy9cbiAgICAgICAgICBicmVhayBpbmZfbGVhdmU7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBkeW5hbWljIGJsb2NrICovXG4gICAgICAgIC8vVHJhY2V2KChzdGRlcnIsIFwiaW5mbGF0ZTogICAgIGR5bmFtaWMgY29kZXMgYmxvY2slc1xcblwiLFxuICAgICAgICAvLyAgICAgICAgc3RhdGUubGFzdCA/IFwiIChsYXN0KVwiIDogXCJcIikpO1xuICAgICAgICBzdGF0ZS5tb2RlID0gVEFCTEU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOlxuICAgICAgICBzdHJtLm1zZyA9ICdpbnZhbGlkIGJsb2NrIHR5cGUnO1xuICAgICAgICBzdGF0ZS5tb2RlID0gQkFEO1xuICAgICAgfVxuICAgICAgLy8tLS0gRFJPUEJJVFMoMikgLS0tLy9cbiAgICAgIGhvbGQgPj4+PSAyO1xuICAgICAgYml0cyAtPSAyO1xuICAgICAgLy8tLS0vL1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBTVE9SRUQ6XG4gICAgICAvLy0tLSBCWVRFQklUUygpIC0tLS8vIC8qIGdvIHRvIGJ5dGUgYm91bmRhcnkgKi9cbiAgICAgIGhvbGQgPj4+PSBiaXRzICYgNztcbiAgICAgIGJpdHMgLT0gYml0cyAmIDc7XG4gICAgICAvLy0tLS8vXG4gICAgICAvLz09PSBORUVEQklUUygzMik7ICovXG4gICAgICB3aGlsZSAoYml0cyA8IDMyKSB7XG4gICAgICAgIGlmIChoYXZlID09PSAwKSB7IGJyZWFrIGluZl9sZWF2ZTsgfVxuICAgICAgICBoYXZlLS07XG4gICAgICAgIGhvbGQgKz0gaW5wdXRbbmV4dCsrXSA8PCBiaXRzO1xuICAgICAgICBiaXRzICs9IDg7XG4gICAgICB9XG4gICAgICAvLz09PS8vXG4gICAgICBpZiAoKGhvbGQgJiAweGZmZmYpICE9PSAoKGhvbGQgPj4+IDE2KSBeIDB4ZmZmZikpIHtcbiAgICAgICAgc3RybS5tc2cgPSAnaW52YWxpZCBzdG9yZWQgYmxvY2sgbGVuZ3Rocyc7XG4gICAgICAgIHN0YXRlLm1vZGUgPSBCQUQ7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgc3RhdGUubGVuZ3RoID0gaG9sZCAmIDB4ZmZmZjtcbiAgICAgIC8vVHJhY2V2KChzdGRlcnIsIFwiaW5mbGF0ZTogICAgICAgc3RvcmVkIGxlbmd0aCAldVxcblwiLFxuICAgICAgLy8gICAgICAgIHN0YXRlLmxlbmd0aCkpO1xuICAgICAgLy89PT0gSU5JVEJJVFMoKTtcbiAgICAgIGhvbGQgPSAwO1xuICAgICAgYml0cyA9IDA7XG4gICAgICAvLz09PS8vXG4gICAgICBzdGF0ZS5tb2RlID0gQ09QWV87XG4gICAgICBpZiAoZmx1c2ggPT09IFpfVFJFRVMpIHsgYnJlYWsgaW5mX2xlYXZlOyB9XG4gICAgICAvKiBmYWxscyB0aHJvdWdoICovXG4gICAgY2FzZSBDT1BZXzpcbiAgICAgIHN0YXRlLm1vZGUgPSBDT1BZO1xuICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgIGNhc2UgQ09QWTpcbiAgICAgIGNvcHkgPSBzdGF0ZS5sZW5ndGg7XG4gICAgICBpZiAoY29weSkge1xuICAgICAgICBpZiAoY29weSA+IGhhdmUpIHsgY29weSA9IGhhdmU7IH1cbiAgICAgICAgaWYgKGNvcHkgPiBsZWZ0KSB7IGNvcHkgPSBsZWZ0OyB9XG4gICAgICAgIGlmIChjb3B5ID09PSAwKSB7IGJyZWFrIGluZl9sZWF2ZTsgfVxuICAgICAgICAvLy0tLSB6bWVtY3B5KHB1dCwgbmV4dCwgY29weSk7IC0tLVxuICAgICAgICB1dGlscy5hcnJheVNldChvdXRwdXQsIGlucHV0LCBuZXh0LCBjb3B5LCBwdXQpO1xuICAgICAgICAvLy0tLS8vXG4gICAgICAgIGhhdmUgLT0gY29weTtcbiAgICAgICAgbmV4dCArPSBjb3B5O1xuICAgICAgICBsZWZ0IC09IGNvcHk7XG4gICAgICAgIHB1dCArPSBjb3B5O1xuICAgICAgICBzdGF0ZS5sZW5ndGggLT0gY29weTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICAvL1RyYWNldigoc3RkZXJyLCBcImluZmxhdGU6ICAgICAgIHN0b3JlZCBlbmRcXG5cIikpO1xuICAgICAgc3RhdGUubW9kZSA9IFRZUEU7XG4gICAgICBicmVhaztcbiAgICBjYXNlIFRBQkxFOlxuICAgICAgLy89PT0gTkVFREJJVFMoMTQpOyAqL1xuICAgICAgd2hpbGUgKGJpdHMgPCAxNCkge1xuICAgICAgICBpZiAoaGF2ZSA9PT0gMCkgeyBicmVhayBpbmZfbGVhdmU7IH1cbiAgICAgICAgaGF2ZS0tO1xuICAgICAgICBob2xkICs9IGlucHV0W25leHQrK10gPDwgYml0cztcbiAgICAgICAgYml0cyArPSA4O1xuICAgICAgfVxuICAgICAgLy89PT0vL1xuICAgICAgc3RhdGUubmxlbiA9IChob2xkICYgMHgxZikvKkJJVFMoNSkqLyArIDI1NztcbiAgICAgIC8vLS0tIERST1BCSVRTKDUpIC0tLS8vXG4gICAgICBob2xkID4+Pj0gNTtcbiAgICAgIGJpdHMgLT0gNTtcbiAgICAgIC8vLS0tLy9cbiAgICAgIHN0YXRlLm5kaXN0ID0gKGhvbGQgJiAweDFmKS8qQklUUyg1KSovICsgMTtcbiAgICAgIC8vLS0tIERST1BCSVRTKDUpIC0tLS8vXG4gICAgICBob2xkID4+Pj0gNTtcbiAgICAgIGJpdHMgLT0gNTtcbiAgICAgIC8vLS0tLy9cbiAgICAgIHN0YXRlLm5jb2RlID0gKGhvbGQgJiAweDBmKS8qQklUUyg0KSovICsgNDtcbiAgICAgIC8vLS0tIERST1BCSVRTKDQpIC0tLS8vXG4gICAgICBob2xkID4+Pj0gNDtcbiAgICAgIGJpdHMgLT0gNDtcbiAgICAgIC8vLS0tLy9cbi8vI2lmbmRlZiBQS1pJUF9CVUdfV09SS0FST1VORFxuICAgICAgaWYgKHN0YXRlLm5sZW4gPiAyODYgfHwgc3RhdGUubmRpc3QgPiAzMCkge1xuICAgICAgICBzdHJtLm1zZyA9ICd0b28gbWFueSBsZW5ndGggb3IgZGlzdGFuY2Ugc3ltYm9scyc7XG4gICAgICAgIHN0YXRlLm1vZGUgPSBCQUQ7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuLy8jZW5kaWZcbiAgICAgIC8vVHJhY2V2KChzdGRlcnIsIFwiaW5mbGF0ZTogICAgICAgdGFibGUgc2l6ZXMgb2tcXG5cIikpO1xuICAgICAgc3RhdGUuaGF2ZSA9IDA7XG4gICAgICBzdGF0ZS5tb2RlID0gTEVOTEVOUztcbiAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICBjYXNlIExFTkxFTlM6XG4gICAgICB3aGlsZSAoc3RhdGUuaGF2ZSA8IHN0YXRlLm5jb2RlKSB7XG4gICAgICAgIC8vPT09IE5FRURCSVRTKDMpO1xuICAgICAgICB3aGlsZSAoYml0cyA8IDMpIHtcbiAgICAgICAgICBpZiAoaGF2ZSA9PT0gMCkgeyBicmVhayBpbmZfbGVhdmU7IH1cbiAgICAgICAgICBoYXZlLS07XG4gICAgICAgICAgaG9sZCArPSBpbnB1dFtuZXh0KytdIDw8IGJpdHM7XG4gICAgICAgICAgYml0cyArPSA4O1xuICAgICAgICB9XG4gICAgICAgIC8vPT09Ly9cbiAgICAgICAgc3RhdGUubGVuc1tvcmRlcltzdGF0ZS5oYXZlKytdXSA9IChob2xkICYgMHgwNyk7Ly9CSVRTKDMpO1xuICAgICAgICAvLy0tLSBEUk9QQklUUygzKSAtLS0vL1xuICAgICAgICBob2xkID4+Pj0gMztcbiAgICAgICAgYml0cyAtPSAzO1xuICAgICAgICAvLy0tLS8vXG4gICAgICB9XG4gICAgICB3aGlsZSAoc3RhdGUuaGF2ZSA8IDE5KSB7XG4gICAgICAgIHN0YXRlLmxlbnNbb3JkZXJbc3RhdGUuaGF2ZSsrXV0gPSAwO1xuICAgICAgfVxuICAgICAgLy8gV2UgaGF2ZSBzZXBhcmF0ZSB0YWJsZXMgJiBubyBwb2ludGVycy4gMiBjb21tZW50ZWQgbGluZXMgYmVsb3cgbm90IG5lZWRlZC5cbiAgICAgIC8vc3RhdGUubmV4dCA9IHN0YXRlLmNvZGVzO1xuICAgICAgLy9zdGF0ZS5sZW5jb2RlID0gc3RhdGUubmV4dDtcbiAgICAgIC8vIFN3aXRjaCB0byB1c2UgZHluYW1pYyB0YWJsZVxuICAgICAgc3RhdGUubGVuY29kZSA9IHN0YXRlLmxlbmR5bjtcbiAgICAgIHN0YXRlLmxlbmJpdHMgPSA3O1xuXG4gICAgICBvcHRzID0geyBiaXRzOiBzdGF0ZS5sZW5iaXRzIH07XG4gICAgICByZXQgPSBpbmZsYXRlX3RhYmxlKENPREVTLCBzdGF0ZS5sZW5zLCAwLCAxOSwgc3RhdGUubGVuY29kZSwgMCwgc3RhdGUud29yaywgb3B0cyk7XG4gICAgICBzdGF0ZS5sZW5iaXRzID0gb3B0cy5iaXRzO1xuXG4gICAgICBpZiAocmV0KSB7XG4gICAgICAgIHN0cm0ubXNnID0gJ2ludmFsaWQgY29kZSBsZW5ndGhzIHNldCc7XG4gICAgICAgIHN0YXRlLm1vZGUgPSBCQUQ7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgLy9UcmFjZXYoKHN0ZGVyciwgXCJpbmZsYXRlOiAgICAgICBjb2RlIGxlbmd0aHMgb2tcXG5cIikpO1xuICAgICAgc3RhdGUuaGF2ZSA9IDA7XG4gICAgICBzdGF0ZS5tb2RlID0gQ09ERUxFTlM7XG4gICAgICAvKiBmYWxscyB0aHJvdWdoICovXG4gICAgY2FzZSBDT0RFTEVOUzpcbiAgICAgIHdoaWxlIChzdGF0ZS5oYXZlIDwgc3RhdGUubmxlbiArIHN0YXRlLm5kaXN0KSB7XG4gICAgICAgIGZvciAoOzspIHtcbiAgICAgICAgICBoZXJlID0gc3RhdGUubGVuY29kZVtob2xkICYgKCgxIDw8IHN0YXRlLmxlbmJpdHMpIC0gMSldOy8qQklUUyhzdGF0ZS5sZW5iaXRzKSovXG4gICAgICAgICAgaGVyZV9iaXRzID0gaGVyZSA+Pj4gMjQ7XG4gICAgICAgICAgaGVyZV9vcCA9IChoZXJlID4+PiAxNikgJiAweGZmO1xuICAgICAgICAgIGhlcmVfdmFsID0gaGVyZSAmIDB4ZmZmZjtcblxuICAgICAgICAgIGlmICgoaGVyZV9iaXRzKSA8PSBiaXRzKSB7IGJyZWFrOyB9XG4gICAgICAgICAgLy8tLS0gUFVMTEJZVEUoKSAtLS0vL1xuICAgICAgICAgIGlmIChoYXZlID09PSAwKSB7IGJyZWFrIGluZl9sZWF2ZTsgfVxuICAgICAgICAgIGhhdmUtLTtcbiAgICAgICAgICBob2xkICs9IGlucHV0W25leHQrK10gPDwgYml0cztcbiAgICAgICAgICBiaXRzICs9IDg7XG4gICAgICAgICAgLy8tLS0vL1xuICAgICAgICB9XG4gICAgICAgIGlmIChoZXJlX3ZhbCA8IDE2KSB7XG4gICAgICAgICAgLy8tLS0gRFJPUEJJVFMoaGVyZS5iaXRzKSAtLS0vL1xuICAgICAgICAgIGhvbGQgPj4+PSBoZXJlX2JpdHM7XG4gICAgICAgICAgYml0cyAtPSBoZXJlX2JpdHM7XG4gICAgICAgICAgLy8tLS0vL1xuICAgICAgICAgIHN0YXRlLmxlbnNbc3RhdGUuaGF2ZSsrXSA9IGhlcmVfdmFsO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGlmIChoZXJlX3ZhbCA9PT0gMTYpIHtcbiAgICAgICAgICAgIC8vPT09IE5FRURCSVRTKGhlcmUuYml0cyArIDIpO1xuICAgICAgICAgICAgbiA9IGhlcmVfYml0cyArIDI7XG4gICAgICAgICAgICB3aGlsZSAoYml0cyA8IG4pIHtcbiAgICAgICAgICAgICAgaWYgKGhhdmUgPT09IDApIHsgYnJlYWsgaW5mX2xlYXZlOyB9XG4gICAgICAgICAgICAgIGhhdmUtLTtcbiAgICAgICAgICAgICAgaG9sZCArPSBpbnB1dFtuZXh0KytdIDw8IGJpdHM7XG4gICAgICAgICAgICAgIGJpdHMgKz0gODtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vPT09Ly9cbiAgICAgICAgICAgIC8vLS0tIERST1BCSVRTKGhlcmUuYml0cykgLS0tLy9cbiAgICAgICAgICAgIGhvbGQgPj4+PSBoZXJlX2JpdHM7XG4gICAgICAgICAgICBiaXRzIC09IGhlcmVfYml0cztcbiAgICAgICAgICAgIC8vLS0tLy9cbiAgICAgICAgICAgIGlmIChzdGF0ZS5oYXZlID09PSAwKSB7XG4gICAgICAgICAgICAgIHN0cm0ubXNnID0gJ2ludmFsaWQgYml0IGxlbmd0aCByZXBlYXQnO1xuICAgICAgICAgICAgICBzdGF0ZS5tb2RlID0gQkFEO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxlbiA9IHN0YXRlLmxlbnNbc3RhdGUuaGF2ZSAtIDFdO1xuICAgICAgICAgICAgY29weSA9IDMgKyAoaG9sZCAmIDB4MDMpOy8vQklUUygyKTtcbiAgICAgICAgICAgIC8vLS0tIERST1BCSVRTKDIpIC0tLS8vXG4gICAgICAgICAgICBob2xkID4+Pj0gMjtcbiAgICAgICAgICAgIGJpdHMgLT0gMjtcbiAgICAgICAgICAgIC8vLS0tLy9cbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSBpZiAoaGVyZV92YWwgPT09IDE3KSB7XG4gICAgICAgICAgICAvLz09PSBORUVEQklUUyhoZXJlLmJpdHMgKyAzKTtcbiAgICAgICAgICAgIG4gPSBoZXJlX2JpdHMgKyAzO1xuICAgICAgICAgICAgd2hpbGUgKGJpdHMgPCBuKSB7XG4gICAgICAgICAgICAgIGlmIChoYXZlID09PSAwKSB7IGJyZWFrIGluZl9sZWF2ZTsgfVxuICAgICAgICAgICAgICBoYXZlLS07XG4gICAgICAgICAgICAgIGhvbGQgKz0gaW5wdXRbbmV4dCsrXSA8PCBiaXRzO1xuICAgICAgICAgICAgICBiaXRzICs9IDg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLz09PS8vXG4gICAgICAgICAgICAvLy0tLSBEUk9QQklUUyhoZXJlLmJpdHMpIC0tLS8vXG4gICAgICAgICAgICBob2xkID4+Pj0gaGVyZV9iaXRzO1xuICAgICAgICAgICAgYml0cyAtPSBoZXJlX2JpdHM7XG4gICAgICAgICAgICAvLy0tLS8vXG4gICAgICAgICAgICBsZW4gPSAwO1xuICAgICAgICAgICAgY29weSA9IDMgKyAoaG9sZCAmIDB4MDcpOy8vQklUUygzKTtcbiAgICAgICAgICAgIC8vLS0tIERST1BCSVRTKDMpIC0tLS8vXG4gICAgICAgICAgICBob2xkID4+Pj0gMztcbiAgICAgICAgICAgIGJpdHMgLT0gMztcbiAgICAgICAgICAgIC8vLS0tLy9cbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLz09PSBORUVEQklUUyhoZXJlLmJpdHMgKyA3KTtcbiAgICAgICAgICAgIG4gPSBoZXJlX2JpdHMgKyA3O1xuICAgICAgICAgICAgd2hpbGUgKGJpdHMgPCBuKSB7XG4gICAgICAgICAgICAgIGlmIChoYXZlID09PSAwKSB7IGJyZWFrIGluZl9sZWF2ZTsgfVxuICAgICAgICAgICAgICBoYXZlLS07XG4gICAgICAgICAgICAgIGhvbGQgKz0gaW5wdXRbbmV4dCsrXSA8PCBiaXRzO1xuICAgICAgICAgICAgICBiaXRzICs9IDg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLz09PS8vXG4gICAgICAgICAgICAvLy0tLSBEUk9QQklUUyhoZXJlLmJpdHMpIC0tLS8vXG4gICAgICAgICAgICBob2xkID4+Pj0gaGVyZV9iaXRzO1xuICAgICAgICAgICAgYml0cyAtPSBoZXJlX2JpdHM7XG4gICAgICAgICAgICAvLy0tLS8vXG4gICAgICAgICAgICBsZW4gPSAwO1xuICAgICAgICAgICAgY29weSA9IDExICsgKGhvbGQgJiAweDdmKTsvL0JJVFMoNyk7XG4gICAgICAgICAgICAvLy0tLSBEUk9QQklUUyg3KSAtLS0vL1xuICAgICAgICAgICAgaG9sZCA+Pj49IDc7XG4gICAgICAgICAgICBiaXRzIC09IDc7XG4gICAgICAgICAgICAvLy0tLS8vXG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChzdGF0ZS5oYXZlICsgY29weSA+IHN0YXRlLm5sZW4gKyBzdGF0ZS5uZGlzdCkge1xuICAgICAgICAgICAgc3RybS5tc2cgPSAnaW52YWxpZCBiaXQgbGVuZ3RoIHJlcGVhdCc7XG4gICAgICAgICAgICBzdGF0ZS5tb2RlID0gQkFEO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICAgIHdoaWxlIChjb3B5LS0pIHtcbiAgICAgICAgICAgIHN0YXRlLmxlbnNbc3RhdGUuaGF2ZSsrXSA9IGxlbjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLyogaGFuZGxlIGVycm9yIGJyZWFrcyBpbiB3aGlsZSAqL1xuICAgICAgaWYgKHN0YXRlLm1vZGUgPT09IEJBRCkgeyBicmVhazsgfVxuXG4gICAgICAvKiBjaGVjayBmb3IgZW5kLW9mLWJsb2NrIGNvZGUgKGJldHRlciBoYXZlIG9uZSkgKi9cbiAgICAgIGlmIChzdGF0ZS5sZW5zWzI1Nl0gPT09IDApIHtcbiAgICAgICAgc3RybS5tc2cgPSAnaW52YWxpZCBjb2RlIC0tIG1pc3NpbmcgZW5kLW9mLWJsb2NrJztcbiAgICAgICAgc3RhdGUubW9kZSA9IEJBRDtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIC8qIGJ1aWxkIGNvZGUgdGFibGVzIC0tIG5vdGU6IGRvIG5vdCBjaGFuZ2UgdGhlIGxlbmJpdHMgb3IgZGlzdGJpdHNcbiAgICAgICAgIHZhbHVlcyBoZXJlICg5IGFuZCA2KSB3aXRob3V0IHJlYWRpbmcgdGhlIGNvbW1lbnRzIGluIGluZnRyZWVzLmhcbiAgICAgICAgIGNvbmNlcm5pbmcgdGhlIEVOT1VHSCBjb25zdGFudHMsIHdoaWNoIGRlcGVuZCBvbiB0aG9zZSB2YWx1ZXMgKi9cbiAgICAgIHN0YXRlLmxlbmJpdHMgPSA5O1xuXG4gICAgICBvcHRzID0geyBiaXRzOiBzdGF0ZS5sZW5iaXRzIH07XG4gICAgICByZXQgPSBpbmZsYXRlX3RhYmxlKExFTlMsIHN0YXRlLmxlbnMsIDAsIHN0YXRlLm5sZW4sIHN0YXRlLmxlbmNvZGUsIDAsIHN0YXRlLndvcmssIG9wdHMpO1xuICAgICAgLy8gV2UgaGF2ZSBzZXBhcmF0ZSB0YWJsZXMgJiBubyBwb2ludGVycy4gMiBjb21tZW50ZWQgbGluZXMgYmVsb3cgbm90IG5lZWRlZC5cbiAgICAgIC8vIHN0YXRlLm5leHRfaW5kZXggPSBvcHRzLnRhYmxlX2luZGV4O1xuICAgICAgc3RhdGUubGVuYml0cyA9IG9wdHMuYml0cztcbiAgICAgIC8vIHN0YXRlLmxlbmNvZGUgPSBzdGF0ZS5uZXh0O1xuXG4gICAgICBpZiAocmV0KSB7XG4gICAgICAgIHN0cm0ubXNnID0gJ2ludmFsaWQgbGl0ZXJhbC9sZW5ndGhzIHNldCc7XG4gICAgICAgIHN0YXRlLm1vZGUgPSBCQUQ7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBzdGF0ZS5kaXN0Yml0cyA9IDY7XG4gICAgICAvL3N0YXRlLmRpc3Rjb2RlLmNvcHkoc3RhdGUuY29kZXMpO1xuICAgICAgLy8gU3dpdGNoIHRvIHVzZSBkeW5hbWljIHRhYmxlXG4gICAgICBzdGF0ZS5kaXN0Y29kZSA9IHN0YXRlLmRpc3RkeW47XG4gICAgICBvcHRzID0geyBiaXRzOiBzdGF0ZS5kaXN0Yml0cyB9O1xuICAgICAgcmV0ID0gaW5mbGF0ZV90YWJsZShESVNUUywgc3RhdGUubGVucywgc3RhdGUubmxlbiwgc3RhdGUubmRpc3QsIHN0YXRlLmRpc3Rjb2RlLCAwLCBzdGF0ZS53b3JrLCBvcHRzKTtcbiAgICAgIC8vIFdlIGhhdmUgc2VwYXJhdGUgdGFibGVzICYgbm8gcG9pbnRlcnMuIDIgY29tbWVudGVkIGxpbmVzIGJlbG93IG5vdCBuZWVkZWQuXG4gICAgICAvLyBzdGF0ZS5uZXh0X2luZGV4ID0gb3B0cy50YWJsZV9pbmRleDtcbiAgICAgIHN0YXRlLmRpc3RiaXRzID0gb3B0cy5iaXRzO1xuICAgICAgLy8gc3RhdGUuZGlzdGNvZGUgPSBzdGF0ZS5uZXh0O1xuXG4gICAgICBpZiAocmV0KSB7XG4gICAgICAgIHN0cm0ubXNnID0gJ2ludmFsaWQgZGlzdGFuY2VzIHNldCc7XG4gICAgICAgIHN0YXRlLm1vZGUgPSBCQUQ7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgLy9UcmFjZXYoKHN0ZGVyciwgJ2luZmxhdGU6ICAgICAgIGNvZGVzIG9rXFxuJykpO1xuICAgICAgc3RhdGUubW9kZSA9IExFTl87XG4gICAgICBpZiAoZmx1c2ggPT09IFpfVFJFRVMpIHsgYnJlYWsgaW5mX2xlYXZlOyB9XG4gICAgICAvKiBmYWxscyB0aHJvdWdoICovXG4gICAgY2FzZSBMRU5fOlxuICAgICAgc3RhdGUubW9kZSA9IExFTjtcbiAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICBjYXNlIExFTjpcbiAgICAgIGlmIChoYXZlID49IDYgJiYgbGVmdCA+PSAyNTgpIHtcbiAgICAgICAgLy8tLS0gUkVTVE9SRSgpIC0tLVxuICAgICAgICBzdHJtLm5leHRfb3V0ID0gcHV0O1xuICAgICAgICBzdHJtLmF2YWlsX291dCA9IGxlZnQ7XG4gICAgICAgIHN0cm0ubmV4dF9pbiA9IG5leHQ7XG4gICAgICAgIHN0cm0uYXZhaWxfaW4gPSBoYXZlO1xuICAgICAgICBzdGF0ZS5ob2xkID0gaG9sZDtcbiAgICAgICAgc3RhdGUuYml0cyA9IGJpdHM7XG4gICAgICAgIC8vLS0tXG4gICAgICAgIGluZmxhdGVfZmFzdChzdHJtLCBfb3V0KTtcbiAgICAgICAgLy8tLS0gTE9BRCgpIC0tLVxuICAgICAgICBwdXQgPSBzdHJtLm5leHRfb3V0O1xuICAgICAgICBvdXRwdXQgPSBzdHJtLm91dHB1dDtcbiAgICAgICAgbGVmdCA9IHN0cm0uYXZhaWxfb3V0O1xuICAgICAgICBuZXh0ID0gc3RybS5uZXh0X2luO1xuICAgICAgICBpbnB1dCA9IHN0cm0uaW5wdXQ7XG4gICAgICAgIGhhdmUgPSBzdHJtLmF2YWlsX2luO1xuICAgICAgICBob2xkID0gc3RhdGUuaG9sZDtcbiAgICAgICAgYml0cyA9IHN0YXRlLmJpdHM7XG4gICAgICAgIC8vLS0tXG5cbiAgICAgICAgaWYgKHN0YXRlLm1vZGUgPT09IFRZUEUpIHtcbiAgICAgICAgICBzdGF0ZS5iYWNrID0gLTE7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBzdGF0ZS5iYWNrID0gMDtcbiAgICAgIGZvciAoOzspIHtcbiAgICAgICAgaGVyZSA9IHN0YXRlLmxlbmNvZGVbaG9sZCAmICgoMSA8PCBzdGF0ZS5sZW5iaXRzKSAtIDEpXTsgIC8qQklUUyhzdGF0ZS5sZW5iaXRzKSovXG4gICAgICAgIGhlcmVfYml0cyA9IGhlcmUgPj4+IDI0O1xuICAgICAgICBoZXJlX29wID0gKGhlcmUgPj4+IDE2KSAmIDB4ZmY7XG4gICAgICAgIGhlcmVfdmFsID0gaGVyZSAmIDB4ZmZmZjtcblxuICAgICAgICBpZiAoaGVyZV9iaXRzIDw9IGJpdHMpIHsgYnJlYWs7IH1cbiAgICAgICAgLy8tLS0gUFVMTEJZVEUoKSAtLS0vL1xuICAgICAgICBpZiAoaGF2ZSA9PT0gMCkgeyBicmVhayBpbmZfbGVhdmU7IH1cbiAgICAgICAgaGF2ZS0tO1xuICAgICAgICBob2xkICs9IGlucHV0W25leHQrK10gPDwgYml0cztcbiAgICAgICAgYml0cyArPSA4O1xuICAgICAgICAvLy0tLS8vXG4gICAgICB9XG4gICAgICBpZiAoaGVyZV9vcCAmJiAoaGVyZV9vcCAmIDB4ZjApID09PSAwKSB7XG4gICAgICAgIGxhc3RfYml0cyA9IGhlcmVfYml0cztcbiAgICAgICAgbGFzdF9vcCA9IGhlcmVfb3A7XG4gICAgICAgIGxhc3RfdmFsID0gaGVyZV92YWw7XG4gICAgICAgIGZvciAoOzspIHtcbiAgICAgICAgICBoZXJlID0gc3RhdGUubGVuY29kZVtsYXN0X3ZhbCArXG4gICAgICAgICAgICAgICAgICAoKGhvbGQgJiAoKDEgPDwgKGxhc3RfYml0cyArIGxhc3Rfb3ApKSAtIDEpKS8qQklUUyhsYXN0LmJpdHMgKyBsYXN0Lm9wKSovID4+IGxhc3RfYml0cyldO1xuICAgICAgICAgIGhlcmVfYml0cyA9IGhlcmUgPj4+IDI0O1xuICAgICAgICAgIGhlcmVfb3AgPSAoaGVyZSA+Pj4gMTYpICYgMHhmZjtcbiAgICAgICAgICBoZXJlX3ZhbCA9IGhlcmUgJiAweGZmZmY7XG5cbiAgICAgICAgICBpZiAoKGxhc3RfYml0cyArIGhlcmVfYml0cykgPD0gYml0cykgeyBicmVhazsgfVxuICAgICAgICAgIC8vLS0tIFBVTExCWVRFKCkgLS0tLy9cbiAgICAgICAgICBpZiAoaGF2ZSA9PT0gMCkgeyBicmVhayBpbmZfbGVhdmU7IH1cbiAgICAgICAgICBoYXZlLS07XG4gICAgICAgICAgaG9sZCArPSBpbnB1dFtuZXh0KytdIDw8IGJpdHM7XG4gICAgICAgICAgYml0cyArPSA4O1xuICAgICAgICAgIC8vLS0tLy9cbiAgICAgICAgfVxuICAgICAgICAvLy0tLSBEUk9QQklUUyhsYXN0LmJpdHMpIC0tLS8vXG4gICAgICAgIGhvbGQgPj4+PSBsYXN0X2JpdHM7XG4gICAgICAgIGJpdHMgLT0gbGFzdF9iaXRzO1xuICAgICAgICAvLy0tLS8vXG4gICAgICAgIHN0YXRlLmJhY2sgKz0gbGFzdF9iaXRzO1xuICAgICAgfVxuICAgICAgLy8tLS0gRFJPUEJJVFMoaGVyZS5iaXRzKSAtLS0vL1xuICAgICAgaG9sZCA+Pj49IGhlcmVfYml0cztcbiAgICAgIGJpdHMgLT0gaGVyZV9iaXRzO1xuICAgICAgLy8tLS0vL1xuICAgICAgc3RhdGUuYmFjayArPSBoZXJlX2JpdHM7XG4gICAgICBzdGF0ZS5sZW5ndGggPSBoZXJlX3ZhbDtcbiAgICAgIGlmIChoZXJlX29wID09PSAwKSB7XG4gICAgICAgIC8vVHJhY2V2digoc3RkZXJyLCBoZXJlLnZhbCA+PSAweDIwICYmIGhlcmUudmFsIDwgMHg3ZiA/XG4gICAgICAgIC8vICAgICAgICBcImluZmxhdGU6ICAgICAgICAgbGl0ZXJhbCAnJWMnXFxuXCIgOlxuICAgICAgICAvLyAgICAgICAgXCJpbmZsYXRlOiAgICAgICAgIGxpdGVyYWwgMHglMDJ4XFxuXCIsIGhlcmUudmFsKSk7XG4gICAgICAgIHN0YXRlLm1vZGUgPSBMSVQ7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgaWYgKGhlcmVfb3AgJiAzMikge1xuICAgICAgICAvL1RyYWNldnYoKHN0ZGVyciwgXCJpbmZsYXRlOiAgICAgICAgIGVuZCBvZiBibG9ja1xcblwiKSk7XG4gICAgICAgIHN0YXRlLmJhY2sgPSAtMTtcbiAgICAgICAgc3RhdGUubW9kZSA9IFRZUEU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgaWYgKGhlcmVfb3AgJiA2NCkge1xuICAgICAgICBzdHJtLm1zZyA9ICdpbnZhbGlkIGxpdGVyYWwvbGVuZ3RoIGNvZGUnO1xuICAgICAgICBzdGF0ZS5tb2RlID0gQkFEO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIHN0YXRlLmV4dHJhID0gaGVyZV9vcCAmIDE1O1xuICAgICAgc3RhdGUubW9kZSA9IExFTkVYVDtcbiAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICBjYXNlIExFTkVYVDpcbiAgICAgIGlmIChzdGF0ZS5leHRyYSkge1xuICAgICAgICAvLz09PSBORUVEQklUUyhzdGF0ZS5leHRyYSk7XG4gICAgICAgIG4gPSBzdGF0ZS5leHRyYTtcbiAgICAgICAgd2hpbGUgKGJpdHMgPCBuKSB7XG4gICAgICAgICAgaWYgKGhhdmUgPT09IDApIHsgYnJlYWsgaW5mX2xlYXZlOyB9XG4gICAgICAgICAgaGF2ZS0tO1xuICAgICAgICAgIGhvbGQgKz0gaW5wdXRbbmV4dCsrXSA8PCBiaXRzO1xuICAgICAgICAgIGJpdHMgKz0gODtcbiAgICAgICAgfVxuICAgICAgICAvLz09PS8vXG4gICAgICAgIHN0YXRlLmxlbmd0aCArPSBob2xkICYgKCgxIDw8IHN0YXRlLmV4dHJhKSAtIDEpLypCSVRTKHN0YXRlLmV4dHJhKSovO1xuICAgICAgICAvLy0tLSBEUk9QQklUUyhzdGF0ZS5leHRyYSkgLS0tLy9cbiAgICAgICAgaG9sZCA+Pj49IHN0YXRlLmV4dHJhO1xuICAgICAgICBiaXRzIC09IHN0YXRlLmV4dHJhO1xuICAgICAgICAvLy0tLS8vXG4gICAgICAgIHN0YXRlLmJhY2sgKz0gc3RhdGUuZXh0cmE7XG4gICAgICB9XG4gICAgICAvL1RyYWNldnYoKHN0ZGVyciwgXCJpbmZsYXRlOiAgICAgICAgIGxlbmd0aCAldVxcblwiLCBzdGF0ZS5sZW5ndGgpKTtcbiAgICAgIHN0YXRlLndhcyA9IHN0YXRlLmxlbmd0aDtcbiAgICAgIHN0YXRlLm1vZGUgPSBESVNUO1xuICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgIGNhc2UgRElTVDpcbiAgICAgIGZvciAoOzspIHtcbiAgICAgICAgaGVyZSA9IHN0YXRlLmRpc3Rjb2RlW2hvbGQgJiAoKDEgPDwgc3RhdGUuZGlzdGJpdHMpIC0gMSldOy8qQklUUyhzdGF0ZS5kaXN0Yml0cykqL1xuICAgICAgICBoZXJlX2JpdHMgPSBoZXJlID4+PiAyNDtcbiAgICAgICAgaGVyZV9vcCA9IChoZXJlID4+PiAxNikgJiAweGZmO1xuICAgICAgICBoZXJlX3ZhbCA9IGhlcmUgJiAweGZmZmY7XG5cbiAgICAgICAgaWYgKChoZXJlX2JpdHMpIDw9IGJpdHMpIHsgYnJlYWs7IH1cbiAgICAgICAgLy8tLS0gUFVMTEJZVEUoKSAtLS0vL1xuICAgICAgICBpZiAoaGF2ZSA9PT0gMCkgeyBicmVhayBpbmZfbGVhdmU7IH1cbiAgICAgICAgaGF2ZS0tO1xuICAgICAgICBob2xkICs9IGlucHV0W25leHQrK10gPDwgYml0cztcbiAgICAgICAgYml0cyArPSA4O1xuICAgICAgICAvLy0tLS8vXG4gICAgICB9XG4gICAgICBpZiAoKGhlcmVfb3AgJiAweGYwKSA9PT0gMCkge1xuICAgICAgICBsYXN0X2JpdHMgPSBoZXJlX2JpdHM7XG4gICAgICAgIGxhc3Rfb3AgPSBoZXJlX29wO1xuICAgICAgICBsYXN0X3ZhbCA9IGhlcmVfdmFsO1xuICAgICAgICBmb3IgKDs7KSB7XG4gICAgICAgICAgaGVyZSA9IHN0YXRlLmRpc3Rjb2RlW2xhc3RfdmFsICtcbiAgICAgICAgICAgICAgICAgICgoaG9sZCAmICgoMSA8PCAobGFzdF9iaXRzICsgbGFzdF9vcCkpIC0gMSkpLypCSVRTKGxhc3QuYml0cyArIGxhc3Qub3ApKi8gPj4gbGFzdF9iaXRzKV07XG4gICAgICAgICAgaGVyZV9iaXRzID0gaGVyZSA+Pj4gMjQ7XG4gICAgICAgICAgaGVyZV9vcCA9IChoZXJlID4+PiAxNikgJiAweGZmO1xuICAgICAgICAgIGhlcmVfdmFsID0gaGVyZSAmIDB4ZmZmZjtcblxuICAgICAgICAgIGlmICgobGFzdF9iaXRzICsgaGVyZV9iaXRzKSA8PSBiaXRzKSB7IGJyZWFrOyB9XG4gICAgICAgICAgLy8tLS0gUFVMTEJZVEUoKSAtLS0vL1xuICAgICAgICAgIGlmIChoYXZlID09PSAwKSB7IGJyZWFrIGluZl9sZWF2ZTsgfVxuICAgICAgICAgIGhhdmUtLTtcbiAgICAgICAgICBob2xkICs9IGlucHV0W25leHQrK10gPDwgYml0cztcbiAgICAgICAgICBiaXRzICs9IDg7XG4gICAgICAgICAgLy8tLS0vL1xuICAgICAgICB9XG4gICAgICAgIC8vLS0tIERST1BCSVRTKGxhc3QuYml0cykgLS0tLy9cbiAgICAgICAgaG9sZCA+Pj49IGxhc3RfYml0cztcbiAgICAgICAgYml0cyAtPSBsYXN0X2JpdHM7XG4gICAgICAgIC8vLS0tLy9cbiAgICAgICAgc3RhdGUuYmFjayArPSBsYXN0X2JpdHM7XG4gICAgICB9XG4gICAgICAvLy0tLSBEUk9QQklUUyhoZXJlLmJpdHMpIC0tLS8vXG4gICAgICBob2xkID4+Pj0gaGVyZV9iaXRzO1xuICAgICAgYml0cyAtPSBoZXJlX2JpdHM7XG4gICAgICAvLy0tLS8vXG4gICAgICBzdGF0ZS5iYWNrICs9IGhlcmVfYml0cztcbiAgICAgIGlmIChoZXJlX29wICYgNjQpIHtcbiAgICAgICAgc3RybS5tc2cgPSAnaW52YWxpZCBkaXN0YW5jZSBjb2RlJztcbiAgICAgICAgc3RhdGUubW9kZSA9IEJBRDtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBzdGF0ZS5vZmZzZXQgPSBoZXJlX3ZhbDtcbiAgICAgIHN0YXRlLmV4dHJhID0gKGhlcmVfb3ApICYgMTU7XG4gICAgICBzdGF0ZS5tb2RlID0gRElTVEVYVDtcbiAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICBjYXNlIERJU1RFWFQ6XG4gICAgICBpZiAoc3RhdGUuZXh0cmEpIHtcbiAgICAgICAgLy89PT0gTkVFREJJVFMoc3RhdGUuZXh0cmEpO1xuICAgICAgICBuID0gc3RhdGUuZXh0cmE7XG4gICAgICAgIHdoaWxlIChiaXRzIDwgbikge1xuICAgICAgICAgIGlmIChoYXZlID09PSAwKSB7IGJyZWFrIGluZl9sZWF2ZTsgfVxuICAgICAgICAgIGhhdmUtLTtcbiAgICAgICAgICBob2xkICs9IGlucHV0W25leHQrK10gPDwgYml0cztcbiAgICAgICAgICBiaXRzICs9IDg7XG4gICAgICAgIH1cbiAgICAgICAgLy89PT0vL1xuICAgICAgICBzdGF0ZS5vZmZzZXQgKz0gaG9sZCAmICgoMSA8PCBzdGF0ZS5leHRyYSkgLSAxKS8qQklUUyhzdGF0ZS5leHRyYSkqLztcbiAgICAgICAgLy8tLS0gRFJPUEJJVFMoc3RhdGUuZXh0cmEpIC0tLS8vXG4gICAgICAgIGhvbGQgPj4+PSBzdGF0ZS5leHRyYTtcbiAgICAgICAgYml0cyAtPSBzdGF0ZS5leHRyYTtcbiAgICAgICAgLy8tLS0vL1xuICAgICAgICBzdGF0ZS5iYWNrICs9IHN0YXRlLmV4dHJhO1xuICAgICAgfVxuLy8jaWZkZWYgSU5GTEFURV9TVFJJQ1RcbiAgICAgIGlmIChzdGF0ZS5vZmZzZXQgPiBzdGF0ZS5kbWF4KSB7XG4gICAgICAgIHN0cm0ubXNnID0gJ2ludmFsaWQgZGlzdGFuY2UgdG9vIGZhciBiYWNrJztcbiAgICAgICAgc3RhdGUubW9kZSA9IEJBRDtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4vLyNlbmRpZlxuICAgICAgLy9UcmFjZXZ2KChzdGRlcnIsIFwiaW5mbGF0ZTogICAgICAgICBkaXN0YW5jZSAldVxcblwiLCBzdGF0ZS5vZmZzZXQpKTtcbiAgICAgIHN0YXRlLm1vZGUgPSBNQVRDSDtcbiAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICBjYXNlIE1BVENIOlxuICAgICAgaWYgKGxlZnQgPT09IDApIHsgYnJlYWsgaW5mX2xlYXZlOyB9XG4gICAgICBjb3B5ID0gX291dCAtIGxlZnQ7XG4gICAgICBpZiAoc3RhdGUub2Zmc2V0ID4gY29weSkgeyAgICAgICAgIC8qIGNvcHkgZnJvbSB3aW5kb3cgKi9cbiAgICAgICAgY29weSA9IHN0YXRlLm9mZnNldCAtIGNvcHk7XG4gICAgICAgIGlmIChjb3B5ID4gc3RhdGUud2hhdmUpIHtcbiAgICAgICAgICBpZiAoc3RhdGUuc2FuZSkge1xuICAgICAgICAgICAgc3RybS5tc2cgPSAnaW52YWxpZCBkaXN0YW5jZSB0b28gZmFyIGJhY2snO1xuICAgICAgICAgICAgc3RhdGUubW9kZSA9IEJBRDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbi8vICghKSBUaGlzIGJsb2NrIGlzIGRpc2FibGVkIGluIHpsaWIgZGVmYWlsdHMsXG4vLyBkb24ndCBlbmFibGUgaXQgZm9yIGJpbmFyeSBjb21wYXRpYmlsaXR5XG4vLyNpZmRlZiBJTkZMQVRFX0FMTE9XX0lOVkFMSURfRElTVEFOQ0VfVE9PRkFSX0FSUlJcbi8vICAgICAgICAgIFRyYWNlKChzdGRlcnIsIFwiaW5mbGF0ZS5jIHRvbyBmYXJcXG5cIikpO1xuLy8gICAgICAgICAgY29weSAtPSBzdGF0ZS53aGF2ZTtcbi8vICAgICAgICAgIGlmIChjb3B5ID4gc3RhdGUubGVuZ3RoKSB7IGNvcHkgPSBzdGF0ZS5sZW5ndGg7IH1cbi8vICAgICAgICAgIGlmIChjb3B5ID4gbGVmdCkgeyBjb3B5ID0gbGVmdDsgfVxuLy8gICAgICAgICAgbGVmdCAtPSBjb3B5O1xuLy8gICAgICAgICAgc3RhdGUubGVuZ3RoIC09IGNvcHk7XG4vLyAgICAgICAgICBkbyB7XG4vLyAgICAgICAgICAgIG91dHB1dFtwdXQrK10gPSAwO1xuLy8gICAgICAgICAgfSB3aGlsZSAoLS1jb3B5KTtcbi8vICAgICAgICAgIGlmIChzdGF0ZS5sZW5ndGggPT09IDApIHsgc3RhdGUubW9kZSA9IExFTjsgfVxuLy8gICAgICAgICAgYnJlYWs7XG4vLyNlbmRpZlxuICAgICAgICB9XG4gICAgICAgIGlmIChjb3B5ID4gc3RhdGUud25leHQpIHtcbiAgICAgICAgICBjb3B5IC09IHN0YXRlLnduZXh0O1xuICAgICAgICAgIGZyb20gPSBzdGF0ZS53c2l6ZSAtIGNvcHk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgZnJvbSA9IHN0YXRlLnduZXh0IC0gY29weTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29weSA+IHN0YXRlLmxlbmd0aCkgeyBjb3B5ID0gc3RhdGUubGVuZ3RoOyB9XG4gICAgICAgIGZyb21fc291cmNlID0gc3RhdGUud2luZG93O1xuICAgICAgfVxuICAgICAgZWxzZSB7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogY29weSBmcm9tIG91dHB1dCAqL1xuICAgICAgICBmcm9tX3NvdXJjZSA9IG91dHB1dDtcbiAgICAgICAgZnJvbSA9IHB1dCAtIHN0YXRlLm9mZnNldDtcbiAgICAgICAgY29weSA9IHN0YXRlLmxlbmd0aDtcbiAgICAgIH1cbiAgICAgIGlmIChjb3B5ID4gbGVmdCkgeyBjb3B5ID0gbGVmdDsgfVxuICAgICAgbGVmdCAtPSBjb3B5O1xuICAgICAgc3RhdGUubGVuZ3RoIC09IGNvcHk7XG4gICAgICBkbyB7XG4gICAgICAgIG91dHB1dFtwdXQrK10gPSBmcm9tX3NvdXJjZVtmcm9tKytdO1xuICAgICAgfSB3aGlsZSAoLS1jb3B5KTtcbiAgICAgIGlmIChzdGF0ZS5sZW5ndGggPT09IDApIHsgc3RhdGUubW9kZSA9IExFTjsgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSBMSVQ6XG4gICAgICBpZiAobGVmdCA9PT0gMCkgeyBicmVhayBpbmZfbGVhdmU7IH1cbiAgICAgIG91dHB1dFtwdXQrK10gPSBzdGF0ZS5sZW5ndGg7XG4gICAgICBsZWZ0LS07XG4gICAgICBzdGF0ZS5tb2RlID0gTEVOO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBDSEVDSzpcbiAgICAgIGlmIChzdGF0ZS53cmFwKSB7XG4gICAgICAgIC8vPT09IE5FRURCSVRTKDMyKTtcbiAgICAgICAgd2hpbGUgKGJpdHMgPCAzMikge1xuICAgICAgICAgIGlmIChoYXZlID09PSAwKSB7IGJyZWFrIGluZl9sZWF2ZTsgfVxuICAgICAgICAgIGhhdmUtLTtcbiAgICAgICAgICAvLyBVc2UgJ3wnIGluc2RlYWQgb2YgJysnIHRvIG1ha2Ugc3VyZSB0aGF0IHJlc3VsdCBpcyBzaWduZWRcbiAgICAgICAgICBob2xkIHw9IGlucHV0W25leHQrK10gPDwgYml0cztcbiAgICAgICAgICBiaXRzICs9IDg7XG4gICAgICAgIH1cbiAgICAgICAgLy89PT0vL1xuICAgICAgICBfb3V0IC09IGxlZnQ7XG4gICAgICAgIHN0cm0udG90YWxfb3V0ICs9IF9vdXQ7XG4gICAgICAgIHN0YXRlLnRvdGFsICs9IF9vdXQ7XG4gICAgICAgIGlmIChfb3V0KSB7XG4gICAgICAgICAgc3RybS5hZGxlciA9IHN0YXRlLmNoZWNrID1cbiAgICAgICAgICAgICAgLypVUERBVEUoc3RhdGUuY2hlY2ssIHB1dCAtIF9vdXQsIF9vdXQpOyovXG4gICAgICAgICAgICAgIChzdGF0ZS5mbGFncyA/IGNyYzMyKHN0YXRlLmNoZWNrLCBvdXRwdXQsIF9vdXQsIHB1dCAtIF9vdXQpIDogYWRsZXIzMihzdGF0ZS5jaGVjaywgb3V0cHV0LCBfb3V0LCBwdXQgLSBfb3V0KSk7XG5cbiAgICAgICAgfVxuICAgICAgICBfb3V0ID0gbGVmdDtcbiAgICAgICAgLy8gTkI6IGNyYzMyIHN0b3JlZCBhcyBzaWduZWQgMzItYml0IGludCwgenN3YXAzMiByZXR1cm5zIHNpZ25lZCB0b29cbiAgICAgICAgaWYgKChzdGF0ZS5mbGFncyA/IGhvbGQgOiB6c3dhcDMyKGhvbGQpKSAhPT0gc3RhdGUuY2hlY2spIHtcbiAgICAgICAgICBzdHJtLm1zZyA9ICdpbmNvcnJlY3QgZGF0YSBjaGVjayc7XG4gICAgICAgICAgc3RhdGUubW9kZSA9IEJBRDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICAvLz09PSBJTklUQklUUygpO1xuICAgICAgICBob2xkID0gMDtcbiAgICAgICAgYml0cyA9IDA7XG4gICAgICAgIC8vPT09Ly9cbiAgICAgICAgLy9UcmFjZXYoKHN0ZGVyciwgXCJpbmZsYXRlOiAgIGNoZWNrIG1hdGNoZXMgdHJhaWxlclxcblwiKSk7XG4gICAgICB9XG4gICAgICBzdGF0ZS5tb2RlID0gTEVOR1RIO1xuICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgIGNhc2UgTEVOR1RIOlxuICAgICAgaWYgKHN0YXRlLndyYXAgJiYgc3RhdGUuZmxhZ3MpIHtcbiAgICAgICAgLy89PT0gTkVFREJJVFMoMzIpO1xuICAgICAgICB3aGlsZSAoYml0cyA8IDMyKSB7XG4gICAgICAgICAgaWYgKGhhdmUgPT09IDApIHsgYnJlYWsgaW5mX2xlYXZlOyB9XG4gICAgICAgICAgaGF2ZS0tO1xuICAgICAgICAgIGhvbGQgKz0gaW5wdXRbbmV4dCsrXSA8PCBiaXRzO1xuICAgICAgICAgIGJpdHMgKz0gODtcbiAgICAgICAgfVxuICAgICAgICAvLz09PS8vXG4gICAgICAgIGlmIChob2xkICE9PSAoc3RhdGUudG90YWwgJiAweGZmZmZmZmZmKSkge1xuICAgICAgICAgIHN0cm0ubXNnID0gJ2luY29ycmVjdCBsZW5ndGggY2hlY2snO1xuICAgICAgICAgIHN0YXRlLm1vZGUgPSBCQUQ7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgLy89PT0gSU5JVEJJVFMoKTtcbiAgICAgICAgaG9sZCA9IDA7XG4gICAgICAgIGJpdHMgPSAwO1xuICAgICAgICAvLz09PS8vXG4gICAgICAgIC8vVHJhY2V2KChzdGRlcnIsIFwiaW5mbGF0ZTogICBsZW5ndGggbWF0Y2hlcyB0cmFpbGVyXFxuXCIpKTtcbiAgICAgIH1cbiAgICAgIHN0YXRlLm1vZGUgPSBET05FO1xuICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgIGNhc2UgRE9ORTpcbiAgICAgIHJldCA9IFpfU1RSRUFNX0VORDtcbiAgICAgIGJyZWFrIGluZl9sZWF2ZTtcbiAgICBjYXNlIEJBRDpcbiAgICAgIHJldCA9IFpfREFUQV9FUlJPUjtcbiAgICAgIGJyZWFrIGluZl9sZWF2ZTtcbiAgICBjYXNlIE1FTTpcbiAgICAgIHJldHVybiBaX01FTV9FUlJPUjtcbiAgICBjYXNlIFNZTkM6XG4gICAgICAvKiBmYWxscyB0aHJvdWdoICovXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBaX1NUUkVBTV9FUlJPUjtcbiAgICB9XG4gIH1cblxuICAvLyBpbmZfbGVhdmUgPC0gaGVyZSBpcyByZWFsIHBsYWNlIGZvciBcImdvdG8gaW5mX2xlYXZlXCIsIGVtdWxhdGVkIHZpYSBcImJyZWFrIGluZl9sZWF2ZVwiXG5cbiAgLypcbiAgICAgUmV0dXJuIGZyb20gaW5mbGF0ZSgpLCB1cGRhdGluZyB0aGUgdG90YWwgY291bnRzIGFuZCB0aGUgY2hlY2sgdmFsdWUuXG4gICAgIElmIHRoZXJlIHdhcyBubyBwcm9ncmVzcyBkdXJpbmcgdGhlIGluZmxhdGUoKSBjYWxsLCByZXR1cm4gYSBidWZmZXJcbiAgICAgZXJyb3IuICBDYWxsIHVwZGF0ZXdpbmRvdygpIHRvIGNyZWF0ZSBhbmQvb3IgdXBkYXRlIHRoZSB3aW5kb3cgc3RhdGUuXG4gICAgIE5vdGU6IGEgbWVtb3J5IGVycm9yIGZyb20gaW5mbGF0ZSgpIGlzIG5vbi1yZWNvdmVyYWJsZS5cbiAgICovXG5cbiAgLy8tLS0gUkVTVE9SRSgpIC0tLVxuICBzdHJtLm5leHRfb3V0ID0gcHV0O1xuICBzdHJtLmF2YWlsX291dCA9IGxlZnQ7XG4gIHN0cm0ubmV4dF9pbiA9IG5leHQ7XG4gIHN0cm0uYXZhaWxfaW4gPSBoYXZlO1xuICBzdGF0ZS5ob2xkID0gaG9sZDtcbiAgc3RhdGUuYml0cyA9IGJpdHM7XG4gIC8vLS0tXG5cbiAgaWYgKHN0YXRlLndzaXplIHx8IChfb3V0ICE9PSBzdHJtLmF2YWlsX291dCAmJiBzdGF0ZS5tb2RlIDwgQkFEICYmXG4gICAgICAgICAgICAgICAgICAgICAgKHN0YXRlLm1vZGUgPCBDSEVDSyB8fCBmbHVzaCAhPT0gWl9GSU5JU0gpKSkge1xuICAgIGlmICh1cGRhdGV3aW5kb3coc3RybSwgc3RybS5vdXRwdXQsIHN0cm0ubmV4dF9vdXQsIF9vdXQgLSBzdHJtLmF2YWlsX291dCkpIDtcbiAgfVxuICBfaW4gLT0gc3RybS5hdmFpbF9pbjtcbiAgX291dCAtPSBzdHJtLmF2YWlsX291dDtcbiAgc3RybS50b3RhbF9pbiArPSBfaW47XG4gIHN0cm0udG90YWxfb3V0ICs9IF9vdXQ7XG4gIHN0YXRlLnRvdGFsICs9IF9vdXQ7XG4gIGlmIChzdGF0ZS53cmFwICYmIF9vdXQpIHtcbiAgICBzdHJtLmFkbGVyID0gc3RhdGUuY2hlY2sgPSAvKlVQREFURShzdGF0ZS5jaGVjaywgc3RybS5uZXh0X291dCAtIF9vdXQsIF9vdXQpOyovXG4gICAgICAoc3RhdGUuZmxhZ3MgPyBjcmMzMihzdGF0ZS5jaGVjaywgb3V0cHV0LCBfb3V0LCBzdHJtLm5leHRfb3V0IC0gX291dCkgOiBhZGxlcjMyKHN0YXRlLmNoZWNrLCBvdXRwdXQsIF9vdXQsIHN0cm0ubmV4dF9vdXQgLSBfb3V0KSk7XG4gIH1cbiAgc3RybS5kYXRhX3R5cGUgPSBzdGF0ZS5iaXRzICsgKHN0YXRlLmxhc3QgPyA2NCA6IDApICtcbiAgICAgICAgICAgICAgICAgICAgKHN0YXRlLm1vZGUgPT09IFRZUEUgPyAxMjggOiAwKSArXG4gICAgICAgICAgICAgICAgICAgIChzdGF0ZS5tb2RlID09PSBMRU5fIHx8IHN0YXRlLm1vZGUgPT09IENPUFlfID8gMjU2IDogMCk7XG4gIGlmICgoKF9pbiA9PT0gMCAmJiBfb3V0ID09PSAwKSB8fCBmbHVzaCA9PT0gWl9GSU5JU0gpICYmIHJldCA9PT0gWl9PSykge1xuICAgIHJldCA9IFpfQlVGX0VSUk9SO1xuICB9XG4gIHJldHVybiByZXQ7XG59XG5cbmZ1bmN0aW9uIGluZmxhdGVFbmQoc3RybSkge1xuXG4gIGlmICghc3RybSB8fCAhc3RybS5zdGF0ZSAvKnx8IHN0cm0tPnpmcmVlID09IChmcmVlX2Z1bmMpMCovKSB7XG4gICAgcmV0dXJuIFpfU1RSRUFNX0VSUk9SO1xuICB9XG5cbiAgdmFyIHN0YXRlID0gc3RybS5zdGF0ZTtcbiAgaWYgKHN0YXRlLndpbmRvdykge1xuICAgIHN0YXRlLndpbmRvdyA9IG51bGw7XG4gIH1cbiAgc3RybS5zdGF0ZSA9IG51bGw7XG4gIHJldHVybiBaX09LO1xufVxuXG5mdW5jdGlvbiBpbmZsYXRlR2V0SGVhZGVyKHN0cm0sIGhlYWQpIHtcbiAgdmFyIHN0YXRlO1xuXG4gIC8qIGNoZWNrIHN0YXRlICovXG4gIGlmICghc3RybSB8fCAhc3RybS5zdGF0ZSkgeyByZXR1cm4gWl9TVFJFQU1fRVJST1I7IH1cbiAgc3RhdGUgPSBzdHJtLnN0YXRlO1xuICBpZiAoKHN0YXRlLndyYXAgJiAyKSA9PT0gMCkgeyByZXR1cm4gWl9TVFJFQU1fRVJST1I7IH1cblxuICAvKiBzYXZlIGhlYWRlciBzdHJ1Y3R1cmUgKi9cbiAgc3RhdGUuaGVhZCA9IGhlYWQ7XG4gIGhlYWQuZG9uZSA9IGZhbHNlO1xuICByZXR1cm4gWl9PSztcbn1cblxuZnVuY3Rpb24gaW5mbGF0ZVNldERpY3Rpb25hcnkoc3RybSwgZGljdGlvbmFyeSkge1xuICB2YXIgZGljdExlbmd0aCA9IGRpY3Rpb25hcnkubGVuZ3RoO1xuXG4gIHZhciBzdGF0ZTtcbiAgdmFyIGRpY3RpZDtcbiAgdmFyIHJldDtcblxuICAvKiBjaGVjayBzdGF0ZSAqL1xuICBpZiAoIXN0cm0gLyogPT0gWl9OVUxMICovIHx8ICFzdHJtLnN0YXRlIC8qID09IFpfTlVMTCAqLykgeyByZXR1cm4gWl9TVFJFQU1fRVJST1I7IH1cbiAgc3RhdGUgPSBzdHJtLnN0YXRlO1xuXG4gIGlmIChzdGF0ZS53cmFwICE9PSAwICYmIHN0YXRlLm1vZGUgIT09IERJQ1QpIHtcbiAgICByZXR1cm4gWl9TVFJFQU1fRVJST1I7XG4gIH1cblxuICAvKiBjaGVjayBmb3IgY29ycmVjdCBkaWN0aW9uYXJ5IGlkZW50aWZpZXIgKi9cbiAgaWYgKHN0YXRlLm1vZGUgPT09IERJQ1QpIHtcbiAgICBkaWN0aWQgPSAxOyAvKiBhZGxlcjMyKDAsIG51bGwsIDApKi9cbiAgICAvKiBkaWN0aWQgPSBhZGxlcjMyKGRpY3RpZCwgZGljdGlvbmFyeSwgZGljdExlbmd0aCk7ICovXG4gICAgZGljdGlkID0gYWRsZXIzMihkaWN0aWQsIGRpY3Rpb25hcnksIGRpY3RMZW5ndGgsIDApO1xuICAgIGlmIChkaWN0aWQgIT09IHN0YXRlLmNoZWNrKSB7XG4gICAgICByZXR1cm4gWl9EQVRBX0VSUk9SO1xuICAgIH1cbiAgfVxuICAvKiBjb3B5IGRpY3Rpb25hcnkgdG8gd2luZG93IHVzaW5nIHVwZGF0ZXdpbmRvdygpLCB3aGljaCB3aWxsIGFtZW5kIHRoZVxuICAgZXhpc3RpbmcgZGljdGlvbmFyeSBpZiBhcHByb3ByaWF0ZSAqL1xuICByZXQgPSB1cGRhdGV3aW5kb3coc3RybSwgZGljdGlvbmFyeSwgZGljdExlbmd0aCwgZGljdExlbmd0aCk7XG4gIGlmIChyZXQpIHtcbiAgICBzdGF0ZS5tb2RlID0gTUVNO1xuICAgIHJldHVybiBaX01FTV9FUlJPUjtcbiAgfVxuICBzdGF0ZS5oYXZlZGljdCA9IDE7XG4gIC8vIFRyYWNldigoc3RkZXJyLCBcImluZmxhdGU6ICAgZGljdGlvbmFyeSBzZXRcXG5cIikpO1xuICByZXR1cm4gWl9PSztcbn1cblxuZXhwb3J0cy5pbmZsYXRlUmVzZXQgPSBpbmZsYXRlUmVzZXQ7XG5leHBvcnRzLmluZmxhdGVSZXNldDIgPSBpbmZsYXRlUmVzZXQyO1xuZXhwb3J0cy5pbmZsYXRlUmVzZXRLZWVwID0gaW5mbGF0ZVJlc2V0S2VlcDtcbmV4cG9ydHMuaW5mbGF0ZUluaXQgPSBpbmZsYXRlSW5pdDtcbmV4cG9ydHMuaW5mbGF0ZUluaXQyID0gaW5mbGF0ZUluaXQyO1xuZXhwb3J0cy5pbmZsYXRlID0gaW5mbGF0ZTtcbmV4cG9ydHMuaW5mbGF0ZUVuZCA9IGluZmxhdGVFbmQ7XG5leHBvcnRzLmluZmxhdGVHZXRIZWFkZXIgPSBpbmZsYXRlR2V0SGVhZGVyO1xuZXhwb3J0cy5pbmZsYXRlU2V0RGljdGlvbmFyeSA9IGluZmxhdGVTZXREaWN0aW9uYXJ5O1xuZXhwb3J0cy5pbmZsYXRlSW5mbyA9ICdwYWtvIGluZmxhdGUgKGZyb20gTm9kZWNhIHByb2plY3QpJztcblxuLyogTm90IGltcGxlbWVudGVkXG5leHBvcnRzLmluZmxhdGVDb3B5ID0gaW5mbGF0ZUNvcHk7XG5leHBvcnRzLmluZmxhdGVHZXREaWN0aW9uYXJ5ID0gaW5mbGF0ZUdldERpY3Rpb25hcnk7XG5leHBvcnRzLmluZmxhdGVNYXJrID0gaW5mbGF0ZU1hcms7XG5leHBvcnRzLmluZmxhdGVQcmltZSA9IGluZmxhdGVQcmltZTtcbmV4cG9ydHMuaW5mbGF0ZVN5bmMgPSBpbmZsYXRlU3luYztcbmV4cG9ydHMuaW5mbGF0ZVN5bmNQb2ludCA9IGluZmxhdGVTeW5jUG9pbnQ7XG5leHBvcnRzLmluZmxhdGVVbmRlcm1pbmUgPSBpbmZsYXRlVW5kZXJtaW5lO1xuKi9cblxufSx7XCIuLi91dGlscy9jb21tb25cIjo0MSxcIi4vYWRsZXIzMlwiOjQzLFwiLi9jcmMzMlwiOjQ1LFwiLi9pbmZmYXN0XCI6NDgsXCIuL2luZnRyZWVzXCI6NTB9XSw1MDpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG5cbi8vIChDKSAxOTk1LTIwMTMgSmVhbi1sb3VwIEdhaWxseSBhbmQgTWFyayBBZGxlclxuLy8gKEMpIDIwMTQtMjAxNyBWaXRhbHkgUHV6cmluIGFuZCBBbmRyZXkgVHVwaXRzaW5cbi8vXG4vLyBUaGlzIHNvZnR3YXJlIGlzIHByb3ZpZGVkICdhcy1pcycsIHdpdGhvdXQgYW55IGV4cHJlc3Mgb3IgaW1wbGllZFxuLy8gd2FycmFudHkuIEluIG5vIGV2ZW50IHdpbGwgdGhlIGF1dGhvcnMgYmUgaGVsZCBsaWFibGUgZm9yIGFueSBkYW1hZ2VzXG4vLyBhcmlzaW5nIGZyb20gdGhlIHVzZSBvZiB0aGlzIHNvZnR3YXJlLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgZ3JhbnRlZCB0byBhbnlvbmUgdG8gdXNlIHRoaXMgc29mdHdhcmUgZm9yIGFueSBwdXJwb3NlLFxuLy8gaW5jbHVkaW5nIGNvbW1lcmNpYWwgYXBwbGljYXRpb25zLCBhbmQgdG8gYWx0ZXIgaXQgYW5kIHJlZGlzdHJpYnV0ZSBpdFxuLy8gZnJlZWx5LCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgcmVzdHJpY3Rpb25zOlxuLy9cbi8vIDEuIFRoZSBvcmlnaW4gb2YgdGhpcyBzb2Z0d2FyZSBtdXN0IG5vdCBiZSBtaXNyZXByZXNlbnRlZDsgeW91IG11c3Qgbm90XG4vLyAgIGNsYWltIHRoYXQgeW91IHdyb3RlIHRoZSBvcmlnaW5hbCBzb2Z0d2FyZS4gSWYgeW91IHVzZSB0aGlzIHNvZnR3YXJlXG4vLyAgIGluIGEgcHJvZHVjdCwgYW4gYWNrbm93bGVkZ21lbnQgaW4gdGhlIHByb2R1Y3QgZG9jdW1lbnRhdGlvbiB3b3VsZCBiZVxuLy8gICBhcHByZWNpYXRlZCBidXQgaXMgbm90IHJlcXVpcmVkLlxuLy8gMi4gQWx0ZXJlZCBzb3VyY2UgdmVyc2lvbnMgbXVzdCBiZSBwbGFpbmx5IG1hcmtlZCBhcyBzdWNoLCBhbmQgbXVzdCBub3QgYmVcbi8vICAgbWlzcmVwcmVzZW50ZWQgYXMgYmVpbmcgdGhlIG9yaWdpbmFsIHNvZnR3YXJlLlxuLy8gMy4gVGhpcyBub3RpY2UgbWF5IG5vdCBiZSByZW1vdmVkIG9yIGFsdGVyZWQgZnJvbSBhbnkgc291cmNlIGRpc3RyaWJ1dGlvbi5cblxudmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMvY29tbW9uJyk7XG5cbnZhciBNQVhCSVRTID0gMTU7XG52YXIgRU5PVUdIX0xFTlMgPSA4NTI7XG52YXIgRU5PVUdIX0RJU1RTID0gNTkyO1xuLy92YXIgRU5PVUdIID0gKEVOT1VHSF9MRU5TK0VOT1VHSF9ESVNUUyk7XG5cbnZhciBDT0RFUyA9IDA7XG52YXIgTEVOUyA9IDE7XG52YXIgRElTVFMgPSAyO1xuXG52YXIgbGJhc2UgPSBbIC8qIExlbmd0aCBjb2RlcyAyNTcuLjI4NSBiYXNlICovXG4gIDMsIDQsIDUsIDYsIDcsIDgsIDksIDEwLCAxMSwgMTMsIDE1LCAxNywgMTksIDIzLCAyNywgMzEsXG4gIDM1LCA0MywgNTEsIDU5LCA2NywgODMsIDk5LCAxMTUsIDEzMSwgMTYzLCAxOTUsIDIyNywgMjU4LCAwLCAwXG5dO1xuXG52YXIgbGV4dCA9IFsgLyogTGVuZ3RoIGNvZGVzIDI1Ny4uMjg1IGV4dHJhICovXG4gIDE2LCAxNiwgMTYsIDE2LCAxNiwgMTYsIDE2LCAxNiwgMTcsIDE3LCAxNywgMTcsIDE4LCAxOCwgMTgsIDE4LFxuICAxOSwgMTksIDE5LCAxOSwgMjAsIDIwLCAyMCwgMjAsIDIxLCAyMSwgMjEsIDIxLCAxNiwgNzIsIDc4XG5dO1xuXG52YXIgZGJhc2UgPSBbIC8qIERpc3RhbmNlIGNvZGVzIDAuLjI5IGJhc2UgKi9cbiAgMSwgMiwgMywgNCwgNSwgNywgOSwgMTMsIDE3LCAyNSwgMzMsIDQ5LCA2NSwgOTcsIDEyOSwgMTkzLFxuICAyNTcsIDM4NSwgNTEzLCA3NjksIDEwMjUsIDE1MzcsIDIwNDksIDMwNzMsIDQwOTcsIDYxNDUsXG4gIDgxOTMsIDEyMjg5LCAxNjM4NSwgMjQ1NzcsIDAsIDBcbl07XG5cbnZhciBkZXh0ID0gWyAvKiBEaXN0YW5jZSBjb2RlcyAwLi4yOSBleHRyYSAqL1xuICAxNiwgMTYsIDE2LCAxNiwgMTcsIDE3LCAxOCwgMTgsIDE5LCAxOSwgMjAsIDIwLCAyMSwgMjEsIDIyLCAyMixcbiAgMjMsIDIzLCAyNCwgMjQsIDI1LCAyNSwgMjYsIDI2LCAyNywgMjcsXG4gIDI4LCAyOCwgMjksIDI5LCA2NCwgNjRcbl07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5mbGF0ZV90YWJsZSh0eXBlLCBsZW5zLCBsZW5zX2luZGV4LCBjb2RlcywgdGFibGUsIHRhYmxlX2luZGV4LCB3b3JrLCBvcHRzKVxue1xuICB2YXIgYml0cyA9IG9wdHMuYml0cztcbiAgICAgIC8vaGVyZSA9IG9wdHMuaGVyZTsgLyogdGFibGUgZW50cnkgZm9yIGR1cGxpY2F0aW9uICovXG5cbiAgdmFyIGxlbiA9IDA7ICAgICAgICAgICAgICAgLyogYSBjb2RlJ3MgbGVuZ3RoIGluIGJpdHMgKi9cbiAgdmFyIHN5bSA9IDA7ICAgICAgICAgICAgICAgLyogaW5kZXggb2YgY29kZSBzeW1ib2xzICovXG4gIHZhciBtaW4gPSAwLCBtYXggPSAwOyAgICAgICAgICAvKiBtaW5pbXVtIGFuZCBtYXhpbXVtIGNvZGUgbGVuZ3RocyAqL1xuICB2YXIgcm9vdCA9IDA7ICAgICAgICAgICAgICAvKiBudW1iZXIgb2YgaW5kZXggYml0cyBmb3Igcm9vdCB0YWJsZSAqL1xuICB2YXIgY3VyciA9IDA7ICAgICAgICAgICAgICAvKiBudW1iZXIgb2YgaW5kZXggYml0cyBmb3IgY3VycmVudCB0YWJsZSAqL1xuICB2YXIgZHJvcCA9IDA7ICAgICAgICAgICAgICAvKiBjb2RlIGJpdHMgdG8gZHJvcCBmb3Igc3ViLXRhYmxlICovXG4gIHZhciBsZWZ0ID0gMDsgICAgICAgICAgICAgICAgICAgLyogbnVtYmVyIG9mIHByZWZpeCBjb2RlcyBhdmFpbGFibGUgKi9cbiAgdmFyIHVzZWQgPSAwOyAgICAgICAgICAgICAgLyogY29kZSBlbnRyaWVzIGluIHRhYmxlIHVzZWQgKi9cbiAgdmFyIGh1ZmYgPSAwOyAgICAgICAgICAgICAgLyogSHVmZm1hbiBjb2RlICovXG4gIHZhciBpbmNyOyAgICAgICAgICAgICAgLyogZm9yIGluY3JlbWVudGluZyBjb2RlLCBpbmRleCAqL1xuICB2YXIgZmlsbDsgICAgICAgICAgICAgIC8qIGluZGV4IGZvciByZXBsaWNhdGluZyBlbnRyaWVzICovXG4gIHZhciBsb3c7ICAgICAgICAgICAgICAgLyogbG93IGJpdHMgZm9yIGN1cnJlbnQgcm9vdCBlbnRyeSAqL1xuICB2YXIgbWFzazsgICAgICAgICAgICAgIC8qIG1hc2sgZm9yIGxvdyByb290IGJpdHMgKi9cbiAgdmFyIG5leHQ7ICAgICAgICAgICAgIC8qIG5leHQgYXZhaWxhYmxlIHNwYWNlIGluIHRhYmxlICovXG4gIHZhciBiYXNlID0gbnVsbDsgICAgIC8qIGJhc2UgdmFsdWUgdGFibGUgdG8gdXNlICovXG4gIHZhciBiYXNlX2luZGV4ID0gMDtcbi8vICB2YXIgc2hvZXh0cmE7ICAgIC8qIGV4dHJhIGJpdHMgdGFibGUgdG8gdXNlICovXG4gIHZhciBlbmQ7ICAgICAgICAgICAgICAgICAgICAvKiB1c2UgYmFzZSBhbmQgZXh0cmEgZm9yIHN5bWJvbCA+IGVuZCAqL1xuICB2YXIgY291bnQgPSBuZXcgdXRpbHMuQnVmMTYoTUFYQklUUyArIDEpOyAvL1tNQVhCSVRTKzFdOyAgICAvKiBudW1iZXIgb2YgY29kZXMgb2YgZWFjaCBsZW5ndGggKi9cbiAgdmFyIG9mZnMgPSBuZXcgdXRpbHMuQnVmMTYoTUFYQklUUyArIDEpOyAvL1tNQVhCSVRTKzFdOyAgICAgLyogb2Zmc2V0cyBpbiB0YWJsZSBmb3IgZWFjaCBsZW5ndGggKi9cbiAgdmFyIGV4dHJhID0gbnVsbDtcbiAgdmFyIGV4dHJhX2luZGV4ID0gMDtcblxuICB2YXIgaGVyZV9iaXRzLCBoZXJlX29wLCBoZXJlX3ZhbDtcblxuICAvKlxuICAgUHJvY2VzcyBhIHNldCBvZiBjb2RlIGxlbmd0aHMgdG8gY3JlYXRlIGEgY2Fub25pY2FsIEh1ZmZtYW4gY29kZS4gIFRoZVxuICAgY29kZSBsZW5ndGhzIGFyZSBsZW5zWzAuLmNvZGVzLTFdLiAgRWFjaCBsZW5ndGggY29ycmVzcG9uZHMgdG8gdGhlXG4gICBzeW1ib2xzIDAuLmNvZGVzLTEuICBUaGUgSHVmZm1hbiBjb2RlIGlzIGdlbmVyYXRlZCBieSBmaXJzdCBzb3J0aW5nIHRoZVxuICAgc3ltYm9scyBieSBsZW5ndGggZnJvbSBzaG9ydCB0byBsb25nLCBhbmQgcmV0YWluaW5nIHRoZSBzeW1ib2wgb3JkZXJcbiAgIGZvciBjb2RlcyB3aXRoIGVxdWFsIGxlbmd0aHMuICBUaGVuIHRoZSBjb2RlIHN0YXJ0cyB3aXRoIGFsbCB6ZXJvIGJpdHNcbiAgIGZvciB0aGUgZmlyc3QgY29kZSBvZiB0aGUgc2hvcnRlc3QgbGVuZ3RoLCBhbmQgdGhlIGNvZGVzIGFyZSBpbnRlZ2VyXG4gICBpbmNyZW1lbnRzIGZvciB0aGUgc2FtZSBsZW5ndGgsIGFuZCB6ZXJvcyBhcmUgYXBwZW5kZWQgYXMgdGhlIGxlbmd0aFxuICAgaW5jcmVhc2VzLiAgRm9yIHRoZSBkZWZsYXRlIGZvcm1hdCwgdGhlc2UgYml0cyBhcmUgc3RvcmVkIGJhY2t3YXJkc1xuICAgZnJvbSB0aGVpciBtb3JlIG5hdHVyYWwgaW50ZWdlciBpbmNyZW1lbnQgb3JkZXJpbmcsIGFuZCBzbyB3aGVuIHRoZVxuICAgZGVjb2RpbmcgdGFibGVzIGFyZSBidWlsdCBpbiB0aGUgbGFyZ2UgbG9vcCBiZWxvdywgdGhlIGludGVnZXIgY29kZXNcbiAgIGFyZSBpbmNyZW1lbnRlZCBiYWNrd2FyZHMuXG5cbiAgIFRoaXMgcm91dGluZSBhc3N1bWVzLCBidXQgZG9lcyBub3QgY2hlY2ssIHRoYXQgYWxsIG9mIHRoZSBlbnRyaWVzIGluXG4gICBsZW5zW10gYXJlIGluIHRoZSByYW5nZSAwLi5NQVhCSVRTLiAgVGhlIGNhbGxlciBtdXN0IGFzc3VyZSB0aGlzLlxuICAgMS4uTUFYQklUUyBpcyBpbnRlcnByZXRlZCBhcyB0aGF0IGNvZGUgbGVuZ3RoLiAgemVybyBtZWFucyB0aGF0IHRoYXRcbiAgIHN5bWJvbCBkb2VzIG5vdCBvY2N1ciBpbiB0aGlzIGNvZGUuXG5cbiAgIFRoZSBjb2RlcyBhcmUgc29ydGVkIGJ5IGNvbXB1dGluZyBhIGNvdW50IG9mIGNvZGVzIGZvciBlYWNoIGxlbmd0aCxcbiAgIGNyZWF0aW5nIGZyb20gdGhhdCBhIHRhYmxlIG9mIHN0YXJ0aW5nIGluZGljZXMgZm9yIGVhY2ggbGVuZ3RoIGluIHRoZVxuICAgc29ydGVkIHRhYmxlLCBhbmQgdGhlbiBlbnRlcmluZyB0aGUgc3ltYm9scyBpbiBvcmRlciBpbiB0aGUgc29ydGVkXG4gICB0YWJsZS4gIFRoZSBzb3J0ZWQgdGFibGUgaXMgd29ya1tdLCB3aXRoIHRoYXQgc3BhY2UgYmVpbmcgcHJvdmlkZWQgYnlcbiAgIHRoZSBjYWxsZXIuXG5cbiAgIFRoZSBsZW5ndGggY291bnRzIGFyZSB1c2VkIGZvciBvdGhlciBwdXJwb3NlcyBhcyB3ZWxsLCBpLmUuIGZpbmRpbmdcbiAgIHRoZSBtaW5pbXVtIGFuZCBtYXhpbXVtIGxlbmd0aCBjb2RlcywgZGV0ZXJtaW5pbmcgaWYgdGhlcmUgYXJlIGFueVxuICAgY29kZXMgYXQgYWxsLCBjaGVja2luZyBmb3IgYSB2YWxpZCBzZXQgb2YgbGVuZ3RocywgYW5kIGxvb2tpbmcgYWhlYWRcbiAgIGF0IGxlbmd0aCBjb3VudHMgdG8gZGV0ZXJtaW5lIHN1Yi10YWJsZSBzaXplcyB3aGVuIGJ1aWxkaW5nIHRoZVxuICAgZGVjb2RpbmcgdGFibGVzLlxuICAgKi9cblxuICAvKiBhY2N1bXVsYXRlIGxlbmd0aHMgZm9yIGNvZGVzIChhc3N1bWVzIGxlbnNbXSBhbGwgaW4gMC4uTUFYQklUUykgKi9cbiAgZm9yIChsZW4gPSAwOyBsZW4gPD0gTUFYQklUUzsgbGVuKyspIHtcbiAgICBjb3VudFtsZW5dID0gMDtcbiAgfVxuICBmb3IgKHN5bSA9IDA7IHN5bSA8IGNvZGVzOyBzeW0rKykge1xuICAgIGNvdW50W2xlbnNbbGVuc19pbmRleCArIHN5bV1dKys7XG4gIH1cblxuICAvKiBib3VuZCBjb2RlIGxlbmd0aHMsIGZvcmNlIHJvb3QgdG8gYmUgd2l0aGluIGNvZGUgbGVuZ3RocyAqL1xuICByb290ID0gYml0cztcbiAgZm9yIChtYXggPSBNQVhCSVRTOyBtYXggPj0gMTsgbWF4LS0pIHtcbiAgICBpZiAoY291bnRbbWF4XSAhPT0gMCkgeyBicmVhazsgfVxuICB9XG4gIGlmIChyb290ID4gbWF4KSB7XG4gICAgcm9vdCA9IG1heDtcbiAgfVxuICBpZiAobWF4ID09PSAwKSB7ICAgICAgICAgICAgICAgICAgICAgLyogbm8gc3ltYm9scyB0byBjb2RlIGF0IGFsbCAqL1xuICAgIC8vdGFibGUub3Bbb3B0cy50YWJsZV9pbmRleF0gPSA2NDsgIC8vaGVyZS5vcCA9ICh2YXIgY2hhcik2NDsgICAgLyogaW52YWxpZCBjb2RlIG1hcmtlciAqL1xuICAgIC8vdGFibGUuYml0c1tvcHRzLnRhYmxlX2luZGV4XSA9IDE7ICAgLy9oZXJlLmJpdHMgPSAodmFyIGNoYXIpMTtcbiAgICAvL3RhYmxlLnZhbFtvcHRzLnRhYmxlX2luZGV4KytdID0gMDsgICAvL2hlcmUudmFsID0gKHZhciBzaG9ydCkwO1xuICAgIHRhYmxlW3RhYmxlX2luZGV4KytdID0gKDEgPDwgMjQpIHwgKDY0IDw8IDE2KSB8IDA7XG5cblxuICAgIC8vdGFibGUub3Bbb3B0cy50YWJsZV9pbmRleF0gPSA2NDtcbiAgICAvL3RhYmxlLmJpdHNbb3B0cy50YWJsZV9pbmRleF0gPSAxO1xuICAgIC8vdGFibGUudmFsW29wdHMudGFibGVfaW5kZXgrK10gPSAwO1xuICAgIHRhYmxlW3RhYmxlX2luZGV4KytdID0gKDEgPDwgMjQpIHwgKDY0IDw8IDE2KSB8IDA7XG5cbiAgICBvcHRzLmJpdHMgPSAxO1xuICAgIHJldHVybiAwOyAgICAgLyogbm8gc3ltYm9scywgYnV0IHdhaXQgZm9yIGRlY29kaW5nIHRvIHJlcG9ydCBlcnJvciAqL1xuICB9XG4gIGZvciAobWluID0gMTsgbWluIDwgbWF4OyBtaW4rKykge1xuICAgIGlmIChjb3VudFttaW5dICE9PSAwKSB7IGJyZWFrOyB9XG4gIH1cbiAgaWYgKHJvb3QgPCBtaW4pIHtcbiAgICByb290ID0gbWluO1xuICB9XG5cbiAgLyogY2hlY2sgZm9yIGFuIG92ZXItc3Vic2NyaWJlZCBvciBpbmNvbXBsZXRlIHNldCBvZiBsZW5ndGhzICovXG4gIGxlZnQgPSAxO1xuICBmb3IgKGxlbiA9IDE7IGxlbiA8PSBNQVhCSVRTOyBsZW4rKykge1xuICAgIGxlZnQgPDw9IDE7XG4gICAgbGVmdCAtPSBjb3VudFtsZW5dO1xuICAgIGlmIChsZWZ0IDwgMCkge1xuICAgICAgcmV0dXJuIC0xO1xuICAgIH0gICAgICAgIC8qIG92ZXItc3Vic2NyaWJlZCAqL1xuICB9XG4gIGlmIChsZWZ0ID4gMCAmJiAodHlwZSA9PT0gQ09ERVMgfHwgbWF4ICE9PSAxKSkge1xuICAgIHJldHVybiAtMTsgICAgICAgICAgICAgICAgICAgICAgLyogaW5jb21wbGV0ZSBzZXQgKi9cbiAgfVxuXG4gIC8qIGdlbmVyYXRlIG9mZnNldHMgaW50byBzeW1ib2wgdGFibGUgZm9yIGVhY2ggbGVuZ3RoIGZvciBzb3J0aW5nICovXG4gIG9mZnNbMV0gPSAwO1xuICBmb3IgKGxlbiA9IDE7IGxlbiA8IE1BWEJJVFM7IGxlbisrKSB7XG4gICAgb2Zmc1tsZW4gKyAxXSA9IG9mZnNbbGVuXSArIGNvdW50W2xlbl07XG4gIH1cblxuICAvKiBzb3J0IHN5bWJvbHMgYnkgbGVuZ3RoLCBieSBzeW1ib2wgb3JkZXIgd2l0aGluIGVhY2ggbGVuZ3RoICovXG4gIGZvciAoc3ltID0gMDsgc3ltIDwgY29kZXM7IHN5bSsrKSB7XG4gICAgaWYgKGxlbnNbbGVuc19pbmRleCArIHN5bV0gIT09IDApIHtcbiAgICAgIHdvcmtbb2Zmc1tsZW5zW2xlbnNfaW5kZXggKyBzeW1dXSsrXSA9IHN5bTtcbiAgICB9XG4gIH1cblxuICAvKlxuICAgQ3JlYXRlIGFuZCBmaWxsIGluIGRlY29kaW5nIHRhYmxlcy4gIEluIHRoaXMgbG9vcCwgdGhlIHRhYmxlIGJlaW5nXG4gICBmaWxsZWQgaXMgYXQgbmV4dCBhbmQgaGFzIGN1cnIgaW5kZXggYml0cy4gIFRoZSBjb2RlIGJlaW5nIHVzZWQgaXMgaHVmZlxuICAgd2l0aCBsZW5ndGggbGVuLiAgVGhhdCBjb2RlIGlzIGNvbnZlcnRlZCB0byBhbiBpbmRleCBieSBkcm9wcGluZyBkcm9wXG4gICBiaXRzIG9mZiBvZiB0aGUgYm90dG9tLiAgRm9yIGNvZGVzIHdoZXJlIGxlbiBpcyBsZXNzIHRoYW4gZHJvcCArIGN1cnIsXG4gICB0aG9zZSB0b3AgZHJvcCArIGN1cnIgLSBsZW4gYml0cyBhcmUgaW5jcmVtZW50ZWQgdGhyb3VnaCBhbGwgdmFsdWVzIHRvXG4gICBmaWxsIHRoZSB0YWJsZSB3aXRoIHJlcGxpY2F0ZWQgZW50cmllcy5cblxuICAgcm9vdCBpcyB0aGUgbnVtYmVyIG9mIGluZGV4IGJpdHMgZm9yIHRoZSByb290IHRhYmxlLiAgV2hlbiBsZW4gZXhjZWVkc1xuICAgcm9vdCwgc3ViLXRhYmxlcyBhcmUgY3JlYXRlZCBwb2ludGVkIHRvIGJ5IHRoZSByb290IGVudHJ5IHdpdGggYW4gaW5kZXhcbiAgIG9mIHRoZSBsb3cgcm9vdCBiaXRzIG9mIGh1ZmYuICBUaGlzIGlzIHNhdmVkIGluIGxvdyB0byBjaGVjayBmb3Igd2hlbiBhXG4gICBuZXcgc3ViLXRhYmxlIHNob3VsZCBiZSBzdGFydGVkLiAgZHJvcCBpcyB6ZXJvIHdoZW4gdGhlIHJvb3QgdGFibGUgaXNcbiAgIGJlaW5nIGZpbGxlZCwgYW5kIGRyb3AgaXMgcm9vdCB3aGVuIHN1Yi10YWJsZXMgYXJlIGJlaW5nIGZpbGxlZC5cblxuICAgV2hlbiBhIG5ldyBzdWItdGFibGUgaXMgbmVlZGVkLCBpdCBpcyBuZWNlc3NhcnkgdG8gbG9vayBhaGVhZCBpbiB0aGVcbiAgIGNvZGUgbGVuZ3RocyB0byBkZXRlcm1pbmUgd2hhdCBzaXplIHN1Yi10YWJsZSBpcyBuZWVkZWQuICBUaGUgbGVuZ3RoXG4gICBjb3VudHMgYXJlIHVzZWQgZm9yIHRoaXMsIGFuZCBzbyBjb3VudFtdIGlzIGRlY3JlbWVudGVkIGFzIGNvZGVzIGFyZVxuICAgZW50ZXJlZCBpbiB0aGUgdGFibGVzLlxuXG4gICB1c2VkIGtlZXBzIHRyYWNrIG9mIGhvdyBtYW55IHRhYmxlIGVudHJpZXMgaGF2ZSBiZWVuIGFsbG9jYXRlZCBmcm9tIHRoZVxuICAgcHJvdmlkZWQgKnRhYmxlIHNwYWNlLiAgSXQgaXMgY2hlY2tlZCBmb3IgTEVOUyBhbmQgRElTVCB0YWJsZXMgYWdhaW5zdFxuICAgdGhlIGNvbnN0YW50cyBFTk9VR0hfTEVOUyBhbmQgRU5PVUdIX0RJU1RTIHRvIGd1YXJkIGFnYWluc3QgY2hhbmdlcyBpblxuICAgdGhlIGluaXRpYWwgcm9vdCB0YWJsZSBzaXplIGNvbnN0YW50cy4gIFNlZSB0aGUgY29tbWVudHMgaW4gaW5mdHJlZXMuaFxuICAgZm9yIG1vcmUgaW5mb3JtYXRpb24uXG5cbiAgIHN5bSBpbmNyZW1lbnRzIHRocm91Z2ggYWxsIHN5bWJvbHMsIGFuZCB0aGUgbG9vcCB0ZXJtaW5hdGVzIHdoZW5cbiAgIGFsbCBjb2RlcyBvZiBsZW5ndGggbWF4LCBpLmUuIGFsbCBjb2RlcywgaGF2ZSBiZWVuIHByb2Nlc3NlZC4gIFRoaXNcbiAgIHJvdXRpbmUgcGVybWl0cyBpbmNvbXBsZXRlIGNvZGVzLCBzbyBhbm90aGVyIGxvb3AgYWZ0ZXIgdGhpcyBvbmUgZmlsbHNcbiAgIGluIHRoZSByZXN0IG9mIHRoZSBkZWNvZGluZyB0YWJsZXMgd2l0aCBpbnZhbGlkIGNvZGUgbWFya2Vycy5cbiAgICovXG5cbiAgLyogc2V0IHVwIGZvciBjb2RlIHR5cGUgKi9cbiAgLy8gcG9vciBtYW4gb3B0aW1pemF0aW9uIC0gdXNlIGlmLWVsc2UgaW5zdGVhZCBvZiBzd2l0Y2gsXG4gIC8vIHRvIGF2b2lkIGRlb3B0cyBpbiBvbGQgdjhcbiAgaWYgKHR5cGUgPT09IENPREVTKSB7XG4gICAgYmFzZSA9IGV4dHJhID0gd29yazsgICAgLyogZHVtbXkgdmFsdWUtLW5vdCB1c2VkICovXG4gICAgZW5kID0gMTk7XG5cbiAgfSBlbHNlIGlmICh0eXBlID09PSBMRU5TKSB7XG4gICAgYmFzZSA9IGxiYXNlO1xuICAgIGJhc2VfaW5kZXggLT0gMjU3O1xuICAgIGV4dHJhID0gbGV4dDtcbiAgICBleHRyYV9pbmRleCAtPSAyNTc7XG4gICAgZW5kID0gMjU2O1xuXG4gIH0gZWxzZSB7ICAgICAgICAgICAgICAgICAgICAvKiBESVNUUyAqL1xuICAgIGJhc2UgPSBkYmFzZTtcbiAgICBleHRyYSA9IGRleHQ7XG4gICAgZW5kID0gLTE7XG4gIH1cblxuICAvKiBpbml0aWFsaXplIG9wdHMgZm9yIGxvb3AgKi9cbiAgaHVmZiA9IDA7ICAgICAgICAgICAgICAgICAgIC8qIHN0YXJ0aW5nIGNvZGUgKi9cbiAgc3ltID0gMDsgICAgICAgICAgICAgICAgICAgIC8qIHN0YXJ0aW5nIGNvZGUgc3ltYm9sICovXG4gIGxlbiA9IG1pbjsgICAgICAgICAgICAgICAgICAvKiBzdGFydGluZyBjb2RlIGxlbmd0aCAqL1xuICBuZXh0ID0gdGFibGVfaW5kZXg7ICAgICAgICAgICAgICAvKiBjdXJyZW50IHRhYmxlIHRvIGZpbGwgaW4gKi9cbiAgY3VyciA9IHJvb3Q7ICAgICAgICAgICAgICAgIC8qIGN1cnJlbnQgdGFibGUgaW5kZXggYml0cyAqL1xuICBkcm9wID0gMDsgICAgICAgICAgICAgICAgICAgLyogY3VycmVudCBiaXRzIHRvIGRyb3AgZnJvbSBjb2RlIGZvciBpbmRleCAqL1xuICBsb3cgPSAtMTsgICAgICAgICAgICAgICAgICAgLyogdHJpZ2dlciBuZXcgc3ViLXRhYmxlIHdoZW4gbGVuID4gcm9vdCAqL1xuICB1c2VkID0gMSA8PCByb290OyAgICAgICAgICAvKiB1c2Ugcm9vdCB0YWJsZSBlbnRyaWVzICovXG4gIG1hc2sgPSB1c2VkIC0gMTsgICAgICAgICAgICAvKiBtYXNrIGZvciBjb21wYXJpbmcgbG93ICovXG5cbiAgLyogY2hlY2sgYXZhaWxhYmxlIHRhYmxlIHNwYWNlICovXG4gIGlmICgodHlwZSA9PT0gTEVOUyAmJiB1c2VkID4gRU5PVUdIX0xFTlMpIHx8XG4gICAgKHR5cGUgPT09IERJU1RTICYmIHVzZWQgPiBFTk9VR0hfRElTVFMpKSB7XG4gICAgcmV0dXJuIDE7XG4gIH1cblxuICAvKiBwcm9jZXNzIGFsbCBjb2RlcyBhbmQgbWFrZSB0YWJsZSBlbnRyaWVzICovXG4gIGZvciAoOzspIHtcbiAgICAvKiBjcmVhdGUgdGFibGUgZW50cnkgKi9cbiAgICBoZXJlX2JpdHMgPSBsZW4gLSBkcm9wO1xuICAgIGlmICh3b3JrW3N5bV0gPCBlbmQpIHtcbiAgICAgIGhlcmVfb3AgPSAwO1xuICAgICAgaGVyZV92YWwgPSB3b3JrW3N5bV07XG4gICAgfVxuICAgIGVsc2UgaWYgKHdvcmtbc3ltXSA+IGVuZCkge1xuICAgICAgaGVyZV9vcCA9IGV4dHJhW2V4dHJhX2luZGV4ICsgd29ya1tzeW1dXTtcbiAgICAgIGhlcmVfdmFsID0gYmFzZVtiYXNlX2luZGV4ICsgd29ya1tzeW1dXTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBoZXJlX29wID0gMzIgKyA2NDsgICAgICAgICAvKiBlbmQgb2YgYmxvY2sgKi9cbiAgICAgIGhlcmVfdmFsID0gMDtcbiAgICB9XG5cbiAgICAvKiByZXBsaWNhdGUgZm9yIHRob3NlIGluZGljZXMgd2l0aCBsb3cgbGVuIGJpdHMgZXF1YWwgdG8gaHVmZiAqL1xuICAgIGluY3IgPSAxIDw8IChsZW4gLSBkcm9wKTtcbiAgICBmaWxsID0gMSA8PCBjdXJyO1xuICAgIG1pbiA9IGZpbGw7ICAgICAgICAgICAgICAgICAvKiBzYXZlIG9mZnNldCB0byBuZXh0IHRhYmxlICovXG4gICAgZG8ge1xuICAgICAgZmlsbCAtPSBpbmNyO1xuICAgICAgdGFibGVbbmV4dCArIChodWZmID4+IGRyb3ApICsgZmlsbF0gPSAoaGVyZV9iaXRzIDw8IDI0KSB8IChoZXJlX29wIDw8IDE2KSB8IGhlcmVfdmFsIHwwO1xuICAgIH0gd2hpbGUgKGZpbGwgIT09IDApO1xuXG4gICAgLyogYmFja3dhcmRzIGluY3JlbWVudCB0aGUgbGVuLWJpdCBjb2RlIGh1ZmYgKi9cbiAgICBpbmNyID0gMSA8PCAobGVuIC0gMSk7XG4gICAgd2hpbGUgKGh1ZmYgJiBpbmNyKSB7XG4gICAgICBpbmNyID4+PSAxO1xuICAgIH1cbiAgICBpZiAoaW5jciAhPT0gMCkge1xuICAgICAgaHVmZiAmPSBpbmNyIC0gMTtcbiAgICAgIGh1ZmYgKz0gaW5jcjtcbiAgICB9IGVsc2Uge1xuICAgICAgaHVmZiA9IDA7XG4gICAgfVxuXG4gICAgLyogZ28gdG8gbmV4dCBzeW1ib2wsIHVwZGF0ZSBjb3VudCwgbGVuICovXG4gICAgc3ltKys7XG4gICAgaWYgKC0tY291bnRbbGVuXSA9PT0gMCkge1xuICAgICAgaWYgKGxlbiA9PT0gbWF4KSB7IGJyZWFrOyB9XG4gICAgICBsZW4gPSBsZW5zW2xlbnNfaW5kZXggKyB3b3JrW3N5bV1dO1xuICAgIH1cblxuICAgIC8qIGNyZWF0ZSBuZXcgc3ViLXRhYmxlIGlmIG5lZWRlZCAqL1xuICAgIGlmIChsZW4gPiByb290ICYmIChodWZmICYgbWFzaykgIT09IGxvdykge1xuICAgICAgLyogaWYgZmlyc3QgdGltZSwgdHJhbnNpdGlvbiB0byBzdWItdGFibGVzICovXG4gICAgICBpZiAoZHJvcCA9PT0gMCkge1xuICAgICAgICBkcm9wID0gcm9vdDtcbiAgICAgIH1cblxuICAgICAgLyogaW5jcmVtZW50IHBhc3QgbGFzdCB0YWJsZSAqL1xuICAgICAgbmV4dCArPSBtaW47ICAgICAgICAgICAgLyogaGVyZSBtaW4gaXMgMSA8PCBjdXJyICovXG5cbiAgICAgIC8qIGRldGVybWluZSBsZW5ndGggb2YgbmV4dCB0YWJsZSAqL1xuICAgICAgY3VyciA9IGxlbiAtIGRyb3A7XG4gICAgICBsZWZ0ID0gMSA8PCBjdXJyO1xuICAgICAgd2hpbGUgKGN1cnIgKyBkcm9wIDwgbWF4KSB7XG4gICAgICAgIGxlZnQgLT0gY291bnRbY3VyciArIGRyb3BdO1xuICAgICAgICBpZiAobGVmdCA8PSAwKSB7IGJyZWFrOyB9XG4gICAgICAgIGN1cnIrKztcbiAgICAgICAgbGVmdCA8PD0gMTtcbiAgICAgIH1cblxuICAgICAgLyogY2hlY2sgZm9yIGVub3VnaCBzcGFjZSAqL1xuICAgICAgdXNlZCArPSAxIDw8IGN1cnI7XG4gICAgICBpZiAoKHR5cGUgPT09IExFTlMgJiYgdXNlZCA+IEVOT1VHSF9MRU5TKSB8fFxuICAgICAgICAodHlwZSA9PT0gRElTVFMgJiYgdXNlZCA+IEVOT1VHSF9ESVNUUykpIHtcbiAgICAgICAgcmV0dXJuIDE7XG4gICAgICB9XG5cbiAgICAgIC8qIHBvaW50IGVudHJ5IGluIHJvb3QgdGFibGUgdG8gc3ViLXRhYmxlICovXG4gICAgICBsb3cgPSBodWZmICYgbWFzaztcbiAgICAgIC8qdGFibGUub3BbbG93XSA9IGN1cnI7XG4gICAgICB0YWJsZS5iaXRzW2xvd10gPSByb290O1xuICAgICAgdGFibGUudmFsW2xvd10gPSBuZXh0IC0gb3B0cy50YWJsZV9pbmRleDsqL1xuICAgICAgdGFibGVbbG93XSA9IChyb290IDw8IDI0KSB8IChjdXJyIDw8IDE2KSB8IChuZXh0IC0gdGFibGVfaW5kZXgpIHwwO1xuICAgIH1cbiAgfVxuXG4gIC8qIGZpbGwgaW4gcmVtYWluaW5nIHRhYmxlIGVudHJ5IGlmIGNvZGUgaXMgaW5jb21wbGV0ZSAoZ3VhcmFudGVlZCB0byBoYXZlXG4gICBhdCBtb3N0IG9uZSByZW1haW5pbmcgZW50cnksIHNpbmNlIGlmIHRoZSBjb2RlIGlzIGluY29tcGxldGUsIHRoZVxuICAgbWF4aW11bSBjb2RlIGxlbmd0aCB0aGF0IHdhcyBhbGxvd2VkIHRvIGdldCB0aGlzIGZhciBpcyBvbmUgYml0KSAqL1xuICBpZiAoaHVmZiAhPT0gMCkge1xuICAgIC8vdGFibGUub3BbbmV4dCArIGh1ZmZdID0gNjQ7ICAgICAgICAgICAgLyogaW52YWxpZCBjb2RlIG1hcmtlciAqL1xuICAgIC8vdGFibGUuYml0c1tuZXh0ICsgaHVmZl0gPSBsZW4gLSBkcm9wO1xuICAgIC8vdGFibGUudmFsW25leHQgKyBodWZmXSA9IDA7XG4gICAgdGFibGVbbmV4dCArIGh1ZmZdID0gKChsZW4gLSBkcm9wKSA8PCAyNCkgfCAoNjQgPDwgMTYpIHwwO1xuICB9XG5cbiAgLyogc2V0IHJldHVybiBwYXJhbWV0ZXJzICovXG4gIC8vb3B0cy50YWJsZV9pbmRleCArPSB1c2VkO1xuICBvcHRzLmJpdHMgPSByb290O1xuICByZXR1cm4gMDtcbn07XG5cbn0se1wiLi4vdXRpbHMvY29tbW9uXCI6NDF9XSw1MTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG5cbi8vIChDKSAxOTk1LTIwMTMgSmVhbi1sb3VwIEdhaWxseSBhbmQgTWFyayBBZGxlclxuLy8gKEMpIDIwMTQtMjAxNyBWaXRhbHkgUHV6cmluIGFuZCBBbmRyZXkgVHVwaXRzaW5cbi8vXG4vLyBUaGlzIHNvZnR3YXJlIGlzIHByb3ZpZGVkICdhcy1pcycsIHdpdGhvdXQgYW55IGV4cHJlc3Mgb3IgaW1wbGllZFxuLy8gd2FycmFudHkuIEluIG5vIGV2ZW50IHdpbGwgdGhlIGF1dGhvcnMgYmUgaGVsZCBsaWFibGUgZm9yIGFueSBkYW1hZ2VzXG4vLyBhcmlzaW5nIGZyb20gdGhlIHVzZSBvZiB0aGlzIHNvZnR3YXJlLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgZ3JhbnRlZCB0byBhbnlvbmUgdG8gdXNlIHRoaXMgc29mdHdhcmUgZm9yIGFueSBwdXJwb3NlLFxuLy8gaW5jbHVkaW5nIGNvbW1lcmNpYWwgYXBwbGljYXRpb25zLCBhbmQgdG8gYWx0ZXIgaXQgYW5kIHJlZGlzdHJpYnV0ZSBpdFxuLy8gZnJlZWx5LCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgcmVzdHJpY3Rpb25zOlxuLy9cbi8vIDEuIFRoZSBvcmlnaW4gb2YgdGhpcyBzb2Z0d2FyZSBtdXN0IG5vdCBiZSBtaXNyZXByZXNlbnRlZDsgeW91IG11c3Qgbm90XG4vLyAgIGNsYWltIHRoYXQgeW91IHdyb3RlIHRoZSBvcmlnaW5hbCBzb2Z0d2FyZS4gSWYgeW91IHVzZSB0aGlzIHNvZnR3YXJlXG4vLyAgIGluIGEgcHJvZHVjdCwgYW4gYWNrbm93bGVkZ21lbnQgaW4gdGhlIHByb2R1Y3QgZG9jdW1lbnRhdGlvbiB3b3VsZCBiZVxuLy8gICBhcHByZWNpYXRlZCBidXQgaXMgbm90IHJlcXVpcmVkLlxuLy8gMi4gQWx0ZXJlZCBzb3VyY2UgdmVyc2lvbnMgbXVzdCBiZSBwbGFpbmx5IG1hcmtlZCBhcyBzdWNoLCBhbmQgbXVzdCBub3QgYmVcbi8vICAgbWlzcmVwcmVzZW50ZWQgYXMgYmVpbmcgdGhlIG9yaWdpbmFsIHNvZnR3YXJlLlxuLy8gMy4gVGhpcyBub3RpY2UgbWF5IG5vdCBiZSByZW1vdmVkIG9yIGFsdGVyZWQgZnJvbSBhbnkgc291cmNlIGRpc3RyaWJ1dGlvbi5cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIDI6ICAgICAgJ25lZWQgZGljdGlvbmFyeScsICAgICAvKiBaX05FRURfRElDVCAgICAgICAyICAqL1xuICAxOiAgICAgICdzdHJlYW0gZW5kJywgICAgICAgICAgLyogWl9TVFJFQU1fRU5EICAgICAgMSAgKi9cbiAgMDogICAgICAnJywgICAgICAgICAgICAgICAgICAgIC8qIFpfT0sgICAgICAgICAgICAgIDAgICovXG4gICctMSc6ICAgJ2ZpbGUgZXJyb3InLCAgICAgICAgICAvKiBaX0VSUk5PICAgICAgICAgKC0xKSAqL1xuICAnLTInOiAgICdzdHJlYW0gZXJyb3InLCAgICAgICAgLyogWl9TVFJFQU1fRVJST1IgICgtMikgKi9cbiAgJy0zJzogICAnZGF0YSBlcnJvcicsICAgICAgICAgIC8qIFpfREFUQV9FUlJPUiAgICAoLTMpICovXG4gICctNCc6ICAgJ2luc3VmZmljaWVudCBtZW1vcnknLCAvKiBaX01FTV9FUlJPUiAgICAgKC00KSAqL1xuICAnLTUnOiAgICdidWZmZXIgZXJyb3InLCAgICAgICAgLyogWl9CVUZfRVJST1IgICAgICgtNSkgKi9cbiAgJy02JzogICAnaW5jb21wYXRpYmxlIHZlcnNpb24nIC8qIFpfVkVSU0lPTl9FUlJPUiAoLTYpICovXG59O1xuXG59LHt9XSw1MjpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG5cbi8vIChDKSAxOTk1LTIwMTMgSmVhbi1sb3VwIEdhaWxseSBhbmQgTWFyayBBZGxlclxuLy8gKEMpIDIwMTQtMjAxNyBWaXRhbHkgUHV6cmluIGFuZCBBbmRyZXkgVHVwaXRzaW5cbi8vXG4vLyBUaGlzIHNvZnR3YXJlIGlzIHByb3ZpZGVkICdhcy1pcycsIHdpdGhvdXQgYW55IGV4cHJlc3Mgb3IgaW1wbGllZFxuLy8gd2FycmFudHkuIEluIG5vIGV2ZW50IHdpbGwgdGhlIGF1dGhvcnMgYmUgaGVsZCBsaWFibGUgZm9yIGFueSBkYW1hZ2VzXG4vLyBhcmlzaW5nIGZyb20gdGhlIHVzZSBvZiB0aGlzIHNvZnR3YXJlLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgZ3JhbnRlZCB0byBhbnlvbmUgdG8gdXNlIHRoaXMgc29mdHdhcmUgZm9yIGFueSBwdXJwb3NlLFxuLy8gaW5jbHVkaW5nIGNvbW1lcmNpYWwgYXBwbGljYXRpb25zLCBhbmQgdG8gYWx0ZXIgaXQgYW5kIHJlZGlzdHJpYnV0ZSBpdFxuLy8gZnJlZWx5LCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgcmVzdHJpY3Rpb25zOlxuLy9cbi8vIDEuIFRoZSBvcmlnaW4gb2YgdGhpcyBzb2Z0d2FyZSBtdXN0IG5vdCBiZSBtaXNyZXByZXNlbnRlZDsgeW91IG11c3Qgbm90XG4vLyAgIGNsYWltIHRoYXQgeW91IHdyb3RlIHRoZSBvcmlnaW5hbCBzb2Z0d2FyZS4gSWYgeW91IHVzZSB0aGlzIHNvZnR3YXJlXG4vLyAgIGluIGEgcHJvZHVjdCwgYW4gYWNrbm93bGVkZ21lbnQgaW4gdGhlIHByb2R1Y3QgZG9jdW1lbnRhdGlvbiB3b3VsZCBiZVxuLy8gICBhcHByZWNpYXRlZCBidXQgaXMgbm90IHJlcXVpcmVkLlxuLy8gMi4gQWx0ZXJlZCBzb3VyY2UgdmVyc2lvbnMgbXVzdCBiZSBwbGFpbmx5IG1hcmtlZCBhcyBzdWNoLCBhbmQgbXVzdCBub3QgYmVcbi8vICAgbWlzcmVwcmVzZW50ZWQgYXMgYmVpbmcgdGhlIG9yaWdpbmFsIHNvZnR3YXJlLlxuLy8gMy4gVGhpcyBub3RpY2UgbWF5IG5vdCBiZSByZW1vdmVkIG9yIGFsdGVyZWQgZnJvbSBhbnkgc291cmNlIGRpc3RyaWJ1dGlvbi5cblxudmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMvY29tbW9uJyk7XG5cbi8qIFB1YmxpYyBjb25zdGFudHMgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSovXG4vKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0qL1xuXG5cbi8vdmFyIFpfRklMVEVSRUQgICAgICAgICAgPSAxO1xuLy92YXIgWl9IVUZGTUFOX09OTFkgICAgICA9IDI7XG4vL3ZhciBaX1JMRSAgICAgICAgICAgICAgID0gMztcbnZhciBaX0ZJWEVEICAgICAgICAgICAgICAgPSA0O1xuLy92YXIgWl9ERUZBVUxUX1NUUkFURUdZICA9IDA7XG5cbi8qIFBvc3NpYmxlIHZhbHVlcyBvZiB0aGUgZGF0YV90eXBlIGZpZWxkICh0aG91Z2ggc2VlIGluZmxhdGUoKSkgKi9cbnZhciBaX0JJTkFSWSAgICAgICAgICAgICAgPSAwO1xudmFyIFpfVEVYVCAgICAgICAgICAgICAgICA9IDE7XG4vL3ZhciBaX0FTQ0lJICAgICAgICAgICAgID0gMTsgLy8gPSBaX1RFWFRcbnZhciBaX1VOS05PV04gICAgICAgICAgICAgPSAyO1xuXG4vKj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0qL1xuXG5cbmZ1bmN0aW9uIHplcm8oYnVmKSB7IHZhciBsZW4gPSBidWYubGVuZ3RoOyB3aGlsZSAoLS1sZW4gPj0gMCkgeyBidWZbbGVuXSA9IDA7IH0gfVxuXG4vLyBGcm9tIHp1dGlsLmhcblxudmFyIFNUT1JFRF9CTE9DSyA9IDA7XG52YXIgU1RBVElDX1RSRUVTID0gMTtcbnZhciBEWU5fVFJFRVMgICAgPSAyO1xuLyogVGhlIHRocmVlIGtpbmRzIG9mIGJsb2NrIHR5cGUgKi9cblxudmFyIE1JTl9NQVRDSCAgICA9IDM7XG52YXIgTUFYX01BVENIICAgID0gMjU4O1xuLyogVGhlIG1pbmltdW0gYW5kIG1heGltdW0gbWF0Y2ggbGVuZ3RocyAqL1xuXG4vLyBGcm9tIGRlZmxhdGUuaFxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBJbnRlcm5hbCBjb21wcmVzc2lvbiBzdGF0ZS5cbiAqL1xuXG52YXIgTEVOR1RIX0NPREVTICA9IDI5O1xuLyogbnVtYmVyIG9mIGxlbmd0aCBjb2Rlcywgbm90IGNvdW50aW5nIHRoZSBzcGVjaWFsIEVORF9CTE9DSyBjb2RlICovXG5cbnZhciBMSVRFUkFMUyAgICAgID0gMjU2O1xuLyogbnVtYmVyIG9mIGxpdGVyYWwgYnl0ZXMgMC4uMjU1ICovXG5cbnZhciBMX0NPREVTICAgICAgID0gTElURVJBTFMgKyAxICsgTEVOR1RIX0NPREVTO1xuLyogbnVtYmVyIG9mIExpdGVyYWwgb3IgTGVuZ3RoIGNvZGVzLCBpbmNsdWRpbmcgdGhlIEVORF9CTE9DSyBjb2RlICovXG5cbnZhciBEX0NPREVTICAgICAgID0gMzA7XG4vKiBudW1iZXIgb2YgZGlzdGFuY2UgY29kZXMgKi9cblxudmFyIEJMX0NPREVTICAgICAgPSAxOTtcbi8qIG51bWJlciBvZiBjb2RlcyB1c2VkIHRvIHRyYW5zZmVyIHRoZSBiaXQgbGVuZ3RocyAqL1xuXG52YXIgSEVBUF9TSVpFICAgICA9IDIgKiBMX0NPREVTICsgMTtcbi8qIG1heGltdW0gaGVhcCBzaXplICovXG5cbnZhciBNQVhfQklUUyAgICAgID0gMTU7XG4vKiBBbGwgY29kZXMgbXVzdCBub3QgZXhjZWVkIE1BWF9CSVRTIGJpdHMgKi9cblxudmFyIEJ1Zl9zaXplICAgICAgPSAxNjtcbi8qIHNpemUgb2YgYml0IGJ1ZmZlciBpbiBiaV9idWYgKi9cblxuXG4vKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIENvbnN0YW50c1xuICovXG5cbnZhciBNQVhfQkxfQklUUyA9IDc7XG4vKiBCaXQgbGVuZ3RoIGNvZGVzIG11c3Qgbm90IGV4Y2VlZCBNQVhfQkxfQklUUyBiaXRzICovXG5cbnZhciBFTkRfQkxPQ0sgICA9IDI1Njtcbi8qIGVuZCBvZiBibG9jayBsaXRlcmFsIGNvZGUgKi9cblxudmFyIFJFUF8zXzYgICAgID0gMTY7XG4vKiByZXBlYXQgcHJldmlvdXMgYml0IGxlbmd0aCAzLTYgdGltZXMgKDIgYml0cyBvZiByZXBlYXQgY291bnQpICovXG5cbnZhciBSRVBaXzNfMTAgICA9IDE3O1xuLyogcmVwZWF0IGEgemVybyBsZW5ndGggMy0xMCB0aW1lcyAgKDMgYml0cyBvZiByZXBlYXQgY291bnQpICovXG5cbnZhciBSRVBaXzExXzEzOCA9IDE4O1xuLyogcmVwZWF0IGEgemVybyBsZW5ndGggMTEtMTM4IHRpbWVzICAoNyBiaXRzIG9mIHJlcGVhdCBjb3VudCkgKi9cblxuLyogZXNsaW50LWRpc2FibGUgY29tbWEtc3BhY2luZyxhcnJheS1icmFja2V0LXNwYWNpbmcgKi9cbnZhciBleHRyYV9sYml0cyA9ICAgLyogZXh0cmEgYml0cyBmb3IgZWFjaCBsZW5ndGggY29kZSAqL1xuICBbMCwwLDAsMCwwLDAsMCwwLDEsMSwxLDEsMiwyLDIsMiwzLDMsMywzLDQsNCw0LDQsNSw1LDUsNSwwXTtcblxudmFyIGV4dHJhX2RiaXRzID0gICAvKiBleHRyYSBiaXRzIGZvciBlYWNoIGRpc3RhbmNlIGNvZGUgKi9cbiAgWzAsMCwwLDAsMSwxLDIsMiwzLDMsNCw0LDUsNSw2LDYsNyw3LDgsOCw5LDksMTAsMTAsMTEsMTEsMTIsMTIsMTMsMTNdO1xuXG52YXIgZXh0cmFfYmxiaXRzID0gIC8qIGV4dHJhIGJpdHMgZm9yIGVhY2ggYml0IGxlbmd0aCBjb2RlICovXG4gIFswLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDIsMyw3XTtcblxudmFyIGJsX29yZGVyID1cbiAgWzE2LDE3LDE4LDAsOCw3LDksNiwxMCw1LDExLDQsMTIsMywxMywyLDE0LDEsMTVdO1xuLyogZXNsaW50LWVuYWJsZSBjb21tYS1zcGFjaW5nLGFycmF5LWJyYWNrZXQtc3BhY2luZyAqL1xuXG4vKiBUaGUgbGVuZ3RocyBvZiB0aGUgYml0IGxlbmd0aCBjb2RlcyBhcmUgc2VudCBpbiBvcmRlciBvZiBkZWNyZWFzaW5nXG4gKiBwcm9iYWJpbGl0eSwgdG8gYXZvaWQgdHJhbnNtaXR0aW5nIHRoZSBsZW5ndGhzIGZvciB1bnVzZWQgYml0IGxlbmd0aCBjb2Rlcy5cbiAqL1xuXG4vKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIExvY2FsIGRhdGEuIFRoZXNlIGFyZSBpbml0aWFsaXplZCBvbmx5IG9uY2UuXG4gKi9cblxuLy8gV2UgcHJlLWZpbGwgYXJyYXlzIHdpdGggMCB0byBhdm9pZCB1bmluaXRpYWxpemVkIGdhcHNcblxudmFyIERJU1RfQ09ERV9MRU4gPSA1MTI7IC8qIHNlZSBkZWZpbml0aW9uIG9mIGFycmF5IGRpc3RfY29kZSBiZWxvdyAqL1xuXG4vLyAhISEhIFVzZSBmbGF0IGFycmF5IGluc2RlYWQgb2Ygc3RydWN0dXJlLCBGcmVxID0gaSoyLCBMZW4gPSBpKjIrMVxudmFyIHN0YXRpY19sdHJlZSAgPSBuZXcgQXJyYXkoKExfQ09ERVMgKyAyKSAqIDIpO1xuemVybyhzdGF0aWNfbHRyZWUpO1xuLyogVGhlIHN0YXRpYyBsaXRlcmFsIHRyZWUuIFNpbmNlIHRoZSBiaXQgbGVuZ3RocyBhcmUgaW1wb3NlZCwgdGhlcmUgaXMgbm9cbiAqIG5lZWQgZm9yIHRoZSBMX0NPREVTIGV4dHJhIGNvZGVzIHVzZWQgZHVyaW5nIGhlYXAgY29uc3RydWN0aW9uLiBIb3dldmVyXG4gKiBUaGUgY29kZXMgMjg2IGFuZCAyODcgYXJlIG5lZWRlZCB0byBidWlsZCBhIGNhbm9uaWNhbCB0cmVlIChzZWUgX3RyX2luaXRcbiAqIGJlbG93KS5cbiAqL1xuXG52YXIgc3RhdGljX2R0cmVlICA9IG5ldyBBcnJheShEX0NPREVTICogMik7XG56ZXJvKHN0YXRpY19kdHJlZSk7XG4vKiBUaGUgc3RhdGljIGRpc3RhbmNlIHRyZWUuIChBY3R1YWxseSBhIHRyaXZpYWwgdHJlZSBzaW5jZSBhbGwgY29kZXMgdXNlXG4gKiA1IGJpdHMuKVxuICovXG5cbnZhciBfZGlzdF9jb2RlICAgID0gbmV3IEFycmF5KERJU1RfQ09ERV9MRU4pO1xuemVybyhfZGlzdF9jb2RlKTtcbi8qIERpc3RhbmNlIGNvZGVzLiBUaGUgZmlyc3QgMjU2IHZhbHVlcyBjb3JyZXNwb25kIHRvIHRoZSBkaXN0YW5jZXNcbiAqIDMgLi4gMjU4LCB0aGUgbGFzdCAyNTYgdmFsdWVzIGNvcnJlc3BvbmQgdG8gdGhlIHRvcCA4IGJpdHMgb2ZcbiAqIHRoZSAxNSBiaXQgZGlzdGFuY2VzLlxuICovXG5cbnZhciBfbGVuZ3RoX2NvZGUgID0gbmV3IEFycmF5KE1BWF9NQVRDSCAtIE1JTl9NQVRDSCArIDEpO1xuemVybyhfbGVuZ3RoX2NvZGUpO1xuLyogbGVuZ3RoIGNvZGUgZm9yIGVhY2ggbm9ybWFsaXplZCBtYXRjaCBsZW5ndGggKDAgPT0gTUlOX01BVENIKSAqL1xuXG52YXIgYmFzZV9sZW5ndGggICA9IG5ldyBBcnJheShMRU5HVEhfQ09ERVMpO1xuemVybyhiYXNlX2xlbmd0aCk7XG4vKiBGaXJzdCBub3JtYWxpemVkIGxlbmd0aCBmb3IgZWFjaCBjb2RlICgwID0gTUlOX01BVENIKSAqL1xuXG52YXIgYmFzZV9kaXN0ICAgICA9IG5ldyBBcnJheShEX0NPREVTKTtcbnplcm8oYmFzZV9kaXN0KTtcbi8qIEZpcnN0IG5vcm1hbGl6ZWQgZGlzdGFuY2UgZm9yIGVhY2ggY29kZSAoMCA9IGRpc3RhbmNlIG9mIDEpICovXG5cblxuZnVuY3Rpb24gU3RhdGljVHJlZURlc2Moc3RhdGljX3RyZWUsIGV4dHJhX2JpdHMsIGV4dHJhX2Jhc2UsIGVsZW1zLCBtYXhfbGVuZ3RoKSB7XG5cbiAgdGhpcy5zdGF0aWNfdHJlZSAgPSBzdGF0aWNfdHJlZTsgIC8qIHN0YXRpYyB0cmVlIG9yIE5VTEwgKi9cbiAgdGhpcy5leHRyYV9iaXRzICAgPSBleHRyYV9iaXRzOyAgIC8qIGV4dHJhIGJpdHMgZm9yIGVhY2ggY29kZSBvciBOVUxMICovXG4gIHRoaXMuZXh0cmFfYmFzZSAgID0gZXh0cmFfYmFzZTsgICAvKiBiYXNlIGluZGV4IGZvciBleHRyYV9iaXRzICovXG4gIHRoaXMuZWxlbXMgICAgICAgID0gZWxlbXM7ICAgICAgICAvKiBtYXggbnVtYmVyIG9mIGVsZW1lbnRzIGluIHRoZSB0cmVlICovXG4gIHRoaXMubWF4X2xlbmd0aCAgID0gbWF4X2xlbmd0aDsgICAvKiBtYXggYml0IGxlbmd0aCBmb3IgdGhlIGNvZGVzICovXG5cbiAgLy8gc2hvdyBpZiBgc3RhdGljX3RyZWVgIGhhcyBkYXRhIG9yIGR1bW15IC0gbmVlZGVkIGZvciBtb25vbW9ycGhpYyBvYmplY3RzXG4gIHRoaXMuaGFzX3N0cmVlICAgID0gc3RhdGljX3RyZWUgJiYgc3RhdGljX3RyZWUubGVuZ3RoO1xufVxuXG5cbnZhciBzdGF0aWNfbF9kZXNjO1xudmFyIHN0YXRpY19kX2Rlc2M7XG52YXIgc3RhdGljX2JsX2Rlc2M7XG5cblxuZnVuY3Rpb24gVHJlZURlc2MoZHluX3RyZWUsIHN0YXRfZGVzYykge1xuICB0aGlzLmR5bl90cmVlID0gZHluX3RyZWU7ICAgICAvKiB0aGUgZHluYW1pYyB0cmVlICovXG4gIHRoaXMubWF4X2NvZGUgPSAwOyAgICAgICAgICAgIC8qIGxhcmdlc3QgY29kZSB3aXRoIG5vbiB6ZXJvIGZyZXF1ZW5jeSAqL1xuICB0aGlzLnN0YXRfZGVzYyA9IHN0YXRfZGVzYzsgICAvKiB0aGUgY29ycmVzcG9uZGluZyBzdGF0aWMgdHJlZSAqL1xufVxuXG5cblxuZnVuY3Rpb24gZF9jb2RlKGRpc3QpIHtcbiAgcmV0dXJuIGRpc3QgPCAyNTYgPyBfZGlzdF9jb2RlW2Rpc3RdIDogX2Rpc3RfY29kZVsyNTYgKyAoZGlzdCA+Pj4gNyldO1xufVxuXG5cbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogT3V0cHV0IGEgc2hvcnQgTFNCIGZpcnN0IG9uIHRoZSBzdHJlYW0uXG4gKiBJTiBhc3NlcnRpb246IHRoZXJlIGlzIGVub3VnaCByb29tIGluIHBlbmRpbmdCdWYuXG4gKi9cbmZ1bmN0aW9uIHB1dF9zaG9ydChzLCB3KSB7XG4vLyAgICBwdXRfYnl0ZShzLCAodWNoKSgodykgJiAweGZmKSk7XG4vLyAgICBwdXRfYnl0ZShzLCAodWNoKSgodXNoKSh3KSA+PiA4KSk7XG4gIHMucGVuZGluZ19idWZbcy5wZW5kaW5nKytdID0gKHcpICYgMHhmZjtcbiAgcy5wZW5kaW5nX2J1ZltzLnBlbmRpbmcrK10gPSAodyA+Pj4gOCkgJiAweGZmO1xufVxuXG5cbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogU2VuZCBhIHZhbHVlIG9uIGEgZ2l2ZW4gbnVtYmVyIG9mIGJpdHMuXG4gKiBJTiBhc3NlcnRpb246IGxlbmd0aCA8PSAxNiBhbmQgdmFsdWUgZml0cyBpbiBsZW5ndGggYml0cy5cbiAqL1xuZnVuY3Rpb24gc2VuZF9iaXRzKHMsIHZhbHVlLCBsZW5ndGgpIHtcbiAgaWYgKHMuYmlfdmFsaWQgPiAoQnVmX3NpemUgLSBsZW5ndGgpKSB7XG4gICAgcy5iaV9idWYgfD0gKHZhbHVlIDw8IHMuYmlfdmFsaWQpICYgMHhmZmZmO1xuICAgIHB1dF9zaG9ydChzLCBzLmJpX2J1Zik7XG4gICAgcy5iaV9idWYgPSB2YWx1ZSA+PiAoQnVmX3NpemUgLSBzLmJpX3ZhbGlkKTtcbiAgICBzLmJpX3ZhbGlkICs9IGxlbmd0aCAtIEJ1Zl9zaXplO1xuICB9IGVsc2Uge1xuICAgIHMuYmlfYnVmIHw9ICh2YWx1ZSA8PCBzLmJpX3ZhbGlkKSAmIDB4ZmZmZjtcbiAgICBzLmJpX3ZhbGlkICs9IGxlbmd0aDtcbiAgfVxufVxuXG5cbmZ1bmN0aW9uIHNlbmRfY29kZShzLCBjLCB0cmVlKSB7XG4gIHNlbmRfYml0cyhzLCB0cmVlW2MgKiAyXS8qLkNvZGUqLywgdHJlZVtjICogMiArIDFdLyouTGVuKi8pO1xufVxuXG5cbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogUmV2ZXJzZSB0aGUgZmlyc3QgbGVuIGJpdHMgb2YgYSBjb2RlLCB1c2luZyBzdHJhaWdodGZvcndhcmQgY29kZSAoYSBmYXN0ZXJcbiAqIG1ldGhvZCB3b3VsZCB1c2UgYSB0YWJsZSlcbiAqIElOIGFzc2VydGlvbjogMSA8PSBsZW4gPD0gMTVcbiAqL1xuZnVuY3Rpb24gYmlfcmV2ZXJzZShjb2RlLCBsZW4pIHtcbiAgdmFyIHJlcyA9IDA7XG4gIGRvIHtcbiAgICByZXMgfD0gY29kZSAmIDE7XG4gICAgY29kZSA+Pj49IDE7XG4gICAgcmVzIDw8PSAxO1xuICB9IHdoaWxlICgtLWxlbiA+IDApO1xuICByZXR1cm4gcmVzID4+PiAxO1xufVxuXG5cbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogRmx1c2ggdGhlIGJpdCBidWZmZXIsIGtlZXBpbmcgYXQgbW9zdCA3IGJpdHMgaW4gaXQuXG4gKi9cbmZ1bmN0aW9uIGJpX2ZsdXNoKHMpIHtcbiAgaWYgKHMuYmlfdmFsaWQgPT09IDE2KSB7XG4gICAgcHV0X3Nob3J0KHMsIHMuYmlfYnVmKTtcbiAgICBzLmJpX2J1ZiA9IDA7XG4gICAgcy5iaV92YWxpZCA9IDA7XG5cbiAgfSBlbHNlIGlmIChzLmJpX3ZhbGlkID49IDgpIHtcbiAgICBzLnBlbmRpbmdfYnVmW3MucGVuZGluZysrXSA9IHMuYmlfYnVmICYgMHhmZjtcbiAgICBzLmJpX2J1ZiA+Pj0gODtcbiAgICBzLmJpX3ZhbGlkIC09IDg7XG4gIH1cbn1cblxuXG4vKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIENvbXB1dGUgdGhlIG9wdGltYWwgYml0IGxlbmd0aHMgZm9yIGEgdHJlZSBhbmQgdXBkYXRlIHRoZSB0b3RhbCBiaXQgbGVuZ3RoXG4gKiBmb3IgdGhlIGN1cnJlbnQgYmxvY2suXG4gKiBJTiBhc3NlcnRpb246IHRoZSBmaWVsZHMgZnJlcSBhbmQgZGFkIGFyZSBzZXQsIGhlYXBbaGVhcF9tYXhdIGFuZFxuICogICAgYWJvdmUgYXJlIHRoZSB0cmVlIG5vZGVzIHNvcnRlZCBieSBpbmNyZWFzaW5nIGZyZXF1ZW5jeS5cbiAqIE9VVCBhc3NlcnRpb25zOiB0aGUgZmllbGQgbGVuIGlzIHNldCB0byB0aGUgb3B0aW1hbCBiaXQgbGVuZ3RoLCB0aGVcbiAqICAgICBhcnJheSBibF9jb3VudCBjb250YWlucyB0aGUgZnJlcXVlbmNpZXMgZm9yIGVhY2ggYml0IGxlbmd0aC5cbiAqICAgICBUaGUgbGVuZ3RoIG9wdF9sZW4gaXMgdXBkYXRlZDsgc3RhdGljX2xlbiBpcyBhbHNvIHVwZGF0ZWQgaWYgc3RyZWUgaXNcbiAqICAgICBub3QgbnVsbC5cbiAqL1xuZnVuY3Rpb24gZ2VuX2JpdGxlbihzLCBkZXNjKVxuLy8gICAgZGVmbGF0ZV9zdGF0ZSAqcztcbi8vICAgIHRyZWVfZGVzYyAqZGVzYzsgICAgLyogdGhlIHRyZWUgZGVzY3JpcHRvciAqL1xue1xuICB2YXIgdHJlZSAgICAgICAgICAgID0gZGVzYy5keW5fdHJlZTtcbiAgdmFyIG1heF9jb2RlICAgICAgICA9IGRlc2MubWF4X2NvZGU7XG4gIHZhciBzdHJlZSAgICAgICAgICAgPSBkZXNjLnN0YXRfZGVzYy5zdGF0aWNfdHJlZTtcbiAgdmFyIGhhc19zdHJlZSAgICAgICA9IGRlc2Muc3RhdF9kZXNjLmhhc19zdHJlZTtcbiAgdmFyIGV4dHJhICAgICAgICAgICA9IGRlc2Muc3RhdF9kZXNjLmV4dHJhX2JpdHM7XG4gIHZhciBiYXNlICAgICAgICAgICAgPSBkZXNjLnN0YXRfZGVzYy5leHRyYV9iYXNlO1xuICB2YXIgbWF4X2xlbmd0aCAgICAgID0gZGVzYy5zdGF0X2Rlc2MubWF4X2xlbmd0aDtcbiAgdmFyIGg7ICAgICAgICAgICAgICAvKiBoZWFwIGluZGV4ICovXG4gIHZhciBuLCBtOyAgICAgICAgICAgLyogaXRlcmF0ZSBvdmVyIHRoZSB0cmVlIGVsZW1lbnRzICovXG4gIHZhciBiaXRzOyAgICAgICAgICAgLyogYml0IGxlbmd0aCAqL1xuICB2YXIgeGJpdHM7ICAgICAgICAgIC8qIGV4dHJhIGJpdHMgKi9cbiAgdmFyIGY7ICAgICAgICAgICAgICAvKiBmcmVxdWVuY3kgKi9cbiAgdmFyIG92ZXJmbG93ID0gMDsgICAvKiBudW1iZXIgb2YgZWxlbWVudHMgd2l0aCBiaXQgbGVuZ3RoIHRvbyBsYXJnZSAqL1xuXG4gIGZvciAoYml0cyA9IDA7IGJpdHMgPD0gTUFYX0JJVFM7IGJpdHMrKykge1xuICAgIHMuYmxfY291bnRbYml0c10gPSAwO1xuICB9XG5cbiAgLyogSW4gYSBmaXJzdCBwYXNzLCBjb21wdXRlIHRoZSBvcHRpbWFsIGJpdCBsZW5ndGhzICh3aGljaCBtYXlcbiAgICogb3ZlcmZsb3cgaW4gdGhlIGNhc2Ugb2YgdGhlIGJpdCBsZW5ndGggdHJlZSkuXG4gICAqL1xuICB0cmVlW3MuaGVhcFtzLmhlYXBfbWF4XSAqIDIgKyAxXS8qLkxlbiovID0gMDsgLyogcm9vdCBvZiB0aGUgaGVhcCAqL1xuXG4gIGZvciAoaCA9IHMuaGVhcF9tYXggKyAxOyBoIDwgSEVBUF9TSVpFOyBoKyspIHtcbiAgICBuID0gcy5oZWFwW2hdO1xuICAgIGJpdHMgPSB0cmVlW3RyZWVbbiAqIDIgKyAxXS8qLkRhZCovICogMiArIDFdLyouTGVuKi8gKyAxO1xuICAgIGlmIChiaXRzID4gbWF4X2xlbmd0aCkge1xuICAgICAgYml0cyA9IG1heF9sZW5ndGg7XG4gICAgICBvdmVyZmxvdysrO1xuICAgIH1cbiAgICB0cmVlW24gKiAyICsgMV0vKi5MZW4qLyA9IGJpdHM7XG4gICAgLyogV2Ugb3ZlcndyaXRlIHRyZWVbbl0uRGFkIHdoaWNoIGlzIG5vIGxvbmdlciBuZWVkZWQgKi9cblxuICAgIGlmIChuID4gbWF4X2NvZGUpIHsgY29udGludWU7IH0gLyogbm90IGEgbGVhZiBub2RlICovXG5cbiAgICBzLmJsX2NvdW50W2JpdHNdKys7XG4gICAgeGJpdHMgPSAwO1xuICAgIGlmIChuID49IGJhc2UpIHtcbiAgICAgIHhiaXRzID0gZXh0cmFbbiAtIGJhc2VdO1xuICAgIH1cbiAgICBmID0gdHJlZVtuICogMl0vKi5GcmVxKi87XG4gICAgcy5vcHRfbGVuICs9IGYgKiAoYml0cyArIHhiaXRzKTtcbiAgICBpZiAoaGFzX3N0cmVlKSB7XG4gICAgICBzLnN0YXRpY19sZW4gKz0gZiAqIChzdHJlZVtuICogMiArIDFdLyouTGVuKi8gKyB4Yml0cyk7XG4gICAgfVxuICB9XG4gIGlmIChvdmVyZmxvdyA9PT0gMCkgeyByZXR1cm47IH1cblxuICAvLyBUcmFjZSgoc3RkZXJyLFwiXFxuYml0IGxlbmd0aCBvdmVyZmxvd1xcblwiKSk7XG4gIC8qIFRoaXMgaGFwcGVucyBmb3IgZXhhbXBsZSBvbiBvYmoyIGFuZCBwaWMgb2YgdGhlIENhbGdhcnkgY29ycHVzICovXG5cbiAgLyogRmluZCB0aGUgZmlyc3QgYml0IGxlbmd0aCB3aGljaCBjb3VsZCBpbmNyZWFzZTogKi9cbiAgZG8ge1xuICAgIGJpdHMgPSBtYXhfbGVuZ3RoIC0gMTtcbiAgICB3aGlsZSAocy5ibF9jb3VudFtiaXRzXSA9PT0gMCkgeyBiaXRzLS07IH1cbiAgICBzLmJsX2NvdW50W2JpdHNdLS07ICAgICAgLyogbW92ZSBvbmUgbGVhZiBkb3duIHRoZSB0cmVlICovXG4gICAgcy5ibF9jb3VudFtiaXRzICsgMV0gKz0gMjsgLyogbW92ZSBvbmUgb3ZlcmZsb3cgaXRlbSBhcyBpdHMgYnJvdGhlciAqL1xuICAgIHMuYmxfY291bnRbbWF4X2xlbmd0aF0tLTtcbiAgICAvKiBUaGUgYnJvdGhlciBvZiB0aGUgb3ZlcmZsb3cgaXRlbSBhbHNvIG1vdmVzIG9uZSBzdGVwIHVwLFxuICAgICAqIGJ1dCB0aGlzIGRvZXMgbm90IGFmZmVjdCBibF9jb3VudFttYXhfbGVuZ3RoXVxuICAgICAqL1xuICAgIG92ZXJmbG93IC09IDI7XG4gIH0gd2hpbGUgKG92ZXJmbG93ID4gMCk7XG5cbiAgLyogTm93IHJlY29tcHV0ZSBhbGwgYml0IGxlbmd0aHMsIHNjYW5uaW5nIGluIGluY3JlYXNpbmcgZnJlcXVlbmN5LlxuICAgKiBoIGlzIHN0aWxsIGVxdWFsIHRvIEhFQVBfU0laRS4gKEl0IGlzIHNpbXBsZXIgdG8gcmVjb25zdHJ1Y3QgYWxsXG4gICAqIGxlbmd0aHMgaW5zdGVhZCBvZiBmaXhpbmcgb25seSB0aGUgd3Jvbmcgb25lcy4gVGhpcyBpZGVhIGlzIHRha2VuXG4gICAqIGZyb20gJ2FyJyB3cml0dGVuIGJ5IEhhcnVoaWtvIE9rdW11cmEuKVxuICAgKi9cbiAgZm9yIChiaXRzID0gbWF4X2xlbmd0aDsgYml0cyAhPT0gMDsgYml0cy0tKSB7XG4gICAgbiA9IHMuYmxfY291bnRbYml0c107XG4gICAgd2hpbGUgKG4gIT09IDApIHtcbiAgICAgIG0gPSBzLmhlYXBbLS1oXTtcbiAgICAgIGlmIChtID4gbWF4X2NvZGUpIHsgY29udGludWU7IH1cbiAgICAgIGlmICh0cmVlW20gKiAyICsgMV0vKi5MZW4qLyAhPT0gYml0cykge1xuICAgICAgICAvLyBUcmFjZSgoc3RkZXJyLFwiY29kZSAlZCBiaXRzICVkLT4lZFxcblwiLCBtLCB0cmVlW21dLkxlbiwgYml0cykpO1xuICAgICAgICBzLm9wdF9sZW4gKz0gKGJpdHMgLSB0cmVlW20gKiAyICsgMV0vKi5MZW4qLykgKiB0cmVlW20gKiAyXS8qLkZyZXEqLztcbiAgICAgICAgdHJlZVttICogMiArIDFdLyouTGVuKi8gPSBiaXRzO1xuICAgICAgfVxuICAgICAgbi0tO1xuICAgIH1cbiAgfVxufVxuXG5cbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogR2VuZXJhdGUgdGhlIGNvZGVzIGZvciBhIGdpdmVuIHRyZWUgYW5kIGJpdCBjb3VudHMgKHdoaWNoIG5lZWQgbm90IGJlXG4gKiBvcHRpbWFsKS5cbiAqIElOIGFzc2VydGlvbjogdGhlIGFycmF5IGJsX2NvdW50IGNvbnRhaW5zIHRoZSBiaXQgbGVuZ3RoIHN0YXRpc3RpY3MgZm9yXG4gKiB0aGUgZ2l2ZW4gdHJlZSBhbmQgdGhlIGZpZWxkIGxlbiBpcyBzZXQgZm9yIGFsbCB0cmVlIGVsZW1lbnRzLlxuICogT1VUIGFzc2VydGlvbjogdGhlIGZpZWxkIGNvZGUgaXMgc2V0IGZvciBhbGwgdHJlZSBlbGVtZW50cyBvZiBub25cbiAqICAgICB6ZXJvIGNvZGUgbGVuZ3RoLlxuICovXG5mdW5jdGlvbiBnZW5fY29kZXModHJlZSwgbWF4X2NvZGUsIGJsX2NvdW50KVxuLy8gICAgY3RfZGF0YSAqdHJlZTsgICAgICAgICAgICAgLyogdGhlIHRyZWUgdG8gZGVjb3JhdGUgKi9cbi8vICAgIGludCBtYXhfY29kZTsgICAgICAgICAgICAgIC8qIGxhcmdlc3QgY29kZSB3aXRoIG5vbiB6ZXJvIGZyZXF1ZW5jeSAqL1xuLy8gICAgdXNoZiAqYmxfY291bnQ7ICAgICAgICAgICAgLyogbnVtYmVyIG9mIGNvZGVzIGF0IGVhY2ggYml0IGxlbmd0aCAqL1xue1xuICB2YXIgbmV4dF9jb2RlID0gbmV3IEFycmF5KE1BWF9CSVRTICsgMSk7IC8qIG5leHQgY29kZSB2YWx1ZSBmb3IgZWFjaCBiaXQgbGVuZ3RoICovXG4gIHZhciBjb2RlID0gMDsgICAgICAgICAgICAgIC8qIHJ1bm5pbmcgY29kZSB2YWx1ZSAqL1xuICB2YXIgYml0czsgICAgICAgICAgICAgICAgICAvKiBiaXQgaW5kZXggKi9cbiAgdmFyIG47ICAgICAgICAgICAgICAgICAgICAgLyogY29kZSBpbmRleCAqL1xuXG4gIC8qIFRoZSBkaXN0cmlidXRpb24gY291bnRzIGFyZSBmaXJzdCB1c2VkIHRvIGdlbmVyYXRlIHRoZSBjb2RlIHZhbHVlc1xuICAgKiB3aXRob3V0IGJpdCByZXZlcnNhbC5cbiAgICovXG4gIGZvciAoYml0cyA9IDE7IGJpdHMgPD0gTUFYX0JJVFM7IGJpdHMrKykge1xuICAgIG5leHRfY29kZVtiaXRzXSA9IGNvZGUgPSAoY29kZSArIGJsX2NvdW50W2JpdHMgLSAxXSkgPDwgMTtcbiAgfVxuICAvKiBDaGVjayB0aGF0IHRoZSBiaXQgY291bnRzIGluIGJsX2NvdW50IGFyZSBjb25zaXN0ZW50LiBUaGUgbGFzdCBjb2RlXG4gICAqIG11c3QgYmUgYWxsIG9uZXMuXG4gICAqL1xuICAvL0Fzc2VydCAoY29kZSArIGJsX2NvdW50W01BWF9CSVRTXS0xID09ICgxPDxNQVhfQklUUyktMSxcbiAgLy8gICAgICAgIFwiaW5jb25zaXN0ZW50IGJpdCBjb3VudHNcIik7XG4gIC8vVHJhY2V2KChzdGRlcnIsXCJcXG5nZW5fY29kZXM6IG1heF9jb2RlICVkIFwiLCBtYXhfY29kZSkpO1xuXG4gIGZvciAobiA9IDA7ICBuIDw9IG1heF9jb2RlOyBuKyspIHtcbiAgICB2YXIgbGVuID0gdHJlZVtuICogMiArIDFdLyouTGVuKi87XG4gICAgaWYgKGxlbiA9PT0gMCkgeyBjb250aW51ZTsgfVxuICAgIC8qIE5vdyByZXZlcnNlIHRoZSBiaXRzICovXG4gICAgdHJlZVtuICogMl0vKi5Db2RlKi8gPSBiaV9yZXZlcnNlKG5leHRfY29kZVtsZW5dKyssIGxlbik7XG5cbiAgICAvL1RyYWNlY3YodHJlZSAhPSBzdGF0aWNfbHRyZWUsIChzdGRlcnIsXCJcXG5uICUzZCAlYyBsICUyZCBjICU0eCAoJXgpIFwiLFxuICAgIC8vICAgICBuLCAoaXNncmFwaChuKSA/IG4gOiAnICcpLCBsZW4sIHRyZWVbbl0uQ29kZSwgbmV4dF9jb2RlW2xlbl0tMSkpO1xuICB9XG59XG5cblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBJbml0aWFsaXplIHRoZSB2YXJpb3VzICdjb25zdGFudCcgdGFibGVzLlxuICovXG5mdW5jdGlvbiB0cl9zdGF0aWNfaW5pdCgpIHtcbiAgdmFyIG47ICAgICAgICAvKiBpdGVyYXRlcyBvdmVyIHRyZWUgZWxlbWVudHMgKi9cbiAgdmFyIGJpdHM7ICAgICAvKiBiaXQgY291bnRlciAqL1xuICB2YXIgbGVuZ3RoOyAgIC8qIGxlbmd0aCB2YWx1ZSAqL1xuICB2YXIgY29kZTsgICAgIC8qIGNvZGUgdmFsdWUgKi9cbiAgdmFyIGRpc3Q7ICAgICAvKiBkaXN0YW5jZSBpbmRleCAqL1xuICB2YXIgYmxfY291bnQgPSBuZXcgQXJyYXkoTUFYX0JJVFMgKyAxKTtcbiAgLyogbnVtYmVyIG9mIGNvZGVzIGF0IGVhY2ggYml0IGxlbmd0aCBmb3IgYW4gb3B0aW1hbCB0cmVlICovXG5cbiAgLy8gZG8gY2hlY2sgaW4gX3RyX2luaXQoKVxuICAvL2lmIChzdGF0aWNfaW5pdF9kb25lKSByZXR1cm47XG5cbiAgLyogRm9yIHNvbWUgZW1iZWRkZWQgdGFyZ2V0cywgZ2xvYmFsIHZhcmlhYmxlcyBhcmUgbm90IGluaXRpYWxpemVkOiAqL1xuLyojaWZkZWYgTk9fSU5JVF9HTE9CQUxfUE9JTlRFUlNcbiAgc3RhdGljX2xfZGVzYy5zdGF0aWNfdHJlZSA9IHN0YXRpY19sdHJlZTtcbiAgc3RhdGljX2xfZGVzYy5leHRyYV9iaXRzID0gZXh0cmFfbGJpdHM7XG4gIHN0YXRpY19kX2Rlc2Muc3RhdGljX3RyZWUgPSBzdGF0aWNfZHRyZWU7XG4gIHN0YXRpY19kX2Rlc2MuZXh0cmFfYml0cyA9IGV4dHJhX2RiaXRzO1xuICBzdGF0aWNfYmxfZGVzYy5leHRyYV9iaXRzID0gZXh0cmFfYmxiaXRzO1xuI2VuZGlmKi9cblxuICAvKiBJbml0aWFsaXplIHRoZSBtYXBwaW5nIGxlbmd0aCAoMC4uMjU1KSAtPiBsZW5ndGggY29kZSAoMC4uMjgpICovXG4gIGxlbmd0aCA9IDA7XG4gIGZvciAoY29kZSA9IDA7IGNvZGUgPCBMRU5HVEhfQ09ERVMgLSAxOyBjb2RlKyspIHtcbiAgICBiYXNlX2xlbmd0aFtjb2RlXSA9IGxlbmd0aDtcbiAgICBmb3IgKG4gPSAwOyBuIDwgKDEgPDwgZXh0cmFfbGJpdHNbY29kZV0pOyBuKyspIHtcbiAgICAgIF9sZW5ndGhfY29kZVtsZW5ndGgrK10gPSBjb2RlO1xuICAgIH1cbiAgfVxuICAvL0Fzc2VydCAobGVuZ3RoID09IDI1NiwgXCJ0cl9zdGF0aWNfaW5pdDogbGVuZ3RoICE9IDI1NlwiKTtcbiAgLyogTm90ZSB0aGF0IHRoZSBsZW5ndGggMjU1IChtYXRjaCBsZW5ndGggMjU4KSBjYW4gYmUgcmVwcmVzZW50ZWRcbiAgICogaW4gdHdvIGRpZmZlcmVudCB3YXlzOiBjb2RlIDI4NCArIDUgYml0cyBvciBjb2RlIDI4NSwgc28gd2VcbiAgICogb3ZlcndyaXRlIGxlbmd0aF9jb2RlWzI1NV0gdG8gdXNlIHRoZSBiZXN0IGVuY29kaW5nOlxuICAgKi9cbiAgX2xlbmd0aF9jb2RlW2xlbmd0aCAtIDFdID0gY29kZTtcblxuICAvKiBJbml0aWFsaXplIHRoZSBtYXBwaW5nIGRpc3QgKDAuLjMySykgLT4gZGlzdCBjb2RlICgwLi4yOSkgKi9cbiAgZGlzdCA9IDA7XG4gIGZvciAoY29kZSA9IDA7IGNvZGUgPCAxNjsgY29kZSsrKSB7XG4gICAgYmFzZV9kaXN0W2NvZGVdID0gZGlzdDtcbiAgICBmb3IgKG4gPSAwOyBuIDwgKDEgPDwgZXh0cmFfZGJpdHNbY29kZV0pOyBuKyspIHtcbiAgICAgIF9kaXN0X2NvZGVbZGlzdCsrXSA9IGNvZGU7XG4gICAgfVxuICB9XG4gIC8vQXNzZXJ0IChkaXN0ID09IDI1NiwgXCJ0cl9zdGF0aWNfaW5pdDogZGlzdCAhPSAyNTZcIik7XG4gIGRpc3QgPj49IDc7IC8qIGZyb20gbm93IG9uLCBhbGwgZGlzdGFuY2VzIGFyZSBkaXZpZGVkIGJ5IDEyOCAqL1xuICBmb3IgKDsgY29kZSA8IERfQ09ERVM7IGNvZGUrKykge1xuICAgIGJhc2VfZGlzdFtjb2RlXSA9IGRpc3QgPDwgNztcbiAgICBmb3IgKG4gPSAwOyBuIDwgKDEgPDwgKGV4dHJhX2RiaXRzW2NvZGVdIC0gNykpOyBuKyspIHtcbiAgICAgIF9kaXN0X2NvZGVbMjU2ICsgZGlzdCsrXSA9IGNvZGU7XG4gICAgfVxuICB9XG4gIC8vQXNzZXJ0IChkaXN0ID09IDI1NiwgXCJ0cl9zdGF0aWNfaW5pdDogMjU2K2Rpc3QgIT0gNTEyXCIpO1xuXG4gIC8qIENvbnN0cnVjdCB0aGUgY29kZXMgb2YgdGhlIHN0YXRpYyBsaXRlcmFsIHRyZWUgKi9cbiAgZm9yIChiaXRzID0gMDsgYml0cyA8PSBNQVhfQklUUzsgYml0cysrKSB7XG4gICAgYmxfY291bnRbYml0c10gPSAwO1xuICB9XG5cbiAgbiA9IDA7XG4gIHdoaWxlIChuIDw9IDE0Mykge1xuICAgIHN0YXRpY19sdHJlZVtuICogMiArIDFdLyouTGVuKi8gPSA4O1xuICAgIG4rKztcbiAgICBibF9jb3VudFs4XSsrO1xuICB9XG4gIHdoaWxlIChuIDw9IDI1NSkge1xuICAgIHN0YXRpY19sdHJlZVtuICogMiArIDFdLyouTGVuKi8gPSA5O1xuICAgIG4rKztcbiAgICBibF9jb3VudFs5XSsrO1xuICB9XG4gIHdoaWxlIChuIDw9IDI3OSkge1xuICAgIHN0YXRpY19sdHJlZVtuICogMiArIDFdLyouTGVuKi8gPSA3O1xuICAgIG4rKztcbiAgICBibF9jb3VudFs3XSsrO1xuICB9XG4gIHdoaWxlIChuIDw9IDI4Nykge1xuICAgIHN0YXRpY19sdHJlZVtuICogMiArIDFdLyouTGVuKi8gPSA4O1xuICAgIG4rKztcbiAgICBibF9jb3VudFs4XSsrO1xuICB9XG4gIC8qIENvZGVzIDI4NiBhbmQgMjg3IGRvIG5vdCBleGlzdCwgYnV0IHdlIG11c3QgaW5jbHVkZSB0aGVtIGluIHRoZVxuICAgKiB0cmVlIGNvbnN0cnVjdGlvbiB0byBnZXQgYSBjYW5vbmljYWwgSHVmZm1hbiB0cmVlIChsb25nZXN0IGNvZGVcbiAgICogYWxsIG9uZXMpXG4gICAqL1xuICBnZW5fY29kZXMoc3RhdGljX2x0cmVlLCBMX0NPREVTICsgMSwgYmxfY291bnQpO1xuXG4gIC8qIFRoZSBzdGF0aWMgZGlzdGFuY2UgdHJlZSBpcyB0cml2aWFsOiAqL1xuICBmb3IgKG4gPSAwOyBuIDwgRF9DT0RFUzsgbisrKSB7XG4gICAgc3RhdGljX2R0cmVlW24gKiAyICsgMV0vKi5MZW4qLyA9IDU7XG4gICAgc3RhdGljX2R0cmVlW24gKiAyXS8qLkNvZGUqLyA9IGJpX3JldmVyc2UobiwgNSk7XG4gIH1cblxuICAvLyBOb3cgZGF0YSByZWFkeSBhbmQgd2UgY2FuIGluaXQgc3RhdGljIHRyZWVzXG4gIHN0YXRpY19sX2Rlc2MgPSBuZXcgU3RhdGljVHJlZURlc2Moc3RhdGljX2x0cmVlLCBleHRyYV9sYml0cywgTElURVJBTFMgKyAxLCBMX0NPREVTLCBNQVhfQklUUyk7XG4gIHN0YXRpY19kX2Rlc2MgPSBuZXcgU3RhdGljVHJlZURlc2Moc3RhdGljX2R0cmVlLCBleHRyYV9kYml0cywgMCwgICAgICAgICAgRF9DT0RFUywgTUFYX0JJVFMpO1xuICBzdGF0aWNfYmxfZGVzYyA9IG5ldyBTdGF0aWNUcmVlRGVzYyhuZXcgQXJyYXkoMCksIGV4dHJhX2JsYml0cywgMCwgICAgICAgICBCTF9DT0RFUywgTUFYX0JMX0JJVFMpO1xuXG4gIC8vc3RhdGljX2luaXRfZG9uZSA9IHRydWU7XG59XG5cblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBJbml0aWFsaXplIGEgbmV3IGJsb2NrLlxuICovXG5mdW5jdGlvbiBpbml0X2Jsb2NrKHMpIHtcbiAgdmFyIG47IC8qIGl0ZXJhdGVzIG92ZXIgdHJlZSBlbGVtZW50cyAqL1xuXG4gIC8qIEluaXRpYWxpemUgdGhlIHRyZWVzLiAqL1xuICBmb3IgKG4gPSAwOyBuIDwgTF9DT0RFUzsgIG4rKykgeyBzLmR5bl9sdHJlZVtuICogMl0vKi5GcmVxKi8gPSAwOyB9XG4gIGZvciAobiA9IDA7IG4gPCBEX0NPREVTOyAgbisrKSB7IHMuZHluX2R0cmVlW24gKiAyXS8qLkZyZXEqLyA9IDA7IH1cbiAgZm9yIChuID0gMDsgbiA8IEJMX0NPREVTOyBuKyspIHsgcy5ibF90cmVlW24gKiAyXS8qLkZyZXEqLyA9IDA7IH1cblxuICBzLmR5bl9sdHJlZVtFTkRfQkxPQ0sgKiAyXS8qLkZyZXEqLyA9IDE7XG4gIHMub3B0X2xlbiA9IHMuc3RhdGljX2xlbiA9IDA7XG4gIHMubGFzdF9saXQgPSBzLm1hdGNoZXMgPSAwO1xufVxuXG5cbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogRmx1c2ggdGhlIGJpdCBidWZmZXIgYW5kIGFsaWduIHRoZSBvdXRwdXQgb24gYSBieXRlIGJvdW5kYXJ5XG4gKi9cbmZ1bmN0aW9uIGJpX3dpbmR1cChzKVxue1xuICBpZiAocy5iaV92YWxpZCA+IDgpIHtcbiAgICBwdXRfc2hvcnQocywgcy5iaV9idWYpO1xuICB9IGVsc2UgaWYgKHMuYmlfdmFsaWQgPiAwKSB7XG4gICAgLy9wdXRfYnl0ZShzLCAoQnl0ZSlzLT5iaV9idWYpO1xuICAgIHMucGVuZGluZ19idWZbcy5wZW5kaW5nKytdID0gcy5iaV9idWY7XG4gIH1cbiAgcy5iaV9idWYgPSAwO1xuICBzLmJpX3ZhbGlkID0gMDtcbn1cblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBDb3B5IGEgc3RvcmVkIGJsb2NrLCBzdG9yaW5nIGZpcnN0IHRoZSBsZW5ndGggYW5kIGl0c1xuICogb25lJ3MgY29tcGxlbWVudCBpZiByZXF1ZXN0ZWQuXG4gKi9cbmZ1bmN0aW9uIGNvcHlfYmxvY2socywgYnVmLCBsZW4sIGhlYWRlcilcbi8vRGVmbGF0ZVN0YXRlICpzO1xuLy9jaGFyZiAgICAqYnVmOyAgICAvKiB0aGUgaW5wdXQgZGF0YSAqL1xuLy91bnNpZ25lZCBsZW47ICAgICAvKiBpdHMgbGVuZ3RoICovXG4vL2ludCAgICAgIGhlYWRlcjsgIC8qIHRydWUgaWYgYmxvY2sgaGVhZGVyIG11c3QgYmUgd3JpdHRlbiAqL1xue1xuICBiaV93aW5kdXAocyk7ICAgICAgICAvKiBhbGlnbiBvbiBieXRlIGJvdW5kYXJ5ICovXG5cbiAge1xuICAgIHB1dF9zaG9ydChzLCBsZW4pO1xuICAgIHB1dF9zaG9ydChzLCB+bGVuKTtcbiAgfVxuLy8gIHdoaWxlIChsZW4tLSkge1xuLy8gICAgcHV0X2J5dGUocywgKmJ1ZisrKTtcbi8vICB9XG4gIHV0aWxzLmFycmF5U2V0KHMucGVuZGluZ19idWYsIHMud2luZG93LCBidWYsIGxlbiwgcy5wZW5kaW5nKTtcbiAgcy5wZW5kaW5nICs9IGxlbjtcbn1cblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBDb21wYXJlcyB0byBzdWJ0cmVlcywgdXNpbmcgdGhlIHRyZWUgZGVwdGggYXMgdGllIGJyZWFrZXIgd2hlblxuICogdGhlIHN1YnRyZWVzIGhhdmUgZXF1YWwgZnJlcXVlbmN5LiBUaGlzIG1pbmltaXplcyB0aGUgd29yc3QgY2FzZSBsZW5ndGguXG4gKi9cbmZ1bmN0aW9uIHNtYWxsZXIodHJlZSwgbiwgbSwgZGVwdGgpIHtcbiAgdmFyIF9uMiA9IG4gKiAyO1xuICB2YXIgX20yID0gbSAqIDI7XG4gIHJldHVybiAodHJlZVtfbjJdLyouRnJlcSovIDwgdHJlZVtfbTJdLyouRnJlcSovIHx8XG4gICAgICAgICAodHJlZVtfbjJdLyouRnJlcSovID09PSB0cmVlW19tMl0vKi5GcmVxKi8gJiYgZGVwdGhbbl0gPD0gZGVwdGhbbV0pKTtcbn1cblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBSZXN0b3JlIHRoZSBoZWFwIHByb3BlcnR5IGJ5IG1vdmluZyBkb3duIHRoZSB0cmVlIHN0YXJ0aW5nIGF0IG5vZGUgayxcbiAqIGV4Y2hhbmdpbmcgYSBub2RlIHdpdGggdGhlIHNtYWxsZXN0IG9mIGl0cyB0d28gc29ucyBpZiBuZWNlc3NhcnksIHN0b3BwaW5nXG4gKiB3aGVuIHRoZSBoZWFwIHByb3BlcnR5IGlzIHJlLWVzdGFibGlzaGVkIChlYWNoIGZhdGhlciBzbWFsbGVyIHRoYW4gaXRzXG4gKiB0d28gc29ucykuXG4gKi9cbmZ1bmN0aW9uIHBxZG93bmhlYXAocywgdHJlZSwgaylcbi8vICAgIGRlZmxhdGVfc3RhdGUgKnM7XG4vLyAgICBjdF9kYXRhICp0cmVlOyAgLyogdGhlIHRyZWUgdG8gcmVzdG9yZSAqL1xuLy8gICAgaW50IGs7ICAgICAgICAgICAgICAgLyogbm9kZSB0byBtb3ZlIGRvd24gKi9cbntcbiAgdmFyIHYgPSBzLmhlYXBba107XG4gIHZhciBqID0gayA8PCAxOyAgLyogbGVmdCBzb24gb2YgayAqL1xuICB3aGlsZSAoaiA8PSBzLmhlYXBfbGVuKSB7XG4gICAgLyogU2V0IGogdG8gdGhlIHNtYWxsZXN0IG9mIHRoZSB0d28gc29uczogKi9cbiAgICBpZiAoaiA8IHMuaGVhcF9sZW4gJiZcbiAgICAgIHNtYWxsZXIodHJlZSwgcy5oZWFwW2ogKyAxXSwgcy5oZWFwW2pdLCBzLmRlcHRoKSkge1xuICAgICAgaisrO1xuICAgIH1cbiAgICAvKiBFeGl0IGlmIHYgaXMgc21hbGxlciB0aGFuIGJvdGggc29ucyAqL1xuICAgIGlmIChzbWFsbGVyKHRyZWUsIHYsIHMuaGVhcFtqXSwgcy5kZXB0aCkpIHsgYnJlYWs7IH1cblxuICAgIC8qIEV4Y2hhbmdlIHYgd2l0aCB0aGUgc21hbGxlc3Qgc29uICovXG4gICAgcy5oZWFwW2tdID0gcy5oZWFwW2pdO1xuICAgIGsgPSBqO1xuXG4gICAgLyogQW5kIGNvbnRpbnVlIGRvd24gdGhlIHRyZWUsIHNldHRpbmcgaiB0byB0aGUgbGVmdCBzb24gb2YgayAqL1xuICAgIGogPDw9IDE7XG4gIH1cbiAgcy5oZWFwW2tdID0gdjtcbn1cblxuXG4vLyBpbmxpbmVkIG1hbnVhbGx5XG4vLyB2YXIgU01BTExFU1QgPSAxO1xuXG4vKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIFNlbmQgdGhlIGJsb2NrIGRhdGEgY29tcHJlc3NlZCB1c2luZyB0aGUgZ2l2ZW4gSHVmZm1hbiB0cmVlc1xuICovXG5mdW5jdGlvbiBjb21wcmVzc19ibG9jayhzLCBsdHJlZSwgZHRyZWUpXG4vLyAgICBkZWZsYXRlX3N0YXRlICpzO1xuLy8gICAgY29uc3QgY3RfZGF0YSAqbHRyZWU7IC8qIGxpdGVyYWwgdHJlZSAqL1xuLy8gICAgY29uc3QgY3RfZGF0YSAqZHRyZWU7IC8qIGRpc3RhbmNlIHRyZWUgKi9cbntcbiAgdmFyIGRpc3Q7ICAgICAgICAgICAvKiBkaXN0YW5jZSBvZiBtYXRjaGVkIHN0cmluZyAqL1xuICB2YXIgbGM7ICAgICAgICAgICAgIC8qIG1hdGNoIGxlbmd0aCBvciB1bm1hdGNoZWQgY2hhciAoaWYgZGlzdCA9PSAwKSAqL1xuICB2YXIgbHggPSAwOyAgICAgICAgIC8qIHJ1bm5pbmcgaW5kZXggaW4gbF9idWYgKi9cbiAgdmFyIGNvZGU7ICAgICAgICAgICAvKiB0aGUgY29kZSB0byBzZW5kICovXG4gIHZhciBleHRyYTsgICAgICAgICAgLyogbnVtYmVyIG9mIGV4dHJhIGJpdHMgdG8gc2VuZCAqL1xuXG4gIGlmIChzLmxhc3RfbGl0ICE9PSAwKSB7XG4gICAgZG8ge1xuICAgICAgZGlzdCA9IChzLnBlbmRpbmdfYnVmW3MuZF9idWYgKyBseCAqIDJdIDw8IDgpIHwgKHMucGVuZGluZ19idWZbcy5kX2J1ZiArIGx4ICogMiArIDFdKTtcbiAgICAgIGxjID0gcy5wZW5kaW5nX2J1ZltzLmxfYnVmICsgbHhdO1xuICAgICAgbHgrKztcblxuICAgICAgaWYgKGRpc3QgPT09IDApIHtcbiAgICAgICAgc2VuZF9jb2RlKHMsIGxjLCBsdHJlZSk7IC8qIHNlbmQgYSBsaXRlcmFsIGJ5dGUgKi9cbiAgICAgICAgLy9UcmFjZWN2KGlzZ3JhcGgobGMpLCAoc3RkZXJyLFwiICclYycgXCIsIGxjKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvKiBIZXJlLCBsYyBpcyB0aGUgbWF0Y2ggbGVuZ3RoIC0gTUlOX01BVENIICovXG4gICAgICAgIGNvZGUgPSBfbGVuZ3RoX2NvZGVbbGNdO1xuICAgICAgICBzZW5kX2NvZGUocywgY29kZSArIExJVEVSQUxTICsgMSwgbHRyZWUpOyAvKiBzZW5kIHRoZSBsZW5ndGggY29kZSAqL1xuICAgICAgICBleHRyYSA9IGV4dHJhX2xiaXRzW2NvZGVdO1xuICAgICAgICBpZiAoZXh0cmEgIT09IDApIHtcbiAgICAgICAgICBsYyAtPSBiYXNlX2xlbmd0aFtjb2RlXTtcbiAgICAgICAgICBzZW5kX2JpdHMocywgbGMsIGV4dHJhKTsgICAgICAgLyogc2VuZCB0aGUgZXh0cmEgbGVuZ3RoIGJpdHMgKi9cbiAgICAgICAgfVxuICAgICAgICBkaXN0LS07IC8qIGRpc3QgaXMgbm93IHRoZSBtYXRjaCBkaXN0YW5jZSAtIDEgKi9cbiAgICAgICAgY29kZSA9IGRfY29kZShkaXN0KTtcbiAgICAgICAgLy9Bc3NlcnQgKGNvZGUgPCBEX0NPREVTLCBcImJhZCBkX2NvZGVcIik7XG5cbiAgICAgICAgc2VuZF9jb2RlKHMsIGNvZGUsIGR0cmVlKTsgICAgICAgLyogc2VuZCB0aGUgZGlzdGFuY2UgY29kZSAqL1xuICAgICAgICBleHRyYSA9IGV4dHJhX2RiaXRzW2NvZGVdO1xuICAgICAgICBpZiAoZXh0cmEgIT09IDApIHtcbiAgICAgICAgICBkaXN0IC09IGJhc2VfZGlzdFtjb2RlXTtcbiAgICAgICAgICBzZW5kX2JpdHMocywgZGlzdCwgZXh0cmEpOyAgIC8qIHNlbmQgdGhlIGV4dHJhIGRpc3RhbmNlIGJpdHMgKi9cbiAgICAgICAgfVxuICAgICAgfSAvKiBsaXRlcmFsIG9yIG1hdGNoIHBhaXIgPyAqL1xuXG4gICAgICAvKiBDaGVjayB0aGF0IHRoZSBvdmVybGF5IGJldHdlZW4gcGVuZGluZ19idWYgYW5kIGRfYnVmK2xfYnVmIGlzIG9rOiAqL1xuICAgICAgLy9Bc3NlcnQoKHVJbnQpKHMtPnBlbmRpbmcpIDwgcy0+bGl0X2J1ZnNpemUgKyAyKmx4LFxuICAgICAgLy8gICAgICAgXCJwZW5kaW5nQnVmIG92ZXJmbG93XCIpO1xuXG4gICAgfSB3aGlsZSAobHggPCBzLmxhc3RfbGl0KTtcbiAgfVxuXG4gIHNlbmRfY29kZShzLCBFTkRfQkxPQ0ssIGx0cmVlKTtcbn1cblxuXG4vKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIENvbnN0cnVjdCBvbmUgSHVmZm1hbiB0cmVlIGFuZCBhc3NpZ25zIHRoZSBjb2RlIGJpdCBzdHJpbmdzIGFuZCBsZW5ndGhzLlxuICogVXBkYXRlIHRoZSB0b3RhbCBiaXQgbGVuZ3RoIGZvciB0aGUgY3VycmVudCBibG9jay5cbiAqIElOIGFzc2VydGlvbjogdGhlIGZpZWxkIGZyZXEgaXMgc2V0IGZvciBhbGwgdHJlZSBlbGVtZW50cy5cbiAqIE9VVCBhc3NlcnRpb25zOiB0aGUgZmllbGRzIGxlbiBhbmQgY29kZSBhcmUgc2V0IHRvIHRoZSBvcHRpbWFsIGJpdCBsZW5ndGhcbiAqICAgICBhbmQgY29ycmVzcG9uZGluZyBjb2RlLiBUaGUgbGVuZ3RoIG9wdF9sZW4gaXMgdXBkYXRlZDsgc3RhdGljX2xlbiBpc1xuICogICAgIGFsc28gdXBkYXRlZCBpZiBzdHJlZSBpcyBub3QgbnVsbC4gVGhlIGZpZWxkIG1heF9jb2RlIGlzIHNldC5cbiAqL1xuZnVuY3Rpb24gYnVpbGRfdHJlZShzLCBkZXNjKVxuLy8gICAgZGVmbGF0ZV9zdGF0ZSAqcztcbi8vICAgIHRyZWVfZGVzYyAqZGVzYzsgLyogdGhlIHRyZWUgZGVzY3JpcHRvciAqL1xue1xuICB2YXIgdHJlZSAgICAgPSBkZXNjLmR5bl90cmVlO1xuICB2YXIgc3RyZWUgICAgPSBkZXNjLnN0YXRfZGVzYy5zdGF0aWNfdHJlZTtcbiAgdmFyIGhhc19zdHJlZSA9IGRlc2Muc3RhdF9kZXNjLmhhc19zdHJlZTtcbiAgdmFyIGVsZW1zICAgID0gZGVzYy5zdGF0X2Rlc2MuZWxlbXM7XG4gIHZhciBuLCBtOyAgICAgICAgICAvKiBpdGVyYXRlIG92ZXIgaGVhcCBlbGVtZW50cyAqL1xuICB2YXIgbWF4X2NvZGUgPSAtMTsgLyogbGFyZ2VzdCBjb2RlIHdpdGggbm9uIHplcm8gZnJlcXVlbmN5ICovXG4gIHZhciBub2RlOyAgICAgICAgICAvKiBuZXcgbm9kZSBiZWluZyBjcmVhdGVkICovXG5cbiAgLyogQ29uc3RydWN0IHRoZSBpbml0aWFsIGhlYXAsIHdpdGggbGVhc3QgZnJlcXVlbnQgZWxlbWVudCBpblxuICAgKiBoZWFwW1NNQUxMRVNUXS4gVGhlIHNvbnMgb2YgaGVhcFtuXSBhcmUgaGVhcFsyKm5dIGFuZCBoZWFwWzIqbisxXS5cbiAgICogaGVhcFswXSBpcyBub3QgdXNlZC5cbiAgICovXG4gIHMuaGVhcF9sZW4gPSAwO1xuICBzLmhlYXBfbWF4ID0gSEVBUF9TSVpFO1xuXG4gIGZvciAobiA9IDA7IG4gPCBlbGVtczsgbisrKSB7XG4gICAgaWYgKHRyZWVbbiAqIDJdLyouRnJlcSovICE9PSAwKSB7XG4gICAgICBzLmhlYXBbKytzLmhlYXBfbGVuXSA9IG1heF9jb2RlID0gbjtcbiAgICAgIHMuZGVwdGhbbl0gPSAwO1xuXG4gICAgfSBlbHNlIHtcbiAgICAgIHRyZWVbbiAqIDIgKyAxXS8qLkxlbiovID0gMDtcbiAgICB9XG4gIH1cblxuICAvKiBUaGUgcGt6aXAgZm9ybWF0IHJlcXVpcmVzIHRoYXQgYXQgbGVhc3Qgb25lIGRpc3RhbmNlIGNvZGUgZXhpc3RzLFxuICAgKiBhbmQgdGhhdCBhdCBsZWFzdCBvbmUgYml0IHNob3VsZCBiZSBzZW50IGV2ZW4gaWYgdGhlcmUgaXMgb25seSBvbmVcbiAgICogcG9zc2libGUgY29kZS4gU28gdG8gYXZvaWQgc3BlY2lhbCBjaGVja3MgbGF0ZXIgb24gd2UgZm9yY2UgYXQgbGVhc3RcbiAgICogdHdvIGNvZGVzIG9mIG5vbiB6ZXJvIGZyZXF1ZW5jeS5cbiAgICovXG4gIHdoaWxlIChzLmhlYXBfbGVuIDwgMikge1xuICAgIG5vZGUgPSBzLmhlYXBbKytzLmhlYXBfbGVuXSA9IChtYXhfY29kZSA8IDIgPyArK21heF9jb2RlIDogMCk7XG4gICAgdHJlZVtub2RlICogMl0vKi5GcmVxKi8gPSAxO1xuICAgIHMuZGVwdGhbbm9kZV0gPSAwO1xuICAgIHMub3B0X2xlbi0tO1xuXG4gICAgaWYgKGhhc19zdHJlZSkge1xuICAgICAgcy5zdGF0aWNfbGVuIC09IHN0cmVlW25vZGUgKiAyICsgMV0vKi5MZW4qLztcbiAgICB9XG4gICAgLyogbm9kZSBpcyAwIG9yIDEgc28gaXQgZG9lcyBub3QgaGF2ZSBleHRyYSBiaXRzICovXG4gIH1cbiAgZGVzYy5tYXhfY29kZSA9IG1heF9jb2RlO1xuXG4gIC8qIFRoZSBlbGVtZW50cyBoZWFwW2hlYXBfbGVuLzIrMSAuLiBoZWFwX2xlbl0gYXJlIGxlYXZlcyBvZiB0aGUgdHJlZSxcbiAgICogZXN0YWJsaXNoIHN1Yi1oZWFwcyBvZiBpbmNyZWFzaW5nIGxlbmd0aHM6XG4gICAqL1xuICBmb3IgKG4gPSAocy5oZWFwX2xlbiA+PiAxLyppbnQgLzIqLyk7IG4gPj0gMTsgbi0tKSB7IHBxZG93bmhlYXAocywgdHJlZSwgbik7IH1cblxuICAvKiBDb25zdHJ1Y3QgdGhlIEh1ZmZtYW4gdHJlZSBieSByZXBlYXRlZGx5IGNvbWJpbmluZyB0aGUgbGVhc3QgdHdvXG4gICAqIGZyZXF1ZW50IG5vZGVzLlxuICAgKi9cbiAgbm9kZSA9IGVsZW1zOyAgICAgICAgICAgICAgLyogbmV4dCBpbnRlcm5hbCBub2RlIG9mIHRoZSB0cmVlICovXG4gIGRvIHtcbiAgICAvL3BxcmVtb3ZlKHMsIHRyZWUsIG4pOyAgLyogbiA9IG5vZGUgb2YgbGVhc3QgZnJlcXVlbmN5ICovXG4gICAgLyoqKiBwcXJlbW92ZSAqKiovXG4gICAgbiA9IHMuaGVhcFsxLypTTUFMTEVTVCovXTtcbiAgICBzLmhlYXBbMS8qU01BTExFU1QqL10gPSBzLmhlYXBbcy5oZWFwX2xlbi0tXTtcbiAgICBwcWRvd25oZWFwKHMsIHRyZWUsIDEvKlNNQUxMRVNUKi8pO1xuICAgIC8qKiovXG5cbiAgICBtID0gcy5oZWFwWzEvKlNNQUxMRVNUKi9dOyAvKiBtID0gbm9kZSBvZiBuZXh0IGxlYXN0IGZyZXF1ZW5jeSAqL1xuXG4gICAgcy5oZWFwWy0tcy5oZWFwX21heF0gPSBuOyAvKiBrZWVwIHRoZSBub2RlcyBzb3J0ZWQgYnkgZnJlcXVlbmN5ICovXG4gICAgcy5oZWFwWy0tcy5oZWFwX21heF0gPSBtO1xuXG4gICAgLyogQ3JlYXRlIGEgbmV3IG5vZGUgZmF0aGVyIG9mIG4gYW5kIG0gKi9cbiAgICB0cmVlW25vZGUgKiAyXS8qLkZyZXEqLyA9IHRyZWVbbiAqIDJdLyouRnJlcSovICsgdHJlZVttICogMl0vKi5GcmVxKi87XG4gICAgcy5kZXB0aFtub2RlXSA9IChzLmRlcHRoW25dID49IHMuZGVwdGhbbV0gPyBzLmRlcHRoW25dIDogcy5kZXB0aFttXSkgKyAxO1xuICAgIHRyZWVbbiAqIDIgKyAxXS8qLkRhZCovID0gdHJlZVttICogMiArIDFdLyouRGFkKi8gPSBub2RlO1xuXG4gICAgLyogYW5kIGluc2VydCB0aGUgbmV3IG5vZGUgaW4gdGhlIGhlYXAgKi9cbiAgICBzLmhlYXBbMS8qU01BTExFU1QqL10gPSBub2RlKys7XG4gICAgcHFkb3duaGVhcChzLCB0cmVlLCAxLypTTUFMTEVTVCovKTtcblxuICB9IHdoaWxlIChzLmhlYXBfbGVuID49IDIpO1xuXG4gIHMuaGVhcFstLXMuaGVhcF9tYXhdID0gcy5oZWFwWzEvKlNNQUxMRVNUKi9dO1xuXG4gIC8qIEF0IHRoaXMgcG9pbnQsIHRoZSBmaWVsZHMgZnJlcSBhbmQgZGFkIGFyZSBzZXQuIFdlIGNhbiBub3dcbiAgICogZ2VuZXJhdGUgdGhlIGJpdCBsZW5ndGhzLlxuICAgKi9cbiAgZ2VuX2JpdGxlbihzLCBkZXNjKTtcblxuICAvKiBUaGUgZmllbGQgbGVuIGlzIG5vdyBzZXQsIHdlIGNhbiBnZW5lcmF0ZSB0aGUgYml0IGNvZGVzICovXG4gIGdlbl9jb2Rlcyh0cmVlLCBtYXhfY29kZSwgcy5ibF9jb3VudCk7XG59XG5cblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBTY2FuIGEgbGl0ZXJhbCBvciBkaXN0YW5jZSB0cmVlIHRvIGRldGVybWluZSB0aGUgZnJlcXVlbmNpZXMgb2YgdGhlIGNvZGVzXG4gKiBpbiB0aGUgYml0IGxlbmd0aCB0cmVlLlxuICovXG5mdW5jdGlvbiBzY2FuX3RyZWUocywgdHJlZSwgbWF4X2NvZGUpXG4vLyAgICBkZWZsYXRlX3N0YXRlICpzO1xuLy8gICAgY3RfZGF0YSAqdHJlZTsgICAvKiB0aGUgdHJlZSB0byBiZSBzY2FubmVkICovXG4vLyAgICBpbnQgbWF4X2NvZGU7ICAgIC8qIGFuZCBpdHMgbGFyZ2VzdCBjb2RlIG9mIG5vbiB6ZXJvIGZyZXF1ZW5jeSAqL1xue1xuICB2YXIgbjsgICAgICAgICAgICAgICAgICAgICAvKiBpdGVyYXRlcyBvdmVyIGFsbCB0cmVlIGVsZW1lbnRzICovXG4gIHZhciBwcmV2bGVuID0gLTE7ICAgICAgICAgIC8qIGxhc3QgZW1pdHRlZCBsZW5ndGggKi9cbiAgdmFyIGN1cmxlbjsgICAgICAgICAgICAgICAgLyogbGVuZ3RoIG9mIGN1cnJlbnQgY29kZSAqL1xuXG4gIHZhciBuZXh0bGVuID0gdHJlZVswICogMiArIDFdLyouTGVuKi87IC8qIGxlbmd0aCBvZiBuZXh0IGNvZGUgKi9cblxuICB2YXIgY291bnQgPSAwOyAgICAgICAgICAgICAvKiByZXBlYXQgY291bnQgb2YgdGhlIGN1cnJlbnQgY29kZSAqL1xuICB2YXIgbWF4X2NvdW50ID0gNzsgICAgICAgICAvKiBtYXggcmVwZWF0IGNvdW50ICovXG4gIHZhciBtaW5fY291bnQgPSA0OyAgICAgICAgIC8qIG1pbiByZXBlYXQgY291bnQgKi9cblxuICBpZiAobmV4dGxlbiA9PT0gMCkge1xuICAgIG1heF9jb3VudCA9IDEzODtcbiAgICBtaW5fY291bnQgPSAzO1xuICB9XG4gIHRyZWVbKG1heF9jb2RlICsgMSkgKiAyICsgMV0vKi5MZW4qLyA9IDB4ZmZmZjsgLyogZ3VhcmQgKi9cblxuICBmb3IgKG4gPSAwOyBuIDw9IG1heF9jb2RlOyBuKyspIHtcbiAgICBjdXJsZW4gPSBuZXh0bGVuO1xuICAgIG5leHRsZW4gPSB0cmVlWyhuICsgMSkgKiAyICsgMV0vKi5MZW4qLztcblxuICAgIGlmICgrK2NvdW50IDwgbWF4X2NvdW50ICYmIGN1cmxlbiA9PT0gbmV4dGxlbikge1xuICAgICAgY29udGludWU7XG5cbiAgICB9IGVsc2UgaWYgKGNvdW50IDwgbWluX2NvdW50KSB7XG4gICAgICBzLmJsX3RyZWVbY3VybGVuICogMl0vKi5GcmVxKi8gKz0gY291bnQ7XG5cbiAgICB9IGVsc2UgaWYgKGN1cmxlbiAhPT0gMCkge1xuXG4gICAgICBpZiAoY3VybGVuICE9PSBwcmV2bGVuKSB7IHMuYmxfdHJlZVtjdXJsZW4gKiAyXS8qLkZyZXEqLysrOyB9XG4gICAgICBzLmJsX3RyZWVbUkVQXzNfNiAqIDJdLyouRnJlcSovKys7XG5cbiAgICB9IGVsc2UgaWYgKGNvdW50IDw9IDEwKSB7XG4gICAgICBzLmJsX3RyZWVbUkVQWl8zXzEwICogMl0vKi5GcmVxKi8rKztcblxuICAgIH0gZWxzZSB7XG4gICAgICBzLmJsX3RyZWVbUkVQWl8xMV8xMzggKiAyXS8qLkZyZXEqLysrO1xuICAgIH1cblxuICAgIGNvdW50ID0gMDtcbiAgICBwcmV2bGVuID0gY3VybGVuO1xuXG4gICAgaWYgKG5leHRsZW4gPT09IDApIHtcbiAgICAgIG1heF9jb3VudCA9IDEzODtcbiAgICAgIG1pbl9jb3VudCA9IDM7XG5cbiAgICB9IGVsc2UgaWYgKGN1cmxlbiA9PT0gbmV4dGxlbikge1xuICAgICAgbWF4X2NvdW50ID0gNjtcbiAgICAgIG1pbl9jb3VudCA9IDM7XG5cbiAgICB9IGVsc2Uge1xuICAgICAgbWF4X2NvdW50ID0gNztcbiAgICAgIG1pbl9jb3VudCA9IDQ7XG4gICAgfVxuICB9XG59XG5cblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBTZW5kIGEgbGl0ZXJhbCBvciBkaXN0YW5jZSB0cmVlIGluIGNvbXByZXNzZWQgZm9ybSwgdXNpbmcgdGhlIGNvZGVzIGluXG4gKiBibF90cmVlLlxuICovXG5mdW5jdGlvbiBzZW5kX3RyZWUocywgdHJlZSwgbWF4X2NvZGUpXG4vLyAgICBkZWZsYXRlX3N0YXRlICpzO1xuLy8gICAgY3RfZGF0YSAqdHJlZTsgLyogdGhlIHRyZWUgdG8gYmUgc2Nhbm5lZCAqL1xuLy8gICAgaW50IG1heF9jb2RlOyAgICAgICAvKiBhbmQgaXRzIGxhcmdlc3QgY29kZSBvZiBub24gemVybyBmcmVxdWVuY3kgKi9cbntcbiAgdmFyIG47ICAgICAgICAgICAgICAgICAgICAgLyogaXRlcmF0ZXMgb3ZlciBhbGwgdHJlZSBlbGVtZW50cyAqL1xuICB2YXIgcHJldmxlbiA9IC0xOyAgICAgICAgICAvKiBsYXN0IGVtaXR0ZWQgbGVuZ3RoICovXG4gIHZhciBjdXJsZW47ICAgICAgICAgICAgICAgIC8qIGxlbmd0aCBvZiBjdXJyZW50IGNvZGUgKi9cblxuICB2YXIgbmV4dGxlbiA9IHRyZWVbMCAqIDIgKyAxXS8qLkxlbiovOyAvKiBsZW5ndGggb2YgbmV4dCBjb2RlICovXG5cbiAgdmFyIGNvdW50ID0gMDsgICAgICAgICAgICAgLyogcmVwZWF0IGNvdW50IG9mIHRoZSBjdXJyZW50IGNvZGUgKi9cbiAgdmFyIG1heF9jb3VudCA9IDc7ICAgICAgICAgLyogbWF4IHJlcGVhdCBjb3VudCAqL1xuICB2YXIgbWluX2NvdW50ID0gNDsgICAgICAgICAvKiBtaW4gcmVwZWF0IGNvdW50ICovXG5cbiAgLyogdHJlZVttYXhfY29kZSsxXS5MZW4gPSAtMTsgKi8gIC8qIGd1YXJkIGFscmVhZHkgc2V0ICovXG4gIGlmIChuZXh0bGVuID09PSAwKSB7XG4gICAgbWF4X2NvdW50ID0gMTM4O1xuICAgIG1pbl9jb3VudCA9IDM7XG4gIH1cblxuICBmb3IgKG4gPSAwOyBuIDw9IG1heF9jb2RlOyBuKyspIHtcbiAgICBjdXJsZW4gPSBuZXh0bGVuO1xuICAgIG5leHRsZW4gPSB0cmVlWyhuICsgMSkgKiAyICsgMV0vKi5MZW4qLztcblxuICAgIGlmICgrK2NvdW50IDwgbWF4X2NvdW50ICYmIGN1cmxlbiA9PT0gbmV4dGxlbikge1xuICAgICAgY29udGludWU7XG5cbiAgICB9IGVsc2UgaWYgKGNvdW50IDwgbWluX2NvdW50KSB7XG4gICAgICBkbyB7IHNlbmRfY29kZShzLCBjdXJsZW4sIHMuYmxfdHJlZSk7IH0gd2hpbGUgKC0tY291bnQgIT09IDApO1xuXG4gICAgfSBlbHNlIGlmIChjdXJsZW4gIT09IDApIHtcbiAgICAgIGlmIChjdXJsZW4gIT09IHByZXZsZW4pIHtcbiAgICAgICAgc2VuZF9jb2RlKHMsIGN1cmxlbiwgcy5ibF90cmVlKTtcbiAgICAgICAgY291bnQtLTtcbiAgICAgIH1cbiAgICAgIC8vQXNzZXJ0KGNvdW50ID49IDMgJiYgY291bnQgPD0gNiwgXCIgM182P1wiKTtcbiAgICAgIHNlbmRfY29kZShzLCBSRVBfM182LCBzLmJsX3RyZWUpO1xuICAgICAgc2VuZF9iaXRzKHMsIGNvdW50IC0gMywgMik7XG5cbiAgICB9IGVsc2UgaWYgKGNvdW50IDw9IDEwKSB7XG4gICAgICBzZW5kX2NvZGUocywgUkVQWl8zXzEwLCBzLmJsX3RyZWUpO1xuICAgICAgc2VuZF9iaXRzKHMsIGNvdW50IC0gMywgMyk7XG5cbiAgICB9IGVsc2Uge1xuICAgICAgc2VuZF9jb2RlKHMsIFJFUFpfMTFfMTM4LCBzLmJsX3RyZWUpO1xuICAgICAgc2VuZF9iaXRzKHMsIGNvdW50IC0gMTEsIDcpO1xuICAgIH1cblxuICAgIGNvdW50ID0gMDtcbiAgICBwcmV2bGVuID0gY3VybGVuO1xuICAgIGlmIChuZXh0bGVuID09PSAwKSB7XG4gICAgICBtYXhfY291bnQgPSAxMzg7XG4gICAgICBtaW5fY291bnQgPSAzO1xuXG4gICAgfSBlbHNlIGlmIChjdXJsZW4gPT09IG5leHRsZW4pIHtcbiAgICAgIG1heF9jb3VudCA9IDY7XG4gICAgICBtaW5fY291bnQgPSAzO1xuXG4gICAgfSBlbHNlIHtcbiAgICAgIG1heF9jb3VudCA9IDc7XG4gICAgICBtaW5fY291bnQgPSA0O1xuICAgIH1cbiAgfVxufVxuXG5cbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQ29uc3RydWN0IHRoZSBIdWZmbWFuIHRyZWUgZm9yIHRoZSBiaXQgbGVuZ3RocyBhbmQgcmV0dXJuIHRoZSBpbmRleCBpblxuICogYmxfb3JkZXIgb2YgdGhlIGxhc3QgYml0IGxlbmd0aCBjb2RlIHRvIHNlbmQuXG4gKi9cbmZ1bmN0aW9uIGJ1aWxkX2JsX3RyZWUocykge1xuICB2YXIgbWF4X2JsaW5kZXg7ICAvKiBpbmRleCBvZiBsYXN0IGJpdCBsZW5ndGggY29kZSBvZiBub24gemVybyBmcmVxICovXG5cbiAgLyogRGV0ZXJtaW5lIHRoZSBiaXQgbGVuZ3RoIGZyZXF1ZW5jaWVzIGZvciBsaXRlcmFsIGFuZCBkaXN0YW5jZSB0cmVlcyAqL1xuICBzY2FuX3RyZWUocywgcy5keW5fbHRyZWUsIHMubF9kZXNjLm1heF9jb2RlKTtcbiAgc2Nhbl90cmVlKHMsIHMuZHluX2R0cmVlLCBzLmRfZGVzYy5tYXhfY29kZSk7XG5cbiAgLyogQnVpbGQgdGhlIGJpdCBsZW5ndGggdHJlZTogKi9cbiAgYnVpbGRfdHJlZShzLCBzLmJsX2Rlc2MpO1xuICAvKiBvcHRfbGVuIG5vdyBpbmNsdWRlcyB0aGUgbGVuZ3RoIG9mIHRoZSB0cmVlIHJlcHJlc2VudGF0aW9ucywgZXhjZXB0XG4gICAqIHRoZSBsZW5ndGhzIG9mIHRoZSBiaXQgbGVuZ3RocyBjb2RlcyBhbmQgdGhlIDUrNSs0IGJpdHMgZm9yIHRoZSBjb3VudHMuXG4gICAqL1xuXG4gIC8qIERldGVybWluZSB0aGUgbnVtYmVyIG9mIGJpdCBsZW5ndGggY29kZXMgdG8gc2VuZC4gVGhlIHBremlwIGZvcm1hdFxuICAgKiByZXF1aXJlcyB0aGF0IGF0IGxlYXN0IDQgYml0IGxlbmd0aCBjb2RlcyBiZSBzZW50LiAoYXBwbm90ZS50eHQgc2F5c1xuICAgKiAzIGJ1dCB0aGUgYWN0dWFsIHZhbHVlIHVzZWQgaXMgNC4pXG4gICAqL1xuICBmb3IgKG1heF9ibGluZGV4ID0gQkxfQ09ERVMgLSAxOyBtYXhfYmxpbmRleCA+PSAzOyBtYXhfYmxpbmRleC0tKSB7XG4gICAgaWYgKHMuYmxfdHJlZVtibF9vcmRlclttYXhfYmxpbmRleF0gKiAyICsgMV0vKi5MZW4qLyAhPT0gMCkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG4gIC8qIFVwZGF0ZSBvcHRfbGVuIHRvIGluY2x1ZGUgdGhlIGJpdCBsZW5ndGggdHJlZSBhbmQgY291bnRzICovXG4gIHMub3B0X2xlbiArPSAzICogKG1heF9ibGluZGV4ICsgMSkgKyA1ICsgNSArIDQ7XG4gIC8vVHJhY2V2KChzdGRlcnIsIFwiXFxuZHluIHRyZWVzOiBkeW4gJWxkLCBzdGF0ICVsZFwiLFxuICAvLyAgICAgICAgcy0+b3B0X2xlbiwgcy0+c3RhdGljX2xlbikpO1xuXG4gIHJldHVybiBtYXhfYmxpbmRleDtcbn1cblxuXG4vKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIFNlbmQgdGhlIGhlYWRlciBmb3IgYSBibG9jayB1c2luZyBkeW5hbWljIEh1ZmZtYW4gdHJlZXM6IHRoZSBjb3VudHMsIHRoZVxuICogbGVuZ3RocyBvZiB0aGUgYml0IGxlbmd0aCBjb2RlcywgdGhlIGxpdGVyYWwgdHJlZSBhbmQgdGhlIGRpc3RhbmNlIHRyZWUuXG4gKiBJTiBhc3NlcnRpb246IGxjb2RlcyA+PSAyNTcsIGRjb2RlcyA+PSAxLCBibGNvZGVzID49IDQuXG4gKi9cbmZ1bmN0aW9uIHNlbmRfYWxsX3RyZWVzKHMsIGxjb2RlcywgZGNvZGVzLCBibGNvZGVzKVxuLy8gICAgZGVmbGF0ZV9zdGF0ZSAqcztcbi8vICAgIGludCBsY29kZXMsIGRjb2RlcywgYmxjb2RlczsgLyogbnVtYmVyIG9mIGNvZGVzIGZvciBlYWNoIHRyZWUgKi9cbntcbiAgdmFyIHJhbms7ICAgICAgICAgICAgICAgICAgICAvKiBpbmRleCBpbiBibF9vcmRlciAqL1xuXG4gIC8vQXNzZXJ0IChsY29kZXMgPj0gMjU3ICYmIGRjb2RlcyA+PSAxICYmIGJsY29kZXMgPj0gNCwgXCJub3QgZW5vdWdoIGNvZGVzXCIpO1xuICAvL0Fzc2VydCAobGNvZGVzIDw9IExfQ09ERVMgJiYgZGNvZGVzIDw9IERfQ09ERVMgJiYgYmxjb2RlcyA8PSBCTF9DT0RFUyxcbiAgLy8gICAgICAgIFwidG9vIG1hbnkgY29kZXNcIik7XG4gIC8vVHJhY2V2KChzdGRlcnIsIFwiXFxuYmwgY291bnRzOiBcIikpO1xuICBzZW5kX2JpdHMocywgbGNvZGVzIC0gMjU3LCA1KTsgLyogbm90ICsyNTUgYXMgc3RhdGVkIGluIGFwcG5vdGUudHh0ICovXG4gIHNlbmRfYml0cyhzLCBkY29kZXMgLSAxLCAgIDUpO1xuICBzZW5kX2JpdHMocywgYmxjb2RlcyAtIDQsICA0KTsgLyogbm90IC0zIGFzIHN0YXRlZCBpbiBhcHBub3RlLnR4dCAqL1xuICBmb3IgKHJhbmsgPSAwOyByYW5rIDwgYmxjb2RlczsgcmFuaysrKSB7XG4gICAgLy9UcmFjZXYoKHN0ZGVyciwgXCJcXG5ibCBjb2RlICUyZCBcIiwgYmxfb3JkZXJbcmFua10pKTtcbiAgICBzZW5kX2JpdHMocywgcy5ibF90cmVlW2JsX29yZGVyW3JhbmtdICogMiArIDFdLyouTGVuKi8sIDMpO1xuICB9XG4gIC8vVHJhY2V2KChzdGRlcnIsIFwiXFxuYmwgdHJlZTogc2VudCAlbGRcIiwgcy0+Yml0c19zZW50KSk7XG5cbiAgc2VuZF90cmVlKHMsIHMuZHluX2x0cmVlLCBsY29kZXMgLSAxKTsgLyogbGl0ZXJhbCB0cmVlICovXG4gIC8vVHJhY2V2KChzdGRlcnIsIFwiXFxubGl0IHRyZWU6IHNlbnQgJWxkXCIsIHMtPmJpdHNfc2VudCkpO1xuXG4gIHNlbmRfdHJlZShzLCBzLmR5bl9kdHJlZSwgZGNvZGVzIC0gMSk7IC8qIGRpc3RhbmNlIHRyZWUgKi9cbiAgLy9UcmFjZXYoKHN0ZGVyciwgXCJcXG5kaXN0IHRyZWU6IHNlbnQgJWxkXCIsIHMtPmJpdHNfc2VudCkpO1xufVxuXG5cbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQ2hlY2sgaWYgdGhlIGRhdGEgdHlwZSBpcyBURVhUIG9yIEJJTkFSWSwgdXNpbmcgdGhlIGZvbGxvd2luZyBhbGdvcml0aG06XG4gKiAtIFRFWFQgaWYgdGhlIHR3byBjb25kaXRpb25zIGJlbG93IGFyZSBzYXRpc2ZpZWQ6XG4gKiAgICBhKSBUaGVyZSBhcmUgbm8gbm9uLXBvcnRhYmxlIGNvbnRyb2wgY2hhcmFjdGVycyBiZWxvbmdpbmcgdG8gdGhlXG4gKiAgICAgICBcImJsYWNrIGxpc3RcIiAoMC4uNiwgMTQuLjI1LCAyOC4uMzEpLlxuICogICAgYikgVGhlcmUgaXMgYXQgbGVhc3Qgb25lIHByaW50YWJsZSBjaGFyYWN0ZXIgYmVsb25naW5nIHRvIHRoZVxuICogICAgICAgXCJ3aGl0ZSBsaXN0XCIgKDkge1RBQn0sIDEwIHtMRn0sIDEzIHtDUn0sIDMyLi4yNTUpLlxuICogLSBCSU5BUlkgb3RoZXJ3aXNlLlxuICogLSBUaGUgZm9sbG93aW5nIHBhcnRpYWxseS1wb3J0YWJsZSBjb250cm9sIGNoYXJhY3RlcnMgZm9ybSBhXG4gKiAgIFwiZ3JheSBsaXN0XCIgdGhhdCBpcyBpZ25vcmVkIGluIHRoaXMgZGV0ZWN0aW9uIGFsZ29yaXRobTpcbiAqICAgKDcge0JFTH0sIDgge0JTfSwgMTEge1ZUfSwgMTIge0ZGfSwgMjYge1NVQn0sIDI3IHtFU0N9KS5cbiAqIElOIGFzc2VydGlvbjogdGhlIGZpZWxkcyBGcmVxIG9mIGR5bl9sdHJlZSBhcmUgc2V0LlxuICovXG5mdW5jdGlvbiBkZXRlY3RfZGF0YV90eXBlKHMpIHtcbiAgLyogYmxhY2tfbWFzayBpcyB0aGUgYml0IG1hc2sgb2YgYmxhY2stbGlzdGVkIGJ5dGVzXG4gICAqIHNldCBiaXRzIDAuLjYsIDE0Li4yNSwgYW5kIDI4Li4zMVxuICAgKiAweGYzZmZjMDdmID0gYmluYXJ5IDExMTEwMDExMTExMTExMTExMTAwMDAwMDAxMTExMTExXG4gICAqL1xuICB2YXIgYmxhY2tfbWFzayA9IDB4ZjNmZmMwN2Y7XG4gIHZhciBuO1xuXG4gIC8qIENoZWNrIGZvciBub24tdGV4dHVhbCAoXCJibGFjay1saXN0ZWRcIikgYnl0ZXMuICovXG4gIGZvciAobiA9IDA7IG4gPD0gMzE7IG4rKywgYmxhY2tfbWFzayA+Pj49IDEpIHtcbiAgICBpZiAoKGJsYWNrX21hc2sgJiAxKSAmJiAocy5keW5fbHRyZWVbbiAqIDJdLyouRnJlcSovICE9PSAwKSkge1xuICAgICAgcmV0dXJuIFpfQklOQVJZO1xuICAgIH1cbiAgfVxuXG4gIC8qIENoZWNrIGZvciB0ZXh0dWFsIChcIndoaXRlLWxpc3RlZFwiKSBieXRlcy4gKi9cbiAgaWYgKHMuZHluX2x0cmVlWzkgKiAyXS8qLkZyZXEqLyAhPT0gMCB8fCBzLmR5bl9sdHJlZVsxMCAqIDJdLyouRnJlcSovICE9PSAwIHx8XG4gICAgICBzLmR5bl9sdHJlZVsxMyAqIDJdLyouRnJlcSovICE9PSAwKSB7XG4gICAgcmV0dXJuIFpfVEVYVDtcbiAgfVxuICBmb3IgKG4gPSAzMjsgbiA8IExJVEVSQUxTOyBuKyspIHtcbiAgICBpZiAocy5keW5fbHRyZWVbbiAqIDJdLyouRnJlcSovICE9PSAwKSB7XG4gICAgICByZXR1cm4gWl9URVhUO1xuICAgIH1cbiAgfVxuXG4gIC8qIFRoZXJlIGFyZSBubyBcImJsYWNrLWxpc3RlZFwiIG9yIFwid2hpdGUtbGlzdGVkXCIgYnl0ZXM6XG4gICAqIHRoaXMgc3RyZWFtIGVpdGhlciBpcyBlbXB0eSBvciBoYXMgdG9sZXJhdGVkIChcImdyYXktbGlzdGVkXCIpIGJ5dGVzIG9ubHkuXG4gICAqL1xuICByZXR1cm4gWl9CSU5BUlk7XG59XG5cblxudmFyIHN0YXRpY19pbml0X2RvbmUgPSBmYWxzZTtcblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBJbml0aWFsaXplIHRoZSB0cmVlIGRhdGEgc3RydWN0dXJlcyBmb3IgYSBuZXcgemxpYiBzdHJlYW0uXG4gKi9cbmZ1bmN0aW9uIF90cl9pbml0KHMpXG57XG5cbiAgaWYgKCFzdGF0aWNfaW5pdF9kb25lKSB7XG4gICAgdHJfc3RhdGljX2luaXQoKTtcbiAgICBzdGF0aWNfaW5pdF9kb25lID0gdHJ1ZTtcbiAgfVxuXG4gIHMubF9kZXNjICA9IG5ldyBUcmVlRGVzYyhzLmR5bl9sdHJlZSwgc3RhdGljX2xfZGVzYyk7XG4gIHMuZF9kZXNjICA9IG5ldyBUcmVlRGVzYyhzLmR5bl9kdHJlZSwgc3RhdGljX2RfZGVzYyk7XG4gIHMuYmxfZGVzYyA9IG5ldyBUcmVlRGVzYyhzLmJsX3RyZWUsIHN0YXRpY19ibF9kZXNjKTtcblxuICBzLmJpX2J1ZiA9IDA7XG4gIHMuYmlfdmFsaWQgPSAwO1xuXG4gIC8qIEluaXRpYWxpemUgdGhlIGZpcnN0IGJsb2NrIG9mIHRoZSBmaXJzdCBmaWxlOiAqL1xuICBpbml0X2Jsb2NrKHMpO1xufVxuXG5cbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogU2VuZCBhIHN0b3JlZCBibG9ja1xuICovXG5mdW5jdGlvbiBfdHJfc3RvcmVkX2Jsb2NrKHMsIGJ1Ziwgc3RvcmVkX2xlbiwgbGFzdClcbi8vRGVmbGF0ZVN0YXRlICpzO1xuLy9jaGFyZiAqYnVmOyAgICAgICAvKiBpbnB1dCBibG9jayAqL1xuLy91bGcgc3RvcmVkX2xlbjsgICAvKiBsZW5ndGggb2YgaW5wdXQgYmxvY2sgKi9cbi8vaW50IGxhc3Q7ICAgICAgICAgLyogb25lIGlmIHRoaXMgaXMgdGhlIGxhc3QgYmxvY2sgZm9yIGEgZmlsZSAqL1xue1xuICBzZW5kX2JpdHMocywgKFNUT1JFRF9CTE9DSyA8PCAxKSArIChsYXN0ID8gMSA6IDApLCAzKTsgICAgLyogc2VuZCBibG9jayB0eXBlICovXG4gIGNvcHlfYmxvY2socywgYnVmLCBzdG9yZWRfbGVuKTsgLyogd2l0aCBoZWFkZXIgKi9cbn1cblxuXG4vKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIFNlbmQgb25lIGVtcHR5IHN0YXRpYyBibG9jayB0byBnaXZlIGVub3VnaCBsb29rYWhlYWQgZm9yIGluZmxhdGUuXG4gKiBUaGlzIHRha2VzIDEwIGJpdHMsIG9mIHdoaWNoIDcgbWF5IHJlbWFpbiBpbiB0aGUgYml0IGJ1ZmZlci5cbiAqL1xuZnVuY3Rpb24gX3RyX2FsaWduKHMpIHtcbiAgc2VuZF9iaXRzKHMsIFNUQVRJQ19UUkVFUyA8PCAxLCAzKTtcbiAgc2VuZF9jb2RlKHMsIEVORF9CTE9DSywgc3RhdGljX2x0cmVlKTtcbiAgYmlfZmx1c2gocyk7XG59XG5cblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBEZXRlcm1pbmUgdGhlIGJlc3QgZW5jb2RpbmcgZm9yIHRoZSBjdXJyZW50IGJsb2NrOiBkeW5hbWljIHRyZWVzLCBzdGF0aWNcbiAqIHRyZWVzIG9yIHN0b3JlLCBhbmQgb3V0cHV0IHRoZSBlbmNvZGVkIGJsb2NrIHRvIHRoZSB6aXAgZmlsZS5cbiAqL1xuZnVuY3Rpb24gX3RyX2ZsdXNoX2Jsb2NrKHMsIGJ1Ziwgc3RvcmVkX2xlbiwgbGFzdClcbi8vRGVmbGF0ZVN0YXRlICpzO1xuLy9jaGFyZiAqYnVmOyAgICAgICAvKiBpbnB1dCBibG9jaywgb3IgTlVMTCBpZiB0b28gb2xkICovXG4vL3VsZyBzdG9yZWRfbGVuOyAgIC8qIGxlbmd0aCBvZiBpbnB1dCBibG9jayAqL1xuLy9pbnQgbGFzdDsgICAgICAgICAvKiBvbmUgaWYgdGhpcyBpcyB0aGUgbGFzdCBibG9jayBmb3IgYSBmaWxlICovXG57XG4gIHZhciBvcHRfbGVuYiwgc3RhdGljX2xlbmI7ICAvKiBvcHRfbGVuIGFuZCBzdGF0aWNfbGVuIGluIGJ5dGVzICovXG4gIHZhciBtYXhfYmxpbmRleCA9IDA7ICAgICAgICAvKiBpbmRleCBvZiBsYXN0IGJpdCBsZW5ndGggY29kZSBvZiBub24gemVybyBmcmVxICovXG5cbiAgLyogQnVpbGQgdGhlIEh1ZmZtYW4gdHJlZXMgdW5sZXNzIGEgc3RvcmVkIGJsb2NrIGlzIGZvcmNlZCAqL1xuICBpZiAocy5sZXZlbCA+IDApIHtcblxuICAgIC8qIENoZWNrIGlmIHRoZSBmaWxlIGlzIGJpbmFyeSBvciB0ZXh0ICovXG4gICAgaWYgKHMuc3RybS5kYXRhX3R5cGUgPT09IFpfVU5LTk9XTikge1xuICAgICAgcy5zdHJtLmRhdGFfdHlwZSA9IGRldGVjdF9kYXRhX3R5cGUocyk7XG4gICAgfVxuXG4gICAgLyogQ29uc3RydWN0IHRoZSBsaXRlcmFsIGFuZCBkaXN0YW5jZSB0cmVlcyAqL1xuICAgIGJ1aWxkX3RyZWUocywgcy5sX2Rlc2MpO1xuICAgIC8vIFRyYWNldigoc3RkZXJyLCBcIlxcbmxpdCBkYXRhOiBkeW4gJWxkLCBzdGF0ICVsZFwiLCBzLT5vcHRfbGVuLFxuICAgIC8vICAgICAgICBzLT5zdGF0aWNfbGVuKSk7XG5cbiAgICBidWlsZF90cmVlKHMsIHMuZF9kZXNjKTtcbiAgICAvLyBUcmFjZXYoKHN0ZGVyciwgXCJcXG5kaXN0IGRhdGE6IGR5biAlbGQsIHN0YXQgJWxkXCIsIHMtPm9wdF9sZW4sXG4gICAgLy8gICAgICAgIHMtPnN0YXRpY19sZW4pKTtcbiAgICAvKiBBdCB0aGlzIHBvaW50LCBvcHRfbGVuIGFuZCBzdGF0aWNfbGVuIGFyZSB0aGUgdG90YWwgYml0IGxlbmd0aHMgb2ZcbiAgICAgKiB0aGUgY29tcHJlc3NlZCBibG9jayBkYXRhLCBleGNsdWRpbmcgdGhlIHRyZWUgcmVwcmVzZW50YXRpb25zLlxuICAgICAqL1xuXG4gICAgLyogQnVpbGQgdGhlIGJpdCBsZW5ndGggdHJlZSBmb3IgdGhlIGFib3ZlIHR3byB0cmVlcywgYW5kIGdldCB0aGUgaW5kZXhcbiAgICAgKiBpbiBibF9vcmRlciBvZiB0aGUgbGFzdCBiaXQgbGVuZ3RoIGNvZGUgdG8gc2VuZC5cbiAgICAgKi9cbiAgICBtYXhfYmxpbmRleCA9IGJ1aWxkX2JsX3RyZWUocyk7XG5cbiAgICAvKiBEZXRlcm1pbmUgdGhlIGJlc3QgZW5jb2RpbmcuIENvbXB1dGUgdGhlIGJsb2NrIGxlbmd0aHMgaW4gYnl0ZXMuICovXG4gICAgb3B0X2xlbmIgPSAocy5vcHRfbGVuICsgMyArIDcpID4+PiAzO1xuICAgIHN0YXRpY19sZW5iID0gKHMuc3RhdGljX2xlbiArIDMgKyA3KSA+Pj4gMztcblxuICAgIC8vIFRyYWNldigoc3RkZXJyLCBcIlxcbm9wdCAlbHUoJWx1KSBzdGF0ICVsdSglbHUpIHN0b3JlZCAlbHUgbGl0ICV1IFwiLFxuICAgIC8vICAgICAgICBvcHRfbGVuYiwgcy0+b3B0X2xlbiwgc3RhdGljX2xlbmIsIHMtPnN0YXRpY19sZW4sIHN0b3JlZF9sZW4sXG4gICAgLy8gICAgICAgIHMtPmxhc3RfbGl0KSk7XG5cbiAgICBpZiAoc3RhdGljX2xlbmIgPD0gb3B0X2xlbmIpIHsgb3B0X2xlbmIgPSBzdGF0aWNfbGVuYjsgfVxuXG4gIH0gZWxzZSB7XG4gICAgLy8gQXNzZXJ0KGJ1ZiAhPSAoY2hhciopMCwgXCJsb3N0IGJ1ZlwiKTtcbiAgICBvcHRfbGVuYiA9IHN0YXRpY19sZW5iID0gc3RvcmVkX2xlbiArIDU7IC8qIGZvcmNlIGEgc3RvcmVkIGJsb2NrICovXG4gIH1cblxuICBpZiAoKHN0b3JlZF9sZW4gKyA0IDw9IG9wdF9sZW5iKSAmJiAoYnVmICE9PSAtMSkpIHtcbiAgICAvKiA0OiB0d28gd29yZHMgZm9yIHRoZSBsZW5ndGhzICovXG5cbiAgICAvKiBUaGUgdGVzdCBidWYgIT0gTlVMTCBpcyBvbmx5IG5lY2Vzc2FyeSBpZiBMSVRfQlVGU0laRSA+IFdTSVpFLlxuICAgICAqIE90aGVyd2lzZSB3ZSBjYW4ndCBoYXZlIHByb2Nlc3NlZCBtb3JlIHRoYW4gV1NJWkUgaW5wdXQgYnl0ZXMgc2luY2VcbiAgICAgKiB0aGUgbGFzdCBibG9jayBmbHVzaCwgYmVjYXVzZSBjb21wcmVzc2lvbiB3b3VsZCBoYXZlIGJlZW5cbiAgICAgKiBzdWNjZXNzZnVsLiBJZiBMSVRfQlVGU0laRSA8PSBXU0laRSwgaXQgaXMgbmV2ZXIgdG9vIGxhdGUgdG9cbiAgICAgKiB0cmFuc2Zvcm0gYSBibG9jayBpbnRvIGEgc3RvcmVkIGJsb2NrLlxuICAgICAqL1xuICAgIF90cl9zdG9yZWRfYmxvY2socywgYnVmLCBzdG9yZWRfbGVuLCBsYXN0KTtcblxuICB9IGVsc2UgaWYgKHMuc3RyYXRlZ3kgPT09IFpfRklYRUQgfHwgc3RhdGljX2xlbmIgPT09IG9wdF9sZW5iKSB7XG5cbiAgICBzZW5kX2JpdHMocywgKFNUQVRJQ19UUkVFUyA8PCAxKSArIChsYXN0ID8gMSA6IDApLCAzKTtcbiAgICBjb21wcmVzc19ibG9jayhzLCBzdGF0aWNfbHRyZWUsIHN0YXRpY19kdHJlZSk7XG5cbiAgfSBlbHNlIHtcbiAgICBzZW5kX2JpdHMocywgKERZTl9UUkVFUyA8PCAxKSArIChsYXN0ID8gMSA6IDApLCAzKTtcbiAgICBzZW5kX2FsbF90cmVlcyhzLCBzLmxfZGVzYy5tYXhfY29kZSArIDEsIHMuZF9kZXNjLm1heF9jb2RlICsgMSwgbWF4X2JsaW5kZXggKyAxKTtcbiAgICBjb21wcmVzc19ibG9jayhzLCBzLmR5bl9sdHJlZSwgcy5keW5fZHRyZWUpO1xuICB9XG4gIC8vIEFzc2VydCAocy0+Y29tcHJlc3NlZF9sZW4gPT0gcy0+Yml0c19zZW50LCBcImJhZCBjb21wcmVzc2VkIHNpemVcIik7XG4gIC8qIFRoZSBhYm92ZSBjaGVjayBpcyBtYWRlIG1vZCAyXjMyLCBmb3IgZmlsZXMgbGFyZ2VyIHRoYW4gNTEyIE1CXG4gICAqIGFuZCB1TG9uZyBpbXBsZW1lbnRlZCBvbiAzMiBiaXRzLlxuICAgKi9cbiAgaW5pdF9ibG9jayhzKTtcblxuICBpZiAobGFzdCkge1xuICAgIGJpX3dpbmR1cChzKTtcbiAgfVxuICAvLyBUcmFjZXYoKHN0ZGVycixcIlxcbmNvbXBybGVuICVsdSglbHUpIFwiLCBzLT5jb21wcmVzc2VkX2xlbj4+MyxcbiAgLy8gICAgICAgcy0+Y29tcHJlc3NlZF9sZW4tNypsYXN0KSk7XG59XG5cbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogU2F2ZSB0aGUgbWF0Y2ggaW5mbyBhbmQgdGFsbHkgdGhlIGZyZXF1ZW5jeSBjb3VudHMuIFJldHVybiB0cnVlIGlmXG4gKiB0aGUgY3VycmVudCBibG9jayBtdXN0IGJlIGZsdXNoZWQuXG4gKi9cbmZ1bmN0aW9uIF90cl90YWxseShzLCBkaXN0LCBsYylcbi8vICAgIGRlZmxhdGVfc3RhdGUgKnM7XG4vLyAgICB1bnNpZ25lZCBkaXN0OyAgLyogZGlzdGFuY2Ugb2YgbWF0Y2hlZCBzdHJpbmcgKi9cbi8vICAgIHVuc2lnbmVkIGxjOyAgICAvKiBtYXRjaCBsZW5ndGgtTUlOX01BVENIIG9yIHVubWF0Y2hlZCBjaGFyIChpZiBkaXN0PT0wKSAqL1xue1xuICAvL3ZhciBvdXRfbGVuZ3RoLCBpbl9sZW5ndGgsIGRjb2RlO1xuXG4gIHMucGVuZGluZ19idWZbcy5kX2J1ZiArIHMubGFzdF9saXQgKiAyXSAgICAgPSAoZGlzdCA+Pj4gOCkgJiAweGZmO1xuICBzLnBlbmRpbmdfYnVmW3MuZF9idWYgKyBzLmxhc3RfbGl0ICogMiArIDFdID0gZGlzdCAmIDB4ZmY7XG5cbiAgcy5wZW5kaW5nX2J1ZltzLmxfYnVmICsgcy5sYXN0X2xpdF0gPSBsYyAmIDB4ZmY7XG4gIHMubGFzdF9saXQrKztcblxuICBpZiAoZGlzdCA9PT0gMCkge1xuICAgIC8qIGxjIGlzIHRoZSB1bm1hdGNoZWQgY2hhciAqL1xuICAgIHMuZHluX2x0cmVlW2xjICogMl0vKi5GcmVxKi8rKztcbiAgfSBlbHNlIHtcbiAgICBzLm1hdGNoZXMrKztcbiAgICAvKiBIZXJlLCBsYyBpcyB0aGUgbWF0Y2ggbGVuZ3RoIC0gTUlOX01BVENIICovXG4gICAgZGlzdC0tOyAgICAgICAgICAgICAvKiBkaXN0ID0gbWF0Y2ggZGlzdGFuY2UgLSAxICovXG4gICAgLy9Bc3NlcnQoKHVzaClkaXN0IDwgKHVzaClNQVhfRElTVChzKSAmJlxuICAgIC8vICAgICAgICh1c2gpbGMgPD0gKHVzaCkoTUFYX01BVENILU1JTl9NQVRDSCkgJiZcbiAgICAvLyAgICAgICAodXNoKWRfY29kZShkaXN0KSA8ICh1c2gpRF9DT0RFUywgIFwiX3RyX3RhbGx5OiBiYWQgbWF0Y2hcIik7XG5cbiAgICBzLmR5bl9sdHJlZVsoX2xlbmd0aF9jb2RlW2xjXSArIExJVEVSQUxTICsgMSkgKiAyXS8qLkZyZXEqLysrO1xuICAgIHMuZHluX2R0cmVlW2RfY29kZShkaXN0KSAqIDJdLyouRnJlcSovKys7XG4gIH1cblxuLy8gKCEpIFRoaXMgYmxvY2sgaXMgZGlzYWJsZWQgaW4gemxpYiBkZWZhaWx0cyxcbi8vIGRvbid0IGVuYWJsZSBpdCBmb3IgYmluYXJ5IGNvbXBhdGliaWxpdHlcblxuLy8jaWZkZWYgVFJVTkNBVEVfQkxPQ0tcbi8vICAvKiBUcnkgdG8gZ3Vlc3MgaWYgaXQgaXMgcHJvZml0YWJsZSB0byBzdG9wIHRoZSBjdXJyZW50IGJsb2NrIGhlcmUgKi9cbi8vICBpZiAoKHMubGFzdF9saXQgJiAweDFmZmYpID09PSAwICYmIHMubGV2ZWwgPiAyKSB7XG4vLyAgICAvKiBDb21wdXRlIGFuIHVwcGVyIGJvdW5kIGZvciB0aGUgY29tcHJlc3NlZCBsZW5ndGggKi9cbi8vICAgIG91dF9sZW5ndGggPSBzLmxhc3RfbGl0Kjg7XG4vLyAgICBpbl9sZW5ndGggPSBzLnN0cnN0YXJ0IC0gcy5ibG9ja19zdGFydDtcbi8vXG4vLyAgICBmb3IgKGRjb2RlID0gMDsgZGNvZGUgPCBEX0NPREVTOyBkY29kZSsrKSB7XG4vLyAgICAgIG91dF9sZW5ndGggKz0gcy5keW5fZHRyZWVbZGNvZGUqMl0vKi5GcmVxKi8gKiAoNSArIGV4dHJhX2RiaXRzW2Rjb2RlXSk7XG4vLyAgICB9XG4vLyAgICBvdXRfbGVuZ3RoID4+Pj0gMztcbi8vICAgIC8vVHJhY2V2KChzdGRlcnIsXCJcXG5sYXN0X2xpdCAldSwgaW4gJWxkLCBvdXQgfiVsZCglbGQlJSkgXCIsXG4vLyAgICAvLyAgICAgICBzLT5sYXN0X2xpdCwgaW5fbGVuZ3RoLCBvdXRfbGVuZ3RoLFxuLy8gICAgLy8gICAgICAgMTAwTCAtIG91dF9sZW5ndGgqMTAwTC9pbl9sZW5ndGgpKTtcbi8vICAgIGlmIChzLm1hdGNoZXMgPCAocy5sYXN0X2xpdD4+MSkvKmludCAvMiovICYmIG91dF9sZW5ndGggPCAoaW5fbGVuZ3RoPj4xKS8qaW50IC8yKi8pIHtcbi8vICAgICAgcmV0dXJuIHRydWU7XG4vLyAgICB9XG4vLyAgfVxuLy8jZW5kaWZcblxuICByZXR1cm4gKHMubGFzdF9saXQgPT09IHMubGl0X2J1ZnNpemUgLSAxKTtcbiAgLyogV2UgYXZvaWQgZXF1YWxpdHkgd2l0aCBsaXRfYnVmc2l6ZSBiZWNhdXNlIG9mIHdyYXBhcm91bmQgYXQgNjRLXG4gICAqIG9uIDE2IGJpdCBtYWNoaW5lcyBhbmQgYmVjYXVzZSBzdG9yZWQgYmxvY2tzIGFyZSByZXN0cmljdGVkIHRvXG4gICAqIDY0Sy0xIGJ5dGVzLlxuICAgKi9cbn1cblxuZXhwb3J0cy5fdHJfaW5pdCAgPSBfdHJfaW5pdDtcbmV4cG9ydHMuX3RyX3N0b3JlZF9ibG9jayA9IF90cl9zdG9yZWRfYmxvY2s7XG5leHBvcnRzLl90cl9mbHVzaF9ibG9jayAgPSBfdHJfZmx1c2hfYmxvY2s7XG5leHBvcnRzLl90cl90YWxseSA9IF90cl90YWxseTtcbmV4cG9ydHMuX3RyX2FsaWduID0gX3RyX2FsaWduO1xuXG59LHtcIi4uL3V0aWxzL2NvbW1vblwiOjQxfV0sNTM6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXG4vLyAoQykgMTk5NS0yMDEzIEplYW4tbG91cCBHYWlsbHkgYW5kIE1hcmsgQWRsZXJcbi8vIChDKSAyMDE0LTIwMTcgVml0YWx5IFB1enJpbiBhbmQgQW5kcmV5IFR1cGl0c2luXG4vL1xuLy8gVGhpcyBzb2Z0d2FyZSBpcyBwcm92aWRlZCAnYXMtaXMnLCB3aXRob3V0IGFueSBleHByZXNzIG9yIGltcGxpZWRcbi8vIHdhcnJhbnR5LiBJbiBubyBldmVudCB3aWxsIHRoZSBhdXRob3JzIGJlIGhlbGQgbGlhYmxlIGZvciBhbnkgZGFtYWdlc1xuLy8gYXJpc2luZyBmcm9tIHRoZSB1c2Ugb2YgdGhpcyBzb2Z0d2FyZS5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGdyYW50ZWQgdG8gYW55b25lIHRvIHVzZSB0aGlzIHNvZnR3YXJlIGZvciBhbnkgcHVycG9zZSxcbi8vIGluY2x1ZGluZyBjb21tZXJjaWFsIGFwcGxpY2F0aW9ucywgYW5kIHRvIGFsdGVyIGl0IGFuZCByZWRpc3RyaWJ1dGUgaXRcbi8vIGZyZWVseSwgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIHJlc3RyaWN0aW9uczpcbi8vXG4vLyAxLiBUaGUgb3JpZ2luIG9mIHRoaXMgc29mdHdhcmUgbXVzdCBub3QgYmUgbWlzcmVwcmVzZW50ZWQ7IHlvdSBtdXN0IG5vdFxuLy8gICBjbGFpbSB0aGF0IHlvdSB3cm90ZSB0aGUgb3JpZ2luYWwgc29mdHdhcmUuIElmIHlvdSB1c2UgdGhpcyBzb2Z0d2FyZVxuLy8gICBpbiBhIHByb2R1Y3QsIGFuIGFja25vd2xlZGdtZW50IGluIHRoZSBwcm9kdWN0IGRvY3VtZW50YXRpb24gd291bGQgYmVcbi8vICAgYXBwcmVjaWF0ZWQgYnV0IGlzIG5vdCByZXF1aXJlZC5cbi8vIDIuIEFsdGVyZWQgc291cmNlIHZlcnNpb25zIG11c3QgYmUgcGxhaW5seSBtYXJrZWQgYXMgc3VjaCwgYW5kIG11c3Qgbm90IGJlXG4vLyAgIG1pc3JlcHJlc2VudGVkIGFzIGJlaW5nIHRoZSBvcmlnaW5hbCBzb2Z0d2FyZS5cbi8vIDMuIFRoaXMgbm90aWNlIG1heSBub3QgYmUgcmVtb3ZlZCBvciBhbHRlcmVkIGZyb20gYW55IHNvdXJjZSBkaXN0cmlidXRpb24uXG5cbmZ1bmN0aW9uIFpTdHJlYW0oKSB7XG4gIC8qIG5leHQgaW5wdXQgYnl0ZSAqL1xuICB0aGlzLmlucHV0ID0gbnVsbDsgLy8gSlMgc3BlY2lmaWMsIGJlY2F1c2Ugd2UgaGF2ZSBubyBwb2ludGVyc1xuICB0aGlzLm5leHRfaW4gPSAwO1xuICAvKiBudW1iZXIgb2YgYnl0ZXMgYXZhaWxhYmxlIGF0IGlucHV0ICovXG4gIHRoaXMuYXZhaWxfaW4gPSAwO1xuICAvKiB0b3RhbCBudW1iZXIgb2YgaW5wdXQgYnl0ZXMgcmVhZCBzbyBmYXIgKi9cbiAgdGhpcy50b3RhbF9pbiA9IDA7XG4gIC8qIG5leHQgb3V0cHV0IGJ5dGUgc2hvdWxkIGJlIHB1dCB0aGVyZSAqL1xuICB0aGlzLm91dHB1dCA9IG51bGw7IC8vIEpTIHNwZWNpZmljLCBiZWNhdXNlIHdlIGhhdmUgbm8gcG9pbnRlcnNcbiAgdGhpcy5uZXh0X291dCA9IDA7XG4gIC8qIHJlbWFpbmluZyBmcmVlIHNwYWNlIGF0IG91dHB1dCAqL1xuICB0aGlzLmF2YWlsX291dCA9IDA7XG4gIC8qIHRvdGFsIG51bWJlciBvZiBieXRlcyBvdXRwdXQgc28gZmFyICovXG4gIHRoaXMudG90YWxfb3V0ID0gMDtcbiAgLyogbGFzdCBlcnJvciBtZXNzYWdlLCBOVUxMIGlmIG5vIGVycm9yICovXG4gIHRoaXMubXNnID0gJycvKlpfTlVMTCovO1xuICAvKiBub3QgdmlzaWJsZSBieSBhcHBsaWNhdGlvbnMgKi9cbiAgdGhpcy5zdGF0ZSA9IG51bGw7XG4gIC8qIGJlc3QgZ3Vlc3MgYWJvdXQgdGhlIGRhdGEgdHlwZTogYmluYXJ5IG9yIHRleHQgKi9cbiAgdGhpcy5kYXRhX3R5cGUgPSAyLypaX1VOS05PV04qLztcbiAgLyogYWRsZXIzMiB2YWx1ZSBvZiB0aGUgdW5jb21wcmVzc2VkIGRhdGEgKi9cbiAgdGhpcy5hZGxlciA9IDA7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gWlN0cmVhbTtcblxufSx7fV0sNTQ6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuKGZ1bmN0aW9uIChnbG9iYWwpe1xuKGZ1bmN0aW9uIChnbG9iYWwsIHVuZGVmaW5lZCQxKSB7XG5cbiAgICBpZiAoZ2xvYmFsLnNldEltbWVkaWF0ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIG5leHRIYW5kbGUgPSAxOyAvLyBTcGVjIHNheXMgZ3JlYXRlciB0aGFuIHplcm9cbiAgICB2YXIgdGFza3NCeUhhbmRsZSA9IHt9O1xuICAgIHZhciBjdXJyZW50bHlSdW5uaW5nQVRhc2sgPSBmYWxzZTtcbiAgICB2YXIgZG9jID0gZ2xvYmFsLmRvY3VtZW50O1xuICAgIHZhciByZWdpc3RlckltbWVkaWF0ZTtcblxuICAgIGZ1bmN0aW9uIHNldEltbWVkaWF0ZShjYWxsYmFjaykge1xuICAgICAgLy8gQ2FsbGJhY2sgY2FuIGVpdGhlciBiZSBhIGZ1bmN0aW9uIG9yIGEgc3RyaW5nXG4gICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgY2FsbGJhY2sgPSBuZXcgRnVuY3Rpb24oXCJcIiArIGNhbGxiYWNrKTtcbiAgICAgIH1cbiAgICAgIC8vIENvcHkgZnVuY3Rpb24gYXJndW1lbnRzXG4gICAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBhcmdzW2ldID0gYXJndW1lbnRzW2kgKyAxXTtcbiAgICAgIH1cbiAgICAgIC8vIFN0b3JlIGFuZCByZWdpc3RlciB0aGUgdGFza1xuICAgICAgdmFyIHRhc2sgPSB7IGNhbGxiYWNrOiBjYWxsYmFjaywgYXJnczogYXJncyB9O1xuICAgICAgdGFza3NCeUhhbmRsZVtuZXh0SGFuZGxlXSA9IHRhc2s7XG4gICAgICByZWdpc3RlckltbWVkaWF0ZShuZXh0SGFuZGxlKTtcbiAgICAgIHJldHVybiBuZXh0SGFuZGxlKys7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2xlYXJJbW1lZGlhdGUoaGFuZGxlKSB7XG4gICAgICAgIGRlbGV0ZSB0YXNrc0J5SGFuZGxlW2hhbmRsZV07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcnVuKHRhc2spIHtcbiAgICAgICAgdmFyIGNhbGxiYWNrID0gdGFzay5jYWxsYmFjaztcbiAgICAgICAgdmFyIGFyZ3MgPSB0YXNrLmFyZ3M7XG4gICAgICAgIHN3aXRjaCAoYXJncy5sZW5ndGgpIHtcbiAgICAgICAgY2FzZSAwOlxuICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICBjYWxsYmFjayhhcmdzWzBdKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICBjYWxsYmFjayhhcmdzWzBdLCBhcmdzWzFdKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICBjYWxsYmFjayhhcmdzWzBdLCBhcmdzWzFdLCBhcmdzWzJdKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgY2FsbGJhY2suYXBwbHkodW5kZWZpbmVkJDEsIGFyZ3MpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBydW5JZlByZXNlbnQoaGFuZGxlKSB7XG4gICAgICAgIC8vIEZyb20gdGhlIHNwZWM6IFwiV2FpdCB1bnRpbCBhbnkgaW52b2NhdGlvbnMgb2YgdGhpcyBhbGdvcml0aG0gc3RhcnRlZCBiZWZvcmUgdGhpcyBvbmUgaGF2ZSBjb21wbGV0ZWQuXCJcbiAgICAgICAgLy8gU28gaWYgd2UncmUgY3VycmVudGx5IHJ1bm5pbmcgYSB0YXNrLCB3ZSdsbCBuZWVkIHRvIGRlbGF5IHRoaXMgaW52b2NhdGlvbi5cbiAgICAgICAgaWYgKGN1cnJlbnRseVJ1bm5pbmdBVGFzaykge1xuICAgICAgICAgICAgLy8gRGVsYXkgYnkgZG9pbmcgYSBzZXRUaW1lb3V0LiBzZXRJbW1lZGlhdGUgd2FzIHRyaWVkIGluc3RlYWQsIGJ1dCBpbiBGaXJlZm94IDcgaXQgZ2VuZXJhdGVkIGFcbiAgICAgICAgICAgIC8vIFwidG9vIG11Y2ggcmVjdXJzaW9uXCIgZXJyb3IuXG4gICAgICAgICAgICBzZXRUaW1lb3V0KHJ1bklmUHJlc2VudCwgMCwgaGFuZGxlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciB0YXNrID0gdGFza3NCeUhhbmRsZVtoYW5kbGVdO1xuICAgICAgICAgICAgaWYgKHRhc2spIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50bHlSdW5uaW5nQVRhc2sgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHJ1bih0YXNrKTtcbiAgICAgICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgICAgICBjbGVhckltbWVkaWF0ZShoYW5kbGUpO1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50bHlSdW5uaW5nQVRhc2sgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpbnN0YWxsTmV4dFRpY2tJbXBsZW1lbnRhdGlvbigpIHtcbiAgICAgICAgcmVnaXN0ZXJJbW1lZGlhdGUgPSBmdW5jdGlvbihoYW5kbGUpIHtcbiAgICAgICAgICAgIHByb2Nlc3MubmV4dFRpY2soZnVuY3Rpb24gKCkgeyBydW5JZlByZXNlbnQoaGFuZGxlKTsgfSk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2FuVXNlUG9zdE1lc3NhZ2UoKSB7XG4gICAgICAgIC8vIFRoZSB0ZXN0IGFnYWluc3QgYGltcG9ydFNjcmlwdHNgIHByZXZlbnRzIHRoaXMgaW1wbGVtZW50YXRpb24gZnJvbSBiZWluZyBpbnN0YWxsZWQgaW5zaWRlIGEgd2ViIHdvcmtlcixcbiAgICAgICAgLy8gd2hlcmUgYGdsb2JhbC5wb3N0TWVzc2FnZWAgbWVhbnMgc29tZXRoaW5nIGNvbXBsZXRlbHkgZGlmZmVyZW50IGFuZCBjYW4ndCBiZSB1c2VkIGZvciB0aGlzIHB1cnBvc2UuXG4gICAgICAgIGlmIChnbG9iYWwucG9zdE1lc3NhZ2UgJiYgIWdsb2JhbC5pbXBvcnRTY3JpcHRzKSB7XG4gICAgICAgICAgICB2YXIgcG9zdE1lc3NhZ2VJc0FzeW5jaHJvbm91cyA9IHRydWU7XG4gICAgICAgICAgICB2YXIgb2xkT25NZXNzYWdlID0gZ2xvYmFsLm9ubWVzc2FnZTtcbiAgICAgICAgICAgIGdsb2JhbC5vbm1lc3NhZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBwb3N0TWVzc2FnZUlzQXN5bmNocm9ub3VzID0gZmFsc2U7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgZ2xvYmFsLnBvc3RNZXNzYWdlKFwiXCIsIFwiKlwiKTtcbiAgICAgICAgICAgIGdsb2JhbC5vbm1lc3NhZ2UgPSBvbGRPbk1lc3NhZ2U7XG4gICAgICAgICAgICByZXR1cm4gcG9zdE1lc3NhZ2VJc0FzeW5jaHJvbm91cztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGluc3RhbGxQb3N0TWVzc2FnZUltcGxlbWVudGF0aW9uKCkge1xuICAgICAgICAvLyBJbnN0YWxscyBhbiBldmVudCBoYW5kbGVyIG9uIGBnbG9iYWxgIGZvciB0aGUgYG1lc3NhZ2VgIGV2ZW50OiBzZWVcbiAgICAgICAgLy8gKiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi9ET00vd2luZG93LnBvc3RNZXNzYWdlXG4gICAgICAgIC8vICogaHR0cDovL3d3dy53aGF0d2cub3JnL3NwZWNzL3dlYi1hcHBzL2N1cnJlbnQtd29yay9tdWx0aXBhZ2UvY29tbXMuaHRtbCNjcm9zc0RvY3VtZW50TWVzc2FnZXNcblxuICAgICAgICB2YXIgbWVzc2FnZVByZWZpeCA9IFwic2V0SW1tZWRpYXRlJFwiICsgTWF0aC5yYW5kb20oKSArIFwiJFwiO1xuICAgICAgICB2YXIgb25HbG9iYWxNZXNzYWdlID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIGlmIChldmVudC5zb3VyY2UgPT09IGdsb2JhbCAmJlxuICAgICAgICAgICAgICAgIHR5cGVvZiBldmVudC5kYXRhID09PSBcInN0cmluZ1wiICYmXG4gICAgICAgICAgICAgICAgZXZlbnQuZGF0YS5pbmRleE9mKG1lc3NhZ2VQcmVmaXgpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcnVuSWZQcmVzZW50KCtldmVudC5kYXRhLnNsaWNlKG1lc3NhZ2VQcmVmaXgubGVuZ3RoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKGdsb2JhbC5hZGRFdmVudExpc3RlbmVyKSB7XG4gICAgICAgICAgICBnbG9iYWwuYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgb25HbG9iYWxNZXNzYWdlLCBmYWxzZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBnbG9iYWwuYXR0YWNoRXZlbnQoXCJvbm1lc3NhZ2VcIiwgb25HbG9iYWxNZXNzYWdlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlZ2lzdGVySW1tZWRpYXRlID0gZnVuY3Rpb24oaGFuZGxlKSB7XG4gICAgICAgICAgICBnbG9iYWwucG9zdE1lc3NhZ2UobWVzc2FnZVByZWZpeCArIGhhbmRsZSwgXCIqXCIpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGluc3RhbGxNZXNzYWdlQ2hhbm5lbEltcGxlbWVudGF0aW9uKCkge1xuICAgICAgICB2YXIgY2hhbm5lbCA9IG5ldyBNZXNzYWdlQ2hhbm5lbCgpO1xuICAgICAgICBjaGFubmVsLnBvcnQxLm9ubWVzc2FnZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICB2YXIgaGFuZGxlID0gZXZlbnQuZGF0YTtcbiAgICAgICAgICAgIHJ1bklmUHJlc2VudChoYW5kbGUpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHJlZ2lzdGVySW1tZWRpYXRlID0gZnVuY3Rpb24oaGFuZGxlKSB7XG4gICAgICAgICAgICBjaGFubmVsLnBvcnQyLnBvc3RNZXNzYWdlKGhhbmRsZSk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaW5zdGFsbFJlYWR5U3RhdGVDaGFuZ2VJbXBsZW1lbnRhdGlvbigpIHtcbiAgICAgICAgdmFyIGh0bWwgPSBkb2MuZG9jdW1lbnRFbGVtZW50O1xuICAgICAgICByZWdpc3RlckltbWVkaWF0ZSA9IGZ1bmN0aW9uKGhhbmRsZSkge1xuICAgICAgICAgICAgLy8gQ3JlYXRlIGEgPHNjcmlwdD4gZWxlbWVudDsgaXRzIHJlYWR5c3RhdGVjaGFuZ2UgZXZlbnQgd2lsbCBiZSBmaXJlZCBhc3luY2hyb25vdXNseSBvbmNlIGl0IGlzIGluc2VydGVkXG4gICAgICAgICAgICAvLyBpbnRvIHRoZSBkb2N1bWVudC4gRG8gc28sIHRodXMgcXVldWluZyB1cCB0aGUgdGFzay4gUmVtZW1iZXIgdG8gY2xlYW4gdXAgb25jZSBpdCdzIGJlZW4gY2FsbGVkLlxuICAgICAgICAgICAgdmFyIHNjcmlwdCA9IGRvYy5jcmVhdGVFbGVtZW50KFwic2NyaXB0XCIpO1xuICAgICAgICAgICAgc2NyaXB0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBydW5JZlByZXNlbnQoaGFuZGxlKTtcbiAgICAgICAgICAgICAgICBzY3JpcHQub25yZWFkeXN0YXRlY2hhbmdlID0gbnVsbDtcbiAgICAgICAgICAgICAgICBodG1sLnJlbW92ZUNoaWxkKHNjcmlwdCk7XG4gICAgICAgICAgICAgICAgc2NyaXB0ID0gbnVsbDtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBodG1sLmFwcGVuZENoaWxkKHNjcmlwdCk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaW5zdGFsbFNldFRpbWVvdXRJbXBsZW1lbnRhdGlvbigpIHtcbiAgICAgICAgcmVnaXN0ZXJJbW1lZGlhdGUgPSBmdW5jdGlvbihoYW5kbGUpIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQocnVuSWZQcmVzZW50LCAwLCBoYW5kbGUpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8vIElmIHN1cHBvcnRlZCwgd2Ugc2hvdWxkIGF0dGFjaCB0byB0aGUgcHJvdG90eXBlIG9mIGdsb2JhbCwgc2luY2UgdGhhdCBpcyB3aGVyZSBzZXRUaW1lb3V0IGV0IGFsLiBsaXZlLlxuICAgIHZhciBhdHRhY2hUbyA9IE9iamVjdC5nZXRQcm90b3R5cGVPZiAmJiBPYmplY3QuZ2V0UHJvdG90eXBlT2YoZ2xvYmFsKTtcbiAgICBhdHRhY2hUbyA9IGF0dGFjaFRvICYmIGF0dGFjaFRvLnNldFRpbWVvdXQgPyBhdHRhY2hUbyA6IGdsb2JhbDtcblxuICAgIC8vIERvbid0IGdldCBmb29sZWQgYnkgZS5nLiBicm93c2VyaWZ5IGVudmlyb25tZW50cy5cbiAgICBpZiAoe30udG9TdHJpbmcuY2FsbChnbG9iYWwucHJvY2VzcykgPT09IFwiW29iamVjdCBwcm9jZXNzXVwiKSB7XG4gICAgICAgIC8vIEZvciBOb2RlLmpzIGJlZm9yZSAwLjlcbiAgICAgICAgaW5zdGFsbE5leHRUaWNrSW1wbGVtZW50YXRpb24oKTtcblxuICAgIH0gZWxzZSBpZiAoY2FuVXNlUG9zdE1lc3NhZ2UoKSkge1xuICAgICAgICAvLyBGb3Igbm9uLUlFMTAgbW9kZXJuIGJyb3dzZXJzXG4gICAgICAgIGluc3RhbGxQb3N0TWVzc2FnZUltcGxlbWVudGF0aW9uKCk7XG5cbiAgICB9IGVsc2UgaWYgKGdsb2JhbC5NZXNzYWdlQ2hhbm5lbCkge1xuICAgICAgICAvLyBGb3Igd2ViIHdvcmtlcnMsIHdoZXJlIHN1cHBvcnRlZFxuICAgICAgICBpbnN0YWxsTWVzc2FnZUNoYW5uZWxJbXBsZW1lbnRhdGlvbigpO1xuXG4gICAgfSBlbHNlIGlmIChkb2MgJiYgXCJvbnJlYWR5c3RhdGVjaGFuZ2VcIiBpbiBkb2MuY3JlYXRlRWxlbWVudChcInNjcmlwdFwiKSkge1xuICAgICAgICAvLyBGb3IgSUUgNuKAkzhcbiAgICAgICAgaW5zdGFsbFJlYWR5U3RhdGVDaGFuZ2VJbXBsZW1lbnRhdGlvbigpO1xuXG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gRm9yIG9sZGVyIGJyb3dzZXJzXG4gICAgICAgIGluc3RhbGxTZXRUaW1lb3V0SW1wbGVtZW50YXRpb24oKTtcbiAgICB9XG5cbiAgICBhdHRhY2hUby5zZXRJbW1lZGlhdGUgPSBzZXRJbW1lZGlhdGU7XG4gICAgYXR0YWNoVG8uY2xlYXJJbW1lZGlhdGUgPSBjbGVhckltbWVkaWF0ZTtcbn0odHlwZW9mIHNlbGYgPT09IFwidW5kZWZpbmVkXCIgPyB0eXBlb2YgZ2xvYmFsID09PSBcInVuZGVmaW5lZFwiID8gdGhpcyA6IGdsb2JhbCA6IHNlbGYpKTtcblxufSkuY2FsbCh0aGlzLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pO1xufSx7fV19LHt9LFsxMF0pKDEwKVxufSk7XG4iXSwi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
"use strict";

goog.provide('tutao.tutanota.index.Indexer');

/**
 * Is responsible for indexing elements and performing searches on the index.
 * @constructor
 */
tutao.tutanota.index.Indexer = function() {

};

/**
 * Indexes all elements in the provided array that are not already indexed.
 * @param {number} typeId The id of the type of the elements to index.
 * @param {[string]|Array.<[string,string]>} ids The ids of the elements to index. The id order ascending.
 * @param {function(?string)} callback This function is called as soon as the operation is finished and passes the first
 * id from the ids list whose element was indexed.
 */
tutao.tutanota.index.Indexer.prototype.tryIndexElements = function(typeId, ids, callback) {
	var self = this;
	if (ids.length === 0) {
		if (callback) {
			callback(null);
		}
		return;
	}
	// remove all ids from the list that do not need to be indexed
	tutao.locator.dao.getLastIndexed(typeId, function(status, lastIndexedId) {
		// if lastIndexedId is available, remove all ids that are smaller because these elements are already indexed
		if (lastIndexedId) {
			for (var i = 0; i < ids.length; i++) {
				// use the element id part if it is an LET id
				var id = ids[i];
				if (id instanceof Array) {
					id = id[1];
				}
				if (tutao.rest.EntityRestInterface.firstBiggerThanSecond(id, lastIndexedId)) {
					ids = ids.slice(i);
					break;
				} else if (i == ids.length - 1) {
					// no id was bigger than the last indexed, so we do not need to index any element
					callback(null);
					return;
				}
			}
		}
		self._indexElementsFrom(typeId, ids, 0, callback);
	});
};

/**
 * @protected
 * Indexes all elements in the provided array starting from the given index.
 * @param {number} typeId The id of the type of the elements to index.
 * @param {[string]|Array.<[string,string]>} ids The ids of the elements to index. The order must be ascending.
 * @param {number} index The index of the id in the ids array to start indexing from.
* @param {function(?string)} callback This function is called as soon as the operation is finished and passes the first
* id from the ids list whose element was indexed.
 */
tutao.tutanota.index.Indexer.prototype._indexElementsFrom = function(typeId, ids, index, callback) {
	var self = this;
	if (index == ids.length) {
		// we are finished
		if (callback) {
			callback(ids[0]);
		}
		return;
	}
	self._indexElement(typeId, ids[index], function() {
		self._indexElementsFrom(typeId, ids, ++index, callback);
	});
};

/**
 * @protected
 * Indexes all attributes of the given element.
 * @param {number} typeId The id of the type of the elements to index.
 * @param {string|Array.<string>} id The id of the element to index.
 * @param {function()} callback This function is called as soon as the element is indexed.
 */
tutao.tutanota.index.Indexer.prototype._indexElement = function(typeId, id, callback) {
	var self = this;
	if (typeId == tutao.entity.tutanota.Mail.prototype.TYPE_ID) {
		tutao.entity.tutanota.Mail.load(id, function(mail, exception) {
			if (!exception) {
				self._indexMail(mail, callback);
			}
		});
	} else if (typeId == tutao.entity.tutanota.MailBody.prototype.TYPE_ID) {
		tutao.entity.tutanota.MailBody.load(id, function(body, exception) {
			if (!exception) {
				self._indexMailBody(body, callback);
			}
		});
	}
};

/**
 * @protected
 * Indexes all attributes of the given mail.
 * @param {tutao.entity.tutanota.Mail} mail The mail to index.
 * @param {function()} callback This function is called as soon as the mail is indexed.
 */
tutao.tutanota.index.Indexer.prototype._indexMail = function(mail, callback) {
	var self = this;
	// store the subject index
	var subjectWords = self._encryptWords(self.getSearchIndexWordsFromText(mail.getSubject()));
	tutao.locator.dao.addIndexEntries(mail.TYPE_ID, [mail.SUBJECT_ATTRIBUTE_ID], mail.getId()[1], subjectWords, function(status) {
		if (status === tutao.db.DbInterface.STATUS_SUCCESS) {
			// store the sender index (only words in name)
			var senderWords = self._encryptWords(self.getSearchIndexWordsFromText(mail.getSender().getName()));
			tutao.locator.dao.addIndexEntries(mail.TYPE_ID, [mail.SENDER_ATTRIBUTE_ID], mail.getId()[1], senderWords, function(status) {
				if (status === tutao.db.DbInterface.STATUS_SUCCESS) {
					// store all recipients (to, cc, bcc) index (only words in names) in the toRecipients index for now
					var recipientsWords = [];
					for (var i = 0; i < mail.getToRecipients().length; i++) {
						recipientsWords = tutao.util.ArrayUtils.getUniqueOrArray([recipientsWords, self.getSearchIndexWordsFromText(mail.getToRecipients()[i].getName())]);
					}
					for (var i = 0; i < mail.getCcRecipients().length; i++) {
						recipientsWords = tutao.util.ArrayUtils.getUniqueOrArray([recipientsWords, self.getSearchIndexWordsFromText(mail.getCcRecipients()[i].getName())]);
					}
					for (var i = 0; i < mail.getBccRecipients().length; i++) {
						recipientsWords = tutao.util.ArrayUtils.getUniqueOrArray([recipientsWords, self.getSearchIndexWordsFromText(mail.getBccRecipients()[i].getName())]);
					}
					recipientsWords = self._encryptWords(recipientsWords);
					tutao.locator.dao.addIndexEntries(mail.TYPE_ID, [mail.TORECIPIENTS_ATTRIBUTE_ID], mail.getId()[1], recipientsWords, function(status) {
						if (status === tutao.db.DbInterface.STATUS_SUCCESS) {
							// store the state index
							tutao.locator.dao.addIndexEntries(mail.TYPE_ID, [mail.STATE_ATTRIBUTE_ID], mail.getId()[1], self._encryptWords([mail.getState() + ""]), function(status) {
								if (status === tutao.db.DbInterface.STATUS_SUCCESS) {
									// store the unread/read index (boolean values as 0 and 1)
									tutao.locator.dao.addIndexEntries(mail.TYPE_ID, [mail.UNREAD_ATTRIBUTE_ID], mail.getId()[1], self._encryptWords((mail.getUnread()) ? ["1"] : ["0"]),
											function(status) {
										if (status === tutao.db.DbInterface.STATUS_SUCCESS) {
											// store the trashed/untrashed index (boolean values as 0 and 1)
											tutao.locator.dao.addIndexEntries(mail.TYPE_ID, [mail.TRASHED_ATTRIBUTE_ID], mail.getId()[1], self._encryptWords((mail.getTrashed()) ? ["1"] : ["0"]),
													function(status) {
												if (status === tutao.db.DbInterface.STATUS_SUCCESS) {
													// store the body id index
													tutao.locator.dao.addIndexEntries(mail.TYPE_ID, [mail.BODY_ATTRIBUTE_ID], mail.getId()[1], self._encryptWords([mail.getBody()]),
															function(status) {
														if (status === tutao.db.DbInterface.STATUS_SUCCESS) {
															tutao.locator.dao.setIndexed(mail.TYPE_ID, mail.getId()[1], callback);
														} else {
															callback();
														}
													});
												} else {
													callback();
												}
											});
										} else {
											callback();
										}
									});
								} else {
									callback();
								}
							});
						} else {
							callback();
						}
					});
				} else {
					callback();
				}
			});
		} else {
			callback();
		}
	});
};

/**
 * @protected
 * Indexes all attributes of the given mail body.
 * @param {tutao.entity.tutanota.MailBody} mailBody The mail body to index.
 * @param {function()} callback This function is called as soon as the mail body is indexed.
 */
tutao.tutanota.index.Indexer.prototype._indexMailBody = function(mailBody, callback) {
	var words = this._encryptWords(this.getSearchIndexWordsFromText(mailBody.getText()));
	tutao.locator.dao.addIndexEntries(mailBody.TYPE_ID, [mailBody.TEXT_ATTRIBUTE_ID], mailBody.getId(), words, function(status) {
		if (status === tutao.db.DbInterface.STATUS_SUCCESS) {
			tutao.locator.dao.setIndexed(mailBody.TYPE_ID, mailBody.getId(), callback);
		} else {
			callback();
		}
	});
};

/**
 * @protected
 * Provides an array of words for the search index from a given text.
 * @param {string} text The text.
 * @return {Array.<string>} The array of words.
 */
tutao.tutanota.index.Indexer.prototype.getSearchIndexWordsFromText = function(text) {
	return tutao.util.ArrayUtils.getUniqueArray(this.removeSpecialCharactersFromText(text.toLowerCase()).split(" "));
};

/**
 * Replaces all special characters in text with whitespaces.
 * @param {string} text The text.
 * @return {string} The text without special characters.
 */
tutao.tutanota.index.Indexer.prototype.removeSpecialCharactersFromText = function(text) {
	return text.replace(/[^a-zA-Z 0-9\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF]+/g, ' '); // all latin letters
};

/**
 * Retrieves the ids of all elements that contain at least one of the given values. The element is of type ET or LET,
 * but the attribute may be one of the aggregated types. The index is encrypted.
 * @param {number} typeId The id of the type of the element. The type may be an ET or LET.
 * @param {Array.<number>} attributeIds The ids leading to the searchable attribute of the type.
 * This id chain must start with an attribute of the type (ET or LET) and may go down to AggregatedType's attributes.
 * @param {[string]} values The values that the returned elements shall contain.
 * @param {function(Array.<string>)} callback This function is called as soon as the execution is finished. As argument an array of string ids of the matching
 * elements (only element ids, no list ids) is passed to the callback function.
 */
tutao.tutanota.index.Indexer.prototype.getElementsByValues = function(typeId, attributeIds, values, callback) {
	var result = [];
	var f = function(index) {
		if (index == values.length) {
			callback(tutao.util.ArrayUtils.getUniqueArray(result));
			return;
		}
		tutao.locator.dao.getElementsByValue(typeId, attributeIds, tutao.locator.aesCrypter.encryptUtf8(
				tutao.locator.userController.getUserClientKey(), values[index], false), function(status, ids) {
			if (status === tutao.db.DbInterface.STATUS_SUCCESS) {
				result = result.concat(ids);
				f(++index);
			} else {
				callback([]);
			}
		});
	};
	f(0);
};

/**
 * Removes all index entries for the given element id for the given attribute ids lists.
 * @param {number} typeId The id of the type of the element. The type may be an ET or LET.
 * @param {Array.<Array.<number>>} attributeIdsList An array of arrays with ids leading to the searchable attribute of the type.
 * This id chain must start with an attribute of the type (ET or LET) and may go down to AggregatedType's attributes.
 * @param {string} elementId The id of the element (no list id in case of LET instance).
 * @param {function()} callback This function is called as soon as the execution is finished.
 */
tutao.tutanota.index.Indexer.prototype.removeIndexEntries = function(typeId, attributeIdsList, elementId, callback) {
	tutao.locator.dao.removeIndexEntries(typeId, attributeIdsList, elementId, function() {
		if (callback) {
			callback();
		}
	});
};

/**
 * Stores the index entries for an elements attribute. The element is of type ET or LET, but the attribute may be one of the
 * aggregated types. Calls the callback function when finished.
 * @param {number} typeId The id of the type of the element. The type may be an ET or LET.
 * @param {Array.<number>} attributeIds The ids leading to the searchable attribute of the type.
 * This id chain must start with an attribute of the type (ET or LET) and may go down to AggregatedType's attributes.
 * @param {string} elementId The id of the element (no list id in case of LET instance).
 * @param {Array.<string>} values The values that shall reference the element.
 * @param {function(string)=} callback This optional function is called as soon as the execution is finished with one of
 * the status code STATUS_SUCCESS or STATUS_NO_MEM.
 */
tutao.tutanota.index.Indexer.prototype.addIndexEntries = function(typeId, attributeIds, elementId, values, callback) {
	tutao.locator.dao.addIndexEntries(typeId, attributeIds, elementId, this._encryptWords(values), callback);
};

/**
 * Provides the id of the highest indexed element.
 * @param {number} typeId The type id of the element.
 * @param {function(string)} callback Is called with the id.
 */
tutao.tutanota.index.Indexer.prototype.getLastIndexedId = function(typeId, callback) {
	tutao.locator.dao.getLastIndexed(typeId, function(status, lastIndexedId) {
		if (status === tutao.db.DbInterface.STATUS_SUCCESS) {
			if (lastIndexedId) {
				callback(lastIndexedId);
			} else {
				callback(tutao.rest.EntityRestInterface.GENERATED_MIN_ID);
			}
		} else {
			//TODO story "refactoring search": what to do?
			callback("0");
		}
	});
};

/**
 * @protected
 * Encrypts a list of words.
 * @param {Array.<string>} plainTextWords The words.
 * @return {Array.<string>} The encrypted words.
 */
tutao.tutanota.index.Indexer.prototype._encryptWords = function(plainTextWords) {
	var encryptedWords = [];
	for (var i = 0; i < plainTextWords.length; i++) {
		encryptedWords.push(tutao.locator.aesCrypter.encryptUtf8(
				tutao.locator.userController.getUserClientKey(), plainTextWords[i], false));
	}
	return encryptedWords;
};

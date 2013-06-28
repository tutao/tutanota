"use strict";

goog.provide('tutao.event.PollingListEventTracker');

/**
 * The PollingListEventTracker polls the database regularly to get informations about
 * updated or added data.
 * @param {Object} listType The list type that shall be tracked.
 * @param {string} listId The list id of the type.
 * @constructor
 * @implements {tutao.event.ListEventTracker}
 */
tutao.event.PollingListEventTracker = function(listType, listId) {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this); // listener methods are invoked from the observable EventBusClient
	this._listType = listType;
	this._typeName = listType.PATH;
	this._listId = listId;

	this._observable = new tutao.event.Observable();
};

/**
 * @inheritDoc
 */
tutao.event.PollingListEventTracker.prototype.addObserver = function(observer) {
	this._observable.addObserver(observer);
};

/**
 * @inheritDoc
 */
tutao.event.PollingListEventTracker.prototype.removeObserver = function(observer) {
	this._observable.removeObserver(observer);
};

/**
 * @inheritDoc
 */
tutao.event.PollingListEventTracker.prototype.notifyObservers = function(data) {
	this._observable.notifyObservers(data);
};

/**
 * @inheritDoc
 */
tutao.event.PollingListEventTracker.prototype.observeList = function(highestId) {
	this._highestId = highestId;
	this._refresh();
};

/**
 * Polls for new elements and notifies the observers if any are found.
 * @protected
 */
tutao.event.PollingListEventTracker.prototype._refresh = function() {
	var self = this;
	setTimeout(function() {
		tutao.locator.entityRestClient.getElementRange(self._listType, self._typeName, self._listId, self._highestId, tutao.rest.EntityRestInterface.MAX_RANGE_COUNT, false, null, tutao.entity.EntityHelper.createAuthHeaders(), function(newElements, exception) {
			if (exception) {
				console.log(exception);
			} else if (newElements.length > 0) {
				self._highestId = tutao.util.ArrayUtils.last(newElements).getId()[1];
				self.notifyObservers(newElements);
			}
			self._refresh();
		});
	}, 1000);
};

"use strict";

goog.provide('tutao.event.PushListEventTracker');

/**
 * The PushListEventTracker uses the EventBusClient to fetch information about
 * updated or added data.
 * @param {Object} listType The list type that shall be tracked.
 * @param {string} listId The list id of the type.
 * @param {string} typeName The typeName of the type.
 * @param {string} version The version of the model.
 * @constructor
 * @implements {tutao.event.ListEventTracker}
 */
tutao.event.PushListEventTracker = function(listType, listId, typeName, version) {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this); // listener methods are invoked from the observable EventBusClient
	this._listType = listType;
	this._path = listType.PATH;
	this._typeName = typeName;
	this._listId = listId;
	this._version = version;

	this._observable = new tutao.event.Observable();
};

/**
 * @inheritDoc
 */
tutao.event.PushListEventTracker.prototype.addObserver = function(observer) {
	this._observable.addObserver(observer);
};

/**
 * @inheritDoc
 */
tutao.event.PushListEventTracker.prototype.removeObserver = function(observer) {
	this._observable.removeObserver(observer);
};

/**
 * @inheritDoc
 */
tutao.event.PushListEventTracker.prototype.notifyObservers = function(data) {
	this._observable.notifyObservers(data);
};

/**
 * @inheritDoc
 */
tutao.event.PushListEventTracker.prototype.observeList = function(highestId) {
	var self = this;
	tutao.locator.entityRestClient.getElementRange(self._listType, self._path, self._listId, highestId, tutao.rest.EntityRestInterface.MAX_RANGE_COUNT, false, { "v": self._version }, tutao.entity.EntityHelper.createAuthHeaders(), function(newElements, exception) {
		if (exception) {
			console.log(exception);
		} else if (newElements.length > 0) {
			tutao.entity.EntityHelper.loadSessionKeys(newElements, function(newElements, exception) {
				if (exception) {
					console.log(exception);	
				} else {
					self.notifyObservers(newElements);
				}
			});
		}
		tutao.locator.eventBus.addObserver(self._handleEventBusNotification);
	});
};

/**
 * @param {tutao.entity.sys.EntityUpdate} update The update notification.
 */
tutao.event.PushListEventTracker.prototype._handleEventBusNotification = function(update) {
	var self = this;
	if (update.getType() === this._typeName && update.getInstanceListId() === this._listId) {
		tutao.locator.entityRestClient.getElement(self._listType, self._path, update.getInstanceId(), self._listId, { "v": self._version }, tutao.entity.EntityHelper.createAuthHeaders(), function(instance, exception) {
			if (exception) {
				console.log(exception);
			} else {
				instance._entityHelper.loadSessionKey(function(instance, exception) {
					if (exception) {
						console.log(exception);
					} else {
						self.notifyObservers([instance]);
					}
				});
			}
		});
	}
};

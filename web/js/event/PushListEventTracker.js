"use strict";

tutao.provide('tutao.event.PushListEventTracker');

/**
 * The PushListEventTracker uses the EventBusClient to fetch information about
 * updated or added data for a specific list of generated id types.
 * @param {Object} listType The list type that shall be tracked.
 * @param {string} listId The list id of the type.
 * @param {string} typeName The typeName of the type.
  * @constructor
 * @implements {tutao.event.ListEventTracker}
 * @implements {tutao.event.EventBusListener}
 */
tutao.event.PushListEventTracker = function(listType, listId, typeName) {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this); // listener methods are invoked from the observable EventBusClient
	this._listType = listType;
	this._path = listType.PATH;
	this._typeName = typeName;
	this._listId = listId;
	this._version = listType.MODEL_VERSION;
	this._highestElementId = tutao.rest.EntityRestInterface.GENERATED_MIN_ID;

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
    this._highestElementId = highestId;
    this._notifyAboutExistingElements();
    tutao.locator.eventBus.addListener(this);
};

tutao.event.PushListEventTracker.prototype.stopObservingList = function() {
    this._highestElementId = tutao.rest.EntityRestInterface.GENERATED_MIN_ID;
    tutao.locator.eventBus.removeListener(this);
};


/**
 * @param {tutao.entity.sys.EntityUpdate} update The update notification.
 */
tutao.event.PushListEventTracker.prototype._handleEventBusNotification = function(update) {
	var self = this;
	if (update.getType() === this._typeName && update.getInstanceListId() === this._listId && update.getOperation() == tutao.entity.tutanota.TutanotaConstants.OPERATION_TYPE_CREATE) {
		return tutao.locator.entityRestClient.getElement(self._listType, self._path, update.getInstanceId(), self._listId, { "v": self._version }, tutao.entity.EntityHelper.createAuthHeaders()).then(function(instance) {
            return instance._entityHelper.loadSessionKey().then(function(instance) {
                self.notifyObservers([instance]);
                if (tutao.rest.EntityRestInterface.firstBiggerThanSecond(instance.getId()[1], self._highestElementId)) {
                    self._highestElementId = instance.getId()[1];
                }
            });
		}).caught(function(exception) {
            // this error should not occur when full sync is available
            console.log(exception);
        });
	} else {
        return Promise.resolve();
    }
};

tutao.event.PushListEventTracker.prototype._notifyAboutExistingElements = function() {
    var self = this;
    return tutao.rest.EntityRestInterface.loadAll(self._listType, self._listId, self._highestElementId).then(function(newElements) {
        if (newElements.length > 0) {
            return tutao.entity.EntityHelper.loadSessionKeys(newElements).then(function(newElements) {
                self.notifyObservers(newElements);
                if ( newElements.length > 0 ){
                    self._highestElementId = newElements[newElements.length - 1].getId()[1];
                }
            });
        } else {
            return Promise.resolve();
        }
    }).caught(function(exception) {
        // this error should not occur when full sync is available
        console.log(exception);
    });
};

/**
 * @inheritDoc
 */
tutao.event.PushListEventTracker.prototype.notifyNewDataReceived = function (data) {
    this._handleEventBusNotification(data);
};

/**
 * @inheritDoc
 */
tutao.event.PushListEventTracker.prototype.notifyReconnected = function() {
    this._notifyAboutExistingElements();
};

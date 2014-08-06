"use strict";

tutao.provide('tutao.util.KnockoutObservableAdapter');

/**
 * This adapter creates knockout observables from our entity classes 
 * @constructor
 * @param {Object=} entity A tutadb generated Entity-Class
 */
tutao.util.KnockoutObservableAdapter = function(entity) {
	var self = this;
	this.entity = entity;
	function observable() {
		return entity;
	};

    ko.subscribable.call(observable);
    observable.peek = function() { return entity };
    observable.valueHasMutated = function () { observable["notifySubscribers"](entity); };
    observable.valueWillMutate = function () { observable["notifySubscribers"](entity, "beforeChange"); };
    ko.utils.extend(observable, ko.observable['fn']);

    ko.exportProperty(observable, 'peek', observable.peek);
    ko.exportProperty(observable, "valueHasMutated", observable.valueHasMutated);
    ko.exportProperty(observable, "valueWillMutate", observable.valueWillMutate);
    
	this.entity.registerObserver(function() {
		observable["notifySubscribers"](self.entity);
	});
    
    return observable;
};

tutao.util.KnockoutObservableAdapter.prototype[ko.observable.protoProperty] = ko.observable;
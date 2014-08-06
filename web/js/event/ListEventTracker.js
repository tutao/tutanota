"use strict";

tutao.provide('tutao.event.ListEventTracker');
//import('tutao.event.Observable');


/**
 * The ListEventTracker is an Observable that itself observes db contents (Lists). Just register
 * as an observer after telling which list you want to track.
 * @param {Object} listType The list type that shall be tracked.
 * @param {string} listId The list id of the type.
 * @interface
 * @implements {tutao.event.ObservableInterface}
 * @protected
 */
tutao.event.ListEventTracker = function(listType, listId) {};


/**
 * Starts listening for new elements with an id bigger than the given one.
 * @param {string} highestId Only elements of ids bigger than this one are reported.
 */
tutao.event.ListEventTracker.prototype.observeList = function(highestId) {};

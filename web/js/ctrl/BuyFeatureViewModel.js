"use strict";

tutao.provide('tutao.tutanota.ctrl.BuyFeatureViewModel');

/**
 * The BuyFeatureViewModel provides a convenient interface for buying additional premium features.
 * @interface
 */
tutao.tutanota.ctrl.BuyFeatureViewModel = function() {};

/**
 * Returns a heading text for the premium feature.
 * @return {String} The heading
 */
tutao.tutanota.ctrl.BuyFeatureViewModel.prototype.getHeading = function () {};

/**
 * Returns detailed description of the premium feature.
 * @return {String} description of the feature.
 */
tutao.tutanota.ctrl.BuyFeatureViewModel.prototype.getInfoText = function () {};


/**
 * Returns a list of available buy options for this feature.
 * @return {Array.<tutao.tutanota.ctrl.BuyOptionModel>} description of the feature.
 */
tutao.tutanota.ctrl.BuyFeatureViewModel.prototype.getBuyOptions = function () {};


/**
 * Updates the current buy option.
 * @param {tutao.tutanota.ctrl.BuyOptionModel} newValue
 */
tutao.tutanota.ctrl.BuyFeatureViewModel.prototype.updateCurrentOption = function (newValue) {};

/**
 * @return {tutao.tutanota.ctrl.BuyOptionModel} The current buy option.
 */
tutao.tutanota.ctrl.BuyFeatureViewModel.prototype.getCurrentOption = function () {};





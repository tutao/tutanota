"use strict";

tutao.provide('tutao.tutanota.ctrl.AdminInvoicingViewModel');

tutao.tutanota.ctrl.AdminInvoicingViewModel = function() {
    tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
    var self = this;

    this.business = ko.observable(false);
    this.users = ko.observable(0);
    this.storage = ko.observable(0);

    this.items = ko.observableArray();
    this.items.push({ type: tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_PREMIUM, name: "bookingItemAccountType_label", current: ko.observable("Free"), price: ko.observable(0), itemPrice : 1 });
    this.items.push({ type: tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_USERS, name: "bookingItemUsers_label", current: ko.observable("0"), price: ko.observable(0), itemPrice : 1  });
    this.items.push({ type: tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_STORAGE, name: "bookingItemStorage_label", current: ko.observable("1 GB"), price: ko.observable(0), itemPrice : 1  });

    this.orderStatus = ko.observable({ type: "neutral", text: "emptyString_msg" });
    this.orderSubmitStatus = ko.observable({ type: "neutral", text: "emptyString_msg" });

    var user = tutao.locator.userController.getLoggedInUser();
    user.loadCustomer().then(function(customer) {
        self._getItem(tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_PREMIUM).current(tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_NAMES[Number(user.getAccountType())]);
        return customer.loadCustomerInfo().then(function(customerInfo) {
            self._getItem(tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_STORAGE).current((customerInfo.getStorageCapacity() > 0 ) ? customerInfo.getStorageCapacity() + " GB" : tutao.lang('storageCapacityNoLimit_label'));
            return tutao.rest.EntityRestInterface.loadAll(tutao.entity.sys.BookingItem, customerInfo.getBookingItems().getItems()).then(function(bookingItems) {
                for( var i=0; i<self.items().length; i++) {
                    var currentItem = self.items()[i];
                    var lastBookingItem = self._getLastBookingItem(currentItem.type, bookingItems);
                    if (lastBookingItem) {
                        currentItem.price(lastBookingItem.getPrice());
                        if ( currentItem.type == tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_USERS ){
                            currentItem.current(lastBookingItem.getCount());
                        }
                    }
                }
            });
        });
    });
};

tutao.tutanota.ctrl.AdminInvoicingViewModel.prototype._getItem = function(type) {
    for( var i=0; i<this.items().length; i++) {
        if (this.items()[i].type == type){
            return this.items()[i];
        }
    }
    throw new Error("item not found");
};

tutao.tutanota.ctrl.AdminInvoicingViewModel.prototype._getLastBookingItem = function(type, bookingItems) {
    for( var i=bookingItems.length-1; i>=0; i--){
        if (bookingItems[i].getFeatureType() == type){
            return bookingItems[i];
        }
    }
    return null;
};

tutao.tutanota.ctrl.AdminInvoicingViewModel.prototype.getTotalPrice = function() {
    var total = 0;
    for (var i=0; i<this.items().length; i++) {
        total += this.items()[i].price()    ;
    }
    return total;
};







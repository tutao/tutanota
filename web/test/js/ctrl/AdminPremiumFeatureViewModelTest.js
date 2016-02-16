"use strict";

describe("AdminPremiumFeatureViewModelTest", function () {

    var assert = chai.assert;
    var localViewModel;

    beforeEach(function () {
        var customerInfoMock  = {};
        customerInfoMock.getStorageCapacity = function(){return 1};
        var customerMock = {};
        customerMock.loadCustomerInfo = function(){return Promise.resolve(customerInfoMock)};
        var userMock = {};
        userMock.loadCustomer = function(){return Promise.resolve(customerMock)};
        tutao.locator.userController.getLoggedInUser = function(){return userMock;}
        localViewModel = new tutao.tutanota.ctrl.AdminPremiumFeatureViewModel();
    });


    afterEach(function () {
    });


    it("test neutral codes", function () {
        localViewModel.promotionCode("");
        
        assert.equal("emptyString_msg", localViewModel._checkCode());
        localViewModel.promotionCode(" ");
        
        assert.equal("emptyString_msg", localViewModel._checkCode());
    });

    it("test valid codes", function () {
        localViewModel.promotionCode("Cb-Aret-rSt4");
        
        assert.equal(null, localViewModel._checkCode());
        localViewModel.promotionCode("CB-1234-artf");
        
        assert.equal(null, localViewModel._checkCode());
        localViewModel.promotionCode("CB-1234-aRtF");
        
        assert.equal(null, localViewModel._checkCode());
        localViewModel.promotionCode("  Cb-Aret-rSt4");
        
        assert.equal(null, localViewModel._checkCode());
        localViewModel.promotionCode("Cb-Aret-rSt4  ");
        
        assert.equal(null, localViewModel._checkCode());
        localViewModel.promotionCode("  Cb-Aret-rSt4  ");
        
        assert.equal(null, localViewModel._checkCode());
        localViewModel.promotionCode("cb-niw5-emb4");
        
        assert.equal(null, localViewModel._checkCode());
        localViewModel.promotionCode("cb-hkix-a5bs");
        
        assert.equal(null, localViewModel._checkCode());
        localViewModel.promotionCode(" cb-u773-3oib");
        
        assert.equal(null, localViewModel._checkCode());
        localViewModel.promotionCode("cb-xqrp-aees");
        
        assert.equal(null, localViewModel._checkCode());
        localViewModel.promotionCode("cb-adcw-nra3");
        
        assert.equal(null, localViewModel._checkCode());
        localViewModel.promotionCode("cb-aurw-5ydx");
        
        assert.equal(null, localViewModel._checkCode());
        localViewModel.promotionCode("cb-fc7e-btde");
        
        assert.equal(null, localViewModel._checkCode());
        localViewModel.promotionCode("cb-zesn-37me");
        
        assert.equal(null, localViewModel._checkCode());
        localViewModel.promotionCode("cb-gzno-utkq");
        
        assert.equal(null, localViewModel._checkCode());
        localViewModel.promotionCode("cb-puib-dpbd");
        
        assert.equal(null, localViewModel._checkCode());
        localViewModel.promotionCode("cb-prok-fmgs");
        
        assert.equal(null, localViewModel._checkCode());
        localViewModel.promotionCode("cb-5a3e-pkha");
        
        assert.equal(null, localViewModel._checkCode());
        localViewModel.promotionCode("cb-ghzq-bmbh");
        
        assert.equal(null, localViewModel._checkCode());
        localViewModel.promotionCode("cb-3yhk-7tc4");
        
        assert.equal(null, localViewModel._checkCode());
    });

    it("test invalid codes", function () {
        localViewModel.promotionCode("CB");
        
        assert.equal("invalidInputFormat_msg", localViewModel._checkCode());
        localViewModel.promotionCode("CB-1234");
        
        assert.equal("invalidInputFormat_msg", localViewModel._checkCode());
        localViewModel.promotionCode("df-1234-saRtF");
        
        assert.equal("invalidInputFormat_msg", localViewModel._checkCode());
        localViewModel.promotionCode("aCb-1234-saRtF");
        
        assert.equal("invalidInputFormat_msg", localViewModel._checkCode());
        localViewModel.promotionCode("CB-t-rSt4");
        
        assert.equal("invalidInputFormat_msg", localViewModel._checkCode());
        localViewModel.promotionCode("Cb-dAret-rSt4  ");
        
        assert.equal("invalidInputFormat_msg", localViewModel._checkCode());
        localViewModel.promotionCode("Cb-Aret-4");
        
        assert.equal("invalidInputFormat_msg", localViewModel._checkCode());
        localViewModel.promotionCode("Cb-Aret-1rSt4");
        
        assert.equal("invalidInputFormat_msg", localViewModel._checkCode());
        localViewModel.promotionCode("Cb_Aret_rSt4");
        
        assert.equal("invalidInputFormat_msg", localViewModel._checkCode());
    });
});
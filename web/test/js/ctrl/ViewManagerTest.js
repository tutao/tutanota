"use strict";

describe("ViewManagerTest", function () {

    var assert = chai.assert;
    JsMockito.Integration.importTo(window);

    beforeEach(function () {
        var uc = mock(new tutao.ctrl.UserController());
        when(uc.isExternalUserLoggedIn)().thenReturn(false);
        when(uc.isInternalUserLoggedIn)().thenReturn(true);
        when(uc.getLoggedInUser)().thenReturn({ getAccountType: function() { return tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_FREE; }})
        tutao.locator.replace("userController", uc);
        if (!tutao.tutanota.gui) {
            tutao.tutanota.gui = {};
        }
        tutao.tutanota.gui.adjustPanelHeight = function () {
        };
    });

    afterEach(function () {
        tutao.locator.reset();
        tutao.locator.randomizer.addEntropy(1, 256, tutao.crypto.RandomizerInterface.ENTROPY_SRC_MOUSE);
    });

    it(" that views are correctly activated and deactivated", function () {
        var view1 = mock(new tutao.tutanota.ctrl.View());
        var view2 = mock(new tutao.tutanota.ctrl.View());
        when(view1.isForInternalUserOnly)().thenReturn(false);
        when(view2.isForInternalUserOnly)().thenReturn(false);

        // activate default view1
        tutao.tutanota.ctrl.ViewManager.prototype.getViews = function() {
            return [view1, view2];
        };
        var vm = new tutao.tutanota.ctrl.ViewManager();
        vm.init(false);
        verify(view1.init)();
        verify(view2.init)();
        verify(view1, noMoreInteractions());
        verify(view2, noMoreInteractions());
        assert.isTrue(vm.getActiveView() != view1);
        assert.isTrue(vm.getActiveView() != view2);
        assert.isNotNull(vm.getActiveView());

        // select view1 -> activation
        vm.select(view1);
        verify(view1.activate)();
        verify(view1.isForInternalUserOnly)();
        verify(view1, noMoreInteractions());
        verify(view2, noMoreInteractions());
        assert.equal(view1, vm.getActiveView());

        // select view2 -> activation
        vm.select(view2);
        verify(view2.isForInternalUserOnly)();
        verify(view1.deactivate)();
        verify(view2.activate)();
        verify(view1, noMoreInteractions());
        verify(view2, noMoreInteractions());
        assert.equal(view2, vm.getActiveView());

        // select view2 -> do nothing, as view is already selected
        vm.select(view2);
        verify(view2.isForInternalUserOnly, times(2))(); // is the call from the test before
        verify(view1, noMoreInteractions());
        verify(view2, noMoreInteractions());
        assert.equal(view2, vm.getActiveView());
    });


});
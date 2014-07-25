"use strict";

JsHamcrest.Integration.JsTestDriver();
JsMockito.Integration.JsTestDriver();

TestCase("ViewManagerTest", {
	setUp: function() {
		var uc = JsMockito.mock(new tutao.ctrl.UserController());
		when(uc.isExternalUserLoggedIn)().thenReturn(false);
		when(uc.isInternalUserLoggedIn)().thenReturn(true);
		tutao.locator.replace("userController", uc);
		if (!tutao.tutanota.gui) {
			tutao.tutanota.gui = {};
		}
		tutao.tutanota.gui.adjustPanelHeight = function() { };
	},
	tearDown: function() {
		tutao.locator.reset();
		tutao.locator.randomizer.addEntropy(1, 256, tutao.crypto.RandomizerInterface.ENTROPY_SRC_MOUSE);
	},
	"test that views are correctly activated and deactivated": function() {
		var view1 = JsMockito.mock(new tutao.tutanota.ctrl.View());
		var view2 = JsMockito.mock(new tutao.tutanota.ctrl.View());
		when(view1.isForInternalUserOnly)().thenReturn(false);
		when(view2.isForInternalUserOnly)().thenReturn(false);

		// activate default view1
		var vm = new tutao.tutanota.ctrl.ViewManager();
		vm.init([view1, view2], false);
		verify(view1.init)();
		verify(view2.init)();
		verify(view1, noMoreInteractions());
		verify(view2, noMoreInteractions());
		assertTrue(vm.getActiveView() != view1);
		assertTrue(vm.getActiveView() != view2);
		assertNotNull(vm.getActiveView());
		
		// select view1 -> activation
		vm.select(view1);
		verify(view1.activate)();
		verify(view1.isForInternalUserOnly)();
		verify(view1, noMoreInteractions());
		verify(view2, noMoreInteractions());
		assertEquals(view1, vm.getActiveView());
		
		// select view2 -> activation
		vm.select(view2);
		verify(view2.isForInternalUserOnly)();
		verify(view1.deactivate)();
		verify(view2.activate)();
		verify(view1, noMoreInteractions());
		verify(view2, noMoreInteractions());
		assertEquals(view2, vm.getActiveView());
		
		// select view2 -> do nothing, as this view is already selected
		vm.select(view2);
		verify(view2.isForInternalUserOnly, times(2))(); // this is the call from the test before
		verify(view1, noMoreInteractions());
		verify(view2, noMoreInteractions());
		assertEquals(view2, vm.getActiveView());
	}
});

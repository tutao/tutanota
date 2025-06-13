import o from "@tutao/otest"

o.spec("PatchMergerTest", () => {
	o.spec("Path traverse", () => {
		o.test("when_incorrect_path_is_supplied_path_traversal_throws", async () => {})
	})

	o.spec("replace on values", () => {
		o.test("apply_replace_on_root_level_value", async () => {})

		o.test("apply_replace_on_One_value_with_null_throws", async () => {})

		o.test("apply_replace_on_One_value_with_null_throws", async () => {})

		o.test("apply_replace_on_One_value", async () => {})

		o.test("apply_replace_One_values", async () => {})

		o.test("apply_replace_ZeroOrOne_values", async () => {})

		o.test("apply_replace_on_value_on_aggregation", async () => {})
	})

	o.spec("replace on aggregations", () => {
		o.test("apply_replace_on_ZeroOrOne_ET_on_aggregation", async () => {})

		o.test("apply_replace_on_entire_id_tuple_association", async () => {})

		o.test("apply_replace_on_One_aggregation_throws", async () => {})

		o.test("apply_replace_on_ZeroOrOne_aggregation_throws", async () => {})

		o.test("apply_replace_on_Any_aggregation_throws", async () => {})
	})

	o.spec("Add item", () => {
		o.test("apply_additem_on_value_throws", async () => {})

		o.test("apply_additem_on_One_id_association_throws", async () => {})

		o.test("apply_additem_on_Any_id_association", async () => {})

		o.test("apply_additem_on_Any_id_association_multiple", async () => {})

		o.test("apply_additem_on_Any_id_tuple_association", async () => {})

		o.test("apply_additem_on_Any_id_tuple_association_multiple", async () => {})

		o.test("apply_additem_on_Any_aggregation", async () => {})

		o.test("apply_additem_on_Any_id_association", async () => {})

		o.test("apply_additem_on_Any_aggregation_multiple", async () => {})

		o.test("apply_additem_on_Any_LET_on_aggregation", async () => {})
	})

	o.spec("Remove Item", () => {
		o.test("apply_removeitem_on_Any_id_association", async () => {})

		o.test("apply_removeitem_on_One_id_association_throws", async () => {})

		o.test("apply_removeitem_on_ZeroOrOne_id_association", async () => {})

		o.test("apply_removeitem_on_Any_id_tuple_association", async () => {})

		o.test("apply_removeitem_on_Any_aggregation", async () => {})

		o.test("apply_removeitem_on_Any_LET_on_aggregation", async () => {})
	})
})

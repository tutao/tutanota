# Tutanota Usage Tests

## Loading all active tests and the user's assignments

Usually done in `app.ts` or similar before rendering anything.

```typescript
import {UsageTestController} from "./UsageTestController"

// Some implementation of StorageAdapter
const storageAdapter = new StorageAdapter()
// Some implementation of PingAdapter
const pingAdapter = new PingAdapter()

const controller = new UsageTestController()

controller.pingAdapter = pingAdapter
controller.addTests(await storageAdapter.loadActiveUsageTests())
```

## Rendering variants for an existing usage test

This section assumes that active tests as well as the associated assignments for the currently logged-in user have been
loaded into the `UsageTestController` singleton.

The relevant test has two variants in this case.

```typescript
// Within some mithril view
class SomeView implements Component {
	view() {
		const controller = locator.usageTestController
		const relevantTest = controller.getTest("relevantTestId")

		return m("div", relevantTest.getVariant({
			[0]: () => m("p", "This is rendered if the user is assigned to variant 0"),
			[1]: () => m("p", "This is rendered if the user is assigned to variant 1")
		}))
	}
}
```

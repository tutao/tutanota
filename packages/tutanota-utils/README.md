## tutanota-utils

This is a collection of common utils we use across multiple projects/modules internally. As creating this module really
is just an intermediate step towards re-organising some of the dependency structure of our software, it is most likely
going to change a lot in the future and might even disappear altogether. For these reasons **we strongly discourage
anyone outside of our organisation to directly depend on this module**.

For now we only provide this as a flow-typed source module and not compiled for ES6 or CJS. The reason is that our
current tooling (flow, rollup, webstorm) will not allow us to use the compiled version directly without putting a lot of
effort into restructuring the way we build tutanota and/or changing some of our tools or losing some convenient IDE
features such as usage search.

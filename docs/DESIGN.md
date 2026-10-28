# Native design direction

The product must work on iOS and Android with native components and conventions.
Expo/React Native is accepted for the minimal mobile foundation under D014.
Platform-specific product UI and package choices remain subject to design review.
The startup shell renders an empty native root. It introduces no product flow,
component system or imported brand palette; native interaction choices belong to
each UI packet.

On 29 October 2026 the owner removes Mobbin as a prerequisite (D019). Use native
platform conventions and inspect the implementation on its actual platform.
External reference selection is optional. Keep health-app competitor names out
of documents and copy.

Gloups retains its established colors and brand assets. The
[existing canonical palette](https://github.com/GloupsApp/gloups/blob/5b708f6e378f2aea6cbfc164718110da4f625ae4/design/colors.ts)
is source evidence. Do not create a second palette in a feature. A designated
foundation task imports approved canonical tokens; no assets have moved here yet.

New designs must cover loading, empty/missing, denied, offline, stale, failure,
retry, destructive action and account changes. Workout flows also cover an
interrupted session, rest alerts and process recovery. Cycle information must
remain optional and separately controlled for coaching.

Verify light/dark appearance, large text, screen readers, reduced motion and
native input/navigation on each platform. A web mockup or screenshot from another
app is design reference, not native acceptance. The component catalog can be
introduced with real shared components; it is not implemented in this checkout.

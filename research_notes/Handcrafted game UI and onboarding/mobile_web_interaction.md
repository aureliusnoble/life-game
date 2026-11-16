# Mobile interaction design patterns and platform constraints for a game played in a phone browser (state as of November 2026)

**Read this first: how far each claim can be trusted.** Page fetching was blocked in this session for every host tried (www.w3.org, developer.mozilla.org, webkit.org, www.uxmatters.com all failed to resolve; they are outside the session's allowed network domains). No source page was opened. 27 web searches were run. Every finding below therefore carries one of two tags:

- **[S]** = taken from a search-result summary/snippet in this session. The page itself was not opened, so wording and numbers may be out of context.
- **[R]** = recalled from the researcher's prior knowledge (training data to mid-2026) of the linked page, which was not re-opened. URLs are the canonical ones as remembered. Treat exact numbers and version numbers as needing a check before they go into a decision.

Nothing here has the strength of "read on the primary page today". Where sources conflict, both are given.

---

## 1. Touch ergonomics: thumb reach, one-handed use, target sizes, spacing, placement in portrait

### Takeaway
The measured evidence says grips are mixed and shifting (about half one-handed), accuracy is best in the centre of the screen and worst at the corners and the extreme bottom edge, and the comfortable thumb area shrinks sharply for shorter thumbs. Design to 44–48 CSS px (about 9 mm) targets with roughly 8 px gaps, treat WCAG's 24 px as a legal floor only, put frequent actions in the lower-middle band rather than hard against the bottom edge, and keep the top corners for rare or reversible things.

### Cited Findings
**How people hold phones**
- Hoober's 2013 street observation: one-handed 49%, cradled (one hand holds, other touches) 36%, two-handed 15%, among people seen touching their screens. A secondary write-up gives 1,333 observations of which 780 were touching the screen. **[S]** — [Hoober, UXmatters 2013](https://uxmatters.com/mt/archives/2013/02/how-do-users-really-hold-mobile-devices.php)
- In the one-handed group, right thumb 67%, left thumb 33%. **[S]** — [Hoober, UXmatters 2013](https://uxmatters.com/mt/archives/2013/02/how-do-users-really-hold-mobile-devices.php)
- Josh Clark's reading of the same data: thumbs drive about 75% of phone interactions; "top versus bottom is more important than left versus right"; the one-handed thumb zone is smaller on phablets than on phones. **[S]** (2015 article, still the standard summary) — [A List Apart, How We Hold Our Gadgets](https://alistapart.com/article/how-we-hold-our-gadgets/)
- Hoober also reported about 90% portrait / 10% landscape use in the 2013 observations. **[R]** — [Hoober, UXmatters 2013](https://uxmatters.com/mt/archives/2013/02/how-do-users-really-hold-mobile-devices.php)
- Hoober's later position (2017 onward, and his 2021–22 book): people do not hold one way, they shift grip constantly; they prefer to look at and touch the centre of the screen; the popular coloured "thumb zone" maps are not what his data shows. **[R]** — [Hoober, Design for Fingers, Touch, and People, Part 1 (UXmatters, March 2017)](https://www.uxmatters.com/mt/archives/2017/03/design-for-fingers-touch-and-people-part-1.php); [Touch Design for Mobile Interfaces (Smashing, 2021/22)](https://www.smashingmagazine.com/printed-books/touch-design-for-mobile-interfaces/)
- The familiar green/yellow/red thumb-zone diagrams come from Scott Hurff's 2014 article, which the search summary describes as "a heat map of guesses" derived from Hoober's grip data, not a measurement. **[S]** — [Scott Hurff, How to design for thumbs in the era of huge screens (2014)](https://www.scotthurff.com/posts/how-to-design-for-thumbs-in-the-era-of-huge-screens/)

**Accuracy by screen region**
- Hoober's tapping test on a 5.1-inch phone (reported 2014): the centre of the screen was the most accurate and fastest target; for right-handed users the bottom and top-right corners were the least accurate thumb zones. **[S]** (secondary summary) — [mobiForge, Designing for Touch](https://mobiforge.com/design-development/designing-touch-thumb-and-finger-sized-design)
- Hoober's 2017 recommendation scales target size by position: about 7 mm in the centre, about 9 mm along the side edges, about 11 mm at the top, about 12 mm at the bottom. **[R]** (figures remembered from the article's accuracy diagram; verify before quoting) — [Hoober, UXmatters 2017](https://www.uxmatters.com/mt/archives/2017/03/design-for-fingers-touch-and-people-part-1.php)
- Kim and Ji (IEA 2018 proceedings, published 2019), heat maps of natural thumb movement for three thumb-length groups on 4.7–5.2 inch phones: "the lowermost region and the upper-left region of the smartphone touchscreen are not commonly included in natural thumb zone, regardless of the thumb-length groups". The long-thumb group's zone covered more than 50% of the screen; small and medium groups covered only about 30%. **[S]** — [Kim & Ji, Springer](https://rd.springer.com/chapter/10.1007/978-3-319-96071-5_50)
- An Alibaba study cited by mobiForge found the most accurate thumb targets lie on a fan-shaped arc swept by the thumb. **[S]** — [mobiForge](https://mobiforge.com/design-development/designing-touch-thumb-and-finger-sized-design)

**Minimum target sizes**
- WCAG 2.2 SC 2.5.8 Target Size (Minimum), Level AA: targets at least 24 by 24 CSS px, or smaller if spaced so that 24 px circles centred on each target do not overlap; exceptions include inline links, user-agent controls, equivalents and essential presentation. **[S]** — [W3C Understanding 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- WCAG SC 2.5.5 Target Size (Enhanced), Level AAA: 44 by 44 CSS px. **[S]** — [W3C Understanding 2.5.5](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html)
- Apple recommends a 44 by 44 pt minimum hit target for iOS. **[S]** — [TetraLogical, Foundations: target sizes](https://tetralogical.com/blog/2022/12/20/foundations-target-size/); primary: [Apple HIG, Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)
- Google recommends 48 by 48 dp for Android. **[S]** — [TetraLogical](https://tetralogical.com/blog/2022/12/20/foundations-target-size/); primary: [Android Accessibility Help, Touch target size](https://support.google.com/accessibility/android/answer/7101858)
- Material adds that 48 dp is about 9 mm physically regardless of screen density, and that targets should be separated by 8 dp or more. **[R]** — [Material Design 2, Accessibility](https://m2.material.io/design/usability/accessibility.html)
- Search summaries of several accessibility guides agree that "24 pixels is a floor, not a recommendation" and that designing to 48 satisfies WCAG AA, WCAG AAA and both platform guides at once. **[S]** (quotes not tied to one page by the summary; these are the guides returned) — [AllAccessible, 2.5.8 implementation guide](https://allaccessible.org/blog/wcag-258-target-size-minimum-implementation-guide); [TestParty, WCAG target size guide](https://testparty.ai/blog/wcag-target-size-guide)
- NN/g's standing recommendation is a physical target of at least 1 cm by 1 cm. **[R]** (2019 article; still current guidance) — [NN/g, Touch Targets on Touchscreens](https://www.nngroup.com/articles/touch-target-size/)

### Inferences
- With `<meta name="viewport" content="width=device-width">`, one CSS px corresponds to one iOS point and approximately one Android dp, so "44 pt" and "48 dp" can both be read as CSS px for layout. Use 48 CSS px as the default control size and 44 as the hard minimum; allow 56–64 px for controls on the bottom row and in top corners, following Hoober's edge penalties.
- Both Hoober's bottom-edge figure (largest target needed there) and Kim and Ji's "lowermost region is not in the natural zone" point the same way: the best band for frequent actions is the lower-middle of the screen (roughly the second-lowest fifth), not the very bottom strip. A bottom navigation bar is still reasonable because its targets are wide, but precise or small controls should not sit on the bottom edge, and on iOS the home indicator occupies that strip anyway.
- Because about a third of one-handed users are on the left thumb, and many users cradle, do not bias important controls hard to the right edge. Centre or full-width placement is safer than a corner.
- On the WebGL world view, creature and object hit areas should be padded to at least 44 px on screen at every zoom level even when the sprite is smaller, and at close zoom overlapping creatures need a disambiguation step (nearest-to-centre wins, or a small chooser), since WCAG's spacing exception cannot be met by moving creatures apart.
- The top of a tall portrait screen is out of reach for one-handed use on any current phone; use it for read-only status (season, day, currency), not for navigation.

### Gaps
- No measured study of thumb reach or accuracy on current 6.5–6.9 inch phones was found; the one search aimed at 2020s work returned only the 2013–2019 material above plus marketing-style articles asserting that reach problems are "more pronounced than ever". The research base predates today's screen sizes.
- Hoober's 2017 zone figures (7/9/11/12 mm) and the 90% portrait figure are recalled, not re-read; uxmatters.com was unreachable.
- Material 3's current wording on 48 dp and 8 dp spacing was not confirmed (the search did not surface m3.material.io); the 8 dp figure is from Material 2.
- Unsourced lead: iOS Reachability (swipe down on the bottom edge to bring the top half of the screen down) exists as a system mitigation; not checked whether it works in installed web apps.

---

## 2. Navigation and layout patterns for dense apps on phones; layering panels over a pannable world

### Takeaway
Visible navigation beats hidden navigation in the one large measured study, and the pattern that map-centred apps converge on is a full-bleed world with a small number of always-visible controls at the bottom and corners plus a non-modal bottom sheet that rests at a low "peek" height and only becomes modal when fully expanded. Evidence for the named games is thin (fan wiki and one student critique); the pattern guidance from NN/g, Apple and Material is solid.

### Cited Findings
**Visible versus hidden navigation**
- NN/g's hidden-navigation study: discoverability is "cut almost in half" by hiding a site's main navigation. **[S]** — [NN/g video summary, Hamburger Menus Hurt UX Metrics](https://www.nngroup.com/videos/hamburger-menus/); article: [NN/g, Hamburger Menus and Hidden Navigation Hurt UX Metrics](https://www.nngroup.com/articles/hamburger-menus/)
- A secondary write-up of the same study reports users were 39% slower on desktop and 15% slower on mobile with hidden navigation. **[S]** (second-hand) — [Smart Insights](https://www.smartinsights.com/digital-marketing-strategy/are-hamburger-menus-hidden-navigation-good-for-ux/)
- Detail of that study (2016; 179 participants, 6 sites): on mobile, hidden navigation was used in 57% of cases against 86% for combination (partly visible) navigation; the mobile arm did not test a fully visible bar. **[R]** for the numbers, **[S]** for the "visible condition not fully tested on mobile" caveat — [NN/g, Hamburger Menus](https://www.nngroup.com/articles/hamburger-menus/); [NN/g methodology note](https://www.nngroup.com/articles/hidden-navigation-methodology/)
- NN/g's recommendation: use visible or combination navigation; if a menu must be hidden, label it and make it look tappable. **[S]** — [NN/g, Hamburger Menus](https://www.nngroup.com/articles/hamburger-menus/)
- Luke Wroblewski's "Obvious Always Wins" (2015) collects product cases where moving from a hamburger to a visible bottom tab bar raised engagement, including Redbooth (reported +65% daily active users, +70% session time). **[R]** (old but repeatedly corroborated direction; the exact figures are remembered) — [LukeW, Obvious Always Wins](https://www.lukew.com/ff/entry.asp?1945)
- Material 3 navigation bar: for three to five top-level destinations on compact screens. **[R]** — [Material 3, Navigation bar](https://m3.material.io/components/navigation-bar/guidelines)
- Apple HIG tab bars: use for top-level sections, keep the count small on iPhone (five or fewer visible). **[R]** — [Apple HIG, Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)

**Bottom sheets and detents**
- NN/g definition and guidance: a non-modal bottom sheet stays at the bottom while the background remains usable; expandable sheets usually start non-modal in a minimised state and become modal when expanded; support Back to dismiss; do not stack sheets on sheets. Google Maps is NN/g's example of the non-modal sheet. **[S]** — [NN/g, Bottom Sheets: Definition and UX Guidelines](https://www.nngroup.com/articles/bottom-sheet/)
- Apple HIG: detents are the fixed heights where a sheet rests; on iPhone a sheet can be non-modal so people keep working in the parent view; modal sheets block the parent until dismissed. **[S]** — [Apple HIG, Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets)
- Apple's system detents are "medium" (about half height) and "large" (full height), with an optional grabber and custom detents. **[R]** — [Apple HIG, Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets)
- Material 3 distinguishes standard (non-modal, coexists with the main content) from modal bottom sheets (scrim, blocks the rest). **[R]** — [Material 3, Bottom sheets](https://m3.material.io/components/bottom-sheets/overview)
- Compose-style libraries describe a sheet as having zero, one or several detents, typically hidden, peek and fully expanded. **[S]** — [Composables, Bottom Sheets that just work](https://composables.com/blog/bottom-sheets-that-just-work)

**Other components**
- Material 3 floating action button: one per screen, for the screen's most important action. **[R]** — [Material 3, FAB](https://m3.material.io/components/floating-action-button/overview)
- Apple HIG segmented controls: keep to about five or fewer segments on iPhone. **[R]** — [Apple HIG, Segmented controls](https://developer.apple.com/design/human-interface-guidelines/segmented-controls)

**Map-centred games**
- Pikmin Bloom (fan wiki, current revision): the top two-thirds of the home screen is scrollable boxes that open other menus; the bottom third is the walking scene over a curve showing the day's steps; three buttons in the lower right lead to other menus. An older revision had a central bottom compass button (tap or swipe right to reach the map) and a bottom-left button revealing four more options, so the layout has moved between releases. **[S]** — [Pikmin Wiki, Pikmin Bloom interface](https://www.pikminwiki.com/Pikmin_Bloom_interface)
- Pokémon GO (student heuristic critique, September 2026, not a usability study): the main map's bottom navigation has a confusing hierarchy because the avatar button at bottom left is larger and more detailed than the central Poké Ball main-menu button. **[S]** — [Pratt IXD, Design Critique: Pokémon GO](https://ixd.prattsi.org/2026/09/design-critique-pokemon-go/)
- A UX Collective piece notes Pokémon GO is deliberately playable single-handed, without detailing which elements make it so. **[S]** — [UX Collective, Pokémon GO: addictive by design](https://uxdesign.cc/pokémon-go-addictive-by-design-2c89866e1e45)

### Inferences
- For six main areas (world, body editor, behaviour editor, inspector, recap, friends) a five-slot bottom bar is the ceiling by both platform guides. The world view is the natural "home" that the bar sits over; the inspector is better as a bottom sheet over the world than as a destination; the recap is better as an entry card on return than a permanent tab.
- The inspector for one creature fits the Google Maps pattern exactly: tap a creature, a non-modal sheet rises to a peek detent (name, mood, one or two key stats, one primary action) leaving the world pannable; drag or tap to a half detent for detail; full height becomes modal with a scrim and a visible close button. Follow NN/g: one sheet at a time, Back closes it.
- When a sheet is at peek or half, the camera should re-centre the selected creature in the unobscured part of the canvas, otherwise the sheet covers the thing being inspected.
- Zoom level (map, biome, close-up) is a three-state choice that pinch gestures cannot communicate; a small segmented control or stepped zoom button gives discoverability and also serves as the single-pointer alternative WCAG asks for (see section 8).
- Keep persistent overlay controls to the bottom edge and at most two corner clusters; leave the centre and the left/right edges of the canvas free (edges are also where system and browser gestures live, section 3).

### Gaps
- No teardown source was found for Clash of Clans, Pocket City, Townscaper mobile or Mini Motorways, and nothing from Game UI Database or Mobbin surfaced in search summaries. Unsourced recollection, to be treated as leads only: Pokémon GO keeps a single central bottom button that opens a full-screen radial-ish menu, with avatar bottom-left and "nearby" bottom-right and almost nothing at the top; Clash of Clans (landscape) clusters actions in the four corners and leaves the centre clear; Townscaper and Mini Motorways keep the tool palette in one edge strip and hide everything else.
- No source was found on contextual radial (pie) menus on touch, cards or carousels. Unsourced leads: the classic pie-menu result (Callahan et al., CHI 1988) found pie menus faster than linear ones; on touch the finger hides the lower half of a full ring, so touch radial menus usually fan out above the finger; carousels have known discoverability problems beyond the first item, and letting the next card peek in from the edge is the usual affordance.
- Material 3's bottom-sheet and navigation-bar pages and iOS 26's "Liquid Glass" tab bar behaviour were not re-read.
- The NN/g study did not isolate bottom placement as a variable; the case for bottom over top rests on the reach evidence in section 1 plus product anecdotes.

---

## 3. Gestures over a canvas and conflicts with browser gestures

### Takeaway
`touch-action: none` on the canvas plus Pointer Events gives the game full ownership of pan, pinch, double-tap and long-press inside the canvas on both platforms. What cannot be reliably suppressed is everything that starts at a screen edge: iOS system swipes (home indicator, top-edge pull-downs), iOS back/forward edge swipes (only partly blockable), and Android's system back gesture. Design so that nothing important starts within about 20–24 px of the left, right or bottom edge, and treat `pointercancel` as a normal event.

### Cited Findings
**What the web platform offers**
- `touch-action` values: `auto`, `none`, `pan-x`, `pan-y`, `pinch-zoom`, `manipulation`. `none` tells the browser to handle no panning or zooming on that element so all movement reaches the page as pointer events; `manipulation` allows pan and pinch but disables double-tap zoom (and the tap delay that goes with it). When the browser does take over a touch for scrolling or zooming it fires `pointercancel`. **[R]** — [MDN, touch-action](https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action)
- The consistent advice across web-game forums is to put `touch-action: none` on the canvas and implement the gestures in JavaScript; a Construct 3 troubleshooting post adds a non-passive `touchstart` listener for iOS installed-app mode. **[S]** (the summary did not attribute the general advice to one page; these are the game-engine threads it returned) — [Bugnet, Construct 3 touch events in iOS PWA mode](https://bugnet.io/blog/fix-construct3-touch-events-not-firing-ios-pwa-mode); [Babylon.js forum](https://forum.babylonjs.com/t/status-of-safari-and-firefox-mobile-touch-inputs/3328); [three.js forum](https://discourse.threejs.org/t/problems-with-running-3d-web-apps-games-on-iphones/9468)
- Safari on iOS has supported Pointer Events and the full set of `touch-action` keywords used above since iOS 13; the directional `pan-left/right/up/down` values are not supported there. **[R]** — [MDN, touch-action](https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action)
- `touch-action: manipulation` is WebKit's documented way to get immediate taps and no double-tap zoom on an element. **[R]** (2015 post; still holds) — [WebKit, More Responsive Tapping on iOS](https://webkit.org/blog/5610/more-responsive-tapping-on-ios/)
- `overscroll-behavior: contain | none` stops scroll chaining and overscroll effects. In Chrome for Android, `overscroll-behavior-y: contain` on the root disables pull-to-refresh. Supported in Chrome 63+ and Safari 16+. **[R]** — [Chrome for Developers, Take control of your scroll](https://developer.chrome.com/blog/overscroll-behavior); [MDN, overscroll-behavior](https://developer.mozilla.org/en-US/docs/Web/CSS/overscroll-behavior)
- Conflict on iOS: one developer reports that on iOS 18 "Safari acted as though none is specified everywhere" even with the property set, and another source describes the property as "useful outside Safari". **[S]** — [W3C webapps list, May 2025](https://lists.w3.org/Archives/Public/public-webapps-github/2025May/0270.html); [pqina, Blocking Navigation Gestures on iOS Safari](https://pqina.nl/blog/blocking-navigation-gestures-on-ios-13-4)
- Visual Viewport API (`window.visualViewport`: width, height, offsetTop/Left, scale, `resize` and `scroll` events) reports the part of the page actually visible when the user pinch-zooms or the on-screen keyboard opens, which is how overlays are kept in view on iOS where the keyboard does not resize the layout viewport. **[R]** — [MDN, Visual Viewport API](https://developer.mozilla.org/en-US/docs/Web/API/Visual_Viewport_API)
- Dynamic viewport units (`svh`, `lvh`, `dvh`) exist to cope with collapsing browser toolbars. **[R]** — [web.dev, The large, small, and dynamic viewport units](https://web.dev/blog/viewport-units)

**What cannot be suppressed, or only partly**
- iOS system gestures "take priority over your game's touch handling and cannot be disabled from JavaScript"; Safari fires `touchcancel` when it takes over a touch, and it should be handled as a finger-up. **[S]** (low-authority game-dev guide, but consistent with platform behaviour) — [Abratabia, iOS Safari gotchas](https://abratabia.com/mobile-web-games/ios-safari-gotchas.php)
- iOS back/forward edge swipe: "there's no proper way to disable the iOS back/forward swipe gestures using JS/CSS" (Stack Overflow answer). The known workaround is a non-passive `touchstart` listener that calls `preventDefault()` for touches starting near the screen edge (works from iOS 13.4). A commenter notes it fails if the page is still scrolling when the swipe begins, because the native behaviour wins. **[S]** — [pqina, Blocking Navigation Gestures on iOS Safari 13.4](https://pqina.nl/blog/blocking-navigation-gestures-on-ios-13-4); [W3C webapps list, May 2025](https://lists.w3.org/Archives/Public/public-webapps-github/2025May/0267.html)
- Conflict about installed (standalone) web apps on iOS: one thread says the page-back edge swipe is gone in standalone mode because there is no browser history stack, while a W3C manifest issue describes installed home-screen apps as having built-in swipe-back gestures JavaScript cannot turn off. **[S]** — [Discourse Meta, back button in iOS PWA](https://meta.discourse.org/t/back-button-in-ios-pwa/93909/19); [W3C CSS archive, 2021](https://lists.w3.org/Archives/Public/public-css-archive/2021Mar/0867.html)
- A 2021 W3C proposal to add a `touch-action` option that disables built-in swipe navigation for home-screen apps exists; no evidence was found that it shipped. **[S]** — [W3C CSS archive, 2021](https://lists.w3.org/Archives/Public/public-css-archive/2021Mar/0867.html)
- A Phaser forum thread reports that turning off touch handling to stop pull-down also disables swipe-to-dismiss, illustrating that the controls are coarse. **[S]** — [Phaser forum](https://phaser.discourse.group/t/swipe-to-dismiss-gesture-disabled-on-ios/14342)

**iOS 26 Safari viewport and bottom-bar problems (browser tab, not installed)**
- Developers report that in iOS 26 Safari a `position: fixed` element at the bottom renders incorrectly when the bottom address bar hides, and that fixed overlays "never cover the bottom part anymore" under the new glass toolbar. **[S]** — [Apple Developer Forums 800798](https://developer.apple.com/forums/thread/800798); [Shopify community](https://community.shopify.dev/t/cart-drawer-shows-page-under-bottom-bar-background-scroll-how-to-fix-ios-safari-iphone-ios-26/22737)
- A WebKit bug states that neither `100vh`, `100dvh`/`svh` nor `-webkit-fill-available` resize to exclude that region. **[S]** (the summary did not say which bug; it is one of the iOS 26 viewport bugs returned) — WebKit bugs [300965](https://bugs.webkit.org/show_bug.cgi?id=300965), [292603](https://bugs.webkit.org/show_bug.cgi?id=292603), [306465](https://bugs.webkit.org/show_bug.cgi?id=306465), [301108](https://bugs.webkit.org/show_bug.cgi?id=301108), [300232](https://bugs.webkit.org/show_bug.cgi?id=300232)
- Safari 26.1 release notes are cited as fixing "a bottom gap appearing on layouts with viewport-sized fixed containers on iOS". **[S]** (cited in a forum thread, not checked against Apple's notes) — [Apple Developer Forums 800798](https://developer.apple.com/forums/thread/800798)
- With `viewport-fit=cover`, iOS 26 Safari uses the background colour of fixed-position elements to tint the top and bottom browser chrome. **[S]** — [Ben Frain, iOS 26 Safari theme colour and fixed elements](https://benfrain.com/ios26-safari-theme-color-tab-tinting-with-fixed-position-elements/)
- `visualViewport.offsetTop` is reported not to reset to 0 after the keyboard is dismissed in iOS 26, misplacing fixed headers and footers; Apple's forum also notes fixed headers and footers can be unstable under the new tab-layout options. **[S]** (the first report was not attributed to a specific page; it is among the same set of forum threads and WebKit bugs) — [Apple Developer Forums 799143](https://developer.apple.com/forums/thread/799143); [Apple Developer Forums 798598](https://developer.apple.com/forums/thread/798598)

### Inferences
- Recipe that follows from the above: app shell `position: fixed; inset: 0; overflow: hidden` so the document never scrolls; `touch-action: none` on the canvas; `touch-action: pan-y` plus `overscroll-behavior: contain` on scrolling HTML panels; `touch-action: manipulation` on buttons; `overscroll-behavior: none` on `html, body` (effective on Android, unreliable on iOS). Use Pointer Events with `setPointerCapture`, and end any drag or pan cleanly on `pointercancel`.
- Because edge swipes cannot be relied on to be blocked, keep an inert margin of roughly 20–24 px at the left and right canvas edges for gesture starts: trays, drag handles and reorder grips should not sit flush to a side edge, and a world pan that begins at the edge may be stolen by the browser.
- Pull-to-refresh is a browser-tab problem on iOS (the non-scrolling shell plus `touch-action: none` on the canvas removes the trigger over the canvas; HTML panels at scroll-top remain exposed) and is solvable on Android with `overscroll-behavior`. The installed PWA is the more controllable target on both platforms, which is a practical argument for nudging friends to install.
- Android's system back gesture (edge swipe from either side) cannot be intercepted as a gesture; it arrives as history navigation. Model open sheets and editors as history entries so Back closes them, which is also what NN/g asks for bottom sheets. On iOS standalone this same history makes edge-swipe-back available, so the two platforms can behave alike.
- Long-press needs to be built from a timer on `pointerdown` (about 400–500 ms, cancelled by a few px of movement), with `user-select: none`, `-webkit-user-select: none` and `-webkit-touch-callout: none` on the game surface to stop the iOS selection loupe and callout. Long-press is undiscoverable, so it should only ever be a shortcut for something also reachable by tap.
- Double-tap zoom on the canvas is safe to implement once `touch-action: none` is set, but it delays single-tap recognition if the game waits to see whether a second tap follows; prefer acting on the first tap immediately and treating a quick second tap as an additional zoom step.
- In iOS 26–27 browser-tab mode, do not trust a bottom-fixed bar: test with Safari's toolbar both expanded and collapsed, and pad with `env(safe-area-inset-bottom)`. In standalone mode the same padding clears the home indicator.

### Gaps
- Whether `overscroll-behavior: none` on the root reliably prevents rubber-banding and pull-to-refresh in iOS 26/27 Safari tabs is unresolved: the documentation says supported since Safari 16, one field report says it had no effect on iOS 18.
- Whether edge-swipe back exists in iOS standalone web apps in iOS 26/27 was not settled by sources (two contradict). Recollection, unverified: standalone apps gained back/forward swipe in iOS 12.2 and it is active whenever the app has history entries.
- No authoritative statement found on whether the status of the bugs listed (300965, 292603, 306465, 301108) changed in Safari 27.
- Unsourced leads: iOS Safari ignores `user-scalable=no` in browser tabs (page pinch-zoom remains possible on HTML regions without `touch-action`); iOS Safari historically does not fire `contextmenu` on long-press while Android Chrome does; the HTML Drag and Drop API works on iPhone since iOS 15 but needs a long-press to lift, which is why games use pointer events instead.
- MDN pages on `touch-action`, `overscroll-behavior` and the Visual Viewport API could not be opened; their content above is recalled.

---

## 4. Drag-and-drop editors on touch: drag versus tap-to-place, occlusion, snapping, undo

### Takeaway
Dragging on touchscreens is measurably more error-prone than tapping, the finger hides the thing being placed and the place it is going, and WCAG 2.2 AA now requires a non-drag way to do anything that only needs a start and end point. The safe design is tap-to-select then tap-to-place as the baseline, with drag as the faster layer on top, generous snap targets, a dragged item drawn offset above the finger, drop highlights that extend beyond the finger, and undo.

### Cited Findings
**Evidence on drag versus tap**
- A study comparing point-click and point-drag-drop tasks reported errors rising from 8% to 36% when moving from click to drag-and-drop. **[S]** (the search summary did not say which of its results this came from; candidates are the Springer and UPV papers it listed) — [Springer chapter](https://link.springer.com/content/pdf/10.1007/978-3-319-07446-7_7.pdf); [UPV repository paper](https://riunet.upv.es/bitstream/10251/64752/3/VersionAutor.pdf)
- Children aged 7 and up "experience difficulty with drag-and-drop interactions on both desktops and mobile devices". **[S]** — [Anthony et al., 2013](https://lisa-anthony.com/wp-content/uploads/2013/04/anthony-et-al-jpuc2013.pdf)
- Older adults (24 participants aged 65–86, 2015) made fewer drag-and-drop accuracy errors when the required drop precision was lower; a related study compared 16 novice (mean age 74) and 8 experienced older adults on drag-and-drop puzzles on phones and tablets. **[S]** — [Improving accessibility of tactile interaction for older users (Univ. of Limerick record)](https://pure.ul.ie/en/publications/improving-accessibility-of-tactile-interaction-for-older-users-lo/); [Ease-of-Use of Tactile Interaction for Novice Older Adults (HAL)](https://hal.archives-ouvertes.fr/hal-01334708)

**Occlusion**
- "On small and large touch displays a finger occlusion problem makes acquiring small targets difficult"; the standard remedies are call-outs, offset cursors and zooming lenses. **[S]** — [US patent 8531410, Finger occlusion avoidance](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/8531410); survey: [Böhme, Overcoming Occlusion Problems (LMU)](https://www.medien.informatik.uni-muenchen.de/lehre/ss15/ps/papers/Boehme-OvercomingOcclusionProblems.pdf)
- LinearDragger (CHI 2014) is a one-finger technique for picking among small clustered targets that avoids occlusion without adding visual elements. **[S]** — [LinearDragger paper](https://www.cs.cityu.edu.hk/~rynson/papers/sigchi14a.pdf)
- Practical report from the Castro podcast app's iOS drag-and-drop work: drop targets on tab icons were hidden by the finger, so the team made the drop highlight expand beyond the bounds of the button. **[S]** — [Castro, Design Details: Drag and Drop](https://cur.at/ZfQ5UKm?m=web)
- Microsoft's touch guidance: a moving object should stick to the user's finger; "short press and drag to move" is a standard touch behaviour. **[S]** — [Microsoft Learn, Touch interactions](https://learn.microsoft.com/en-us/windows/apps/develop/input/touch-interactions)

**Accessibility requirement**
- WCAG 2.2 SC 2.5.7 Dragging Movements (AA): any function that uses dragging where only the start and end points matter must also be operable by a single pointer without dragging, unless dragging is essential. Accepted alternatives: tap source then tap destination, move up/down buttons, a "move to" menu, direct value entry. **[S]** — [W3C Understanding 2.5.7](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements); technique [G219](https://www.w3.org/WAI/WCAG22/Techniques/general/G219)
- Swipes and other path-based or multi-finger gestures fall under SC 2.5.1 Pointer Gestures rather than 2.5.7. **[S]** (stated by one of the 2.5.7 explainers returned; the W3C Understanding page makes the same distinction, **[R]**) — [W3C Understanding 2.5.7](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements); [TestParty, WCAG dragging movements guide](https://testparty.ai/blog/wcag-dragging-movements-guide)

### Inferences
- Body editor (parts dragged onto a body): support both paths. Tap a part in the tray to "arm" it, then tap an attachment point on the body (with all valid points lit); or drag from the tray. During a drag, draw the part lifted about 40–60 px above the touch point so the finger does not cover it, and snap to the nearest valid socket inside a generous radius, showing a ghost of where it will land. The older-adult result (looser drop precision, fewer errors) supports large snap radii for everyone.
- Sockets and drop highlights should be drawn larger than the finger (a halo beyond roughly 44 px) so the highlight is visible around the fingertip, as in the Castro case.
- Behaviour editor (sentence-like blocks reordered): give every block a visible drag handle that starts a reorder immediately, with the rest of the row scrolling normally, and provide move-up/move-down or "move to position" controls from the block's menu to satisfy 2.5.7. Insert-at-caret (tap a gap, then tap a block from the palette) is the tap equivalent of drag-from-palette.
- Fine positioning on a phone is better done by constraint than by precision: discrete sockets, rotation in steps, mirrored pairs placed together. Where continuous adjustment is needed, a slider or nudge buttons away from the object avoids the occlusion problem altogether.
- Undo should be a persistent, always-visible control in editors, since drops will sometimes land wrong; a drop released outside any valid target should return the part to the tray, not delete it.
- Auto-scroll or auto-pan when a drag nears the canvas edge is needed if the body is larger than the visible area, but the 20–24 px edge margin from section 3 still applies.

### Gaps
- No NN/g article on touch drag-and-drop was surfaced by search, and no teardown or documentation was found for Canva, Figma mobile, Procreate, GarageBand, Toca Boca apps, Spore Origins, LEGO builder apps or ScratchJr. None of the claims a report might want to make about how those apps handle placement can be sourced from this session.
- Unsourced recollection, as leads only: ScratchJr uses a category-coloured palette row of large blocks dragged into a single horizontal script strip, with snap-together and drag-off-to-delete, and was designed for tablets first; Procreate and Figma rely on two-finger tap for undo and three-finger tap for redo; iOS's own text-selection loupe is the canonical "show what is under the finger" pattern; the research prototype behind call-outs is Vogel and Baudisch's "Shift" (CHI 2007).
- The 8% versus 36% error figure could not be tied to a specific paper, population or device from the summary alone.
- No direct evidence found comparing tap-to-place and drag for adults on phones in creative or construction tasks.

---

## 5. Progressive web app capabilities and limits in 2026 (iOS Safari and Android Chrome)

### Takeaway
As of November 2026 the current iOS is 27 with Safari 27 (a 27.1 exists); installed web apps on iOS can do push, badges, wake lock and WebGPU, but still have no Vibration API, no background sync, no fullscreen on iPhone, no orientation lock and no install prompt, and installing takes several taps. Android Chrome supports essentially the whole list. Plan the game so that it is fully playable in a browser tab, better when installed, and never dependent on haptics, background work or fullscreen.

### Cited Findings
**Versions and recent releases**
- Safari 27 shipped with iOS 27 in mid-September 2026 (one report gives 14 September); a secondary source counts 83 new features and 844 fixes, against 58 and 525 announced at the June beta. Highlights reported: the HTML `<model>` element on iOS, customizable `<select>`, transform-aware anchor positioning, WebGPU additions, a Safari MCP server for developers. **[S]** — [Cinevva news, 17 Sept 2026](https://app.cinevva.com/news/2026-09-17-safari-27-model-element-webgpu-clip-planes); [WWDC26 session 204, What's new in WebKit for Safari 27](https://developer.apple.com/videos/play/wwdc2026/204/); [WebKit, News from WWDC26](https://webkit.org/?p=17967)
- WebKit's news index lists a "WebKit Features for Safari 27.1" post. **[S]** (title only; contents not seen) — [WebKit blog, News](https://webkit.org/blog/category/news/)
- A third-party timeline states "iOS 27, September 2026: no new features for Home Screen web apps" and "iOS 26.2, December 2025: other browser engines allowed in Japan". **[S]** (unverified against Apple or Firtman) — [State of PWAs on iOS (blog)](https://2f2022c1-astro-blog.laromierre.workers.dev/posts/the-state-of-progressive-web-apps-on-ios-limitations-and-workarounds)
- Chrome 146 was the current Chrome release in late February to March 2026 (dated release post). **[S]** — [Chrome for Developers, New in WebGPU 146](https://developer.chrome.com/blog/new-in-webgpu-146)
- The living reference for what iOS supports for web apps is Maximiliano Firtman's compatibility notes. **[S]** — [firt.dev, iOS PWA Compatibility](https://firt.dev/notes/pwa-ios/)

**Install, standalone display, safe areas**
- iOS 26 (September 2025): every site added to the Home Screen from Safari opens as a web app by default, even with no manifest; the user can turn off an "Open as Web App" toggle to get a plain bookmark. Icons and splash still depend on the developer's configuration. **[S]** — [MacRumors, iOS 26 Safari guide](https://www.macrumors.com/guide/ios-26-safari-features/); [WebKit, News from WWDC25](https://webkit.org/blog/16993/news-from-wwdc25-web-technology-coming-this-fall-in-safari-26-beta/)
- In iOS 26's default compact tab layout, installing needs the ellipsis button, then Share, then Add to Home Screen; a developer counts "at least five taps" and calls it a step back. **[S]** — [Apple Developer Forums 801602](https://developer.apple.com/forums/thread/801602); [Michael Tsai, 3 Oct 2025](https://mjtsai.com/blog/?p=49472)
- iOS has no `beforeinstallprompt` or other programmatic install prompt; the app must show its own instructions. Android Chrome fires `beforeinstallprompt` for installable sites and installs as a WebAPK. **[R]** — [firt.dev](https://firt.dev/notes/pwa-ios/); [web.dev, install criteria](https://web.dev/articles/install-criteria)
- On iOS an installed web app has storage and cookies separate from Safari, so someone who signed in in the browser is signed out in the installed app. **[R]** — [firt.dev](https://firt.dev/notes/pwa-ios/)
- Drawing under the notch and home indicator uses `viewport-fit=cover` with `env(safe-area-inset-top/right/bottom/left)`. **[R]** (2017 post; still the mechanism) — [WebKit, Designing Websites for iPhone X](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)
- A WebKit report says `viewport-fit=cover` "does not work correctly" in iOS 26. **[S]** (bug number not given in the summary; one of the iOS 26 viewport bugs returned, e.g. [300523](https://bugs.webkit.org/show_bug.cgi?id=300523) or [300232](https://bugs.webkit.org/show_bug.cgi?id=300232))
- EU: Apple announced removal of standalone web apps in the EU for iOS 17.4, then reversed and kept them; sources in search still disagree, the reversal being the later report. **[S]** — [MagicBell, PWA iOS limitations guide](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)

**Notifications, badges, background**
- Web Push on iOS and iPadOS arrived in 16.4 (March 2023) together with the Badging API; it works only for web apps added to the Home Screen, and permission must be requested in response to a user tap. **[S]** — [MagicBell guide](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide); primary: [WebKit, Web Push for Web Apps on iOS and iPadOS](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)
- iOS push uses the standard Push API with a service worker and VAPID; every push must show a notification (no silent push). **[R]** — [WebKit, Web Push for Web Apps](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)
- Declarative Web Push (notification described in the push payload, no service worker code needed to display it) shipped in Safari 18.4. **[R]** — [WebKit, Meet Declarative Web Push](https://webkit.org/blog/16535/meet-declarative-web-push/)
- Badging: iOS 16.4+ for installed web apps; one 2024–2026 comparison table rates it "limited". Chrome on Android does not implement `setAppBadge` (Android shows its own notification dot). **[S]** for iOS, **[R]** for Android — [MagicBell guide](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide); [Chrome for Developers, Badging API](https://developer.chrome.com/docs/capabilities/web-apis/badging-api)
- Background Sync and Periodic Background Sync are Chromium-only; Safari supports neither. Periodic sync on Android needs an installed app and sufficient engagement. **[R]** — [MDN, Background Synchronization API](https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API)

**Storage**
- A Home Screen web app gets the same per-origin quota as the browser, around 60% of disk space; older Safari versions gave 1 GiB. **[S]** — [MDN, Storage quotas and eviction criteria](https://developer.mozilla.org/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- The quota model dates from Safari 17.0: up to 60% of disk per origin for Safari and Home Screen web apps (15% for other WebKit apps), an 80% overall cap, least-recently-used eviction when over, and `navigator.storage.persist()` granted by heuristics such as the site being opened as a Home Screen web app. **[R]** — [WebKit, Updates to Storage Policy (2023)](https://webkit.org/blog/14403/updates-to-storage-policy/)
- The 7-day cap on script-writable storage (2020) applies to sites in Safari not visited for seven days of browser use; Apple clarified that Home Screen web apps "are not part of Safari" and have their own days-of-use counter that only advances when the app is used. **[S]** — [The Register, March 2020](https://www.theregister.com/2020/03/26/apple_relax_were_not_totally/); primary: [WebKit, Full Third-Party Cookie Blocking and More](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)
- Reports still exist of Home Screen apps losing data after seven days, and a WebKit bug narrows what should be capped there to script-created cookies. **[S]** — [WebKit bug 237350](https://bugs.webkit.org/show_bug.cgi?id=237350); [Apple Developer Forums 710157](https://developer.apple.com/forums/thread/710157)
- Conflict on `navigator.storage.persist()` on iOS: MDN presents it as the route to eviction protection; one iOS-limitations page says requests "are always denied"; another says it is "not fully supported" and that installed PWAs can still be evicted under low disk space. **[S]** — [MDN](https://developer.mozilla.org/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria); [Swoff, iOS Safari limitations](https://swoff.netlify.app/docs/concepts/ios-safari-limitations)
- Chrome: up to about 60% of disk per origin, best-effort by default, `persist()` auto-granted by engagement heuristics (installed, notifications granted, bookmarked). **[R]** — [web.dev, Storage for the web](https://web.dev/articles/storage-for-the-web)

**Haptics and audio**
- `navigator.vibrate()` is not supported in Safari on iOS; one report says the function exists but always returns false; a 2026 source says Apple has given no indication it will support the Vibration API. **[S]** (statements not tied to one page by the summary; these are the pages returned) — [Bugnet, vibrate API not available on iOS Safari](https://bugnet.io/blog/fix-web-game-vibrate-api-not-available-ios-safari); [Software Mansion, Haptic feedback on the web](https://swmansion.com/blog/haptic-feedback-on-the-web-why-the-web-deliberately-refuses-to-be-as-tactile-as-native-apps); [web-haptics browser support](https://www.mintlify.com/lochie/web-haptics/advanced/browser-support)
- Workaround: a hidden `<input type="checkbox" switch>` with a `<label>`; programmatically clicking the label makes Safari play the system switch haptic. Sources date the behaviour to Safari 17.4 or iOS 18.0. The haptic is fixed (no control over strength or pattern). Libraries: `ios-haptics`, WebHaptics. **[S]** — [ios-haptics (npm)](https://npmjs.com/package/ios-haptics); [Ionic issue 29942](https://github.com/ionic-team/ionic-framework/issues/29942)
- A WebKit bug asks that this haptic require user activation, i.e. the loophole may be narrowed. **[S]** — [WebKit bug 285120](https://bugs.webkit.org/show_bug.cgi?id=285120)
- The Vibration API works in Chrome on Android (after a user gesture). **[R]** — [MDN, Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API)
- Web Audio on both platforms starts suspended until a user gesture; the standard pattern is to create or `resume()` the `AudioContext` inside the first tap handler. **[R]** — [Chrome for Developers, Autoplay policy](https://developer.chrome.com/blog/autoplay); [MDN, Web Audio best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)

**Screen and device**
- Screen Wake Lock: Safari 16.4+, but it did not work in installed Home Screen web apps until iOS 18.4, when WebKit bug 254545 was fixed. Some compatibility mirrors still show it as broken. **[S]** — [WebKit bug 254545](https://bugs.webkit.org/show_bug.cgi?id=254545); [firt.dev](https://firt.dev/notes/pwa-ios/). Chrome has had it since version 84. **[R]** — [MDN, Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API)
- Fullscreen API on iOS: listed as "8.0 (iPad only)", i.e. not available for arbitrary elements on iPhone. **[S]** — [firt.dev](https://firt.dev/notes/pwa-ios/). Android Chrome supports it, and manifest `display: fullscreen`. **[R]** — [caniuse, Fullscreen](https://caniuse.com/fullscreen)
- Orientation lock: `screen.orientation.lock()` and the manifest `orientation` member are not honoured on iOS; both work on Android Chrome (lock requires fullscreen or an installed app). **[R]** — [MDN, ScreenOrientation.lock()](https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/lock); [firt.dev](https://firt.dev/notes/pwa-ios/)
- Web Share (`navigator.share`) is available on iOS Safari and Android Chrome, including file sharing on recent versions, and must be called from a user gesture. **[R]** — [MDN, Navigator.share()](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share)

**Graphics and transitions**
- WebGL 2 is available on both: Safari since 15, Chrome for Android for much longer. **[R]** — [caniuse, WebGL 2](https://caniuse.com/webgl2)
- WebGPU: shipped in Safari 26 on iOS, iPadOS, macOS and visionOS (September 2025). **[S]** — [WebKit, News from WWDC25](https://webkit.org/blog/16993/news-from-wwdc25-web-technology-coming-this-fall-in-safari-26-beta/); [App Developer Magazine](https://appdevelopermagazine.com/webgpu-in-ios-26/amp/)
- WebGPU on Android: enabled by default from Chrome 121 on Android 12+ with Qualcomm and Arm GPUs; Chrome 146 (early 2026) added a compatibility mode for older GPUs via OpenGL ES 3.1, starting with Android. **[S]** — [Chrome, New in WebGPU 121](https://developer.chrome.com/blog/new-in-webgpu-121); [Chrome, New in WebGPU 146](https://developer.chrome.com/blog/new-in-webgpu-146)
- View Transitions, same-document: Chrome 111, Safari 18, Firefox 144; became Baseline Newly Available when Firefox 144 shipped on 14 October 2025. **[S]** — [web.dev, same-document view transitions are Baseline](https://web.dev/blog/same-document-view-transitions-are-now-baseline-newly-available)
- View Transitions, cross-document: Chrome 126, Safari 18.2; Firefox partial from 144. **[S]** — [Chrome for Developers, View Transition API](https://developer.chrome.com/docs/web-platform/view-transitions); [caniuse, cross-document view transitions](https://caniuse.com/cross-document-view-transitions)

### Inferences
- Target baseline for a friends-only game in late 2026: iOS 18.4+ (wake lock in installed apps, declarative push, view transitions, `getCoalescedEvents`) and Chrome on Android 12+. Render with WebGL 2; WebGPU is now present on both platforms but coverage on mid-range and older Android is still uneven, so it is an optional path, not a requirement.
- Since iPhone has neither fullscreen nor orientation lock, the portrait layout must simply tolerate rotation (a "rotate back" notice or a letterboxed portrait frame) and the browser-tab layout must work with Safari's toolbar visible. Standalone installation is the only way to get a chrome-free screen on iPhone.
- Push on iOS is only possible after install, so the natural order for an iPhone friend is: play in the tab, be shown how to add to Home Screen (custom illustrated steps, because the path is buried and there is no prompt), then be asked about notifications inside the installed app after a tap. Because installed-app storage is separate from Safari's, account state must be server-side with an easy re-entry (link or code), or the friend's progress appears to vanish at install.
- Treat local storage as a cache. With server-held game state, eviction on either platform costs a re-download, not a save.
- Haptics: use `navigator.vibrate` on Android behind a setting; on iOS either do without or use the switch trick only inside real tap handlers and expect it to break. Never signal anything by haptics alone.
- Audio must be unlocked by the first tap (a "tap to enter" on the title or recap card does it), and should default to quiet; many phones will be on silent.
- By release cadence from Chrome 146 in March 2026, stable Chrome in November 2026 is in the low-to-mid 150s; nothing found suggests a capability relevant here changed after 146.

### Gaps
- webkit.org could not be opened, so the Safari 27 and 27.1 feature lists were not read; whether anything in them touches Home Screen web apps, haptics, fullscreen on iPhone or orientation lock is unknown. The only statement found ("no new features for Home Screen web apps" in iOS 27) is from an unverified third-party table.
- The exact stable Chrome version number in November 2026 was not confirmed.
- Whether the switch-haptic trick still fires from programmatic clicks in Safari 26 and 27 was not covered by any result.
- Whether `navigator.storage.persist()` is granted to installed web apps on current iOS is contradicted between sources and not resolved.
- Fullscreen on iPhone and orientation-lock status rest on Firtman's table as summarised by search and on recollection; not checked for iOS 26/27.
- No measured WebGL/WebGPU performance data for mid-range phones was found; the query on Chrome returned only availability.
- Not researched for lack of budget: Web Audio and the iPhone silent switch (recollection: Web Audio is muted by the ringer switch unless the audio session type is changed), iOS Low Power Mode frame-rate throttling, and background suspension behaviour of installed web apps.

---

## 6. Performance of HTML UI over a WebGL canvas

### Takeaway
An HTML/CSS layer over a WebGL canvas is a mainstream pattern (PixiJS itself uses a DOM overlay for accessibility), and its main costs are known: backdrop blur over a constantly changing canvas, too many or too large composited layers, layout work during animation, and input handlers that block. Sources found are mostly forum-level; the rules of thumb below are consistent but not benchmarked for this case.

### Cited Findings
- Backdrop blur cost grows with blur radius; reported effects are janky scrolling on slower devices and battery drain. **[S]** — [OpenReplay, blurred backgrounds with backdrop-filter](https://blog.openreplay.com/creating-blurred-backgrounds-css-backdrop-filter/)
- A Babylon.js forum thread reports a single `backdrop-filter: blur(5px)` navbar over a 3D scene as a noticeable CPU cost. **[S]** — [Babylon.js forum](https://forum.babylonjs.com/t/any-tricks-for-reducing-photodome-cpu-usage/18495)
- One article's rule of thumb is that mobile devices handle about three to five simultaneous blur effects; it is not a benchmark. **[S]** — [DigitalThrive, backdrop-filter guide](https://www.digitalthriveai.com/en-us/resources/web-development/the-backdrop-filter-css-property/)
- Firefox has had WebGL-plus-blur anomalies in both directions: a closed bug on large slowdowns when blurring an element containing a WebGL canvas, and an open bug (filed against Firefox 120) where WebGL was slow unless a backdrop blur was present. **[S]** (Firefox is not a target here, but it shows the interaction is unpredictable) — closed: [Mozilla bug 925025](https://bugzilla.mozilla.org/show_bug.cgi?id=925025) or [1498291](https://bugzilla.mozilla.org/show_bug.cgi?id=1498291) (summary did not say which); open: [Mozilla bug 1867791](https://bugzilla.mozilla.org/show_bug.cgi?id=1867791)
- Some developers replace CSS blur with a Gaussian blur shader inside the WebGL pipeline; a library vendor claims 44–55% lower CPU use than CSS `backdrop-filter` on an iPhone and a laptop. **[S]** (vendor claim, unverified) — [macos-tahoe.com comparison](https://macos-tahoe.com/blog/liquid-glass-performance-comparison/)
- PixiJS's accessibility system is "a DOM-based overlay" placed over the canvas, i.e. the engine's own answer to semantics is HTML over WebGL. **[S]** — [PixiJS 8 guide, Accessibility](https://pixijs.com/8.x/guides/components/accessibility)
- Animate only `transform` and `opacity` to stay on the compositor; each promoted layer costs memory, which matters most on mobile. **[R]** — [web.dev, Stick to compositor-only properties and manage layer count](https://web.dev/articles/stick-to-compositor-only-properties-and-manage-layer-count)
- Avoid forced synchronous layout (reading layout properties after writing styles in the same frame). **[R]** — [web.dev, Avoid large, complex layouts and layout thrashing](https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing)
- Large DOMs slow style and layout; Lighthouse warns above roughly 800 nodes and flags above roughly 1,400. **[R]** — [web.dev, DOM size and interactivity](https://web.dev/articles/dom-size-and-interactivity)
- Responsiveness target: Interaction to Next Paint of 200 ms or less is "good". **[R]** — [web.dev, INP](https://web.dev/articles/inp)

**Input latency**
- Chrome delivers continuous input (pointer and touch moves) aligned to animation frames, at most once per frame; `getCoalescedEvents()` exposes the intermediate samples. **[S]** — [Chrome for Developers, Aligning input events](https://developer.chrome.com/blog/aligning-input-events)
- `getCoalescedEvents()` reached Safari on iOS in 18.2; Flutter had to work around wrong `pointerId` values in coalesced events on that version. **[S]** — [Flutter engine PR 56719](https://github.com/flutter/engine/pull/56719)
- `pointerrawupdate` (un-aligned, high-frequency pointer events) is not supported in Safari or Safari on iOS through at least 26.3, and is not Baseline. **[S]** — [caniuse, pointerrawupdate](https://caniuse.com/mdn-api_element_pointerrawupdate_event)
- Feature-detect and fall back: `'getCoalescedEvents' in event ? event.getCoalescedEvents() : [event]`. **[S]** — [Nutrient, Smoother interactions with getCoalescedEvents](https://www.nutrient.io/blog/using-getcoalescedevents/)

### Inferences
- Panels over the world should be opaque or use a flat translucent fill; reserve live backdrop blur for at most one small element, or fake it by blurring a downsampled copy of the frame inside the WebGL renderer when a sheet opens. A blurred panel over a canvas that redraws every frame forces the blur to be recomputed every frame.
- Structure the overlay as one full-screen container with `pointer-events: none`, with `pointer-events: auto` only on actual panels and buttons, so the canvas receives every touch that does not hit UI and no hit-testing code is duplicated.
- Animate sheets and trays with `transform: translateY()` rather than `height` or `top`; give sliding panels `contain: layout paint` so their internal changes do not invalidate the rest of the overlay; keep long lists (friends, recap entries, part trays) short or virtualised.
- Per-frame HUD that tracks things in the world (name tags over creatures, selection rings) is cheaper drawn in the canvas than as DOM nodes repositioned every frame; DOM is the right tool for text-heavy, infrequently changing UI (inspector, editors, recap, social).
- For a pan/zoom world, once-per-frame pointer moves are sufficient; coalesced events matter only if the game adds freehand drawing. Do camera math inside `requestAnimationFrame`, not inside the event handler, and keep handlers free of layout reads.
- On mid-range phones, rendering the canvas at a device pixel ratio capped around 2 (not 3 or more) and pausing or slowing the world render while a full-height modal sheet covers it are the two cheapest savings.

### Gaps
- No engineering write-up from Playco, Poki, NYT Games, Photopea or Figma surfaced; the one query on this topic returned mostly CSS tutorial sites and bug trackers. The web.dev guidance is recalled, not re-read.
- No measurements found for the specific case (DOM overlay over a 60 fps WebGL canvas on mid-range Android or iPhone), nor for the cost of `backdrop-filter` in Safari 26/27 specifically, where the system's own glass effects are heavy users of blur.
- Not found: status of the `desynchronized` canvas context hint (recollection: Chromium-only) and of touch listeners being passive by default in Safari.
- Unsourced lead: Safari throttles `requestAnimationFrame` to about 30 fps in iOS Low Power Mode, which the world simulation's frame pacing should tolerate.

---

## 7. Returning-user and check-in patterns

### Takeaway
The dependable findings are that permission prompts shown before any interaction are almost always refused (and browsers now punish sites for it), that a "welcome back" summary is the core return hook in idle-style games, and that streaks work through loss aversion, which is exactly what makes them feel like pressure. Evidence quality here is weak: mostly vendor and design blogs, with the key academic papers cited second-hand.

### Cited Findings
**Notification permission timing**
- A Mozilla study, as reported by Notificare: prompts shown on page load with no interaction were accepted about 2% of the time, against about 24% when the page offered interaction and an explanation first; only about 11% of sites waited for an interaction. **[S]** (second-hand; original Mozilla report not located) — [Notificare, Web Push do's and don'ts (2020)](https://notificare.com/blog/2020/04/06/Web-Push-Notifications-dos-and-donts/)
- Mozilla's own 2019 telemetry: about 99% of notification prompts went unaccepted and 48% were actively denied, which led Firefox to require a user gesture before a site may show the prompt. **[R]** — [Mozilla, Restricting notification permission prompts in Firefox (Nov 2019)](https://blog.mozilla.org/futurereleases/2019/11/04/restricting-notification-permission-prompts-in-firefox/)
- Chrome 80 (2020) introduced a quieter permission UI that is applied automatically to users who usually block and to sites with low acceptance rates. **[R]** — [Chromium blog, Introducing quieter permission UI for notifications](https://blog.chromium.org/2020/01/introducing-quieter-permission-ui-for.html)
- Practitioner guidance: never trigger the browser prompt on load; wait for demonstrated interest and use a soft pre-prompt that explains the value before the real dialog. **[S]** — [Girard Media, notification permission strategy](https://girardmedia.com/blog/notification-permission-opt-in-strategy); long-standing primary guidance **[R]**: [web.dev, Permission UX](https://web.dev/articles/push-notifications-permissions-ux)
- A vendor report (iZooto) says two-step custom prompts get higher acceptance, with wide spread between sites; the selection of sites is not explained. **[S]** — [iZooto, Permission UX report](https://www.izooto.com/chrome-notification-permission-ux-report)
- Specific uplift numbers circulating in blogs ("2–3x higher acceptance with contextual timing", "38% to 62% with priming") name no study. **[S]** — [Girard Media](https://girardmedia.com/blog/notification-permission-opt-in-strategy)
- On iOS the prompt can only be shown in an installed Home Screen web app and only in response to a tap. **[S]** — [MagicBell guide](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)

**"While you were away"**
- Idle-game design guides call the welcome-back screen "one of the most satisfying moments in an idle game" and offline progress "the hook that brings players back". **[S]** — [Game bootcamp module 34, idle/incremental](https://seanking11.github.io/gamebootcamp/modules/34-idle-incremental); [Abratabia, idle clicker games](https://abratabia.com/game-genres/idle-clicker-game.php)
- Offline progress is normally capped; one design piece calls the cap "a design lever, not a technical limit" and a devlog uses a 24-hour wall-clock cap so that long absences do not break the economy; another game lets the player choose on return whether to keep the offline progress. **[S]** (the summary did not tie each statement to one page; these are the design essay and devlogs it returned) — [Offline progression (design essay)](https://manu-site-astro.pages.dev/offline-progression/); [Idle Legacy devlog](https://bigclockgames.itch.io/idle-legacy/devlog/678966/020-offline-progress-update); [Doomscroll 2077 devlog (DEV)](https://dev.to/tanishpaul1106/the-idle-game-loop-that-keeps-players-coming-back-a-doomscroll-2077-devlog-1kip); [Victorian Idle devlog](https://alexdb.itch.io/victorian-idle/devlog/978450/110x-is-now-a-thing-)
- Player complaints show the failure modes: a loading bar on the welcome-back popup that feels like being made to wait, and offline time not being registered consistently. **[S]** — [Warzone Idle forum](https://www.warzone.com/Forum/581561-purpose-loading-bar-welcome-back-popup)
- Clicker Heroes' developers wrote up their offline progression design, a frequently referenced primary account. **[S]** (title only) — [Clicker Heroes blog, Offline Progression](https://blog.clickerheroes.com/?p=1902)

**Streaks**
- Blogs ground streaks in prospect theory: losses weigh roughly twice as much as equal gains, so a streak converts "play today" into "don't lose what you have". **[S]** — [Hubble, Streaks, milestones and loss aversion](https://www.myhubble.money/blogs/streaks-milestones-and-loss-aversion-in-engagement-design)
- Yu-kai Chou argues that streaks produce burnout and that capped streaks (for example a 7-day cycle that resets) outperform infinite ones for long-term retention; this is his assertion, not a cited result. **[S]** — [Yu-kai Chou, streak design](https://yukaichou.com/gamification-analysis/streak-design-gamification-motivation-burnout/)
- A design write-up says Duolingo decoupled streaks from daily goals so one lesson extends the streak, and that learners with 7+ day streaks rose by over 40%. **[S]** (second-hand; the summary did not say which of the returned design blogs carries it, Hubble being the likeliest) — [Hubble](https://www.myhubble.money/blogs/streaks-milestones-and-loss-aversion-in-engagement-design); [UX Magazine, The psychology of hot streak game design](https://uxmag.com/articles/the-psychology-of-hot-streak-game-design)
- Commonly proposed softer variants: grace days or shields, a consistency rate instead of an all-or-nothing counter, transparent rules and recovery paths. **[S]** — [Yu-kai Chou](https://yukaichou.com/gamification-analysis/streak-design-gamification-motivation-burnout/); [NerdSip, when streaks become the point](https://nerdsip.pages.dev/blog/gamification-gone-wrong-when-streaks-become-the-point)

### Inferences
- Ask for notifications only after a friend has done something that makes a notification obviously useful (set a creature loose and been told the world keeps running, or asked to be told when a friend visits), from a button they tap, with one sentence saying what will be sent and how often. On Chrome a refused or ignored prompt is costly beyond the one refusal because low acceptance pushes a site into the quiet UI.
- Offer notification categories at the moment of asking (daily recap ready; a friend did something to your creature) and default to the least frequent. For a small friend group, a single daily digest is the etiquette-safe default.
- The daily recap is the game's "while you were away" screen and should be the first thing a returning player sees, shown instantly from already-synced data (no progress bar), dismissible in one tap, with the option to jump to each event's place in the world. Cap or compress long absences ("12 days passed; here are the three things that mattered") so that staying away never produces a wall of bad news.
- If any continuity mechanic is wanted, prefer forms that cannot be "broken": cumulative counts (days visited this season), things that grow slowly and do not decay when the player is absent, or world-level seasonal rhythm shared by the group. If a streak exists at all, the softer variants above (grace days, a rate, a short capped cycle) remove most of the loss framing.
- For a friends-only game the strongest non-pressuring return prompt is social and concrete (what a friend's creature did near yours), which is information, not obligation.

### Gaps
- No source was found on calm technology or "cozy" return design, or on how Animal Crossing, Neko Atsume, Pikmin Bloom or Wordle treat absence; two searches that included these terms returned only streak and idle-game material. Unsourced leads: Weiser and Brown's "calm technology" and Amber Case's principles (calmtech.com) are the usual framing; Neko Atsume is the usual example of a game with no penalty for absence; Wordle brought people back with one puzzle a day, no notifications and a shareable result.
- The two academic papers blogs lean on (a 2021 Computers in Human Behavior study on guilt and abandonment in habit apps; Silverman and Barasch, Journal of Consumer Research 2023, on broken streaks suppressing engagement) were not located as primary sources. One blog's summary, "the research is mixed", is the most that can be said from this session.
- The original Mozilla source for the 2% versus 24% figures was not found; Mozilla's 99%/48% telemetry is recalled.
- No evidence was found on notification volume tolerance or opt-out rates for small-group social games.

---

## 8. Accessibility on mobile web for games

### Takeaway
The canvas is invisible to assistive technology, so anything a non-sighted or switch user needs must exist in the DOM; the HTML overlay the game already plans is the right vehicle. WCAG 2.2 has four pointer criteria that bear directly on this design (target size, dragging alternatives, gesture alternatives, orientation), text scaling behaves differently on iOS and Android, and colour must never be the only carrier of meaning.

### Cited Findings
**Canvas and screen readers**
- The canvas "cannot be directly read by a screen reader"; the pattern is to mirror important state and menus into hidden but accessible DOM elements with ARIA roles and announce changes through an `aria-live` region. **[S]** — [Bugnet, canvas has no screen reader announcements](https://bugnet.io/blog/how-to-fix-web-game-canvas-no-screen-reader-announcements); [Abratabia, ARIA for web games](https://abratabia.com/game-accessibility/web-game-aria.php)
- `aria-live` priorities are `off`, `polite`, `assertive`; game guidance is `polite` for routine updates and `assertive` only for urgent ones, updated from JavaScript whenever state changes. **[S]** — [MDN, ARIA live regions (Mozilla short link)](https://mzl.la/2szjn8I); [Abratabia, ARIA for web games](https://abratabia.com/game-accessibility/web-game-aria.php)
- One conference talk on interactive canvases found assertive live regions less reliable than moving focus for urgent announcements. **[S]** (single source) — [GitNation, a11y and Interactive Canvases](https://gitnation.com/contents/a11y-and-interactive-canvases)
- Engines that already do this: PixiJS (DOM overlay integrated with screen readers and keyboard navigation), Needle Engine (invisible DOM tree mirroring interactive 3D objects), tldraw (off-screen live region for announcements). **[S]** — [PixiJS accessibility guide](https://pixijs.com/8.x/guides/components/accessibility); [Needle Engine accessibility](https://engine.needle.tools/docs/how-to-guides/accessibility); [tldraw accessibility](https://tldraw.dev/sdk-features/accessibility)
- Advice on the canvas element's own role conflicts (`role="application"` with `tabindex="0"` versus `role="img"` with a label); the canvas's inner fallback content can also be read by assistive technology. **[S]** — [Bugnet, canvas not keyboard focusable](https://bugnet.io/blog/fix-html5-game-canvas-not-keyboard-focusable-screen-reader)

**Pointer and motor**
- WCAG 2.2 SC 2.5.8 (AA): 24 CSS px minimum target or equivalent spacing. SC 2.5.7 (AA): a single-pointer, non-drag alternative for drag operations. **[S]** — [W3C 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html); [W3C 2.5.7](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements)
- WCAG SC 2.5.1 Pointer Gestures (A): anything done with a multi-point or path-based gesture (pinch, two-finger rotate, swipe) must also be doable with a single pointer without a path. **[R]** — [W3C 2.5.1](https://www.w3.org/WAI/WCAG22/Understanding/pointer-gestures.html)
- WCAG SC 1.3.4 Orientation (AA): content must not be restricted to one orientation unless a specific orientation is essential. **[R]** — [W3C 1.3.4](https://www.w3.org/WAI/WCAG22/Understanding/orientation.html)

**Text scaling**
- Safari on iOS scales web text with the system Dynamic Type setting when the page opts in with `font: -apple-system-body`; Ionic's dynamic font scaling works by setting that on the root. **[S]** — [Ionic, Dynamic font scaling](https://ionicframework.com/docs/layout/dynamic-font-scaling); [Michael Tsai, Dynamic Type on the web (July 2024)](https://mjtsai.com/blog/2024/07/05/dynamic-type-on-the-web)
- Chrome for Android by default does not apply the system font-scale setting to web pages (Android System WebView does scale px font sizes). **[S]** — [Ionic, Dynamic font scaling](https://ionicframework.com/docs/layout/dynamic-font-scaling)
- Chrome is adding an opt-in: `<meta name="text-scale" content="scale">`, in Chrome Canary behind the experimental web platform flag as of January 2026 and described in Chrome's own guidance; the related CSS draft is `env(preferred-text-scale)`. **[S]** — [Josh Tumath, Try text scaling support in Chrome Canary (27 Jan 2026)](https://joshtumath.uk/posts/2026-01-27-try-text-scaling-support-in-chrome-canary); [Chrome guidance, Respect OS text scale](https://developer.chrome.com/docs/modern-web-guidance/guides/accessibility/respect-os-text-scale); [CSSWG explainer](https://drafts.csswg.org/css-env-1/explainers/env-preferred-text-scale.html)
- WCAG SC 1.4.4 Resize Text (AA): text can be resized to 200% without loss of content or function. **[R]** — [W3C 1.4.4](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html)

**Contrast, motion, colour**
- WCAG SC 1.4.3: 4.5:1 contrast for normal text, 3:1 for large text. SC 1.4.11: 3:1 for the visual boundaries of controls and meaningful graphics. **[R]** — [W3C 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html); [W3C 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
- `prefers-reduced-motion` reflects the iOS "Reduce Motion" and Android "Remove animations" settings in Safari and Chrome; WCAG SC 2.3.3 (AAA) asks that motion triggered by interaction can be disabled. **[R]** — [MDN, prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion); [W3C 2.3.3](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)
- Game Accessibility Guidelines (basic tier): ensure no essential information is conveyed by colour alone. **[R]** — [Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/ensure-no-essential-information-is-conveyed-by-a-colour-alone/)
- The Okabe–Ito set (black, orange, sky blue, bluish green, yellow, blue, vermillion, reddish purple) is the standard colour-blind-safe categorical palette. **[R]** — [Okabe & Ito, Color Universal Design](https://jfly.uni-koeln.de/color/)

### Inferences
- The planned split (WebGL world, HTML panels) already puts most of the game's meaning in accessible markup. The remaining work is to make the world itself reachable without sight or fine pointing: a DOM list of "creatures in view" (or in this biome) that selects a creature and opens the same inspector sheet, and a polite live region that reads the short event lines the recap already produces.
- The pointer criteria translate to concrete controls: zoom-in/zoom-out or a three-level switch beside pinch (2.5.1); tap-to-place and move buttons beside drag in both editors (2.5.7); 44–48 px controls (2.5.8, 2.5.5). These are the same things one-handed players need, so they are not accessibility-only work.
- Orientation: iPhone cannot lock orientation anyway, and 1.3.4 argues against refusing landscape outright; a portrait-designed layout centred in a landscape viewport satisfies both.
- Text: size UI text in `rem`, set `font: -apple-system-body` on the root for iOS so Dynamic Type applies, add the `text-scale` meta tag for Chrome as progressive enhancement, and offer an in-game text-size setting because Android Chrome does not yet honour the system setting by default. Panels must tolerate 200% text (sheets scroll; block sentences wrap).
- Text rendered inside the canvas does not scale with any of these; keep readable text in HTML and use the canvas for pictures.
- Under `prefers-reduced-motion`, replace camera fly-throughs between zoom levels with cuts or fades, stop ambient UI motion, and keep creature movement (it is content, not decoration) while offering a pause.
- Encode creature mood, biome state and block categories with shape, icon or label as well as colour, and choose categorical colours from a colour-blind-safe set; check canvas art against a deuteranopia simulation because 1.4.11's 3:1 applies to meaningful graphics too.
- A left-handed or "controls on the other side" toggle is cheap given that about a third of one-handed users in Hoober's data used the left thumb.

### Gaps
- Nothing found was specific to VoiceOver or TalkBack behaviour with canvas games on mobile web, or to switch access; guidance above is desktop-derived or general.
- No formal game-accessibility standard surfaced in search; the Game Accessibility Guidelines citation is recalled.
- Whether Chrome's `text-scale` meta tag has shipped in stable Chrome by November 2026 was not confirmed; the latest evidence is Canary in January 2026 plus an undated Chrome guidance page.
- An internal-looking document (July 2026) claims iOS Dynamic Type "does not reach WKWebView"; that concerns embedded web views, not Safari or Home Screen web apps, but it was not verified either way for installed web apps.
- Colour-vision-deficiency prevalence figures and palette guidance were not searched; the Okabe–Ito reference is recalled.

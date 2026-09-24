# V1 product requirements and flows

Every screen, state, rule and edge case for version 1 of the digital wardrobe: profile, closet, manual outfit builder, recommendation feed, occasion stylist, favourites, and "Should I buy this?".

Companion to the launch plan, the end-to-end design and the feature list. Where they disagree, this document wins for V1 scope.

## 1. Goals and success criteria

#### Problem

People own far more clothes than they wear. Whatever is at the front of the cupboard wins, so expensive and loved items sit unused, and "I have nothing to wear" is really "I can't see what I have".

#### V1 goals

  1. **Digitise a wardrobe fast.** 30+ items in under 10 minutes, or people quit.
  2. **Make outfits people trust.** ≥ 60% of feed cards saved rather than skipped.
  3. **Create a habit.** Beta users open the app 3+ days a week in week two.
  4. **Prove buying help is wanted.** ≥ 30% of beta users try "Should I buy this?" at least once.

#### Counter-metrics

  * Upload abandonment rate (started but < 5 items added) must stay under 30%.
  * Tag correction rate per item should fall week over week; if it rises, the prompt regressed.
  * AI cost per active user must stay under ₹25/month.

## 2. Scope and non-goals

In V1| Not in V1  
---|---  
Profile, closet by category, bulk add with multi-item detection, edit/delete, laundry, manual outfit builder, feed, occasion stylist, favourites, wear tracking, should-I-buy, share card| Virtual try-on renders, social/following, creator earnings, payments and subscriptions (paywall screen designed but disabled), trip packing, tailoring, accessories store, women-specific marketing (schema supports women; beta recruits both)  
  
**Scope warning:** "Should I buy this?" was originally Phase 1. Including it in V1 adds link parsing, a product-tag path and a new result screen — roughly 4–6 extra build days. It is specced here as V1-B, to be built only after flows 4–10 are working end to end. If the month runs short, this is the first thing to cut.

## 3. Information architecture

Five tabs. Nothing else in the bottom bar.

Tab| Contains| Primary action  
---|---|---  
**Feed** (home)| Recommended outfits, filter chips| Save / skip  
**Closet**|  Category sections, search, laundry, add button| Add items  
**Style**|  Occasion stylist + build your own| Get looks / create outfit  
**Saved**|  Favourite outfits, wear history| Wear again  
**Profile**|  Stats, settings, should-I-buy entry, plan| —  
  
Closet category sections, in order, hiding any that are empty: tops (t-shirts, shirts, polos, kurtas), bottoms (jeans, trousers, chinos, shorts, pyjamas), one-piece (dresses, kurta sets, co-ords), ethnic (sarees, lehengas, sherwanis, dupattas), outerwear (jackets, blazers, Nehru jackets), gymwear, footwear, accessories (watches, ties, belts, bags, jewellery, caps, sunglasses).

## 4. Flow: onboarding and profile

  1. **Splash → value screen.** Three cards: "See everything you own", "Get outfits from your own clothes", "Rediscover what you forgot". Skippable.
  2. **Phone OTP or Google sign-in.** No email/password in V1.
  3. **Wardrobe type:** menswear / womenswear / both. Drives the category set and tagging prompt. Changeable later in profile.
  4. **City** (autocomplete, or device location with permission) for weather. Skippable; weather features hide if absent.
  5. **Usual occasions** (multi-select chips, 0–8): office, casual, gym, date, party, wedding functions, festivals, travel. Used to order occasion list and seed feed filters.
  6. **Straight into add-clothes** , with a one-line coach mark: "Spread 8–10 items on a bed and take one photo."

#### Edge cases

  * OTP not received → resend after 30s, then fallback to Google sign-in.
  * User denies location → city stays empty, no nag; weather chips hidden, not greyed.
  * User kills app mid-onboarding → resume at the same step on next launch; profile row exists from OTP onward.
  * Wardrobe type changed later from "men" to "both" → existing items untouched, new categories appear, no re-tagging.
  * Duplicate account with the same phone → sign in, never create a second profile.

#### Acceptance

  * Onboarding completes in ≤ 90 seconds with everything skipped except sign-in.
  * Every step after sign-in is skippable and the app is fully usable with all of them skipped.

## 5. Flow: adding clothes most important flow

Three entry paths, one shared review screen.

#### Path A — one photo, many items (default)

  1. User taps **Add** → camera opens with a guide frame and the hint "lay 8–10 items flat, or shoot your open cupboard".
  2. Photo captured → sent for multi-item detection. A progress card shows "Finding items…".
  3. **Detection result screen:** the photo with tappable boxes over each detected garment, a count ("8 items found"), all selected by default.
  4. User deselects false positives (a cushion, a bag strap), can **merge** two boxes into one item or **split** one box into two, and can drag a box's corners to adjust.
  5. Tap **Add 8 items** → items enter the processing queue and the user returns to the closet immediately. Items appear one by one with a shimmer placeholder as each finishes.

#### Path B — gallery multi-select

Same as A but the user picks up to 20 existing photos. Each photo goes through detection; a single review screen lists all detections grouped by source photo.

#### Path C — single item

One photo, one item, straight to the item review card. Used for a new purchase or a re-shoot.

#### Per-item review card (shared)

  * Cutout preview, editable category and subcategory, colour chips, pattern, fabric, formality slider (1–5), season chips.
  * Fields with model confidence < 0.7 are visually flagged for a glance-and-fix.
  * **"Add details" chip** reveals optional fields: brand, size, where from, price, bought on, notes. All blank-able, no completion bar.
  * **"Scan label" button** : optional second photo of the care/size tag; OCR fills brand, size and fabric composition. Never required.

#### Edge cases

  * **Zero items detected** → "We couldn't spot any clothes. Try better light, or a plain background." Offer manual single-item add of the same photo.
  * **Over-detection** (30 boxes from a messy pile) → cap at 20 per photo, show the 20 largest by area, suggest splitting the pile.
  * **Overlapping garments** (dupatta on kurta detected as one) → the split control exists precisely for this; splitting re-runs tagging on each half.
  * **Dark clothes on dark background** → cutout fails or looks ragged; fall back to the original photo with a soft-crop and flag the item "improve photo later". Never block the add.
  * **Person in the photo** (mirror selfie) → detect garments only; if a face is visible, the stored cutout must exclude it wherever possible, and the original is kept private.
  * **Vision API down or times out** → item still saves with category "unsorted" and a retry badge; a background job retries 3 times with backoff. The closet never loses a photo.
  * **Upload interrupted** (app backgrounded, network lost) → queue persists locally, resumes on next launch, shows "3 items waiting to process".
  * **Duplicate photo of an item already in the closet** → after tagging, if an existing item matches on subcategory + colour + pattern with high similarity, show "Looks like you already added this — keep both?" with Keep both / Replace / Discard.
  * **Storage permission denied** → camera-only path still works; explain once, never repeat.
  * **Very large photo** (> 12 MP) → client downsizes before upload; never send originals.
  * **Free-tier item cap reached** (100 active items in V1) → block with a clear message and an archive suggestion, not a silent failure.
  * **Label OCR reads nothing** → keep fields blank, no error toast, just "Couldn't read the label".

#### Acceptance

  * 30 items added from 4 photos in under 10 minutes by a first-time user, unassisted.
  * Detection accuracy ≥ 80% on flat-lay photos in the 100-photo test set (50 men's, 50 women's, ethnic-heavy).
  * Every correction path (deselect, merge, split, re-tag) is reachable in ≤ 2 taps from the review screen.
  * No add path ever requires brand, size, or any optional field.

## 6. Flow: closet management

  * **Grid by category** , newest first within a section; empty categories hidden. Header shows item count and a filter icon.
  * **Filters:** colour, formality, season, status, "not worn in 30/60/90 days", "never worn".
  * **Search:** matches subcategory, colour name, brand, notes.
  * **Item detail:** large cutout, all tags, wear count, last worn, optional fields, "What goes with this?" strip, and actions: edit, laundry toggle, archive, delete, re-shoot photo.
  * **Laundry:** one tap on the item or a long-press in the grid. Laundry items are excluded from feed, occasion looks and manual builder suggestions, and are shown in a collapsible "In wash (6)" section at the top of the closet.
  * **Archive:** retires an item with an optional reason (doesn't fit, worn out, gave away, sold). Archived items leave all suggestions but keep their wear history.
  * **Delete:** permanent, with confirm. Removes the photo from storage and all pairing rows; outfits containing it are marked "incomplete" rather than deleted.

#### Edge cases

  * Item edited (e.g. formality changed) → pairing scores for that item recompute in the background; the feed refreshes on next pull.
  * Item deleted while it appears in a saved outfit → outfit shows the gap with "item removed" and offers a replacement suggestion.
  * All items in a category marked laundry → category shows "Everything's in the wash" rather than an empty grid.
  * User marks 40+ items laundry (packing for a trip) → suggestions may return too few results; show "Not much available — 42 items are in the wash" with a one-tap "mark all clean".
  * Laundry left on for 14+ days → gentle prompt "Still in the wash?" with mark-clean action.
  * Closet under 8 items → feed and occasion stylist show a "add a few more items to unlock outfits" state instead of poor suggestions.

## 7. Flow: build your own outfit

  1. Style tab → **Build your own**. Slot canvas appears: top, bottom (or one-piece), footwear, plus optional layer and up to 3 accessory slots.
  2. Tap a slot → picker sheet opens, showing that category. Items are **sorted by pairing score** against whatever is already chosen, with a "goes well" badge on the top ones.
  3. As items are added, a live **match score** and one-line note appear ("colours work, formality is a stretch").
  4. User can **shuffle** any single slot to swap in the next-best item, or clear a slot.
  5. **Save** → stored as a favourite with `source='manual'`, optional name and occasion tag.

#### Edge cases

  * Choosing a one-piece (dress, kurta set) auto-disables the top and bottom slots; removing it re-enables them.
  * No valid items for a slot (no footwear in the closet) → slot shows "Add shoes to your closet" and the outfit can still be saved as incomplete.
  * User builds a deliberately clashing outfit → never block it. Show the low score as information, allow save. Their taste beats the rules.
  * Laundry item chosen manually → allowed, with a small "in wash" tag so it's a conscious choice.
  * Duplicate of an existing saved outfit → "You've already saved this one" with a link to it, no second copy.
  * App closed mid-build → draft restored on return.

## 8. Flow: recommendation feed

The home tab and the habit engine. Generated entirely from precomputed pairings; no AI call per card.

#### Generation rules

  * Anchor selection per card: 40% least-recently-worn active items, 30% neighbours of saved favourites, 30% random active.
  * Slots filled greedily from the anchor's top pairings; outfit score = average pairwise score.
  * Boosts: matches today's weather, matches an active filter chip, contains an item unworn 30+ days, uses colours the user saves often.
  * Excludes: laundry, archived, items skipped 3+ times in the same combination.
  * Diversity: no item in more than 2 of any 10 consecutive cards.
  * Page size 10, seeded by date + user so the day's feed is stable across refreshes.

#### Card anatomy

Flat-lay of the items, one-line reason ("earthy and relaxed, good for 31°C"), badges ("not worn in 4 months"), and actions: save (double-tap), skip (swipe), wear today, shuffle one item, share.

#### Edge cases

  * Fewer than 8 items in the closet → onboarding-style empty state with an "add more" CTA, no low-quality cards.
  * Closet large but one category missing (no footwear) → generate outfits without that slot rather than showing nothing, and add a one-line hint.
  * User skips 10 cards in a row → show "Not feeling these? Tell us why" with quick reasons (too formal, wrong weather, don't like the colour) that adjust boosts immediately.
  * All valid combinations exhausted (very small closet) → repeat with the least-recently-shown first, clearly marked "seen before", never an empty scroll.
  * Offline → last fetched page renders from cache; save/skip queue locally and sync later.
  * Weather API fails → drop weather boosts silently, never show an error on the card.
  * Item deleted after a card was generated → card is dropped from the page on refresh; if already on screen, tapping shows "this outfit changed".

#### Acceptance

  * First feed page renders in under 1.5 seconds on a mid-range Android device.
  * Zero AI API calls are made while scrolling the feed.
  * Save/skip is reflected in subsequent pages within the same session.

## 9. Flow: occasion stylist rules first, AI last

### 9a. Preset occasion catalog — shipped with the app

Occasions are **data, not AI**. Every one below is a fixed row: formality range, style tags, slot rules and weather sensitivity. The rules engine can build and rank looks for any of them with zero API calls. Users pick from chips; free text is the rare exception, not the path.

Group| Occasion| Formality| Rules  
---|---|---|---  
**Everyday**|  Work / office| 3–4| Covered shoes, no gymwear, no shorts; weather-sensitive  
Work from home| 2–3| Comfort-first, relaxed fits allowed  
Day outing / errands| 2–3| Sneakers or sandals, breathable fabrics, sun-aware  
Gym / workout| 1| Gymwear category only, sports shoes required  
**Social**|  Coffee / lunch with friends| 2–3| Casual, one statement piece allowed  
Night party / club| 3–4| Darker palette boost, dressier footwear, layers for late night  
House party| 2–3| Relaxed smart-casual, comfortable footwear  
Date night| 3–4| Fitted over loose, one accent colour, cleaner palette  
**Work social**|  Office party| 3–4| Smart-casual ceiling: dressy but not clubwear; no gymwear or slippers  
Team offsite / outing| 2–3| Casual, walkable shoes, weather-led  
Client meeting / interview| 4–5| Formal shoes, solid or subtle pattern only, minimal accessories  
**Festive and ethnic**|  Festival (Diwali, Eid, Holi, Onam…)| 4–5| Ethnic boost; Holi sub-rule prefers old/white and light fabrics  
Puja / temple| 3–4| Modest coverage, ethnic preferred, easy-off footwear  
Wedding: haldi / mehendi| 4| Bright and light fabrics, daytime heat, minimal layers  
Wedding: sangeet / reception| 5| Heaviest formality, full accessory slots, evening palette  
Family function / get-together| 3–4| Ethnic or smart-casual, repeat-avoidance weighted higher  
**Travel and other**|  Travel day| 2| Comfort, layers, closed shoes, minimal accessories  
Beach / pool| 1–2| Light fabrics, sandals, sun-aware  
Funeral / condolence| 4| Muted palette only, no bright colours or prints  
  
  * Each row also stores: allowed and banned categories, preferred style tags, accessory slot count, palette bias, and whether weather applies.
  * **Repeat-avoidance per occasion:** the engine remembers what was worn to the last 3 events of the same type, so you don't repeat an outfit at the same circle of people.
  * The catalog ships as a config file. Adding "college fest" or "karwa chauth" later is a data change, not a code change, and costs nothing per use.

### 9b. Deterministic-first principle

Rules do the work; the LLM is a thin ranking and explanation layer that a user can only reach deliberately.

Runs on rules (₹0, instant, offline-able)| Runs on AI (metered)  
---|---  
Pairing scores · the whole feed · "what goes with this?" · manual builder scoring and slot sorting · occasion candidate generation and ranking · repeat-avoidance · laundry and weather filtering · duplicate detection and pairing counts in buy-check · gap finder · share cards · all stats| Item tagging (once per item, at upload) · occasion look ranking and the one-line reasons (3 per request) · parsing a pasted screenshot in buy-check  
  
  * **Every occasion works without the AI.** If the LLM is skipped, disabled, quota-exhausted or down, the app still returns 3 ranked looks from the rules engine, minus the written explanations. Explanations degrade to short generated phrases from the score reasons ("neutral palette, right formality").
  * **Cache aggressively:** same occasion + same closet version + same day ⇒ return the stored result, no new call.
  * **Target mix:** ≥ 95% of all user actions in a session must touch zero AI. Track this as a first-class metric alongside cost per user.

### 9c. Request flow

  1. Style tab → **Get styled**. Preset occasion chips from the catalog above, ordered by what the user picked at onboarding and what they use most. "Something else" is the last chip, not the default.
  2. Optional one-line note, max 300 characters ("rooftop birthday, black jeans in the wash").
  3. Quota check. Remaining count is always visible ("12 of 30 left this month").
  4. Rules engine builds 8–12 valid candidates for that occasion's formality range, style tags, weather and available items.
  5. LLM ranks and returns **3 looks** , each with a one-line reason, plus one styling tip. It can only choose from the candidates.
  6. Each look can be saved, worn, shuffled or shared. Results are stored, so reopening them is free.

#### Edge cases

  * **Quota exhausted** → show the paywall preview (disabled in V1 beta: grant 10 bonus calls and log the event instead of charging).
  * **Fewer than 3 valid candidates** → return what exists, say why ("only 2 work for a formal event — a dark pair of shoes would open this up").
  * **Zero candidates** → never call the LLM. Show the gap directly ("nothing festive in the closet yet").
  * **Off-topic note** ("write my email") → cheap topic check rejects before the LLM call, with a friendly line. No general chat endpoint exists.
  * **Prompt-injection attempt inside the note** → note is passed as delimited data, never as instructions; system prompt ignores instructions inside it.
  * **LLM returns an item not in the candidate list** → response rejected, fall back to the top 3 rule-scored candidates without explanations rather than showing a hallucinated item.
  * **LLM timeout or 5xx** → same rule-based fallback, quota not consumed.
  * **Note mentions a laundry item** ("black jeans in wash") → the note is advisory; the user can also mark it in the closet. V1 does not parse item names from the note.
  * **"Something else" free-text occasion** → mapped to the nearest formality profile; if mapping confidence is low, ask one clarifying question (formal or casual?) rather than guessing.

## 10. Flow: favourites and wearing

  * One saved-outfit store for all three sources: `manual`, `feed`, `ai`. Each keeps its source so you can compare trust in your suggestions versus users' own builds.
  * **Wear again:** marks every item in the outfit worn today, increments wear counts, updates last-worn. This is the "busy morning" shortcut.
  * **Wear history:** a simple list of what was worn on which day, editable for one day back.
  * **Share card:** generated flat-lay image with logo, sized for Stories.

#### Edge cases

  * Wear marked twice on the same day for the same outfit → counted once; second tap shows "already worn today" with an undo.
  * Outfit contains an archived or deleted item → shown as incomplete, "wear again" disabled with a one-tap replacement suggestion.
  * Unsaving an outfit → removes the favourite, keeps the wear history.
  * Saved outfit referenced after a tag edit → still valid; the score is recomputed lazily on open.

## 11. Flow: should I buy this? V1-B

Entry points: Profile tab, an "Is this worth buying?" button on the closet's empty states, and the Android share sheet (share a product link into the app).

  1. **Input.** One of: a product URL, a screenshot from the gallery, a photo taken in a shop, or a manual entry (category + colour + formality). Optional price field.
  2. **Parse.** URL → fetch page title, image and price via server-side fetch; screenshot/photo → same vision tagging as an item, marked `pseudo_item` (never saved to the closet).
  3. **Confirm.** Show the parsed item's tags on one card, editable, so a wrong colour doesn't poison the answer.
  4. **Analyse** against the closet, entirely with rules: duplicates, pairing count, gap value, colour balance.
  5. **Result screen** with a clear verdict, the evidence behind it, and outfit previews.
  6. **Actions:** "Add to closet" (converts the pseudo-item into a real item if they buy), "Save for later", or discard. Nothing is stored in the closet unless the user chooses.

#### What the result screen shows

Block| Rule| Example copy  
---|---|---  
**Verdict**|  Buy (unlocks ≥ 6 outfits, no near-duplicate) · Maybe (3–5 outfits, or 1 similar item) · Skip (≤ 2 outfits, or 2+ near-duplicates)| "Probably skip this one"  
**You already own**|  Near-duplicate = same subcategory + hue distance < 20° + same formality band. Shows thumbnails and count.| "You already have 3 navy polos, worn 4 times between them"  
**Similar style**|  Same subcategory + same style tags, different colour. Softer signal than a duplicate.| "Same shape as your grey polo, in a colour you own a lot of"  
**What it pairs with**|  Count of valid outfits it would join, plus the top 3 rendered as outfit previews using real closet items.| "Works with 9 things you own — here are 3"  
**Colour balance**|  Share of closet already in that hue family.| "41% of your tops are blue"  
**Cost per wear estimate**|  Only if price entered: price ÷ projected wears, based on the average wear rate of similar items in their closet. Clearly labelled an estimate.| "About ₹120 per wear if it behaves like your other polos"  
**Better gap**|  The highest-value missing item by outfits unlocked.| "White sneakers would add 12 outfits — more than this shirt"  
  
#### Edge cases

  * **URL won't parse** (login wall, JS-only page, unsupported site) → fall back instantly to "take a screenshot instead", never a dead end.
  * **Screenshot contains several products** (a category page) → run multi-item detection and ask which one they mean.
  * **Non-clothing input** (a sofa, a phone) → "That's not something I can style" and stop. No LLM call.
  * **Closet too small** (< 15 items) → verdict is suppressed; show pairing previews only, with "add more of your closet for a real answer". A confident verdict from a 6-item closet destroys trust.
  * **Price missing** → hide the cost-per-wear block entirely rather than guessing a price.
  * **Price in another currency** → show as given, no conversion in V1.
  * **Item is a gift or already bought** → "Add to closet" is always available regardless of verdict; never moralise.
  * **User disagrees with a "skip"** → allow "Buy anyway, add to closet" in one tap and log it; repeated disagreement should loosen the duplicate threshold for that user.
  * **Sized item, unknown size** → V1 gives no size guidance at all; say nothing rather than guessing.
  * **Rate limiting** → max 20 buy-checks per day per user; each parse is a vision or fetch call.
  * **Affiliate links (later)** → when added, the result must be identical whether or not a link earns commission, and commission-bearing links must be labelled. Verdicts are never influenced by payouts.

#### Acceptance

  * A verdict is produced in under 6 seconds from a screenshot on a mid-range device.
  * Duplicate detection catches an obvious repeat (same subcategory and near-identical colour) in 9 of 10 manual tests.
  * No pseudo-item is ever written to the closet without an explicit tap.
  * The feature works fully offline-free: no closet data leaves the device beyond the normal API call, and the product image is not stored after the session unless added.

## 12. Cross-cutting rules

#### Empty states

  * Closet empty → big add button, "Start with 8 items on your bed".
  * Feed with < 8 items → progress line ("6 of 8 items — nearly there").
  * Saved empty → "Save outfits you like and they'll live here."
  * Occasion result empty → name the missing category, never a blank screen.

#### Offline and sync

  * Closet, saved outfits and last feed page are cached and readable offline.
  * Adds, wears, saves and skips queue locally and sync on reconnect, in order.
  * Conflict rule: last write wins per field; wear events are additive and never overwritten.

#### Permissions

  * Camera and photos requested in context, at first use, with a one-line reason. Denial never blocks the app; the other add path remains.
  * Notifications requested only after the first outfit is saved, never at launch.

#### Privacy and security

  * Row-level security on every table; storage folders per user; signed URLs only.
  * Everything is private in V1. No sharing beyond a user-generated image the user chooses to send.
  * Account deletion purges rows and photos; reachable from Profile in ≤ 3 taps.
  * Photos of people (mirror selfies) are stored private and never used for anything but item extraction.

#### Limits (V1 beta)

  * 100 active items, 30 uploads/day, 30 AI occasion calls/month, 20 buy-checks/day, 10 requests/minute per user.
  * Daily cost job throttles any user above ₹50/month and alerts the developer.

#### Performance targets

  * Closet grid scrolls at 60fps with 200 items; images lazy-loaded from thumbnails.
  * Detection result screen appears within 8 seconds of capture on a mid-range device and 4G.
  * App cold start under 3 seconds.

## 13. Analytics events

Event| Properties| Answers  
---|---|---  
`signup_completed`| wardrobe_type, city_set, occasions_count| Onboarding drop-off  
`upload_started` / `upload_abandoned`| path (A/B/C), items_detected| Goal 1: friction  
`item_added`| category, confidence, corrected (bool), optional_fields_filled| Tagging quality  
`detection_corrected`| action (deselect/merge/split/retag)| Model improvement backlog  
`card_seen` / `card_saved` / `card_skipped`| outfit_id, score, anchor_unworn_days| Goal 2: quality  
`outfit_built_manually`| slots_filled, final_score| Do users trust themselves more?  
`style_me_used`| occasion, candidates_count, fallback_used| AI value and failure rate  
`wear_marked`| source, item_count| Goal 3: habit  
`laundry_toggled`| items_count| Feature adoption  
`buy_check_started` / `buy_check_result`| input_type, verdict, outfits_unlocked, duplicates_found| Goal 4 and Phase 1 revenue signal  
`buy_check_overridden`| verdict, action| Is the verdict too strict?  
`share_created`| source| Organic growth  
`quota_hit`| type| Pricing calibration  
  
## 14. Edge case index

Quick reference for QA. Each row must have a test before beta.

Area| Case| Expected  
---|---|---  
Add| No items detected| Helpful retry + manual single add  
Add| Vision API failure| Item saved as "unsorted", auto-retry, no data loss  
Add| Duplicate item photo| Keep both / Replace / Discard prompt  
Add| App killed mid-queue| Queue resumes on next launch  
Closet| Everything in laundry| Explanatory state + mark-all-clean  
Closet| Delete item used in saved outfit| Outfit marked incomplete, replacement offered  
Feed| Closet too small| Progress state, no bad cards  
Feed| Combinations exhausted| "Seen before" repeats, never blank  
Feed| Offline| Cached page, queued actions  
Style| Zero candidates| No LLM call, gap explained  
Style| LLM hallucinates an item| Response rejected, rule fallback, quota refunded  
Style| Off-topic or injected note| Blocked pre-call, friendly message  
Build| One-piece selected| Top/bottom slots disabled  
Build| Low-score outfit| Allowed and saved, score shown as info only  
Buy| URL unparseable| Instant screenshot fallback  
Buy| Closet < 15 items| No verdict, previews only  
Buy| Non-clothing input| Polite stop, no AI call  
Buy| User overrides verdict| One-tap add, logged, thresholds loosen  
Account| Delete account| Rows + photos purged, confirmed in-app  
  
## 15. Release checklist

  * All flows 4–10 pass their acceptance criteria on one mid-range Android device and one iPhone.
  * 100-photo tagging test run, accuracy recorded, prompt version tagged in git.
  * RLS verified by attempting cross-user reads with a second account.
  * Quotas verified by scripted abuse: 200 rapid requests must be rejected cleanly.
  * Cost dashboard shows per-user AI spend; alarm tested.
  * Privacy policy, account deletion, and store listings complete.
  * Analytics events firing and visible in a funnel for the four goals.
  * Beta group of 30–40 recruited, half women, with a feedback channel.

**Build order reminder:** flows 5 and 6 first (adding and closet), then 8 and 9 (feed and stylist), then 7 and 10 (builder and favourites), and only then 11 (should I buy). If week four arrives and flow 11 is incomplete, ship without it.

V1 PRD v1 · companion to the launch plan, end-to-end design and feature list · revise after beta.

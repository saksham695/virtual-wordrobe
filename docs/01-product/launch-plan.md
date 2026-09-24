# Your wardrobe, as a feed you actually want to scroll

A digital wardrobe for men and women. Upload your clothes once, scroll outfits made from what you own, get help before you buy, and later, follow other people's wardrobes.

**W1** Closet capture **W2** Tagging + pairing **W3** Feed + stylist **W4** Beta

Phase 0 is the first 30 days, assuming about 15–20 hours a week alongside a full-time job. Social and earnings come in later phases, once the core works.

### What the first month has to prove

  1. People will upload 30+ items if it takes under 10 minutes, for men and for women.
  2. The outfits look good: at least 60% of feed cards get saved or liked rather than skipped.
  3. People come back: beta users open the app 3+ days a week, like a feed habit.

Social and affiliate features only work if these hold. A follower network on top of empty or ugly wardrobes won't grow.

## Men and women: what changes

### Men

  * Fewer items, simpler categories
  * Top + bottom + shoes + watch/belt
  * Kurta, Nehru jacket, juttis for occasions
  * Wants speed: "just tell me what to wear"

### Women

  * Often 2–5x more items; free cap may need to be higher
  * Dresses, co-ords and kurta sets count as one outfit piece
  * Sarees, lehengas, dupattas, jewellery, bags, footwear
  * More occasions, more repeat-avoidance, more browsing

Build one schema that handles both from day 1: a "set" item type, layering (dupatta, jacket), and accessory slots. Tagging must be tested on both, especially Indian ethnic wear.

## Phase 0: the first month

W1

### Foundations and closet capture

Days 1–7

End of week: anyone can photograph a piece and see it cut out in their closet.

  * Set up Expo (React Native) app, auth (phone OTP or Google), and backend (Supabase or Firebase)
  * Onboarding asks style profile: menswear, womenswear or both; usual occasions; city for weather
  * Item schema: category, sub-type, colours, pattern, fabric, formality, season, set/single, layer, last worn, favourite
  * Camera + gallery upload with multi-select, so 10 photos go in at once
  * Background removal: on-device first (iOS subject lift, Android ML Kit), self-hosted rembg as fallback
  * Image compression + storage on Cloudflare R2 or S3, with thumbnails
  * Closet screen: grid by category with separate men's and women's category sets

W2

### AI tagging and the pairing engine

Days 8–14

End of week: tap any piece and see what goes with it.

  * Vision call per item returns tags as JSON; one-tap correction for any wrong tag
  * Test tagging on 50 men's and 50 women's items, including sarees, lehengas, kurta sets, dupattas
  * Rules engine: colour harmony, formality match, season, fit balance, pattern limits, set logic
  * Accessory slots: shoes, socks, belt, watch for men; jewellery, bag, footwear, dupatta for women
  * Precompute a pairing score table on every upload, so browsing matches costs nothing
  * "What goes with this?" screen for any item

W3

### Wardrobe feed, stylist and guardrails

Days 15–21

End of week: open the app and scroll outfits made only from your own clothes.

  * Wardrobe feed: endless scroll of outfit cards from the pairing engine, no AI cost per card
  * Feed filters: occasion, colour, weather, gym, ethnic, "not worn in 30 days"
  * Double-tap to save to favourites, swipe to skip; both feed taste learning
  * Occasion stylist: LLM ranks rule-filtered outfits using text tags only and explains each in one line
  * "Wore this today" tracking and nudges for forgotten items
  * Guardrails: 30 AI suggestions a month on basic, input caps, clothing-only prompts, rate limits, cost alarm
  * Shareable outfit card with app logo for Instagram Stories

W4

### Closed beta

Days 22–30

End of month: 30–40 real users, half men and half women, with numbers on the three goals.

  * Analytics: upload started/finished, items added, feed cards seen/saved/skipped, shares
  * Ship via TestFlight and a Play internal test track to 15–20 men and 15–20 women
  * Watch 3 men and 3 women upload their closet in person; note every hesitation
  * Compare men vs women: items uploaded, save rate, return rate
  * Fix the top 5 problems; design the paywall (₹100/month) but keep it off
  * Decide the launch audience for Phase 1 based on which group engaged more

## After the first month

### Phase 1: buying help and payments

Months 2–3

  * **"Should I buy this?"** Share a Myntra, Ajio or Amazon link or screenshot; see how many outfits it unlocks, what it pairs with, and duplicate warnings.
  * **Gap finder:** "white sneakers would add 12 outfits," with affiliate links.
  * Turn on the ₹100/month plan with 30 AI suggestions, plus a yearly option.
  * Public launch on Play Store and App Store.

### Phase 2: follow wardrobes and creator earnings

Months 4–6, once there are enough good wardrobes to follow

  * **Public wardrobes (opt-in):** users choose to make their closet or selected outfits public. Private by default.
  * **Follow people:** browse others' outfits and save ideas.
  * **"Recreate with my clothes":** see someone's outfit, and the app rebuilds it from your wardrobe, showing only the missing piece to buy.
  * **Creator earnings:** when a follower buys a tagged item through a public outfit, the creator gets a share of the affiliate commission.
  * Creator dashboard: views, saves, clicks, earnings.

## How the money flows

**1. Creator posts** An outfit from their wardrobe, items tagged to store links

**2. Follower taps** "Recreate" shows what they own and what's missing

**3. Follower buys** Through your affiliate link on Myntra, Ajio or Amazon

**4. Commission splits** Store pays you; you share a part with the creator

Affiliate programmes and creator platforms in India each have their own commission rates and payout rules; check current terms before promising creators a split.

## Things to get right for the social side

  * **Privacy:** public means opt-in per outfit, never the whole closet by default. No body photos public unless the user chooses.
  * **Moderation:** report and block from day one of the social launch, especially important for women's profiles.
  * **Disclosure:** creators earning commission must label outfits as affiliate or paid, in line with Indian advertising guidelines for influencers.
  * **Payouts:** creator earnings need KYC and tax handling, so plan it with a payments provider rather than building it yourself.

## Instagram, in parallel

  * From week 1, post 3 reels a week: "10 outfits from 8 clothes", office and date looks for men and women, before/after cupboard shots.
  * Share build-in-public progress for a waitlist, aiming for 200+ by day 30.
  * Spot future creators early: people who post good outfits in your comments are your first public wardrobes in Phase 2.

## Stack

Piece| Choice| Why  
---|---|---  
App| React Native (Expo)| One codebase for Android and iOS  
Backend| Supabase or Firebase| Auth, database and functions without running servers  
Images| Cloudflare R2 or S3| Cheap storage for early users  
Cutouts| On-device, rembg fallback| Free and fast  
Tagging| Cheap vision model| About ₹0.1–0.3 per item, once  
Feed + stylist| Rules engine + small LLM| Feed runs on rules; AI only for occasion looks  
Analytics| PostHog or Firebase Analytics| Free tier covers the beta  
  
## First-month budget

Item| Cost| Note  
---|---|---  
Google Play developer account| $25| One-time  
Apple developer account| $99| Yearly; skip if Android-only first  
AI for 40 beta users| ₹1,000–3,000| Women's closets are larger, so tagging costs more  
Backend, storage, analytics| ₹0| Free tiers  
  
Rough estimates; check current pricing before committing.

## Where it gets hard

  * **Upload friction.** Harder for women with bigger closets. Bulk upload and gallery scanning matter most.
  * **Outfit quality.** Women's styling has more rules and more variety; test with real users early.
  * **Social needs density.** Following only works with many good public wardrobes, which is why it waits for Phase 2.
  * **Time.** Two audiences in one month is tight. Protect the Phase 0 scope.

**Rule for the month:** if a feature doesn't help one of the three goals, it waits for the next phase.

Tick tasks as you go. Progress is saved in this browser.

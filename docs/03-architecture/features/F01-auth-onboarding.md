# F01 — Auth and onboarding (S01, S02)
**Owns:** `profiles` row lifecycle, wardrobe type, city, occasions, consent.
**Depends on:** nothing. **Blocks:** everything.

## Backend
- Supabase Auth: phone OTP (MSG91 or Twilio via Supabase) + Google. No email/password.
- Trigger `on auth.users insert` → `insert into profiles(id) values (new.id)` (service role, SQL).
- `profiles.onboarding_step` advanced by direct client updates under RLS.
- Consent: `consent_analytics` default false; notice text lives in `apps/mobile/src/legal/consent.md`.
## Engine
none.
## App
- `app/(auth)/…` provider screens; `app/(onboarding)/type.tsx` (S01), `city.tsx` (S02).
- Resume: on launch read `onboarding_step`; route to that step. Kill mid-flow → same step.
- Wardrobe type drives `taxonomy` category set shown (`shared/taxonomy.ts: categoriesFor(type)`).
- Location: `expo-location` requested on tap only; denial → nothing stored, no re-ask ever.
## Edge cases → behaviour
OTP not received → resend after 30 s, then Google fallback surfaced · duplicate phone → sign in ·
type changed later → items untouched, new categories appear, no re-tag.
## Tests
unit: `categoriesFor('men'|'women'|'both')` · e2e (Maestro): complete onboarding in ≤ 90 s with
everything skipped; app usable with all skipped.
## Analytics
`signup_completed`.

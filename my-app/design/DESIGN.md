---
name: MamieMédoc
colors:
  surface: '#faf9f6'
  surface-dim: '#dbdad7'
  surface-bright: '#faf9f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f1'
  surface-container: '#efeeeb'
  surface-container-high: '#e9e8e5'
  surface-container-highest: '#e3e2e0'
  on-surface: '#1a1c1a'
  on-surface-variant: '#40493d'
  inverse-surface: '#2f312f'
  inverse-on-surface: '#f2f1ee'
  outline: '#707a6c'
  outline-variant: '#bfcaba'
  surface-tint: '#1b6d24'
  primary: '#0d631b'
  on-primary: '#ffffff'
  primary-container: '#2e7d32'
  on-primary-container: '#cbffc2'
  inverse-primary: '#88d982'
  secondary: '#795900'
  on-secondary: '#ffffff'
  secondary-container: '#fec330'
  on-secondary-container: '#6f5100'
  tertiary: '#ac0c18'
  on-tertiary: '#ffffff'
  tertiary-container: '#d02d2d'
  on-tertiary-container: '#ffedeb'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a3f69c'
  primary-fixed-dim: '#88d982'
  on-primary-fixed: '#002204'
  on-primary-fixed-variant: '#005312'
  secondary-fixed: '#ffdfa0'
  secondary-fixed-dim: '#f8bd2a'
  on-secondary-fixed: '#261a00'
  on-secondary-fixed-variant: '#5c4300'
  tertiary-fixed: '#ffdad6'
  tertiary-fixed-dim: '#ffb3ac'
  on-tertiary-fixed: '#410003'
  on-tertiary-fixed-variant: '#930010'
  background: '#faf9f6'
  on-background: '#1a1c1a'
  surface-variant: '#e3e2e0'
typography:
  headline-xl:
    fontFamily: Nunito Sans
    fontSize: 38px
    fontWeight: '800'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Nunito Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Nunito Sans
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Nunito Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: 0em
  headline-sm:
    fontFamily: Nunito Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 30px
    letterSpacing: 0em
  body-xl:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 34px
    letterSpacing: 0.01em
  body-lg:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 21px
    fontWeight: '400'
    lineHeight: 32px
    letterSpacing: 0.01em
  body-md:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 20px
    fontWeight: '400'
    lineHeight: 30px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: Nunito Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: 0.02em
  label-md:
    fontFamily: Nunito Sans
    fontSize: 19px
    fontWeight: '700'
    lineHeight: 26px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Nunito Sans
    fontSize: 17px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0.03em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-desktop: 2rem
  margin: 1.25rem
  margin-desktop: 3rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1.25rem
  space-lg: 1.75rem
  space-xl: 2.5rem
---

## Brand & Style

This design system is crafted for seniors, caregivers, and their families, prioritizing reassuring calm, cognitive clarity, and physical ease of use. It strips away the anxiety-inducing sterility of hospital interfaces, replacing it with an herbal, domestic warmth reminiscent of an apothecary cabinet and sunlit kitchen table. 

### Design Philosophy & Movement
- **Tactile Softness & Senior-First Accessibility:** Interfaces must provide oversized, finger-friendly contact surfaces, generous line spacing, and immediate visual feedback. 
- **Warm Domesticity over Clinical Rigor:** Pure clinical whites are grounded with soft clotted-cream and warm linen backdrops, paired with organic botanical greens that symbolize vitality, healing, and steady routine.
- **Zero Ambiguity:** Iconography is never used in isolation; every symbol is paired with explicit, high-contrast text labels. States are unmistakably signaled through shape changes, solid fills, and distinct tonal containers.

## Colors

The palette is tuned specifically for aging eyes, cataracts, and fluctuating screen brightness, guaranteeing a minimum AAA contrast ratio (7:1) for critical text and actionable items.

### Palette Architecture
- **Primary (`#2E7D32` - Herbal Green):** Represents routine, safe confirmation, and dosage adherence. Accompanied by `#1B5E20` (Forest Deep) for text and focus rings on light surfaces, and `#E8F5E9` (Mint Tea) for large contextual card backings.
- **Secondary (`#FBC02D` - Sunlit Chamomile):** Used exclusively for gentle reminders, upcoming schedule alerts, and informational banners. Paired with `#FFF9C4` for banner fills and `#5D4037` / `#7F5100` for high-contrast legible text.
- **Tertiary (`#D32F2F` - Urgent Coral):** Strictly isolated for critical warnings, missed life-essential doses, drug interaction alarms, or emergency direct-dial buttons. Paired with `#FFEBEE` as a soft alert backdrop.
- **Neutrals (`#FAF9F6` Warm Cream to `#1C1C1A` Soft Charcoal):** Surfaces avoid glaring `#000000` against `#FFFFFF` glare. Primary surfaces utilize `#FAF9F6` and clean `#FFFFFF` cards, paired with `#1F241F` for ultra-readable, soft-touch dark typography.

## Typography

The typographic hierarchy is intentionally elevated beyond typical screen scales to remove the need for screen zoom gestures. 

- **Headline System (`Nunito Sans`):** Rounded terminals provide organic warmth and visual approachability while maintaining structural legibility in medication titles, daily schedules, and time blocks.
- **Reading & Instructional System (`Atkinson Hyperlegible Next`):** Specifically engineered for vision-impaired readers, featuring differentiated letter shapes (distinguishing 'I', 'l', and '1', as well as 'O' and '0').
- **Scale Restraint:** The absolute baseline body text is set to `20px` with generous `1.5x` line heights to prevent visual crowding. Microcopy below `17px` is strictly prohibited throughout the entire experience.

## Layout & Spacing

Layouts rely on single-column or uncrowded two-column configurations designed for thumb navigation and hand tremors. 

### Grid & Composition
- **Mobile First (Single Column Focus):** Screens are built around a central linear flow with minimum outer margins of `1.25rem` (`20px`). Multiple concurrent cards across the horizontal axis are forbidden on mobile to eliminate accidental taps.
- **Rhythm & Touch Buffering:** Every interactive target is buffered by at least `space-md` (`1.25rem` / `20px`) of whitespace. Elements never crowd one another; margins prevent overlapping activation zones.
- **Tablet & Large Screen Adaptation:** When opened on family iPads or caregiver kiosks, layouts expand to a clean 2-column or 3-column asymmetric layout with `2rem` gutters, prioritizing a large daily calendar on one flank and actionable dosage cards on the other.

## Elevation & Depth

To avoid optical haze and confusion caused by blurry, low-contrast drop shadows, visual depth is created primarily through tonal layering and crisp containment borders.

- **Surface Tiering:** The root screen sits at Warm Linen (`#FAF9F6`). Primary content cards sit elevated on Crisp Milk (`#FFFFFF`). Highlighted active tasks sit inside Mint Warmth (`#E8F5E9`).
- **Tactile Shadows:** Where elevation is necessary to indicate interactive "pressability", shadows are warm, grounding, and physical: a soft amber-olive tint (`rgba(34, 51, 34, 0.08)`) with a low `4px` blur and `3px` downward offset.
- **Physical Press Cues:** Interactive buttons feature a slight physical rim: a solid `2px` inset or stroke in a darker shade of the button’s base color (`#1B5E20` under `#2E7D32`), depressing visually by `2px` on active tap.
- **Alert Layering:** Floating notifications utilize an ambient warm blur with a distinct `2px` solid border (`#FBC02D` or `#D32F2F`) to prevent floating sheets from washing out into the screen background.

## Shapes

The interface embraces a pill-like, hyper-curved geometry (`roundedness: 3`) that feels soft, harmless, and ergonomic in the hand.

- **Cards & Enclosures:** Medication schedules, daily log entries, and summary sheets employ `rounded-2xl` (`2rem` / `32px`) to `rounded-3xl` (`3rem` / `48px`) radiuses. 
- **Buttons & Pills:** All primary action buttons and filter chips are full capsules (`border-radius: 9999px` or minimum `1rem` on rectangular controls), matching the soft geometry of medicinal tablets and comforting natural pebbles.
- **Target Geometry:** Interactive buttons never have sharp corners that could visually suggest hazard or clinical sharpness.

## Components

Every interactive element is optimized for motor stability, cognitive ease, and immediate visual verification.

### Buttons & Call-to-Actions
- **Dimensions:** Primary buttons have a minimum physical height of `64px` (scaling up to `72px` for primary intake confirmation).
- **Primary ("J'ai pris mes médicaments" / "Taken"):** Solid `#2E7D32` background with `#FFFFFF` text in `label-lg` (`22px` bold), accompanied by a clear checkmark icon (`32x32px`). Full pill contour (`9999px`).
- **Emergency Button:** High-visibility pill styled in `#D32F2F` with `#FFFFFF` label and phone/cross icon, reserved exclusively for SOS family contact or direct emergency dispatch.

### Medication Cards
- **Structure:** Encased in `#FFFFFF` with a subtle `1.5px` border in `#E0E3DE` and a gentle `24px` internal padding (`space-lg`).
- **Hierarchy:** Medication name displayed in `headline-md` (`26px` bold), followed by dosage instructions (e.g., "1 comprimé avec de l'eau") in `body-xl` (`24px`).
- **Time Block:** Includes a prominent badge (e.g., "Matin - 08:00") highlighted in warm chamomile (`#FFF9C4`) with `#5D4037` text.

### Chips & Filter Pills
- **Style:** Height of `48px`, generous `24px` horizontal padding. 
- **States:** Inactive chips feature a soft linen background (`#F0EFEA`) with `label-md` text. Active chips invert to solid herbal green (`#2E7D32`) with white text and an explicit checkmark prefix.

### Lists & Timelines
- **Spacing:** Items are separated by `space-md` gaps rather than thin hairline dividers.
- **Touch Affirmation:** Each row operates as a distinct standalone card rather than an endless striped list, reducing accidental mis-taps.

### Checkboxes & Confirmation Radios
- **Touch Target:** The visible control box is oversized (`36x36px`) nestled within an unconstrained touch target of at least `64x64px`.
- **Selected State:** Fills with `#2E7D32`, presenting an unmistakably thick `4px` white checkmark icon.

### Input Fields
- **Height & Style:** Text inputs are minimum `64px` high with a `2px` solid neutral border, transitioning to a `3px` solid `#2E7D32` focus ring.
- **Placeholder & Text:** Input text sits at `body-xl` (`24px`). Labels remain persistently visible above the field in `label-md`, never relying on disappearing floating placeholder text.
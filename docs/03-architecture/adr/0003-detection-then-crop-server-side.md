# ADR-0003 Detect on the full photo, crop server-side, cut out per crop
Multi-item detection needs the whole flat-lay; segmentation works best per garment. So: one
detection call on the full photo → server crops boxes → on-device or fallback cutout per crop.
Alternative (segment everything on device first) fails on Android ML Kit for touching garments.
Revisit if D06's pre-gate shows < 60% detection.

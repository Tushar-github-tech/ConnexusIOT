/* =====================================================================
   CONNEXUS BRAND CONFIG — the ONLY file you need to edit to rebrand
   ---------------------------------------------------------------------
   CHANGE THE LOGO:
     Easiest: overwrite  assets/logo.svg  with your own logo (SVG or
              square PNG). Or set  logoUrl  below to any path/URL.

   CHANGE NAME / TAGLINES / COLORS / CONTACT:
     Edit the values below and refresh the page. No build step.
   ===================================================================== */

window.CONNEXUS_CONFIG = {

  /* --- Brand identity --- */
  brandName:   "Connexus",          // first part of the name
  brandSuffix: "IoT",               // accent-colored second part
  logoUrl:     "assets/logo.png",   // path or URL to your logo image
  showLogo:    true,                // false = text only, no image

  /* --- Hero rotating taglines (types one after another, loops) --- */
  taglines: [
    "Control every device from one app.",
    "Cut maintenance costs by up to 70%.",
    "Secured end-to-end, always.",
    "Works with the appliances you already own."
  ],

  /* --- Theme colors --- */
  colors: {
    accent:  "#ed7a23",   // Connexus brand orange
    accent2: "#f4a020",   // warm amber — used in gradients
    success: "#10b981",   // "online" green
    danger:  "#ef4444"    // alerts
  },

  /* --- Contact --- */
  contactEmail: "support@connexusiot.com",
  contactPhone: ""        // leave "" to hide the phone number entirely
};

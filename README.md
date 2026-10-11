# FormEase 📄⚡
### Client-Side Application Dossier & Biometric Preparation Engine
**100% Client-Side Sovereign • Zero Network Exfiltration • Near-Ceiling Quality Convergence**

---

## 🌟 Overview
Government exam and visa portals (e.g., US DS-160, Passport Seva, UPSC, SSC, NEET/NTA) reject millions of applications each year due to cryptic errors like `"File Exceeds 50 KB"` or invalid aspect ratios. Standard online compression tools blindly degrade images down to 15 KB or 20 KB, creating blurry artifacts that fail biometric scrutiny.

**FormEase reverses this friction.** It is an ultra-fast, zero-knowledge web application that prepares, validates, and bundles photographs, signatures, and identity documents to meet strict bureaucratic portal bounds in **3 clicks**.

---

## 🎯 Hackathon Category & Judging Alignment

### 1. Amazon SWE Track (Customer Obsession & Friction Elimination)
* **Zero Guesswork Workflow:** Non-technical users drop raw camera photos into labeled slots (`Photo`, `Signature`, `Marksheet`). The engine auto-rights EXIF rotation, normalizes official dimensions, and handles compression automatically.
* **Resilient Edge States:** Corrupted files, oversized camera images (up to 50 MB), and accidental drops are defensively caught without freezing the UI thread.

### 2. IEEE Senior Member Track (Algorithmic Rigor & Accessibility)
* **Deterministic Near-Ceiling Convergence:** Instead of arbitrary lossy compression, FormEase executes a 7-step binary search over JPEG quality factor $q \in [0.05, 0.99]$ targeting the upper legal byte bracket ($[0.92 \times \text{Limit}, 0.985 \times \text{Limit}]$) with automatic resolution guardrails.
* **WCAG 2.1 AA/AAA Compliance:** Headless Radix UI accessible primitives, high-contrast typography, live screen-reader announcements via `aria-live="polite"`, and 1px/10px keyboard crop nudging via Arrow keys.

### 3. Deployxa Sponsor Track (Best Use of Deployxa)
* **Static Edge Delivery:** Zero backend dependencies, compiled into an ultra-fast SPA ready for Deployxa edge deployment.
* **`deployxa.json`:** Native edge routing with immutable caching headers for `/assets/` and static SPA rewrites.

---

## 🛠️ Key Architectural Features

### 1. Dual-Engine Upload Modes
* **Mode A: Guided "Dossier Slot" Mode:** Dedicated pre-configured slots for Photograph, Signature, and Certificate according to official government standards (UPSC, SSC, NTA, DS-160, Schengen).
* **Mode B: "Multi-Batch Sandbox" Mode:** Universal multi-file drop zone spawning an organized queue of independent cards with a Global Batch Apply toolbar.

### 2. Specialized Processing Workspaces
* **Biometric Photo Canvas:** Interactive SVG face guidelines (Crown level, Eye level, Chin line) with pan, pinch-zoom, and 1px keyboard nudging.
* **Signature Ink Clarifier:** Dynamic paper bleach filter mapping desk shadows to pure `#FFFFFF` while darkening faded blue/black pen strokes.
* **Document & Marksheet Enhancer:** Grayscale desaturation (-60% byte payload) and 3x3 unsharp text sharpening kernel.
* **Client-Side PDF Engine:** Offline PDF rendering via `pdfjs-dist` and re-wrapping via `pdf-lib` with 4 KB headroom guardrail.

### 3. Sovereign Privacy Guarantee
* **Zero Network Requests Made:** Live telemetry interceptor monitors `window.fetch` and `XMLHttpRequest` to prove 100% client-side offline execution.

### 4. Verified Dossier Packaging (.ZIP)
* Master one-click export compiles all validated files into a structured `.ZIP` archive with standardized filenames (`01_PASSPORT_PHOTO_48KB.jpg`) and an auto-generated `VALIDATION_SUMMARY.txt` audit manifest.

---

## 🚀 Quick Start & Local Development

```bash
# 1. Clone repository
git clone <repo-url>
cd FormEase

# 2. Install dependencies
npm install

# 3. Run algorithmic verification test suite
npx tsx scripts/test-verification.mjs

# 4. Start local development server
npm run dev

# 5. Build for production (Deployxa static edge bundle)
npm run build
```

---

## 📦 Deployxa Edge Deployment Specification

`deployxa.json` is located in the root repository directory:
```json
{
  "name": "formease",
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "routes": [
    {
      "src": "/assets/(.*)",
      "headers": {
        "cache-control": "public, max-age=31536000, immutable"
      }
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

---

## 📄 License
MIT License. Built for the Hyperbloom Hackathon.

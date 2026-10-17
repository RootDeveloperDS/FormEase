# FormEase - v3.1.0.0

### Format your application documents in 3 clicks. Everything runs in your browser — nothing leaves your device.

---

## The Problem

Every government portal, university admission form, and visa application demands files in absurdly specific formats:

> *"Passport photo must be between 20 KB and 50 KB, exactly 350×350 pixels, JPEG only."*
>
> *"Signature must be 10 KB to 20 KB, 2:1 aspect ratio, black ink on white background."*
>
> *"Marksheet PDF must be under 200 KB, grayscale."*

If your file is 3.8 MB (a normal phone photo), you need to somehow shrink it to under 50 KB — **76 times smaller** — without making it look terrible. Most people end up on sketchy compression websites, uploading their passport photos and identity documents to servers they've never heard of, guessing slider positions, downloading, checking the size, realizing it's still wrong, and repeating the whole process.

Three documents. Multiple attempts each. Hours wasted. And your personal photos sitting on a stranger's server.

**FormEase eliminates this entire process.**

---

## What FormEase Does

FormEase is a browser-based tool that takes your raw phone camera photos, messy desk-photo signatures, and oversized document scans — and automatically formats them to the **exact** specifications of the portal you're applying to.

### How it works

**1. Pick your portal**

Select the form you're filling from a built-in library of real-world presets:

| Preset | Photo | Signature | Document |
|:---|:---|:---|:---|
| 🇺🇸 US Visa (DS-160) | 600×600 px, max 240 KB | — | — |
| 🇺🇸 US Passport | 600×600 px, 2×2" at 300 DPI | — | — |
| 🇪🇺 Schengen Visa | 413×531 px (35×45 mm) | — | — |
| 🇮🇳 UPSC Civil Services | 350×350 px, 20–50 KB | 350×175 px, 10–20 KB | PDF < 200 KB |
| 🇮🇳 SSC | 350×450 px, 20–50 KB | 360×180 px, 10–20 KB | — |
| 🇮🇳 NTA (NEET / JEE) | 400×500 px, 10–200 KB | 350×175 px, 4–30 KB | PDF < 300 KB |
| 🇮🇳 Passport Seva / PAN | 350×450 px, < 50 KB | 360×180 px, < 30 KB | PDF < 200 KB |
| 🌐 General Job / University | 500×500 px, < 100 KB | — | PDF < 500 KB |

The moment you select a preset, all upload slots automatically reconfigure to that portal's exact pixel dimensions, aspect ratio, file-size limits, and format requirements. No looking up the rules. No guessing.

**2. Drop your files**

Each slot has a drag-and-drop zone. Drop your raw camera photo. Drop your phone snapshot of your signature on paper. Drop your marksheet scan or PDF.

**3. FormEase does the heavy lifting**

The moment a file lands, the processing engine runs — **entirely inside your browser**:

- **Smart compression** — A binary-search algorithm adjusts JPEG quality across up to 7 iterations, converging on the highest possible quality that still fits within the size ceiling. If the limit is 50 KB, the output is typically 47–49 KB — not 28 KB. Maximum quality, always within limits.

- **Signature ink cleaner** — One-click background removal turns your messy desk-photo signature (grey shadows, paper creases, uneven lighting) into crisp black ink on pure white paper.

- **Document enhancer** — Converts colour scans to high-contrast grayscale with text sharpening. Your marksheet stays readable at 200 KB.

- **Face alignment guide** — An interactive biometric overlay shows exactly where to position your eyes, chin, and head crown — matching the face-coverage percentages that portals require.

- **Live byte counter** — Shows the compressed size updating in real-time as the engine works. Green when you're within limits.

**4. Download your ready-to-submit bundle**

One click exports a verified `.ZIP` containing all formatted files, renamed with portal-standard filenames (like `01_PASSPORT_PHOTO_47KB.jpg`), and a `VALIDATION_SUMMARY.txt` that proves every file meets the portal's constraints.

Upload. Submit. Done.

---

## Nothing Leaves Your Device

Every image compression website on the internet uploads your files to a remote server. Your passport photo, your signature, your identity documents — stored on someone else's computer.

FormEase is different. **There is no server.** The entire application is a static bundle of HTML, CSS, and JavaScript. All image processing happens through the HTML5 Canvas API directly in your browser's memory. The network tab stays at **zero** outbound requests.

This isn't a marketing claim — it's an architectural constraint. There is no backend to send data to. No account needed. No cookies. No tracking. No ads.

If you turn off WiFi and refresh the page, it still works.

A built-in privacy monitor (`useOfflineTelemetry`) patches `window.fetch` and `XMLHttpRequest` to actively detect and warn about any outbound network calls — proving the zero-upload guarantee in real-time.

---

## Two Ways to Use It

### Guided Dossier Mode

Pre-configured slots for **Photo**, **Signature**, and **Document** — locked to the requirements of whatever portal you selected. Best for filling actual application forms.

### Batch Sandbox Mode

A universal multi-file drop zone where you can compress any number of images or PDFs with custom size limits. Each file gets its own card with independent controls. Best for bulk formatting.

---

## How the Compression Engine Works

Most compressors pick a quality level, compress once, and hope for the best. If the output is 28 KB when the limit is 50 KB, they call it done — wasting 44% of possible image quality.

FormEase uses a **binary-search convergence loop**:

```
Given:  ceiling = 50 KB
Target: land between 92% and 98.5% of ceiling (46 KB – 49.25 KB)

Iteration 1:  quality = 0.52  →  62 KB  (too big, lower quality)
Iteration 2:  quality = 0.28  →  33 KB  (too small, raise quality)
Iteration 3:  quality = 0.40  →  44 KB  (under 92%, raise quality)
Iteration 4:  quality = 0.46  →  48.1 KB  ✓ (in the sweet spot — stop)

Result: 48.1 KB out of 50 KB — 96.2% of ceiling utilized
```

If the quality drops below 0.22 (unacceptable artifacts), the engine automatically downscales the canvas by 8–10% and re-runs the convergence. This guarantees the output is always visually clean.

For PDFs, the engine accounts for PDF structural overhead (~3–4 KB for xref tables, page dictionaries, catalog objects) by setting the image compression target to `ceiling - 4KB` before wrapping.

---

## Specialized Processing Pipelines

### Signature Ink Cleaning

When you photograph your signature on a desk with a phone camera, the result has grey shadows, paper texture, uneven lighting, and faded ink.

The binarization pipeline:
1. Analyzes the luminance histogram to find the paper's background brightness (70th percentile)
2. Every pixel above the bleach threshold → pure white (`#FFFFFF`)
3. Every dark pixel below threshold → multiplied by an ink-darkness factor for solid, scanner-quality strokes
4. Optional: preserves natural blue ink hue instead of converting to pure black

One-click preset buttons: **White Paper** (aggressive bleach), **Bold Ink** (maximum stroke darkness), **Clean Scan** (balanced).

### Document Enhancement

For marksheets and certificates:
- **Grayscale conversion** using ITU-R BT.709 coefficients — reduces file size by ~60%
- **Contrast boost** with configurable intensity (1.0× to 2.0×)
- **Text sharpening** via a 3×3 unsharp convolution kernel
- **Brightness adjustment** (-50 to +50) to clean dingy paper backgrounds

### EXIF Orientation Correction

Phone photos contain invisible EXIF metadata that can make images appear rotated in browsers. FormEase reads the raw EXIF orientation tag (0x0112) from the JPEG binary header and normalizes the canvas before any cropping or compression — so what you see in the viewfinder is exactly what you get in the download.

### Client-Side PDF Processing

- **PDF rendering** via `pdfjs-dist` — parses uploaded PDFs and renders pages to canvas without a server
- **PDF generation** via `pdf-lib` — wraps optimized canvas images back into compliant PDF files
- **Headroom guardrail** — subtracts 4 KB from the target ceiling before image compression to account for PDF wrapper structure

---

## Customization

### Adjustable Controls Per Slot

Every slot gives you control over:
- **File size ceiling** — drag a slider or type an exact KB limit
- **Pixel dimensions** — width and height with linked aspect-ratio lock
- **Aspect ratio presets** — common ratios (1:1, 35:45, 2:1, 4:5, A4, etc.)
- **Quick size presets** — one-click buttons for common limits (20 KB, 50 KB, 100 KB, 240 KB)

### Save Custom Presets

If your portal isn't in the default list, configure the exact limits you need and save the configuration as a named custom preset. It persists in your browser's local storage — next time you visit, your preset is waiting.

---

## Tech Stack

| Layer | Technology | Purpose |
|:---|:---|:---|
| **Framework** | React 19 + TypeScript 6 | Type-safe UI components |
| **Build** | Vite 8 | Fast dev server and optimized production builds |
| **Styling** | Tailwind CSS v4 | Utility-first responsive design |
| **State** | Zustand | Lightweight reactive store for slot processing states |
| **Image Engine** | HTML5 Canvas API | Client-side crop, resize, rotate, compress |
| **PDF Read** | pdfjs-dist | Client-side PDF page rendering |
| **PDF Write** | pdf-lib | Client-side compliant PDF generation |
| **ZIP Bundle** | JSZip + file-saver | In-browser ZIP packaging and download |
| **UI Primitives** | Radix UI | Accessible sliders, tooltips, dialogs, dropdowns |
| **Icons** | Lucide React | Consistent iconography |

---

## Project Structure

```
src/
├── App.tsx                              # Main application shell
├── main.tsx                             # Entry point
│
├── core/
│   ├── algorithms/
│   │   ├── binarySearchCompress.ts      # Near-ceiling quality convergence engine
│   │   ├── binarizeSignature.ts         # Signature ink cleaning pipeline
│   │   ├── documentEnhancer.ts          # Grayscale + contrast + sharpening
│   │   ├── exifCorrector.ts             # EXIF orientation normalization
│   │   └── pdfProcessor.ts             # PDF render + compliant PDF wrapping
│   ├── presets/
│   │   ├── defaultPresets.ts            # Built-in portal preset schemas
│   │   └── presetTypes.ts              # TypeScript type definitions
│   └── workers/
│       ├── workerBridge.ts              # Processing bridge interface
│       └── compression.worker.ts        # Web Worker for background processing
│
├── store/
│   ├── useDossierStore.ts               # Slot state, file processing, optimization
│   └── usePresetStore.ts                # Preset selection and custom preset storage
│
├── components/
│   ├── layout/
│   │   ├── Header.tsx                   # Top navigation bar with preset selector
│   │   ├── StepGuide.tsx                # 3-step visual progress indicator
│   │   └── Footer.tsx                   # Portal links, feature overview, credits
│   ├── queue/
│   │   ├── DossierSlotsView.tsx         # Guided mode — stacked horizontal slot cards
│   │   ├── SandboxQueueView.tsx         # Batch mode — multi-file card queue
│   │   └── slots/
│   │       ├── PhotoSlotCard.tsx         # Photo: viewfinder, face guide, crop controls
│   │       ├── SignatureSlotCard.tsx     # Signature: ink cleaner, paper bleach controls
│   │       └── DocumentSlotCard.tsx      # Document: grayscale, sharpen, PDF output
│   ├── common/
│   │   ├── ByteCounter.tsx              # Live animated byte usage bar
│   │   ├── SizeCeilingController.tsx    # File size limit slider with quick presets
│   │   ├── PixelDimensionController.tsx # Width × Height steppers with ratio lock
│   │   ├── StatusBadge.tsx              # Processing status indicator
│   │   ├── ActionButton.tsx             # Reusable button component
│   │   └── FormEaseLogo.tsx             # Brand logo
│   ├── export/
│   │   └── DossierExportModal.tsx       # Pre-flight audit + ZIP download modal
│   └── presets/
│       ├── PresetSelector.tsx           # Portal preset dropdown
│       └── CustomPresetModal.tsx        # Save custom preset dialog
│
├── hooks/
│   └── useOfflineTelemetry.ts           # Network privacy monitor
│
└── utils/
    ├── zipBundler.ts                    # ZIP assembly + validation summary generator
    ├── byteFormatter.ts                 # Human-readable byte/dimension formatting
    ├── fileSaver.ts                     # File download utility
    └── sampleDataGenerator.ts           # Demo data for empty states
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- npm (comes with Node.js)

### Install and Run

```bash
# Clone the repository
git clone https://github.com/RootDeveloperDS/FormEase.git
cd FormEase

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open `http://localhost:5173` in your browser.

### Build for Production

```bash
npm run build
```

The output goes to the `dist/` folder — a fully static bundle with no server dependencies.

---

## Accessibility

- Full keyboard navigation — Tab through every control, Arrow keys for crop nudging (1px default, 10px with Shift)
- Visible focus rings on all interactive elements
- Screen-reader announcements via `aria-live="polite"` for processing status changes
- High-contrast typography throughout (slate-100 on slate-950 backgrounds)
- Semantic HTML landmarks (`<header>`, `<main>`, `<nav>`, `<section>`) with ARIA labels

---

## License

MIT

---

*Built for the [HyperBloom October Hackathon](https://hyperbloom-october.devpost.com/) — UI/UX & Web Design track.*

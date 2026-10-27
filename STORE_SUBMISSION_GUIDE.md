# 🚀 Microsoft Store Submission Guide for Fluent Calculator

This comprehensive guide takes you step-by-step from building your production package to having **Fluent Calculator** published live on the **Microsoft Store**.

---

## 📋 Overview of Microsoft Store Options

Microsoft Store supports two submission formats for desktop applications:

1. **Option A: Packaged MSIX Application (Recommended)**
   - Modern Windows App container (`.msix`).
   - Clean, sandboxed installation and seamless 1-click updates through the Microsoft Store.
   - Built directly using our provided automated script: `pnpm run package:msix`.

2. **Option B: Win32 Installer (.exe / .msi)**
   - Microsoft Store allows standard Windows installers (`.exe` via NSIS or `.msi` via WiX).
   - Built with `pnpm tauri build`.
   - In Partner Center, you simply provide the installer file or a direct download URL.

---

## 🛠️ Step 1: Set Up Microsoft Partner Center Account

1. Go to the [Microsoft Partner Center](https://partner.microsoft.com/dashboard).
2. Sign in with your Microsoft account (e.g., your Outlook or business email).
3. Enroll in the **Windows & Xbox** developer program:
   - **Individual Account**: ~$19 USD one-time registration fee (no recurring cost).
   - **Company Account**: ~$99 USD one-time fee.
4. Complete your identity verification (typically verified within 24 hours).

---

## 🏷️ Step 2: Reserve Your App Name

1. In the Partner Center Dashboard, click **Apps and games** -> **New product**.
2. Select **MSIX or PWA app** (or Win32 if submitting an unpackaged installer).
3. Enter your desired app name (e.g. `Fluent Calculator`, `Modern Calculator for Windows`, or `[YourBrand] Calculator`).
4. Click **Check availability** and **Reserve product name**.

> [!NOTE]
> Once reserved, Partner Center will provide your official **Package/Identity/Name** and **Publisher ID** (e.g., `CN=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX`).

---

## 📦 Step 3: Build the Production MSIX Package

### 1. Update `AppxManifest.xml` with your Partner Center Details
Open `AppxManifest.xml` in this repository and match the `<Identity>` section with your Partner Center values:
```xml
<Identity
  Name="YOUR_PARTNER_CENTER_APP_NAME"
  Publisher="CN=YOUR_PUBLISHER_ID_FROM_PARTNER_CENTER"
  Version="1.0.0.0"
  ProcessorArchitecture="x64" />
```

### 2. Run the Automated MSIX Packaging Script
Open a terminal in the project directory and run:
```powershell
pnpm run package:msix -Release
```
Or run the PowerShell script directly:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\build-msix.ps1 -Release
```

The output will be created at:
```
dist-msix\FluentCalculator.msix
```

### 3. Local Side-loading / Testing (Optional)
To test the MSIX package on your own Windows computer before uploading:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\build-msix.ps1 -SignForTesting
```
Double-click `dist-msix\FluentCalculator.msix` to install and test!

---

## 📝 Step 4: Complete Partner Center Submission

Navigate to your app in Partner Center and start a new submission:

### 1. Pricing and Availability
- **Pricing**: Free (or select a price tier).
- **Markets**: All markets (recommended for maximum reach).
- **Visibility**: Public (discoverable in Store search).

### 2. Properties
- **Category**: `Productivity` -> `Utilities & tools`
- **Support Contact Info**: Your email or GitHub issues link.
- **Privacy Policy URL**: Link to your hosted privacy policy (a ready-to-use template is provided in `PRIVACY_POLICY.md`!).

### 3. Age Ratings
Complete the brief IARC questionnaire:
- App type: Utility / Tool
- Contains violence/profanity/gambling? -> **No**
- Shares personal data? -> **No**
- Result: **Rating 3+ (All Ages)** worldwide.

### 4. Packages
- Click **Add package**.
- Drag & drop `dist-msix\FluentCalculator.msix`.
- Partner Center will validate the package signature, architecture (x64), and capabilities.

### 5. Store Listing (Metadata & Screenshots)
- **Product Title**: `Fluent Calculator`
- **Short Description**:
  > A sleek, ultra-fast Windows 11 calculator with Standard, Scientific, Programmer, Unit Converter, and Date Calculation modes.
- **Detailed Description**:
  ```markdown
  Fluent Calculator brings the ultimate modern calculation experience to Windows 11. Designed with native Fluent acrylic aesthetics, high-precision math, and multitasking features.

  Key Features:
  • Standard Calculator: Fast arithmetic, live expressions, square roots, percentages, and memory operations (MC, MR, M+, M-, MS).
  • Scientific Calculator: Full trigonometry (DEG/RAD, 2nd functions), hyperbolic, powers, roots, logarithms (ln, log10), factorials, and mathematical constants (π, e).
  • Programmer Calculator: Instant switching between HEX, DEC, OCT, and BIN with QWORD, DWORD, WORD, and BYTE word sizes. Includes an interactive 64-bit bit toggler and bitwise operators (AND, OR, XOR, NOT, NAND, NOR, Lsh, Rsh, Rol, Ror).
  • Unit Converter: Instant two-way conversions for Length, Weight, Temperature, Data Storage, Speed, Volume, Time, Area, and Currency.
  • Date Calculation: Exact difference between dates and add/subtract duration calculator.
  • Always-on-Top & Compact Mini Mode: Pin the calculator over other applications for effortless side-by-side work.
  • Calculation History & Memory Drawer: Recall, copy, or review past expressions anytime.
  • Dark / Light Theme & Click Sound Feedback: Fluent styling matching your system preferences.
  ```
- **Keywords**: `calculator`, `scientific calculator`, `programmer calculator`, `unit converter`, `hex bin dec`, `math`, `fluent`, `windows 11`
- **Screenshots**: Take 2 to 4 screenshots of the app running in Standard, Scientific, Programmer, and Converter modes (1366x768 or 1920x1080).

---

## 🚀 Step 5: Submit for Certification

1. Review all checklist items in Partner Center (they should all have green checkmarks).
2. Click **Submit to the Store**.
3. **Certification Timeline**:
   - Automated ingestion scan: ~10–30 minutes.
   - Human review: typically **24 to 72 hours**.
4. Once certified, your app will automatically be published and available to over 1 billion Windows users worldwide!

---

## 🔄 Updating Your App in the Future

When you release an update:
1. Increment `"version"` in `package.json`, `AppxManifest.xml` (e.g. `1.0.1.0`), and `src-tauri/tauri.conf.json`.
2. Re-run `pnpm run package:msix -Release`.
3. In Partner Center, click **Update** -> upload the new `.msix` -> submit!

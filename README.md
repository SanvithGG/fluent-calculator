# 🧮 Fluent Calculator for Windows

A modern, high-performance desktop calculator application built for Windows 11 with the **exact same tech stack as prepcode** (Tauri v2 + React 19 + TypeScript + Tailwind CSS v4 + Vite).

Designed from the ground up for seamless publishing to the **Microsoft Store** as an MSIX package or native Win32 application.

---

## ✨ Features

- **Standard Mode**: Everyday calculations, percentages, square roots, squares, inverses, sign inversion, memory operations (`MC`, `MR`, `M+`, `M-`, `MS`).
- **Scientific Mode**: Trigonometry (`sin`, `cos`, `tan` with `DEG`/`RAD` toggle, 2nd functions), hyperbolic functions (`sinh`, `cosh`, `tanh`), logarithms (`ln`, `log10`), powers (`xʸ`, `10ˣ`, `eˣ`), factorials (`n!`), absolute values, and mathematical constants (`π`, `e`).
- **Programmer Mode**: Simultaneous real-time display and conversion across **HEX**, **DEC**, **OCT**, and **BIN**. Word size selector (**QWORD**, **DWORD**, **WORD**, **BYTE**), interactive 64-bit bit toggler grid, bitwise operations (`AND`, `OR`, `XOR`, `NOT`), and bit shifts (`Lsh`, `Rsh`, `Rol`, `Ror`).
- **Unit Converter**: Two-way interactive conversions across 9 categories: Length, Weight/Mass, Temperature, Data Storage, Speed, Time, Volume, Area, and Currency exchange.
- **Date Calculation**: Difference between two dates (years, months, weeks, days) and duration addition/subtraction.
- **Fluent Windows 11 Design**:
  - Mica/Acrylic glassmorphism with subtle drop shadows and responsive active press states.
  - Custom borderless titlebar with window controls (Minimize, Maximize, Close).
  - **Always-on-Top (Pin)**: Float above other windows for side-by-side multitasking.
  - **Compact / Mini PiP Mode**: Slim widget view for unobtrusive desktop placement.
  - **Sound Click Feedback**: Pleasant, subtle mechanical-style audio clicks synthesized via Web Audio API (with 1-click mute toggle).
  - **Theme Support**: Seamless switching between Dark, Light, and System modes.
  - **Persistent History & Memory**: Never lose a past computation; recall or copy past values with 1 click.

---

## 🛠️ Tech Stack

Identical to `prepcode`:
- **Desktop Runtime**: [Tauri v2](https://tauri.app/) (Rust + Microsoft Edge WebView2)
- **Frontend Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler**: [Vite](https://vite.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + `@tailwindcss/vite` + `tw-animate-css`
- **Typography**: `@fontsource/fira-sans`
- **Icons**: [Lucide React](https://lucide.dev/)
- **UI Primitives**: `@base-ui/react` + CVA + Classnames merging
- **Package Manager**: `pnpm`

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- pnpm (`npm install -g pnpm`)
- Rust toolchain (`rustc`, `cargo`)
- Windows 10/11 with Microsoft Edge WebView2 (installed by default on Windows 10/11)

### Development
1. Install dependencies:
   ```powershell
   pnpm install
   ```

2. Run in desktop development mode (with hot reload):
   ```powershell
   pnpm tauri dev
   ```

3. Run frontend only in the browser:
   ```powershell
   pnpm dev
   ```

4. Build the frontend:
   ```powershell
   pnpm build
   ```

---

## 🏪 Publishing to Microsoft Store

Full details are documented in [STORE_SUBMISSION_GUIDE.md](file:///s:/Tech_Coding/Projects/Calculator/STORE_SUBMISSION_GUIDE.md).

### Quick Packaging:
To generate the production `.msix` package:
```powershell
pnpm run package:msix -Release
```

The installer package will be output to:
```
dist-msix\FluentCalculator.msix
```

You can upload this package directly into the [Microsoft Partner Center](https://partner.microsoft.com/) under your app submission.

---

## 📄 License & Privacy
- Privacy policy: [PRIVACY_POLICY.md](file:///s:/Tech_Coding/Projects/Calculator/PRIVACY_POLICY.md)

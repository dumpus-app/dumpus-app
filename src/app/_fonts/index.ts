import localFont from "next/font/local";

// Rubik (v31) and JetBrains Mono (v24) as Google Fonts serves them, a file per
// script with its `unicode-range`: a page only downloads the scripts it shows,
// and only the Latin files are preloaded. `next/font/local` takes one range
// per call, so each script is a family of its own, and `fontFamily()` lists
// them in Google's order of precedence, then the fallback in `globals.css`.

const rubikArabic = localFont({
  src: "./rubik-arabic.woff2",
  weight: "300 900",
  style: "normal",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0600-06FF, U+0750-077F, U+0870-0891, U+0897-08E1, U+08E3-08FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE70-FE74, U+FE76-FEFC, U+102E0-102FB, U+10E60-10E7E, U+10EC2-10EC7, U+10EC9-10EEE, U+10EF0-10EFF, U+1EE00-1EE03, U+1EE05-1EE1F, U+1EE21-1EE22, U+1EE24, U+1EE27, U+1EE29-1EE32, U+1EE34-1EE37, U+1EE39, U+1EE3B, U+1EE42, U+1EE47, U+1EE49, U+1EE4B, U+1EE4D-1EE4F, U+1EE51-1EE52, U+1EE54, U+1EE57, U+1EE59, U+1EE5B, U+1EE5D, U+1EE5F, U+1EE61-1EE62, U+1EE64, U+1EE67-1EE6A, U+1EE6C-1EE72, U+1EE74-1EE77, U+1EE79-1EE7C, U+1EE7E, U+1EE80-1EE89, U+1EE8B-1EE9B, U+1EEA1-1EEA3, U+1EEA5-1EEA9, U+1EEAB-1EEBB, U+1EEF0-1EEF1",
    },
  ],
});

const rubikCyrillicExt = localFont({
  src: "./rubik-cyrillic-ext.woff2",
  weight: "300 900",
  style: "normal",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0460-052F, U+1C80-1C8A, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F",
    },
  ],
});

const rubikCyrillic = localFont({
  src: "./rubik-cyrillic.woff2",
  weight: "300 900",
  style: "normal",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116",
    },
  ],
});

const rubikHebrew = localFont({
  src: "./rubik-hebrew.woff2",
  weight: "300 900",
  style: "normal",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0307-0308, U+0590-05FF, U+200C-2010, U+20AA, U+25CC, U+FB1D-FB4F",
    },
  ],
});

const rubikLatinExt = localFont({
  src: "./rubik-latin-ext.woff2",
  weight: "300 900",
  style: "normal",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF",
    },
  ],
});

const rubikLatin = localFont({
  src: "./rubik-latin.woff2",
  weight: "300 900",
  style: "normal",
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD",
    },
  ],
});

const monoCyrillicExt = localFont({
  src: "./jetbrains-mono-cyrillic-ext.woff2",
  weight: "100 800",
  style: "normal",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0460-052F, U+1C80-1C8A, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F",
    },
  ],
});

const monoCyrillic = localFont({
  src: "./jetbrains-mono-cyrillic.woff2",
  weight: "100 800",
  style: "normal",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116",
    },
  ],
});

const monoGreek = localFont({
  src: "./jetbrains-mono-greek.woff2",
  weight: "100 800",
  style: "normal",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0370-0377, U+037A-037F, U+0384-038A, U+038C, U+038E-03A1, U+03A3-03FF",
    },
  ],
});

const monoVietnamese = localFont({
  src: "./jetbrains-mono-vietnamese.woff2",
  weight: "100 800",
  style: "normal",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB",
    },
  ],
});

const monoLatinExt = localFont({
  src: "./jetbrains-mono-latin-ext.woff2",
  weight: "100 800",
  style: "normal",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF",
    },
  ],
});

const monoLatin = localFont({
  src: "./jetbrains-mono-latin.woff2",
  weight: "100 800",
  style: "normal",
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD",
    },
  ],
});

function fontFamily(
  fonts: { style: { fontFamily: string } }[],
  fallback: string,
) {
  return [...fonts.map((font) => font.style.fontFamily), `"${fallback}"`].join(
    ", ",
  );
}

export const sansFamily = fontFamily(
  [
    rubikLatin,
    rubikLatinExt,
    rubikHebrew,
    rubikCyrillic,
    rubikCyrillicExt,
    rubikArabic,
  ],
  "Rubik Fallback",
);

export const monoFamily = fontFamily(
  [
    monoLatin,
    monoLatinExt,
    monoVietnamese,
    monoGreek,
    monoCyrillic,
    monoCyrillicExt,
  ],
  "JetBrains Mono Fallback",
);

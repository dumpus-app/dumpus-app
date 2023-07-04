import _tailwindColors from "tailwindcss/colors";

const {
  red,
  orange,
  amber,
  yellow,
  lime,
  green,
  emerald,
  teal,
  cyan,
  sky,
  blue,
  indigo,
  violet,
  purple,
  fuchsia,
  pink,
  rose,
} = _tailwindColors;

export function concatTemplateStringArgs(
  strings: TemplateStringsArray,
  expr: (string | number)[]
) {
  let str = "";
  strings.forEach((s, i) => {
    const v = expr[i];
    str +=
      s +
      (v
        ? (() => {
            switch (typeof v) {
              case "number":
                return v.toString();
              case "string":
              default:
                return v;
            }
          })()
        : "");
  });
  return str;
}

export function firstCharFromUnicode(str: string) {
  return [...str][0];
}

export const tailwindColors = [
  red,
  orange,
  amber,
  yellow,
  lime,
  green,
  emerald,
  teal,
  cyan,
  sky,
  blue,
  indigo,
  violet,
  purple,
  fuchsia,
  pink,
  rose,
];

export function shuffleArray<T>(array: T[]) {
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}

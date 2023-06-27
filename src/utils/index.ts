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

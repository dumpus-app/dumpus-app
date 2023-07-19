# Translating

Translations can be found in the `/locales` directory. We use Crowdin to manage them.

## Using Crowdin

Crowdin is the platform we use to manage translations.

* Create a Crowdin account [here](https://crowdin.com/join).
* Join the project [here](https://crowdin.com/project/dumpus-app).
* Select the language you want to translate. If it's not available, please open an issue on GitHub.
* You can now add support for your language!

## Adding translation strings

### Update `en.json`

```json
{
  "myNewField": "foo"
}
```

A few indications:

- Keys should be **camelCase**
- We can leverage [i18next features](https://www.i18next.com/translation-function/essentials)

### Import the `useTranslation` hook

**If the hook is used already, no need to duplicate imports**

Import depends on the type of component/hook (server or client), it should mostly be client ones.

So how do I know which type it it? Pretty simple, if the file has the `"use client"` directive at the top, then it's a client component.

#### Usage in server components

> If you need to achieve this, please first open an issue or a discussion on GitHub.

```tsx
// ...
import { useTranslation } from "~/i18n";
import type { PageProps } from "~/types";

export default async function Page({ params: { locale } }: PageProps) {
  const { t } = await useTranslation(locale);

  return <div>{t("myNewField")}</div>;
}
```

#### Usage in client components

```tsx
// ...
import { useTranslation } from "~/i18n/client";

export default function MyComponent() {
  const { t } = useTranslation();

  return <div>{t("myNewField")}</div>;
}
```

#### Usage in client hooks

```tsx
// ...
import { useTranslation } from "~/i18n/client";

export default function useMyNewField() {
  const { t } = useTranslation();

  return t("myNewField");
}
```

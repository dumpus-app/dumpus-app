"use client";

import i18next from "i18next";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import useSQL from "~/hooks/use-sql";
import { useTranslation } from "~/i18n";
import { PageProps } from "~/types";

// export default async function Page({ params: { locale } }: PageProps) {
//   const { t } = await useTranslation(locale);

//   return <div>Onboarding loading</div>;
// }

function DataDisplay() {
  const { db, resultAsList } = useSQL();
  return (
    <pre>
      {JSON.stringify(
        resultAsList(db?.exec("SELECT * FROM activity")[0]),
        null,
        2
      )}
    </pre>
  );
}

export default function Page() {
  const router = useRouter();
  const { init } = useSQL();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    init();
    setReady(true);
    // router.push(`/${i18next.language}/overview`);
  }, [init]);

  return (
    <div>
      <div>Onboarding loading...</div>
      {ready && <DataDisplay />}
    </div>
  );
}

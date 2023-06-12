"use client";

import i18next from "i18next";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import useSQL from "~/hooks/use-sql";
import { useTranslation } from "~/i18n";
import { PageProps } from "~/types";
import { Activity } from "~/types/sql";

// export default async function Page({ params: { locale } }: PageProps) {
//   const { t } = await useTranslation(locale);

//   return <div>Onboarding loading</div>;
// }

function DataDisplay() {
  const { db, resultAsList } = useSQL();
  return (
    <>
      <pre>
        {JSON.stringify(
          resultAsList<Activity>(db?.exec("SELECT * FROM activity")[0]),
          null,
          2
        )}
      </pre>
      <pre>
        {JSON.stringify(
          resultAsList<Activity>(
            db?.exec("SELECT * FROM activity WHERE count >= $count", {
              $count: 4,
            })[0]
          ),
          null,
          2
        )}
      </pre>
      <pre>
        {JSON.stringify(
          // @ts-expect-error
          resultAsList<Pick<Activity, "hour" | "count">>(
            db?.exec("SELECT hour, count FROM activity")[0]
          ),
          null,
          2
        )}
      </pre>
    </>
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
  }, [init, router]);

  return (
    <div>
      <div>Onboarding loading...</div>
      {ready && <DataDisplay />}
    </div>
  );

  return (
    <div className="flex flex-col items-center space-y-4">
      <span className="inline-flex h-16 w-16 animate-spin-slow rounded-full border-8 border-dotted border-brand-300"></span>
      <div className="max-w-xs text-center">
        <h1 className="text-xl font-bold text-white">
          We’re loading your data
        </h1>
        <p className="mt-2 text-gray-400">Please wait...</p>
      </div>
    </div>
  );
}

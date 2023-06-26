"use client";

import { useDataSources } from "./_shared";

export default function useUsageStatsData() {
  const { db, resultAsList, start, end } = useDataSources();

  function getNetworkSize() {
    const query = `
    SELECT
        COUNT(DISTINCT dm_user_id) as network_size
    FROM dm_channels_data;
    `;

    const data = resultAsList<{ network_size: number }>(db.exec(query)[0])[0];

    return data.network_size;
  }

  return {
    networkSize: getNetworkSize(),
  };
}

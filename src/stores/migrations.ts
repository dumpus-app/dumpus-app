// @ts-nocheck

export const migrateConfig = (persistedState: unknown, version: number) => {
  const { config } = persistedState;

  if (version === 0) {
    for (const pkg of config.packages) {
      pkg.package_is_partial = 0;
    }
    version++;
  }
  if (version === 1) {
    for (const pkg of config.packages) {
      delete pkg.shareImageData;
    }
    version++;
  }

  return persistedState as any;
};

export const migrateUsersCache = (persistedState: unknown, version: number) => {
  const { usersCache } = persistedState;

  return persistedState as any;
};

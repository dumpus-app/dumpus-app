// @ts-nocheck

export const migrateConfig = (persistedState: unknown, version: number) => {
  const { config } = persistedState;

  if (version === 0) {
    for (const pkg of config.packages) {
      // TODO: check if it's false or "0"
      pkg.package_is_partial = false;
    }
    version++;
  }

  return persistedState as any;
};

export const migrateUsersCache = (persistedState: unknown, version: number) => {
  const { usersCache } = persistedState;

  return persistedState as any;
};

export type PageProps<Params = {}, Props = {}> = Props & {
  params: {
    locale: string;
  } & Params;
};

export type WidgetAPIGuildResponse =
  | { error: string }
  | {
      error: undefined;
      name: string;
      icon_url: string;
      member_count: number;
    };

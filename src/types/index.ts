import { AcademicCapIcon } from "@heroicons/react/24/solid";
import { SVGProps } from "react";

export type PageProps<Params = {}, Props = {}> = Props & {
  params: {
    locale: string;
  } & Params;
};

export type Link = {
  name: string;
  href: string;
  active: (str: string) => boolean;
  icon: Icon;
};

export type Icon =
  | ((props: SVGProps<SVGSVGElement>) => JSX.Element)
  | typeof AcademicCapIcon;

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type Rename<T, K extends keyof T, N extends string> = Pick<
  T,
  Exclude<keyof T, K>
> & { [P in N]: T[K] };

export type Enumerate<
  N extends number,
  Acc extends number[] = []
> = Acc["length"] extends N
  ? Acc[number]
  : Enumerate<N, [...Acc, Acc["length"]]>;

export type Range<F extends number, T extends number> = Exclude<
  Enumerate<T>,
  Enumerate<F>
>;

export type NextErrorProps = {
  error: Error;
  reset: () => void;
};

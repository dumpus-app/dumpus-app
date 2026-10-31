"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Form from "~/components/Form";
import Button from "~/components/Button";
import { Disclosure, Transition } from "@headlessui/react";
import { useRouter } from "next/navigation";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";
import { useTranslation } from "~/i18n/client";
import RenderMarkdown from "~/components/RenderMarkdown";

function useSchema() {
  const { t } = useTranslation();

  const schema = z
    .object({
      discordLink: z
        .string({
          error: (issue) =>
            issue.input === undefined
              ? t("onboarding.access.methods.link.errors.required")
              : undefined,
        })
        .url(t("onboarding.access.methods.link.errors.url")),
      backendURL: z
        .string()
        .url(t("onboarding.access.methods.link.errors.url"))
        .or(z.literal("")),
    })
    .refine(
      (data) =>
        data.discordLink.startsWith("https://click.discord.com/ls/click?upn="),
      {
        message: t("onboarding.access.methods.link.errors.startWith", {
          url: "https://click.discord.com/ls/click?upn=",
          interpolation: { escapeValue: false },
        }),
        path: ["discordLink"],
      },
    )
    .refine(
      (data) => {
        try {
          const UPNKey = new URL(data.discordLink).searchParams.get("upn");
          return UPNKey && UPNKey !== "";
        } catch (err) {
          return true;
        }
      },
      {
        message: t("onboarding.access.methods.link.errors.emptyKey"),
        path: ["discordLink"],
      },
    );

  return schema;
}

export default function LinkForm() {
  const { t } = useTranslation();
  const router = useRouter();

  const schema = useSchema();
  type Schema = z.infer<typeof schema>;
  const form = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: {
      discordLink: "",
      backendURL: "",
    },
  });

  function onSubmit({ discordLink, backendURL }: Schema) {
    router.push(
      `/onboarding/loading/?packageLink=${encodeURIComponent(
        discordLink,
      )}&backendURL=${encodeURIComponent(backendURL)}`,
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid w-full grid-cols-1 gap-4"
      >
        <Form.Field
          control={form.control}
          name="discordLink"
          render={({ field }) => (
            <Form.Item>
              <Form.InputContainer>
                <Form.Label>
                  {t("onboarding.access.methods.link.discordLink")}
                </Form.Label>
                <Form.Control>
                  <Form.Input
                    {...field}
                    placeholder="https://click.discord.com/ls/click?upn=123456"
                    type="url"
                  />
                </Form.Control>
              </Form.InputContainer>
              <Form.Message />
            </Form.Item>
          )}
        />
        <Disclosure>
          {({ open }) => (
            <>
              <Disclosure.Button className="mx-auto pressable text-gray-400 [--press-scale:0.96] hover:text-white active:text-white">
                <div className="flex items-center">
                  <span>{t("onboarding.access.methods.link.advanced")}</span>
                  <ChevronDownIcon
                    className={clsx(
                      "ml-1 h-5 w-5 duration-200 ease-out motion-safe:transition-transform",
                      open ? "rotate-180 transform" : "",
                    )}
                  />
                </div>
              </Disclosure.Button>
              <Transition
                enter="transition duration-150 ease-out"
                enterFrom="motion-safe:scale-95 opacity-0"
                enterTo="scale-100 opacity-100"
                leave="transition duration-100 ease-out"
                leaveFrom="scale-100 opacity-100"
                leaveTo="motion-safe:scale-95 opacity-0"
              >
                <Disclosure.Panel>
                  <Form.Field
                    control={form.control}
                    name="backendURL"
                    render={({ field }) => (
                      <Form.Item>
                        <Form.InputContainer>
                          <Form.Label>
                            {t("onboarding.access.methods.link.backendURL")} (
                            {t("onboarding.access.methods.link.optional")})
                          </Form.Label>
                          <Form.Control>
                            <Form.Input
                              {...field}
                              placeholder="https://..."
                              type="url"
                            />
                          </Form.Control>
                        </Form.InputContainer>
                        <Form.Description>
                          {t("onboarding.access.methods.link.backendURLHint")}
                        </Form.Description>
                        <Form.Message />
                      </Form.Item>
                    )}
                  />
                </Disclosure.Panel>
              </Transition>
            </>
          )}
        </Disclosure>
        <div className="max-w-xs text-center">
          <p className="text-gray-400 transition [&>a]:text-brand-300 [&>a]:underline [&>a]:hover:text-brand-400">
            <RenderMarkdown
              content={t("onboarding.access.methods.link.notice")}
            />
          </p>
        </div>
        <Button type="submit" className="w-full">
          {t("onboarding.access.methods.link.explore")}
        </Button>
      </form>
    </Form>
  );
}

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Form from "~/components/Form";
import Button from "~/components/Button";
import { Disclosure, Transition } from "@headlessui/react";
import { useRouter } from "next/navigation";
import i18next from "i18next";
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
          required_error: t("onboarding.access.methods.link.errors.required"),
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
      `/${
        i18next.language
      }/onboarding/loading/?packageLink=${encodeURIComponent(
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
              <Disclosure.Button className="mx-auto text-gray-400 transition-colors hover:text-white">
                <div className="flex items-center">
                  <span>{t("onboarding.access.methods.link.advanced")}</span>
                  <ChevronDownIcon
                    className={clsx(
                      "ml-1 h-5 w-5 transition-transform duration-300 ease-in-out",
                      open ? "rotate-180 transform" : "",
                    )}
                  />
                </div>
              </Disclosure.Button>
              <Transition
                enter="transition duration-100 ease-out"
                enterFrom="transform scale-95 opacity-0"
                enterTo="transform scale-100 opacity-100"
                leave="transition duration-75 ease-out"
                leaveFrom="transform scale-100 opacity-100"
                leaveTo="transform scale-95 opacity-0"
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
          <p className="text-gray-400 transition [&>a]:text-brand-300 [&>a]:underline hover:[&>a]:text-brand-400">
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

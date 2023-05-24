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

const schema = z.object({
  discordLink: z
    .string({ required_error: "Required" })
    .url("Invalid Discord Link"),
  backendURL: z.string().url("Invalid URL").or(z.literal("")),
});

type Schema = z.infer<typeof schema>;

export default function LinkForm() {
  const router = useRouter();
  const form = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: {
      discordLink: "",
      backendURL: "",
    },
  });

  function onSubmit(values: Schema) {
    console.log(values);
    router.push(`${i18next.language}/onboarding/loading`);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid grid-cols-1 gap-4"
      >
        <Form.Field
          control={form.control}
          name="discordLink"
          render={({ field }) => (
            <Form.Item>
              <Form.InputContainer>
                <Form.Label>Discord link</Form.Label>
                <Form.Control>
                  <Form.Input {...field} placeholder="https://..." type="url" />
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
                  <span>Advanced</span>
                  <ChevronDownIcon
                    className={clsx(
                      "ml-1 h-5 w-5 transition-transform duration-300 ease-in-out",
                      open ? "rotate-180 transform" : ""
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
                          <Form.Label>Backend URL (optional)</Form.Label>
                          <Form.Control>
                            <Form.Input
                              {...field}
                              placeholder="https://..."
                              type="url"
                            />
                          </Form.Control>
                        </Form.InputContainer>
                        <Form.Description>
                          Your own hosted open source server URL
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
          <p className="text-gray-400">
            By proceeding, you agree to our privacy policy and our terms.
          </p>
        </div>
        <Button type="submit" className="w-full">
          Explore!
        </Button>
      </form>
    </Form>
  );
}

"use client";
import {
  Field,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";

import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const classIds = ["CLS001", "CLS002", "CLS003"];
const classNames = ["Bachelor Class", "Associate Class", "Scholarship Class"];
const shifts = ["Morning", "Afternoon", "Evening"];

export default function RequirePermissionForm() {
  const formSchema = z.object({
    "text-0": z.string(),
    "student-id": z.string(),
    "student-name": z.string(),
    "class-id": z.string(),
    "class-name": z.string(),
    shift: z.string(),
    "permission-type": z.string(),
    reason: z.string(),
    submit: z.string().optional(),
    cancel: z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      "text-0": "",
      "student-id": "",
      "student-name": "",
      "class-id": "",
      "class-name": "",
      shift: "",
      "permission-type": "",
      reason: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
  }

  function onReset() {
    form.reset();
    form.clearErrors();
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      onReset={onReset}
      className="w-full"
    >
      <div className="grid gap-5">
        <div key="text-0" id="text-0" className="space-y-1">
          <h1 className="text-xl font-semibold">Permission Require</h1>
          <p className="text-sm text-muted-foreground">
            Submit your class permission request details.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Controller
            control={form.control}
            name="student-id"
            render={({ field, fieldState }) => (
              <Field
                className="flex self-end flex-col gap-2 space-y-0 items-start"
                data-invalid={fieldState.invalid}
              >
                <FieldLabel className="flex w-auto!">Student ID</FieldLabel>

                <Input
                  key="text-input-0"
                  placeholder=""
                  type="text"
                  className="w-full"
                  {...field}
                />

                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="student-name"
            render={({ field, fieldState }) => (
              <Field
                className="flex self-end flex-col gap-2 space-y-0 items-start"
                data-invalid={fieldState.invalid}
              >
                <FieldLabel className="flex w-auto!">Student Name</FieldLabel>

                <Input
                  key="text-input-1"
                  placeholder=""
                  type="text"
                  className="w-full"
                  {...field}
                />

                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Controller
            control={form.control}
            name="class-id"
            render={({ field, fieldState }) => (
              <Field
                className="flex self-end flex-col gap-2 space-y-0 items-start"
                data-invalid={fieldState.invalid}
              >
                <FieldLabel className="flex w-auto!">Class ID</FieldLabel>

                <Combobox
                  items={classIds}
                  name={field.name}
                  value={field.value || null}
                  onValueChange={(value) => field.onChange(value ?? "")}
                >
                  <ComboboxInput
                    ref={field.ref}
                    onBlur={field.onBlur}
                    placeholder="Select class ID"
                    className="w-full"
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>No items found.</ComboboxEmpty>
                    <ComboboxList>
                      {(item) => (
                        <ComboboxItem key={item} value={item}>
                          {item}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>

                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="class-name"
            render={({ field, fieldState }) => (
              <Field
                className="flex self-end flex-col gap-2 space-y-0 items-start"
                data-invalid={fieldState.invalid}
              >
                <FieldLabel className="flex w-auto!">Class Name</FieldLabel>

                <Combobox
                  items={classNames}
                  name={field.name}
                  value={field.value || null}
                  onValueChange={(value) => field.onChange(value ?? "")}
                >
                  <ComboboxInput
                    ref={field.ref}
                    onBlur={field.onBlur}
                    placeholder="Select class name"
                    className="w-full"
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>No items found.</ComboboxEmpty>
                    <ComboboxList>
                      {(item) => (
                        <ComboboxItem key={item} value={item}>
                          {item}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>

                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="shift"
            render={({ field, fieldState }) => (
              <Field
                className="flex self-end flex-col gap-2 space-y-0 items-start"
                data-invalid={fieldState.invalid}
              >
                <FieldLabel className="flex w-auto!">Shift</FieldLabel>

                <Combobox
                  items={shifts}
                  name={field.name}
                  value={field.value || null}
                  onValueChange={(value) => field.onChange(value ?? "")}
                >
                  <ComboboxInput
                    ref={field.ref}
                    onBlur={field.onBlur}
                    placeholder="Select shift"
                    className="w-full"
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>No items found.</ComboboxEmpty>
                    <ComboboxList>
                      {(item) => (
                        <ComboboxItem key={item} value={item}>
                          {item}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>

                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>
        <Controller
          control={form.control}
          name="permission-type"
          render={({ field, fieldState }) => (
            <Field
              className="flex self-end flex-col gap-2 space-y-0 items-start"
              data-invalid={fieldState.invalid}
            >
              <FieldLabel className="flex w-auto!">Permission Type</FieldLabel>

              <NativeSelect
                key="native-select-0"
                id="permission-type"
                name="permission-type"
                className="w-full"
                value={field.value ?? ""}
                onChange={(event) => field.onChange(event.target.value)}
                onBlur={field.onBlur}
                ref={field.ref}
              >
                <NativeSelectOption value="late">Late</NativeSelectOption>
                <NativeSelectOption value="permission">
                  Permission
                </NativeSelectOption>
              </NativeSelect>

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="reason"
          render={({ field, fieldState }) => (
            <Field
              className="flex self-end flex-col gap-2 space-y-0 items-start"
              data-invalid={fieldState.invalid}
            >
              <FieldLabel className="flex w-auto!">Reason</FieldLabel>

              <Textarea
                key="textarea-0"
                id="reason"
                placeholder=""
                className="min-h-32 w-full"
                {...field}
              />

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <div className="grid gap-3 sm:grid-cols-2">

          <Controller
            control={form.control}
            name="cancel"
            render={({ fieldState }) => (
              <Field
                className="flex self-end flex-col gap-2 space-y-0 items-start"
                data-invalid={fieldState.invalid}
              >
                <FieldLabel className="hidden w-auto!">Reset</FieldLabel>

                <Button
                  key="reset-button-0"
                  id="cancel"
                  name="cancel"
                  className="w-full"
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>

                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
                    <Controller
            control={form.control}
            name="submit"
            render={({ fieldState }) => (
              <Field
                className="flex self-end flex-col gap-2 space-y-0 items-start"
                data-invalid={fieldState.invalid}
              >
                <FieldLabel className="hidden w-auto!">Submit</FieldLabel>

                <Button
                  key="submit-button-0"
                  id="submit"
                  name="submit"
                  className="w-full"
                  type="submit"
                  variant="default"
                >
                  Submit
                </Button>

                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>
      </div>
    </form>
  );
}

import { FieldProps } from "formik";
import { ReactNode, TextareaHTMLAttributes } from "react";

import { InputSize } from "@/components/atoms/Input";
import TextArea from "@/components/atoms/TextArea";
import { HelperText, InputLabel } from "@/components/atoms/TextField";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  helperText?: ReactNode;
  field?: FieldProps;
  tooltipText?: string;
  inputSize?: InputSize;
} & (
    | {
        error?: string;
        warning?: never;
      }
    | { warning?: string; error?: never }
  );

export default function TextAreaField({
  label,
  helperText,
  error,
  warning,
  tooltipText,
  inputSize = InputSize.LARGE,
  ...props
}: Props) {
  return (
    <div>
      <InputLabel inputSize={inputSize} label={label} tooltipText={tooltipText} />
      <TextArea isError={Boolean(error)} isWarning={Boolean(warning)} {...props} />
      <HelperText helperText={helperText} error={error} warning={warning} />
    </div>
  );
}

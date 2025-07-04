import Alert from "@repo/ui/alert";
import Tooltip from "@repo/ui/tooltip";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import React, {
  ButtonHTMLAttributes,
  PropsWithChildren,
  useCallback,
  useMemo,
  useState,
} from "react";
import { NumericFormat, NumericFormatProps } from "react-number-format";

import {
  defaultTypes,
  SlippageType,
  useSwapSettingsStore,
  values,
} from "@/app/[locale]/swap/stores/useSwapSettingsStore";
import DialogHeader from "@/components/atoms/DialogHeader";
import DrawerDialog from "@/components/atoms/DrawerDialog";
import Input from "@/components/atoms/Input";
import Svg from "@/components/atoms/Svg";
import Button, { ButtonColor } from "@/components/buttons/Button";
import TextButton from "@/components/buttons/TextButton";
import { useTransactionSettingsDialogStore } from "@/components/dialogs/stores/useTransactionSettingsDialogStore";
import { ThemeColors } from "@/config/theme/colors";
import { clsxMerge } from "@/functions/clsxMerge";
import { useColorScheme } from "@/lib/color-scheme";
import addToast from "@/other/toast";

function SettingsButtons({ children }: PropsWithChildren) {
  return <div className="grid rounded-2 flex-grow grid-cols-4 gap-2 lg:gap-3">{children}</div>;
}

interface SettingsButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  text: string;
  isActive?: boolean;
  colorScheme?: ThemeColors;
}

function SettingsButton({
  text,
  isActive = false,
  className,
  colorScheme = ThemeColors.GREEN,
  ...props
}: SettingsButtonProps) {
  return (
    <button
      {...props}
      className={clsxMerge(
        "duration-200 px-6 w-full border flex items-center justify-center rounded-2 text-12 lg:text-16 h-10 md:h-12",
        isActive
          ? {
              [ThemeColors.GREEN]:
                "bg-green-bg shadow shadow-green/60 border-green text-primary-text",
              [ThemeColors.PURPLE]:
                "bg-purple-bg shadow shadow-purple/60 border-purple text-primary-text",
            }[colorScheme]
          : {
              [ThemeColors.GREEN]:
                "bg-tertiary-bg border-transparent hocus:bg-green-bg text-secondary-text",
              [ThemeColors.PURPLE]:
                "bg-tertiary-bg border-transparent hocus:bg-purple-bg text-secondary-text",
            }[colorScheme],
        className,
      )}
    >
      {text}
    </button>
  );
}

type SettingsInputProps = NumericFormatProps & {
  isError?: boolean;
  isActive?: boolean;
  colorScheme?: ThemeColors;
};
function SettingsInput({
  isActive,
  isError,
  colorScheme = ThemeColors.GREEN,
  ...props
}: SettingsInputProps) {
  return (
    <NumericFormat
      inputMode="decimal"
      allowedDecimalSeparators={[","]}
      isAllowed={(values) => {
        const { floatValue } = values;
        if (values.value === "00" || values.value === "0.0") {
          return false;
        }

        if (values.value === "" || values.value === "0" || values.value === "0.") {
          return true;
        }

        return typeof floatValue !== "undefined" && floatValue < 99;
      }}
      allowNegative={false}
      {...props}
      className={clsx(
        " focus:outline-0  rounded-2 duration-200 py-1.5 md:py-2.5 px-1.5 md:px-3 text-center placeholder:text-center placeholder:text-secondary-text w-full border text-12 lg:text-16",
        isActive &&
          !isError &&
          {
            [ThemeColors.GREEN]:
              "bg-green-bg shadow shadow-green/60 border-green text-primary-text hocus:bg-green-bg",
            [ThemeColors.PURPLE]:
              "bg-purple-bg shadow shadow-purple/60 border-purple text-primary-text hocus:bg-purple-bg ",
          }[colorScheme],
        isError &&
          "bg-secondary-bg shadow shadow-red/60 border-red-light text-primary-text hocus:bg-red-bg",
        !isError &&
          !isActive &&
          {
            [ThemeColors.GREEN]:
              "focus:border-green bg-secondary-bg border-transparent hocus:bg-green-bg text-secondary-text focus:bg-green-bg focus::shadow focus::shadow-green/60",
            [ThemeColors.PURPLE]:
              "focus:border-green bg-secondary-bg border-transparent hocus:bg-purple-bg text-secondary-text focus:bg-purple-bg focus::shadow focus::shadow-purple/60",
          }[colorScheme],
      )}
    />
  );
}

function getTitle(slippageType: SlippageType, value: string, t: any) {
  switch (slippageType) {
    case SlippageType.LOW:
    case SlippageType.MEDIUM:
    case SlippageType.HIGH:
      return `${values[slippageType]}%`;

    case SlippageType.AUTO:
      return `${value}% ${t("auto")}`;
    case SlippageType.CUSTOM:
      return (
        <div
          className={clsx(
            "flex items-center gap-2",
            Boolean(+value) && (+value > 1 || +value < 0.05) && "text-orange",
            +value > 50 && "text-red-light",
          )}
        >
          {value}% {t("custom")}{" "}
          {Boolean(+value) && (+value > 1 || +value < 0.05) && <Svg iconName="warning" />}
        </div>
      );
  }
}

function SwapSettingsDialogContent() {
  const colorScheme = useColorScheme();
  const { isOpen, setIsOpen } = useTransactionSettingsDialogStore();

  const t = useTranslations("Swap");

  const {
    setSlippage,
    setDeadline,
    deadline,
    slippage,
    slippageType: _slippageType,
    setSlippageType: _setSlippageType,
  } = useSwapSettingsStore();

  const [customSlippage, setCustomSlippage] = useState(
    _slippageType === SlippageType.CUSTOM ? slippage.toString() : "",
  );
  const [customDeadline, setCustomDeadline] = useState(deadline.toString());
  const [slippageType, setSlippageType] = useState<SlippageType>(_slippageType);

  const handleSave = useCallback(() => {
    setDeadline(+customDeadline);

    switch (slippageType) {
      case SlippageType.LOW:
        setSlippage(values[SlippageType.LOW]);
        break;
      case SlippageType.MEDIUM:
        setSlippage(values[SlippageType.MEDIUM]);
        break;
      case SlippageType.HIGH:
        setSlippage(values[SlippageType.HIGH]);
        break;
      case SlippageType.AUTO:
        setSlippage(values[SlippageType.MEDIUM]);
        break;
      case SlippageType.CUSTOM:
        setSlippage(+customSlippage);
        break;
    }

    _setSlippageType(slippageType);

    setIsOpen(false);
    addToast(t("settings_applied"));
  }, [
    _setSlippageType,
    customDeadline,
    customSlippage,
    setDeadline,
    setIsOpen,
    setSlippage,
    slippageType,
    t,
  ]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);

    setTimeout(() => {
      if (_slippageType !== SlippageType.CUSTOM) {
        setCustomSlippage("");
      }

      setSlippageType(_slippageType);
      setCustomDeadline(deadline.toString());
    }, 400);
  }, [_slippageType, deadline, setIsOpen]);

  const slippageError = useMemo(() => {
    if (slippageType === SlippageType.CUSTOM) {
      return +customSlippage > 50 || !Boolean(+customSlippage);
    }
  }, [customSlippage, slippageType]);

  const slippageChanged = useMemo(() => {
    if (slippageType !== _slippageType) {
      return true;
    }

    if (slippageType === SlippageType.CUSTOM) {
      if (+customSlippage !== slippage) {
        return true;
      }
    }

    return false;
  }, [_slippageType, customSlippage, slippage, slippageType]);

  const deadlineChanged = useMemo(() => {
    return +customDeadline !== deadline;
  }, [customDeadline, deadline]);

  const deadlineError = useMemo(() => {
    if (customDeadline === "") {
      return "Deadline cannot be empty";
    }
    if (+customDeadline < 1) {
      return "Deadline cannot be lower then 1";
    }
    if (+customDeadline > 4000) {
      return "Maximum deadline value is 4000 minutes";
    }
  }, [customDeadline]);

  const isButtonDisabled = useMemo(() => {
    return (
      Boolean(deadlineError) || Boolean(slippageError) || (!slippageChanged && !deadlineChanged)
    );
  }, [deadlineChanged, deadlineError, slippageChanged, slippageError]);

  return (
    <div className="px-4 md:px-6 lg:px-10 pb-4 md:pb-10 w-full md:w-[600px]">
      <div className="flex justify-between items-center mb-1">
        <div className="flex gap-1 items-center">
          <h3 className="font-bold text-16">{t("maximum_slippage")}</h3>
          <Tooltip text={t("slippage_tooltip")} />
        </div>
        <span className="text-secondary-text">{getTitle(slippageType, customSlippage, t)}</span>
      </div>
      <div className="flex gap-3 md:gap-5">
        <span>
          <SettingsButton
            colorScheme={colorScheme}
            onClick={() => {
              setSlippageType(SlippageType.AUTO);
              setCustomSlippage("0.5");
            }}
            isActive={slippageType === SlippageType.AUTO}
            text={t("auto")}
            className="w-[58px] md:w-full"
          />
        </span>
        <SettingsButtons>
          {defaultTypes.map((sl) => {
            return (
              <SettingsButton
                colorScheme={colorScheme}
                key={sl}
                onClick={() => setSlippageType(sl)}
                isActive={slippageType === sl}
                text={`${values[sl]}%`}
              />
            );
          })}
          <SettingsInput
            colorScheme={colorScheme}
            onFocus={() => setSlippageType(SlippageType.CUSTOM)}
            placeholder={t("custom")}
            value={customSlippage}
            onChange={(e) => setCustomSlippage(e.target.value)}
            isActive={slippageType === SlippageType.CUSTOM}
            isError={+customSlippage > 50 && slippageType === SlippageType.CUSTOM}
          />
        </SettingsButtons>
      </div>
      {+customSlippage > 1 && +customSlippage < 50 && slippageType === SlippageType.CUSTOM && (
        <div className="mt-3">
          <Alert
            type="warning"
            text="Slippage tolerance above 1% could result in an unfavorable exchange rate. It’s recommended to use the auto setting unless you know what you’re doing."
          />
        </div>
      )}
      {+customSlippage > 50 && slippageType === SlippageType.CUSTOM && (
        <div className="mt-3">
          <Alert type="error" text="Max slippage cannot exceed 50%" />
        </div>
      )}
      {+customSlippage < 0.05 &&
        Boolean(+customSlippage) &&
        slippageType === SlippageType.CUSTOM && (
          <div className="mt-3">
            <Alert type="warning" text="Slippage below 0.05% may result in a failed transaction" />
          </div>
        )}

      <div className="mt-5">
        <div className="flex justify-between items-center">
          <p className={clsx("text-16 font-bold mb-1 flex items-center gap-1")}>
            {t("transaction_deadline")}
            <Tooltip iconSize={24} text={t("deadline_tooltip")} />
          </p>
          {+customDeadline !== 20 && (
            <TextButton
              colorScheme={colorScheme}
              className="pr-0"
              endIcon="reset"
              onClick={() => setCustomDeadline("20")}
            >
              {t("set_default")}
            </TextButton>
          )}
        </div>

        <div className="relative">
          <NumericFormat
            allowedDecimalSeparators={[","]}
            className="pr-[100px] mb-0"
            value={customDeadline}
            onValueChange={(values) => {
              setCustomDeadline(values.value);
            }}
            isError={+customDeadline > 4000 || +customDeadline < 1}
            allowNegative={false}
            customInput={Input}
            inputMode="decimal"
            colorScheme={colorScheme}
          />
          <span className="absolute right-5 top-1/2 -translate-y-1/2 text-secondary-text">
            {t("minutes")}
          </span>
        </div>
        <div className="h-3 text-12 text-red-light">{deadlineError && deadlineError}</div>

        <div className="text-12 mt-0.5 h-4" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          colorScheme={
            colorScheme === ThemeColors.GREEN ? ButtonColor.LIGHT_GREEN : ButtonColor.LIGHT_PURPLE
          }
          fullWidth
          onClick={handleCancel}
        >
          {t("cancel")}
        </Button>
        <Button
          colorScheme={colorScheme === ThemeColors.GREEN ? ButtonColor.GREEN : ButtonColor.PURPLE}
          disabled={isButtonDisabled}
          fullWidth
          onClick={handleSave}
        >
          {t("save_settings")}
        </Button>
      </div>
    </div>
  );
}

export default function SwapSettingsDialog() {
  const { isOpen, setIsOpen } = useTransactionSettingsDialogStore();
  const t = useTranslations("Swap");

  return (
    <DrawerDialog isOpen={isOpen} setIsOpen={setIsOpen}>
      <DialogHeader onClose={() => setIsOpen(false)} title={t("settings")} />
      <SwapSettingsDialogContent />
    </DrawerDialog>
  );
}

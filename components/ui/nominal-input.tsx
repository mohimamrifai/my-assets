import React, { useState, useEffect } from "react";
import { Input } from "./input";

interface NominalInputProps extends Omit<React.ComponentProps<"input">, "value" | "onChange"> {
  value?: number | string | null;
  onChange?: (value: number | undefined) => void;
}

export const NominalInput = React.forwardRef<HTMLInputElement, NominalInputProps>(
  ({ value, onChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState("");

    // Helper to format string into dotted format
    const formatNominal = (val: string) => {
      // Remove all characters except numbers and comma
      const numberString = val.replace(/[^,\d]/g, "").toString();
      const split = numberString.split(",");
      const sisa = split[0].length % 3;
      let result = split[0].substr(0, sisa);
      const ribuan = split[0].substr(sisa).match(/\d{3}/gi);

      if (ribuan) {
        const separator = sisa ? "." : "";
        result += separator + ribuan.join(".");
      }

      result = split[1] !== undefined ? result + "," + split[1] : result;
      
      // If it originally started with negative, preserve it (optional, but good for safety)
      if (val.startsWith("-")) {
        return "-" + result;
      }
      return result;
    };

    // Helper to parse dotted format into number
    const parseNominal = (val: string) => {
      const parsed = parseFloat(val.replace(/\./g, "").replace(",", "."));
      return isNaN(parsed) ? undefined : parsed;
    };

    // Initialize or update display value from external value
    useEffect(() => {
      if (value === undefined || value === null || value === "") {
        setDisplayValue("");
        return;
      }
      
      // Convert external value to string, replacing dot with comma for our formatting
      const strValue = value.toString().replace(".", ",");
      const incomingParsed = parseNominal(strValue);
      const currentParsed = parseNominal(displayValue);
      
      // Only update display value if the actual numeric value has changed externally
      // This prevents the cursor from jumping and allows typing decimals like "100,"
      if (incomingParsed !== currentParsed) {
        setDisplayValue(formatNominal(strValue));
      }
    }, [value, displayValue]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Preserve negative sign if typed
      const rawValue = e.target.value;
      const isNegative = rawValue.startsWith("-");
      
      const formatted = formatNominal(rawValue);
      const finalFormatted = isNegative && !formatted.startsWith("-") ? "-" + formatted : formatted;
      
      setDisplayValue(finalFormatted);
      
      if (onChange) {
        onChange(parseNominal(finalFormatted));
      }
    };

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        value={displayValue}
        onChange={handleChange}
      />
    );
  }
);

NominalInput.displayName = "NominalInput";

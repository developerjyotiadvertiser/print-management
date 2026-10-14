import { useState } from "react";
import {
  FaCalculator,
  FaTimes,
  FaExchangeAlt,
  FaRegCopy,
  FaCheck,
} from "react-icons/fa";
import { TbArrowsExchange } from "react-icons/tb";

export default function FloatingUnitConverter() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversion, setConversion] = useState("inchToFeet");
  const [value, setValue] = useState("");
  const [copied, setCopied] = useState(false);

  const isInchToFeet = conversion === "inchToFeet";

  const result =
    value.trim() === "" || !Number.isFinite(Number(value))
      ? ""
      : isInchToFeet
        ? Number(value) / 12
        : Number(value) * 12;

  const formattedResult =
    result === "" ? "" : Number(result.toFixed(4)).toString();

  const toggleConversion = () => {
    setConversion((prev) =>
      prev === "inchToFeet" ? "feetToInch" : "inchToFeet",
    );
    setValue("");
    setCopied(false);
  };

  const handleCopy = async () => {
    if (formattedResult === "") return;

    try {
      await navigator.clipboard.writeText(formattedResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error("Unable to copy result:", error);
    }
  };

  return (
    <div className="fixed bottom-24 right-6 z-[9999] font-sans">
      {/* Floating Icon */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          title="Unit Converter"
          aria-label="Open unit converter"
          className="flex h-14 w-14 items-center justify-center
            rounded-full bg-[#ed3237] text-white shadow-xl
            transition-all duration-200 hover:scale-110
            hover:bg-red-700 focus:outline-none
            focus:ring-4 focus:ring-red-200"
        >
          <TbArrowsExchange size={23} />
        </button>
      )}

      {/* Floating Window */}
      {isOpen && (
        <div
          className="w-[320px] max-w-[calc(100vw-32px)]
            overflow-hidden rounded-2xl border border-gray-200
            bg-white shadow-2xl"
        >
          {/* Header */}
          <div
            className="flex items-center justify-between
            bg-[#ed3237] px-4 py-3 text-white"
          >
            <div className="flex items-center gap-2">
              <FaCalculator size={18} />

              <div>
                <h3 className="text-sm font-semibold">Unit Converter</h3>
                <p className="text-xs text-red-100">Inches & Feet</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close converter"
              className="rounded-lg p-2 transition hover:bg-white/20"
            >
              <FaTimes size={16} />
            </button>
          </div>

          <div className="space-y-4 p-4">
            {/* Conversion Direction */}
            <div>
              <label
                className="mb-2 block text-xs font-semibold
                uppercase tracking-wide text-gray-500"
              >
                Conversion
              </label>

              <button
                type="button"
                onClick={toggleConversion}
                className="flex w-full items-center justify-between
                  rounded-xl border border-gray-200 bg-gray-50
                  px-3 py-3 text-sm font-medium text-gray-700
                  transition hover:border-red-300 hover:bg-red-50"
              >
                <span>{isInchToFeet ? "Inches → Feet" : "Feet → Inches"}</span>

                <FaExchangeAlt className="text-[#ed3237]" size={16} />
              </button>
            </div>

            {/* Input */}
            <div>
              <label
                htmlFor="unit-converter-input"
                className="mb-2 block text-xs font-semibold
                  uppercase tracking-wide text-gray-500"
              >
                Enter {isInchToFeet ? "Inches" : "Feet"}
              </label>

              <div className="relative">
                <input
                  id="unit-converter-input"
                  type="number"
                  min="0"
                  step="any"
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value);
                    setCopied(false);
                  }}
                  placeholder="Enter value"
                  className="w-full rounded-xl border border-gray-200
                    px-3 py-3 pr-12 text-lg font-semibold
                    text-gray-800 outline-none transition
                    placeholder:text-sm placeholder:font-normal
                    focus:border-[#ed3237] focus:ring-2
                    focus:ring-red-100"
                />

                <span
                  className="absolute right-3 top-1/2
                  -translate-y-1/2 text-sm text-gray-400"
                >
                  {isInchToFeet ? "in" : "ft"}
                </span>
              </div>
            </div>

            {/* Result */}
            <div
              className="rounded-xl border border-red-100
              bg-red-50 p-4"
            >
              <p
                className="mb-2 text-xs font-semibold
                uppercase tracking-wide text-gray-500"
              >
                Converted Result
              </p>

              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="break-all text-2xl font-bold text-[#ed3237]">
                    {formattedResult || "—"}

                    <span className="ml-1 text-sm font-medium">
                      {isInchToFeet ? "ft" : "in"}
                    </span>
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    {isInchToFeet
                      ? "Divide inches by 12"
                      : "Multiply feet by 12"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={formattedResult === ""}
                  title="Copy result"
                  aria-label="Copy converted result"
                  className="shrink-0 rounded-lg border
                    border-red-200 bg-white p-2.5
                    text-[#ed3237] transition hover:bg-red-100
                    disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {copied ? <FaCheck size={16} /> : <FaRegCopy size={16} />}
                </button>
              </div>

              {copied && (
                <p className="mt-2 text-xs text-green-700">
                  Result copied successfully!
                </p>
              )}
            </div>

            {/* Footer */}
            <p className="text-center text-xs text-gray-400">
              1 foot = 12 inches
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

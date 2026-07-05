import type { PriceOption } from "@/lib/api";

export function PriceTable({ options }: { options: PriceOption[] }) {
  return (
    <table className="w-full text-sm">
      <tbody>
        {options.map((option, index) => (
          <tr key={index} className="border-b border-border last:border-0">
            <td className="py-2 pr-2">
              {option.label}
              {option.durationMinutes != null && (
                <span className="ml-1 text-muted-foreground">
                  · {option.durationMinutes}분
                </span>
              )}
            </td>
            <td className="py-2 text-right font-medium whitespace-nowrap">
              {option.price.toLocaleString()}
              {option.priceMax != null &&
                `~${option.priceMax.toLocaleString()}`}
              원
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

import { useEffect, useState } from "react";

function readChartColors(): string[] {
  const style = getComputedStyle(document.documentElement);
  const colors: string[] = [];
  for (let i = 1; i <= 8; i++) {
    colors.push(style.getPropertyValue(`--chart-${i}`).trim() || `hsl(${i * 45}, 60%, 50%)`);
  }
  return colors;
}

export function useChartColors(): string[] {
  const [colors, setColors] = useState(readChartColors);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setColors(readChartColors());
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  return colors;
}

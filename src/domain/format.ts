/** Mark rounded values as approximate; clinical comparisons use original numbers. */
export function formatMeasurement(value: number, places = 2): string {
  const displayed = Number(value.toFixed(places));
  return `${displayed === value ? "" : "~"}${displayed}`;
}

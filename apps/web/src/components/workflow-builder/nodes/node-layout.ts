// Exact constants from Sim Studio's block-dimensions.ts
// FIRST_ROW_Y: y offset from block top where first output row handle sits
// ROW_H: height between successive row handle centres
// ERROR_BOTTOM: y offset from block bottom where the error handle sits

export const FIRST_ROW_Y = 60;
export const ROW_H = 29;
export const ERROR_BOTTOM = 17;

/** Style for a normal source handle on row `i` (0-indexed). */
export function rowHandleStyle(i: number): React.CSSProperties {
  return { top: FIRST_ROW_Y + i * ROW_H, transform: "translateY(-50%)" };
}

/** Style for the error source handle (anchored from the bottom). */
export const errorHandleStyle: React.CSSProperties = {
  bottom: ERROR_BOTTOM,
  top: "auto",
  transform: "translateY(50%)",
};

export const layoutSpacing = Object.freeze({
  unit: 8,
  gutter: 16,
  frameInset: 32,
  bracketInset: 8,
  textInset: 24,
  rowHeight: 20,
});

export function diagnosticLayout(variant) {
  if (!Number.isInteger(variant) || variant < 0 || variant > 4)
    throw new Error('Unknown diagnostic layout.');
  const { gutter, frameInset } = layoutSpacing;
  const outer = { x: 24, y: 56, w: 752, h: 352 };
  const register = {
    x: 80,
    y: outer.y + frameInset,
    w: variant === 2 ? 240 : 184,
    h: outer.h - frameInset * 2,
  };
  const enclosure = {
    x: register.x + register.w + gutter,
    y: register.y,
    w: 752 - (register.x + register.w + gutter),
    h: register.h,
  };
  const content = {
    x: enclosure.x + 48,
    y: enclosure.y + frameInset,
    w: enclosure.w - 64,
    h: enclosure.h - frameInset * 2,
  };
  const rowHeight = (content.h - gutter) / 2;
  const bank = { x: content.x, y: content.y, w: content.w, h: rowHeight };
  const leftWidth = variant === 1 ? 112 : Math.ceil((content.w - gutter) / 16) * 8;
  const lower = [
    { x: content.x, y: content.y + rowHeight + gutter, w: leftWidth, h: rowHeight },
    {
      x: content.x + leftWidth + gutter,
      y: content.y + rowHeight + gutter,
      w: content.w - leftWidth - gutter,
      h: rowHeight,
    },
  ];
  return { outer, register, enclosure, bank, lower, gutter };
}

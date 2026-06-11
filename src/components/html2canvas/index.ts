import html2canvas from 'html2canvas';

export function handlePrint(id, scale = 4, quality = 0.5) {
  // 先用html2canvas将页面整个转为一张截图，再打印，防止出现echarts无法打印
  const dom = document.querySelector(id);
  if (!dom) return null;
  return html2canvas(dom, {
    scale,
    width: dom.offsetWidth,
    height: dom.offsetHeight,
  }).then((canvas) => {
    const src64 = canvas.toDataURL('image/jpeg', quality); // 0.5表示图片质量
    return src64;
  });
}

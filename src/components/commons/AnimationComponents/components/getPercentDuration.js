export const getPercentDuration = (steps, duration) => {
  let countedSteps = JSON.parse(JSON.stringify(steps));
  countedSteps.map((item, index) => {
    let prevPercent = index <= 0 ? 0 : steps[index - 1].progress;
    let currentPercent = item.progress - prevPercent;
    item.duration = parseInt(duration * currentPercent) == 0 ? 1 : parseInt(duration * currentPercent);
    delete item.progress;
    return item;
  });
  return countedSteps;
};

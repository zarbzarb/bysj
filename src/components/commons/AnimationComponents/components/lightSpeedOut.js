import { getPercentDuration } from './getPercentDuration';
export default (currentStep, initStyle) => {
  let stopPos = currentStep.stopPos;
  let duration = currentStep.duration * 1000;
  let isLeftToRight = stopPos.x > initStyle.translateX;
  let steps = [
    { opacity: 1, skew: 0, progress: 0, easing: 'easeInQuad' },
    {
      opacity: 0,
      skew: isLeftToRight ? 30 : -30,
      translateX: stopPos.x,
      translateY: stopPos.y,
      progress: 1,
      easing: 'easeInQuad',
    },
  ];
  let countedSteps = getPercentDuration(steps, duration);
  let initStep = {
    keyframes: countedSteps,
  };
  return initStep;
};

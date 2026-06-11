import { getPercentDuration } from './getPercentDuration';
export default (currentStep, initStyle) => {
  let stopPos = currentStep.stopPos;
  let duration = currentStep.duration * 1000;
  let isLeftToRight = stopPos.x > initStyle.translateX;
  let steps = [
    {
      opacity: 0,
      skew: isLeftToRight ? 30 : -30,
      progress: 0,
      easing: 'easeOutQuad',
    },
    {
      opacity: 1,
      skew: isLeftToRight ? -20 : 20,
      translateX: stopPos.x,
      translateY: stopPos.y,
      progress: 0.6,
      easing: 'easeOutQuad',
    },
    {
      opacity: 1,
      skew: isLeftToRight ? 5 : -5,
      progress: 0.8,
      easing: 'easeOutQuad',
    },
    { opacity: 1, skew: 0, progress: 1, easing: 'easeOutQuad' },
  ];
  let countedSteps = getPercentDuration(steps, duration);
  let initStep = {
    keyframes: countedSteps,
  };
  return initStep;
};

import { getPercentDuration } from './getPercentDuration';
export default (currentStep, initStyle) => {
  let stopPos = currentStep.stopPos;
  let duration = currentStep.duration * 1000;
  let isLeftToRight = stopPos.x > initStyle.translateX;
  let steps = [
    {
      opacity: 0,
      rotate: isLeftToRight ? -120 : 120,
      progress: 0,
      easing: 'easeInQuad',
    },
    {
      opacity: 1,
      rotate: 0,
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

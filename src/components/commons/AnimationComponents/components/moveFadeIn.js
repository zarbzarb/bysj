import { getPercentDuration } from './getPercentDuration';
export default (currentStep) => {
  let stopPos = currentStep.stopPos;
  let duration = currentStep.duration * 1000;
  let steps = [
    { opacity: 0, progress: 0, easing: 'easeInQuad' },
    {
      opacity: 1,
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

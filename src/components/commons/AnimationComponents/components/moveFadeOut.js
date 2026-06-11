import { getPercentDuration } from './getPercentDuration';
export default (currentStep) => {
  let stopPos = currentStep.stopPos;
  let duration = currentStep.duration * 1000;
  let steps = [
    { opacity: 1, progress: 0, easing: 'easeInQuad' },
    {
      opacity: 0,
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

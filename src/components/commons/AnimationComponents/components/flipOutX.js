import { getPercentDuration } from './getPercentDuration';
export default (currentStep) => {
  let duration = currentStep.duration * 1000;
  let steps = [
    {
      opacity: 1,
      perspective: 400,
      rotateX: 0,
      progress: 0,
      easing: 'easeInQuad',
    },
    {
      opacity: 1,
      perspective: 400,
      rotateX: -20,
      progress: 0.3,
      easing: 'easeInQuad',
    },
    {
      opacity: 0,
      perspective: 400,
      rotateX: 90,
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

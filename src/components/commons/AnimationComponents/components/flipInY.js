import { getPercentDuration } from './getPercentDuration';
export default (currentStep) => {
  let duration = currentStep.duration * 1000;
  let steps = [
    {
      opacity: 0,
      perspective: 400,
      rotateY: 90,
      progress: 0,
      easing: 'easeInQuad',
    },
    {
      opacity: 0.66,
      perspective: 400,
      rotateY: -20,
      progress: 0.4,
      easing: 'easeInQuad',
    },
    {
      opacity: 1,
      perspective: 400,
      rotateY: 10,
      progress: 0.6,
      easing: 'easeInQuad',
    },
    {
      opacity: 1,
      perspective: 400,
      rotateY: -5,
      progress: 0.8,
      easing: 'easeInQuad',
    },
    {
      opacity: 1,
      perspective: 400,
      rotateY: 0,
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

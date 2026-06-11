import { getPercentDuration } from './getPercentDuration';
export default (currentStep) => {
  let duration = currentStep.duration * 1000;
  let steps = [
    { rotate: 0, progress: 0, easing: 'easeInQuad' },
    { rotate: 15, progress: 0.2, easing: 'easeInQuad' },
    { rotate: -10, progress: 0.4, easing: 'easeInQuad' },
    { rotate: 5, progress: 0.6, easing: 'easeInQuad' },
    { rotate: -5, progress: 0.8, easing: 'easeInQuad' },
    { rotate: 0, progress: 1, easing: 'easeInQuad' },
  ];
  let countedSteps = getPercentDuration(steps, duration);
  let initStep = {
    keyframes: countedSteps,
  };
  return initStep;
};

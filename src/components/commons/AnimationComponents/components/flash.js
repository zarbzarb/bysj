import { getPercentDuration } from './getPercentDuration';
export default (currentStep) => {
  let duration = currentStep.duration * 1000;
  let steps = [
    { opacity: 1, progress: 0, easing: 'easeInQuad' },
    { opacity: 0, progress: 0.25, easing: 'easeInQuad' },
    { opacity: 1, progress: 0.5, easing: 'easeInQuad' },
    { opacity: 0, progress: 0.75, easing: 'easeInQuad' },
    { opacity: 1, progress: 1, easing: 'easeInQuad' },
  ];
  let countedSteps = getPercentDuration(steps, duration);
  let initStep = {
    keyframes: countedSteps,
  };
  return initStep;
};

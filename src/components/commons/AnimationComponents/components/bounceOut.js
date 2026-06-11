import { getPercentDuration } from './getPercentDuration';
export default (currentStep) => {
  let duration = currentStep.duration * 1000;
  let steps = [
    {
      opacity: 1,
      scaleX: 1,
      scaleY: 1,
      scaleZ: 1,
      progress: 0,
      easing: 'easeInQuad',
    },
    {
      opacity: 1,
      scaleX: 0.9,
      scaleY: 0.9,
      scaleZ: 0.9,
      progress: 0.2,
      easing: 'easeInQuad',
    },
    {
      opacity: 1,
      scaleX: 1.1,
      scaleY: 1.1,
      scaleZ: 1.1,
      progress: 0.5,
      easing: 'easeInQuad',
    },
    {
      opacity: 1,
      scaleX: 1.1,
      scaleY: 1.1,
      scaleZ: 1.1,
      progress: 0.55,
      easing: 'easeInQuad',
    },
    {
      opacity: 0,
      scaleX: 0.3,
      scaleY: 0.3,
      scaleZ: 0.3,
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

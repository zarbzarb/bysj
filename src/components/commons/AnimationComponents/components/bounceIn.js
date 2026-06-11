import { getPercentDuration } from './getPercentDuration';
export default (currentStep) => {
  let duration = currentStep.duration * 1000;
  let steps = [
    {
      opacity: 0,
      scaleX: 0.3,
      scaleY: 0.3,
      scaleZ: 0.3,
      progress: 0,
      easing: 'cubicBezier(0.215, 0.61, 0.355, 1)',
    },
    {
      opacity: 0.33,
      scaleX: 1.1,
      scaleY: 1.1,
      scaleZ: 1.1,
      progress: 0.2,
      easing: 'cubicBezier(0.215, 0.61, 0.355, 1)',
    },
    {
      opacity: 0.66,
      scaleX: 0.9,
      scaleY: 0.9,
      scaleZ: 0.9,
      progress: 0.4,
      easing: 'cubicBezier(0.215, 0.61, 0.355, 1)',
    },
    {
      opacity: 1,
      scaleX: 1.03,
      scaleY: 1.03,
      scaleZ: 1.03,
      progress: 0.6,
      easing: 'cubicBezier(0.215, 0.61, 0.355, 1)',
    },
    {
      scaleX: 0.97,
      scaleY: 0.97,
      scaleZ: 0.97,
      progress: 0.8,
      easing: 'cubicBezier(0.215, 0.61, 0.355, 1)',
    },
    {
      opacity: 1,
      scaleX: 1,
      scaleY: 1,
      scaleZ: 1,
      progress: 1,
      easing: 'cubicBezier(0.215, 0.61, 0.355, 1)',
    },
  ];
  let countedSteps = getPercentDuration(steps, duration);
  let initStep = {
    keyframes: countedSteps,
  };
  return initStep;
};

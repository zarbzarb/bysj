import { getPercentDuration } from './getPercentDuration';
export default (currentStep) => {
  let stopPos = currentStep.stopPos;
  let duration = currentStep.duration * 1000;
  let steps = [
    {
      opacity: 1,
      scaleX: 1,
      scaleY: 1,
      scaleZ: 1,
      progress: 0,
      easing: 'cubicBezier(0.55, 0.055, 0.675, 0.19)',
    },
    {
      opacity: 1,
      scaleX: 0.475,
      scaleY: 0.475,
      scaleZ: 0.475,
      progress: 0.4,
      easing: 'cubicBezier(0.55, 0.055, 0.675, 0.19)',
    },
    {
      opacity: 0,
      scaleX: 0.1,
      scaleY: 0.1,
      scaleZ: 0.1,
      translateX: stopPos.x,
      translateY: stopPos.y,
      progress: 1,
      easing: 'cubicBezier(0.55, 0.055, 0.675, 0.19)',
    },
  ];
  let countedSteps = getPercentDuration(steps, duration);
  let initStep = {
    keyframes: countedSteps,
  };
  return initStep;
};

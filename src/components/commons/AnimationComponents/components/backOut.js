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
      easing: 'easeInQuad',
    },
    {
      opacity: 0.7,
      scaleX: 0.7,
      scaleY: 0.7,
      scaleZ: 0.7,
      progress: 0.2,
      easing: 'easeInQuad',
    },
    {
      opacity: 0.7,
      translateX: stopPos.x,
      translateY: stopPos.y,
      scaleX: 0.7,
      scaleY: 0.7,
      scaleZ: 0.7,
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

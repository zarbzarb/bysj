import React from 'react';
import RenderForm from '../RenderForm';
import PickColor from './components/PickColor';

const initValues = {
  background: {
    color: '#FF3CAC',
    gradient: 'linear-gradient(225deg, #FF3CAC 0%, #784BA0 50%, #2B86C5 100%)',
    isGradient: true,
  },
};

function BackgroundProps(props) {
  const formData = [
    {
      id: 'background',
      label: '背景色',
      Com: <PickColor />,
    },
  ];

  return <RenderForm rowStyle={{ marginBottom: 0 }} {...props} initValues={initValues} formData={formData} />;
}

export default BackgroundProps;

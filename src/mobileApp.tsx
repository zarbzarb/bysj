import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import EventEmitter from '@/utils/eventBus';
import Index from './pages/Mobile';

window.globalEventEmitter = EventEmitter;
window.requestPrefix = '../api';
const root = ReactDOM.createRoot(document.querySelector('#app'));
root.render(<Index />);

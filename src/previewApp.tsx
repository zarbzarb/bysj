import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GetQueryString } from '@/utils/BrowserUtils';
import Share from './Share';
import AppLayout from './pages/Preview';
import 'core-js/es/array/to-sorted';
import 'core-js/es/array/to-reversed';

const errorCode = GetQueryString('error_code');

const App = errorCode ? (
  <Share errorCode={errorCode} />
) : (
  <BrowserRouter>
    <Routes>
      <Route path="/preview/:screenId" element={<AppLayout />} />
      <Route path="*" element={<AppLayout />} />
    </Routes>
  </BrowserRouter>
);

const root = ReactDOM.createRoot(document.querySelector('#preApp'));
root.render(App);

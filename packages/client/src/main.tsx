import React from 'react';
import ReactDOM from 'react-dom/client';
import { VERSION } from '@life-game/shared';

function App() {
  return (
    <div>
      <h1>Life Game v{VERSION}</h1>
    </div>
  );
}

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import 'leaflet/dist/leaflet.css';
import App from './App.tsx';
import { CodeplugProvider } from './state/codeplugStore.tsx';
import { OperatorPositionProvider } from './state/operatorPosition.tsx';
import { theme } from './theme.ts';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ColorSchemeScript defaultColorScheme="dark" />
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <HashRouter>
        <OperatorPositionProvider>
          <CodeplugProvider>
            <App />
          </CodeplugProvider>
        </OperatorPositionProvider>
      </HashRouter>
    </MantineProvider>
  </StrictMode>,
);

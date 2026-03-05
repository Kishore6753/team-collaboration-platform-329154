import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

test('renders auth screen shell', async () => {
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );

  // During boot, app shows "Restoring session…", then auth if not logged in.
  expect(await screen.findByText(/Team Task Tracker/i)).toBeInTheDocument();
});

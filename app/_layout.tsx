import '../global.css';

import { Stack } from 'expo-router';
import { IntlProvider } from 'react-intl';
import deMessages from '../locales/de.json';

export default function Layout() {
  return (
    <IntlProvider locale="de" messages={deMessages}>
      <Stack />
    </IntlProvider>
  );
}

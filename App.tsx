import './global.css';

import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';

import AppNavigator from './src/navigation/AppNavigator';
import { loadSession } from './src/services/session';

function setupGlobalErrorHandler() {
  const defaultHandler = ErrorUtils.getGlobalHandler();

  ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.error(
      `Global ${isFatal ? 'fatal ' : ''}error:`,
      error,
    );

    defaultHandler(error, isFatal);
  });
}

setupGlobalErrorHandler();

function App() {
  // The saved login is read first, so the right first screen is chosen.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadSession().finally(() => setReady(true));
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" />
      <AppNavigator />
    </NavigationContainer>
  );
}

export default App;
import { PortalProvider } from './providers/PortalProvider';
import { AppRoutes } from '../routes/AppRoutes';

export default function App() {
  return (
    <PortalProvider>
      <AppRoutes />
    </PortalProvider>
  );
}

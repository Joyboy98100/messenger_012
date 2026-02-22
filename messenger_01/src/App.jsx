import { Routes, Route } from "react-router-dom";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { ToastProvider } from "./context/ToastContext";
import { DarkModeProvider } from "./context/DarkModeContext";
import { NotificationProvider } from "./context/NotificationContext";
import { LanguageProvider } from "./context/LanguageContext";
import { TranslationProvider } from "./context/TranslationContext";
import { CallProvider } from "./context/CallContext";
import { CallNotificationProvider } from "./context/CallNotificationContext";
import IncomingCallModal from "./components/call/IncomingCallModal";
import CallScreen from "./components/call/CallScreen";

function App() {
  return (
    <div className="transition-colors duration-300">
      <ToastProvider>
        <DarkModeProvider>
          <LanguageProvider>
            <TranslationProvider>
              <CallProvider>
                <CallNotificationProvider>
                <NotificationProvider>
            <Routes>
              <Route path="/" element={<Auth />} />

              <Route
                path="/home"
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }
              />
            </Routes>
                </NotificationProvider>
                </CallNotificationProvider>
                <IncomingCallModal />
                <CallScreen />
              </CallProvider>
            </TranslationProvider>
          </LanguageProvider>
        </DarkModeProvider>
      </ToastProvider>
    </div>
  );
}

export default App;

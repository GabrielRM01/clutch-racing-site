import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Whitelist from './pages/Whitelist';
import Rules from './pages/Rules';
import Connect from './pages/Connect';
import StaffCallback from './pages/staff/StaffCallback';
import StaffApp from './pages/staff/StaffApp';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/whitelist" element={<Whitelist />} />
        <Route path="/regras" element={<Rules />} />
        <Route path="/conectar" element={<Connect />} />
      </Route>
      <Route path="/staff/callback" element={<StaffCallback />} />
      <Route path="/staff/*" element={<StaffApp />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

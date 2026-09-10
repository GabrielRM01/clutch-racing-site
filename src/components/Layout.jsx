import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import Background from './Background';

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Background />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

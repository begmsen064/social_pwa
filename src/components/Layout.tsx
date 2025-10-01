import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

const Layout = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-black pb-16">
      {/* Main Content */}
      <main className="max-w-screen-xl mx-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Layout;
import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import { supabase } from './lib/supabase';

// Components (Keep these eager loaded - small and critical)
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';

// Auth Pages (Keep eager for fast initial load)
import Login from './pages/Login';
import Register from './pages/Register';

// Lazy load all other pages for better performance
const Home = lazy(() => import('./pages/Home'));
const Explore = lazy(() => import('./pages/Explore'));
const NewPost = lazy(() => import('./pages/NewPost'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Profile = lazy(() => import('./pages/Profile'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const PostDetail = lazy(() => import('./pages/PostDetail'));
const EditProfile = lazy(() => import('./pages/EditProfile'));
const Messages = lazy(() => import('./pages/Messages'));
const Chat = lazy(() => import('./pages/Chat'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const HashtagFeed = lazy(() => import('./pages/HashtagFeed'));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
    <div className="flex flex-col items-center gap-3">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      <p className="text-sm text-gray-500 dark:text-gray-400">Yükleniyor...</p>
    </div>
  </div>
);

function App() {
  const { initialize, initialized, setUser, setSession } = useAuthStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    // Apply theme on mount
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Handle visibility change - check session when app becomes visible
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log('App visible - checking session');
        
        try {
          // Get current session
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Session check error:', error);
            return;
          }
          
          if (session?.user) {
            console.log('Session valid, refreshing user data');
            
            // Update session in store
            setSession(session);
            
            // Fetch fresh user profile
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (profileError) {
              console.error('Profile fetch error:', profileError);
              return;
            }
            
            if (profile) {
              setUser(profile);
              console.log('User data refreshed successfully');
            }
          } else {
            console.log('No valid session');
            setSession(null);
            setUser(null);
          }
        } catch (error) {
          console.error('Visibility change handler error:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [setUser, setSession]);


  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/home" replace />} />
            <Route path="home" element={<Home />} />
            <Route path="explore" element={<Explore />} />
            <Route path="post/new" element={<NewPost />} />
            <Route path="post/:postId" element={<PostDetail />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="messages" element={<Messages />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="profile/edit" element={<EditProfile />} />
            <Route path="u/:username" element={<UserProfile />} />
            <Route path="hashtag/:tag" element={<HashtagFeed />} />
          </Route>

          {/* Chat - Outside Layout (no bottom nav) */}
          <Route
            path="/messages/:userId"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Eye, EyeOff, Mail, Lock, CheckCircle, AlertCircle } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { signIn } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [success, setSuccess] = useState(false);
  const [emailValid, setEmailValid] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  // Validate email in real-time
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmailValid(emailRegex.test(email));
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message || 'Giriş yapılamadı');
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => {
        navigate('/home');
      }, 500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-white to-secondary/10 dark:from-gray-900 dark:via-black dark:to-gray-900 px-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Logo/Brand */}
        <div className="text-center space-y-4">
          <h1 className="text-7xl md:text-8xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-gradient bg-[length:200%_auto] uppercase tracking-wider drop-shadow-2xl" style={{ fontFamily: "'Bungee', system-ui" }}>
            KUNDUZ
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            Paylaş, keşfet, etkileş 🚀
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-800/50 hover:shadow-primary/10 hover:shadow-3xl transition-all duration-500">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="group">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors group-focus-within:text-primary">
                E-posta
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-all group-focus-within:scale-110">
                  <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  className={`w-full pl-10 pr-10 py-3.5 rounded-xl border-2 ${
                    emailTouched && email && !emailValid
                      ? 'border-red-500 dark:border-red-500 bg-red-50/50 dark:bg-red-900/10'
                      : 'border-gray-300 dark:border-gray-700'
                  } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all duration-300 hover:border-gray-400 dark:hover:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500`}
                  placeholder="ornek@email.com"
                />
                {emailTouched && email && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none animate-in fade-in zoom-in duration-300">
                    {emailValid ? (
                      <CheckCircle className="h-5 w-5 text-green-500 animate-in spin-in duration-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500 animate-in shake duration-500" />
                    )}
                  </div>
                )}
              </div>
              {emailTouched && email && !emailValid && (
                <p className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1 animate-in slide-in-from-top duration-300">
                  <AlertCircle className="h-3 w-3" />
                  Geçerli bir e-posta adresi girin
                </p>
              )}
            </div>

            <div className="group">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors group-focus-within:text-primary">
                Şifre
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-all group-focus-within:scale-110">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setPasswordTouched(true)}
                  className={`w-full pl-10 pr-12 py-3.5 rounded-xl border-2 ${
                    passwordTouched && password && password.length < 6
                      ? 'border-yellow-500 dark:border-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10'
                      : 'border-gray-300 dark:border-gray-700'
                  } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all duration-300 hover:border-gray-400 dark:hover:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-primary dark:hover:text-primary transition-all duration-300 hover:scale-110"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {passwordTouched && password && password.length < 6 && (
                <p className="mt-2 text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1 animate-in slide-in-from-top duration-300">
                  <AlertCircle className="h-3 w-3" />
                  Şifre en az 6 karakter olmalıdır
                </p>
              )}
              <div className="text-right mt-2">
                <button
                  type="button"
                  className="text-xs text-primary hover:text-secondary transition-all duration-300 font-semibold hover:underline"
                  onClick={() => alert('Şifre sıfırlama özelliği yakında eklenecek!')}
                >
                  Şifremi Unuttum?
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center group cursor-pointer">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary focus:ring-offset-2 border-gray-300 rounded cursor-pointer transition-all duration-300 hover:scale-110"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300 cursor-pointer font-medium group-hover:text-primary transition-colors">
                Beni hatırla
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || success || (emailTouched && !emailValid)}
              className="w-full bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] text-white py-3.5 px-4 rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-primary/30 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 relative overflow-hidden group animate-gradient"
            >
              <span className="absolute inset-0 w-full h-full bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></span>
              <span className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <span className="absolute top-0 left-1/4 w-2 h-2 bg-white/40 rounded-full animate-ping"></span>
                <span className="absolute top-0 right-1/4 w-2 h-2 bg-white/40 rounded-full animate-ping" style={{ animationDelay: '0.2s' }}></span>
              </span>
              {success ? (
                <span className="flex items-center justify-center relative animate-in zoom-in duration-300">
                  <CheckCircle className="mr-2 h-6 w-6" />
                  Başarılı! 🎉
                </span>
              ) : loading ? (
                <span className="flex items-center justify-center relative">
                  <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Giriş yapılıyor...
                </span>
              ) : (
                <span className="relative">Giriş Yap ✨</span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white/80 dark:bg-gray-900/80 text-gray-500 dark:text-gray-400 font-medium">
                  VEYA
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Hesabın yok mu?{' '}
              <Link to="/register" className="text-primary font-bold hover:text-secondary transition-all duration-300 hover:underline inline-flex items-center gap-1">
                Kayıt Ol
                <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
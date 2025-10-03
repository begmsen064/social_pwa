import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Eye, EyeOff, Mail, Lock, UserCheck, CheckCircle, AlertCircle } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const { signUp } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [validations, setValidations] = useState({
    email: { valid: false, message: '' },
    username: { valid: false, message: '' },
    password: { valid: false, message: '' },
    confirmPassword: { valid: false, message: '' },
  });

  // Calculate password strength
  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;
    return strength;
  };

  const getPasswordStrengthLabel = (strength: number): { text: string; color: string } => {
    if (strength <= 1) return { text: 'Zayıf', color: 'text-red-600 dark:text-red-400' };
    if (strength <= 3) return { text: 'Orta', color: 'text-yellow-600 dark:text-yellow-400' };
    return { text: 'Güçlü', color: 'text-green-600 dark:text-green-400' };
  };

  const getPasswordStrengthBarColor = (strength: number): string => {
    if (strength <= 1) return 'bg-red-500';
    if (strength <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  useEffect(() => {
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email) {
      setValidations(prev => ({
        ...prev,
        email: {
          valid: emailRegex.test(formData.email),
          message: emailRegex.test(formData.email) ? '' : 'Geçerli bir e-posta adresi girin'
        }
      }));
    }

    // Validate username
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (formData.username) {
      setValidations(prev => ({
        ...prev,
        username: {
          valid: usernameRegex.test(formData.username),
          message: usernameRegex.test(formData.username) ? '' : 'Sadece harf, rakam ve alt çizgi kullanın'
        }
      }));
    }

    // Calculate password strength
    if (formData.password) {
      const strength = calculatePasswordStrength(formData.password);
      setPasswordStrength(strength);
      setValidations(prev => ({
        ...prev,
        password: {
          valid: formData.password.length >= 6,
          message: formData.password.length >= 6 ? '' : 'En az 6 karakter olmalıdır'
        }
      }));
    }

    // Validate password confirmation
    if (formData.confirmPassword) {
      setValidations(prev => ({
        ...prev,
        confirmPassword: {
          valid: formData.password === formData.confirmPassword,
          message: formData.password === formData.confirmPassword ? '' : 'Şifreler eşleşmiyor'
        }
      }));
    }
  }, [formData.email, formData.username, formData.password, formData.confirmPassword]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return;
    }

    if (formData.username.length < 3) {
      setError('Kullanıcı adı en az 3 karakter olmalıdır');
      return;
    }

    setLoading(true);

    const { error } = await signUp(
      formData.email,
      formData.password,
      formData.username,
      formData.username // Use username as full_name too
    );

    if (error) {
      setError(error.message || 'Kayıt olunamadı');
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => {
        navigate('/home');
      }, 500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-white to-secondary/10 dark:from-gray-900 dark:via-black dark:to-gray-900 px-4 py-12 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Logo/Brand */}
        <div className="text-center space-y-4">
          <h1 className="text-7xl md:text-8xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-gradient bg-[length:200%_auto] uppercase tracking-wider drop-shadow-2xl" style={{ fontFamily: "'Bungee', system-ui" }}>
            KUNDUZ
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            Topluluğa katıl 🎉
          </p>
        </div>

        {/* Register Form */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-800/50 hover:shadow-secondary/10 hover:shadow-3xl transition-all duration-500">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="group">
              <label htmlFor="username" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors group-focus-within:text-primary">
                Kullanıcı Adı
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-all group-focus-within:scale-110">
                  <UserCheck className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-10 py-3.5 rounded-xl border-2 ${
                    formData.username && !validations.username.valid
                      ? 'border-red-500 dark:border-red-500 bg-red-50/50 dark:bg-red-900/10'
                      : 'border-gray-300 dark:border-gray-700'
                  } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all duration-300 hover:border-gray-400 dark:hover:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500`}
                  placeholder="username"
                />
                {formData.username && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none animate-in fade-in zoom-in duration-300">
                    {validations.username.valid ? (
                      <CheckCircle className="h-5 w-5 text-green-500 animate-in spin-in duration-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500 animate-in shake duration-500" />
                    )}
                  </div>
                )}
              </div>
              {formData.username && validations.username.message && (
                <p className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1 animate-in slide-in-from-top duration-300">
                  <AlertCircle className="h-3 w-3" />
                  {validations.username.message}
                </p>
              )}
              {(!formData.username || validations.username.valid) && (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  En az 3 karakter, sadece harf, rakam ve alt çizgi
                </p>
              )}
            </div>

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
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-10 py-3.5 rounded-xl border-2 ${
                    formData.email && !validations.email.valid
                      ? 'border-red-500 dark:border-red-500 bg-red-50/50 dark:bg-red-900/10'
                      : 'border-gray-300 dark:border-gray-700'
                  } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all duration-300 hover:border-gray-400 dark:hover:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500`}
                  placeholder="ornek@email.com"
                />
                {formData.email && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none animate-in fade-in zoom-in duration-300">
                    {validations.email.valid ? (
                      <CheckCircle className="h-5 w-5 text-green-500 animate-in spin-in duration-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500 animate-in shake duration-500" />
                    )}
                  </div>
                )}
              </div>
              {formData.email && validations.email.message && (
                <p className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1 animate-in slide-in-from-top duration-300">
                  <AlertCircle className="h-3 w-3" />
                  {validations.email.message}
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
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-3.5 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all duration-300 hover:border-gray-400 dark:hover:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500"
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
              
              {/* Password Strength Meter */}
              {formData.password && (
                <div className="mt-3 space-y-2 animate-in slide-in-from-top duration-300">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Güç</span>
                    <span className={`text-xs font-bold ${getPasswordStrengthLabel(passwordStrength).color}`}>
                      {getPasswordStrengthLabel(passwordStrength).text}
                    </span>
                  </div>
                  <div className="flex gap-1.5 h-2">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-full transition-all duration-500 transform ${
                          i < passwordStrength ? `${getPasswordStrengthBarColor(passwordStrength)} scale-y-100` : 'bg-gray-200 dark:bg-gray-700 scale-y-50'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    En az 6 karakter (büyük/küçük harf, rakam ve özel karakter kullanın)
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="group">
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors group-focus-within:text-primary">
                Şifre Tekrarı
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-all group-focus-within:scale-110">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-10 py-3.5 rounded-xl border-2 ${
                    formData.confirmPassword && !validations.confirmPassword.valid
                      ? 'border-red-500 dark:border-red-500 bg-red-50/50 dark:bg-red-900/10'
                      : 'border-gray-300 dark:border-gray-700'
                  } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all duration-300 hover:border-gray-400 dark:hover:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500`}
                  placeholder="••••••••"
                />
                {formData.confirmPassword && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none animate-in fade-in zoom-in duration-300">
                    {validations.confirmPassword.valid ? (
                      <CheckCircle className="h-5 w-5 text-green-500 animate-in spin-in duration-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500 animate-in shake duration-500" />
                    )}
                  </div>
                )}
              </div>
              {formData.confirmPassword && validations.confirmPassword.message && (
                <p className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1 animate-in slide-in-from-top duration-300">
                  <AlertCircle className="h-3 w-3" />
                  {validations.confirmPassword.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full bg-gradient-to-r from-secondary via-primary to-secondary bg-[length:200%_auto] text-white py-3.5 px-4 rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-secondary/30 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 relative overflow-hidden group animate-gradient"
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
                  Kaydediliyor...
                </span>
              ) : (
                <span className="relative">Kayıt Ol ✨</span>
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
              Zaten hesabın var mı?{' '}
              <Link to="/login" className="text-primary font-bold hover:text-secondary transition-all duration-300 hover:underline inline-flex items-center gap-1">
                Giriş Yap
                <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
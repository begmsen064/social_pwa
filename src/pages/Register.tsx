import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Eye, EyeOff, Mail, Lock, UserCheck, CheckCircle, AlertCircle, FileText } from 'lucide-react';

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
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const termsContentRef = useRef<HTMLDivElement>(null);
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

    // Show terms modal instead of registering immediately
    setShowTermsModal(true);
  };

  const handleAcceptTerms = async () => {
    setLoading(true);
    setShowTermsModal(false);

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

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50;
    if (isAtBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  return (
    <>
      {/* Terms and Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 max-w-2xl w-full max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Kullanım Koşulları</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Lütfen dikkatlice okuyun</p>
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div 
              ref={termsContentRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-6 space-y-4 text-sm text-gray-700 dark:text-gray-300"
            >
              <div className="space-y-4">
                <section>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">1. Yaş Kısıtlaması</h3>
                  <p className="leading-relaxed">
                    ⚠️ <strong className="text-red-600 dark:text-red-400">Bu platform 18 yaşından büyükler için tasarlanmıştır.</strong> 18 yaşından küçükseniz bu platformu kullanamazsınız. Kayıt olarak 18 yaşından büyük olduğunuzu beyan etmiş olursunuz.
                  </p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">2. İçerik Sorumluluğu</h3>
                  <p className="leading-relaxed">
                    <strong>Her kullanıcı kendi paylaştığı içerikten tamamen sorumludur.</strong> Platformda paylaşılan tüm görseller, videolar, yazılar ve diğer içerikler kullanıcılar tarafından oluşturulmuştur. KUNDUZ platformu olarak, kullanıcıların paylaştığı içeriklerden sorumlu değiliz.
                  </p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">3. Public İçerik</h3>
                  <p className="leading-relaxed">
                    Bu platformda paylaşılan tüm içerikler zaten internet ortamında <strong>public (kamuya açık)</strong> olarak bulunmaktadır. Platform, bu içeriklerin paylaşımına sadece aracılık etmektedir. İçeriklerin kaynak ve telif hakları ile ilgili sorumluluk paylaşan kullanıcıya aittir.
                  </p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">4. Yasadışı İçerik</h3>
                  <p className="leading-relaxed">
                    Platformda yasadışı, zararlı, tehdit edici, taciz edici, şiddet içeren, nefret söylemi içeren veya başka şekilde sakıncalı içerik paylaşmak kesinlikle yasaktır. Bu tür içerikleri paylaşan kullanıcılar yasal süreçlerle karşı karşıya kalabilir.
                  </p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">5. Gizlilik</h3>
                  <p className="leading-relaxed">
                    Kişisel verileriniz gizlilik politikamız doğrultusunda işlenir. E-posta adresiniz ve diğer kişisel bilgileriniz üçüncü şahıslarla paylaşılmaz. Ancak paylaştığınız içerikler public olduğu için herkes tarafından görülebilir.
                  </p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">6. Hesap Güvenliği</h3>
                  <p className="leading-relaxed">
                    Hesabınızın güvenliğinden siz sorumlusunuz. Şifrenizi kimseyle paylaşmayın. Hesabınızdan yapılan tüm işlemlerden siz sorumlusunuz.
                  </p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">7. Platform Hakları</h3>
                  <p className="leading-relaxed">
                    KUNDUZ platformu, kullanım koşullarını ihlal eden, yanlış bilgi veren veya platformu kötüye kullanan kullanıcıların hesaplarını askıya alma veya silme hakkını saklı tutar.
                  </p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">8. Değişiklikler</h3>
                  <p className="leading-relaxed">
                    Bu kullanım koşulları zaman zaman güncellenebilir. Değişiklikler platform üzerinden duyurulacaktır. Platformu kullanmaya devam ederek güncellenen koşulları kabul etmiş sayılırsınız.
                  </p>
                </section>

                <section className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <h3 className="font-bold text-lg text-yellow-900 dark:text-yellow-200 mb-2">⚠️ Önemli Uyarı</h3>
                  <p className="leading-relaxed text-yellow-800 dark:text-yellow-300">
                    Bu koşulları kabul ederek, 18 yaşından büyük olduğunuzu, paylaşacağınız içeriklerden tamamen sorumlu olduğunuzu ve bu platformun bir içerik aracısı olduğunu anlıyor ve kabul ediyorsunuz.
                  </p>
                </section>
              </div>
            </div>

            {/* Footer with Accept Button */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-800 space-y-3">
              {!hasScrolledToBottom && (
                <p className="text-xs text-center text-amber-600 dark:text-amber-400 flex items-center justify-center gap-2">
                  <span className="animate-bounce">↓</span>
                  Lütfen okumak için en alta kadar kaydırın
                </p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowTermsModal(false);
                    setHasScrolledToBottom(false);
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  İptal
                </button>
                <button
                  onClick={handleAcceptTerms}
                  disabled={!hasScrolledToBottom}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition"
                >
                  Okudum, Kabul Ediyorum
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-8">
      <div className="max-w-md w-full space-y-6">
        {/* Logo/Brand */}
        <div className="text-center">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent uppercase" style={{ fontFamily: "'Bungee', system-ui" }}>
            KUNDUZ
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Topluluğa katıl
          </p>
        </div>

        {/* Register Form */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Kullanıcı Adı
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserCheck className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-lg border ${
                    formData.username && !validations.username.valid
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-700'
                  } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent`}
                  placeholder="username"
                />
                {formData.username && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    {validations.username.valid ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {formData.username && validations.username.message && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {validations.username.message}
                </p>
              )}
              {(!formData.username || validations.username.valid) && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  En az 3 karakter
                </p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                E-posta
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-lg border ${
                    formData.email && !validations.email.valid
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-700'
                  } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent`}
                  placeholder="ornek@email.com"
                />
                {formData.email && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    {validations.email.valid ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {formData.email && validations.email.message && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {validations.email.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Şifre
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              
              {/* Password Strength Meter */}
              {formData.password && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Güç</span>
                    <span className={`text-xs font-medium ${getPasswordStrengthLabel(passwordStrength).color}`}>
                      {getPasswordStrengthLabel(passwordStrength).text}
                    </span>
                  </div>
                  <div className="flex gap-1 h-1.5">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-full ${
                          i < passwordStrength ? getPasswordStrengthBarColor(passwordStrength) : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Şifre Tekrarı
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-lg border ${
                    formData.confirmPassword && !validations.confirmPassword.valid
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-700'
                  } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent`}
                  placeholder="••••••••"
                />
                {formData.confirmPassword && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    {validations.confirmPassword.valid ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {formData.confirmPassword && validations.confirmPassword.message && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {validations.confirmPassword.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full bg-gradient-to-r from-primary to-secondary text-white py-2.5 px-4 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {success ? (
                <span className="flex items-center justify-center">
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Başarılı!
                </span>
              ) : loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Kaydediliyor...
                </span>
              ) : (
                'Kayıt Ol'
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Zaten hesabın var mı?{' '}
              <Link to="/login" className="text-primary font-semibold hover:underline">
                Giriş Yap
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Register;
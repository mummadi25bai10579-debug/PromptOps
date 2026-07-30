import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider } from '../../firebase/firebase';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification
} from 'firebase/auth';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Wand2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Login = () => {
  const [view, setView] = useState<'login' | 'signup' | 'forgotPassword'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuthError = (err: any) => {
    console.warn('Authentication error:', err?.code, err?.message);
    switch (err?.code) {
      case 'auth/popup-closed-by-user':
      case 'auth/cancelled-popup-request':
        // User deliberately closed the Google login popup or cancelled - clear error cleanly
        setError('');
        break;
      case 'auth/popup-blocked':
        setError('Pop-up was blocked by your browser. Please allow pop-ups for this site and try again.');
        break;
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        setError('Invalid email or password. Please try again.');
        break;
      case 'auth/email-already-in-use':
        setError('An account with this email already exists.');
        break;
      case 'auth/weak-password':
        setError('Password should be at least 6 characters long.');
        break;
      case 'auth/invalid-email':
        setError('Please enter a valid email address.');
        break;
      case 'auth/unauthorized-domain':
        setError('This domain is not authorized for Firebase Authentication. Please add it in the Firebase Console under Authentication > Settings > Authorized domains.');
        break;
      case 'auth/network-request-failed':
        setError('Network error. Please check your internet connection and try again.');
        break;
      default:
        // Do not display raw internal exception strings if code is available
        if (err?.message && !err.message.includes('auth/popup-closed-by-user')) {
          setError(err.message);
        } else {
          setError('');
        }
    }
  };

  const validateForm = () => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (view !== 'forgotPassword' && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }
    if (view === 'signup' && !displayName.trim()) {
      setError('Please enter your full name.');
      return false;
    }
    return true;
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setMessage('');
      setIsLoading(true);
      await signInWithPopup(auth, googleProvider);
      navigate('/');
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      
      if (view === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        setMessage('Account created! Please check your email to verify your account.');
        // We do not navigate immediately, let them read the message, or navigate after a bit.
        setTimeout(() => navigate('/'), 2000);
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        // Ensure email is verified before proceeding for a real app, but Firebase lets them login.
        // If we strictly want them verified:
        // if (!userCredential.user.emailVerified) {
        //   setError('Please verify your email before logging in.');
        //   await auth.signOut();
        //   return;
        // }
        navigate('/');
      }
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      setIsLoading(true);
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent! Check your inbox.');
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#050508]">
      {/* Background Mesh Gradient */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-900/30 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[0%] right-[-5%] w-[600px] h-[600px] bg-cyan-900/20 rounded-full blur-[150px]"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-black/20 backdrop-blur-xl border border-white/5 mb-6 shadow-lg shadow-indigo-500/20">
            <Wand2 className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold mb-2 text-gradient">PromptOps AI</h1>
          <p className="text-slate-400">Intelligent AI Media Workflow Platform</p>
        </div>

        <Card className="p-8 border-white/10 bg-black/40 backdrop-blur-xl">
          <h2 className="text-xl font-semibold mb-6 text-slate-200">
            {view === 'signup' ? 'Create your account' : view === 'forgotPassword' ? 'Reset your password' : 'Sign in to your account'}
          </h2>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </motion.div>
            )}
            {message && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-start gap-3"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-400">{message}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={view === 'forgotPassword' ? handleForgotPassword : handleEmailAuth} className="space-y-4 mb-6">
            {view === 'signup' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <Input
                  label="Full Name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Julian Drane"
                  required={view === 'signup'}
                />
              </motion.div>
            )}
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              required
            />
            {view !== 'forgotPassword' && (
              <div className="space-y-1">
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required={view !== 'forgotPassword'}
                />
                {view === 'login' && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setView('forgotPassword')}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>
            )}
            
            <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
              {view === 'signup' ? 'Create Account' : view === 'forgotPassword' ? 'Send Reset Link' : 'Sign In'}
            </Button>
          </form>

          {view !== 'forgotPassword' && (
            <>
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/5"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-black/40 text-slate-500">Or continue with</span>
                </div>
              </div>

              <Button 
                variant="secondary" 
                className="w-full mb-6" 
                onClick={handleGoogleSignIn}
                type="button"
                disabled={isLoading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google
              </Button>
            </>
          )}

          <p className="text-center text-sm text-slate-400">
            {view === 'signup' ? 'Already have an account?' : view === 'forgotPassword' ? 'Remember your password?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => {
                setView(view === 'login' ? 'signup' : 'login');
                setError('');
                setMessage('');
              }}
              className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              {view === 'signup' ? 'Sign in' : view === 'forgotPassword' ? 'Back to sign in' : 'Create an account'}
            </button>
          </p>
        </Card>
      </motion.div>
    </div>
  );
};

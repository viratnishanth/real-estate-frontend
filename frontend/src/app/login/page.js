'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import './Login.css';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Call our backend login API
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}` + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // Save token and redirect
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        toast.success('Logged in successfully!');
        router.push('/');
      } else {
        toast.error(data.error || 'Login failed');
      }
    } catch (err) {
      toast.error('Network error connecting to backend');
    }
  };

  return (
    <div className="login-container">
      <div className="login-image">
        <div className="image-overlay">
          <div className="logo">
            <span className="logo-icon">🏠</span> RealEstate CRM
          </div>
          <div className="image-text">
            <h1>Manage Leads, Properties<br/>and Bookings — All in One Place</h1>
            <p>Streamline your sales process and grow your business with our easy-to-use CRM.</p>
          </div>
        </div>
      </div>
      
      <div className="login-form-container">
        <div className="login-form-box">
          <h2>Welcome Back</h2>
          <p className="login-subtitle">Login to your account</p>
          
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <div className="input-icon">✉️</div>
              <input 
                type="email" 
                placeholder="Email address" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            
            <div className="form-group">
              <div className="input-icon">🔒</div>
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
              <div 
                className="eye-icon" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ cursor: 'pointer' }}
                title={showPassword ? "Hide Password" : "Show Password"}
              >
                {showPassword ? "🙈" : "👁️"}
              </div>
            </div>
            
            <div className="form-options">
              <label className="remember-me">
                <input type="checkbox" defaultChecked />
                <span>Remember me</span>
              </label>
              <a href="#" className="forgot-password">Forgot password?</a>
            </div>
            
            <button type="submit" className="btn-login">Login</button>
            
            <div className="divider">
              <span>or</span>
            </div>
            
            <button type="button" className="btn-otp">
              <span className="otp-icon">📱</span> Login with OTP
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

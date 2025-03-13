import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, User, Lock, AlertCircle, ArrowRight, Moon, Sun, EyeOff, Eye } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [loginAttempts, setLoginAttempts] = useState(0);
    const [shake, setShake] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    // Simple credentials
    const ADMIN_USERNAME = "Varun";
    const ADMIN_PASSWORD = "4546";

    useEffect(() => {
        // Check for saved credentials if any
        const savedUsername = localStorage.getItem('ksp_username');
        if (savedUsername) {
            setFormData(prev => ({ ...prev, username: savedUsername }));
            setRememberMe(true);
        }
        
        // Check for preferred theme
        const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const savedTheme = localStorage.getItem('ksp_theme');
        const initialDarkMode = savedTheme ? savedTheme === 'dark' : prefersDarkMode;
        setDarkMode(initialDarkMode);
        
        // Clear any existing auth on login page visit
        sessionStorage.clear();
        document.body.classList.add('login-page');
        if (initialDarkMode) document.body.classList.add('dark-mode');
        
        return () => {
            document.body.classList.remove('login-page');
            document.body.classList.remove('dark-mode');
        }
    }, []);

    useEffect(() => {
        if (darkMode) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('ksp_theme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('ksp_theme', 'light');
        }
    }, [darkMode]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.username.trim() || formData.username !== ADMIN_USERNAME) {
            newErrors.username = 'Invalid username';
        }
        
        if (!formData.password || formData.password !== ADMIN_PASSWORD) {
            newErrors.password = 'Invalid password';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (validateForm()) {
            setIsLoading(true);
            
            // Handle "Remember me" functionality
            if (rememberMe) {
                localStorage.setItem('ksp_username', formData.username);
            } else {
                localStorage.removeItem('ksp_username');
            }
            
            // Create session with timestamp
            const loginTime = new Date().getTime();
            sessionStorage.setItem('isAuthenticated', 'true');
            sessionStorage.setItem('adminUser', ADMIN_USERNAME);
            sessionStorage.setItem('loginTime', loginTime.toString());
            
            setTimeout(() => {
                setIsLoading(false);
                navigate('/', { replace: true });
            }, 800);
        } else {
            setLoginAttempts(prev => prev + 1);
            setShake(true);
            setTimeout(() => setShake(false), 500);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleTheme = () => {
        setDarkMode(!darkMode);
    };

    const handleForgotPassword = (e) => {
        e.preventDefault();
        alert("Password recovery feature will be implemented soon.\n\nFor now, contact your administrator for assistance.");
    };

    return (
        <div className={`login-wrapper ${darkMode ? 'dark-mode' : ''}`}>
            <div className={`theme-toggle ${darkMode ? 'dark' : ''}`} onClick={toggleTheme}>
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </div>
            
            <div className={`login-container ${darkMode ? 'dark' : ''}`}>
                <div className={`login-card ${shake ? 'shake' : ''}`}>
                    <div className="login-header">
                        <div className="logo-container">
                            <ShoppingBag className="logo-icon" size={36} />
                        </div>
                        <h1>KSP Admin</h1>
                        <p>Sign in to access your dashboard</p>
                    </div>
                    
                    {loginAttempts >= 3 && (
                        <div className="login-warning">
                            <AlertCircle size={18} />
                            <span>Multiple failed attempts detected. Please ensure you have the correct credentials.</span>
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit} className="login-form">
                        <div className={`form-group ${errors.username ? 'error' : formData.username ? 'valid' : ''}`}>
                            <label htmlFor="username">Username</label>
                            <div className="input-container">
                                <User className="input-icon" size={18} />
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    placeholder="Enter your username"
                                    autoComplete="username"
                                    disabled={isLoading}
                                />
                                {formData.username && !errors.username && <div className="valid-indicator"></div>}
                            </div>
                            {errors.username && <span className="error-message">{errors.username}</span>}
                        </div>
                        
                        <div className={`form-group ${errors.password ? 'error' : formData.password ? 'valid' : ''}`}>
                            <label htmlFor="password">Password</label>
                            <div className="input-container">
                                <Lock className="input-icon" size={18} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    disabled={isLoading}
                                />
                                <div className="password-toggle" onClick={togglePasswordVisibility}>
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </div>
                            </div>
                            {errors.password && <span className="error-message">{errors.password}</span>}
                        </div>
                        
                        <div className="form-options">
                            <label className="remember-me">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={() => setRememberMe(!rememberMe)}
                                    disabled={isLoading}
                                />
                                <span className="checkmark"></span>
                                Remember me
                            </label>
                            <a href="#" onClick={handleForgotPassword} className="forgot-password">
                                Forgot password?
                            </a>
                        </div>
                        
                        <button 
                            type="submit" 
                            className={`btn-login ${isLoading ? 'loading' : ''}`}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="loader">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>
                    
                    <div className="login-footer">
                        <p>KSP Admin Panel © {new Date().getFullYear()}</p>
                    </div>
                </div>
            </div>
            
            <div className="login-decoration">
                <div className="circle circle-1"></div>
                <div className="circle circle-2"></div>
                <div className="circle circle-3"></div>
                <div className="circle circle-4"></div>
                <div className="circle circle-5"></div>
            </div>
        </div>
    );
};

export default Login;

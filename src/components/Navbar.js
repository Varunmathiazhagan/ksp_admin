import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, PlusCircle, ListChecks, ShoppingBag, Users, 
  Bell, Menu, X, MessageSquare,
  Settings, LogOut, ChevronDown, UserCircle
} from 'lucide-react';
import '../styles/navbar.css';

const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
            if (window.innerWidth > 768) {
                setIsMenuOpen(false);
            }
        };
        
        window.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', handleResize);
        
        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const isActive = (path) => {
        return location.pathname === path ? 'active' : '';
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
        // Close dropdowns when toggling menu
        setIsNotificationOpen(false);
        setIsProfileOpen(false);
    };

    const toggleNotifications = (e) => {
        e.stopPropagation();
        setIsNotificationOpen(!isNotificationOpen);
        setIsProfileOpen(false);
    };

    const toggleProfile = (e) => {
        e.stopPropagation();
        setIsProfileOpen(!isProfileOpen);
        setIsNotificationOpen(false);
    };

    const handleLogout = () => {
        // Clear all sessionStorage items instead of just localStorage
        sessionStorage.clear();
        
        // Option to also clear any persistent login info
        localStorage.removeItem('ksp_username');
        
        // Navigate to login page with replace to prevent going back
        navigate('/login', { replace: true });
    };

    // Close dropdowns when clicking outside
    useEffect(() => {
        const closeDropdowns = (e) => {
            // Only close if clicking outside the dropdown containers
            if (!e.target.closest('.notification-container') && 
                !e.target.closest('.profile-container')) {
                setIsNotificationOpen(false);
                setIsProfileOpen(false);
            }
        };
        
        document.addEventListener('click', closeDropdowns);
        return () => document.removeEventListener('click', closeDropdowns);
    }, []);

    // Close mobile menu when clicking a link
    const closeMenuOnClick = () => {
        if (windowWidth <= 768) {
            setIsMenuOpen(false);
        }
    };

    return (
        <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
            <div className="navbar-container">
                <Link to="/" className="navbar-brand">
                    <ShoppingBag className="brand-icon" />
                    <span className="brand-text">KSP Admin</span>
                </Link>
                
                <button className="mobile-menu-button" onClick={toggleMenu} aria-label="Toggle menu">
                    {isMenuOpen ? <X /> : <Menu />}
                </button>
                
                <div className={`navbar-content ${isMenuOpen ? 'show' : ''}`}>
                    <ul className="nav-links">
                        <li className={isActive('/')}>
                            <Link to="/" onClick={closeMenuOnClick}>
                                <Home className="nav-icon icon-home" />
                                <span>Dashboard</span>
                            </Link>
                        </li>
                        <li className={isActive('/add-product')}>
                            <Link to="/add-product" onClick={closeMenuOnClick}>
                                <PlusCircle className="nav-icon icon-plus" />
                                <span>Add Product</span>
                            </Link>
                        </li>
                        <li className={isActive('/manage-products')}>
                            <Link to="/manage-products" onClick={closeMenuOnClick}>
                                <ListChecks className="nav-icon icon-list" />
                                <span>Products</span>
                            </Link>
                        </li>
                        <li className={isActive('/orders')}>
                            <Link to="/orders" onClick={closeMenuOnClick}>
                                <ShoppingBag className="nav-icon icon-bag" />
                                <span>Orders</span>
                            </Link>
                        </li>
                        <li className={isActive('/users')}>
                            <Link to="/users" onClick={closeMenuOnClick}>
                                <Users className="nav-icon icon-users" />
                                <span>Users</span>
                            </Link>
                        </li>
                        <li className={isActive('/contacts')}>
                            <Link to="/contacts" onClick={closeMenuOnClick}>
                                <MessageSquare className="nav-icon icon-message" />
                                <span>Messages</span>
                                <span className="badge">3</span>
                            </Link>
                        </li>
                    </ul>
                    
                    <div className="navbar-actions">
                        <div className="notification-container">
                            <button className="action-button notification-button" onClick={toggleNotifications} aria-label="Notifications">
                                <Bell className="action-icon icon-notification" />
                                <span className="notification-badge">2</span>
                            </button>
                            
                            {isNotificationOpen && (
                                <div className="dropdown-menu notification-dropdown">
                                    <h3>Notifications</h3>
                                    <ul>
                                        <li className="notification-item new">
                                            <div className="notification-icon order">
                                                <ShoppingBag size={16} />
                                            </div>
                                            <div className="notification-content">
                                                <p>New order received</p>
                                                <span>5 minutes ago</span>
                                            </div>
                                        </li>
                                        <li className="notification-item new">
                                            <div className="notification-icon message">
                                                <MessageSquare size={16} />
                                            </div>
                                            <div className="notification-content">
                                                <p>New message from customer</p>
                                                <span>1 hour ago</span>
                                            </div>
                                        </li>
                                        <li className="notification-item">
                                            <div className="notification-icon user">
                                                <Users size={16} />
                                            </div>
                                            <div className="notification-content">
                                                <p>5 new users registered</p>
                                                <span>3 hours ago</span>
                                            </div>
                                        </li>
                                    </ul>
                                    <a href="#" className="view-all">View all notifications</a>
                                </div>
                            )}
                        </div>
                        
                        <div className="profile-container">
                            <button className="profile-button" onClick={toggleProfile}>
                                <img src="https://i.pravatar.cc/150?img=12" alt="Profile" className="profile-image" />
                                <span className="profile-name">Admin</span>
                                <ChevronDown className="profile-chevron" />
                            </button>
                            
                            {isProfileOpen && (
                                <div className="dropdown-menu profile-dropdown">
                                    <div className="profile-header">
                                        <img src="https://i.pravatar.cc/150?img=12" alt="Profile" />
                                        <div>
                                            <h4>Admin User</h4>
                                            <p>admin@ksp.com</p>
                                        </div>
                                    </div>
                                    <ul>
                                        <li>
                                            <UserCircle size={16} className="icon-users" />
                                            <span>My Profile</span>
                                        </li>
                                        <li>
                                            <Settings size={16} className="icon-settings" />
                                            <span>Settings</span>
                                        </li>
                                        <li className="logout" onClick={handleLogout}>
                                            <LogOut size={16} className="icon-logout" />
                                            <span>Logout</span>
                                        </li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import '../styles/admin-home.css';
import { Box, ShoppingCart, Users, MessageSquare, BarChart2, Settings, Package, 
         AlertTriangle, TrendingUp, ChevronRight, RefreshCw, ArrowUp, ArrowDown } from 'lucide-react';
import { Link } from 'react-router-dom';

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

// Generate sample data for sparklines
const generateSparklineData = (baseline, variance, points = 10) => {
    return Array.from({length: points}, () => baseline + (Math.random() * variance * 2 - variance));
};

const AdminHome = () => {
    const [products, setProducts] = useState(null);
    const [contacts, setContacts] = useState(null);
    const [users, setUsers] = useState(null);
    const [error, setError] = useState(null);
    const [contactsError, setContactsError] = useState(null);
    const [usersError, setUsersError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const [userRetryCount, setUserRetryCount] = useState(0);

    useEffect(() => {
        loadDashboardData();
        loadContactsData();
        loadUsersData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/products');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setProducts(data);
        } catch (error) {
            console.error('Dashboard error:', error);
            setError('Failed to load product count. Please try again.');
        }
    };

    const loadContactsData = async (retry = true) => {
        try {
            const response = await fetch('http://localhost:5008/api/contacts');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setContacts(data);
            setContactsError(null);
            setRetryCount(0);
        } catch (error) {
            console.error('Contacts error:', error);
            const errorMessage = 'Failed to load contacts count. Please try again.';
            
            if (retry && retryCount < MAX_RETRIES) {
                setRetryCount(prev => prev + 1);
                setTimeout(() => loadContactsData(true), RETRY_DELAY);
            } else {
                setContactsError(errorMessage);
            }
        }
    };

    const loadUsersData = async (retry = true) => {
        try {
            const response = await fetch('http://localhost:5008/api/users');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setUsers(data);
            setUsersError(null);
            setUserRetryCount(0);
        } catch (error) {
            console.error('Users error:', error);
            const errorMessage = 'Failed to load users count. Please try again.';
            
            if (retry && userRetryCount < MAX_RETRIES) {
                setUserRetryCount(prev => prev + 1);
                setTimeout(() => loadUsersData(true), RETRY_DELAY);
            } else {
                setUsersError(errorMessage);
            }
        }
    };

    // Sample trend data for stats
    const statTrends = {
        products: { percentage: 12.5, isUp: true, data: generateSparklineData(15, 5) },
        orders: { percentage: 8.3, isUp: true, data: generateSparklineData(20, 7) },
        messages: { percentage: -3.6, isUp: false, data: generateSparklineData(10, 4) },
        revenue: { percentage: 15.7, isUp: true, data: generateSparklineData(100, 30) },
        users: { percentage: 9.2, isUp: true, data: generateSparklineData(25, 8) }
    };

    const StatCard = ({ icon: Icon, title, value, loading, error, onRetry, iconClass, trend }) => {
        const [isHovered, setIsHovered] = useState(false);
        
        // Calculate max height for sparkline normalization
        const maxHeight = trend?.data ? Math.max(...trend.data) : 0;
        
        return (
            <div 
                className={`stat-card ${isHovered ? 'stat-card-hover' : ''}`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="stat-card-content">
                    <div className="stat-icon">
                        <Icon 
                            size={22} 
                            className={`gradient-icon ${iconClass}`}
                            strokeWidth={1.5}
                            style={{
                                transition: 'all 0.3s ease',
                                transform: isHovered ? 'scale(1.1)' : 'scale(1)'
                            }}
                        />
                    </div>
                    <div className="stat-details">
                        <h3 className="stat-title">{title}</h3>
                        {loading ? (
                            <div className="skeleton-loader" />
                        ) : error ? (
                            <div className="error">
                                <AlertTriangle size={16} />
                                <span>{error}</span>
                                {onRetry && (
                                    <button 
                                        onClick={onRetry}
                                        className="retry-btn"
                                    >
                                        <RefreshCw size={12} style={{marginRight: '4px'}} />
                                        Retry
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="stat-value-container">
                                <div className="stat-value">
                                    {title.toLowerCase().includes('price') || title.toLowerCase().includes('revenue') 
                                        ? new Intl.NumberFormat('en-IN', {
                                            style: 'currency',
                                            currency: 'INR',
                                            maximumFractionDigits: 0
                                        }).format(value)
                                        : value}
                                </div>
                                {trend && (
                                    <div className={`stat-trend ${trend.isUp ? 'trend-up' : 'trend-down'}`}>
                                        {trend.isUp ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                                        <span>{Math.abs(trend.percentage).toFixed(1)}%</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                
                {trend?.data && !loading && !error && (
                    <div className="sparkline-container">
                        <svg width="100%" height="30" className="sparkline">
                            {trend.data.map((value, index) => {
                                const x = (index / (trend.data.length - 1)) * 100 + '%';
                                const y = 30 - ((value / maxHeight) * 25);
                                return (
                                    <circle 
                                        key={index} 
                                        cx={x} 
                                        cy={y} 
                                        r="1.5"
                                        className={`sparkline-dot ${trend.isUp ? 'sparkline-up' : 'sparkline-down'}`}
                                        style={{opacity: index / trend.data.length}}
                                    />
                                );
                            })}
                            {trend.data.map((value, index, array) => {
                                if (index === 0) return null;
                                const x1 = ((index - 1) / (array.length - 1)) * 100 + '%';
                                const y1 = 30 - ((array[index - 1] / maxHeight) * 25);
                                const x2 = (index / (array.length - 1)) * 100 + '%';
                                const y2 = 30 - ((value / maxHeight) * 25);
                                return (
                                    <line 
                                        key={`line-${index}`}
                                        x1={x1}
                                        y1={y1}
                                        x2={x2}
                                        y2={y2}
                                        className={`sparkline-line ${trend.isUp ? 'sparkline-up' : 'sparkline-down'}`}
                                    />
                                );
                            })}
                        </svg>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div>
            <svg style={{ position: 'absolute', width: 0, height: 0 }}>
                <defs>
                    <linearGradient id="gradient-primary" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FF0080" />
                        <stop offset="100%" stopColor="#7928CA" />
                    </linearGradient>
                    <linearGradient id="gradient-success" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00FF87" />
                        <stop offset="100%" stopColor="#60EFFF" />
                    </linearGradient>
                    <linearGradient id="gradient-warning" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FF8F71" />
                        <stop offset="100%" stopColor="#EF4444" />
                    </linearGradient>
                    <linearGradient id="gradient-info" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#0EA5E9" />
                        <stop offset="100%" stopColor="#6366F1" />
                    </linearGradient>
                </defs>
            </svg>
            <Navbar />
            <div className="max-w-6xl">
                <h2 className="dashboard-title">Admin Dashboard</h2>
                
                <div className="stats-grid">
                    <StatCard 
                        icon={Box}
                        title="Total Products"
                        value={products ? products.length : '-'}
                        loading={!products && !error}
                        error={error}
                        onRetry={loadDashboardData}
                        iconClass="icon-gradient-primary"
                        trend={products ? statTrends.products : null}
                    />
                    <StatCard 
                        icon={Users}
                        title="Total Users"
                        value={users ? users.length : '-'}
                        loading={!users && !usersError}
                        error={usersError}
                        onRetry={() => {
                            setUserRetryCount(0);
                            loadUsersData(true);
                        }}
                        iconClass="icon-gradient-success"
                        trend={users ? statTrends.users : null}
                    />
                    <StatCard 
                        icon={MessageSquare}
                        title="Messages"
                        value={contacts ? contacts.length : '-'}
                        loading={!contacts && !contactsError}
                        error={contactsError}
                        onRetry={() => {
                            setRetryCount(0);
                            loadContactsData(true);
                        }}
                        iconClass="icon-gradient-warning"
                        trend={contacts ? statTrends.messages : null}
                    />
                    <StatCard 
                        icon={TrendingUp}
                        title="Revenue"
                        value="142500"
                        iconClass="icon-gradient-info"
                        trend={statTrends.revenue}
                    />
                </div>

                <div className="main-cards">
                    <DashboardCard 
                        icon={Package}
                        title="Inventory Management"
                        description="Manage your product catalog, track stock levels and update inventory in real-time"
                        link="/products"
                        iconClass="icon-gradient-primary"
                    />
                    <DashboardCard 
                        icon={BarChart2}
                        title="Sales Analytics"
                        description="View detailed sales reports, customer insights and performance metrics"
                        link="/analytics"
                        iconClass="icon-gradient-success"
                    />
                    <DashboardCard 
                        icon={Settings}
                        title="System Settings"
                        description="Configure system preferences, user permissions and integration options"
                        link="/settings"
                        iconClass="icon-gradient-info"
                    />
                </div>

                <nav className="admin-nav">
                    <ul>
                        <li>
                            <Link to="/users" className="nav-link">
                                Users
                            </Link>
                        </li>
                    </ul>
                </nav>
            </div>
        </div>
    );
};

const DashboardCard = ({ icon: Icon, title, description, link, iconClass }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    return (
        <div 
            className="card"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Icon 
                size={38} 
                className={`card-icon gradient-icon icon-glow ${iconClass}`}
                strokeWidth={1.5}
                style={{
                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
            />
            <h3 className="card-title">{title}</h3>
            <p className="card-description">{description}</p>
            <a href={link} className="btn-submit">
                Access {title.split(' ')[0]} <ChevronRight size={18} />
            </a>
        </div>
    );
};

export default AdminHome;

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Navbar from './Navbar';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale,   
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js';
import { 
  Search, RefreshCw, ChevronDown, ChevronUp, Download, 
  User as UserIcon, Sun, Moon, Filter, HelpCircle, Bell, 
  BarChart2, LineChart, PieChart, Calendar, Tag, Mail, 
  AlertTriangle, CheckCircle, Activity, PlusCircle
} from 'lucide-react';
import '../styles/user.css';

// Register additional Chart.js components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  BarElement
);

const UserPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [selectedUser, setSelectedUser] = useState(null);
  const [signupData, setSignupData] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const tableRef = useRef(null);
  const [chartType, setChartType] = useState('line');
  const [timeRange, setTimeRange] = useState('monthly');
  const [userStatistics, setUserStatistics] = useState({});
  const [activityLog, setActivityLog] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(true);
  const [distributionData, setDistributionData] = useState({});
  const [userActivity, setUserActivity] = useState({});
  const [retentionData, setRetentionData] = useState({});
  const [loadingCharts, setLoadingCharts] = useState(true);
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [userActivityData, setUserActivityData] = useState({});
  const chartContainerRef = useRef(null);

  const API_URL = 'http://localhost:5008';

  useEffect(() => {
    fetchUsers();
    fetchUserAnalytics();
  }, []);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);

  // Adjust chart container size for responsive display
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (chartContainerRef.current) {
        const { width } = chartContainerRef.current.getBoundingClientRect();
        if (width < 500) {
          chartContainerRef.current.classList.add('compact-chart');
        } else {
          chartContainerRef.current.classList.remove('compact-chart');
        }
      }
    });
    
    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current);
    }
    
    return () => resizeObserver.disconnect();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/api/users`);
      setUsers(response.data);
      processSignupData(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to fetch users');
      setLoading(false);
    }
  };

  const fetchUserAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/users`);
      if (response.data) {
        const userData = response.data;
        
        // Process analytics from users data
        const stats = processUserStats(userData);
        const activity = generateActivityLog(userData);
        const domains = processEmailDomains(userData);
        const patterns = generateActivityPatterns(userData);
        
        setActivityLog(activity);
        setUserStatistics(stats);
        processEmailDomainDistribution(domains);
        setUserActivityData(patterns);
      }
      setAnalyticsLoading(false);
    } catch (err) {
      console.error("Error fetching analytics:", err);
      addNotification("Failed to load analytics", "error");
      setAnalyticsLoading(false);
    }
  };

  const processUserStats = (userData) => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
    
    const activeUsers = userData.filter(user => {
      const lastActivity = new Date(user.lastLogin || user.createdAt);
      return lastActivity >= thirtyDaysAgo;
    }).length;

    const totalUsers = userData.length;
    const monthlyGrowth = calculateMonthlyGrowth(userData);
    
    return {
      totalUsers,
      activeUsers,
      retentionRate: Math.round((activeUsers / totalUsers) * 100),
      growthRate: monthlyGrowth,
      dailyActiveUsers: Math.round(activeUsers * 0.3), // Estimate
      averageSessionTime: 15 // Default value in minutes
    };
  };

  const calculateMonthlyGrowth = (userData) => {
    const now = new Date();
    const thisMonth = userData.filter(user => {
      const created = new Date(user.createdAt);
      return created.getMonth() === now.getMonth() &&
             created.getFullYear() === now.getFullYear();
    }).length;

    const lastMonth = userData.filter(user => {
      const created = new Date(user.createdAt);
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1);
      return created.getMonth() === lastMonthDate.getMonth() &&
             created.getFullYear() === lastMonthDate.getFullYear();
    }).length;

    return lastMonth ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : 0;
  };

  const generateActivityLog = (userData) => {
    // Generate activity log from recent user actions
    return userData
      .slice(0, 10)
      .map(user => ({
        id: user._id,
        type: 'signup',
        user: user.email,
        time: user.createdAt,
        details: 'New user registration'
      }))
      .sort((a, b) => new Date(b.time) - new Date(a.time));
  };

  const processEmailDomains = (userData) => {
    return userData.reduce((acc, user) => {
      if (user.email) {
        const domain = user.email.split('@')[1];
        acc[domain] = (acc[domain] || 0) + 1;
      }
      return acc;
    }, {});
  };

  const generateActivityPatterns = (userData) => {
    // Generate synthetic activity patterns based on signup times
    const weekday = Array(24).fill(0);
    const weekend = Array(24).fill(0);

    userData.forEach(user => {
      const date = new Date(user.createdAt);
      const hour = date.getHours();
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      
      if (isWeekend) {
        weekend[hour]++;
      } else {
        weekday[hour]++;
      }
    });

    return {
      labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
      datasets: [
        {
          label: 'Weekday',
          data: weekday,
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          fill: true,
        },
        {
          label: 'Weekend',
          data: weekend,
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          fill: true,
        }
      ]
    };
  };

  const refreshUserData = async () => {
    setRefreshing(true);
    try {
      await fetchUsers();
      await fetchUserAnalytics();
      addNotification('Data refreshed successfully');
    } catch (err) {
      addNotification('Failed to refresh data', 'error');
    }
    setRefreshing(false);
  };

  const processSignupData = (userData) => {
    // Process real user data for the chart
    if (!userData || userData.length === 0) return;
    
    const monthlySignups = {};
    const last12Months = [];
    
    // Get last 12 months
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${month.toLocaleString('en-US', { month: 'short' })} ${month.getFullYear()}`;
      last12Months.push(monthKey);
      monthlySignups[monthKey] = 0;
    }
    
    // Count actual signups
    userData.forEach(user => {
      const date = new Date(user.createdAt);
      const monthYear = `${date.toLocaleString('en-US', { month: 'short' })} ${date.getFullYear()}`;
      
      if (monthlySignups[monthYear] !== undefined) {
        monthlySignups[monthYear] += 1;
      }
    });
    
    const chartData = {
      labels: last12Months,
      datasets: [{
        label: 'New User Signups',
        data: last12Months.map(month => monthlySignups[month]),
        fill: true,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgba(75, 192, 192, 1)'
      }]
    };
    
    // Process email domains for distribution chart
    processEmailDomainDistribution(userData);
    
    setSignupData(chartData);
  };
  
  const processEmailDomainDistribution = (userData) => {
    // Process email domain distribution from real data
    const usersByDomain = {};
    const domainColors = {
      'gmail.com': '#DB4437',
      'yahoo.com': '#6001D2',
      'hotmail.com': '#0078D4',
      'outlook.com': '#0072C6',
      'icloud.com': '#999999',
      'Other': '#607D8B'
    };
    
    // If we received domain distribution data directly
    if (userData[0] && userData[0].domain) {
      userData.forEach(item => {
        usersByDomain[item.domain] = item.count;
      });
    } else {
      // Extract domains from user data
      userData.forEach(user => {
        if (!user.email) return;
        const domain = user.email.split('@')[1];
        usersByDomain[domain] = (usersByDomain[domain] || 0) + 1;
      });
    }
    
    const topDomains = Object.entries(usersByDomain)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    const otherCount = Object.values(usersByDomain)
      .reduce((sum, count) => sum + count, 0) - 
      topDomains.reduce((sum, [_, count]) => sum + count, 0);
    
    if (otherCount > 0) {
      topDomains.push(['Other', otherCount]);
    }
    
    setDistributionData({
      labels: topDomains.map(([domain]) => domain),
      datasets: [{
        data: topDomains.map(([_, count]) => count),
        backgroundColor: topDomains.map(([domain]) => domainColors[domain] || domainColors['Other']),
        borderWidth: 1
      }]
    });
  };

  const handleDateRangeChange = (range) => {
    const now = new Date();
    let startDate = null;
    let endDate = now;
    
    switch (range) {
      case '7days':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case '30days':
        startDate = new Date(now.setDate(now.getDate() - 30));
        break;
      case '90days':
        startDate = new Date(now.setDate(now.getDate() - 90));
        break;
      default:
        break;
    }
    
    setDateRange({ start: startDate, end: endDate });
    
    // Fetch filtered data with the new date range
    fetchFilteredData(startDate, endDate);
  };
  
  const fetchFilteredData = async (startDate, endDate) => {
    try {
      const response = await axios.get(`${API_URL}/api/users`);
      if (response.data) {
        const filteredUsers = response.data.filter(user => {
          const userDate = new Date(user.createdAt);
          return (!startDate || userDate >= startDate) && 
                 (!endDate || userDate <= endDate);
        });
        processSignupData(filteredUsers);
        addNotification(`Chart updated for selected date range`);
      }
    } catch (err) {
      addNotification("Failed to update chart data", "error");
    }
  };

  const requestSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedUsers = React.useMemo(() => {
    if (!users.length) return [];
    const sortableUsers = [...users];
    sortableUsers.sort((a, b) => {
      const aValue = a[sortConfig.key] ? a[sortConfig.key].toString().toLowerCase() : '';
      const bValue = b[sortConfig.key] ? b[sortConfig.key].toString().toLowerCase() : '';
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sortableUsers;
  }, [users, sortConfig]);

  const filteredUsers = React.useMemo(() => {
    return sortedUsers.filter(user => 
      (user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sortedUsers, searchTerm]);

  const applyDateFilter = (users) => {
    if (dateFilter === 'all') return users;
    
    const now = new Date();
    const cutoff = new Date();
    
    if (dateFilter === '30days') {
      cutoff.setDate(now.getDate() - 30);
    } else if (dateFilter === '90days') {
      cutoff.setDate(now.getDate() - 90);
    } else if (dateFilter === '1year') {
      cutoff.setFullYear(now.getFullYear() - 1);
    }
    
    return users.filter(user => new Date(user.createdAt) >= cutoff);
  };

  // Apply filter to the filteredUsers
  const filteredAndSortedUsers = React.useMemo(() => {
    return applyDateFilter(filteredUsers);
  }, [filteredUsers, dateFilter]);
  
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredAndSortedUsers.slice(indexOfFirstUser, indexOfLastUser);
  const pageNumbers = Array.from({ length: Math.ceil(filteredAndSortedUsers.length / usersPerPage) }, (_, i) => i + 1);

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Sign-up Date'];
    const csvRows = filteredUsers.map(user => [
      user.name || 'N/A',
      user.email,
      new Date(user.createdAt).toISOString().split('T')[0]
    ].join(','));
    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'users_data.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    
    // In a real app, this would fetch new data or reprocess existing data
    // Here we'll simulate data change with random values
    const chartData = { ...signupData };
    
    if (chartData.datasets && chartData.datasets.length > 0) {
      chartData.datasets[0].data = chartData.datasets[0].data.map(() => 
        Math.floor(Math.random() * 20) + 1
      );
      setSignupData(chartData);
      
      // Show notification
      addNotification(`Chart updated to show ${range} data`);
    }
  };
  
  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };
  
  const bulkAction = (action) => {
    if (selectedUsers.length === 0) {
      addNotification('Please select users first');
      return;
    }
    
    // Here you would perform the actual action (delete, export, etc)
    addNotification(`${action} performed on ${selectedUsers.length} users`);
    setSelectedUsers([]);
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    },
    plugins: {
      legend: { 
        position: 'top',
        align: 'end',
        labels: {
          usePointStyle: true,
          boxWidth: 6,
          boxHeight: 6,
          padding: 10,
          font: {
            size: 11
          },
          color: darkMode ? '#e0e0e0' : '#333'
        }
      },
      tooltip: {
        backgroundColor: darkMode ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)',
        titleColor: darkMode ? '#fff' : '#000',
        bodyColor: darkMode ? '#fff' : '#000',
        bodyFont: { size: 11 },
        titleFont: { size: 12 },
        padding: 8,
        boxPadding: 4,
        cornerRadius: 4,
        displayColors: true,
        usePointStyle: true,
        callbacks: {
          footer: (tooltipItems) => {
            // Add percentages to tooltips
            if (!signupData.datasets || !signupData.datasets[0].data) return null;
            const total = signupData.datasets[0].data.reduce((a, b) => a + b, 0);
            if (total === 0) return null;
            const value = tooltipItems[0].parsed.y;
            const percentage = ((value / total) * 100).toFixed(1);
            return `${percentage}% of total signups`;
          },
          label: (context) => {
            const value = context.raw;
            return value >= 1000 ? 
              `${(value / 1000).toFixed(1)}k users` : 
              `${value} users`;
          }
        }
      }
    },
    scales: {
      y: { 
        beginAtZero: true,
        grid: {
          display: true,
          drawBorder: false,
          color: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
        },
        ticks: { 
          precision: 0,
          font: { size: 10 },
          color: darkMode ? '#e0e0e0' : '#333',
          padding: 8,
          maxTicksLimit: 5,
          callback: (value) => {
            if (value >= 1000) return `${value / 1000}k`;
            return value;
          }
        }
      },
      x: {
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          font: { size: 10 },
          color: darkMode ? '#e0e0e0' : '#333',
          maxRotation: 45,
          minRotation: 45,
          autoSkip: true,
          maxTicksLimit: 8
        }
      }
    }
  };

  const renderChart = () => {
    if (!signupData.datasets) return null;
    
    switch (chartType) {
      case 'bar':
        return <Bar data={signupData} options={chartOptions} height={200} />;
      case 'line':
      default:
        return <Line data={signupData} options={chartOptions} height={200} />;
    }
  };

  const renderActivityChart = () => {
    if (!userActivityData.datasets) return null;
    
    const options = {
      ...chartOptions,
      scales: {
        ...chartOptions.scales,
        y: {
          ...chartOptions.scales.y,
          title: {
            display: false
          },
          grid: {
            display: false
          }
        },
        x: {
          ...chartOptions.scales.x,
          ticks: {
            ...chartOptions.scales.x.ticks,
            callback: (value, index) => {
              // Show fewer labels for better readability
              return index % 4 === 0 ? value : '';
            }
          }
        }
      },
      plugins: {
        ...chartOptions.plugins,
        legend: {
          ...chartOptions.plugins.legend,
          position: 'bottom',
          labels: {
            ...chartOptions.plugins.legend.labels,
            boxWidth: 6,
            boxHeight: 6,
            padding: 15,
            font: { size: 10 }
          }
        }
      }
    };
    
    return <Line data={userActivityData} options={options} height={120} />;
  };

  const SkeletonRow = () => (
    <tr className="skeleton-row">
      <td><div className="skeleton"></div></td>
      <td><div className="skeleton"></div></td>
      <td><div className="skeleton"></div></td>
      <td><div className="skeleton"></div></td>
    </tr>
  );

  const handleTableKeyDown = (event, user, index) => {
    if (event.key === 'Enter') {
      setSelectedUser(user);
    } else if (event.key === 'ArrowDown' && tableRef.current) {
      const nextRow = tableRef.current.querySelector(`tr[data-index="${index + 1}"]`);
      if (nextRow) nextRow.focus();
      event.preventDefault();
    } else if (event.key === 'ArrowUp' && tableRef.current) {
      const prevRow = tableRef.current.querySelector(`tr[data-index="${index - 1}"]`);
      if (prevRow) prevRow.focus();
      event.preventDefault();
    }
  };

  const addNotification = (message, type = "success") => {
    const id = Date.now();
    setNotifications([...notifications, { id, message, type }]);
    setTimeout(() => {
      setNotifications(current => current.filter(n => n.id !== id));
    }, 3000);
  };

  // Simple tooltip component as fallback for Tippy
  const Tooltip = ({ content, children }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    
    return (
      <div 
        className="tooltip-container"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {children}
        {showTooltip && (
          <div className="tooltip-content">
            {content}
          </div>
        )}
      </div>
    );
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'login': return <CheckCircle size={16} className="activity-icon login" />;
      case 'signup': return <PlusCircle size={16} className="activity-icon signup" />;
      case 'profile_update': return <UserIcon size={16} className="activity-icon update" />; // Fixed: Changed User to UserIcon
      case 'password_reset': return <AlertTriangle size={16} className="activity-icon reset" />;
      case 'subscription_renewed': return <CheckCircle size={16} className="activity-icon renewed" />;
      case 'payment_processed': return <CheckCircle size={16} className="activity-icon payment" />;
      case 'document_uploaded': return <CheckCircle size={16} className="activity-icon document" />;
      default: return <Activity size={16} className="activity-icon" />;
    }
  };
  
  const formatActivityTime = (isoTime) => {
    const date = new Date(isoTime);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hr${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="user-page-container">
        <div className="dashboard-header">
          <h1>Users Management</h1>
          <div className="action-buttons">
            <button 
              className="theme-toggle"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button 
              className={`refresh-button ${refreshing ? 'refreshing' : ''}`}
              onClick={refreshUserData}
              disabled={refreshing}
            >
              <RefreshCw size={16} /> Refresh
            </button>
            <button className="export-button" onClick={exportToCSV}>
              <Download size={16} /> Export CSV
            </button>
          </div>
        </div>

        {showWelcomeBanner && (
          <div className="welcome-banner">
            <div className="welcome-content">
              <h2>Welcome to User Dashboard</h2>
              <p>Manage and analyze your user base with powerful tools.</p>
            </div>
            <button 
              className="close-banner" 
              onClick={() => setShowWelcomeBanner(false)}
            >
              &times;
            </button>
          </div>
        )}

        {loading ? (
          <div className="table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Sign-up Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
              </tbody>
            </table>
          </div>
        ) : error ? (
          <div className="error-container">
            <h2>Error</h2>
            <p>{error}</p>
            <button className="retry-button" onClick={fetchUsers}>
              <RefreshCw size={16} /> Try Again
            </button>
          </div>
        ) : (
          <>
            <div className="dashboard-summary">
              <div className="summary-title">
                <Activity size={20} />
                <h2>User Insights Overview</h2>
                <div className="date-range-filter">
                  <button 
                    className={`date-btn ${!dateRange.start ? 'active' : ''}`}
                    onClick={() => handleDateRangeChange(null)}
                  >
                    All
                  </button>
                  <button 
                    className={`date-btn ${dateRange.start && 
                      new Date().getDate() - dateRange.start.getDate() === 7 ? 'active' : ''}`}
                    onClick={() => handleDateRangeChange('7days')}
                  >
                    7d
                  </button>
                  <button 
                    className={`date-btn ${dateRange.start && 
                      new Date().getDate() - dateRange.start.getDate() === 30 ? 'active' : ''}`}
                    onClick={() => handleDateRangeChange('30days')}
                  >
                    30d
                  </button>
                </div>
              </div>
              <div className="summary-stats">
                <div className="stat-pill">
                  <span className="stat-value">{users.length}</span>
                  <span className="stat-label">Total Users</span>
                </div>
                <div className="stat-pill">
                  <span className="stat-value">{userStatistics.activeUsers || '-'}</span>
                  <span className="stat-label">Active Users</span>
                </div>
                <div className="stat-pill">
                  <span className="stat-value">{userStatistics.retentionRate || '-'}%</span>
                  <span className="stat-label">Retention</span>
                </div>
                <div className="stat-pill">
                  <span className="stat-value">+{userStatistics.growthRate || '-'}%</span>
                  <span className="stat-label">Growth</span>
                </div>
                <div className="stat-pill">
                  <span className="stat-value">{userStatistics.growthRate ? `+${userStatistics.growthRate}%` : '-'}</span>
                  <span className="stat-label">Monthly Growth</span>
                </div>
                <div className="stat-pill">
                  <span className="stat-value">{userStatistics.conversionRate ? `${userStatistics.conversionRate}%` : '-'}</span>
                  <span className="stat-label">Conversion</span>
                </div>
              </div>
            </div>

            <div className="charts-container" ref={chartContainerRef}>
              <div className="charts-section">
                <div className="chart-header compact">
                  <div className="chart-title">
                    <h3>User Registration Trends</h3>
                    <span className="subtitle">Analysis of user growth over time</span>
                  </div>
                  <div className="chart-controls">
                    <div className="chart-type-toggle">
                      <button 
                        className={`chart-type-btn ${chartType === 'line' ? 'active' : ''}`}
                        onClick={() => setChartType('line')}
                      >
                        <LineChart size={14} />
                      </button>
                      <button 
                        className={`chart-type-btn ${chartType === 'bar' ? 'active' : ''}`}
                        onClick={() => setChartType('bar')}
                      >
                        <BarChart2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="chart-container main-chart">
                  {analyticsLoading ? (
                    <div className="chart-loading">
                      <div className="loading-spinner-small"></div>
                      <span>Loading chart data...</span>
                    </div>
                  ) : (
                    <div className="chart-wrapper">
                      {renderChart()}
                      <div className="chart-overlay">
                        <div className="chart-controls">
                          <button onClick={() => setChartType('line')}>
                            <LineChart size={14} />
                          </button>
                          <button onClick={() => setChartType('bar')}>
                            <BarChart2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="chart-insights">
                  <div className="insight-item">
                    <span className="insight-value">{userStatistics.dailyActiveUsers || '-'}</span>
                    <span className="insight-label">Daily Active Users</span>
                  </div>
                  <div className="insight-item">
                    <span className="insight-value">{
                      signupData.datasets && signupData.datasets[0] && signupData.datasets[0].data ? 
                        Math.max(...signupData.datasets[0].data) : '-'
                    }</span>
                    <span className="insight-label">Peak Month</span>
                  </div>
                  <div className="insight-item">
                    <span className="insight-value">{userStatistics.averageSessionTime || '-'}m</span>
                    <span className="insight-label">Avg. Session</span>
                  </div>
                </div>
              </div>

              <div className="secondary-charts">
                <div className="mini-chart domain-chart">
                  <h4>Email Domain Distribution</h4>
                  {analyticsLoading ? (
                    <div className="chart-loading small">
                      <div className="loading-spinner-small"></div>
                    </div>
                  ) : (
                    <div className="donut-container">
                      {distributionData.datasets && (
                        <Doughnut 
                          data={distributionData}
                          options={{
                            maintainAspectRatio: false,
                            cutout: '70%',
                            plugins: {
                              legend: {
                                position: 'right',
                                align: 'start',
                                labels: { 
                                  boxWidth: 8, 
                                  font: { size: 10 },
                                  color: darkMode ? '#e0e0e0' : '#333'
                                }
                              }
                            }
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>

                <div className="mini-chart activity-chart">
                  <h4>User Activity Patterns</h4>
                  {analyticsLoading ? (
                    <div className="chart-loading small">
                      <div className="loading-spinner-small"></div>
                    </div>
                  ) : (
                    <div className="activity-chart-container">
                      {renderActivityChart()}
                    </div>
                  )}
                </div>

                <div className="activity-log">
                  <div className="log-header">
                    <h4>Recent Activities</h4>
                    <button className="refresh-log" onClick={refreshUserData}>
                      <RefreshCw size={12} />
                    </button>
                  </div>
                  {analyticsLoading ? (
                    <div className="activity-loading">
                      <div className="loading-spinner-small"></div>
                    </div>
                  ) : (
                    <div className="activity-list">
                      {activityLog.slice(0, 5).map(activity => (
                        <div key={activity.id} className="activity-item">
                          {getActivityIcon(activity.type)}
                          <div className="activity-details">
                            <span className="activity-user">{activity.user}</span>
                            <span className="activity-desc">{activity.type.replace('_', ' ')}</span>
                          </div>
                          <span className="activity-time">{formatActivityTime(activity.time)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="user-management-section">
              <div className="table-container">
                <table className="users-table" ref={tableRef}>
                  <thead>
                    <tr>
                      <th>
                        <input 
                          type="checkbox" 
                          checked={selectedUsers.length === currentUsers.length} 
                          onChange={() => {
                            if (selectedUsers.length === currentUsers.length) {
                              setSelectedUsers([]);
                            } else {
                              setSelectedUsers(currentUsers.map(user => user._id));
                            }
                          }} 
                        />
                      </th>
                      <th onClick={() => requestSort('name')}>
                        Name {getSortIcon('name')}
                      </th>
                      <th onClick={() => requestSort('email')}>
                        Email {getSortIcon('email')}
                      </th>
                      <th onClick={() => requestSort('createdAt')}>
                        Sign-up Date {getSortIcon('createdAt')}
                      </th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentUsers.map((user, index) => (
                      <tr 
                        key={user._id} 
                        data-index={index}
                        tabIndex={0}
                        onKeyDown={(e) => handleTableKeyDown(e, user, index)}
                      >
                        <td>
                          <input 
                            type="checkbox" 
                            checked={selectedUsers.includes(user._id)} 
                            onChange={() => toggleUserSelection(user._id)} 
                          />
                        </td>
                        <td>{user.name || 'N/A'}</td>
                        <td>{user.email}</td>
                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button onClick={() => setSelectedUser(user)}>View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pagination">
                {pageNumbers.map(number => (
                  <button 
                    key={number} 
                    className={`page-number ${currentPage === number ? 'active' : ''}`}
                    onClick={() => setCurrentPage(number)}
                  >
                    {number}
                  </button>
                ))}
              </div>
            </div>

            {selectedUser && (
              <div className="modal">
                <div className="modal-content">
                  <h2>User Details</h2>
                  <p><strong>Name:</strong> {selectedUser.name || 'N/A'}</p>
                  <p><strong>Email:</strong> {selectedUser.email}</p>
                  <p><strong>Sign-up Date:</strong> {new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                  <button onClick={() => setSelectedUser(null)}>Close</button>
                </div>
              </div>
            )}
          </>
        )}

        <div className="notifications">
          {notifications.map(notification => (
            <div key={notification.id} className={`notification ${notification.type}`}>
              {notification.message}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserPage;
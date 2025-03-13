import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import Navbar from "./Navbar";
import '../styles/contact.css';

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds
const ITEMS_PER_PAGE = 10;

// Improved skeleton loader component
const SkeletonRow = () => (
  <tr className="skeleton-row">
    <td><div className="skeleton" style={{width: '70%', height: '1.25rem'}}></div></td>
    <td><div className="skeleton" style={{width: '90%', height: '1.25rem'}}></div></td>
    <td><div className="skeleton" style={{width: '50%', height: '1.25rem'}}></div></td>
    <td><div className="skeleton" style={{width: '80%', height: '1.25rem'}}></div></td>
    <td><div className="skeleton" style={{width: '100%', height: '1.25rem'}}></div></td>
  </tr>
);

const AdminContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Search and filtering
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const searchInputRef = useRef(null);
  
  // Sorting
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [animateSorting, setAnimateSorting] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pageTransition, setPageTransition] = useState(false);

  const fetchContacts = async (retry = false) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get("http://localhost:5008/api/contacts");
      setContacts(response.data);
      setFilteredContacts(response.data);
      setTotalPages(Math.ceil(response.data.length / ITEMS_PER_PAGE));
      setRetryCount(0);
      // Delayed removal of initial loading state for smooth transition
      setTimeout(() => setInitialLoading(false), 500);
    } catch (err) {
      console.error('Fetch error:', err);
      const errorMessage = err.response
        ? `Error: ${err.response.status} - ${err.response.statusText}`
        : 'Failed to connect to the server';
      
      if (retry && retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => fetchContacts(true), RETRY_DELAY);
      } else {
        setError(`${errorMessage}. Please try again later.`);
        setInitialLoading(false);
      }
    } finally {
      setLoading(false);
    }
  };

  // Apply filters and search
  useEffect(() => {
    if (!contacts.length) return;
    
    let result = [...contacts];
    
    // Apply status filter
    if (activeFilter !== "all") {
      result = result.filter(contact => 
        contact.status.toLowerCase() === activeFilter.toLowerCase()
      );
    }
    
    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(contact => 
        contact.name.toLowerCase().includes(term) ||
        contact.email.toLowerCase().includes(term) ||
        contact.subject.toLowerCase().includes(term) ||
        contact.message.toLowerCase().includes(term)
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      const aValue = a[sortField]?.toLowerCase() || '';
      const bValue = b[sortField]?.toLowerCase() || '';
      
      if (sortDirection === "asc") {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });
    
    // Animate filtering changes
    setPageTransition(true);
    setTimeout(() => {
      setFilteredContacts(result);
      setTotalPages(Math.ceil(result.length / ITEMS_PER_PAGE));
      setCurrentPage(1);  // Reset to first page when filters change
      setPageTransition(false);
    }, 300);
    
  }, [contacts, searchTerm, activeFilter, sortField, sortDirection]);

  const handleSort = (field) => {
    setAnimateSorting(true);
    
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    
    // Reset animation state
    setTimeout(() => setAnimateSorting(false), 500);
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Add focus animation to search input
  const handleSearchFocus = () => {
    searchInputRef.current.parentNode.classList.add('focused');
  };
  
  const handleSearchBlur = () => {
    searchInputRef.current.parentNode.classList.remove('focused');
  };

  // Get current page items
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredContacts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };
  
  useEffect(() => {
    fetchContacts(true);
    
    // Add scroll animation when component mounts
    const contentContainer = document.querySelector('.content-container');
    if (contentContainer) {
      contentContainer.style.opacity = '0';
      contentContainer.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        contentContainer.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        contentContainer.style.opacity = '1';
        contentContainer.style.transform = 'translateY(0)';
      }, 100);
    }
    
    // Cleanup animation
    return () => {
      if (contentContainer) {
        contentContainer.style.transition = '';
        contentContainer.style.opacity = '';
        contentContainer.style.transform = '';
      }
    };
  }, []);
  
  // Page change with animation
  const handlePageChange = (newPage) => {
    setPageTransition(true);
    setTimeout(() => {
      setCurrentPage(newPage);
      setPageTransition(false);
    }, 300);
  };
  
  // Total entries count
  const totalEntries = filteredContacts.length;
  const showingStart = totalEntries ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0;
  const showingEnd = Math.min(currentPage * ITEMS_PER_PAGE, totalEntries);

  return (
    <div className="admin-page">
      <Navbar />
      <div className="content-container">
        <h2 className="section-title">User Contacts</h2>
        
        <div className="card">
          {initialLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <div>Loading your contacts...</div>
            </div>
          ) : error ? (
            <div className="error-container">
              <p className="error-message">{error}</p>
              <button 
                onClick={() => fetchContacts(true)}
                className="btn btn-primary"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              <div className="table-controls">
                <div className={`search-container ${searchTerm ? 'has-value' : ''}`}>
                  <span className="search-icon">🔍</span>
                  <input 
                    ref={searchInputRef}
                    type="text" 
                    className="search-input" 
                    placeholder="Search by name, email or subject..." 
                    value={searchTerm}
                    onChange={handleSearch}
                    onFocus={handleSearchFocus}
                    onBlur={handleSearchBlur}
                  />
                </div>
                
                <div className="filter-container">
                  <button 
                    onClick={() => handleFilterChange("all")}
                    className={`filter-btn ${activeFilter === "all" ? "active" : ""}`}
                  >
                    All Contacts
                  </button>
                  <button 
                    onClick={() => handleFilterChange("new")}
                    className={`filter-btn ${activeFilter === "new" ? "active" : ""}`}
                  >
                    New
                  </button>
                  <button 
                    onClick={() => handleFilterChange("inprogress")}
                    className={`filter-btn ${activeFilter === "inprogress" ? "active" : ""}`}
                  >
                    In Progress
                  </button>
                  <button 
                    onClick={() => handleFilterChange("completed")}
                    className={`filter-btn ${activeFilter === "completed" ? "active" : ""}`}
                  >
                    Completed
                  </button>
                </div>
              </div>
              
              {filteredContacts.length === 0 ? (
                <div className="no-data">
                  <div className="no-data-icon">📭</div>
                  <div>No contacts found matching your search criteria</div>
                  <button 
                    onClick={() => {setSearchTerm(''); setActiveFilter('all');}}
                    className="btn btn-primary"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className={`data-table ${animateSorting ? 'sorting' : ''} ${pageTransition ? 'page-transition' : ''}`}>
                    <thead>
                      <tr>
                        <th 
                          onClick={() => handleSort("name")}
                          className={sortField === "name" ? `sort-${sortDirection}` : ""}
                        >
                          Name
                        </th>
                        <th 
                          onClick={() => handleSort("email")}
                          className={sortField === "email" ? `sort-${sortDirection}` : ""}
                        >
                          Email
                        </th>
                        <th>Phone</th>
                        <th 
                          onClick={() => handleSort("subject")}
                          className={sortField === "subject" ? `sort-${sortDirection}` : ""}
                        >
                          Subject
                        </th>
                        <th>Message</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        // Skeleton loading rows
                        Array(5).fill().map((_, i) => <SkeletonRow key={`skeleton-${i}`} />)
                      ) : filteredContacts.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="no-data">
                            <div className="no-data-icon">📭</div>
                            No contacts found
                          </td>
                        </tr>
                      ) : (
                        <TransitionGroup component={null}>
                          {getCurrentPageItems().map((contact) => (
                            <CSSTransition
                              key={contact._id}
                              timeout={500}
                              classNames="row"
                            >
                              <tr>
                                <td>{contact.name}</td>
                                <td>{contact.email}</td>
                                <td>{contact.phone}</td>
                                <td>{contact.subject}</td>
                                <td>{contact.message}</td>
                              </tr>
                            </CSSTransition>
                          ))}
                        </TransitionGroup>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              
              {filteredContacts.length > 0 && (
                <div className="pagination">
                  <div className="pagination-info">
                    Showing {showingStart} to {showingEnd} of {totalEntries} entries
                  </div>
                  <div className="pagination-controls">
                    <button 
                      className="pagination-button" 
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                    >
                      &laquo;
                    </button>
                    <button 
                      className="pagination-button" 
                      onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      &lsaquo;
                    </button>
                    
                    {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button 
                          key={i}
                          className={`pagination-button ${currentPage === pageNum ? "active" : ""}`}
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button 
                      className="pagination-button" 
                      onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      &rsaquo;
                    </button>
                    <button 
                      className="pagination-button" 
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      &raquo;
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminContacts;

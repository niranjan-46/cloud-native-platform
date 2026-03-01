'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Modal from 'react-modal';
import styles from './page.module.css';
import { 
  FiX, 
  FiCreditCard, 
  FiCalendar, 
  FiDollarSign, 
  FiCheckCircle, 
  FiClock, 
  FiXCircle, 
  FiTrendingUp,
  FiFilter,
  FiChevronDown,
  FiChevronUp,
  FiRefreshCw
} from 'react-icons/fi';
import Cookies from 'js-cookie';
import { Spinner } from 'react-bootstrap';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

if (typeof window !== 'undefined') {
  Modal.setAppElement('body');
}

const Transaction = ({ isOpen, onClose }) => {
  const [transactions, setTransactions] = useState({ payments: [], subscription_payments: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('payments');
  
  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    timeFrom: '',
    timeTo: '',
    status: 'all',
    transactionType: 'all'
  });
  const [appliedFilters, setAppliedFilters] = useState({
    dateFrom: '',
    dateTo: '',
    timeFrom: '',
    timeTo: '',
    status: 'all',
    transactionType: 'all'
  });

  useEffect(() => {
    if (isOpen) {
      fetchTransactions();
    }
  }, [isOpen]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/api/payments/history/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${Cookies.get('access_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch transactions (${response.status})`);
      }

      const data = await response.json();
      setTransactions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // In your Transaction.js component
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Filter utility functions
  const isTransactionInDateRange = useCallback((transaction, dateFrom, dateTo) => {
    if (!dateFrom && !dateTo) return true;
    
    const transactionDate = new Date(transaction.created_at);
    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const toDate = dateTo ? new Date(dateTo + 'T23:59:59') : null;
    
    if (fromDate && toDate) {
      return transactionDate >= fromDate && transactionDate <= toDate;
    } else if (fromDate) {
      return transactionDate >= fromDate;
    } else if (toDate) {
      return transactionDate <= toDate;
    }
    
    return true;
  }, []);

  const isTransactionInTimeRange = useCallback((transaction, timeFrom, timeTo) => {
    if (!timeFrom && !timeTo) return true;
    
    const transactionTime = new Date(transaction.created_at);
    const transactionHours = transactionTime.getHours();
    const transactionMinutes = transactionTime.getMinutes();
    const transactionTimeInMinutes = transactionHours * 60 + transactionMinutes;
    
    if (timeFrom && timeTo) {
      const [fromHours, fromMinutes] = timeFrom.split(':').map(Number);
      const [toHours, toMinutes] = timeTo.split(':').map(Number);
      const fromTimeInMinutes = fromHours * 60 + fromMinutes;
      const toTimeInMinutes = toHours * 60 + toMinutes;
      
      return transactionTimeInMinutes >= fromTimeInMinutes && transactionTimeInMinutes <= toTimeInMinutes;
    } else if (timeFrom) {
      const [fromHours, fromMinutes] = timeFrom.split(':').map(Number);
      const fromTimeInMinutes = fromHours * 60 + fromMinutes;
      return transactionTimeInMinutes >= fromTimeInMinutes;
    } else if (timeTo) {
      const [toHours, toMinutes] = timeTo.split(':').map(Number);
      const toTimeInMinutes = toHours * 60 + toMinutes;
      return transactionTimeInMinutes <= toTimeInMinutes;
    }
    
    return true;
  }, []);

  const isTransactionInStatusFilter = useCallback((transaction, statusFilter) => {
    if (statusFilter === 'all') return true;
    return transaction.status.toLowerCase() === statusFilter.toLowerCase();
  }, []);

  const isTransactionInTypeFilter = useCallback((transaction, typeFilter) => {
    if (typeFilter === 'all') return true;
    const transactionType = transaction.subscription !== undefined ? 'subscription' : 'payment';
    return transactionType === typeFilter;
  }, []);

  // Apply filters to transactions
  const filteredTransactions = useMemo(() => {
    const allTransactions = [...transactions.payments, ...transactions.subscription_payments];
    
    return allTransactions.filter(transaction => {
      const dateFilter = isTransactionInDateRange(transaction, appliedFilters.dateFrom, appliedFilters.dateTo);
      const timeFilter = isTransactionInTimeRange(transaction, appliedFilters.timeFrom, appliedFilters.timeTo);
      const statusFilter = isTransactionInStatusFilter(transaction, appliedFilters.status);
      const typeFilter = isTransactionInTypeFilter(transaction, appliedFilters.transactionType);
      
      return dateFilter && timeFilter && statusFilter && typeFilter;
    });
  }, [transactions, appliedFilters, isTransactionInDateRange, isTransactionInTimeRange, isTransactionInStatusFilter, isTransactionInTypeFilter]);

  // Separate filtered transactions by type
  const filteredPayments = useMemo(() => {
    return filteredTransactions.filter(transaction => transaction.subscription === undefined);
  }, [filteredTransactions]);

  const filteredSubscriptions = useMemo(() => {
    return filteredTransactions.filter(transaction => transaction.subscription !== undefined);
  }, [filteredTransactions]);

  // Filter actions
  const applyFilters = useCallback(() => {
    setAppliedFilters({ ...filters });
  }, [filters]);

  const resetFilters = useCallback(() => {
    const resetFilters = {
      dateFrom: '',
      dateTo: '',
      timeFrom: '',
      timeTo: '',
      status: 'all',
      transactionType: 'all'
    };
    setFilters(resetFilters);
    setAppliedFilters(resetFilters);
  }, []);

  const cancelFilters = useCallback(() => {
    setFilters({ ...appliedFilters });
    setShowFilters(false);
  }, [appliedFilters]);

  // Get active filter count
  const getActiveFilterCount = useCallback(() => {
    let count = 0;
    if (appliedFilters.dateFrom || appliedFilters.dateTo) count++;
    if (appliedFilters.timeFrom || appliedFilters.timeTo) count++;
    if (appliedFilters.status !== 'all') count++;
    if (appliedFilters.transactionType !== 'all') count++;
    return count;
  }, [appliedFilters]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount, currency) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numAmount);
  };

  const getStatusConfig = (status) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'paid':
        return {
          color: '#10b981',
          bgColor: '#ecfdf5',
          icon: <FiCheckCircle />,
          label: 'Paid'
        };
      case 'created':
        return {
          color: '#f59e0b',
          bgColor: '#fffbeb',
          icon: <FiClock />,
          label: 'Pending'
        };
      case 'failed':
        return {
          color: '#ef4444',
          bgColor: '#fef2f2',
          icon: <FiXCircle />,
          label: 'Failed'
        };
      default:
        return {
          color: '#6b7280',
          bgColor: '#f9fafb',
          icon: <FiClock />,
          label: 'Unknown'
        };
    }
  };

  const getTransactionType = (transaction) => {
    if (transaction.subscription !== undefined) {
      return 'Subscription';
    }
    return 'Job Posting';
  };

  const TransactionCard = ({ transaction, type }) => {
    const statusConfig = getStatusConfig(transaction.status);
    
    return (
      <div className={styles.transactionCard}>
        <div className={styles.cardHeader}>
          <div className={styles.transactionType}>
            <FiCreditCard className={styles.typeIcon} />
            <span>{getTransactionType(transaction)}</span>
          </div>
          <div 
            className={styles.statusBadge}
            style={{ 
              backgroundColor: statusConfig.bgColor,
              color: statusConfig.color
            }}
          >
            {statusConfig.icon}
            <span>{statusConfig.label}</span>
          </div>
        </div>
        
        <div className={styles.cardBody}>
          <div className={styles.amountSection}>
            <span className={styles.amount}>{formatAmount(transaction.amount, transaction.currency)}</span>
          </div>
          
          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Date</span>
              <span className={styles.detailValue}>
                <FiCalendar />
                {formatDate(transaction.created_at)}
              </span>
            </div>
            
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Time</span>
              <span className={styles.detailValue}>{formatTime(transaction.created_at)}</span>
            </div>
            
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Order ID</span>
              <span className={styles.detailValue}>{transaction.order_id || 'N/A'}</span>
            </div>
            
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Payment ID</span>
              <span className={styles.detailValue}>{transaction.payment_id || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getTotalAmount = (transactions) => {
    return transactions.reduce((total, transaction) => {
      const amount = typeof transaction.amount === 'string' ? parseFloat(transaction.amount) : transaction.amount;
      return total + amount;
    }, 0);
  };

  const getPaidAmount = (transactions) => {
    return transactions
      .filter(transaction => transaction.status.toLowerCase() === 'paid')
      .reduce((total, transaction) => {
        const amount = typeof transaction.amount === 'string' ? parseFloat(transaction.amount) : transaction.amount;
        return total + amount;
      }, 0);
  };

  // Use filtered transactions for calculations
  const totalAmount = getTotalAmount(filteredTransactions);
  const paidAmount = getPaidAmount(filteredTransactions);

  // Filter Panel Component
  const FilterPanel = () => (
    <div className={styles.filterPanel}>
      <div className={styles.filterSection}>
        <h4>Date Range</h4>
        <div className={styles.dateRangeContainer}>
          <div className={styles.dateInput}>
            <label htmlFor="dateFrom">From Date</label>
            <input
              type="date"
              id="dateFrom"
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              className={styles.filterInput}
            />
          </div>
          <div className={styles.dateInput}>
            <label htmlFor="dateTo">To Date</label>
            <input
              type="date"
              id="dateTo"
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              className={styles.filterInput}
            />
          </div>
        </div>
      </div>

      <div className={styles.filterSection}>
        <h4>Time Range (Optional)</h4>
        <div className={styles.timeRangeContainer}>
          <div className={styles.timeInput}>
            <label htmlFor="timeFrom">From Time</label>
            <input
              type="time"
              id="timeFrom"
              value={filters.timeFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, timeFrom: e.target.value }))}
              className={styles.filterInput}
            />
          </div>
          <div className={styles.timeInput}>
            <label htmlFor="timeTo">To Time</label>
            <input
              type="time"
              id="timeTo"
              value={filters.timeTo}
              onChange={(e) => setFilters(prev => ({ ...prev, timeTo: e.target.value }))}
              className={styles.filterInput}
            />
          </div>
        </div>
      </div>

      <div className={styles.filterSection}>
        <h4>Payment Status</h4>
        <select
          value={filters.status}
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          className={styles.filterSelect}
        >
          <option value="all">All Statuses</option>
          <option value="paid">Paid</option>
          <option value="created">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div className={styles.filterSection}>
        <h4>Transaction Type</h4>
        <div className={styles.radioGroup}>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="transactionType"
              value="all"
              checked={filters.transactionType === 'all'}
              onChange={(e) => setFilters(prev => ({ ...prev, transactionType: e.target.value }))}
              className={styles.radioInput}
            />
            <span>All Transactions</span>
          </label>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="transactionType"
              value="payment"
              checked={filters.transactionType === 'payment'}
              onChange={(e) => setFilters(prev => ({ ...prev, transactionType: e.target.value }))}
              className={styles.radioInput}
            />
            <span>Job Payments</span>
          </label>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="transactionType"
              value="subscription"
              checked={filters.transactionType === 'subscription'}
              onChange={(e) => setFilters(prev => ({ ...prev, transactionType: e.target.value }))}
              className={styles.radioInput}
            />
            <span>Subscriptions</span>
          </label>
        </div>
      </div>

      <div className={styles.filterActions}>
        <button onClick={applyFilters} className={styles.applyButton}>
          Apply Filters
        </button>
        <button onClick={resetFilters} className={styles.resetButton}>
          <FiRefreshCw />
          Reset
        </button>
        <button onClick={cancelFilters} className={styles.cancelButton}>
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className={styles.modal}
      overlayClassName={styles.overlay}
    >
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <div className={styles.headerContent}>
            <h2>Transaction History</h2>
            <p>View all your payment transactions</p>
          </div>
          <div className={styles.headerActions}>
            <button 
              onClick={() => setShowFilters(!showFilters)} 
              className={`${styles.filterButton} ${showFilters ? styles.activeFilterButton : ''}`}
              aria-label="Toggle filters"
            >
              <FiFilter />
              <span>Filters</span>
              {getActiveFilterCount() > 0 && (
                <span className={styles.filterBadge}>{getActiveFilterCount()}</span>
              )}
            </button>
            <button onClick={onClose} className={styles.closeButton}>
              <FiX />
            </button>
          </div>
        </div>

        <div className={styles.modalBody}>
          {loading ? (
            <div className={styles.loadingState}>
              <Spinner animation="border" role="status" className={styles.spinner} />
              <p>Loading your transactions...</p>
            </div>
          ) : error ? (
            <div className={styles.errorState}>
              <FiXCircle className={styles.errorIcon} />
              <h3>Something went wrong</h3>
              <p>{error}</p>
            </div>
          ) : (
            <>
              {/* Filter Panel */}
              {showFilters && <FilterPanel />}

              {/* Summary Section */}
              <div className={styles.summarySection}>
                <div className={styles.summaryCard}>
                  <div className={styles.summaryIcon}>
                    <FiTrendingUp />
                  </div>
                  <div className={styles.summaryContent}>
                    <h3>Total Spent</h3>
                    <p>{formatAmount(totalAmount, 'INR')}</p>
                  </div>
                </div>
                
                <div className={styles.summaryCard}>
                  <div className={styles.successIcon}>
                    <FiCheckCircle />
                  </div>
                  <div className={styles.summaryContent}>
                    <h3>Successfully Paid</h3>
                    <p>{formatAmount(paidAmount, 'INR')}</p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className={styles.tabContainer}>
                <button
                  className={`${styles.tab} ${activeTab === 'payments' ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab('payments')}
                >
                  Job Payments
                  <span className={styles.tabCount}>{filteredPayments.length}</span>
                </button>
                <button
                  className={`${styles.tab} ${activeTab === 'subscriptions' ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab('subscriptions')}
                >
                  Subscriptions
                  <span className={styles.tabCount}>{filteredSubscriptions.length}</span>
                </button>
              </div>

              {/* Transactions List */}
              <div className={styles.transactionsList}>
                {activeTab === 'payments' ? (
                  filteredPayments.length === 0 ? (
                    <div className={styles.emptyState}>
                      <FiCreditCard className={styles.emptyIcon} />
                      <h3>No job payments found</h3>
                      <p>
                        {getActiveFilterCount() > 0 
                          ? 'Try adjusting your filters to see more results' 
                          : 'Your job posting payments will appear here'
                        }
                      </p>
                    </div>
                  ) : (
                    <div className={styles.transactionsGrid}>
                      {filteredPayments.map((transaction) => (
                        <TransactionCard 
                          key={`payment-${transaction.id}`} 
                          transaction={transaction} 
                          type="payment"
                        />
                      ))}
                    </div>
                  )
                ) : (
                  filteredSubscriptions.length === 0 ? (
                    <div className={styles.emptyState}>
                      <FiCreditCard className={styles.emptyIcon} />
                      <h3>No subscription payments found</h3>
                      <p>
                        {getActiveFilterCount() > 0 
                          ? 'Try adjusting your filters to see more results' 
                          : 'Your subscription payments will appear here'
                        }
                      </p>
                    </div>
                  ) : (
                    <div className={styles.transactionsGrid}>
                      {filteredSubscriptions.map((transaction) => (
                        <TransactionCard 
                          key={`subscription-${transaction.id}`} 
                          transaction={transaction} 
                          type="subscription"
                        />
                      ))}
                    </div>
                  )
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default Transaction;

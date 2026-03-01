'use client';

import React from 'react';
import Modal from 'react-modal';
import { FiX, FiCreditCard, FiSmartphone, FiGlobe, FiMail } from 'react-icons/fi';

if (typeof window !== 'undefined') {
  Modal.setAppElement('body');
}

const modalStyles = {
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 1100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    top: 'auto',
    left: 'auto',
    right: 'auto',
    bottom: 'auto',
    transform: 'none',
    maxWidth: '620px',
    width: '92%',
    maxHeight: '85vh',
    overflow: 'auto',
    borderRadius: '14px',
    border: '1px solid #e5e7eb',
    padding: '24px',
  },
};

const PaymentMethodsModal = ({ isOpen, onClose, userType = 'employer' }) => {
  const supportsSubscriptions = userType === 'employer' || userType === 'consultancy';

  return (
    <Modal isOpen={isOpen} onRequestClose={onClose} style={modalStyles} contentLabel="Payment Methods">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="m-0">Payment Methods</h3>
        <button className="btn btn-light" onClick={onClose} aria-label="Close">
          <FiX />
        </button>
      </div>

      <p className="text-muted mb-4">
        Payments are processed securely through Razorpay.
      </p>

      <div className="border rounded p-3 mb-3">
        <div className="d-flex align-items-center gap-2 mb-2">
          <FiCreditCard />
          <strong>Cards</strong>
        </div>
        <div className="text-muted small">Credit cards and debit cards (Visa, Mastercard, RuPay).</div>
      </div>

      <div className="border rounded p-3 mb-3">
        <div className="d-flex align-items-center gap-2 mb-2">
          <FiSmartphone />
          <strong>UPI</strong>
        </div>
        <div className="text-muted small">UPI apps and UPI IDs supported via Razorpay checkout.</div>
      </div>

      <div className="border rounded p-3 mb-3">
        <div className="d-flex align-items-center gap-2 mb-2">
          <FiGlobe />
          <strong>Net Banking / Wallets</strong>
        </div>
        <div className="text-muted small">Available as per Razorpay account and customer region.</div>
      </div>

      {!supportsSubscriptions && (
        <div className="alert alert-info mt-3 mb-0">
          Subscription plans are available for employer and consultancy accounts.
        </div>
      )}

      <a href="mailto:niranjanannavarapu@gmail.com" className="btn btn-primary mt-4">
        <FiMail className="me-2" />
        Contact Billing Support
      </a>
    </Modal>
  );
};

export default PaymentMethodsModal;

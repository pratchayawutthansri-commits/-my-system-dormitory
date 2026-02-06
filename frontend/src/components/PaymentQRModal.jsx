import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { generatePromptPayPayload, DEMO_PROMPTPAY_ID } from '../utils/promptpay';
import toast from 'react-hot-toast';

const PaymentQRModal = ({ invoice, onClose, onConfirmPayment }) => {
    const [slipImage, setSlipImage] = useState(null);

    if (!invoice) return null;

    const qrPayload = generatePromptPayPayload(DEMO_PROMPTPAY_ID, invoice.totalAmount);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('th-TH', {
            minimumFractionDigits: 0
        }).format(value);
    };

    const handleSlipChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('รูปภาพต้องมีขนาดไม่เกิน 5MB');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setSlipImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleConfirm = () => {
        if (!slipImage) {
            toast.error('กรุณาแนบสลิปการโอนเงิน');
            return;
        }
        if (onConfirmPayment) {
            onConfirmPayment(invoice.id);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
                <div className="modal-header">
                    <h3 className="modal-title">💳 รับชำระเงิน (QR Code)</h3>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>

                <div style={{
                    textAlign: 'center',
                    padding: '1.5rem',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(139, 92, 246, 0.05))',
                    borderRadius: '16px',
                    margin: '1rem',
                    border: '1px solid var(--border)'
                }}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.95rem', fontWeight: 500 }}>
                        ห้อง {invoice.room?.roomNumber} <span style={{ margin: '0 0.5rem', color: 'var(--border)' }}>|</span> {invoice.tenant?.firstName} {invoice.tenant?.lastName}
                    </p>

                    {/* Bill Breakdown */}
                    <div style={{
                        background: 'var(--bg-card)',
                        padding: '1rem',
                        borderRadius: '12px',
                        marginBottom: '1.5rem',
                        border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow-sm)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>ค่าเช่าห้อง</span>
                            <span style={{ fontWeight: 600 }}>฿{formatCurrency(invoice.rentAmount || 0)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>ค่าน้ำ</span>
                            <span style={{ fontWeight: 600, color: 'var(--info)' }}>฿{formatCurrency(invoice.waterAmount || 0)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>ค่าไฟ</span>
                            <span style={{ fontWeight: 600, color: 'var(--warning)' }}>฿{formatCurrency(invoice.electricAmount || 0)}</span>
                        </div>
                        <div style={{ borderTop: '1px dashed var(--border)', margin: '0.5rem 0' }}></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>ยอดรวมสุทธิ</span>
                            <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.25rem' }}>฿{formatCurrency(invoice.totalAmount)}</span>
                        </div>
                    </div>

                    <div style={{
                        background: 'white',
                        padding: '1rem',
                        borderRadius: '16px',
                        display: 'inline-block',
                        marginBottom: '1rem',
                        boxShadow: 'var(--shadow-md)'
                    }}>
                        <QRCodeSVG
                            value={qrPayload}
                            size={160}
                            level="M"
                            includeMargin={true}
                        />
                    </div>

                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                        PromptPay: <span style={{ fontFamily: 'monospace', fontSize: '1rem', color: 'var(--text-primary)' }}>{DEMO_PROMPTPAY_ID.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')}</span>
                    </p>
                </div>

                <div style={{
                    background: 'rgba(251, 191, 36, 0.1)',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    margin: '0 1rem 1.5rem',
                    fontSize: '0.85rem',
                    color: '#fbbf24',
                    textAlign: 'center'
                }}>
                    💡 ให้ผู้เช่าสแกน QR Code นี้เพื่อชำระเงิน
                </div>

                <div className="modal-footer" style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '1rem',
                    padding: '1rem 1.5rem 1.5rem',
                    borderTop: '1px solid var(--border)',
                    marginTop: '1rem'
                }}>
                    <button className="btn btn-secondary" onClick={onClose}>
                        ปิดหน้าต่าง
                    </button>
                    {onConfirmPayment && (
                        <button
                            className="btn btn-success"
                            onClick={() => onConfirmPayment(invoice.id)}
                        >
                            <span style={{ fontSize: '1.2rem' }}>💰</span> ยืนยันได้รับเงินแล้ว
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentQRModal;

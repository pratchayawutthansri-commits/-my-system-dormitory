import React from 'react';

const MoveOutNoticeDocument = React.forwardRef(({ settings, room, tenant, moveOutDate, refundAmount, deductions }, ref) => {
    // Always render container to keep ref stable
    if (!room || !tenant) {
        return (
            <div ref={ref} className="print-container" style={{ padding: '40px', background: 'white', visibility: 'hidden' }}>
                <p>Loading...</p>
            </div>
        );
    }

    // Format Date helper
    const formatDate = (date) => {
        if (!date) return '....................';
        return new Date(date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    return (
        <div ref={ref} className="print-container" style={{
            padding: '40px',
            background: 'white',
            color: 'black',
            fontFamily: '"Sarabun", "Thonburi", sans-serif',
            fontSize: '16px',
            lineHeight: '1.6',
            width: '100%',
            maxWidth: '210mm',
            minHeight: '297mm', // A4 height
            margin: '0 auto',
            boxSizing: 'border-box'
        }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>ใบแจ้งย้ายออก / สรุปการคืนเงินประกัน</h1>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0' }}>{settings?.dormName || 'หอพักของฉัน'}</h2>
            </div>

            {/* Date */}
            <div style={{ textAlign: 'right', marginBottom: '20px' }}>
                วันที่ {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>

            {/* Tenant Info */}
            <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>ข้อมูลผู้เช่า</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div><strong>ชื่อ-นามสกุล:</strong> {tenant?.firstName} {tenant?.lastName}</div>
                    <div><strong>ห้องเลขที่:</strong> {room?.roomNumber}</div>
                    <div><strong>วันที่ย้ายออก:</strong> {formatDate(moveOutDate)}</div>
                    <div><strong>เบอร์โทรศัพท์:</strong> {tenant?.phone || '-'}</div>
                </div>
            </div>

            {/* Calculation */}
            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', borderBottom: '2px solid #ddd', paddingBottom: '5px' }}>
                    สรุปยอดเงินคืน
                </h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
                            <th style={{ padding: '10px', textAlign: 'left' }}>รายการ</th>
                            <th style={{ padding: '10px', textAlign: 'right' }}>จำนวนเงิน (บาท)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '10px' }}>เงินประกัน (มัดจำ)</td>
                            <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>
                                + {parseFloat(room?.tenant?.depositAmount || 20000).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                        </tr>
                        {deductions && deductions.length > 0 ? (
                            deductions.map((item, index) => (
                                <tr key={index} style={{ borderBottom: '1px solid #eee', color: '#DC2626' }}>
                                    <td style={{ padding: '10px' }}>หัก: {item.note || 'ค่าเสียหาย/ค้างชำระ'}</td>
                                    <td style={{ padding: '10px', textAlign: 'right' }}>
                                        - {parseFloat(item.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '10px', color: '#999', fontStyle: 'italic' }}>ไม่มีรายการหัก</td>
                                <td style={{ padding: '10px', textAlign: 'right' }}>0.00</td>
                            </tr>
                        )}

                        <tr style={{ borderTop: '2px solid black', fontWeight: 'bold', fontSize: '1.1em' }}>
                            <td style={{ padding: '15px 10px' }}>ยอดเงินคืนสุทธิ</td>
                            <td style={{ padding: '15px 10px', textAlign: 'right' }}>
                                {parseFloat(refundAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Signatures */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '60px', padding: '0 20px' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderBottom: '1px dashed black', width: '200px', height: '40px', margin: '0 auto' }}></div>
                    <p style={{ marginTop: '10px' }}>({settings?.dormName || 'ผู้ดูแลหอพัก'})</p>
                    <p style={{ fontSize: '12px' }}>ผู้คืนเงิน</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderBottom: '1px dashed black', width: '200px', height: '40px', margin: '0 auto' }}></div>
                    <p style={{ marginTop: '10px' }}>({tenant?.firstName} {tenant?.lastName})</p>
                    <p style={{ fontSize: '12px' }}>ผู้รับเงินคืน</p>
                </div>
            </div>

            <div style={{ marginTop: '40px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
                * ผู้เช่าได้รับเงินคืนครบถ้วนถูกต้องแล้ว และไม่ติดใจเรียกร้องสิทธิ์ใดๆ อีก
            </div>
        </div>
    );
});

export default MoveOutNoticeDocument;

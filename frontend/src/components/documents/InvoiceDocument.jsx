import React from 'react';

const InvoiceDocument = React.forwardRef(({ invoice, settings }, ref) => {
    // Always render container to keep ref stable
    if (!invoice) {
        return (
            <div ref={ref} className="print-container" style={{ padding: '20px', background: 'white', visibility: 'hidden' }}>
                <p>Loading...</p>
            </div>
        );
    }

    const isPaid = invoice.status === 'PAID';
    const documentTitle = isPaid ? 'ใบเสร็จรับเงิน / Receipt' : 'ใบแจ้งหนี้ / Invoice';
    const documentPrefix = isPaid ? 'RCP' : 'INV';

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('th-TH', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    return (
        <div ref={ref} className="print-container" style={{
            padding: '20px 25px',
            background: 'white',
            color: 'black',
            fontFamily: '"Sarabun", "Thonburi", sans-serif',
            fontSize: '12px',
            lineHeight: '1.4',
            width: '100%',
            maxWidth: '210mm',
            margin: '0 auto',
            boxSizing: 'border-box'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
                <div>
                    <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0', color: isPaid ? '#16a34a' : '#000' }}>{documentTitle}</h1>
                    <h2 style={{ fontSize: '14px', fontWeight: 'bold', margin: '3px 0 0' }}>{settings?.dormName || 'หอพัก'}</h2>
                    <p style={{ margin: '2px 0 0', color: '#555', fontSize: '11px', maxWidth: '250px' }}>{settings?.address}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '11px' }}><strong>เลขประจำตัวผู้เสียภาษี:</strong> {settings?.promptPayID || '-'}</p>
                </div>
                <div style={{ textAlign: 'right', fontSize: '11px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>เลขที่: {documentPrefix}-{invoice.id.toString().padStart(6, '0')}</div>
                    <div>วันที่: {formatDate(new Date())}</div>
                    <div>รอบบิล: {new Date(invoice.billingMonth).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}</div>
                    {isPaid ? (
                        <div style={{ marginTop: '5px', color: '#16a34a', fontWeight: 'bold' }}>✓ ชำระแล้ว</div>
                    ) : (
                        <div style={{ marginTop: '5px', color: '#DC2626', fontWeight: 'bold' }}>กำหนดชำระ: {formatDate(invoice.dueDate)}</div>
                    )}
                </div>
            </div>

            {/* Customer Info - Compact */}
            <div style={{ marginBottom: '10px', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><strong>ผู้เช่า:</strong> {invoice.room?.tenant?.firstName} {invoice.room?.tenant?.lastName}</div>
                <div><strong>ห้อง:</strong> <span style={{ fontSize: '1.3em', fontWeight: 'bold' }}>{invoice.room?.roomNumber}</span></div>
                <div><strong>โทร:</strong> {invoice.room?.tenant?.phone || '-'}</div>
            </div>

            {/* Items Table - Compact */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
                <thead>
                    <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #000' }}>
                        <th style={{ padding: '8px', textAlign: 'left' }}>รายการ</th>
                        <th style={{ padding: '8px', textAlign: 'center', width: '15%' }}>หน่วย</th>
                        <th style={{ padding: '8px', textAlign: 'right', width: '15%' }}>ราคา/หน่วย</th>
                        <th style={{ padding: '8px', textAlign: 'right', width: '18%' }}>จำนวนเงิน</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '6px 8px' }}>ค่าเช่าห้องพัก</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>1 เดือน</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right' }}>{parseFloat(invoice.rentAmount).toLocaleString()}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right' }}>{parseFloat(invoice.rentAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '6px 8px' }}>
                            ค่าน้ำประปา <span style={{ fontSize: '10px', color: '#666' }}>({invoice.waterUnits} หน่วย)</span>
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>{invoice.waterUnits}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right' }}>{settings?.waterRate || 18}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right' }}>{parseFloat(invoice.waterAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '6px 8px' }}>
                            ค่าไฟฟ้า <span style={{ fontSize: '10px', color: '#666' }}>({invoice.electricUnits} หน่วย)</span>
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>{invoice.electricUnits}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right' }}>{settings?.electricRate || 8}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right' }}>{parseFloat(invoice.electricAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr>
                        <td colSpan="3" style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 'bold', borderTop: '2px solid #000' }}>รวมทั้งสิ้น</td>
                        <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 'bold', fontSize: '16px', borderTop: '2px solid #000' }}>
                            {parseFloat(invoice.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })} บาท
                        </td>
                    </tr>
                </tfoot>
            </table>

            {/* Footer Section - Side by Side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px' }}>
                {/* Payment Info or Paid Stamp */}
                <div style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '4px', fontSize: '11px' }}>
                    {isPaid ? (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#16a34a', border: '3px solid #16a34a', borderRadius: '8px', padding: '10px', display: 'inline-block' }}>
                                ✓ ชำระเงินแล้ว<br />
                                <span style={{ fontSize: '12px' }}>{formatDate(invoice.paidAt || new Date())}</span>
                            </div>
                        </div>
                    ) : (
                        <>
                            <h3 style={{ fontSize: '12px', fontWeight: 'bold', margin: '0 0 5px' }}>ช่องทางการชำระเงิน</h3>
                            <p style={{ margin: '2px 0' }}><strong>พร้อมเพย์:</strong> {settings?.promptPayID || '-'}</p>
                            <p style={{ margin: '2px 0' }}><strong>ชื่อบัญชี:</strong> {settings?.promptPayName || '-'}</p>
                            <p style={{ margin: '5px 0 0', fontSize: '10px', color: '#666' }}>* กรุณาส่งสลิปผ่านระบบหรือ Line</p>
                        </>
                    )}
                </div>

                {/* Signature Box */}
                <div style={{ border: '1px dashed #ddd', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
                    <div style={{ width: '80px', height: '60px', border: '1px solid #eee', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: '10px' }}>
                        ตราประทับ
                    </div>
                    <p style={{ marginTop: '5px', fontSize: '10px', marginBottom: 0 }}>ลายเซ็นผู้รับเงิน</p>
                </div>
            </div>

            {/* Footer Note */}
            <div style={{ marginTop: '10px', fontSize: '10px', color: '#999', textAlign: 'center' }}>
                เอกสารนี้สร้างโดยระบบ {settings?.brandName || 'DormManager'}
            </div>

            <style>{`
                @media print {
                    @page { margin: 10mm; size: A4; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .print-container { page-break-inside: avoid; }
                }
            `}</style>
        </div>
    );
});

export default InvoiceDocument;

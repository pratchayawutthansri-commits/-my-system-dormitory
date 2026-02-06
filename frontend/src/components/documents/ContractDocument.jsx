import React from 'react';

const ContractDocument = React.forwardRef(({ settings, room, tenant, startDate, endDate, deposit }, ref) => {
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
        return new Date(date).toLocaleDateString('th-TH', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
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
            minHeight: '297mm',
            margin: '0 auto',
            boxSizing: 'border-box'
        }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>สัญญาเช่าหอพัก</h1>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0' }}>{settings?.dormName || 'หอพักของฉัน'}</h2>
                <p style={{ color: '#555', fontSize: '14px', marginTop: '5px' }}>
                    {settings?.address || '...................................................'}
                </p>
            </div>

            {/* Date */}
            <div style={{ textAlign: 'right', marginBottom: '20px' }}>
                วันที่ {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>

            {/* Content Body */}
            <div style={{ marginBottom: '30px' }}>
                <p>
                    สัญญาฉบับนี้ทำขึ้นระหว่าง <strong>{settings?.dormName || 'ผู้ให้เช่า'}</strong> (ซึ่งต่อไปนี้จะเรียกว่า "ผู้ให้เช่า")
                    ฝ่ายหนึ่ง กับ <strong>{tenant?.firstName} {tenant?.lastName}</strong> (ซึ่งต่อไปนี้จะเรียกว่า "ผู้เช่า") อีกฝ่ายหนึ่ง
                </p>
                <p>
                    คู่สัญญาทั้งสองฝ่ายตกลงทำสัญญาเช่าห้องพักเลขที่ <strong>{room?.roomNumber}</strong>
                    โดยมีรายละเอียดดังต่อไปนี้:
                </p>
            </div>

            {/* Details Table */}
            <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginBottom: '30px',
                border: '1px solid #ddd'
            }}>
                <tbody>
                    <tr style={{ borderBottom: '1px solid #ddd' }}>
                        <td style={{ padding: '10px', fontWeight: 'bold', width: '30%' }}>ระยะเวลาสัญญา</td>
                        <td style={{ padding: '10px' }}>
                            เริ่ม {formatDate(startDate)} สิ้นสุด {formatDate(endDate)}
                        </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #ddd' }}>
                        <td style={{ padding: '10px', fontWeight: 'bold' }}>ค่าเช่ารายเดือน</td>
                        <td style={{ padding: '10px' }}>
                            {parseInt(room?.baseRent || 0).toLocaleString()} บาท
                        </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #ddd' }}>
                        <td style={{ padding: '10px', fontWeight: 'bold' }}>เงินประกัน (มัดจำ)</td>
                        <td style={{ padding: '10px' }}>
                            {parseInt(deposit || 0).toLocaleString()} บาท (ได้รับแล้ว)
                        </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #ddd' }}>
                        <td style={{ padding: '10px', fontWeight: 'bold' }}>ค่าน้ำ / ค่าไฟ</td>
                        <td style={{ padding: '10px' }}>
                            ค่าน้ำ {settings?.waterRate} บาท/หน่วย, ค่าไฟ {settings?.electricRate} บาท/หน่วย
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* Rules */}
            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', borderBottom: '2px solid #ddd', paddingBottom: '5px' }}>
                    กฎระเบียบและข้อตกลง
                </h3>
                <div style={{ whiteSpace: 'pre-wrap', fontSize: '14px', lineHeight: '1.8' }}>
                    {settings?.dormRules ? settings.dormRules : (
                        <ul style={{ paddingLeft: '20px', margin: 0 }}>
                            <li>ผู้เช่าต้องชำระค่าเช่าภายในวันที่กำหนดของทุกเดือน</li>
                            <li>ห้ามส่งเสียงดังรบกวนผู้อื่นยามวิกาล</li>
                            <li>ห้ามเลี้ยงสัตว์เลี้ยงทุกชนิดภายในห้องพัก</li>
                            <li>ห้ามกระทำการใดๆ ที่ผิดกฎหมายภายในหอพัก</li>
                            <li>หากย้ายออกก่อนกำหนด จะไม่ได้รับเงินประกันคืน</li>
                        </ul>
                    )}
                </div>
            </div>

            {/* Signatures */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '60px', padding: '0 20px' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderBottom: '1px dashed black', width: '200px', height: '40px', margin: '0 auto' }}></div>
                    <p style={{ marginTop: '10px' }}>({settings?.dormName || 'ผู้ให้เช่า'})</p>
                    <p style={{ fontSize: '12px' }}>ลงชื่อผู้ให้เช่า</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderBottom: '1px dashed black', width: '200px', height: '40px', margin: '0 auto' }}></div>
                    <p style={{ marginTop: '10px' }}>({tenant?.firstName} {tenant?.lastName})</p>
                    <p style={{ fontSize: '12px' }}>ลงชื่อผู้เช่า</p>
                </div>
            </div>

            {/* Footer */}
            <div style={{ position: 'absolute', bottom: '20px', left: '0', right: '0', textAlign: 'center', fontSize: '12px', color: '#999' }}>
                เอกสารนี้สร้างโดยระบบ {settings?.brandName || 'DormManager'}
            </div>

            <style jsx global>{`
                @media print {
                    @page { margin: 15mm; }
                    body { -webkit-print-color-adjust: exact; }
                }
            `}</style>
        </div>
    );
});

export default ContractDocument;

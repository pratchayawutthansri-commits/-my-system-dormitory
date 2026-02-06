// 📦 Shared Formatting Utilities
// รวม helper functions ที่ใช้บ่อยทั้งหมดไว้ที่เดียว

/**
 * Format number as Thai Baht currency
 * @param {number} value - Amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value) => {
    return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        minimumFractionDigits: 0
    }).format(value || 0);
};

/**
 * Format date as Thai month/year (e.g., "มกราคม 2567")
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
    return new Date(date).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long'
    });
};

/**
 * Format date with time (e.g., "28 ม.ค. 2567, 13:00")
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted datetime string
 */
export const formatDateTime = (date) => {
    return new Date(date).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

/**
 * Format date as short date (e.g., "28/01/2567")
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatShortDate = (date) => {
    return new Date(date).toLocaleDateString('th-TH');
};

// ==================== Status Badges ====================

/**
 * Get invoice status badge config
 * @param {string} status - PENDING | PAID | OVERDUE
 * @returns {object} Badge config with class and label
 */
export const getInvoiceStatusBadge = (status) => {
    const badges = {
        PENDING: { class: 'badge-warning', label: 'รอชำระ' },
        PAID: { class: 'badge-success', label: 'ชำระแล้ว' },
        OVERDUE: { class: 'badge-danger', label: 'เกินกำหนด' }
    };
    return badges[status] || badges.PENDING;
};

/**
 * Get room status badge config
 * @param {string} status - AVAILABLE | OCCUPIED | MAINTENANCE
 * @returns {object} Badge config with class and label
 */
export const getRoomStatusBadge = (status) => {
    const badges = {
        AVAILABLE: { class: 'badge-success', label: 'ว่าง' },
        OCCUPIED: { class: 'badge-primary', label: 'มีผู้เช่า' },
        MAINTENANCE: { class: 'badge-warning', label: 'ซ่อมบำรุง' }
    };
    return badges[status] || badges.AVAILABLE;
};

/**
 * Get maintenance status badge config
 * @param {string} status - PENDING | IN_PROGRESS | COMPLETED
 * @returns {object} Badge config with class and label
 */
export const getMaintenanceStatusBadge = (status) => {
    const badges = {
        PENDING: { class: 'badge-warning', label: '🕐 รอรับเรื่อง' },
        IN_PROGRESS: { class: 'badge-primary', label: '🔧 กำลังซ่อม' },
        COMPLETED: { class: 'badge-success', label: '✅ เสร็จสิ้น' }
    };
    return badges[status] || badges.PENDING;
};

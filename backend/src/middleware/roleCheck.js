const roleCheck = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required.' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
        }

        next();
    };
};

const isAdmin = roleCheck('ADMIN');
const isTenant = roleCheck('TENANT');
const isAdminOrTenant = roleCheck('ADMIN', 'TENANT');

module.exports = { roleCheck, isAdmin, isTenant, isAdminOrTenant };

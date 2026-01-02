const { pool } = require('../config/database');

/**
 * Log an action to the audit_logs table
 * @param {Object} params - Log parameters
 * @param {string} params.tenantId - Tenant ID
 * @param {string} params.userId - User ID
 * @param {string} params.action - Action performed
 * @param {string} params.entityType - Type of entity affected
 * @param {string} params.entityId - ID of entity affected
 * @param {string} params.ipAddress - IP address of requester
 */
async function logAction({ tenantId, userId, action, entityType, entityId, ipAddress }, client = null) {
  try {
    const query = `
      INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [tenantId, userId, action, entityType, entityId, ipAddress];
    
    // Use provided client for transactions, otherwise use pool
    const result = client ? await client.query(query, values) : await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error logging action:', error);
    // Don't throw error as audit logging shouldn't break the main flow
    return null;
  }
}

module.exports = {
  logAction
};
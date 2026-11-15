const pool = require('../config/db');

/**
 * Run work inside one InnoDB transaction.
 * COMMIT on success. ROLLBACK if work throws, so partial updates are not kept.
 * This is the ACID boundary used by complaint creation and resource allocation.
 */
async function withTransaction(work) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    try {
      await connection.rollback();
    } catch (rollbackError) {
      console.error('Rollback failed:', rollbackError.message);
    }
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { withTransaction };

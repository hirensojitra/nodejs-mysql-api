const pool = require("../database/index");
const villageController = {
  getAll: async (req, res) => {
    try {
      const sql = `
            SELECT v.*, t.name AS taluka_name, d.name AS district_name
            FROM village v
            JOIN taluka t ON v.taluka_id = t.id
            JOIN district d ON v.district_id = d.id
            WHERE v.is_deleted = 0 AND t.is_deleted = 0 AND d.is_deleted = 0
        `;

      const result = await pool.query(sql);

      res.json({
        data: result.rows,
      });
    } catch (error) {
      console.error(error);
      res.json({
        status: "error",
        message: "Village not found",
      });
    }
  },
  getByTalukaId: async (req, res) => {
    try {
      const { id } = req.params;
      const getVillagesByTaluka = `
            SELECT v.id, v.name, v.gu_name, t.name as taluka_name, t.id as taluka_id, t.gu_name as taluka_gu_name, d.name as district_name, d.id as district_id, d.gu_name as district_gu_name
            FROM village v
            JOIN taluka t ON v.taluka_id = t.id
            JOIN district d ON v.district_id = d.id
            WHERE v.taluka_id = $1 AND v.is_deleted = 0 AND t.is_deleted = 0 AND d.is_deleted = 0;
        `;
      const villages = await pool.query(getVillagesByTaluka, [id]);

      res.json(villages.rows);
    } catch (error) {
      console.error("Error retrieving villages:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },
  getDeletedAll: async (req, res) => {
    try {
      const sql = `
            SELECT v.*, t.name AS taluka_name, d.name AS district_name
            FROM village v
            JOIN taluka t ON v.taluka_id = t.id
            JOIN district d ON v.district_id = d.id
            WHERE v.is_deleted = 1 AND t.is_deleted = 0 AND d.is_deleted = 0
        `;
      const result = await pool.query(sql);

      res.json({
        data: result.rows,
      });
    } catch (error) {
      console.error(error);
      res.json({
        status: "error",
        message: "Village not found",
      });
    }
  },
  getDeletedByTalukaId: async (req, res) => {
    try {
      const { id } = req.params;

      const sql = `
            SELECT v.*, t.name AS taluka_name, d.name AS district_name
            FROM village v
            JOIN taluka t ON v.taluka_id = t.id
            JOIN district d ON v.district_id = d.id
            WHERE v.is_deleted = 1 AND t.is_deleted = 0 AND d.is_deleted = 0 AND v.taluka_id = $1
        `;

      const result = await pool.query(sql, [id]);

      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.json({
        status: "error",
        message: "Village not found",
      });
    }
  },
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const sql = `
          SELECT v.id, v.name, v.gu_name, t.name AS taluka_name, t.id AS taluka_id, t.gu_name AS taluka_gu_name, d.name AS district_name, d.id AS district_id, d.gu_name AS district_gu_name
          FROM village v
          JOIN taluka t ON v.taluka_id = t.id
          JOIN district d ON v.district_id = d.id
          WHERE v.id = $1 AND v.is_deleted = 0 AND t.is_deleted = 0 AND d.is_deleted = 0
      `;
      const result = await pool.query(sql, [id]);
      res.json({
        data: result.rows[0],
      });
    } catch (error) {
      console.error(error);
      res.json({
        status: "error",
      });
    }
  },
  create: async (req, res) => {
    try {
      const { name, gu_name, is_deleted, taluka_id } = req.body;

      const sql = `
          INSERT INTO village (name, gu_name, is_deleted, taluka_id, district_id)
          SELECT $1, $2, $3, t.id, d.id
          FROM taluka t
          JOIN district d ON t.district_id = d.id
          WHERE t.id = $4 AND t.is_deleted = 0 AND d.is_deleted = 0
      `;
      const result = await pool.query(sql, [
        name,
        gu_name,
        is_deleted ? 1 : 0,
        taluka_id,
      ]);

      res.json({
        data: result.rows,
      });
    } catch (error) {
      console.error(error);
      res.json({
        status: "error",
      });
    }
  },
  update: async (req, res) => {
    try {
      const { name, gu_name, is_deleted, taluka_id, district_id } = req.body;
      const { id } = req.params;

      const sql = `
      UPDATE village SET
      name = $1,
      gu_name = $2,
      is_deleted = $3,
      taluka_id = $4,
      district_id = $5
      WHERE
      id = $6
      AND 
      is_deleted = 0
      AND EXISTS (
          SELECT 1 FROM taluka t
          JOIN district d ON t.district_id = d.id
          WHERE t.id = $7
          AND t.is_deleted = 0
          AND d.is_deleted = 0
          AND taluka_id = t.id
      )
      
      `;

      const result = await pool.query(sql, [
        name,
        gu_name,
        is_deleted ? 1 : 0,
        taluka_id,
        district_id,
        id,
        taluka_id,
      ]);

      res.json({
        data: result.rows,
      });
    } catch (error) {
      console.error(error);
      res.json({
        status: "error",
      });
    }
  },
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const sql = `
      UPDATE village 
        SET is_deleted = 1
        WHERE id = $1 AND is_deleted = 0
        AND EXISTS (
            SELECT 1 FROM taluka t
            JOIN district d ON t.district_id = d.id
            WHERE t.id = taluka_id AND t.is_deleted = 0 AND d.is_deleted = 0
        )`;
      const result = await pool.query(sql, [id]);
      res.json({
        data: result.rows,
      });
    } catch (error) {
      console.error(error);
      res.json({
        status: "error",
      });
    }
  },
  restore: async (req, res) => {
    try {
      const { id } = req.params;

      const sql = `
            UPDATE village
            SET is_deleted = 0
            WHERE id = $1
            AND EXISTS (
                SELECT 1 FROM taluka t
                JOIN district d ON t.district_id = d.id
                WHERE t.id = taluka_id AND t.is_deleted = 0 AND d.is_deleted = 0
            )
        `;

      const result = await pool.query(sql, [id]);

      res.json({
        data: result.rows,
      });
    } catch (error) {
      console.error(error);
      res.json({
        status: "error",
      });
    }
  },
  deletedLength: async (req, res) => {
    try {
      const { id } = req.params;

      const sql = `
            SELECT COUNT(*) AS deletedVillageCount
            FROM village v
            JOIN taluka t ON v.taluka_id = t.id
            JOIN district d ON v.district_id = d.id
            WHERE v.is_deleted = 1 AND t.is_deleted = 0 AND d.is_deleted = 0 AND t.id = $1
        `;

      const result = await pool.query(sql, [id]);

      res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.json({
        status: "error",
      });
    }
  },
};

module.exports = villageController;

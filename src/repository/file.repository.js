import pool from "../config/database.config.js";

export const saveFileInfo = async ({ filename, originalName, mimetype, size, url }) => {
  const queryText = `
    INSERT INTO uploaded_files (filename, original_name, mimetype, size, url)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const values = [filename, originalName, mimetype, size, url];
  const result = await pool.query(queryText, values);
  return result.rows[0];
};

export const saveMultipleFilesInfo = async (filesList) => {
  const savedRecords = [];
  for (const file of filesList) {
    const record = await saveFileInfo(file);
    savedRecords.push(record);
  }
  return savedRecords;
};

export const updateUserAvatar = async (userId, avatarUrl) => {
  const queryText = `
    UPDATE users 
    SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP 
    WHERE id = $2 
    RETURNING id, name, email, avatar_url;
  `;
  const result = await pool.query(queryText, [avatarUrl, userId]);
  return result.rows[0];
};
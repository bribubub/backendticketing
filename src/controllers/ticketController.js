import { pool } from '../config/db.js';
import { sendTicketCreatedEmail } from '../../emailService.js'; 

const HISTORY_TEMPLATES = {
  'receive': { title: "Laporan Diterima 📥", desc: "Laporan Anda sudah masuk dan sedang menunggu antrean." },
  'open': { title: "Sedang Dilihat Admin 👀", desc: "Laporan Anda sedang dicek dan ditangani oleh tim teknisi kami." },
  'testing': { title: "Tahap Pengujian ⚙️", desc: "Perbaikan sedang diuji coba sebelum diselesaikan." },
  'close': { title: "Tiket Selesai ✅", desc: "Kendala telah berhasil diselesaikan." }
};

export const createTicket = async (req, res) => {
  console.log("\n--- 📥 Request Tiket Baru Masuk ---");
  const { merchant, device_type, title, description, owner_email, image_url, image_url_2 } = req.body;
  const ticket_number = `TIK-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
  
  try {
    const sql = `INSERT INTO tickets (ticket_number, merchant, device_type, title, description, image_url, image_url_2, owner_email, status) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'receive') RETURNING id`;
    
    const result = await pool.query(sql, [
      ticket_number, merchant, device_type, title, description, 
      image_url || null, image_url_2 || null, owner_email
    ]);
    
    await pool.query(
      "INSERT INTO ticket_histories (ticket_id, title, description) VALUES ($1, $2, $3)", 
      [result.rows[0].id, 'Tiket Dibuat 📝', 'Laporan berhasil diterima oleh sistem.']
    );

    if (owner_email) {
      console.log(`📧 Memicu pengiriman email ke ${owner_email}...`);
      sendTicketCreatedEmail(owner_email, merchant, ticket_number, title, device_type)
        .catch(err => console.error("❌ Email gagal dikirim di background:", err));
    }

    res.json({ message: 'Sukses!' });
  } catch (err) {
    console.error("🔥 ERROR FATAL:", err.message);
    res.status(500).json({ error: err.message });
  }
};

export const getAllTickets = async (req, res) => {
  try { res.json((await pool.query("SELECT * FROM tickets ORDER BY created_at DESC")).rows); } 
  catch (err) { res.status(500).json({ error: err.message }); }
};

export const getTicketHistory = async (req, res) => {
  try { res.json((await pool.query("SELECT * FROM ticket_histories WHERE ticket_id = $1 ORDER BY created_at DESC", [req.params.id])).rows); } 
  catch (err) { res.status(500).json({ error: err.message }); }
};

export const updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, resolution_note } = req.body;
    
    await pool.query(
      `UPDATE tickets SET status = $1, priority = COALESCE($2, priority), resolution_note = COALESCE($3, resolution_note) WHERE id = $4`, 
      [status, priority, resolution_note, id]
    );

    const template = HISTORY_TEMPLATES[status] || { title: "Status Diperbarui 🔄", desc: `Status tiket diubah ke: ${status}` };
    const finalDesc = (status === 'close' && resolution_note) ? `Catatan Teknisi: ${resolution_note}` : template.desc;

    await pool.query(
      "INSERT INTO ticket_histories (ticket_id, title, description) VALUES ($1, $2, $3)", 
      [id, template.title, finalDesc]
    );

    res.json({ message: 'Sukses' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const deleteTicket = async (req, res) => {
  try {
    await pool.query("DELETE FROM tickets WHERE id = $1", [req.params.id]);
    res.json({ message: 'Dihapus!' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
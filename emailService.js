import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS
  }
});

export const sendTicketCreatedEmail = async (owner_email, merchant, ticket_number, title, device_type) => {
  if (!owner_email) return; 

  try {
    await transporter.sendMail({
      from: '"IT Support Eloku" <' + process.env.EMAIL_USER + '>', 
      to: owner_email,
      subject: `[Eloku Support] Tiket Anda Diterima - ${ticket_number}`,
      html: `
        <h3>Halo ${merchant},</h3>
        <p>Laporan kendala Anda telah kami terima dan masuk ke antrean teknisi kami.</p>
        <ul>
          <li><strong>Nomor Tiket:</strong> ${ticket_number}</li>
          <li><strong>Kendala:</strong> ${title}</li>
          <li><strong>Kategori:</strong> ${device_type}</li>
        </ul>
        <p>Kami akan segera mengerjakannya. Anda akan mendapat email lagi saat tiket selesai.</p>
      `
    });
    console.log(`✅ Email konfirmasi tiket ${ticket_number} terkirim ke ${owner_email}`);
  } catch (err) {
    console.error("❌ Gagal kirim email pembuatan tiket:", err);
  }
};

export const sendTicketClosedEmail = async (owner_email, ticket_number, resolution_note) => {
  if (!owner_email) return; 

  try {
    await transporter.sendMail({
      from: '"IT Support Eloku" <' + process.env.EMAIL_USER + '>',
      to: owner_email,
      subject: `[Eloku Support] Tiket Selesai - ${ticket_number}`,
      html: `
        <h3>Halo,</h3>
        <p>Kabar baik! Kendala Anda <strong>${ticket_number}</strong> telah diselesaikan oleh teknisi kami.</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-left: 4px solid #10b981;">
          <p style="margin:0; font-size: 12px; color: #6b7280;">TINDAKAN PERBAIKAN:</p>
          <p style="margin: 5px 0 0 0; font-style: italic;">"${resolution_note}"</p>
        </div>
        <p>Terima kasih telah menggunakan layanan IT Support kami!</p>
      `
    });
    console.log(`✅ Email penutupan tiket ${ticket_number} terkirim ke ${owner_email}`);
  } catch (err) {
    console.error("❌ Gagal kirim email penutupan tiket:", err);
  }
};
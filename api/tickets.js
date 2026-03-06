export default async function handler(req, res) {
    const API_URL = process.env.GOOGLE_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbwDJZilqySP8zZBHetfQyd-xloh3dz_eKbpwwkLiKohqeQDIRPM8L_H6AjtTU7CSYaT/exec";
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    let phone;
    try {
        phone = Buffer.from(token, 'base64').toString('utf-8');
        if (!phone || phone.replace(/\D/g, '').length < 10) throw new Error('Invalid');
    } catch {
        return res.status(401).json({ error: 'Invalid token' });
    }

    if (req.method === 'POST') {
        try {
            if (!req.body || typeof req.body !== 'object') {
                return res.status(400).json({ error: 'Invalid payload' });
            }
            fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(req.body)
            }).catch(() => { });
            return res.status(200).json({ ok: true });
        } catch {
            return res.status(500).json({ error: 'Failed' });
        }
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
}

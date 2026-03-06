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

    if (req.method === 'GET') {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15000);
            const response = await fetch(
                `${API_URL}?action=getTickets&phone=${encodeURIComponent(phone)}`,
                { signal: controller.signal }
            );
            clearTimeout(timeout);
            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch {
                return res.status(200).json({ data: [] });
            }
            if (Array.isArray(data)) {
                return res.status(200).json({ data });
            }
            if (data && Array.isArray(data.data)) {
                return res.status(200).json({ data: data.data });
            }
            if (data && typeof data === 'object') {
                return res.status(200).json({ data: [] });
            }
            return res.status(200).json({ data: [] });
        } catch {
            return res.status(200).json({ data: [], error: 'Connection failed' });
        }
    }

    if (req.method === 'POST') {
        try {
            if (!req.body || typeof req.body !== 'object') {
                return res.status(400).json({ error: 'Invalid payload' });
            }
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 20000);
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(req.body),
                signal: controller.signal
            });
            clearTimeout(timeout);
            const text = await response.text();
            let data;
            try { data = JSON.parse(text); } catch { data = { ok: true }; }
            return res.status(200).json(data);
        } catch {
            return res.status(500).json({ error: 'Submission failed — will retry offline' });
        }
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
}

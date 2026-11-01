const express = require('express');
const { db } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

/**
 * Get In-App Notifications for Current User with Pagination & Strict Isolation
 * GET /api/notifications?page=1&limit=50
 */
router.get('/', (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const offset = (page - 1) * limit;

    let notifications = [];
    let totalCount = 0;
    let unreadCount = 0;

    if (req.user.role === 'student') {
      // Derive recipient strictly from JWT authenticated user email
      const studentEmail = req.user.email.trim().toLowerCase();

      unreadCount = db.prepare(`
        SELECT COUNT(*) AS count 
        FROM notification 
        WHERE recipient_user_id = ? AND read_at IS NULL
      `).get(studentEmail).count;

      totalCount = db.prepare(`
        SELECT COUNT(*) AS count 
        FROM notification 
        WHERE recipient_user_id = ?
      `).get(studentEmail).count;

      notifications = db.prepare(`
        SELECT * FROM notification 
        WHERE recipient_user_id = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `).all(studentEmail, limit, offset);

    } else if (req.user.role === 'recruiter') {
      // Recruiters see notifications they sent or associated with their company
      const senderEmail = req.user.email.trim().toLowerCase();

      unreadCount = db.prepare(`
        SELECT COUNT(*) AS count 
        FROM notification 
        WHERE sender_id = ? AND read_at IS NULL
      `).get(senderEmail).count;

      totalCount = db.prepare(`
        SELECT COUNT(*) AS count 
        FROM notification 
        WHERE sender_id = ?
      `).get(senderEmail).count;

      notifications = db.prepare(`
        SELECT * FROM notification 
        WHERE sender_id = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `).all(senderEmail, limit, offset);

    } else if (req.user.role === 'placement') {
      // Placement Cell administrators see all notifications
      unreadCount = db.prepare(`
        SELECT COUNT(*) AS count 
        FROM notification 
        WHERE read_at IS NULL
      `).get().count;

      totalCount = db.prepare(`
        SELECT COUNT(*) AS count 
        FROM notification
      `).get().count;

      notifications = db.prepare(`
        SELECT * FROM notification 
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `).all(limit, offset);
    }

    return res.json({
      page,
      limit,
      totalCount,
      unreadCount,
      notifications: notifications.map(n => ({
        ...n,
        type: n.event_type,
        is_read: n.read_at ? 1 : 0
      }))
    });
  } catch (err) {
    console.error('Fetch notifications error:', err);
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

/**
 * Mark Single Notification as Read
 * PUT /api/notifications/:id/read
 */
router.put('/:id/read', (req, res) => {
  try {
    const notifId = req.params.id;

    if (req.user.role === 'student') {
      const studentEmail = req.user.email.trim().toLowerCase();
      db.prepare(`
        UPDATE notification 
        SET read_at = CURRENT_TIMESTAMP 
        WHERE id = ? AND recipient_user_id = ? AND read_at IS NULL
      `).run(notifId, studentEmail);
    } else if (req.user.role === 'recruiter') {
      const senderEmail = req.user.email.trim().toLowerCase();
      db.prepare(`
        UPDATE notification 
        SET read_at = CURRENT_TIMESTAMP 
        WHERE id = ? AND sender_id = ? AND read_at IS NULL
      `).run(notifId, senderEmail);
    } else {
      db.prepare(`
        UPDATE notification 
        SET read_at = CURRENT_TIMESTAMP 
        WHERE id = ? AND read_at IS NULL
      `).run(notifId);
    }

    return res.json({ message: 'Marked as read' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update notification' });
  }
});

/**
 * Mark All Notifications as Read
 * PUT /api/notifications/read-all
 */
router.put('/read-all', (req, res) => {
  try {
    if (req.user.role === 'student') {
      const studentEmail = req.user.email.trim().toLowerCase();
      db.prepare(`
        UPDATE notification 
        SET read_at = CURRENT_TIMESTAMP 
        WHERE recipient_user_id = ? AND read_at IS NULL
      `).run(studentEmail);
    } else if (req.user.role === 'recruiter') {
      const senderEmail = req.user.email.trim().toLowerCase();
      db.prepare(`
        UPDATE notification 
        SET read_at = CURRENT_TIMESTAMP 
        WHERE sender_id = ? AND read_at IS NULL
      `).run(senderEmail);
    } else {
      db.prepare(`
        UPDATE notification 
        SET read_at = CURRENT_TIMESTAMP 
        WHERE read_at IS NULL
      `).run();
    }

    return res.json({ message: 'All marked as read' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update notifications' });
  }
});

/**
 * Simulated Email Outbox (Strict Role & Recipient Isolation)
 * GET /api/notifications/email-outbox
 */
router.get('/email-outbox', (req, res) => {
  try {
    let emails = [];

    if (req.user.role === 'student') {
      const studentEmail = req.user.email.trim().toLowerCase();
      emails = db.prepare(`
        SELECT 
          id,
          recipient_user_id AS recipient_email,
          COALESCE(sender_id, 'Placement Portal <placements@campuslink.edu>') AS sender,
          title AS subject,
          message AS body_text,
          channel,
          created_at AS sent_at
        FROM notification
        WHERE recipient_user_id = ? AND (channel = 'both' OR channel = 'email-simulated')
        ORDER BY created_at DESC
        LIMIT 50
      `).all(studentEmail);
    } else if (req.user.role === 'recruiter') {
      const recruiterEmail = req.user.email.trim().toLowerCase();
      emails = db.prepare(`
        SELECT 
          id,
          recipient_user_id AS recipient_email,
          COALESCE(sender_id, ?) AS sender,
          title AS subject,
          message AS body_text,
          channel,
          created_at AS sent_at
        FROM notification
        WHERE sender_id = ? AND (channel = 'both' OR channel = 'email-simulated')
        ORDER BY created_at DESC
        LIMIT 50
      `).all(recruiterEmail, recruiterEmail);
    } else {
      // Placement Cell admin sees all emails dispatched across the platform
      emails = db.prepare(`
        SELECT 
          id,
          recipient_user_id AS recipient_email,
          COALESCE(sender_id, 'Placement Portal <placements@campuslink.edu>') AS sender,
          title AS subject,
          message AS body_text,
          channel,
          created_at AS sent_at
        FROM notification
        WHERE channel = 'both' OR channel = 'email-simulated'
        ORDER BY created_at DESC
        LIMIT 100
      `).all();
    }

    return res.json(emails);
  } catch (err) {
    console.error('Fetch email outbox error:', err);
    return res.status(500).json({ error: 'Failed to fetch email outbox' });
  }
});

module.exports = router;

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, Mail, Calendar, Award, AlertTriangle, Radio } from 'lucide-react';
import { api } from '../services/api';
import { NotificationItem } from '../types';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenEmailOutbox?: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  onOpenEmailOutbox
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifs = async () => {
    try {
      setLoading(true);
      const res = await api.getNotifications();
      const rawNotifs: NotificationItem[] = res.notifications || [];
      // Deduplicate by ID in state
      const uniqueNotifs = Array.from(new Map(rawNotifs.map(n => [n.id, n])).values());
      setNotifications(uniqueNotifs);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchNotifs();
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1, read_at: new Date().toISOString() })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1, read_at: new Date().toISOString() } : n));
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 md:p-6">
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-black/30 backdrop-blur-xs" />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 max-h-[85vh] flex flex-col mt-12"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Notifications</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              &times;
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-slate-100 dark:divide-slate-800/50">
          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No notifications yet.
            </div>
          ) : (
            notifications.map(n => {
              let Icon = Bell;
              let iconColor = 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950';

              if (n.type === 'offer_released' || n.type === 'offer_accepted') {
                Icon = Award;
                iconColor = 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950';
              } else if (n.type === 'round_result') {
                Icon = Calendar;
                iconColor = 'text-blue-500 bg-blue-50 dark:bg-blue-950';
              } else if (n.type === 'clash') {
                Icon = AlertTriangle;
                iconColor = 'text-amber-500 bg-amber-50 dark:bg-amber-950';
              } else if (n.type === 'broadcast') {
                Icon = Radio;
                iconColor = 'text-purple-500 bg-purple-50 dark:bg-purple-950';
              }

              return (
                <div
                  key={n.id}
                  onClick={() => handleMarkRead(n.id)}
                  className={`pt-2 p-3 rounded-xl transition cursor-pointer flex items-start gap-3 ${
                    n.is_read ? 'opacity-70 hover:bg-slate-50 dark:hover:bg-slate-800/40' : 'bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${iconColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {n.title}
                      </h4>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {n.message}
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1.5 block">
                      {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {onOpenEmailOutbox && (
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900 flex justify-between items-center text-xs">
            <span className="text-slate-500">Channels: In-App + Email</span>
            <button
              onClick={() => {
                onClose();
                onOpenEmailOutbox();
              }}
              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5" />
              View Email Outbox
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Shield, Ban, UserCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { User } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'banned' | 'admins'>('all');

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter === 'banned') {
        query = query.eq('is_banned', true);
      } else if (filter === 'admins') {
        query = query.eq('role', 'admin');
      }

      const { data, error } = await query;

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId: string, currentlyBanned: boolean) => {
    const reason = currentlyBanned
      ? null
      : prompt('Ban nedeni (opsiyonel):');

    if (currentlyBanned === false && reason === null) return; // Cancelled

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_banned: !currentlyBanned,
          ban_reason: currentlyBanned ? null : reason || 'Belirtilmedi',
          banned_at: currentlyBanned ? null : new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      alert(currentlyBanned ? 'Kullanıcı banı kaldırıldı' : 'Kullanıcı banlandı');
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      alert('İşlem başarısız');
    }
  };

  const handleMakeAdmin = async (userId: string, currentRole: string) => {
    if (!confirm(`Bu kullanıcıyı ${currentRole === 'admin' ? 'normal kullanıcı' : 'admin'} yapmak istediğinize emin misiniz?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          role: currentRole === 'admin' ? 'user' : 'admin',
        })
        .eq('id', userId);

      if (error) throw error;

      alert(currentRole === 'admin' ? 'Admin yetkisi kaldırıldı' : 'Kullanıcı admin yapıldı');
      fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('İşlem başarısız');
    }
  };

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getAvatarUrl = (avatarUrl: string | null) => {
    if (!avatarUrl) return null;
    
    // Trim whitespace
    const cleanUrl = avatarUrl.trim();
    
    // If already full URL, return it
    if (cleanUrl.startsWith('http')) return cleanUrl;
    
    // If relative path, prepend Supabase URL
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${cleanUrl}`;
  };

  return (
    <div className="min-h-screen pb-20 bg-gray-50 dark:bg-black">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/admin')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Kullanıcı Yönetimi</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Search and Filter */}
        <div className="mb-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Kullanıcı ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              Tümü
            </button>
            <button
              onClick={() => setFilter('banned')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'banned'
                  ? 'bg-primary text-white'
                  : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              Banlılar
            </button>
            <button
              onClick={() => setFilter('admins')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'admins'
                  ? 'bg-primary text-white'
                  : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              Adminler
            </button>
          </div>
        </div>

        {/* Users List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            {filteredUsers.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                    <div className="flex items-center justify-between">
                      {/* User Info */}
                      <div className="flex items-center gap-3 flex-1">
                        {user.avatar_url && getAvatarUrl(user.avatar_url) ? (
                          <img
                            src={getAvatarUrl(user.avatar_url) || ''}
                            alt={user.username}
                            crossOrigin="anonymous"
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                            {user.username[0]?.toUpperCase()}
                          </div>
                        )}

                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {user.full_name}
                            </h3>
                            {user.role === 'admin' && (
                              <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-xs font-medium rounded">
                                ADMIN
                              </span>
                            )}
                            {user.is_banned && (
                              <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium rounded">
                                BANLI
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            @{user.username} • {user.total_points} puan
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {formatDistanceToNow(new Date(user.created_at), { addSuffix: true, locale: tr })}
                          </p>
                          {user.is_banned && user.ban_reason && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                              Ban nedeni: {user.ban_reason}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleMakeAdmin(user.id, user.role || 'user')}
                          className="p-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition"
                          title={user.role === 'admin' ? 'Admin yetkisini kaldır' : 'Admin yap'}
                        >
                          <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </button>

                        <button
                          onClick={() => handleBanUser(user.id, user.is_banned || false)}
                          className={`p-2 rounded-lg transition ${
                            user.is_banned
                              ? 'hover:bg-green-50 dark:hover:bg-green-900/20'
                              : 'hover:bg-red-50 dark:hover:bg-red-900/20'
                          }`}
                          title={user.is_banned ? 'Banı kaldır' : 'Kullanıcıyı banla'}
                        >
                          {user.is_banned ? (
                            <UserCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                          ) : (
                            <Ban className="w-5 h-5 text-red-600 dark:text-red-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">Kullanıcı bulunamadı</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;

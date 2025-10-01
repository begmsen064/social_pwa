import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Medal, Award, Crown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

interface LeaderboardUser {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  total_points: number;
  rank: number;
}

type TimeFilter = 'all' | 'week' | 'month';

const Leaderboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TimeFilter>('all');
  const [myRank, setMyRank] = useState<number | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [filter]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, total_points')
        .order('total_points', { ascending: false })
        .limit(100);

      const { data, error } = await query;

      if (error) throw error;

      // Add rank to each user
      const rankedUsers: LeaderboardUser[] = (data || []).map((user, index) => ({
        ...user,
        rank: index + 1,
      }));

      setUsers(rankedUsers);

      // Find current user's rank
      if (user) {
        const userRank = rankedUsers.find(u => u.id === user.id)?.rank;
        setMyRank(userRank || null);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvatarUrl = (avatarUrl: string | null) => {
    if (!avatarUrl) return null;
    if (avatarUrl.startsWith('http')) return avatarUrl;
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${avatarUrl}`;
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-700" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-gray-50 dark:bg-black">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sıralama</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">En yüksek puanlı kullanıcılar</p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 py-2 rounded-lg font-semibold text-sm transition ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-primary to-secondary text-white'
                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Tüm Zamanlar
            </button>
            <button
              onClick={() => setFilter('month')}
              className={`flex-1 py-2 rounded-lg font-semibold text-sm transition ${
                filter === 'month'
                  ? 'bg-gradient-to-r from-primary to-secondary text-white'
                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Bu Ay
            </button>
            <button
              onClick={() => setFilter('week')}
              className={`flex-1 py-2 rounded-lg font-semibold text-sm transition ${
                filter === 'week'
                  ? 'bg-gradient-to-r from-primary to-secondary text-white'
                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Bu Hafta
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* My Rank Card */}
        {myRank && (
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20 rounded-xl p-4 mb-4 border border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-2xl font-bold text-primary">#{myRank}</div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Senin Sıralaman</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{user?.total_points} puan</p>
                </div>
              </div>
              <Trophy className="w-8 h-8 text-primary" />
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Top 3 Podium - Only show if we have at least 3 users */}
            {users.length >= 3 && (
              <div className="flex items-end justify-center gap-2 mb-6 px-4">
                {/* 2nd Place */}
                <div className="flex-1 max-w-[120px]" onClick={() => navigate(`/u/${users[1].username}`)}>
                  <div className="text-center cursor-pointer">
                    <div className="relative mb-2">
                      {users[1].avatar_url && getAvatarUrl(users[1].avatar_url) ? (
                        <img
                          src={getAvatarUrl(users[1].avatar_url) || ''}
                          alt={users[1].username}
                          className="w-16 h-16 rounded-full object-cover mx-auto border-4 border-gray-400"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xl font-bold mx-auto border-4 border-gray-400">
                          {users[1].username[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                        <Medal className="w-6 h-6 text-gray-400" />
                      </div>
                    </div>
                    <p className="text-xs font-semibold truncate">{users[1].username}</p>
                    <p className="text-xs text-primary font-bold">{users[1].total_points}</p>
                    <div className="h-16 bg-gradient-to-r from-gray-300 to-gray-500 rounded-t-lg mt-2 flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">2</span>
                    </div>
                  </div>
                </div>

                {/* 1st Place */}
                <div className="flex-1 max-w-[120px]" onClick={() => navigate(`/u/${users[0].username}`)}>
                  <div className="text-center cursor-pointer">
                    <div className="relative mb-2">
                      {users[0].avatar_url && getAvatarUrl(users[0].avatar_url) ? (
                        <img
                          src={getAvatarUrl(users[0].avatar_url) || ''}
                          alt={users[0].username}
                          className="w-20 h-20 rounded-full object-cover mx-auto border-4 border-yellow-500"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-2xl font-bold mx-auto border-4 border-yellow-500">
                          {users[0].username[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                        <Crown className="w-8 h-8 text-yellow-500" />
                      </div>
                    </div>
                    <p className="text-xs font-semibold truncate">{users[0].username}</p>
                    <p className="text-xs text-primary font-bold">{users[0].total_points}</p>
                    <div className="h-24 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-t-lg mt-2 flex items-center justify-center">
                      <span className="text-3xl font-bold text-white">1</span>
                    </div>
                  </div>
                </div>

                {/* 3rd Place */}
                <div className="flex-1 max-w-[120px]" onClick={() => navigate(`/u/${users[2].username}`)}>
                  <div className="text-center cursor-pointer">
                    <div className="relative mb-2">
                      {users[2].avatar_url && getAvatarUrl(users[2].avatar_url) ? (
                        <img
                          src={getAvatarUrl(users[2].avatar_url) || ''} 
                          alt={users[2].username}
                          className="w-16 h-16 rounded-full object-cover mx-auto border-4 border-amber-700"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xl font-bold mx-auto border-4 border-amber-700">
                          {users[2].username[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                        <Award className="w-6 h-6 text-amber-700" />
                      </div>
                    </div>
                    <p className="text-xs font-semibold truncate">{users[2].username}</p>
                    <p className="text-xs text-primary font-bold">{users[2].total_points}</p>
                    <div className="h-12 bg-gradient-to-r from-amber-600 to-amber-800 rounded-t-lg mt-2 flex items-center justify-center">
                      <span className="text-xl font-bold text-white">3</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* All Users List */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-200 dark:divide-gray-800">
              {users.map((userItem) => (
                <div
                  key={userItem.id}
                  onClick={() => navigate(`/u/${userItem.username}`)}
                  className={`flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition ${
                    userItem.id === user?.id ? 'bg-primary/5' : ''
                  }`}
                >
                  {/* Rank */}
                  <div className="w-10 text-center flex items-center justify-center">
                    {userItem.rank <= 3 ? (
                      getRankIcon(userItem.rank)
                    ) : (
                      <span className="text-lg font-bold text-gray-600 dark:text-gray-400">
                        {userItem.rank}
                      </span>
                    )}
                  </div>

                  {/* Avatar */}
                  {userItem.avatar_url && getAvatarUrl(userItem.avatar_url) ? (
                    <img
                      src={getAvatarUrl(userItem.avatar_url) || ''}
                      alt={userItem.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                      {userItem.username[0]?.toUpperCase()}
                    </div>
                  )}

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">
                      {userItem.full_name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      @{userItem.username}
                    </p>
                  </div>

                  {/* Points */}
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Trophy className="w-4 h-4 text-primary" />
                      <span className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        {userItem.total_points}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {users.length === 0 && (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Henüz sıralama yok</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import HomeScreen from '@/app/components/HomeScreen';
import LoginScreen from '@/app/components/LoginScreen';
import AdminScreen from '@/app/components/admin/AdminScreen';
import { loadCurrentUser, signOut, type User } from '@/app/lib/auth';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<'chat' | 'admin'>('chat');

  useEffect(() => {
    loadCurrentUser()
      .then(setCurrentUser)
      .finally(() => setReady(true));
  }, []);

  const logout = () => {
    void signOut();
    setCurrentUser(null);
    setView('chat');
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLogin={setCurrentUser} />;
  }

  const isOwner = currentUser.accountNumber === 1;

  if (isOwner && view === 'admin') {
    return <AdminScreen user={currentUser} onLogout={logout} onSwitchToChat={() => setView('chat')} />;
  }

  return (
    <HomeScreen
      user={currentUser}
      onLogout={logout}
      isOwner={isOwner}
      {...(isOwner ? { onSwitchToAdmin: () => setView('admin') } : {})}
    />
  );
}

export default App;

import { useState } from 'react';
import HomeScreen from '@/app/components/HomeScreen';
import LoginScreen from '@/app/components/LoginScreen';
import AdminScreen from '@/app/components/admin/AdminScreen';
import type { User } from '@/app/lib/auth';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<'chat' | 'admin'>('chat');

  if (!currentUser) {
    return <LoginScreen onLogin={setCurrentUser} />;
  }

  const isOwner = currentUser.accountNumber === 1;

  if (isOwner && view === 'admin') {
    return (
      <AdminScreen
        user={currentUser}
        onLogout={() => setCurrentUser(null)}
        onSwitchToChat={() => setView('chat')}
      />
    );
  }

  return (
    <HomeScreen
      user={currentUser}
      onLogout={() => setCurrentUser(null)}
      isOwner={isOwner}
      onSwitchToAdmin={isOwner ? () => setView('admin') : undefined}
    />
  );
}

export default App;

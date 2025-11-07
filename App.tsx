
import React, { useState } from 'react';
import MeditationView from './components/MeditationView';
import ChatBot from './components/ChatBot';
import { MeditationIcon } from './components/icons/MeditationIcon';
import { ChatIcon } from './components/icons/ChatIcon';

type Tab = 'meditation' | 'chat';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('meditation');

  const renderContent = () => {
    switch (activeTab) {
      case 'meditation':
        return <MeditationView />;
      case 'chat':
        return <ChatBot />;
      default:
        return <MeditationView />;
    }
  };

  const TabButton: React.FC<{ tabName: Tab; label: string; icon: React.ReactNode }> = ({ tabName, label, icon }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`flex-1 flex flex-col items-center justify-center p-2 transition-colors duration-300 ${
        activeTab === tabName ? 'text-indigo-400' : 'text-slate-400 hover:text-indigo-300'
      }`}
    >
      {icon}
      <span className="text-xs font-medium mt-1">{label}</span>
    </button>
  );

  return (
    <div className="bg-slate-900 text-slate-100 min-h-screen font-sans flex flex-col">
      <header className="p-4 text-center border-b border-slate-700/50 shadow-lg bg-slate-900/80 backdrop-blur-sm">
        <h1 className="text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
          Zenith
        </h1>
        <p className="text-sm text-slate-400">Your Personal AI Meditation Guide</p>
      </header>

      <main className="flex-grow p-4 md:p-6 mb-16 overflow-y-auto">
        {renderContent()}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-slate-800/90 backdrop-blur-sm border-t border-slate-700 shadow-t-lg flex z-50">
        <TabButton tabName="meditation" label="Meditate" icon={<MeditationIcon />} />
        <TabButton tabName="chat" label="Chat" icon={<ChatIcon />} />
      </nav>
    </div>
  );
};

export default App;

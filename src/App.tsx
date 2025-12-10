import React from 'react';
import { GameProvider } from './context/GameContext';
import { GamePage } from './pages/GamePage';
// 这里引入我们在 Phase 4 结尾创建的全局样式
// 如果你还没有 index.css，请暂时注释掉这一行，或者去创建一个空的 src/index.css
import './index.css'; 

function App() {
  return (
    <GameProvider>
      <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center font-serif text-ink-black overflow-hidden">
        <GamePage />
      </div>
    </GameProvider>
  );
}

export default App;
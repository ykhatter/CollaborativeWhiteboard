// import Forms from './components/Forms'
// import './App.css'

// const App=() => {

//   return (
//       <div className="container">
//         <Forms/>
//       </div>
//   )
// }

// export default App

import Forms from './components/Forms';
import { Route, Routes } from "react-router-dom";
import RoomPage from './pages/RoomPage'; 
import './App.css';

const App = () => {
  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<Forms />} />
        <Route path="/:roomId" element={<RoomPage />} />
      </Routes>
    </div>
  );
};

export default App;


// const Forms = () => {
//     return(
//          <h1>Forms Working !</h1>
//     )
// }

// export default Forms;

import CreateRoomForm from './CreateRoomForm';
import JoinRoomForm from './JoinRoomForm';
import './index.css';
import whiteboardImage from './image/WhiteBoard.png';

const Forms = () => {
  return (
    <div className="forms-layout">
      <div className="image-section">
        <img src={whiteboardImage} alt="Drawing" />
      </div>
      <div className="form-section">
        <div className="form-box">
          <CreateRoomForm />
        </div>
        <div className="form-box">
          <JoinRoomForm />
        </div>
      </div>
    </div>
  );
};

export default Forms;



import "./index.css";

const WhiteBoard = ({ tool, color }) => {
  return (
    <div className="whiteboard-container">
      <canvas id="canvas" width="800" height="500"></canvas>
    </div>
  );
};

export default WhiteBoard;

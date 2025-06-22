import { useState } from "react";
import WhiteBoard from "../../components/WhiteBoard";
import "./index.css";

const RoomPage = () => {
  const [tool, setTool] = useState("pencil");
  const [color, setColor] = useState("#000000");

  const handleToolChange = (newTool) => setTool(newTool);
  const handleColorChange = (e) => setColor(e.target.value);

  return (
    <div className="room-container">
      <h1 className="text-center title">White Board Sharing App{" "}  
        <span className ="text-primary">[Users Online: 0]</span>
      </h1>

      <div className="toolbar">
        <div className="tools">
          <button onClick={() => handleToolChange("pencil")}>✏️ Pencil</button>
          <button onClick={() => handleToolChange("line")}>📏 Line</button>
          <button onClick={() => handleToolChange("rectangle")}>⬛ Rectangle</button>
          <button onClick={() => handleToolChange("circle")}>⚪ Circle</button>
        </div>

        <div className="color-picker">
          <label>🎨 Color:</label>
          <input type="color" value={color} onChange={handleColorChange} />
        </div>

        <div className="actions">
          <button onClick={() => window.dispatchEvent(new Event("undo"))}>↩️ Undo</button>
          <button onClick={() => window.dispatchEvent(new Event("redo"))}>↪️ Redo</button>
          <button onClick={() => window.dispatchEvent(new Event("clear"))}>🧹 Clear</button>
        </div>
      </div>

      <WhiteBoard tool={tool} color={color} />
    </div>
  );
};

export default RoomPage;

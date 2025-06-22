import { useEffect, useRef, useState } from "react";
import rough from "roughjs/bin/rough";
import "./index.css";

const generator = rough.generator();

const createElement = (x1, y1, x2, y2, tool, color) => {
  switch (tool) {
    case "line":
      return {
        tool,
        x1,
        y1,
        x2,
        y2,
        color,
        roughElement: generator.line(x1, y1, x2, y2, { stroke: color }),
      };
    case "rectangle":
      return {
        tool,
        x1,
        y1,
        x2,
        y2,
        color,
        roughElement: generator.rectangle(x1, y1, x2 - x1, y2 - y1, { stroke: color }),
      };
    case "circle":
      const radius = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
      return {
        tool,
        x1,
        y1,
        x2,
        y2,
        color,
        roughElement: generator.circle(x1, y1, radius * 2, { stroke: color }),
      };
    case "pencil":
    default:
      return { tool, points: [{ x: x1, y: y1 }], color };
  }
};

const WhiteBoard = ({ tool, color, setControlsState }) => {

  const canvasRef = useRef(null);
  const [elements, setElements] = useState([]);
  const [history, setHistory] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const undoHandler = () => {
      if (elements.length === 0) return;
      const newElements = [...elements];
      const popped = newElements.pop();
      setElements(newElements);
      setHistory((prev) => [...prev, popped]);
    };

    const redoHandler = () => {
      if (history.length === 0) return;
      const restored = history[history.length - 1];
      setHistory((prev) => prev.slice(0, -1));
      setElements((prev) => [...prev, restored]);
    };

    const clearHandler = () => {
      setElements([]);
      setHistory([]);
    };

    window.addEventListener("undo", undoHandler);
    window.addEventListener("redo", redoHandler);
    window.addEventListener("clear", clearHandler);

    return () => {
      window.removeEventListener("undo", undoHandler);
      window.removeEventListener("redo", redoHandler);
      window.removeEventListener("clear", clearHandler);
    };
  }, [elements, history]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const rc = rough.canvas(canvas);
    elements.forEach((el) => {
      if (el.tool === "pencil") {
        for (let i = 0; i < el.points.length - 1; i++) {
          const p1 = el.points[i];
          const p2 = el.points[i + 1];
          const line = generator.line(p1.x, p1.y, p2.x, p2.y, { stroke: el.color });
          rc.draw(line);
        }
      } else {
        rc.draw(el.roughElement);
      }
    });
  }, [elements]);

  const getMouseCoordinates = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const handleMouseDown = (e) => {
    const { x, y } = getMouseCoordinates(e);
    const newElement =
      tool === "pencil"
        ? { tool: "pencil", points: [{ x, y }], color }
        : createElement(x, y, x, y, tool, color);

    setElements((prev) => [...prev, newElement]);
    setIsDrawing(true);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const { x, y } = getMouseCoordinates(e);
    const updatedElements = [...elements];
    const index = updatedElements.length - 1;
    const element = updatedElements[index];

    if (tool === "pencil") {
      element.points.push({ x, y });
    } else {
      Object.assign(
        element,
        createElement(element.x1, element.y1, x, y, tool, element.color)
      );
    }

    setElements(updatedElements);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setHistory([]); // clear redo history after new draw
  };

  return (
    <div className="whiteboard-container">
      <canvas
        ref={canvasRef}
        id="canvas"
        width={800}
        height={500}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
    </div>
  );
};

export default WhiteBoard;

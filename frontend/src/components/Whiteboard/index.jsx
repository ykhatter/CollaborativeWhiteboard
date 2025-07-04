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
    case "circle": {
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
    }
    case "pencil":
    default:
      return { tool, points: [{ x: x1, y: y1 }], color };
  }
};

const WhiteBoard = ({ tool, color, user, socket, roomCode }) => {

  const canvasRef = useRef(null);
  const [elements, setElements] = useState([]);
  const [history, setHistory] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentElementIndex, setCurrentElementIndex] = useState(null);

  // Listen for real-time updates from other users
  useEffect(() => {
    if (!socket) return;

    // Listen for new elements drawn by other users
    socket.on("elementDrawn", (element) => {
      setElements(prev => [...prev, element]);
    });

    // Listen for element updates from other users
    socket.on("elementUpdated", ({ index, element }) => {
      setElements(prev => {
        const newElements = [...prev];
        newElements[index] = element;
        return newElements;
      });
    });

    // Listen for board state updates (undo/redo/clear)
    socket.on("boardStateUpdate", ({ elements: newElements, history: newHistory }) => {
      setElements(newElements);
      setHistory(newHistory);
    });

    // Listen for initial room state
    socket.on("roomState", ({ elements: roomElements, history: roomHistory }) => {
      setElements(roomElements);
      setHistory(roomHistory);
    });

    // Listen for clear events from other users (legacy, for safety)
    socket.on("boardCleared", () => {
      setElements([]);
      setHistory([]);
    });

    return () => {
      socket.off("elementDrawn");
      socket.off("elementUpdated");
      socket.off("boardStateUpdate");
      socket.off("roomState");
      socket.off("boardCleared");
    };
  }, [socket]);

  // Undo/Redo/Clear logic is now fully local, but broadcasts state to others
  useEffect(() => {
    const undoHandler = () => {
      if (elements.length === 0) return;
      const newElements = [...elements];
      const popped = newElements.pop();
      const newHistory = [...history, popped];
      setElements(newElements);
      setHistory(newHistory);
      // Broadcast new state
      if (socket && user?.presenter) {
        socket.emit("boardStateUpdate", { roomCode, elements: newElements, history: newHistory });
      }
    };

    const redoHandler = () => {
      if (history.length === 0) return;
      const restored = history[history.length - 1];
      const newHistory = history.slice(0, -1);
      const newElements = [...elements, restored];
      setHistory(newHistory);
      setElements(newElements);
      // Broadcast new state
      if (socket && user?.presenter) {
        socket.emit("boardStateUpdate", { roomCode, elements: newElements, history: newHistory });
      }
    };

    const clearHandler = () => {
      setElements([]);
      setHistory([]);
      // Broadcast new state
      if (socket && user?.presenter) {
        socket.emit("boardStateUpdate", { roomCode, elements: [], history: [] });
      }
    };

    window.addEventListener("undo", undoHandler);
    window.addEventListener("redo", redoHandler);
    window.addEventListener("clear", clearHandler);

    return () => {
      window.removeEventListener("undo", undoHandler);
      window.removeEventListener("redo", redoHandler);
      window.removeEventListener("clear", clearHandler);
    };
  }, [elements, history, socket, user, roomCode]);

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

  if(!user?.presenter){
    return (
      <div className="whiteboard-container">
        <canvas
        ref={canvasRef}
        id="canvas"
        width={800}
        height={500} />
      </div>
    );
  }

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

    const newElements = [...elements, newElement];
    setElements(newElements);
    setCurrentElementIndex(newElements.length - 1);
    setIsDrawing(true);
    
    // Emit drawing event to server
    if (socket) {
      socket.emit("drawElement", { roomCode, element: newElement });
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || currentElementIndex === null) return;
    const { x, y } = getMouseCoordinates(e);
    const updatedElements = [...elements];
    const element = updatedElements[currentElementIndex];

    if (tool === "pencil") {
      element.points.push({ x, y });
    } else {
      Object.assign(
        element,
        createElement(element.x1, element.y1, x, y, tool, element.color)
      );
    }

    setElements(updatedElements);
    
    // Emit updated element to server
    if (socket) {
      socket.emit("updateElement", { roomCode, index: currentElementIndex, element: updatedElements[currentElementIndex] });
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setCurrentElementIndex(null);
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

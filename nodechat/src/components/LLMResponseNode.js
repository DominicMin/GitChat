import React, { memo, useState, useCallback } from 'react';
import { Handle, Position, useReactFlow } from 'react-flow-renderer';

const LLMResponseNode = ({ id, data }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(data.text);
  const { setNodes } = useReactFlow();

  const onDelete = useCallback(() => {
    setNodes((nodes) => nodes.filter((n) => n.id !== id));
  }, [id, setNodes]);

  const onTextChange = useCallback((evt) => {
    setText(evt.target.value);
  }, []);

  const onTextBlur = useCallback(() => {
    setIsEditing(false);
    setNodes((nodes) => 
      nodes.map((node) => {
        if (node.id === id) {
          node.data = { ...node.data, text };
        }
        return node;
      })
    );
  }, [id, setNodes, text]);

  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-blue-100 border-2 border-blue-300 relative">
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-blue-500" />
      <div className="font-bold text-sm text-blue-700">LLM Response</div>
      {isEditing ? (
        <textarea
          className="w-full p-2 text-gray-700 border rounded"
          value={text}
          onChange={onTextChange}
          onBlur={onTextBlur}
          autoFocus
        />
      ) : (
        <div className="text-gray-700" onClick={() => setIsEditing(true)}>
          {text}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-blue-500" />
      <button
        className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
        onClick={onDelete}
      >
        ×
      </button>
    </div>
  );
};

export default memo(LLMResponseNode);
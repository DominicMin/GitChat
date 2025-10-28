import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  useStoreApi,
  SelectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Menu, Item, useContextMenu } from 'react-contexify';
import 'react-contexify/dist/ReactContexify.css';
import UserInputNode from './UserInputNode';
import LLMResponseNode from './LLMResponseNode';
import CustomEdge from './CustomEdge';
import { 
  sendConversationRequest,
  callGeminiAPI,
  getConversationHistory,
  exportConversationToFile,
  importConversationFromFile
} from './Utility';

const edgeTypes = {
  custom: CustomEdge,
};

const MENU_ID = 'node-context-menu';
let currentOverlapOffset = 0;
const OVERLAP_OFFSET = 10;

function NodeChat() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowWrapper = useRef(null);
  const [message, setMessage] = useState('');
  const store = useStoreApi();
  const reactFlow = useReactFlow();
  const { show } = useContextMenu({
    id: MENU_ID,
  });
  const currentLlmNodeId = useRef(null);
  const fileInputRef = useRef(null);
  const [notification, setNotification] = useState('');
  const [selectedModel, setSelectedModel] = useState('openai'); // 'openai' | 'gemini'
  
  // Create nodeTypes with injected selectedModel
  const nodeTypes = React.useMemo(() => ({
    userInput: (props) => <UserInputNode {...props} selectedModel={selectedModel} />,
    llmResponse: LLMResponseNode,
  }), [selectedModel]);

  const onEdgeClick = useCallback((edgeId) => {
    setEdges((eds) => eds.filter((e) => e.id !== edgeId));
  }, [setEdges]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => eds.concat({ 
      ...params, 
      id: `e${params.source}-${params.target}-${Date.now()}`,
      data: { onEdgeClick },
      type: 'custom' 
    })),
    [onEdgeClick, setEdges]
  );

  const addNode = useCallback((type, sourceNode = null, offset = { x: 0, y: 0 }, text = null, connectToSource = false, additionalData = {}) => {
    return new Promise((resolve) => {
      const {
        height,
        width,
        transform: [transformX, transformY, zoomLevel]
      } = store.getState();
      const zoomMultiplier = 1 / zoomLevel;
      const centerX = -transformX * zoomMultiplier + (width * zoomMultiplier) / 2;
      const centerY =
        -transformY * zoomMultiplier + (height * zoomMultiplier) / 2;

      let position;
      if (sourceNode) {
        position = {
          x: sourceNode.position.x + offset.x,
          y: sourceNode.position.y + offset.y,
        };
      } else {
        position = {
          x: centerX + currentOverlapOffset,
          y: centerY + currentOverlapOffset
        };
        currentOverlapOffset += OVERLAP_OFFSET;
      }

      position.x = Number(position.x) || 0;
      position.y = Number(position.y) || 0;

      const newNode = {
        id: `${type}-${Date.now()}`,
        type,
        data: { 
          text: text || (type === 'userInput' ? 'New user input' : 'New LLM response'),
          ...additionalData
        },
        position: position,
      };

      setNodes((nds) => {
        const updatedNodes = nds.concat(newNode);
        resolve(newNode);
        return updatedNodes;
      });

      if (sourceNode && connectToSource) {
        setEdges((eds) =>
          eds.concat({
            id: `e${sourceNode.id}-${newNode.id}`,
            source: sourceNode.id,
            target: newNode.id,
            data: { onEdgeClick },
            type: 'custom',
          })
        );
      }
    });
  }, [setNodes, setEdges, onEdgeClick, store]);

  const onNodeContextMenu = useCallback(
    (event, node) => {
      event.preventDefault();
      const pane = reactFlowWrapper.current.getBoundingClientRect();
      show({
        event,
        props: {
          node,
          position: reactFlow.screenToFlowPosition({
            x: event.clientX - pane.left,
            y: event.clientY - pane.top,
          }),
        },
      });
    },
    [show, reactFlow]
  );

  const handleReplicate = useCallback(async ({ props }) => {
    const { node } = props;
    //add a small random offset to the new node
    const newNode = await addNode(node.type, node, { x: 200 + (Math.random()-0.5) * 100, y: (Math.random()-0.5) * 10 }, node.data.text, false);
    
    // Replicate upstream connections
    edges.forEach((edge) => {
      if (edge.target === node.id) {
        setEdges((eds) =>
          eds.concat({
            id: `e${edge.source}-${newNode.id}`,
            source: edge.source,
            target: newNode.id,
            data: { onEdgeClick },
            type: 'custom',
          })
        );
      }
    });
  }, [addNode, edges, onEdgeClick, setEdges]);

  const handleCreateConnectedNode = useCallback(({ props }) => {
    const { node } = props;
    const newType = node.type === 'userInput' ? 'llmResponse' : 'userInput';
    const nodeElement = document.querySelector(`[data-id="${node.id}"]`);
    const nodeHeight = nodeElement ? nodeElement.offsetHeight : 0;
    addNode(newType, node, { x: (Math.random()-0.5) * 100, y: 30 + nodeHeight }, null, true);
  }, [addNode]);

  const setSelectNode = useCallback((node) => {
    setNodes((nds) =>
      nds.map((n) => {
        n.selected = n.id === node.id;
        return n;
      })
    );
  }, [setNodes]);

  const getSelectedNode = useCallback(() => {
    return nodes.find(node => node.selected);
  }, [nodes]);

  const onChunkReceived = useCallback((content) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === currentLlmNodeId.current) {
          return { ...n,
            data: { 
            ...n.data, 
            text: n.data.text + content 
            }};
        }
        return n;
      })
    );
  }, [setNodes]);

  const handleSendMessage = useCallback(async () => {
    if (message.trim() === '') return;

    let selectedNode = getSelectedNode();
    let sourceNode = selectedNode && selectedNode.type === 'llmResponse' ? selectedNode : null;

    let sourceNodeElement = null;
    if (!sourceNode) {
      const latestLLMResponseNode = nodes.filter(node => node.type === 'llmResponse').slice(-1)[0];
      sourceNode = latestLLMResponseNode || null;
    } 
    if (sourceNode) {
      sourceNodeElement = document.querySelector(`[data-id="${sourceNode.id}"]`);
    }
    let sourceNodeHeight = sourceNodeElement ? sourceNodeElement.offsetHeight : 0;

    const userNode = await addNode('userInput', sourceNode, { x: (Math.random()-0.5)*50, y: sourceNodeHeight + 20 }, message, !!sourceNode);
    // Wait for React to update the state
    await new Promise(resolve => setTimeout(resolve, 0));
    const userNodeElement = document.querySelector(`[data-id="${userNode.id}"]`);
    const userNodeHeight = userNodeElement ? userNodeElement.offsetHeight : 0;

    // 创建 LLM 节点时添加模型信息
    const modelLabel = selectedModel === 'gemini' ? 'Gemini' : 'OpenAI';
    const llmNode = await addNode('llmResponse', userNode, { x: 0, y: userNodeHeight + 20 }, '', true, { model: selectedModel, modelLabel });
    currentLlmNodeId.current = llmNode.id;
    llmNode.data.text = '';
    setMessage('');
    setSelectNode(llmNode);
    await new Promise(resolve => setTimeout(resolve, 0));
    // Get the updated nodes and edges
    const updatedNodes = reactFlow.getNodes();
    const updatedEdges = reactFlow.getEdges();

    let history = getConversationHistory(userNode, updatedNodes, updatedEdges);
    
    // Debug: 打印对话树结构
    console.log('📊 对话树统计:');
    console.log(`  节点数量: ${history.length}`);
    console.log(`  总字符数: ${JSON.stringify(history).length}`);
    history.forEach((h, i) => {
      console.log(`  ${i + 1}. [${h.role}] ${h.content ? h.content.substring(0, 50) : '(空)'}... (${h.content?.length || 0} 字符)`);
    });
    
    // Callback to save token info to userNode
    const onTokenInfo = (tokenData) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === userNode.id) {
            return { 
              ...n,
              data: { 
                ...n.data, 
                contextTokens: tokenData.inputTokens,
                modelUsed: tokenData.model
              }
            };
          }
          return n;
        })
      );
    };
    
    try {
      // 根据选择的模型调用对应 API
      if (selectedModel === 'gemini') {
        console.log('🎯 使用 Gemini API');
        await callGeminiAPI(history, message, onChunkReceived, onTokenInfo);
      } else {
        console.log('🎯 使用 OpenAI API');
        await sendConversationRequest('generate', history, onChunkReceived, {}, onTokenInfo);
      }
    } catch (error) {
      console.error('Failed to generate response:', error);
      // Handle error (e.g., show error message to user)
    }
  }, [message, getSelectedNode, addNode, setSelectNode, reactFlow, nodes, onChunkReceived, selectedModel, setNodes]);

  // Show notification message
  const showNotification = useCallback((msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  }, []);

  // Handle export to file
  const handleExport = useCallback(async () => {
    const result = await exportConversationToFile(nodes, edges);
    showNotification(result.message);
  }, [nodes, edges, showNotification]);

  // Handle import from file
  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (nodes.length > 0 && !window.confirm('当前对话将被覆盖，确定要导入吗？')) {
      e.target.value = '';
      return;
    }

    const result = await importConversationFromFile(file);
    if (result.success) {
      setNodes(result.data.nodes);
      setEdges(result.data.edges);
    }
    showNotification(result.message);
    e.target.value = '';
  }, [nodes.length, setNodes, setEdges, showNotification]);

  // Global keyboard event listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Tab key: Create child user node when LLM node is selected
      if (e.key === 'Tab') {
        const selectedNode = getSelectedNode();
        if (selectedNode && selectedNode.type === 'llmResponse') {
          e.preventDefault();
          const nodeElement = document.querySelector(`[data-id="${selectedNode.id}"]`);
          const nodeHeight = nodeElement ? nodeElement.offsetHeight : 0;
          addNode('userInput', selectedNode, { x: (Math.random()-0.5) * 100, y: 30 + nodeHeight }, null, true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [getSelectedNode, addNode]);

  return (
    <div className="h-full relative" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onMove={() => {
          currentOverlapOffset = 0;
        }}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeContextMenu={onNodeContextMenu}
        selectionMode={SelectionMode.Partial}
        panOnScroll
        selectionOnDrag
        panOnDrag={[1, 2]} // [mouse button, modifier keys]
        fitView
      >
        <Controls position='top-center' orientation='horizontal'/>
        <MiniMap position='top-right' pannable zoomable/>
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
      <div className="absolute top-4 left-4 z-20 flex space-x-2">
        <button 
          className="bg-green-500 text-white px-4 py-2 rounded"
          onClick={() => {
            addNode('userInput');
            console.log(reactFlow.getNodes());
          }}
        >
          Add User Input
        </button>
        <button 
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={() => {
            addNode('llmResponse');
          }}
        >
          Add LLM Response
        </button>
        <div className="border-l border-gray-300 mx-2"></div>
        <button 
          className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600"
          onClick={handleExport}
          title="导出为文件"
        >
          📥 导出
        </button>
        <button 
          className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600"
          onClick={handleImport}
          title="从文件导入"
        >
          📤 导入
        </button>
        <div className="border-l border-gray-300 mx-2"></div>
        {/* 模型选择器 */}
        <div className="flex items-center bg-white rounded shadow-md px-3 py-1 border border-gray-300">
          <span className="text-sm text-gray-600 mr-2">模型:</span>
          <button
            className={`px-3 py-1 rounded-l text-sm font-medium transition-colors ${
              selectedModel === 'openai' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setSelectedModel('openai')}
          >
            OpenAI
          </button>
          <button
            className={`px-3 py-1 rounded-r text-sm font-medium transition-colors ${
              selectedModel === 'gemini' 
                ? 'bg-purple-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setSelectedModel('gemini')}
          >
            🔮 Gemini
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>
      <Menu id={MENU_ID}>
        <Item onClick={handleReplicate}>Replicate Node</Item>
        <Item onClick={handleCreateConnectedNode}>Create Connected Node</Item>
      </Menu>
      {notification && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg">
          {notification}
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 z-50">
        <div className="flex items-center">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              // Shift+Enter: 发送消息
              if (e.key === 'Enter' && e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
              // Enter alone: 换行（默认行为，不需要处理）
            }}
            className="flex-grow mr-2 p-2 border border-gray-300 rounded"
            placeholder="Type your message... (Shift+Enter 发送)"
            style={{ maxHeight: '5em', resize: 'none' }}
          />
          <button
            onClick={handleSendMessage}
            className={`px-4 py-2 text-white rounded hover:opacity-90 transition-opacity ${
              selectedModel === 'gemini' ? 'bg-purple-500' : 'bg-blue-500'
            }`}
          >
            {selectedModel === 'gemini' ? '🔮 Send' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default NodeChat;

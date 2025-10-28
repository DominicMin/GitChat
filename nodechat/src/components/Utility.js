import { getOutgoers, getIncomers } from '@xyflow/react';

export async function sendConversationRequest(endpoint, conversation, onChunkReceived) {
  try {
    // Make the POST request and handle streaming response
    const response = await fetch(`http://localhost:8000/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ conversation }),
    });

    if (!response.ok) {
      throw new Error('Failed to start conversation');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let buffer = '';

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;

      buffer += decoder.decode(value, { stream: true });

      let boundary = buffer.indexOf('\n\n');
      while (boundary !== -1) {
        const chunk = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);

        if (chunk.startsWith('data: ')) {
          const data = JSON.parse(chunk.slice(6));
          if (data.content === '[DONE]') {
            return;
          } else {
            onChunkReceived(data.content);
          }
        }

        boundary = buffer.indexOf('\n\n');
      }
    }
  } catch (error) {
    console.error('Failed to send conversation request:', error);
    throw error;
  }
}

export function findAllDescendants(nodeId, nodes, edges) {
  const outgoers = getOutgoers({ id: nodeId }, nodes, edges);
  let descendants = [...outgoers.map(o => o.id)];

  outgoers.forEach((outgoer) => {
    descendants = descendants.concat(findAllDescendants(outgoer.id, nodes, edges));
  });

  return descendants;
}

export function findAllPrecedents(nodeId, nodes, edges) {
  const incomers = getIncomers({ id: nodeId }, nodes, edges);
  let precedents = [...incomers.map(i => i.id)];

  incomers.forEach((incomer) => {
    precedents = precedents.concat(findAllPrecedents(incomer.id, nodes, edges));
  });

  return precedents;
}

export function getConversationHistory(node, nodes, edges) {
  const history = [];
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  function processNode(currentNode) {
    if (!currentNode) return;

    const nodeHistory = {
      id: currentNode.id,
      role: currentNode.type === 'userInput' ? 'user' : 'assistant',
      parent: [],
      content: currentNode.data.text,
      children: []
    };

    // Find parent nodes
    const incomers = getIncomers({ id: currentNode.id }, nodes, edges);
    nodeHistory.parent = incomers.map(incomer => incomer.id);

    if (node.id !== currentNode.id) {
      // Find child nodes
      const outgoers = getOutgoers({ id: currentNode.id }, nodes, edges);
      nodeHistory.children = outgoers.map(outgoer => outgoer.id);
    }
    history.unshift(nodeHistory);

    // Process parent nodes recursively
    incomers.forEach(incomer => processNode(nodeMap.get(incomer.id)));
  }

  // Start processing from the given node
  processNode(node);
  return history;
}

// ==================== Import/Export Service ====================
const EXPORT_VERSION = '1.0';

// Export conversation to JSON file
// Uses File System Access API to show save dialog
export async function exportConversationToFile(nodes, edges) {
  try {
    const data = {
      version: EXPORT_VERSION,
      timestamp: Date.now(),
      nodes: nodes,
      edges: edges
    };
    
    const jsonString = JSON.stringify(data, null, 2);
    
    // Check if File System Access API is supported
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: `gitchat-export-${Date.now()}.json`,
          types: [{
            description: 'JSON Files',
            accept: { 'application/json': ['.json'] }
          }]
        });
        
        const writable = await handle.createWritable();
        await writable.write(jsonString);
        await writable.close();
        
        return { success: true, message: '对话已导出' };
      } catch (error) {
        // User cancelled the dialog
        if (error.name === 'AbortError') {
          return { success: false, message: '已取消导出' };
        }
        throw error;
      }
    } else {
      // Fallback for browsers that don't support File System Access API
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `gitchat-export-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return { success: true, message: '对话已导出（使用浏览器默认下载）' };
    }
  } catch (error) {
    console.error('Failed to export conversation:', error);
    return { success: false, message: '导出失败：' + error.message };
  }
}

// Import conversation from JSON file with enhanced validation
export function importConversationFromFile(file) {
  return new Promise((resolve) => {
    // Check file type
    if (!file.name.endsWith('.json')) {
      resolve({ success: false, message: '导入失败：只支持 .json 文件' });
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        
        // Check if content is empty
        if (!content || content.trim() === '') {
          resolve({ success: false, message: '导入失败：文件为空' });
          return;
        }

        const data = JSON.parse(content);
        
        // Validate required fields
        if (!data.version) {
          resolve({ success: false, message: '导入失败：缺少版本信息' });
          return;
        }
        
        if (!data.nodes || !Array.isArray(data.nodes)) {
          resolve({ success: false, message: '导入失败：节点数据格式错误' });
          return;
        }
        
        if (!data.edges || !Array.isArray(data.edges)) {
          resolve({ success: false, message: '导入失败：连接数据格式错误' });
          return;
        }

        // Validate node structure
        for (let i = 0; i < data.nodes.length; i++) {
          const node = data.nodes[i];
          if (!node.id || !node.type || !node.position || !node.data) {
            resolve({ success: false, message: `导入失败：节点 ${i + 1} 数据不完整` });
            return;
          }
        }

        // Validate edge structure
        for (let i = 0; i < data.edges.length; i++) {
          const edge = data.edges[i];
          if (!edge.id || !edge.source || !edge.target) {
            resolve({ success: false, message: `导入失败：连接 ${i + 1} 数据不完整` });
            return;
          }
        }
        
        resolve({ 
          success: true, 
          message: '对话导入成功',
          data: {
            nodes: data.nodes,
            edges: data.edges,
            timestamp: data.timestamp
          }
        });
      } catch (error) {
        console.error('Failed to parse file:', error);
        if (error instanceof SyntaxError) {
          resolve({ success: false, message: '导入失败：JSON 格式错误' });
        } else {
          resolve({ success: false, message: '导入失败：' + error.message });
        }
      }
    };
    
    reader.onerror = () => {
      resolve({ success: false, message: '导入失败：无法读取文件' });
    };
    
    reader.readAsText(file);
  });
}
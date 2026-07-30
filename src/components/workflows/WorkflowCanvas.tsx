import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  ReactFlow, MiniMap, Controls, Background, useNodesState, 
  useEdgesState, addEdge, Connection, Edge, Node, ReactFlowProvider,
  useReactFlow, BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { nodeTypes } from './nodes';
import { NodeSidebar } from './NodeSidebar';
import { NodeConfigDrawer } from './NodeConfigDrawer';
import { WorkflowToolbar } from './WorkflowToolbar';
import { ExecutionLogPanel } from './ExecutionLogPanel';
import { TemplatesModal } from './TemplatesModal';
import { WorkflowHistoryModal } from './WorkflowHistoryModal';

import { 
  WorkflowNodeData, WorkflowNodeType, WorkflowExecutionMode, 
  WorkflowLogItem, WorkflowRun, WorkflowTemplate, WorkflowDefinition 
} from '../../types/workflow';
import { WorkflowEngine } from '../../services/workflowEngine';
import { workflowFirestoreService } from '../../services/workflowFirestoreService';
import { WORKFLOW_TEMPLATES } from '../../data/workflowTemplates';

const DEFAULT_NODES: Node[] = WORKFLOW_TEMPLATES[0].nodes;
const DEFAULT_EDGES: Edge[] = WORKFLOW_TEMPLATES[0].edges;

function InnerWorkflowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(DEFAULT_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(DEFAULT_EDGES);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const [workflowName, setWorkflowName] = useState('YouTube Thumbnail Creator');
  const [workflowId, setWorkflowId] = useState('wf-' + Date.now());
  const [executionMode, setExecutionMode] = useState<WorkflowExecutionMode>('idle');
  const [logs, setLogs] = useState<WorkflowLogItem[]>([]);
  const [historyRuns, setHistoryRuns] = useState<WorkflowRun[]>([]);

  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const engineRef = useRef<WorkflowEngine | null>(null);
  const { screenToFlowPosition } = useReactFlow();

  // Load History Runs on mount
  useEffect(() => {
    workflowFirestoreService.getWorkflowRuns().then(setHistoryRuns).catch(console.error);
  }, []);

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge({ 
      ...params, 
      animated: true, 
      style: { stroke: '#6366f1', strokeWidth: 2 } 
    } as any, eds));
  }, [setEdges]);

  // Handle Drag over canvas
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle Drop onto canvas
  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow') as WorkflowNodeType;
    if (!type) return;

    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    const newNodeId = `node-${Date.now()}`;
    const newNode: Node = {
      id: newNodeId,
      type,
      position,
      data: {
        title: type.charAt(0).toUpperCase() + type.slice(1) + ' Node',
        description: 'New workflow node',
        nodeType: type,
        status: 'idle',
        params: {}
      }
    };

    setNodes((nds) => nds.concat(newNode));
    setSelectedNodeId(newNodeId);
  }, [screenToFlowPosition, setNodes]);

  // Add Node from Sidebar click
  const handleAddNode = useCallback((type: WorkflowNodeType) => {
    const newNodeId = `node-${Date.now()}`;
    const newNode: Node = {
      id: newNodeId,
      type,
      position: { x: 250 + Math.random() * 50, y: 150 + Math.random() * 50 },
      data: {
        title: type.charAt(0).toUpperCase() + type.slice(1) + ' Node',
        description: 'New workflow node',
        nodeType: type,
        status: 'idle',
        params: {}
      }
    };

    setNodes((nds) => nds.concat(newNode));
    setSelectedNodeId(newNodeId);
  }, [setNodes]);

  // Node Selection
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  // Update Node Params in State
  const handleUpdateNodeParams = useCallback((nodeId: string, params: Record<string, any>, title?: string) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === nodeId) {
          return {
            ...n,
            data: {
              ...n.data,
              params,
              ...(title ? { title } : {})
            }
          };
        }
        return n;
      })
    );
  }, [setNodes]);

  // Delete Node
  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  }, [setNodes, setEdges, selectedNodeId]);

  // Duplicate Node
  const handleDuplicateNode = useCallback((nodeId: string) => {
    const targetNode = nodes.find((n) => n.id === nodeId);
    if (!targetNode) return;

    const dupId = `node-${Date.now()}`;
    const dupNode: Node = {
      ...targetNode,
      id: dupId,
      position: { x: targetNode.position.x + 40, y: targetNode.position.y + 40 },
      data: JSON.parse(JSON.stringify(targetNode.data))
    };

    setNodes((nds) => nds.concat(dupNode));
    setSelectedNodeId(dupId);
  }, [nodes, setNodes]);

  // Auto Layout
  const handleAutoLayout = useCallback(() => {
    const startX = 100;
    const startY = 150;
    const spacingX = 320;

    setNodes((nds) =>
      nds.map((node, index) => ({
        ...node,
        position: {
          x: startX + (index % 4) * spacingX,
          y: startY + Math.floor(index / 4) * 220
        }
      }))
    );
  }, [setNodes]);

  // Append Log Helper
  const addLog = useCallback((log: Omit<WorkflowLogItem, 'id'>) => {
    const item: WorkflowLogItem = { ...log, id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}` };
    setLogs((prev) => [...prev, item]);
  }, []);

  // EXECUTION: Run Workflow
  const handleRunWorkflow = useCallback(async () => {
    if (nodes.length === 0) return;

    setExecutionMode('running');
    setLogs([]);

    // Reset node states to pending
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: { ...n.data, status: 'pending', executionTimeMs: undefined, errorMessage: undefined, output: undefined }
      }))
    );

    const startTime = Date.now();

    const engine = new WorkflowEngine(nodes, edges, {
      onNodeStatusChange: (nodeId, status, durationMs, output, errorMsg) => {
        setNodes((nds) =>
          nds.map((n) => {
            if (n.id === nodeId) {
              return {
                ...n,
                data: {
                  ...n.data,
                  status,
                  executionTimeMs: durationMs,
                  output: output || n.data.output,
                  errorMessage: errorMsg
                }
              };
            }
            return n;
          })
        );
      },
      onLog: (log) => addLog(log),
      onExecutionStateChange: (state) => setExecutionMode(state)
    });

    engineRef.current = engine;
    const success = await engine.run();
    const durationMs = Date.now() - startTime;

    // Collect generated media outputs for history
    const assetsGenerated: WorkflowRun['assetsGenerated'] = [];
    nodes.forEach((n) => {
      const out: any = n.data.output;
      if (out?.imageUrl) assetsGenerated.push({ type: 'image', url: out.imageUrl, b2FileId: out.fileId });
      if (out?.videoUrl) assetsGenerated.push({ type: 'video', url: out.videoUrl, b2FileId: out.fileId });
      if (out?.audioUrl) assetsGenerated.push({ type: 'audio', url: out.audioUrl, b2FileId: out.fileId });
    });

    // Save Run History
    const runRecord: WorkflowRun = {
      id: `run-${Date.now()}`,
      workflowId,
      workflowName,
      status: success ? 'completed' : 'failed',
      startedAt: new Date(startTime).toISOString(),
      finishedAt: new Date().toISOString(),
      executionTimeMs: durationMs,
      nodeCount: nodes.length,
      assetsGenerated,
      logs: logs
    };

    await workflowFirestoreService.saveWorkflowRun(runRecord);
    setHistoryRuns((prev) => [runRecord, ...prev]);
  }, [nodes, edges, workflowId, workflowName, setNodes, addLog, logs]);

  const handlePauseWorkflow = () => engineRef.current?.pause();
  const handleResumeWorkflow = () => engineRef.current?.resume();
  const handleCancelWorkflow = () => engineRef.current?.cancel();

  // Retry single node
  const handleRetryNode = useCallback(async (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    setNodes((nds) =>
      nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, status: 'running' } } : n))
    );

    const upstreamEdges = edges.filter((e) => e.target === nodeId);
    const upstreamOutputs = upstreamEdges.map((e) => nodes.find((n) => n.id === e.source)?.data.output).filter(Boolean);

    const engine = new WorkflowEngine(nodes, edges, {
      onNodeStatusChange: (id, status, durationMs, output, errorMsg) => {
        if (id === nodeId) {
          setNodes((nds) =>
            nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, status, executionTimeMs: durationMs, output, errorMessage: errorMsg } } : n))
          );
        }
      },
      onLog: (log) => addLog(log),
      onExecutionStateChange: () => {}
    });

    try {
      const output = await engine.executeSingleNode(node, upstreamOutputs);
      setNodes((nds) =>
        nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, status: 'success', output } } : n))
      );
    } catch (e: any) {
      setNodes((nds) =>
        nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, status: 'error', errorMessage: e.message } } : n))
      );
    }
  }, [nodes, edges, setNodes, addLog]);

  // Load Template
  const handleSelectTemplate = useCallback((template: WorkflowTemplate) => {
    setNodes(template.nodes);
    setEdges(template.edges);
    setWorkflowName(template.name);
    setSelectedNodeId(null);
    setExecutionMode('idle');
    addLog({
      timestamp: new Date().toLocaleTimeString(),
      level: 'info',
      message: `Loaded template: "${template.name}"`
    });
  }, [setNodes, setEdges, addLog]);

  // Save Workflow
  const handleSaveWorkflow = async () => {
    setIsSaving(true);
    const def: WorkflowDefinition = {
      id: workflowId,
      name: workflowName,
      description: 'Custom AI Pipeline',
      nodes,
      edges,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await workflowFirestoreService.saveWorkflow(def);
    setIsSaving(false);
    addLog({
      timestamp: new Date().toLocaleTimeString(),
      level: 'success',
      message: `Workflow "${workflowName}" saved to Firestore successfully.`
    });
  };

  // Export & Import JSON
  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ workflowName, nodes, edges }));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${workflowName.toLowerCase().replace(/\s+/g, '-')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const json = JSON.parse(evt.target?.result as string);
        if (json.nodes && json.edges) {
          setNodes(json.nodes);
          setEdges(json.edges);
          if (json.workflowName) setWorkflowName(json.workflowName);
        }
      } catch (err) {
        alert('Invalid workflow JSON file format');
      }
    };
    reader.readAsText(file);
  };

  const handleClearCanvas = () => {
    setNodes([]);
    setEdges([]);
    setSelectedNodeId(null);
    setExecutionMode('idle');
  };

  const selectedNodeData = (nodes.find((n) => n.id === selectedNodeId)?.data as unknown as WorkflowNodeData) || null;

  return (
    <div className="flex flex-col h-full w-full bg-[#030712] text-white relative overflow-hidden">
      {/* Top Control Toolbar */}
      <WorkflowToolbar
        workflowName={workflowName}
        onNameChange={setWorkflowName}
        executionMode={executionMode}
        onRun={handleRunWorkflow}
        onPause={handlePauseWorkflow}
        onResume={handleResumeWorkflow}
        onCancel={handleCancelWorkflow}
        onAutoLayout={handleAutoLayout}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onSave={handleSaveWorkflow}
        onClear={handleClearCanvas}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        isSaving={isSaving}
      />

      {/* Main Canvas Workspace */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Left Drag Palette */}
        <NodeSidebar onAddNode={handleAddNode} />

        {/* Center Flow Canvas */}
        <div className="flex-1 h-full relative" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            colorMode="dark"
            className="bg-[#030712]"
          >
            <Background variant={BackgroundVariant.Dots} gap={24} size={1.5} color="#1f293d" />
            <Controls className="!bg-[#090d16]/90 !border-white/10 !fill-white !rounded-xl overflow-hidden shadow-2xl" />
            <MiniMap 
              style={{ backgroundColor: '#090d16', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}
              nodeColor={() => '#6366f1'} 
              maskColor="rgba(3, 7, 18, 0.7)"
            />
          </ReactFlow>
        </div>

        {/* Right Config Drawer */}
        <NodeConfigDrawer
          nodeId={selectedNodeId}
          nodeData={selectedNodeData}
          onClose={() => setSelectedNodeId(null)}
          onUpdateParams={handleUpdateNodeParams}
          onDeleteNode={handleDeleteNode}
          onDuplicateNode={handleDuplicateNode}
          onRetryNode={handleRetryNode}
        />
      </div>

      {/* Execution Real-Time Console Panel */}
      <ExecutionLogPanel logs={logs} onClearLogs={() => setLogs([])} />

      {/* Modals */}
      <TemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      <WorkflowHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        runs={historyRuns}
      />
    </div>
  );
}

export function WorkflowCanvas() {
  return (
    <ReactFlowProvider>
      <InnerWorkflowCanvas />
    </ReactFlowProvider>
  );
}

import React from 'react';
import { WorkflowCanvas } from '../../components/workflows/WorkflowCanvas';

export const Workflows = () => {
  return (
    <div className="w-full h-full min-h-[calc(100vh-4rem)] flex flex-col overflow-hidden -m-6 md:-m-8">
      <WorkflowCanvas />
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { Workspace } from './pages/Workspace/Workspace';
import { TeamCollaboration } from './pages/Team/TeamCollaboration';
import { Library } from './pages/Library/Library';
import { Compare } from './pages/Compare/Compare';
import { Workflows } from './pages/Workflows/Workflows';
import { History } from './pages/History/History';
import { Analytics } from './pages/Analytics/Analytics';
import { Settings } from './pages/Settings/Settings';
import { Login } from './pages/Auth/Login';
import { PromptAssistant } from './pages/PromptAssistant/PromptAssistant';
import { RemixStudio } from './pages/RemixStudio/RemixStudio';
import { SemanticSearch } from './pages/SemanticSearch/SemanticSearch';
import { MetadataEngine } from './pages/MetadataEngine/MetadataEngine';
import { ShareManager } from './pages/Share/ShareManager';
import { PublicShowcase } from './pages/Share/PublicShowcase';
import { ActivityFeed } from './pages/ActivityFeed/ActivityFeed';
import { AgentMode } from './pages/AgentMode/AgentMode';
import { ModelHub } from './pages/ModelHub/ModelHub';
import { Marketplace } from './pages/Marketplace/Marketplace';
import { DeveloperPortal } from './pages/DeveloperPortal/DeveloperPortal';
import { MultiAgentWorkspace } from './pages/MultiAgent/MultiAgentWorkspace';
import { ProjectManagement } from './pages/Projects/ProjectManagement';
import { AutomationCenter } from './pages/Automations/AutomationCenter';
import { BusinessBuilder } from './pages/BusinessBuilder/BusinessBuilder';
import { SplashScreen } from './components/common/SplashScreen';
import { useAuthListener } from './store/useAuthListener';

export default function App() {
  useAuthListener();
  return (
    <SplashScreen>
      <BrowserRouter>
        <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/share/:shareId" element={<PublicShowcase />} />
        
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/builder" element={<BusinessBuilder />} />
          <Route path="/projects" element={<ProjectManagement />} />
          <Route path="/projects/:projectId" element={<ProjectManagement />} />
          <Route path="/automations" element={<AutomationCenter />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/models" element={<ModelHub />} />
          <Route path="/developer" element={<DeveloperPortal />} />
          <Route path="/multi-agent" element={<MultiAgentWorkspace />} />
          <Route path="/activity" element={<ActivityFeed />} />
          <Route path="/agent" element={<AgentMode />} />
          <Route path="/shares" element={<ShareManager />} />
          <Route path="/search" element={<SemanticSearch />} />
          <Route path="/metadata" element={<MetadataEngine />} />
          <Route path="/generate" element={<Workspace />} />
          <Route path="/assistant" element={<PromptAssistant />} />
          <Route path="/remix" element={<RemixStudio />} />
          <Route path="/team" element={<TeamCollaboration />} />
          <Route path="/assets" element={<Library />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/workflows" element={<Workflows />} />
          <Route path="/history" element={<History />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </SplashScreen>
);
}

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Gamepad2, Calendar, Edit, Trash2 } from 'lucide-react';
import RichTextEditor from '../components/RichTextEditor';
import RichTextViewer from '../components/RichTextViewer';
import { toast } from 'sonner';

interface CasualGame {
  id: string;
  name: string;
  description: string;
  rules: string;
  modpack_url: string;
  status: string;
  created_by_uuid: string;
  created_by_name: string;
  max_players: number;
  scheduled_time: string;
  created_at: string;
  signups?: Array<{
    id: string;
    user_uuid: string;
    username: string;
    discord_username: string;
    discord_avatar: string;
    preferred_nation: string;
    status: string;
  }>;
}

interface RulesTemplate {
  id: string;
  name: string;
  rules: string;
  created_by_name: string;
  created_at: string;
}

export default function CasualGamesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [games, setGames] = useState<CasualGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGameName, setNewGameName] = useState('');
  const [newGameDescription, setNewGameDescription] = useState('');
  const [newGameScheduledTime, setNewGameScheduledTime] = useState('');
  const [newGameRules, setNewGameRules] = useState('');
  const [newGameModpackUrl, setNewGameModpackUrl] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'completed'>('all');
  const [rulesTemplates, setRulesTemplates] = useState<RulesTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<RulesTemplate | null>(null);
  const [editTemplateName, setEditTemplateName] = useState('');
  const [editTemplateRules, setEditTemplateRules] = useState('');

  const isMatchmaker = session && ['admin', 'matchmaker'].includes((session.user as any)?.role);
  const isAdmin = session && (session.user as any)?.role === 'admin';

  useEffect(() => {
    fetchGames();
    const interval = setInterval(fetchGames, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (showCreateModal && isMatchmaker) {
      fetchTemplates();
    }
  }, [showCreateModal, isMatchmaker]);

  useEffect(() => {
    if (showTemplateManager && isAdmin) {
      fetchTemplates();
    }
  }, [showTemplateManager, isAdmin]);

  const fetchGames = async () => {
    try {
      const response = await fetch('/api/casual/games');
      const data = await response.json();
      setGames(data.games || []);
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/casual/rules-templates');
      const data = await response.json();
      setRulesTemplates(data.templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const loadTemplate = (templateId: string) => {
    const template = rulesTemplates.find(t => t.id === templateId);
    if (template) {
      setNewGameRules(template.rules);
      setSelectedTemplate(templateId);
    }
  };

  const saveTemplate = async () => {
    if (!templateName || !newGameRules) {
      toast.error('Template name and rules are required');
      return;
    }

    try {
      const response = await fetch('/api/casual/rules-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateName,
          rules: newGameRules,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'Failed to save template');
        return;
      }

      toast.success('Template saved successfully!');
      setTemplateName('');
      setSaveAsTemplate(false);
      await fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    }
  };

  const startEditingTemplate = (template: RulesTemplate) => {
    setEditingTemplate(template);
    setEditTemplateName(template.name);
    setEditTemplateRules(template.rules);
  };

  const cancelEditingTemplate = () => {
    setEditingTemplate(null);
    setEditTemplateName('');
    setEditTemplateRules('');
  };

  const updateTemplate = async () => {
    if (!editingTemplate) return;

    if (!editTemplateName || !editTemplateRules) {
      toast.error('Template name and rules are required');
      return;
    }

    try {
      const response = await fetch(`/api/casual/rules-templates/${editingTemplate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editTemplateName,
          rules: editTemplateRules,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'Failed to update template');
        return;
      }

      toast.success('Template updated successfully!');
      cancelEditingTemplate();
      await fetchTemplates();
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('Failed to update template');
    }
  };

  const deleteTemplate = async (templateId: string, templateName: string) => {
    if (!confirm(`Are you sure you want to delete the template "${templateName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/casual/rules-templates/${templateId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete template');
        return;
      }

      toast.success('Template deleted successfully!');
      await fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handleCreateGame = async () => {
    if (!newGameName) {
      toast.error('Game name is required');
      return;
    }

    // Convert datetime-local format (YYYY-MM-DDTHH:MM) to ClickHouse format (YYYY-MM-DD HH:MM:SS)
    const formatScheduledTime = (dateTimeLocal: string) => {
      if (!dateTimeLocal) return undefined;
      return dateTimeLocal.replace('T', ' ') + ':00';
    };

    try {
      const response = await fetch('/api/casual/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGameName,
          description: newGameDescription,
          scheduled_time: formatScheduledTime(newGameScheduledTime),
          rules: newGameRules,
          modpack_url: newGameModpackUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'Failed to create game');
        return;
      }

      toast.success('Game created successfully!');
      setNewGameName('');
      setNewGameDescription('');
      setNewGameScheduledTime('');
      setNewGameRules('');
      setNewGameModpackUrl('');
      setSelectedTemplate('');
      setSaveAsTemplate(false);
      setTemplateName('');
      setShowCreateModal(false);
      await fetchGames();
    } catch (error) {
      console.error('Error creating game:', error);
      toast.error('Failed to create game');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-900/30 border-green-700 text-green-400';
      case 'in_progress':
        return 'bg-amber-900/30 border-amber-700 text-amber-400';
      case 'completed':
        return 'bg-blue-900/30 border-blue-700 text-blue-400';
      default:
        return 'bg-zinc-800 border-zinc-700 text-zinc-500';
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'In Progress';
      case 'open':
        return 'Open';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <Navbar />

      <main className="container mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-zinc-800 p-2 sm:p-3 border-2 border-zinc-700">
                <Gamepad2 className="size-6 sm:size-8 text-amber-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100">Casual Games</h1>
                <p className="text-zinc-400 text-xs sm:text-sm">
                  No brackets, just nation selection
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {isAdmin && (
                <Button
                  onClick={() => setShowTemplateManager(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white gap-2"
                >
                  Manage Templates
                </Button>
              )}
              {isMatchmaker && (
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-green-600 hover:bg-green-500 text-white gap-2"
                >
                  <UserPlus className="size-4" />
                  Create Game
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-amber-600 text-white'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            All Games
          </button>
          <button
            onClick={() => setStatusFilter('open')}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              statusFilter === 'open'
                ? 'bg-green-600 text-white'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            Open
          </button>
          <button
            onClick={() => setStatusFilter('in_progress')}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              statusFilter === 'in_progress'
                ? 'bg-amber-600 text-white'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            In Progress
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              statusFilter === 'completed'
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            Completed
          </button>
        </div>

        {/* Games List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-zinc-400">Loading games...</div>
          </div>
        ) : games.filter(game => statusFilter === 'all' || game.status === statusFilter).length === 0 ? (
          <div className="bg-zinc-900/50 border-2 border-zinc-800 p-12 text-center">
            <Gamepad2 className="size-16 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-zinc-400 mb-2">
              {statusFilter === 'all' ? 'No Casual Games Yet' :
               statusFilter === 'open' ? 'No Open Games' :
               statusFilter === 'in_progress' ? 'No Games In Progress' :
               'No Completed Games'}
            </h3>
            <p className="text-zinc-500 mb-6">
              {statusFilter === 'all'
                ? (isMatchmaker
                    ? 'Create the first casual game to get started!'
                    : 'Check back soon for new casual games to join.')
                : statusFilter === 'open'
                ? 'There are no open games available right now. Check back later!'
                : statusFilter === 'in_progress'
                ? 'No games are currently in progress.'
                : 'No games have been completed yet.'}
            </p>
            {isMatchmaker && (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-green-600 hover:bg-green-500 text-white"
              >
                <UserPlus className="size-4 mr-2" />
                Create First Game
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            {games.filter(game => statusFilter === 'all' || game.status === statusFilter).map((game) => {
              const approvedCount = game.signups?.filter(s => s.status === 'approved').length || 0;
              const totalSignups = game.signups?.length || 0;
              const userSignup = session
                ? game.signups?.find(s => s.user_uuid === (session.user as any)?.id)
                : null;

              return (
                <div
                  key={game.id}
                  className="bg-zinc-900/50 border-2 border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer"
                  onClick={() => router.push(`/casual/${game.id}`)}
                >
                  <div className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="bg-zinc-800 p-2 border-2 border-zinc-700">
                            <Gamepad2 className="size-5 text-amber-400" />
                          </div>
                          <div className="flex-1">
                            <h2 className="text-xl font-bold text-zinc-100 mb-1">{game.name}</h2>
                            {game.description && (
                              <p className="text-sm text-zinc-400 mb-2">{game.description}</p>
                            )}
                            <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
                              <span>Created by {game.created_by_name}</span>
                              <span>•</span>
                              <span>{new Date(game.created_at).toLocaleDateString()}</span>
                            </div>
                            {game.scheduled_time && game.scheduled_time !== '1970-01-01 00:00:00' && (
                              <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-400">
                                <Calendar className="size-3" />
                                <span>Scheduled: {new Date(game.scheduled_time).toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* User Signup Status */}
                        {userSignup && (
                          <div className="mt-3 p-3 bg-green-900/20 border border-green-800 rounded">
                            <p className="text-sm text-green-300">
                              ✓ You're signed up as <strong>{userSignup.preferred_nation}</strong>
                              {userSignup.status !== 'approved' && (
                                <span className="text-amber-400 ml-2">({userSignup.status})</span>
                              )}
                            </p>
                          </div>
                        )}

                        {/* Approved Players Preview */}
                        {game.signups && game.signups.filter(s => s.status === 'approved').length > 0 && (
                          <div className="mt-3 flex items-center gap-2">
                            <div className="flex -space-x-2">
                              {game.signups
                                .filter(s => s.status === 'approved')
                                .slice(0, 5)
                                .map((signup, idx) => (
                                  <div key={signup.id} className="relative" title={signup.username}>
                                    {signup.discord_avatar ? (
                                      <img
                                        src={signup.discord_avatar}
                                        alt={signup.username}
                                        className="size-8 rounded-full border-2 border-zinc-900 bg-zinc-800"
                                      />
                                    ) : (
                                      <div className="size-8 rounded-full border-2 border-zinc-900 bg-zinc-700 flex items-center justify-center">
                                        <span className="text-xs text-zinc-400 font-medium">
                                          {signup.username.charAt(0).toUpperCase()}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                            </div>
                            {game.signups.filter(s => s.status === 'approved').length > 5 && (
                              <span className="text-xs text-zinc-500">
                                +{game.signups.filter(s => s.status === 'approved').length - 5} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 sm:items-end">
                        <Badge className={`${getStatusBadgeClass(game.status)} h-6`}>
                          {formatStatus(game.status)}
                        </Badge>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="size-4 text-zinc-400" />
                          <span className="text-zinc-300">
                            {approvedCount} approved / {totalSignups} signups
                          </span>
                        </div>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/casual/${game.id}`);
                          }}
                          size="sm"
                          className="bg-amber-600 hover:bg-amber-500 text-white"
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create Game Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border-2 border-zinc-700 max-w-2xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b-2 border-zinc-800">
              <h2 className="text-xl font-bold text-zinc-100">Create Casual Game</h2>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="p-6 overflow-y-auto flex-1">

            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Game Name *
              </label>
              <input
                type="text"
                value={newGameName}
                onChange={(e) => setNewGameName(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-800 border-2 border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-600"
                placeholder="Enter game name..."
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Description
              </label>
              <textarea
                value={newGameDescription}
                onChange={(e) => setNewGameDescription(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-800 border-2 border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-600 min-h-[80px]"
                placeholder="Optional description..."
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Scheduled Time
              </label>
              <input
                type="datetime-local"
                value={newGameScheduledTime}
                onChange={(e) => setNewGameScheduledTime(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-800 border-2 border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-600"
              />
              <p className="text-xs text-zinc-500 mt-1">Optional - leave blank for no scheduled time</p>
            </div>

            {/* Rules Template Selector */}
            {rulesTemplates.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Load from Template
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => loadTemplate(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-800 border-2 border-zinc-700 text-zinc-100 focus:outline-none focus:border-amber-600"
                >
                  <option value="">-- Select a template --</option>
                  {rulesTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} (by {template.created_by_name})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Rules */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-zinc-300">
                  Rules
                </label>
                {newGameRules && (
                  <button
                    type="button"
                    onClick={() => setSaveAsTemplate(!saveAsTemplate)}
                    className="text-xs text-amber-400 hover:text-amber-300"
                  >
                    {saveAsTemplate ? 'Cancel Save' : 'Save as Template'}
                  </button>
                )}
              </div>
              <RichTextEditor
                content={newGameRules}
                onChange={setNewGameRules}
                placeholder="Enter game rules..."
              />
            </div>

            {/* Save Template Name */}
            {saveAsTemplate && (
              <div className="mb-4 p-3 bg-amber-900/20 border border-amber-700 rounded">
                <label className="block text-sm font-medium text-amber-300 mb-2">
                  Template Name
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="flex-1 px-4 py-2 bg-zinc-800 border-2 border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-600"
                    placeholder="Enter template name..."
                  />
                  <button
                    onClick={saveTemplate}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            {/* Modpack URL */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Steam Workshop Modpack (Optional)
              </label>
              <input
                type="url"
                value={newGameModpackUrl}
                onChange={(e) => setNewGameModpackUrl(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-800 border-2 border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-600"
                placeholder="https://steamcommunity.com/sharedfiles/filedetails/?id=..."
              />
              <p className="text-xs text-zinc-500 mt-1">Required modpack URL from Steam Workshop</p>
            </div>
            </div>

            {/* Modal Footer - Fixed */}
            <div className="p-6 border-t-2 border-zinc-800">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border-2 border-zinc-700 text-zinc-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateGame}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-semibold transition-colors"
                >
                  Create Game
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Manager Modal */}
      {showTemplateManager && isAdmin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border-2 border-zinc-700 max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b-2 border-zinc-800">
              <h2 className="text-xl font-bold text-zinc-100">Manage Rules Templates</h2>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="p-6 overflow-y-auto flex-1">
              {rulesTemplates.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-zinc-400">No templates created yet.</p>
                  <p className="text-sm text-zinc-500 mt-2">Create a game with rules and save them as a template.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {rulesTemplates.map((template) => (
                    <div key={template.id} className="bg-zinc-800/50 border-2 border-zinc-700 p-4">
                      {editingTemplate?.id === template.id ? (
                        // Edit Mode
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                              Template Name
                            </label>
                            <input
                              type="text"
                              value={editTemplateName}
                              onChange={(e) => setEditTemplateName(e.target.value)}
                              className="w-full px-4 py-2 bg-zinc-800 border-2 border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-600"
                              placeholder="Enter template name..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                              Rules
                            </label>
                            <RichTextEditor
                              content={editTemplateRules}
                              onChange={setEditTemplateRules}
                              placeholder="Enter rules..."
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={updateTemplate}
                              className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-medium transition-colors"
                            >
                              Save Changes
                            </button>
                            <button
                              onClick={cancelEditingTemplate}
                              className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 font-medium transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        // View Mode
                        <div>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-zinc-100 mb-1">{template.name}</h3>
                              <p className="text-xs text-zinc-500">
                                Created by {template.created_by_name} on {new Date(template.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => startEditingTemplate(template)}
                                className="p-2 bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                                title="Edit template"
                              >
                                <Edit className="size-4" />
                              </button>
                              <button
                                onClick={() => deleteTemplate(template.id, template.name)}
                                className="p-2 bg-red-600 hover:bg-red-500 text-white transition-colors"
                                title="Delete template"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </div>
                          </div>
                          <div className="bg-zinc-900 p-4 border border-zinc-700 max-h-48 overflow-y-auto">
                            <RichTextViewer content={template.rules} />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer - Fixed */}
            <div className="p-6 border-t-2 border-zinc-800">
              <button
                onClick={() => {
                  setShowTemplateManager(false);
                  cancelEditingTemplate();
                }}
                className="w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border-2 border-zinc-700 text-zinc-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

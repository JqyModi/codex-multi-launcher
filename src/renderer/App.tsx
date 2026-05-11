import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Folder,
  FolderOpen,
  Play,
  Plus,
  RefreshCcw,
  Rocket,
  TestTube2,
  Trash2,
  TriangleAlert
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type {
  CreateProfileInput,
  EnvironmentReport,
  ConfigBackupInfo,
  ManagedProfile,
  ProfileRuntimeInfo,
  ProviderTestResult
} from "../shared/types";

type WizardStep = "profile" | "provider" | "test" | "launcher" | "generate";

const WIZARD_STEPS: Array<{ id: WizardStep; label: string }> = [
  { id: "profile", label: "Profile" },
  { id: "provider", label: "Provider" },
  { id: "test", label: "Test" },
  { id: "launcher", label: "Launcher" },
  { id: "generate", label: "Generate" }
];

const DEFAULT_FORM = {
  name: "Codex Sandbox",
  providerType: "third_party_responses" as "official_openai" | "third_party_responses",
  providerName: "Proxy",
  baseUrl: "https://example.com/v1",
  model: "gpt-5.2",
  apiKey: "",
  inheritDefaultConfig: true,
  launcherDirectory: ""
};

export function App() {
  const [environment, setEnvironment] = useState<EnvironmentReport | null>(null);
  const [profiles, setProfiles] = useState<ManagedProfile[]>([]);
  const [runtimeStatuses, setRuntimeStatuses] = useState<ProfileRuntimeInfo[]>([]);
  const [showDeletedProfiles, setShowDeletedProfiles] = useState(false);
  const [configBackups, setConfigBackups] = useState<ConfigBackupInfo[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [wizardStep, setWizardStep] = useState<WizardStep>("profile");
  const [form, setForm] = useState(DEFAULT_FORM);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isTestingProvider, setIsTestingProvider] = useState(false);
  const [isTestingEditProvider, setIsTestingEditProvider] = useState(false);
  const [providerTest, setProviderTest] = useState<ProviderTestResult | null>(null);
  const [editProviderTest, setEditProviderTest] = useState<ProviderTestResult | null>(null);
  const [editForm, setEditForm] = useState({
    providerName: "",
    baseUrl: "",
    model: "",
    apiKey: ""
  });
  const [message, setMessage] = useState<string | null>(null);

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.id === selectedProfileId) ?? profiles[0] ?? null,
    [profiles, selectedProfileId]
  );

  const currentStepIndex = WIZARD_STEPS.findIndex((step) => step.id === wizardStep);
  const canGoBack = currentStepIndex > 0;
  const canGoNext = currentStepIndex < WIZARD_STEPS.length - 1 && isCurrentStepValid(wizardStep, form);

  async function refresh() {
    const [environmentReport, profileList] = await Promise.all([
      window.codexProfileManager.getEnvironmentReport(),
      window.codexProfileManager.listProfiles(showDeletedProfiles)
    ]);
    const runtime = await window.codexProfileManager.getRuntimeStatus();
    setEnvironment(environmentReport);
    setProfiles(profileList);
    setRuntimeStatuses(runtime);
    setSelectedProfileId((current) => current ?? profileList[0]?.id ?? null);
  }

  useEffect(() => {
    void refresh();
  }, [showDeletedProfiles]);

  useEffect(() => {
    if (!selectedProfile) return;
    setEditForm({
      providerName: selectedProfile.provider.displayName,
      baseUrl: selectedProfile.provider.baseUrl ?? "",
      model: selectedProfile.provider.model,
      apiKey: ""
    });
    setEditProviderTest(null);
    void window.codexProfileManager.listConfigBackups(selectedProfile.id).then(setConfigBackups);
  }, [selectedProfile]);

  function nextStep() {
    if (!canGoNext) return;
    setWizardStep(WIZARD_STEPS[currentStepIndex + 1].id);
  }

  function previousStep() {
    if (!canGoBack) return;
    setWizardStep(WIZARD_STEPS[currentStepIndex - 1].id);
  }

  async function createProfile() {
    setIsCreating(true);
    setMessage(null);

    try {
      const input: CreateProfileInput = {
        name: form.name,
        inheritDefaultConfig: form.inheritDefaultConfig,
        launcherDirectory: form.launcherDirectory || undefined,
        provider: {
          type: form.providerType,
          displayName: form.providerName,
          baseUrl: form.providerType === "third_party_responses" ? form.baseUrl : undefined,
          model: form.model,
          apiKey: form.apiKey,
          reasoningEffort: "medium"
        }
      };
      const result = await window.codexProfileManager.createProfile(input);
      await refresh();
      setSelectedProfileId(result.profile.id);
      setMessage(`Created ${result.profile.name}. Launcher: ${result.launcherPath}`);
      setForm({ ...DEFAULT_FORM, name: `${form.name} 2` });
      setProviderTest(null);
      setWizardStep("profile");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to create profile.");
    } finally {
      setIsCreating(false);
    }
  }

  async function testProvider() {
    setIsTestingProvider(true);
    setProviderTest(null);
    setMessage(null);

    try {
      const result = await window.codexProfileManager.testProvider({
        baseUrl: form.providerType === "third_party_responses" ? form.baseUrl : "https://api.openai.com/v1",
        apiKey: form.apiKey,
        model: form.model
      });
      setProviderTest(result);
    } catch (error) {
      setProviderTest({
        status: "unknown_error",
        ok: false,
        summary: "Provider test failed",
        details: error instanceof Error ? error.message : "Unknown provider test error.",
        testedModelsEndpoint: false,
        testedResponsesEndpoint: false
      });
    } finally {
      setIsTestingProvider(false);
    }
  }

  async function testEditProvider() {
    if (!selectedProfile) return;
    if (!editForm.apiKey) {
      setEditProviderTest({
        status: "unknown_error",
        ok: false,
        summary: "API key required for test",
        details: "Enter a new API key to test edited provider settings. Leave it empty only when saving without changing the key.",
        testedModelsEndpoint: false,
        testedResponsesEndpoint: false
      });
      return;
    }

    setIsTestingEditProvider(true);
    setEditProviderTest(null);

    try {
      const result = await window.codexProfileManager.testProvider({
        baseUrl: editForm.baseUrl,
        apiKey: editForm.apiKey,
        model: editForm.model
      });
      setEditProviderTest(result);
    } catch (error) {
      setEditProviderTest({
        status: "unknown_error",
        ok: false,
        summary: "Provider test failed",
        details: error instanceof Error ? error.message : "Unknown provider test error.",
        testedModelsEndpoint: false,
        testedResponsesEndpoint: false
      });
    } finally {
      setIsTestingEditProvider(false);
    }
  }

  async function openSelectedProfile() {
    if (!selectedProfile) return;
    const result = await window.codexProfileManager.openProfile(selectedProfile.id);
    setMessage(result.pid ? `Launched ${selectedProfile.name} with PID ${result.pid}.` : `Launched ${selectedProfile.name}.`);
    window.setTimeout(() => void refresh(), 1200);
  }

  async function deleteSelectedProfile() {
    if (!selectedProfile) return;
    const confirmed = window.confirm(`Remove "${selectedProfile.name}" from the dashboard? Profile files will be kept on disk.`);
    if (!confirmed) return;

    await window.codexProfileManager.deleteProfile(selectedProfile.id);
    setSelectedProfileId(null);
    setMessage(`Removed ${selectedProfile.name} from the dashboard. Files were kept on disk.`);
    await refresh();
  }

  async function restoreSelectedProfile() {
    if (!selectedProfile) return;
    await window.codexProfileManager.restoreProfile(selectedProfile.id);
    setMessage(`Restored ${selectedProfile.name}.`);
    await refresh();
  }

  async function saveSelectedProfile() {
    if (!selectedProfile) return;
    setIsUpdatingProfile(true);
    setMessage(null);

    try {
      const result = await window.codexProfileManager.updateProfile({
        profileId: selectedProfile.id,
        provider: {
          displayName: editForm.providerName,
          baseUrl: editForm.baseUrl,
          model: editForm.model,
          apiKey: editForm.apiKey || undefined
        }
      });
      await refresh();
      setSelectedProfileId(result.profile.id);
      setEditForm((current) => ({ ...current, apiKey: "" }));
      setMessage(`Updated ${result.profile.name}. Config and launcher were regenerated.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to update profile.");
    } finally {
      setIsUpdatingProfile(false);
    }
  }

  async function pickLauncherDirectory() {
    const selectedDirectory = await window.codexProfileManager.pickLauncherDirectory();
    if (!selectedDirectory) return;
    setForm((current) => ({ ...current, launcherDirectory: selectedDirectory }));
  }

  async function revealPath(targetPath: string) {
    await window.codexProfileManager.revealPath(targetPath);
  }

  async function copyDiagnosticsReport() {
    const report = await window.codexProfileManager.getDiagnosticsReport();
    await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setMessage("Diagnostics report copied. API keys are not included.");
  }

  async function restoreBackup(backup: ConfigBackupInfo) {
    const confirmed = window.confirm(`Restore this config backup from ${new Date(backup.createdAt).toLocaleString()}? Current config.toml will be backed up first.`);
    if (!confirmed) return;

    await window.codexProfileManager.restoreConfigBackup({
      profileId: backup.profileId,
      backupPath: backup.backupPath
    });
    setMessage("Config backup restored. Restart this Codex profile for the restored config to take effect.");
    setConfigBackups(await window.codexProfileManager.listConfigBackups(backup.profileId));
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Rocket size={18} />
          </div>
          <div>
            <h1>Codex Profiles</h1>
            <p>Local multi-instance manager</p>
          </div>
        </div>

        <button className="sidebar-action" onClick={() => setWizardStep("profile")} type="button">
          <Plus size={16} />
          Create Profile
        </button>
        <label className="sidebar-toggle">
          <input checked={showDeletedProfiles} onChange={(event) => setShowDeletedProfiles(event.target.checked)} type="checkbox" />
          Show removed
        </label>

        <div className="profile-list">
          {profiles.length === 0 ? (
            <p className="empty-text">No profiles yet.</p>
          ) : (
            profiles.map((profile) => (
              <button
                className={`profile-row ${selectedProfile?.id === profile.id ? "selected" : ""}`}
                key={profile.id}
                onClick={() => setSelectedProfileId(profile.id)}
                type="button"
              >
                <span className="profile-name">{profile.name}</span>
                <span className="profile-meta">{profile.provider.displayName} / {profile.provider.model}</span>
                {profile.status === "deleted" ? <span className="runtime-badge deleted">Removed</span> : null}
                <RuntimeBadge runtime={runtimeStatuses.find((item) => item.profileId === profile.id)} />
              </button>
            ))
          )}
        </div>
      </aside>

      <section className="content">
        <header className="toolbar">
          <div>
            <h2>Profile Manager</h2>
            <p>Create isolated Codex desktop windows with separate provider configuration.</p>
          </div>
          <button className="button secondary" onClick={() => void refresh()} type="button">
            <RefreshCcw size={15} />
            Refresh
          </button>
          <button className="button secondary" onClick={() => void copyDiagnosticsReport()} type="button">
            Copy Diagnostics
          </button>
        </header>

        {message ? <div className="notice">{message}</div> : null}

        <div className="grid">
          <section className="panel">
            <div className="panel-heading">
              <h3>Environment</h3>
              <span className="badge neutral">macOS MVP</span>
            </div>
            <div className="checks">
              {environment?.checks.map((check) => (
                <div className="check-row" key={check.id}>
                  {check.status === "pass" ? (
                    <CheckCircle2 className="ok" size={17} />
                  ) : (
                    <TriangleAlert className={check.status === "warn" ? "warn" : "danger"} size={17} />
                  )}
                  <div>
                    <strong>{check.label}</strong>
                    <p>{check.detail}</p>
                    {check.path ? <code>{check.path}</code> : null}
                  </div>
                </div>
              )) ?? <p className="empty-text">Loading checks...</p>}
            </div>
          </section>

          <section className="panel wizard-panel">
            <div className="panel-heading">
              <h3>Create Profile</h3>
              <span className="badge success">API key encrypted locally</span>
            </div>
            <WizardNav current={wizardStep} />
            <WizardBody
              form={form}
              providerTest={providerTest}
              isTestingProvider={isTestingProvider}
              wizardStep={wizardStep}
              onChange={setForm}
              onPickLauncherDirectory={() => void pickLauncherDirectory()}
              onTestProvider={() => void testProvider()}
            />
            <div className="wizard-actions">
              <button className="button secondary" disabled={!canGoBack} onClick={previousStep} type="button">
                <ChevronLeft size={15} />
                Back
              </button>
              {wizardStep === "generate" ? (
                <button className="button primary" disabled={isCreating || !isCurrentStepValid(wizardStep, form)} onClick={() => void createProfile()} type="button">
                  <Plus size={16} />
                  {isCreating ? "Generating..." : "Generate"}
                </button>
              ) : (
                <button className="button primary" disabled={!canGoNext} onClick={nextStep} type="button">
                  Next
                  <ChevronRight size={15} />
                </button>
              )}
            </div>
          </section>
        </div>

        <section className="panel detail-panel">
          <div className="panel-heading">
            <h3>Selected Profile</h3>
            {selectedProfile?.status === "deleted" ? (
              <div className="detail-actions">
                <button className="button secondary" onClick={() => void revealPath(selectedProfile.paths.codexHome)} type="button">
                  <FolderOpen size={15} />
                  Reveal Files
                </button>
                <button className="button primary" onClick={() => void restoreSelectedProfile()} type="button">
                  Restore
                </button>
              </div>
            ) : selectedProfile ? (
              <div className="detail-actions">
                <button className="button danger" onClick={() => void deleteSelectedProfile()} type="button">
                  <Trash2 size={15} />
                  Remove
                </button>
                <button className="button primary" onClick={() => void openSelectedProfile()} type="button">
                  <Play size={15} />
                  Open
                </button>
              </div>
            ) : null}
          </div>
          {selectedProfile ? (
            <div className="profile-detail">
              <PathRow icon={<Folder size={15} />} label="CODEX_HOME" onReveal={() => void revealPath(selectedProfile.paths.codexHome)} value={selectedProfile.paths.codexHome} />
              <PathRow icon={<Folder size={15} />} label="user-data-dir" onReveal={() => void revealPath(selectedProfile.paths.userDataDir)} value={selectedProfile.paths.userDataDir} />
              <PathRow icon={<Folder size={15} />} label="Launcher" onReveal={() => void revealPath(selectedProfile.paths.launcherPath)} value={selectedProfile.paths.launcherPath} />
              <PathRow label="Provider" value={`${selectedProfile.provider.displayName} (${selectedProfile.provider.wireApi})`} />
              <PathRow label="Base URL" value={selectedProfile.provider.baseUrl ?? "Official OpenAI"} />
              <PathRow label="Env key" value={selectedProfile.provider.envKeyName} />
              <PathRow label="Last launched" value={selectedProfile.launch.lastLaunchedAt ? new Date(selectedProfile.launch.lastLaunchedAt).toLocaleString() : "Never"} />
              <PathRow label="Runtime" value={runtimeStatuses.find((item) => item.profileId === selectedProfile.id)?.detail ?? "Not checked"} />
              <div className="backup-list">
                <h4>Recent Config Backups</h4>
                {configBackups.length === 0 ? (
                  <p className="empty-text">No snapshots yet. A snapshot is created before config changes.</p>
                ) : (
                  configBackups.slice(0, 3).map((backup) => (
                    <div className="backup-row" key={backup.backupPath}>
                      <div>
                        <strong>{new Date(backup.createdAt).toLocaleString()}</strong>
                        <p>{backup.reason}</p>
                      </div>
                      <button className="icon-button" onClick={() => void revealPath(backup.backupPath)} title="Reveal backup" type="button">
                        <FolderOpen size={15} />
                      </button>
                      <button className="button secondary compact" onClick={() => void restoreBackup(backup)} type="button">
                        Restore
                      </button>
                    </div>
                  ))
                )}
              </div>
              <div className="edit-box">
                <h4>Edit Provider</h4>
                <label>
                  Provider name
                  <input value={editForm.providerName} onChange={(event) => setEditForm({ ...editForm, providerName: event.target.value })} />
                </label>
                <label>
                  Base URL
                  <input value={editForm.baseUrl} onChange={(event) => setEditForm({ ...editForm, baseUrl: event.target.value })} />
                </label>
                <label>
                  Model
                  <input value={editForm.model} onChange={(event) => setEditForm({ ...editForm, model: event.target.value })} />
                </label>
                <label>
                  New API key
                  <input placeholder="Leave empty to keep current key" type="password" value={editForm.apiKey} onChange={(event) => setEditForm({ ...editForm, apiKey: event.target.value })} />
                </label>
                <div className="button-row">
                  <button className="button secondary" disabled={isTestingEditProvider || !editForm.baseUrl || !editForm.model} onClick={() => void testEditProvider()} type="button">
                    <TestTube2 size={15} />
                    {isTestingEditProvider ? "Testing..." : "Test"}
                  </button>
                  <button className="button secondary" disabled={isUpdatingProfile || !editForm.providerName || !editForm.baseUrl || !editForm.model} onClick={() => void saveSelectedProfile()} type="button">
                    {isUpdatingProfile ? "Saving..." : "Save Provider"}
                  </button>
                </div>
                <ProviderTestBox providerTest={editProviderTest} />
              </div>
            </div>
          ) : (
            <p className="empty-text">Create a profile to see generated paths.</p>
          )}
        </section>
      </section>
    </main>
  );
}

function WizardNav({ current }: { current: WizardStep }) {
  return (
    <ol className="wizard-nav">
      {WIZARD_STEPS.map((step, index) => (
        <li className={step.id === current ? "current" : ""} key={step.id}>
          <span>{index + 1}</span>
          {step.label}
        </li>
      ))}
    </ol>
  );
}

function WizardBody({
  form,
  providerTest,
  isTestingProvider,
  wizardStep,
  onChange,
  onPickLauncherDirectory,
  onTestProvider
}: {
  form: typeof DEFAULT_FORM;
  providerTest: ProviderTestResult | null;
  isTestingProvider: boolean;
  wizardStep: WizardStep;
  onChange: (nextForm: typeof DEFAULT_FORM) => void;
  onPickLauncherDirectory: () => void;
  onTestProvider: () => void;
}) {
  if (wizardStep === "profile") {
    return (
      <div className="form">
        <label>
          Profile name
          <input value={form.name} onChange={(event) => onChange({ ...form, name: event.target.value })} />
        </label>
        <label className="checkbox-label">
          <input checked={form.inheritDefaultConfig} onChange={(event) => onChange({ ...form, inheritDefaultConfig: event.target.checked })} type="checkbox" />
          Inherit my default Codex config
        </label>
        <p className="field-note">This name is used for the dashboard row and generated launcher app.</p>
        <p className="field-note">Inherited config keeps existing plugins, MCP servers, trusted projects, and feature flags when available.</p>
      </div>
    );
  }

  if (wizardStep === "provider") {
    return (
      <div className="form">
        <label>
          Provider type
          <select value={form.providerType} onChange={(event) => onChange({ ...form, providerType: event.target.value as typeof form.providerType })}>
            <option value="third_party_responses">Third-party Responses-compatible</option>
            <option value="official_openai">Official OpenAI API key</option>
          </select>
        </label>
        <label>
          Provider name
          <input value={form.providerName} onChange={(event) => onChange({ ...form, providerName: event.target.value })} />
        </label>
        {form.providerType === "third_party_responses" ? (
          <label>
            Base URL
            <input value={form.baseUrl} onChange={(event) => onChange({ ...form, baseUrl: event.target.value })} />
          </label>
        ) : null}
        <label>
          Model
          <input value={form.model} onChange={(event) => onChange({ ...form, model: event.target.value })} />
        </label>
        <label>
          API key
          <input type="password" value={form.apiKey} onChange={(event) => onChange({ ...form, apiKey: event.target.value })} />
        </label>
      </div>
    );
  }

  if (wizardStep === "test") {
    return (
      <div className="form">
        <p className="field-note">Test the provider before generation. You can continue even if the test fails, but the launcher may not work until the provider supports Responses API.</p>
        <button className="button secondary full-width" disabled={isTestingProvider || (form.providerType === "third_party_responses" && !form.baseUrl) || !form.apiKey || !form.model} onClick={onTestProvider} type="button">
          <TestTube2 size={16} />
          {isTestingProvider ? "Testing..." : "Test Provider"}
        </button>
        <ProviderTestBox providerTest={providerTest} />
      </div>
    );
  }

  if (wizardStep === "launcher") {
    return (
      <div className="form">
        <label>
          Launcher directory
          <div className="input-action-row">
            <input
              placeholder="Default: ~/Applications/Codex Profiles/"
              value={form.launcherDirectory}
              onChange={(event) => onChange({ ...form, launcherDirectory: event.target.value })}
            />
            <button className="icon-button" onClick={onPickLauncherDirectory} title="Choose folder" type="button">
              <FolderOpen size={15} />
            </button>
          </div>
        </label>
        <p className="field-note">Leave empty to use the default launcher directory, or pick a folder for the generated launcher app.</p>
      </div>
    );
  }

  return (
    <div className="review-box">
      <PathRow label="Profile" value={form.name || "Missing"} />
      <PathRow label="Provider" value={form.providerName || "Missing"} />
      <PathRow label="Provider type" value={form.providerType === "official_openai" ? "Official OpenAI" : "Third-party Responses"} />
      <PathRow label="Base URL" value={form.providerType === "third_party_responses" ? form.baseUrl || "Missing" : "https://api.openai.com/v1"} />
      <PathRow label="Model" value={form.model || "Missing"} />
      <PathRow label="Launcher directory" value={form.launcherDirectory || "~/Applications/Codex Profiles/"} />
      <PathRow label="Inherit config" value={form.inheritDefaultConfig ? "Yes" : "No"} />
      <PathRow label="Provider test" value={providerTest ? providerTest.summary : "Not tested"} />
    </div>
  );
}

function ProviderTestBox({ providerTest }: { providerTest: ProviderTestResult | null }) {
  if (!providerTest) {
    return <p className="empty-text">No provider test has been run yet.</p>;
  }

  return (
    <div className={`test-result ${providerTest.ok ? "passed" : "failed"}`}>
      <div className="test-result-title">
        {providerTest.ok ? <CheckCircle2 size={16} /> : <TriangleAlert size={16} />}
        <strong>{providerTest.summary}</strong>
      </div>
      <p>{providerTest.details}</p>
      <span>
        models: {providerTest.testedModelsEndpoint ? "tested" : "not tested"} / responses: {providerTest.testedResponsesEndpoint ? "tested" : "not tested"}
        {providerTest.httpStatus ? ` / HTTP ${providerTest.httpStatus}` : ""}
      </span>
    </div>
  );
}

function RuntimeBadge({ runtime }: { runtime?: ProfileRuntimeInfo }) {
  const status = runtime?.status ?? "unknown";
  const label = status === "running" ? `Running${runtime?.pid ? ` : ${runtime.pid}` : ""}` : status === "not_running" ? "Not running" : "Unknown";
  return <span className={`runtime-badge ${status}`}>{label}</span>;
}

function PathRow({ icon, label, onReveal, value }: { icon?: React.ReactNode; label: string; onReveal?: () => void; value: string }) {
  return (
    <div className="path-row">
      <span className="path-label">{icon}{label}</span>
      <div className="path-value">
        <code>{value}</code>
        {onReveal ? (
          <button className="icon-button" onClick={onReveal} title="Reveal in Finder" type="button">
            <FolderOpen size={15} />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function isCurrentStepValid(step: WizardStep, form: typeof DEFAULT_FORM): boolean {
  if (step === "profile") return Boolean(form.name.trim());
  if (step === "provider") return Boolean(
    form.providerName.trim()
    && (form.providerType === "official_openai" || form.baseUrl.trim())
    && form.model.trim()
    && form.apiKey.trim()
  );
  return true;
}

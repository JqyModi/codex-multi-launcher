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
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [wizardStep, setWizardStep] = useState<WizardStep>("profile");
  const [form, setForm] = useState(DEFAULT_FORM);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isTestingProvider, setIsTestingProvider] = useState(false);
  const [providerTest, setProviderTest] = useState<ProviderTestResult | null>(null);
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
      window.codexProfileManager.listProfiles()
    ]);
    const runtime = await window.codexProfileManager.getRuntimeStatus();
    setEnvironment(environmentReport);
    setProfiles(profileList);
    setRuntimeStatuses(runtime);
    setSelectedProfileId((current) => current ?? profileList[0]?.id ?? null);
  }

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    if (!selectedProfile) return;
    setEditForm({
      providerName: selectedProfile.provider.displayName,
      baseUrl: selectedProfile.provider.baseUrl ?? "",
      model: selectedProfile.provider.model,
      apiKey: ""
    });
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
          type: "third_party_responses",
          displayName: form.providerName,
          baseUrl: form.baseUrl,
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
        baseUrl: form.baseUrl,
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
            {selectedProfile ? (
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
                <button className="button secondary" disabled={isUpdatingProfile || !editForm.providerName || !editForm.baseUrl || !editForm.model} onClick={() => void saveSelectedProfile()} type="button">
                  {isUpdatingProfile ? "Saving..." : "Save Provider"}
                </button>
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
          Provider name
          <input value={form.providerName} onChange={(event) => onChange({ ...form, providerName: event.target.value })} />
        </label>
        <label>
          Base URL
          <input value={form.baseUrl} onChange={(event) => onChange({ ...form, baseUrl: event.target.value })} />
        </label>
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
        <button className="button secondary full-width" disabled={isTestingProvider || !form.baseUrl || !form.apiKey || !form.model} onClick={onTestProvider} type="button">
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
      <PathRow label="Base URL" value={form.baseUrl || "Missing"} />
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
  if (step === "provider") return Boolean(form.providerName.trim() && form.baseUrl.trim() && form.model.trim() && form.apiKey.trim());
  return true;
}

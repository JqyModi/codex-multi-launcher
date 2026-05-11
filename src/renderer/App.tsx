import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Folder,
  FolderOpen,
  Info,
  Languages,
  Play,
  Plus,
  RefreshCcw,
  Rocket,
  ShieldCheck,
  TestTube2,
  Trash2,
  TriangleAlert,
  X
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
type Language = "zh" | "en";

const WIZARD_STEPS: WizardStep[] = ["profile", "provider", "test", "launcher", "generate"];

const TEXT: Record<Language, Record<string, string>> = {
  zh: {
    appTitle: "Codex Profiles",
    appSubtitle: "本地多开配置管理",
    pageTitle: "Profile Manager",
    pageSubtitle: "创建隔离的 Codex 桌面窗口，并为每个窗口使用独立配置。",
    createProfile: "创建 Profile",
    showRemoved: "显示已移除",
    noProfiles: "暂无 Profile",
    refresh: "刷新",
    refreshing: "刷新中",
    copyDiagnostics: "复制诊断",
    copied: "已复制",
    profiles: "Profiles",
    running: "运行中",
    environment: "环境",
    environmentOk: "环境正常",
    checking: "检查中",
    selectedProfile: "选中的 Profile",
    revealFiles: "显示文件",
    restore: "恢复",
    remove: "移除",
    open: "打开",
    noProfilesTitle: "还没有 Profile",
    noProfilesBody: "创建一个拥有独立 API Key、Provider、配置和启动器的 Codex Profile。",
    createProfileTitle: "创建 Profile",
    createProfileSubtitle: "生成一个隔离的 Codex App 工作配置。",
    apiKeyEncrypted: "API Key 本地加密保存",
    environmentSubtitle: "生成 Profile 时依赖的本地环境检查。",
    profile: "Profile",
    provider: "Provider",
    test: "测试",
    launcher: "启动器",
    generate: "生成",
    back: "上一步",
    next: "下一步",
    generating: "生成中",
    profileName: "Profile 名称",
    inheritConfig: "继承默认 Codex 配置",
    inheritConfigDesc: "保留已有插件、MCP 服务、可信项目和功能开关。",
    profileNameNote: "该名称会用于侧边栏列表和生成的启动器 App。",
    providerType: "Provider 类型",
    thirdPartyResponses: "第三方 Responses 兼容接口",
    officialOpenAI: "官方 OpenAI API Key",
    providerName: "Provider 名称",
    baseUrl: "Base URL",
    model: "模型",
    apiKey: "API Key",
    testProvider: "测试 Provider",
    testing: "测试中",
    testNote: "生成前建议测试 Provider。即使测试失败也可以继续，但 Provider 需要支持 Responses API 后启动器才能正常工作。",
    launcherDirectory: "启动器目录",
    launcherPlaceholder: "默认：~/Applications/Codex Profiles/",
    launcherNote: "留空会使用默认启动器目录，也可以选择自定义文件夹。",
    providerTypeReview: "Provider 类型",
    inheritConfigReview: "继承配置",
    providerTestReview: "Provider 测试",
    missing: "缺失",
    yes: "是",
    no: "否",
    notTested: "未测试",
    noProviderTest: "还未运行 Provider 测试。",
    models: "models",
    responses: "responses",
    tested: "tested",
    notTestedShort: "not tested",
    recentBackups: "最近配置备份",
    noBackups: "暂无快照。每次配置变更前会自动创建快照。",
    editProvider: "编辑 Provider",
    newApiKey: "新的 API Key",
    keepCurrentKey: "留空则保留当前 Key",
    saveProvider: "保存 Provider",
    saving: "保存中",
    notChecked: "未检查",
    never: "从未启动",
    diagnosticsCopied: "诊断报告已复制，不包含 API Key。",
    loadingChecks: "正在加载检查项..."
  },
  en: {
    appTitle: "Codex Profiles",
    appSubtitle: "Local multi-instance manager",
    pageTitle: "Profile Manager",
    pageSubtitle: "Create isolated Codex desktop windows with separate provider configuration.",
    createProfile: "Create Profile",
    showRemoved: "Show removed",
    noProfiles: "No profiles yet.",
    refresh: "Refresh",
    refreshing: "Refreshing...",
    copyDiagnostics: "Copy Diagnostics",
    copied: "Copied",
    profiles: "Profiles",
    running: "Running",
    environment: "Environment",
    environmentOk: "Environment OK",
    checking: "Checking",
    selectedProfile: "Selected Profile",
    revealFiles: "Reveal Files",
    restore: "Restore",
    remove: "Remove",
    open: "Open",
    noProfilesTitle: "No profiles yet",
    noProfilesBody: "Create a Codex profile with its own API key, provider, config, and launcher.",
    createProfileTitle: "Create Profile",
    createProfileSubtitle: "Generate an isolated Codex app profile.",
    apiKeyEncrypted: "API key encrypted locally",
    environmentSubtitle: "Local prerequisites used by generated profiles.",
    profile: "Profile",
    provider: "Provider",
    test: "Test",
    launcher: "Launcher",
    generate: "Generate",
    back: "Back",
    next: "Next",
    generating: "Generating...",
    profileName: "Profile name",
    inheritConfig: "Inherit my default Codex config",
    inheritConfigDesc: "Keep existing plugins, MCP servers, trusted projects, and feature flags.",
    profileNameNote: "This name is used for the dashboard row and generated launcher app.",
    providerType: "Provider type",
    thirdPartyResponses: "Third-party Responses-compatible",
    officialOpenAI: "Official OpenAI API key",
    providerName: "Provider name",
    baseUrl: "Base URL",
    model: "Model",
    apiKey: "API key",
    testProvider: "Test Provider",
    testing: "Testing...",
    testNote: "Test the provider before generation. You can continue even if the test fails, but the launcher may not work until the provider supports Responses API.",
    launcherDirectory: "Launcher directory",
    launcherPlaceholder: "Default: ~/Applications/Codex Profiles/",
    launcherNote: "Leave empty to use the default launcher directory, or pick a folder for the generated launcher app.",
    providerTypeReview: "Provider type",
    inheritConfigReview: "Inherit config",
    providerTestReview: "Provider test",
    missing: "Missing",
    yes: "Yes",
    no: "No",
    notTested: "Not tested",
    noProviderTest: "No provider test has been run yet.",
    models: "models",
    responses: "responses",
    tested: "tested",
    notTestedShort: "not tested",
    recentBackups: "Recent Config Backups",
    noBackups: "No snapshots yet. A snapshot is created before config changes.",
    editProvider: "Edit Provider",
    newApiKey: "New API key",
    keepCurrentKey: "Leave empty to keep current key",
    saveProvider: "Save Provider",
    saving: "Saving...",
    notChecked: "Not checked",
    never: "Never",
    diagnosticsCopied: "Diagnostics report copied. API keys are not included.",
    loadingChecks: "Loading checks..."
  }
};

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCopyingDiagnostics, setIsCopyingDiagnostics] = useState(false);
  const [isCreateProfileOpen, setIsCreateProfileOpen] = useState(false);
  const [isEnvironmentOpen, setIsEnvironmentOpen] = useState(false);
  const [language, setLanguage] = useState<Language>("zh");
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

  const currentStepIndex = WIZARD_STEPS.findIndex((step) => step === wizardStep);
  const canGoBack = currentStepIndex > 0;
  const canGoNext = currentStepIndex < WIZARD_STEPS.length - 1 && isCurrentStepValid(wizardStep, form);
  const t = TEXT[language];
  const environmentSummary = useMemo(() => summarizeEnvironment(environment, t), [environment, t]);

  async function refresh() {
    setIsRefreshing(true);
    try {
      const [environmentReport, profileList] = await Promise.all([
        window.codexProfileManager.getEnvironmentReport(),
        window.codexProfileManager.listProfiles(showDeletedProfiles)
      ]);
      const runtime = await window.codexProfileManager.getRuntimeStatus();
      setEnvironment(environmentReport);
      setProfiles(profileList);
      setRuntimeStatuses(runtime);
      setSelectedProfileId((current) => current ?? profileList[0]?.id ?? null);
    } finally {
      setIsRefreshing(false);
    }
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
    setWizardStep(WIZARD_STEPS[currentStepIndex + 1]);
  }

  function previousStep() {
    if (!canGoBack) return;
    setWizardStep(WIZARD_STEPS[currentStepIndex - 1]);
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
      setIsCreateProfileOpen(false);
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

    setIsTestingEditProvider(true);
    setEditProviderTest(null);

    try {
      const result = await window.codexProfileManager.testProfileProvider({
        profileId: selectedProfile.id,
        baseUrl: editForm.baseUrl,
        apiKey: editForm.apiKey || undefined,
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
    setIsCopyingDiagnostics(true);
    try {
      const report = await window.codexProfileManager.getDiagnosticsReport();
      await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
      setMessage(t.diagnosticsCopied);
    } finally {
      setIsCopyingDiagnostics(false);
    }
  }

  async function restoreBackup(backup: ConfigBackupInfo) {
    const confirmed = window.confirm(`Restore this config backup from ${new Date(backup.createdAt).toLocaleString()}? Current config.toml will be backed up first.`);
    if (!confirmed) return;

    await window.codexProfileManager.restoreConfigBackup({
      profileId: backup.profileId,
      backupPath: backup.backupPath
    });
    setMessage(language === "zh" ? "配置备份已恢复。重启该 Codex Profile 后生效。" : "Config backup restored. Restart this Codex profile for the restored config to take effect.");
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
            <h1>{t.appTitle}</h1>
            <p>{t.appSubtitle}</p>
          </div>
        </div>

        <button className="sidebar-action" onClick={() => { setWizardStep("profile"); setIsCreateProfileOpen(true); }} type="button">
          <Plus size={16} />
          {t.createProfile}
        </button>
        <label className="sidebar-toggle">
          <input checked={showDeletedProfiles} onChange={(event) => setShowDeletedProfiles(event.target.checked)} type="checkbox" />
          {t.showRemoved}
        </label>

        <div className="profile-list">
          {profiles.length === 0 ? (
            <p className="empty-text">{t.noProfiles}</p>
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
            <h2>{t.pageTitle}</h2>
            <p>{t.pageSubtitle}</p>
          </div>
          <div className="language-switch" aria-label="Language">
            <Languages size={15} />
            <button onClick={() => setLanguage(language === "zh" ? "en" : "zh")} type="button">{language === "zh" ? "中文" : "EN"}</button>
          </div>
          <button className={`button environment-trigger ${environmentSummary.status}`} onClick={() => setIsEnvironmentOpen(true)} type="button">
            {environmentSummary.status === "pass" ? <ShieldCheck size={15} /> : <TriangleAlert size={15} />}
            {environmentSummary.label}
          </button>
          <button className="button secondary" disabled={isRefreshing} onClick={() => void refresh()} type="button">
            <RefreshCcw size={15} />
            {isRefreshing ? t.refreshing : t.refresh}
          </button>
          <button className="button secondary" disabled={isCopyingDiagnostics} onClick={() => void copyDiagnosticsReport()} type="button">
            <Copy size={15} />
            {isCopyingDiagnostics ? t.copied : t.copyDiagnostics}
          </button>
        </header>

        {message ? <div className="notice">{message}</div> : null}

        <section className="status-strip">
          <div>
            <span className="status-kicker">{t.profiles}</span>
            <strong>{profiles.filter((profile) => profile.status !== "deleted").length}</strong>
          </div>
          <div>
            <span className="status-kicker">{t.running}</span>
            <strong>{runtimeStatuses.filter((runtime) => runtime.status === "running").length}</strong>
          </div>
          <div>
            <span className="status-kicker">{t.environment}</span>
            <strong>{environmentSummary.shortLabel}</strong>
          </div>
        </section>

        <section className="panel detail-panel">
          <div className="panel-heading">
            <h3>{t.selectedProfile}</h3>
            {selectedProfile?.status === "deleted" ? (
              <div className="detail-actions">
                <button className="button secondary" onClick={() => void revealPath(selectedProfile.paths.codexHome)} type="button">
                  <FolderOpen size={15} />
                  {t.revealFiles}
                </button>
                <button className="button primary" onClick={() => void restoreSelectedProfile()} type="button">
                  {t.restore}
                </button>
              </div>
            ) : selectedProfile ? (
              <div className="detail-actions">
                <button className="button danger" onClick={() => void deleteSelectedProfile()} type="button">
                  <Trash2 size={15} />
                  {t.remove}
                </button>
                <button className="button primary" onClick={() => void openSelectedProfile()} type="button">
                  <Play size={15} />
                  {t.open}
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
              <PathRow label="Last launched" value={selectedProfile.launch.lastLaunchedAt ? new Date(selectedProfile.launch.lastLaunchedAt).toLocaleString() : t.never} />
              <PathRow label="Runtime" value={runtimeStatuses.find((item) => item.profileId === selectedProfile.id)?.detail ?? t.notChecked} />
              <div className="backup-list">
                <h4>{t.recentBackups}</h4>
                {configBackups.length === 0 ? (
                  <p className="empty-text">{t.noBackups}</p>
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
                        {t.restore}
                      </button>
                    </div>
                  ))
                )}
              </div>
              <div className="edit-box">
                <h4>{t.editProvider}</h4>
                <label>
                  {t.providerName}
                  <input value={editForm.providerName} onChange={(event) => setEditForm({ ...editForm, providerName: event.target.value })} />
                </label>
                <label>
                  {t.baseUrl}
                  <input value={editForm.baseUrl} onChange={(event) => setEditForm({ ...editForm, baseUrl: event.target.value })} />
                </label>
                <label>
                  {t.model}
                  <input value={editForm.model} onChange={(event) => setEditForm({ ...editForm, model: event.target.value })} />
                </label>
                <label>
                  {t.newApiKey}
                  <input placeholder={t.keepCurrentKey} type="password" value={editForm.apiKey} onChange={(event) => setEditForm({ ...editForm, apiKey: event.target.value })} />
                </label>
                <div className="button-row">
                  <button className="button secondary" disabled={isTestingEditProvider || !editForm.baseUrl || !editForm.model} onClick={() => void testEditProvider()} type="button">
                    <TestTube2 size={15} />
                    {isTestingEditProvider ? t.testing : t.test}
                  </button>
                  <button className="button secondary" disabled={isUpdatingProfile || !editForm.providerName || !editForm.baseUrl || !editForm.model} onClick={() => void saveSelectedProfile()} type="button">
                    {isUpdatingProfile ? t.saving : t.saveProvider}
                  </button>
                </div>
                <ProviderTestBox providerTest={editProviderTest} t={t} />
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-mark"><Rocket size={24} /></div>
              <h3>{t.noProfilesTitle}</h3>
              <p>{t.noProfilesBody}</p>
              <button className="button primary" onClick={() => { setWizardStep("profile"); setIsCreateProfileOpen(true); }} type="button">
                <Plus size={15} />
                {t.createProfile}
              </button>
            </div>
          )}
        </section>
      </section>
      {isCreateProfileOpen ? (
        <Modal title={t.createProfileTitle} subtitle={t.createProfileSubtitle} onClose={() => setIsCreateProfileOpen(false)}>
          <div className="modal-badge-row">
            <span className="badge success">{t.apiKeyEncrypted}</span>
          </div>
          <WizardNav current={wizardStep} t={t} />
          <WizardBody
            form={form}
            providerTest={providerTest}
            isTestingProvider={isTestingProvider}
            wizardStep={wizardStep}
            t={t}
            onChange={setForm}
            onPickLauncherDirectory={() => void pickLauncherDirectory()}
            onTestProvider={() => void testProvider()}
          />
          <div className="wizard-actions">
            <button className="button secondary" disabled={!canGoBack} onClick={previousStep} type="button">
              <ChevronLeft size={15} />
              {t.back}
            </button>
            {wizardStep === "generate" ? (
              <button className="button primary" disabled={isCreating || !isCurrentStepValid(wizardStep, form)} onClick={() => void createProfile()} type="button">
                <Plus size={16} />
                {isCreating ? t.generating : t.generate}
              </button>
            ) : (
              <button className="button primary" disabled={!canGoNext} onClick={nextStep} type="button">
                {t.next}
                <ChevronRight size={15} />
              </button>
            )}
          </div>
        </Modal>
      ) : null}
      {isEnvironmentOpen ? (
        <Modal title={t.environment} subtitle={t.environmentSubtitle} onClose={() => setIsEnvironmentOpen(false)}>
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
            )) ?? <p className="empty-text">{t.loadingChecks}</p>}
          </div>
        </Modal>
      ) : null}
    </main>
  );
}

function Modal({ children, onClose, subtitle, title }: { children: React.ReactNode; onClose: () => void; subtitle: string; title: string }) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section aria-modal="true" className="modal" role="dialog">
        <header className="modal-header">
          <div className="modal-title">
            <span className="modal-icon"><Info size={18} /></span>
            <div>
              <h3>{title}</h3>
              <p>{subtitle}</p>
            </div>
          </div>
          <button aria-label="Close" className="icon-button" onClick={onClose} type="button">
            <X size={16} />
          </button>
        </header>
        <div className="modal-body">{children}</div>
      </section>
    </div>
  );
}

function WizardNav({ current, t }: { current: WizardStep; t: Record<string, string> }) {
  return (
    <ol className="wizard-nav">
      {WIZARD_STEPS.map((step, index) => (
        <li className={step === current ? "current" : ""} key={step}>
          <span>{index + 1}</span>
          {t[step]}
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
  t,
  onChange,
  onPickLauncherDirectory,
  onTestProvider
}: {
  form: typeof DEFAULT_FORM;
  providerTest: ProviderTestResult | null;
  isTestingProvider: boolean;
  wizardStep: WizardStep;
  t: Record<string, string>;
  onChange: (nextForm: typeof DEFAULT_FORM) => void;
  onPickLauncherDirectory: () => void;
  onTestProvider: () => void;
}) {
  if (wizardStep === "profile") {
    return (
      <div className="form">
        <label>
          {t.profileName}
          <input value={form.name} onChange={(event) => onChange({ ...form, name: event.target.value })} />
        </label>
        <label className="toggle-card">
          <input checked={form.inheritDefaultConfig} onChange={(event) => onChange({ ...form, inheritDefaultConfig: event.target.checked })} type="checkbox" />
          <span className="toggle-copy">
            <strong>{t.inheritConfig}</strong>
            <small>{t.inheritConfigDesc}</small>
          </span>
          <span className="switch-track" aria-hidden="true"><span /></span>
        </label>
        <p className="field-note">{t.profileNameNote}</p>
      </div>
    );
  }

  if (wizardStep === "provider") {
    return (
      <div className="form">
        <label>
          {t.providerType}
          <select value={form.providerType} onChange={(event) => onChange({ ...form, providerType: event.target.value as typeof form.providerType })}>
            <option value="third_party_responses">{t.thirdPartyResponses}</option>
            <option value="official_openai">{t.officialOpenAI}</option>
          </select>
        </label>
        <label>
          {t.providerName}
          <input value={form.providerName} onChange={(event) => onChange({ ...form, providerName: event.target.value })} />
        </label>
        {form.providerType === "third_party_responses" ? (
          <label>
            {t.baseUrl}
            <input value={form.baseUrl} onChange={(event) => onChange({ ...form, baseUrl: event.target.value })} />
          </label>
        ) : null}
        <label>
          {t.model}
          <input value={form.model} onChange={(event) => onChange({ ...form, model: event.target.value })} />
        </label>
        <label>
          {t.apiKey}
          <input type="password" value={form.apiKey} onChange={(event) => onChange({ ...form, apiKey: event.target.value })} />
        </label>
      </div>
    );
  }

  if (wizardStep === "test") {
    return (
      <div className="form">
        <p className="field-note">{t.testNote}</p>
        <button className="button secondary full-width" disabled={isTestingProvider || (form.providerType === "third_party_responses" && !form.baseUrl) || !form.apiKey || !form.model} onClick={onTestProvider} type="button">
          <TestTube2 size={16} />
          {isTestingProvider ? t.testing : t.testProvider}
        </button>
        <ProviderTestBox providerTest={providerTest} t={t} />
      </div>
    );
  }

  if (wizardStep === "launcher") {
    return (
      <div className="form">
        <label>
          {t.launcherDirectory}
          <div className="input-action-row">
            <input
              placeholder={t.launcherPlaceholder}
              value={form.launcherDirectory}
              onChange={(event) => onChange({ ...form, launcherDirectory: event.target.value })}
            />
            <button className="icon-button" onClick={onPickLauncherDirectory} title="Choose folder" type="button">
              <FolderOpen size={15} />
            </button>
          </div>
        </label>
        <p className="field-note">{t.launcherNote}</p>
      </div>
    );
  }

  return (
    <div className="review-box">
      <PathRow label={t.profile} value={form.name || t.missing} />
      <PathRow label={t.provider} value={form.providerName || t.missing} />
      <PathRow label={t.providerTypeReview} value={form.providerType === "official_openai" ? t.officialOpenAI : t.thirdPartyResponses} />
      <PathRow label={t.baseUrl} value={form.providerType === "third_party_responses" ? form.baseUrl || t.missing : "https://api.openai.com/v1"} />
      <PathRow label={t.model} value={form.model || t.missing} />
      <PathRow label={t.launcherDirectory} value={form.launcherDirectory || "~/Applications/Codex Profiles/"} />
      <PathRow label={t.inheritConfigReview} value={form.inheritDefaultConfig ? t.yes : t.no} />
      <PathRow label={t.providerTestReview} value={providerTest ? providerTest.summary : t.notTested} />
    </div>
  );
}

function ProviderTestBox({ providerTest, t }: { providerTest: ProviderTestResult | null; t: Record<string, string> }) {
  if (!providerTest) {
    return <p className="empty-text">{t.noProviderTest}</p>;
  }

  return (
    <div className={`test-result ${providerTest.ok ? "passed" : "failed"}`}>
      <div className="test-result-title">
        {providerTest.ok ? <CheckCircle2 size={16} /> : <TriangleAlert size={16} />}
        <strong>{providerTest.summary}</strong>
      </div>
      <p>{providerTest.details}</p>
      <span>
        {t.models}: {providerTest.testedModelsEndpoint ? t.tested : t.notTestedShort} / {t.responses}: {providerTest.testedResponsesEndpoint ? t.tested : t.notTestedShort}
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

function summarizeEnvironment(environment: EnvironmentReport | null, t: Record<string, string>): { label: string; shortLabel: string; status: "pass" | "warn" | "fail" } {
  if (!environment) {
    return { label: t.checking, shortLabel: t.checking, status: "warn" };
  }

  const failed = environment.checks.filter((check) => check.status === "fail").length;
  const warned = environment.checks.filter((check) => check.status === "warn").length;

  if (failed > 0) {
    return { label: `${failed} issue${failed === 1 ? "" : "s"}`, shortLabel: `${failed} issue${failed === 1 ? "" : "s"}`, status: "fail" };
  }

  if (warned > 0) {
    return { label: `${warned} warning${warned === 1 ? "" : "s"}`, shortLabel: `${warned} warn`, status: "warn" };
  }

  return { label: t.environmentOk, shortLabel: "OK", status: "pass" };
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

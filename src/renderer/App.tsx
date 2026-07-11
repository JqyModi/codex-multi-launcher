import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Folder,
  FolderOpen,
  Github,
  Heart,
  Home,
  Info,
  Languages,
  MessageSquare,
  Megaphone,
  Play,
  Plus,
  RefreshCcw,
  Rocket,
  Settings,
  ShieldCheck,
  TestTube2,
  Trash2,
  TriangleAlert,
  User,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type {
  CreateProfileInput,
  EnvironmentReport,
  ConfigBackupInfo,
  AppInfo,
  AnnouncementItem,
  ManagedProfile,
  ProfileRuntimeInfo,
  ProviderModelsResult,
  ProviderTestResult,
  UpdateDownloadEvent,
  UpdateCheckResult
} from "../shared/types";

type WizardStep = "profile" | "provider" | "test" | "launcher" | "generate";
type Language = "zh" | "en";
type ActiveView = "dashboard" | "profile" | "settings";
type SettingsTab = "general" | "about";

const WIZARD_STEPS: WizardStep[] = ["profile", "provider", "test", "launcher", "generate"];
const DEFAULT_PROFILE_COLOR = "#34C759";
const PROFILE_COLOR_OPTIONS = ["#34C759", "#007AFF", "#5856D6", "#AF52DE", "#FF2D55", "#FF9500", "#FFCC00", "#30B0C7"];
const APP_LOGO_URL = new URL("../../assets/logo-light-1.png", import.meta.url).href;
const SKIPPED_UPDATE_VERSION_KEY = "codex-profile-manager.skipped-update-version";

const TEXT: Record<Language, Record<string, string>> = {
  zh: {
    appTitle: "Codex 多开助手",
    appSubtitle: "本地多开配置管理",
    home: "首页",
    pageTitle: "Profile Manager",
    pageSubtitle: "创建隔离的 Codex 桌面窗口，并为每个窗口使用独立配置。",
    dashboardTitle: "工作台",
    dashboardSubtitle: "公共公告、运行状态和 Profile 总览。",
    profileDetailTitle: "Profile 详情",
    pickProfile: "从左侧选择一个 Profile 查看详情。",
    recentProfiles: "Profile 总览",
    noRecentProfiles: "创建 Profile 后会在这里显示运行状态。",
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
    deletePermanently: "彻底删除",
    remove: "移除",
    open: "打开",
    about: "关于",
    settings: "设置",
    general: "通用",
    language: "语言",
    chinese: "中文",
    english: "English",
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
    profileColor: "图标颜色",
    profileColorNote: "用于生成启动器图标，并在侧边栏显示同色身份标识。",
    profileColorReview: "图标颜色",
    inheritConfig: "继承默认 Codex 配置",
    inheritConfigDesc: "保留已有插件、MCP 服务、可信项目和功能开关。",
    profileNameNote: "该名称会用于侧边栏列表和生成的启动器 App。",
    providerType: "Provider 类型",
    thirdPartyResponses: "第三方 Responses 兼容接口",
    officialOpenAI: "官方 OpenAI API Key",
    providerName: "Provider 名称",
    baseUrl: "Base URL",
    model: "模型",
    fetchModels: "获取模型",
    fetchingModels: "获取中",
    modelsFound: "可用模型",
    modelsUnavailable: "未获取到模型列表，可继续手动输入。",
    chooseModel: "选择",
    apiKey: "API Key",
    testProvider: "测试 Provider",
    testing: "测试中",
    testNote: "生成前建议测试 Provider。即使测试失败也可以继续，但 Provider 需要支持 Responses API 后启动器才能正常工作。",
    codexAppPath: "桌面 App 路径",
    codexAppPlaceholder: "自动探测 ChatGPT/Codex App",
    codexAppNote: "留空会自动查找新版 ChatGPT App，并兼容旧版 Codex App。",
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
    appearance: "外观标识",
    newApiKey: "新的 API Key",
    keepCurrentKey: "留空则保留当前 Key",
    saveProvider: "保存 Provider",
    saving: "保存中",
    notChecked: "未检查",
    never: "从未启动",
    diagnosticsCopied: "诊断报告已复制，不包含 API Key。",
    loadingChecks: "正在加载检查项...",
    activeProfiles: "可用 Profile",
    removedProfiles: "已移除 Profile",
    permanentDeleteConfirm: "彻底删除后无法恢复。将同时删除该 Profile 的 CODEX_HOME、user-data-dir、启动器和本地密钥。确定继续吗？",
    permanentDeleteDone: "Profile 及附属文件已彻底删除。",
    aboutTitle: "关于",
    settingsTitle: "应用设置",
    settingsSubtitle: "偏好设置、版本更新和项目支持。",
    aboutSubtitle: "版本、更新、反馈和项目支持。",
    currentVersion: "当前版本",
    latestVersion: "最新版本",
    checkForUpdates: "检查更新",
    checkingUpdates: "检查中",
    downloadUpdate: "下载更新",
    openChangelog: "更新记录",
    upToDate: "已是最新版本",
    updateAvailable: "发现新版本",
    updateCheckFailed: "检查更新失败",
    notCheckedYet: "尚未检查",
    author: "作者",
    repository: "开源仓库",
    sponsor: "赞助支持",
    feedback: "意见反馈",
    productPage: "产品主页",
    authorNote: "Modi",
    repositoryNote: "查看源码和 Release",
    sponsorNote: "支持项目继续开发",
    feedbackNote: "报告问题或提交建议",
    productPageNote: "查看介绍和使用手册",
    releaseNotes: "更新日志",
    noReleaseNotes: "暂无更新日志。",
    simulateUpdate: "模拟新版本",
    clearSimulation: "清除模拟",
    updateModalTitle: "发现新版本",
    updateModalCurrent: "当前版本",
    updateModalAvailable: "新版本已可用。",
    updateContent: "更新内容",
    cancel: "取消",
    skipVersion: "跳过此版本",
    updateNow: "立即更新",
    downloading: "下载中",
    updateReady: "更新已就绪，重启后生效。",
    updateInstalling: "正在重启并安装更新...",
    updateInstallVerified: "模拟安装调用已验证。开发模式不会重启应用，真实打包环境会退出并安装更新。",
    later: "稍后",
    restartNow: "立即重启",
    close: "关闭"
  },
  en: {
    appTitle: "Codex Launcher",
    appSubtitle: "Local multi-instance manager",
    home: "Home",
    pageTitle: "Profile Manager",
    pageSubtitle: "Create isolated Codex desktop windows with separate provider configuration.",
    dashboardTitle: "Dashboard",
    dashboardSubtitle: "Shared announcements, runtime status, and profile overview.",
    profileDetailTitle: "Profile Detail",
    pickProfile: "Choose a profile from the sidebar to view details.",
    recentProfiles: "Profile Overview",
    noRecentProfiles: "Profile runtime status will appear here after you create one.",
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
    deletePermanently: "Delete Permanently",
    remove: "Remove",
    open: "Open",
    about: "About",
    settings: "Settings",
    general: "General",
    language: "Language",
    chinese: "中文",
    english: "English",
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
    profileColor: "Icon color",
    profileColorNote: "Used for the generated launcher icon and matching sidebar identity mark.",
    profileColorReview: "Icon color",
    inheritConfig: "Inherit my default Codex config",
    inheritConfigDesc: "Keep existing plugins, MCP servers, trusted projects, and feature flags.",
    profileNameNote: "This name is used for the dashboard row and generated launcher app.",
    providerType: "Provider type",
    thirdPartyResponses: "Third-party Responses-compatible",
    officialOpenAI: "Official OpenAI API key",
    providerName: "Provider name",
    baseUrl: "Base URL",
    model: "Model",
    fetchModels: "Fetch Models",
    fetchingModels: "Fetching",
    modelsFound: "Available Models",
    modelsUnavailable: "No model list found. You can keep typing manually.",
    chooseModel: "Use",
    apiKey: "API key",
    testProvider: "Test Provider",
    testing: "Testing...",
    testNote: "Test the provider before generation. You can continue even if the test fails, but the launcher may not work until the provider supports Responses API.",
    codexAppPath: "Desktop app path",
    codexAppPlaceholder: "Auto-detect ChatGPT/Codex App",
    codexAppNote: "Leave empty to find the new ChatGPT app automatically, with legacy Codex app fallback.",
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
    appearance: "Appearance",
    newApiKey: "New API key",
    keepCurrentKey: "Leave empty to keep current key",
    saveProvider: "Save Provider",
    saving: "Saving...",
    notChecked: "Not checked",
    never: "Never",
    diagnosticsCopied: "Diagnostics report copied. API keys are not included.",
    loadingChecks: "Loading checks...",
    activeProfiles: "Active Profiles",
    removedProfiles: "Removed Profiles",
    permanentDeleteConfirm: "This cannot be undone. CODEX_HOME, user-data-dir, launcher, and local secret will be deleted. Continue?",
    permanentDeleteDone: "Profile and generated files were permanently deleted.",
    aboutTitle: "About",
    settingsTitle: "App Settings",
    settingsSubtitle: "Preferences, updates, and project support.",
    aboutSubtitle: "Version, updates, feedback, and project support.",
    currentVersion: "Current Version",
    latestVersion: "Latest Version",
    checkForUpdates: "Check Updates",
    checkingUpdates: "Checking",
    downloadUpdate: "Download Update",
    openChangelog: "Changelog",
    upToDate: "Up to date",
    updateAvailable: "Update available",
    updateCheckFailed: "Update check failed",
    notCheckedYet: "Not checked yet",
    author: "Author",
    repository: "Repository",
    sponsor: "Sponsor",
    feedback: "Feedback",
    productPage: "Product Page",
    authorNote: "Modi",
    repositoryNote: "Source and releases",
    sponsorNote: "Support ongoing development",
    feedbackNote: "Report bugs or request features",
    productPageNote: "Overview and user manual",
    releaseNotes: "Release Notes",
    noReleaseNotes: "No release notes yet.",
    simulateUpdate: "Simulate Update",
    clearSimulation: "Clear Simulation",
    updateModalTitle: "Update Available",
    updateModalCurrent: "Current version",
    updateModalAvailable: "A new version is available.",
    updateContent: "What's New",
    cancel: "Cancel",
    skipVersion: "Skip This Version",
    updateNow: "Update Now",
    downloading: "Downloading",
    updateReady: "Update is ready. Restart to apply it.",
    updateInstalling: "Restarting to install the update...",
    updateInstallVerified: "Simulated install call was verified. Dev mode will not restart; a packaged app will quit and install the update.",
    later: "Later",
    restartNow: "Restart Now",
    close: "Close"
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
  iconBackgroundColor: DEFAULT_PROFILE_COLOR,
  codexAppPath: "",
  launcherDirectory: ""
};

export function App() {
  const [activeView, setActiveView] = useState<ActiveView>("dashboard");
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("about");
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [announcement, setAnnouncement] = useState<AnnouncementItem | null>(null);
  const [updateCheck, setUpdateCheck] = useState<UpdateCheckResult | null>(null);
  const [updateEvent, setUpdateEvent] = useState<UpdateDownloadEvent | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
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
  const [providerModels, setProviderModels] = useState<ProviderModelsResult | null>(null);
  const [editProviderModels, setEditProviderModels] = useState<ProviderModelsResult | null>(null);
  const [isFetchingProviderModels, setIsFetchingProviderModels] = useState(false);
  const [isFetchingEditProviderModels, setIsFetchingEditProviderModels] = useState(false);
  const [editForm, setEditForm] = useState({
    providerName: "",
    baseUrl: "",
    model: "",
    apiKey: "",
    iconBackgroundColor: DEFAULT_PROFILE_COLOR
  });
  const [message, setMessage] = useState<string | null>(null);

  const runtimeByProfileId = useMemo(
    () => new Map(runtimeStatuses.map((runtime) => [runtime.profileId, runtime])),
    [runtimeStatuses]
  );
  const activeProfiles = useMemo(
    () => sortProfilesByRuntime(profiles.filter((profile) => profile.status !== "deleted"), runtimeByProfileId),
    [profiles, runtimeByProfileId]
  );
  const deletedProfiles = useMemo(() => profiles.filter((profile) => profile.status === "deleted"), [profiles]);
  const visibleProfiles = useMemo(() => [...activeProfiles, ...deletedProfiles], [activeProfiles, deletedProfiles]);
  const selectedProfile = useMemo(
    () => visibleProfiles.find((profile) => profile.id === selectedProfileId) ?? visibleProfiles[0] ?? null,
    [selectedProfileId, visibleProfiles]
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
      const runtimeMap = new Map(runtime.map((item) => [item.profileId, item]));
      const firstVisibleProfile = sortProfilesByRuntime(
        profileList.filter((profile) => profile.status !== "deleted"),
        runtimeMap
      )[0] ?? profileList[0] ?? null;
      setEnvironment(environmentReport);
      setProfiles(profileList);
      setRuntimeStatuses(runtime);
      setSelectedProfileId((current) => profileList.some((profile) => profile.id === current) ? current : firstVisibleProfile?.id ?? null);
    } finally {
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [showDeletedProfiles]);

  useEffect(() => {
    void window.codexProfileManager.getAppInfo().then(setAppInfo);
  }, []);

  useEffect(() => {
    void window.codexProfileManager.getAnnouncement()
      .then((result) => setAnnouncement(result.item))
      .catch(() => setAnnouncement(null));
  }, []);

  useEffect(() => window.codexProfileManager.onUpdateEvent((event) => {
    setUpdateEvent(event);
    if (event.state === "downloaded" || event.state === "error") {
      setIsUpdateModalOpen(true);
    }
  }), []);

  useEffect(() => {
    if (!selectedProfile) return;
    setEditForm({
      providerName: selectedProfile.provider.displayName,
      baseUrl: selectedProfile.provider.baseUrl ?? "",
      model: selectedProfile.provider.model,
      apiKey: "",
      iconBackgroundColor: getProfileColor(selectedProfile)
    });
    setEditProviderTest(null);
    setEditProviderModels(null);
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
        codexAppPath: form.codexAppPath || undefined,
        inheritDefaultConfig: form.inheritDefaultConfig,
        launcherDirectory: form.launcherDirectory || undefined,
        appearance: {
          iconBackgroundColor: sanitizeProfileColor(form.iconBackgroundColor)
        },
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
      setActiveView("profile");
      setMessage(`Created ${result.profile.name}. Launcher: ${result.launcherPath}`);
      setForm({ ...DEFAULT_FORM, name: `${form.name} 2` });
      setProviderTest(null);
      setProviderModels(null);
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

  async function fetchProviderModels() {
    setIsFetchingProviderModels(true);
    setProviderModels(null);
    setMessage(null);

    try {
      const result = await window.codexProfileManager.listProviderModels({
        baseUrl: form.providerType === "third_party_responses" ? form.baseUrl : "https://api.openai.com/v1",
        apiKey: form.apiKey
      });
      setProviderModels(result);
    } catch (error) {
      setProviderModels({
        status: "unknown_error",
        ok: false,
        summary: "Model list failed",
        details: error instanceof Error ? error.message : "Unknown model list error.",
        models: []
      });
    } finally {
      setIsFetchingProviderModels(false);
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

  async function fetchEditProviderModels() {
    if (!selectedProfile) return;

    setIsFetchingEditProviderModels(true);
    setEditProviderModels(null);

    try {
      const result = await window.codexProfileManager.listProfileProviderModels({
        profileId: selectedProfile.id,
        baseUrl: editForm.baseUrl,
        apiKey: editForm.apiKey || undefined
      });
      setEditProviderModels(result);
    } catch (error) {
      setEditProviderModels({
        status: "unknown_error",
        ok: false,
        summary: "Model list failed",
        details: error instanceof Error ? error.message : "Unknown model list error.",
        models: []
      });
    } finally {
      setIsFetchingEditProviderModels(false);
    }
  }

  async function openSelectedProfile() {
    if (!selectedProfile) return;
    try {
      const result = await window.codexProfileManager.openProfile(selectedProfile.id);
      setMessage(result.pid ? `Launched ${selectedProfile.name} with PID ${result.pid}.` : `Launched ${selectedProfile.name}.`);
      window.setTimeout(() => void refresh(), 1200);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to open profile.");
    }
  }

  async function deleteSelectedProfile() {
    if (!selectedProfile) return;
    const confirmed = window.confirm(`Remove "${selectedProfile.name}" from the dashboard? Profile files will be kept on disk.`);
    if (!confirmed) return;

    await window.codexProfileManager.deleteProfile(selectedProfile.id);
    setSelectedProfileId(null);
    setActiveView("dashboard");
    setMessage(`Removed ${selectedProfile.name} from the dashboard. Files were kept on disk.`);
    await refresh();
  }

  async function restoreSelectedProfile() {
    if (!selectedProfile) return;
    await window.codexProfileManager.restoreProfile(selectedProfile.id);
    setMessage(`Restored ${selectedProfile.name}.`);
    await refresh();
  }

  async function permanentlyDeleteSelectedProfile() {
    if (!selectedProfile) return;
    const confirmed = window.confirm(t.permanentDeleteConfirm);
    if (!confirmed) return;

    await window.codexProfileManager.permanentlyDeleteProfile(selectedProfile.id);
    setSelectedProfileId(null);
    setActiveView("dashboard");
    setMessage(t.permanentDeleteDone);
    await refresh();
  }

  async function saveSelectedProfile() {
    if (!selectedProfile) return;
    setIsUpdatingProfile(true);
    setMessage(null);

    try {
      const result = await window.codexProfileManager.updateProfile({
        profileId: selectedProfile.id,
        appearance: {
          iconBackgroundColor: sanitizeProfileColor(editForm.iconBackgroundColor)
        },
        provider: {
          displayName: editForm.providerName,
          baseUrl: editForm.baseUrl,
          model: editForm.model,
          apiKey: editForm.apiKey || undefined
        }
      });
      await refresh();
      setSelectedProfileId(result.profile.id);
      setEditForm((current) => ({ ...current, apiKey: "", iconBackgroundColor: getProfileColor(result.profile) }));
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

  async function pickCodexAppPath() {
    const selectedPath = await window.codexProfileManager.pickCodexAppPath();
    if (!selectedPath) return;
    setForm((current) => ({ ...current, codexAppPath: selectedPath }));
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

  async function checkForUpdates() {
    setIsCheckingUpdates(true);
    setMessage(null);
    try {
      const result = await window.codexProfileManager.checkForUpdates();
      setUpdateCheck(result);
      setUpdateEvent(null);
      if (result.status === "update_available" && !isSkippedUpdate(result.latestVersion)) {
        setIsUpdateModalOpen(true);
      }
    } finally {
      setIsCheckingUpdates(false);
    }
  }

  function simulateUpdateAvailable() {
    const currentVersion = appInfo?.version ?? "0.1.1";
    setUpdateCheck({
      status: "update_available",
      currentVersion,
      latestVersion: bumpPatchVersion(currentVersion),
      releaseName: "v" + bumpPatchVersion(currentVersion),
      releaseUrl: appInfo?.releasesUrl,
      publishedAt: new Date().toISOString(),
      changelog: language === "zh"
        ? "- 模拟发现一个新版本。\n- 立即更新按钮会进入应用内下载流程。"
        : "- Simulated a newer release.\n- The update button runs the in-app download flow."
    });
    setUpdateEvent(null);
    setIsUpdateModalOpen(true);
  }

  function clearUpdateSimulation() {
    setUpdateCheck(null);
    setUpdateEvent(null);
    setIsUpdateModalOpen(false);
  }

  async function downloadUpdate() {
    setUpdateEvent({ state: "downloading", progress: 0, version: updateCheck?.latestVersion ?? undefined });
    await window.codexProfileManager.downloadUpdate();
  }

  async function installUpdate() {
    await window.codexProfileManager.installUpdate();
  }

  function skipUpdateVersion() {
    if (updateCheck?.latestVersion) {
      window.localStorage.setItem(SKIPPED_UPDATE_VERSION_KEY, updateCheck.latestVersion);
    }
    setIsUpdateModalOpen(false);
  }

  async function openExternalUrl(targetUrl: string | undefined) {
    if (!targetUrl) return;
    await window.codexProfileManager.openExternalUrl(targetUrl);
  }

  async function dismissAnnouncement(id: string) {
    setAnnouncement(null);
    await window.codexProfileManager.dismissAnnouncement(id);
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
          <img alt="" className="brand-logo" src={APP_LOGO_URL} />
          <div>
            <h1>{t.appTitle}</h1>
            <p>{t.appSubtitle}</p>
          </div>
        </div>

        <button className={`sidebar-nav-button sidebar-home-button ${activeView === "dashboard" ? "selected" : ""}`} onClick={() => setActiveView("dashboard")} type="button">
          <Home size={15} />
          <span>{t.home}</span>
        </button>

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
            <>
              {activeProfiles.map((profile) => (
                <ProfileRow key={profile.id} profile={profile} runtime={runtimeByProfileId.get(profile.id)} selected={activeView === "profile" && selectedProfile?.id === profile.id} onSelect={() => { setActiveView("profile"); setSelectedProfileId(profile.id); }} />
              ))}
              {deletedProfiles.length > 0 ? (
                <div className="profile-group-separator">
                  <span>{t.removedProfiles}</span>
                </div>
              ) : null}
              {deletedProfiles.map((profile) => (
                <ProfileRow key={profile.id} profile={profile} runtime={runtimeByProfileId.get(profile.id)} selected={activeView === "profile" && selectedProfile?.id === profile.id} onSelect={() => { setActiveView("profile"); setSelectedProfileId(profile.id); }} />
              ))}
            </>
          )}
        </div>
        <div className="sidebar-footer">
          <button className={`sidebar-nav-button ${activeView === "settings" ? "selected" : ""}`} onClick={() => setActiveView("settings")} type="button">
            <Settings size={15} />
            <span>{t.settings}</span>
          </button>
        </div>
      </aside>

      <section className={`content ${activeView === "settings" ? "settings-content" : ""}`}>
        {activeView !== "settings" ? (
          <header className="toolbar">
            <div>
              <h2>{activeView === "dashboard" ? t.dashboardTitle : selectedProfile?.name ?? t.profileDetailTitle}</h2>
              <p>{activeView === "dashboard" ? t.dashboardSubtitle : t.pickProfile}</p>
            </div>
            {activeView === "dashboard" ? (
              <>
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
              </>
            ) : null}
          </header>
        ) : null}

        {message && activeView !== "settings" ? <div className="notice">{message}</div> : null}

        {activeView === "settings" ? (
          <SettingsPage
            appInfo={appInfo}
            isCheckingUpdates={isCheckingUpdates}
            language={language}
            settingsTab={settingsTab}
            t={t}
            updateCheck={updateCheck}
            onChangeLanguage={setLanguage}
            onCheckForUpdates={() => void checkForUpdates()}
            onClearUpdateSimulation={clearUpdateSimulation}
            onOpenExternal={(url) => void openExternalUrl(url)}
            onOpenUpdateDialog={() => setIsUpdateModalOpen(true)}
            onSetSettingsTab={setSettingsTab}
            onSimulateUpdate={simulateUpdateAvailable}
          />
        ) : activeView === "dashboard" ? (
          <>
            {announcement ? (
              <AnnouncementBanner
                item={announcement}
                onDismiss={() => void dismissAnnouncement(announcement.id)}
                onOpen={(url) => void openExternalUrl(url)}
              />
            ) : null}
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
            <section className="panel dashboard-panel">
              <div className="panel-heading">
                <div>
                  <h3>{t.recentProfiles}</h3>
                  <p>{t.pickProfile}</p>
                </div>
                <button className="button primary" onClick={() => { setWizardStep("profile"); setIsCreateProfileOpen(true); }} type="button">
                  <Plus size={15} />
                  {t.createProfile}
                </button>
              </div>
              {activeProfiles.length > 0 ? (
                <div className="dashboard-profile-grid">
                  {activeProfiles.slice(0, 6).map((profile) => (
                    <button className="dashboard-profile-card" key={profile.id} onClick={() => { setActiveView("profile"); setSelectedProfileId(profile.id); }} type="button">
                      <span className="dashboard-profile-title">
                        <ProfileColorMark color={getProfileColor(profile)} />
                        <strong>{profile.name}</strong>
                      </span>
                      <span>{profile.provider.displayName} / {profile.provider.model}</span>
                      <RuntimeBadge runtime={runtimeByProfileId.get(profile.id)} />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="empty-state compact-empty">
                  <div className="empty-mark"><Rocket size={22} /></div>
                  <h3>{t.noProfilesTitle}</h3>
                  <p>{t.noRecentProfiles}</p>
                </div>
              )}
            </section>
          </>
        ) : (
          <section className="panel detail-panel">
          <div className="panel-heading">
            <div className="detail-title">
              {selectedProfile ? <ProfileColorMark color={getProfileColor(selectedProfile)} size="large" /> : null}
              <h3>{t.selectedProfile}</h3>
            </div>
            {selectedProfile?.status === "deleted" ? (
              <div className="detail-actions">
                <button className="button secondary" onClick={() => void revealPath(selectedProfile.paths.codexHome)} type="button">
                  <FolderOpen size={15} />
                  {t.revealFiles}
                </button>
                <button className="button primary" onClick={() => void restoreSelectedProfile()} type="button">
                  {t.restore}
                </button>
                <button className="button danger" onClick={() => void permanentlyDeleteSelectedProfile()} type="button">
                  <Trash2 size={15} />
                  {t.deletePermanently}
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
                      <div className="backup-actions">
                        <button className="icon-button" onClick={() => void revealPath(backup.backupPath)} title="Reveal backup" type="button">
                          <FolderOpen size={15} />
                        </button>
                        <button className="button secondary compact" onClick={() => void restoreBackup(backup)} type="button">
                          {t.restore}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="edit-box">
                <h4>{t.appearance}</h4>
                <ColorPicker
                  label={t.profileColor}
                  note={t.profileColorNote}
                  value={editForm.iconBackgroundColor}
                  onChange={(iconBackgroundColor) => setEditForm({ ...editForm, iconBackgroundColor })}
                />
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
                  <div className="input-action-row">
                    <input value={editForm.model} onChange={(event) => setEditForm({ ...editForm, model: event.target.value })} />
                    <button className="button secondary compact" disabled={isFetchingEditProviderModels || !editForm.baseUrl} onClick={() => void fetchEditProviderModels()} type="button">
                      <RefreshCcw size={14} />
                      {isFetchingEditProviderModels ? t.fetchingModels : t.fetchModels}
                    </button>
                  </div>
                </label>
                <ModelPicker
                  modelsResult={editProviderModels}
                  selectedModel={editForm.model}
                  t={t}
                  onSelect={(model) => setEditForm((current) => ({ ...current, model }))}
                />
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
              <h3>{t.profileDetailTitle}</h3>
              <p>{t.pickProfile}</p>
              <button className="button primary" onClick={() => { setWizardStep("profile"); setIsCreateProfileOpen(true); }} type="button">
                <Plus size={15} />
                {t.createProfile}
              </button>
            </div>
          )}
        </section>
        )}
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
            isFetchingProviderModels={isFetchingProviderModels}
            providerModels={providerModels}
            wizardStep={wizardStep}
            t={t}
            onChange={(nextForm) => {
              setForm(nextForm);
              if (nextForm.baseUrl !== form.baseUrl || nextForm.apiKey !== form.apiKey || nextForm.providerType !== form.providerType) {
                setProviderModels(null);
              }
            }}
            onFetchModels={() => void fetchProviderModels()}
            onPickCodexAppPath={() => void pickCodexAppPath()}
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
      {isUpdateModalOpen && updateCheck?.status === "update_available" ? (
        <UpdateModal
          t={t}
          updateCheck={updateCheck}
          updateEvent={updateEvent}
          onCancel={() => setIsUpdateModalOpen(false)}
          onDownload={() => void downloadUpdate()}
          onInstall={() => void installUpdate()}
          onSkip={skipUpdateVersion}
        />
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

function UpdateModal({
  onCancel,
  onDownload,
  onInstall,
  onSkip,
  t,
  updateCheck,
  updateEvent
}: {
  onCancel: () => void;
  onDownload: () => void;
  onInstall: () => void;
  onSkip: () => void;
  t: Record<string, string>;
  updateCheck: UpdateCheckResult;
  updateEvent: UpdateDownloadEvent | null;
}) {
  const isDownloading = updateEvent?.state === "downloading";
  const isDownloaded = updateEvent?.state === "downloaded";
  const isInstalling = updateEvent?.state === "installing";
  const isInstalled = updateEvent?.state === "installed";
  const progress = Math.max(0, Math.min(updateEvent?.progress ?? 0, 100));
  const latestVersion = updateCheck.latestVersion ?? "-";

  return (
    <div className="modal-backdrop update-backdrop" role="presentation">
      <section aria-modal="true" className="update-modal" role="dialog">
        <header className="update-modal-header">
          <div className="modal-title">
            <span className="modal-icon"><Download size={18} /></span>
            <h3>{t.updateModalTitle}</h3>
          </div>
          <button aria-label="Close" className="icon-button" disabled={isDownloading || isInstalling} onClick={onCancel} type="button">
            <X size={16} />
          </button>
        </header>
        <div className="update-modal-body">
          <strong className="update-version">v{latestVersion}</strong>
          <p>{t.updateModalCurrent} v{updateCheck.currentVersion}，{t.updateModalAvailable}</p>
          {isDownloading ? (
            <div className="download-progress">
              <div><span style={{ width: `${progress}%` }} /></div>
              <p>{t.downloading}... {progress}%</p>
            </div>
          ) : null}
          {isDownloaded ? <div className="update-ready"><CheckCircle2 size={16} />{t.updateReady}</div> : null}
          {isInstalling ? <div className="update-ready"><RefreshCcw size={16} />{t.updateInstalling}</div> : null}
          {isInstalled ? <div className="update-ready"><CheckCircle2 size={16} />{t.updateInstallVerified}</div> : null}
          <div className="update-notes-heading">
            <strong>{t.updateContent}</strong>
          </div>
          <pre>{updateCheck.changelog?.trim() || t.noReleaseNotes}</pre>
        </div>
        <footer className="update-modal-footer">
          {isInstalled ? (
            <>
              <button className="button secondary" onClick={onCancel} type="button">{t.later}</button>
              <button className="button primary" onClick={onCancel} type="button">
                <CheckCircle2 size={15} />
                {t.close}
              </button>
            </>
          ) : isInstalling ? (
            <>
              <button className="button secondary" disabled type="button">{t.later}</button>
              <button className="button primary" disabled type="button">
                <RefreshCcw size={15} />
                {t.updateInstalling}
              </button>
            </>
          ) : isDownloaded ? (
            <>
              <button className="button secondary" onClick={onCancel} type="button">{t.later}</button>
              <button className="button secondary" onClick={onSkip} type="button">{t.skipVersion}</button>
              <button className="button primary" onClick={onInstall} type="button">
                <RefreshCcw size={15} />
                {t.restartNow}
              </button>
            </>
          ) : isDownloading ? (
            <>
              <button className="button secondary" onClick={onCancel} type="button">{t.later}</button>
              <button className="button primary" disabled type="button">
                <RefreshCcw size={15} />
                {t.downloading}...
              </button>
            </>
          ) : (
            <>
              <button className="button secondary" onClick={onCancel} type="button">{t.cancel}</button>
              <button className="button secondary" onClick={onSkip} type="button">{t.skipVersion}</button>
              <button className="button primary" onClick={onDownload} type="button">
                <Download size={15} />
                {t.updateNow}
              </button>
            </>
          )}
        </footer>
      </section>
    </div>
  );
}

function AnnouncementBanner({
  item,
  onDismiss,
  onOpen
}: {
  item: AnnouncementItem;
  onDismiss: () => void;
  onOpen: (url: string | undefined) => void;
}) {
  return (
    <section className={`announcement-banner ${item.type}`}>
      <div className="announcement-main">
        <span className="announcement-label">
          <Megaphone size={13} />
          {item.label || item.type}
        </span>
        <div className="announcement-copy">
          <strong>{item.title}</strong>
          {item.description ? <p>{item.description}</p> : null}
        </div>
      </div>
      <div className="announcement-actions">
        {item.ctaUrl ? (
          <button className="button secondary compact" onClick={() => onOpen(item.ctaUrl)} type="button">
            {item.ctaText || "查看"}
          </button>
        ) : null}
        {item.dismissible !== false ? (
          <button aria-label="Close" className="icon-button compact" onClick={onDismiss} type="button">
            <X size={14} />
          </button>
        ) : null}
      </div>
    </section>
  );
}

function SettingsPage({
  appInfo,
  isCheckingUpdates,
  language,
  onChangeLanguage,
  onCheckForUpdates,
  onClearUpdateSimulation,
  onOpenExternal,
  onOpenUpdateDialog,
  onSetSettingsTab,
  onSimulateUpdate,
  settingsTab,
  t,
  updateCheck
}: {
  appInfo: AppInfo | null;
  isCheckingUpdates: boolean;
  language: Language;
  onChangeLanguage: (language: Language) => void;
  onCheckForUpdates: () => void;
  onClearUpdateSimulation: () => void;
  onOpenExternal: (url: string | undefined) => void;
  onOpenUpdateDialog: () => void;
  onSetSettingsTab: (tab: SettingsTab) => void;
  onSimulateUpdate: () => void;
  settingsTab: SettingsTab;
  t: Record<string, string>;
  updateCheck: UpdateCheckResult | null;
}) {
  return (
    <div className="settings-page">
      <nav className="settings-tabs" aria-label="Settings">
        <button className={settingsTab === "general" ? "selected" : ""} onClick={() => onSetSettingsTab("general")} type="button">
          {t.general}
        </button>
        <button className={settingsTab === "about" ? "selected" : ""} onClick={() => onSetSettingsTab("about")} type="button">
          {t.about}
        </button>
      </nav>
      {settingsTab === "general" ? (
        <section className="panel settings-panel">
          <div className="panel-heading">
            <div>
              <h3>{t.general}</h3>
              <p>{t.settingsSubtitle}</p>
            </div>
          </div>
          <div className="settings-row">
            <div>
              <strong>{t.language}</strong>
              <p>{language === "zh" ? t.chinese : t.english}</p>
            </div>
            <div className="segmented-control">
              <button className={language === "zh" ? "selected" : ""} onClick={() => onChangeLanguage("zh")} type="button">
                <Languages size={14} />
                {t.chinese}
              </button>
              <button className={language === "en" ? "selected" : ""} onClick={() => onChangeLanguage("en")} type="button">
                {t.english}
              </button>
            </div>
          </div>
        </section>
      ) : (
        <AboutPage
          appInfo={appInfo}
          isCheckingUpdates={isCheckingUpdates}
          t={t}
          updateCheck={updateCheck}
          onCheckForUpdates={onCheckForUpdates}
          onClearUpdateSimulation={onClearUpdateSimulation}
          onOpenExternal={onOpenExternal}
          onOpenUpdateDialog={onOpenUpdateDialog}
          onSimulateUpdate={onSimulateUpdate}
        />
      )}
    </div>
  );
}

function AboutPage({
  appInfo,
  isCheckingUpdates,
  onCheckForUpdates,
  onClearUpdateSimulation,
  onOpenExternal,
  onOpenUpdateDialog,
  onSimulateUpdate,
  t,
  updateCheck
}: {
  appInfo: AppInfo | null;
  isCheckingUpdates: boolean;
  onCheckForUpdates: () => void;
  onClearUpdateSimulation: () => void;
  onOpenExternal: (url: string | undefined) => void;
  onOpenUpdateDialog: () => void;
  onSimulateUpdate: () => void;
  t: Record<string, string>;
  updateCheck: UpdateCheckResult | null;
}) {
  const currentVersion = appInfo?.version ?? "-";
  const releaseUrl = updateCheck?.releaseUrl ?? appInfo?.releasesUrl;
  const updateStatus = updateCheckStatusLabel(updateCheck, t);
  const changelog = updateCheck?.status === "error" ? t.noReleaseNotes : updateCheck?.changelog?.trim() || t.noReleaseNotes;

  return (
    <div className="about-page">
      <section className="about-hero">
        <img alt="" className="about-app-icon" src={APP_LOGO_URL} />
        <h3>{appInfo?.name ?? t.appTitle}</h3>
        <div className="about-meta-row">
          <span className="about-version-pill">v{currentVersion}</span>
          <span className={`about-status-pill ${updateCheck?.status ?? "unknown"}`}>{updateStatus}</span>
        </div>
        <div className="about-actions">
          <button className="button secondary compact" disabled={isCheckingUpdates} onClick={onCheckForUpdates} type="button">
            <RefreshCcw size={14} />
            {isCheckingUpdates ? t.checkingUpdates : t.checkForUpdates}
          </button>
          <button className="button secondary compact" disabled={!releaseUrl} onClick={() => onOpenExternal(releaseUrl)} type="button">
            <FileText size={14} />
            {t.openChangelog}
          </button>
          <button className="button secondary compact" onClick={() => onOpenExternal(appInfo?.productPageUrl)} type="button">
            <ExternalLink size={14} />
            {t.productPage}
          </button>
          {updateCheck?.status === "update_available" ? (
            <button className="button primary compact" onClick={onOpenUpdateDialog} type="button">
              <Download size={14} />
              {t.downloadUpdate}
            </button>
          ) : null}
          {import.meta.env.DEV ? (
            <>
              <button className="button secondary compact" onClick={onSimulateUpdate} type="button">
                {t.simulateUpdate}
              </button>
              <button className="button secondary compact" onClick={onClearUpdateSimulation} type="button">
                {t.clearSimulation}
              </button>
            </>
          ) : null}
        </div>
        <p>{t.aboutSubtitle}</p>
      </section>

      <section className="about-link-grid">
        <AboutCard icon={<User size={22} />} label={t.author} note={appInfo?.author ?? t.authorNote} onClick={() => onOpenExternal(appInfo?.authorUrl)} />
        <AboutCard icon={<Github size={22} />} label={t.repository} note={t.repositoryNote} onClick={() => onOpenExternal(appInfo?.repositoryUrl)} />
        <AboutCard icon={<Heart size={22} />} label={t.sponsor} note={t.sponsorNote} tone="warm" onClick={() => onOpenExternal(appInfo?.sponsorUrl)} />
        <AboutCard icon={<MessageSquare size={22} />} label={t.feedback} note={t.feedbackNote} onClick={() => onOpenExternal(appInfo?.issuesUrl)} />
      </section>

      <section className="panel about-release-panel">
        <div className="panel-heading">
          <div>
            <h3>{t.releaseNotes}</h3>
            {updateCheck?.publishedAt ? <p>{new Date(updateCheck.publishedAt).toLocaleDateString()}</p> : null}
          </div>
          {updateCheck?.releaseName ? <span className="badge">{updateCheck.releaseName}</span> : null}
        </div>
        <pre>{changelog}</pre>
        {updateCheck?.status === "error" ? <p className="update-error">{t.updateCheckFailed}</p> : null}
      </section>
    </div>
  );
}

function AboutCard({ icon, label, note, onClick, tone }: { icon: React.ReactNode; label: string; note: string; onClick: () => void; tone?: "warm" }) {
  return (
    <button className={`about-card ${tone ?? ""}`} onClick={onClick} type="button">
      <span>{icon}</span>
      <strong>{label}</strong>
      <p>{note}</p>
    </button>
  );
}

function updateCheckStatusLabel(updateCheck: UpdateCheckResult | null, t: Record<string, string>): string {
  if (!updateCheck) return t.notCheckedYet;
  if (updateCheck.status === "update_available") return t.updateAvailable;
  if (updateCheck.status === "up_to_date") return t.upToDate;
  return t.updateCheckFailed;
}

function isSkippedUpdate(version: string | null): boolean {
  if (!version) return false;
  return window.localStorage.getItem(SKIPPED_UPDATE_VERSION_KEY) === version;
}

function bumpPatchVersion(version: string): string {
  const parts = version.split(".").map((part) => Number.parseInt(part, 10) || 0);
  return `${parts[0] ?? 0}.${parts[1] ?? 0}.${(parts[2] ?? 0) + 1}`;
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
  isFetchingProviderModels,
  providerModels,
  wizardStep,
  t,
  onChange,
  onFetchModels,
  onPickCodexAppPath,
  onPickLauncherDirectory,
  onTestProvider
}: {
  form: typeof DEFAULT_FORM;
  providerTest: ProviderTestResult | null;
  isTestingProvider: boolean;
  isFetchingProviderModels: boolean;
  providerModels: ProviderModelsResult | null;
  wizardStep: WizardStep;
  t: Record<string, string>;
  onChange: (nextForm: typeof DEFAULT_FORM) => void;
  onFetchModels: () => void;
  onPickCodexAppPath: () => void;
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
        <ColorPicker
          label={t.profileColor}
          note={t.profileColorNote}
          value={form.iconBackgroundColor}
          onChange={(iconBackgroundColor) => onChange({ ...form, iconBackgroundColor })}
        />
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
          <div className="input-action-row">
            <input value={form.model} onChange={(event) => onChange({ ...form, model: event.target.value })} />
            <button className="button secondary compact" disabled={isFetchingProviderModels || (form.providerType === "third_party_responses" && !form.baseUrl) || !form.apiKey} onClick={onFetchModels} type="button">
              <RefreshCcw size={14} />
              {isFetchingProviderModels ? t.fetchingModels : t.fetchModels}
            </button>
          </div>
        </label>
        <ModelPicker
          modelsResult={providerModels}
          selectedModel={form.model}
          t={t}
          onSelect={(model) => onChange({ ...form, model })}
        />
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
          {t.codexAppPath}
          <div className="input-action-row">
            <input
              placeholder={t.codexAppPlaceholder}
              value={form.codexAppPath}
              onChange={(event) => onChange({ ...form, codexAppPath: event.target.value })}
            />
            <button className="icon-button" onClick={onPickCodexAppPath} title="Choose app" type="button">
              <FolderOpen size={15} />
            </button>
          </div>
        </label>
        <p className="field-note">{t.codexAppNote}</p>
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
      <ColorReviewRow color={sanitizeProfileColor(form.iconBackgroundColor)} label={t.profileColorReview} />
      <PathRow label={t.provider} value={form.providerName || t.missing} />
      <PathRow label={t.providerTypeReview} value={form.providerType === "official_openai" ? t.officialOpenAI : t.thirdPartyResponses} />
      <PathRow label={t.baseUrl} value={form.providerType === "third_party_responses" ? form.baseUrl || t.missing : "https://api.openai.com/v1"} />
      <PathRow label={t.model} value={form.model || t.missing} />
      <PathRow label={t.codexAppPath} value={form.codexAppPath || t.codexAppPlaceholder} />
      <PathRow label={t.launcherDirectory} value={form.launcherDirectory || "~/Applications/Codex Profiles/"} />
      <PathRow label={t.inheritConfigReview} value={form.inheritDefaultConfig ? t.yes : t.no} />
      <PathRow label={t.providerTestReview} value={providerTest ? providerTest.summary : t.notTested} />
    </div>
  );
}

function ModelPicker({ modelsResult, onSelect, selectedModel, t }: { modelsResult: ProviderModelsResult | null; onSelect: (model: string) => void; selectedModel: string; t: Record<string, string> }) {
  if (!modelsResult) {
    return null;
  }

  if (!modelsResult.ok || modelsResult.models.length === 0) {
    return (
      <div className="model-discovery muted">
        <div>
          <strong>{modelsResult.summary}</strong>
          <p>{modelsResult.details || t.modelsUnavailable}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="model-discovery">
      <div className="model-discovery-heading">
        <strong>{t.modelsFound}</strong>
        <span>{modelsResult.models.length}</span>
      </div>
      <div className="model-options">
        {modelsResult.models.slice(0, 12).map((model) => (
          <button className={`model-option ${selectedModel === model.id ? "selected" : ""}`} key={model.id} onClick={() => onSelect(model.id)} type="button">
            <span>{model.displayName ?? model.id}</span>
            {model.displayName ? <code>{model.id}</code> : null}
            <small>{t.chooseModel}</small>
          </button>
        ))}
      </div>
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

function ProfileColorMark({ color, size = "regular" }: { color: string; size?: "regular" | "large" }) {
  return (
    <span
      aria-hidden="true"
      className={`profile-color-mark ${size}`}
      style={{ "--profile-color": color } as React.CSSProperties}
    />
  );
}

function ProfileRow({ onSelect, profile, runtime, selected }: { onSelect: () => void; profile: ManagedProfile; runtime?: ProfileRuntimeInfo; selected: boolean }) {
  const profileColor = getProfileColor(profile);

  return (
    <button
      className={`profile-row ${selected ? "selected" : ""}`}
      onClick={onSelect}
      type="button"
    >
      <span className="profile-row-heading">
        <ProfileColorMark color={profileColor} />
        <span className="profile-name">{profile.name}</span>
      </span>
      <span className="profile-meta">{profile.provider.displayName} / {profile.provider.model}</span>
      {profile.status === "deleted" ? <span className="runtime-badge deleted">Removed</span> : null}
      <RuntimeBadge runtime={runtime} />
    </button>
  );
}

function ColorPicker({ label, note, onChange, value }: { label: string; note: string; onChange: (value: string) => void; value: string }) {
  const normalizedValue = sanitizeProfileColor(value);

  return (
    <div className="color-field">
      <div className="color-field-heading">
        <span>{label}</span>
        <code>{normalizedValue}</code>
      </div>
      <div className="color-control">
        <div className="profile-icon-preview" style={{ "--profile-color": normalizedValue } as React.CSSProperties}>
          <Rocket size={18} />
        </div>
        <div className="color-options" role="list">
          {PROFILE_COLOR_OPTIONS.map((color) => (
            <button
              aria-label={color}
              aria-pressed={normalizedValue === color}
              className={`color-swatch ${normalizedValue === color ? "selected" : ""}`}
              key={color}
              onClick={() => onChange(color)}
              style={{ "--profile-color": color } as React.CSSProperties}
              type="button"
            />
          ))}
        </div>
        <input
          aria-label={label}
          className="color-input"
          maxLength={7}
          value={value}
          onBlur={() => onChange(normalizedValue)}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
      <p className="field-note">{note}</p>
    </div>
  );
}

function ColorReviewRow({ color, label }: { color: string; label: string }) {
  return (
    <div className="path-row">
      <span className="path-label">{label}</span>
      <div className="color-review">
        <ProfileColorMark color={color} />
        <code>{color}</code>
      </div>
    </div>
  );
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

function sortProfilesByRuntime(profiles: ManagedProfile[], runtimeByProfileId: Map<string, ProfileRuntimeInfo>): ManagedProfile[] {
  return profiles
    .map((profile, index) => ({ profile, index }))
    .sort((left, right) => {
      const leftRunning = runtimeByProfileId.get(left.profile.id)?.status === "running";
      const rightRunning = runtimeByProfileId.get(right.profile.id)?.status === "running";

      if (leftRunning === rightRunning) {
        return left.index - right.index;
      }

      return leftRunning ? -1 : 1;
    })
    .map((item) => item.profile);
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

function getProfileColor(profile: ManagedProfile): string {
  return sanitizeProfileColor(profile.appearance?.iconBackgroundColor);
}

function sanitizeProfileColor(value: string | undefined): string {
  const trimmed = value?.trim() ?? "";
  const shortHexMatch = trimmed.match(/^#?([0-9a-fA-F]{3})$/);
  if (shortHexMatch) {
    return `#${shortHexMatch[1].split("").map((character) => `${character}${character}`).join("").toUpperCase()}`;
  }

  const longHexMatch = trimmed.match(/^#?([0-9a-fA-F]{6})$/);
  if (longHexMatch) {
    return `#${longHexMatch[1].toUpperCase()}`;
  }

  return DEFAULT_PROFILE_COLOR;
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

import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
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
  TestTube2,
  Trash2,
  TriangleAlert,
  User,
  X
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
    profilesSection: "配置列表",
    pageTitle: "配置管理",
    pageSubtitle: "创建隔离的 Codex 桌面窗口，并为每个窗口使用独立设置。",
    dashboardTitle: "工作台",
    dashboardSubtitle: "公共公告与运行概览。",
    overviewTitle: "概览",
    profileDetailTitle: "配置详情",
    profileDetailSubtitle: "独立设置、启动器和模型服务。",
    pickProfile: "从左侧选择一个配置查看详情。",
    dashboardHint: "运行中的窗口会集中显示在这里，配置详情从左侧进入。",
    runningProfiles: "正在运行",
    noRunningProfiles: "暂无运行中的窗口。",
    environmentIssues: "环境提示",
    createProfile: "创建配置",
    showRemoved: "显示已移除",
    noProfiles: "暂无配置",
    refresh: "刷新",
    refreshing: "刷新中",
    copyDiagnostics: "复制诊断",
    copied: "已复制",
    profiles: "配置",
    running: "运行中",
    runtimeRunning: "运行中",
    runtimeNotRunning: "未运行",
    runtimeUnknown: "未知",
    environment: "环境",
    environmentOk: "环境正常",
    checking: "检查中",
    selectedProfile: "当前配置",
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
    noProfilesTitle: "还没有配置",
    noProfilesBody: "创建一套独立保存密钥、模型服务和启动器的 Codex 配置。",
    createProfileTitle: "创建配置",
    createProfileSubtitle: "生成一套独立的 Codex App 工作设置。",
    apiKeyEncrypted: "密钥会加密保存在本机",
    environmentSubtitle: "创建配置前会检查本机环境。",
    profile: "配置",
    provider: "模型服务",
    test: "测试",
    launcher: "启动器",
    generate: "生成",
    back: "上一步",
    next: "下一步",
    generating: "生成中",
    profileName: "配置名称",
    profileColor: "图标颜色",
    profileColorNote: "用于生成启动器图标，并在左侧列表显示同色标记。",
    profileColorReview: "图标颜色",
    inheritConfig: "沿用当前 Codex 设置",
    inheritConfigDesc: "保留已有插件、服务、可信项目和功能开关。",
    syncHistory: "同步已有对话记录",
    syncHistoryDesc: "从当前 App 或已创建配置里复制历史对话，新配置后续仍独立使用。",
    syncHistorySource: "从哪里同步",
    syncHistoryDefaultSource: "当前 Codex / ChatGPT",
    syncHistoryDefaultSourceDesc: "同步源 App 里已有的项目和临时任务对话。",
    syncHistoryProfileSourceDesc: "同步这个配置里已有的历史对话。",
    syncHistoryNoProfiles: "还没有其它配置可选。",
    syncHistorySelectedCount: "已选择 {count} 个来源",
    syncHistoryScope: "同步哪些对话",
    syncHistoryProjects: "仅项目对话",
    syncHistoryTasks: "仅临时任务",
    syncHistoryAll: "全部对话",
    syncHistoryReview: "对话记录",
    syncHistoryOff: "不同步",
    syncHistorySourcesReview: "同步来源",
    profileNameNote: "这个名称会显示在左侧列表和生成的启动器 App 上。",
    providerType: "服务接口类型",
    thirdPartyResponses: "第三方兼容接口",
    officialOpenAI: "官方 OpenAI 密钥",
    providerName: "服务名称",
    baseUrl: "接口地址",
    model: "使用模型",
    fetchModels: "获取模型列表",
    fetchingModels: "获取中",
    modelsFound: "可选模型",
    modelsUnavailable: "未获取到模型列表，可继续手动输入。",
    chooseModel: "选择",
    apiKey: "密钥（API Key）",
    testProvider: "测试连接",
    testing: "测试中",
    testNote: "生成前建议先测试连接。即使测试失败也可以继续，但接口需要兼容 Codex 使用的对话接口后才能正常使用。",
    codexAppPath: "Codex/ChatGPT App 位置",
    codexAppPlaceholder: "自动探测 ChatGPT/Codex App",
    codexAppNote: "留空会自动查找新版 ChatGPT App，并兼容旧版 Codex App。",
    launcherDirectory: "启动器目录",
    launcherPlaceholder: "默认：~/Applications/Codex Profiles/",
    launcherNote: "留空会使用默认保存位置，也可以选择自定义文件夹。",
    providerTypeReview: "服务接口类型",
    inheritConfigReview: "沿用设置",
    providerTestReview: "连接测试",
    missing: "缺失",
    yes: "是",
    no: "否",
    notTested: "未测试",
    noProviderTest: "还没有测试连接。",
    models: "模型列表",
    responses: "对话接口",
    tested: "已测试",
    notTestedShort: "未测试",
    recentBackups: "最近备份",
    noBackups: "暂无备份。每次修改配置前会自动备份。",
    editProvider: "编辑模型服务",
    appearance: "外观标识",
    advancedInfo: "高级信息",
    advancedInfoDesc: "文件位置、运行状态和最近备份。",
    newApiKey: "新的密钥",
    keepCurrentKey: "留空则保留当前密钥",
    saveProvider: "保存服务设置",
    saving: "保存中",
    notChecked: "未检查",
    never: "从未启动",
    diagnosticsCopied: "诊断信息已复制，不包含密钥。",
    loadingChecks: "正在加载检查项...",
    activeProfiles: "可用配置",
    removedProfiles: "已移除配置",
    permanentDeleteConfirm: "彻底删除后无法恢复。将同时删除该配置的 CODEX_HOME、user-data-dir、启动器和本地密钥。确定继续吗？",
    permanentDeleteDone: "配置及附属文件已彻底删除。",
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
    updatePromptTitle: "发现新版本",
    updatePromptBody: "v{version} 已可用，可在应用内下载并重启安装。",
    viewUpdate: "查看更新",
    updateCheckFailed: "检查更新失败",
    notCheckedYet: "尚未检查",
    author: "作者",
    repository: "项目源码",
    sponsor: "赞助支持",
    feedback: "意见反馈",
    productPage: "产品主页",
    authorNote: "Modi",
    repositoryNote: "查看源码和发布版本",
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
    profilesSection: "Profiles",
    pageTitle: "Profile Manager",
    pageSubtitle: "Create isolated Codex desktop windows with separate provider configuration.",
    dashboardTitle: "Dashboard",
    dashboardSubtitle: "Shared announcements and runtime overview.",
    overviewTitle: "Overview",
    profileDetailTitle: "Profile Detail",
    profileDetailSubtitle: "Isolated config, launcher, and provider settings.",
    pickProfile: "Choose a profile from the sidebar to view details.",
    dashboardHint: "Running instances appear here. Open profile details from the sidebar.",
    runningProfiles: "Running",
    noRunningProfiles: "No profiles are currently running.",
    environmentIssues: "Environment Note",
    createProfile: "Create Profile",
    showRemoved: "Show removed",
    noProfiles: "No profiles yet.",
    refresh: "Refresh",
    refreshing: "Refreshing...",
    copyDiagnostics: "Copy Diagnostics",
    copied: "Copied",
    profiles: "Profiles",
    running: "Running",
    runtimeRunning: "Running",
    runtimeNotRunning: "Not running",
    runtimeUnknown: "Unknown",
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
    syncHistory: "Bring over existing chats",
    syncHistoryDesc: "Copy chats from the current app or existing profiles while keeping this profile independent.",
    syncHistorySource: "Sync from",
    syncHistoryDefaultSource: "Current Codex / ChatGPT",
    syncHistoryDefaultSourceDesc: "Copy project and temporary task chats from the source app.",
    syncHistoryProfileSourceDesc: "Copy existing chats from this profile.",
    syncHistoryNoProfiles: "No other profiles available yet.",
    syncHistorySelectedCount: "{count} sources selected",
    syncHistoryScope: "Which chats",
    syncHistoryProjects: "Projects only",
    syncHistoryTasks: "Tasks only",
    syncHistoryAll: "All chats",
    syncHistoryReview: "Chat history",
    syncHistoryOff: "Do not sync",
    syncHistorySourcesReview: "Chat sources",
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
    advancedInfo: "Advanced Info",
    advancedInfoDesc: "Paths, runtime status, and config backups.",
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
    updatePromptTitle: "Update available",
    updatePromptBody: "v{version} is ready to download and install in the app.",
    viewUpdate: "View Update",
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
  syncHistory: false,
  syncHistorySources: ["default"] as string[],
  syncHistoryScope: "projects" as "projects" | "tasks" | "all",
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
  const [dismissedUpdatePromptVersion, setDismissedUpdatePromptVersion] = useState<string | null>(null);
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const hasCheckedForUpdatesOnLaunch = useRef(false);

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
  const runningProfiles = useMemo(
    () => activeProfiles.filter((profile) => runtimeByProfileId.get(profile.id)?.status === "running"),
    [activeProfiles, runtimeByProfileId]
  );
  const environmentIssues = useMemo(
    () => environment?.checks.filter((check) => check.status !== "pass") ?? [],
    [environment]
  );

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

  useEffect(() => {
    if (hasCheckedForUpdatesOnLaunch.current) return;
    hasCheckedForUpdatesOnLaunch.current = true;
    void checkForUpdates({ openModal: false, silent: true });
  }, []);

  useEffect(() => window.codexProfileManager.onUpdateEvent((event) => {
    setUpdateEvent(event);
    if (event.state === "downloaded" || event.state === "error") {
      setIsUpdateModalOpen(true);
    }
  }), []);

  useEffect(() => {
    if (!toastMessage) return undefined;
    const timer = window.setTimeout(() => setToastMessage(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

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

  function showToast(nextMessage: string) {
    setToastMessage(nextMessage);
  }

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
    setToastMessage(null);

    try {
      const input: CreateProfileInput = {
        name: form.name,
        codexAppPath: form.codexAppPath || undefined,
        inheritDefaultConfig: form.inheritDefaultConfig,
        syncHistory: {
          enabled: form.syncHistory,
          scope: form.syncHistoryScope,
          sources: getHistorySyncSourceInput(form.syncHistorySources)
        },
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
      showToast(`Created ${result.profile.name}. Launcher: ${result.launcherPath}`);
      setForm({ ...DEFAULT_FORM, name: `${form.name} 2` });
      setProviderTest(null);
      setProviderModels(null);
      setWizardStep("profile");
      setIsCreateProfileOpen(false);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to create profile.");
    } finally {
      setIsCreating(false);
    }
  }

  async function testProvider() {
    setIsTestingProvider(true);
    setProviderTest(null);
    setToastMessage(null);

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
        summary: language === "zh" ? "连接测试失败" : "Provider test failed",
        details: error instanceof Error ? error.message : language === "zh" ? "未知连接测试错误。" : "Unknown provider test error.",
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
    setToastMessage(null);

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
        summary: language === "zh" ? "获取模型列表失败" : "Model list failed",
        details: error instanceof Error ? error.message : language === "zh" ? "未知模型列表错误。" : "Unknown model list error.",
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
        summary: language === "zh" ? "连接测试失败" : "Provider test failed",
        details: error instanceof Error ? error.message : language === "zh" ? "未知连接测试错误。" : "Unknown provider test error.",
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
        summary: language === "zh" ? "获取模型列表失败" : "Model list failed",
        details: error instanceof Error ? error.message : language === "zh" ? "未知模型列表错误。" : "Unknown model list error.",
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
      showToast(language === "zh"
        ? result.pid ? `已打开 ${selectedProfile.name}，进程号 ${result.pid}。` : `已打开 ${selectedProfile.name}。`
        : result.pid ? `Launched ${selectedProfile.name} with PID ${result.pid}.` : `Launched ${selectedProfile.name}.`);
      window.setTimeout(() => void refresh(), 1200);
    } catch (error) {
      showToast(error instanceof Error ? error.message : language === "zh" ? "打开失败。" : "Failed to open profile.");
    }
  }

  async function deleteSelectedProfile() {
    if (!selectedProfile) return;
    const confirmed = window.confirm(language === "zh"
      ? `要从列表中移除“${selectedProfile.name}”吗？本地文件会保留。`
      : `Remove "${selectedProfile.name}" from the dashboard? Profile files will be kept on disk.`);
    if (!confirmed) return;

    await window.codexProfileManager.deleteProfile(selectedProfile.id);
    setSelectedProfileId(null);
    setActiveView("dashboard");
    showToast(language === "zh" ? `已从列表中移除 ${selectedProfile.name}，本地文件已保留。` : `Removed ${selectedProfile.name} from the dashboard. Files were kept on disk.`);
    await refresh();
  }

  async function restoreSelectedProfile() {
    if (!selectedProfile) return;
    await window.codexProfileManager.restoreProfile(selectedProfile.id);
    showToast(language === "zh" ? `已恢复 ${selectedProfile.name}。` : `Restored ${selectedProfile.name}.`);
    await refresh();
  }

  async function permanentlyDeleteSelectedProfile() {
    if (!selectedProfile) return;
    const confirmed = window.confirm(t.permanentDeleteConfirm);
    if (!confirmed) return;

    await window.codexProfileManager.permanentlyDeleteProfile(selectedProfile.id);
    setSelectedProfileId(null);
    setActiveView("dashboard");
    showToast(t.permanentDeleteDone);
    await refresh();
  }

  async function saveSelectedProfile() {
    if (!selectedProfile) return;
    setIsUpdatingProfile(true);
    setToastMessage(null);

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
      showToast(language === "zh" ? `已保存 ${result.profile.name}，配置和启动器已更新。` : `Updated ${result.profile.name}. Config and launcher were regenerated.`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : language === "zh" ? "保存失败。" : "Failed to update profile.");
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
      showToast(t.diagnosticsCopied);
    } finally {
      setIsCopyingDiagnostics(false);
    }
  }

  async function checkForUpdates(options: { openModal?: boolean; silent?: boolean } = {}) {
    const shouldOpenModal = options.openModal ?? true;
    if (!options.silent) {
      setIsCheckingUpdates(true);
      setToastMessage(null);
    }
    try {
      const result = await window.codexProfileManager.checkForUpdates();
      setUpdateCheck(result);
      setUpdateEvent(null);
      if (result.status === "update_available" && shouldOpenModal && !isSkippedUpdate(result.latestVersion)) {
        setIsUpdateModalOpen(true);
      }
    } finally {
      if (!options.silent) {
        setIsCheckingUpdates(false);
      }
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
    setDismissedUpdatePromptVersion(null);
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
      setDismissedUpdatePromptVersion(updateCheck.latestVersion);
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
    showToast(language === "zh" ? "配置备份已恢复。重启该 Codex Profile 后生效。" : "Config backup restored. Restart this Codex profile for the restored config to take effect.");
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

        <div className="sidebar-section-header">
          <div className="sidebar-section-title">
            <span>{t.profilesSection}</span>
            <strong>{visibleProfiles.length}</strong>
          </div>
          <button aria-label={t.createProfile} className="icon-button compact sidebar-add-button" onClick={() => { setWizardStep("profile"); setIsCreateProfileOpen(true); }} title={t.createProfile} type="button">
            <Plus size={14} />
          </button>
        </div>
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
                <ProfileRow key={profile.id} profile={profile} selected={activeView === "profile" && selectedProfile?.id === profile.id} onSelect={() => { setActiveView("profile"); setSelectedProfileId(profile.id); }} />
              ))}
              {deletedProfiles.length > 0 ? (
                <div className="profile-group-separator">
                  <span>{t.removedProfiles}</span>
                </div>
              ) : null}
              {deletedProfiles.map((profile) => (
                <ProfileRow key={profile.id} profile={profile} selected={activeView === "profile" && selectedProfile?.id === profile.id} onSelect={() => { setActiveView("profile"); setSelectedProfileId(profile.id); }} />
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
              <p>{activeView === "dashboard" ? t.dashboardSubtitle : selectedProfile ? t.profileDetailSubtitle : t.pickProfile}</p>
            </div>
            {activeView === "dashboard" ? (
              <>
                <button className="button secondary" disabled={isRefreshing} onClick={() => void refresh()} type="button">
                  <RefreshCcw size={15} />
                  {isRefreshing ? t.refreshing : t.refresh}
                </button>
              </>
            ) : null}
          </header>
        ) : null}

        {activeView === "settings" ? (
          <SettingsPage
            appInfo={appInfo}
            isCheckingUpdates={isCheckingUpdates}
            language={language}
            settingsTab={settingsTab}
            t={t}
            updateCheck={updateCheck}
            onChangeLanguage={setLanguage}
            onCheckForUpdates={() => void checkForUpdates({ openModal: true })}
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
            {updateCheck?.status === "update_available" && updateCheck.latestVersion && !isSkippedUpdate(updateCheck.latestVersion) && dismissedUpdatePromptVersion !== updateCheck.latestVersion ? (
              <UpdatePromptBanner
                latestVersion={updateCheck.latestVersion}
                t={t}
                onDismiss={() => setDismissedUpdatePromptVersion(updateCheck.latestVersion)}
                onOpen={() => setIsUpdateModalOpen(true)}
              />
            ) : null}
            <section className="panel dashboard-panel">
              <div className="panel-heading">
                <div>
                  <h3>{t.overviewTitle}</h3>
                  <p>{t.dashboardHint}</p>
                </div>
              </div>
              <div className="dashboard-summary-grid">
                <div className="dashboard-summary-card">
                  <span className="status-kicker">{t.activeProfiles}</span>
                  <strong>{activeProfiles.length}</strong>
                </div>
                <div className="dashboard-summary-card">
                  <span className="status-kicker">{t.running}</span>
                  <strong>{runtimeStatuses.filter((runtime) => runtime.status === "running").length}</strong>
                </div>
              </div>
              {environmentIssues.length > 0 ? (
                <div className="dashboard-environment-actions">
                  <button className="dashboard-environment-note" onClick={() => setIsEnvironmentOpen(true)} type="button">
                    <TriangleAlert size={14} />
                    <span>{t.environmentIssues}</span>
                    <strong>{environmentIssues[0]?.label}</strong>
                    <small>{environmentIssues.length}</small>
                  </button>
                  <button className="button secondary compact" disabled={isCopyingDiagnostics} onClick={() => void copyDiagnosticsReport()} type="button">
                    <Copy size={14} />
                    {isCopyingDiagnostics ? t.copied : t.copyDiagnostics}
                  </button>
                </div>
              ) : null}
              {activeProfiles.length === 0 ? (
                <div className="empty-state compact-empty">
                  <div className="empty-mark"><Rocket size={22} /></div>
                  <h3>{t.noProfilesTitle}</h3>
                  <p>{t.noProfilesBody}</p>
                  <button className="button primary" onClick={() => { setWizardStep("profile"); setIsCreateProfileOpen(true); }} type="button">
                    <Plus size={15} />
                    {t.createProfile}
                  </button>
                </div>
              ) : (
                <div className="dashboard-lower-grid">
                  <section className="dashboard-subpanel">
                    <div className="dashboard-subpanel-heading">
                      <h4>{t.runningProfiles}</h4>
                      <span>{runningProfiles.length}</span>
                    </div>
                    {runningProfiles.length > 0 ? (
                      <div className="dashboard-compact-list">
                        {runningProfiles.slice(0, 3).map((profile) => (
                          <button className="dashboard-compact-row" key={profile.id} onClick={() => { setActiveView("profile"); setSelectedProfileId(profile.id); }} type="button">
                            <span>
                              <ProfileColorMark color={getProfileColor(profile)} />
                              <strong>{profile.name}</strong>
                            </span>
                            <RuntimeBadge runtime={runtimeByProfileId.get(profile.id)} t={t} />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="dashboard-empty-copy">{t.noRunningProfiles}</p>
                    )}
                  </section>
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
              <details className="advanced-details">
                <summary>
                  <span className="advanced-summary-icon"><ChevronRight size={15} /></span>
                  <span>
                    <strong>{t.advancedInfo}</strong>
                    <small>{t.advancedInfoDesc}</small>
                  </span>
                </summary>
                <div className="advanced-details-body">
                  <div className="advanced-path-list">
                    <PathRow icon={<Folder size={15} />} label="CODEX_HOME" onReveal={() => void revealPath(selectedProfile.paths.codexHome)} value={selectedProfile.paths.codexHome} />
                    <PathRow icon={<Folder size={15} />} label="user-data-dir" onReveal={() => void revealPath(selectedProfile.paths.userDataDir)} value={selectedProfile.paths.userDataDir} />
                    <PathRow icon={<Folder size={15} />} label="Launcher" onReveal={() => void revealPath(selectedProfile.paths.launcherPath)} value={selectedProfile.paths.launcherPath} />
                    <PathRow label="Provider" value={`${selectedProfile.provider.displayName} (${selectedProfile.provider.wireApi})`} />
                    <PathRow label="Base URL" value={selectedProfile.provider.baseUrl ?? "Official OpenAI"} />
                    <PathRow label="Env key" value={selectedProfile.provider.envKeyName} />
                    <PathRow label="Last launched" value={selectedProfile.launch.lastLaunchedAt ? new Date(selectedProfile.launch.lastLaunchedAt).toLocaleString() : t.never} />
                    <PathRow label="Runtime" value={runtimeStatuses.find((item) => item.profileId === selectedProfile.id)?.detail ?? t.notChecked} />
                  </div>
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
                </div>
              </details>
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
        <div className="modal-backdrop" role="presentation">
          <section aria-modal="true" className="modal create-profile-modal" role="dialog">
            <header className="modal-header">
              <div className="modal-title">
                <span className="modal-icon"><Info size={18} /></span>
                <div>
                  <h3>{t.createProfileTitle}</h3>
                  <p>{t.createProfileSubtitle}</p>
                </div>
              </div>
              <button aria-label="Close" className="icon-button" onClick={() => setIsCreateProfileOpen(false)} type="button">
                <X size={16} />
              </button>
            </header>
            <div className="create-modal-body">
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
                availableHistoryProfiles={activeProfiles}
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
            </div>
            <footer className="wizard-actions">
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
            </footer>
          </section>
        </div>
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
      {toastMessage ? (
        <div className="toast" role="status">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
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
          <ReleaseNotes content={updateCheck.changelog?.trim() || t.noReleaseNotes} />
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

function UpdatePromptBanner({
  latestVersion,
  onDismiss,
  onOpen,
  t
}: {
  latestVersion: string;
  onDismiss: () => void;
  onOpen: () => void;
  t: Record<string, string>;
}) {
  return (
    <section className="update-prompt-banner">
      <div className="update-prompt-main">
        <span className="update-prompt-icon">
          <Download size={14} />
        </span>
        <div>
          <strong>{t.updatePromptTitle}</strong>
          <p>{t.updatePromptBody.replace("{version}", latestVersion)}</p>
        </div>
      </div>
      <div className="update-prompt-actions">
        <button className="button primary compact" onClick={onOpen} type="button">
          <Download size={14} />
          {t.viewUpdate}
        </button>
        <button aria-label="Close" className="icon-button compact" onClick={onDismiss} type="button">
          <X size={14} />
        </button>
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
        <ReleaseNotes content={changelog} />
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

function ReleaseNotes({ content }: { content: string }) {
  return <div className="release-notes" dangerouslySetInnerHTML={{ __html: sanitizeReleaseNotes(content) }} />;
}

function sanitizeReleaseNotes(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) {
    return "";
  }

  if (!/[<][a-zA-Z][\s\S]*[>]/.test(trimmed)) {
    return escapeHtml(trimmed).replace(/\n/g, "<br>");
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(`<div>${trimmed}</div>`, "text/html");
  const allowedTags = new Set(["A", "B", "BLOCKQUOTE", "BR", "CODE", "EM", "H1", "H2", "H3", "H4", "H5", "H6", "HR", "I", "LI", "OL", "P", "PRE", "STRONG", "UL"]);
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
  const elements: Element[] = [];
  while (walker.nextNode()) {
    elements.push(walker.currentNode as Element);
  }

  for (const element of elements) {
    if (!allowedTags.has(element.tagName)) {
      element.replaceWith(...Array.from(element.childNodes));
      continue;
    }

    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      if (element.tagName === "A" && name === "href" && /^https?:\/\//i.test(attribute.value)) {
        element.setAttribute("target", "_blank");
        element.setAttribute("rel", "noreferrer");
        continue;
      }
      element.removeAttribute(attribute.name);
    }
  }

  return document.body.firstElementChild?.innerHTML ?? "";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
  availableHistoryProfiles,
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
  availableHistoryProfiles: ManagedProfile[];
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
        <label className="toggle-card">
          <input checked={form.syncHistory} onChange={(event) => onChange({ ...form, syncHistory: event.target.checked })} type="checkbox" />
          <span className="toggle-copy">
            <strong>{t.syncHistory}</strong>
            <small>{t.syncHistoryDesc}</small>
          </span>
          <span className="switch-track" aria-hidden="true"><span /></span>
        </label>
        {form.syncHistory ? (
          <HistorySyncOptions
            availableProfiles={availableHistoryProfiles}
            form={form}
            t={t}
            onChange={onChange}
          />
        ) : null}
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

  const historySourceSummary = getHistorySourceSummary(form, availableHistoryProfiles, t);

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
      <PathRow
        label={t.syncHistoryReview}
        value={form.syncHistory
          ? (form.syncHistoryScope === "projects" ? t.syncHistoryProjects : form.syncHistoryScope === "tasks" ? t.syncHistoryTasks : t.syncHistoryAll)
          : t.syncHistoryOff}
      />
      {form.syncHistory ? <PathRow label={t.syncHistorySourcesReview} value={historySourceSummary} /> : null}
      <PathRow label={t.providerTestReview} value={providerTest ? providerTest.summary : t.notTested} />
    </div>
  );
}

function HistorySyncOptions({
  availableProfiles,
  form,
  onChange,
  t
}: {
  availableProfiles: ManagedProfile[];
  form: typeof DEFAULT_FORM;
  onChange: (nextForm: typeof DEFAULT_FORM) => void;
  t: Record<string, string>;
}) {
  const selectedSources = form.syncHistorySources.length > 0 ? form.syncHistorySources : ["default"];
  const selectedCount = selectedSources.length;

  function toggleSource(sourceId: string) {
    const nextSources = selectedSources.includes(sourceId)
      ? selectedSources.filter((item) => item !== sourceId)
      : [...selectedSources, sourceId];
    onChange({ ...form, syncHistorySources: nextSources.length > 0 ? nextSources : ["default"] });
  }

  return (
    <div className="history-sync-panel">
      <div className="history-section">
        <div className="history-section-heading">
          <span>{t.syncHistorySource}</span>
          <small>{t.syncHistorySelectedCount.replace("{count}", String(selectedCount))}</small>
        </div>
        <div className="history-source-list">
          <HistorySourceOption
            checked={selectedSources.includes("default")}
            color="#2563eb"
            description={t.syncHistoryDefaultSourceDesc}
            title={t.syncHistoryDefaultSource}
            onToggle={() => toggleSource("default")}
          />
          {availableProfiles.length > 0 ? availableProfiles.map((profile) => (
            <HistorySourceOption
              checked={selectedSources.includes(profile.id)}
              color={getProfileColor(profile)}
              description={`${profile.provider.displayName} · ${t.syncHistoryProfileSourceDesc}`}
              key={profile.id}
              title={profile.name}
              onToggle={() => toggleSource(profile.id)}
            />
          )) : <p className="history-empty-note">{t.syncHistoryNoProfiles}</p>}
        </div>
      </div>
      <div className="history-scope-row">
        <span>{t.syncHistoryScope}</span>
        <div className="segmented-control">
          {([
            ["projects", t.syncHistoryProjects],
            ["tasks", t.syncHistoryTasks],
            ["all", t.syncHistoryAll]
          ] as const).map(([scope, label]) => (
            <button
              className={form.syncHistoryScope === scope ? "selected" : ""}
              key={scope}
              onClick={() => onChange({ ...form, syncHistoryScope: scope })}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function HistorySourceOption({
  checked,
  color,
  description,
  onToggle,
  title
}: {
  checked: boolean;
  color: string;
  description: string;
  onToggle: () => void;
  title: string;
}) {
  return (
    <button className={`history-source-option ${checked ? "selected" : ""}`} onClick={onToggle} type="button">
      <span className="profile-dot" style={{ background: color }} />
      <span className="history-source-copy">
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <span className="history-check" aria-hidden="true">
        {checked ? <CheckCircle2 size={16} /> : <Circle size={16} />}
      </span>
    </button>
  );
}

function getHistorySourceSummary(form: typeof DEFAULT_FORM, availableProfiles: ManagedProfile[], t: Record<string, string>): string {
  if (!form.syncHistory) {
    return t.syncHistoryOff;
  }

  const sourceNames = (form.syncHistorySources.length > 0 ? form.syncHistorySources : ["default"]).map((sourceId) => {
    if (sourceId === "default") {
      return t.syncHistoryDefaultSource;
    }
    return availableProfiles.find((profile) => profile.id === sourceId)?.name ?? sourceId;
  });
  return sourceNames.join(", ");
}

function getHistorySyncSourceInput(sourceIds: string[]): NonNullable<CreateProfileInput["syncHistory"]>["sources"] {
  const normalizedSourceIds = sourceIds.length > 0 ? sourceIds : ["default"];
  return normalizedSourceIds.map((sourceId) => sourceId === "default"
    ? { type: "default" }
    : { type: "profile", profileId: sourceId });
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

function RuntimeBadge({ runtime, t }: { runtime?: ProfileRuntimeInfo; t: Record<string, string> }) {
  const status = runtime?.status ?? "unknown";
  const label = status === "running" ? `${t.runtimeRunning}${runtime?.pid ? `：${runtime.pid}` : ""}` : status === "not_running" ? t.runtimeNotRunning : t.runtimeUnknown;
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

function ProfileRow({ onSelect, profile, selected }: { onSelect: () => void; profile: ManagedProfile; selected: boolean }) {
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

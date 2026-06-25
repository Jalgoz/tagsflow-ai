import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import type { LocalBackupValidationResult, ThemeMode, ValidatedLocalBackupData } from '../../domain'
import {
  useAIConfiguration,
  useAIModels,
  useClearAIProviderApiKey,
  useExportLocalBackup,
  useLoadDemoData,
  useOnboardingStatus,
  useReplaceLocalBackup,
  useResetLocalDataWithOnboarding,
  useSaveAIProviderSettings,
  useSaveTheme,
  useSettings,
  useTestAIConnection,
  useValidateLocalBackupImport,
} from '../../application'
import { ConfirmDialog, useToast } from '../feedback'

const formatBackupFilename = (): string => {
  const dateStamp = new Date().toISOString().slice(0, 10)
  return `tagsflow-ai-backup-${dateStamp}.json`
}

const downloadJson = (filename: string, data: unknown) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(objectUrl)
}

const mapValidationErrorMessage = (result: LocalBackupValidationResult): string => {
  if (result.success) {
    return ''
  }

  switch (result.code) {
    case 'malformed_json':
      return 'The selected file is not valid JSON.'
    case 'unsupported_version':
      return result.message
    case 'invalid_shape':
      return result.details.length === 0
        ? 'The selected backup does not match the supported TagsFlow AI data shape.'
        : `Invalid backup shape: ${result.details[0]}`
  }
}

const formatBackupSummary = (database: ValidatedLocalBackupData): string => {
  return `${database.projects.length} projects, ${database.tasks.length} tasks, ${database.subtasks.length} subtasks, ${database.members.length} members, and ${database.tags.length} tags.`
}

export const SettingsPage = () => {
  const { data: settings, error, isError, isLoading } = useSettings()
  const { data: aiConfiguration } = useAIConfiguration()
  const saveTheme = useSaveTheme()
  const saveAIProviderSettings = useSaveAIProviderSettings()
  const clearAIProviderApiKey = useClearAIProviderApiKey()
  const testAIConnection = useTestAIConnection()
  const exportBackup = useExportLocalBackup()
  const onboardingStatus = useOnboardingStatus()
  const validateBackupImport = useValidateLocalBackupImport()
  const replaceBackup = useReplaceLocalBackup()
  const loadDemoData = useLoadDemoData()
  const resetLocalData = useResetLocalDataWithOnboarding()
  const toast = useToast()

  const [importError, setImportError] = useState<string | null>(null)
  const [validatedImport, setValidatedImport] = useState<ValidatedLocalBackupData | null>(null)
  const [selectedImportFileName, setSelectedImportFileName] = useState<string | null>(null)
  const [isAISaveConfirmOpen, setIsAISaveConfirmOpen] = useState(false)
  const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false)
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false)
  const [isDemoDataReplaceConfirmOpen, setIsDemoDataReplaceConfirmOpen] = useState(false)
  const [selectedAIProviderDraft, setSelectedAIProviderDraft] = useState<'groq' | null>(null)
  const [selectedModelIdDraft, setSelectedModelIdDraft] = useState<string | null>(null)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [aiErrorMessage, setAIErrorMessage] = useState<string | null>(null)
  const importFileInputRef = useRef<HTMLInputElement | null>(null)

  const isMutating =
    saveTheme.isPending ||
    saveAIProviderSettings.isPending ||
    clearAIProviderApiKey.isPending ||
    testAIConnection.isPending ||
    exportBackup.isPending ||
    validateBackupImport.isPending ||
    replaceBackup.isPending ||
    loadDemoData.isPending ||
    resetLocalData.isPending

  const selectedTheme = settings?.theme ?? 'light'
  const hasSavedApiKey = aiConfiguration?.hasSavedApiKey ?? false
  const hasEffectiveApiKey = apiKeyInput.trim().length > 0 || hasSavedApiKey
  const detectedModels = useAIModels(apiKeyInput)
  const aiMutationIsPending = saveAIProviderSettings.isPending || clearAIProviderApiKey.isPending || testAIConnection.isPending
  const selectedAIProvider = selectedAIProviderDraft ?? settings?.aiProvider.provider ?? 'groq'
  const selectedModelIdInput = selectedModelIdDraft ?? settings?.aiProvider.selectedModelId ?? ''
  const modelErrorMessage = detectedModels.isError
    ? detectedModels.error instanceof Error
      ? detectedModels.error.message
      : 'Unable to load Groq models.'
    : null
  const visibleAIErrorMessage = aiErrorMessage ?? modelErrorMessage

  const importSummary = useMemo(() => {
    if (validatedImport === null) {
      return null
    }

    return formatBackupSummary(validatedImport)
  }, [validatedImport])

  const handleThemeChange = async (theme: ThemeMode) => {
    if (settings === undefined || settings.theme === theme) {
      return
    }

    await saveTheme.mutateAsync(theme)
    toast.success('Theme preference saved.')
  }

  const handleSaveAISettings = async () => {
    await saveAIProviderSettings.mutateAsync({
      provider: selectedAIProvider,
      apiKey: apiKeyInput,
      selectedModelId: selectedModelIdInput,
    })
    setIsAISaveConfirmOpen(false)
    setSelectedAIProviderDraft(null)
    setSelectedModelIdDraft(null)
    setApiKeyInput('')
    setAIErrorMessage(null)
    toast.success('AI provider settings saved.')
  }

  const handleClearAIKey = async () => {
    await clearAIProviderApiKey.mutateAsync()
    setSelectedAIProviderDraft(null)
    setSelectedModelIdDraft(null)
    setApiKeyInput('')
    setAIErrorMessage(null)
    toast.success('Groq API key cleared.')
  }

  const handleTestConnection = async () => {
    setAIErrorMessage(null)
    try {
      const result = await testAIConnection.mutateAsync(apiKeyInput)

      if (result.connected) {
        toast.success('Groq connection succeeded.')
        return
      }

      setAIErrorMessage(result.message)
      toast.error(result.message)
    } catch (connectionError) {
      const message = connectionError instanceof Error ? connectionError.message : 'Unable to test the Groq connection.'
      setAIErrorMessage(message)
      toast.error(message)
    }
  }

  const handleExport = async () => {
    const backupData = await exportBackup.mutateAsync()
    downloadJson(formatBackupFilename(), backupData)
    toast.success('Local backup exported.')
  }

  const clearImportState = () => {
    setImportError(null)
    setValidatedImport(null)
    setSelectedImportFileName(null)
    setIsImportConfirmOpen(false)
  }

  const clearImportSelection = () => {
    clearImportState()

    if (importFileInputRef.current !== null) {
      importFileInputRef.current.value = ''
    }
  }

  const handleImportFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    clearImportState()

    if (file === null) {
      return
    }

    setSelectedImportFileName(file.name)
    const fileText = await file.text()
    const validationResult = await validateBackupImport.mutateAsync(fileText)

    if (!validationResult.success) {
      setImportError(mapValidationErrorMessage(validationResult))
      return
    }

    setValidatedImport(validationResult.database)
  }

  const confirmImportReplacement = async () => {
    if (validatedImport === null) {
      return
    }

    await replaceBackup.mutateAsync(validatedImport)
    setIsImportConfirmOpen(false)
    clearImportSelection()
    toast.success('Local data replaced from backup.')
  }

  const confirmResetLocalData = async () => {
    await resetLocalData.mutateAsync()
    clearImportSelection()
    setIsResetConfirmOpen(false)
    toast.success('Local data reset to defaults.')
  }

  const executeDemoDataLoad = async () => {
    await loadDemoData.mutateAsync()
    setIsDemoDataReplaceConfirmOpen(false)
    toast.success('Demo workspace loaded as editable local data.')
  }

  const handleLoadDemoData = async () => {
    if (onboardingStatus.data?.hasBusinessData) {
      setIsDemoDataReplaceConfirmOpen(true)
      return
    }

    await executeDemoDataLoad()
  }

  return (
    <section className="project-workspace settings-page">
      <div className="project-workspace__header">
        <div>
          <p className="project-workspace__eyebrow">Settings</p>
          <h2 className="project-workspace__title">Application settings</h2>
          <p className="project-workspace__description">
            Manage appearance preferences and local backup operations for this browser workspace.
          </p>
        </div>
      </div>

      {isLoading ? <div className="project-state">Loading settings...</div> : null}

      {isError ? (
        <div className="project-state project-state--error">
          Unable to load settings.
          <span>{error instanceof Error ? error.message : 'Unknown error'}</span>
        </div>
      ) : null}

      {!isLoading && !isError ? (
        <div className="settings-page__sections">
          <section className="project-workspace__panel settings-page__section">
            <h3 className="settings-page__section-title">Appearance</h3>
            <p className="settings-page__section-description">Choose the active theme for the app shell and routed pages.</p>
            <fieldset className="settings-page__theme-group">
              <legend className="settings-page__label">Theme mode *</legend>
              <label className="settings-page__theme-option">
                <input
                  checked={selectedTheme === 'light'}
                  name="theme"
                  type="radio"
                  value="light"
                  onChange={() => {
                    void handleThemeChange('light')
                  }}
                />
                Light
              </label>
              <label className="settings-page__theme-option">
                <input
                  checked={selectedTheme === 'dark'}
                  name="theme"
                  type="radio"
                  value="dark"
                  onChange={() => {
                    void handleThemeChange('dark')
                  }}
                />
                Dark
              </label>
            </fieldset>
          </section>

          <section className="project-workspace__panel settings-page__section">
            <h3 className="settings-page__section-title">AI provider settings</h3>
            <p className="settings-page__section-description">
              Configure the local Groq integration, test the current connection, and store a selected model without exposing the saved API key.
            </p>
            <div className="settings-page__field-group">
              <label className="settings-page__label" htmlFor="settings-ai-provider">
                Provider *
              </label>
              <select
                className="project-form__input"
                disabled={aiMutationIsPending}
                id="settings-ai-provider"
                value={selectedAIProvider}
                onChange={(event) => setSelectedAIProviderDraft(event.target.value as 'groq')}
              >
                <option value="groq">Groq</option>
              </select>
            </div>
            <p className="settings-page__section-description">
              Status: <strong>{aiConfiguration?.isConfigured ? 'Configured' : 'Not configured'}</strong>
            </p>
            <div className="settings-page__field-group">
              <label className="settings-page__label" htmlFor="settings-ai-api-key">
                Groq API key *
              </label>
              {hasSavedApiKey ? <p className="settings-page__saved-indicator">API key already saved locally</p> : null}
              <input
                autoComplete="off"
                className="project-form__input"
                id="settings-ai-api-key"
                disabled={aiMutationIsPending}
                placeholder={hasSavedApiKey ? 'Saved locally. Enter a new key only if you want to replace it.' : 'Enter Groq API key'}
                type="password"
                value={apiKeyInput}
                onChange={(event) => setApiKeyInput(event.target.value)}
              />
              <p className="settings-page__section-description">
                {hasSavedApiKey ? 'Your current Groq API key is already stored. Leave this field empty to keep it, or paste a new key to replace it.' : 'No API key is saved yet.'}
              </p>
            </div>
            <div className="settings-page__field-group">
              <label className="settings-page__label" htmlFor="settings-ai-model">
                Selected model
              </label>
              <input
                className="project-form__input"
                id="settings-ai-model"
                list="settings-ai-model-options"
                disabled={aiMutationIsPending}
                placeholder="Enter a Groq model ID"
                type="text"
                value={selectedModelIdInput}
                onChange={(event) => setSelectedModelIdDraft(event.target.value)}
              />
              <datalist id="settings-ai-model-options">
                {(detectedModels.data ?? []).map((model) => (
                  <option key={model.id} value={model.id} />
                ))}
              </datalist>
              <p className="settings-page__section-description">
                {detectedModels.data === undefined || detectedModels.data.length === 0
                  ? 'Manual model entry remains available if Groq model listing is unavailable.'
                  : `Detected ${detectedModels.data.length} Groq models for the current key.`}
              </p>
            </div>
            {visibleAIErrorMessage !== null ? <p className="project-form__error">{visibleAIErrorMessage}</p> : null}
            <div className="settings-page__actions-row">
              <button
                className="project-workspace__action settings-page__action"
                disabled={aiMutationIsPending}
                type="button"
                onClick={() => setIsAISaveConfirmOpen(true)}
              >
                {saveAIProviderSettings.isPending ? 'Saving...' : 'Save AI settings'}
              </button>
              <button
                className="project-list__button project-list__button--secondary settings-page__action"
                disabled={!hasSavedApiKey || aiMutationIsPending}
                type="button"
                onClick={() => void handleClearAIKey()}
              >
                {clearAIProviderApiKey.isPending ? 'Clearing...' : 'Clear saved API key'}
              </button>
              <button
                className="project-list__button project-list__button--secondary settings-page__action"
                disabled={!hasEffectiveApiKey || aiMutationIsPending}
                type="button"
                onClick={() => void handleTestConnection()}
              >
                {testAIConnection.isPending ? 'Testing...' : 'Test connection'}
              </button>
              <button
                className="project-list__button project-list__button--secondary settings-page__action"
                disabled={!hasEffectiveApiKey || detectedModels.isFetching || aiMutationIsPending}
                type="button"
                onClick={() => {
                  setAIErrorMessage(null)
                  void detectedModels.refetch()
                }}
              >
                {detectedModels.isFetching ? 'Refreshing models...' : 'Refresh models'}
              </button>
            </div>
          </section>

          <section className="project-workspace__panel settings-page__section">
            <h3 className="settings-page__section-title">Local data backup</h3>
            <p className="settings-page__section-description">Download a sanitized JSON backup of local projects, tasks, members, tags, and settings.</p>
            <button className="project-workspace__action settings-page__action" disabled={isMutating} type="button" onClick={() => void handleExport()}>
              {exportBackup.isPending ? 'Exporting...' : 'Export local backup'}
            </button>
          </section>

          <section className="project-workspace__panel settings-page__section">
            <h3 className="settings-page__section-title">Demo workspace data</h3>
            <p className="settings-page__section-description">
              Load the "Development of a SaaS Frontend Platform" demo set as editable local records.
            </p>
            <button
              className="project-workspace__action settings-page__action"
              disabled={isMutating || onboardingStatus.isLoading}
              type="button"
              onClick={() => void handleLoadDemoData()}
            >
              {loadDemoData.isPending ? 'Loading demo data...' : 'Load demo data'}
            </button>
          </section>

          <section className="project-workspace__panel settings-page__section">
            <h3 className="settings-page__section-title">Import data</h3>
            <p className="settings-page__section-description">
              Importing replaces current local data only after validation and explicit confirmation.
            </p>
            <div className="settings-page__file-input-group">
              <label className="settings-page__label" htmlFor="settings-backup-file-input">
                Backup file *
              </label>
              <div className="settings-page__file-input-row">
                <input
                  ref={importFileInputRef}
                  aria-label="Backup file"
                  accept=".json,application/json"
                  className="settings-page__file-input-native"
                  id="settings-backup-file-input"
                  type="file"
                  onChange={(event) => void handleImportFileChange(event)}
                />
                <label className="settings-page__file-select-button" htmlFor="settings-backup-file-input">
                  Select file
                </label>
                <span className="settings-page__file-name">
                  {selectedImportFileName ?? 'No file selected'}
                </span>
                {selectedImportFileName !== null ? (
                  <button
                    aria-label="Clear selected backup file"
                    className="settings-page__file-clear-button"
                    type="button"
                    onClick={clearImportSelection}
                  >
                    X
                  </button>
                ) : null}
              </div>
            </div>

            {importError !== null ? <p className="project-form__error">{importError}</p> : null}

            {validatedImport !== null ? (
              <div className="settings-page__import-ready">
                <p className="settings-page__import-title">Valid backup ready</p>
                <p className="settings-page__import-details">
                  <strong>{selectedImportFileName ?? 'Selected file'}:</strong> {importSummary}
                </p>
                <button
                  className="project-list__button project-list__button--danger settings-page__action"
                  disabled={replaceBackup.isPending || resetLocalData.isPending}
                  type="button"
                  onClick={() => {
                    setIsImportConfirmOpen(true)
                  }}
                >
                  {replaceBackup.isPending ? 'Replacing...' : 'Replace local data from backup'}
                </button>
              </div>
            ) : null}
          </section>

          <section className="project-workspace__panel settings-page__section settings-page__section--danger">
            <h3 className="settings-page__section-title">Danger zone</h3>
            <p className="settings-page__section-description">
              Reset clears local projects, tasks, subtasks, members, tags, and settings from this browser.
            </p>
            <button
              className="project-list__button project-list__button--danger settings-page__action"
              disabled={isMutating}
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
            >
              Reset local data
            </button>
          </section>
        </div>
      ) : null}

      <ConfirmDialog
        confirmLabel="Save to local storage"
        description="These AI settings will be saved in this browser's local storage. If you are using a shared or temporary machine, clear the saved API key when you finish working to reduce the risk of exposing your Groq credentials."
        isOpen={isAISaveConfirmOpen}
        isPending={saveAIProviderSettings.isPending}
        pendingLabel="Saving AI settings..."
        title="Save AI settings to local storage?"
        onCancel={() => setIsAISaveConfirmOpen(false)}
        onConfirm={handleSaveAISettings}
      />

      <ConfirmDialog
        confirmLabel="Replace local data"
        description={
          validatedImport === null
            ? ''
            : 'Replace current local projects, tasks, subtasks, members, tags, and settings with the imported backup?'
        }
        isOpen={isImportConfirmOpen}
        isPending={replaceBackup.isPending}
        pendingLabel="Replacing data..."
        title="Replace local data from backup?"
        onCancel={() => setIsImportConfirmOpen(false)}
        onConfirm={confirmImportReplacement}
      />

      <ConfirmDialog
        confirmLabel="Replace with demo data"
        description="Replace current local projects, tasks, subtasks, members, and tags with editable demo data?"
        isOpen={isDemoDataReplaceConfirmOpen}
        isPending={loadDemoData.isPending}
        pendingLabel="Loading demo data..."
        title="Replace local data with demo workspace?"
        onCancel={() => setIsDemoDataReplaceConfirmOpen(false)}
        onConfirm={executeDemoDataLoad}
      />

      <ConfirmDialog
        confirmLabel="Reset local data"
        description="This clears local projects, tasks, subtasks, members, tags, and settings, then restores default empty data."
        isOpen={isResetConfirmOpen}
        isPending={resetLocalData.isPending}
        pendingLabel="Resetting data..."
        title="Reset local data?"
        onCancel={() => setIsResetConfirmOpen(false)}
        onConfirm={confirmResetLocalData}
      />
    </section>
  )
}
